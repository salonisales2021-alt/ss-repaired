
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
    id: 'u-jmjain',
    email: 'accounts@jmjain.com',
    fullName: 'J M Jain Accounts',
    businessName: 'J M Jain LLP',
    role: UserRole.GADDI,
    gstin: '07AAQFJ2019Q1ZT',
    address: '2285/9, Gali Hinga Beg, Tilak Bazar',
    city: 'Delhi',
    state: 'Delhi',
    isApproved: true,
    creditLimit: 50000000,
    outstandingDues: 2500000,
    mobile: '9876543211'
  },
  {
    id: 'u-anurag',
    email: 'anurag@creation.com',
    fullName: 'Anurag Owner',
    businessName: 'Anurag Creation',
    role: UserRole.RETAILER,
    gstin: '27AEZPD0514P1Z1',
    address: 'Block No-5 to 10, City Land Complex',
    city: 'Boregaon',
    state: 'Maharashtra',
    isApproved: true,
    isPreBookApproved: true,
    creditLimit: 500000,
    outstandingDues: 78750,
    mobile: '9876543222',
    gaddiId: 'u-jmjain', // Linked to J M Jain
    assignedAgentId: 'u-agent'
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
    gaddiId: 'u-jmjain',
    wishlist: ['pb-001']
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
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p-42',
    sku: '1280:24/34',
    name: 'Girls Dresses (Western)',
    description: 'Premium cotton blend western dress. HSN: 620429',
    category: ProductCategory.WESTERN,
    fabric: 'Cotton Blend',
    images: ['https://images.unsplash.com/photo-1621452773781-0f992ee61919?q=80&w=800&auto=format&fit=crop'],
    variants: [
        { id: 'v-42a', sizeRange: '24-34', color: 'Assorted', stock: 500, pricePerPiece: 300, piecesPerSet: 12 }
    ],
    basePrice: 300,
    isAvailable: true,
    hsnCode: '620429'
  },
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
    collection: 'Winter 2025 Preview',
    hsnCode: '620429'
  },
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
    isAvailable: true,
    hsnCode: '620429'
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
    isAvailable: true,
    hsnCode: '620419'
  }
];

export const MOCK_ORDERS: Order[] = [
    // Pre-create the order from the image for demo purposes
    {
        id: '42',
        userId: 'u-anurag',
        userBusinessName: 'Anurag Creation',
        userCity: 'Boregaon',
        userState: 'Maharashtra',
        items: [
            {
                productId: 'p-42',
                variantId: 'v-42a',
                productName: 'GIRLS DRESSES',
                variantDescription: '1280:24/34:DRESS/12',
                pricePerPiece: 300,
                piecesPerSet: 12,
                quantitySets: 1, // 12 Pcs
                image: 'https://images.unsplash.com/photo-1621452773781-0f992ee61919?q=80&w=800&auto=format&fit=crop',
                hsnCode: '620429'
            }
        ],
        totalAmount: 78750, // Simplified total from image
        factoryAmount: 76387, // Amount after gaddi commission
        guarantorId: 'u-jmjain',
        gaddiId: 'u-jmjain',
        gaddiName: 'J M Jain LLP',
        status: 'DISPATCHED',
        createdAt: '2025-07-26T10:00:00Z',
        paymentDetails: {
            method: PaymentCategory.GADDI,
            entityId: 'u-jmjain',
            entityName: 'J M Jain LLP'
        },
        transport: {
            transporterName: 'KRISHNA FREIGHT MOVERS',
            grNumber: '524339',
            station: 'BOREGAON',
            eWayBillNo: '751547999907',
            vehicleNumber: 'RJ11GD1636'
        }
    }
];

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
