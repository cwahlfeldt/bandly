import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function InviteMemberScreen() {
  const { id: bandId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Find user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError || !profileData) {
        Alert.alert(
          'User Not Found',
          'No user found with this email address. They need to sign up first.'
        );
        setLoading(false);
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('band_members')
        .select('id, status')
        .eq('band_id', bandId)
        .eq('user_id', profileData.id)
        .single();

      if (existingMember) {
        if (existingMember.status === 'active') {
          Alert.alert('Error', 'This user is already a member of the band');
        } else {
          Alert.alert('Error', 'This user already has a pending invitation');
        }
        setLoading(false);
        return;
      }

      // Create invitation
      const { error: inviteError } = await supabase.from('band_members').insert({
        band_id: bandId,
        user_id: profileData.id,
        role: 'member',
        status: 'pending',
        invited_by: user?.id,
      });

      if (inviteError) throw inviteError;

      Alert.alert('Success', 'Invitation sent successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Invite Member',
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background">
        <ScrollView
          contentContainerClassName="p-4 gap-6"
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-lg font-semibold">Invite by Email</Text>
            <Text className="text-sm text-muted-foreground">
              Enter the email address of the person you want to invite to your band. They must have
              an account already.
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">Email Address</Text>
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

          <Button onPress={handleInvite} disabled={loading || !email.trim()}>
            <Text>{loading ? 'Sending Invitation...' : 'Send Invitation'}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
