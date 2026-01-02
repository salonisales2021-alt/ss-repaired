
import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { db } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const EnquireFranchise: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        mobile: user?.mobile || '',
        email: user?.email || '',
        city: '',
        state: '',
        investmentBudget: '',
        shopSpace: '',
        experience: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // We use the existing ticket system to log this inquiry
        const inquiryDetails = `
            FRANCHISE INQUIRY
            -----------------
            Name: ${formData.fullName}
            Mobile: ${formData.mobile}
            Email: ${formData.email}
            Location: ${formData.city}, ${formData.state}
            Budget: ${formData.investmentBudget}
            Space Available: ${formData.shopSpace} sq ft
            Experience: ${formData.experience}
            
            Message: ${formData.message}
        `;

        try {
            await db.createTicket({
                id: `franchise-${Date.now()}`,
                userId: user?.id || 'GUEST',
                userName: formData.fullName,
                subject: `New Franchise Inquiry - ${formData.city}`,
                category: 'OTHER',
                status: 'OPEN',
                priority: 'HIGH',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [{
                    id: `msg-${Date.now()}`,
                    senderId: user?.id || 'GUEST',
                    senderName: formData.fullName,
                    message: inquiryDetails,
                    timestamp: new Date().toISOString()
                }]
            });
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (error) {
            alert("Submission failed. Please try again or contact support directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-lg w-full p-10 rounded-2xl shadow-xl text-center border-t-4 border-rani-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-gray-800 mb-4">Inquiry Received</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thank you for your interest in the <strong>Saloni Sales</strong> family. Our franchise expansion team will review your profile and contact you within 48-72 hours.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => navigate('/')}>Return Home</Button>
                        <Button variant="outline" onClick={() => window.open('https://wa.me/919911076258', '_blank')}>Chat on WhatsApp</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans">
            {/* Hero Section */}
            <div className="relative h-[500px] bg-luxury-black overflow-hidden flex items-center">
                <div className="absolute inset-0 opacity-40">
                    <img 
                        src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070&auto=format&fit=crop" 
                        className="w-full h-full object-cover" 
                        alt="Luxury Boutique"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-2xl">
                        <span className="text-gold-500 font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Partner with Excellence</span>
                        <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                            Own a <span className="text-rani-500 italic font-script">Saloni Sales</span> Boutique
                        </h1>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Join India's fastest-growing premium kids wear network. We are expanding Pan-India with a profitable business model.
                        </p>
                        <div className="flex gap-4">
                            <Button size="lg" onClick={() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })}>Apply Now</Button>
                            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">Download Brochure</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-rani-900 text-white py-12 border-b border-rani-800">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-rani-800">
                        <div>
                            <div className="text-4xl font-bold text-gold-400 mb-1">35%</div>
                            <div className="text-xs uppercase tracking-widest text-rani-200">Gross Margin</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-gold-400 mb-1">24mo</div>
                            <div className="text-xs uppercase tracking-widest text-rani-200">Target ROI Period</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-gold-400 mb-1">500+</div>
                            <div className="text-xs uppercase tracking-widest text-rani-200">New Designs/Yr</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-gold-400 mb-1">Pan India</div>
                            <div className="text-xs uppercase tracking-widest text-rani-200">Location Availability</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-20">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Information Column */}
                    <div className="lg:w-5/12 space-y-12">
                        <div>
                            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">Why Choose Us?</h2>
                            <div className="space-y-6">
                                {[
                                    { title: "Direct Factory Pricing", desc: "Eliminate middlemen. Get stock directly from our manufacturing unit." },
                                    { title: "Product Education", desc: "Specialized training for store operators on fabric details and sales techniques." },
                                    { title: "Territory Exclusivity", desc: "We ensure you are the only authorized Saloni partner in your designated area." },
                                    { title: "Marketing Support", desc: "Get AI-generated social media kits and brand signage designs included." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 bg-rani-50 text-rani-600 rounded-full flex items-center justify-center text-xl shrink-0 font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed mt-1">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-widest">Eligibility Criteria</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center gap-2">✓ Investment Capacity: <strong>Min. ₹25 Lakhs</strong></li>
                                <li className="flex items-center gap-2">✓ Floor Area: <strong>Min. 500 sq. ft.</strong> carpet area</li>
                                <li className="flex items-center gap-2">✓ High Street or Mall Location preferred</li>
                            </ul>
                        </div>

                        <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-4 uppercase text-xs tracking-widest">Documents Required</h3>
                            <ul className="space-y-4 text-sm text-blue-800">
                                <li className="flex items-start gap-3">
                                    <span className="text-xl leading-none">📄</span>
                                    <span><strong>Property Proof:</strong> Store ownership deed or valid commercial lease/kiosk contract.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-xl leading-none">🏦</span>
                                    <span><strong>Security Checks:</strong> Bank solvency confirmation & insurance valuation of stock for security deposit.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-xl leading-none">📍</span>
                                    <span><strong>Location:</strong> Accurate geotagged location and layout plan of the store/kiosk.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-xl leading-none">⚖️</span>
                                    <span><strong>Legal:</strong> GST Certificate, Trade License, and other statutory compliances to be discussed.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Form Column */}
                    <div id="enquiry-form" className="lg:w-7/12">
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative">
                            <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] font-bold px-4 py-2 rounded-bl-xl uppercase tracking-widest">
                                Official Application
                            </div>
                            
                            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Franchise Application</h2>
                            <p className="text-gray-500 mb-8 text-sm">Please fill in your details accurately. Our team considers this data strictly confidential.</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Full Name" 
                                        required 
                                        value={formData.fullName}
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    />
                                    <Input 
                                        label="Phone Number" 
                                        required 
                                        value={formData.mobile}
                                        onChange={e => setFormData({...formData, mobile: e.target.value})}
                                    />
                                </div>

                                <Input 
                                    label="Email Address" 
                                    type="email" 
                                    required 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Proposed City" 
                                        required 
                                        value={formData.city}
                                        onChange={e => setFormData({...formData, city: e.target.value})}
                                    />
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <select 
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-sm focus:ring-1 focus:ring-rani-500 outline-none"
                                            required
                                            value={formData.state}
                                            onChange={e => setFormData({...formData, state: e.target.value})}
                                        >
                                            <option value="">Select State</option>
                                            <option value="Delhi">Delhi</option>
                                            <option value="Haryana">Haryana</option>
                                            <option value="Punjab">Punjab</option>
                                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                                            <option value="Rajasthan">Rajasthan</option>
                                            <option value="Gujarat">Gujarat</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Other">Other (Pan India)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Investment Budget</label>
                                        <select 
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-sm focus:ring-1 focus:ring-rani-500 outline-none"
                                            required
                                            value={formData.investmentBudget}
                                            onChange={e => setFormData({...formData, investmentBudget: e.target.value})}
                                        >
                                            <option value="">Select Range</option>
                                            <option value="25-35 Lakhs">₹25 - 35 Lakhs</option>
                                            <option value="35-50 Lakhs">₹35 - 50 Lakhs</option>
                                            <option value="50-75 Lakhs">₹50 - 75 Lakhs</option>
                                            <option value="75 Lakhs+">₹75 Lakhs+</option>
                                        </select>
                                    </div>
                                    <Input 
                                        label="Shop Area (Sq Ft)" 
                                        type="number"
                                        placeholder="Min 500"
                                        min="500"
                                        value={formData.shopSpace}
                                        onChange={e => setFormData({...formData, shopSpace: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Experience</label>
                                    <textarea 
                                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-rani-500 h-24 resize-none"
                                        placeholder="Do you currently own a shop? Tell us about your background."
                                        value={formData.experience}
                                        onChange={e => setFormData({...formData, experience: e.target.value})}
                                    ></textarea>
                                </div>

                                <Button fullWidth size="lg" disabled={isSubmitting} className="shadow-2xl shadow-rani-500/20">
                                    {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
