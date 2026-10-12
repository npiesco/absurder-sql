const { default: init, Database } = await import(
  new URL(import.meta.url).searchParams.get('package') || '../../../pkg/absurder_sql.js'
);
const ready = init();

function plain(result) {
  return {
    columns: result.columns,
    rows: result.rows.map(row => row.values.map(value => ({
      ...value, ...(value.type === 'Blob' ? { value: Array.from(value.value) } : {}),
    }))),
    affectedRows: result.affectedRows,
    lastInsertId: result.lastInsertId ?? null,
  };
}

export async function runPhase({ backend, phase, parameterized, text, blob }) {
  await ready;
  console.log(`FIDELITY opening ${backend}/${phase}`);
  const db = await Database.newDatabaseWithBackend('sqlite-fidelity.db', backend);
  await db.allowNonLeaderWrites(true);
  const results = {};
  try {
    const execute = async (sql, params = []) => parameterized
      ? db.executeWithParams(sql, params) : db.execute(sql);
    if (phase === 'seed') {
      results.create = plain(await db.execute('CREATE TABLE records (id INTEGER PRIMARY KEY, txt TEXT, payload BLOB, measure REAL, absent)'));
      results.insert = plain(await db.executeWithParams(
        'INSERT INTO records VALUES (?, ?, ?, ?, ?)',
        [{ type: 'Integer', value: 41 }, { type: 'Text', value: text },
          { type: 'Blob', value: blob }, { type: 'Real', value: 1.25 }, { type: 'Null' }],
      ));
      results.emptyInsert = plain(await db.executeWithParams(
        'INSERT INTO records VALUES (42, ?, ?, NULL, NULL)',
        [{ type: 'Text', value: '' }, { type: 'Blob', value: [] }],
      ));
    } else if (phase === 'statements') {
      await db.execute('CREATE TABLE records (id INTEGER PRIMARY KEY, txt TEXT, payload BLOB, measure REAL, absent)');
      const expressions = "41, 'start' || char(0) || 'end', X'0001FF80', 1.25, NULL";
      const projection = 'id, txt, payload, measure, absent';
      const statements = [
        ['insert', `INSERT INTO records VALUES (${expressions}) RETURNING ${projection}`],
        ['select', `SELECT ${projection} FROM records`],
        ['cte', `WITH chosen AS (SELECT * FROM records) SELECT ${projection} FROM chosen`],
        ['commented', `/* query */ SELECT ${projection} FROM records`],
        ['values', `VALUES (${expressions})`],
        ['update', `UPDATE records SET measure=2.5 WHERE id=41 RETURNING ${projection}`],
        ['cteUpdate', `WITH chosen(id) AS (VALUES(41)) UPDATE records SET measure=3.75 WHERE id IN chosen RETURNING ${projection}`],
        ['delete', `DELETE FROM records WHERE id=41 RETURNING ${projection}`],
        ['plainInsert', `INSERT INTO records VALUES (${expressions})`],
        ['plainUpdate', 'UPDATE records SET measure=5.0 WHERE id=41'],
        ['noMatch', 'DELETE FROM records WHERE id=999'],
        ['emptySelect', 'SELECT * FROM records WHERE id=999'],
        ['pragma', 'PRAGMA table_info(records)'],
        ['cteInsert', "WITH input(id) AS (VALUES(57)) INSERT INTO records(id,txt) SELECT id,'cte' FROM input RETURNING id,txt"],
        ['duplicate', "INSERT INTO records(id) VALUES(41)"],
        ['afterError', 'SELECT COUNT(*) AS count FROM records'],
        ['ignoredInsert', 'INSERT OR IGNORE INTO records(id) VALUES(41)'],
        ['invalidText', "SELECT CAST(X'80FF' AS TEXT)"],
        ['readAfterInvalid', "SELECT 'still-open' AS value"],
        ['explain', 'EXPLAIN INSERT INTO records(id) VALUES(99)'],
        ['afterExplain', 'SELECT COUNT(*) AS count FROM records'],
        ['createAfterWrite', 'CREATE TABLE audit (id INTEGER PRIMARY KEY, source_id INTEGER)'],
        ['trigger', 'CREATE TRIGGER record_audit AFTER UPDATE ON records BEGIN INSERT INTO audit(source_id) VALUES(new.id); END'],
        ['triggeredUpdate', 'UPDATE records SET measure=6.5 RETURNING id'],
        ['begin', 'BEGIN IMMEDIATE'],
        ['transactionalInsert', 'INSERT INTO records(id) VALUES(71) RETURNING id'],
        ['rollback', 'ROLLBACK'],
        ['afterRollback', 'SELECT COUNT(*) AS count FROM records'],
      ];
      for (const [name, sql] of statements) {
        console.log(`FIDELITY executing ${name}: ${sql}`);
        try {
          results[name] = { result: plain(await execute(sql)) };
        } catch (error) {
          results[name] = { error: String(error) };
        }
      }
      results.boundReturning = { result: plain(await db.executeWithParams(
        'INSERT INTO records(id,txt,payload) VALUES(88,?,?) RETURNING txt,payload',
        [{ type: 'Text', value: 'bound\0\u65e5\u672c\ud83d\ude80\0end' }, { type: 'Blob', value: [0, 255, 0] }],
      )) };
    }
    results.select = phase === 'statements' ? results.select : plain(await db.execute('SELECT * FROM records ORDER BY id'));
    results.parameterizedSelect = plain(await db.executeWithParams('SELECT * FROM records WHERE id >= ? ORDER BY id', [{ type: 'Integer', value: 41 }]));
    await db.sync();
    console.log('FIDELITY exporting');
    results.bytes = Array.from(await db.exportToFile());
    console.log(`FIDELITY results ${JSON.stringify({ ...results, bytes: results.bytes.length })}`);
    return results;
  } finally {
    console.log('FIDELITY closing');
    await db.close();
    console.log('FIDELITY closed');
    db.free();
    console.log('FIDELITY freed');
  }
}
