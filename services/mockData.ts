
import { Product, ProductCategory, UserRole, User, Order, PaymentCategory, Review, CreditRequest } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-super-admin',
    email: 'sarthak_huria@yahoo.com',
    fullName: 'Sarthak Huria',
    businessName: 'Saloni Sales HQ',
    role: UserRole.SUPER_ADMIN,
    isApproved: true,
    isPreBookApproved: true,
    creditLimit: 100000000,
    outstandingDues: 0,
    mobile: '9911076258'
  },
  {
    id: 'u-dispatch',
    email: 'employee@salonisales.com',
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
    gaddiId: 'u-jmjain',
    assignedAgentId: 'u-agent'
  },
  {
    id: 'u-retailer',
    email: 'retailer@salonisale.com',
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
    wishlist: ['1280']
  },
  {
    id: 'u-agent',
    email: 'agent@salonisale.com',
    fullName: 'Amit Verma',
    businessName: 'Verma Sales Agency',
    role: UserRole.AGENT,
    isApproved: true,
    creditLimit: 0,
    outstandingDues: 0,
    mobile: '9876543210'
  }
];

// Helper to determine pieces per set based on size range
const getPiecesPerSet = (range: string) => {
    const cleanRange = range.trim();
    if (cleanRange === '24/34') return 6;
    if (cleanRange === '36/40') return 3;
    if (cleanRange === '20/30') return 6;
    if (cleanRange === '18/22') return 3;
    if (cleanRange === '18/34') return 9;
    if (cleanRange === '24/40') return 9;
    if (cleanRange === '20/34') return 8;
    if (cleanRange === '30/34') return 3;
    if (cleanRange === '30/40') return 6;
    if (cleanRange === '32/40') return 5;
    return 6; // Default fallback
};

// Helper to convert Google Drive view links to direct image links
const processImage = (url: string) => {
    if (!url || url === '-' || url.trim() === '') return 'https://placehold.co/400x600?text=No+Image';
    if (url.includes('drive.google.com/file/d/')) {
        const id = url.split('/d/')[1].split('/')[0];
        return `https://drive.google.com/uc?export=view&id=${id}`;
    }
    return url;
};

