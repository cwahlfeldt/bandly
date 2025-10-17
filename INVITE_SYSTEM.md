# Band Invite System

## UPDATED - Unified Invitation System

A comprehensive invitation system for inviting new and existing users to join bands. This system uses a **single source of truth** (`band_invitations` table) for all invitation types.

## Features

- **Secure invite tokens**: Cryptographically secure UUID tokens for each invitation
- **Flexible invite options**:
  - Single-use or multi-use invitations
  - Configurable expiration (1 day, 7 days, 30 days, never)
  - Optional email targeting
- **Deep linking**: Direct app navigation via `bandly://invite/{token}` URLs
- **New user onboarding**: Seamless signup → band join flow
- **Existing user support**: Sign in → band join flow
- **Invite management**: View, track, and revoke invitations

## Setup

### 1. Database Setup

Run the SQL migration provided in the initial implementation to create:
- `band_invitations` table with all necessary fields
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

### 2. Update Database Types

After creating the table in Supabase, regenerate your TypeScript types:

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

## User Flow

### For Band Members (Creating Invites)

1. Navigate to a band detail page → Click "Invite Member"
2. Choose invite type:

   **Option A: Email-Based Invite**
   - Enter recipient's email address
   - System checks if user exists
   - Creates invitation with email attached
   - If user exists: Shows up in their Invitations page automatically
   - If new user: Share generated link for signup
   - Single-use, expires in 7 days

   **Option B: Shareable Link**
   - Generate a general invitation link
   - Can be shared with multiple people (up to 10 uses)
   - Expires in 30 days
   - Copy link or share via native share dialog

### For Invitees (Accepting Invites)

#### New Users (Signing Up):
1. Click invite link → Opens app at `/invite/{token}`
2. See band preview with details
3. Click "Create Account & Join"
4. Fill out signup form
5. After signup → **Automatically added to band with `status: 'active'`**
6. Redirected to band detail page

#### Existing Users (Not Logged In):
1. Click invite link → Opens app at `/invite/{token}`
2. See band preview with details
3. Click "Sign In to Join"
4. Sign in with credentials
5. Creates `band_members` entry with **`status: 'pending'`**
6. Redirected to Invitations page to formally accept
7. User must click "Accept" from Invitations page
8. Status changes to `'active'` and user can access the band

#### Existing Users (Already Logged In):
1. Click invite link → Opens app at `/invite/{token}`
2. See band preview with details
3. Click "Accept Invitation"
4. Creates `band_members` entry with **`status: 'pending'`**
5. Shows message: "Check your Invitations page to accept"
6. Redirected to Invitations page
7. User clicks "Accept" to join the band

## File Structure

```
lib/
  invites.ts                          # Core invite utilities and API functions

contexts/
  InviteContext.tsx                   # React context for invite state management

components/
  InviteModal.tsx                     # Modal for creating invitations

app/
  (app)/
    invite/
      [token].tsx                     # Invite acceptance screen
    bands/
      [id].tsx                        # Band detail with invite button
      [id]/
        invites.tsx                   # Invite management screen
  (auth)/
    sign-in.tsx                       # Enhanced with invite handling
    sign-up.tsx                       # Enhanced with invite handling
```

## API Functions

### `lib/invites.ts`

#### `createInvitation(params)`
Creates a new band invitation.
```typescript
const invitation = await createInvitation({
  bandId: 'uuid',
  invitedBy: 'user-uuid',
  maxUses: 1,              // null for unlimited
  expiresInDays: 7,        // null for never
  email: 'optional@email.com',
  role: 'member'
});
```

#### `validateInviteToken(token)`
Validates an invitation token and returns band details.
```typescript
const result = await validateInviteToken(token);
// { valid: true, invitation: {...} } or { valid: false, error: '...' }
```

#### `acceptInvitation(token, userId, isNewSignup?)`
Accepts an invitation and adds user to band.
```typescript
const result = await acceptInvitation(token, userId, isNewSignup);
// Returns: { bandId: 'uuid', alreadyMember: false, isPending: boolean }

// isNewSignup = true  → creates active member (skip invitations page)
// isNewSignup = false → creates pending member (must accept from invitations page)
```

#### `revokeInvitation(invitationId)`
Revokes an invitation.
```typescript
await revokeInvitation(invitationId);
```

#### `getBandInvitations(bandId)`
Fetches all invitations for a band.
```typescript
const invitations = await getBandInvitations(bandId);
```

#### `generateInviteUrl(token)`
Generates the full invite URL.
```typescript
const url = generateInviteUrl(token);
// Returns: bandly://invite/{token} (production)
// or http://localhost:8081/invite/{token} (development)
```

## Context Hook

### `useInvite()`

```typescript
const {
  // Pending invite token (stored before auth)
  pendingInviteToken,
  setPendingInviteToken,

  // Core functions
  createInvite,
  validateInvite,
  acceptInvite,
  revokeInvite,
  fetchBandInvites,

  // State
  isLoading,
  error
} = useInvite();
```

