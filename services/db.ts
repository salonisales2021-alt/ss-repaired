
import { supabase } from './supabaseClient';
import { 
    MOCK_USERS, 
    MOCK_PRODUCTS, 
    MOCK_ORDERS, 
    MOCK_TRANSACTIONS, 
    MOCK_VISIT_LOGS, 
    MOCK_STOCK_LOGS, 
    MOCK_VISIT_REQUESTS, 
    MOCK_NOTIFICATIONS, 
    MOCK_TICKETS, 
    MOCK_REVIEWS, 
    MOCK_CREDIT_REQUESTS 
} from './mockData';
import { 
    User, 
    Product, 
    Order, 
    Review, 
    SupportTicket, 
    TicketMessage, 
    VisitLog, 
    Transaction, 
    CreditRequest, 
    VisitRequest, 
    StockLog,
    UserRole
} from '../types';

// --- HELPERS ---

export const handleAiError = async (error: any): Promise<boolean> => {
    console.error("AI Error:", error);
    if (error.message?.includes("429") || error.message?.includes("quota")) {
        // alert("AI Service Busy. Please try again.");
        return true; // Handled
    }
    return false; // Not handled
};

export const parseAIJson = <T = any>(text: string | undefined, fallback: T): T => {
    if (!text) return fallback;
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return fallback;
    }
};

export const runAiWithRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes("503") || error.message?.includes("429"))) {
            await new Promise(r => setTimeout(r, 1500));
            return runAiWithRetry(fn, retries - 1);
        }
        throw error;
    }
};

// --- MOCK STORAGE (In-Memory for demo session) ---
let localUsers = [...MOCK_USERS];
let localProducts = [...MOCK_PRODUCTS];
let localOrders = [...MOCK_ORDERS];
let localTransactions = [...MOCK_TRANSACTIONS];
let localVisitLogs = [...MOCK_VISIT_LOGS];
let localStockLogs = [...MOCK_STOCK_LOGS];
let localVisitRequests = [...MOCK_VISIT_REQUESTS];
let localTickets = [...MOCK_TICKETS];
let localReviews = [...MOCK_REVIEWS];
let localCreditRequests = [...MOCK_CREDIT_REQUESTS];

// --- DATABASE SERVICE ---

