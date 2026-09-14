// Genere un diagramme Mermaid erDiagram a partir du schema.prisma reel du
// backend KWIIK (aucune dependance a prisma-erd-generator, dont la
// compatibilite avec Prisma 7 - generateur "prisma-client" - n'est pas
// garantie). Parseur minimal suffisant pour ce schema.
//
// Usage : node docs/captures/rncp/scripts/generer-erd.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const schema = readFileSync('backend/prisma/schema.prisma', 'utf8');

const SCALAR_TYPES = new Set([
  'String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes',
]);
const enumRegex = /enum (\w+) \{/g;
const enumNames = new Set();
let em;
while ((em = enumRegex.exec(schema))) enumNames.add(em[1]);

const modelRegex = /model (\w+) \{([^}]*)\}/g;
const models = [];
let m;
while ((m = modelRegex.exec(schema))) {
  const [, name, body] = m;
  const fields = [];
  const relations = [];
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
    const fieldMatch = line.match(/^(\w+)\s+([\w[\]?]+)/);
    if (!fieldMatch) continue;
    const [, fieldName, fieldType] = fieldMatch;
    const isRelationAttr = line.includes('@relation');
    const baseType = fieldType.replace(/[[\]?]/g, '');
    const isKnownModel = /^[A-Z]/.test(baseType) && !SCALAR_TYPES.has(baseType) && !enumNames.has(baseType);
    if (isKnownModel) {
      relations.push({ field: fieldName, target: baseType, isArray: fieldType.includes('[]'), hasRelationAttr: isRelationAttr });
    } else if (!isRelationAttr) {
      const pk = line.includes('@id');
      const unique = line.includes('@unique');
      fields.push({ name: fieldName, type: baseType, pk, unique });
    }
  }
  models.push({ name, fields, relations });
}

let mermaid = 'erDiagram\n';
for (const model of models) {
  mermaid += `  ${model.name} {\n`;
  for (const f of model.fields) {
    const flags = [f.pk ? 'PK' : '', f.unique ? 'UK' : ''].filter(Boolean).join(',');
    mermaid += `    ${f.type} ${f.name}${flags ? ' "' + flags + '"' : ''}\n`;
  }
  mermaid += '  }\n';
}

const seen = new Set();
for (const model of models) {
  for (const rel of model.relations) {
    const owningSide = rel.hasRelationAttr; // le cote qui porte @relation() porte la FK
    if (!owningSide) continue; // evite les doublons (les deux cotes d'une relation Prisma)
    const key = [model.name, rel.target, rel.field].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const cardinality = rel.isArray ? '}o--||' : '}o--||';
    mermaid += `  ${model.name} }o--|| ${rel.target} : "${rel.field}"\n`;
  }
}

writeFileSync('docs/erd.mmd', mermaid);
console.log(`ERD genere : ${models.length} entites, fichier docs/erd.mmd ecrit.`);
console.log(models.map((m) => m.name).join(', '));
