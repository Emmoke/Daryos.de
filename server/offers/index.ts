import { DemoOfferProvider } from './demoProvider';
import { UnconfiguredOfferProvider, type OfferProvider } from './OfferProvider';

export * from './OfferProvider';
export { DemoOfferProvider } from './demoProvider';

/**
 * Wählt die Angebotsquelle per OFFER_PROVIDER.
 * - "demo" (Standard): gekennzeichnete Testdaten
 * - jeder andere Wert: noch nicht implementierte echte Quelle → liefert kontrolliert "nicht eingerichtet"
 *   statt erfundener Daten. Hier wird die echte Anbindung ergänzt, sobald API-Dokumentation und Zugang vorliegen.
 */
export function offerProviderFromEnv(env: NodeJS.ProcessEnv): OfferProvider {
  const id = (env.OFFER_PROVIDER || 'demo').trim();
  if (id === 'demo') return new DemoOfferProvider();
  return new UnconfiguredOfferProvider(id, env.OFFER_PROVIDER_NAME || id);
}
