# 変更履歴

## v1.31.0 (2025-01-21)

### 🎨 Power Apps アプリケーションアイコンの作成と統合

### 新機能
**GeekfujiwaraのCodeAppsDevelopmentStandardに基づく統一アイコンシステム**:

**作成されたアイコンファイル**:
- `logo.svg` (64x64) - メインアプリケーションロゴ
- `favicon.svg` (32x32) - ブラウザタブアイコン  
- `logo-256.svg` (256x256) - 高解像度版
- `logo-gantt.svg` (128x128) - ガントチャート専用

**デザイン要素**:
```
- Power Apps標準カラー (#0078D4, #005A9E)
- ガントチャートバー（タスク進捗表現）
- ライトニングシンボル（Power Appsアイデンティティ）
- コードブラケット < > （Code Appsシンボル）
- プロジェクト進捗インジケーター
```

**統合実装**:
```typescript
// CommonHeaderにロゴ表示追加
<img 
  src="/assets/logo.svg" 
  alt="Gantt Chart App Logo" 
  className="h-8 w-8"
  onError={handleLogoError}
/>
```

**Power Apps設定更新**:
```json
{
  "logoPath": "./public/assets/logo.svg"
}
```

**アクセシビリティ対応**:
- Alt テキスト設定
- エラーハンドリング
- WCAG 2.1 AA準拠カラーコントラスト
- SVGスケーラビリティ

**ファイル構造**:
```
public/assets/
├── logo.svg           # メインロゴ 
├── favicon.svg        # ファビコン
├── logo-256.svg       # 高解像度版
├── logo-gantt.svg     # ガントチャート専用
└── README.md          # ロゴ使用ガイド
```

---

## v1.30.0 (2025-01-21)

### 🔄 マイタスク画面でのタスクカードクリック動作の変更

### 変更内容
**タスクフォーム起動から該当プロジェクト画面への遷移に変更**:

**背景**: 
- タスクフォーム保存後のUI更新が不安定
- マイタスク画面でのタスクカードUI更新の問題
- ユーザビリティ向上のための動作変更

**新しい動作**:
```typescript
const handleMyTaskClick = async (task: Task, project: Project) => {
  // ✅ v1.30.0: タスクカードクリック時は該当プロジェクトに画面遷移
  if (isPowerApps) {
    // Dataverseから最新データを取得してから遷移
    await refreshProjects();
    const refreshedProject = dataverseProjects.find(p => p.id === project.id);
    setActiveProject(refreshedProject || project);
  } else {
    setActiveProject(project);
  }
  
  // ガントチャート画面に遷移
  setCurrentView('gantt');
};
```

**UI改善**:
1. **視覚的ヒント**:
   - プロジェクト名バッジに外部リンクアイコン追加
   - カードにツールチップ「クリックして『プロジェクト名』プロジェクトを表示」
   - ホバー効果でナビゲーション動作を示唆

2. **ユーザー体験の向上**:
   - タスク詳細はプロジェクト画面で確認・編集
   - プロジェクト全体のコンテキストでタスク操作
   - UI更新の問題を回避

**期待される動作フロー**:
1. マイタスク画面でタスクカードをクリック
2. 該当するプロジェクトのガントチャート画面に遷移
3. プロジェクト画面でタスクの詳細確認・編集
4. 安定したUI更新とデータ同期

### 技術詳細
- **Navigation Logic**: `setActiveProject()` + `setCurrentView('gantt')`
- **Data Refresh**: 遷移前にDataverseから最新プロジェクトデータを取得
- **UI Enhancement**: ExternalLinkアイコンとツールチップの追加
- **Error Avoidance**: タスクフォーム関連のUI更新問題を根本的に回避

---

## v1.29.0 (2025-01-21)

### ✨ マイタスク画面での保留・キャンセルタスクの表示対応

### 改善内容
**保留(OnHold)とキャンセル(Cancelled)ステータスのタスクをフィルター対象に追加**:

**問題**: 
- 保留とキャンセルのタスクがマイタスク一覧に表示されていない
- フィルターオプションに保留とキャンセルが含まれていない
- 統計情報に保留とキャンセルのタスク数が表示されていない

**実装内容**:
1. **フィルターオプションの拡張**:
   ```typescript
   type FilterOption = 'all' | 'active' | 'completed' | 'overdue' | 'onhold' | 'cancelled';
   ```

2. **統計カードの追加**:
   - 6つの統計カード(総タスク、進行中、完了、保留、キャンセル、遅延)
   - 適切なアイコンと色分け(保留=黄色、キャンセル=赤色)
   - レスポンシブグリッド(2列→3列→6列)

3. **フィルタリング機能の改善**:
   - 「保留」フィルター: OnHoldステータスのタスクのみ表示
   - 「キャンセル」フィルター: Cancelledステータスのタスクのみ表示
   - 各フィルター用の専用メッセージ

4. **タスクカードの視覚的改善**:
   - 保留タスク: 黄色のバッジ「保留中」(Pauseアイコン)
   - キャンセルタスク: 赤色のバッジ「キャンセル済み」(Xアイコン)
   - キャンセル済みタスクは完了ボタン非表示
   - 保留中タスクは完了ボタン表示(完了への復帰可能)

**ユーザー体験の改善**:
- ✅ 全てのタスクステータスがマイタスク画面で確認可能
- ✅ 保留・キャンセルタスクも適切なフィルタリングで管理
- ✅ ステータス別の統計情報で全体把握が向上
- ✅ 視覚的なバッジでタスク状態が一目で分かる

