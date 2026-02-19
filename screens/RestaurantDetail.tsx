
import React, { useState, useMemo } from 'react';
import { Restaurant, FoodItem } from '../types';
import Button from '../components/Button';
import { ArrowLeft, Share2, Heart, Star, Clock, Bike, Flame, Sparkles } from 'lucide-react';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onAddToCart: (item: FoodItem) => void;
}

const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant, onBack, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Group items by category
  const categorizedItems = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    restaurant.items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [restaurant.items]);

  const categories = ['All', ...Object.keys(categorizedItems)];

  const displayItems: Record<string, FoodItem[]> = activeCategory === 'All' 
    ? categorizedItems 
    : { [activeCategory]: categorizedItems[activeCategory] || [] };

  const displayEntries = Object.entries(displayItems) as [string, FoodItem[]][];

  return (
    <div className="bg-white min-h-screen pb-32 overflow-y-auto scrollbar-hide">
      {/* Visual Header */}
      <div className="relative h-80">
        <img src={restaurant.image} className="w-full h-full object-cover" alt={restaurant.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Top Controls */}
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-20">
          <button 
            onClick={onBack}
            className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-3">
             <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">
                <Share2 size={20} />
             </button>
             <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">
                <Heart size={20} />
             </button>
          </div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-12 left-8 right-8 text-white z-10">
            <div className="flex items-center gap-3 mb-3">
                {restaurant.isPartner && (
                  <span className="bg-[#FF00CC] text-white px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg border border-white/20 flex items-center gap-1">
                    <Sparkles size={10} /> Ayoo Partner
                  </span>
                )}
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg">Top Rated</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{restaurant.name}</h2>
            <div className="flex items-center gap-3 text-white/80 font-bold text-xs uppercase tracking-widest">
                <span>{restaurant.cuisine}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                <span>{restaurant.address}</span>
            </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white -mt-10 relative rounded-t-[50px] px-8 pt-12">
        {/* Quick Stats */}
        <div className="flex justify-between items-center mb-12 bg-gray-50 p-6 rounded-[35px] border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center">
                <Star size={24} className="text-yellow-400 mb-1" />
                <span className="font-black text-gray-900 text-lg leading-none">{restaurant.rating}</span>
                <span className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">Reviews</span>
            </div>
            <div className="w-[2px] h-10 bg-gray-200"></div>
            <div className="flex flex-col items-center">
                <Clock size={24} className="text-blue-400 mb-1" />
                <span className="font-black text-gray-900 text-lg leading-none">{restaurant.deliveryTime}</span>
                <span className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">Delivery</span>
            </div>
            <div className="w-[2px] h-10 bg-gray-200"></div>
            <div className="flex flex-col items-center">
                <Bike size={24} className="text-green-500 mb-1" />
                <span className="font-black text-green-500 text-lg leading-none">FREE</span>
                <span className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">Courier</span>
            </div>
        </div>

        {/* Category Tabs */}
        <div className="sticky top-0 bg-white z-30 -mx-8 px-8 py-4 mb-8 overflow-x-auto scrollbar-hide flex gap-3 border-b border-gray-50">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                 activeCategory === cat 
                 ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200 translate-y-[-2px]' 
                 : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-12 pb-10">
          {displayEntries.map(([category, items]) => (
            <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end mb-8">
                  <h3 className="font-black text-2xl text-gray-900 tracking-tighter uppercase leading-none">{category}</h3>
                  <div className="w-1/2 h-[3px] bg-pink-50 rounded-full mb-1"></div>
               </div>
               
               <div className="space-y-8">
                  {items.map(item => (
                    <div key={item.id} className="group flex gap-6 items-start">
                      <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 rounded-[32px] overflow-hidden shadow-xl border-4 border-white group-hover:scale-105 transition-transform duration-500">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        {item.isPopular && (
                          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-tighter border-2 border-white flex items-center gap-1">
                            <Sparkles size={8} /> Popular
                          </div>
                        )}
                        {item.isSpicy && (
                          <div className="absolute -bottom-2 -left-2 bg-red-500 text-white text-[12px] p-1.5 rounded-xl shadow-lg border-2 border-white">
                            <Flame size={14} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col min-h-[128px]">
                        <div className="flex-1">
                          <h4 className="font-black text-xl text-gray-900 leading-tight tracking-tight mb-1">{item.name}</h4>
                          <p className="text-[11px] text-gray-400 font-bold line-clamp-2 leading-relaxed tracking-tight">
                             {item.description}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest leading-none mb-1">Price</span>
                             <span className="font-black text-2xl text-[#FF00CC]">₱{item.price}</span>
                          </div>
                          <button 
                            onClick={() => onAddToCart(item)}
                            className="bg-[#FF00CC] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all shadow-pink-100"
                          >
                            Add to Cart +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
