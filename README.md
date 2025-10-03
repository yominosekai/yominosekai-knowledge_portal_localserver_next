# Knowledge Portal - 詳細ドキュメント

## 📋 プロジェクト詳細情報

**プロジェクト名**: Knowledge Portal - IT人材育成システム  
**現在のバージョン**: v2.0.0 (2025-10-02) - Next.js完全移行版  
**技術スタック**: Next.js 15.5.4 + React 19.1.1 + TypeScript + Tailwind CSS 3.4.0

---

## 🏗️ 詳細ディレクトリ構造

```
nextjs-app/                    # メインアプリケーション
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # 認証API
│   │   │   ├── assignments/   # 学習指示API
│   │   │   ├── notifications/ # 通知API
│   │   │   ├── content/       # コンテンツAPI
│   │   │   ├── progress/      # 進捗API
│   │   │   └── admin/         # 管理API
│   │   ├── assignments/       # 学習指示ページ
│   │   ├── learning-tasks/   # 学習課題ページ
│   │   ├── leaderboard/      # リーダーボードページ
│   │   ├── admin/             # 管理ページ
│   │   ├── profile/           # プロフィールページ
│   │   └── globals.css        # グローバルスタイル
│   ├── components/            # React コンポーネント
│   │   ├── Header.tsx         # ヘッダーコンポーネント
│   │   ├── NotificationCenter.tsx # 通知センター
│   │   ├── ContentModal.tsx   # コンテンツモーダル
│   │   ├── ThemeToggle.tsx    # テーマ切り替え
│   │   └── ProgressChart.tsx  # 進捗チャート
│   ├── contexts/              # React Context
│   │   ├── AuthContext.tsx    # 認証状態管理
│   │   ├── NotificationContext.tsx # 通知状態管理
│   │   └── ThemeContext.tsx   # テーマ状態管理
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ユーティリティ
│   │   ├── data.ts            # データアクセス層
│   │   ├── auth.ts            # 認証ロジック
│   │   ├── api.ts             # API クライアント
│   │   └── errorHandler.ts    # エラーハンドラー
│   ├── middleware.ts          # Next.js ミドルウェア
│   └── app/
│       ├── layout.tsx         # ルートレイアウト
│       └── page.tsx           # ダッシュボード
└── data/                      # ローカルデータ（同期用）
    ├── users.csv              # ユーザー一覧（フォールバック）
    ├── materials.csv          # 学習コンテンツ（フォールバック）
    ├── categories.csv         # カテゴリ（フォールバック）
    └── departments.csv        # 部署（フォールバック）

Z:\knowledge_portal\               # ネットワークドライブ（同期先）
├── shared/                        # 共有データ
│   ├── users.csv                  # ユーザー一覧
│   ├── categories.csv             # カテゴリ一覧
│   ├── materials.csv              # 学習コンテンツ一覧
│   └── departments.csv            # 部署一覧
└── users/                         # ユーザー別データ
    └── {SID}/                     # ユーザー別ディレクトリ
        ├── assignments/           # 学習指示データ
        │   └── assignments.json
        ├── notifications/         # 通知データ
        │   └── notifications.json
        └── activities.json        # 学習活動データ
```

---

## 🔧 詳細技術仕様

### 認証システム
- **SID認証**: WindowsドメインのSIDを使用
- **セッション管理**: Cookie-based（`knowledge_portal_session`）
- **権限管理**: 3段階（user/instructor/admin）
- **自動認証**: 初回アクセス時に自動ログイン

### データ管理
- **Z-drive優先**: `Z:\knowledge_portal\`を最優先データソース
- **ローカル同期**: `nextjs-app/data/`にフォールバック
- **ファイル形式**: CSV（グローバル）、JSON（ユーザー別）
- **文字エンコーディング**: UTF-8

### API設計
```
GET  /api/auth                     # 認証情報取得
POST /api/auth                     # 認証処理

GET  /api/progress/{userId}        # 進捗取得
POST /api/progress/{userId}        # 進捗更新

GET  /api/content                  # コンテンツ一覧
GET  /api/content/{id}             # コンテンツ詳細

GET  /api/assignments              # 学習指示一覧
POST /api/assignments              # 学習指示作成
PUT  /api/assignments/{id}         # 学習指示更新

GET  /api/notifications            # 通知一覧
POST /api/notifications            # 通知作成
PUT  /api/notifications            # 通知更新（既読/削除）

