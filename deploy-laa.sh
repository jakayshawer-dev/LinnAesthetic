#!/bin/bash
# =============================================================================
# LAA 第三层/根页面 —— 统一部署脚本(单一真相源)
# =============================================================================
#
# 为什么有这个脚本(2026-10-30):
#   之前 LAA 站点有三份拷贝:
#     1) git 仓库(GitHub Pages 源)  /Users/mike/.openclaw.bak/workspace/LinnAesthetic
#     2) COS 桶(生产 www.linnaesthetic.cn)
#     3) 桌面上的旧预览目录 ~/Desktop/LAA/third-layer-preview-clean
#   修复只传到其中一份,其余两份还是旧的 → 客户随机命中旧版本 → 「时好时坏」
#   本脚本保证:一次部署,COS + GH Pages 拿到完全相同的字节。
#
# 用法:
#   ./deploy-laa.sh              # 完整部署(COS + GH Pages + 旧路径跳转页 + CDN purge)
#   ./deploy-laa.sh --cos-only   # 只更 COS
#   ./deploy-laa.sh --gh-only    # 只更 GH Pages
#   ./deploy-laa.sh --dry-run    # 只看要传什么,不真传
#
# 依赖:coscmd(~/.cos.conf)、git(SSH 到 GitHub)、tccli(CDN purge)
# =============================================================================
set -euo pipefail

REPO="${REPO:-/Users/mike/.openclaw.bak/workspace/LinnAesthetic}"
COS_CONF="${COS_CONF:-$HOME/.cos.conf}"
BUCKET="${BUCKET:-linn-prod-1456938252}"
REGION="${REGION:-ap-shanghai}"
DOMAIN="${DOMAIN:-www.linnaesthetic.cn}"
GH_REPO="git@github.com:jakayshawer-dev/LinnAesthetic.git"
GH_PAGES="https://jakayshawer-dev.github.io/LinnAesthetic"

VERSION="0.3.0"
DRY=0
DO_COS=1
DO_GH=1

for a in "$@"; do
  case "$a" in
    --cos-only) DO_GH=0 ;;
    --gh-only)  DO_COS=0 ;;
    --dry-run)  DRY=1 ;;
    *) echo "未知参数: $a"; exit 1 ;;
  esac
done

log() { echo "[$(date '+%H:%M:%S')] $*"; }

cd "$REPO"

# -----------------------------------------------------------------------------
# 0. 前置检查:工作区必须干净(否则传上去的和仓库对不上,又是一次漂移)
# -----------------------------------------------------------------------------
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 工作区有未提交改动。先 commit 再部署。"
  git status --short
  exit 1
fi
log "工作区干净,HEAD=$(git rev-parse --short HEAD)"

# -----------------------------------------------------------------------------
# 1. 旧路径跳转页(救活已经发给客户的旧链接)
#    /LinnAesthetic/third-layer/?resultid=xxx  →  /third-layer/?resultid=xxx
# -----------------------------------------------------------------------------
build_legacy_redirect() {
  local dir="$1"
  mkdir -p "$dir/LinnAesthetic/third-layer"
  cat > "$dir/LinnAesthetic/third-layer/index.html" <<'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LAA · 第三层</title>
<link rel="canonical" href="/third-layer/">
<meta http-equiv="refresh" content="0;url=/third-layer/">
<script>
  // 保留 query(resultid 等)跳到新路径
  location.replace('/third-layer/' + location.search + location.hash);
</script>
</head>
<body style="font-family:system-ui,sans-serif;padding:40px;text-align:center;color:#6b6b6b">
正在打开第三层跟练…<br><a href="/third-layer/">如果没有自动跳转，请点这里</a>
</body>
</html>
HTML
}

