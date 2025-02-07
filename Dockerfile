# Python 3.11 の公式イメージを使用
FROM python:3.11

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコードをコピー
COPY app /app

# コンテナ起動時に FastAPI を起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

