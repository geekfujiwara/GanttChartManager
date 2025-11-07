import { useState, useEffect, useCallback } from 'react';
import { SystemUsersService, SystemUserView } from '../generated/services/SystemUsersService';
import type { SystemUser } from '../generated/services/SystemUsersService';
import { usePowerApps } from '../PowerProvider';

/**
 * 標準化されたユーザー型
 */
export interface StandardUser {
  id: string;                   // Dataverse SystemUser ID (GUID)
  displayName: string;          // フルネーム
  email?: string;               // メールアドレス
  jobTitle?: string;            // 役職
  azureADObjectId?: string;     // Azure AD Object ID (参照用)
}

/**
 * Power Apps環境の検出
 */
const isPowerAppsEnvironment = (): boolean => {
  return typeof window !== 'undefined' && (
    window.location.hostname.includes('apps.powerapps.com') ||
    window.location.hostname.includes('make.powerapps.com') ||
    window.location.hostname.includes('create.powerapps.com') ||
    process.env.NODE_ENV === 'production'
  );
};

/**
 * Dataverse SystemUsers テーブルからユーザー一覧を取得し、
 * 標準化された形式で返すフック
 * 
 * 注意: SystemUser の systemuserid は Dataverse の GUID です。
 * このIDをDataverseのlookupフィールド (geek_lookup_assignee) に保存します。
 */
export const useDataverseUsers = () => {
  const { isInitialized } = usePowerApps();
  const [currentUser, setCurrentUser] = useState<StandardUser | null>(null);
  const [users, setUsers] = useState<StandardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [views, setViews] = useState<SystemUserView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string>(SystemUsersService.VIEWS.ACTIVE_USERS);
  const [viewsLoading, setViewsLoading] = useState(false);

  // ビュー一覧を取得
  useEffect(() => {
    const fetchViews = async () => {
      if (!isPowerAppsEnvironment()) {
        return;
      }

      try {
        setViewsLoading(true);
        console.log('🔍 useDataverseUsers: Fetching SystemUser views...');
        
        const viewsResult = await SystemUsersService.getViews();
        
        console.log('✅ Views result:', {
          success: viewsResult.success,
          count: viewsResult.data?.length,
          views: viewsResult.data
        });
        
        if (viewsResult.success && viewsResult.data && viewsResult.data.length > 0) {
          console.log('✅ Views fetched:', viewsResult.data.length);
          setViews(viewsResult.data);
        } else {
          console.warn('⚠️ No views returned, using predefined list');
          // フォールバック: 事前定義されたビューリスト
          setViews(SystemUsersService.PREDEFINED_VIEWS);
        }
      } catch (err) {
        console.error('❌ Error fetching views, using predefined list:', err);
        setViews(SystemUsersService.PREDEFINED_VIEWS);
      } finally {
        setViewsLoading(false);
      }
    };

    // Power Apps環境でのみビューを取得
    if (isInitialized) {
      fetchViews();
    }
  }, [isInitialized]);

  // 選択したビューでユーザーを取得
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('🔍 useDataverseUsers: Fetching users with view:', currentViewId);

        if (!isPowerAppsEnvironment()) {
          console.log('🛠️ Development mode - returning empty list');
          setUsers([]);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        console.log('📱 Power Apps environment detected');

        // Power Apps SDK の初期化を待つ
        if (!isInitialized) {
          console.log('⏳ Waiting for Power Apps SDK initialization...');
          setLoading(true);
          return;
        }

        console.log('✅ Power Apps SDK is initialized');

        // 指定したビューでユーザーを取得
        console.log('👥 Fetching users from SystemUsers using view:', currentViewId);
        const usersResult = await SystemUsersService.getUsersByView(currentViewId, {
          select: ['systemuserid', 'fullname', 'internalemailaddress', 'title', 'azureactivedirectoryobjectid', 'isdisabled'],
          top: 100
        });
        
        console.log('✅ SystemUsers result:', {
          success: usersResult.success,
          dataLength: usersResult.data?.length,
          viewId: currentViewId
        });

        if (usersResult.success && usersResult.data && usersResult.data.length > 0) {
          console.log('🔄 Mapping', usersResult.data.length, 'users...');
          
          const standardUsers: StandardUser[] = usersResult.data
            .filter(user => user.systemuserid) // systemuserid が存在するユーザーのみ
            .map((user: SystemUser, index: number) => {
              if (index < 5) {
                console.log(`  User ${index + 1}:`, {
                  systemuserid: user.systemuserid,
                  fullname: user.fullname,
                  internalemailaddress: user.internalemailaddress,
                  azureactivedirectoryobjectid: user.azureactivedirectoryobjectid,
                  isdisabled: user.isdisabled
                });
              }
              
              return {
                id: user.systemuserid!, // Dataverse SystemUser GUID
                displayName: user.fullname || 'ユーザー名なし',
                email: user.internalemailaddress,
                jobTitle: user.title,
                azureADObjectId: user.azureactivedirectoryobjectid || undefined
              };
            });

          console.log('✅ User list mapped:', standardUsers.length, 'users');
          
          setUsers(standardUsers);
          
          // 現在のユーザーを最初のユーザーに設定（より良い方法: Azure AD Object ID でマッチング）
          if (standardUsers.length > 0) {
            setCurrentUser(standardUsers[0]);
          }

          console.log('🎉 Successfully loaded', standardUsers.length, 'users from SystemUsers');

        } else {
          console.warn('⚠️ SystemUsers returned no data');
          setUsers([]);
          setCurrentUser(null);
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ useDataverseUsers: Error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setUsers([]);
        setCurrentUser(null);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isInitialized, currentViewId]);

  // ビュー切り替え関数
  const changeView = useCallback((viewId: string) => {
    console.log('🔄 Changing view to:', viewId);
    setCurrentViewId(viewId);
  }, []);

  return { 
    currentUser, 
    users, 
    loading, 
    error,
    views,
    viewsLoading,
    currentViewId,
    changeView
  };
};
