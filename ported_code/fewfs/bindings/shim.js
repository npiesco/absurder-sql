/**
 * fewfs backend shim — single decision point for storage backend.
 *
 * Probes for OPFS SyncAccessHandle availability at boot.
 * Returns "hybrid" (preferred: OPFS blocks + IDB metadata),
 * or "idb" (fallback: in-memory only).
 *
 * OPFS can fail at runtime due to:
 * - Private browsing / incognito mode
 * - SecurityError (non-secure context, iframe sandboxing)
 * - Missing API (older browsers)
 * - Quota constraints
 *
 * This shim absorbs ALL of those — consuming code never branches on backend.
 */

/**
 * Probe for OPFS SyncAccessHandle support.
 *
 * @returns {Promise<"hybrid" | "idb">} The backend kind.
 */
export async function chooseBackend() {
  // Feature-detect navigator.storage.getDirectory
  if (
    typeof globalThis.navigator === "undefined" ||
    !globalThis.navigator.storage ||
    typeof globalThis.navigator.storage.getDirectory !== "function"
  ) {
    return "idb";
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle("fewfs_probe", { create: true });

    // Check SyncAccessHandle support
    if (typeof fh.createSyncAccessHandle !== "function") {
      return "idb";
    }

    // Probe: actually create and close a SyncAccessHandle
    const ah = await fh.createSyncAccessHandle();
    ah.close();

    return "hybrid";
  } catch (_) {
    // getDirectory() can throw SecurityError/UnknownError in private browsing,
    // createSyncAccessHandle can fail in non-Worker, quota exceeded, etc.
    return "idb";
  }
}
