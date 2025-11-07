/**
 * SystemUser (ユーザー) サービス
 * 
 * Dataverse標準テーブル SystemUser へのアクセスを提供
 * 開発標準: https://github.com/geekfujiwara/CodeAppsDevelopmentStandard
 */

import { dataSourcesInfo } from '../../../.power/appschemas/dataSourcesInfo';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { getClient } from '@microsoft/power-apps/data';
import type { IGetOptions, IGetAllOptions } from '../models/CommonModels';

export interface SystemUser {
  systemuserid?: string;          // 主キー
  fullname?: string;              // フルネーム
  internalemailaddress?: string;  // メールアドレス
  title?: string;                 // 役職
  isdisabled?: boolean;           // 無効化されているか
  azureactivedirectoryobjectid?: string; // Azure AD オブジェクトID
}

/**
 * SystemUser ビュー情報
 */
export interface SystemUserView {
  savedqueryid: string;           // ビューID
  name: string;                   // ビュー名
  returnedtypecode: string;       // エンティティタイプコード
  fetchxml?: string;              // FetchXML
}

/**
 * SystemUser テーブルサービス
 */
export class SystemUsersService {
  private static readonly dataSourceName = 'systemusers';
  private static readonly client = getClient(dataSourcesInfo);
  
  // アクティブなユーザービューのID
  private static readonly ACTIVE_USERS_VIEW_ID = '00000000-0000-0000-00aa-000010001019';
  
  // よく使うビューID
  public static readonly VIEWS = {
    ACTIVE_USERS: '00000000-0000-0000-00aa-000010001019',     // アクティブなユーザー
    ENABLED_USERS: '00000000-0000-0000-00aa-000010001039',    // 有効なユーザー
    DISABLED_USERS: '00000000-0000-0000-00aa-000010001029',   // 無効なユーザー
    ALL_USERS: '00000000-0000-0000-00aa-000010001001',        // すべてのユーザー
  };
  
  // 利用可能なビューリスト（事前定義）
  public static readonly PREDEFINED_VIEWS: SystemUserView[] = [
    { savedqueryid: '00000000-0000-0000-00aa-000010001019', name: 'アクティブなユーザー', returnedtypecode: 'systemuser' },
    { savedqueryid: '00000000-0000-0000-00aa-000010001039', name: '有効なユーザー', returnedtypecode: 'systemuser' },
    { savedqueryid: '00000000-0000-0000-00aa-000010001029', name: '無効なユーザー', returnedtypecode: 'systemuser' },
  ];
  
  // ビューごとのフィルター条件
  private static readonly VIEW_FILTERS: Record<string, string> = {
    '00000000-0000-0000-00aa-000010001019': 'isdisabled eq false and accessmode ne 4',  // アクティブなユーザー
    '00000000-0000-0000-00aa-000010001039': 'isdisabled eq false',                        // 有効なユーザー
    '00000000-0000-0000-00aa-000010001029': 'isdisabled eq true',                         // 無効なユーザー
  };

  /**
   * 利用可能なビュー一覧を取得
   */
  public static async getViews(): Promise<IOperationResult<SystemUserView[]>> {
    console.log('🔍 Fetching SystemUser views (using predefined list)...');
    
    // 事前定義されたビューリストを返す
    // savedqueries テーブルへのアクセス権限がない場合があるため
    return {
      success: true,
      data: SystemUsersService.PREDEFINED_VIEWS
    };
  }

  /**
   * 指定したビューでユーザー一覧を取得
   */
  public static async getUsersByView(viewId: string, options?: IGetAllOptions): Promise<IOperationResult<SystemUser[]>> {
    console.log('🔧 SystemUsersService.getUsersByView called:', {
      dataSourceName: SystemUsersService.dataSourceName,
      viewId,
      options
    });

    // ビューに対応するフィルター条件を取得
    const viewFilter = SystemUsersService.VIEW_FILTERS[viewId];
    
    // クエリオプションにフィルター条件を追加
    const queryOptions: IGetAllOptions = {
      ...options,
      select: options?.select || ['systemuserid', 'fullname', 'internalemailaddress', 'title', 'azureactivedirectoryobjectid', 'isdisabled'],
      filter: viewFilter || options?.filter,  // ビューのフィルター条件を使用
      orderBy: ['fullname asc']
    };

    console.log('🔧 Calling retrieveMultipleRecordsAsync with filter:', {
      viewId,
      filter: queryOptions.filter,
      queryOptions
    });

    const result = await SystemUsersService.client.retrieveMultipleRecordsAsync<SystemUser>(
      SystemUsersService.dataSourceName,
      queryOptions
    );

    console.log('🔧 SystemUsersService result:', {
      viewId,
      success: result.success,
      dataLength: result.data?.length,
      filter: queryOptions.filter,
      error: result.error
    });

    return result;
  }

  /**
   * アクティブなユーザー一覧を取得（ビューを使用）
   */
  public static async getActiveUsers(options?: IGetAllOptions): Promise<IOperationResult<SystemUser[]>> {
    return SystemUsersService.getUsersByView(SystemUsersService.ACTIVE_USERS_VIEW_ID, options);
  }

  /**
   * すべてのユーザー一覧を取得
   */
  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<SystemUser[]>> {
    const queryOptions: IGetAllOptions = {
      ...options,
      select: options?.select || ['systemuserid', 'fullname', 'internalemailaddress', 'title', 'isdisabled']
    };

    const result = await SystemUsersService.client.retrieveMultipleRecordsAsync<SystemUser>(
      SystemUsersService.dataSourceName,
      queryOptions
    );

    return result;
  }

  /**
   * IDでユーザーを取得
   */
  public static async get(id: string, options?: IGetOptions): Promise<IOperationResult<SystemUser>> {
    const result = await SystemUsersService.client.retrieveRecordAsync<SystemUser>(
      SystemUsersService.dataSourceName,
      id.toString(),
      options
    );

    return result;
  }
}
