#/api/projects/{project_number}/{researcher_number}/allocations

# {{{ import
from fastapi import FastAPI, HTTPException, Path, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import os
import logging
import httpx
from xml.etree import ElementTree as ET
import base64
import json
import re
# }}}

app = FastAPI()

#{{{ ロギングの設定
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info("Start FastAPI")
#}}}

# 静的ファイルを "/static" にマウント
app.mount("/static", StaticFiles(directory="/app/public"), name="static")

# ルートパス "/" で index.html を返す
@app.get("/")
async def read_index():
	return FileResponse("/app/public/index.html")

#{{{ # データベース接続
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "db/aprs.db")

def get_db_connection():
	""" データベース接続を確立 """
	if not os.path.exists(DATABASE):
		logger.error(f"Nonexist: {DATABASE}")
		raise FileNotFoundError(f"Not exist: {DATABASE}")

	try:
		logger.info(f"Open Database: {DATABASE}")
		conn = sqlite3.connect(DATABASE)
		conn.row_factory = sqlite3.Row
		return conn
	except sqlite3.Error as e:
		logger.error(f"DB Error: {e}")
		raise HTTPException(status_code=500, detail="データベースに接続できませんでした")
#}}}

#{{{ schemas
#{{{ class AllocationResponse(BaseModel):
class AllocationResponse(BaseModel):
	PI: str
	CI: str
	deliveredCampus: str
	deliveredLocation: str
	installedCampus: str
	installedLocation: str
#}}}

#{{{ class AllocationCreateRequest(BaseModel):
class AllocationCreateRequest(BaseModel):
	projectNumber: str
	PI: str
	CI: str
	deliveredCampus: str
	deliveredLocation: str
	installedCampus: str
	installedLocation: str
#}}}

#{{{ class AllocationUpdateRequest(BaseModel):
class AllocationUpdateRequest(BaseModel):
	PI: str
	CI: str
	deliveredCampus: str
	deliveredLocation: str
	installedCampus: str
	installedLocation: str
#}}}

#{{{ class ProjectResponse(BaseModel):
class ProjectResponse(BaseModel):
	ptype: str
	ptitle: str
#}}}

#{{{ class ProjectCreateRequest(BaseModel):
class ProjectCreateRequest(BaseModel):
	projectNumber: str
	projectType: str
	projectTitle: str
#}}}

#{{{ class ProjectUpdateRequest(BaseModel):
class ProjectUpdateRequest(BaseModel):
	projectType: str
	projectTitle: str
#}}}

#{{{ class ResearcherCreateRequest(BaseModel)
class ResearcherCreateRequest(BaseModel):
	researcherNumber: str
	researcherName: str
#}}}

#{{{ class ResearcherUpdateRequest(BaseModel)
class ResearcherUpdateRequest(BaseModel):
	researcherName: str
#}}}
#}}}

#{{{ @app.post("/api/researchers/")
@app.post("/api/researchers/")
async def create_researcher(request: ResearcherCreateRequest):
	"""
	研究者を新規作成するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		# 新規挿入
		query = """
			INSERT INTO researchers (rnumber, rname)
			VALUES (?, ?)
		"""
		cursor.execute(query, (request.researcherNumber, request.researcherName))
		conn.commit()
		return {"message": "研究者情報が追加されました。"}
	
	except sqlite3.IntegrityError as e:
		raise HTTPException(status_code=409, detail=f"🚫 {e}")

	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail=f"❎ {e}")

	finally:
		conn.close()
#}}}

#{{{ @app.get("/api/researchers/{researcher_number}")
@app.get("/api/researchers/{researcher_number}")
async def get_researcher_name(researcher_number: str):
	"""
	研究者番号をもとに研究者名を取得するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		cursor.execute("SELECT rname FROM researchers WHERE rnumber = ?", (researcher_number,))
		row = cursor.fetchone()
		if row:
			return {"研究者名": row["rname"]}
		else:
			raise HTTPException(status_code=404, detail=f"🚫 未登録研究者番号: {researcher_number}")
	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail=f"❎ {str(e)}")
	finally:
		conn.close()
