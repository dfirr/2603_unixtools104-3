window.RevealQuartoRevealjsBudoux = function () {
  return {
    id: "RevealQuartoRevealjsBudoux",
    init: function (deck) {
      // BudouXが既に定義済みなら読み込みを省略
      function readyToProcess() {
        try {
          return !!(window.customElements && customElements.get('budoux-ja'));
        } catch (_) {
          return false;
        }
      }

      function applyBudouxToSlide(slide) {
        if (!slide || slide.classList.contains('no-budoux')) return;

        // 対象のブロック要素
        var blocks = slide.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
        blocks.forEach(function (block) {
          // TreeWalkerでテキストノードのみ拾う（コード/数式/除外クラスはスキップ）
          var walker = document.createTreeWalker(
            block,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function (node) {
                var v = node.nodeValue;
                if (!v || !v.trim()) return NodeFilter.FILTER_REJECT;

                // 祖先に除外要素がいる場合はスキップ
                for (var el = node.parentNode; el && el !== block; el = el.parentNode) {
                  if (el.nodeType !== 1) continue; // ELEMENT_NODEのみ
                  if (el.matches && el.matches('code, pre, kbd, samp, var, math, .no-budoux-inline, budoux-ja')) {
                    return NodeFilter.FILTER_REJECT;
                  }
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );

          var textNodes = [];
          var n;
          while ((n = walker.nextNode())) textNodes.push(n);

          textNodes.forEach(function (textNode) {
            // 既に budoux-ja に囲まれている場合はスキップ（二重適用防止）
            var p = textNode.parentNode;
            if (p && p.closest && p.closest('budoux-ja')) return;

            var t = textNode.nodeValue;
            var budoux = document.createElement('budoux-ja');
            // レイアウトを乱さないための保険
            budoux.style.display = 'inline';
            budoux.style.whiteSpace = 'inherit';

            budoux.textContent = t;
            p.replaceChild(budoux, textNode);
          });
        });
      }

      function run() {
        // すべてのスライドに適用
        deck.getSlides().forEach(applyBudouxToSlide);

        // （任意）動的に生成される内容に備えて、スライド切替時にも適用
        deck.on('slidechanged', function(event) {
          applyBudouxToSlide(event.currentSlide);
        });
      }

      if (readyToProcess()) {
        // 既に <budoux-ja> が使えるなら即実行
        run();
        return;
      }

      // BudouXを一度だけ読み込む
      var alreadyLoading = document.querySelector('script[data-budoux-ja-loader]');
      if (!alreadyLoading) {
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/budoux/bundle/budoux-ja.min.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-budoux-ja-loader', '1');
        script.onload = run;
        script.onerror = function () {
          console.warn('[RevealQuartoRevealjsBudoux] Failed to load budoux-ja.min.js');
        };
        document.head.appendChild(script);
      } else {
        // 他所がロード中なら、完了を待ってから実行を試みる
        var onLoadOnce = function () {
          if (readyToProcess()) {
            run();
            alreadyLoading.removeEventListener('load', onLoadOnce);
          }
        };
        alreadyLoading.addEventListener('load', onLoadOnce);
      }
    },
  };
};
