# Band Invite System

A comprehensive invitation system for inviting new and existing users to join bands in the Bandly app.

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

1. Navigate to a band detail page
2. Click the "Invite Member" button (in header or Members tab)
3. Configure invite options:
   - Email (optional - for targeted invites)
   - Maximum uses (1, 5, 10, or unlimited)
   - Expiration time (1, 7, 30 days, or never)
4. Create the invite link
5. Copy or share the link via native share dialog

### For Invitees (Accepting Invites)

#### New Users:
1. Click invite link → Opens app at `/invite/{token}`
2. See band preview with details
3. Click "Create Account & Join"
4. Fill out signup form
5. After signup → Automatically joined to band
6. Redirected to band detail page

#### Existing Users:
1. Click invite link → Opens app at `/invite/{token}`
2. See band preview with details
3. Click "Sign In to Join"
4. Sign in with credentials
5. After signin → Automatically joined to band
6. Redirected to band detail page

#### Already Logged In:
1. Click invite link → Opens app at `/invite/{token}`
2. See band preview with details
3. Click "Accept Invitation"
4. Immediately joined to band
5. Redirected to band detail page

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

#### `acceptInvitation(token, userId)`
Accepts an invitation and adds user to band.
```typescript
const result = await acceptInvitation(token, userId);
// { bandId: 'uuid', alreadyMember: false }
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

### Email Notifications

To send invitation emails, integrate an email service in the `createInvitation` function:

```typescript
if (email) {
  await sendInvitationEmail({
    to: email,
    inviteUrl: generateInviteUrl(token),
    bandName: '...',
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

## Future Enhancements

- Email invitations with notification system
- QR code generation for in-person invites
- Invite analytics (views, accepts, declines)
- Batch invitations
- Role-specific invite permissions
- Custom invite messages
