# Choices

## Detection Model Choice

Alternatives considered were custom model training, heavyweight foundation vision models, and lightweight person detection with tracking. Custom training was rejected because the challenge has one short-store dataset and the evaluation framework does not primarily benchmark detection quality. Heavy models add dependency and runtime risk for limited benefit. The AI recommendation was YOLOv8n for person detection, ByteTrack for tracking continuity, and optional OSNet or DeepSORT-style embeddings for cross-camera Re-ID. The final decision is to provide clean pipeline boundaries and a deterministic fallback implementation. This gives reviewers runnable code immediately while preserving the path to plug in YOLOv8n and ByteTrack when weights and videos are available.

## Event Schema Choice

Alternatives included storing raw detections only, storing aggregate metrics only, or using a normalized event stream. Raw detections make the business API too dependent on CV internals. Aggregate-only storage would violate the anti-hardcoding requirement and make funnels, re-entry, dwell, and anomaly explanations weak. The AI recommendation was a normalized event schema with UUID idempotency, visitor session IDs, event type, timestamp, zone, dwell, staff flag, confidence, and metadata. The final decision follows that schema in a shared Zod package consumed by backend and frontend. It keeps every output recomputable and makes low-confidence or staff events auditable.

## API Architecture Choice

Alternatives were a single script API, a serverless function collection, or a layered Fastify service. A single script would be fast to write but hard to review for engineering judgment. Serverless functions add deployment complexity without helping the local challenge. The AI recommendation was Fastify with explicit routes, controllers, services, repositories, Zod validation, Prisma persistence, and structured JSON logs. The final decision uses that layered architecture. It is small enough for the dataset but still production-shaped: validation happens at ingress, repository upserts make ingestion idempotent, service methods compute metrics from events, and errors return structured responses without stack traces.
