#!/usr/bin/env node

/**
 * DukaaOn ERP Phase 1 Setup Script
 * This script automates the initial setup for Phase 1 implementation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✓ Created directory: ${dirPath}`, 'green');
  } else {
    log(`✓ Directory already exists: ${dirPath}`, 'yellow');
  }
}

function createFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    log(`✓ Created file: ${filePath}`, 'green');
  } else {
    log(`✓ File already exists: ${filePath}`, 'yellow');
  }
}

function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'web-console', 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const newDependencies = {
      '@tanstack/react-query': '^4.0.0',
      'zustand': '^4.0.0',
      'react-hook-form': '^7.0.0',
      'yup': '^1.0.0',
      'date-fns': '^2.29.0',
      'recharts': '^2.5.0',
      'uuid': '^9.0.0'
    };
    
    const newDevDependencies = {
      '@types/uuid': '^9.0.0'
    };
    
    packageJson.dependencies = { ...packageJson.dependencies, ...newDependencies };
    packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDependencies };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('✓ Updated package.json with new dependencies', 'green');
  } else {
    log('⚠ package.json not found in web-console directory', 'yellow');
  }
}

function createDirectoryStructure() {
  log('\n📁 Creating directory structure...', 'cyan');
  
  const directories = [
    'web-console/database',
    'web-console/database/migrations',
    'web-console/lib/types',
    'web-console/lib/services',
    'web-console/lib/api',
    'web-console/hooks',
    'web-console/components/common',
    'web-console/components/admin',
    'web-console/app/admin',
    'web-console/app/admin/users',
    'web-console/app/admin/roles',
    'web-console/app/admin/departments',
    'web-console/app/admin/audit-logs'
  ];
  
  directories.forEach(createDirectory);
}

function createMigrationFile() {
  log('\n📄 Creating database migration file...', 'cyan');
  
  const migrationContent = `-- Enhanced User Management Migration
-- File: 001_enhanced_user_management.sql
-- Run this in Supabase SQL Editor

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES profiles(id),
    parent_department_id UUID REFERENCES departments(id),
    cost_center VARCHAR(50),
    budget_allocated DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES profiles(id),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Insert default departments
INSERT INTO departments (department_code, name, description) VALUES
('ADMIN', 'Administration', 'Administrative department'),
('SALES', 'Sales & Marketing', 'Sales and marketing operations'),
('PURCHASE', 'Procurement', 'Purchase and supplier management'),
('WAREHOUSE', 'Warehouse', 'Inventory and warehouse management'),
('FINANCE', 'Finance & Accounts', 'Financial operations'),
('HR', 'Human Resources', 'Human resource management'),
('IT', 'Information Technology', 'IT support and development'),
('PRODUCTION', 'Production', 'Manufacturing operations'),
('QC', 'Quality Control', 'Quality assurance and control')
ON CONFLICT (department_code) DO NOTHING;

-- Insert default roles
INSERT INTO roles (role_code, role_name, description, is_system_role, permissions) VALUES
('SUPER_ADMIN', 'Super Administrator', 'Full system access', true, '[
    {"module": "*", "actions": ["create", "read", "update", "delete", "admin"]}
]'),
('ADMIN', 'Administrator', 'Administrative access', true, '[
    {"module": "users", "actions": ["create", "read", "update", "delete"]},
    {"module": "roles", "actions": ["create", "read", "update", "delete"]},
    {"module": "departments", "actions": ["create", "read", "update", "delete"]},
    {"module": "reports", "actions": ["read", "export"]}
]'),
('MANAGER', 'Manager', 'Department manager access', false, '[
    {"module": "dashboard", "actions": ["read"]},
    {"module": "reports", "actions": ["read", "export"]},
    {"module": "users", "actions": ["read", "update"]}
]'),
('EMPLOYEE', 'Employee', 'Standard employee access', false, '[
    {"module": "dashboard", "actions": ["read"]},
    {"module": "profile", "actions": ["read", "update"]}
]'),
('VIEWER', 'Viewer', 'Read-only access', false, '[
    {"module": "dashboard", "actions": ["read"]},
    {"module": "reports", "actions": ["read"]}
]')
ON CONFLICT (role_code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Add foreign key constraints
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_department 
FOREIGN KEY (department_id) REFERENCES departments(id);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - customize as needed)
CREATE POLICY "Users can view departments" ON departments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view roles" ON roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());
`;
  
  createFile('web-console/database/migrations/001_enhanced_user_management.sql', migrationContent);
}

function createTypeDefinitions() {
  log('\n📝 Creating TypeScript type definitions...', 'cyan');
  
  const rbacTypesContent = `// RBAC Type Definitions
// File: web-console/lib/types/rbac.ts

export interface Permission {
  module: string;
  actions: string[];
  resource?: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  role_code: string;
  role_name: string;
  description?: string;
  permissions: Permission[];
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  department_code: string;
  name: string;
  description?: string;
  manager_id?: string;
  parent_department_id?: string;
  cost_center?: string;
  budget_allocated?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  role?: Role;
}

export interface EnhancedUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  department_id?: string;
  employee_id?: string;
  permissions: Permission[];
  is_active: boolean;
  last_login?: string;
  department?: Department;
  user_roles?: UserRole[];
}

export type ModuleName = 
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'departments'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'suppliers'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'audit'
  | '*';

export type ActionType = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'admin'
  | '*';

export interface PermissionCheck {
  module: ModuleName;
  action: ActionType;
  resource?: string;
}

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  VIEWER: 'VIEWER'
} as const;

export type RoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES];

export const DEPARTMENT_CODES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
  WAREHOUSE: 'WAREHOUSE',
  FINANCE: 'FINANCE',
  HR: 'HR',
  IT: 'IT',
  PRODUCTION: 'PRODUCTION',
  QC: 'QC'
} as const;

export type DepartmentCode = typeof DEPARTMENT_CODES[keyof typeof DEPARTMENT_CODES];
`;
  
  createFile('web-console/lib/types/rbac.ts', rbacTypesContent);
}

function createSetupInstructions() {
  log('\n📋 Creating setup instructions...', 'cyan');
  
  const instructionsContent = `# Phase 1 Setup Instructions

## ✅ Completed by Setup Script

1. Created directory structure
2. Created database migration file
3. Created TypeScript type definitions
4. Updated package.json with required dependencies

## 🔧 Manual Steps Required

### Step 1: Install Dependencies
\`\`\`bash
cd web-console
npm install
\`\`\`

### Step 2: Run Database Migration
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the content from \`database/migrations/001_enhanced_user_management.sql\`
4. Paste and execute the SQL

### Step 3: Create Required Files
The following files need to be created manually (refer to PHASE_1_IMPLEMENTATION_GUIDE.md):

- \`lib/services/rbac.ts\` - RBAC service implementation
- \`hooks/usePermissions.ts\` - Permission hook
- \`components/common/PermissionGate.tsx\` - Permission component
- \`lib/api/base.ts\` - Base API class
- Update \`contexts/AuthContext.tsx\` - Enhanced authentication

### Step 4: Test the Implementation
1. Start the development server: \`npm run dev\`
2. Test user authentication
3. Verify role-based access control
4. Check audit logging functionality

### Step 5: Create Admin Interface
Create admin pages for:
- User management
- Role management
- Department management
- Audit log viewing

## 📚 Next Steps

After completing Phase 1:
1. Test all functionality thoroughly
2. Create test users with different roles
3. Verify permissions are working correctly
4. Move to Phase 2: Supply Chain Management

## 🆘 Need Help?

Refer to:
- \`ERP_IMPLEMENTATION_ROADMAP.md\` for the complete plan
- \`PHASE_1_IMPLEMENTATION_GUIDE.md\` for detailed implementation steps

## 🔍 Verification Checklist

- [ ] Database migration executed successfully
- [ ] New tables created (departments, roles, user_roles, audit_logs)
- [ ] RBAC service implemented
- [ ] Permission checking works
- [ ] Enhanced authentication context
- [ ] Base API class with audit logging
- [ ] Permission-based UI components
- [ ] Admin interface created
- [ ] All tests passing
`;
  
  createFile('PHASE_1_SETUP_COMPLETE.md', instructionsContent);
}

function createQuickTestFile() {
  log('\n🧪 Creating quick test file...', 'cyan');
  
  const testContent = `// Quick Test for Phase 1 Implementation
// File: web-console/test-phase1.js
// Run with: node test-phase1.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.log('❌ Please update the Supabase credentials in this file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSetup() {
  console.log('🧪 Testing Phase 1 Database Setup...');
  
  try {
    // Test departments table
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(5);
    
    if (deptError) {
      console.log('❌ Departments table test failed:', deptError.message);
    } else {
      console.log('✅ Departments table working:', departments.length, 'records found');
    }
    
    // Test roles table
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.log('❌ Roles table test failed:', rolesError.message);
    } else {
      console.log('✅ Roles table working:', roles.length, 'records found');
    }
    
    // Test user_roles table
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (userRolesError) {
      console.log('❌ User roles table test failed:', userRolesError.message);
    } else {
      console.log('✅ User roles table working:', userRoles.length, 'records found');
    }
    
    // Test audit_logs table
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(5);
    
    if (auditError) {
      console.log('❌ Audit logs table test failed:', auditError.message);
    } else {
      console.log('✅ Audit logs table working:', auditLogs.length, 'records found');
    }
    
    console.log('\n🎉 Phase 1 database setup test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Implement the RBAC service');
    console.log('2. Create permission hooks and components');
    console.log('3. Update the authentication context');
    console.log('4. Build admin interface');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

testDatabaseSetup();
`;
  
  createFile('web-console/test-phase1.js', testContent);
}

function main() {
  log('🚀 DukaaOn ERP Phase 1 Setup Script', 'bright');
  log('=====================================\n', 'bright');
  
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('web-console')) {
      log('❌ Error: web-console directory not found!', 'red');
      log('Please run this script from the DukaaOn root directory.', 'yellow');
      process.exit(1);
    }
    
    createDirectoryStructure();
    updatePackageJson();
    createMigrationFile();
    createTypeDefinitions();
    createQuickTestFile();
    createSetupInstructions();
    
    log('\n🎉 Phase 1 setup completed successfully!', 'green');
    log('\n📋 Next steps:', 'cyan');
    log('1. Read PHASE_1_SETUP_COMPLETE.md for manual steps', 'yellow');
    log('2. Install dependencies: cd web-console && npm install', 'yellow');
    log('3. Run database migration in Supabase', 'yellow');
    log('4. Implement the remaining files as per the guide', 'yellow');
    log('5. Test with: cd web-console && node test-phase1.js', 'yellow');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };