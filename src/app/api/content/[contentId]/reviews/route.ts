import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '../../../../../lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const reviewsPath = `content/${contentId}/reviews.json`;
    const reviews = await readJSON(reviewsPath) || [];

    // 平均評価を計算
    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalRatings 
      : 0;

    return NextResponse.json({
      success: true,
      reviews,
      averageRating,
      totalRatings
    });

  } catch (error) {
    console.error('レビュー取得エラー:', error);
    return NextResponse.json(
      { success: false, message: 'レビューの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const body = await request.json();
    const { userId, rating, comment } = body;

    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'userIdとrating（1-5）が必要です' },
        { status: 400 }
      );
    }

    const reviewsPath = `content/${contentId}/reviews.json`;
    let reviews = await readJSON(reviewsPath) || [];

    // 既存の評価をチェック
    const existingReviewIndex = reviews.findIndex((r: any) => r.userId === userId);
    
    const newReview = {
      id: Date.now().toString(),
      userId,
      contentId,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingReviewIndex >= 0) {
      // 既存の評価を更新
      reviews[existingReviewIndex] = {
        ...reviews[existingReviewIndex],
        rating,
        comment: comment || '',
        updatedAt: new Date().toISOString()
      };
    } else {
      // 新しい評価を追加
      reviews.push(newReview);
    }

    await writeJSON(reviewsPath, reviews);

    return NextResponse.json({
      success: true,
      review: existingReviewIndex >= 0 ? reviews[existingReviewIndex] : newReview,
      message: existingReviewIndex >= 0 ? '評価を更新しました' : '評価を投稿しました'
    });

  } catch (error) {
    console.error('レビュー投稿エラー:', error);
    return NextResponse.json(
      { success: false, message: 'レビューの投稿に失敗しました' },
      { status: 500 }
    );
  }
}



