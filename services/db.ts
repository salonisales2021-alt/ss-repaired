
import { supabase, isLiveData } from './supabaseClient';
import { 
    User, Product, Order, UserRole, 
    VisitLog, StockLog, Transaction, SupportTicket, 
    Review, VisitRequest, TicketMessage, ProductCategory, PaymentCategory, PricingRule
} from '../types';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_ORDERS } from './mockData';

// --- DATA MAPPERS ---

const mapDbProductToApp = (p: any): Product => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category as ProductCategory,
    fabric: p.fabric,
    basePrice: p.base_price,
    images: p.images || [],
    video: p.video,
    isAvailable: p.is_available,
    collection: p.collection,
    hsnCode: p.hsn_code,
    variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        color: v.color,
        sizeRange: v.size_range,
        stock: v.stock,
        pricePerPiece: v.price_per_piece,
        piecesPerSet: v.pieces_per_set
    })),
    created_at: p.created_at
});

const mapProfileToUser = (p: any): User => ({
    id: p.id,
    email: p.email || '',
    fullName: p.full_name || '',
    businessName: p.business_name,
    role: p.role as UserRole,
    gstin: p.gstin,
    mobile: p.mobile,
    isApproved: p.is_approved,
    isPreBookApproved: p.is_pre_book_approved,
    creditLimit: p.credit_limit || 0,
    outstandingDues: p.outstanding_dues || 0,
    wishlist: p.wishlist || [],
    assignedAgentId: p.assigned_agent_id,
    gaddiId: p.gaddi_id,
    assignedDistributorId: p.assigned_distributor_id,
    address: p.address,
    city: p.city,
    state: p.state,
    created_at: p.created_at
});

// --- UTILITIES ---

export const getGeminiKey = (): string => {
    const stored = localStorage.getItem('SALONI_API_KEY');
    if (stored) return stored;
    return process.env.API_KEY || '';
};

export const handleAiError = async (error: any): Promise<boolean> => {
    if (error.message?.includes("API key") || error.message?.includes("API_KEY")) {
        console.warn("AI Capability Skipped: API Key not configured.");
        return true; 
    }
    console.error("AI Service Error:", error);
    return false;
};

export const parseAIJson = <T>(text: string, fallback: T): T => {
    try {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        return fallback;
    }
};

export const runAiWithRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
    let lastError;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    throw lastError;
};

// --- DATABASE INTERFACE ---

