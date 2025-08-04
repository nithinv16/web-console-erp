require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Note: You'll need to add SUPABASE_SERVICE_ROLE_KEY to your .env.local file
// Get it from Supabase Dashboard > Settings > API > service_role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function populateSampleData() {
  try {
    console.log('🚀 Starting sample data population...')
    
    // Get the first company
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .single()
    
    if (compError || !companies) {
      throw new Error('No company found. Please create a company first.')
    }
    
    const companyId = companies.id
    console.log(`📋 Using company ID: ${companyId}`)
    
    // Create sample customers
    console.log('👥 Creating sample customers...')
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .insert([
        {
          company_id: companyId,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 98765 43210',
          address: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          status: 'active'
        },
        {
          company_id: companyId,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+91 87654 32109',
          address: {
            street: '456 Business Avenue',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          status: 'active'
        },
        {
          company_id: companyId,
          name: 'ABC Corporation',
          email: 'contact@abccorp.com',
          phone: '+91 76543 21098',
          address: {
            street: '789 Corporate Plaza',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          },
          status: 'active'
        }
      ])
      .select()
    
    if (custError) {
      console.error('❌ Customer creation failed:', custError)
      throw custError
    }
    
    console.log(`✅ Created ${customers.length} customers`)
    
    // Create sample invoices
    console.log('📄 Creating sample invoices...')
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .insert([
        {
          company_id: companyId,
          invoice_number: 'INV-2024-001',
          invoice_type: 'sales',
          customer_id: customers[0].id,
          invoice_date: '2024-01-15',
          due_date: '2024-02-15',
          subtotal: 10000.00,
          tax_amount: 1800.00,
          total_amount: 11800.00,
          paid_amount: 0.00,
          status: 'draft',
          notes: 'Sample invoice for testing'
        },
        {
          company_id: companyId,
          invoice_number: 'INV-2024-002',
          invoice_type: 'sales',
          customer_id: customers[1].id,
          invoice_date: '2024-01-20',
          due_date: '2024-02-20',
          subtotal: 25000.00,
          tax_amount: 4500.00,
          total_amount: 29500.00,
          paid_amount: 15000.00,
          status: 'sent',
          notes: 'Partially paid invoice'
        },
        {
          company_id: companyId,
          invoice_number: 'INV-2024-003',
          invoice_type: 'sales',
          customer_id: customers[2].id,
          invoice_date: '2024-01-25',
          due_date: '2024-02-25',
          subtotal: 50000.00,
          tax_amount: 9000.00,
          total_amount: 59000.00,
          paid_amount: 59000.00,
          status: 'paid',
          notes: 'Fully paid invoice'
        }
      ])
      .select()
    
    if (invError) {
      console.error('❌ Invoice creation failed:', invError)
      throw invError
    }
    
    console.log(`✅ Created ${invoices.length} invoices`)
    
    // Create sample invoice items
    console.log('📦 Creating sample invoice items...')
    const { data: items, error: itemError } = await supabase
      .from('invoice_items')
      .insert([
        // Items for first invoice
        {
          invoice_id: invoices[0].id,
          description: 'Product A - Premium Quality',
          quantity: 2,
          unit_price: 3000.00,
          tax_rate: 18.00,
          tax_amount: 1080.00,
          total_amount: 7080.00
        },
        {
          invoice_id: invoices[0].id,
          description: 'Product B - Standard Quality',
          quantity: 1,
          unit_price: 4000.00,
          tax_rate: 18.00,
          tax_amount: 720.00,
          total_amount: 4720.00
        },
        // Items for second invoice
        {
          invoice_id: invoices[1].id,
          description: 'Service Package - Monthly',
          quantity: 1,
          unit_price: 25000.00,
          tax_rate: 18.00,
          tax_amount: 4500.00,
          total_amount: 29500.00
        },
        // Items for third invoice
        {
          invoice_id: invoices[2].id,
          description: 'Enterprise Solution',
          quantity: 1,
          unit_price: 50000.00,
          tax_rate: 18.00,
          tax_amount: 9000.00,
          total_amount: 59000.00
        }
      ])
      .select()
    
    if (itemError) {
      console.error('❌ Invoice items creation failed:', itemError)
      throw itemError
    }
    
    console.log(`✅ Created ${items.length} invoice items`)
    
    // Verify the data
    console.log('\n🔍 Verifying created data...')
    const { data: verifyInvoices } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        status,
        total_amount,
        paid_amount,
        customer:customers(name, email)
      `)
      .eq('company_id', companyId)
    
    console.log('\n📊 Created invoices:')
    verifyInvoices?.forEach(inv => {
      console.log(`  ${inv.invoice_number} - ${inv.customer?.name} - ₹${inv.total_amount} (${inv.status})`)
    })
    
    console.log('\n🎉 Sample data population completed successfully!')
    console.log('✨ You can now refresh the invoices page to see customer names instead of "Unknown Customer"')
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error)
    
    if (error.message?.includes('row-level security')) {
      console.log('\n💡 RLS Policy Issue Detected!')
      console.log('To fix this, you can either:')
      console.log('1. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
      console.log('2. Or run the SQL script manually in Supabase SQL Editor:')
      console.log('   - Go to Supabase Dashboard > SQL Editor')
      console.log('   - Copy and paste the content from insert-sample-data.sql')
      console.log('   - Click "Run"')
    }
  }
}

populateSampleData()