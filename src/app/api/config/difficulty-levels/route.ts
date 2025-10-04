import { NextRequest, NextResponse } from 'next/server';
import { getConfig, syncConfigToLocal } from '../../../../lib/config';

export async function GET(request: NextRequest) {
  try {
    const difficultyLevels = await getConfig('difficulty-levels');
    
    // ローカルに同期
    await syncConfigToLocal('difficulty-levels');
    
    const response = NextResponse.json(difficultyLevels);
    
    // キャッシュ制御ヘッダーを追加
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Difficulty levels GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
