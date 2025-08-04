// Mock Project Management API - Replace with actual Supabase implementation when database schema is ready

// Interfaces for Project Management operations
export interface CreateProjectData {
  name: string;
  description?: string;
  project_manager_id: string;
  client_id?: string;
  start_date: string;
  end_date: string;
  budget?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_type: 'internal' | 'client' | 'research' | 'maintenance';
  team_members?: string[];
}

export interface CreateTaskData {
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_hours?: number;
  start_date?: string;
  due_date?: string;
  parent_task_id?: string;
  dependencies?: string[];
  tags?: string[];
}

export interface CreateMilestoneData {
  project_id: string;
  name: string;
  description?: string;
  due_date: string;
  deliverables?: string[];
}

export interface CreateTimeEntryData {
  project_id: string;
  task_id?: string;
  employee_id: string;
  start_time: string;
  end_time?: string;
  hours_worked?: number;
  description?: string;
  billable: boolean;
  hourly_rate?: number;
}

export interface ProjectFilters {
  status?: string;
  priority?: string;
  project_manager_id?: string;
  client_id?: string;
  project_type?: string;
  start_date_from?: string;
  start_date_to?: string;
  search?: string;
}

export interface TaskFilters {
  project_id?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  project_manager_id: string;
  client_id?: string;
  start_date: string;
  end_date: string;
  budget?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_type: 'internal' | 'client' | 'research' | 'maintenance';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAnalytics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_hours_logged: number;
  billable_hours: number;
  project_completion_rate: number;
  average_project_duration: number;
  top_performers: Array<{
    employee_id: string;
    employee_name: string;
    completed_tasks: number;
    hours_logged: number;
    efficiency_score: number;
  }>;
  project_status_distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  monthly_progress: Array<{
    month: string;
    projects_completed: number;
    tasks_completed: number;
    hours_logged: number;
  }>;
}

export class ProjectManagementApi {
  // Mock data for demonstration
  private static mockProjects: Project[] = [
    {
      id: '1',
      name: 'ERP System Implementation',
      description: 'Complete ERP system implementation for manufacturing division',
      project_manager_id: 'pm1',
      client_id: 'client1',
      start_date: '2024-01-01',
      end_date: '2024-06-30',
      budget: 500000,
      priority: 'high',
      project_type: 'internal',
      status: 'active',
      progress_percentage: 65,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'Mobile App Development',
      description: 'Customer-facing mobile application',
      project_manager_id: 'pm2',
      client_id: 'client2',
      start_date: '2024-02-01',
      end_date: '2024-08-31',
      budget: 300000,
      priority: 'medium',
      project_type: 'client',
      status: 'active',
      progress_percentage: 40,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-15T00:00:00Z'
    }
  ];

  private static mockTasks: Task[] = [
    {
      id: '1',
      project_id: '1',
      title: 'Database Schema Design',
      description: 'Design and implement database schema',
      assigned_to: 'dev1',
      priority: 'high',
      status: 'completed',
      estimated_hours: 40,
      actual_hours: 35,
      start_date: '2024-01-01',
      due_date: '2024-01-15',
      completed_date: '2024-01-14',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-14T00:00:00Z'
    },
    {
      id: '2',
      project_id: '1',
      title: 'API Development',
      description: 'Develop REST APIs for ERP modules',
      assigned_to: 'dev2',
      priority: 'high',
      status: 'in_progress',
      estimated_hours: 80,
      actual_hours: 45,
      start_date: '2024-01-15',
      due_date: '2024-02-15',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-30T00:00:00Z'
    }
  ];

  // Projects
  static async getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    try {
      let filteredProjects = [...this.mockProjects];

      if (filters.status) {
        filteredProjects = filteredProjects.filter(p => p.status === filters.status);
      }
      if (filters.priority) {
        filteredProjects = filteredProjects.filter(p => p.priority === filters.priority);
      }
      if (filters.project_type) {
        filteredProjects = filteredProjects.filter(p => p.project_type === filters.project_type);
      }
      if (filters.search) {
        filteredProjects = filteredProjects.filter(p => 
          p.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(filters.search!.toLowerCase()))
        );
      }

