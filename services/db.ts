
import { supabase, isLiveData } from './supabaseClient';
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
import { 
    MOCK_PRODUCTS, 
    MOCK_USERS, 
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

// --- HELPERS ---

export const getGeminiKey = (): string => {
    return localStorage.getItem('SALONI_GEMINI_KEY') || process.env.API_KEY || '';
};

export const handleAiError = async (error: any): Promise<boolean> => {
    console.error("AI Error:", error);
    if (error.message?.includes("429") || error.message?.includes("quota")) {
        return true; 
    }
    return false;
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
            if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("503")) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return runAiWithRetry(fn, retries - 1, delay * 2);
            }
        }
        throw error;
    }
};

// --- LOCAL STORAGE PERSISTENCE LAYER ---
// This ensures that in Demo Mode, changes (like Excel imports) persist across reloads.

const getLocal = <T>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
        return fallback;
    }
};

const setLocal = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Local Storage Save Failed", e);
    }
};

// Initialize Local State from Storage or Seed with Mock Data
let localProducts: Product[] = getLocal('saloni_data_products', [...MOCK_PRODUCTS]);
let localUsers: User[] = getLocal('saloni_data_users', [...MOCK_USERS]);
let localOrders: Order[] = getLocal('saloni_data_orders', [...MOCK_ORDERS]);
let localStockLogs: StockLog[] = getLocal('saloni_data_stocklogs', [...MOCK_STOCK_LOGS]);
// ... Initialize others as needed lazily

// --- HYBRID DATABASE SERVICE ---

