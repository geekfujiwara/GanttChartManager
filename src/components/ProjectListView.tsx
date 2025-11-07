import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project, getProjectStats } from '@/data/sampleProjects';
import { useDataverseProjects } from '@/hooks/useDataverseProjects';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  FolderKanban, 
  Search, 
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Loader2,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectListViewProps {
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
  onNewProject?: () => void;
}

type SortOption = 'name' | 'status' | 'progress' | 'startDate' | 'endDate';
type FilterOption = 'all' | 'active' | 'planning' | 'completed';

export function ProjectListView({ 
  projects: propsProjects,
  onProjectClick,
  onNewProject
}: ProjectListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

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

  // プロジェクトの統計情報を計算
  const projectsWithStats = useMemo(() => {
    return projects.map(project => {
      const stats = getProjectStats(project);
      const progress = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;
      
      return {
        ...project,
        stats,
        progress
      };
    });
  }, [projects]);

  // 検索フィルター
  const searchedProjects = useMemo(() => {
    if (!searchQuery) return projectsWithStats;
    
    const query = searchQuery.toLowerCase();
    return projectsWithStats.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.manager?.toLowerCase().includes(query)
    );
  }, [projectsWithStats, searchQuery]);

  // ステータスフィルター
  const filteredProjects = useMemo(() => {
    switch (filterBy) {
      case 'active':
        return searchedProjects.filter(p => p.status === 'InProgress');
      case 'planning':
        return searchedProjects.filter(p => p.status === 'Planning');
      case 'completed':
        return searchedProjects.filter(p => p.status === 'Completed');
      default:
        return searchedProjects;
    }
  }, [searchedProjects, filterBy]);

  // ソート
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case 'progress':
        return sorted.sort((a, b) => b.progress - a.progress);
      case 'startDate':
        return sorted.sort((a, b) => a.start.getTime() - b.start.getTime());
      case 'endDate':
        return sorted.sort((a, b) => a.end.getTime() - b.end.getTime());
      default:
        return sorted;
    }
  }, [filteredProjects, sortBy]);

  // 全体統計
  const totalStats = useMemo(() => {
    return projectsWithStats.reduce((acc, project) => {
      return {
        total: acc.total + 1,
        active: acc.active + (project.status === 'InProgress' ? 1 : 0),
        planning: acc.planning + (project.status === 'Planning' ? 1 : 0),
        completed: acc.completed + (project.status === 'Completed' ? 1 : 0),
        totalTasks: acc.totalTasks + project.stats.totalTasks,
        completedTasks: acc.completedTasks + project.stats.completedTasks,
      };
    }, {
      total: 0,
      active: 0,
      planning: 0,
      completed: 0,
      totalTasks: 0,
      completedTasks: 0,
    });
  }, [projectsWithStats]);

  const overallProgress = totalStats.totalTasks > 0
    ? Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100)
    : 0;

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'InProgress': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'Planning': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'OnHold': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'Completed': return '完了';
      case 'InProgress': return '進行中';
      case 'Planning': return '計画中';
      case 'OnHold': return '保留';
      default: return status;
    }
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            すべてのプロジェクト
          </h1>
          <p className="text-muted-foreground">
            全 {totalStats.total} 件のプロジェクト
          </p>
        </div>
        {onNewProject && (
          <Button onClick={onNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            新規プロジェクト
          </Button>
        )}
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総プロジェクト</p>
                <p className="text-2xl font-bold">{totalStats.total}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">進行中</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">計画中</p>
                <p className="text-2xl font-bold text-yellow-600">{totalStats.planning}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">完了</p>
                <p className="text-2xl font-bold text-green-600">{totalStats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">全体進捗</p>
                <p className="text-2xl font-bold text-purple-600">{overallProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルター・ソート */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="プロジェクトを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* フィルター */}
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="フィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="active">進行中</SelectItem>
                <SelectItem value="planning">計画中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>

            {/* ソート */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <div className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="並び替え" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">名前</SelectItem>
                <SelectItem value="status">ステータス</SelectItem>
                <SelectItem value="progress">進捗率</SelectItem>
                <SelectItem value="startDate">開始日</SelectItem>
                <SelectItem value="endDate">終了日</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* プロジェクト一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedProjects.map((project) => (
          <Card 
            key={project.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onProjectClick?.(project)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                <FolderKanban className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 説明 */}
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* 期間 */}
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {format(project.start, 'yyyy/MM/dd', { locale: ja })} - {format(project.end, 'yyyy/MM/dd', { locale: ja })}
                </span>
              </div>

              {/* タスク統計 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                    <span>{project.stats.completedTasks}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-blue-600" />
                    <span>{project.stats.inProgressTasks}</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1 text-red-600" />
                    <span>{project.stats.overdueTasks}</span>
                  </div>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">進捗率</span>
                  <span className="font-semibold text-purple-600">{project.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* 担当者 */}
              {project.manager && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">PM: </span>
                  <span>{project.manager}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状態 */}
      {sortedProjects.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderKanban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">プロジェクトが見つかりません</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? '検索条件を変更してください' : 'プロジェクトを作成してください'}
              </p>
              {onNewProject && (
                <Button onClick={onNewProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  新規プロジェクト
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
