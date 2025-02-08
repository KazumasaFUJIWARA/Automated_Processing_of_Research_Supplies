# プロジェクトルート直下の Dockerfile
FROM python:3.9-slim

# 作業ディレクトリを /app に設定
WORKDIR /app

# backend と public ディレクトリのみをコピー
COPY ./backend/ ./backend/
COPY ./public/ ./public/

# Python の依存パッケージをインストール
# (backend/requirements.txt を使用)
WORKDIR /app/backend
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# コンテナ外部に公開するポート番号（FastAPI アプリ用）
EXPOSE 8000

# コンテナ起動時に FastAPI アプリを Uvicorn で実行
# ※ FastAPI アプリは backend/main.py 内の app と仮定
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
