import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

const supabase = createClientComponentClient<Database>()

export interface AssetFilters {
  limit?: number
  offset?: number
  status?: string
  category?: string
  location?: string
  dateRange?: string
}

export interface DashboardData {
  totalAssets: number
  assetValue: number
  maintenanceDue: number
  utilizationRate: number
  assetGrowth: number
  valueGrowth: number
  maintenanceEfficiency: number
  utilizationTrend: number
}

export interface Asset {
  id: string
  assetId: string
  name: string
  description: string
  category: string
  type: string
  status: string
  condition: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  depreciationRate: number
  location: string
  assignedTo?: string
  serialNumber?: string
  manufacturer?: string
  model?: string
  warrantyExpiry?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  createdAt: string
  updatedAt: string
}

export interface Maintenance {
  id: string
  assetId: string
  assetName: string
  type: string
  description: string
  status: string
  priority: string
  scheduledDate: string
  completedDate?: string
  cost: number
  technician: string
  notes?: string
  partsUsed?: MaintenancePart[]
  createdAt: string
  updatedAt: string
}

export interface MaintenancePart {
  id: string
  name: string
  quantity: number
  cost: number
}

export interface Depreciation {
  id: string
  assetId: string
  assetName: string
  method: string
  rate: number
  period: string
  originalValue: number
  currentValue: number
  accumulatedDepreciation: number
  remainingValue: number
  calculatedDate: string
  createdAt: string
  updatedAt: string
}

export interface Transfer {
  id: string
  assetId: string
  assetName: string
  fromLocation: string
  toLocation: string
  fromUser?: string
  toUser?: string
  reason: string
  status: string
  requestedBy: string
  approvedBy?: string
  transferDate: string
  completedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  name: string
  description: string
  type: string
  address: string
  capacity: number
  currentAssets: number
  manager: string
  status: string
  createdAt: string
  updatedAt: string
}

export class AssetApi {
  static async getDashboardData(): Promise<DashboardData> {
    try {
      // Mock data for now - replace with actual Supabase queries
      return {
        totalAssets: 1247,
        assetValue: 2850000,
        maintenanceDue: 23,
        utilizationRate: 87.5,
        assetGrowth: 8.2,
        valueGrowth: 12.5,
        maintenanceEfficiency: 94.2,
        utilizationTrend: 5.8
      }
    } catch (error) {
      console.error('Error fetching asset dashboard data:', error)
      throw error
    }
  }

