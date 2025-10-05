import { NextRequest, NextResponse } from 'next/server';
import { updateAssignment, deleteAssignment } from '../../../../../lib/data';

// アサインメントの更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; assignmentId: string }> }
) {
  try {
    const { userId, assignmentId } = await params;
    console.log(`[Assignment PUT] Updating assignment: ${assignmentId} for user: ${userId}`);
    
    const body = await request.json();
    const { status, progress, notes, priority } = body;
    
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (notes !== undefined) updates.notes = notes;
    if (priority !== undefined) updates.priority = priority;
    
    const result = await updateAssignment(userId, assignmentId, updates);
    
    if (result.success) {
      console.log(`[Assignment PUT] Updated assignment: ${assignmentId}`);
      return NextResponse.json({
        success: true,
        assignment: result.assignment,
        message: 'Assignment updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Assignment PUT] Error updating assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// アサインメントの削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; assignmentId: string }> }
) {
  try {
    const { userId, assignmentId } = await params;
    console.log(`[Assignment DELETE] Deleting assignment: ${assignmentId} for user: ${userId}`);
    
    const result = await deleteAssignment(userId, assignmentId);
    
    if (result.success) {
      console.log(`[Assignment DELETE] Deleted assignment: ${assignmentId}`);
      return NextResponse.json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Assignment DELETE] Error deleting assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
