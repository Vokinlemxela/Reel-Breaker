import { CardSet } from "./Enums";
import type { CardData, ICardEffect } from "./CardData";

export interface SlotCell {
    x: number;
    y: number;
    currentCard: CardData | null; // null if Junk
    isConsumed: boolean;
}

export class GridState {
    public static readonly WIDTH = 3;
    public static readonly HEIGHT = 3;

    public cells: SlotCell[][] = [];
    public entropyFloor: number = 0;
    public playerLuck: number = 0;
    public isOverdriveActive: boolean = false;
    public convertedCells: { x: number, y: number }[] = [];

    constructor() {
        this.clear();
    }

    public clear() {
        this.cells = [];
        for (let x = 0; x < GridState.WIDTH; x++) {
            this.cells[x] = [];
            for (let y = 0; y < GridState.HEIGHT; y++) {
                this.cells[x][y] = {
                    x, y,
                    currentCard: null,
                    isConsumed: false
                };
            }
        }
        this.convertedCells = [];
    }
}

export class ActionCommand {
    public sourceCard: CardData;
    public origin: { x: number, y: number };
    public stackOrder: number = 0;
    public finalDamage: number;
    public isCancelled: boolean = false;

    constructor(card: CardData, origin: { x: number, y: number }) {
        this.sourceCard = card;
        this.origin = origin;
        this.finalDamage = card.baseDamage;
    }

    public cancelCommand() {
        this.isCancelled = true;
        this.finalDamage = 0;
    }

    public execute(state: GridState, engine: FortunaliaEngine) {
        if (this.isCancelled || !this.sourceCard.logic) return;
        this.sourceCard.logic.execute(this, state, engine);
    }
}

export type PokerHand = "FIVE_OF_A_KIND" | "FLUSH" | "FOUR_OF_A_KIND" | "FULL_HOUSE" | "THREE_OF_A_KIND" | "TWO_PAIR" | "PAIR" | "HIGH_CARD" | "PUNT";

export interface SpinResultData {
    grid: SlotCell[][];
    executionStack: ActionCommand[]; // Only contains cards that fired (participated)
    totalDamage: number;
    junkCount: number;
    convertedCells: { x: number, y: number }[];
    grantedOverdrive: boolean;
    handName: PokerHand;
    handMultiplier: number;
    handFlatDmg: number;
    participatingCells: { x: number, y: number }[];
}

export class FortunaliaEngine {
    private playerDeck: CardData[];
    
    constructor(deck: CardData[]) {
        this.playerDeck = deck;
    }

    public executeSpin(entropyFloor: number, playerLuck: number, isOverdrive: boolean = false, localMods?: {luck:number, dmg:number, mult:number}): SpinResultData {
        const state = new GridState();
        
        const effectiveLuck = playerLuck + (localMods?.luck || 0);

        // OVERDRIVE: reduce entropy by 50%
        state.entropyFloor = isOverdrive ? Math.floor(entropyFloor * 0.5) : entropyFloor;
        // OVERDRIVE: extra luck boost
        state.playerLuck = isOverdrive ? effectiveLuck + 2 : effectiveLuck;

        this.generateReels(state);
        
        // OVERDRIVE mode flag used in resolveResonance
        state.isOverdriveActive = isOverdrive;
        
        const stack: ActionCommand[] = [];
        let grantedOverdrive = false;
        let handState = {
            name: "PUNT" as PokerHand,
            flatDmg: 0,
            multiplier: 1,
            cells: [] as {x: number, y: number}[]
        };

        this.resolveStack(state, stack, (awardedOverdrive) => grantedOverdrive = awardedOverdrive, (hand) => handState = hand, localMods);

        let totalDamage = 0;
        let junkCount = 0;

        for (let x = 0; x < GridState.WIDTH; x++) {
            for (let y = 0; y < GridState.HEIGHT; y++) {
                if (state.cells[x][y].currentCard === null) junkCount++;
            }
        }

        for (const cmd of stack) {
            totalDamage += cmd.finalDamage;
        }
        
        totalDamage = Math.floor(totalDamage);

        return {
            grid: state.cells,
            executionStack: stack,
            totalDamage,
            junkCount,
            convertedCells: state.convertedCells,
            grantedOverdrive,
            handName: handState.name,
            handMultiplier: handState.multiplier,
            handFlatDmg: handState.flatDmg,
            participatingCells: handState.cells
        };
    }

