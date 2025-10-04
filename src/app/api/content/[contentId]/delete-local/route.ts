import { NextRequest, NextResponse } from 'next/server';
import { deleteLocalContent } from '../../../../../lib/data';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const result = await deleteLocalContent(contentId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete local content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Local content DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
