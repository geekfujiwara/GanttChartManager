import { Geek_project_tasksService } from '@/generated/services/Geek_project_tasksService';
import { Geek_project_tasks } from '@/generated/models/Geek_project_tasksModel';
import { TaskCSVRow, csvRowToDataverseTask } from '@/utils/csvUtils';

export interface CSVOperationResult {
  success: boolean;
  message: string;
  processed: number;
  errors: string[];
  results?: {
    created: number;
    updated: number;
    deleted: number;
  };
}

export class TaskCSVService {
  /**
   * CSVデータからタスクの一括処理を実行
   */
  static async processCsvTasks(csvRows: TaskCSVRow[]): Promise<CSVOperationResult> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let deleted = 0;
    
    try {
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        const rowNumber = i + 2; // ヘッダー行を考慮（1行目はヘッダー）
        
        try {
          switch (row.operation?.toUpperCase()) {
            case 'CREATE':
              await this.createTask(row);
              created++;
              break;
              
            case 'UPDATE':
              if (!row.task_id) {
                errors.push(`行 ${rowNumber}: 更新操作にはタスクIDが必要です`);
                continue;
              }
              await this.updateTask(row);
              updated++;
              break;
              
            case 'DELETE':
              if (!row.task_id) {
                errors.push(`行 ${rowNumber}: 削除操作にはタスクIDが必要です`);
                continue;
              }
              await this.deleteTask(row.task_id);
              deleted++;
              break;
              
            default:
              // 操作が指定されていない場合は、IDの有無で判定
              if (row.task_id) {
                await this.updateTask(row);
                updated++;
              } else {
                await this.createTask(row);
                created++;
              }
              break;
          }
        } catch (error) {
          errors.push(`行 ${rowNumber}: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }
      
      const processed = created + updated + deleted;
      const success = errors.length === 0;
      
      let message = `処理完了: 作成 ${created}件, 更新 ${updated}件, 削除 ${deleted}件`;
      if (errors.length > 0) {
        message += ` (エラー ${errors.length}件)`;
      }
      
      return {
        success,
        message,
        processed,
        errors,
        results: { created, updated, deleted }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `CSV処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        processed: 0,
        errors: [error instanceof Error ? error.message : '不明なエラー']
      };
    }
  }
  
  /**
   * 新規タスク作成
   */
  private static async createTask(csvRow: TaskCSVRow): Promise<void> {
    // 必須項目チェック
    if (!csvRow.task_name) {
      throw new Error('タスク名は必須です');
    }
    
    if (!csvRow.project_id) {
      throw new Error('プロジェクトIDは必須です');
    }
    
    const taskData = csvRowToDataverseTask(csvRow) as Omit<Geek_project_tasks, 'geek_project_taskid'>;
    
    const result = await Geek_project_tasksService.create(taskData);
    
    if (!result.success) {
      throw new Error(`タスクの作成に失敗しました: ${result.error?.message || '不明なエラー'}`);
    }
  }
  
  /**
   * 既存タスク更新
   */
  private static async updateTask(csvRow: TaskCSVRow): Promise<void> {
    if (!csvRow.task_id) {
      throw new Error('更新にはタスクIDが必要です');
    }
    
    // まず既存タスクの存在確認
    try {
      const existingResult = await Geek_project_tasksService.get(csvRow.task_id);
      if (!existingResult.success) {
        throw new Error(`タスクID ${csvRow.task_id} が見つかりません`);
      }
    } catch (error) {
      throw new Error(`タスクID ${csvRow.task_id} の確認に失敗しました`);
    }
    
  const updates = csvRowToDataverseTask(csvRow);
  delete (updates as Record<string, unknown>)['geek_projectid@odata.bind'];
    const result = await Geek_project_tasksService.update(csvRow.task_id, updates);
    
    if (!result.success) {
      throw new Error(`タスクの更新に失敗しました: ${result.error?.message || '不明なエラー'}`);
    }
  }
  
