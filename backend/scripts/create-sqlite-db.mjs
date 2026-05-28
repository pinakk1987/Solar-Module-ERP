import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, "..");
const schemaPath = resolve(backendRoot, "prisma", "schema.sqlite.prisma");
const envPath = resolve(backendRoot, ".env");
const envText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const dbUrl = envText.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1] ?? "file:./solaros-local.db";
const dbFile = dbUrl.startsWith("file:./") ? dbUrl.slice("file:./".length) : "solaros-local.db";
const dbPath = resolve(backendRoot, "prisma", dbFile);

const schema = readFileSync(schemaPath, "utf8");
const modelBlocks = [...schema.matchAll(/model\s+(\w+)\s+\{([\s\S]*?)\n\}/g)].map(
  ([, name, body]) => ({ name, body })
);
const modelNames = new Set(modelBlocks.map((model) => model.name));

const scalarTypes = new Set(["String", "Boolean", "DateTime", "Decimal", "Int", "Float", "Bytes"]);

const sqlType = (type) => {
  if (type === "String") return "TEXT";
  if (type === "Boolean") return "INTEGER";
  if (type === "DateTime") return "DATETIME";
  if (type === "Int") return "INTEGER";
  if (type === "Float" || type === "Decimal") return "DECIMAL";
  if (type === "Bytes") return "BLOB";
  return "TEXT";
};

const defaultSql = (line, type) => {
  const match = line.match(/@default\(([^)]+)\)/);
  if (!match) return "";

  const value = match[1];
  if (value === "now()") return " DEFAULT CURRENT_TIMESTAMP";
  if (value === "autoincrement()") return "";
  if (value === "true") return " DEFAULT 1";
  if (value === "false") return " DEFAULT 0";
  if (value.startsWith('"') && value.endsWith('"')) {
    return ` DEFAULT '${value.slice(1, -1).replaceAll("'", "''")}'`;
  }
  if (/^-?\d+(\.\d+)?$/.test(value) && type !== "String") return ` DEFAULT ${value}`;
  return "";
};

const fieldInfo = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;

  const name = parts[0];
  const rawType = parts[1];
  const isList = rawType.endsWith("[]");
  const baseType = rawType.replace("?", "").replace("[]", "");

  if (isList || modelNames.has(baseType) || !scalarTypes.has(baseType)) return null;

  return {
    name,
    type: baseType,
    optional: rawType.includes("?"),
    id: trimmed.includes("@id"),
    unique: trimmed.includes("@unique"),
    raw: trimmed
  };
};

const quoted = (name) => `"${name.replaceAll('"', '""')}"`;

if (existsSync(dbPath)) rmSync(dbPath);

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = OFF;");

for (const model of modelBlocks) {
  const fields = model.body
    .split(/\r?\n/)
    .map(fieldInfo)
    .filter(Boolean);

  const columnSql = fields.map((field) => {
    if (field.id) return `${quoted(field.name)} TEXT PRIMARY KEY`;
    const required = field.optional ? "" : " NOT NULL";
    return `${quoted(field.name)} ${sqlType(field.type)}${required}${defaultSql(field.raw, field.type)}`;
  });

  db.exec(`CREATE TABLE ${quoted(model.name)} (${columnSql.join(", ")});`);

  for (const field of fields.filter((item) => item.unique && !item.id)) {
    db.exec(
      `CREATE UNIQUE INDEX ${quoted(`${model.name}_${field.name}_key`)} ON ${quoted(model.name)} (${quoted(field.name)});`
    );
  }

  const compoundUniques = [...model.body.matchAll(/@@unique\(\[([^\]]+)\]\)/g)];
  for (const [index, match] of compoundUniques.entries()) {
    const columns = match[1].split(",").map((column) => quoted(column.trim()));
    db.exec(
      `CREATE UNIQUE INDEX ${quoted(`${model.name}_compound_${index}_key`)} ON ${quoted(model.name)} (${columns.join(", ")});`
    );
  }
}

db.close();
console.log(`Created SQLite database at ${dbPath}`);
