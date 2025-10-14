import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/EmptyState';
import { MessageSquareIcon } from 'lucide-react-native';

export default function ChatsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chats',
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-background">
        <EmptyState
          icon={MessageSquareIcon}
          title="Chats Coming Soon"
          description="Chat with your band members in real-time."
        />
      </View>
    </>
  );
}
