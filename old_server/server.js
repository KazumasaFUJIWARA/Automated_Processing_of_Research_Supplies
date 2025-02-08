import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { XMLParser } from 'fast-xml-parser';
import FormData from 'form-data';
import fetch from 'node-fetch';
import multer from 'multer';
import { config } from 'dotenv';

config();  // 環境変数をロード

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

// SQLite データベース接続
const db = new sqlite3.Database(path.join(process.cwd(), './ARPS.db'), (err) => {
	if (err) {
		console.error('データベース接続エラー:', err);
	} else {
		console.log('データベースに接続しました');
	}
});

app.use(express.json());
app.use(express.static(path.join(process.cwd(), './public')));

//// {{{ app.post('/insertProject', (req, res) => {
app.post('/insertProject', (req, res) => {
	const { projectNumber, projectType, projectTitle } = req.body;

	if (!projectNumber || !projectType || !projectTitle) {
		return res.status(400).json({ error: '全ての項目を入力してください。' });
	}

	// 既存データがある場合は処理をスキップ
	db.get(`SELECT pnumber FROM projects WHERE pnumber = ?`, [projectNumber], (err, row) => {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。' });
		}

		if (row) {
			console.log(`既存データがあるため、挿入をスキップ: pnumber=${projectNumber}`);
			return res.json({ message: '既存データがあるため、新規追加をスキップしました。' });
		} else {
			const query = `
				INSERT INTO projects (pnumber, ptype, ptitle)
				VALUES (?, ?, ?)
				ON CONFLICT(pnumber) DO UPDATE SET
				ptype = excluded.ptype,
				ptitle = excluded.ptitle
			`;

			db.run(query, [projectNumber, projectType, projectTitle], function (err) {
				if (err) {
					console.error('データベースエラー:', err);
					return res.status(500).json({ error: 'データベースエラーが発生しました。' });
				}

				console.log(`projects テーブルに新規挿入しました: pnumber=${projectNumber}`);
				res.json({ message: '課題情報が追加されました。' });
			});
		}
	});
});
// }}}

// {{{ app.post('/updateProject', (req, res) => {
app.post('/updateProject', (req, res) => {
	const { pnumber, ptype, ptitle } = req.body;

	if (!pnumber || !ptype || !ptitle) {
		return res.status(400).json({ error: '全ての項目を入力してください。' });
	}

	// CONFLICTの場合はUPDATE
	const query = `
		INSERT INTO projects (pnumber, ptype, ptitle)
		VALUES (?, ?, ?)
		ON CONFLICT(pnumber) DO UPDATE SET
		pnumber = excluded.pnumber,
		ptype = excluded.ptype,
		ptitle = excluded.ptitle
	`;

	db.run(query, [pnumber, ptype, ptitle], function (err) {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。' });
		}
		res.json({ message: '課題情報が更新されました。' });
	});
});
// }}}

//{{{ app.post('/insertAllocation', (req, res) => {
app.post('/insertAllocation', (req, res) => {
	const { projectNumber, distributedCampus, distributedLocation, installedCampus, installedLocation, PI } = req.body;
	let { CI } = req.body;

	// CIがnullの場合、デフォルト値を設定
	if (!CI) {
		CI = 'NONE'; // あるいは他の適切なデフォルト値
	}

	const query = `
		INSERT INTO allocations (pnumber, PI, CI, distributed_campus, distributed_location, installed_campus, installed_location)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(pnumber, PI, CI) DO NOTHING;
	`;

	db.run(query, [projectNumber, PI, CI, distributedCampus, distributedLocation, installedCampus, installedLocation], function (err) {
		if (err) {
			console.error('iA: DB error:', err);
			return res.status(500).json({ error: 'iA: DB error' });
		}
		if (this.changes === 0) {
			  console.log(`iA: record skipped: pnumber=${projectNumber}, PI=${PI}, CI=${CI}`);
			return res.status(409).json({ message: 'iA: Insersion Skipped.' });
		}
		res.json({ message: 'iA: record inserted' });
	});
});
//}}}

