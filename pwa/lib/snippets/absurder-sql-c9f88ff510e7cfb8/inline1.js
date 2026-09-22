
export function absurd_sleep(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
