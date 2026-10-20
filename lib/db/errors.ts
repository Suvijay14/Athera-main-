export type DbErrorCode =
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'forbidden'
  | 'unknown'

export class DbError extends Error {
  readonly code: DbErrorCode
  readonly cause?: unknown

  constructor(code: DbErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'DbError'
    this.code = code
    this.cause = cause
  }
}

export function wrapSupabaseError(message: string, cause: unknown): DbError {
  const code =
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    (cause as { code: string }).code === 'PGRST116'
      ? 'not_found'
      : 'unknown'
  return new DbError(code, message, cause)
}