#}}}

#{{{ @app.put("/api/researchers/{researcher_number}/")
@app.put("/api/researchers/{researcher_number}/")
async def update_researcher(researcher_number: str, request: ResearcherUpdateRequest):
	"""
	指定した研究者の情報を更新するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		# 既存データの確認
		cursor.execute("SELECT rnumber FROM researchers WHERE rnumber = ?", (researcher_number,))
		row = cursor.fetchone()

		if not row:
			raise HTTPException(status_code=404, detail="指定された研究者番号のデータは存在しません")

		# データ更新
		query = """
			UPDATE researchers
			SET rname = ?
			WHERE rnumber = ?
		"""
		cursor.execute(query, (request.researcherName, researcher_number))
		conn.commit()

		return {"message": "研究者情報が更新されました。"}

	except sqlite3.IntegrityError as e:
		raise HTTPException(status_code=409, detail="🚫 {e}")

	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail="❎ {e}")

	finally:
		conn.close()
#}}}

#{{{ @app.get("/api/researchers/by-name/{researcher_name}")
@app.get("/api/researchers/by-name/{researcher_name}")
async def get_researcher_number(researcher_name: str):
	"""
	研究者名をもとにローカルDBから研究番号を取得するエンドポイント
	ローカルDBでは, 同姓同名は想定していない.
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		cursor.execute("SELECT rnumber FROM researchers WHERE rname = ?", (researcher_name,))
		row = cursor.fetchone()
		if row:
			return {"研究者番号": row["rnumber"]}
		else:
			raise HTTPException(status_code=404, detail=f"🚫 未登録研究者名: {researcher_name}")
	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail=f"❎ {e}")
	finally:
		conn.close()
#}}}

#{{{ @app.get("/api/researchers/kaken/by-name/{researcher_name}")
@app.get("/api/researchers/kaken/by-name/{researcher_name}")
async def search_researcher_number(researcher_name: str):
	"""
	研究者名からKAKENのAPIを利用して研究者番号を検索し、DBに登録する
	出力は{"researcher_number": row["rnumber"] }の形式
	同姓同名を想定し, 研究者番号はリストで返す
	"""

	# 空白削除
	rname = researcher_name.replace(" ", "")

	# 環境変数 KAKEN の取得
	kaken_api_key = os.getenv("KAKEN")
	logger.info(f"KAKEN API KEY: {kaken_api_key}")
	if not kaken_api_key:
		raise HTTPException(status_code=500, detail="❎ 環境変数 KAKEN が設定されていません")

	# KAKEN API のURL
	api_url = f"https://nrid.nii.ac.jp/opensearch/?format=json&qg={rname}&appid={kaken_api_key}"

	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(api_url)
			response.raise_for_status()
			data = response.json()

		if not data.get("researchers"):
			raise HTTPException(
				status_code=404,
				detail=f"🚫 KAKEN未登録研究者名: {researcher_name}"
			)

		# 二重リストをフラット化
		rnumbers = [
			r["id:person:erad"][0] if isinstance(r["id:person:erad"], list) else r["id:person:erad"]
			for r in data.get("researchers", [])
		]

		return {"researcher_number": rnumbers}

	except httpx.HTTPError as http_err:
		raise HTTPException(status_code=500, detail=f"❎ {http_err}")
#}}}

