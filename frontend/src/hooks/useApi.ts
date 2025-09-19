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

    const submitApplication = useCallback(async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            console.log("Submitting application with data:", formData);
            const result = await applicationService.submitApplication(formData);

            setSubmissionResult(result);
            setIsSubmitted(true);

            // Clear form data from localStorage on successful submission
            localStorage.removeItem("medicalReimbursementForm");

            console.log("Application submitted successfully:", result);
        } catch (err) {
            const errorMessage = handleApiError(err as Error);
            setError(errorMessage);
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
    }, []);

    return {
        submitApplication,
        isSubmitting,
        isSubmitted,
        submissionResult,
        error,
        resetSubmission,
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
            const response = await fetch("http://localhost:3001/health", {
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
                localStorage.setItem(key, JSON.stringify(formData));
                setLastSaved(new Date());
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
