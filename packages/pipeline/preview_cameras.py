"""Extract sample frames and YOLO detections per camera for assignment review."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2

from detect import detect_frame
from emit import load_camera_map, resolve_videos


def draw_detections(frame, detections, color=(0, 255, 0)):
    height, width = frame.shape[:2]
    for det in detections:
        cx, cy = int(det.x * width), int(det.y * height)
        size = max(20, int(min(width, height) * 0.04))
        x1, y1 = max(0, cx - size), max(0, cy - size * 2)
        x2, y2 = min(width - 1, cx + size), min(height - 1, cy + size)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        label = f"{det.track_hint} {det.confidence:.2f}"
        cv2.putText(frame, label, (x1, max(15, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)
    return frame


def sample_frame(video_path: Path, ratio: float = 0.15) -> tuple:
    cap = cv2.VideoCapture(str(video_path))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    target = max(0, int(total * ratio))
    cap.set(cv2.CAP_PROP_POS_FRAMES, target)
    ok, frame = cap.read()
    if not ok:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        ok, frame = cap.read()
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    cap.release()
    return frame, target, fps, total


def main() -> None:
    parser = argparse.ArgumentParser(description="Preview CCTV frames and detections per camera")
    parser.add_argument("--videos", type=Path, required=True)
    parser.add_argument("--camera-map", type=Path, default=Path("./data/camera_map.json"))
    parser.add_argument("--output", type=Path, default=Path("./data/previews"))
    parser.add_argument("--layout", type=Path, default=Path("./data/store_layout.json"))
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    camera_map = load_camera_map(args.camera_map)
    videos = resolve_videos(args.videos, camera_map)
    report: dict[str, dict] = {}

    for logical_id, video_path in sorted(videos.items()):
        frame, frame_idx, fps, total = sample_frame(video_path)
        if frame is None:
            print(f"SKIP {logical_id}: could not read {video_path}")
            continue

        mid_detections = detect_frame(frame, logical_id, frame_idx)

        raw_path = args.output / f"{logical_id}_frame.jpg"
        det_path = args.output / f"{logical_id}_detections.jpg"
        cv2.imwrite(str(raw_path), frame)
        annotated = draw_detections(frame.copy(), mid_detections)
        cv2.putText(
            annotated,
            f"{logical_id} | {video_path.name} | f={frame_idx}/{total}",
            (12, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )
        cv2.imwrite(str(det_path), annotated)

        report[logical_id] = {
            "source_file": video_path.name,
            "frame_index": frame_idx,
            "fps": round(fps, 2),
            "total_frames": total,
            "duration_sec": round(total / fps, 1) if fps else None,
            "detections_near_sample": len(mid_detections),
            "preview_frame": str(raw_path),
            "preview_detections": str(det_path),
        }
        print(f"{logical_id}: {video_path.name} -> {det_path}")

    manifest_path = args.output / "camera_preview_manifest.json"
    with manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "videos_dir": str(args.videos),
                "camera_map": camera_map,
                "cameras": report,
            },
            handle,
            indent=2,
        )
    print(f"Wrote manifest to {manifest_path}")


if __name__ == "__main__":
    main()
