# Knowledge Portal 開発者ガイド

## 概要

Knowledge Portal の開発環境構築、アーキテクチャ、コーディング規約について説明します。

## 技術スタック

### フロントエンド
- **Next.js 15.5.4**: React フレームワーク
- **React 19.1.1**: UI ライブラリ
- **TypeScript**: 型安全な JavaScript
- **Tailwind CSS 3.4.0**: CSS フレームワーク

### バックエンド
- **Next.js API Routes**: サーバーサイド API
- **Node.js**: JavaScript ランタイム
- **CSV/JSON**: データストレージ

### 開発ツール
- **Jest**: 単体テスト
- **Cypress**: E2E テスト
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマッター

## 開発環境構築

### 前提条件

- Node.js 18.0.0 以上
- npm または yarn
- Git

### セットアップ

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd knowledge_portal
```

2. **依存関係のインストール**
```bash
npm install
```

3. **開発サーバーの起動**
```bash
npm run dev
```

4. **ブラウザでアクセス**
```
http://localhost:3000
```

### 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定：

```env
# データベース設定
DATABASE_URL=./data

# 認証設定
JWT_SECRET=your-secret-key

# ファイルアップロード設定
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./public/uploads

# 開発設定
NODE_ENV=development
```

## プロジェクト構造

```
nextjs-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── globals.css        # グローバルスタイル
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx           # ホームページ
│   ├── components/            # React コンポーネント
│   │   ├── ui/               # UI コンポーネント
│   │   ├── charts/           # チャートコンポーネント
│   │   └── ...
│   ├── contexts/             # React Context
│   ├── hooks/                # カスタムフック
│   ├── lib/                  # ユーティリティ関数
│   └── __tests__/            # テストファイル
├── public/                   # 静的ファイル
├── docs/                     # ドキュメント
├── cypress/                  # E2E テスト
├── jest.config.js           # Jest 設定
├── next.config.js           # Next.js 設定
└── package.json             # 依存関係
```

## アーキテクチャ

### フロントエンドアーキテクチャ

```
┌─────────────────┐
│   Pages         │
├─────────────────┤
│   Components    │
├─────────────────┤
│   Contexts      │
├─────────────────┤
│   Hooks         │
├─────────────────┤
│   API Client    │
└─────────────────┘
```

### データフロー

1. **ユーザーアクション** → コンポーネント
2. **コンポーネント** → カスタムフック
3. **カスタムフック** → API Client
4. **API Client** → Next.js API Routes
5. **API Routes** → データアクセス層
6. **データアクセス層** → CSV/JSON ファイル

### 状態管理

- **React Context**: グローバル状態（認証、通知）
- **useState**: ローカル状態
- **useReducer**: 複雑な状態管理

## コーディング規約

### TypeScript

```typescript
// インターフェース定義
interface User {
  id: string;
  name: string;
  email: string;
}

// 型エイリアス
type UserRole = 'admin' | 'instructor' | 'user';

// 関数の型定義
const createUser = (userData: Omit<User, 'id'>): Promise<User> => {
  // 実装
};
```

### React コンポーネント

```typescript
// 関数コンポーネント
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### CSS (Tailwind)

```typescript
// 条件付きクラス
const buttonClass = `
  px-4 py-2 rounded transition-colors
  ${variant === 'primary' 
    ? 'bg-blue-500 text-white hover:bg-blue-600' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  }
`;
```

### ファイル命名規則

- **コンポーネント**: PascalCase (例: `UserProfile.tsx`)
- **フック**: camelCase with `use` prefix (例: `useAuth.ts`)
- **ユーティリティ**: camelCase (例: `formatDate.ts`)
- **テスト**: `.test.ts` または `.spec.ts` サフィックス

## API 開発

### API Routes の作成

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### エラーハンドリング

```typescript
// 統一されたエラーレスポンス
const createErrorResponse = (message: string, status: number) => {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
};
```

### バリデーション

```typescript
// リクエストボディのバリデーション
const validateUserData = (data: any): data is User => {
  return (
    typeof data.name === 'string' &&
    typeof data.email === 'string' &&
    data.name.length > 0 &&
    data.email.includes('@')
  );
};
```

## テスト

### 単体テスト

```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E テスト

```typescript
// cypress/e2e/login.cy.ts
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="sid"]').type('S-1-5-21-2432060128-2762725120-1584859402-1001');
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', 'http://localhost:3000/');
  });
});
```

### テスト実行

```bash
# 単体テスト
npm run test

# テストウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# E2E テスト
npm run test:e2e

# 全テスト
npm run test:all
```

## パフォーマンス最適化

### コード分割

```typescript
// 動的インポート
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

### メモ化

```typescript
// React.memo でコンポーネントをメモ化
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// useMemo で計算結果をメモ化
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### 画像最適化

```typescript
// Next.js Image コンポーネント
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority
/>
```

## デプロイメント

### 本番ビルド

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

### 環境設定

```bash
# 本番環境変数
NODE_ENV=production
DATABASE_URL=./data
JWT_SECRET=production-secret
```

### Docker デプロイ

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## デバッグ

### 開発者ツール

```typescript
// デバッグログ
console.log('Debug info:', { user, data });

// 条件付きログ
if (process.env.NODE_ENV === 'development') {
  console.log('Development only log');
}
```

### エラー追跡

```typescript
// エラーバウンダリ
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
}
```

## セキュリティ

### 認証

```typescript
// SID 検証
const validateSID = (sid: string): boolean => {
  const sidPattern = /^S-1-5-21-\d+-\d+-\d+-\d+$/;
  return sidPattern.test(sid);
};
```

### 入力検証

```typescript
// XSS 防止
const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

### CSRF 保護

```typescript
// CSRF トークン検証
const verifyCSRFToken = (token: string): boolean => {
  return token === getCSRFToken();
};
```

## 監視・ログ

### ログ設定

```typescript
// ログレベル
const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};
```

### メトリクス

```typescript
// パフォーマンスメトリクス
const trackPerformance = (name: string, duration: number) => {
  console.log(`Performance: ${name} took ${duration}ms`);
};
```

## 貢献ガイドライン

### プルリクエスト

1. フィーチャーブランチを作成
2. 変更をコミット
3. テストを実行
4. プルリクエストを作成

### コミットメッセージ

```
feat: 新機能を追加
fix: バグを修正
docs: ドキュメントを更新
style: コードスタイルを修正
refactor: リファクタリング
test: テストを追加
chore: その他の変更
```

## トラブルシューティング

### よくある問題

#### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

#### テストエラー

```bash
# テストキャッシュをクリア
npm test -- --clearCache
```

#### 型エラー

```bash
# TypeScript チェック
npm run type-check
```

## 参考資料

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [React 公式ドキュメント](https://react.dev)
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/docs)
- [Tailwind CSS 公式ドキュメント](https://tailwindcss.com/docs)
- [Jest 公式ドキュメント](https://jestjs.io/docs/getting-started)
- [Cypress 公式ドキュメント](https://docs.cypress.io)


