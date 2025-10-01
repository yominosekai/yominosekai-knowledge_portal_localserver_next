import { NextRequest, NextResponse } from 'next/server';
import { searchContent } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const results = await searchContent(query, category, difficulty, type, limit);
    
    return NextResponse.json({
      success: true,
      results,
      query,
      filters: { category, difficulty, type },
      total: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
