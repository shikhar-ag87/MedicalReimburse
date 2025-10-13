# Download Force Download Fix ✅

## Problem
Clicking the Download button was opening PDFs in the browser instead of downloading them directly.

## Root Cause
When using direct file URLs with `window.location.href` or `<a>` tags, browsers will try to **display** PDFs in the browser viewer rather than downloading them. This is the default browser behavior for PDFs.

## Solution
Created a dedicated backend endpoint `/api/files/download/:id` that:
1. Sets the `Content-Disposition: attachment` header
2. Forces browser to download instead of display
3. Preserves original filename

### Backend Changes

**File:** `backend/src/routes/files.ts`

Added new download endpoint:
```typescript
// Download file endpoint - forces download with Content-Disposition header
router.get(
    "/download/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const db = await getDatabase();
        const documentRepo = db.getApplicationDocumentRepository();

        // Get document metadata
        const document = await documentRepo.findById(id);
        if (!document) {
            res.status(404).json({ success: false, message: "File not found" });
            return;
        }

        // Check if file exists on disk
        if (!fs.existsSync(document.filePath)) {
            res.status(404).json({ success: false, message: "File not found on disk" });
            return;
        }

        // Set headers to FORCE download (not display)
        const filename = document.originalName || document.fileName;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
        
        // Send file
        res.sendFile(document.filePath);
        
        logger.info(`File downloaded: ${filename}`, {
            documentId: id,
            applicationId: document.applicationId,
        });
    })
);
```

### Frontend Changes

**File:** `frontend/src/components/review/DocumentReviewPanel.tsx`

Updated Download button to use new endpoint:
```typescript
<button
    onClick={() => {
        // Use download endpoint that forces download
        const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}/api/files/download/${doc.id}`;
        window.location.href = downloadUrl;
    }}
    className="text-gray-600 hover:text-gray-800 p-1"
    title="Download"
>
    <Download className="w-5 h-5" />
</button>
```

## How It Works

### Before (Opening in Browser) ❌
```
Click Download → Direct file URL → Browser sees PDF → Opens in browser
```

Request:
```
GET http://localhost:3005/uploads/app-id/file.pdf
```

Response headers:
```
Content-Type: application/pdf
```

Result: **Browser displays PDF inline**

### After (Force Download) ✅
```
Click Download → API endpoint → Content-Disposition: attachment → Downloads
```

Request:
```
GET http://localhost:3005/api/files/download/{document-id}
```

Response headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Medical Bill.pdf"
```

Result: **Browser downloads file with original name**

## Key Headers

### Content-Disposition
Controls how the browser handles the file:

- `inline` - Display in browser (default for PDFs)
  ```
  Content-Disposition: inline; filename="file.pdf"
  ```

- `attachment` - Force download
  ```
  Content-Disposition: attachment; filename="file.pdf"
  ```

