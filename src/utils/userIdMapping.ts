/**
 * Office 365 User ID と Dataverse SystemUser ID のマッピング
 * 
 * Office 365 Users API は Azure AD Object ID を返すが、
 * Dataverse の Lookup フィールドは SystemUser の GUID (systemuserid) を期待する。
 * 
 * SystemUser テーブルの azureactivedirectoryobjectid フィールドで
 * この2つのIDをマッピングする。
 */

import { SystemUsersService } from '../generated/services/SystemUsersService';

/**
 * Office 365 User ID (Azure AD Object ID) を SystemUser ID (GUID) に変換
 * 
 * @param azureAdObjectId - Office 365 Users API が返す Azure AD Object ID
 * @returns SystemUser の systemuserid (GUID)
 */
export async function mapOffice365IdToSystemUserId(azureAdObjectId: string): Promise<string | null> {
  try {
    console.log('🔄 Mapping Office 365 ID to SystemUser ID:', azureAdObjectId);

    // SystemUser テーブルから azureactivedirectoryobjectid で検索
    const result = await SystemUsersService.getAll({
      filter: `azureactivedirectoryobjectid eq '${azureAdObjectId}'`,
      select: ['systemuserid', 'fullname', 'azureactivedirectoryobjectid'],
      top: 1
    });

    if (result.success && result.data && result.data.length > 0) {
      const systemUser = result.data[0];
      console.log('✅ Found SystemUser:', {
        systemuserid: systemUser.systemuserid,
        fullname: systemUser.fullname,
        azureAdObjectId: systemUser.azureactivedirectoryobjectid
      });
      return systemUser.systemuserid || null;
    } else {
      console.warn('⚠️ SystemUser not found for Azure AD Object ID:', azureAdObjectId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error mapping Office 365 ID to SystemUser ID:', error);
    return null;
  }
}

/**
 * 複数の Office 365 User ID を SystemUser ID にバッチ変換
 * 
 * @param azureAdObjectIds - Office 365 Users API が返す Azure AD Object ID の配列
 * @returns Office 365 ID と SystemUser ID のマップ
 */
export async function mapOffice365IdsToSystemUserIds(azureAdObjectIds: string[]): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();

  if (azureAdObjectIds.length === 0) {
    return mapping;
  }

  try {
    console.log('🔄 Batch mapping Office 365 IDs to SystemUser IDs:', azureAdObjectIds.length);

    // 複数のIDを一度に検索するためのフィルター構築
    const filterParts = azureAdObjectIds.map(id => `azureactivedirectoryobjectid eq '${id}'`);
    const filter = filterParts.join(' or ');

    const result = await SystemUsersService.getAll({
      filter,
      select: ['systemuserid', 'fullname', 'azureactivedirectoryobjectid'],
      top: azureAdObjectIds.length
    });

    if (result.success && result.data) {
      result.data.forEach(systemUser => {
        if (systemUser.azureactivedirectoryobjectid && systemUser.systemuserid) {
          mapping.set(systemUser.azureactivedirectoryobjectid, systemUser.systemuserid);
        }
      });

      console.log('✅ Mapped IDs:', mapping.size, 'out of', azureAdObjectIds.length);
    }
  } catch (error) {
    console.error('❌ Error batch mapping Office 365 IDs to SystemUser IDs:', error);
  }

  return mapping;
}
