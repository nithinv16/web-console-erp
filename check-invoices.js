const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkInvoices() {
  try {
    console.log('Checking invoices...');
    
    // First check if there are any invoices at all
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('count', { count: 'exact', head: true });
    
    if (allError) {
      console.error('Error counting invoices:', allError);
      return;
    }
    
    console.log(`Total invoices in database: ${allInvoices}`);
    
    // Check companies
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(3);
    
    if (compError) {
      console.error('Error fetching companies:', compError);
    } else {
      console.log('Companies:', companies);
    }
    
    // Check customers
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name, company_id')
      .limit(5);
    
    if (custError) {
      console.error('Error fetching customers:', custError);
    } else {
      console.log('Customers:', customers);
    }
    
    // Try to get invoices with detailed error info
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        status,
        company_id,
        customer:customers(id, name, email)
      `)
      .limit(5);
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }
    
    console.log(`Found ${data.length} invoices:`);
    data.forEach(invoice => {
      console.log(`- Invoice ${invoice.invoice_number}:`);
      console.log(`  Company ID: ${invoice.company_id}`);
      console.log(`  Customer ID: ${invoice.customer_id}`);
      console.log(`  Status: ${invoice.status}`);
      console.log(`  Customer: ${invoice.customer ? invoice.customer.name : 'NULL/MISSING'}`);
      console.log('---');
    });
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkInvoices();