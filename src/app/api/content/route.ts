import { NextRequest, NextResponse } from 'next/server';
import { getAllContent, createContent, searchContent } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let content;
    
    if (query || category || difficulty || type) {
      // 検索
      content = await searchContent(query || '', category || undefined, difficulty || undefined, type || undefined, limit);
    } else {
      // 全コンテンツ取得
      content = await getAllContent();
    }
    
    const response = NextResponse.json({ success: true, materials: content });
    
    return response;
  } catch (error) {
    console.error('Content GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 認証ヘッダーからユーザー情報を取得
    const authHeader = request.headers.get('authorization');
    const userSid = request.headers.get('x-user-sid');
    
    // ユーザー情報をbodyに追加
    const enrichedBody = {
      ...body,
      authHeader,
      user: {
        sid: userSid,
        display_name: body.user?.display_name || 'Unknown User',
        role: body.user?.role || 'user'
      }
    };
    
    const result = await createContent(enrichedBody);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Content POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
