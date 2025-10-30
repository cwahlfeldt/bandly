import { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/contexts/InviteContext';
import { navigate } from 'expo-router/build/global-state/routing';
import { showAlert } from '@/lib/alert';

export default function SignInScreen() {
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { setPendingInviteToken, acceptInvite } = useInvite();

  useEffect(() => {
    // Store pending invite token if provided
    if (inviteToken) {
      setPendingInviteToken(inviteToken);
    }
  }, [inviteToken]);

  const handleSignIn = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('[SignIn] Starting sign in process');
      const { data, error } = await signIn(email.trim(), password);

      if (error) {
        console.error('[SignIn] Sign in failed:', error.message);

        // Provide user-friendly error messages
        let errorMessage = error.message;

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage =
            'Please verify your email address before signing in. Check your inbox for a verification link.';
        } else if (error.message.includes('User not found')) {
          errorMessage =
            'No account found with this email address. Would you like to sign up instead?';
        } else if (error.message.includes('Network')) {
          errorMessage =
            'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage =
            'Request timed out. Please check your internet connection and try again.';
        }

        showAlert('Sign In Failed', errorMessage);
        return;
      }

      console.log('[SignIn] Sign in successful');

      // If there's a pending invite token, accept it
      if (inviteToken && data?.user) {
        try {
          console.log('[SignIn] Accepting pending invite');
          const result = await acceptInvite(inviteToken, data.user.id);

          showAlert(
            'Welcome!',
            result.alreadyMember
              ? 'You have signed in successfully!'
              : 'You have successfully joined the band!',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace(`/bands/${result.bandId}`);
                },
              },
            ]
          );
        } catch (inviteError) {
          console.error('[SignIn] Invite acceptance failed:', inviteError);
          showAlert(
            'Sign In Successful',
            'However, there was an issue accepting the invitation. You can try joining the band again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/(app)');
                },
              },
            ]
          );
        }
      } else {
        console.log('[SignIn] Navigating to app');
        router.replace('/(app)');
      }
    } catch (error) {
      console.error('[SignIn] Unexpected error during sign in:', error);
      showAlert(
        'Sign In Failed',
        'An unexpected error occurred. Please try again. If the problem persists, please contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      <ScrollView
        contentContainerClassName="flex-1 justify-center p-6"
        keyboardShouldPersistTaps="handled">
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-4xl font-bold">Welcome back</Text>
            <Text className="text-lg text-muted-foreground">
              {inviteToken ? 'Sign in to accept your band invitation' : 'Sign in to your account'}
            </Text>
          </View>

          {inviteToken && (
            <View className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                You'll be added to the band after signing in.
              </Text>
            </View>
          )}

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium">Email</Text>
              <Input
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">Password</Text>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                editable={!loading}
              />
            </View>

            <Button onPress={handleSignIn} disabled={loading}>
              <Text>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </Button>
          </View>

          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-muted-foreground">Don't have an account?</Text>
            {/* <Link href="/(auth)/sign-up" asChild> */}
            <Button
              variant="link"
              size="sm"
              disabled={loading}
              onPress={() => navigate('/(auth)/sign-up')}>
              <Text>Sign Up</Text>
            </Button>
            {/* </Link> */}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
