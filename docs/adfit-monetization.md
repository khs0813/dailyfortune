# Kakao AdFit Monetization

Last updated: 2026-07-20

## Implementation Summary

This Astro static site uses Kakao AdFit banner units after the user can complete the primary fortune flow. Ad unit IDs are read from `PUBLIC_` environment variables at build time and are never hardcoded in source.

The official AdFit attributes are preserved:

- `class="kakao_ad_area"`
- `data-ad-unit`
- `data-ad-width`
- `data-ad-height`
- SDK: `https://t1.kakaocdn.net/kas/static/ba.min.js`

The SDK URL is defined once in `src/adfit.ts`, passed through the shared layout as `data-adfit-script-src`, and read by `public/js/adfit-slots.js`.

The client chooses exactly one mobile or desktop unit for each slot before loading the SDK. It does not put both variants in the live DOM and it does not call unofficial render APIs.

Localhost, `127.0.0.1`, `onrender.com` preview hosts, unlisted hosts, test mode, and `PUBLIC_ADFIT_ENABLED` values other than `true` do not request ads.

## Page Limits

| Page | Max AdFit slots |
| --- | ---: |
| `/` | 2 |
| `/today/` | 1 |
| `/weekly/` | 1 |
| `/monthly/` | 1 |
| `/zodiac/[slug]/` | 2 |
| `/horoscope/[slug]/` | 2 |
| `/zodiac/` | 1 |
| `/horoscope/` | 1 |
| `/about/`, `/privacy/`, guide, policy, or trust pages | 0 |

## Placements

| Placement | Position | Mobile | Desktop |
| --- | --- | --- | --- |
| `home.afterSummary` | Home fortune summary, then 56px spacing before the ad and 56px before fortune details | 320x100 | 728x90 |
| `home.betweenDirectories` | After all 12 zodiac cards, before horoscope cards | 300x250 | 728x90 |
| `today.afterSummary` | `/today/` summary, then ad, then fortune details, actions, disclaimer, and next-fortune links | 320x100 | 728x90 |
| `weekly.afterSummary` | `/weekly/` summary, then ad, then fortune details, actions, disclaimer, and next-fortune links | 320x100 | 728x90 |
| `monthly.afterSummary` | `/monthly/` summary, then ad, then fortune details, actions, disclaimer, and next-fortune links | 320x100 | 728x90 |
| `profile.afterSummary` | Profile today summary, then ad, then fortune details, actions, disclaimer, follow-up links, and life content | 320x100 | 728x90 |
| `profile.midLife` | After relationship and work/study, before money habit and condition | 300x250 | 300x250 |
| `directory.mid` | `/zodiac/` and `/horoscope/` between the first 6 cards and second 6 cards | 320x100 | 728x90 |

## Environment Variables

Astro exposes browser-safe variables with the `PUBLIC_` prefix, so all AdFit variables use that prefix.

Required controls:

- `PUBLIC_ADFIT_ENABLED`
- `PUBLIC_ADFIT_ALLOWED_HOSTS`

Ad unit IDs:

- `PUBLIC_ADFIT_HOME_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_HOME_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_M_300X250`
- `PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_D_728X90`
- `PUBLIC_ADFIT_TODAY_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_TODAY_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_WEEKLY_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_WEEKLY_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_MONTHLY_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_MONTHLY_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_PROFILE_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_PROFILE_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_PROFILE_MID_LIFE_M_300X250`
- `PUBLIC_ADFIT_PROFILE_MID_LIFE_D_300X250`
- `PUBLIC_ADFIT_DIRECTORY_MID_M_320X100`
- `PUBLIC_ADFIT_DIRECTORY_MID_D_728X90`

The code-level placement names are `*.afterSummary`, but the Render environment variable names remain the existing `*_AFTER_RESULT_*` keys to preserve deployed AdFit unit IDs.

Default production allowlist:

```text
fortunedaily.co.kr,www.fortunedaily.co.kr
```

## Console Unit Names

Create AdFit units with these names:

- `fd_home_after_summary_m_320x100_v1`
- `fd_home_after_summary_d_728x90_v1`
- `fd_home_between_directories_m_300x250_v1`
- `fd_home_between_directories_d_728x90_v1`
- `fd_today_after_summary_m_320x100_v1`
- `fd_today_after_summary_d_728x90_v1`
- `fd_weekly_after_summary_m_320x100_v1`
- `fd_weekly_after_summary_d_728x90_v1`
- `fd_monthly_after_summary_m_320x100_v1`
- `fd_monthly_after_summary_d_728x90_v1`
- `fd_profile_after_summary_m_320x100_v1`
- `fd_profile_after_summary_d_728x90_v1`
- `fd_profile_mid_life_m_300x250_v1`
- `fd_profile_mid_life_d_300x250_v1`
- `fd_directory_mid_m_320x100_v1`
- `fd_directory_mid_d_728x90_v1`

## Render Setup

In Render, add the variables above to the static site environment. Keep `PUBLIC_ADFIT_ENABLED=false` until the units for the pages you want to monetize are created and entered.

For production:

```text
PUBLIC_ADFIT_ENABLED=true
PUBLIC_ADFIT_ALLOWED_HOSTS=fortunedaily.co.kr,www.fortunedaily.co.kr
```

Because this is a static Astro build, environment variable changes require a new production build and deploy before the generated HTML contains the updated public values.

`render.yaml` lists ad unit keys with `sync: false` so real `DAN-*` values are entered in Render and are not committed.

## Safety Rules

- Do not click live ads to test them.
- Use DOM inspection, network request checks, and the AdFit console reporting tools.
- Do not track ad iframe clicks in GA4.
- Do not access or mutate the ad iframe or the SDK-created internal DOM.
- Do not add code-based ad auto-refresh.
- Do not remount ads on profile changes, zodiac/horoscope tab changes, recent 7-day date changes, share clicks, modals, install prompts, or simple resize.
- A new route load is treated as a new page view.

## No-Ad Handling

The slot keeps its configured width and height when AdFit reports NO-AD, avoiding an immediate collapse. The client registers a unique `data-ad-onfail` callback per mounted slot and reveals a same-size internal fallback area without reading iframe contents or recording click events. Console-managed alternative ads can still be configured with matching dimensions.

## Reporting

After deployment, compare 14-day and 28-day windows in AdFit reports:

- request count by ad unit
- fill and NO-AD patterns by ad unit
- estimated earnings by ad unit
- CTR only from AdFit reports, not client-side click tracking
- GA4 `ad_slot_mounted`, `ad_slot_viewport_entered`, `ad_slot_viewport_50_1s`, result renders, period-link clicks, and profile-detail clicks

Use AdFit's ad-unit reports for revenue judgment. The client viewport events are placement visibility signals only, not ad impressions or ad clicks.
