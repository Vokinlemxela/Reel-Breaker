import { CardSet } from "./Enums";
import type { CardData } from "./CardData";
import { Paylines3x3 } from "./Paylines";
export type { Payline } from "./Paylines";

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

export interface LineHit {
    lineId: number;
    lineName: string;
    cardId: string;
    multiplier: number;
    cells: {x: number, y: number}[];
}

export interface SpinResultData {
    grid: SlotCell[][];
    executionStack: ActionCommand[]; // Only contains cards that fired (participated)
    totalDamage: number;
    junkCount: number;
    convertedCells: { x: number, y: number }[];
    grantedOverdrive: boolean;
    lineHits: LineHit[];
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
        let spinHits: LineHit[] = [];

        this.resolveStack(state, stack, (awardedOverdrive) => grantedOverdrive = awardedOverdrive, (hits) => spinHits = hits, localMods);

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
        
        const partCells: {x:number, y:number}[] = [];
        spinHits.forEach(h => h.cells.forEach(c => partCells.push(c)));

        return {
            grid: state.cells,
            executionStack: stack,
            totalDamage,
            junkCount,
            convertedCells: state.convertedCells,
            grantedOverdrive,
            lineHits: spinHits,
            participatingCells: partCells
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

    private resolveStack(state: GridState, outStack: ActionCommand[], onOverdriveAwarded: (v: boolean) => void, onHitsResolved: (hits: LineHit[]) => void, localMods?: {luck:number, dmg:number, mult:number}) {
        const hits = this.evaluatePaylines(state);
        onHitsResolved(hits);
        
        // Build ActionCommand stack ONLY for cards part of a winning line
        const uniqueCells = new Map<string, {x:number, y:number}>();
        for (const hit of hits) {
            for (const cell of hit.cells) {
                uniqueCells.set(`${cell.x},${cell.y}`, cell);
            }
        }

        const initiators: ActionCommand[] = [];
        const normals: ActionCommand[] = [];
        const finishers: ActionCommand[] = [];

        for (const loc of uniqueCells.values()) {
            const cell = state.cells[loc.x][loc.y];
            if (!cell.currentCard) continue;
            
            const cmd = new ActionCommand(cell.currentCard, { x: loc.x, y: loc.y });
            
            // Calculate base damage for this cell depending on how many lines it is part of
            let cellMultiplierSum = 0;
            for (const hit of hits) {
                if (hit.cells.some(c => c.x === loc.x && c.y === loc.y)) {
                    cellMultiplierSum += hit.multiplier;
                }
            }
            
            cmd.finalDamage = cell.currentCard.baseDamage * cellMultiplierSum;
            
            if (cell.currentCard.isInitiator) initiators.push(cmd);
            else if (cell.currentCard.isFinisher) finishers.push(cmd);
            else normals.push(cmd);
        }

        // Build Stack
        outStack.push(...initiators, ...normals, ...finishers.reverse());
        for (let i = 0; i < outStack.length; i++) {
            outStack[i].stackOrder = i + 1;
        }

        // Phase 3: Auras & Consume
        this.executePhase(outStack, state);

        // Phase 4: Apply Local Hacks
        for (const cmd of outStack) {
            if (!cmd.isCancelled) {
                if (localMods?.dmg) cmd.finalDamage += localMods.dmg;
                if (localMods?.mult) cmd.finalDamage *= (1 + localMods.mult);
                cmd.finalDamage = Math.floor(cmd.finalDamage);
            }
        }
        
        // Grant Overdrive if we have ANY Neon Idols winning line
        let hasIdolLine = false;
        for (const hit of hits) {
            const sampleCell = state.cells[hit.cells[0].x][hit.cells[0].y];
            if (sampleCell && sampleCell.currentCard?.cardSet === CardSet.NeonIdols) {
                hasIdolLine = true;
            }
        }
        if (hasIdolLine) onOverdriveAwarded(true);
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

    private evaluatePaylines(state: GridState): LineHit[] {
        const hits: LineHit[] = [];
        
        for (const line of Paylines3x3) {
            let firstCardId: string | null = null;
            let isMatch = true;
            
            for (const pos of line.path) {
                // Bounds checking
                if (pos.x >= GridState.WIDTH || pos.y >= GridState.HEIGHT) {
                    isMatch = false; 
                    break;
                }
                
                const cell = state.cells[pos.x][pos.y];
                if (!cell.currentCard || cell.isConsumed) {
                    isMatch = false;
                    break;
                }
                
                if (firstCardId === null) {
                    firstCardId = cell.currentCard.id;
                } else if (firstCardId !== cell.currentCard.id) {
                    isMatch = false;
                    break;
                }
            }
            
            if (isMatch && firstCardId) {
                hits.push({
                    lineId: line.id,
                    lineName: line.name,
                    cardId: firstCardId,
                    multiplier: line.multiplier,
                    cells: [...line.path]
                });
            }
        }
        
        return hits;
    }

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
