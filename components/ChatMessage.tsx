import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import type { Database } from '@/types/database.types';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface ChatMessageProps {
  message: ChatMessage;
  userName?: string;
  userAvatar?: string;
  isOwnMessage: boolean;
}

export function ChatMessage({ message, userName, userAvatar, isOwnMessage }: ChatMessageProps) {
  const timestamp = new Date(message.created_at);

  return (
    <View
      className={`flex-row gap-2 mb-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwnMessage && (
        <Avatar alt={userName || 'User'} className="w-8 h-8">
          {userAvatar && <AvatarImage source={{ uri: userAvatar }} />}
          <AvatarFallback>
            <Text>{userName?.charAt(0).toUpperCase() || 'U'}</Text>
          </AvatarFallback>
        </Avatar>
      )}

      <View className={`flex-1 gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && (
          <Text className="text-xs font-medium text-muted-foreground">
            {userName || 'Unknown User'}
          </Text>
        )}

        <View
          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          }`}>
          {message.message_type === 'text' && message.content && (
            <Text
              className={`text-sm ${
                isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
              }`}>
              {message.content}
            </Text>
          )}

          {/* Rich content rendering will be added in Phase 8 */}
        </View>

        <Text className="text-xs text-muted-foreground">
          {format(timestamp, 'h:mm a')}
        </Text>
      </View>
    </View>
  );
}
