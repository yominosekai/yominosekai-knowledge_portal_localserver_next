import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なページのパス
const protectedPaths = [
  '/content',
  '/leaderboard',
  '/learning-tasks',
  '/assignments',
  '/admin',
  '/profile'
];

// 管理者のみアクセス可能なページ
const adminOnlyPaths = ['/admin'];

// インストラクター以上がアクセス可能なページ
const instructorPaths = ['/assignments', '/leaderboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`[Middleware] Processing path: ${pathname}`);
  
        // ダッシュボードは認証チェックをスキップ（自動認証される）
        if (pathname === '/') {
          console.log(`[Middleware] Skipping auth check for: ${pathname}`);
          return NextResponse.next();
        }

  // 保護されたページかチェック
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  console.log(`[Middleware] Is protected path: ${isProtectedPath} for ${pathname}`);
  
  if (isProtectedPath) {
    // セッション情報をチェック
    const sessionCookie = request.cookies.get('knowledge_portal_session');
    console.log(`[Middleware] Session cookie exists: ${!!sessionCookie}`);
    
          if (!sessionCookie) {
            console.log(`[Middleware] No session cookie, redirecting to dashboard for auto auth`);
            // セッションがない場合はダッシュボードにリダイレクト（自動認証される）
            return NextResponse.redirect(new URL('/', request.url));
          }

    try {
      const sessionData = JSON.parse(sessionCookie.value);
      console.log(`[Middleware] Session data:`, sessionData);
      
      // セッションが有効かチェック
      if (!sessionData.sid || !sessionData.is_active) {
        console.log(`[Middleware] Invalid session data, redirecting to login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // 管理者専用ページのチェック
      const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path));
      console.log(`[Middleware] Is admin only path: ${isAdminOnlyPath}, user role: ${sessionData.role}`);
      
      if (isAdminOnlyPath && sessionData.role !== 'admin') {
        console.log(`[Middleware] Non-admin user accessing admin path, redirecting to dashboard`);
        // 管理者でない場合はダッシュボードにリダイレクト
        return NextResponse.redirect(new URL('/', request.url));
      }

      // インストラクター以上が必要なページのチェック
      const isInstructorPath = instructorPaths.some(path => pathname.startsWith(path));
      console.log(`[Middleware] Is instructor path: ${isInstructorPath}, user role: ${sessionData.role}`);
      
      if (isInstructorPath && !['admin', 'instructor'].includes(sessionData.role)) {
        console.log(`[Middleware] Non-instructor user accessing instructor path, redirecting to dashboard`);
        // インストラクター以上でない場合はダッシュボードにリダイレクト
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      console.log(`[Middleware] Access granted for: ${pathname}`);
    } catch (error) {
      console.log(`[Middleware] Error parsing session data:`, error);
            // セッションデータが無効な場合はダッシュボードにリダイレクト（自動認証される）
            return NextResponse.redirect(new URL('/', request.url));
    }
  }

  console.log(`[Middleware] Allowing access to: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
