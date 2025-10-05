import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '../../../../lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log(`[Profile API] Getting profile for user: ${userId}`);
    
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      console.log(`[Profile API] Profile not found for user: ${userId}`);
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    console.log(`[Profile API] Profile found: ${profile.display_name}`);
    
    // 不足しているフィールドにデフォルト値を設定
    const enrichedProfile = {
      ...profile,
      skills: profile.skills || [],
      bio: profile.bio || '',
      avatar: profile.avatar || ''
    };
    
    return NextResponse.json({
      success: true,
      profile: enrichedProfile
    });
    
  } catch (error) {
    console.error('Profile GET error:', error);
    console.error('Error details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
