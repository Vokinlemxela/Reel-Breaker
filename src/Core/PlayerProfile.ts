export class PlayerProfile {
    public cash: number;
    public cpuChips: number;
    public dataPoints: number;
    public alertLevelOffset: number;
    
    // Новые поля для мета-прогрессии
    public unlockedSkills: Record<string, number> = {};
    public blackMarketItems: string[] = [];
    
    public cardInventory: string[] = [];
    public activeDeck: string[] = [];

    constructor(initialCash: number = 0, initialCpu: number = 0) {
        this.cash = initialCash;
        this.cpuChips = initialCpu;
        this.dataPoints = 0;
        this.alertLevelOffset = 0;
        
        // Give 12 default starting cards (IDs) so player can enter casino immediately
        this.activeDeck = [
            "RJ_001", "RJ_002", "RJ_003", "RJ_004", "RJ_005", "RJ_006",
            "NI_001", "NI_002", "NI_003", "NI_004", "NI_005", "NI_006"
        ];
        
        // Add them to inventory as well initially
        this.cardInventory = [...this.activeDeck];
    }

    public addDataPoints(points: number): void {
        this.dataPoints += points;
        while (this.dataPoints >= 1000) {
            this.dataPoints -= 1000;
            this.cpuChips += 1;
        }
    }

    public toJSON(): string {
        return JSON.stringify({
            cash: this.cash,
            cpuChips: this.cpuChips,
            dataPoints: this.dataPoints,
            alertLevelOffset: this.alertLevelOffset,
            unlockedSkills: this.unlockedSkills,
            blackMarketItems: this.blackMarketItems,
            cardInventory: this.cardInventory,
            activeDeck: this.activeDeck
        });
    }

    public fromJSON(jsonStr: string): void {
        const data = JSON.parse(jsonStr);
        this.cash = data.cash || 0;
        this.cpuChips = data.cpuChips || 0;
        this.dataPoints = data.dataPoints || 0;
        this.alertLevelOffset = data.alertLevelOffset || 0;
        this.unlockedSkills = data.unlockedSkills || {};
        this.blackMarketItems = data.blackMarketItems || [];
        
        // Convert any possible String/Object mix from legacy saves to clean IDs
        this.cardInventory = (data.cardInventory || []).map((c: any) => typeof c === 'string' ? c : c?.id || "RJ_001");
        this.activeDeck = (data.activeDeck || []).map((c: any) => typeof c === 'string' ? c : c?.id || "RJ_001");
        
        // Ensure legacy overflowing dataPoints is processed
        if (this.dataPoints >= 1000) {
            const dataToProcess = this.dataPoints;
            this.dataPoints = 0; // Reset and let addDataPoints process it cleanly
            this.addDataPoints(dataToProcess);
        }
    }
}
