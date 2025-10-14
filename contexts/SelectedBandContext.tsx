import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type Band = Database['public']['Tables']['bands']['Row'];

interface SelectedBandContextType {
  selectedBand: Band | null;
  selectBand: (band: Band | null) => Promise<void>;
  userBands: Band[];
  loading: boolean;
  refreshBands: () => Promise<void>;
}

const SelectedBandContext = createContext<SelectedBandContextType | undefined>(undefined);

const SELECTED_BAND_KEY = '@bandly_selected_band_id';

export function SelectedBandProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [userBands, setUserBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserBands = useCallback(async () => {
    if (!user) {
      setUserBands([]);
      setSelectedBand(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch bands where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('band_members')
        .select('band_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setUserBands([]);
        setSelectedBand(null);
        setLoading(false);
        return;
      }

      const bandIds = memberData.map((m) => m.band_id);

      // Fetch band details
      const { data: bandsData, error: bandsError } = await supabase
        .from('bands')
        .select('*')
        .in('id', bandIds)
        .order('created_at', { ascending: false });

      if (bandsError) throw bandsError;

      setUserBands(bandsData || []);

      // Auto-select band logic
      if (bandsData && bandsData.length > 0) {
        // Try to get saved selected band
        const savedBandId = await AsyncStorage.getItem(SELECTED_BAND_KEY);

        if (savedBandId) {
          const savedBand = bandsData.find((b) => b.id === savedBandId);
          if (savedBand) {
            setSelectedBand(savedBand);
            setLoading(false);
            return;
          }
        }

        // If only one band, auto-select it
        if (bandsData.length === 1) {
          setSelectedBand(bandsData[0]);
          await AsyncStorage.setItem(SELECTED_BAND_KEY, bandsData[0].id);
        } else {
          // Multiple bands, select first one by default
          setSelectedBand(bandsData[0]);
          await AsyncStorage.setItem(SELECTED_BAND_KEY, bandsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching user bands:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserBands();
  }, [fetchUserBands]);

  const selectBand = async (band: Band | null) => {
    setSelectedBand(band);
    if (band) {
      await AsyncStorage.setItem(SELECTED_BAND_KEY, band.id);
    } else {
      await AsyncStorage.removeItem(SELECTED_BAND_KEY);
    }
  };

  const refreshBands = async () => {
    setLoading(true);
    await fetchUserBands();
  };

  const value = {
    selectedBand,
    selectBand,
    userBands,
    loading,
    refreshBands,
  };

  return <SelectedBandContext.Provider value={value}>{children}</SelectedBandContext.Provider>;
}

export function useSelectedBand() {
  const context = useContext(SelectedBandContext);
  if (context === undefined) {
    throw new Error('useSelectedBand must be used within a SelectedBandProvider');
  }
  return context;
}
