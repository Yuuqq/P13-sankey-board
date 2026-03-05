/**
 * P13 黑金流向桑基图快捷画板
 * Upgraded: SVG/PNG export functionality
 */
const input = document.getElementById("input");
const drawBtn = document.getElementById("drawBtn");
const exportSvgBtn = document.getElementById("exportSvgBtn");
const exportPngBtn = document.getElementById("exportPngBtn");
const statusEl = document.getElementById("status");
const chartEl = document.getElementById("chart");
let chartInstance = null;

input.value = `A公司 -> B公司 500
B公司 -> C基金 180
A公司 -> D咨询 300
D咨询 -> E个人 120`;

function setStatus(text) {
  statusEl.textContent = `状态: ${text}`;
}

function parseLine(line) {
  const m = line.match(/^\s*(.+?)\s*->\s*(.+?)\s+([0-9.]+)\s*$/);
  if (!m) return null;
  return {
    source: m[1].trim(),
    target: m[2].trim(),
    value: Number(m[3])
  };
}

function pad(n) { return String(n).padStart(2, "0"); }

function makeFilename(ext) {
  const now = new Date();
  return `sankey-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.${ext}`;
}

function parseGraph() {
  const lines = input.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const links = lines.map(parseLine).filter(Boolean);
  if (!links.length) return null;

  const set = new Set();
  links.forEach(l => {
    set.add(l.source);
    set.add(l.target);
  });
  const nodes = [...set].map(name => ({ name }));
  return { nodes, links };
}

function ensureChart() {
  if (chartInstance) return chartInstance;
  if (!window.echarts) return null;
  try {
    chartEl.replaceChildren();
    chartInstance = window.echarts.init(chartEl, null, { renderer: "svg" });
    window.addEventListener("resize", () => {
      try { chartInstance?.resize(); } catch (_e) {}
    });
    return chartInstance;
  } catch (_e) {
    return null;
  }
}

function renderTextPreview(nodes, links, reason) {
  const wrap = document.createElement("div");
  wrap.className = "chart-preview";

  const note = document.createElement("p");
  note.className = "chart-preview-note";
  note.textContent = `图形库未加载（${reason}），已降级为文本预览。`;

  const meta = document.createElement("p");
  meta.className = "chart-preview-meta";
  meta.textContent = `节点 ${nodes.length} 个 · 关系 ${links.length} 条`;

  const nodeSample = document.createElement("p");
  nodeSample.className = "chart-preview-sample";
  const sample = nodes.slice(0, 28).map(n => n.name).join("、");
  nodeSample.textContent = `节点示例：${sample}${nodes.length > 28 ? " …" : ""}`;

  const pre = document.createElement("pre");
  pre.className = "chart-preview-pre";
  const maxEdges = 160;
  pre.textContent = links.slice(0, maxEdges).map(l => `${l.source} -> ${l.target} ${l.value}`).join("\n") + (links.length > maxEdges ? "\n…" : "");

  wrap.append(note, meta, nodeSample, pre);
  chartEl.replaceChildren(wrap);
}

function draw() {
  const graph = parseGraph();
  if (!graph) {
    setStatus("未识别到有效关系，格式示例：A -> B 500");
    return;
  }

  const instance = ensureChart();
  if (!instance) {
    renderTextPreview(graph.nodes, graph.links, "外链脚本不可用");
    setStatus(`已解析关系（降级模式：外链脚本不可用）`);
    return;
  }

  instance.setOption({
    tooltip: { trigger: "item" },
    series: [{
      type: "sankey",
      data: graph.nodes,
      links: graph.links,
      lineStyle: { color: "source", curveness: 0.5 },
      emphasis: { focus: "adjacency" },
      nodeGap: 12
    }]
  });
  setStatus(`已生成桑基图，关系 ${graph.links.length} 条，节点 ${graph.nodes.length} 个`);
}

/**
 * Export chart as SVG file download
 */
function exportSvg() {
  try {
    if (!chartInstance) {
      setStatus("离线降级模式下无法导出，请联网后再试");
      return;
    }
    const svgEl = chartEl.querySelector("svg");
    if (!svgEl) {
      setStatus("请先生成桑基图");
      return;
    }
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svgEl);
    // Add XML declaration and namespace
    if (!svgStr.includes("xmlns")) {
      svgStr = svgStr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFilename("svg");
    a.click();
    URL.revokeObjectURL(url);
    setStatus("SVG 导出成功");
  } catch (err) {
    setStatus(`SVG 导出失败: ${err.message}`);
  }
}

/**
 * Export chart as PNG file download using ECharts built-in getDataURL
 */
function exportPng() {
  try {
    if (!chartInstance) {
      setStatus("离线降级模式下无法导出，请联网后再试");
      return;
    }
    const dataUrl = chartInstance.getDataURL({
      type: "png",
      pixelRatio: 3,
      backgroundColor: "#fff"
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = makeFilename("png");
    a.click();
    setStatus("PNG 导出成功（3x 高清）");
  } catch (err) {
    setStatus(`PNG 导出失败: ${err.message}`);
  }
}

drawBtn.addEventListener("click", () => {
  draw();
});

exportSvgBtn.addEventListener("click", () => {
  try {
    exportSvg();
  } catch (err) { setStatus(`SVG 导出失败: ${err.message}`); }
});

exportPngBtn.addEventListener("click", () => {
  try {
    exportPng();
  } catch (err) { setStatus(`PNG 导出失败: ${err.message}`); }
});

// Auto-render with default data
drawBtn.click();

// === PM Metrics Integration ===
(function() {
  try {
    if (!window.pmMetrics) return;
    // Auto mark task start on first meaningful interaction
    let taskStarted = false;
    document.addEventListener('click', function(e) {
      if (taskStarted) return;
      const btn = e.target.closest('button');
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart('sankey_draw_task');
      }
    }, { once: false });
  } catch (_e) {}
})();
