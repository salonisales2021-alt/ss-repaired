
import { supabase } from './supabaseClient';
import { 
    Product, User, Order, Transaction, VisitLog, CreditRequest, 
    SupportTicket, TicketMessage, UserRole, PaymentCategory, 
    VisitRequest, StockLog, Review 
} from '../types';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_TRANSACTIONS, MOCK_VISIT_LOGS, MOCK_STOCK_LOGS, MOCK_VISIT_REQUESTS, MOCK_TICKETS, MOCK_CREDIT_REQUESTS, MOCK_REVIEWS } from './mockData';

/**
 * UTILITIES
 */
// Security: Use CSPRNG for IDs instead of Math.random/Date.now
const generateId = (prefix: string): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID().split('-')[0]}`;
    }
    // Fallback for older environments
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * AI Helper: Safely parse JSON from LLM response, handling Markdown code blocks.
 */
export const parseAIJson = <T = any>(text: string | undefined, fallback: T): T => {
    if (!text) return fallback;
    try {
        // Remove markdown code blocks (e.g. ```json ... ```)
        const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.error("AI JSON Parse Error:", e);
        return fallback;
    }
};

/**
 * AI Error Handler & Retry Logic
 */
export const handleAiError = async (error: any) => {
    console.error("AI Operation Error:", error);
    const msg = error?.message || (typeof error === 'string' ? error : "");
    
    if (
        msg.includes("Requested entity was not found") || 
        msg.includes("403") || 
        msg.includes("API key not found") || 
        msg.includes("Network error") ||
        msg.includes("fetch")
    ) {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            return true;
        }
    }
    return false;
};

/**
 * Executes an AI operation with exponential backoff retries for 500/503 errors.
 */
export const runAiWithRetry = async <T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 2000
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        const msg = error?.message || '';
        // Retry on 503 (Overloaded), 500 (Internal), or specific text errors
        const shouldRetry = 
            msg.includes('503') || 
            msg.includes('500') || 
            msg.includes('Overloaded') ||
            msg.includes('Internal error') ||
            msg.includes('deadline exceeded') ||
            error.status === 503 ||
            error.status === 500;

        if (shouldRetry && retries > 0) {
            console.warn(`AI Op Failed (${msg}). Retrying in ${delay}ms... (${retries} left)`);
            await new Promise(res => setTimeout(res, delay));
            return runAiWithRetry(operation, retries - 1, delay * 2); // Exponential backoff
        }
        throw error;
    }
};

// Helper: Sync customer balances in Supabase
const syncUserBalance = async (userId: string, delta: number) => {
    if (!supabase) return;
    try {
        const { data: profile } = await supabase.from('profiles').select('outstanding_dues').eq('id', userId).maybeSingle();
        if (profile) {
            const currentDues = Number(profile.outstanding_dues || 0);
            await supabase.from('profiles').update({ 
                outstanding_dues: currentDues + delta 
            }).eq('id', userId);
        }
    } catch (err) {
        console.error("Balance sync failed:", err);
    }
};

export const db = {
    /**
     * AUTHENTICATION
     */
    signIn: async (identifier: string, password: string): Promise<{ user: User | null, error: string | null }> => {
        const inputLower = identifier.toLowerCase().trim();
        const pwd = password;

        // 1. Try Live Supabase first
        if (supabase) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email: inputLower, password: pwd });
                if (!error && data?.user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
                    // Merge email from auth.user into the profile object
                    if (profile) return { user: db.mapProfileToUser({ ...profile, email: data.user.email }), error: null };
                }
                
                // If Supabase is configured but auth fails, DO NOT fall back to mock unless it's a specific "admin" override
                if (error && inputLower !== 'admin' && inputLower !== 'admin@saloni.com') {
                    return { user: null, error: error.message };
                }
            } catch (err) {
                console.warn("Supabase auth error, checking fallback...");
            }
        }

        // 2. Mock Data / Ghost Admin Logic
        // Always check mock/ghost admin if no user returned from Supabase
        
        // Check existing mock users
        const found = MOCK_USERS.find(u => {
            const emailMatch = u.email && u.email.toLowerCase() === inputLower;
            const adminAliasMatch = (inputLower === 'admin' || inputLower === 'sarthak') && 
                                   (u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN);
            const dispatchAliasMatch = (inputLower === 'dispatch') && (u.role === UserRole.DISPATCH);
            
            return !!(emailMatch || adminAliasMatch || dispatchAliasMatch);
        });

        if (found && (pwd === 'password123' || pwd === 'B@bananak123')) {
            return { user: found, error: null };
        }

        // GHOST ADMIN FALLBACK
        if ((inputLower === 'admin' || inputLower === 'admin@saloni.com') && pwd === 'password123') {
            const ghostAdmin: User = {
                id: 'ghost-admin',
                email: 'admin@saloni.com',
                fullName: 'System Administrator',
                role: UserRole.SUPER_ADMIN,
                businessName: 'Saloni HQ',
                isApproved: true,
                isPreBookApproved: true,
                creditLimit: 9999999,
                outstandingDues: 0
            };
            if (!MOCK_USERS.some(u => u.id === 'ghost-admin')) {
                MOCK_USERS.push(ghostAdmin);
            }
            return { user: ghostAdmin, error: null };
        }

        return { user: null, error: "Invalid credentials." };
    },

    signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        localStorage.removeItem('SALONI_GST_API_KEY');
        localStorage.removeItem('SALONI_GST_API_URL');
    },

    mapProfileToUser: (p: any): User => ({
        id: p?.id || '',
        email: p?.email || '',
        fullName: p?.full_name || '',
        businessName: p?.company_name || '',
        role: (p?.role as UserRole) || UserRole.RETAILER,
        gstin: p?.gst_number || '',
        mobile: p?.mobile || '',
        aadharNumber: p?.aadhar_number || '',
        isApproved: !!p?.approved,
        isPreBookApproved: !!p?.is_pre_book_approved,
        creditLimit: Number(p?.credit_limit || 0),
        outstandingDues: Number(p?.outstanding_dues || 0),
        wishlist: p?.wishlist || [],
        assignedAgentId: p?.assigned_agent_id || '',
        gaddiId: p?.gaddi_id || '',
        tier: p?.tier || 'STANDARD',
        adminNotes: p?.admin_notes || ''
    }),

    /**
     * SECURITY BREACH LOCKOUT
     */
    triggerSecurityLockout: async (userId: string, userName: string, reason: string): Promise<void> => {
        const ticketId = `SECURITY-${Date.now()}`;
        const breachMsg = `SECURITY VIOLATION DETECTED: ${reason}. System has automatically revoked access for ${userName}. Awaiting Super Admin review.`;

        if (!supabase) {
            const u = MOCK_USERS.find(x => x.id === userId);
            if (u) {
                u.isApproved = false; // Lock account
                MOCK_TICKETS.unshift({
                    id: ticketId,
                    userId: userId,
                    userName: userName,
                    subject: 'SECURITY BREACH: Account Locked',
                    category: 'SECURITY_BREACH',
                    status: 'OPEN',
                    priority: 'HIGH',
                    messages: [{ id: 'm1', senderId: 'SYSTEM', senderName: 'Security Bot', message: breachMsg, timestamp: new Date().toISOString() }],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            return;
        }

        // Real DB Lockout
        await supabase.from('profiles').update({ approved: false }).eq('id', userId);
        
        await supabase.from('support_tickets').insert({
            user_id: userId,
            user_name: userName,
            subject: 'SECURITY BREACH: Account Locked',
            category: 'SECURITY_BREACH',
            status: 'OPEN',
            priority: 'HIGH',
            messages: [{ id: `m-${Date.now()}`, senderId: 'SYSTEM', senderName: 'Security Bot', message: breachMsg, timestamp: new Date().toISOString() }]
        });
    },

    /**
     * PRODUCTS
     */
    getProducts: async (): Promise<Product[]> => {
        if (!supabase) return MOCK_PRODUCTS;
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error || !data) return MOCK_PRODUCTS;
        return (data || []).map((p: any) => ({
            id: p.id, sku: p.sku, name: p.name, description: p.description,
            category: p.category, fabric: p.fabric, basePrice: Number(p.base_price),
            images: p.images || [], video: p.video, variants: p.variants || [],
            isAvailable: p.active, collection: p.collection
        }));
    },

    saveProduct: async (product: Partial<Product>): Promise<Product | null> => {
        if (!supabase) {
            // MOCK MODE: Update or Insert into MOCK_PRODUCTS
            const existingIndex = MOCK_PRODUCTS.findIndex(p => p.id === product.id);
            if (existingIndex > -1) {
                MOCK_PRODUCTS[existingIndex] = { ...MOCK_PRODUCTS[existingIndex], ...product } as Product;
                return MOCK_PRODUCTS[existingIndex];
            } else {
                const newProduct = { ...product, id: product.id || generateId('p') } as Product;
                MOCK_PRODUCTS.unshift(newProduct);
                return newProduct;
            }
        }
        
        const dbPayload: any = {
            name: product.name, sku: product.sku, description: product.description,
            category: product.category, fabric: product.fabric, base_price: product.basePrice,
            images: product.images, video: product.video, variants: product.variants,
            active: product.isAvailable, collection: product.collection
        };
        if (product.id) dbPayload.id = product.id;
        const { data, error } = await supabase.from('products').upsert(dbPayload).select().single();
        if (error) throw error;
        return { ...data, basePrice: data.base_price, isAvailable: data.active } as Product;
    },

    deleteProduct: async (productId: string): Promise<boolean> => {
        if (!supabase) {
            const idx = MOCK_PRODUCTS.findIndex(p => p.id === productId);
            if (idx > -1) {
                MOCK_PRODUCTS.splice(idx, 1);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('products').delete().eq('id', productId);
        return !error;
    },

    /**
     * USERS / PROFILES
     */
    getUsers: async (): Promise<User[]> => {
        if (!supabase) return MOCK_USERS;
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        return (data || []).map((u: any) => db.mapProfileToUser(u));
    },

    // Security: Retrieve a single user by ID. Useful for finding distributors without exposing the entire DB.
    getUserById: async (userId: string): Promise<User | null> => {
        if (!supabase) return MOCK_USERS.find(u => u.id === userId) || null;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error || !data) return null;
        return db.mapProfileToUser(data);
    },

    registerUser: async (newUser: User, password?: string): Promise<{ success: boolean; error?: string; data?: User }> => {
        if (!supabase) {
            // MOCK MODE: Append to in-memory array
            const mockUserWithId = { ...newUser, id: newUser.id || generateId('u') };
            MOCK_USERS.push(mockUserWithId);
            return { success: true, data: mockUserWithId };
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: newUser.email,
            password: password || 'password123',
            options: { 
                data: { 
                    full_name: newUser.fullName, 
                    company_name: newUser.businessName, 
                    role: newUser.role 
                } 
            }
        });
        if (authError) return { success: false, error: authError.message };
        return { success: true, data: { ...newUser, id: authData.user?.id || '' } };
    },

    updateUser: async (user: User): Promise<boolean> => {
        if (!supabase) {
            const idx = MOCK_USERS.findIndex(u => u.id === user.id);
            if (idx > -1) {
                MOCK_USERS[idx] = user;
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('profiles').update({
            full_name: user.fullName, company_name: user.businessName, role: user.role,
            approved: user.isApproved, 
            is_pre_book_approved: user.isPreBookApproved, // Update exclusive permission
            credit_limit: user.creditLimit, outstanding_dues: user.outstandingDues,
            wishlist: user.wishlist, tier: user.tier, admin_notes: user.adminNotes,
            assigned_agent_id: user.assignedAgentId, gaddi_id: user.gaddiId || null,
            mobile: user.mobile, gst_number: user.gstin
        }).eq('id', user.id);
        return !error;
    },

    // ... rest of the file (orders, logs, etc) remains the same ...
    /**
     * ORDERS
     */
    createOrder: async (order: any): Promise<boolean> => {
        if (!supabase) {
            const newOrder = {
                ...order,
                id: generateId('ord'),
                createdAt: new Date().toISOString()
            };
            MOCK_ORDERS.unshift(newOrder);
            return true;
        }
        
        const payload = {
            buyer_id: order.userId, 
            user_business_name: order.userBusinessName,
            total_amount: order.totalAmount, 
            items: order.items, 
            status: 'PENDING',
            payment_method: order.paymentDetails?.method,
            gaddi_id: order.gaddiId || null,
            gaddi_name: order.gaddiName || null,
            gaddi_amount: order.gaddiAmount || null
        };

        const { data, error } = await supabase.from('orders').insert(payload).select().single();
        
        if (!error && data?.id && order.userId && order.totalAmount) {
            const targetIdForBalance = order.gaddiId || order.userId;
            const finalPostingAmount = order.gaddiAmount || order.totalAmount;

            await syncUserBalance(targetIdForBalance, finalPostingAmount);
            await supabase.from('transactions').insert({
                user_id: targetIdForBalance, type: 'INVOICE', amount: finalPostingAmount,
                description: `Order #${data.id} for ${order.userBusinessName}`, reference_id: data.id, created_by: 'SYSTEM'
            });
            return true;
        }
        return false;
    },

    getAllOrders: async (): Promise<Order[]> => {
        if (!supabase) return MOCK_ORDERS;
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        return (data || []).map((o: any) => ({
            id: o.id, userId: o.buyer_id, userBusinessName: o.user_business_name,
            totalAmount: Number(o.total_amount), status: o.status, items: o.items || [],
            createdAt: o.created_at, paymentDetails: { method: o.payment_method },
            documents: o.documents, trackingNumber: o.tracking_number,
            gaddiId: o.gaddi_id, gaddiName: o.gaddi_name, gaddiAmount: o.gaddi_amount
        }));
    },

    getOrdersByUser: async (userId: string): Promise<Order[]> => {
        if (!supabase) return MOCK_ORDERS.filter(o => o.userId === userId);
        const { data } = await supabase.from('orders').select('*')
            .or(`buyer_id.eq.${userId},gaddi_id.eq.${userId}`)
            .order('created_at', { ascending: false });
            
        return (data || []).map((o: any) => ({
            id: o.id, userId: o.buyer_id, userBusinessName: o.user_business_name,
            totalAmount: Number(o.total_amount), status: o.status, items: o.items || [],
            createdAt: o.created_at, paymentDetails: { method: o.payment_method },
            documents: o.documents, trackingNumber: o.tracking_number,
            gaddiId: o.gaddi_id, gaddiName: o.gaddi_name, gaddiAmount: o.gaddi_amount
        }));
    },

    updateOrder: async (orderId: string, updates: Partial<Order>): Promise<boolean> => {
        if (!supabase) {
            const idx = MOCK_ORDERS.findIndex(o => o.id === orderId);
            if (idx > -1) {
                MOCK_ORDERS[idx] = { ...MOCK_ORDERS[idx], ...updates };
                return true;
            }
            return false;
        }
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.documents) dbUpdates.documents = updates.documents;
        if (updates.trackingNumber) dbUpdates.tracking_number = updates.trackingNumber;
        if (updates.poNumber) dbUpdates.po_number = updates.poNumber;
        if (updates.poImageUrl) dbUpdates.po_image_url = updates.poImageUrl;
        const { error } = await supabase.from('orders').update(dbUpdates).eq('id', orderId);
        return !error;
    },

    /**
     * INVENTORY LOGGING
     */
    logStockMovement: async (log: Omit<StockLog, 'id' | 'date'>): Promise<boolean> => {
        if (!supabase) {
            MOCK_STOCK_LOGS.unshift({ ...log, id: generateId('sl'), date: new Date().toISOString() });
            return true;
        }
        const { error } = await supabase.from('stock_logs').insert({
            product_id: log.productId,
            variant_id: log.variantId,
            product_name: log.productName,
            variant_desc: log.variantDesc,
            quantity: log.quantity,
            type: log.type,
            reason: log.reason,
            performed_by: log.performedBy
        });
        return !error;
    },

    getStockLogs: async (): Promise<StockLog[]> => {
        if (!supabase) return MOCK_STOCK_LOGS;
        const { data, error } = await supabase.from('stock_logs').select('*').order('date', { ascending: false });
        if (error) return MOCK_STOCK_LOGS;
        return (data || []).map((l: any) => ({
            id: l.id, productId: l.product_id, variantId: l.variant_id, productName: l.product_name,
            variantDesc: l.variant_desc, quantity: l.quantity, type: l.type, reason: l.reason,
            date: l.date, performedBy: l.performed_by
        }));
    },

    /**
     * REVIEWS
     */
    getReviews: async (productId: string): Promise<Review[]> => {
        if (!supabase) return MOCK_REVIEWS.filter(r => r.productId === productId);
        const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
        return (data || []).map((r: any) => ({
            id: r.id, productId: r.product_id, userId: r.user_id, userName: r.user_name,
            rating: r.rating, comment: r.comment, createdAt: r.created_at
        }));
    },

    addReview: async (review: Omit<Review, 'id' | 'createdAt'>): Promise<boolean> => {
        if (!supabase) {
            MOCK_REVIEWS.push({
                ...review,
                id: `rev-${Date.now()}`,
                createdAt: new Date().toISOString()
            });
            return true;
        }
        const { error } = await supabase.from('reviews').insert({
            product_id: review.productId,
            user_id: review.userId,
            user_name: review.userName,
            rating: review.rating,
            comment: review.comment
        });
        return !error;
    },

    /**
     * FINANCE
     */
    getTransactions: async (userId?: string): Promise<Transaction[]> => {
        if (!supabase) {
            return userId ? MOCK_TRANSACTIONS.filter(t => t.userId === userId) : MOCK_TRANSACTIONS;
        }
        let query = supabase.from('transactions').select('*').order('date', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query;
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, date: t.date, type: t.type,
            amount: Number(t.amount), description: t.description,
            referenceId: t.reference_id, createdBy: t.created_by
        }));
    },

    recordTransaction: async (tx: Transaction): Promise<boolean> => {
        if (!supabase) {
            MOCK_TRANSACTIONS.unshift(tx);
            return true;
        }
        const { error } = await supabase.from('transactions').insert({
            user_id: tx.userId, type: tx.type, amount: tx.amount,
            description: tx.description, reference_id: tx.referenceId, created_by: tx.createdBy
        });
        if (!error) {
            const delta = (tx.type === 'PAYMENT' || tx.type === 'CREDIT_NOTE') ? -tx.amount : tx.amount;
            await syncUserBalance(tx.userId, delta);
            return true;
        }
        return false;
    },

    /**
     * DASHBOARD
     */
    getAdminDashboardData: async () => {
        if (!supabase) {
            return { 
                orderCount: MOCK_ORDERS.length, 
                userCount: MOCK_USERS.length, 
                pendingApprovals: MOCK_USERS.filter(u => !u.isApproved).length, 
                recentOrders: MOCK_ORDERS.slice(0, 5).map(o => ({
                    id: o.id, userBusinessName: o.userBusinessName,
                    totalAmount: o.totalAmount, status: o.status, createdAt: o.createdAt
                }))
            };
        }
        const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: pApp } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approved', false);
        const { data: rec } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
        return {
            orderCount: oCount || 0,
            userCount: uCount || 0,
            pendingApprovals: pApp || 0,
            recentOrders: (rec || []).map((o: any) => ({
                id: o.id, userBusinessName: o.user_business_name,
                totalAmount: Number(o.total_amount), status: o.status, createdAt: o.createdAt
            }))
        };
    },

    /**
     * HELP & SUPPORT
     */
    getTickets: async (userId?: string): Promise<SupportTicket[]> => {
        if (!supabase) {
            return userId ? MOCK_TICKETS.filter(t => t.userId === userId) : MOCK_TICKETS;
        }
        let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query;
        return (data || []).map((t: any) => ({
            id: t.id, userId: t.user_id, userName: t.user_name, orderId: t.order_id,
            subject: t.subject, category: t.category, status: t.status, priority: t.priority,
            messages: t.messages, createdAt: t.created_at, updatedAt: t.updated_at
        }));
    },

    createTicket: async (ticket: SupportTicket): Promise<boolean> => {
        if (!supabase) {
            MOCK_TICKETS.unshift(ticket);
            return true;
        }
        const { error } = await supabase.from('support_tickets').insert({
            user_id: ticket.userId, user_name: ticket.userName, order_id: ticket.orderId,
            subject: ticket.subject, category: ticket.category, status: ticket.status,
            priority: ticket.priority, messages: ticket.messages
        });
        return !error;
    },

    addTicketMessage: async (ticketId: string, message: TicketMessage): Promise<boolean> => {
        if (!supabase) {
            const t = MOCK_TICKETS.find(x => x.id === ticketId);
            if (t) {
                t.messages.push(message);
                t.updatedAt = new Date().toISOString();
                return true;
            }
            return false;
        }
        const { data: ticket } = await supabase.from('support_tickets').select('messages').eq('id', ticketId).maybeSingle();
        if (!ticket) return false;
        const updatedMessages = [...(ticket.messages || []), message];
        const { error = null } = await supabase.from('support_tickets').update({ 
            messages: updatedMessages,
            updated_at: new Date().toISOString()
        }).eq('id', ticketId);
        return !error;
    },

    updateTicket: async (ticketId: string, updates: Partial<SupportTicket>): Promise<boolean> => {
        if (!supabase) {
            const t = MOCK_TICKETS.find(x => x.id === ticketId);
            if (t) {
                Object.assign(t, updates);
                t.updatedAt = new Date().toISOString();
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('support_tickets').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', ticketId);
        return !error;
    },

    /**
     * VISITS & CREDIT
     */
    getVisitLogs: async (agentId?: string): Promise<VisitLog[]> => {
        if (!supabase) return MOCK_VISIT_LOGS;
        let query = supabase.from('visit_logs').select('*').order('date', { ascending: false });
        if (agentId) query = query.eq('agent_id', agentId);
        const { data } = await query;
        return (data || []).map((l: any) => ({
            id: l.id, agentId: l.agent_id, agentName: l.agent_name, clientId: l.client_id,
            clientName: l.client_name, date: l.date, purpose: l.purpose, notes: l.notes,
            location: l.location, amountCollected: l.amount_collected, outcome: l.outcome
        }));
    },

    logVisit: async (log: VisitLog): Promise<boolean> => {
        if (!supabase) {
            MOCK_VISIT_LOGS.unshift(log);
            return true;
        }
        const { error } = await supabase.from('visit_logs').insert({
            agent_id: log.agentId, agent_name: log.agentName, client_id: log.clientId,
            client_name: log.clientName, date: log.date, purpose: log.purpose,
            notes: log.notes, location: log.location, amount_collected: log.amountCollected,
            outcome: log.outcome
        });
        return !error;
    },

    getCreditRequests: async (): Promise<CreditRequest[]> => {
        if (!supabase) return MOCK_CREDIT_REQUESTS;
        const { data } = await supabase.from('credit_requests').select('*').order('date', { ascending: false });
        return (data || []).map((r: any) => ({
            id: r.id, userId: r.user_id, userName: r.user_name, currentLimit: r.current_limit,
            requestedLimit: r.requested_limit, reason: r.reason, status: r.status,
            date: r.date
        }));
    },

    createCreditRequest: async (req: CreditRequest): Promise<boolean> => {
        if (!supabase) {
            MOCK_CREDIT_REQUESTS.unshift(req);
            return true;
        }
        const { error } = await supabase.from('credit_requests').insert({
            user_id: req.userId, user_name: req.userName, current_limit: req.currentLimit,
            requested_limit: req.requestedLimit, reason: req.reason, status: req.status,
            date: req.date
        });
        return !error;
    },

    processCreditRequest: async (requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
        if (!supabase) {
            const req = MOCK_CREDIT_REQUESTS.find(r => r.id === requestId);
            if (req) {
                req.status = status;
                if (status === 'APPROVED') {
                    const u = MOCK_USERS.find(user => user.id === req.userId);
                    if (u) u.creditLimit = req.requestedLimit;
                }
                return true;
            }
            return false;
        }
        const { data } = await supabase.from('credit_requests').select('*').eq('id', requestId).maybeSingle();
        const requestRecord = data as any;
        if (!requestRecord) return false;
        if (status === 'APPROVED') {
            await supabase.from('profiles').update({ credit_limit: requestRecord.requested_limit }).eq('id', requestRecord.user_id);
        }
        const { error } = await supabase.from('credit_requests').update({ status }).eq('id', requestId);
        return !error;
    },

    getVisitRequests: async (): Promise<VisitRequest[]> => {
        if (!supabase) return MOCK_VISIT_REQUESTS;
        const { data } = await supabase.from('visit_requests').select('*').order('requested_date', { ascending: false });
        return (data || []).map((v: any) => ({
            id: v.id, userId: v.user_id, userName: v.user_name, type: v.type,
            requestedDate: v.requested_date, requestedTime: v.requested_time, notes: v.notes,
            status: v.status
        }));
    },

    createVisitRequest: async (visit: Partial<VisitRequest>): Promise<boolean> => {
        if (!supabase) {
            MOCK_VISIT_REQUESTS.unshift({
                ...visit,
                id: generateId('vr'),
                status: 'PENDING'
            } as VisitRequest);
            return true;
        }
        const { error } = await supabase.from('visit_requests').insert({
            user_id: visit.userId,
            user_name: visit.userName,
            type: visit.type,
            requested_date: visit.requestedDate,
            requested_time: visit.requestedTime,
            notes: visit.notes,
            status: 'PENDING'
        });
        return !error;
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>): Promise<boolean> => {
        if (!supabase) {
            const v = MOCK_VISIT_REQUESTS.find(r => r.id === id);
            if (v) {
                Object.assign(v, updates);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('visit_requests').update(updates).eq('id', id);
        return !error;
    },

    /**
     * FILE UPLOADS
     */
    uploadDocument: async (file: File): Promise<string> => {
        if (!supabase) return URL.createObjectURL(file);
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const { error } = await supabase.storage.from('documents').upload(fileName, file);
        if (error) throw error;
        return supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl;
    },

    uploadImage: async (file: File, bucketName: string = 'products'): Promise<string> => {
        if (!supabase) return URL.createObjectURL(file);
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const { error } = await supabase.storage.from(bucketName).upload(fileName, file);
        if (error) throw error;
        return supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl;
    },

    uploadVideo: async (blob: Blob | File): Promise<string> => {
        if (!supabase) return URL.createObjectURL(blob);
        const fileName = `video-${Date.now()}.mp4`;
        const { error } = await supabase.storage.from('products').upload(fileName, blob);
        if (error) throw error;
        return supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
    }
};
