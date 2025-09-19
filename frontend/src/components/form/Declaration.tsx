import React, { useState } from 'react';
import FormSection from './FormSection';
import { FileSignature } from 'lucide-react';

interface DeclarationProps {
  data: any;
  updateData: (section: string, data: any) => void;
}

const Declaration: React.FC<DeclarationProps> = ({ data, updateData }) => {
  const [agreed, setAgreed] = useState(data.declaration?.agreed || false);
  const [signature, setSignature] = useState(data.declaration?.signature || '');
  const [place, setPlace] = useState(data.declaration?.place || 'New Delhi');
  const [date, setDate] = useState(data.declaration?.date || new Date().toISOString().split('T')[0]);

  const handleChange = (field: string, value: string | boolean) => {
    const updatedDeclaration = {
      ...data.declaration,
      [field]: value
    };
    updateData('declaration', updatedDeclaration);

    if (field === 'agreed') setAgreed(value as boolean);
    if (field === 'signature') setSignature(value as string);
    if (field === 'place') setPlace(value as string);
    if (field === 'date') setDate(value as string);
  };

  const declarationText = `
मैं यह घोषणा करता हूं / करती हूं कि ऊपर दिए गए चिकित्सा व्यय / दावे मेरे परिवार के सदस्य / अपने लिए वास्तविक हैं। मैं यह भी घोषणा करता हूं / करती हूं कि मैंने इस के लिए कहीं और से कोई प्रतिपूर्ति नहीं ली है और न ही मैं कोई स्वास्थ्य बीमा योजना से किसी प्रकार की प्रतिपूर्ति का हकदार हूं। यदि कोई भी तथ्य गलत पाया जाता है, तो इस रूप में प्रतिपूर्ति की गई राशि वापस कर दी जाएगी और मैं अनुशासनात्मक कार्रवाई के लिए उत्तरदायी होऊंगा / होऊंगी।

I declare that the above medical expenses/claims are genuine for my family member/myself. I also declare that I have not taken any reimbursement elsewhere for this and neither am I entitled to any form of reimbursement from any health insurance scheme. If any fact is found to be wrong, the amount reimbursed will be refunded and I shall be liable for disciplinary action.
  `;

  return (
    <FormSection title="Declaration and Signature" subtitle="घोषणा और हस्ताक्षर">
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Declaration / घोषणा</h4>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {declarationText}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="declaration-agreement"
            checked={agreed}
            onChange={(e) => handleChange('agreed', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="declaration-agreement" className="text-sm text-gray-700">
            I hereby agree to the above declaration and confirm that all information provided is true and accurate.
            <br />
            <span className="text-sm text-gray-500">
              मैं उपरोक्त घोषणा से सहमत हूं और पुष्टि करता हूं कि प्रदान की गई सभी जानकारी सत्य और सटीक है।
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Place / स्थान *
            </label>
            <input
              type="text"
              value={place}
              onChange={(e) => handleChange('place', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date / दिनांक *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature (Type Full Name) / हस्ताक्षर (पूरा नाम टाइप करें) *
            </label>
            <div className="relative">
              <FileSignature className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={signature}
                onChange={(e) => handleChange('signature', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your full name"
                required
              />
            </div>
          </div>
        </div>

        {signature && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Digital Signature Preview:</strong> {signature}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This will be considered as your digital signature for this claim.
            </p>
          </div>
        )}
      </div>
    </FormSection>
  );
};

export default Declaration;