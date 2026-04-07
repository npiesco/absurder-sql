import { test, expect } from '@playwright/test';

const BENCHMARK_URL = 'http://localhost:8080/examples/benchmark.html';
const BENCHMARK_NUM_ROWS = Number(process.env.BENCHMARK_NUM_ROWS ?? 200);
const BENCHMARK_BATCH_SIZE = Number(process.env.BENCHMARK_BATCH_SIZE ?? 50);
const BENCHMARK_ROW_SIZE = Number(process.env.BENCHMARK_ROW_SIZE ?? 64);

async function setBenchmarkInputs(page, { numRows, batchSize, rowSize }) {
  await page.locator('#numRows').fill(String(numRows));
  await page.locator('#batchSize').fill(String(batchSize));
  await page.locator('#rowSize').fill(String(rowSize));
}

async function readResultRows(page) {
  return await page.locator('#resultsContainer .result-row').evaluateAll((rows) => {
    return rows.map((row) => {
      const cells = Array.from(row.querySelectorAll('div')).map((cell) => cell.textContent?.trim() ?? '');
      return {
        implementation: cells[0],
        insert: cells[1],
        read: cells[2],
        update: cells[3],
        delete: cells[4],
      };
    });
  });
}

test.describe('Benchmark Page', () => {
  test('runs explicit IndexedDB and Hybrid benchmark variants', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(BENCHMARK_URL);
    await page.waitForSelector('#runAll', { timeout: 15000 });
    await page.waitForFunction(() => document.getElementById('status')?.textContent?.includes('Ready to benchmark!'), null, { timeout: 20000 });

    await setBenchmarkInputs(page, {
      numRows: BENCHMARK_NUM_ROWS,
      batchSize: BENCHMARK_BATCH_SIZE,
      rowSize: BENCHMARK_ROW_SIZE,
    });

    await page.locator('#runAll').click();

    await page.waitForFunction(() => document.getElementById('status')?.textContent?.includes('All benchmarks complete!'), null, {
      timeout: 120000,
    });

    const rows = await readResultRows(page);
    console.log('BENCHMARK_RESULTS', JSON.stringify(rows));

    const indexedDbRow = rows.find((row) => row.implementation.includes('AbsurderSQL IndexedDB (IndexedDB)'));
    const hybridRow = rows.find((row) => row.implementation.includes('AbsurderSQL Hybrid (Hybrid)'));
    const absurdSqlRow = rows.find((row) => row.implementation.includes('absurd-sql'));
    const rawIndexedDbRow = rows.find((row) => row.implementation.includes('Raw IndexedDB'));

    expect(indexedDbRow).toBeDefined();
    expect(hybridRow).toBeDefined();
    expect(absurdSqlRow).toBeDefined();
    expect(rawIndexedDbRow).toBeDefined();
    expect(errors).toHaveLength(0);
  });
});