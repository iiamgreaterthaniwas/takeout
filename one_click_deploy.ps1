# 自动化部署脚本 - Windows PowerShell 版 (优化版)
$OutputEncoding = [System.Text.Encoding]::UTF8
$IP = "39.105.33.42"
$USER = "root"
$REMOTE_PATH = "/var/www/takeout"

Write-Host ">>> 正在清理本地临时文件..." -ForegroundColor Cyan
if (Test-Path "deploy.zip") { Remove-Item "deploy.zip" }

Write-Host ">>> 正在打包项目文件 (排除 node_modules 和 dist)..." -ForegroundColor Cyan
# 创建临时打包目录
$TempDir = "temp_deploy"
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

# 复制必要文件
Copy-Item -Recurse "deploy" "$TempDir/"
Copy-Item -Recurse "server" "$TempDir/" -Exclude "node_modules", "dist", ".git"
Copy-Item -Recurse "admin-web" "$TempDir/" -Exclude "node_modules", "dist", ".git"

# 压缩
Compress-Archive -Path "$TempDir/*" -DestinationPath "deploy.zip"
Remove-Item -Recurse -Force $TempDir

Write-Host ">>> 正在上传压缩包到服务器..." -ForegroundColor Cyan
# 确保远程目录存在
ssh ${USER}@${IP} "mkdir -p ${REMOTE_PATH}"
# 使用 -O 强制使用旧版 SCP 协议，增加稳定性
scp -O deploy.zip ${USER}@${IP}:${REMOTE_PATH}/

Write-Host ">>> 正在服务器上解压并执行安装..." -ForegroundColor Cyan
ssh ${USER}@${IP} "cd ${REMOTE_PATH} && apt install -y unzip && unzip -o deploy.zip && chmod +x deploy/*.sh && cd deploy && bash setup_server.sh && bash deploy_app.sh"

Write-Host ">>> 全部部署流程已完成！" -ForegroundColor Green
Write-Host ">>> 访问地址: http://${IP}" -ForegroundColor Yellow

# 清理
if (Test-Path "deploy.zip") { Remove-Item "deploy.zip" }
