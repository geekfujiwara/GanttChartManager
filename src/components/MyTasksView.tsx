import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task, Project, priorityLabels, statusLabels, categoryLabels, priorityColors } from '@/data/sampleProjects';
import { useDataverseProjects } from '@/hooks/useDataverseProjects';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  Filter,
  ArrowUpDown,
  Loader2,
  Pause,
  X,
  ExternalLink,
  UserCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MyTasksViewProps {
  projects?: Project[]; // オプショナルに変更（Dataverseから取得する場合）
  currentUser: string; // 現在のユーザー名またはID
  currentUserId?: string; // ユーザーID（システムユーザーのGUID）
  onTaskClick?: (task: Task, project: Project) => void;
  onTaskStatusChange?: (taskId: string, projectId: string, newStatus: Task['status']) => Promise<void>; // Promiseを返すように変更
  refreshKey?: number;
  filterAssigneeId?: string;
  filterAssigneeName?: string;
  onAssigneeFilterClear?: () => void;
}

type TaskWithProject = Task & { project: Project };
type SortOption = 'dueDate' | 'priority' | 'status' | 'project';
type FilterOption = 'all' | 'active' | 'completed' | 'overdue' | 'onhold' | 'cancelled';
type StartDateFilterOption = 'all' | 'thisWeek' | 'thisMonth' | 'nextMonth';

