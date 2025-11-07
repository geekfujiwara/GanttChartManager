# テーマ＆カラーシステムガイド

このドキュメントは、アプリケーションのテーマとカラーシステムの実装方法を説明します。

---

## 目次

1. [テーマシステム概要](#テーマシステム概要)
2. [CSS変数定義](#css変数定義)
3. [カラーパレット](#カラーパレット)
4. [実装方法](#実装方法)
5. [カスタマイズ](#カスタマイズ)

---

## テーマシステム概要

このアプリは **CSS変数ベースのテーマシステム** を採用しています。

### 特徴

- ✅ ライトモード/ダークモードの自動切り替え
- ✅ システム設定に追従
- ✅ ローカルストレージに設定保存
- ✅ シームレスなテーマ切り替え
- ✅ TypeScript対応

---

## CSS変数定義

### ベースカラー（index.css）

```css
@layer base {
  :root {
    /* ライトモード */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    /* ダークモード */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### カラーの意味

| 変数名 | 用途 | 使用例 |
|--------|------|--------|
| `--background` | 背景色 | ページ全体の背景 |
| `--foreground` | テキスト色 | メインテキスト |
| `--card` | カード背景 | Card コンポーネント |
| `--card-foreground` | カードテキスト | Card 内のテキスト |
| `--primary` | プライマリカラー | ボタン、リンク |
| `--primary-foreground` | プライマリテキスト | プライマリボタンのテキスト |
| `--muted` | 控えめな背景 | 非アクティブ要素 |
| `--muted-foreground` | 控えめなテキスト | 補足情報 |
| `--border` | ボーダー | 境界線 |
| `--destructive` | 破壊的アクション | 削除ボタン |

---

## カラーパレット

### セマンティックカラー

```tsx
// 成功・完了
bg-green-50 dark:bg-green-950/20
text-green-600 dark:text-green-400

// 進行中
bg-blue-50 dark:bg-blue-950/20
text-blue-600 dark:text-blue-400

// 警告
bg-yellow-50 dark:bg-yellow-950/20
text-yellow-600 dark:text-yellow-400

// エラー・遅延
bg-red-50 dark:bg-red-950/20
text-red-600 dark:text-red-400

// 情報
bg-purple-50 dark:bg-purple-950/20
text-purple-600 dark:text-purple-400
```

### 使用例

```tsx
// 完了タスクのバッジ
<div className="bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded">
  <span className="text-green-600 dark:text-green-400">完了</span>
</div>

// 進行中タスクのバッジ
<div className="bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded">
  <span className="text-blue-600 dark:text-blue-400">進行中</span>
</div>

// 遅延タスクのバッジ
<div className="bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
  <span className="text-red-600 dark:text-red-400">遅延</span>
</div>
```

---

## 実装方法

### ThemeProvider（テーマプロバイダー）

```tsx
// src/components/theme/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
```

### ThemeToggle（テーマ切り替えボタン）

```tsx
// src/components/theme/ThemeToggle.tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './ThemeContext';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">テーマを切り替え</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          ライト
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          ダーク
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          システム
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### App.tsx（使用例）

```tsx
import { ThemeProvider } from '@/components/theme/ThemeContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        {/* ヘッダー */}
        <header className="border-b">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold">アプリ名</h1>
            <ThemeToggle />
          </div>
        </header>

        {/* コンテンツ */}
        <main className="p-4">
          {/* アプリケーションコンテンツ */}
        </main>
      </div>
    </ThemeProvider>
  );
}
```

---

## カスタマイズ

### ブランドカラーの変更

```css
/* カスタムプライマリカラー（青系） */
:root {
  --primary: 221 83% 53%; /* #2563eb - Blue 600 */
  --primary-foreground: 0 0% 100%;
}

.dark {
  --primary: 217 91% 60%; /* #3b82f6 - Blue 500 */
  --primary-foreground: 0 0% 100%;
}
```

### カスタムカラーの追加

```css
/* 新しいセマンティックカラー */
:root {
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
}

.dark {
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 0%;
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
}
```

### Tailwindでカスタムカラーを使用

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        success: 'hsl(var(--success))',
        'success-foreground': 'hsl(var(--success-foreground))',
        warning: 'hsl(var(--warning))',
        'warning-foreground': 'hsl(var(--warning-foreground))',
        info: 'hsl(var(--info))',
        'info-foreground': 'hsl(var(--info-foreground))',
      }
    }
  }
}
```

使用例：

```tsx
<div className="bg-success text-success-foreground">
  成功メッセージ
</div>
```

---

## カラーコンビネーション例

### 統計カード

```tsx
// 緑（成功）
<div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
  <p className="text-green-600 dark:text-green-400">完了タスク: 25</p>
</div>

// 青（進行中）
<div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
  <p className="text-blue-600 dark:text-blue-400">進行中: 15</p>
</div>

// 赤（遅延）
<div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
  <p className="text-red-600 dark:text-red-400">遅延: 3</p>
</div>
```

### バッジ

```tsx
// ステータスバッジ
<Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
  完了
</Badge>

<Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
  進行中
</Badge>

<Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
  遅延
</Badge>
```

---

## ベストプラクティス

### 1. CSS変数を使用する

❌ ハードコードされたカラー
```tsx
<div className="bg-white text-black">
```

✅ CSS変数を使用
```tsx
<div className="bg-background text-foreground">
```

### 2. ダークモード対応を忘れない

❌ ライトモードのみ
```tsx
<div className="bg-gray-100 text-gray-900">
```

✅ ダークモード対応
```tsx
<div className="bg-muted text-foreground">
```

または

```tsx
<div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### 3. セマンティックカラーを使用する

❌ 直接的なカラー指定
```tsx
<div className="text-red-600">エラーメッセージ</div>
```

✅ セマンティックカラー
```tsx
<div className="text-destructive">エラーメッセージ</div>
```

---

## まとめ

このテーマシステムを使用することで：

1. **一貫性**: アプリ全体で統一されたカラーパレット
2. **保守性**: CSS変数で一元管理
3. **アクセシビリティ**: 十分なコントラスト比
4. **拡張性**: 新しいカラーの追加が容易
5. **ユーザー体験**: ダークモード対応で目に優しい

カスタマイズする際は、このガイドを参考にしながら、ブランドに合わせた調整を行ってください。