// {{{ app.post('/updateAllocation', (req, res) => {
app.post('/updateAllocation', (req, res) => {
	console.log("updateAllocation API called with query parameters:", req.body);

	const { projectNumber, PI, CI, distributedCampus, distributedLocation, installedCampus, installedLocation } = req.body;

	if (!projectNumber || !PI || !distributedCampus || !installedCampus) {
		return res.status(400).json({ error: '必須項目が不足しています。' });
		console.log("updateAllocation API called with query parameters:", req.body);
	}

	let checkQuery;
	let checkParams;

	// CI の値に応じて異なるクエリを生成
	if (CI === null) {
		checkQuery = `SELECT pnumber FROM allocations WHERE pnumber = ? AND PI = ? AND CI IS NULL;`;
		checkParams = [projectNumber, PI];
	} else {
		checkQuery = `SELECT pnumber FROM allocations WHERE pnumber = ? AND PI = ? AND CI = ?;`;
		checkParams = [projectNumber, PI, CI];
	}

	db.all(checkQuery, checkParams, (err, rows) => {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。' });
		}

		if (rows.length > 0) {
			// 既存データがある場合は更新
			let updateQuery;
			let updateParams;

			if (CI === null) {
				updateQuery = `
					UPDATE allocations
					SET distributed_campus = ?,
						distributed_location = ?,
						installed_campus = ?,
						installed_location = ?
					WHERE pnumber = ? AND PI = ? AND CI IS NULL;
				`;
				updateParams = [distributedCampus, distributedLocation, installedCampus, installedLocation, projectNumber, PI];
			} else {
				updateQuery = `
					UPDATE allocations
					SET distributed_campus = ?,
						distributed_location = ?,
						installed_campus = ?,
						installed_location = ?
					WHERE pnumber = ? AND PI = ? AND CI = ?;
				`;
				updateParams = [distributedCampus, distributedLocation, installedCampus, installedLocation, projectNumber, PI, CI];
			}

			db.run(updateQuery, updateParams, function (err) {
				if (err) {
					console.error('データベースエラー:', err);
					return res.status(500).json({ error: 'データベースエラーが発生しました。' });
				}
				console.log(`allocations テーブルを更新しました: pnumber=${projectNumber}, PI=${PI}, CI=${CI}`);
				res.json({ message: '課題割り当て情報が更新されました。' });
			});

		} else {
			// データが存在しない場合は新規挿入
			const insertQuery = `
				INSERT INTO allocations (pnumber, PI, CI, distributed_campus, distributed_location, installed_campus, installed_location)
				VALUES (?, ?, ?, ?, ?, ?, ?);
			`;

			db.run(insertQuery, [projectNumber, PI, CI, distributedCampus, distributedLocation, installedCampus, installedLocation], function (err) {
				if (err) {
					console.error('データベースエラー:', err);
					return res.status(500).json({ error: 'データベースエラーが発生しました。' });
				}
				console.log(`allocations テーブルに新規挿入しました: pnumber=${projectNumber}, PI=${PI}, CI=${CI}`);
				res.json({ message: '課題割り当て情報が追加されました。' });
			});
		}
	});
});
// }}}

// {{{ app.post('/updateResearcher', (req, res) => {
app.post('/updateResearcher', (req, res) => {
	const { researcherNumber, researcherName } = req.body;

	if (!researcherNumber || !researcherName) {
		return res.status(400).json({ error: '研究者番号と氏名を入力してください。' });
	}

	const query = `
		INSERT INTO researchers (rnumber, rname)
		VALUES (?, ?)
		ON CONFLICT(rnumber) DO UPDATE SET
		rname = excluded.rname
	`;

	db.run(query, [researcherNumber, researcherName], function (err) {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。' });
		}
		res.json({ message: '研究者情報が更新されました。' });
	});
});
// }}}

