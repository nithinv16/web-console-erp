const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('Environment variables:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple test query
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Companies found:', data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();