import type { ModifierCollection, RequestDraft, RequestChainOperation } from '#types/types'
/**
 * Applies modifiers sequence to requestDraft
 *
 * @param initialDraft - Starting requestDraft
 * @param operations - Operations array, each specifying a modifier key and its arguments
 * @param modifiers - Collection of modifier functions to apply
 * @returns Modified requestDraft after applying all sequence operations
 */
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
