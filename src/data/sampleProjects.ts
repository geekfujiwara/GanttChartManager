// IT システム導入プロジェクト用のサンプルデータ
export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  duration: number; // 日数
  progress: number; // 0-100%
  dependencies: string[]; // 依存タスクID
  assignee: string; // 担当者の表示名
  assigneeId?: string; // 担当者のユーザーID（Dataverse検索列用）
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'Planning' | 'Setup' | 'Migration' | 'Training' | 'Testing' | 'GoLive';
  description?: string;
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  start: Date;
  end: Date;
  manager: string;
  managerId?: string; // プロジェクトマネージャーのシステムユーザーID（Dataverse検索列用）
  status: 'Planning' | 'InProgress' | 'Completed' | 'OnHold';
  tasks: Task[];
}

// Office 365 導入プロジェクト
export const office365Project: Project = {
  id: 'office365-deployment',
  name: 'Office 365 導入プロジェクト',
  description: '全社Office 365環境の構築と移行',
  start: new Date('2025-01-15'),
  end: new Date('2025-06-30'),
  manager: '田中プロジェクトマネージャー',
  status: 'InProgress',
  tasks: [
    // フェーズ1: 計画・準備
    {
      id: 'o365-001',
      name: 'プロジェクト立ち上げ',
      start: new Date('2025-01-15'),
      end: new Date('2025-01-19'),
      duration: 5,
      progress: 100,
      dependencies: [],
      assignee: '田中PM',
      priority: 'Critical',
      category: 'Planning',
      description: 'プロジェクト体制確立、キックオフ実施',
      status: 'Completed'
    },
    {
      id: 'o365-002',
      name: '要件定義・設計',
      start: new Date('2025-01-20'),
      end: new Date('2025-02-07'),
      duration: 15,
      progress: 90,
      dependencies: ['o365-001'],
      assignee: '佐藤システムアーキテクト',
      priority: 'High',
      category: 'Planning',
      description: 'ユーザー要件、技術要件の確定',
      status: 'InProgress'
    },
    {
      id: 'o365-003',
      name: 'ライセンス調達',
      start: new Date('2025-01-25'),
      end: new Date('2025-02-14'),
      duration: 15,
      progress: 70,
      dependencies: ['o365-002'],
      assignee: '山田調達担当',
      priority: 'High',
      category: 'Setup',
      description: 'Office 365 E3ライセンス購入手続き',
      status: 'InProgress'
    },
    
    // フェーズ2: 環境構築
    {
      id: 'o365-004',
      name: 'Azure AD設定',
      start: new Date('2025-02-10'),
      end: new Date('2025-02-21'),
      duration: 10,
      progress: 50,
      dependencies: ['o365-003'],
      assignee: '鈴木インフラエンジニア',
      priority: 'Critical',
      category: 'Setup',
      description: 'Azure Active Directory テナント設定',
      status: 'InProgress'
    },
    {
      id: 'o365-005',
      name: 'Exchange Online 設定',
      start: new Date('2025-02-17'),
      end: new Date('2025-03-07'),
      duration: 15,
      progress: 30,
      dependencies: ['o365-004'],
      assignee: '高橋メールシステム担当',
      priority: 'High',
      category: 'Setup',
      description: 'メールボックス、配布リスト設定',
      status: 'InProgress'
    },
    {
      id: 'o365-006',
      name: 'SharePoint Online 構築',
      start: new Date('2025-02-24'),
      end: new Date('2025-03-21'),
      duration: 20,
      progress: 20,
      dependencies: ['o365-004'],
      assignee: '伊藤SharePoint担当',
      priority: 'Medium',
      category: 'Setup',
      description: 'サイトコレクション、権限設定',
      status: 'NotStarted'
    },
    {
      id: 'o365-007',
      name: 'Teams 環境設定',
      start: new Date('2025-03-03'),
      end: new Date('2025-03-17'),
      duration: 10,
      progress: 10,
      dependencies: ['o365-005'],
      assignee: '渡辺Teams担当',
      priority: 'Medium',
      category: 'Setup',
      description: 'チーム作成、ポリシー設定',
      status: 'NotStarted'
    },
    
    // フェーズ3: データ移行
    {
      id: 'o365-008',
      name: 'メールデータ移行',
      start: new Date('2025-03-10'),
      end: new Date('2025-04-04'),
      duration: 20,
      progress: 0,
      dependencies: ['o365-005'],
      assignee: '加藤移行チーム',
      priority: 'Critical',
      category: 'Migration',
      description: '既存Exchange Serverからの移行',
      status: 'NotStarted'
    },
    {
      id: 'o365-009',
      name: 'ファイルサーバー移行',
      start: new Date('2025-03-24'),
      end: new Date('2025-04-25'),
      duration: 25,
      progress: 0,
      dependencies: ['o365-006'],
      assignee: '小林ファイル移行チーム',
      priority: 'High',
      category: 'Migration',
      description: 'ファイルサーバーからSharePoint移行',
      status: 'NotStarted'
    },
    
    // フェーズ4: テスト・トレーニング
    {
      id: 'o365-010',
      name: '統合テスト',
      start: new Date('2025-04-07'),
      end: new Date('2025-04-25'),
      duration: 15,
      progress: 0,
      dependencies: ['o365-007', 'o365-008'],
      assignee: '森テストチーム',
      priority: 'High',
      category: 'Testing',
      description: 'システム全体の統合テスト実施',
      status: 'NotStarted'
    },
    {
      id: 'o365-011',
      name: 'ユーザートレーニング',
      start: new Date('2025-05-05'),
      end: new Date('2025-05-30'),
      duration: 20,
      progress: 0,
      dependencies: ['o365-010'],
      assignee: '中村トレーニング担当',
      priority: 'Medium',
      category: 'Training',
      description: 'エンドユーザー向け操作研修',
      status: 'NotStarted'
    },
    
    // フェーズ5: 本稼働
    {
      id: 'o365-012',
      name: '本稼働開始',
      start: new Date('2025-06-02'),
      end: new Date('2025-06-06'),
      duration: 5,
      progress: 0,
      dependencies: ['o365-009', 'o365-011'],
      assignee: '田中PM',
      priority: 'Critical',
      category: 'GoLive',
      description: 'システム本稼働、切り替え作業',
      status: 'NotStarted'
    },
    {
      id: 'o365-013',
      name: 'フォローアップ・運用移管',
      start: new Date('2025-06-09'),
      end: new Date('2025-06-30'),
      duration: 15,
      progress: 0,
      dependencies: ['o365-012'],
      assignee: '運用チーム',
      priority: 'Medium',
      category: 'GoLive',
      description: '安定稼働確認、運用チームへの移管',
      status: 'NotStarted'
    }
  ]
};

