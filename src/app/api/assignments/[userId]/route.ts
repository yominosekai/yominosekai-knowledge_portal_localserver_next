import { NextRequest, NextResponse } from 'next/server';
import { getUserAssignments, createAssignment } from '../../../lib/data';

// 特定ユーザーのアサインメントを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log(`[User Assignments GET] Getting assignments for user: ${userId}`);
    
    const assignments = await getUserAssignments(userId);
    
    console.log(`[User Assignments GET] Found ${assignments.length} assignments for user: ${userId}`);
    return NextResponse.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('[User Assignments GET] Error getting user assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user assignments' },
      { status: 500 }
    );
  }
}

// 特定ユーザーにアサインメントを作成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log(`[User Assignments POST] Creating assignment for user: ${userId}`);
    
    const body = await request.json();
    const { contentId, assignedBy, dueDate, notes, priority } = body;
    
    // 必須フィールドの検証
    if (!contentId || !assignedBy || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const assignmentData = {
      contentId,
      assignedTo: userId,
      assignedBy,
      assignedDate: new Date().toISOString(),
      dueDate,
      status: 'pending' as const,
      progress: 0,
      notes: notes || '',
      priority: priority || 'medium' as const
    };
    
    const result = await createAssignment(assignmentData);
    
    if (result.success) {
      console.log(`[User Assignments POST] Created assignment: ${result.assignment?.id}`);
      return NextResponse.json({
        success: true,
        assignment: result.assignment,
        message: 'Assignment created successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[User Assignments POST] Error creating user assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user assignment' },
      { status: 500 }
    );
  }
}
