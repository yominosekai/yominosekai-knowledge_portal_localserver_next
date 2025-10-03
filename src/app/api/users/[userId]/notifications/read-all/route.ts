import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../../../lib/data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const notificationsPath = `users/${userId}/notifications.json`;
    let notifications = await readJSON(notificationsPath) || [];

    notifications = notifications.map((notification: any) => ({
      ...notification,
      read: true
    }));

    await writeJSON(notificationsPath, notifications);

    return NextResponse.json({
      success: true,
      message: 'すべての通知を既読にしました'
    });

  } catch (error) {
    console.error('全通知既読化エラー:', error);
    return NextResponse.json(
      { success: false, message: '全通知の既読化に失敗しました' },
      { status: 500 }
    );
  }
}



