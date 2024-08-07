export function prepareSignBytes(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(prepareSignBytes)
  }

  // string, number, or null
  if (typeof obj !== `object` || obj === null) {
    return obj
  }

  const sorted: any = {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (obj[key] === undefined || obj[key] === null) return // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      sorted[key] = prepareSignBytes(obj[key]) // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    })
  return sorted
}

export abstract class JSONSerializable<A, D, P> {
  public abstract toAmino(): A
  public abstract toData(): D
  public abstract toProto(): P
  public toJSON(): string {
    return JSON.stringify(prepareSignBytes(this.toData()))
  }
  public toAminoJSON(): string {
    return JSON.stringify(prepareSignBytes(this.toAmino()))
  }
}

export function removeNull(obj: any): any {
  if (obj !== null && typeof obj === 'object') {
    // eslint-disable-line @typescript-eslint/no-unsafe-argument
    return Object.entries(obj) // eslint-disable-line @typescript-eslint/no-unsafe-argument
      .filter(([, v]) => v != null)
      .reduce(
        (acc, [k, v]) => ({
          ...acc,
          [k]: v === Object(v) && !Array.isArray(v) ? removeNull(v) : v,
        }),
        {}
      )
  }

  return obj
}
