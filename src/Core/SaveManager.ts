import { PlayerProfile } from "./PlayerProfile";

export interface ISaveProvider {
    save(key: string, data: string): void;
    load(key: string): string | null;
}

export class LocalStorageSaveProvider implements ISaveProvider {
    save(key: string, data: string): void {
        try {
            // Very simple btoa. For Unicode strings we need to encodeURI first.
            const encoded = btoa(encodeURIComponent(data));
            localStorage.setItem(key, encoded);
        } catch (e) {
            console.error("Save Error", e);
        }
    }

    load(key: string): string | null {
        try {
            const encoded = localStorage.getItem(key);
            if (!encoded) return null;
            return decodeURIComponent(atob(encoded));
        } catch (e) {
            console.error("Load Error", e);
            return null;
        }
    }
}

export class SaveManager {
    private static instance: SaveManager;
    private provider: ISaveProvider;
    private readonly SAVE_KEY = "FORTUNALIA_SAVE_V1";

    private constructor() {
        // We link localStorage for MVP. Can be swapped to APISaveProvider later.
        this.provider = new LocalStorageSaveProvider();
    }

    public static get Instance(): SaveManager {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }

    public setProvider(provider: ISaveProvider) {
        this.provider = provider;
    }

    public saveProfile(profile: PlayerProfile): void {
        const jsonStr = profile.toJSON();
        this.provider.save(this.SAVE_KEY, jsonStr);
        console.log("[SaveManager] Game Saved.");
    }

    public loadProfile(): PlayerProfile | null {
        const jsonStr = this.provider.load(this.SAVE_KEY);
        if (!jsonStr) return null;
        
        try {
            const profile = new PlayerProfile(0); // Dummy init
            profile.fromJSON(jsonStr);
            console.log("[SaveManager] Game Loaded.");
            return profile;
        } catch (e) {
            console.error("[SaveManager] Corrupted save file.", e);
            return null;
        }
    }
}
