/**
 * Engineering-authored lexical expansion for Tier A retrieval (Rule 1.5:
 * deterministic only). Conservative by design: morphological variants and
 * uncontroversial synonyms of ENGLISH search terms — never interpretive
 * mappings. Expansion widens FTS recall; it asserts nothing.
 */
export const SYNONYMS: Record<string, string[]> = {
  bribery: ['bribe'],
  bribe: ['bribery'],
  charity: ['alms', 'almsgiving'],
  alms: ['charity', 'almsgiving'],
  patience: ['patient', 'patiently', 'steadfast'],
  patient: ['patience', 'patiently'],
  forgiveness: ['forgive', 'forgiving', 'forgiveth', 'pardon'],
  forgive: ['forgiveness', 'forgiving', 'forgiveth', 'pardon'],
  mercy: ['merciful'],
  merciful: ['mercy'],
  justice: ['just', 'justly'],
  fasting: ['fast', 'fasted'],
  usury: ['usurer'],
  interest: ['usury'],
  orphans: ['orphan'],
  orphan: ['orphans'],
  parents: ['parent'],
  truth: ['truthful'],
  lying: ['lie', 'liar', 'liars', 'falsehood'],
  lie: ['lying', 'liar', 'liars', 'falsehood'],
  prayer: ['pray', 'prayers', 'worship'],
  pray: ['prayer', 'prayers'],
  gratitude: ['grateful', 'thankful', 'thanks'],
  grateful: ['gratitude', 'thankful'],
  knowledge: ['know', 'knowing', 'learned'],
  wealth: ['riches', 'property'],
  poverty: ['poor', 'needy'],
  poor: ['needy', 'poverty'],
  paradise: ['garden', 'gardens'],
  hellfire: ['fire', 'hell'],
  angels: ['angel'],
  prophets: ['prophet', 'messenger', 'messengers'],
  believers: ['believer', 'believe', 'faithful'],
  disbelievers: ['disbeliever', 'disbelieve', 'unbelievers', 'unbeliever'],
};

/** A term plus its expansions, deduplicated, original first. */
export function expandTerm(term: string): string[] {
  const key = term.toLowerCase().trim();
  return [...new Set([key, ...(SYNONYMS[key] ?? [])])];
}
