const FORBIDDEN_IN_SHEET_NAME = /[[\]:*?/\\]/g;
const PREFIXES = /(м\.|смт\.|вул\.|просп\.|буд\.)/gi;
const MAX_SHEET_NAME = 31;

/** 'м. Чортків' + 'вул. Незалежності, 133, 1/4' > 'Чор_Нез_133_1_4' */
export function buildSheetName(city: string, address: string): string {
  return [city, address]
    .join(' ')
    .replace(PREFIXES, ' ')
    .replace(FORBIDDEN_IN_SHEET_NAME, '_')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part) => (/^\d/.test(part) ? part : part.slice(0, 3)))
    .join('_')
    .slice(0, MAX_SHEET_NAME);
}
