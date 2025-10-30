import { View, Pressable, Modal, FlatList } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { HomeIcon, CalendarIcon, MessageSquareIcon, UserIcon, SettingsIcon, ChevronDownIcon, CheckIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedBand } from '@/contexts/SelectedBandContext';
import { useState } from 'react';

function HeaderTitle() {
  const { selectedBand, userBands, selectBand } = useSelectedBand();
  const [isOpen, setIsOpen] = useState(false);

  if (userBands.length === 0) {
    return (
      <View className="flex-row items-center gap-3">
        <Text className="text-xl font-bold">Bandly</Text>
        <View className="h-6 w-px bg-border" />
        <Pressable onPress={() => router.push('/(app)/bands/create')}>
          <View className="flex-row items-center gap-1 px-3 py-2">
            <Text className="text-sm font-medium">Create Band</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View className="flex-row items-center gap-3">
        <Text className="text-xl font-bold">Bandly</Text>
        <View className="h-6 w-px bg-border" />
        <View className="flex-row items-center border border-border rounded-md overflow-hidden">
          <Pressable
            onPress={() => selectedBand && router.push(`/(app)/bands/${selectedBand.id}`)}
            className="px-3 py-1.5 active:bg-accent">
            <Text className="text-sm font-semibold" numberOfLines={1}>
              {selectedBand?.name || 'No Band'}
            </Text>
          </Pressable>
          <View className="w-px h-5 bg-border" />
          <Pressable
            onPress={() => setIsOpen(true)}
            className="px-2 py-1.5 active:bg-accent">
            <Icon as={ChevronDownIcon} size={16} className="text-foreground" />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setIsOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card className="w-80 max-h-96">
              <CardContent className="p-4">
                <Text className="text-lg font-bold mb-3">Select Band</Text>
                <FlatList
                  data={userBands}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={async () => {
                        await selectBand(item);
                        setIsOpen(false);
                      }}>
                      <View className="flex-row items-center justify-between p-3 rounded-lg active:bg-accent">
                        <View className="flex-1">
                          <Text className="font-medium">{item.name}</Text>
                          {item.description && (
                            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                        {selectedBand?.id === item.id && (
                          <Icon as={CheckIcon} size={20} className="text-primary" />
                        )}
                      </View>
                    </Pressable>
                  )}
                />
              </CardContent>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
