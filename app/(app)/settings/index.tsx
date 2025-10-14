import { View, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlusIcon, UsersIcon } from 'lucide-react-native';

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-6">
          {/* Band Management */}
          <Card>
            <CardContent className="p-4 gap-2">
              <Text className="text-lg font-semibold">Band Management</Text>
              <Separator />
              <Button
                variant="outline"
                className="justify-start"
                onPress={() => router.push('/(app)/bands/create')}>
                <Icon as={PlusIcon} size={20} />
                <Text>Create New Band</Text>
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onPress={() => router.push('/(app)/invitations')}>
                <Icon as={UsersIcon} size={20} />
                <Text>Band Invitations</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardContent className="p-4 gap-2">
              <Text className="text-lg font-semibold">Account</Text>
              <Separator />
              <Text className="text-sm text-muted-foreground py-2">
                Account settings and preferences coming soon...
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
