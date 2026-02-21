import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import socket from '../socket';
import { MapPin, Navigation, Package, CheckCircle, LogOut, DollarSign, Clock, Bike, ChevronRight, History, Bell, Store } from 'lucide-react';
import Logo from '../components/Logo';

const RiderDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'ACTIVE' | 'HISTORY'>('AVAILABLE');
  const [isOnline, setIsOnline] = useState(true);

  // Simulated GPS tracking
  useEffect(() => {
    if (!isOnline) return;
    
    const activeOrders = myOrders.filter(o => o.status === 'DELIVERING');
    if (activeOrders.length > 0) {
      const interval = setInterval(() => {
        activeOrders.forEach(order => {
          // Simulate movement towards destination
          const newLat = (order.riderLat || 8.2285) + (Math.random() - 0.5) * 0.001;
          const newLng = (order.riderLng || 124.2452) + (Math.random() - 0.5) * 0.001;
          
          fetch(`/api/orders/${order.id}/location`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: newLat, lng: newLng }),
          });
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [myOrders, isOnline]);

  useEffect(() => {
    fetchOrders();
    
    socket.on('order_available', (newOrder: Order) => {
      if (isOnline) {
        setAvailableOrders(prev => [newOrder, ...prev]);
      }
    });

    socket.on('order_updated', (updatedOrder: Order) => {
      // Update my orders if I'm the rider
      if (updatedOrder.riderId === user?.id) {
        setMyOrders(prev => {
          const exists = prev.find(o => o.id === updatedOrder.id);
          if (exists) return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
          return [updatedOrder, ...prev];
        });
      }
      
      // Remove from available if taken by someone else or status changed
      if (updatedOrder.status !== 'PENDING' && updatedOrder.status !== 'READY_FOR_PICKUP') {
        setAvailableOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
      }
    });

    return () => {
      socket.off('order_available');
      socket.off('order_updated');
    };
  }, [user, isOnline]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const [availableRes, myRes] = await Promise.all([
        fetch('/api/orders/available'),
        fetch(`/api/orders/rider/${user?.id}`)
      ]);
      
      if (availableRes.ok) {
        const availData = await availableRes.json();
        setAvailableOrders(availData);
      }
      
      if (myRes.ok) {
        const myData = await myRes.json();
        setMyOrders(myData);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, riderId: user?.id }),
      });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        
        // Optimistic update
        setMyOrders(prev => {
          const exists = prev.find(o => o.id === orderId);
          if (exists) return prev.map(o => o.id === orderId ? updatedOrder : o);
          return [updatedOrder, ...prev];
        });
        
        if (status === 'ACCEPTED') {
          setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
          setActiveTab('ACTIVE');
        }
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const calculateEarnings = () => {
    // Simple calculation: 10% of order total + base fee 45
    return myOrders
      .filter(o => o.status === 'DELIVERED')
      .reduce((acc, curr) => acc + (curr.total * 0.1) + 45, 0);
  };

  const activeDeliveries = myOrders.filter(o => ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(o.status));
  const completedDeliveries = myOrders.filter(o => o.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white p-6 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
          <Logo variant="colored" size="sm" withSubtext={false} />
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <button onClick={() => setIsOnline(!isOnline)} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <Bike size={18} className={isOnline ? 'text-green-600' : 'text-gray-400'} />
            </button>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-[#1A1A1A] text-white p-5 rounded-[24px] shadow-lg shadow-gray-200 mb-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Earnings</p>
              <h2 className="text-3xl font-black">₱{calculateEarnings().toFixed(2)}</h2>
            </div>
            <div className="bg-[#FF00CC] p-2 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-gray-400">
            <span>{completedDeliveries.length} Completed</span>
            <span>•</span>
            <span>{activeDeliveries.length} Active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('AVAILABLE')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'AVAILABLE' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400'}`}
          >
            Available ({availableOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'ACTIVE' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400'}`}
          >
            Active ({activeDeliveries.length})
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'HISTORY' ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400'}`}
          >
            History
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'AVAILABLE' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isOnline ? (
               <div className="text-center py-20 opacity-50">
                <Bike className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-bold">Go online to see orders</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Package className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-bold">No orders available nearby</p>
              </div>
            ) : (
              availableOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                        <Store size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-sm">{order.restaurantName}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Restaurant</p>
                      </div>
                    </div>
                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      ₱{(order.total * 0.1 + 45).toFixed(0)} Earn
                    </span>
                  </div>

                  <div className="pl-4 border-l-2 border-gray-100 ml-5 space-y-4 mb-4">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-gray-200 rounded-full border-2 border-white"></div>
                      <p className="text-xs text-gray-600 font-bold mb-1">{order.restaurantName}</p>
                      <p className="text-[10px] text-gray-400 truncate">Pickup Location</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#FF00CC] rounded-full border-2 border-white"></div>
                      <p className="text-xs text-gray-600 font-bold mb-1">{order.deliveryAddress}</p>
                      <p className="text-[10px] text-gray-400 truncate">Dropoff Location</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="text-xs font-bold text-gray-500">
                      {order.items.length} items • {(order.total).toFixed(0)} PHP Total
                    </div>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                      className="bg-[#FF00CC] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-200 active:scale-95 transition-all"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ACTIVE' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeDeliveries.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Navigation className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-bold">No active deliveries</p>
              </div>
            ) : (
              activeDeliveries.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[32px] shadow-lg border-2 border-[#FF00CC]/10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 bg-pink-50 text-[#FF00CC] rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-black text-gray-900">Order #{order.id.substr(0, 6)}</span>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 z-10">
                          <Store size={16} />
                        </div>
                        <div className="w-0.5 h-12 bg-gray-100"></div>
                        <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 z-10">
                          <MapPin size={16} />
                        </div>
                      </div>
                      <div className="flex-1 space-y-8 pt-1">
                        <div>
                          <h4 className="font-black text-gray-900 text-sm">{order.restaurantName}</h4>
                          <p className="text-xs text-gray-500 mt-1">Pickup Order</p>
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-sm">{order.customerName}</h4>
                          <p className="text-xs text-gray-500 mt-1">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {order.status === 'ACCEPTED' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'PICKED_UP')}
                        className="col-span-2 bg-[#FF00CC] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-200 active:scale-95 transition-all"
                      >
                        Confirm Pickup
                      </button>
                    )}
                    {order.status === 'PICKED_UP' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'DELIVERING')}
                        className="col-span-2 bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all"
                      >
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'DELIVERING' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="col-span-2 bg-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200 active:scale-95 transition-all"
                      >
                        Complete Delivery
                      </button>
                    )}
                    
                    <a href={`tel:${order.customerId}`} className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">
                      Call Customer
                    </a>
                    <button className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">
                      Message
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {completedDeliveries.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <History className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-bold">No delivery history yet</p>
              </div>
            ) : (
              completedDeliveries.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">Order #{order.id.substr(0, 6)}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">₱{(order.total * 0.1 + 45).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Earned</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RiderDashboard;
