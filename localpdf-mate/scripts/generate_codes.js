import crypto from 'crypto';
import fs from 'fs';

// Configuration
const BATCH_SIZE = 100; // Number of codes to generate
const PREFIX = 'LP';    // Prefix for the codes

function generateCode() {
  // Generate 4 random bytes and convert to Hex
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  // Format: LP-XXXX-XXXX
  return `${PREFIX}-${rand.substring(0, 4)}-${rand.substring(4, 8)}`;
}

const codes = [];
for (let i = 0; i < BATCH_SIZE; i++) {
  codes.push(generateCode());
}

// Generate SQL for Supabase with 'ON CONFLICT DO NOTHING' for safety
const sqlValues = codes.map(code => `('${code}')`).join(',\n  ');
const sqlContent = `
INSERT INTO licenses (code) VALUES 
  ${sqlValues}
ON CONFLICT (code) DO NOTHING;
`;

// Generate Plain Text for Payment Platforms (Mianbaoduo/Creem)
const txtContent = codes.join('\n');

// Write files
fs.writeFileSync('insert_codes.sql', sqlContent);
fs.writeFileSync('codes_list.txt', txtContent);

console.log(`✅ Generated ${BATCH_SIZE} unique codes.`);
console.log(`1. 'insert_codes.sql' -> Run this in Supabase SQL Editor.`);
console.log(`2. 'codes_list.txt' -> Copy these to your Payment Platform.`);