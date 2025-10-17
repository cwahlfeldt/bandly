import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, Share } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/contexts/InviteContext';
import { Mail, Link as LinkIcon, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function InviteMemberScreen() {
  const { id: bandId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { createInvite, checkUserByEmail } = useInvite();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleInviteByEmail = async () => {
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
      // Check if user already exists
      const existingUserId = await checkUserByEmail(email);

      // Create invitation via band_invitations table
      const { invitation, inviteUrl } = await createInvite({
        bandId: bandId!,
        invitedBy: user!.id,
        email: email.toLowerCase().trim(),
        maxUses: 1,
        expiresInDays: 7,
        role: 'member',
      });

      setGeneratedLink(inviteUrl);

      if (existingUserId) {
        Alert.alert(
          'Invitation Created',
          `An invitation has been created for ${email}. They will see it in their Invitations page when they log in.\n\nYou can also share the link below with them directly.`
        );
      } else {
        Alert.alert(
          'Invitation Created',
          `An invitation link has been created for ${email}. Since they don't have an account yet, share the link below with them so they can sign up and join your band.`
        );
      }

      setEmail('');
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', error.message || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGeneralLink = async () => {
    if (!user || !bandId) return;

    setLoading(true);

    try {
      const { invitation, inviteUrl } = await createInvite({
        bandId: bandId,
        invitedBy: user.id,
        maxUses: 10, // Allow multiple uses
        expiresInDays: 30,
        role: 'member',
      });

      setGeneratedLink(inviteUrl);

      Alert.alert(
        'Link Created',
        'A general invitation link has been created. This link can be used by up to 10 people and expires in 30 days.'
      );
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', error.message || 'Failed to create invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await Clipboard.setStringAsync(generatedLink);
      Alert.alert('Copied', 'Invitation link copied to clipboard!');
    }
  };

  const handleShareLink = async () => {
    if (generatedLink) {
      try {
        await Share.share({
          message: `You've been invited to join a band on Bandly! Click here to accept: ${generatedLink}`,
          url: generatedLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
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
          {/* Email Invite Section */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Mail size={20} className="text-foreground" />
                <CardTitle>Invite by Email</CardTitle>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <Text className="text-sm text-muted-foreground">
                Enter an email address to send a personalized invitation. If the user already has an
                account, it will show up in their Invitations page. Otherwise, share the generated
                link with them to sign up.
              </Text>

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

              <Button onPress={handleInviteByEmail} disabled={loading || !email.trim()}>
                <Text>{loading ? 'Creating Invitation...' : 'Create Invitation'}</Text>
              </Button>
            </CardContent>
          </Card>

          {/* General Link Section */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <LinkIcon size={20} className="text-foreground" />
                <CardTitle>Create Shareable Link</CardTitle>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <Text className="text-sm text-muted-foreground">
                Create a general invitation link that can be shared with multiple people. The link
                can be used up to 10 times and expires in 30 days.
              </Text>

              <Button onPress={handleCreateGeneralLink} disabled={loading} variant="outline">
                <Text>Generate Shareable Link</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Generated Link Display */}
          {generatedLink && (
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Invitation Link Ready</CardTitle>
              </CardHeader>
              <CardContent className="gap-4">
                <View className="bg-background p-3 rounded-lg">
                  <Text className="text-sm font-mono break-all">{generatedLink}</Text>
                </View>

                <View className="flex-row gap-2">
                  <Button className="flex-1" onPress={handleCopyLink}>
                    <Copy size={16} className="text-primary-foreground mr-2" />
                    <Text>Copy Link</Text>
                  </Button>

                  <Button className="flex-1" variant="outline" onPress={handleShareLink}>
                    <Text>Share</Text>
                  </Button>
                </View>

                <Text className="text-xs text-muted-foreground text-center">
                  Note: Email notifications are not yet configured. You'll need to manually share
                  this link with the invitee.
                </Text>
              </CardContent>
            </Card>
          )}

          <View className="mt-4">
            <Text className="text-xs text-muted-foreground text-center">
              You can manage all invitations from the band's Invitations page.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
