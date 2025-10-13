import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, FileText, Upload, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react';
import { queryService, QueryDetails, QueryMessage } from '../services/queryService';

export default function PublicQueryResponse() {
  const { token } = useParams<{ token: string }>();
  const [queryDetails, setQueryDetails] = useState<QueryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (token) {
      loadQueryDetails();
    }
  }, [token]);

  const loadQueryDetails = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const details = await queryService.getQueryByToken(token);
      setQueryDetails(details);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load query. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !token) return;

    setSendingReply(true);
    setError('');

    try {
      await queryService.replyToQueryPublic(token, replyText.trim(), 'Employee Name');
      setReplyText('');
      await loadQueryDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF, JPG, PNG, DOC, and DOCX files are allowed');
      return;
    }

    setUploadingFile(true);
    setUploadError('');

    try {
      await queryService.uploadAttachmentPublic(token, file, 'Employee Name');
      await loadQueryDetails();
      // Reset file input
      e.target.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4 text-lg">Loading query...</p>
        </div>
      </div>
    );
  }

  if (error || !queryDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Access Query</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The link may be invalid or expired. Please contact your admin for a new link.'}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
            <p className="font-semibold text-blue-900 mb-2">Need help?</p>
            <p className="text-blue-800">
              Contact your OBC or Health Centre administrator to get a new access link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { query, messages, attachments } = queryDetails;
  const isResolved = query.status === 'resolved' || query.status === 'closed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{query.subject}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isResolved
                      ? 'bg-green-100 text-green-800'
                      : query.status === 'user_replied'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {isResolved ? (
                    <>
                      <CheckCircle size={16} className="inline mr-1" />
                      Resolved
                    </>
                  ) : (
                    <>
                      <Clock size={16} className="inline mr-1" />
                      Active
                    </>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  Application: {query.medical_applications?.application_number || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {isResolved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <CheckCircle size={16} className="inline mr-2" />
                This query has been marked as resolved. You can still view the conversation below.
              </p>
            </div>
          )}

          {!isResolved && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                <AlertCircle size={16} className="inline mr-2" />
                Use this page to respond to the admin's query. You can send messages and upload supporting
                documents.
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={24} />
            Conversation ({messages.length})
          </h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages
              .filter((msg: QueryMessage) => !msg.is_internal_note)
              .map((msg: QueryMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-4 ${
                      msg.sender_type === 'admin'
                        ? 'bg-gray-100 border border-gray-200'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {msg.sender_type === 'admin' ? msg.sender_name : 'You'}
                      </span>
                      {msg.sender_role && msg.sender_type === 'admin' && (
                        <span className="text-xs opacity-75">({msg.sender_role})</span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-2 ${
                        msg.sender_type === 'admin' ? 'text-gray-600' : 'text-blue-100'
                      }`}
                    >
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={24} />
              Attachments ({attachments.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3 hover:bg-gray-100 transition-colors"
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

        {/* Reply Form */}
        {!isResolved && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Response</h2>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}
            {uploadError && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                {uploadError}
              </div>
            )}

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="mb-6">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                rows={4}
                disabled={sendingReply}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 mb-3"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingReply ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Reply
                  </>
                )}
              </button>
            </form>

            {/* File Upload */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Upload size={20} />
                Upload Supporting Documents
              </h3>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-2">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
              {uploadingFile && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  Uploading file...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>Medical Reimbursement System • Query #{query.id.slice(0, 8)}</p>
          <p className="mt-1">
            This is a secure link. Do not share it with others. Valid until{' '}
            {new Date(query.token_expires_at).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
