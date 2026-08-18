(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const rowsElement = $("#data-rows");
  const errorElement = $("#form-error");

  function createRow(row) {
    const wrapper = document.createElement("div");
    wrapper.className = "data-row";

    const name = document.createElement("input");
    name.type = "text";
    name.className = "item-name";
    name.placeholder = "項目名稱";
    name.maxLength = 60;
    name.value = row.name;
    name.setAttribute("aria-label", "項目名稱");

    const value = document.createElement("input");
    value.type = "number";
    value.className = "item-value";
    value.placeholder = "0";
    value.min = "0";
    value.step = "any";
    value.value = Number.isFinite(row.value) ? row.value : "";
    value.setAttribute("aria-label", "數值");

    const color = document.createElement("input");
    color.type = "color";
    color.className = "item-color";
    color.value = row.color;
    color.setAttribute("aria-label", "顏色");

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "×";
    remove.title = "刪除";
    remove.setAttribute("aria-label", "刪除項目");
    remove.addEventListener("click", () => {
      wrapper.remove();
      if (!rowsElement.children.length) addRow();
    });

    wrapper.append(name, value, color, remove);
    rowsElement.append(wrapper);
  }

  function addRow(row) {
    const index = rowsElement.children.length;
    createRow(row || { name: "", value: 0, color: ChartConfig.palette[index % ChartConfig.palette.length] });
    updateValueConstraints();
  }

  function render(config) {
    $("#chart-title").value = config.title;
    $("#chart-type").value = config.type;
    $("#aspect-ratio").value = config.aspectRatio;
    $("#pixel-ratio").value = String(config.pixelRatio);
    document.querySelector(`input[name="theme"][value="${config.theme}"]`).checked = true;
    ChartConfig.applyTheme(config.theme);
    rowsElement.replaceChildren();
    config.rows.forEach(createRow);
    updateResolutionHint();
    updateValueConstraints();
  }

  function collectAndValidate() {
    const title = $("#chart-title").value.trim();
    if (!title) throw new Error("請輸入圖表名稱。");
    const rows = [...rowsElement.querySelectorAll(".data-row")].map((element, index) => {
      const name = element.querySelector(".item-name").value.trim();
      const rawValue = element.querySelector(".item-value").value;
      const value = Number(rawValue);
      if (!name) throw new Error(`第 ${index + 1} 筆資料缺少項目名稱。`);
      if (rawValue.trim() === "" || !Number.isFinite(value)) throw new Error(`「${name}」的數值無效。`);
      if ($("#chart-type").value === "pie" && value < 0) throw new Error(`圓餅圖的「${name}」數值不可為負數。`);
      return { name, value, color: element.querySelector(".item-color").value };
    });
    if (!rows.length) throw new Error("請至少新增一筆資料。");
    if ($("#chart-type").value === "pie" && rows.every((row) => row.value === 0)) throw new Error("圓餅圖至少需要一個大於 0 的數值。");
    return {
      title,
      type: $("#chart-type").value,
      rows,
      aspectRatio: $("#aspect-ratio").value,
      pixelRatio: Number($("#pixel-ratio").value),
      theme: document.querySelector('input[name="theme"]:checked').value
    };
  }

  function updateResolutionHint() {
    const size = ChartConfig.aspectSizes[$("#aspect-ratio").value];
    const ratio = Number($("#pixel-ratio").value);
    $("#resolution-hint").textContent = `PNG 約 ${size.width * ratio} × ${size.height * ratio} px`;
  }

  function updateValueConstraints() {
    const minimum = $("#chart-type").value === "pie" ? "0" : "";
    rowsElement.querySelectorAll(".item-value").forEach((input) => {
      if (minimum) input.min = minimum;
      else input.removeAttribute("min");
    });
  }

  $("#add-row").addEventListener("click", () => addRow());
  $("#aspect-ratio").addEventListener("change", updateResolutionHint);
  $("#pixel-ratio").addEventListener("change", updateResolutionHint);
  $("#chart-type").addEventListener("change", updateValueConstraints);
  document.querySelectorAll('input[name="theme"]').forEach((input) => input.addEventListener("change", async () => {
    ChartConfig.applyTheme(input.value);
    const { chartConfig } = await chrome.storage.local.get("chartConfig");
    await chrome.storage.local.set({ chartConfig: { ...ChartConfig.normalize(chartConfig), theme: input.value } });
  }));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const selected = document.querySelector('input[name="theme"]:checked');
    if (selected?.value === "system") ChartConfig.applyTheme("system");
  });
  $("#reset-button").addEventListener("click", async () => {
    const config = ChartConfig.defaults();
    await chrome.storage.local.set({ chartConfig: config });
    render(config);
    errorElement.textContent = "";
  });
  $("#chart-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    errorElement.textContent = "";
    try {
      const config = collectAndValidate();
      await chrome.storage.local.set({ chartConfig: config });
      await chrome.tabs.create({ url: chrome.runtime.getURL("chart.html") });
    } catch (error) {
      errorElement.textContent = error.message || "無法產生圖表，請檢查輸入內容。";
    }
  });

  chrome.storage.local.get("chartConfig").then(({ chartConfig }) => render(ChartConfig.normalize(chartConfig)));
})();
