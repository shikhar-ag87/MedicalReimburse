import React, { useRef } from "react";
import { Upload, File, CheckCircle, AlertCircle, X } from "lucide-react";
import { StepProps, DocumentData } from "../../types/form";

const DocumentUploadStep: React.FC<StepProps> = ({
    formData,
    updateFormData,
    validationErrors,
    onNext,
    onPrevious,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    const handleDocumentChange = (
        field: keyof DocumentData,
        value: boolean | number
    ) => {
        updateFormData("documents", {
            ...formData.documents,
            [field]: value,
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            updateFormData("documents", {
                ...formData.documents,
                uploadedFiles: [
                    ...formData.documents.uploadedFiles,
                    ...newFiles,
                ],
            });
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = formData.documents.uploadedFiles.filter(
            (_, i) => i !== index
        );
        updateFormData("documents", {
            ...formData.documents,
            uploadedFiles: updatedFiles,
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="card-gov">
                <div className="card-gov-header">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center">
                            <Upload className="w-5 h-5 text-gov-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gov-primary-800">
                                Document Upload
                            </h2>
                            <p className="text-gov-neutral-600 font-hindi">
                                दस्तावेज़ अपलोड - संलग्नक
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Required Documents Checklist */}
                    <div className="bg-gov-neutral-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gov-neutral-800 mb-4">
                            Required Documents Checklist
                            <span className="font-hindi text-sm ml-2">
                                आवश्यक दस्तावेज़ सूची
                            </span>
                        </h3>

                        <div className="space-y-4">
                            {/* Enclosures Count */}
                            <div className="form-group">
                                <label
                                    htmlFor="enclosures"
                                    className="form-label"
                                >
                                    Total Nos. of Enclosures (Self attested)
                                    <span className="font-hindi text-sm ml-2">
                                        कुल संलग्नक की संख्या
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    id="enclosures"
                                    min="0"
                                    value={formData.documents.enclosures}
                                    onChange={(e) =>
                                        handleDocumentChange(
                                            "enclosures",
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                    className="input-gov w-32"
                                    placeholder="0"
                                />
                            </div>

                            {/* Required Document Checkboxes */}
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="photocopyCGHSCard"
                                        checked={
                                            formData.documents.photocopyCGHSCard
                                        }
                                        onChange={(e) =>
                                            handleDocumentChange(
                                                "photocopyCGHSCard",
                                                e.target.checked
                                            )
                                        }
                                        className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-1"
                                    />
                                    <div>
                                        <label
                                            htmlFor="photocopyCGHSCard"
                                            className="form-label text-sm"
                                        >
                                            Photocopy of CGHS/JNU Medical Card
                                            of Faculty/Employee & Patient (is
                                            attached at page No. _____ )
                                            <span className="font-hindi text-sm ml-2">
                                                CGHS/JNU मेडिकल कार्ड की फोटो
                                                कॉपी
                                            </span>
                                        </label>
                                        {validationErrors.photocopyCGHSCard && (
                                            <p className="text-red-600 text-xs mt-1 flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                {
                                                    validationErrors.photocopyCGHSCard
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="photocopiesOriginalPrescriptions"
                                        checked={
                                            formData.documents
                                                .photocopiesOriginalPrescriptions
                                        }
                                        onChange={(e) =>
                                            handleDocumentChange(
                                                "photocopiesOriginalPrescriptions",
                                                e.target.checked
                                            )
                                        }
                                        className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-1"
                                    />
                                    <label
                                        htmlFor="photocopiesOriginalPrescriptions"
                                        className="form-label text-sm"
                                    >
                                        Photocopies/Original Prescriptions
                                        <span className="font-hindi text-sm ml-2">
                                            मूल प्रिस्क्रिप्शन की फोटो कॉपी
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="originalBills"
                                        checked={
                                            formData.documents.originalBills
                                        }
                                        onChange={(e) =>
                                            handleDocumentChange(
                                                "originalBills",
                                                e.target.checked
                                            )
                                        }
                                        className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-1"
                                    />
                                    <div>
                                        <label
                                            htmlFor="originalBills"
                                            className="form-label text-sm"
                                        >
                                            Cash Memos/Bills (in Original)
                                            <span className="font-hindi text-sm ml-2">
                                                मूल बिल/कैश मेमो
                                            </span>
                                        </label>
                                        {validationErrors.originalBills && (
                                            <p className="text-red-600 text-xs mt-1 flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                {validationErrors.originalBills}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="bg-white border-2 border-dashed border-gov-neutral-300 rounded-lg p-8">
                        <div className="text-center">
                            <Upload className="w-12 h-12 text-gov-neutral-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gov-neutral-800 mb-2">
                                Upload Supporting Documents
                            </h3>
                            <p className="text-gov-neutral-600 mb-4">
                                Drag and drop files here or click to browse
                                <span className="font-hindi text-sm block">
                                    दस्तावेज़ अपलोड करें
                                </span>
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-gov-primary mb-4"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Choose Files
                            </button>

                            <p className="text-xs text-gov-neutral-500">
                                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max
                                size: 10MB per file)
                            </p>
                        </div>
                    </div>

                    {/* Uploaded Files List */}
                    {formData.documents.uploadedFiles.length > 0 && (
                        <div className="bg-gov-neutral-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gov-neutral-800 mb-3">
                                Uploaded Files
                            </h4>
                            <div className="space-y-2">
                                {formData.documents.uploadedFiles.map(
                                    (file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gov-neutral-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <File className="w-5 h-5 text-gov-primary-600 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm font-medium text-gov-neutral-800">
                                                        {file.name}
                                                    </div>
                                                    <div className="text-xs text-gov-neutral-600">
                                                        {formatFileSize(
                                                            file.size
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4 text-gov-secondary-600" />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFile(index)
                                                    }
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove file"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Additional Instructions */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-800 mb-2">
                                    Important Instructions
                                </h4>
                                <ul className="text-yellow-700 text-sm space-y-1">
                                    <li>
                                        • All documents must be clearly scanned
                                        and legible
                                    </li>
                                    <li>
                                        • Original bills/receipts are mandatory
                                        for reimbursement
                                    </li>
                                    <li>• Self-attest all photocopies</li>
                                    <li>
                                        • Medical prescriptions should be from
                                        registered medical practitioners
                                    </li>
                                    <li>
                                        • Attach additional sheet if required
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Form Navigation */}
                    <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
                        <button
                            type="button"
                            className="btn-gov-secondary"
                            onClick={onPrevious}
                        >
                            Previous: Expense Details
                        </button>
                        <button type="submit" className="btn-gov-primary">
                            Next: Declaration
                        </button>
                    </div>
                </form>
            </div>

            {/* Help Section */}
            <div className="card-gov bg-gov-neutral-50">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-gov-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gov-neutral-800 mb-2">
                            Document Upload Guidelines
                        </h3>
                        <ul className="text-gov-neutral-600 space-y-2 text-sm">
                            <li>
                                • Upload clear, high-resolution scans of all
                                documents
                            </li>
                            <li>
                                • Ensure all text in documents is clearly
                                readable
                            </li>
                            <li>• Original bills and receipts are mandatory</li>
                            <li>• Self-attest all photocopied documents</li>
                            <li>
                                • Contact support if you face any upload issues
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadStep;
