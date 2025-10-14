import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
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
            <Text className="text-lg text-muted-foreground">Sign in to your account</Text>
          </View>

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
