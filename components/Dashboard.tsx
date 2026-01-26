
import React, { useState, useMemo } from 'react';
import { Trip, Expense, FuelLog, Driver } from '../types';
import { 
  TrendingUp, 
  Truck, 
  Share2, 
  Plus, 
  Fuel, 
  ClipboardList, 
  Users, 
  BarChart3,
  Briefcase
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO } from 'date-fns';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  drivers: Driver[];
  nextServiceKm: number;
  onQuickAction: (type: 'trip' | 'fuel' | 'collab') => void;
  onAdminClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  trips, expenses, fuelLogs, drivers, nextServiceKm, onQuickAction, onAdminClick 
}) => {
  const [sharing, setSharing] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTrips = trips.filter(t => t.created_at.startsWith(todayStr));
  const totalRevenue = todayTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);

  // Performance Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayTrips = trips.filter(t => isSameDay(parseISO(t.created_at), date));
      const dayRevenue = dayTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);
      return {
        label: format(date, 'EEE'),
        trips: dayTrips.length,
        revenue: dayRevenue,
        fullDate: format(date, 'MMM d')
      };
    }).reverse();
  }, [trips]);

  const maxTrips = Math.max(...chartData.map(d => d.trips), 1);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Permanent Driver Stats
  const permanentDrivers = drivers.filter(d => d.type === 'Permanent');
  const driverStats = permanentDrivers.map(d => {
    const driverTrips = trips.filter(t => t.driver_id === d.id);
    const uniqueDays = new Set(driverTrips.map(t => t.created_at.split('T')[0])).size;
    return { ...d, tripCount: driverTrips.length, presentDays: uniqueDays };
  });

  const generateTableReport = () => {
    let report = `🚜 DAILY TIPPER REPORT - ${todayStr}\n`;
    report += `------------------------------------\n`;
    report += `TRIPS SUMMARY\n`;
    report += `ID | Site | Material | Qty | Rate\n`;
    report += `---|------|----------|-----|-----\n`;
    todayTrips.forEach((t, i) => {
      report += `${i+1} | ${t.site_name.substring(0,4)} | ${t.material_type.substring(0,5)} | ${t.quantity}${t.unit === 'trips' ? 'tr' : 't'} | ₹${t.rate}\n`;
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
        await navigator.share({ title: `Report ${todayStr}`, text: tableText });
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

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Overview</h2>
          <p className="text-3xl font-black text-white italic">DASHBOARD</p>
        </div>
        <button 
          onClick={handleShare}
          disabled={sharing}
          className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 text-zinc-400 active:scale-95 transition-all shadow-lg"
        >
          <Share2 size={24} className={sharing ? 'animate-pulse' : ''} />
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-safety-yellow opacity-5 rounded-full group-hover:scale-150 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <TrendingUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Today Trips</span>
          </div>
          <p className="text-4xl font-black text-white leading-none">{todayTrips.length}</p>
          <div className="mt-3 w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="bg-safety-yellow h-full" style={{ width: `${Math.min((todayTrips.length / 10) * 100, 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-emerald-500 opacity-5 rounded-full group-hover:scale-150 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <Truck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Rev Today</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">₹{(totalRevenue/1000).toFixed(1)}k</p>
          <p className="text-[10px] text-zinc-600 font-bold mt-1">Total: ₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Performance Visualization Chart */}
      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <BarChart3 size={14} className="text-safety-yellow" />
            Weekly Performance
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-safety-yellow"></div>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Trips</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Rev</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-40 pt-2 gap-2">
          {chartData.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center gap-0.5 items-end h-full">
                {/* Trips Bar */}
                <div 
                  className="w-2.5 bg-safety-yellow rounded-t-sm chart-bar shadow-[0_0_10px_rgba(255,215,0,0.2)]" 
                  style={{ height: `${(day.trips / maxTrips) * 100}%` }}
                ></div>
                {/* Revenue Bar */}
                <div 
                  className="w-1.5 bg-zinc-700 rounded-t-sm chart-bar" 
                  style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-black text-zinc-600 uppercase">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Stats Section */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-1">
          <Users size={14} className="text-safety-yellow" />
          Staff Activity
        </h3>
        <div className="space-y-3">
          {driverStats.length > 0 ? driverStats.map(ds => (
            <div key={ds.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex justify-between items-center shadow-lg hover:border-zinc-700 transition-colors">
              <div>
                <p className="font-black text-white uppercase text-sm tracking-tight">{ds.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Partner</p>
                </div>
              </div>
              <div className="flex gap-4 border-l border-zinc-800 pl-4">
                <div className="text-center">
                  <p className="text-[8px] text-zinc-600 font-black uppercase">Days</p>
                  <p className="text-lg font-black text-white">{ds.presentDays}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-zinc-600 font-black uppercase">Trips</p>
                  <p className="text-lg font-black text-safety-yellow">{ds.tripCount}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-zinc-900/50 p-6 rounded-3xl text-center border border-dashed border-zinc-800">
              <p className="text-zinc-600 text-[10px] font-black uppercase italic">No permanent staff registered</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Multiaction FAB */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3">
        {showFabMenu && (
          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 mb-2">
            <div className="flex items-center gap-3">
              <span className="bg-zinc-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white shadow-2xl border border-zinc-800">Add General Trip</span>
              <button 
                onClick={() => { onQuickAction('trip'); setShowFabMenu(false); }}
                className="bg-zinc-800 p-4 rounded-full border border-zinc-700 text-safety-yellow shadow-2xl active:scale-90"
              >
                <ClipboardList size={24} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-zinc-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white shadow-2xl border border-zinc-800">Add to Collaborator</span>
              <button 
                onClick={() => { onQuickAction('collab'); setShowFabMenu(false); }}
                className="bg-zinc-800 p-4 rounded-full border border-zinc-700 text-blue-500 shadow-2xl active:scale-90"
              >
                <Briefcase size={24} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-zinc-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white shadow-2xl border border-zinc-800">Add Fuel Log</span>
              <button 
                onClick={() => { onQuickAction('fuel'); setShowFabMenu(false); }}
                className="bg-zinc-800 p-4 rounded-full border border-zinc-700 text-emerald-500 shadow-2xl active:scale-90"
              >
                <Fuel size={24} />
              </button>
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`bg-safety-yellow text-zinc-950 p-5 rounded-full shadow-2xl transition-transform duration-300 border-4 border-zinc-950 ${showFabMenu ? 'rotate-45 scale-110' : 'scale-100'}`}
        >
          <Plus size={32} strokeWidth={4} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;