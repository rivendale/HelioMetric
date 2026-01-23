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

export type NodeRole = 'Primary' | 'Dependent';

export interface FamilyNode {
  id: string;
  name: string;
  birthYear: number;
  birthHour?: number;
  role: NodeRole;
  zodiacSign: ZodiacSign;
}

export interface TemporalConfig {
  globalDate: Date;
  isRealTimeMode: boolean;
  lastTemporalShift: number;
}

export interface SystemState {
  nodes: FamilyNode[];
  lastUpdated: number;
  temporal: TemporalConfig;
}

type SystemAction =
  | { type: 'ADD_NODE'; payload: Omit<FamilyNode, 'id' | 'zodiacSign'> }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign'>> } }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'REORDER_NODES'; payload: FamilyNode[] }
  | { type: 'HYDRATE'; payload: SystemState }
  | { type: 'SET_TIME_VECTOR'; payload: Date }
  | { type: 'TOGGLE_REALTIME_MODE'; payload: boolean }
  | { type: 'SYNC_REALTIME' };

const STORAGE_KEY = 'heliometric_system_state';

function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createNode(data: Omit<FamilyNode, 'id' | 'zodiacSign'>): FamilyNode {
  return {
    ...data,
    id: generateId(),
    zodiacSign: getZodiacSign(data.birthYear),
  };
}

function createDefaultTemporal(): TemporalConfig {
  return {
    globalDate: new Date(),
    isRealTimeMode: true,
    lastTemporalShift: Date.now(),
  };
}

function createDefaultState(): SystemState {
  const currentYear = new Date().getFullYear();
  const rabbitYear = 1987;

  return {
    nodes: [
      createNode({ name: 'Parent (Rabbit)', birthYear: rabbitYear, role: 'Primary' }),
      createNode({ name: 'Dependent 1', birthYear: currentYear - 15, role: 'Dependent' }),
      createNode({ name: 'Dependent 2', birthYear: currentYear - 12, role: 'Dependent' }),
      createNode({ name: 'Dependent 3', birthYear: currentYear - 9, role: 'Dependent' }),
      createNode({ name: 'Dependent 4', birthYear: currentYear - 6, role: 'Dependent' }),
    ],
    lastUpdated: Date.now(),
    temporal: createDefaultTemporal(),
  };
}

function serializeState(state: SystemState): string {
  return JSON.stringify({
    ...state,
    temporal: {
      ...state.temporal,
      globalDate: state.temporal.globalDate.toISOString(),
    },
  });
}

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
          if (updates.birthYear !== undefined) {
            updatedNode.zodiacSign = getZodiacSign(updates.birthYear);
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
      return {
        ...action.payload,
        nodes: action.payload.nodes.map((node) => ({
          ...node,
          zodiacSign: getZodiacSign(node.birthYear),
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
          isRealTimeMode: false,
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

interface SystemContextValue {
  state: SystemState;
  addNode: (data: Omit<FamilyNode, 'id' | 'zodiacSign'>) => void;
  updateNode: (id: string, updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign'>>) => void;
  removeNode: (id: string) => void;
  reorderNodes: (nodes: FamilyNode[]) => void;
  resetToDefault: () => void;
  setTimeVector: (date: Date) => void;
  toggleRealTimeMode: (enabled: boolean) => void;
  shiftTimeVector: (days: number) => void;
  getTemporalState: () => ReturnType<typeof timeDecoder.getTemporalState>;
}

const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(systemReducer, null, () => createDefaultState());
  const [isHydrated, setIsHydrated] = React.useState(false);
  const realTimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch (error) {
      console.error('Failed to persist SystemState to localStorage:', error);
    }
  }, [state, isHydrated]);

  useEffect(() => {
    if (state.temporal.isRealTimeMode) {
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

  const addNode = useCallback((data: Omit<FamilyNode, 'id' | 'zodiacSign'>) => {
    dispatch({ type: 'ADD_NODE', payload: data });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign'>>) => {
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

export function useSystemState(): SystemContextValue {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return context;
}

export function useFamilyMembers() {
  const { state } = useSystemState();

  return {
    all: state.nodes,
    primaries: state.nodes.filter((n) => n.role === 'Primary'),
    dependents: state.nodes.filter((n) => n.role === 'Dependent'),
    byElement: (element: string) => state.nodes.filter((n) => n.zodiacSign.element === element),
  };
}

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
