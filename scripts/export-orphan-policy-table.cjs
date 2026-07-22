const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRawUnsafe(
      'SELECT to_regclass(\'public."Policy"\') AS "tableName"'
    );
    if (!tables[0]?.tableName) {
      console.log('No legacy Policy table exists; nothing to export.');
      return;
    }

    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Policy" ORDER BY "createdAt" ASC');
    const exportDirectory = path.join(process.cwd(), "tmp", "policy-backups");
    fs.mkdirSync(exportDirectory, { recursive: true });
    const exportPath = path.join(exportDirectory, `Policy-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(exportPath, `${JSON.stringify(rows, null, 2)}\n`);
    console.log(`Exported ${rows.length} legacy Policy rows to ${exportPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
