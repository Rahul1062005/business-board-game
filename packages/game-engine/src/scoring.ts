import { GameState, PlayerNetWorth, Player, PropertyState } from '@business/shared-types';
import { SPACES_BY_ID } from '@business/game-content';

/**
 * Calculates net worth strictly following the specification:
 * Net worth = cash + printed price of unmortgaged properties + 50% of price of mortgaged properties + 50% of the build cost of upgrades.
 */
export function calculatePlayerNetWorth(state: GameState, playerId: string): PlayerNetWorth {
  const player = state.players.find((p: Player) => p.id === playerId);
  if (!player) {
    return {
      playerId,
      cash: 0,
      unmortgagedPropertiesValue: 0,
      mortgagedPropertiesValue: 0,
      upgradesValue: 0,
      totalNetWorth: 0,
    };
  }

  let unmortgagedValue = 0;
  let mortgagedValue = 0;
  let upgradesValue = 0;

  for (const [spaceId, prop] of Object.entries(state.properties)) {
    const propState = prop as PropertyState;
    if (propState.ownerId === playerId) {
      const space = SPACES_BY_ID.get(spaceId);
      if (!space || space.price == null) continue;

      if (propState.isMortgaged) {
        mortgagedValue += Math.floor(space.price * 0.5);
      } else {
        unmortgagedValue += space.price;
      }

      if (propState.upgradeLevel > 0 && space.upgradeCost) {
        // 50% of the build cost of upgrades
        upgradesValue += Math.floor(propState.upgradeLevel * space.upgradeCost * state.settings.upgradeSellBackRate);
      }
    }
  }

  return {
    playerId,
    cash: player.cash,
    unmortgagedPropertiesValue: unmortgagedValue,
    mortgagedPropertiesValue: mortgagedValue,
    upgradesValue,
    totalNetWorth: player.isBankrupt ? 0 : player.cash + unmortgagedValue + mortgagedValue + upgradesValue,
  };
}

export function rankPlayers(state: GameState): Array<{ player: Player; netWorth: PlayerNetWorth; rank: number }> {
  const scored = state.players.map((p: Player) => ({
    player: p,
    netWorth: calculatePlayerNetWorth(state, p.id),
  }));

  // Bankrupt players are sorted last
  scored.sort((a, b) => {
    if (a.player.isBankrupt && !b.player.isBankrupt) return 1;
    if (!a.player.isBankrupt && b.player.isBankrupt) return -1;
    return b.netWorth.totalNetWorth - a.netWorth.totalNetWorth;
  });

  return scored.map((item, idx: number) => ({
    ...item,
    rank: idx + 1,
  }));
}
