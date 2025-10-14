import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        // Email confirmation required
        Alert.alert(
          'Check your email',
          'Please check your email to verify your account before signing in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]
        );
      } else if (data?.session) {
        // User is automatically signed in (email confirmation disabled)
        router.replace('/(app)');
      } else {
        // Fallback - go to sign in
        router.replace('/(auth)/sign-in');
      }
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
            <Text className="text-lg text-muted-foreground">Sign up to get started</Text>
          </View>

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
            <Link href="/(auth)/sign-in" asChild>
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
