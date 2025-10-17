import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { useInvite } from '@/contexts/InviteContext';
import { Mail, Clock, Users, XCircle } from 'lucide-react-native';
import type { Database } from '@/types/database.types';

type BandInvitation = Database['public']['Tables']['band_invitations']['Row'] & {
  profiles?: { name: string | null } | null;
};

export default function InviteManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchBandInvites, revokeInvite } = useInvite();

  const [invitations, setInvitations] = useState<BandInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvitations();
    }
  }, [id]);

  const loadInvitations = async () => {
    try {
      const data = await fetchBandInvites(id);
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvitations();
  };

  const handleRevokeInvite = (invitation: BandInvitation) => {
    Alert.alert(
      'Revoke Invitation',
      'Are you sure you want to revoke this invitation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeInvite(invitation.id);
              // Refresh the list
              loadInvitations();
              Alert.alert('Success', 'Invitation has been revoked');
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke invitation');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600';
      case 'accepted':
        return 'text-green-600';
      case 'expired':
        return 'text-orange-600';
      case 'revoked':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeInvitations = invitations.filter(
    (inv) => inv.status === 'pending' || inv.status === 'accepted'
  );
  const inactiveInvitations = invitations.filter(
    (inv) => inv.status === 'expired' || inv.status === 'revoked'
  );

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
          title: 'Manage Invitations',
          headerShown: true,
        }}
      />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="p-4 gap-6">
          {/* Active Invitations */}
          <View>
            <Text className="text-lg font-semibold mb-3">
              Active Invitations ({activeInvitations.length})
            </Text>

            {activeInvitations.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No Active Invitations"
                description="Create an invitation to invite new members to your band."
              />
            ) : (
              <View className="gap-3">
                {activeInvitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardHeader>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <CardTitle className="text-base">
                            {invitation.email || 'General Invitation'}
                          </CardTitle>
                          <Text className={`text-sm capitalize ${getStatusColor(invitation.status)}`}>
                            {invitation.status}
                          </Text>
                        </View>
                        {invitation.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => handleRevokeInvite(invitation)}
                          >
                            <XCircle className="text-red-600" size={20} />
                          </Button>
                        )}
                      </View>
                    </CardHeader>
                    <CardContent className="gap-2">
                      <View className="flex-row items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          Uses: {invitation.current_uses} / {invitation.max_uses || '∞'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          Expires: {formatDate(invitation.expires_at)}
                        </Text>
                      </View>
                      {invitation.profiles?.name && (
                        <Text className="text-sm text-muted-foreground">
                          Created by: {invitation.profiles.name}
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Inactive Invitations */}
          {inactiveInvitations.length > 0 && (
            <View>
              <Text className="text-lg font-semibold mb-3">
                Past Invitations ({inactiveInvitations.length})
              </Text>

              <View className="gap-3">
                {inactiveInvitations.map((invitation) => (
                  <Card key={invitation.id} className="opacity-60">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {invitation.email || 'General Invitation'}
                      </CardTitle>
                      <Text className={`text-sm capitalize ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </Text>
                    </CardHeader>
                    <CardContent className="gap-2">
                      <View className="flex-row items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          Uses: {invitation.current_uses} / {invitation.max_uses || '∞'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          Expired: {formatDate(invitation.expires_at)}
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
