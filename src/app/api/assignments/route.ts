import { NextRequest, NextResponse } from 'next/server';
import { getAllAssignments, createAssignment } from '../../../lib/data';

// 全アサインメントの取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    console.log(`[Assignments GET] Getting all assignments`);
    
    const assignments = await getAllAssignments();
    
    console.log(`[Assignments GET] Found ${assignments.length} assignments`);
    return NextResponse.json({
      success: true,
      assignments
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[Assignments GET] Error getting assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get assignments' },
      { status: 500 }
    );
  }
}

// アサインメントの作成
export async function POST(request: NextRequest) {
  try {
    console.log(`[Assignments POST] Creating new assignment`);
    
    const body = await request.json();
    const { contentId, assignedTo, assignedBy, dueDate, notes, priority } = body;
    
    // 必須フィールドの検証
    if (!contentId || !assignedTo || !assignedBy || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const assignmentData = {
      contentId,
      assignedTo,
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
      console.log(`[Assignments POST] Created assignment: ${result.assignment?.id}`);
      return NextResponse.json({
        success: true,
        assignment: result.assignment,
        message: 'Assignment created successfully'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Assignments POST] Error creating assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
