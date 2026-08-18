(function () {
  "use strict";

  const palette = ["#45D16B", "#F9534D", "#4C8BF5", "#F7B32B", "#9B5DE5", "#00B8A9", "#FF7A59", "#607D8B"];
  const aspectSizes = {
    "16:9": { width: 1600, height: 900 },
    "4:3": { width: 1200, height: 900 },
    "1:1": { width: 900, height: 900 }
  };

  function defaults() {
    return {
      title: "標題",
      type: "pie",
      rows: [
        { name: "A", value: 42, color: "#4C8BF5" },
        { name: "B", value: 31, color: "#45D16B" },
        { name: "C", value: 27, color: "#F7B32B" }
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
      type: ["pie", "bar", "line"].includes(raw.type) ? raw.type : base.type,
      rows: Array.isArray(raw.rows) && raw.rows.length ? raw.rows.map((row, index) => ({
        name: String(row.name ?? ""),
        value: Number(row.value),
        color: /^#[0-9a-f]{6}$/i.test(row.color) ? row.color : palette[index % palette.length]
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

  window.ChartConfig = { palette, aspectSizes, defaults, normalize, safeFilename, applyTheme };
})();
