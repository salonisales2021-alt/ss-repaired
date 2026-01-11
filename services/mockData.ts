
import { User, UserRole, Product, Order, ProductCategory, PaymentCategory } from '../types';

export const MOCK_USERS: User[] = [
    {
        id: 'u-admin',
        email: 'admin@saloni.com',
        fullName: 'Sarthak Huria',
        businessName: 'Saloni HQ',
        role: UserRole.ADMIN,
        mobile: '9911076258',
        isApproved: true,
        creditLimit: 0,
        outstandingDues: 0,
        wishlist: []
    },
    {
        id: 'u-retailer',
        email: 'retailer@shop.com',
        fullName: 'Priya Sharma',
        businessName: 'Priya Fashion Boutique',
        role: UserRole.RETAILER,
        mobile: '9876543210',
        isApproved: true,
        creditLimit: 50000,
        outstandingDues: 12000,
        wishlist: ['p-1', 'p-3'],
        city: 'Mumbai',
        state: 'Maharashtra'
    },
    {
        id: 'u-distributor',
        email: 'dist@partner.com',
        fullName: 'Rajesh Gupta',
        businessName: 'Gupta Textiles',
        role: UserRole.DISTRIBUTOR,
        mobile: '9876543211',
        isApproved: true,
        creditLimit: 500000,
        outstandingDues: 45000,
        wishlist: []
    }
];

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 'p-1',
        sku: 'SL-ETH-001',
        name: 'Royal Velvet Anarkali Set',
        description: 'Premium velvet Anarkali suit with intricate zari embroidery. Perfect for festive occasions.',
        category: ProductCategory.ETHNIC,
        fabric: 'Velvet',
        basePrice: 1250,
        images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop'],
        isAvailable: true,
        variants: [
            { id: 'v-1-1', color: 'Maroon', sizeRange: '24-34', stock: 50, pricePerPiece: 1250, piecesPerSet: 6 },
            { id: 'v-1-2', color: 'Navy Blue', sizeRange: '24-34', stock: 30, pricePerPiece: 1250, piecesPerSet: 6 }
        ]
    },
    {
        id: 'p-2',
        sku: 'SL-WEST-045',
        name: 'Floral Chiffon Party Dress',
        description: 'Lightweight chiffon western dress with floral prints and bow detail.',
        category: ProductCategory.WESTERN,
        fabric: 'Chiffon',
        basePrice: 850,
        images: ['https://images.unsplash.com/photo-1621452773781-0f992ee61c91?q=80&w=800&auto=format&fit=crop'],
        isAvailable: true,
        variants: [
            { id: 'v-2-1', color: 'Pink', sizeRange: '18-24', stock: 100, pricePerPiece: 850, piecesPerSet: 4 }
        ]
    },
    {
        id: 'p-3',
        sku: 'SL-IW-088',
        name: 'Peplum Top with Dhoti Pants',
        description: 'Trendy Indo-Western fusion wear. Cotton silk blend.',
        category: ProductCategory.INDO_WESTERN,
        fabric: 'Cotton Silk',
        basePrice: 1050,
        images: ['https://images.unsplash.com/photo-1631233859262-0d62bf363763?q=80&w=800&auto=format&fit=crop'],
        isAvailable: true,
        variants: [
            { id: 'v-3-1', color: 'Yellow', sizeRange: '20-30', stock: 0, pricePerPiece: 1050, piecesPerSet: 6 }
        ]
    }
];

export const MOCK_ORDERS: Order[] = [
    {
        id: 'ord-1001',
        userId: 'u-retailer',
        userBusinessName: 'Priya Fashion Boutique',
        userCity: 'Mumbai',
        items: [
            {
                productId: 'p-1',
                variantId: 'v-1-1',
                productName: 'Royal Velvet Anarkali Set',
                variantDescription: 'Maroon 24-34',
                pricePerPiece: 1250,
                piecesPerSet: 6,
                quantitySets: 2,
                image: MOCK_PRODUCTS[0].images[0]
            }
        ],
        totalAmount: 15000,
        factoryAmount: 15000,
        status: 'DISPATCHED',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentDetails: { method: PaymentCategory.RAZORPAY }
    }
];
