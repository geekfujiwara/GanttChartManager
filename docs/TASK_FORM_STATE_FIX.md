# タスクフォーム入力値残存問題の修正

**問題**: 新しくタスクフォームを作成しても、前回入力した値が残っている  
**バージョン**: v1.9.7 → v1.9.8  
**修正日**: 2025年10月21日

---

## 問題の詳細

### 症状

1. タスクAを作成（例: 名前「タスク1」、担当者「田中太郎」）
2. タスクフォームを閉じる
3. 「新規タスク」ボタンをクリック
4. **問題**: フォームに前回の値（「タスク1」「田中太郎」）が残っている

### 期待される動作

新規タスク作成時は、フォームが完全にリセットされ、デフォルト値のみが表示される。

---

## 根本原因

### 1. useEffectの依存配列に`open`が含まれていない

**問題のコード（TaskDialog.tsx）**:

```tsx
useEffect(() => {
  if (task) {
    // 既存タスクの編集
    setFormData({ ...task });
  } else {
    // 新規作成時
    setFormData({ /* デフォルト値 */ });
  }
}, [task, currentUser]); // ❌ openが依存配列にない
```

**問題点**:
- ダイアログが開いたとき（`open`が`false`→`true`に変化）にuseEffectが実行されない
- `task`が`null`でも、前回の`formData`の状態が残り続ける

### 2. ダイアログを閉じるときに編集状態がクリアされない

**問題のコード（App.tsx）**:

```tsx
<TaskDialog
  open={taskDialogOpen}
  onOpenChange={setTaskDialogOpen} // ❌ ダイアログを閉じるだけ
  task={editingTask}
/>
```

**問題点**:
- ダイアログを閉じても`editingTask`が`null`にリセットされない
- 次回開いたときに、前回の編集状態が残っている可能性がある

---

## 解決方法

### 修正1: useEffectに`open`を追加（TaskDialog.tsx）

```tsx
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
    setFormData({
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
    });
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
  }
}, [open, task, currentUser]); // ✅ openを依存配列に追加
```

**変更点**:
1. `if (!open) return;` - ダイアログが閉じているときは処理をスキップ
2. 依存配列に`open`を追加 - ダイアログが開くたびにフォームをリセット
3. コメントを明確化 - 「フォームをリセット」と明記

### 修正2: ダイアログを閉じるときに編集状態をクリア（App.tsx）

```tsx
const handleTaskDialogChange = (open: boolean) => {
  setTaskDialogOpen(open);
  // ダイアログが閉じるときに編集中のタスクをクリア
  if (!open) {
    setEditingTask(null);
  }
};

const handleProjectDialogChange = (open: boolean) => {
  setProjectDialogOpen(open);
  // ダイアログが閉じるときに編集中のプロジェクトをクリア
  if (!open) {
    setEditingProject(null);
  }
};

// 使用箇所
<TaskDialog
  open={taskDialogOpen}
  onOpenChange={handleTaskDialogChange} // ✅ カスタムハンドラーを使用
  task={editingTask}
  onSave={handleTaskSave}
  onDelete={handleTaskDelete}
/>

<ProjectDialog
  open={projectDialogOpen}
  onOpenChange={handleProjectDialogChange} // ✅ カスタムハンドラーを使用
  project={editingProject}
  onSave={handleProjectSave}
/>
```

**変更点**:
1. `handleTaskDialogChange` - ダイアログを閉じるときに`editingTask`を`null`にリセット
2. `handleProjectDialogChange` - 同様にプロジェクトもクリア
3. 両方のダイアログで新しいハンドラーを使用

---

## 動作フロー（修正後）

### シナリオ1: 新規タスク作成

1. ユーザーが「新規タスク」ボタンをクリック
2. `openNewTaskDialog()` が実行
   - `setEditingTask(null)` - 編集中タスクをクリア
   - `setTaskDialogOpen(true)` - ダイアログを開く
3. TaskDialogのuseEffectが実行（`open`が`true`に変化）
   - `task`が`null`なので、デフォルト値でフォームをリセット
4. ✅ フォームが空の状態で表示される

### シナリオ2: 既存タスク編集

1. ユーザーがタスクをクリック
2. `openEditTaskDialog(task)` が実行
   - `setEditingTask(task)` - 編集対象のタスクをセット
   - `setTaskDialogOpen(true)` - ダイアログを開く
3. TaskDialogのuseEffectが実行（`open`と`task`が変化）
   - `task`が存在するので、そのデータでフォームを初期化
4. ✅ タスクのデータがフォームに入力された状態で表示される

