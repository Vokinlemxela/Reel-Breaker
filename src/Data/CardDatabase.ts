import { CardSet, CardRarity } from "../Core/Enums";
import type { CardData } from "../Core/CardData";
import { RetroJackpotLogic, NeonIdolLogic } from "../Core/CardLogic";

const retroBase = new RetroJackpotLogic();
const neonBase = new NeonIdolLogic();

// 1. Retro Jackpot (Focus: Damage and Finishers)
// Common (Weight 1.0, Dmg 5-8)
// Rare (Weight 0.5, Dmg 12-18)
// Epic (Weight 0.2, Dmg 30-40)
// Legendary (Weight 0.05, Dmg 100+)
const retroCards: CardData[] = [
    { id: "RJ_001", name: "Ржавая Вишня", rarity: CardRarity.Common, icon: "cherry", cardSet: CardSet.RetroJackpot, baseWeight: 1.0, baseDamage: 5, isInitiator: false, isFinisher: false, logic: retroBase },
    { id: "RJ_002", name: "Медный Лимон", rarity: CardRarity.Common, icon: "citrus", cardSet: CardSet.RetroJackpot, baseWeight: 0.9, baseDamage: 6, isInitiator: false, isFinisher: false, logic: retroBase },
    { id: "RJ_003", name: "Старый Колокол", rarity: CardRarity.Common, icon: "bell", cardSet: CardSet.RetroJackpot, baseWeight: 0.8, baseDamage: 8, isInitiator: false, isFinisher: false, logic: retroBase },
    
    { id: "RJ_004", name: "Счастливая Подкова", rarity: CardRarity.Rare, icon: "magnet", cardSet: CardSet.RetroJackpot, baseWeight: 0.5, baseDamage: 12, isInitiator: false, isFinisher: false, logic: retroBase },
    { id: "RJ_005", name: "Неоновый BAR", rarity: CardRarity.Rare, icon: "align-justify", cardSet: CardSet.RetroJackpot, baseWeight: 0.4, baseDamage: 15, isInitiator: false, isFinisher: false, logic: retroBase },
    { id: "RJ_006", name: "Платиновый Знак", rarity: CardRarity.Rare, icon: "dollar-sign", cardSet: CardSet.RetroJackpot, baseWeight: 0.3, baseDamage: 18, isInitiator: false, isFinisher: false, logic: retroBase },
    
    { id: "RJ_007", name: "Ruby 7", rarity: CardRarity.Epic, icon: "diamond", cardSet: CardSet.RetroJackpot, baseWeight: 0.15, baseDamage: 30, isInitiator: false, isFinisher: true, logic: retroBase },
    { id: "RJ_008", name: "Sapphire 77", rarity: CardRarity.Epic, icon: "gem", cardSet: CardSet.RetroJackpot, baseWeight: 0.10, baseDamage: 40, isInitiator: false, isFinisher: true, logic: retroBase },
    
    { id: "RJ_009", name: "The Big Hammer", rarity: CardRarity.Legendary, icon: "hammer", cardSet: CardSet.RetroJackpot, baseWeight: 0.05, baseDamage: 100, isInitiator: false, isFinisher: true, logic: retroBase },
    { id: "RJ_010", name: "Jackpot 777", rarity: CardRarity.Legendary, icon: "crown", cardSet: CardSet.RetroJackpot, baseWeight: 0.02, baseDamage: 250, isInitiator: false, isFinisher: true, logic: retroBase }
];

// 2. Neon Idols (Focus: Glitch Pop Initiation)
// Idols don't scale damage as much, but scale drop probabilities or side synergy
const idolCards: CardData[] = [
    { id: "NI_001", name: "Хатсунэ (Копия)", rarity: CardRarity.Common, icon: "music", cardSet: CardSet.NeonIdols, baseWeight: 0.8, baseDamage: 2, isInitiator: true, isFinisher: false, logic: neonBase },
    { id: "NI_002", name: "Голограмма A", rarity: CardRarity.Common, icon: "user", cardSet: CardSet.NeonIdols, baseWeight: 0.7, baseDamage: 2, isInitiator: true, isFinisher: false, logic: neonBase },
    { id: "NI_003", name: "Голограмма B", rarity: CardRarity.Common, icon: "user", cardSet: CardSet.NeonIdols, baseWeight: 0.7, baseDamage: 2, isInitiator: true, isFinisher: false, logic: neonBase },
    
    { id: "NI_004", name: "Бэк-вокал (Эко)", rarity: CardRarity.Rare, icon: "mic", cardSet: CardSet.NeonIdols, baseWeight: 0.4, baseDamage: 5, isInitiator: true, isFinisher: false, logic: neonBase },
    { id: "NI_005", name: "Танцовщица Неона", rarity: CardRarity.Rare, icon: "activity", cardSet: CardSet.NeonIdols, baseWeight: 0.4, baseDamage: 5, isInitiator: true, isFinisher: false, logic: neonBase },
    { id: "NI_006", name: "Синтезаторный Луп", rarity: CardRarity.Rare, icon: "play", cardSet: CardSet.NeonIdols, baseWeight: 0.35, baseDamage: 6, isInitiator: true, isFinisher: false, logic: neonBase },
    
    { id: "NI_007", name: "Виртуальный Тур", rarity: CardRarity.Epic, icon: "monitor-play", cardSet: CardSet.NeonIdols, baseWeight: 0.15, baseDamage: 12, isInitiator: true, isFinisher: false, logic: neonBase },
    { id: "NI_008", name: "Менеджер Айдолов", rarity: CardRarity.Epic, icon: "briefcase", cardSet: CardSet.NeonIdols, baseWeight: 0.15, baseDamage: 15, isInitiator: true, isFinisher: false, logic: neonBase },
    
    { id: "NI_009", name: "K-POP Королева", rarity: CardRarity.Legendary, icon: "star", cardSet: CardSet.NeonIdols, baseWeight: 0.05, baseDamage: 30, isInitiator: true, isFinisher: false, logic: neonBase },
    { id: "NI_010", name: "Вокалоид 01: ИИ", rarity: CardRarity.Legendary, icon: "cpu", cardSet: CardSet.NeonIdols, baseWeight: 0.03, baseDamage: 50, isInitiator: true, isFinisher: false, logic: neonBase },
];

export const MASTER_CARD_LIST: CardData[] = [...retroCards, ...idolCards];

export function getCardById(id: string): CardData | undefined {
    return MASTER_CARD_LIST.find(c => c.id === id);
}
