import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { VisitRequest, VisitType } from '../../types';
import { Button } from '../../components/Button';

export const VisitRequests: React.FC = () => {
    const [visits, setVisits] = useState<VisitRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');

    useEffect(() => {
        loadVisits();
    }, []);

    const loadVisits = async () => {
        setLoading(true);
        const data = await db.getVisitRequests();
        // Sort: Pending first, then by date descending
        const sorted = data.sort((a, b) => {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime();
        });
        setVisits(sorted);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'APPROVED' | 'DECLINED') => {
        setLoading(true);
        await db.updateVisitRequest(id, { status: action });
        await loadVisits();
        setLoading(false);
    };

    const filteredVisits = visits.filter(v => filterStatus === 'ALL' || v.status === filterStatus);

    return (
        <div className="animate-fade-in p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Visit Requests</h1>
                    <p className="text-sm text-gray-500">Manage client appointments and doorstep visits.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadVisits}>Refresh List</Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 mb-6 gap-6">
                {['PENDING', 'APPROVED', 'DECLINED', 'ALL'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`pb-2 text-sm font-bold transition-all ${
                            filterStatus === status 
                            ? 'text-rani-600 border-b-2 border-rani-500' 
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Client</th>
                                <th className="p-4">Visit Type</th>
                                <th className="p-4">Requested Slot</th>
                                <th className="p-4 w-1/3">Notes</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading requests...</td></tr>
                            ) : filteredVisits.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No {filterStatus.toLowerCase()} requests found.</td></tr>
                            ) : (
                                filteredVisits.map(visit => (
                                    <tr key={visit.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{visit.userName}</div>
                                            <div className="text-xs text-gray-500">ID: {visit.userId}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                                                {visit.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-700">{new Date(visit.requestedDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">{visit.requestedTime}</div>
                                        </td>
                                        <td className="p-4 text-gray-600 italic">
                                            {visit.notes || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase
                                                ${visit.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ''}
                                                ${visit.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : ''}
                                                ${visit.status === 'DECLINED' ? 'bg-red-100 text-red-700' : ''}
                                            `}>
                                                {visit.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {visit.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3" onClick={() => handleAction(visit.id, 'APPROVED')}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 h-8 px-3" onClick={() => handleAction(visit.id, 'DECLINED')}>
                                                        Decline
                                                    </Button>
                                                </div>
                                            )}
                                            {visit.status !== 'PENDING' && (
                                                <span className="text-xs text-gray-400">Archived</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
