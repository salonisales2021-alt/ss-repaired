import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { NotificationType } from '../../types';

export const Announcements: React.FC = () => {
    const { addNotification, users } = useApp();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NotificationType>('PROMOTION');
    const [target, setTarget] = useState('ALL');
    const [isSent, setIsSent] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        
        let recipientCount = 0;

        if (target === 'ALL') {
            addNotification({
                recipientId: 'ALL',
                title,
                message,
                type,
            });
            recipientCount = users.length;
        } else {
            // Filter users by role and send individual notifications (In real app, backend handles group targeting)
            const targets = users.filter(u => u.role === target);
            targets.forEach(u => {
                addNotification({
                    recipientId: u.id,
                    title,
                    message,
                    type,
                });
            });
            recipientCount = targets.length;
        }

        setIsSent(true);
        setTimeout(() => {
            setIsSent(false);
            setTitle('');
            setMessage('');
        }, 3000);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Announcements</h1>
            <p className="text-sm text-gray-500 mb-8">Broadcast messages to your customers and partners.</p>

            <div className="bg-white p-8 rounded shadow-sm border border-gray-200">
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Target Audience</label>
                            <select 
                                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-rani-500 bg-white"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            >
                                <option value="ALL">All Users (Broadcast)</option>
                                <option value="RETAILER">Retailers Only</option>
                                <option value="DISTRIBUTOR">Distributors Only</option>
                                <option value="AGENT">Agents Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Alert Type</label>
                            <select 
                                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-rani-500 bg-white"
                                value={type}
                                onChange={(e) => setType(e.target.value as NotificationType)}
                            >
                                <option value="PROMOTION">🎉 Promotion / Sale</option>
                                <option value="SYSTEM">⚙️ System Update</option>
                                <option value="ALERT">⚠️ Important Alert</option>
                                <option value="ORDER">📦 Logistics Update</option>
                            </select>
                        </div>
                    </div>

                    <Input 
                        label="Subject Line" 
                        placeholder="e.g. New Winter Collection Dropping Tomorrow!"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Message Body</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-rani-500 h-32"
                            placeholder="Type your announcement here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button disabled={isSent} className={isSent ? 'bg-green-600' : ''}>
                            {isSent ? 'Sent Successfully!' : 'Broadcast Message'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* History Preview (Mock) */}
            <div className="mt-12">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Broadcasts</h3>
                <div className="space-y-4 opacity-70">
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-sm">Diwali Collection Live!</span>
                            <span className="text-xs text-gray-500">Yesterday</span>
                        </div>
                        <p className="text-xs text-gray-600">Sent to: All Users</p>
                    </div>
                </div>
            </div>
        </div>
    );
};