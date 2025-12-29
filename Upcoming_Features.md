# Roadmap & Features

## Completed
- [x] **Speed up searching**: Implemented Postgres Trigram (GIN) Indices for instant fuzzy search. This achieves "Elasticsearch-like" performance for the catalog without the heavy infrastructure overhead.
- [x] **Rebuild sync engine**: Migrated to a "Thin Client" architecture. Products are now archived in Postgres (via Passive Proxy Sync) and fetched via API, significantly reducing Browser Memory usage.
- [x] **Speed up the sync process**: Optimized with parallel worker threads and passive archival.
- [x] **Refine Analytics Validation**: Display 'No prev data' instead of misleading 0%/100% when no historical data exists.

## Planned
- [ ] Full Data Export feature
- [ ] Ad revenue tracking [Meta Ads, Google Ads]
- [ ] Integrate emails into the inbox
- [ ] Improve WooCommerce plugin: Include Live Chat features with UI editor.


The reviews are not syncing.

Dark/Light mode don't really change everything including the side bar.

- [x] Add a Gold Price setting - make this a feature that we need to enable per account in the admin panel

Make the BOM feature a feature that we need to enable per account in the admin panel

products can be toggled to be "gold priced" and they will display the current gold price on the product edit page. it will calculate the cost based on the gold price and the weight of the product, then it will calculate the profit margin based on the gold price and the weight of the product. it will then display the profit margin on the product edit page as we currently do with the profit margin. This feature must only show if enabled in the admin panel for the account.
