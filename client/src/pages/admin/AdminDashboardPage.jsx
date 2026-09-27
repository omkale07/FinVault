import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { Users, Wallet, ArrowLeftRight, Activity } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminDashboardPage = () => {
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await adminService.getAuditLogs({ page: 1, limit: 5 });
        setRecentLogs(response.data.logs || []);
      } catch (err) {
        console.error('Failed to fetch recent audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentActivity();
  }, []);

  const navCards = [
    { title: 'Users', path: '/admin/users', icon: Users, description: 'Manage user accounts', color: 'text-blue-400' },
    { title: 'Wallets', path: '/admin/wallets', icon: Wallet, description: 'View all wallets', color: 'text-emerald-400' },
    { title: 'Transactions', path: '/admin/transactions', icon: ArrowLeftRight, description: 'Monitor transactions', color: 'text-amber-400' },
    { title: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, description: 'Review system activity', color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {navCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.path}>
              <Card className="h-full hover:bg-slate-800/80 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center p-4 text-center space-y-4">
                  <div className={`p-4 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors ${card.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-200">{card.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{card.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card header={<h2 className="text-lg font-medium text-slate-100">Recent Audit Activity</h2>}>
        {loading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400">No recent activity</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/25">
                    <td className="px-4 py-3 font-medium text-slate-200">{log.action}</td>
                    <td className="px-4 py-3">{log.actor_id || log.userId}</td>
                    <td className="px-4 py-3">{log.target_id || log.entityId}</td>
                    <td className="px-4 py-3 text-right">{format(new Date(log.created_at || log.createdAt), 'PPpp')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
