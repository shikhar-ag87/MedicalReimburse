import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, RotateCcw, FileText, Download, User, Shield } from 'lucide-react';
import { queryService, QueryDetails, QueryMessage } from '../../services/queryService';

interface QueryThreadProps {
  queryId: string;
  onClose: () => void;
  onResolved?: () => void;
}

export default function QueryThread({ queryId, onClose, onResolved }: QueryThreadProps) {
  const [queryDetails, setQueryDetails] = useState<QueryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQueryDetails();
  }, [queryId]);

  const loadQueryDetails = async () => {
    try {
      setLoading(true);
      const details = await queryService.getQueryDetails(queryId);
      setQueryDetails(details);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load query details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    setError('');

    try {
      await queryService.replyToQuery(queryId, replyText.trim(), isInternalNote);
      setReplyText('');
      setIsInternalNote(false);
      await loadQueryDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm('Mark this query as resolved?')) return;

    setResolving(true);
    try {
      await queryService.resolveQuery(queryId);
      onResolved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve query');
    } finally {
      setResolving(false);
    }
  };

  const handleReopen = async () => {
    setResolving(true);
    try {
      await queryService.reopenQuery(queryId);
      await loadQueryDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen query');
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      low: { label: 'Low', color: 'bg-green-100 text-green-800' },
      normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[priority] || badges.normal;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        🔥 {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!queryDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Failed to load query'}</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const { query, messages, attachments } = queryDetails;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{query.subject}</h2>
              {getStatusBadge(query.status)}
              {getPriorityBadge(query.priority)}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Application:</span>{' '}
                {query.medical_applications?.application_number || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Employee:</span>{' '}
                {query.medical_applications?.employee_name || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Created:</span> {formatDate(query.created_at)}
              </p>
              <p>
                <span className="font-medium">Messages:</span> {query.total_messages}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No messages yet</div>
          ) : (
            messages.map((msg: QueryMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.is_internal_note
                      ? 'bg-yellow-50 border-2 border-yellow-300'
                      : msg.sender_type === 'admin'
                      ? 'bg-white border border-gray-200'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg.sender_type === 'admin' ? (
                      <Shield size={16} className="text-blue-600" />
                    ) : (
                      <User size={16} />
                    )}
                    <span className="font-semibold text-sm">{msg.sender_name}</span>
                    {msg.sender_role && (
                      <span className="text-xs opacity-75">({msg.sender_role})</span>
                    )}
                    {msg.is_internal_note && (
                      <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                        Internal Note
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className="text-xs opacity-75 mt-2">{formatDate(msg.created_at)}</p>
                </div>
              </div>
            ))
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={18} />
                Attachments ({attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 bg-white border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <FileText className="text-blue-600 flex-shrink-0" size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{att.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {(att.file_size / 1024).toFixed(1)} KB • {att.uploaded_by}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 flex-shrink-0">
                      <Download size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {query.status !== 'resolved' && (
          <div className="border-t p-6 bg-white">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}
            <form onSubmit={handleSendReply} className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-700">Internal Note</span>
                  <span className="text-gray-500">(Not visible to employee)</span>
                </label>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isInternalNote ? 'Add an internal note...' : 'Type your reply...'}
                  rows={3}
                  disabled={sendingReply}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
                >
                  {sendingReply ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Actions */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
          >
            Close
          </button>
          <div className="flex gap-3">
            {query.status === 'resolved' ? (
              <button
                onClick={handleReopen}
                disabled={resolving}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw size={18} />
                Reopen Query
              </button>
            ) : (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
