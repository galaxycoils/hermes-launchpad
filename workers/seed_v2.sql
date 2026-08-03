DROP TABLE IF EXISTS tokens; DROP TABLE IF EXISTS trades; DROP TABLE IF EXISTS comments; DROP TABLE IF EXISTS likes; DROP TABLE IF EXISTS profiles; DROP TABLE IF EXISTS quest_progress; DROP TABLE IF EXISTS positions;
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  emoji TEXT DEFAULT '🪙',
  lore TEXT DEFAULT '',
  creator TEXT NOT NULL,
  chain TEXT DEFAULT 'SOL',
  -- curve state (raw units: lamports / token base units w/ 6 decimals)
  virtual_sol INTEGER NOT NULL DEFAULT 30000000000,      -- 30 SOL
  virtual_tokens INTEGER NOT NULL DEFAULT 1073000000000000, -- 1.073B tokens
  real_sol INTEGER NOT NULL DEFAULT 0,
  real_tokens INTEGER NOT NULL DEFAULT 0,
  complete INTEGER NOT NULL DEFAULT 0,                    -- migrated/graduated
  -- display stats (derived but cached for cheap reads)
  price REAL NOT NULL DEFAULT 0.0000279,                  -- SOL per token
  market_cap REAL NOT NULL DEFAULT 0,                     -- USD
  volume_24h REAL NOT NULL DEFAULT 0,                     -- USD
  holders INTEGER NOT NULL DEFAULT 1,
  change_24h REAL NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 50,
  sentiment TEXT DEFAULT 'neutral',
  spark TEXT DEFAULT '[]',
  replies INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  onchain_mint TEXT,
  created_at INTEGER NOT NULL                             -- unix seconds
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  wallet TEXT NOT NULL,
  side TEXT NOT NULL,               -- 'buy' | 'sell'
  sol_amount REAL NOT NULL,         -- SOL
  token_amount REAL NOT NULL,       -- whole tokens
  price REAL NOT NULL,              -- SOL/token at execution
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trades_ts ON trades(ts DESC);
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_id, ts DESC);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL REFERENCES tokens(id),
  wallet TEXT NOT NULL,
  text TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_token ON comments(token_id, ts DESC);

CREATE TABLE IF NOT EXISTS likes (
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  ts INTEGER NOT NULL,
  PRIMARY KEY (token_id, wallet)
);

