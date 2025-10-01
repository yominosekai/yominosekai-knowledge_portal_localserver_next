import { NextRequest, NextResponse } from 'next/server';
import { getUserActivities, updateUserActivities } from '../../../../lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const result = await getUserActivities(userId);
    
    if (result.success) {
      const activities = result.activities;
      
      // 進捗サマリーを計算
      const completed = activities.filter(a => a.status === 'completed').length;
      const inProgress = activities.filter(a => a.status === 'in_progress').length;
      const notStarted = activities.filter(a => a.status === 'not_started').length;
      const total = activities.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
      
      const summary = {
        total,
        completed,
        in_progress: inProgress,
        not_started: notStarted,
        completion_rate: completionRate
      };
      
      return NextResponse.json({
        summary,
        activities
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to get user activities' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    
    const result = await updateUserActivities(userId, body);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update activities' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