// {{{ app.get('/allocations:get:pnumber', (req, res) => {
app.get('/allocations:get:pnumber', (req, res) => {
	//allocations:get:pnumber?rnumber=研究者番号
	//allocationsテーブルから研究者番号に対応する課題番号を取得
	//output: { 課題番号: [課題番号1, 課題番号2, ...] }
	const rnumber = req.query.rnumber;

	if (!rnumber) {
		return res.status(400).json({ error: '研究者番号が指定されていません。'});
	}

	const query = `
		SELECT DISTINCT pnumber FROM allocations
		WHERE PI = ? OR CI = ?;
	`;

	db.all(query, [rnumber, rnumber], (err, rows) => {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。'});
		}

		if (rows.length > 0) {
			const pnumber = rows.map(row => row.pnumber);
			console.log(`allocatos:get-検索結果: ${JSON.stringify(pnumber)}`);
			// 返り値の形式は { pnumbers: [課題番号1, 課題番号2, ...] }
			res.json({ pnumbers: pnumber });
		} else {
			console.error(`該当する課題番号が見つかりませんでした: 研究者番号=${researcherNumber}`);
			res.status(404).json({ error: '該当する課題番号が見つかりませんでした。' });
		}
	});
});
// }}}

//{{{ app.get('/allocations/get', (req, res) => {
app.get('/allocations/get', (req, res) => {
	//allocations:get?pnumber=課題番号
	//allocationsテーブルから課題番号に対応する他の情報を取得
	const pnumber = req.query.pnumber;

	if (!pnumber) {
		console.error("エラー: 課題番号が指定されていません。");
		return res.status(400).json({ error: '課題番号を指定してください。' });
	}

	const query = `
		SELECT
			PI,
			CI,
			distributed_campus AS 納品キャンパス,
			distributed_location AS 納品先,
			installed_campus AS 設置キャンパス,
			installed_location AS 設置先
		FROM allocations WHERE pnumber = ?
	`;

	db.get(query, [pnumber], (err, row) => {
		if (err) {
			console.error('allocations:get;データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。'});
		}

		if (row) {
			console.log(`allocations:get;課題情報取得成功: ${JSON.stringify(row)}`);
			res.json(row);
		} else {
			console.error(`allocation:get;課題情報が見つかりません: 課題番号=${pnumber}`);
			res.status(404).json({ error: 'DB未登録' });
		}
	});
});
// }}}

// {{{ app.get('/researchers:get:rname', (req, res) => {
app.get('/researchers:get:rname', (req, res) => {
	//researchers:get:rname?rnumber=研究者番号
	//researchersテーブルから研究者氏名を取得
	//output: { 研究者: 研究者氏名 }
	const rnumber = req.query.rnumber;

	// 研究者番号が指定されていない場合はエラー
	if (!rnumber) {
		return res.status(400).json({ error: '研究者番号を指定してください。' });
	}

	const query = `SELECT rname FROM researchers WHERE rnumber = ?`;

	db.get(query, [rnumber], (err, row) => {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。' });
		}

		if (row) {
			console.log(`研究者情報取得成功: ${JSON.stringify(row)}`);
			res.json({ 研究者: row.rname });
		} else {
			console.error(`研究者情報が見つかりません: 研究者番号=${rnumber}`);
			res.json({ 研究者: 'DB未登録' });
		}
	});
});
// }}}

//{{{ app.get('/researchers/get/rnumber', (req, res) => {
app.get('/researchers/get/rnumber', (req, res) => {
	//researchers/get/rnumber?rname=研究者氏名
	//でresearchersテーブルから研究者番号を取得
	const name = req.query.rname;

	// nameが空か空白の場合はエラー
	if (!name || name.trim() === "") {
		return res.status(400).json({ error: '研究者氏名を入力してください。' });
	}

	// query = `SELECT rnumber FROM researchers WHERE rname = ?`;
	// 同姓同名は考慮しない
	const query = `SELECT rnumber FROM researchers WHERE rname LIKE ?`;

	// 検索
	db.get(query, [name], (err, row) => {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。' });
		}

		if (row) {
			console.log(`研究者情報取得成功: ${JSON.stringify(row)}`);
			res.json({ rnumber: row.rnumber });
		} else {
			console.error(`研究者情報が見つかりません: 研究者氏名=${name}`);
			res.json({ rnumber: 'DB未登録' });
		}
	});
});
// }}}

