import { PlayerProfile } from "./Core/PlayerProfile";
import { CasinoSession } from "./Core/CasinoSession";
import { FortunaliaEngine } from "./Core/FortunaliaEngine";
import { getCardById } from "./Data/CardDatabase";
import { GambitManager } from "./Core/GambitManager";
import { Paylines3x3 } from "./Core/Paylines";
import { CasinoDatabase } from "./Data/CasinoDataAsset";
import { EventBus } from "./Core/EventBus";
import { UIManager } from "./UI/UIManager";
import type { SceneId } from "./UI/UIManager";
import { DeckBuilderRenderer } from "./UI/DeckBuilderRenderer";
import { GachaRenderer } from "./UI/GachaRenderer";
import { SkillTreeRenderer } from "./UI/SkillTreeRenderer";
import { CollectionRenderer } from "./UI/CollectionRenderer";
import { SaveManager } from "./Core/SaveManager";

declare global {
    interface Window {
        lucide: any;
    }
}

// 1. Core Logic Setup
let profile: PlayerProfile;
const loaded = SaveManager.Instance.loadProfile();
if (loaded) {
    profile = loaded;
} else {
    profile = new PlayerProfile(1000); // Initial cash
    SaveManager.Instance.saveProfile(profile);
}
const gambitManager = new GambitManager();

let session: CasinoSession | null = null;
let engine: FortunaliaEngine | null = null;
let isOverdriveActive: boolean = false;
let isAutoSpinActive: boolean = false;

// 2. DOM Elements Setup
UIManager.initialize();
const deckRenderer = new DeckBuilderRenderer(profile);
void new GachaRenderer(profile, () => updateGlobalUI());
const skillRenderer = new SkillTreeRenderer(profile, () => updateGlobalUI());
const collectionRenderer = new CollectionRenderer(profile);

const navCash = document.getElementById("nav-cash")!;
const navCpu = document.getElementById("nav-cpu")!;
const navDataBar = document.getElementById("nav-data-bar")!;
const navDataText = document.getElementById("nav-data-text")!;
const mNavCashTop = document.getElementById("m-nav-cash-top")!;
const mNavCpuTop = document.getElementById("m-nav-cpu-top")!;

const btnIntroNext = document.getElementById("btn-intro-next")!;
const btnEnterMatrix = document.getElementById("btn-enter-matrix")!;
const introStep1 = document.getElementById("intro-step-1")!;
const introStep2 = document.getElementById("intro-step-2")!;

const btnStartGambit = document.getElementById("btn-start-hustle") as HTMLButtonElement;
const btnStopGambit = document.getElementById("btn-stop-hustle") as HTMLButtonElement;
const gambitControlsStart = document.getElementById("hustle-controls-start")!;
const gambitControlsStop = document.getElementById("hustle-controls-stop")!;
const gambitStatusMsg = document.getElementById("hustle-status-msg")!;
const gambitHead = document.getElementById("gambit-head")!;
const gambitTargetWindow = document.getElementById("gambit-target-window")!;
const logOverlay = document.getElementById("log-overlay")!;

const casinoList = document.getElementById("casino-list")!;
const uiAlertBar = document.getElementById("ui-alert-bar")!;
const uiVault = document.getElementById("ui-vault")!;
const fwWarning = document.getElementById("firewall-warning")!;
const btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
const spinBtnText = document.getElementById("spin-btn-text")!;
const overdriveBadge = document.createElement("div"); // Overdrive badge placeholder
overdriveBadge.className = "absolute -top-4 right-0 bg-pink-500 text-white text-[10px] px-3 py-1 rounded-full font-black hidden-important animate-pulse";
overdriveBadge.textContent = "OVERDRIVE: LUCK x2";
btnSpin.appendChild(overdriveBadge);
const spinWinFlyout = document.getElementById("spin-win-flyout")!;
const btnLeaveCasino = document.getElementById("btn-leave-casino")!;
const slotGridContainer = document.getElementById("slot-grid-container")!;
const paytableContainer = document.getElementById("paytable-container")!;
const btnAutoSpin = document.getElementById("btn-auto-spin") as HTMLButtonElement;
const btnMonteCarlo = document.getElementById("btn-monte-carlo")!;
const btnRecoveryGrind = document.getElementById("btn-recovery-grind")!;

