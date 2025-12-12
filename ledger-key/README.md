# @initia/ledger-key

Ledger hardware wallet support for [@initia/initia.js](https://github.com/initia-labs/initia.js).

## Installation

```bash
npm install @initia/ledger-key @initia/initia.js
```

## Usage

### Browser (WebHID)

```typescript
import TransportWebHid from '@ledgerhq/hw-transport-webhid';
import { LedgerKey } from '@initia/ledger-key';

const transport = await TransportWebHid.create();
const ledgerKey = await LedgerKey.create(transport);
```

### Browser (WebUSB)

```typescript
import TransportWebUsb from '@ledgerhq/hw-transport-webusb';
import { LedgerKey } from '@initia/ledger-key';

const transport = await TransportWebUsb.create();
const ledgerKey = await LedgerKey.create(transport);
```

### Node.js

```bash
npm install @ledgerhq/hw-transport-node-hid
```

```typescript
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { LedgerKey } from '@initia/ledger-key';

const transport = await TransportNodeHid.create();
const ledgerKey = await LedgerKey.create(transport);
```

## Supported Apps

| App | Coin Type | Derivation Path | Sign Mode |
|-----|-----------|-----------------|-----------|
| Ethereum | 60 | `44'/60'/0'/0/{index}` | EIP-191 |
| Cosmos | 118 | `m/44'/118'/0'/0/{index}` | Amino JSON |

```typescript
import { LedgerKey, Kind } from '@initia/ledger-key';

// Ethereum app (default)
const ethKey = await LedgerKey.create(transport, 0, Kind.Ethereum);

// Cosmos app
const cosmosKey = await LedgerKey.create(transport, 0, Kind.Cosmos);
```

## Testing

```bash
# Unit tests
npm test

# Integration tests (requires Ledger device)
LEDGER_TEST_ETH=true npm test      # Ethereum app
LEDGER_TEST_COSMOS=true npm test   # Cosmos app
```

## License

Apache-2.0
