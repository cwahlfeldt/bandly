import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Pressable, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { EventCard } from '@/components/EventCard';
import { CreateEventModal } from '@/components/CreateEventModal';
import { CalendarIcon, PlusIcon } from 'lucide-react-native';
import { useSelectedBand } from '@/contexts/SelectedBandContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];

export default function CalendarScreen() {
  const { selectedBand } = useSelectedBand();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [markedDates, setMarkedDates] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!selectedBand?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('band_id', selectedBand.id)
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);

      // Create marked dates object
      const marked: any = {};
      data?.forEach((event) => {
        marked[event.event_date] = {
          marked: true,
          dotColor: isDark ? '#ffffff' : '#000000',
        };
      });

      // Add selected date styling
      if (marked[selectedDate]) {
        marked[selectedDate].selected = true;
        marked[selectedDate].selectedColor = isDark ? '#262626' : '#f5f5f5';
      } else {
        marked[selectedDate] = {
          selected: true,
          selectedColor: isDark ? '#262626' : '#f5f5f5',
        };
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBand?.id, selectedDate, isDark]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);

    // Update marked dates with new selection
    const newMarked = { ...markedDates };
    Object.keys(newMarked).forEach((key) => {
      if (newMarked[key].selected) {
        delete newMarked[key].selected;
        delete newMarked[key].selectedColor;
      }
    });

    if (newMarked[day.dateString]) {
      newMarked[day.dateString].selected = true;
      newMarked[day.dateString].selectedColor = isDark ? '#262626' : '#f5f5f5';
    } else {
      newMarked[day.dateString] = {
        selected: true,
        selectedColor: isDark ? '#262626' : '#f5f5f5',
      };
    }

    setMarkedDates(newMarked);
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/(app)/events/${eventId}`);
  };

  const selectedDateEvents = events.filter((event) => event.event_date === selectedDate);

  if (!selectedBand) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Calendar',
            headerShown: true,
          }}
        />
        <View className="flex-1 bg-background justify-center">
          <EmptyState
            icon={CalendarIcon}
            title="No Band Selected"
            description="Select a band to view its events calendar."
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Calendar',
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-background">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchEvents} />
          }>
          {/* Calendar */}
          <View className="p-4">
            <Calendar
              current={selectedDate}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: isDark ? '#a3a3a3' : '#737373',
                selectedDayBackgroundColor: isDark ? '#262626' : '#f5f5f5',
                selectedDayTextColor: isDark ? '#ffffff' : '#0a0a0a',
                todayTextColor: isDark ? '#ffffff' : '#0a0a0a',
                dayTextColor: isDark ? '#fafafa' : '#0a0a0a',
                textDisabledColor: isDark ? '#404040' : '#d4d4d4',
                dotColor: isDark ? '#ffffff' : '#0a0a0a',
                selectedDotColor: isDark ? '#ffffff' : '#0a0a0a',
                arrowColor: isDark ? '#ffffff' : '#0a0a0a',
                monthTextColor: isDark ? '#fafafa' : '#0a0a0a',
                indicatorColor: isDark ? '#ffffff' : '#0a0a0a',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '400',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
            />
          </View>

          {/* Events for Selected Date */}
          <View className="px-4 pb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold">
                {selectedDateEvents.length > 0
                  ? `Events (${selectedDateEvents.length})`
                  : 'No Events'}
              </Text>
              <Button
                size="sm"
                onPress={() => setIsCreateModalVisible(true)}
                className="flex-row gap-2">
                <PlusIcon size={16} color="white" />
                <Text className="text-primary-foreground font-medium">New Event</Text>
              </Button>
            </View>

            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                />
              ))
            ) : (
              <View className="py-8">
                <EmptyState
                  icon={CalendarIcon}
                  title="No events on this date"
                  description="Tap 'New Event' to create one."
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <Pressable
          className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg"
          onPress={() => setIsCreateModalVisible(true)}>
          <PlusIcon size={24} color="white" />
        </Pressable>

        {/* Create Event Modal */}
        <CreateEventModal
          isVisible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onEventCreated={fetchEvents}
          bandId={selectedBand.id}
        />
      </View>
    </>
  );
}
