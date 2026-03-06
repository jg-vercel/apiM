import { MockApiEndpoint } from "@/types/api";

class MockApiStore {
    private endpoints: Map<string, MockApiEndpoint>;

    constructor(endpoints: Map<string, MockApiEndpoint>) {
        this.endpoints = endpoints;
    }

    getAll(): MockApiEndpoint[] {
        return Array.from(this.endpoints.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    get(id: string): MockApiEndpoint | undefined {
        return this.endpoints.get(id);
    }

    findByPath(method: string, path: string): MockApiEndpoint | undefined {
        return Array.from(this.endpoints.values()).find(
            (ep) => ep.method === method && ep.path === path && ep.enabled
        );
    }

    create(endpoint: MockApiEndpoint): MockApiEndpoint {
        this.endpoints.set(endpoint.id, endpoint);
        return endpoint;
    }

    update(id: string, data: Partial<MockApiEndpoint>): MockApiEndpoint | undefined {
        const existing = this.endpoints.get(id);
        if (!existing) return undefined;

        const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
        this.endpoints.set(id, updated);
        return updated;
    }

    delete(id: string): boolean {
        return this.endpoints.delete(id);
    }

    deleteAll(): number {
        const count = this.endpoints.size;
        this.endpoints.clear();
        return count;
    }

    deleteMany(ids: string[]): number {
        let deleted = 0;
        for (const id of ids) {
            if (this.endpoints.delete(id)) {
                deleted++;
            }
        }
        return deleted;
    }

    toggleEnabled(id: string): MockApiEndpoint | undefined {
        const ep = this.endpoints.get(id);
        if (!ep) return undefined;
        ep.enabled = !ep.enabled;
        ep.updatedAt = new Date().toISOString();
        this.endpoints.set(id, ep);
        return ep;
    }
}

/**
 * globalThis에는 클래스 인스턴스 대신 원시 Map 데이터만 저장합니다.
 * HMR로 클래스가 재정의되어도 항상 최신 메서드를 사용하면서 데이터는 유지됩니다.
 */
const g = globalThis as typeof globalThis & {
    __mockApiStores?: Map<string, Map<string, MockApiEndpoint>>;
};

if (!g.__mockApiStores) {
    g.__mockApiStores = new Map();
}

const rawStores = g.__mockApiStores;

export const sessionManager = {
    getStore(sessionId: string): MockApiStore {
        let data = rawStores.get(sessionId);
        if (!data) {
            data = new Map();
            rawStores.set(sessionId, data);
        }
        return new MockApiStore(data);
    },

    deleteStore(sessionId: string): boolean {
        return rawStores.delete(sessionId);
    },

    findByPathAcrossAllSessions(method: string, path: string): MockApiEndpoint | undefined {
        for (const data of rawStores.values()) {
            const store = new MockApiStore(data);
            const endpoint = store.findByPath(method, path);
            if (endpoint) return endpoint;
        }
        return undefined;
    },
};
