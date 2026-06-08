# SEO & Discoverability — Baseline Metrics

Snapshot taken **before** any SEO/discoverability changes, so the impact of later
work (GitHub topics, expanded keywords, README restructure, Pulumi Registry
submission) is attributable. Re-measure after each tier ships and append a new
dated column.

## Baseline — 2026-06-08

| Metric                     | Value                              | Source                                     |
| -------------------------- | ---------------------------------- | ------------------------------------------ |
| npm latest version         | 1.8.0                              | npm registry                               |
| First publish              | 2026-02-12                         | npm registry                               |
| npm downloads — last day   | 9                                  | `api.npmjs.org/downloads/point/last-day`   |
| npm downloads — last week  | 20                                 | `api.npmjs.org/downloads/point/last-week`  |
| npm downloads — last month | 557                                | `api.npmjs.org/downloads/point/last-month` |
| GitHub stars               | 2                                  | GitHub API                                 |
| GitHub forks               | 0                                  | GitHub API                                 |
| GitHub watchers            | 0                                  | GitHub API                                 |
| GitHub open issues         | 1                                  | GitHub API                                 |
| GitHub repo created        | 2025-08-30                         | GitHub API                                 |
| GitHub topics              | none set                           | GitHub API                                 |
| GitHub homepage URL        | not set                            | GitHub API                                 |
| `package.json` keywords    | 21                                 | repo                                       |
| Snyk Package Health        | 70 / 100                           | snyk.io/advisor                            |
| npms.io score              | n/a — service sunset (`NOT_FOUND`) | api.npms.io                                |

### Notes

- **npms.io is discontinued.** Its API returns `{"code":"NOT_FOUND"}` for every
  package, so it is not a usable signal. Snyk Advisor's Package Health Score
  (security / popularity / maintenance / community) is used as the health proxy
  instead.
- Snyk's score will move on its own as download/dependency data ages; treat it as
  a trend indicator, not a precise before/after.
- README documents 11 components but `src/` ships 16 (`app-runner`,
  `identity-center`, `organizations`, `rds`, `vercel` are undocumented) — fixing
  this is part of the README restructure and should lift indexable surface area.

## How to re-measure

```bash
# npm downloads
for r in last-day last-week last-month; do
  curl -s "https://api.npmjs.org/downloads/point/$r/infra-foundry"; echo
done

# GitHub
gh repo view 0xhssn/infra-foundry --json stargazerCount,forkCount,watchers,issues,repositoryTopics,homepageUrl

# Snyk Package Health Score (rendered in page)
curl -sL https://snyk.io/advisor/npm-package/infra-foundry -A "Mozilla/5.0" \
  | grep -oE 'score-number" [^>]*>[0-9]+/100'
```
