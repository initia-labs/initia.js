/**
 * Cosmos Event Utilities
 *
 * Provides helpers for working with Cosmos SDK transaction events.
 * These utilities work with events from both transaction results and WebSocket subscriptions.
 */

// =============================================================================
// Types (compatible with TxEvent from websocket.ts)
// =============================================================================

/**
 * Cosmos event attribute.
 */
export interface EventAttribute {
  /** Attribute key */
  key: string
  /** Attribute value */
  value: string
}

/**
 * Cosmos event from transaction result.
 */
export interface CosmosEvent {
  /** Event type (e.g., 'transfer', 'message', 'coin_spent') */
  type: string
  /** Event attributes */
  attributes: EventAttribute[]
}

/**
 * Parsed Wasm event with structured data.
 */
export interface ParsedWasmEvent {
  /** Contract address */
  contractAddress: string
  /** Action name (from _action attribute or first custom attribute) */
  action?: string
  /** All attributes as key-value pairs (excluding underscore-prefixed system attributes) */
  data: Record<string, string>
  /** Original event */
  raw: CosmosEvent
}

/**
 * Parsed Move event with structured data.
 */
export interface ParsedMoveEvent {
  /** Module address */
  moduleAddress?: string
  /** Module name */
  moduleName?: string
  /** Event type (full type string) */
  eventType?: string
  /** Event data (base64 decoded if possible) */
  data: Record<string, string>
  /** Original event */
  raw: CosmosEvent
}

// =============================================================================
// Basic Event Functions
// =============================================================================

/**
 * Find the first event with the specified type.
 *
 * @param events - Array of events to search
 * @param type - Event type to find
 * @returns First matching event or undefined
 *
 * @example
 * ```typescript
 * import { findEvent } from 'initia.js'
 *
 * const transferEvent = findEvent(txResult.events, 'transfer')
 * if (transferEvent) {
 *   console.log('Transfer found')
 * }
 * ```
 */
export function findEvent(events: CosmosEvent[], type: string): CosmosEvent | undefined {
  return events.find(e => e.type === type)
}

/**
 * Find all events with the specified type.
 *
 * @param events - Array of events to search
 * @param type - Event type to find
 * @returns Array of matching events
 *
 * @example
 * ```typescript
 * import { findEvents } from 'initia.js'
 *
 * const transfers = findEvents(txResult.events, 'transfer')
 * console.log(`Found ${transfers.length} transfers`)
 * ```
 */
export function findEvents(events: CosmosEvent[], type: string): CosmosEvent[] {
  return events.filter(e => e.type === type)
}

/**
 * Get a single attribute value from an event.
 *
 * @param event - Event to get attribute from
 * @param key - Attribute key
 * @returns Attribute value or undefined if not found
 *
 * @example
 * ```typescript
 * import { findEvent, getEventAttribute } from 'initia.js'
 *
 * const transfer = findEvent(events, 'transfer')
 * if (transfer) {
 *   const recipient = getEventAttribute(transfer, 'recipient')
 *   const amount = getEventAttribute(transfer, 'amount')
 *   console.log(`Transferred ${amount} to ${recipient}`)
 * }
 * ```
 */
export function getEventAttribute(event: CosmosEvent, key: string): string | undefined {
  const attr = event.attributes.find(a => a.key === key)
  return attr?.value
}

/**
 * Get an attribute value from events by event type and attribute key.
 *
 * Shorthand for `findEvent` + `getEventAttribute`.
 *
 * @param events - Array of events to search
 * @param type - Event type to find
 * @param key - Attribute key to extract
 * @returns Attribute value or undefined if event/attribute not found
 *
 * @example
 * ```typescript
 * import { getEventValue } from 'initia.js'
 *
 * const codeId = getEventValue(result.events, 'store_code', 'code_id')
 * const contractAddr = getEventValue(result.events, 'instantiate', '_contract_address')
 * ```
 */
export function getEventValue(
  events: CosmosEvent[],
  type: string,
  key: string
): string | undefined {
  const event = events.find(e => e.type === type)
  if (!event) return undefined
  return event.attributes.find(a => a.key === key)?.value
}

/**
 * Get all attributes from an event as a Record.
 *
 * @param event - Event to get attributes from
 * @returns Record of attribute key-value pairs
 *
 * @example
 * ```typescript
 * import { findEvent, getEventAttributes } from 'initia.js'
 *
 * const transfer = findEvent(events, 'transfer')
 * if (transfer) {
 *   const attrs = getEventAttributes(transfer)
 *   console.log(attrs)  // { sender: "init1...", recipient: "init1...", amount: "1000uinit" }
 * }
 * ```
 */
export function getEventAttributes(event: CosmosEvent): Record<string, string> {
  const result: Record<string, string> = {}
  for (const attr of event.attributes) {
    result[attr.key] = attr.value
  }
  return result
}

