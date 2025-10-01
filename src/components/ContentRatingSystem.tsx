'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface Rating {
  id: string;
  userId: string;
  contentId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentRatingSystemProps {
  contentId: string;
  userId: string;
  initialRating?: number;
  initialComment?: string;
  className?: string;
}

export function ContentRatingSystem({ 
  contentId, 
  userId, 
  initialRating = 0, 
  initialComment = '',
  className = '' 
}: ContentRatingSystemProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState<Rating | null>(null);

  useEffect(() => {
    loadReviews();
  }, [contentId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalRatings(data.totalRatings || 0);
        
        // ユーザーの評価を探す
        const userReview = data.reviews?.find((r: Rating) => r.userId === userId);
        if (userReview) {
          setUserRating(userReview);
          setRating(userReview.rating);
          setComment(userReview.comment);
        }
      }
    } catch (error) {
      console.error('レビューの読み込みに失敗:', error);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('評価を選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/content/${contentId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          rating,
          comment: comment.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setUserRating(result.review);
        loadReviews(); // レビュー一覧を再読み込み
        setShowCommentForm(false);
        alert('評価を投稿しました');
      } else {
        throw new Error('評価の投稿に失敗しました');
      }
    } catch (error) {
      console.error('評価投稿エラー:', error);
      alert('評価の投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingUpdate = async () => {
    if (!userRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/content/${contentId}/reviews/${userRating.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim()
        })
      });

      if (response.ok) {
        loadReviews();
        setShowCommentForm(false);
        alert('評価を更新しました');
      } else {
        throw new Error('評価の更新に失敗しました');
      }
    } catch (error) {
      console.error('評価更新エラー:', error);
      alert('評価の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingDelete = async () => {
    if (!userRating) return;

    if (!confirm('評価を削除しますか？')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/content/${contentId}/reviews/${userRating.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUserRating(null);
        setRating(0);
        setComment('');
        loadReviews();
        alert('評価を削除しました');
      } else {
        throw new Error('評価の削除に失敗しました');
      }
    } catch (error) {
      console.error('評価削除エラー:', error);
      alert('評価の削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setRating(star) : undefined}
            disabled={!interactive || isSubmitting}
            className={`text-2xl transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${
              star <= currentRating 
                ? 'text-yellow-400' 
                : 'text-gray-300'
            } ${
              !interactive || isSubmitting ? 'opacity-50' : ''
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    const texts = ['', '悪い', '普通', '良い', 'とても良い', '素晴らしい'];
    return texts[rating] || '';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 評価サマリー */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">評価・レビュー</h3>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</div>
            <div className="text-white/70 text-sm">平均評価</div>
          </div>
          
          <div className="flex-1">
            {renderStars(Math.round(averageRating))}
            <div className="text-white/70 text-sm mt-1">
              {totalRatings}件の評価
            </div>
          </div>
        </div>

        {/* 評価分布 */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-white/70 text-sm w-4">{star}</span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-white/70 text-sm w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ユーザー評価フォーム */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h4 className="text-md font-semibold text-white mb-4">
          {userRating ? 'あなたの評価を編集' : '評価を投稿'}
        </h4>
        
        <div className="space-y-4">
          {/* 星評価 */}
          <div>
            <label className="block text-sm text-white/70 mb-2">評価</label>
            <div className="flex items-center gap-4">
              {renderStars(rating, true)}
              <span className="text-white/70 text-sm">
                {rating > 0 && getRatingText(rating)}
              </span>
            </div>
          </div>

          {/* コメント */}
          <div>
            <label className="block text-sm text-white/70 mb-2">コメント（任意）</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="このコンテンツについての感想を書いてください..."
              rows={3}
              className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white placeholder-white/40"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-2">
            {userRating ? (
              <>
                <button
                  onClick={handleRatingUpdate}
                  disabled={isSubmitting || rating === 0}
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '更新中...' : '更新'}
                </button>
                <button
                  onClick={handleRatingDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  削除
                </button>
              </>
            ) : (
              <button
                onClick={handleRatingSubmit}
                disabled={isSubmitting || rating === 0}
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '投稿中...' : '評価を投稿'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* レビュー一覧 */}
      {reviews.length > 0 && (
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h4 className="text-md font-semibold text-white mb-4">レビュー一覧</h4>
          
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-white/10 pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
                      {review.userId.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">ユーザー {review.userId.slice(-4)}</div>
                      <div className="text-white/50 text-sm">
                        {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                  </div>
                </div>
                
                {review.comment && (
                  <p className="text-white/70 text-sm mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


