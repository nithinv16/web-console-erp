const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSampleData() {
  try {
    console.log('Creating sample data...');
    
    // Get the first company
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (compError || !companies || companies.length === 0) {
      console.error('No company found:', compError);
      return;
    }
    
    const companyId = companies[0].id;
    console.log('Using company ID:', companyId);
    
    // Create sample customers
    const customers = [
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
    ];
    
    const { data: createdCustomers, error: custError } = await supabase
      .from('customers')
      .insert(customers)
      .select();
    
    if (custError) {
      console.error('Error creating customers:', custError);
      return;
    }
    
    console.log('Created customers:', createdCustomers.length);
    
    // Create sample invoices
    const invoices = [
      {
        company_id: companyId,
        invoice_number: 'INV-2024-001',
        invoice_type: 'sales',
        customer_id: createdCustomers[0].id,
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
        customer_id: createdCustomers[1].id,
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
        customer_id: createdCustomers[2].id,
        invoice_date: '2024-01-25',
        due_date: '2024-02-25',
        subtotal: 50000.00,
        tax_amount: 9000.00,
        total_amount: 59000.00,
        paid_amount: 59000.00,
        status: 'paid',
        notes: 'Fully paid invoice'
      }
    ];
    
    const { data: createdInvoices, error: invError } = await supabase
      .from('invoices')
      .insert(invoices)
      .select();
    
    if (invError) {
      console.error('Error creating invoices:', invError);
      return;
    }
    
    console.log('Created invoices:', createdInvoices.length);
    
    // Create sample invoice items
    const invoiceItems = [];
    
    // Items for first invoice
    invoiceItems.push(
      {
        invoice_id: createdInvoices[0].id,
        description: 'Product A - Premium Quality',
        quantity: 2,
        unit_price: 3000.00,
        tax_rate: 18.00,
        tax_amount: 1080.00,
        total_amount: 7080.00
      },
      {
        invoice_id: createdInvoices[0].id,
        description: 'Product B - Standard Quality',
        quantity: 1,
        unit_price: 4000.00,
        tax_rate: 18.00,
        tax_amount: 720.00,
        total_amount: 4720.00
      }
    );
    
    // Items for second invoice
    invoiceItems.push(
      {
        invoice_id: createdInvoices[1].id,
        description: 'Service Package - Monthly',
        quantity: 1,
        unit_price: 25000.00,
        tax_rate: 18.00,
        tax_amount: 4500.00,
        total_amount: 29500.00
      }
    );
    
    // Items for third invoice
    invoiceItems.push(
      {
        invoice_id: createdInvoices[2].id,
        description: 'Enterprise Solution',
        quantity: 1,
        unit_price: 50000.00,
        tax_rate: 18.00,
        tax_amount: 9000.00,
        total_amount: 59000.00
      }
    );
    
    const { data: createdItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
      .select();
    
    if (itemsError) {
      console.error('Error creating invoice items:', itemsError);
      return;
    }
    
    console.log('Created invoice items:', createdItems.length);
    console.log('Sample data creation completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createSampleData();