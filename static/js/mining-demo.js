/* Social Mining demo — pick a news article, run a staged "AI analysis" that
 * classifies the article, enriches the company and recommends a sales action.
 *
 * For now the analysis is MOCK data (below). The shape matches what the real
 * precomputed output (Ansatz A) will look like, so swapping mock → real later
 * means replacing only the ARTICLES array, not the widget code.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ data */
  var ARTICLES = [
    {
      source: "Logistics Today",
      headline: "Nordwind Logistics opens third distribution center in Poland",
      snippet:
        "The Hamburg-based carrier says its new 40,000 m² site near Poznań will roughly double cross-border capacity over the next year.",
      signal: { label: "Expansion", type: "expansion", confidence: 0.93 },
      company: {
        name: "Nordwind Logistics",
        chips: [
          "Logistics & supply chain",
          "~1,200 employees",
          "HQ Hamburg, DE",
          "CRM: existing account",
        ],
      },
      reasoning:
        "A new distribution center signals rising throughput and fresh capital going into warehouse operations — a strong trigger for automation and routing solutions before the facility ramps up.",
      action: {
        priority: "high",
        title: "Reach out to the Head of Operations",
        detail:
          "Position route-optimization and warehouse automation against the Poznań ramp-up, referencing their cross-border growth.",
      },
    },
    {
      source: "TechFinance Wire",
      headline: "Helios Pay raises €40M Series C to expand across Europe",
      snippet:
        "The payments startup will use the round to grow its engineering team and enter three new markets by year's end.",
      signal: { label: "Funding round", type: "funding", confidence: 0.89 },
      company: {
        name: "Helios Pay",
        chips: [
          "Fintech / payments",
          "~250 employees",
          "HQ Amsterdam, NL",
          "CRM: net-new account",
        ],
      },
      reasoning:
        "Fresh Series C capital plus an explicit hiring and market-expansion plan means new budget and new infrastructure decisions — a prime window for tooling and platform vendors.",
      action: {
        priority: "high",
        title: "Open a net-new opportunity",
        detail:
          "Engage the VP Engineering now while the team scales, before procurement processes harden around incumbent tools.",
      },
    },
    {
      source: "Industry Brief",
      headline: "MetalWorks Group to merge with Stahlbau Partners",
      snippet:
        "The combined entity becomes one of the region's largest steel fabricators, with integration planned over the coming quarters.",
      signal: { label: "Merger & acquisition", type: "ma", confidence: 0.86 },
      company: {
        name: "MetalWorks Group",
        chips: [
          "Industrial manufacturing",
          "~3,400 employees",
          "HQ Dortmund, DE",
          "CRM: existing account",
        ],
      },
      reasoning:
        "Mergers force systems and process consolidation. The integration window is when budgets open for platforms that unify operations across the two organisations.",
      action: {
        priority: "medium",
        title: "Brief the account team on the merger",
        detail:
          "Offer an integration assessment and map which of their tools overlap with Stahlbau's before consolidation decisions are made.",
      },
    },
    {
      source: "Retail Daily",
      headline: "Aurora Retail names new CTO to lead digital overhaul",
      snippet:
        "The incoming CTO joins from a major e-commerce group and is tasked with modernising the retailer's online stack.",
      signal: { label: "Leadership change", type: "leadership", confidence: 0.81 },
      company: {
        name: "Aurora Retail",
        chips: [
          "Retail / e-commerce",
          "~5,000 employees",
          "HQ Vienna, AT",
          "CRM: net-new account",
        ],
      },
      reasoning:
        "A new CTO with a digital-modernisation mandate typically re-evaluates the existing stack in the first months — a rare window to displace incumbents and shape the roadmap.",
      action: {
        priority: "medium",
        title: "Send a tailored intro to the new CTO",
        detail:
          "Reference their modernisation mandate and offer a short architecture review aligned to their first-100-days priorities.",
      },
    },
  ];

  var STEPS = ["Classify", "Enrich", "Recommend"];

  /* --------------------------------------------------------------- helpers */
  function delay(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function reveal(node) {
    requestAnimationFrame(function () {
      node.classList.add("is-in");
    });
  }

  function typeInto(node, text) {
    return new Promise(function (resolve) {
      var words = text.split(" ");
      var i = 0;
      node.textContent = "";
      (function step() {
        if (i >= words.length) return resolve();
        node.textContent += (i ? " " : "") + words[i++];
        setTimeout(step, 26);
      })();
    });
  }

  /* ------------------------------------------------------------------ init */
  function init(root) {
    if (root.dataset.mdInit) return;
    root.dataset.mdInit = "1";

    var inbox = root.querySelector("[data-inbox]");
    var empty = root.querySelector("[data-empty]");
    var content = root.querySelector("[data-content]");
    var metaEl = root.querySelector("[data-sel-meta]");
    var headEl = root.querySelector("[data-sel-headline]");
    var analyzeBtn = root.querySelector("[data-analyze]");
    var stepEls = [].slice.call(root.querySelectorAll("[data-step]"));
    var resultEl = root.querySelector("[data-result]");

    var current = null;
    var running = false;
    var cards = [];

    ARTICLES.forEach(function (a, idx) {
      var card = el(
        "button",
        "md-article",
        '<div class="md-article__meta">' + esc(a.source) + "</div>" +
          '<div class="md-article__headline">' + esc(a.headline) + "</div>" +
          '<div class="md-article__snippet">' + esc(a.snippet) + "</div>"
      );
      card.type = "button";
      card.addEventListener("click", function () {
        if (running) return;
        select(idx);
      });
      inbox.appendChild(card);
      cards.push(card);
    });

    function select(idx) {
      current = ARTICLES[idx];
      cards.forEach(function (c, i) {
        c.classList.toggle("is-active", i === idx);
      });
      empty.hidden = true;
      content.hidden = false;
      metaEl.textContent = current.source;
      headEl.textContent = current.headline;
      resetResult();
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Analyze with AI";
    }

    function resetResult() {
      resultEl.innerHTML = "";
      stepEls.forEach(function (s) {
        s.className = "md-step";
        s.dataset.step = "";
      });
    }

    function setStep(i, state) {
      stepEls[i].className = "md-step is-" + state;
    }

    function addBlock(label) {
      var block = el("div", "md-block");
      block.appendChild(el("div", "md-block__label", esc(label)));
      resultEl.appendChild(block);
      reveal(block);
      return block;
    }

    function showSignal(a) {
      var block = addBlock("Signal");
      var tag = el(
        "span",
        "md-signal md-signal--" + a.signal.type,
        esc(a.signal.label)
      );
      block.appendChild(tag);
      var pct = Math.round(a.signal.confidence * 100);
      var meter = el(
        "div",
        "md-confidence",
        '<div class="md-confidence__bar"></div>'
      );
      block.appendChild(meter);
      block.appendChild(el("div", "md-confidence__val", pct + "% confidence"));
      requestAnimationFrame(function () {
        meter.querySelector(".md-confidence__bar").style.width = pct + "%";
      });
    }

    function showCompany(a) {
      var block = addBlock("Company");
      block.appendChild(el("div", "md-company-name", esc(a.company.name)));
      var chips = el("div", "md-chips");
      a.company.chips.forEach(function (c, i) {
        var chip = el("span", "md-chip", esc(c));
        chip.style.transitionDelay = i * 90 + "ms";
        chips.appendChild(chip);
        reveal(chip);
      });
      block.appendChild(chips);
    }

    function showReco(a) {
      var block = addBlock("Recommendation");
      var reasoning = el("p", "md-reasoning");
      block.appendChild(reasoning);
      return typeInto(reasoning, a.reasoning).then(function () {
        var card = el("div", "md-action");
        var prLabel =
          a.action.priority === "high" ? "High priority" : "Medium priority";
        card.innerHTML =
          '<div class="md-action__top">' +
          '<span class="md-action__title">' + esc(a.action.title) + "</span>" +
          '<span class="md-priority md-priority--' + a.action.priority + '">' +
          prLabel + "</span></div>" +
          '<div class="md-action__detail">' + esc(a.action.detail) + "</div>";
        block.appendChild(card);
        reveal(card);
      });
    }

    async function analyze() {
      if (!current || running) return;
      running = true;
      analyzeBtn.disabled = true;
      resetResult();

      setStep(0, "active");
      await delay(750);
      setStep(0, "done");
      showSignal(current);
      await delay(450);

      setStep(1, "active");
      await delay(750);
      setStep(1, "done");
      showCompany(current);
      await delay(500);

      setStep(2, "active");
      await delay(750);
      setStep(2, "done");
      await showReco(current);

      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Re-run analysis";
      running = false;
    }

    analyzeBtn.addEventListener("click", analyze);
  }

  function boot() {
    document.querySelectorAll("[data-mining-demo]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
