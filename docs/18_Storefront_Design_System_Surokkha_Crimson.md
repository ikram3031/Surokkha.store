# 18 — Storefront Design System: Surokkha Crimson

Date: 08 Nov 2026 · Scope: Surokkha storefront (SurokkhaShop / SurokkhaStore) · Theme: dark only

The visual system for the Surokkha storefront: colors, fonts, spacing and the core components. Every UI change on the storefront must use these tokens. Do not hardcode hex values in components; reference the CSS variables below.

Live reference with component previews: the "Surokkha Crimson" design system artifact on claude.ai.

## Quick start

1. Load the fonts once, in the document head:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Manrope:wght@400;500;600&family=Jost:wght@400;500&family=Hind+Siliguri:wght@500&display=swap">
```

2. Paste the token block into the global stylesheet:

```css
:root {
  --page: #110d0f;
  --surface: #1c1416;
  --surface-raised: #261b1e;
  --wine: #2a0e16;
  --border: #3a2a2e;
  --text: #fbf5ec;
  --text-secondary: #d9cfd2;
  --text-muted: #bdb2b5;
  --primary: #e11d48;
  --primary-hover: #be123c;
  --on-primary: #ffffff;
  --accent: #fb5072;
  --outline: #fb7185;
  --outline-text: #ffb3c1;
  --outline-hover: rgba(251, 113, 133, 0.14);
  --gold: #e6c27a;
  --gold-text: #f3d9a4;
  --gold-hover: rgba(230, 194, 122, 0.12);
  --gold-tonal-bg: #2b2010;
  --rose-tonal-bg: #3a1520;
  --ivory: #fbf5ec;
  --cart: #4ade80;
  --cart-bg: #0e2418;
  --price: #fda4af;
  --badge: #9f1239;
  --on-badge: #ffe4e9;
  --success: #4ade80;
  --success-bg: #0e2418;
  --success-border: #1f5c3c;
  --error: #ff8a5c;
  --error-bg: #2e140c;
  --error-border: #6b2e18;
  --warning: #fbbf24;
  --warning-bg: #2a1f07;
  --warning-border: #5e4510;
  --info: #60a5fa;
  --info-bg: #0d1c30;
  --info-border: #1e3f6b;
  --whatsapp: #25d366;
  --font-display: Marcellus, Georgia, serif;
  --font-ui: Manrope, "Hind Siliguri", system-ui, sans-serif;
  --font-product: Jost, "Hind Siliguri", system-ui, sans-serif;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-24: 96px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;
}

body { background: var(--page); color: var(--text); font-family: var(--font-ui); }
.price, .price-old { font-family: var(--font-product); font-variant-numeric: lining-nums tabular-nums; }
```

3. Build components from the specs in this document.

## Content fundamentals

- **Voice.** Calm, adult and reassuring. Speak like a pharmacist who respects privacy, never like an ad for nightlife. No innuendo, no emoji.
- **Case.** Sentence case for headings and buttons: "Shop products", "How it works", "Order now". Uppercase only for the eyebrow and the category label, both letter-spaced.
- **Privacy first.** Repeat the three promises wherever someone hesitates: cash on delivery, 100% genuine products, plain discreet packaging.
- **Numbers.** Write prices as `৳1,050` with a thousands comma and no space after ৳. The old price is struck through after the new one.

## Typography

Three Google Fonts families, each with one job.

| Role | Family | Used for |
| --- | --- | --- |
| `display` | Marcellus | Hero headline, page and section titles, step card titles |
| `ui` | Manrope | Hero subtitle, body copy, all buttons, eyebrow, captions |
| `product` | Jost | Category label, product name, price, old price |

Load them in one request, with Hind Siliguri for the ৳ sign:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Manrope:wght@400;500;600&family=Jost:wght@400;500&family=Hind+Siliguri:wght@500&display=swap">
```

Rules:

- **Prices always use lining numerals.** Set `font-variant-numeric: lining-nums tabular-nums` on every price. Old-style numerals, where digits go up and down, made prices hard to read in the first mockup.
- **Keep Hind Siliguri in the stack.** Jost and Manrope have no ৳ glyph; without the fallback the sign renders in a random system font.
- **Marcellus has one weight (400).** Never set it bold; the browser will fake it. Get emphasis from size and the `accent` color.
- Hero headline: line one in `text`, line two in `accent`, same size.

## Color

One theme, dark. Crimson does the talking; everything else stays quiet.

