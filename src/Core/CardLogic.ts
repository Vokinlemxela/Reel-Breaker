import type { ActionCommand, FortunaliaEngine } from "./FortunaliaEngine";
import { GridState } from "./FortunaliaEngine";
import type { ICardEffect } from "./CardData";

export class RetroJackpotLogic implements ICardEffect {
    // Retro doesn't do active Aura phase commands, it relies on passive Line resolution.
    execute(command: ActionCommand, state: GridState, engine: FortunaliaEngine): void {
        // Passive: do nothing during Aura Phase
    }
}

export class NeonIdolLogic implements ICardEffect {
    execute(command: ActionCommand, state: GridState, engine: FortunaliaEngine): void {
        const x = command.origin.x;
        const y = command.origin.y;
        
        // Orthogonal scan (Up, Down, Left, Right)
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        const width = GridState.WIDTH;
        const height = GridState.HEIGHT;

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const targetCell = state.cells[nx][ny];
                if (targetCell.currentCard === null) {
                    // Glitch Pop! Found Junk. Convert it to a random card.
                    const spawn = engine.spawnRandomCard();
                    if (spawn) {
                        targetCell.currentCard = spawn;
                        state.convertedCells.push({ x: nx, y: ny });
                        // We only convert ONE junk cell per Idol to prevent overpowered cascades
                        break;
                    }
                }
            }
        }
    }
}
