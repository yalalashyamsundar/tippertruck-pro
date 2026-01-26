
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TripsView from './components/TripsView';
import ExpensesView from './components/ExpensesView';
import MaintenanceView from './components/MaintenanceView';
import AdminView from './components/AdminView';
import { AppState, Trip, FuelLog, TyreStatus, Tyre, Collaborator, Driver, Vehicle, Material } from './types';

const INITIAL_TYRES: Tyre[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  status: i > 7 ? TyreStatus.WARNING : TyreStatus.NEW,
}));

const INITIAL_MATERIALS: Material[] = [
  { id: '1', name: '20mm' },
  { id: '2', name: '40mm' },
  { id: '3', name: 'Dust' },
  { id: '4', name: 'Boulders' },
  { id: '5', name: 'Top Soil' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('tipper_state_v4');
    if (saved) return JSON.parse(saved);
    return {
      activeTab: 'dashboard',
      trips: [],
      collaborators: [],
      drivers: [
        { id: 'd1', name: 'Suresh Kumar', type: 'Permanent' }
      ],
      vehicles: [
        { id: 'v1', reg_number: 'MH04-HY-9921', current_odometer: 125400 }
      ],
      materials: INITIAL_MATERIALS,
      fuelLogs: [],
      expenses: [],
      maintenance: [],
      tyres: INITIAL_TYRES,
      activeVehicleId: 'v1',
    };
  });

  useEffect(() => {
    localStorage.setItem('tipper_state_v4', JSON.stringify(state));
  }, [state]);

  const handleAddTrip = (trip: Omit<Trip, 'id' | 'created_at'> & { created_at?: string }) => {
    const newTrip: Trip = {
      ...trip,
      id: Math.random().toString(36).substr(2, 9),
      created_at: trip.created_at || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, trips: [newTrip, ...prev.trips] }));
  };

  const handleDeleteTrip = (id: string) => setState(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== id) }));
  const handleUpdateTrip = (updatedTrip: Trip) => setState(prev => ({ ...prev, trips: prev.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t) }));

  const handleAddCollaborator = (name: string) => {
    const newCollab: Collaborator = { id: Math.random().toString(36).substr(2, 9), name };
    setState(prev => ({ ...prev, collaborators: [...prev.collaborators, newCollab] }));
  };
  const handleUpdateCollaborator = (id: string, name: string) => {
    setState(prev => ({ ...prev, collaborators: prev.collaborators.map(c => c.id === id ? { ...c, name } : c) }));
  };
  const handleDeleteCollaborator = (id: string) => {
    setState(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c.id !== id) }));
  };

  const handleAddDriver = (driver: Omit<Driver, 'id'>) => {
    const newDriver: Driver = { ...driver, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, drivers: [...prev.drivers, newDriver] }));
  };

  const handleAddVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = { ...vehicle, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, vehicles: [...prev.vehicles, newVehicle] }));
  };
  const handleUpdateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v) }));
  };
  const handleDeleteVehicle = (id: string) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));
  };

  const handleAddMaterial = (name: string) => {
    const newMat: Material = { id: Math.random().toString(36).substr(2, 9), name };
    setState(prev => ({ ...prev, materials: [...prev.materials, newMat] }));
  };
  const handleDeleteMaterial = (id: string) => setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
  const handleUpdateMaterial = (id: string, name: string) => {
    setState(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? { ...m, name } : m) }));
  };

  const handleAddFuel = (log: Omit<FuelLog, 'id' | 'created_at' | 'calculated_mileage'>) => {
    const lastOdo = state.fuelLogs.find(f => f.vehicle_id === log.vehicle_id)?.odometer || 
                   state.vehicles.find(v => v.id === log.vehicle_id)?.current_odometer || 0;
    const distance = log.odometer - lastOdo;
    const mileage = distance > 0 ? distance / log.liters : 4.0; 
    const newLog: FuelLog = { ...log, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString(), calculated_mileage: mileage };
    setState(prev => ({ ...prev, fuelLogs: [newLog, ...prev.fuelLogs], vehicles: prev.vehicles.map(v => v.id === log.vehicle_id ? { ...v, current_odometer: log.odometer } : v) }));
  };

  const handleUpdateTyre = (id: number, status: TyreStatus) => setState(prev => ({ ...prev, tyres: prev.tyres.map(t => t.id === id ? { ...t, status } : t) }));

  const renderContent = () => {
    const activeVehicle = state.vehicles.find(v => v.id === state.activeVehicleId) || state.vehicles[0];

    switch (state.activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            trips={state.trips} 
            expenses={state.expenses} 
            fuelLogs={state.fuelLogs}
            drivers={state.drivers}
            nextServiceKm={activeVehicle ? (activeVehicle.current_odometer % 5000 === 0 ? 5000 : 5000 - (activeVehicle.current_odometer % 5000)) : 5000}
            onQuickAction={(type) => {
              setState(prev => ({ ...prev, activeTab: 'trips' }));
              // Logic to handle auto-open of specific form can be added here if needed
            }}
            onAdminClick={() => setState(prev => ({ ...prev, activeTab: 'admin' }))}
          />
        );
      case 'trips':
        return (
          <TripsView 
            trips={state.trips} 
            collaborators={state.collaborators}
            drivers={state.drivers}
            vehicles={state.vehicles}
            materials={state.materials}
            onAddTrip={handleAddTrip} 
            onAddCollaborator={handleAddCollaborator}
            onUpdateCollaborator={handleUpdateCollaborator}
            onDeleteCollaborator={handleDeleteCollaborator}
            onAddMaterial={handleAddMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onUpdateMaterial={handleUpdateMaterial}
          />
        );
      case 'expenses':
        return <ExpensesView fuelLogs={state.fuelLogs} onAddFuel={handleAddFuel} vehicles={state.vehicles} />;
      case 'maintenance':
        return (
          <MaintenanceView 
            tyres={state.tyres} 
            vehicles={state.vehicles}
            maintenanceLogs={state.maintenance} 
            onUpdateTyre={handleUpdateTyre}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        );
      case 'admin':
        return (
          <AdminView 
            state={state}
            onAddDriver={handleAddDriver}
            onAddVehicle={handleAddVehicle}
            onDeleteTrip={handleDeleteTrip}
            onUpdateTrip={handleUpdateTrip}
          />
        );
      default:
        return <Dashboard trips={[]} expenses={[]} fuelLogs={[]} drivers={[]} nextServiceKm={5000} onQuickAction={()=>{}} onAdminClick={()=>{}} />;
    }
  };

  return (
    <Layout activeTab={state.activeTab} setActiveTab={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}>
      <div className="max-w-md mx-auto">{renderContent()}</div>
    </Layout>
  );
};

export default App;
