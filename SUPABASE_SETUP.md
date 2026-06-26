# Supabase Auth 配置（手动操作）

## 必须做的：在 Supabase Dashboard 加 redirect URL 白名单

**目的**：让魔法链接点开后能跳到 https://jakayshawer-dev.github.io/LinnAesthetic/teacher.html 而不是 localhost

**步骤**：

1. 打开 https://supabase.com/dashboard
2. 选项目 `laa-assessment`（或 `kcxijunkljhmckuazwms`）
3. 左侧菜单 → **Authentication** → **URL Configuration**
4. 找到 **Redirect URLs** 字段
5. 点 Add URL，添加以下 3 个：
   - `https://jakayshawer-dev.github.io/LinnAesthetic/teacher.html`
   - `https://jakayshawer-dev.github.io/LinnAesthetic/`
   - `https://jakayshawer-dev.github.io`
6. 点 Save

**Site URL** 也改成：
- `https://jakayshawer-dev.github.io/LinnAesthetic/teacher.html`

（这是 fallback，未匹配上的 redirect 会跳这里）

## 可选但推荐：关掉邮箱验证

**目的**：首次注册的老师不需要点邮件验证链接，直接登入

**步骤**：

1. 左侧菜单 → **Authentication** → **Providers**
2. 找到 **Email** provider → 点开
3. 找到 **Confirm email** toggle → **关掉**
4. 点 Save

（如果你想保留验证（比如防止有人乱注册你的老师邮箱），就跳过这步）

## 验证

1. 刷新 teacher.html（清缓存 Cmd+Shift+R）
2. 重新点"发送登入链接"
3. 邮件里点链接 → 应该跳到 `https://jakayshawer-dev.github.io/LinnAesthetic/teacher.html` 而不是 localhost
4. 自动登入成功