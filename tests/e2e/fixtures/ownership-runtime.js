const { default: init, Database } = await import(
  new URL(import.meta.url).searchParams.get('package') || '../../../pkg/absurder_sql.js'
);
const ready = init();

export async function runPhase({ backend }) {
  await ready;
  const name = 'ownership.db';
  const first = await Database.newDatabaseWithBackend(name, backend);
  const second = await Database.newDatabaseWithBackend(name, backend);
  await first.allowNonLeaderWrites(true);
  await second.allowNonLeaderWrites(true);
  await first.execute('CREATE TABLE records (id INTEGER PRIMARY KEY, txt TEXT)');
  const worker = typeof document === 'undefined';
  const checks = [];
  for (let index = 0; index < 12; index++) {
    checks.push(await Promise.all([first.isLeader(), second.isLeader()]));
    if (!worker) {
      await Promise.all([first.requestLeadership(), second.requestLeadership()]);
    } else {
      const attempts = await Promise.allSettled([first.requestLeadership(), second.requestLeadership()]);
      if (!attempts.every(attempt => attempt.status === 'rejected' && String(attempt.reason).includes('Window'))) {
        throw new Error(`Worker leadership must explicitly report its unsupported Window coordination: ${JSON.stringify(attempts)}`);
      }
    }
    await first.executeWithParams('INSERT INTO records VALUES (?, ?)', [
      { type: 'Integer', value: index }, { type: 'Text', value: `record-${index}\0exact` },
    ]);
  }
  await Promise.all([first.isLeader(), second.close()]);
  const before = await first.execute('SELECT id,txt FROM records ORDER BY id');
  await first.sync();
  await first.close();
  first.free();
  second.free();
  const leaderKey = `datasync_leader_${name}`;
  const stoppedLeader = worker ? null : localStorage.getItem(leaderKey);
  // Allow actual queued heartbeat ticks and BroadcastChannel callbacks to run after shutdown.
  await new Promise(resolve => setTimeout(resolve, 1300));
  const laterLeader = worker ? null : localStorage.getItem(leaderKey);
  const reopened = await Database.newDatabaseWithBackend(name, backend);
  try {
    const after = await reopened.execute('SELECT id,txt FROM records ORDER BY id');
    return { checks, before: before.rows, after: after.rows, stoppedLeader, laterLeader };
  } finally {
    await reopened.close();
    reopened.free();
    await Database.deleteDatabase(name);
  }
}
