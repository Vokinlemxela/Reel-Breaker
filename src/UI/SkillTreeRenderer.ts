import { PlayerProfile } from "../Core/PlayerProfile";
import { SKILL_TREE } from "../Data/SkillDataAsset";

export class SkillTreeRenderer {
    private profile: PlayerProfile;
    private onUpdateMainUI: () => void;
    private container: HTMLElement;
    constructor(profile: PlayerProfile, onUpdateMainUI: () => void) {
        this.profile = profile;
        this.onUpdateMainUI = onUpdateMainUI;
        this.container = document.getElementById("skill-tree-container")!;
    }

    public render() {
        if (!this.container) return;
        
        // Remove old nodes (keep svg lines placeholder)
        Array.from(this.container.children).forEach(child => {
            if (child.id !== "skill-tree-lines") child.remove();
        });

        // Map skill items to Grid positions
        // Grid is 3 cols x 4 rows
        SKILL_TREE.forEach(skill => {
            // CSS grid rows are 1-based mapping to Tiers
            const rowStart = skill.tier;
            const colStart = skill.col;

            const isMaxed = (this.profile.unlockedSkills[skill.id] || 0) >= skill.maxLevel;
            const currentLevel = this.profile.unlockedSkills[skill.id] || 0;
            const isPurchasable = !isMaxed && this.checkDependencies(skill.dependsOn) && this.profile.cpuChips >= skill.baseCost;
            
            const node = document.createElement("div");
            node.className = `row-start-${rowStart} col-start-${colStart} flex flex-col items-center justify-center relative z-10 hover:z-50`;
            node.id = `node-${skill.id}`;

            let bgColor = "bg-slate-800";
            let borderColor = "border-slate-700";
            let textColor = "text-slate-500";
            let cursor = "cursor-not-allowed";

            if (isMaxed) {
                bgColor = "bg-amber-900/50";
                borderColor = "border-amber-400";
                textColor = "text-amber-300";
                cursor = "cursor-default";
            } else if (isPurchasable) {
                bgColor = "bg-fuchsia-900/30 hover:bg-fuchsia-800/50";
                borderColor = "border-fuchsia-500";
                textColor = "text-fuchsia-400";
                cursor = "cursor-pointer hover:scale-105 transition-transform active:scale-95";
            } else if (this.checkDependencies(skill.dependsOn)) {
                // Available to buy but no money
                bgColor = "bg-slate-800";
                borderColor = "border-slate-500";
                textColor = "text-slate-300";
                cursor = "cursor-not-allowed";
            }

            node.innerHTML = `
                <div class="w-14 h-14 rounded-2xl ${bgColor} border-2 ${borderColor} flex items-center justify-center ${cursor} shadow-xl mb-2 relative group">
                   <i data-lucide="${skill.icon}" class="${textColor} w-6 h-6"></i>
                   
                   ${currentLevel > 0 ? `<div class="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center pointer-events-none">${currentLevel}</div>` : ''}
                   
                   <!-- Tooltip -->
                   <div class="absolute top-[110%] w-64 bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100]">
                      <div class="text-xs font-black text-white uppercase tracking-widest mb-2">${skill.name}</div>
                      <div class="text-[10px] text-slate-400 mb-2">${skill.desc}</div>
                      <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                         <span class="text-xs text-slate-500">Ур. ${currentLevel}/${skill.maxLevel}</span>
                         <span class="text-xs font-black ${this.profile.cpuChips >= skill.baseCost ? 'text-amber-400' : 'text-red-500'}">ЦЕНА: ${skill.baseCost} GC</span>
                      </div>
                   </div>
                </div>
                <div class="text-[10px] font-bold text-center w-full uppercase tracking-widest ${isMaxed ? 'text-amber-400' : 'text-slate-500'}">${skill.name}</div>
            `;

            if (isPurchasable) {
                const btn = node.querySelector('.w-14') as HTMLElement;
                btn.addEventListener("click", () => this.purchaseSkill(skill.id, skill.baseCost));
            }

            this.container.appendChild(node);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    private checkDependencies(deps: string[]): boolean {
        if (deps.length === 0) return true;
        for (const dep of deps) {
            // Need at least 1 point in dep
            if (!this.profile.unlockedSkills[dep] || this.profile.unlockedSkills[dep] < 1) return false;
        }
        return true;
    }

    private purchaseSkill(skillId: string, cost: number) {
        if (this.profile.cpuChips < cost) return;
        this.profile.cpuChips -= cost;
        this.profile.unlockedSkills[skillId] = (this.profile.unlockedSkills[skillId] || 0) + 1;
        this.render();
        this.onUpdateMainUI();
    }
}
