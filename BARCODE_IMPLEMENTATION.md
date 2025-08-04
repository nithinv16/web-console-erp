# Barcode Scanning Implementation

This document describes the barcode scanning functionality implemented in the ERP system.

## Features Implemented

### 1. Barcode Scanner Component
- **Location**: `components/barcode/BarcodeScanner.tsx`
- **Features**:
  - Mobile camera access with permission handling
  - Front/rear camera switching
  - Torch/flashlight control
  - Real-time barcode detection
  - Support for multiple barcode formats (EAN-13, EAN-8, UPC-A, UPC-E, Code128, Code39)
  - Scanning overlay with visual feedback
  - Duplicate scan prevention

### 2. Barcode Input Component
- **Location**: `components/barcode/BarcodeInput.tsx`
- **Features**:
  - Combined text input and scan button
  - Integration with BarcodeScanner component
  - Form-friendly interface

### 3. Database Schema Updates
- **Migration File**: `sql/barcode_migration.sql`
- **New Tables**:
  - `master_products`: Global product catalog with barcode information
  - `stock_taking_sessions`: Inventory counting sessions
  - `stock_taking_items`: Individual scanned items during stock taking
  - `barcode_scan_logs`: Audit trail for all barcode scans

- **Updated Tables**:
  - `erp_products`: Added `ean_code`, `upc_code`, `gtin`, `master_product_id`
  - `products`: Added barcode fields for marketplace products

### 4. Barcode Utilities
- **Location**: `utils/barcode.ts`
- **Features**:
  - Barcode format validation (EAN-13, EAN-8, UPC-A, UPC-E, Code128, Code39)
  - Automatic format detection
  - Barcode formatting for display
  - Test barcode generation
  - Search query creation

### 5. Barcode Service
- **Location**: `services/barcodeService.ts`
- **Features**:
  - Product search by barcode across multiple fields
  - Master product catalog search
  - Stock taking session management
  - Barcode scan logging
  - Analytics and reporting

### 6. Updated Pages

#### Product Creation (`app/erp/inventory/products/new/page.tsx`)
- Added barcode scanning input for barcode field
- Added EAN, UPC, and GTIN fields
- Enhanced form validation

#### Product Listing (`app/erp/inventory/products/page.tsx`)
- Added "Scan Barcode" button for quick product lookup
- Integrated barcode search functionality
- Real-time product filtering by scanned barcode

#### Stock Taking (`app/erp/inventory/stock-taking/page.tsx`)
- Complete stock taking interface with barcode scanning
- Session management (create, save, complete, cancel)
- Real-time quantity tracking and difference calculation
- Manual product addition capability

## Usage Instructions

### 1. Product Creation with Barcode
1. Navigate to ERP → Inventory → Products → Add New Product
2. Fill in product details
3. Use the barcode field with scan button to scan product barcode
4. Optionally fill EAN, UPC, or GTIN codes
5. Save the product

### 2. Product Search by Barcode
1. Navigate to ERP → Inventory → Products
2. Click the "Scan Barcode" button
3. Allow camera permissions when prompted
4. Point camera at barcode
5. Product will be automatically filtered when barcode is detected

### 3. Stock Taking with Barcode Scanning
1. Navigate to ERP → Inventory → Stock Taking
2. Create a new stock taking session
3. Use "Scan Product" to scan items
4. System will automatically:
   - Find the product by barcode
   - Show current system quantity
   - Allow you to enter counted quantity
   - Calculate differences
5. Complete or save session when done

## Supported Barcode Formats

- **EAN-13**: 13-digit European Article Number
- **EAN-8**: 8-digit European Article Number
- **UPC-A**: 12-digit Universal Product Code
- **UPC-E**: 8-digit Universal Product Code (compressed)
- **Code128**: Alphanumeric barcode
- **Code39**: Alphanumeric barcode with special characters

## Database Migration

To implement the barcode functionality in your Supabase database:

1. Run the SQL migration file: `sql/barcode_migration.sql`
2. This will:
   - Create new tables for barcode functionality
   - Add barcode fields to existing tables
   - Create necessary indexes for performance
   - Insert sample master products

## Security Considerations

- Camera permissions are requested only when needed
- All barcode scans are logged for audit purposes
- Company-specific data isolation is maintained
- No sensitive data is stored in barcode logs

## Performance Optimizations

- Database indexes on all barcode fields for fast lookups
- Efficient barcode detection with ZXing library
- Debounced scanning to prevent duplicate reads
- Optimized camera settings for barcode scanning

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Mobile browsers**: Full support with camera access

## Troubleshooting

### Camera Not Working
1. Ensure HTTPS is enabled (required for camera access)
2. Check browser permissions for camera access
3. Try switching between front/rear cameras
4. Ensure good lighting conditions

### Barcode Not Detected
1. Ensure barcode is clean and not damaged
2. Try different angles and distances
3. Use torch/flashlight in low light conditions
4. Check if barcode format is supported

### Product Not Found
1. Verify barcode is correctly entered in product database
2. Check if product status is 'active'
3. Ensure barcode matches exactly (no extra spaces)
4. Try manual search to verify product exists

## Future Enhancements

- Batch barcode scanning for multiple products
- Barcode generation and printing
- Integration with external product databases
- Advanced analytics and reporting
- Offline scanning capability
- Barcode quality assessment