import { GameState } from '@business/shared-types';

const STORAGE_KEY = 'business_board_game_save_v1';

export function saveGameState(state: GameState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Failed to save game state to storage', err);
    return false;
  }
}

export function loadSavedGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (err) {
    console.error('Failed to load game state from storage', err);
    return null;
  }
}

export function clearSavedGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear game state', err);
  }
}
