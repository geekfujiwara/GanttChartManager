import { useState, useEffect } from 'react';
import { useDataverseUsers } from './useDataverseUsers';

export interface CurrentUser {
  id: string; // システムユーザーのGUID（Dataverseで使用）
  displayName: string;
  email?: string;
}

/**
 * 現在のユーザー情報を取得するカスタムフック
 * Power Apps環境ではDataverse SystemUsersから現在のユーザーを取得
 * 開発環境ではダミーユーザーを返す
 */
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dataverse SystemUsersから現在のユーザーを取得
  const { currentUser: dataverseCurrentUser, loading: dataverseLoading } = useDataverseUsers();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Power Apps環境チェック
        const isPowerApps = typeof window !== 'undefined' && (
          window.location.hostname.includes('apps.powerapps.com') ||
          window.location.hostname.includes('make.powerapps.com') ||
          process.env.NODE_ENV === 'production'
        );

        if (isPowerApps) {
          // Dataverseから現在のユーザー情報を取得
          if (!dataverseLoading && dataverseCurrentUser) {
            console.log('✅ Current user from Dataverse:', dataverseCurrentUser);
            setCurrentUser({
              id: dataverseCurrentUser.id, // システムユーザーのGUID
              displayName: dataverseCurrentUser.displayName,
              email: dataverseCurrentUser.email
            });
          } else if (!dataverseLoading) {
            // Dataverseからの取得に失敗した場合、Power Apps Contextから取得
            console.log('⚠️ Dataverse current user not available, trying Power Apps Context...');
            // @ts-ignore - Power Apps Context
            if (window.powerAppsContext && window.powerAppsContext.userSettings) {
              // @ts-ignore
              const userSettings = window.powerAppsContext.userSettings;
              setCurrentUser({
                id: userSettings.userId || '',
                displayName: userSettings.userName || '不明なユーザー',
                email: userSettings.userEmail
              });
            } else {
              // フォールバック: 開発用ダミーユーザー
              console.log('⚠️ Power Apps Context not available, using dummy user');
              setCurrentUser({
                id: 'dev-user-001',
                displayName: '田中PM',
                email: 'tanaka@example.com'
              });
            }
          }
        } else {
          // 開発環境: ダミーユーザー
          console.log('🔧 Development mode: Using dummy user');
          setCurrentUser({
            id: 'dev-user-001',
            displayName: '田中PM',
            email: 'tanaka@example.com'
          });
        }
      } catch (error) {
        console.error('❌ Failed to fetch current user:', error);
        // エラー時もダミーユーザーを設定
        setCurrentUser({
          id: 'dev-user-001',
          displayName: '田中PM',
          email: 'tanaka@example.com'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [dataverseCurrentUser, dataverseLoading]);

  return {
    currentUser,
    loading,
    isAuthenticated: currentUser !== null
  };
}
