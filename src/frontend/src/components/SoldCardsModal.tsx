import { useGetTransactionGroups } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import { PaymentMethod, TransactionType } from '../backend';

interface SoldCardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get rarity badge color
function getRarityColor(rarity: string): string {
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('limited')) return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30';
  if (rarityLower.includes('rare')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
  if (rarityLower.includes('super')) return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
  if (rarityLower.includes('unique')) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
  return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
}

export default function SoldCardsModal({ open, onOpenChange }: SoldCardsModalProps) {
  const { data: transactionGroups } = useGetTransactionGroups();

  const soldCards = transactionGroups?.sales || [];
  const tradeCards = transactionGroups?.trades || [];

  // Separate traded cards into given and received
  const tradedGivenCards = tradeCards.filter(card => card.transactionType === TransactionType.tradedGiven);
  const tradedReceivedCards = tradeCards.filter(card => card.transactionType === TransactionType.tradedReceived);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">
              <Package className="w-4 h-4 mr-2" />
              Sales ({soldCards.length})
            </TabsTrigger>
            <TabsTrigger value="trades">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Trades ({tradeCards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <ScrollArea className="h-[500px] pr-4">
              {soldCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No sold cards yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {soldCards.map((card) => {
                    const purchasePrice = card.paymentMethod === PaymentMethod.essence 
                      ? 0 
                      : card.purchasePrice * (1 - card.discountPercent / 100);
                    const salePrice = card.salePrice ?? 0;
                    const profit = salePrice - purchasePrice;
                    const isProfit = profit >= 0;

                    return (
                      <Card key={card.id.toString()} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold truncate">{card.name}</h3>
                                <Badge variant="outline" className={getRarityColor(card.rarity)}>
                                  {card.rarity}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Purchase: </span>
                                  <span className="font-medium">€{purchasePrice.toFixed(2)}</span>
                                  {card.paymentMethod === PaymentMethod.essence && (
                                    <Badge variant="outline" className="ml-2 text-xs">Essence</Badge>
                                  )}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Sale: </span>
                                  <span className="font-medium">€{salePrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <div className={`flex items-center gap-1 font-bold text-lg ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                {isProfit ? '+' : ''}€{profit.toFixed(2)}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {isProfit ? 'Profit' : 'Loss'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trades">
            <ScrollArea className="h-[500px] pr-4">
              {tradeCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ArrowLeftRight className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No trades yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tradedGivenCards.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        Cards Given ({tradedGivenCards.length})
                      </h3>
                      <div className="space-y-2">
                        {tradedGivenCards.map((card) => (
                          <Card key={card.id.toString()} className="border-orange-500/20">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getRarityColor(card.rarity)}>
                                  {card.rarity}
                                </Badge>
                                <span className="font-medium">{card.name}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {tradedReceivedCards.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Cards Received ({tradedReceivedCards.length})
                      </h3>
                      <div className="space-y-2">
                        {tradedReceivedCards.map((card) => (
                          <Card key={card.id.toString()} className="border-green-500/20">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getRarityColor(card.rarity)}>
                                  {card.rarity}
                                </Badge>
                                <span className="font-medium">{card.name}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
