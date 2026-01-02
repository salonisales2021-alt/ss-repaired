import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';

export const About: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[400px] bg-gray-900 flex items-center justify-center overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop" 
                    alt="Textile Factory" 
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="relative z-10 text-center px-4 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-script text-white mb-4">Wefting Dreams into Reality</h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Saloni Sales has been redefining kids' fashion manufacturing in India since 2010 (Reg. 2021).
                    </p>
                </div>
            </div>

            {/* Our Story */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold font-heading text-luxury-black mb-6">Our Story</h2>
                        <div className="w-16 h-1 bg-rani-500 mb-6"></div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            What started as a small wholesale unit in Gandhi Nagar, Delhi's largest textile hub, has now grown into a premier B2B brand known for quality and innovation.
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            Founded by <strong>Mr. Sarthak Huria</strong>, Saloni Sales bridges the gap between high-end fashion and affordable wholesale pricing. We specialize in girls' ethnic and western wear, catering to retailers across 20+ states in India and international buyers in UAE and Canada.
                        </p>
                        <div className="grid grid-cols-2 gap-6 mt-8">
                            <div className="border-l-4 border-rani-200 pl-4">
                                <div className="text-3xl font-bold text-rani-600">500+</div>
                                <div className="text-sm text-gray-500 uppercase tracking-wide">Unique Designs / Year</div>
                            </div>
                            <div className="border-l-4 border-rani-200 pl-4">
                                <div className="text-3xl font-bold text-rani-600">1.5M+</div>
                                <div className="text-sm text-gray-500 uppercase tracking-wide">Garments Sold</div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -top-4 -left-4 w-full h-full border-2 border-rani-100 rounded-lg"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1560505163-7e8293777594?q=80&w=800&auto=format&fit=crop" 
                            alt="Mr Sarthak Huria" 
                            className="relative rounded-lg shadow-xl w-full object-cover h-[500px]"
                        />
                    </div>
                </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800">Why Partner With Us?</h2>
                        <p className="text-gray-500 mt-2">We support your business growth with premium products.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🧵</div>
                            <h3 className="font-bold text-lg mb-2">Premium Fabric</h3>
                            <p className="text-gray-600 text-sm">We source only the finest cotton, silk, and imported blends to ensure comfort for kids.</p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-16 h-16 bg-rani-50 text-rani-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🏭</div>
                            <h3 className="font-bold text-lg mb-2">Direct Manufacturer</h3>
                            <p className="text-gray-600 text-sm">No middlemen. Get factory-direct pricing to maximize your retail margins.</p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🚚</div>
                            <h3 className="font-bold text-lg mb-2">Fast Logistics</h3>
                            <p className="text-gray-600 text-sm">Integrated with major transport (Gaddis) and courier partners for pan-India delivery.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-3xl font-script text-rani-600 mb-6">Ready to upgrade your collection?</h2>
                <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={() => navigate('/register')}>Become a Partner</Button>
                    <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>Contact Sales</Button>
                </div>
            </div>
        </div>
    );
};