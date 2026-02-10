import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Users, Mail, Eye, MessageSquare, TrendingUp, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const stats = useQuery(api.leads.stats);

  if (!stats) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-secondary rounded w-48" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'blue',
      trend: '+12%',
    },
    {
      label: 'Emails Sent',
      value: stats.emailsSent,
      icon: Mail,
      color: 'cyan',
      trend: '+8%',
    },
    {
      label: 'Open Rate',
      value: `${stats.openRate.toFixed(1)}%`,
      icon: Eye,
      color: 'purple',
      trend: '+3.2%',
    },
    {
      label: 'Reply Rate',
      value: `${stats.replyRate.toFixed(1)}%`,
      icon: MessageSquare,
      color: 'green',
      trend: '+1.5%',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary">Welcome back! Here's your outreach overview.</p>
      </div>

      {/* Stats grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 gap-6 mb-8"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClass = {
            blue: 'from-accent-blue/20 to-accent-blue/5 border-accent-blue/30',
            cyan: 'from-accent-cyan/20 to-accent-cyan/5 border-accent-cyan/30',
            purple: 'from-accent-purple/20 to-accent-purple/5 border-accent-purple/30',
            green: 'from-accent-green/20 to-accent-green/5 border-accent-green/30',
          }[stat.color];

          return (
            <motion.div key={stat.label} variants={item}>
              <div className={`glass-card p-6 bg-gradient-to-br ${colorClass}`}>
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-8 h-8 text-text-secondary" />
                  <div className="flex items-center gap-1 text-accent-green text-sm">
                    <TrendingUp className="w-4 h-4" />
                    {stat.trend}
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Service type breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-blue" />
            AI Services
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Leads</span>
              <span className="font-medium">{stats.ai.leads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Emails Sent</span>
              <span className="font-medium">{stats.ai.sent}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-cyan" />
            Web Design
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Leads</span>
              <span className="font-medium">{stats.webDesign.leads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Emails Sent</span>
              <span className="font-medium">{stats.webDesign.sent}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/leads">
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Leads
            </button>
          </Link>
          <Link to="/emails">
            <button className="btn-secondary w-full">
              Review Emails
            </button>
          </Link>
          <Link to="/analytics">
            <button className="btn-secondary w-full">
              View Analytics
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
