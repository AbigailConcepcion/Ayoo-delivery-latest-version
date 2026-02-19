
import React, { useState } from 'react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Restaurant, Order, Voucher } from '../types';
import { ShoppingBag, ArrowLeft, CreditCard, MapPin, Ticket, X } from 'lucide-react';
import MapPicker from '../components/MapPicker';

interface CartProps {
  items: { id: string; name: string; price: number; quantity: number }[];
  onBack: () => void;
  onCheckout: (order: Order) => void;
  restaurant: Restaurant | null;
}

const Cart: React.FC<CartProps> = ({ items, onBack, onCheckout, restaurant }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState(user?.address || 'Aguinaldo St, Iligan City');
  const [location, setLocation] = useState({ lat: user?.lat || 8.2285, lng: user?.lng || 124.2452 });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');

  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const deliveryFee = 45;
  
  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;
    if (subtotal < appliedVoucher.minOrderValue) return 0;
    
    let discount = 0;
    if (appliedVoucher.discountType === 'PERCENTAGE') {
      discount = (subtotal * appliedVoucher.discountValue) / 100;
      if (appliedVoucher.maxDiscount) {
        discount = Math.min(discount, appliedVoucher.maxDiscount);
      }
    } else {
      discount = appliedVoucher.discountValue;
    }
    return discount;
  };

  const discount = calculateDiscount();
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setVoucherError('');
    try {
      const response = await fetch(`/api/vouchers/validate/${voucherCode}`);
      if (response.ok) {
        const voucher = await response.json();
        if (subtotal < voucher.minOrderValue) {
          setVoucherError(`Min. order ₱${voucher.minOrderValue} required`);
        } else {
          setAppliedVoucher(voucher);
          setVoucherCode('');
        }
      } else {
        const data = await response.json();
        setVoucherError(data.message || 'Invalid code');
      }
    } catch (error) {
      setVoucherError('Failed to validate voucher');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !restaurant) return;
    setIsSubmitting(true);

    try {
      // 1. Create the order first (status: PENDING or PENDING_PAYMENT)
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          restaurantId: restaurant.id,
          items,
          total,
          deliveryAddress: address,
          deliveryLat: location.lat,
          deliveryLng: location.lng,
          customerName: user.name,
          restaurantName: restaurant.name,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'AWAITING_PAYMENT',
          riderLat: restaurant.lat || 8.2285, // Start at restaurant
          riderLng: restaurant.lng || 124.2452,
        }),
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const order = await orderResponse.json();

      if (paymentMethod === 'ONLINE') {
        // 2. Create Stripe Checkout Session
        const stripeResponse = await fetch('/api/payments/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            items,
            total,
            customerEmail: user.email,
          }),
        });

        if (stripeResponse.ok) {
          const { url } = await stripeResponse.json();
          window.location.href = url; // Redirect to Stripe
          return;
        } else {
          const errorData = await stripeResponse.json();
          alert(`Payment Error: ${errorData.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      // If COD, just proceed to tracking
      onCheckout(order);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="bg-white p-6 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-gray-900">Your Cart</h2>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <ShoppingBag size={64} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">Your cart is empty. Hungry?</p>
            <Button onClick={onBack} variant="outline" className="mt-6" fullWidth={false}>Explore Food</Button>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-[32px] shadow-sm">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#FF00CC]" /> Order Summary
              </h3>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center font-black text-[#FF00CC] text-xs">
                        {item.quantity}x
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">₱{item.price} each</p>
                      </div>
                    </div>
                    <span className="font-black text-gray-900">₱{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Subtotal</span>
                <span className="font-black text-gray-900">₱{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Delivery Fee</span>
                <span className="font-black text-gray-900">₱{deliveryFee}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-sm text-green-500">
                  <span className="font-bold flex items-center gap-1">
                    <Ticket size={12} /> Discount ({appliedVoucher.code})
                  </span>
                  <span className="font-black">-₱{discount}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="font-black text-lg text-gray-900">Total</span>
                <span className="font-black text-2xl text-[#FF00CC]">₱{total}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm">
                <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Ticket size={18} className="text-[#FF00CC]" /> Promo Voucher
                </h4>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between p-4 bg-pink-50 rounded-2xl border border-pink-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#FF00CC] shadow-sm">
                        <Ticket size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{appliedVoucher.code}</p>
                        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">₱{discount} discount applied</p>
                      </div>
                    </div>
                    <button onClick={() => setAppliedVoucher(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="ENTER PROMO CODE"
                        className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs tracking-widest focus:outline-none focus:border-[#FF00CC] uppercase"
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        className="px-6 bg-[#FF00CC] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-100 active:scale-95 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                    {voucherError && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-2">{voucherError}</p>}
                  </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm">
                <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-[#FF00CC]" /> Delivery Address
                </h4>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-transparent font-bold text-sm text-gray-700 focus:outline-none"
                  />
                </div>
                <MapPicker 
                    initialLat={location.lat} 
                    initialLng={location.lng} 
                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })} 
                />
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm">
                <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-[#FF00CC]" /> Payment Method
                </h4>
                <div className="space-y-3">
                  <button 
                    onClick={() => setPaymentMethod('COD')}
                    className={`w-full flex items-center justify-between border-2 p-4 rounded-2xl transition-all ${paymentMethod === 'COD' ? 'border-[#FF00CC] bg-pink-50/30' : 'border-gray-100 bg-white'}`}
                  >
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">💵</span>
                          <span className="font-black text-sm text-gray-800">Cash on Delivery</span>
                      </div>
                      {paymentMethod === 'COD' && <div className="w-5 h-5 bg-[#FF00CC] rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`w-full flex items-center justify-between border-2 p-4 rounded-2xl transition-all ${paymentMethod === 'ONLINE' ? 'border-[#FF00CC] bg-pink-50/30' : 'border-gray-100 bg-white'}`}
                  >
                      <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div className="text-left">
                            <span className="font-black text-sm text-gray-800 block">Online Payment</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Card / GCash / Maya</span>
                          </div>
                      </div>
                      {paymentMethod === 'ONLINE' && <div className="w-5 h-5 bg-[#FF00CC] rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                  </button>
                </div>
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <Button onClick={handlePlaceOrder} disabled={isSubmitting} className="py-5 text-xl font-black pill-shadow">
            {isSubmitting ? 'Processing...' : paymentMethod === 'ONLINE' ? 'Pay Now' : 'Place Order'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