export function MyTasksView({ 
  projects: propsProjects, 
  currentUser,
  currentUserId,
  onTaskClick,
  onTaskStatusChange,
  refreshKey,
  filterAssigneeId,
  filterAssigneeName,
  onAssigneeFilterClear
}: MyTasksViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [filterBy, setFilterBy] = useState<FilterOption>('active');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<StartDateFilterOption>('all');

  const { 
    projects: dataverseProjects, 
    loading, 
    error,
    refreshProjects 
  } = useDataverseProjects();

  // Power Apps環境の検出
  const isPowerAppsEnvironment = typeof window !== 'undefined' && (
    window.location.hostname.includes('apps.powerapps.com') ||
    window.location.hostname.includes('make.powerapps.com') ||
    process.env.NODE_ENV === 'production'
  );

  // Dataverseのプロジェクトを使用、フォールバックとしてpropsのプロジェクトを使用
  const projects = isPowerAppsEnvironment && dataverseProjects.length > 0 
    ? dataverseProjects 
    : (propsProjects || []);

  // コンポーネントマウント時にDataverseデータをリフレッシュ
  useEffect(() => {
    if (isPowerAppsEnvironment) {
      console.log('🔄 MyTasksView: Component mounted - refreshing projects...');
      refreshProjects();
    }
  }, [isPowerAppsEnvironment, refreshProjects]);

  useEffect(() => {
    if (refreshKey !== undefined && isPowerAppsEnvironment) {
      console.log('🔁 MyTasksView: refresh requested via key', refreshKey);
      refreshProjects();
    }
  }, [refreshKey, isPowerAppsEnvironment, refreshProjects]);

  // 現在のユーザーにアサインされたタスクを抽出
  const myTasks = useMemo(() => {
    const effectiveIds = filterAssigneeId
      ? [filterAssigneeId]
      : [currentUserId, currentUser].filter((value): value is string => Boolean(value));

    const effectiveNames = filterAssigneeName
      ? [filterAssigneeName]
      : [currentUser].filter((value): value is string => Boolean(value));

    console.log('🔍 MyTasksView: Filtering tasks:', {
      filterAssigneeId,
      filterAssigneeName,
      currentUser,
      currentUserId,
      effectiveIds,
      effectiveNames,
      totalProjects: projects.length,
      totalTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0)
    });

    const tasksWithProject: TaskWithProject[] = [];
    
    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        const matchesId = effectiveIds.length > 0 && task.assigneeId
          ? effectiveIds.includes(task.assigneeId)
          : false;
        const matchesName = effectiveNames.length > 0 && task.assignee
          ? effectiveNames.includes(task.assignee)
          : false;

        if (matchesId || matchesName) {
          console.log('✅ Task matched:', {
            taskName: task.name,
            projectName: project.name,
            assignee: task.assignee,
            assigneeId: task.assigneeId,
            matchesId,
            matchesName
          });
          tasksWithProject.push({ ...task, project });
        }
      });
    });

    console.log('📊 Filtered tasks found:', tasksWithProject.length);
    return tasksWithProject;
  }, [projects, currentUser, currentUserId, filterAssigneeId, filterAssigneeName]);

  const availableProjects = useMemo(() => {
    const projectMap = new Map<string, Project>();
    myTasks.forEach((task) => {
      if (task.project?.id) {
        projectMap.set(task.project.id, task.project);
      }
    });
    return Array.from(projectMap.values());
  }, [myTasks]);

  useEffect(() => {
    if (projectFilter !== 'all' && !availableProjects.some((project) => project.id === projectFilter)) {
      setProjectFilter('all');
    }
  }, [availableProjects, projectFilter]);

  // フィルタリング
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const nextMonthStart = startOfMonth(addMonths(now, 1));
    const nextMonthEnd = endOfMonth(addMonths(now, 1));

    let tasks = myTasks;

    if (projectFilter !== 'all') {
      tasks = tasks.filter((task) => task.project?.id === projectFilter);
    }

    if (startDateFilter !== 'all') {
      tasks = tasks.filter((task) => {
        const start = task.start;
        switch (startDateFilter) {
          case 'thisWeek':
            return start >= thisWeekStart && start <= thisWeekEnd;
          case 'thisMonth':
            return start >= thisMonthStart && start <= thisMonthEnd;
          case 'nextMonth':
            return start >= nextMonthStart && start <= nextMonthEnd;
          default:
            return true;
        }
      });
    }

    switch (filterBy) {
      case 'active':
        return tasks.filter(t => t.status !== 'Completed');
      case 'completed':
        return tasks.filter(t => t.status === 'Completed');
      case 'overdue':
        return tasks.filter(t => t.end < now && t.status !== 'Completed');
      case 'onhold':
        return tasks.filter(t => t.status === 'OnHold');
      case 'cancelled':
        return tasks.filter(t => t.status === 'Cancelled');
      default:
        return tasks;
    }
  }, [myTasks, filterBy, projectFilter, startDateFilter]);

  // ソート
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    
    switch (sortBy) {
      case 'dueDate':
        return sorted.sort((a, b) => a.end.getTime() - b.end.getTime());
      case 'priority':
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case 'project':
        return sorted.sort((a, b) => a.project.name.localeCompare(b.project.name));
      default:
        return sorted;
    }
  }, [filteredTasks, sortBy]);

  // 統計情報
  const stats = useMemo(() => {
    const now = new Date();
    const overdueCount = myTasks.filter(t => t.end < now && t.status !== 'Completed').length;
    return {
      total: myTasks.length,
      active: myTasks.filter(t => t.status === 'NotStarted' || t.status === 'InProgress').length,
      completed: myTasks.filter(t => t.status === 'Completed').length,
      overdue: overdueCount,
      onhold: myTasks.filter(t => t.status === 'OnHold').length,
      cancelled: myTasks.filter(t => t.status === 'Cancelled').length,
    };
  }, [myTasks]);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'InProgress': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'NotStarted': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'OnHold': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Cancelled': return 'bg-red-500/10 text-red-700 dark:text-red-400';
    }
  };

  const isOverdue = (task: Task) => {
    return task.end < new Date() && task.status !== 'Completed';
  };

  // ローディング中または更新中
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {updatingTaskId ? 'タスクデータを更新しています...' : 'タスクデータを読み込んでいます...'}
          </p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">データの読み込みに失敗しました</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー統計 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">総タスク</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">進行中</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">完了</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Pause className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">保留</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.onhold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">キャンセル</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">遅延</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター・ソートコントロール */}
      {(filterAssigneeId || filterAssigneeName) && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">担当者フィルターが適用されています</p>
                <p className="font-semibold text-foreground">
                  {filterAssigneeName || 'ID: ' + filterAssigneeId}
                </p>
              </div>
            </div>
            {onAssigneeFilterClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start sm:self-auto"
                onClick={onAssigneeFilterClear}
              >
                <X className="h-4 w-4 mr-1" />
                フィルター解除
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="active">完了以外</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="onhold">保留</SelectItem>
                    <SelectItem value="cancelled">キャンセル</SelectItem>
                    <SelectItem value="overdue">遅延</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="プロジェクト" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのプロジェクト</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={startDateFilter} onValueChange={(value) => setStartDateFilter(value as StartDateFilterOption)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">開始日: すべて</SelectItem>
                    <SelectItem value="thisWeek">開始日: 今週</SelectItem>
                    <SelectItem value="thisMonth">開始日: 今月</SelectItem>
                    <SelectItem value="nextMonth">開始日: 来月</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">期限順</SelectItem>
                    <SelectItem value="priority">優先度順</SelectItem>
                    <SelectItem value="status">ステータス順</SelectItem>
                    <SelectItem value="project">プロジェクト順</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {sortedTasks.length} 件のタスク
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タスク一覧 */}
      <div className="relative space-y-3">
        {/* 更新中のオーバーレイ */}
        {updatingTaskId && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-card rounded-lg p-6 shadow-lg border">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-lg font-semibold">データを更新しています...</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                しばらくお待ちください
              </p>
            </div>
          </div>
        )}

        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">タスクがありません</p>
                <p className="text-sm mt-2">
                  {filterBy === 'all' ? 'アサインされたタスクがありません' :
                   filterBy === 'active' ? '完了以外のタスクがありません' :
                   filterBy === 'completed' ? '完了したタスクがありません' :
                   filterBy === 'onhold' ? '保留中のタスクがありません' :
                   filterBy === 'cancelled' ? 'キャンセルされたタスクがありません' :
                   filterBy === 'overdue' ? '遅延しているタスクがありません' :
                   'フィルター条件に一致するタスクがありません'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task) => (
            <Card 
              key={task.id}
              title={`クリックして「${task.project.name}」プロジェクトを表示`}
              className={cn(
                "hover:shadow-md transition-all cursor-pointer",
                isOverdue(task) && "border-l-4 border-l-red-500",
                updatingTaskId === task.id && "opacity-50"
              )}
              onClick={() => updatingTaskId !== task.id && onTaskClick?.(task, task.project)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">{task.name}</h3>
                      {isOverdue(task) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          遅延
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {task.project.name}
                        <ExternalLink className="h-3 w-3" />
                      </Badge>
                      
                      <Badge className={cn("text-xs", getStatusColor(task.status))}>
                        {statusLabels[task.status]}
                      </Badge>

                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold text-white",
                        priorityColors[task.priority]
                      )}>
                        {priorityLabels[task.priority]}
                      </span>

                      <span className="text-muted-foreground">
                        {categoryLabels[task.category]}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(task.start, 'yyyy/MM/dd', { locale: ja })} - {format(task.end, 'yyyy/MM/dd', { locale: ja })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>進捗: {task.progress}%</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col items-end space-y-2">
                    {task.status === 'Completed' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        完了済み
                      </Badge>
                    ) : task.status === 'Cancelled' ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <X className="h-4 w-4 mr-1" />
                        キャンセル済み
                      </Badge>
                    ) : task.status === 'OnHold' ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Pause className="h-4 w-4 mr-1" />
                        保留中
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingTaskId === task.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          console.log('✅ MyTasksView: Mark as completed:', {
                            taskId: task.id,
                            taskName: task.name,
                            projectId: task.project.id,
                            projectName: task.project.name,
                            oldStatus: task.status
                          });
                          
                          setUpdatingTaskId(task.id);
                          
                          try {
                            // ステータスを更新
                            await onTaskStatusChange?.(task.id, task.project.id, 'Completed');
                            
                            // マイタスク一覧をリフレッシュ（Power Apps環境のみ）
                            if (isPowerAppsEnvironment) {
                              console.log('🔄 MyTasksView: Refreshing projects after status change...');
                              await refreshProjects();
                            }
                          } finally {
                            setUpdatingTaskId(null);
                          }
                        }}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        {updatingTaskId === task.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            更新中...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            完了にする
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