#{{{ @app.post("/api/projects/")
@app.post("/api/projects/")
async def create_project(request: ProjectCreateRequest):
	"""
	新しいプロジェクトを作成するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		# 新規挿入
		query = """
			INSERT INTO projects (pnumber, ptype, ptitle)
			VALUES (?, ?, ?)
		"""
		cursor.execute(query, (request.projectNumber, request.projectType, request.projectTitle))
		conn.commit()

		logger.info(f"projects テーブルに新規挿入しました: pnumber={request.projectNumber}")
		return {"message": "{request.projectNumber} を追加しました。"}

	except sqlite3.IntegrityError as e:
		# eを409で表示
		raise HTTPException(status_code=409, detail="🚫 {e}")

	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail="❎ {e}")

	finally:
		conn.close()
#}}}

#{{{ @app.post("/api/projects/allocations/")
@app.post("/api/projects/allocations/")
async def create_project(request: AllocationCreateRequest):
	"""
	新しいプロジェクトを作成するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		# 新規挿入
		query = """
			INSERT INTO allocations (pnumber, PI, CI, distributed_campus, distributed_location, installed_campus, installed_location)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		"""
		cursor.execute(query, (
			request.projectNumber,
			request.PI,
			request.CI,
			request.deliveredCampus,
			request.deliveredLocation,
			request.installedCampus,
			request.installedLocation
		))
		conn.commit()
		return {"message": "アロケーション情報が追加されました。"}
	except sqlite3.IntegrityError as e:
		raise HTTPException(status_code=409, detail="🚫 {e}")
	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail="❎ {e}")
	finally:
		conn.close()
#}}}

#{{{ @app.get("/api/projects/{project_number}", response_model=ProjectResponse)
@app.get("/api/projects/{project_number}", response_model=ProjectResponse)
async def get_project(project_number: str):
	logger.info(f"課題番号: {project_number} の情報を取得します")

	conn = get_db_connection()
	cursor = conn.cursor()
	query = """
		SELECT
			ptype,
			ptitle
		FROM projects WHERE pnumber = ?
	"""
	cursor.execute(query, (project_number,))
	row = cursor.fetchone()
	conn.close()

	if row:
		return ProjectResponse(
			ptype=row["ptype"],
			ptitle=row["ptitle"]
		)
	else:
		# project_number が見つからないことを示すエラーを返す
		raise HTTPException(
			status_code=404,
			detail=f"🚫 未登録課題番号: {project_number}"
		)
#}}}

