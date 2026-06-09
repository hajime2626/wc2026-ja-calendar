// generate-ics.js
// openfootball JSON → 日本語ICS変換スクリプト
// GitHub Actions から実行される

const https = require('https');
const fs = require('fs');

const MATCHES_URL  = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const STADIUMS_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.stadiums.json';

// ─────────────────────────────────────────
// 翻訳テーブル
// ─────────────────────────────────────────
// TEAMS: name → [日本語名, 国旗, FIFAコード]
const TEAMS = {
  "Mexico":                  ["メキシコ",               "🇲🇽", "MEX"],
  "South Africa":            ["南アフリカ",             "🇿🇦", "RSA"],
  "South Korea":             ["韓国",                   "🇰🇷", "KOR"],
  "Czech Republic":          ["チェコ",                 "🇨🇿", "CZE"],
  "UEFA Path D winner":      ["欧州PO-D",               "🏴",  "TBD"],
  "Canada":                  ["カナダ",                 "🇨🇦", "CAN"],
  "Bosnia & Herzegovina":    ["ボスニア・ヘルツェゴビナ","🇧🇦", "BIH"],
  "Bosnia-Herzegovina":      ["ボスニア・ヘルツェゴビナ","🇧🇦", "BIH"],
  "UEFA Path A winner":      ["欧州PO-A",               "🏴",  "TBD"],
  "Qatar":                   ["カタール",               "🇶🇦", "QAT"],
  "Switzerland":             ["スイス",                 "🇨🇭", "SUI"],
  "Brazil":                  ["ブラジル",               "🇧🇷", "BRA"],
  "Morocco":                 ["モロッコ",               "🇲🇦", "MAR"],
  "Haiti":                   ["ハイチ",                 "🇭🇹", "HAI"],
  "Scotland":                ["スコットランド",          "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "SCO"],
  "USA":                     ["アメリカ",               "🇺🇸", "USA"],
  "Paraguay":                ["パラグアイ",             "🇵🇾", "PAR"],
  "Australia":               ["オーストラリア",          "🇦🇺", "AUS"],
  "UEFA Path C winner":      ["欧州PO-C",               "🏴",  "TBD"],
  "Turkey":                  ["トルコ",                 "🇹🇷", "TUR"],
  "Germany":                 ["ドイツ",                 "🇩🇪", "GER"],
  "Curaçao":                 ["キュラソー",             "🇨🇼", "CUW"],
  "Curacao":                 ["キュラソー",             "🇨🇼", "CUW"],
  "Ivory Coast":             ["コートジボワール",        "🇨🇮", "CIV"],
  "Ecuador":                 ["エクアドル",             "🇪🇨", "ECU"],
  "Netherlands":             ["オランダ",               "🇳🇱", "NED"],
  "Japan":                   ["日本",                   "🇯🇵", "JPN"],
  "UEFA Path B winner":      ["欧州PO-B",               "🏴",  "TBD"],
  "Tunisia":                 ["チュニジア",             "🇹🇳", "TUN"],
  "Sweden":                  ["スウェーデン",            "🇸🇪", "SWE"],
  "Belgium":                 ["ベルギー",               "🇧🇪", "BEL"],
  "Egypt":                   ["エジプト",               "🇪🇬", "EGY"],
  "Iran":                    ["イラン",                 "🇮🇷", "IRN"],
  "New Zealand":             ["ニュージーランド",        "🇳🇿", "NZL"],
  "Spain":                   ["スペイン",               "🇪🇸", "ESP"],
  "Cape Verde":              ["カーボベルデ",            "🇨🇻", "CPV"],
  "Saudi Arabia":            ["サウジアラビア",          "🇸🇦", "KSA"],
  "Uruguay":                 ["ウルグアイ",             "🇺🇾", "URU"],
  "France":                  ["フランス",               "🇫🇷", "FRA"],
  "Senegal":                 ["セネガル",               "🇸🇳", "SEN"],
  "Iraq":                    ["イラク",                 "🇮🇶", "IRQ"],
  "Norway":                  ["ノルウェー",             "🇳🇴", "NOR"],
  "Argentina":               ["アルゼンチン",            "🇦🇷", "ARG"],
  "Algeria":                 ["アルジェリア",            "🇩🇿", "ALG"],
  "Austria":                 ["オーストリア",            "🇦🇹", "AUT"],
  "Jordan":                  ["ヨルダン",               "🇯🇴", "JOR"],
  "Portugal":                ["ポルトガル",             "🇵🇹", "POR"],
  "DR Congo":                ["コンゴ民主共和国",        "🇨🇩", "COD"],
  "England":                 ["イングランド",            "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "ENG"],
  "Croatia":                 ["クロアチア",             "🇭🇷", "CRO"],
  "Ghana":                   ["ガーナ",                 "🇬🇭", "GHA"],
  "Panama":                  ["パナマ",                 "🇵🇦", "PAN"],
  "Uzbekistan":              ["ウズベキスタン",           "🇺🇿", "UZB"],
  "Colombia":                ["コロンビア",             "🇨🇴", "COL"],
};

const GROUPS = {
  "Group A": "グループA", "Group B": "グループB", "Group C": "グループC",
  "Group D": "グループD", "Group E": "グループE", "Group F": "グループF",
  "Group G": "グループG", "Group H": "グループH", "Group I": "グループI",
  "Group J": "グループJ", "Group K": "グループK", "Group L": "グループL",
};
// 放送局テーブル（グループステージ）
// キー: "team1 vs team2"（openfootball の英語チーム名）
const BROADCASTS = {
  "Mexico vs South Africa":           "NHK総合",
  "Canada vs Bosnia & Herzegovina":   "NHK総合",
  "Haiti vs Scotland":                "NHK総合",
  "Australia vs Turkey":              "日本テレビ",
  "Netherlands vs Japan":             "NHK総合",
  "Sweden vs Tunisia":                "日本テレビ",
  "Spain vs Cape Verde":              "NHK総合",
  "Belgium vs Egypt":                 "NHK総合",
  "France vs Senegal":                "フジテレビ",
  "Argentina vs Algeria":             "NHK総合",
  "Portugal vs DR Congo":             "フジテレビ",
  "Czech Republic vs South Africa":   "日本テレビ",
  "Mexico vs South Korea":            "NHK総合",
  "USA vs Australia":                 "NHK総合",
  "Scotland vs Morocco":              "フジテレビ",
  "Brazil vs Haiti":                  "NHK総合",
  "Netherlands vs Sweden":            "NHK総合",
  "Germany vs Ivory Coast":           "日本テレビ",
  "Tunisia vs Japan":                 "日本テレビ",
  "Spain vs Saudi Arabia":            "NHK総合",
  "Norway vs Senegal":                "NHK総合",
  "Portugal vs Uzbekistan":           "NHK総合",
  "Panama vs Croatia":                "フジテレビ",
  "Colombia vs DR Congo":             "日本テレビ",
  "Switzerland vs Canada":            "NHK総合",
  "Czech Republic vs Mexico":         "NHK総合",
  "Japan vs Sweden":                  "NHK総合",
  "Turkey vs USA":                    "日本テレビ",
  "Norway vs France":                 "NHK総合",
  "Uruguay vs Spain":                 "日本テレビ",
  "New Zealand vs Belgium":           "日本テレビ",
  "Colombia vs Portugal":             "フジテレビ",
  "Jordan vs Argentina":              "NHK総合",
};



// スタジアム情報（city キーで引く）
// generate-ics.js 起動時に stadiums.json から構築する
let STADIUMS = {};

// ─────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────
function teamInfo(name) {
  return TEAMS[name] || [name, "🏳️", name.slice(0,3).toUpperCase()];
}

function stadiumInfo(ground) {
  return STADIUMS[ground] || null;
}

// "13:00 UTC-6" → UTC の Date オブジェクト
function parseMatchDate(m) {
  if (!m.date) return null;
  const timeStr = m.time || "00:00 UTC+0";
  const match = timeStr.match(/(\d+):(\d+)\s+UTC([+-]\d+)/);
  if (!match) return new Date(m.date + 'T00:00:00Z');
  const [, h, mi, off] = match;
  const base = new Date(`${m.date}T${h.padStart(2,'0')}:${mi}:00Z`);
  return new Date(base.getTime() - parseInt(off) * 3600000);
}

// ICS 日時フォーマット: 20260611T190000Z (UTC)
function icsDatetime(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// ICS 日時フォーマット（JST: UTC+9）: 20260615T050000
function icsDatetimeJST(d) {
  const jst = new Date(d.getTime() + 9 * 3600000);
  return jst.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, '');
}

// ICS テキスト折り返し（RFC 5545: 75オクテット）
function foldLine(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const out = [];
  let pos = 0;
  let isFirst = true;
  while (pos < bytes.length) {
    const limit = isFirst ? 75 : 74; // 継続行は先頭スペース分1バイト減
    isFirst = false;
    let end = pos + limit;
    // マルチバイト文字の途中で切らない
    while (end > pos && (bytes[end] & 0xC0) === 0x80) end--;
    out.push(bytes.slice(pos, end).toString('utf8'));
    pos = end;
  }
  return out.join('\r\n '); // 継続行は先頭スペース
}

// DESCRIPTION テキストを生成
function buildDescription(m) {
  const lines = [];

  // グループ / ラウンド
  if (m.group) lines.push(GROUPS[m.group] || m.group);
  else if (m.round) lines.push(m.round);

  // スタジアム詳細
  const st = stadiumInfo(m.ground);
  if (st) {
    lines.push(`スタジアム: ${st.nameJa}（収容: ${st.capacity.toLocaleString()}人）`);
    lines.push(`所在地: ${st.cityJa}`);
  } else if (m.ground) {
    lines.push(`会場: ${m.ground}`);
  }

  // スコア
  if (m.score) {
    const [s1, s2] = m.score.ft;
    let scoreStr = `スコア: ${s1} - ${s2}`;
    if (m.score.ht) scoreStr += ` (前半 ${m.score.ht[0]}-${m.score.ht[1]})`;
    if (m.score.et) scoreStr += ` [延長 ${m.score.et[0]}-${m.score.et[1]}]`;
    if (m.score.p)  scoreStr += ` [PK ${m.score.p[0]}-${m.score.p[1]}]`;
    lines.push(scoreStr);
  }

  // 得点者
  const fmtGoals = (goals, teamName) => {
    if (!goals || !goals.length) return;
    const [ja] = teamInfo(teamName);
    const list = goals.map(g => {
      let s = `${g.minute}'`;
      if (g.offset) s += `+${g.offset}`;
      s += ` ${g.name}`;
      if (g.penalty) s += '(PK)';
      if (g.owngoal) s += '(OG)';
      return s;
    });
    lines.push(`得点 ${ja}: ${list.join('、')}`);
  };
  fmtGoals(m.goals1, m.team1);
  fmtGoals(m.goals2, m.team2);

  // カード
  const fmtCards = (cards, teamName) => {
    if (!cards || !cards.length) return;
    const [ja] = teamInfo(teamName);
    const list = cards.map(c => {
      const icon = c.type === 'red card' ? '🟥' : '🟨';
      return `${c.minute}' ${c.name} ${icon}`;
    });
    lines.push(`カード ${ja}: ${list.join('、')}`);
  };
  fmtCards(m.cards1, m.team1);
  fmtCards(m.cards2, m.team2);

  // 交代
  const fmtSubs = (subs, teamName) => {
    if (!subs || !subs.length) return;
    const [ja] = teamInfo(teamName);
    const list = subs.map(s => `${s.minute}' ↑${s.name} ↓${s.nameOut || '?'}`);
    lines.push(`交代 ${ja}: ${list.join('、')}`);
  };
  fmtSubs(m.subs1, m.team1);
  fmtSubs(m.subs2, m.team2);

  // 放送局
  const broadcastKey = `${m.team1} vs ${m.team2}`;
  const broadcaster = BROADCASTS[broadcastKey];
  if (broadcaster) lines.push(`放送: ${broadcaster}`);

  return lines.join('\\n');
}

// SUMMARY を生成
function buildSummary(m) {
  const t1 = m.team1 || 'TBD';
  const t2 = m.team2 || 'TBD';
  const [, t1f, t1c] = teamInfo(t1);
  const [, t2f, t2c] = teamInfo(t2);
  // 決勝かどうか（round フィールドが "Final" または "World Cup Final"）
  const isFinal = (m.round || '').trim() === 'Final';
  const prefix = isFinal ? '🏆 ' : '';

  if (m.score) {
    const [s1, s2] = m.score.ft;
    return `${prefix}${t1f} ${t1c} ${s1}–${s2} ${t2c} ${t2f}`;
  }
  return `${prefix}${t1f} ${t1c} vs ${t2c} ${t2f}`;
}

// LOCATION を生成（スタジアム名 + 都市）
function buildLocation(m) {
  const st = stadiumInfo(m.ground);
  if (st) return `${st.nameJa}、${st.cityJa}`;
  return m.ground || '';
}

// UID
function buildUID(m, idx) {
  const date = (m.date || 'unknown').replace(/-/g, '');
  const t1 = (m.team1 || 'TBD').replace(/[\s&]/g, '').toLowerCase().slice(0, 12);
  const t2 = (m.team2 || 'TBD').replace(/[\s&]/g, '').toLowerCase().slice(0, 12);
  return `wc2026-${date}-${t1}-${t2}-${idx}@hajime2626.github.io`;
}

// ─────────────────────────────────────────
// ICS 生成
// ─────────────────────────────────────────
function generateICS(data) {
  const now = new Date();
  const stamp = icsDatetime(now);

  const vtimezone = [
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Tokyo',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0900',
    'TZOFFSETTO:+0900',
    'TZNAME:JST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ].join('\r\n');

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//hajime2626//wc2026-ja-calendar//JA',
    'X-WR-CALNAME:2026 FIFAワールドカップ',
    'X-WR-TIMEZONE:Asia/Tokyo',
    'X-WR-CALDESC:2026 FIFAワールドカップ 全104試合（日本時間）',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `LAST-MODIFIED:${stamp}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    '',
  ].join('\r\n');

  const events = (data.matches || []).map((m, idx) => {
    const startDate = parseMatchDate(m);
    if (!startDate) return '';

    // 延長・PKありの試合は最大3時間30分を確保
    const durationMs = 3.5 * 3600000;
    const endDate = new Date(startDate.getTime() + durationMs);

    const lines = [
      'BEGIN:VEVENT',
      `DTSTART;TZID=Asia/Tokyo:${icsDatetimeJST(startDate)}`,
      `DTEND;TZID=Asia/Tokyo:${icsDatetimeJST(endDate)}`,
      `DTSTAMP:${stamp}`,
      foldLine(`UID:${buildUID(m, idx)}`),
      foldLine(`SUMMARY:${buildSummary(m)}`),
    ];

    const desc = buildDescription(m);
    if (desc) lines.push(foldLine(`DESCRIPTION:${desc}`));

    const loc = buildLocation(m);
    if (loc) lines.push(foldLine(`LOCATION:${loc}`));

    if (m.group) lines.push(`CATEGORIES:${GROUPS[m.group] || m.group}`);

    lines.push('END:VEVENT');
    return lines.join('\r\n');
  }).filter(Boolean);

  return header + vtimezone + '\r\n\r\n' + events.join('\r\n\r\n') + '\r\nEND:VCALENDAR';
}

// ─────────────────────────────────────────
// スタジアム日本語テーブルを組み立てる
// ─────────────────────────────────────────
const STADIUM_JA = {
  "BC Place":               "BCプレイス",
  "Lumen Field":            "ルーメン・フィールド",
  "Levi's Stadium":         "リーバイス・スタジアム",
  "SoFi Stadium":           "SoFiスタジアム",
  "Estadio Akron":          "エスタディオ・アクロン",
  "Estadio Azteca":         "エスタディオ・アステカ",
  "Estadio BBVA":           "エスタディオ・BBVA",
  "NRG Stadium":            "NRGスタジアム",
  "AT&T Stadium":           "AT&Tスタジアム",
  "Arrowhead Stadium":      "アローヘッド・スタジアム",
  "Mercedes-Benz Stadium":  "メルセデス・ベンツ・スタジアム",
  "Hard Rock Stadium":      "ハードロック・スタジアム",
  "BMO Field":              "BMOフィールド",
  "Gillette Stadium":       "ギレット・スタジアム",
  "Lincoln Financial Field":"リンカーン・フィナンシャル・フィールド",
  "MetLife Stadium":        "メットライフ・スタジアム",
};

const CITY_JA = {
  "Vancouver":                              "バンクーバー（カナダ）",
  "Seattle":                                "シアトル（米国）",
  "San Francisco Bay Area (Santa Clara)":   "サンフランシスコ湾岸・サンタクララ（米国）",
  "Los Angeles (Inglewood)":               "ロサンゼルス・イングルウッド（米国）",
  "Guadalajara (Zapopan)":                  "グアダラハラ・サポパン（メキシコ）",
  "Mexico City":                            "メキシコシティ（メキシコ）",
  "Monterrey (Guadalupe)":                  "モンテレー・グアダルペ（メキシコ）",
  "Houston":                                "ヒューストン（米国）",
  "Dallas (Arlington)":                     "ダラス・アーリントン（米国）",
  "Kansas City":                            "カンザスシティ（米国）",
  "Atlanta":                                "アトランタ（米国）",
  "Miami (Miami Gardens)":                  "マイアミ・マイアミガーデンズ（米国）",
  "Toronto":                                "トロント（カナダ）",
  "Boston (Foxborough)":                    "ボストン・フォックスボロ（米国）",
  "Philadelphia":                           "フィラデルフィア（米国）",
  "New York/New Jersey (East Rutherford)":  "ニューヨーク/ニュージャージー・イーストラザフォード（米国）",
};

function buildStadiumMap(stadiumData) {
  const map = {};
  for (const s of (stadiumData.stadiums || [])) {
    map[s.city] = {
      nameEn:   s.name,
      nameJa:   STADIUM_JA[s.name] || s.name,
      cityJa:   CITY_JA[s.city]    || s.city,
      capacity: s.capacity,
      coords:   s.coords,
    };
  }
  return map;
}

// ─────────────────────────────────────────
// HTTP fetch
// ─────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error from ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// ─────────────────────────────────────────
// メイン
// ─────────────────────────────────────────
async function main() {
  console.log('[1/3] Fetching stadiums data...');
  const stadiumData = await fetchJSON(STADIUMS_URL);
  STADIUMS = buildStadiumMap(stadiumData);
  console.log(`      ${Object.keys(STADIUMS).length} stadiums loaded`);

  console.log('[2/3] Fetching match data...');
  const matchData = await fetchJSON(MATCHES_URL);
  const matches = matchData.matches || [];
  const finishedCount = matches.filter(m => m.score).length;
  console.log(`      ${matches.length} matches total, ${finishedCount} finished`);

  console.log('[3/3] Generating ICS...');
  const ics = generateICS(matchData);
  fs.writeFileSync('wc2026-ja.ics', ics, 'utf8');
  console.log('      wc2026-ja.ics written');

  // meta.json（index.html から参照）
  const meta = {
    generated:     new Date().toISOString(),
    matchCount:    matches.length,
    finishedCount,
    stadiumCount:  Object.keys(STADIUMS).length,
  };
  fs.writeFileSync('meta.json', JSON.stringify(meta, null, 2), 'utf8');
  console.log('      meta.json written');
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
