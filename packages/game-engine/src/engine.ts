import {
  GameState,
  GameAction,
  Player,
  PropertyState,
  GameMode,
  PlayerToken,
  GameActionLogItem,
  EventCard,
} from '@business/shared-types';
import {
  BOARD_SPACES,
  SPACES_BY_ID,
  SPACES_BY_INDEX,
  DEFAULT_GAME_SETTINGS,
  EVENT_CARDS,
} from '@business/game-content';
import { SeededRNG } from './rng.js';
import {
  canBuildUpgrade,
  canSellUpgrade,
  canMortgage,
  canUnmortgage,
  calculateRent,
} from './validation.js';
import { rankPlayers } from './scoring.js';

export function createInitialGameState(params: {
  id?: string;
  mode: GameMode;
  players: Array<{ name: string; token: PlayerToken; color: string }>;
  seed?: number;
  maxRounds?: number;
}): GameState {
  const seed = params.seed ?? Math.floor(Math.random() * 1000000);
  const settings = {
    ...DEFAULT_GAME_SETTINGS,
    ...(params.maxRounds ? { quickModeMaxRounds: params.maxRounds } : {}),
  };

  const players: Player[] = params.players.map((p, idx) => ({
    id: `player-${idx + 1}`,
    name: p.name.trim() || `Player ${idx + 1}`,
    token: p.token,
    color: p.color,
    cash: settings.startingCash,
    position: 0,
    isBankrupt: false,
    bankruptTo: null,
    inDetention: false,
    detentionTurns: 0,
    isConnected: true,
  }));

  const properties: Record<string, PropertyState> = {};
  for (const space of BOARD_SPACES) {
    if (space.type === 'property' || space.type === 'transit' || space.type === 'utility') {
      properties[space.id] = {
        spaceId: space.id,
        ownerId: null,
        upgradeLevel: 0,
        isMortgaged: false,
      };
    }
  }

  return {
    id: params.id ?? `game-${Date.now()}`,
    mode: params.mode,
    settings,
    round: 1,
    activePlayerIndex: 0,
    players,
    properties,
    phase: 'waiting_for_roll',
    lastDiceRoll: null,
    doublesCount: 0,
    pendingDebt: null,
    activeTrade: null,
    currentEventCard: null,
    winnerId: null,
    actionLog: [
      {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'turn',
        message: `Game started in ${params.mode === 'quick' ? 'Quick Business' : 'Classic'} mode with ${players.length} players.`,
      },
    ],
    seed,
    turnHasRolled: false,
  };
}

function addLog(
  state: GameState,
  type: GameActionLogItem['type'],
  message: string,
  playerId?: string
): void {
  state.actionLog.push({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    message,
    playerId,
  });
}