#{{{ @app.put("/api/projects/{project_number}/")
@app.put("/api/projects/{project_number}/")
async def update_project(project_number: str, request: ProjectUpdateRequest):
	"""
	指定したプロジェクトを更新するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		# 既存データの確認
		cursor.execute("SELECT pnumber FROM projects WHERE pnumber = ?", (project_number,))
		row = cursor.fetchone()

		if not row:
			raise HTTPException(
				status_code=404,
				detail=f"🚫 未登録課題番号: {project_number}"
			)

		# データ更新
		query = """
			UPDATE projects
			SET ptype = ?, ptitle = ?
			WHERE pnumber = ?
		"""
		cursor.execute(query, (request.projectType, request.projectTitle, project_number))
		conn.commit()

		return {"✅": "課題情報が更新されました。"}

	except sqlite3.Error as e:
		raise HTTPException(
			status_code=500,
			detail=f"❎ {e}"
		)

	finally:
		conn.close()
#}}}

#{{{ @app.get("/api/projects/{project_number}/{researcher_number}/allocations", response_model=AllocationResponse)
@app.get("/api/projects/{project_number}/{researcher_number}/allocations", response_model=AllocationResponse)
async def get_allocation(project_number: str, researcher_number: str):
	"""
	指定された課題番号 (project_number) と研究者番号 (researcher_number) に対応する
	研究課題の配置情報を取得
	"""

	conn = get_db_connection()
	cursor = conn.cursor()
	# pnumber = project_number かつ
	# PI = researcher_number または CI = researcher_number のデータを取得
	query = """
		SELECT
			PI,
			CI,
			distributed_campus AS delivered_campus,
			distributed_location AS delivered_location,
			installed_campus AS installed_campus,
			installed_location AS installed_location
		FROM allocations WHERE pnumber = ? AND (PI = ? OR CI = ?)
	"""
	cursor.execute(query, (project_number, researcher_number, researcher_number))
	row = cursor.fetchone()
	conn.close()

	if row:
		return AllocationResponse(
			PI=row["PI"],
			CI=row["CI"],
			# Null の場合は空文字列を返す
			deliveredCampus=row["delivered_campus"] or "",
			deliveredLocation=row["delivered_location"] or "",
			installedCampus=row["installed_campus"] or "",
			installedLocation=row["installed_location"] or ""
		)
	else:
		raise HTTPException(
			status_code=404,
			detail=f"❎ 未登録キー: {project_number}, {researcher_number}"
		)
#}}}

#{{{ @app.put("/api/projects/{project_number}/allocations/")
@app.put("/api/projects/{project_number}/allocations/")
async def update_allocation(project_number: str, request: AllocationUpdateRequest):
	"""
	指定した課題の配置情報を更新するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		# 既存データの確認
		# キーは pnumber, PI, CI の組み合わせ
		cursor.execute("SELECT pnumber FROM allocations WHERE pnumber = ? AND PI = ? AND CI = ?", (project_number, request.PI, request.CI))
		row = cursor.fetchone()

		if not row:
			raise HTTPException(
				status_code=404,
				detail=f"❎ 未登録キー: {project_number}, {request.PI}, {request.CI}"
		)

		# データ更新
		query = """
			UPDATE allocations
			SET distributed_campus = ?, distributed_location = ?, installed_campus = ?, installed_location = ?
			WHERE pnumber = ? AND PI = ? AND CI = ?
		"""
		cursor.execute(query, (
			request.deliveredCampus,
			request.deliveredLocation,
			request.installedCampus,
			request.installedLocation,
			project_number,
			request.PI,
			request.CI
		))
		conn.commit()

		return {"✅": "課題情報が更新されました。"}

	except sqlite3.Error as e:
		raise HTTPException(status_code=500, detail=f"❎ {e}")

	finally:
		conn.close()
#}}}

#  {{{ @app.get("/api/projects/{researcher_number}/project_numbers")
@app.get("/api/projects/{researcher_number}/project_numbers")
async def get_project_numbers(researcher_number: str):
	"""
	研究者番号 (researcher_number) をもとに対応する課題番号のリストを取得するエンドポイント
	"""
	conn = get_db_connection()
	cursor = conn.cursor()

	try:
		cursor.execute("""
			SELECT DISTINCT pnumber FROM allocations
			WHERE PI = ? OR CI = ?
		""", (researcher_number, researcher_number))

		rows = cursor.fetchall()

		if rows:
			pnumber_list = [row["pnumber"] for row in rows]
			return {"project_number": pnumber_list}
		else:
			raise HTTPException(
				status_code=404,
				detail=f"🚫 未登録研究者番号: {researcher_number}"
			)

	except sqlite3.Error as e:
		raise HTTPException(
			status_code=500,
			detail=f"❎ {e}"
		)

	finally:
		conn.close()
#}}}