GET  /api/admin/users              # ユーザー管理
GET  /api/admin/reports            # レポート
```

### 通知システム
- **永続化**: Z-driveの`users/{SID}/notifications/notifications.json`
- **リアルタイム**: キャッシュバスティング（`?t=${Date.now()}`）
- **操作**: 既読、削除、一括操作
- **自動通知**: 学習指示作成時に自動生成

---

## 📱 詳細機能説明

### 1. 認証・ユーザー管理
- **SID認証**: Windowsドメイン認証
- **権限管理**: user/instructor/admin
- **プロフィール管理**: 個人情報・スキル管理
- **セッション管理**: 自動ログイン・ログアウト

### 2. 学習管理
- **ダッシュボード**: 学習進捗の可視化
- **コンテンツ管理**: 動画、記事、クイズの管理
- **進捗追跡**: 個人・部署別の学習進捗
- **コンテンツモーダル**: 詳細表示・進捗更新

### 3. 学習指示機能
- **指示作成**: instructor/adminが学習指示を作成
- **進捗管理**: 開始/完了/期限管理
- **通知連動**: 指示作成時に自動通知
- **期限管理**: 期限切れの自動検出

### 4. 学習課題ページ
- **タブベースUI**: 学習指示/マイ学習/推奨
- **学習指示タブ**: 受講者の指示一覧
- **マイ学習タブ**: 個人の学習履歴
- **推奨タブ**: 推奨コンテンツ

### 5. 通知システム
- **リアルタイム通知**: 学習指示の受信通知
- **永続化**: Z-driveへの保存
- **UI操作**: 既読/削除/一括操作
- **デバッグ情報**: 通知状態の表示

### 6. リーダーボード
- **ランキング表示**: 学習成果の可視化
- **部署別表示**: instructorは自分の部署、adminは全部署
- **スキルマップ**: 個人・部署別のスキル分析

### 7. テーマシステム
- **ライト/ダーク/システム**: 3つのテーマ
- **自動切り替え**: システム設定に連動
- **永続化**: ユーザー設定の保存

---

## 🔍 デバッグ方法

### 1. ログの確認
- **サーバーログ**: ターミナル出力を確認
- **ブラウザログ**: 開発者ツールのConsole
- **API ログ**: 各API Routeのconsole.log

### 2. データの確認
- **Z-drive**: `Z:\knowledge_portal\`のファイル内容
- **ローカル**: `nextjs-app/data/`のファイル内容
- **セッション**: Cookieの`knowledge_portal_session`

### 3. ネットワークの確認
- **API呼び出し**: 開発者ツールのNetwork
- **認証状態**: `/api/auth`のレスポンス
- **通知状態**: `/api/notifications`のレスポンス

---

## 📊 パフォーマンス考慮事項

### 1. データアクセス
- **Z-drive優先**: ネットワークドライブを最優先
- **ローカルフォールバック**: アクセス失敗時の代替
- **同期**: データの一貫性を保つ

### 2. キャッシュ管理
- **Next.jsキャッシュ**: `.next`フォルダの管理
- **ブラウザキャッシュ**: キャッシュバスティング
- **APIキャッシュ**: 適切なキャッシュヘッダー

### 3. メモリ管理
- **React Context**: 適切な状態管理
- **useEffect**: 依存関係の適切な設定
- **メモリリーク**: イベントリスナーの適切な削除

---

## 🔒 セキュリティ考慮事項

### 1. 認証・認可
- **SID認証**: Windowsドメインのセキュリティ
- **権限管理**: 適切なアクセス制御
- **セッション管理**: セキュアなCookie設定

### 2. データ保護
- **分散データ**: ユーザーごとのデータ分離
- **ファイル同期**: 安全なネットワーク同期
- **ログ管理**: アクセスログの記録

### 3. 入力検証
- **API入力**: 適切なバリデーション
- **XSS防止**: 入力サニタイゼーション
- **CSRF防止**: 適切なトークン管理

---

## 📝 コミット・プッシュルール

### 1. コミットメッセージ
- **日本語で記述**: すべてのコミットメッセージは日本語
- **詳細な説明**: 変更内容を具体的に記述
- **機能別分類**: 機能追加/バグ修正/リファクタリング

**例**:
```
通知機能の完全実装とUI/UX改善

- 通知システムの永続化実装（Z-driveベース）
- 通知ボタンの動作改善：
  * 「確認する」ボタン：既読にするだけで通知は残す
  * 「×」ボタン：即座に削除
  * 「すべて既読」ボタン：サーバー側に反映
  * 「クリア」ボタン：サーバー側から削除
