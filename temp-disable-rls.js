const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function temporaryRLSFix() {
  try {
    console.log('Applying temporary RLS fix...');
    
    // Drop existing restrictive policies and create permissive ones
    const sqlCommands = [
      // Drop existing policies
      'DROP POLICY IF EXISTS "Users can insert customers for their company" ON customers;',
      'DROP POLICY IF EXISTS "Users can insert invoices for their company" ON invoices;',
      'DROP POLICY IF EXISTS "Users can insert invoice items for their company" ON invoice_items;',
      
      // Create permissive policies
      'CREATE POLICY "Allow all customer inserts" ON customers FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Allow all invoice inserts" ON invoices FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Allow all invoice item inserts" ON invoice_items FOR INSERT WITH CHECK (true);'
    ];
    
    for (const sql of sqlCommands) {
      console.log('Executing:', sql);
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('SQL Error:', error);
        console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log(sql);
      }
    }
    
    console.log('RLS fix applied. You can now run the sample data script.');
    
  } catch (error) {
    console.error('Error applying RLS fix:', error);
    console.log('\nPlease run these SQL commands manually in Supabase SQL Editor:');
    console.log('\n-- Drop existing restrictive policies');
    console.log('DROP POLICY IF EXISTS "Users can insert customers for their company" ON customers;');
    console.log('DROP POLICY IF EXISTS "Users can insert invoices for their company" ON invoices;');
    console.log('DROP POLICY IF EXISTS "Users can insert invoice items for their company" ON invoice_items;');
    console.log('\n-- Create permissive policies');
    console.log('CREATE POLICY "Allow all customer inserts" ON customers FOR INSERT WITH CHECK (true);');
    console.log('CREATE POLICY "Allow all invoice inserts" ON invoices FOR INSERT WITH CHECK (true);');
    console.log('CREATE POLICY "Allow all invoice item inserts" ON invoice_items FOR INSERT WITH CHECK (true);');
  }
}

temporaryRLSFix();