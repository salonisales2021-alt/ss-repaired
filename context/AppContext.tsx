
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CartItem, ProductVariant, Product, Notification } from '../types';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';

interface AppContextType {
  user: User | null;
  login: (identifier: string, roleType: 'ADMIN' | 'CUSTOMER', password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantitySets: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  users: User[];
  products: Product[];
  refreshProducts: () => void;
  registerUser: (user: User, password?: string) => Promise<{ success: boolean; error?: string }>;
  approveUser: (userId: string) => Promise<void>;
  selectedClient: User | null;
  selectClient: (client: User | null) => void;
  heroVideoUrl: string | null;
  setHeroVideo: (url: string) => void;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  calculatePrice: (pricePerPiece: number, piecesPerSet: number, qtySets: number) => { finalPrice: number, total: number };
  isTutorialOpen: boolean;
  setTutorialOpen: (isOpen: boolean) => void;
  triggerSecurityLockout: (reason: string) => Promise<void>;
  isBiometricAvailable: boolean;
  enableBiometricAuth: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isTutorialOpen, setTutorialOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper to load protected data
  const loadProtectedData = async () => {
      const prods = await db.getProducts();
      setProducts(prods);
      const u = await db.getUsers();
      setUsers(u);
  };

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await db.getUserById(session.user.id);
                if (profile) setUser(profile);
                
                // Fetch protected data only if authenticated to avoid RLS errors
                await loadProtectedData();
            }
        } catch (e) {
            console.warn("App initialization warning (Offline or Auth Error):", e);
        }
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            const profile = await db.getUserById(session.user.id);
            setUser(profile);
            await loadProtectedData();
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProducts([]); // Clear protected data on logout
            setUsers([]);
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const refreshProducts = () => db.getProducts().then(setProducts);

  const login = async (identifier: string, roleType: 'ADMIN' | 'CUSTOMER', password?: string) => {
      const { user: authUser, error } = await db.signIn(identifier, password || '');
      if (error || !authUser) return { success: false, error: error || "Login failed" };
      
      setUser(authUser);
      return { success: true };
  };

  const logout = async () => {
      await db.signOut();
      setUser(null);
      setProducts([]);
      setUsers([]);
  };

  const registerUser = db.registerUser;

  const approveUser = async (userId: string) => {
      const u = users.find(x => x.id === userId);
      if (u) {
          const updated = { ...u, isApproved: true };
          await db.updateUser(updated);
          const freshUsers = await db.getUsers();
          setUsers(freshUsers);
      }
  };

  // Cart Logic
  const addToCart = (product: Product, variant: ProductVariant, quantitySets: number) => {
      setCart(prev => [...prev, {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantDescription: `${variant.color} ${variant.sizeRange}`,
          pricePerPiece: variant.pricePerPiece,
          piecesPerSet: variant.piecesPerSet,
          quantitySets,
          image: product.images[0] || ''
      }]);
  };
  
  const removeFromCart = (vid: string) => setCart(prev => prev.filter(i => i.variantId !== vid));
  const clearCart = () => setCart([]);
  
  const cartTotal = cart.reduce((acc, item) => acc + (item.pricePerPiece * item.piecesPerSet * item.quantitySets), 0);

  const calculatePrice = (pricePerPiece: number, piecesPerSet: number, qtySets: number) => {
      const total = pricePerPiece * piecesPerSet * qtySets;
      return { finalPrice: pricePerPiece, total };
  };

  // Mock Notifications logic for now
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
      const newNotif: Notification = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          isRead: false
      };
      setNotifications(prev => [newNotif, ...prev]);
  };
  const markAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const wishlist: string[] = user?.wishlist || [];
  const toggleWishlist = async (productId: string) => {
      if (!user) return;
      const newWishlist = wishlist.includes(productId) 
          ? wishlist.filter(id => id !== productId) 
          : [...wishlist, productId];
      
      const success = await db.updateUser({ ...user, wishlist: newWishlist });
      if (success) {
          setUser({ ...user, wishlist: newWishlist });
      }
  };

  const triggerSecurityLockout = async (reason: string) => {
      if (user) {
          await db.triggerSecurityLockout(user.id, user.fullName, reason);
          await logout();
          alert("Account Locked due to Security Policy Violation: " + reason);
      }
  };

  // Biometric Placeholder
  const isBiometricAvailable = false;
  const enableBiometricAuth = async () => false;

  return (
    <AppContext.Provider value={{
        user, login, logout, cart, addToCart, removeFromCart, clearCart, cartTotal,
        users, products, refreshProducts, registerUser, approveUser,
        selectedClient, selectClient: setSelectedClient,
        heroVideoUrl, setHeroVideo: setHeroVideoUrl,
        notifications, unreadCount, addNotification, markAsRead,
        wishlist, toggleWishlist, calculatePrice,
        isTutorialOpen, setTutorialOpen,
        triggerSecurityLockout,
        isBiometricAvailable, enableBiometricAuth
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp error');
  return context;
};
