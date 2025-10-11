# ✅ Approved Amount Fix

## Problem
Health Centre was approving ₹5000 out of ₹5500, but OBC still saw ₹5500 when the application came back for final review.

## Root Cause
The `handleApprove()` function in `HealthCentreDashboard.tsx` was **only updating the status** to `back_to_obc`, but **NOT saving the approved amount** to the database.

```typescript
// ❌ BEFORE - No approved amount saved
await adminService.updateApplicationStatus(
    selectedClaim.id,
    "back_to_obc",
    remarks || "Reviewed by Health Centre..."
);
```

## Solution
Updated `handleApprove()` to:
1. Calculate total approved amount using `getTotalPassed()` helper
2. Pass it as the 4th parameter (`amountPassed`) to `updateApplicationStatus()`

```typescript
// ✅ AFTER - Approved amount saved
const totalApprovedAmount = getTotalPassed();
await adminService.updateApplicationStatus(
    selectedClaim.id,
    "back_to_obc",
    remarks || "Reviewed by Health Centre...",
    totalApprovedAmount  // 🎯 This saves the approved amount!
);
```

## Backend Flow (Already Working)
The backend route `/applications/:id/status` already handled this:

```typescript
// If amount passed is provided, update it
if (amountPassed !== undefined && updatedApplication) {
    await applicationRepo.update(id, {
        totalAmountPassed: amountPassed,
    });
}
```

## What This Fixes
✅ Health Centre approves ₹5000 → Saves to `medical_applications.approved_amount`
✅ Application returns to OBC with status `back_to_obc`
✅ OBC sees ₹5000 in the review modal (not ₹5500)
✅ The `totalAmountPassed` field is properly populated

## Testing
1. Health Centre reviews application with ₹5500 claimed
2. Health Centre edits expenses, approves total of ₹5000
3. Click "Approve and Forward"
4. Check database: `SELECT approved_amount FROM medical_applications WHERE id = '...'`
5. Should show 5000.00
6. OBC opens application → Should see "Amount Approved: ₹5,000"

## Files Changed
- **frontend/src/pages/HealthCentreDashboard.tsx** (lines 100-123)
  - Added `totalApprovedAmount` calculation
  - Passed it to `updateApplicationStatus()`

## Notes
- Individual expense item approved amounts are NOT persisted (only the total)
- The `editingExpenses` array tracks individual amounts in UI state
- If you need expense-level approved amounts saved, we need to:
  1. Create PATCH `/applications/:id/expenses/:expenseId` endpoint
  2. Update each expense before calling status update
  3. Add this to Health Centre's approval flow

For now, **the total approved amount is what matters** for the workflow.