### 技術詳細
- **Filter Enhancement**: 5つの新フィルターオプション追加
- **Statistics Calculation**: onhold, cancelled カウンターの追加
- **UI Components**: Pause, X アイコンの新規導入
- **Responsive Design**: 統計カードの画面サイズ対応グリッド

---

## v1.28.0 (2025-01-21)

### ✨ マイタスク画面でのローディング表示の統一化

### 改善内容
**「完了にする」ボタンと同様に、タスクフォーム保存時にもローディング表示を統一**:

**実装内容**:
1. **MyTasksViewでローディング状態管理を追加**:
   - `updatingTaskId` state でタスク更新中を追跡
   - 「完了にする」ボタンクリック時にローディング表示
   - 更新中はボタンを無効化し、「更新中...」と表示

2. **更新中のオーバーレイ表示**:
   ```tsx
   {updatingTaskId && (
     <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10">
       <div className="bg-card rounded-lg p-6 shadow-lg border">
         <div className="flex items-center space-x-3">
           <Loader2 className="h-6 w-6 animate-spin text-primary" />
           <p className="text-lg font-semibold">データを更新しています...</p>
         </div>
       </div>
     </div>
   )}
   ```

3. **タスクカードの視覚的フィードバック**:
   - 更新中のタスクは半透明表示
   - 更新中はクリック無効化

**ユーザー体験の改善**:
- ✅ タスクフォーム保存後も「読込中」画面が表示される
- ✅ 「完了にする」ボタンと同じローディング体験
- ✅ 更新が完了するまで明確な視覚的フィードバック
- ✅ データ更新の進行状況が分かりやすい

### 技術詳細
- **Loading State Management**: `useState<string | null>(null)` でタスクIDベースの更新追跡
- **Visual Feedback**: Backdrop blur + Loading spinner + Progress message
- **Interaction Blocking**: 更新中のタスクカード操作無効化
- **Accessibility**: Loading状態の明確な文字表示

---

## v1.27.0 (2025-01-21)

### 🐛 タスクフォーム保存後のUI更新待機修正

### 修正内容
**タスクフォームでデータを保存した後、Reactのstate更新が完了するまで確実に待機してからダイアログを閉じるように修正**:

**問題**: 
- Dataverseが更新される
- `refreshProjects()`が完了する  
- **しかし、ReactのStateの更新が完了する前にダイアログが閉じる**
- そのため、マイタスク画面のリストが最新データで更新されない

**解決策**:
```tsx
// ✅ v1.27.0: Dataverse更新後、プロジェクトリストを再取得してUIの更新を待機
console.log('🔄 Refreshing projects after task save...');
await refreshProjects();

// ✅ ReactのStateが更新されるまで待機
console.log('⏳ Waiting for UI state update...');
await new Promise(resolve => {
  const checkStateUpdate = () => {
    // dataverseProjectsが更新されてprojectsステートに反映されるまで待機
    if (!dataverseLoading && dataverseProjects.length > 0) {
      console.log('✅ UI state updated successfully');
      resolve(undefined);
    } else {
      // 100ms後に再チェック
      setTimeout(checkStateUpdate, 100);
    }
  };
  checkStateUpdate();
});
```

### 技術的背景

**非同期処理の流れ**:
1. `refreshProjects()` (Dataverseからデータ取得)  ✅ await完了
2. `setProjects()` (Reactのstate更新)  ❌ 非同期で実行される
3. UI再レンダリング  ❌ state更新後に実行される
4. ダイアログが閉じる  ❌ 以前はここで2,3を待たずに実行

**修正後**:
1. `refreshProjects()` ✅ await完了  
2. **ReactのState更新完了まで待機** ✅ 新たに追加
3. UI再レンダリング ✅ 完了確認
4. ダイアログが閉じる ✅ 全て完了後に実行

---

## v1.26.0 (2025-01-21)

### 🐛 タスクフォーム保存後のデータリフレッシュ改善

### 修正内容
**タスクフォームでデータを保存した後、マイタスク画面のリストが最新データで更新されるように改善**:
- **変更前**: タスクフォームで保存後、`refreshProjects()`を呼び出していたが、完了を確実に待たずにダイアログを閉じていた
- **変更後**: 「完了にする」ボタンと同じように、`refreshProjects()`の完了を確実に待ってからダイアログを閉じる

### 技術的詳細

**App.tsx**の`handleTaskSave`関数を修正:
```tsx
const handleTaskSave = async (taskData: Omit<Task, 'id'>) => {
  // ...existing code...
  
  if (isPowerApps) {
    if (editingTask) {
      await updateDataverseTask(projectId, editingTask.id, taskData);
    } else {
      await createDataverseTask(projectId, taskData);
    }
    
    // ✅ v1.26.0: Dataverse更新後、プロジェクトリストを再取得（完了にするボタンと同じ処理）
    console.log('🔄 Refreshing projects after task save...');
    await refreshProjects();
    
    // ✅ リフレッシュ完了を確実に待ってからダイアログを閉じる
    console.log('✅ Projects refreshed successfully');
  }
  
  // ダイアログを閉じる
  setEditingTask(null);
  setEditingTaskProjectId(null);
  setTaskDialogOpen(false);
};
```

