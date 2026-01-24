import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';

export type UIMode = 'basic' | 'investment' | 'custom';

export interface AstrologyProfile {
  dateOfBirth: string | null;  // ISO date string
  timeOfBirth: string | null;  // HH:mm format
  birthLocation: string | null;
  westernZodiac: string | null;
  chineseZodiac: string | null;
  chineseElement: string | null;
}

export interface UIModeState {
  mode: UIMode;
  hasCompletedOnboarding: boolean;
  astrologyProfile: AstrologyProfile;
}

const STORAGE_KEY = 'heliometric_ui_mode';

function createDefaultState(): UIModeState {
  return {
    mode: 'basic',
    hasCompletedOnboarding: false,
    astrologyProfile: {
      dateOfBirth: null,
      timeOfBirth: null,
      birthLocation: null,
      westernZodiac: null,
      chineseZodiac: null,
      chineseElement: null,
    },
  };
}

interface UIModeContextValue {
  state: UIModeState;
  setMode: (mode: UIMode) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  updateAstrologyProfile: (profile: Partial<AstrologyProfile>) => void;
}

const UIModeContext = createContext<UIModeContextValue | null>(null);

export function UIModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UIModeState>(() => createDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (error) {
      console.error('Failed to hydrate UIMode from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist UIMode to localStorage:', error);
    }
  }, [state, isHydrated]);

  const setMode = useCallback((mode: UIMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(createDefaultState());
  }, []);

  const updateAstrologyProfile = useCallback((profile: Partial<AstrologyProfile>) => {
    setState(prev => ({
      ...prev,
      astrologyProfile: { ...prev.astrologyProfile, ...profile },
    }));
  }, []);

  return (
    <UIModeContext.Provider
      value={{
        state,
        setMode,
        completeOnboarding,
        resetOnboarding,
        updateAstrologyProfile,
      }}
    >
      {children}
    </UIModeContext.Provider>
  );
}

export function useUIMode(): UIModeContextValue {
  const context = useContext(UIModeContext);
  if (!context) {
    throw new Error('useUIMode must be used within a UIModeProvider');
  }
  return context;
}

// Helper to get mode display info
export function getModeInfo(mode: UIMode) {
  const modes = {
    basic: {
      name: 'Basic',
      description: 'Overview of all available data',
      subtitle: 'Space weather, solar activity, and general information',
      icon: '📊',
    },
    investment: {
      name: 'Investment',
      description: 'Data that may affect markets',
      subtitle: 'Solar activity correlations, geomagnetic impacts, and market signals',
      icon: '📈',
    },
    custom: {
      name: 'Custom',
      description: 'Personalized insights',
      subtitle: 'Add your birth date for astrology and Chinese zodiac analysis',
      icon: '✨',
    },
  };
  return modes[mode];
}
