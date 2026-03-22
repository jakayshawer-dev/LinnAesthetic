# 快速部署指南 - 大小脸免费初筛H5页面

## 🚀 5分钟完成部署

### 步骤1：创建GitHub账号（如果还没有）
1. 访问：https://github.com/signup
2. 填写信息注册
3. 验证邮箱

### 步骤2：生成访问令牌（Token）
1. 登录GitHub
2. 点击右上角头像 → **Settings**
3. 左侧菜单最下方 → **Developer settings**
4. 点击 **Personal access tokens** → **Tokens (classic)**
5. 点击 **Generate new token** → **Generate new token (classic)**
6. 填写：
   - Note: `H5页面部署`
   - Expiration: `7 days`（推荐）
   - Select scopes: 只勾选：
     - ✅ `repo`（完全控制仓库）
     - ✅ `workflow`（可选，用于CI/CD）
7. 点击 **Generate token**
8. **立即复制Token**（只显示一次！）
9. 保存到安全的地方

### 步骤3：运行部署脚本
在终端中运行：

```bash
cd /Users/mike/.openclaw/workspace/h5-face-test
./deploy-with-token.sh 你的GitHub用户名 face-asymmetry-screening 你的Token
```

示例：
```bash
./deploy-with-token.sh zhangsan face-asymmetry-screening ghp_abc123def456
```

### 步骤4：访问你的网站
等待1-2分钟，访问：
```
https://你的用户名.github.io/face-asymmetry-screening/
```

### 步骤5：撤销Token（重要！）
1. 回到：https://github.com/settings/tokens
2. 找到 `H5页面部署` Token
3. 点击 **Delete**
4. 确认删除

## 🔐 安全说明

### 为什么用Token而不是密码？
- **更安全**：Token可以设置权限和有效期
- **可撤销**：随时可以撤销，不影响主账号
- **有限权限**：只能做你授权的事情
- **可追踪**：知道哪个Token做了什么

### Token权限说明
- `repo`：创建仓库、上传文件、启用Pages
- `workflow`：如果需要自动化部署（可选）

## 📱 手机端测试

### 立即测试：
1. 在手机浏览器输入：
   ```
   https://你的用户名.github.io/face-asymmetry-screening/
   ```
2. 测试所有功能
3. 分享给其他人测试

### 如果无法访问：
1. 等待2-3分钟再试
2. 检查URL是否正确
3. 确保仓库是Public（公开）

## 🔧 后续维护

### 更新网站：
```bash
# 1. 修改文件
# 2. 提交更改
git add .
git commit -m "更新描述"
git push

# 3. 等待1分钟自动更新
```

### 查看访问统计：
1. 在仓库页面点击 **Insights**
2. 查看 **Traffic**

### 绑定自定义域名（可选）：
1. 购买域名（如：face-test.cn）
2. 在仓库 Settings → Pages 添加域名
3. 在域名服务商添加CNAME记录

## 🆘 常见问题

### Q1：页面显示404
- 等待2-3分钟
- 检查仓库是否为Public
- 检查Settings → Pages是否已启用

### Q2：样式不加载
- 清除浏览器缓存
- 检查文件是否全部上传
- 使用隐身模式测试

### Q3：Token无效
- 检查Token是否已过期
- 重新生成Token
- 确保勾选了正确权限

### Q4：部署脚本失败
- 检查网络连接
- 确保GitHub用户名正确
- 确保仓库名不存在冲突

## 📞 获取帮助

如果遇到问题：
1. 保存错误信息
2. 检查所有步骤是否正确
3. 联系技术支持

## 🎯 完成检查清单

- [ ] 创建GitHub账号
- [ ] 生成访问令牌
- [ ] 运行部署脚本
- [ ] 访问网站测试
- [ ] 撤销Token（安全）
- [ ] 分享给他人测试

**部署完成时间**：5-10分钟  
**成本**：$0  
**有效期**：永久