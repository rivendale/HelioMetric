'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react';
import { getZodiacSign, type ZodiacSign, timeDecoder } from '@/lib/HelioEngine';
import { getWesternZodiacFromDate, type WesternZodiacSign } from '@/data/western-zodiac';

// Relationship types for family/social mapping
export type RelationshipType =
  | 'Self'
  | 'Partner'
  | 'Spouse'
  | 'Parent'
  | 'Child'
  | 'Sibling'
  | 'Grandparent'
  | 'Grandchild'
  | 'Friend'
  | 'Colleague'
  | 'Other';

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  Self: 'Self (You)',
  Partner: 'Partner',
  Spouse: 'Spouse',
  Parent: 'Parent',
  Child: 'Child',
  Sibling: 'Sibling',
  Grandparent: 'Grandparent',
  Grandchild: 'Grandchild',
  Friend: 'Friend',
  Colleague: 'Colleague',
  Other: 'Other',
};

export const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  'Self', 'Partner', 'Spouse', 'Parent', 'Child',
  'Sibling', 'Grandparent', 'Grandchild', 'Friend', 'Colleague', 'Other',
];

// Node Types (legacy compat + new)
export type NodeRole = 'Primary' | 'Dependent';

export interface FamilyNode {
  id: string;
  name: string;
  birthYear: number;
  birthDate?: string; // ISO date string (YYYY-MM-DD) for full DOB
  birthTime?: string; // HH:mm format, optional
  birthHour?: number; // 0-23, optional for more precise calculations
  role: NodeRole;
  relationship: RelationshipType;
  zodiacSign: ZodiacSign; // Chinese zodiac
  westernZodiac?: WesternZodiacSign; // Western zodiac (derived from birthDate)
}

// Temporal State for Time Travel
export interface TemporalConfig {
  globalDate: Date;
  isRealTimeMode: boolean;
  lastTemporalShift: number; // Timestamp of last change
}

// State Shape
export interface SystemState {
  nodes: FamilyNode[];
  lastUpdated: number;
  temporal: TemporalConfig;
}

// Actions
type SystemAction =
  | { type: 'ADD_NODE'; payload: Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'> }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'>> } }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'REORDER_NODES'; payload: FamilyNode[] }
  | { type: 'HYDRATE'; payload: SystemState }
  | { type: 'SET_TIME_VECTOR'; payload: Date }
  | { type: 'TOGGLE_REALTIME_MODE'; payload: boolean }
  | { type: 'SYNC_REALTIME' };

// LocalStorage Key
const STORAGE_KEY = 'heliometric_system_state';

// Generate unique ID
function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Derive western zodiac from birth date string
function deriveWesternZodiac(birthDate?: string): WesternZodiacSign | undefined {
  if (!birthDate) return undefined;
  try {
    const date = new Date(birthDate + 'T12:00:00');
    if (isNaN(date.getTime())) return undefined;
    return getWesternZodiacFromDate(date);
  } catch {
    return undefined;
  }
}

// Create node with derived zodiac signs
function createNode(data: Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'>): FamilyNode {
  const birthDate = data.birthDate ? new Date(data.birthDate + 'T12:00:00') : undefined;
  return {
    ...data,
    id: generateId(),
    relationship: data.relationship || 'Other',
    zodiacSign: getZodiacSign(data.birthYear, birthDate),
    westernZodiac: deriveWesternZodiac(data.birthDate),
  };
}

// Default temporal configuration
function createDefaultTemporal(): TemporalConfig {
  return {
    globalDate: new Date(),
    isRealTimeMode: true,
    lastTemporalShift: Date.now(),
  };
}

// Default state - empty, ready for user to add their own people
function createDefaultState(): SystemState {
  return {
    nodes: [
      createNode({ name: 'You', birthYear: 1990, birthDate: '1990-06-15', role: 'Primary', relationship: 'Self' }),
    ],
    lastUpdated: Date.now(),
    temporal: createDefaultTemporal(),
  };
}

// Serialize state for localStorage (convert Date to ISO string)
function serializeState(state: SystemState): string {
  return JSON.stringify({
    ...state,
    temporal: {
      ...state.temporal,
      globalDate: state.temporal.globalDate.toISOString(),
    },
  });
}

// Deserialize state from localStorage
function deserializeState(stored: string): SystemState {
  const parsed = JSON.parse(stored);
  return {
    ...parsed,
    temporal: {
      ...parsed.temporal,
      globalDate: new Date(parsed.temporal.globalDate),
    },
  };
}

