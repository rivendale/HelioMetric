'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode
} from 'react';
import { getZodiacSign, type ZodiacSign } from '@/lib/HelioEngine';

// Node Types
export type NodeRole = 'Primary' | 'Dependent';

export interface FamilyNode {
  id: string;
  name: string;
  birthYear: number;
  birthHour?: number; // 0-23, optional for more precise calculations
  role: NodeRole;
  zodiacSign: ZodiacSign;
}

// State Shape
export interface SystemState {
  nodes: FamilyNode[];
  lastUpdated: number;
}

// Actions
type SystemAction =
  | { type: 'ADD_NODE'; payload: Omit<FamilyNode, 'id' | 'zodiacSign'> }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign'>> } }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'REORDER_NODES'; payload: FamilyNode[] }
  | { type: 'HYDRATE'; payload: SystemState };

// LocalStorage Key
const STORAGE_KEY = 'heliometric_system_state';

// Generate unique ID
function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create node with derived zodiac
function createNode(data: Omit<FamilyNode, 'id' | 'zodiacSign'>): FamilyNode {
  return {
    ...data,
    id: generateId(),
    zodiacSign: getZodiacSign(data.birthYear),
  };
}

// Default state with Rabbit parent and 4 dependents
function createDefaultState(): SystemState {
  const currentYear = new Date().getFullYear();

  // Rabbit years: 1951, 1963, 1975, 1987, 1999, 2011, 2023
  // Using 1987 for a parent in their late 30s
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
  };
}

// Reducer
function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newNode = createNode(action.payload);
      return {
        nodes: [...state.nodes, newNode],
        lastUpdated: Date.now(),
      };
    }

    case 'UPDATE_NODE': {
      const { id, updates } = action.payload;
      return {
        nodes: state.nodes.map((node) => {
          if (node.id !== id) return node;

          const updatedNode = { ...node, ...updates };
          // Recalculate zodiac if birth year changed
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
        nodes: state.nodes.filter((node) => node.id !== action.payload),
        lastUpdated: Date.now(),
      };
    }

    case 'REORDER_NODES': {
      return {
        nodes: action.payload,
        lastUpdated: Date.now(),
      };
    }

    case 'HYDRATE': {
      // Rehydrate with fresh zodiac calculations
      return {
        nodes: action.payload.nodes.map((node) => ({
          ...node,
          zodiacSign: getZodiacSign(node.birthYear),
        })),
        lastUpdated: action.payload.lastUpdated,
      };
    }

    default:
      return state;
  }
}

// Context
interface SystemContextValue {
  state: SystemState;
  addNode: (data: Omit<FamilyNode, 'id' | 'zodiacSign'>) => void;
  updateNode: (id: string, updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign'>>) => void;
  removeNode: (id: string) => void;
  reorderNodes: (nodes: FamilyNode[]) => void;
  resetToDefault: () => void;
}

const SystemContext = createContext<SystemContextValue | null>(null);

// Provider Component
export function SystemStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(systemReducer, null, () => createDefaultState());
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SystemState;
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist SystemState to localStorage:', error);
    }
  }, [state, isHydrated]);

  // Action dispatchers
  const addNode = (data: Omit<FamilyNode, 'id' | 'zodiacSign'>) => {
    dispatch({ type: 'ADD_NODE', payload: data });
  };

  const updateNode = (id: string, updates: Partial<Omit<FamilyNode, 'id' | 'zodiacSign'>>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } });
  };

  const removeNode = (id: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: id });
  };

  const reorderNodes = (nodes: FamilyNode[]) => {
    dispatch({ type: 'REORDER_NODES', payload: nodes });
  };

  const resetToDefault = () => {
    const defaultState = createDefaultState();
    dispatch({ type: 'HYDRATE', payload: defaultState });
  };

  return (
    <SystemContext.Provider
      value={{
        state,
        addNode,
        updateNode,
        removeNode,
        reorderNodes,
        resetToDefault,
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
    primaries: state.nodes.filter((n) => n.role === 'Primary'),
    dependents: state.nodes.filter((n) => n.role === 'Dependent'),
    byElement: (element: string) => state.nodes.filter((n) => n.zodiacSign.element === element),
  };
}
