# Setup Sample Data for Invoice Testing

## Problem
The invoices page shows "Unknown Customer" because there are no customers or invoices in the database.

## Solution
You need to populate the database with sample data. Due to Row-Level Security (RLS) policies, this needs to be done manually through Supabase's SQL Editor.

## Steps to Add Sample Data

### Method 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL Script**
   - Open the file `insert-sample-data.sql` in this project
   - Copy all the content
   - Paste it into the SQL Editor

4. **Run the Script**
   - Click the "Run" button
   - You should see success messages and data counts

5. **Verify the Data**
   - The script will show a summary of created records
   - You should see 3 customers, 3 invoices, and 4 invoice items

### Method 2: Using Service Role Key (Alternative)

1. **Get Service Role Key**
   - In Supabase Dashboard, go to Settings > API
   - Copy the `service_role` key (not the `anon` key)

2. **Add to Environment**
   - Open `.env.local`
   - Add: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`

3. **Run the Script**
   ```bash
   node populate-sample-data.js
   ```

## Expected Results

After running the sample data script, you should have:

### Customers
- **John Doe** (john.doe@example.com) - Mumbai
- **Jane Smith** (jane.smith@example.com) - Delhi  
- **ABC Corporation** (contact@abccorp.com) - Bangalore

### Invoices
- **INV-2024-001** - John Doe - ₹11,800 (Draft)
- **INV-2024-002** - Jane Smith - ₹29,500 (Sent, Partially Paid)
- **INV-2024-003** - ABC Corporation - ₹59,000 (Paid)

## Verification

1. **Refresh the Invoices Page**
   - Go to `/erp/accounting/invoices`
   - You should now see customer names instead of "Unknown Customer"
   - Invoice statuses should display correctly

2. **Test the Data**
   - Run: `node test-invoice-data.js`
   - Should show 3 customers and 3 invoices

## Troubleshooting

### If you still see "Unknown Customer":
1. Check browser console for errors
2. Verify data was inserted: `node test-invoice-data.js`
3. Check RLS policies are not blocking reads
4. Refresh the page completely (Ctrl+F5)

### If SQL script fails:
1. Make sure you're using the SQL Editor in Supabase Dashboard
2. Check that you have the correct permissions
3. Try running sections of the script individually

## Files Created
- `insert-sample-data.sql` - Main SQL script for data insertion
- `populate-sample-data.js` - Node.js script (requires service role key)
- `test-invoice-data.js` - Script to verify data exists
- `SETUP_SAMPLE_DATA.md` - This instruction file

## Next Steps
Once sample data is loaded, the invoice page will properly display:
- ✅ Customer names instead of "Unknown Customer"
- ✅ Proper invoice statuses (draft, sent, paid)
- ✅ Payment status indicators
- ✅ Functional filtering and search