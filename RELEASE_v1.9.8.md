# v1.9.8 リリースノート

**リリース日**: 2025年10月21日  
**リリースタイプ**: バグフィックス

---

## 🐛 バグ修正

### タスクフォームの入力値残存問題を修正

**問題**: 新しくタスクフォームを作成しても、前回入力した値が残っている

**修正内容**:
1. **TaskDialog.tsx**: useEffectの依存配列に`open`を追加
   - ダイアログが開くたびにフォームをリセット
   - ダイアログが閉じているときは処理をスキップ

2. **App.tsx**: ダイアログを閉じるときに編集状態をクリア
   - `handleTaskDialogChange` 関数を追加
   - `handleProjectDialogChange` 関数を追加
   - ダイアログを閉じるときに`editingTask`と`editingProject`を`null`にリセット

**詳細**: [TASK_FORM_STATE_FIX.md](./docs/TASK_FORM_STATE_FIX.md)

---

## 📝 変更されたファイル

- `src/components/TaskDialog.tsx` - useEffectの修正
- `src/App.tsx` - ダイアログ状態管理の改善
- `package.json` - バージョン 1.9.7 → 1.9.8

---

## ✅ テスト結果

### ビルド
```
✓ 2439 modules transformed.
dist/index.html          0.80 kB │ gzip:   0.50 kB
dist/assets/index.css   42.96 kB │ gzip:   8.01 kB
dist/assets/vendor.js  141.28 kB │ gzip:  45.44 kB
dist/assets/index.js   355.98 kB │ gzip: 104.06 kB
✓ built in 4.32s
```

### デプロイ
✅ 成功  
**URL**: https://apps.powerapps.com/play/e/28130368-fe41-e701-a32b-2b413ac21d0b/a/16b17303-4603-47ce-b4fc-12559e2d557c

---

## 🎯 影響範囲

- ✅ タスクフォーム（新規作成・編集）
- ✅ プロジェクトフォーム（新規作成・編集）
- ✅ 既存機能に影響なし

---

## 🔄 前バージョンからの変更

### v1.9.7 → v1.9.8

**新機能**: なし  
**バグ修正**: タスクフォームの入力値残存問題  
**パフォーマンス**: 変更なし  
**ドキュメント**: TASK_FORM_STATE_FIX.md を追加

---

**リリース担当**: GitHub Copilot  
**承認**: -  
**デプロイ日時**: 2025年10月21日
