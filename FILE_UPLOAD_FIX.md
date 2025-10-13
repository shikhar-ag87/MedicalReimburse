# File Upload Fix - Medical Reimbursement System

## Problem Summary
Files were not being uploaded when users submitted the medical reimbursement form. The files were selected but not saved to the backend or database.

## Root Causes Identified

### 1. ⚠️ Authentication Issue (CRITICAL)
**Problem**: The `/api/files/upload` endpoint had authentication middleware but employee form submissions are anonymous (no login).

**Location**: `backend/src/routes/files.ts`

**Impact**: When `applicationService.uploadDocuments()` was called after form submission, it failed with 401 Unauthorized because there was no auth token.

**Fix Applied**:
```typescript
// BEFORE: Had authenticateToken middleware
router.post("/upload", authenticateToken, upload.array("files", 10), ...)

// AFTER: Made public (removed authenticateToken)
router.post("/upload", upload.array("files", 10), ...)
```

### 2. ⚠️ Missing documentType Parameter
**Problem**: The `documentType` field was not being sent in the upload request, which could cause issues on the backend.

**Location**: `frontend/src/services/applications.ts`

**Fix Applied**:
```typescript
// BEFORE
formData.append("applicationId", applicationId);
files.forEach((file) => {
    formData.append("files", file);
});

// AFTER
formData.append("applicationId", applicationId);
formData.append("documentType", "supporting_documents");
files.forEach((file) => {
    formData.append("files", file);
});
```

### 3. ⚠️ LocalStorage Serialization Issue
**Problem**: The `useAutoSave` hook tried to save File objects to localStorage using `JSON.stringify()`, which fails because File objects cannot be serialized.

**Location**: `frontend/src/hooks/useApi.ts`

**Impact**: 
- Auto-save would fail silently
- Console errors: "Failed to save form data"
- Files would be lost when page refreshes

**Fix Applied**:
```typescript
// Create a serializable copy without actual File objects
const serializableData = {
    ...formData,
    documents: {
        ...formData.documents,
        uploadedFiles: formData.documents.uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
        }))
    }
};

localStorage.setItem(key, JSON.stringify(serializableData));
```

**Note**: Files will NOT be restored after page refresh (this is a browser limitation). Users will need to re-select files if they reload the page.

---

## How File Upload Works Now

### Step-by-Step Flow

#### 1. User Selects Files
- User navigates to "Document Upload" step (Step 5)
- Clicks "Choose Files" button
- Selects PDF, images, or documents
- Files are stored in component state: `formData.documents.uploadedFiles`

#### 2. Form Submission
- User completes form and clicks "Submit"
- `handleSubmit()` is called in `EmployeeForm.tsx`
- Form data (without files) is submitted to `/api/applications`
- Backend creates application record and returns `applicationId`

#### 3. File Upload
- After successful application creation
- `applicationService.uploadDocuments(applicationId, files)` is called
- Creates FormData with:
  - `applicationId`: The new application's ID
  - `documentType`: "supporting_documents"
  - `files`: Array of File objects
- POST request to `/api/files/upload`

#### 4. Backend Processing
- Multer middleware handles multipart/form-data
- Files are saved to disk in `uploads/{applicationId}/` directory
- File metadata is saved to `application_documents` table
- Audit log is created
- Response returns uploaded file details

#### 5. Success
- User sees success message
- Application ID and reference number displayed
- Files are permanently stored

---

## File Upload Configuration

### Allowed File Types
```javascript
const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".doc",
    ".docx",
];
```

### File Size Limits
- **Per file**: 10MB maximum
- **Total files**: Up to 10 files per upload

### Storage Location
- **Directory**: `backend/uploads/{applicationId}/`
- **Filename format**: `{original-basename}-{timestamp}-{random}.{ext}`
- **Example**: `medical-bill-1699123456789-a1b2c3d4.pdf`

---

## Database Schema

