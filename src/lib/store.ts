import { MockApiEndpoint } from "@/types/api";

/**
 * 서버 사이드 인메모리 스토어
 * (프로덕션에서는 DB 사용 권장)
 */
class MockApiStore {
    private endpoints: Map<string, MockApiEndpoint> = new Map();

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

    toggleEnabled(id: string): MockApiEndpoint | undefined {
        const ep = this.endpoints.get(id);
        if (!ep) return undefined;
        ep.enabled = !ep.enabled;
        ep.updatedAt = new Date().toISOString();
        this.endpoints.set(id, ep);
        return ep;
    }
}

// 싱글톤 인스턴스
const globalStore = globalThis as typeof globalThis & {
    __mockApiStore?: MockApiStore;
};

if (!globalStore.__mockApiStore) {
    globalStore.__mockApiStore = new MockApiStore();
}

export const store = globalStore.__mockApiStore;
