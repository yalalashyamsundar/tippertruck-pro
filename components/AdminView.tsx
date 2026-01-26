
import React, { useState, useEffect } from 'react';
import { AppState, Driver, Vehicle, Trip } from '../types';
import { UserPlus, Truck, Trash2, Edit2, Check, X, Type, Database, Activity, AlertCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdminViewProps {
  state: AppState;
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onDeleteTrip: (id: string) => void;
  onUpdateTrip: (trip: Trip) => void;
  onUpdateFontSize: (size: number) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ state, onAddDriver, onAddVehicle, onDeleteTrip, onUpdateTrip, onUpdateFontSize }) => {
  const [activePanel, setActivePanel] = useState<'drivers' | 'vehicles' | 'trips' | 'settings'>('drivers');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tempTrip, setTempTrip] = useState<Trip | null>(null);

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
        <div className="space-y-4">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
            <h3 className="text-sm font-black uppercase mb-4 text-zinc-400">Add New Driver</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Driver Name" value={newDriver.name} onChange={e=>setNewDriver({...newDriver, name:e.target.value})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 font-bold" />
              <div className="flex gap-2">
                <button onClick={()=>setNewDriver({...newDriver, type:'Permanent'})} className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs ${newDriver.type === 'Permanent' ? 'border-safety-yellow text-safety-yellow' : 'border-zinc-800 text-zinc-500'}`}>Permanent</button>
                <button onClick={()=>setNewDriver({...newDriver, type:'Temporary'})} className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs ${newDriver.type === 'Temporary' ? 'border-safety-yellow text-safety-yellow' : 'border-zinc-800 text-zinc-500'}`}>Temporary</button>
              </div>
              <button onClick={()=>{ if(newDriver.name){ onAddDriver(newDriver); setNewDriver({name:'', type:'Permanent'}); } }} className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-xl font-black uppercase flex items-center justify-center gap-2"><UserPlus size={20}/> Add Driver</button>
            </div>
          </div>
          <div className="space-y-2">
            {state.drivers.map(d => (
              <div key={d.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                <div><p className="font-black text-sm">{d.name}</p></div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${d.type === 'Permanent' ? 'border-emerald-500/20 text-emerald-500' : 'border-orange-500/20 text-orange-500'}`}>{d.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePanel === 'vehicles' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
            <h3 className="text-sm font-black uppercase mb-4 text-zinc-400">Add New Vehicle</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Reg Number (e.g. MH04-HY-9921)" value={newVehicle.reg_number} onChange={e=>setNewVehicle({...newVehicle, reg_number:e.target.value})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 font-bold" />
              <input type="number" placeholder="Current Odometer" value={newVehicle.current_odometer} onChange={e=>setNewVehicle({...newVehicle, current_odometer: Number(e.target.value)})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 font-bold" />
              <button onClick={()=>{ if(newVehicle.reg_number){ onAddVehicle(newVehicle); setNewVehicle({reg_number:'', current_odometer:0}); } }} className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-xl font-black uppercase flex items-center justify-center gap-2"><Truck size={20}/> Add Vehicle</button>
            </div>
          </div>
          <div className="space-y-2">
            {state.vehicles.map(v => (
              <div key={v.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                <div><p className="font-black">{v.reg_number}</p><p className="text-[10px] font-bold text-zinc-500 uppercase">{v.current_odometer} KM</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePanel === 'trips' && (
        <div className="space-y-3">
          {state.trips.map(t => (
            <div key={t.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              {editingTripId === t.id && tempTrip ? (
                <div className="space-y-4">
                  <input type="text" value={tempTrip.site_name} onChange={e=>setTempTrip({...tempTrip, site_name:e.target.value})} className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2 text-sm" />
                  <div className="flex gap-2">
                    <input type="number" value={tempTrip.quantity} onChange={e=>setTempTrip({...tempTrip, quantity:Number(e.target.value)})} className="flex-1 bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2 text-sm" />
                    <input type="number" value={tempTrip.rate} onChange={e=>setTempTrip({...tempTrip, rate:Number(e.target.value)})} className="flex-1 bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>{ onUpdateTrip(tempTrip); setEditingTripId(null); }} className="flex-1 bg-emerald-600 p-2 rounded-xl"><Check size={20} className="mx-auto"/></button>
                    <button onClick={()=>setEditingTripId(null)} className="flex-1 bg-zinc-800 p-2 rounded-xl"><X size={20} className="mx-auto"/></button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-black text-zinc-500">{new Date(t.created_at).toLocaleDateString()}</p>
                    <p className="font-bold text-white">{t.site_name} - {t.material_type}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">₹{t.quantity * t.rate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>{setEditingTripId(t.id); setTempTrip(t);}} className="p-2 text-zinc-400"><Edit2 size={16}/></button>
                    <button onClick={()=>onDeleteTrip(t.id)} className="p-2 text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activePanel === 'settings' && (
        <div className="space-y-6">
          {/* Database Diagnostics Tool */}
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
            
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
              Verify if the Supabase project 'Tipperlog' and all tables are connected correctly.
            </p>

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
                  type="range" 
                  min="12" 
                  max="24" 
                  step="1" 
                  value={state.fontSize} 
                  onChange={(e) => onUpdateFontSize(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-safety-yellow"
                />
                <span className="text-[8px] font-bold text-zinc-600 uppercase">Large</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={() => onUpdateFontSize(14)} className="py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-400 active:bg-safety-yellow active:text-zinc-950">Compact</button>
                <button onClick={() => onUpdateFontSize(16)} className="py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-400 active:bg-safety-yellow active:text-zinc-950">Normal</button>
                <button onClick={() => onUpdateFontSize(20)} className="py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-400 active:bg-safety-yellow active:text-zinc-950">Big</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
