/**
 * Dataverseプロジェクト管理フック
 * GitHub CodeAppsDevelopmentStandard準拠
 * 
 * 生成されたGeek_projecrtsServiceとGeek_project_tasksServiceを使用して
 * プロジェクトとタスクのCRUD操作を提供
 */

import { useState, useEffect, useCallback } from 'react';
import { Geek_projecrtsService } from '@/generated/services/Geek_projecrtsService';
import { Geek_project_tasksService } from '@/generated/services/Geek_project_tasksService';
import type { Geek_projecrts } from '@/generated/models/Geek_projecrtsModel';
import type { Geek_project_tasks } from '@/generated/models/Geek_project_tasksModel';
import type { Project, Task } from '@/data/sampleProjects';
import { usePowerApps } from '@/PowerProvider';
import {
  PriorityChoiceMap,
  CategoryChoiceMap,
  TaskStatusChoiceMap,
  ProjectStatusChoiceMap,
  convertFromDataverseChoice,
  convertToDataverseChoice,
  PriorityChoiceReverseMap,
  CategoryChoiceReverseMap,
  TaskStatusChoiceReverseMap,
  ProjectStatusChoiceReverseMap
} from '@/utils/dataverseChoiceMapping';

/**
 * Power Apps環境の検出
 */
const isPowerAppsEnvironment = (): boolean => {
  return typeof window !== 'undefined' && (
    window.location.hostname.includes('apps.powerapps.com') ||
    window.location.hostname.includes('make.powerapps.com') ||
    window.location.hostname.includes('create.powerapps.com') ||
    process.env.NODE_ENV === 'production'
  );
};

/**
 * Dataverseプロジェクトを標準プロジェクト型に変換
 * Dataverseの選択肢フィールド(整数)を文字列に変換
 * プロジェクトマネージャー情報: Lookupフィールドから取得
 */
const convertDataverseToProject = (
  dvProject: Geek_projecrts,
  tasks: Geek_project_tasks[]
): Project => {
  // プロジェクトマネージャー情報の取得
  let managerId: string | undefined = undefined;
  let managerName: string = '';
  
  // @ts-ignore - 展開されたナビゲーションプロパティ
  const expandedManager = dvProject.geek_project_manager;
  
  if (expandedManager && typeof expandedManager === 'object') {
    // $expand で展開された場合
    // @ts-ignore
    managerId = expandedManager.systemuserid;
    // @ts-ignore
    managerName = expandedManager.fullname || '';
    console.log('👤 Expanded project manager:', { managerId, managerName });
  } else if ((dvProject as any)._geek_project_manager_value) {
    // _value プロパティから取得
    managerId = (dvProject as any)._geek_project_manager_value;
    // @ts-ignore - FormattedValue
    managerName = dvProject['_geek_project_manager_value@OData.Community.Display.V1.FormattedValue'] || '';
    console.log('👤 Lookup value project manager:', { managerId, managerName });
  }
  
  return {
    id: dvProject.geek_projecrtid,
    name: dvProject.geek_name || '',
    description: dvProject.geek_description || '',
    start: dvProject.geek_start ? new Date(dvProject.geek_start) : new Date(),
    end: dvProject.geek_end ? new Date(dvProject.geek_end) : new Date(),
    manager: managerName,
    managerId: managerId,
    // Dataverseの整数値を文字列に変換（フォールバックとして*nameフィールドも確認）
    status: convertFromDataverseChoice(dvProject.geek_status, ProjectStatusChoiceReverseMap) || (dvProject.geek_statusname as Project['status']) || 'Planning',
    tasks: tasks.map(convertDataverseToTask)
  };
};

/**
 * Dataverseタスクを標準タスク型に変換
 * Dataverseの選択肢フィールド(整数)を文字列に変換
 * 担当者情報: Lookupフィールドから取得（_value または展開されたオブジェクト）
 */
