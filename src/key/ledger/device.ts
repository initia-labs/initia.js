import Transport from '@ledgerhq/hw-transport';
import {
  CLA,
  ERROR_CODE,
  P1_VALUES,
  INS,
  PAYLOAD_TYPE,
  CHUNK_SIZE,
  ERROR_DESCRIPTION,
} from './constants';
import {
  AppInfoResponse,
  VersionResponse,
  DeviceInfoResponse,
  PublicKeyResponse,
  SignResponse,
} from './types';

function errorCodeToString(statusCode: number): string {
  if (statusCode in ERROR_DESCRIPTION) {
    return ERROR_DESCRIPTION[statusCode];
  }

  return `Unknown Status Code: ${statusCode}`;
}

function isDict(v: any): boolean {
  return (
    typeof v === 'object' &&
    v !== null &&
    !(v instanceof Array) &&
    !(v instanceof Date)
  );
}

function processErrorResponse(response: any) {
  if (response) {
    if (isDict(response)) {
      if (Object.prototype.hasOwnProperty.call(response, 'statusCode')) {
        return {
          return_code: response.statusCode,
          error_message: errorCodeToString(response.statusCode),
        };
      }

      if (
        Object.prototype.hasOwnProperty.call(response, 'return_code') &&
        Object.prototype.hasOwnProperty.call(response, 'error_message')
      ) {
        return response;
      }
    }

    return {
      return_code: 0xffff,
      error_message: response.toString(),
    };
  }

  return {
    return_code: 0xffff,
    error_message: response.toString(),
  };
}

export function serializePath(path: number[]): Buffer {
  if (path?.length !== 5) {
    throw new TypeError('Invalid path.');
  }

  const buf = Buffer.alloc(20);

  buf.writeUInt32LE(0x80000000 + path[0], 0);
  buf.writeUInt32LE(0x80000000 + path[1], 4);
  buf.writeUInt32LE(0x80000000 + path[2], 8);
  buf.writeUInt32LE(path[3], 12);
  buf.writeUInt32LE(path[4], 16);
  return buf;
}

export async function getVersion(
  transport: Transport
): Promise<VersionResponse> {
  return transport
    .send(CLA, INS.GET_VERSION, 0, 0)
    .then(response => {
      const errorCodeData = response.slice(-2);
      const return_code = errorCodeData[0] * 256 + errorCodeData[1];

      let targetId = 0;
      if (response.length >= 9) {
        /* eslint-disable no-bitwise */
        targetId =
          (response[5] << 24) +
          (response[6] << 16) +
          (response[7] << 8) +
          (response[8] << 0);
        /* eslint-enable no-bitwise */
      }

      return {
        return_code: return_code,
        error_message: errorCodeToString(return_code),
        // ///
        test_mode: response[0] !== 0,
        major: response[1],
        minor: response[2],
        patch: response[3],
        device_locked: response[4] === 1,
        target_id: targetId.toString(16),
      };
    })
    .catch(processErrorResponse);
}

export async function getAppInfo(
  transport: Transport
): Promise<AppInfoResponse> {
  return transport
    .send(0xb0, 0x01, 0, 0)
    .then(response => {
      const errorCodeData = response.slice(-2);
      let return_code: number = errorCodeData[0] * 256 + errorCodeData[1];
      let error_message: string;

      let app_name = 'err';
      let app_version = 'err';
      let flag_len = 0;
      let flags_value = 0;

      if (response[0] !== 1) {
        // Ledger responds with format ID 1. There is no spec for any format != 1
        error_message = 'response format ID not recognized';
        return_code = 0x9001;
      } else {
        error_message = 'No errors';
        const appNameLen = response[1];
        app_name = response.slice(2, 2 + appNameLen).toString('ascii');
        let idx = 2 + appNameLen;
        const appVersionLen = response[idx];
        idx += 1;
        app_version = response
          .slice(idx, idx + appVersionLen)
          .toString('ascii');
        idx += appVersionLen;
        const appFlagsLen = response[idx];
        idx += 1;
        flag_len = appFlagsLen;
        flags_value = response[idx];
      }

      return {
        return_code,
        error_message,
        // //
        app_name,
        app_version,
        flag_len,
        flags_value,
        // eslint-disable-next-line no-bitwise
        flag_recovery: (flags_value & 1) !== 0,
        // eslint-disable-next-line no-bitwise
        flag_signed_mcu_code: (flags_value & 2) !== 0,
        // eslint-disable-next-line no-bitwise
        flag_onboarded: (flags_value & 4) !== 0,
        // eslint-disable-next-line no-bitwise
        flag_pin_validated: (flags_value & 128) !== 0,
      };
    })
    .catch(processErrorResponse);
}

