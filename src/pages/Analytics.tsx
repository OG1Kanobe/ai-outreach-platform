import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const stats = useQuery(api.leads.stats);

  if (!stats) {
    return <div className="p-8">Loading...</div>;
  }

  const funnelData = [
    { stage: 'Leads', value: stats.totalLeads, color: '#3b82f6' },
    { stage: 'Emails Sent', value: stats.emailsSent, color: '#06b6d4' },
    { stage: 'Opened', value: Math.round(stats.emailsSent * (stats.openRate / 100)), color: '#8b5cf6' },
    { stage: 'Replied', value: Math.round(stats.emailsSent * (stats.replyRate / 100)), color: '#10b981' },
  ];

  const serviceData = [
    { name: 'AI Services', value: stats.ai.leads, color: '#3b82f6' },
    { name: 'Web Design', value: stats.webDesign.leads, color: '#06b6d4' },
  ];

  // Mock time series data (you'd get this from real tracking)
  const timeSeriesData = [
    { date: 'Week 1', openRate: 24, replyRate: 5 },
    { date: 'Week 2', openRate: 28, replyRate: 6 },
    { date: 'Week 3', openRate: 31, replyRate: 7 },
    { date: 'Week 4', openRate: stats.openRate, replyRate: stats.replyRate },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>

      {/* Overview metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="text-sm text-text-secondary mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold">
            {stats.totalLeads > 0 ? ((stats.emailsSent / stats.totalLeads) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-text-secondary mb-1">Avg Open Rate</div>
          <div className="text-3xl font-bold">{stats.openRate.toFixed(1)}%</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-text-secondary mb-1">Avg Reply Rate</div>
          <div className="text-3xl font-bold">{stats.replyRate.toFixed(1)}%</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-text-secondary mb-1">Total Replies</div>
          <div className="text-3xl font-bold">
            {Math.round(stats.emailsSent * (stats.replyRate / 100))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Funnel chart */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6">Outreach Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="stage" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e1e', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service type pie chart */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6">Leads by Service Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e1e', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance over time */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6">Performance Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#a3a3a3" />
            <YAxis stroke="#a3a3a3" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e1e1e', 
                border: '1px solid #333',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="openRate" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Open Rate (%)"
            />
            <Line 
              type="monotone" 
              dataKey="replyRate" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="Reply Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
