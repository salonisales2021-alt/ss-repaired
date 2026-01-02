
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { GoogleGenAI } from "@google/genai";

interface PartnerLocation {
    name: string;
    type: 'Distributor' | 'Logistics Hub' | 'Experience Centre';
    address: string;
    contact: string;
    distance?: string;
}

export const DistributorFinder: React.FC = () => {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<PartnerLocation[]>([]);
    const [analysis, setAnalysis] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setResults([]);
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Using gemini-2.5-flash for maps grounding
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Search for kids wear distributors, wholesale textile markets, and transport hubs near "${query}" in India. 
                Identify if there are any specific "Saloni Sales" or "Huria" family businesses in this area.
                Return a friendly summary of logistics availability and a list of locations.`,
                config: {
                    tools: [{ googleMaps: {} }],
                },
            });

            if (response.text) {
                setAnalysis(response.text);
            }

            // Extract locations from grounding metadata if available
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                // Fix: Changed 'Partner Hub' to 'Logistics Hub' to match the PartnerLocation type definition
                const mapResults: PartnerLocation[] = chunks
                    .filter((c: any) => c.maps)
                    .map((c: any) => ({
                        name: c.maps.title,
                        type: 'Logistics Hub',
                        address: 'See map for details',
                        contact: 'Contact Saloni Support for verification'
                    }));
                setResults(mapResults);
            }

        } catch (error) {
            console.error(error);
            alert("Search failed. Please try a valid city or pincode.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 font-heading mb-3">{t('finder.title')}</h1>
                    <p className="text-gray-600">{t('finder.subtitle')}</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-12 animate-fade-in-up">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rani-500 outline-none transition-all text-lg"
                                placeholder={t('finder.pincodePlaceholder')}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <Button size="lg" disabled={isSearching} className="px-12 rounded-xl h-auto">
                            {isSearching ? t('finder.searching') : t('finder.checkButton')}
                        </Button>
                    </form>
                    <p className="mt-6 text-center text-xs text-gray-400 italic">{t('finder.howItWorks')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Results Analysis */}
                    <div className="lg:col-span-2">
                        {isSearching ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-4">
                                <div className="h-6 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                            </div>
                        ) : analysis ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🌍</span> Coverage Analysis
                                </h2>
                                <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {analysis}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 3.618C9.227 3.618 9.452 3.69 9.645 3.82L15 7z" /></svg>
                                </div>
                                <p>Search for your city to find logistics routes.</p>
                            </div>
                        )}
                    </div>

                    {/* Quick List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 ml-1 uppercase text-xs tracking-widest">{t('finder.resultsTitle')}</h3>
                        {results.length > 0 ? results.map((r, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-rani-300 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 group-hover:text-rani-600 transition-colors">{r.name}</h4>
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">{r.type}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">{r.address}</p>
                                <Button size="sm" variant="outline" className="text-[10px] h-8 px-3" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(r.name + ' ' + query)}`, '_blank')}>
                                    View on Map
                                </Button>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 italic p-4 bg-gray-100 rounded-lg">Results will appear after search.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