export async function getDeviceInfo(
  transport: Transport
): Promise<DeviceInfoResponse> {
  return transport
    .send(0xe0, 0x01, 0, 0, Buffer.from([]), [ERROR_CODE.NoError, 0x6e00])
    .then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      if (returnCode === 0x6e00) {
        return {
          return_code: returnCode,
          error_message: 'This command is only available in the Dashboard',
        };
      }

      const target_id = response.slice(0, 4).toString('hex');

      let pos = 4;
      const secureElementVersionLen = response[pos];
      pos += 1;
      const se_version = response
        .slice(pos, pos + secureElementVersionLen)
        .toString();
      pos += secureElementVersionLen;

      const flagsLen = response[pos];
      pos += 1;
      const flag = response.slice(pos, pos + flagsLen).toString('hex');
      pos += flagsLen;

      const mcuVersionLen = response[pos];
      pos += 1;
      // Patch issue in mcu version
      let tmp = response.slice(pos, pos + mcuVersionLen);
      if (tmp[mcuVersionLen - 1] === 0) {
        tmp = response.slice(pos, pos + mcuVersionLen - 1);
      }
      const mcu_version = tmp.toString();

      return {
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
        // //
        target_id,
        se_version,
        flag,
        mcu_version,
      };
    })
    .catch(processErrorResponse);
}

export async function publicKey(
  transport: Transport,
  data: Buffer
): Promise<PublicKeyResponse> {
  return transport
    .send(CLA, INS.GET_ADDR_SECP256K1, 0, 0, data, [ERROR_CODE.NoError])
    .then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode: number = errorCodeData[0] * 256 + errorCodeData[1];
      const compressedPk = response ? Buffer.from(response.slice(0, 33)) : null;

      return {
        pk: 'OBSOLETE PROPERTY',
        compressed_pk: compressedPk ? compressedPk.toJSON() : compressedPk,
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
      };
    })
    .catch(processErrorResponse);
}

export async function getAddressAndPubKey(
  transport: Transport,
  data: Buffer
): Promise<PublicKeyResponse> {
  return transport
    .send(CLA, INS.GET_ADDR_SECP256K1, P1_VALUES.ONLY_RETRIEVE, 0, data, [
      ERROR_CODE.NoError,
    ])
    .then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      const compressedPk = Buffer.from(response.slice(0, 33));
      const bech32Address = Buffer.from(response.slice(33, -2)).toString();

      return {
        bech32_address: bech32Address,
        compressed_pk: compressedPk.toJSON(),
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
      };
    })
    .catch(processErrorResponse);
}

export async function showAddressAndPubKey(
  transport: Transport,
  data: Buffer
): Promise<PublicKeyResponse> {
  return transport
    .send(
      CLA,
      INS.GET_ADDR_SECP256K1,
      P1_VALUES.SHOW_ADDRESS_IN_DEVICE,
      0,
      data,
      [ERROR_CODE.NoError]
    )
    .then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      const compressedPk = Buffer.from(response.slice(0, 33));
      const bech32Address = Buffer.from(response.slice(33, -2)).toString();

      return {
        bech32_address: bech32Address,
        compressed_pk: compressedPk.toJSON(),
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
      };
    })
    .catch(processErrorResponse);
}

function signGetChunks(path: number[], message: Buffer): Buffer[] {
  const result = serializePath(path);
  const chunks: Buffer[] = [];

  if (result instanceof Buffer) {
    chunks.push(result);
    const buffer = Buffer.from(message);

    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (i > buffer.length) {
        end = buffer.length;
      }
      chunks.push(buffer.slice(i, end));
    }
  }

  return chunks;
}

async function signSendChunk(
  transport: Transport,
  chunkIdx: number,
  chunkNum: number,
  chunk: Buffer
): Promise<SignResponse> {
  let payloadType = PAYLOAD_TYPE.ADD;

  if (chunkIdx === 1) {
    payloadType = PAYLOAD_TYPE.INIT;
  }

  if (chunkIdx === chunkNum) {
    payloadType = PAYLOAD_TYPE.LAST;
  }

  return transport
    .send(CLA, INS.SIGN_SECP256K1, payloadType, 0, chunk, [
      ERROR_CODE.NoError,
      0x6984,
      0x6a80,
    ])
    .then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
      let errorMessage = errorCodeToString(returnCode);

      if (returnCode === 0x6a80 || returnCode === 0x6984) {
        errorMessage = `${errorMessage} : ${response
          .slice(0, response.length - 2)
          .toString('ascii')}`;
      }

      let signature: Buffer = Buffer.from([]);

      if (response.length > 2) {
        signature = response.slice(0, response.length - 2);
      }

      return {
        signature: signature.toJSON(),
        return_code: returnCode,
        error_message: errorMessage,
      };
    })
    .catch(processErrorResponse);
}

export async function sign(
  transport: Transport,
  path: number[],
  message: Buffer
): Promise<SignResponse> {
  const chunks = signGetChunks(path, message);

  return signSendChunk(transport, 1, chunks.length, chunks[0])
    .then(async response => {
      let result: SignResponse = {
        return_code: response.return_code,
        error_message: response.error_message,
        signature: { type: 'Buffer', data: [] },
      };

      for (let i = 1; i < chunks.length; i += 1) {
        result = await signSendChunk(
          transport,
          1 + i,
          chunks.length,
          chunks[i]
        );

        if (result.return_code !== ERROR_CODE.NoError) {
          break;
        }
      }

      return {
        return_code: result.return_code,
        error_message: result.error_message,
        signature: result.signature,
      };
    })
    .catch(processErrorResponse);
}
