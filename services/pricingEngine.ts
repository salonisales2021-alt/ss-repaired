
import { CartItem, User, PricingRule, OrderSnapshot, UserRole } from '../types';
import { db } from './db';

/**
 * The Pricing Engine is the Single Source of Truth for order calculations.
 * It computes values based on ACTIVE rules and returns a snapshot.
 * It DOES NOT modify the database. It only computes.
 */
export const PricingEngine = {
    
    /**
     * Fetch applicable rules for a specific transaction context
     */
    fetchRules: async (user: User): Promise<PricingRule[]> => {
        // In a real DB, this would be a specific query. 
        // For now, we fetch all and filter in memory to ensure complex logic is handled correctly.
        const allRules = await db.getPricingRules();
        
        const now = new Date();

        return allRules.filter(rule => {
            // 1. Check Date Validity
            const effectiveFrom = new Date(rule.effective_from);
            if (effectiveFrom > now) return false;
            if (rule.effective_to && new Date(rule.effective_to) < now) return false;

            // 2. Check Role Applicability
            // If rule target is null, it applies to everyone. Else must match user role.
            // Also logic for pipeline: if user has a Gaddi, Gaddi rules apply.
            
            // Scenario A: Direct Role Match
            if (rule.target_role === user.role) return true;

            // Scenario B: Pipeline Match (e.g. Gaddi Commission applies if user has Gaddi)
            if (rule.target_role === UserRole.GADDI && user.gaddiId) return true;
            if (rule.target_role === UserRole.AGENT && user.assignedAgentId) return true;
            if (rule.target_role === UserRole.DISTRIBUTOR && user.assignedDistributorId) return true;

            return false;
        }).sort((a, b) => b.priority - a.priority); // High priority first
    },

    /**
     * Compute the final order snapshot.
     * This snapshot is immutable and will be saved with the order.
     */
    computeSnapshot: async (cart: CartItem[], user: User): Promise<OrderSnapshot> => {
        const rules = await PricingEngine.fetchRules(user);
        
        // 1. Base Calculation
        const baseTotal = cart.reduce((sum, item) => sum + (item.pricePerPiece * item.piecesPerSet * item.quantitySets), 0);
        let currentTotal = baseTotal;
        const appliedRules: OrderSnapshot['applied_rules'] = [];

        // 2. Apply Rules Sequentially (Priority Sorted)
        for (const rule of rules) {
            // Skip if min order value not met
            if (rule.min_order_value > 0 && baseTotal < rule.min_order_value) continue;

            let ruleAmount = 0;

            if (rule.calculation_type === 'PERCENTAGE') {
                ruleAmount = baseTotal * (rule.value / 100);
            } else {
                ruleAmount = rule.value;
            }

            // Logic per rule type
            if (rule.rule_type === 'DISCOUNT') {
                currentTotal -= ruleAmount;
                appliedRules.push({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    amount: -ruleAmount, // Negative for discount
                    type: rule.rule_type
                });
            } else if (rule.rule_type === 'COMMISSION') {
                // Commission doesn't usually change the invoice total for the Buyer, 
                // but it records a liability for the Manufacturer.
                // However, for this snapshot, we record it to know the cost of sale.
                appliedRules.push({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    amount: ruleAmount,
                    type: rule.rule_type
                });
            } else if (rule.rule_type === 'MARKUP' || rule.rule_type === 'SHIPPING') {
                currentTotal += ruleAmount;
                appliedRules.push({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    amount: ruleAmount,
                    type: rule.rule_type
                });
            }
        }

        // 3. Construct Snapshot
        return {
            base_total: baseTotal,
            final_total: currentTotal,
            applied_rules: appliedRules,
            settlement_mode: 'AUTO_LEDGER', // Default to Auto, can be toggled by Admin settings later
            pipeline: {
                agent_id: user.assignedAgentId,
                gaddi_id: user.gaddiId,
                distributor_id: user.assignedDistributorId
            },
            pricing_version: 'v1.0' // Versioning for future algorithm changes
        };
    }
};
