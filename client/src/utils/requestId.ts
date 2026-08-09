export function shortRequestId(id: string): string {
  return `NS-${id.slice(-6).toUpperCase()}`;
}
