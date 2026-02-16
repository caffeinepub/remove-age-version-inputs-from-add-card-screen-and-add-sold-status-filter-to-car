import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

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
    purchaseDate : ?Time.Time;
    saleDate : ?Time.Time;
    notes : Text;
    image : ?Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
    profileImage : ?Storage.ExternalBlob;
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

  let cards = Map.empty<Principal, List.List<Card>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextCardId = 0;

  func getNextCardIdInternal() : CardId {
    let currentId = nextCardId;
    nextCardId += 1;
    currentId;
  };

  public query ({ caller }) func getAllCardsForUser() : async [Card] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their cards");
    };
    getAllCardsForUserInternal(caller);
  };

  func getAllCardsForUserInternal(user : Principal) : [Card] {
    switch (cards.get(user)) {
      case (null) { [] };
      case (?userCards) { userCards.toArray() };
    };
  };

  public shared ({ caller }) func addCard(
    name : Text,
    rarity : Text,
    purchasePrice : Float,
    discountPercent : Float,
    paymentMethod : PaymentMethod,
    country : Text,
    league : Text,
    club : Text,
    age : Nat,
    version : Text,
    season : Text,
    position : Position,
    purchaseDate : ?Time.Time,
    notes : Text,
    image : ?Storage.ExternalBlob,
  ) : async CardId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add cards");
    };

    let cardId = getNextCardIdInternal();
    let newCard : Card = {
      id = cardId;
      name;
      rarity;
      purchasePrice;
      discountPercent;
      paymentMethod;
      salePrice = null;
      country;
      league;
      club;
      age;
      version;
      season;
      position;
      owner = caller;
      transactionType = #forSale;
      tradeReference = null;
      purchaseDate;
      saleDate = null;
      notes;
      image;
    };

    let currentCards = switch (cards.get(caller)) {
      case (null) { List.empty<Card>() };
      case (?userCards) { userCards };
    };

    currentCards.add(newCard);
    cards.add(caller, currentCards);
    cardId;
  };

  public shared ({ caller }) func updateSalePrice(
    cardId : CardId,
    newSalePrice : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cards");
    };
    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        let updatedCards = userCards.map<Card, Card>(
          func(card) {
            if (card.id == cardId) { { card with salePrice = ?newSalePrice } } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  public shared ({ caller }) func updateCard(
    cardId : CardId,
    name : Text,
    rarity : Text,
    purchasePrice : Float,
    discountPercent : Float,
    paymentMethod : PaymentMethod,
    country : Text,
    league : Text,
    club : Text,
    age : Nat,
    version : Text,
    season : Text,
    position : Position,
    purchaseDate : ?Time.Time,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cards");
    };
    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        let updatedCards = userCards.map<Card, Card>(
          func(card) {
            if (card.id == cardId) {
              {
                card with
                name;
                rarity;
                purchasePrice;
                discountPercent;
                paymentMethod;
                country;
                league;
                club;
                age;
                version;
                season;
                position;
                purchaseDate;
                notes;
              };
            } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  public shared ({ caller }) func deleteCard(cardId : CardId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cards");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        let filteredItems = userCards.filter(
          func(card) { card.id != cardId }
        );
        cards.add(caller, filteredItems);
      };
    };
  };

  public query ({ caller }) func calculateInvestmentTotals() : async InvestmentTotals {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio data");
    };
    let allCards = getAllCardsForUserInternal(caller);
    var totalCash : Float = 0.0;
    var totalEth : Float = 0.0;
    for (card in allCards.values()) {
      switch (card.paymentMethod) {
        case (#cash) {
          totalCash += card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
        case (#eth) {
          totalEth += card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
        case (#essence) {};
        case (#trade) {};
      };
    };
    {
      totalCashInvested = totalCash;
      totalEthInvested = totalEth;
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func calculateTotalInvested() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio data");
    };
    let allCards = getAllCardsForUserInternal(caller);
    var total : Float = 0.0;
    for (card in allCards.values()) {
      switch (card.paymentMethod) {
        case (#cash) {
          total += card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
        case (#eth) {
          total += card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
        case (#essence) {};
        case (#trade) {};
      };
    };
    total;
  };

  public query ({ caller }) func calculateTotalBalance() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio data");
    };
    let allCards = getAllCardsForUserInternal(caller);
    var totalInvested : Float = 0.0;
    var totalReturns : Float = 0.0;

    for (card in allCards.values()) {
      switch (card.paymentMethod) {
        case (#cash) {
          totalInvested += card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
        case (#eth) {
          totalInvested += card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
        case (#essence) {};
        case (#trade) {};
      };
      if (card.transactionType == #sold) {
        switch (card.salePrice) {
          case (null) {};
          case (?price) { totalReturns += price };
        };
      };
    };

    totalReturns - totalInvested;
  };

  public query ({ caller }) func calculateTotalReturns() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio data");
    };
    let allCards = getAllCardsForUserInternal(caller);
    var total : Float = 0.0;
    for (card in allCards.values()) {
      if (card.transactionType == #sold) {
        switch (card.salePrice) {
          case (null) {};
          case (?price) { total += price };
        };
      };
    };
    total;
  };

  public query ({ caller }) func getSoldCardBalance () : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can access balances");
    };

    let allCards = getAllCardsForUserInternal(caller);
    var balance : Float = 0.0;

    for (card in allCards.values()) {
      if (card.transactionType == #sold) {
        switch (card.salePrice) {
          case (null) {};
          case (?price) { balance += price };
        };
        if (not (card.paymentMethod == #essence)) {
          balance -= card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
        };
      };
    };

    balance;
  };

  public type CardWithUser = {
    cards : [Card];
    user : Principal;
  };

  public query ({ caller }) func getAllCardsWithUser(user : Principal) : async CardWithUser {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own cards");
    };

    {
      cards = getAllCardsForUserInternal(user);
      user;
    };
  };

  public query ({ caller }) func getPortfolioSnapshot() : async PortfolioSnapshot {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get portfolio data");
    };
    let allCards = getAllCardsForUserInternal(caller);

    var totalCash : Float = 0.0;
    var totalEth : Float = 0.0;
    var totalInvested : Float = 0.0;
    var totalReturns : Float = 0.0;

    for (card in allCards.values()) {
      switch (card.paymentMethod) {
        case (#cash) {
          let cashValue = card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
          totalCash += cashValue;
          totalInvested += cashValue;
        };
        case (#eth) {
          let ethValue = card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
          totalEth += ethValue;
          totalInvested += ethValue;
        };
        case (_) {};
      };

      if (card.transactionType == #sold) {
        switch (card.salePrice) {
          case (?price) { totalReturns += price };
          case (_) {};
        };
      };
    };

    let investmentTotals : InvestmentTotals = {
      totalCashInvested = totalCash;
      totalEthInvested = totalEth;
    };

    {
      investmentTotals;
      totalInvested;
      totalBalance = totalReturns - totalInvested;
      totalReturns;
      totalReturnBalance = totalReturns - totalInvested;
      portfolioTotal = totalReturns + totalInvested;
      holdBalance = totalInvested;
      allCards;
    };
  };
};
