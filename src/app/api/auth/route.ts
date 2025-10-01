import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserData } from '../../../lib/data';

export async function POST(request: NextRequest) {
  try {
    // 簡易的な認証（実際のSID認証の代わり）
    const userId = 'S-1-5-21-2432060128-2762725120-1584859402-1001';
    
    let user = await getUserData(userId);
    
    if (!user) {
      // 新規ユーザー作成
      const newUserData = {
        username: 'user_1001',
        display_name: 'User 1001',
        email: 'user1001@company.com',
        role: 'user',
        department: 'General'
      };
      
      const result = await updateUserData(userId, newUserData);
      user = result.user;
    }
    
    return NextResponse.json({
      success: true,
      user: {
        sid: user.sid,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        role: user.role,
        department: user.department,
        last_login: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
