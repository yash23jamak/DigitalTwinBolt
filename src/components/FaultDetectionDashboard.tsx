import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  AlertCircle,
  Eye,
  Settings,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { FaultDiagnosticModal } from './FaultDiagnosticModal';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { DigitalTwinModel } from '../types';
import {
  faultDetectionService,
  DetectedFault,
  ModelHealthStatus,
  FaultDetectionStatistics
} from '../services/faultDetectionService';

interface FaultDetectionDashboardProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
}

export const FaultDetectionDashboard: React.FC<FaultDetectionDashboardProps> = ({
  models,
  selectedModel
}) => {
  const [faults, setFaults] = useState<DetectedFault[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<ModelHealthStatus[]>([]);
  const [statistics, setStatistics] = useState<FaultDetectionStatistics | null>(null);
  const [selectedFault, setSelectedFault] = useState<DetectedFault | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Subscribe to fault detection updates
    const unsubscribeFaults = faultDetectionService.subscribeToFaults((fault) => {
      setFaults(prev => [fault, ...prev]);
    });

    const unsubscribeHealth = faultDetectionService.subscribeToHealthStatus((status) => {
      setHealthStatuses(prev => {
        const updated = prev.filter(h => h.modelId !== status.modelId);
        return [status, ...updated];
      });
    });

    // Initial data load
    loadInitialData();

    // Periodic updates
    const updateInterval = setInterval(() => {
      updateStatistics();
    }, 10000);

    return () => {
      unsubscribeFaults();
      unsubscribeHealth();
      clearInterval(updateInterval);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [initialFaults, initialHealth, initialStats] = await Promise.all([
        Promise.resolve(faultDetectionService.getDetectedFaults()),
        Promise.resolve(faultDetectionService.getModelHealthStatus()),
        Promise.resolve(faultDetectionService.getFaultDetectionStatistics())
      ]);

      setFaults(initialFaults);
      setHealthStatuses(initialHealth);
      setStatistics(initialStats);
    } catch (error) {
      console.error('Error loading fault detection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatistics = () => {
    const newStats = faultDetectionService.getFaultDetectionStatistics();
    setStatistics(newStats);
  };

  const handleAcknowledgeFault = (faultId: string) => {
    faultDetectionService.acknowledgeFault(faultId);
    setFaults(prev => prev.map(f =>
      f.id === faultId ? { ...f, status: 'acknowledged' } : f
    ));
  };

  const handleResolveFault = (faultId: string) => {
    faultDetectionService.resolveFault(faultId);
    setFaults(prev => prev.map(f =>
      f.id === faultId ? { ...f, status: 'resolved', resolvedAt: new Date() } : f
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      case 'offline': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4" />;
      case 'acknowledged': return <Eye className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'false_positive': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredFaults = faults.filter(fault => {
    const severityMatch = filterSeverity === 'all' || fault.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || fault.status === filterStatus;
    const modelMatch = !selectedModel || fault.modelId === selectedModel.id;
    return severityMatch && statusMatch && modelMatch;
  });

  const chartData = statistics ? [
    { name: 'Healthy', value: statistics.healthyModels, color: '#10B981' },
    { name: 'Warning', value: statistics.modelsWithWarnings, color: '#F59E0B' },
    { name: 'Critical', value: statistics.criticalModels, color: '#EF4444' },
    { name: 'Offline', value: statistics.offlineModels, color: '#6B7280' }
  ] : [];

  const faultTrendData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    faults: Math.floor(Math.random() * 10),
    resolved: Math.floor(Math.random() * 8)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-white">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading fault detection data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Fault Detection & Diagnostics
            </h1>
            <p className="text-slate-400">
              Real-time monitoring and analysis across all models
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Models</p>
                  <p className="text-2xl font-bold text-white">{statistics.totalModels}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <div className="mt-4 flex items-center space-x-2 text-sm">
                <span className="text-green-400">
                  {statistics.healthyModels} healthy
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-red-400">
                  {statistics.criticalModels} critical
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Faults</p>
                  <p className="text-2xl font-bold text-red-400">{statistics.activeFaults}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="mt-4 flex items-center space-x-2 text-sm">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-slate-400">
                  {statistics.totalFaults} total detected
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">MTTR</p>
                  <p className="text-2xl font-bold text-yellow-400">{statistics.mttr}h</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="mt-4 flex items-center space-x-2 text-sm">
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-slate-400">
                  Avg resolution time
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">MTBF</p>
                  <p className="text-2xl font-bold text-green-400">{statistics.mtbf}h</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
              <div className="mt-4 flex items-center space-x-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-slate-400">
                  Mean time between failures
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Health Distribution */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Model Health Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fault Trend */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">24-Hour Fault Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={faultTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="faults"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters and Fault List */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Active Faults</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredFaults.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>No faults match the current filters</p>
              </div>
            ) : (
              filteredFaults.map((fault) => (
                <div
                  key={fault.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-slate-700/30 ${getSeverityColor(fault.severity)}`}
                  onClick={() => {
                    setSelectedFault(fault);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(fault.status)}
                        <h4 className="font-semibold">{fault.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(fault.severity)}`}>
                          {fault.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{fault.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>Model: {models.find(m => m.id === fault.modelId)?.name || fault.modelId}</span>
                        <span>•</span>
                        <span>{new Date(fault.detectedAt).toLocaleString()}</span>
                        {fault.resolvedAt && (
                          <>
                            <span>•</span>
                            <span>Resolved: {new Date(fault.resolvedAt).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {fault.status === 'active' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledgeFault(fault.id);
                          }}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveFault(fault.id);
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fault Diagnostic Modal */}
      <FaultDiagnosticModal
        fault={selectedFault}
        model={selectedFault ? models.find(m => m.id === selectedFault.modelId) || null : null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFault(null);
        }}
        onAcknowledge={handleAcknowledgeFault}
        onResolve={handleResolveFault}
      />
    </div>
  );
};
