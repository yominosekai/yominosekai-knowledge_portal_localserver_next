import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

/**
 * ファイルロック管理クラス
 * 同じユーザーへの同時アクセスを防ぐための排他制御システム
 */
export class FileLockManager {
  private static instance: FileLockManager;
  private locks: Map<string, Promise<any>> = new Map();
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): FileLockManager {
    if (!FileLockManager.instance) {
      FileLockManager.instance = new FileLockManager();
    }
    return FileLockManager.instance;
  }

  /**
   * ファイル操作を排他制御で実行
   * @param userId ユーザーID
   * @param operation 実行する操作
   * @param maxRetries 最大リトライ回数
   * @param retryDelay リトライ間隔（ミリ秒）
   */
  async withLock<T>(
    userId: string,
    operation: () => Promise<T>,
    maxRetries: number = 5,
    retryDelay: number = 100
  ): Promise<T> {
    const lockKey = userId;
    
    // 既に同じユーザーの操作が進行中の場合は待機
    if (this.locks.has(lockKey)) {
      console.log(`[FileLockManager] Waiting for existing operation for user: ${userId}`);
      await this.locks.get(lockKey);
    }

    const lockPromise = this.performOperation(userId, operation, maxRetries, retryDelay);
    this.locks.set(lockKey, lockPromise);

    // タイムアウト設定（30秒）
    const timeout = setTimeout(() => {
      console.warn(`[FileLockManager] Operation timeout for user: ${userId}`);
      this.locks.delete(lockKey);
    }, 30000);
    this.lockTimeouts.set(lockKey, timeout);

    try {
      const result = await lockPromise;
      return result;
    } finally {
      this.locks.delete(lockKey);
      const timeout = this.lockTimeouts.get(lockKey);
      if (timeout) {
        clearTimeout(timeout);
        this.lockTimeouts.delete(lockKey);
      }
    }
  }

  /**
   * 実際の操作を実行（リトライ機能付き）
   */
  private async performOperation<T>(
    userId: string,
    operation: () => Promise<T>,
    maxRetries: number,
    retryDelay: number
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[FileLockManager] Executing operation for user: ${userId} (attempt ${attempt}/${maxRetries})`);
        return await operation();
      } catch (error) {
        console.error(`[FileLockManager] Operation failed for user: ${userId} (attempt ${attempt}/${maxRetries}):`, error);
        
        // 最後の試行でない場合は待機してリトライ
        if (attempt < maxRetries) {
          const waitTime = retryDelay * Math.pow(2, attempt - 1); // 指数バックオフ
          console.log(`[FileLockManager] Waiting ${waitTime}ms before retry for user: ${userId}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Operation failed after ${maxRetries} attempts for user: ${userId}`);
  }

  /**
   * ファイルロックファイルを使用した排他制御
   * @param filePath 対象ファイルのパス
   * @param operation 実行する操作
   * @param maxRetries 最大リトライ回数
   */
  async withFileLock<T>(
    filePath: string,
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const lockFilePath = `${filePath}.lock`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // ロックファイルの作成を試行
        const lockHandle = await fs.promises.open(lockFilePath, 'wx');
        
        try {
          console.log(`[FileLockManager] Acquired file lock: ${lockFilePath}`);
          const result = await operation();
          return result;
        } finally {
          // ロックファイルを削除
          await lockHandle.close();
          try {
            await unlink(lockFilePath);
            console.log(`[FileLockManager] Released file lock: ${lockFilePath}`);
          } catch (unlinkError) {
            console.warn(`[FileLockManager] Failed to remove lock file: ${lockFilePath}`, unlinkError);
          }
        }
      } catch (error) {
        if (error.code === 'EEXIST' && attempt < maxRetries) {
          // ロックファイルが存在する場合は待機
          const waitTime = 100 * attempt;
          console.log(`[FileLockManager] File locked, waiting ${waitTime}ms before retry (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error(`Failed to acquire file lock after ${maxRetries} attempts: ${filePath}`);
  }

  /**
   * 通知ファイルの安全な読み取り
   */
  async readNotificationsSafely(userId: string): Promise<any[]> {
    const notificationsPath = `Z:\\knowledge_portal\\users\\${userId}\\notifications\\notifications.json`;
    
    return await this.withFileLock(notificationsPath, async () => {
      try {
        const content = await readFile(notificationsPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return []; // ファイルが存在しない場合は空配列を返す
        }
        throw error;
      }
    });
  }

  /**
   * 通知ファイルの安全な書き込み
   */
  async writeNotificationsSafely(userId: string, notifications: any[]): Promise<void> {
    const notificationsPath = `Z:\\knowledge_portal\\users\\${userId}\\notifications\\notifications.json`;
    const notificationsDir = path.dirname(notificationsPath);
    
    return await this.withFileLock(notificationsPath, async () => {
      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(notificationsDir)) {
        await mkdir(notificationsDir, { recursive: true });
      }
      
      await writeFile(notificationsPath, JSON.stringify(notifications, null, 2), 'utf-8');
    });
  }

  /**
   * 学習指示ファイルの安全な読み取り
   */
  async readAssignmentsSafely(userId: string): Promise<any[]> {
    const assignmentsPath = `Z:\\knowledge_portal\\users\\${userId}\\assignments\\assignments.json`;
    
    return await this.withFileLock(assignmentsPath, async () => {
      try {
        const content = await readFile(assignmentsPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return []; // ファイルが存在しない場合は空配列を返す
        }
        throw error;
      }
    });
  }

  /**
   * 学習指示ファイルの安全な書き込み
   */
  async writeAssignmentsSafely(userId: string, assignments: any[]): Promise<void> {
    const assignmentsPath = `Z:\\knowledge_portal\\users\\${userId}\\assignments\\assignments.json`;
    const assignmentsDir = path.dirname(assignmentsPath);
    
    return await this.withFileLock(assignmentsPath, async () => {
      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(assignmentsDir)) {
        await mkdir(assignmentsDir, { recursive: true });
      }
      
      await writeFile(assignmentsPath, JSON.stringify(assignments, null, 2), 'utf-8');
    });
  }
}

// シングルトンインスタンスをエクスポート
export const fileLockManager = FileLockManager.getInstance();
