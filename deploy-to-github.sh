#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法：运行此脚本，然后按照提示操作

echo "🎯 GitHub Pages 部署脚本"
echo "========================"

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在H5项目目录中运行此脚本"
    exit 1
fi

echo "✅ 检测到H5项目文件"

# 检查git状态
if [ ! -d ".git" ]; then
    echo "❌ 错误：未找到.git目录，请先运行 git init"
    exit 1
fi

echo ""
echo "📋 部署步骤："
echo "1. 访问 https://github.com/new 创建新仓库"
echo "2. 仓库名：face-asymmetry-screening（建议）"
echo "3. 不要初始化README.md（我们已经有了）"
echo "4. 创建后复制仓库URL"
echo ""
read -p "📥 请输入你的GitHub仓库URL（例如：https://github.com/用户名/仓库名.git）： " repo_url

if [ -z "$repo_url" ]; then
    echo "❌ 错误：必须提供仓库URL"
    exit 1
fi

echo ""
echo "🚀 开始部署..."

# 添加远程仓库
git remote add origin "$repo_url" 2>/dev/null || git remote set-url origin "$repo_url"

# 推送到GitHub
echo "📤 推送代码到GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 代码推送成功！"
    echo ""
    echo "🎉 接下来需要手动启用GitHub Pages："
    echo "1. 访问你的仓库：${repo_url%.git}"
    echo "2. 点击 Settings → Pages"
    echo "3. Source选择：main branch"
    echo "4. 点击 Save"
    echo "5. 等待1-2分钟"
    echo ""
    echo "🌐 你的网站将发布在："
    echo "   https://$(echo "$repo_url" | sed 's|https://github.com/||; s|.git$||' | awk -F/ '{print $1}').github.io/$(echo "$repo_url" | sed 's|https://github.com/||; s|.git$||' | awk -F/ '{print $2}')/"
    echo ""
    echo "📱 任何人都可以访问这个URL进行测试！"
else
    echo "❌ 推送失败，请检查："
    echo "   - GitHub仓库是否存在"
    echo "   - 是否有写入权限"
    echo "   - 网络连接"
fi