// {{{ app.get('/projects:get', (req, res) => {
app.get('/projects:get', (req, res) => {
	//projects:get?pnumber=課題番号
	//projectsテーブルから課題番号に対応する他の情報を取得
	const pnumber = req.query.pnumber;

	if (!pnumber) {
		return res.status(400).json({ error: '課題番号を指定してください。' });
	}

	const query = `
		SELECT ptype AS 課題種別, ptitle AS 課題名
		FROM projects WHERE pnumber = ?
	`;

	db.get(query, [pnumber], (err, row) => {
		if (err) {
			console.error('データベースエラー:', err);
			return res.status(500).json({ error: 'データベースエラーが発生しました。'});
		}

		if (row) {
			console.log(`課題情報取得成功: ${JSON.stringify(row)}`);
			res.json(row);
		} else {
			console.error(`課題情報が見つかりません: 課題番号=${pnumber}`);
			res.status(404).json({ error: 'DB未登録' });
		}
	});
});
// }}}

//{{{ app.get('/searchResearcherNumber', async (req, res) => {
app.get('/searchResearcherNumber', async (req, res) => {
	let name = req.query.name;
	if (!name || name.trim() === "") {
		return res.status(400).json({ error: '研究者氏名を入力してください。' });
	}

	name = name.replace(/\s+/g, ""); // 空白を削除
	const apiUrl = `https://nrid.nii.ac.jp/opensearch/?format=json&qg=${encodeURIComponent(name)}&appid=${process.env.KAKENAPI}`;

	try {
		const response = await axios.get(apiUrl);
		const data = response.data;

		if (!data || !data.totalResults) {
			return res.json({ message: '検索結果なし', personIds: [] });
		}

		const totalResults = data.totalResults;
		const researcherIds = data.researchers.map(r => r["id:person:erad"]);

		let processedCount = 0;
		researcherIds.forEach(personId => {
			if (Array.isArray(personId)) {
				personId = personId[0];
			}
			personId = personId.toString();

			db.get(`SELECT rnumber FROM researchers WHERE rnumber = ?`, [personId], (err, row) => {
				if (err) {
					console.error('DBエラー:', err);
					return;
				}
				if (!row) {
					db.run(`INSERT INTO researchers (rnumber, rname) VALUES (?, ?)`, [personId, name], (insertErr) => {
						if (insertErr) {
							console.error('DB挿入エラー:', insertErr);
						} else {
							console.log(`新しい研究者番号を追加: rnumber=${personId}, rname=${name}`);
						}
					});
				}
				processedCount++;
				if (processedCount === researcherIds.length) {
					res.json({ totalResults, researcherIds });
				}
			});
		});
	} catch (error) {
		console.error('APIエラー:', error);
		res.status(500).json({ error: 'API取得エラーが発生しました。' });
	}
});
// }}}

