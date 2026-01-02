
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';

// Simulated Video Steps
const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "Step 1: Finding Products",
        description: "Browse categories or use the smart search bar.",
        color: "bg-blue-600",
        animation: "search"
    },
    {
        id: 2,
        title: "Step 2: Adding to Cart",
        description: "Select Color & Size Range. B2B items are sold in Sets.",
        color: "bg-rani-600",
        animation: "add_to_cart"
    },
    {
        id: 3,
        title: "Step 3: Secure Checkout",
        description: "Choose 'Pay Now' or 'Gaddi Credit' for payment.",
        color: "bg-green-600",
        animation: "checkout"
    }
];

export const TutorialOverlay: React.FC = () => {
    const { isTutorialOpen, setTutorialOpen } = useApp();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isTutorialOpen) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + 1; // Speed of progress bar
                });
            }, 50); // 50ms * 100 = 5 seconds per slide
        }
        return () => clearInterval(interval);
    }, [isTutorialOpen, currentStepIndex]);

    const handleNext = () => {
        if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            setProgress(0);
        } else {
            setTutorialOpen(false);
            setTimeout(() => {
                setCurrentStepIndex(0);
                setProgress(0);
            }, 300);
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    if (!isTutorialOpen) return null;

    const step = TUTORIAL_STEPS[currentStepIndex];

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in">
            {/* Mobile-style Container */}
            <div className="relative w-full h-full md:w-[400px] md:h-[80vh] bg-gray-900 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-800">
                
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 w-full p-4 z-20 flex gap-1">
                    {TUTORIAL_STEPS.map((s, idx) => (
                        <div key={s.id} className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-white transition-all duration-100 ease-linear`}
                                style={{ 
                                    width: idx < currentStepIndex ? '100%' : (idx === currentStepIndex ? `${progress}%` : '0%') 
                                }}
                            ></div>
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button 
                    onClick={() => setTutorialOpen(false)}
                    className="absolute top-6 right-4 z-20 text-white hover:text-gray-300 bg-black/20 rounded-full p-2 backdrop-blur-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Content Layer (Click zones for navigation) */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="w-1/3 h-full" onClick={handlePrev}></div>
                    <div className="w-2/3 h-full" onClick={handleNext}></div>
                </div>

                {/* Simulated Screen Animation */}
                <div className="flex-1 bg-white relative overflow-hidden pointer-events-none">
                    {/* Background UI Simulation */}
                    <div className="absolute inset-0 bg-gray-50 flex flex-col">
                        {/* Fake Navbar */}
                        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                            <div className="w-32 h-3 bg-gray-100 rounded"></div>
                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        
                        {/* Step Specific Animations */}
                        <div className="flex-1 p-4 relative flex items-center justify-center">
                            
                            {/* SEARCH ANIMATION */}
                            {step.animation === 'search' && (
                                <div className="w-full max-w-xs space-y-4">
                                    <div className="bg-white p-3 rounded-full border border-gray-300 shadow-sm flex items-center gap-2 relative overflow-hidden">
                                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                                        <div className="text-gray-400 text-xs typewriter-text">Frock...</div>
                                        {/* Animated Cursor */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 rounded-full border-2 border-white animate-touch-tap"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 opacity-0 animate-fade-in-delayed">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                                <div className="h-24 bg-gray-200 rounded mb-2"></div>
                                                <div className="h-2 bg-gray-200 w-3/4 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ADD TO CART ANIMATION */}
                            {step.animation === 'add_to_cart' && (
                                <div className="w-full max-w-xs bg-white p-4 rounded-xl shadow-lg border border-gray-100 relative">
                                    <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                                    <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-8 w-12 bg-rani-50 border border-rani-500 rounded"></div>
                                        <div className="h-8 w-12 bg-gray-100 border border-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-10 bg-rani-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg relative overflow-hidden">
                                        Add to Cart
                                        <div className="absolute inset-0 bg-white/30 animate-ping-once"></div>
                                    </div>
                                    {/* Animated Hand/Cursor */}
                                    <div className="absolute bottom-4 right-1/2 translate-x-1/2 w-10 h-10 bg-black/10 rounded-full border-4 border-black/20 animate-touch-tap"></div>
                                </div>
                            )}

                            {/* CHECKOUT ANIMATION */}
                            {step.animation === 'checkout' && (
                                <div className="w-full max-w-xs space-y-3">
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                            <div className="h-2 w-20 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-2 w-10 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 relative">
                                        <div className="h-3 w-1/2 bg-green-200 rounded mb-2"></div>
                                        <div className="h-2 w-full bg-green-100 rounded"></div>
                                        <div className="absolute right-2 top-2 text-green-600">✔</div>
                                    </div>
                                    <div className="h-12 bg-luxury-black rounded-lg flex items-center justify-center text-white text-xs font-bold relative">
                                        Confirm Order
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full animate-touch-tap"></div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-black/80 backdrop-blur-xl p-6 text-white z-20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.color} shadow-lg`}>
                            <span className="font-bold text-xs">{step.id}</span>
                        </div>
                        <h3 className="font-bold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                    
                    <div className="mt-6 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">TAP SCREEN TO SKIP</span>
                        {currentStepIndex === TUTORIAL_STEPS.length - 1 && (
                            <Button size="sm" onClick={() => setTutorialOpen(false)} className="bg-white text-black hover:bg-gray-200 border-none font-bold">Start Shopping</Button>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes touch-tap {
                    0% { transform: scale(1); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .animate-touch-tap {
                    animation: touch-tap 1.5s infinite;
                }
                .typewriter-text::after {
                    content: '|';
                    animation: blink 1s infinite;
                }
                @keyframes blink { 50% { opacity: 0; } }
            `}</style>
        </div>
    );
};
