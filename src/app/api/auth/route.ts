import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserData } from '../../../lib/data';

// 実際のWindows環境からSIDを取得する関数
async function getCurrentUserSID(): Promise<string | null> {
  try {
    // Windowsのwhoamiコマンドを実行してSIDを取得
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('whoami /user');
    const sidMatch = stdout.match(/S-1-5-21-\d+-\d+-\d+-\d+/);
    
    if (sidMatch) {
      console.log(`[getCurrentUserSID] Found SID: ${sidMatch[0]}`);
      return sidMatch[0];
    } else {
      console.log(`[getCurrentUserSID] No SID found in output: ${stdout}`);
      return null;
    }
  } catch (error) {
    console.error(`[getCurrentUserSID] Error getting SID:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log(`[Auth GET] ===== 認証API開始 =====`);
    console.log(`[Auth GET] リクエスト時刻:`, new Date().toISOString());
    console.log(`[Auth GET] リクエストURL:`, request.url);
    console.log(`[Auth GET] リクエストヘッダー:`, Object.fromEntries(request.headers.entries()));
    console.log(`[Auth GET] リクエストIP:`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
    console.log(`[Auth GET] リクエストUser-Agent:`, request.headers.get('user-agent'));
    console.log(`[Auth GET] スタックトレース:`, new Error().stack);
    
    // 実際のWindows環境からSIDを取得
    const sid = await getCurrentUserSID();
    
    if (!sid) {
      console.log(`[Auth GET] Could not get SID from Windows environment`);
      return NextResponse.json(
        { success: false, error: 'Could not get user SID' },
        { status: 500 }
      );
    }
    
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
    
    // 最終ログイン時刻を更新（1時間以内の場合はスキップ）
    const now = new Date();
    const lastLogin = new Date(user.last_login);
    const timeDiff = now.getTime() - lastLogin.getTime();
    const oneHour = 60 * 60 * 1000; // 1時間
    
    if (timeDiff > oneHour) {
      user.last_login = now.toISOString();
      await updateUserData(sid, user);
      console.log(`[Auth GET] Updated last_login for user: ${user.username}`);
    } else {
      console.log(`[Auth GET] Skipped last_login update (recent login): ${user.username}`);
    }
    
    console.log(`[Auth GET] Authentication successful for user: ${user.username}`);
    
    const response = NextResponse.json({
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
    
    return response;
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
      // 空のリクエストボディの場合は現在のユーザーSIDを取得
      sid = await getCurrentUserSID();
    }
    
    if (!sid) {
      console.log(`[Auth POST] No SID provided, getting current user SID`);
      sid = await getCurrentUserSID();
    }
    
    if (!sid) {
      console.log(`[Auth POST] Could not get SID from Windows environment`);
      return NextResponse.json(
        { success: false, error: 'Could not get user SID' },
        { status: 500 }
      );
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
    
    // 最終ログイン時刻を更新（1時間以内の場合はスキップ）
    const now = new Date();
    const lastLogin = new Date(user.last_login);
    const timeDiff = now.getTime() - lastLogin.getTime();
    const oneHour = 60 * 60 * 1000; // 1時間
    
    if (timeDiff > oneHour) {
      user.last_login = now.toISOString();
      await updateUserData(sid, user);
      console.log(`[Auth POST] Updated last_login for user: ${user.username}`);
    } else {
      console.log(`[Auth POST] Skipped last_login update (recent login): ${user.username}`);
    }
    
    console.log(`[Auth POST] Authentication successful for user: ${user.username}`);
    
    const response = NextResponse.json({
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
    
    return response;
  } catch (error) {
    console.error('[Auth POST] Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
