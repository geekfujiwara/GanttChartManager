import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project, getProjectStats } from '@/data/sampleProjects';
import { useDataverseProjects } from '@/hooks/useDataverseProjects';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Activity,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DashboardProps {
  projects?: Project[]; // オプショナルに変更（Dataverseから取得する場合）
  currentUserName?: string;
  currentUserId?: string;
  onProjectClick?: (project: Project) => void;
  onViewAllProjects?: () => void;
  onViewMyTasks?: () => void;
}

export function Dashboard({
  projects: propsProjects,
  currentUserName = '田中PM',
  currentUserId,
  onProjectClick,
  onViewAllProjects,
  onViewMyTasks
}: DashboardProps) {
  const { projects: dataverseProjects, loading, error } = useDataverseProjects();

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

  // ローディング中
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">プロジェクトデータを読み込んでいます...</p>
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

  // 全体統計
  const totalStats = projects.reduce((acc, project) => {
    const stats = getProjectStats(project);
    return {
      totalProjects: acc.totalProjects + 1,
      totalTasks: acc.totalTasks + stats.totalTasks,
      completedTasks: acc.completedTasks + stats.completedTasks,
      inProgressTasks: acc.inProgressTasks + stats.inProgressTasks,
      overdueTasks: acc.overdueTasks + stats.overdueTasks,
    };
  }, {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
  });

  // 自分のタスク統計
  console.log('🔍 Dashboard: Filtering tasks for current user:', {
    currentUserName,
    currentUserId,
    totalProjects: projects.length,
    totalTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0)
  });

  const myTasks = projects.flatMap(project =>
    project.tasks
      .filter(task => {
        const matchByName = task.assignee === currentUserName;
        const matchById = task.assigneeId === currentUserId;
        const isMatch = matchByName || matchById;
        
        if (isMatch) {
          console.log('✅ Task matched:', {
            taskName: task.name,
            assignee: task.assignee,
            assigneeId: task.assigneeId,
            matchByName,
            matchById
          });
        }
        
        return isMatch;
      })
      .map(task => ({ ...task, project }))
  );

  console.log('📊 My tasks found:', myTasks.length);

  const myTasksStats = {
    total: myTasks.length,
    active: myTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length,
    completed: myTasks.filter(t => t.status === 'Completed').length,
    overdue: myTasks.filter(t => t.end < new Date() && t.status !== 'Completed').length,
  };

  // 最近のアクティビティ（最近更新されたプロジェクト）
  const recentProjects = [...projects]
    .sort((a, b) => {
      // プロジェクトの最新タスク更新日でソート（仮実装）
      const aLatest = Math.max(...a.tasks.map(t => t.end.getTime()));
      const bLatest = Math.max(...b.tasks.map(t => t.end.getTime()));
      return bLatest - aLatest;
    })
    .slice(0, 5);

  // 今週期限のタスク
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingTasks = myTasks
    .filter(t => t.end >= now && t.end <= weekLater && t.status !== 'Completed')
    .sort((a, b) => a.end.getTime() - b.end.getTime())
    .slice(0, 5);

  const overallProgress = totalStats.totalTasks > 0
    ? Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ウェルカムメッセージ */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          ようこそ、{currentUserName}さん
        </h1>
        <p className="text-muted-foreground">
          プロジェクトとタスクの進捗状況を確認しましょう
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総プロジェクト数</p>
                <p className="text-3xl font-bold">{totalStats.totalProjects}</p>
              </div>
              <FolderKanban className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総タスク数</p>
                <p className="text-3xl font-bold">{totalStats.totalTasks}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">進行中のタスク</p>
                <p className="text-3xl font-bold text-blue-600">{totalStats.inProgressTasks}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">全体進捗率</p>
                <p className="text-3xl font-bold text-purple-600">{overallProgress}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* マイタスクサマリー */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>マイタスク</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewMyTasks}>
            すべて表示
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-muted rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">総タスク</p>
                <p className="text-2xl font-bold">{myTasksStats.total}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">進行中</p>
                <p className="text-2xl font-bold text-blue-600">{myTasksStats.active}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">完了</p>
                <p className="text-2xl font-bold text-green-600">{myTasksStats.completed}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">遅延</p>
                <p className="text-2xl font-bold text-red-600">{myTasksStats.overdue}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今週期限のタスク */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>今週期限のタスク</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>今週期限のタスクはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onProjectClick?.(task.project)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">{task.project.name}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium">
                        {format(task.end, 'MM/dd', { locale: ja })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil((task.end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}日後
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近のプロジェクト */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FolderKanban className="h-5 w-5" />
              <span>プロジェクト</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onViewAllProjects}>
              すべて表示
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>プロジェクトがありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => {
                  const stats = getProjectStats(project);
                  const progress = stats.totalTasks > 0
                    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                    : 0;

                  return (
                    <div
                      key={project.id}
                      className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onProjectClick?.(project)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{project.name}</p>
                        <span className="text-sm font-semibold text-purple-600">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-purple-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{stats.totalTasks} タスク</span>
                        <span className="text-green-600">{stats.completedTasks} 完了</span>
                        {stats.overdueTasks > 0 && (
                          <span className="text-red-600">{stats.overdueTasks} 遅延</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
