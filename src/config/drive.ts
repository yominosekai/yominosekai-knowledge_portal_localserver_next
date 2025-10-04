/**
 * ネットワークドライブ設定
 * 職場環境に応じてこのファイルのパスを変更するだけで済みます
 */

// デフォルトのドライブパス（職場環境に応じて変更）
const DEFAULT_DRIVE_PATH = 'Z:\\knowledge_portal';

// 環境変数から取得、なければデフォルト値を使用
export const KNOWLEDGE_PORTAL_DRIVE_PATH = process.env.KNOWLEDGE_PORTAL_DRIVE_PATH || DEFAULT_DRIVE_PATH;

// ログ出力用
console.log(`[Drive Config] Using drive path: ${KNOWLEDGE_PORTAL_DRIVE_PATH}`);

// 他の設定もここに集約可能
export const CONFIG = {
  DRIVE_PATH: KNOWLEDGE_PORTAL_DRIVE_PATH,
  DATA_DIR: process.cwd() + '/data',
  POLLING_INTERVAL: 60000, // 60秒
  MAX_RETRY_ATTEMPTS: 5,
} as const;
