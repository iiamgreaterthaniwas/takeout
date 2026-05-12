#!/bin/bash

# 应用部署脚本
set -e

APP_ROOT="/var/www/takeout"
GIT_REPO="https://github.com/iiamgreaterthaniwas/takeout.git"

echo ">>> 进入项目目录..."
if [ ! -d "$APP_ROOT/.git" ]; then
    echo ">>> 克隆代码库..."
    git clone $GIT_REPO $APP_ROOT
    cd $APP_ROOT
else
    echo ">>> 拉取最新代码..."
    cd $APP_ROOT
    git pull origin main
fi

# 1. 部署后端
echo ">>> 部署后端..."
cd server
npm install
cp .env.production .env
npx prisma generate
npm run build
pm2 delete takeout-server || true
pm2 start dist/main.js --name takeout-server

# 1.1 初始化数据库数据
echo ">>> 初始化数据库数据..."
node seed.js

# 2. 部署前端
echo ">>> 部署前端..."
cd ../admin-web
npm install
npm run build
# 复制到 nginx 目录
sudo mkdir -p /var/www/takeout/admin-web
sudo cp -r dist/* /var/www/takeout/admin-web/

# 3. 配置 Nginx
echo ">>> 配置 Nginx..."
sudo cp ../deploy/nginx.conf /etc/nginx/sites-available/takeout
sudo ln -sf /etc/nginx/sites-available/takeout /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo nginx -t && sudo systemctl restart nginx

echo ">>> 部署完成！"
