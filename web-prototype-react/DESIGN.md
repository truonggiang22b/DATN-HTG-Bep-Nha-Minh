---
name: Bếp Nhà Mình
description: Hệ thống đặt món nhà hàng — Ấm áp, Nhanh nhẹn, Đáng tin
colors:
  chili: "#D83A2E"
  chili-deep: "#B52E23"
  turmeric: "#F4A51C"
  leaf: "#2F7D4E"
  charcoal: "#25211B"
  soy: "#5A3928"
  rice: "#FFF8EA"
  paper: "#F7E8C9"
  steam: "#E8DDCC"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "clamp(2.25rem, 8vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
  price:
    fontFamily: "'Sora', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  xs: "6px"
  sm: "10px"
  md: "18px"
  lg: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.chili}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.chili-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.chili}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.soy}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  badge-bestseller:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  badge-popular:
    backgroundColor: "#F4EEEC"
    textColor: "{colors.chili}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  badge-healthy:
    backgroundColor: "#EDF4EF"
    textColor: "{colors.leaf}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

# Design System: Bếp Nhà Mình

## 1. Overview

**Creative North Star: "The Warm Counter"**

Bếp Nhà Mình is designed like the counter of a beloved neighborhood eatery — the kind where the owner remembers your order, the steam from the kitchen is visible, and everything is exactly where you expect it to be. The visual system communicates warmth through earthen tones (rice cream, paper, soy brown), moves with the quick confidence of a busy kitchen, and earns trust through clear hierarchy and predictable behavior. Nothing tricks the user; nothing wastes their time.

The landing page is the most important surface in the product. It must make the user hungry — literally — within the first scroll. Food photography context, warm amber accent, generous whitespace, and a single unmistakable CTA anchor the hero. Every screen that follows maintains the same earthy warmth: a consistent temperature, never a jarring transition to sterile white or corporate blue.

This is a **brand-register** system for the customer-facing surface. Density is low; breathing room is generous. Typography is warm and legible, not editorial. Motion is responsive and fast — feedback is immediate, choreography is rare and purposeful.

**Key Characteristics:**
- Earthen, warm palette anchored in cream and deep brown, with chili-red as the singular action color
- Mobile-first: all layouts designed at 375px, enhanced above 768px
- Two typefaces only: Be Vietnam Pro (warmth, readability) + Sora (numbers, prices — precision)
- Border radius ranges from subtly rounded (10px) to fully pillowed (999px) — cards are gentle, buttons are inviting
- Motion is fast and exits outward (ease-out); no bounce, no elastic
- Light mode only for customer-facing; darkness reserved for the kitchen display system

## 2. Colors: The Bếp Palette

A restrained-to-committed warm palette. Chili is the only saturated action color; everything else is tonal earth.

### Primary
- **Chili Red** (`#D83A2E`): The singular action color. Used on primary CTA buttons, active state indicators, primary badges, focus rings, and timeline active dots. Its rarity on non-button surfaces is what makes it feel urgent when it appears. Never decorative.
- **Chili Deep** (`#B52E23`): Hover and pressed state for chili-red elements only. Not used as a surface color.

### Secondary
- **Turmeric** (`#F4A51C`): Bestseller badges, new-order notifications, pulse animation glow. Used sparingly — 3 instances max per screen. Warmer and more cheerful than chili; used to signal "popular" not "urgent."

### Tertiary
- **Leaf Green** (`#2F7D4E`): Success states only — order confirmed, healthy badge, done step in timeline. Never decorative. One green per screen, one job.

### Neutral
- **Charcoal** (`#25211B`): Primary text, headings, prices. A warm near-black, never pure `#000`.
- **Soy Brown** (`#5A3928`): Secondary text, captions, metadata, placeholder labels. Warm mid-brown that recedes without going gray.
- **Rice Cream** (`#FFF8EA`): Primary page background. The warmest neutral — every screen rests on this base.
- **Paper** (`#F7E8C9`): Secondary surface — sticky headers, cart summary, section dividers, tab bars. Slightly darker than rice.
- **Steam** (`#E8DDCC`): Borders, dividers, skeleton shimmer, disabled states. Cool-warm beige — the quietest surface.
- **White** (`#FFFFFF`): Card backgrounds and modal surfaces. The only pure white; used only when content (food photos, item details) needs a clean stage.

### Named Rules
**The One Fire Rule.** Chili red is the only action color. Do not introduce a second saturated hue for interactive elements on the customer-facing surface. If you need to signal something new, use turmeric for notification or leaf for success — but never as button colors.

**The Warm Neutral Rule.** Every neutral must lean warm. If `color-scheme: dark` is ever applied to customer-facing pages, tint all neutrals toward `#25211B`, never toward blue-gray. Rice cream and paper are not interchangeable with `#f5f5f5`.

## 3. Typography

