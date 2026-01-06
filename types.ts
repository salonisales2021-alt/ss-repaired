
export enum UserRole {
  RETAILER = 'RETAILER',         // Shop Owner (Buys to sell)
  LOCAL_TRADER = 'LOCAL_TRADER', // Stocks goods & can distribute locally
  DISTRIBUTOR = 'DISTRIBUTOR',   // Ledger & Order Distributor (Settle within 60-90 days)
  GADDI = 'GADDI',               // Backing Wholesale Firm / Establishment
  AGENT = 'AGENT',               // Sales & Field Collection
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DISPATCH = 'DISPATCH'          // Dispatch Department
}

export enum ProductCategory {
  WESTERN = 'Western Wear',
  ETHNIC = 'Ethnic Wear',
  INDO_WESTERN = 'Indo-Western Wear',
  PRE_BOOK = 'Pre-Book Club' // Exclusive Line
}

export enum VisitType {
  EXPERIENCE_CENTRE = 'Experience Centre',
  MEET_FOUNDER = 'Meet Mr. Sarthak Huria',
  DOORSTEP = 'Doorstep Visit'
}

export enum PaymentCategory {
  RAZORPAY = 'RAZORPAY',         // Pay Now
  GADDI = 'GADDI',               // Pay using Buying House
  AGENT = 'AGENT',               // Pay using Agent
  DISTRIBUTOR_CREDIT = 'DISTRIBUTOR', // Pay using Distributor
  LEDGER = 'LEDGER'              // Legacy/Internal
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  businessName?: string;
  role: UserRole;
  gstin?: string;
  aadharNumber?: string;
  mobile?: string;
  isApproved: boolean;
  isPreBookApproved?: boolean; // Exclusive Club Access
  creditLimit?: number;
  outstandingDues?: number;
  wishlist?: string[];
  assignedAgentId?: string;
  gaddiId?: string; 
  assignedDistributorId?: string; // Link to the Distributor node
  tier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  adminNotes?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface ProductVariant {
  id: string;
  sizeRange: string;
  color: string;
  stock: number;
  pricePerPiece: number;
  piecesPerSet: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  fabric: string;
  images: string[];
  video?: string;
  variants: ProductVariant[];
  basePrice: number;
  isAvailable: boolean;
  collection?: string;
  hsnCode?: string; // Added HSN for Invoice
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantDescription: string;
  pricePerPiece: number;
  piecesPerSet: number;
  quantitySets: number;
  image: string;
  hsnCode?: string;
}

export interface OrderDocuments {
  invoiceUrl?: string; 
  retailerMemoUrl?: string; 
  ewayBillUrl?: string;
  lrGrSlipUrl?: string;
  purchaseOrderUrl?: string; // Admin uploaded PO
}

export interface TransportDetails {
  transporterName: string;
  grNumber: string; // Builty Number
  vehicleNumber?: string;
  station?: string;
  eWayBillNo?: string;
}

export interface Order {
  id: string;
  userId: string;
  userBusinessName: string;
  userCity?: string;
  userState?: string;
  items: CartItem[];
  totalAmount: number; 
  factoryAmount: number; 
  guarantorId?: string; // Internal ID of the Distributor/Gaddi
  guarantorFee?: number; 
  status: 'PENDING' | 'ACCEPTED' | 'GUARANTEED' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  settlementDeadline?: string; 
  paymentDetails: {
    method: PaymentCategory;
    entityId?: string;
    entityName?: string;
  };
  documents?: OrderDocuments;
  transport?: TransportDetails;
  trackingNumber?: string;
  gaddiId?: string;
  gaddiName?: string;
  gaddiAmount?: number;
  poNumber?: string; // Gaddi Purchase Order Number
  poImageUrl?: string; // URL of the uploaded P.O. image (Gaddi flow)
}

// ... rest of existing types
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketCategory = 'ORDER_ISSUE' | 'PAYMENT' | 'PRODUCT_QUERY' | 'OTHER' | 'SECURITY_BREACH';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    orderId?: string;
    subject: string;
    category: TicketCategory;
    status: TicketStatus;
    priority: TicketPriority;
    messages: TicketMessage[];
    createdAt: string;
    updatedAt: string;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockLog {
    id: string;
    productId: string;
    variantId: string;
    productName: string;
    variantDesc: string;
    quantity: number;
    type: StockMovementType;
    reason: string;
    date: string;
    performedBy: string;
}

export type NotificationType = 'ORDER' | 'SYSTEM' | 'PROMOTION' | 'ALERT';

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type TransactionType = 'PAYMENT' | 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
  createdBy: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreditRequest {
  id: string;
  userId: string;
  userName: string;
  currentLimit: number;
  requestedLimit: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

export interface VisitLog {
    id: string;
    agentId: string;
    agentName: string;
    clientId: string;
    clientName: string;
    date: string;
    purpose: string;
    notes: string;
    location: string;
    amountCollected?: number;
    outcome?: string;
}

export interface VisitRequest {
    id: string;
    userId: string;
    userName: string;
    type: VisitType;
    requestedDate: string;
    requestedTime: string;
    notes?: string;
    status: 'PENDING' | 'APPROVED' | 'DECLINED';
}
