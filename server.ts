import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'db.json');
const JWT_SECRET = 'ayoo-secret-key-2024';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Initial DB state
const initialDb = {
  users: [
    {
      id: 'rider1',
      email: 'rider1@ayoo.com',
      password: 'hashed_password', // In real app this would be hashed
      name: 'Juan Dela Cruz',
      role: 'RIDER',
      phone: '09171234567',
      riderStatus: 'PENDING',
      vehicleType: 'MOTORCYCLE',
      licensePlate: 'ABC 1234',
      isOnline: false
    },
    {
      id: 'rider2',
      email: 'rider2@ayoo.com',
      password: 'hashed_password',
      name: 'Pedro Penduko',
      role: 'RIDER',
      phone: '09187654321',
      riderStatus: 'APPROVED',
      vehicleType: 'BICYCLE',
      isOnline: true,
      lat: 8.2285,
      lng: 124.2452
    }
  ],
  restaurants: [],
  orders: [],
  vouchers: [
    {
      id: 'v1',
      code: 'AYOO2026',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 200,
      maxDiscount: 100,
      expiryDate: '2026-12-31',
      isActive: true,
      description: '20% off on your next order!'
    }
  ],
};

// DB Helper
const getDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const saveDb = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role, restaurantName } = req.body;
    const db = getDb();
    
    if (db.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password: hashedPassword,
      name,
      role: role || 'CUSTOMER',
    };

    if (role === 'MERCHANT') {
      const newRestaurant = {
        id: Math.random().toString(36).substr(2, 9),
        name: restaurantName || `${name}'s Kitchen`,
        rating: 5.0,
        deliveryTime: '20-30 min',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
        cuisine: 'Various',
        items: [],
        isPartner: true,
        ownerId: newUser.id,
      };
      db.restaurants.push(newRestaurant);
      (newUser as any).restaurantId = newRestaurant.id;
    }

    db.users.push(newUser);
    saveDb(db);

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword, token });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
    const user = db.users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  });

  // Restaurants
  app.get('/api/restaurants', (req, res) => {
    const db = getDb();
    res.json(db.restaurants);
  });

  app.get('/api/restaurants/:id', (req, res) => {
    const db = getDb();
    const restaurant = db.restaurants.find((r: any) => r.id === req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  });

  app.patch('/api/restaurants/:id', (req, res) => {
    const { name, cuisine, address, lat, lng, image } = req.body;
    const db = getDb();
    const restaurantIndex = db.restaurants.findIndex((r: any) => r.id === req.params.id);
    if (restaurantIndex === -1) return res.status(404).json({ message: 'Restaurant not found' });

    db.restaurants[restaurantIndex] = {
      ...db.restaurants[restaurantIndex],
      name: name || db.restaurants[restaurantIndex].name,
      cuisine: cuisine || db.restaurants[restaurantIndex].cuisine,
      address: address !== undefined ? address : db.restaurants[restaurantIndex].address,
      lat: lat !== undefined ? lat : db.restaurants[restaurantIndex].lat,
      lng: lng !== undefined ? lng : db.restaurants[restaurantIndex].lng,
      image: image || db.restaurants[restaurantIndex].image,
    };

    saveDb(db);
    res.json(db.restaurants[restaurantIndex]);
  });

  // Orders
  app.post('/api/orders', (req, res) => {
    const { customerId, restaurantId, items, total, deliveryAddress, customerName, restaurantName } = req.body;
    const db = getDb();
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      restaurantId,
      items,
      total,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryAddress,
      customerName,
      restaurantName,
    };
    db.orders.push(newOrder);
    saveDb(db);
    
    io.to(`restaurant_${restaurantId}`).emit('new_order', newOrder);
    io.emit('order_available', newOrder); // For riders
    
    res.json(newOrder);
  });

  app.get('/api/orders/customer/:id', (req, res) => {
    const db = getDb();
    res.json(db.orders.filter((o: any) => o.customerId === req.params.id));
  });

  app.get('/api/orders/restaurant/:id', (req, res) => {
    const db = getDb();
    res.json(db.orders.filter((o: any) => o.restaurantId === req.params.id));
  });

  app.get('/api/orders/rider/:id', (req, res) => {
    const db = getDb();
    res.json(db.orders.filter((o: any) => o.riderId === req.params.id));
  });

  app.get('/api/orders/available', (req, res) => {
    const db = getDb();
    res.json(db.orders.filter((o: any) => o.status === 'READY_FOR_PICKUP' || o.status === 'PENDING'));
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { status, riderId } = req.body;
    const db = getDb();
    const orderIndex = db.orders.findIndex((o: any) => o.id === req.params.id);
    if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });

    db.orders[orderIndex].status = status;
    db.orders[orderIndex].updatedAt = new Date().toISOString();
    if (riderId) db.orders[orderIndex].riderId = riderId;
    
    saveDb(db);
    
    const updatedOrder = db.orders[orderIndex];
    io.to(`order_${updatedOrder.id}`).emit('order_status_updated', updatedOrder);
    io.emit('order_updated', updatedOrder);

    res.json(updatedOrder);
  });

  app.patch('/api/orders/:id/location', (req, res) => {
    const { lat, lng } = req.body;
    const db = getDb();
    const orderIndex = db.orders.findIndex((o: any) => o.id === req.params.id);
    if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });

    db.orders[orderIndex].riderLat = lat;
    db.orders[orderIndex].riderLng = lng;
    db.orders[orderIndex].updatedAt = new Date().toISOString();
    
    saveDb(db);
    
    const updatedOrder = db.orders[orderIndex];
    io.to(`order_${updatedOrder.id}`).emit('order_location_updated', { lat, lng });

    res.json(updatedOrder);
  });

  // Profile Management
  app.patch('/api/users/:id', (req, res) => {
    const { name, address, phone, lat, lng, vehicleType, licensePlate, photoUrl } = req.body;
    const db = getDb();
    const userIndex = db.users.findIndex((u: any) => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    db.users[userIndex] = {
      ...db.users[userIndex],
      name: name || db.users[userIndex].name,
      address: address !== undefined ? address : db.users[userIndex].address,
      phone: phone !== undefined ? phone : db.users[userIndex].phone,
      lat: lat !== undefined ? lat : db.users[userIndex].lat,
      lng: lng !== undefined ? lng : db.users[userIndex].lng,
      vehicleType: vehicleType !== undefined ? vehicleType : db.users[userIndex].vehicleType,
      licensePlate: licensePlate !== undefined ? licensePlate : db.users[userIndex].licensePlate,
      photoUrl: photoUrl !== undefined ? photoUrl : db.users[userIndex].photoUrl,
    };

    saveDb(db);
    const { password: _, ...userWithoutPassword } = db.users[userIndex];
    res.json(userWithoutPassword);
  });

  // Admin Analytics
  app.get('/api/admin/stats', (req, res) => {
    const db = getDb();
    
    const totalUsers = db.users.length;
    const totalRestaurants = db.restaurants.length;
    const totalOrders = db.orders.length;
    const totalRevenue = db.orders
      .filter((o: any) => o.status === 'DELIVERED')
      .reduce((acc: number, o: any) => acc + o.total, 0);

    // Calculate revenue and orders for the last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => {
      const dayOrders = db.orders.filter((o: any) => o.createdAt.startsWith(date));
      const dayRevenue = dayOrders
        .filter((o: any) => o.status === 'DELIVERED')
        .reduce((acc: number, o: any) => acc + o.total, 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        orders: dayOrders.length
      };
    });

    res.json({
      users: totalUsers,
      restaurants: totalRestaurants,
      orders: totalOrders,
      revenue: totalRevenue,
      chartData
    });
  });

  // Vouchers
  app.get('/api/vouchers', (req, res) => {
    const db = getDb();
    res.json(db.vouchers || []);
  });

  app.post('/api/vouchers', (req, res) => {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, description } = req.body;
    const db = getDb();
    if (!db.vouchers) db.vouchers = [];
    
    const newVoucher = {
      id: Math.random().toString(36).substr(2, 9),
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate,
      isActive: true,
      description
    };
    
    db.vouchers.push(newVoucher);
    saveDb(db);
    res.json(newVoucher);
  });

  app.patch('/api/vouchers/:id', (req, res) => {
    const db = getDb();
    const index = db.vouchers.findIndex((v: any) => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Voucher not found' });
    
    db.vouchers[index] = { ...db.vouchers[index], ...req.body };
    saveDb(db);
    res.json(db.vouchers[index]);
  });

  app.delete('/api/vouchers/:id', (req, res) => {
    const db = getDb();
    db.vouchers = db.vouchers.filter((v: any) => v.id !== req.params.id);
    saveDb(db);
    res.json({ message: 'Voucher deleted' });
  });

  app.get('/api/vouchers/validate/:code', (req, res) => {
    const db = getDb();
    const voucher = db.vouchers?.find((v: any) => v.code === req.params.code.toUpperCase() && v.isActive);
    
    if (!voucher) return res.status(404).json({ message: 'Invalid or inactive voucher code' });
    
    const now = new Date();
    const expiry = new Date(voucher.expiryDate);
    if (expiry < now) return res.status(400).json({ message: 'Voucher has expired' });
    
    res.json(voucher);
  });

  // Rider Management
  app.get('/api/admin/riders', (req, res) => {
    const db = getDb();
    const riders = db.users.filter((u: any) => u.role === 'RIDER');
    res.json(riders);
  });

  app.patch('/api/admin/riders/:id/status', (req, res) => {
    const { status } = req.body;
    const db = getDb();
    const userIndex = db.users.findIndex((u: any) => u.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    if (db.users[userIndex].role !== 'RIDER') return res.status(400).json({ message: 'User is not a rider' });

    db.users[userIndex].riderStatus = status;
    saveDb(db);
    
    const { password: _, ...userWithoutPassword } = db.users[userIndex];
    res.json(userWithoutPassword);
  });

  // Menu Management
  app.post('/api/restaurants/:id/items', (req, res) => {
    const { name, price, description, category, image, isPopular, isSpicy } = req.body;
    const db = getDb();
    const restaurantIndex = db.restaurants.findIndex((r: any) => r.id === req.params.id);
    
    if (restaurantIndex === -1) return res.status(404).json({ message: 'Restaurant not found' });

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      price: Number(price),
      description,
      category,
      image: image || 'https://picsum.photos/seed/food/400/400',
      isPopular: !!isPopular,
      isSpicy: !!isSpicy,
    };

    db.restaurants[restaurantIndex].items.push(newItem);
    saveDb(db);
    res.json(newItem);
  });

  app.patch('/api/restaurants/:id/items/:itemId', (req, res) => {
    const { name, price, description, category, image, isPopular, isSpicy } = req.body;
    const db = getDb();
    const restaurantIndex = db.restaurants.findIndex((r: any) => r.id === req.params.id);
    
    if (restaurantIndex === -1) return res.status(404).json({ message: 'Restaurant not found' });

    const itemIndex = db.restaurants[restaurantIndex].items.findIndex((i: any) => i.id === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });

    const updatedItem = {
      ...db.restaurants[restaurantIndex].items[itemIndex],
      name: name !== undefined ? name : db.restaurants[restaurantIndex].items[itemIndex].name,
      price: price !== undefined ? Number(price) : db.restaurants[restaurantIndex].items[itemIndex].price,
      description: description !== undefined ? description : db.restaurants[restaurantIndex].items[itemIndex].description,
      category: category !== undefined ? category : db.restaurants[restaurantIndex].items[itemIndex].category,
      image: image !== undefined ? image : db.restaurants[restaurantIndex].items[itemIndex].image,
      isPopular: isPopular !== undefined ? !!isPopular : db.restaurants[restaurantIndex].items[itemIndex].isPopular,
      isSpicy: isSpicy !== undefined ? !!isSpicy : db.restaurants[restaurantIndex].items[itemIndex].isSpicy,
    };

    db.restaurants[restaurantIndex].items[itemIndex] = updatedItem;
    saveDb(db);
    res.json(updatedItem);
  });

  app.delete('/api/restaurants/:id/items/:itemId', (req, res) => {
    const db = getDb();
    const restaurantIndex = db.restaurants.findIndex((r: any) => r.id === req.params.id);
    
    if (restaurantIndex === -1) return res.status(404).json({ message: 'Restaurant not found' });

    db.restaurants[restaurantIndex].items = db.restaurants[restaurantIndex].items.filter((i: any) => i.id !== req.params.itemId);
    saveDb(db);
    res.json({ message: 'Item deleted' });
  });

  // Payments
  app.post('/api/payments/create-checkout-session', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const { orderId, items, total, customerEmail } = req.body;
    const appUrl = process.env.APP_URL || `http://localhost:3000`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // GCash can be added if account supports it
        line_items: items.map((item: any) => ({
          price_data: {
            currency: 'php',
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100, // Stripe uses cents/centavos
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${appUrl}?payment_success=true&order_id=${orderId}`,
        cancel_url: `${appUrl}?payment_cancelled=true&order_id=${orderId}`,
        customer_email: customerEmail,
        metadata: {
          orderId,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // --- Socket.io ---
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('join_restaurant', (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
