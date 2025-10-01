import { NextRequest, NextResponse } from 'next/server';
import { getAllContent } from '../../../lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // コンテンツから検索候補を生成
    const materials = await getAllContent();
    const suggestions = materials
      .filter(material => 
        material.title.toLowerCase().includes(query.toLowerCase()) ||
        material.description.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
      .map(material => ({
        id: material.id,
        title: material.title,
        description: material.description,
        type: 'content' as const,
        category: material.category_id,
        difficulty: material.difficulty,
        score: calculateScore(material.title, material.description, query)
      }));

    // スコア順にソート
    suggestions.sort((a, b) => b.score - a.score);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('検索候補取得エラー:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

function calculateScore(title: string, description: string, query: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const descriptionLower = description.toLowerCase();

  let score = 0;

  // タイトルでの完全一致
  if (titleLower === queryLower) {
    score += 100;
  }
  // タイトルでの部分一致
  else if (titleLower.includes(queryLower)) {
    score += 50;
  }

  // 説明での部分一致
  if (descriptionLower.includes(queryLower)) {
    score += 20;
  }

  // 単語レベルでの一致
  const queryWords = queryLower.split(/\s+/);
  const titleWords = titleLower.split(/\s+/);
  const descriptionWords = descriptionLower.split(/\s+/);

  queryWords.forEach(queryWord => {
    if (titleWords.includes(queryWord)) {
      score += 10;
    }
    if (descriptionWords.includes(queryWord)) {
      score += 5;
    }
  });

  return score;
}
