import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Building2, MapPin, Phone, Calendar, Users, Briefcase } from 'lucide-react';
import { useOffice365Users } from '@/hooks/useOffice365Users';

/**
 * Office 365プロファイルUI
 * GitHub CodeAppsDevelopmentStandardに基づいて構築
 * StandardOffice365Userインターフェースを使用
 */
export const ProfileUI: React.FC = () => {
  const { currentUser, loading, error } = useOffice365Users();

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">ユーザー情報を読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-destructive">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <p className="font-semibold">エラーが発生しました</p>
            <p className="text-sm mt-2">{error?.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4" />
            <p>ユーザー情報が利用できません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // プロファイル画像のURL生成（Office 365の場合）
  const getProfileImageUrl = (user: typeof currentUser) => {
    if (user.mail) {
      // Microsoft Graph APIのプロファイル画像エンドポイント
      return `https://graph.microsoft.com/v1.0/users/${user.userPrincipalName}/photo/$value`;
    }
    return undefined;
  };

  // ユーザーのイニシャルを取得
  const getUserInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage 
              src={getProfileImageUrl(currentUser)} 
              alt={currentUser.displayName}
            />
            <AvatarFallback className="text-xl font-semibold">
              {getUserInitials(currentUser.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl">{currentUser.displayName}</CardTitle>
            <CardDescription className="text-base">
              {currentUser.userPrincipalName}
            </CardDescription>
          </div>

          {currentUser.jobTitle && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Briefcase className="w-4 h-4 mr-2" />
              {currentUser.jobTitle}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="grid gap-6">
          {/* 基本情報セクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <User className="w-5 h-5 mr-2" />
              基本情報
            </h3>
            
            <div className="grid gap-3 ml-7">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">メールアドレス</p>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.mail || 'メールアドレスなし'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ユーザープリンシパル名</p>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.userPrincipalName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ユーザーID</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {currentUser.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 組織情報セクション */}
          {(currentUser.department || currentUser.officeLocation || currentUser.companyName) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  組織情報
                </h3>
                
                <div className="grid gap-3 ml-7">
                  {currentUser.department && (
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">部署</p>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.department}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentUser.companyName && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">会社名</p>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.companyName}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentUser.officeLocation && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">オフィス所在地</p>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.officeLocation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 連絡先情報セクション */}
          {(currentUser.businessPhones || currentUser.mobilePhone) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  連絡先
                </h3>
                
                <div className="grid gap-3 ml-7">
                  {currentUser.businessPhones && currentUser.businessPhones.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">会社電話番号</p>
                        <div className="space-y-1">
                          {currentUser.businessPhones.map((phone, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              {phone}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentUser.mobilePhone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">携帯電話番号</p>
                        <p className="text-sm text-muted-foreground">
                          {currentUser.mobilePhone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileUI;