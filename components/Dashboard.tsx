
import React, { useState, useMemo } from 'react';
import { Trip, Expense, FuelLog, Driver, Vehicle } from '../types';
import { 
  Truck, 
  Share2, 
  Plus, 
  Fuel, 
  ClipboardList, 
  BarChart3,
  IndianRupee,
  Route,
  X,
  FileText,
  Download,
  ChevronDown,
  Clock,
  MapPin,
  Droplets
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  drivers: Driver[];
  vehicles: Vehicle[];
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
  onClick?: () => void;
}> = ({ title, value, icon, iconColorClass, valueColorClass, borderColorClass, bgColorClass, onClick }) => (
  <button 
    onClick={onClick}
    disabled={!onClick}
    className={`p-4 rounded-3xl border ${borderColorClass} ${bgColorClass} shadow-md flex flex-col justify-between min-h-[90px] transition-all duration-300 text-left w-full ${onClick ? 'active:scale-95 cursor-pointer hover:border-zinc-700' : ''}`}
  >
    <div className="flex justify-between items-start w-full">
      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider leading-tight max-w-[70px]">
        {title}
      </span>
      <div className={`p-2 rounded-xl ${iconColorClass} bg-opacity-20`}>
        {icon}
      </div>
    </div>
    <div className={`text-2xl font-black ${valueColorClass} tracking-tighter mt-2`}>
      {value}
    </div>
  </button>
);