export const db = {
    // --- AUTH ---
    signIn: async (email: string, password: string) => {
        if (!isLiveData) {
            const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (mockUser) {
                await new Promise(r => setTimeout(r, 500));
                localStorage.setItem('saloni_demo_user', JSON.stringify(mockUser));
                return { user: mockUser, error: null };
            }
            return { user: null, error: "Invalid demo credentials." };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { user: null, error: error.message };
            
            const profile = await db.getUserById(data.user.id);
            return { user: profile, error: null };
        } catch(e: any) {
            return { user: null, error: e.message || "Connection failed" };
        }
    },

    signOut: async () => {
        if (!isLiveData) {
            localStorage.removeItem('saloni_demo_user');
            window.location.reload();
            return;
        }
        return supabase.auth.signOut();
    },

    updatePassword: async (password: string) => {
        if (!isLiveData) return { success: true };
        const { error } = await supabase.auth.updateUser({ password });
        return { success: !error, error: error?.message };
    },

    // --- ENTITIES ---
    getProducts: async (): Promise<Product[]> => {
        if (!isLiveData) return MOCK_PRODUCTS;
        const { data } = await supabase.from('products').select('*, variants:product_variants(*)').eq('is_available', true);
        return (data || []).map(mapDbProductToApp);
    },

    saveProduct: async (product: Partial<Product>): Promise<boolean> => {
        if (!isLiveData) return true;

        const dbProduct: any = {
            sku: product.sku,
            name: product.name,
            description: product.description,
            category: product.category,
            fabric: product.fabric,
            base_price: product.basePrice,
            images: product.images,
            video: product.video,
            is_available: product.isAvailable,
            hsn_code: product.hsnCode
        };
        if(product.id && !product.id.startsWith('p-')) dbProduct.id = product.id;

        const { data: savedProd, error } = await supabase.from('products').upsert(dbProduct).select().single();
        if (error || !savedProd) return false;

        if (product.variants) {
            const variants = product.variants.map(v => ({
                id: (v.id.startsWith('v-') ? undefined : v.id),
                product_id: savedProd.id,
                color: v.color,
                size_range: v.sizeRange,
                stock: v.stock,
                price_per_piece: v.pricePerPiece,
                pieces_per_set: v.piecesPerSet
            }));
            await supabase.from('product_variants').upsert(variants);
        }
        return true;
    },

    deleteProduct: async (id: string) => {
        if (!isLiveData) return true;
        return !(await supabase.from('products').delete().eq('id', id)).error;
    },

    getUsers: async (): Promise<User[]> => {
        if (!isLiveData) return MOCK_USERS;
        const { data } = await supabase.from('profiles').select('*');
        return (data || []).map(mapProfileToUser);
    },

    getUserById: async (id: string): Promise<User | null> => {
        if (!isLiveData) return MOCK_USERS.find(u => u.id === id) || null;
        const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
        return data ? mapProfileToUser(data) : null;
    },

    registerUser: async (user: User, password?: string) => {
        if (!isLiveData) return { success: true };

        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: password || 'Saloni123',
            options: {
                data: { full_name: user.fullName, role: user.role, business_name: user.businessName }
            }
        });
        if (error) return { success: false, error: error.message };
        
        if (data.user) {
            await supabase.from('profiles').update({
                gstin: user.gstin,
                mobile: user.mobile,
                assigned_agent_id: user.assignedAgentId,
                gaddi_id: user.gaddiId
            }).eq('id', data.user.id);
        }
        return { success: true };
    },

    updateUser: async (user: User) => {
        if (!isLiveData) return true;
        const { error } = await supabase.from('profiles').update({
            full_name: user.fullName,
            business_name: user.businessName,
            mobile: user.mobile,
            gstin: user.gstin,
            credit_limit: user.creditLimit,
            outstanding_dues: user.outstandingDues,
            is_approved: user.isApproved,
            is_pre_book_approved: user.isPreBookApproved,
            wishlist: user.wishlist
        }).eq('id', user.id);
        return !error;
    },

    // --- COMMERCIAL RULES ---
    getPricingRules: async (): Promise<PricingRule[]> => {
        if (!isLiveData) return [];
        const { data } = await supabase.from('pricing_rules').select('*').order('priority', { ascending: false });
        return data as PricingRule[];
    },

    savePricingRule: async (rule: Partial<PricingRule>) => {
        if (!isLiveData) return true;
        return !(await supabase.from('pricing_rules').upsert(rule)).error;
    },

    logAiAudit: async (entityId: string, type: 'ORDER' | 'TRANSACTION', score: string, reason: string) => {
        if (!isLiveData) return;
        await supabase.from('ai_audit_logs').insert({
            entity_id: entityId,
            entity_type: type,
            risk_score: score,
            anomaly_reason: reason
        });
    },

    // --- ORDERING ---
    // Updated to accept snapshotData
    createOrder: async (orderData: Partial<Order>) => {
        if (!isLiveData) {
            console.log("Mock Create Order:", orderData);
            return true;
        }
        
        // We now insert directly into `orders` if no complex RPC exists, or use RPC if it handles inventory.
        // Assuming we use direct insert for flexibility with snapshot data.
        
        // 1. Deduct Stock (Ideally RPC, simplified here)
        // ... (Inventory logic)

        // 2. Insert Order with Snapshot
        const { error } = await supabase.from('orders').insert({
            user_id: orderData.userId,
            items: orderData.items,
            payment_method: orderData.paymentDetails?.method,
            guarantor_id: orderData.guarantorId,
            total_amount: orderData.snapshotData?.final_total || orderData.totalAmount, // Use snapshot total
            factory_amount: orderData.factoryAmount || orderData.totalAmount,
            snapshot_data: orderData.snapshotData,
            status: 'PENDING',
            user_business_name: orderData.userBusinessName,
            user_city: orderData.userCity
        });

        return !error;
    },

    getAllOrders: async (): Promise<Order[]> => {
        if (!isLiveData) return MOCK_ORDERS;
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        return (data || []).map(o => ({
            id: o.id,
            userId: o.user_id,
            userBusinessName: o.user_business_name,
            userCity: o.user_city,
            items: o.items || [], 
            totalAmount: o.total_amount,
            factoryAmount: o.factory_amount,
            guarantorId: o.guarantor_id,
            status: o.status,
            createdAt: o.created_at,
            paymentDetails: { method: o.payment_method as PaymentCategory },
            documents: o.documents,
            transport: o.transport_details,
            trackingNumber: o.tracking_number,
            gaddiId: o.gaddi_id,
            poNumber: o.po_number,
            poImageUrl: o.po_image_url,
            snapshotData: o.snapshot_data,
            commissionValue: o.commission_value
        } as Order));
    },

    getOrdersByUser: async (userId: string) => {
        const all = await db.getAllOrders();
        return all.filter(o => o.userId === userId);
    },

    updateOrder: async (id: string, updates: Partial<Order>) => {
        if (!isLiveData) return true;
        
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.documents) dbUpdates.documents = updates.documents;
        if (updates.poNumber) dbUpdates.po_number = updates.poNumber;
        if (updates.poImageUrl) dbUpdates.po_image_url = updates.poImageUrl;
        if (updates.transport) dbUpdates.transport_details = updates.transport;
        
        return !(await supabase.from('orders').update(dbUpdates).eq('id', id)).error;
    },

    // --- FILES ---
    uploadImage: async (file: File, bucket = 'products') => {
        if (!isLiveData) return URL.createObjectURL(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    },
    uploadDocument: async (file: File) => db.uploadImage(file, 'documents'),
    uploadVideo: async (file: File) => db.uploadImage(file, 'videos'),

    // --- MISC ---
    getTransactions: async (userId?: string) => {
        if (!isLiveData) return [];
        let q = supabase.from('transactions').select('*').order('date', { ascending: false });
        if (userId) q = q.eq('user_id', userId);
        const { data } = await q;
        return (data || []).map(t => ({
            id: t.id,
            userId: t.user_id,
            date: t.date,
            type: t.type,
            amount: t.amount,
            description: t.description,
            referenceId: t.reference_id,
            createdBy: t.created_by
        }));
    },

    recordTransaction: async (tx: Transaction) => {
        if (!isLiveData) return true;
        return !(await supabase.from('transactions').insert({
            user_id: tx.userId,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            reference_id: tx.referenceId,
            date: tx.date,
            created_by: tx.createdBy
        })).error;
    },

    getVisitLogs: async (agentId?: string) => {
        if (!isLiveData) return [];
        let q = supabase.from('visit_logs').select('*');
        if (agentId) q = q.eq('agent_id', agentId);
        const { data } = await q;
        return (data || []).map(v => ({
            id: v.id,
            agentId: v.agent_id,
            agentName: v.agent_name,
            clientId: v.client_id,
            clientName: v.client_name,
            date: v.date,
            purpose: v.purpose,
            notes: v.notes,
            location: v.location,
            amountCollected: v.amount_collected
        }));
    },

    logVisit: async (log: VisitLog) => {
        if (!isLiveData) return true;
        return !(await supabase.from('visit_logs').insert({
            agent_id: log.agentId,
            agent_name: log.agentName,
            client_id: log.clientId,
            client_name: log.clientName,
            date: log.date,
            purpose: log.purpose,
            notes: log.notes,
            location: log.location,
            amount_collected: log.amountCollected
        })).error;
    },

    getTickets: async (userId?: string) => {
        if (!isLiveData) return [];
        let q = supabase.from('support_tickets').select('*');
        if (userId) q = q.eq('user_id', userId);
        const { data } = await q;
        return (data || []).map(t => ({
            id: t.id,
            userId: t.user_id,
            userName: t.user_name,
            orderId: t.order_id,
            subject: t.subject,
            category: t.category,
            status: t.status,
            priority: t.priority,
            messages: t.messages || [],
            createdAt: t.created_at,
            updatedAt: t.updated_at
        }));
    },

    createTicket: async (ticket: SupportTicket) => {
        if (!isLiveData) return true;
        return !(await supabase.from('support_tickets').insert({
            user_id: ticket.userId,
            user_name: ticket.userName,
            subject: ticket.subject,
            category: ticket.category,
            status: ticket.status,
            priority: ticket.priority,
            messages: ticket.messages,
            order_id: ticket.orderId
        })).error;
    },

    updateTicket: async (id: string, updates: Partial<SupportTicket>) => {
        if (!isLiveData) return true;
        return !(await supabase.from('support_tickets').update(updates).eq('id', id)).error;
    },

    addTicketMessage: async (ticketId: string, message: TicketMessage) => {
        if (!isLiveData) return true;
        const { data } = await supabase.from('support_tickets').select('messages').eq('id', ticketId).single();
        if(!data) return false;
        const messages = [...(data.messages as any[]), message];
        return !(await supabase.from('support_tickets').update({ messages, updated_at: new Date().toISOString() }).eq('id', ticketId)).error;
    },

    getStockLogs: async () => {
        if (!isLiveData) return [];
        const { data } = await supabase.from('stock_logs').select('*').order('date', { ascending: false });
        return (data || []).map(l => ({
            id: l.id,
            productId: l.product_id,
            variantId: l.variant_id,
            productName: l.product_name,
            variantDesc: l.variant_desc,
            quantity: l.quantity,
            type: l.type,
            reason: l.reason,
            date: l.date,
            performedBy: l.performed_by
        }));
    },

    logStockMovement: async (log: StockLog) => {
        if (!isLiveData) return true;
        return !(await supabase.from('stock_logs').insert({
            product_id: log.productId,
            variant_id: log.variantId,
            product_name: log.productName,
            variant_desc: log.variantDesc,
            quantity: log.quantity,
            type: log.type,
            reason: log.reason,
            date: log.date,
            performed_by: log.performedBy
        })).error;
    },

    getReviews: async (productId: string) => {
        if (!isLiveData) return [];
        const { data } = await supabase.from('reviews').select('*').eq('product_id', productId);
        return (data || []).map(r => ({
            id: r.id,
            productId: r.product_id,
            userId: r.user_id,
            userName: r.user_name,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at
        }));
    },

    addReview: async (review: Omit<Review, 'id' | 'createdAt'>) => {
        if (!isLiveData) return true;
        return !(await supabase.from('reviews').insert({
            product_id: review.productId,
            user_id: review.userId,
            user_name: review.userName,
            rating: review.rating,
            comment: review.comment
        })).error;
    },

    getAdminDashboardData: async () => {
        if (!isLiveData) {
            return {
                userCount: MOCK_USERS.length,
                orderCount: MOCK_ORDERS.length,
                pendingApprovals: 0,
                recentOrders: MOCK_ORDERS
            };
        }
        const [users, orders, pendingOrders, recent] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
            db.getAllOrders()
        ]);
        return {
            userCount: users.count || 0,
            orderCount: orders.count || 0,
            pendingApprovals: pendingOrders.count || 0,
            recentOrders: recent.slice(0, 5)
        };
    },

    getVisitRequests: async () => {
        if (!isLiveData) return [];
        const { data } = await supabase.from('visit_requests').select('*');
        return (data || []).map(v => ({
            id: v.id,
            userId: v.user_id,
            userName: v.user_name,
            type: v.type,
            requestedDate: v.requested_date,
            requestedTime: v.requested_time,
            notes: v.notes,
            status: v.status
        }));
    },

    createVisitRequest: async (req: Partial<VisitRequest>) => {
        if (!isLiveData) return true;
        return !(await supabase.from('visit_requests').insert({
            user_id: req.userId,
            user_name: req.userName,
            type: req.type,
            requested_date: req.requestedDate,
            requested_time: req.requestedTime,
            notes: req.notes
        })).error;
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>) => {
        if (!isLiveData) return true;
        return !(await supabase.from('visit_requests').update(updates).eq('id', id)).error;
    },

    getCreditRequests: async () => {
        if (!isLiveData) return [];
        const { data } = await supabase.from('credit_requests').select('*');
        return (data || []).map(c => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name,
            currentLimit: c.current_limit,
            requestedLimit: c.requested_limit,
            reason: c.reason,
            status: c.status,
            date: c.created_at
        }));
    },

    processCreditRequest: async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!isLiveData) return true;
        return !(await supabase.rpc('process_credit_request', { p_request_id: id, p_status: status })).error;
    },

    triggerSecurityLockout: async (userId: string, reason: string) => {
        if (!isLiveData) return;
        await supabase.from('profiles').update({ is_approved: false, admin_notes: `LOCKED: ${reason}` }).eq('id', userId);
    }
};
