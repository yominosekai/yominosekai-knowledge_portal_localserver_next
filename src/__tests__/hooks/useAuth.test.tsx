import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../contexts/AuthContext'
import { AuthProvider } from '../../contexts/AuthContext'

// テスト用のラッパー
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return initial state when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should authenticate user with valid session', async () => {
    const mockUser = {
      sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
      username: 'testuser',
      display_name: 'テストユーザー',
      email: 'test@example.com',
      department: '開発部',
      role: 'user' as const,
      is_active: true,
      created_date: '2024-01-01T00:00:00Z',
      last_login: '2024-01-01T00:00:00Z'
    }

    localStorage.setItem('knowledge_portal_session', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      // 非同期処理を待つ
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  it('should logout user and clear session', async () => {
    const mockUser = {
      sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
      username: 'testuser',
      display_name: 'テストユーザー',
      email: 'test@example.com',
      department: '開発部',
      role: 'user' as const,
      is_active: true,
      created_date: '2024-01-01T00:00:00Z',
      last_login: '2024-01-01T00:00:00Z'
    }

    localStorage.setItem('knowledge_portal_session', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('knowledge_portal_session')).toBeNull()
  })

  it('should check permissions correctly', async () => {
    const mockAdmin = {
      sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
      username: 'admin',
      display_name: '管理者',
      email: 'admin@example.com',
      department: '管理部',
      role: 'admin' as const,
      is_active: true,
      created_date: '2024-01-01T00:00:00Z',
      last_login: '2024-01-01T00:00:00Z'
    }

    localStorage.setItem('knowledge_portal_session', JSON.stringify(mockAdmin))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.checkPermission('admin')).toBe(true)
    expect(result.current.checkPermission('instructor')).toBe(true)
    expect(result.current.checkPermission('user')).toBe(true)
  })

  it('should handle login error', async () => {
    // fetch をモック
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.login('invalid-sid')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    expect(result.current.isAuthenticated).toBe(false)
  })
})


