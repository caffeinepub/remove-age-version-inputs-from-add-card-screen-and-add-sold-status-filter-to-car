import { useState } from 'react';
import { type Card, type CardId, TransactionType, PaymentMethod, Position } from '../backend';
import { useMarkCardAsSold, useRecordTradeTransaction, useGetUserCards, useAddCard } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card as CardUI, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

interface SellOrTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
}

interface NewCardData {
  name: string;
  rarity: string;
  purchasePrice: string;
  discountPercent: string;
  paymentMethod: PaymentMethod | '';
  purchaseDate: string;
  notes: string;
  country: string;
  league: string;
  club: string;
  position: Position | '';
  age: string;
  version: string;
  season: string;
}

// Helper function to get rarity styling with safe fallback
function getRarityStyle(rarity: string): string {
  const normalizedRarity = rarity.toLowerCase();
  
  if (normalizedRarity === 'limited') {
    return 'border-[3px] border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5';
  } else if (normalizedRarity === 'rare') {
    return 'border-[3px] border-red-500 bg-gradient-to-br from-red-500/10 to-red-600/5';
  } else if (normalizedRarity === 'superrare' || normalizedRarity === 'super rare') {
    return 'border-[3px] border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/5';
  } else if (normalizedRarity === 'special' || normalizedRarity === 'spezial') {
    return 'border-[3px] border-gray-500 bg-gradient-to-br from-gray-500/10 to-gray-600/5';
  }
  
  // Default fallback for unknown rarities
  return 'border-[3px] border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-600/5';
}

// Helper function to get rarity badge color with safe fallback
function getRarityBadgeColor(rarity: string): string {
  const normalizedRarity = rarity.toLowerCase();
  
  if (normalizedRarity === 'limited') {
    return 'bg-yellow-500/90 text-white border-yellow-600';
  } else if (normalizedRarity === 'rare') {
    return 'bg-red-500/90 text-white border-red-600';
  } else if (normalizedRarity === 'superrare' || normalizedRarity === 'super rare') {
    return 'bg-blue-500/90 text-white border-blue-600';
  } else if (normalizedRarity === 'special' || normalizedRarity === 'spezial') {
    return 'bg-gray-500/90 text-white border-gray-600';
  }
  
  // Default fallback for unknown rarities
  return 'bg-purple-500/90 text-white border-purple-600';
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: 'Cash',
  [PaymentMethod.eth]: 'Eth',
  [PaymentMethod.essence]: 'Essence',
  [PaymentMethod.trade]: 'Tausch',
};

const positionLabels: Record<Position, string> = {
  [Position.torwart]: 'Torwart',
  [Position.verteidiger]: 'Verteidiger',
  [Position.mittelfeld]: 'Mittelfeld',
  [Position.sturm]: 'Sturm',
};

const emptyNewCard: NewCardData = {
  name: '',
  rarity: '',
  purchasePrice: '',
  discountPercent: '',
  paymentMethod: '',
  purchaseDate: '',
  notes: '',
  country: '',
  league: '',
  club: '',
  position: '',
  age: '',
  version: '',
  season: '',
};