### 処理の統一
この修正により、以下の操作がすべて同じデータリフレッシュパターンに従うようになりました：
1. **完了にするボタン**: `handleTaskStatusChange` → Dataverse更新 → `refreshProjects()` → UI更新
2. **タスクフォーム保存**: `handleTaskSave` → Dataverse更新 → `refreshProjects()` → UI更新
3. **タスクドラッグ**: `handleTaskUpdate` → Dataverse更新 → `refreshProjects()` → UI更新

---

## v1.25.0 (2025-01-21)

### 🐛 マイタスク画面でのタスクフォームデータ更新修正

### 修正内容
**マイタスク画面でタスクをクリックしたときに、タスクフォームに最新のDataverseデータが表示されない問題を修正**:
- **変更前**: マイタスク画面でタスクをクリックすると、古いキャッシュデータがタスクフォームに表示される
- **変更後**: タスクフォームを開く前にDataverseから最新データを取得し、最新のタスク情報を表示

### 技術的詳細

**App.tsx**の`handleMyTaskClick`関数を修正:
```tsx
const handleMyTaskClick = async (task: Task, project: Project) => {
  // ✅ v1.25.0: タスクフォームを開く前にDataverseから最新データを取得
  if (isPowerApps) {
    console.log('🔄 MyTasks: Refreshing project data before opening task dialog...');
    await refreshProjects();
    
    // リフレッシュ後、最新のタスク情報を取得
    const refreshedProject = dataverseProjects.find(p => p.id === project.id);
    if (refreshedProject) {
      const refreshedTask = refreshedProject.tasks.find(t => t.id === task.id);
      if (refreshedTask) {
        setEditingTask(refreshedTask); // 最新のタスク情報を設定
      }
    }
  }
  
  setEditingTaskProjectId(project.id);
  setTaskDialogOpen(true);
};
```

### 動作の違い
- **Gantt画面**: `activeProject`が設定されているため、v1.24.0のリフレッシュロジックが動作
- **マイタスク画面**: `activeProject`が設定されていないため、個別にリフレッシュが必要
- **修正後**: マイタスク画面でもタスクフォームを開く前にDataverseから最新データを取得

---

## v1.24.0 (2025-01-21)

### 🐛 マイタスク画面データリフレッシュ修正

### 修正内容
**マイタスク画面を開いたときに最新のDataverseデータが表示されない問題を修正**:
- **変更前**: マイタスク画面を開いても古いキャッシュデータが表示される
- **変更後**: マイタスク画面を開くたびにDataverseから最新データを取得して表示

### 技術的詳細

**App.tsx**:
```tsx
// マイタスク画面を開いたときにデータをリフレッシュ
useEffect(() => {
  if (currentView === 'myTasks' && isPowerApps) {
    console.log('🔄 MyTasks view opened - refreshing projects...');
    refreshProjects();
  }
}, [currentView, isPowerApps]);
```

**MyTasksView.tsx**:
```tsx
import { useState, useMemo, useEffect } from 'react'; // ✅ useEffect追加

// コンポーネントマウント時にDataverseデータをリフレッシュ
useEffect(() => {
  if (isPowerAppsEnvironment) {
    console.log('🔄 MyTasksView: Component mounted - refreshing projects...');
    refreshProjects();
  }
}, []); // 空の依存配列でマウント時のみ実行
```

**修正の効果**:
- マイタスク画面に切り替えるたびにDataverseから最新データを取得
- 他の画面でタスクを更新した後、マイタスク画面で最新の状態が表示される
- タスクのステータスや進捗率の変更が即座にマイタスク一覧に反映される

---

## v1.23.0 (2025-01-21)

### ✨ ガントチャートグリッドにステータス表示追加 & 完了ボタン進捗率修正

### 追加機能
**ガントチャートグリッドにステータスバッジを表示**:
- 各タスクのステータスが色分けされたバッジで表示されます
- 未着手（グレー）、進行中（ブルー）、完了（グリーン）、保留（イエロー）、中止（レッド）

### 修正内容
**「完了」ボタンクリック時に進捗率も100%に更新**:
- **変更前**: ステータスのみ「完了」に変更され、進捗率は更新されない
- **変更後**: ステータス='完了' & 進捗率=100%に同時更新

### 技術的詳細

**GanttChart.tsx**:
```tsx
// ステータスのラベルとカラー定義
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

// グリッドにステータスバッジを追加
<span className={cn(
  "px-2 py-0.5 rounded text-xs font-medium",
  statusColors[task.status]
)}>
  {statusLabels[task.status]}
</span>
```

**App.tsx**:
```tsx
// handleTaskStatusChangeで進捗率も更新
const handleTaskStatusChange = async (taskId: string, projectId: string, newStatus: Task['status']) => {
  // ...existing code
  
  // ✅ ステータスが完了の場合は進捗率も100%にする
  const taskData = {
    ...task,
    status: newStatus,
    progress: newStatus === 'Completed' ? 100 : task.progress
  };
  
  console.log('📝 Task data to update:', taskData);
  
  await updateDataverseTask(projectId, taskId, taskData);
  await refreshProjects();
};
```

---

## v1.22.0 (2025-01-21)

### 🔄 データ同期改善

### 改善内容
**タスク・プロジェクト更新時にDataverseからデータをリフレッシュしてUIを最新状態に保つ**:
- タスクフォームで更新した際、即座にDataverseから最新データを取得してUIに反映
- タスクドラッグ更新時も自動リフレッシュ
- タスク削除時も自動リフレッシュ
- プロジェクト作成・更新・削除時も自動リフレッシュ

### 技術的詳細

