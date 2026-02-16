import { useState } from 'react';
import { useMarkCardAsSold, useRecordTradeTransaction, useAddCard } from '../hooks/useQueries';
import { type Card, PaymentMethod, Position } from '../backend';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface SellOrTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
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

// Helper function to get rarity badge color
function getRarityColor(rarity: string): string {
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('limited')) return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30';
  if (rarityLower.includes('rare')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
  if (rarityLower.includes('super')) return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
  if (rarityLower.includes('unique')) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
  return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
}

export default function SellOrTradeDialog({ open, onOpenChange, card }: SellOrTradeDialogProps) {
  // Sell tab state
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // Trade tab state
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [receivedCards, setReceivedCards] = useState<Array<{
    name: string;
    rarity: string;
    purchasePrice: number;
    discountPercent: number;
    paymentMethod: PaymentMethod;
    country: string;
    league: string;
    club: string;
    age: number;
    version: string;
    season: string;
    position: Position;
    notes: string;
  }>>([]);

  // Add card form state
  const [cardName, setCardName] = useState('');
  const [cardRarity, setCardRarity] = useState('');
  const [cardPurchasePrice, setCardPurchasePrice] = useState('');
  const [cardDiscountPercent, setCardDiscountPercent] = useState('');
  const [cardPaymentMethod, setCardPaymentMethod] = useState<PaymentMethod | ''>(PaymentMethod.trade);
  const [cardCountry, setCardCountry] = useState('');
  const [cardLeague, setCardLeague] = useState('');
  const [cardClub, setCardClub] = useState('');
  const [cardAge, setCardAge] = useState('');
  const [cardVersion, setCardVersion] = useState('');
  const [cardSeason, setCardSeason] = useState('');
  const [cardPosition, setCardPosition] = useState<Position | ''>('');
  const [cardNotes, setCardNotes] = useState('');

  const { mutateAsync: markAsSold, isPending: isSelling } = useMarkCardAsSold();
  const { mutateAsync: recordTrade, isPending: isTrading } = useRecordTradeTransaction();
  const { mutateAsync: addCard, isPending: isAddingCard } = useAddCard();

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salePrice || !saleDate) return;

    const saleDateValue = BigInt(new Date(saleDate).getTime() * 1000000);

    try {
      await markAsSold({
        cardId: card.id,
        salePrice: parseFloat(salePrice),
        saleDate: saleDateValue,
      });
      
      setSalePrice('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to mark card as sold:', error);
    }
  };

  const handleAddReceivedCard = () => {
    if (!cardName.trim() || !cardRarity.trim() || !cardPaymentMethod || !cardPosition) return;

    const discount = cardDiscountPercent.trim() === '' ? 0 : parseFloat(cardDiscountPercent);
    const price = cardPurchasePrice.trim() === '' ? 0 : parseFloat(cardPurchasePrice);
    const age = cardAge.trim() === '' ? 0 : parseInt(cardAge);

    setReceivedCards([...receivedCards, {
      name: cardName.trim(),
      rarity: cardRarity.trim(),
      purchasePrice: price,
      discountPercent: discount,
      paymentMethod: cardPaymentMethod as PaymentMethod,
      country: cardCountry.trim(),
      league: cardLeague.trim(),
      club: cardClub.trim(),
      age,
      version: cardVersion.trim(),
      season: cardSeason.trim(),
      position: cardPosition as Position,
      notes: cardNotes.trim(),
    }]);

    // Reset form
    setCardName('');
    setCardRarity('');
    setCardPurchasePrice('');
    setCardDiscountPercent('');
    setCardPaymentMethod(PaymentMethod.trade);
    setCardCountry('');
    setCardLeague('');
    setCardClub('');
    setCardAge('');
    setCardVersion('');
    setCardSeason('');
    setCardPosition('');
    setCardNotes('');
    setShowAddCardForm(false);
  };

  const handleRemoveReceivedCard = (index: number) => {
    setReceivedCards(receivedCards.filter((_, i) => i !== index));
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (receivedCards.length === 0) return;

    try {
      // First, add all received cards
      const receivedCardIds = await Promise.all(
        receivedCards.map(async (receivedCard) => {
          return await addCard({
            name: receivedCard.name,
            rarity: receivedCard.rarity,
            purchasePrice: receivedCard.purchasePrice,
            discountPercent: receivedCard.discountPercent,
            paymentMethod: receivedCard.paymentMethod,
            country: receivedCard.country,
            league: receivedCard.league,
            club: receivedCard.club,
            age: BigInt(receivedCard.age),
            version: receivedCard.version,
            season: receivedCard.season,
            position: receivedCard.position,
            purchaseDate: null,
            notes: receivedCard.notes,
            image: null,
          });
        })
      );

      // Then record the trade transaction
      await recordTrade({
        givenCardIds: [card.id],
        receivedCardIds,
      });

      setReceivedCards([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to record trade:', error);
    }
  };

  const isAddCardFormValid = 
    cardName.trim().length > 0 && 
    cardRarity.trim().length > 0 &&
    cardPaymentMethod !== '' &&
    cardCountry.trim().length > 0 &&
    cardLeague.trim().length > 0 &&
    cardClub.trim().length > 0 &&
    cardPosition !== '' &&
    cardSeason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verkaufen oder Tauschen</DialogTitle>
          <DialogDescription>
            Verkaufe die Karte oder tausche sie gegen andere Karten.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sell" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sell">Verkaufen</TabsTrigger>
            <TabsTrigger value="trade">Tauschen</TabsTrigger>
          </TabsList>

          <TabsContent value="sell" className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-2">{card.name}</h3>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={getRarityColor(card.rarity)}>
                  {card.rarity}
                </Badge>
                <span>•</span>
                <span>Kaufpreis: €{card.purchasePrice.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSell} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Verkaufspreis (€) *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleDate">Verkaufsdatum *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSelling}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSelling || !salePrice || !saleDate}>
                  {isSelling ? 'Verkauft...' : 'Als verkauft markieren'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="trade" className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-2">Getauschte Karte</h3>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline" className={getRarityColor(card.rarity)}>
                  {card.rarity}
                </Badge>
                <span className="text-muted-foreground">{card.name}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Erhaltene Karten ({receivedCards.length})</h3>
                {!showAddCardForm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCardForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Karte hinzufügen
                  </Button>
                )}
              </div>

              {receivedCards.length > 0 && (
                <div className="space-y-2">
                  {receivedCards.map((receivedCard, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className={getRarityColor(receivedCard.rarity)}>
                          {receivedCard.rarity}
                        </Badge>
                        <span className="text-sm">{receivedCard.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReceivedCard(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {showAddCardForm && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="font-semibold text-sm">Neue Karte hinzufügen</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trade-cardName" className="text-sm">Kartenname *</Label>
                    <Input
                      id="trade-cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="z.B. Ronaldo Limited"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardRarity" className="text-sm">Seltenheit *</Label>
                    <Input
                      id="trade-cardRarity"
                      value={cardRarity}
                      onChange={(e) => setCardRarity(e.target.value)}
                      placeholder="z.B. Limited, Rare"
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="trade-cardPurchasePrice" className="text-sm">Kaufpreis (€)</Label>
                      <Input
                        id="trade-cardPurchasePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={cardPurchasePrice}
                        onChange={(e) => setCardPurchasePrice(e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-cardDiscountPercent" className="text-sm">Rabatt (%)</Label>
                      <Input
                        id="trade-cardDiscountPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cardDiscountPercent}
                        onChange={(e) => setCardDiscountPercent(e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardPaymentMethod" className="text-sm">Bezahlart *</Label>
                    <Select value={cardPaymentMethod} onValueChange={(value) => setCardPaymentMethod(value as PaymentMethod)}>
                      <SelectTrigger id="trade-cardPaymentMethod" className="h-9">
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

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardCountry" className="text-sm">Land *</Label>
                    <Input
                      id="trade-cardCountry"
                      value={cardCountry}
                      onChange={(e) => setCardCountry(e.target.value)}
                      placeholder="z.B. Deutschland"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardLeague" className="text-sm">Liga *</Label>
                    <Input
                      id="trade-cardLeague"
                      value={cardLeague}
                      onChange={(e) => setCardLeague(e.target.value)}
                      placeholder="z.B. Bundesliga"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardClub" className="text-sm">Club *</Label>
                    <Input
                      id="trade-cardClub"
                      value={cardClub}
                      onChange={(e) => setCardClub(e.target.value)}
                      placeholder="z.B. Bayern München"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardPosition" className="text-sm">Position *</Label>
                    <Select value={cardPosition} onValueChange={(value) => setCardPosition(value as Position)}>
                      <SelectTrigger id="trade-cardPosition" className="h-9">
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

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardSeason" className="text-sm">Saison *</Label>
                    <Input
                      id="trade-cardSeason"
                      value={cardSeason}
                      onChange={(e) => setCardSeason(e.target.value)}
                      placeholder="z.B. 2024/25"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade-cardNotes" className="text-sm">Notizen</Label>
                    <Textarea
                      id="trade-cardNotes"
                      value={cardNotes}
                      onChange={(e) => setCardNotes(e.target.value)}
                      placeholder="Zusätzliche Notizen..."
                      className="min-h-[60px] resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCardForm(false)}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddReceivedCard}
                      disabled={!isAddCardFormValid}
                      className="flex-1"
                    >
                      Karte hinzufügen
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!showAddCardForm && (
              <form onSubmit={handleTrade}>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isTrading || isAddingCard}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isTrading || isAddingCard || receivedCards.length === 0}>
                    {isTrading || isAddingCard ? 'Tauscht...' : 'Tausch abschließen'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