const convertDataverseToTask = (dvTask: Geek_project_tasks): Task => {
  // 担当者情報の取得
  // 1. _geek_lookup_assignee_value (GUID)
  // 2. geek_lookup_assignee (展開されたSystemUserオブジェクト)
  // 3. _geek_lookup_assignee_value@OData.Community.Display.V1.FormattedValue (表示名)
  let assigneeId: string | undefined = undefined;
  let assigneeName: string = '';
  
  // @ts-ignore - 展開されたナビゲーションプロパティ
  const expandedAssignee = dvTask.geek_lookup_assignee;
  
  if (expandedAssignee && typeof expandedAssignee === 'object') {
    // $expand で展開された場合
    // @ts-ignore
    assigneeId = expandedAssignee.systemuserid;
    // @ts-ignore
    assigneeName = expandedAssignee.fullname || '';
    console.log('👤 Expanded assignee:', { assigneeId, assigneeName });
  } else if ((dvTask as any)._geek_lookup_assignee_value) {
    // _value プロパティから取得
    assigneeId = (dvTask as any)._geek_lookup_assignee_value;
    // @ts-ignore - FormattedValue
    assigneeName = dvTask['_geek_lookup_assignee_value@OData.Community.Display.V1.FormattedValue'] || '';
    console.log('👤 Lookup value assignee:', { assigneeId, assigneeName });
  }
  
  return {
    id: dvTask.geek_project_taskid,
    name: dvTask.geek_name || '',
    start: dvTask.geek_start ? new Date(dvTask.geek_start) : new Date(),
    end: dvTask.geek_end ? new Date(dvTask.geek_end) : new Date(),
    duration: parseInt(String(dvTask.geek_duration || 0), 10),
    progress: parseInt(String(dvTask.geek_progress || 0), 10),
    dependencies: [], // 依存関係は別途管理が必要な場合は拡張
    // 担当者情報: 展開されたオブジェクトまたは_valueプロパティから取得
    assignee: assigneeName,
    assigneeId: assigneeId,
    // Dataverseの整数値を文字列に変換（フォールバックとして*nameフィールドも確認）
    priority: convertFromDataverseChoice(dvTask.geek_priority, PriorityChoiceReverseMap) || (dvTask.geek_priorityname as Task['priority']) || 'Medium',
    category: convertFromDataverseChoice(dvTask.geek_category, CategoryChoiceReverseMap) || (dvTask.geek_categoryname as Task['category']) || 'Planning',
    description: dvTask.geek_description,
    status: (() => {
      // 🔍 ステータス変換のデバッグ
      const rawStatus = dvTask.geek_status;
      const statusName = dvTask.geek_statusname;
      const converted = convertFromDataverseChoice(rawStatus, TaskStatusChoiceReverseMap);
      
      console.log(`🔍 Task "${dvTask.geek_name}" status conversion:`, {
        rawStatus,
        rawStatusType: typeof rawStatus,
        statusName,
        converted,
        convertedType: typeof converted,
        fallback: statusName || 'NotStarted'
      });
      
      return converted || (statusName as Task['status']) || 'NotStarted';
    })()
  };
};

/**
 * 標準プロジェクト型をDataverseプロジェクトに変換
 * システムフィールド(ownerid等)は除外 - Dataverseが自動設定
 * 選択肢フィールド(文字列)を整数値に変換
 * Lookupフィールド(geek_project_manager)は@odata.bind構文で設定
 */
const convertProjectToDataverse = (
  project: Partial<Project>
): any => {
  const dvProject: any = {
    geek_name: project.name,
    geek_description: project.description,
    geek_start: project.start,
    geek_end: project.end,
    // 文字列を整数値に変換（Dataverseの選択肢フィールド）
    geek_status: convertToDataverseChoice(project.status, ProjectStatusChoiceMap)
    // システムフィールド(ownerid, createdbyyominame等)は除外
    // Dataverseが自動的に設定する
  };
  
  // プロジェクトマネージャーのLookup設定
  if (project.managerId) {
    dvProject['geek_project_manager@odata.bind'] = `/systemusers(${project.managerId})`;
    console.log('👤 Setting project manager lookup:', {
      managerId: project.managerId,
      manager: project.manager
    });
  }
  
  return dvProject;
};

