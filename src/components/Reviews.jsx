import { Send, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchPublicReviews, reviewSummary, submitReview } from '../services/reviewService.js'

const initialForm = {
  customer_name: '',
  rating: 5,
  menu_item_name: '',
  visited_date: '',
  comment: '',
}

function Stars({ value }) {
  return (
    <span className="inline-flex gap-1 text-cafe-amber" aria-label={`${value} star rating`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={17} className={star <= Number(value) ? 'fill-cafe-amber' : ''} aria-hidden="true" />
      ))}
    </span>
  )
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const summary = useMemo(() => reviewSummary(reviews), [reviews])

  useEffect(() => {
    let active = true
    fetchPublicReviews().then((items) => {
      if (active) setReviews(items)
    })
    return () => {
      active = false
    }
  }, [])

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!form.customer_name.trim() || !form.comment.trim() || Number(form.rating) < 1) {
      setStatus({ type: 'error', message: 'Please add your name, rating, and review comment.' })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitReview(form)
      setStatus({
        type: 'success',
        message: result.mode === 'demo' ? 'Demo review captured. Connect Supabase to moderate real reviews.' : 'Review submitted. It will appear after admin approval.',
      })
      setForm(initialForm)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Review could not be submitted.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="reviews" className="bg-cafe-oat/70">
      <div className="section-shell grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="section-title">Let real customers build trust before new guests visit.</h2>
          <p className="section-copy">
            Reviews are submitted by customers, held for approval, and only approved reviews are shown publicly.
          </p>
          <div className="mt-8 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-4xl">{summary.average ? summary.average.toFixed(1) : '4.8'}</p>
                <Stars value={Math.round(summary.average || 5)} />
              </div>
              <p className="text-sm text-stone-600">{summary.count || reviews.length} approved customer reviews</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {reviews.slice(0, 3).map((review) => (
              <article key={review.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold">{review.customer_name}</p>
                  <Stars value={review.rating} />
                </div>
                <p className="mt-3 leading-7 text-stone-600">{review.comment}</p>
                {review.menu_item_name ? <p className="mt-2 text-sm font-semibold text-cafe-sage">{review.menu_item_name}</p> : null}
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
          <h3 className="font-display text-2xl">Submit a review</h3>
          <div className="mt-5 grid gap-4">
            <input name="customer_name" value={form.customer_name} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Your name" />
            <label className="grid gap-2 text-sm font-bold">
              Rating
              <select name="rating" value={form.rating} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{rating} stars</option>
                ))}
              </select>
            </label>
            <input name="menu_item_name" value={form.menu_item_name} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Menu item optional" />
            <input name="visited_date" type="date" value={form.visited_date} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" />
            <textarea name="comment" value={form.comment} onChange={change} className="focus-ring min-h-32 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Tell us about your meal or visit." />
          </div>
          <button type="submit" disabled={isSubmitting} className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cafe-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-cafe-forest disabled:opacity-60">
            <Send size={18} aria-hidden="true" />
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <div aria-live="polite" className={`mt-4 rounded-lg px-4 py-3 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-800' : status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-cafe-cream text-stone-600'}`}>
            {status.message || 'Reviews are moderated before they appear on the website.'}
          </div>
        </form>
      </div>
    </section>
  )
}

export default Reviews
