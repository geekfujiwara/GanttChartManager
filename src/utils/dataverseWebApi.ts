/**
 * Dataverse Web API を直接使用してデータを取得するユーティリティ
 * Power Apps SDK のデータソース制限を回避
 */

/**
 * SystemUser の型定義
 */
export interface DataverseSystemUser {
  systemuserid: string;
  fullname: string;
  internalemailaddress?: string;
  azureactivedirectoryobjectid?: string;
  isdisabled?: boolean;
  title?: string;
}

/**
 * Dataverse Web API を使用して SystemUser 一覧を取得
 * 
 * @param top 取得する最大レコード数（デフォルト: 100）
 * @returns SystemUser の配列
 */
export async function fetchSystemUsersViaWebAPI(top: number = 100): Promise<DataverseSystemUser[]> {
  try {
    console.log('🌐 Fetching SystemUsers via Dataverse Web API...');

    // Power Apps の context から組織 URL を取得
    if (typeof window === 'undefined' || !window.location.hostname.includes('apps.powerapps.com')) {
      console.warn('⚠️ Not in Power Apps environment');
      return [];
    }

    // Dataverse Web API エンドポイント
    // 注意: Power Apps Code Components では Xrm.WebApi を使用する必要がある
    // ここでは fetch API を使用する例を示すが、実際には動作しない可能性がある
    
    const query = `/api/data/v9.2/systemusers?$select=systemuserid,fullname,internalemailaddress,azureactivedirectoryobjectid,isdisabled,title&$filter=isdisabled eq false&$top=${top}`;

    console.log('📡 Query:', query);

    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ SystemUsers fetched:', data.value?.length || 0);

    return data.value || [];
  } catch (error) {
    console.error('❌ Error fetching SystemUsers via Web API:', error);
    throw error;
  }
}

/**
 * 現在のユーザー情報を取得
 */
export async function fetchCurrentUserViaWebAPI(): Promise<DataverseSystemUser | null> {
  try {
    console.log('🔍 Fetching current user via Dataverse Web API...');

    const query = `/api/data/v9.2/WhoAmI`;

    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const userId = data.UserId;

    // ユーザー情報を取得
    const userQuery = `/api/data/v9.2/systemusers(${userId})?$select=systemuserid,fullname,internalemailaddress,azureactivedirectoryobjectid,title`;
    const userResponse = await fetch(userQuery, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`HTTP error! status: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('✅ Current user fetched:', userData.fullname);

    return userData;
  } catch (error) {
    console.error('❌ Error fetching current user via Web API:', error);
    return null;
  }
}

/**
 * Power Apps の Xrm.WebApi を使用する方法（推奨）
 * 
 * 注意: この方法は Power Apps Canvas Apps では使用できません
 * Model-driven Apps または Custom Pages でのみ使用可能
 */
export async function fetchSystemUsersViaXrmWebApi(top: number = 100): Promise<DataverseSystemUser[]> {
  try {
    console.log('🔧 Fetching SystemUsers via Xrm.WebApi...');

    // @ts-ignore - Xrm は Power Apps 環境でのみ利用可能
    if (typeof Xrm === 'undefined' || !Xrm.WebApi) {
      console.warn('⚠️ Xrm.WebApi is not available');
      return [];
    }

    // @ts-ignore
    const result = await Xrm.WebApi.retrieveMultipleRecords(
      'systemuser',
      `?$select=systemuserid,fullname,internalemailaddress,azureactivedirectoryobjectid,isdisabled,title&$filter=isdisabled eq false&$top=${top}`
    );

    console.log('✅ SystemUsers fetched via Xrm.WebApi:', result.entities?.length || 0);

    return result.entities || [];
  } catch (error) {
    console.error('❌ Error fetching SystemUsers via Xrm.WebApi:', error);
    throw error;
  }
}
