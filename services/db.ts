
import { supabase, isLiveData } from './supabaseClient';
import { 
    User, Product, Order, CartItem, UserRole, 
    VisitLog, StockLog, Transaction, SupportTicket, 
    TicketMessage, Review, CreditRequest, VisitRequest,
    Notification
} from '../types';
import { 
    MOCK_USERS, MOCK_PRODUCTS, MOCK_ORDERS, 
    MOCK_TRANSACTIONS, MOCK_VISIT_LOGS, MOCK_STOCK_LOGS,
    MOCK_VISIT_REQUESTS, MOCK_TICKETS, MOCK_REVIEWS,
    MOCK_CREDIT_REQUESTS
} from './mockData';

// Helper for Local Storage persistence
const getLocal = <T>(key: string, defaultVal: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

const setLocal = <T>(key: string, data: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("LocalStorage Save Error", e);
    }
};

// --- AI Helpers ---
export const getGeminiKey = (): string => {
    // 1. Check process.env (Vite injects this at build time if configured)
    if (process.env.API_KEY) return process.env.API_KEY;
    
    // 2. Check Local Storage (User Settings)
    const stored = localStorage.getItem('SALONI_GEMINI_KEY');
    if (stored) return stored;

    return '';
};

export const handleAiError = async (error: any): Promise<boolean> => {
    console.error("AI Error:", error);
    if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        alert("AI Service is busy (Quota Exceeded). Please try again later.");
        return true;
    }
    if (error.message?.includes('API key not valid')) {
        alert("Invalid API Key. Please check settings.");
        return true;
    }
    return false;
};

export const parseAIJson = <T>(text: string | undefined | null, fallback: T): T => {
    if (!text) return fallback;
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    } catch (e) {
        console.warn("AI JSON Parse Failed", e);
        return fallback;
    }
};

export const runAiWithRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return runAiWithRetry(fn, retries - 1);
        }
        throw error;
    }
};

// --- DB Interface ---

