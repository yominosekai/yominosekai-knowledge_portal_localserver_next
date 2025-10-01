describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login form', () => {
    cy.get('h2').should('contain', 'Knowledge Portal')
    cy.get('input[name="sid"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'ログイン')
  })

  it('should show validation error for empty SID', () => {
    cy.get('button[type="submit"]').click()
    cy.get('input[name="sid"]:invalid').should('exist')
  })

  it('should show validation error for invalid SID format', () => {
    cy.get('input[name="sid"]').type('invalid-sid')
    cy.get('button[type="submit"]').click()
    cy.get('.text-red-400').should('be.visible')
  })

  it('should login successfully with valid SID', () => {
    // モックAPIレスポンス
    cy.intercept('GET', '/api/users/*', {
      statusCode: 200,
      body: {
        success: true,
        user: {
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
      }
    }).as('getUser')

    cy.get('input[name="sid"]').type('S-1-5-21-2432060128-2762725120-1584859402-1001')
    cy.get('button[type="submit"]').click()

    cy.wait('@getUser')
    cy.url().should('eq', 'http://localhost:3000/')
    cy.get('[data-testid="user-menu"]').should('contain', 'テストユーザー')
  })

  it('should show error for non-existent user', () => {
    cy.intercept('GET', '/api/users/*', {
      statusCode: 404,
      body: {
        success: false,
        error: 'User not found'
      }
    }).as('getUserError')

    cy.get('input[name="sid"]').type('S-1-5-21-2432060128-2762725120-1584859402-9999')
    cy.get('button[type="submit"]').click()

    cy.wait('@getUserError')
    cy.get('.text-red-400').should('contain', 'ログインに失敗しました')
  })
})