export const db = {
    // PRODUCTS
    getProducts: async (): Promise<Product[]> => {
        if (supabase) {
            const { data, error } = await supabase.from('products').select('*');
            if (!error && data) return data;
        }
        return localProducts;
    },

    saveProduct: async (product: Partial<Product>): Promise<boolean> => {
        if (supabase) {
            // Implementation for Supabase upsert
            const { error } = await supabase.from('products').upsert(product);
            return !error;
        }
        if (product.id) {
            const idx = localProducts.findIndex(p => p.id === product.id);
            if (idx >= 0) {
                localProducts[idx] = { ...localProducts[idx], ...product } as Product;
            } else {
                localProducts.push(product as Product);
            }
        } else {
            const newProduct = { ...product, id: `p-${Date.now()}` } as Product;
            localProducts.push(newProduct);
        }
        return true;
    },

    deleteProduct: async (id: string): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            return !error;
        }
        localProducts = localProducts.filter(p => p.id !== id);
        return true;
    },

    // MEDIA (Mock uploads)
    uploadImage: async (file: File, bucket = 'products'): Promise<string> => {
        // In a real app, upload to Supabase Storage
        return URL.createObjectURL(file); 
    },

    uploadVideo: async (blob: Blob): Promise<string> => {
        return URL.createObjectURL(blob);
    },

    uploadDocument: async (file: File): Promise<string> => {
        return URL.createObjectURL(file);
    },

    // USERS & AUTH
    getUsers: async (): Promise<User[]> => {
        if (supabase) {
            const { data } = await supabase.from('users').select('*');
            return data || [];
        }
        return localUsers;
    },

    getUserById: async (id: string): Promise<User | null> => {
        if (supabase) {
            const { data } = await supabase.from('users').select('*').eq('id', id).single();
            return data;
        }
        return localUsers.find(u => u.id === id) || null;
    },

    signIn: async (email: string, password: string): Promise<{ user?: User, error?: string }> => {
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            if (data.user) {
                const profile = await db.getUserById(data.user.id);
                return { user: profile || undefined };
            }
        }
        // Mock Auth
        const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            // Simplified password check (accept any password for mock users or specific one)
            return { user };
        }
        return { error: 'User not found' };
    },

    signOut: async () => {
        if (supabase) await supabase.auth.signOut();
    },

    registerUser: async (user: User, password?: string): Promise<{ success: boolean; error?: string; data?: User }> => {
        if (supabase) {
            // 1. Sign up auth
            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: user.email, 
                password: password || 'tempPass123' 
            });
            if (authError) return { success: false, error: authError.message };
            
            // 2. Create profile
            if (authData.user) {
                const newUser = { ...user, id: authData.user.id };
                const { error: dbError } = await supabase.from('users').insert(newUser);
                if (dbError) return { success: false, error: dbError.message };
                return { success: true, data: newUser };
            }
        }
        
        const newUser = { ...user, id: `u-${Date.now()}` };
        localUsers.push(newUser);
        return { success: true, data: newUser };
    },

    updateUser: async (user: User): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('users').update(user).eq('id', user.id);
            return !error;
        }
        const idx = localUsers.findIndex(u => u.id === user.id);
        if (idx >= 0) localUsers[idx] = user;
        return true;
    },

    updatePassword: async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (supabase) {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) return { success: false, error: error.message };
        }
        return { success: true };
    },

    resetPasswordForEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (supabase) {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) return { success: false, error: error.message };
        }
        return { success: true };
    },

    triggerSecurityLockout: async (userId: string, userName: string, reason: string) => {
        console.warn(`SECURITY LOCKOUT: ${userName} (${userId}) - ${reason}`);
        // Logic to lock user account
        if (supabase) {
            await supabase.from('users').update({ isApproved: false, adminNotes: `LOCKED: ${reason}` }).eq('id', userId);
        } else {
            const u = localUsers.find(user => user.id === userId);
            if (u) {
                u.isApproved = false;
                u.adminNotes = `LOCKED: ${reason}`;
            }
        }
    },

    // ORDERS
    createOrder: async (order: any): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('orders').insert(order);
            return !error;
        }
        localOrders.unshift({ ...order, id: `ord-${Date.now()}` });
        return true;
    },

    getAllOrders: async (): Promise<Order[]> => {
        if (supabase) {
            const { data } = await supabase.from('orders').select('*');
            return data || [];
        }
        return localOrders;
    },

    getOrdersByUser: async (userId: string): Promise<Order[]> => {
        if (supabase) {
            const { data } = await supabase.from('orders').select('*').eq('userId', userId);
            return data || [];
        }
        return localOrders.filter(o => o.userId === userId);
    },

    updateOrder: async (id: string, updates: Partial<Order>): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('orders').update(updates).eq('id', id);
            return !error;
        }
        const idx = localOrders.findIndex(o => o.id === id);
        if (idx >= 0) localOrders[idx] = { ...localOrders[idx], ...updates };
        return true;
    },

    // FINANCE
    getTransactions: async (userId?: string): Promise<Transaction[]> => {
        if (supabase) {
            let query = supabase.from('transactions').select('*');
            if (userId) query = query.eq('userId', userId);
            const { data } = await query;
            return data || [];
        }
        return userId ? localTransactions.filter(t => t.userId === userId) : localTransactions;
    },

    recordTransaction: async (tx: Transaction): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('transactions').insert(tx);
            return !error;
        }
        localTransactions.unshift(tx);
        // Update user outstanding
        const user = localUsers.find(u => u.id === tx.userId);
        if (user) {
            if (tx.type === 'PAYMENT' || tx.type === 'CREDIT_NOTE') {
                user.outstandingDues = (user.outstandingDues || 0) - tx.amount;
            } else {
                user.outstandingDues = (user.outstandingDues || 0) + tx.amount;
            }
        }
        return true;
    },

    getCreditRequests: async (): Promise<CreditRequest[]> => {
        if (supabase) {
            const { data } = await supabase.from('credit_requests').select('*');
            return data || [];
        }
        return localCreditRequests;
    },

    processCreditRequest: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('credit_requests').update({ status }).eq('id', id);
            return !error;
        }
        const req = localCreditRequests.find(r => r.id === id);
        if (req) {
            req.status = status;
            if (status === 'APPROVED') {
                const user = localUsers.find(u => u.id === req.userId);
                if (user) user.creditLimit = req.requestedLimit;
            }
        }
        return true;
    },

    // VISITS
    logVisit: async (log: VisitLog): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('visit_logs').insert(log);
            return !error;
        }
        localVisitLogs.unshift(log);
        return true;
    },

    getVisitLogs: async (agentId?: string): Promise<VisitLog[]> => {
        if (supabase) {
            let query = supabase.from('visit_logs').select('*');
            if (agentId) query = query.eq('agentId', agentId);
            const { data } = await query;
            return data || [];
        }
        return agentId ? localVisitLogs.filter(l => l.agentId === agentId) : localVisitLogs;
    },

    createVisitRequest: async (req: Partial<VisitRequest>): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('visit_requests').insert(req);
            return !error;
        }
        localVisitRequests.push({ ...req, id: `vr-${Date.now()}`, status: 'PENDING' } as VisitRequest);
        return true;
    },

    getVisitRequests: async (): Promise<VisitRequest[]> => {
        if (supabase) {
            const { data } = await supabase.from('visit_requests').select('*');
            return data || [];
        }
        return localVisitRequests;
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('visit_requests').update(updates).eq('id', id);
            return !error;
        }
        const idx = localVisitRequests.findIndex(v => v.id === id);
        if (idx >= 0) localVisitRequests[idx] = { ...localVisitRequests[idx], ...updates };
        return true;
    },

    // SUPPORT
    getTickets: async (userId?: string): Promise<SupportTicket[]> => {
        if (supabase) {
            let query = supabase.from('tickets').select('*');
            if (userId) query = query.eq('userId', userId);
            const { data } = await query;
            return data || [];
        }
        return userId ? localTickets.filter(t => t.userId === userId) : localTickets;
    },

    createTicket: async (ticket: SupportTicket): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('tickets').insert(ticket);
            return !error;
        }
        localTickets.unshift(ticket);
        return true;
    },

    updateTicket: async (id: string, updates: Partial<SupportTicket>): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('tickets').update(updates).eq('id', id);
            return !error;
        }
        const idx = localTickets.findIndex(t => t.id === id);
        if (idx >= 0) localTickets[idx] = { ...localTickets[idx], ...updates };
        return true;
    },

    addTicketMessage: async (ticketId: string, message: TicketMessage): Promise<boolean> => {
        // This usually requires fetching ticket, appending msg, and updating.
        // For Supabase, ideally we have a 'ticket_messages' table, but here we simulated array in jsonb
        // Simplified for mock:
        const ticket = localTickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.messages.push(message);
            ticket.updatedAt = new Date().toISOString();
            if (message.senderId === 'SUPPORT' || message.senderId === 'ADMIN') {
                ticket.status = 'IN_PROGRESS';
            }
            if (supabase) {
                await supabase.from('tickets').update({ messages: ticket.messages, updatedAt: ticket.updatedAt, status: ticket.status }).eq('id', ticketId);
            }
            return true;
        }
        return false;
    },

    // REVIEWS
    getReviews: async (productId: string): Promise<Review[]> => {
        if (supabase) {
            const { data } = await supabase.from('reviews').select('*').eq('productId', productId);
            return data || [];
        }
        return localReviews.filter(r => r.productId === productId);
    },

    addReview: async (review: Partial<Review>): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('reviews').insert(review);
            return !error;
        }
        localReviews.unshift({ ...review, id: `r-${Date.now()}`, createdAt: new Date().toISOString() } as Review);
        return true;
    },

    // INVENTORY LOGS
    logStockMovement: async (log: StockLog): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('stock_logs').insert(log);
            return !error;
        }
        localStockLogs.unshift({ ...log, id: `sl-${Date.now()}`, date: new Date().toISOString() });
        return true;
    },

    getStockLogs: async (): Promise<StockLog[]> => {
        if (supabase) {
            const { data } = await supabase.from('stock_logs').select('*');
            return data || [];
        }
        return localStockLogs;
    },

    // ADMIN DASHBOARD
    getAdminDashboardData: async () => {
        const orders = await db.getAllOrders();
        const users = await db.getUsers();
        
        return {
            orderCount: orders.length,
            userCount: users.length,
            pendingApprovals: users.filter(u => !u.isApproved).length,
            recentOrders: orders.slice(0, 10)
        };
    }
};
