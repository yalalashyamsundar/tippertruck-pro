
import React, { useState } from 'react';
import { FuelLog, Expense, Vehicle } from '../types';
import { Fuel, Receipt, AlertTriangle, Droplets, Info } from 'lucide-react';

interface ExpensesViewProps {
  fuelLogs: FuelLog[];
  vehicles: Vehicle[];
  onAddFuel: (log: Omit<FuelLog, 'id' | 'created_at' | 'calculated_mileage'>) => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ fuelLogs, vehicles, onAddFuel }) => {
  const [activeSubTab, setActiveSubTab] = useState<'fuel' | 'others'>('fuel');
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelData, setFuelData] = useState({
    liters: '',
    cost: '',
    odometer: '',
    station_name: 'Shell Bunk',
    vehicle_id: vehicles[0]?.id || '',
  });

  const lastFuel = fuelLogs[0];
  const avgMileage = fuelLogs.reduce((acc, log) => acc + (log.calculated_mileage || 0), 0) / (fuelLogs.length || 1);

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFuel({
      vehicle_id: fuelData.vehicle_id,
      liters: Number(fuelData.liters),
      cost: Number(fuelData.cost),
      odometer: Number(fuelData.odometer),
      station_name: fuelData.station_name,
    });
    setShowFuelForm(false);
    setFuelData({ ...fuelData, liters: '', cost: '', odometer: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Expenses</h2>

      <div className="flex bg-zinc-900 p-1.5 rounded-2xl gap-1 border border-zinc-800">
        <button onClick={() => setActiveSubTab('fuel')} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeSubTab === 'fuel' ? 'bg-safety-yellow text-zinc-950' : 'text-zinc-500'}`}>Fuel Logs</button>
        <button onClick={() => setActiveSubTab('others')} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeSubTab === 'others' ? 'bg-safety-yellow text-zinc-950' : 'text-zinc-500'}`}>Others</button>
      </div>

      {activeSubTab === 'fuel' ? (
        <div className="space-y-6">
          {!showFuelForm ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-4 rounded-2xl border-l-4 border-emerald-500 shadow-lg">
                  <div className="flex items-center gap-2 mb-2 text-zinc-400"><Droplets size={14} className="text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest">Avg Efficiency</span></div>
                  <p className="text-3xl font-black text-white">{(avgMileage || 0).toFixed(1)} <span className="text-xs text-zinc-500">KMPL</span></p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-2xl border-l-4 border-blue-500 shadow-lg">
                  <div className="flex items-center gap-2 mb-2 text-zinc-400"><Info size={14} className="text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest">Recent Odo</span></div>
                  <p className="text-3xl font-black text-white">{lastFuel?.odometer || 0}</p>
                </div>
              </div>
              <button onClick={() => setShowFuelForm(true)} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl"><Fuel size={24} /> Log Fuel</button>
              <div className="space-y-3">
                {fuelLogs.map((log) => (
                  <div key={log.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="font-black text-white text-lg">{log.liters || 0}L <span className="text-zinc-500 text-xs">@ ₹{((log.cost || 0)/(log.liters || 1)).toFixed(1)}</span></p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{vehicles.find(v=>v.id===log.vehicle_id)?.reg_number} • {new Date(log.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${(log.calculated_mileage || 0) < 3.5 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{(log.calculated_mileage || 0).toFixed(1)} KMPL</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleFuelSubmit} className="space-y-6">
              <h3 className="text-xl font-black uppercase italic">New Fuel Log</h3>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-zinc-500">Vehicle</label>
                <select value={fuelData.vehicle_id} onChange={(e)=>setFuelData({...fuelData, vehicle_id:e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold">{vehicles.map(v=><option key={v.id} value={v.id}>{v.reg_number}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black uppercase text-zinc-500">Liters</label><input type="number" step="0.1" value={fuelData.liters} onChange={(e)=>setFuelData({...fuelData, liters:e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white" required /></div>
                <div className="space-y-2"><label className="text-xs font-black uppercase text-zinc-500">Cost (₹)</label><input type="number" value={fuelData.cost} onChange={(e)=>setFuelData({...fuelData, cost:e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white" required /></div>
              </div>
              <div className="space-y-2"><label className="text-xs font-black uppercase text-zinc-500">Odo Reading</label><input type="number" value={fuelData.odometer} onChange={(e)=>setFuelData({...fuelData, odometer:e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white" required /></div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest">Save Log</button>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-6"><div className="bg-zinc-900/50 rounded-3xl p-10 border-2 border-dashed border-zinc-800 text-center"><Receipt size={48} className="text-zinc-700 mx-auto mb-4" /><p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] italic">Other expenses module coming soon</p></div></div>
      )}
    </div>
  );
};

export default ExpensesView;
