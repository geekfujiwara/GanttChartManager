import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project, getProjectStats } from '@/data/sampleProjects';
import { Calendar, TrendingUp, Users, Clock, Search, FolderOpen, CheckCircle2, AlertCircle, PlayCircle, ChevronLeft, ChevronRight, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ProjectSelectorProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
}

export function ProjectSelector({ projects, onProjectSelect, onNewProject }: ProjectSelectorProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 1ページあたり9件表示

  // フィルター処理
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ページネーション計算
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  // フィルター変更時にページをリセット
  const handleFilterChange = (newStatusFilter: string) => {
    setStatusFilter(newStatusFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearchText: string) => {
    setSearchText(newSearchText);
    setCurrentPage(1);
  };

  // ステータス別の色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'InProgress':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'OnHold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // ステータスアイコン
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planning':
        return <Calendar className="h-4 w-4" />;
      case 'InProgress':
        return <PlayCircle className="h-4 w-4" />;
      case 'OnHold':
        return <AlertCircle className="h-4 w-4" />;
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <FolderOpen className="h-10 w-10 text-primary" />
            プロジェクト選択
          </h1>
          <p className="text-muted-foreground text-lg">
            管理するプロジェクトを選択してください
          </p>
        </div>

        {/* フィルター */}
        <Card className="mb-6 shadow-lg animate-slide-in">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 検索 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="プロジェクト名で検索..."
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* ステータスフィルター */}
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="Planning">計画中</SelectItem>
                  <SelectItem value="InProgress">進行中</SelectItem>
                  <SelectItem value="OnHold">保留中</SelectItem>
                  <SelectItem value="Completed">完了</SelectItem>
                </SelectContent>
              </Select>

              {/* 新規プロジェクト */}
              <Button onClick={onNewProject} className="w-full md:w-auto">
                <FolderOpen className="h-4 w-4 mr-2" />
                新規プロジェクト
              </Button>

              {/* SystemUsersテストページ */}
              <Button 
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('test', 'systemusers');
                  window.location.href = `${window.location.pathname}?${params.toString()}`;
                }}
                variant="outline"
                className="w-full md:w-auto"
              >
                <TestTube className="h-4 w-4 mr-2" />
                SystemUsersテスト
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* プロジェクトギャラリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProjects.length > 0 ? (
            currentProjects.map((project, index) => {
              const stats = getProjectStats(project);
              return (
                <Card
                  key={project.id}
                  className={cn(
                    "hover:shadow-xl transition-all duration-300 cursor-pointer group",
                    "hover:scale-[1.02] animate-scale-in border-2 hover:border-primary"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onProjectSelect(project)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                        getStatusColor(project.status)
                      )}>
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'プロジェクトの説明はありません'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* 統計情報 */}
                    <div className="space-y-3">
                      {/* 進捗率 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            進捗率
                          </span>
                          <span className="font-bold text-primary">{stats.avgProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${stats.avgProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* タスク数 */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          タスク数
                        </span>
                        <span className="font-semibold">{stats.totalTasks}件</span>
                      </div>

                      {/* 完了タスク */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          完了タスク
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {stats.completedTasks}件
                        </span>
                      </div>

                      {/* 期限切れタスク */}
                      {stats.overdueTasks > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="h-3 w-3" />
                            期限切れ
                          </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {stats.overdueTasks}件
                          </span>
                        </div>
                      )}

                      {/* 期間 */}
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(project.start, 'yyyy/MM/dd')} - {format(project.end, 'yyyy/MM/dd')}
                          </span>
                        </div>
                      </div>

                      {/* マネージャー */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>マネージャー: {project.manager}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">
                条件に一致するプロジェクトが見つかりません
              </p>
              <Button onClick={() => { setSearchText(''); setStatusFilter('all'); setCurrentPage(1); }} variant="outline" className="mt-4">
                フィルターをクリア
              </Button>
            </div>
          )}
        </div>

        {/* ページネーション */}
        {filteredProjects.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-center gap-4 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
              <span className="ml-2">ページ</span>
              <span className="text-xs">({filteredProjects.length}件中 {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)}件を表示)</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2"
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 統計サマリー */}
        {filteredProjects.length > 0 && (
          <Card className="mt-6 shadow-lg animate-fade-in">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{filteredProjects.length}</div>
                  <div className="text-sm text-muted-foreground">プロジェクト数</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {filteredProjects.filter(p => p.status === 'InProgress').length}
                  </div>
                  <div className="text-sm text-muted-foreground">進行中</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredProjects.filter(p => p.status === 'Planning').length}
                  </div>
                  <div className="text-sm text-muted-foreground">計画中</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {filteredProjects.filter(p => p.status === 'Completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">完了</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