// 3. Helpers
function updateGlobalUI() {
    const cashStr = `$${profile.cash.toLocaleString()}`;
    const cpuStr = `${profile.cpuChips} GC`;
    const dataStrStr = `${profile.dataPoints}/1000`;
    
    // Full Nav
    navCash.textContent = cashStr;
    navCpu.textContent = cpuStr;
    navDataText.textContent = `Golden_Chips: ${dataStrStr}`;
    navDataBar.style.width = `${(profile.dataPoints / 1000) * 100}%`;

    // Mobile Top Bar
    mNavCashTop.textContent = cashStr;
    mNavCpuTop.textContent = cpuStr;

    // Reload renderers if they are active
    if (UIManager.getScene() === "DECK") deckRenderer.render();
    if (UIManager.getScene() === "SKILLS") skillRenderer.render();
    if (UIManager.getScene() === "COLLECTION") collectionRenderer.render();
    
    // Auto-save on significant updates
    SaveManager.Instance.saveProfile(profile);
}

function logMessage(msg: string) {
    const el = document.createElement("div");
    el.className = "log-entry mb-1";
    el.textContent = `> ${msg}`;
    logOverlay.appendChild(el);
}

// 4. Input Wiring & Scene Events
btnIntroNext.addEventListener("click", () => {
    introStep1.classList.add("hidden-important");
    introStep2.classList.remove("hidden-important");
});

btnEnterMatrix.addEventListener("click", () => {
    UIManager.setScene("GRIND");
});

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target as SceneId;
        UIManager.setScene(target);
        if (target === "MAP") renderMap();
        if (target === "DECK") deckRenderer.render();
        if (target === "SKILLS") skillRenderer.render();
        if (target === "COLLECTION") collectionRenderer.render();
    });
});

btnRecoveryGrind.addEventListener("click", () => {
    UIManager.setScene("GRIND");
});

// --- GAMBIT (Timing Minigame) ---
let gambitAnimationId: number | null = null;

btnStartGambit.addEventListener("click", () => gambitManager.startRound());
btnStopGambit.addEventListener("click", () => gambitManager.stopCommand());

EventBus.Instance.on("OnGambitStarted", () => {
    gambitControlsStart.classList.add("hidden-important");
    gambitControlsStop.classList.remove("hidden-important");
    gambitStatusMsg.textContent = "ПОЙМАЙ ОКНО!";
    
    // Animate Pendulum
    const startTime = Date.now();
    const cycleMs = 1000;
    
    const animate = () => {
        if (gambitManager.currentState !== "RUNNING") return;
        
        const elapsed = Date.now() - startTime;
        const pos = (elapsed % cycleMs) / cycleMs; // 0.0 to 1.0
        
        // 0 -> 100% css left position (translate center handled by CSS)
        gambitHead.style.left = `${pos * 100}%`;
        
        gambitAnimationId = requestAnimationFrame(animate);
    };
    
    // Update window size visualizer
    const currentWindowStr = Math.max(
        gambitManager.minSuccessWindowMs, 
        gambitManager.baseSuccessWindowMs - ((gambitManager.currentLevel - 1) * 25)
    );
    const winRatio = (currentWindowStr / cycleMs) * 100;
    gambitTargetWindow.style.width = `${winRatio}%`;
    gambitTargetWindow.style.left = `50%`;
    gambitTargetWindow.style.transform = `translateX(-50%)`;
    
    gambitAnimationId = requestAnimationFrame(animate);
});

EventBus.Instance.on<number>("OnGambitSuccess", (reward) => {
    if (gambitAnimationId) cancelAnimationFrame(gambitAnimationId);
    
    profile.cash += reward;
    updateGlobalUI();
    gambitStatusMsg.textContent = `УСПЕХ: +$${reward} (Сборка X${gambitManager.combo}/3)`;
});

EventBus.Instance.on("OnGambitFail", () => {
    if (gambitAnimationId) cancelAnimationFrame(gambitAnimationId);
    gambitStatusMsg.textContent = "ПРОМАХ! КОМБО СБРОШЕНО.";
    gambitHead.style.left = `50%`; // Reset visual
});

EventBus.Instance.on("OnGambitIdle", () => {
    gambitControlsStop.classList.add("hidden-important");
    gambitControlsStart.classList.remove("hidden-important");
    if (gambitManager.currentState === "IDLE") {
        gambitStatusMsg.textContent = `УРОВЕНЬ ${gambitManager.currentLevel}`;
    }
});

