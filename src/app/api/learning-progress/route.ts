import { NextRequest, NextResponse } from 'next/server';
import { getUserLearningProgress, updateUserLearningProgress, createUserLearningProgress } from '../../../lib/data';

// ユーザーの学習進捗を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    console.log(`[Learning Progress GET] Getting learning progress for user: ${userId}`);
    
    const progress = await getUserLearningProgress(userId);
    
    console.log(`[Learning Progress GET] Found ${progress.length} learning progress entries`);
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('[Learning Progress GET] Error:', error);
    return NextResponse.json(
      { error: '学習進捗の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 学習進捗を更新または作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, status, progress, isFavorite, notes, rating } = body;
    
    if (!userId || !contentId) {
      return NextResponse.json(
        { error: 'ユーザーIDとコンテンツIDが必要です' },
        { status: 400 }
      );
    }

    console.log(`[Learning Progress POST] Updating learning progress for user: ${userId}, content: ${contentId}`);
    
    // 既存の進捗を取得
    const existingProgress = await getUserLearningProgress(userId);
    const existingEntry = existingProgress.find(p => p.contentId === contentId);
    
    if (existingEntry) {
      // 既存の進捗を更新
      const updatedProgress = {
        ...existingEntry,
        status: status || existingEntry.status,
        progress: progress !== undefined ? progress : existingEntry.progress,
        isFavorite: isFavorite !== undefined ? isFavorite : existingEntry.isFavorite,
        notes: notes !== undefined ? notes : existingEntry.notes,
        rating: rating !== undefined ? rating : existingEntry.rating,
        lastAccessedAt: new Date().toISOString(),
        startedAt: status === 'in_progress' && existingEntry.status === 'not_started' 
          ? new Date().toISOString() 
          : existingEntry.startedAt,
        completedAt: status === 'completed' && existingEntry.status !== 'completed'
          ? new Date().toISOString()
          : existingEntry.completedAt
      };
      
      await updateUserLearningProgress(userId, contentId, updatedProgress);
      console.log(`[Learning Progress POST] Updated existing progress entry`);
    } else {
      // 新しい進捗を作成
      const newProgress = {
        userId,
        contentId,
        status: status || 'not_started',
        progress: progress || 0,
        isFavorite: isFavorite || false,
        isAssigned: false, // デフォルトはfalse、アサインメントの場合は別途設定
        startedAt: status === 'in_progress' ? new Date().toISOString() : undefined,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        lastAccessedAt: new Date().toISOString(),
        notes: notes || '',
        rating: rating || undefined
      };
      
      await createUserLearningProgress(newProgress);
      console.log(`[Learning Progress POST] Created new progress entry`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Learning Progress POST] Error:', error);
    return NextResponse.json(
      { error: '学習進捗の更新に失敗しました' },
      { status: 500 }
    );
  }
}