/**
 * 標準タスク型をDataverseタスクに変換
 */
/**
 * 標準タスク型をDataverseタスクに変換
 * システムフィールド(ownerid等)は除外 - Dataverseが自動設定
 * 選択肢フィールド(文字列)を整数値に変換
 * Lookupフィールド(geek_projectid)は@odata.bind構文で設定
 */
const convertTaskToDataverse = (
  task: Partial<Task>,
  projectId: string
): any => {
  console.log('🔧 convertTaskToDataverse called:', {
    taskName: task.name,
    assignee: task.assignee,
    assigneeId: task.assigneeId,
    projectId
  });
  
  // 選択肢フィールドの変換をログに出力
  const priorityValue = convertToDataverseChoice(task.priority, PriorityChoiceMap);
  const categoryValue = convertToDataverseChoice(task.category, CategoryChoiceMap);
  const statusValue = convertToDataverseChoice(task.status, TaskStatusChoiceMap);
  
  console.log('🔄 Choice field conversion:', {
    priority: { input: task.priority, output: priorityValue, type: typeof priorityValue },
    category: { input: task.category, output: categoryValue, type: typeof categoryValue },
    status: { input: task.status, output: statusValue, type: typeof statusValue }
  });
  
  // Dataverseのタスクオブジェクト
  // Lookupフィールドは@odata.bind構文を使用（CodeAppsDevelopmentStandard準拠）
  const dataverseTask: any = {
    geek_name: task.name,
    geek_description: task.description,
    geek_start: task.start,
    geek_end: task.end,
    geek_duration: task.duration,
    geek_progress: task.progress,
    // 文字列を整数値に変換（Dataverseの選択肢フィールド）
    geek_priority: priorityValue,
    geek_category: categoryValue,
    geek_status: statusValue,
    // Lookupフィールド: @odata.bind構文でプロジェクトを参照
    // https://learn.microsoft.com/ja-jp/power-apps/developer/data-platform/webapi/associate-disassociate-entities-using-web-api
    'geek_projectid@odata.bind': `/geek_projecrts(${projectId})`
  };
  
  console.log('📋 Dataverse task (safe log):', {
    geek_name: dataverseTask.geek_name,
    geek_priority: dataverseTask.geek_priority,
    geek_category: dataverseTask.geek_category,
    geek_status: dataverseTask.geek_status,
    geek_progress: dataverseTask.geek_progress
  });

  // 担当者が指定されている場合、Lookupフィールドに設定
  // task.assigneeId は SystemUser の systemuserid (GUID)
  if (task.assigneeId && task.assigneeId.length > 0) {
    // GUIDのバリデーション（形式チェック）
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (guidRegex.test(task.assigneeId)) {
      dataverseTask['geek_lookup_assignee@odata.bind'] = `/systemusers(${task.assigneeId})`;
      console.log('👤 Assignee lookup set:', {
        assigneeId: task.assigneeId,
        assigneeName: task.assignee,
        odataBind: `/systemusers(${task.assigneeId})`
      });
    } else {
      console.warn('⚠️ Invalid GUID format for assigneeId:', task.assigneeId);
    }
  } else {
    console.log('ℹ️ No assignee specified');
  }
  
  console.log('📝 Converted Dataverse task (final safe log):', {
    geek_name: dataverseTask.geek_name,
    geek_priority: dataverseTask.geek_priority,
    geek_category: dataverseTask.geek_category,
    geek_status: dataverseTask.geek_status,
    hasAssigneeBind: 'geek_lookup_assignee@odata.bind' in dataverseTask,
    assigneeBind: dataverseTask['geek_lookup_assignee@odata.bind']
  });
  
  return dataverseTask;
};

/**
 * Dataverseプロジェクト管理フック
 */
