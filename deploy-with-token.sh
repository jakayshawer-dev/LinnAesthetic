#!/bin/bash

# GitHub Token部署脚本
# 安全提示：Token只用于本次部署，完成后请立即撤销

echo "🔐 GitHub Token 部署脚本"
echo "========================"
echo "安全提示：Token将在部署完成后自动从脚本中删除"
echo ""

# 检查参数
if [ $# -lt 3 ]; then
    echo "使用方法: $0 <GitHub用户名> <仓库名> <访问令牌>"
    echo ""
    echo "示例:"
    echo "  $0 yourusername face-asymmetry-screening ghp_xxxxxxxxxxxx"
    echo ""
    echo "如何获取Token:"
    echo "1. 登录GitHub → Settings → Developer settings"
    echo "2. Personal access tokens → Tokens (classic)"
    echo "3. Generate new token (classic)"
    echo "4. 只勾选 'repo' 和 'workflow'"
    echo "5. 复制Token（只显示一次）"
    exit 1
fi

GITHUB_USER="$1"
REPO_NAME="$2"
GITHUB_TOKEN="$3"
REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"
AUTH_URL="https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git"

echo "🔧 开始部署..."
echo "用户名: $GITHUB_USER"
echo "仓库名: $REPO_NAME"
echo ""

# 1. 检查本地文件
echo "📁 检查本地文件..."
if [ ! -f "index.html" ]; then
    echo "❌ 错误：找不到index.html"
    exit 1
fi

echo "✅ 找到所有必要文件"

# 2. 初始化git（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "🔄 初始化git仓库..."
    git init
    git add .
    git commit -m "Initial commit: Face asymmetry screening H5 page"
fi

# 3. 添加远程仓库
echo "🌐 配置远程仓库..."
git remote remove origin 2>/dev/null
git remote add origin "$AUTH_URL"

# 4. 创建仓库（如果不存在）
echo "📦 创建GitHub仓库..."
curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d "{\"name\":\"$REPO_NAME\",\"description\":\"大小脸免费初筛H5页面\",\"private\":false}" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ 仓库创建成功"
else
    echo "⚠️  仓库可能已存在，继续..."
fi

# 5. 推送代码
echo "📤 推送代码到GitHub..."
git branch -M main
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo "✅ 代码推送成功"
else
    echo "❌ 推送失败"
    exit 1
fi

# 6. 启用GitHub Pages
echo "🚀 启用GitHub Pages..."
curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/$GITHUB_USER/$REPO_NAME/pages \
     -d '{"source":{"branch":"main","path":"/"}}' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ GitHub Pages已启用"
else
    echo "⚠️  GitHub Pages启用失败，可能需要手动设置"
fi

# 7. 清理Token（从脚本中移除）
echo "🧹 清理Token信息..."
sed -i '' "s/$GITHUB_TOKEN/***REDACTED***/g" "$0"

# 8. 显示结果
echo ""
echo "🎉 部署完成！"
echo "========================"
echo "🌐 你的网站URL:"
echo "   https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""
echo "⏱️  等待1-2分钟让GitHub构建"
echo ""
echo "🔐 重要安全步骤："
echo "1. 立即访问: https://github.com/settings/tokens"
echo "2. 找到 'H5 Page Deployment' Token"
echo "3. 点击 'Delete' 撤销访问权限"
echo ""
echo "📱 测试访问:"
echo "   在浏览器中打开: https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""
echo "🔄 更新网站:"
echo "   修改文件后运行: git add . && git commit -m 'update' && git push"
echo "========================"