'use client';

import React, { useState, useEffect } from 'react';

interface IntegrationConfig {
  id: string;
  name: string;
  type: 'active_directory' | 'ldap' | 'sso' | 'oauth' | 'api';
  status: 'active' | 'inactive' | 'error';
  description: string;
  settings: Record<string, any>;
  lastSync: string;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

interface IntegrationAPIsProps {
  className?: string;
}

export function IntegrationAPIs({ className = '' }: IntegrationAPIsProps) {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, any>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      // 実際のAPIから統合設定を取得
      // const response = await fetch('/api/integrations');
      // const data = await response.json();
      
      // モックデータ
      const mockIntegrations: IntegrationConfig[] = [
        {
          id: '1',
          name: 'Active Directory',
          type: 'active_directory',
          status: 'active',
          description: 'Windowsドメインのユーザー認証と同期',
          settings: {
            server: 'ldap.company.com',
            port: 389,
            baseDN: 'DC=company,DC=com',
            bindDN: 'CN=service,OU=Users,DC=company,DC=com',
            syncInterval: 3600
          },
          lastSync: '2024-01-15T10:30:00Z',
          syncStatus: 'success'
        },
        {
          id: '2',
          name: 'LDAP Server',
          type: 'ldap',
          status: 'active',
          description: 'OpenLDAPサーバーとの統合',
          settings: {
            server: 'ldap.internal.com',
            port: 389,
            baseDN: 'ou=people,dc=internal,dc=com',
            bindDN: 'cn=admin,dc=internal,dc=com',
            syncInterval: 1800
          },
          lastSync: '2024-01-15T10:25:00Z',
          syncStatus: 'success'
        },
        {
          id: '3',
          name: 'SSO (SAML)',
          type: 'sso',
          status: 'inactive',
          description: 'SAMLベースのシングルサインオン',
          settings: {
            ssoUrl: 'https://sso.company.com/saml',
            entityId: 'knowledge-portal',
            certificate: '-----BEGIN CERTIFICATE-----...',
            syncInterval: 7200
          },
          lastSync: '2024-01-14T15:20:00Z',
          syncStatus: 'error',
          errorMessage: '証明書の有効期限が切れています'
        },
        {
          id: '4',
          name: 'OAuth 2.0',
          type: 'oauth',
          status: 'active',
          description: 'Google WorkspaceとのOAuth統合',
          settings: {
            clientId: 'google-client-id',
            clientSecret: 'google-client-secret',
            scope: 'openid email profile',
            redirectUri: 'https://portal.company.com/auth/callback',
            syncInterval: 3600
          },
          lastSync: '2024-01-15T10:35:00Z',
          syncStatus: 'success'
        }
      ];
      
      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('統合設定の読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('同期を開始しました');
        loadIntegrations();
      } else {
        throw new Error('同期の開始に失敗しました');
      }
    } catch (error) {
      console.error('同期エラー:', error);
      alert('同期の開始に失敗しました');
    }
  };

  const handleToggleStatus = async (integrationId: string) => {
    try {
      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) return;

      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: integration.status === 'active' ? 'inactive' : 'active'
        })
      });

      if (response.ok) {
        alert(`統合を${integration.status === 'active' ? '無効化' : '有効化'}しました`);
        loadIntegrations();
      } else {
        throw new Error('ステータスの変更に失敗しました');
      }
    } catch (error) {
      console.error('ステータス変更エラー:', error);
      alert('ステータスの変更に失敗しました');
    }
  };

  const handleEdit = (integration: IntegrationConfig) => {
    setEditingIntegration(integration);
    setConfigForm(integration.settings);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!editingIntegration) return;

    try {
      const response = await fetch(`/api/integrations/${editingIntegration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: configForm
        })
      });

      if (response.ok) {
        alert('設定を保存しました');
        setShowConfigModal(false);
        setEditingIntegration(null);
        setConfigForm({});
        loadIntegrations();
      } else {
        throw new Error('設定の保存に失敗しました');
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      alert('設定の保存に失敗しました');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'active_directory': return '🏢';
      case 'ldap': return '🔗';
      case 'sso': return '🔐';
      case 'oauth': return '🔑';
      case 'api': return '⚡';
      default: return '🔧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'inactive': return 'text-gray-400 bg-gray-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">外部システム統合</h2>
        <button
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          新しい統合
        </button>
      </div>

      {/* 統合一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10 hover:ring-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(integration.type)}</span>
                <div>
                  <h3 className="font-semibold text-white">{integration.name}</h3>
                  <p className="text-white/70 text-sm">{integration.description}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(integration.status)}`}>
                {integration.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">最終同期</span>
                <span className="text-white/50">
                  {new Date(integration.lastSync).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">同期ステータス</span>
                <span className={`px-2 py-1 rounded text-xs ${getSyncStatusColor(integration.syncStatus)}`}>
                  {integration.syncStatus}
                </span>
              </div>
              {integration.errorMessage && (
                <div className="text-red-400 text-sm">
                  {integration.errorMessage}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(integration)}
                className="flex-1 px-3 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
              >
                設定
              </button>
              <button
                onClick={() => handleSync(integration.id)}
                className="flex-1 px-3 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
              >
                同期
              </button>
              <button
                onClick={() => handleToggleStatus(integration.id)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  integration.status === 'active'
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {integration.status === 'active' ? '無効' : '有効'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {integrations.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔧</div>
          <p className="text-white/70">統合設定がありません</p>
        </div>
      )}

      {/* 設定モーダル */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingIntegration ? '統合設定を編集' : '新しい統合を追加'}
              </h2>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setEditingIntegration(null);
                  setConfigForm({});
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    統合タイプ
                  </label>
                  <select
                    value={editingIntegration?.type || ''}
                    onChange={(e) => {
                      if (editingIntegration) {
                        setEditingIntegration({...editingIntegration, type: e.target.value as any});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingIntegration}
                  >
                    <option value="">選択してください</option>
                    <option value="active_directory">Active Directory</option>
                    <option value="ldap">LDAP</option>
                    <option value="sso">SSO (SAML)</option>
                    <option value="oauth">OAuth 2.0</option>
                    <option value="api">API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前
                  </label>
                  <input
                    type="text"
                    value={editingIntegration?.name || ''}
                    onChange={(e) => {
                      if (editingIntegration) {
                        setEditingIntegration({...editingIntegration, name: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={editingIntegration?.description || ''}
                    onChange={(e) => {
                      if (editingIntegration) {
                        setEditingIntegration({...editingIntegration, description: e.target.value});
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 設定項目 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    設定
                  </label>
                  <div className="space-y-3">
                    {Object.entries(configForm).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm text-gray-600 mb-1">
                          {key}
                        </label>
                        <input
                          type={key.includes('password') || key.includes('secret') ? 'password' : 'text'}
                          value={value}
                          onChange={(e) => setConfigForm({...configForm, [key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setEditingIntegration(null);
                  setConfigForm({});
                }}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


