
import React, { useState } from 'react';
import { Tyre, TyreStatus, MaintenanceLog, Vehicle } from '../types';
import { Circle, HardHat, Settings, Plus, Truck, Edit2, Trash2, X } from 'lucide-react';

interface MaintenanceViewProps {
  tyres: Tyre[];
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceLog[];
  onUpdateTyre: (id: number, status: TyreStatus) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ 
  tyres, vehicles, maintenanceLogs, onUpdateTyre, onAddVehicle, onUpdateVehicle, onDeleteVehicle 
}) => {
  const [selectedTyre, setSelectedTyre] = useState<number | null>(null);
  const [showManageVehicles, setShowManageVehicles] = useState(false);
  const [newVehReg, setNewVehReg] = useState('');
  const [newVehOdo, setNewVehOdo] = useState('');

  const getStatusColor = (status: TyreStatus) => {
    switch(status) {
      case TyreStatus.NEW: return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case TyreStatus.RETREADED: return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
      case TyreStatus.WARNING: return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse';
      case TyreStatus.DAMAGED: return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      default: return 'bg-zinc-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase">Settings</h2>
        <button onClick={() => setShowManageVehicles(true)} className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl text-safety-yellow text-[10px] font-black uppercase"><Truck size={16}/> Manage Fleet</button>
      </div>

      <div className="space-y-4">
        <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Circle size={12} className="text-safety-yellow fill-safety-yellow" />
          Tyre Visualizer
        </h3>
        
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
           <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className="w-32 h-64 border-4 border-white rounded-xl"></div>
           </div>
           <div className="relative z-10 grid grid-cols-2 gap-x-16 gap-y-12 max-w-[240px] mx-auto">
              <button onClick={() => setSelectedTyre(1)} className={`w-14 h-24 rounded-lg flex items-center justify-center transition-all ${getStatusColor(tyres.find(t=>t.id===1)?.status || TyreStatus.NEW)}`}><span className="text-zinc-950 font-black text-xs">FL</span></button>
              <button onClick={() => setSelectedTyre(2)} className={`w-14 h-24 rounded-lg flex items-center justify-center transition-all ${getStatusColor(tyres.find(t=>t.id===2)?.status || TyreStatus.NEW)}`}><span className="text-zinc-950 font-black text-xs">FR</span></button>
              <div className="flex gap-1">
                <button onClick={() => setSelectedTyre(3)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===3)?.status || TyreStatus.NEW)}`}></button>
                <button onClick={() => setSelectedTyre(4)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===4)?.status || TyreStatus.NEW)}`}></button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSelectedTyre(5)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===5)?.status || TyreStatus.NEW)}`}></button>
                <button onClick={() => setSelectedTyre(6)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===6)?.status || TyreStatus.NEW)}`}></button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSelectedTyre(7)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===7)?.status || TyreStatus.NEW)}`}></button>
                <button onClick={() => setSelectedTyre(8)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===8)?.status || TyreStatus.NEW)}`}></button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSelectedTyre(9)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===9)?.status || TyreStatus.NEW)}`}></button>
                <button onClick={() => setSelectedTyre(10)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===10)?.status || TyreStatus.NEW)}`}></button>
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Circle size={12} className="text-blue-500 fill-blue-500" /> Recent History</h3>
        <div className="space-y-3">
          {maintenanceLogs.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 rounded-3xl border border-zinc-800"><HardHat size={32} className="text-zinc-700 mx-auto mb-2" /><p className="text-zinc-500 font-bold uppercase text-xs">No records</p></div>
          ) : (
            maintenanceLogs.map(log => (
              <div key={log.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-start">
                 <div><p className="font-black text-white">{log.type}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{log.mechanic_name} • {new Date(log.created_at).toLocaleDateString()}</p></div>
                 <div className="text-right"><p className="font-black text-safety-yellow text-lg">₹{log.cost.toLocaleString()}</p></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MANAGE VEHICLES OVERLAY */}
      {showManageVehicles && (
        <div className="fixed inset-0 z-[100] bg-black/95 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-safety-yellow uppercase italic">Manage Fleet</h2><button onClick={() => setShowManageVehicles(false)} className="text-zinc-500 font-bold"><X size={32}/></button></div>
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-500">Add Vehicle</h3>
              <input type="text" placeholder="Registration No" value={newVehReg} onChange={e=>setNewVehReg(e.target.value)} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold" />
              <input type="number" placeholder="Initial Odometer" value={newVehOdo} onChange={e=>setNewVehOdo(e.target.value)} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold" />
              <button onClick={()=>{ if(newVehReg){ onAddVehicle({reg_number: newVehReg, current_odometer: Number(newVehOdo)}); setNewVehReg(''); setNewVehOdo(''); } }} className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-xl font-black uppercase">Add To Fleet</button>
            </div>
            <div className="space-y-3">
              {vehicles.map(v => (
                <div key={v.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div><p className="font-black text-white text-lg">{v.reg_number}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{v.current_odometer} KM</p></div>
                  <button onClick={()=>onDeleteVehicle(v.id)} className="p-3 text-red-500 active:bg-red-500/10 rounded-xl"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
