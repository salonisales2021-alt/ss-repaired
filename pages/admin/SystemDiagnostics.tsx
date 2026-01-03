
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toaster';
import { verifyGST } from '../../services/gstService';

interface LogEntry {
    id: string;
    timestamp: string;
    testName: string;
    status: 'PENDING' | 'SUCCESS' | 'ERROR';
    latency?: number; // in ms
    details: string;
    modelUsed?: string;
}

export const SystemDiagnostics: React.FC = () => {
    const { toast } = useToast();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            ...entry
        }]);
    };

    const updateLog = (id: string, updates: Partial<LogEntry>) => {
        setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
    };

    const runTest = async (
        testName: string, 
        model: string, 
        fn: (ai: GoogleGenAI) => Promise<string>
    ) => {
        const id = Math.random().toString(36).substr(2, 9);
        const startTime = performance.now();
        
        // Initial Pending Log
        setLogs(prev => [...prev, {
            id,
            timestamp: new Date().toLocaleTimeString(),
            testName,
            status: 'PENDING',
            details: 'Initializing request...',
            modelUsed: model
        }]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const result = await fn(ai);
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            updateLog(id, {
                status: 'SUCCESS',
                latency,
                details: result
            });
        } catch (error: any) {
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            updateLog(id, {
                status: 'ERROR',
                latency,
                details: error.message || "Unknown API Error"
            });
        }
    };

    // --- TEST DEFINITIONS ---

    const testTextGeneration = () => {
        runTest('Basic Text Gen (Flash)', 'gemini-3-flash-preview', async (ai) => {
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: 'Ping. Reply with "Pong" only.',
            });
            return `Response: "${res.text?.trim()}"`;
        });
    };

    const testComplexReasoning = () => {
        runTest('Reasoning (Pro)', 'gemini-3-pro-preview', async (ai) => {
            const res = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: 'Explain quantum entanglement in one sentence.',
            });
            return `Response: "${res.text?.trim()}"`;
        });
    };

    const testSearchGrounding = () => {
        runTest('Google Search Grounding', 'gemini-3-flash-preview', async (ai) => {
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: 'What is the stock price of Google right now?',
                config: { tools: [{ googleSearch: {} }] }
            });
            
            const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            return `Found ${chunks.length} citations. Response: "${res.text?.substring(0, 50)}..."`;
        });
    };

    const testJsonMode = () => {
        runTest('JSON Structured Output', 'gemini-3-flash-preview', async (ai) => {
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: 'List 3 fruits.',
                config: { 
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'ARRAY',
                        items: { type: 'OBJECT', properties: { name: {type: 'STRING'}, color: {type: 'STRING'} } }
                    }
                }
            });
            return `Valid JSON: ${res.text}`;
        });
    };

    const testVision = () => {
        runTest('Vision Analysis', 'gemini-2.5-flash', async (ai) => {
            // 1x1 Red Pixel PNG Base64
            const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: pixel } },
                        { text: "What is the main color in this image? Reply with one word." }
                    ]
                }
            });
            return `Vision response: "${res.text?.trim()}"`;
        });
    };

    const testGSTConnectivity = () => {
        runTest('GST API Verification', 'External Service', async () => {
            const res = await verifyGST('07AAAAA0000A1Z5');
            const isMock = res.legalName.includes('MOCK');
            return `Status: ${res.status}, Entity: ${res.legalName} [${isMock ? 'SIMULATION_MODE' : 'LIVE_API_MODE'}]`;
        });
    };

    const runFullLitmusTest = async () => {
        setIsRunning(true);
        setLogs([]);
        toast("Starting full system diagnostics...", "info");
        
        await testTextGeneration();
        await new Promise(r => setTimeout(r, 500)); // Stagger
        await testComplexReasoning();
        await new Promise(r => setTimeout(r, 500));
        await testJsonMode();
        await new Promise(r => setTimeout(r, 500));
        await testVision();
        await new Promise(r => setTimeout(r, 500));
        await testSearchGrounding();
        await new Promise(r => setTimeout(r, 500));
        await testGSTConnectivity();
        
        setIsRunning(false);
        toast("Diagnostics complete.", "success");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">API Litmus Test</h1>
                    <p className="text-sm text-gray-500">Real-time latency and connectivity diagnostics for Gemini Models & External APIs.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setLogs([])}>Clear Console</Button>
                    <Button onClick={runFullLitmusTest} disabled={isRunning} className={isRunning ? 'animate-pulse' : ''}>
                        {isRunning ? 'Running Diagnostics...' : '▶ Run Full Suite'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Individual Tests</h3>
                    <div className="space-y-3">
                        <TestButton label="Text Generation (Flash)" desc="Low latency, high throughput" onClick={testTextGeneration} />
                        <TestButton label="Complex Reasoning (Pro)" desc="High intelligence, slower" onClick={testComplexReasoning} />
                        <TestButton label="JSON Mode" desc="Structured data extraction" onClick={testJsonMode} />
                        <TestButton label="Vision / Multimodal" desc="Image analysis capabilities" onClick={testVision} />
                        <TestButton label="Search Grounding" desc="Live web data retrieval" onClick={testSearchGrounding} />
                        <TestButton label="GST API Check" desc="Govt Database Connectivity" onClick={testGSTConnectivity} />
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-2">Environment Info</h4>
                        <div className="space-y-1 text-xs text-blue-700 font-mono">
                            <p>API Provider: Google Gen AI SDK</p>
                            <p>Key Present: {process.env.API_KEY ? 'Yes (Protected)' : 'No (Critical)'}</p>
                            <p>Region: Auto-detected</p>
                        </div>
                    </div>
                </div>

                {/* Console Output */}
                <div className="lg:col-span-2 bg-luxury-black rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-gray-700">
                    <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">admin@saloni-sales:~/diagnostics</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-4 custom-scrollbar bg-luxury-black/95">
                        {logs.length === 0 && (
                            <div className="text-gray-600 text-center mt-20 italic">
                                Ready to initialize tests.<br/>
                                Waiting for command...
                            </div>
                        )}
                        
                        {logs.map((log) => (
                            <div key={log.id} className="animate-fade-in-up border-b border-white/5 pb-2 last:border-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-gray-500 text-xs">[{log.timestamp}]</span>
                                    {log.latency && <span className="text-gray-400 text-xs">{log.latency}ms</span>}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <StatusIndicator status={log.status} />
                                    <span className="font-bold text-white">{log.testName}</span>
                                    <span className="text-gray-500 text-xs">({log.modelUsed})</span>
                                </div>
                                <div className={`ml-5 text-xs break-all ${
                                    log.status === 'ERROR' ? 'text-red-400' : 'text-green-300'
                                }`}>
                                    {log.status === 'PENDING' ? <span className="animate-pulse">...</span> : log.details}
                                </div>
                            </div>
                        ))}
                        <div ref={consoleEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const TestButton = ({ label, desc, onClick }: { label: string, desc: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-rani-300 hover:bg-rani-50 transition-all group"
    >
        <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-gray-800 group-hover:text-rani-700">{label}</span>
            <span className="text-gray-300 group-hover:text-rani-400">▶</span>
        </div>
        <span className="text-[10px] text-gray-400 block mt-0.5">{desc}</span>
    </button>
);

const StatusIndicator = ({ status }: { status: string }) => {
    if (status === 'PENDING') return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></div>;
    if (status === 'SUCCESS') return <span className="text-green-500">✔</span>;
    if (status === 'ERROR') return <span className="text-red-500">✖</span>;
    return null;
};
