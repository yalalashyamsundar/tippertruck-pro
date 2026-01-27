
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Collaborator, Driver, Vehicle, Material, Unit } from '../types';
import { 
  Plus, 
  MapPin, 
  IndianRupee, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Briefcase,
  Trash2,
  Settings,
  Edit2,
  X,
  Filter,
  Search,
  TrendingUp,
  Check,
  Star,
  Loader2,
  Layers
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
  units: Unit[];
  onAddUnit: (name: string) => void;
  defaultCollaboratorId: string | null;
  onSetDefaultCollaborator: (id: string | null) => void;
  onAddTrip: (trip: Omit<Trip, 'id' | 'created_at'> & { created_at?: string }) => void;
  onAddCollaborator: (name: string) => void;
  onUpdateCollaborator: (id: string, name: string) => void;
  onDeleteCollaborator: (id: string) => void;
  onAddMaterial: (name: string) => void;
  onDeleteMaterial: (id: string) => void;
  onUpdateMaterial: (id: string, name: string) => void;
}

type SortKey = 'date' | 'material' | 'site';
type SortDirection = 'asc' | 'desc';

const TripsView: React.FC<TripsViewProps> = ({ 
  trips, collaborators, drivers, vehicles, materials, units, onAddUnit,
  defaultCollaboratorId, onSetDefaultCollaborator,
  onAddTrip, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator, onAddMaterial, onDeleteMaterial, onUpdateMaterial 
}) => {
  const [subTab, setSubTab] = useState<'general' | 'collaboration'>('collaboration');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showManageCollabs, setShowManageCollabs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Track selected partner and whether it was a manual user action
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(defaultCollaboratorId);
  const [isManualSelection, setIsManualSelection] = useState(false);

  const [isLocating, setIsLocating] = useState(false);
  const [showAddUnitInput, setShowAddUnitInput] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [newCollabName, setNewCollabName] = useState('');
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [editingCollabName, setEditingCollabName] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    site_name: '',
    material_type: '',
    quantity: '',
    unit: '',
    rate: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    vehicle_id: vehicles[0]?.id || '',
    driver_id: drivers[0]?.id || '',
  });

  // Automatically follow the default partner if the user hasn't made a manual choice
  useEffect(() => {
    if (!isManualSelection) {
      setSelectedCollabId(defaultCollaboratorId);
    }
  }, [defaultCollaboratorId, isManualSelection]);

  // If the default partner is unset globally, clear any selection and reset manual flag
  useEffect(() => {
    if (!defaultCollaboratorId) {
      setSelectedCollabId(null);
      setIsManualSelection(false);
    }
  }, [defaultCollaboratorId]);

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ 
          ...prev, 
          site_name: `Loc: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Please ensure GPS is enabled.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleAddCustomUnit = () => {
    if (newUnitName.trim()) {
      onAddUnit(newUnitName.trim());
      setFormData(prev => ({ ...prev, unit: newUnitName.trim() }));
      setNewUnitName('');
      setShowAddUnitInput(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tripDate = parseISO(formData.date);
    const now = new Date();
    tripDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    if (subTab === 'collaboration' && !selectedCollabId) {
      alert('Please select a partner first');
      return;
    }

    onAddTrip({
      vehicle_id: formData.vehicle_id,
      driver_id: formData.driver_id,
      site_name: formData.site_name,
      material_type: formData.material_type,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      rate: formData.rate ? Number(formData.rate) : 0,
      created_at: tripDate.toISOString(),
      contract_type: subTab,
      collaborator_id: subTab === 'collaboration' ? (selectedCollabId || undefined) : undefined,
    });
    setShowAddForm(false);
    setFormData(prev => ({ ...prev, quantity: '', rate: '', site_name: '' }));
  };

  const filteredTrips = useMemo(() => {
    let result = trips.filter(trip => {
      const isDateMatch = isSameDay(parseISO(trip.created_at), selectedDate);
      const isTypeMatch = trip.contract_type === subTab;
      const isCollabMatch = subTab === 'general' || (trip.collaborator_id === selectedCollabId);
      
      const searchMatch = !searchQuery || 
        trip.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.material_type.toLowerCase().includes(searchQuery.toLowerCase());

      return isDateMatch && isTypeMatch && isCollabMatch && searchMatch;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'date') {
        comparison = parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime();
      } else if (sortKey === 'material') {
        comparison = a.material_type.localeCompare(b.material_type);
      } else if (sortKey === 'site') {
        comparison = a.site_name.localeCompare(b.site_name);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [trips, selectedDate, subTab, selectedCollabId, searchQuery, sortKey, sortDirection]);

  const getCollabSummary = (collabId: string) => {
    const collabTrips = trips.filter(t => t.collaborator_id === collabId);
    const totalAmount = collabTrips.reduce((sum, t) => sum + (t.quantity * t.rate), 0);
    return { count: collabTrips.length, amount: totalAmount };
  };

  const startEditCollab = (collab: Collaborator) => {
    setEditingCollabId(collab.id);
    setEditingCollabName(collab.name);
  };

  const saveEditCollab = (id: string) => {
    if (editingCollabName.trim()) {
      onUpdateCollaborator(id, editingCollabName);
    }
    setEditingCollabId(null);
  };

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
            <h3 className="font-black uppercase text-[10px] text-zinc-400 tracking-widest">Date Filter</h3>
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
          <button onClick={() => setSubTab('collaboration')} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all duration-300 ${subTab === 'collaboration' ? 'bg-safety-yellow text-zinc-950 shadow-inner' : 'text-zinc-500'}`}>Collaboration</button>
          <button onClick={() => setSubTab('general')} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] transition-all duration-300 ${subTab === 'general' ? 'bg-safety-yellow text-zinc-950 shadow-inner' : 'text-zinc-500'}`}>General</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCalendar(!showCalendar)} className={`p-3 rounded-xl border-2 transition-all ${showCalendar ? 'border-safety-yellow bg-safety-yellow/10' : 'border-zinc-800 bg-zinc-900'}`}><CalendarIcon size={20} className={showCalendar ? 'text-safety-yellow' : 'text-zinc-500'} /></button>
          {!showAddForm && (
            <button 
              onClick={() => { 
                if (subTab === 'collaboration' && !selectedCollabId) { 
                  alert('Select a collaborator first'); 
                  return; 
                } 
                setShowAddForm(true); 
              }} 
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
              <div className="flex items-center justify-between px-1">
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Active Partner</h3>
                <button onClick={() => setShowManageCollabs(true)} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-safety-yellow text-[10px] font-black uppercase flex items-center gap-1 border border-zinc-700 shadow-sm"><Settings size={12} /> Partner Settings</button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {collaborators.map(c => {
                  const isActive = selectedCollabId === c.id;
                  const isDefault = defaultCollaboratorId === c.id;
                  return (
                    <button 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCollabId(c.id);
                        setIsManualSelection(true); // User made an explicit choice
                      }} 
                      className={`flex-shrink-0 px-6 py-3 rounded-2xl border-2 font-black uppercase text-[10px] transition-all relative ${isActive ? 'bg-safety-yellow border-safety-yellow text-zinc-950 shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500'} ${isDefault && !isActive ? 'ring-1 ring-safety-yellow/30' : ''}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {c.name}
                        {isDefault && <Star size={10} className={`${isActive ? 'fill-zinc-950 text-zinc-950' : 'fill-safety-yellow text-safety-yellow'}`} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" placeholder="Search site or material..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:border-zinc-700 outline-none transition-all" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest">{subTab === 'general' ? 'Daily Trips Log' : 'Partner Records'}</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">{format(selectedDate, 'PP')}</p>
            </div>
            
            {filteredTrips.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-800/50">
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] italic">No trips found</p>
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <div key={trip.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">{format(parseISO(trip.created_at), 'hh:mm a')}</span>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{trip.material_type}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-safety-yellow">{trip.quantity} <span className="text-xs uppercase">{trip.unit}</span></p>
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
                <label className="text-[10px] font-black uppercase text-zinc-500">Vehicle</label>
                <select value={formData.vehicle_id} onChange={(e)=>setFormData({...formData, vehicle_id: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-safety-yellow">
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Driver</label>
                <select value={formData.driver_id} onChange={(e)=>setFormData({...formData, driver_id: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-safety-yellow">
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            
            {subTab === 'collaboration' && (
              <div className="bg-zinc-900/50 p-4 rounded-2xl border-2 border-zinc-800/50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-zinc-500">Selected Partner</span>
                  <span className="text-white font-black italic uppercase tracking-tight">
                    {collaborators.find(c => c.id === selectedCollabId)?.name || 'None Selected'}
                  </span>
                </div>
                {selectedCollabId === defaultCollaboratorId && (
                  <div className="px-2 py-1 bg-safety-yellow/10 border border-safety-yellow/20 rounded-lg flex items-center gap-1.5">
                    <Star size={10} className="fill-safety-yellow text-safety-yellow" />
                    <span className="text-[8px] font-black text-safety-yellow uppercase">Default</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500">Site Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter Site Name" 
                  value={formData.site_name} 
                  onChange={(e)=>setFormData({...formData, site_name: e.target.value})} 
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 pr-14 font-bold text-white focus:border-safety-yellow outline-none transition-all" 
                  required 
                />
                <button 
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 p-2.5 rounded-xl text-safety-yellow hover:bg-zinc-700 active:scale-90 transition-all border border-zinc-700"
                  title="Tag Current Location"
                >
                  {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1"><Layers size={10} /> Material</label>
                <select 
                  value={formData.material_type} 
                  onChange={(e)=>setFormData({...formData, material_type: e.target.value})} 
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-safety-yellow appearance-none"
                >
                  {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Units</label>
                <div className="relative">
                  {showAddUnitInput ? (
                    <div className="flex gap-1 animate-in slide-in-from-right-2 duration-200">
                      <input 
                        type="text" 
                        placeholder="New Unit"
                        value={newUnitName}
                        onChange={(e)=>setNewUnitName(e.target.value)}
                        className="w-full bg-zinc-900 border-2 border-safety-yellow rounded-2xl p-4 text-sm font-bold text-white outline-none"
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={handleAddCustomUnit}
                        className="bg-safety-yellow text-zinc-950 p-4 rounded-2xl shadow-lg"
                      >
                        <Check size={18} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <div className="relative flex-1">
                        <select 
                          value={formData.unit} 
                          onChange={(e)=>setFormData({...formData, unit: e.target.value})} 
                          className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-safety-yellow outline-none appearance-none"
                        >
                          {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 rotate-90 pointer-events-none" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowAddUnitInput(true)}
                        className="p-4 bg-zinc-800 border-2 border-zinc-800 rounded-2xl text-safety-yellow active:scale-90 transition-all shadow-md"
                        title="Add Custom Unit"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500">Quantity</label>
                <input type="number" step="0.1" value={formData.quantity} onChange={(e)=>setFormData({...formData, quantity: e.target.value})} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white outline-none focus:border-safety-yellow" required />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-zinc-500">Rate (₹)</label>
                  <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest italic">Optional</span>
                </div>
                <input 
                  type="number" 
                  value={formData.rate} 
                  onChange={(e)=>setFormData({...formData, rate: e.target.value})} 
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 font-black text-2xl text-white outline-none focus:border-emerald-500/50" 
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-safety-yellow text-zinc-950 py-6 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl active:scale-95 transition-transform">Confirm Entry</button>
          </form>
        </div>
      )}

      {/* MANAGE PARTNERS OVERLAY */}
      {showManageCollabs && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-md p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-safety-yellow uppercase italic tracking-tighter">Partner Settings</h2>
            <button onClick={() => setShowManageCollabs(false)} className="bg-zinc-800 p-2 rounded-xl"><X size={24}/></button>
          </div>
          <div className="space-y-6">
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
              <p className="text-[10px] font-black uppercase text-zinc-500">Add New Partner</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Partner Name" value={newCollabName} onChange={e=>setNewCollabName(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-safety-yellow" />
                <button onClick={()=>{ if(newCollabName.trim()){ onAddCollaborator(newCollabName); setNewCollabName(''); } }} className="bg-safety-yellow text-zinc-950 px-6 rounded-xl font-black text-[10px] uppercase shadow-lg">Add</button>
              </div>
            </div>
            <div className="space-y-3 pb-20">
              {collaborators.map(c => {
                const summary = getCollabSummary(c.id);
                const isDefault = defaultCollaboratorId === c.id;
                return (
                  <div key={c.id} className={`bg-zinc-900 p-5 rounded-2xl border flex flex-col gap-3 transition-colors ${isDefault ? 'border-safety-yellow/40 bg-zinc-900/80' : 'border-zinc-800'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <button 
                          onClick={() => {
                            const newDefaultId = isDefault ? null : c.id;
                            onSetDefaultCollaborator(newDefaultId);
                            
                            // Immediately sync selection with the default change
                            if (newDefaultId) {
                              setSelectedCollabId(newDefaultId);
                              setIsManualSelection(false); // Follow the new default
                            } else {
                              setSelectedCollabId(null);
                              setIsManualSelection(false); // No default to follow
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all ${isDefault ? 'bg-safety-yellow/20 text-safety-yellow' : 'bg-zinc-800 text-zinc-600 hover:text-safety-yellow'}`}
                          title={isDefault ? "Unset default" : "Set as default"}
                        >
                          <Star size={16} className={isDefault ? 'fill-safety-yellow' : ''} />
                        </button>
                        {editingCollabId === c.id ? (
                          <div className="flex-1 flex gap-2">
                            <input autoFocus value={editingCollabName} onChange={e=>setEditingCollabName(e.target.value)} className="flex-1 bg-zinc-800 rounded px-3 py-2 text-white font-bold border border-safety-yellow outline-none" />
                            <button onClick={() => saveEditCollab(c.id)} className="p-2 bg-emerald-500 text-zinc-950 rounded-lg"><Check size={16}/></button>
                          </div>
                        ) : (
                          <p className={`font-black text-lg italic tracking-tight uppercase ${isDefault ? 'text-safety-yellow' : 'text-white'}`}>{c.name}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        {!editingCollabId && <button onClick={()=>startEditCollab(c)} className="p-2 text-zinc-500 hover:text-safety-yellow"><Edit2 size={16}/></button>}
                        <button onClick={()=>onDeleteCollaborator(c.id)} className="p-2 text-red-500/60 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-zinc-800/50 pt-3">
                      <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <TrendingUp size={10} className="text-safety-yellow"/>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{summary.count} Trips</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <IndianRupee size={10} className="text-emerald-500"/>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">₹{summary.amount.toLocaleString()}</span>
                      </div>
                      {isDefault && (
                        <div className="ml-auto px-2 py-1 bg-safety-yellow/10 border border-safety-yellow/20 rounded-md">
                          <span className="text-[8px] font-black text-safety-yellow uppercase tracking-widest">Default Partner</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsView;
