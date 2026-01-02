
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CartItem, ProductVariant, Product, Notification, UserRole } from '../types';
import { db } from '../services/db';
import { MOCK_NOTIFICATIONS } from '../services/mockData';
import { isBiometricSupported, registerBiometric, verifyBiometric } from '../services/biometricService';

interface AppContextType {
  user: User | null;
  login: (identifier: string, roleType: 'ADMIN' | 'CUSTOMER', password?: string) => Promise<{ success: boolean; error?: string }>;
  biometricLogin: () => Promise<{ success: boolean; error?: string }>;
  enableBiometricAuth: () => Promise<boolean>;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantitySets: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartSavings: number;
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
  calculatePrice: (pricePerPiece: number, piecesPerSet: number, qtySets: number, isGuaranteed?: boolean) => { finalPrice: number, total: number, discountType: string, guarantorFee: number };
  isTutorialOpen: boolean;
  setTutorialOpen: (isOpen: boolean) => void;
  isBiometricAvailable: boolean;
  triggerSecurityLockout: (reason: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
      try {
          const savedUser = localStorage.getItem('saloni_active_user');
          return savedUser ? JSON.parse(savedUser) : null;
      } catch (error) { return null; }
  });
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
      try {
          const savedCart = localStorage.getItem('saloni_active_cart');
          return savedCart ? JSON.parse(savedCart) : [];
      } catch (error) { return []; }
  });
  const [allNotifications, setAllNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isTutorialOpen, setTutorialOpen] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    localStorage.setItem('saloni_active_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Initial Load
    const initData = async () => {
        const fetchedProducts = await db.getProducts();
        setProducts(fetchedProducts);
        
        // Reverted: Loading all users regardless of role to ensure functionality
        const fetchedUsers = await db.getUsers();
        setUsers(fetchedUsers);
    };
    initData();
    
    checkBiometrics();
  }, [user]);

  const checkBiometrics = async () => {
      const supported = await isBiometricSupported();
      setIsBiometricAvailable(supported);
  };

  const refreshProducts = () => db.getProducts().then(setProducts);

  const calculatePrice = (pricePerPiece: number, piecesPerSet: number, qtySets: number, isGuaranteed: boolean = false) => {
      let finalRate = pricePerPiece;
      let discountType = "Standard B2B";
      let guarantorFee = 0;

      if (user?.role === UserRole.LOCAL_TRADER) {
          finalRate = pricePerPiece * 0.95;
          discountType = "Trader Rate (-5%)";
      }

      if (isGuaranteed) {
          guarantorFee = Math.round(finalRate * 0.18);
          finalRate = finalRate + guarantorFee;
          discountType = "Guaranteed Credit Price (18% incl.)";
      }

      return {
          finalPrice: Math.round(finalRate),
          total: Math.round(finalRate * piecesPerSet * qtySets),
          discountType,
          guarantorFee
      };
  };

  const registerUser = async (newUser: User, password?: string) => {
    const result = await db.registerUser(newUser, password);
    if (result.success) {
        // Update local state to include new user immediately
        setUsers(prev => [...prev, result.data || newUser]);
        return { success: true };
    }
    return { success: false, error: result.error };
  };

  const approveUser = async (userId: string) => {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser) {
          const updatedUser = { ...targetUser, isApproved: true };
          await db.updateUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
          addNotification({
              recipientId: userId,
              title: "Account Approved",
              message: "Your B2B portal access is now live.",
              type: "SYSTEM",
              link: "/login"
          });
      }
  };

  const login = async (identifier: string, roleType: 'ADMIN' | 'CUSTOMER', password?: string) => {
    // SECURITY: Clear existing user session before starting a new login process
    localStorage.removeItem('saloni_active_user');
    setUser(null);

    const pwd = password || 'password123';
    const { user: authUser, error } = await db.signIn(identifier, pwd);
    
    if (error || !authUser) {
        console.error("Login attempt failed:", error);
        return { success: false, error: error || "Invalid credentials" };
    }

    // Security: Ensure password field is stripped before state/storage
    const safeUser = { ...authUser };
    delete safeUser.password;

    if (roleType === 'ADMIN') {
        if (safeUser.role === UserRole.ADMIN || safeUser.role === UserRole.SUPER_ADMIN || safeUser.role === UserRole.DISPATCH) {
            setUser(safeUser);
            localStorage.setItem('saloni_active_user', JSON.stringify(safeUser));
            return { success: true };
        }
        return { success: false, error: "ACCESS_DENIED: User is not an Administrator." };
    } else {
        if (!safeUser.isApproved) return { success: false, error: "PENDING_APPROVAL" };
        setUser(safeUser);
        localStorage.setItem('saloni_active_user', JSON.stringify(safeUser));
        return { success: true };
    }
  };

  // Enable Biometrics for currently logged in user
  const enableBiometricAuth = async () => {
      if (!user) return false;
      const success = await registerBiometric(user.id, user.fullName);
      if (success) {
          // Store a simple local flag mapping this device to this user ID
          localStorage.setItem('saloni_bio_user_id', user.id);
          localStorage.setItem('saloni_bio_email', user.email);
          return true;
      }
      return false;
  };

  // Login using Biometrics
  const biometricLogin = async () => {
      const storedUserId = localStorage.getItem('saloni_bio_user_id');
      const storedEmail = localStorage.getItem('saloni_bio_email');
      
      if (!storedUserId || !storedEmail) {
          return { success: false, error: "Biometrics not set up on this device." };
      }

      const verified = await verifyBiometric();
      if (verified) {
          // Fetch user securely
          const targetUser = await db.getUserById(storedUserId);

          if (targetUser) {
              if (!targetUser.isApproved) return { success: false, error: "Account pending approval." };
              
              const safeUser = { ...targetUser };
              delete safeUser.password;
              
              setUser(safeUser);
              localStorage.setItem('saloni_active_user', JSON.stringify(safeUser));
              return { success: true };
          }
      }
      return { success: false, error: "Biometric verification failed." };
  };

  const logout = async () => {
    await db.signOut();
    setUser(null);
    setSelectedClient(null);
    setCart([]);
    localStorage.removeItem('saloni_active_user');
    localStorage.removeItem('saloni_active_cart');
    // Note: We DO NOT clear 'saloni_bio_user_id' so they can log in again easily
    window.location.hash = '/';
  };

  const selectClient = (client: User | null) => setSelectedClient(client);

  const addToCart = (product: Product, variant: ProductVariant, quantitySets: number) => {
    if (quantitySets <= 0) return;
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.variantId === variant.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantitySets += quantitySets;
        return updated;
      }
      const { finalPrice } = calculatePrice(variant.pricePerPiece, variant.piecesPerSet, quantitySets);
      return [...prev, {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantDescription: `${variant.color} / Set (${variant.sizeRange})`,
        pricePerPiece: finalPrice,
        piecesPerSet: variant.piecesPerSet,
        quantitySets: quantitySets,
        image: product.images[0]
      }];
    });
  };

  const removeFromCart = (variantId: string) => setCart(prev => prev.filter(item => item.variantId !== variantId));
  const clearCart = () => setCart([]);
  const setHeroVideo = (url: string) => setHeroVideoUrl(url);

  const cartTotal = cart.reduce((sum, item) => sum + (item.pricePerPiece * item.piecesPerSet * item.quantitySets), 0);
  const cartSavings = 0;

  const notifications = allNotifications
    .filter(n => user && (n.recipientId === user.id || n.recipientId === 'ALL'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (n: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
      const newNotif: Notification = {
          ...n,
          id: `n-${Date.now()}-${Math.random()}`,
          createdAt: new Date().toISOString(),
          isRead: false
      };
      setAllNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id: string) => setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

  const wishlist = user?.wishlist || [];

  const toggleWishlist = async (productId: string) => {
      if (!user) return;
      const currentWishlist = user.wishlist || [];
      const newWishlist = currentWishlist.includes(productId) 
          ? currentWishlist.filter(id => id !== productId)
          : [...currentWishlist, productId];
      
      const updatedUser = { ...user, wishlist: newWishlist };
      setUser(updatedUser);
      localStorage.setItem('saloni_active_user', JSON.stringify(updatedUser));
      await db.updateUser(updatedUser);
  };

  const triggerSecurityLockout = async (reason: string) => {
      if (!user) return;
      await db.triggerSecurityLockout(user.id, user.businessName || user.fullName, reason);
      logout();
      window.location.href = '/#/login'; // Force redirect
      alert("ACCOUNT LOCKED: Security Protocol Violation Detected. Contact Administrator.");
  };

  return (
    <AppContext.Provider value={{ 
        user, login, biometricLogin, enableBiometricAuth, logout, cart, addToCart, removeFromCart, clearCart, cartTotal, cartSavings,
        users, products, refreshProducts, registerUser, approveUser,
        selectedClient, selectClient,
        heroVideoUrl, setHeroVideo,
        notifications, unreadCount, addNotification, markAsRead,
        wishlist, toggleWishlist,
        calculatePrice,
        isTutorialOpen, setTutorialOpen,
        isBiometricAvailable,
        triggerSecurityLockout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};