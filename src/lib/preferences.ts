export type UserPreferences = {
  theme?: "light" | "dark";
  emailNotifications?: boolean;
};

export function parsePreferences(raw: string): UserPreferences {
  try {
    return JSON.parse(raw || "{}") as UserPreferences;
  } catch {
    return {};
  }
}

export function mergePreferences(
  current: string,
  patch: UserPreferences
): string {
  const base = parsePreferences(current);
  return JSON.stringify({ ...base, ...patch });
}
