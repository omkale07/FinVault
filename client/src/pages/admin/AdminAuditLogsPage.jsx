import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Input from '../../components/ui/Input';
import { Activity } from 'lucide-react';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', entityType: '' });
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  useEffect(() => {
    fetchLogs();
  }, [page, filters.action, filters.entityType]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAuditLogs({
        page,
        limit,
        action: filters.action,
        entityType: filters.entityType,
      });
      setLogs(response.data.logs || []);
      const returnedCount = response.data.logs?.length || 0;
      setHasMore(returnedCount === limit);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">System Audit Logs</h1>
      
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Filter by action..."
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="sm:w-64"
          />
          <Input
            placeholder="Filter by entity type..."
            value={filters.entityType}
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
            className="sm:w-64"
          />
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchLogs} />
        ) : logs.length === 0 ? (
          <EmptyState icon={Activity} title="No audit logs found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID</th>
                  <th className="px-4 py-3">Actor / User ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Target / Entity ID</th>
                  <th className="px-4 py-3 rounded-tr-lg">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/25">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.id}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.user_id || log.actor_id || log.userId}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{log.action}</td>
                    <td className="px-4 py-3">{log.entity_type || log.entityType}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.entity_id || log.target_id || log.entityId}</td>
                    <td className="px-4 py-3">{format(new Date(log.created_at || log.createdAt), 'PPpp')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !error && (page > 1 || hasMore) && (
          <div className="mt-6 flex justify-between items-center px-4 py-3 border-t border-slate-700 bg-slate-800/30 rounded-b-lg">
            <span className="text-sm text-slate-400">Page {page}</span>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-sm transition-colors border border-slate-600"
              >
                Previous
              </button>
              <button 
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-sm transition-colors border border-slate-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
