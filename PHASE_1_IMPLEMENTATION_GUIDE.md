# Phase 1 Implementation Guide - ERP Foundation

## Getting Started with Phase 1 (Weeks 1-12)

This guide provides step-by-step instructions to implement the foundation of your ERP system.

## Week 1-2: Database Schema Enhancement

### Step 1: Create Migration Files

Create a new directory for database migrations:
```bash
mkdir web-console/database/migrations
```

### Step 2: Enhanced User Management Migration

Create file: `web-console/database/migrations/001_enhanced_user_management.sql`

```sql
-- Enhanced User Management Migration
-- File: 001_enhanced_user_management.sql

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
('QC', 'Quality Control', 'Quality assurance and control');

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
]');

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

-- Create RLS policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Users can view departments" ON departments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
            AND ur.is_active = true
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
            AND ur.is_active = true
        )
    );

-- Roles policies
CREATE POLICY "Users can view roles" ON roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
            AND ur.is_active = true
        )
    );

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
            AND ur.is_active = true
        )
    );
```

### Step 3: Run the Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the migration SQL
4. Execute the migration

## Week 3-4: RBAC System Implementation

### Step 1: Create RBAC Types

Create file: `web-console/lib/types/rbac.ts`

```typescript
// RBAC Type Definitions
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

// Permission checking utilities
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
  | '*'; // Wildcard for all modules

export type ActionType = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'admin'
  | '*'; // Wildcard for all actions

export interface PermissionCheck {
  module: ModuleName;
  action: ActionType;
  resource?: string;
}

// Predefined role codes
export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  VIEWER: 'VIEWER',
  // Business specific roles
  SALES_MANAGER: 'SALES_MANAGER',
  PURCHASE_MANAGER: 'PURCHASE_MANAGER',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  HR_MANAGER: 'HR_MANAGER'
} as const;

export type RoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES];

// Department codes
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
```

### Step 2: Create RBAC Service

Create file: `web-console/lib/services/rbac.ts`

