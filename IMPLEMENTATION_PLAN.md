# Bandly Implementation Plan

## Overview

Build a complete band management app with authentication, band management, scheduling, audio sharing, and real-time chat using React Native, Expo, Supabase, and React Native Reusables.

**Tech Stack:**

- React Native with Expo
- Expo Router for navigation
- Supabase for backend (auth, database, storage, realtime)
- React Native Reusables for UI components
- NativeWind for styling
- Bun as package manager

---

## Phase 1: Supabase Setup & Configuration

### 1.1 Install Supabase Dependencies

```bash
bun add @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
```

### 1.2 Environment Configuration

- Create `.env` file with Supabase credentials:
  ```
  EXPO_PUBLIC_SUPABASE_URL=add-here
  EXPO_PUBLIC_SUPABASE_ANON_KEY=add-here
  ```
- Add `.env` to `.gitignore`

### 1.3 Create Supabase Client

- File: `lib/supabase.ts`
- Configure client with AsyncStorage for session persistence
- Export typed client instance

### 1.4 Database Schema

Execute in Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bands table
create table bands (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  photo_url text,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Band members (junction table)
create table band_members (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references bands on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' not null, -- 'admin', 'member'
  status text default 'active' not null, -- 'pending', 'active'
  invited_by uuid references auth.users on delete set null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(band_id, user_id)
);

-- Events table
create table events (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references bands on delete cascade not null,
  name text not null,
  description text,
  event_date date not null,
  event_time time,
  location text,
  type text not null, -- 'show', 'practice', 'recording', 'other'
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audio tracks table
create table audio_tracks (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references bands on delete cascade not null,
  name text not null,
  description text,
  file_url text not null, -- Supabase storage URL
  file_size bigint,
  duration integer, -- in seconds
  uploaded_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Setlists table
create table setlists (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references bands on delete cascade not null,
  name text not null,
  description text,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Setlist songs table
create table setlist_songs (
  id uuid default uuid_generate_v4() primary key,
  setlist_id uuid references setlists on delete cascade not null,
  song_name text not null,
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat messages table
create table chat_messages (
  id uuid default uuid_generate_v4() primary key,
  band_id uuid references bands on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  message_type text default 'text' not null, -- 'text', 'audio', 'event', 'setlist'
  content text, -- Text content or JSON for rich messages
  reference_id uuid, -- ID of referenced audio/event/setlist
  reference_type text, -- 'audio_track', 'event', 'setlist'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index band_members_band_id_idx on band_members(band_id);
create index band_members_user_id_idx on band_members(user_id);
create index events_band_id_idx on events(band_id);
create index events_date_idx on events(event_date);
create index audio_tracks_band_id_idx on audio_tracks(band_id);
create index setlists_band_id_idx on setlists(band_id);
create index setlist_songs_setlist_id_idx on setlist_songs(setlist_id);
create index chat_messages_band_id_idx on chat_messages(band_id);
create index chat_messages_created_at_idx on chat_messages(created_at);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table bands enable row level security;
alter table band_members enable row level security;
alter table events enable row level security;
alter table audio_tracks enable row level security;
alter table setlists enable row level security;
alter table setlist_songs enable row level security;
alter table chat_messages enable row level security;

-- RLS Policies

-- Profiles: Users can read all profiles, update only their own
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Bands: Members can view their bands
create policy "Users can view bands they are members of"
  on bands for select
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = bands.id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Users can create bands"
  on bands for insert
  with check (auth.uid() = created_by);

create policy "Band admins can update bands"
  on bands for update
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = bands.id
      and band_members.user_id = auth.uid()
      and band_members.role = 'admin'
    )
  );

create policy "Band admins can delete bands"
  on bands for delete
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = bands.id
      and band_members.user_id = auth.uid()
      and band_members.role = 'admin'
    )
  );

-- Band members: Members can view other members
create policy "Band members can view other members"
  on band_members for select
  using (
    exists (
      select 1 from band_members bm
      where bm.band_id = band_members.band_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
    )
  );

create policy "Band admins can invite members"
  on band_members for insert
  with check (
    exists (
      select 1 from band_members
      where band_members.band_id = band_id
      and band_members.user_id = auth.uid()
      and band_members.role = 'admin'
    )
  );

create policy "Users can update their own membership"
  on band_members for update
  using (user_id = auth.uid());

create policy "Band admins can remove members"
  on band_members for delete
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = band_members.band_id
      and band_members.user_id = auth.uid()
      and band_members.role = 'admin'
    )
  );

