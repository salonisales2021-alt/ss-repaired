
import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const Contact: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
                    <p className="text-gray-500">We'd love to hear from you. Reach out for bulk orders, partnerships, or support.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-xl shadow-lg overflow-hidden">
                    
                    {/* Contact Info & Map */}
                    <div className="bg-luxury-black text-white p-10 flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-800 p-3 rounded text-rani-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Head Office</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mt-1">
                                            X-271, Tagore Gali, Raghubarpura No. 1,<br/>
                                            Gandhi Nagar, Delhi - 110031
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-800 p-3 rounded text-rani-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Phone</h3>
                                        <p className="text-gray-400 text-sm mt-1">+91 99110 76258 (Customer Care)</p>
                                        <p className="text-gray-400 text-sm">WhatsApp: +91 99110 76258</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-800 p-3 rounded text-rani-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Email</h3>
                                        <p className="text-gray-400 text-sm mt-1">salonisales2021@gmail.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rani-600 rounded-full opacity-20 blur-3xl"></div>
                        <div className="absolute top-12 -left-12 w-48 h-48 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
                    </div>

                    {/* Form */}
                    <div className="p-10">
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h3>
                                <p className="text-gray-500">Thank you for contacting us. Our sales team will respond within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Your Name" placeholder="John Doe" required />
                                    <Input label="Business Name" placeholder="ABC Garments" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Email Address" type="email" placeholder="john@example.com" required />
                                    <Input label="Phone Number" type="tel" placeholder="+91 99110 76258" required />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type</label>
                                    <select className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-rani-500 bg-white">
                                        <option>Bulk Order Inquiry</option>
                                        <option>Become a Distributor</option>
                                        <option>Logistics Support</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea 
                                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-rani-500 h-32 resize-none"
                                        placeholder="Tell us about your requirements..."
                                        required
                                    ></textarea>
                                </div>

                                <Button fullWidth>Send Message</Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
