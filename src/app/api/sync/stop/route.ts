import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 同期プロセスの停止
    // 実際の実装では、バックグラウンドのファイル監視を停止
    
    return NextResponse.json({
      success: true,
      message: '同期を停止しました'
    });
  } catch (error) {
    console.error('Stop sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '同期の停止に失敗しました'
      },
      { status: 500 }
    );
  }
}


