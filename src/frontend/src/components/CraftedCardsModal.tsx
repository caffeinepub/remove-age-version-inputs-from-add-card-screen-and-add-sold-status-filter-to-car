import { useGetCraftedCards } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Package } from 'lucide-react';
import { type Card as CardType, Position } from '../backend';
import { Badge } from '@/components/ui/badge';

interface CraftedCardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get rarity badge color with safe fallback
function getRarityBadgeColor(rarity: string): string {
  const normalizedRarity = rarity.toLowerCase();
  
  if (normalizedRarity === 'limited') {
    return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
  } else if (normalizedRarity === 'rare') {
    return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
  } else if (normalizedRarity === 'superrare' || normalizedRarity === 'super rare') {
    return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
  } else if (normalizedRarity === 'special' || normalizedRarity === 'spezial') {
    return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
  }
  
  // Default fallback for unknown rarities
  return 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30';
}

const positionLabels: Record<Position, string> = {
  [Position.torwart]: 'Torwart',
  [Position.verteidiger]: 'Verteidiger',
  [Position.mittelfeld]: 'Mittelfeld',
  [Position.sturm]: 'Sturm',
};

export default function CraftedCardsModal({ open, onOpenChange }: CraftedCardsModalProps) {
  const { data: craftedCards = [], isLoading } = useGetCraftedCards();

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return null;
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const renderCraftedCard = (card: CardType) => {
    const actualPurchasePrice = card.purchasePrice * (1 - card.discountPercent / 100);
    const purchaseDate = formatDate(card.purchaseDate);
    const showAge = card.age > 0n;
    const showVersion = card.version.trim().length > 0;

    return (
      <div key={card.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors bg-purple-500/5 border-purple-500/20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{card.name}</h3>
              <Badge className={`text-xs ${getRarityBadgeColor(card.rarity)}`}>
                {card.rarity}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3 h-3" />
              <span>Essence</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-muted-foreground">Kaufpreis</div>
            <div className="text-lg font-bold">{actualPurchasePrice.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Land:</span>
            <span className="ml-1 font-medium">{card.country}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Liga:</span>
            <span className="ml-1 font-medium">{card.league}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Club:</span>
            <span className="ml-1 font-medium">{card.club}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Position:</span>
            <span className="ml-1 font-medium">{positionLabels[card.position]}</span>
          </div>
          {showAge && (
            <div>
              <span className="text-muted-foreground">Alter:</span>
              <span className="ml-1 font-medium">{Number(card.age)}</span>
            </div>
          )}
          {showVersion && (
            <div>
              <span className="text-muted-foreground">Version:</span>
              <span className="ml-1 font-medium">{card.version}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Saison:</span>
            <span className="ml-1 font-medium">{card.season}</span>
          </div>
        </div>

        {purchaseDate && (
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Gekauft am: {purchaseDate}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Gecraftete Karten
          </DialogTitle>
          <DialogDescription>
            Alle Karten, die mit Essence erstellt wurden (nicht-monetäre Assets)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Lädt gecraftete Karten...</p>
              </div>
            </div>
          ) : craftedCards.length > 0 ? (
            <div className="space-y-3">
              {craftedCards.map(renderCraftedCard)}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine gecrafteten Karten</h3>
                <p className="text-muted-foreground max-w-sm">
                  Du hast noch keine Karten mit Essence erstellt.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
