import convert from 'bech32-converting';

export function bech32_to_hex(address: string): string {
  return convert('init').toHex(address);
}

export function hex_to_bech32(address: string): string {
  return convert('init').toBech32(address);
}