**Display Font:** Be Vietnam Pro (700, 600) — warmth with structure  
**Body Font:** Be Vietnam Pro (400, 500) — the same face, lower weight  
**Price / Number Font:** Sora (700) — precision, distinct from prose

**Character:** Be Vietnam Pro carries the warmth — rounded beziers, generous x-height, legible at all sizes. Sora handles all numeric display (prices, quantities, order codes) with a technical crispness that builds trust in transactional moments. Two families, zero overlap in role.

### Hierarchy
- **Display** (700, clamp(2.25rem → 3.5rem), lh 1.1, ls −0.02em): Hero headings on the landing page only. The line that must make the user hungry.
- **Headline** (600, 1.5rem / 24px, lh 1.2, ls −0.01em): Section titles within a page — "Món hôm nay", "Giỏ hàng", "Trạng thái đơn". Maximum one per scroll viewport.
- **Title** (600, 1.125rem / 18px, lh 1.3): Card headings, modal titles, sticky header product name. The workhorse heading.
- **Body** (400, 1rem / 16px, lh 1.6): All running prose, descriptions, notes. Cap line length at 65ch on desktop. Minimum 16px on mobile — non-negotiable.
- **Label** (700, 0.6875rem / 11px, lh 1, ls 0.08em, UPPERCASE): Section header stamps, badge text, meta labels. Used only in uppercase with tracked spacing.
- **Price** (Sora 700, 1.25rem / 20px, lh 1): All monetary values, order totals, quantity counts. Never Be Vietnam Pro for prices.

### Named Rules
**The Two-Font Rule.** The system uses exactly two typefaces: Be Vietnam Pro and Sora. Adding a third (even "just for the logo") pollutes the warmth signal. If a decorative headline is needed, use Be Vietnam Pro at a higher weight with tighter tracking — not a new face.

**The Price Registry Rule.** Every number representing money or quantity uses Sora. This makes transactional content instantly scannable and signals precision without saying so.

## 4. Elevation

The system uses **ambient shadow elevation** — shadows are warm-tinted (charcoal-based, never blue-gray) and structural. Surfaces are flat at rest; shadows appear only when content needs to float above the rice-cream background or respond to interaction. No glassmorphism decoratively; the cart footer uses `backdrop-filter: blur(12px)` as a functional blur to maintain readability over scrolling content, not as decoration.

### Shadow Vocabulary
- **Shadow Card** (`0 14px 40px rgba(37, 33, 27, 0.12)`): Modal sheets, food detail overlays, floating panels. The most prominent shadow — used when content fully separates from the background.
- **Shadow Soft** (`0 8px 24px rgba(90, 57, 40, 0.10)`): Menu item cards, featured cards. A warm mid-shadow that lifts cards without drama.
- **Shadow SM** (`0 2px 8px rgba(37, 33, 27, 0.08)`): Sticky headers, back buttons, small interactive elements. Barely-there — acknowledges depth without asserting it.

### Named Rules
**The Warm Shadow Rule.** No shadow uses a blue or neutral base. All `rgba()` values use `37, 33, 27` (charcoal) or `90, 57, 40` (soy) as the shadow color. A blue-tinted shadow breaks the warm-counter atmosphere immediately.

**The Flat-at-Rest Rule.** Cards and surfaces have no shadow by default. Shadows appear on `hover` (cards that are clickable) and as `box-shadow` on elements that persistently float (sticky header, fixed cart bar). This keeps the page from feeling cluttered.

## 5. Components

### Buttons
The button vocabulary is small and decisive — three variants, all pill-shaped, all minimum 48px touch height.

- **Shape:** Fully rounded pill (999px radius). Non-negotiable — a sharp-cornered button would break the warmth signal.
- **Primary:** Chili red background (`#D83A2E`), white text, Be Vietnam Pro 700 / 15px. Padding 14px 28px. Used for the single most important action per screen (Add to cart, Confirm order, Đặt ngay).
- **Hover:** Darken to `#B52E23`. `transform: scale(0.97)` on active (pressed). Transition: 120ms ease-out.
- **Disabled:** Steam background (`#E8DDCC`), soy text. No hover or transform. `cursor: not-allowed`.
- **Outline:** Transparent background, chili border (1.5px), chili text. Hover: chili tint fill at 6% opacity. Used for secondary choices (Go back, View full menu).
- **Ghost:** Transparent, soy text. Hover: paper background fill. Used for tertiary or destructive-cancel actions.

### Chips / Filter Pills
- **Style:** Pill shape (999px radius), paper background, soy text at rest.
- **Selected:** Chili background, white text. Transition 120ms.
- **Use:** Category filters on the menu page. Maximum 6 chips visible before horizontal scroll.

### Cards / Containers
Menu item cards are the signature component — they do the most work.

