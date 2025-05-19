import type { ApiRequestError } from '#types/types'

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
