import { Pressable, View } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { MusicIcon, PlayIcon } from 'lucide-react-native';
import type { Database } from '@/types/database.types';

type AudioTrack = Database['public']['Tables']['audio_tracks']['Row'];

interface AudioTrackCardProps {
  track: AudioTrack;
  onPress: () => void;
  onPlay?: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioTrackCard({ track, onPress, onPlay }: AudioTrackCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
              <Icon as={MusicIcon} size={24} className="text-primary" />
            </View>

            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold">{track.name}</Text>
              {track.description && (
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {track.description}
                </Text>
              )}
              <Text className="text-xs text-muted-foreground">
                {formatDuration(track.duration)}
              </Text>
            </View>

            {onPlay && (
              <Button
                size="icon"
                variant="ghost"
                onPress={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}>
                <Icon as={PlayIcon} size={20} />
              </Button>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
