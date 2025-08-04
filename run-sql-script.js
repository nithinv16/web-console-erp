const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runSQLScript() {
  try {
    console.log('\n=== SAMPLE DATA CREATION INSTRUCTIONS ===\n');
    
    console.log('Due to Row Level Security (RLS) policies, the sample data needs to be inserted');
    console.log('directly through the Supabase SQL Editor. Please follow these steps:\n');
    
    console.log('1. Open your Supabase Dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Copy and paste the contents of "insert-sample-data.sql" file');
    console.log('4. Click "Run" to execute the script\n');
    
    console.log('The SQL script will:');
    console.log('- Temporarily modify RLS policies to allow data insertion');
    console.log('- Create 3 sample customers');
    console.log('- Create 3 sample invoices with different statuses (draft, sent, paid)');
    console.log('- Create invoice items for each invoice');
    console.log('- Verify the data was inserted correctly\n');
    
    // Try to read and display the SQL file content
    try {
      const sqlContent = fs.readFileSync('./insert-sample-data.sql', 'utf8');
      console.log('=== SQL SCRIPT CONTENT ===\n');
      console.log(sqlContent);
      console.log('\n=== END OF SQL SCRIPT ===\n');
    } catch (err) {
      console.log('Could not read insert-sample-data.sql file. Please check if it exists.');
    }
    
    console.log('After running the SQL script, you can test the invoice templates');
    console.log('and verify that "Unknown Customer" and status issues are resolved.\n');
    
    // Alternative: Try a simple test to see if we can insert data
    console.log('Testing current RLS policies...');
    const { data: companies } = await supabase.from('companies').select('id').limit(1);
    
    if (companies && companies.length > 0) {
      const testCustomer = {
        company_id: companies[0].id,
        name: 'RLS Test Customer',
        email: 'rls-test@example.com',
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('customers')
        .insert([testCustomer])
        .select();
      
      if (error) {
        console.log('❌ RLS policies are blocking data insertion.');
        console.log('Please use the SQL script method described above.');
        console.log('Error:', error.message);
      } else {
        console.log('✅ RLS policies allow data insertion!');
        console.log('You can try running the create-sample-data.js script directly.');
        
        // Clean up test data
        await supabase.from('customers').delete().eq('id', data[0].id);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runSQLScript();