- 認証完了後の通知読み込み実装
- キャッシュバスティングによる即座反映
- デバッグ情報表示機能追加
- 通知作成時の自動通知送信機能
- 学習指示作成時の通知自動生成
```

### 2. プッシュルール
- **mainブランチ**: メインブランチに直接プッシュ
- **GitHub**: `https://github.com/yominosekai/knowledge_portal_localserver_next.git`
- **定期的なプッシュ**: 機能完了時に必ずプッシュ

---

## 🎯 ユーザーの期待値

### 1. 機能面
- **完全な動作**: すべての機能が正常に動作
- **リアルタイム更新**: 変更が即座に反映
- **データ永続化**: Z-driveへの確実な保存
- **エラー処理**: 堅牢なエラーハンドリング

### 2. ユーザビリティ
- **直感的なUI**: 分かりやすい操作
- **レスポンシブ**: モバイル対応
- **テーマ対応**: ライト/ダーク切り替え
- **通知**: 適切なタイミングでの通知

### 3. パフォーマンス
- **高速レスポンス**: 素早い画面遷移
- **安定性**: クラッシュしない
- **データ整合性**: データの不整合なし

---

## 🚨 緊急時の詳細対応

### 1. サーバーが起動しない
```bash
# 方法1: 自動再起動スクリプト使用（推奨）
.\restart-server.ps1

# 方法2: 手動実行
# 1. プロセス確認
netstat -an | findstr :{ポート番号}

# 2. プロセス終了
taskkill /f /im node.exe

# 3. キャッシュクリア
cd nextjs-app
Remove-Item -Recurse -Force .next

# 4. 新しいポートで起動
npm run dev -- --port {新しいポート}
```

### 2. 認証エラーが発生する
```bash
# 1. 自動再起動スクリプトでサーバー再起動
.\restart-server.ps1

# 2. ブラウザのキャッシュクリア（Ctrl+Shift+R）

# 3. 開発者ツールでエラー確認
# - Chrome拡張機能エラーは無視
# - キャッシュ破損エラーは自動リロードされる
```

### 3. データが表示されない
1. **Z-driveアクセス確認**: `Z:\knowledge_portal\`の存在確認
2. **ファイル内容確認**: CSV/JSONファイルの内容確認
3. **API レスポンス確認**: 開発者ツールでAPI呼び出し確認
4. **認証状態確認**: セッションCookieの確認

### 4. 通知が動作しない
1. **通知ファイル確認**: `Z:\knowledge_portal\users\{SID}\notifications\`
2. **API ログ確認**: `/api/notifications`のログ確認
3. **フロントエンド確認**: NotificationContextの状態確認
4. **キャッシュ確認**: ブラウザキャッシュのクリア

---

## 📚 参考資料

### 1. 技術ドキュメント
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

### 2. プロジェクト内ドキュメント
- **README.md**: プロジェクト概要
- **nextjs-app/docs/**: API仕様書、ユーザーガイド
- **このファイル**: README.md（詳細版）

### 3. 重要なファイル
- **src/lib/data.ts**: データアクセス層
- **src/contexts/AuthContext.tsx**: 認証状態管理（リトライ機能付き）
- **src/contexts/NotificationContext.tsx**: 通知状態管理
- **src/middleware.ts**: 認証ミドルウェア
- **src/app/layout.tsx**: グローバルエラーハンドラー実装
- **restart-server.ps1**: 自動サーバー再起動スクリプト

---

## 🎉 最後に

このプロジェクトは、PowerShell実装からNext.js + TypeScript + Tailwind CSSへの完全移行を完了した最新版です。

**重要なポイント**:
1. **サーバー起動ルール**: 必ずポート+1で起動
2. **日本語対応**: すべての応答は日本語
3. **Z-drive優先**: ネットワークドライブを最優先
4. **通知システム**: 永続化とリアルタイム更新
5. **認証エラー対策**: グローバルエラーハンドラーと自動再起動
6. **ユーザー期待**: 完全な動作と即座の反映

このルールを理解し、ユーザールールを守って開発を進めてください。

**成功の鍵**: ユーザーの要求を正確に理解し、技術的に正しい実装を行うことです。

---

**作成日**: 2025-10-02  
**バージョン**: v2.0.0  
**対象**: 開発者・メンテナンス担当者  
**重要度**: 高（参考資料）