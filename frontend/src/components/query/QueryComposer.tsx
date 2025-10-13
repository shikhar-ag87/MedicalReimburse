import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { queryService } from '../../services/queryService';

interface QueryComposerProps {
  applicationId: string;
  applicationNumber: string;
  employeeName: string;
  employeeEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QueryComposer({
  applicationId,
  applicationNumber,
  employeeName,
  employeeEmail,
  onClose,
  onSuccess,
}: QueryComposerProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await queryService.createQuery({
        applicationId,
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      console.log('Query created:', result);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating query:', err);
      setError(err.message || 'Failed to send query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600' },
    { value: 'normal', label: 'Normal Priority', color: 'text-blue-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Send Query to Employee</h2>
            <p className="text-sm text-gray-500 mt-1">Create a new query for this application</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Application Info */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Application Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Application Number:</span>
                <p className="text-blue-900 font-semibold">{applicationNumber}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Employee Name:</span>
                <p className="text-blue-900">{employeeName}</p>
              </div>
              {employeeEmail && (
                <div className="col-span-2">
                  <span className="text-blue-700 font-medium">Email:</span>
                  <p className="text-blue-900">{employeeEmail}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Need Additional Medical Documents"
              required
              maxLength={200}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">{subject.length}/200 characters</p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what information or documents you need from the employee..."
              required
              rows={8}
              maxLength={2000}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/2000 characters</p>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value as any)}
                  disabled={loading}
                  className={`
                    px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all
                    ${priority === option.value
                      ? 'border-blue-500 bg-blue-50 ' + option.color
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">What happens next?</p>
              <ul className="text-yellow-800 space-y-1 list-disc list-inside">
                <li>Employee will receive an email notification with a secure link</li>
                <li>They can view and respond without logging in</li>
                <li>You'll be notified when they reply</li>
                <li>The link remains valid for 30 days</li>
              </ul>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim() || !message.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
