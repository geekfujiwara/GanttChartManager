# コンポーネントテンプレート集

このドキュメントは、再利用可能なコンポーネントテンプレートをまとめたものです。

---

## 目次

1. [レイアウトコンポーネント](#レイアウトコンポーネント)
2. [ヘッダーコンポーネント](#ヘッダーコンポーネント)
3. [サイドメニューコンポーネント](#サイドメニューコンポーネント)
4. [ダッシュボードコンポーネント](#ダッシュボードコンポーネント)
5. [統計カードコンポーネント](#統計カードコンポーネント)
6. [リストビューコンポーネント](#リストビューコンポーネント)

---

## レイアウトコンポーネント

### AppLayout.tsx

メインアプリケーションレイアウト

```tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export function AppLayout({ 
  header, 
  sidebar, 
  children,
  sidebarOpen = true 
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      {header}

      {/* サイドバー */}
      {sidebar}

      {/* メインコンテンツ */}
      <main 
        className={cn(
          "transition-all duration-300 pt-16",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        <div className="h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---

## ヘッダーコンポーネント

### CommonHeader.tsx（テンプレート）

```tsx
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Menu } from 'lucide-react';

interface CommonHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function CommonHeader({ 
  title, 
  subtitle,
  onMenuToggle,
  actions,
  rightContent
}: CommonHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* 左側 */}
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <Button
              onClick={onMenuToggle}
              variant="ghost"
              size="icon"
              className="hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {(title || subtitle) && (
            <div className="hidden md:flex flex-col">
              {title && (
                <span className="font-semibold text-foreground">{title}</span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {/* 中央（アクション） */}
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}

        {/* 右側 */}
        <div className="flex items-center space-x-2">
          {rightContent}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

---

## サイドメニューコンポーネント

### SideMenu.tsx（テンプレート）

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  collapsible?: boolean;
}

interface SideMenuProps {
  isOpen: boolean;
  sections: MenuSection[];
  footer?: React.ReactNode;
  appName?: string;
  version?: string;
}

export function SideMenu({ 
  isOpen, 
  sections,
  footer,
  appName = 'アプリ名',
  version = '1.0.0'
}: SideMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.title))
  );

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

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
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                {/* セクションヘッダー */}
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                  {section.collapsible && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => toggleSection(section.title)}
                    >
                      <ChevronRight 
                        className={cn(
                          "h-3 w-3 transition-transform",
                          expandedSections.has(section.title) && "rotate-90"
                        )} 
                      />
                    </Button>
                  )}
                </div>

                {/* メニュー項目 */}
                {(!section.collapsible || expandedSections.has(section.title)) && (
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Button
                        key={item.id}
                        variant={item.active ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={item.onClick}
                      >
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        {item.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="border-t border-border p-4">
          {footer || (
            <div className="text-xs text-muted-foreground">
              <div className="font-semibold">{appName}</div>
              <div>v{version}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```

---

## ダッシュボードコンポーネント

### DashboardLayout.tsx

```tsx
interface DashboardLayoutProps {
  welcomeMessage?: React.ReactNode;
  statsCards: React.ReactNode;
  mainContent: React.ReactNode;
}

export function DashboardLayout({
  welcomeMessage,
  statsCards,
  mainContent
}: DashboardLayoutProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ウェルカムメッセージ */}
      {welcomeMessage && (
        <div className="mb-8">
          {welcomeMessage}
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards}
      </div>

      {/* メインコンテンツ */}
      {mainContent}
    </div>
  );
}
```

---

## 統計カードコンポーネント

### StatCard.tsx

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  colorClass?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon,
  colorClass = 'text-muted-foreground',
  trend
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold ${colorClass}`}>
              {value}
            </p>
            {trend && (
              <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {Icon && (
            <Icon className={`h-10 w-10 ${colorClass}`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 使用例

```tsx
<StatCard
  label="総プロジェクト数"
  value={25}
  icon={FolderKanban}
  colorClass="text-blue-600"
  trend={{ value: 12, isPositive: true }}
/>
```

---

## リストビューコンポーネント

### FilterableList.tsx

```tsx
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowUpDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface FilterableListProps<T> {
  items: T[];
  filterOptions: FilterOption[];
  sortOptions: SortOption[];
  onFilterChange?: (filter: string) => void;
  onSortChange?: (sort: string) => void;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function FilterableList<T>({
  items,
  filterOptions,
  sortOptions,
  onFilterChange,
  onSortChange,
  renderItem,
  emptyMessage = 'アイテムがありません'
}: FilterableListProps<T>) {
  const [filter, setFilter] = useState(filterOptions[0]?.value || 'all');
  const [sort, setSort] = useState(sortOptions[0]?.value || 'default');

  const handleFilterChange = (value: string) => {
    setFilter(value);
    onFilterChange?.(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onSortChange?.(value);
  };

  return (
    <div className="space-y-4">
      {/* フィルター・ソートコントロール */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {items.length} 件
            </div>
          </div>
        </CardContent>
      </Card>

      {/* リスト */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-12">
                <p>{emptyMessage}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          items.map((item, index) => (
            <div key={index}>
              {renderItem(item)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## ユーティリティコンポーネント

### LoadingIndicator.tsx

```tsx
import { RefreshCw } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  inline?: boolean;
}

export function LoadingIndicator({ 
  message = '読み込み中...', 
  inline = false 
}: LoadingIndicatorProps) {
  if (inline) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-primary/90 text-primary-foreground rounded-md">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
```

### EmptyState.tsx

```tsx
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description,
  action 
}: EmptyStateProps) {
  return (
    <div className="text-center text-muted-foreground py-12">
      {Icon && <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />}
      <p className="text-lg font-medium">{title}</p>
      {description && (
        <p className="text-sm mt-2">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### ProgressBar.tsx

```tsx
interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass?: string;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100,
  colorClass = 'bg-primary',
  height = 'md',
  showLabel = false
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      <div className={`w-full ${heightClasses[height]} bg-muted rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground mt-1">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}
```

---

## まとめ

これらのテンプレートを使用することで、以下のメリットがあります：

1. **開発速度の向上**: 基本構造をコピーして素早く実装
2. **一貫性**: すべてのアプリで統一されたデザイン
3. **保守性**: 共通のパターンで理解しやすいコード
4. **拡張性**: カスタマイズが容易な構造

各テンプレートは、実際のプロジェクトのニーズに合わせて自由にカスタマイズできます。
