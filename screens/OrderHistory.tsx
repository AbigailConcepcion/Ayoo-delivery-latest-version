
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { ArrowLeft, Package, Calendar, MapPin, ChevronRight, Receipt, Repeat } from 'lucide-react';
import Button from '../components/Button';

interface OrderHistoryProps {
  onBack: () => void;
  onReorder: (order: Order) => void;
  onTrackOrder: (order: Order) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack, onReorder, onTrackOrder }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders/customer/${user?.id}`);
      const data = await response.json();
      // Sort by date descending
      setOrders(data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-500 bg-green-50';
      case 'CANCELLED': return 'text-red-500 bg-red-50';
      case 'PENDING': return 'text-yellow-500 bg-yellow-50';
      default: return 'text-[#FF00CC] bg-pink-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedOrder) {
    return (
      <div className="bg-white min-h-screen flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 flex items-center gap-4 border-b border-gray-50 sticky top-0 bg-white z-10">
          <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#FF00CC]">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-gray-900">Order Receipt</h2>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto pb-32">
            <div className="text-center py-4">
                <div className="w-20 h-20 bg-pink-50 rounded-[30px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">🧾</div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1">{selectedOrder.restaurantName}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(selectedOrder.createdAt)}</p>
            </div>

            <div className="bg-gray-50 rounded-[35px] p-8 space-y-6 border border-gray-100">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 border-dashed">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</span>
                    <span className="font-mono text-xs font-bold text-gray-600">#{selectedOrder.id}</span>
                </div>

                <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-[#FF00CC] shadow-sm">{item.quantity}x</span>
                                <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                            </div>
                            <span className="font-black text-gray-900 text-sm">₱{item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-gray-200 border-dashed space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold">Subtotal</span>
                        <span className="text-gray-600 font-black">₱{selectedOrder.total - 49}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold">Delivery Fee</span>
                        <span className="text-gray-600 font-black">₱49</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-900 font-black text-lg uppercase tracking-tighter">Total Paid</span>
                        <span className="text-3xl font-black text-[#FF00CC]">₱{selectedOrder.total}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-3xl bg-white border border-gray-100">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#FF00CC]">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivered To</p>
                        <p className="text-sm font-bold text-gray-700 leading-tight">{selectedOrder.deliveryAddress}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-3xl bg-white border border-gray-100">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#FF00CC]">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                        <p className="text-sm font-bold text-gray-700 leading-tight">{selectedOrder.paymentMethod || 'Cash on Delivery'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-50 fixed bottom-0 left-0 right-0 max-w-md mx-auto flex gap-3">
            <Button 
                onClick={() => onReorder(selectedOrder)} 
                className="flex-1 py-5 font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
                <Repeat size={20} /> Re-order
            </Button>
            {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                <button 
                    onClick={() => onTrackOrder(selectedOrder)}
                    className="flex-1 py-5 bg-pink-50 text-[#FF00CC] rounded-3xl font-black text-xs uppercase tracking-widest"
                >
                    Track Live
                </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F9F9] min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#FF00CC]">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-gray-900">Order History</h2>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-[#FF00CC] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Loading History...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center px-10">
            <div className="w-24 h-24 bg-gray-100 rounded-[40px] flex items-center justify-center text-5xl mb-6 grayscale opacity-50">🍔</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-400 font-bold text-sm">Your delicious journey starts here. Order your first meal today!</p>
            <Button onClick={onBack} className="mt-8 py-4 px-10 font-black uppercase tracking-widest">Explore Food</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-pink-50 transition-colors">
                        {order.status === 'DELIVERED' ? '✅' : order.status === 'CANCELLED' ? '❌' : '🛵'}
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 tracking-tight leading-none mb-1">{order.restaurantName}</h4>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-gray-300">•</span>
                            <span className="text-[10px] font-bold text-gray-400">{formatDate(order.createdAt)}</span>
                        </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-200 group-hover:text-[#FF00CC] transition-colors" />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                        {order.items.length} items • ₱{order.total}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onReorder(order);
                            }}
                            className="p-2 bg-gray-50 text-gray-400 hover:text-[#FF00CC] hover:bg-pink-50 rounded-xl transition-all"
                        >
                            <Repeat size={18} />
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