/**
 * Filter events by type and optionally by attribute values.
 *
 * @param events - Array of events to filter
 * @param type - Event type to match
 * @param attributes - Optional attribute key-value pairs to match
 * @returns Array of matching events
 *
 * @example
 * ```typescript
 * import { filterEvents } from 'initia.js'
 *
 * // Find all transfers to a specific recipient
 * const transfers = filterEvents(events, 'transfer', {
 *   recipient: 'init1...'
 * })
 * ```
 */
export function filterEvents(
  events: CosmosEvent[],
  type: string,
  attributes?: Record<string, string>
): CosmosEvent[] {
  return events.filter(e => {
    if (e.type !== type) return false
    if (!attributes) return true

    const eventAttrs = getEventAttributes(e)
    for (const [key, value] of Object.entries(attributes)) {
      if (eventAttrs[key] !== value) return false
    }
    return true
  })
}

// =============================================================================
// Wasm Event Functions
// =============================================================================

/**
 * Check if an event is a Wasm event.
 *
 * @param event - Event to check
 * @returns true if the event is a Wasm event
 */
export function isWasmEvent(event: CosmosEvent): boolean {
  return event.type === 'wasm' || event.type.startsWith('wasm-')
}

/**
 * Parse Wasm events from transaction events.
 *
 * Wasm events have type 'wasm' and include:
 * - `_contract_address`: The contract that emitted the event
 * - Other attributes are custom data from the contract
 *
 * @param events - Array of events to parse
 * @returns Array of parsed Wasm events
 *
 * @example
 * ```typescript
 * import { parseWasmEvents } from 'initia.js'
 *
 * const wasmEvents = parseWasmEvents(txResult.events)
 * for (const event of wasmEvents) {
 *   console.log(`Contract: ${event.contractAddress}`)
 *   console.log(`Action: ${event.action}`)
 *   console.log(`Data:`, event.data)
 * }
 * ```
 */
export function parseWasmEvents(events: CosmosEvent[]): ParsedWasmEvent[] {
  const wasmEvents = events.filter(isWasmEvent)
  const parsed: ParsedWasmEvent[] = []

  for (const event of wasmEvents) {
    const attrs = getEventAttributes(event)
    const contractAddress = attrs['_contract_address'] ?? ''
    const action = attrs['action'] ?? attrs['_action']

    // Extract non-system attributes (not starting with underscore)
    const data: Record<string, string> = {}
    for (const [key, value] of Object.entries(attrs)) {
      if (!key.startsWith('_')) {
        data[key] = value
      }
    }

    parsed.push({
      contractAddress,
      action,
      data,
      raw: event,
    })
  }

  return parsed
}

/**
 * Find Wasm events by contract address.
 *
 * @param events - Array of events to search
 * @param contractAddress - Contract address to filter by
 * @returns Array of parsed Wasm events from the specified contract
 *
 * @example
 * ```typescript
 * import { findWasmEventsByContract } from 'initia.js'
 *
 * const events = findWasmEventsByContract(txResult.events, 'init1...')
 * ```
 */
export function findWasmEventsByContract(
  events: CosmosEvent[],
  contractAddress: string
): ParsedWasmEvent[] {
  return parseWasmEvents(events).filter(
    e => e.contractAddress.toLowerCase() === contractAddress.toLowerCase()
  )
}

/**
 * Find Wasm events by action.
 *
 * @param events - Array of events to search
 * @param action - Action name to filter by
 * @returns Array of parsed Wasm events with the specified action
 *
 * @example
 * ```typescript
 * import { findWasmEventsByAction } from 'initia.js'
 *
 * const transfers = findWasmEventsByAction(txResult.events, 'transfer')
 * ```
 */
export function findWasmEventsByAction(events: CosmosEvent[], action: string): ParsedWasmEvent[] {
  return parseWasmEvents(events).filter(e => e.action === action)
}

// =============================================================================
// Move Event Functions
// =============================================================================

/**
 * Check if an event is a Move event.
 *
 * @param event - Event to check
 * @returns true if the event is a Move event
 */
export function isMoveEvent(event: CosmosEvent): boolean {
  return event.type === 'move'
}

/**
 * Parse Move events from transaction events.
 *
 * Move events have type 'move' and include:
 * - `type_tag`: Full type of the event (e.g., "0x1::coin::DepositEvent")
 * - `data`: Base64 encoded BCS data
 *
 * @param events - Array of events to parse
 * @returns Array of parsed Move events
 *
 * @example
 * ```typescript
 * import { parseMoveEvents } from 'initia.js'
 *
 * const moveEvents = parseMoveEvents(txResult.events)
 * for (const event of moveEvents) {
 *   console.log(`Type: ${event.eventType}`)
 *   console.log(`Module: ${event.moduleAddress}::${event.moduleName}`)
 *   console.log(`Data:`, event.data)
 * }
 * ```
 */
