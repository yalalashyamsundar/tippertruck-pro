
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TripsView from './components/TripsView';
import ExpensesView from './components/ExpensesView';
import MaintenanceView from './components/MaintenanceView';
import AdminView from './components/AdminView';
import { AppState, Trip, FuelLog, TyreStatus, Tyre, Collaborator, Driver, Vehicle, Material, Expense, MaintenanceLog } from './types';
import { supabase } from './services/supabaseClient';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

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

const DEFAULT_STATE: AppState = {
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
  fontSize: 16,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);

      // Perform a health check first to catch basic connection errors
      const { error: healthError } = await supabase.from('app_settings').select('count', { count: 'exact', head: true }).limit(1);
      
      // If health check fails with a 404/PGRST301, the tables might not exist yet
      // We still want to load the app with default state in that case
      
      const [
        { data: trips },
        { data: collaborators },
        { data: drivers },
        { data: vehicles },
        { data: materials },
        { data: fuelLogs },
        { data: expenses },
        { data: tyres },
        { data: settings },
        { data: maintenance }
      ] = await Promise.all([
        supabase.from('trips').select('*').order('created_at', { ascending: false }),
        supabase.from('collaborators').select('*').order('name', { ascending: true }),
        supabase.from('drivers').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('materials').select('*'),
        supabase.from('fuel_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('tyres').select('*').order('id', { ascending: true }),
        supabase.from('app_settings').select('*').single().catch(() => ({ data: null })),
        supabase.from('maintenance_logs').select('*').order('created_at', { ascending: false })
      ]);

      setState(prev => ({
        ...prev,
        trips: trips || [],
        collaborators: collaborators || [],
        drivers: drivers && drivers.length > 0 ? drivers : prev.drivers,
        vehicles: vehicles && vehicles.length > 0 ? vehicles : prev.vehicles,
        materials: materials && materials.length > 0 ? materials : prev.materials,
        fuelLogs: fuelLogs || [],
        expenses: expenses || [],
        maintenance: maintenance || [],
        tyres: tyres && tyres.length > 0 ? tyres : INITIAL_TYRES,
        activeVehicleId: settings?.active_vehicle_id || prev.activeVehicleId,
        fontSize: settings?.font_size || prev.fontSize,
      }));
    } catch (err: any) {
      console.error('Fetch error:', err);
      // We don't block the app on error, but we log it
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (supabase) {
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_logs' }, () => fetchData())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchData]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${state.fontSize}px`;
  }, [state.fontSize]);

  // Handlers
  const handleAddCollaborator = async (name: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('collaborators').insert([{ name }]).select();
    if (!error && data) {
      setState(prev => ({ ...prev, collaborators: [...prev.collaborators, data[0]] }));
    }
  };

  const handleUpdateCollaborator = async (id: string, name: string) => {
    if (!supabase) return;
    await supabase.from('collaborators').update({ name }).eq('id', id);
    setState(prev => ({ ...prev, collaborators: prev.collaborators.map(c => c.id === id ? { ...c, name } : c) }));
  };

  const handleDeleteCollaborator = async (id: string) => {
    if (!supabase) return;
    await supabase.from('collaborators').delete().eq('id', id);
    setState(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c.id !== id) }));
  };

  const handleAddMaterial = async (name: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('materials').insert([{ name }]).select();
    if (!error && data) {
      setState(prev => ({ ...prev, materials: [...prev.materials, data[0]] }));
    }
  };

  const handleUpdateMaterial = async (id: string, name: string) => {
    if (!supabase) return;
    await supabase.from('materials').update({ name }).eq('id', id);
    setState(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? { ...m, name } : m) }));
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!supabase) return;
    await supabase.from('materials').delete().eq('id', id);
    setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
  };

  const handleAddTrip = async (trip: Omit<Trip, 'id' | 'created_at'> & { created_at?: string }) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('trips').insert([trip]).select();
    if (!error && data) setState(prev => ({ ...prev, trips: [data[0], ...prev.trips] }));
  };

  const handleAddFuel = async (log: Omit<FuelLog, 'id' | 'created_at' | 'calculated_mileage'>) => {
    if (!supabase) return;
    const lastOdo = state.fuelLogs.find(f => f.vehicle_id === log.vehicle_id)?.odometer || 
                   state.vehicles.find(v => v.id === log.vehicle_id)?.current_odometer || 0;
    const distance = log.odometer - lastOdo;
    const mileage = distance > 0 ? distance / log.liters : 4.0; 
    const newLogEntry = { ...log, calculated_mileage: mileage };

    const { data, error } = await supabase.from('fuel_logs').insert([newLogEntry]).select();
    if (!error && data) {
      await handleUpdateVehicle(log.vehicle_id, { current_odometer: log.odometer });
      setState(prev => ({ 
        ...prev, 
        fuelLogs: [data[0], ...prev.fuelLogs],
        vehicles: prev.vehicles.map(v => v.id === log.vehicle_id ? { ...v, current_odometer: log.odometer } : v)
      }));
    }
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    if (!supabase) return;
    await supabase.from('vehicles').update(updates).eq('id', id);
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v) }));
  };

  const handleUpdateTyre = async (id: number, status: TyreStatus) => {
    if (!supabase) return;
    await supabase.from('tyres').upsert({ id, status });
    setState(prev => ({ ...prev, tyres: prev.tyres.map(t => t.id === id ? { ...t, status } : t) }));
  };

  const handleUpdateFontSize = async (size: number) => {
    if (!supabase) return;
    await supabase.from('app_settings').upsert({ id: 1, font_size: size });
    setState(prev => ({ ...prev, fontSize: size }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 p-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-safety-yellow animate-spin" />
          <div className="absolute inset-0 blur-xl bg-safety-yellow/20 animate-pulse"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase tracking-[0.2em] text-xs">TipperPro</p>
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-[8px]">Syncing Cloud Database...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={state.activeTab} setActiveTab={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}>
      <div className="max-w-md mx-auto relative">
        {isSyncing && (
          <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-right-4">
             <RefreshCw size={10} className="text-safety-yellow animate-spin" />
             <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Syncing</span>
          </div>
        )}
        
        {(() => {
          const activeVehicle = state.vehicles.find(v => v.id === state.activeVehicleId) || state.vehicles[0];
          switch (state.activeTab) {
            case 'dashboard':
              return <Dashboard trips={state.trips} expenses={state.expenses} fuelLogs={state.fuelLogs} drivers={state.drivers} nextServiceKm={activeVehicle ? (5000 - (activeVehicle.current_odometer % 5000)) : 5000} onQuickAction={() => setState(prev => ({ ...prev, activeTab: 'trips' }))} onAdminClick={() => setState(prev => ({ ...prev, activeTab: 'admin' }))} />;
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
              return <MaintenanceView tyres={state.tyres} vehicles={state.vehicles} maintenanceLogs={state.maintenance} onUpdateTyre={handleUpdateTyre} onAddVehicle={(v) => supabase?.from('vehicles').insert([v]).then(fetchData)} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={(id) => supabase?.from('vehicles').delete().eq('id', id).then(fetchData)} />;
            case 'admin':
              return <AdminView state={state} onAddDriver={(d) => supabase?.from('drivers').insert([d]).then(fetchData)} onAddVehicle={(v) => supabase?.from('vehicles').insert([v]).then(fetchData)} onDeleteTrip={(id) => supabase?.from('trips').delete().eq('id', id).then(fetchData)} onUpdateTrip={(t) => supabase?.from('trips').update(t).eq('id', t.id).then(fetchData)} onUpdateFontSize={handleUpdateFontSize} />;
            default:
              return null;
          }
        })()}
      </div>
    </Layout>
  );
};

export default App;
