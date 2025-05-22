import type { ApiRequestError } from '#types/types'

// maybe look a little strange, but first: enveloping need because Electron log warning on Promise rejecting
// maybe look a little strange, but second: witout JSON.parse & JSON.stringify we get undefined (why??)

/**
 * Serializes an error into ApiRequestError format and applies error handlers if provided
 *
 * @param error - Raw error object to serialize
 * @param handlers - Optional error handlers keyed by status code or 'none'
 * @returns Structured ApiRequestError object with status, code & response details
 */
export function serializeError(error: any, handlers?: Record<string | number, (error: ApiRequestError) => void>): ApiRequestError {
  const serialized = JSON.parse(JSON.stringify(error))
  const structuredError: ApiRequestError = {
    status: serialized.status || null,
    code: serialized.code || null,
    response: serialized.response?.data || null
  }

  const handler = handlers?.[structuredError.status || 'none']
  if (handler) {
    handler(structuredError)
  }

  return structuredError
}
