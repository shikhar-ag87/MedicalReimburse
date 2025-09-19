import React, { useState, useRef, useEffect } from "react";
import {
    Upload,
    File,
    Trash2,
    Download,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import FormSection from "./FormSection";
import {
    useFileUpload,
    useApplicationFiles,
    useFilePreview,
    useDragAndDrop,
} from "../../hooks/useFiles";
import { fileService, DocumentType } from "../../services/files";

interface DocumentUpload {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    documentType: DocumentType;
    uploadedAt: string;
}

interface DocumentUploadsProps {
    data: any;
    updateData: (section: string, data: any) => void;
}

const DocumentUploads: React.FC<DocumentUploadsProps> = ({
    data,
    updateData,
}) => {
    const [selectedDocumentType, setSelectedDocumentType] =
        useState<DocumentType>("other");
    const [documents, setDocuments] = useState<DocumentUpload[]>(
        data.documents || []
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use file management hooks
    const {
        uploadFiles,
        uploading,
        uploadProgress,
        error: uploadError,
        clearError,
    } = useFileUpload({
        applicationId: data.applicationId || "temp-" + Date.now().toString(),
        documentType: selectedDocumentType,
        onSuccess: (response) => {
            // Update form data with uploaded files
            const newDocuments = response.files.map((file) => ({
                id: file.id,
                fileName: file.fileName,
                originalName: file.originalName,
                mimeType: file.mimeType,
                fileSize: file.fileSize,
                documentType: file.documentType,
                uploadedAt: file.uploadedAt,
            }));

            const updatedDocuments = [...documents, ...newDocuments];
            setDocuments(updatedDocuments);
            updateData("documents", updatedDocuments);

            clearPreviews();
        },
        onError: (error) => {
            console.error("Upload failed:", error);
        },
        maxFiles: 10,
    });

    const { files, refetch, deleteFile, downloadFile } = useApplicationFiles({
        applicationId: data.applicationId || "",
        autoRefetch: false,
    });

    const {
        previews,
        addFiles,
        removeFile: removePreview,
        clearFiles: clearPreviews,
        hasErrors,
    } = useFilePreview();

    const { dragActive, dragProps } = useDragAndDrop({
        onFiles: (fileList) => addFiles(fileList),
        accept: ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx",
        multiple: true,
    });

    // Document type options with descriptions
    const documentTypes = fileService.getRecommendedDocumentTypes();

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
    };

    const handleUpload = async () => {
        if (previews.length === 0 || hasErrors) return;

        const validFiles = previews
            .filter((preview) => !preview.error)
            .map((preview) => preview.file);

        if (validFiles.length > 0) {
            await uploadFiles(validFiles);
        }
    };

    const handleDocumentTypeUpload = (documentType: DocumentType) => {
        setSelectedDocumentType(documentType);
        fileInputRef.current?.click();
    };

    const removeDocument = async (id: string) => {
        try {
            await deleteFile(id);
            // Update form data
            const updatedDocuments = documents.filter((doc) => doc.id !== id);
            setDocuments(updatedDocuments);
            updateData("documents", updatedDocuments);
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            await downloadFile(id, fileName);
        } catch (error) {
            console.error("Failed to download document:", error);
        }
    };

    // Sync uploaded files with form data
    useEffect(() => {
        if (data.applicationId && files.length !== documents.length) {
            refetch();
        }
    }, [data.applicationId, files.length, documents.length, refetch]);

    return (
        <FormSection title="Document Uploads" subtitle="दस्तावेज अपलोड">
            <div className="space-y-6">
                {/* Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                        Important Guidelines / महत्वपूर्ण दिशानिर्देश
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            • Upload clear, readable copies of all documents /
                            सभी दस्तावेजों की स्पष्ट, पठनीय प्रतियां अपलोड करें
                        </li>
                        <li>
                            • Accepted formats: PDF, Images, Word documents /
                            स्वीकृत प्रारूप: पीडीएफ, छवि, वर्ड दस्तावेज
                        </li>
                        <li>
                            • Maximum file size: 10MB per document / अधिकतम
                            फ़ाइल आकार: प्रति दस्तावेज़ 10MB
                        </li>
                    </ul>
                </div>

                {/* Main Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                        dragActive
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-300 bg-gray-50 hover:border-gray-400"
                    }`}
                    {...dragProps}
                >
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                            <p className="text-lg text-gray-600">
                                Drag and drop files here, or{" "}
                                <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    browse
                                </button>
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                PDF, Images, Word documents up to 10MB each
                            </p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                        onChange={handleFileInputChange}
                    />
                </div>

                {/* Document Type Selection */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">
                        Upload by Document Type / दस्तावेज प्रकार द्वारा अपलोड
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {documentTypes.map((docType) => (
                            <div
                                key={docType.value}
                                className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() =>
                                    handleDocumentTypeUpload(docType.value)
                                }
                            >
                                <File className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-700">
                                    {docType.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {docType.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* File Previews */}
                {previews.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium text-gray-900">
                                Files to Upload / अपलोड करने वाली फ़ाइलें
                            </h4>
                            <div className="space-x-2">
                                <button
                                    type="button"
                                    onClick={clearPreviews}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Clear All
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={
                                        uploading ||
                                        hasErrors ||
                                        previews.length === 0
                                    }
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading
                                        ? `Uploading... ${uploadProgress}%`
                                        : "Upload Files"}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {previews.map((preview, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 border rounded-lg ${
                                        preview.error
                                            ? "bg-red-50 border-red-200"
                                            : "bg-white"
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        {preview.previewUrl ? (
                                            <img
                                                src={preview.previewUrl}
                                                alt="Preview"
                                                className="w-8 h-8 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                {fileService.getFileIcon(
                                                    preview.file.type
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {preview.file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {fileService.formatFileSize(
                                                    preview.file.size
                                                )}
                                            </p>
                                            {preview.error && (
                                                <p className="text-xs text-red-600 flex items-center mt-1">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    {preview.error}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removePreview(index)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {uploading && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-blue-700">
                                        Uploading files... {uploadProgress}%
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700">
                                {uploadError}
                            </span>
                            <button
                                type="button"
                                onClick={clearError}
                                className="text-xs text-red-600 hover:text-red-800 ml-auto"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Uploaded Documents */}
                {documents.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h4 className="text-md font-medium text-gray-900">
                                Uploaded Documents ({documents.length}) / अपलोड
                                किए गए दस्तावेज़
                            </h4>
                        </div>
                        <div className="space-y-2">
                            {documents.map((document) => (
                                <div
                                    key={document.id}
                                    className="flex items-center justify-between p-3 bg-white border rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            {fileService.getFileIcon(
                                                document.mimeType
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {document.originalName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {fileService.formatFileSize(
                                                    document.fileSize
                                                )}{" "}
                                                •{" "}
                                                {fileService.getDocumentTypeDisplayName(
                                                    document.documentType
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Uploaded{" "}
                                                {new Date(
                                                    document.uploadedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDownload(
                                                    document.id,
                                                    document.originalName
                                                )
                                            }
                                            className="p-1 text-gray-400 hover:text-green-600"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeDocument(document.id)
                                            }
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary */}
                {documents.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-green-800">
                                <strong>{documents.length} document(s)</strong>{" "}
                                uploaded successfully
                            </p>
                        </div>
                    </div>
                )}

                {/* Required Documents Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-amber-800 mb-2">
                        Required Documents / आवश्यक दस्तावेज़:
                    </h5>
                    <ul className="text-xs text-amber-700 space-y-1">
                        <li>
                            • CGHS Card (photocopy) / सीजीएचएस कार्ड (फोटोकॉपी)
                        </li>
                        <li>
                            • Original prescriptions from registered medical
                            practitioners / पंजीकृत चिकित्सकों से मूल नुस्खे
                        </li>
                        <li>
                            • Medical bills and receipts with proper stamps /
                            उचित स्टैम्प के साथ मेडिकल बिल और रसीदें
                        </li>
                        <li>
                            • Medical certificates or discharge summaries (if
                            applicable) / चिकित्सा प्रमाणपत्र या छुट्टी सारांश
                            (यदि लागू हो)
                        </li>
                        <li>
                            • Any additional supporting documents / कोई अतिरिक्त
                            सहायक दस्तावेज
                        </li>
                    </ul>
                    <p className="text-xs text-amber-600 mt-3 font-medium">
                        Note: All documents must be clear and legible.
                        Incomplete documentation may delay processing.
                    </p>
                </div>
            </div>
        </FormSection>
    );
};

export default DocumentUploads;
