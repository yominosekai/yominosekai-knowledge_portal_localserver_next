'use client';

import React, { useState, useEffect } from 'react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceAlert {
  id: string;
  type: 'performance' | 'error' | 'resource' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  systemHealth: {
    overall: number;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    dataTransferRate: number;
  };
  errorRate: {
    total: number;
    rate: number;
    byType: Record<string, number>;
  };
}

interface PerformanceMonitoringProps {
  className?: string;
}

export function PerformanceMonitoring({ className = '' }: PerformanceMonitoringProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    loadPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(loadPerformanceData, 5000);
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      // 実際のAPIからパフォーマンスデータを取得
      // const response = await fetch(`/api/performance/metrics?range=${timeRange}`);
      // const data = await response.json();
      
      // モックデータ
      const mockData: PerformanceData = {
        metrics: [
          {
            id: '1',
            name: 'CPU使用率',
            value: 45.2,
            unit: '%',
            threshold: { warning: 70, critical: 90 },
            status: 'normal',
            timestamp: '2024-01-15T10:30:00Z',
            trend: 'stable'
          },
          {
            id: '2',
            name: 'メモリ使用率',
            value: 78.5,
            unit: '%',
            threshold: { warning: 80, critical: 95 },
            status: 'warning',
            timestamp: '2024-01-15T10:30:00Z',
            trend: 'up'
          },
          {
            id: '3',
            name: 'ディスク使用率',
            value: 65.3,
            unit: '%',
            threshold: { warning: 85, critical: 95 },
            status: 'normal',
            timestamp: '2024-01-15T10:30:00Z',
            trend: 'stable'
          },
          {
            id: '4',
            name: 'レスポンス時間',
            value: 245,
            unit: 'ms',
            threshold: { warning: 500, critical: 1000 },
            status: 'normal',
            timestamp: '2024-01-15T10:30:00Z',
            trend: 'down'
          },
          {
            id: '5',
            name: 'エラー率',
            value: 0.8,
            unit: '%',
            threshold: { warning: 2, critical: 5 },
            status: 'normal',
            timestamp: '2024-01-15T10:30:00Z',
            trend: 'stable'
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'performance',
            severity: 'medium',
            title: 'メモリ使用率が高い',
            description: 'メモリ使用率が78.5%に達しています。監視を続けてください。',
            timestamp: '2024-01-15T10:25:00Z',
            resolved: false
          },
          {
            id: '2',
            type: 'error',
            severity: 'low',
            title: 'APIエラーが増加',
            description: '過去1時間でAPIエラーが5件発生しました。',
            timestamp: '2024-01-15T09:45:00Z',
            resolved: true,
            resolvedAt: '2024-01-15T10:15:00Z'
          },
          {
            id: '3',
            type: 'resource',
            severity: 'high',
            title: 'ディスク容量不足',
            description: 'ディスク使用率が95%を超えました。すぐに対処が必要です。',
            timestamp: '2024-01-15T08:30:00Z',
            resolved: false
          }
        ],
        systemHealth: {
          overall: 85,
          cpu: 45,
          memory: 78,
          disk: 65,
          network: 92
        },
        responseTime: {
          average: 245,
          p95: 450,
          p99: 780
        },
        throughput: {
          requestsPerSecond: 1250,
          dataTransferRate: 15.6
        },
        errorRate: {
          total: 12,
          rate: 0.8,
          byType: {
            'API Error': 8,
            'Database Error': 3,
            'Network Error': 1
          }
        }
      };
      
      setPerformanceData(mockData);
    } catch (error) {
      console.error('パフォーマンスデータの読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400 bg-green-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20';
      case 'critical': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'critical': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-400';
    if (health >= 70) return 'text-yellow-400';
    if (health >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-white/70">パフォーマンスデータがありません</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">パフォーマンス監視</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-brand rounded focus:ring-brand"
            />
            <span className="text-white/70 text-sm">自動更新</span>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded bg-black/20 px-3 py-2 ring-1 ring-white/10 text-white"
          >
            <option value="1h">過去1時間</option>
            <option value="24h">過去24時間</option>
            <option value="7d">過去7日</option>
            <option value="30d">過去30日</option>
          </select>
        </div>
      </div>

      {/* システムヘルス */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">システムヘルス</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getHealthColor(performanceData.systemHealth.overall)}`}>
              {performanceData.systemHealth.overall}%
            </div>
            <div className="text-white/70 text-sm">総合ヘルス</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(performanceData.systemHealth.cpu)}`}>
              {performanceData.systemHealth.cpu}%
            </div>
            <div className="text-white/70 text-sm">CPU</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(performanceData.systemHealth.memory)}`}>
              {performanceData.systemHealth.memory}%
            </div>
            <div className="text-white/70 text-sm">メモリ</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(performanceData.systemHealth.disk)}`}>
              {performanceData.systemHealth.disk}%
            </div>
            <div className="text-white/70 text-sm">ディスク</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(performanceData.systemHealth.network)}`}>
              {performanceData.systemHealth.network}%
            </div>
            <div className="text-white/70 text-sm">ネットワーク</div>
          </div>
        </div>
      </div>

      {/* パフォーマンスメトリクス */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">パフォーマンスメトリクス</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceData.metrics.map((metric) => (
            <div
              key={metric.id}
              className={`p-4 rounded-lg ring-1 transition-colors cursor-pointer ${
                selectedMetric === metric.id
                  ? 'ring-brand bg-brand/10'
                  : 'ring-white/10 bg-white/5 hover:ring-white/20'
              }`}
              onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{metric.name}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-white">
                  {metric.value}{metric.unit}
                </span>
                <span className="text-lg">{getTrendIcon(metric.trend)}</span>
              </div>
              
              <div className="text-xs text-white/50">
                警告: {metric.threshold.warning}{metric.unit} | 危険: {metric.threshold.critical}{metric.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* レスポンス時間・スループット */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">レスポンス時間</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">平均</span>
              <span className="text-white font-medium">{performanceData.responseTime.average}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">95パーセンタイル</span>
              <span className="text-white font-medium">{performanceData.responseTime.p95}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">99パーセンタイル</span>
              <span className="text-white font-medium">{performanceData.responseTime.p99}ms</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">スループット</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">リクエスト/秒</span>
              <span className="text-white font-medium">{performanceData.throughput.requestsPerSecond.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">データ転送率</span>
              <span className="text-white font-medium">{performanceData.throughput.dataTransferRate} MB/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* エラー率 */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">エラー率</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">総エラー数</span>
              <span className="text-white font-medium">{performanceData.errorRate.total}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70">エラー率</span>
              <span className="text-white font-medium">{performanceData.errorRate.rate}%</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-white/70 text-sm mb-2">エラータイプ別</h4>
            <div className="space-y-1">
              {Object.entries(performanceData.errorRate.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{type}</span>
                  <span className="text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* アラート */}
      <div className="rounded-lg bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">アラート</h3>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
          >
            {showAlerts ? '隠す' : '表示'}
          </button>
        </div>
        
        {showAlerts && (
          <div className="space-y-3">
            {performanceData.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg ring-1 ${
                  alert.resolved 
                    ? 'ring-green-500/20 bg-green-500/10' 
                    : 'ring-red-500/20 bg-red-500/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-white font-medium">{alert.title}</span>
                  </div>
                  <span className="text-white/50 text-xs">
                    {new Date(alert.timestamp).toLocaleString('ja-JP')}
                  </span>
                </div>
                
                <p className="text-white/70 text-sm mb-2">{alert.description}</p>
                
                {alert.resolved && alert.resolvedAt && (
                  <p className="text-green-400 text-xs">
                    解決済み: {new Date(alert.resolvedAt).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



