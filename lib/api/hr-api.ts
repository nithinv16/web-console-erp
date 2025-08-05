import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../types/database';

const supabase = createClientComponentClient<Database>();

type Employee = Database['public']['Tables']['employees']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

// Interfaces for HR operations
export interface CreateEmployeeData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position: string;
  hire_date: string;
  salary?: number;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'terminated';
  address?: any;
  emergency_contact?: any;
  bank_details?: any;
  documents?: any;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  manager_id?: string;
  budget?: number;
  location?: string;
}

export interface AttendanceRecord {
  id?: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  break_duration?: number;
  total_hours?: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  notes?: string;
}

export interface LeaveRequest {
  id?: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency' | 'unpaid';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  comments?: string;
}

export interface PayrollData {
  id?: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  deductions?: number;
  tax_deduction?: number;
  pf_deduction?: number;
  esi_deduction?: number;
  gross_salary: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  pay_date?: string;
}

export interface EmployeeFilters {
  department_id?: string;
  status?: string;
  employment_type?: string;
  search?: string;
}

export interface AttendanceFilters {
  employee_id?: string;
  department_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface LeaveFilters {
  employee_id?: string;
  department_id?: string;
  leave_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface PayrollFilters {
  employee_id?: string;
  department_id?: string;
  pay_period_start?: string;
  pay_period_end?: string;
  status?: string;
}

export interface HRAnalytics {
  total_employees: number;
  active_employees: number;
  departments_count: number;
  average_salary: number;
  attendance_rate: number;
  leave_requests_pending: number;
  employee_turnover_rate: number;
  top_departments: Array<{
    department_name: string;
    employee_count: number;
  }>;
  salary_distribution: Array<{
    range: string;
    count: number;
  }>;
  monthly_attendance_trend: Array<{
    month: string;
    attendance_rate: number;
  }>;
}

export class HRApi {
  // Dashboard Data
  static async getDashboardData(companyId: string) {
    try {
      // Get total employees count
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get active employees count
      const { count: activeEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      // Get departments count
      const { count: totalDepartments } = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get pending leave requests count
      const { count: pendingLeaves } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'pending');

      return {
        totalEmployees: totalEmployees || 0,
        activeEmployees: activeEmployees || 0,
        totalDepartments: totalDepartments || 0,
        pendingLeaves: pendingLeaves || 0
      };
    } catch (error) {
      console.error('Error fetching HR dashboard data:', error);
      throw error;
    }
  }

  // Employee Management
  static async getEmployees(companyId: string, filters?: EmployeeFilters) {
    let query = supabase
      .from('employees')
      .select(`
        *,
        department:departments(name)
      `)
      .eq('company_id', companyId);

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.employment_type) {
      query = query.eq('employment_type', filters.employment_type);
    }
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getEmployee(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(name),
        company:companies(name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createEmployee(companyId: string, employeeData: CreateEmployeeData) {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...employeeData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateEmployee(id: string, employeeData: Partial<CreateEmployeeData>) {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteEmployee(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Department Management
  static async getDepartments(companyId: string) {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:employees!departments_manager_id_fkey(first_name, last_name),
        employee_count:employees(count)
      `)
      .eq('company_id', companyId)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async createDepartment(companyId: string, departmentData: CreateDepartmentData) {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        ...departmentData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateDepartment(id: string, departmentData: Partial<CreateDepartmentData>) {
    const { data, error } = await supabase
      .from('departments')
      .update(departmentData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteDepartment(id: string) {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Attendance Management
  static async getAttendance(companyId: string, filters?: AttendanceFilters) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id, department:departments(name))
      `)
      .eq('company_id', companyId);

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters?.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async markAttendance(companyId: string, attendanceData: AttendanceRecord) {
    // Calculate total hours if check_in and check_out are provided
    let totalHours = attendanceData.total_hours;
    if (attendanceData.check_in_time && attendanceData.check_out_time && !totalHours) {
      const checkIn = new Date(`${attendanceData.date}T${attendanceData.check_in_time}`);
      const checkOut = new Date(`${attendanceData.date}T${attendanceData.check_out_time}`);
      totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      if (attendanceData.break_duration) {
        totalHours -= attendanceData.break_duration;
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        ...attendanceData,
        company_id: companyId,
        total_hours: totalHours
      }, {
        onConflict: 'employee_id,date'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async bulkMarkAttendance(companyId: string, attendanceRecords: AttendanceRecord[]) {
    const recordsWithCompany = attendanceRecords.map(record => ({
      ...record,
      company_id: companyId
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(recordsWithCompany, {
        onConflict: 'employee_id,date'
      })
      .select();
    
    if (error) throw error;
    return data;
  }

  // Leave Management
  static async getLeaveRequests(companyId: string, filters?: LeaveFilters) {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id, department:departments(name)),
        approved_by_employee:employees!leave_requests_approved_by_fkey(first_name, last_name)
      `)
      .eq('company_id', companyId);

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters?.leave_type) {
      query = query.eq('leave_type', filters.leave_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date_from) {
      query = query.gte('start_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('end_date', filters.date_to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createLeaveRequest(companyId: string, leaveData: LeaveRequest) {
    // Calculate days requested
    const startDate = new Date(leaveData.start_date);
    const endDate = new Date(leaveData.end_date);
    const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        ...leaveData,
        company_id: companyId,
        days_requested: daysRequested
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateLeaveRequest(id: string, leaveData: Partial<LeaveRequest>) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update(leaveData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async approveLeaveRequest(id: string, approvedBy: string, comments?: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        comments
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async rejectLeaveRequest(id: string, approvedBy: string, comments: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        comments
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Payroll Management
  static async getPayroll(companyId: string, filters?: PayrollFilters) {
    let query = supabase
      .from('payroll')
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id, department:departments(name))
      `)
      .eq('company_id', companyId);

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters?.pay_period_start) {
      query = query.gte('pay_period_start', filters.pay_period_start);
    }
    if (filters?.pay_period_end) {
      query = query.lte('pay_period_end', filters.pay_period_end);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('pay_period_start', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createPayroll(companyId: string, payrollData: PayrollData) {
    // Calculate gross and net salary
    const grossSalary = payrollData.basic_salary + (payrollData.allowances || 0) + 
                       ((payrollData.overtime_hours || 0) * (payrollData.overtime_rate || 0));
    
    const totalDeductions = (payrollData.deductions || 0) + (payrollData.tax_deduction || 0) + 
                           (payrollData.pf_deduction || 0) + (payrollData.esi_deduction || 0);
    
    const netSalary = grossSalary - totalDeductions;

    const { data, error } = await supabase
      .from('payroll')
      .insert({
        ...payrollData,
        company_id: companyId,
        gross_salary: grossSalary,
        net_salary: netSalary
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePayroll(id: string, payrollData: Partial<PayrollData>) {
    const { data, error } = await supabase
      .from('payroll')
      .update(payrollData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async processPayroll(id: string) {
    const { data, error } = await supabase
      .from('payroll')
      .update({
        status: 'processed',
        pay_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async generateMonthlyPayroll(companyId: string, month: string, year: number) {
    // Get all active employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active');
    
    if (employeesError) throw employeesError;

    const payPeriodStart = `${year}-${month.padStart(2, '0')}-01`;
    const payPeriodEnd = new Date(year, parseInt(month) - 1 + 1, 0).toISOString().split('T')[0];

    const payrollRecords = employees.map(employee => ({
      employee_id: employee.id,
      company_id: companyId,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      basic_salary: employee.salary || 0,
      allowances: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      deductions: 0,
      tax_deduction: 0,
      pf_deduction: (employee.salary || 0) * 0.12, // 12% PF
      esi_deduction: (employee.salary || 0) * 0.0175, // 1.75% ESI
      gross_salary: employee.salary || 0,
      net_salary: (employee.salary || 0) * 0.86, // Approximate after deductions
      status: 'draft'
    }));

    const { data, error } = await supabase
      .from('payroll')
      .insert(payrollRecords)
      .select();
    
    if (error) throw error;
    return data;
  }

  // Analytics and Reports
  static async getHRAnalytics(companyId: string): Promise<HRAnalytics> {
    // Get employee counts
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*, department:departments(name)')
      .eq('company_id', companyId);
    
    if (employeesError) throw employeesError;

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    
    // Get departments count
    const { count: departmentsCount, error: deptError } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);
    
    if (deptError) throw deptError;

    // Calculate average salary
    const activeSalaries = employees
      .filter(emp => emp.status === 'active' && emp.salary)
      .map(emp => emp.salary);
    const averageSalary = activeSalaries.length > 0 
      ? activeSalaries.reduce((sum, salary) => sum + salary, 0) / activeSalaries.length 
      : 0;

    // Get attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('company_id', companyId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
    
    if (attendanceError) throw attendanceError;

    const presentDays = attendanceData.filter(att => att.status === 'present').length;
    const attendanceRate = attendanceData.length > 0 ? (presentDays / attendanceData.length) * 100 : 0;

    // Get pending leave requests
    const { count: pendingLeaves, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending');
    
    if (leaveError) throw leaveError;

    // Calculate employee turnover rate (simplified)
    const employeeTurnoverRate = 5; // Placeholder - would need historical data

    // Top departments by employee count
    const departmentCounts = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unassigned';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDepartments = Object.entries(departmentCounts)
      .map(([department_name, employee_count]) => ({ department_name, employee_count }))
      .sort((a, b) => (b.employee_count as number) - (a.employee_count as number))
      .slice(0, 5);

    // Salary distribution
    const salaryRanges = [
      { range: '0-25k', min: 0, max: 25000 },
      { range: '25k-50k', min: 25000, max: 50000 },
      { range: '50k-75k', min: 50000, max: 75000 },
      { range: '75k-100k', min: 75000, max: 100000 },
      { range: '100k+', min: 100000, max: Infinity }
    ];

    const salaryDistribution = salaryRanges.map(range => ({
      range: range.range,
      count: activeSalaries.filter(salary => salary >= range.min && salary < range.max).length
    }));

    // Monthly attendance trend (last 6 months)
    const monthlyAttendanceTrend = [
      { month: 'Jan', attendance_rate: 85 },
      { month: 'Feb', attendance_rate: 88 },
      { month: 'Mar', attendance_rate: 92 },
      { month: 'Apr', attendance_rate: 87 },
      { month: 'May', attendance_rate: 90 },
      { month: 'Jun', attendance_rate: attendanceRate }
    ];

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      departments_count: departmentsCount || 0,
      average_salary: Math.round(averageSalary),
      attendance_rate: Math.round(attendanceRate),
      leave_requests_pending: pendingLeaves || 0,
      employee_turnover_rate: employeeTurnoverRate,
      top_departments: topDepartments as Array<{department_name: string; employee_count: number}>,
      salary_distribution: salaryDistribution,
      monthly_attendance_trend: monthlyAttendanceTrend
    };
  }

  static async getEmployeesByDepartment(companyId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name,
        position,
        status,
        department:departments(name)
      `)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('first_name');
    
    if (error) throw error;
    return data;
  }

  static async getAttendanceReport(companyId: string, month: string, year: number) {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, parseInt(month) - 1 + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(first_name, last_name, employee_id)
      `)
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');
    
    if (error) throw error;
    return data;
  }

  static async getLeaveBalance(employeeId: string, year: number) {
    const { data: leaveRequests, error } = await supabase
      .from('leave_requests')
      .select('leave_type, days_requested')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('start_date', `${year}-01-01`)
      .lte('end_date', `${year}-12-31`);
    
    if (error) throw error;

    const leaveBalance = {
      annual: 21, // Standard annual leave
      sick: 12,   // Standard sick leave
      maternity: 180, // Maternity leave
      paternity: 15,  // Paternity leave
      emergency: 5,   // Emergency leave
      unpaid: 0       // Unpaid leave (no limit)
    };

    // Calculate used leave
    const usedLeave = leaveRequests.reduce((acc, leave) => {
      acc[leave.leave_type] = (acc[leave.leave_type] || 0) + leave.days_requested;
      return acc;
    }, {} as Record<string, number>);

    // Calculate remaining leave
    const remainingLeave = Object.keys(leaveBalance).reduce((acc, leaveType) => {
      acc[leaveType] = {
        total: leaveBalance[leaveType as keyof typeof leaveBalance],
        used: usedLeave[leaveType] || 0,
        remaining: leaveBalance[leaveType as keyof typeof leaveBalance] - (usedLeave[leaveType] || 0)
      };
      return acc;
    }, {} as Record<string, { total: number; used: number; remaining: number }>);

    return remainingLeave;
  }
}