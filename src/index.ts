import type { HttpMethod, RequestDraft, ApiResponse, ApiRequestError } from '#types/types'

import { createElectronRenderer } from '#src/createElectronRenderer'
import { createElectronMain } from '#src/createElectronMain'
import { createApiClient } from '#src/createApiClient'


export type {
    HttpMethod as HttpMethodFequester
    , RequestDraft as RequestDraftFequester
    , ApiResponse as ApiResponseFequester
    , ApiRequestError as ApiRequestErrorFequester }

export {
    createElectronMain as createElectronMainFequester
    , createElectronRenderer as createElectronRendererFequester
    , createApiClient as createFequester
}
