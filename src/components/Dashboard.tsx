import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';
import { DigitalTwinModel } from '../types';
import { palette, responsive } from '../styles/palette';

interface DashboardProps {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ models, selectedModel }) => {
  // Mock data for predictive analytics
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 62, gpu: 38 },
    { time: '04:00', cpu: 52, memory: 68, gpu: 45 },
    { time: '08:00', cpu: 78, memory: 85, gpu: 72 },
    { time: '12:00', cpu: 85, memory: 92, gpu: 88 },
    { time: '16:00', cpu: 72, memory: 78, gpu: 65 },
    { time: '20:00', cpu: 58, memory: 64, gpu: 52 },
  ];

  const modelComplexityData = [
    { name: 'Low', value: 30, color: '#10B981' },
    { name: 'Medium', value: 45, color: '#F59E0B' },
    { name: 'High', value: 25, color: '#EF4444' },
  ];

  const predictiveMetrics = [
    {
      title: 'Rendering Performance',
      value: '94.2%',
      change: '+2.4%',
      trend: 'up',
      icon: Zap,
      color: 'text-green-400'
    },
    {
      title: 'Memory Usage',
      value: '68%',
      change: '-5.1%',
      trend: 'down',
      icon: Database,
      color: 'text-blue-400'
    },
    {
      title: 'Load Time',
      value: '2.3s',
      change: '-0.8s',
      trend: 'down',
      icon: Clock,
      color: 'text-teal-400'
    },
    {
      title: 'System Health',
      value: '99.8%',
      change: '+0.2%',
      trend: 'up',
      icon: Activity,
      color: 'text-green-400'
    }
  ];

  const alerts = [
    {
      type: 'warning',
      message: 'High polygon count detected in model #3',
      time: '2 minutes ago',
      icon: AlertTriangle
    },
    {
      type: 'success',
      message: 'Optimization completed for building_model.gltf',
      time: '15 minutes ago',
      icon: CheckCircle
    },
    {
      type: 'info',
      message: 'New rendering engine update available',
      time: '1 hour ago',
      icon: Activity
    }
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Predictive Analytics Dashboard
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Real-time insights and performance monitoring</p>
        </div>
        <div className="text-right">
          <div className="text-xl md:text-2xl font-bold text-white">{models.length}</div>
          <div className="text-xs md:text-sm text-slate-400">Active Models</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {predictiveMetrics.map((metric, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${
                metric.color.includes('green') ? 'from-green-500/20 to-emerald-500/20' :
                metric.color.includes('blue') ? 'from-blue-500/20 to-cyan-500/20' :
                metric.color.includes('teal') ? 'from-teal-500/20 to-blue-500/20' :
                'from-purple-500/20 to-pink-500/20'
              }`}>
                <metric.icon className={`w-4 h-4 md:w-5 md:h-5 ${metric.color}`} />
              </div>
              <div className={`flex items-center space-x-1 text-xs md:text-sm ${
                metric.trend === 'up' ? 'text-green-400' : 'text-blue-400'
              }`}>
                <TrendingUp className={`w-3 h-3 md:w-4 md:h-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                <span>{metric.change}</span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-xs md:text-sm text-slate-400">{metric.title}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Performance Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4">System Performance</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="gpu" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Complexity */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Model Complexity Distribution</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelComplexityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fontSize: '12px', fill: '#FFF' }}
                >
                  {modelComplexityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Alerts */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4">System Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <div className={`p-1 rounded-full flex-shrink-0 ${
                  alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  alert.type === 'success' ? 'bg-green-500/20 text-green-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  <alert.icon className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{alert.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Statistics */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Model Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 text-sm md:text-base">Total Models</span>
              <span className="text-white font-semibold">{models.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 text-sm md:text-base">Average Size</span>
              <span className="text-white font-semibold">
                {models.length > 0 
                  ? `${(models.reduce((acc, m) => acc + m.size, 0) / models.length / 1024 / 1024).toFixed(1)} MB`
                  : '0 MB'
                }
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 text-sm md:text-base">GLTF Models</span>
              <span className="text-white font-semibold">
                {models.filter(m => m.type === 'gltf').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-400 text-sm md:text-base">BIM Models</span>
              <span className="text-white font-semibold">
                {models.filter(m => m.type === 'bim').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};