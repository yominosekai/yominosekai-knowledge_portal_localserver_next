// マルチパートフォーム解析ライブラリ

export interface ParsedFile {
  fieldname: string;
  originalname: string;
  filename: string; // ファイル名（originalnameと同じ）
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ParsedField {
  fieldname: string;
  value: string;
}

export interface ParsedFormData {
  fields: ParsedField[];
  files: ParsedFile[];
}

export class MultipartParser {
  private boundary: string;
  private buffer: Buffer;
  private position: number = 0;

  constructor(boundary: string, buffer: Buffer) {
    this.boundary = `--${boundary}`;
    this.buffer = buffer;
  }

  parse(): ParsedFormData {
    const fields: ParsedField[] = [];
    const files: ParsedFile[] = [];

    while (this.position < this.buffer.length) {
      const part = this.parsePart();
      if (!part) break;

      if ('filename' in part) {
        files.push(part as ParsedFile);
      } else {
        fields.push(part as ParsedField);
      }
    }

    return { fields, files };
  }

  private parsePart(): ParsedField | ParsedFile | null {
    // バウンダリを探す
    const boundaryIndex = this.findBoundary();
    if (boundaryIndex === -1) return null;

    this.position = boundaryIndex + this.boundary.length;

    // ヘッダーを解析
    const headers = this.parseHeaders();
    if (!headers) return null;

    // 空行をスキップ
    this.skipEmptyLine();

    // コンテンツを取得
    const content = this.parseContent();
    if (!content) return null;

    // ファイルかフィールドかを判定
    if (headers.filename) {
      return {
        fieldname: headers.name,
        originalname: headers.filename,
        filename: headers.filename,
        encoding: headers.encoding || '7bit',
        mimetype: headers['content-type'] || 'application/octet-stream',
        buffer: content,
        size: content.length
      } as ParsedFile;
    } else {
      return {
        fieldname: headers.name,
        value: content.toString('utf8')
      } as ParsedField;
    }
  }

  private findBoundary(): number {
    const boundaryBytes = Buffer.from(this.boundary);
    let i = this.position;

    while (i < this.buffer.length - boundaryBytes.length) {
      if (this.buffer.subarray(i, i + boundaryBytes.length).equals(boundaryBytes)) {
        return i;
      }
      i++;
    }

    return -1;
  }

  private parseHeaders(): Record<string, string> | null {
    const headers: Record<string, string> = {};
    const headerEnd = this.findHeaderEnd();
    
    if (headerEnd === -1) return null;

    const headerText = this.buffer.subarray(this.position, headerEnd).toString('utf8');
    this.position = headerEnd + 4; // CRLFCRLF をスキップ

    const lines = headerText.split('\r\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      if (key === 'content-disposition') {
        this.parseContentDisposition(value, headers);
      } else {
        headers[key] = value;
      }
    }

    return headers;
  }

  private parseContentDisposition(disposition: string, headers: Record<string, string>): void {
    const parts = disposition.split(';');
    headers['content-disposition'] = parts[0].trim();

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      const equalIndex = part.indexOf('=');
      if (equalIndex === -1) continue;

      const key = part.substring(0, equalIndex).trim();
      let value = part.substring(equalIndex + 1).trim();

      // クォートを除去
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      headers[key] = value;
    }
  }

  private findHeaderEnd(): number {
    const crlfcrlf = Buffer.from('\r\n\r\n');
    let i = this.position;

    while (i < this.buffer.length - crlfcrlf.length) {
      if (this.buffer.subarray(i, i + crlfcrlf.length).equals(crlfcrlf)) {
        return i;
      }
      i++;
    }

    return -1;
  }

  private skipEmptyLine(): void {
    while (this.position < this.buffer.length) {
      if (this.buffer[this.position] === 0x0D && this.buffer[this.position + 1] === 0x0A) {
        this.position += 2;
        break;
      }
      this.position++;
    }
  }

  private parseContent(): Buffer | null {
    const nextBoundaryIndex = this.findNextBoundary();
    if (nextBoundaryIndex === -1) return null;

    const content = this.buffer.subarray(this.position, nextBoundaryIndex);
    this.position = nextBoundaryIndex;

    return content;
  }

  private findNextBoundary(): number {
    const boundaryBytes = Buffer.from(this.boundary);
    let i = this.position;

    while (i < this.buffer.length - boundaryBytes.length) {
      if (this.buffer.subarray(i, i + boundaryBytes.length).equals(boundaryBytes)) {
        return i;
      }
      i++;
    }

    return -1;
  }
}

// ユーティリティ関数
export function parseMultipartFormData(contentType: string, body: Buffer): ParsedFormData {
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) {
    throw new Error('Invalid multipart form data: no boundary found');
  }

  const boundary = boundaryMatch[1];
  const parser = new MultipartParser(boundary, body);
  return parser.parse();
}

// ファイル検証
export function validateFile(file: ParsedFile, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): { valid: boolean; error?: string } {
  const { maxSize, allowedTypes, allowedExtensions } = options;

  // サイズチェック
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます。最大${maxSize}バイトまで許可されています。`
    };
  }

  // MIMEタイプチェック
  if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `ファイルタイプが許可されていません。許可されたタイプ: ${allowedTypes.join(', ')}`
    };
  }

  // 拡張子チェック
  if (allowedExtensions) {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `ファイル拡張子が許可されていません。許可された拡張子: ${allowedExtensions.join(', ')}`
      };
    }
  }

  return { valid: true };
}

// セキュリティチェック
export function securityCheck(file: ParsedFile): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // ファイル名のチェック
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    warnings.push('ファイル名に危険な文字が含まれています');
  }

  // ファイルサイズの異常チェック
  if (file.size === 0) {
    warnings.push('ファイルサイズが0です');
  }

  // MIMEタイプと拡張子の一致チェック
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const expectedMimeTypes: Record<string, string[]> = {
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'txt': ['text/plain'],
    'mp4': ['video/mp4'],
    'mp3': ['audio/mpeg']
  };

  if (extension && expectedMimeTypes[extension]) {
    if (!expectedMimeTypes[extension].includes(file.mimetype)) {
      warnings.push('ファイル拡張子とMIMEタイプが一致しません');
    }
  }

  return {
    safe: warnings.length === 0,
    warnings
  };
}



