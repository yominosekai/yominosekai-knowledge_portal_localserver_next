import { NextRequest, NextResponse } from 'next/server';
import { getContentStats } from '../../../../../lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const stats = await getContentStats(contentId);
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Content stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
