'use client';

import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { addNotification } = useNotifications();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    showNotification = true,
    logError = true,
    fallbackMessage = '予期しないエラーが発生しました'
  } = options;

  const handleError = useCallback((
    error: Error | string,
    context?: string,
    customMessage?: string
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const finalMessage = customMessage || errorMessage || fallbackMessage;

    if (logError) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    }

    if (showNotification) {
      addNotification({
        type: 'error',
        title: 'エラーが発生しました',
        message: finalMessage
      });
    }

    return finalMessage;
  }, [addNotification, showNotification, logError, fallbackMessage]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    customMessage?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context, customMessage);
      return null;
    }
  }, [handleError]);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    hasErrors,
    handleError,
    handleAsyncError,
    setFieldError,
    clearFieldError,
    clearAllErrors
  };
}

export function useApiErrorHandler() {
  const { handleError, handleAsyncError } = useErrorHandler();

  const handleApiError = useCallback((error: any, context?: string) => {
    let message = 'APIエラーが発生しました';
    
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // HTTPステータスコードに基づくメッセージ
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          message = 'リクエストが無効です';
          break;
        case 401:
          message = '認証が必要です';
          break;
        case 403:
          message = 'アクセスが拒否されました';
          break;
        case 404:
          message = 'リソースが見つかりません';
          break;
        case 409:
          message = 'データの競合が発生しました';
          break;
        case 422:
          message = '入力内容に問題があります';
          break;
        case 429:
          message = 'リクエストが多すぎます。しばらく待ってから再試行してください';
          break;
        case 500:
          message = 'サーバーエラーが発生しました';
          break;
        case 502:
        case 503:
        case 504:
          message = 'サービスが一時的に利用できません';
          break;
        default:
          message = `エラーが発生しました (${error.response.status})`;
      }
    }

    return handleError(error, context, message);
  }, [handleError]);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (error) {
      handleApiError(error, context);
      return null;
    }
  }, [handleApiError]);

  return {
    handleApiError,
    handleApiCall
  };
}

export function useValidationErrorHandler() {
  const { setFieldError, clearFieldError, clearAllErrors, errors, hasErrors } = useErrorHandler({
    showNotification: false
  });

  const validateField = useCallback((
    field: string,
    value: any,
    rules: Array<(value: any) => string | null>
  ) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        setFieldError(field, error);
        return false;
      }
    }
    
    clearFieldError(field);
    return true;
  }, [setFieldError, clearFieldError]);

  const validateForm = useCallback((
    data: Record<string, any>,
    rules: Record<string, Array<(value: any) => string | null>>
  ) => {
    clearAllErrors();
    
    let isValid = true;
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      const fieldValid = validateField(field, data[field], fieldRules);
      if (!fieldValid) {
        isValid = false;
      }
    }
    
    return isValid;
  }, [validateField, clearAllErrors]);

  return {
    errors,
    hasErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validateField,
    validateForm
  };
}

// バリデーションルールのヘルパー関数
export const validationRules = {
  required: (message = 'この項目は必須です') => (value: any) => 
    !value || (typeof value === 'string' && value.trim() === '') ? message : null,
  
  minLength: (min: number, message?: string) => (value: string) =>
    value && value.length < min ? (message || `${min}文字以上で入力してください`) : null,
  
  maxLength: (max: number, message?: string) => (value: string) =>
    value && value.length > max ? (message || `${max}文字以下で入力してください`) : null,
  
  email: (message = '有効なメールアドレスを入力してください') => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value) ? message : null;
  },
  
  url: (message = '有効なURLを入力してください') => (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return value ? message : null;
    }
  },
  
  number: (message = '数値を入力してください') => (value: any) =>
    value && isNaN(Number(value)) ? message : null,
  
  min: (min: number, message?: string) => (value: number) =>
    value && value < min ? (message || `${min}以上の値を入力してください`) : null,
  
  max: (max: number, message?: string) => (value: number) =>
    value && value > max ? (message || `${max}以下の値を入力してください`) : null,
  
  pattern: (regex: RegExp, message: string) => (value: string) =>
    value && !regex.test(value) ? message : null
};



