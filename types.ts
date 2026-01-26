
export type Vehicle = {
  id: string;
  reg_number: string;
  current_odometer: number;
  model?: string;
};

export type Driver = {
  id: string;
  name: string;
  type: 'Permanent' | 'Temporary';
  phone?: string;
};

export type Material = {
  id: string;
  name: string;
};

export type Collaborator = {
  id: string;
  name: string;
  company_name?: string;
};

export type Trip = {
  id: string;
  vehicle_id: string;
  driver_id: string;
  site_name: string;
  material_type: string;
  quantity: number;
  unit: 'Tons' | 'CFT' | 'trips';
  rate: number;
  image_url?: string;
  created_at: string;
  contract_type: 'general' | 'collaboration';
  collaborator_id?: string;
};

export type FuelLog = {
  id: string;
  vehicle_id: string;
  liters: number;
  cost: number;
  odometer: number;
  calculated_mileage: number;
  station_name: string;
  created_at: string;
};

export type Expense = {
  id: string;
  vehicle_id: string;
  type: 'Challan' | 'Batta' | 'Toll' | 'Grease' | 'Repair' | 'Other';
  cost: number;
  description: string;
  created_at: string;
};

export type MaintenanceLog = {
  id: string;
  vehicle_id: string;
  type: string;
  cost: number;
  description: string;
  mechanic_name: string;
  created_at: string;
};

export enum TyreStatus {
  NEW = 'New',
  RETREADED = 'Retreaded',
  DAMAGED = 'Damaged',
  WARNING = 'Warning'
}

export type Tyre = {
  id: number;
  status: TyreStatus;
};

export type AppState = {
  activeTab: 'dashboard' | 'trips' | 'expenses' | 'maintenance' | 'admin';
  trips: Trip[];
  collaborators: Collaborator[];
  drivers: Driver[];
  vehicles: Vehicle[];
  materials: Material[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  maintenance: MaintenanceLog[];
  tyres: Tyre[];
  activeVehicleId: string;
};
