import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, Project, categoryColors, priorityColors, priorityLabels, categoryLabels, getProjectStats } from '@/data/sampleProjects';
import { format, differenceInDays, startOfDay, endOfMonth, eachMonthOfInterval, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { Edit, Upload, Copy, Plus, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { CSVUploadDialog } from './CSVUploadDialog';

// ステータスのラベルとカラー
const statusLabels: Record<Task['status'], string> = {
  NotStarted: '未着手',
  InProgress: '進行中',
  Completed: '完了',
  OnHold: '保留',
  Cancelled: '中止'
};

const statusColors: Record<Task['status'], string> = {
  NotStarted: 'bg-gray-100 text-gray-700 border border-gray-300',
  InProgress: 'bg-blue-100 text-blue-700 border border-blue-300',
  Completed: 'bg-green-100 text-green-700 border border-green-300',
  OnHold: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  Cancelled: 'bg-red-100 text-red-700 border border-red-300'
};

interface GanttTaskRowProps {
  task: Task;
  projectStart: Date;
  projectEnd: Date;
  viewStartDate: Date;
  viewEndDate: Date;
  dayWidth: number;
  allDays: Date[];
  totalTimelineWidth: number;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, newStart: Date, newEnd: Date) => void;
  onTaskStatusChange?: (taskId: string, newStatus: Task['status']) => void;
}

function GanttTaskRow({ task, viewStartDate, viewEndDate, dayWidth, allDays, totalTimelineWidth, onTaskClick, onTaskUpdate, onTaskStatusChange }: GanttTaskRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [draggedDays, setDraggedDays] = useState(0);
  const [resizeMode, setResizeMode] = useState<'none' | 'start' | 'end'>('none');
  const [isResizing, setIsResizing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopyTaskId = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!task.id) {
      setCopyState('error');
      return;
    }
    try {
      await navigator.clipboard.writeText(task.id);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch (err) {
      console.error('Failed to copy Task ID:', err);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };
  
  const taskStartDays = Math.max(0, differenceInDays(task.start, viewStartDate));
  const taskEndDays = Math.min(
    differenceInDays(viewEndDate, viewStartDate),
    differenceInDays(task.end, viewStartDate)
  );
  const taskDuration = taskEndDays - taskStartDays + 1;
  
  const isCompleted = task.status === 'Completed';

  // 進捗率に応じた色を取得
  const getProgressColor = () => {
    const progress = task.progress;
    if (progress === 100 || isCompleted) {
      return "bg-gradient-to-r from-green-500 to-green-600"; // 完了: グリーン
    } else if (progress >= 75) {
      return "bg-gradient-to-r from-lime-400 to-lime-500"; // 75-99%: ライトグリーン
    } else if (progress >= 50) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-500"; // 50-74%: 黄色
    } else if (progress >= 25) {
      return "bg-gradient-to-r from-orange-400 to-orange-500"; // 25-49%: オレンジ
    } else {
      return "bg-gradient-to-r from-red-500 to-red-600"; // 0-24%: 赤
    }
  };

  // ドラッグ中の日付を計算
  const getTooltipText = () => {
    if (isDragging) {
      const newStart = addDays(task.start, draggedDays);
      const newEnd = addDays(task.end, draggedDays);
      return `${format(newStart, 'yyyy/MM/dd')} - ${format(newEnd, 'yyyy/MM/dd')}`;
    } else if (isResizing) {
      if (resizeMode === 'start') {
        const newStart = addDays(task.start, draggedDays);
        return `開始日: ${format(newStart, 'yyyy/MM/dd')}`;
      } else if (resizeMode === 'end') {
        const newEnd = addDays(task.end, draggedDays);
        return `終了日: ${format(newEnd, 'yyyy/MM/dd')}`;
      }
    }
    return '';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDraggedDays(0);
  };

  const handleResizeStart = (e: React.MouseEvent, mode: 'start' | 'end') => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode(mode);
    setDragStartX(e.clientX);
    setDraggedDays(0);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    const deltaX = e.clientX - dragStartX;
    const days = Math.round(deltaX / dayWidth);
    setDraggedDays(days);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      if (draggedDays !== 0 && onTaskUpdate) {
        const newStart = addDays(task.start, draggedDays);
        const newEnd = addDays(task.end, draggedDays);
        onTaskUpdate(task.id, newStart, newEnd);
      }
    } else if (isResizing) {
      setIsResizing(false);
      
      if (draggedDays !== 0 && onTaskUpdate) {
        if (resizeMode === 'start') {
          const newStart = addDays(task.start, draggedDays);
          if (newStart < task.end) {
            onTaskUpdate(task.id, newStart, task.end);
          }
        } else if (resizeMode === 'end') {
          const newEnd = addDays(task.end, draggedDays);
          if (newEnd > task.start) {
            onTaskUpdate(task.id, task.start, newEnd);
          }
        }
      }
      
      setResizeMode('none');
    }
    
    setDraggedDays(0);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStartX, draggedDays]);

  return (
    <div className="gantt-row flex border-b border-border/50 hover:bg-accent/30 transition-colors duration-200 group animate-fade-in">
      {/* Task Info Column */}
      <div 
        className="flex-shrink-0 w-80 p-3 border-r border-border/50 cursor-pointer hover:bg-accent/50 transition-all duration-200"
        onClick={() => onTaskClick?.(task)}
      >
        <div className="space-y-1.5">
          <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{task.name}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground flex-wrap gap-y-1">
            <span className={cn(
              "inline-block w-2 h-2 rounded-full",
              categoryColors[task.category]
            )} />
            <span className="font-medium">{categoryLabels[task.category]}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm",
              priorityColors[task.priority],
              "text-white"
            )}>
              {priorityLabels[task.priority]}
            </span>
            {/* ステータス表示 */}
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              statusColors[task.status]
            )}>
              {statusLabels[task.status]}
            </span>
            <span className="truncate max-w-[120px]">{task.assignee}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-medium">
              {format(task.start, 'MM/dd')} - {format(task.end, 'MM/dd')} <span className="text-primary">({task.duration}日)</span>
            </div>
            <div className="flex items-center gap-2">
              {task.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTaskId}
                  className={cn(
                    'h-6 px-2 text-xs flex items-center gap-1 border border-transparent',
                    copyState === 'copied' && 'text-green-600 bg-green-50 border-green-200',
                    copyState === 'error' && 'text-red-600 bg-red-50 border-red-200'
                  )}
                  title="Task IDをコピー"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copyState === 'copied' ? 'コピー済' : copyState === 'error' ? '失敗' : 'ID'}</span>
                </Button>
              )}
            {/* 完了にするボタン（未完了のみ表示） */}
            {task.status !== 'Completed' && onTaskStatusChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskStatusChange(task.id, 'Completed');
                }}
                className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                ✓ 完了
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Column */}
      <div 
        className="relative h-16 border-r border-border/30"
        style={{ width: `${totalTimelineWidth}px` }}
      >
        {/* 日付グリッドの背景 */}
        <div className="absolute inset-0 flex">
          {allDays.map((day, index) => {
            const dayOfWeek = getDay(day);
            const isSaturday = dayOfWeek === 6;
            const isSunday = dayOfWeek === 0;
            
            return (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 border-r border-border/20",
                  isSunday && "bg-red-50/30 dark:bg-red-950/10",
                  isSaturday && "bg-blue-50/30 dark:bg-blue-950/10"
                )}
                style={{ width: `${dayWidth}px` }}
              />
            );
          })}
        </div>
        
        <div className="absolute inset-0 flex items-center px-1 z-10">
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "h-7 rounded-md flex items-center px-3 text-xs font-bold transition-all duration-300",
              "shadow-soft cursor-move select-none",
              "relative overflow-visible",
              isDragging && "opacity-70 cursor-grabbing",
              isResizing && "opacity-70",
              getProgressColor(),
              // ダークモード対応のテキストカラー
              "text-white dark:text-white"
            )}
            style={{
              left: `${resizeMode === 'start' ? (taskStartDays + draggedDays) * dayWidth : (taskStartDays + (isDragging ? draggedDays : 0)) * dayWidth}px`,
              width: `${Math.max(
                resizeMode === 'start' ? (taskDuration - draggedDays) * dayWidth 
                : resizeMode === 'end' ? (taskDuration + draggedDays) * dayWidth 
                : taskDuration * dayWidth, 
                dayWidth
              )}px`,
            }}
          >
            {/* 左端リサイズハンドル */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'start')}
              className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover:opacity-60 transition-opacity z-20"
              style={{ borderRadius: '4px 0 0 4px' }}
            />
            
            <div className="truncate z-10 drop-shadow-sm">{task.progress}%</div>
            <div 
              className="absolute inset-0 bg-white/10 transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
            
            {/* 右端リサイズハンドル */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'end')}
              className="absolute right-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover:opacity-60 transition-opacity z-20"
              style={{ borderRadius: '0 4px 4px 0' }}
            />
          </div>
          
          {/* ドラッグ中のTooltip */}
          {(isDragging || isResizing) && (
            <div
              className="fixed z-50 px-3 py-2 text-xs font-semibold text-white bg-gray-900 rounded-md shadow-lg pointer-events-none animate-fade-in"
              style={{
                left: `${mousePosition.x + 15}px`,
                top: `${mousePosition.y - 30}px`,
              }}
            >
              {getTooltipText()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GanttChartProps {
  project: Project;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, newStart: Date, newEnd: Date) => void;
  onTaskStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  onProjectEdit?: (project: Project) => void;
  onNewTask?: () => void;
  onTasksUpdated?: () => void; // CSV操作後のデータ更新コールバック
}

export function GanttChart({ project, onTaskClick, onTaskUpdate, onTaskStatusChange, onProjectEdit, onNewTask, onTasksUpdated }: GanttChartProps) {
  console.log('📊 GanttChart render:', {
    projectName: project.name,
    projectId: project.id,
    tasksCount: project.tasks?.length || 0,
    tasks: project.tasks,
    projectStart: project.start,
    projectEnd: project.end
  });

  // CSV関連のstate
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [projectIdCopyState, setProjectIdCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const stats = useMemo(() => getProjectStats(project), [project]);

  const handleCopyProjectId = async () => {
    if (!project.id) {
      setProjectIdCopyState('error');
      setTimeout(() => setProjectIdCopyState('idle'), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(project.id);
      setProjectIdCopyState('copied');
      setTimeout(() => setProjectIdCopyState('idle'), 1500);
    } catch (error) {
      console.error('Failed to copy project ID:', error);
      setProjectIdCopyState('error');
      setTimeout(() => setProjectIdCopyState('idle'), 2000);
    }
  };

  const dayWidth = 24; // ピクセル
  
  // 全タスクの開始日と終了日から表示期間を動的に計算
  const calculateViewDates = () => {
    if (!project.tasks || project.tasks.length === 0) {
      // タスクがない場合はプロジェクトの期間を使用
      return {
        start: startOfDay(project.start),
        end: startOfDay(project.end)
      };
    }

    // 全タスクの最小開始日と最大終了日を取得
    const taskDates = project.tasks.map(task => ({
      start: new Date(task.start),
      end: new Date(task.end)
    }));

    const minStart = new Date(Math.min(...taskDates.map(d => d.start.getTime())));
    const maxEnd = new Date(Math.max(...taskDates.map(d => d.end.getTime())));

    // 少し余白を持たせる（前後1週間）
    const bufferDays = 7;
    const viewStart = addDays(startOfDay(minStart), -bufferDays);
    const viewEnd = addDays(startOfDay(maxEnd), bufferDays);

    console.log('📅 Dynamic view dates:', {
      minStart,
      maxEnd,
      viewStart,
      viewEnd,
      taskCount: project.tasks.length
    });

    return {
      start: viewStart,
      end: viewEnd
    };
  };

  const { start: viewStartDate, end: viewEndDate } = calculateViewDates();

  // 月単位でのヘッダー表示を生成
  const months = eachMonthOfInterval({
    start: viewStartDate,
    end: viewEndDate
  });

  // 各月の幅を計算（その月がプロジェクト期間にどれだけ含まれるかで決まる）
  const monthWidths = months.map(monthStart => {
    const monthEnd = endOfMonth(monthStart);
    const effectiveStart = monthStart < viewStartDate ? viewStartDate : monthStart;
    const effectiveEnd = monthEnd > viewEndDate ? viewEndDate : monthEnd;
    const daysInMonth = differenceInDays(effectiveEnd, effectiveStart) + 1;
    return daysInMonth * dayWidth;
  });

  // 全日付を生成
  const allDays = eachDayOfInterval({
    start: viewStartDate,
    end: viewEndDate
  });

  // タイムライン全体の幅を計算
  const totalTimelineWidth = allDays.length * dayWidth;

  const handleCSVUploadComplete = () => {
    setIsCSVDialogOpen(false);
    onTasksUpdated?.();
  };

  return (
    <>
      <Card className="flex-1 shadow-medium hover:shadow-large transition-shadow duration-300 border-border/50 animate-scale-in">
      <CardContent className="p-0">
        {/* プロジェクト情報ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">{project.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>開始: {format(project.start, 'yyyy/MM/dd')}</span>
              <span>終了: {format(project.end, 'yyyy/MM/dd')}</span>
              <span>マネージャー: {project.manager}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-muted-foreground">進行中</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{stats.inProgressTasks}</span>
              </div>
              {(stats.overdueTasks > 0) && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-muted-foreground">遅延</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">{stats.overdueTasks}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-purple-50 dark:bg-purple-950/20">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-muted-foreground">進捗率</span>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{stats.completionRate}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              {onNewTask && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onNewTask}
                  className="shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新規タスク
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-3 border-b border-border/50 bg-muted/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-foreground">プロジェクトID:</span>
            <span className="font-mono bg-background border border-border/60 rounded px-2 py-1 text-[11px] sm:text-xs">
              {project.id || '未設定'}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCopyProjectId}
              className={cn(
                'h-8 px-2 text-xs sm:text-sm flex items-center gap-1 border border-transparent',
                projectIdCopyState === 'copied' && 'text-green-600 bg-green-50 border-green-200',
                projectIdCopyState === 'error' && 'text-red-600 bg-red-50 border-red-200'
              )}
            >
              <Copy className="h-3 w-3" />
              {projectIdCopyState === 'copied' ? 'コピー済' : projectIdCopyState === 'error' ? '失敗' : 'コピー'}
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCSVDialogOpen(true)}
              className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/70"
            >
              <Upload className="h-4 w-4 mr-2" />
              CSVアップロード
            </Button>
            {onProjectEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onProjectEdit(project)}
                className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/70"
              >
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-auto relative">
          {/* Timeline Header */}
          <div className="sticky top-0 z-20 flex border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
            <div className="flex-shrink-0 w-80 p-3 border-r border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
              <div className="font-bold text-sm text-foreground uppercase tracking-wide">タスク名</div>
            </div>
            <div className="flex bg-gradient-to-r from-muted/30 to-muted/10">
              {months.map((monthStart, index) => (
                <div
                  key={index}
                  className="gantt-grid-line flex-shrink-0 p-3 text-center border-r border-border/30 hover:bg-accent/20 transition-colors"
                  style={{ 
                    width: `${monthWidths[index]}px`,
                    animationDelay: `${index * 100}ms` 
                  }}
                >
                  <div className="font-bold text-sm text-foreground">{format(monthStart, 'yyyy年MM月')}</div>
                  <div className="text-xs text-primary font-medium uppercase">
                    {format(monthStart, 'MMM')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 日付グリッド */}
          <div className="sticky top-[3.75rem] z-10 flex border-b border-border/50 bg-muted/5">
            <div className="flex-shrink-0 w-80 border-r border-border/50 bg-muted/5" />
            <div className="flex bg-muted/5">
              {allDays.map((day, index) => {
                const dayOfWeek = getDay(day);
                const isSaturday = dayOfWeek === 6;
                const isSunday = dayOfWeek === 0;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex-shrink-0 text-center border-r border-border/20 py-1 text-xs font-medium",
                      isSunday && "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
                      isSaturday && "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
                      !isSunday && !isSaturday && "text-muted-foreground"
                    )}
                    style={{ width: `${dayWidth}px` }}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Rows */}
          <div>
            {project.tasks.map((task) => (
              <GanttTaskRow
                key={task.id}
                task={task}
                projectStart={project.start}
                projectEnd={project.end}
                viewStartDate={viewStartDate}
                viewEndDate={viewEndDate}
                dayWidth={dayWidth}
                allDays={allDays}
                totalTimelineWidth={totalTimelineWidth}
                onTaskClick={onTaskClick}
                onTaskUpdate={onTaskUpdate}
                onTaskStatusChange={onTaskStatusChange}
              />
            ))}
          </div>
        </div>
      </CardContent>
      </Card>
      
      {isCSVDialogOpen && (
        <CSVUploadDialog
          project={project}
          onClose={() => setIsCSVDialogOpen(false)}
          onSuccess={handleCSVUploadComplete}
        />
      )}
    </>
  );
}