- **Corner Style:** Gently rounded (18px radius). Never sharp.
- **Background:** White — the only place white appears against rice-cream background.
- **Shadow:** Shadow Soft at rest. Slightly elevated on hover (`shadow-card`).
- **Border:** None. Shadow alone provides card definition.
- **Internal Padding:** 16px. Images bleed edge-to-edge at the top, content padded below.
- **Nested Cards Rule:** Never. Card inside card is always wrong. If content within a card needs grouping, use a background-tint section (paper or steam), never another card.

### Inputs / Fields
- **Style:** 1.5px steam border (`#E8DDCC`), white background, 10px radius. Understated at rest.
- **Focus:** Border shifts to chili red (`#D83A2E`). No glow, no shadow — border-color change alone.
- **Placeholder:** Steam color (`#E8DDCC`) — very quiet, intentional.
- **Error:** Not yet fully specified; when implemented, use chili-red border + chili-tint background (6% opacity).
- **Disabled:** Steam background, soy text, `cursor: not-allowed`.

### Navigation / Tab Bar
- **Mobile:** Fixed bottom tab bar (52px height), paper background with 1px steam top border. Active tab: chili icon + chili label text. Inactive: soy icon + soy text.
- **Sticky Header:** Paper background, shadow-sm. Contains back button (rice circle, 36px diameter), page title in Title weight.
- **No hamburger menus** on customer-facing mobile — all primary navigation is flat in the bottom tab.

### Qty Stepper (Signature Component)
The quantity stepper for adding items to cart — appears on every menu item.

- Paper background (`#F7E8C9`), pill shape (999px radius), 2px 8px padding.
- Minus/Plus buttons: 28px circle, transparent background, chili icon. Hover: steam fill.
- Count display: Sora 700 / 15px — price-registry rule applies.
- The stepper's pill shape is a deliberate warmth signal: it feels hand-friendly, not form-like.

### Badges (Signature Component)
Small status labels that appear on menu items and order cards.

- All badges: pill shape (999px), Be Vietnam Pro label weight (700 / 11px, uppercase), 3px 10px padding.
- **Bestseller:** Turmeric background, charcoal text.
- **Popular:** Chili tint 12% background, chili text.
- **Healthy:** Leaf tint 12% background, leaf text.
- **Sold Out:** Steam background, soy text.
- Never stack more than 2 badges on a single item.

## 6. Do's and Don'ts

### Do:
- **Do** use Chili red (`#D83A2E`) exclusively for the primary action per screen. One CTA, one fire.
- **Do** use Sora for all prices, order totals, and quantities. Be Vietnam Pro for everything else.
- **Do** apply pill-shape (999px) to all buttons, chips, qty steppers, and tracking code pills — roundness is the warmth signal.
- **Do** use warm-tinted shadows (`rgba(37, 33, 27, ...)`) for all elevation. Never blue-gray drop shadows.
- **Do** keep cards on a white background (`#FFFFFF`) against the rice-cream page (`#FFF8EA`). The contrast is subtle and intentional.
- **Do** keep the landing page hero focused on a single task: get the user to tap "Đặt ngay" or "Xem menu" within the first viewport.
- **Do** support `prefers-reduced-motion` — disable all keyframe animations and reduce transition durations to 50ms when set.
- **Do** ensure all touch targets are minimum 44×44px — particularly qty stepper buttons (28px visual, 44px touch area via padding).
- **Do** maintain WCAG 2.1 AA contrast — charcoal on rice-cream passes; soy on rice-cream must be checked per usage.

### Don't:
- **Don't** use purple gradients, neon accents, gradient text (`background-clip: text`), or glassmorphism decoratively. These are AI-slop patterns identified in PRODUCT.md and are banned absolutely.
- **Don't** use the fast-food chain aesthetic — no red-and-yellow palette, no promo-banner-first layout, no industrial tone.
- **Don't** use SaaS dashboard aesthetics on the customer surface — no dark mode, no data-dense tables, no sidebar navigation.
- **Don't** introduce a third typeface. The two-font rule is a hard constraint.
- **Don't** nest cards inside cards. Ever. If content inside a card needs grouping, use a tinted background section.
- **Don't** use modal as the first thought for any interaction. Exhaust inline and bottom-sheet alternatives first.
- **Don't** use gray shadows (`rgba(0, 0, 0, ...)`). All shadows use warm-charcoal or warm-soy base colors.
- **Don't** use the hero-metric template (big number, small label, supporting stats, gradient accent) — this is a SaaS cliché explicitly rejected for this brand.
- **Don't** use identical card grids with icon + heading + text repeated indefinitely — vary card sizes, use full-bleed images, break the grid intentionally on the menu page.
- **Don't** use `#000000` or `#FFFFFF` as a base text color — all text is charcoal (`#25211B`) or soy (`#5A3928`) on warm surfaces.
