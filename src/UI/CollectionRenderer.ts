import type { PlayerProfile } from "../Core/PlayerProfile";
import { MASTER_CARD_LIST } from "../Data/CardDatabase";
import { CardSet, CardRarity } from "../Core/Enums";
import type { CardData } from "../Core/CardData";

export class CollectionRenderer {
    private profile: PlayerProfile;
    private viewPacks: HTMLElement;
    private viewDetails: HTMLElement;
    private grid: HTMLElement;
    private btnBack: HTMLButtonElement;
    private setTitle: HTMLElement;

    constructor(profile: PlayerProfile) {
        this.profile = profile;
        this.viewPacks = document.getElementById("collection-view-packs")!;
        this.viewDetails = document.getElementById("collection-view-details")!;
        this.grid = document.getElementById("collection-grid")!;
        this.btnBack = document.getElementById("btn-collection-back") as HTMLButtonElement;
        this.setTitle = document.getElementById("collection-set-title")!;

        this.btnBack.addEventListener("click", () => this.showPacksView());
    }

    public render() {
        this.showPacksView();
    }

    private showPacksView() {
        this.viewPacks.classList.remove("hidden-important");
        this.viewDetails.classList.add("hidden-important");
        this.viewPacks.innerHTML = "";

        const sets = [
            { id: CardSet.RetroJackpot, name: "Retro Jackpot Archive", icon: "box", color: "text-emerald-400", border: "border-emerald-500/50" },
            { id: CardSet.NeonIdols, name: "Neon Idols Archive", icon: "music", color: "text-pink-400", border: "border-pink-500/50" }
        ];

        sets.forEach(setInfo => {
            const setCards = MASTER_CARD_LIST.filter(c => c.cardSet === setInfo.id);
            const unlockedCount = setCards.filter(c => this.profile.cardInventory.includes(c.id)).length;
            const isCompleted = unlockedCount === setCards.length;

            const div = document.createElement("div");
            div.className = `p-8 rounded-[2rem] border-4 ${setInfo.border} bg-slate-900/80 cursor-pointer hover:scale-105 transition-all flex flex-col items-center justify-center text-center shadow-xl group`;
            
            div.innerHTML = `
                <i data-lucide="${setInfo.icon}" class="${setInfo.color} w-16 h-16 mb-4 group-hover:animate-bounce"></i>
                <h3 class="text-2xl font-black mb-2 uppercase tracking-widest text-white">${setInfo.name}</h3>
                <div class="text-sm font-mono font-bold ${isCompleted ? 'text-yellow-400' : 'text-slate-500'}">
                    ОТКРЫТО: ${unlockedCount} / ${setCards.length}
                </div>
            `;
            
            div.addEventListener("click", () => this.showSetDetails(setInfo.id, setInfo.name));
            this.viewPacks.appendChild(div);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    private showSetDetails(setId: CardSet, setName: string) {
        this.viewPacks.classList.add("hidden-important");
        this.viewDetails.classList.remove("hidden-important");
        this.setTitle.textContent = setName;

        this.grid.innerHTML = "";

        const setCards = MASTER_CARD_LIST.filter(c => c.cardSet === setId);

        setCards.forEach(card => {
            const isUnlocked = this.profile.cardInventory.includes(card.id);
            const cardEl = this.createCollectionCard(card, isUnlocked);
            this.grid.appendChild(cardEl);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    private createCollectionCard(card: CardData, isUnlocked: boolean): HTMLElement {
        const div = document.createElement("div");

        if (!isUnlocked) {
            div.className = "aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center relative";
            div.innerHTML = `<i data-lucide="lock" class="text-slate-600 w-8 h-8 mb-2"></i> <span class="text-[10px] text-slate-600 font-black tracking-widest uppercase">LOCKED</span>`;
            return div;
        }

        const borderMap = {
            [CardRarity.Common]: "border-slate-500 shadow-sm",
            [CardRarity.Rare]: "border-blue-500 shadow-md shadow-blue-500/20",
            [CardRarity.Epic]: "border-purple-500 shadow-lg shadow-purple-500/40",
            [CardRarity.Legendary]: "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse"
        };
        const textMap = {
            [CardRarity.Common]: "text-slate-400",
            [CardRarity.Rare]: "text-blue-400",
            [CardRarity.Epic]: "text-purple-400",
            [CardRarity.Legendary]: "text-yellow-400 font-bold"
        };

        div.className = `aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center relative group overflow-hidden bg-slate-800 transition-all ${borderMap[card.rarity]}`;

        div.innerHTML = `
            <div class="absolute top-2 left-2 text-[8px] font-black opacity-50 uppercase">${card.id.split('_')[1]}</div>
            <i data-lucide="${card.icon}" class="${textMap[card.rarity]} w-10 h-10 mb-2"></i>
            <span class="text-[10px] font-black text-center leading-tight px-1">${card.name}</span>
            <div class="mt-2 text-[10px] font-bold ${textMap[card.rarity]} uppercase">${card.rarity}</div>
            
            <div class="absolute inset-0 bg-slate-950/95 hidden group-hover:flex flex-col justify-center p-3 text-center pointer-events-none z-20">
                <span class="text-[10px] font-bold mb-2 text-white border-b border-slate-700 pb-1">ДЕТАЛИ</span>
                <span class="text-[9px] text-red-400 mb-1">УРОН: ${card.baseDamage}</span>
                <span class="text-[9px] text-blue-400 mb-1">ДРОП: ${(card.baseWeight * 100).toFixed(0)}%</span>
                ${card.isInitiator ? '<span class="text-[9px] text-yellow-400 mt-2 font-bold uppercase">Initiator (Glitch Pop)</span>' : ''}
                ${card.isFinisher ? '<span class="text-[9px] text-red-500 mt-2 font-bold uppercase">Finisher</span>' : ''}
            </div>
        `;

        return div;
    }
}