//{{{ app.post("/searchProject", async (req, res) => {
app.get("/searchProject", async (req, res) => {
	try {
		console.log("searchProject API called with query parameters:", req.query);
		const rnumber = req.query.rnumber;

		if (!rnumber) {
			return res.status(400).json({ error: "a研究者番号が必要です" });
		}

		// KAKEN API へのリクエスト
		const kakenApiUrl = `https://kaken.nii.ac.jp/opensearch/?format=xml&qm=${encodeURIComponent(rnumber)}&c1=granted&appid=${process.env.KAKENAPI}`;

		const response = await axios.get(kakenApiUrl);
		if (response.status !== 200) {
			throw new Error(`KAKEN API エラー: ${response.status} ${response.statusText}`);
		}

		const xmlData = response.data;

		if (!xmlData || xmlData.trim() === "") {
			throw new Error("KAKEN API からのレスポンスが空です");
		}

		// XML を JSON に変換
		const parser = new XMLParser({ ignoreAttributes: false });
		const jsonData = parser.parse(xmlData);

		// gratnsは grantAwards タグの中にある
		const grants = jsonData?.grantAwards?.grantAward;
		if (!grants) {
			return res.status(404).json({ error: "該当する課題番号が見つかりませんでした" });
		}

		let projects = [];

		// 各 grantAward タグを処理
		const processGrant = (grant) => {
			const awardNumber = grant["@_awardNumber"] || "不明";
			const summary = Array.isArray(grant?.summary) ? grant.summary[0] : grant?.summary || {};
			const title = summary?.title || "タイトルなし";

			// `category` の `#text` を取得
			const category = typeof summary?.category === "object" ? summary.category["#text"] || "カテゴリーなし" : summary?.category || "カテゴリーなし";

			// `researcherId` の `#text` を取得
			const member = Array.isArray(summary?.member) ? summary.member[0] : summary?.member || {};
			const researcherId = typeof member?.enriched?.researcherNumber === "object" ? member.enriched.researcherNumber["#text"] || "不明" : member?.enriched?.researcherNumber || "不明";
			const researcherName = member?.personalName?.fullName || "不明";

			// プロジェクト情報を配列に追加
			projects.push({
				awardNumber,
				title,
				category,
				researcherId,
				researcherName
			});
		};

		// grants が配列かどうかで処理を分岐
		if (Array.isArray(grants)) {
			// 各 grantAward タグを処理
			grants.forEach(processGrant);
		} else {
			processGrant(grants);
		}

		if (projects.length === 0) {
			return res.status(404).json({ error: "課題番号が見つかりませんでした" });
		}

		res.json({ projects });

	} catch (error) {
		console.error("サーバーエラー:", error);
		res.status(500).json({ error: error.message });
	}
});
//}}}

//{{{ app.post('/api/extract-json', upload.single('pdf'), async (req, res) => {
app.post('/api/extract-json', upload.single('pdf'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No PDF file uploaded.' });
		}

		if (!process.env.GEMINI) {
			return res.status(500).json({ error: 'Missing GEMINI API key.' });
		}

		// PDFをBase64に変換
		const pdfBase64 = req.file.buffer.toString('base64');

		// Gemini APIにリクエスト
		const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				"contents": [
					{
						"parts": [
							{
								"text": "領収書または納品書の情報を解析し、購入項目ごとに以下の形式でJSONに構造化してください。ただし、以下の処理を施してください。\n+ 金額の部分はカンマがあれば除いてください\n+ 金額が0の項目は無視してください\n\n{ \"title\": \"領収書タイトル\", \"issuer\": \"発行者情報\", \"receiver_group\": \"受領者所属\", \"receiver_name\": \"受領者氏名(敬称、空白は除く)\", \"total_amount\": \"合計金額\", \"payment_date\": \"支払日\", \"items\": [ { \"product_name\": \"製品名(型番は抜く)\", \"provider\": \"メーカー\", \"model\": \"型番\", \"unite_price\": \"単価\", \"total_price\": \"金額\", \"number\": \"個数\", \"delivery_date\": \"発送日\" } ] }"
							},
							{
								"inlineData": {
									"mimeType": "application/pdf",
									"data": pdfBase64
								}
							}
						]
					}
				]
			})
		});

		const jsonResponse = await response.json();
		if (!response.ok) {
			console.error('Gemini API error:', jsonResponse);
			return res.status(500).json({ error: 'Failed to process PDF' });
		}

		// JSON部分の抽出
		const extractedText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
		const extractedJsonMatch = extractedText.match(/```json\n([\s\S]+?)\n```/);
		const extractedJson = extractedJsonMatch ? JSON.parse(extractedJsonMatch[1]) : {};

		res.json(extractedJson);

	} catch (error) {
		console.error('Error in PDF JSON extraction:', error);
		res.status(500).json({ error: 'Internal server error while extracting JSON from PDF' });
	}
});
//}}}

// サーバー起動
app.listen(port, () => {
	console.log(`サーバーが http://localhost:${port} で起動しました`);
});

