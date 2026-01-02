
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../components/Button';
import { handleAiError } from '../../services/db';

export const MarketTrends: React.FC = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [sources, setSources] = useState<any[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResult('');
        setSources([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Using gemini-3-flash-preview for high-performance search grounding
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            if (response.text) {
                setResult(response.text);
            }

            // Extract sources from grounding metadata
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const chunks = response.candidates[0].groundingMetadata.groundingChunks;
                const webSources = chunks
                    .filter((c: any) => c.web?.uri && c.web?.title)
                    .map((c: any) => ({
                        title: c.web.title,
                        uri: c.web.uri
                    }));
                setSources(webSources);
            }

        } catch (error: any) {
            const handled = await handleAiError(error);
            if (!handled) {
                setResult("Failed to fetch market insights: " + (error.message || "Unknown error"));
            }
        } finally {
            setLoading(false);
        }
    };

    const suggestedQueries = [
        "Trending colors for kids ethnic wear 2025 India",
        "Wholesale price trends for cotton frocks in Delhi",
        "Top competitors for luxury kids wear in India",
        "Upcoming kids fashion festivals and exhibitions"
    ];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Market Intelligence</h1>
                <p className="text-sm text-gray-500">Real-time market research powered by Google Search.</p>
            </div>

            <div className="bg-white p-6 rounded shadow-sm border border-gray-200 mb-8">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded focus:ring-1 focus:ring-rani-500 outline-none transition-all"
                            placeholder="Ask about trends, competitors, or material prices..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button disabled={loading} className="px-8">
                        {loading ? 'Analyzing...' : 'Search'}
                    </Button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                    {suggestedQueries.map((q, i) => (
                        <button 
                            key={i} 
                            onClick={() => setQuery(q)}
                            className="text-xs bg-gray-100 hover:bg-rani-50 text-gray-600 hover:text-rani-600 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {(result || loading) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 rounded shadow-sm border border-gray-200 min-h-[200px]">
                            <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rani-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI Insight
                            </h2>
                            
                            {loading ? (
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                                    {result}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 p-6 rounded border border-gray-200 h-full">
                            <h3 className="font-bold text-sm text-gray-600 uppercase tracking-wider mb-4">Sources</h3>
                            {loading ? (
                                <div className="space-y-2">
                                    <div className="h-8 bg-gray-200 rounded"></div>
                                    <div className="h-8 bg-gray-200 rounded"></div>
                                </div>
                            ) : sources.length > 0 ? (
                                <ul className="space-y-3">
                                    {sources.map((s, idx) => (
                                        <li key={idx}>
                                            <a 
                                                href={s.uri} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="block p-3 bg-white border border-gray-200 rounded hover:border-rani-300 hover:shadow-sm transition-all group"
                                            >
                                                <div className="text-xs font-bold text-gray-800 group-hover:text-rani-600 line-clamp-2">{s.title}</div>
                                                <div className="text-[10px] text-gray-400 mt-1 truncate">{s.uri}</div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400">No citations returned.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
