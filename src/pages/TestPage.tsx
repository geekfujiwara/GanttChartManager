import { ThemeProvider } from '@/components/theme/ThemeContext';
import { SystemUsersTest } from '@/components/SystemUsersTest';

/**
 * SystemUsers データ取得テストページ
 */
export function TestPage() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dataverse SystemUsers テスト</h1>
          <SystemUsersTest />
        </div>
      </div>
    </ThemeProvider>
  );
}
