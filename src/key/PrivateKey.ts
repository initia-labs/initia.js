import { RawKey } from './RawKey';

export const INIT_COIN_TYPE = 118;

interface PrivateKeyOptions {
    privateKey?: string;
}

/**
 * Implements a wallet initialized with a private key.
 */
export class PrivateKey extends RawKey {
    privateKey: string;

    /**
     * Creates a new signing key from a private key.
     *
     * ```ts
     * import { PrivateKey } from 'initia.js';
     *
     * const pk = new PrivateKey({ privateKey: '...' });
     * console.log(pk.accAddress);
     * ```
     *
     * @param options
     */
    constructor(options: PrivateKeyOptions) {
        if (!options || !options.privateKey) {
            throw new Error('Private key is required');
        }

        let { privateKey } = options;

        if (privateKey.startsWith('0x')) {
            privateKey = privateKey.slice(2);
        }

        if (privateKey.length !== 64) {
            throw new Error('Invalid private key length');
        }

        const privateKeyBuffer = Buffer.from(privateKey, 'hex');

        super(privateKeyBuffer);

        this.privateKey = privateKeyBuffer.toString('hex');
    }
}
