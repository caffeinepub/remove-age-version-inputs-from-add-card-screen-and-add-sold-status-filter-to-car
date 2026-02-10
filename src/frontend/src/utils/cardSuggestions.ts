import { Card } from '../backend';

/**
 * Extract unique, non-empty values from a specific field across all cards
 */
function extractUniqueValues(cards: Card[], field: keyof Card): string[] {
  const values = new Set<string>();
  
  cards.forEach(card => {
    const value = card[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      values.add(value.trim());
    }
  });
  
  return Array.from(values).sort();
}

/**
 * Filter suggestions based on current input (case-insensitive substring match)
 */
export function filterSuggestions(suggestions: string[], input: string): string[] {
  if (!input || input.trim().length === 0) {
    return suggestions;
  }
  
  const lowerInput = input.toLowerCase().trim();
  return suggestions.filter(suggestion => 
    suggestion.toLowerCase().includes(lowerInput)
  );
}

/**
 * Get country suggestions from existing cards
 */
export function getCountrySuggestions(cards: Card[]): string[] {
  return extractUniqueValues(cards, 'country');
}

/**
 * Get league suggestions from existing cards
 */
export function getLeagueSuggestions(cards: Card[]): string[] {
  return extractUniqueValues(cards, 'league');
}

/**
 * Get club suggestions from existing cards
 */
export function getClubSuggestions(cards: Card[]): string[] {
  return extractUniqueValues(cards, 'club');
}

/**
 * Get season suggestions from existing cards
 */
export function getSeasonSuggestions(cards: Card[]): string[] {
  return extractUniqueValues(cards, 'season');
}