CREATE TABLE IF NOT EXISTS profiles (
  wallet TEXT PRIMARY KEY,          -- solana pubkey or anon-xxxx local id
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_day TEXT,             -- YYYY-MM-DD (UTC)
  ref_code TEXT NOT NULL,
  referred_by TEXT,
  trades INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,  -- sells executed above avg buy price (approx)
  pnl REAL NOT NULL DEFAULT 0,      -- USD, simulated
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_progress (
  wallet TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  day TEXT NOT NULL,                -- quests reset daily
  PRIMARY KEY (wallet, quest_id, day)
);

CREATE TABLE IF NOT EXISTS positions (
  wallet TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tokens REAL NOT NULL DEFAULT 0,   -- whole tokens held (sim)
  avg_cost REAL NOT NULL DEFAULT 0, -- SOL per token avg
  PRIMARY KEY (wallet, token_id)
);
INSERT INTO tokens (id,name,ticker,emoji,lore,creator,chain,virtual_sol,virtual_tokens,real_sol,real_tokens,complete,price,market_cap,volume_24h,holders,change_24h,risk_score,sentiment,spark,replies,likes,onchain_mint,created_at) VALUES
('antigrav', 'Antigravity Pump', 'AGPUMP', '🛸', 'The coin that forgot gravity exists. Born when a dev sneezed on the launch button.', '0xHermes', 'SOL', 101.4, 317455621.30177516, 71.4, 0, 0, 3.194147250698975e-07, 47912, 182000, 4211, 0, 22, 'bullish', '[0.1977, 0.2091, 0.1863, 0.2205, 0.2053, 0.232, 0.2167, 0.2434, 0.2282, 0.2548, 0.2396, 0.2662, 0.251, 0.2738, 0.2624, 0.2852, 0.27, 0.2966, 0.2814, 0.3042, 0.289, 0.3118, 0.3004, 0.3194]', 1204, 10, NULL, 1785727180),
('mooncat', 'Moon Cat', 'MCAT', '🐱', 'A cat. On the moon. It has a tiny helmet. That is the entire thesis.', 'lunarpaw', 'SOL', 84.4, 381398104.2654028, 54.4, 0, 0, 2.2129108418763596e-07, 33194, 96400, 2877, 0, 31, 'bullish', '[0.1645, 0.1555, 0.1705, 0.1585, 0.1764, 0.1675, 0.1824, 0.1734, 0.1884, 0.1794, 0.1944, 0.1854, 0.2004, 0.1914, 0.2063, 0.1974, 0.2123, 0.2033, 0.2183, 0.2093, 0.2243, 0.2153, 0.2303, 0.2213]', 863, 32, NULL, 1785722680),
('bogdanoff', 'Bog Coin', 'BOG', '🧙', 'He bought? Dump eet. He sold? Pump eet. The council decides your candles.', 'igorb', 'BASE', 77.6, 414819587.628866, 47.6, 0, 0, 1.870692761727244e-07, 28060, 55300, 1930, 0, 58, 'bearish', '[0.2984, 0.2806, 0.3029, 0.2761, 0.294, 0.2672, 0.2851, 0.2583, 0.2761, 0.2494, 0.2672, 0.2405, 0.2583, 0.2316, 0.2494, 0.2227, 0.2405, 0.2138, 0.2316, 0.2049, 0.2227, 0.196, 0.2138, 0.1871]', 420, 23, NULL, 1785715600),
('toaster', 'Brave Little Toaster', 'TOAST', '🍞', 'Every buy makes the toast browner. At migration we achieve golden brown.', 'kitchensink', 'SOL', 66.55, 483696468.82043576, 36.55, 0, 0, 1.3758628456042248e-07, 20638, 41200, 1455, 0, 27, 'bullish', '[0.1072, 0.1153, 0.1052, 0.1174, 0.1093, 0.1194, 0.1113, 0.1214, 0.1133, 0.1234, 0.1153, 0.1254, 0.1174, 0.1275, 0.1194, 0.1295, 0.1214, 0.1315, 0.1234, 0.1335, 0.1254, 0.1356, 0.1275, 0.1376]', 512, 37, NULL, 1785711400),
('npc', 'NPC Token', 'NPC', '🧍', 'It does nothing. It says nothing. It just stands there gaining value.', 'grayman', 'BASE', 56.35, 571251109.1393079, 26.35, 0, 0, 9.864313451382418e-08, 14796, 22800, 980, 0, 40, 'neutral', '[0.1003, 0.0935, 0.102, 0.0952, 0.1037, 0.0935, 0.102, 0.0952, 0.1037, 0.0969, 0.102, 0.0952, 0.1037, 0.0969, 0.1054, 0.0952, 0.1037, 0.0969, 0.1054, 0.0986, 0.1037, 0.0969, 0.1054, 0.0986]', 233, 11, NULL, 1785699700),
('shrimp', 'Shrimp Fried Rice', 'SFR', '🍤', 'Wok-hei infused liquidity. Certified 100% msg-free and rug-free* (*not certified).', 'unclewok', 'SOL', 48.7, 660985626.2833675, 18.7, 0, 0, 7.367785026405717e-08, 11052, 18900, 742, 0, 35, 'bullish', '[0.0656, 0.061, 0.0668, 0.0622, 0.0679, 0.0633, 0.0691, 0.0645, 0.0702, 0.0656, 0.0714, 0.0668, 0.0725, 0.0679, 0.0737, 0.0691, 0.0748, 0.0702, 0.076, 0.0714, 0.0771, 0.0725, 0.0783, 0.0737]', 198, 7, NULL, 1785691600),
('goblin', 'Goblin Mode', 'GOBLIN', '👺', 'No roadmap. No utility. Only goblin. You were warned in the name itself.', 'cavedweller', 'SOL', 41.9, 768257756.5632459, 11.9, 0, 0, 5.453898726312519e-08, 8181, 9700, 411, 0, 74, 'bearish', '[0.0842, 0.0794, 0.0854, 0.0783, 0.083, 0.0759, 0.0806, 0.0735, 0.0783, 0.0711, 0.0759, 0.0688, 0.0735, 0.0664, 0.0711, 0.064, 0.0688, 0.0617, 0.0664, 0.0593, 0.064, 0.0569, 0.0617, 0.0545]', 97, 8, NULL, 1785677200),
('doomer', 'Doomer Juice', 'DOOM', '🥤', 'Tastes like red candles and 3am chart-watching. Surprisingly refreshing.', 'nightowl', 'BASE', 37.65, 854980079.6812749, 7.65, 0, 0, 4.40361136999068e-08, 6605, 5400, 268, 0, 49, 'neutral', '[0.0449, 0.0415, 0.0457, 0.0423, 0.0466, 0.0432, 0.0457, 0.0423, 0.0466, 0.0432, 0.0474, 0.0423, 0.0466, 0.0432, 0.0474, 0.044, 0.0466, 0.0432, 0.0474, 0.044, 0.0483, 0.0432, 0.0474, 0.044]', 64, 7, NULL, 1785662800);
INSERT INTO trades (token_id,wallet,side,sol_amount,token_amount,price,ts) VALUES
('antigrav', 'anon-chad3', 'buy', 0.65, 2336548.7, 0.0000002782, 1785726342),
('antigrav', 'solsnipe', 'buy', 1.084, 3971711.9, 0.0000002729, 1785722536),
('mooncat', 'cointosscarl', 'buy', 2.31, 12112435.6, 0.0000001907, 1785720094),
('mooncat', 'moonfarmer', 'buy', 1.776, 9366174.7, 0.0000001896, 1785722233),
('mooncat', 'moonfarmer', 'sell', 2.146, 9895822.3, 0.0000002169, 1785717245),
('mooncat', 'solsnipe', 'buy', 2.094, 10821900.8, 0.0000001935, 1785718059),
('bogdanoff', 'PaperHandzPhil', 'buy', 1.019, 5517907.7, 0.0000001847, 1785714665),
('bogdanoff', 'anon-ape1', 'buy', 0.654, 3742251.7, 0.0000001748, 1785721091),
('toaster', 'anon-jeet2', 'sell', 0.883, 7178536.1, 0.0000001230, 1785724518),
('toaster', 'PaperHandzPhil', 'buy', 1.819, 13801101.9, 0.0000001318, 1785713297),
('toaster', 'anon-chad3', 'buy', 0.311, 2395011.3, 0.0000001299, 1785708763),
('npc', 'anon-ape1', 'buy', 2.37, 27465535.8, 0.0000000863, 1785712410),
('npc', 'moonfarmer', 'sell', 2.326, 24478561.6, 0.0000000950, 1785723109),
('shrimp', 'anon-jeet2', 'buy', 1.689, 25987074.6, 0.0000000650, 1785725365),
('shrimp', 'degensarah', 'buy', 1.209, 18011208.6, 0.0000000671, 1785726610),
('shrimp', 'degensarah', 'buy', 0.918, 13666908.6, 0.0000000672, 1785727925),
('shrimp', 'solsnipe', 'buy', 1.834, 25659657.8, 0.0000000715, 1785726120),
('goblin', '0xWhaleWatcher', 'buy', 1.24, 25775996.0, 0.0000000481, 1785716559),
('goblin', 'moonfarmer', 'buy', 0.055, 1109942.4, 0.0000000496, 1785714791),
('doomer', 'solsnipe', 'sell', 1.039, 23802797.3, 0.0000000437, 1785711033),
('doomer', 'anon-chad3', 'buy', 0.147, 3871250.0, 0.0000000380, 1785710575),
('doomer', 'solsnipe', 'buy', 0.689, 16461783.9, 0.0000000419, 1785719405),
('doomer', 'cointosscarl', 'buy', 0.371, 8898056.4, 0.0000000417, 1785714718);
INSERT INTO comments (token_id,wallet,text,ts) VALUES
('antigrav', '0xWhaleWatcher', 'dev based, lore immaculate', 1785693687),
('antigrav', 'anon-ape1', 'dev based, lore immaculate', 1785699961),
('antigrav', 'moonfarmer', 'this is the one 🚀', 1785718937),
('mooncat', 'moonfarmer', 'chart looks sentient', 1785718185),
('mooncat', 'anon-chad3', 'dev based, lore immaculate', 1785718692),
('mooncat', 'anon-jeet2', 'king of the hill soon 👑', 1785711709),
('bogdanoff', 'anon-ape1', 'ngl the bard cooked with this lore', 1785715027),
('bogdanoff', 'PaperHandzPhil', 'dyor but i''m in', 1785723443),
('bogdanoff', '0xWhaleWatcher', 'chart looks sentient', 1785719384),
('toaster', 'solsnipe', 'aped my lunch money', 1785704896),
('toaster', 'PaperHandzPhil', 'this is the one 🚀', 1785690148),
('toaster', 'cointosscarl', 'dyor but i''m in', 1785728124),
('npc', 'cointosscarl', 'dyor but i''m in', 1785695481),
('npc', 'anon-jeet2', 'chart looks sentient', 1785713154),
('shrimp', 'solsnipe', 'dyor but i''m in', 1785720214),
('goblin', 'anon-chad3', 'dyor but i''m in', 1785719256),
('goblin', 'solsnipe', 'selling my house for this', 1785715133),
('doomer', '0xWhaleWatcher', 'dyor but i''m in', 1785692504);
INSERT INTO profiles (wallet,xp,level,streak_days,last_active_day,ref_code,referred_by,trades,wins,pnl,created_at) VALUES
('0xWhaleWatcher', 9840, 7, 2, '2026-08-03', 'ref0xWhal', NULL, 187, 38, -457, 1785048458),
('degensarah', 8720, 6, 2, '2026-08-03', 'refdegens', NULL, 46, 13, 955, 1785517765),
('PaperHandzPhil', 7680, 6, 5, '2026-08-03', 'refPaperH', NULL, 59, 22, 1050, 1785409139),
('solsnipe', 7110, 6, 5, '2026-08-02', 'refsolsni', NULL, 72, 48, 2988, 1785353193),
('moonfarmer', 6430, 6, 4, '2026-08-02', 'refmoonfa', NULL, 84, 59, -221, 1784964905),
('cointosscarl', 5280, 5, 3, '2026-08-02', 'refcointo', NULL, 31, 5, 1335, 1785492826),
('anon-ape1', 3200, 4, 5, '2026-08-02', 'refanon-a', NULL, 61, 52, 1930, 1784890055),
('anon-jeet2', 1500, 3, 3, '2026-08-03', 'refanon-j', NULL, 22, 12, -86, 1784905414),
('anon-chad3', 900, 2, 1, '2026-08-03', 'refanon-c', NULL, 29, 58, 1531, 1785050636);
INSERT INTO positions (wallet,token_id,tokens,avg_cost) VALUES
('anon-ape1', 'antigrav', 1155037.4, 0.0000002846),
('cointosscarl', 'antigrav', 600830.4, 0.0000002539),
('PaperHandzPhil', 'antigrav', 1858999.0, 0.0000002511),
('degensarah', 'antigrav', 1396152.2, 0.0000002271),
('anon-chad3', 'mooncat', 4229974.4, 0.0000001978),
('solsnipe', 'mooncat', 1222335.6, 0.0000001567),
('cointosscarl', 'mooncat', 1645719.9, 0.0000001697),
('PaperHandzPhil', 'mooncat', 1133815.9, 0.0000002071),
('PaperHandzPhil', 'bogdanoff', 1985359.8, 0.0000001588),
('anon-ape1', 'bogdanoff', 2393444.5, 0.0000001427),
('moonfarmer', 'bogdanoff', 2810806.9, 0.0000001750),
('0xWhaleWatcher', 'bogdanoff', 3433388.7, 0.0000001363),
('degensarah', 'toaster', 1273316.3, 0.0000001046),
('cointosscarl', 'toaster', 2880049.0, 0.0000000990),
('anon-ape1', 'toaster', 3686347.2, 0.0000001244),
('PaperHandzPhil', 'toaster', 4892124.0, 0.0000001146),
('solsnipe', 'npc', 2982712.7, 0.0000000747),
('degensarah', 'npc', 1179065.2, 0.0000000708),
('PaperHandzPhil', 'npc', 3192404.5, 0.0000000747),
('0xWhaleWatcher', 'npc', 4536558.1, 0.0000000902),
('anon-ape1', 'shrimp', 1324051.6, 0.0000000686),
('PaperHandzPhil', 'shrimp', 2271340.7, 0.0000000674),
('anon-jeet2', 'shrimp', 2796594.0, 0.0000000525),
('solsnipe', 'shrimp', 4996484.1, 0.0000000670),
('0xWhaleWatcher', 'goblin', 380109.8, 0.0000000461),
('anon-chad3', 'goblin', 2563966.9, 0.0000000498),
('cointosscarl', 'goblin', 871420.4, 0.0000000513),
('PaperHandzPhil', 'goblin', 492546.2, 0.0000000407),
('degensarah', 'doomer', 2578835.0, 0.0000000323),
('anon-chad3', 'doomer', 1810143.3, 0.0000000316),
('moonfarmer', 'doomer', 1296993.6, 0.0000000340),
('anon-jeet2', 'doomer', 2247104.4, 0.0000000368);
