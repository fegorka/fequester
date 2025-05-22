import type { ModifierCollection, RequestDraft, ApiLibraryState, HttpMethod } from '#types/types'

import { createRequestChain } from '#src/createRequestChain'
import { createDownloadChain } from '#src/createDownloadChain'

/**
 * Creates API client for use in Electron main process
 *
 * @param bridge - Electron IPC bridge for communication with main
 * @param channel - Electron IPC channel name
 * @param defaultHeaders - Optional default headers for all API requests
 * @returns fequester configured API Client
 */
export function createElectronRenderer<ModifiersType extends ModifierCollection<RequestDraft>>(
  bridge: any,
  channel: string,
  defaultHeaders?: Record<string, string>
) {
  const state: ApiLibraryState<ModifiersType, 'renderer'> = {
    environment: 'renderer',
    bridge,
    channel,
    defaultHeaders
  }

  const createMethod = (method: HttpMethod) => <ResponseType>(
    url: string,
    params?: Record<string, any>,
    data?: Record<string, any>,
    headers?: Record<string, string>
  ) =>
    createRequestChain<ResponseType, ModifiersType, 'renderer'>(
      state,
      method,
      url,
      { params, data, headers },
      []
    )

  return {
    get: <ResponseType>(url: string, params?: Record<string, any>, headers?: Record<string, string>) =>
      createRequestChain<ResponseType, ModifiersType, 'renderer'>(
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
      createDownloadChain<ModifiersType, 'renderer'>(state, url, savePath, { headers }, [])
  }
}
