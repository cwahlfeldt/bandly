import { View, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MailIcon, LogOutIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-6">
          {/* User Info */}
          <Card>
            <CardContent className="p-4 gap-2">
              <Text className="text-lg font-semibold">Account</Text>
              <Separator />
              <View className="gap-1">
                <Text className="text-sm text-muted-foreground">Email</Text>
                <Text className="text-base">{user?.email}</Text>
              </View>
              <View className="gap-1">
                <Text className="text-sm text-muted-foreground">Name</Text>
                <Text className="text-base">
                  {user?.user_metadata?.name || 'Not set'}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4 gap-2">
              <Text className="text-lg font-semibold">Quick Actions</Text>
              <Separator />
              <Button
                variant="outline"
                className="justify-start"
                onPress={() => router.push('/(app)/invitations')}>
                <Icon as={MailIcon} size={20} />
                <Text>View Band Invitations</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Button variant="destructive" onPress={handleSignOut}>
            <Icon as={LogOutIcon} size={20} />
            <Text>Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
