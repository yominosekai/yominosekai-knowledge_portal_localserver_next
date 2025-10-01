// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// ログインコマンド
Cypress.Commands.add('login', (sid = 'S-1-5-21-2432060128-2762725120-1584859402-1001') => {
  cy.window().then((win) => {
    win.localStorage.setItem('knowledge_portal_session', JSON.stringify({
      sid,
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
})

// 管理者ログインコマンド
Cypress.Commands.add('loginAsAdmin', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('knowledge_portal_session', JSON.stringify({
      sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
      username: 'admin',
      display_name: '管理者',
      email: 'admin@example.com',
      department: '管理部',
      role: 'admin',
      is_active: true,
      created_date: '2024-01-01T00:00:00Z',
      last_login: '2024-01-01T00:00:00Z'
    }))
  })
})

// ログアウトコマンド
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('knowledge_portal_session')
  })
})

// APIモックコマンド
Cypress.Commands.add('mockApi', (method, url, response) => {
  cy.intercept(method, url, response)
})

// データテストIDで要素を取得
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`)
})

// ファイルアップロードコマンド
Cypress.Commands.add('uploadFile', (selector, filePath) => {
  cy.get(selector).selectFile(filePath)
})

// ドラッグ&ドロップコマンド
Cypress.Commands.add('dragAndDrop', (sourceSelector, targetSelector) => {
  cy.get(sourceSelector).trigger('dragstart')
  cy.get(targetSelector).trigger('drop')
})

// 通知を確認するコマンド
Cypress.Commands.add('checkNotification', (message) => {
  cy.get('[data-testid="notification"]').should('contain', message)
})

// エラーを確認するコマンド
Cypress.Commands.add('checkError', (message) => {
  cy.get('[data-testid="error"]').should('contain', message)
})

// ローディング状態を確認するコマンド
Cypress.Commands.add('checkLoading', () => {
  cy.get('[data-testid="loading"]').should('be.visible')
})

// ローディング完了を確認するコマンド
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]').should('not.exist')
})

// レスポンシブテスト用コマンド
Cypress.Commands.add('setViewport', (size) => {
  const sizes = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720],
    large: [1920, 1080]
  }
  
  const [width, height] = sizes[size] || sizes.desktop
  cy.viewport(width, height)
})

// フォーム入力コマンド
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[name="${field}"]`).type(value)
  })
})

// フォーム送信コマンド
Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.get(formSelector).submit()
})

// テーブル行を確認するコマンド
Cypress.Commands.add('checkTableRow', (rowIndex, expectedData) => {
  cy.get('tbody tr').eq(rowIndex).within(() => {
    Object.entries(expectedData).forEach(([key, value]) => {
      cy.get(`[data-testid="${key}"]`).should('contain', value)
    })
  })
})

// モーダルを開くコマンド
Cypress.Commands.add('openModal', (triggerSelector) => {
  cy.get(triggerSelector).click()
  cy.get('[data-testid="modal"]').should('be.visible')
})

// モーダルを閉じるコマンド
Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close"]').click()
  cy.get('[data-testid="modal"]').should('not.exist')
})
