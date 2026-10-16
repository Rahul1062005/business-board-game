import { GameState, BoardSpace, PropertyState, Player } from '@business/shared-types';
import { SPACES_BY_ID, SPACES_BY_CATEGORY } from '@business/game-content';

export function getPropertiesInCategory(category: string): BoardSpace[] {
  return SPACES_BY_CATEGORY[category] || [];
}

export function ownsFullCategory(state: GameState, playerId: string, category: string): boolean {
  const categorySpaces = getPropertiesInCategory(category);
  if (categorySpaces.length === 0) return false;
  return categorySpaces.every((space: BoardSpace) => state.properties[space.id]?.ownerId === playerId);
}

export function isCategoryMortgaged(state: GameState, category: string): boolean {
  const categorySpaces = getPropertiesInCategory(category);
  return categorySpaces.some((space: BoardSpace) => state.properties[space.id]?.isMortgaged);
}

export function canBuildUpgrade(state: GameState, playerId: string, spaceId: string): { ok: boolean; reason?: string } {
  const space = SPACES_BY_ID.get(spaceId);
  if (!space || space.type !== 'property' || !space.category || !space.upgradeCost) {
    return { ok: false, reason: 'This space cannot be upgraded.' };
  }

  const propState = state.properties[spaceId] as PropertyState | undefined;
  if (!propState || propState.ownerId !== playerId) {
    return { ok: false, reason: 'You do not own this property.' };
  }

  if (propState.isMortgaged) {
    return { ok: false, reason: 'Cannot upgrade a mortgaged property.' };
  }

  if (!ownsFullCategory(state, playerId, space.category)) {
    return { ok: false, reason: 'You must own all properties in the color set to build upgrades.' };
  }

  if (isCategoryMortgaged(state, space.category)) {
    return { ok: false, reason: 'Cannot build upgrades while any property in the set is mortgaged.' };
  }

  if (propState.upgradeLevel >= 5) {
    return { ok: false, reason: 'This property is already at maximum upgrade (Flagship).' };
  }

  const player = state.players.find((p: Player) => p.id === playerId);
  if (!player || player.cash < space.upgradeCost) {
    return { ok: false, reason: `Not enough cash. Upgrade costs ₹${space.upgradeCost}.` };
  }

  // Even-building rule:
  // Cannot raise this property's level if it's already higher than any sister property in the category
  const categorySpaces = getPropertiesInCategory(space.category);
  for (const sister of categorySpaces) {
    const sisterState = state.properties[sister.id] as PropertyState | undefined;
    if (sisterState && propState.upgradeLevel > sisterState.upgradeLevel) {
      return { ok: false, reason: 'Even-building rule: upgrade other properties in the set first.' };
    }
  }

  return { ok: true };
}

export function canSellUpgrade(state: GameState, playerId: string, spaceId: string): { ok: boolean; reason?: string } {
  const space = SPACES_BY_ID.get(spaceId);
  if (!space || space.type !== 'property' || !space.category) {
    return { ok: false, reason: 'Not an upgradable property.' };
  }

  const propState = state.properties[spaceId] as PropertyState | undefined;
  if (!propState || propState.ownerId !== playerId) {
    return { ok: false, reason: 'You do not own this property.' };
  }

  if (propState.upgradeLevel <= 0) {
    return { ok: false, reason: 'No upgrades to sell on this property.' };
  }

  // Even-selling rule:
  // Cannot sell from this property if its level is already lower than any sister property
  const categorySpaces = getPropertiesInCategory(space.category);
  for (const sister of categorySpaces) {
    const sisterState = state.properties[sister.id] as PropertyState | undefined;
    if (sisterState && propState.upgradeLevel < sisterState.upgradeLevel) {
      return { ok: false, reason: 'Even-selling rule: sell upgrades from higher-tier properties first.' };
    }
  }

  return { ok: true };
}

