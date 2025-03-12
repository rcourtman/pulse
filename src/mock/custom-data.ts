/**
 * Custom Mock Data for Screenshots
 * 
 * This file contains custom mock data for generating screenshots.
 * It provides a consistent set of data with different guests for each node.
 * The data is designed to mimic typical Proxmox deployments with realistic naming and resource allocation.
 */

export const customMockData = {
  nodes: [
    {
      id: 'node-1',
      name: 'MOCK-pve1',
      status: 'online',
      cpu: { usage: 0.72, cores: 32 },
      memory: { used: 103079215104, total: 137438953472 }, // 96GB used of 128GB
      guests: [
        { 
          id: '101', 
          name: 'mock-db-master', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.65, 
          memory: 34359738368, // 32GB
          disk: { used: 858993459200, total: 1099511627776 } // 800GB used of 1TB
        },
        { 
          id: '104', 
          name: 'mock-web1', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.28, 
          memory: 8589934592, // 8GB
          disk: { used: 32212254720, total: 107374182400 } // 30GB used of 100GB
        },
        { 
          id: '107', 
          name: 'mock-web2', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.31, 
          memory: 8589934592, // 8GB
          disk: { used: 34359738368, total: 107374182400 } // 32GB used of 100GB
        },
        { 
          id: '110', 
          name: 'mock-redis', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.22, 
          memory: 16777216000, // 16GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '115', 
          name: 'mock-mail', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.18, 
          memory: 8589934592, // 8GB
          disk: { used: 214748364800, total: 322122547200 } // 200GB used of 300GB
        },
        { 
          id: '203', 
          name: 'mock-lb1', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.08, 
          memory: 2147483648, // 2GB
          disk: { used: 2147483648, total: 10737418240 } // 2GB used of 10GB
        },
        { 
          id: '204', 
          name: 'mock-lb2', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.07, 
          memory: 2147483648, // 2GB
          disk: { used: 2147483648, total: 10737418240 } // 2GB used of 10GB
        },
        { 
          id: '210', 
          name: 'mock-monitoring', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.12, 
          memory: 4294967296, // 4GB
          disk: { used: 32212254720, total: 53687091200 } // 30GB used of 50GB
        },
        { 
          id: '999', 
          name: 'mock-shared-vm', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.25, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '888', 
          name: 'mock-shared-container', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.15, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        }
      ]
    },
    {
      id: 'node-2',
      name: 'MOCK-pve2',
      status: 'online',
      cpu: { usage: 0.35, cores: 16 },
      memory: { used: 28991029248, total: 68719476736 }, // 27GB used of 64GB
      guests: [
        { 
          id: '121', 
          name: 'mock-dev-db', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.12, 
          memory: 8589934592, // 8GB
          disk: { used: 53687091200, total: 214748364800 } // 50GB used of 200GB
        },
        { 
          id: '125', 
          name: 'mock-dev-web1', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.08, 
          memory: 4294967296, // 4GB
          disk: { used: 10737418240, total: 53687091200 } // 10GB used of 50GB
        },
        { 
          id: '126', 
          name: 'mock-dev-web2', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 4294967296, // 4GB
          disk: { used: 10737418240, total: 53687091200 } // 10GB used of 50GB
        },
        { 
          id: '130', 
          name: 'mock-test-api', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.05, 
          memory: 4294967296, // 4GB
          disk: { used: 8589934592, total: 32212254720 } // 8GB used of 30GB
        },
        { 
          id: '142', 
          name: 'mock-jenkins', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.25, 
          memory: 8589934592, // 8GB
          disk: { used: 85899345920, total: 107374182400 } // 80GB used of 100GB
        },
        { 
          id: '220', 
          name: 'mock-dev-tools', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.03, 
          memory: 1073741824, // 1GB
          disk: { used: 4294967296, total: 10737418240 } // 4GB used of 10GB
        },
        { 
          id: '225', 
          name: 'mock-staging-proxy', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.02, 
          memory: 1073741824, // 1GB
          disk: { used: 2147483648, total: 10737418240 } // 2GB used of 10GB
        },
        { 
          id: '999', 
          name: 'mock-shared-vm', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.25, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '888', 
          name: 'mock-shared-container', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.15, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        }
      ]
    },
    {
      id: 'node-3',
      name: 'MOCK-pve3',
      status: 'online',
      cpu: { usage: 0.22, cores: 8 },
      memory: { used: 12884901888, total: 34359738368 }, // 12GB used of 32GB
      guests: [
        { 
          id: '150', 
          name: 'mock-win10-test', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.15, 
          memory: 8589934592, // 8GB
          disk: { used: 64424509440, total: 107374182400 } // 60GB used of 100GB
        },
        { 
          id: '151', 
          name: 'mock-ubuntu22-template', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 21474836480 } // 5GB used of 20GB
        },
        { 
          id: '155', 
          name: 'mock-debian11-template', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 4294967296, total: 21474836480 } // 4GB used of 20GB
        },
        { 
          id: '180', 
          name: 'mock-game-server', 
          type: 'vm', 
          status: 'paused', 
          cpu: 0, 
          memory: 16777216000, // 16GB
          disk: { used: 214748364800, total: 322122547200 } // 200GB used of 300GB
        },
        { 
          id: '240', 
          name: 'mock-pihole-dns', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.01, 
          memory: 536870912, // 512MB
          disk: { used: 1073741824, total: 5368709120 } // 1GB used of 5GB
        },
        { 
          id: '245', 
          name: 'mock-home-automation', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.04, 
          memory: 1073741824, // 1GB
          disk: { used: 3221225472, total: 10737418240 } // 3GB used of 10GB
        },
        { 
          id: '250', 
          name: 'mock-media-server', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.08, 
          memory: 2147483648, // 2GB
          disk: { used: 536870912000, total: 1099511627776 } // 500GB used of 1TB
        },
        { 
          id: '999', 
          name: 'mock-shared-vm', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.25, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '888', 
          name: 'mock-shared-container', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.15, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        }
      ]
    }
  ]
}; 