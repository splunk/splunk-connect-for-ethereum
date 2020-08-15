import { GenericNodeAdapter } from './generic';

export class MockNodeAdapter extends GenericNodeAdapter {
    public get name(): string {
        return 'mock';
    }
}

export const MOCK_NODE_ADAPTER = new MockNodeAdapter('MOCK');
