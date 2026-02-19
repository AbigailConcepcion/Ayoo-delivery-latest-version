
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, FoodItem, Restaurant } from '../types';
import socket from '../socket';
import { Package, Clock, CheckCircle, XCircle, ChevronRight, LogOut, Utensils, Plus, Edit2, Trash2, Save, X, Settings } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import MapPicker from '../components/MapPicker';

const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'MENU' | 'SETTINGS'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
  });

  // Restaurant Settings State
  const [settingsData, setSettingsData] = useState({
    name: '',
    cuisine: '',
    address: '',
    lat: 8.2285,
    lng: 124.2452,
    image: '',
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

      return () => {
        socket.off('new_order');
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
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
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
      case 'PENDING': return 'text-yellow-500 bg-yellow-50';
      case 'ACCEPTED': return 'text-blue-500 bg-blue-50';
      case 'PREPARING': return 'text-orange-500 bg-orange-50';
      case 'READY_FOR_PICKUP': return 'text-purple-500 bg-purple-50';
      case 'DELIVERED': return 'text-green-500 bg-green-50';
      case 'CANCELLED': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <Logo variant="colored" size="sm" withSubtext={false} />
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'ORDERS' ? 'bg-pink-50 text-[#FF00CC]' : 'text-gray-400'}`}
          >
            <Package size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('MENU')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'MENU' ? 'bg-pink-50 text-[#FF00CC]' : 'text-gray-400'}`}
          >
            <Utensils size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-pink-50 text-[#FF00CC]' : 'text-gray-400'}`}
          >
            <Settings size={24} />
          </button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">
            {activeTab === 'ORDERS' ? 'Orders Management' : activeTab === 'MENU' ? 'Menu Management' : 'Restaurant Settings'}
          </h1>
          <p className="text-gray-500 font-bold">
            {activeTab === 'ORDERS' ? 'Manage your incoming restaurant orders' : activeTab === 'MENU' ? 'Add or edit your restaurant menu items' : 'Update your restaurant information'}
          </p>
        </div>

        {activeTab === 'ORDERS' ? (
          isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF00CC]"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
              <Package className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-bold">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Order #{order.id}</p>
                      <h3 className="font-black text-gray-900">{order.customerName}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 font-bold">{item.quantity}x {item.name}</span>
                        <span className="text-gray-900 font-black">₱{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-50 flex justify-between">
                      <span className="text-gray-900 font-black">Total</span>
                      <span className="text-[#FF00CC] font-black">₱{order.total}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                        className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="flex-1 bg-orange-500 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                        className="flex-1 bg-purple-500 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
                      >
                        Ready for Pickup
                      </button>
                    )}
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="px-4 bg-gray-100 text-gray-400 py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'MENU' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">Your Menu</h2>
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
                  });
                }}
                className="bg-[#FF00CC] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pink-100"
              >
                <Plus size={18} /> Add Item
              </button>
            </div>

            {isEditing && (
              <div className="bg-white p-6 rounded-[32px] shadow-xl border-2 border-[#FF00CC]/10 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">
                    {isEditing === 'NEW' ? 'New Menu Item' : 'Edit Menu Item'}
                  </h3>
                  <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Item Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                        placeholder="e.g. Special Burger"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Price (₱)</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Image URL</label>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={formData.image}
                          onChange={e => setFormData({...formData, image: e.target.value})}
                          className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                          placeholder="https://images.unsplash.com/..."
                        />
                        {formData.image && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
                            <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                      >
                        <option>Main</option>
                        <option>Sides</option>
                        <option>Drinks</option>
                        <option>Dessert</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC] h-[124px]"
                        placeholder="Describe your delicious food..."
                      />
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.isPopular}
                          onChange={e => setFormData({...formData, isPopular: e.target.checked})}
                          className="w-5 h-5 accent-[#FF00CC]"
                        />
                        <span className="text-xs font-black text-gray-600 uppercase">Popular</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.isSpicy}
                          onChange={e => setFormData({...formData, isSpicy: e.target.checked})}
                          className="w-5 h-5 accent-[#FF00CC]"
                        />
                        <span className="text-xs font-black text-gray-600 uppercase">Spicy 🌶️</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button onClick={handleSaveItem} className="flex-1 py-4 font-black uppercase tracking-widest">
                    <Save size={18} className="mr-2" /> Save Item
                  </Button>
                  <button 
                    onClick={() => setIsEditing(null)}
                    className="px-8 bg-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {restaurant?.items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex gap-4 items-center group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                      className="p-3 bg-gray-50 text-gray-400 hover:text-blue-500 rounded-xl transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Restaurant Name</label>
                            <input 
                                type="text" 
                                value={settingsData.name}
                                onChange={e => setSettingsData({...settingsData, name: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Cuisine Type</label>
                            <input 
                                type="text" 
                                value={settingsData.cuisine}
                                onChange={e => setSettingsData({...settingsData, cuisine: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Address</label>
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Banner Image URL</label>
                            <input 
                                type="text" 
                                value={settingsData.image}
                                onChange={e => setSettingsData({...settingsData, image: e.target.value})}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                            />
                        </div>
                        <div className="h-40 rounded-3xl overflow-hidden border border-gray-100">
                            <img src={settingsData.image} className="w-full h-full object-cover" alt="Banner Preview" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Pin Restaurant Location</label>
                    <MapPicker 
                        initialLat={settingsData.lat} 
                        initialLng={settingsData.lng} 
                        onLocationSelect={(lat, lng) => setSettingsData({...settingsData, lat, lng})} 
                    />
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
                        className="py-5 font-black uppercase tracking-widest"
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
