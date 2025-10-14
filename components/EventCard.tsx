import { Pressable, View } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EVENT_TYPE_COLORS = {
  show: 'default',
  practice: 'secondary',
  recording: 'secondary',
  other: 'secondary',
} as const;

export function EventCard({ event, onPress }: EventCardProps) {
  const eventDate = new Date(event.event_date);

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="gap-3">
            <View className="flex-row items-start justify-between">
              <Text className="text-lg font-semibold flex-1">{event.name}</Text>
              <Badge variant={EVENT_TYPE_COLORS[event.type as keyof typeof EVENT_TYPE_COLORS]}>
                <BadgeText className="capitalize">{event.type}</BadgeText>
              </Badge>
            </View>

            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Icon as={CalendarIcon} size={16} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  {format(eventDate, 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>

              {event.event_time && (
                <View className="flex-row items-center gap-2">
                  <Icon as={ClockIcon} size={16} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">
                    {event.event_time}
                  </Text>
                </View>
              )}

              {event.location && (
                <View className="flex-row items-center gap-2">
                  <Icon as={MapPinIcon} size={16} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>

            {event.description && (
              <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                {event.description}
              </Text>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
