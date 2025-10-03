# Knowledge Portal API 仕様書

## 概要

Knowledge Portal の REST API 仕様書です。この API は学習管理システムのバックエンド機能を提供します。

## ベース URL

```
http://localhost:3000/api
```

## 認証

すべての API エンドポイントは SID (Security Identifier) による認証が必要です。

### 認証ヘッダー

```
Authorization: Bearer <SID>
```

## エンドポイント

### 認証

#### GET /api/auth

ユーザー認証を行います。

**クエリパラメータ:**
- `sid` (string, required): ユーザーのSID

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "sid": "S-1-5-21-2432060128-2762725120-1584859402-1001",
    "username": "testuser",
    "display_name": "テストユーザー",
    "email": "test@example.com",
    "department": "開発部",
    "role": "user",
    "is_active": "true",
    "created_date": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T00:00:00Z"
  }
}
```

### ユーザー管理

#### GET /api/users/{userId}

指定されたユーザーの情報を取得します。

**パスパラメータ:**
- `userId` (string): ユーザーのSID

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "sid": "S-1-5-21-2432060128-2762725120-1584859402-1001",
    "username": "testuser",
    "display_name": "テストユーザー",
    "email": "test@example.com",
    "department": "開発部",
    "role": "user",
    "is_active": "true",
    "created_date": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/users/{userId}

ユーザー情報を更新します。

**リクエストボディ:**
```json
{
  "display_name": "新しい表示名",
  "email": "new@example.com",
  "department": "新しい部署"
}
```

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "sid": "S-1-5-21-2432060128-2762725120-1584859402-1001",
    "username": "testuser",
    "display_name": "新しい表示名",
    "email": "new@example.com",
    "department": "新しい部署",
    "role": "user",
    "is_active": "true",
    "created_date": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T00:00:00Z"
  }
}
```

### 進捗管理

#### GET /api/progress/{userId}

ユーザーの学習進捗を取得します。

**パスパラメータ:**
- `userId` (string): ユーザーのSID

**レスポンス:**
```json
{
  "success": true,
  "summary": {
    "total": 10,
    "completed": 5,
    "in_progress": 3,
    "not_started": 2,
    "completion_rate": 50
  },
  "activities": [
    {
      "id": "1",
      "material_id": "1",
      "status": "completed",
      "score": 85,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### コンテンツ管理

#### GET /api/content

学習コンテンツの一覧を取得します。

**クエリパラメータ:**
- `category` (string, optional): カテゴリID
- `difficulty` (string, optional): 難易度 (beginner, intermediate, advanced)
- `type` (string, optional): コンテンツタイプ (video, article, quiz)
- `search` (string, optional): 検索キーワード

**レスポンス:**
```json
{
  "success": true,
  "materials": [
    {
      "id": "1",
      "title": "テストコンテンツ",
      "description": "テスト説明",
      "category_id": "1",
      "difficulty": "beginner",
      "estimated_hours": 2,
      "type": "video",
      "created_date": "2024-01-01T00:00:00Z",
      "updated_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/content/{contentId}

指定されたコンテンツの詳細を取得します。

**パスパラメータ:**
- `contentId` (string): コンテンツID

**レスポンス:**
```json
{
  "success": true,
  "material": {
    "id": "1",
    "title": "テストコンテンツ",
    "description": "テスト説明",
    "category_id": "1",
    "difficulty": "beginner",
    "estimated_hours": 2,
    "type": "video",
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
}
```

### カテゴリ管理

#### GET /api/categories

カテゴリの一覧を取得します。

**レスポンス:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "1",
      "name": "技術",
      "description": "技術関連のコンテンツ",
      "created_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 部署管理

#### GET /api/departments

部署の一覧を取得します。

**レスポンス:**
```json
{
  "success": true,
  "departments": [
    {
      "id": "1",
      "name": "開発部",
      "description": "ソフトウェア開発部門",
      "created_date": "2024-01-01T00:00:00Z",
      "updated_date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/departments

新しい部署を作成します。

**リクエストボディ:**
```json
{
  "name": "新しい部署",
  "description": "部署の説明"
}
```

**レスポンス:**
```json
{
  "success": true,
  "department": {
    "id": "2",
    "name": "新しい部署",
    "description": "部署の説明",
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
}
```

### ファイルアップロード

#### POST /api/upload

ファイルをアップロードします。

**リクエスト:**
- `file` (File): アップロードするファイル
- `type` (string, optional): ファイルタイプ (general, content, profile)

**レスポンス:**
```json
{
  "success": true,
  "file": {
    "originalName": "example.pdf",
    "fileName": "1234567890_example.pdf",
    "filePath": "/uploads/general/1234567890_example.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 検索

#### GET /api/search

コンテンツを検索します。

**クエリパラメータ:**
- `q` (string, required): 検索クエリ
- `type` (string, optional): 検索タイプ (content, user, department)
- `category` (string, optional): カテゴリフィルター
- `difficulty` (string, optional): 難易度フィルター

**レスポンス:**
```json
{
  "success": true,
  "results": [
    {
      "id": "1",
      "title": "テストコンテンツ",
      "description": "テスト説明",
      "type": "content",
      "category": "技術",
      "difficulty": "beginner",
      "score": 0.95
    }
  ]
}
```

## エラーレスポンス

すべてのエラーレスポンスは以下の形式です：

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### HTTPステータスコード

- `200` - 成功
- `400` - リクエストが無効
- `401` - 認証が必要
- `403` - アクセスが拒否されました
- `404` - リソースが見つかりません
- `409` - データの競合が発生しました
- `422` - 入力内容に問題があります
- `429` - リクエストが多すぎます
- `500` - サーバーエラー

## レート制限

API の使用にはレート制限が適用されます：

- 認証エンドポイント: 1分間に10回
- その他のエンドポイント: 1分間に100回

レート制限に達した場合、HTTP 429 ステータスコードが返されます。

## バージョニング

現在の API バージョン: v1

バージョンは URL パスに含まれていませんが、将来的にバージョニングを導入する予定です。