### application_documents Table
```sql
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES medical_applications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    document_type TEXT DEFAULT 'other',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Testing the Fix

### Manual Test Steps

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Fill out the form**:
   - Navigate to http://localhost:5173
   - Complete steps 1-4 (Employee, Patient, Treatment, Expenses)

4. **Upload files (Step 5)**:
   - Click "Choose Files"
   - Select 2-3 test files (PDF, images, etc.)
   - Verify files appear in "Uploaded Files" list
   - Verify file names and sizes are displayed

5. **Submit form (Step 6)**:
   - Complete declaration step
   - Click "Submit Application"
   - Wait for success message

6. **Verify upload**:
   - Check console for "Documents uploaded successfully" log
   - Check `backend/uploads/{applicationId}/` directory
   - Files should be saved there
   - Check database `application_documents` table

### Database Verification
```sql
-- Check uploaded files for an application
SELECT 
    id,
    file_name,
    original_name,
    file_size,
    document_type,
    uploaded_at
FROM application_documents
WHERE application_id = 'your-application-id'
ORDER BY uploaded_at DESC;
```

### API Testing with cURL

```bash
# Test file upload (after getting applicationId)
curl -X POST http://localhost:3005/api/files/upload \
  -F "applicationId=your-application-id" \
  -F "documentType=supporting_documents" \
  -F "files=@/path/to/test-file1.pdf" \
  -F "files=@/path/to/test-file2.jpg"
```

---

## Known Limitations

### 1. Files Not Preserved on Page Reload
**Issue**: If user refreshes the page, uploaded files are lost.

**Reason**: File objects cannot be stored in localStorage (browser security).

**Workaround**: Users must re-select files if they reload the page before submission.

**Future Enhancement**: Implement temporary file storage with expiration.

### 2. No Upload Progress Indicator
**Issue**: Large files may take time to upload with no visual feedback.

**Future Enhancement**: Add progress bar using XMLHttpRequest or axios with upload progress events.

### 3. No File Preview
**Issue**: Users cannot preview selected files before submission.

**Future Enhancement**: Add image preview for image files, PDF viewer for PDFs.

---

## Security Considerations

### ✅ Implemented Security Measures

1. **File Type Validation**
   - MIME type checking
   - File extension validation
   - Rejects executable files, scripts, etc.

2. **File Size Limits**
   - 10MB per file maximum
   - 10 files maximum per upload
   - Prevents denial of service

3. **Unique Filenames**
   - Timestamp + random string
   - Prevents filename collision
   - Prevents directory traversal attacks

4. **Application-Specific Directories**
   - Each application has own folder
   - Isolation between applications
   - Easy cleanup

5. **Audit Logging**
   - All uploads logged to database
   - IP address and user agent tracked
   - Timestamps recorded

### ⚠️ Security Notes

1. **Public Endpoint**: `/api/files/upload` is now public (no auth required)
   - **Mitigation**: Requires valid `applicationId` that must exist in database
   - **Risk**: Low - can only upload to existing applications
   - **Future**: Consider adding rate limiting

2. **Anonymous Uploads**: No user tracking for employee submissions
   - **Mitigation**: Audit logs track IP address and user agent
   - **Risk**: Low - legitimate use case
   - **Future**: Consider optional employee login

---

## Error Handling

### Frontend Error Messages

```typescript
// In useApplicationSubmission hook
if (formData.documents.uploadedFiles && formData.documents.uploadedFiles.length > 0) {
    try {
        await applicationService.uploadDocuments(
            result.applicationId,
            formData.documents.uploadedFiles
        );
        console.log("Documents uploaded successfully");
    } catch (uploadError) {
        console.error("Document upload failed:", uploadError);
        // Don't fail the whole submission if documents fail to upload
        // Application is already created
    }
}
```

### Backend Error Handling

1. **No files uploaded**: 400 Bad Request
2. **Missing applicationId**: 400 Bad Request
3. **Application not found**: 404 Not Found (files are cleaned up)
4. **Invalid file type**: 400 Bad Request
5. **File too large**: 413 Payload Too Large
6. **Too many files**: 400 Bad Request
7. **Disk write error**: 500 Internal Server Error

---

## Monitoring & Logging

### Backend Logs
```javascript
// Successful upload
logger.info(`Files uploaded for application: ${application.applicationNumber}`, {
    applicationId,
    anonymousUserId,
    filesCount: files.length,
    fileNames: files.map((f) => f.originalname),
});

