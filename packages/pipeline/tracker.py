from __future__ import annotations

from dataclasses import dataclass

from detect import Detection

ENTRY_CAMERA = "ENTRY_CAMERA"


@dataclass(frozen=True)
class TrackPoint:
    frame: int
    camera_id: str
    visitor_id: str
    x: float
    y: float
    confidence: float
    is_staff: bool


def track(detections: list[Detection]) -> list[TrackPoint]:
    """Map detector track IDs to stable visitor session identifiers."""
    points: list[TrackPoint] = []
    for detection in detections:
        if detection.is_staff:
            visitor_id = f"staff_{detection.track_hint}"
        elif detection.camera_id == ENTRY_CAMERA:
            visitor_id = f"visitor_session_{detection.track_hint}"
        else:
            visitor_id = detection.track_hint
        points.append(
            TrackPoint(
                frame=detection.frame,
                camera_id=detection.camera_id,
                visitor_id=visitor_id,
                x=detection.x,
                y=detection.y,
                confidence=detection.confidence,
                is_staff=detection.is_staff,
            )
        )
    return points
