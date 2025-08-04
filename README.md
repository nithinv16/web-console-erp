# DukaaOn Seller Console

A comprehensive web-based management console for the DukaaOn marketplace platform, built with Next.js, Material-UI, and Supabase.

## Features

### 🏠 Dashboard
- Business profile overview
- Key performance metrics (orders, revenue, products, customers)
- Quick product addition
- Recent orders summary
- Low stock alerts

### 📦 Product Management
- Complete product catalog management
- Add, edit, and delete products
- Stock quantity tracking
- Category-based organization
- Product search and filtering
- Bulk operations

### 📋 Order Management
- Real-time order tracking
- Order status updates
- Customer information display
- Order filtering by status and date
- Detailed order views with progress tracking
- Revenue analytics

### 👥 Customer Management
- Customer database with aggregated metrics
- Order history per customer
- Customer contact information
- Top spender identification
- Customer activity tracking

### 📊 Analytics
- Business performance dashboards
- Revenue trend analysis
- Category performance metrics
- Top-selling products
- Order status distribution
- Time-based filtering (week, month, year)
- Interactive charts and visualizations

### 🚚 Delivery Management
- Delivery order tracking
- Status updates (pending, confirmed, preparing, out for delivery, delivered)
- Customer delivery information
- Delivery progress stepper
- Cancellation management

### 📦 Inventory Management
- Stock level monitoring
- Low stock and out-of-stock alerts
- Stock adjustments with reason tracking
- Quick stock increment/decrement
- Inventory value calculations
- Category-wise inventory analysis

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Form Handling**: React Hook Form with Yup validation
- **Notifications**: React Hot Toast
- **Styling**: CSS-in-JS with MUI's emotion

## Prerequisites

- Node.js 18+ and npm
- Supabase project with the following tables:
  - `profiles` (user profiles)
  - `seller_details` (business information)
  - `products` (product catalog)
  - `orders` (order management)
  - `delivery_orders` (delivery tracking)

## Installation

1. **Clone the repository**
   ```bash
   cd web-console
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy `.env.local.example` to `.env.local` and configure:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_NAME=DukaaOn Seller Console
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## Database Schema

The application expects the following Supabase tables:

### profiles
```sql
- id (uuid, primary key)
- email (text)
- full_name (text)
- phone (text)
- role (text) -- 'retailer', 'seller', 'wholesaler', 'manufacturer'
- created_at (timestamp)
- updated_at (timestamp)
```

### seller_details
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- business_name (text)
- business_type (text)
- address (text)
- city (text)
- state (text)
- pincode (text)
- is_verified (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### products
```sql
- id (uuid, primary key)
- seller_id (uuid, foreign key to profiles)
- name (text)
- description (text)
- price (decimal)
- category (text)
- stock_quantity (integer)
- unit (text)
- image_url (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### orders
```sql
- id (uuid, primary key)
- retailer_id (uuid, foreign key to profiles)
- seller_id (uuid, foreign key to profiles)
- total_amount (decimal)
- status (text) -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
- created_at (timestamp)
- updated_at (timestamp)
```

### delivery_orders
```sql
- id (uuid, primary key)
- order_id (uuid, foreign key to orders)
- seller_id (uuid, foreign key to profiles)
- delivery_address (text)
- status (text) -- 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
- estimated_delivery_date (timestamp)
- actual_delivery_date (timestamp)
- tracking_number (text)
- delivery_fee (decimal)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

## User Roles

The application supports the following user roles:
- **Seller**: Individual sellers
- **Wholesaler**: Wholesale businesses
- **Manufacturer**: Manufacturing companies

Only users with these roles can access the seller console.

## Features by Page

### Login (`/login`)
- Email/password authentication
- Role-based access control
- Automatic redirection to dashboard

### Dashboard (`/dashboard`)
- Business overview cards
- Quick stats (orders, revenue, products, customers)
- Recent orders table
- Quick product addition
- Low stock alerts

### Products (`/products`)
- Product listing with search and filters
- Add/edit product forms
- Stock management
- Category organization
- Product status management

### Orders (`/orders`)
- Order listing with real-time updates
- Status filtering and search
- Order details modal
- Status update functionality
- Customer information display

### Customers (`/customers`)
- Customer listing with metrics
- Order history per customer
- Customer contact information
- Revenue tracking per customer

### Analytics (`/analytics`)
- Revenue trend charts
- Category performance analysis
- Top products table
- Order status distribution
- Time-based filtering

### Deliveries (`/deliveries`)
- Delivery order tracking
- Status management
- Customer delivery details
- Progress tracking
- Cancellation handling

### Inventory (`/inventory`)
- Stock level monitoring
- Low stock/out of stock alerts
- Stock adjustment functionality
- Inventory value calculations
- Category-wise analysis

## Development

### Project Structure
```
web-console/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard page
│   ├── products/          # Products management
│   ├── orders/            # Orders management
│   ├── customers/         # Customers management
│   ├── analytics/         # Analytics dashboard
│   ├── deliveries/        # Delivery management
│   ├── inventory/         # Inventory management
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── layout/           # Layout components
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                   # Utility libraries
│   └── supabase.ts       # Supabase client
├── theme/                 # MUI theme configuration
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
1. Build the application: `npm run build`
2. Deploy the `.next` folder to your hosting platform
3. Ensure environment variables are configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the DukaaOn marketplace platform.

## Support

For support and questions, please contact the development team.