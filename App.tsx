
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TripsView from './components/TripsView';
import ExpensesView from './components/ExpensesView';
import MaintenanceView from './components/MaintenanceView';
import AdminView from './components/AdminView';
import { AppState, Trip, FuelLog, TyreStatus, Tyre, Collaborator, Driver, Vehicle, Material, Expense, MaintenanceLog } from './types';
import { supabase } from './services/supabaseClient';
import { Loader2, RefreshCw } from 'lucide-react';

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

  const safeFetch = async (query: any) => {
    try {
      const { data, error } = await query;
      if (error) {
        console.warn("Table fetch warning:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error("Table fetch crash:", e);
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setIsSyncing(true);

      const [
        trips,
        collaborators,
        drivers,
        vehicles,
        materials,
        fuelLogs,
        expenses,
        tyres,
        settings,
        maintenance
      ] = await Promise.all([
        safeFetch(supabase.from('trips').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('collaborators').select('*').order('name', { ascending: true })),
        safeFetch(supabase.from('drivers').select('*')),
        safeFetch(supabase.from('vehicles').select('*')),
        safeFetch(supabase.from('materials').select('*')),
        safeFetch(supabase.from('fuel_logs').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('expenses').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('tyres').select('*').order('id', { ascending: true })),
        safeFetch(supabase.from('app_settings').select('*').single()),
        safeFetch(supabase.from('maintenance_logs').select('*').order('created_at', { ascending: false }))
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
      console.error('Fetch global error:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${state.fontSize}px`;
  }, [state.fontSize]);

  // Handlers (Simplified for safety)
  const handleAddTrip = async (trip: any) => {
    const { data, error } = await supabase.from('trips').insert([trip]).select();
    if (!error && data) setState(prev => ({ ...prev, trips: [data[0], ...prev.trips] }));
  };

  const handleAddFuel = async (log: any) => {
    const { data, error } = await supabase.from('fuel_logs').insert([log]).select();
    if (!error && data) fetchData();
  };

  const handleUpdateVehicle = async (id: string, updates: any) => {
    await supabase.from('vehicles').update(updates).eq('id', id);
    fetchData();
  };

  const handleUpdateTyre = async (id: number, status: any) => {
    await supabase.from('tyres').upsert({ id, status });
    fetchData();
  };

  const handleUpdateFontSize = async (size: number) => {
    await supabase.from('app_settings').upsert({ id: 1, font_size: size });
    setState(prev => ({ ...prev, fontSize: size }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 p-6">
        <Loader2 className="w-12 h-12 text-safety-yellow animate-spin" />
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase tracking-[0.2em] text-xs">TipperPro</p>
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-[8px]">Loading Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={state.activeTab} setActiveTab={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}>
      <div className="max-w-md mx-auto relative">
        {isSyncing && (
          <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full shadow-2xl">
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
              return <TripsView trips={state.trips} collaborators={state.collaborators} drivers={state.drivers} vehicles={state.vehicles} materials={state.materials} onAddTrip={handleAddTrip} onAddCollaborator={(name) => supabase.from('collaborators').insert([{name}]).then(fetchData)} onUpdateCollaborator={(id, name) => supabase.from('collaborators').update({name}).eq('id', id).then(fetchData)} onDeleteCollaborator={(id) => supabase.from('collaborators').delete().eq('id', id).then(fetchData)} onAddMaterial={(name) => supabase.from('materials').insert([{name}]).then(fetchData)} onDeleteMaterial={(id) => supabase.from('materials').delete().eq('id', id).then(fetchData)} onUpdateMaterial={(id, name) => supabase.from('materials').update({name}).eq('id', id).then(fetchData)} />;
            case 'expenses':
              return <ExpensesView fuelLogs={state.fuelLogs} onAddFuel={handleAddFuel} vehicles={state.vehicles} />;
            case 'maintenance':
              return <MaintenanceView tyres={state.tyres} vehicles={state.vehicles} maintenanceLogs={state.maintenance} onUpdateTyre={handleUpdateTyre} onAddVehicle={(v) => supabase.from('vehicles').insert([v]).then(fetchData)} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={(id) => supabase.from('vehicles').delete().eq('id', id).then(fetchData)} />;
            case 'admin':
              return <AdminView state={state} onAddDriver={(d) => supabase.from('drivers').insert([d]).then(fetchData)} onAddVehicle={(v) => supabase.from('vehicles').insert([v]).then(fetchData)} onDeleteTrip={(id) => supabase.from('trips').delete().eq('id', id).then(fetchData)} onUpdateTrip={(t) => supabase.from('trips').update(t).eq('id', t.id).then(fetchData)} onUpdateFontSize={handleUpdateFontSize} />;
            default:
              return null;
          }
        })()}
      </div>
    </Layout>
  );
};

export default App;
