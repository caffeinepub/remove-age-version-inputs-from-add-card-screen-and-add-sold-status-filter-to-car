import { useState } from 'react';
import { useGetTransactionGroups } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, ArrowLeftRight, ChevronDown, ChevronRight } from 'lucide-react';
import { PaymentMethod, type Card as CardType } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SoldCardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: 'Cash',
  [PaymentMethod.eth]: 'Eth',
  [PaymentMethod.essence]: 'Essence',
  [PaymentMethod.trade]: 'Tausch',
};

type ViewMode = 'sales' | 'trades';

function formatPurchasePrice(price: number, paymentMethod: PaymentMethod): string {
  if (paymentMethod === PaymentMethod.essence) {
    return price.toFixed(2);
  }
  return `€${price.toFixed(2)}`;
}

function formatSalePrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

export default function SoldCardsModal({ open, onOpenChange }: SoldCardsModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('sales');
  const [expandedTrades, setExpandedTrades] = useState<Set<bigint>>(new Set());
  const { data: transactionGroups, isLoading } = useGetTransactionGroups();

  // Include all sold cards (Cash, Eth, and Essence)
  const soldCards = transactionGroups?.sold || [];
  const tradedGivenCards = transactionGroups?.tradedGiven || [];
  const tradedReceivedCards = transactionGroups?.tradedReceived || [];

  const toggleTradeExpansion = (cardId: bigint) => {
    setExpandedTrades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const getReceivedCardsForTrade = (givenCard: CardType): CardType[] => {
    if (!givenCard.tradeReference) return [];
    const receivedIds = givenCard.tradeReference.receivedCards;
    return tradedReceivedCards.filter((card) => 
      receivedIds.some((id) => id === card.id)
    );
  };

  const renderSoldCard = (card: CardType) => {
    const actualPurchasePrice = card.purchasePrice * (1 - card.discountPercent / 100);
    
    // For Essence cards, treat purchase price as zero (pure profit)
    const monetaryCost = card.paymentMethod === PaymentMethod.essence ? 0 : actualPurchasePrice;
    const profit = card.salePrice! - monetaryCost;
    
    // Essence cards always show as profit (green/up-trend)
    const hasProfit = card.paymentMethod === PaymentMethod.essence || profit > 0;
    const hasLoss = card.paymentMethod !== PaymentMethod.essence && profit < 0;

    return (
      <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex-1">
          <div className="font-semibold">{card.name}</div>
          <div className="text-sm text-muted-foreground">
            {paymentMethodLabels[card.paymentMethod]} • Kaufpreis: {formatPurchasePrice(actualPurchasePrice, card.paymentMethod)} • Verkaufspreis: {formatSalePrice(card.salePrice!)}
          </div>
        </div>
        <div className={`font-bold flex items-center gap-1 ${hasProfit ? 'text-green-500' : hasLoss ? 'text-red-500' : ''}`}>
          {hasProfit && <TrendingUp className="w-4 h-4" />}
          {hasLoss && <TrendingDown className="w-4 h-4" />}
          {hasProfit ? '+' : ''}€{profit.toFixed(2)}
        </div>
      </div>
    );
  };

  const renderTradedGivenCard = (card: CardType) => {
    const actualPurchasePrice = card.purchasePrice * (1 - card.discountPercent / 100);
    const receivedCards = getReceivedCardsForTrade(card);
    const isExpanded = expandedTrades.has(card.id);

    return (
      <Collapsible key={card.id} open={isExpanded} onOpenChange={() => toggleTradeExpansion(card.id)}>
        <div className="border rounded-lg overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{card.name}</div>
                  <Badge variant="destructive" className="text-xs">
                    Abgegeben
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {paymentMethodLabels[card.paymentMethod]} • Kaufpreis: {formatPurchasePrice(actualPurchasePrice, card.paymentMethod)}
                </div>
                {receivedCards.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {receivedCards.length} Karte(n) im Gegenzug erhalten
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {receivedCards.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          
          {receivedCards.length > 0 && (
            <CollapsibleContent>
              <div className="border-t bg-muted/30 p-3 space-y-2">
                <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                  Im Gegenzug erhalten:
                </div>
                {receivedCards.map((receivedCard) => {
                  const receivedPrice = receivedCard.purchasePrice * (1 - receivedCard.discountPercent / 100);
                  return (
                    <div key={receivedCard.id} className="flex items-center justify-between p-2 bg-background rounded border border-green-500/20">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{receivedCard.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {receivedCard.country} • {receivedCard.league} • {receivedCard.club}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatPurchasePrice(receivedPrice, receivedCard.paymentMethod)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    );
  };

  const renderTradedReceivedCard = (card: CardType) => {
    const actualPurchasePrice = card.purchasePrice * (1 - card.discountPercent / 100);

    return (
      <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{card.name}</div>
            <Badge variant="default" className="text-xs bg-green-600">
              Erhalten
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {paymentMethodLabels[card.paymentMethod]} • Kaufpreis: {formatPurchasePrice(actualPurchasePrice, card.paymentMethod)}
          </div>
        </div>
        <div className="text-muted-foreground">
          <ArrowLeftRight className="w-4 h-4" />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaktionsübersicht</DialogTitle>
          <DialogDescription>
            Detaillierte Ansicht aller Verkäufe und Tausch-Transaktionen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Ansicht:</label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Verkäufe</SelectItem>
                <SelectItem value="trades">Tausch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content based on view mode */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Lädt Transaktionen...</p>
              </div>
            </div>
          ) : viewMode === 'sales' ? (
            <div className="space-y-3">
              {soldCards.length > 0 ? (
                soldCards.map(renderSoldCard)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Keine Verkäufe</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Du hast noch keine Karten verkauft.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Given Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-orange-600 dark:text-orange-400">Abgegebene Karten</span>
                  <Badge variant="outline">{tradedGivenCards.length}</Badge>
                </h3>
                <div className="space-y-3">
                  {tradedGivenCards.length > 0 ? (
                    tradedGivenCards.map(renderTradedGivenCard)
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          Keine abgegebenen Karten
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Received Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">Erhaltene Karten</span>
                  <Badge variant="outline">{tradedReceivedCards.length}</Badge>
                </h3>
                <div className="space-y-3">
                  {tradedReceivedCards.length > 0 ? (
                    tradedReceivedCards.map(renderTradedReceivedCard)
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          Keine erhaltenen Karten
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
