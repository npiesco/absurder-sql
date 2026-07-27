/// <reference lib="webworker" />

interface ClientRequest {
  id?: number;
  kind: string;
  port?: MessagePort;
  error?: string;
  [key: string]: unknown;
}

interface RuntimeResponse {
  id?: number;
  kind: 'ready' | 'result' | 'error' | 'startupError' | 'change';
  value?: unknown;
  error?: string;
  name?: string;
}

interface PendingRequest {
  clientId: number;
  clientRequestId: number;
  client: DatabaseClient;
}

interface DatabaseClient {
  id: number;
  port: MessagePort;
  runtime: RuntimeCandidate | null;
  replacementAttempts: number;
}

interface RuntimeCandidate {
  owner: DatabaseClient;
  port: MessagePort;
}

const scope = self as unknown as SharedWorkerGlobalScope;
const clients = new Map<MessagePort, DatabaseClient>();
const runtimes: RuntimeCandidate[] = [];
const pending = new Map<number, PendingRequest>();
const queued: Array<{ client: DatabaseClient; request: ClientRequest }> = [];
let nextClientId = 1;
let nextRuntimeRequestId = 1;
let startupResponse: RuntimeResponse | null = null;
let leader: RuntimeCandidate | null = null;
const MAX_RUNTIME_REPLACEMENTS = 3;

scope.addEventListener('connect', (event: MessageEvent) => {
  const port = event.ports[0];
  if (!port) return;

  const client: DatabaseClient = {
    id: nextClientId++,
    port,
    runtime: null,
    replacementAttempts: 0,
  };
  clients.set(port, client);

  port.addEventListener('message', (message: MessageEvent<ClientRequest>) => {
    const request = message.data;
    if (request.kind === 'disconnect') {
      disconnect(client);
      return;
    }
    if (request.kind === 'registerRuntime') {
      registerRuntime(client, request.port);
      return;
    }
    if (request.kind === 'runtimeError') {
      runtimeFailed(client, request.error ?? 'Database runtime Worker failed');
      return;
    }
    if (typeof request.id !== 'number') {
      port.postMessage({
        kind: 'error',
        error: 'Shared database request is missing its numeric id',
      });
      return;
    }
    if (!leader || startupResponse?.kind !== 'ready') {
      queued.push({ client, request });
      return;
    }
    forward(client, request);
  });

  port.addEventListener('messageerror', () => {
    port.postMessage({
      kind: 'startupError',
      error: 'Shared database client sent an unreadable message',
    });
    disconnect(client);
  });
  port.start();
  if (startupResponse) port.postMessage(startupResponse);
});

function registerRuntime(client: DatabaseClient, port: MessagePort | undefined): void {
  if (!port) {
    client.port.postMessage({
      kind: 'startupError',
      error: 'Shared database runtime registration is missing its port',
    });
    return;
  }
  if (client.runtime) {
    client.port.postMessage({
      kind: 'startupError',
      error: 'Shared database client registered more than one runtime',
    });
    port.close();
    return;
  }

  const runtime: RuntimeCandidate = { owner: client, port };
  client.runtime = runtime;
  runtimes.push(runtime);
  port.addEventListener('message', (event: MessageEvent<RuntimeResponse>) => {
    handleRuntimeResponse(runtime, event.data);
  });
  port.addEventListener('messageerror', () => {
    runtimeFailed(client, 'Database runtime Worker returned an unreadable message');
  });
  port.start();
  if (!leader) activateNextRuntime();
}

function handleRuntimeResponse(runtime: RuntimeCandidate, response: RuntimeResponse): void {
  if (runtime !== leader) return;

  if (response.kind === 'ready') {
    runtime.owner.replacementAttempts = 0;
    startupResponse = response;
    broadcast(response);
    flushQueued();
    return;
  }
  if (response.kind === 'startupError') {
    const error = response.error ?? 'Database runtime Worker failed to initialize';
    const owner = runtime.owner;
    removeRuntime(runtime, error);
    requestRuntimeReplacement(owner, error);
    return;
  }
  if (response.kind === 'change') {
    broadcast(response);
    return;
  }
  if (response.id === undefined) return;

  const request = pending.get(response.id);
  if (!request) return;
  pending.delete(response.id);
  request.client.port.postMessage({
    ...response,
    id: request.clientRequestId,
  });
}

function forward(client: DatabaseClient, request: ClientRequest): void {
  if (!leader || typeof request.id !== 'number') return;

  const runtimeRequestId = nextRuntimeRequestId++;
  pending.set(runtimeRequestId, {
    clientId: client.id,
    clientRequestId: request.id,
    client,
  });
  leader.port.postMessage({
    ...request,
    id: runtimeRequestId,
    clientId: client.id,
  });
}

function flushQueued(): void {
  const requests = queued.splice(0);
  for (const request of requests) {
    if (clients.has(request.client.port)) forward(request.client, request.request);
  }
}

function disconnect(client: DatabaseClient): void {
  if (!clients.has(client.port)) return;

  if (leader && client.runtime !== leader) {
    leader.port.postMessage({
      kind: 'disconnectClient',
      clientId: client.id,
    });
  }

  const removedLeader = client.runtime === leader;
  clients.delete(client.port);
  client.port.close();

  for (const [id, request] of pending) {
    if (request.client === client) pending.delete(id);
  }
  for (let index = queued.length - 1; index >= 0; index -= 1) {
    if (queued[index].client === client) queued.splice(index, 1);
  }
  if (client.runtime) removeRuntime(client.runtime);

  if (clients.size === 0) {
    scope.close();
  } else if (removedLeader && !leader) {
    failCoordinator('Database runtime owner disconnected and no standby is available');
  }
}

function runtimeFailed(client: DatabaseClient, error: string): void {
  const runtime = client.runtime;
  if (!runtime) return;
  removeRuntime(runtime, error);
  requestRuntimeReplacement(client, error);
}

function removeRuntime(
  runtime: RuntimeCandidate,
  pendingError = 'Database runtime owner disconnected',
): void {
  runtime.port.close();
  runtime.owner.runtime = null;
  const index = runtimes.indexOf(runtime);
  if (index !== -1) runtimes.splice(index, 1);
  if (runtime !== leader) return;

  leader = null;
  startupResponse = null;
  rejectPending(pendingError);
  activateNextRuntime();
}

function activateNextRuntime(): void {
  const runtime = runtimes[0];
  if (!runtime) return;
  leader = runtime;
  runtime.port.postMessage({ kind: 'activate' });
}

function requestRuntimeReplacement(client: DatabaseClient, error: string): void {
  if (!clients.has(client.port)) {
    if (!leader) activateNextRuntime();
    return;
  }
  if (client.replacementAttempts >= MAX_RUNTIME_REPLACEMENTS) {
    if (!leader) failCoordinator(`${error}; runtime replacement limit reached`);
    return;
  }
  client.replacementAttempts += 1;
  client.port.postMessage({ kind: 'replaceRuntime' });
}

function failCoordinator(error: string): void {
  const response: RuntimeResponse = { kind: 'startupError', error };
  startupResponse = response;
  broadcast(response);
  rejectPending(error);
  for (const runtime of runtimes) runtime.port.close();
  scope.close();
}

function rejectPending(error: string): void {
  for (const request of pending.values()) {
    request.client.port.postMessage({
      id: request.clientRequestId,
      kind: 'error',
      error,
    });
  }
  pending.clear();
}

function broadcast(response: RuntimeResponse): void {
  for (const client of clients.values()) client.port.postMessage(response);
}

export {};
