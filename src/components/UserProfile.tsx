import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Phone, Building } from "lucide-react";
import { useOffice365Users } from "@/hooks/useOffice365Users";

export function UserProfile() {
  const { currentUser, loading, error } = useOffice365Users();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !currentUser) {
    // Office 365コネクタのエラー時は何も表示しない
    return null;
  }

  // ユーザーのイニシャルを取得
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // デバッグ用ログ出力
  console.log('👤 UserProfile rendering with:', {
    currentUser,
    loading,
    error,
    displayName: currentUser?.displayName,
    mail: currentUser?.mail
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={currentUser.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(currentUser.displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3">
            {/* ユーザーヘッダー */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt={currentUser.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {getInitials(currentUser.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none truncate" title={currentUser.displayName}>
                  {currentUser.displayName || '名前なし'}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1.5 truncate" title={currentUser.mail}>
                  {currentUser.mail || 'メールアドレスなし'}
                </p>
              </div>
            </div>
            
            {/* ユーザー詳細情報 */}
            <div className="space-y-2.5 pt-3 border-t">
              {currentUser.jobTitle && (
                <div className="flex items-start space-x-2.5 text-xs">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-muted-foreground text-xs mb-0.5">役職</div>
                    <div className="text-foreground font-medium truncate" title={currentUser.jobTitle}>
                      {currentUser.jobTitle}
                    </div>
                  </div>
                </div>
              )}
              {currentUser.department && (
                <div className="flex items-start space-x-2.5 text-xs">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-muted-foreground text-xs mb-0.5">部署</div>
                    <div className="text-foreground font-medium truncate" title={currentUser.department}>
                      {currentUser.department}
                    </div>
                  </div>
                </div>
              )}
              {(currentUser.mobilePhone || (currentUser.businessPhones && currentUser.businessPhones.length > 0)) && (
                <div className="flex items-start space-x-2.5 text-xs">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-muted-foreground text-xs mb-0.5">電話番号</div>
                    <div className="text-foreground font-medium">
                      {currentUser.mobilePhone || 
                       (currentUser.businessPhones && currentUser.businessPhones[0]) || 
                       '電話番号なし'}
                    </div>
                  </div>
                </div>
              )}
              {currentUser.officeLocation && (
                <div className="flex items-start space-x-2.5 text-xs">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-muted-foreground text-xs mb-0.5">オフィス</div>
                    <div className="text-foreground font-medium truncate" title={currentUser.officeLocation}>
                      {currentUser.officeLocation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}