**App.tsx**:
```tsx
// タスク更新（ドラッグ）にリフレッシュを追加
const handleTaskUpdate = async (taskId: string, newStart: Date, newEnd: Date) => {
  // ...existing code
  if (isPowerApps) {
    await updateDataverseTask(activeProject.id, taskId, taskData);
    
    // ✅ Dataverse更新後、プロジェクトリストを再取得
    console.log('🔄 Refreshing projects after task drag...');
    await refreshProjects();
  }
};

// タスク削除にリフレッシュを追加
const handleTaskDelete = async (taskId: string) => {
  // ...existing code
  if (isPowerApps) {
    await deleteDataverseTask(activeProject.id, taskId);
    
    // ✅ Dataverse更新後、プロジェクトリストを再取得
    console.log('🔄 Refreshing projects after task delete...');
    await refreshProjects();
  }
};

// プロジェクト保存にリフレッシュを追加
const handleProjectSave = async (projectData: Project) => {
  // ...existing code
  if (isPowerApps) {
    if (editingProject) {
      await updateDataverseProject(editingProject.id, projectData);
      
      // ✅ Dataverse更新後、プロジェクトリストを再取得
      console.log('🔄 Refreshing projects after project update...');
      await refreshProjects();
    } else {
      const newProject = await createDataverseProject(projectWithoutTasks);
      if (newProject) {
        // ✅ Dataverse更新後、プロジェクトリストを再取得
        console.log('🔄 Refreshing projects after project create...');
        await refreshProjects();
      }
    }
  }
};
```

**既存のリフレッシュ機能**:
- `handleTaskSave`: ✅ 既に実装済み
- `handleTaskStatusChange`: ✅ 既に実装済み（v1.21.0で実装）
- `handleProjectDelete`: ✅ 既に実装済み

---

## v1.21.0 (2025-01-21)

### ✨ タスク完了ボタン機能拡張

### 追加機能
**タスクフォームとガントチャートグリッドに「完了にする」ボタンを追加**:
- **TaskDialog（タスクフォーム）**: 未完了タスクに「完了にする」ボタンを追加
- **GanttChart（ガントチャートグリッド）**: タスク情報列に「✓ 完了」ボタンを追加

### 機能詳細
- ボタンクリックでステータス='Completed' & 進捗率=100%に設定
- 未完了タスク（status !== 'Completed'）のみボタン表示
- **タスクフォーム**: 緑色の「✓ 完了にする」ボタンを削除ボタンの左側に配置
- **ガントチャート**: コンパクトな「✓ 完了」ボタンを日付表示の右側に配置

### 技術的詳細

**TaskDialog.tsx**:
```tsx
// DialogFooterに「完了にする」ボタン追加（未完了タスクのみ表示）
{task && formData.status !== 'Completed' && (
  <Button
    type="button"
    variant="outline"
    onClick={() => {
      setFormData({ ...formData, status: 'Completed', progress: 100 });
    }}
    className="text-green-600 hover:text-green-700 hover:bg-green-50"
  >
    <span className="mr-2">✓</span>
    完了にする
  </Button>
)}
```

**GanttChart.tsx**:
```tsx
// GanttTaskRowPropsに onTaskStatusChange 追加
interface GanttTaskRowProps {
  // ...existing props
  onTaskStatusChange?: (taskId: string, newStatus: Task['status']) => void;
}

// タスク情報列に「✓ 完了」ボタン追加
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
```

**App.tsx**:
```tsx
// GanttChartに onTaskStatusChange を渡す
<GanttChart 
  project={activeProject}
  onTaskClick={openEditTaskDialog}
  onTaskUpdate={handleTaskUpdate}
  onTaskStatusChange={(taskId, newStatus) => 
    handleTaskStatusChange(taskId, activeProject.id, newStatus)
  }
  onProjectEdit={handleProjectEdit}
  onProjectDelete={handleProjectDelete}
/>
```

---

## v1.20.0 (2025-01-21)

### 🐛 マイタスク タスクフォーム更新バグ修正

### 修正内容
**マイタスクからタスクフォームでステータスを更新してもマイタスク一覧が更新されない問題を修正**:
- **変更前**: タスクフォームでステータスを変更しても、Dataverseには保存されるがマイタスク一覧が更新されない
- **変更後**: タスクフォームでの変更が保存され、マイタスク一覧が自動的にリフレッシュされる

### 技術的詳細

**問題の原因**:
1. マイタスクから開いたタスクは`activeProject`が設定されていない
2. `handleTaskSave`が`if (!activeProject) return;`で終了してしまう
3. Dataverse更新後に`refreshProjects()`を呼んでいなかった

**修正内容**:

**App.tsx**:
```tsx
// 1. editingTaskProjectId状態を追加
const [editingTaskProjectId, setEditingTaskProjectId] = useState<string | null>(null);

// 2. handleMyTaskClick修正
const handleMyTaskClick = (task: Task, project: Project) => {
  setEditingTask(task);
  setEditingTaskProjectId(project.id); // ✅ プロジェクトIDを保存
  setTaskDialogOpen(true);
};

// 3. handleTaskSave修正
const handleTaskSave = async (taskData: Omit<Task, 'id'>) => {
  // activeProjectまたはeditingTaskProjectIdのいずれかを使用
  const projectId = activeProject?.id || editingTaskProjectId;
  if (!projectId) return;
  
  if (isPowerApps) {
    if (editingTask) {
      await updateDataverseTask(projectId, editingTask.id, taskData);
    } else {
      await createDataverseTask(projectId, taskData);
    }
    
    // ✅ Dataverse更新後、プロジェクトリストを再取得
    await refreshProjects();
  }
  
  setEditingTaskProjectId(null); // クリア
};

// 4. handleTaskDialogChange修正
const handleTaskDialogChange = (open: boolean) => {
  if (!open) {
    setEditingTask(null);
    setEditingTaskProjectId(null); // ✅ クリア
  }
};
```

### 影響範囲
- **マイタスク一覧**: タスクフォームでの更新が即座に反映される
- **ガントチャートビュー**: 既存の動作に影響なし
- **タスクダイアログ**: マイタスクからもガントチャートからも正しく動作

---

## v1.19.0 (2025-01-21)

### 🐛 マイタスク バグ修正

### 修正内容
- **マイタスクからタスクフォーム起動時の画面遷移問題を修正**:
  - **変更前**: タスクをクリックするとプロジェクトビューに遷移してしまう
  - **変更後**: マイタスク一覧にとどまり、タスクフォームだけが開く
  
- **完了ボタンクリック後のリフレッシュ問題を修正**:
  - **変更前**: Dataverseにはデータが反映されるが、画面がリフレッシュされない
  - **変更後**: 完了後に自動的にマイタスク一覧がリフレッシュされる

### 技術的詳細
**App.tsx**:
```tsx
// handleMyTaskClick修正
const handleMyTaskClick = (task: Task, project: Project) => {
  // ❌ setActiveProject(project); // プロジェクトを設定しない
  // ❌ setCurrentView('gantt'); // ビューを変更しない
  setEditingTask(task);
  setTaskDialogOpen(true); // タスクフォームのみ開く
};
```

**MyTasksView.tsx**:
```tsx
// refreshProjectsを取得
const { projects, loading, error, refreshProjects } = useDataverseProjects();

// 完了ボタンクリック処理
onClick={async (e) => {
  e.stopPropagation();
  await onTaskStatusChange?.(task.id, task.project.id, 'Completed');
  
  // マイタスク一覧をリフレッシュ
  if (isPowerAppsEnvironment) {
    await refreshProjects();
  }
}}
```

---

## v1.18.0 (2025-01-21)

### ✨ マイタスク 完了ボタン機能追加

### UI改善
- **MyTasksView**:
  - ステータスドロップダウンを廃止
  - 「完了にする」ボタンを追加（未完了タスクのみ表示）
  - 完了済みタスクには「完了済み」バッジを表示
  - ワンクリックでタスクを完了状態に変更可能

### 変更詳細
**変更前**:
```tsx
// ドロップダウンで5つのステータスから選択
<Select value={task.status} onValueChange={...}>
  <SelectItem value="NotStarted">未開始</SelectItem>
  <SelectItem value="InProgress">進行中</SelectItem>
  <SelectItem value="Completed">完了</SelectItem>
  <SelectItem value="OnHold">保留</SelectItem>
  <SelectItem value="Cancelled">キャンセル</SelectItem>
</Select>
```

**変更後**:
```tsx
// 未完了タスク: 完了ボタン
{task.status !== 'Completed' ? (
  <Button onClick={() => onTaskStatusChange(task.id, project.id, 'Completed')}>
    <CheckCircle2 /> 完了にする
  </Button>
) : (
  // 完了済みタスク: 完了バッジ
  <Badge><CheckCircle2 /> 完了済み</Badge>
)}
```

### UX改善
- シンプルで直感的な操作
- タスク完了までのステップを削減（2クリック → 1クリック）
- 視覚的に完了状態が明確

---

## v1.17.3 (2025-01-21)

### 🐛 マイタスク ステータス変更機能修正

### バグ修正
- **App.tsx - handleTaskStatusChange**:
  - Dataverse更新後にプロジェクトリストを再取得するよう修正
  - `refreshProjects()`を呼び出してUI即座に反映
  - デバッグログ追加（エラー追跡用）

- **MyTasksView**:
  - ステータス変更時の詳細ログ追加
  - タスク、プロジェクト情報を出力

### 変更詳細
**変更前**:
```typescript
await updateDataverseTask(projectId, taskId, taskData);
// プロジェクトリスト未更新 → UIに反映されない
```

**変更後**:
```typescript
await updateDataverseTask(projectId, taskId, taskData);
await refreshProjects(); // ← 追加：Dataverseから最新データ取得
```

### 診断機能
- ステータス変更時のコンソールログで以下を確認可能:
  - タスク情報（ID、名前）
  - プロジェクト情報（ID、名前）
  - 変更前後のステータス
  - Dataverse更新の成否

---

## v1.17.2 (2025-01-21)

### 🔄 マイタスク フィルター改善

### UI改善
- **MyTasksView**:
  - フィルタードロップダウンの「進行中」を「未開始または進行中」に変更
  - フィルターロジックを更新：NotStartedとInProgressのタスクのみ表示
  - より直感的なフィルター名称

### 変更詳細
- `active`フィルター：
  - **変更前**: 完了とキャンセル以外のすべて（保留も含む）
  - **変更後**: 未開始または進行中のみ

---

## v1.17.1 (2025-01-21)

### 🐛 デバッグログ追加

### デバッグ改善
- **TaskDialog**:
  - ステータス変更時のログ出力追加
  - handleSubmitでformDataとtaskDataの詳細ログ出力
  - Dataverseへの保存データ確認用

### 目的
- タスクのステータスドロップダウン変更とDataverse保存の問題を診断
- ブラウザDevToolsでデータフローを追跡可能に

---