// --- MAP & CASINO ---
function renderMap() {
    casinoList.innerHTML = "";
    Object.values(CasinoDatabase).forEach(casino => {
        const div = document.createElement("div");
        div.className = "bg-slate-900 p-6 rounded-[2rem] border border-white/5 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer flex justify-between items-center transition-all shadow-xl";
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <i data-lucide="layout-grid"></i>
                </div>
                <div>
                   <h3 class="font-black text-lg italic text-slate-100">${casino.name}</h3>
                   <p class="text-[10px] text-slate-500 font-mono font-bold uppercase">Сейф: $${casino.baseVaultHp.toLocaleString()}</p>
                </div>
            </div>
            <button class="px-6 py-3 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs hidden md:block">ВОЙТИ</button>
        `;
        div.addEventListener("click", () => enterCasino(casino.id));
        casinoList.appendChild(div);
    });
    if (window.lucide) window.lucide.createIcons();
}

btnLeaveCasino.addEventListener("click", () => {
    session = null;
    engine = null;
    isOverdriveActive = false;
    isAutoSpinActive = false;
    btnAutoSpin.innerHTML = `AUTO: <span class="text-red-500">OFF</span>`;
    overdriveBadge.classList.add("hidden-important");
    UIManager.setScene("MAP");
});

function enterCasino(id: string) {
    const casinoData = CasinoDatabase[id];
    session = new CasinoSession(casinoData.baseVaultHp);
    
    if (profile.activeDeck.length !== 12) {
        logMessage(`ОШИБКА: ДЕКА НЕ ПОЛНАЯ (ИЛИ ПЕРЕПОЛНЕНА)! НАДО РОВНО 12 КАРТ. (У вас загружено: ${profile.activeDeck.length})`);
        return;
    }

    const fullDeck = profile.activeDeck.map(id => getCardById(id)!).filter(Boolean);
    engine = new FortunaliaEngine(fullDeck);
    
    // Initialize empty 3x3 grid
    slotGridContainer.innerHTML = "";
    for(let i = 0; i < 9; i++) {
        slotGridContainer.innerHTML += `<div id="slot-cell-${i}" class="bg-black rounded-xl border-2 border-white/5 flex items-center justify-center text-3xl font-black text-white shadow-inner transition-all duration-200">?</div>`;
    }
    
    uiAlertBar.style.width = "0%";
    uiVault.textContent = session.vaultHp.toString();
    fwWarning.classList.add("hidden-important");
    
    let paytableHTML = `<div class="grid grid-cols-4 gap-2 mb-2">`;
    Paylines3x3.forEach(line => {
        let gridHTML = `<div class="grid grid-cols-3 grid-rows-3 gap-[2px] bg-slate-950 p-[2px] rounded w-10 h-10 shrink-0 border border-slate-700">`;
        for(let y=0; y<3; y++) {
            for(let x=0; x<3; x++) {
                const isPart = line.path.some(c => c.x === x && c.y === y);
                gridHTML += `<div class="${isPart ? 'bg-yellow-400 shadow-[0_0_5px_rgb(250,204,21)]' : 'bg-slate-800'} rounded-sm"></div>`;
            }
        }
        gridHTML += `</div>`;
        paytableHTML += `
            <div class="flex flex-col items-center justify-center bg-slate-900 border border-white/5 hover:border-white/20 transition-colors rounded p-1" title="${line.name}">
                ${gridHTML}
                <span class="text-[8px] font-black mt-1 text-emerald-400 text-center uppercase leading-tight">${line.name}<br>x${line.multiplier}</span>
            </div>
        `;
    });
    paytableHTML += `</div><div class="mt-2 text-[9px] text-slate-500 block text-center leading-tight">УРОН НАНОСЯТ ТОЛЬКО КАРТЫ СЫГРАВШЕЙ ЛИНИИ. СОВПАДЕНИЕ 3Х IDOLS ДАЕТ OVERDRIVE.</div>`;
    paytableContainer.innerHTML = paytableHTML;

    spinBtnText.textContent = `СПИН ($${getSpinCost()})`;
    
    // Render Local Hacks Store
    renderLocalHacks();
    
    UIManager.setScene("CASINO");
}

function renderLocalHacks() {
    const container = document.getElementById("local-hacks-container")!;
    if (!session) return;
    
    container.innerHTML = `
        <h4 class="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-[0.2em]">Локальные Хаки (Сброс при выходе)</h4>
        <div class="space-y-3">
           <button id="hack-mult" class="w-full flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5 hover:border-slate-600 transition-colors">
               <div class="text-left">
                  <div class="text-sm font-black text-slate-200">Overclock (+x0.5 Урон)</div>
                  <div class="text-[10px] text-slate-500">Повышает множитель текущих комбинаций</div>
               </div>
               <div class="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded">$100</div>
           </button>
           <button id="hack-luck" class="w-full flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5 hover:border-slate-600 transition-colors">
               <div class="text-left">
                  <div class="text-sm font-black text-slate-200">RAM Injector (Удача)</div>
                  <div class="text-[10px] text-slate-500">Повышает шанс спавна дорогих карт</div>
               </div>
               <div class="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded">$150</div>
           </button>
           <button id="hack-dmg" class="w-full flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5 hover:border-slate-600 transition-colors">
               <div class="text-left">
                  <div class="text-sm font-black text-slate-200">Brute Force (+20 Урон)</div>
                  <div class="text-[10px] text-slate-500">Добавляет плоский урон к финальной руке</div>
               </div>
               <div class="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded">$200</div>
           </button>
        </div>
        <div class="mt-4 text-[10px] text-slate-500 grid flex justify-between uppercase">
            <span>Бафф Множителя: +x${session.localMultiplierBonus}</span>
            <span>Бафф Удачи: +${session.localLuckBonus}</span>
            <span>Бафф Урона: +$${session.localDamageBonus}</span>
        </div>
    `;
    
    document.getElementById("hack-mult")!.addEventListener("click", () => buyLocalHack(100, () => session!.localMultiplierBonus += 0.5));
    document.getElementById("hack-luck")!.addEventListener("click", () => buyLocalHack(150, () => session!.localLuckBonus += 1));
    document.getElementById("hack-dmg")!.addEventListener("click", () => buyLocalHack(200, () => session!.localDamageBonus += 20));
}

function buyLocalHack(price: number, applyUpgrade: () => void) {
    if (profile.cash >= price) {
        profile.cash -= price;
        applyUpgrade();
        updateGlobalUI();
        renderLocalHacks();
        logMessage(`УСПЕШНАЯ ПОКУПКА ХАКА ЗА $${price}`);
    } else {
        logMessage(`ОШИБКА: НЕДОСТАТОЧНО СРЕДСТВ ДЛЯ ХАКА!`);
    }
}

btnAutoSpin.addEventListener("click", () => {
    isAutoSpinActive = !isAutoSpinActive;
    if (isAutoSpinActive) {
        btnAutoSpin.innerHTML = `AUTO: <span class="text-emerald-500">ON</span>`;
        // Если кнопка СПИН не нажата и активна — запускаем сразу
        if (!btnSpin.disabled) btnSpin.click();
    } else {
        btnAutoSpin.innerHTML = `AUTO: <span class="text-red-500">OFF</span>`;
    }
});

btnMonteCarlo.addEventListener("click", () => {
    if (!engine) return;
    const spins = 10000;
    const costPerSpin = 50; 
    const totalSpent = spins * costPerSpin;
    let totalDmg = 0;
    
    const handStats: Record<string, number> = {};
    
    for(let i=0; i<spins; i++) {
        // Run with base parameters (entropy 2, basic luck)
        const result = engine.executeSpin(2, 0, false, { luck: 0, mult: 0, dmg: 0 });
        totalDmg += result.totalDamage;
        
        const key = result.lineHits.length > 0 ? `${result.lineHits.length}-Lines` : "PUNT";
        handStats[key] = (handStats[key] || 0) + 1;
    }
    
    const rtp = ((totalDmg / totalSpent) * 100).toFixed(2);
    let st = "";
    Object.keys(handStats).sort().forEach(k => {
        st += `${k}: ${(handStats[k]/spins*100).toFixed(2)}%\n`;
    });
    
    const msg = `[MONTE-CARLO 10K] Return to Player (RTP): ${rtp}%\n` + st;
                
    console.log(msg);
    logMessage(`[ЭМУЛЯТОР 10K] RTP: ${rtp}%. Статистика в консоли браузере.`);
    alert(msg);
});

function getSpinCost(): number {
    if (!session) return 50;
    
    // Skill: Backdoor (-4% cost per level)
    let discount = 1.0;
    if (profile.unlockedSkills['discount']) {
        discount -= (profile.unlockedSkills['discount'] * 0.04);
    }
    
    const baseCostWithDiscount = 50 * discount;
    // Inflation only affects base, no longer exponential
    const inflatedCost = baseCostWithDiscount * (1 + 0.10 * session.inflationCount);
    return Math.floor(inflatedCost);
}

btnSpin.addEventListener("click", () => {
    if (!engine || !session) return;
    const actualCost = getSpinCost();
    
    if (profile.cash < actualCost) {
        logMessage("НЕДОСТАТОЧНО КЕША ДЛЯ СПИНА.");
        isAutoSpinActive = false;
        btnAutoSpin.innerHTML = `AUTO: <span class="text-red-500">OFF</span>`;
        return;
    }
    
    profile.cash -= actualCost;
    updateGlobalUI();
    btnSpin.disabled = true;
    spinBtnText.textContent = "СТАВКА...";
    
    // Reel spinning visual effect (The Golden Heist Feel)
    const animInterval = setInterval(() => {
        for(let i=0; i<9; i++) {
            const el = document.getElementById(`slot-cell-${i}`);
            if (el) {
                const colors = ['bg-fuchsia-500', 'bg-amber-400', 'bg-pink-500', 'bg-slate-700'];
                const rColor = colors[Math.floor(Math.random() * colors.length)];
                el.innerHTML = `<div class="w-full h-full ${rColor} opacity-50 blur-[2px] transition-all duration-75 scale-y-[2.5]"></div>`;
                el.className = "bg-slate-900 rounded-xl border border-amber-400/20 flex items-center justify-center font-black shadow-inner overflow-hidden relative";
            }
        }
    }, 50);
    
    setTimeout(() => {
        clearInterval(animInterval);
        const _luckBonus = profile.unlockedSkills['lucky_seven'] ? profile.unlockedSkills['lucky_seven'] * 0.02 : 0;
        
        // Setup payload for Engine
        const localMods = {
            luck: session!.localLuckBonus,
            dmg: session!.localDamageBonus,
            mult: session!.localMultiplierBonus
        };
        
        // Pass Overdrive and Local Mods
        const result = engine!.executeSpin(2, _luckBonus, isOverdriveActive, localMods);
        
        // Consume Overdrive after spin
        isOverdriveActive = false;
        overdriveBadge.classList.add("hidden-important");
        
        if (result.grantedOverdrive) {
            isOverdriveActive = true;
            overdriveBadge.classList.remove("hidden-important");
            logMessage(`⚡ VIP-СТАТУС: УДАЧА х2 НА СЛЕДУЮЩИЙ ХОД!`);
        }
        
        if (result.convertedCells.length > 0) {
            logMessage(`✨ ОТВЛЕЧЕНИЕ ОХРАНЫ: Идолы убрали мусор (${result.convertedCells.length} шт)!`);
        }

        // Render to UI
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                const i = y * 3 + x;
                const el = document.getElementById(`slot-cell-${i}`);
                if (el) {
                    el.style.opacity = "1";
                    el.style.filter = "blur(0)";
                    
                    const cell = result.grid[x][y];
                    if (cell.currentCard === null) {
                        el.textContent = "X";
                        el.className = "bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center text-3xl font-black text-slate-700 shadow-inner transition-all duration-200 z-0";
                    } else {
                        const nameParts = cell.currentCard.name.split(" ");
                        const abbreviation = nameParts[0].substring(0,2).toUpperCase();
                        el.innerHTML = `<span class="z-10 text-xl font-mono">${abbreviation}</span>`;
                        
                        let baseClass = "bg-slate-800 rounded-xl border-2 flex flex-col items-center justify-center font-black shadow-lg transition-all duration-200 relative overflow-hidden z-10";
                        
                        // Add mini icon representation
                        el.innerHTML += `<i data-lucide="${cell.currentCard.icon}" class="w-6 h-6 absolute opacity-20"></i>`;
                        
                        // Indicators 
                        if (cell.currentCard.isInitiator) {
                            baseClass += " border-amber-400/50 text-amber-300";
                            el.innerHTML += `<div class="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-400"></div>`;
                        } else if (cell.currentCard.isFinisher) {
                            baseClass += " border-fuchsia-500/50 text-fuchsia-400";
                            el.innerHTML += `<div class="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-fuchsia-400"></div>`;
                        } else {
                            baseClass += " border-pink-500/30 text-pink-400";
                        }
                        
                        const isGlitched = result.convertedCells.some(c => c.x === x && c.y === y);
                        if (isGlitched) {
                            baseClass += " animate-pulse ring-4 ring-pink-500 shadow-[0_0_20px_rgba(236,72,153,1)]";
                            el.innerHTML += `<div class="absolute top-0 text-[8px] bg-pink-500 text-black px-1 font-bold">ОТВЛЕЧЕН</div>`;
                        }
                        
                        el.className = baseClass;
                    }
                }
            }
        }
        if (window.lucide) window.lucide.createIcons();
        
        // --- HIGHLIGHT COMBOS (PAYLINES) ---
        let comboModsText = "";
        const participated = result.participatingCells;
        
        // Dim all non-participating cells
        for (let x=0; x<3; x++) {
            for(let y=0; y<3; y++) {
                const el = document.getElementById(`slot-cell-${y*3 + x}`);
                if (!el) continue;
                
                const isPart = participated.some(p => p.x === x && p.y === y);
                if (isPart) {
                    el.classList.add("ring-4", "ring-yellow-400", "shadow-[0_0_30px_rgb(250,204,21)]", "z-30", "scale-105");
                } else if (result.grid[x][y].currentCard) {
                    el.classList.add("opacity-30", "grayscale");
                }
            }
        }
        
        if (result.lineHits.length > 0) {
            result.lineHits.forEach(hit => {
                comboModsText += `${hit.lineName} (x${hit.multiplier}) `;
                logMessage(`💥 ЛИНИЯ СЫГРАЛА: ${hit.lineName} (Множитель x${hit.multiplier})`);
            });
        } else {
            logMessage(`🔴 МУСОРНЫЙ СПИН!`);
        }
        
        if (result.grantedOverdrive) {
            const container = document.getElementById("slot-grid-container")!;
            container.classList.add("ring-8", "ring-fuchsia-500", "shadow-[0_0_50px_rgb(217,70,239)]");
            setTimeout(() => container.classList.remove("ring-8", "ring-fuchsia-500", "shadow-[0_0_50px_rgb(217,70,239)]"), 2000);
            logMessage("🏆 VIP СТАТУС: Overdrive активирован!");
        }
        
        // Output Stack evaluation to log
        logMessage(`Выигрыш зачислен. Итоговый Урон: $${result.totalDamage}. Ставка была: $${actualCost}`);
        
        // Risk Mechanic: Inflation Tracker
        if (result.totalDamage >= (session!.baseVaultHp * 0.05) || result.lineHits.length > 0) {
             if (session!.inflationCount > 0) logMessage(`УРОВЕНЬ ТРЕВОГИ СБРОШЕН! Сейф пробит.`);
             session!.inflationCount = 0;
        } else {
             session!.inflationCount++;
             logMessage(`🔥 ПУСТОЙ ХОД! Охрана нервничает: тревога +${session!.inflationCount * 10}%.`);
        }

        spinBtnText.textContent = `СПИН ($${getSpinCost()})`;
        btnSpin.disabled = false;

        if (result.totalDamage > 0) {
            // Apply Skill: Vault Cracker (+10% damage)
            let finalDmg = result.totalDamage;
            if (profile.unlockedSkills['vault_dmg']) {
                finalDmg = Math.floor(finalDmg * (1 + (profile.unlockedSkills['vault_dmg'] * 0.1)));
            }
            
            profile.cash += finalDmg;
            
            // Apply Skill: Data Miner (+10 Data per win)
            let baseData = 10;
            if (profile.unlockedSkills['data_boost']) {
                baseData += profile.unlockedSkills['data_boost'] * 10;
            }
            profile.addDataPoints(baseData); 
            
            const txtLine = comboModsText.length > 0 ? `<br><span class="text-[8px] text-black bg-white rounded px-1">${comboModsText}</span>` : "";
            spinWinFlyout.innerHTML = `+$${finalDmg}${txtLine}`;
            spinWinFlyout.classList.remove("hidden-important");
            setTimeout(() => { spinWinFlyout.classList.add("hidden-important"); }, 2500);

            session!.damageVault(finalDmg);
            uiVault.textContent = session!.vaultHp.toString();
        }

        if (session!.vaultHp <= 0) {
            logMessage("СЕЙФ УНИЧТОЖЕН! ДОСТУП ПРЕКРАЩЕН.");
            isAutoSpinActive = false;
            btnAutoSpin.innerHTML = `AUTO: <span class="text-red-500">OFF</span>`;
            setTimeout(() => {
                session = null;
                engine = null;
                UIManager.setScene("MAP");
            }, 3000);
        } else if (isAutoSpinActive) {
            // Continuation logic for Auto-spin
            setTimeout(() => {
                if (isAutoSpinActive && !btnSpin.disabled) {
                    btnSpin.click();
                }
            }, 500); // Small pause before next auto-spin
        }

        updateGlobalUI();
        
    }, 800);
});



// INITIALIZE UI
updateGlobalUI();
