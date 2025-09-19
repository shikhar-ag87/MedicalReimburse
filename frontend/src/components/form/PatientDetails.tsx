import React from 'react';
import FormSection from './FormSection';

interface PatientDetailsProps {
  data: any;
  updateData: (section: string, data: any) => void;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ data, updateData }) => {
  const handleChange = (field: string, value: string) => {
    updateData('patient', {
      ...data.patient,
      [field]: value
    });
  };

  return (
    <FormSection title="Patient Details" subtitle="रोगी विवरण">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name of Patient *<br />
            <span className="text-sm text-gray-500">रोगी का नाम</span>
          </label>
          <input
            type="text"
            value={data.patient?.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship with Employee *<br />
            <span className="text-sm text-gray-500">कर्मचारी से संबंध</span>
          </label>
          <select
            value={data.patient?.relationship || ''}
            onChange={(e) => handleChange('relationship', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Relationship</option>
            <option value="Self">Self / स्वयं</option>
            <option value="Spouse">Spouse / पति/पत्नी</option>
            <option value="Child">Child / संतान</option>
            <option value="Parent">Parent / माता-पिता</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CGHS Card No. of Patient (if different from employee)<br />
            <span className="text-sm text-gray-500">रोगी का सीजीएचएस कार्ड नंबर (यदि कर्मचारी से भिन्न है)</span>
          </label>
          <input
            type="text"
            value={data.patient?.cghsCardNumber || ''}
            onChange={(e) => handleChange('cghsCardNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </FormSection>
  );
};

export default PatientDetails;