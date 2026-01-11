
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { PricingRule, RuleType, UserRole } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toaster';

export const CommercialRules: React.FC = () => {
    const { toast } = useToast();
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState<Partial<PricingRule>>({
        name: '',
        rule_type: 'COMMISSION',
        pipeline_definition: 'DIRECT',
        target_role: undefined,
        calculation_type: 'PERCENTAGE',
        value: 0,
        priority: 0,
        is_locked: false,
        effective_from: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        const data = await db.getPricingRules();
        setRules(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name || formData.value === undefined) {
            toast("Name and Value are required", "warning");
            return;
        }

        const success = await db.savePricingRule({
            ...formData,
            // If creating new, backend handles ID
        });

        if (success) {
            toast("Rule saved successfully", "success");
            setShowModal(false);
            loadRules();
        } else {
            toast("Failed to save rule", "error");
        }
    };

    const openEdit = (rule: PricingRule) => {
        if (rule.is_locked) {
            toast("This rule is locked and cannot be edited. Create a new version.", "warning");
            return;
        }
        setFormData(rule);
        setShowModal(true);
    };

    const openNew = () => {
        setFormData({
            name: '',
            rule_type: 'COMMISSION',
            pipeline_definition: 'DIRECT',
            target_role: undefined,
            calculation_type: 'PERCENTAGE',
            value: 0,
            priority: 0,
            is_locked: false,
            effective_from: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    return (
        <div className="animate-fade-in p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Commercial Rules Engine</h1>
                    <p className="text-sm text-gray-500">Manage commissions, discounts, and markup logic.</p>
                </div>
                <Button onClick={openNew}>+ New Rule</Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Rule Name</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Target</th>
                            <th className="p-4">Value</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rules.map(rule => (
                            <tr key={rule.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{rule.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                        rule.rule_type === 'COMMISSION' ? 'bg-purple-100 text-purple-700' :
                                        rule.rule_type === 'DISCOUNT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {rule.rule_type}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-600">
                                    {rule.target_role || 'ALL ROLES'}
                                </td>
                                <td className="p-4 font-mono font-bold">
                                    {rule.calculation_type === 'PERCENTAGE' ? `${rule.value}%` : `₹${rule.value}`}
                                </td>
                                <td className="p-4">
                                    {rule.is_locked ? <span className="text-red-500 font-bold text-xs">🔒 LOCKED</span> : <span className="text-green-500 text-xs">ACTIVE</span>}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openEdit(rule)} className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Configure Rule</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <Input label="Rule Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                    <select className="w-full border p-2 rounded" value={formData.rule_type} onChange={e => setFormData({...formData, rule_type: e.target.value as any})}>
                                        <option value="COMMISSION">Commission</option>
                                        <option value="DISCOUNT">Discount</option>
                                        <option value="MARKUP">Markup</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Role</label>
                                    <select className="w-full border p-2 rounded" value={formData.target_role || ''} onChange={e => setFormData({...formData, target_role: e.target.value as any || undefined})}>
                                        <option value="">All Roles</option>
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calc Type</label>
                                    <select className="w-full border p-2 rounded" value={formData.calculation_type} onChange={e => setFormData({...formData, calculation_type: e.target.value as any})}>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <Input label="Value" type="number" value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} required />
                            </div>

                            <div className="flex items-center gap-4 border-t pt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_locked} onChange={e => setFormData({...formData, is_locked: e.target.checked})} />
                                    <span className="text-sm font-bold text-gray-700">Lock Rule (Immutable)</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button>Save Rule</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
