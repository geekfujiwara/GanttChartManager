/**
 * SystemUsers データ取得のフォールバック方法
 * Power Apps SDK でデータソースが見つからない場合の代替手段
 */

export interface SystemUserInfo {
  systemuserid: string;
  fullname: string;
  internalemailaddress?: string;
  azureactivedirectoryobjectid?: string;
}

/**
 * Power Fx 式を使用してSystemUsersを取得
 * 注: この方法はCanvas Apps内でのみ動作します
 */
export async function fetchSystemUsersViaPowerFx(runtime: any): Promise<SystemUserInfo[]> {
  try {
    // Power Fx式を評価してSystemUsersテーブルから取得
    const formula = `Filter(SystemUsers, IsDisabled = false)`;
    const result = await runtime.evaluate(formula);
    
    if (result && Array.isArray(result)) {
      return result.map((user: any) => ({
        systemuserid: user.SystemUserId || user.systemuserid,
        fullname: user.FullName || user.fullname,
        internalemailaddress: user.InternalEmailAddress || user.internalemailaddress,
        azureactivedirectoryobjectid: user.AzureActiveDirectoryObjectId || user.azureactivedirectoryobjectid
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Power Fx evaluation failed:', error);
    throw error;
  }
}

/**
 * 環境変数からDataverseのURLを取得してREST APIを使用
 */
export async function fetchSystemUsersViaEnvironment(): Promise<SystemUserInfo[]> {
  try {
    // Power Apps の環境情報から Dataverse URL を取得
    const context = (window as any).PowerApps?.context;
    
    if (!context?.environment?.dataverseUrl && !context?.environment?.url) {
      throw new Error('Dataverse URL not found in Power Apps context');
    }
    
    const baseUrl = context.environment.dataverseUrl || context.environment.url;
    const apiUrl = `${baseUrl}/api/data/v9.2/systemusers`;
    
    const query = `?$select=systemuserid,fullname,internalemailaddress,azureactivedirectoryobjectid&$filter=isdisabled eq false&$top=100`;
    
    const response = await fetch(`${apiUrl}${query}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include' // 認証情報を含める
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Fetch via environment URL failed:', error);
    throw error;
  }
}

/**
 * 複数の方法を順番に試行
 */
export async function fetchSystemUsersFallback(runtime?: any): Promise<SystemUserInfo[]> {
  const errors: Array<{ method: string; error: any }> = [];
  
  // 方法1: Power Fx (Canvas Apps専用)
  if (runtime) {
    try {
      console.log('Attempting to fetch SystemUsers via Power Fx...');
      const users = await fetchSystemUsersViaPowerFx(runtime);
      if (users.length > 0) {
        console.log(`✅ Success via Power Fx: ${users.length} users found`);
        return users;
      }
    } catch (error) {
      console.warn('❌ Power Fx method failed:', error);
      errors.push({ method: 'Power Fx', error });
    }
  }
  
  // 方法2: 環境URLから取得
  try {
    console.log('Attempting to fetch SystemUsers via environment URL...');
    const users = await fetchSystemUsersViaEnvironment();
    if (users.length > 0) {
      console.log(`✅ Success via environment URL: ${users.length} users found`);
      return users;
    }
  } catch (error) {
    console.warn('❌ Environment URL method failed:', error);
    errors.push({ method: 'Environment URL', error });
  }
  
  // すべて失敗
  console.error('All fallback methods failed:', errors);
  throw new Error(`Failed to fetch SystemUsers. Tried ${errors.length} methods. Last error: ${errors[errors.length - 1]?.error?.message}`);
}
