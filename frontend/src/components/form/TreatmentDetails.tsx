import React from 'react';
import FormSection from './FormSection';
import { Upload } from 'lucide-react';

interface TreatmentDetailsProps {
  data: any;
  updateData: (section: string, data: any) => void;
}

const TreatmentDetails: React.FC<TreatmentDetailsProps> = ({ data, updateData }) => {
  const handleChange = (field: string, value: string | boolean) => {
    updateData('treatment', {
      ...data.treatment,
      [field]: value
    });
  };

  return (
    <FormSection title="Treatment Details" subtitle="उपचार विवरण">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name & Address of Hospital/Diagnostic Centre *<br />
            <span className="text-sm text-gray-500">अस्पताल/डायग्नोस्टिक केंद्र का नाम और पता</span>
          </label>
          <textarea
            value={data.treatment?.hospitalDetails || ''}
            onChange={(e) => handleChange('hospitalDetails', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Was prior permission/referral taken? *<br />
              <span className="text-sm text-gray-500">क्या पूर्व अनुमति/रेफरल लिया गया था?</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priorPermission"
                  value="yes"
                  checked={data.treatment?.priorPermission === 'yes'}
                  onChange={(e) => handleChange('priorPermission', e.target.value)}
                  className="mr-2"
                />
                Yes / हाँ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priorPermission"
                  value="no"
                  checked={data.treatment?.priorPermission === 'no'}
                  onChange={(e) => handleChange('priorPermission', e.target.value)}
                  className="mr-2"
                />
                No / नहीं
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Was treatment taken in emergency? *<br />
              <span className="text-sm text-gray-500">क्या आपातकालीन स्थिति में उपचार लिया गया?</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="emergency"
                  value="yes"
                  checked={data.treatment?.emergency === 'yes'}
                  onChange={(e) => handleChange('emergency', e.target.value)}
                  className="mr-2"
                />
                Yes / हाँ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="emergency"
                  value="no"
                  checked={data.treatment?.emergency === 'no'}
                  onChange={(e) => handleChange('emergency', e.target.value)}
                  className="mr-2"
                />
                No / नहीं
              </label>
            </div>
          </div>
        </div>

        {data.treatment?.priorPermission === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Permission/Referral Letter<br />
              <span className="text-sm text-gray-500">अनुमति/रेफरल पत्र अपलोड करें</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
          </div>
        )}

        {data.treatment?.emergency === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Emergency Certificate<br />
              <span className="text-sm text-gray-500">आपातकालीन प्रमाणपत्र अपलोड करें</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Health Insurance Details (if any)<br />
            <span className="text-sm text-gray-500">स्वास्थ्य बीमा विवरण (यदि कोई हो)</span>
          </label>
          <textarea
            value={data.treatment?.insuranceDetails || ''}
            onChange={(e) => handleChange('insuranceDetails', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Insurance company name, policy number, etc."
          />
        </div>
      </div>
    </FormSection>
  );
};

export default TreatmentDetails;