import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-8">
      <Icon as={icon} size={64} className="text-muted-foreground opacity-50" />
      <View className="gap-2 items-center">
        <Text className="text-xl font-semibold text-center">{title}</Text>
        <Text className="text-muted-foreground text-center">{description}</Text>
      </View>
      {actionLabel && onAction && (
        <Button onPress={onAction}>
          <Text>{actionLabel}</Text>
        </Button>
      )}
    </View>
  );
}
