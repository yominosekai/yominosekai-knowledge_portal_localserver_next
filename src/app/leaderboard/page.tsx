'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

interface User {
  sid: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  department: string;
  created_date: string;
  last_login: string;
  is_active: string;
}

interface UserStats {
  userId: string;
  username: string;
  displayName: string;
  department: string;
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  totalHours: number;
  rank: number;
}

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('completionRate');
  const [userRole, setUserRole] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 認証
        const authResult = await apiClient.authenticate();
        if (authResult?.user) {
          setUserRole(authResult.user.role);
          setUserDepartment(authResult.user.department);
        }
        
        // ユーザー一覧取得
        const usersResponse = await fetch('/api/admin/users');
        const usersData = await usersResponse.json();
        
        // ユーザーフィルタリング（インストラクターは同じ部署のみ、管理者は全員）
        let filteredUsers = usersData;
        if (userRole === 'instructor') {
          filteredUsers = usersData.filter((user: User) => user.department === userDepartment);
          setSelectedDepartment(userDepartment); // インストラクターの場合は自分の部署をデフォルト選択
        }
        setUsers(filteredUsers);
        
        // 各ユーザーの統計を計算
        const stats: UserStats[] = [];
        
        for (const user of usersData) {
          try {
            const progressResponse = await apiClient.getProgress(user.sid);
            if (progressResponse) {
              const totalActivities = progressResponse.summary?.total || 0;
              const completedActivities = progressResponse.summary?.completed || 0;
              const completionRate = progressResponse.summary?.completion_rate || 0;
              
              stats.push({
                userId: user.sid,
                username: user.username,
                displayName: user.display_name,
                department: user.department,
                totalActivities,
                completedActivities,
                completionRate,
                totalHours: completedActivities * 2, // 仮の計算
                rank: 0
              });
            }
          } catch (err) {
            console.error(`Error fetching stats for user ${user.username}:`, err);
          }
        }
        
        // ランキング計算
        stats.sort((a, b) => {
          switch (sortBy) {
            case 'completionRate':
              return b.completionRate - a.completionRate;
            case 'completedActivities':
              return b.completedActivities - a.completedActivities;
            case 'totalHours':
              return b.totalHours - a.totalHours;
            default:
              return b.completionRate - a.completionRate;
          }
        });
        
        stats.forEach((stat, index) => {
          stat.rank = index + 1;
        });
        
        setUserStats(stats);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy]);

  const filteredStats = selectedDepartment === 'all' 
    ? userStats 
    : userStats.filter(stat => stat.department === selectedDepartment);

  const departments = Array.from(new Set(userStats.map(stat => stat.department)));

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

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="text-xl font-semibold mb-4">リーダーボード</h2>
        
        {/* フィルターとソート */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm text-white/70 mb-1">部署でフィルター</label>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">すべての部署</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-1">ソート順</label>
            <select
              className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="completionRate">完了率</option>
              <option value="completedActivities">完了数</option>
              <option value="totalHours">学習時間</option>
            </select>
          </div>
        </div>

        {/* リーダーボードテーブル */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/70">順位</th>
                <th className="text-left py-3 px-4 text-white/70">ユーザー</th>
                <th className="text-left py-3 px-4 text-white/70">部署</th>
                <th className="text-right py-3 px-4 text-white/70">完了率</th>
                <th className="text-right py-3 px-4 text-white/70">完了数</th>
                <th className="text-right py-3 px-4 text-white/70">学習時間</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat, index) => (
                <tr key={stat.userId} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {stat.rank <= 3 ? (
                        <span className={`text-2xl ${
                          stat.rank === 1 ? 'text-yellow-400' :
                          stat.rank === 2 ? 'text-gray-300' :
                          'text-orange-400'
                        }`}>
                          {stat.rank === 1 ? '🥇' : stat.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-white/70">#{stat.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-white">{stat.displayName}</div>
                      <div className="text-sm text-white/50">@{stat.username}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white/70">{stat.department}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-black/20 rounded-full h-2">
                        <div 
                          className="bg-brand h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stat.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white">{stat.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-white/70">
                    {stat.completedActivities}/{stat.totalActivities}
                  </td>
                  <td className="py-3 px-4 text-right text-white/70">
                    {stat.totalHours}時間
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/70">該当するユーザーが見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* 部署別統計 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold mb-4">部署別統計</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map(dept => {
            const deptStats = userStats.filter(stat => stat.department === dept);
            const avgCompletionRate = deptStats.length > 0 
              ? Math.round(deptStats.reduce((sum, stat) => sum + stat.completionRate, 0) / deptStats.length)
              : 0;
            const totalMembers = deptStats.length;
            
            return (
              <div key={dept} className="rounded-lg bg-black/20 p-4">
                <h4 className="font-semibold text-white mb-2">{dept}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">メンバー数:</span>
                    <span className="text-white">{totalMembers}人</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">平均完了率:</span>
                    <span className="text-white">{avgCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2 mt-2">
                    <div 
                      className="bg-brand h-2 rounded-full transition-all duration-300"
                      style={{ width: `${avgCompletionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
