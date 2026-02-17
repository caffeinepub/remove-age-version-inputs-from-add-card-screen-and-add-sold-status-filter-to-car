import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Migration "migration";
import Blob "mo:core/Blob";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

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

  public type ChangeHistoryEntry = {
    timestamp : Time.Time;
    action : ChangeAction;
    cardIds : [CardId];
    summary : Text;
  };

  let cards = Map.empty<Principal, List.List<Card>>();
  let changeHistory = Map.empty<Principal, List.List<ChangeHistoryEntry>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let backfillMarker = Map.empty<Principal, Bool>();
  var nextCardId = 0;

  func getNextCardIdInternal() : CardId {
    let currentId = nextCardId;
    nextCardId += 1;
    currentId;
  };

  func logChange(user : Principal, action : ChangeAction, cardIds : [CardId], summary : Text) {
    let entry : ChangeHistoryEntry = {
      timestamp = Time.now();
      action;
      cardIds;
      summary;
    };

    let currentHistory = switch (changeHistory.get(user)) {
      case (null) { List.empty<ChangeHistoryEntry>() };
      case (?history) { history };
    };

    currentHistory.add(entry);
    changeHistory.add(user, currentHistory);
  };

  func compareEntriesByTime(entry1 : ChangeHistoryEntry, entry2 : ChangeHistoryEntry) : Order.Order {
    if (entry1.timestamp < entry2.timestamp) { #greater } else if (entry1.timestamp > entry2.timestamp) {
      #less;
    } else {
      #equal;
    };
  };

  func getChangeHistoryInternal(user : Principal, limit : Nat, offset : Nat) : [ChangeHistoryEntry] {
    switch (changeHistory.get(user)) {
      case (null) { [] };
      case (?history) {
        let sorted = history.sort(compareEntriesByTime);
        let sortedArray = sorted.toArray();
        if (sortedArray.size() <= offset) { return [] };
        sortedArray.sliceToArray(offset, sortedArray.size()).sliceToArray(0, Nat.min(limit, sortedArray.size() - offset));
      };
    };
  };

  func verifyCardOwnership(caller : Principal, cardId : CardId) : Bool {
    switch (cards.get(caller)) {
      case (null) { false };
      case (?userCards) {
        switch (userCards.find(func(card) { card.id == cardId })) {
          case (?_) { true };
          case (null) { false };
        };
      };
    };
  };

  public query ({ caller }) func getAllCardsForUser() : async [Card] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their cards");
    };
    getAllCardsForUserInternal(caller);
  };

  public query ({ caller }) func getChangeHistory(limit : Nat, offset : Nat) : async [ChangeHistoryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in for change history");
    };
    getChangeHistoryInternal(caller, limit, offset);
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

    logChange(
      caller,
      #addCard,
      [cardId],
      "Added new card: " # name,
    );

    cardId;
  };

  public shared ({ caller }) func updateSalePrice(
    cardId : CardId,
    newSalePrice : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cards");
    };

    if (not verifyCardOwnership(caller, cardId)) {
      Runtime.trap("Unauthorized: Card does not belong to caller");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        var oldSalePrice : ?Float = null;
        let updatedCards = userCards.map<Card, Card>(
          func(card) {
            if (card.id == cardId) {
              oldSalePrice := card.salePrice;
              { card with salePrice = ?newSalePrice };
            } else { card };
          }
        );
        cards.add(caller, updatedCards);

        switch (oldSalePrice) {
          case (null) {
            logChange(
              caller,
              #updateSalePrice,
              [cardId],
              "Set sale price for card " # cardId.toText() # " to " # newSalePrice.toText(),
            );
          };
          case (?oldPrice) {
            logChange(
              caller,
              #updateSalePrice,
              [cardId],
              "Updated sale price for card " # cardId.toText() # " from " # oldPrice.toText() # " to " # newSalePrice.toText(),
            );
          };
        };
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

    if (not verifyCardOwnership(caller, cardId)) {
      Runtime.trap("Unauthorized: Card does not belong to caller");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        var oldName = "";
        let updatedCards = userCards.map<Card, Card>(
          func(card) {
            if (card.id == cardId) {
              oldName := card.name;
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

        logChange(
          caller,
          #editCard,
          [cardId],
          "Edited card #" # cardId.toText() # ": " # oldName # " → " # name,
        );
      };
    };
  };

  public shared ({ caller }) func deleteCard(cardId : CardId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cards");
    };

    if (not verifyCardOwnership(caller, cardId)) {
      Runtime.trap("Unauthorized: Card does not belong to caller");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        var deletedCardName = "";
        let filteredItems = userCards.filter(
          func(card) {
            let isMatch = card.id == cardId;
            if (isMatch) { deletedCardName := card.name };
            not isMatch;
          }
        );
        cards.add(caller, filteredItems);

        let summary = if (deletedCardName != "") {
          "Deleted card #" # cardId.toText() # " (" # deletedCardName # ")"
        } else { "Deleted card " # cardId.toText() };
        logChange(caller, #deleteCard, [cardId], summary);
      };
    };
  };

  public shared ({ caller }) func markCardAsSold(
    cardId : CardId,
    salePrice : Float,
    saleDate : Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sell cards");
    };

    if (not verifyCardOwnership(caller, cardId)) {
      Runtime.trap("Unauthorized: Card does not belong to caller");
    };

    switch (cards.get(caller)) {
      case (null) { Runtime.trap("Cards not found") };
      case (?userCards) {
        var found = false;
        let updatedItems = userCards.map<Card, Card>(
          func(card) {
            if (card.id == cardId) {
              found := true;
              { card with transactionType = #sold; salePrice = ?salePrice; saleDate = ?saleDate };
            } else { card };
          }
        );
        if (not found) { Runtime.trap("CardId not found") };
        cards.add(caller, updatedItems);

        logChange(
          caller,
          #markSold,
          [cardId],
          "Card " # cardId.toText() # " marked as sold for " # salePrice.toText() # " at " # saleDate.toText(),
        );
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
        case (_) {};
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
        case (_) {};
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
        case (_) {};
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

  public shared ({ caller }) func recordTradeTransaction(
    givenCardIds : [CardId],
    receivedCardIds : [CardId],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged in users can record trades");
    };

    for (cardId in givenCardIds.values()) {
      if (not verifyCardOwnership(caller, cardId)) {
        Runtime.trap("Unauthorized: One or more cards do not belong to caller");
      };
    };

    let currentCards = switch (cards.get(caller)) {
      case (null) { Runtime.trap("Card not found") };
      case (?userCards) { userCards };
    };

    let allExistingIds = currentCards.map<Card, CardId>(func(card) { card.id }).toArray();
    let existingIdsSet = Set.fromArray<CardId>(allExistingIds);

    let existingGivenIds = givenCardIds.filter(func(id) { existingIdsSet.contains(id) });

    if (existingGivenIds.size() != givenCardIds.size()) {
      if (existingGivenIds.size() == 0) {
        Runtime.trap("Unable to trade, non-existing cards");
      };
    };

    let updatedCards = currentCards.map<Card, Card>(
      func(card) {
        if (card.transactionType == #forSale) {
          let isGiven = switch (existingGivenIds.find(func(id) { id == card.id })) {
            case (?id) { true };
            case (null) { false };
          };
          if (isGiven) {
            {
              card with
              transactionType = #tradedGiven;
              tradeReference = ?{
                givenCards = existingGivenIds;
                receivedCards = receivedCardIds;
              };
            };
          } else {
            card;
          };
        } else {
          card;
        };
      }
    );

    cards.add(caller, updatedCards);

    logChange(
      caller,
      #trade,
      existingGivenIds,
      "Recorded trade: " # existingGivenIds.size().toText() # " cards given, " # receivedCardIds.size().toText() # " received",
    );
  };

  public shared ({ caller }) func revertTradeTransaction(
    cardId : CardId,
    tradeTransaction : TradeTransaction,
  ) : async () {
    let { givenCards; receivedCards } = tradeTransaction;
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged in users can revert trades");
    };

    if (not verifyCardOwnership(caller, cardId)) {
      Runtime.trap("Unauthorized: Card does not belong to caller");
    };

    let currentCards = switch (cards.get(caller)) {
      case (null) { Runtime.trap("Card not found") };
      case (?userCards) { userCards };
    };

    let cardExists = switch (currentCards.find(func(card) { card.id == cardId })) {
      case (?_) { true };
      case (null) { Runtime.trap("Non-existing trade card") };
    };

    if (cardExists) {
      let updatedCards = currentCards.map<Card, Card>(
        func(card) {
          if (card.id == cardId and card.transactionType == #tradedGiven) {
            {
              card with transactionType = #forSale;
              tradeReference = null;
            };
          } else {
            card;
          };
        }
      );

      cards.add(caller, updatedCards);

      logChange(
        caller,
        #revertTrade,
        givenCards,
        "Reverted trade for card: " # cardId.toText(),
      );
    };
  };

  public shared ({ caller }) func backfillHistoryEntries() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can backfill their history");
    };

    if (not backfillMarker.containsKey(caller)) {
      switch (cards.get(caller)) {
        case (null) {};
        case (?userCards) {
          for (card in userCards.values()) {
            switch (card.transactionType) {
              case (#forSale) {
                logChange(
                  caller,
                  #addCard,
                  [card.id],
                  "Backfilled: Added card #" # card.id.toText() # " (" # card.name # ")",
                );
              };
              case (#sold) {
                logChange(
                  caller,
                  #addCard,
                  [card.id],
                  "Backfilled: Added card #" # card.id.toText() # " (" # card.name # ")",
                );
                let salePriceText = switch (card.salePrice) {
                  case (?price) { price.toText() };
                  case (null) { "unknown price" };
                };
                logChange(
                  caller,
                  #markSold,
                  [card.id],
                  "Backfilled: Sold card #" # card.id.toText() # " (" # card.name # ") for " # salePriceText,
                );
              };
              case (_) {};
            };
          };
        };
      };
      backfillMarker.add(caller, true);
    };
  };
};
