# Knowledge Portal

企業内学習管理システム（LMS）の Next.js 実装版です。

## 🚀 機能

### 学習管理
- **ダッシュボード**: 学習進捗の可視化
- **コンテンツ管理**: 動画、記事、クイズの管理
- **進捗追跡**: 個人・部署別の学習進捗
- **リーダーボード**: 学習成果のランキング

### ユーザー管理
- **SID認証**: Windows ドメイン認証
- **権限管理**: 管理者・講師・ユーザーの役割
- **プロフィール**: 個人情報・スキル管理

### 高度な機能
- **検索**: 全文検索・フィルタリング
- **通知**: リアルタイム通知システム
- **ファイル管理**: ドラッグ&ドロップアップロード
- **データ可視化**: チャート・グラフ表示

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15.5.4, React 19.1.1, TypeScript
- **スタイリング**: Tailwind CSS 3.4.0
- **テスト**: Jest, Cypress
- **データ**: CSV/JSON ファイル

## 📦 インストール

### 前提条件
- Node.js 18.0.0 以上
- npm または yarn

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

## 🧪 テスト

```bash
# 単体テスト
npm run test

# E2E テスト
npm run test:e2e

# 全テスト
npm run test:all
```

## 📚 ドキュメント

- [API 仕様書](./docs/API.md)
- [ユーザーガイド](./docs/USER_GUIDE.md)
- [開発者ガイド](./docs/DEVELOPER_GUIDE.md)

## 🏗️ プロジェクト構造

```
nextjs-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   └── ...
│   ├── components/            # React コンポーネント
│   ├── contexts/             # React Context
│   ├── hooks/                # カスタムフック
│   └── lib/                  # ユーティリティ
├── public/                   # 静的ファイル
├── docs/                     # ドキュメント
└── cypress/                  # E2E テスト
```

## 🔧 開発

### 利用可能なスクリプト

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint チェック
npm run type-check   # TypeScript チェック
```

### 環境変数

`.env.local` ファイルを作成：

```env
DATABASE_URL=./data
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🚀 デプロイ

### Vercel デプロイ

1. Vercel アカウントを作成
2. リポジトリを接続
3. 環境変数を設定
4. デプロイ

### Docker デプロイ

```bash
# Docker イメージをビルド
docker build -t knowledge-portal .

# コンテナを起動
docker run -p 3000:3000 knowledge-portal
```

## 📊 パフォーマンス

- **Lighthouse スコア**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals**: 最適化済み
- **バンドルサイズ**: 最適化済み

## 🔒 セキュリティ

- **認証**: SID ベース認証
- **認可**: 役割ベースアクセス制御
- **データ保護**: 暗号化・検証
- **XSS 防止**: 入力サニタイゼーション

## 🤝 貢献

1. フォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエスト作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

問題や質問がある場合は、以下までお問い合わせください：

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@example.com

## 🎯 ロードマップ

### v1.1.0 (予定)
- [ ] リアルタイム同期機能
- [ ] モバイルアプリ
- [ ] 高度な分析機能

### v1.2.0 (予定)
- [ ] AI 推奨システム
- [ ] 多言語対応
- [ ] 外部システム連携

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトに依存しています：

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Knowledge Portal** - 企業の学習を革新する
