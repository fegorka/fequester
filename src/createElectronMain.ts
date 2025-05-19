import type { ModifierCollection, RequestDraft, ApiLibraryState, HttpMethod, RequestChainOperation, ApiRequestError } from '#types/types'

import { createRequestChain } from '#src/createRequestChain'
import { createDownloadChain } from '#src/createDownloadChain'

import { applyModifiers } from '#src/applyModifiers'
import { serializeError } from '#src/serializeError'

export function createElectronMain<ModifiersType extends ModifierCollection<RequestDraft>>(
  bridge: any,
  channel: string,
  axiosInstance: any,
  apiBaseURL: string,
  defaultHeaders?: Record<string, string>
) {
  return (
    modifiers: ModifiersType,
    errorHandlers?: Record<string | number, (error: ApiRequestError) => void>
  ) => {
    const state: ApiLibraryState<ModifiersType, 'main'> = {
      environment: 'main',
      bridge,
      channel,
      modifiers,
      axios: axiosInstance,
      baseURL: apiBaseURL,
      defaultHeaders,
      errorHandlers
    }

    bridge.handle(
      channel,
      async (
        _event: any,
        payload: {
          method: HttpMethod
          endpoint: string
          draft: RequestDraft
          ops: RequestChainOperation<ModifiersType>[]
          defaultHeaders?: Record<string, string>
          savePath?: string
          isDownload?: boolean
        }
      ) => {
        const finalDraft = applyModifiers(payload.draft || {}, payload.ops, modifiers)
        const headers = {
          ...(payload.defaultHeaders || {}),
          ...(finalDraft.headers || {})
        }

        const axiosConfig = {
          method: payload.method,
          url: payload.endpoint,
          baseURL: apiBaseURL,
          params: finalDraft.params,
          data: finalDraft.data,
          headers,
          responseType: payload.isDownload ? ('stream' as const) : ('json' as const)
        }

        console.log(axiosConfig) // for test

        if (payload.isDownload) {
          return axiosInstance
            .request(axiosConfig)
            .then((response: { data: NodeJS.ReadableStream }) => {
              const writer = require('fs').createWriteStream(payload.savePath!)
              response.data.pipe(writer)
              return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve({ data: undefined }))
                writer.on('error', (error: any) => reject({ type: 'error', error: serializeError(error, errorHandlers) }))
              })
            })
            .catch((error: any) => ({ type: 'error', error: serializeError(error, errorHandlers) }))
        }

        return axiosInstance
          .request(axiosConfig)
          .then((response: any) => ({ data: response.data }))
          .catch((error: any) => ({ type: 'error', error: serializeError(error, errorHandlers) }))
      }
    )

    const createMethod = (method: HttpMethod) => <ResponseType>(
      url: string,
      params?: Record<string, any>,
      data?: Record<string, any>,
      headers?: Record<string, string>
    ) =>
      createRequestChain<ResponseType, ModifiersType, 'main'>(
        state,
        method,
        url,
        { params, data, headers },
        []
      )

    return {
      get: <ResponseType>(url: string, params?: Record<string, any>, headers?: Record<string, string>) =>
        createRequestChain<ResponseType, ModifiersType, 'main'>(
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
        createDownloadChain<ModifiersType, 'main'>(state, url, savePath, { headers }, [])
    }
  }
}
