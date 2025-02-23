import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ProxmoxNode, NodeState } from '../types/proxmox';

type NodeAction = 
  | { type: 'ADD_NODE'; payload: ProxmoxNode }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'UPDATE_NODE_STATUS'; payload: { id: string; status: ProxmoxNode['status'] } }
  | { type: 'SELECT_NODE'; payload: string };

const STORAGE_KEY = 'pulse_nodes';

const initialState: NodeState = {
  nodes: {},
  selectedNode: undefined
};

const nodeReducer = (state: NodeState, action: NodeAction): NodeState => {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.payload.id]: action.payload
        }
      };
    case 'REMOVE_NODE':
      const { [action.payload]: removed, ...remainingNodes } = state.nodes;
      return {
        ...state,
        nodes: remainingNodes,
        selectedNode: state.selectedNode === action.payload ? undefined : state.selectedNode
      };
    case 'UPDATE_NODE_STATUS':
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.payload.id]: {
            ...state.nodes[action.payload.id],
            status: action.payload.status
          }
        }
      };
    case 'SELECT_NODE':
      return {
        ...state,
        selectedNode: action.payload
      };
    default:
      return state;
  }
};

const NodeContext = createContext<{
  state: NodeState;
  dispatch: React.Dispatch<NodeAction>;
} | null>(null);

// Load saved state from localStorage
const loadSavedState = (): NodeState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load saved nodes:', err);
  }
  return initialState;
};

export const NodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(nodeReducer, loadSavedState());

  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save nodes:', err);
    }
  }, [state]);

  return (
    <NodeContext.Provider value={{ state, dispatch }}>
      {children}
    </NodeContext.Provider>
  );
};

export const useNodes = () => {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNodes must be used within a NodeProvider');
  }
  return context;
}; 