(function () {
  "use strict";

  let chart;
  let config;

  const baseText = { fontFamily: "Segoe UI, Noto Sans TC, sans-serif", color: "#3e4850" };
  const chartTextStyle = (style) => ({
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    fontWeight: style.bold ? "bold" : "normal",
    fontStyle: style.italic ? "italic" : "normal"
  });

  function itemRichStyles() {
    return Object.fromEntries(config.rows.map((row, index) => [`item${index}`, chartTextStyle(row.textStyle)]));
  }

  function richItemFormatter(name) {
    const index = config.rows.findIndex((row) => row.name === name);
    return index >= 0 ? `{item${index}|${name}}` : name;
  }

  function categoryAxisLabel(defaultSize) {
    return {
      ...baseText,
      fontSize: defaultSize,
      interval: 0,
      rotate: config.rows.length > 6 ? 25 : 0,
      margin: 18,
      formatter: richItemFormatter,
      rich: itemRichStyles()
    };
  }

  const title = (isSquare) => ({
    text: config.title,
    left: isSquare ? 34 : 42,
    top: isSquare ? 28 : 30,
    textStyle: chartTextStyle(config.titleStyle)
  });

  function pieOption(size) {
    const square = size.width === size.height;
    return {
      backgroundColor: "#ffffff",
      animation: false,
      title: title(square),
      legend: {
        top: square ? 82 : 76,
        left: square ? 34 : 42,
        right: 28,
        icon: "circle",
        itemWidth: 13,
        itemHeight: 13,
        itemGap: 18,
        data: config.rows.map((row) => row.name),
        formatter: richItemFormatter,
        textStyle: { ...baseText, fontSize: 18, rich: itemRichStyles() }
      },
      series: [{
        type: "pie",
        radius: "42%",
        center: ["50%", square ? "59%" : "57%"],
        selectedMode: false,
        avoidLabelOverlap: true,
        label: { show: true, position: "inside", formatter: "{c} ({d}%)", color: "#000000", fontSize: 20, fontWeight: "bold" },
        itemStyle: { borderColor: "#ffffff", borderWidth: 2 },
        data: config.rows.map((row) => ({
          value: row.value,
          name: row.name,
          itemStyle: { color: row.color },
          label: { show: true, position: "inside", formatter: "{c} ({d}%)", ...chartTextStyle(row.textStyle) }
        }))
      }]
    };
  }

  function barOption(size) {
    const square = size.width === size.height;
    return {
      backgroundColor: "#ffffff",
      animation: false,
      title: title(square),
      grid: { left: square ? 95 : 110, right: 65, top: square ? 125 : 120, bottom: square ? 125 : 105, containLabel: true },
      xAxis: {
        type: "category",
        data: config.rows.map((row) => row.name),
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: "#87939e" } },
        axisLabel: categoryAxisLabel(17)
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#e5e9ed" } },
        axisLabel: { ...baseText, fontSize: 16 }
      },
      series: [{
        type: "bar",
        barMaxWidth: 92,
        data: config.rows.map((row) => ({
          value: row.value,
          itemStyle: { color: row.color, borderRadius: [5, 5, 0, 0] },
          label: { show: true, position: "top", ...chartTextStyle(row.textStyle) }
        })),
        label: { show: true, position: "top", color: "#27323a", fontSize: 18, fontWeight: "bold" }
      }]
    };
  }

  function lineOption(size) {
    const square = size.width === size.height;
    const primaryColor = config.rows[0]?.color || "#4C8BF5";
    return {
      backgroundColor: "#ffffff",
      animation: false,
      title: title(square),
      grid: { left: square ? 95 : 110, right: 70, top: square ? 125 : 120, bottom: square ? 125 : 105, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: true,
        data: config.rows.map((row) => row.name),
        axisLine: { lineStyle: { color: "#87939e" } },
        axisLabel: categoryAxisLabel(17)
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#e5e9ed" } },
        axisLabel: { ...baseText, fontSize: 16 }
      },
      series: [{
        type: "line",
        smooth: false,
        symbol: "circle",
        symbolSize: 14,
        lineStyle: { width: 4, color: primaryColor },
        itemStyle: { color: primaryColor, borderColor: "#ffffff", borderWidth: 2 },
        data: config.rows.map((row) => ({
          value: row.value,
          itemStyle: { color: row.color },
          label: { show: true, position: "top", distance: 10, ...chartTextStyle(row.textStyle) }
        })),
        label: { show: true, position: "top", distance: 10, color: "#27323a", fontSize: 17, fontWeight: "bold" }
      }]
    };
  }

  const optionBuilders = { pie: pieOption, bar: barOption, line: lineOption };

  function fitPreview() {
    const frame = document.querySelector("#chart-frame");
    const area = document.querySelector("#preview-area");
    const availableWidth = Math.max(100, area.clientWidth - 48);
    const availableHeight = Math.max(100, area.clientHeight - 48);
    const scale = Math.min(availableWidth / frame.offsetWidth, availableHeight / frame.offsetHeight, 1);
    frame.style.transform = `translate(-${frame.offsetWidth * scale / 2}px, -${frame.offsetHeight * scale / 2}px) scale(${scale})`;
  }

  function download() {
    const url = chart.getDataURL({ type: "png", pixelRatio: config.pixelRatio, backgroundColor: "#ffffff" });
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${ChartConfig.safeFilename(config.title)}.png`;
    anchor.click();
  }

  document.querySelector("#download-button").addEventListener("click", download);
  document.querySelector("#edit-button").addEventListener("click", () => { window.location.href = chrome.runtime.getURL("popup.html"); });
  window.addEventListener("resize", fitPreview);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (config?.theme === "system") ChartConfig.applyTheme("system");
  });

  chrome.storage.local.get("chartConfig").then(({ chartConfig }) => {
    config = ChartConfig.normalize(chartConfig);
    ChartConfig.applyTheme(config.theme);
    const size = ChartConfig.aspectSizes[config.aspectRatio];
    const frame = document.querySelector("#chart-frame");
    frame.style.width = `${size.width}px`;
    frame.style.height = `${size.height}px`;
    document.querySelector("#page-title").textContent = config.title;
    document.querySelector("#output-size").textContent = `${config.aspectRatio} · PNG ${size.width * config.pixelRatio} × ${size.height * config.pixelRatio} px`;
    document.title = `${config.title}－圖表預覽`;
    chart = echarts.init(document.querySelector("#chart"), null, { renderer: "canvas", width: size.width, height: size.height });
    chart.setOption(optionBuilders[config.type](size));
    requestAnimationFrame(fitPreview);
  }).catch((error) => {
    document.querySelector("#chart-error").textContent = `無法載入圖表：${error.message}`;
  });
})();
