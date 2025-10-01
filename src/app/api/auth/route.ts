import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserData } from '../../../lib/data';

// デモ用の固定SID（実際の環境では環境変数や設定ファイルから取得）
const DEMO_SID = 'S-1-5-21-2432060128-2762725120-1584859402-1001';

export async function GET(request: NextRequest) {
  try {
    console.log(`[Auth GET] Starting authentication process`);
    
    // 元のアプリケーションのように、自動でSIDを取得して認証
    // 実際の環境では、ここでWindows認証やSSOからSIDを取得
    const sid = DEMO_SID;
    console.log(`[Auth GET] Using SID: ${sid}`);
    
    // ユーザーデータを取得（Zドライブ優先、存在しない場合は新規作成）
    const user = await getUserData(sid);
    
    if (!user) {
      console.log(`[Auth GET] User not found, authentication failed`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // 最終ログイン時刻を更新
    user.last_login = new Date().toISOString();
    await updateUserData(sid, user);
    
    console.log(`[Auth GET] Authentication successful for user: ${user.username}`);
    
    return NextResponse.json({
      success: true,
      user: {
        sid: user.sid,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        role: user.role,
        department: user.department,
        is_active: user.is_active,
        last_login: user.last_login
      },
      message: "Authentication successful"
    });
  } catch (error) {
    console.error('[Auth GET] Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(`[Auth POST] Starting authentication process`);
    
    let sid;
    try {
      const body = await request.json();
      sid = body.sid;
    } catch (error) {
      // 空のリクエストボディの場合はデモ用SIDを使用
      sid = DEMO_SID;
    }
    
    if (!sid) {
      console.log(`[Auth POST] No SID provided, using demo SID`);
      sid = DEMO_SID;
    }
    
    console.log(`[Auth POST] Using SID: ${sid}`);
    
    // SID形式の検証
    const sidPattern = /^S-1-5-21-\d+-\d+-\d+-\d+$/;
    if (!sidPattern.test(sid)) {
      console.log(`[Auth POST] Invalid SID format: ${sid}`);
      return NextResponse.json(
        { success: false, error: 'Invalid SID format' },
        { status: 400 }
      );
    }
    
    // ユーザーデータを取得（Zドライブ優先、存在しない場合は新規作成）
    const user = await getUserData(sid);
    
    if (!user) {
      console.log(`[Auth POST] User not found, authentication failed`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // 最終ログイン時刻を更新
    user.last_login = new Date().toISOString();
    await updateUserData(sid, user);
    
    console.log(`[Auth POST] Authentication successful for user: ${user.username}`);
    
    return NextResponse.json({
      success: true,
      user: {
        sid: user.sid,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        role: user.role,
        department: user.department,
        is_active: user.is_active,
        last_login: user.last_login
      },
      message: "Authentication successful"
    });
  } catch (error) {
    console.error('[Auth POST] Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
