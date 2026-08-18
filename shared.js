(function () {
  "use strict";

  const palette = ["#45D16B", "#F9534D", "#4C8BF5", "#F7B32B", "#9B5DE5", "#00B8A9", "#FF7A59", "#607D8B"];
  const fontFamilies = [
    "Segoe UI, Noto Sans TC, sans-serif",
    "Microsoft JhengHei, sans-serif",
    "Arial, sans-serif",
    "Georgia, serif",
    "Courier New, monospace"
  ];
  const aspectSizes = {
    "16:9": { width: 1600, height: 900 },
    "4:3": { width: 1200, height: 900 },
    "1:1": { width: 900, height: 900 }
  };

  function textStyleDefaults(overrides = {}) {
    return {
      fontFamily: fontFamilies[0],
      fontSize: 20,
      color: "#000000",
      bold: true,
      italic: false,
      ...overrides
    };
  }

  function normalizeTextStyle(raw, fallback) {
    const base = textStyleDefaults(fallback);
    const size = Number(raw?.fontSize);
    return {
      fontFamily: fontFamilies.includes(raw?.fontFamily) ? raw.fontFamily : base.fontFamily,
      fontSize: Number.isFinite(size) && size >= 8 && size <= 72 ? size : base.fontSize,
      color: /^#[0-9a-f]{6}$/i.test(raw?.color) ? raw.color : base.color,
      bold: typeof raw?.bold === "boolean" ? raw.bold : base.bold,
      italic: typeof raw?.italic === "boolean" ? raw.italic : base.italic
    };
  }

  function defaults() {
    return {
      title: "標題",
      titleStyle: textStyleDefaults({ fontSize: 22, color: "#F07C28" }),
      type: "pie",
      rows: [
        { name: "A", value: 42, color: "#4C8BF5", textStyle: textStyleDefaults() },
        { name: "B", value: 31, color: "#45D16B", textStyle: textStyleDefaults() },
        { name: "C", value: 27, color: "#F7B32B", textStyle: textStyleDefaults() }
      ],
      aspectRatio: "16:9",
      pixelRatio: 2,
      theme: "system"
    };
  }

  function normalize(raw) {
    const base = defaults();
    if (!raw || typeof raw !== "object") return base;
    return {
      title: typeof raw.title === "string" ? raw.title : base.title,
      titleStyle: normalizeTextStyle(raw.titleStyle, { fontSize: 22, color: "#F07C28" }),
      type: ["pie", "bar", "line"].includes(raw.type) ? raw.type : base.type,
      rows: Array.isArray(raw.rows) && raw.rows.length ? raw.rows.map((row, index) => ({
        name: String(row.name ?? ""),
        value: Number(row.value),
        color: /^#[0-9a-f]{6}$/i.test(row.color) ? row.color : palette[index % palette.length],
        textStyle: normalizeTextStyle(row.textStyle)
      })) : base.rows,
      aspectRatio: aspectSizes[raw.aspectRatio] ? raw.aspectRatio : base.aspectRatio,
      pixelRatio: [1, 2, 3, 4].includes(Number(raw.pixelRatio)) ? Number(raw.pixelRatio) : base.pixelRatio,
      theme: ["system", "light", "dark"].includes(raw.theme) ? raw.theme : base.theme
    };
  }

  function applyTheme(preference) {
    const isDark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }

  function safeFilename(value) {
    const cleaned = String(value || "圖表").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "").trim();
    return cleaned || "圖表";
  }

  window.ChartConfig = { palette, fontFamilies, aspectSizes, defaults, normalize, normalizeTextStyle, textStyleDefaults, safeFilename, applyTheme };
})();
