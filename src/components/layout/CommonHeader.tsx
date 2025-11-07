import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserProfile } from '@/components/UserProfile';
import { Menu, RefreshCw } from 'lucide-react';
import { Project } from '@/data/sampleProjects';

interface CommonHeaderProps {
  activeProject?: Project;
  isSaving?: boolean;
  isPowerApps?: boolean;
  dataverseLoading?: boolean;
  onMenuToggle?: () => void;
  onRefresh?: () => void;
}

export function CommonHeader({ 
  activeProject, 
  isSaving, 
  isPowerApps, 
  dataverseLoading,
  onMenuToggle,
  onRefresh 
}: CommonHeaderProps) {
  return (
    <>
      {/* メインヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onMenuToggle}
              variant="ghost"
              size="icon"
              className="hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* アプリケーションロゴ */}
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/logo.svg" 
                alt="Gantt Chart App Logo" 
                className="h-8 w-8"
                onError={(e) => {
                  // SVGが見つからない場合のフォールバック処理
                  console.warn('Logo SVG not found, falling back to text');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-primary">Gantt Chart Manager</h1>
                <p className="text-xs text-muted-foreground">Power Apps Code Apps</p>
              </div>
            </div>
            
            <div className="hidden lg:block h-6 w-px bg-border" />
            {activeProject && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{activeProject.name}</span>
                  <span className="text-xs text-muted-foreground">プロジェクト管理</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isPowerApps && onRefresh && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                disabled={dataverseLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${dataverseLoading ? 'animate-spin' : ''}`} />
                更新
              </Button>
            )}
            <ThemeToggle />
            <div className="hidden md:block">
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* プロジェクト保存中インジケーター */}
      {activeProject && isSaving && (
        <div className="border-b bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 px-4 py-2 bg-primary/90 text-primary-foreground rounded-md shadow-lg animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">保存中...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
