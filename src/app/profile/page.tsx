'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, ProgressData, Material } from '../../lib/api';
import { AvatarUpload } from '../../components/AvatarUpload';

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
  certifications: string[];
  mos: string[];
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
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    email: '',
    bio: '',
    skills: [] as string[],
    certifications: [] as string[],
    mos: [] as string[]
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // アバターURL変更のデバッグログ
  const handleAvatarChange = (newAvatarUrl: string) => {
    console.log(`[ProfilePage] アバターURL変更:`, newAvatarUrl ? `${newAvatarUrl.substring(0, 50)}...` : '空');
    setAvatarUrl(newAvatarUrl);
  };

  // デバッグログ用のuseEffect
  useEffect(() => {
    if (profile) {
      console.log(`[ProfilePage] AvatarUpload props:`, {
        currentAvatar: avatarUrl,
        currentInitials: profile.display_name ? profile.display_name.charAt(0) : 'U',
        display_name: profile.display_name
      });
    }
  }, [profile, avatarUrl]);

  useEffect(() => {
    const fetchData = async () => {
      console.log(`[ProfilePage] ===== データ取得開始 =====`);
      console.log(`[ProfilePage] authLoading:`, authLoading);
      console.log(`[ProfilePage] user:`, user);
      
      // 認証が完了するまで待機
      if (authLoading || !user) {
        console.log(`[ProfilePage] 認証待機中またはユーザーなし`);
        return;
      }

      try {
        setLoading(true);
        
        // プロフィールデータ取得
        console.log(`[ProfilePage] プロフィールAPI呼び出し: /api/profile/${user.sid}`);
        const profileResponse = await fetch(`/api/profile/${user.sid}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log(`[ProfilePage] プロフィールAPI応答:`, profileData);
          if (profileData.success) {
            const userProfile = profileData.profile;
            console.log(`[ProfilePage] 取得したプロフィール:`, userProfile);
            // 不足しているフィールドにデフォルト値を設定
            const enrichedProfile = {
              ...userProfile,
              skills: userProfile.skills || [],
              certifications: userProfile.certifications || [],
              mos: userProfile.mos || [],
              bio: userProfile.bio || '',
              avatar: userProfile.avatar || ''
            };
            console.log(`[ProfilePage] 設定するプロフィール:`, enrichedProfile);
            console.log(`[ProfilePage] アバターURL:`, enrichedProfile.avatar);
            console.log(`[ProfilePage] アバタータイプ:`, enrichedProfile.avatar?.startsWith('data:') ? 'Base64' : 'URL');
            setProfile(enrichedProfile);
            setAvatarUrl(enrichedProfile.avatar);
            setEditForm({
              display_name: enrichedProfile.display_name || '',
              email: enrichedProfile.email || '',
              bio: enrichedProfile.bio || '',
              skills: enrichedProfile.skills || [],
              certifications: enrichedProfile.certifications || [],
              mos: enrichedProfile.mos || []
            });
          }
        } else {
          console.error('プロフィール取得エラー:', profileResponse.status);
          setError('プロフィールの取得に失敗しました。');
        }
        
        // 進捗データ取得
        const progress = await apiClient.getProgress(user.sid);
        setProgressData(progress);
        
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
  }, [user, authLoading]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      console.log(`[ProfilePage] プロフィール保存開始`);
      console.log(`[ProfilePage] 保存するアバターURL:`, avatarUrl);
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.sid,
          display_name: editForm.display_name,
          email: editForm.email,
          bio: editForm.bio,
          skills: editForm.skills,
          certifications: editForm.certifications,
          mos: editForm.mos,
          avatar: avatarUrl
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // プロフィールを再取得して最新データを反映
          const profileResponse = await fetch(`/api/profile/${profile.sid}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success) {
              const updatedProfile = profileData.profile;
              // 不足しているフィールドにデフォルト値を設定
              const enrichedProfile = {
                ...updatedProfile,
                skills: updatedProfile.skills || [],
                certifications: updatedProfile.certifications || [],
                bio: updatedProfile.bio || '',
                avatar: updatedProfile.avatar || ''
              };
              setProfile(enrichedProfile);
              // AuthContextも更新（プロフィールAPIから取得した最新データを使用）
              updateUser({
                ...user!,
                display_name: enrichedProfile.display_name,
                email: enrichedProfile.email,
                avatar: enrichedProfile.avatar,
                bio: enrichedProfile.bio,
                skills: enrichedProfile.skills,
                certifications: enrichedProfile.certifications,
                mos: enrichedProfile.mos
              });
            }
          }
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
    }
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

  const addCertification = (certification: string) => {
    if (certification && !editForm.certifications.includes(certification)) {
      setEditForm(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification]
      }));
    }
  };

  const removeCertification = (certification: string) => {
    setEditForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  const addMos = (mos: string) => {
    if (mos && !editForm.mos.includes(mos)) {
      setEditForm(prev => ({
        ...prev,
        mos: [...prev.mos, mos]
      }));
    }
  };

  const removeMos = (mos: string) => {
    setEditForm(prev => ({
      ...prev,
      mos: prev.mos.filter(m => m !== mos)
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <div className="text-white/70">
            {authLoading ? '認証中...' : 'データを読み込み中...'}
          </div>
        </div>
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
          <div className="mb-8 rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
            <div className="flex items-center space-x-6">
              {/* アバター */}
              <div className="h-20 w-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden ring-2 ring-white/30 shadow-lg">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      console.log(`[ProfilePage] アバター読み込みエラー:`, avatarUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  profile.display_name ? profile.display_name.charAt(0) : 'U'
                )}
              </div>
              
              {/* ユーザー情報 */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
                <p className="text-white/80">@{profile.username}</p>
                
                {/* ロールと部署 */}
                <div className="mt-2 flex space-x-4 text-sm text-white/60">
                  <span>{profile.role}</span>
                  <span>•</span>
                  <span>{profile.department}</span>
                </div>
              </div>
              
              {/* 編集ボタン */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'キャンセル' : '編集'}
              </button>
            </div>
          </div>
          {/* 編集フォーム */}
          {isEditing && (
            <div className="mb-8 rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">プロフィール編集</h3>
            
            {/* アバターアップロード */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-white/90 mb-3">プロフィール画像</h4>
              <AvatarUpload
                currentAvatar={avatarUrl}
                currentInitials={profile.display_name ? profile.display_name.charAt(0) : 'U'}
                onAvatarChange={handleAvatarChange}
                className="max-w-md"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">表示名</label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 text-white placeholder-white/50 focus:ring-brand focus:outline-none transition-all duration-200"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                  placeholder="表示名を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">メールアドレス</label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 text-white placeholder-white/50 focus:ring-brand focus:outline-none transition-all duration-200"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="メールアドレスを入力"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-2">自己紹介</label>
                <textarea
                  className="w-full rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 text-white placeholder-white/50 focus:ring-brand focus:outline-none transition-all duration-200 resize-none"
                  rows={4}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  placeholder="自己紹介を入力してください"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-3">スキル</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editForm.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 text-sm font-medium flex items-center gap-2 ring-1 ring-blue-500/30"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-blue-300 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="スキルを入力（例：Python, JavaScript）"
                    className="flex-1 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 text-white placeholder-white/50 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="スキルを入力（例：Python, JavaScript）"]') as HTMLInputElement;
                      if (input) {
                        addSkill(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    追加
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-3">資格・認定</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editForm.certifications.map((certification, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 text-sm font-medium flex items-center gap-2 ring-1 ring-green-500/30"
                    >
                      {certification}
                      <button
                        onClick={() => removeCertification(certification)}
                        className="text-green-300 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="資格・認定を入力（例：情報処理安全確保支援士）"
                    className="flex-1 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 text-white placeholder-white/50 focus:ring-green-500 focus:outline-none transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCertification(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="資格・認定を入力（例：情報処理安全確保支援士）"]') as HTMLInputElement;
                      if (input) {
                        addCertification(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    追加
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-3">職場内資格</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editForm.mos.map((mos, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 text-sm font-medium flex items-center gap-2 ring-1 ring-yellow-500/30"
                    >
                      {mos}
                      <button
                        onClick={() => removeMos(mos)}
                        className="text-yellow-300 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="職場内資格を入力（例：MOS Excel Expert）"
                    className="flex-1 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 text-white placeholder-white/50 focus:ring-yellow-500 focus:outline-none transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addMos(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="職場内資格を入力（例：MOS Excel Expert）"]') as HTMLInputElement;
                      if (input) {
                        addMos(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                保存する
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
            </div>
          )}

          {/* プロフィール情報 */}
          {!isEditing && (
            <div className="space-y-6">
              {/* 自己紹介セクション */}
              {profile.bio && (
                <div className="rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-3">自己紹介</h3>
                  <p className="text-white/80">{profile.bio}</p>
                </div>
              )}
              
              {/* スキル・資格セクション */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* スキル */}
                <div className="rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">
                    スキル
                    {(profile.skills && profile.skills.length > 0) && (
                      <span className="text-sm font-normal text-white/60 ml-2">({profile.skills.length})</span>
                    )}
                  </h3>
                  
                  {(profile.skills && profile.skills.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 text-sm font-medium ring-1 ring-blue-500/30 hover:ring-blue-500/50 transition-all duration-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 italic">スキルが登録されていません</p>
                  )}
                </div>
                
                {/* 資格・認定 */}
                <div className="rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">
                    資格・認定
                    {(profile.certifications && profile.certifications.length > 0) && (
                      <span className="text-sm font-normal text-white/60 ml-2">({profile.certifications.length})</span>
                    )}
                  </h3>
                  
                  {(profile.certifications && profile.certifications.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.certifications.map((certification, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 text-sm font-medium ring-1 ring-green-500/30 hover:ring-green-500/50 transition-all duration-200"
                        >
                          {certification}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 italic">資格・認定が登録されていません</p>
                  )}
                </div>

                {/* 職場内資格 */}
                <div className="rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">
                    職場内資格
                    {(profile.mos && profile.mos.length > 0) && (
                      <span className="text-sm font-normal text-white/60 ml-2">({profile.mos.length})</span>
                    )}
                  </h3>
                  
                  {(profile.mos && profile.mos.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.mos.map((mos, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 text-sm font-medium ring-1 ring-yellow-500/30 hover:ring-yellow-500/50 transition-all duration-200"
                        >
                          {mos}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 italic">職場内資格が登録されていません</p>
                  )}
                </div>
              </div>
              
              
              {/* 詳細情報 */}
              <div className="rounded-lg bg-white/5 backdrop-blur-sm p-6 ring-1 ring-white/10 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">詳細情報</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/60 text-sm mb-1">メールアドレス</p>
                      <p className="text-white">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">部署</p>
                      <p className="text-white">{profile.department}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/60 text-sm mb-1">登録日</p>
                      <p className="text-white">{new Date(profile.created_date).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">最終ログイン</p>
                      <p className="text-white">{new Date(profile.last_login).toLocaleDateString('ja-JP')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