export const db = {
    // --- PRODUCTS ---
    getProducts: async (): Promise<Product[]> => {
        if (!isLiveData) {
            return getLocal('saloni_data_products', MOCK_PRODUCTS);
        }
        const { data, error } = await supabase.from('products').select('*');
        if (error) { 
            console.error("DB Fetch Error (Products):", error); 
            // Fallback to mock data if DB fails (e.g. RLS blocking bypass admin)
            return MOCK_PRODUCTS; 
        }
        return data || [];
    },

    saveProduct: async (product: Partial<Product>): Promise<boolean> => {
        if (!isLiveData) {
            try {
                let localProducts = getLocal('saloni_data_products', MOCK_PRODUCTS);
                const index = localProducts.findIndex(p => p.id === product.id);
                
                if (index !== -1) {
                    // Update
                    localProducts[index] = { ...localProducts[index], ...product };
                } else {
                    // Create
                    const newProduct = { ...product };
                    if (!newProduct.id) newProduct.id = `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    // Ensure mandatory fields for display
                    if (!newProduct.images) newProduct.images = [];
                    if (!newProduct.variants) newProduct.variants = [];
                    
                    localProducts.unshift(newProduct as Product);
                }
                // Persist
                setLocal('saloni_data_products', localProducts);
                return true;
            } catch (e) {
                console.error("Local Save Error:", e);
                return false;
            }
        }

        const prodToSave = { ...product };
        if (!prodToSave.id) delete prodToSave.id;
        if (!prodToSave.id && product.id) prodToSave.id = product.id;
        
        const { error } = await supabase.from('products').upsert(prodToSave);
        if (error) {
            console.error("DB Error saveProduct:", error);
            return false;
        }
        return true;
    },

    deleteProduct: async (id: string): Promise<boolean> => {
        if (!isLiveData) {
            let localProducts = getLocal('saloni_data_products', MOCK_PRODUCTS);
            localProducts = localProducts.filter(p => p.id !== id);
            setLocal('saloni_data_products', localProducts);
            return true;
        }
        const { error } = await supabase.from('products').delete().eq('id', id);
        return !error;
    },

    // --- USERS ---
    getUsers: async (): Promise<User[]> => {
        if (!isLiveData) {
            const users = getLocal('saloni_data_users', MOCK_USERS);
            // Ensure hardcoded admins are always present in mock mode
            const admin = MOCK_USERS.find(u => u.role === UserRole.SUPER_ADMIN);
            if (admin && !users.find(u => u.email === admin.email)) {
                users.unshift(admin);
            }
            return users;
        }
        const { data, error } = await supabase.from('users').select('*');
        if (error) { 
            console.error("DB Fetch Error (Users):", error); 
            // Return essential admin user if fetch fails
            return [MOCK_USERS[0]];
        }
        return data || [];
    },

    getUserById: async (id: string): Promise<User | null> => {
        if (!isLiveData) {
            const users = getLocal('saloni_data_users', MOCK_USERS);
            return users.find(u => u.id === id) || MOCK_USERS.find(u => u.id === id) || null;
        }
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) return null;
        return data;
    },

    registerUser: async (user: User, password?: string): Promise<{ success: boolean; error?: string; data?: User }> => {
        if (!isLiveData) {
            const users = getLocal('saloni_data_users', MOCK_USERS);
            if (users.find(u => u.email === user.email)) {
                return { success: false, error: "User already exists" };
            }
            const newUser = { ...user, id: user.id || `u-${Date.now()}` };
            // Simulate storing password
            const creds = getLocal('saloni_auth_creds', {} as Record<string, string>);
            creds[newUser.email] = password || 'password123';
            setLocal('saloni_auth_creds', creds);
            
            users.push(newUser);
            setLocal('saloni_data_users', users);
            return { success: true, data: newUser };
        }

        // Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: password || 'tempPassword123',
            options: {
                data: {
                    full_name: user.fullName,
                    role: user.role
                }
            }
        });

        if (error) return { success: false, error: error.message };
        
        if (data.user) {
            // Create user profile record
            const newUser = { ...user, id: data.user.id };
            const { error: dbError } = await supabase.from('users').insert(newUser);
            if (dbError) return { success: false, error: dbError.message };
            return { success: true, data: newUser };
        }
        return { success: false, error: "Registration failed" };
    },

    updateUser: async (user: User): Promise<boolean> => {
        if (!isLiveData) {
            const users = getLocal('saloni_data_users', MOCK_USERS);
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index] = user;
                setLocal('saloni_data_users', users);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('users').update(user).eq('id', user.id);
        return !error;
    },

    signIn: async (identifier: string, password?: string): Promise<{ user?: User; error?: string }> => {
        if (!isLiveData) {
            const users = getLocal('saloni_data_users', MOCK_USERS);
            let user = users.find(u => u.email === identifier || u.mobile === identifier);
            
            if (!user) {
                const mockUser = MOCK_USERS.find(u => u.email === identifier || u.mobile === identifier);
                if (mockUser) {
                    user = mockUser;
                    users.push(mockUser);
                    setLocal('saloni_data_users', users);
                }
            }
            
            if (!user) return { error: "User not found" };
            const creds = getLocal('saloni_auth_creds', {} as Record<string, string>);
            const storedPass = creds[user.email] || 'password123';
            if (password === storedPass || password === 'Saloni123' || password === 'password123' || password === 'Saloni@Growth2025!') {
                return { user };
            }
            return { error: "Incorrect password" };
        }

        // Live Mode Logic
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: password || ''
            });

            // --- EMERGENCY BYPASS FOR ADMIN ---
            // Allows login even if Supabase Auth rejects (e.g. wrong password stored in DB)
            const OFFICIAL_ADMIN_EMAIL = 'sarthak_huria@yahoo.com';
            const OFFICIAL_ADMIN_ID = 'b8c4a381-edb4-4cab-9891-6027e1541ea1';
            
            if ((error || !data.user) && identifier === OFFICIAL_ADMIN_EMAIL && password === 'Saloni@Growth2025!') {
                console.warn("⚠️ EMERGENCY BYPASS ACTIVATED");
                return {
                    user: {
                        id: OFFICIAL_ADMIN_ID,
                        email: OFFICIAL_ADMIN_EMAIL,
                        fullName: 'Sarthak Huria (Bypass)',
                        businessName: 'Saloni Sales HQ',
                        role: UserRole.SUPER_ADMIN,
                        isApproved: true,
                        isPreBookApproved: true,
                        creditLimit: 100000000,
                        outstandingDues: 0,
                        mobile: '9911076258'
                    }
                };
            }
            // ----------------------------------

            if (error) return { error: error.message };
            
            if (data.user) {
                // Ensure profile exists or bootstrap it
                if (data.user.email === OFFICIAL_ADMIN_EMAIL || data.user.id === OFFICIAL_ADMIN_ID) {
                    try {
                        const { data: existingProfile } = await supabase.from('users').select('id, role').eq('id', data.user.id).maybeSingle();
                        if (!existingProfile) {
                            await supabase.from('users').insert({
                                id: data.user.id,
                                email: data.user.email,
                                fullName: 'Sarthak Huria',
                                businessName: 'Saloni Sales HQ',
                                role: UserRole.SUPER_ADMIN,
                                isApproved: true,
                                creditLimit: 100000000,
                                outstandingDues: 0
                            });
                        } else if (existingProfile.role !== UserRole.SUPER_ADMIN) {
                            await supabase.from('users').update({ role: UserRole.SUPER_ADMIN }).eq('id', data.user.id);
                        }
                    } catch (e) { console.error("Bootstrap warning", e); }
                }

                // Fetch profile
                const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', data.user.id).single();
                
                // Fallback if profile fetch fails (e.g. RLS) but we know it's the admin
                if (profileError && (data.user.email === OFFICIAL_ADMIN_EMAIL)) {
                     return {
                        user: {
                            id: data.user.id,
                            email: data.user.email,
                            fullName: 'Sarthak Huria',
                            businessName: 'Saloni Sales HQ',
                            role: UserRole.SUPER_ADMIN,
                            isApproved: true,
                            creditLimit: 100000000,
                            outstandingDues: 0
                        }
                    };
                }
                
                if (profileError) return { error: "Profile not found." };
                return { user: profile };
            }
        } catch (e: any) {
            return { error: "Connection Error: " + e.message };
        }
        
        return { error: "Login failed" };
    },

    signOut: async () => {
        if (isLiveData) await supabase.auth.signOut();
    },

    updatePassword: async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (!isLiveData) return { success: true };
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    resetPasswordForEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (!isLiveData) return { success: true }; // Mock success
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#/update-password',
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    triggerSecurityLockout: async (userId: string, name: string, reason: string) => {
        console.warn(`SECURITY LOCKOUT: ${name} (${userId}) - ${reason}`);
        if (isLiveData) {
            await supabase.from('users').update({ isApproved: false, adminNotes: `LOCKED: ${reason}` }).eq('id', userId);
        } else {
            const users = getLocal('saloni_data_users', MOCK_USERS);
            const user = users.find(u => u.id === userId);
            if (user) {
                user.isApproved = false;
                user.adminNotes = `LOCKED: ${reason}`;
                setLocal('saloni_data_users', users);
            }
        }
    },

    // --- ORDERS ---
    getAllOrders: async (): Promise<Order[]> => {
        if (!isLiveData) {
            return getLocal('saloni_data_orders', MOCK_ORDERS);
        }
        const { data, error } = await supabase.from('orders').select('*');
        if (error) {
            console.error("DB Fetch Error (Orders):", error);
            return [];
        }
        return data || [];
    },

    getOrdersByUser: async (userId: string): Promise<Order[]> => {
        if (!isLiveData) {
            const orders = getLocal('saloni_data_orders', MOCK_ORDERS);
            return orders.filter(o => o.userId === userId);
        }
        const { data, error } = await supabase.from('orders').select('*').eq('userId', userId);
        if (error) return [];
        return data || [];
    },

    createOrder: async (order: Order): Promise<boolean> => {
        if (!isLiveData) {
            const orders = getLocal('saloni_data_orders', MOCK_ORDERS);
            order.id = `ord-${Date.now()}`;
            orders.unshift(order);
            setLocal('saloni_data_orders', orders);
            return true;
        }
        const { error } = await supabase.from('orders').insert(order);
        return !error;
    },

    updateOrder: async (id: string, updates: Partial<Order>): Promise<boolean> => {
        if (!isLiveData) {
            const orders = getLocal('saloni_data_orders', MOCK_ORDERS);
            const index = orders.findIndex(o => o.id === id);
            if (index !== -1) {
                orders[index] = { ...orders[index], ...updates };
                setLocal('saloni_data_orders', orders);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('orders').update(updates).eq('id', id);
        return !error;
    },

    // --- TRANSACTIONS ---
    getTransactions: async (userId?: string): Promise<Transaction[]> => {
        if (!isLiveData) {
            const txs = getLocal('saloni_data_transactions', MOCK_TRANSACTIONS);
            return userId ? txs.filter(t => t.userId === userId) : txs;
        }
        let query = supabase.from('transactions').select('*');
        if (userId) query = query.eq('userId', userId);
        const { data, error } = await query;
        return data || [];
    },

    recordTransaction: async (tx: Transaction): Promise<boolean> => {
        if (!isLiveData) {
            const txs = getLocal('saloni_data_transactions', MOCK_TRANSACTIONS);
            txs.unshift(tx);
            setLocal('saloni_data_transactions', txs);
            
            // Update User Balance logic (Mock)
            const users = getLocal('saloni_data_users', MOCK_USERS);
            const user = users.find(u => u.id === tx.userId);
            if (user) {
                const amount = tx.amount;
                if (tx.type === 'PAYMENT' || tx.type === 'CREDIT_NOTE') {
                    user.outstandingDues = (user.outstandingDues || 0) - amount;
                } else {
                    user.outstandingDues = (user.outstandingDues || 0) + amount;
                }
                setLocal('saloni_data_users', users);
            }
            return true;
        }
        
        const { error } = await supabase.from('transactions').insert(tx);
        return !error;
    },

    // --- VISITS ---
    getVisitLogs: async (agentId?: string): Promise<VisitLog[]> => {
        if (!isLiveData) {
            const logs = getLocal('saloni_data_visitlogs', MOCK_VISIT_LOGS);
            return agentId ? logs.filter(l => l.agentId === agentId) : logs;
        }
        let query = supabase.from('visit_logs').select('*');
        if (agentId) query = query.eq('agentId', agentId);
        const { data } = await query;
        return data || [];
    },

    logVisit: async (log: VisitLog): Promise<boolean> => {
        if (!isLiveData) {
            const logs = getLocal('saloni_data_visitlogs', MOCK_VISIT_LOGS);
            logs.unshift(log);
            setLocal('saloni_data_visitlogs', logs);
            return true;
        }
        const { error } = await supabase.from('visit_logs').insert(log);
        return !error;
    },

    getVisitRequests: async (): Promise<VisitRequest[]> => {
        if (!isLiveData) {
            return getLocal('saloni_data_visitrequests', MOCK_VISIT_REQUESTS);
        }
        const { data } = await supabase.from('visit_requests').select('*');
        return data || [];
    },

    createVisitRequest: async (req: Partial<VisitRequest>): Promise<boolean> => {
        if (!isLiveData) {
            const reqs = getLocal('saloni_data_visitrequests', MOCK_VISIT_REQUESTS);
            const newReq = { 
                ...req, 
                id: `vr-${Date.now()}`, 
                status: 'PENDING' 
            } as VisitRequest;
            reqs.unshift(newReq);
            setLocal('saloni_data_visitrequests', reqs);
            return true;
        }
        const { error } = await supabase.from('visit_requests').insert(req);
        return !error;
    },

    updateVisitRequest: async (id: string, updates: Partial<VisitRequest>): Promise<boolean> => {
        if (!isLiveData) {
            const reqs = getLocal('saloni_data_visitrequests', MOCK_VISIT_REQUESTS);
            const index = reqs.findIndex(r => r.id === id);
            if (index !== -1) {
                reqs[index] = { ...reqs[index], ...updates };
                setLocal('saloni_data_visitrequests', reqs);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('visit_requests').update(updates).eq('id', id);
        return !error;
    },

    // --- OTHER ---
    getCreditRequests: async (): Promise<CreditRequest[]> => {
        if (!isLiveData) return getLocal('saloni_data_creditrequests', MOCK_CREDIT_REQUESTS);
        const { data } = await supabase.from('credit_requests').select('*');
        return data || [];
    },

    processCreditRequest: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
        if (!isLiveData) {
            const reqs = getLocal('saloni_data_creditrequests', MOCK_CREDIT_REQUESTS);
            const req = reqs.find(r => r.id === id);
            if (req) {
                req.status = status;
                setLocal('saloni_data_creditrequests', reqs);
                if (status === 'APPROVED') {
                    const users = getLocal('saloni_data_users', MOCK_USERS);
                    const user = users.find(u => u.id === req.userId);
                    if (user) {
                        user.creditLimit = req.requestedLimit;
                        setLocal('saloni_data_users', users);
                    }
                }
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('credit_requests').update({ status }).eq('id', id);
        return !error;
    },

    getAdminDashboardData: async () => {
        const users = await db.getUsers();
        const orders = await db.getAllOrders();
        return {
            orderCount: orders.length,
            userCount: users.length,
            pendingApprovals: users.filter(u => !u.isApproved).length + orders.filter(o => o.status === 'PENDING').length,
            recentOrders: orders.slice(0, 5)
        };
    },

    // Support
    getTickets: async (userId?: string): Promise<SupportTicket[]> => {
        if (!isLiveData) {
            const tickets = getLocal('saloni_data_tickets', MOCK_TICKETS);
            return userId ? tickets.filter(t => t.userId === userId) : tickets;
        }
        let query = supabase.from('support_tickets').select('*');
        if (userId) query = query.eq('userId', userId);
        const { data } = await query;
        return data || [];
    },

    createTicket: async (ticket: SupportTicket): Promise<boolean> => {
        if (!isLiveData) {
            const tickets = getLocal('saloni_data_tickets', MOCK_TICKETS);
            tickets.unshift(ticket);
            setLocal('saloni_data_tickets', tickets);
            return true;
        }
        const { error } = await supabase.from('support_tickets').insert(ticket);
        return !error;
    },

    updateTicket: async (id: string, updates: Partial<SupportTicket>): Promise<boolean> => {
        if (!isLiveData) {
            const tickets = getLocal('saloni_data_tickets', MOCK_TICKETS);
            const index = tickets.findIndex(t => t.id === id);
            if (index !== -1) {
                tickets[index] = { ...tickets[index], ...updates };
                setLocal('saloni_data_tickets', tickets);
                return true;
            }
            return false;
        }
        const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
        return !error;
    },

    addTicketMessage: async (ticketId: string, message: TicketMessage): Promise<boolean> => {
        if (!isLiveData) {
            const tickets = getLocal('saloni_data_tickets', MOCK_TICKETS);
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.messages.push(message);
                ticket.updatedAt = new Date().toISOString();
                setLocal('saloni_data_tickets', tickets);
                return true;
            }
            return false;
        }
        // In Supabase, assuming simple JSON update for this demo
        const { data } = await supabase.from('support_tickets').select('messages').eq('id', ticketId).single();
        if (data) {
            const newMessages = [...(data.messages || []), message];
            const { error } = await supabase.from('support_tickets').update({ messages: newMessages, updatedAt: new Date().toISOString() }).eq('id', ticketId);
            return !error;
        }
        return false;
    },

    // Reviews
    getReviews: async (productId: string): Promise<Review[]> => {
        if (!isLiveData) {
            const reviews = getLocal('saloni_data_reviews', MOCK_REVIEWS);
            return reviews.filter(r => r.productId === productId);
        }
        const { data } = await supabase.from('reviews').select('*').eq('productId', productId);
        return data || [];
    },

    addReview: async (review: Omit<Review, 'id' | 'createdAt'>): Promise<boolean> => {
        const newReview = { ...review, id: `rev-${Date.now()}`, createdAt: new Date().toISOString() };
        if (!isLiveData) {
            const reviews = getLocal('saloni_data_reviews', MOCK_REVIEWS);
            reviews.unshift(newReview);
            setLocal('saloni_data_reviews', reviews);
            return true;
        }
        const { error } = await supabase.from('reviews').insert(newReview);
        return !error;
    },

    // Stock
    logStockMovement: async (log: StockLog): Promise<boolean> => {
        if (!isLiveData) {
            const logs = getLocal('saloni_data_stocklogs', MOCK_STOCK_LOGS);
            logs.unshift(log);
            setLocal('saloni_data_stocklogs', logs);
            return true;
        }
        const { error } = await supabase.from('stock_logs').insert(log);
        return !error;
    },

    getStockLogs: async (): Promise<StockLog[]> => {
        if (!isLiveData) return getLocal('saloni_data_stocklogs', MOCK_STOCK_LOGS);
        const { data } = await supabase.from('stock_logs').select('*').order('date', { ascending: false });
        return data || [];
    },

    // Media
    uploadImage: async (file: File, bucket = 'products'): Promise<string> => {
        if (!isLiveData) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        }
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl.publicUrl;
    },

    uploadVideo: async (blob: Blob): Promise<string> => {
        if (!isLiveData) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }
        const fileName = `video-${Date.now()}.mp4`;
        const { error } = await supabase.storage.from('videos').upload(fileName, blob, { contentType: 'video/mp4' });
        if (error) throw error;
        const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
        return data.publicUrl;
    },

    uploadDocument: async (file: File): Promise<string> => {
        return db.uploadImage(file, 'documents');
    }
};