export function applyGameAction(
  prevState: GameState,
  action: GameAction
): { state: GameState; error?: string } {
  const state: GameState = JSON.parse(JSON.stringify(prevState));
  const rng = new SeededRNG(state.seed);

  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer && action.type !== 'START_GAME') {
    return { state: prevState, error: 'No active player found.' };
  }

  switch (action.type) {
    case 'START_GAME': {
      const newState = createInitialGameState({
        mode: action.payload.mode,
        players: action.payload.players,
      });
      return { state: newState };
    }

    case 'PAY_DETENTION_BAIL': {
      if (!activePlayer.inDetention) {
        return { state: prevState, error: 'Player is not in detention.' };
      }
      if (state.phase !== 'waiting_for_roll') {
        return { state: prevState, error: 'Can only pay bail before rolling.' };
      }
      if (activePlayer.cash < state.settings.detentionBailFee) {
        return { state: prevState, error: `Not enough cash to pay bail (₹${state.settings.detentionBailFee}).` };
      }

      activePlayer.cash -= state.settings.detentionBailFee;
      activePlayer.inDetention = false;
      activePlayer.detentionTurns = 0;
      addLog(state, 'tax', `${activePlayer.name} paid ₹${state.settings.detentionBailFee} bail and was released from detention.`, activePlayer.id);
      return { state };
    }

    case 'ROLL_DICE': {
      if (state.phase !== 'waiting_for_roll') {
        return { state: prevState, error: 'Cannot roll dice right now.' };
      }

      const dice = rng.rollDice();
      state.seed = rng.getSeed();
      state.lastDiceRoll = dice;
      state.turnHasRolled = true;
      const isDoubles = dice[0] === dice[1];
      const diceTotal = dice[0] + dice[1];

      addLog(state, 'roll', `${activePlayer.name} rolled [${dice[0]}, ${dice[1]}] (Total: ${diceTotal})${isDoubles ? ' - DOUBLES!' : ''}`, activePlayer.id);

      if (activePlayer.inDetention) {
        if (isDoubles) {
          activePlayer.inDetention = false;
          activePlayer.detentionTurns = 0;
          addLog(state, 'move', `${activePlayer.name} rolled doubles and broke free from detention!`, activePlayer.id);
          return moveAndResolveSpace(state, activePlayer, diceTotal, rng);
        } else {
          activePlayer.detentionTurns += 1;
          if (activePlayer.detentionTurns >= 3) {
            if (activePlayer.cash >= state.settings.detentionBailFee) {
              activePlayer.cash -= state.settings.detentionBailFee;
              activePlayer.inDetention = false;
              activePlayer.detentionTurns = 0;
              addLog(state, 'tax', `${activePlayer.name} served maximum 3 turns in detention, paid ₹${state.settings.detentionBailFee} mandatory fee, and was released.`, activePlayer.id);
              return moveAndResolveSpace(state, activePlayer, diceTotal, rng);
            } else {
              state.pendingDebt = {
                debtorId: activePlayer.id,
                creditorId: 'bank',
                amount: state.settings.detentionBailFee,
                reason: 'Mandatory detention release bail fee',
              };
              state.phase = 'debt_resolution';
              return { state };
            }
          } else {
            addLog(state, 'turn', `${activePlayer.name} did not roll doubles and remains in detention (${activePlayer.detentionTurns}/3 turns).`, activePlayer.id);
            state.phase = 'action_phase';
            return { state };
          }
        }
      }

      if (isDoubles) {
        state.doublesCount += 1;
        if (state.doublesCount >= 3) {
          activePlayer.position = 9;
          activePlayer.inDetention = true;
          activePlayer.detentionTurns = 0;
          state.doublesCount = 0;
          addLog(state, 'move', `Three consecutive doubles! ${activePlayer.name} was sent directly to Detention!`, activePlayer.id);
          state.phase = 'action_phase';
          return { state };
        }
      } else {
        state.doublesCount = 0;
      }

      return moveAndResolveSpace(state, activePlayer, diceTotal, rng);
    }

    case 'BUY_PROPERTY': {
      if (state.phase !== 'buying_decision') {
        return { state: prevState, error: 'Cannot purchase property at this stage.' };
      }
      const space = SPACES_BY_ID.get(action.payload.spaceId);
      if (!space || space.price == null) {
        return { state: prevState, error: 'Property is not available for purchase.' };
      }
      const propState = state.properties[space.id];
      if (propState.ownerId !== null) {
        return { state: prevState, error: 'Property is already owned.' };
      }
      if (activePlayer.cash < space.price) {
        return { state: prevState, error: `Not enough cash (Required: ₹${space.price}, Available: ₹${activePlayer.cash}).` };
      }

      activePlayer.cash -= space.price;
      propState.ownerId = activePlayer.id;
      addLog(state, 'buy', `${activePlayer.name} purchased ${space.name} for ₹${space.price}.`, activePlayer.id);
      state.phase = 'action_phase';
      return { state };
    }

    case 'DECLINE_PROPERTY': {
      if (state.phase !== 'buying_decision') {
        return { state: prevState, error: 'Cannot decline property right now.' };
      }
      const space = SPACES_BY_ID.get(action.payload.spaceId);
      addLog(state, 'buy', `${activePlayer.name} declined to purchase ${space?.name || 'property'}.`, activePlayer.id);
      state.phase = 'action_phase';
      return { state };
    }

    case 'BUILD_UPGRADE': {
      const validation = canBuildUpgrade(state, activePlayer.id, action.payload.spaceId);
      if (!validation.ok) {
        return { state: prevState, error: validation.reason };
      }
      const space = SPACES_BY_ID.get(action.payload.spaceId)!;
      const propState = state.properties[space.id];

      activePlayer.cash -= space.upgradeCost!;
      propState.upgradeLevel += 1;
      const levelTitle = propState.upgradeLevel === 5 ? 'Flagship Business' : `Tier ${propState.upgradeLevel}`;
      addLog(state, 'upgrade', `${activePlayer.name} upgraded ${space.name} to ${levelTitle} for ₹${space.upgradeCost}.`, activePlayer.id);
      return { state };
    }

    case 'SELL_UPGRADE': {
      const validation = canSellUpgrade(state, activePlayer.id, action.payload.spaceId);
      if (!validation.ok) {
        return { state: prevState, error: validation.reason };
      }
      const space = SPACES_BY_ID.get(action.payload.spaceId)!;
      const propState = state.properties[space.id];
      const refund = Math.floor(space.upgradeCost! * state.settings.upgradeSellBackRate);

      activePlayer.cash += refund;
      propState.upgradeLevel -= 1;
      addLog(state, 'upgrade', `${activePlayer.name} sold an upgrade on ${space.name} for ₹${refund}.`, activePlayer.id);
      return { state };
    }

    case 'MORTGAGE_PROPERTY': {
      const validation = canMortgage(state, activePlayer.id, action.payload.spaceId);
      if (!validation.ok) {
        return { state: prevState, error: validation.reason };
      }
      const space = SPACES_BY_ID.get(action.payload.spaceId)!;
      const propState = state.properties[space.id];

      propState.isMortgaged = true;
      activePlayer.cash += space.mortgageValue!;
      addLog(state, 'mortgage', `${activePlayer.name} mortgaged ${space.name} and received ₹${space.mortgageValue}.`, activePlayer.id);
      return { state };
    }

    case 'UNMORTGAGE_PROPERTY': {
      const validation = canUnmortgage(state, activePlayer.id, action.payload.spaceId);
      if (!validation.ok) {
        return { state: prevState, error: validation.reason };
      }
      const space = SPACES_BY_ID.get(action.payload.spaceId)!;
      const propState = state.properties[space.id];
      const cost = validation.cost!;

      activePlayer.cash -= cost;
      propState.isMortgaged = false;
      addLog(state, 'mortgage', `${activePlayer.name} unmortgaged ${space.name} for ₹${cost} (including 10% interest).`, activePlayer.id);
      return { state };
    }

    case 'PROPOSE_TRADE': {
      if (state.phase !== 'action_phase') {
        return { state: prevState, error: 'Trades can only be proposed during action phase.' };
      }
      const { toPlayerId, offeredCash, offeredPropertyIds, requestedCash, requestedPropertyIds } = action.payload;

      if (toPlayerId === activePlayer.id) {
        return { state: prevState, error: 'Cannot trade with yourself.' };
      }
      if (offeredCash > activePlayer.cash) {
        return { state: prevState, error: 'You do not have enough cash for this offer.' };
      }
      const targetPlayer = state.players.find((p: Player) => p.id === toPlayerId);
      if (!targetPlayer || targetPlayer.isBankrupt) {
        return { state: prevState, error: 'Invalid or bankrupt target player.' };
      }
      if (requestedCash > targetPlayer.cash) {
        return { state: prevState, error: 'Target player does not have enough cash for this request.' };
      }

      for (const pId of [...offeredPropertyIds, ...requestedPropertyIds]) {
        const prop = state.properties[pId];
        if (prop && prop.upgradeLevel > 0) {
          return { state: prevState, error: 'Cannot trade properties with active upgrades. Upgrades must be sold first.' };
        }
      }

      state.activeTrade = {
        id: `trade-${Date.now()}`,
        fromPlayerId: activePlayer.id,
        toPlayerId,
        offeredCash,
        offeredPropertyIds,
        requestedCash,
        requestedPropertyIds,
        status: 'pending',
        createdAt: Date.now(),
      };

      addLog(state, 'trade', `${activePlayer.name} proposed a trade to ${targetPlayer.name}.`, activePlayer.id);
      return { state };
    }

    case 'ACCEPT_TRADE': {
      const trade = state.activeTrade;
      if (!trade || trade.id !== action.payload.tradeId || trade.status !== 'pending') {
        return { state: prevState, error: 'No active pending trade offer found.' };
      }
      const p1 = state.players.find((p: Player) => p.id === trade.fromPlayerId)!;
      const p2 = state.players.find((p: Player) => p.id === trade.toPlayerId)!;

      if (p1.cash < trade.offeredCash || p2.cash < trade.requestedCash) {
        return { state: prevState, error: 'One or both players no longer have sufficient funds.' };
      }

      p1.cash -= trade.offeredCash;
      p2.cash += trade.offeredCash;
      p2.cash -= trade.requestedCash;
      p1.cash += trade.requestedCash;

      for (const pId of trade.offeredPropertyIds) {
        state.properties[pId].ownerId = p2.id;
      }
      for (const pId of trade.requestedPropertyIds) {
        state.properties[pId].ownerId = p1.id;
      }

      trade.status = 'accepted';
      state.activeTrade = null;
      addLog(state, 'trade', `Trade between ${p1.name} and ${p2.name} was accepted! Assets exchanged.`, p2.id);
      return { state };
    }

    case 'REJECT_TRADE': {
      if (state.activeTrade && state.activeTrade.id === action.payload.tradeId) {
        state.activeTrade.status = 'rejected';
        state.activeTrade = null;
        addLog(state, 'trade', 'Trade offer was declined.');
      }
      return { state };
    }

    case 'RESOLVE_DEBT': {
      if (state.phase !== 'debt_resolution' || !state.pendingDebt) {
        return { state: prevState, error: 'No outstanding debt to resolve.' };
      }
      const debtor = state.players.find((p: Player) => p.id === state.pendingDebt!.debtorId);
      if (!debtor) {
        return { state: prevState, error: 'Debtor not found.' };
      }
      if (debtor.cash < state.pendingDebt.amount) {
        return {
          state: prevState,
          error: `Insufficient cash to settle debt (Need: ₹${state.pendingDebt.amount}, Have: ₹${debtor.cash}). Sell upgrades or mortgage properties first.`,
        };
      }

      const debt = state.pendingDebt;
      debtor.cash -= debt.amount;

      if (debt.creditorId !== 'bank') {
        const creditor = state.players.find((p: Player) => p.id === debt.creditorId);
        if (creditor) {
          creditor.cash += debt.amount;
          addLog(state, 'rent', `${debtor.name} paid ₹${debt.amount} to settle debt with ${creditor.name}.`, debtor.id);
        }
      } else {
        addLog(state, 'tax', `${debtor.name} paid ₹${debt.amount} to settle dues with the bank.`, debtor.id);
      }

      state.pendingDebt = null;
      state.phase = 'action_phase';
      return { state };
    }

    case 'DECLARE_BANKRUPTCY': {
      if (state.phase !== 'debt_resolution' || !state.pendingDebt) {
        return { state: prevState, error: 'Cannot declare bankruptcy outside of debt resolution.' };
      }
      const debtor = state.players.find((p: Player) => p.id === state.pendingDebt!.debtorId);
      if (!debtor) return { state: prevState, error: 'Debtor not found.' };

      const debt = state.pendingDebt;
      debtor.isBankrupt = true;
      debtor.bankruptTo = debt.creditorId;

      if (debt.creditorId !== 'bank') {
        const creditor = state.players.find((p: Player) => p.id === debt.creditorId);
        if (creditor) {
          creditor.cash += debtor.cash;
          debtor.cash = 0;

          for (const [sId, prop] of Object.entries(state.properties)) {
            const propState = prop as PropertyState;
            if (propState.ownerId === debtor.id) {
              const space = SPACES_BY_ID.get(sId);
              if (propState.upgradeLevel > 0 && space?.upgradeCost) {
                const upgradeCash = Math.floor(propState.upgradeLevel * space.upgradeCost * state.settings.upgradeSellBackRate);
                creditor.cash += upgradeCash;
                propState.upgradeLevel = 0;
              }
              propState.ownerId = creditor.id;
            }
          }
          addLog(state, 'bankruptcy', `BANKRUPTCY! ${debtor.name} surrendered all assets to ${creditor.name}.`, debtor.id);
        }
      } else {
        for (const prop of Object.values(state.properties)) {
          const propState = prop as PropertyState;
          if (propState.ownerId === debtor.id) {
            propState.ownerId = null;
            propState.upgradeLevel = 0;
            propState.isMortgaged = false;
          }
        }
        debtor.cash = 0;
        addLog(state, 'bankruptcy', `BANKRUPTCY! ${debtor.name} defaulted on bank obligations. All properties returned to market.`, debtor.id);
      }

      state.pendingDebt = null;

      const activePlayers = state.players.filter((p: Player) => !p.isBankrupt);
      if (activePlayers.length <= 1) {
        state.phase = 'game_over';
        state.winnerId = activePlayers[0]?.id ?? null;
        addLog(state, 'turn', `GAME OVER! ${activePlayers[0]?.name ?? 'Winner'} is the last business tycoon standing!`);
        return { state };
      }

      return advanceToNextPlayer(state);
    }

    case 'END_TURN': {
      if (state.phase !== 'action_phase') {
        return { state: prevState, error: 'Cannot end turn right now.' };
      }

      if (state.lastDiceRoll && state.lastDiceRoll[0] === state.lastDiceRoll[1] && !activePlayer.inDetention && state.doublesCount > 0 && state.doublesCount < 3) {
        addLog(state, 'roll', `Doubles rolled! ${activePlayer.name} takes another roll.`, activePlayer.id);
        state.phase = 'waiting_for_roll';
        state.turnHasRolled = false;
        state.currentEventCard = null;
        return { state };
      }

      return advanceToNextPlayer(state);
    }

    default:
      return { state: prevState, error: 'Unknown action type.' };
  }
}

