export const MINIMUM_AGE = 13;

/** Parses a YYYY-MM-DD string, returning null for anything that isn't a real date. */
export function parseBirthdate(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function ageOn(birthdate: Date, today = new Date()): number {
  let age = today.getUTCFullYear() - birthdate.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birthdate.getUTCMonth() ||
    (today.getUTCMonth() === birthdate.getUTCMonth() && today.getUTCDate() < birthdate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function isOldEnough(birthdate: Date, today = new Date()): boolean {
  return ageOn(birthdate, today) >= MINIMUM_AGE;
}
