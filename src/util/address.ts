import convert from 'bech32-converting';

export function bech32ToHex(address: string): string {
  return convert('init').toHex(address);
}

export function hexToBech32(address: string): string {
  return convert('init').toBech32(address);
}
