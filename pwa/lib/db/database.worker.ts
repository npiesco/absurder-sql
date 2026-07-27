/// <reference lib="webworker" />

import init, { Database as WasmDatabase } from '../absurder_sql.js';

type BackendName = 'auto' | 'indexeddb' | 'opfs' | 'hybrid';
type DatabaseInstance = WasmDatabase;

interface WorkerRequest {
  id?: number;
  clientId?: number;
  kind: 'open' | 'call' | 'static' | 'close' | 'disconnectClient';
  name?: string;
  backend?: BackendName;
  handleId?: number;
  method?: string;
  args?: unknown[];
}

interface RuntimeConnection {
  kind: 'connect';
  port: MessagePort;
}

interface DatabaseRecord {
  db: DatabaseInstance;
  handles: Set<string>;
  queue: Promise<void>;
  closing: Promise<void> | null;
}

interface HandleRecord {
  name: string;
  clientId: number;
}

const scope = self as unknown as DedicatedWorkerGlobalScope;
const handles = new Map<string, HandleRecord>();
const databases = new Map<string, DatabaseRecord>();
const openings = new Map<string, Promise<DatabaseRecord>>();
let coordinatorPort: MessagePort | null = null;
let initializationStarted = false;

scope.addEventListener('message', (event: MessageEvent<RuntimeConnection>) => {
  if (event.data.kind !== 'connect' || coordinatorPort) return;

  coordinatorPort = event.data.port;
  coordinatorPort.addEventListener(
    'message',
    (message: MessageEvent<WorkerRequest | { kind: 'activate' }>) => {
      if (message.data.kind === 'activate') {
        startRuntime();
        return;
      }
      void handleRequest(message.data);
    },
  );
  coordinatorPort.addEventListener('messageerror', () => {
    postRuntime({
      kind: 'startupError',
      error: 'Unreadable database coordinator request',
    });
  });
  coordinatorPort.start();
});

function startRuntime(): void {
  if (initializationStarted) return;
  initializationStarted = true;
  void init().then(
    () => postRuntime({ kind: 'ready' }),
    (error) => {
      postRuntime({
        kind: 'startupError',
        error: errorMessage(error),
      });
    },
  );
}

async function handleRequest(request: WorkerRequest): Promise<void> {
  try {
    if (request.kind === 'disconnectClient') {
      await disconnectClient(requireNumber(request.clientId, 'client id'));
      return;
    }

    const id = requireNumber(request.id, 'request id');
    const clientId = requireNumber(request.clientId, 'client id');
    let value: unknown;

    switch (request.kind) {
      case 'open':
        value = await openHandle(
          clientId,
          requireNumber(request.handleId, 'database handle'),
          requireString(request.name, 'database name'),
          request.backend ?? 'auto',
        );
        break;
      case 'call':
        value = await callDatabase(
          clientId,
          requireNumber(request.handleId, 'database handle'),
          requireString(request.name, 'database name'),
          request.backend ?? 'auto',
          requireString(request.method, 'database method'),
          request.args ?? [],
        );
        break;
      case 'static':
        value = await callStatic(
          requireString(request.method, 'static database method'),
          request.args ?? [],
        );
        break;
      case 'close':
        await releaseHandle(clientId, requireNumber(request.handleId, 'database handle'));
        value = undefined;
        break;
      default:
        throw new Error(`Unsupported database worker request: ${String(request.kind)}`);
    }

    postRuntime({ id, kind: 'result', value });
  } catch (error) {
    postRuntime({
      id: request.id,
      kind: 'error',
      error: errorMessage(error),
    });
  }
}

async function openHandle(
  clientId: number,
  handleId: number,
  name: string,
  backend: BackendName,
): Promise<{ backend: string }> {
  const key = handleKey(clientId, handleId);
  const existing = handles.get(key);
  if (existing) {
    const record = databases.get(existing.name);
    if (record) return { backend: record.db.getStorageBackend() };
    handles.delete(key);
  }

  const record = await openDatabase(name, backend);
  record.handles.add(key);
  handles.set(key, { name, clientId });
  return { backend: record.db.getStorageBackend() };
}

