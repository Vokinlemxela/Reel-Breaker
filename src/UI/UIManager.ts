export type SceneId = "INTRO" | "GRIND" | "MAP" | "CASINO" | "DECK" | "SHOP" | "RECOVERY" | "SKILLS" | "COLLECTION";

export class UIManager {
    private static currentScene: SceneId = "INTRO";
    
    private static scenes: Map<SceneId, HTMLElement> = new Map();
    private static navContainer: HTMLElement;
    private static mTopStats: HTMLElement;
    private static navButtons: NodeListOf<HTMLElement>;

    public static initialize(): void {
        const ids: SceneId[] = ["INTRO", "GRIND", "MAP", "CASINO", "DECK", "SHOP", "RECOVERY", "SKILLS", "COLLECTION"];
        ids.forEach(id => {
            const el = document.getElementById(`scene-${id.toLowerCase()}`);
            if (el) this.scenes.set(id, el);
        });

        this.navContainer = document.getElementById("global-nav")!;
        this.mTopStats = document.getElementById("m-top-stats")!;
        this.navButtons = document.querySelectorAll(".nav-btn");

        this.setScene("INTRO");
    }

    public static setScene(sceneId: SceneId): void {
        const hideNav = sceneId === "INTRO" || sceneId === "RECOVERY";
        
        if (hideNav) {
            this.navContainer.classList.add("hidden-important");
            this.mTopStats.classList.add("hidden-important");
        } else {
            this.navContainer.classList.remove("hidden-important");
            this.mTopStats.classList.remove("hidden-important");
        }

        this.scenes.forEach((el, id) => {
            if (id === sceneId) {
                el.classList.add("active-scene");
            } else {
                el.classList.remove("active-scene");
            }
        });

        this.navButtons.forEach(btn => {
            if (btn.dataset.target === sceneId) {
                btn.classList.add("nav-active");
            } else {
                btn.classList.remove("nav-active");
            }
        });

        this.currentScene = sceneId;
    }

    public static getScene(): SceneId {
        return this.currentScene;
    }
}
