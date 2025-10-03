import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../../../lib/data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { contentId, folderName } = body;

    if (!contentId || !folderName) {
      return NextResponse.json(
        { success: false, message: 'contentIdとfolderNameが必要です' },
        { status: 400 }
      );
    }

    // ブックマークデータを読み込み
    const bookmarksPath = `users/${userId}/bookmarks.json`;
    let bookmarks = await readJSON(bookmarksPath) || {};

    // フォルダが存在しない場合は作成
    if (!bookmarks[folderName]) {
      bookmarks[folderName] = [];
    }

    // 既にブックマークされているかチェック
    if (!bookmarks[folderName].includes(contentId)) {
      bookmarks[folderName].push(contentId);
    }

    // ブックマークデータを保存
    await writeJSON(bookmarksPath, bookmarks);

    return NextResponse.json({
      success: true,
      message: 'ブックマークに追加しました',
      bookmarks: bookmarks[folderName]
    });

  } catch (error) {
    console.error('ブックマーク追加エラー:', error);
    return NextResponse.json(
      { success: false, message: 'ブックマークの追加に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const bookmarksPath = `users/${userId}/bookmarks.json`;
    const bookmarks = await readJSON(bookmarksPath) || {};

    return NextResponse.json({
      success: true,
      bookmarks
    });

  } catch (error) {
    console.error('ブックマーク取得エラー:', error);
    return NextResponse.json(
      { success: false, message: 'ブックマークの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { contentId, folderName } = body;

    if (!contentId || !folderName) {
      return NextResponse.json(
        { success: false, message: 'contentIdとfolderNameが必要です' },
        { status: 400 }
      );
    }

    // ブックマークデータを読み込み
    const bookmarksPath = `users/${userId}/bookmarks.json`;
    let bookmarks = await readJSON(bookmarksPath) || {};

    // ブックマークを削除
    if (bookmarks[folderName]) {
      bookmarks[folderName] = bookmarks[folderName].filter((id: string) => id !== contentId);
    }

    // ブックマークデータを保存
    await writeJSON(bookmarksPath, bookmarks);

    return NextResponse.json({
      success: true,
      message: 'ブックマークを削除しました',
      bookmarks: bookmarks[folderName] || []
    });

  } catch (error) {
    console.error('ブックマーク削除エラー:', error);
    return NextResponse.json(
      { success: false, message: 'ブックマークの削除に失敗しました' },
      { status: 500 }
    );
  }
}



