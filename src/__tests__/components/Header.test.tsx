import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Header } from '../../components/Header'
import { AuthProvider } from '../../contexts/AuthContext'
import { NotificationProvider } from '../../contexts/NotificationContext'

// モック
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

const MockedHeader = () => (
  <AuthProvider>
    <NotificationProvider>
      <Header />
    </NotificationProvider>
  </AuthProvider>
)

describe('Header', () => {
  beforeEach(() => {
    // localStorage をクリア
    localStorage.clear()
  })

  it('renders login button when not authenticated', () => {
    render(<MockedHeader />)
    
    expect(screen.getByText('Knowledge Portal')).toBeInTheDocument()
    expect(screen.getByText('ログイン')).toBeInTheDocument()
  })

  it('renders user menu when authenticated', async () => {
    // モックユーザーを設定
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

    render(<MockedHeader />)
    
    await waitFor(() => {
      expect(screen.getByText('テストユーザー')).toBeInTheDocument()
    })
  })

  it('shows mobile menu when menu button is clicked', () => {
    render(<MockedHeader />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
  })

  it('hides admin menu for non-admin users', async () => {
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

    render(<MockedHeader />)
    
    await waitFor(() => {
      expect(screen.queryByText('管理')).not.toBeInTheDocument()
    })
  })

  it('shows admin menu for admin users', async () => {
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

    render(<MockedHeader />)
    
    await waitFor(() => {
      expect(screen.getByText('管理')).toBeInTheDocument()
    })
  })
})



