describe('Dashboard', () => {
  beforeEach(() => {
    // ログイン状態をシミュレート
    cy.window().then((win) => {
      win.localStorage.setItem('knowledge_portal_session', JSON.stringify({
        sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
        username: 'testuser',
        display_name: 'テストユーザー',
        email: 'test@example.com',
        department: '開発部',
        role: 'user',
        is_active: true,
        created_date: '2024-01-01T00:00:00Z',
        last_login: '2024-01-01T00:00:00Z'
      }))
    })

    // モックAPIレスポンス
    cy.intercept('GET', '/api/progress/*', {
      statusCode: 200,
      body: {
        summary: {
          total: 10,
          completed: 5,
          in_progress: 3,
          not_started: 2,
          completion_rate: 50
        },
        activities: []
      }
    }).as('getProgress')

    cy.intercept('GET', '/api/content', {
      statusCode: 200,
      body: [
        {
          id: '1',
          title: 'テストコンテンツ1',
          description: 'テスト説明1',
          category_id: '1',
          difficulty: 'beginner',
          estimated_hours: 2,
          type: 'video'
        }
      ]
    }).as('getContent')

    cy.visit('/')
  })

  it('should display dashboard with user information', () => {
    cy.get('h1').should('contain', 'ダッシュボード')
    cy.get('[data-testid="user-menu"]').should('contain', 'テストユーザー')
  })

  it('should display progress summary', () => {
    cy.wait('@getProgress')
    cy.get('[data-testid="progress-summary"]').should('be.visible')
    cy.get('[data-testid="completed-count"]').should('contain', '5')
    cy.get('[data-testid="in-progress-count"]').should('contain', '3')
    cy.get('[data-testid="not-started-count"]').should('contain', '2')
  })

  it('should display recent content', () => {
    cy.wait('@getContent')
    cy.get('[data-testid="recent-content"]').should('be.visible')
    cy.get('[data-testid="content-item"]').should('contain', 'テストコンテンツ1')
  })

  it('should navigate to different pages', () => {
    cy.get('a[href="/content"]').click()
    cy.url().should('include', '/content')

    cy.get('a[href="/progress"]').click()
    cy.url().should('include', '/progress')

    cy.get('a[href="/profile"]').click()
    cy.url().should('include', '/profile')
  })

  it('should show loading state', () => {
    cy.intercept('GET', '/api/progress/*', {
      statusCode: 200,
      body: {
        summary: {
          total: 10,
          completed: 5,
          in_progress: 3,
          not_started: 2,
          completion_rate: 50
        },
        activities: []
      },
      delay: 1000
    }).as('getProgressDelayed')

    cy.visit('/')
    cy.get('[data-testid="loading"]').should('be.visible')
  })

  it('should handle error state', () => {
    cy.intercept('GET', '/api/progress/*', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Internal server error'
      }
    }).as('getProgressError')

    cy.visit('/')
    cy.wait('@getProgressError')
    cy.get('[data-testid="error"]').should('be.visible')
  })
})