#{{{ @app.get("/api/projects/kaken/{research_number}")
@app.get("/api/projects/kaken/{research_number}")
async def search_project_kaken(research_number: str):
	"""
	KAKEN API を利用して研究者の課題情報を取得
	"""

	# 環境変数 KAKEN を取得
	kaken_api_key = os.getenv("KAKEN")
	if not kaken_api_key:
		raise HTTPException(status_code=500, detail="環境変数 KAKEN が設定されていません")

	# KAKEN API のURL
	kaken_api_url = f"https://kaken.nii.ac.jp/opensearch/?format=xml&qm={research_number}&c1=granted&appid={kaken_api_key}"

	try:
		async with httpx.AsyncClient() as client:
			response = await client.get(kaken_api_url)
			response.raise_for_status()
			xml_data = response.text

		if not xml_data.strip():
			raise HTTPException(
				status_code=500,
				detail="KAKEN API からのレスポンスが空です"
			)

		# XML をパース
		root = ET.fromstring(xml_data)

		# `grantAward` タグを取得
		grant_awards = root.findall(".//grantAward")
		if not grant_awards:
			raise HTTPException(status_code=404, detail=f"KAKEN未登録研究者番号: {research_number}")

		projects = []

		for grant in grant_awards:
			award_number = grant.get("awardNumber", "不明")

			summary = grant.find("summary")
			title = summary.findtext("title") if summary is not None else "タイトルなし"
			category = summary.findtext("category") if summary is not None else "カテゴリーなし"

			member = summary.find("member") if summary is not None else None
			researcher_id = member.findtext("enriched/researcherNumber") if member is not None else "不明"
			researcher_name = member.findtext("personalName/fullName") if member is not None else "不明"

			projects.append({
				"awardNumber": award_number,
				"title": title,
				"category": category,
				"researcherId": researcher_id,
				"researcherName": researcher_name
			})

		if not projects:
			raise HTTPException(status_code=404, detail="課題番号が見つかりませんでした")

		return {"projects": projects}

	except httpx.HTTPError as http_err:
		raise HTTPException(status_code=500, detail=f"❎ {str(http_err)}")
	except ET.ParseError:
		raise HTTPException(status_code=500, detail="❎ KAKEN API の XML レスポンスを解析できませんでした")
	except Exception as err:
		raise HTTPException(status_code=500, detail=f"🖥️ Server Error {str(err)}")
#}}}

#{{{ @app.post("/api/pdf2json/")
@app.post("/api/pdf2json/")
async def extract_json_from_pdf(pdf: UploadFile = File(...)):
	"""
	PDF をアップロードして JSON データを抽出するエンドポイント
	"""
	try:
		GEMINI_API_KEY = os.getenv("GEMINI")
		if not GEMINI_API_KEY:
			raise HTTPException(status_code=500, detail="Missing GEMINI API key.")

		# PDFデータを Base64 に変換
		pdf_data = await pdf.read()
		pdf_base64 = base64.b64encode(pdf_data).decode("utf-8")

		# Gemini API にリクエスト
		payload = {
			"contents": [
				{
					"parts": [
						{
							"text": "領収書または納品書の情報を解析し、購入項目ごとに以下の形式でJSONに構造化してください。ただし、以下の処理を施してください。\n"
									"+ 金額の部分はカンマがあれば除いてください\n"
									"+ 金額が0の項目は無視してください\n\n"
									"{ \"title\": \"領収書タイトル\", \"issuer\": \"発行者情報\", \"receiver_group\": \"受領者所属\", \"receiver_name\": \"受領者氏名(敬称、空白は除く)\", \"total_amount\": \"合計金額\", \"payment_date\": \"支払日\", \"items\": [ { \"product_name\": \"製品名(型番は抜く)\", \"provider\": \"メーカー\", \"model\": \"型番\", \"unite_price\": \"単価\", \"total_price\": \"金額\", \"number\": \"個数\", \"delivery_date\": \"発送日\" } ] }"
						},
						{
							"inlineData": {
								"mimeType": "application/pdf",
								"data": pdf_base64
							}
						}
					]
				}
			]
		}

		async with httpx.AsyncClient() as client:
			response = await client.post(
				f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key={GEMINI_API_KEY}",
				headers={"Content-Type": "application/json"},
				json=payload
			)

		json_response = response.json()

		if response.status_code != 200:
			raise HTTPException(status_code=500, detail=f"❎ Gemini API error: {json_response}")

		# JSON部分の抽出
		extracted_text = json_response.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
		extracted_json_match = re.search(r"```json\n([\s\S]+?)\n```", extracted_text)

		extracted_json = json.loads(extracted_json_match.group(1)) if extracted_json_match else {}

		return extracted_json

	except HTTPException as http_err:
		raise HTTPException(status_code=500, detail=f"❎ {str(http_err)}")
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"❎ {e}")
#}}}