function moveAndResolveSpace(
  state: GameState,
  player: Player,
  steps: number,
  rng: SeededRNG
): { state: GameState; error?: string } {
  const oldPos = player.position;
  const newPos = (oldPos + steps) % 36;

  if (newPos < oldPos && newPos !== 0) {
    player.cash += state.settings.goReward;
    addLog(state, 'move', `${player.name} passed Prarambh (Start) and collected ₹${state.settings.goReward}.`, player.id);
  } else if (newPos === 0) {
    player.cash += state.settings.goReward;
    addLog(state, 'move', `${player.name} landed on Prarambh (Start) and collected ₹${state.settings.goReward}.`, player.id);
  }

  player.position = newPos;
  const space = SPACES_BY_INDEX.get(newPos);
  if (!space) {
    state.phase = 'action_phase';
    return { state };
  }

  addLog(state, 'move', `${player.name} landed on ${space.name} (${space.hindiName || ''}).`, player.id);

  switch (space.type) {
    case 'start':
    case 'rest':
    case 'detention': {
      state.phase = 'action_phase';
      return { state };
    }

    case 'goToDetention': {
      player.position = 9;
      player.inDetention = true;
      player.detentionTurns = 0;
      addLog(state, 'move', `Court Order! ${player.name} was sent directly to Detention!`, player.id);
      state.phase = 'action_phase';
      return { state };
    }

    case 'tax': {
      const taxAmount = space.taxAmount || 100;
      if (player.cash >= taxAmount) {
        player.cash -= taxAmount;
        addLog(state, 'tax', `${player.name} paid ₹${taxAmount} in taxes to the bank.`, player.id);
        state.phase = 'action_phase';
      } else {
        state.pendingDebt = {
          debtorId: player.id,
          creditorId: 'bank',
          amount: taxAmount,
          reason: `${space.name} fee`,
        };
        state.phase = 'debt_resolution';
        addLog(state, 'tax', `${player.name} does not have enough cash for ₹${taxAmount} tax! Opened debt panel.`, player.id);
      }
      return { state };
    }

    case 'property':
    case 'transit':
    case 'utility': {
      const propState = state.properties[space.id];
      if (!propState || propState.ownerId === null) {
        state.phase = 'buying_decision';
        return { state };
      }

      if (propState.ownerId === player.id) {
        addLog(state, 'move', `Welcome home! ${player.name} owns this property.`, player.id);
        state.phase = 'action_phase';
        return { state };
      }

      const rent = calculateRent(state, space.id, steps);
      const owner = state.players.find((p: Player) => p.id === propState.ownerId);

      if (rent === 0) {
        addLog(state, 'rent', `${space.name} is mortgaged. No rent owed.`, player.id);
        state.phase = 'action_phase';
        return { state };
      }

      if (player.cash >= rent) {
        player.cash -= rent;
        if (owner) owner.cash += rent;
        addLog(state, 'rent', `${player.name} paid ₹${rent} rent to ${owner?.name || 'owner'}.`, player.id);
        state.phase = 'action_phase';
      } else {
        state.pendingDebt = {
          debtorId: player.id,
          creditorId: propState.ownerId,
          amount: rent,
          reason: `Rent for ${space.name}`,
        };
        state.phase = 'debt_resolution';
        addLog(state, 'rent', `${player.name} owes ₹${rent} rent to ${owner?.name || 'owner'} but only has ₹${player.cash}!`, player.id);
      }
      return { state };
    }

    case 'event': {
      const cardIndex = rng.nextInt(0, EVENT_CARDS.length - 1);
      state.seed = rng.getSeed();
      const card = EVENT_CARDS[cardIndex];
      state.currentEventCard = card;
      addLog(state, 'card', `Card Drawn: "${card.title}" — ${card.description}`, player.id);

      return applyEventCard(state, player, card);
    }

    default:
      state.phase = 'action_phase';
      return { state };
  }
}

