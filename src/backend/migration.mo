import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type CardId = Nat;

  type ChangeAction = {
    #addCard;
    #editCard;
    #deleteCard;
    #updateSalePrice;
    #markSold;
    #trade;
    #revertTrade;
  };

  type PaymentMethod = {
    #cash;
    #eth;
    #essence;
    #trade;
  };

  type Position = {
    #torwart;
    #verteidiger;
    #mittelfeld;
    #sturm;
  };

  type TransactionType = {
    #forSale;
    #sold;
    #tradedGiven;
    #tradedReceived;
  };

  type TradeTransaction = {
    givenCards : [CardId];
    receivedCards : [CardId];
  };

  type Card = {
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
    purchaseDate : ?Time.Time;
    saleDate : ?Time.Time;
    notes : Text;
    image : ?Storage.ExternalBlob;
  };

  type UserProfile = {
    name : Text;
    profileImage : ?Storage.ExternalBlob;
  };

  type ChangeHistoryEntry = {
    timestamp : Time.Time;
    action : ChangeAction;
    cardIds : [CardId];
    summary : Text;
  };

  type OldActor = {
    cards : Map.Map<Principal, List.List<Card>>;
    changeHistory : Map.Map<Principal, List.List<ChangeHistoryEntry>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextCardId : Nat;
  };

  type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    old;
  };
};