export function parseMoveEvents(events: CosmosEvent[]): ParsedMoveEvent[] {
  const moveEvents = events.filter(isMoveEvent)
  const parsed: ParsedMoveEvent[] = []

  for (const event of moveEvents) {
    const attrs = getEventAttributes(event)
    const typeTag = attrs['type_tag'] ?? ''

    // Parse type tag: "0x1::module_name::EventName"
    let moduleAddress: string | undefined
    let moduleName: string | undefined
    let eventType = typeTag

    const match = typeTag.match(/^(0x[a-fA-F0-9]+)::([^:]+)::(.+)$/)
    if (match) {
      moduleAddress = match[1]
      moduleName = match[2]
      eventType = typeTag
    }

    // Extract all attributes as data
    const data: Record<string, string> = { ...attrs }

    parsed.push({
      moduleAddress,
      moduleName,
      eventType,
      data,
      raw: event,
    })
  }

  return parsed
}

/**
 * Find Move events by module.
 *
 * @param events - Array of events to search
 * @param moduleAddress - Module address (e.g., "0x1")
 * @param moduleName - Optional module name to filter by
 * @returns Array of parsed Move events from the specified module
 *
 * @example
 * ```typescript
 * import { findMoveEventsByModule } from 'initia.js'
 *
 * // Find all events from 0x1::coin module
 * const coinEvents = findMoveEventsByModule(txResult.events, '0x1', 'coin')
 * ```
 */
export function findMoveEventsByModule(
  events: CosmosEvent[],
  moduleAddress: string,
  moduleName?: string
): ParsedMoveEvent[] {
  return parseMoveEvents(events).filter(e => {
    if (e.moduleAddress?.toLowerCase() !== moduleAddress.toLowerCase()) return false
    if (moduleName && e.moduleName !== moduleName) return false
    return true
  })
}

/**
 * Find Move events by event type.
 *
 * @param events - Array of events to search
 * @param eventType - Full event type (e.g., "0x1::coin::DepositEvent")
 * @returns Array of parsed Move events with the specified type
 *
 * @example
 * ```typescript
 * import { findMoveEventsByType } from 'initia.js'
 *
 * const deposits = findMoveEventsByType(
 *   txResult.events,
 *   '0x1::coin::DepositEvent'
 * )
 * ```
 */
export function findMoveEventsByType(events: CosmosEvent[], eventType: string): ParsedMoveEvent[] {
  return parseMoveEvents(events).filter(e => e.eventType === eventType)
}

// =============================================================================
// Typed Event Parsing
// =============================================================================

/**
 * Extract typed attributes from events matching a given type.
 *
 * Returns an array of objects with the specified keys extracted from each matching event.
 * Uses `const` generics so callers don't need `as const` on the keys array.
 *
 * @param events - Array of events to search
 * @param type - Event type to match
 * @param keys - Attribute keys to extract
 * @returns Array of typed attribute objects
 *
 * @example
 * ```typescript
 * import { parseEventAttrs } from 'initia.js/events'
 *
 * const transfers = parseEventAttrs(result.events, 'transfer', ['recipient', 'sender', 'amount'])
 * // → Array<{ recipient: string, sender: string, amount: string }>
 *
 * transfers[0].recipient // autocomplete works
 * ```
 */
export function parseEventAttrs<const K extends readonly string[]>(
  events: CosmosEvent[],
  type: string,
  keys: K
): Array<{ [P in K[number]]: string }> {
  return events
    .filter(e => e.type === type)
    .map(e => {
      const result = {} as { [P in K[number]]: string }
      for (const key of keys) {
        ;(result as Record<string, string>)[key] =
          e.attributes.find(a => a.key === key)?.value ?? ''
      }
      return result
    })
}

/**
 * Parse Move events by type tag, with automatic JSON data parsing.
 *
 * Filters Move events by type_tag and parses the `data` attribute from JSON string
 * into a typed object. Returns parsed data for each matching event.
 *
 * @param events - Array of events to search
 * @param typeTag - Full Move type tag (e.g., "0x1::coin::WithdrawEvent")
 * @returns Array of parsed data objects
 *
 * @example
 * ```typescript
 * import { parseMoveEventData } from 'initia.js/events'
 *
 * const withdraws = parseMoveEventData(result.events, '0x1::coin::WithdrawEvent')
 * // → Array<{ store_addr: string, metadata_addr: string, amount: string }>
 *
 * for (const w of withdraws) {
 *   console.log(`Withdrew ${w.amount} from ${w.store_addr}`)
 * }
 * ```
 */
export function parseMoveEventData(
  events: CosmosEvent[],
  typeTag: string
): Array<Record<string, unknown>> {
  return events
    .filter(
      e => e.type === 'move' && e.attributes.some(a => a.key === 'type_tag' && a.value === typeTag)
    )
    .map(e => {
      const data = e.attributes.find(a => a.key === 'data')?.value
      if (!data) return {}
      try {
        return JSON.parse(data) as Record<string, unknown>
      } catch {
        return { _raw: data }
      }
    })
}
