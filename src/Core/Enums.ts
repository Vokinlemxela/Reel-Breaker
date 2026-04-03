export const CardSet = {
    None: 0,
    RetroJackpot: 1,
    NeonIdols: 2,
    BeastTamer: 3,
    SugarRush: 4
} as const;
export type CardSet = typeof CardSet[keyof typeof CardSet];

export const CommandPhase = {
    Auras: 0,
    Consume: 1,
    Lines: 2,
    Resonance: 3
} as const;
export type CommandPhase = typeof CommandPhase[keyof typeof CommandPhase];

export const CardRarity = {
    Common: "COMMON",
    Rare: "RARE",
    Epic: "EPIC",
    Legendary: "LEGENDARY"
} as const;
export type CardRarity = typeof CardRarity[keyof typeof CardRarity];
