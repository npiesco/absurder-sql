
const absurdHandles = new Map();
let absurdNextHandleId = 1;

function absurdGetRoot() {
  if (!globalThis.navigator || !globalThis.navigator.storage || typeof globalThis.navigator.storage.getDirectory !== 'function') {
    throw new Error('OPFS is not available in this context');
  }

  return globalThis.navigator.storage.getDirectory();
}

export async function absurd_opfs_open(fileName, create = true) {
  const root = await absurdGetRoot();
    const fileHandle = await root.getFileHandle(fileName, { create });
  const accessHandle = await fileHandle.createSyncAccessHandle();
  const id = absurdNextHandleId++;
  absurdHandles.set(id, accessHandle);
  return id;
}

export async function absurd_opfs_exists(fileName) {
    try {
        const root = await absurdGetRoot();
        await root.getFileHandle(fileName, { create: false });
        return true;
    } catch (error) {
        if (error && error.name === 'NotFoundError') {
            return false;
        }
        throw error;
    }
}

export function absurd_opfs_read(id, offset, len) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    throw new Error('OPFS handle not found: ' + id);
  }

  const buffer = new Uint8Array(len);
  handle.read(buffer, { at: offset });
  return buffer;
}

export function absurd_opfs_write(id, offset, data) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    throw new Error('OPFS handle not found: ' + id);
  }

  const written = handle.write(data, { at: offset });
  if (written !== data.byteLength) {
    throw new Error('Short OPFS write: ' + written + ' of ' + data.byteLength + ' bytes');
  }
}

export function absurd_opfs_flush(id) {
  const handle = absurdHandles.get(id);
  if (!handle) throw new Error('OPFS handle not found: ' + id);
  handle.flush();
}

export function absurd_opfs_size(id) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    throw new Error('OPFS handle not found: ' + id);
  }

  return handle.getSize();
}

export function absurd_opfs_truncate(id, size) {
    const handle = absurdHandles.get(id);
    if (!handle) {
        throw new Error('OPFS handle not found: ' + id);
    }

    handle.truncate(size);
}

export async function absurd_opfs_close(id) {
  const handle = absurdHandles.get(id);
  if (!handle) {
    return;
  }

  const result = handle.close();
  absurdHandles.delete(id);
  if (result && typeof result.then === 'function') {
    await result;
  }
}

export async function absurd_opfs_delete(fileName) {
  try {
    const root = await absurdGetRoot();
    await root.removeEntry(fileName);
  } catch (error) {
    if (!error || error.name !== 'NotFoundError') {
      throw error;
    }
  }
}

export function absurd_opfs_available() {
  return !!(globalThis.navigator &&
    globalThis.navigator.storage &&
    typeof globalThis.navigator.storage.getDirectory === 'function');
}
