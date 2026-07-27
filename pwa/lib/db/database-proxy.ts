'use client';

import type {
  ColumnValue,
  DatabaseConfig,
  DatabaseError,
  IsolationLevel,
  QueryResult,
  Row,
  TransactionOptions,
} from '../absurder_sql.js';

export type {
  ColumnValue,
  DatabaseConfig,
  DatabaseError,
  IsolationLevel,
  QueryResult,
  Row,
  TransactionOptions,
};

export type BackendName = 'auto' | 'indexeddb' | 'opfs' | 'hybrid';

interface WorkerResponse {
  id?: number;
  kind: 'ready' | 'result' | 'error' | 'startupError' | 'change' | 'replaceRuntime';
  value?: unknown;
  error?: string;
  name?: string;
}

interface OpenResult {
  backend: string;
}

interface PendingRequest {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

type ChangeCallback = () => void;

interface ChangeSubscription {
  name: string;
  callbacks: Set<ChangeCallback>;
}

class DatabaseWorkerClient {
  private readonly worker: SharedWorker;
  private readonly port: MessagePort;
  private runtimeWorker: Worker | null = null;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly changeCallbacks = new Map<number, ChangeSubscription>();
  private nextRequestId = 1;
  private nextHandleId = 1;
  private disconnected = false;
  readonly ready: Promise<void>;

  constructor() {
    if (!('SharedWorker' in window)) {
      throw new Error('This browser does not support the shared AbsurderSQL runtime');
    }

    this.worker = new SharedWorker(new URL('./database.shared-worker.ts', import.meta.url), {
      type: 'module',
      name: 'absurder-sql-database-owner',
    });
    this.port = this.worker.port;
    this.ready = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error('AbsurderSQL SharedWorker initialization timed out')),
        120_000,
      );

      this.port.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        if (response.kind === 'replaceRuntime') {
          this.registerRuntimeCandidate();
          return;
        }
        if (response.kind === 'ready') {
          window.clearTimeout(timeout);
          resolve();
          window.dispatchEvent(new Event('absurder-sql-runtime-ready'));
          return;
        }
        if (response.kind === 'startupError') {
          window.clearTimeout(timeout);
          reject(new Error(response.error ?? 'AbsurderSQL SharedWorker failed to start'));
          return;
        }
        if (response.kind === 'change') {
          this.notifyChange(response.name);
          return;
        }
        if (response.id === undefined) return;

