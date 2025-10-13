# 🔍 File Upload Debugging Guide

## Problem
- Folders created but files not uploaded
- Progress bar not showing
- Need to debug what's happening

## ✅ Debug Logs Added

I've added comprehensive console logging at every step:

### 1. When You Select Files (Step 5)
```javascript
=== FILES SELECTED IN STEP 5 ===
Number of files: 2
Files: [
  {name: "bill.pdf", size: 52341, type: "application/pdf", isFile: true},
  {name: "receipt.jpg", size: 123456, type: "image/jpeg", isFile: true}
]
Files added to formData.documents.uploadedFiles
Total files now: 2
```

### 2. When Step 5 Renders
```javascript
=== DOCUMENT UPLOAD STEP RENDERED ===
Current uploaded files: [File, File]
Number of files: 2
File types: ['File object', 'File object']  ← Should say 'File object'!
```

### 3. When Moving to Step 6
```javascript
=== STEP 5 SUBMIT (Moving to Step 6) ===
Files in formData: 2
```

### 4. When Final Submit (Step 6 → Submit)
```javascript
=== FINAL FORM SUBMISSION ===
Documents: {uploadedFiles: [File, File], ...}
Number of files: 2
Files are File objects?: [true, true]  ← Should be ALL true!
```

### 5. In the Upload Hook
```javascript
=== CHECKING UPLOADED FILES ===
Found 2 files in formData
Files: [File, File]
Actual File objects: 2  ← If this is 0, files were lost!
```

### 6. Backend Should Receive
```javascript
=== FILE UPLOAD REQUEST RECEIVED ===
Files count: 2
```

## 🧪 Testing Steps

### Step 1: Open Browser Console
1. Press `F12` or right-click → Inspect
2. Go to **Console** tab
3. Clear the console (click 🚫 icon)

### Step 2: Fill the Form
1. Go to http://localhost:5173
2. Fill Steps 1-4 quickly (any data)
3. **Step 5**: Click "Choose Files"
4. Select 2 files (any PDFs or images)

### Step 3: Watch Console
You should see:
```
✅ === FILES SELECTED IN STEP 5 ===
✅ Number of files: 2
✅ isFile: true  (for each file)
```

**If you DON'T see this:** Files didn't get selected!

### Step 4: Move to Step 6
Click "Next: Declaration"

Watch console:
```
✅ === STEP 5 SUBMIT ===
✅ Files in formData: 2
```

### Step 5: Submit Application
Fill Step 6 and click "Submit Application"

Watch console for:
```
✅ === FINAL FORM SUBMISSION ===
✅ Number of files: 2
✅ Files are File objects?: [true, true]

✅ === CHECKING UPLOADED FILES ===
✅ Actual File objects: 2

✅ === UPLOAD DOCUMENTS CALLED ===
✅ Uploading 2 files...
```

### Step 6: Check Progress Bar
You should see in the top-right corner:
```
🔄 Uploading 2 file(s)... 75%
████████████████████░░░░░░░░░
```

**If progress bar doesn't show:**
- Check if `isSubmitting` is true
- Check if `uploadProgress` is updating
- Look for errors in console

### Step 7: Check Backend Terminal
Switch to backend terminal, you should see:
```
=== FILE UPLOAD REQUEST RECEIVED ===
Files count: 2
=== FILE UPLOAD SUCCESS ===
Files saved: 2
```

### Step 8: Verify Files on Disk
```bash
ls -lah backend/uploads/*/

# Should show your files!
```

## 🐛 Common Issues & Solutions

### Issue 1: "Actual File objects: 0"
**Problem**: Files were serialized by auto-save  
**Solution**: Don't refresh page after selecting files
**Fix**: Select files → Submit immediately

### Issue 2: "Files are File objects?: [false, false]"
**Problem**: Files became plain objects  
**Solution**: 
```javascript
// Check if you restored from localStorage
// If "⚠️ Files were lost" appears, re-upload files
```

### Issue 3: No upload logs in backend
**Problem**: Files not reaching backend  
**Checks**:
1. Is backend running on port 3005?
2. Check Network tab in browser (F12 → Network)
3. Look for POST to `/api/files/upload`
4. Check Request Payload - should show files

### Issue 4: Progress bar not showing
**Problem**: `uploadProgress` not updating  
**Checks**:
1. Console should show progress updates (0%, 50%, 75%, 100%)
2. Check if `isSubmitting` is true
3. Verify hook destructuring in EmployeeForm.tsx

### Issue 5: Folder created but empty
**Problem**: Backend receives request but no files  
**Checks**:
1. Backend logs: "Files count: 0"
2. FormData didn't include files
3. Check frontend logs for "Appending file X"

## 📊 Expected Full Console Flow

```javascript
// Step 5: Select files
=== FILES SELECTED IN STEP 5 ===
Number of files: 2 ✓
isFile: true ✓

// Step 5 → Step 6
=== STEP 5 SUBMIT ===
Files in formData: 2 ✓

// Step 6 → Submit
=== FINAL FORM SUBMISSION ===
Number of files: 2 ✓
Files are File objects?: [true, true] ✓

=== CHECKING UPLOADED FILES ===
Actual File objects: 2 ✓

=== UPLOAD DOCUMENTS CALLED ===
Uploading 2 files... ✓

// Progress updates
Submitting application... 0%
Application created! 50%
Uploading 2 file(s)... 75%
Completed! 100% ✓

// Backend (in backend terminal)
=== FILE UPLOAD REQUEST RECEIVED ===
Files count: 2 ✓
=== FILE UPLOAD SUCCESS ===
Files saved: 2 ✓
```

## 🎯 What to Report Back

After testing, tell me:

1. **What you see in browser console** (copy-paste the logs)
2. **Where it stops** (which log is the last one you see?)
3. **Any error messages** (red text in console)
4. **Backend logs** (what appears in backend terminal)
5. **Files on disk** (output of `ls backend/uploads/*/`)

## 🚨 Quick Diagnosis

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| No "FILES SELECTED" log | Files not selected | Click "Choose Files" button |
| "Actual File objects: 0" | Files serialized | Don't refresh, re-select files |
| No backend logs | Not reaching server | Check Network tab, port 3005 |
| Folder created, no files | Multer not receiving | Check FormData in Network |
| No progress bar | Hook not updating | Check `isSubmitting` value |

---

**Now go test it and copy-paste what you see in the console!** 🔍

The detailed logs will tell us exactly where the problem is.
