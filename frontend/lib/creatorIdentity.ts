const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * True when the display name is just the handle written differently
 * ("Jonathan Mark" vs "@jonathanmark"), so showing both would repeat the same name.
 */
export function nameRepeatsHandle(name: string | null | undefined, handle: string): boolean {
  const n = norm(name ?? "");
  return n === "" || n === norm(handle);
}

export function initialsOf(name: string | null | undefined, handle: string): string {
  const words = (name?.trim() || handle).split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}
