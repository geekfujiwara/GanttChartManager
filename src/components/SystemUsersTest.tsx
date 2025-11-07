import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemUsersService } from '@/generated/services/SystemUsersService';
import { fetchSystemUsersViaWebAPI, fetchSystemUsersViaXrmWebApi } from '@/utils/dataverseWebApi';
import { fetchSystemUsersFallback } from '@/utils/systemUsersFallback';

/**
 * SystemUser テーブルのデータ取得をテストするコンポーネント
 */
export function SystemUsersTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  /**
   * 方法1: Power Apps SDK (SystemUsersService) を使用
   */
  const testWithSDK = async () => {
    setLoading(true);
    setResult('Testing with Power Apps SDK...\n');

    try {
      console.log('📦 Testing SystemUsersService.getAll()...');
      
      const response = await SystemUsersService.getAll({
        select: ['systemuserid', 'fullname', 'internalemailaddress', 'azureactivedirectoryobjectid'],
        top: 10
      });

      console.log('📦 SDK Response:', response);

      if (response.success && response.data) {
        setResult(prev => prev + `\n✅ SUCCESS via SDK!\n` +
          `Found ${response.data.length} users:\n` +
          JSON.stringify(response.data, null, 2)
        );
      } else {
        setResult(prev => prev + `\n❌ FAILED via SDK\n` +
          `Error: ${response.error?.message || 'Unknown error'}\n` +
          JSON.stringify(response, null, 2)
        );
      }
    } catch (error) {
      console.error('❌ SDK Error:', error);
      setResult(prev => prev + `\n❌ EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 方法2: Dataverse Web API (fetch) を使用
   */
  const testWithWebAPI = async () => {
    setLoading(true);
    setResult('Testing with Dataverse Web API (fetch)...\n');

    try {
      const users = await fetchSystemUsersViaWebAPI(10);

      if (users && users.length > 0) {
        setResult(prev => prev + `\n✅ SUCCESS via Web API!\n` +
          `Found ${users.length} users:\n` +
          JSON.stringify(users, null, 2)
        );
      } else {
        setResult(prev => prev + `\n⚠️ No users found via Web API`);
      }
    } catch (error) {
      console.error('❌ Web API Error:', error);
      setResult(prev => prev + `\n❌ EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 方法3: Xrm.WebApi を使用
   */
  const testWithXrmWebApi = async () => {
    setLoading(true);
    setResult('Testing with Xrm.WebApi...\n');

    try {
      const users = await fetchSystemUsersViaXrmWebApi(10);

      if (users && users.length > 0) {
        setResult(prev => prev + `\n✅ SUCCESS via Xrm.WebApi!\n` +
          `Found ${users.length} users:\n` +
          JSON.stringify(users, null, 2)
        );
      } else {
        setResult(prev => prev + `\n⚠️ No users found via Xrm.WebApi`);
      }
    } catch (error) {
      console.error('❌ Xrm.WebApi Error:', error);
      setResult(prev => prev + `\n❌ EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 方法4: フォールバック方式（複数の方法を自動的に試行）
   */
  const testWithFallback = async () => {
    setLoading(true);
    setResult('Testing with Fallback method (trying multiple approaches)...\n');

    try {
      const users = await fetchSystemUsersFallback();

      if (users && users.length > 0) {
        setResult(prev => prev + `\n✅ SUCCESS via Fallback!\n` +
          `Found ${users.length} users:\n` +
          JSON.stringify(users, null, 2)
        );
      } else {
        setResult(prev => prev + `\n⚠️ No users found via Fallback`);
      }
    } catch (error) {
      console.error('❌ Fallback Error:', error);
      setResult(prev => prev + `\n❌ EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>SystemUsers データ取得テスト</CardTitle>
        <CardDescription>
          Dataverse の systemusers テーブルからデータを取得する3つの方法をテスト
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testWithSDK} disabled={loading}>
            1. Power Apps SDK
          </Button>
          <Button onClick={testWithWebAPI} disabled={loading} variant="outline">
            2. Web API (fetch)
          </Button>
          <Button onClick={testWithXrmWebApi} disabled={loading} variant="outline">
            3. Xrm.WebApi
          </Button>
          <Button onClick={testWithFallback} disabled={loading} variant="secondary">
            4. 自動フォールバック
          </Button>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">
            ⏳ Loading...
          </div>
        )}

        {result && (
          <div className="mt-4">
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
          <p className="font-semibold mb-2">💡 テスト方法の説明:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>Power Apps SDK</strong>: SystemUsersService.getAll() を使用（データソース登録が必要）</li>
            <li><strong>Web API (fetch)</strong>: Dataverse REST API を直接呼び出し（CORS制限あり）</li>
            <li><strong>Xrm.WebApi</strong>: Model-driven Apps 専用（Canvas Apps では動作しない）</li>
            <li><strong>自動フォールバック</strong>: 複数の方法を自動的に試行（推奨）</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
