/**
 * Represents draft of API request, may include params, data & headers
 */
export type RequestDraft = {
  params?: Record<string, unknown>
  data?: Record<string, unknown>
  headers?: Record<string, string>
}

/**
 * Represents HTTP methods
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * Represents API response containing data of specified type
 */
export type ApiResponse<ResponseType> = { data: ResponseType }

/**
 * Defines a function that modifies request draft with provided arguments
 */
export type RequestModifier<DraftType, Args extends any[]> = (draft: DraftType, ...args: Args) => DraftType

/**
 * Collection of modifiers, where keys are modifier name & values are modifier functions
 */
export type ModifierCollection<DraftType> = Record<string, RequestModifier<DraftType, any[]>>

/**
 * Extracts argument types of modifier function
 */
export type ModifierArguments<FunctionType> = FunctionType extends (draft: any, ...args: infer Arguments) => any ? Arguments : never

/**
 * Defines operation within a request chain, specifying a modifier key and its arguments.
 */
export type RequestChainOperation<ModifiersType> = {
  key: keyof ModifiersType
  args: any[]
}

/**
 * Represents chainable request object that supports Promise methods & modifiers
 */
export type RequestChain<ResponseType, ModifiersType extends ModifierCollection<RequestDraft>> = {
  then: Promise<ApiResponse<ResponseType>>['then']
  catch: Promise<ApiResponse<ResponseType>>['catch']
  finally: Promise<ApiResponse<ResponseType>>['finally']
} & {
  [Key in keyof ModifiersType]: (...args: ModifierArguments<ModifiersType[Key]>) => RequestChain<ResponseType, ModifiersType>
}


/**
 * Represents fequester state, varying by environment
 */
export type ApiLibraryState<ModifiersType extends ModifierCollection<RequestDraft>, EnvironmentType> = {
  environment: EnvironmentType
  bridge?: any
  channel?: string
  modifiers?: ModifiersType
  axios?: any
  baseURL?: string
  defaultHeaders?: Record<string, string>
  errorHandlers?: Record<string | number, (error: ApiRequestError) => void>
}

/**
 * Represents structured error from API request
 */
export type ApiRequestError = {
  status: number | null
  code: string | null
  response: any | null
}
