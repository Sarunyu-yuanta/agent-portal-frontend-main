/**
 * English singular/plural for dictionary messages. Thai has no grammatical
 * plural, so Thai messages never need this.
 */
const RULES = new Intl.PluralRules("en");

export function plural(n: number, forms: { one: string; other: string }): string {
  return RULES.select(n) === "one" ? forms.one : forms.other;
}
