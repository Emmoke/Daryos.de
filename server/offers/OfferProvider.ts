// Austauschbare Schnittstelle zur zentralen Angebotsquelle.
// Jede echte Anbindung (Vergleichsplattform-API, Vermittlerportal mit API-Zugang, eigene Tarifdatenbank)
// implementiert dieses Interface und wandelt die Antwort in das einheitliche Offer-Format um.
import type { ComparisonInput, Offer } from '../../shared/platform';

export interface OfferProviderInfo {
  id: string;
  name: string;
  /** true = ausschließlich Testdaten. Diese dürfen niemals als real verfügbare Tarife angezeigt werden. */
  isDemo: boolean;
  /** false = Zugangsdaten fehlen; der Provider liefert dann keine Angebote. */
  configured: boolean;
}

export interface OfferFetchResult {
  offers: Offer[];
  fetchedAt: string;
}

export class OfferProviderError extends Error {
  constructor(
    message: string,
    readonly kind: 'timeout' | 'unavailable' | 'invalid_response' | 'not_configured',
  ) {
    super(message);
    this.name = 'OfferProviderError';
  }
}

export interface OfferProvider {
  readonly info: OfferProviderInfo;
  fetchOffers(input: ComparisonInput, signal: AbortSignal): Promise<OfferFetchResult>;
}

/** Ruft einen Provider mit Zeitlimit auf und vereinheitlicht Fehler. */
export async function fetchWithTimeout(provider: OfferProvider, input: ComparisonInput, timeoutMs: number): Promise<OfferFetchResult> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new OfferProviderError(`Die Angebotsquelle hat nicht innerhalb von ${timeoutMs / 1000} s geantwortet.`, 'timeout'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([provider.fetchOffers(input, controller.signal), timeout]);
  } catch (err) {
    if (err instanceof OfferProviderError) throw err;
    throw new OfferProviderError('Die Angebotsquelle ist derzeit nicht erreichbar.', 'unavailable');
  } finally {
    clearTimeout(timer);
  }
}

/** Platzhalter für eine echte Quelle, solange keine Zugangsdaten hinterlegt sind. Erfindet keine Daten. */
export class UnconfiguredOfferProvider implements OfferProvider {
  readonly info: OfferProviderInfo;
  constructor(id: string, name: string) {
    this.info = { id, name, isDemo: false, configured: false };
  }
  async fetchOffers(): Promise<OfferFetchResult> {
    throw new OfferProviderError(
      `Die Angebotsquelle „${this.info.name}“ ist noch nicht eingerichtet (Zugangsdaten bzw. API-Vertrag fehlen).`,
      'not_configured',
    );
  }
}
