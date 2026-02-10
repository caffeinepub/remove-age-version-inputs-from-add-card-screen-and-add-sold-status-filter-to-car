import { useState, useEffect } from 'react';
import { useUpdateCard } from '../hooks/useQueries';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface EditCardDialogProps {
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

export default function EditCardDialog({ open, onOpenChange, card }: EditCardDialogProps) {
  const [name, setName] = useState(card.name);
  const [rarity, setRarity] = useState(card.rarity);
  const [purchasePrice, setPurchasePrice] = useState(card.purchasePrice.toString());
  const [discountPercent, setDiscountPercent] = useState(card.discountPercent.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(card.paymentMethod);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState(card.notes || '');
  const [country, setCountry] = useState(card.country);
  const [league, setLeague] = useState(card.league);
  const [club, setClub] = useState(card.club);
  const [position, setPosition] = useState<Position>(card.position);
  const [season, setSeason] = useState(card.season);

  const { mutateAsync: updateCard, isPending } = useUpdateCard();

  // Reset form when card changes
  useEffect(() => {
    setName(card.name);
    setRarity(card.rarity);
    setPurchasePrice(card.purchasePrice.toString());
    setDiscountPercent(card.discountPercent.toString());
    setPaymentMethod(card.paymentMethod);
    setNotes(card.notes || '');
    setCountry(card.country);
    setLeague(card.league);
    setClub(card.club);
    setPosition(card.position);
    setSeason(card.season);
    
    // Convert purchaseDate from nanoseconds to date string
    if (card.purchaseDate) {
      const date = new Date(Number(card.purchaseDate) / 1000000);
      setPurchaseDate(date.toISOString().split('T')[0]);
    } else {
      setPurchaseDate('');
    }
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const discount = discountPercent.trim() === '' ? 0 : parseFloat(discountPercent);
    const purchaseDateValue = purchaseDate.trim() === '' ? null : BigInt(new Date(purchaseDate).getTime() * 1000000);

    try {
      await updateCard({
        cardId: card.id,
        name: name.trim(),
        rarity: rarity.trim(),
        purchasePrice: parseFloat(purchasePrice),
        discountPercent: discount,
        paymentMethod,
        purchaseDate: purchaseDateValue,
        notes: notes.trim(),
        country: country.trim(),
        league: league.trim(),
        club: club.trim(),
        position,
        age: Number(card.age),
        version: card.version,
        season: season.trim(),
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  // Check if all mandatory fields are filled
  const isFormValid = 
    name.trim().length > 0 && 
    rarity.trim().length > 0 &&
    purchasePrice.trim().length > 0 && 
    !isNaN(parseFloat(purchasePrice)) && 
    parseFloat(purchasePrice) >= 0 &&
    country.trim().length > 0 &&
    league.trim().length > 0 &&
    club.trim().length > 0 &&
    season.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Karte bearbeiten</DialogTitle>
          <DialogDescription>Bearbeite die Details deiner Karte.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-sm">Kartenname *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Messi Gold Edition"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-rarity" className="text-sm">Seltenheit *</Label>
            <Input
              id="edit-rarity"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="z.B. Limited, Rare, Super Rare, Spezial"
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-purchasePrice" className="text-sm">Kaufpreis (€) *</Label>
              <Input
                id="edit-purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-discountPercent" className="text-sm">Rabatt (%)</Label>
              <Input
                id="edit-discountPercent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="0.00"
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-paymentMethod" className="text-sm">Bezahlart *</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger id="edit-paymentMethod" className="h-9">
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
            <Label htmlFor="edit-purchaseDate" className="text-sm">Kaufdatum</Label>
            <Input
              id="edit-purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="text-sm">Notizen</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Notizen zur Karte..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-country" className="text-sm">Land *</Label>
            <Input
              id="edit-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="z.B. Deutschland"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-league" className="text-sm">Liga *</Label>
            <Input
              id="edit-league"
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              placeholder="z.B. Bundesliga"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-club" className="text-sm">Club *</Label>
            <Input
              id="edit-club"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              placeholder="z.B. Bayern München"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-position" className="text-sm">Position *</Label>
            <Select value={position} onValueChange={(value) => setPosition(value as Position)}>
              <SelectTrigger id="edit-position" className="h-9">
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
            <Label htmlFor="edit-season" className="text-sm">Saison *</Label>
            <Input
              id="edit-season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="z.B. 2024/25"
              required
              className="h-9"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-9">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending || !isFormValid} className="h-9">
              {isPending ? 'Speichert...' : 'Änderungen speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
