export * from './boardData.js';
export * from './cardsData.js';
import { BoardSpace } from '@business/shared-types';
export declare const SPACES_BY_ID: Map<string, BoardSpace>;
export declare const SPACES_BY_INDEX: Map<number, BoardSpace>;
export declare const SPACES_BY_CATEGORY: Record<string, BoardSpace[]>;
export declare const ALL_TRANSIT_SPACES: BoardSpace[];
export declare const ALL_UTILITY_SPACES: BoardSpace[];
