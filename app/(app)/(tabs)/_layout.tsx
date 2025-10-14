import { View, Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HomeIcon, CalendarIcon, MessageSquareIcon, UserIcon, SettingsIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';
import { BandSelector } from '@/components/BandSelector';
import { useAuth } from '@/contexts/AuthContext';

function HeaderTitle() {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="text-xl font-bold">Bandly</Text>
      <View className="h-6 w-px bg-border" />
      <BandSelector />
    </View>
  );
}

function HeaderRight() {
  const { user } = useAuth();

  return (
    <View className="flex-row items-center gap-3 mr-3">
      <Pressable onPress={() => router.push('/(app)/settings')}>
        <Icon as={SettingsIcon} size={24} className="text-foreground" />
      </Pressable>
      <Pressable onPress={() => router.push('/(app)/(tabs)/profile')}>
        <Avatar alt="User profile" className="w-8 h-8">
          {user?.user_metadata?.avatar_url && (
            <AvatarImage source={{ uri: user.user_metadata.avatar_url }} />
          )}
          <AvatarFallback>
            <Text className="text-sm">
              {user?.user_metadata?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </AvatarFallback>
        </Avatar>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderTitle />,
        headerRight: () => <HeaderRight />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Icon as={HomeIcon} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Icon as={CalendarIcon} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Icon as={MessageSquareIcon} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon as={UserIcon} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
