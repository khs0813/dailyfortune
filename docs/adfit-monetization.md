# Kakao AdFit Monetization

Last updated: 2026-07-19

## Implementation Summary

This Astro static site uses Kakao AdFit banner units only after the user can complete the fortune flow. Ad unit IDs are read from `PUBLIC_` environment variables at build time and are never hardcoded in source.

The official AdFit markup is preserved when a slot is mounted:

- `class="kakao_ad_area"`
- `data-ad-unit`
- `data-ad-width`
- `data-ad-height`
- SDK: `https://t1.kakaocdn.net/kas/static/ba.min.js`

Localhost, `127.0.0.1`, `onrender.com` preview hosts, unlisted hosts, test mode, and `PUBLIC_ADFIT_ENABLED` values other than `true` do not request ads.

## Page Limits

| Page | Max AdFit slots |
| --- | ---: |
| `/` | 2 |
| `/today/` | 1 |
| `/weekly/` | 1 |
| `/monthly/` | 1 |
| `/zodiac/[slug]/` | 2 by default, 3 only with real expanded content and `PUBLIC_ADFIT_PROFILE_THIRD_ENABLED=true` |
| `/horoscope/[slug]/` | 2 by default, 3 only with real expanded content and `PUBLIC_ADFIT_PROFILE_THIRD_ENABLED=true` |
| `/zodiac/` | 1 |
| `/horoscope/` | 1 |
| `/guide/*` | 1 |
| `/about/`, `/privacy/`, policy or trust pages | 0 |

The client guard never mounts more than 3 slots on a route, so a page cannot reach 4 AdFit units.

## Placements

| Placement | Position | Mobile | Desktop |
| --- | --- | --- | --- |
| `home.afterResult` | Home fortune result, actions, and disclaimer, then 56px spacing | 320x100 | 728x90, optional 300x250 fallback when configured |
| `home.betweenDirectories` | After the zodiac card grid, before horoscope cards | 300x250 | 728x90, optional 300x250 fallback when configured |
| `today.afterResult` | `/today/` result, actions, and disclaimer, then next-fortune links below the ad | 320x100 | 728x90 |
| `weekly.afterResult` | `/weekly/` result, actions, and disclaimer, then today/month/profile links below the ad | 320x100 | 728x90 |
| `monthly.afterResult` | `/monthly/` result, actions, and disclaimer, then today/week/profile links below the ad | 320x100 | 728x90 |
| `profile.afterResult` | Profile intro and today result, then actions/disclaimer/ad before follow-up links and life content | 320x100 | 728x90 |
| `profile.afterLife` | After relationship, work/study, money habit, and condition sections, before related profiles and FAQ | 300x250 | 300x250 |
| `profile.mid` | Reserved for future expanded profile content only | 300x250 | 300x250 |
| `profile.side` | Optional side rail replacing `profile.afterLife` only on wide desktop | none | 160x600 |
| `directory.afterGrid` | `/zodiac/` and `/horoscope/` after all cards, before explanation content | 320x100 | 728x90 |
| `guide.mid` | After the second substantive guide section, away from CTA cards and FAQ | 300x250 | 300x250 |

## Environment Variables

Astro exposes browser-safe variables with the `PUBLIC_` prefix, so all AdFit variables use that prefix.

Required controls:

- `PUBLIC_ADFIT_ENABLED`
- `PUBLIC_ADFIT_ALLOWED_HOSTS`
- `PUBLIC_ADFIT_PROFILE_THIRD_ENABLED`
- `PUBLIC_ADFIT_DESKTOP_SIDE_RAIL_ENABLED`

Ad unit IDs:

- `PUBLIC_ADFIT_HOME_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_HOME_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_HOME_AFTER_RESULT_D_300X250`
- `PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_M_300X250`
- `PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_D_728X90`
- `PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_D_300X250`
- `PUBLIC_ADFIT_TODAY_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_TODAY_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_WEEKLY_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_WEEKLY_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_MONTHLY_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_MONTHLY_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_PROFILE_AFTER_RESULT_M_320X100`
- `PUBLIC_ADFIT_PROFILE_AFTER_RESULT_D_728X90`
- `PUBLIC_ADFIT_PROFILE_AFTER_LIFE_M_300X250`
- `PUBLIC_ADFIT_PROFILE_AFTER_LIFE_D_300X250`
- `PUBLIC_ADFIT_PROFILE_MID_M_300X250`
- `PUBLIC_ADFIT_PROFILE_MID_D_300X250`
- `PUBLIC_ADFIT_PROFILE_SIDE_D_160X600`
- `PUBLIC_ADFIT_DIRECTORY_AFTER_GRID_M_320X100`
- `PUBLIC_ADFIT_DIRECTORY_AFTER_GRID_D_728X90`
- `PUBLIC_ADFIT_GUIDE_MID_M_300X250`
- `PUBLIC_ADFIT_GUIDE_MID_D_300X250`

