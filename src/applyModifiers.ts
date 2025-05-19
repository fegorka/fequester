import type { ModifierCollection, RequestDraft, RequestChainOperation } from '#types/types'

export function applyModifiers<ModifiersType extends ModifierCollection<RequestDraft>>(
  initialDraft: RequestDraft,
  operations: RequestChainOperation<ModifiersType>[],
  modifiers: ModifiersType
): RequestDraft {
  return operations.reduce(
    (accumulatedDraft, operation) =>
      modifiers[operation.key](accumulatedDraft, ...operation.args),
    initialDraft
  )
}
