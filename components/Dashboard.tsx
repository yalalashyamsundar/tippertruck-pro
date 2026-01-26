
import React, { useState, useMemo, useEffect } from 'react';
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
  Briefcase,
  IndianRupee,
  Route,
  X,
  FileText,
  Download
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  drivers: Driver[];
  nextServiceKm: number;
  onQuickAction: (type: 'trip' | 'fuel' | 'collab') => void;
  onAdminClick: () => void;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColorClass: string;
  valueColorClass: string;
  borderColorClass: string;
  bgColorClass: string;
}> = ({ title, value, icon, iconColorClass, valueColorClass, borderColorClass, bgColorClass }) => (
  <div className={`p-3 rounded-2xl border ${borderColorClass} ${bgColorClass} shadow-md flex flex-col justify-between min-h-[80px]`}>
    <div className="flex justify-between items-start">
      <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider leading-tight max-w-[60px]">
        {title}
      </span>
      <div className={`p-1.5 rounded-lg ${iconColorClass} bg-opacity-20`}>
        {icon}
      </div>
    </div>
    <div className={`text-xl font-black ${valueColorClass} tracking-tighter mt-1`}>
      {value}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  trips, expenses, fuelLogs, drivers, nextServiceKm, onQuickAction, onAdminClick 
}) => {
  const [sharing, setSharing] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTrips = trips.filter(t => t.created_at.startsWith(todayStr));
  
  const todayRevenue = todayTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);
  const todayTonnage = todayTrips
    .filter(t => t.unit === 'Tons')
    .reduce((acc, t) => acc + t.quantity, 0);
  
  const todayFuel = fuelLogs
    .filter(f => f.created_at.startsWith(todayStr))
    .reduce((acc, f) => acc + f.liters, 0);

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

  const generatePDF = async () => {
    setSharing(true);
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Header
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 215, 0); // Safety Yellow
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("TIPPERLOG", margin, 35);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Daily Performance Report - ${format(new Date(), 'PPP')}`, margin, 42);

    y = 65;
    
    // Performance Summary Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Today's Summary", margin, y);
    y += 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    const data = [
      ["Metric", "Value"],
      ["Total Trips", todayTrips.length.toString()],
      ["Tonnage Moved", `${todayTonnage.toFixed(1)} T`],
      ["Revenue", `INR ${todayRevenue.toLocaleString()}`],
      ["Fuel Used", `${todayFuel.toFixed(1)} L`],
    ];

    doc.setFontSize(11);
    data.forEach((row, i) => {
      if (i === 0) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(row[0], margin, y);
      doc.text(row[1], 100, y);
      y += 8;
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Staff Activity", margin, y);
    y += 10;

    driverStats.forEach(ds => {
      doc.setFont("helvetica", "normal");
      doc.text(`${ds.name}: ${ds.tripCount} trips (${ds.presentDays} active days)`, margin, y);
      y += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by TipperPro Quarry Manager", margin, 285);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfBlob(blob);
    setPdfUrl(url);
    setSharing(false);
  };

  const handleSharePDF = async () => {
    if (!pdfBlob) return;
    
    try {
      const file = new File([pdfBlob], `TipperReport_${todayStr}.pdf`, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Daily Tipper Report',
          text: `Performance report for ${todayStr}`,
        });
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.href = pdfUrl!;
        link.download = `TipperReport_${todayStr}.pdf`;
        link.click();
      }
    } catch (err) {
      console.error("Sharing failed", err);
    }
  };

  const closePreview = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfBlob(null);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-white italic tracking-tighter">Today's Performance</h2>
        <button 
          onClick={generatePDF}
          disabled={sharing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-safety-yellow text-safety-yellow font-bold text-[10px] uppercase tracking-wide hover:bg-safety-yellow/10 transition-colors disabled:opacity-50"
        >
          <Share2 size={12} />
          {sharing ? 'Generating...' : 'Share Report'}
        </button>
      </div>

      {/* PDF Preview Modal */}
      {pdfUrl && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <FileText className="text-safety-yellow" size={24} />
                <h3 className="font-black uppercase tracking-tighter text-white">Report Preview</h3>
              </div>
              <button onClick={closePreview} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden p-2 bg-zinc-800">
              <iframe 
                src={pdfUrl} 
                className="w-full h-full rounded-xl"
                title="PDF Preview"
              />
            </div>
            
            <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex gap-3">
               <button 
                onClick={handleSharePDF}
                className="flex-1 bg-safety-yellow text-zinc-950 py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
              >
                <Share2 size={18} />
                Share Report
              </button>
              <a 
                href={pdfUrl} 
                download={`Report_${todayStr}.pdf`}
                className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl border border-zinc-700 active:scale-95"
              >
                <Download size={20} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Performance Grid - Half Sizing Version */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Total Trips"
          value={todayTrips.length}
          icon={<Route size={14} />}
          iconColorClass="text-safety-yellow"
          valueColorClass="text-safety-yellow"
          borderColorClass="border-safety-yellow/30"
          bgColorClass="bg-zinc-900/40"
        />
        <StatCard 
          title="Tonnage Moved"
          value={`${todayTonnage.toFixed(1)} T`}
          icon={<Truck size={14} />}
          iconColorClass="text-blue-400"
          valueColorClass="text-white"
          borderColorClass="border-blue-900/30"
          bgColorClass="bg-zinc-900/40"
        />
        <StatCard 
          title="Revenue"
          value={`₹${todayRevenue.toLocaleString()}`}
          icon={<IndianRupee size={14} />}
          iconColorClass="text-emerald-500"
          valueColorClass="text-emerald-500"
          borderColorClass="border-emerald-900/30"
          bgColorClass="bg-zinc-900/40"
        />
        <StatCard 
          title="Fuel Used"
          value={`${todayFuel.toFixed(1)} L`}
          icon={<Fuel size={14} />}
          iconColorClass="text-zinc-500"
          valueColorClass="text-white"
          borderColorClass="border-zinc-800"
          bgColorClass="bg-zinc-900/40"
        />
      </div>

      {/* Performance Visualization Chart */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <BarChart3 size={14} className="text-safety-yellow" />
            Weekly Trends
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
        
        <div className="flex items-end justify-between h-32 pt-2 gap-2">
          {chartData.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center gap-0.5 items-end h-full">
                <div 
                  className="w-2 bg-safety-yellow rounded-t-sm chart-bar shadow-[0_0_8px_rgba(255,215,0,0.15)]" 
                  style={{ height: `${(day.trips / maxTrips) * 100}%` }}
                ></div>
                <div 
                  className="w-1 bg-zinc-700 rounded-t-sm chart-bar" 
                  style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                ></div>
              </div>
              <span className="text-[8px] font-black text-zinc-600 uppercase">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Stats Section */}
      <div className="space-y-3 mt-4">
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-1">
          <Users size={14} className="text-safety-yellow" />
          Staff Activity
        </h3>
        <div className="space-y-2">
          {driverStats.length > 0 ? driverStats.map(ds => (
            <div key={ds.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center shadow-md hover:border-zinc-700 transition-colors">
              <div>
                <p className="font-black text-white uppercase text-xs tracking-tight">{ds.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                   <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active Partner</p>
                </div>
              </div>
              <div className="flex gap-3 border-l border-zinc-800 pl-3">
                <div className="text-center">
                  <p className="text-[7px] text-zinc-600 font-black uppercase">Days</p>
                  <p className="text-sm font-black text-white">{ds.presentDays}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] text-zinc-600 font-black uppercase">Trips</p>
                  <p className="text-sm font-black text-safety-yellow">{ds.tripCount}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-zinc-900/50 p-4 rounded-2xl text-center border border-dashed border-zinc-800">
              <p className="text-zinc-600 text-[9px] font-black uppercase italic">No permanent staff registered</p>
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
