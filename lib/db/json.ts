import type { Json } from './database.types'

export function toJson(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

export function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}