  static async getAssets(filters: AssetFilters = {}): Promise<{ data: Asset[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockAssets: Asset[] = [
        {
          id: '1',
          assetId: 'AST001',
          name: 'Dell Laptop OptiPlex 7090',
          description: 'High-performance business laptop',
          category: 'IT Equipment',
          type: 'Computer',
          status: 'active',
          condition: 'excellent',
          purchaseDate: '2023-01-15',
          purchasePrice: 1200,
          currentValue: 950,
          depreciationRate: 20,
          location: 'Office Floor 1',
          assignedTo: 'John Smith',
          serialNumber: 'DL123456789',
          manufacturer: 'Dell',
          model: 'OptiPlex 7090',
          warrantyExpiry: '2026-01-15',
          lastMaintenanceDate: '2024-01-10',
          nextMaintenanceDate: '2024-07-10',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          assetId: 'AST002',
          name: 'Toyota Forklift 8FGU25',
          description: 'Industrial forklift for warehouse operations',
          category: 'Machinery',
          type: 'Forklift',
          status: 'active',
          condition: 'good',
          purchaseDate: '2022-06-20',
          purchasePrice: 35000,
          currentValue: 28000,
          depreciationRate: 10,
          location: 'Warehouse A',
          assignedTo: 'Warehouse Team',
          serialNumber: 'TY987654321',
          manufacturer: 'Toyota',
          model: '8FGU25',
          warrantyExpiry: '2025-06-20',
          lastMaintenanceDate: '2024-01-05',
          nextMaintenanceDate: '2024-04-05',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          assetId: 'AST003',
          name: 'Conference Room Projector',
          description: 'HD projector for presentations',
          category: 'Office Equipment',
          type: 'Projector',
          status: 'maintenance',
          condition: 'fair',
          purchaseDate: '2021-03-10',
          purchasePrice: 800,
          currentValue: 400,
          depreciationRate: 25,
          location: 'Conference Room B',
          serialNumber: 'PJ456789123',
          manufacturer: 'Epson',
          model: 'PowerLite 1795F',
          warrantyExpiry: '2024-03-10',
          lastMaintenanceDate: '2024-01-20',
          nextMaintenanceDate: '2024-02-15',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockAssets.slice(0, filters.limit || 10),
        count: mockAssets.length
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      throw error
    }
  }

  static async getMaintenance(filters: AssetFilters = {}): Promise<{ data: Maintenance[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockMaintenance: Maintenance[] = [
        {
          id: '1',
          assetId: 'AST001',
          assetName: 'Dell Laptop OptiPlex 7090',
          type: 'preventive',
          description: 'Regular system cleanup and updates',
          status: 'completed',
          priority: 'medium',
          scheduledDate: '2024-01-10',
          completedDate: '2024-01-10',
          cost: 50,
          technician: 'IT Support Team',
          notes: 'System cleaned, updates installed',
          partsUsed: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          assetId: 'AST002',
          assetName: 'Toyota Forklift 8FGU25',
          type: 'preventive',
          description: 'Hydraulic system inspection and oil change',
          status: 'scheduled',
          priority: 'high',
          scheduledDate: '2024-04-05',
          cost: 350,
          technician: 'Maintenance Team',
          partsUsed: [
            { id: '1', name: 'Hydraulic Oil', quantity: 5, cost: 150 },
            { id: '2', name: 'Oil Filter', quantity: 1, cost: 25 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          assetId: 'AST003',
          assetName: 'Conference Room Projector',
          type: 'corrective',
          description: 'Replace burnt-out lamp',
          status: 'in_progress',
          priority: 'medium',
          scheduledDate: '2024-02-15',
          cost: 120,
          technician: 'AV Support',
          partsUsed: [
            { id: '3', name: 'Projector Lamp', quantity: 1, cost: 100 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockMaintenance.slice(0, filters.limit || 10),
        count: mockMaintenance.length
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error)
      throw error
    }
  }

  static async getDepreciation(filters: AssetFilters = {}): Promise<{ data: Depreciation[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockDepreciation: Depreciation[] = [
        {
          id: '1',
          assetId: 'AST001',
          assetName: 'Dell Laptop OptiPlex 7090',
          method: 'straight_line',
          rate: 20,
          period: 'annual',
          originalValue: 1200,
          currentValue: 950,
          accumulatedDepreciation: 250,
          remainingValue: 950,
          calculatedDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          assetId: 'AST002',
          assetName: 'Toyota Forklift 8FGU25',
          method: 'declining_balance',
          rate: 10,
          period: 'annual',
          originalValue: 35000,
          currentValue: 28000,
          accumulatedDepreciation: 7000,
          remainingValue: 28000,
          calculatedDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          assetId: 'AST003',
          assetName: 'Conference Room Projector',
          method: 'straight_line',
          rate: 25,
          period: 'annual',
          originalValue: 800,
          currentValue: 400,
          accumulatedDepreciation: 400,
          remainingValue: 400,
          calculatedDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockDepreciation.slice(0, filters.limit || 10),
        count: mockDepreciation.length
      }
    } catch (error) {
      console.error('Error fetching depreciation records:', error)
      throw error
    }
  }

  static async getTransfers(filters: AssetFilters = {}): Promise<{ data: Transfer[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockTransfers: Transfer[] = [
        {
          id: '1',
          assetId: 'AST001',
          assetName: 'Dell Laptop OptiPlex 7090',
          fromLocation: 'Office Floor 2',
          toLocation: 'Office Floor 1',
          fromUser: 'Jane Doe',
          toUser: 'John Smith',
          reason: 'Employee transfer',
          status: 'completed',
          requestedBy: 'HR Manager',
          approvedBy: 'IT Manager',
          transferDate: '2024-01-15',
          completedDate: '2024-01-15',
          notes: 'Asset transferred due to employee relocation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          assetId: 'AST002',
          assetName: 'Toyota Forklift 8FGU25',
          fromLocation: 'Warehouse B',
          toLocation: 'Warehouse A',
          reason: 'Operational requirements',
          status: 'pending',
          requestedBy: 'Warehouse Manager',
          transferDate: '2024-02-01',
          notes: 'Transfer requested for increased efficiency',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          assetId: 'AST003',
          assetName: 'Conference Room Projector',
          fromLocation: 'Conference Room A',
          toLocation: 'Conference Room B',
          reason: 'Room renovation',
          status: 'approved',
          requestedBy: 'Facilities Manager',
          approvedBy: 'Operations Manager',
          transferDate: '2024-01-25',
          notes: 'Temporary transfer during room renovation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockTransfers.slice(0, filters.limit || 10),
        count: mockTransfers.length
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
      throw error
    }
  }

  static async getLocations(filters: AssetFilters = {}): Promise<{ data: Location[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockLocations: Location[] = [
        {
          id: '1',
          name: 'Office Floor 1',
          description: 'Main office floor with workstations',
          type: 'office',
          address: '123 Business St, Floor 1',
          capacity: 50,
          currentAssets: 42,
          manager: 'Office Manager',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Warehouse A',
          description: 'Primary storage and distribution warehouse',
          type: 'warehouse',
          address: '456 Industrial Ave, Building A',
          capacity: 200,
          currentAssets: 156,
          manager: 'Warehouse Manager',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Conference Room B',
          description: 'Large conference room for meetings',
          type: 'meeting_room',
          address: '123 Business St, Conference Room B',
          capacity: 15,
          currentAssets: 8,
          manager: 'Facilities Manager',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockLocations.slice(0, filters.limit || 10),
        count: mockLocations.length
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      throw error
    }
  }

  static async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newAsset: Asset = {
        id: Date.now().toString(),
        assetId: `AST${String(Date.now()).slice(-3)}`,
        name: assetData.name || '',
        description: assetData.description || '',
        category: assetData.category || '',
        type: assetData.type || '',
        status: 'active',
        condition: assetData.condition || 'good',
        purchaseDate: assetData.purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: assetData.purchasePrice || 0,
        currentValue: assetData.currentValue || assetData.purchasePrice || 0,
        depreciationRate: assetData.depreciationRate || 10,
        location: assetData.location || '',
        assignedTo: assetData.assignedTo,
        serialNumber: assetData.serialNumber,
        manufacturer: assetData.manufacturer,
        model: assetData.model,
        warrantyExpiry: assetData.warrantyExpiry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newAsset
    } catch (error) {
      console.error('Error creating asset:', error)
      throw error
    }
  }

  static async scheduleMaintenance(maintenanceData: Partial<Maintenance>): Promise<Maintenance> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newMaintenance: Maintenance = {
        id: Date.now().toString(),
        assetId: maintenanceData.assetId || '',
        assetName: maintenanceData.assetName || '',
        type: maintenanceData.type || 'preventive',
        description: maintenanceData.description || '',
        status: 'scheduled',
        priority: maintenanceData.priority || 'medium',
        scheduledDate: maintenanceData.scheduledDate || new Date().toISOString().split('T')[0],
        cost: maintenanceData.cost || 0,
        technician: maintenanceData.technician || '',
        notes: maintenanceData.notes,
        partsUsed: maintenanceData.partsUsed || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newMaintenance
    } catch (error) {
      console.error('Error scheduling maintenance:', error)
      throw error
    }
  }

  static async transferAsset(transferData: Partial<Transfer>): Promise<Transfer> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newTransfer: Transfer = {
        id: Date.now().toString(),
        assetId: transferData.assetId || '',
        assetName: transferData.assetName || '',
        fromLocation: transferData.fromLocation || '',
        toLocation: transferData.toLocation || '',
        fromUser: transferData.fromUser,
        toUser: transferData.toUser,
        reason: transferData.reason || '',
        status: 'pending',
        requestedBy: 'Current User',
        transferDate: transferData.transferDate || new Date().toISOString().split('T')[0],
        notes: transferData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newTransfer
    } catch (error) {
      console.error('Error transferring asset:', error)
      throw error
    }
  }

  static async getAssetTransfers(filters: AssetFilters = {}): Promise<{ data: Transfer[], count: number }> {
    return this.getTransfers(filters)
  }

  static async createLocation(locationData: Partial<Location>): Promise<Location> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newLocation: Location = {
        id: Date.now().toString(),
        name: locationData.name || '',
        description: locationData.description || '',
        type: locationData.type || 'office',
        address: locationData.address || '',
        capacity: locationData.capacity || 0,
        currentAssets: 0,
        manager: locationData.manager || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newLocation
    } catch (error) {
      console.error('Error creating location:', error)
      throw error
    }
  }
}