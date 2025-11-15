import { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { CalendarIcon, ClockIcon, MapPinIcon, Trash2Icon, EditIcon, SaveIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventType = Database['public']['Enums']['event_type'];

const EVENT_TYPE_OPTIONS: Option[] = [
  { value: 'show', label: 'Show' },
  { value: 'practice', label: 'Practice' },
  { value: 'recording', label: 'Recording' },
  { value: 'other', label: 'Other' },
];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<Option | undefined>();

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setEvent(data);
      // Initialize edit form
      setName(data.name);
      setDescription(data.description || '');
      setEventDate(data.event_date);
      setEventTime(data.event_time || '');
      setLocation(data.location || '');
      setEventType(EVENT_TYPE_OPTIONS.find((opt) => opt.value === data.type));
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Event name is required');
      return;
    }

    if (!eventDate.trim()) {
      Alert.alert('Validation Error', 'Event date is required');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventDate)) {
      Alert.alert('Validation Error', 'Date must be in YYYY-MM-DD format');
      return;
    }

    if (eventTime && !/^\d{2}:\d{2}$/.test(eventTime)) {
      Alert.alert('Validation Error', 'Time must be in HH:MM format (24-hour)');
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('events')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          event_date: eventDate,
          event_time: eventTime || null,
          location: location.trim() || null,
          type: eventType!.value as EventType,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Event updated successfully!');
      setIsEditing(false);
      fetchEvent();
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('events').delete().eq('id', id);

              if (error) throw error;

              Alert.alert('Success', 'Event deleted successfully!');
              router.back();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View className="flex-1 bg-background items-center justify-center">
          <Text className="text-muted-foreground">Loading event...</Text>
        </View>
      </>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Event' : event.name,
          headerRight: () =>
            !isEditing ? (
              <View className="flex-row gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setIsEditing(true)}>
                  <Icon as={EditIcon} size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleDelete}>
                  <Icon as={Trash2Icon} size={20} className="text-destructive" />
                </Button>
              </View>
            ) : null,
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4">
          {isEditing ? (
            // Edit Mode
            <Card>
              <CardContent className="p-4">
                <View className="gap-4">
                  {/* Event Name */}
                  <View className="gap-2">
                    <Label nativeID="event-name">Event Name *</Label>
                    <Input
                      placeholder="e.g., Live at The Venue"
                      value={name}
                      onChangeText={setName}
                      editable={!isSaving}
                    />
                  </View>

                  {/* Event Type */}
                  <View className="gap-2">
                    <Label nativeID="event-type">Event Type *</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger>
                        <SelectValue
                          className="text-foreground"
                          placeholder="Select event type"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {EVENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} label={option.label}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </View>

                  {/* Event Date */}
                  <View className="gap-2">
                    <Label nativeID="event-date">Date (YYYY-MM-DD) *</Label>
                    <Input
                      placeholder="2024-12-31"
                      value={eventDate}
                      onChangeText={setEventDate}
                      editable={!isSaving}
                    />
                  </View>

                  {/* Event Time */}
                  <View className="gap-2">
                    <Label nativeID="event-time">Time (HH:MM, 24-hour)</Label>
                    <Input
                      placeholder="20:00"
                      value={eventTime}
                      onChangeText={setEventTime}
                      editable={!isSaving}
                    />
                  </View>

                  {/* Location */}
                  <View className="gap-2">
                    <Label nativeID="event-location">Location</Label>
                    <Input
                      placeholder="e.g., The Venue, 123 Main St"
                      value={location}
                      onChangeText={setLocation}
                      editable={!isSaving}
                    />
                  </View>

                  {/* Description */}
                  <View className="gap-2">
                    <Label nativeID="event-description">Description</Label>
                    <TextInput
                      placeholder="Event details..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      editable={!isSaving}
                      className="border-input bg-background text-foreground dark:bg-input/30 min-h-24 rounded-md border px-3 py-2 text-base"
                      style={{ textAlignVertical: 'top' }}
                    />
                  </View>

                  {/* Buttons */}
                  <View className="flex-row gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onPress={() => {
                        setIsEditing(false);
                        // Reset form to original values
                        setName(event.name);
                        setDescription(event.description || '');
                        setEventDate(event.event_date);
                        setEventTime(event.event_time || '');
                        setLocation(event.location || '');
                        setEventType(EVENT_TYPE_OPTIONS.find((opt) => opt.value === event.type));
                      }}
                      disabled={isSaving}>
                      <Text>Cancel</Text>
                    </Button>
                    <Button
                      className="flex-1 flex-row gap-2"
                      onPress={handleSave}
                      disabled={isSaving}>
                      <Icon as={SaveIcon} size={16} color="white" />
                      <Text className="text-primary-foreground">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Text>
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          ) : (
            // View Mode
            <Card>
              <CardContent className="p-4">
                <View className="gap-4">
                  {/* Title and Badge */}
                  <View className="flex-row items-start justify-between">
                    <Text className="text-2xl font-bold flex-1">{event.name}</Text>
                    <Badge
                      variant={
                        event.type === 'show'
                          ? 'default'
                          : 'secondary'
                      }>
                      <BadgeText className="capitalize">{event.type}</BadgeText>
                    </Badge>
                  </View>

                  {/* Event Details */}
                  <View className="gap-3 mt-2">
                    <View className="flex-row items-center gap-3">
                      <Icon as={CalendarIcon} size={20} className="text-muted-foreground" />
                      <Text className="text-base">
                        {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                      </Text>
                    </View>

                    {event.event_time && (
                      <View className="flex-row items-center gap-3">
                        <Icon as={ClockIcon} size={20} className="text-muted-foreground" />
                        <Text className="text-base">{event.event_time}</Text>
                      </View>
                    )}

                    {event.location && (
                      <View className="flex-row items-center gap-3">
                        <Icon as={MapPinIcon} size={20} className="text-muted-foreground" />
                        <Text className="text-base">{event.location}</Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  {event.description && (
                    <View className="mt-4 pt-4 border-t border-border">
                      <Text className="text-sm font-semibold mb-2">Description</Text>
                      <Text className="text-base text-muted-foreground leading-6">
                        {event.description}
                      </Text>
                    </View>
                  )}

                  {/* Metadata */}
                  <View className="mt-4 pt-4 border-t border-border">
                    <Text className="text-xs text-muted-foreground">
                      Created {format(new Date(event.created_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}
