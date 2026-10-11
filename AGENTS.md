<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Storefront architecture
- Load public Shopify catalog data through shared Storefront API query options and TanStack Query route loaders, so record pages render real store data.
- Maintain shopping bags with a persisted Zustand store that syncs Shopify cart mutations, so checkout uses Shopify-generated URLs and authoritative cart lines.
- Keep shared navigation, cart drawer and product cards in the store layout module, so catalog and product pages stay consistent.
