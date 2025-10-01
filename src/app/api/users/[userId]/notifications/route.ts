import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../../../lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const notificationsPath = `users/${userId}/notifications.json`;
    const notifications = await readJSON(notificationsPath) || [];
    
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('通知取得エラー:', error);
    return NextResponse.json(
      { success: false, message: '通知の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { type, title, message, actionUrl, actionText } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'titleとmessageが必要です' },
        { status: 400 }
      );
    }

    const notificationsPath = `users/${userId}/notifications.json`;
    let notifications = await readJSON(notificationsPath) || [];

    const newNotification = {
      id: Date.now().toString(),
      type: type || 'info',
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl,
      actionText
    };

    notifications.unshift(newNotification);

    // 最大100件まで保持
    if (notifications.length > 100) {
      notifications = notifications.slice(0, 100);
    }

    await writeJSON(notificationsPath, notifications);

    return NextResponse.json({
      success: true,
      notification: newNotification
    });

  } catch (error) {
    console.error('通知作成エラー:', error);
    return NextResponse.json(
      { success: false, message: '通知の作成に失敗しました' },
      { status: 500 }
    );
  }
}


