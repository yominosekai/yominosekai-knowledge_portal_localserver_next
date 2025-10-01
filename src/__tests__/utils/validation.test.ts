import { validationRules } from '../../hooks/useErrorHandler'

describe('validationRules', () => {
  describe('required', () => {
    it('should return null for valid value', () => {
      const rule = validationRules.required()
      expect(rule('test')).toBeNull()
      expect(rule(123)).toBeNull()
      expect(rule(true)).toBeNull()
    })

    it('should return error message for empty value', () => {
      const rule = validationRules.required()
      expect(rule('')).toBe('この項目は必須です')
      expect(rule(null)).toBe('この項目は必須です')
      expect(rule(undefined)).toBe('この項目は必須です')
    })

    it('should return custom error message', () => {
      const rule = validationRules.required('カスタムメッセージ')
      expect(rule('')).toBe('カスタムメッセージ')
    })
  })

  describe('minLength', () => {
    it('should return null for valid length', () => {
      const rule = validationRules.minLength(5)
      expect(rule('hello')).toBeNull()
      expect(rule('hello world')).toBeNull()
    })

    it('should return error message for short length', () => {
      const rule = validationRules.minLength(5)
      expect(rule('hi')).toBe('5文字以上で入力してください')
      expect(rule('')).toBe('5文字以上で入力してください')
    })

    it('should return custom error message', () => {
      const rule = validationRules.minLength(5, 'カスタムメッセージ')
      expect(rule('hi')).toBe('カスタムメッセージ')
    })
  })

  describe('maxLength', () => {
    it('should return null for valid length', () => {
      const rule = validationRules.maxLength(10)
      expect(rule('hello')).toBeNull()
      expect(rule('hello worl')).toBeNull()
    })

    it('should return error message for long length', () => {
      const rule = validationRules.maxLength(5)
      expect(rule('hello world')).toBe('5文字以下で入力してください')
    })
  })

  describe('email', () => {
    it('should return null for valid email', () => {
      const rule = validationRules.email()
      expect(rule('test@example.com')).toBeNull()
      expect(rule('user.name@domain.co.jp')).toBeNull()
    })

    it('should return error message for invalid email', () => {
      const rule = validationRules.email()
      expect(rule('invalid-email')).toBe('有効なメールアドレスを入力してください')
      expect(rule('test@')).toBe('有効なメールアドレスを入力してください')
      expect(rule('@example.com')).toBe('有効なメールアドレスを入力してください')
    })

    it('should return null for empty value', () => {
      const rule = validationRules.email()
      expect(rule('')).toBeNull()
    })
  })

  describe('url', () => {
    it('should return null for valid URL', () => {
      const rule = validationRules.url()
      expect(rule('https://example.com')).toBeNull()
      expect(rule('http://localhost:3000')).toBeNull()
      expect(rule('ftp://files.example.com')).toBeNull()
    })

    it('should return error message for invalid URL', () => {
      const rule = validationRules.url()
      expect(rule('not-a-url')).toBe('有効なURLを入力してください')
      expect(rule('example.com')).toBe('有効なURLを入力してください')
    })

    it('should return null for empty value', () => {
      const rule = validationRules.url()
      expect(rule('')).toBeNull()
    })
  })

  describe('number', () => {
    it('should return null for valid number', () => {
      const rule = validationRules.number()
      expect(rule('123')).toBeNull()
      expect(rule('123.45')).toBeNull()
      expect(rule(123)).toBeNull()
    })

    it('should return error message for invalid number', () => {
      const rule = validationRules.number()
      expect(rule('abc')).toBe('数値を入力してください')
      expect(rule('12a')).toBe('数値を入力してください')
    })

    it('should return null for empty value', () => {
      const rule = validationRules.number()
      expect(rule('')).toBeNull()
    })
  })

  describe('min', () => {
    it('should return null for valid value', () => {
      const rule = validationRules.min(10)
      expect(rule(15)).toBeNull()
      expect(rule(10)).toBeNull()
    })

    it('should return error message for small value', () => {
      const rule = validationRules.min(10)
      expect(rule(5)).toBe('10以上の値を入力してください')
    })
  })

  describe('max', () => {
    it('should return null for valid value', () => {
      const rule = validationRules.max(100)
      expect(rule(50)).toBeNull()
      expect(rule(100)).toBeNull()
    })

    it('should return error message for large value', () => {
      const rule = validationRules.max(100)
      expect(rule(150)).toBe('100以下の値を入力してください')
    })
  })

  describe('pattern', () => {
    it('should return null for matching pattern', () => {
      const rule = validationRules.pattern(/^[A-Z]+$/, '大文字のみ')
      expect(rule('HELLO')).toBeNull()
    })

    it('should return error message for non-matching pattern', () => {
      const rule = validationRules.pattern(/^[A-Z]+$/, '大文字のみ')
      expect(rule('hello')).toBe('大文字のみ')
      expect(rule('Hello')).toBe('大文字のみ')
    })

    it('should return null for empty value', () => {
      const rule = validationRules.pattern(/^[A-Z]+$/, '大文字のみ')
      expect(rule('')).toBeNull()
    })
  })
})


