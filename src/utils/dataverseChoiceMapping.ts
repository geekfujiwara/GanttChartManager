/**
 * Dataverse Choice(選択肢)フィールドの値マッピング
 * 
 * Dataverseでは選択肢フィールドは整数値として保存されます。
 * UIの文字列表現とDataverseの整数値を相互変換します。
 * 
 * ⚠️ 実際のDataverseスキーマから取得した正確な値 (customizations.xml):
 * 
 * geek_priority（優先度）:
 *   0: 低 (Low)
 *   1: 中 (Medium)
 *   2: 高 (High)
 *   3: 緊急 (Critical)
 * 
 * geek_category（カテゴリ）:
 *   0: 計画 (Planning)
 *   1: 設定 (Setup)
 *   2: 移行 (Migration)
 *   3: トレーニング (Training)
 *   4: テスト (Testing)
 *   5: 本稼働 (GoLive)
 * 
 * geek_status（タスク状態）:
 *   0: 完了 (Completed)
 *   1: 進行中 (InProgress)
 *   2: 未開始 (NotStarted)
 *   3: 保留 (OnHold)
 *   4: キャンセル (Cancelled)
 * 
 * geek_status（プロジェクト状態）:
 *   0: InProgress
 *   1: Planning
 */

import type { Task, Project } from '@/data/sampleProjects';

// Priority（優先度）のマッピング - 実際のDataverseスキーマより (customizations.xml)
// 値: 0=低, 1=中, 2=高, 3=緊急
export const PriorityChoiceMap = {
  Low: 0,       // 低 - Dataverseに実在
  Medium: 1,    // 中 - Dataverseに実在
  High: 2,      // 高 - Dataverseに実在
  Critical: 3   // 緊急 - Dataverseに実在
} as const;

export const PriorityChoiceReverseMap: Record<number, Task['priority']> = {
  0: 'Low',      // 低
  1: 'Medium',   // 中
  2: 'High',     // 高
  3: 'Critical'  // 緊急
};

// Category（カテゴリ）のマッピング - 実際のDataverseスキーマより (customizations.xml)
// 値: 0=計画, 1=設定, 2=移行, 3=トレーニング, 4=テスト, 5=本稼働
export const CategoryChoiceMap = {
  Planning: 0,   // 計画 - Dataverseに実在
  Setup: 1,      // 設定 - Dataverseに実在
  Migration: 2,  // 移行 - Dataverseに実在
  Training: 3,   // トレーニング - Dataverseに実在
  Testing: 4,    // テスト - Dataverseに実在
  GoLive: 5      // 本稼働 - Dataverseに実在
} as const;

export const CategoryChoiceReverseMap: Record<number, Task['category']> = {
  0: 'Planning',   // 計画
  1: 'Setup',      // 設定
  2: 'Migration',  // 移行
  3: 'Training',   // トレーニング
  4: 'Testing',    // テスト
  5: 'GoLive'      // 本稼働
};

// Task Status（タスクステータス）のマッピング - 実際のDataverseスキーマより (customizations.xml)
// 値: 0=完了, 1=進行中, 2=未開始, 3=保留, 4=キャンセル
export const TaskStatusChoiceMap = {
  NotStarted: 2,  // 未開始 - Dataverseに実在
  InProgress: 1,  // 進行中 - Dataverseに実在
  Completed: 0,   // 完了 - Dataverseに実在
  OnHold: 3,      // 保留 - Dataverseに実在
  Cancelled: 4    // キャンセル - Dataverseに実在
} as const;

export const TaskStatusChoiceReverseMap: Record<number, Task['status']> = {
  0: 'Completed',   // 完了
  1: 'InProgress',  // 進行中
  2: 'NotStarted',  // 未開始
  3: 'OnHold',      // 保留
  4: 'Cancelled'    // キャンセル
};

// Project Status（プロジェクトステータス）のマッピング - 実際のDataverseスキーマより (customizations.xml)
// 値: 0=InProgress, 1=Planning
// ⚠️ Completed と OnHold は未定義のため、既存の値にマップ
export const ProjectStatusChoiceMap = {
  Planning: 1,    // Planning - Dataverseに実在
  InProgress: 0,  // InProgress - Dataverseに実在
  Completed: 0,   // InProgressと同じ値にマップ（Dataverseに未定義）
  OnHold: 1       // Planningと同じ値にマップ（Dataverseに未定義）
} as const;

export const ProjectStatusChoiceReverseMap: Record<number, Project['status']> = {
  0: 'InProgress',  // InProgress
  1: 'Planning'     // Planning
};

/**
 * UIの文字列値をDataverseの整数値に変換
 */
export function convertToDataverseChoice<T extends string>(
  value: T | undefined,
  choiceMap: Record<string, number>
): number | undefined {
  if (!value) return undefined;
  return choiceMap[value];
}

/**
 * Dataverseの整数値をUIの文字列値に変換
 */
export function convertFromDataverseChoice<T extends string>(
  value: number | string | undefined,
  reverseMap: Record<number, T>
): T | undefined {
  if (value === undefined || value === null) return undefined;
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  return reverseMap[numValue];
}

/**
 * Dataverseの選択肢フィールド名の文字列値を整数値に変換
 * 例: geek_priorityname（"Medium"） → geek_priority（726210001）
 */
export function convertChoiceNameToValue(
  choiceName: string | undefined,
  choiceMap: Record<string, number>
): number | undefined {
  if (!choiceName) return undefined;
  return choiceMap[choiceName];
}
