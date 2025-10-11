# Fix: Comment Author Showing as "Unknown"

## Problem
Comments in the review modal were showing "Unknown" as the author name instead of the actual user's name.

## Root Cause
The JWT token generated during login only included `{ userId, email, role }` but not the `name` field. When creating comments, the backend tried to use `req.user?.name` which was undefined, resulting in "Unknown" as the default value.

## Solution Applied

### 1. Updated JWT Token to Include Name ✅

**File**: `backend/src/routes/auth.ts`

**Before**:
```typescript
const generateToken = (userId: string, email: string, role: string): string => {
    return jwt.sign(
        { userId, email, role }, // ❌ No name
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
    );
};
```

**After**:
```typescript
const generateToken = (
    userId: string,
    email: string,
    role: string,
    name?: string  // ✅ Added name parameter
): string => {
    return jwt.sign(
        { userId, email, role, name },  // ✅ Name included in token
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
    );
};
```

### 2. Updated Login Route to Pass Name ✅

**File**: `backend/src/routes/auth.ts`

**Before**:
```typescript
const token = generateToken(user.id, user.email, user.role);
```

**After**:
```typescript
const token = generateToken(user.id, user.email, user.role, user.name);
```

### 3. Updated Register Route to Pass Name ✅

**File**: `backend/src/routes/auth.ts`

**Before**:
```typescript
const token = generateToken(newUser.id, newUser.email, newUser.role);
```

**After**:
```typescript
const token = generateToken(newUser.id, newUser.email, newUser.role, newUser.name);
```

### 4. Added Fallback for Old Tokens ✅

**File**: `backend/src/routes/reviews.ts`

For users who already have old tokens (without name), added logic to fetch the name from the database:

```typescript
let commenterName = req.user?.name;

// If name is not in token (old tokens), fetch from database
if (!commenterName && commenterId) {
    try {
        const db = await getDatabase();
        const userRepo = db.getUserRepository();
        const user = await userRepo.findById(commenterId);
        commenterName = user?.name || "Admin User";
    } catch (error) {
        logger.warn("Could not fetch user name for commenter");
        commenterName = "Admin User";
    }
}
```

## Testing Instructions

### For New Logins (Recommended)
1. **Logout** from the current session
2. **Login again** with any admin account:
   - OBC: `obc@jnu.ac.in` / `obc123`
   - Health: `health@jnu.ac.in` / `health123`
   - Super Admin: `admin@jnu.ac.in` / `super123`
3. Open any application review
4. Go to "Comments" tab
5. Add a new comment
6. **Verify**: Your name should now appear instead of "Unknown"

### For Existing Sessions
If you don't want to logout:
1. The backend fallback will fetch your name from the database
2. New comments should show the correct name
3. But it's better to re-login to get the updated token

## Expected Results

✅ **Before Fix**: "Unknown (admin)"  
✅ **After Fix**: "Your Actual Name (admin)"

## Files Modified

1. `backend/src/routes/auth.ts` - Updated token generation
2. `backend/src/routes/reviews.ts` - Added fallback for old tokens

## Notes

- **New users**: Will automatically get tokens with name
- **Existing users**: Need to re-login OR backend will fetch name from database
- **Old comments**: Will still show "Unknown" (already saved in database)
- **New comments**: Will show correct name

## Restart Required

**Backend only**:
```bash
cd backend
npm run dev
```

Frontend doesn't need restart, but users should **logout and login again** to get the updated JWT token with their name.