Default production allowlist:

```text
fortunedaily.co.kr,www.fortunedaily.co.kr
```

## Console Unit Names

Create AdFit units with these names:

- `fd_home_after_result_m_320x100_v1`
- `fd_home_after_result_d_728x90_v1`
- `fd_home_between_directories_m_300x250_v1`
- `fd_home_between_directories_d_728x90_v1`
- `fd_today_after_result_m_320x100_v1`
- `fd_today_after_result_d_728x90_v1`
- `fd_weekly_after_result_m_320x100_v1`
- `fd_weekly_after_result_d_728x90_v1`
- `fd_monthly_after_result_m_320x100_v1`
- `fd_monthly_after_result_d_728x90_v1`
- `fd_profile_after_result_m_320x100_v1`
- `fd_profile_after_result_d_728x90_v1`
- `fd_profile_after_life_m_300x250_v1`
- `fd_profile_after_life_d_300x250_v1`
- `fd_directory_after_grid_m_320x100_v1`
- `fd_directory_after_grid_d_728x90_v1`
- `fd_guide_mid_m_300x250_v1`
- `fd_guide_mid_d_300x250_v1`

Optional experiments:

- `fd_profile_mid_m_300x250_v1`
- `fd_profile_mid_d_300x250_v1`
- `fd_profile_side_d_160x600_v1`

## Render Setup

In Render, add the variables above to the static site environment. Keep `PUBLIC_ADFIT_ENABLED=false` until all required units for the pages you want to monetize are created and entered.

For production:

```text
PUBLIC_ADFIT_ENABLED=true
PUBLIC_ADFIT_ALLOWED_HOSTS=fortunedaily.co.kr,www.fortunedaily.co.kr
```

Because this is a static Astro build, environment variable changes require a new production build and deploy before the generated HTML contains the updated public values.

`render.yaml` lists ad unit keys with `sync: false` so real `DAN-*` values are entered in Render and are not committed.

## Safety Rules

- Do not click live ads to test them.
- Use DOM inspection, network request checks, and the AdFit console preview/reporting tools.
- Do not track ad iframe clicks in GA4.
- Do not access or mutate the ad iframe or the SDK-created internal DOM.
- Do not add code-based ad auto-refresh.
- Do not remount ads on profile changes, zodiac/horoscope tab changes, recent 7-day date changes, share clicks, modals, or install prompts.
- A new route load is treated as a new page view.

## Auto Refresh

No code-based refresh is implemented.

Only consider refresh later for detail-page slots whose active-time median is at least 90 seconds. Test from the official AdFit console starting at 90 seconds. Do not implement refresh with `setInterval`, repeated DOM recreation, or unit ID rotation in the site code.

## Side Rail Experiment

`PUBLIC_ADFIT_DESKTOP_SIDE_RAIL_ENABLED=true` can replace the inline `profile.afterLife` unit with `profile.side` only when the viewport is at least 1280px and the profile life section has an independent aside column. Mobile never mounts the side rail. The 300x250 inline and 160x600 side rail are not mounted together.

## Reporting

After deployment, compare 14-day and 28-day windows in AdFit reports:

- request count by ad unit
- estimated earnings by ad unit
- fill/no-ad patterns visible in AdFit
- CTR only from AdFit reports, not client-side click tracking
- GA4 sessions, result renders, period-link clicks, and profile-detail clicks

Use AdFit's ad-unit reports for revenue judgment. The client only records slot eligibility and site navigation events.

## Alternative Ads

For no-ad fallback in the AdFit console, point alternative ad URLs to internal pages rather than external click funnels:

- `/weekly/`
- `/monthly/`
- `/zodiac/`
- `/horoscope/`
- high-quality profile detail pages

Do not place alternative ad links inside the site code or inside the same clickable area as related profile cards.
