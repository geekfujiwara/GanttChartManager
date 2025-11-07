import { useState, useEffect, useMemo, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/ThemeContext';
import { CommonHeader } from '@/components/layout/CommonHeader';
import { SideMenu, SideMenuAssignee } from '@/components/layout/SideMenu';
import { Dashboard } from '@/components/Dashboard';
import { GanttChart } from '@/components/GanttChart';
import { MyTasksView } from '@/components/MyTasksView';
import { ProjectListView } from '@/components/ProjectListView';
import { TaskDialog, ProjectDialog } from '@/components/TaskDialog';
import { Project, Task } from '@/data/sampleProjects';
import { useDataverseProjects } from '@/hooks/useDataverseProjects';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDataverseUsers } from '@/hooks/useDataverseUsers';
import { cn } from '@/lib/utils';

const queryClient = new QueryClient();

type ViewType = 'dashboard' | 'gantt' | 'myTasks' | 'projectList';

function GanttApp() {
  // Dataverseフックを使用
  const {
    projects: dataverseProjects,
    loading: dataverseLoading,
    refreshProjects,
    createProject: createDataverseProject,
    updateProject: updateDataverseProject,
    deleteProject: deleteDataverseProject,
    createTask: createDataverseTask,
    updateTask: updateDataverseTask,
    deleteTask: deleteDataverseTask
  } = useDataverseProjects();

  // Power Apps環境ではDataverseを使用、それ以外はサンプルデータ
  const isPowerApps = typeof window !== 'undefined' && (
    window.location.hostname.includes('apps.powerapps.com') ||
    window.location.hostname.includes('make.powerapps.com') ||
    process.env.NODE_ENV === 'production'
  );

  // 状態管理
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sideMenuOpen, setSideMenuOpen] = useState(true); // デフォルトで開く
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTaskProjectId, setEditingTaskProjectId] = useState<string | null>(null); // マイタスクから開いた場合のプロジェクトID
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [myTasksRefreshToken, setMyTasksRefreshToken] = useState(0);
  const [assigneeFilter, setAssigneeFilter] = useState<SideMenuAssignee | null>(null);
  
  // 現在のユーザー情報を取得
  const { currentUser } = useCurrentUser();
  const { users: dataverseUsers, loading: dataverseUsersLoading } = useDataverseUsers();

  const assigneeOptions = useMemo<SideMenuAssignee[]>(() => {
    if (dataverseUsers.length > 0) {
      return dataverseUsers.map((user) => ({
        id: user.id,
        name: user.displayName,
        email: user.email
      }));
    }

    const map = new Map<string, SideMenuAssignee>();
    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (!task.assignee && !task.assigneeId) {
          return;
        }
        const key = task.assigneeId ?? `name:${task.assignee}`;
        if (!map.has(key)) {
          map.set(key, {
            id: task.assigneeId || undefined,
            name: task.assignee || '担当者未設定'
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [dataverseUsers, projects]);

  const handleAssigneeSelect = useCallback((assignee: SideMenuAssignee) => {
    setAssigneeFilter(assignee);
    setCurrentView('myTasks');
    setActiveProject(null);
  }, []);

  const handleAssigneeFilterClear = useCallback(() => {
    setAssigneeFilter(null);
  }, []);

  useEffect(() => {
    if (!assigneeFilter) {
      return;
    }
    const exists = assigneeOptions.some((assignee) => {
      if (assigneeFilter.id && assignee.id) {
        return assignee.id === assigneeFilter.id;
      }
      return assignee.name === assigneeFilter.name;
    });
    if (!exists) {
      setAssigneeFilter(null);
    }
  }, [assigneeOptions, assigneeFilter]);

  // Dataverseデータを使用
  useEffect(() => {
    if (!dataverseLoading) {
      if (dataverseProjects.length > 0) {
        setProjects(dataverseProjects);
        
        // 現在選択中のプロジェクトがあれば、同じIDのプロジェクトを再選択
        if (activeProject) {
          const updatedProject = dataverseProjects.find(p => p.id === activeProject.id);
          if (updatedProject) {
            setActiveProject(updatedProject);
          }
        }
      } else {
        setProjects([]);
      }
    }
  }, [isPowerApps, dataverseProjects, dataverseLoading]);

  // マイタスク画面を開いたときにデータをリフレッシュ
  useEffect(() => {
    if (currentView === 'myTasks' && isPowerApps) {
      console.log('🔄 MyTasks view opened - refreshing projects...');
      refreshProjects();
    }
  }, [currentView, isPowerApps]);

  // プロジェクト選択
  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    setCurrentView('gantt');
  };

  // マイタスクへ移動
  const handleNavigateToMyTasks = () => {
    setCurrentView('myTasks');
    setActiveProject(null);
  };

  // プロジェクト一覧へ移動
  const handleNavigateToProjectList = () => {
    setCurrentView('projectList');
    setActiveProject(null);
  };

  // タスク保存
  const handleTaskSave = async (taskData: Omit<Task, 'id'>) => {
    // activeProjectまたはeditingTaskProjectIdのいずれかが必要
    const projectId = activeProject?.id || editingTaskProjectId;
    if (!projectId) {
      console.warn('⚠️ No project context for task save');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isPowerApps) {
        if (editingTask) {
          console.log('💾 Updating task in Dataverse...');
          await updateDataverseTask(projectId, editingTask.id, taskData);
        } else {
          console.log('➕ Creating task in Dataverse...');
          await createDataverseTask(projectId, taskData);
        }
        
        // ✅ v1.27.0: Dataverse更新後、プロジェクトリストを再取得してUIの更新を待機
        console.log('🔄 Refreshing projects after task save...');
        await refreshProjects();
        
        // ✅ ReactのStateが更新されるまで待機
        console.log('⏳ Waiting for UI state update...');
        await new Promise(resolve => {
          const checkStateUpdate = () => {
            // dataverseProjectsが更新されてprojectsステートに反映されるまで待機
            if (!dataverseLoading && dataverseProjects.length > 0) {
              console.log('✅ UI state updated successfully');
              resolve(undefined);
            } else {
              // 100ms後に再チェック
              setTimeout(checkStateUpdate, 100);
            }
          };
          checkStateUpdate();
        });
      } else {
        if (editingTask) {
          const updatedProject = {
            ...activeProject!,
            tasks: activeProject!.tasks.map(task =>
              task.id === editingTask.id
                ? { ...taskData, id: editingTask.id }
                : task
            )
          };
          updateProject(updatedProject);
        } else {
          const newTask: Task = {
            ...taskData,
            id: `task-${Date.now()}`
          };
          const updatedProject = {
            ...activeProject!,
            tasks: [...activeProject!.tasks, newTask]
          };
          updateProject(updatedProject);
        }
      }
      setEditingTask(null);
      setEditingTaskProjectId(null); // クリア
      setTaskDialogOpen(false);
      setMyTasksRefreshToken((token) => token + 1);
    } catch (error) {
      console.error('❌ Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // タスク更新（ドラッグ）
  const handleTaskUpdate = async (taskId: string, newStart: Date, newEnd: Date) => {
    if (!activeProject) return;

    const task = activeProject.tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskData = {
      ...task,
      start: newStart,
      end: newEnd
    };

    // 楽観的にローカルステートを更新してドラッグ結果を即時反映
    const optimisticProject: Project = {
      ...activeProject,
      tasks: activeProject.tasks.map(t => (t.id === taskId ? taskData : t))
    };
    const previousProjectState = activeProject;

    setActiveProject(optimisticProject);
    setProjects((prev) => prev.map((p) => (p.id === optimisticProject.id ? optimisticProject : p)));

    setIsSaving(true);
    
    try {
      if (isPowerApps) {
        await updateDataverseTask(activeProject.id, taskId, taskData);
        
        // Dataverse更新後、プロジェクトリストを再取得
        console.log('🔄 Refreshing projects after task drag...');
        await refreshProjects();
      } else {
        // ローカルデータソースの場合はステートを確定更新
        updateProject(optimisticProject);
      }
    } catch (error) {
      console.error('❌ Failed to update task dates:', error);
      // エラー時は元の状態に戻す
      setActiveProject(previousProjectState);
      setProjects((prev) => prev.map((p) => (p.id === previousProjectState.id ? previousProjectState : p)));
    } finally {
      setIsSaving(false);
    }
  };

  // タスク削除
  const handleTaskDelete = async (taskId: string) => {
    if (!activeProject) return;
    
    setIsSaving(true);
    
    try {
      if (isPowerApps) {
        await deleteDataverseTask(activeProject.id, taskId);
        
        // Dataverse更新後、プロジェクトリストを再取得
        console.log('🔄 Refreshing projects after task delete...');
        await refreshProjects();
      } else {
        const updatedProject = {
          ...activeProject,
          tasks: activeProject.tasks.filter(task => task.id !== taskId)
        };
        updateProject(updatedProject);
      }
      setTaskDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // タスクステータス変更（マイタスク画面から）
  const handleTaskStatusChange = async (taskId: string, projectId: string, newStatus: Task['status']) => {
    console.log('📝 handleTaskStatusChange called:', { taskId, projectId, newStatus });
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.warn('⚠️ Project not found:', projectId);
      return;
    }

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn('⚠️ Task not found:', taskId);
      return;
    }

    // ステータスが完了の場合は進捗率も100%にする
    const taskData = {
      ...task,
      status: newStatus,
      progress: newStatus === 'Completed' ? 100 : task.progress
    };

    console.log('📝 Task data to update:', taskData);

    setIsSaving(true);
    
    try {
      if (isPowerApps) {
        console.log('💾 Updating Dataverse task...');
        await updateDataverseTask(projectId, taskId, taskData);
        
        // Dataverse更新後、プロジェクトリストを再取得
        console.log('🔄 Refreshing projects from Dataverse...');
        await refreshProjects();
      } else {
        const updatedProject = {
          ...project,
          tasks: project.tasks.map(t =>
            t.id === taskId ? taskData : t
          )
        };
        const updatedProjects = projects.map(p =>
          p.id === projectId ? updatedProject : p
        );
        setProjects(updatedProjects);
      }
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // プロジェクト保存
  const handleProjectSave = async (projectData: Project) => {
    setIsSaving(true);
    
    try {
      if (isPowerApps) {
        if (editingProject) {
          await updateDataverseProject(editingProject.id, projectData);
          
          // Dataverse更新後、プロジェクトリストを再取得
          console.log('🔄 Refreshing projects after project update...');
          await refreshProjects();
        } else {
          const { tasks, ...projectWithoutTasks } = projectData;
          const newProject = await createDataverseProject(projectWithoutTasks);
          if (newProject) {
            // Dataverse更新後、プロジェクトリストを再取得
            console.log('🔄 Refreshing projects after project create...');
            await refreshProjects();
            
            setActiveProject(newProject);
            setCurrentView('gantt');
          }
        }
      } else {
        if (editingProject) {
          const updatedProjects = projects.map(p =>
            p.id === editingProject.id ? projectData : p
          );
          setProjects(updatedProjects);
          if (activeProject && activeProject.id === editingProject.id) {
            setActiveProject(projectData);
          }
        } else {
          const newProject: Project = {
            ...projectData,
            id: `project-${Date.now()}`,
            tasks: []
          };
          setProjects([...projects, newProject]);
          setActiveProject(newProject);
          setCurrentView('gantt');
        }
      }
      setEditingProject(null);
      setProjectDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // プロジェクト削除
  const handleProjectDelete = async (projectId: string) => {
    if (!confirm('このプロジェクトを削除してもよろしいですか？関連するタスクも削除されます。')) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isPowerApps) {
        const success = await deleteDataverseProject(projectId);
        if (success) {
          if (activeProject && activeProject.id === projectId) {
            setActiveProject(null);
            setCurrentView('dashboard');
          }
          await refreshProjects();
        }
      } else {
        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects);
        if (activeProject && activeProject.id === projectId) {
          setActiveProject(null);
          setCurrentView('dashboard');
        }
      }
    } catch (error) {
      console.error('プロジェクト削除エラー:', error);
      alert('プロジェクトの削除に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // プロジェクト編集ダイアログを開く
  const handleProjectEdit = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const updateProject = (updatedProject: Project) => {
    const updatedProjects = projects.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    setActiveProject(updatedProject);
  };

  // ダイアログ操作
  const openNewTaskDialog = () => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleTaskDialogChange = (open: boolean) => {
    setTaskDialogOpen(open);
    if (!open) {
      setEditingTask(null);
      setEditingTaskProjectId(null); // マイタスクから開いた場合のプロジェクトIDをクリア
    }
  };

  const openNewProjectDialog = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };

  const handleProjectDialogChange = (open: boolean) => {
    setProjectDialogOpen(open);
    if (!open) {
      setEditingProject(null);
    }
  };

  // マイタスクからタスククリック
  const handleMyTaskClick = async (task: Task, project: Project) => {
    console.log('🔄 MyTasks: Task clicked, navigating to project:', {
      taskName: task.name,
      projectName: project.name,
      projectId: project.id
    });
    
    // ✅ v1.29.0: タスクカードクリック時は該当プロジェクトに画面遷移
    if (isPowerApps) {
      // Dataverseから最新データを取得してから遷移
      console.log('🔄 MyTasks: Refreshing project data before navigation...');
      await refreshProjects();
      
      // リフレッシュ後、最新のプロジェクト情報を取得
      const refreshedProject = dataverseProjects.find(p => p.id === project.id);
      if (refreshedProject) {
        setActiveProject(refreshedProject);
      } else {
        setActiveProject(project); // プロジェクトが見つからない場合は元のプロジェクトを使用
      }
    } else {
      setActiveProject(project);
    }

    // マイタスクから開いた場合、プロジェクトIDを保持してフォームを開く
    setEditingTaskProjectId(project.id);
    setEditingTask(task);
    setTaskDialogOpen(true);
    console.log('✅ MyTasks: Opened task dialog from My Tasks view');
  };

  // ダッシュボードへ移動
  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
    setActiveProject(null);
  };

  // ダッシュボードからプロジェクトクリック
  const handleDashboardProjectClick = (project: Project) => {
    setActiveProject(project);
    setCurrentView('gantt');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* メインアプリケーション（ヘッダー + サイドメニュー + コンテンツ） */}
      <CommonHeader 
        activeProject={currentView === 'gantt' ? activeProject ?? undefined : undefined}
        isSaving={isSaving}
        isPowerApps={isPowerApps}
        dataverseLoading={dataverseLoading}
        onMenuToggle={() => setSideMenuOpen(!sideMenuOpen)}
        onRefresh={refreshProjects}
      />

      <SideMenu 
        isOpen={sideMenuOpen}
        projects={projects}
        activeProject={activeProject ?? undefined}
        onProjectSelect={handleProjectSelect}
        onNewProject={openNewProjectDialog}
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToMyTasks={handleNavigateToMyTasks}
        onNavigateToProjectList={handleNavigateToProjectList}
        currentView={currentView}
        assignees={assigneeOptions}
        assigneeLoading={dataverseUsersLoading}
        onAssigneeSelect={handleAssigneeSelect}
      />

      <main 
        className={cn(
          "transition-all duration-300",
          sideMenuOpen ? "ml-64" : "ml-0"
        )}
      >
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
          {currentView === 'dashboard' ? (
            <Dashboard
              projects={projects}
              currentUserName={currentUser?.displayName}
              currentUserId={currentUser?.id}
              onProjectClick={handleDashboardProjectClick}
              onViewAllProjects={handleNavigateToProjectList}
              onViewMyTasks={handleNavigateToMyTasks}
            />
          ) : currentView === 'gantt' ? (
            activeProject ? (
              <div className="h-full flex flex-col">
                {/* メインコンテンツ */}
                <div className="flex-1 overflow-auto px-4 pb-4 pt-0">
                  <GanttChart 
                    project={activeProject}
                    onTaskClick={openEditTaskDialog}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskStatusChange={(taskId, newStatus) => handleTaskStatusChange(taskId, activeProject.id, newStatus)}
                    onProjectEdit={handleProjectEdit}
                    onNewTask={openNewTaskDialog}
                    onTasksUpdated={refreshProjects}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="mb-4">プロジェクトを選択してください</p>
                </div>
              </div>
            )
          ) : currentView === 'myTasks' ? (
            <MyTasksView 
              projects={projects}
              currentUser={currentUser?.displayName ?? ''}
              currentUserId={currentUser?.id}
              onTaskClick={handleMyTaskClick}
              onTaskStatusChange={handleTaskStatusChange}
              refreshKey={myTasksRefreshToken}
              filterAssigneeId={assigneeFilter?.id}
              filterAssigneeName={assigneeFilter?.name}
              onAssigneeFilterClear={handleAssigneeFilterClear}
            />
          ) : currentView === 'projectList' ? (
            <ProjectListView
              projects={projects}
              onProjectClick={handleDashboardProjectClick}
              onNewProject={openNewProjectDialog}
            />
          ) : null}
        </div>
      </main>

      {/* ダイアログ */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={handleTaskDialogChange}
        task={editingTask}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={handleProjectDialogChange}
        project={editingProject}
        onSave={handleProjectSave}
        onDelete={handleProjectDelete}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="gantt-ui-theme">
        <GanttApp />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
