/** Take up to 2 initials from a name: "Anita Devi Kumar" → "AD". */
export function getInitials(fullName: string | undefined | null): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
