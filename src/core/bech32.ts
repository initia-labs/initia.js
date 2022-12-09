import { bech32 } from 'bech32';
import converter from 'bech32-converting';

/** `init-` prefixed account address */
export type AccAddress = string;

/** `initvaloper-` prefixed validator operator address */
export type ValAddress = string;

/** `initvalcons-` prefixed validator consensus address */
export type ValConsAddress = string;

/** `initpub-` prefixed account public key */
export type AccPubKey = string;

/** `initvaloperpub-` prefixed validator public key */
export type ValPubKey = string;

function checkPrefixAndLength(
  prefix: string,
  data: string,
  length: number
): boolean {
  try {
    const vals = bech32.decode(data);
    return vals.prefix === prefix && data.length == length;
  } catch (e) {
    return false;
  }
}

export namespace AccAddress {
  /**
   * Checks if a string is a valid Initia account address.
   *
   * @param data string to check
   */
  export function validate(data: string): boolean {
    return checkPrefixAndLength('init', data, 43);
  }

  /**
   * Converts a validator address into an account address
   *
   * @param address validator address
   */
  export function fromValAddress(address: ValAddress): AccAddress {
    const vals = bech32.decode(address);
    return bech32.encode('init', vals.words);
  }

  /**
   * Converts a account address into a hex address
   *
   * @param address account address
   */
  export function toHex(address: AccAddress): string {
    return converter('init').toHex(address);
  }

  /**
   * Converts a hex address into an account address
   *
   * @param hexAddress hex address
   */
  export function fromHex(hexAddress: string): AccAddress {
    return converter('init').toBech32(hexAddress);
  }
}

export namespace AccPubKey {
  /**
   * Checks if a string is a Initia account's public key
   * @param data string to check
   */

  export function validate(data: string): boolean {
    return checkPrefixAndLength('initpub', data, 46);
  }

  /**
   * Converts a Initia validator pubkey to an account pubkey.
   * @param address validator pubkey to convert
   */
  export function fromAccAddress(address: AccAddress): AccPubKey {
    const vals = bech32.decode(address);
    return bech32.encode('initpub', vals.words);
  }
}

export namespace ValAddress {
  /**
   * Checks if a string is a Initia validator address.
   *
   * @param data string to check
   */
  export function validate(data: string): boolean {
    return checkPrefixAndLength('initvaloper', data, 50);
  }

  /**
   * Converts a Initia account address to a validator address.
   * @param address account address to convert
   */
  export function fromAccAddress(address: AccAddress): ValAddress {
    const vals = bech32.decode(address);
    return bech32.encode('initvaloper', vals.words);
  }
}

export namespace ValPubKey {
  /**
   * Checks if a string is a Initia validator pubkey
   * @param data string to check
   */
  export function validate(data: string): boolean {
    return checkPrefixAndLength('initvaloperpub', data, 53);
  }

  /**
   * Converts a Initia validator operator address to a validator pubkey.
   * @param valAddress account pubkey
   */
  export function fromValAddress(valAddress: ValAddress): ValPubKey {
    const vals = bech32.decode(valAddress);
    return bech32.encode('initvaloperpub', vals.words);
  }
}

export namespace ValConsAddress {
  /**
   * Checks if a string is a Initia validator consensus address
   * @param data string to check
   */

  export function validate(data: string): boolean {
    return checkPrefixAndLength('initvalcons', data, 50);
  }
}
