# Apply ERP Database Migration

## Issue Resolution

You're experiencing two issues:
1. `net::ERR_ABORTED` errors for ERP routes
2. Row-level security policy violation when creating companies

## Solution

### Step 1: Apply Database Migration

The INSERT policy for companies table needs to be applied to your Supabase database.

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/xcpznnkpjgyrpbvpnvit
   - Navigate to SQL Editor

2. **Run the Complete ERP Schema**
   - Copy the entire content from `sql/erp_schema.sql`
   - Paste it in the SQL Editor
   - Click "Run" to execute

   **OR**

3. **Run Just the Missing Policy** (if tables already exist)
   ```sql
   -- Add INSERT policy for companies table
   CREATE POLICY "Users can create companies" ON companies FOR INSERT WITH CHECK (true);
   ```

### Step 2: Verify Routes

The following routes have been created/fixed:
- ✅ `/erp/accounting/invoices/new` - Invoice creation page
- ✅ `/erp/sales/orders/new` - Sales order creation page  
- ✅ `/erp/purchase/orders/new` - Purchase order creation page
- ✅ `/erp/inventory/products/new` - Product creation page

### Step 3: Test the Application

After applying the database migration:
1. Refresh your ERP page
2. The company should auto-create using your business_name from seller details
3. All navigation links should work without `net::ERR_ABORTED` errors

### Expected Behavior

- **Company Creation**: Will automatically use `business_name` from your seller profile
- **No More Popups**: The "Setup your company" dialog has been removed
- **Working Navigation**: All ERP module links will function properly

### Troubleshooting

If you still see errors after applying the migration:
1. Check browser console for specific error messages
2. Verify the migration was applied successfully in Supabase
3. Clear browser cache and refresh the page

---

**Note**: The migration includes all necessary RLS policies and table structures for the ERP system to function properly.