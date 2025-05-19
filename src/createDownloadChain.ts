import type {
  HttpMethod
  , ModifierCollection
  , RequestDraft
  , RequestChainOperation
  , ApiLibraryState
  , RequestChain
  , ApiResponse
} from '#types/types'

import { applyModifiers } from '#src/applyModifiers'
import { serializeError } from '#src/serializeError'

export function createDownloadChain<ModifiersType extends ModifierCollection<RequestDraft>, EnvironmentType>(
  state: ApiLibraryState<ModifiersType, EnvironmentType>,
  url: string,
  savePath: string,
  draft: RequestDraft = {},
  operations: RequestChainOperation<ModifiersType>[]
): RequestChain<void, ModifiersType> {
  const createPromise = () =>
    new Promise<ApiResponse<void>>((resolve, reject) => {
      if (state.environment === 'renderer') {
        state.bridge
          .invoke(state.channel, {
            method: 'get' as HttpMethod,
            endpoint: url,
            draft,
            ops: operations,
            savePath,
            defaultHeaders: state.defaultHeaders,
            isDownload: true
          })
          .then((result: any) => {
            if (result?.type === 'error') return reject(result.error)
            resolve(result)
          })
          .catch(reject)
        return
      }

      const finalDraft = applyModifiers(draft, operations, state.modifiers!)
      const headers = {
        ...(state.defaultHeaders || {}),
        ...(finalDraft.headers || {})
      }

      const axiosConfig = {
        method: 'get' as HttpMethod,
        url,
        baseURL: state.baseURL,
        params: finalDraft.params,
        headers,
        responseType: 'stream' as const
      }

      console.log(axiosConfig) // for test

      state.axios
        .request(axiosConfig)
        .then((response: { data: NodeJS.ReadableStream }) => {
          const writer = require('fs').createWriteStream(savePath)
          response.data.pipe(writer)
          writer.on('finish', () => resolve({ data: undefined }))
          writer.on('error', (error: any) => reject(serializeError(error, state.errorHandlers)))
        })
        .catch((error: any) => reject(serializeError(error, state.errorHandlers)))
    })

  let memoizedPromise: Promise<ApiResponse<void>> | null = null

  return new Proxy({} as RequestChain<void, ModifiersType>, {
    get(_target, property: string | symbol) {
      if (property === 'then' || property === 'catch' || property === 'finally') {
        if (!memoizedPromise) {
          memoizedPromise = createPromise()
        }
        return (memoizedPromise as any)[property].bind(memoizedPromise)
      }

      return (...args: any[]) => {
        const nextOperations = [...operations, { key: property as keyof ModifiersType, args }]
        return createDownloadChain<ModifiersType, EnvironmentType>(
          state,
          url,
          savePath,
          draft,
          nextOperations
        )
      }
    }
  })
}
