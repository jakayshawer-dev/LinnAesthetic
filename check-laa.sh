#!/bin/bash
# =============================================================================
# LAA 站点健康巡检 —— 主动发现"又坏了",而不是等客户投诉
# =============================================================================
#
# 2026-10-30 建立。此前 3 次故障都是客户先发现(mike 后知):
#   1. 链接路径 404
#   2. SDK 加载失败被谎报成"评估记录未找到"
#   3. CDN 按完整 URL(含 ?v=)缓存旧字节 → 同一链接时好时坏
#
# 检查项(任一失败 → 退出码非 0 + 打印原因):
#   A. 双端字节一致(COS vs GitHub Pages)
#   B. 无陈旧缓存变体(所有历史 ?v= 都返回当前版本)
#   C. ACL 公开可读(上传后 ACL 被重置 → 全站 403)
#   D. Supabase 可达 + 目标记录存在
#   E. 9 个训练视频可达
#   F. SSL 证书剩余天数(硬期限)
#   G. Supabase 项目状态(免费额度 7 天无活动会被暂停)
#
# 用法: ./check-laa.sh [--verbose]
# =============================================================================
set -uo pipefail

DOMAIN="${DOMAIN:-www.linnaesthetic.cn}"
GH="https://jakayshawer-dev.github.io/LinnAesthetic"
BUCKET="${BUCKET:-linn-prod-1456938252}"
RECORD="${RECORD:-fb0942a5-cfaf-4b54-ae23-14f51a94d616}"
PAT_FILE="$HOME/.openclaw/.secrets/supabase-pat"
SB_URL="https://areakwzznuxjdmyyqujn.supabase.co"
FAIL=0
VERBOSE=0
[ "${1:-}" = "--verbose" ] && VERBOSE=1

