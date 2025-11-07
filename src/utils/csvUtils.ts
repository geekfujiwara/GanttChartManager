import { Geek_project_tasks } from '@/generated/models/Geek_project_tasksModel';
import {
  PriorityChoiceMap,
  TaskStatusChoiceMap,
  CategoryChoiceMap,
  PriorityChoiceReverseMap,
  TaskStatusChoiceReverseMap,
  CategoryChoiceReverseMap
} from '@/utils/dataverseChoiceMapping';

// CSVテンプレート用の型定義
export interface TaskCSVRow {
  task_id?: string;           // 更新・削除用ID (新規作成時は空)
  task_name: string;          // タスク名 (必須)
  project_id: string;         // プロジェクトID (必須)
  description?: string;       // 説明
  start_date?: string;        // 開始日 (YYYYMMDD)
  end_date?: string;          // 終了日 (YYYYMMDD)
  progress?: number;          // 進捗率 (0-100)
  priority?: string;          // 優先度 (Low, Medium, High, Critical)
  status?: string;            // ステータス (NotStarted, InProgress, Completed, OnHold, Cancelled)
  category?: string;          // カテゴリ (Planning, Setup, Migration, Training, Testing, GoLive)
  assignee_id?: string;       // 担当者ID
  operation?: 'CREATE' | 'UPDATE' | 'DELETE'; // 操作タイプ
}

// CSVヘッダー定義
export const CSV_HEADERS: (keyof TaskCSVRow)[] = [
  'task_id',
  'task_name', 
  'project_id',
  'description',
  'start_date',
  'end_date',
  'progress',
  'priority',
  'status',
  'category',
  'assignee_id',
  'operation'
];

// CSVヘッダーの英語表示名
export const CSV_HEADER_LABELS_EN: Record<keyof TaskCSVRow, string> = {
  task_id: 'Task ID',
  task_name: 'Task Name',
  project_id: 'Project ID', 
  description: 'Description',
  start_date: 'Start Date',
  end_date: 'End Date',
  progress: 'Progress (%)',
  priority: 'Priority',
  status: 'Status',
  category: 'Category',
  assignee_id: 'Assignee ID',
  operation: 'Operation'
};

// 英語ヘッダー版
export const CSV_HEADERS_EN = CSV_HEADERS.map(header => CSV_HEADER_LABELS_EN[header]);

// CSVテンプレートデータ生成
export function generateCSVTemplate(projectId?: string): TaskCSVRow[] {
  const actualProjectId = projectId || 'PROJECT_ID_HERE';
  
  return [
    {
      task_id: '',
      task_name: 'Sample Task 1 - Planning',
      project_id: actualProjectId,
      description: 'Example task for Planning phase',
  start_date: '20250101',
  end_date: '20250105',
      progress: 0,
      priority: 'Medium',
      status: 'NotStarted',
      category: 'Planning',
      assignee_id: '',
      operation: 'CREATE'
    },
    {
      task_id: '',
      task_name: 'Sample Task 2 - Setup',
      project_id: actualProjectId,
      description: 'Example task for Setup phase',
  start_date: '20250106',
  end_date: '20250112',
      progress: 20,
      priority: 'High',
      status: 'InProgress',
      category: 'Setup',
      assignee_id: '',
      operation: 'CREATE'
    },
    {
      task_id: '',
      task_name: 'Sample Task 3 - Migration',
      project_id: actualProjectId,
      description: 'Example task for Migration phase',
  start_date: '20250113',
  end_date: '20250120',
      progress: 100,
      priority: 'Critical',
      status: 'Completed',
      category: 'Migration',
      assignee_id: '',
      operation: 'CREATE'
    },
    {
      task_id: 'EXISTING_TASK_ID_1',
      task_name: 'Sample Task 4 - Training Update',
      project_id: actualProjectId,
      description: 'Update example for Training phase task',
  start_date: '20250121',
  end_date: '20250125',
      progress: 40,
      priority: 'Medium',
      status: 'OnHold',
      category: 'Training',
      assignee_id: '',
      operation: 'UPDATE'
    },
    {
      task_id: 'EXISTING_TASK_ID_2',
      task_name: 'Sample Task 5 - Testing Update',
      project_id: actualProjectId,
      description: 'Update example showing cancellation',
  start_date: '20250126',
  end_date: '20250202',
      progress: 0,
      priority: 'Low',
      status: 'Cancelled',
      category: 'Testing',
      assignee_id: '',
      operation: 'UPDATE'
    },
    {
      task_id: 'DELETE_TASK_ID',
      task_name: 'Sample Task 6 - GoLive Delete',
      project_id: actualProjectId,
      description: 'Delete example for GoLive task',
  start_date: '20250203',
  end_date: '20250205',
      progress: 10,
      priority: 'Medium',
      status: 'Completed',
      category: 'GoLive',
      assignee_id: '',
      operation: 'DELETE'
    }
  ];
}

