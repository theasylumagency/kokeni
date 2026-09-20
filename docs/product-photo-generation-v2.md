# Product photo studio v2

## Workflow

Open `/admin/photo-generation`. Select a product or create an unpublished draft. New sessions can import the old `originalImages` without changing them. Upload 2–10 JPG, PNG or WebP images, up to 20 MB each. Files are uploaded individually so partial progress survives a failed upload; exact SHA-256 duplicates are skipped. Originals retain their bytes, orientation metadata and aspect ratio. Animated and oversized decoded images are rejected.

Analyze the entire set, inspect the summary and warnings, then edit the proposed views. Plans normally have 2–4 useful images; 1–8 are supported with exactly one main view. Roles are main, informative, detail and additional; product families are not a fixed taxonomy. Each output has one base image and at most three supporting images. Rulers inform proportion; measurements are never written into product specifications automatically.

Save or approve the plan before generating. Generation runs one output at a time and uses only its selected references, with the base first. It always edits the original source, including on regeneration, to avoid accumulating changes. Each result is private and unapproved. Compare it with the source at full size, check text/logos/construction, and explicitly approve it. Changes to a view invalidate its prior draft and approval. Unchanged views keep their drafts. Failed retries retain the previous draft. Removing outputs from a plan does not delete their files or generation history.

Save only approved views, with an approved main required. Choose append (default) or explicit gallery replacement. Append preserves the existing cover; a new main becomes an additional image when the gallery already has retained photos. Replacement places the approved main first. Both modes retain publication status; new products remain unpublished. Saving a published product's gallery is an explicit live catalog edit. Master derivatives are 1600×1600 WebP and mobile derivatives 800×800, contained without stretching. A regenerated result gets a new asset ID; repeated saves of the same draft do not duplicate it.

`/admin/regeneration` redirects to this unified workflow. The old three-slot Gemini UI, server actions and provider dependency have been removed. Existing `kind` and `originalImages` fields remain readable for compatibility.

## Provider configuration

Set these server environment variables (never `NEXT_PUBLIC_*`):

```dotenv
OPENAI_API_KEY=your-server-side-key
OPENAI_PHOTO_ANALYSIS_MODEL=gpt-4.1-mini
OPENAI_PHOTO_IMAGE_MODEL=gpt-image-2.5-sunburst
OPENAI_PHOTO_SIZE=1600x1600
OPENAI_PHOTO_QUALITY=high
```

Only the API key is required; the other values above are defaults. The existing `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` remain required for admin authentication. Missing AI configuration still permits reference upload, manual plans and session recovery. No provider keys are returned to the browser.

The provider adapter is `src/lib/photos/provider.ts`. Analysis uses Responses with a strict JSON schema and `store: false`. Editing uses the Images edit endpoint. Model, quality and size are isolated here and overridable without changing the workflow. For an older image model, choose its supported size/quality as well; `input_fidelity=high` is only sent for GPT Image 1 and 1.5.

The defaults were checked against the [official OpenAI image generation documentation](https://developers.openai.com/api/docs/guides/image-generation) on 2026-09-20. GPT Image 2.5 supports image editing and custom sizes including 1600×1600. [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) supports image input and structured outputs. Account access and billing must be enabled for the configured models. Prompting cannot guarantee exact typography or geometry; human comparison remains mandatory.

## Storage and operations

- `data/photo-workflows/<uuid>/workflow.json`: references, editable plan, current drafts, approvals, analysis usage, generation history and timestamps.
- The same private directory contains untouched sources and generated PNG masters. Authenticated asset routes serve them with private/no-store headers; public image-library enumeration never includes them.
- `public/uploads/products/`: approved public 1600/800 WebP derivatives only from this workflow.
- History records selected reference IDs, provider/model, size/quality, generation time, attempt count, correction and provider usage when available. It does not invent a dollar estimate.

Back up both `data/` and `public/uploads/products/`. Keep them on writable, persistent storage. This repository's JSON/file storage is designed for one host/shared filesystem, not ephemeral serverless disks or independent replicas. For those deployments, move the storage adapter and catalog to shared durable storage before use. Generation requests allow 300 seconds (provider timeout 240 seconds); configure the reverse proxy accordingly. Each upload request needs at least 21 MB of allowed request size.

Catalog mutations and per-session operations use exclusive filesystem locks, optimistic revisions and atomic JSON replacement. Conflicting tabs receive 409 instead of overwriting each other. After an abrupt process crash, stop all app workers before removing an abandoned `*.lock` file; never clear a live lock. A interrupted paid provider call can complete upstream without being recovered locally; the application does not automatically retry paid generation. Reopen the saved session before deciding whether to retry.

## Product URLs

Canonical structure: `/<locale>/catalog/<group>/<product-code>`, for example `/ka/catalog/academic/kkn-dc-001` and `/en/catalog/academic/kkn-dc-001`. Locale describes the page language, never the identifier language. Product names remain Georgian/English.

New codes use `kkn-<category-prefix>-<sequence>`. Existing prefixes: `dc` diploma cover, `oc` official document cover, `dh` document/card holder, `nb` notebook, `dy` diary, `mc` menu, `rp` receipt presenter, `wn` waiter notebook. Other categories use ASCII slug initials. Prefix collisions share one global sequence. Counters exceed three digits when needed. Codes remain stable through renaming and category changes. Moving to another group changes the group segment, and the old product path redirects to the current canonical path.

An idempotent migration runs under the catalog lock on the first read/mutation. It assigns codes in creation order, records old product/group/category slugs in `legacySlugs`, transliterates non-ASCII group/category slugs, and stores a pre-migration backup at `data/backups/before-product-url-migration.json`. Reserved codes live in `data/product-codes.json`, including deleted products' codes, and must be backed up. Deleting a product never makes its reserved code available again.

Both previous four-segment product links and old product slugs return permanent 308 redirects. Drafts and products in inactive categories/groups return 404. Product pages include a variable gallery, localized text, canonical and alternate-language metadata. Product codes/URLs are visible in product administration.

## Validation

`npm test` executes actual storage and route handlers against an isolated temporary catalog. Only authentication, cache invalidation and the paid external AI calls are stubbed. It checks migration/aliases, concurrent code allocation, deleted-code reservation, original bytes/dimensions, duplicate detection, plan validation, stale revisions, selective references, draft isolation, failure recovery, human approval, derivatives, idempotent saves and publication status.

Run `npm run build` for production compilation and type checking. Real generation quality must additionally be evaluated against the four provided sample sets using an account with `OPENAI_API_KEY`, especially Georgian lettering, medal-case depth/cut-outs, notebook closure/bookmark details and folder construction. Automated route tests do not establish model fidelity.
