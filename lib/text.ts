/** User-facing copy: no hyphen, en dash, or em dash. */
export function displayText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/(\d)\s*[-–—]\s*(\d)/g, "$1 to $2")
    .replace(/[—–]/g, ",")
    .replace(/-/g, " ");
}