        const request = this.pending.get(response.id);
        if (!request) return;
        this.pending.delete(response.id);
        if (response.kind === 'error') {
          request.reject(new Error(response.error ?? 'AbsurderSQL worker request failed'));
        } else {
          request.resolve(response.value);
        }
      });
      this.port.addEventListener('messageerror', () => {
        reject(new Error('AbsurderSQL SharedWorker returned an unreadable response'));
      });
      this.worker.addEventListener('error', (event) => {
        event.preventDefault();
        reject(new Error(event.message || 'AbsurderSQL SharedWorker failed'));
      });
      this.port.start();
      this.registerRuntimeCandidate();
    });

    window.addEventListener('pagehide', () => this.disconnect(), { once: true });
  }

  async request<T>(request: Record<string, unknown>): Promise<T> {
    await this.ready;
    if (this.disconnected) throw new Error('AbsurderSQL SharedWorker is disconnected');

    const id = this.nextRequestId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      try {
        this.port.postMessage({ ...request, id });
      } catch (error) {
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  allocateHandleId(): number {
    return this.nextHandleId++;
  }

  subscribe(handleId: number, name: string, callback: ChangeCallback): void {
    const subscription = this.changeCallbacks.get(handleId) ?? {
      name,
      callbacks: new Set<ChangeCallback>(),
    };
    subscription.callbacks.add(callback);
    this.changeCallbacks.set(handleId, subscription);
  }

  release(handleId: number): void {
    this.changeCallbacks.delete(handleId);
  }

  private notifyChange(name: string | undefined): void {
    for (const subscription of this.changeCallbacks.values()) {
      if (name !== undefined && subscription.name !== name) continue;
      for (const callback of subscription.callbacks) callback();
    }
  }

  private registerRuntimeCandidate(): void {
    this.runtimeWorker?.terminate();
    const candidate = new Worker(new URL('./database.worker.ts', import.meta.url), {
      type: 'module',
      name: 'absurder-sql-database-runtime',
    });
    const channel = new MessageChannel();
    let failureReported = false;
    this.runtimeWorker = candidate;

    const reportFailure = (error: string) => {
      if (failureReported) return;
      failureReported = true;
      candidate.terminate();
      this.port.postMessage({ kind: 'runtimeError', error });
    };

    candidate.addEventListener('error', (event) => {
      event.preventDefault();
      reportFailure(event.message || 'AbsurderSQL runtime Worker failed');
    });
    candidate.addEventListener('messageerror', () => {
      reportFailure('AbsurderSQL runtime Worker returned an unreadable message');
    });
    candidate.postMessage(
      { kind: 'connect', port: channel.port1 },
      [channel.port1],
    );
    this.port.postMessage(
      { kind: 'registerRuntime', port: channel.port2 },
      [channel.port2],
    );
  }

  private disconnect(): void {
    if (this.disconnected) return;
    this.disconnected = true;
    try {
      this.port.postMessage({ id: this.nextRequestId++, kind: 'disconnect' });
    } finally {
      this.port.close();
      const error = new Error('AbsurderSQL page disconnected');
      for (const request of this.pending.values()) request.reject(error);
      this.pending.clear();
      this.changeCallbacks.clear();
    }
  }
}

let workerClient: DatabaseWorkerClient | null = null;

function getWorkerClient(): DatabaseWorkerClient {
  if (typeof window === 'undefined') {
    throw new Error('The AbsurderSQL database runtime is only available in the browser');
  }
  workerClient ??= new DatabaseWorkerClient();
  return workerClient;
}

export default async function initializeDatabaseRuntime(): Promise<void> {
  await getWorkerClient().ready;
}

export class Database {
  readonly name: string;
  private readonly handleId: number;
  private readonly requestedBackend: BackendName;
  private readonly backend: string;
  private readonly client: DatabaseWorkerClient;
  private closed = false;

  private constructor(
    client: DatabaseWorkerClient,
    name: string,
    handleId: number,
    requestedBackend: BackendName,
    opened: OpenResult,
  ) {
    this.client = client;
    this.name = name;
    this.handleId = handleId;
    this.requestedBackend = requestedBackend;
    this.backend = opened.backend;
  }

  static newDatabase(name: string): Promise<Database> {
    return this.open(name, 'auto');
  }

  static newDatabaseAuto(name: string): Promise<Database> {
    return this.open(name, 'auto');
  }

  static newDatabaseWithBackend(name: string, backend: BackendName): Promise<Database> {
    return this.open(name, backend);
  }

  static async getAllDatabases(): Promise<string[]> {
    return getWorkerClient().request<string[]>({
      kind: 'static',
      method: 'getAllDatabases',
      args: [],
    });
  }

  static async deleteDatabase(name: string): Promise<void> {
    await getWorkerClient().request<void>({
      kind: 'static',
      method: 'deleteDatabase',
      args: [name],
    });
  }

  private static async open(name: string, backend: BackendName): Promise<Database> {
    const client = getWorkerClient();
    const handleId = client.allocateHandleId();
    const opened = await client.request<OpenResult>({
      kind: 'open',
      name,
      backend,
      handleId,
    });
    return new Database(client, name, handleId, backend, opened);
  }

  private call<T>(method: string, args: unknown[] = []): Promise<T> {
    if (this.closed) return Promise.reject(new Error(`Database is closed: ${this.name}`));
    return this.client.request<T>({
      kind: 'call',
      handleId: this.handleId,
      name: this.name,
      backend: this.requestedBackend,
      method,
      args,
    });
  }

  getStorageBackend(): string {
    return this.backend;
  }

  execute(sql: string): Promise<QueryResult> {
    return this.call('execute', [sql]);
  }

  executeWithParams(sql: string, params: unknown): Promise<QueryResult> {
    return this.call('executeWithParams', [sql, params]);
  }

  exportToFile(): Promise<Uint8Array> {
    return this.call('exportToFile');
  }

  importFromFile(fileData: Uint8Array): Promise<void> {
    return this.call('importFromFile', [fileData]);
  }

  sync(): Promise<void> {
    return this.call('sync');
  }

  allowNonLeaderWrites(allow: boolean): Promise<void> {
    return this.call('allowNonLeaderWrites', [allow]);
  }

  clearOptimisticWrites(): Promise<void> {
    return this.call('clearOptimisticWrites');
  }

  enableCoordinationMetrics(enabled: boolean): Promise<void> {
    return this.call('enableCoordinationMetrics', [enabled]);
  }

  enableOptimisticUpdates(enabled: boolean): Promise<void> {
    return this.call('enableOptimisticUpdates', [enabled]);
  }

  forceCloseConnection(): Promise<void> {
    return this.call('forceCloseConnection');
  }

  getCoordinationMetrics(): Promise<string> {
    return this.call('getCoordinationMetrics');
  }

  getLeaderInfo(): Promise<unknown> {
    return this.call('getLeaderInfo');
  }

  getPendingWritesCount(): Promise<number> {
    return this.call('getPendingWritesCount');
  }

  isCoordinationMetricsEnabled(): Promise<boolean> {
    return this.call('isCoordinationMetricsEnabled');
  }

  isLeader(): Promise<boolean> {
    return this.call('isLeader');
  }

  isOptimisticMode(): Promise<boolean> {
    return this.call('isOptimisticMode');
  }

  is_leader(): Promise<boolean> {
    return this.call('is_leader');
  }

  queueWrite(sql: string): Promise<void> {
    return this.call('queueWrite', [sql]);
  }

  queueWriteWithTimeout(sql: string, timeoutMs: number): Promise<void> {
    return this.call('queueWriteWithTimeout', [sql, timeoutMs]);
  }

  recordFollowerRefresh(): Promise<void> {
    return this.call('recordFollowerRefresh');
  }

  recordLeadershipChange(becameLeader: boolean): Promise<void> {
    return this.call('recordLeadershipChange', [becameLeader]);
  }

  recordNotificationLatency(latencyMs: number): Promise<void> {
    return this.call('recordNotificationLatency', [latencyMs]);
  }

  recordWriteConflict(): Promise<void> {
    return this.call('recordWriteConflict');
  }

  reloadFromIndexedDB(): Promise<void> {
    return this.call('reloadFromIndexedDB');
  }

  requestLeadership(): Promise<void> {
    return this.call('requestLeadership');
  }

  resetCoordinationMetrics(): Promise<void> {
    return this.call('resetCoordinationMetrics');
  }

  testLock(value: number): Promise<number> {
    return this.call('testLock', [value]);
  }

  trackOptimisticWrite(sql: string): Promise<string> {
    return this.call('trackOptimisticWrite', [sql]);
  }

  waitForLeadership(): Promise<void> {
    return this.call('waitForLeadership');
  }

  onDataChange(callback: ChangeCallback): void {
    this.client.subscribe(this.handleId, this.name, callback);
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.client.release(this.handleId);
    await this.client.request<void>({ kind: 'close', handleId: this.handleId });
  }

  free(): void {
    void this.close();
  }

  [Symbol.dispose](): void {
    this.free();
  }
}
