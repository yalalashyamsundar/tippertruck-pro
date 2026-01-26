
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Collaborator, Driver, Vehicle, Material } from '../types';
import { 
  Plus, 
  Camera, 
  MapPin, 
  IndianRupee, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  UserPlus,
  Briefcase,
  Share2,
  Trash2,
  Settings,
  Edit2,
  X,
  Filter
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';

interface TripsViewProps {
  trips: Trip[];
  collaborators: Collaborator[];
  drivers: Driver[];
  vehicles: Vehicle[];
  materials: Material[];
  onAddTrip: (trip: Omit<Trip, 'id' | 'created_at'> & { created_at?: string }) => void;
  onAddCollaborator: (name: string) => void;
  onUpdateCollaborator: (id: string, name: string) => void;
  onDeleteCollaborator: (id: string) => void;
  onAddMaterial: (name: string) => void;
  onDeleteMaterial: (id: string) => void;
  onUpdateMaterial: (id: string, name: string) => void;
}

const TripsView: React.FC<TripsViewProps> = ({ 
  trips, collaborators, drivers, vehicles, materials, 
  onAddTrip, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator, onAddMaterial, onDeleteMaterial, onUpdateMaterial 
}) => {
  // REQUIREMENT 6: Landing Default is Collab
  const [subTab, setSubTab] = useState<'general' | 'collaboration'>('collaboration');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showManageCollabs, setShowManageCollabs] = useState(false);
  const [showManageMaterials, setShowManageMaterials] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  
  const [newCollabName, setNewCollabName] = useState('');
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [newMaterialName, setNewMaterialName] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    site_name: '',
    material_type: '',
    quantity: '',
    unit: 'trips' as any,
    rate: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    vehicle_id: vehicles[0]?.id || '',
    driver_id: drivers[0]?.id || '',
  });

  // REQUIREMENT 2: Set defaults based on contract type
  useEffect(() => {
    if (subTab === 'collaboration') {
      setFormData(prev => ({
        ...prev,
        material_type: 'Top Soil',
        unit: 'trips'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        material_type: materials.find(m => m.name !== 'Top Soil')?.name || materials[0]?.name || '',
        unit: 'Tons'
      }));
    }
  }, [subTab, materials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tripDate = parseISO(formData.date);
    const now = new Date();
    tripDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    onAddTrip({
      vehicle_id: formData.vehicle_id,
      driver_id: formData.driver_id,
      site_name: formData.site_name,
      material_type: formData.material_type,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      rate: Number(formData.rate),
      created_at: tripDate.toISOString(),
      contract_type: subTab,
      collaborator_id: subTab === 'collaboration' ? selectedCollabId || undefined : undefined,
    });
    setShowAddForm(false);
    setFormData(prev => ({ ...prev, quantity: '', rate: '', site_name: '' }));
  };

  const handleShareCollabReport = async () => {
    if (!selectedCollabId) return;
    const collab = collaborators.find(c => c.id === selectedCollabId);
    const dateStr = format(selectedDate, 'PP');
    let text = `📑 COLLAB REPORT: ${collab?.name}\n📅 Date: ${dateStr}\n----------------\n`;
    filteredTrips.forEach((t, i) => {
      text += `${i+1}. ${t.material_type} - ${t.quantity} ${t.unit} @ ₹${t.rate}\n`;
    });
    const total = filteredTrips.reduce((acc, t) => acc + (t.quantity * t.rate), 0);
    text += `----------------\nTotal Payable: ₹${total.toLocaleString()}\n`;
    
    if (navigator.share) await navigator.share({ text });
    else {
      await navigator.clipboard.writeText(text);
      alert('Collab report copied!');
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const isDateMatch = isSameDay(parseISO(trip.created_at), selectedDate);
      const isTypeMatch = trip.contract_type === subTab;
      const isCollabMatch = subTab === 'general' || (trip.collaborator_id === selectedCollabId);
      return isDateMatch && isTypeMatch && isCollabMatch;
    });
  }, [trips, selectedDate, subTab, selectedCollabId]);

  const tripDates = useMemo(() => {
    return trips
      .filter(t => t.contract_type === subTab && (subTab === 'general' || t.collaborator_id === selectedCollabId))
      .map(t => format(parseISO(t.created_at), 'yyyy-MM-dd'));
  }, [trips, subTab, selectedCollabId]);

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = new Date();

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const rows = [];
    let dayRow = [];

    days.forEach((day, i) => {
      const formattedDay = format(day, 'd');
      const fullDateStr = format(day, 'yyyy-MM-dd');
      const hasTrips = tripDates.includes(fullDateStr);
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, today);
      const isCurrentMonth = isSameMonth(day, monthStart);

      dayRow.push(
        <button
          key={day.toString()}
          onClick={() => { setSelectedDate(day); setShowCalendar(false); }}
          className={`relative h-11 flex flex-col items-center justify-center rounded-xl transition-all ${
            isSelected 
              ? 'bg-safety-yellow text-zinc-950 font-black' 
              : isToday
                ? 'bg-emerald-600/20 text-emerald-500 font-bold border border-emerald-500/30'
                : isCurrentMonth ? 'text-zinc-100 hover:bg-zinc-800' : 'text-zinc-700'
          }`}
        >
          <span className="text-xs">{formattedDay}</span>
          {hasTrips && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-zinc-950' : 'bg-safety-yellow'}`}></div>}
        </button>
      );

      if ((i + 1) % 7 === 0) {
        rows.push(<div key={i} className="grid grid-cols-7 gap-1">{dayRow}</div>);
        dayRow = [];
      }
    });

    return (
      <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-200 mb-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500" />
            <h3 className="font-black uppercase text-[10px] text-zinc-400 tracking-widest">Select Date Filter</h3>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[8px] font-black text-zinc-600 uppercase">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="space-y-1">{rows}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800 shadow-lg">
        <div className="flex bg-zinc-800 p-1 rounded-xl">
          <button 
            onClick={() => setSubTab('collaboration')} 
            className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all duration-300 ${subTab === 'collaboration' ? 'bg-safety-yellow text-zinc-950 shadow-inner' : 'text-zinc-500'}`}
          >
            Collaboration
          </button>
          <button 
            onClick={() => setSubTab('general')} 
            className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all duration-300 ${subTab === 'general' ? 'bg-safety-yellow text-zinc-950 shadow-inner' : 'text-zinc-500'}`}
          >
            General
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCalendar(!showCalendar)} 
            className={`p-3 rounded-xl border-2 transition-all ${showCalendar ? 'border-safety-yellow bg-safety-yellow/10' : 'border-zinc-800 bg-zinc-900'}`}
          >
            <CalendarIcon size={20} className={showCalendar ? 'text-safety-yellow' : 'text-zinc-500'} />
          </button>
          {!showAddForm && (
            <button 
              onClick={() => { if (subTab === 'collaboration' && !selectedCollabId) { alert('Select a collaborator first'); return; } setShowAddForm(true); }} 
              className="bg-safety-yellow text-zinc-950 p-3 rounded-xl shadow-xl active:scale-90"
            >
              <Plus size={20} strokeWidth={4} />
            </button>
          )}
        </div>
      </div>

      {showCalendar && renderCalendar()}

      {!showAddForm ? (
        <>
          {subTab === 'collaboration' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Active Partner</h3>
                  {selectedCollabId && (
                    <button 
                      onClick={handleShareCollabReport}
                      className="text-safety-yellow p-1 bg-safety-yellow/10 rounded-lg active:scale-95 transition-transform"
                    >
                      <Share2 size={16} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowManageCollabs(true)} 
                  className="bg-zinc-800 px-3 py-1.5 rounded-lg text-safety-yellow text-[10px] font-black uppercase flex items-center gap-1 border border-zinc-700"
                >
                  <Settings size={12} /> Manage Collaborator
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {collaborators.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedCollabId(c.id)} 
                    className={`flex-shrink-0 px-6 py-3 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${selectedCollabId === c.id ? 'bg-safety-yellow border-safety-yellow text-zinc-950 shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest">
                {subTab === 'general' ? 'Daily Trips Log' : (selectedCollabId ? `${collaborators.find(c=>c.id===selectedCollabId)?.name}'s Daily` : 'Choose a Collab')}
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                {format(selectedDate, 'PP')}
              </p>
            </div>
            
            {filteredTrips.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-800/50">
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] italic">No records for this date</p>
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <div key={trip.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-md group active:bg-zinc-800 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">{format(parseISO(trip.created_at), 'hh:mm a')}</span>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{trip.material_type}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Driver: {drivers.find(d=>d.id===trip.driver_id)?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-safety-yellow">{trip.quantity} <span className="text-xs uppercase">{trip.unit}</span></p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">₹{trip.rate} / {trip.unit === 'trips' ? 'Trip' : 'Unit'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-400 border-t border-zinc-800/50 pt-3 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-safety-yellow" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{trip.site_name}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <IndianRupee size={12} className="text-emerald-500" />
                      <span className="text-sm font-black text-white">₹{(trip.quantity * trip.rate).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">New {subTab} Entry</h2>
            <button onClick={() => setShowAddForm(false)} className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Vehicle Selection</label>
                <select value={formData.vehicle_id} onChange={(e)=>setFormData({...formData, vehicle_id: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-safety-yellow">
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Operator/Driver</label>
                <select value={formData.driver_id} onChange={(e)=>setFormData({...formData, driver_id: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-safety-yellow">
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500">Site Name (Manual Entry)</label>
              <input type="text" placeholder="Enter Quarry or Site Name" value={formData.site_name} onChange={(e)=>setFormData({...formData, site_name: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 font-bold text-white placeholder:text-zinc-700" required />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-zinc-500">Material Type</label>
                <button type="button" onClick={() => setShowManageMaterials(true)} className="text-safety-yellow text-[10px] font-black uppercase border border-safety-yellow/30 px-2 py-0.5 rounded-md">Manage Material</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {materials.map(m => (
                  <button key={m.id} type="button" onClick={()=>setFormData({...formData, material_type: m.name})} className={`px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${formData.material_type === m.name ? 'border-safety-yellow bg-safety-yellow/10 text-safety-yellow shadow-lg' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>{m.name}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Quantity</label>
                <input type="number" step="0.1" value={formData.quantity} onChange={(e)=>setFormData({...formData, quantity: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white focus:border-safety-yellow" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Unit Type</label>
                <select value={formData.unit} onChange={(e)=>setFormData({...formData, unit: e.target.value as any})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-bold h-[76px] text-white focus:border-safety-yellow">
                  <option value="trips">Trips</option>
                  <option value="Tons">Tons</option>
                  <option value="CFT">CFT</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500">Rate per {formData.unit === 'trips' ? 'Trip' : (formData.unit === 'Tons' ? 'Ton' : 'CFT')} (₹)</label>
              <input type="number" placeholder="Enter amount" value={formData.rate} onChange={(e)=>setFormData({...formData, rate: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white focus:border-safety-yellow" required />
            </div>
            <button type="submit" className="w-full bg-safety-yellow text-zinc-950 py-6 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl active:scale-95 transition-transform">Confirm & Save</button>
          </form>
        </div>
      )}

      {/* REQUIREMENT 5: MANAGE COLLABORATORS OVERLAY */}
      {showManageCollabs && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Manage Partners</h2>
            <button onClick={() => setShowManageCollabs(false)} className="text-zinc-500 bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-6">
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
              <p className="text-[10px] font-black uppercase text-zinc-500">Add New Collaborator</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Company or Individual Name" value={newCollabName} onChange={e=>setNewCollabName(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold" />
                <button onClick={()=>{ if(newCollabName){ onAddCollaborator(newCollabName); setNewCollabName(''); } }} className="bg-safety-yellow text-zinc-950 px-6 rounded-xl font-black text-[10px] uppercase">Add</button>
              </div>
            </div>
            <div className="space-y-3">
              {collaborators.map(c => (
                <div key={c.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center group">
                  {editingCollabId === c.id ? (
                    <input autoFocus value={c.name} onChange={e=>onUpdateCollaborator(c.id, e.target.value)} onBlur={()=>setEditingCollabId(null)} className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-white font-bold border border-safety-yellow" />
                  ) : (
                    <p className="font-bold text-white text-lg">{c.name}</p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={()=>setEditingCollabId(c.id)} className="p-2 text-zinc-500 hover:text-safety-yellow transition-colors"><Edit2 size={18}/></button>
                    <button onClick={()=>onDeleteCollaborator(c.id)} className="p-2 text-red-500 active:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT 4 (PARTIAL): MANAGE MATERIALS OVERLAY */}
      {showManageMaterials && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Manage Materials</h2>
            <button onClick={() => setShowManageMaterials(false)} className="text-zinc-500 bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-6">
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
              <p className="text-[10px] font-black uppercase text-zinc-500">Add Material Profile</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Material Name..." value={newMaterialName} onChange={e=>setNewMaterialName(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold" />
                <button onClick={()=>{ if(newMaterialName){ onAddMaterial(newMaterialName); setNewMaterialName(''); } }} className="bg-safety-yellow text-zinc-950 px-6 rounded-xl font-black text-[10px] uppercase">Add</button>
              </div>
            </div>
            <div className="space-y-3">
              {materials.map(m => (
                <div key={m.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                   {editingMatId === m.id ? (
                    <input autoFocus value={m.name} onChange={e=>onUpdateMaterial(m.id, e.target.value)} onBlur={()=>setEditingMatId(null)} className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-white font-bold border border-safety-yellow" />
                  ) : (
                    <p className="font-bold text-white text-lg">{m.name}</p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={()=>setEditingMatId(m.id)} className="p-2 text-zinc-500 hover:text-safety-yellow transition-colors"><Edit2 size={18}/></button>
                    <button onClick={()=>onDeleteMaterial(m.id)} className="p-2 text-red-500 active:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18}/></button>
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

export default TripsView;
