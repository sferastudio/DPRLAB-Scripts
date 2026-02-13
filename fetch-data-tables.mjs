const BASE_URL = "https://client.memberstack.com";
const PUBLIC_KEY = "pk_sb_21b05fd06343d59948fa";

const headers = {
  "X-API-Key": PUBLIC_KEY,
  "Content-Type": "application/json",
};

async function getDataTables() {
  const res = await fetch(`${BASE_URL}/v1/data-tables`, { headers });
  if (!res.ok) throw new Error(`getDataTables failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function queryRecords(tableKey) {
  const res = await fetch(`${BASE_URL}/v1/data-records/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      table: tableKey,
      query: { findMany: { take: 50 } },
    }),
  });
  if (!res.ok) throw new Error(`queryRecords failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  // List all data tables
  const tablesRes = await getDataTables();
  const tables = tablesRes?.data?.tables || [];
  console.log(`Found ${tables.length} data table(s):\n`);

  for (const table of tables) {
    console.log(`--- TABLE: ${table.name} (key: ${table.key}) ---`);
    console.log(`  Fields: ${table.fieldCount}, Records: ${table.recordCount}`);
    console.log();

    // Fetch records for each table
    try {
      const recordsRes = await queryRecords(table.key);
      const records = recordsRes?.data?.records || [];
      console.log(`  ${records.length} record(s):`);
      for (const record of records) {
        console.log(`\n  [${record.id}]`);
        if (record.data) {
          for (const [field, value] of Object.entries(record.data)) {
            console.log(`    ${field}: ${JSON.stringify(value)}`);
          }
        }
      }
    } catch (err) {
      console.log(`  Could not fetch records: ${err.message}`);
    }
    console.log();
  }
}

main().catch(console.error);
