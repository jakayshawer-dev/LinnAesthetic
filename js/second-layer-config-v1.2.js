/**
 * LAA 第二层 v1.2 配置加载器（浏览器端）
 * 把 JSON config 注入到 window.secondLayerConfigV12，供引擎同步使用
 */
(function() {
  'use strict';

  // 同步加载：用 XMLHttpRequest，避免 fetch 异步时序问题
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'js/second-layer-config-v1.2.json', false); // 同步
    xhr.send(null);
    if (xhr.status === 200) {
      window.secondLayerConfigV12 = JSON.parse(xhr.responseText);
      console.log('[v1.2 config] loaded synchronously, version:', window.secondLayerConfigV12.version);
    } else {
      console.error('[v1.2 config] load failed:', xhr.status);
    }
  } catch (e) {
    console.error('[v1.2 config] load error:', e);
  }
})();