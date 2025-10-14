import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/EmptyState';
import { CalendarIcon } from 'lucide-react-native';

export default function CalendarScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Calendar',
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-background">
        <EmptyState
          icon={CalendarIcon}
          title="Calendar Coming Soon"
          description="View all your band events and rehearsals in one place."
        />
      </View>
    </>
  );
}
