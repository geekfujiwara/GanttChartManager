import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useDataverseUsers, StandardUser } from '@/hooks/useDataverseUsers';
import { User } from 'lucide-react';
import { Task } from '@/data/sampleProjects';
import { format } from 'date-fns';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (task: Omit<Task, 'id'>) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDialog({ open, onOpenChange, task, onSave, onDelete }: TaskDialogProps) {
  console.log('📝 TaskDialog render:', {
    open,
    hasTask: !!task,
    task: task
  });

  const { 
    users, 
    loading: usersLoading, 
    currentUser,
    views,
    viewsLoading,
    currentViewId,
    changeView
  } = useDataverseUsers();
  
  console.log('👤 Dataverse SystemUser state:', {
    currentUser,
    usersCount: users.length,
    usersLoading,
    viewsCount: views.length,
    viewsLoading,
    currentViewId,
    views,
    users: users.slice(0, 3) // 最初の3人だけログ出力
  });
  
  console.log('🎨 View selector condition:', {
    'views.length > 0': views.length > 0,
    viewsLength: views.length,
    shouldShowSelector: views.length > 0
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignee: '',
    assigneeId: '',
    priority: 'Medium' as Task['priority'],
    category: 'Planning' as Task['category'],
    status: 'NotStarted' as Task['status'],
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
    progress: 0,
    dependencies: [] as string[]
  });
  const [dateError, setDateError] = useState<string | null>(null);

  const validateDates = (start: string, end: string): string | null => {
    if (!start || !end) {
      return null;
    }
    return new Date(start) <= new Date(end) ? null : '開始日は終了日以前の日付を選択してください。';
  };

  // taskプロパティが変更されたとき、またはダイアログが開いたときにformDataを更新
  useEffect(() => {
    // ダイアログが閉じているときは何もしない
    if (!open) {
      return;
    }

    console.log('🔄 TaskDialog useEffect triggered:', {
      open,
      hasTask: !!task,
      currentUser,
      currentUserDisplayName: currentUser?.displayName,
      currentUserId: currentUser?.id
    });

    if (task) {
      // 既存タスクの編集
      const existingData = {
        name: task.name,
        description: task.description || '',
        assignee: task.assignee,
        assigneeId: task.assigneeId || '',
        priority: task.priority,
        category: task.category,
        status: task.status,
        start: format(task.start, 'yyyy-MM-dd'),
        end: format(task.end, 'yyyy-MM-dd'),
        progress: task.progress,
        dependencies: task.dependencies
      };
      setFormData(existingData);
      setDateError(validateDates(existingData.start, existingData.end));
    } else {
      // 新規作成時は現在のユーザーをプリセット（フォームをリセット）
      const newFormData = {
        name: '',
        description: '',
        assignee: currentUser?.displayName || '',
        assigneeId: currentUser?.id || '',
        priority: 'Medium' as Task['priority'],
        category: 'Planning' as Task['category'],
        status: 'NotStarted' as Task['status'],
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
        progress: 0,
        dependencies: []
      };
      
      console.log('✨ New task formData (reset):', newFormData);
  setFormData(newFormData);
  setDateError(validateDates(newFormData.start, newFormData.end));
    }
  }, [open, task, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    const dateValidationMessage = validateDates(formData.start, formData.end);
    if (dateValidationMessage) {
      setDateError(dateValidationMessage);
      return;
    }
    setDateError(null);
    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    console.log('💾 TaskDialog handleSubmit:', {
      formData,
      assigneeId: formData.assigneeId,
      status: formData.status,
      priority: formData.priority,
      category: formData.category
    });

    const taskData: Omit<Task, 'id'> = {
      name: formData.name,
      description: formData.description,
      assignee: formData.assignee,
      assigneeId: formData.assigneeId, // SystemUser GUID (Dataverse systemuserid)
      priority: formData.priority,
      category: formData.category,
      status: formData.status,
      start: startDate,
      end: endDate,
      duration,
      progress: formData.progress,
      dependencies: formData.dependencies
    };

    console.log('📦 TaskData to save:', taskData);

    onSave(taskData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'タスク編集' : '新しいタスク'}
          </DialogTitle>
          <DialogDescription>
            プロジェクトタスクの詳細を入力してください。
          </DialogDescription>
        </DialogHeader>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          onKeyDown={(e) => {
            // Combobox内でのEnterキーはフォーム送信しない
            if (e.key === 'Enter' && e.target instanceof HTMLElement) {
              const isInCombobox = e.target.closest('[role="combobox"]') || 
                                   e.target.closest('[cmdk-input]');
              if (isInCombobox) {
                e.preventDefault();
              }
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">タスク名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="タスク名を入力"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="assignee">担当者</Label>
                {views.length > 0 ? (
                  <select
                    value={currentViewId}
                    onChange={(e) => {
                      console.log('🔄 View changed to:', e.target.value);
                      changeView(e.target.value);
                    }}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    title="ビューを選択"
                  >
                    {views.map((view) => (
                      <option key={view.savedqueryid} value={view.savedqueryid}>
                        {view.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  !viewsLoading && (
                    <span className="text-xs text-gray-500">ビュー: {views.length}個</span>
                  )
                )}
              </div>
              {usersLoading ? (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">ユーザー読み込み中...</span>
                </div>
              ) : (
                <>
                  {console.log('🔍 TaskDialog Combobox options:', {
                    usersCount: users.length,
                    currentViewId,
                    users: users,
                    options: [
                      { value: "", label: "担当者なし" },
                      ...users.map((user: StandardUser) => ({
                        value: user.id,
                        label: user.displayName,
                        description: user.email || user.jobTitle
                      }))
                    ]
                  })}
                  <Combobox
                    value={formData.assigneeId || ""}
                    onValueChange={(value) => {
                      console.log('📝 Combobox onValueChange:', { value });
                      const selectedUser = users.find((u: StandardUser) => u.id === value);
                      console.log('👤 Selected user:', selectedUser);
                      setFormData({ 
                        ...formData, 
                        assignee: selectedUser ? selectedUser.displayName : "",
                        assigneeId: value || ""
                      });
                    }}
                    options={[
                      { value: "", label: "担当者なし" },
                      ...users.map((user: StandardUser) => ({
                        value: user.id,
                        label: user.displayName,
                        description: user.email || user.jobTitle
                      }))
                    ]}
                    placeholder="担当者を検索..."
                    searchPlaceholder="名前またはメールアドレスで検索"
                    emptyMessage="該当するユーザーが見つかりません"
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="タスクの詳細説明"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">優先度</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">低</SelectItem>
                  <SelectItem value="Medium">中</SelectItem>
                  <SelectItem value="High">高</SelectItem>
                  <SelectItem value="Critical">緊急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Task['category'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">計画</SelectItem>
                  <SelectItem value="Setup">設定</SelectItem>
                  <SelectItem value="Migration">移行</SelectItem>
                  <SelectItem value="Training">トレーニング</SelectItem>
                  <SelectItem value="Testing">テスト</SelectItem>
                  <SelectItem value="GoLive">本稼働</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  console.log('📝 Status changed:', { from: formData.status, to: value });
                  setFormData({ ...formData, status: value as Task['status'] });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotStarted">未開始</SelectItem>
                  <SelectItem value="InProgress">進行中</SelectItem>
                  <SelectItem value="Completed">完了</SelectItem>
                  <SelectItem value="OnHold">保留</SelectItem>
                  <SelectItem value="Cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">進捗率 (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">開始日 *</Label>
              <Input
                id="start"
                type="date"
                value={formData.start}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => {
                    const next = { ...prev, start: value };
                    setDateError(validateDates(next.start, next.end));
                    return next;
                  });
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">終了日 *</Label>
              <Input
                id="end"
                type="date"
                value={formData.end}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => {
                    const next = { ...prev, end: value };
                    setDateError(validateDates(next.start, next.end));
                    return next;
                  });
                }}
                required
              />
            </div>
          </div>

          {dateError && (
            <p className="text-sm text-destructive">{dateError}</p>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {/* 完了にするボタン（編集モード & 未完了の場合のみ表示） */}
              {task && formData.status !== 'Completed' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      status: 'Completed',
                      progress: 100
                    });
                  }}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <span className="mr-2">✓</span>
                  完了にする
                </Button>
              )}
              
              {/* 削除ボタン（編集モードのみ表示） */}
              {task && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  削除
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit">
                {task ? '更新' : '作成'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
  onSave: (project: any) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectDialog({ open, onOpenChange, project, onSave, onDelete }: ProjectDialogProps) {
  const { users, loading: usersLoading } = useDataverseUsers();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    managerId: '',
    status: 'Planning',
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDeleteOpen(false);
    }
  }, [open]);

  // projectプロパティが変更されたときにformDataを更新
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        manager: project.manager,
        managerId: project.managerId || '',
        status: project.status,
        start: format(project.start, 'yyyy-MM-dd'),
        end: format(project.end, 'yyyy-MM-dd')
      });
    } else {
      // 新規作成時はフォームをリセット
      setFormData({
        name: '',
        description: '',
        manager: '',
        managerId: '',
        status: 'Planning',
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...project,
      name: formData.name,
      description: formData.description,
      manager: formData.manager,
      managerId: formData.managerId,
      status: formData.status,
      start: new Date(formData.start),
      end: new Date(formData.end),
      tasks: project?.tasks || []
    };

    onSave(projectData);
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'プロジェクト編集' : '新しいプロジェクト'}
          </DialogTitle>
          <DialogDescription>
            プロジェクトの基本情報を入力してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">プロジェクト名 *</Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="プロジェクト名を入力"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">説明</Label>
            <Textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="プロジェクトの説明"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-manager">プロジェクトマネージャー</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => {
                const selectedUser = users.find(u => u.id === value);
                setFormData({ 
                  ...formData, 
                  managerId: value,
                  manager: selectedUser?.displayName || ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "読み込み中..." : "マネージャーを選択"} />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-status">ステータス</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planning">計画中</SelectItem>
                <SelectItem value="InProgress">進行中</SelectItem>
                <SelectItem value="Completed">完了</SelectItem>
                <SelectItem value="OnHold">保留</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-start">開始日 *</Label>
              <Input
                id="project-start"
                type="date"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-end">終了予定日 *</Label>
              <Input
                id="project-end"
                type="date"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {/* 削除ボタン（編集モードのみ表示） */}
                {project?.id && onDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    削除
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit">
                  {project ? '更新' : '作成'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>プロジェクトを削除しますか？</DialogTitle>
          <DialogDescription>
            この操作は元に戻せません。関連するタスクも削除されます。
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDeleteOpen(false)}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (project?.id && onDelete) {
                onDelete(project.id);
              }
              setConfirmDeleteOpen(false);
              onOpenChange(false);
            }}
          >
            削除する
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}