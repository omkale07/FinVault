import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/audit.service';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import { Activity } from 'lucide-react';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', entityType: '' });
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, filters.action, filters.entityType]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await auditService.getLogs({
        page,
        limit,
        action: filters.action,
        entity_type: filters.entityType,
      });
      const data = response.data;
      setLogs(data.auditLogs || []);
      setTotalPages(Math.ceil((data.count || 0) / limit));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
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
      <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
      
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
          <EmptyState icon={Activity} title="No audit logs found" description="There are no audit logs matching your criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 rounded-tr-lg">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/25">
                    <td className="px-4 py-3 font-medium text-slate-200">{log.action || log.Action}</td>
                    <td className="px-4 py-3">{log.entity_type || log.entityType}</td>
                    <td className="px-4 py-3">
                      <pre className="text-xs bg-slate-900/50 p-2 rounded border border-slate-700/50 max-w-xs overflow-x-auto">
                        {JSON.stringify(log.metadata || {}, null, 2)}
                      </pre>
                    </td>
                    <td className="px-4 py-3">{format(new Date(log.created_at || log.createdAt), 'PPpp')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !error && logs.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogPage;
