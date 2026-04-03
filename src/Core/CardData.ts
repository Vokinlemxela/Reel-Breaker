import { CardSet, CardRarity } from "./Enums";
import type { ActionCommand, GridState, FortunaliaEngine } from "./FortunaliaEngine";

export interface ICardEffect {
    execute(command: ActionCommand, gridState: GridState, engine: FortunaliaEngine): void;
}

export interface CardData {
    id: string;
    name: string;
    rarity: CardRarity;
    icon: string;
    cardSet: CardSet;
    baseWeight: number;
    baseDamage: number;
    isInitiator: boolean;
    isFinisher: boolean;
    logic?: ICardEffect;
}
