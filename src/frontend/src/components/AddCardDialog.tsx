import { useState, useMemo } from 'react';
import { useAddCard } from '../hooks/useQueries';
import { PaymentMethod, Position, Card } from '../backend';
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
import AutocompleteTextInput from './AutocompleteTextInput';
import {
  getCountrySuggestions,
  getLeagueSuggestions,
  getClubSuggestions,
  getSeasonSuggestions,
  filterSuggestions,
} from '../utils/cardSuggestions';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCards?: Card[];
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

export default function AddCardDialog({ open, onOpenChange, existingCards = [] }: AddCardDialogProps) {
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [country, setCountry] = useState('');
  const [league, setLeague] = useState('');
  const [club, setClub] = useState('');
  const [position, setPosition] = useState<Position | ''>('');
  const [season, setSeason] = useState('');

  const { mutateAsync: addCard, isPending } = useAddCard();

  // Generate suggestions from existing cards
  const suggestions = useMemo(() => {
    return {
      countries: getCountrySuggestions(existingCards),
      leagues: getLeagueSuggestions(existingCards),
      clubs: getClubSuggestions(existingCards),
      seasons: getSeasonSuggestions(existingCards),
    };
  }, [existingCards]);

  // Filtered suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    return {
      countries: filterSuggestions(suggestions.countries, country),
      leagues: filterSuggestions(suggestions.leagues, league),
      clubs: filterSuggestions(suggestions.clubs, club),
      seasons: filterSuggestions(suggestions.seasons, season),
    };
  }, [suggestions, country, league, club, season]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rarity.trim() || !paymentMethod || !position) return;

    const discount = discountPercent.trim() === '' ? 0 : parseFloat(discountPercent);
    const purchaseDateValue = purchaseDate.trim() === '' ? null : BigInt(new Date(purchaseDate).getTime() * 1000000);

    try {
      await addCard({
        name: name.trim(),
        rarity: rarity.trim(),
        purchasePrice: parseFloat(purchasePrice),
        discountPercent: discount,
        paymentMethod: paymentMethod as PaymentMethod,
        purchaseDate: purchaseDateValue,
        notes: notes.trim(),
        country: country.trim(),
        league: league.trim(),
        club: club.trim(),
        position: position as Position,
        age: 0,
        version: '',
        season: season.trim(),
      });

      // Reset form and close dialog only after successful mutation
      setName('');
      setRarity('');
      setPurchasePrice('');
      setDiscountPercent('');
      setPaymentMethod('');
      setPurchaseDate('');
      setNotes('');
      setCountry('');
      setLeague('');
      setClub('');
      setPosition('');
      setSeason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add card:', error);
      // Error is already handled by the mutation's onError
    }
  };

  // Check if all mandatory fields are filled
  const isFormValid = 
    name.trim().length > 0 && 
    rarity.trim().length > 0 && 
    purchasePrice.trim().length > 0 && 
    !isNaN(parseFloat(purchasePrice)) && 
    parseFloat(purchasePrice) >= 0 &&
    paymentMethod !== '' &&
    country.trim().length > 0 &&
    league.trim().length > 0 &&
    club.trim().length > 0 &&
    position !== '' &&
    season.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Karte hinzufügen</DialogTitle>
          <DialogDescription>Füge eine neue Sammelkarte zu deinem Portfolio hinzu.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Kartenname *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Messi Gold Edition"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rarity" className="text-sm">Seltenheit *</Label>
            <Input
              id="rarity"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="z.B. Limited, Rare, Super Rare, Spezial"
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrice" className="text-sm">Kaufpreis (€) *</Label>
              <Input
                id="purchasePrice"
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
              <Label htmlFor="discountPercent" className="text-sm">Rabatt (%)</Label>
              <Input
                id="discountPercent"
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
            <Label htmlFor="paymentMethod" className="text-sm">Bezahlart *</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger id="paymentMethod" className="h-9">
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
            <Label htmlFor="purchaseDate" className="text-sm">Kaufdatum</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Notizen zur Karte..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <AutocompleteTextInput
            id="country"
            label="Land"
            value={country}
            onChange={setCountry}
            suggestions={filteredSuggestions.countries}
            placeholder="z.B. Deutschland"
            required
          />

          <AutocompleteTextInput
            id="league"
            label="Liga"
            value={league}
            onChange={setLeague}
            suggestions={filteredSuggestions.leagues}
            placeholder="z.B. Bundesliga"
            required
          />

          <AutocompleteTextInput
            id="club"
            label="Club"
            value={club}
            onChange={setClub}
            suggestions={filteredSuggestions.clubs}
            placeholder="z.B. Bayern München"
            required
          />

          <div className="space-y-1.5">
            <Label htmlFor="position" className="text-sm">Position *</Label>
            <Select value={position} onValueChange={(value) => setPosition(value as Position)}>
              <SelectTrigger id="position" className="h-9">
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

          <AutocompleteTextInput
            id="season"
            label="Saison"
            value={season}
            onChange={setSeason}
            suggestions={filteredSuggestions.seasons}
            placeholder="z.B. 2024/25"
            required
          />

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-9">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending || !isFormValid} className="h-9">
              {isPending ? 'Speichert...' : 'Karte hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
