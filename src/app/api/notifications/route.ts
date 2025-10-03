import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '../../../lib/auth';
import { 
  getUserNotifications, 
  createAssignmentNotification, 
  markNotificationAsRead, 
  deleteNotification,
  Notification 
} from '../../../lib/data';

// 通知の取得
export async function GET(request: NextRequest) {
  try {
    // サーバーサイドではCookieからセッション情報を取得
    const sessionCookie = request.cookies.get('knowledge_portal_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    if (!session?.sid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Notifications GET] Getting notifications for user: ${session.sid}`);
    
    const notifications = await getUserNotifications(session.sid);
    
    return NextResponse.json({
      success: true,
      notifications: notifications
    });

  } catch (error) {
    console.error('[Notifications GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// 通知の送信（学習指示作成時など）
export async function POST(request: NextRequest) {
  try {
    console.log(`[Notifications POST] Request headers:`, Object.fromEntries(request.headers.entries()));
    console.log(`[Notifications POST] All cookies:`, request.cookies.getAll());
    
    // サーバーサイドではCookieからセッション情報を取得
    const sessionCookie = request.cookies.get('knowledge_portal_session');
    console.log(`[Notifications POST] Session cookie:`, sessionCookie);
    
    if (!sessionCookie?.value) {
      console.log(`[Notifications POST] No session cookie found`);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
      console.log(`[Notifications POST] Parsed session:`, session);
    } catch (error) {
      console.log(`[Notifications POST] Failed to parse session:`, error);
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    if (!session?.sid) {
      console.log(`[Notifications POST] No SID in session:`, session);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, assignedTo, assignedBy, assignmentTitle, dueDate, assignmentId } = body;

    console.log(`[Notifications POST] Creating notification:`, { type, assignedTo, assignedBy, assignmentTitle });

    // 学習指示通知の場合
    if (type === 'assignment' && assignedTo && assignedBy && assignmentTitle && dueDate && assignmentId) {
      await createAssignmentNotification(assignedTo, assignedBy, assignmentTitle, dueDate, assignmentId);
      
      return NextResponse.json({
        success: true,
        message: 'Assignment notification created successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid notification type or missing parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('[Notifications POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// 通知の既読・削除
export async function PUT(request: NextRequest) {
  try {
    // サーバーサイドではCookieからセッション情報を取得
    const sessionCookie = request.cookies.get('knowledge_portal_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    if (!session?.sid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body;

    console.log(`[Notifications PUT] ${action} notification: ${notificationId}`);

    if (action === 'markAsRead' && notificationId) {
      await markNotificationAsRead(session.sid, notificationId);
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      });
    }

    if (action === 'delete' && notificationId) {
      await deleteNotification(session.sid, notificationId);
      
      return NextResponse.json({
        success: true,
        message: 'Notification deleted'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing notificationId'
    }, { status: 400 });

  } catch (error) {
    console.error('[Notifications PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