    public spawnRandomCard(): CardData | null {
        if (this.playerDeck.length === 0) return null;
        let totalWeight = 0;
        for (const card of this.playerDeck) {
            // In Glitch Pop iteration, don't use luck scaling to not double dip Overdrive
            totalWeight += card.baseWeight;
        }
        let rand = Math.random() * totalWeight;
        let accumulated = 0;
        for (const card of this.playerDeck) {
            accumulated += card.baseWeight;
            if (rand <= accumulated) return card;
        }
        return this.playerDeck[0];
    }

    private generateReels(state: GridState) {
        state.clear();
        const totalSize = GridState.WIDTH * GridState.HEIGHT;
        const entropyCount = Math.min(Math.max(state.entropyFloor, 0), totalSize);

        const availableIndices = Array.from({ length: totalSize }, (_, i) => i);
        this.shuffleArray(availableIndices);

        // 1. Set Junk (Entropy)
        for (let i = 0; i < entropyCount; i++) {
            const index = availableIndices[i];
            const x = index % GridState.WIDTH;
            const y = Math.floor(index / GridState.WIDTH);
            state.cells[x][y].currentCard = null;
        }

        if (this.playerDeck.length === 0) return;

        // 2. Calculate Total Weight
        let totalWeight = 0;
        for (const card of this.playerDeck) {
            totalWeight += card.baseWeight * (1 + state.playerLuck);
        }

        // 3. Fill the rest with Signal (Cards)
        for (let i = entropyCount; i < totalSize; i++) {
            const index = availableIndices[i];
            const x = index % GridState.WIDTH;
            const y = Math.floor(index / GridState.WIDTH);

            let rand = Math.random() * totalWeight;
            let accumulated = 0;
            let selectedCard = this.playerDeck[0];

            for (const card of this.playerDeck) {
                accumulated += card.baseWeight * (1 + state.playerLuck);
                if (rand <= accumulated) {
                    selectedCard = card;
                    break;
                }
            }

            state.cells[x][y].currentCard = selectedCard;
            state.cells[x][y].isConsumed = false;
        }
    }

    private resolveStack(state: GridState, outStack: ActionCommand[], onOverdriveAwarded: (v: boolean) => void, onHandResolved: (h: any) => void, localMods?: {luck:number, dmg:number, mult:number}) {
        // Phase 1: Identify Best Hand among non-consumed cells
        const hand = this.evaluatePokerHand(state);
        onHandResolved(hand);
        
        // Phase 2: Build ActionCommand stack ONLY for participating cards
        const initiators: ActionCommand[] = [];
        const normals: ActionCommand[] = [];
        const finishers: ActionCommand[] = [];

        for (const loc of hand.cells) {
            const cell = state.cells[loc.x][loc.y];
            if (!cell.currentCard) continue;
            
            const cmd = new ActionCommand(cell.currentCard, { x: loc.x, y: loc.y });
            if (cell.currentCard.isInitiator) initiators.push(cmd);
            else if (cell.currentCard.isFinisher) finishers.push(cmd);
            else normals.push(cmd);
        }

        // Build Stack
        outStack.push(...initiators, ...normals, ...finishers.reverse());
        for (let i = 0; i < outStack.length; i++) {
            outStack[i].stackOrder = i + 1;
        }

        // Phase 3: Auras & Consume (Executes effects like Glitch Pop)
        this.executePhase(outStack, state);

        // Phase 4: Apply Hand Multiplier and flat damage to final commands
        let flatBonusApplied = false;
        for (const cmd of outStack) {
            if (!cmd.isCancelled) {
                // Apply the Hand's structural flat damage bonus JUST ONCE across the entire hand (we dump it on the first valid card)
                if (!flatBonusApplied) {
                    cmd.finalDamage += hand.flatDmg;
                    flatBonusApplied = true;
                }
                
                // Apply local store flat damage bonus
                if (localMods?.dmg) cmd.finalDamage += localMods.dmg;
                
                cmd.finalDamage *= hand.multiplier;
                
                // Apply local hack multiplier
                if (localMods?.mult) cmd.finalDamage *= (1 + localMods.mult);
                cmd.finalDamage = Math.floor(cmd.finalDamage);
            }
        }
        
        // Grant Overdrive if it's a Neon Idols Flush
        if (hand.name === "FLUSH") {
            const sampleCell = state.cells[hand.cells[0].x][hand.cells[0].y];
            if (sampleCell && sampleCell.currentCard?.cardSet === CardSet.NeonIdols) {
                onOverdriveAwarded(true);
            }
        }
    }

