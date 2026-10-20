/** Generic rotating quick-add examples — no domain-specific tutoring assumptions. */
export const QUICK_ADD_PLACEHOLDER_EXAMPLES = [
  'Call with Rivera Bakery Thu 2pm',
  'Dentist Tuesday 3pm',
  'Follow up with Dana Kim',
  'Invoice Acme Corp Friday',
  'Team sync next Mon 10am',
] as const

export function quickAddPlaceholderForIndex(index: number): string {
  const examples = QUICK_ADD_PLACEHOLDER_EXAMPLES
  const example = examples[index % examples.length] ?? examples[0]
  return `Try: ${example}`
}
