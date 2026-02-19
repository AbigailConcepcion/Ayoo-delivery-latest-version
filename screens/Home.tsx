
import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { Restaurant, Voucher } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, ShoppingBag, Star, MapPin, RefreshCw, Ticket } from 'lucide-react';

interface HomeProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  cartCount: number;
}

const Home: React.FC<HomeProps> = ({ onSelectRestaurant, onOpenCart, onOpenProfile, onOpenHistory, cartCount }) => {
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    fetchRestaurants();
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers');
      const data = await response.json();
      setVouchers(data.filter((v: Voucher) => v.isActive));
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    }
  };

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/restaurants');
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const askAi = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Recommend a restaurant in Iligan City for: ${search || 'popular food'}. Choices: ${restaurants.map(r => r.name).join(', ')}. Keep it under 20 words.`,
      });
      setAiSuggestion(response.text || "Try Jollibee!");
    } catch (err) {
      setAiSuggestion("Tatay's Grill is the local favorite for BBQ!");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-white pb-24 overflow-y-auto scroll-smooth scrollbar-hide">
      {/* Header */}
      <div className="bg-[#FF00CC] p-6 rounded-b-[45px] shadow-xl sticky top-0 z-40">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 ayoo-gradient rounded-[18px] flex items-center justify-center p-[2.5px] shadow-lg">
                <div className="bg-white w-full h-full rounded-[16px] flex items-center justify-center font-black text-[#FF00CC] text-xl">ay</div>
            </div>
            <div className="text-white">
              <p className="text-[10px] opacity-80 font-black uppercase tracking-[0.2em] leading-none mb-1">Delivering to</p>
              <div className="flex items-center gap-1">
                <p className="font-extrabold text-xl tracking-tighter">Iligan City</p>
                <span className="text-[10px] bg-white/20 p-1 rounded-md">▼</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onOpenCart}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center relative text-[#FF00CC] shadow-xl active:scale-90 transition-transform"
          >
            <ShoppingBag size={24} strokeWidth={2.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FFD700] text-black text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#FF00CC] shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Search food or merchant..."
            className="w-full p-5 pl-14 rounded-2xl bg-white shadow-2xl focus:outline-none ring-[#FFD700]/30 transition-all font-bold text-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <button 
            onClick={askAi}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FF00CC] text-white text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {aiLoading ? '...' : 'AI Pick'}
          </button>
        </div>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="mx-6 mt-6 p-5 bg-pink-50 rounded-[28px] border-2 border-[#FF00CC]/10 shadow-lg animate-in zoom-in-95 duration-300">
            <p className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest mb-1 flex items-center gap-2">✨ AI Recommendation</p>
            <p className="text-gray-700 font-bold italic leading-snug">"{aiSuggestion}"</p>
        </div>
      )}

      {/* Vouchers Section */}
      {vouchers.length > 0 && (
        <div id="vouchers-section" className="px-6 pt-8 animate-in fade-in slide-in-from-right duration-700">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Exclusive Promos</h3>
            <button className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {vouchers.map(voucher => (
              <div key={voucher.id} className="flex-shrink-0 w-72 bg-gradient-to-br from-[#FF00CC] to-[#8B5CF6] p-5 rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-pink-100 group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket size={18} className="text-[#FFD700]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{voucher.code}</span>
                  </div>
                  <h4 className="text-2xl font-black tracking-tighter mb-1 leading-none">{voucher.description}</h4>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Min. order ₱{voucher.minOrderValue}</p>
                </div>
                <div className="absolute right-5 bottom-5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-widest">Copy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Chips */}
      <div className="px-6 pt-8">
        <h3 className="font-black text-lg text-gray-900 mb-4 tracking-tighter uppercase">Categories</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="flex-shrink-0 flex flex-col items-center gap-2 bg-white px-4 py-5 rounded-[28px] shadow-sm border border-gray-100 hover:border-[#FF00CC] hover:shadow-lg transition-all cursor-pointer group min-w-[90px]">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Food Section */}
      <div className="px-6 pt-8 pb-10">
        <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="font-black text-2xl text-gray-900 tracking-tighter leading-none">Nearby Merchants</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Hand-picked for you</p>
            </div>
            <button onClick={fetchRestaurants} className="text-[#FF00CC] text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF00CC]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredRestaurants.map(res => (
              <div 
                key={res.id} 
                className="group bg-white rounded-[40px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100/50 cursor-pointer"
                onClick={() => onSelectRestaurant(res)}
              >
                <div className="h-64 overflow-hidden relative">
                  <img src={res.image} alt={res.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                     <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-[#FF00CC] shadow-xl flex items-center gap-2 uppercase tracking-widest">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {res.deliveryTime}
                     </div>
                     {res.isPartner && (
                       <div className="bg-[#FF00CC] px-4 py-2 rounded-2xl text-[10px] font-black text-white shadow-xl flex items-center gap-2 uppercase tracking-widest border border-white/20">
                          ✨ Partner Merchant
                       </div>
                     )}
                  </div>

                  <div className="absolute top-5 right-5 bg-white p-3 rounded-full shadow-lg transform group-hover:rotate-12 transition-transform hover:scale-110">
                     ❤️
                  </div>
                  
                  <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] text-white font-black uppercase tracking-[0.2em] border border-white/10">
                          {res.cuisine}
                      </div>
                      <div className="bg-yellow-400 text-black px-4 py-2 rounded-2xl text-[10px] font-black shadow-lg flex items-center gap-1">
                        {res.rating} <Star size={10} fill="currentColor" />
                      </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-2xl text-gray-900 tracking-tight leading-none">{res.name}</h4>
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                          <img src={`https://i.pravatar.cc/100?u=${res.id}${i}`} alt="User" />
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-500">+1k</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="text-green-500">●</span> Free Delivery
                    </span>
                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                    <span className="text-[#FF00CC] font-black text-[11px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      View Menu →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-8 py-5 flex justify-around items-center max-w-md mx-auto rounded-t-[45px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
        <button className="flex flex-col items-center text-[#FF00CC] active:scale-90 transition-transform group">
          <span className="text-2xl mb-1 group-hover:-translate-y-1 transition-transform">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => {
            const el = document.getElementById('vouchers-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }} 
          className="flex flex-col items-center text-gray-300 active:scale-90 transition-transform group"
        >
          <span className="text-2xl mb-1 opacity-60 group-hover:-translate-y-1 transition-transform">🎫</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Voucher</span>
        </button>
        <button onClick={onOpenHistory} className="flex flex-col items-center text-gray-300 active:scale-90 transition-transform group">
          <span className="text-2xl mb-1 opacity-60 group-hover:-translate-y-1 transition-transform">📑</span>
          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
        </button>
        <button onClick={onOpenProfile} className="flex flex-col items-center text-gray-300 active:scale-90 transition-transform group">
          <span className="text-2xl mb-1 opacity-60 group-hover:-translate-y-1 transition-transform">👤</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
        <button onClick={logout} className="flex flex-col items-center text-gray-300 active:scale-90 transition-transform group">
          <LogOut size={24} className="mb-1 opacity-60 group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
