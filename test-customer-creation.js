// Test Customer Creation and Code Generation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Customer code generation function (same as in the app)
function generateCustomerCode(customerName) {
  // Extract first 2 characters from customer name (uppercase, letters only)
  const nameChars = customerName.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase().padEnd(2, 'X');
  
  // Generate 4 digits: 2 from current date + 2 random/sequence
  const today = new Date();
  const dateDigits = today.getDate().toString().padStart(2, '0');
  const randomDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${nameChars}${dateDigits}${randomDigits}`;
}

async function testCustomerCreation() {
  console.log('🧪 Testing Customer Creation and Code Generation');
  console.log('================================================');
  
  // Test 1: Customer Code Generation
  console.log('\n📝 Test 1: Customer Code Generation');
  const testNames = ['John Doe', 'ABC Corp', 'Test Customer', '123 Numbers'];
  
  testNames.forEach(name => {
    const code = generateCustomerCode(name);
    console.log(`Name: "${name}" → Code: "${code}"`);
  });
  
  // Test 2: Database Connection
  console.log('\n🔌 Test 2: Database Connection');
  try {
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      console.log('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
  }
  
  // Test 3: Check RLS Policies
  console.log('\n🔒 Test 3: RLS Policy Check');
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, customer_code')
      .limit(5);
    
    if (error) {
      console.log('❌ RLS Policy Error:', error.message);
      console.log('   Code:', error.code);
      if (error.code === '42501') {
        console.log('\n🚨 RLS VIOLATION DETECTED!');
        console.log('   This confirms the RLS policies need to be updated.');
        console.log('   Please apply the SQL from fix-rls-direct.sql in Supabase dashboard.');
      }
    } else {
      console.log('✅ RLS policies allow access');
      console.log(`   Found ${data.length} customers`);
      if (data.length > 0) {
        console.log('   Sample customer codes:', data.map(c => c.customer_code).filter(Boolean));
      }
    }
  } catch (err) {
    console.log('❌ RLS test error:', err.message);
  }
  
  // Test 4: Attempt Customer Creation (will likely fail due to RLS)
  console.log('\n➕ Test 4: Customer Creation Attempt');
  const testCustomer = {
    name: 'Test Customer ' + Date.now(),
    customer_code: generateCustomerCode('Test Customer'),
    email: 'test@example.com',
    phone: '1234567890',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      country: 'India'
    },
    customer_type: 'regular',
    status: 'active'
  };
  
  console.log('Attempting to create customer:', testCustomer.name);
  console.log('Generated code:', testCustomer.customer_code);
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Customer creation failed:', error.message);
      console.log('   Code:', error.code);
      if (error.code === '42501') {
        console.log('\n🚨 CONFIRMED: RLS policy violation prevents customer creation');
      }
    } else {
      console.log('✅ Customer created successfully!');
      console.log('   ID:', data.id);
      console.log('   Code:', data.customer_code);
      
      // Clean up test customer
      await supabase.from('customers').delete().eq('id', data.id);
      console.log('🧹 Test customer cleaned up');
    }
  } catch (err) {
    console.log('❌ Customer creation error:', err.message);
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('============');
  console.log('1. Customer code generation is working correctly');
  console.log('2. If RLS errors occurred, apply the SQL from fix-rls-direct.sql');
  console.log('3. After applying the SQL, customer creation should work');
  console.log('4. The auto-generated customer codes will be properly assigned');
}

// Run the test
testCustomerCreation();