```typescript
// RBAC Service
// File: web-console/lib/services/rbac.ts

import { createClient } from '../supabase';
import type {
  Permission,
  Role,
  Department,
  UserRole,
  EnhancedUser,
  PermissionCheck,
  ModuleName,
  ActionType
} from '../types/rbac';

export class RBACService {
  private supabase = createClient();

  // Permission checking
  async hasPermission(
    userId: string,
    check: PermissionCheck
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return this.checkPermission(userPermissions, check);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  private checkPermission(
    permissions: Permission[],
    check: PermissionCheck
  ): boolean {
    return permissions.some(permission => {
      // Check for wildcard module access
      if (permission.module === '*') {
        return this.checkActions(permission.actions, check.action);
      }

      // Check specific module
      if (permission.module === check.module) {
        return this.checkActions(permission.actions, check.action);
      }

      return false;
    });
  }

  private checkActions(allowedActions: string[], requiredAction: ActionType): boolean {
    // Check for wildcard action access
    if (allowedActions.includes('*')) {
      return true;
    }

    // Check specific action
    return allowedActions.includes(requiredAction);
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const { data: userRoles, error } = await this.supabase
      .from('user_roles')
      .select(`
        role:roles(
          permissions
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch user permissions: ${error.message}`);
    }

    const permissions: Permission[] = [];
    userRoles?.forEach(userRole => {
      if (userRole.role?.permissions) {
        permissions.push(...userRole.role.permissions);
      }
    });

    return permissions;
  }

  // Get enhanced user data
  async getEnhancedUser(userId: string): Promise<EnhancedUser | null> {
    const { data: user, error } = await this.supabase
      .from('profiles')
      .select(`
        *,
        department:departments(*),
        user_roles(
          *,
          role:roles(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching enhanced user:', error);
      return null;
    }

    if (!user) return null;

    const permissions = await this.getUserPermissions(userId);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department_id: user.department_id,
      employee_id: user.employee_id,
      permissions,
      is_active: user.is_active,
      last_login: user.last_login,
      department: user.department,
      user_roles: user.user_roles
    };
  }

  // Role management
  async createRole(roleData: Partial<Role>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .insert(roleData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }

    return data;
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }

    return data;
  }

  async deleteRole(roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('is_system_role', false); // Prevent deletion of system roles

    if (error) {
      throw new Error(`Failed to delete role: ${error.message}`);
    }
  }

  async getRoles(): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('role_name');

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    return data || [];
  }

  // User role assignment
  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign role: ${error.message}`);
    }

    return data;
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }

  // Department management
  async createDepartment(departmentData: Partial<Department>): Promise<Department> {
    const { data, error } = await this.supabase
      .from('departments')
      .insert(departmentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create department: ${error.message}`);
    }

    return data;
  }

  async getDepartments(): Promise<Department[]> {
    const { data, error } = await this.supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch departments: ${error.message}`);
    }

    return data || [];
  }

  // Audit logging
  async logAction(
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
    userId?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          table_name: tableName,
          record_id: recordId,
          action,
          old_values: oldValues,
          new_values: newValues,
          user_id: userId
        });
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking main operations
    }
  }
}

// Export singleton instance
export const rbacService = new RBACService();
```

### Step 3: Create Permission Hook

Create file: `web-console/hooks/usePermissions.ts`

```typescript
// Permission Hook
// File: web-console/hooks/usePermissions.ts

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rbacService } from '../lib/services/rbac';
import type { Permission, PermissionCheck } from '../lib/types/rbac';

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const userPermissions = await rbacService.getUserPermissions(user!.id);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (check: PermissionCheck): boolean => {
    if (!user || loading) return false;
    
    return permissions.some(permission => {
      // Check for wildcard module access
      if (permission.module === '*') {
        return permission.actions.includes('*') || permission.actions.includes(check.action);
      }

      // Check specific module
      if (permission.module === check.module) {
        return permission.actions.includes('*') || permission.actions.includes(check.action);
      }

      return false;
    });
  };

  const canAccess = (module: string, action: string = 'read'): boolean => {
    return hasPermission({ module: module as any, action: action as any });
  };

  const isAdmin = (): boolean => {
    return hasPermission({ module: '*', action: '*' });
  };

  const canManageUsers = (): boolean => {
    return hasPermission({ module: 'users', action: 'update' });
  };

  const canViewReports = (): boolean => {
    return hasPermission({ module: 'reports', action: 'read' });
  };

  return {
    permissions,
    loading,
    hasPermission,
    canAccess,
    isAdmin,
    canManageUsers,
    canViewReports,
    refresh: loadPermissions
  };
}
```

### Step 4: Create Permission Component

Create file: `web-console/components/common/PermissionGate.tsx`

```typescript
// Permission Gate Component
// File: web-console/components/common/PermissionGate.tsx

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { PermissionCheck } from '../../lib/types/rbac';
import { Alert, CircularProgress, Box } from '@mui/material';

interface PermissionGateProps {
  children: React.ReactNode;
  permission: PermissionCheck;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function PermissionGate({
  children,
  permission,
  fallback,
  showError = true
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert severity="warning">
          You don't have permission to access this feature.
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Convenience components for common permissions
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate
      permission={{ module: '*', action: '*' }}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function ManagerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate
      permission={{ module: 'reports', action: 'read' }}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}
```

## Week 5-6: Enhanced Authentication System

### Step 1: Update AuthContext

Update file: `web-console/contexts/AuthContext.tsx`

```typescript
// Enhanced AuthContext
// File: web-console/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';
import { rbacService } from '../lib/services/rbac';
import type { EnhancedUser, Department, Permission } from '../lib/types/rbac';

interface AuthContextType {
  user: EnhancedUser | null;
  supabaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        loadEnhancedUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await loadEnhancedUser(session.user.id);
        
        // Update last login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadEnhancedUser = async (userId: string) => {
    try {
      setLoading(true);
      const enhancedUser = await rbacService.getEnhancedUser(userId);
      setUser(enhancedUser);
    } catch (error) {
      console.error('Failed to load enhanced user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setSupabaseUser(null);
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      await loadEnhancedUser(supabaseUser.id);
    }
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## Week 7-8: API Layer Enhancement

### Step 1: Create Base API Class

Create file: `web-console/lib/api/base.ts`

```typescript
// Base API Class
// File: web-console/lib/api/base.ts

import { createClient } from '../supabase';
import { rbacService } from '../services/rbac';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error: string | null;
  success: boolean;
}

