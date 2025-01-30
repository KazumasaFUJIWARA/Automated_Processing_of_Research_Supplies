# ビルドステージ
FROM node:18-slim AS builder

WORKDIR /usr/src/app

# パッケージファイルのみをコピーして依存関係をインストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# 本番ステージ
FROM node:18-slim

# ヘルスチェック用のcurlをインストール
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# ビルドステージから必要なファイルのみをコピー
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/server ./server
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package*.json ./

# アプリケーションユーザーを作成
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# SQLiteデータベースのためのディレクトリを作成し、適切なパーミッションを設定
RUN mkdir -p /usr/src/app/data && \
    chown -R nodejs:nodejs /usr/src/app/data && \
    chmod 755 /usr/src/app/data && \
    chown -R nodejs:nodejs /usr/src/app

# アップロードディレクトリを作成
RUN mkdir -p /usr/src/app/uploads && \
    chown -R nodejs:nodejs /usr/src/app/uploads && \
    chmod 755 /usr/src/app/uploads

USER nodejs

EXPOSE 3000

CMD ["node", "server/server.js"]
