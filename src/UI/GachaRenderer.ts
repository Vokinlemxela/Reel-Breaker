import type { PlayerProfile } from "../Core/PlayerProfile";
import { CardFactory } from "../Data/CardFactory";
import { CardRarity } from "../Core/Enums";
import type { CardData } from "../Core/CardData";

export class GachaRenderer {
    private profile: PlayerProfile;
    private onUpdateUI: () => void;
    
    private btnBuy: HTMLButtonElement;
    private overlay: HTMLElement;
    private title: HTMLElement;
    private cardsContainer: HTMLElement;
    private btnClose: HTMLButtonElement;

    constructor(profile: PlayerProfile, onUpdateUI: () => void) {
        this.profile = profile;
        this.onUpdateUI = onUpdateUI;
        
        this.btnBuy = document.getElementById("btn-buy-pack") as HTMLButtonElement;
        this.overlay = document.getElementById("gacha-reveal-overlay")!;
        this.title = document.getElementById("gacha-title")!;
        this.cardsContainer = document.getElementById("gacha-cards-container")!;
        this.btnClose = document.getElementById("btn-gacha-close") as HTMLButtonElement;
        
        this.btnBuy.addEventListener("click", () => this.buyPack());
        this.btnClose.addEventListener("click", () => this.closeReveal());
    }

    private buyPack() {
        const cost = 200;
        if (this.profile.cash < cost) {
            this.btnBuy.classList.add("animate-ping");
            setTimeout(() => this.btnBuy.classList.remove("animate-ping"), 300);
            alert("ОШИБКА: НЕДОСТАТОЧНО КЕША ДЛЯ ПОКУПКИ!");
            return;
        }
        
        this.profile.cash -= cost;
        this.onUpdateUI();
        
        const dropCards = CardFactory.createGachaPack();
        this.showRevealAnimation(dropCards);
    }

    private getDuplicateValue(rarity: CardRarity): number {
        switch (rarity) {
            case CardRarity.Common: return 50;
            case CardRarity.Rare: return 150;
            case CardRarity.Epic: return 500;
            case CardRarity.Legendary: return 2000;
            default: return 50;
        }
    }

    private getRarityColor(rarity: CardRarity): string {
        switch (rarity) {
            case CardRarity.Common: return "text-slate-400 border-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.3)]";
            case CardRarity.Rare: return "text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]";
            case CardRarity.Epic: return "text-purple-400 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]";
            case CardRarity.Legendary: return "text-yellow-400 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,1)]";
            default: return "text-slate-400 border-slate-500";
        }
    }

    private showRevealAnimation(dropCards: CardData[]) {
        this.overlay.classList.remove("hidden-important");
        this.cardsContainer.innerHTML = "";
        
        // Reset states
        this.title.style.opacity = "0";
        this.btnClose.style.opacity = "0";
        this.btnClose.style.pointerEvents = "none";
        
        // Fade in title
        setTimeout(() => {
            this.title.style.opacity = "1";
        }, 100);
        
        // Process & Spawn cards
        dropCards.forEach((card, index) => {
            // Check Duplicate
            const isDuplicate = this.profile.cardInventory.includes(card.id);
            const dupeValue = this.getDuplicateValue(card.rarity);
            
            if (!isDuplicate) {
                this.profile.cardInventory.push(card.id);
            } else {
                this.profile.addDataPoints(dupeValue);
            }

            setTimeout(() => {
                const cardEl = document.createElement("div");
                const styleColors = this.getRarityColor(card.rarity);
                
                cardEl.className = `w-44 h-64 rounded-2xl border-4 ${styleColors} bg-slate-900 flex flex-col items-center justify-center transition-all opacity-0 translate-y-10 scale-50 relative overflow-hidden`;
                
                const baseHTML = `
                    <div class="text-[10px] font-black uppercase opacity-70 absolute top-2">${card.rarity}</div>
                    <i data-lucide="${card.icon}" class="w-12 h-12 mb-2"></i>
                    <div class="text-sm font-black text-center px-2 leading-tight">${card.name}</div>
                    <div class="text-[10px] uppercase mt-4 bg-slate-950 px-3 py-1 rounded-full border border-white/10">${card.cardSet === 1 ? 'Retro' : 'Idol'}</div>
                `;

                if (isDuplicate) {
                    // Start normal, then glitch into Data
                    cardEl.innerHTML = baseHTML;
                    
                    // Trigger glitch after a brief pause
                    setTimeout(() => {
                        cardEl.className = `w-44 h-64 rounded-2xl border-4 border-emerald-500 text-emerald-400 bg-slate-950 flex flex-col items-center justify-center transition-all animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)] relative overflow-hidden`;
                        cardEl.innerHTML = `
                            <div class="absolute inset-0 flex items-center justify-center font-mono opacity-20 text-[60px] blur-sm">0101</div>
                            <i data-lucide="cpu" class="w-16 h-16 mb-2"></i>
                            <div class="text-lg font-black uppercase tracking-widest text-white">DUPLICATE</div>
                            <div class="text-2xl font-mono font-bold mt-2">+${dupeValue} DATA</div>
                        `;
                        if (window.lucide) window.lucide.createIcons();
                    }, 1200);
                } else {
                    cardEl.innerHTML = baseHTML + `<div class="absolute bottom-2 text-yellow-400 text-[10px] font-black animate-bounce uppercase">NEW CARD!</div>`;
                }
                
                this.cardsContainer.appendChild(cardEl);
                if (window.lucide) window.lucide.createIcons();
                
                // Trigger CSS pop-in
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        cardEl.classList.remove("opacity-0", "translate-y-10", "scale-50");
                    }, 50);
                });
                
            }, 600 + (index * 600)); // slightly slower reveal
        });
        
        // Show close button and save
        setTimeout(() => {
            this.btnClose.style.opacity = "1";
            this.btnClose.style.pointerEvents = "all";
            this.onUpdateUI(); // Commit saves after reveal
        }, 600 + (3 * 600) + 1200);
    }

    private closeReveal() {
        this.overlay.classList.add("hidden-important");
    }
}
