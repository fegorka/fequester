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

export function createRequestChain<ResponseType, ModifiersType extends ModifierCollection<RequestDraft>, EnvironmentType>(
  state: ApiLibraryState<ModifiersType, EnvironmentType>,
  httpMethod: HttpMethod,
  endpoint: string,
  draft: RequestDraft = {},
  operations: RequestChainOperation<ModifiersType>[]
): RequestChain<ResponseType, ModifiersType> {
  const createPromise = () =>
    new Promise<ApiResponse<ResponseType>>((resolve, reject) => {
      if (state.environment === 'renderer') {
        state.bridge
          .invoke(state.channel, {
            method: httpMethod,
            endpoint,
            draft,
            ops: operations,
            defaultHeaders: state.defaultHeaders
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
        method: httpMethod,
        url: endpoint,
        baseURL: state.baseURL,
        params: finalDraft.params,
        data: finalDraft.data,
        headers
      }

      console.log(axiosConfig) // for test

      state.axios
        .request(axiosConfig)
        .then((response: { data: ResponseType }) => ({ data: response.data }))
        .catch((error: any) => reject(serializeError(error, state.errorHandlers)))
    })

  let memoizedPromise: Promise<ApiResponse<ResponseType>> | null = null

  return new Proxy({} as RequestChain<ResponseType, ModifiersType>, {
    get(_target, property: string | symbol) {
      if (property === 'then' || property === 'catch' || property === 'finally') {
        if (!memoizedPromise) {
          memoizedPromise = createPromise()
        }
        return (memoizedPromise as any)[property].bind(memoizedPromise)
      }

      return (...args: any[]) => {
        const nextOperations = [...operations, { key: property as keyof ModifiersType, args }]
        return createRequestChain<ResponseType, ModifiersType, EnvironmentType>(
          state,
          httpMethod,
          endpoint,
          draft,
          nextOperations
        )
      }
    }
  })
}