## Deep Linking Configuration

The app is already configured with the scheme `bandly://` in `app.json`:

```json
{
  "expo": {
    "scheme": "bandly"
  }
}
```

Invite URLs will open the app at the invite acceptance screen.

## Security Features

1. **Cryptographically secure tokens**: Using `crypto.randomUUID()`
2. **Token validation**: Checks expiration, usage limits, and status
3. **RLS policies**: Database-level security for invitations
4. **Status tracking**: pending → accepted/expired/revoked
5. **Usage tracking**: Prevents over-use of limited invitations
6. **Duplicate prevention**: Checks for existing band membership

## Invite Statuses

- **pending**: Active invitation, can be used
- **accepted**: Single-use invite that has been used
- **expired**: Past expiration date (auto-updated on validation)
- **revoked**: Manually revoked by band member

## Customization

### Changing Invite URL Domain

Edit `lib/invites.ts`:

```typescript
export function generateInviteUrl(token: string): string {
  const baseUrl = __DEV__
    ? 'http://localhost:8081'
    : 'https://yourdomain.com'; // Change this

  return `${baseUrl}/invite/${token}`;
}
```

### Adding Custom Invite Roles

Update the database role constraint and modify the InviteModal to include additional role options.

### Email Notifications (Not Yet Implemented)

**Current Status**: Email notifications are not configured. Users must manually share invitation links.

**To implement**, integrate an email service in the invite creation flow:

#### Option 1: Supabase Edge Functions + Email Service
```typescript
// Create Edge Function: supabase/functions/send-invite-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email, inviteUrl, bandName } = await req.json()

  // Use SendGrid, Resend, or other email service
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'invites@bandly.app',
      to: email,
      subject: `You've been invited to join ${bandName}`,
      html: `
        <h1>Band Invitation</h1>
        <p>You've been invited to join ${bandName} on Bandly!</p>
        <a href="${inviteUrl}">Accept Invitation</a>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then call it from your app:
```typescript
if (email) {
  await supabase.functions.invoke('send-invite-email', {
    body: { email, inviteUrl, bandName }
  });
}
```

#### Option 2: Direct Email Service Integration
```typescript
// In app code (requires API keys in .env)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

if (email) {
  await resend.emails.send({
    from: 'invites@bandly.app',
    to: email,
    subject: `You've been invited to join ${bandName}`,
    html: `<a href="${inviteUrl}">Accept Invitation</a>`,
  });
}
```

## Testing

### Manual Testing Steps

1. **Create an invite**:
   - Go to a band → Click invite button
   - Configure options → Create link

2. **Test with new user**:
   - Copy invite link
   - Log out
   - Open invite link
   - Create new account
   - Verify band membership

3. **Test with existing user**:
   - Copy invite link
   - Log out
   - Open invite link
   - Sign in
   - Verify band membership

4. **Test expiration**:
   - Create invite with short expiration
   - Wait for expiration
   - Try to use invite → Should show error

5. **Test revocation**:
   - Create invite
   - Go to invite management screen
   - Revoke invite
   - Try to use invite → Should show error

## Troubleshooting

### Invite link doesn't open the app
- Ensure deep linking is configured properly
- Check that the app scheme matches in `app.json`
- Test with `npx uri-scheme open bandly://invite/test --ios` (or --android)

### User not added to band
- Check Supabase logs for errors
- Verify RLS policies allow the operation
- Check that `band_members` table accepts the insert

### Types not matching
- Regenerate database types after schema changes
- Restart TypeScript server in your IDE

## Key Implementation Details

### Why Two Different Status Flows?

**New Signups (`isNewSignup: true`):**
- Get `status: 'active'` immediately
- Skip the Invitations page
- Reasoning: They clicked the link specifically to join, already showed intent

**Existing Users (`isNewSignup: false`):**
- Get `status: 'pending'` first
- Must accept from Invitations page
- Reasoning: They may have clicked accidentally, gives them control

### Database Flow

```
1. Invitation Created
   └─> band_invitations (status: 'pending')

2. User Clicks Link
   ├─> New User → Sign Up
   │   └─> band_members (status: 'active')
   │   └─> band_invitations (current_uses++)
   │
   └─> Existing User → Click Accept
       └─> band_members (status: 'pending')
       └─> band_invitations (current_uses++)

3. User Accepts from Invitations Page
   └─> band_members.status = 'active'
```

## Future Enhancements

- [ ] Email notification system (high priority)
- [ ] SMS invitation support
- [ ] QR code generation for in-person invites
- [ ] Invite analytics (views, accepts, declines)
- [ ] Batch invitation imports (CSV)
- [ ] Role-specific invite permissions
- [ ] Custom invitation messages
- [ ] Invitation templates
- [ ] Invite link preview cards (OpenGraph)
