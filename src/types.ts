export type RequestDraft = {
  params?: Record<string, unknown>
  data?: Record<string, unknown>
  headers?: Record<string, string>
}

export type ApiResponse<ResponseType> = { data: ResponseType }
export type RequestModifier<DraftType, Args extends any[]> = (draft: DraftType, ...args: Args) => DraftType
export type ModifierCollection<DraftType> = Record<string, RequestModifier<DraftType, any[]>>
export type ModifierArguments<FunctionType> = FunctionType extends (draft: any, ...args: infer Arguments) => any ? Arguments : never

export type RequestChainOperation<ModifiersType> = {
  key: keyof ModifiersType
  args: any[]
}

export type RequestChain<ResponseType, ModifiersType extends ModifierCollection<RequestDraft>> = {
  then: Promise<ApiResponse<ResponseType>>['then']
  catch: Promise<ApiResponse<ResponseType>>['catch']
  finally: Promise<ApiResponse<ResponseType>>['finally']
} & {
  [Key in keyof ModifiersType]: (...args: ModifierArguments<ModifiersType[Key]>) => RequestChain<ResponseType, ModifiersType>
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

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

export type ApiRequestError = {
  status: number | null
  code: string | null
  response: any | null
}
