'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを送信
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full mx-4">
        <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-400">エラーが発生しました</h2>
          </div>
          
          <p className="text-white/70 mb-4">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              再試行
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 rounded bg-black/20 text-white/70 hover:bg-white/10 transition-colors"
            >
              前のページに戻る
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 rounded bg-black/20 text-white/70 hover:bg-white/10 transition-colors"
            >
              ホームに戻る
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-white/50 cursor-pointer hover:text-white/70">
                エラー詳細を表示
              </summary>
              <div className="mt-2 p-3 bg-black/20 rounded text-xs text-white/50 font-mono overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.digest && (
                  <div className="mb-2">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
