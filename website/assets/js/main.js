/* Heatmap Tracker — product site.
   No build step, no dependencies: this file ships as-is to GitHub Pages. */

(function () {
  "use strict";

  /* ---------------------------------------------------------------- theme */

  var root = document.documentElement;

  function readStoredTheme() {
    try {
      return window.localStorage.getItem("ht-theme");
    } catch {
      return null;
    }
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem("ht-theme", value);
    } catch {
      /* private mode / blocked storage: the page still works, it just forgets */
    }
  }

  var stored = readStoredTheme();
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    root.setAttribute("data-theme", "light");
  }

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      storeTheme(next);
    });
  }

  /* ------------------------------------------------------------------ nav */

  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --------------------------------------------------------------- reveal */

  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    revealables.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  /* ----------------------------------------------------------- copy code */

  document.querySelectorAll(".copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy") || "";
      var done = function () {
        var label = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(function () {
          button.textContent = label;
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    });
  });

  /* -------------------------------------------------------- heatmap demo */

  var grid = document.getElementById("heatmap");
  var tooltip = document.getElementById("tooltip");
  var statsList = document.getElementById("demo-stats");
  var titleEl = document.getElementById("demo-title");
  var subtitleEl = document.getElementById("demo-subtitle");
  if (!grid) return;

  var YEAR = 2026;

  var DATASETS = {
    fitness: {
      title: "Exercise minutes",
      subtitle: "Read from <code>exercise:</code> in your daily notes",
      unit: "min",
      seed: 17,
      max: 90,
      weekendBoost: 1.35,
      skipChance: 0.24,
      colors: ["#0e4429", "#006d32", "#26a641", "#39d353"],
      stats: ["total", "days", "streak", "best"],
    },
    mood: {
      title: "Daily mood",
      subtitle: "Read from <code>mood:</code> — a 1–5 scale, no units needed",
      unit: "/5",
      seed: 41,
      max: 5,
      weekendBoost: 1.15,
      skipChance: 0.1,
      colors: ["#4c1d95", "#6d28d9", "#8b5cf6", "#c4b5fd"],
      stats: ["avg", "days", "streak", "best"],
    },
    sleep: {
      title: "Hours slept",
      subtitle: "Read from <code>hours-slept:</code>, decimals welcome",
      unit: "h",
      seed: 73,
      max: 9,
      weekendBoost: 1.12,
      skipChance: 0.08,
      colors: ["#0c4a6e", "#0369a1", "#0ea5e9", "#7dd3fc"],
      stats: ["avg", "days", "streak", "best"],
    },
    finance: {
      title: "Daily spending",
      subtitle:
        "Read from <code>spent:</code> — a year of spending on one screen",
      unit: "$",
      seed: 5,
      max: 180,
      weekendBoost: 1.6,
      skipChance: 0.18,
      colors: ["#78350f", "#b45309", "#f59e0b", "#fcd34d"],
      stats: ["total", "days", "streak", "best"],
    },
    writing: {
      title: "Words written",
      subtitle: "Read from <code>words:</code> in your writing log",
      unit: "words",
      seed: 91,
      max: 1800,
      weekendBoost: 0.75,
      skipChance: 0.3,
      colors: ["#831843", "#be185d", "#ec4899", "#f9a8d4"],
      stats: ["total", "days", "streak", "best"],
    },
  };

  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  /* Small deterministic PRNG so every visitor sees the same believable year. */
  function makeRandom(seed) {
    var state = seed * 2654435761 + 1;
    return function () {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  function buildValues(config) {
    var random = makeRandom(config.seed);
    var days = [];
    var cursor = new Date(YEAR, 0, 1);
    var end = new Date(YEAR, 11, 31);
    var today = new Date();

    while (cursor <= end) {
      var future = cursor > today;
      var weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
      /* a soft seasonal wave so the year has visible good and bad stretches */
      var season =
        0.72 +
        0.28 * Math.sin((cursor.getMonth() / 12) * Math.PI * 2 + config.seed);
      var value = 0;

      if (!future && random() > config.skipChance) {
        var boost = weekend ? config.weekendBoost : 1;
        value = Math.round(
          config.max * season * boost * (0.35 + random() * 0.65),
        );
        value = Math.max(1, Math.min(config.max, value));
      }

      days.push({
        date: new Date(cursor.getTime()),
        value: value,
        future: future,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  function levelFor(value, max) {
    if (!value) return 0;
    var ratio = value / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  function formatValue(value, config) {
    if (config.unit === "$") return "$" + value;
    if (config.unit === "/5") return value + "/5";
    return value.toLocaleString("en-US") + " " + config.unit;
  }

  function formatDate(date) {
    return (
      MONTHS[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear()
    );
  }

  function computeStats(days, config) {
    var total = 0;
    var active = 0;
    var best = 0;
    var streak = 0;
    var bestStreak = 0;

    days.forEach(function (day) {
      if (day.future) return;
      total += day.value;
      if (day.value > 0) {
        active += 1;
        streak += 1;
        if (streak > bestStreak) bestStreak = streak;
        if (day.value > best) best = day.value;
      } else {
        streak = 0;
      }
    });

    var avg = active ? total / active : 0;

    return {
      total: {
        label: "Total logged",
        value:
          config.unit === "$"
            ? "$" + total.toLocaleString("en-US")
            : total.toLocaleString("en-US"),
      },
      avg: {
        label: "Average",
        value:
          config.unit === "/5"
            ? avg.toFixed(1) + "/5"
            : avg.toFixed(1) + " " + config.unit,
      },
      days: { label: "Days tracked", value: String(active) },
      streak: { label: "Longest streak", value: bestStreak + " days" },
      best: { label: "Best day", value: formatValue(best, config) },
    };
  }

  function positionTooltip(cell, text) {
    if (!tooltip) return;
    var host = grid.closest(".demo");
    if (!host) return;
    var hostBox = host.getBoundingClientRect();
    var cellBox = cell.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = cellBox.left - hostBox.left + cellBox.width / 2 + "px";
    tooltip.style.top = cellBox.top - hostBox.top + "px";
    tooltip.classList.add("is-on");
  }

  function render(key) {
    var config = DATASETS[key];
    var days = buildValues(config);

    if (titleEl) titleEl.textContent = config.title;
    if (subtitleEl) subtitleEl.innerHTML = config.subtitle;

    grid.innerHTML = "";

    /* leading blanks so Jan 1 lands on its real weekday */
    var offset = days[0].date.getDay();
    for (var i = 0; i < offset; i += 1) {
      var blank = document.createElement("span");
      blank.className = "cell";
      blank.style.visibility = "hidden";
      blank.style.animation = "none";
      blank.style.opacity = "1";
      blank.style.transform = "none";
      grid.appendChild(blank);
    }

    days.forEach(function (day, index) {
      var level = levelFor(day.value, config.max);
      var cell = document.createElement("span");
      cell.className = "cell";
      cell.dataset.level = String(level);
      if (level > 0) {
        cell.style.background = config.colors[level - 1];
      }
      cell.style.animationDelay = Math.min(index * 1.1, 700) + "ms";

      var label = day.future
        ? formatDate(day.date) + " — not yet"
        : formatDate(day.date) +
          " — " +
          (day.value ? formatValue(day.value, config) : "nothing logged");

      cell.addEventListener("mouseenter", function () {
        positionTooltip(cell, label);
      });
      cell.addEventListener("mouseleave", function () {
        if (tooltip) tooltip.classList.remove("is-on");
      });

      grid.appendChild(cell);
    });

    /* legend swatches follow the active palette */
    document.querySelectorAll(".legend i").forEach(function (swatch) {
      var level = Number(swatch.dataset.level);
      swatch.style.background = level === 0 ? "" : config.colors[level - 1];
    });

    if (statsList) {
      var stats = computeStats(days, config);
      statsList.innerHTML = "";
      config.stats.forEach(function (name) {
        var stat = stats[name];
        var item = document.createElement("li");
        var strong = document.createElement("b");
        strong.textContent = stat.value;
        item.appendChild(strong);
        item.appendChild(document.createTextNode(stat.label));
        statsList.appendChild(item);
      });
    }

    grid.setAttribute(
      "aria-label",
      config.title +
        " for " +
        YEAR +
        ", shown as a year-long heatmap of daily values",
    );
  }

  document.querySelectorAll("[data-demo]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll("[data-demo]").forEach(function (other) {
        other.classList.remove("is-active");
        other.setAttribute("aria-selected", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      render(chip.dataset.demo);
    });
  });

  render("fitness");
})();
