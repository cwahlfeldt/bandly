import { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/contexts/InviteContext';

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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error, data } = await signIn(email, password);

    if (error) {
      setLoading(false);
      Alert.alert('Sign In Failed', error.message);
      return;
    }

    // If there's a pending invite token, accept it
    if (inviteToken && data?.user) {
      try {
        const result = await acceptInvite(inviteToken, data.user.id);
        setLoading(false);

        Alert.alert(
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
        setLoading(false);
        Alert.alert(
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
      setLoading(false);
      router.replace('/(app)');
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
            <View className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <Text className="text-blue-700 dark:text-blue-300 text-sm">
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
            <Link href="/(auth)/sign-up" asChild>
              <Button variant="link" size="sm" disabled={loading}>
                <Text>Sign Up</Text>
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