- **Backgrounds step up in three levels:** `page` → `surface` (cards) → `surface-raised` (image wells, icon circles). Full-width alternate sections use `wine`, never a brown or grey.
- **One filled button per group.** `primary` with `on-primary` text; hover goes darker to `primary-hover`.
- **Secondary buttons are champagne gold:** `gold` border, `gold-text` label, `gold-hover` fill on hover. Crimson means buy; gold means learn or browse. Three more secondary variants (gold tonal, ivory solid, rose tonal) are listed under Button. Gold is for buttons only, never alerts.
- **Add to cart is green, then rose.** Default `cart` / `cart-bg`; after a click it turns rose (`outline`, `outline-hover`, `outline-text`) with a check icon.
- **Prices are always `price`.** The sale section, combo section and product page use the same color.
- **Discount badges use `badge` + `on-badge`.** Do not use `primary` for badges; it would compete with the Order now button.
- **Text levels:** `text` for headings, `text-secondary` for subtitles and body, `text-muted` for labels, captions and old prices. All three pass 8:1 or better on `page`, `surface` and `wine`.

### Status colors

Status colors are separate from the brand. Use them only for feedback.

| State | Text and icon | Background | Border | Example |
| --- | --- | --- | --- | --- |
| Success | `success` | `success-bg` | `success-border` | Order placed. We'll call to confirm. |
| Error | `error` | `error-bg` | `error-border` | Enter a valid phone number. |
| Warning | `warning` | `warning-bg` | `warning-border` | Only 3 left in stock. |
| Info | `info` | `info-bg` | `info-border` | Delivered in 1 day inside Dhaka. |

Error is orange-red, not crimson, so a customer never confuses a problem with the brand's own buttons. Every alert carries an icon as well as color.

## Layout and shape

- Side gutter `space-4` on phones, `space-12` on desktop; `space-24` between home page sections.
- Product cards: `surface`, `radius-lg`, padding `space-4`, gap `space-6` between cards.
- Hero buttons are pills (`radius-pill`); buttons inside cards are `radius-sm` and full width.
- No drop shadows. Separation comes from the three background levels and the `border` hairline.

## Imagery

Product photos sit on dark slate with a few green leaves. Every product photo on the site should follow this setup, including the wellness range; a photo on a white or pink background breaks the page. No people, no suggestive imagery.

## Color tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--page` | `#110d0f` | Page background. Warm near-black so the crimson reads rich, not neon. |
| `--surface` | `#1c1416` | Cards: product cards, step cards, newsletter box. One step above page. |
| `--surface-raised` | `#261b1e` | Image wells inside cards, icon circles, inputs. |
| `--wine` | `#2a0e16` | Alternate full-width section bands (Combo packs, newsletter). Only deep-red tone used as a background. |
| `--border` | `#3a2a2e` | Hairlines and card borders on page and surface. |
| `--text` | `#fbf5ec` | Headings and primary text. 17.8:1 on page. |
| `--text-secondary` | `#d9cfd2` | Subtitles, hero intro, body copy, footer links. 12.7:1 on page, 11.9:1 on surface. |
| `--text-muted` | `#bdb2b5` | Category labels, struck-through old prices, captions, footer legal line. 9.4:1 on page, 8.8:1 on surface. |
| `--primary` | `#e11d48` | Filled buttons: Shop products, Order now, Subscribe. Pair with on-primary text (4.7:1). One filled button per group. |
| `--primary-hover` | `#be123c` | Hover and pressed state of primary. Gets darker on hover; white text rises to 6.3:1. |
| `--on-primary` | `#ffffff` | Text and icons on primary and primary-hover. |
| `--accent` | `#fb5072` | The second line of display headings (without hesitation.) and the short bar above section titles. Large text only: 6.0:1 on page. |
| `--outline` | `#fb7185` | Border of the cart button after it is clicked (added state), rose-tonal secondary hover, and focus rings. 7.2:1 on page. |
| `--outline-text` | `#ffb3c1` | Text links, the added-state cart icon, and the rose-tonal secondary label. 11.5:1 on page. |
| `--outline-hover` | `rgba(251, 113, 133, 0.14)` | Fill behind the added-state cart button. |
| `--gold` | `#e6c27a` | Default secondary button border (How it works, See all offers). Champagne gold, the luxury pair to crimson. 11.4:1 on page. Buttons only; never in alerts, so it is not confused with warning. |
| `--gold-text` | `#f3d9a4` | Label of gold secondary buttons. 14.0:1 on page, 11.6:1 on gold-tonal-bg. |
| `--gold-hover` | `rgba(230, 194, 122, 0.12)` | Fill behind the gold outline secondary on hover. |
| `--gold-tonal-bg` | `#2b2010` | Fill of the gold-tonal secondary variant, for a secondary that needs more weight (filters, Load more). |
| `--rose-tonal-bg` | `#3a1520` | Fill of the rose-tonal secondary variant, a quiet secondary inside cards and drawers. Label in outline-text (9.5:1). |
| `--ivory` | `#fbf5ec` | Fill of the ivory solid variant; label in page color (17.8:1). Strongest secondary: use only where there is no primary button nearby, e.g. on a wine band. |
| `--cart` | `#4ade80` | Default Add to cart button: icon and 1.5px border. Green says 'ready to add'. |
| `--cart-bg` | `#0e2418` | Fill of the default Add to cart button. |
| `--price` | `#fda4af` | Current price on every product card and product page. 10.2:1 on page, 9.6:1 on surface. |
| `--badge` | `#9f1239` | Discount and tag badges (-18%, Best seller). Pair with on-badge. |
| `--on-badge` | `#ffe4e9` | Text on badge (6.7:1). |
| `--success` | `#4ade80` | Success text and icon: order placed, item added. 11.1:1 on page. |
| `--success-bg` | `#0e2418` | Background of success alerts and toasts. |
| `--success-border` | `#1f5c3c` | Border of success alerts. |
| `--error` | `#ff8a5c` | Error text and icon: invalid phone, payment failed. Orange-red on purpose so errors never look like the crimson brand. 8.3:1 on page. |
| `--error-bg` | `#2e140c` | Background of error alerts and invalid field fills. |
| `--error-border` | `#6b2e18` | Border of error alerts; invalid inputs use error itself as the border. |
| `--warning` | `#fbbf24` | Warning text and icon: low stock, delivery delay. 11.6:1 on page. |
| `--warning-bg` | `#2a1f07` | Background of warning alerts. |
| `--warning-border` | `#5e4510` | Border of warning alerts. |
| `--info` | `#60a5fa` | Info text and icon: delivery times, how COD works. 7.6:1 on page. |
| `--info-bg` | `#0d1c30` | Background of info alerts. |
| `--info-border` | `#1e3f6b` | Border of info alerts. |
| `--whatsapp` | `#25d366` | WhatsApp chat button only. Icon on it is page color. |

