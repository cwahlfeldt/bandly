import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/contexts/InviteContext';
import { useSelectedBand } from '@/contexts/SelectedBandContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { Database } from '@/types/database.types';

// Web-compatible alert function
const showAlert = (title: string, message: string, onOk: () => void) => {
  if (Platform.OS === 'web') {
    // On web, use window.alert and immediately call onOk
    window.alert(`${title}\n\n${message}`);
    onOk();
  } else {
    // On native, use React Native Alert
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

type Band = Database['public']['Tables']['bands']['Row'];

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuth();
  const { validateInvite, acceptInvite, isLoading } = useInvite();
  const { setSelectedBand, refreshBands } = useSelectedBand();

  const [validationState, setValidationState] = useState<{
    valid: boolean;
    band?: Band;
    error?: string;
    loading: boolean;
  }>({ valid: false, loading: true });

  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      validateInviteToken();
    }
  }, [token]);

  const validateInviteToken = async () => {
    if (!token) return;

    setValidationState({ valid: false, loading: true });

    const result = await validateInvite(token);

    if (result.valid && result.invitation) {
      setValidationState({
        valid: true,
        band: result.invitation.bands,
        loading: false,
      });
    } else {
      setValidationState({
        valid: false,
        error: result.error,
        loading: false,
      });
    }
  };

  const handleSignIn = () => {
    if (!token) return;
    router.push({
      pathname: '/(auth)/sign-in',
      params: { inviteToken: token },
    });
  };

  const handleSignUp = () => {
    if (!token) return;
    router.push({
      pathname: '/(auth)/sign-up',
      params: { inviteToken: token },
    });
  };

  const handleAcceptInvite = async () => {
    if (!user || !token) {
      // User not logged in, show sign in/up options
      return;
    }

    setIsAccepting(true);

    try {
      console.log('Accepting invite...', { token, userId: user.id });
      const result = await acceptInvite(token, user.id);
      console.log('Invite accepted:', result);

      // Refresh bands list
      await refreshBands();

      // Show success message
      if (result.alreadyMember) {
        // Already a member - just navigate to the band
        showAlert(
          'Already a Member',
          'You are already a member of this band!',
          () => {
            router.replace(`/bands/${result.bandId}`);
          }
        );
      } else {
        // Successfully joined - celebrate!
        showAlert(
          'Welcome!',
          'You have successfully joined the band!',
          () => {
            router.replace(`/bands/${result.bandId}`);
          }
        );
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation';
      if (Platform.OS === 'web') {
        window.alert(`Error\n\n${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to decline this invitation?')) {
        router.back();
      }
    } else {
      Alert.alert(
        'Decline Invitation',
        'Are you sure you want to decline this invitation?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    }
  };

  if (validationState.loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <ActivityIndicator size="large" />
        <Text className="text-foreground mt-4">Validating invitation...</Text>
      </View>
    );
  }

  if (!validationState.valid) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {validationState.error || 'This invitation link is not valid'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onPress={() => router.back()} className="w-full">
              <Text>Go Back</Text>
            </Button>
          </CardFooter>
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Band Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a band!
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-4">
          <View className="bg-muted p-4 rounded-lg">
            <Text className="text-foreground text-lg font-semibold mb-1">
              {validationState.band?.name}
            </Text>
            {validationState.band?.description && (
              <Text className="text-muted-foreground">
                {validationState.band.description}
              </Text>
            )}
          </View>

          {!user && (
            <View className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
              <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
                You need to sign in or create an account to accept this invitation.
              </Text>
            </View>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-2">
          {user ? (
            <>
              <Button
                onPress={handleAcceptInvite}
                className="w-full"
                disabled={isAccepting || isLoading}
              >
                {isAccepting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text>Accept Invitation</Text>
                )}
              </Button>

              <Button
                onPress={handleDecline}
                variant="outline"
                className="w-full"
                disabled={isAccepting || isLoading}
              >
                <Text>Decline</Text>
              </Button>
            </>
          ) : (
            <>
              <Button
                onPress={handleSignUp}
                className="w-full"
                disabled={isLoading}
              >
                <Text>Create Account & Join</Text>
              </Button>

              <Button
                onPress={handleSignIn}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Text>Sign In to Join</Text>
              </Button>

              <Button
                onPress={handleDecline}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                <Text>Decline</Text>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </View>
  );
}
