# デザインガイドライン

## 概要

このドキュメントは、Gantt Chart Manager のデザインシステムを他のアプリケーションでも活用できるようにまとめたガイドラインです。

**バージョン**: 1.11.0  
**最終更新**: 2025-01-21

---

## 目次

1. [レイアウト構造](#レイアウト構造)
2. [カラーシステム](#カラーシステム)
3. [タイポグラフィ](#タイポグラフィ)
4. [コンポーネント](#コンポーネント)
5. [アニメーション](#アニメーション)
6. [レスポンシブデザイン](#レスポンシブデザイン)
7. [実装例](#実装例)
8. [CSVインポート要件](#csvインポート要件)

---

## レイアウト構造

### 基本構造

```
┌─────────────────────────────────────────────────────┐
│ CommonHeader (固定ヘッダー - 64px)                   │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SideMenu │ Main Content Area                        │
│ (256px)  │ (動的コンテンツ)                          │
│          │                                          │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### レイアウトクラス構成

```tsx
<div className="min-h-screen bg-background">
  {/* ヘッダー */}
  <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
    <div className="flex h-16 items-center justify-between px-4 md:px-6">
      {/* ヘッダーコンテンツ */}
    </div>
  </header>

  {/* サイドメニュー */}
  <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border">
    {/* サイドメニューコンテンツ */}
  </aside>

  {/* メインコンテンツ */}
  <main className="transition-all duration-300 pt-16 ml-64">
    <div className="h-[calc(100vh-4rem)]">
      {/* ページコンテンツ */}
    </div>
  </main>
</div>
```

### 重要な寸法

| 要素 | 高さ/幅 | クラス |
|------|---------|--------|
| ヘッダー | 64px (h-16) | `h-16` |
| サイドメニュー | 256px | `w-64` |
| メインコンテンツの高さ | calc(100vh - 4rem) | `h-[calc(100vh-4rem)]` |
| メインコンテンツのトップ余白 | 64px (pt-16) | `pt-16` |

---

## カラーシステム

### プライマリカラー

このアプリは **CSS変数ベースのテーマシステム** を使用しています。

```css
/* ライトモード */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;
--border: 214.3 31.8% 91.4%;

/* ダークモード */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--primary: 210 40% 98%;
--primary-foreground: 222.2 47.4% 11.2%;
--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;
--border: 217.2 32.6% 17.5%;
```

### セマンティックカラー

| 用途 | カラー | Tailwind クラス |
|------|--------|-----------------|
| 成功・完了 | Green | `text-green-600` `bg-green-50` |
| 進行中 | Blue | `text-blue-600` `bg-blue-50` |
| 警告 | Yellow | `text-yellow-600` `bg-yellow-50` |
| エラー・遅延 | Red | `text-red-600` `bg-red-50` |
| 進捗率 | Purple | `text-purple-600` `bg-purple-50` |
| 情報 | Muted | `text-muted-foreground` `bg-muted` |

### ダークモード対応

```tsx
// ライト・ダーク両対応の例
<div className="bg-green-50 dark:bg-green-950/20">
  <span className="text-green-600 dark:text-green-400">完了</span>
</div>
```

---

## タイポグラフィ

### 見出し

```tsx
// ページタイトル (h1)
<h1 className="text-3xl font-bold text-foreground">
  ページタイトル
</h1>

// セクションタイトル (h2)
<h2 className="text-2xl font-semibold text-foreground">
  セクションタイトル
</h2>

// カードタイトル (h3)
<h3 className="text-lg font-semibold text-foreground">
  カードタイトル
</h3>
```

### 本文

```tsx
// 通常テキスト
<p className="text-base text-foreground">
  通常の本文テキスト
</p>

// 小さいテキスト
<p className="text-sm text-muted-foreground">
  補足情報やメタデータ
</p>

// 極小テキスト
<p className="text-xs text-muted-foreground">
  ラベルやキャプション
</p>
```

### セクションヘッダー

```tsx
// サイドメニューなどのセクションヘッダー
<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
  セクション名
</h3>
```

---

## コンポーネント

### 1. CommonHeader（共通ヘッダー）

#### 構造

```tsx
<header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm">
  <div className="flex h-16 items-center justify-between px-4 md:px-6">
    {/* 左側: メニューボタン + プロジェクト情報 */}
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">タイトル</span>
        <span className="text-xs text-muted-foreground">サブタイトル</span>
      </div>
    </div>

    {/* 右側: アクション + テーマトグル + プロフィール */}
    <div className="flex items-center space-x-2">
      <Button size="sm" variant="ghost">アクション</Button>
      <ThemeToggle />
      <UserProfile />
    </div>
  </div>
</header>
```

#### 特徴

- **固定位置**: `sticky top-0 z-50`
- **半透明背景**: `bg-card/95 backdrop-blur-md`
- **ガラスモーフィズム効果**: `backdrop-blur-md`
- **影**: `shadow-sm`

### 2. SideMenu（サイドメニュー）

#### 構造

```tsx
<aside className={cn(
  "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40",
  isOpen ? "w-64" : "w-0"
)}>
  <div className={cn("h-full flex flex-col overflow-y-auto", !isOpen && "hidden")}>
    <div className="flex-1">
      <div className="p-4 space-y-6">
        {/* セクション */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            セクション名
          </h3>
          <Button variant="ghost" className="w-full justify-start">
            <Icon className="h-4 w-4 mr-2" />
            メニュー項目
          </Button>
        </div>
      </div>
    </div>

    {/* フッター */}
    <div className="border-t border-border p-4">
      <div className="text-xs text-muted-foreground">
        <div className="font-semibold">アプリ名</div>
        <div>v1.0.0</div>
      </div>
    </div>
  </div>
</aside>
```

#### 特徴

- **固定位置**: `fixed left-0 top-16`
- **アニメーション**: `transition-all duration-300`
- **開閉制御**: `w-64` / `w-0`
- **セクション分け**: ホーム、プロジェクト、その他

### 3. 統計カード

#### 基本カード

```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">ラベル</p>
        <p className="text-3xl font-bold">123</p>
      </div>
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
  </CardContent>
</Card>
```

#### カラー付きカード

```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">進行中のタスク</p>
        <p className="text-3xl font-bold text-blue-600">45</p>
      </div>
      <Clock className="h-10 w-10 text-blue-600" />
    </div>
  </CardContent>
</Card>
```

### 4. 統計情報バー

```tsx
<div className="border-b bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm px-6 py-3">
  <div className="flex items-center space-x-6">
    {/* 統計アイテム */}
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">ラベル</span>
      <span className="text-sm font-semibold">値</span>
    </div>
    
    {/* カラー付き統計アイテム */}
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-950/20">
      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      <span className="text-xs font-medium text-muted-foreground">完了</span>
      <span className="text-sm font-semibold text-green-600 dark:text-green-400">25</span>
    </div>
  </div>
</div>
```

### 5. ローディングインジケーター

```tsx
{/* 非遮断型ローディング（ヘッダー内） */}
{isSaving && (
  <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 px-4 py-2 bg-primary/90 text-primary-foreground rounded-md shadow-lg z-50 animate-fade-in">
    <RefreshCw className="h-4 w-4 animate-spin" />
    <span className="text-sm font-medium">保存中...</span>
  </div>
)}
```

### 6. プログレスバー

```tsx
{/* 進捗率バー */}
<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
  <div 
    className="h-full bg-purple-600 transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 7. バッジ

```tsx
{/* ステータスバッジ */}
<Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
  完了
</Badge>

{/* 優先度バッジ */}
<span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-red-500">
  重要
</span>
```

---

## アニメーション

### トランジション

```css
/* 標準トランジション */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* 長めのトランジション */
.duration-300 {
  transition-duration: 300ms;
}
```

### アニメーション定義

```css
/* フェードイン */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

/* スライドイン */
@keyframes slide-in {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

/* スピン（ローディング） */
.animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## レスポンシブデザイン

### ブレークポイント

| サイズ | 幅 | Tailwind接頭辞 |
|--------|-----|---------------|
| Mobile | < 768px | (デフォルト) |
| Tablet | ≥ 768px | `md:` |
| Desktop | ≥ 1024px | `lg:` |
| Large Desktop | ≥ 1280px | `xl:` |

### レスポンシブパターン

```tsx
{/* モバイル: 縦並び、デスクトップ: 横並び */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* カード */}
</div>

{/* モバイルで非表示 */}
<div className="hidden md:block">
  {/* デスクトップのみ表示 */}
</div>

{/* デスクトップで非表示 */}
<Button className="md:hidden">
  {/* モバイルのみ表示 */}
</Button>
```

---

## 実装例

### ダッシュボード画面のレイアウト

```tsx
<div className="container mx-auto p-6 space-y-6">
  {/* ウェルカムメッセージ */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-foreground mb-2">
      ようこそ、{userName}さん
    </h1>
    <p className="text-muted-foreground">
      サブタイトルやメッセージ
    </p>
  </div>

  {/* 統計カードグリッド */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* カード × 4 */}
  </div>

  {/* メインコンテンツグリッド */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* 左カラム */}
    <Card>
      <CardHeader>
        <CardTitle>セクションタイトル</CardTitle>
      </CardHeader>
      <CardContent>
        {/* コンテンツ */}
      </CardContent>
    </Card>

    {/* 右カラム */}
    <Card>
      <CardHeader>
        <CardTitle>セクションタイトル</CardTitle>
      </CardHeader>
      <CardContent>
        {/* コンテンツ */}
      </CardContent>
    </Card>
  </div>
</div>
```

### リスト項目のホバーエフェクト

```tsx
<div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
  {/* リスト項目 */}
</div>
```

---

## ベストプラクティス

### 1. 一貫性のあるスペーシング

- `space-y-2`: 要素間の小さい間隔（8px）
- `space-y-4`: 要素間の中間隔（16px）
- `space-y-6`: 要素間の大きい間隔（24px）
- `gap-4`: グリッドアイテム間の間隔（16px）

### 2. カラーの使い方

- **成功**: `text-green-600` + `bg-green-50`
- **警告**: `text-yellow-600` + `bg-yellow-50`
- **エラー**: `text-red-600` + `bg-red-50`
- **情報**: `text-blue-600` + `bg-blue-50`
- **ニュートラル**: `text-muted-foreground` + `bg-muted`

### 3. 影の使い方

- **カード**: `shadow-sm`
- **ヘッダー**: `shadow-sm`
- **ドロップダウン**: `shadow-md`
- **モーダル**: `shadow-lg`

### 4. ボーダーの使い方

- **カード**: `border border-border`
- **セクション区切り**: `border-b border-border`
- **サイドバー**: `border-r border-border`

---

## CSVインポート要件

### テンプレート構造

| 列キー | 必須 | 用途 | 受け付ける値 / 書式 |
|--------|------|------|----------------------|
| `task_id` | UPDATE/DELETE 時 | 既存タスク識別子 | Dataverse のタスク GUID |
| `task_name` | 常に必須 | タスク表示名 | 文字列 |
| `project_id` | 常に必須 | 紐付けプロジェクト | Dataverse のプロジェクト GUID |
| `description` | 任意 | タスク概要 | 文字列 (カンマ/改行は引用符で囲む) |
| `start_date` | 任意 | 開始日 | `YYYYMMDD` (数値8桁) |
| `end_date` | 任意 | 終了日 | `YYYYMMDD` (数値8桁) |
| `progress` | 任意 | 進捗率 | 0-100 の整数 |
| `priority` | 任意 | 優先度 | `Low`, `Medium`, `High`, `Critical` |
| `status` | 任意 | ステータス | `NotStarted`, `InProgress`, `Completed`, `OnHold`, `Cancelled` |
| `category` | 任意 (空白不可) | タスクカテゴリ | `Planning`, `Setup`, `Migration`, `Training`, `Testing`, `GoLive` |
| `assignee_id` | 任意 | 担当者 Lookup | Dataverse のユーザー GUID |
| `operation` | 任意 | 実行操作 | `CREATE`, `UPDATE`, `DELETE` |

テンプレートは UTF-8 (BOM 付き) で出力され、冒頭に `#` から始まるコメント行を含みます。アプリ上の「CSVテンプレートをダウンロード」ボタンから最新版を取得してください。`duration` 列は存在せず、開始日と終了日から自動計算されます。

### バリデーションの基本ルール

- `task_name` と `project_id` は全操作で必須。空白や空文字は不可。
- `start_date`/`end_date` を設定する場合は `YYYYMMDD` 形式かつ終了日は開始日以降の日付であること。
- `progress` は 0-100 の整数のみ許可。空欄時は更新されません。
- `priority`、`status`、`category` は表の候補値から選択し、大文字・小文字の揺れも検出されます。
- `category` 列を空文字のままにするとエラーになるため、不要な場合は列自体を削除せず適切な値を入力してください。
- `operation` を `UPDATE` または `DELETE` にした行は `task_id` が必須です。未指定の場合は自動で CREATE/UPDATE 判定 (task_id の有無) が行われます。

### インポートフロー

1. ガント画面の「CSVアップロード」ボタンからモーダルを開き、必要であればテンプレートをダウンロードします。
2. テンプレートを編集し、上記ルールに従って値を入力します。複数行の編集が必要な場合はアプリ側プレビューで直接修正することも可能です。
3. CSV をアップロードまたはドラッグ＆ドロップすると自動的にバリデーションが走り、エラー行がハイライトされます。
4. すべてのエラーを解消すると一括処理ボタンが有効化され、Dataverse へ CREATE/UPDATE/DELETE 操作が送信されます。
5. 処理完了後は作成・更新・削除件数とエラー一覧が表示され、成功時は最新のタスク一覧が再取得されます。

### 運用上の注意

- 取り込み前に対象プロジェクトが正しく選択されていることを確認してください。
- 既存タスクを更新する際は、Dataverse のタスク GUID を `task_id` に入力します。ID はタスクカードの「ID」ボタンからコピーできます。
- CSV に同一タスク ID の重複行がある場合、最後に処理された行の内容が有効になります。意図しない上書きを避けるためにも行の整理を推奨します。
- 大量更新時は細分化した CSV に分けるとトラブル時の切り戻しが容易です。

---

## まとめ

このデザインシステムは、以下の特徴を持っています：

1. **モダンでクリーン**: ガラスモーフィズム、グラデーション、影の効果的な使用
2. **ダークモード対応**: CSS変数ベースで簡単に切り替え
3. **レスポンシブ**: モバイルファーストで、すべての画面サイズに対応
4. **アクセシビリティ**: 適切なコントラスト比とフォーカス状態
5. **一貫性**: 統一されたスペーシング、カラー、タイポグラフィ

このガイドラインを参考に、他のアプリケーションでも同様のデザインを実装できます。
