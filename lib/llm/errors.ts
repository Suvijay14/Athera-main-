export class LlmExtractionError extends Error {
  readonly code: 'api' | 'parse' | 'validation'

  constructor(code: 'api' | 'parse' | 'validation', message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'LlmExtractionError'
    this.code = code
  }
}
