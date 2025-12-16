# g0v Summit 2026

直接 fork [summit2024](https://github.com/g0v/summit2024) 來改的
- 使用 gulp + pug + tailwindcss
- 使用 baseurl 來解決 /2026 & /summit2026 的相對路徑問題

## How to dev
```
  npm i
  npm run pre
  npm start
```
gh-pages 會自動根據 main branch 更新，作為 staging site

https://g0v.github.io/summit2026/

## Translation

- 使用 [JQuery-i18next](https://github.com/i18next/jquery-i18next)
- 華語直接使用程式碼內文字，英文使用 `/src/locale/en.yml`

## How to contribute

本專案由 g0v summit 2026 宣傳組—網站小組負責維護，歡迎透過 [issue](https://github.com/g0v/summit2026/issues) 提出問題與建議，也歡迎提出 PR

## How to deploy
`./deploy`
會自動將 static/2026 下的檔案推送到 production branch，並透過 repository dispatch 觸發 [summit repo](https://github.com/g0v/summit.g0v.tw) 更新 submodules
目前是使用網站組小組長 SeanGau 的 Token 
