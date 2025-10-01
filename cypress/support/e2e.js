// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// グローバル設定
Cypress.on('uncaught:exception', (err, runnable) => {
  // テストで予期しないエラーが発生した場合の処理
  console.error('Uncaught exception:', err)
  return false
})

// テスト前のクリーンアップ
beforeEach(() => {
  // localStorage をクリア
  cy.clearLocalStorage()
  
  // sessionStorage をクリア
  cy.clearAllSessionStorage()
  
  // クッキーをクリア
  cy.clearAllCookies()
})

// テスト後のクリーンアップ
afterEach(() => {
  // テスト後のクリーンアップ処理
})
