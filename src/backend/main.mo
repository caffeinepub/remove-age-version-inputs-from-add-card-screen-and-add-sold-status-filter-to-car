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
        let filteredCards = userCards.filter(
          func(card) { card.id != cardId }
        );
        cards.add(caller, filteredCards);
      };
    };
  };

  public type InvestmentTotals = {
    totalCashInvested : Float;
    totalEthInvested : Float;
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

  // ------------------- NEW BACKEND ENDPOINT FOR SOLD CARD BALANCES ----------------------
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
        balance -= card.purchasePrice * (1.0 - (card.discountPercent / 100.0));
      };
    };

    balance;
  };
  // --------------------------------------------------------------------------------------

  public shared ({ caller }) func markCardAsSold(cardId : CardId, salePrice : Float, saleDate : ?Time.Time) : async () {
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
                salePrice = ?salePrice;
                transactionType = #sold;
                saleDate;
              };
            } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  func containsId(array : [CardId], id : CardId) : Bool {
    switch (array.find(func(x) { x == id })) {
      case (?_) { true };
      case (null) { false };
    };
  };

  public shared ({ caller }) func recordTradeTransaction(
    givenCardIds : [CardId],
    receivedCardIds : [CardId],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record trades");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("No cards found");
      };
      case (?userCards) {
        let updatedGivenCards = userCards.map<Card, Card>(
          func(card) {
            if (containsId(givenCardIds, card.id)) {
              {
                card with
                transactionType = #tradedGiven;
                tradeReference = ?{ givenCards = givenCardIds; receivedCards = receivedCardIds };
              };
            } else { card };
          }
        );

        let fullyUpdatedCards = updatedGivenCards.map<Card, Card>(
          func(card) {
            if (containsId(receivedCardIds, card.id)) {
              {
                card with
                transactionType = #tradedReceived;
                tradeReference = ?{ givenCards = givenCardIds; receivedCards = receivedCardIds };
              };
            } else { card };
          }
        );

        cards.add(caller, fullyUpdatedCards);
      };
    };
  };

  public shared ({ caller }) func revertTradeTransaction(cardIds : [CardId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can revert trades");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("No cards found");
      };
      case (?userCards) {
        let updatedCards = userCards.map<Card, Card>(
          func(card) {
            if (containsId(cardIds, card.id)) {
              {
                card with
                transactionType = #forSale;
                tradeReference = null;
              };
            } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  public type TransactionSummary = {
    forSaleCount : Nat;
    soldCount : Nat;
    tradedGivenCount : Nat;
    tradedReceivedCount : Nat;
  };

  public query ({ caller }) func getTransactionSummary() : async TransactionSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio data");
    };
    let allCards = getAllCardsForUserInternal(caller);

    var forSaleCount = 0;
    var soldCount = 0;
    var tradedGivenCount = 0;
    var tradedReceivedCount = 0;

    for (card in allCards.values()) {
      switch (card.transactionType) {
        case (#forSale) { forSaleCount += 1 };
        case (#sold) { soldCount += 1 };
        case (#tradedGiven) { tradedGivenCount += 1 };
        case (#tradedReceived) { tradedReceivedCount += 1 };
      };
    };

    {
      forSaleCount;
      soldCount;
      tradedGivenCount;
      tradedReceivedCount;
    };
  };

  public type TransactionGroup = {
    forSale : [Card];
    sold : [Card];
    tradedGiven : [Card];
    tradedReceived : [Card];
  };

  public query ({ caller }) func getTransactionGroups() : async TransactionGroup {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access transaction data");
    };
    let allCards = getAllCardsForUserInternal(caller);

    let forSaleIds = List.empty<Nat>();
    let soldIds = List.empty<Nat>();
    let tradedGivenIds = List.empty<Nat>();
    let tradedReceivedIds = List.empty<Nat>();

    let forSaleCards = List.empty<Card>();
    let soldCards = List.empty<Card>();
    let tradedGivenCards = List.empty<Card>();
    let tradedReceivedCards = List.empty<Card>();

    for (card in allCards.values()) {
      switch (card.transactionType) {
        case (#forSale) {
          forSaleCards.add(card);
          forSaleIds.add(card.id);
        };
        case (#sold) {
          soldCards.add(card);
          soldIds.add(card.id);
        };
        case (#tradedGiven) {
          tradedGivenCards.add(card);
          tradedGivenIds.add(card.id);
        };
        case (#tradedReceived) {
          tradedReceivedCards.add(card);
          tradedReceivedIds.add(card.id);
        };
      };
    };
    {
      forSale = forSaleCards.toArray();
      sold = soldCards.toArray();
      tradedGiven = tradedGivenCards.toArray();
      tradedReceived = tradedReceivedCards.toArray();
    };
  };

  public query ({ caller }) func getValidCardIds() : async [CardId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };
    let allCards = getAllCardsForUserInternal(caller);

    allCards.filter(
      func(card) { card.transactionType == #forSale or card.transactionType == #tradedGiven or card.transactionType == #tradedReceived }
    ).map(func(card) { card.id });
  };

  public query ({ caller }) func getCardsByTransactionType(transactionType : TransactionType) : async [Card] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };

    let allCards = getAllCardsForUserInternal(caller);
    allCards.filter(func(card) { card.transactionType == transactionType });
  };

  public shared ({ caller }) func transferCardOwnership(cardId : CardId, newOwner : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer cards");
    };

    switch (cards.get(caller)) {
      case (null) {
        Runtime.trap("Card not found");
      };
      case (?userCards) {
        let updatedCards = userCards.map<Card, Card>(
          func(card) {
            if (card.id == cardId) {
              { card with owner = newOwner };
            } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  public query ({ caller }) func getTradeSummary() : async {
    totalGiven : Nat;
    totalReceived : Nat;
    totalCards : Nat;
    givenCards : [Card];
    receivedCards : [Card];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access trade data");
    };

    let allCards = getAllCardsForUserInternal(caller);
    let givenList = List.empty<Card>();
    let receivedList = List.empty<Card>();

    for (card in allCards.values()) {
      switch (card.transactionType) {
        case (#tradedGiven) { givenList.add(card) };
        case (#tradedReceived) { receivedList.add(card) };
        case (_) {};
      };
    };

    {
      totalGiven = givenList.size();
      totalReceived = receivedList.size();
      totalCards = allCards.size();
      givenCards = givenList.toArray();
      receivedCards = receivedList.toArray();
    };
  };

  public query ({ caller }) func getAllCardsForUserRPC(user : Principal) : async [Card] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own cards");
    };
    getAllCardsForUserInternal(user);
  };

  public shared ({ caller }) func updateCardTransactionType(cardId : CardId, transactionType : TransactionType) : async () {
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
            if (card.id == cardId) { { card with transactionType } } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  public shared ({ caller }) func saveBatchCards(cardsToSave : [Card]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save cards");
    };

    let cardsList = List.empty<Card>();
    for (card in cardsToSave.values()) {
      cardsList.add(card);
    };
    cards.add(caller, cardsList);
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

  public query ({ caller }) func getSoldCards(user : Principal) : async [Card] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own cards");
    };
    let allCards = getAllCardsForUserInternal(user);
    allCards.filter(
      func(card) { card.transactionType == #sold }
    );
  };

  public shared ({ caller }) func swapCardIds(user1 : Principal, user2 : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can swap card collections");
    };

    let temp1 = cards.get(user1);
    let temp2 = cards.get(user2);

    switch (temp1, temp2) {
      case (?cards1, ?cards2) {
        cards.add(user1, cards2);
        cards.add(user2, cards1);
      };
      case (_, _) {};
    };
  };

  public shared ({ caller }) func initializeDefaultCardForUsers(user1 : Principal, user2 : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can initialize default cards");
    };

    let defaultCard : Card = {
      id = 0;
      name = "";
      rarity = "limited";
      purchasePrice = 0.0;
      discountPercent = 0.0;
      paymentMethod = #cash;
      salePrice = null;
      country = "";
      league = "";
      club = "";
      age = 0;
      version = "";
      season = "";
      position = #torwart;
      owner = caller;
      transactionType = #forSale;
      tradeReference = null;
      purchaseDate = null;
      saleDate = null;
      notes = "";
      image = null;
    };

    let defaultCardsList = List.empty<Card>();
    defaultCardsList.add(defaultCard);

    cards.add(user1, defaultCardsList);
    cards.add(user2, defaultCardsList);
  };

  public query ({ caller }) func getCardById(cardId : CardId) : async ?Card {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };

    let allCards = getAllCardsForUserInternal(caller);
    switch (allCards.find(func(card) { card.id == cardId })) {
      case (null) { null };
      case (?card) { ?card };
    };
  };

  public shared ({ caller }) func markCardAsSoldById(cardId : CardId, salePrice : Float, saleDate : ?Time.Time) : async () {
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
                salePrice = ?salePrice;
                transactionType = #sold;
                saleDate;
              };
            } else { card };
          }
        );
        cards.add(caller, updatedCards);
      };
    };
  };

  public query ({ caller }) func countCraftedCards() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };
    let allCards = getAllCardsForUserInternal(caller);
    var count = 0;
    for (card in allCards.values()) {
      if (card.paymentMethod == #essence and card.transactionType == #forSale) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getCraftedCards() : async [Card] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };
    let allCards = getAllCardsForUserInternal(caller);

    let essenceCards = List.empty<Card>();

    for (card in allCards.values()) {
      if (card.paymentMethod == #essence and card.transactionType == #forSale) {
        essenceCards.add(card);
      };
    };

    essenceCards.toArray();
  };

  public query ({ caller }) func getCraftedCardsWithBalance() : async {
    cards : [Card];
    balance : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };
    let cards = getCraftedCardsInternal(caller);
    {
      cards;
      balance = cards.size();
    };
  };

  func getCraftedCardsInternal(user : Principal) : [Card] {
    let allCards = getAllCardsForUserInternal(user);

    let essenceCards = List.empty<Card>();

    for (card in allCards.values()) {
      if (card.paymentMethod == #essence and card.transactionType == #forSale) {
        essenceCards.add(card);
      };
    };

    essenceCards.toArray();
  };

  public query ({ caller }) func getAllCraftedCards() : async {
    cards : [Card];
    count : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access card data");
    };
    let essenceCards = List.empty<Card>();

    for (card in getAllCardsForUserInternal(caller).values()) {
      if (card.paymentMethod == #essence and card.transactionType == #forSale) {
        essenceCards.add(card);
      };
    };

    let cardsArray = essenceCards.toArray();
    {
      cards = cardsArray;
      count = essenceCards.size();
    };
  };
};