// Upload error
logger.error("File upload error:", error);
```

### Frontend Console Logs
```javascript
// Before upload
console.log(`Uploading ${formData.documents.uploadedFiles.length} documents`);

// Success
console.log("Documents uploaded successfully");

// Error
console.error("Document upload failed:", uploadError);
```

---

## Troubleshooting

### Issue: "No files uploaded" error
**Cause**: Files array is empty or not properly sent

**Solution**:
1. Check browser console for errors
2. Verify files are in state: `formData.documents.uploadedFiles`
3. Check network tab - FormData should include files

### Issue: "Application not found" error
**Cause**: Invalid or missing applicationId

**Solution**:
1. Verify application was created successfully
2. Check applicationId in upload request
3. Check database for application record

### Issue: "Invalid file type" error
**Cause**: Unsupported file format

**Solution**:
1. Only upload: PDF, JPG, PNG, GIF, WebP, DOC, DOCX
2. Check file extension matches MIME type
3. Some files may have incorrect MIME types

### Issue: Files not appearing in uploads folder
**Cause**: Permission or disk space issues

**Solution**:
1. Check `backend/uploads` directory exists
2. Check write permissions: `chmod 755 backend/uploads`
3. Check disk space: `df -h`

### Issue: Auto-save errors in console
**Cause**: File objects cannot be serialized (FIXED)

**Solution**: Already fixed in this update. No action needed.

---

## API Reference

### POST /api/files/upload

**Description**: Upload files for a medical reimbursement application

**Authentication**: ❌ Not required (public endpoint)

**Request**:
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `applicationId` (string, required): ID of the application
  - `documentType` (string, optional): Type of document (default: "other")
  - `files` (File[], required): Files to upload (max 10 files, 10MB each)

**Response** (201 Created):
```json
{
    "success": true,
    "message": "3 file(s) uploaded successfully",
    "data": {
        "files": [
            {
                "id": "uuid",
                "fileName": "medical-bill-1699123456789-a1b2c3d4.pdf",
                "originalName": "medical-bill.pdf",
                "mimeType": "application/pdf",
                "fileSize": 245678,
                "documentType": "supporting_documents",
                "uploadedAt": "2024-11-05T10:30:00Z"
            }
        ]
    }
}
```

**Error Responses**:
- `400`: Bad request (no files, invalid data)
- `404`: Application not found
- `413`: File too large
- `500`: Server error

---

## Future Enhancements

### Short-term
- [ ] Add upload progress indicator
- [ ] Add file preview (images/PDFs)
- [ ] Add drag-and-drop file upload
- [ ] Add file size validation before upload
- [ ] Add better error messages

### Long-term
- [ ] Implement temporary file storage for drafts
- [ ] Add virus scanning for uploaded files
- [ ] Implement cloud storage (S3, etc.)
- [ ] Add file compression
- [ ] Add bulk file operations
- [ ] Add file versioning
- [ ] Add file encryption at rest

---

## Summary

### ✅ What Was Fixed

1. **Removed authentication requirement** from `/api/files/upload` endpoint
2. **Added documentType parameter** to file upload requests
3. **Fixed localStorage serialization** to handle File objects properly
4. **Added proper logging** for debugging

### ✅ What Works Now

- ✅ Users can select files in Step 5
- ✅ Files are displayed in uploaded files list
- ✅ Files are uploaded after form submission
- ✅ Files are saved to disk in application-specific directories
- ✅ File metadata is saved to database
- ✅ Audit logs are created
- ✅ No authentication required for employee submissions

### ⚠️ Known Limitations

- Files are not preserved on page reload (browser limitation)
- No upload progress indicator
- No file preview functionality
- Upload happens after application creation (not during)

---

**Status**: ✅ File upload is now working correctly
**Date**: October 11, 2025
**Version**: 1.0.0
