import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    cards : Map.Map<Principal, List.List<Card>>;
  };

  public type CardId = Nat;

  public type PaymentMethod = {
    #cash;
    #eth;
    #essence;
    #trade;
  };

  public type Position = {
    #torwart;
    #verteidiger;
    #mittelfeld;
    #sturm;
  };

  public type TransactionType = {
    #forSale;
    #sold;
    #tradedGiven;
    #tradedReceived;
  };

  public type TradeTransaction = {
    givenCards : [CardId];
    receivedCards : [CardId];
  };

  public type Card = {
    id : CardId;
    name : Text;
    rarity : Text;
    purchasePrice : Float;
    discountPercent : Float;
    paymentMethod : PaymentMethod;
    salePrice : ?Float;
    owner : Principal;
    country : Text;
    league : Text;
    club : Text;
    age : Nat;
    version : Text;
    season : Text;
    position : Position;
    transactionType : TransactionType;
    tradeReference : ?TradeTransaction;
    purchaseDate : ?Int;
    saleDate : ?Int;
    notes : Text;
    image : ?Storage.ExternalBlob;
  };

  public type InvestmentTotals = {
    totalCashInvested : Float;
    totalEthInvested : Float;
  };

  public type PortfolioSnapshot = {
    investmentTotals : InvestmentTotals;
    totalInvested : Float;
    totalBalance : Float;
    totalReturns : Float;
    totalReturnBalance : Float;
    portfolioTotal : Float;
    holdBalance : Float;
    allCards : [Card];
  };

  func transformation(cards : Map.Map<Principal, List.List<Card>>) : Map.Map<Principal, List.List<Card>> {
    cards;
  };

  public func run(old : OldActor) : {
    cards : Map.Map<Principal, List.List<Card>>;
  } {
    let transformedCards = transformation(old.cards);
    { cards = transformedCards };
  };
};
