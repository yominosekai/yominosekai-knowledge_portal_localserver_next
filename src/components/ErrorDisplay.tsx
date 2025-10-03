'use client';

import { useState } from 'react';

interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  title = 'エラーが発生しました',
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const [showFullError, setShowFullError] = useState(false);
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? null : error.stack;

  return (
    <div className={`rounded-lg bg-red-500/10 p-4 ring-1 ring-red-500/20 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-400 mb-1">
            {title}
          </h3>
          
          <p className="text-sm text-red-300 mb-3">
            {errorMessage}
          </p>
          
          <div className="flex items-center space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                再試行
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-white/50 hover:text-white/70"
              >
                閉じる
              </button>
            )}
            
            {showDetails && errorStack && (
              <button
                onClick={() => setShowFullError(!showFullError)}
                className="text-sm text-white/50 hover:text-white/70"
              >
                {showFullError ? '詳細を隠す' : '詳細を表示'}
              </button>
            )}
          </div>
          
          {showFullError && errorStack && (
            <div className="mt-3 p-3 bg-black/20 rounded text-xs text-white/50 font-mono overflow-auto">
              <pre className="whitespace-pre-wrap">{errorStack}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingErrorProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingError({ error, onRetry, className = '' }: LoadingErrorProps) {
  return (
    <div className={`flex items-center justify-center min-h-64 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          データの読み込みに失敗しました
        </h3>
        
        <p className="text-white/70 mb-4">
          {typeof error === 'string' ? error : error.message}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className = '' }: NetworkErrorProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-yellow-400 mb-2">
        ネットワーク接続エラー
      </h3>
      
      <p className="text-white/70 mb-4">
        インターネット接続を確認してください。
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  );
}

interface ValidationErrorProps {
  errors: Record<string, string>;
  className?: string;
}

export function ValidationError({ errors, className = '' }: ValidationErrorProps) {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;

  return (
    <div className={`rounded-lg bg-red-500/10 p-4 ring-1 ring-red-500/20 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-400 mb-2">
            入力内容に問題があります
          </h3>
          
          <ul className="text-sm text-red-300 space-y-1">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}



