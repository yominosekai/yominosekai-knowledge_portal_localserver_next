import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const categories = await getAllCategories();
    
    const response = NextResponse.json({ success: true, categories });
    
    // キャッシュ制御ヘッダーを追加
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
