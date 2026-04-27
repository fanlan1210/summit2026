# g0v Summit 2026

## 技術

- Astro
- TailwindCSS
- jQuery

## 開發

```
  npm i
  npm run dev
```

GitHub action 根據 main branch 更新，作為 staging site

<https://g0v.github.io/summit2026/>

## 議程

議程採用 OPass 格式的 [Google Sheet](https://docs.google.com/spreadsheets/d/1jD0RtB_J4XxcwbgABtHJWo6XECffTLP6_bgzrcy_rqo)。更新前，請先在 `.env` 設定以下欄位：

```
GCP_API_KEY=""
SPREADSHEET_ID=""
DEFAULT_AVATAR="https://summit.g0v.tw/2026/img/avatars/default.jpg"
AVATAR_BASE_URL="https://summit.g0v.tw/2026/img/avatars/"
```

接著執行：

```
npm run fetch-schedule
```

## 頭貼

放在 `public/img/avatars` 底下。

上傳前請先檢查檔案副檔名是否正規化（小寫），以 ImageMagick 縮放到短邊 960 像素，並以 Zopfli、JPEGOptim 等軟體壓縮過（壓縮品質 90%）：

```bash
for i in *.jpg; do
    magick $i -resize 960x960^ -quality 90 public/img/avatars/$i
done
```

## 貢獻

本專案由 g0v summit 2026 宣傳組—網站小組負責維護，歡迎透過 [issue](https://github.com/g0v/summit2026/issues) 提出問題與建議，也歡迎提出 PR

## 部署

```
# macOS and Linux only
./deploy

# Cross-platform
npm run deploy
```

會自動將 dist 下的檔案推送到 production branch，並透過 repository dispatch 觸發 [summit repo](https://github.com/g0v/summit.g0v.tw) 更新 submodules
目前是使用網站組小組長 SeanGau 的 Token
