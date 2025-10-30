import { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/contexts/InviteContext';
import { showAlert } from '@/lib/alert';

export default function SignUpScreen() {
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { setPendingInviteToken, acceptInvite } = useInvite();

  useEffect(() => {
    // Store pending invite token if provided
    if (inviteToken) {
      setPendingInviteToken(inviteToken);
    }
  }, [inviteToken]);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('[SignUp] Starting sign up process');
      const { data, error } = await signUp(email.trim(), password, name.trim());

      if (error) {
        console.error('[SignUp] Sign up failed:', error.message);

        // Provide user-friendly error messages
        let errorMessage = error.message;

        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Email rate limit exceeded')) {
          errorMessage = 'Too many signup attempts. Please try again in a few minutes.';
        } else if (error.message.includes('Network')) {
          errorMessage =
            'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage =
            'Request timed out. Please check your internet connection and try again.';
        }

        showAlert('Sign Up Failed', errorMessage);
        return;
      }

      console.log('[SignUp] Sign up successful, processing result');

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        console.log('[SignUp] Email confirmation required');
        // Email confirmation required
        showAlert(
          'Check your email',
          inviteToken
            ? 'Please check your email to verify your account. After verification, sign in to accept your band invitation.'
            : 'Please check your email to verify your account before signing in.',
          [
            {
              text: 'OK',
              onPress: () => {
                const params = inviteToken ? { inviteToken } : {};
                router.replace({ pathname: '/(auth)/sign-in', params });
              },
            },
          ]
        );
      } else if (data?.session && data?.user) {
        console.log('[SignUp] User automatically signed in');
        // User is automatically signed in (email confirmation disabled)
        // If there's a pending invite token, accept it
        if (inviteToken) {
          try {
            console.log('[SignUp] Accepting pending invite');
            // Pass isNewSignup=true so they get active status immediately
            const result = await acceptInvite(inviteToken, data.user.id, true);

            // Navigate to band page after successful signup and invite acceptance
            setTimeout(() => {
              router.replace(`/bands/${result.bandId}`);
            }, 500);
          } catch (inviteError) {
            console.error('[SignUp] Invite acceptance failed:', inviteError);

            // Even if invite fails, user is logged in, so navigate to app
            showAlert(
              'Account Created',
              'Your account has been created, but there was an issue accepting the invitation. You can try joining the band from the invite link again.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.replace('/');
                  },
                },
              ]
            );
          }
        } else {
          console.log('[SignUp] Navigating to app');
          // No invite token - just navigate to app
          // Give AuthContext a moment to process the session
          setTimeout(() => {
            router.replace('/');
          }, 300);
        }
      } else {
        console.log('[SignUp] Unexpected state, redirecting to sign in');
        // Fallback - go to sign in
        const params = inviteToken ? { inviteToken } : {};
        router.replace({ pathname: '/(auth)/sign-in', params });
      }
    } catch (error) {
      console.error('[SignUp] Unexpected error during sign up:', error);
      showAlert(
        'Sign Up Failed',
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
            <Text className="text-4xl font-bold">Create account</Text>
            <Text className="text-lg text-muted-foreground">
              {inviteToken ? 'Sign up to join your band' : 'Sign up to get started'}
            </Text>
          </View>

          {inviteToken && (
            <View className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <Text className="text-blue-700 dark:text-blue-300 text-sm">
                You'll be added to the band after creating your account.
              </Text>
            </View>
          )}

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium">Name</Text>
              <Input
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            </View>

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
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">Confirm Password</Text>
              <Input
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <Button onPress={handleSignUp} disabled={loading}>
              <Text>{loading ? 'Creating account...' : 'Sign Up'}</Text>
            </Button>
          </View>

          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-muted-foreground">Already have an account?</Text>
            <Link
              href={
                inviteToken
                  ? { pathname: '/(auth)/sign-in', params: { inviteToken } }
                  : '/(auth)/sign-in'
              }
              asChild
            >
              <Button variant="link" size="sm" disabled={loading}>
                <Text>Sign In</Text>
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
