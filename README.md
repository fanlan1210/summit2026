# g0v Summit 2026

## 技術

- Astro
- TailwindCSS
- JQuery

## 開發

```
  npm i
  npm run dev
```

GitHub action 根據 main branch 更新，作為 staging site

https://g0v.github.io/summit2026/

## 貢獻

本專案由 g0v summit 2026 宣傳組—網站小組負責維護，歡迎透過 [issue](https://github.com/g0v/summit2026/issues) 提出問題與建議，也歡迎提出 PR

## 部署

`./deploy`
會自動將 dist 下的檔案推送到 production branch，並透過 repository dispatch 觸發 [summit repo](https://github.com/g0v/summit.g0v.tw) 更新 submodules
目前是使用網站組小組長 SeanGau 的 Token
