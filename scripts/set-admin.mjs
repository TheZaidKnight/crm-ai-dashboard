import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const email = process.argv[2];

if (!email) {
  console.log('\n❌ Error: Please provide a user email.');
  console.log('Usage: node scripts/set-admin.mjs <user-email>\n');
  process.exit(1);
}

// Simple .env.local parser
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0) {
      env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`\n🔍 Provisioning Admin Role for: ${email}`);
console.log('----------------------------------------------------');

if (!supabaseUrl || !serviceKey || serviceKey === 'your-supabase-service-role-key') {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not configured in .env.local.');
  console.log('\n👉 Run this SQL command directly in the Supabase SQL Editor:');
  console.log(`\n   UPDATE public.profiles SET role = 'admin' WHERE email = '${email.toLowerCase().trim()}';\n`);
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email.toLowerCase().trim())
    .select('id, email, full_name, role');

  if (error) {
    console.error('❌ Failed to update profile:', error.message);
    console.log('\n👉 Alternative: run this SQL in your Supabase SQL Editor:');
    console.log(`   UPDATE public.profiles SET role = 'admin' WHERE email = '${email.toLowerCase().trim()}';\n`);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log(`⚠️  No profile found with email '${email}'.`);
    console.log('Ensure the user has signed up first.\n');
    process.exit(1);
  }

  console.log('✅ Successfully updated user to ADMIN:');
  console.table(data);
  console.log('The user can now access /admin on the dashboard.\n');
}

main();
