/**
 * Temporary session state of the player interacting with a specific Casino.
 * Resets whenever the player enters a new Casino.
 */
export class CasinoSession {
    public vaultHp: number;
    public baseVaultHp: number;
    public alertLevel: number; // 0.0 to 100.0 (Percentage)
    public isFirewallActive: boolean;
    
    // Boss Passive: Inflation
    public inflationCount: number = 0;
    
    // Local Hacks (Purchasable during run)
    public localMultiplierBonus: number = 0.0;
    public localDamageBonus: number = 0;
    public localLuckBonus: number = 0;

    public constructor(initialVaultHp: number) {
        this.baseVaultHp = initialVaultHp;
        this.vaultHp = initialVaultHp;
        this.alertLevel = 0.0;
        this.isFirewallActive = false;
        this.inflationCount = 0;
        this.localMultiplierBonus = 0;
        this.localDamageBonus = 0;
        this.localLuckBonus = 0;
    }

    /**
     * Deals damage to the casino vault.
     * @param amount The damage (win amount).
     * @returns Returns true if the vault is destroyed (<= 0).
     */
    public damageVault(amount: number): boolean {
        this.vaultHp -= amount;
        if (this.vaultHp < 0) this.vaultHp = 0;
        return this.vaultHp === 0;
    }

    /**
     * Increases the alert level.
     * @param percentage Amount to increase the alert (0.0 to 100.0).
     * @param firewallThreshold The threshold at which the firewall activates.
     */
    public increaseAlert(percentage: number, firewallThreshold: number): void {
        if (this.isFirewallActive) return; // Already active

        this.alertLevel += percentage;
        if (this.alertLevel >= 100.0) {
            this.alertLevel = 100.0;
        }

        if (this.alertLevel >= firewallThreshold && !this.isFirewallActive) {
            this.triggerFirewall();
        }
    }

    private triggerFirewall(): void {
        this.isFirewallActive = true;
        // The FortunaliaEngine will observe this state and apply RNG penalties.
    }
}
