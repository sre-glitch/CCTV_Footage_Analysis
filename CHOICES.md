# CHOICES.md

# Engineering Decisions

## Model Selection

### YOLOv8

Selected because:

* High inference speed
* Strong object detection performance
* Real-time capability
* Large community support

Alternative models considered:

* Faster R-CNN
* SSD

YOLO was chosen due to its balance between speed and accuracy.

---

## Event Schema Design

The system uses a structured event-driven architecture.

Each event contains:

* event_id
* store_id
* visitor_id
* camera_id
* event_type
* timestamp
* zone_id
* confidence

Benefits:

* Extensible
* Easy analytics generation
* Store-independent processing
* Supports future event types

---

## Database Choice

SQLite was selected because:

* Lightweight
* Zero configuration
* Fast local development
* Suitable for challenge-scale datasets

Prisma ORM was selected for:

* Type safety
* Query abstraction
* Maintainability

---

## API Architecture

Fastify was chosen because:

* High performance
* Lightweight
* Strong TypeScript support
* Low overhead

REST APIs were used because:

* Simple integration
* Easy testing
* Dashboard compatibility

---

## Multi-Store Design

Instead of creating separate applications per store, a store_id field was included in the event schema.

Benefits:

* Shared infrastructure
* Unified analytics platform
* Easy store comparison
* Better scalability

---

## Dashboard Design

A single dashboard with dynamic store switching was implemented.

Benefits:

* Reduced duplication
* Consistent user experience
* Easier maintenance

---

## Docker Deployment

Docker Compose was selected to provide:

* Reproducible environments
* Simplified setup
* Consistent execution across systems

This allows reviewers to run the entire system using a single command:

docker compose up
