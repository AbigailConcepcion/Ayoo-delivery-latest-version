
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, FoodItem, Restaurant } from '../types';
import socket from '../socket';
import { Package, Clock, CheckCircle, XCircle, ChevronRight, LogOut, Utensils, Plus, Edit2, Trash2, Save, X, Settings, DollarSign, Power, History } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import MapPicker from '../components/MapPicker';
import { motion, AnimatePresence } from 'motion/react';

const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'MENU' | 'SETTINGS'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  
  // Menu Form State
  const [isEditing, setIsEditing] = useState<string | null>(null); // itemId or 'NEW'
  const [formData, setFormData] = useState<Partial<FoodItem>>({
    name: '',
    price: 0,
    description: '',
    category: 'Main',
    image: '',
    isPopular: false,
    isSpicy: false,
    isAvailable: true,
  });

  // Restaurant Settings State
  const [settingsData, setSettingsData] = useState({
    name: '',
    cuisine: '',
    address: '',
    lat: 8.2285,
    lng: 124.2452,
    image: '',
    isOpen: true,
  });

  useEffect(() => {
    if (restaurant) {
      setSettingsData({
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: restaurant.address || '',
        lat: restaurant.lat || 8.2285,
        lng: restaurant.lng || 124.2452,
        image: restaurant.image,
        isOpen: restaurant.isOpen ?? true,
      });
    }
  }, [restaurant]);

  useEffect(() => {
    if (user?.restaurantId) {
      fetchOrders();
      fetchRestaurant();
      socket.emit('join_restaurant', user.restaurantId);
      
      socket.on('new_order', (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev]);
      });

      socket.on('order_status_updated', (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      });

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders/restaurant/${user?.restaurantId}`);
      const data = await response.json();
      setOrders(data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`/api/restaurants/${user?.restaurantId}`);
      const data = await response.json();
      setRestaurant(data);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const toggleStoreStatus = async () => {
    if (!user?.restaurantId) return;
    const newStatus = !settingsData.isOpen;
    try {
        const response = await fetch(`/api/restaurants/${user.restaurantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOpen: newStatus }),
        });
        if (response.ok) {
            setSettingsData(prev => ({ ...prev, isOpen: newStatus }));
            fetchRestaurant();
        }
    } catch (error) {
        console.error('Failed to toggle store status:', error);
    }
  };

  const handleSaveItem = async () => {
    if (!user?.restaurantId) return;
    
    const method = isEditing === 'NEW' ? 'POST' : 'PATCH';
    const url = isEditing === 'NEW' 
      ? `/api/restaurants/${user.restaurantId}/items`
      : `/api/restaurants/${user.restaurantId}/items/${isEditing}`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRestaurant();
        setIsEditing(null);
        setFormData({
          name: '',
          price: 0,
          description: '',
          category: 'Main',
          image: '',
          isPopular: false,
          isSpicy: false,
          isAvailable: true,
        });
      }
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user?.restaurantId || !window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/restaurants/${user.restaurantId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRestaurant();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-500 bg-yellow-50 border-yellow-100';
      case 'ACCEPTED': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'PREPARING': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'READY_FOR_PICKUP': return 'text-purple-500 bg-purple-50 border-purple-100';
      case 'DELIVERED': return 'text-green-500 bg-green-50 border-green-100';
      case 'CANCELLED': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  const activeOrders = orders.filter(o => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status));
  const historyOrders = orders.filter(o => ['PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'].includes(o.status));
  const displayedOrders = orderFilter === 'ACTIVE' ? activeOrders : historyOrders;

  const todayRevenue = orders
    .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((acc, curr) => acc + curr.total, 0);

  const todayOrdersCount = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="transform scale-75 -ml-4">
            <Logo variant="colored" size="sm" withSubtext={false} />
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={toggleStoreStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${settingsData.isOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
          >
            <Power size={14} />
            {settingsData.isOpen ? 'Store Open' : 'Store Closed'}
          </button>
          
          <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`p-2.5 rounded-xl transition-all ${activeTab === 'ORDERS' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Package size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('MENU')}
            className={`p-2.5 rounded-xl transition-all ${activeTab === 'MENU' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Utensils size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`p-2.5 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Settings size={20} />
          </button>
          <button onClick={logout} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors ml-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {activeTab === 'ORDERS' ? 'Orders Management' : activeTab === 'MENU' ? 'Menu Management' : 'Restaurant Settings'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {activeTab === 'ORDERS' ? 'Manage your incoming restaurant orders' : activeTab === 'MENU' ? 'Add or edit your restaurant menu items' : 'Update your restaurant information'}
          </p>
        </div>

        {activeTab === 'ORDERS' && (
            <>
                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-pink-50 text-[#FF00CC] rounded-xl">
                                <DollarSign size={18} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Revenue</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">₱{todayRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                                <Package size={18} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Orders</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{todayOrdersCount}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                                <Clock size={18} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">{activeOrders.filter(o => o.status === 'PENDING').length}</h3>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setOrderFilter('ACTIVE')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderFilter === 'ACTIVE' ? 'bg-[#FF00CC] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        Active ({activeOrders.length})
                    </button>
                    <button 
                        onClick={() => setOrderFilter('HISTORY')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderFilter === 'HISTORY' ? 'bg-[#FF00CC] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        History
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF00CC]"></div>
                    </div>
                ) : displayedOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[32px] shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-gray-300" size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No {orderFilter.toLowerCase()} orders found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {displayedOrders.map(order => (
                                <motion.div 
                                    key={order.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order #{order.id.substr(0, 6)}</p>
                                            <h3 className="font-black text-gray-900 text-lg">{order.customerName}</h3>
                                            <p className="text-xs text-gray-500 font-bold mt-1">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6 flex-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-100 text-gray-600 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black">{item.quantity}x</span>
                                                    <span className="text-gray-700 font-bold">{item.name}</span>
                                                </div>
                                                <span className="text-gray-900 font-black">₱{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center mb-6">
                                        <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Amount</span>
                                        <span className="text-[#FF00CC] font-black text-xl">₱{order.total}</span>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        {order.status === 'PENDING' && (
                                            <>
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                                    className="flex-1 bg-gray-100 text-gray-500 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                                                    className="flex-[2] bg-[#FF00CC] text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-200 active:scale-95 transition-all"
                                                >
                                                    Accept Order
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'ACCEPTED' && (
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                className="w-full bg-orange-500 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-all"
                                            >
                                                Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                                                className="w-full bg-purple-500 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 active:scale-95 transition-all"
                                            >
                                                Ready for Pickup
                                            </button>
                                        )}
                                        {order.status === 'READY_FOR_PICKUP' && (
                                            <div className="w-full bg-purple-50 text-purple-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center border border-purple-100">
                                                Waiting for Rider...
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </>
        )}

        {activeTab === 'MENU' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Your Menu</h2>
              <button 
                onClick={() => {
                  setIsEditing('NEW');
                  setFormData({
                    name: '',
                    price: 0,
                    description: '',
                    category: 'Main',
                    image: '',
                    isPopular: false,
                    isSpicy: false,
                    isAvailable: true,
                  });
                }}
                className="bg-[#FF00CC] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pink-100 hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus size={18} /> Add Item
              </button>
            </div>

            <AnimatePresence>
                {isEditing && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white p-8 rounded-[32px] shadow-xl border-2 border-[#FF00CC]/10 mb-8"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg">
                            {isEditing === 'NEW' ? 'New Menu Item' : 'Edit Menu Item'}
                        </h3>
                        <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Item Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] transition-colors"
                                    placeholder="e.g. Special Burger"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Price (₱)</label>
                                    <input 
                                        type="number" 
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                                    <select 
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] transition-colors"
                                    >
                                        <option>Main</option>
                                        <option>Sides</option>
                                        <option>Drinks</option>
                                        <option>Dessert</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Image URL</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={formData.image}
                                        onChange={e => setFormData({...formData, image: e.target.value})}
                                        className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] transition-colors"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                    {formData.image && (
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                            <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] h-[124px] resize-none transition-colors"
                                    placeholder="Describe your delicious food..."
                                />
                            </div>
                            <div className="flex gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.isPopular ? 'bg-[#FF00CC] border-[#FF00CC]' : 'border-gray-300 bg-white'}`}>
                                        {formData.isPopular && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isPopular}
                                        onChange={e => setFormData({...formData, isPopular: e.target.checked})}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-black text-gray-600 uppercase group-hover:text-gray-900">Popular</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.isSpicy ? 'bg-[#FF00CC] border-[#FF00CC]' : 'border-gray-300 bg-white'}`}>
                                        {formData.isSpicy && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isSpicy}
                                        onChange={e => setFormData({...formData, isSpicy: e.target.checked})}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-black text-gray-600 uppercase group-hover:text-gray-900">Spicy 🌶️</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.isAvailable ? 'bg-[#FF00CC] border-[#FF00CC]' : 'border-gray-300 bg-white'}`}>
                                        {formData.isAvailable && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-black text-gray-600 uppercase group-hover:text-gray-900">Available</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button onClick={handleSaveItem} className="flex-1 py-4 font-black uppercase tracking-widest text-sm">
                            <Save size={18} className="mr-2" /> Save Item
                        </Button>
                        <button 
                            onClick={() => setIsEditing(null)}
                            className="px-8 bg-gray-100 text-gray-500 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
              {restaurant?.items.map(item => (
                <div key={item.id} className={`bg-white p-4 rounded-[32px] shadow-sm border ${item.isAvailable ? 'border-gray-100' : 'border-red-100 bg-red-50/30'} flex gap-4 items-center group transition-all hover:shadow-md`}>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${!item.isAvailable ? 'grayscale' : ''}`} />
                    {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Sold Out</span>
                        </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-gray-900">{item.name}</h4>
                      {item.isPopular && <span className="text-[8px] bg-yellow-400 px-1.5 py-0.5 rounded font-black uppercase">Popular</span>}
                      {item.isSpicy && <span>🌶️</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{item.category}</p>
                    <p className="font-black text-[#FF00CC]">₱{item.price}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setIsEditing(item.id);
                        setFormData(item);
                      }}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-blue-500 rounded-2xl transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Restaurant Name</label>
                            <input 
                                type="text" 
                                value={settingsData.name}
                                onChange={e => setSettingsData({...settingsData, name: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cuisine Type</label>
                            <input 
                                type="text" 
                                value={settingsData.cuisine}
                                onChange={e => setSettingsData({...settingsData, cuisine: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Address</label>
                            <input 
                                type="text" 
                                value={settingsData.address}
                                onChange={e => setSettingsData({...settingsData, address: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Banner Image URL</label>
                            <input 
                                type="text" 
                                value={settingsData.image}
                                onChange={e => setSettingsData({...settingsData, image: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                        <div className="h-40 rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                            <img src={settingsData.image} className="w-full h-full object-cover" alt="Banner Preview" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pin Restaurant Location</label>
                    <div className="rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                        <MapPicker 
                            initialLat={settingsData.lat} 
                            initialLng={settingsData.lng} 
                            onLocationSelect={(lat, lng) => setSettingsData({...settingsData, lat, lng})} 
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        onClick={async () => {
                            try {
                                const response = await fetch(`/api/restaurants/${user?.restaurantId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(settingsData),
                                });
                                if (response.ok) {
                                    alert('Restaurant settings saved!');
                                    fetchRestaurant();
                                }
                            } catch (error) {
                                console.error('Failed to save settings:', error);
                            }
                        }}
                        className="py-5 font-black uppercase tracking-widest text-sm w-full"
                    >
                        <Save size={20} className="mr-2" /> Save Restaurant Settings
                    </Button>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MerchantDashboard;