// Live Data from PDF
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1026',
    sku: '1026',
    name: 'Designer Frock 1026',
    description: 'Premium kids wear. Color: SKY. Size Range: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1y7wtDWLzPsllGoBvT')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1026-SKY', color: 'SKY', sizeRange: '24/34', stock: Math.floor(96 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1027',
    sku: '1027',
    name: 'Party Wear 1027',
    description: 'Elegant design. Color: ONION. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1Vj8Jfz48t7vzTGW7K')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1027-ONION', color: 'ONION', sizeRange: '24/34', stock: Math.floor(26 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1030',
    sku: '1030',
    name: 'Fashion Frock 1030',
    description: 'Color: PEACOCK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1hwzUvhjmYgZFQzeN')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1030-PEACOCK', color: 'PEACOCK', sizeRange: '24/34', stock: Math.floor(9 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1040',
    sku: '1040',
    name: 'Western Dress 1040',
    description: 'Color: GREEN. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1tSugSUwdVsTn0WTE')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1040-GREEN', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(5 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1047',
    sku: '1047',
    name: 'Stylish Dress 1047',
    description: 'Available in sizes 24/34 and 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1KcDeMxT-vZGJ0MH')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1047-PEACH-2434', color: 'PEACH', sizeRange: '24/34', stock: Math.floor(9 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1047-PEACH-3640', color: 'PEACH', sizeRange: '36/40', stock: Math.floor(18 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1058',
    sku: '1058',
    name: 'Casual Frock 1058',
    description: 'Color: MOVE (Mauve). Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1gQ4Ae4sXNnvtTzeC')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1058-MOVE', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(3 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1100',
    sku: '1100',
    name: 'Fancy Dress 1100',
    description: 'Multiple colors available. Rust, Green, Pink.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1o8Iq6EefAddozfm40')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1100-RUST-2434', color: 'RUST', sizeRange: '24/34', stock: Math.floor(54 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1100-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1100-PINK-3640', color: 'PINK', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1100-RUST-3640', color: 'RUST', sizeRange: '36/40', stock: Math.floor(27 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1101',
    sku: '1101',
    name: 'Kids Wear 1101',
    description: 'Color: SKY. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1I2Z3Tbv9OOOxiXJM')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1101-SKY', color: 'SKY', sizeRange: '20/30', stock: Math.floor(5 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1109',
    sku: '1109',
    name: 'Green Dress 1109',
    description: 'Color: GREEN. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1Vi-6vAjOtdSKJWFYN')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1109-GREEN', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(31 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1112',
    sku: '1112',
    name: 'Peach Frock 1112',
    description: 'Color: PEACH. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1vosj2uqE5t8ikGCEO')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1112-PEACH', color: 'PEACH', sizeRange: '24/34', stock: Math.floor(7 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1116',
    sku: '1116',
    name: 'Pink Dress 1116',
    description: 'Color: PINK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/133Hh1-TOv_5ApyTy')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1116-PINK', color: 'PINK', sizeRange: '24/34', stock: Math.floor(6 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1121',
    sku: '1121',
    name: 'Onion Dress 1121',
    description: 'Color: ONION. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/JHA4FPosTtBVdr6i6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1121-ONION', color: 'ONION', sizeRange: '20/30', stock: Math.floor(14 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1124',
    sku: '1124',
    name: 'Green Frock 1124',
    description: 'Color: GREEN. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/BDmRHAQAUJJmpAqr6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1124-GREEN', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(15 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1125',
    sku: '1125',
    name: 'Pink Frock 1125',
    description: 'Color: PINK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/Hh9arv4fMQxqBnHx7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1125-PINK', color: 'PINK', sizeRange: '24/34', stock: Math.floor(13 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1128',
    sku: '1128',
    name: 'Cream Dress 1128',
    description: 'Color: CREAM. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/D7W2JH1LshXVuq9C7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1128-CREAM', color: 'CREAM', sizeRange: '24/34', stock: Math.floor(84 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1129',
    sku: '1129',
    name: 'Skin Color Dress 1129',
    description: 'Color: SKIN. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1oKHUY1D9T-EU3PfIz')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1129-SKIN', color: 'SKIN', sizeRange: '20/30', stock: Math.floor(16 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1157',
    sku: '1157',
    name: 'Cream Frock 1157',
    description: 'Sizes 24/34 and 36/40 available.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/g8mhCC3QLkqRvRDE9'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1157-CREAM-2434', color: 'CREAM', sizeRange: '24/34', stock: Math.floor(22 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1157-CREAM-3640', color: 'CREAM', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1160',
    sku: '1160',
    name: 'Pattern Dress 1160',
    description: 'Available in BLUE and GREEN across multiple size ranges.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1lyno1KBaJIU93JDVp')],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1160-BLUE-1822', color: 'BLUE', sizeRange: '18/22', stock: Math.floor(14 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1160-GREEN-1822', color: 'GREEN', sizeRange: '18/22', stock: Math.floor(12 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1160-BLUE-2434', color: 'BLUE', sizeRange: '24/34', stock: Math.floor(30 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1160-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(30 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1160-BLUE-3640', color: 'BLUE', sizeRange: '36/40', stock: Math.floor(15 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1160-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(15 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1200',
    sku: '1200',
    name: 'Black Dress 1200',
    description: 'Color: BLACK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/6sFYj1CjPwKhy8L69'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1200-BLACK', color: 'BLACK', sizeRange: '24/34', stock: Math.floor(4 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1201',
    sku: '1201',
    name: 'Black Party Wear 1201',
    description: 'Elegant Black. Available in 20/30 and 32/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/c7cvYXfpVxTXsA348'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1201-BLACK-2030', color: 'BLACK', sizeRange: '20/30', stock: Math.floor(32 / 6), pricePerPiece: 800, piecesPerSet: 6 },
      { id: 'v-1201-BLACK-3240', color: 'BLACK', sizeRange: '32/40', stock: Math.floor(35 / 5), pricePerPiece: 800, piecesPerSet: 5 }
    ]
  },
  {
    id: '1204',
    sku: '1204',
    name: 'Cream Dress 1204',
    description: 'Color: CREAM. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/14kCAsqN9ZLrhT3V6'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1204-CREAM-2434', color: 'CREAM', sizeRange: '24/34', stock: Math.floor(50 / 6), pricePerPiece: 800, piecesPerSet: 6 },
      { id: 'v-1204-CREAM-3640', color: 'CREAM', sizeRange: '36/40', stock: Math.floor(36 / 3), pricePerPiece: 800, piecesPerSet: 3 }
    ]
  },
  {
    id: '1205',
    sku: '1205',
    name: 'Rani Dress 1205',
    description: 'Color: RANI. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/1dtRwaH7FDU5CiJi9'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1205-RANI', color: 'RANI', sizeRange: '24/34', stock: Math.floor(11 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1210',
    sku: '1210',
    name: 'Maroon Dress 1210',
    description: 'Color: MAROON. Size: 18/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/dh3kGf4kF3sEVhbD8'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1210-MAROON', color: 'MAROON', sizeRange: '18/34', stock: Math.floor(8 / 9), pricePerPiece: 800, piecesPerSet: 9 }
    ]
  },
  {
    id: '1212',
    sku: '1212',
    name: 'Green Gown 1212',
    description: 'Color: GREEN. Sizes 24/34, 36/40.',
    category: ProductCategory.ETHNIC,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/m555Vd2oGHoN7W3p8'],
    basePrice: 950,
    isAvailable: true,
    hsnCode: '620419',
    variants: [
      { id: 'v-1212-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(45 / 6), pricePerPiece: 950, piecesPerSet: 6 },
      { id: 'v-1212-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(21 / 3), pricePerPiece: 950, piecesPerSet: 3 }
    ]
  },
  {
    id: '1214',
    sku: '1214',
    name: 'Maroon Frock 1214',
    description: 'Color: MAROON. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/t5KMeREwuvJiP3HU9'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1214-MAROON', color: 'MAROON', sizeRange: '24/34', stock: Math.floor(72 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1216',
    sku: '1216',
    name: 'Black Dress 1216',
    description: 'Color: BLACK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/xb5hAnAx1Fi3gsVo6'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1216-BLACK', color: 'BLACK', sizeRange: '24/34', stock: Math.floor(10 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1217',
    sku: '1217',
    name: 'Cream Dress 1217',
    description: 'Color: CREAM. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/ELxFKsabHi5RnXEq5'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1217-CREAM', color: 'CREAM', sizeRange: '24/34', stock: Math.floor(41 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1218',
    sku: '1218',
    name: 'Green Dress 1218',
    description: 'Color: GREEN. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/hJjP8Qkz2ZzG8dN98'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1218-GREEN', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(56 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1219',
    sku: '1219',
    name: 'Rani Dress 1219',
    description: 'Color: RANI. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/y41MZgZfGXv7RbUy6'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1219-RANI-2434', color: 'RANI', sizeRange: '24/34', stock: Math.floor(25 / 6), pricePerPiece: 800, piecesPerSet: 6 },
      { id: 'v-1219-RANI-3640', color: 'RANI', sizeRange: '36/40', stock: Math.floor(15 / 3), pricePerPiece: 800, piecesPerSet: 3 }
    ]
  },
  {
    id: '1224',
    sku: '1224',
    name: 'Gold Dress 1224',
    description: 'Color: GOLD. Size: 24/34.',
    category: ProductCategory.ETHNIC,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/TUrRLmaYvEaDSfwd6'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620419',
    variants: [
      { id: 'v-1224-GOLD', color: 'GOLD', sizeRange: '24/34', stock: Math.floor(6 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1227',
    sku: '1227',
    name: 'Black Special 1227',
    description: 'Color: BLACK. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/9hG2oDmvgh7vy9sb9'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1227-BLACK-2434', color: 'BLACK', sizeRange: '24/34', stock: Math.floor(26 / 6), pricePerPiece: 800, piecesPerSet: 6 },
      { id: 'v-1227-BLACK-3640', color: 'BLACK', sizeRange: '36/40', stock: Math.floor(15 / 3), pricePerPiece: 800, piecesPerSet: 3 }
    ]
  },
  {
    id: '1228',
    sku: '1228',
    name: 'Cream Dress 1228',
    description: 'Color: CREAM. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/hjuzh8QKHGuCma2i8'],
    basePrice: 800,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1228-CREAM', color: 'CREAM', sizeRange: '24/34', stock: Math.floor(16 / 6), pricePerPiece: 800, piecesPerSet: 6 }
    ]
  },
  {
    id: '1250',
    sku: '1250',
    name: 'Cream Dress 1250',
    description: 'Color: CREAM. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/CWewt3cn75DL6mKn9'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1250-CREAM', color: 'CREAM', sizeRange: '20/30', stock: Math.floor(18 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1251',
    sku: '1251',
    name: 'Peach Dress 1251',
    description: 'Color: PEACH. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/FabqoSNo9wzxdTHBA'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1251-PEACH', color: 'PEACH', sizeRange: '20/30', stock: Math.floor(12 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1251B',
    sku: '1251/B',
    name: 'Pink Dress 1251/B',
    description: 'Color: PINK. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/4hHoFHBSgcDaaWwQ7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1251B-PINK', color: 'PINK', sizeRange: '20/30', stock: Math.floor(21 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1252',
    sku: '1252',
    name: 'Designer Dress 1252',
    description: 'Colors: MOVE, PINK. Sizes: 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/zWHXPTT9JvcQDXq58'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1252-MOVE-2434', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(66 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1252-PINK-2434', color: 'PINK', sizeRange: '24/34', stock: Math.floor(60 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1252-MOVE-3640', color: 'MOVE', sizeRange: '36/40', stock: Math.floor(27 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1252-PINK-3640', color: 'PINK', sizeRange: '36/40', stock: Math.floor(41 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1253',
    sku: '1253',
    name: 'Mix Dress 1253',
    description: 'Color: MIX. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/kYTuHbYwfHAhSTix9'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1253-MIX', color: 'MIX', sizeRange: '20/30', stock: Math.floor(35 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1262',
    sku: '1262',
    name: 'Cream Frock 1262',
    description: 'Color: CREAM. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/HJsbX6TioXeu7gJ79'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1262-CREAM', color: 'CREAM', sizeRange: '20/30', stock: Math.floor(5 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1265',
    sku: '1265',
    name: 'Dress 1265',
    description: 'Colors: GREEN, RANI. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/E4MYun4ZbaSr7rGG7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1265-GREEN', color: 'GREEN', sizeRange: '20/30', stock: Math.floor(15 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1265-RANI', color: 'RANI', sizeRange: '20/30', stock: Math.floor(7 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1267',
    sku: '1267',
    name: 'Carrot Dress 1267',
    description: 'Color: CARROT. Size: 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1267-CARROT', color: 'CARROT', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1270',
    sku: '1270',
    name: 'Green Dress 1270',
    description: 'Color: GREEN. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/ASyf6aGmevS1SWMD9'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1270-GREEN', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(70 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1271',
    sku: '1271',
    name: 'Dress 1271',
    description: 'Colors: GREEN, MOVE. Size: 24/40 (9 pc set).',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/Jy1d8e7ZkWQbfdYN6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1271-GREEN', color: 'GREEN', sizeRange: '24/40', stock: Math.floor(12 / 9), pricePerPiece: 500, piecesPerSet: 9 },
      { id: 'v-1271-MOVE', color: 'MOVE', sizeRange: '24/40', stock: Math.floor(18 / 9), pricePerPiece: 500, piecesPerSet: 9 }
    ]
  },
  {
    id: '1276',
    sku: '1276',
    name: 'Cream Dress 1276',
    description: 'Color: CREAM. Size: 20/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/Y9zzkGjCaJmFuiXA8'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1276-CREAM', color: 'CREAM', sizeRange: '20/34', stock: Math.floor(31 / 8), pricePerPiece: 500, piecesPerSet: 8 }
    ]
  },
  {
    id: '1279',
    sku: '1279',
    name: 'White Dress 1279',
    description: 'Color: WHITE. Size: 24/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/s8KmiNPYDmkEgJmM7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1279-WHITE', color: 'WHITE', sizeRange: '24/40', stock: Math.floor(70 / 9), pricePerPiece: 500, piecesPerSet: 9 }
    ]
  },
  {
    id: '1280',
    sku: '1280',
    name: 'Fashion Dress 1280',
    description: 'Colors: CARROT, MOVE. Sizes: 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/fp5QP163UZvQ1qxw6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1280-CARROT-2434', color: 'CARROT', sizeRange: '24/34', stock: Math.floor(10 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1280-MOVE-2434', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(17 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1280-CARROT-3640', color: 'CARROT', sizeRange: '36/40', stock: Math.floor(9 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1280-MOVE-3640', color: 'MOVE', sizeRange: '36/40', stock: Math.floor(12 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1282',
    sku: '1282',
    name: 'Dress 1282',
    description: 'Colors: CARROT, MOVE. Sizes: 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/QZ76K2baXWR93dCS7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1282-CARROT-2434', color: 'CARROT', sizeRange: '24/34', stock: Math.floor(23 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1282-MOVE-2434', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(24 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1282-CARROT-3640', color: 'CARROT', sizeRange: '36/40', stock: Math.floor(12 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1282-MOVE-3640', color: 'MOVE', sizeRange: '36/40', stock: Math.floor(12 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1285',
    sku: '1285',
    name: 'Dress 1285',
    description: 'Colors: GOLD, SKY. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/d1xe7hu7LN4CXtu57'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1285-GOLD', color: 'GOLD', sizeRange: '20/30', stock: Math.floor(47 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1285-SKY', color: 'SKY', sizeRange: '20/30', stock: Math.floor(67 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1286',
    sku: '1286',
    name: 'Pink Frock 1286',
    description: 'Color: PINK. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1YPUwk_KdArUOgVP')],
    basePrice: 650,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1286-PINK', color: 'PINK', sizeRange: '20/30', stock: Math.floor(42 / 6), pricePerPiece: 650, piecesPerSet: 6 }
    ]
  },
  {
    id: '1287',
    sku: '1287',
    name: 'Dress 1287',
    description: 'Colors: BLUE, PINK. Sizes: 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/9Hmab99WxZJvfHQb6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1287-BLUE-2434', color: 'BLUE', sizeRange: '24/34', stock: Math.floor(23 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1287-PINK-2434', color: 'PINK', sizeRange: '24/34', stock: Math.floor(24 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1287-BLUE-3640', color: 'BLUE', sizeRange: '36/40', stock: Math.floor(6 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1287-PINK-3640', color: 'PINK', sizeRange: '36/40', stock: Math.floor(6 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1288',
    sku: '1288',
    name: 'Multi Dress 1288',
    description: 'Color: MULTI. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1c7MwcbqJD2wr1Ba')],
    basePrice: 650,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1288-MULTI', color: 'MULTI', sizeRange: '20/30', stock: Math.floor(83 / 6), pricePerPiece: 650, piecesPerSet: 6 }
    ]
  },
  {
    id: '1289',
    sku: '1289',
    name: 'Pink Dress 1289',
    description: 'Color: PINK. Size: 18/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1-hxyLWbe-fcekcdkM')],
    basePrice: 650,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1289-PINK', color: 'PINK', sizeRange: '18/34', stock: Math.floor(40 / 9), pricePerPiece: 650, piecesPerSet: 9 }
    ]
  },
  {
    id: '1290',
    sku: '1290',
    name: 'Pink Dress 1290',
    description: 'Color: PINK. Size: 18/22.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [processImage('https://drive.google.com/file/d/1WDl2B6cKsbWRhSs')],
    basePrice: 650,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1290-PINK', color: 'PINK', sizeRange: '18/22', stock: Math.floor(60 / 3), pricePerPiece: 650, piecesPerSet: 3 }
    ]
  },
  {
    id: '1294',
    sku: '1294',
    name: 'Carrot Dress 1294',
    description: 'Color: CARROT. Size: 30/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/LYLQjEufT223R7Di6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1294-CARROT', color: 'CARROT', sizeRange: '30/34', stock: Math.floor(16 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1295',
    sku: '1295',
    name: 'Onion Dress 1295',
    description: 'Color: ONION. Size: 24/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/5vXGqMBVAGHigyNb8'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1295-ONION', color: 'ONION', sizeRange: '24/40', stock: Math.floor(72 / 9), pricePerPiece: 500, piecesPerSet: 9 }
    ]
  },
  {
    id: '1296',
    sku: '1296',
    name: 'Dress 1296',
    description: 'Colors: ONION, MOVE. Size: 24/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/TQrqTTBNGPpjnMpRA'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1296-ONION', color: 'ONION', sizeRange: '24/40', stock: Math.floor(36 / 9), pricePerPiece: 500, piecesPerSet: 9 },
      { id: 'v-1296-MOVE', color: 'MOVE', sizeRange: '24/40', stock: Math.floor(36 / 9), pricePerPiece: 500, piecesPerSet: 9 }
    ]
  },
  {
    id: '1297',
    sku: '1297',
    name: 'Dress 1297',
    description: 'Colors: GREEN, PINK. Size: 20/30.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/Xh6NriQetQcdakcv6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1297-GREEN', color: 'GREEN', sizeRange: '20/30', stock: Math.floor(17 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1297-PINK', color: 'PINK', sizeRange: '20/30', stock: Math.floor(21 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1404',
    sku: '1404',
    name: 'Cream Frock 1404',
    description: 'Color: CREAM. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/pwRbDXzXHwSfiuuB8'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1404-CREAM', color: 'CREAM', sizeRange: '24/34', stock: Math.floor(6 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1405',
    sku: '1405',
    name: 'Peach Dress 1405',
    description: 'Color: PEACH. Size: 30/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/X3AgD3N6hPCSvuk38'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1405-PEACH', color: 'PEACH', sizeRange: '30/40', stock: Math.floor(42 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1408',
    sku: '1408',
    name: 'Cream Dress 1408',
    description: 'Color: CREAM. Size: 30/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/2pwA2EAc38cFtwpj7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1408-CREAM', color: 'CREAM', sizeRange: '30/40', stock: Math.floor(5 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1409',
    sku: '1409',
    name: 'Green Dress 1409',
    description: 'Color: GREEN. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/iF5vTgaUN6ng86ba9'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1409-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(24 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1409-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(8 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1417',
    sku: '1417',
    name: 'Dress 1417',
    description: 'Colors: GREEN, RANI. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/dbJ7N5kNyMsSAcez5'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1417-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(30 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1417-RANI-2434', color: 'RANI', sizeRange: '24/34', stock: Math.floor(12 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1417-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(18 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1417-RANI-3640', color: 'RANI', sizeRange: '36/40', stock: Math.floor(9 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1419',
    sku: '1419',
    name: 'Green Dress 1419',
    description: 'Color: GREEN. Size: 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/M58tQawPQ4jBYees6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1419-GREEN', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(9 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1420',
    sku: '1420',
    name: 'Dress 1420',
    description: 'Colors: BLUE, GREEN. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/r1B6EZrDX8xxpQmL6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1420-BLUE-2434', color: 'BLUE', sizeRange: '24/34', stock: Math.floor(12 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1420-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(12 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1420-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(6 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1420-BLUE-3640', color: 'BLUE', sizeRange: '36/40', stock: Math.floor(6 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1421',
    sku: '1421',
    name: 'Sky Dress 1421',
    description: 'Color: SKY. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/Jy8XhKhnHcLwE9AG7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1421-SKY-2434', color: 'SKY', sizeRange: '24/34', stock: Math.floor(11 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1421-SKY-3640', color: 'SKY', sizeRange: '36/40', stock: Math.floor(6 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1423',
    sku: '1423',
    name: 'Dress 1423',
    description: 'Colors: GREEN, MOVE. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/2BmztKMvbP4F5CfE9'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1423-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(30 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1423-MOVE-2434', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(23 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1423-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(15 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1423-MOVE-3640', color: 'MOVE', sizeRange: '36/40', stock: Math.floor(11 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1424',
    sku: '1424',
    name: 'Dress 1424',
    description: 'Colors: GREEN, MOVE. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/wsbqr65dryr3s4Nt6'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1424-GREEN-2434', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(18 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1424-MOVE-2434', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(23 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1424-GREEN-3640', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(12 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1424-MOVE-3640', color: 'MOVE', sizeRange: '36/40', stock: Math.floor(12 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1425',
    sku: '1425',
    name: 'Dress 1425',
    description: 'Colors: MOVE, PEACH. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/1DzjNS9NYex8br8E7'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1425-MOVE', color: 'MOVE', sizeRange: '24/34', stock: Math.floor(60 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1425-PEACH', color: 'PEACH', sizeRange: '24/34', stock: Math.floor(12 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1426',
    sku: '1426',
    name: 'Onion Dress 1426',
    description: 'Color: ONION. Sizes 24/34, 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/LcuhfiQ418XaFdv69'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1426-ONION-2434', color: 'ONION', sizeRange: '24/34', stock: Math.floor(6 / 6), pricePerPiece: 500, piecesPerSet: 6 },
      { id: 'v-1426-ONION-3640', color: 'ONION', sizeRange: '36/40', stock: Math.floor(9 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: '1435',
    sku: '1435',
    name: 'Dress 1435',
    description: 'Colors: GREEN, PINK, SKY. Size: 36/40.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1435-GREEN', color: 'GREEN', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1435-PINK', color: 'PINK', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 },
      { id: 'v-1435-SKY', color: 'SKY', sizeRange: '36/40', stock: Math.floor(3 / 3), pricePerPiece: 500, piecesPerSet: 3 }
    ]
  },
  {
    id: 'NEW1',
    sku: 'NEW 1',
    name: 'New Black Dress 1',
    description: 'Color: BLACK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/A3Tu9kqift9GvgLbA'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-NEW1-BLACK', color: 'BLACK', sizeRange: '24/34', stock: Math.floor(54 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: 'NEW2',
    sku: 'NEW 2',
    name: 'New Black Dress 2',
    description: 'Color: BLACK. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: [],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-NEW2-BLACK', color: 'BLACK', sizeRange: '24/34', stock: Math.floor(54 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  },
  {
    id: '1226',
    sku: '1226',
    name: 'Green Dress 1226',
    description: 'Color: GREEN. Size: 24/34.',
    category: ProductCategory.WESTERN,
    fabric: 'Imported',
    images: ['https://photos.app.goo.gl/LcuhfiQ418XaFdv69'],
    basePrice: 500,
    isAvailable: true,
    hsnCode: '620429',
    variants: [
      { id: 'v-1226-GREEN', color: 'GREEN', sizeRange: '24/34', stock: Math.floor(6 / 6), pricePerPiece: 500, piecesPerSet: 6 }
    ]
  }
];

export const MOCK_ORDERS: Order[] = [
    {
        id: '42',
        userId: 'u-anurag',
        userBusinessName: 'Anurag Creation',
        userCity: 'Boregaon',
        userState: 'Maharashtra',
        items: [
            {
                productId: '1280',
                variantId: 'v-1280-CARROT-2434',
                productName: 'Fashion Dress 1280',
                variantDescription: 'CARROT / Set (24/34)',
                pricePerPiece: 500,
                piecesPerSet: 6,
                quantitySets: 1, // 6 Pcs
                image: 'https://photos.app.goo.gl/fp5QP163UZvQ1qxw6',
                hsnCode: '620429'
            }
        ],
        totalAmount: 3000,
        factoryAmount: 2910,
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