## Type styles

| Style | Family | Size / line | Weight | Usage |
| --- | --- | --- | --- | --- |
| `display-xl` | display | 60px / 64px | 400 | Hero headline. Second line in accent. Mobile: 40px / 44px. |
| `h1` | display | 40px / 46px | 400 | Page titles and product page name heading. |
| `h2` | display | 30px / 36px | 400 | Section titles on the home page. |
| `h3` | display | 20px / 26px | 400 | Step and feature card titles. |
| `body-lg` | ui | 17px / 28px | 400 | Hero subtitle and section intros, in text-secondary. |
| `body` | ui | 15px / 24px | 400 | Default body copy, card descriptions. |
| `button` | ui | 15px / 20px | 600 | All button labels. Sentence case. |
| `button-sm` | ui | 13px / 18px | 600 | Buttons inside product cards. |
| `eyebrow` | ui | 12px / 16px | 600, 0.12em tracking | Small uppercase kicker above the hero headline. |
| `caption` | ui | 13px / 18px | 400 | Trust-bar notes, helper text, legal lines, in text-muted. |
| `category` | product | 11px / 14px | 500, 0.12em tracking | Category label above a product name, uppercase, in text-muted. |
| `product-name` | product | 16px / 22px | 500, 0.01em tracking | Product name on cards. Two lines max, then ellipsis. |
| `product-name-lg` | product | 26px / 32px | 500 | Product name on the product page. |
| `price` | product | 20px / 24px | 500 | Current price, in price color. Always font-variant-numeric: lining-nums tabular-nums. |
| `price-lg` | product | 28px / 32px | 500 | Price on the product page and cart total. Lining numerals. |
| `price-old` | product | 14px / 20px | 400 | Struck-through old price, in text-muted with line-through. |

## Spacing and radius

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | 4px | Icon to label gap. |
| `--space-2` | 8px | Price to old price, badge padding. |
| `--space-3` | 12px | Gap between buttons, card inner gaps. |
| `--space-4` | 16px | Card padding, mobile side gutter. |
| `--space-6` | 24px | Gap between product cards. |
| `--space-8` | 32px | Section title to content. |
| `--space-12` | 48px | Desktop side gutter. |
| `--space-24` | 96px | Vertical space between home page sections. |
| `--radius-sm` | 6px | Buttons inside product cards, inputs. |
| `--radius-md` | 10px | Image wells, alerts. |
| `--radius-lg` | 14px | Product cards, step cards, newsletter box. |
| `--radius-pill` | 999px | Hero buttons, badges, the eyebrow chip. |