// Reducer
function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newNode = createNode(action.payload);
      return {
        ...state,
        nodes: [...state.nodes, newNode],
        lastUpdated: Date.now(),
      };
    }

    case 'UPDATE_NODE': {
      const { id, updates } = action.payload;
      return {
        ...state,
        nodes: state.nodes.map((node) => {
          if (node.id !== id) return node;

          const updatedNode = { ...node, ...updates };
          // Recalculate zodiac if birth year or date changed
          if (updates.birthYear !== undefined || updates.birthDate !== undefined) {
            const birthDate = updatedNode.birthDate
              ? new Date(updatedNode.birthDate + 'T12:00:00')
              : undefined;
            updatedNode.zodiacSign = getZodiacSign(
              updates.birthYear ?? node.birthYear,
              birthDate
            );
            updatedNode.westernZodiac = deriveWesternZodiac(updatedNode.birthDate);
          }
          return updatedNode;
        }),
        lastUpdated: Date.now(),
      };
    }

    case 'REMOVE_NODE': {
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== action.payload),
        lastUpdated: Date.now(),
      };
    }

    case 'REORDER_NODES': {
      return {
        ...state,
        nodes: action.payload,
        lastUpdated: Date.now(),
      };
    }

    case 'HYDRATE': {
      // Rehydrate with fresh zodiac calculations
      return {
        ...action.payload,
        nodes: action.payload.nodes.map((node) => ({
          ...node,
          relationship: node.relationship || (node.role === 'Primary' ? 'Self' : 'Other'),
          zodiacSign: getZodiacSign(
            node.birthYear,
            node.birthDate ? new Date(node.birthDate + 'T12:00:00') : undefined
          ),
          westernZodiac: deriveWesternZodiac(node.birthDate),
        })),
        temporal: action.payload.temporal || createDefaultTemporal(),
      };
    }

    case 'SET_TIME_VECTOR': {
      return {
        ...state,
        temporal: {
          ...state.temporal,
          globalDate: action.payload,
          isRealTimeMode: false, // Disable real-time when manually setting
          lastTemporalShift: Date.now(),
        },
        lastUpdated: Date.now(),
      };
    }

    case 'TOGGLE_REALTIME_MODE': {
      return {
        ...state,
        temporal: {
          ...state.temporal,
          isRealTimeMode: action.payload,
          globalDate: action.payload ? new Date() : state.temporal.globalDate,
          lastTemporalShift: Date.now(),
        },
        lastUpdated: Date.now(),
      };
    }

    case 'SYNC_REALTIME': {
      if (!state.temporal.isRealTimeMode) return state;
      return {
        ...state,
        temporal: {
          ...state.temporal,
          globalDate: new Date(),
        },
      };
    }

    default:
      return state;
  }
}

// Context
interface SystemContextValue {
  state: SystemState;
  addNode: (data: Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'>) => void;
  updateNode: (id: string, updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'>>) => void;
  removeNode: (id: string) => void;
  reorderNodes: (nodes: FamilyNode[]) => void;
  resetToDefault: () => void;

  // Temporal Controls
  setTimeVector: (date: Date) => void;
  toggleRealTimeMode: (enabled: boolean) => void;
  shiftTimeVector: (days: number) => void;
  getTemporalState: () => ReturnType<typeof timeDecoder.getTemporalState>;
}

const SystemContext = createContext<SystemContextValue | null>(null);

// Provider Component
export function SystemStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(systemReducer, null, () => createDefaultState());
  const [isHydrated, setIsHydrated] = React.useState(false);
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = deserializeState(stored);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      }
    } catch (error) {
      console.error('Failed to hydrate SystemState from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on state changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch (error) {
      console.error('Failed to persist SystemState to localStorage:', error);
    }
  }, [state, isHydrated]);

  // Real-time mode sync interval
  useEffect(() => {
    if (state.temporal.isRealTimeMode) {
      // Sync every minute in real-time mode
      realTimeIntervalRef.current = setInterval(() => {
        dispatch({ type: 'SYNC_REALTIME' });
      }, 60000);
    } else {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
        realTimeIntervalRef.current = null;
      }
    }

    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
      }
    };
  }, [state.temporal.isRealTimeMode]);

  // Action dispatchers
  const addNode = useCallback((data: Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'>) => {
    dispatch({ type: 'ADD_NODE', payload: data });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign' | 'westernZodiac'>>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } });
  }, []);

  const removeNode = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: id });
  }, []);

  const reorderNodes = useCallback((nodes: FamilyNode[]) => {
    dispatch({ type: 'REORDER_NODES', payload: nodes });
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultState = createDefaultState();
    dispatch({ type: 'HYDRATE', payload: defaultState });
  }, []);

  // Temporal Control dispatchers
  const setTimeVector = useCallback((date: Date) => {
    dispatch({ type: 'SET_TIME_VECTOR', payload: date });
  }, []);

  const toggleRealTimeMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_REALTIME_MODE', payload: enabled });
  }, []);

  const shiftTimeVector = useCallback((days: number) => {
    const currentDate = state.temporal.globalDate;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    dispatch({ type: 'SET_TIME_VECTOR', payload: newDate });
  }, [state.temporal.globalDate]);

  const getTemporalState = useCallback(() => {
    return timeDecoder.getTemporalState(state.temporal.globalDate);
  }, [state.temporal.globalDate]);

  return (
    <SystemContext.Provider
      value={{
        state,
        addNode,
        updateNode,
        removeNode,
        reorderNodes,
        resetToDefault,
        setTimeVector,
        toggleRealTimeMode,
        shiftTimeVector,
        getTemporalState,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

// Hook to access SystemState
export function useSystemState(): SystemContextValue {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return context;
}

// Utility hook for derived data
export function useFamilyMembers() {
  const { state } = useSystemState();

  return {
    all: state.nodes,
    self: state.nodes.find((n) => n.relationship === 'Self'),
    primaries: state.nodes.filter((n) => n.role === 'Primary'),
    dependents: state.nodes.filter((n) => n.role === 'Dependent'),
    byRelationship: (rel: RelationshipType) => state.nodes.filter((n) => n.relationship === rel),
    byElement: (element: string) => state.nodes.filter((n) => n.zodiacSign.element === element),
  };
}

// Hook for temporal state with automatic updates
export function useTemporalState() {
  const { state, getTemporalState, setTimeVector, toggleRealTimeMode, shiftTimeVector } = useSystemState();

  return {
    globalDate: state.temporal.globalDate,
    isRealTimeMode: state.temporal.isRealTimeMode,
    temporalState: getTemporalState(),
    setTimeVector,
    toggleRealTimeMode,
    shiftTimeVector,
  };
}
