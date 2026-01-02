
import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
    const socialIcons: Record<string, React.ReactNode> = {
        facebook: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
        instagram: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
        linkedin: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h5v-8.306c0-4.613 9.289-5.124 9.289 0v8.306h5v-9.099c0-6.704-7.046-7.458-9.335-3.98h-.058v-2.917z"/></svg>,
        whatsapp: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
    };

    return (
        <footer className="bg-rani-900 text-white pt-16 pb-8 font-sans border-t-4 border-gold-600">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-4 mb-6 bg-white/10 p-4 rounded-lg inline-block backdrop-blur-sm">
                            <BrandLogo className="h-24 brightness-0 invert" />
                        </div>
                        <p className="text-rani-100 text-sm leading-relaxed mb-6 font-heading">
                            India's premier B2B manufacturer for premium girls' kids wear. Heritage quality meeting modern wholesale demands.
                        </p>
                        <div className="flex gap-4">
                            {['facebook', 'instagram', 'linkedin', 'whatsapp'].map(social => (
                                <a key={social} href="#" className="w-8 h-8 rounded-full bg-rani-800 border border-rani-700 flex items-center justify-center hover:bg-gold-600 hover:border-gold-500 hover:text-white text-rani-200 transition-colors">
                                    <span className="sr-only">{social}</span>
                                    {socialIcons[social]}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-heading font-bold text-lg mb-6 uppercase tracking-widest text-gold-400">Quick Links</h4>
                        <ul className="space-y-3 text-sm text-rani-100">
                            <li><Link to="/shop" className="hover:text-gold-300 transition-colors">Browse Collection</Link></li>
                            <li><Link to="/quick-order" className="hover:text-gold-300 transition-colors">Quick Bulk Order</Link></li>
                            <li><Link to="/design-studio" className="hover:text-gold-300 transition-colors">Custom Design Studio</Link></li>
                            <li><Link to="/smart-stocker" className="hover:text-gold-300 transition-colors">AI Smart Stocker</Link></li>
                            <li><Link to="/collections" className="hover:text-gold-300 transition-colors">Seasonal Lookbooks</Link></li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h4 className="font-heading font-bold text-lg mb-6 uppercase tracking-widest text-gold-400">Partner Support</h4>
                        <ul className="space-y-3 text-sm text-rani-100">
                            <li><Link to="/register" className="hover:text-gold-300 transition-colors">Register Business</Link></li>
                            <li><Link to="/support" className="hover:text-gold-300 transition-colors">Complaint Helpdesk</Link></li>
                            <li><Link to="/ledger" className="hover:text-gold-300 transition-colors">Financial Statement</Link></li>
                            <li><Link to="/book-visit" className="hover:text-gold-300 transition-colors">Book Experience Centre Visit</Link></li>
                            <li><Link to="/contact" className="hover:text-gold-300 transition-colors">Contact Sales Team</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-heading font-bold text-lg mb-6 uppercase tracking-widest text-gold-400">Corporate Office</h4>
                        <div className="space-y-4 text-sm text-rani-100">
                            <div className="flex gap-3">
                                <span className="text-gold-400">📍</span>
                                <span>X-271, Tagore Gali, Raghubarpura No. 1,<br/>Gandhi Nagar, Delhi - 110031</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-gold-400">📞</span>
                                <span>+91 99110 76258 (Customer Care)</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-gold-400">✉️</span>
                                <span>salonisales2021@gmail.com</span>
                            </div>
                            <div className="mt-6 p-4 bg-rani-800 rounded-lg border border-rani-700">
                                <p className="text-[10px] uppercase font-bold text-gold-400 mb-1">Office Hours</p>
                                <p className="text-xs text-white">Mon - Sat: 10:00 AM - 8:00 PM</p>
                                <p className="text-xs text-white">Sunday: Closed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-rani-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-rani-300 uppercase tracking-widest">
                    <p>© 2023 Saloni Sales (Reg 2021). All Rights Reserved.</p>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-white">Privacy Policy</Link>
                        <Link to="#" className="hover:text-white">Terms of Trade</Link>
                        <Link to="#" className="hover:text-white">GST Details</Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Built with</span>
                        <span className="text-gold-500">❤</span>
                        <span>for Indian Retailers</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
