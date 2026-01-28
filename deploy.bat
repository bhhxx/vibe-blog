@echo off
chcp 65001 >nul
echo ========================================
echo       博客自动部署脚本
echo ========================================
echo.

echo [1/5] 构建静态文件...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo [2/5] 打包文件...
tar -czf blog.tar.gz out\
if %errorlevel% neq 0 (
    echo 打包失败！
    pause
    exit / 1
)

echo.
echo [3/5] 上传到服务器...
scp -i .ssh/txcloud.pem blog.tar.gz ubuntu@bhhxx.wiki:/home/ubuntu/
if %errorlevel% neq 0 (
    echo 上传失败！
    pause
    exit /b 1
)

echo.
echo [4/5] 在服务器上部署...
echo 正在解压和部署...
scp -i .ssh/txcloud.pem -o StrictHostKeyChecking=no ubuntu@bhhxx.wiki "cd /home/ubuntu && tar -xzf blog.tar.gz && sudo rm -rf /var/www/blog/* && sudo mv out/* /var/www/blog/ && sudo chown -R www-data:www-data /var/www/blog && rm blog.tar.gz"
if %errorlevel% neq 0 (
    echo 部署失败！
    pause
    exit /b 1
)

echo.
echo [5/5] 清理临时文件...
del blog.tar.gz

echo.
echo ========================================
echo       部署成功！
echo       访问 http://bhhxx.wiki
echo ========================================
pause
