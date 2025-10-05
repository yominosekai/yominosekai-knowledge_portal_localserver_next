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
      
      // 学習指示作成時に通知を送信
      try {
        console.log(`[Assignments POST] Sending notification request to: ${request.nextUrl.origin}/api/notifications`);
        console.log(`[Assignments POST] Request headers:`, Object.fromEntries(request.headers.entries()));
        console.log(`[Assignments POST] Request cookies:`, request.cookies.getAll());
        
        const notificationResponse = await fetch(`${request.nextUrl.origin}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '', // Cookieを転送
          },
          body: JSON.stringify({
            type: 'assignment',
            assignedTo,
            assignedBy,
            assignmentTitle: body.assignmentTitle || '学習指示',
            dueDate,
            assignmentId: result.assignment?.id
          })
        });
        
        console.log(`[Assignments POST] Notification response status:`, notificationResponse.status);
        console.log(`[Assignments POST] Notification response headers:`, Object.fromEntries(notificationResponse.headers.entries()));
        
        if (notificationResponse.ok) {
          console.log(`[Assignments POST] Notification sent to ${assignedTo}`);
        }
      } catch (notificationError) {
        console.error('[Assignments POST] Failed to send notification:', notificationError);
        // 通知の送信に失敗してもアサインメント作成は続行
      }
      
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
    console.error('[Assignments POST] Error creating assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
