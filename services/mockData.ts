
import { Product, ProductCategory, UserRole, User, Order, PaymentCategory, Review, CreditRequest } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-admin',
    email: 'admin@saloni.com',
    fullName: 'Sarthak Huria',
    businessName: 'Saloni HQ',
    role: UserRole.SUPER_ADMIN,
    isApproved: true,
    isPreBookApproved: true,
    creditLimit: 10000000,
    outstandingDues: 0,
    mobile: '9911076258'
  },
  {
    id: 'u-dispatch',
    email: 'dispatch@saloni.com',
    fullName: 'Dispatch Team',
    businessName: 'Saloni Logistics',
    role: UserRole.DISPATCH,
    isApproved: true,
    creditLimit: 0,
    outstandingDues: 0,
    mobile: '9911076259'
  },
  {
    id: 'u-agent',
    email: 'agent@saloni.com',
    fullName: 'Amit Verma',
    businessName: 'Verma Sales Agency',
    role: UserRole.AGENT,
    isApproved: true,
    creditLimit: 0,
    outstandingDues: 0,
    mobile: '9876543210'
  },
  {
    id: 'u-gaddi',
    email: 'gaddi@saloni.com',
    fullName: 'J M Jain',
    businessName: 'J M Jain LLP',
    role: UserRole.GADDI,
    isApproved: true,
    creditLimit: 5000000,
    outstandingDues: 150000,
    mobile: '9876543211'
  },
  {
    id: 'u-distributor',
    email: 'distributor@saloni.com',
    fullName: 'Rajesh Gupta',
    businessName: 'Gupta Traders',
    role: UserRole.DISTRIBUTOR,
    isApproved: true,
    creditLimit: 1000000,
    outstandingDues: 45000,
    mobile: '9876543212'
  },
  {
    id: 'u-retailer',
    email: 'retailer@saloni.com',
    fullName: 'Priya Sharma',
    businessName: 'Priya Boutique',
    role: UserRole.RETAILER,
    isApproved: true,
    isPreBookApproved: true,
    creditLimit: 100000,
    outstandingDues: 12500,
    mobile: '9876543213',
    assignedAgentId: 'u-agent',
    gaddiId: 'u-gaddi',
    wishlist: ['pb-001']
  },
  {
    id: 'u-trader',
    email: 'trader@saloni.com',
    fullName: 'Vikram Singh',
    businessName: 'Vikram Wholesale',
    role: UserRole.LOCAL_TRADER,
    isApproved: true,
    creditLimit: 200000,
    outstandingDues: 8000,
    mobile: '9876543214'
  },
  {
    id: 'u-demo',
    email: 'demo@client.com',
    fullName: 'Demo User',
    businessName: 'Demo Boutique',
    role: UserRole.RETAILER,
    isApproved: true,
    isPreBookApproved: true,
    creditLimit: 50000,
    outstandingDues: 0,
    mobile: '9999999999',
    wishlist: []
  }
];

export const MOCK_PRODUCTS: Product[] = [
  // ... existing mock data logic would persist in a real app, adding new PRE_BOOK items
  {
    id: 'pb-001',
    sku: 'PRE-LUX-001',
    name: 'Royal Velvet Couture Gown',
    description: 'Exclusive Club Edition. Hand-embroidery with imported sequins. Dispatch in 45 days.',
    category: ProductCategory.PRE_BOOK,
    fabric: 'Italian Velvet',
    images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop'],
    variants: [
      { id: 'v-pb-1', sizeRange: '24-34', color: 'Midnight Blue', stock: 100, pricePerPiece: 2500, piecesPerSet: 6 },
      { id: 'v-pb-2', sizeRange: '24-34', color: 'Wine Red', stock: 100, pricePerPiece: 2500, piecesPerSet: 6 }
    ],
    basePrice: 2500,
    isAvailable: true,
    collection: 'Winter 2025 Preview'
  },
  {
    id: 'pb-002',
    sku: 'PRE-ETH-002',
    name: 'Bridal Series Lehenga Set',
    description: 'Pre-book only. Heavy can-can attached. Dispatch in 60 days.',
    category: ProductCategory.PRE_BOOK,
    fabric: 'Raw Silk',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'],
    variants: [
      { id: 'v-pb-3', sizeRange: '22-32', color: 'Gold Dust', stock: 50, pricePerPiece: 3200, piecesPerSet: 4 }
    ],
    basePrice: 3200,
    isAvailable: true,
    collection: 'Wedding 2025'
  },
  // Adding standard products for shop demo
  {
    id: 'p-001',
    sku: 'WD-001',
    name: 'Floral Summer Frock',
    description: 'Cotton blend summer wear with floral prints. High demand item.',
    category: ProductCategory.WESTERN,
    fabric: 'Cotton Blend',
    images: ['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=800&auto=format&fit=crop'],
    variants: [
        { id: 'v-1', sizeRange: '2-8Y', color: 'Pink', stock: 120, pricePerPiece: 450, piecesPerSet: 6 }
    ],
    basePrice: 450,
    isAvailable: true
  },
  {
    id: 'p-002',
    sku: 'ETH-002',
    name: 'Festive Anarkali Set',
    description: 'Traditional wear with embroidery. Suitable for festivals.',
    category: ProductCategory.ETHNIC,
    fabric: 'Silk Blend',
    images: ['https://images.unsplash.com/photo-1604467794349-0b74285de7e7?q=80&w=800&auto=format&fit=crop'],
    variants: [
        { id: 'v-2', sizeRange: '24-34', color: 'Red', stock: 80, pricePerPiece: 850, piecesPerSet: 6 }
    ],
    basePrice: 850,
    isAvailable: true
  }
];

export const MOCK_ORDERS: Order[] = [];
export const MOCK_TRANSACTIONS: any[] = [];
export const MOCK_VISIT_LOGS: any[] = [];
export const MOCK_STOCK_LOGS: any[] = [];
export const MOCK_VISIT_REQUESTS: any[] = [];
export const MOCK_NOTIFICATIONS: any[] = [];
export const MOCK_TICKETS: any[] = [];
export const MOCK_REVIEWS: Review[] = [];
export const MOCK_CREDIT_REQUESTS: CreditRequest[] = [];
export const MOCK_GADDIS = [];
export const MOCK_AGENTS = [
    { id: 'u-agent', name: 'Amit Verma' },
    { id: 'ag-002', name: 'Rahul Singh' }
];
export const MOCK_DISTRIBUTORS = [];
export const MOCK_ASSOCIATED_CLIENTS = [];
