#!/bin/bash

# 博客自动部署脚本
# 用法: ./deploy.sh

set -e

echo "🚀 开始部署博客..."

# 1. 构建静态文件
echo "📦 构建静态文件..."
npm run build

# 2. 打包
echo "📦 打包文件..."
tar -czf blog.tar.gz out/

# 3. 上传到服务器
echo "📤 上传到服务器..."
scp -i .ssh/txcloud.pem blog.tar.gz ubuntu@bhhxx.wiki:/home/ubuntu/

# 4. 在服务器上解压并部署
echo "🔧 在服务器上部署..."
ssh -i .ssh/txcloud.pem ubuntu@bhhxx.wiki << 'ENDSSH'
# 解压
cd /home/ubuntu
tar -xzf blog.tar.gz

# 更新文件
sudo rm -rf /var/www/blog/*
sudo mv out/* /var/www/blog/

# 设置权限
sudo chown -R www-data:www-data /var/www/blog

# 清理
rm blog.tar.gz

echo "✅ 服务器部署完成！"
ENDSSH

# 5. 清理本地临时文件
rm blog.tar.gz

echo "🎉 部署成功！访问 http://bhhxx.wiki"
