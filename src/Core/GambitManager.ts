import { EventBus } from "./EventBus";

export type GambitState = "IDLE" | "RUNNING" | "STOPPED";

export class GambitManager {
    public currentState: GambitState = "IDLE";
    public currentLevel: number = 1;
    public combo: number = 0;
    
    private gameStartTime: number = 0;
    private readonly CYCLE_DURATION_MS = 1000; // How fast the pendulum swings back and forth
    
    // Configurable
    public baseSuccessWindowMs = 300; // Starts easy
    public minSuccessWindowMs = 100;  // Hardest

    public startRound(): void {
        this.currentState = "RUNNING";
        this.gameStartTime = Date.now();
        EventBus.Instance.emit("OnGambitStarted");
    }

    public stopCommand(): void {
        if (this.currentState !== "RUNNING") return;
        this.currentState = "STOPPED";
        const stopTime = Date.now();
        
        // Calculate where the pendulum is in its cycle (0.0 to 1.0)
        const elapsed = stopTime - this.gameStartTime;
        const cyclePosition = (elapsed % this.CYCLE_DURATION_MS) / this.CYCLE_DURATION_MS;
        
        // Target is always the center of the cycle (0.5)
        const targetPoint = 0.5;
        
        // Window shrinks as level goes up, losing 25ms per level
        const currentWindowMs = Math.max(
            this.minSuccessWindowMs, 
            this.baseSuccessWindowMs - ((this.currentLevel - 1) * 25)
        );
        
        const halfWindowRatio = (currentWindowMs / 2) / this.CYCLE_DURATION_MS;
        
        const distance = Math.abs(cyclePosition - targetPoint);
        
        if (distance <= halfWindowRatio) {
            this.winLevel();
        } else {
            this.failLevel();
        }
    }

    private winLevel(): void {
        this.combo++;
        const reward = 50 * this.currentLevel;
        
        if (this.combo >= 3) {
            this.currentLevel++;
            this.combo = 0;
        }
        
        EventBus.Instance.emit("OnGambitSuccess", reward);
        
        setTimeout(() => {
            if (this.currentState === "STOPPED") { // Ensure not restarted already
                this.currentState = "IDLE";
                EventBus.Instance.emit("OnGambitIdle");
            }
        }, 200);
    }

    private failLevel(): void {
        this.currentLevel = 1;
        this.combo = 0;
        EventBus.Instance.emit("OnGambitFail");
        
        setTimeout(() => {
            this.currentState = "IDLE";
            EventBus.Instance.emit("OnGambitIdle");
        }, 300);
    }
}
