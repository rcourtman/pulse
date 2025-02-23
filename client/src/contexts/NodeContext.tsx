import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { ProxmoxNode, NodeState } from '../types/proxmox';
import { useWebSocketContext } from './WebSocketContext';

type NodeAction = 
  | { type: 'ADD_NODE'; payload: ProxmoxNode }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'UPDATE_NODE_STATUS'; payload: { id: string; status: ProxmoxNode['status'] } }
  | { type: 'SELECT_NODE'; payload: string }
  | { type: 'UPDATE_NODE'; payload: { id: string; node: ProxmoxNode } };

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
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.payload.id]: {
            ...state.nodes[action.payload.id],
            ...action.payload.node
          }
        }
      };
    default:
      return state;
  }
};

const NodeContext = createContext<{
  state: NodeState;
  dispatch: React.Dispatch<NodeAction>;
} | null>(null);

export const NodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(nodeReducer, initialState);
  const { socket } = useWebSocketContext();
  const [initializedNodes] = useState(new Set<string>());

  console.log('NodeProvider rendering', { state });

  useEffect(() => {
    try {
      // Load saved nodes from localStorage
      const savedNodes = localStorage.getItem('nodes');
      if (savedNodes) {
        const nodes = JSON.parse(savedNodes);
        Object.entries(nodes).forEach(([id, node]) => {
          dispatch({ type: 'ADD_NODE', payload: { id, ...node } });
        });
      }
    } catch (error) {
      console.error('Error loading saved nodes:', error);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // When a node is added, fetch its available nodes
    const fetchNodeInfo = async (nodeId: string) => {
      // Skip if we've already initialized this node
      if (initializedNodes.has(nodeId)) return;
      
      try {
        const response = await fetch(`/api/proxmox/test/${nodeId}`);
        const data = await response.json();
        if (data.nodes && data.nodes.length > 0) {
          // Update the node with the correct node name from the server
          dispatch({
            type: 'UPDATE_NODE',
            payload: {
              id: nodeId,
              node: {
                ...state.nodes[nodeId],
                nodeName: data.nodes[0] // Use the first available node
              }
            }
          });
          // Mark this node as initialized
          initializedNodes.add(nodeId);
        }
      } catch (error) {
        console.error('Failed to fetch node info:', error);
      }
    };

    // Only fetch info for nodes we haven't initialized yet
    Object.keys(state.nodes)
      .filter(nodeId => !initializedNodes.has(nodeId))
      .forEach(nodeId => fetchNodeInfo(nodeId));
  }, [socket, state.nodes, initializedNodes]);

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