export const db = {
    // PRODUCTS
    getProducts: async (): Promise<Product[]> => {
        if (!isLiveData) {
            // Refresh from local storage to ensure latest data
            localProducts = getLocal('saloni_data_products', localProducts);
            return [...localProducts];
        }
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            console.warn("DB Error (Products), falling back to local:", error.message);
            return [...localProducts];
        }
        return (data as Product[]) || [];
    },

    saveProduct: async (product: Partial<Product>): Promise<boolean> => {
        if (!isLiveData) {
            localProducts = getLocal('saloni_data_products', localProducts);
            const index = localProducts.findIndex(p => p.id === product.id);
            
            if (index !== -1) {
                // Update
                localProducts[index] = { ...localProducts[index], ...product };
            } else {
                // Create
                const newProduct = { ...product };
                if (!newProduct.id) newProduct.id = `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                localProducts.unshift(newProduct as Product);
            }
            // Persist
            setLocal('saloni_data_products', localProducts);
            return true;
        }

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
        if (!isLiveData) {
            localProducts = getLocal('saloni_data_products', localProducts);
            const index = localProducts.findIndex(p => p.id === id);
            if (index !== -1) {
                localProducts.splice(index, 1);
                setLocal('saloni_data_products', localProducts);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('products').delete().eq('id', id);
        return !error;
    },

    // MEDIA
    uploadImage: async (file: File, bucket = 'products'): Promise<string> => {
        if (!isLiveData) {
            // For demo, we create a temporary object URL. 
            // In a real scenario without backend, we'd convert to Base64 to save in LS, 
            // but for images this size it's better to stick to ObjectURL for session or Base64 for strict persistence.
            // Using Base64 for persistence if small enough, otherwise ObjectURL
            if (file.size < 500000) { // < 500kb
                 return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                 });
            }
            return URL.createObjectURL(file);
        }
        try {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error } = await supabase.storage.from(bucket).upload(fileName, file);
            if (error) throw error;
            
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
            return data.publicUrl;
        } catch (e: any) {
            console.error("Upload failed (Live):", e.message);
            return URL.createObjectURL(file);
        }
    },

    uploadVideo: async (blob: Blob): Promise<string> => {
        if (!isLiveData) return URL.createObjectURL(blob);
        try {
            const fileName = `video-${Date.now()}.mp4`;
            const { error } = await supabase.storage.from('videos').upload(fileName, blob);
            if (error) throw error;
            
            const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (e: any) {
            return URL.createObjectURL(blob);
        }
    },

    uploadDocument: async (file: File): Promise<string> => {
        return db.uploadImage(file, 'documents');
    },

    // USERS
    getUsers: async (): Promise<User[]> => {
        if (!isLiveData) {
            localUsers = getLocal('saloni_data_users', localUsers);
            return [...localUsers];
        }
        const { data, error } = await supabase.from('users').select('*');
        if (error) return [...localUsers];
        return data as User[];
    },

    getUserById: async (id: string): Promise<User | null> => {
        if (!isLiveData) {
            localUsers = getLocal('saloni_data_users', localUsers);
            return localUsers.find(u => u.id === id) || null;
        }
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error || !data) {
             // Fallback to local if not found in live (hybrid mode)
             const local = getLocal<User[]>('saloni_data_users', []);
             return local.find(u => u.id === id) || null;
        }
        return data as User;
    },

    signIn: async (email: string, password: string): Promise<{ user?: User, error?: string }> => {
        const cleanEmail = email ? email.toLowerCase().trim() : '';
        
        if (!isLiveData) {
            localUsers = getLocal('saloni_data_users', localUsers);
            const mockUser = localUsers.find(u => u.email.toLowerCase() === cleanEmail);
            if (mockUser) return { user: mockUser };
            return { error: 'Invalid credentials (Mock Mode)' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
            
            if (error) {
                if (cleanEmail === 'sarthak_huria@yahoo.com' && password === 'Saloni@Growth2025!') {
                     return { 
                        user: {
                            id: 'u-super-admin',
                            email: cleanEmail,
                            fullName: 'Sarthak Huria (Recovery)',
                            businessName: 'Saloni Sales HQ',
                            role: UserRole.SUPER_ADMIN,
                            isApproved: true,
                            creditLimit: 100000000,
                            outstandingDues: 0,
                            mobile: '9911076258'
                        }
                     };
                }
                return { error: error.message };
            }
            
            if (data.user) {
                const profile = await db.getUserById(data.user.id);
                if (profile) return { user: profile };
                
                return { 
                    user: {
                        id: data.user.id,
                        email: cleanEmail,
                        fullName: data.user.user_metadata.full_name || 'User',
                        role: data.user.user_metadata.role || UserRole.RETAILER,
                        isApproved: false,
                        creditLimit: 0,
                        outstandingDues: 0
                    }
                };
            }
        } catch (err: any) {
            return { error: "Connection failed" };
        }
        return { error: 'Invalid login credentials' };
    },

    signOut: async () => {
        if (isLiveData) await supabase.auth.signOut();
    },

    registerUser: async (user: User, password?: string): Promise<{ success: boolean; error?: string; data?: User }> => {
        if (!isLiveData) {
            const newUser = { ...user, id: `u-mock-${Date.now()}` };
            localUsers = getLocal('saloni_data_users', localUsers);
            localUsers.push(newUser);
            setLocal('saloni_data_users', localUsers);
            return { success: true, data: newUser };
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({ 
            email: user.email, 
            password: password || 'tempPass123',
            options: { data: { full_name: user.fullName, role: user.role } }
        });

        if (authError) return { success: false, error: authError.message };
        
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

            if (profileError) console.error("Profile creation error:", profileError);

            return { success: true, data: newUser };
        }
        return { success: false, error: "Registration failed" };
    },

    updateUser: async (user: User): Promise<boolean> => {
        if (!isLiveData) {
            localUsers = getLocal('saloni_data_users', localUsers);
            const index = localUsers.findIndex(u => u.id === user.id);
            if (index !== -1) {
                localUsers[index] = { ...localUsers[index], ...user };
                setLocal('saloni_data_users', localUsers);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('users').update(user).eq('id', user.id);
        return !error;
    },

    updatePassword: async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (!isLiveData) return { success: true };
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    resetPasswordForEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (!isLiveData) return { success: true };
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#/update-password'
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    triggerSecurityLockout: async (userId: string, userName: string, reason: string) => {
        if (isLiveData) {
            await supabase.from('users').update({ isApproved: false, adminNotes: `LOCKED: ${reason}` }).eq('id', userId);
        } else {
            localUsers = getLocal('saloni_data_users', localUsers);
            const index = localUsers.findIndex(u => u.id === userId);
            if (index !== -1) {
                localUsers[index].isApproved = false;
                setLocal('saloni_data_users', localUsers);
            }
        }
        console.warn(`SECURITY LOCKOUT: ${userName} (${userId}) - ${reason}`);
    },

    // ORDERS
    createOrder: async (order: any): Promise<boolean> => {
        if (!isLiveData) {
            localOrders = getLocal('saloni_data_orders', localOrders);
            const ord = { ...order, id: `ord-${Date.now()}` };
            localOrders.unshift(ord);
            setLocal('saloni_data_orders', localOrders);
            return true;
        }
        const ord = { ...order };
        if (!ord.id) ord.id = `ord-${Date.now()}`;
        const { error } = await supabase.from('orders').insert(ord);
        return !error;
    },

    getAllOrders: async (): Promise<Order[]> => {
        if (!isLiveData) {
            localOrders = getLocal('saloni_data_orders', localOrders);
            return [...localOrders];
        }
        const { data, error } = await supabase.from('orders').select('*');
        if (error) return [...localOrders];
        return (data as Order[]);
    },

    getOrdersByUser: async (userId: string): Promise<Order[]> => {
        if (!isLiveData) {
            localOrders = getLocal('saloni_data_orders', localOrders);
            return localOrders.filter(o => o.userId === userId);
        }
        const { data, error } = await supabase.from('orders').select('*').eq('userId', userId);
        if (error) return localOrders.filter(o => o.userId === userId);
        return data as Order[];
    },

    updateOrder: async (id: string, updates: Partial<Order>): Promise<boolean> => {
        if (!isLiveData) {
            localOrders = getLocal('saloni_data_orders', localOrders);
            const index = localOrders.findIndex(o => o.id === id);
            if (index !== -1) {
                localOrders[index] = { ...localOrders[index], ...updates };
                setLocal('saloni_data_orders', localOrders);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('orders').update(updates).eq('id', id);
        return !error;
    },

    // FINANCE
    getTransactions: async (userId?: string): Promise<Transaction[]> => {
        if (!isLiveData) return getLocal('saloni_data_transactions', [...MOCK_TRANSACTIONS]);
        let query = supabase.from('transactions').select('*');
        if (userId) query = query.eq('userId', userId);
        const { data, error } = await query;
        if (error) return getLocal('saloni_data_transactions', [...MOCK_TRANSACTIONS]);
        return (data as Transaction[]) || [];
    },

    recordTransaction: async (tx: Transaction): Promise<boolean> => {
        if (!isLiveData) {
            const txs: Transaction[] = getLocal('saloni_data_transactions', [...MOCK_TRANSACTIONS]);
            txs.unshift(tx);
            setLocal('saloni_data_transactions', txs);
            
            // Update User Balance
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
        
        const { error } = await supabase.from('transactions').insert(tx);
        if (error) return false;
        
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
        if (!isLiveData) return getLocal('saloni_data_creds', [...MOCK_CREDIT_REQUESTS]);
        const { data } = await supabase.from('credit_requests').select('*');
        return (data as CreditRequest[]) || []; 
    },

    processCreditRequest: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
        if (!isLiveData) {
            const reqs: CreditRequest[] = getLocal('saloni_data_creds', [...MOCK_CREDIT_REQUESTS]);
            const idx = reqs.findIndex(r => r.id === id);
            if (idx !== -1) {
                reqs[idx].status = status;
                setLocal('saloni_data_creds', reqs);
            }
            return true;
        }
        const { error } = await supabase.from('credit_requests').update({ status }).eq('id', id);
        return !error;
    },

    // VISITS
    logVisit: async (log: VisitLog): Promise<boolean> => {
        if (!isLiveData) {
            const logs: VisitLog[] = getLocal('saloni_data_visitlogs', [...MOCK_VISIT_LOGS]);
            logs.unshift(log);
            setLocal('saloni_data_visitlogs', logs);
            return true;
        }
        const { error } = await supabase.from('visit_logs').insert(log);
        return !error;
    },

    getVisitLogs: async (agentId?: string): Promise<VisitLog[]> => {
        if (!isLiveData) return getLocal('saloni_data_visitlogs', [...MOCK_VISIT_LOGS]);
        let query = supabase.from('visit_logs').select('*');
        if (agentId) query = query.eq('agentId', agentId);
        const { data } = await query;
        return (data as VisitLog[]) || [];
    },

    createVisitRequest: async (req: Partial<VisitRequest>): Promise<boolean> => {
        if (!isLiveData) {
            const reqs: VisitRequest[] = getLocal('saloni_data_visitreqs', [...MOCK_VISIT_REQUESTS]);
            const newReq = { ...req, id: `vr-${Date.now()}`, status: 'PENDING' } as VisitRequest;
            reqs.unshift(newReq);
            setLocal('saloni_data_visitreqs', reqs);
            return true;
        }
        const newReq = { ...req, id: `vr-${Date.now()}`, status: 'PENDING' };
        const { error } = await supabase.from('visit_requests').insert(newReq);
        return !error;
    },

    getVisitRequests: async (): Promise<VisitRequest[]> => {
        if (!isLiveData) return getLocal('saloni_data_visitreqs', [...MOCK_VISIT_REQUESTS]);
        const { data } = await supabase.from('visit_requests').select('*');
        return (data as VisitRequest[]) || [];
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>): Promise<boolean> => {
        if (!isLiveData) {
            const reqs: VisitRequest[] = getLocal('saloni_data_visitreqs', [...MOCK_VISIT_REQUESTS]);
            const idx = reqs.findIndex(r => r.id === id);
            if (idx !== -1) {
                reqs[idx] = { ...reqs[idx], ...updates };
                setLocal('saloni_data_visitreqs', reqs);
            }
            return true;
        }
        const { error } = await supabase.from('visit_requests').update(updates).eq('id', id);
        return !error;
    },

    // REVIEWS
    addReview: async (review: Partial<Review>): Promise<boolean> => {
        if (!isLiveData) {
            const revs: Review[] = getLocal('saloni_data_reviews', [...MOCK_REVIEWS]);
            const newReview = { ...review, id: `rev-${Date.now()}`, createdAt: new Date().toISOString() } as Review;
            revs.unshift(newReview);
            setLocal('saloni_data_reviews', revs);
            return true;
        }
        const newReview = { ...review, id: `rev-${Date.now()}`, createdAt: new Date().toISOString() };
        const { error } = await supabase.from('reviews').insert(newReview);
        return !error;
    },

    getReviews: async (productId: string): Promise<Review[]> => {
        if (!isLiveData) {
            const revs: Review[] = getLocal('saloni_data_reviews', [...MOCK_REVIEWS]);
            return revs.filter(r => r.productId === productId);
        }
        const { data } = await supabase.from('reviews').select('*').eq('productId', productId);
        return (data as Review[]) || [];
    },

    // TICKETS
    createTicket: async (ticket: SupportTicket): Promise<boolean> => {
        if (!isLiveData) {
            const tix: SupportTicket[] = getLocal('saloni_data_tickets', [...MOCK_TICKETS]);
            tix.unshift(ticket);
            setLocal('saloni_data_tickets', tix);
            return true;
        }
        const { error } = await supabase.from('tickets').insert(ticket);
        return !error;
    },

    getTickets: async (userId?: string): Promise<SupportTicket[]> => {
        if (!isLiveData) {
            const tix: SupportTicket[] = getLocal('saloni_data_tickets', [...MOCK_TICKETS]);
            if (userId) return tix.filter(t => t.userId === userId);
            return tix;
        }
        let query = supabase.from('tickets').select('*');
        if (userId) query = query.eq('userId', userId);
        const { data } = await query;
        return (data as SupportTicket[]) || [];
    },

    addTicketMessage: async (ticketId: string, message: TicketMessage): Promise<boolean> => {
        if (!isLiveData) {
            const tix: SupportTicket[] = getLocal('saloni_data_tickets', [...MOCK_TICKETS]);
            const ticket = tix.find(t => t.id === ticketId);
            if (ticket) {
                ticket.messages.push(message);
                ticket.status = 'IN_PROGRESS';
                setLocal('saloni_data_tickets', tix);
                return true;
            }
            return false;
        }
        const { data } = await supabase.from('tickets').select('messages').eq('id', ticketId).single();
        if (data) {
            const newMessages = [...data.messages, message];
            const { error } = await supabase.from('tickets').update({ 
                messages: newMessages, 
                updatedAt: new Date().toISOString(),
                status: 'IN_PROGRESS' 
            }).eq('id', ticketId);
            return !error;
        }
        return false;
    },

    updateTicket: async (ticketId: string, updates: Partial<SupportTicket>): Promise<boolean> => {
        if (!isLiveData) {
            const tix: SupportTicket[] = getLocal('saloni_data_tickets', [...MOCK_TICKETS]);
            const idx = tix.findIndex(t => t.id === ticketId);
            if (idx !== -1) {
                tix[idx] = { ...tix[idx], ...updates };
                setLocal('saloni_data_tickets', tix);
            }
            return true;
        }
        const { error } = await supabase.from('tickets').update(updates).eq('id', ticketId);
        return !error;
    },

    // STOCK LOGS
    logStockMovement: async (log: StockLog): Promise<boolean> => {
        if (!isLiveData) {
            localStockLogs = getLocal('saloni_data_stocklogs', localStockLogs);
            localStockLogs.unshift(log);
            setLocal('saloni_data_stocklogs', localStockLogs);
            return true;
        }
        const { error } = await supabase.from('stock_logs').insert(log);
        return !error;
    },

    getStockLogs: async (): Promise<StockLog[]> => {
        if (!isLiveData) {
            localStockLogs = getLocal('saloni_data_stocklogs', localStockLogs);
            return [...localStockLogs];
        }
        const { data } = await supabase.from('stock_logs').select('*').order('date', { ascending: false }).limit(100);
        return (data as StockLog[]) || [];
    },

    getAdminDashboardData: async () => {
        const [orders, users] = await Promise.all([
            db.getAllOrders(),
            db.getUsers()
        ]);

        return {
            orderCount: orders.length,
            userCount: users.length,
            pendingApprovals: users.filter(u => !u.isApproved).length,
            recentOrders: orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
        };
    }
};
