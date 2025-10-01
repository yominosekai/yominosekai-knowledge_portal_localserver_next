import { NextRequest, NextResponse } from 'next/server';
import { likeContent, unlikeContent } from '../../../../../lib/data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const body = await request.json();
    const { userId, action } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    let result;
    if (action === 'unlike') {
      result = await unlikeContent(contentId, userId);
    } else {
      result = await likeContent(contentId, userId);
    }
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update like status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Content like error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
