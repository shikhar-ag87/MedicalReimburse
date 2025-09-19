import React from 'react';
import { CheckCircle, Download, Search, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  trackingId: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, trackingId, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate and download a PDF
    alert('PDF download functionality would be implemented here');
  };

  const handleTrackStatus = () => {
    window.location.href = '/status';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Claim Submitted Successfully!
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              दावा सफलतापूर्वक जमा किया गया!
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Your Tracking ID / आपका ट्रैकिंग आईडी:
              </p>
              <p className="text-lg font-mono font-bold text-blue-800 bg-white px-3 py-2 rounded border">
                {trackingId}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Please save this ID to track your claim status
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Download Claim Copy (PDF)</span>
              </button>
              
              <button
                onClick={handleTrackStatus}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <Search className="w-4 h-4" />
                <span>Track Status</span>
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              You will receive email/SMS updates at each stage of processing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;