function applyEventCard(
  state: GameState,
  player: Player,
  card: EventCard
): { state: GameState; error?: string } {
  switch (card.type) {
    case 'cash_gain': {
      player.cash += card.amount || 0;
      state.phase = 'action_phase';
      return { state };
    }

    case 'cash_loss': {
      const loss = card.amount || 0;
      if (player.cash >= loss) {
        player.cash -= loss;
        state.phase = 'action_phase';
      } else {
        state.pendingDebt = {
          debtorId: player.id,
          creditorId: 'bank',
          amount: loss,
          reason: card.title,
        };
        state.phase = 'debt_resolution';
      }
      return { state };
    }

    case 'collect_all': {
      const amount = card.amount || 0;
      for (const other of state.players) {
        if (other.id !== player.id && !other.isBankrupt) {
          const paid = Math.min(other.cash, amount);
          other.cash -= paid;
          player.cash += paid;
        }
      }
      state.phase = 'action_phase';
      return { state };
    }

    case 'pay_all': {
      const amount = card.amount || 0;
      const otherCount = state.players.filter((p: Player) => p.id !== player.id && !p.isBankrupt).length;
      const totalDue = amount * otherCount;

      if (player.cash >= totalDue) {
        player.cash -= totalDue;
        for (const other of state.players) {
          if (other.id !== player.id && !other.isBankrupt) {
            other.cash += amount;
          }
        }
        state.phase = 'action_phase';
      } else {
        state.pendingDebt = {
          debtorId: player.id,
          creditorId: 'bank',
          amount: totalDue,
          reason: card.title,
        };
        state.phase = 'debt_resolution';
      }
      return { state };
    }

    case 'move_to': {
      const targetPos = card.targetPosition ?? 0;
      if (targetPos === 9) {
        player.position = 9;
        player.inDetention = true;
        player.detentionTurns = 0;
      } else {
        if (targetPos < player.position && targetPos !== 0) {
          player.cash += state.settings.goReward;
          addLog(state, 'move', `${player.name} passed Start and collected ₹${state.settings.goReward}.`, player.id);
        }
        player.position = targetPos;
      }
      state.phase = 'action_phase';
      return { state };
    }

    case 'property_repair': {
      let totalCost = 0;
      for (const prop of Object.values(state.properties)) {
        const propState = prop as PropertyState;
        if (propState.ownerId === player.id) {
          if (propState.upgradeLevel === 5) {
            totalCost += card.repairFlagshipCost || 100;
          } else if (propState.upgradeLevel > 0) {
            totalCost += propState.upgradeLevel * (card.repairHouseCost || 25);
          }
        }
      }
      if (player.cash >= totalCost) {
        player.cash -= totalCost;
        addLog(state, 'tax', `${player.name} paid ₹${totalCost} for property repairs.`, player.id);
        state.phase = 'action_phase';
      } else {
        state.pendingDebt = {
          debtorId: player.id,
          creditorId: 'bank',
          amount: totalCost,
          reason: 'Property maintenance repair costs',
        };
        state.phase = 'debt_resolution';
      }
      return { state };
    }

    default:
      state.phase = 'action_phase';
      return { state };
  }
}

