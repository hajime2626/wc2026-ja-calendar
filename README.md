# ⚽ WC2026 日本語カレンダー

2026 FIFAワールドカップの全試合を日本語で追えるカレンダーです。  
試合結果・得点者・カード・交代情報が自動更新されます（6時間ごと）。

## カレンダーに登録する

**Apple カレンダー（iPhone / Mac）**
```
webcal://hajime2626.github.io/wc2026-ja-calendar/wc2026-ja.ics
```

**Google カレンダー**  
「他のカレンダー」→「URLで追加」に以下を貼り付け：
```
https://hajime2626.github.io/wc2026-ja-calendar/wc2026-ja.ics
```

## 仕組み

- データソース: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
- GitHub Actions が6時間ごとに `generate-ics.js` を実行
- 生成した `wc2026-ja.ics` を GitHub Pages で公開
- カレンダーアプリが自動的にICSを再取得して同期

## ファイル構成

```
wc2026-ja-calendar/
├── generate-ics.js          # ICS生成スクリプト
├── wc2026-ja.ics            # 生成されたICS（自動更新）
├── meta.json                # 更新メタ情報
├── index.html               # ランディングページ
└── .github/
    └── workflows/
        └── update.yml       # 自動更新ワークフロー
```

## データについて

openfootball は試合後に手動でコミットされるOSSプロジェクトです。  
リアルタイムではなく、**試合後数時間以内に結果が反映**されます。

---

データ: [openfootball](https://github.com/openfootball/worldcup.json) (CC0)
