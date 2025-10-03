import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../../../../lib/data';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; notificationId: string }> }
) {
  try {
    const { userId, notificationId } = await params;
    const notificationsPath = `users/${userId}/notifications.json`;
    let notifications = await readJSON(notificationsPath) || [];

    const initialLength = notifications.length;
    notifications = notifications.filter((n: any) => n.id !== notificationId);

    if (notifications.length === initialLength) {
      return NextResponse.json(
        { success: false, message: '通知が見つかりません' },
        { status: 404 }
      );
    }

    await writeJSON(notificationsPath, notifications);

    return NextResponse.json({
      success: true,
      message: '通知を削除しました'
    });

  } catch (error) {
    console.error('通知削除エラー:', error);
    return NextResponse.json(
      { success: false, message: '通知の削除に失敗しました' },
      { status: 500 }
    );
  }
}



