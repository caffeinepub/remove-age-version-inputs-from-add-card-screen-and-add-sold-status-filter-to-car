import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ChangeHistoryEntry {
    action: ChangeAction;
    summary: string;
    timestamp: Time;
    cardIds: Array<CardId>;
}
export interface Card {
    id: CardId;
    age: bigint;
    paymentMethod: PaymentMethod;
    purchasePrice: number;
    country: string;
    transactionType: TransactionType;
    purchaseDate?: Time;
    owner: Principal;
    club: string;
    name: string;
    tradeReference?: TradeTransaction;
    season: string;
    discountPercent: number;
    version: string;
    league: string;
    notes: string;
    salePrice?: number;
    rarity: string;
    image?: ExternalBlob;
    position: Position;
    saleDate?: Time;
}
export type Time = bigint;
export interface InvestmentTotals {
    totalCashInvested: number;
    totalEthInvested: number;
}
export interface TradeTransaction {
    givenCards: Array<CardId>;
    receivedCards: Array<CardId>;
}
export interface CardWithUser {
    cards: Array<Card>;
    user: Principal;
}
export interface PortfolioSnapshot {
    holdBalance: number;
    totalInvested: number;
    investmentTotals: InvestmentTotals;
    allCards: Array<Card>;
    portfolioTotal: number;
    totalReturns: number;
    totalBalance: number;
    totalReturnBalance: number;
}
export type CardId = bigint;
export interface UserProfile {
    profileImage?: ExternalBlob;
    name: string;
}
export enum ChangeAction {
    updateSalePrice = "updateSalePrice",
    trade = "trade",
    addCard = "addCard",
    markSold = "markSold",
    deleteCard = "deleteCard",
    revertTrade = "revertTrade",
    editCard = "editCard"
}
export enum PaymentMethod {
    eth = "eth",
    trade = "trade",
    cash = "cash",
    essence = "essence"
}
export enum Position {
    torwart = "torwart",
    verteidiger = "verteidiger",
    sturm = "sturm",
    mittelfeld = "mittelfeld"
}
export enum TransactionType {
    sold = "sold",
    tradedReceived = "tradedReceived",
    forSale = "forSale",
    tradedGiven = "tradedGiven"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCard(name: string, rarity: string, purchasePrice: number, discountPercent: number, paymentMethod: PaymentMethod, country: string, league: string, club: string, age: bigint, version: string, season: string, position: Position, purchaseDate: Time | null, notes: string, image: ExternalBlob | null): Promise<CardId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateInvestmentTotals(): Promise<InvestmentTotals>;
    calculateTotalBalance(): Promise<number>;
    calculateTotalInvested(): Promise<number>;
    calculateTotalReturns(): Promise<number>;
    deleteCard(cardId: CardId): Promise<void>;
    getAllCardsForUser(): Promise<Array<Card>>;
    getAllCardsWithUser(user: Principal): Promise<CardWithUser>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChangeHistory(limit: bigint, offset: bigint): Promise<Array<ChangeHistoryEntry>>;
    getPortfolioSnapshot(): Promise<PortfolioSnapshot>;
    getSoldCardBalance(): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markCardAsSold(cardId: CardId, salePrice: number, saleDate: Time): Promise<void>;
    recordTradeTransaction(givenCardIds: Array<CardId>, receivedCardIds: Array<CardId>): Promise<void>;
    revertTradeTransaction(cardId: CardId, tradeTransaction: TradeTransaction): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCard(cardId: CardId, name: string, rarity: string, purchasePrice: number, discountPercent: number, paymentMethod: PaymentMethod, country: string, league: string, club: string, age: bigint, version: string, season: string, position: Position, purchaseDate: Time | null, notes: string): Promise<void>;
    updateSalePrice(cardId: CardId, newSalePrice: number): Promise<void>;
}
