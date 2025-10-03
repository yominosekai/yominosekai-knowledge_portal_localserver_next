import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; notificationId: string }> }
) {
  try {
    const { userId, notificationId } = await params;
    const notificationsPath = `users/${userId}/notifications.json`;
    let notifications = await readJSON(notificationsPath) || [];

    const notificationIndex = notifications.findIndex((n: any) => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, message: '通知が見つかりません' },
        { status: 404 }
      );
    }

    notifications[notificationIndex].read = true;
    await writeJSON(notificationsPath, notifications);

    return NextResponse.json({
      success: true,
      message: '通知を既読にしました'
    });

  } catch (error) {
    console.error('通知既読化エラー:', error);
    return NextResponse.json(
      { success: false, message: '通知の既読化に失敗しました' },
      { status: 500 }
    );
  }
}



