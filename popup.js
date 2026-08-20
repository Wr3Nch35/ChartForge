(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const rowsElement = $("#data-rows");
  const errorElement = $("#form-error");
  const fontLabels = ["系統預設", "微軟正黑體", "Arial", "Georgia", "Courier New"];
  let importedWorkbook = null;
  let importedSheetRows = [];
  let importedSummary = null;
  let importedHeaderName = "";
  let importedFileName = "";
  let restoringImport = false;

  function fillTextStyleControls(container, style) {
    const fontSelect = container.querySelector(".text-font");
    if (!fontSelect.options.length) {
      ChartConfig.fontFamilies.forEach((font, index) => fontSelect.add(new Option(fontLabels[index], font)));
    }
    fontSelect.value = style.fontFamily;
    container.querySelector(".text-size").value = style.fontSize;
    container.querySelector(".text-color").value = style.color;
    container.querySelector(".text-bold").checked = style.bold;
    container.querySelector(".text-italic").checked = style.italic;
  }

  function readTextStyle(container, description) {
    const fontSize = Number(container.querySelector(".text-size").value);
    if (!Number.isInteger(fontSize) || fontSize < 8 || fontSize > 72) {
      throw new Error(`${description}的字體大小必須是 8 至 72。`);
    }
    return {
      fontFamily: container.querySelector(".text-font").value,
      fontSize,
      color: container.querySelector(".text-color").value,
      bold: container.querySelector(".text-bold").checked,
      italic: container.querySelector(".text-italic").checked
    };
  }

  function createTextStyleEditor(style) {
    const details = document.createElement("details");
    details.className = "style-details item-style-details";
    const summary = document.createElement("summary");
    summary.textContent = "項目文字樣式";
    const controls = document.createElement("div");
    controls.className = "text-style-grid";
    controls.innerHTML = `
      <label class="font-control">字體<select class="text-font"></select></label>
      <label>大小<input class="text-size" type="number" min="8" max="72" step="1" inputmode="numeric"></label>
      <label>文字顏色<input class="text-color" type="color"></label>
      <div class="style-toggles" aria-label="項目字型樣式">
        <label class="style-toggle" title="粗體"><input class="text-bold" type="checkbox"><span>粗體</span></label>
        <label class="style-toggle" title="斜體"><input class="text-italic" type="checkbox"><span>斜體</span></label>
      </div>`;
    details.append(summary, controls);
    fillTextStyleControls(controls, style);
    return details;
  }

  function createRow(row) {
    const item = document.createElement("div");
    item.className = "data-item";
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
      item.remove();
      if (!rowsElement.children.length) addRow();
    });

    wrapper.append(name, value, color, remove);
    item.append(wrapper, createTextStyleEditor(row.textStyle));
    rowsElement.append(item);
  }

  function addRow(row) {
    const index = rowsElement.children.length;
    createRow(row || { name: "", value: 0, color: ChartConfig.palette[index % ChartConfig.palette.length], textStyle: ChartConfig.textStyleDefaults() });
    updateValueConstraints();
  }

  function render(config) {
    $("#chart-title").value = config.title;
    $("#chart-type").value = config.type;
    $("#aspect-ratio").value = config.aspectRatio;
    $("#pixel-ratio").value = String(config.pixelRatio);
    fillTextStyleControls($("#title-text-style"), config.titleStyle);
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
    const rows = [...rowsElement.querySelectorAll(".data-item")].map((element, index) => {
      const name = element.querySelector(".item-name").value.trim();
      const rawValue = element.querySelector(".item-value").value;
      const value = Number(rawValue);
      if (!name) throw new Error(`第 ${index + 1} 筆資料缺少項目名稱。`);
      if (rawValue.trim() === "" || !Number.isFinite(value)) throw new Error(`「${name}」的數值無效。`);
      if ($("#chart-type").value === "pie" && value < 0) throw new Error(`圓餅圖的「${name}」數值不可為負數。`);
      return {
        name,
        value,
        color: element.querySelector(".item-color").value,
        textStyle: readTextStyle(element.querySelector(".text-style-grid"), `「${name}」`)
      };
    });
    if (!rows.length) throw new Error("請至少新增一筆資料。");
    if ($("#chart-type").value === "pie" && rows.every((row) => row.value === 0)) throw new Error("圓餅圖至少需要一個大於 0 的數值。");
    return {
      title,
      titleStyle: readTextStyle($("#title-text-style"), "標題"),
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

  function setImportStatus(message, isError = false) {
    const status = $("#import-status");
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function resetImportSelectors() {
    $("#sheet-select").replaceChildren(new Option("請先選擇檔案", ""));
    $("#column-select").replaceChildren(new Option("請先選擇標題列", ""));
    $("#sheet-select").disabled = true;
    $("#header-row").disabled = true;
    $("#header-row").value = "1";
    $("#column-select").disabled = true;
    $("#apply-import").disabled = true;
    importedSheetRows = [];
  }

  async function saveImportSession() {
    if (restoringImport || !importedSummary?.length) return;
    try {
      await chrome.storage.session.set({
        spreadsheetImport: {
          fileName: importedFileName,
          sheetName: $("#sheet-select").value,
          headerRow: Number($("#header-row").value),
          columnIndex: $("#column-select").value,
          headerName: importedHeaderName,
          summary: importedSummary.map(({ name, value }) => ({ name, value }))
        }
      });
    } catch (error) {
      setImportStatus(`目前仍可使用彙總結果，但無法暫存到返回後使用：${error.message}`, true);
    }
  }

  async function restoreImportSession() {
    const { spreadsheetImport } = await chrome.storage.session.get("spreadsheetImport");
    if (!spreadsheetImport) return;
    if (Array.isArray(spreadsheetImport.rows)) {
      await chrome.storage.session.remove("spreadsheetImport");
      return;
    }
    if (!Array.isArray(spreadsheetImport.summary) || !spreadsheetImport.summary.length) return;
    restoringImport = true;
    importedWorkbook = null;
    importedFileName = String(spreadsheetImport.fileName || "Excel 檔案");
    importedSheetRows = [];
    importedHeaderName = String(spreadsheetImport.headerName || "匯入統計");
    importedSummary = spreadsheetImport.summary.map((row, index) => ({
      name: String(row.name),
      value: Number(row.value),
      color: ChartConfig.palette[index % ChartConfig.palette.length],
      textStyle: ChartConfig.textStyleDefaults()
    }));
    const sheetName = String(spreadsheetImport.sheetName || "已暫存工作表");
    $("#sheet-select").replaceChildren(new Option(`${sheetName}（彙總暫存）`, sheetName));
    $("#sheet-select").disabled = true;
    $("#header-row").value = String(spreadsheetImport.headerRow || 1);
    $("#header-row").disabled = true;
    const columnIndex = Number(spreadsheetImport.columnIndex);
    const columnLabel = Number.isInteger(columnIndex) ? `${XLSX.utils.encode_col(columnIndex)} — ${importedHeaderName}` : importedHeaderName;
    $("#column-select").replaceChildren(new Option(`${columnLabel}（彙總）`, String(spreadsheetImport.columnIndex ?? "")));
    $("#column-select").disabled = true;
    $("#apply-import").disabled = false;
    restoringImport = false;
    setImportStatus(`已恢復彙總：${importedFileName}／${sheetName}，不含 Excel 逐筆資料。`);
  }

  function populateColumnOptions() {
    const headerRow = Number($("#header-row").value);
    const columnSelect = $("#column-select");
    columnSelect.replaceChildren();
    $("#apply-import").disabled = true;
    if (!Number.isInteger(headerRow) || headerRow < 1 || headerRow > importedSheetRows.length) {
      columnSelect.add(new Option("標題列超出範圍", ""));
      columnSelect.disabled = true;
      setImportStatus(`請輸入 1 至 ${Math.max(1, importedSheetRows.length)} 之間的標題列。`, true);
      return;
    }

    const headers = importedSheetRows[headerRow - 1] || [];
    headers.forEach((header, index) => {
      const name = String(header).trim();
      if (name) columnSelect.add(new Option(`${XLSX.utils.encode_col(index)} — ${name}`, String(index)));
    });
    if (!columnSelect.options.length) {
      columnSelect.add(new Option("找不到欄位標題", ""));
      columnSelect.disabled = true;
      setImportStatus("標題列沒有可選擇的欄位。", true);
      return;
    }
    columnSelect.disabled = false;
    $("#apply-import").disabled = false;
    setImportStatus(`第 ${headerRow} 列下方共有 ${Math.max(0, importedSheetRows.length - headerRow)} 列可統計。`);
  }

  function populateImportColumns() {
    const sheetName = $("#sheet-select").value;
    const sheet = importedWorkbook?.Sheets[sheetName];
    if (!sheet) {
      importedSheetRows = [];
      $("#header-row").disabled = true;
      populateColumnOptions();
      return;
    }

    if (!sheet["!ref"]) {
      importedSheetRows = [];
      $("#header-row").disabled = true;
      $("#column-select").replaceChildren(new Option("工作表沒有資料", ""));
      $("#column-select").disabled = true;
      $("#apply-import").disabled = true;
      setImportStatus("所選工作表沒有可匯入的資料。", true);
      return;
    }

    const range = XLSX.utils.decode_range(sheet["!ref"]);
    range.s = { r: 0, c: 0 };
    importedSheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: true, range });
    const firstContentRow = importedSheetRows.findIndex((row) => row.some((cell) => String(cell).trim() !== ""));
    if (firstContentRow < 0) {
      $("#header-row").disabled = true;
      $("#column-select").replaceChildren(new Option("工作表沒有資料", ""));
      $("#column-select").disabled = true;
      $("#apply-import").disabled = true;
      setImportStatus("所選工作表沒有可匯入的資料。", true);
      return;
    }
    $("#header-row").max = String(importedSheetRows.length);
    $("#header-row").value = String(firstContentRow + 1);
    $("#header-row").disabled = false;
    populateColumnOptions();
  }

  async function loadSpreadsheet(file) {
    await chrome.storage.session.remove("spreadsheetImport");
    importedSummary = null;
    importedHeaderName = "";
    resetImportSelectors();
    if (!file) {
      importedWorkbook = null;
      importedFileName = "";
      setImportStatus("");
      return;
    }
    setImportStatus("正在讀取檔案…");
    try {
      importedFileName = file.name;
      const buffer = await file.arrayBuffer();
      importedWorkbook = XLSX.read(buffer, { type: "array" });
      const sheetSelect = $("#sheet-select");
      sheetSelect.replaceChildren();
      importedWorkbook.SheetNames.forEach((name) => sheetSelect.add(new Option(name, name)));
      if (!sheetSelect.options.length) throw new Error("檔案內沒有工作表。");
      sheetSelect.disabled = false;
      populateImportColumns();
    } catch (error) {
      importedWorkbook = null;
      importedFileName = "";
      resetImportSelectors();
      setImportStatus(`無法讀取檔案：${error.message}`, true);
    }
  }

  function applySpreadsheetImport() {
    if (!importedSheetRows.length && importedSummary?.length) {
      rowsElement.replaceChildren();
      importedSummary.forEach(createRow);
      $("#chart-title").value = importedHeaderName;
      updateValueConstraints();
      setImportStatus(`已重新套用 ${importedSummary.length} 個彙總項目；暫存中不含 Excel 逐筆資料。`);
      return;
    }
    const columnIndex = Number($("#column-select").value);
    const headerRow = Number($("#header-row").value);
    const headerIndex = headerRow - 1;
    if (!Number.isInteger(columnIndex) || !Number.isInteger(headerRow) || headerIndex < 0 || headerIndex >= importedSheetRows.length) {
      setImportStatus("請先選擇要統計的欄位。", true);
      return;
    }
    const header = String(importedSheetRows[headerIndex][columnIndex]).trim();
    const counts = new Map();
    importedSheetRows.slice(headerIndex + 1).forEach((row) => {
      const value = String(row[columnIndex] ?? "").trim();
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    });
    if (!counts.size) {
      setImportStatus(`「${header}」欄位沒有可統計的內容。`, true);
      return;
    }

    const rows = [...counts].map(([name, value], index) => ({
      name,
      value,
      color: ChartConfig.palette[index % ChartConfig.palette.length],
      textStyle: ChartConfig.textStyleDefaults()
    }));
    importedHeaderName = header;
    importedSummary = rows;
    rowsElement.replaceChildren();
    rows.forEach(createRow);
    $("#chart-title").value = header;
    updateValueConstraints();
    setImportStatus(`已統計第 ${headerRow} 列下方的資料，共產生 ${rows.length} 個項目。`);
    void saveImportSession();
  }

  $("#add-row").addEventListener("click", () => addRow());
  $("#excel-file").addEventListener("change", (event) => loadSpreadsheet(event.target.files[0]));
  $("#sheet-select").addEventListener("change", () => { importedSummary = null; void chrome.storage.session.remove("spreadsheetImport"); populateImportColumns(); });
  $("#header-row").addEventListener("input", () => { importedSummary = null; void chrome.storage.session.remove("spreadsheetImport"); populateColumnOptions(); });
  $("#column-select").addEventListener("change", () => { importedSummary = null; void chrome.storage.session.remove("spreadsheetImport"); $("#apply-import").disabled = !$("#column-select").value; });
  $("#apply-import").addEventListener("click", applySpreadsheetImport);
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
    await chrome.storage.session.remove("spreadsheetImport");
    importedWorkbook = null;
    importedFileName = "";
    importedSummary = null;
    importedHeaderName = "";
    resetImportSelectors();
    $("#excel-file").value = "";
    setImportStatus("");
    render(config);
    errorElement.textContent = "";
  });
  $("#chart-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    errorElement.textContent = "";
    try {
      const config = collectAndValidate();
      await chrome.storage.local.set({ chartConfig: config });
      await saveImportSession();
      const tab = await chrome.tabs.create({ url: chrome.runtime.getURL("chart.html") });
      const trackingResult = await chrome.runtime.sendMessage({ type: "track-chartforge-tab", tabId: tab.id });
      if (!trackingResult?.ok) throw new Error(trackingResult?.error || "無法追蹤圖表分頁。");
    } catch (error) {
      errorElement.textContent = error.message || "無法產生圖表，請檢查輸入內容。";
    }
  });

  chrome.storage.local.get("chartConfig").then(({ chartConfig }) => render(ChartConfig.normalize(chartConfig)));
  restoreImportSession().catch((error) => setImportStatus(`無法恢復暫存資料：${error.message}`, true));
})();
