import React from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Share
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { DetectedFault, DigitalTwinModel } from '../types';

interface FaultDiagnosticModalProps {
  fault: DetectedFault | null;
  model: DigitalTwinModel | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (faultId: string) => void;
  onResolve: (faultId: string) => void;
}

export const FaultDiagnosticModal: React.FC<FaultDiagnosticModalProps> = ({
  fault,
  model,
  isOpen,
  onClose,
  onAcknowledge,
  onResolve
}) => {
  if (!isOpen || !fault) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getFaultTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="w-5 h-5" />;
      case 'structural': return <Activity className="w-5 h-5" />;
      case 'environmental': return <TrendingUp className="w-5 h-5" />;
      case 'connectivity': return <Activity className="w-5 h-5" />;
      case 'data_quality': return <Activity className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  // Generate mock trend data for visualization
  const trendData = Object.entries(fault.diagnosticData.trends).map(([key, values]) => ({
    parameter: key,
    data: values.slice(-20).map((value, index) => ({
      time: `${index}m`,
      value: value
    }))
  }));

  const correlationData = fault.diagnosticData.correlations.map(corr => ({
    parameter: corr.parameter,
    correlation: Math.abs(corr.correlation) * 100,
    significance: corr.significance
  }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${getSeverityColor(fault.severity)}`}>
              {getFaultTypeIcon(fault.faultType)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{fault.title}</h2>
              <p className="text-slate-400">
                {model?.name || fault.modelId} • {fault.faultType.replace('_', ' ')} fault
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Share className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fault Overview */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Fault Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Severity</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(fault.severity)}`}>
                      {fault.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Status</p>
                    <p className="text-white font-medium capitalize">{fault.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Detected At</p>
                    <p className="text-white font-medium">
                      {new Date(fault.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  {fault.resolvedAt && (
                    <div>
                      <p className="text-slate-400 text-sm">Resolved At</p>
                      <p className="text-white font-medium">
                        {new Date(fault.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-white">{fault.description}</p>
                </div>
                {fault.coordinates && (
                  <div className="mt-4 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">
                      Location: {fault.coordinates.latitude.toFixed(6)}, {fault.coordinates.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>

              {/* Trend Analysis */}
              {trendData.length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Parameter Trends</h3>
                  <div className="space-y-4">
                    {trendData.slice(0, 2).map((trend, index) => (
                      <div key={index}>
                        <h4 className="text-white font-medium mb-2 capitalize">
                          {trend.parameter} Trend
                        </h4>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend.data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="time" stroke="#64748b" />
                              <YAxis stroke="#64748b" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1e293b',
                                  border: '1px solid #334155',
                                  borderRadius: '8px',
                                  color: '#fff'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correlation Analysis */}
              {correlationData.length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Parameter Correlations</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={correlationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="parameter" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="correlation" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              {fault.status === 'active' && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => onAcknowledge(fault.id)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Acknowledge</span>
                    </button>
                    <button
                      onClick={() => onResolve(fault.id)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Affected Components */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Affected Components</h3>
                <div className="space-y-2">
                  {fault.affectedComponents.map((component, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-white capitalize">{component}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Recommended Actions</h3>
                <div className="space-y-2">
                  {fault.recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-300 text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause Analysis */}
              {fault.diagnosticData.rootCauseAnalysis && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Root Cause Analysis</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-sm">Primary Cause</p>
                      <p className="text-white text-sm">
                        {fault.diagnosticData.rootCauseAnalysis.primaryCause}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Confidence</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{
                              width: `${fault.diagnosticData.rootCauseAnalysis.confidence * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-white text-sm">
                          {Math.round(fault.diagnosticData.rootCauseAnalysis.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
