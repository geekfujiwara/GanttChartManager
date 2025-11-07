import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
// Alert コンポーネントの代替実装
const Alert: React.FC<{ children: React.ReactNode; variant?: 'default' | 'destructive' }> = ({ children, variant = 'default' }) => (
  <div className={`rounded-lg border p-4 ${variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
    {children}
  </div>
);

const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm">{children}</div>
);

// Progress コンポーネントの代替実装
const Progress: React.FC<{ value?: number; className?: string }> = ({ value, className }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse"
      style={{ width: value ? `${value}%` : '50%' }}
    />
  </div>
);

// ScrollArea コンポーネントの代替実装
const ScrollArea: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`overflow-auto ${className}`}>{children}</div>
);
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { TaskCSVRow, downloadCSVTemplate, parseCSVFile, convertToCSVString } from '@/utils/csvUtils';
import { TaskCSVService, CSVOperationResult } from '@/services/TaskCSVService';
import { Project } from '@/data/sampleProjects';

interface CSVUploadDialogProps {
  project?: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVUploadDialog({ project, onClose, onSuccess }: CSVUploadDialogProps) {
  const [csvData, setCsvData] = useState<TaskCSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<CSVOperationResult | null>(null);
  const [step, setStep] = useState<'upload' | 'validate' | 'process' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editableFields: Array<{
    key: keyof TaskCSVRow;
    label: string;
    type?: 'number' | 'text';
    placeholder?: string;
  }> = [
    { key: 'task_name', label: 'タスク名' },
    { key: 'project_id', label: 'プロジェクトID' },
    { key: 'description', label: '説明' },
    { key: 'start_date', label: '開始日', placeholder: 'YYYYMMDD' },
    { key: 'end_date', label: '終了日', placeholder: 'YYYYMMDD' },
    { key: 'progress', label: '進捗率', type: 'number', placeholder: '0-100' },
    { key: 'priority', label: '優先度' },
    { key: 'status', label: 'ステータス' },
    { key: 'category', label: 'カテゴリ' },
    { key: 'assignee_id', label: '担当者ID' },
    { key: 'task_id', label: 'タスクID' },
    { key: 'operation', label: '操作' }
  ];

  useEffect(() => {
    if (csvData.length === 0) {
      setValidationErrors([]);
      return;
    }
    const nextErrors = TaskCSVService.validateCsvData(csvData);
    setValidationErrors(nextErrors);
  }, [csvData]);

  const errorRows = useMemo(() => {
    const indices = new Set<number>();
    validationErrors.forEach((error) => {
      const match = error.match(/行\s+(\d+)/);
      if (match) {
        const rowNumber = Number(match[1]);
        if (!Number.isNaN(rowNumber)) {
          indices.add(Math.max(0, rowNumber - 1));
        }
      }
    });
    return indices;
  }, [validationErrors]);

  const handleRowFieldChange = (rowIndex: number, field: keyof TaskCSVRow, rawValue: string) => {
    setCsvData((prev) => {
      const next = [...prev];
      const updated = { ...next[rowIndex] };

      if (field === 'progress') {
        if (rawValue === '') {
          updated.progress = undefined;
        } else {
          const numericValue = Number(rawValue);
          updated.progress = Number.isNaN(numericValue) ? undefined : numericValue;
        }
      } else if (field === 'operation') {
        const upperValue = rawValue.trim().toUpperCase();
        updated.operation = upperValue ? (upperValue as TaskCSVRow['operation']) : undefined;
      } else if (field === 'task_id') {
        updated.task_id = rawValue.trim() || undefined;
      } else if (field === 'project_id') {
        updated.project_id = rawValue.trim();
      } else if (field === 'task_name') {
        updated.task_name = rawValue;
      } else {
        const trimmed = rawValue.trim();
        (updated as Record<keyof TaskCSVRow, string | number | undefined>)[field] = trimmed || undefined;
      }

      next[rowIndex] = updated;
      return next;
    });
  };

  const handleRowDelete = (rowIndex: number) => {
    setCsvData((prev) => prev.filter((_, index) => index !== rowIndex));
  };

  // CSVテンプレートダウンロード
  const handleDownloadTemplate = () => {
    const filename = project 
      ? `${project.name}_tasks_template.csv` 
      : 'project_tasks_template.csv';
    downloadCSVTemplate(filename, project?.id);
  };

  // プロジェクトタスクをCSVエクスポート
  const handleExportTasks = async () => {
    if (!project) return;
    
    try {
      setProcessing(true);
      console.log('🔄 CSVエクスポート開始:', project.id);
      
      const tasks = await TaskCSVService.exportProjectTasksToCSV(project.id);
      console.log('✅ タスク取得成功:', tasks);
      
      if (tasks.length === 0) {
        alert('エクスポートするタスクがありません');
        return;
      }

      const csvContent = convertToCSVString(tasks);
      console.log('📄 CSV内容生成:', csvContent.substring(0, 200) + '...');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${project.name}_tasks_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ CSVエクスポートエラー:', error);
      alert(`エクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setProcessing(false);
    }
  };

  const processCsvFile = async (file: File) => {
    if (processing) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('CSVファイルを選択してください。');
      return;
    }

    setProcessResult(null);
    try {
      setProcessing(true);
      setValidationErrors([]);
      
      const data = await parseCSVFile(file);
      setCsvData(data);
      setStep('validate');
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'ファイルの読み取りに失敗しました']);
      setStep('validate');
    } finally {
      setProcessing(false);
    }
  };

  // CSVファイル選択
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processCsvFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDragActive(false);

    if (processing) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    await processCsvFile(file);
  };

  // CSV処理実行
  const handleProcessCsv = async () => {
    if (csvData.length === 0) return;

    try {
      setProcessing(true);
      setStep('process');
      
      const result = await TaskCSVService.processCsvTasks(csvData);
      setProcessResult(result);
      setStep('result');
      
      if (result.success) {
        onSuccess();
      }
    } catch (error) {
      setProcessResult({
        success: false,
        message: `処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        processed: 0,
        errors: [error instanceof Error ? error.message : '不明なエラー']
      });
      setStep('result');
    } finally {
      setProcessing(false);
    }
  };

  // リセット
  const handleReset = () => {
    setCsvData([]);
    setValidationErrors([]);
    setProcessResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 flex justify-center z-50 transition-all duration-300',
        isFullscreen ? 'items-center p-2' : 'items-center p-4'
      )}
    >
      <Card
        className={cn(
          'w-full overflow-hidden flex flex-col shadow-2xl transition-all duration-300',
          isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[90vh]'
        )}
      >
  <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span>CSV一括タスク操作</span>
              {project && (
                <Badge variant="outline">プロジェクト: {project.name}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen((prev) => !prev)}
                aria-label={isFullscreen ? 'モーダルを縮小' : 'モーダルを最大化'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* プログレスステップ */}
          <div className="flex items-center space-x-2 mt-4">
            <div className={`flex items-center space-x-1 ${step === 'upload' ? 'text-primary' : step === 'validate' || step === 'process' || step === 'result' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'upload' ? 'bg-primary text-primary-foreground' : step === 'validate' || step === 'process' || step === 'result' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm">アップロード</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center space-x-1 ${step === 'validate' ? 'text-primary' : step === 'process' || step === 'result' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'validate' ? 'bg-primary text-primary-foreground' : step === 'process' || step === 'result' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm">検証</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center space-x-1 ${step === 'process' ? 'text-primary' : step === 'result' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'process' ? 'bg-primary text-primary-foreground' : step === 'result' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm">処理</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center space-x-1 ${step === 'result' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'result' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                4
              </div>
              <span className="text-sm">完了</span>
            </div>
          </div>
        </CardHeader>

  <CardContent className="space-y-6 flex-1 overflow-y-auto pr-1 pb-6">
          {/* ステップ1: アップロード */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className={`text-center p-8 border-2 border-dashed rounded-lg transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">CSVファイルをアップロード</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  プロジェクトタスクのCSVファイルを選択してください（ドラッグ＆ドロップにも対応）
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="mb-4"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      読み取り中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      CSVファイルを選択
                    </>
                  )}
                </Button>
              </div>
              
              {/* テンプレート・エクスポート機能 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      CSVテンプレート
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      タスク作成用のテンプレートファイルをダウンロード
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadTemplate}
                    >
                      テンプレートダウンロード
                    </Button>
                  </CardContent>
                </Card>
                
                {project && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        既存タスクエクスポート
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        現在のプロジェクトタスクをCSVで出力
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExportTasks}
                        disabled={processing}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            エクスポート中...
                          </>
                        ) : (
                          'タスクエクスポート'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ステップ2: 検証 */}
          {step === 'validate' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">CSV検証結果</h3>
              <p className="text-sm text-muted-foreground">
                データプレビュー内で直接値を編集したり、不要な行を削除できます。修正内容は自動で再検証されます。
              </p>
              
              {validationErrors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">
                      {validationErrors.length}件のエラーが見つかりました
                    </div>
                    <ScrollArea className="max-h-32">
                      <ul className="text-sm space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    CSVファイルは正常です。{csvData.length}件のタスクが処理対象です。
                  </AlertDescription>
                </Alert>
              )}

              {/* データプレビュー */}
              {csvData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">データプレビュー</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className={cn('max-h-64', isFullscreen && 'max-h-[65vh]')}>
                      <div className="min-w-full">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-2 py-2 text-left font-medium">行番号</th>
                              {editableFields.map((field) => (
                                <th key={field.key as string} className="px-2 py-2 text-left font-medium">
                                  {field.label}
                                </th>
                              ))}
                              <th className="px-2 py-2 text-left font-medium">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.map((row, rowIndex) => {
                              const hasError = errorRows.has(rowIndex);
                              return (
                                <tr
                                  key={rowIndex}
                                  className={cn(
                                    'border-b border-border/60 transition-colors',
                                    hasError ? 'bg-destructive/10' : 'hover:bg-muted/40'
                                  )}
                                >
                                  <td className="px-2 py-2 align-top whitespace-nowrap">
                                    {rowIndex + 1}
                                  </td>
                                  {editableFields.map((field) => {
                                    const value = row[field.key];
                                    const inputValue = field.key === 'progress'
                                      ? value ?? ''
                                      : (value as string | undefined) ?? '';
                                    return (
                                      <td key={field.key as string} className="px-2 py-1 align-top min-w-[140px]">
                                        <Input
                                          value={inputValue}
                                          onChange={(event) => handleRowFieldChange(rowIndex, field.key, event.target.value)}
                                          type={field.type === 'number' ? 'number' : 'text'}
                                          placeholder={field.placeholder}
                                          className={cn('h-8', hasError ? 'border-destructive focus-visible:ring-destructive' : '')}
                                          min={field.type === 'number' ? 0 : undefined}
                                          max={field.type === 'number' ? 100 : undefined}
                                          disabled={processing}
                                        />
                                      </td>
                                    );
                                  })}
                                  <td className="px-2 py-1 align-top">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleRowDelete(rowIndex)}
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      disabled={processing}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleReset}>
                  戻る
                </Button>
                <Button variant="secondary" onClick={() => setStep('upload')}>
                  もう一度やり直す
                </Button>
                <Button 
                  onClick={handleProcessCsv}
                  disabled={validationErrors.length > 0 || csvData.length === 0}
                >
                  処理実行
                </Button>
              </div>
            </div>
          )}

          {/* ステップ3: 処理中 */}
          {step === 'process' && (
            <div className="space-y-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <h3 className="text-lg font-medium">タスクを処理中...</h3>
              <p className="text-muted-foreground">
                {csvData.length}件のタスクを処理しています。しばらくお待ちください。
              </p>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* ステップ4: 結果 */}
          {step === 'result' && processResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">処理結果</h3>
              
              <Alert variant={processResult.success ? 'default' : 'destructive'}>
                {processResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="font-medium mb-2">{processResult.message}</div>
                  {processResult.results && (
                    <div className="text-sm space-y-1">
                      <div>作成: {processResult.results.created}件</div>
                      <div>更新: {processResult.results.updated}件</div>
                      <div>削除: {processResult.results.deleted}件</div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {processResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">
                      エラー詳細 ({processResult.errors.length}件)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-32">
                      <ul className="text-sm space-y-1">
                        {processResult.errors.map((error, index) => (
                          <li key={index} className="text-destructive">• {error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  新しいファイル
                </Button>
                <Button onClick={handleClose}>
                  閉じる
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}