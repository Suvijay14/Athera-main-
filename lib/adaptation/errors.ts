import type { Operation } from './types'

export class ValidationError extends Error {
  readonly name = 'ValidationError'

  constructor(message: string) {
    super(message)
  }
}

export class OperationError extends Error {
  readonly name = 'OperationError'
  readonly operation: Operation
  readonly reason: string

  constructor(operation: Operation, reason: string, cause?: unknown) {
    super(reason)
    this.operation = operation
    this.reason = reason
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export class SuggestionStateError extends Error {
  readonly name = 'SuggestionStateError'

  constructor(message: string) {
    super(message)
  }
}

export function wrapPgError(operation: Operation, err: unknown): OperationError {
  const message =
    err instanceof Error ? err.message : 'Database operation failed'
  const sanitized = message.replace(/\s+/g, ' ').slice(0, 500)
  return new OperationError(operation, sanitized, err)
}
