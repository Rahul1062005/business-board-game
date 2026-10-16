import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  applyGameAction,
  calculatePlayerNetWorth,
  rankPlayers,
  canBuildUpgrade,
  canMortgage,
  canUnmortgage,
  calculateRent,
} from '../src/index.js';

describe('Business Game Engine — Rules & Transitions', () => {
  const initialPlayers = [
    { name: 'Rahul', token: 'auto-rickshaw' as const, color: '#3B82F6' },
    { name: 'Priya', token: 'chai-cup' as const, color: '#EF4444' },
    { name: 'Amit', token: 'peacock' as const, color: '#10B981' },
  ];

  it('initializes game state correctly with default settings', () => {
    const state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
      seed: 42,
    });

    expect(state.players).toHaveLength(3);
    expect(state.players[0].cash).toBe(1500);
    expect(state.players[0].position).toBe(0);
    expect(state.phase).toBe('waiting_for_roll');
    expect(state.round).toBe(1);
    expect(state.properties['space-1']).toBeDefined();
    expect(state.properties['space-1'].ownerId).toBeNull();
  });

  it('rolls dice and transitions to buying_decision on unowned property', () => {
    let state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
      seed: 12345,
    });

    const res = applyGameAction(state, { type: 'ROLL_DICE' });
    expect(res.error).toBeUndefined();
    state = res.state;

    expect(state.turnHasRolled).toBe(true);
    expect(state.lastDiceRoll).toBeDefined();
    expect(state.players[0].position).toBeGreaterThan(0);
  });

  it('buys property and updates ownership and cash', () => {
    let state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
      seed: 100,
    });

    // Manually position player on space-1 (Chandni Chowk, ₹60)
    state.players[0].position = 1;
    state.phase = 'buying_decision';

    const res = applyGameAction(state, {
      type: 'BUY_PROPERTY',
      payload: { spaceId: 'space-1' },
    });

    expect(res.error).toBeUndefined();
    state = res.state;
    expect(state.players[0].cash).toBe(1500 - 60);
    expect(state.properties['space-1'].ownerId).toBe('player-1');
    expect(state.phase).toBe('action_phase');
  });

  it('doubles base rent when owner has full category set', () => {
    const state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
    });

    // Punjab category has space-1 (Amritsar, base rent 2) and space-3 (Ludhiana, base rent 4)
    state.properties['space-1'].ownerId = 'player-1';
    state.properties['space-3'].ownerId = 'player-1';

    const rentWithSet = calculateRent(state, 'space-1', 7);
    expect(rentWithSet).toBe(4); // 2 * 2 = 4

    // If one is mortgaged, rent on the other is still standard/calculated, mortgaged one earns 0
    state.properties['space-1'].isMortgaged = true;
    expect(calculateRent(state, 'space-1', 7)).toBe(0);
  });

  it('enforces even-building rule for upgrades', () => {
    const state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
    });

    // Own Old Delhi set
    state.properties['space-1'].ownerId = 'player-1';
    state.properties['space-3'].ownerId = 'player-1';

    // Can upgrade space-1 from 0 to 1
    const check1 = canBuildUpgrade(state, 'player-1', 'space-1');
    expect(check1.ok).toBe(true);

    // Apply upgrade to space-1 (level 1)
    state.properties['space-1'].upgradeLevel = 1;

    // Cannot upgrade space-1 to level 2 until space-3 is upgraded to level 1!
    const check2 = canBuildUpgrade(state, 'player-1', 'space-1');
    expect(check2.ok).toBe(false);
    expect(check2.reason).toContain('Even-building rule');

    // Upgrade space-3 to level 1
    state.properties['space-3'].upgradeLevel = 1;
    const check3 = canBuildUpgrade(state, 'player-1', 'space-1');
    expect(check3.ok).toBe(true);
  });

  it('mortgaging gives 50% cash and unmortgaging requires 10% interest', () => {
    let state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
    });

    state.properties['space-1'].ownerId = 'player-1';
    state.phase = 'action_phase';
    const initialCash = state.players[0].cash;

    // space-1 price 60, mortgage value 30
    const mRes = applyGameAction(state, {
      type: 'MORTGAGE_PROPERTY',
      payload: { spaceId: 'space-1' },
    });
    expect(mRes.error).toBeUndefined();
    state = mRes.state;

    expect(state.properties['space-1'].isMortgaged).toBe(true);
    expect(state.players[0].cash).toBe(initialCash + 30);

    // Unmortgage costs 30 + 10% = 33
    const uRes = applyGameAction(state, {
      type: 'UNMORTGAGE_PROPERTY',
      payload: { spaceId: 'space-1' },
    });
    expect(uRes.error).toBeUndefined();
    state = uRes.state;

    expect(state.properties['space-1'].isMortgaged).toBe(false);
    expect(state.players[0].cash).toBe(initialCash + 30 - 33);
  });

  it('executes trades atomically between players', () => {
    let state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
    });

    state.properties['space-1'].ownerId = 'player-1';
    state.properties['space-6'].ownerId = 'player-2';
    state.phase = 'action_phase';

    // Player 1 offers space-1 + ₹100 for space-6
    const propRes = applyGameAction(state, {
      type: 'PROPOSE_TRADE',
      payload: {
        fromPlayerId: 'player-1',
        toPlayerId: 'player-2',
        offeredCash: 100,
        offeredPropertyIds: ['space-1'],
        requestedCash: 0,
        requestedPropertyIds: ['space-6'],
      },
    });

    expect(propRes.error).toBeUndefined();
    state = propRes.state;
    expect(state.activeTrade).toBeDefined();

    const acceptRes = applyGameAction(state, {
      type: 'ACCEPT_TRADE',
      payload: { tradeId: state.activeTrade!.id },
    });

    expect(acceptRes.error).toBeUndefined();
    state = acceptRes.state;

    expect(state.properties['space-1'].ownerId).toBe('player-2');
    expect(state.properties['space-6'].ownerId).toBe('player-1');
    expect(state.players[0].cash).toBe(1500 - 100);
    expect(state.players[1].cash).toBe(1500 + 100);
  });

  it('handles bankruptcy to another player according to Section 5.5', () => {
    let state = createInitialGameState({
      mode: 'classic',
      players: initialPlayers,
    });

    // Player 1 owes Player 2 ₹2000 rent
    state.players[0].cash = 100;
    state.properties['space-1'].ownerId = 'player-1';
    state.pendingDebt = {
      debtorId: 'player-1',
      creditorId: 'player-2',
      amount: 2000,
      reason: 'Huge rent on Mumbai BKC',
    };
    state.phase = 'debt_resolution';

    const bRes = applyGameAction(state, { type: 'DECLARE_BANKRUPTCY' });
    expect(bRes.error).toBeUndefined();
    state = bRes.state;

    expect(state.players[0].isBankrupt).toBe(true);
    expect(state.players[0].cash).toBe(0);
    // Creditor received debtor's cash and properties
    expect(state.players[1].cash).toBe(1500 + 100);
    expect(state.properties['space-1'].ownerId).toBe('player-2');
  });

  it('calculates net worth accurately according to Section 5.5 formula', () => {
    const state = createInitialGameState({
      mode: 'quick',
      players: initialPlayers,
    });

    // Player 1 has ₹1000 cash, space-1 unmortgaged (₹60), space-3 mortgaged (₹80 -> ₹40 50%), and 1 upgrade on space-1 (cost ₹50 -> ₹25)
    state.players[0].cash = 1000;
    state.properties['space-1'].ownerId = 'player-1';
    state.properties['space-1'].upgradeLevel = 1;
    state.properties['space-3'].ownerId = 'player-1';
    state.properties['space-3'].isMortgaged = true;

    const nw = calculatePlayerNetWorth(state, 'player-1');
    // Cash: 1000 + Unmortgaged: 60 + Mortgaged 50%: 30 + Upgrades 50%: 25 = 1115
    expect(nw.totalNetWorth).toBe(1000 + 60 + 30 + 25);
  });
});
