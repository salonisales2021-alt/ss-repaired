
import { Product, ProductCategory, UserRole, User, Order, PaymentCategory, Review, CreditRequest } from '../types';

export const MOCK_USERS: User[] = [];

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
export const MOCK_AGENTS = [];
export const MOCK_DISTRIBUTORS = [];
export const MOCK_ASSOCIATED_CLIENTS = [];