## v1.17.0 (2025-01-21)

### 🧹 スキーマクリーンアップとプロジェクトダイアログUI改善

### スキーマ修正
- **useDataverseProjects**:
  - 削除された`geek_manager`フィールドへの参照を削除
  - `geek_project_manager`（Lookup）のみを使用
  - `convertDataverseToProject`からgeek_managerフォールバックを削除
  - `convertProjectToDataverse`からgeek_manager設定を削除

### UI改善
- **ProjectDialog**:
  - プロジェクトマネージャーフィールドをテキスト入力からコンボボックスに変更
  - useDataverseUsersフックを追加してSystemUsersを取得
  - Selectコンポーネントでマネージャー選択
  - managerId（GUID）とmanager（表示名）の両方を設定
  - ProjectFormと同じUI/UX実装

### 技術的改善
- Dataverseスキーマとの完全な整合性確保
- 削除されたフィールド（geek_id, geek_manager）への参照を完全に削除
- プロジェクト作成・編集フォームのUI統一

---

## v1.16.0 (2025-01-21)

### 🎉 ガントチャート画面にプロジェクト編集・削除機能を追加

### 新機能
- **ガントチャートヘッダー**:
  - プロジェクト情報表示（プロジェクト名、開始日、終了日、マネージャー）
  - プロジェクト編集ボタン
  - プロジェクト削除ボタン

### コンポーネント更新
- **GanttChart**:
  - `onProjectEdit`プロパティ追加：プロジェクト編集ダイアログを開く
  - `onProjectDelete`プロパティ追加：プロジェクト削除確認と実行
  - プロジェクト情報ヘッダーを追加
  - Editアイコン、Trash2アイコン使用

- **ProjectDialog**:
  - `onDelete`プロパティ追加
  - 削除ボタンを追加（編集モードのみ表示）
  - 削除確認ダイアログ表示

- **ProjectForm**:
  - `onDelete`プロパティ追加
  - 削除ボタンを左下に配置（編集モードのみ表示）
  - ボタンレイアウトを左右に分割

### データ操作
- **handleProjectDelete**（App.tsx）:
  - 削除確認ダイアログ表示
  - Dataverse環境では`deleteDataverseProject`を呼び出し
  - 削除後にダッシュボードに自動遷移
  - プロジェクトリストを自動更新

- **handleProjectEdit**（App.tsx）:
  - 編集ダイアログを開く
  - 現在のプロジェクト情報をフォームに読み込み

### UI/UX改善
- プロジェクト情報を一目で確認可能
- 編集・削除操作がガントチャート画面から直接実行可能
- 削除時の確認ダイアログでミス操作を防止
- ガラスモーフィズムデザインで統一

### 技術的改善
- GanttChartコンポーネントのPropsにコールバック追加
- プロジェクト削除時に関連タスクも自動削除
- 削除後のデータリフレッシュ機能
- エラーハンドリング強化

---

## v1.15.0 (2025-01-21)

### 🎉 プロジェクトマネージャー検索列対応

### 新機能
- **プロジェクトマネージャーフィールド**: SystemUser検索列として実装
  - Dataverseのgeek_project_managerフィールドをSystemUsersテーブルにリンク
  - プロジェクトフォームでコンボボックスから選択可能
  - プロジェクト一覧とダッシュボードに表示

### コンポーネント
- **ProjectForm（新規作成）**:
  - プロジェクトマネージャーをSystemUsersからコンボボックスで選択
  - useDataverseUsersフックでユーザー一覧を取得
  - ガラスモーフィズムデザインで統一
  - 作成・編集モードに対応

### スキーマ更新
- **customizations.xml**:
  - geek_project_managerフィールドにLookupType=8（SystemUser）を追加
  - フィールド説明を「プロジェクトマネージャー」に更新
- **Project型定義**:
  - managerId?: string フィールドを追加（システムユーザーGUID）
  - manager: string フィールド（表示名）と併用

### データ変換
- **convertDataverseToProject**:
  - geek_project_manager検索列から表示名とGUIDを取得
  - 展開されたナビゲーションプロパティ対応
  - _valueプロパティからGUID取得
  - geek_managerフィールドへのフォールバック
- **convertProjectToDataverse**:
  - managerId指定時に@odata.bind構文でSystemUsersにリンク
  - プロジェクト作成・更新時にプロジェクトマネージャーを設定

### デバッグ機能
- プロジェクトマネージャー情報の詳細ログ出力
- 検索列の展開とGUID取得の確認ログ

---

## v1.14.0 (2025-01-21)

### 🎉 マイタスク機能のDataverse完全接続

### 新機能
- **現在のユーザー情報の改善**: システムユーザーGUIDを正確に取得
  - useDataverseUsersフックから現在のユーザーを取得
  - Dataverse SystemUsersテーブルのGUIDを使用
  - タスクのassigneeIdと正確に照合可能

### Dataverse接続
- **ダッシュボード - マイタスク**: 
  - 現在のユーザーIDでタスクをフィルタリング
  - assignee（名前）とassigneeId（GUID）の両方で照合
  - 詳細なログ出力で動作を確認可能
- **ダッシュボード - 今週期限のタスク**:
  - マイタスクから今週期限のタスクを抽出
  - 期限日でソート、上位5件を表示
- **メニュー - マイタスク一覧**:
  - Dataverseプロジェクトタスクから現在のユーザーのタスクを取得
  - フィルター・ソート機能をDataverseデータに対応

