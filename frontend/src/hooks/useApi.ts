// React hooks for API integration
import { useState, useEffect, useCallback } from "react";
import {
    applicationService,
    ApplicationSubmissionResponse,
} from "../services/applications";
import { handleApiError } from "../services/api";
import type { FormData } from "../types/form";

export interface UseApplicationSubmissionResult {
    submitApplication: (formData: FormData) => Promise<void>;
    isSubmitting: boolean;
    isSubmitted: boolean;
    submissionResult: ApplicationSubmissionResponse | null;
    error: string | null;
    resetSubmission: () => void;
    uploadProgress: number;
    uploadStatus: string;
}

/**
 * Hook for handling form submission
 */
export const useApplicationSubmission = (): UseApplicationSubmissionResult => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionResult, setSubmissionResult] =
        useState<ApplicationSubmissionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");

    const submitApplication = useCallback(async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);
        setUploadProgress(0);
        setUploadStatus("Submitting application...");

        try {
            console.log("Submitting application with data:", formData);
            const result = await applicationService.submitApplication(formData);
            
            setUploadProgress(50);
            setUploadStatus("Application created successfully!");
            console.log("Application submitted successfully:", result);

            // Upload documents if any files were selected
            if (formData.documents.uploadedFiles && formData.documents.uploadedFiles.length > 0) {
                console.log("=== CHECKING UPLOADED FILES ===");
                console.log(`Found ${formData.documents.uploadedFiles.length} files in formData`);
                console.log("Files:", formData.documents.uploadedFiles);
                
                // Filter to only include actual File objects (not serialized metadata)
                const actualFiles = formData.documents.uploadedFiles.filter(f => f instanceof File);
                console.log(`Actual File objects: ${actualFiles.length}`);
                
                if (actualFiles.length > 0) {
                    setUploadProgress(60);
                    setUploadStatus(`Uploading ${actualFiles.length} file(s)...`);
                    console.log(`Uploading ${actualFiles.length} actual files for application ${result.applicationId}`);
                    try {
                        await applicationService.uploadDocuments(
                            result.applicationId,
                            actualFiles
                        );
                        setUploadProgress(90);
                        setUploadStatus("Files uploaded successfully!");
                        console.log("Documents uploaded successfully");
                    } catch (uploadError) {
                        console.error("Document upload failed:", uploadError);
                        setUploadStatus("Warning: Some files failed to upload");
                        // Don't fail the whole submission if documents fail to upload
                        // But log it prominently
                    }
                } else {
                    console.warn("No actual File objects found! Files may have been serialized by auto-save.");
                    setUploadProgress(90);
                }
            } else {
                console.log("No documents to upload");
                setUploadProgress(90);
            }

            setUploadProgress(100);
            setUploadStatus("Completed!");
            setSubmissionResult(result);
            setIsSubmitted(true);

            // Clear form data from localStorage on successful submission
            localStorage.removeItem("medicalReimbursementForm");
        } catch (err) {
            const errorMessage = handleApiError(err as Error);
            setError(errorMessage);
            setUploadProgress(0);
            setUploadStatus("");
            console.error("Application submission failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const resetSubmission = useCallback(() => {
        setIsSubmitting(false);
        setIsSubmitted(false);
        setSubmissionResult(null);
        setError(null);
        setUploadProgress(0);
        setUploadStatus("");
    }, []);

    return {
        submitApplication,
        isSubmitting,
        isSubmitted,
        submissionResult,
        error,
        resetSubmission,
        uploadProgress,
        uploadStatus,
    };
};

export interface UseServerHealthResult {
    isServerOnline: boolean;
    isChecking: boolean;
    lastChecked: Date | null;
    checkHealth: () => void;
}

/**
 * Hook for checking server health
 */
export const useServerHealth = (): UseServerHealthResult => {
    const [isServerOnline, setIsServerOnline] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const checkHealth = useCallback(async () => {
        setIsChecking(true);

        try {
            // Use the same base URL as the API service
            const API_BASE_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3005/api";
            const healthUrl = `${API_BASE_URL.replace("/api", "")}/health`;

            const response = await fetch(healthUrl, {
                method: "GET",
                timeout: 5000,
            } as RequestInit);

            setIsServerOnline(response.ok);
            setLastChecked(new Date());
        } catch (error) {
            console.warn("Server health check failed:", error);
            setIsServerOnline(false);
            setLastChecked(new Date());
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Check server health on mount and periodically
    useEffect(() => {
        checkHealth();

        // Check every 30 seconds
        const interval = setInterval(checkHealth, 30000);

        return () => clearInterval(interval);
    }, [checkHealth]);

    return {
        isServerOnline,
        isChecking,
        lastChecked,
        checkHealth,
    };
};

export interface UseAutoSaveResult {
    isAutoSaving: boolean;
    lastSaved: Date | null;
    saveError: string | null;
}

/**
 * Hook for auto-saving form data to localStorage
 */
export const useAutoSave = (
    formData: FormData,
    key: string = "medicalReimbursementForm",
    delay: number = 2000
): UseAutoSaveResult => {
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setIsAutoSaving(true);
            setSaveError(null);

            try {
                // Create a copy of formData excluding File objects for localStorage
                const serializableData = {
                    ...formData,
                    documents: {
                        ...formData.documents,
                        // Don't save actual File objects - they can't be serialized
                        // We'll just save metadata for display purposes
                        uploadedFiles: formData.documents.uploadedFiles.map(file => {
                            if (file instanceof File) {
                                return {
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                    _isSerializedFile: true  // Flag to identify serialized files
                                };
                            }
                            return file;
                        })
                    }
                };
                
                localStorage.setItem(key, JSON.stringify(serializableData));
                setLastSaved(new Date());
                console.log("Auto-save: Saved form data (files serialized as metadata only)");
            } catch (error) {
                console.error("Auto-save failed:", error);
                setSaveError("Failed to save form data");
            } finally {
                setIsAutoSaving(false);
            }
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [formData, key, delay]);

    return {
        isAutoSaving,
        lastSaved,
        saveError,
    };
};

/**
 * Hook for loading saved form data from localStorage
 */
export const useSavedFormData = (
    key: string = "medicalReimbursementForm"
): FormData | null => {
    const [savedData, setSavedData] = useState<FormData | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsedData = JSON.parse(saved);
                
                // Check if files were serialized (and thus lost)
                if (parsedData.documents?.uploadedFiles?.some((f: any) => f._isSerializedFile)) {
                    console.warn("⚠️ Form was restored from localStorage but uploaded files were lost.");
                    console.warn("You'll need to re-upload your files before submitting.");
                    // Clear the serialized file metadata so user knows to re-upload
                    parsedData.documents.uploadedFiles = [];
                }
                
                setSavedData(parsedData);
                console.log("Loaded saved form data:", parsedData);
            }
        } catch (error) {
            console.error("Failed to load saved form data:", error);
            localStorage.removeItem(key); // Remove corrupted data
        }
    }, [key]);

    return savedData;
};
