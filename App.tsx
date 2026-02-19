
import React, { useState, useEffect } from 'react';
import { AppScreen, Restaurant, Order, FoodItem } from './types';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import Home from './screens/Home';
import RestaurantDetail from './screens/RestaurantDetail';
import Cart from './screens/Cart';
import OrderTracking from './screens/OrderTracking';
import MerchantDashboard from './screens/MerchantDashboard';
import RiderDashboard from './screens/RiderDashboard';
import AdminPanel from './screens/AdminPanel';
import Profile from './screens/Profile';
import OrderHistory from './screens/OrderHistory';
import { AuthProvider, useAuth } from './context/AuthContext';
import socket from './socket';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const [screen, setScreen] = useState<AppScreen>('ONBOARDING');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const orderId = urlParams.get('order_id');

    if (paymentSuccess === 'true' && orderId) {
      // Finalize order status on the backend
      const finalizePayment = async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACCEPTED' }), // Or a specific 'PAID' status
          });
          if (response.ok) {
            const order = await response.json();
            setActiveOrder(order);
            setScreen('TRACKING');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Failed to finalize payment:', error);
        }
      };
      finalizePayment();
    }
  }, []);

  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      if (user.role === 'MERCHANT') setScreen('MERCHANT_DASHBOARD');
      else if (user.role === 'RIDER') setScreen('RIDER_DASHBOARD');
      else if (user.role === 'ADMIN') setScreen('ADMIN_PANEL');
      else setScreen('HOME');
    }
  }, [isAuthenticated, user, isInitializing]);

  const addToCart = (item: FoodItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const navigateToRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setScreen('RESTAURANT');
  };

  const handleReorder = (order: Order) => {
    // Find restaurant
    const fetchRestaurantAndReorder = async () => {
      try {
        const response = await fetch(`/api/restaurants/${order.restaurantId}`);
        const restaurant = await response.json();
        setSelectedRestaurant(restaurant);
        setCartItems(order.items.map(item => ({ ...item })));
        setScreen('CART');
      } catch (error) {
        console.error('Failed to reorder:', error);
      }
    };
    fetchRestaurantAndReorder();
  };

  const handleCheckout = (order: Order) => {
    setActiveOrder(order);
    setCartItems([]);
    setScreen('TRACKING');
  };

  const renderScreen = () => {
    if (isInitializing) return null; // Or a splash screen

    if (!isAuthenticated && screen !== 'ONBOARDING' && screen !== 'AUTH') {
      return <Auth onLogin={() => {}} />;
    }

    switch (screen) {
      case 'ONBOARDING':
        return <Onboarding onFinish={() => setScreen('AUTH')} />;
      case 'AUTH':
        return <Auth onLogin={() => {}} />;
      case 'HOME':
        return <Home 
          onSelectRestaurant={navigateToRestaurant} 
          onOpenCart={() => setScreen('CART')} 
          onOpenProfile={() => setScreen('PROFILE')} 
          onOpenHistory={() => setScreen('HISTORY')}
          cartCount={cartItems.length} 
        />;
      case 'RESTAURANT':
        return selectedRestaurant ? (
          <RestaurantDetail 
            restaurant={selectedRestaurant} 
            onBack={() => setScreen('HOME')} 
            onAddToCart={addToCart}
          />
        ) : <Home 
          onSelectRestaurant={navigateToRestaurant} 
          onOpenCart={() => setScreen('CART')} 
          onOpenProfile={() => setScreen('PROFILE')} 
          onOpenHistory={() => setScreen('HISTORY')}
          cartCount={cartItems.length} 
        />;
      case 'CART':
        return <Cart items={cartItems} onBack={() => setScreen('HOME')} onCheckout={handleCheckout} restaurant={selectedRestaurant} />;
      case 'TRACKING':
        return <OrderTracking onBack={() => setScreen('HOME')} order={activeOrder} />;
      case 'MERCHANT_DASHBOARD':
        return <MerchantDashboard />;
      case 'RIDER_DASHBOARD':
        return <RiderDashboard />;
      case 'ADMIN_PANEL':
        return <AdminPanel />;
      case 'PROFILE':
        return <Profile onBack={() => {
          if (user?.role === 'MERCHANT') setScreen('MERCHANT_DASHBOARD');
          else if (user?.role === 'RIDER') setScreen('RIDER_DASHBOARD');
          else setScreen('HOME');
        }} />;
      case 'HISTORY':
        return <OrderHistory 
          onBack={() => setScreen('HOME')} 
          onReorder={handleReorder}
          onTrackOrder={(order) => {
            setActiveOrder(order);
            setScreen('TRACKING');
          }}
        />;
      default:
        return <Onboarding onFinish={() => setScreen('AUTH')} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-gray-50 overflow-hidden">
      {renderScreen()}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
