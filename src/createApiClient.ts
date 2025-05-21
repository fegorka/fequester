import type { HttpMethod, ModifierCollection, RequestDraft, ApiLibraryState, ApiRequestError } from '#types/types'

import { createRequestChain } from '#src/createRequestChain'
import { createDownloadChain } from '#src/createDownloadChain'

/**
 * Creates API client for use outside of Electron
 *
 * @param axiosInstance - Axios instance need for send HTTP requests
 * @param apiBaseURL - URL for all API requests (https://example.com/api)
 * @param defaultHeaders - Optional default headers for all API requests
 * @returns fequester configured API Client
 */
export function createApiClient<ModifiersType extends ModifierCollection<RequestDraft>>(
  axiosInstance: any,
  apiBaseURL: string,
  defaultHeaders?: Record<string, string>
) {
  return (
    modifiers: ModifiersType,
    errorHandlers?: Record<string | number, (error: ApiRequestError) => void>
  ) => {
    const state: ApiLibraryState<ModifiersType, 'direct'> = {
      environment: 'direct',
      modifiers,
      axios: axiosInstance,
      baseURL: apiBaseURL,
      defaultHeaders,
      errorHandlers
    }

    const createMethod = (method: HttpMethod) => <ResponseType>(
      url: string,
      params?: Record<string, any>,
      data?: Record<string, any>,
      headers?: Record<string, string>
    ) =>
      createRequestChain<ResponseType, ModifiersType, 'direct'>(
        state,
        method,
        url,
        { params, data, headers },
        []
      )

    return {
      get: <ResponseType>(url: string, params?: Record<string, any>, headers?: Record<string, string>) =>
        createRequestChain<ResponseType, ModifiersType, 'direct'>(
          state,
          'get',
          url,
          { params, headers },
          []
        ),
      post: createMethod('post'),
      put: createMethod('put'),
      patch: createMethod('patch'),
      delete: createMethod('delete'),
      download: (url: string, savePath: string, headers?: Record<string, string>) =>
        createDownloadChain<ModifiersType, 'direct'>(state, url, savePath, { headers }, [])
    }
  }
}
