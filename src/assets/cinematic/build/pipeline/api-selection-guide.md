# API Selection Guide
> Use this to choose appropriate free professional APIs before starting any build. Select APIs in Step 1, wire them in natively during the build — never bolt on after.

---

## Selection Principle

Choose the single best API for the client's primary function. Only add a second if it contributes something genuinely distinct. APIs should feel native — not visible to the visitor, just present in the experience.

---

## By Client Vertical

### Hospitality (Hotels, B&Bs, Vacation Rentals)
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Availability calendar | **Calendly** or **Cal.com** | Free | Embed booking widget natively |
| Reviews | **Google Places API** | $200/mo credit | Pull live star rating + review count |
| Map/location | **Google Maps Embed API** | Free | No key needed for basic embed |
| Weather at destination | **Open-Meteo** | Unlimited free | No key required |

### Fitness (Gyms, Personal Trainers, Yoga Studios)
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Class/session booking | **Cal.com** | Free | Open source, self-hostable |
| Location + hours | **Google Places API** | $200/mo credit | Real-time hours and reviews |
| Weather (outdoor classes) | **Open-Meteo** | Unlimited free | Good for outdoor training sites |

### Food & Beverage (Restaurants, Cafés, Food Trucks)
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Table booking | **OpenTable Widget** | Free to embed | Most restaurants already listed |
| Menu/hours/reviews | **Google Places API** | $200/mo credit | Real-time data |
| Location | **Google Maps Embed API** | Free | |
| Currency (multi-location) | **ExchangeRate-API** | 1,500 req/mo free | |

### Events (Venues, Promoters, Ticketing)
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Event listings | **Eventbrite API** | Free read access | Pull live events by organizer |
| Ticketing | **Stripe** | Pay-per-transaction | No monthly fee |
| Calendar embed | **Google Calendar Embed** | Free | Show event schedule |
| Weather at event date | **Open-Meteo** | Unlimited free | |

### Professional Services (Lawyers, Consultants, Accountants)
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Consultation booking | **Cal.com** | Free | Most professional option |
| Contact form | **Resend** | 3,000 emails/mo free | Clean transactional email |
| Reviews/credibility | **Google Places API** | $200/mo credit | |

### Creative & Portfolio (Photographers, Artists, Designers)
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Gallery / media | **Cloudinary** | 25GB free | Transform, optimize, serve images |
| Contact/inquiry | **Resend** | 3,000 emails/mo free | |
| Social feed | **Instagram Basic Display API** | Free | Pull latest posts |

### Real Estate
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Map/location pins | **Google Maps API** | $200/mo credit | Multiple property pins |
| Viewing bookings | **Cal.com** | Free | |
| Mortgage calculator | **Abstract Money API** | Free tier | Client-side calculations |

### E-commerce / Retail
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Payments | **Stripe** | Pay-per-transaction | |
| Inventory/products | **Supabase** | Free tier | Already in stack |
| Shipping estimates | **EasyPost** | 100 API calls/mo free | |
| Currency conversion | **ExchangeRate-API** | 1,500 req/mo free | |

### SaaS / Tech Products
| Need | API | Free Tier | Notes |
|------|-----|-----------|-------|
| Auth | **Supabase Auth** | Free tier | Already in stack |
| Payments | **Stripe** | Pay-per-transaction | |
| Email sequences | **Resend** | 3,000 emails/mo free | |
| Status page | **Instatus** | Free tier | |

---

## Universal APIs (Always Available, Always Free)

These are safe to include in any build without checking budget or vertical:

| API | Use | Notes |
|-----|-----|-------|
| **Open-Meteo** | Current weather + forecast | No key, unlimited, great for location-aware sites |
| **Google Maps Embed API** | Map embed showing location | No API key for basic embed |
| **ExchangeRate-API** | Currency conversion | 1,500 free requests/month |
| **REST Countries** | Country info (flag, currency, language) | No key, completely free |
| **IP-API** | Visitor location detection | 45 req/min free, no key |

---

## APIs to Avoid (Unless Client Specifically Requests)

| API | Reason to Avoid |
|-----|----------------|
| Twitter/X API | Paid, unreliable, rate-limited aggressively |
| Facebook Graph API | Complex auth, frequent breaking changes |
| Yelp Fusion API | Review access heavily restricted on free tier |
| OpenAI API | Cost unpredictable; add only with explicit budget approval |
| Twilio | Cost per message; add only with explicit budget approval |

---

## Integration Rule

Wire APIs in during Pass 1 generation — include the API endpoint call in the build prompt so the model codes them natively. Do not add APIs as an afterthought in Pass 2. Pass 2 is for motion and polish, not new functionality.

---

*Version 1.0 | Part of the cinematic website build pipeline*
