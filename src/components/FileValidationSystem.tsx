'use client';

import React, { useState, useCallback } from 'react';

interface FileValidationSystemProps {
  onFileSelect?: (files: File[]) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
  className?: string;
}

interface ValidationResult {
  file: File;
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number;
}

export function FileValidationSystem({ 
  onFileSelect, 
  onValidationComplete, 
  className = '' 
}: FileValidationSystemProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = async (file: File): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    // ファイルサイズチェック
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`ファイルサイズが大きすぎます（${formatFileSize(file.size)}/${formatFileSize(maxSize)}）`);
    }

    // ファイル名チェック
    if (file.name.length > 255) {
      errors.push('ファイル名が長すぎます（255文字以内）');
    }

    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('ファイル名に危険な文字が含まれています');
      securityScore -= 20;
    }

    // 拡張子チェック
    const allowedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', // 画像
      'pdf', 'doc', 'docx', 'txt', 'md', // 文書
      'mp4', 'avi', 'mov', 'wmv', // 動画
      'mp3', 'wav', 'ogg', 'm4a', // 音声
      'zip', 'rar', '7z', // アーカイブ
      'xlsx', 'xls', 'csv', // スプレッドシート
      'pptx', 'ppt' // プレゼンテーション
    ];

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`許可されていないファイル形式です（${extension}）`);
    }

    // MIMEタイプチェック
    const expectedMimeTypes: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'webp': ['image/webp'],
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'txt': ['text/plain'],
      'md': ['text/markdown'],
      'mp4': ['video/mp4'],
      'avi': ['video/x-msvideo'],
      'mov': ['video/quicktime'],
      'wmv': ['video/x-ms-wmv'],
      'mp3': ['audio/mpeg'],
      'wav': ['audio/wav'],
      'ogg': ['audio/ogg'],
      'm4a': ['audio/mp4'],
      'zip': ['application/zip'],
      'rar': ['application/x-rar-compressed'],
      '7z': ['application/x-7z-compressed'],
      'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      'xls': ['application/vnd.ms-excel'],
      'csv': ['text/csv'],
      'pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      'ppt': ['application/vnd.ms-powerpoint']
    };

    if (extension && expectedMimeTypes[extension]) {
      if (!expectedMimeTypes[extension].includes(file.type)) {
        warnings.push('ファイル拡張子とMIMEタイプが一致しません');
        securityScore -= 10;
      }
    }

    // ファイル内容の基本チェック
    if (file.size === 0) {
      errors.push('ファイルが空です');
    }

    // 危険なファイル名パターンチェック
    const dangerousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.pif$/i,
      /\.com$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('実行可能ファイルは許可されていません');
        securityScore -= 50;
        break;
      }
    }

    // ファイル名の長さチェック
    if (file.name.length < 1) {
      errors.push('ファイル名が空です');
    }

    // 特殊文字チェック
    const specialChars = /[<>:"|?*]/;
    if (specialChars.test(file.name)) {
      warnings.push('ファイル名に特殊文字が含まれています');
      securityScore -= 5;
    }

    return {
      file,
      valid: errors.length === 0,
      errors,
      warnings,
      securityScore: Math.max(0, securityScore)
    };
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setIsValidating(true);

    try {
      const results = await Promise.all(fileArray.map(validateFile));
      setValidationResults(results);
      
      if (onFileSelect) {
        onFileSelect(fileArray);
      }
      
      if (onValidationComplete) {
        onValidationComplete(results);
      }
    } catch (error) {
      console.error('ファイル検証エラー:', error);
    } finally {
      setIsValidating(false);
    }
  }, [onFileSelect, onValidationComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSecurityScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getValidationIcon = (result: ValidationResult): string => {
    if (result.valid && result.warnings.length === 0) return '✅';
    if (result.valid && result.warnings.length > 0) return '⚠️';
    return '❌';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ファイルアップロードエリア */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-brand bg-brand/10'
            : 'border-white/20 bg-white/5 hover:border-white/40'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.md,.mp4,.avi,.mov,.wmv,.mp3,.wav,.ogg,.m4a,.zip,.rar,.7z,.xlsx,.xls,.csv,.pptx,.ppt"
        />
        
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              ファイルをドラッグ＆ドロップ
            </h3>
            <p className="text-white/70 text-sm">
              またはクリックしてファイルを選択
            </p>
          </div>
          
          {isValidating && (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand border-t-transparent"></div>
              <span className="text-white/70 text-sm">検証中...</span>
            </div>
          )}
        </div>
      </div>

      {/* 検証結果 */}
      {validationResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">検証結果</h3>
          
          {validationResults.map((result, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 ring-1 ${
                result.valid
                  ? 'bg-green-500/10 ring-green-500/20'
                  : 'bg-red-500/10 ring-red-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getValidationIcon(result)}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-medium">{result.file.name}</h4>
                    <span className="text-white/50 text-sm">
                      {formatFileSize(result.file.size)}
                    </span>
                    <span className={`text-sm font-medium ${getSecurityScoreColor(result.securityScore)}`}>
                      セキュリティスコア: {result.securityScore}%
                    </span>
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-red-400 text-sm font-medium mb-1">エラー:</h5>
                      <ul className="text-red-300 text-sm space-y-1">
                        {result.errors.map((error, errorIndex) => (
                          <li key={errorIndex}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.warnings.length > 0 && (
                    <div>
                      <h5 className="text-yellow-400 text-sm font-medium mb-1">警告:</h5>
                      <ul className="text-yellow-300 text-sm space-y-1">
                        {result.warnings.map((warning, warningIndex) => (
                          <li key={warningIndex}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 許可されたファイル形式 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">許可されたファイル形式</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { category: '画像', extensions: ['JPG', 'PNG', 'GIF', 'WEBP'] },
            { category: '文書', extensions: ['PDF', 'DOC', 'DOCX', 'TXT', 'MD'] },
            { category: '動画', extensions: ['MP4', 'AVI', 'MOV', 'WMV'] },
            { category: '音声', extensions: ['MP3', 'WAV', 'OGG', 'M4A'] },
            { category: 'アーカイブ', extensions: ['ZIP', 'RAR', '7Z'] },
            { category: 'スプレッドシート', extensions: ['XLSX', 'XLS', 'CSV'] },
            { category: 'プレゼンテーション', extensions: ['PPTX', 'PPT'] }
          ].map((group, index) => (
            <div key={index} className="space-y-2">
              <h4 className="text-white font-medium text-sm">{group.category}</h4>
              <div className="flex flex-wrap gap-1">
                {group.extensions.map((ext, extIndex) => (
                  <span
                    key={extIndex}
                    className="px-2 py-1 rounded bg-white/10 text-white/70 text-xs"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* セキュリティ情報 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">セキュリティ情報</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-green-400">✅</span>
            <span className="text-white/70 text-sm">ファイルサイズ制限: 10MB</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400">✅</span>
            <span className="text-white/70 text-sm">実行可能ファイルのブロック</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400">✅</span>
            <span className="text-white/70 text-sm">MIMEタイプ検証</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400">✅</span>
            <span className="text-white/70 text-sm">ファイル名検証</span>
          </div>
        </div>
      </div>
    </div>
  );
}



