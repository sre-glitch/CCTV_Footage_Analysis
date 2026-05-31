# Design

The Store Intelligence Platform is built around one durable contract: normalized visitor events. The CCTV pipeline, API, dashboard, and tests all depend on the shared event schema in `packages/shared`, which prevents DTO drift and keeps the north star metric, offline conversion rate, explainable. The implementation is intentionally proportional to the actual dataset: one store, five camera points of view, one layout, short clips, and POS rows without customer identifiers.

Data flows from CCTV footage through the Python pipeline. `detect.py` owns person detections, `tracker.py` owns stable visitor tracks, and `emit.py` converts tracks into schema-valid ENTRY, EXIT, zone, dwell, queue, and re-entry events. The fallback detector is deterministic so reviewers can execute the project without model downloads, while the module boundaries allow YOLOv8n, ByteTrack, and Re-ID embeddings to replace the fallback. Confidence is never discarded; it is preserved in every event for downstream inspection.

Events are ingested by `POST /events/ingest`, validated with Zod, and persisted idempotently by event UUID. The backend follows strict layering: routes only register endpoints, controllers parse and format responses, services perform business calculations, and repositories isolate Prisma access. Metrics, funnel, heatmap, and anomaly calculations exclude staff and compute from stored events. Purchase conversion is correlated using the practical rule from the challenge: a visitor present in the billing zone within five minutes before a POS transaction counts as converted.

The dashboard is a Next.js operational view. It polls the API so new ingested events change visitor count, conversion rate, queue depth, anomalies, funnel stages, and heatmap zones without hardcoded numbers. For the short provided dataset, polling is simpler and more reliable than WebSockets.

Camera assignments for the Purplle CCTV pack were verified with `preview_cameras.py` (single-frame YOLO overlays in `data/previews/`). Checkout was reassigned from CAM 3 to CAM 5 after visual review; CAM 3 covers the glass entrance and CAM 4 covers stock storage.

The design scales by replacing SQLite with PostgreSQL, adding indexes by store and timestamp, and splitting the pipeline into asynchronous jobs if video volume grows. The key tradeoff is that model sophistication is deferred in favor of correctness, idempotent ingestion, explainable calculations, and complete evaluator-facing behavior.
