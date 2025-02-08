from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import os
import logging

app = FastAPI()

# ロギングの設定
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info("Start FastAPI")

# 静的ファイルを "/static" にマウント
app.mount("/static", StaticFiles(directory="/app/public"), name="static")

# ルートパス "/" で index.html を返す
@app.get("/")
async def read_index():
	return FileResponse("/app/public/index.html")

#{{{ API エンドポイント（静的ファイルと衝突しない）
@app.get("/api/hello")
async def hello():
	return {"message": "Hello, World!"}
#}}}

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

#{{{ response
#{{{ AllocationResponse
class AllocationResponse(BaseModel):
	PI: str
	CI: str
	delivered_campus: str
	delivered_location: str
	installed_campus: str
	installed_location: str
#}}}

#{{{ ProjectResponse
class ProjectResponse(BaseModel):
	ptype: str
	ptitle: str
#}}}
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
		raise HTTPException(status_code=404, detail="指定された課題番号のデータは存在しません")
#}}}

#{{{ @app.get("/api/projects/{project_number}/allocations", response_model=AllocationResponse)
@app.get("/api/projects/{project_number}/allocations", response_model=AllocationResponse)
async def get_allocation(project_number: str):
	logger.info(f"課題番号: {project_number} のアロケーション情報を取得します")
	"""
	指定された課題番号 (project_number) に対応する allocations テーブルの情報を取得
	"""
	conn = get_db_connection()
	cursor = conn.cursor()
	query = """
		SELECT
			PI,
			CI,
			distributed_campus AS delivered_campus,
			distributed_location AS delivered_location,
			installed_campus AS installed_campus,
			installed_location AS installed_location
		FROM allocations WHERE pnumber = ?
	"""
	cursor.execute(query, (project_number,))
	row = cursor.fetchone()
	conn.close()

	if row:
		return AllocationResponse(
			PI=row["PI"],
			CI=row["CI"],
			delivered_campus=row["delivered_campus"],
			delivered_location=row["delivered_location"],
			installed_campus=row["installed_campus"],
			installed_location=row["installed_location"]
		)
	else:
		raise HTTPException(status_code=404, detail="指定された課題番号のデータは存在しません")
#}}}