### シナリオ3: ダイアログを閉じる

1. ユーザーがダイアログを閉じる（ESCキーまたは背景クリック）
2. `handleTaskDialogChange(false)` が実行
   - `setTaskDialogOpen(false)` - ダイアログを閉じる
   - `setEditingTask(null)` - 編集中タスクをクリア
3. ✅ 次回開くときに前回の状態が残らない

---

## テスト方法

### テストケース1: 新規タスク作成後の状態確認

1. 新規タスクを作成
   - 名前: 「タスクA」
   - 担当者: 「田中太郎」
   - 優先度: 「High」
2. タスクを保存してダイアログを閉じる
3. 再度「新規タスク」ボタンをクリック
4. **期待結果**: フォームが空で、デフォルト値のみが表示される
   - 名前: 空
   - 担当者: 現在のユーザー
   - 優先度: 「Medium」

### テストケース2: タスク編集後の新規作成

1. 既存タスク「タスクB」を編集
2. ダイアログを閉じる
3. 「新規タスク」ボタンをクリック
4. **期待結果**: 「タスクB」の情報が残っていない

### テストケース3: 連続した新規作成

1. 新規タスク「タスクC」を作成して保存
2. すぐに「新規タスク」ボタンをクリック
3. **期待結果**: フォームがリセットされている

### テストケース4: 編集→閉じる→新規作成

1. タスク「タスクD」を編集
2. 保存せずにESCキーで閉じる
3. 「新規タスク」ボタンをクリック
4. **期待結果**: 「タスクD」の情報が残っていない

---

## ビルド確認

```bash
npm run build
```

**結果**:
```
✓ 2439 modules transformed.
dist/index.html          0.80 kB │ gzip:   0.50 kB
dist/assets/index.css   42.96 kB │ gzip:   8.01 kB
dist/assets/vendor.js  141.28 kB │ gzip:  45.44 kB
dist/assets/index.js   355.98 kB │ gzip: 104.06 kB
✓ built in 4.48s
```

✅ ビルド成功

---

## 影響範囲

### 変更されたファイル

1. **src/components/TaskDialog.tsx**
   - useEffectの依存配列に`open`を追加
   - ダイアログが閉じているときの処理をスキップ

2. **src/App.tsx**
   - `handleTaskDialogChange` 関数を追加
   - `handleProjectDialogChange` 関数を追加
   - ダイアログを閉じるときに編集状態をクリア

### 影響を受ける機能

- ✅ タスクフォーム（新規作成・編集）
- ✅ プロジェクトフォーム（新規作成・編集）
- ⚠️ 既存のタスク/プロジェクト編集機能（動作に変更なし）

---

## ベストプラクティス

### 1. ダイアログコンポーネントのuseEffect

```tsx
useEffect(() => {
  // ダイアログが閉じているときは何もしない
  if (!open) {
    return;
  }

  // データのリセットまたは初期化
  if (data) {
    setFormData(data); // 編集モード
  } else {
    setFormData(defaultValues); // 新規作成モード
  }
}, [open, data]); // openを必ず依存配列に含める
```

### 2. ダイアログの状態管理

```tsx
const handleDialogChange = (open: boolean) => {
  setDialogOpen(open);
  // ダイアログを閉じるときに状態をクリア
  if (!open) {
    setEditingData(null);
  }
};
```

### 3. ログ出力

```tsx
console.log('✨ New task formData (reset):', newFormData);
```

デバッグ時に問題を特定しやすくするため、フォームがリセットされたことを明示的にログ出力。

---

## 今後の改善案

### 1. フォームのリセット関数を作成

```tsx
const resetFormData = () => {
  return {
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
};

useEffect(() => {
  if (!open) return;
  
  if (task) {
    setFormData(convertTaskToFormData(task));
  } else {
    setFormData(resetFormData()); // ✅ 関数化で再利用性向上
  }
}, [open, task, currentUser]);
```

### 2. カスタムフックの作成

```tsx
function useDialogState<T>(initialValue: T | null = null) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | null>(initialValue);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setData(null); // ✅ 自動クリア
    }
  };

  return { open, data, setData, handleOpenChange };
}

// 使用例
const { open, data, setData, handleOpenChange } = useDialogState<Task>();
```

---

## 関連ドキュメント

- **[LOOKUP_FIELD_GUIDE.md](./LOOKUP_FIELD_GUIDE.md)** - Lookupフィールド実装ガイド
- **[docs/README.md](./README.md)** - ドキュメント目次

---

**修正バージョン**: v1.9.8  
**修正者**: GitHub Copilot  
**修正日**: 2025年10月21日
