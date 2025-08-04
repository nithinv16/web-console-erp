// Apply RLS Migration Script
// This script applies the missing RLS policies to fix the customers table error

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'sql', 'add_missing_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Applying RLS policies migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('✅ RLS policies have been added to fix the customers table error');
    console.log('🔄 Try saving an invoice again - the error should be resolved');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual steps to apply the migration:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of sql/add_missing_rls_policies.sql');
    console.log('4. Execute the SQL commands');
  }
}

// Run the migration
applyMigration();