import { NextRequest, NextResponse } from 'next/server';
import { getConfig, syncConfigToLocal } from '../../../lib/config';

export async function GET(request: NextRequest) {
  try {
    const categories = await getConfig('categories');
    
    // ローカルに同期
    await syncConfigToLocal('categories');
    
    const response = NextResponse.json({ success: true, categories });
    
    return response;
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