    private executePhase(stack: ActionCommand[], state: GridState) {
        for (const cmd of stack) {
            if (cmd.isCancelled) continue;
            
            const cell = state.cells[cmd.origin.x][cmd.origin.y];
            if (cell.isConsumed) {
                cmd.cancelCommand();
                continue;
            }

            // In MVP, we just execute generic logic. 
            // The `strategy` inside the card checks phase internally if needed.
            cmd.execute(state, this);
        }
    }

    private evaluatePokerHand(state: GridState): { name: PokerHand, flatDmg: number, multiplier: number, cells: {x:number,y:number}[] } {
        // Collect all valid cards
        const allValid: {x:number, y:number, card: CardData}[] = [];
        for (let x=0; x<GridState.WIDTH; x++) {
            for (let y=0; y<GridState.HEIGHT; y++) {
                const c = state.cells[x][y];
                if (c.currentCard && !c.isConsumed) {
                    allValid.push({x, y, card: c.currentCard});
                }
            }
        }
        
        if (allValid.length === 0) return { name: "PUNT", flatDmg: 0, multiplier: 1, cells: [] };

        // Group by ID
        const idGroups = new Map<string, typeof allValid>();
        // Group by Set
        const setGroups = new Map<CardSet, typeof allValid>();

        for (const item of allValid) {
            if (!idGroups.has(item.card.id)) idGroups.set(item.card.id, []);
            idGroups.get(item.card.id)!.push(item);
            
            if (!setGroups.has(item.card.cardSet)) setGroups.set(item.card.cardSet, []);
            setGroups.get(item.card.cardSet)!.push(item);
        }

        // Sort groups by size descending
        const sortedIdGroups = Array.from(idGroups.values()).sort((a,b) => b.length - a.length);
        const largestIdGroup = sortedIdGroups[0] || [];
        const secondLargestIdGroup = sortedIdGroups[1] || [];
        
        const largestSetGroup = Array.from(setGroups.values()).sort((a,b) => b.length - a.length)[0] || [];

        // Condition Checkers (NERFED FOR BALANCE - ANTI-DUPE)
        if (largestIdGroup.length >= 5) {
            return { name: "FIVE_OF_A_KIND", flatDmg: 200, multiplier: 3.0, cells: largestIdGroup.slice(0, 5).map(i => ({x:i.x,y:i.y})) };
        }
        if (largestIdGroup.length >= 4) {
            return { name: "FOUR_OF_A_KIND", flatDmg: 50, multiplier: 2.0, cells: largestIdGroup.slice(0, 4).map(i => ({x:i.x,y:i.y})) };
        }
        if (largestIdGroup.length >= 3 && secondLargestIdGroup.length >= 2) {
            const h = [...largestIdGroup.slice(0, 3), ...secondLargestIdGroup.slice(0, 2)];
            return { name: "FULL_HOUSE", flatDmg: 20, multiplier: 1.5, cells: h.map(i => ({x:i.x,y:i.y})) };
        }
        if (largestIdGroup.length >= 3) {
            return { name: "THREE_OF_A_KIND", flatDmg: 10, multiplier: 1.2, cells: largestIdGroup.slice(0, 3).map(i => ({x:i.x,y:i.y})) };
        }
        // Check FLUSH
        if (largestSetGroup.length >= 5) { 
            return { name: "FLUSH", flatDmg: 5, multiplier: 1.1, cells: largestSetGroup.slice(0, 5).map(i => ({x:i.x,y:i.y})) };
        }
        if (largestIdGroup.length >= 2 && secondLargestIdGroup.length >= 2) {
            const h = [...largestIdGroup.slice(0, 2), ...secondLargestIdGroup.slice(0, 2)];
            return { name: "TWO_PAIR", flatDmg: 5, multiplier: 1.0, cells: h.map(i => ({x:i.x,y:i.y})) };
        }
        if (largestIdGroup.length >= 2) {
            return { name: "PAIR", flatDmg: 0, multiplier: 0.8, cells: largestIdGroup.slice(0, 2).map(i => ({x:i.x,y:i.y})) };
        }

        // HIGH CARD fallback
        const highestDmgItem = [...allValid].sort((a,b) => b.card.baseDamage - a.card.baseDamage)[0];
        return { name: "HIGH_CARD", flatDmg: 0, multiplier: 0.5, cells: [{x:highestDmgItem.x, y:highestDmgItem.y}] };
    }

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
