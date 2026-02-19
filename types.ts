
export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'RIDER' | 'ADMIN';

export type AppScreen = 'ONBOARDING' | 'AUTH' | 'HOME' | 'RESTAURANT' | 'CART' | 'TRACKING' | 'MERCHANT_DASHBOARD' | 'RIDER_DASHBOARD' | 'ADMIN_PANEL' | 'PROFILE' | 'HISTORY';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantId?: string; // For merchants
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  riderId?: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  customerName: string;
  restaurantName: string;
  riderLat?: number;
  riderLng?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  paymentMethod?: 'COD' | 'ONLINE';
  paymentStatus?: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID';
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  image: string;
  cuisine: string;
  items: FoodItem[];
  isPartner?: boolean;
  address?: string;
  ownerId?: string;
  lat?: number;
  lng?: number;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  description: string;
}
