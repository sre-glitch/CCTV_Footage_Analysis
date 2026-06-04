# DESIGN.md

# RetailIQ System Design

## Overview

RetailIQ is a multi-store retail intelligence platform that transforms CCTV footage into actionable business insights. The system processes video feeds, generates structured retail events, stores analytics data, and provides visualization through a web dashboard.

---

## System Architecture

The system follows a layered architecture:

```text
CCTV Footage
    ↓
Detection & Tracking
    ↓
Event Generation
    ↓
JSONL Event Store
    ↓
Database Layer
    ↓
API Layer
    ↓
Analytics Dashboard
```

---

## Core Components

### Computer Vision Pipeline

The pipeline processes CCTV footage using YOLO-based detection and tracking.

Responsibilities:

* Person detection
* Customer tracking
* Zone mapping
* Event generation

---

### Event Processing Layer

The event processor converts raw detections into structured business events.

Examples:

* ENTRY
* EXIT
* REENTRY
* ZONE_ENTER
* ZONE_EXIT
* ZONE_DWELL
* BILLING_QUEUE_JOIN
* BILLING_QUEUE_ABANDON

---

### Database Layer

Prisma ORM with SQLite is used for structured event storage and analytics.

Responsibilities:

* Event persistence
* Analytics queries
* Store-specific filtering

---

### API Layer

Fastify provides REST APIs for dashboard analytics.

Endpoints:

* /stores/:id/metrics
* /stores/:id/funnel
* /stores/:id/heatmap
* /stores/:id/anomalies

---

### Dashboard Layer

React-based dashboard for analytics visualization.

Features:

* Visitor metrics
* Conversion analytics
* Queue monitoring
* Heatmaps
* Funnel analysis
* Multi-store switching

---

# AI-Assisted Decisions

AI tools were used to accelerate:

* Architecture exploration
* API design refinement
* Documentation generation
* Frontend implementation guidance
* Development workflow troubleshooting

All architectural decisions, implementation choices, testing, debugging, integration, and final validation were performed manually by the project team.
