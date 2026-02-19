
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import Button from '../components/Button';
import MapPicker from '../components/MapPicker';
import { ArrowLeft, User as UserIcon, Phone, MapPin, Save, LogOut } from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const { user, login, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    lat: user?.lat || 8.2285,
    lng: user?.lng || 124.2452,
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        const token = localStorage.getItem('ayoo_token');
        if (token) login(updatedUser, token);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#FF00CC]">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
      </div>

      <div className="flex-1 p-6 space-y-8 overflow-y-auto pb-32">
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-pink-50 rounded-[35px] flex items-center justify-center text-4xl mb-4 shadow-inner border-4 border-white">
                {user?.role === 'CUSTOMER' ? '👤' : user?.role === 'MERCHANT' ? '🍳' : '🛵'}
            </div>
            <p className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">{user?.role} Account</p>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon size={12} /> Full Name
                </label>
                <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={12} /> Phone Number
                </label>
                <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                    placeholder="09XX XXX XXXX"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> Delivery Address
                </label>
                <input 
                    type="text" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF00CC]"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> Pin Location on Map
                </label>
                <MapPicker 
                    initialLat={formData.lat} 
                    initialLng={formData.lng} 
                    onLocationSelect={(lat, lng) => setFormData({...formData, lat, lng})} 
                />
            </div>
        </div>

        <button 
            onClick={logout}
            className="w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
            <LogOut size={18} /> Logout Account
        </button>
      </div>

      <div className="p-6 bg-white border-t border-gray-50 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
        <Button onClick={handleSave} disabled={isSubmitting} className="py-5 font-black uppercase tracking-widest">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
