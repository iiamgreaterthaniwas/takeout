#!/bin/bash

# Ubuntu 自动部署环境脚本
# 适用版本: Ubuntu 20.04/22.04

set -e

DB_PASSWORD="Universec0602." # 使用用户提供的密码作为数据库初始密码

echo ">>> 开始安装环境..."

# 1. 更新系统
export DEBIAN_FRONTEND=noninteractive
sudo apt update -y

# 2. 安装基础工具
sudo apt install -y curl git wget build-essential unzip

# 3. 安装 Node.js (使用 NodeSource 20.x)
if ! command -v node &> /dev/null; then
    echo ">>> 安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo ">>> Node.js 已安装: $(node -v)"
fi

# 4. 安装 MySQL
if ! command -v mysql &> /dev/null; then
    echo ">>> 安装 MySQL..."
    sudo apt install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    # 自动设置 root 密码和创建数据库
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';"
    sudo mysql -u root -p"${DB_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS takeout_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    sudo mysql -u root -p"${DB_PASSWORD}" -e "FLUSH PRIVILEGES;"
else
    echo ">>> MySQL 已安装"
fi

# 5. 安装 Redis
if ! command -v redis-server &> /dev/null; then
    echo ">>> 安装 Redis..."
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
else
    echo ">>> Redis 已安装"
fi

# 6. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo ">>> 安装 Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo ">>> Nginx 已安装"
fi

# 7. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo ">>> 安装 PM2..."
    sudo npm install -g pm2
else
    echo ">>> PM2 已安装"
fi

echo ">>> 环境安装完成！"
