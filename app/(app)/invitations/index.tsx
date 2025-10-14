import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { MailIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type BandMember = Database['public']['Tables']['band_members']['Row'] & {
  bands?: { name: string; description: string | null } | null;
};

export default function InvitationsScreen() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('band_members')
        .select(`
          *,
          bands:band_id (name, description)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInvitations();
  }, [user]);

  const handleAccept = async (invitationId: string, bandId: string) => {
    try {
      const { error } = await supabase
        .from('band_members')
        .update({ status: 'active' })
        .eq('id', invitationId);

      if (error) throw error;

      Alert.alert('Success', 'Invitation accepted!', [
        {
          text: 'OK',
          onPress: () => {
            fetchInvitations();
            router.push(`/(app)/bands/${bandId}`);
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('band_members')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      Alert.alert('Declined', 'Invitation declined');
      fetchInvitations();
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', error.message || 'Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Band Invitations',
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-background">
        {invitations.length === 0 ? (
          <EmptyState
            icon={MailIcon}
            title="No Invitations"
            description="You don't have any pending band invitations."
          />
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card className="mb-3">
                <CardContent className="p-4 gap-3">
                  <View className="gap-1">
                    <Text className="text-lg font-semibold">
                      {item.bands?.name || 'Unknown Band'}
                    </Text>
                    {item.bands?.description && (
                      <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                        {item.bands.description}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <Button
                      className="flex-1"
                      onPress={() => handleAccept(item.id, item.band_id)}>
                      <Text>Accept</Text>
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onPress={() => handleDecline(item.id)}>
                      <Text>Decline</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            )}
            contentContainerClassName="p-4"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </>
  );
}
