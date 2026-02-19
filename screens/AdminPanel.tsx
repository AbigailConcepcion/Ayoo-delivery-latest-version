
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Restaurant, Order, Voucher } from '../types';
import { Users, Store, ShoppingBag, Settings, LogOut, TrendingUp, DollarSign, ChevronRight, Activity, Calendar, Ticket, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Logo from '../components/Logo';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminPanel: React.FC = () => {
  const { logout } = useAuth();
  const [stats, setStats] = useState({ 
    users: 0, 
    restaurants: 0, 
    orders: 0, 
    revenue: 0,
    chartData: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'RESTAURANTS' | 'ORDERS' | 'MARKETING'>('OVERVIEW');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    expiryDate: '',
    description: ''
  });

  useEffect(() => {
    fetchStats();
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers');
      const data = await response.json();
      setVouchers(data);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    }
  };

  const handleCreateVoucher = async () => {
    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucherForm),
      });
      if (response.ok) {
        fetchVouchers();
        setIsAddingVoucher(false);
        setVoucherForm({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: 0,
          minOrderValue: 0,
          maxDiscount: 0,
          expiryDate: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('Failed to create voucher:', error);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!window.confirm('Delete this voucher?')) return;
    try {
      await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
      fetchVouchers();
    } catch (error) {
      console.error('Failed to delete voucher:', error);
    }
  };

  const toggleVoucherStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/vouchers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchVouchers();
    } catch (error) {
      console.error('Failed to toggle voucher:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <Logo variant="colored" size="sm" withSubtext={false} />
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Activity size={12} /> System Live
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mission Control</h1>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">Platform-wide Analytics & Growth</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('MARKETING')}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'MARKETING' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
              Marketing
            </button>
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
              <Calendar size={16} className="text-[#FF00CC]" />
              <span className="text-xs font-black text-gray-600">Last 7 Days</span>
            </div>
          </div>
        </div>

        {activeTab === 'OVERVIEW' ? (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* ... existing metrics ... */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-900">{stats.users.toLocaleString()}</p>
                  <span className="text-[10px] font-black text-green-500">+12%</span>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-pink-50 text-[#FF00CC] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Store size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Stores</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-900">{stats.restaurants.toLocaleString()}</p>
                  <span className="text-[10px] font-black text-green-500">+5%</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-900">{stats.orders.toLocaleString()}</p>
                  <span className="text-[10px] font-black text-purple-500">Live</span>
                </div>
              </div>

              <div className="bg-[#1A1A1A] p-6 rounded-[32px] shadow-2xl border border-gray-800 hover:shadow-pink-500/10 transition-all group">
                <div className="w-12 h-12 bg-[#FF00CC] text-white rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <DollarSign size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-white">₱{stats.revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                        <Ticket size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Vouchers</p>
                        <p className="text-2xl font-black text-gray-900">{vouchers.filter(v => v.isActive).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Rate</p>
                        <p className="text-2xl font-black text-gray-900">+18.4%</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Order Value</p>
                        <p className="text-2xl font-black text-gray-900">₱342.50</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Revenue Growth</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily earnings performance</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-[#FF00CC] rounded-full"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">Revenue</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF00CC" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF00CC" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}}
                        tickFormatter={(value) => `₱${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '15px'}}
                        itemStyle={{fontWeight: 900, color: '#FF00CC'}}
                        labelStyle={{fontWeight: 900, marginBottom: '5px', color: '#111827'}}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#FF00CC" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Order Volume</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily transaction count</p>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}}
                      />
                      <Tooltip 
                        cursor={{fill: '#F9FAFB'}}
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '15px'}}
                        itemStyle={{fontWeight: 900, color: '#8B5CF6'}}
                        labelStyle={{fontWeight: 900, marginBottom: '5px', color: '#111827'}}
                      />
                      <Bar 
                        dataKey="orders" 
                        fill="#8B5CF6" 
                        radius={[10, 10, 0, 0]} 
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Live Activity Feed</h3>
                <button className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest hover:underline">View All Logs</button>
              </div>
              
              <div className="space-y-2">
                {[
                  { label: 'New restaurant registered', time: '2 hours ago', icon: <Store size={18} />, color: 'bg-pink-50 text-[#FF00CC]' },
                  { label: 'Order #XJ92K delivered', time: '4 hours ago', icon: <CheckCircle size={18} className="" />, color: 'bg-green-50 text-green-500' },
                  { label: 'New rider application', time: '5 hours ago', icon: <Users size={18} />, color: 'bg-blue-50 text-blue-500' },
                  { label: 'System backup completed', time: '8 hours ago', icon: <Activity size={18} />, color: 'bg-gray-50 text-gray-400' },
                  { label: 'Revenue target reached', time: '12 hours ago', icon: <DollarSign size={18} />, color: 'bg-yellow-50 text-yellow-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-3xl hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 tracking-tight">{item.label}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.time}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-200 group-hover:text-[#FF00CC] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : activeTab === 'MARKETING' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Voucher Management</h2>
                <button 
                    onClick={() => setIsAddingVoucher(true)}
                    className="bg-[#FF00CC] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pink-200"
                >
                    <Plus size={18} /> Create Voucher
                </button>
            </div>

            {isAddingVoucher && (
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight">New Campaign Voucher</h3>
                        <button onClick={() => setIsAddingVoucher(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Voucher Code</label>
                                <input 
                                    type="text" 
                                    value={voucherForm.code}
                                    onChange={e => setVoucherForm({...voucherForm, code: e.target.value.toUpperCase()})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                                    placeholder="e.g. SUMMER2026"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
                                    <select 
                                        value={voucherForm.discountType}
                                        onChange={e => setVoucherForm({...voucherForm, discountType: e.target.value as any})}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                                    >
                                        <option value="PERCENTAGE">Percentage</option>
                                        <option value="FIXED">Fixed Amount</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Value</label>
                                    <input 
                                        type="number" 
                                        value={voucherForm.discountValue}
                                        onChange={e => setVoucherForm({...voucherForm, discountValue: Number(e.target.value)})}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Expiry Date</label>
                                <input 
                                    type="date" 
                                    value={voucherForm.expiryDate}
                                    onChange={e => setVoucherForm({...voucherForm, expiryDate: e.target.value})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Min Order Value (₱)</label>
                                <input 
                                    type="number" 
                                    value={voucherForm.minOrderValue}
                                    onChange={e => setVoucherForm({...voucherForm, minOrderValue: Number(e.target.value)})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Max Discount (₱ - Optional)</label>
                                <input 
                                    type="number" 
                                    value={voucherForm.maxDiscount}
                                    onChange={e => setVoucherForm({...voucherForm, maxDiscount: Number(e.target.value)})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                                <textarea 
                                    value={voucherForm.description}
                                    onChange={e => setVoucherForm({...voucherForm, description: e.target.value})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] h-[100px]"
                                    placeholder="Short campaign description..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleCreateVoucher}
                            className="w-full py-5 bg-[#FF00CC] text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-pink-200 active:scale-95 transition-all"
                        >
                            Launch Campaign
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vouchers.map(voucher => (
                    <div key={voucher.id} className={`bg-white p-6 rounded-[32px] border-2 transition-all ${voucher.isActive ? 'border-pink-50' : 'border-gray-100 opacity-60 grayscale'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${voucher.isActive ? 'bg-pink-50 text-[#FF00CC]' : 'bg-gray-100 text-gray-400'}`}>
                                    <Ticket size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 text-lg tracking-tight">{voucher.code}</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{voucher.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleVoucherStatus(voucher.id, voucher.isActive)}
                                    className={`p-2 rounded-xl transition-colors ${voucher.isActive ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    <Activity size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteVoucher(voucher.id)}
                                    className="p-2 bg-red-50 text-red-500 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Discount</p>
                                <p className="font-black text-gray-900">{voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` : `₱${voucher.discountValue}`}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Min Order</p>
                                <p className="font-black text-gray-900">₱{voucher.minOrderValue}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Expires</p>
                                <p className="font-black text-gray-900">{new Date(voucher.expiryDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold">Coming Soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

const CheckCircle = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export default AdminPanel;
