'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [sid, setSid] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(sid);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Knowledge Portal</h2>
          <p className="mt-2 text-white/70">SIDでログインしてください</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="sid" className="block text-sm font-medium text-white/70 mb-2">
              SID (Security Identifier)
            </label>
            <input
              id="sid"
              name="sid"
              type="text"
              required
              className="w-full px-3 py-2 rounded bg-black/20 ring-1 ring-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="S-1-5-21-..."
              value={sid}
              onChange={(e) => setSid(e.target.value)}
            />
            <p className="mt-1 text-xs text-white/50">
              例: S-1-5-21-2432060128-2762725120-1584859402-1001
            </p>
          </div>

          {error && (
            <div className="rounded bg-red-500/10 p-3 ring-1 ring-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 rounded bg-brand text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-white/50">
            デモ用SID: S-1-5-21-2432060128-2762725120-1584859402-1001
          </p>
        </div>
      </div>
    </div>
  );
}



