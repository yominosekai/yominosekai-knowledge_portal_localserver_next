'use client';

import { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
  acquired_date?: string;
}

interface SkillManagerProps {
  userId: string;
  className?: string;
}

export function SkillManager({ userId, className = '' }: SkillManagerProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 1,
    category: '',
    type: 'skill' as 'skill' | 'certification'
  });

  useEffect(() => {
    loadSkills();
  }, [userId]);

  const loadSkills = async () => {
    try {
      setIsLoading(true);
      // 実際のAPIからスキルデータを取得
      // const response = await fetch(`/api/users/${userId}/skills`);
      // const data = await response.json();
      
      // モックデータ
      const mockSkills: Skill[] = [
        { id: '1', name: 'Python', level: 3, category: 'Programming', acquired_date: '2024-01-15' },
        { id: '2', name: 'React', level: 2, category: 'Frontend', acquired_date: '2024-02-20' },
        { id: '3', name: 'Node.js', level: 2, category: 'Backend', acquired_date: '2024-03-10' },
      ];
      
      const mockCertifications: Skill[] = [
        { id: '4', name: 'AWS Certified Solutions Architect', level: 1, category: 'Cloud', acquired_date: '2024-01-30' },
        { id: '5', name: 'Google Analytics Certified', level: 1, category: 'Analytics', acquired_date: '2024-02-15' },
      ];

      setSkills(mockSkills);
      setCertifications(mockCertifications);
    } catch (error) {
      console.error('スキル読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;

    try {
      const skill: Skill = {
        id: Date.now().toString(),
        name: newSkill.name,
        level: newSkill.level,
        category: newSkill.category,
        acquired_date: new Date().toISOString().split('T')[0]
      };

      if (newSkill.type === 'skill') {
        setSkills(prev => [...prev, skill]);
      } else {
        setCertifications(prev => [...prev, skill]);
      }

      setNewSkill({ name: '', level: 1, category: '', type: 'skill' });
      setShowAddForm(false);
    } catch (error) {
      console.error('スキル追加エラー:', error);
    }
  };

  const handleDeleteSkill = (id: string, type: 'skill' | 'certification') => {
    if (type === 'skill') {
      setSkills(prev => prev.filter(skill => skill.id !== id));
    } else {
      setCertifications(prev => prev.filter(cert => cert.id !== id));
    }
  };

  const getLevelText = (level: number) => {
    const levels = ['初級', '中級', '上級', 'エキスパート'];
    return levels[level - 1] || '初級';
  };

  const getLevelColor = (level: number) => {
    const colors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return colors[level - 1] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-white/20 rounded mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`skill-manager ${className}`}>
      {/* スキル一覧 */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">保有スキル</h4>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-sm"
          >
            スキル追加
          </button>
        </div>
        
        <div className="space-y-3">
          {skills.map(skill => (
            <div key={skill.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">{skill.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getLevelColor(skill.level)} text-white`}>
                    {getLevelText(skill.level)}
                  </span>
                  <span className="text-sm text-white/50">{skill.category}</span>
                </div>
                {skill.acquired_date && (
                  <p className="text-xs text-white/50 mt-1">
                    取得日: {new Date(skill.acquired_date).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteSkill(skill.id, 'skill')}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                削除
              </button>
            </div>
          ))}
          
          {skills.length === 0 && (
            <p className="text-white/50 text-center py-4">スキルが登録されていません</p>
          )}
        </div>
      </div>

      {/* 資格・認定一覧 */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">資格・認定</h4>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-sm"
          >
            資格追加
          </button>
        </div>
        
        <div className="space-y-3">
          {certifications.map(cert => (
            <div key={cert.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">{cert.name}</span>
                  <span className="text-sm text-white/50">{cert.category}</span>
                </div>
                {cert.acquired_date && (
                  <p className="text-xs text-white/50 mt-1">
                    取得日: {new Date(cert.acquired_date).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteSkill(cert.id, 'certification')}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                削除
              </button>
            </div>
          ))}
          
          {certifications.length === 0 && (
            <p className="text-white/50 text-center py-4">資格が登録されていません</p>
          )}
        </div>
      </div>

      {/* スキル追加フォーム */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">スキル・資格追加</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  タイプ
                </label>
                <select
                  value={newSkill.type}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, type: e.target.value as 'skill' | 'certification' }))}
                  className="w-full px-3 py-2 rounded bg-black/20 text-white ring-1 ring-white/10 focus:ring-brand focus:outline-none"
                >
                  <option value="skill">スキル</option>
                  <option value="certification">資格・認定</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  名前 *
                </label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-black/20 text-white ring-1 ring-white/10 focus:ring-brand focus:outline-none"
                  placeholder="スキル名または資格名"
                />
              </div>

              {newSkill.type === 'skill' && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    レベル
                  </label>
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded bg-black/20 text-white ring-1 ring-white/10 focus:ring-brand focus:outline-none"
                  >
                    <option value={1}>初級</option>
                    <option value={2}>中級</option>
                    <option value={3}>上級</option>
                    <option value={4}>エキスパート</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  カテゴリ
                </label>
                <input
                  type="text"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-black/20 text-white ring-1 ring-white/10 focus:ring-brand focus:outline-none"
                  placeholder="例: Programming, Cloud, Analytics"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddSkill}
                className="btn btn-success flex-1"
                disabled={!newSkill.name.trim()}
              >
                追加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary flex-1"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


