
import { supabase } from './supabaseClient';
import { 
    MOCK_USERS, 
    MOCK_PRODUCTS, 
    MOCK_ORDERS, 
    MOCK_TRANSACTIONS, 
    MOCK_VISIT_LOGS, 
    MOCK_STOCK_LOGS, 
    MOCK_VISIT_REQUESTS, 
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
            if (!error && data) return data as Product[];
        }
        return localProducts;
    },

    saveProduct: async (product: Partial<Product>): Promise<boolean> => {
        if (supabase) {
            const prodToSave = { ...product };
            if (!prodToSave.id) prodToSave.id = `p-${Date.now()}`; // Ensure ID for Supabase
            const { error } = await supabase.from('products').upsert(prodToSave);
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

    // MEDIA
    uploadImage: async (file: File, bucket = 'products'): Promise<string> => {
        if (supabase) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error } = await supabase.storage.from(bucket).upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
            return data.publicUrl;
        }
        return URL.createObjectURL(file); 
    },

    uploadVideo: async (blob: Blob): Promise<string> => {
        if (supabase) {
            const fileName = `video-${Date.now()}.mp4`;
            const { error } = await supabase.storage.from('videos').upload(fileName, blob);
            if (error) throw error;
            const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
            return data.publicUrl;
        }
        return URL.createObjectURL(blob);
    },

    uploadDocument: async (file: File): Promise<string> => {
        return db.uploadImage(file, 'documents');
    },

    // USERS & AUTH
    getUsers: async (): Promise<User[]> => {
        if (supabase) {
            const { data } = await supabase.from('users').select('*');
            return (data as User[]) || [];
        }
        return localUsers;
    },

    getUserById: async (id: string): Promise<User | null> => {
        if (supabase) {
            const { data } = await supabase.from('users').select('*').eq('id', id).single();
            return data as User;
        }
        return localUsers.find(u => u.id === id) || null;
    },

    signIn: async (email: string, password: string): Promise<{ user?: User, error?: string }> => {
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { error: error.message };
            if (data.user) {
                // Fetch the public profile
                const profile = await db.getUserById(data.user.id);
                // If profile exists, return it. If not (rare race condition), construct basic one
                if (profile) return { user: profile };
                
                // Fallback for immediate login after registration if webhook is slow
                return { 
                    user: {
                        id: data.user.id,
                        email: email,
                        fullName: data.user.user_metadata.full_name || 'User',
                        role: data.user.user_metadata.role || UserRole.RETAILER,
                        isApproved: false,
                        creditLimit: 0,
                        outstandingDues: 0
                    }
                };
            }
        }
        // Mock Auth
        const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            return { user };
        }
        return { error: 'User not found' };
    },

    signOut: async () => {
        if (supabase) await supabase.auth.signOut();
    },

    registerUser: async (user: User, password?: string): Promise<{ success: boolean; error?: string; data?: User }> => {
        if (supabase) {
            // 1. Sign up auth (Triggers the public.users creation via SQL Trigger)
            const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: user.email, 
                password: password || 'tempPass123',
                options: {
                    data: {
                        full_name: user.fullName,
                        company_name: user.businessName,
                        role: user.role
                    }
                }
            });
            if (authError) return { success: false, error: authError.message };
            
            // 2. Return data (The ID is needed)
            if (authData.user) {
                const newUser = { ...user, id: authData.user.id };
                // We don't manually insert into 'users' because the trigger does it.
                // However, we might want to update extra fields that the trigger missed
                await supabase.from('users').update({
                    mobile: user.mobile,
                    gstin: user.gstin,
                    "aadharNumber": user.aadharNumber,
                    "businessName": user.businessName
                }).eq('id', authData.user.id);

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
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/#/update-password'
            });
            if (error) return { success: false, error: error.message };
        }
        return { success: true };
    },

    triggerSecurityLockout: async (userId: string, userName: string, reason: string) => {
        console.warn(`SECURITY LOCKOUT: ${userName} (${userId}) - ${reason}`);
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
            const ord = { ...order };
            if (!ord.id) ord.id = `ord-${Date.now()}`;
            const { error } = await supabase.from('orders').insert(ord);
            return !error;
        }
        localOrders.unshift({ ...order, id: `ord-${Date.now()}` });
        return true;
    },

    getAllOrders: async (): Promise<Order[]> => {
        if (supabase) {
            const { data } = await supabase.from('orders').select('*');
            return (data as Order[]) || [];
        }
        return localOrders;
    },

    getOrdersByUser: async (userId: string): Promise<Order[]> => {
        if (supabase) {
            const { data } = await supabase.from('orders').select('*').eq('userId', userId);
            return (data as Order[]) || [];
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
            return (data as Transaction[]) || [];
        }
        return userId ? localTransactions.filter(t => t.userId === userId) : localTransactions;
    },

    recordTransaction: async (tx: Transaction): Promise<boolean> => {
        if (supabase) {
            const { error } = await supabase.from('transactions').insert(tx);
            if (error) return false;
            
            // Trigger or Manual Update for user balance?
            // For now, manual update from client side logic to sync immediately
            // In strict env, this should be a DB trigger
            const user = await db.getUserById(tx.userId);
            if (user) {
                let newDues = user.outstandingDues || 0;
                if (tx.type === 'PAYMENT' || tx.type === 'CREDIT_NOTE') {
                    newDues -= tx.amount;
                } else {
                    newDues += tx.amount;
                }
                await db.updateUser({ ...user, outstandingDues: newDues });
            }
            return true;
        }
        localTransactions.unshift(tx);
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
        // ... (Similar implementation for remaining methods, keeping generic structure)
        return localCreditRequests; 
    },

    processCreditRequest: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
        // ...
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
            return (data as VisitLog[]) || [];
        }
        return agentId ? localVisitLogs.filter(l => l.agentId === agentId) : localVisitLogs;
    },

    createVisitRequest: async (req: Partial<VisitRequest>): Promise<boolean> => {
        if (supabase) {
            const newReq = { ...req, id: `vr-${Date.now()}`, status: 'PENDING' };
            const { error } = await supabase.from('visit_requests').insert(newReq); // Table needs creation in schema if missing
            return !error;
        }
        localVisitRequests.push({ ...req, id: `vr-${Date.now()}`, status: 'PENDING' } as VisitRequest);
        return true;
    },

    getVisitRequests: async (): Promise<VisitRequest[]> => {
        if (supabase) {
             // Assuming table exists
             // const { data } = await supabase.from('visit_requests').select('*');
             // return data || [];
             return []; // Placeholder if table missing in basic schema
        }
        return localVisitRequests;
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>): Promise<boolean> => {
        // ...
        return true;
    },

    // SUPPORT
    getTickets: async (userId?: string): Promise<SupportTicket[]> => {
        if (supabase) {
            let query = supabase.from('tickets').select('*');
            if (userId) query = query.eq('userId', userId);
            const { data } = await query;
            return (data as SupportTicket[]) || [];
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
        if (supabase) {
            const { data } = await supabase.from('tickets').select('messages').eq('id', ticketId).single();
            if (data) {
                const newMessages = [...(data.messages || []), message];
                const { error } = await supabase.from('tickets').update({ 
                    messages: newMessages, 
                    updatedAt: new Date().toISOString() 
                }).eq('id', ticketId);
                return !error;
            }
        }
        const ticket = localTickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.messages.push(message);
            return true;
        }
        return false;
    },

    // REVIEWS
    getReviews: async (productId: string): Promise<Review[]> => {
        if (supabase) {
            const { data } = await supabase.from('reviews').select('*').eq('productId', productId);
            // Table needs to be created in schema if not exists
            return (data as Review[]) || [];
        }
        return localReviews.filter(r => r.productId === productId);
    },

    addReview: async (review: Partial<Review>): Promise<boolean> => {
        if (supabase) {
            const newRev = { ...review, id: `r-${Date.now()}`, createdAt: new Date().toISOString() };
            const { error } = await supabase.from('reviews').insert(newRev);
            return !error;
        }
        localReviews.unshift({ ...review, id: `r-${Date.now()}`, createdAt: new Date().toISOString() } as Review);
        return true;
    },

    // INVENTORY LOGS
    logStockMovement: async (log: StockLog): Promise<boolean> => {
        // ...
        return true;
    },

    getStockLogs: async (): Promise<StockLog[]> => {
        // ...
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