  /**
   * タスク削除
   */
  private static async deleteTask(taskId: string): Promise<void> {
    try {
      // まず既存タスクの存在確認
      const existingResult = await Geek_project_tasksService.get(taskId);
      if (!existingResult.success) {
        throw new Error(`タスクID ${taskId} が見つかりません`);
      }
      
      await Geek_project_tasksService.delete(taskId);
    } catch (error) {
      throw new Error(`タスクの削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
  
  /**
   * プロジェクトのタスクをCSVエクスポート
   */
  static async exportProjectTasksToCSV(projectId: string): Promise<TaskCSVRow[]> {
    try {
      console.log('🔍 タスク取得開始 - プロジェクトID:', projectId);
      
      // プロジェクトのタスクを取得 (Lookupフィールドのフィルター)
      const result = await Geek_project_tasksService.getAll({
        filter: `_geek_projectid_value eq '${projectId}'`
      });
      
      console.log('📊 Dataverse結果:', result);
      
      if (!result.success || !result.data) {
        console.error('❌ タスク取得失敗:', result);
        throw new Error('タスクの取得に失敗しました');
      }
      
      console.log(`📝 取得タスク数: ${result.data.length}`);
      if (result.data.length > 0) {
        console.log('🔍 最初のタスクサンプル:', result.data[0]);
      }
      
      // Dataverse形式からCSV形式に変換
      const csvRows: TaskCSVRow[] = result.data.map((task: Geek_project_tasks, index) => {
        console.log(`🔄 タスク変換 ${index + 1}:`, task);
        const csvRow = this.dataverseTaskToCsvRow(task);
        console.log(`✅ CSV行 ${index + 1}:`, csvRow);
        return csvRow;
      });
      
      return csvRows;
    } catch (error) {
      console.error('❌ CSVエクスポートサービスエラー:', error);
      throw new Error(`CSVエクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
  
  /**
   * DataverseタスクをCSV行に変換
   */
  private static dataverseTaskToCsvRow(task: Geek_project_tasks): TaskCSVRow {
    try {
      console.log('🔄 タスク変換開始:', task.geek_name, 'ID:', task.geek_project_taskid);
      
      // Priority reverse mapping (Dataverse実際の値に基づく)
      const priorityReverseMapping: Record<string, string> = {
        '0': 'Low',      // 低
        '1': 'Medium',   // 中
        '2': 'High',     // 高
        '3': 'Critical'  // 緊急
      };
      
      // Status reverse mapping (Dataverse実際の値に基づく)
      const statusReverseMapping: Record<string, string> = {
        '0': 'Completed',   // 完了
        '1': 'InProgress',  // 進行中
        '2': 'NotStarted',  // 未開始
        '3': 'OnHold',      // 保留
        '4': 'Cancelled'    // キャンセル
      };
      
      // Category reverse mapping (Dataverse実際の値に基づく)
      const categoryReverseMapping: Record<string, string> = {
        '0': 'Planning',  // 計画
        '1': 'Setup',     // 設定
        '2': 'Migration', // 移行
        '3': 'Training',  // トレーニング
        '4': 'Testing',   // テスト
        '5': 'GoLive'     // 本稼働
      };
      
      console.log('🔍 変換前データ:', {
        priority: task.geek_priority,
        status: task.geek_status,
        category: task.geek_category,
        start: task.geek_start,
        end: task.geek_end
      });
      
      const formatDate = (value: unknown): string => {
        if (!value) return '';
        let date: Date | null = null;

        if (value instanceof Date) {
          date = value;
        } else if (typeof value === 'string' || typeof value === 'number') {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            date = parsed;
          }
        }

        if (!date) {
          return '';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };

      const projectId = task.geek_projectid || (task as any)?._geek_projectid_value || '';
      const assigneeId = task.geek_lookup_assignee || (task as any)?._geek_lookup_assignee_value || '';

      const getChoiceKey = (value: unknown, fallback: string): string => {
        if (value === null || value === undefined || value === '') {
          return fallback;
        }
        if (typeof value === 'number') {
          return value.toString();
        }
        if (typeof value === 'string') {
          return value;
        }
        return fallback;
      };

      const csvRow: TaskCSVRow = {
        task_id: task.geek_project_taskid,
        task_name: task.geek_name || '',
        project_id: projectId,
        description: task.geek_description || '',
        start_date: formatDate(task.geek_start),
        end_date: formatDate(task.geek_end),
        progress: task.geek_progress || 0,
        priority: priorityReverseMapping[getChoiceKey(task.geek_priority, '1')] || 'Medium',
        status: statusReverseMapping[getChoiceKey(task.geek_status, '2')] || 'NotStarted',
        category: categoryReverseMapping[getChoiceKey(task.geek_category, '0')] || 'Planning',
        assignee_id: assigneeId,
        operation: 'UPDATE'
      };
      
      console.log('✅ 変換後CSV行:', csvRow);
      return csvRow;
    } catch (error) {
      console.error('❌ タスク変換エラー:', error, 'タスク:', task);
      throw new Error(`タスク変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
  
  /**
   * CSVデータのバリデーション
   */
  static validateCsvData(csvRows: TaskCSVRow[]): string[] {
    const errors: string[] = [];
    
    csvRows.forEach((row, index) => {
  const rowNumber = index + 1; // プレビュー表示と同じ行番号を使用
      
      // 必須項目チェック
      if (!row.task_name || row.task_name.trim() === '') {
        errors.push(`行 ${rowNumber}: タスク名は必須です`);
      }
      
      if (!row.project_id || row.project_id.trim() === '') {
        errors.push(`行 ${rowNumber}: プロジェクトIDは必須です`);
      }
      
      // 日付形式チェック
      if (row.start_date && !this.isValidDate(row.start_date)) {
        errors.push(`行 ${rowNumber}: 開始日の形式が正しくありません (YYYYMMDD形式で入力してください)`);
      }
      
      if (row.end_date && !this.isValidDate(row.end_date)) {
        errors.push(`行 ${rowNumber}: 終了日の形式が正しくありません (YYYYMMDD形式で入力してください)`);
      }

      if (row.start_date && row.end_date && this.isValidDate(row.start_date) && this.isValidDate(row.end_date)) {
        const start = this.parseDate(row.start_date);
        const end = this.parseDate(row.end_date);
        if (start && end && start > end) {
          errors.push(`行 ${rowNumber}: 開始日は終了日以前の日付を入力してください`);
        }
      }
      
      // 進捗率の範囲チェック
      if (row.progress !== undefined && (row.progress < 0 || row.progress > 100)) {
        errors.push(`行 ${rowNumber}: 進捗率は0から100の範囲で入力してください`);
      }
      
      // 優先度の値チェック
      if (row.priority && !['Low', 'Medium', 'High', 'Critical'].includes(row.priority)) {
        errors.push(`行 ${rowNumber}: 優先度は Low, Medium, High, Critical のいずれかを入力してください`);
      }
      
      // ステータスの値チェック
      if (row.status && !['NotStarted', 'InProgress', 'Completed', 'OnHold', 'Cancelled'].includes(row.status)) {
        errors.push(`行 ${rowNumber}: ステータスは NotStarted, InProgress, Completed, OnHold, Cancelled のいずれかを入力してください`);
      }

      // カテゴリの値チェック
      if (row.category !== undefined) {
        const categoryValue = row.category.trim();
        if (categoryValue) {
          const validCategories = ['Planning', 'Setup', 'Migration', 'Training', 'Testing', 'GoLive'];
          const matchedCategory = validCategories.find(
            (valid) => valid.toLowerCase() === categoryValue.toLowerCase()
          );
          if (!matchedCategory) {
            errors.push(`行 ${rowNumber}: カテゴリは Planning, Setup, Migration, Training, Testing, GoLive のいずれかを入力してください`);
          }
        } else {
          errors.push(`行 ${rowNumber}: カテゴリは空白では設定できません。`);
        }
      }
      
      // 操作タイプの値チェック
      if (row.operation && !['CREATE', 'UPDATE', 'DELETE'].includes(row.operation)) {
        errors.push(`行 ${rowNumber}: 操作は CREATE, UPDATE, DELETE のいずれかを入力してください`);
      }
      
      // 操作タイプと必須項目の整合性チェック
      if (row.operation === 'UPDATE' || row.operation === 'DELETE') {
        if (!row.task_id || row.task_id.trim() === '') {
          errors.push(`行 ${rowNumber}: ${row.operation}操作にはタスクIDが必要です`);
        }
      }
    });
    
    return errors;
  }
  
  /**
   * 日付形式の妥当性チェック
   */
  private static isValidDate(dateString: string): boolean {
    const match = dateString.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) return false;

    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return false;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    const date = new Date(year, month - 1, day);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  private static parseDate(dateString: string): Date | null {
    if (!this.isValidDate(dateString)) {
      return null;
    }
    const year = Number(dateString.slice(0, 4));
    const month = Number(dateString.slice(4, 6));
    const day = Number(dateString.slice(6, 8));
    return new Date(year, month - 1, day);
  }
}