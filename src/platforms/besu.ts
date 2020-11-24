import { GethAdapter } from './geth';

export class BesuAdapter extends GethAdapter {
    public get name(): string {
        return 'besu';
    }
}
