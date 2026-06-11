export const HARDCODED_ADMINS = [
  "sarveshbm07@gmail.com",
  "siyavarghese29@gmail.com",
  "alwinkoshy06@gmail.com",
  "alf15bwy@gmail.com"
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return HARDCODED_ADMINS.includes(email.toLowerCase());
}