      return filteredProjects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  static async getProject(id: string): Promise<Project | null> {
    try {
      return this.mockProjects.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  static async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const newProject: Project = {
        id: Date.now().toString(),
        ...projectData,
        status: 'planning',
        progress_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.mockProjects.push(newProject);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async updateProject(id: string, projectData: Partial<CreateProjectData>): Promise<Project> {
    try {
      const projectIndex = this.mockProjects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      this.mockProjects[projectIndex] = {
        ...this.mockProjects[projectIndex],
        ...projectData,
        updated_at: new Date().toISOString()
      };

      return this.mockProjects[projectIndex];
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Tasks
  static async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    try {
      let filteredTasks = [...this.mockTasks];

      if (filters.project_id) {
        filteredTasks = filteredTasks.filter(t => t.project_id === filters.project_id);
      }
      if (filters.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filters.priority);
      }
      if (filters.assigned_to) {
        filteredTasks = filteredTasks.filter(t => t.assigned_to === filters.assigned_to);
      }
      if (filters.search) {
        filteredTasks = filteredTasks.filter(t => 
          t.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(filters.search!.toLowerCase()))
        );
      }

      return filteredTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  static async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData,
        status: 'todo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.mockTasks.push(newTask);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Analytics
  static async getProjectAnalytics(): Promise<ProjectAnalytics> {
    try {
      const totalProjects = this.mockProjects.length;
      const activeProjects = this.mockProjects.filter(p => p.status === 'active').length;
      const completedProjects = this.mockProjects.filter(p => p.status === 'completed').length;
      const overdueProjects = this.mockProjects.filter(p => 
        p.status === 'active' && new Date(p.end_date) < new Date()
      ).length;

      const totalTasks = this.mockTasks.length;
      const completedTasks = this.mockTasks.filter(t => t.status === 'completed').length;
      const overdueTasks = this.mockTasks.filter(t => 
        t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()
      ).length;

      const totalHoursLogged = this.mockTasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
      const billableHours = totalHoursLogged * 0.8; // Assume 80% billable

      const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
      const averageProjectDuration = 120; // Mock average in days

      return {
        total_projects: totalProjects,
        active_projects: activeProjects,
        completed_projects: completedProjects,
        overdue_projects: overdueProjects,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        total_hours_logged: totalHoursLogged,
        billable_hours: billableHours,
        project_completion_rate: projectCompletionRate,
        average_project_duration: averageProjectDuration,
        top_performers: [
          {
            employee_id: 'emp1',
            employee_name: 'John Doe',
            completed_tasks: 15,
            hours_logged: 120,
            efficiency_score: 95
          },
          {
            employee_id: 'emp2',
            employee_name: 'Jane Smith',
            completed_tasks: 12,
            hours_logged: 100,
            efficiency_score: 92
          }
        ],
        project_status_distribution: [
          { status: 'active', count: activeProjects, percentage: (activeProjects / totalProjects) * 100 },
          { status: 'completed', count: completedProjects, percentage: (completedProjects / totalProjects) * 100 },
          { status: 'planning', count: 1, percentage: (1 / totalProjects) * 100 }
        ],
        monthly_progress: [
          { month: 'Jan', projects_completed: 2, tasks_completed: 8, hours_logged: 160 },
          { month: 'Feb', projects_completed: 1, tasks_completed: 12, hours_logged: 200 },
          { month: 'Mar', projects_completed: 3, tasks_completed: 15, hours_logged: 240 }
        ]
      };
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw error;
    }
  }

  // Additional utility methods
  static async getProjectProgress(projectId: string): Promise<{ taskProgress: number; milestoneProgress: number; overallProgress: number }> {
    try {
      const projectTasks = this.mockTasks.filter(t => t.project_id === projectId);
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const taskProgress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

      // Mock milestone progress
      const milestoneProgress = 70;
      const overallProgress = (taskProgress + milestoneProgress) / 2;

      return {
        taskProgress,
        milestoneProgress,
        overallProgress
      };
    } catch (error) {
      console.error('Error calculating project progress:', error);
      throw error;
    }
  }

  static async getUpcomingDeadlines(days: number = 7): Promise<Task[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      return this.mockTasks.filter(task => 
        task.due_date && 
        task.status !== 'completed' && 
        new Date(task.due_date) <= cutoffDate
      );
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      throw error;
    }
  }
}