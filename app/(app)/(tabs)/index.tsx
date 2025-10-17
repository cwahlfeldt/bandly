import { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { MusicIcon, UsersIcon, CalendarIcon, ListIcon, ChevronRight } from 'lucide-react-native';
import { useSelectedBand } from '@/contexts/SelectedBandContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type BandMember = Database['public']['Tables']['band_members']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type AudioTrack = Database['public']['Tables']['audio_tracks']['Row'];

export default function DashboardScreen() {
  const { selectedBand, loading: bandLoading, refreshBands } = useSelectedBand();
  const [members, setMembers] = useState<BandMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentTracks, setRecentTracks] = useState<AudioTrack[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedBand) {
      fetchBandData();
    }
  }, [selectedBand]);

  const fetchBandData = async () => {
    if (!selectedBand) return;

    try {
      // Fetch members
      const { data: membersData } = await supabase
        .from('band_members')
        .select('*')
        .eq('band_id', selectedBand.id)
        .eq('status', 'active');

      setMembers(membersData || []);

      // Fetch upcoming events
      const today = new Date().toISOString().split('T')[0];
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('band_id', selectedBand.id)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);

      setUpcomingEvents(eventsData || []);

      // Fetch recent audio tracks
      const { data: tracksData } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('band_id', selectedBand.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTracks(tracksData || []);
    } catch (error) {
      console.error('Error fetching band data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBands();
    await fetchBandData();
    setRefreshing(false);
  };

  if (bandLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!selectedBand) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon={MusicIcon}
          title="No Band Selected"
          description="Create or select a band to get started."
          actionLabel="Create Band"
          onAction={() => router.push('/(app)/bands/create')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="p-4 gap-4">
        {/* Band Header */}
        <Pressable onPress={() => router.push(`/bands/${selectedBand.id}`)}>
          <Card>
            <CardContent className="p-4 gap-3">
              <View className="flex-row items-center gap-3">
                {selectedBand.photo_url ? (
                  <Image
                    source={{ uri: selectedBand.photo_url }}
                    className="w-16 h-16 rounded-lg"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-lg bg-muted items-center justify-center">
                    <Text className="text-2xl">{selectedBand.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-xl font-bold">{selectedBand.name}</Text>
                  {selectedBand.description && (
                    <Text className="text-sm text-muted-foreground">{selectedBand.description}</Text>
                  )}
                </View>
                <ChevronRight className="text-muted-foreground" size={24} />
              </View>
            </CardContent>
          </Card>
        </Pressable>

        {/* Quick Stats */}
        <View className="flex-row gap-3">
          <Card className="flex-1">
            <CardContent className="p-3 items-center">
              <Icon as={UsersIcon} size={24} className="text-primary mb-1" />
              <Text className="text-2xl font-bold">{members.length}</Text>
              <Text className="text-xs text-muted-foreground">Members</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-3 items-center">
              <Icon as={CalendarIcon} size={24} className="text-primary mb-1" />
              <Text className="text-2xl font-bold">{upcomingEvents.length}</Text>
              <Text className="text-xs text-muted-foreground">Upcoming</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-3 items-center">
              <Icon as={MusicIcon} size={24} className="text-primary mb-1" />
              <Text className="text-2xl font-bold">{recentTracks.length}</Text>
              <Text className="text-xs text-muted-foreground">Tracks</Text>
            </CardContent>
          </Card>
        </View>

        {/* Upcoming Events */}
        <Card>
          <CardContent className="p-4 gap-3">
            <Text className="text-lg font-semibold">Upcoming Events</Text>
            <Separator />
            {upcomingEvents.length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center py-4">
                No upcoming events
              </Text>
            ) : (
              upcomingEvents.map((event) => (
                <View key={event.id} className="py-2">
                  <Text className="font-medium">{event.name}</Text>
                  <Text className="text-sm text-muted-foreground">{event.event_date}</Text>
                </View>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Tracks */}
        <Card>
          <CardContent className="p-4 gap-3">
            <Text className="text-lg font-semibold">Recent Tracks</Text>
            <Separator />
            {recentTracks.length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center py-4">
                No audio tracks yet
              </Text>
            ) : (
              recentTracks.map((track) => (
                <View key={track.id} className="py-2">
                  <Text className="font-medium">{track.name}</Text>
                  {track.description && (
                    <Text className="text-sm text-muted-foreground">{track.description}</Text>
                  )}
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
