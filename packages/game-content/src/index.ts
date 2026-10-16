export * from './boardData.js';
export * from './cardsData.js';

import { BOARD_SPACES } from './boardData.js';
import { BoardSpace } from '@business/shared-types';

export const SPACES_BY_ID = new Map<string, BoardSpace>(
  BOARD_SPACES.map((space) => [space.id, space])
);

export const SPACES_BY_INDEX = new Map<number, BoardSpace>(
  BOARD_SPACES.map((space) => [space.index, space])
);

export const SPACES_BY_CATEGORY = BOARD_SPACES.reduce<Record<string, BoardSpace[]>>(
  (acc, space) => {
    if (space.category) {
      if (!acc[space.category]) acc[space.category] = [];
      acc[space.category].push(space);
    }
    return acc;
  },
  {}
);

export const ALL_TRANSIT_SPACES = BOARD_SPACES.filter((s) => s.type === 'transit');
export const ALL_UTILITY_SPACES = BOARD_SPACES.filter((s) => s.type === 'utility');
