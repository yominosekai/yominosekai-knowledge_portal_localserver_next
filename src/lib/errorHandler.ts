/**
 * グローバルエラーハンドラー
 * 実運用での安定性向上のため
 */

// エラー監視と自動復旧
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {
    this.setupErrorHandlers();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupErrorHandlers(): void {
    // グローバルエラーハンドラー
    window.addEventListener('error', (event) => {
      console.error('[GlobalErrorHandler] Global error:', event.error);
      this.handleError(event.error);
    });

    // 未処理のPromise拒否
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Next.jsのエラー
    if (typeof window !== 'undefined') {
      // ページ読み込みエラー
      window.addEventListener('load', () => {
        this.checkForErrors();
      });
    }
  }

  private handleError(error: any): void {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // キャッシュ関連のエラーを検出
    if (this.isCacheError(errorMessage)) {
      console.log('[GlobalErrorHandler] Cache error detected, attempting recovery...');
      this.handleCacheError();
    }

    // ネットワーク関連のエラー
    if (this.isNetworkError(errorMessage)) {
      console.log('[GlobalErrorHandler] Network error detected, attempting retry...');
      this.handleNetworkError();
    }

    // 認証関連のエラー
    if (this.isAuthError(errorMessage)) {
      console.log('[GlobalErrorHandler] Auth error detected, attempting recovery...');
      this.handleAuthError();
    }
  }

  private isCacheError(errorMessage: string): boolean {
    const cacheErrorPatterns = [
      'layout.js',
      'vendor-chunks',
      'ENOENT',
      'Cannot find module',
      'Invalid or unexpected token'
    ];
    
    return cacheErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isNetworkError(errorMessage: string): boolean {
    const networkErrorPatterns = [
      'fetch',
      'network',
      'timeout',
      'connection',
      'aborted'
    ];
    
    return networkErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isAuthError(errorMessage: string): boolean {
    const authErrorPatterns = [
      'authentication',
      'unauthorized',
      'forbidden',
      'session'
    ];
    
    return authErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private handleCacheError(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[GlobalErrorHandler] Cache recovery attempt ${this.retryCount}/${this.maxRetries}`);
      
      // ページをリロードしてキャッシュをクリア
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error('[GlobalErrorHandler] Cache recovery failed after max retries');
      this.showUserNotification('システムエラーが発生しました。ページを再読み込みしてください。');
    }
  }

  private handleNetworkError(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[GlobalErrorHandler] Network retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      // 自動ログインを再試行
      setTimeout(() => {
        this.retryAutoAuth();
      }, 2000);
    } else {
      console.error('[GlobalErrorHandler] Network recovery failed after max retries');
      this.showUserNotification('ネットワークエラーが発生しました。接続を確認してください。');
    }
  }

  private handleAuthError(): void {
    console.log('[GlobalErrorHandler] Auth error recovery');
    
    // セッションをクリアして再認証
    if (typeof document !== 'undefined') {
      document.cookie = 'knowledge_portal_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    // ログインページにリダイレクト
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }

  private async retryAutoAuth(): Promise<void> {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('[GlobalErrorHandler] Auto auth retry successful');
          // セッションを再設定（SessionManagerを使用）
          if (typeof document !== 'undefined') {
            const { SessionManager } = await import('./auth');
            const sessionManager = SessionManager.getInstance();
            sessionManager.setSession(data.user);
          }
        }
      }
    } catch (error) {
      console.error('[GlobalErrorHandler] Auto auth retry failed:', error);
    }
  }

  private checkForErrors(): void {
    // ページ読み込み後のエラーチェック
    const errorElements = document.querySelectorAll('[data-error]');
    if (errorElements.length > 0) {
      console.log('[GlobalErrorHandler] Found error elements on page');
      this.handleCacheError();
    }
  }

  private showUserNotification(message: string): void {
    // ユーザーに通知を表示
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 5秒後に自動削除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  public resetRetryCount(): void {
    this.retryCount = 0;
  }
}

// 初期化
if (typeof window !== 'undefined') {
  GlobalErrorHandler.getInstance();
}

