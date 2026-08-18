import type { ReaderError, ReaderErrorCode } from '../types/reader'

/**
 * Every failure the UI is expected to render (PRD §35) travels as one of
 * these, so components branch on a code instead of matching error strings.
 */
export class AppError extends Error implements ReaderError {
  readonly code: ReaderErrorCode

  constructor(code: ReaderErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AppError'
    this.code = code
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/** Narrows an unknown catch value to something displayable. */
export function toAppError(error: unknown, fallbackCode: ReaderErrorCode, fallbackMessage: string): AppError {
  if (isAppError(error)) return error
  return new AppError(fallbackCode, fallbackMessage, { cause: error })
}
