
import { supabase } from './supabaseClient';
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

export const runAiWithRetry = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0) {
            // Check for transient errors or rate limits (429)
            if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("503")) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return runAiWithRetry(fn, retries - 1, delay * 2);
            }
        }
        throw error;
    }
};

// --- LIVE DATABASE SERVICE ---

export const db = {
    // PRODUCTS
    getProducts: async (): Promise<Product[]> => {
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            console.error("DB Error getProducts:", error);
            return [];
        }
        return (data as Product[]) || [];
    },

    saveProduct: async (product: Partial<Product>): Promise<boolean> => {
        const prodToSave = { ...product };
        if (!prodToSave.id) prodToSave.id = `p-${Date.now()}`;
        
        const { error } = await supabase.from('products').upsert(prodToSave);
        if (error) {
            console.error("DB Error saveProduct:", error);
            return false;
        }
        return true;
    },

    deleteProduct: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        return !error;
    },

    // MEDIA (Storage Buckets)
    uploadImage: async (file: File, bucket = 'products'): Promise<string> => {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    },

    uploadVideo: async (blob: Blob): Promise<string> => {
        const fileName = `video-${Date.now()}.mp4`;
        const { error } = await supabase.storage.from('videos').upload(fileName, blob);
        if (error) throw error;
        
        const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
        return data.publicUrl;
    },

    uploadDocument: async (file: File): Promise<string> => {
        return db.uploadImage(file, 'documents');
    },

    // USERS & AUTH
    getUsers: async (): Promise<User[]> => {
        // Fetches from public.users table
        const { data, error } = await supabase.from('users').select('*');
        if (error) console.error("DB Error getUsers:", error);
        return (data as User[]) || [];
    },

    getUserById: async (id: string): Promise<User | null> => {
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) return null;
        return data as User;
    },

    signIn: async (email: string, password: string): Promise<{ user?: User, error?: string }> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) return { error: error.message };
        
        if (data.user) {
            // Fetch public profile
            const profile = await db.getUserById(data.user.id);
            if (profile) return { user: profile };
            
            // Fallback if profile missing (e.g., deleted manually but auth remains)
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
        return { error: 'Authentication failed' };
    },

    signOut: async () => {
        await supabase.auth.signOut();
    },

    registerUser: async (user: User, password?: string): Promise<{ success: boolean; error?: string; data?: User }> => {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
            email: user.email, 
            password: password || 'tempPass123',
            options: {
                data: {
                    full_name: user.fullName,
                    role: user.role
                }
            }
        });

        if (authError) return { success: false, error: authError.message };
        
        // 2. Create/Update Public Profile
        if (authData.user) {
            const newUser = { ...user, id: authData.user.id };
            
            const { error: profileError } = await supabase.from('users').upsert({
                id: authData.user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                mobile: user.mobile,
                gstin: user.gstin,
                "aadharNumber": user.aadharNumber,
                "businessName": user.businessName,
                isApproved: user.isApproved || false,
                creditLimit: 0,
                outstandingDues: 0
            });

            if (profileError) {
                console.error("Profile creation error:", profileError.message);
                // Even if profile insert fails (e.g. slight timing issue), Auth succeeded.
                // The user can likely login, but might miss profile data until they update it.
            }

            return { success: true, data: newUser };
        }
        return { success: false, error: "Registration failed unknown" };
    },

    updateUser: async (user: User): Promise<boolean> => {
        const { error } = await supabase.from('users').update(user).eq('id', user.id);
        return !error;
    },

    updatePassword: async (password: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    resetPasswordForEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#/update-password'
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    triggerSecurityLockout: async (userId: string, userName: string, reason: string) => {
        console.warn(`SECURITY LOCKOUT: ${userName} (${userId}) - ${reason}`);
        await supabase.from('users').update({ isApproved: false, adminNotes: `LOCKED: ${reason}` }).eq('id', userId);
    },

    // ORDERS
    createOrder: async (order: any): Promise<boolean> => {
        const ord = { ...order };
        if (!ord.id) ord.id = `ord-${Date.now()}`;
        const { error } = await supabase.from('orders').insert(ord);
        if (error) console.error("Create order error:", error);
        return !error;
    },

    getAllOrders: async (): Promise<Order[]> => {
        const { data, error } = await supabase.from('orders').select('*');
        if (error) return [];
        return (data as Order[]) || [];
    },

    getOrdersByUser: async (userId: string): Promise<Order[]> => {
        const { data, error } = await supabase.from('orders').select('*').eq('userId', userId);
        if (error) return [];
        return (data as Order[]) || [];
    },

    updateOrder: async (id: string, updates: Partial<Order>): Promise<boolean> => {
        const { error } = await supabase.from('orders').update(updates).eq('id', id);
        return !error;
    },

    // FINANCE
    getTransactions: async (userId?: string): Promise<Transaction[]> => {
        let query = supabase.from('transactions').select('*');
        if (userId) query = query.eq('userId', userId);
        const { data } = await query;
        return (data as Transaction[]) || [];
    },

    recordTransaction: async (tx: Transaction): Promise<boolean> => {
        const { error } = await supabase.from('transactions').insert(tx);
        if (error) return false;
        
        // Update user balance (outstanding dues)
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
    },

    getCreditRequests: async (): Promise<CreditRequest[]> => {
        const { data } = await supabase.from('credit_requests').select('*');
        return (data as CreditRequest[]) || []; 
    },

    processCreditRequest: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
        // Assuming there is a table for this, or update user directly
        const { error } = await supabase.from('credit_requests').update({ status }).eq('id', id);
        if (!error && status === 'APPROVED') {
             // Logic to update user credit limit would go here if linking directly
        }
        return !error;
    },

    // VISITS
    logVisit: async (log: VisitLog): Promise<boolean> => {
        const { error } = await supabase.from('visit_logs').insert(log);
        return !error;
    },

    getVisitLogs: async (agentId?: string): Promise<VisitLog[]> => {
        let query = supabase.from('visit_logs').select('*');
        if (agentId) query = query.eq('agentId', agentId);
        const { data } = await query;
        return (data as VisitLog[]) || [];
    },

    createVisitRequest: async (req: Partial<VisitRequest>): Promise<boolean> => {
        const newReq = { ...req, id: `vr-${Date.now()}`, status: 'PENDING' };
        const { error } = await supabase.from('visit_requests').insert(newReq);
        return !error;
    },

    getVisitRequests: async (): Promise<VisitRequest[]> => {
        const { data } = await supabase.from('visit_requests').select('*');
        return (data as VisitRequest[]) || [];
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>): Promise<boolean> => {
        const { error } = await supabase.from('visit_requests').update(updates).eq('id', id);
        return !error;
    },

    // SUPPORT
    getTickets: async (userId?: string): Promise<SupportTicket[]> => {
        let query = supabase.from('tickets').select('*');
        if (userId) query = query.eq('userId', userId);
        const { data } = await query;
        return (data as SupportTicket[]) || [];
    },

    createTicket: async (ticket: SupportTicket): Promise<boolean> => {
        const { error } = await supabase.from('tickets').insert(ticket);
        return !error;
    },

    updateTicket: async (id: string, updates: Partial<SupportTicket>): Promise<boolean> => {
        const { error } = await supabase.from('tickets').update(updates).eq('id', id);
        return !error;
    },

    addTicketMessage: async (ticketId: string, message: TicketMessage): Promise<boolean> => {
        const { data } = await supabase.from('tickets').select('messages').eq('id', ticketId).single();
        if (data) {
            const newMessages = [...(data.messages || []), message];
            const { error } = await supabase.from('tickets').update({ 
                messages: newMessages, 
                updatedAt: new Date().toISOString() 
            }).eq('id', ticketId);
            return !error;
        }
        return false;
    },

    // REVIEWS
    getReviews: async (productId: string): Promise<Review[]> => {
        const { data } = await supabase.from('reviews').select('*').eq('productId', productId);
        return (data as Review[]) || [];
    },

    addReview: async (review: Partial<Review>): Promise<boolean> => {
        const newRev = { ...review, id: `r-${Date.now()}`, createdAt: new Date().toISOString() };
        const { error } = await supabase.from('reviews').insert(newRev);
        return !error;
    },

    // INVENTORY LOGS
    logStockMovement: async (log: StockLog): Promise<boolean> => {
        const { error } = await supabase.from('stock_logs').insert(log);
        return !error; 
    },

    getStockLogs: async (): Promise<StockLog[]> => {
        const { data } = await supabase.from('stock_logs').select('*');
        return (data as StockLog[]) || [];
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
