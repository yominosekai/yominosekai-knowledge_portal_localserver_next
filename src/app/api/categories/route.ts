import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
