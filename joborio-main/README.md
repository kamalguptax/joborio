# Joborio

Next.js 16 + Tailwind 4 + framer-motion.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Routes

`/` (home), `/about`, `/creators`, `/opportunities`, `/campaigns`, `/courses`,
`/marketplace`, `/resources`, `/hiring`, `/partners`, `/signup`, plus a 404 page.

- Text for the simple pages lives in `lib/pages.ts`.
- Shared layout pieces are in `components/layout/` (Header, Footer, Logo, PageHero, PageTemplate).
- Every inner page starts with a dark hero (`PageHero`) because the header is transparent with white text until you scroll.

## TODO

- `components/SignupForm.tsx` has no backend yet. Send the form data to your API where the `TODO` comment is.
- Optional photos: add `/public/personas/*.jpg` (and uncomment `img` in `components/Choosegrow.tsx`) and `/public/calculator-creator.png` (then change the `src` in `components/Earningscalculator.tsx`).
