import { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { queryService, Query } from '../../services/queryService';
import QueryThread from './QueryThread';

interface QueryListProps {
  applicationId?: string;
  showFilters?: boolean;
}

export default function QueryList({ applicationId, showFilters = true }: QueryListProps) {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  useEffect(() => {
    loadQueries();
  }, [applicationId, statusFilter, priorityFilter]);

  const loadQueries = async () => {
    try {
      setLoading(true);
      setError('');

      let fetchedQueries: Query[];
      if (applicationId) {
        fetchedQueries = await queryService.getQueriesForApplication(applicationId);
      } else {
        const filters: any = {};
        if (statusFilter !== 'all') filters.status = statusFilter;
        if (priorityFilter !== 'all') filters.priority = priorityFilter;
        fetchedQueries = await queryService.getAllQueries(filters);
      }

      setQueries(fetchedQueries);
    } catch (err: any) {
      setError(err.message || 'Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'open':
        return <AlertCircle size={20} className="text-yellow-600" />;
      case 'user_replied':
        return <MessageSquare size={20} className="text-blue-600" />;
      case 'admin_replied':
        return <MessageSquare size={20} className="text-purple-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
      user_replied: { label: 'User Replied', color: 'bg-blue-100 text-blue-800' },
      admin_replied: { label: 'Admin Replied', color: 'bg-purple-100 text-purple-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[status] || badges.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500';
      case 'high':
        return 'border-l-4 border-l-orange-500';
      case 'normal':
        return 'border-l-4 border-l-blue-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  };

  const filteredQueries = queries.filter((query) => {
    const matchesSearch =
      searchTerm === '' ||
      query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.medical_applications?.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.medical_applications?.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by subject, application, or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="user_replied">User Replied</option>
                <option value="admin_replied">Admin Replied</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="urgent">🔥 Urgent</option>
                <option value="high">⚠️ High</option>
                <option value="normal">ℹ️ Normal</option>
                <option value="low">✅ Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Query List */}
      {filteredQueries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No queries found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Try adjusting your search or filters'
              : applicationId
              ? 'No queries for this application yet'
              : 'No queries have been created yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map((query) => (
            <div
              key={query.id}
              onClick={() => setSelectedQuery(query.id)}
              className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(
                query.priority
              )}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">{getStatusIcon(query.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{query.subject}</h3>
                        {query.priority === 'urgent' && <span className="text-red-500">🔥</span>}
                        {query.priority === 'high' && <span className="text-orange-500">⚠️</span>}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {!applicationId && (
                          <p>
                            <span className="font-medium">Application:</span> {query.medical_applications?.application_number || 'N/A'} •{' '}
                            <span className="font-medium">Employee:</span> {query.medical_applications?.employee_name || 'N/A'}
                          </p>
                        )}
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            {query.total_messages || 0} {query.total_messages === 1 ? 'message' : 'messages'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(query.last_message_at || query.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(query.status)}
                    {query.unread_by_admin && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Query Thread Modal */}
      {selectedQuery && (
        <QueryThread
          queryId={selectedQuery}
          onClose={() => setSelectedQuery(null)}
          onResolved={() => {
            setSelectedQuery(null);
            loadQueries();
          }}
        />
      )}
    </div>
  );
}
