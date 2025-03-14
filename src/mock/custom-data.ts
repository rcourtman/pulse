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
      name: 'pve-prod-01',
      status: 'online',
      cpu: { usage: 0.62, cores: 32 },
      memory: { used: 103079215104, total: 137438953472 }, // 96GB used of 128GB
      guests: [
        { 
          id: '101', 
          name: 'db-primary', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.78, 
          memory: 34359738368, // 32GB
          disk: { used: 858993459200, total: 1099511627776 } // 800GB used of 1TB
        },
        { 
          id: '102', 
          name: 'db-replica-01', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.45, 
          memory: 17179869184, // 16GB
          disk: { used: 536870912000, total: 1099511627776 } // 500GB used of 1TB
        },
        { 
          id: '104', 
          name: 'web-prod-01', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.32, 
          memory: 8589934592, // 8GB
          disk: { used: 32212254720, total: 107374182400 } // 30GB used of 100GB
        },
        { 
          id: '105', 
          name: 'web-prod-02', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.27, 
          memory: 8589934592, // 8GB
          disk: { used: 34359738368, total: 107374182400 } // 32GB used of 100GB
        },
        { 
          id: '110', 
          name: 'redis-cache-01', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.22, 
          memory: 16777216000, // 16GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '115', 
          name: 'mail-server', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.18, 
          memory: 8589934592, // 8GB
          disk: { used: 214748364800, total: 322122547200 } // 200GB used of 300GB
        },
        { 
          id: '203', 
          name: 'haproxy-01', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.15, 
          memory: 2147483648, // 2GB
          disk: { used: 3221225472, total: 10737418240 } // 3GB used of 10GB
        },
        { 
          id: '204', 
          name: 'haproxy-02', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.12, 
          memory: 2147483648, // 2GB
          disk: { used: 3221225472, total: 10737418240 } // 3GB used of 10GB
        },
        { 
          id: '210', 
          name: 'grafana-prometheus', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.24, 
          memory: 4294967296, // 4GB
          disk: { used: 32212254720, total: 53687091200 } // 30GB used of 50GB
        },
        { 
          id: '211', 
          name: 'loki-logs', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.19, 
          memory: 4294967296, // 4GB
          disk: { used: 42949672960, total: 107374182400 } // 40GB used of 100GB
        },
        { 
          id: '999', 
          name: 'clustered-app', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.35, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '888', 
          name: 'clustered-service', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.22, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        }
      ]
    },
    {
      id: 'node-2',
      name: 'pve-prod-02',
      status: 'online',
      cpu: { usage: 0.58, cores: 32 },
      memory: { used: 90194313216, total: 137438953472 }, // 84GB used of 128GB
      guests: [
        { 
          id: '103', 
          name: 'db-replica-02', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.42, 
          memory: 17179869184, // 16GB
          disk: { used: 504403158016, total: 1099511627776 } // 470GB used of 1TB
        },
        { 
          id: '106', 
          name: 'web-prod-03', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.36, 
          memory: 8589934592, // 8GB
          disk: { used: 32212254720, total: 107374182400 } // 30GB used of 100GB
        },
        { 
          id: '107', 
          name: 'web-prod-04', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.29, 
          memory: 8589934592, // 8GB
          disk: { used: 33285996544, total: 107374182400 } // 31GB used of 100GB
        },
        { 
          id: '111', 
          name: 'redis-cache-02', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.19, 
          memory: 16777216000, // 16GB
          disk: { used: 20401094656, total: 53687091200 } // 19GB used of 50GB
        },
        { 
          id: '120', 
          name: 'elasticsearch-01', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.46, 
          memory: 17179869184, // 16GB
          disk: { used: 236223201280, total: 322122547200 } // 220GB used of 300GB
        },
        { 
          id: '121', 
          name: 'logstash-01', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.32, 
          memory: 8589934592, // 8GB
          disk: { used: 42949672960, total: 107374182400 } // 40GB used of 100GB
        },
        { 
          id: '205', 
          name: 'nginx-01', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.13, 
          memory: 2147483648, // 2GB
          disk: { used: 3221225472, total: 10737418240 } // 3GB used of 10GB
        },
        { 
          id: '206', 
          name: 'nginx-02', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.12, 
          memory: 2147483648, // 2GB
          disk: { used: 3221225472, total: 10737418240 } // 3GB used of 10GB
        },
        { 
          id: '207', 
          name: 'jenkins-ci', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.38, 
          memory: 4294967296, // 4GB
          disk: { used: 64424509440, total: 107374182400 } // 60GB used of 100GB
        },
        { 
          id: '212', 
          name: 'kibana-dashboard', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.17, 
          memory: 2147483648, // 2GB
          disk: { used: 8589934592, total: 10737418240 } // 8GB used of 10GB
        },
        { 
          id: '999', 
          name: 'clustered-app', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '888', 
          name: 'clustered-service', 
          type: 'ct', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        }
      ]
    },
    {
      id: 'node-3',
      name: 'pve-dev-01',
      status: 'online',
      cpu: { usage: 0.38, cores: 16 },
      memory: { used: 24696061952, total: 34359738368 }, // 23GB used of 32GB
      guests: [
        { 
          id: '150', 
          name: 'win10-testing', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.25, 
          memory: 8589934592, // 8GB
          disk: { used: 64424509440, total: 107374182400 } // 60GB used of 100GB
        },
        { 
          id: '151', 
          name: 'ubuntu-22.04-template', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 21474836480 } // 5GB used of 20GB
        },
        { 
          id: '152', 
          name: 'debian-12-template', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 4294967296, total: 21474836480 } // 4GB used of 20GB
        },
        { 
          id: '153', 
          name: 'fedora-38-template', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 4831838208, total: 21474836480 } // 4.5GB used of 20GB
        },
        { 
          id: '160', 
          name: 'dev-db', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.12, 
          memory: 4294967296, // 4GB
          disk: { used: 53687091200, total: 107374182400 } // 50GB used of 100GB
        },
        { 
          id: '161', 
          name: 'dev-web', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.08, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '162', 
          name: 'dev-api', 
          type: 'vm', 
          status: 'running', 
          cpu: 0.09, 
          memory: 4294967296, // 4GB
          disk: { used: 16777216000, total: 53687091200 } // 16GB used of 50GB
        },
        { 
          id: '180', 
          name: 'minecraft-server', 
          type: 'vm', 
          status: 'paused', 
          cpu: 0, 
          memory: 16777216000, // 16GB
          disk: { used: 214748364800, total: 322122547200 } // 200GB used of 300GB
        },
        { 
          id: '240', 
          name: 'pihole-dns', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.03, 
          memory: 536870912, // 512MB
          disk: { used: 1610612736, total: 5368709120 } // 1.5GB used of 5GB
        },
        { 
          id: '241', 
          name: 'unifi-controller', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.07, 
          memory: 1073741824, // 1GB
          disk: { used: 3758096384, total: 10737418240 } // 3.5GB used of 10GB
        },
        { 
          id: '242', 
          name: 'home-assistant', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.09, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        },
        { 
          id: '243', 
          name: 'plex-media', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.16, 
          memory: 4294967296, // 4GB
          disk: { used: 751619276800, total: 1099511627776 } // 700GB used of 1TB
        },
        { 
          id: '244', 
          name: 'transmission-dl', 
          type: 'ct', 
          status: 'running', 
          cpu: 0.06, 
          memory: 2147483648, // 2GB
          disk: { used: 644245094400, total: 1099511627776 } // 600GB used of 1TB
        },
        { 
          id: '999', 
          name: 'clustered-app', 
          type: 'vm', 
          status: 'stopped', 
          cpu: 0, 
          memory: 4294967296, // 4GB
          disk: { used: 21474836480, total: 53687091200 } // 20GB used of 50GB
        },
        { 
          id: '888', 
          name: 'clustered-service', 
          type: 'ct', 
          status: 'stopped', 
          cpu: 0, 
          memory: 2147483648, // 2GB
          disk: { used: 5368709120, total: 10737418240 } // 5GB used of 10GB
        }
      ]
    }
  ]
}; 