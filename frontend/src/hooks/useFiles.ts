// React hooks for file upload and management
import { useState, useCallback } from "react";
import {
    fileService,
    DocumentType,
    UploadedFile,
    FileUploadResponse,
} from "../services/files";

interface UseFileUploadOptions {
    applicationId: string;
    documentType?: DocumentType;
    onSuccess?: (response: FileUploadResponse) => void;
    onError?: (error: Error) => void;
    maxFiles?: number;
}

interface UseFileUploadReturn {
    uploadFiles: (files: File[]) => Promise<void>;
    uploading: boolean;
    uploadProgress: number;
    error: string | null;
    clearError: () => void;
}

export function useFileUpload(
    options: UseFileUploadOptions
): UseFileUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const uploadFiles = useCallback(
        async (files: File[]) => {
            if (!files || files.length === 0) {
                setError("Please select files to upload");
                return;
            }

            if (options.maxFiles && files.length > options.maxFiles) {
                setError(`Maximum ${options.maxFiles} files allowed`);
                return;
            }

            setUploading(true);
            setError(null);
            setUploadProgress(0);

            try {
                // Validate all files first
                for (const file of files) {
                    const validation = fileService.validateFile(file);
                    if (!validation.valid) {
                        throw new Error(`${file.name}: ${validation.error}`);
                    }
                }

                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadProgress((prev) => Math.min(prev + 10, 90));
                }, 200);

                const response = await fileService.uploadFiles(
                    options.applicationId,
                    files,
                    options.documentType
                );

                clearInterval(progressInterval);
                setUploadProgress(100);

                options.onSuccess?.(response);
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error("Upload failed");
                setError(error.message);
                options.onError?.(error);
            } finally {
                setUploading(false);
                setTimeout(() => setUploadProgress(0), 1000);
            }
        },
        [options]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        uploadFiles,
        uploading,
        uploadProgress,
        error,
        clearError,
    };
}

interface UseApplicationFilesOptions {
    applicationId: string;
    documentType?: DocumentType;
    autoRefetch?: boolean;
}

interface UseApplicationFilesReturn {
    files: UploadedFile[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    deleteFile: (fileId: string) => Promise<void>;
    downloadFile: (fileId: string, fileName: string) => Promise<void>;
    deleting: Set<string>;
}

export function useApplicationFiles(
    options: UseApplicationFilesOptions
): UseApplicationFilesReturn {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<Set<string>>(new Set());

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fileService.getApplicationFiles(
                options.applicationId,
                options.documentType
            );
            setFiles(response.documents);
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error("Failed to fetch files");
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [options.applicationId, options.documentType]);

    const deleteFile = useCallback(async (fileId: string) => {
        setDeleting((prev) => new Set(prev).add(fileId));

        try {
            await fileService.deleteFile(fileId);
            setFiles((prev) => prev.filter((file) => file.id !== fileId));
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error("Failed to delete file");
            setError(error.message);
        } finally {
            setDeleting((prev) => {
                const newSet = new Set(prev);
                newSet.delete(fileId);
                return newSet;
            });
        }
    }, []);

    const downloadFile = useCallback(
        async (fileId: string, fileName: string) => {
            try {
                await fileService.downloadFile(fileId, fileName);
            } catch (err) {
                const error =
                    err instanceof Error
                        ? err
                        : new Error("Failed to download file");
                setError(error.message);
            }
        },
        []
    );

    // Auto-refetch on mount
    useState(() => {
        if (options.autoRefetch !== false) {
            refetch();
        }
    });

    return {
        files,
        loading,
        error,
        refetch,
        deleteFile,
        downloadFile,
        deleting,
    };
}

interface FilePreview {
    file: File;
    previewUrl?: string;
    error?: string;
}

interface UseFilePreviewReturn {
    previews: FilePreview[];
    addFiles: (files: FileList | File[]) => void;
    removeFile: (index: number) => void;
    clearFiles: () => void;
    hasErrors: boolean;
}

export function useFilePreview(): UseFilePreviewReturn {
    const [previews, setPreviews] = useState<FilePreview[]>([]);

    const addFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);

        const newPreviews: FilePreview[] = fileArray.map((file) => {
            const validation = fileService.validateFile(file);
            const preview: FilePreview = {
                file,
                error: validation.valid ? undefined : validation.error,
            };

            // Create preview URL for images
            if (validation.valid && file.type.startsWith("image/")) {
                preview.previewUrl = fileService.createPreviewUrl(file);
            }

            return preview;
        });

        setPreviews((prev) => [...prev, ...newPreviews]);
    }, []);

    const removeFile = useCallback((index: number) => {
        setPreviews((prev) => {
            const newPreviews = [...prev];
            const removed = newPreviews.splice(index, 1)[0];

            // Revoke preview URL to prevent memory leaks
            if (removed.previewUrl) {
                fileService.revokePreviewUrl(removed.previewUrl);
            }

            return newPreviews;
        });
    }, []);

    const clearFiles = useCallback(() => {
        // Revoke all preview URLs
        previews.forEach((preview) => {
            if (preview.previewUrl) {
                fileService.revokePreviewUrl(preview.previewUrl);
            }
        });

        setPreviews([]);
    }, [previews]);

    const hasErrors = previews.some((preview) => preview.error);

    // Cleanup preview URLs on unmount
    useState(() => {
        return () => {
            previews.forEach((preview) => {
                if (preview.previewUrl) {
                    fileService.revokePreviewUrl(preview.previewUrl);
                }
            });
        };
    });

    return {
        previews,
        addFiles,
        removeFile,
        clearFiles,
        hasErrors,
    };
}

// Utility hook for file drag and drop
interface UseDragAndDropOptions {
    onFiles: (files: FileList) => void;
    accept?: string;
    multiple?: boolean;
}

interface UseDragAndDropReturn {
    dragActive: boolean;
    dragProps: {
        onDragEnter: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDragOver: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
}

export function useDragAndDrop(
    options: UseDragAndDropOptions
): UseDragAndDropReturn {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            setDragActive(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                // Filter files by accept type if specified
                if (options.accept) {
                    const acceptedTypes = options.accept
                        .split(",")
                        .map((type) => type.trim());
                    const filteredFiles: File[] = [];

                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const accepted = acceptedTypes.some((acceptType) => {
                            if (acceptType.startsWith(".")) {
                                return file.name
                                    .toLowerCase()
                                    .endsWith(acceptType.toLowerCase());
                            }
                            return file.type.match(
                                acceptType.replace("*", ".*")
                            );
                        });

                        if (accepted) {
                            filteredFiles.push(file);
                        }
                    }

                    if (filteredFiles.length > 0) {
                        const fileList = new DataTransfer();
                        filteredFiles.forEach((file) =>
                            fileList.items.add(file)
                        );
                        options.onFiles(fileList.files);
                    }
                } else {
                    options.onFiles(files);
                }
            }
        },
        [options]
    );

    const dragProps = {
        onDragEnter: handleDragIn,
        onDragLeave: handleDragOut,
        onDragOver: handleDrag,
        onDrop: handleDrop,
    };

    return {
        dragActive,
        dragProps,
    };
}
