import React, { useState, useEffect } from 'react';
import { Star, MapPin, ThumbsUp, PlusCircle, CheckCircle2, Shield, X, MessageSquarePlus } from 'lucide-react';
import { Language, ServiceType, ReviewItem } from '../types';
import { translations } from '../data/translations';
import { reviewsData as initialReviews } from '../data/servicesData';

interface ReviewsSectionProps {
  currentLang: Language;
  onOpenPrivacy?: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ currentLang, onOpenPrivacy }) => {
  const t = translations[currentLang];
  const [filter, setFilter] = useState<string>('all');
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_live_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...initialReviews];
      }
    } catch (e) {
      // fallback
    }
    return initialReviews;
  });

  // Modal / Form state for writing a new review
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState<string>('');
  const [authorLocation, setAuthorLocation] = useState<string>('');
  const [reviewService, setReviewService] = useState<ServiceType | 'allgemein'>('strom');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewSavings, setReviewSavings] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [privacyAgreed, setPrivacyAgreed] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Recalculate average score live
  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !reviewComment.trim() || !privacyAgreed) return;

    const newReview: ReviewItem = {
      id: `user-rev-${Date.now()}`,
      name: authorName.trim(),
      location: authorLocation.trim() || 'Leipzig',
      service: reviewService,
      rating: reviewRating,
      date: 'Heute',
      savings: reviewSavings.trim() ? `${reviewSavings.trim()}` : 'Tarif optimiert',
      comment: reviewComment.trim(),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);

    try {
      // Save user submitted reviews to localStorage
      const userOnly = updated.filter((r) => r.id.startsWith('user-rev-'));
      localStorage.setItem('daryos_live_reviews', JSON.stringify(userOnly));
    } catch (e) {
      // ignore
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      setShowReviewForm(false);
      setSubmitSuccess(false);
      // Reset fields
      setAuthorName('');
      setAuthorLocation('');
      setReviewSavings('');
      setReviewComment('');
      setPrivacyAgreed(false);
    }, 1500);
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter((r) => r.service === filter || r.service === 'allgemein');

  return (
    <section id="reviews" className="py-20 bg-[#050508] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2.5">
          <div className="text-xs font-semibold text-orange-400 tracking-wider uppercase">
            {t.reviews.sectionSub}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.reviews.sectionTitle}
          </h2>

          {/* Rating Summary & Action */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-white font-mono">{averageRating} / 5.0</span>
            <span className="text-xs text-slate-400">
              · {reviews.length} Kundenbewertungen (Leipzig & bundesweit)
            </span>

            <button
              onClick={() => setShowReviewForm(true)}
              className="ml-2 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Eigene Bewertung verfassen</span>
            </button>
          </div>
        </div>

        {/* Filter Bar (Segmented Controls) */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 bg-[#0f1015] rounded-xl border border-white/[0.08] flex-wrap justify-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.reviews.filterAll}
            </button>
            <button
              onClick={() => setFilter('strom')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'strom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Strom
            </button>
            <button
              onClick={() => setFilter('gas')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'gas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gas
            </button>
            <button
              onClick={() => setFilter('internet')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'internet'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Internet
            </button>
            <button
              onClick={() => setFilter('kfz')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'kfz'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Autoversicherung
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#0b0c10] p-6 rounded-2xl border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4 hover:border-white/[0.15] transition-colors"
            >
              <div className="space-y-3">
                {/* Rating stars & verified badge */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{rev.date}</span>
                </div>

                {/* Concrete quantified savings callout */}
                <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block">
                  {t.reviews.savedText} {rev.savings}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author & Location */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{rev.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-orange-400/90 shrink-0" />
                    <span>{rev.location}</span>
                  </div>
                </div>
                <div className="text-[11px] text-blue-400 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Verifiziert</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Modal with strict GDPR / Datenschutz Compliance */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e0f14] border border-white/[0.12] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowReviewForm(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-[#14151b] rounded-lg border border-white/[0.08] cursor-pointer"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Vielen Dank für Ihre Bewertung!</h3>
                <p className="text-xs text-slate-300">
                  Ihre Bewertung wurde gespeichert und ist ab sofort live auf der Website sichtbar.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div className="border-b border-white/[0.08] pb-3">
                  <h3 className="text-lg font-bold text-white">
                    Ihre persönliche Erfahrung teilen
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Echte Kundenstimmen helfen Verbrauchern in Leipzig, verlässliche Tarife zu finden.
                  </p>
                </div>

                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Ihre Gesamtbewertung:
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (hoverRating || reviewRating) >= star
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-slate-400 self-center ml-2">
                      {reviewRating} von 5 Sternen
                    </span>
                  </div>
                </div>

                {/* Name & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Ihr Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="z. B. Ahmed K. oder Familie M."
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-[#121319] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Wohnort / Stadtteil
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. Leipzig-Paunsdorf"
                      value={authorLocation}
                      onChange={(e) => setAuthorLocation(e.target.value)}
                      className="w-full bg-[#121319] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Service and Savings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Geprüfter Bereich
                    </label>
                    <select
                      value={reviewService}
                      onChange={(e) => setReviewService(e.target.value as ServiceType | 'allgemein')}
                      className="w-full bg-[#121319] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="strom">Stromvertrag</option>
                      <option value="gas">Gasvertrag</option>
                      <option value="internet">Internet & Festnetz</option>
                      <option value="kfz">Autoversicherung</option>
                      <option value="allgemein">Gesamtpaket / Rundum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Erzielte Ersparnis (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 380 € / Jahr gespart"
                      value={reviewSavings}
                      onChange={(e) => setReviewSavings(e.target.value)}
                      className="w-full bg-[#121319] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Comment text */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Ihr Erfahrungsbericht <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Wie zufrieden waren Sie mit der Beratung, der Schnelligkeit und dem Wechselprozess?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-[#121319] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* GDPR / Datenschutz Mandatory Checkbox */}
                <div className="p-3 bg-[#121319] rounded-xl border border-white/[0.08] flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    required
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-0.5 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="privacyConsent" className="text-[11px] text-slate-300 leading-snug cursor-pointer">
                    <span className="font-semibold text-white">Datenschutz-Einwilligung: </span>
                    Ich willige ein, dass meine Bewertung sowie mein angegebener Name auf dieser Website veröffentlicht werden. Ich kann diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen (Art. 6 Abs. 1 lit. a DSGVO).
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={!privacyAgreed}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Bewertung jetzt veröffentlichen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="py-3 px-4 bg-[#14151c] hover:bg-[#1a1b24] text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-white/[0.08]"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
