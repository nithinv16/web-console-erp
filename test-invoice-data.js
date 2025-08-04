require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testInvoiceData() {
  try {
    console.log('Testing invoice and customer data...')
    
    // Test invoices with customer join
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .limit(5)
    
    console.log('\n=== INVOICES WITH CUSTOMERS ===')
    if (invError) {
      console.error('Invoice error:', invError)
    } else {
      console.log(`Found ${invoices?.length || 0} invoices`)
      invoices?.forEach((inv, i) => {
        console.log(`\nInvoice ${i + 1}:`)
        console.log(`  ID: ${inv.id}`)
        console.log(`  Number: ${inv.invoice_number}`)
        console.log(`  Customer ID: ${inv.customer_id}`)
        console.log(`  Customer Name: ${inv.customer?.name || 'NO CUSTOMER DATA'}`)
        console.log(`  Customer Object:`, inv.customer)
      })
    }
    
    // Test customers separately
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .limit(5)
    
    console.log('\n=== CUSTOMERS ===')
    if (custError) {
      console.error('Customer error:', custError)
    } else {
      console.log(`Found ${customers?.length || 0} customers`)
      customers?.forEach((cust, i) => {
        console.log(`\nCustomer ${i + 1}:`)
        console.log(`  ID: ${cust.id}`)
        console.log(`  Name: ${cust.name}`)
        console.log(`  Email: ${cust.email}`)
        console.log(`  Company ID: ${cust.company_id}`)
      })
    }
    
    // Test companies
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .limit(5)
    
    console.log('\n=== COMPANIES ===')
    if (compError) {
      console.error('Company error:', compError)
    } else {
      console.log(`Found ${companies?.length || 0} companies`)
      companies?.forEach((comp, i) => {
        console.log(`\nCompany ${i + 1}:`)
        console.log(`  ID: ${comp.id}`)
        console.log(`  Name: ${comp.name}`)
      })
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

testInvoiceData()