import { NextRequest, NextResponse } from 'next/server';
import { getConfig, syncConfigToLocal } from '../../../../lib/config';

export async function GET(request: NextRequest) {
  try {
    const contentTypes = await getConfig('content-types');
    
    // ローカルに同期
    await syncConfigToLocal('content-types');
    
    const response = NextResponse.json(contentTypes);
    
    return response;
  } catch (error) {
    console.error('Content types GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
