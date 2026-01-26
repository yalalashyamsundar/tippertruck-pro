
import React, { useState } from 'react';
import { Trip, Expense, FuelLog, Driver } from '../types';
import { TrendingUp, Truck, ShieldCheck, Share2, MapPin, Plus, Fuel, ClipboardList, UserPlus, Users, Calendar } from 'lucide-react';
import { getNearbyFuelStations } from '../services/geminiService';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  drivers: Driver[];
  nextServiceKm: number;
  onQuickAction: (type: 'trip' | 'fuel' | 'collab') => void;
  onAdminClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trips, expenses, fuelLogs, drivers, nextServiceKm, onQuickAction, onAdminClick }) => {
  const [sharing, setSharing] = useState(false);
  const [checkingMaps, setCheckingMaps] = useState(false);
  const [mapsResult, setMapsResult] = useState<any>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayTrips = trips.filter(t => t.created_at.startsWith(today));
  
  const totalTonnage = todayTrips.reduce((acc, t) => acc + (t.unit === 'Tons' ? t.quantity : 0), 0);
  const totalRevenue = todayTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);

  // Driver Stats (Permanent)
  const permanentDrivers = drivers.filter(d => d.type === 'Permanent');
  const driverStats = permanentDrivers.map(d => {
    const driverTrips = trips.filter(t => t.driver_id === d.id);
    const uniqueDays = new Set(driverTrips.map(t => t.created_at.split('T')[0])).size;
    return { ...d, tripCount: driverTrips.length, presentDays: uniqueDays };
  });

  const generateTableReport = () => {
    let report = `🚜 DAILY TIPPER REPORT - ${today}\n`;
    report += `------------------------------------\n`;
    report += `TRIPS SUMMARY\n`;
    report += `ID | Site | Material | Qty | Rate\n`;
    report += `---|------|----------|-----|-----\n`;
    todayTrips.forEach((t, i) => {
      report += `${i+1} | ${t.site_name.substring(0,4)} | ${t.material_type.substring(0,5)} | ${t.quantity}${t.unit === 'trips' ? 'tr' : (t.unit === 'Tons' ? 't' : 'cf')} | ₹${t.rate}\n`;
    });
    report += `------------------------------------\n`;
    report += `Total Trips: ${todayTrips.length}\n`;
    report += `Total Rev: ₹${totalRevenue.toLocaleString()}\n`;
    report += `------------------------------------\n`;
    return report;
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const tableText = generateTableReport();
      if (navigator.share) {
        await navigator.share({ title: `Report ${today}`, text: tableText });
      } else {
        await navigator.clipboard.writeText(tableText);
        alert('Table report copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  const handleCheckStations = () => {
    setCheckingMaps(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await getNearbyFuelStations(pos.coords.latitude, pos.coords.longitude);
      setMapsResult(res);
      setCheckingMaps(false);
    }, () => {
      setMapsResult("Geolocation access denied.");
      setCheckingMaps(false);
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Live Status</h2>
          <p className="text-3xl font-black text-white italic">QUARRY DASH</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onAdminClick} className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 text-safety-yellow shadow-lg"><ShieldCheck size={24} /></button>
          <button onClick={handleShare} disabled={sharing} className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 active:scale-95 transition-transform"><Share2 size={24} className={sharing ? 'animate-pulse' : 'text-safety-yellow'} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border-l-4 border-safety-yellow shadow-xl">
          <div className="flex items-center gap-2 mb-2 text-zinc-400"><TrendingUp size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">Today's Trips</span></div>
          <p className="text-4xl font-black text-white">{todayTrips.length}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border-l-4 border-blue-500 shadow-xl">
          <div className="flex items-center gap-2 mb-2 text-zinc-400"><Truck size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">Revenue</span></div>
          <p className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Driver Stats Widget */}
      <div className="space-y-3">
        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Users size={18} /> Driver Performance</h3>
        <div className="grid grid-cols-1 gap-3">
          {driverStats.map(ds => (
            <div key={ds.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-lg">{ds.name}</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase">Permanent Staff</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Days</p>
                  <p className="text-xl font-black text-white">{ds.presentDays}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Trips</p>
                  <p className="text-xl font-black text-safety-yellow">{ds.tripCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Truck size={18} /> Vehicle Health</h3>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-safety-yellow"><ShieldCheck size={24} /></div>
              <div><p className="font-bold text-white">Service Due In</p><p className="text-xs text-zinc-500 uppercase font-black">{nextServiceKm} KM</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleCheckStations} disabled={checkingMaps} className="w-full bg-zinc-800 hover:bg-zinc-700 py-4 px-6 rounded-2xl border-2 border-zinc-700 flex items-center justify-center gap-3 transition-colors disabled:opacity-50"><MapPin size={24} className="text-safety-yellow" /><span className="font-bold uppercase tracking-widest">{checkingMaps ? 'Searching...' : 'Fuel Stations Near Me'}</span></button>
        {mapsResult && <div className="mt-4 p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-sm leading-relaxed text-zinc-300">{typeof mapsResult === 'string' ? mapsResult : mapsResult.text}</div>}
      </div>

      {/* Multi-action FAB */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3">
        {showFabMenu && (
          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3">
              <span className="bg-zinc-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-xl">Add Trip</span>
              <button onClick={() => { onQuickAction('trip'); setShowFabMenu(false); }} className="bg-zinc-800 p-4 rounded-full border border-zinc-700 text-safety-yellow shadow-2xl"><ClipboardList size={24} /></button>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-zinc-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-xl">Add Fuel</span>
              <button onClick={() => { onQuickAction('fuel'); setShowFabMenu(false); }} className="bg-zinc-800 p-4 rounded-full border border-zinc-700 text-emerald-500 shadow-2xl"><Fuel size={24} /></button>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-zinc-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-xl">Add Collab</span>
              <button onClick={() => { onQuickAction('collab'); setShowFabMenu(false); }} className="bg-zinc-800 p-4 rounded-full border border-zinc-700 text-blue-500 shadow-2xl"><UserPlus size={24} /></button>
            </div>
          </div>
        )}
        <button onClick={() => setShowFabMenu(!showFabMenu)} className={`bg-safety-yellow text-zinc-950 p-5 rounded-full shadow-2xl transition-transform duration-200 ${showFabMenu ? 'rotate-45' : ''}`}><Plus size={32} strokeWidth={3} /></button>
      </div>
    </div>
  );
};

export default Dashboard;
