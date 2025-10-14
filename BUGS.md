# Bug Fixes

## ✅ FIXED: Authentication Issues

### Issue: Cannot sign in after signing up (HTTP 400 error)

**Root Cause**: Supabase has email confirmation enabled by default. When a user signs up, their account is created but they cannot sign in until they verify their email address.

**Solution Applied**:
1. Updated sign-up flow to detect if email confirmation is required
2. Shows appropriate message based on Supabase settings
3. If email confirmation is disabled, user is automatically signed in after sign-up

**To Disable Email Confirmation in Supabase (Recommended for Development)**:

1. Go to your Supabase Dashboard: https://cbisndfozficgdcojpyi.supabase.co
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Email Settings**
4. Toggle OFF "Confirm email"
5. Click **Save**

After disabling email confirmation:
- New users will be automatically signed in after sign up
- Existing users who haven't confirmed can now sign in
- No email verification is required

**For Production**:
Keep email confirmation enabled and implement proper email verification flow with:
- Email templates configured in Supabase
- Deep linking to handle email verification callbacks
- Proper user feedback during the verification process

### Testing

After applying the fix and disabling email confirmation:
1. Sign up with a new account
2. You should be automatically signed in and redirected to the app
3. Sign out and sign in again - should work without issues

---

## Files Modified

- `contexts/AuthContext.tsx` - Updated signUp to return data and check session
- `app/(auth)/sign-up.tsx` - Added logic to handle confirmed vs unconfirmed users
- Fixed redirect after successful sign-up

---

## Action Required

**⚠️ IMPORTANT**: Disable email confirmation in Supabase dashboard for development (see instructions above).

---

## ⚠️ REQUIRES FIX: RLS Policy Issues Preventing Band Creation

### Issue 1: "infinite recursion detected in policy for relation band_members"
### Issue 2: "new row violates row-level security policy for table bands"

**Root Cause**: Complex RLS policies with circular references and missing INSERT permissions.

**Solution - Run TWO SQL files**:

### Step 1: Fix band_members table

Run [FIX_RLS_POLICIES.sql](FIX_RLS_POLICIES.sql) in your Supabase SQL Editor.

This simplifies the `band_members` policies to allow all authenticated users full access, eliminating recursion issues.

### Step 2: Fix bands table

Run [FIX_BANDS_RLS.sql](FIX_BANDS_RLS.sql) in your Supabase SQL Editor.

This adds proper INSERT permission for authenticated users to create bands.

**Steps to Fix**:

1. Go to your Supabase Dashboard: https://cbisndfozficgdcojpyi.supabase.co
2. Navigate to **SQL Editor**
3. **FIRST**: Copy and execute the entire contents of [FIX_RLS_POLICIES.sql](FIX_RLS_POLICIES.sql)
4. **SECOND**: Copy and execute the entire contents of [FIX_BANDS_RLS.sql](FIX_BANDS_RLS.sql)
5. Try creating a band again

**What the fixes do**:
- ✅ Removes all recursion from band_members policies
- ✅ Allows authenticated users to create bands
- ✅ Allows authenticated users to manage band members
- ✅ Band creators can update/delete their own bands
- ✅ All users can view all bands (app-level security handles visibility)

**Note**: These are simplified policies for development. For production, you may want to add stricter policies with application-level checks.
