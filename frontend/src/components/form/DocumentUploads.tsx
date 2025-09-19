import React, { useState } from 'react';
import FormSection from './FormSection';
import { Upload, File, X } from 'lucide-react';

interface DocumentUploadsProps {
  data: any;
  updateData: (section: string, data: any) => void;
}

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
}

const DocumentUploads: React.FC<DocumentUploadsProps> = ({ data, updateData }) => {
  const [documents, setDocuments] = useState<Document[]>(data.documents || []);

  const documentCategories = [
    { value: 'bills', label: 'Medical Bills / मेडिकल बिल' },
    { value: 'prescriptions', label: 'Prescriptions / प्रिस्क्रिप्शन' },
    { value: 'reports', label: 'Medical Reports / मेडिकल रिपोर्ट' },
    { value: 'referral', label: 'Referral Letter / रेफरल लेटर' },
    { value: 'emergency', label: 'Emergency Certificate / आपातकालीन प्रमाणपत्र' },
    { value: 'cghs', label: 'CGHS Card Copy / सीजीएचएस कार्ड की कॉपी' },
    { value: 'other', label: 'Other Supporting Documents / अन्य सहायक दस्तावेज' }
  ];

  const handleFileUpload = (category: string, files: FileList | null) => {
    if (!files) return;

    const newDocuments = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      category: category
    }));

    const updatedDocuments = [...documents, ...newDocuments];
    setDocuments(updatedDocuments);
    updateData('documents', updatedDocuments);
  };

  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    updateData('documents', updatedDocuments);
  };

  return (
    <FormSection title="Document Uploads" subtitle="दस्तावेज अपलोड">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Important Guidelines / महत्वपूर्ण दिशानिर्देश</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Upload clear, readable copies of all documents</li>
            <li>• Accepted formats: PDF, JPG, JPEG, PNG</li>
            <li>• Maximum file size: 5MB per document</li>
            <li>• सभी दस्तावेजों की स्पष्ट, पठनीय प्रतियां अपलोड करें</li>
          </ul>
        </div>

        {documentCategories.map((category) => (
          <div key={category.value} className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {category.label}
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop files here
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(category.value, e.target.files)}
                className="hidden"
                id={`upload-${category.value}`}
              />
              <label
                htmlFor={`upload-${category.value}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Choose Files
              </label>
            </div>

            {/* Display uploaded documents for this category */}
            {documents.filter(doc => doc.category === category.value).length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.filter(doc => doc.category === category.value).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {documents.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>{documents.length} document(s)</strong> uploaded successfully
            </p>
          </div>
        )}
      </div>
    </FormSection>
  );
};

export default DocumentUploads;