import { useState, useEffect } from 'react';
import { View, ScrollView, Image, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersIcon, CalendarIcon, MusicIcon, ListIcon, MessageSquareIcon, UserPlus } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { InviteModal } from '@/components/InviteModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type Band = Database['public']['Tables']['bands']['Row'];
type BandMember = Database['public']['Tables']['band_members']['Row'] & {
  profiles?: { name: string | null; avatar_url: string | null } | null;
};

export default function BandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [band, setBand] = useState<Band | null>(null);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [userRole, setUserRole] = useState<string>('member');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBandDetails();
    }
  }, [id]);

  const fetchBandDetails = async () => {
    try {
      // Fetch band details
      const { data: bandData, error: bandError } = await supabase
        .from('bands')
        .select('*')
        .eq('id', id)
        .single();

      if (bandError) throw bandError;
      setBand(bandData);

      // Fetch band members
      const { data: membersData, error: membersError } = await supabase
        .from('band_members')
        .select('*')
        .eq('band_id', id)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Fetch profiles for each member separately
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        // Combine members with their profiles
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profiles: profilesData?.find(p => p.id === member.user_id) || null
        }));

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }

      // Get user's role
      const userMember = membersData?.find((m) => m.user_id === user?.id);
      if (userMember) {
        setUserRole(userMember.role);
      }
    } catch (error) {
      console.error('Error fetching band details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!band) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Band not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: band.name,
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={() => setInviteModalVisible(true)}
              className="mr-4"
            >
              <UserPlus className="text-primary" size={24} />
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background">
        {/* Band Header */}
        <View className="p-6 items-center gap-4 border-b border-border">
          {band.photo_url ? (
            <Image
              source={{ uri: band.photo_url }}
              className="w-24 h-24 rounded-full bg-muted"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-muted items-center justify-center">
              <Text className="text-4xl text-muted-foreground">
                {band.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold">{band.name}</Text>
            {band.description && (
              <Text className="text-muted-foreground text-center">{band.description}</Text>
            )}
            <Text className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="flex-row w-full">
            <TabsTrigger value="members" className="flex-1">
              <Icon as={UsersIcon} size={20} />
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              <Icon as={CalendarIcon} size={20} />
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex-1">
              <Icon as={MusicIcon} size={20} />
            </TabsTrigger>
            <TabsTrigger value="setlists" className="flex-1">
              <Icon as={ListIcon} size={20} />
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">
              <Icon as={MessageSquareIcon} size={20} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="p-4">
            <View className="gap-3">
              <Button onPress={() => setInviteModalVisible(true)}>
                <Icon as={UserPlus} size={20} />
                <Text>Invite Member</Text>
              </Button>
              {members.map((member) => (
                <View
                  key={member.id}
                  className="flex-row items-center gap-3 p-3 bg-card rounded-lg">
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                    <Text className="text-lg">
                      {member.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium">
                      {member.profiles?.name || 'Unknown User'}
                    </Text>
                    <Text className="text-sm text-muted-foreground capitalize">
                      {member.role}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </TabsContent>

          <TabsContent value="events">
            <EmptyState
              icon={CalendarIcon}
              title="No Events"
              description="Events will appear here once created."
            />
          </TabsContent>

          <TabsContent value="audio">
            <EmptyState
              icon={MusicIcon}
              title="No Audio Tracks"
              description="Upload audio tracks to share with your band."
            />
          </TabsContent>

          <TabsContent value="setlists">
            <EmptyState
              icon={ListIcon}
              title="No Setlists"
              description="Create setlists for your shows and rehearsals."
            />
          </TabsContent>

          <TabsContent value="chat">
            <EmptyState
              icon={MessageSquareIcon}
              title="Chat Coming Soon"
              description="Chat with your band members in real-time."
            />
          </TabsContent>
        </Tabs>
      </ScrollView>

      <InviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        bandId={id}
        bandName={band.name}
      />
    </>
  );
}
