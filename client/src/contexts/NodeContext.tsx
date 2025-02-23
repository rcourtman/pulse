import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Node {
  id: string;
  name?: string;
  host: string;
  tokenId: string;
  status?: 'online' | 'offline' | 'error';
  metrics?: any;
}

interface NodeState {
  nodes: Record<string, Node>;
}

type NodeAction = 
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'UPDATE_NODE'; payload: { id: string; name?: string; host?: string; tokenId?: string; status: string; metrics?: any } };

const initialState: NodeState = {
  nodes: {}
};

function nodeReducer(state: NodeState, action: NodeAction): NodeState {
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
        nodes: remainingNodes
      };
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.payload.id]: {
            ...state.nodes[action.payload.id],
            id: action.payload.id,
            name: action.payload.name || state.nodes[action.payload.id]?.name,
            host: action.payload.host || state.nodes[action.payload.id]?.host,
            tokenId: action.payload.tokenId || state.nodes[action.payload.id]?.tokenId,
            status: action.payload.status,
            metrics: action.payload.metrics
          }
        }
      };
    default:
      return state;
  }
}

const NodeContext = createContext<{
  state: NodeState;
  dispatch: React.Dispatch<NodeAction>;
} | null>(null);

export const NodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(nodeReducer, initialState);

  // Clear localStorage on mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('nodes');
  }, []);

  // Save nodes to localStorage when they change
  useEffect(() => {
    localStorage.setItem('nodes', JSON.stringify(state.nodes));
  }, [state.nodes]);

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