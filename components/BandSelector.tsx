import { useState } from 'react';
import { View, Pressable, Modal, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDownIcon, CheckIcon } from 'lucide-react-native';
import { useSelectedBand } from '@/contexts/SelectedBandContext';
import { router } from 'expo-router';

export function BandSelector() {
  const { selectedBand, userBands, selectBand } = useSelectedBand();
  const [isOpen, setIsOpen] = useState(false);

  if (userBands.length === 0) {
    return (
      <Pressable onPress={() => router.push('/(app)/bands/create')}>
        <View className="flex-row items-center gap-1 px-3 py-2">
          <Text className="text-sm font-medium">Create Band</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable onPress={() => setIsOpen(true)}>
        <View className="flex-row items-center gap-1 px-3 py-2">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {selectedBand?.name || 'Select Band'}
          </Text>
          <Icon as={ChevronDownIcon} size={16} />
        </View>
      </Pressable>

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
