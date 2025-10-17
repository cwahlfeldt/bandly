# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bandly** is a React Native cross-platform app (iOS, Android, Web) for band management and collaboration. Built with Expo and React Router, using Supabase as the backend.

## Development Commands

```bash
# Start development server (clears cache automatically)
npm run dev

# Platform-specific development
npm run android    # Launch Android emulator
npm run ios        # Launch iOS simulator (Mac only)
npm run web        # Launch in browser

# Maintenance
npm run clean      # Remove .expo and node_modules

# Adding UI components
npx @react-native-reusables/cli@latest add [component-names]
# e.g., npx @react-native-reusables/cli@latest add input textarea
```

## Architecture

### Navigation Structure (Expo Router)

File-based routing with three main route groups:

1. **Root (`app/`)**: Entry point with auth check and redirect
2. **Auth Group (`app/(auth)/`)**: Unauthenticated flows (sign-in, sign-up)
3. **App Group (`app/(app)/`)**: Protected routes with auth guard
   - **Tabs (`(tabs)/`)**: 5-tab bottom navigation (Dashboard, Calendar, Chats, Profile, Settings)
   - **Bands (`bands/`)**: Band detail, invite, and creation screens
   - **Other**: Settings, invitations

Route guards are implemented in `app/(app)/_layout.tsx` to protect authenticated routes.

### State Management

Two React Context providers wrap the entire app:

1. **AuthContext** ([contexts/AuthContext.tsx](contexts/AuthContext.tsx))
   - Handles Supabase authentication (sign-up, sign-in, sign-out)
   - Provides `useAuth()` hook with `user`, `signUp()`, `signIn()`, `signOut()`

2. **SelectedBandContext** ([contexts/SelectedBandContext.tsx](contexts/SelectedBandContext.tsx))
   - Manages currently selected band with AsyncStorage persistence
   - Provides `useSelectedBand()` hook with `selectedBand`, `setSelectedBand()`, `bands`, `refreshBands()`
   - Persists selection to `@bandly_selected_band_id`

Use these hooks in any component that needs auth or band state.

### Backend Integration (Supabase)

Client initialized in [lib/supabase.ts](lib/supabase.ts) with type-safe configuration.

**Database tables:**
- `profiles` - User information
- `bands` - Band metadata
- `band_members` - Membership with roles (owner/member) and status (active/pending/inactive)
- `events` - Band events/rehearsals
- `audio_tracks` - Uploaded music files
- `setlists` - Performance setlists
- `setlist_songs` - Songs within setlists
- `chat_messages` - Band chat history

**Key patterns:**
- All types auto-generated in [types/database.types.ts](types/database.types.ts)
- Filter queries by `selectedBand.id` for band-specific data
- Handle errors gracefully with try-catch and user-facing alerts
- Session persists via AsyncStorage (configured in supabase client)

### Styling (NativeWind/Tailwind)

- Use Tailwind utility classes via NativeWind
- Dark mode supported via class strategy
- Theme colors defined in [tailwind.config.js](tailwind.config.js) using CSS custom properties
- Navigation theme colors exported from [lib/theme.ts](lib/theme.ts)
- Global CSS in [global.css](global.css)

**Example:**
```tsx
<View className="flex-1 bg-background p-4">
  <Text className="text-foreground text-lg font-semibold">Hello</Text>
</View>
```

### Component Organization

- **UI Primitives** (`components/ui/`): Reusable shadcn-style components (Button, Input, Card, Avatar, etc.)
- **Feature Components** (`components/`): Domain-specific components (BandCard, BandSelector, AudioTrackCard, etc.)
- **Screens** (`app/`): Route handlers that compose components

**Import alias:** Use `@/*` for imports from root (configured in tsconfig.json)

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
```

## Common Development Patterns

### Adding a New Screen

1. Create file in `app/(app)/feature-name.tsx` or `app/(app)/feature-name/[id].tsx` for dynamic routes
2. Import necessary contexts:
   ```tsx
   import { useAuth } from '@/contexts/AuthContext';
   import { useSelectedBand } from '@/contexts/SelectedBandContext';
   ```
3. Use `router` from `expo-router` for navigation
4. Style with Tailwind classes

### Querying Supabase Data

```tsx
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

// Fetch band members
const { data, error } = await supabase
  .from('band_members')
  .select('*, profiles(*)')
  .eq('band_id', selectedBand.id)
  .eq('status', 'active');
```

### Creating a Modal

Use the BandSelector component as a reference ([components/BandSelector.tsx](components/BandSelector.tsx)):
- Create a state for visibility: `const [isVisible, setIsVisible] = useState(false)`
- Use React Native's `Modal` component with `transparent` and `animationType`
- Wrap content in a centered view with backdrop

### Handling Navigation

```tsx
import { router } from 'expo-router';

// Navigate to a route
router.push('/bands/123');

// Navigate with params
router.push({ pathname: '/bands/[id]', params: { id: '123' } });

// Go back
router.back();
```

## Environment Setup

Ensure `.env` contains:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are validated at runtime in [lib/supabase.ts](lib/supabase.ts:5-10).

## Build & Deployment

EAS configuration in [eas.json](eas.json) with three profiles:
- **development**: Internal distribution with dev client
- **preview**: Internal testing builds
- **production**: Auto-increment versioning, ready for app stores

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Project Configuration Files

- [app.json](app.json) - Expo app configuration (metadata, icons, splash screens)
- [metro.config.js](metro.config.js) - Metro bundler with NativeWind integration
- [babel.config.js](babel.config.js) - Babel with JSX runtime for NativeWind
- [components.json](components.json) - Shadcn components configuration (aliases, paths)
- [.prettierrc](.prettierrc) - Code formatting rules (100 char width, single quotes)

## Key Dependencies

- **expo** (54.0.0) - React Native framework
- **expo-router** (6.0.10) - File-based navigation
- **@supabase/supabase-js** (2.75.0) - Backend client
- **nativewind** (4.2.1) - Tailwind CSS for React Native
- **lucide-react-native** (0.545.0) - Icon library
- **react-native-calendars** (1.1313.0) - Calendar UI
- **expo-av**, **expo-image-picker**, **expo-document-picker** - Media handling

## Notes

- All development scripts use `-c` flag to clear cache automatically
- TypeScript strict mode enabled
- New Architecture enabled for React Native
- No test suite currently present
- Platform-specific builds require proper environment setup (Xcode for iOS, Android SDK for Android)
