import { NextRequest, NextResponse } from 'next/server';
import { migrateUsersToProfiles } from '../../../lib/data';

export async function POST(request: NextRequest) {
  try {
    console.log('[Migrate Users POST] Starting user migration');
    
    const result = await migrateUsersToProfiles();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Migration completed successfully. ${result.migratedCount} users migrated.`,
        migratedCount: result.migratedCount
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Migrate Users POST] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed' 
    }, { status: 500 });
  }
}
