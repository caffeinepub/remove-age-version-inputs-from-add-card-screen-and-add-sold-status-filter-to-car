import { useState } from 'react';
import { type Card, PaymentMethod, TransactionType, Position } from '../backend';
import { useDeleteCard } from '../hooks/useQueries';
import { Card as CardUI, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EditCardDialog from './EditCardDialog';
import SellOrTradeDialog from './SellOrTradeDialog';

interface CardItemProps {
  card: Card;
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

function formatDate(timestamp: bigint | undefined): string {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatPurchasePrice(price: number, paymentMethod: PaymentMethod): string {
  if (paymentMethod === PaymentMethod.essence) {
    return price.toFixed(2);
  }
  return `€${price.toFixed(2)}`;
}

function formatSalePrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

export default function CardItem({ card }: CardItemProps) {
  const [isSellOrTradeDialogOpen, setIsSellOrTradeDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();

  // Calculate actual purchase price after discount
  const actualPurchasePrice = card.purchasePrice * (1 - card.discountPercent / 100);
  const isSold = card.transactionType === TransactionType.sold;
  const isTraded = card.transactionType === TransactionType.tradedGiven || card.transactionType === TransactionType.tradedReceived;
  const isEssenceCard = card.paymentMethod === PaymentMethod.essence;
  
  // Only calculate profit/loss for non-Essence cards
  const profit = isSold && card.salePrice && !isEssenceCard ? card.salePrice - actualPurchasePrice : 0;
  const hasProfit = profit > 0;
  const hasLoss = profit < 0;
  const hasDiscount = card.discountPercent > 0;

  const handleDelete = () => {
    deleteCard(card.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const getStatusBadge = () => {
    if (isSold) return <Badge variant="secondary" className="font-semibold shadow-lg text-xs">Verkauft</Badge>;
    if (card.transactionType === TransactionType.tradedGiven) return <Badge variant="destructive" className="font-semibold shadow-lg text-xs">Abgegeben</Badge>;
    if (card.transactionType === TransactionType.tradedReceived) return <Badge className="font-semibold shadow-lg text-xs bg-green-600">Erhalten</Badge>;
    return null;
  };

  // Check if age and version should be displayed
  const showAge = card.age > 0n;
  const showVersion = card.version.trim().length > 0;

  return (
    <>
      <CardUI className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${getRarityStyle(card.rarity)}`}>
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
          <div className="w-[169px] h-[258px] flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div className="w-full space-y-1.5 text-white/90">
              <div className="text-sm">
                <span className="font-semibold">{card.country}</span>
              </div>
              <div className="text-sm font-bold text-white pt-1">
                {card.name}
              </div>
              <div className="text-sm">
                <span className="font-medium">{card.league}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{card.club}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{positionLabels[card.position]}</span>
              </div>
              {showAge && (
                <div className="text-sm pt-1 border-t border-white/20">
                  <span className="font-medium">Alter: {Number(card.age)}</span>
                </div>
              )}
              {showVersion && (
                <div className="text-sm">
                  <span className="font-medium">{card.version}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Saison: {card.season}</span>
              </div>
            </div>
            {card.notes && (
              <div className="w-full pt-2 border-t border-white/20">
                <p className="text-white text-xs leading-relaxed line-clamp-3">{card.notes}</p>
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <Badge className={`${getRarityBadgeColor(card.rarity)} border font-semibold shadow-lg text-xs`}>
              {card.rarity}
            </Badge>
          </div>
          {(isSold || isTraded) && (
            <div className="absolute top-2 left-2">
              {getStatusBadge()}
            </div>
          )}
        </div>

        <CardContent className="space-y-1.5 pb-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Bezahlart:</span>
            <span className="font-medium">{paymentMethodLabels[card.paymentMethod]}</span>
          </div>
          {hasDiscount ? (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Urspr. Preis:</span>
                <span className="font-medium line-through text-muted-foreground">{formatPurchasePrice(card.purchasePrice, card.paymentMethod)}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-1.5">
                <span className="text-muted-foreground">Kaufpreis:</span>
                <span className="font-semibold">{formatPurchasePrice(actualPurchasePrice, card.paymentMethod)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Kaufpreis:</span>
              <span className="font-semibold">{formatPurchasePrice(card.purchasePrice, card.paymentMethod)}</span>
            </div>
          )}
          {card.purchaseDate && (
            <div className="flex justify-between text-xs pt-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Kaufdatum:
              </span>
              <span className="font-medium text-white">{formatDate(card.purchaseDate)}</span>
            </div>
          )}
          {isSold && card.salePrice && (
            <>
              <div className="flex justify-between text-xs pt-1.5">
                <span className="text-muted-foreground">Verkaufspreis:</span>
                <span className="font-semibold">{formatSalePrice(card.salePrice)}</span>
              </div>
              {card.saleDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Verkaufsdatum:
                  </span>
                  <span className="font-medium text-white">{formatDate(card.saleDate)}</span>
                </div>
              )}
              {/* Only show profit/loss for non-Essence cards */}
              {!isEssenceCard && (
                <div className="flex justify-between text-xs pt-1.5 border-t">
                  <span className="text-muted-foreground">Gewinn/Verlust:</span>
                  <span className={`font-bold flex items-center gap-1 ${hasProfit ? 'text-green-500' : hasLoss ? 'text-red-500' : ''}`}>
                    {hasProfit && <TrendingUp className="w-3 h-3" />}
                    {hasLoss && <TrendingDown className="w-3 h-3" />}
                    {hasProfit ? '+' : ''}€{profit.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="gap-2 pt-3">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setIsEditDialogOpen(true)} disabled={isDeleting}>
            <Edit className="w-3 h-3 mr-1" />
            Bearbeiten
          </Button>
          {!isSold && !isTraded && (
            <Button variant="default" size="sm" className="flex-1 text-xs h-8" onClick={() => setIsSellOrTradeDialogOpen(true)} disabled={isDeleting}>
              Verkaufen/Tauschen
            </Button>
          )}
          <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </CardFooter>
      </CardUI>

      {/* Sell or Trade Dialog */}
      <SellOrTradeDialog open={isSellOrTradeDialogOpen} onOpenChange={setIsSellOrTradeDialogOpen} card={card} />

      {/* Edit Card Dialog */}
      <EditCardDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} card={card} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du "{card.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Löscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