export function canMortgage(state: GameState, playerId: string, spaceId: string): { ok: boolean; reason?: string } {
  const space = SPACES_BY_ID.get(spaceId);
  if (!space || space.mortgageValue == null) {
    return { ok: false, reason: 'This space cannot be mortgaged.' };
  }

  const propState = state.properties[spaceId] as PropertyState | undefined;
  if (!propState || propState.ownerId !== playerId) {
    return { ok: false, reason: 'You do not own this property.' };
  }

  if (propState.isMortgaged) {
    return { ok: false, reason: 'Property is already mortgaged.' };
  }

  // If it's a property in a category, all upgrades across the whole category must be sold first!
  if (space.category) {
    const categorySpaces = getPropertiesInCategory(space.category);
    const hasAnyUpgrades = categorySpaces.some((s: BoardSpace) => (state.properties[s.id]?.upgradeLevel ?? 0) > 0);
    if (hasAnyUpgrades) {
      return { ok: false, reason: 'You must sell all upgrades in this color set before mortgaging.' };
    }
  }

  return { ok: true };
}

export function canUnmortgage(state: GameState, playerId: string, spaceId: string): { ok: boolean; reason?: string; cost?: number } {
  const space = SPACES_BY_ID.get(spaceId);
  if (!space || space.mortgageValue == null) {
    return { ok: false, reason: 'Not a mortgageable space.' };
  }

  const propState = state.properties[spaceId] as PropertyState | undefined;
  if (!propState || propState.ownerId !== playerId) {
    return { ok: false, reason: 'You do not own this property.' };
  }

  if (!propState.isMortgaged) {
    return { ok: false, reason: 'Property is not mortgaged.' };
  }

  const unmortgageCost = Math.round(space.mortgageValue * (1 + state.settings.mortgageInterestRate));
  const player = state.players.find((p: Player) => p.id === playerId);
  if (!player || player.cash < unmortgageCost) {
    return { ok: false, reason: `Not enough cash to unmortgage. Cost is ₹${unmortgageCost}.`, cost: unmortgageCost };
  }

  return { ok: true, cost: unmortgageCost };
}

export function calculateRent(state: GameState, spaceId: string, diceTotal: number): number {
  const space = SPACES_BY_ID.get(spaceId);
  if (!space) return 0;

  const propState = state.properties[spaceId] as PropertyState | undefined;
  if (!propState || !propState.ownerId || propState.isMortgaged) {
    return 0; // Mortgaged properties earn NO rent
  }

  const ownerId = propState.ownerId;

  if (space.type === 'transit') {
    let transitCount = 0;
    for (const [sId, p] of Object.entries(state.properties)) {
      const pState = p as PropertyState;
      if (pState.ownerId === ownerId) {
        const s = SPACES_BY_ID.get(sId);
        if (s?.type === 'transit') transitCount++;
      }
    }
    const transitIndex = Math.min(Math.max(transitCount - 1, 0), 3);
    return space.transitRents?.[transitIndex] ?? 25;
  }

  if (space.type === 'utility') {
    let utilityCount = 0;
    for (const [sId, p] of Object.entries(state.properties)) {
      const pState = p as PropertyState;
      if (pState.ownerId === ownerId) {
        const s = SPACES_BY_ID.get(sId);
        if (s?.type === 'utility') utilityCount++;
      }
    }
    const multiplier = utilityCount >= 2 ? 10 : 4;
    return multiplier * diceTotal;
  }

  if (space.type === 'property' && space.rent) {
    const level = propState.upgradeLevel;
    if (level === 1) return space.rent.upgrade1;
    if (level === 2) return space.rent.upgrade2;
    if (level === 3) return space.rent.upgrade3;
    if (level === 4) return space.rent.upgrade4;
    if (level === 5) return space.rent.flagship;

    const hasFullSet = space.category ? ownsFullCategory(state, ownerId, space.category) : false;
    return hasFullSet ? space.rent.base * 2 : space.rent.base;
  }

  return 0;
}
