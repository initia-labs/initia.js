import converter from 'bech32-converting';
import { bcs, BcsWriter, BcsReader, TypeInterface, encodeStr, decodeStr } from '@mysten/bcs';
import { toB64, fromB64, fromHEX, toHEX } from '@mysten/bcs';
export { toB64, fromB64, fromHEX, toHEX };
export { ExtendedBcs as bcs, BcsWriter, BcsReader, TypeInterface, encodeStr, decodeStr };

export function serializeString(data: string): string {
  return serialize(ExtendedBcs.STRING, data);
}

export function serializeAddress(data: string): string {
  if (!ExtendedBcs.hasType(ExtendedBcs.ADDRESS)) {
    ExtendedBcs.registerAddressType(ExtendedBcs.ADDRESS, 20, 'hex');
  }
  const converted = converter('init').toHex(data);
  return serialize(ExtendedBcs.ADDRESS, converted);
}

export function serializeVector(type: string, data: any): string {
  if (!ExtendedBcs.hasType(type)) {
    throw Error(`Must register type ${type} first`)
  }

  const vectorType = `vector<${type}>`;
  if (!ExtendedBcs.hasType(vectorType)) {
    ExtendedBcs.registerVectorType(vectorType, type);
  }

  return serialize(vectorType, data);
}

export function serializeOption(type: string, data: any): string {
  if (!ExtendedBcs.hasType(type)) {
    throw Error(`Must register type ${type} first`)
  }

  const optionType = `option<${type}>`;
  if (!ExtendedBcs.hasType(optionType)) {
    ExtendedBcs.registerOptionType(optionType, type);
  }

  return serialize(optionType, data);
}

function serialize(type: string, data: any): string {
  return ExtendedBcs.ser(type, data).toString('base64');
}

class ExtendedBcs extends bcs {
    public static registerOptionType(name: string, valueType: string) {
        return this.registerType(
            name,
            (writer: BcsWriter, data: any) => writeOption(writer, data, (writer: BcsWriter, val: any) => {
                return bcs.getTypeInterface(valueType)._encodeRaw(writer, val);
            }),
            (reader: BcsReader) => readOption(reader, (reader: BcsReader) => {
                return bcs.getTypeInterface(valueType)._decodeRaw(reader);
            })
        );

    }
}

function writeOption(
    writer: BcsWriter,
    value: any,
    cb: (writer: BcsWriter, value: any) => {}
): BcsWriter {
    if (value != null) {
        writer.write8(1);
        cb(writer, value);
    }
    else {
        writer.write8(0);
    }
    return writer;
}

function readOption(reader: BcsReader, cb: (reader: BcsReader) => any): any {
    let isSome = reader.read8().toString(10) === '1';
    if (!isSome) {
        return null;
    }
    return cb(reader);
}
