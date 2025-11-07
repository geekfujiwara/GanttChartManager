<div align="center">
  <img src="public/logo.svg" alt="Gantt Chart Project Manager Logo" width="120" height="120" />
  <h1>ガントチャートプロジェクト管理</h1>
  <p><strong>Power Apps Code Apps</strong></p>
  
  <p>
    <a href="https://github.com/geekfujiwara/CodeAppsDevelopmentStandard">
      <img src="https://img.shields.io/badge/Standard-CodeAppsDevelopmentStandard-0078D4?style=flat-square" alt="CodeAppsDevelopmentStandard" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Power_Apps-SDK_0.3.1-742774?style=flat-square&logo=powerapps" alt="Power Apps" />
  </p>
</div>

---

## 概要
ITシステム導入プロジェクト用のガントチャート管理アプリです。[geekfujiwara/CodeAppsDevelopmentStandard](https://github.com/geekfujiwara/CodeAppsDevelopmentStandard) に準拠して開発されています。

## 特長

- **直感的なガントチャート操作**: タスクの開始日・終了日・進捗率を色分けしたバーで把握し、ドラッグ＆ドロップで瞬時にスケジュール調整が可能。
- **プロジェクトとタスクを一体管理**: プロジェクト作成・編集、タスクの詳細管理、担当者の割り当てまでブラウザ内モーダルでシームレスに完結。
- **CSV一括インポート/エクスポート**: Dataverse との連携を前提に、事前バリデーション付きでタスクの大量登録・更新・削除を安全に実行。
- **Power Platform との緊密な連携**: Power Apps Code Apps SDK を採用し、Dataverse の実データを扱いながらローカル開発と本番運用を両立。
- **モダンでアクセシブルなUI**: ダークモード、レスポンシブ対応、shadcn/ui ベースのコンポーネントにより、どのデバイスでも快適な操作体験を提供。

## 全体機能の概要

| 画面/モジュール | 概要 | 主な要素 |
|-----------------|------|----------|
| ダッシュボード | プロジェクト横断の進捗サマリと重要指標をハイライト | 統計カード、最近の更新、ショートカット |
| ガントチャート | プロジェクト単位のタスクタイムラインを表示・編集 | タスクバー、進捗指標カード、タスク詳細トリガー |
| Myタスク | 担当者視点でのタスク一覧とステータス変更 | ステータスフィルタ、進捗変更操作、詳細モーダル |
| CSV一括タスク操作 | CSV の読み込み・検証・一括処理を行うモーダル | テンプレートDL、プレビュー編集、処理結果フィードバック |
| サイドメニュー/検索 | プロジェクト/担当者のナビゲーションとフィルタリング | プロジェクトリスト、担当者検索、アクションリンク |

## 各機能の利用方法

### ダッシュボード
1. サイドメニューから「ダッシュボード」を選択すると統計ビューが表示されます。
2. プロジェクトカードをクリックすると、該当プロジェクトのガント画面へ遷移します。
3. 「すべてのプロジェクトを見る」「自分のタスクを確認する」などのショートカットで主要画面へ移動できます。

### ガントチャート
1. プロジェクトを選択するとガント画面が開き、タスクの期間と進捗がバーで表示されます。
2. タスクバーをドラッグして開始日・終了日を調整すると、変更内容が即座に反映されます。
3. タスク名をクリックするとモーダルが開き、詳細編集やステータス更新が行えます。
4. 画面右上の「新規タスク」ボタンから新しいタスクを追加できます。

### Myタスク
1. サイドメニューの担当者検索から自分の名前を選択するか、「マイタスク」メニューを開きます。
2. 担当タスクの一覧が表示され、ステータス変更や詳細表示が可能です。
3. ステータスを「完了」へ変更すると進捗率が自動的に 100% へ更新されます。

### CSV一括タスク操作
1. ガント画面右上の「CSVアップロード」をクリックし、モーダルを開きます。
2. 「テンプレートをダウンロード」で最新の CSV フォーマットを取得し、必要なタスク情報を入力します。
3. CSV ファイルをアップロードすると自動でバリデーションが実行され、エラー行はプレビュー上で編集できます。
4. エラーを解消したら「一括処理を実行」を押すと、Dataverse へ CREATE/UPDATE/DELETE が送信され、結果が表示されます。

### プロジェクト・担当者ナビゲーション
1. サイドメニューのプロジェクト一覧から対象を選択すると、そのプロジェクトのガント画面へ移動します。
2. 担当者検索欄から名前で絞り込み、「担当者一覧」セクションで該当者のタスクを開けます。

## 技術スタック（Microsoft公式準拠）

### 必須依存関係
- **@microsoft/power-apps**: Power Platform SDK (^0.3.1)
- **React 18.2.0**: フロントエンドフレームワーク（React 19非対応）
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール（ポート3000固定）

### UI ライブラリ（テーマ対応）
- **shadcn/ui**: 高品質UIコンポーネント
- **Radix UI**: アクセシブルなプリミティブ
- **Tailwind CSS**: ユーティリティファーストCSS + ダークモード対応
- **Lucide React**: 一貫したアイコンセット

### 状態管理・データフェッチ
- **TanStack Query**: サーバ状態管理とキャッシュ
- **React Hook Form**: フォーム状態管理
- **date-fns**: 日付操作ライブラリ

## 開発標準準拠

### Phase 1: プロジェクト環境構築・PowerProvider・SDK初期化
- ✅ Vite + React + TypeScript プロジェクト作成
- ✅ `@microsoft/power-apps` SDK インストール
- ✅ PowerProvider コンポーネント実装
- ✅ 基本的な React アプリ構造作成
- ✅ ローカル開発環境設定

### Phase 2: MVP構築
- ✅ 要件に基づいた MVP 機能実装
- ✅ PowerProvider.tsx 保護（接続部分非変更）
- ✅ UI コンポーネント・ビジネスロジック実装
- ✅ ビルド・エラーチェック・ローカル実行

### Phase 3: Power Apps環境からローカル実行  
- ✅ ビルド実行成功
- ✅ 全ファイルの警告・エラーチェック完了
- ✅ Power Apps ローカル実行・動作確認

### Phase 4: Power Apps環境へのデプロイ
- ✅ 本番ビルド成功
- ✅ デプロイ実行完了
- ✅ 未実装機能の文書化

## Code Apps ソリューションのインストール方法

### 前提条件
- ✅ Visual Studio Code
- ✅ Node.js (LTS版)
- ✅ Git  
- ✅ Power Platform CLI (`pac`)
- ✅ Power Apps Premium ライセンス / 対象環境へのアクセス権

### Step 1: リポジトリの取得と依存関係のインストール
```bash
git clone https://github.com/geekfujiwara/GanttChartSample1.git
cd GanttChartSample1
npm install
```

### Step 2: Power Platform CLI の認証と環境選択
```bash
# Power Platform へのサインイン
pac auth create

# デプロイ先環境を選択（環境ID または URL を指定）
pac env select -env <環境IDまたはURL>
```

### Step 3: ローカル確認
```bash
# 型チェック（任意）
npm run type-check

# 開発サーバーの起動（必要に応じて環境変数を設定）
npm run dev
```

### Step 4: ビルドと Power Apps へのプッシュ
```bash
# 本番ビルドの生成
npm run build

# 選択した環境へソリューションをデプロイ
pac code push
```

> ⚠️ 既に別の環境でアプリを公開している場合は、`pac env select` で必ずデプロイ先を切り替えてから `pac code push` を実行してください。処理完了後に表示される URL から公開されたアプリを確認できます。

## プロジェクト構造（推奨パターン準拠）
```
code-app-project/
├── src/
│   ├── components/          # React UI コンポーネント
│   │   ├── ui/             # shadcn/ui プリミティブ
│   │   └── theme/          # テーマプロバイダー
│   ├── data/               # 静的データ (開発用)
│   ├── lib/                # ユーティリティライブラリ
│   ├── App.tsx             # メインアプリケーション
│   ├── PowerProvider.tsx   # SDK 初期化プロバイダー
│   └── main.tsx            # エントリーポイント
├── public/                 # 静的アセット
├── power.config.json       # Power Platform 設定 (自動生成)
├── package.json            # npm 依存関係
├── vite.config.ts          # Vite ビルド設定
└── tailwind.config.js      # TailwindCSS 設定
```

## 設計原則（Code Apps 特有）

1. **静的データファースト**: 実データ統合前のUI完成
2. **段階的コネクタ統合**: 静的 → モック → 実データ  
3. **Power Platform ネイティブ**: SDK とコネクタ活用
4. **モーダル中心 UI**: ブラウザポップアップ不使用
5. **テーマ対応設計**: ダーク・ライト・システム設定切り替え
6. **レスポンシブデザイン**: デスクトップ・モバイル対応

## 今後の拡張予定

### Phase 5: 機能拡張（未実装）
- [ ] Office 365 Users コネクター統合
- [ ] Dataverse テーブル連携
- [ ] SharePoint リスト統合
- [ ] Azure SQL Database 接続
- [ ] レポーティング機能
- [ ] 通知システム
- [ ] ユーザー権限管理

## ライセンス
MIT License

## 開発標準
本プロジェクトは [geekfujiwara/CodeAppsDevelopmentStandard](https://github.com/geekfujiwara/CodeAppsDevelopmentStandard) に準拠して開発されています。

---

**Power Apps Code Apps** で構築された Microsoft 公式パターン準拠のプロジェクト管理アプリケーションです。