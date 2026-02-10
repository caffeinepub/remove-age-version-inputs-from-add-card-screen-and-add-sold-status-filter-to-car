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
export interface TransactionSummary {
    tradedGivenCount: bigint;
    forSaleCount: bigint;
    tradedReceivedCount: bigint;
    soldCount: bigint;
}
export interface TradeTransaction {
    givenCards: Array<CardId>;
    receivedCards: Array<CardId>;
}
export interface TransactionGroup {
    sold: Array<Card>;
    tradedReceived: Array<Card>;
    forSale: Array<Card>;
    tradedGiven: Array<Card>;
}
export interface CardWithUser {
    cards: Array<Card>;
    user: Principal;
}
export type CardId = bigint;
export interface UserProfile {
    profileImage?: ExternalBlob;
    name: string;
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
    countCraftedCards(): Promise<bigint>;
    deleteCard(cardId: CardId): Promise<void>;
    getAllCardsForUser(): Promise<Array<Card>>;
    getAllCardsForUserRPC(user: Principal): Promise<Array<Card>>;
    getAllCardsWithUser(user: Principal): Promise<CardWithUser>;
    getAllCraftedCards(): Promise<{
        cards: Array<Card>;
        count: bigint;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCardById(cardId: CardId): Promise<Card | null>;
    getCardsByTransactionType(transactionType: TransactionType): Promise<Array<Card>>;
    getCraftedCards(): Promise<Array<Card>>;
    getCraftedCardsWithBalance(): Promise<{
        balance: bigint;
        cards: Array<Card>;
    }>;
    getSoldCardBalance(): Promise<number>;
    getSoldCards(user: Principal): Promise<Array<Card>>;
    getTradeSummary(): Promise<{
        totalReceived: bigint;
        totalCards: bigint;
        givenCards: Array<Card>;
        totalGiven: bigint;
        receivedCards: Array<Card>;
    }>;
    getTransactionGroups(): Promise<TransactionGroup>;
    getTransactionSummary(): Promise<TransactionSummary>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getValidCardIds(): Promise<Array<CardId>>;
    initializeDefaultCardForUsers(user1: Principal, user2: Principal): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    markCardAsSold(cardId: CardId, salePrice: number, saleDate: Time | null): Promise<void>;
    markCardAsSoldById(cardId: CardId, salePrice: number, saleDate: Time | null): Promise<void>;
    recordTradeTransaction(givenCardIds: Array<CardId>, receivedCardIds: Array<CardId>): Promise<void>;
    revertTradeTransaction(cardIds: Array<CardId>): Promise<void>;
    saveBatchCards(cardsToSave: Array<Card>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    swapCardIds(user1: Principal, user2: Principal): Promise<void>;
    transferCardOwnership(cardId: CardId, newOwner: Principal): Promise<void>;
    updateCard(cardId: CardId, name: string, rarity: string, purchasePrice: number, discountPercent: number, paymentMethod: PaymentMethod, country: string, league: string, club: string, age: bigint, version: string, season: string, position: Position, purchaseDate: Time | null, notes: string): Promise<void>;
    updateCardTransactionType(cardId: CardId, transactionType: TransactionType): Promise<void>;
    updateSalePrice(cardId: CardId, newSalePrice: number): Promise<void>;
}