export class BaseAPI {
  protected supabase: SupabaseClient;
  protected tableName: string;

  constructor(tableName: string) {
    this.supabase = createClient();
    this.tableName = tableName;
  }

  // Create operation with audit logging
  async create<T extends Record<string, any>>(
    data: Partial<T>,
    userId?: string
  ): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert({
          ...data,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Log audit trail
      if (result && userId) {
        await rbacService.logAction(
          this.tableName,
          result.id,
          'INSERT',
          null,
          result,
          userId
        );
      }

      return { data: result, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Read operation with pagination
  async findMany<T>(
    filters?: Record<string, any>,
    pagination?: PaginationParams,
    select?: string
  ): Promise<PaginatedResponse<T>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from(this.tableName)
        .select(select || '*', { count: 'exact' });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply sorting
      if (pagination?.sortBy) {
        query = query.order(pagination.sortBy, {
          ascending: pagination.sortOrder === 'asc'
        });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          error: error.message,
          success: false
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data || [],
        pagination: { page, limit, total, totalPages },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Read single record
  async findById<T>(id: string, select?: string): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(select || '*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Update operation with audit logging
  async update<T extends Record<string, any>>(
    id: string,
    updates: Partial<T>,
    userId?: string
  ): Promise<ApiResponse<T>> {
    try {
      // Get old values for audit
      const { data: oldData } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Log audit trail
      if (data && userId) {
        await rbacService.logAction(
          this.tableName,
          id,
          'UPDATE',
          oldData,
          data,
          userId
        );
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Soft delete operation
  async softDelete(id: string, userId?: string): Promise<ApiResponse<boolean>> {
    try {
      // Get old values for audit
      const { data: oldData } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          is_active: false,
          deleted_by: userId,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Log audit trail
      if (userId) {
        await rbacService.logAction(
          this.tableName,
          id,
          'DELETE',
          oldData,
          { is_active: false },
          userId
        );
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Hard delete operation (use with caution)
  async hardDelete(id: string, userId?: string): Promise<ApiResponse<boolean>> {
    try {
      // Get old values for audit
      const { data: oldData } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Log audit trail
      if (userId) {
        await rbacService.logAction(
          this.tableName,
          id,
          'DELETE',
          oldData,
          null,
          userId
        );
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Bulk operations
  async bulkCreate<T extends Record<string, any>>(
    items: Partial<T>[],
    userId?: string
  ): Promise<ApiResponse<T[]>> {
    try {
      const timestamp = new Date().toISOString();
      const itemsWithMetadata = items.map(item => ({
        ...item,
        created_by: userId,
        created_at: timestamp,
        updated_at: timestamp
      }));

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(itemsWithMetadata)
        .select();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  // Search operation
  async search<T>(
    searchTerm: string,
    searchFields: string[],
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Build search conditions
      if (searchTerm && searchFields.length > 0) {
        const searchConditions = searchFields
          .map(field => `${field}.ilike.%${searchTerm}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      // Apply sorting
      if (pagination?.sortBy) {
        query = query.order(pagination.sortBy, {
          ascending: pagination.sortOrder === 'asc'
        });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          error: error.message,
          success: false
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data || [],
        pagination: { page, limit, total, totalPages },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }
}
```

## Next Steps

After completing Week 1-8, you will have:

1. ✅ Enhanced database schema with departments, roles, and audit logging
2. ✅ Complete RBAC system with permission checking
3. ✅ Enhanced authentication with user roles and departments
4. ✅ Standardized API layer with audit trails
5. ✅ Permission-based UI components

### To Continue Implementation:

1. **Test the Foundation**: Create test users with different roles
2. **Update Existing Pages**: Add permission checks to current pages
3. **Create Admin Interface**: Build role and department management pages
4. **Move to Phase 2**: Start implementing Supply Chain Management

### Testing Your Implementation:

```bash
# Run the development server
npm run dev

# Test the new authentication flow
# Test role-based access control
# Verify audit logging is working
```

This foundation will support all future ERP modules and ensure proper security, auditing, and user management throughout your system.