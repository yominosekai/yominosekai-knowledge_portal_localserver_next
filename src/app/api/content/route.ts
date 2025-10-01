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
    
    return NextResponse.json({ success: true, materials: content });
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
    const result = await createContent(body);
    
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
