# Select.Item 空文字列value問題の修正

## 問題

タスクフォームを開くと何も表示されず、以下のエラーが発生していました：

```
Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear the 
selection and show the placeholder.
```

## 根本原因

TaskDialogコンポーネントの担当者選択で、「担当者なし」の`SelectItem`に空文字列を使用していました：

```tsx
// ❌ 問題のコード
<SelectItem value="">担当者なし</SelectItem>
```

Radix UIの`Select`コンポーネントは、空文字列を選択解除の特別な値として予約しているため、`SelectItem`の`value`プロパティに空文字列を使用できません。

## 解決方法

### 修正内容

空文字列の代わりに`"unassigned"`という意味のある値を使用し、値の変換処理を追加：

```tsx
// ✅ 修正後のコード
<Select
  value={formData.assignee || "unassigned"}
  onValueChange={(value) => setFormData({ 
    ...formData, 
    assignee: value === "unassigned" ? "" : value 
  })}
>
  <SelectTrigger>
    <SelectValue placeholder="担当者を選択" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="unassigned">担当者なし</SelectItem>
    {users.map((user) => (
      <SelectItem key={user.id} value={user.displayName}>
        ...
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### ポイント

1. **Selectコンポーネントの`value`プロパティ**:
   - `formData.assignee`が空文字列の場合、`"unassigned"`を表示
   - これにより初期値が正しく表示される

2. **onValueChangeハンドラー**:
   - `"unassigned"`が選択された場合、内部的には空文字列(`""`)として保存
   - 実際のユーザー名が選択された場合はそのまま保存

3. **データの整合性**:
   - Dataverseには空文字列が保存される（既存の動作を維持）
   - UIでは意味のある値を表示

## 影響範囲

### 修正したファイル
- `src/components/TaskDialog.tsx` - 担当者選択フィールド

### 確認項目
- ✅ 新規タスク作成フォームが正常に表示される
- ✅ 既存タスク編集フォームが正常に表示される
- ✅ 「担当者なし」の選択が正常に動作する
- ✅ Office 365ユーザーの選択が正常に動作する
- ✅ 担当者なしの状態で保存してもエラーが発生しない

## Radix UI Select コンポーネントのベストプラクティス

### 空の選択肢を扱う場合

```tsx
// ❌ NG: 空文字列を使用
<SelectItem value="">選択なし</SelectItem>

// ✅ OK: 意味のある文字列を使用
<SelectItem value="none">選択なし</SelectItem>
<SelectItem value="unassigned">未割当</SelectItem>
<SelectItem value="default">デフォルト</SelectItem>
```

### プレースホルダーを使用する場合

```tsx
// ✅ プレースホルダーで初期状態を示す
<Select value={value || undefined} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="選択してください" />
  </SelectTrigger>
  <SelectContent>
    {/* 空文字列は使用しない */}
    <SelectItem value="option1">オプション1</SelectItem>
    <SelectItem value="option2">オプション2</SelectItem>
  </SelectContent>
</Select>
```

## まとめ

- ✅ **修正完了**: SelectItemの空文字列value問題を解決
- ✅ **動作確認**: タスクフォームが正常に表示される
- ✅ **ベストプラクティス**: Radix UI Selectの正しい使用方法を適用
- 📝 **記録**: 同様の問題を防ぐためにドキュメント化

これでタスクフォームが正常に動作するようになりました！
