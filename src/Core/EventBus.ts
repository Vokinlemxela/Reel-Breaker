/**
 * Action (Event) type similar to C# Action<T>.
 */
export type Action<T = void> = (payload: T) => void;

/**
 * EventBus: A generic publish-subscribe system to decouple Core logic from UI.
 * Mirrors C# Observer pattern or UnityEvents.
 */
export class EventBus {
    private static instance: EventBus;
    private listeners: Map<string, Action<any>[]> = new Map();

    private constructor() {}

    /**
     * Singleton instance.
     */
    public static get Instance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Subscribe to an event.
     * @param eventName Name of the event.
     * @param callback The callback function.
     */
    public on<T>(eventName: string, callback: Action<T>): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)!.push(callback);
    }

    /**
     * Unsubscribe from an event.
     * @param eventName Name of the event.
     * @param callback The callback function to remove.
     */
    public off<T>(eventName: string, callback: Action<T>): void {
        if (!this.listeners.has(eventName)) return;
        
        const callbacks = this.listeners.get(eventName)!;
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Publish an event.
     * @param eventName Name of the event.
     * @param payload Optional payload data.
     */
    public emit<T>(eventName: string, payload?: T): void {
        if (!this.listeners.has(eventName)) return;
        
        const callbacks = this.listeners.get(eventName)!;
        for (const cb of callbacks) {
            cb(payload);
        }
    }
}
