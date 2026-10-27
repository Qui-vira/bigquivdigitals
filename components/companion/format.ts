/** Pure helpers shared by server and client code. No imports, safe in a client bundle. */
export function formatNairaMinor(minor: number): string {
  return `N${Math.floor(minor / 100).toLocaleString("en-US")}`;
}
