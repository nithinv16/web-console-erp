// Apply Simple RLS Policies for Customers
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySimpleRLS() {
  try {
    console.log('🔄 Reading simple RLS policy file...');
    const sql = fs.readFileSync('sql/fix_customers_simple_rls.sql', 'utf8');
    
    console.log('\n📋 MANUAL EXECUTION REQUIRED:');
    console.log('===============================');
    console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('\n' + sql);
    console.log('\n===============================');
    
    console.log('\n📝 Steps to apply the fix:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the SQL statements above');
    console.log('4. Paste and execute them in the SQL Editor');
    console.log('5. Try creating a customer again');
    
    console.log('\n✅ This will create simple RLS policies that allow any authenticated user');
    console.log('   to perform CRUD operations on the customers table.');
    console.log('\n🔄 After applying these policies, the RLS violation error should be resolved.');
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error.message);
  }
}

// Run the migration
applySimpleRLS();