function advanceToNextPlayer(state: GameState): { state: GameState } {
  state.currentEventCard = null;
  state.turnHasRolled = false;
  state.doublesCount = 0;

  const totalPlayers = state.players.length;
  let nextIdx = (state.activePlayerIndex + 1) % totalPlayers;
  let loops = 0;

  while (state.players[nextIdx].isBankrupt && loops < totalPlayers) {
    if (nextIdx === 0) {
      state.round += 1;
    }
    nextIdx = (nextIdx + 1) % totalPlayers;
    loops++;
  }

  if (nextIdx <= state.activePlayerIndex) {
    state.round += 1;
  }

  if (state.mode === 'quick' && state.round > state.settings.quickModeMaxRounds) {
    state.phase = 'game_over';
    const rankings = rankPlayers(state);
    state.winnerId = rankings[0]?.player.id ?? null;
    addLog(state, 'turn', `Quick Business finished after ${state.settings.quickModeMaxRounds} rounds! Winner: ${rankings[0]?.player.name}`);
    return { state };
  }

  state.activePlayerIndex = nextIdx;
  state.phase = 'waiting_for_roll';
  addLog(state, 'turn', `Round ${state.round} — ${state.players[nextIdx].name}'s turn.`, state.players[nextIdx].id);

  return { state };
}