export const useDataverseProjects = () => {
  const { isInitialized: powerAppsInitialized } = usePowerApps();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // プロジェクト一覧の取得
  const fetchProjects = useCallback(async () => {
    const isPowerApps = isPowerAppsEnvironment();
    console.log('🔍 Dataverse fetchProjects called:', {
      isPowerApps,
      powerAppsInitialized,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined',
      nodeEnv: process.env.NODE_ENV
    });

    if (!isPowerApps) {
      console.log('⚠️ Development mode - Dataverse not available');
      setLoading(false);
      return;
    }

    if (!powerAppsInitialized) {
      console.log('⏳ Waiting for Power Apps SDK to initialize...');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching projects from Dataverse...');
      console.log('🔍 Dataverse environment check:', {
        dataSourcesInfo: typeof window !== 'undefined' ? 'available' : 'unavailable',
        serviceType: typeof Geek_projecrtsService,
        getAllMethod: typeof Geek_projecrtsService.getAll
      });

      // プロジェクト一覧を取得
      console.log('📡 Calling Geek_projecrtsService.getAll()...');
      const projectsResult = await Geek_projecrtsService.getAll();
      
      console.log('📦 Dataverse getAll result:', {
        success: projectsResult.success,
        hasData: !!projectsResult.data,
        dataLength: projectsResult.data?.length,
        error: projectsResult.error,
        fullResult: projectsResult
      });
      
      if (!projectsResult.success) {
        const errorMsg = `Dataverse API call failed: ${projectsResult.error || 'Unknown error'}`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      if (!projectsResult.data) {
        console.warn('⚠️ No data returned from Dataverse (null/undefined)');
        // データがない場合は空配列として扱う
        setProjects([]);
        console.log('✅ No projects found in Dataverse');
        return;
      }

      console.log('✅ Projects fetched:', projectsResult.data.length);

      // 各プロジェクトのタスクを取得
      const projectsWithTasks = await Promise.all(
        projectsResult.data.map(async (dvProject) => {
          console.log('🔍 Fetching tasks for project:', dvProject.geek_projecrtid);
          
          // Dataverse Lookup参照の正しいフィルター構文
          // _<関係名>_value eq '<GUID>' を使用
          // $expand を使用して Lookup フィールド（担当者）を展開
          const tasksResult = await Geek_project_tasksService.getAll({
            filter: `_geek_projectid_value eq '${dvProject.geek_projecrtid}'`,
            // @ts-ignore - expand は Power Apps SDK でサポートされているが、型定義にない
            expand: ['geek_lookup_assignee($select=systemuserid,fullname)']
          });

          console.log('📦 Tasks result:', {
            projectId: dvProject.geek_projecrtid,
            projectName: dvProject.geek_name,
            success: tasksResult.success,
            tasksCount: tasksResult.data?.length || 0,
            tasks: tasksResult.data
          });

          // 🔍 デバッグ: 実際のChoice値を確認
          if (tasksResult.data && tasksResult.data.length > 0) {
            const rawChoices = tasksResult.data.map(t => ({
              taskId: t.geek_project_taskid,
              taskName: t.geek_name,
              priority: { value: t.geek_priority, name: t.geek_priorityname, type: typeof t.geek_priority },
              category: { value: t.geek_category, name: t.geek_categoryname, type: typeof t.geek_category },
              status: { value: t.geek_status, name: t.geek_statusname, type: typeof t.geek_status }
            }));
            
            console.log('🔍 RAW Dataverse Choice Values:', rawChoices);
            
            // 各タスクのステータス値を個別に出力
            rawChoices.forEach((task, index) => {
              console.log(`  📝 Task[${index}] "${task.taskName}":`, {
                statusValue: task.status.value,
                statusName: task.status.name,
                statusType: task.status.type,
                // @ts-ignore - デバッグ用の比較
                isCompletedNumber: task.status.value === 0,
                isCompletedString: task.status.value === '0',
                rawValue: JSON.stringify(task.status.value)
              });
            });
          }

          const tasks = tasksResult.success && tasksResult.data ? tasksResult.data : [];
          return convertDataverseToProject(dvProject, tasks);
        })
      );

      setProjects(projectsWithTasks);
      console.log('✅ Projects with tasks loaded:', projectsWithTasks.length);

    } catch (err) {
      console.error('❌ Error fetching Dataverse projects:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [powerAppsInitialized]);

  // プロジェクトの作成
  const createProject = async (project: Omit<Project, 'id' | 'tasks'>): Promise<Project | null> => {
    try {
      console.log('➕ Creating project in Dataverse...', project);

      const dvProject = convertProjectToDataverse(project);
      console.log('📝 Converted Dataverse project:', dvProject);
      
      // Dataverseが自動設定するシステムフィールドは除外しているため、
      // 型アサーションでPartialからcreateメソッドの型に変換
      const result = await Geek_projecrtsService.create(dvProject as Omit<Geek_projecrts, 'geek_projecrtid'>);
      console.log('📦 Create result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        errorType: typeof result.error,
        errorStringified: JSON.stringify(result.error, null, 2),
        fullResult: result
      });

      if (!result.success || !result.data) {
        // エラーオブジェクトを適切に文字列化
        let errorMsg = 'Failed to create project in Dataverse';
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMsg += `: ${result.error}`;
          } else if (result.error instanceof Error) {
            errorMsg += `: ${result.error.message}`;
          } else {
            errorMsg += `: ${JSON.stringify(result.error)}`;
          }
        }
        console.error('❌', errorMsg);
        console.error('❌ Raw error object:', result.error);
        throw new Error(errorMsg);
      }

      const newProject = convertDataverseToProject(result.data, []);
      setProjects(prev => [...prev, newProject]);

      console.log('✅ Project created:', result.data.geek_projecrtid);
      return newProject;

    } catch (err) {
      console.error('❌ Error creating project:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError(err as Error);
      return null;
    }
  };

  // プロジェクトの更新
  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    try {
      console.log('✏️ Updating project in Dataverse...', projectId, updates);

      const dvUpdates = convertProjectToDataverse(updates);
      const result = await Geek_projecrtsService.update(projectId, dvUpdates);

      if (!result.success) {
        throw new Error('Failed to update project in Dataverse');
      }

      // ローカル状態を更新
      setProjects(prev => 
        prev.map(p => p.id === projectId ? { ...p, ...updates } : p)
      );

      console.log('✅ Project updated:', projectId);
      return true;

    } catch (err) {
      console.error('❌ Error updating project:', err);
      setError(err as Error);
      return false;
    }
  };

  // プロジェクトの削除
  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting project from Dataverse...', projectId);

      // 関連タスクを先に削除（Lookup参照の正しいフィルター構文を使用）
      const tasksResult = await Geek_project_tasksService.getAll({
        filter: `_geek_projectid_value eq '${projectId}'`
      });

      if (tasksResult.success && tasksResult.data) {
        await Promise.all(
          tasksResult.data.map(task => 
            Geek_project_tasksService.delete(task.geek_project_taskid)
          )
        );
      }

      // プロジェクトを削除
      await Geek_projecrtsService.delete(projectId);

      // ローカル状態を更新
      setProjects(prev => prev.filter(p => p.id !== projectId));

      console.log('✅ Project deleted:', projectId);
      return true;

    } catch (err) {
      console.error('❌ Error deleting project:', err);
      setError(err as Error);
      return false;
    }
  };

  // タスクの作成
  const createTask = async (projectId: string, task: Omit<Task, 'id'>): Promise<Task | null> => {
    try {
      console.log('➕ Creating task in Dataverse...', { projectId, task });

      const dvTask = convertTaskToDataverse(task, projectId);
      console.log('📝 Converted Dataverse task:', dvTask);
      
      // Dataverseが自動設定するシステムフィールドは除外しているため、型アサーション
      const result = await Geek_project_tasksService.create(dvTask as Omit<Geek_project_tasks, 'geek_project_taskid'>);
      console.log('📦 Create result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        errorType: typeof result.error,
        errorStringified: JSON.stringify(result.error, null, 2),
        fullResult: result
      });

      if (!result.success || !result.data) {
        // エラーオブジェクトを適切に文字列化
        let errorMsg = 'Failed to create task in Dataverse';
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMsg += `: ${result.error}`;
          } else if (result.error instanceof Error) {
            errorMsg += `: ${result.error.message}`;
          } else {
            errorMsg += `: ${JSON.stringify(result.error)}`;
          }
        }
        console.error('❌', errorMsg);
        console.error('❌ Raw error object:', result.error);
        throw new Error(errorMsg);
      }

      const newTask = convertDataverseToTask(result.data);

      // ローカル状態を更新
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId 
            ? { ...p, tasks: [...p.tasks, newTask] }
            : p
        )
      );

      console.log('✅ Task created:', result.data.geek_project_taskid);
      return newTask;

    } catch (err) {
      console.error('❌ Error creating task:', err);
      setError(err as Error);
      return null;
    }
  };

  // タスクの更新
  const updateTask = async (
    projectId: string, 
    taskId: string, 
    updates: Partial<Task>
  ): Promise<boolean> => {
    try {
      console.log('✏️ Updating task in Dataverse...', { taskId, projectId, updates });

      // 更新時はLookupフィールドを含めない（既存のリレーションシップを保持）
      const dvUpdates = convertTaskToDataverse(updates, projectId);
      
      // 更新時はプロジェクトの@odata.bindフィールドを削除（プロジェクトIDは変更しない）
      // 担当者の@odata.bindは保持して、担当者の変更を反映
      const updatePayload: any = { ...dvUpdates };
      delete updatePayload['geek_projectid@odata.bind'];
      
      console.log('📤 Final update payload (safe log):', {
        geek_name: updatePayload.geek_name,
        geek_priority: updatePayload.geek_priority,
        geek_category: updatePayload.geek_category,
        geek_status: updatePayload.geek_status,
        geek_progress: updatePayload.geek_progress,
        hasAssigneeBind: 'geek_lookup_assignee@odata.bind' in updatePayload,
        assigneeBind: updatePayload['geek_lookup_assignee@odata.bind']
      });
      console.log('👤 Assignee update:', {
        hasAssigneeBind: 'geek_lookup_assignee@odata.bind' in updatePayload,
        assigneeBind: updatePayload['geek_lookup_assignee@odata.bind'],
        updatesAssigneeId: updates.assigneeId,
        updatesAssignee: updates.assignee
      });
      
      const result = await Geek_project_tasksService.update(taskId, updatePayload);
      console.log('📦 Update result:', {
        success: result.success,
        error: result.error,
        errorType: typeof result.error,
        errorStringified: JSON.stringify(result.error, null, 2),
        fullResult: result
      });

      if (!result.success) {
        // エラーオブジェクトを適切に文字列化
        let errorMsg = 'Failed to update task in Dataverse';
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMsg += `: ${result.error}`;
          } else if (result.error instanceof Error) {
            errorMsg += `: ${result.error.message}`;
          } else {
            errorMsg += `: ${JSON.stringify(result.error)}`;
          }
        }
        console.error('❌', errorMsg);
        console.error('❌ Raw error object:', result.error);
        throw new Error(errorMsg);
      }

      // ローカル状態を更新
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map(t => 
                  t.id === taskId ? { ...t, ...updates } : t
                )
              }
            : p
        )
      );

      console.log('✅ Task updated:', taskId);
      return true;

    } catch (err) {
      console.error('❌ Error updating task:', err);
      setError(err as Error);
      return false;
    }
  };

  // タスクの削除
  const deleteTask = async (projectId: string, taskId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting task from Dataverse...', taskId);

      await Geek_project_tasksService.delete(taskId);

      // ローカル状態を更新
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId
            ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
            : p
        )
      );

      console.log('✅ Task deleted:', taskId);
      return true;

    } catch (err) {
      console.error('❌ Error deleting task:', err);
      setError(err as Error);
      return false;
    }
  };

  // 初回データ取得（Power Apps初期化完了後）
  useEffect(() => {
    if (powerAppsInitialized || !isPowerAppsEnvironment()) {
      fetchProjects();
    }
  }, [powerAppsInitialized, fetchProjects]);

  return {
    projects,
    loading,
    error,
    refreshProjects: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask
  };
};

export default useDataverseProjects;
