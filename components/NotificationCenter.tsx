import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationType } from '../types';
import { Link, useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
    const { notifications, unreadCount, markAsRead } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            setIsOpen(false);
            navigate(link);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'ORDER': return '📦';
            case 'SYSTEM': return '⚙️';
            case 'PROMOTION': return '🎉';
            case 'ALERT': return '⚠️';
            default: return '📢';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-rani-600 transition-colors rounded-full hover:bg-gray-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in origin-top-right">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={() => notifications.forEach(n => !n.isRead && markAsRead(n.id))} className="text-[10px] text-rani-600 font-bold hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleNotificationClick(n.id, n.link)}
                                    className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${!n.isRead ? 'bg-rani-50/20' : ''}`}
                                >
                                    <div className="text-xl shrink-0 mt-1">{getIcon(n.type)}</div>
                                    <div>
                                        <h4 className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    {!n.isRead && <div className="w-2 h-2 bg-rani-500 rounded-full shrink-0 mt-2"></div>}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                        <Link to="#" className="text-xs text-gray-500 hover:text-rani-600">View All History</Link>
                    </div>
                </div>
            )}
        </div>
    );
};