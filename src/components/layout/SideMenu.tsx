import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  FolderKanban, 
  ListTodo, 
  ChevronRight,
  Plus,
  LayoutDashboard,
  Search,
  Users,
  Loader2
} from 'lucide-react';
import { Project } from '@/data/sampleProjects';

interface SideMenuProps {
  isOpen: boolean;
  projects: Project[];
  activeProject?: Project;
  onProjectSelect: (project: Project) => void;
  onNewProject?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToMyTasks?: () => void;
  onNavigateToProjectList?: () => void;
  currentView?: 'dashboard' | 'gantt' | 'myTasks' | 'projectList';
  assignees?: SideMenuAssignee[];
  assigneeLoading?: boolean;
  onAssigneeSelect?: (assignee: SideMenuAssignee) => void;
}

export interface SideMenuAssignee {
  id?: string;
  name: string;
  email?: string;
}

export function SideMenu({ 
  isOpen, 
  projects, 
  activeProject,
  onProjectSelect,
  onNewProject,
  onNavigateToDashboard,
  onNavigateToMyTasks,
  onNavigateToProjectList,
  currentView = 'dashboard',
  assignees = [],
  assigneeLoading = false,
  onAssigneeSelect
}: SideMenuProps) {
  const [expandedProjects, setExpandedProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAssignees, setExpandedAssignees] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  // プロジェクトをフィルタリング
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignees = useMemo(() => {
    if (!assignees || assignees.length === 0) {
      return [] as SideMenuAssignee[];
    }
    const query = assigneeSearch.trim().toLowerCase();
    if (!query) {
      return assignees;
    }
    return assignees.filter((assignee) => {
      const nameMatch = assignee.name.toLowerCase().includes(query);
      const emailMatch = assignee.email ? assignee.email.toLowerCase().includes(query) : false;
      return nameMatch || emailMatch;
    });
  }, [assignees, assigneeSearch]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-0"
      )}
    >
      <div className={cn("h-full flex flex-col overflow-y-auto", !isOpen && "hidden")}>
        <div className="flex-1">
          <div className="p-4 space-y-6">
            {/* ダッシュボード・個人セクション */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                ホーム
              </h3>
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={onNavigateToDashboard}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                ダッシュボード
              </Button>
              <Button
                variant={currentView === 'myTasks' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={onNavigateToMyTasks}
              >
                <ListTodo className="h-4 w-4 mr-2" />
                マイタスク
              </Button>
            </div>

            {/* プロジェクトセクション */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  プロジェクト
                </h3>
                {onNewProject && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={onNewProject}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* プロジェクト一覧ボタン */}
              <Button
                variant={currentView === 'projectList' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={onNavigateToProjectList}
              >
                <FolderKanban className="h-4 w-4 mr-2" />
                すべてのプロジェクト
              </Button>

              {/* プロジェクト検索 */}
              <div className="relative px-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="プロジェクトを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start px-2"
                onClick={() => setExpandedProjects(!expandedProjects)}
              >
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 mr-1 transition-transform",
                    expandedProjects && "rotate-90"
                  )} 
                />
                <FolderKanban className="h-4 w-4 mr-2" />
                すべてのプロジェクト ({filteredProjects.length})
              </Button>

              {expandedProjects && (
                <div className="ml-6 space-y-1">
                  {filteredProjects.map((project) => (
                    <Button
                      key={project.id}
                      variant={activeProject?.id === project.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => onProjectSelect(project)}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="truncate">{project.name}</span>
                        {activeProject?.id === project.id && (
                          <span className="text-xs text-primary">●</span>
                        )}
                      </div>
                    </Button>
                  ))}
                  
                  {filteredProjects.length === 0 && (
                    <div className="text-xs text-muted-foreground px-2 py-2">
                      {searchQuery ? '検索結果がありません' : 'プロジェクトがありません'}
                    </div>
                  )}
                </div>
              )}

                    {/* 担当者セクション */}
                    {assignees && assignees.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            担当者
                          </h3>
                        </div>

                        <div className="relative px-2">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="担当者を検索..."
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            className="pl-8 h-9 text-sm"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          className="w-full justify-start px-2"
                          onClick={() => setExpandedAssignees(!expandedAssignees)}
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 mr-1 transition-transform",
                              expandedAssignees && "rotate-90"
                            )}
                          />
                          <Users className="h-4 w-4 mr-2" />
                          担当者一覧 ({filteredAssignees.length})
                        </Button>

                        {expandedAssignees && (
                          <div className="ml-6 space-y-1">
                            {assigneeLoading ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>担当者を読み込み中...</span>
                              </div>
                            ) : filteredAssignees.length > 0 ? (
                              filteredAssignees.map((assignee) => (
                                <Button
                                  key={assignee.id ?? assignee.name}
                                  variant="ghost"
                                  className="w-full justify-start text-sm"
                                  onClick={() => {
                                    onAssigneeSelect?.(assignee);
                                  }}
                                >
                                  <div className="flex flex-col items-start text-left">
                                    <span className="font-medium text-foreground">{assignee.name}</span>
                                    {assignee.email && (
                                      <span className="text-xs text-muted-foreground">{assignee.email}</span>
                                    )}
                                  </div>
                                </Button>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground px-2 py-2">
                                {assigneeSearch ? '検索結果がありません' : '担当者が見つかりません'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
            </div>


          </div>
        </div>

        {/* フッター */}
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            <div className="font-semibold">Gantt Chart Manager</div>
            <div>v1.11.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
