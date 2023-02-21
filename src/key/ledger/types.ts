export interface JSONBuffer {
  type: 'Buffer';
  data: number[];
}

export interface CommonResponse {
  return_code: number;
  error_message: string;
  device_locked?: boolean;
}

export interface PublicKeyResponse extends CommonResponse {
  bech32_address: string;
  pk: 'OBSOLETE PROPERTY';
  compressed_pk: JSONBuffer;
}

export interface AddressResponse extends CommonResponse {
  bech32_address: string;
  compressed_pk: JSONBuffer;
}

export interface SignResponse extends CommonResponse {
  signature: JSONBuffer;
}

export interface AppInfoResponse extends CommonResponse {
  app_name: string;
  app_version: string;
  flag_len: number;
  flags_value: number;
  flag_recovery: boolean;
  flag_signed_mcu_code: boolean;
  flag_onboarded: boolean;
  flag_pin_validated: Boolean;
}

export interface VersionResponse extends CommonResponse {
  test_mode: boolean;
  major: number;
  minor: number;
  patch: number;
  target_id: string;
}

export interface DeviceInfoResponse extends CommonResponse {
  target_id: string; // '31100004',
  se_version: string; // '1.6.0',
  flag: string; // 'a6000000',
  mcu_version: string; // '1.11'
}
