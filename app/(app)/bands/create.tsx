import { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CameraIcon, XIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedBand } from '@/contexts/SelectedBandContext';

export default function CreateBandScreen() {
  const { user } = useAuth();
  const { refreshBands } = useSelectedBand();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to upload a band photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string, bandId: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `${bandId}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('band-photos')
        .upload(fileName, blob, {
          contentType: `image/${ext}`,
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('band-photos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a band name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be signed in to create a band');
      return;
    }

    setLoading(true);

    try {
      // Create the band
      const { data: bandData, error: bandError } = await supabase
        .from('bands')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (bandError) throw bandError;

      // Upload photo if selected
      let photoUrl = null;
      if (photoUri && bandData) {
        photoUrl = await uploadPhoto(photoUri, bandData.id);

        if (photoUrl) {
          await supabase
            .from('bands')
            .update({ photo_url: photoUrl })
            .eq('id', bandData.id);
        }
      }

      // Add creator as admin member
      const { error: memberError } = await supabase.from('band_members').insert({
        band_id: bandData.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
      });

      if (memberError) throw memberError;

      // Refresh the bands list
      await refreshBands();

      Alert.alert('Success', 'Band created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(app)/(tabs)'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating band:', error);
      Alert.alert('Error', error.message || 'Failed to create band');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Band',
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background">
        <ScrollView
          contentContainerClassName="p-4 gap-6"
          keyboardShouldPersistTaps="handled">
          {/* Photo Picker */}
          <View className="items-center gap-2">
            <Pressable
              onPress={pickImage}
              disabled={loading}
              className="w-32 h-32 rounded-full bg-muted items-center justify-center overflow-hidden">
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-full h-full" />
              ) : (
                <Icon as={CameraIcon} size={48} className="text-muted-foreground" />
              )}
            </Pressable>
            {photoUri && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setPhotoUri(null)}
                disabled={loading}>
                <Icon as={XIcon} size={16} />
                <Text>Remove Photo</Text>
              </Button>
            )}
            <Text className="text-sm text-muted-foreground">
              {photoUri ? 'Tap to change photo' : 'Tap to add photo'}
            </Text>
          </View>

          {/* Band Name */}
          <View className="gap-2">
            <Text className="text-sm font-medium">Band Name *</Text>
            <Input
              placeholder="Enter band name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text className="text-sm font-medium">Description</Text>
            <Input
              placeholder="Enter band description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          {/* Create Button */}
          <Button onPress={handleCreate} disabled={loading || !name.trim()}>
            <Text>{loading ? 'Creating...' : 'Create Band'}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