### Content-Type
Tells browser what type of file it is:
```
Content-Type: application/pdf
Content-Type: image/jpeg
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## Button Behavior Now

### View Button (Eye Icon) 👁️
**Purpose:** Preview the document in browser
```typescript
onClick={() => {
    const fileUrl = `http://localhost:3005/uploads/app-id/file.pdf`;
    window.open(fileUrl, '_blank');
}}
```
**Result:**
- PDFs → Open in browser PDF viewer
- Images → Display in browser
- Office docs → Browser prompts to download (can't display)

### Download Button (Download Icon) ⬇️
**Purpose:** Always download to disk
```typescript
onClick={() => {
    const downloadUrl = `http://localhost:3005/api/files/download/${doc.id}`;
    window.location.href = downloadUrl;
}}
```
**Result:**
- **All file types** → Download to Downloads folder
- Preserves original filename
- No browser display, direct download

## Testing

### Test PDFs
1. Click **View** button → PDF opens in browser viewer
2. Click **Download** button → PDF downloads to Downloads folder
3. Check filename → Should be original name (e.g., "Medical Bill.pdf")

### Test Images
1. Click **View** button → Image displays in browser
2. Click **Download** button → Image downloads to Downloads folder
3. Check filename → Should be original name (e.g., "Lab Report.jpg")

### Test Office Documents
1. Click **View** button → Browser downloads (can't display)
2. Click **Download** button → Downloads to Downloads folder
3. Both should have original filename

## Files Modified

### Backend
1. **backend/src/routes/files.ts**
   - Added new route: `GET /api/files/download/:id`
   - Sets `Content-Disposition: attachment` header
   - Sets `Content-Type` from document metadata
   - Uses `res.sendFile()` to stream file
   - Logs download activity

### Frontend
2. **frontend/src/components/review/DocumentReviewPanel.tsx**
   - Updated Download button click handler
   - Changed from direct file URL to API endpoint
   - Simplified code (no DOM manipulation needed)
   - Uses `window.location.href` for download

## Security Features

### File Validation ✅
- Checks if document exists in database
- Verifies file exists on disk
- Returns 404 if not found

### No Directory Traversal ✅
- Uses document ID, not file path
- Backend looks up actual file path from database
- No user-controlled paths

### Original Filename Preserved ✅
- Uses `document.originalName` if available
- Falls back to `document.fileName`
- Sanitized by Multer during upload

## Expected Console Output

### Backend (on download)
```
info: File downloaded: LAB-8(1).docx {
  documentId: 'uuid-here',
  applicationId: '18b8cff4-80cc-4508-abf8-46d5bd973180'
}
```

### Frontend (on click)
```
Navigating to: http://localhost:3005/api/files/download/uuid-here
```

### Browser Download
```
✓ Starting download: LAB-8(1).docx
✓ Saved to: /home/user/Downloads/LAB-8(1).docx
```

## Comparison

### OLD Approach ❌
```typescript
const link = document.createElement('a');
link.href = fileUrl;
link.download = filename;
link.click();
```
**Problem:** Browser ignores `download` attribute for same-origin PDFs, opens them instead

### NEW Approach ✅
```typescript
window.location.href = `/api/files/download/${doc.id}`;
```
**Benefit:** Server controls behavior with `Content-Disposition` header

## API Endpoint Details

### Request
```
GET /api/files/download/:id
```

### Parameters
- `:id` - Document UUID from database

### Response (Success)
```
Status: 200 OK
Headers:
  Content-Disposition: attachment; filename="Medical Bill.pdf"
  Content-Type: application/pdf
Body: [binary file data]
```

### Response (Not Found)
```
Status: 404 Not Found
Body:
{
  "success": false,
  "message": "File not found"
}
```

## Troubleshooting

### Issue: Still opens in browser
**Check:**
1. Verify URL: `http://localhost:3005/api/files/download/{id}` (not `/uploads/...`)
2. Check backend logs for "File downloaded:" message
3. Inspect response headers in DevTools Network tab

### Issue: 404 Not Found
**Check:**
1. Document exists in database: `SELECT * FROM application_documents WHERE id = 'uuid';`
2. File exists on disk: `ls -la backend/uploads/{applicationId}/`
3. Backend console for error messages

### Issue: Wrong filename
**Check:**
1. Database has `original_name` column populated
2. Backend query: `SELECT original_name FROM application_documents WHERE id = 'uuid';`
3. Backend logs show correct filename

## Browser Behavior Reference

| File Type | View Button | Download Button |
|-----------|-------------|-----------------|
| PDF | Opens in browser | Downloads |
| JPEG/PNG | Displays inline | Downloads |
| DOCX | Downloads | Downloads |
| XLSX | Downloads | Downloads |
| TXT | Displays inline | Downloads |
| ZIP | Downloads | Downloads |

## Success! 🎉

Download button now works as expected:
- ✅ PDFs download instead of opening
- ✅ All files download with original filename
- ✅ View button still opens PDFs in browser
- ✅ Clean separation of view vs download behavior
- ✅ Backend logging for audit trail
- ✅ Proper error handling

The difference is clear:
- **View (👁️)**: Preview in browser (when possible)
- **Download (⬇️)**: Always download to disk
