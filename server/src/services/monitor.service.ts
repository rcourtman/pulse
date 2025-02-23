interface Node {
    id: string;
    host: string;
    tokenId: string;
    tokenSecret: string;
    nodeName: string;
}

export class NodeMonitor {
    private nodes: Node[] = [];

    getNode(nodeId: string) {
        return this.nodes.find(node => node.id === nodeId);
    }

    addNode(node: Node) {
        this.nodes.push(node);
    }

    removeNode(nodeId: string) {
        this.nodes = this.nodes.filter(node => node.id !== nodeId);
    }

    getNodes() {
        return this.nodes;
    }
}

// Create and export a singleton instance
export const monitor = new NodeMonitor(); 