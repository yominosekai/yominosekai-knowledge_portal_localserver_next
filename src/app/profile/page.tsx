'use client';

import { useEffect, useState } from 'react';
import { apiClient, ProgressData, Material } from '../../lib/api';
import { AvatarUpload } from '../../components/AvatarUpload';
import { SkillManager } from '../../components/SkillManager';
import { LearningHistory } from '../../components/LearningHistory';

interface UserProfile {
  sid: string;
  username: string;
  display_name: string;
  email: string;
  department: string;
  role: string;
  created_date: string;
  last_login: string;
  is_active: string;
  skills: string[];
  bio?: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: 'completed' | 'started' | 'liked' | 'commented';
  title: string;
  description: string;
  timestamp: string;
  material_id?: string;
}

export default function Page() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    email: '',
    bio: '',
    skills: [] as string[]
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        await apiClient.authenticate();
        
        // プロフィールデータ取得（仮実装）
        const mockProfile: UserProfile = {
          sid: 'S-1-5-21-2432060128-2762725120-1584859402-1001',
          username: 'user001',
          display_name: '田中太郎',
          email: 'tanaka@example.com',
          department: '開発部',
          role: 'user',
          created_date: '2024-01-15T00:00:00Z',
          last_login: new Date().toISOString(),
          is_active: 'true',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          bio: 'フロントエンド開発者として5年の経験があります。新しい技術の学習を楽しんでいます。'
        };
        
        setProfile(mockProfile);
        setEditForm({
          display_name: mockProfile.display_name,
          email: mockProfile.email,
          bio: mockProfile.bio || '',
          skills: mockProfile.skills
        });
        
        // 進捗データ取得
        const progress = await apiClient.getProgress(mockProfile.sid);
        setProgressData(progress);
        
        // 最近の学習コンテンツ取得
        const materials = await apiClient.getContent();
        setRecentMaterials(materials.slice(0, 5));
        
        // 活動履歴生成（仮実装）
        const mockActivities: Activity[] = [
          {
            id: '1',
            type: 'completed',
            title: 'React基礎コース',
            description: 'Reactの基礎を学習しました',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            material_id: '1'
          },
          {
            id: '2',
            type: 'started',
            title: 'TypeScript上級コース',
            description: 'TypeScriptの上級テクニックを学習開始',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            material_id: '2'
          },
          {
            id: '3',
            type: 'liked',
            title: 'Node.js実践ガイド',
            description: 'Node.jsの実践的な使い方を学習',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            material_id: '3'
          }
        ];
        
        setActivities(mockActivities);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.sid,
          ...editForm
        })
      });
      
      if (response.ok) {
        setProfile(prev => prev ? { ...prev, ...editForm } : null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !editForm.skills.includes(skill)) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed': return '✅';
      case 'started': return '🚀';
      case 'liked': return '❤️';
      case 'commented': return '💬';
      default: return '📝';
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'completed': return '完了';
      case 'started': return '開始';
      case 'liked': return 'いいね';
      case 'commented': return 'コメント';
      default: return 'アクティビティ';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white/70">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <h2 className="text-xl font-semibold mb-3 text-red-400">エラー</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <h2 className="text-xl font-semibold mb-3 text-red-400">エラー</h2>
        <p className="text-red-300">プロフィールが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* プロフィールヘッダー */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.display_name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
              <p className="text-white/70">@{profile.username}</p>
              <p className="text-white/50 text-sm">{profile.department} • {profile.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
            >
              {isEditing ? 'キャンセル' : '編集'}
            </button>
          </div>
        </div>

        {/* 編集フォーム */}
        {isEditing && (
          <div className="mb-6 p-4 rounded-lg bg-black/20 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold mb-4">プロフィール編集</h3>
            
            {/* アバターアップロード */}
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-3">プロフィール画像</h4>
              <AvatarUpload
                currentAvatar={avatarUrl}
                currentInitials={profile.display_name.charAt(0)}
                onAvatarChange={setAvatarUrl}
                className="max-w-md"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">表示名</label>
                <input
                  type="text"
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">メール</label>
                <input
                  type="email"
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-1">自己紹介</label>
                <textarea
                  className="w-full rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-1">スキル</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded bg-brand/20 text-brand text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-brand hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="スキルを入力"
                    className="flex-1 rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="スキルを入力"]') as HTMLInputElement;
                      if (input) {
                        addSkill(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded bg-black/40 text-white hover:bg-white/10 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* プロフィール情報 */}
        {!isEditing && (
          <div className="space-y-4">
            {profile.bio && (
              <p className="text-white/70">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded bg-brand/20 text-brand text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/50">
              <div>
                <span className="block">メール</span>
                <span className="text-white/70">{profile.email}</span>
              </div>
              <div>
                <span className="block">部署</span>
                <span className="text-white/70">{profile.department}</span>
              </div>
              <div>
                <span className="block">登録日</span>
                <span className="text-white/70">{new Date(profile.created_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block">最終ログイン</span>
                <span className="text-white/70">{new Date(profile.last_login).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* タブナビゲーション */}
      <div className="flex gap-2">
        {[
          { id: 'overview', label: '概要' },
          { id: 'skills', label: 'スキル・資格' },
          { id: 'activities', label: '学習履歴' },
          { id: 'settings', label: '設定' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-brand text-white'
                : 'bg-black/20 text-white/70 hover:bg-white/10'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 概要タブ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 進捗サマリー */}
          {progressData && (
            <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold mb-4">学習進捗</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand mb-1">
                    {progressData.summary?.completed || 0}
                  </div>
                  <div className="text-sm text-white/70">完了</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {progressData.summary?.in_progress || 0}
                  </div>
                  <div className="text-sm text-white/70">進行中</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400 mb-1">
                    {progressData.summary?.not_started || 0}
                  </div>
                  <div className="text-sm text-white/70">未開始</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {progressData.summary?.completion_rate || 0}%
                  </div>
                  <div className="text-sm text-white/70">完了率</div>
                </div>
              </div>
            </div>
          )}

          {/* 最近の学習 */}
          <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold mb-4">最近の学習</h3>
            <div className="space-y-3">
              {recentMaterials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-3 rounded bg-black/20">
                  <div>
                    <h4 className="font-medium text-white">{material.title}</h4>
                    <p className="text-sm text-white/70">{material.description}</p>
                  </div>
                  <div className="text-xs text-white/50">
                    {material.difficulty} • {material.estimated_hours}時間
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 進捗タブ */}
      {activeTab === 'progress' && progressData && (
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold mb-4">詳細進捗</h3>
          
          {/* 進捗チャート */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">進捗グラフ</h4>
            <div className="h-64 flex items-end justify-center space-x-2">
              <div className="flex flex-col items-center">
                <div 
                  className="w-8 bg-brand rounded-t"
                  style={{ height: `${(progressData.summary?.completed || 0) * 20}px` }}
                ></div>
                <span className="text-xs text-white/70 mt-2">完了</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-8 bg-yellow-500 rounded-t"
                  style={{ height: `${(progressData.summary?.in_progress || 0) * 20}px` }}
                ></div>
                <span className="text-xs text-white/70 mt-2">進行中</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-8 bg-gray-500 rounded-t"
                  style={{ height: `${(progressData.summary?.not_started || 0) * 20}px` }}
                ></div>
                <span className="text-xs text-white/70 mt-2">未開始</span>
              </div>
            </div>
          </div>

          {/* 活動履歴 */}
          {progressData.activities && progressData.activities.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3">最近の活動</h4>
              <div className="space-y-2">
                {progressData.activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded bg-black/20">
                    <div>
                      <div className="font-medium text-white">コンテンツ ID: {activity.material_id}</div>
                      <div className="text-sm text-white/70">
                        ステータス: {activity.status} | スコア: {activity.score || 0}
                      </div>
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* スキル・資格タブ */}
      {activeTab === 'skills' && (
        <SkillManager userId={profile.sid} />
      )}

      {/* 学習履歴タブ */}
      {activeTab === 'activities' && (
        <LearningHistory userId={profile.sid} />
      )}

      {/* 設定タブ */}
      {activeTab === 'settings' && (
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold mb-4">設定</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded bg-black/20">
              <div>
                <h4 className="font-medium text-white">メール通知</h4>
                <p className="text-sm text-white/70">学習の進捗や新しいコンテンツについてメールで通知を受け取る</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-brand" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded bg-black/20">
              <div>
                <h4 className="font-medium text-white">プライバシー設定</h4>
                <p className="text-sm text-white/70">プロフィールを他のユーザーに公開する</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-brand" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded bg-black/20">
              <div>
                <h4 className="font-medium text-white">ダークモード</h4>
                <p className="text-sm text-white/70">ダークテーマを使用する</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-brand" defaultChecked />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
