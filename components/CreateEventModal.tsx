import { useState } from 'react';
import { View, Pressable, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  type Option,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type EventType = Database['public']['Enums']['event_type'];

interface CreateEventModalProps {
  isVisible: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  bandId: string;
}

const EVENT_TYPE_OPTIONS: Option[] = [
  { value: 'show', label: 'Show' },
  { value: 'practice', label: 'Practice' },
  { value: 'recording', label: 'Recording' },
  { value: 'other', label: 'Other' },
];

export function CreateEventModal({
  isVisible,
  onClose,
  onEventCreated,
  bandId,
}: CreateEventModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<Option | undefined>(EVENT_TYPE_OPTIONS[0]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEventDate('');
    setEventTime('');
    setLocation('');
    setEventType(EVENT_TYPE_OPTIONS[0]);
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Event name is required';
    }
    if (!eventDate.trim()) {
      return 'Event date is required';
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventDate)) {
      return 'Date must be in YYYY-MM-DD format';
    }

    // Validate time format if provided (HH:MM)
    if (eventTime && !/^\d{2}:\d{2}$/.test(eventTime)) {
      return 'Time must be in HH:MM format (24-hour)';
    }

    if (!eventType) {
      return 'Event type is required';
    }

    return null;
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('events').insert({
        band_id: bandId,
        name: name.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        event_time: eventTime || null,
        location: location.trim() || null,
        type: eventType!.value as EventType,
        created_by: user?.id || null,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Event created successfully!');
      resetForm();
      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={handleClose}>
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  {/* Event Name */}
                  <View className="gap-2">
                    <Label nativeID="event-name">Event Name *</Label>
                    <Input
                      placeholder="e.g., Live at The Venue"
                      value={name}
                      onChangeText={setName}
                      editable={!isLoading}
                      aria-labelledby="event-name"
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
                      editable={!isLoading}
                      aria-labelledby="event-date"
                    />
                  </View>

                  {/* Event Time */}
                  <View className="gap-2">
                    <Label nativeID="event-time">Time (HH:MM, 24-hour)</Label>
                    <Input
                      placeholder="20:00"
                      value={eventTime}
                      onChangeText={setEventTime}
                      editable={!isLoading}
                      aria-labelledby="event-time"
                    />
                  </View>

                  {/* Location */}
                  <View className="gap-2">
                    <Label nativeID="event-location">Location</Label>
                    <Input
                      placeholder="e.g., The Venue, 123 Main St"
                      value={location}
                      onChangeText={setLocation}
                      editable={!isLoading}
                      aria-labelledby="event-location"
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
                      editable={!isLoading}
                      className="border-input bg-background text-foreground dark:bg-input/30 min-h-24 rounded-md border px-3 py-2 text-base"
                      style={{ textAlignVertical: 'top' }}
                    />
                  </View>

                  {/* Buttons */}
                  <View className="flex-row gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onPress={handleClose}
                      disabled={isLoading}>
                      <Text>Cancel</Text>
                    </Button>
                    <Button
                      className="flex-1"
                      onPress={handleCreate}
                      disabled={isLoading}>
                      <Text>{isLoading ? 'Creating...' : 'Create Event'}</Text>
                    </Button>
                  </View>
                </View>
              </ScrollView>
            </CardContent>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
