import type { Metadata } from 'next';
import './globals.css';
import ClientHeader from '../components/ClientHeader';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { GlobalErrorHandler } from '../lib/errorHandler';

export const metadata: Metadata = {
  title: 'Knowledge Portal',
  description: 'Modern learning portal powered by Next.js 15 + Tailwind',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
             <script
               dangerouslySetInnerHTML={{
                 __html: `
                   // グローバルエラーハンドラーの初期化
                   if (typeof window !== 'undefined') {
                     // 既存のエラーハンドラーをクリア
                     if (window._globalErrorHandler) {
                       window.removeEventListener('error', window._globalErrorHandler);
                     }
                     
                     window._globalErrorHandler = function(event) {
                       console.error('[Layout] Global error:', event.error);
                       
                       // Chrome拡張機能のエラーは無視
                       if (event.error && event.error.message && 
                           event.error.message.includes('message port closed')) {
                         console.log('[Layout] Chrome extension error ignored');
                         return;
                       }
                       
                       // キャッシュ関連のエラーを検出
                       const isCacheError = event.error && event.error.message && (
                         event.error.message.includes('layout.js') ||
                         event.error.message.includes('vendor-chunks') ||
                         event.error.message.includes('Invalid or unexpected token') ||
                         event.error.message.includes('Cannot find module') ||
                         event.error.message.includes('ENOENT') ||
                         event.error.message.includes('ChunkLoadError')
                       );
                       
                       if (isCacheError) {
                         console.log('[Layout] Cache corruption detected, clearing cache and reloading...');
                         
                         // キャッシュクリアの試行
                         if ('caches' in window) {
                           caches.keys().then(function(names) {
                             names.forEach(function(name) {
                               caches.delete(name);
                             });
                           }).catch(() => {
                             console.log('[Layout] Cache clear failed, proceeding with reload');
                           });
                         }
                         
                         // ページリロード（ハードリロード）
                         setTimeout(() => {
                           window.location.href = window.location.href;
                         }, 1000);
                       }
                     };
                     
                     window.addEventListener('error', window._globalErrorHandler);
                     
                     // 未処理のPromise拒否もキャッチ
                     window.addEventListener('unhandledrejection', function(event) {
                       console.error('[Layout] Unhandled promise rejection:', event.reason);
                       
                       // Chrome拡張機能のエラーは無視
                       if (event.reason && event.reason.message && 
                           event.reason.message.includes('message port closed')) {
                         console.log('[Layout] Chrome extension promise rejection ignored');
                         return;
                       }
                       
                       if (event.reason && event.reason.message && 
                           (event.reason.message.includes('Invalid or unexpected token') ||
                            event.reason.message.includes('ChunkLoadError'))) {
                         console.log('[Layout] Promise rejection cache error detected');
                         setTimeout(() => window.location.href = window.location.href, 1000);
                       }
                     });
                     
                     // ページロード時のキャッシュチェック
                     window.addEventListener('load', function() {
                       console.log('[Layout] Page loaded, checking for cache issues...');
                       
                       // 5秒後にキャッシュの健全性をチェック
                       setTimeout(() => {
                         if (window.performance && window.performance.getEntriesByType) {
                           const resources = window.performance.getEntriesByType('resource');
                           const failedResources = resources.filter(r => r.transferSize === 0 && r.name.includes('_next'));
                           
                           if (failedResources.length > 0) {
                             console.log('[Layout] Failed resources detected:', failedResources);
                             console.log('[Layout] Reloading page to fix resource loading...');
                             window.location.href = window.location.href;
                           }
                         }
                       }, 5000);
                     });
                   }
                 `,
               }}
             />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ClientHeader />
              <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {children}
              </main>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
