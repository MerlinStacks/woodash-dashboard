# Roadmap & Features

## Completed
- [x] **Speed up searching**: Implemented Postgres Trigram (GIN) Indices for instant fuzzy search. This achieves "Elasticsearch-like" performance for the catalog without the heavy infrastructure overhead.
- [x] **Rebuild sync engine**: Migrated to a "Thin Client" architecture. Products are now archived in Postgres (via Passive Proxy Sync) and fetched via API, significantly reducing Browser Memory usage.
- [x] **Speed up the sync process**: Optimized with parallel worker threads and passive archival.

## Planned
- [ ] Admin feature: Enable certain features per account only (e.g., gold price indicator)
- [ ] Full Data Export feature
- [ ] Ad revenue tracking [Meta Ads, Google Ads]
- [ ] Integrate emails into the inbox
- [ ] Improve WooCommerce plugin: Include Live Chat features with UI editor

when there is no data to compare to ( previous period / year ) we need to say no previous data instead of 100% or 0%