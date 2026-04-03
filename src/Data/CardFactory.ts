import type { CardData } from "../Core/CardData";
import { MASTER_CARD_LIST } from "./CardDatabase";

export const CardFactory = {
    // Generate a weighted random card from the database
    getRandomCardWeighted(): CardData {
        const totalWeight = MASTER_CARD_LIST.reduce((sum, card) => sum + card.baseWeight, 0);
        let random = Math.random() * totalWeight;
        
        for (const card of MASTER_CARD_LIST) {
            if (random < card.baseWeight) {
                return card;
            }
            random -= card.baseWeight;
        }
        return MASTER_CARD_LIST[MASTER_CARD_LIST.length - 1]; // Fallback
    },

    createGachaPack(): CardData[] {
        const drop: CardData[] = [];
        for (let i = 0; i < 3; i++) {
            drop.push(this.getRandomCardWeighted());
        }
        return drop;
    }
};
