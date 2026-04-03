import type { PlayerProfile } from "../Core/PlayerProfile";
import type { CardData } from "../Core/CardData";
import { getCardById, MASTER_CARD_LIST } from "../Data/CardDatabase";
import { CardRarity, CardSet } from "../Core/Enums";

export class DeckBuilderRenderer {
    private inventoryGrid: HTMLElement;
    private deckGrid: HTMLElement;
    private countBadge: HTMLElement;
    private profile: PlayerProfile;
    
    constructor(profile: PlayerProfile) {
        this.profile = profile;
        this.inventoryGrid = document.getElementById("inventory-grid")!;
        this.deckGrid = document.getElementById("deck-grid")!;
        this.countBadge = document.getElementById("deck-count-badge")!;
    }
    
    public render(): void {
        this.inventoryGrid.innerHTML = "";
        this.deckGrid.innerHTML = "";
        
        const currentCount = this.profile.activeDeck.length;
        this.countBadge.textContent = `${currentCount}/12`;
        
        if (currentCount === 12) {
            this.countBadge.className = "px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold transition-colors";
        } else {
            this.countBadge.className = "px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold transition-colors";
        }

        // Render Full Library (All 20 cards)
        MASTER_CARD_LIST.forEach((card) => {
            const isOwned = this.profile.cardInventory.includes(card.id);
            const isEquipped = this.profile.activeDeck.includes(card.id);
            const cardUI = this.createLibraryCardUI(card, isOwned, isEquipped);
            this.inventoryGrid.appendChild(cardUI);
        });
        
        // Render Active Deck
        this.profile.activeDeck.forEach((id) => {
            const card = getCardById(id);
            if (!card) return;
            const cardUI = this.createDeckCardUI(card, () => this.removeFromDeck(id));
            this.deckGrid.appendChild(cardUI);
        });
        
        // Render Empty slots
        for(let i = currentCount; i < 12; i++) {
            const emptySlot = document.createElement("div");
            emptySlot.className = "h-40 rounded-xl border-2 border-dashed border-slate-700/50 flex items-center justify-center text-slate-700 text-xs font-black uppercase";
            emptySlot.textContent = "ПУСТО";
            this.deckGrid.appendChild(emptySlot);
        }

        if (window.lucide) window.lucide.createIcons();
    }
    
    private addToDeck(id: string): void {
        if (this.profile.activeDeck.length >= 12) return; // Full
        if (this.profile.activeDeck.includes(id)) return; // No duplicates allowed
        
        this.profile.activeDeck.push(id);
        this.render();
    }
    
    private removeFromDeck(id: string): void {
        const index = this.profile.activeDeck.indexOf(id);
        if (index > -1) {
            this.profile.activeDeck.splice(index, 1);
        }
        this.render();
    }
    
    private getRarityBorder(rarity: CardRarity): string {
        switch(rarity) {
            case CardRarity.Common: return "border-slate-500 shadow-sm";
            case CardRarity.Rare: return "border-blue-500 shadow-md shadow-blue-500/20";
            case CardRarity.Epic: return "border-purple-500 shadow-lg shadow-purple-500/40";
            case CardRarity.Legendary: return "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse";
            default: return "border-slate-500";
        }
    }

    private getRarityText(rarity: CardRarity): string {
        switch(rarity) {
            case CardRarity.Common: return "text-slate-400";
            case CardRarity.Rare: return "text-blue-400";
            case CardRarity.Epic: return "text-purple-400";
            case CardRarity.Legendary: return "text-yellow-400 font-bold";
            default: return "text-slate-400";
        }
    }

    private createLibraryCardUI(card: CardData, isOwned: boolean, isEquipped: boolean): HTMLElement {
        const div = document.createElement("div");
        
        let borderClass = "border-slate-800 border-2";
        let textClass = "text-slate-600";
        let opacityClass = "opacity-50 grayscale";
        let interactionClass = "cursor-not-allowed";
        let iconName = "help-circle";
        let displayName = "???";
        let hoverContent = "";
        
        if (isOwned) {
            borderClass = this.getRarityBorder(card.rarity) + " border-2";
            textClass = this.getRarityText(card.rarity);
            opacityClass = "opacity-100";
            iconName = card.icon;
            displayName = card.name;
            
            if (isEquipped) {
                opacityClass = "opacity-30 grayscale";
                interactionClass = "cursor-not-allowed";
                hoverContent = `<div class="absolute inset-0 bg-slate-900/80 text-white font-black flex items-center justify-center z-20 text-xs">УСТАНОВЛЕНО</div>`;
            } else {
                interactionClass = "cursor-pointer hover:scale-105 active:scale-95 transition-transform group";
                hoverContent = `<div class="absolute inset-0 bg-emerald-500 text-slate-950 font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 uppercase text-xs">УСТАНОВИТЬ</div>`;
                div.addEventListener("click", () => this.addToDeck(card.id));
            }
        }
        
        div.className = `h-32 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-slate-800/80 ${borderClass} ${opacityClass} ${interactionClass}`;
        
        div.innerHTML = `
            <i data-lucide="${iconName}" class="${textClass} w-8 h-8 mb-1"></i>
            <span class="text-[10px] font-black text-center leading-tight px-1">${displayName}</span>
            ${isOwned ? `<span class="text-[8px] opacity-60 uppercase mt-1 px-2 border border-slate-600 rounded-full">${card.cardSet === CardSet.RetroJackpot ? 'Retro' : 'Idol'}</span>` : ''}
            ${hoverContent}
        `;
        
        return div;
    }

    private createDeckCardUI(card: CardData, onClick: () => void): HTMLElement {
        const div = document.createElement("div");
        const borderClass = this.getRarityBorder(card.rarity);
        const textClass = this.getRarityText(card.rarity);
        
        let baseClass = `h-40 rounded-xl border-4 flex flex-col items-center justify-center cursor-pointer relative group overflow-hidden ${borderClass} bg-slate-800 hover:border-red-500 transition-colors`;
        
        div.className = baseClass;
        
        if (card.isInitiator) {
            div.innerHTML = `<div class="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_5px_yellow]"></div>`;
        } else if (card.isFinisher) {
            div.innerHTML = `<div class="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>`;
        } else {
            div.innerHTML = ``;
        }
        
        div.innerHTML += `
            <i data-lucide="${card.icon}" class="${textClass} w-10 h-10 mb-2"></i>
            <span class="text-xs font-black text-center leading-tight px-2">${card.name}</span>
            <span class="text-[10px] uppercase mt-2 opacity-50 font-bold bg-slate-950 px-2 py-1 rounded-full">${card.cardSet === CardSet.RetroJackpot ? 'Retro' : 'Idols'}</span>
            
            <div class="absolute inset-0 bg-red-600/90 font-bold text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
               ИЗВЛЕЧЬ
            </div>
        `;
        
        div.addEventListener("click", onClick);
        return div;
    }
}
