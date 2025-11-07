import { useState, useEffect } from 'react';
import { Office365UsersService } from '../generated/services/Office365UsersService';
import type { User } from '../generated/models/Office365UsersModel';
import { usePowerApps } from '@/PowerProvider';

// CodeAppsDevelopmentStandard準拠のOffice 365 Users型定義
interface StandardOffice365User {
  // 基本情報（必須）
  id: string;
  displayName: string;
  userPrincipalName: string;
  
  // 基本情報（オプショナル）
  mail?: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  
  // 連絡先情報
  businessPhones?: string[];
  mobilePhone?: string;
  
  // システム情報
  preferredLanguage?: string;
  accountEnabled?: boolean;
  
  // V2 API拡張フィールド
  aboutMe?: string;
  interests?: string[];
  skills?: string[];
  responsibilities?: string[];
}



// Power Apps環境の検出
const isPowerAppsEnvironment = (): boolean => {
  return typeof window !== 'undefined' && (
    window.location.hostname.includes('apps.powerapps.com') ||
    window.location.hostname.includes('make.powerapps.com') ||
    window.location.hostname.includes('create.powerapps.com') ||
    process.env.NODE_ENV === 'production'
  );
};

// CodeAppsDevelopmentStandard準拠のOffice365Usersフック
export const useOffice365Users = () => {
  const [currentUser, setCurrentUser] = useState<StandardOffice365User | null>(null);
  const [users, setUsers] = useState<StandardOffice365User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<Error | null>(null); // Office 365エラーは致命的ではないため、常にnull
  const { isInitialized } = usePowerApps();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching Office 365 users data using generated service...');
        
        // Power Apps環境での実際のサービス使用
        if (isPowerAppsEnvironment()) {
          // Power Appsが初期化されるまで待つ
          if (!isInitialized) {
            console.log('⏳ Waiting for Power Apps initialization...');
            return;
          }
          console.log('📱 Using Office365UsersService in Power Apps environment');
          
          try {
            let currentUserData: StandardOffice365User;
            let usersData: StandardOffice365User[] = [];
            
            // 現在のユーザー情報を取得（Microsoft 公式サービス - V2でより詳細なデータ取得）
            try {
              console.log('🔑 Fetching current user profile (V2)...');
              
              // まずV2 APIを使用（より詳細なGraphUser_V1型）
              let userProfileResult;
              try {
                userProfileResult = await Office365UsersService.MyProfile_V2();
                console.log('✅ MyProfile_V2 result:', userProfileResult);
              } catch (v2Error) {
                console.log('⚠️ MyProfile_V2 API error:', v2Error);
                userProfileResult = { success: false, data: null };
              }
              
              if (userProfileResult.success && userProfileResult.data) {
                const user = userProfileResult.data;
                console.log('� V2 Raw user data structure:', JSON.stringify(user, null, 2));
                console.log('🔍 V2 User object keys:', Object.keys(user));
                
                currentUserData = {
                  id: user.id || 'current-user',
                  displayName: user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim() || 'ユーザー',
                  userPrincipalName: user.userPrincipalName || 'unknown@domain.com',
                  mail: user.mail,
                  givenName: user.givenName,
                  surname: user.surname,
                  jobTitle: user.jobTitle,
                  department: user.department,
                  companyName: user.companyName,
                  officeLocation: user.officeLocation,
                  businessPhones: user.businessPhones || [],
                  mobilePhone: user.mobilePhone,
                  preferredLanguage: user.preferredLanguage,
                  accountEnabled: user.accountEnabled,
                  aboutMe: user.aboutMe,
                  interests: user.interests,
                  skills: user.skills,
                  responsibilities: user.responsibilities
                };
                
                console.log('✅ V2 Current user loaded:', currentUserData.displayName);
              } else {
                // V2が失敗した場合、元のMyProfileにフォールバック
                console.log('⚠️ MyProfile_V2 failed, trying MyProfile...');
                let fallbackResult;
                try {
                  fallbackResult = await Office365UsersService.MyProfile();
                  console.log('✅ MyProfile fallback result:', fallbackResult);
                } catch (fallbackError) {
                  console.log('❌ MyProfile API error:', fallbackError);
                  throw new Error('Both MyProfile_V2 and MyProfile APIs failed');
                }
                
                if (fallbackResult.success && fallbackResult.data) {
                  const user = fallbackResult.data;
                  console.log('📊 Fallback user data structure:', JSON.stringify(user, null, 2));
                  
                  currentUserData = {
                    id: user.Id || 'current-user',
                    displayName: user.DisplayName || `${user.GivenName || ''} ${user.Surname || ''}`.trim() || 'ユーザー',
                    userPrincipalName: user.UserPrincipalName || 'unknown@domain.com',
                    mail: user.Mail,
                    givenName: user.GivenName,
                    surname: user.Surname,
                    jobTitle: user.JobTitle,
                    department: user.Department,
                    companyName: user.CompanyName,
                    officeLocation: user.OfficeLocation,
                    businessPhones: user.BusinessPhones || [],
                    mobilePhone: user.mobilePhone,
                    accountEnabled: user.AccountEnabled
                  };
                  
                  console.log('✅ Fallback current user loaded:', currentUserData.displayName);
                } else {
                  throw new Error('Both MyProfile_V2 and MyProfile failed to get user profile data');
                }
              }
            } catch (profileError) {
              console.error('❌ Both MyProfile_V2 and MyProfile failed:', profileError);
              const errorMessage = profileError instanceof Error ? profileError.message : String(profileError);
              throw new Error(`Office 365ユーザープロファイルの取得に失敗しました: ${errorMessage}`);
            }
            
            // ユーザーリストの取得
            try {
              console.log('👥 Fetching user list...');
              
              // SearchUser APIを使用（空検索で全ユーザー取得を試行）
              const searchResult = await Office365UsersService.SearchUser('', 100); // topを100に増やす
              console.log('✅ SearchUser result:', searchResult);
              console.log('  - success:', searchResult.success);
              console.log('  - data:', searchResult.data);
              console.log('  - data.length:', searchResult.data?.length);
              
              if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
                console.log('🔄 Mapping', searchResult.data.length, 'users...');
                
                usersData = searchResult.data.map((user: User, index: number) => {
                  console.log(`  Mapping user ${index + 1}:`, {
                    Id: user.Id,
                    DisplayName: user.DisplayName,
                    Mail: user.Mail
                  });
                  
                  return {
                    id: user.Id || 'unknown',
                    displayName: user.DisplayName || `${user.GivenName || ''} ${user.Surname || ''}`.trim() || 'ユーザー名なし',
                    userPrincipalName: user.UserPrincipalName || 'unknown@domain.com',
                    mail: user.Mail,
                    givenName: user.GivenName,
                    surname: user.Surname,
                    jobTitle: user.JobTitle,
                    department: user.Department,
                    companyName: user.CompanyName,
                    officeLocation: user.OfficeLocation,
                    businessPhones: user.BusinessPhones || [],
                    mobilePhone: user.mobilePhone,
                    accountEnabled: user.AccountEnabled
                  };
                });
                
                console.log('✅ User list mapped:', usersData.length, 'users');
                console.log('  First user:', usersData[0]);
              } else {
                console.warn('⚠️ SearchUser returned no data, using current user only');
                usersData = [currentUserData];
              }
              
            } catch (usersError) {
              console.warn('⚠️ Users list fetch failed:', usersError);
              // 失敗時は現在のユーザーのみを使用
              usersData = [currentUserData];
            }
            
            console.log('🔧 Before setUsers - usersData:', usersData);
            console.log('🔧 usersData.length:', usersData.length);
            
            setCurrentUser(currentUserData);
            setUsers(usersData);
            
            console.log('✅ Office 365 Users data loaded successfully:', {
              currentUser: currentUserData.displayName,
              usersCount: usersData.length,
              users: usersData.map(u => u.displayName)
            });
            
          } catch (serviceError) {
            console.error('❌ Office 365UsersService error:', serviceError);
            const errorMessage = serviceError instanceof Error ? serviceError.message : String(serviceError);
            throw new Error(`Office 365UsersService failed: ${errorMessage}`);
          }
          
        } else {
          console.log('⚠️ Development mode - Office 365コネクタが利用できません');
          throw new Error('Office 365コネクタはPower Apps環境でのみ利用可能です。アプリをPower Appsにデプロイしてください。');
        }
        
      } catch (err) {
        console.warn('⚠️ Office 365 Users data fetch failed (non-critical):', err);
        
        // エラー時はnullに設定（ただしエラーとしては扱わない）
        setCurrentUser(null);
        setUsers([]);
        // Office 365サービスの失敗は致命的ではないため、エラーを設定しない
        // setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isInitialized]); // isInitializedを依存配列に追加

  const getUserById = (userId: string): StandardOffice365User | undefined => {
    return users.find(user => user.id === userId);
  };

  const searchUsers = (searchTerm: string): StandardOffice365User[] => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.displayName.toLowerCase().includes(term) ||
      (user.mail && user.mail.toLowerCase().includes(term)) ||
      user.userPrincipalName.toLowerCase().includes(term) ||
      (user.jobTitle && user.jobTitle.toLowerCase().includes(term)) ||
      (user.department && user.department.toLowerCase().includes(term))
    );
  };

  return {
    currentUser,
    users,
    loading,
    error,
    getUserById,
    searchUsers
  };
};