export default function SellOrTradeDialog({ open, onOpenChange, card }: SellOrTradeDialogProps) {
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [activeTab, setActiveTab] = useState<'sell' | 'trade'>('sell');
  const [newCardsToAdd, setNewCardsToAdd] = useState<NewCardData[]>([]);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [currentNewCard, setCurrentNewCard] = useState<NewCardData>(emptyNewCard);

  const { mutate: markCardAsSold, isPending: isSelling } = useMarkCardAsSold();
  const { mutateAsync: addCard } = useAddCard();
  const { mutate: recordTrade, isPending: isTrading } = useRecordTradeTransaction();

  const actualPurchasePrice = card.purchasePrice * (1 - card.discountPercent / 100);

  const handleSell = () => {
    const price = parseFloat(salePrice);
    if (isNaN(price) || price < 0) {
      return;
    }
    const saleDateValue = saleDate.trim() === '' ? null : BigInt(new Date(saleDate).getTime() * 1000000);
    
    markCardAsSold(
      {
        cardId: card.id,
        salePrice: price,
        saleDate: saleDateValue,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSalePrice('');
          setSaleDate('');
        },
      }
    );
  };

  const handleTrade = async () => {
    if (newCardsToAdd.length === 0) {
      return;
    }

    try {
      // First, add all new cards and collect their IDs
      const newCardIds: CardId[] = [];
      
      for (const newCardData of newCardsToAdd) {
        const discount = newCardData.discountPercent.trim() === '' ? 0 : parseFloat(newCardData.discountPercent);
        const cardAge = newCardData.age.trim() === '' ? 0 : parseInt(newCardData.age);
        const purchaseDateValue = newCardData.purchaseDate.trim() === '' ? null : BigInt(new Date(newCardData.purchaseDate).getTime() * 1000000);

        const cardId = await addCard({
          name: newCardData.name.trim(),
          rarity: newCardData.rarity.trim(),
          purchasePrice: parseFloat(newCardData.purchasePrice),
          discountPercent: discount,
          paymentMethod: newCardData.paymentMethod as PaymentMethod,
          purchaseDate: purchaseDateValue,
          notes: newCardData.notes.trim(),
          country: newCardData.country.trim(),
          league: newCardData.league.trim(),
          club: newCardData.club.trim(),
          position: newCardData.position as Position,
          age: cardAge,
          version: newCardData.version.trim(),
          season: newCardData.season.trim(),
        });
        
        newCardIds.push(cardId);
      }

      // Then record the trade transaction
      recordTrade(
        {
          givenCardIds: [card.id],
          receivedCardIds: newCardIds,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setNewCardsToAdd([]);
            setShowAddCardForm(false);
            setCurrentNewCard(emptyNewCard);
          },
        }
      );
    } catch (error) {
      console.error('Fehler beim Tausch:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSalePrice('');
    setSaleDate('');
    setNewCardsToAdd([]);
    setShowAddCardForm(false);
    setCurrentNewCard(emptyNewCard);
    setActiveTab('sell');
  };

  const isNewCardFormValid = 
    currentNewCard.name.trim().length > 0 && 
    currentNewCard.rarity.trim().length > 0 && 
    currentNewCard.purchasePrice.trim().length > 0 && 
    !isNaN(parseFloat(currentNewCard.purchasePrice)) && 
    parseFloat(currentNewCard.purchasePrice) >= 0 &&
    currentNewCard.paymentMethod !== '' &&
    currentNewCard.country.trim().length > 0 &&
    currentNewCard.league.trim().length > 0 &&
    currentNewCard.club.trim().length > 0 &&
    currentNewCard.position !== '' &&
    currentNewCard.age.trim().length > 0 &&
    !isNaN(parseInt(currentNewCard.age)) &&
    parseInt(currentNewCard.age) >= 0 &&
    currentNewCard.version.trim().length > 0 &&
    currentNewCard.season.trim().length > 0;

  const handleAddNewCardToList = () => {
    if (isNewCardFormValid) {
      setNewCardsToAdd([...newCardsToAdd, currentNewCard]);
      setCurrentNewCard(emptyNewCard);
      setShowAddCardForm(false);
    }
  };

  const handleRemoveNewCard = (index: number) => {
    setNewCardsToAdd(newCardsToAdd.filter((_, i) => i !== index));
  };

  const renderNewCardPreview = (newCardData: NewCardData, index: number) => {
    const actualPrice = parseFloat(newCardData.purchasePrice) * (1 - (parseFloat(newCardData.discountPercent || '0') / 100));

    return (
      <CardUI
        key={index}
        className={`relative ${getRarityStyle(newCardData.rarity)}`}
      >
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
          onClick={() => handleRemoveNewCard(index)}
        >
          <X className="w-3 h-3" />
        </Button>

        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
          <div className="w-full h-[180px] flex flex-col items-center justify-center p-3 text-center space-y-1.5">
            <h3 className="text-white font-bold text-sm leading-tight">{newCardData.name}</h3>
            <div className="w-full space-y-1 text-white/90 text-xs">
              <div><span className="font-semibold">{newCardData.country}</span></div>
              <div><span className="font-medium">{newCardData.league}</span></div>
              <div><span className="font-medium">{newCardData.club}</span></div>
            </div>
          </div>
          <div className="absolute top-2 left-2">
            <Badge className={`${getRarityBadgeColor(newCardData.rarity)} border font-semibold shadow-lg text-xs`}>
              {newCardData.rarity}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-sm line-clamp-1">{newCardData.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-1 pb-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Bezahlart:</span>
            <span className="font-medium">{paymentMethodLabels[newCardData.paymentMethod as PaymentMethod]}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Kaufpreis:</span>
            <span className="font-semibold">
              {newCardData.paymentMethod === PaymentMethod.essence ? actualPrice.toFixed(2) : `€${actualPrice.toFixed(2)}`}
            </span>
          </div>
        </CardContent>
      </CardUI>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Karte verkaufen oder tauschen</DialogTitle>
          <DialogDescription>
            Wähle, ob du "{card.name}" verkaufen oder gegen andere Karten tauschen möchtest.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sell' | 'trade')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sell">Verkaufen</TabsTrigger>
            <TabsTrigger value="trade">Tauschen</TabsTrigger>
          </TabsList>

          <TabsContent value="sell" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Verkaufspreis (€)</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleDate">Verkaufsdatum</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Ursprünglicher Kaufpreis: €{card.purchasePrice.toFixed(2)}</div>
              {card.discountPercent > 0 && (
                <div>Rabatt: {card.discountPercent.toFixed(1)}%</div>
              )}
              <div className="font-semibold">Tatsächlicher Kaufpreis: €{actualPurchasePrice.toFixed(2)}</div>
            </div>
          </TabsContent>

          <TabsContent value="trade" className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Karten hinzufügen, die du im Tausch erhältst:</Label>
                <Badge variant="secondary" className="text-sm">
                  {newCardsToAdd.length} hinzugefügt
                </Badge>
              </div>

              {/* Add Card Button */}
              {!showAddCardForm && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddCardForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Karte hinzufügen
                </Button>
              )}

              {/* Add Card Form */}
              {showAddCardForm && (
                <div className="relative border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Neue Karte hinzufügen</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddCardForm(false);
                        setCurrentNewCard(emptyNewCard);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <ScrollArea className="max-h-[350px] pr-4">
                    <div className="space-y-3 pb-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="newCardName" className="text-sm">Kartenname *</Label>
                        <Input
                          id="newCardName"
                          value={currentNewCard.name}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, name: e.target.value })}
                          placeholder="z.B. Messi Gold Edition"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardRarity" className="text-sm">Seltenheit *</Label>
                        <Input
                          id="newCardRarity"
                          value={currentNewCard.rarity}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, rarity: e.target.value })}
                          placeholder="z.B. Limited, Rare, Super Rare, Spezial"
                          className="h-9"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="newCardPrice" className="text-sm">Kaufpreis (€) *</Label>
                          <Input
                            id="newCardPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={currentNewCard.purchasePrice}
                            onChange={(e) => setCurrentNewCard({ ...currentNewCard, purchasePrice: e.target.value })}
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="newCardDiscount" className="text-sm">Rabatt (%)</Label>
                          <Input
                            id="newCardDiscount"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={currentNewCard.discountPercent}
                            onChange={(e) => setCurrentNewCard({ ...currentNewCard, discountPercent: e.target.value })}
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardPayment" className="text-sm">Bezahlart *</Label>
                        <Select value={currentNewCard.paymentMethod} onValueChange={(value) => setCurrentNewCard({ ...currentNewCard, paymentMethod: value as PaymentMethod })}>
                          <SelectTrigger id="newCardPayment" className="h-9">
                            <SelectValue placeholder="Wähle eine Bezahlart" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(paymentMethodLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardPurchaseDate" className="text-sm">Kaufdatum</Label>
                        <Input
                          id="newCardPurchaseDate"
                          type="date"
                          value={currentNewCard.purchaseDate}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, purchaseDate: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardNotes" className="text-sm">Notizen</Label>
                        <Textarea
                          id="newCardNotes"
                          value={currentNewCard.notes}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, notes: e.target.value })}
                          placeholder="Zusätzliche Notizen zur Karte..."
                          className="min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardCountry" className="text-sm">Land *</Label>
                        <Input
                          id="newCardCountry"
                          value={currentNewCard.country}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, country: e.target.value })}
                          placeholder="z.B. Deutschland"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardLeague" className="text-sm">Liga *</Label>
                        <Input
                          id="newCardLeague"
                          value={currentNewCard.league}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, league: e.target.value })}
                          placeholder="z.B. Bundesliga"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardClub" className="text-sm">Club *</Label>
                        <Input
                          id="newCardClub"
                          value={currentNewCard.club}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, club: e.target.value })}
                          placeholder="z.B. Bayern München"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardPosition" className="text-sm">Position *</Label>
                        <Select value={currentNewCard.position} onValueChange={(value) => setCurrentNewCard({ ...currentNewCard, position: value as Position })}>
                          <SelectTrigger id="newCardPosition" className="h-9">
                            <SelectValue placeholder="Wähle eine Position" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(positionLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardAge" className="text-sm">Alter *</Label>
                        <Input
                          id="newCardAge"
                          type="number"
                          min="0"
                          value={currentNewCard.age}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, age: e.target.value })}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardVersion" className="text-sm">Version *</Label>
                        <Input
                          id="newCardVersion"
                          value={currentNewCard.version}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, version: e.target.value })}
                          placeholder="z.B. Gold, Silver"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newCardSeason" className="text-sm">Saison *</Label>
                        <Input
                          id="newCardSeason"
                          value={currentNewCard.season}
                          onChange={(e) => setCurrentNewCard({ ...currentNewCard, season: e.target.value })}
                          placeholder="z.B. 2024/25"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowAddCardForm(false);
                        setCurrentNewCard(emptyNewCard);
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleAddNewCardToList}
                      disabled={!isNewCardFormValid}
                    >
                      Zur Liste hinzufügen
                    </Button>
                  </div>
                </div>
              )}

              {/* Preview of added cards */}
              {newCardsToAdd.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Hinzugefügte Karten:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {newCardsToAdd.map((newCard, index) => renderNewCardPreview(newCard, index))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer buttons - hidden when add card form is active */}
        {!showAddCardForm && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSelling || isTrading}>
              Abbrechen
            </Button>
            {activeTab === 'sell' ? (
              <Button
                onClick={handleSell}
                disabled={isSelling || !salePrice || parseFloat(salePrice) < 0}
              >
                {isSelling ? 'Verkauft...' : 'Verkaufen'}
              </Button>
            ) : (
              <Button
                onClick={handleTrade}
                disabled={isTrading || newCardsToAdd.length === 0}
              >
                {isTrading ? 'Tauscht...' : 'Tausch abschließen'}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
