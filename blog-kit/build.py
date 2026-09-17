"""네이버 블로그 키트 이미지 생성: python blog-kit/build.py  (크롬 필요, 폰트 로딩에 인터넷 필요)

썸네일 추가: python blog-kit/build.py thumb "파일명" "제목(/ 줄바꿈, *강조*)" "카테고리 영문" "사진(img/ 기준)"
"""
import pathlib
import subprocess
import sys
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "export"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# (출력 파일, 소스, 해시, 가로, 세로)
ASSETS = [
    ("01_타이틀_사진형_966x400.png", "title-photo.html", "", 966, 400),
    ("01_타이틀_아이보리형_966x300.png", "title-ivory.html", "", 966, 300),
    ("02_프로필_아이보리_400.png", "profile.html", "", 400, 400),
    ("02_프로필_블루_400.png", "profile.html", "blue", 400, 400),
    ("03_모바일커버_1080.png", "cover-mobile.html", "", 1080, 1080),
    ("04_위젯_예약.png", "widget.html", "reserve", 340, 300),
    ("04_위젯_홈페이지.png", "widget.html", "home", 340, 300),
    ("04_위젯_운영정보.png", "widget.html", "info", 340, 430),
    ("04_위젯_전화.png", "widget.html", "call", 340, 150),
    ("05_머리_공지사항.png", "post-header.html", "notice", 1080, 420),
    ("05_머리_수업이야기.png", "post-header.html", "class", 1080, 420),
    ("05_머리_변화의기록.png", "post-header.html", "records", 1080, 420),
    ("05_머리_필라테스칼럼.png", "post-header.html", "column", 1080, 420),
    ("05_머리_회원후기.png", "post-header.html", "review", 1080, 420),
    ("06_꼬리_스튜디오안내.png", "post-footer.html", "", 1080, 760),
    ("07_구분선.png", "divider.html", "", 1080, 90),
    ("08_썸네일_예시.png", "thumb.html", "", 1080, 1080),
]


def shoot(out_name, src, hash_, w, h):
    url = (SRC / src).as_uri() + ("#" + quote(hash_) if hash_ else "")
    out = OUT / out_name
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--allow-file-access-from-files",
        "--virtual-time-budget=8000", f"--window-size={w},{h}",
        f"--screenshot={out}", url,
    ], check=True, capture_output=True)
    print("✓", out_name)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "thumb":
        name, title, cat, photo = sys.argv[2:6]
        shoot(f"썸네일_{name}.png", "thumb.html", f"{title}|{cat}|{photo}", 1080, 1080)
    else:
        for a in ASSETS:
            shoot(*a)
