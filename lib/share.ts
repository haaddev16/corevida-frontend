export function planSharePath(planId: string) {
  return `/plan/${encodeURIComponent(planId)}`;
}

export function planShareUrl(planId: string) {
  const path = planSharePath(planId);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  document.body.removeChild(field);
}
