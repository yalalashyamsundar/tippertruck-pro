
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TripsView from './components/TripsView';
import ExpensesView from './components/ExpensesView';
import MaintenanceView from './components/MaintenanceView';
import AdminView from './components/AdminView';
import { AppState, Trip, FuelLog, TyreStatus, Tyre, Collaborator, Driver, Vehicle, Material, Expense, MaintenanceLog, Unit } from './types';
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

const INITIAL_UNITS: Unit[] = [
  { id: '1', name: 'Tons' },
  { id: '2', name: 'CFT' },
  { id: '3', name: 'trips' },
];

const DEFAULT_STATE: AppState = {
  activeTab: 'dashboard',
  trips: [],
  collaborators: [],
  drivers: [],
  vehicles: [],
  materials: INITIAL_MATERIALS,
  units: INITIAL_UNITS,
  fuelLogs: [],
  expenses: [],
  maintenance: [],
  tyres: INITIAL_TYRES,
  activeVehicleId: '',
  defaultCollaboratorId: null,
  fontSize: 16,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const safeFetch = async (query: any, silent: boolean = false) => {
    try {
      const { data, error } = await query;
      if (error) {
        if (!silent) console.warn("Table fetch warning:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      if (!silent) console.error("Table fetch crash:", e);
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
        units,
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
        safeFetch(supabase.from('units').select('*'), true), // Silent fetch for units table
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
        drivers: drivers || [],
        vehicles: vehicles || [],
        materials: (materials && materials.length > 0) ? materials : prev.materials,
        units: (units && units.length > 0) ? units : prev.units,
        fuelLogs: fuelLogs || [],
        expenses: expenses || [],
        maintenance: maintenance || [],
        tyres: (tyres && tyres.length > 0) ? tyres : INITIAL_TYRES,
        activeVehicleId: settings?.active_vehicle_id || (vehicles?.[0]?.id || ''),
        defaultCollaboratorId: settings?.default_collaborator_id || null,
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

    // Setup channel subscriptions. We use a more generic approach to handle potential missing tables
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => fetchData()) // Added units sync
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${state.fontSize}px`;
  }, [state.fontSize]);

  // Handlers
  const handleAddTrip = async (trip: any) => {
    if (!trip.vehicle_id || !trip.driver_id) {
      alert("Registration Required: Please add a Truck and a Driver in Admin Panel first.");
      return;
    }

    const tempId = 'temp-' + Date.now();
    const tempTrip = { ...trip, id: tempId };
    setState(prev => ({ ...prev, trips: [tempTrip, ...prev.trips] }));

    try {
      const { data, error } = await supabase.from('trips').insert([trip]).select();
      if (error) {
        console.error("Trip creation failed in DB:", error.message);
        setState(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== tempId) }));
        alert("Trip not saved: " + error.message);
      } else if (data) {
        setState(prev => ({ 
          ...prev, 
          trips: prev.trips.map(t => t.id === tempId ? data[0] : t) 
        }));
      }
    } catch (err) {
      console.error("Network error during trip creation:", err);
      setState(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== tempId) }));
    }
  };

  const handleAddFuel = async (log: any) => {
    if (!log.vehicle_id) return;
    const { data, error } = await supabase.from('fuel_logs').insert([log]).select();
    if (!error && data) fetchData();
  };

  const handleUpdateVehicle = async (id: string, updates: any) => {
    await supabase.from('vehicles').update(updates).eq('id', id);
    fetchData();
  };

  const handleDeleteVehicle = async (id: string) => {
    await supabase.from('vehicles').delete().eq('id', id);
    fetchData();
  };

  const handleUpdateDriver = async (id: string, updates: any) => {
    await supabase.from('drivers').update(updates).eq('id', id);
    fetchData();
  };

  const handleDeleteDriver = async (id: string) => {
    await supabase.from('drivers').delete().eq('id', id);
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

  const handleSetDefaultCollaborator = async (id: string | null) => {
    await supabase.from('app_settings').upsert({ id: 1, default_collaborator_id: id });
    setState(prev => ({ ...prev, defaultCollaboratorId: id }));
  };

  const handleAddUnit = async (name: string) => {
    // Optimistically add to local state immediately
    const localUnit = { id: Date.now().toString(), name };
    setState(prev => ({
      ...prev,
      units: [...prev.units, localUnit]
    }));

    try {
      const { error } = await supabase.from('units').insert([{ name }]);
      if (error) {
        // We already added it locally, just log the warning
        console.warn("Unit sync to DB failed (possibly missing table), staying local-only.");
      } else {
        fetchData(); // Sync with actual DB data if successful
      }
    } catch (e) {
      console.warn("Unit sync failed, staying local-only.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 p-6">
        <Loader2 className="w-12 h-12 text-safety-yellow animate-spin" />
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase tracking-[0.2em] text-xs">TipperPro</p>
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-[8px]">Syncing Records...</p>
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
             <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Live Sync</span>
          </div>
        )}
        
        {(() => {
          const activeVehicle = state.vehicles.find(v => v.id === state.activeVehicleId) || state.vehicles[0];
          switch (state.activeTab) {
            case 'dashboard':
              return (
                <Dashboard 
                  trips={state.trips} 
                  expenses={state.expenses} 
                  fuelLogs={state.fuelLogs} 
                  drivers={state.drivers} 
                  vehicles={state.vehicles}
                  nextServiceKm={activeVehicle ? (5000 - (activeVehicle.current_odometer % 5000)) : 5000} 
                  onQuickAction={(type) => setState(prev => ({ ...prev, activeTab: 'trips' }))} 
                  onAdminClick={() => setState(prev => ({ ...prev, activeTab: 'admin' }))} 
                />
              );
            case 'trips':
              return <TripsView trips={state.trips} collaborators={state.collaborators} drivers={state.drivers} vehicles={state.vehicles} materials={state.materials} units={state.units} onAddUnit={handleAddUnit} defaultCollaboratorId={state.defaultCollaboratorId} onSetDefaultCollaborator={handleSetDefaultCollaborator} onAddTrip={handleAddTrip} onAddCollaborator={(name) => supabase.from('collaborators').insert([{name}]).then(fetchData)} onUpdateCollaborator={(id, name) => supabase.from('collaborators').update({name}).eq('id', id).then(fetchData)} onDeleteCollaborator={(id) => supabase.from('collaborators').delete().eq('id', id).then(fetchData)} onAddMaterial={(name) => supabase.from('materials').insert([{name}]).then(fetchData)} onDeleteMaterial={(id) => supabase.from('materials').delete().eq('id', id).then(fetchData)} onUpdateMaterial={(id, name) => supabase.from('materials').update({name}).eq('id', id).then(fetchData)} />;
            case 'expenses':
              return <ExpensesView fuelLogs={state.fuelLogs} onAddFuel={handleAddFuel} vehicles={state.vehicles} />;
            case 'maintenance':
              return <MaintenanceView tyres={state.tyres} vehicles={state.vehicles} maintenanceLogs={state.maintenance} onUpdateTyre={handleUpdateTyre} onAddVehicle={(v) => supabase.from('vehicles').insert([v]).then(fetchData)} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={handleDeleteVehicle} />;
            case 'admin':
              return <AdminView state={state} onAddDriver={(d) => supabase.from('drivers').insert([d]).then(fetchData)} onUpdateDriver={handleUpdateDriver} onDeleteDriver={handleDeleteDriver} onAddVehicle={(v) => supabase.from('vehicles').insert([v]).then(fetchData)} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={handleDeleteVehicle} onDeleteTrip={(id) => supabase.from('trips').delete().eq('id', id).then(fetchData)} onUpdateTrip={(t) => supabase.from('trips').update(t).eq('id', t.id).then(fetchData)} onUpdateFontSize={handleUpdateFontSize} />;
            default:
              return null;
          }
        })()}
      </div>
    </Layout>
  );
};

export default App;
