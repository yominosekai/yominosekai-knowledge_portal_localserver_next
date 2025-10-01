import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../../../../lib/data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string; reviewId: string }> }
) {
  try {
    const { contentId, reviewId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'rating（1-5）が必要です' },
        { status: 400 }
      );
    }

    const reviewsPath = `content/${contentId}/reviews.json`;
    let reviews = await readJSON(reviewsPath) || [];

    const reviewIndex = reviews.findIndex((r: any) => r.id === reviewId);
    
    if (reviewIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'レビューが見つかりません' },
        { status: 404 }
      );
    }

    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      rating,
      comment: comment || '',
      updatedAt: new Date().toISOString()
    };

    await writeJSON(reviewsPath, reviews);

    return NextResponse.json({
      success: true,
      review: reviews[reviewIndex],
      message: 'レビューを更新しました'
    });

  } catch (error) {
    console.error('レビュー更新エラー:', error);
    return NextResponse.json(
      { success: false, message: 'レビューの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string; reviewId: string }> }
) {
  try {
    const { contentId, reviewId } = await params;
    const reviewsPath = `content/${contentId}/reviews.json`;
    let reviews = await readJSON(reviewsPath) || [];

    const initialLength = reviews.length;
    reviews = reviews.filter((r: any) => r.id !== reviewId);

    if (reviews.length === initialLength) {
      return NextResponse.json(
        { success: false, message: 'レビューが見つかりません' },
        { status: 404 }
      );
    }

    await writeJSON(reviewsPath, reviews);

    return NextResponse.json({
      success: true,
      message: 'レビューを削除しました'
    });

  } catch (error) {
    console.error('レビュー削除エラー:', error);
    return NextResponse.json(
      { success: false, message: 'レビューの削除に失敗しました' },
      { status: 500 }
    );
  }
}


