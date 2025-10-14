import { Pressable, View, Image } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';
import type { Database } from '@/types/database.types';

type Band = Database['public']['Tables']['bands']['Row'];

interface BandCardProps {
  band: Band;
  memberCount: number;
  onPress: () => void;
}

export function BandCard({ band, memberCount, onPress }: BandCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex-row gap-3">
            {band.photo_url ? (
              <Image
                source={{ uri: band.photo_url }}
                className="w-16 h-16 rounded-lg bg-muted"
              />
            ) : (
              <View className="w-16 h-16 rounded-lg bg-muted items-center justify-center">
                <Text className="text-2xl text-muted-foreground">
                  {band.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="flex-1 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold">{band.name}</Text>
                <Badge variant="secondary">
                  <BadgeText>{memberCount} member{memberCount !== 1 ? 's' : ''}</BadgeText>
                </Badge>
              </View>
              {band.description && (
                <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                  {band.description}
                </Text>
              )}
            </View>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
