import { NextRequest } from 'next/server'
import { GET } from '../../app/api/auth/route'

// モック
jest.mock('../../lib/data', () => ({
  getAllUsers: jest.fn(),
}))

describe('/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 with user data when valid SID is provided', async () => {
    const mockUsers = [
      {
        sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
        username: 'testuser',
        display_name: 'テストユーザー',
        email: 'test@example.com',
        department: '開発部',
        role: 'user',
        is_active: 'true',
        created_date: '2024-01-01T00:00:00Z',
        last_login: '2024-01-01T00:00:00Z'
      }
    ]

    const { getAllUsers } = require('../../lib/data')
    getAllUsers.mockResolvedValue(mockUsers)

    const request = new NextRequest('http://localhost:3000/api/auth?sid=S-1-5-21-2432060128-2762725120-1584859402-1001')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toEqual(mockUsers[0])
  })

  it('should return 400 when SID is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('SID is required')
  })

  it('should return 404 when user is not found', async () => {
    const { getAllUsers } = require('../../lib/data')
    getAllUsers.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/auth?sid=S-1-5-21-2432060128-2762725120-1584859402-9999')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('User not found')
  })

  it('should return 500 when database error occurs', async () => {
    const { getAllUsers } = require('../../lib/data')
    getAllUsers.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/auth?sid=S-1-5-21-2432060128-2762725120-1584859402-1001')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })
})