async function openDatabase(name: string, backend: BackendName): Promise<DatabaseRecord> {
  const existing = databases.get(name);
  if (existing) {
    if (existing.closing) {
      await existing.closing;
      return openDatabase(name, backend);
    }
    return existing;
  }

  const pending = openings.get(name);
  if (pending) return pending;

  const opening = (async () => {
    const db = backend === 'auto'
      ? await WasmDatabase.newDatabaseAuto(name)
      : await WasmDatabase.newDatabaseWithBackend(name, backend);

    // The SharedWorker coordinator elects exactly one physical runtime.
    await db.allowNonLeaderWrites(true);
    db.onDataChange(() => postRuntime({ kind: 'change', name }));

    const record: DatabaseRecord = {
      db,
      handles: new Set(),
      queue: Promise.resolve(),
      closing: null,
    };
    databases.set(name, record);
    return record;
  })();

  openings.set(name, opening);
  try {
    return await opening;
  } finally {
    openings.delete(name);
  }
}

async function ensureHandle(
  clientId: number,
  handleId: number,
  name: string,
  backend: BackendName,
): Promise<HandleRecord> {
  const key = handleKey(clientId, handleId);
  let handle = handles.get(key);
  if (!handle) {
    await openHandle(clientId, handleId, name, backend);
    handle = handles.get(key);
  }
  if (!handle) throw new Error(`Unknown database handle: ${handleId}`);
  return handle;
}

async function callDatabase(
  clientId: number,
  handleId: number,
  name: string,
  backend: BackendName,
  method: string,
  args: unknown[],
): Promise<unknown> {
  const handle = await ensureHandle(clientId, handleId, name, backend);
  const record = databases.get(handle.name);
  if (!record || record.closing) {
    throw new Error(`Database is closing: ${handle.name}`);
  }

  return enqueue(record, async () => {
    const candidate = (record.db as unknown as Record<string, unknown>)[method];
    if (typeof candidate !== 'function') {
      throw new Error(`Unsupported database method: ${method}`);
    }
    return await (candidate as (...methodArgs: unknown[]) => unknown).apply(record.db, args);
  });
}

async function callStatic(method: string, args: unknown[]): Promise<unknown> {
  if (method === 'deleteDatabase') {
    await closeDatabase(requireString(args[0], 'database name'));
  }

  const candidate = (WasmDatabase as unknown as Record<string, unknown>)[method];
  if (typeof candidate !== 'function') {
    throw new Error(`Unsupported static database method: ${method}`);
  }
  return await (candidate as (...methodArgs: unknown[]) => unknown).apply(WasmDatabase, args);
}

function enqueue<T>(record: DatabaseRecord, operation: () => Promise<T>): Promise<T> {
  const result = record.queue.then(operation, operation);
  record.queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function releaseHandle(clientId: number, handleId: number): Promise<void> {
  const key = handleKey(clientId, handleId);
  const handle = handles.get(key);
  if (!handle) return;

  handles.delete(key);
  const record = databases.get(handle.name);
  if (!record) return;

  record.handles.delete(key);
  if (record.handles.size === 0) {
    await closeRecord(handle.name, record);
  }
}

async function disconnectClient(clientId: number): Promise<void> {
  const owned = [...handles.entries()]
    .filter(([, handle]) => handle.clientId === clientId)
    .map(([key]) => key);
  for (const key of owned) {
    const handleId = Number(key.slice(key.indexOf(':') + 1));
    await releaseHandle(clientId, handleId);
  }
}

async function closeDatabase(name: string): Promise<void> {
  const record = databases.get(name);
  if (!record) return;

  for (const key of record.handles) handles.delete(key);
  record.handles.clear();
  await closeRecord(name, record);
}

async function closeRecord(name: string, record: DatabaseRecord): Promise<void> {
  if (record.closing) return record.closing;

  record.closing = enqueue(record, async () => {
    await record.db.sync();
    await record.db.close();
  });

  try {
    await record.closing;
  } finally {
    if (databases.get(name) === record) databases.delete(name);
  }
}

function postRuntime(message: unknown): void {
  if (!coordinatorPort) throw new Error('Database runtime coordinator is unavailable');
  coordinatorPort.postMessage(message);
}

function handleKey(clientId: number, handleId: number): string {
  return `${clientId}:${handleId}`;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export {};
