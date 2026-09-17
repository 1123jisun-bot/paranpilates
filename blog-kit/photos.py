"""블로그용 사진 정리: 포스터·비상구 표시·CCTV 등 지우고 필요한 부분만 잘라 src/photos/에 저장
python blog-kit/photos.py
"""
import pathlib

import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent
IMG = ROOT.parent / "img"
OUT = ROOT / "src" / "photos"

# 원본, 저장 이름, 지울 영역(x1, y1, x2, y2), 자를 영역(x1, y1, x2, y2) 또는 None
JOBS = [
    ("herowide.webp", "hero-clean.jpg",
     [(36, 450, 102, 520),    # 벽 안내문
      (276, 452, 342, 528),   # OPEN EVENT 포스터
      (518, 401, 554, 430)],  # 비상구 표시
     None),
    ("private.webp", "private-clean.jpg",
     [(168, 150, 220, 190),   # CCTV
      (184, 184, 207, 540)],  # CCTV 전선
     (0, 110, 900, 1010)),    # 천장 배관·의자·매트 잘라냄
    ("group.webp", "group-clean.jpg",
     [(128, 288, 186, 358),   # OPEN EVENT 포스터
      (336, 238, 369, 267)],  # 비상구 표시
     None),
    ("aboutcenter.webp", "about-clean.jpg",
     [(1062, 186, 1100, 244), # OPEN EVENT 포스터
      (782, 142, 816, 164)],  # 벽시계
     None),
]

# 한 장의 사진에서 용도별로 한 번 더 자르기 (천장 에어컨 제외)
CROPS = [
    ("hero-clean.jpg", "hero-title.jpg", (0, 330, 1800, 1075)),   # 타이틀 966x400 비율
    ("hero-clean.jpg", "hero-square.jpg", (400, 280, 1471, 1351)),  # 모바일 커버 정사각형
]


def read(p):
    return cv2.imdecode(np.fromfile(str(p), np.uint8), cv2.IMREAD_COLOR)


def write(p, im):
    cv2.imencode(".jpg", im, [cv2.IMWRITE_JPEG_QUALITY, 92])[1].tofile(str(p))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for src, name, boxes, crop in JOBS:
        im = read(IMG / src)
        mask = np.zeros(im.shape[:2], np.uint8)
        for x1, y1, x2, y2 in boxes:
            mask[y1:y2, x1:x2] = 255
        im = cv2.inpaint(im, mask, 9, cv2.INPAINT_TELEA)
        if crop:
            x1, y1, x2, y2 = crop
            im = im[y1:y2, x1:x2]
        write(OUT / name, im)
        print("✓", name, im.shape[1], "x", im.shape[0])
    for src, name, (x1, y1, x2, y2) in CROPS:
        im = read(OUT / src)[y1:y2, x1:x2]
        write(OUT / name, im)
        print("✓", name, im.shape[1], "x", im.shape[0])
