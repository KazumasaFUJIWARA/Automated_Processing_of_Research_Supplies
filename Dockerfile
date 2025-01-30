# ビルドステージ
FROM node:18 AS builder

WORKDIR /usr/src/app

# パッケージファイルのみをコピーして依存関係をインストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# 本番ステージ
FROM node:18-slim

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

USER nodejs

EXPOSE 3000

CMD ["node", "server/server.js"]
