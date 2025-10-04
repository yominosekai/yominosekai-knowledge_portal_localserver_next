import { NextRequest, NextResponse } from 'next/server';
import { deleteServerContent } from '../../../../../lib/data';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const result = await deleteServerContent(contentId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete server content' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server content DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
