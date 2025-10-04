# ネットワークドライブ設定ガイド

## 🎯 **職場環境での設定方法**

職場のネットワークドライブが異なる場合、**1つのファイルだけ**を変更するだけで済みます！

### **📁 変更するファイル**
```
src/config/drive.ts
```

### **🔧 設定方法**

**1. ファイルを開く**
```
src/config/drive.ts
```

**2. ドライブパスを変更**
```typescript
// 現在の設定
const DEFAULT_DRIVE_PATH = 'Z:\\knowledge_portal';

// 職場環境に応じて変更
const DEFAULT_DRIVE_PATH = 'G:\\マイドライブ\\knowledge_portal';  // Google Drive
const DEFAULT_DRIVE_PATH = 'Y:\\shared\\knowledge_portal';        // 職場の共有ドライブ
const DEFAULT_DRIVE_PATH = '\\\\server\\share\\knowledge_portal'; // ネットワークパス
```

**3. サーバーを再起動**
```bash
npm run dev -- --port 3000
```

### **✅ 完了！**

これだけで、すべての機能が新しいドライブパスで動作します。

## **📋 対応済み機能**

- ✅ コンテンツ管理
- ✅ ユーザー管理
- ✅ 通知システム
- ✅ 学習指示
- ✅ ファイルダウンロード
- ✅ データ同期

## **🔍 確認方法**

サーバー起動時に以下のログが表示されます：
```
[Drive Config] Using drive path: G:\マイドライブ\knowledge_portal
```

## **💡 環境変数での設定（オプション）**

より高度な設定が必要な場合：

**1. 環境変数ファイルを作成**
```
.env.local
```

**2. ドライブパスを設定**
```
KNOWLEDGE_PORTAL_DRIVE_PATH=G:\マイドライブ\knowledge_portal
```

**3. 設定ファイルで環境変数を使用**
```typescript
export const KNOWLEDGE_PORTAL_DRIVE_PATH = process.env.KNOWLEDGE_PORTAL_DRIVE_PATH || DEFAULT_DRIVE_PATH;
```

## **🚀 メリット**

- **1箇所だけ変更**: 設定ファイル1つだけ
- **自動適用**: すべての機能に自動反映
- **エラー防止**: 複数箇所の変更忘れを防止
- **保守性向上**: 設定の一元管理