-- Events: Band members can view, admins can manage
create policy "Band members can view events"
  on events for select
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = events.band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Band members can create events"
  on events for insert
  with check (
    exists (
      select 1 from band_members
      where band_members.band_id = band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Event creators can update their events"
  on events for update
  using (created_by = auth.uid());

create policy "Event creators can delete their events"
  on events for delete
  using (created_by = auth.uid());

-- Audio tracks: Similar to events
create policy "Band members can view audio tracks"
  on audio_tracks for select
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = audio_tracks.band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Band members can upload audio tracks"
  on audio_tracks for insert
  with check (
    exists (
      select 1 from band_members
      where band_members.band_id = band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Track uploaders can update their tracks"
  on audio_tracks for update
  using (uploaded_by = auth.uid());

create policy "Track uploaders can delete their tracks"
  on audio_tracks for delete
  using (uploaded_by = auth.uid());

-- Setlists: Similar to events
create policy "Band members can view setlists"
  on setlists for select
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = setlists.band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Band members can create setlists"
  on setlists for insert
  with check (
    exists (
      select 1 from band_members
      where band_members.band_id = band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Setlist creators can update their setlists"
  on setlists for update
  using (created_by = auth.uid());

create policy "Setlist creators can delete their setlists"
  on setlists for delete
  using (created_by = auth.uid());

-- Setlist songs: Inherit permissions from setlist
create policy "Users can view setlist songs"
  on setlist_songs for select
  using (
    exists (
      select 1 from setlists
      join band_members on band_members.band_id = setlists.band_id
      where setlists.id = setlist_songs.setlist_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Setlist creators can manage songs"
  on setlist_songs for all
  using (
    exists (
      select 1 from setlists
      where setlists.id = setlist_songs.setlist_id
      and setlists.created_by = auth.uid()
    )
  );

-- Chat messages: Band members can view and create
create policy "Band members can view chat messages"
  on chat_messages for select
  using (
    exists (
      select 1 from band_members
      where band_members.band_id = chat_messages.band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Band members can send messages"
  on chat_messages for insert
  with check (
    exists (
      select 1 from band_members
      where band_members.band_id = band_id
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Users can delete their own messages"
  on chat_messages for delete
  using (user_id = auth.uid());

-- Enable Realtime for chat
alter publication supabase_realtime add table chat_messages;

-- Create storage bucket for band photos
insert into storage.buckets (id, name, public) values ('band-photos', 'band-photos', true);

-- Storage policies for band photos
create policy "Band photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'band-photos');

create policy "Authenticated users can upload band photos"
  on storage.objects for insert
  with check (bucket_id = 'band-photos' and auth.role() = 'authenticated');

create policy "Users can update their own uploads"
  on storage.objects for update
  using (bucket_id = 'band-photos' and auth.uid() = owner);

create policy "Users can delete their own uploads"
  on storage.objects for delete
  using (bucket_id = 'band-photos' and auth.uid() = owner);

-- Create storage bucket for audio files
insert into storage.buckets (id, name, public) values ('audio-tracks', 'audio-tracks', false);

-- Storage policies for audio files
create policy "Band members can access audio files"
  on storage.objects for select
  using (
    bucket_id = 'audio-tracks' and
    exists (
      select 1 from audio_tracks
      join band_members on band_members.band_id = audio_tracks.band_id
      where audio_tracks.file_url like '%' || storage.objects.name || '%'
      and band_members.user_id = auth.uid()
      and band_members.status = 'active'
    )
  );

create policy "Authenticated users can upload audio files"
  on storage.objects for insert
  with check (bucket_id = 'audio-tracks' and auth.role() = 'authenticated');

create policy "Users can delete their own audio uploads"
  on storage.objects for delete
  using (bucket_id = 'audio-tracks' and auth.uid() = owner);

-- Create storage bucket for profile avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies for avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 1.5 Create TypeScript Types

- File: `types/database.types.ts`
- Generate types from Supabase schema or define manually
- Export all database types for type safety

---

## Phase 2: Authentication System

### 2.1 Create Auth Context & Hooks

- File: `contexts/AuthContext.tsx`
- Implement:
  - Auth state management (user, session, loading)
  - Sign up function with email/password
  - Sign in function
  - Sign out function
  - Session persistence and auto-refresh
  - Listen to auth state changes

### 2.2 Create Auth Screens

- File: `app/(auth)/sign-in.tsx`
  - Email and password inputs
  - Sign in button
  - Link to sign up
  - Error handling

- File: `app/(auth)/sign-up.tsx`
  - Name, email, password inputs
  - Password confirmation
  - Form validation
  - Sign up button
  - Link to sign in

- File: `app/(auth)/_layout.tsx`
  - Stack layout for auth screens
  - Styling for auth flow

### 2.3 Protected Routing

- File: `app/(app)/_layout.tsx`
  - Check auth state
  - Redirect to sign-in if not authenticated
  - Show loading state while checking auth

---

## Phase 3: Core UI Components

### 3.1 Install Additional React Native Reusables Components

```bash
# Use the CLI to add components
npx @react-native-reusables/cli@latest add card input avatar badge separator tabs
```

### 3.2 Install Additional Dependencies

```bash
bun add expo-image-picker expo-document-picker expo-av react-native-calendars
bun add date-fns # for date formatting
```

### 3.3 Create Custom Components

**File: `components/BandCard.tsx`**

- Display band photo, name, description
- Member count badge
- Press handler for navigation

**File: `components/EventCard.tsx`**

- Event name, type badge, date/time
- Location
- Press handler

**File: `components/AudioTrackCard.tsx`**

- Track name, duration
- Play button
- Uploaded by info

**File: `components/ChatMessage.tsx`**

- Message bubble with avatar
- Timestamp
- Support for text and rich content
- Different layouts for sent vs received

**File: `components/EmptyState.tsx`**

- Icon, title, description
- Optional action button
- Reusable for all empty lists

---

## Phase 4: Band Management

### 4.1 Dashboard Screen

**File: `app/(app)/(tabs)/index.tsx`**

- Fetch user's bands
- Display band cards in a list
- "Create Band" button
- Pull-to-refresh
- Empty state if no bands

### 4.2 Create Band Screen

**File: `app/(app)/bands/create.tsx`**

- Form with:
  - Name input (required)
  - Description textarea
  - Photo picker (optional)
- Upload photo to Supabase Storage
- Create band record
- Create band_member record with admin role
- Navigate to band detail on success

### 4.3 Band Detail Screen

**File: `app/(app)/bands/[id].tsx`**

- Display band info
- Tabs for: Members, Events, Audio, Setlists, Chat
- Edit/delete band (admin only)

### 4.4 Band Members Management

**File: `app/(app)/bands/[id]/members.tsx`**

- List of members with avatars
- Role badges (admin/member)
- "Invite Member" button (admin only)
- Remove member button (admin only)

**File: `app/(app)/bands/[id]/invite.tsx`**

- Input for email or username
- Search for user
- Send invitation (create pending band_member record)
- Could use email notification (future enhancement)

### 4.5 Accept/Manage Invitations

**File: `app/(app)/invitations.tsx`**

- List pending band invitations
- Accept/Decline buttons
- Update band_member status on accept
- Delete record on decline

---

## Phase 5: Events & Calendar

### 5.1 Calendar View

**File: `app/(app)/(tabs)/calendar.tsx`**

- Use `react-native-calendars` or custom calendar
- Mark dates with events
- Show events for selected date
- Filter by band (multi-band support)

### 5.2 Event List View

**File: `app/(app)/bands/[id]/events.tsx`**

- List all events for band
- Group by upcoming/past
- EventCard components
- "Create Event" button

### 5.3 Create Event Screen

**File: `app/(app)/events/create.tsx`**

- Form with:
  - Name (required)
  - Description
  - Date picker
  - Time picker
  - Location input
  - Type selector (show, practice, recording, other)
- Create event record
- Navigate back on success

### 5.4 Event Detail Screen

**File: `app/(app)/events/[id].tsx`**

- Display all event info
- Edit button (creator only)
- Delete button (creator only)
- Share in chat button

### 5.5 Dashboard Events Widget

- Update `app/(app)/(tabs)/index.tsx`
- Show upcoming events across all bands
- Quick view of today's and this week's events

---

## Phase 6: Audio Tracks

### 6.1 Audio Tracks List

**File: `app/(app)/bands/[id]/audio.tsx`**

- List all audio tracks for band
- AudioTrackCard components
- "Upload Track" button
- Pull-to-refresh

### 6.2 Upload Audio Screen

**File: `app/(app)/audio/upload.tsx`**

- Use `expo-document-picker` for audio file
- Form with:
  - Name (required)
  - Description
  - Preview selected file
- Upload to Supabase Storage
- Create audio_track record with metadata
- Navigate back on success

### 6.3 Audio Player Component

**File: `components/AudioPlayer.tsx`**

- Use `expo-av` for playback
- Play/pause button
- Progress bar
- Time display (current/total)
- Handle multiple tracks (stop others when playing new)

### 6.4 Audio Track Detail

**File: `app/(app)/audio/[id].tsx`**

- Display track info
- Full audio player
- Delete button (uploader only)
- Share in chat button

---

## Phase 7: Setlists

### 7.1 Setlists List

**File: `app/(app)/bands/[id]/setlists.tsx`**

- List all setlists for band
- Card showing name, song count
- "Create Setlist" button

### 7.2 Create Setlist Screen

**File: `app/(app)/setlists/create.tsx`**

- Form with:
  - Name (required)
  - Description
  - Add songs (name input + add button)
  - Reorder songs (drag handles)
- Create setlist and songs records
- Navigate back on success

### 7.3 Setlist Detail Screen

**File: `app/(app)/setlists/[id].tsx`**

- Display setlist name, description
- Ordered list of songs
- Edit button (creator only)
- Delete button (creator only)
- Share in chat button

### 7.4 Edit Setlist Screen

**File: `app/(app)/setlists/[id]/edit.tsx`**

- Pre-filled form like create
- Update setlist and songs
- Handle adding/removing/reordering songs

---

## Phase 8: Chat System

### 8.1 Chat Screen

**File: `app/(app)/bands/[id]/chat.tsx`**

- Fetch chat messages with Supabase
- Subscribe to realtime changes
- FlatList of ChatMessage components
- Auto-scroll to bottom on new messages
- Optimistic updates for sent messages

### 8.2 Chat Input Component

**File: `components/ChatInput.tsx`**

- Text input
- Send button
- Attachment button for sharing audio/events/setlists
- Handle sending text messages

### 8.3 Share in Chat Functionality

- Add "Share to Chat" feature in:
  - Audio track detail
  - Event detail
  - Setlist detail
- Create rich message with reference_id and reference_type
- Navigate to chat after sharing

### 8.4 Rich Message Rendering

- Update ChatMessage component to handle:
  - `message_type: 'audio'` - show AudioTrackCard inline
  - `message_type: 'event'` - show EventCard inline
  - `message_type: 'setlist'` - show setlist preview
- Make cards tappable to navigate to detail

### 8.5 Chat List (All Bands)

**File: `app/(app)/(tabs)/chats.tsx`**

- List all bands user is member of
- Show last message and timestamp
- Unread indicator (future enhancement)
- Navigate to band chat on press

---

## Phase 9: Navigation & Polish

### 9.1 Bottom Tab Navigation

**File: `app/(app)/(tabs)/_layout.tsx`**

- Configure Expo Router tabs:
  - Dashboard (home icon)
  - Calendar (calendar icon)
  - Chats (message icon)
  - Profile (user icon)
- Use lucide-react-native icons
- Active/inactive states

### 9.2 Profile/Settings Screen

**File: `app/(app)/(tabs)/profile.tsx`**

- Display user info
- Edit profile (name, avatar)
- Pending invitations link
- Sign out button
- App settings (future: notifications, theme, etc.)

### 9.3 Loading States

- Create `components/LoadingSpinner.tsx`
- Add loading states to all data fetching screens
- Skeleton loaders for lists (optional)

### 9.4 Error Handling

- Create `components/ErrorMessage.tsx`
- Toast notifications for errors
- Retry buttons where appropriate

### 9.5 Pull-to-Refresh

- Add to all list screens
- Use React Native's RefreshControl

### 9.6 Optimistic Updates

- Implement for:
  - Sending chat messages
  - Creating bands/events
  - Accepting invitations
- Update local state immediately, rollback on error

### 9.7 Empty States

- Add EmptyState component to:
  - Bands list (no bands)
  - Events list (no events)
  - Audio tracks list (no tracks)
  - Setlists list (no setlists)
  - Chat (no messages)
- Include helpful messages and CTAs

---

## Phase 10: Testing & Refinement

### 10.1 Test Complete User Flow

Follow the flow from PROJECT.md:

1. User signs up ✓
2. User signs in ✓
3. User creates a new band ✓
4. User invites another User2 to join the band ✓
5. User2 joins the band ✓
6. User starts chat with the band which includes User2 ✓
7. User books show for band ✓
8. User2 checks the band's calendar for upcoming events ✓
9. User checks dashboard for upcoming events ✓
10. User posts new audio track ✓
11. User2 listens to the audio track ✓
12. User2 shares the audio track in the chat with a message ✓
13. User clicks on the audio track in the chat to listen to it ✓
14. User starts new band ✓

### 10.2 Cross-Platform Testing

- Test on iOS simulator/device
- Test on Android emulator/device
- Test on web (Expo web)
- Fix platform-specific issues

### 10.3 Performance Optimization

- Optimize FlatList rendering (use keyExtractor, getItemLayout)
- Image optimization (use expo-image if needed)
- Lazy load images and audio
- Paginate large lists (chat messages, events)

### 10.4 Final Polish

- Consistent spacing and typography
- Proper keyboard handling (KeyboardAvoidingView)
- Form validation messages
- Proper back button behavior
- Deep linking setup (for invitations via email)

---

## Additional Notes

### Supabase Storage URLs

When uploading files:

```typescript
// Upload
const { data, error } = await supabase.storage
  .from('band-photos')
  .upload(`${bandId}/${fileName}`, file);

// Get public URL
const {
  data: { publicUrl },
} = supabase.storage.from('band-photos').getPublicUrl(data.path);
```

### Realtime Subscriptions

For chat messages:

```typescript
const channel = supabase
  .channel('chat-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `band_id=eq.${bandId}`,
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe();
```

### Environment Variables

Access in code:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

### Bun Commands

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run on specific platform
bun run ios
bun run android
bun run web
```

---

## Implementation Order Recommendation

1. **Start with Phase 1** - Set up Supabase completely before any UI work
2. **Then Phase 2** - Get authentication working
3. **Phase 3** - Add UI components as needed
4. **Phases 4-8** - Can be done in order, or prioritize based on importance
5. **Phase 9** - Polish as you go
6. **Phase 10** - Final testing and refinement

Good luck building Bandly! 🎸🎵