## Components

### Hero

The home page opener: eyebrow chip, two-line Marcellus headline, Manrope subtitle, one primary and one secondary pill button, and three trust notes.

- Headline uses `display-xl` (60/64; 40/44 on phones). Line one in `text`, line two in `accent`.
- Subtitle uses `body-lg` in `text-secondary`, max about 520px wide.
- Buttons: Shop products is `primary`; How it works is the gold secondary with `gold` border and `gold-text` label. Never two filled buttons.
- Trust notes use `caption` in `text-muted` with an `outline` check mark.
- The consumer provides the product image on the right; it sits on `surface-raised` with `radius-lg`, no glow.

### Button

One primary (filled crimson) and four secondary variants; gold outline is the default secondary.

| Variant | Fill | Border | Label | Hover | Use for |
| --- | --- | --- | --- | --- | --- |
| Primary | `primary` | `primary` | `on-primary` | `primary-hover` | The main action: Shop products, Order now, Place order |
| Secondary (gold) | none | `gold` | `gold-text` | `gold-hover` fill | Default secondary next to a primary: How it works, See all offers |
| Gold tonal | `gold-tonal-bg` | `gold` | `gold-text` | `gold-hover` fill | A secondary that needs more weight: Load more, Apply filters |
| Ivory solid | `ivory` | `ivory` | `page` | none | Only where no primary is nearby, e.g. Subscribe on a wine band |
| Rose tonal | `rose-tonal-bg` | `rose-tonal-bg` | `outline-text` | `outline` border | Quiet actions inside cards and drawers: View details |

- Pill size (hero, page actions): `button` style, 13px × 26px padding, `radius-pill`, 1.5px border on every variant so sizes match.
- Card size: `button-sm` style, 40px tall, `radius-sm`.
- Focus: 2px `outline` ring, 3px offset.
- At most one primary in a group. Never put ivory solid next to a primary; both would shout.
- Gold is for buttons only. Never use it in alerts or notices, so it is not confused with `warning`.
- Labels are verbs in sentence case.

### ProductCard

One card for every product grid on the site: On sale now, MO products, Combo packs and More wellness products all use the same card.

- Card: `surface`, `radius-lg`, 12px padding. Image well: `surface-raised`, `radius-md`, 4:3.
- Badge (optional): `badge` fill, `on-badge` text, top-left of the image.
- Category: `category` style, uppercase, `text-muted`.
- Name: `product-name` (Jost 500), two lines then ellipsis; the slot always reserves two lines so prices line up across a row.
- Price: current price in `price` style and `price` color; old price in `price-old`, `text-muted`, struck through. Always `lining-nums tabular-nums`.
- Action row at the bottom, 8px gap, both buttons 40px tall:
  - Add to cart: a 44 × 40 button, green by default: `cart-bg` fill, 1.5px `cart` border, `cart` cart-plus icon at 20px. Needs `aria-label="Add to cart"` and a tooltip.
  - Order now: card-size primary button filling the rest of the row.
- After a click it switches to the added state, in rose: `outline-hover` fill, `outline` border, `outline-text` cart-check icon, label "Added to cart". The check icon carries the meaning, not the color change alone.
- Never put the cart button next to the price as a loose circle; it reads as decoration, not a button.
- Every grid shows the action row, including the sale grid.
- The consumer provides the product photo (dark slate background).

### Alert

Inline feedback messages for checkout, cart and forms, in four states: success, error, warning and info.

- Each state uses its own trio: text and icon in `success` / `error` / `warning` / `info`, background in the `-bg` token, border in the `-border` token. `radius-md`, 12px × 14px padding.
- Always show an icon and a short bold lead sentence; never rely on color alone.
- Error is orange-red on purpose so it never reads as the crimson brand.
- Errors say what to fix ("Enter an 11-digit number starting with 01"), not just that something failed.
- Use `role="alert"` for errors, `role="status"` for the rest.

## Checklist for every storefront UI change

- Colors come from the CSS variables above; no new hex values in components.
- Only one primary (crimson) button per group; secondary actions use gold.
- Every price uses `--font-product` with `lining-nums tabular-nums`, and `--price` color.
- Text on `--page`, `--surface` or `--wine` uses `--text`, `--text-secondary` or `--text-muted` only.
- Status messages use the success, error, warning or info trio, always with an icon.
- Gold never appears in alerts; error never uses crimson.
- Product photos are on the dark slate background.
- Copy is English, sentence case, calm and discreet.
