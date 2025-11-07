/**
 * プロジェクトフォームコンポーネント
 * プロジェクトの作成・編集に使用
 * プロジェクトマネージャーをSystemUsersからコンボボックスで選択
 */

import React, { useState } from 'react';
import { Project } from '@/data/sampleProjects';
import { useDataverseUsers } from '@/hooks/useDataverseUsers';
import { Button } from '@/components/ui/button';
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
import { Calendar, User, FileText, Clock, Trash2 } from 'lucide-react';

interface ProjectFormProps {
  project?: Partial<Project>;
  onSave: (project: Partial<Project>) => void;
  onCancel: () => void;
  onDelete?: (projectId: string) => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSave, onCancel, onDelete, isLoading }: ProjectFormProps) {
  const { users, loading: usersLoading } = useDataverseUsers();
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: project?.name || '',
    description: project?.description || '',
    start: project?.start || new Date(),
    end: project?.end || new Date(),
    manager: project?.manager || '',
    managerId: project?.managerId || '',
    status: project?.status || 'Planning',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleManagerChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    setFormData({
      ...formData,
      managerId: userId,
      manager: selectedUser?.displayName || '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        {/* プロジェクト名 */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            プロジェクト名
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例: Office 365 導入プロジェクト"
            required
            className="bg-white/50 backdrop-blur-sm border-white/20"
          />
        </div>

        {/* プロジェクトマネージャー */}
        <div className="space-y-2">
          <Label htmlFor="manager" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            プロジェクトマネージャー
          </Label>
          <Select
            value={formData.managerId}
            onValueChange={handleManagerChange}
            disabled={usersLoading}
          >
            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/20">
              <SelectValue placeholder="プロジェクトマネージャーを選択" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{user.displayName}</span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground">
                        ({user.email})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 説明 */}
        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="プロジェクトの詳細説明"
            rows={3}
            className="bg-white/50 backdrop-blur-sm border-white/20"
          />
        </div>

        {/* 開始日 */}
        <div className="space-y-2">
          <Label htmlFor="start" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            開始日
          </Label>
          <Input
            id="start"
            type="date"
            value={formData.start ? new Date(formData.start).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, start: new Date(e.target.value) })}
            required
            className="bg-white/50 backdrop-blur-sm border-white/20"
          />
        </div>

        {/* 終了日 */}
        <div className="space-y-2">
          <Label htmlFor="end" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            終了日
          </Label>
          <Input
            id="end"
            type="date"
            value={formData.end ? new Date(formData.end).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, end: new Date(e.target.value) })}
            required
            className="bg-white/50 backdrop-blur-sm border-white/20"
          />
        </div>

        {/* ステータス */}
        <div className="space-y-2">
          <Label htmlFor="status">ステータス</Label>
          <Select
            value={formData.status}
            onValueChange={(value: Project['status']) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/20">
              <SelectValue placeholder="ステータスを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planning">計画中</SelectItem>
              <SelectItem value="InProgress">進行中</SelectItem>
              <SelectItem value="OnHold">保留中</SelectItem>
              <SelectItem value="Completed">完了</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-3 justify-between pt-4">
        <div>
          {/* 削除ボタン（編集モードのみ表示） */}
          {project?.id && onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(project.id!)}
              disabled={isLoading}
              className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/70"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </form>
  );
}
