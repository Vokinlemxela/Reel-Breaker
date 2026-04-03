export type SymbolId = "CHERRY" | "BAR" | "SEVEN" | "DIAMOND" | "GLITCH";

export interface SymbolRewardData {
    id: SymbolId;
    payoutMultiplier: number; // Applied to bet
    alertPenalty: number;     // How much alert grows if won
}

/**
 * Static configuration for a Casino.
 * Maps to a ScriptableObject in Unity.
 */
export interface CasinoDataAsset {
    id: string;
    name: string;
    baseVaultHp: number;
    firewallThreshold: number; // e.g. 70.0
    
    // Weighted RNG Map (Higher weight = higher chance)
    symbolWeights: Record<SymbolId, number>;
    
    // Reward settings
    symbolRewards: Record<SymbolId, SymbolRewardData>;
}

// Stub Database (in Unity this would be Resources.LoadAll or Addressables)
export const CasinoDatabase: Record<string, CasinoDataAsset> = {
    "tutorial_casino": {
        id: "tutorial_casino",
        name: "Neon Alley Slots",
        baseVaultHp: 5000,
        firewallThreshold: 70.0,
        symbolWeights: {
            "CHERRY": 100, // Common
            "BAR": 50,
            "SEVEN": 20,
            "DIAMOND": 5, // Rare
            "GLITCH": 1   // Ultra rare
        },
        symbolRewards: {
            "CHERRY": { id: "CHERRY", payoutMultiplier: 2, alertPenalty: 2.0 },
            "BAR": { id: "BAR", payoutMultiplier: 5, alertPenalty: 5.0 },
            "SEVEN": { id: "SEVEN", payoutMultiplier: 20, alertPenalty: 15.0 },
            "DIAMOND": { id: "DIAMOND", payoutMultiplier: 100, alertPenalty: 30.0 },
            "GLITCH": { id: "GLITCH", payoutMultiplier: 500, alertPenalty: 50.0 }
        }
    }
};