### 技術的改善
- useCurrentUser.ts:
  - useDataverseUsersフックを統合
  - システムユーザーGUID（id）を正確に取得
  - Power Apps Context、Dataverseの順でフォールバック
- Dashboard.tsx:
  - currentUserIdでタスクフィルタリング強化
  - マッチングログの追加
- MyTasksView.tsx:
  - currentUserIdでタスクフィルタリング強化
  - マッチングログの追加

### デバッグ機能
- タスクマッチングの詳細ログ出力
- currentUser、currentUserId、タスク情報をコンソールに表示
- フィルタリング結果の確認が容易に

---

## v1.13.1 (2025-01-21)

### 🐛 バグ修正

### 修正内容
- **PowerDataRuntime初期化エラー修正**:
  - Office 365 Usersサービスの初期化タイミングを改善
  - PowerDataRuntimeが完全に初期化されるまで待機（500ms → 1500ms）
  - MyProfile_V2とMyProfileのエラーハンドリング強化
  - Office 365サービスエラーを非致命的エラーとして処理

### 技術的改善
- PowerProvider.tsx: 初期化待機時間を1.5秒に延長
- useOffice365Users.ts:
  - usePowerAppsフックで初期化状態を確認
  - API呼び出しを個別にtry-catchで保護
  - Office 365エラーをwarningとして処理（アプリは継続動作）
- useDataverseProjects.ts: 初期化チェック改善
- useDataverseUsers.ts: 初期化チェック改善

### エラーハンドリング
- Office 365サービスが利用できない場合でもアプリが動作
- 開発環境でのフォールバック動作を改善
- コンソールログを整理（エラーから警告に変更）

---

## v1.13.0 (2025-01-21)

### 🎉 プロジェクト一覧ページ追加

### 新機能
- **プロジェクト一覧画面**: すべてのプロジェクトを一覧表示
  - グリッドレイアウトで見やすく表示
  - プロジェクトカードに統計情報を表示
  - カード型のモダンなデザイン
- **統計カード**: 全体の統計情報を表示
  - 総プロジェクト数
  - 進行中のプロジェクト数
  - 計画中のプロジェクト数
  - 完了したプロジェクト数
  - 全体進捗率
- **検索機能**: プロジェクト名、説明、担当者で検索
- **フィルター機能**: ステータスでフィルタリング
  - すべて
  - 進行中
  - 計画中
  - 完了
- **ソート機能**: 複数の条件でソート
  - 名前
  - ステータス
  - 進捗率
  - 開始日
  - 終了日

### ナビゲーション
- **サイドメニュー**: 「すべてのプロジェクト」メニュー項目を追加
  - プロジェクトセクションの最上部に配置
  - アクティブ状態の表示
- **ダッシュボード**: 「すべて表示」ボタンからプロジェクト一覧に遷移

### プロジェクトカード表示内容
- プロジェクト名とステータスバッジ
- 説明（2行まで表示）
- 期間（開始日 - 終了日）
- タスク統計（完了、進行中、遅延）
- 進捗率とプログレスバー
- 担当PM名

### Dataverse対応
- useDataverseProjectsフックでリアルタイムデータ取得
- ローディング表示とエラーハンドリング
- 開発環境ではサンプルデータを使用

### 技術的改善
- ProjectListView.tsx: 新規コンポーネント作成
- App.tsx: 'projectList'ビュータイプ追加
- SideMenu.tsx: プロジェクト一覧ナビゲーション追加
- Dashboard.tsx: プロジェクト一覧への遷移機能追加

---

## v1.12.1 (2025-01-21)

### 🐛 バグ修正

### 修正内容
- **マイタスク画面のReactエラー修正**: 
  - React error #310の修正（useMemoフック呼び出し順序の問題）
  - 早期returnをuseMemoの後に移動
  - フックのルールに準拠した実装に変更

### 技術的改善
- MyTasksView.tsx: useMemoの依存配列を最適化
- ローディング・エラーチェックの位置を修正
- Reactフックのルールに準拠

---

## v1.12.0 (2025-01-21)

### 🎉 Dataverse接続 & プロジェクト検索機能

### 新機能
- **プロジェクト検索機能**: サイドメニューにプロジェクト検索ボックスを追加
  - プロジェクト名でリアルタイムフィルタリング
  - 検索結果がない場合のメッセージ表示
  - 検索アイコン付き

### Dataverse接続
- **ダッシュボード**: Dataverseプロジェクト・タスクデータに接続
  - useDataverseProjectsフックでリアルタイムデータ取得
  - ローディング表示とエラーハンドリング
  - 開発環境ではサンプルデータを使用（フォールバック）
- **マイタスク**: Dataverseタスクデータに接続
  - 現在のユーザーID（システムユーザーGUID）で正確にフィルタリング
  - assigneeId、currentUserIdで担当者を照合
  - ローディング表示とエラーハンドリング

### 改善
- Power Apps環境の自動検出
  - 本番環境: Dataverseデータを使用
  - 開発環境: サンプルデータを使用
- currentUserIdの追加
  - システムユーザーのGUIDを保持
  - マイタスクで正確なタスクフィルタリング

### デザインドキュメント
- **THEME_GUIDE.md**: テーマ＆カラーシステムガイドを追加
  - ThemeProvider実装
  - CSS変数定義の詳細
  - セマンティックカラーパレット
  - ThemeToggleコンポーネント
  - カスタマイズ方法

### 技術的改善
- Dashboard.tsx: Dataverse接続対応
- MyTasksView.tsx: Dataverse接続対応
- SideMenu.tsx: 検索機能追加
- プロジェクト検索のフィルタリングロジック実装