// Microsoft 365 E5 セキュリティ強化プロジェクト
export const m365SecurityProject: Project = {
  id: 'm365-security-enhancement',
  name: 'Microsoft 365 E5 セキュリティ強化',
  description: 'Microsoft Defender、Information Protection導入',
  start: new Date('2025-03-01'),
  end: new Date('2025-08-31'),
  manager: '佐藤セキュリティマネージャー',
  status: 'Planning',
  tasks: [
    {
      id: 'm365sec-001',
      name: 'セキュリティ要件分析',
      start: new Date('2025-03-01'),
      end: new Date('2025-03-14'),
      duration: 10,
      progress: 0,
      dependencies: [],
      assignee: '佐藤セキュリティアーキテクト',
      priority: 'Critical',
      category: 'Planning',
      description: 'セキュリティリスク評価、要件定義',
      status: 'NotStarted'
    },
    {
      id: 'm365sec-002',
      name: 'Microsoft Defender for Office 365 設定',
      start: new Date('2025-03-17'),
      end: new Date('2025-04-11'),
      duration: 20,
      progress: 0,
      dependencies: ['m365sec-001'],
      assignee: '金子セキュリティエンジニア',
      priority: 'High',
      category: 'Setup',
      description: 'ATP、SafeAttachments設定',
      status: 'NotStarted'
    },
    {
      id: 'm365sec-003',
      name: 'Azure Information Protection 展開',
      start: new Date('2025-04-14'),
      end: new Date('2025-05-16'),
      duration: 25,
      progress: 0,
      dependencies: ['m365sec-002'],
      assignee: '藤田データ保護担当',
      priority: 'High',
      category: 'Setup',
      description: 'データ分類、ラベル設定',
      status: 'NotStarted'
    },
    {
      id: 'm365sec-004',
      name: '条件付きアクセス設定',
      start: new Date('2025-05-19'),
      end: new Date('2025-06-13'),
      duration: 20,
      progress: 0,
      dependencies: ['m365sec-003'],
      assignee: 'ID管理チーム',
      priority: 'Critical',
      category: 'Setup',
      description: 'MFA、デバイス管理ポリシー',
      status: 'NotStarted'
    },
    {
      id: 'm365sec-005',
      name: 'セキュリティテスト',
      start: new Date('2025-06-16'),
      end: new Date('2025-07-11'),
      duration: 20,
      progress: 0,
      dependencies: ['m365sec-004'],
      assignee: 'セキュリティテストチーム',
      priority: 'High',
      category: 'Testing',
      description: 'ペネトレーションテスト、脆弱性診断',
      status: 'NotStarted'
    },
    {
      id: 'm365sec-006',
      name: 'セキュリティ教育',
      start: new Date('2025-07-14'),
      end: new Date('2025-08-15'),
      duration: 25,
      progress: 0,
      dependencies: ['m365sec-005'],
      assignee: 'セキュリティ教育チーム',
      priority: 'Medium',
      category: 'Training',
      description: 'フィッシング対策、セキュリティ意識向上',
      status: 'NotStarted'
    },
    {
      id: 'm365sec-007',
      name: '本格運用開始',
      start: new Date('2025-08-18'),
      end: new Date('2025-08-31'),
      duration: 10,
      progress: 0,
      dependencies: ['m365sec-006'],
      assignee: 'セキュリティ運用チーム',
      priority: 'Critical',
      category: 'GoLive',
      description: 'セキュリティ監視体制確立',
      status: 'NotStarted'
    }
  ]
};