ok()   { echo "  ✅ $1"; }
bad()  { echo "  ❌ $1"; FAIL=1; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ·  $1"; }

echo "=== LAA 健康巡检 $(date '+%Y-%m-%d %H:%M:%S') ==="

# --- A. 双端字节一致 ---
echo "[A] COS vs GitHub Pages 字节一致"
FILES="third-layer/index.html third-layer/app.js third-layer/actions.js third-layer/plan-generator.js third-layer/styles.css vendor/supabase.umd.v2.js supabase-config.js supabase-client.js app.js index.html"
for f in $FILES; do
  c=$(curl -s -m 20 "https://$DOMAIN/$f?cb=$RANDOM" | shasum -a 256 | cut -d' ' -f1)
  g=$(curl -s -m 20 "$GH/$f" | shasum -a 256 | cut -d' ' -f1)
  if [ "$c" = "$g" ]; then ok "$f"; else bad "$f 两端不一致 (cos=${c:0:10} gh=${g:0:10})"; fi
done

# --- B. 无陈旧缓存变体 ---
echo "[B] 历史 ?v= 变体无陈旧字节"
CUR=$(curl -s -m 20 "https://$DOMAIN/third-layer/app.js" | grep -o "APP_VERSION = '[^']*'" | head -1 | sed "s/.*'\(.*\)'/\1/")
[ -z "$CUR" ] && { bad "app.js 读不到 APP_VERSION(源站可能挂了)"; } || info "当前版本 $CUR"
for v in 0.1.0 0.1.1 0.2.0 0.2.1 0.2.2 0.2.3 0.2.4 0.3.0; do
  got=$(curl -s -m 20 "https://$DOMAIN/third-layer/app.js?v=$v" | grep -o "APP_VERSION = '[^']*'" | head -1 | sed "s/.*'\(.*\)'/\1/")
  if [ -z "$got" ]; then bad "?v=$v 无响应"; elif [ "$got" != "$CUR" ]; then bad "?v=$v 返回旧版本 $got(应为 $CUR)→ CDN 缓存了旧字节"; else ok "?v=$v = $CUR"; fi
done

# --- C. ACL 公开可读 ---
echo "[C] COS 对象 ACL public-read"
for f in third-layer/index.html third-layer/app.js app.js supabase-config.js vendor/supabase.umd.v2.js LinnAesthetic/third-layer/index.html; do
  code=$(curl -s -m 15 -o /dev/null -w "%{http_code}" "https://$DOMAIN/$f?acl=$RANDOM")
  if [ "$code" = "200" ]; then ok "$f"; else bad "$f HTTP $code(403=ACL 被重置,需 putobjectacl --grant-read anyone)"; fi
done

# --- D. Supabase 记录 ---
echo "[D] Supabase 记录可达"
KEY=""
if [ -r "$PAT_FILE" ]; then
  KEY=$(curl -s -m 20 "$DOMAIN/supabase-config.js" | grep -oE "sb_publishable_[A-Za-z0-9_-]+" | head -1)
fi
if [ -z "$KEY" ]; then
  bad "读不到 anon key"
else
  row=$(curl -s -m 20 "$SB_URL/rest/v1/assessments?resultid=eq.$RECORD&select=resultid,thirdlayerstatus,maintype" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  echo "$row" | grep -q "$RECORD" && ok "记录 $RECORD 存在 $(echo "$row" | head -c 120)" || bad "记录 $RECORD 不存在/取不到: $(echo "$row" | head -c 160)"
fi

# --- E. 训练视频 ---
echo "[E] 训练视频可达"
vids=$(curl -s -m 20 "https://$DOMAIN/third-layer/actions.js" | grep -oE "public/videos/[A-Za-z0-9]+\.mp4" | sort -u)
if [ -z "$vids" ]; then bad "actions.js 里没解析到视频 URL"; else
  for p in $vids; do
    f=$(basename "$p")
    code=$(curl -s -m 25 -o /dev/null -w "%{http_code}" -H "Range: bytes=0-100" "$SB_URL/storage/v1/object/public/videos/$f")
    [ "$code" = "206" ] || [ "$code" = "200" ] || bad "$f HTTP $code"
  done
  [ $FAIL -eq 0 ] && ok "$(echo "$vids" | wc -l | tr -d ' ') 个视频全部可达"
fi

# --- F. SSL 剩余天数 ---
echo "[F] SSL 证书"
END=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$END" ]; then
  days=$(( ( $(date -j -f "%b %d %T %Y %Z" "$END" +%s 2>/dev/null || date -d "$END" +%s) - $(date +%s) ) / 86400 ))
  if [ "$days" -lt 15 ]; then bad "SSL 仅剩 $days 天($END)→ 必须立刻续期,否则全站 HTTPS 挂"; elif [ "$days" -lt 45 ]; then warn "SSL 剩 $days 天($END)→ 尽快续期"; else ok "SSL 剩 $days 天($END)"; fi
else
  warn "拿不到证书到期时间"
fi

# --- G. Supabase 项目状态 ---
echo "[G] Supabase 项目状态(免费额度 7 天无活动会被暂停)"
if [ -r "$PAT_FILE" ]; then
  PAT=$(cat "$PAT_FILE")
  for REF in areakwzznuxjdmyyqujn maxxmdpqkafmxyvwkdpz; do
    st=$(curl -s --max-time 20 -H "Authorization: Bearer $PAT" "https://api.supabase.com/v1/projects/$REF" | python3 -c "import sys,json;print((json.load(sys.stdin) or {}).get('status',''))" 2>/dev/null)
    case "$st" in
      ACTIVE*) ok "$REF = $st" ;;
      "") warn "$REF 状态查询失败" ;;
      *) bad "$REF = $st(需 restore;见 skill: supabase-project-outage)" ;;
    esac
  done
else
  warn "PAT 不存在,跳过项目状态检查"
fi

echo "=== 结果 ==="
if [ "$FAIL" -eq 0 ]; then echo "✅ 全部通过"; exit 0; else echo "❌ 有失败项,需要处理"; exit 1; fi