# -----------------------------------------------------------------------------
# 2. 部署到 COS
# -----------------------------------------------------------------------------
deploy_cos() {
  log "=== 部署 COS ==="
  local tmp; tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  # 组装要上传的树(COS 桶根 = 站点根)
  mkdir -p "$tmp/third-layer" "$tmp/vendor"
  cp third-layer/index.html third-layer/app.js third-layer/actions.js \
     third-layer/plan-generator.js third-layer/styles.css "$tmp/third-layer/"
  cp vendor/supabase.umd.v2.js "$tmp/vendor/"
  cp index.html app.js supabase-config.js supabase-client.js "$tmp/"
  build_legacy_redirect "$tmp"

  if [ "$DRY" = "1" ]; then
    log "(dry-run) 将上传:"; find "$tmp" -type f | sed "s|$tmp|/|"
    return 0
  fi

  # HTML 一律 no-cache + must-revalidate;JS/CSS 用版本戳 + 短 TTL
  local html_hdr='{"Cache-Control":"no-cache, must-revalidate"}'
  local js_hdr='{"Cache-Control":"public, max-age=300, must-revalidate"}'

  for f in third-layer/index.html index.html LinnAesthetic/third-layer/index.html; do
    log "upload /$f"
    coscmd -c "$COS_CONF" -b "$BUCKET" -r "$REGION" upload "$tmp/$f" "/$f" -H "$html_hdr"
    coscmd -c "$COS_CONF" -b "$BUCKET" -r "$REGION" putobjectacl "/$f" --grant-read "anyone"
  done
  for f in third-layer/app.js third-layer/actions.js third-layer/plan-generator.js \
           third-layer/styles.css app.js supabase-config.js supabase-client.js \
           vendor/supabase.umd.v2.js; do
    log "upload /$f"
    coscmd -c "$COS_CONF" -b "$BUCKET" -r "$REGION" upload "$tmp/$f" "/$f" -H "$js_hdr"
    coscmd -c "$COS_CONF" -b "$BUCKET" -r "$REGION" putobjectacl "/$f" --grant-read "anyone"
  done
  rm -rf "$tmp"
  trap - RETURN
}

# -----------------------------------------------------------------------------
# 3. 部署到 GitHub Pages
# -----------------------------------------------------------------------------
deploy_gh() {
  log "=== 部署 GitHub Pages ==="
  if [ "$DRY" = "1" ]; then
    log "(dry-run) 将 commit + push 到 $GH_REPO"
    git status --short
    return 0
  fi
  git push origin main
  log "已 push,等待 GitHub Pages 构建(通常 1-2 分钟)"
}

# -----------------------------------------------------------------------------
# 4. CDN purge —— 不 purge 的话边缘节点还在发旧字节
# -----------------------------------------------------------------------------
purge_cdn() {
  if [ "$DRY" = "1" ]; then return 0; fi
  log "=== purge CDN ==="
  local json
  json='[\
"https://'"$DOMAIN"'/third-layer/index.html",\
"https://'"$DOMAIN"'/third-layer/app.js",\
"https://'"$DOMAIN"'/third-layer/actions.js",\
"https://'"$DOMAIN"'/third-layer/plan-generator.js",\
"https://'"$DOMAIN"'/third-layer/styles.css",\
"https://'"$DOMAIN"'/vendor/supabase.umd.v2.js",\
"https://'"$DOMAIN"'/supabase-client.js",\
"https://'"$DOMAIN"'/supabase-config.js",\
"https://'"$DOMAIN"'/app.js",\
"https://'"$DOMAIN"'/index.html",\
"https://'"$DOMAIN"'/LinnAesthetic/third-layer/index.html"\
]'
  no_proxy='*' HTTP_PROXY= HTTPS_PROXY= tccli cdn PurgeUrlsCache --Urls "$json" || \
    log "⚠️ purge 失败,手动执行:tccli cdn PurgeUrlsCache --Urls '$json'"
}

# -----------------------------------------------------------------------------
# 5. 双端一致性校验 —— 部署完必须确认两边字节一致
# -----------------------------------------------------------------------------
verify() {
  if [ "$DRY" = "1" ]; then return 0; fi
  log "=== 校验 COS vs GH Pages 字节一致 ==="
  local bad=0
  for f in third-layer/index.html third-layer/app.js third-layer/actions.js \
           third-layer/plan-generator.js third-layer/styles.css \
           vendor/supabase.umd.v2.js supabase-config.js supabase-client.js; do
    local cos_gh
    cos_gh=$(curl -s -m 20 "https://$DOMAIN/$f?cb=$RANDOM" | shasum -a 256 | cut -d' ' -f1)
    local gh_hash
    gh_hash=$(curl -s -m 20 "$GH_PAGES/$f" | shasum -a 256 | cut -d' ' -f1)
    if [ "$cos_gh" = "$gh_hash" ]; then
      printf "  ✅ %-36s %s\n" "$f" "${cos_gh:0:12}"
    else
      printf "  ❌ %-36s cos=%s gh=%s\n" "$f" "${cos_gh:0:12}" "${gh_hash:0:12}"
      bad=1
    fi
  done
  [ "$bad" = "1" ] && { log "❌ 两端不一致!"; return 1; }
  log "✅ 两端字节完全一致"
}

# -----------------------------------------------------------------------------
log "LAA 部署 v$VERSION  (COS=$DO_COS GH=$DO_GH dry=$DRY)"
[ "$DO_COS" = "1" ] && deploy_cos
[ "$DO_GH" = "1" ]  && deploy_gh
purge_cdn
verify
log "完成 ✅"
