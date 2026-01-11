
export enum UserRole {
  RETAILER = 'RETAILER',
  LOCAL_TRADER = 'LOCAL_TRADER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  GADDI = 'GADDI',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DISPATCH = 'DISPATCH',
  CORPORATE = 'CORPORATE',
  INTERNATIONAL = 'INTERNATIONAL'
}

export enum ProductCategory {
  WESTERN = 'Western Wear',
  ETHNIC = 'Ethnic Wear',
  INDO_WESTERN = 'Indo-Western Wear',
  PRE_BOOK = 'Pre-Book Club'
}

export enum VisitType {
  EXPERIENCE_CENTRE = 'Experience Centre',
  MEET_FOUNDER = 'Meet Mr. Sarthak Huria',
  DOORSTEP = 'Doorstep Visit'
}

export enum PaymentCategory {
  RAZORPAY = 'RAZORPAY',
  GADDI = 'GADDI',
  AGENT = 'AGENT',
  DISTRIBUTOR_CREDIT = 'DISTRIBUTOR',
  LEDGER = 'LEDGER'
}

export interface User {
  id: string; // UUID
  email: string;
  fullName: string;
  businessName?: string;
  role: UserRole;
  gstin?: string;
  gstCertificateUrl?: string;
  aadharNumber?: string;
  mobile?: string;
  isApproved: boolean;
  isPreBookApproved?: boolean;
  creditLimit: number;
  outstandingDues: number;
  wishlist: string[];
  assignedAgentId?: string; // UUID
  gaddiId?: string; // UUID
  assignedDistributorId?: string; // UUID
  tier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  adminNotes?: string;
  address?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

export interface ProductVariant {
  id: string; // UUID
  sizeRange: string;
  color: string;
  stock: number;
  pricePerPiece: number;
  piecesPerSet: number;
}

export interface Product {
  id: string; // UUID
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
  hsnCode?: string;
  created_at?: string;
}

export interface CartItem {
  productId: string; // UUID
  variantId: string; // UUID
  productName: string;
  variantDescription: string;
  pricePerPiece: number; // Display only, authority is DB
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
  purchaseOrderUrl?: string;
}

export interface TransportDetails {
  transporterName: string;
  grNumber: string;
  vehicleNumber?: string;
  station?: string;
  eWayBillNo?: string;
}

// --- NEW COMMERCIAL TYPES ---

export type RuleType = 'COMMISSION' | 'DISCOUNT' | 'MARKUP' | 'SHIPPING';
export type CalculationType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface PricingRule {
  id: string;
  name: string;
  rule_type: RuleType;
  pipeline_definition: string;
  target_role?: UserRole;
  calculation_type: CalculationType;
  value: number;
  min_order_value: number;
  priority: number;
  is_locked: boolean;
  effective_from: string;
  effective_to?: string;
}

export interface OrderSnapshot {
  base_total: number;
  final_total: number;
  applied_rules: {
    rule_id: string;
    rule_name: string;
    amount: number;
    type: RuleType;
  }[];
  settlement_mode: 'AUTO_LEDGER' | 'MANUAL_AUDIT';
  pipeline: {
    agent_id?: string;
    gaddi_id?: string;
    distributor_id?: string;
  };
  pricing_version: string;
}

export interface Order {
  id: string; // UUID
  userId: string; // UUID
  userBusinessName: string;
  userCity?: string;
  userState?: string;
  items: CartItem[]; // Stored as JSONB in DB
  totalAmount: number;
  factoryAmount: number;
  guarantorId?: string; // UUID
  guarantorFee?: number;
  status: 'PENDING' | 'ACCEPTED' | 'GUARANTEED' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  settlementDeadline?: string;
  paymentDetails: {
    method: PaymentCategory;
    entityId?: string;
    entityName?: string;
    transactionId?: string;
  };
  documents?: OrderDocuments;
  transport?: TransportDetails;
  trackingNumber?: string;
  gaddiId?: string;
  gaddiName?: string;
  gaddiAmount?: number;
  poNumber?: string;
  poImageUrl?: string;
  
  // NEW IMMUTABLE FIELDS
  snapshotData?: OrderSnapshot;
  commissionValue?: number;
}

export interface StockLog {
    id: string;
    productId: string;
    variantId: string;
    productName: string;
    variantDesc: string;
    quantity: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
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

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    orderId?: string;
    subject: string;
    category: 'ORDER_ISSUE' | 'PAYMENT' | 'PRODUCT_QUERY' | 'OTHER' | 'SECURITY_BREACH';
    status: TicketStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    messages: TicketMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}