// 全プロジェクトのリスト
export const sampleProjects: Project[] = [
  office365Project,
  m365SecurityProject
];

// プロジェクトの統計情報を計算するヘルパー関数
export const getProjectStats = (project: Project) => {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = project.tasks.filter(task => task.status === 'InProgress').length;
  const overdueTasks = project.tasks.filter(task => 
    task.end < new Date() && task.status !== 'Completed'
  ).length;
  
  const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
  const avgProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    avgProgress,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
};

// カテゴリ別の色設定
export const categoryColors: Record<Task['category'], string> = {
  Planning: 'bg-blue-500',
  Setup: 'bg-purple-500', 
  Migration: 'bg-orange-500',
  Training: 'bg-green-500',
  Testing: 'bg-yellow-500',
  GoLive: 'bg-red-500'
};

// 優先度ラベルマッピング
export const priorityLabels: Record<Task['priority'], string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Critical: '重要'
};

// ステータスラベルマッピング
export const statusLabels: Record<Task['status'], string> = {
  NotStarted: '未開始',
  InProgress: '進行中',
  Completed: '完了',
  OnHold: '保留',
  Cancelled: 'キャンセル'
};

// カテゴリラベルマッピング
export const categoryLabels: Record<Task['category'], string> = {
  Planning: '計画',
  Setup: 'セットアップ',
  Migration: '移行',
  Training: 'トレーニング',
  Testing: 'テスト',
  GoLive: '本番稼働'
};

// 優先度別の色設定
export const priorityColors: Record<Task['priority'], string> = {
  Low: 'bg-gray-400',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500'
};