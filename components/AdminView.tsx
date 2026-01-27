
import React, { useState } from 'react';
import { AppState, Driver, Vehicle, Trip } from '../types';
import { UserPlus, Truck, Trash2, Edit2, Check, X, Type, Database, RefreshCcw, AlertCircle, ChevronRight, Users, ClipboardList } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdminViewProps {
  state: AppState;
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onUpdateDriver: (id: string, updates: Partial<Driver>) => void;
  onDeleteDriver: (id: string) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  onDeleteTrip: (id: string) => void;
  onUpdateTrip: (trip: Trip) => void;
  onUpdateFontSize: (size: number) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  state, onAddDriver, onUpdateDriver, onDeleteDriver, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onDeleteTrip, onUpdateTrip, onUpdateFontSize 
}) => {
  const [activePanel, setActivePanel] = useState<'drivers' | 'vehicles' | 'trips' | 'settings'>('drivers');
  
  // Management Overlays State
  const [showManageDrivers, setShowManageDrivers] = useState(false);
  const [showManageVehicles, setShowManageVehicles] = useState(false);
  const [showManageTrips, setShowManageTrips] = useState(false);

  // Editing State
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tempTrip, setTempTrip] = useState<Trip | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingVehId, setEditingVehId] = useState<string | null>(null);

  const [newDriver, setNewDriver] = useState({ name: '', type: 'Permanent' as 'Permanent' | 'Temporary' });
  const [newVehicle, setNewVehicle] = useState({ reg_number: '', current_odometer: 0 });

  // Diagnostics state
  const [diagResults, setDiagResults] = useState<{table: string, status: 'ok' | 'error' | 'pending', error?: string}[]>([]);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningDiag(true);
    const tables = ['trips', 'vehicles', 'drivers', 'materials', 'collaborators', 'fuel_logs', 'expenses', 'tyres', 'app_settings'];
    const results = [];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        results.push({
          table,
          status: error ? 'error' : 'ok',
          error: error?.message
        });
      } catch (e: any) {
        results.push({ table, status: 'error', error: e.message });
      }
    }
    setDiagResults(results as any);
    setIsRunningDiag(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Admin Panel</h2>

      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
        {(['drivers', 'vehicles', 'trips', 'settings'] as const).map(p => (
          <button 
            key={p} 
            onClick={() => setActivePanel(p)}
            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activePanel === p ? 'bg-zinc-800 text-safety-yellow' : 'text-zinc-500'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {activePanel === 'drivers' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-safety-yellow border border-zinc-700 mx-auto">
              <Users size={32} />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic uppercase">{state.drivers.length} Drivers</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Manage active personnel records</p>
            </div>
            <button 
              onClick={() => setShowManageDrivers(true)}
              className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-transform mt-4"
            >
              Manage Drivers
            </button>
          </div>
        </div>
      )}

      {activePanel === 'vehicles' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-500 border border-zinc-700 mx-auto">
              <Truck size={32} />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic uppercase">{state.vehicles.length} Trucks</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Fleet Registration & Odometer Tracking</p>
            </div>
            <button 
              onClick={() => setShowManageVehicles(true)}
              className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-transform mt-4"
            >
              Manage Vehicles
            </button>
          </div>
        </div>
      )}

      {activePanel === 'trips' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-emerald-500 border border-zinc-700 mx-auto">
              <ClipboardList size={32} />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic uppercase">{state.trips.length} Total Trips</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Correct or remove past trip entries</p>
            </div>
            <button 
              onClick={() => setShowManageTrips(true)}
              className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-transform mt-4"
            >
              Manage Trips
            </button>
          </div>
        </div>
      )}

      {activePanel === 'settings' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-safety-yellow" />
                <h3 className="text-sm font-black uppercase text-zinc-400">Database Diagnostics</h3>
              </div>
              <button 
                onClick={runDiagnostics} 
                disabled={isRunningDiag}
                className="bg-zinc-800 p-2 rounded-xl text-safety-yellow active:rotate-180 transition-transform duration-500"
              >
                <RefreshCcw size={16} className={isRunningDiag ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="space-y-2 mt-4">
              {diagResults.length > 0 ? diagResults.map(res => (
                <div key={res.table} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-zinc-400">{res.table}</span>
                  <div className="flex items-center gap-2">
                    {res.status === 'ok' ? (
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                         <span className="text-[8px] font-black text-emerald-500 uppercase">Step Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                         <AlertCircle size={10} className="text-red-500" />
                         <span className="text-[8px] font-black text-red-500 uppercase">Missing Table</span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <button 
                  onClick={runDiagnostics}
                  className="w-full py-4 bg-zinc-950 border border-zinc-800 border-dashed rounded-2xl text-[10px] font-black uppercase text-zinc-600 hover:text-safety-yellow transition-colors"
                >
                  Click to Verify Connection Steps
                </button>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-6">
            <div className="flex items-center gap-3">
              <Type size={20} className="text-safety-yellow" />
              <h3 className="text-sm font-black uppercase text-zinc-400">Display Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Base Font Size</label>
                <span className="text-safety-yellow font-black text-sm">{state.fontSize}px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[8px] font-bold text-zinc-600 uppercase">Small</span>
                <input 
                  type="range" min="12" max="24" step="1" value={state.fontSize} 
                  onChange={(e) => onUpdateFontSize(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-safety-yellow"
                />
                <span className="text-[8px] font-bold text-zinc-600 uppercase">Large</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE DRIVERS OVERLAY */}
      {showManageDrivers && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Manage Drivers</h2>
            <button onClick={() => setShowManageDrivers(false)} className="bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-8">
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <p className="text-[10px] font-black uppercase text-zinc-500">Add New Personnel</p>
              <input type="text" placeholder="Driver Name" value={newDriver.name} onChange={e=>setNewDriver({...newDriver, name:e.target.value})} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold focus:border-safety-yellow transition-all" />
              <div className="flex gap-2">
                <button onClick={()=>setNewDriver({...newDriver, type:'Permanent'})} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-[10px] transition-all ${newDriver.type === 'Permanent' ? 'bg-safety-yellow/10 border-safety-yellow text-safety-yellow' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>Permanent</button>
                <button onClick={()=>setNewDriver({...newDriver, type:'Temporary'})} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-[10px] transition-all ${newDriver.type === 'Temporary' ? 'bg-safety-yellow/10 border-safety-yellow text-safety-yellow' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>Temporary</button>
              </div>
              <button 
                onClick={()=>{ if(newDriver.name){ onAddDriver(newDriver); setNewDriver({name:'', type:'Permanent'}); } }} 
                className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-xl font-black uppercase shadow-lg active:scale-95"
              >
                Register Driver
              </button>
            </div>
            <div className="space-y-3 pb-20">
              {state.drivers.map(d => (
                <div key={d.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  {editingDriverId === d.id ? (
                    <div className="flex-1 flex gap-2">
                      <input autoFocus value={d.name} onChange={e=>onUpdateDriver(d.id, {name: e.target.value})} className="flex-1 bg-zinc-800 rounded px-3 py-1 text-white font-bold" />
                      <button onClick={()=>setEditingDriverId(null)} className="text-emerald-500 p-1"><Check/></button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-white text-lg italic tracking-tighter uppercase">{d.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{d.type} Staff</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button onClick={()=>setEditingDriverId(d.id)} className="text-zinc-500 hover:text-safety-yellow transition-colors"><Edit2 size={18}/></button>
                    <button onClick={()=>onDeleteDriver(d.id)} className="p-2 text-red-500 active:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE VEHICLES OVERLAY */}
      {showManageVehicles && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Manage Fleet</h2>
            <button onClick={() => setShowManageVehicles(false)} className="bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-8">
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <p className="text-[10px] font-black uppercase text-zinc-500">Register New Truck</p>
              <input type="text" placeholder="Registration No (e.g. MH04...)" value={newVehicle.reg_number} onChange={e=>setNewVehicle({...newVehicle, reg_number: e.target.value})} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold focus:border-safety-yellow transition-all" />
              <input type="number" placeholder="Current Odometer Reading" value={newVehicle.current_odometer} onChange={e=>setNewVehicle({...newVehicle, current_odometer: Number(e.target.value)})} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold focus:border-safety-yellow transition-all" />
              <button 
                onClick={()=>{ if(newVehicle.reg_number){ onAddVehicle(newVehicle); setNewVehicle({reg_number: '', current_odometer: 0}); } }} 
                className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-xl font-black uppercase shadow-lg active:scale-95"
              >
                Add Vehicle
              </button>
            </div>
            <div className="space-y-3 pb-20">
              {state.vehicles.map(v => (
                <div key={v.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  {editingVehId === v.id ? (
                    <div className="flex-1 flex gap-2">
                      <input autoFocus value={v.reg_number} onChange={e=>onUpdateVehicle(v.id, {reg_number: e.target.value})} className="flex-1 bg-zinc-800 rounded px-2 py-1 text-white font-bold" />
                      <button onClick={()=>setEditingVehId(null)} className="text-emerald-500 p-1"><Check/></button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-white text-lg italic tracking-tighter">{v.reg_number}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{v.current_odometer.toLocaleString()} KM ODO</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button onClick={()=>setEditingVehId(v.id)} className="text-zinc-500 hover:text-safety-yellow transition-colors"><Edit2 size={18}/></button>
                    <button onClick={()=>onDeleteVehicle(v.id)} className="p-2 text-red-500 active:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE TRIPS OVERLAY */}
      {showManageTrips && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Manage Trips</h2>
            <button onClick={() => setShowManageTrips(false)} className="bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-3 pb-20">
            {state.trips.map(t => (
              <div key={t.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl">
                {editingTripId === t.id && tempTrip ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-zinc-500">Edit Site Name</p>
                    <input type="text" value={tempTrip.site_name} onChange={e=>setTempTrip({...tempTrip, site_name:e.target.value})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 font-bold" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-zinc-600">Qty</p>
                        <input type="number" value={tempTrip.quantity} onChange={e=>setTempTrip({...tempTrip, quantity:Number(e.target.value)})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-zinc-600">Rate</p>
                        <input type="number" value={tempTrip.rate} onChange={e=>setTempTrip({...tempTrip, rate:Number(e.target.value)})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 font-bold" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>{ onUpdateTrip(tempTrip); setEditingTripId(null); }} className="flex-1 bg-emerald-600 text-white p-4 rounded-xl font-black uppercase"><Check size={20} className="mx-auto"/></button>
                      <button onClick={()=>setEditingTripId(null)} className="flex-1 bg-zinc-800 text-zinc-400 p-4 rounded-xl font-black uppercase"><X size={20} className="mx-auto"/></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{new Date(t.created_at).toLocaleDateString()}</p>
                      <p className="font-black text-white italic uppercase tracking-tight">{t.site_name} - {t.material_type}</p>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-black text-zinc-400 uppercase tracking-widest">₹{(t.quantity * t.rate).toLocaleString()}</div>
                         <div className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-black text-safety-yellow uppercase tracking-widest">{t.quantity} {t.unit}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={()=>{setEditingTripId(t.id); setTempTrip(t);}} className="p-2 text-zinc-400 hover:text-safety-yellow transition-colors"><Edit2 size={18}/></button>
                      <button onClick={()=>onDeleteTrip(t.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
