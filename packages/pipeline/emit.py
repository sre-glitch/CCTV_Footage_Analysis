from __future__ import annotations

import argparse
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from detect import detect_people
from tracker import track, TrackPoint

STORE_ID = "store_001"
ENTRY_CAMERA = "ENTRY_CAMERA"
DWELL_INTERVAL_FRAMES = 30 * 30  # ~30s at 30fps


def point_in_polygon(x: float, y: float, polygon: list[list[float]]) -> bool:
    inside = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        intersects = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi)
        if intersects:
            inside = not inside
        j = i
    return inside


def load_layout(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def zone_for_point(layout: dict, x: float, y: float) -> str | None:
    px, py = x * 100, y * 100
    for zone in layout.get("zones", []):
        if point_in_polygon(px, py, zone["polygon"]):
            return zone["id"]
    return None


def iso(base: datetime, frame: int) -> str:
    return (base + timedelta(seconds=frame / 30)).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def make_event(
    point: TrackPoint,
    event_type: str,
    timestamp: str,
    zone_id: str | None,
    dwell_ms: int = 0,
    metadata: dict | None = None,
) -> dict:
    return {
        "event_id": str(uuid.uuid4()),
        "store_id": STORE_ID,
        "camera_id": point.camera_id,
        "visitor_id": point.visitor_id,
        "event_type": event_type,
        "timestamp": timestamp,
        "zone_id": zone_id,
        "dwell_ms": dwell_ms,
        "is_staff": point.is_staff,
        "confidence": point.confidence,
        "metadata": metadata or {},
    }


def _emit_visitor_track(track: list[TrackPoint], layout: dict, base: datetime, reentry: bool) -> list[dict]:
    events: list[dict] = []
    if not track:
        return events

    current_zone: str | None = None
    last_dwell_frame = -9999
    queue_joined = False
    visitor = track[0].visitor_id

    first = track[0]
    events.append(make_event(first, "REENTRY" if reentry else "ENTRY", iso(base, first.frame), "ENTRY"))

    for point in track:
        ts = iso(base, point.frame)
        zone = zone_for_point(layout, point.x, point.y) or "ENTRY"
        if zone != current_zone:
            if current_zone:
                events.append(make_event(point, "ZONE_EXIT", ts, current_zone))
            events.append(make_event(point, "ZONE_ENTER", ts, zone))
            current_zone = zone
            if zone == "CASH_COUNTER" and not queue_joined:
                queue_joined = True
                events.append(make_event(point, "BILLING_QUEUE_JOIN", ts, zone, metadata={"queue_depth": 1}))
        if point.frame - last_dwell_frame >= DWELL_INTERVAL_FRAMES and zone:
            events.append(make_event(point, "ZONE_DWELL", ts, zone, dwell_ms=30000))
            last_dwell_frame = point.frame

    last = track[-1]
    ts = iso(base, last.frame + 45)
    if current_zone:
        events.append(make_event(last, "ZONE_EXIT", ts, current_zone))
    if queue_joined:
        events.append(make_event(last, "BILLING_QUEUE_ABANDON", ts, "CASH_COUNTER"))
    events.append(make_event(last, "EXIT", ts, "EXIT"))
    return events


def emit_entry_camera(points: list[TrackPoint], layout: dict, base: datetime) -> list[dict]:
    by_visitor: dict[str, list[TrackPoint]] = {}
    for point in sorted(points, key=lambda item: (item.visitor_id, item.frame)):
        if point.is_staff:
            continue
        by_visitor.setdefault(point.visitor_id, []).append(point)

    events: list[dict] = []
    for track in by_visitor.values():
        events.extend(_emit_visitor_track(track, layout, base, reentry=False))
    return events


def emit_aux_camera(points: list[TrackPoint], layout: dict, base: datetime, active_visitor: str | None) -> list[dict]:
    if not active_visitor:
        return []
    events: list[dict] = []
    current_zone: str | None = None
    last_dwell_frame = -9999

    for point in points:
        if point.is_staff:
            continue
        point = TrackPoint(
            frame=point.frame,
            camera_id=point.camera_id,
            visitor_id=active_visitor,
            x=point.x,
            y=point.y,
            confidence=point.confidence,
            is_staff=point.is_staff,
        )
        ts = iso(base, point.frame)
        zone = zone_for_point(layout, point.x, point.y)
        if not zone:
            continue
        if zone != current_zone:
            if current_zone:
                events.append(make_event(point, "ZONE_EXIT", ts, current_zone))
            events.append(make_event(point, "ZONE_ENTER", ts, zone))
            current_zone = zone
            if zone == "CASH_COUNTER":
                events.append(
                    make_event(point, "BILLING_QUEUE_JOIN", ts, zone, metadata={"queue_depth": 1})
                )
        if point.frame - last_dwell_frame >= DWELL_INTERVAL_FRAMES:
            events.append(make_event(point, "ZONE_DWELL", ts, zone, dwell_ms=30000))
            last_dwell_frame = point.frame
    return events


def load_camera_map(path: Path | None) -> dict[str, str]:
    if path is None or not path.exists():
        return {
            "CAM 1": "ENTRY_CAMERA",
            "CAM 2": "FLOOR_CAMERA",
            "CAM 3": "BILLING_CAMERA",
            "CAM 4": "AUX_CAMERA_1",
            "CAM 5": "AUX_CAMERA_2",
        }
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def resolve_videos(video_dir: Path, camera_map: dict[str, str]) -> dict[str, Path]:
    files = [path for path in video_dir.rglob("*") if path.suffix.lower() in {".mp4", ".mov", ".avi", ".mkv"}]
    by_stem = {path.stem.strip().upper(): path for path in files}
    resolved: dict[str, Path] = {}

    for raw_name, logical_id in camera_map.items():
        key = raw_name.strip().upper()
        if key in by_stem:
            resolved[logical_id] = by_stem[key]
            continue
        for stem, path in by_stem.items():
            if stem.replace(" ", "") == key.replace(" ", ""):
                resolved[logical_id] = path
                break

    for path in files:
        stem = path.stem.strip().upper()
        if stem in camera_map.values():
            resolved[stem] = path
        elif path.stem.upper() in camera_map:
            resolved[camera_map[path.stem.upper()]] = path

    return resolved


def emit_events(video_dir: Path, layout_path: Path, camera_map_path: Path | None = None) -> list[dict]:
    layout = load_layout(layout_path)
    base = datetime.now(timezone.utc).replace(microsecond=0)
    camera_order = [
        "ENTRY_CAMERA",
        "FLOOR_CAMERA",
        "BILLING_CAMERA",
        "AUX_CAMERA_1",
        "AUX_CAMERA_2",
    ]
    camera_map = load_camera_map(camera_map_path)
    videos = resolve_videos(video_dir, camera_map)
    events: list[dict] = []
    primary_visitor: str | None = None

    for camera_id in camera_order:
        video = videos.get(camera_id)
        if video is None:
            video = Path(f"{camera_id}.mp4")
        print(f"Processing {camera_id}: {video}")
        points = track(detect_people(video, camera_id))
        if not points:
            continue
        if camera_id == ENTRY_CAMERA:
            entry_events = emit_entry_camera(points, layout, base)
            events.extend(entry_events)
            for event in entry_events:
                if event["event_type"] == "ENTRY":
                    primary_visitor = event["visitor_id"]
                    break
        else:
            events.extend(emit_aux_camera(points, layout, base, primary_visitor))
    return events


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--videos", type=Path, default=Path("./data/videos"))
    parser.add_argument("--layout", type=Path, default=Path("./data/store_layout.json"))
    parser.add_argument("--output", type=Path, default=Path("./data/events.jsonl"))
    parser.add_argument("--camera-map", type=Path, default=Path("./data/camera_map.json"))
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = emit_events(args.videos, args.layout, args.camera_map)
    with args.output.open("w", encoding="utf-8") as handle:
        for item in payload:
            handle.write(json.dumps(item) + "\n")
    print(f"Wrote {len(payload)} events to {args.output}")


if __name__ == "__main__":
    main()
