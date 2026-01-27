
import React, { useState } from 'react';
import { Tyre, TyreStatus, MaintenanceLog, Vehicle } from '../types';
import { Circle, HardHat, Settings, Plus, Truck, Edit2, Trash2, X, ChevronRight } from 'lucide-react';

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
  const [editingVehId, setEditingVehId] = useState<string | null>(null);

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
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Settings</h2>
        <button 
          onClick={() => setShowManageVehicles(true)} 
          className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700 text-safety-yellow shadow-xl active:scale-95"
        >
          <Truck size={24}/>
        </button>
      </div>

      <div className="space-y-6">
        <div 
          onClick={() => setShowManageVehicles(true)}
          className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex justify-between items-center group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-safety-yellow border border-zinc-700">
              <Settings size={24} />
            </div>
            <div>
              <p className="font-black text-white uppercase italic">Manage Fleet</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">{vehicles.length} Active Vehicles</p>
            </div>
          </div>
          <ChevronRight className="text-zinc-700 group-hover:text-safety-yellow" />
        </div>

        <div className="space-y-4">
          <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Circle size={12} className="text-safety-yellow fill-safety-yellow" />
            Tyre Maintenance Monitor
          </h3>
          
          <div className="bg-zinc-900 rounded-3xl p-10 border border-zinc-800 shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-32 h-64 border-4 border-white rounded-xl"></div>
             </div>
             <div className="relative z-10 grid grid-cols-2 gap-x-20 gap-y-12 max-w-[280px] mx-auto">
                {/* Front */}
                <button onClick={() => setSelectedTyre(1)} className={`w-14 h-24 rounded-lg flex items-center justify-center transition-all ${getStatusColor(tyres.find(t=>t.id===1)?.status || TyreStatus.NEW)} shadow-lg active:scale-90`}><span className="text-zinc-950 font-black text-xs">FL</span></button>
                <button onClick={() => setSelectedTyre(2)} className={`w-14 h-24 rounded-lg flex items-center justify-center transition-all ${getStatusColor(tyres.find(t=>t.id===2)?.status || TyreStatus.NEW)} shadow-lg active:scale-90`}><span className="text-zinc-950 font-black text-xs">FR</span></button>
                {/* Middle */}
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedTyre(3)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===3)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                  <button onClick={() => setSelectedTyre(4)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===4)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedTyre(5)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===5)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                  <button onClick={() => setSelectedTyre(6)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===6)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                </div>
                {/* Rear */}
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedTyre(7)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===7)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                  <button onClick={() => setSelectedTyre(8)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===8)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedTyre(9)} className={`w-7 h-24 rounded-l-lg ${getStatusColor(tyres.find(t=>t.id===9)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                  <button onClick={() => setSelectedTyre(10)} className={`w-7 h-24 rounded-r-lg ${getStatusColor(tyres.find(t=>t.id===10)?.status || TyreStatus.NEW)} shadow-sm`}></button>
                </div>
             </div>
          </div>
        </div>

        {selectedTyre && (
          <div className="bg-zinc-800 p-6 rounded-3xl border border-safety-yellow/50 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
              <p className="font-black text-white uppercase italic tracking-tighter">Update Tyre #{selectedTyre}</p>
              <button onClick={() => setSelectedTyre(null)} className="text-zinc-500 font-bold text-xs uppercase">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(TyreStatus).map(status => (
                <button 
                  key={status}
                  onClick={() => { onUpdateTyre(selectedTyre, status); setSelectedTyre(null); }}
                  className="bg-zinc-900 border border-zinc-700 py-3 rounded-xl text-[10px] font-black uppercase text-zinc-400 active:bg-safety-yellow active:text-zinc-950 transition-all"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MANAGE VEHICLES OVERLAY */}
      {showManageVehicles && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-md p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Manage Fleet</h2>
            <button onClick={() => setShowManageVehicles(false)} className="bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-8">
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <p className="text-[10px] font-black uppercase text-zinc-500">Register New Truck</p>
              <input type="text" placeholder="Registration No (e.g. MH04...)" value={newVehReg} onChange={e=>setNewVehReg(e.target.value)} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold focus:border-safety-yellow transition-all" />
              <input type="number" placeholder="Current Odometer Reading" value={newVehOdo} onChange={e=>setNewVehOdo(e.target.value)} className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-bold focus:border-safety-yellow transition-all" />
              <button 
                onClick={()=>{ if(newVehReg){ onAddVehicle({reg_number: newVehReg, current_odometer: Number(newVehOdo)}); setNewVehReg(''); setNewVehOdo(''); } }} 
                className="w-full bg-safety-yellow text-zinc-950 py-4 rounded-xl font-black uppercase shadow-lg active:scale-95"
              >
                Add Vehicle
              </button>
            </div>
            <div className="space-y-3 pb-20">
              {vehicles.map(v => (
                <div key={v.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center group">
                  {editingVehId === v.id ? (
                    <div className="flex-1 flex gap-2">
                      <input value={v.reg_number} onChange={e=>onUpdateVehicle(v.id, {reg_number: e.target.value})} className="flex-1 bg-zinc-800 rounded px-2 py-1 text-white font-bold" />
                      <button onClick={()=>setEditingVehId(null)} className="text-emerald-500 p-1"><X className="rotate-45"/></button>
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
    </div>
  );
};

export default MaintenanceView;