---

## v1.11.0 (2025-01-21)

### 🎉 ダッシュボード機能追加

### 新機能
- **ダッシュボード画面**: アプリ起動時の初期画面
  - ウェルカムメッセージ（現在のユーザー名表示）
  - 全体統計カード（総プロジェクト数、総タスク数、進行中のタスク、全体進捗率）
  - マイタスクサマリー（総タスク、進行中、完了、遅延）
  - 今週期限のタスク一覧
  - プロジェクト一覧（進捗率表示付き）
- **現在のユーザー情報取得**: useCurrentUserフック
  - Power Apps環境: userSettings から取得
  - 開発環境: ダミーユーザー（田中PM）

### 改善
- **サイドメニュー**: ダッシュボードメニューを追加
  - ホームセクション: ダッシュボード、マイタスク
  - デフォルトでダッシュボードを選択状態
- **マイタスク機能**: 現在のユーザーIDで正確にフィルタリング
  - `currentUser.displayName` または `currentUser.id` で担当者フィールドと照合
  - Power Apps環境で正しいユーザーのタスクのみ表示

### 削除
- プロジェクト選択画面（ProjectSelector）を削除
  - ダッシュボードに機能を統合

### 技術的改善
- useCurrentUserフックの実装
- ビュータイプに 'dashboard' を追加
- App.tsxの初期ビューを 'dashboard' に変更

---

## v1.10.0 (2025-01-21)

### 🎉 メジャーアップデート: UI/UX完全リニューアル

### 新機能
- **統合ヘッダー**: 全画面で共通のヘッダーを使用
  - プロジェクト情報表示
  - 統計情報バー（総タスク、完了、進行中、遅延、進捗率）
  - ローディングインジケーター
  - メニュートグル、更新ボタン
- **サイドメニュー**: 左側にナビゲーションメニューを追加
  - デフォルトで表示、ハンバーガーアイコンで開閉
  - プロジェクト一覧
  - マイタスク画面へのナビゲーション
  - 設定（準備中）
- **マイタスク機能**: アサインされたタスクの一覧表示
  - フィルタリング（全て、進行中、完了、遅延）
  - ソート（期限順、優先度順、ステータス順、プロジェクト順）
  - タスクステータスの直接変更
  - タスク詳細へのナビゲーション
  - 統計カード表示

### 削除機能
- **通知機能**: 通知メニューを削除（NotificationMenuコンポーネント削除）

### UI改善
- レスポンシブデザインの向上
- 一貫したデザイン言語
- スムーズなページ遷移
- サイドメニューのアニメーション

### 技術的改善
- コンポーネント構造の最適化
  - CommonHeader（共通ヘッダー）
  - SideMenu（サイドメニュー）
  - MyTasksView（マイタスク画面）
- ビュー管理の改善（projectSelector、gantt、myTasks）
- 状態管理の最適化

---

## v1.9.9 (2025-01-XX)

### 追加機能
- **ローディングインジケーター**: CRUD操作中にヘッダー領域に保存中の表示を追加
  - 非遮断的なデザインで、操作を妨げずにフィードバックを提供
  - タスクの作成、更新、削除およびプロジェクト保存時に表示
- **進捗率カード**: プロジェクト統計情報バーに進捗率カードを追加
  - 総タスク、完了、進行中、遅延カードと同じスタイルで統一
  - 完了タスク数 / 総タスク数で自動計算

### 改善
- **グリッドラベルの日本語化**: グリッド表示の優先度、カテゴリを日本語ラベルに変更
  - 優先度: Low → 低、Medium → 中、High → 高、Critical → 重要
  - カテゴリ: Planning → 計画、Setup → セットアップ、Migration → 移行、Training → トレーニング、Testing → テスト、GoLive → 本番稼働
  - ステータス: フォームでは既に日本語化済み

### 技術的改善
- ローディング状態管理の実装（`isSaving` state）
- try-finallyパターンによる確実な状態クリア
- ラベルマッピング辞書の追加（`src/data/sampleProjects.ts`）

---

## v1.9.8 (2025-01-XX)

### バグ修正
- **タスクフォーム**: ダイアログを閉じた後に入力値が残存する問題を修正
  - useEffectの依存配列に`open`を追加
  - ダイアログを閉じるときに編集状態をクリア

---

## v1.9.7 (2025-01-XX)

### ドキュメント整理
- **Logo関連ドキュメント**: 8ファイル → 3ファイルに統合（-62%）
  - LOGO_MASTER_GUIDE.mdに全情報を統合
  - 非推奨警告の追加
- **ドキュメント統合**: 21ファイル → 18ファイル（-14%）
  - docs/README.mdをマスター目次として作成
  - 重複情報の削減

---

## v1.9.6 (2025-01-XX)

### 追加機能
- **Lookupフィールド（担当者）**: Office 365ユーザー検索機能の実装
  - ビュー切り替え機能（すべてのユーザー / 組織内のユーザー）
  - 検索機能（名前、メールアドレス）
  - Comboboxコンポーネントの実装

---

## v1.0.0 - v1.9.5

初期リリースから v1.9.5 までの詳細な変更履歴は省略されています。
主要な機能としては以下が実装されました：

- ガントチャート表示機能
- タスク管理（作成、編集、削除）
- プロジェクト管理
- Dataverse連携
- Power Apps統合
- ダークモード対応
- レスポンシブデザイン
