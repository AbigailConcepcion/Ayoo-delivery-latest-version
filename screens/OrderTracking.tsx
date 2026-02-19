
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { Order, OrderStatus } from '../types';
import socket from '../socket';
import { MapPin, Phone, MessageCircle, Star, Check, X, ArrowLeft, Package, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface OrderTrackingProps {
  onBack: () => void;
  order: Order | null;
}

interface NotificationToast {
  title: string;
  message: string;
  type: 'info' | 'success' | 'delivery' | 'error';
  id: number;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ onBack, order: initialOrder }) => {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isCalling, setIsCalling] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
  const [toast, setToast] = useState<NotificationToast | null>(null);
  const [riderRating, setRiderRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  
  // Real-time Rider Tracking State
  const [riderProgress, setRiderProgress] = useState(0); 
  const [trafficSeverity, setTrafficSeverity] = useState<'low' | 'moderate' | 'heavy'>('moderate');
  
  useEffect(() => {
    if (order?.id) {
      socket.emit('join_order', order.id);
      
      socket.on('order_status_updated', (updatedOrder: Order) => {
        setOrder(updatedOrder);
        
        const newToast: NotificationToast = {
          id: Date.now(),
          title: `Order ${updatedOrder.status.replace(/_/g, ' ')}`,
          message: `Your order from ${updatedOrder.restaurantName} is now ${updatedOrder.status.toLowerCase().replace(/_/g, ' ')}.`,
          type: updatedOrder.status === 'DELIVERED' ? 'success' : 'delivery'
        };
        setToast(newToast);
        setTimeout(() => setToast(null), 5000);

        if (updatedOrder.status === 'DELIVERED') {
          setTimeout(() => setShowRatingModal(true), 1500);
        }
      });

      return () => {
        socket.off('order_status_updated');
      };
    }
  }, [order?.id]);

  // Status timeline data
  const getStatusIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 1;
      case 'READY_FOR_PICKUP': return 2;
      case 'PICKED_UP': return 2;
      case 'DELIVERING': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const statusIndex = order ? getStatusIndex(order.status) : 0;

  const timelineSteps = [
    { label: 'Order Placed', icon: '📝', desc: 'We have received your order' },
    { label: 'Preparing', icon: '🍳', desc: 'The kitchen is cooking your meal' },
    { label: 'Out for Delivery', icon: '🛵', desc: 'Your rider is on the way' },
    { label: 'Delivered', icon: '✅', desc: 'Enjoy your food!' }
  ];

  // Map Coordinates (Mock percentages)
  const restaurantPos = { x: 20, y: 70 };
  const destinationPos = { x: 75, y: 30 };

  // Simulated Rider Movement
  useEffect(() => {
    let interval: number;
    if (order?.status === 'DELIVERING') {
      interval = window.setInterval(() => {
        setRiderProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 0.5; 
        });
      }, 500);
    } else if (order?.status === 'DELIVERED') {
      setRiderProgress(100);
    }
    return () => clearInterval(interval);
  }, [order?.status]);

  const currentRiderX = restaurantPos.x + (destinationPos.x - restaurantPos.x) * (riderProgress / 100);
  const currentRiderY = restaurantPos.y + (destinationPos.y - restaurantPos.y) * (riderProgress / 100);

  const handleCallRider = () => {
    setIsCalling(true);
    setTimeout(() => {
      alert("Initiating masked call to your rider...\nYour real number is hidden for privacy.");
      setIsCalling(false);
    }, 800);
  };

  const submitFeedback = () => {
    setIsFeedbackSubmitted(true);
    setTimeout(() => {
      setShowRatingModal(false);
      onBack();
    }, 2000);
  };

  const StarRating = ({ rating, setRating, label }: { rating: number, setRating: (n: number) => void, label: string }) => (
    <div className="flex flex-col items-center mb-6">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            onClick={() => setRating(star)}
            className={`text-3xl transition-all transform active:scale-125 ${star <= rating ? 'text-[#FFD700] drop-shadow-md scale-110' : 'text-gray-200'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  if (!order) return null;

  return (
    <div className="bg-[#F2F2F2] min-h-screen flex flex-col relative pb-32">
      
      {/* Rating Modal Overlay */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full rounded-[45px] p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="absolute top-0 left-0 right-0 h-2 ayoo-gradient"></div>
            
            {!isFeedbackSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-pink-50 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner">💝</div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-2">How was your Ayoo experience?</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Share the love!</p>
                </div>

                <StarRating rating={riderRating} setRating={setRiderRating} label="Rate your Rider" />
                <StarRating rating={foodRating} setRating={setFoodRating} label="Rate your Meal" />

                <div className="pt-4">
                  <Button 
                    onClick={submitFeedback} 
                    disabled={riderRating === 0 || foodRating === 0}
                    className="pill-shadow py-5 text-xl font-black uppercase tracking-widest"
                  >
                    Submit Review
                  </Button>
                  <button 
                    onClick={() => setShowRatingModal(false)}
                    className="w-full mt-4 text-gray-300 font-bold text-xs uppercase tracking-widest hover:text-gray-500"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 ayoo-gradient rounded-full mx-auto flex items-center justify-center text-5xl mb-6 shadow-xl text-white">🎉</div>
                <h3 className="text-3xl font-black text-[#FF00CC] tracking-tighter mb-2">Thank You!</h3>
                <p className="text-gray-500 font-bold">Your feedback helps us deliver better for Iligan City.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Push Notification Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] z-[100] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(255,0,204,0.15)] p-1 border border-pink-50 overflow-hidden flex items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${toast.type === 'success' ? 'bg-green-500' : 'bg-[#FF00CC]'} text-white ml-1 shadow-inner`}>
              {toast.type === 'success' ? '✅' : '🛵'}
            </div>
            <div className="flex-1 px-4 py-3">
              <h5 className="font-black text-[#FF00CC] text-xs uppercase tracking-widest mb-0.5">{toast.title}</h5>
              <p className="text-gray-800 font-bold text-sm tracking-tight leading-none">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-4 text-gray-300">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 flex items-center shadow-sm sticky top-0 z-50">
        <button onClick={onBack} className="text-[#FF00CC] text-2xl font-black mr-4 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-3">
          <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Order Tracking</h2>
        </div>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Real-time Map Section */}
        <div className="h-[350px] w-full relative p-4">
           <div className="w-full h-full bg-white rounded-[35px] overflow-hidden shadow-xl border border-white relative z-0">
              <MapContainer 
                center={[order.deliveryLat || 8.2285, order.deliveryLng || 124.2452]} 
                zoom={14} 
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Destination Marker */}
                {order.deliveryLat && order.deliveryLng && (
                  <Marker position={[order.deliveryLat, order.deliveryLng]}>
                  </Marker>
                )}

                {/* Rider Marker */}
                {order.riderLat && order.riderLng && (
                  <Marker 
                    position={[order.riderLat, order.riderLng]}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div style="background-color: #FF00CC; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3)">🛵</div>`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20]
                    })}
                  />
                )}

                {/* Path */}
                {order.riderLat && order.riderLng && order.deliveryLat && order.deliveryLng && (
                  <Polyline 
                    positions={[
                      [order.riderLat, order.riderLng],
                      [order.deliveryLat, order.deliveryLng]
                    ]} 
                    color="#FF00CC"
                    dashArray="10, 10"
                    weight={3}
                  />
                )}
              </MapContainer>
           </div>
        </div>

        {/* Rider Info Card */}
        <div className="px-6 mb-8 mt-2">
          {order.riderId ? (
            <div className="bg-white rounded-[35px] p-6 shadow-2xl border border-gray-50 relative overflow-hidden group">
               <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-gray-100 border-[3px] border-white shadow-xl">
                    <img src="https://picsum.photos/seed/rider-juan/200/200" alt="Rider" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-black text-gray-900 text-lg tracking-tight leading-none">Your Rider</h4>
                        <p className="text-[10px] text-[#FF00CC] font-black uppercase tracking-widest mt-1">On the way to you</p>
                      </div>
                      <div className="bg-yellow-400 text-black px-2 py-1 rounded-xl text-[10px] font-black shadow-sm">4.9 ⭐</div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                        <button 
                          onClick={handleCallRider}
                          disabled={isCalling}
                          className="flex-1 h-10 bg-[#FF00CC] text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone size={14} /> Call
                        </button>
                        <button className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl font-black flex items-center justify-center border border-gray-100">
                          <MessageCircle size={18} />
                        </button>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-white/70 rounded-[35px] p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 animate-pulse">
               <div className="text-center">
                  <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest">Assigning Rider...</p>
               </div>
            </div>
          )}
        </div>

        {/* Timeline Section */}
        <div className="px-6 mb-8">
          <div className="bg-white rounded-[35px] p-8 shadow-md border border-gray-50 relative overflow-hidden">
            <h3 className="font-black text-gray-900 text-lg tracking-tight uppercase leading-none mb-10">Order Status</h3>
            
            <div className="relative">
              <div className="absolute left-[20px] top-4 bottom-4 w-[4px] bg-gray-50 rounded-full"></div>
              <div 
                className="absolute left-[20px] top-4 w-[4px] bg-[#FF00CC] rounded-full transition-all duration-1000 ease-in-out"
                style={{ height: `${(statusIndex / (timelineSteps.length - 1)) * 100}%` }}
              ></div>

              <div className="space-y-12">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index < statusIndex;
                  const isCurrent = index === statusIndex;
                  const isFuture = index > statusIndex;

                  return (
                    <div key={index} className="flex gap-8 items-start relative z-10 group">
                      <div className={`
                        w-11 h-11 rounded-[16px] flex items-center justify-center text-xl shadow-lg transition-all duration-500
                        ${isCompleted ? 'bg-[#FF00CC] text-white scale-90' : ''}
                        ${isCurrent ? 'bg-[#FF00CC] text-white scale-110 ring-8 ring-pink-50' : ''}
                        ${isFuture ? 'bg-white border-2 border-gray-100 text-gray-300' : ''}
                      `}>
                        {isCompleted ? '✓' : step.icon}
                      </div>

                      <div className="flex-1 pt-1">
                        <h4 className={`font-black text-[15px] tracking-tight transition-colors duration-300 ${isFuture ? 'text-gray-300' : 'text-gray-900'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-[12px] font-bold leading-snug transition-colors duration-300 ${isFuture ? 'text-gray-200' : 'text-gray-400'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="px-6 mb-12">
           <div className="bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden">
             <button 
               onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
               className="w-full p-6 flex justify-between items-center"
             >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl">🥡</div>
                 <div className="text-left">
                    <h4 className="font-black text-gray-900 text-sm tracking-tight uppercase leading-none">Order Details</h4>
                    <p className="text-[11px] font-black text-gray-400 uppercase mt-1.5 tracking-tighter">
                      {order.items.length} items • ₱{order.total}
                    </p>
                 </div>
               </div>
               <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform duration-300 ${isOrderSummaryOpen ? 'rotate-180' : ''}`}>
                 ▼
               </div>
             </button>

             {isOrderSummaryOpen && (
               <div className="p-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="space-y-4">
                   {order.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center">
                       <p className="font-bold text-gray-900 text-sm">{item.quantity}x {item.name}</p>
                       <span className="font-black text-gray-900 text-sm">₱{item.price * item.quantity}</span>
                     </div>
                   ))}
                   <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                     <span className="font-black text-gray-900 text-base uppercase tracking-tighter">Total</span>
                     <span className="font-black text-[#FF00CC] text-2xl">₱{order.total}</span>
                   </div>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/95 backdrop-blur-3xl rounded-t-[50px] shadow-[0_-25px_60px_rgba(0,0,0,0.1)] z-[60] max-w-md mx-auto border-t border-pink-50">
        <Button 
          onClick={onBack} 
          className="pill-shadow py-6 text-xl font-black uppercase tracking-[0.1em] active:scale-95 transition-all"
        >
          {order.status === 'DELIVERED' ? 'Order Again' : 'Back to Home'}
        </Button>
      </div>
    </div>
  );
};

export default OrderTracking;