const AreaChart: React.FC<{ data: { label: string, trips: number, revenue: number }[] }> = ({ data }) => {
  const width = 400;
  const height = 150;
  const padding = 20;

  const maxTrips = Math.max(...data.map(d => d.trips), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  const getPoints = (type: 'trips' | 'revenue') => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const val = type === 'trips' ? d.trips : d.revenue;
      const max = type === 'trips' ? maxTrips : maxRevenue;
      const y = height - ((val / max) * (height - padding * 2) + padding);
      return { x, y };
    });
  };

  const revenuePoints = getPoints('revenue');
  const tripPoints = getPoints('trips');

  const createPath = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      const yMid = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x} ${points[i].y}, ${xMid} ${yMid}`;
    }
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return path;
  };

  const revenuePath = createPath(revenuePoints);
  const tripPath = createPath(tripPoints);
  
  const revenueFill = `${revenuePath} L ${revenuePoints[revenuePoints.length - 1].x} ${height} L ${revenuePoints[0].x} ${height} Z`;

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid Lines */}
        {data.map((_, i) => (
          <line 
            key={i} 
            x1={(i / (data.length - 1)) * (width - padding * 2) + padding} 
            y1={0} 
            x2={(i / (data.length - 1)) * (width - padding * 2) + padding} 
            y2={height} 
            stroke="#27272a" 
            strokeWidth="1"
          />
        ))}

        {/* Revenue Area */}
        <path d={revenueFill} fill="url(#revenueGradient)" />
        <path d={revenuePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        
        {/* Trip Line */}
        <path d={tripPath} fill="none" stroke="#FFD700" strokeWidth="2" strokeDasharray="4 2" strokeOpacity="0.6" />

        {/* Dots */}
        {revenuePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[8px] font-black text-zinc-600 uppercase">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  trips, expenses, fuelLogs, drivers, vehicles, nextServiceKm, onQuickAction, onAdminClick 
}) => {
  const [sharing, setSharing] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  
  const [showTripsModal, setShowTripsModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);

  // Filter logic based on vehicle
  const filteredTrips = useMemo(() => {
    if (selectedVehicleId === 'all') return trips;
    return trips.filter(t => t.vehicle_id === selectedVehicleId);
  }, [trips, selectedVehicleId]);

  const filteredFuel = useMemo(() => {
    if (selectedVehicleId === 'all') return fuelLogs;
    return fuelLogs.filter(f => f.vehicle_id === selectedVehicleId);
  }, [fuelLogs, selectedVehicleId]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTrips = filteredTrips.filter(t => t.created_at.startsWith(todayStr));
  const todayFuelLogs = filteredFuel.filter(f => f.created_at.startsWith(todayStr));
  
  const todayRevenue = todayTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);
  const todayTonnage = todayTrips
    .filter(t => t.unit === 'Tons')
    .reduce((acc, t) => acc + t.quantity, 0);
  
  const todayFuelValue = todayFuelLogs.reduce((acc, f) => acc + f.liters, 0);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayTrips = filteredTrips.filter(t => isSameDay(parseISO(t.created_at), date));
      const dayRevenue = dayTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);
      return {
        label: format(date, 'EEE'),
        trips: dayTrips.length,
        revenue: dayRevenue
      };
    });
  }, [filteredTrips]);

  const driverStats = useMemo(() => {
    const permanentDrivers = drivers.filter(d => d.type === 'Permanent');
    return permanentDrivers.map(d => {
      const drvTrips = filteredTrips.filter(t => t.driver_id === d.id);
      const uniqueDays = new Set(drvTrips.map(t => t.created_at.split('T')[0])).size;
      return { ...d, tripCount: drvTrips.length, presentDays: uniqueDays };
    });
  }, [drivers, filteredTrips]);

  const generatePDF = async () => {
    setSharing(true);
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 215, 0);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("TIPPERLOG", margin, 35);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Performance Report: ${selectedVehicleId === 'all' ? 'Full Fleet' : vehicles.find(v=>v.id===selectedVehicleId)?.reg_number}`, margin, 42);
    doc.text(`${format(new Date(), 'PPP')}`, 150, 42);

    y = 65;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Today's Summary", margin, y);
    y += 10;
    doc.line(margin, y, 190, y);
    y += 10;

    const data = [
      ["Metric", "Value"],
      ["Total Trips", todayTrips.length.toString()],
      ["Tonnage Moved", `${todayTonnage.toFixed(1)} T`],
      ["Revenue", `INR ${todayRevenue.toLocaleString()}`],
      ["Fuel Logged", `${todayFuelValue.toFixed(1)} L`],
    ];

    doc.setFontSize(11);
    data.forEach((row, i) => {
      if (i === 0) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(row[0], margin, y);
      doc.text(row[1], 100, y);
      y += 8;
    });

    const blob = doc.output('blob');
    setPdfBlob(blob);
    setPdfUrl(URL.createObjectURL(blob));
    setSharing(false);
  };

  const handleSharePDF = async () => {
    if (!pdfBlob) return;
    try {
      const file = new File([pdfBlob], `Report_${todayStr}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Daily Report', text: `Report for ${todayStr}` });
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl!;
        link.download = `Report_${todayStr}.pdf`;
        link.click();
      }
    } catch (err) { console.error("Sharing failed", err); }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Vehicle Selection Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 text-safety-yellow">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fleet Control</p>
              <div className="relative flex items-center gap-2">
                <select 
                  value={selectedVehicleId} 
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-transparent text-white font-black italic uppercase tracking-tight text-lg outline-none appearance-none pr-6 cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900">All Vehicles</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-zinc-900">{v.reg_number}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-safety-yellow absolute right-0 pointer-events-none" />
              </div>
            </div>
          </div>
          <button 
            onClick={generatePDF}
            disabled={sharing}
            className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700 text-safety-yellow active:scale-90 transition-transform disabled:opacity-50"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Detail Modals */}
      {showTripsModal && (
        <div className="fixed inset-0 z-[110] bg-zinc-950/80 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Route className="text-safety-yellow" size={24} />
                <h3 className="font-black uppercase tracking-tighter text-white">Trips Detail (Today)</h3>
              </div>
              <button onClick={() => setShowTripsModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {todayTrips.length === 0 ? (
                <p className="text-zinc-600 font-bold uppercase text-xs italic text-center py-10">No trips recorded today</p>
              ) : (
                todayTrips.map(trip => (
                  <div key={trip.id} className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
                        <Clock size={10} /> {format(parseISO(trip.created_at), 'hh:mm a')}
                      </span>
                      <span className="text-safety-yellow font-black text-lg italic uppercase">{trip.quantity} {trip.unit}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-white font-black text-sm uppercase italic leading-none">{trip.material_type}</h4>
                        <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1 flex items-center gap-1">
                          <MapPin size={8} /> {trip.site_name}
                        </p>
                      </div>
                      <span className="text-emerald-500 font-black text-xs">₹{(trip.quantity * trip.rate).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showFuelModal && (
        <div className="fixed inset-0 z-[110] bg-zinc-950/80 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Fuel className="text-emerald-500" size={24} />
                <h3 className="font-black uppercase tracking-tighter text-white">Fuel Logs (Today)</h3>
              </div>
              <button onClick={() => setShowFuelModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {todayFuelLogs.length === 0 ? (
                <p className="text-zinc-600 font-bold uppercase text-xs italic text-center py-10">No fuel records today</p>
              ) : (
                todayFuelLogs.map(log => (
                  <div key={log.id} className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
                        <Clock size={10} /> {format(parseISO(log.created_at), 'hh:mm a')}
                      </span>
                      <span className="text-emerald-500 font-black text-lg italic uppercase">{log.liters} L</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-white font-black text-sm uppercase italic leading-none">{log.station_name}</h4>
                        <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1 flex items-center gap-1">
                          <Droplets size={8} /> ODO: {log.odometer} KM
                        </p>
                      </div>
                      <span className="text-emerald-400 font-black text-xs">₹{log.cost.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfUrl && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/80 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <FileText className="text-safety-yellow" size={24} />
                <h3 className="font-black uppercase tracking-tighter text-white">Report Preview</h3>
              </div>
              <button onClick={() => { setPdfUrl(null); setPdfBlob(null); }} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-2 bg-zinc-800">
              <iframe src={pdfUrl} className="w-full h-full rounded-xl" title="PDF Preview" />
            </div>
            <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex gap-3">
              <button onClick={handleSharePDF} className="flex-1 bg-safety-yellow text-zinc-950 py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
                <Share2 size={18} /> Share Report
              </button>
              <a href={pdfUrl} download={`Report_${todayStr}.pdf`} className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl border border-zinc-700 active:scale-95">
                <Download size={20} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest italic">Today's Pulse</h2>
        <span className="text-[10px] font-bold text-zinc-600 uppercase">{format(new Date(), 'PP')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Total Trips"
          value={todayTrips.length}
          icon={<Route size={16} />}
          iconColorClass="text-safety-yellow"
          valueColorClass="text-safety-yellow"
          borderColorClass="border-safety-yellow/20"
          bgColorClass="bg-zinc-900/40"
          onClick={() => setShowTripsModal(true)}
        />
        <StatCard 
          title="Tonnage Moved"
          value={`${todayTonnage.toFixed(1)} T`}
          icon={<Truck size={16} />}
          iconColorClass="text-blue-400"
          valueColorClass="text-white"
          borderColorClass="border-blue-900/20"
          bgColorClass="bg-zinc-900/40"
        />
        <StatCard 
          title="Revenue"
          value={`₹${todayRevenue.toLocaleString()}`}
          icon={<IndianRupee size={16} />}
          iconColorClass="text-emerald-500"
          valueColorClass="text-emerald-500"
          borderColorClass="border-emerald-900/20"
          bgColorClass="bg-zinc-900/40"
        />
        <StatCard 
          title="Fuel Logged"
          value={`${todayFuelValue.toFixed(1)} L`}
          icon={<Fuel size={16} />}
          iconColorClass="text-zinc-500"
          valueColorClass="text-white"
          borderColorClass="border-zinc-800"
          bgColorClass="bg-zinc-900/40"
          onClick={() => setShowFuelModal(true)}
        />
      </div>

      {/* Weekly Trends Chart */}
      <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-6 mt-4 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-safety-yellow/10 p-2 rounded-xl text-safety-yellow">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Weekly Insights</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full border border-safety-yellow"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase">Workload</span>
            </div>
          </div>
        </div>
        
        <AreaChart data={chartData} />
      </div>

      {/* Staff Activity */}
      <div className="space-y-3 mt-4">
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-1">
          Staff Performance (Selected Context)
        </h3>
        <div className="space-y-2">
          {driverStats.length > 0 ? driverStats.map(ds => (
            <div key={ds.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex justify-between items-center shadow-md hover:border-zinc-700 transition-all group">
              <div>
                <p className="font-black text-white uppercase text-sm tracking-tight group-hover:text-safety-yellow transition-colors">{ds.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active Partner</p>
                </div>
              </div>
              <div className="flex gap-5 border-l border-zinc-800 pl-5">
                <div className="text-center">
                  <p className="text-[8px] text-zinc-600 font-black uppercase mb-0.5">Active</p>
                  <p className="text-lg font-black text-white">{ds.presentDays}<span className="text-[9px] ml-0.5 opacity-40">D</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-zinc-600 font-black uppercase mb-0.5">Output</p>
                  <p className="text-lg font-black text-safety-yellow">{ds.tripCount}<span className="text-[9px] ml-0.5 opacity-40">T</span></p>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-zinc-900/50 p-6 rounded-3xl text-center border border-dashed border-zinc-800">
              <p className="text-zinc-600 text-[10px] font-black uppercase italic">No staff activity for selected truck</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB Menu */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3">
        {showFabMenu && (
          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 mb-2">
            {[
              { id: 'trip', label: 'Log General Trip', icon: ClipboardList, color: 'text-safety-yellow' },
              { id: 'collab', label: 'Log Partner Trip', icon: IndianRupee, color: 'text-blue-500' },
              { id: 'fuel', label: 'Record Diesel', icon: Fuel, color: 'text-emerald-500' }
            ].map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="bg-zinc-900 px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-white shadow-2xl border border-zinc-800">{item.label}</span>
                <button 
                  onClick={() => { onQuickAction(item.id as any); setShowFabMenu(false); }}
                  className={`bg-zinc-800 p-4 rounded-full border border-zinc-700 ${item.color} shadow-2xl active:scale-90`}
                >
                  <item.icon size={24} />
                </button>
              </div>
            ))}
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
