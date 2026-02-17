import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";
import Float "mo:core/Float";
import Text "mo:core/Text";

module {
  public type CardId = Nat;

  public type ChangeAction = {
    #addCard;
    #editCard;
    #deleteCard;
    #updateSalePrice;
    #markSold;
    #trade;
    #revertTrade;
  };

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
    image : ?Blob;
  };

  public type UserProfile = {
    name : Text;
    profileImage : ?Blob;
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

  public type ChangeHistoryEntry = {
    timestamp : Int;
    action : ChangeAction;
    cardIds : [CardId];
    summary : Text;
  };

  public type OldActor = {
    var cards : Map.Map<Principal, List.List<Card>>;
    var changeHistory : Map.Map<Principal, List.List<ChangeHistoryEntry>>;
    var userProfiles : Map.Map<Principal, UserProfile>;
    var nextCardId : Nat;
  };

  public type NewActor = {
    var cards : Map.Map<Principal, List.List<Card>>;
    var changeHistory : Map.Map<Principal, List.List<ChangeHistoryEntry>>;
    var userProfiles : Map.Map<Principal, UserProfile>;
    var nextCardId : Nat;
    var backfillMarker : Map.Map<Principal, Bool>;
  };

  public func run(old : OldActor) : NewActor {
    {
      var cards = old.cards;
      var changeHistory = old.changeHistory;
      var userProfiles = old.userProfiles;
      var nextCardId = old.nextCardId;
      var backfillMarker = Map.empty<Principal, Bool>();
    };
  };
};
