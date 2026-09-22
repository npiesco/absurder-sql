const { default: init, Database } = await import(
  new URL(import.meta.url).searchParams.get('package') || '../../../pkg/absurder_sql.js'
);
const ready = init();

export async function runPhase({ backend }) {
  await ready;
  const db = await Database.newDatabaseWithBackend('export-portability.db', backend);
  await db.allowNonLeaderWrites(true);
  try {
    await db.execute('CREATE TABLE exported(id INTEGER PRIMARY KEY, payload TEXT)');
    await db.execute("INSERT INTO exported VALUES(41, 'early' || char(0) || 'tail')");
    const modeBefore = (await db.execute('PRAGMA journal_mode')).rows[0].values[0].value;
    await db.execute('BEGIN');
    await db.execute('SELECT * FROM exported');
    let activeReaderError = null;
    try {
      await db.exportToFile();
    } catch (error) {
      activeReaderError = String(error);
    }
    await db.execute('ROLLBACK');
    const bytes = Array.from(await db.exportToFile());
    const modeAfter = (await db.execute('PRAGMA journal_mode')).rows[0].values[0].value;
    await db.execute("INSERT INTO exported VALUES(42, 'still-writable')");
    const count = (await db.execute('SELECT COUNT(*) FROM exported')).rows[0].values[0].value;
    return { bytes, modeBefore, modeAfter, activeReaderError, count };
  } finally {
    await db.close();
    db.free();
  }
}
