export type PlayerToken = 'auto-rickshaw' | 'chai-cup' | 'peacock' | 'cricket-bat' | 'royal-elephant' | 'tiger';
export interface Player {
    id: string;
    name: string;
    token: PlayerToken;
    color: string;
    cash: number;
    position: number;
    isBankrupt: boolean;
    bankruptTo?: string | 'bank' | null;
    inDetention: boolean;
    detentionTurns: number;
    isConnected: boolean;
}
export type SpaceType = 'start' | 'property' | 'transit' | 'utility' | 'tax' | 'event' | 'detention' | 'rest' | 'goToDetention';
export interface RentTiers {
    base: number;
    upgrade1: number;
    upgrade2: number;
    upgrade3: number;
    upgrade4: number;
    flagship: number;
}
export interface BoardSpace {
    id: string;
    index: number;
    name: string;
    hindiName?: string;
    type: SpaceType;
    category?: string;
    categoryColor?: string;
    price?: number;
    rent?: RentTiers;
    transitRents?: [number, number, number, number];
    utilityMultipliers?: [number, number];
    upgradeCost?: number;
    mortgageValue?: number;
    taxAmount?: number;
    taxRatePercent?: number;
    description?: string;
    icon?: string;
}
export interface PropertyState {
    spaceId: string;
    ownerId: string | null;
    upgradeLevel: number;
    isMortgaged: boolean;
}
export interface TradeOffer {
    id: string;
    fromPlayerId: string;
    toPlayerId: string;
    offeredCash: number;
    offeredPropertyIds: string[];
    requestedCash: number;
    requestedPropertyIds: string[];
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    createdAt: number;
}
export type EventCardType = 'cash_gain' | 'cash_loss' | 'move_to' | 'move_relative' | 'pay_all' | 'collect_all' | 'property_repair' | 'market_boost';
export interface EventCard {
    id: string;
    title: string;
    description: string;
    type: EventCardType;
    amount?: number;
    targetPosition?: number;
    steps?: number;
    repairHouseCost?: number;
    repairFlagshipCost?: number;
}
export type GameMode = 'classic' | 'quick';
export type GamePhase = 'waiting_for_roll' | 'resolving_space' | 'buying_decision' | 'debt_resolution' | 'action_phase' | 'game_over';
export interface PendingDebt {
    debtorId: string;
    creditorId: string | 'bank';
    amount: number;
    reason: string;
}
export interface GameActionLogItem {
    id: string;
    timestamp: number;
    playerId?: string;
    message: string;
    type: 'roll' | 'move' | 'buy' | 'rent' | 'tax' | 'upgrade' | 'mortgage' | 'trade' | 'bankruptcy' | 'card' | 'turn';
}
export interface GameSettings {
    startingCash: number;
    goReward: number;
    quickModeMaxRounds: number;
    detentionBailFee: number;
    mortgageInterestRate: number;
    upgradeSellBackRate: number;
}
export interface GameState {
    id: string;
    mode: GameMode;
    settings: GameSettings;
    round: number;
    activePlayerIndex: number;
    players: Player[];
    properties: Record<string, PropertyState>;
    phase: GamePhase;
    lastDiceRoll: [number, number] | null;
    doublesCount: number;
    pendingDebt: PendingDebt | null;
    activeTrade: TradeOffer | null;
    currentEventCard: EventCard | null;
    winnerId: string | null;
    actionLog: GameActionLogItem[];
    seed: number;
    turnHasRolled: boolean;
}
export interface PlayerNetWorth {
    playerId: string;
    cash: number;
    unmortgagedPropertiesValue: number;
    mortgagedPropertiesValue: number;
    upgradesValue: number;
    totalNetWorth: number;
}
export type GameAction = {
    type: 'START_GAME';
    payload: {
        mode: GameMode;
        players: Array<{
            name: string;
            token: PlayerToken;
            color: string;
        }>;
    };
} | {
    type: 'ROLL_DICE';
} | {
    type: 'PAY_DETENTION_BAIL';
} | {
    type: 'BUY_PROPERTY';
    payload: {
        spaceId: string;
    };
} | {
    type: 'DECLINE_PROPERTY';
    payload: {
        spaceId: string;
    };
} | {
    type: 'BUILD_UPGRADE';
    payload: {
        spaceId: string;
    };
} | {
    type: 'SELL_UPGRADE';
    payload: {
        spaceId: string;
    };
} | {
    type: 'MORTGAGE_PROPERTY';
    payload: {
        spaceId: string;
    };
} | {
    type: 'UNMORTGAGE_PROPERTY';
    payload: {
        spaceId: string;
    };
} | {
    type: 'PROPOSE_TRADE';
    payload: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>;
} | {
    type: 'ACCEPT_TRADE';
    payload: {
        tradeId: string;
    };
} | {
    type: 'REJECT_TRADE';
    payload: {
        tradeId: string;
    };
} | {
    type: 'RESOLVE_DEBT';
} | {
    type: 'DECLARE_BANKRUPTCY';
} | {
    type: 'END_TURN';
};
