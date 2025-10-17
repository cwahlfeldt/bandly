import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { X, Copy, Share2, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/contexts/InviteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Clipboard from 'expo-clipboard';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  bandId: string;
  bandName: string;
}

export function InviteModal({ visible, onClose, bandId, bandName }: InviteModalProps) {
  const { user } = useAuth();
  const { createInvite, isLoading } = useInvite();

  const [maxUses, setMaxUses] = useState<number | null>(1);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [email, setEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async () => {
    if (!user) return;

    try {
      const result = await createInvite({
        bandId,
        invitedBy: user.id,
        maxUses,
        expiresInDays,
        email: email.trim() || undefined,
      });

      setInviteUrl(result.inviteUrl);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create invitation'
      );
    }
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;

    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    if (!inviteUrl) return;

    try {
      await Share.share({
        message: `You've been invited to join ${bandName} on Bandly! ${inviteUrl}`,
        url: inviteUrl,
        title: `Join ${bandName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleClose = () => {
    setInviteUrl(null);
    setMaxUses(1);
    setExpiresInDays(7);
    setEmail('');
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={handleClose} />

        <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-foreground text-2xl font-bold">
              Invite to {bandName}
            </Text>
            <Pressable onPress={handleClose}>
              <X className="text-foreground" size={24} />
            </Pressable>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {!inviteUrl ? (
              <View className="gap-6">
                <View className="gap-2">
                  <Label nativeID="email">Email (Optional)</Label>
                  <Input
                    placeholder="member@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    aria-labelledby="email"
                  />
                  <Text className="text-muted-foreground text-sm">
                    Leave blank for a general invite link
                  </Text>
                </View>

                <View className="gap-2">
                  <Label nativeID="maxUses">Maximum Uses</Label>
                  <Select
                    value={{ value: String(maxUses), label: maxUses === null ? 'Unlimited' : String(maxUses) }}
                    onValueChange={(option) => {
                      if (option?.value === 'null') {
                        setMaxUses(null);
                      } else {
                        setMaxUses(Number(option?.value));
                      }
                    }}
                  >
                    <SelectTrigger aria-labelledby="maxUses">
                      <SelectValue placeholder="Select max uses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem label="1 use" value="1">1 use</SelectItem>
                        <SelectItem label="5 uses" value="5">5 uses</SelectItem>
                        <SelectItem label="10 uses" value="10">10 uses</SelectItem>
                        <SelectItem label="Unlimited" value="null">Unlimited</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </View>

                <View className="gap-2">
                  <Label nativeID="expires">Expires In</Label>
                  <Select
                    value={{ value: String(expiresInDays), label: expiresInDays === null ? 'Never' : `${expiresInDays} days` }}
                    onValueChange={(option) => {
                      if (option?.value === 'null') {
                        setExpiresInDays(null);
                      } else {
                        setExpiresInDays(Number(option?.value));
                      }
                    }}
                  >
                    <SelectTrigger aria-labelledby="expires">
                      <SelectValue placeholder="Select expiration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem label="1 day" value="1">1 day</SelectItem>
                        <SelectItem label="7 days" value="7">7 days</SelectItem>
                        <SelectItem label="30 days" value="30">30 days</SelectItem>
                        <SelectItem label="Never" value="null">Never</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </View>

                <Button
                  onPress={handleCreateInvite}
                  disabled={isLoading}
                  className="mt-4"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text>Create Invite Link</Text>
                  )}
                </Button>
              </View>
            ) : (
              <View className="gap-6">
                <View className="bg-muted p-4 rounded-lg">
                  <Text className="text-foreground font-medium mb-2">
                    Invite Link Created!
                  </Text>
                  <Text className="text-muted-foreground text-sm" numberOfLines={2}>
                    {inviteUrl}
                  </Text>
                </View>

                <View className="gap-3">
                  <Button
                    onPress={handleCopyLink}
                    variant="outline"
                    className="flex-row items-center gap-2"
                  >
                    {copied ? (
                      <Check className="text-green-600" size={20} />
                    ) : (
                      <Copy className="text-foreground" size={20} />
                    )}
                    <Text>{copied ? 'Copied!' : 'Copy Link'}</Text>
                  </Button>

                  <Button
                    onPress={handleShareLink}
                    className="flex-row items-center gap-2"
                  >
                    <Share2 className="text-primary-foreground" size={20} />
                    <Text>Share Link</Text>
                  </Button>
                </View>

                <Button
                  onPress={handleClose}
                  variant="ghost"
                >
                  <Text>Done</Text>
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
