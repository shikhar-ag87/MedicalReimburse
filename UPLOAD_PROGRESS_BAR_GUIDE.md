# File Upload Progress Bar - Implementation Guide

## ✅ Changes Completed

### 1. Backend Hook Updated (`frontend/src/hooks/useApi.ts`)

Added upload progress tracking to `useApplicationSubmission` hook:

```typescript
export interface UseApplicationSubmissionResult {
    // ... existing properties
    uploadProgress: number;      // 0-100
    uploadStatus: string;         // Status message
}

export const useApplicationSubmission = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    
    const submitApplication = async (formData: FormData) => {
        setUploadProgress(0);
        setUploadStatus("Submitting application...");
        
        // Create application
        const result = await applicationService.submitApplication(formData);
        setUploadProgress(50);
        setUploadStatus("Application created successfully!");
        
        // Upload files
        if (actualFiles.length > 0) {
            setUploadProgress(60);
            setUploadStatus(`Uploading ${actualFiles.length} file(s)...`);
            
            await applicationService.uploadDocuments(...);
            
            setUploadProgress(90);
            setUploadStatus("Files uploaded successfully!");
        }
        
        setUploadProgress(100);
        setUploadStatus("Completed!");
    };
    
    return {
        // ... existing
        uploadProgress,
        uploadStatus,
    };
};
```

### 2. Progress Stages

| Progress | Stage | Status Message |
|----------|-------|----------------|
| 0-49% | Submitting | "Submitting application..." |
| 50-59% | App Created | "Application created successfully!" |
| 60-89% | Uploading | "Uploading X file(s)..." |
| 90-99% | Finalizing | "Files uploaded successfully!" |
| 100% | Complete | "Completed!" |

## 🎨 Frontend UI Component

Add this to `EmployeeForm.tsx` after destructuring the hook:

```tsx
const EmployeeForm = () => {
    // ... existing state
    
    const {
        submitApplication,
        isSubmitting,
        isSubmitted,
        submissionResult,
        error: submissionError,
        resetSubmission,
        uploadProgress,    // ← Add this
        uploadStatus,      // ← Add this
    } = useApplicationSubmission();
    
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Existing header */}
            
            {/* ADD THIS: Upload Progress Bar */}
            {isSubmitting && (
                <div className="card-gov animate-fade-in bg-white shadow-lg border-2 border-gov-primary-200">
                    <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin">
                                    <Upload className="w-6 h-6 text-gov-primary-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg text-gov-primary-800">
                                        {uploadStatus || "Processing..."}
                                    </p>
                                    <p className="text-sm text-gov-neutral-600">
                                        Please wait, do not close this page
                                    </p>
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-gov-primary-600">
                                {uploadProgress}%
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-gov-primary-500 via-gov-primary-600 to-gov-secondary-500 h-4 rounded-full transition-all duration-500 ease-out relative"
                                style={{ width: `${uploadProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-3 text-sm">
                            {uploadProgress > 0 && uploadProgress < 50 && (
                                <div className="flex items-center space-x-2 text-gov-primary-700 bg-gov-primary-50 px-3 py-1 rounded-full">
                                    <div className="animate-spin w-3 h-3 border-2 border-gov-primary-600 border-t-transparent rounded-full"></div>
                                    <span>Submitting application data...</span>
                                </div>
                            )}
                            {uploadProgress >= 50 && uploadProgress < 60 && (
                                <div className="flex items-center space-x-2 text-gov-secondary-700 bg-gov-secondary-50 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Application created ✓</span>
                                </div>
                            )}
                            {uploadProgress >= 60 && uploadProgress < 90 && (
                                <div className="flex items-center space-x-2 text-gov-primary-700 bg-gov-primary-50 px-3 py-1 rounded-full">
                                    <Upload className="w-4 h-4 animate-bounce" />
                                    <span>Uploading documents...</span>
                                </div>
                            )}
                            {uploadProgress >= 90 && uploadProgress < 100 && (
                                <div className="flex items-center space-x-2 text-gov-secondary-700 bg-gov-secondary-50 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Finalizing...</span>
                                </div>
                            )}
                            {uploadProgress === 100 && (
                                <div className="flex items-center space-x-2 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">Complete! Redirecting...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Rest of form */}
        </div>
    );
};
```

## 📍 Where to Add in EmployeeForm.tsx

Add the progress bar component right after the page header (around line 385), before the main form content:

```tsx
return (
    <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="card-gov animate-fade-in">
            {/* ... existing header code ... */}
        </div>
        
        {/* ⭐ ADD PROGRESS BAR HERE ⭐ */}
        {isSubmitting && (
            <div className="card-gov...">
                {/* ... progress bar code from above ... */}
            </div>
        )}
        
        {/* Existing progress indicator */}
        <div className="mt-6">
            {/* ... existing step progress ... */}
        </div>
    </div>
);
```

## 🎬 How It Works

1. **User clicks "Submit"** → `isSubmitting` becomes `true`
2. **Progress bar appears** → Shows 0%
3. **Application submits** → Progress updates to 50%
4. **Files upload** (if any) → Progress 60-90%
5. **Completes** → Progress 100%, shows success
6. **After 2 seconds** → Page redirects to success screen

## ✨ Features

- **Animated gradient progress bar** with pulse effect
- **Real-time percentage** display (0-100%)
- **Status messages** at each stage
- **Colored badges** showing current operation
- **Smooth transitions** between stages
- **Prevents page close** warning message

## 🧪 Testing

```bash
# Start servers
cd frontend && npm run dev
cd backend && npm run dev

# Test the upload
1. Fill form Steps 1-6
2. Add files in Step 5
3. Click Submit
4. Watch the progress bar animate!
```

**Expected behavior:**
```
0% → "Submitting application..."
50% → "Application created successfully!" ✓
60-90% → "Uploading 3 file(s)..." (bouncing icon)
100% → "Complete! Redirecting..." ✓
```

## 📊 Visual Preview

```
┌──────────────────────────────────────────┐
│  🔄  Uploading 3 file(s)...        75%  │
│      Please wait, do not close           │
│                                           │
│  ████████████████████████░░░░░░░░░░░    │
│                                           │
│  [✓ App created]  [📤 Uploading...]     │
└──────────────────────────────────────────┘
```

---

**Status:** ✅ Backend hook completed  
**TODO:** Add UI component to EmployeeForm.tsx  
**Location:** Line ~385 in EmployeeForm.tsx  
**Time:** 5 minutes to add UI component