// CSVを文字列に変換
export function convertToCSVString(data: TaskCSVRow[]): string {
  const headers = CSV_HEADERS_EN;
  
  // パラメータ説明のコメント行
  const parameterComments = [
    '# Task Management CSV Template',
    '# Priority options: Low, Medium, High, Critical',
    '# Status options: NotStarted, InProgress, Completed, OnHold, Cancelled',
    '# Category options: Planning, Setup, Migration, Training, Testing, GoLive',
    '# Operation options: CREATE (new task), UPDATE (existing task), DELETE (remove task)',
  '# Date format: YYYYMMDD',
    '# Progress: 0-100 (percentage)',
    '#'
  ];
  
  const csvContent = [
    ...parameterComments,
    headers.join(','),
    ...data.map(row => 
      CSV_HEADERS.map(header => {
        const value = row[header];
        // カンマや改行を含む値をクォートで囲む
        if (value && typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// BOM付きCSVファイルダウンロード用共通関数 (Shift-JIS環境対応)
export function downloadCSVWithBOM(csvContent: string, filename: string): void {
  // UTF-8 BOM (0xEF, 0xBB, 0xBF) を追加してShift-JIS環境での文字化けを防止
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// CSVファイルをダウンロード (BOM付きUTF-8でShift-JIS環境対応)
export function downloadCSVTemplate(filename: string = 'project_tasks_template.csv', projectId?: string): void {
  const templateData = generateCSVTemplate(projectId);
  const csvString = convertToCSVString(templateData);
  downloadCSVWithBOM(csvString, filename);
}

// CSVファイルを解析
export function parseCSVFile(file: File): Promise<TaskCSVRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n')
          .filter(line => line.trim())
          .filter(line => !line.startsWith('#')); // コメント行をスキップ
        
        if (lines.length < 2) {
          reject(new Error('CSVファイルにデータが含まれていません'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1);
        
        const tasks: TaskCSVRow[] = dataRows.map((line) => {
          const values = parseCSVLine(line);
          const task: any = {};
          
          // ヘッダーマッピング（英語ヘッダー対応）
          headers.forEach((header, i) => {
            const englishKey = Object.entries(CSV_HEADER_LABELS_EN).find(
              ([_, enLabel]) => enLabel === header
            )?.[0];
            
            if (englishKey && values[i] !== undefined) {
              const value = values[i].trim();
              
              // データ型変換
              if (englishKey === 'progress') {
                task[englishKey] = value ? Number(value) : undefined;
              } else if (englishKey === 'start_date' || englishKey === 'end_date') {
                task[englishKey] = value || undefined;
              } else {
                task[englishKey] = value || undefined;
              }
            }
          });
          
          return task as TaskCSVRow;
        });
        
        resolve(tasks);
      } catch (error) {
        reject(new Error(`CSVファイルの解析に失敗しました: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み取りに失敗しました'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}

// CSV行を解析（クォート対応）
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current);
  return result;
}

// TaskCSVRow を Dataverse形式に変換
export function csvRowToDataverseTask(csvRow: TaskCSVRow): Partial<Geek_project_tasks> {
  const task: Partial<Geek_project_tasks> = {};
  const parseDateValue = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    if (!/^\d{8}$/.test(digitsOnly)) {
      return undefined;
    }

    const year = Number(digitsOnly.slice(0, 4));
    const month = Number(digitsOnly.slice(4, 6));
    const day = Number(digitsOnly.slice(6, 8));

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return undefined;
    }

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return undefined;
    }

    return date;
  };
  const computeDuration = (start?: Date, end?: Date): number | undefined => {
    if (!start || !end) return undefined;
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = endUtc - startUtc;
    if (diffMs < 0) return undefined;
    return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  };
  
  if (csvRow.task_name) {
    task.geek_name = csvRow.task_name;
  }
  
  if (csvRow.project_id) {
    (task as Record<string, unknown>)['geek_projectid@odata.bind'] = `/geek_projecrts(${csvRow.project_id})`;
  }
  
  if (csvRow.description) {
    task.geek_description = csvRow.description;
  }
  
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (csvRow.start_date) {
    startDate = parseDateValue(csvRow.start_date);
    if (startDate) {
      task.geek_start = startDate;
    }
  }
  
  if (csvRow.end_date) {
    endDate = parseDateValue(csvRow.end_date);
    if (endDate) {
      task.geek_end = endDate;
    }
  }
  
  const calculatedDuration = computeDuration(startDate, endDate);
  if (calculatedDuration !== undefined) {
    task.geek_duration = calculatedDuration;
  }
  
  if (csvRow.progress !== undefined) {
    task.geek_progress = csvRow.progress;
  }
  
  const getChoiceValue = <T extends Record<string, number>>(map: T, value?: string, fallback?: number): string | undefined => {
    if (!value && fallback === undefined) return undefined;
    const mapped = value ? map[value as keyof T] : undefined;
    const finalValue = mapped !== undefined ? mapped : fallback;
    return finalValue !== undefined ? finalValue.toString() : undefined;
  };

  const priorityChoice = getChoiceValue(PriorityChoiceMap, csvRow.priority, PriorityChoiceMap.Medium);
  if (priorityChoice !== undefined) {
    task.geek_priority = priorityChoice;
  }
  
  const statusChoice = getChoiceValue(TaskStatusChoiceMap, csvRow.status, TaskStatusChoiceMap.NotStarted);
  if (statusChoice !== undefined) {
    task.geek_status = statusChoice;
  }
  
  const categoryChoice = getChoiceValue(CategoryChoiceMap, csvRow.category, CategoryChoiceMap.Planning);
  if (categoryChoice !== undefined) {
    task.geek_category = categoryChoice;
  }
  
  if (csvRow.assignee_id) {
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (guidRegex.test(csvRow.assignee_id)) {
      (task as Record<string, unknown>)['geek_lookup_assignee@odata.bind'] = `/systemusers(${csvRow.assignee_id})`;
    }
  }
  
  return task;
}

// DataverseタスクをcsvRowに変換（エクスポート用）
export function dataverseTaskToCsvRow(task: Geek_project_tasks): TaskCSVRow {
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

  const getReverseValue = <T extends Record<number, string>>(map: T, value: unknown, fallbackKey: number): string => {
    const typedMap: Record<number, string> = map;
    if (value === null || value === undefined || value === '') {
      return typedMap[fallbackKey];
    }
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numericValue)) {
      return typedMap[fallbackKey];
    }
    return Object.prototype.hasOwnProperty.call(typedMap, numericValue)
      ? typedMap[numericValue]
      : typedMap[fallbackKey];
  };

  return {
    task_id: task.geek_project_taskid,
    task_name: task.geek_name || '',
    project_id: task.geek_projectid || (task as any)?._geek_projectid_value || '',
    description: task.geek_description || '',
    start_date: formatDate(task.geek_start),
    end_date: formatDate(task.geek_end),
    progress: task.geek_progress || 0,
    priority: getReverseValue(PriorityChoiceReverseMap, task.geek_priority, PriorityChoiceMap.Medium),
    status: getReverseValue(TaskStatusChoiceReverseMap, task.geek_status, TaskStatusChoiceMap.NotStarted),
    category: getReverseValue(CategoryChoiceReverseMap, task.geek_category, CategoryChoiceMap.Planning),
    assignee_id: task.geek_lookup_assignee || (task as any)?._geek_lookup_assignee_value || '',
    operation: 'UPDATE'
  };
}