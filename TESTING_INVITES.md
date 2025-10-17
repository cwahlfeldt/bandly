# Testing the Invite System

## Quick Summary of Fixes

✅ **Fixed band detail page query** - Corrected foreign key relationship syntax
✅ **Improved "already a member" messaging** - Better alerts when user is already in the band
✅ **Added detailed console logging** - Easy to debug issues

## Why You're Seeing "Already a Member"

You're currently logged in as the band owner/member. When you click your own invite link, the system correctly detects you're already in the band and prevents duplicate membership.

## How to Test the Full Invite Flow

### Option 1: Sign Out and Create New Account (Recommended)

1. **Sign out** of your current account
   - Go to Settings or Profile tab
   - Click "Sign Out"

2. **Click the invite link** (from clipboard or wherever you saved it)
   - You'll see the invite preview screen
   - Band name and details will be displayed

3. **Click "Create Account & Join"**
   - Fill out the signup form
   - After signup, you'll automatically join the band

4. **Success!** You'll be redirected to the band detail page as a new member

### Option 2: Use Incognito/Private Browser Window

1. **Copy the invite link** from your main browser/app
2. **Open an incognito/private window** (or different browser)
3. **Paste the invite link** in the URL bar
4. **Create a new account** through the invite flow
5. **Verify the new user is added** to the band

### Option 3: Use a Different Device

1. **Copy the invite link**
2. **Email or message it** to yourself
3. **Open on another device** (phone, tablet, different computer)
4. **Create a new account** there
5. **Test the full onboarding flow**

### Option 4: Use Another Email Account

1. **Sign out** of your current account
2. **Use a different email** to create a test account
3. **Click the invite link**
4. **Sign in with the test account**
5. **Accept the invitation**

## Complete Test Scenario

### Step 1: Create an Invite (As Band Owner)

1. Navigate to your band's detail page
2. Click the **UserPlus icon** in the top-right header OR click **"Invite Member"** in the Members tab
3. Configure invite options:
   - Max uses: 1 (for single use test)
   - Expires: 7 days
   - Leave email blank
4. Click **"Create Invite Link"**
5. **Copy the link** (or use Share button)

### Step 2: Test as New User

1. **Sign out** of your account
2. **Open the invite link** in your browser
3. You should see:
   - "Band Invitation" title
   - Band name and description
   - "Create Account & Join" button (primary)
   - "Sign In to Join" button (secondary)

4. **Click "Create Account & Join"**
5. Fill out the signup form:
   - Name: Test User
   - Email: testuser@example.com
   - Password: testpass123
   - Confirm Password: testpass123

6. **Submit the form**
7. After signup, you should:
   - See "Welcome!" alert
   - Be automatically added to the band
   - Be redirected to the band detail page

8. **Verify membership**:
   - You should see yourself in the Members tab
   - You should have "member" role
   - Dashboard should show the band

### Step 3: Test with Existing User

1. **Sign out** of the test account
2. **Sign in with a different existing account** (create one if needed)
3. **Open the same invite link** (if multi-use) or create a new one
4. You should see the invite preview screen
5. **Click "Accept Invitation"** (since you're already logged in)
6. You should be added to the band immediately

### Step 4: Verify Invite Limits

1. **Create a single-use invite** (max uses: 1)
2. **Use it to add a member**
3. **Try using the same link again**
4. Should see: "This invitation has already been used"

## Expected Console Output

When accepting an invite, you should see:
```
[acceptInvitation] Starting with token: <uuid> userId: <uuid>
[acceptInvitation] Validation result: { valid: true, invitation: {...} }
[acceptInvitation] Invitation details: { band_id: "...", ... }
[acceptInvitation] Existing member check: { existingMember: null, memberCheckError: {...} }
[acceptInvitation] Adding new member to band
[acceptInvitation] Updating invitation usage
[acceptInvitation] Successfully accepted invitation
```

## Common Issues & Solutions

### Issue: "Already a Member" when testing
**Solution**: You're testing with the same account that's already in the band. Sign out and create a new account.

### Issue: "Invalid invitation token"
**Solution**:
- Check that the `band_invitations` table exists in Supabase
- Verify the token in the URL matches one in the database
- Check if the invite has expired

### Issue: Band members query fails
**Solution**: The foreign key relationship might need adjusting. Check your database schema for the exact foreign key name.

### Issue: Nothing happens when clicking "Accept"
**Solution**: Check the console for detailed error logs. Look for database errors or RLS policy issues.

## Database Verification

To verify invites are created properly, check your Supabase database:

```sql
-- View all invitations
SELECT * FROM band_invitations;

-- View invitation with band details
SELECT
  bi.*,
  b.name as band_name
FROM band_invitations bi
JOIN bands b ON bi.band_id = b.id;

-- Check band members
SELECT
  bm.*,
  p.name as member_name,
  b.name as band_name
FROM band_members bm
JOIN profiles p ON bm.user_id = p.id
JOIN bands b ON bm.band_id = b.id;
```

## Success Criteria

✅ Band owner can create invite links
✅ Invite links can be copied and shared
✅ New users can sign up through invite link
✅ Existing users can sign in through invite link
✅ Users are automatically added to the correct band
✅ Single-use invites are consumed after first use
✅ Multi-use invites can be used multiple times
✅ Expired invites show appropriate error message
✅ Already-member users see friendly message
✅ Band member list updates after invite acceptance

## Need Help?

If you're still experiencing issues:

1. **Check the console logs** - Look for `[acceptInvitation]` messages
2. **Verify database table** - Ensure `band_invitations` table exists
3. **Check RLS policies** - Make sure they're configured correctly
4. **Review TypeScript types** - Regenerate if schema changed
5. **Clear app cache** - Sometimes helps with stale data

Happy testing! 🎉
