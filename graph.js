/**
 * Pure Sankey text parser. No DOM.
 * Browser: window.SankeyGraph. Node: module.exports.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) root.SankeyGraph = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function parseLine(line) {
    if (line.trim().startsWith("#")) return "comment";

    const m = line.match(/^\s*(.+?)\s*->\s*(.+?)\s+([0-9]+(?:\.[0-9]+)?)\s*$/);
    if (!m) return null;

    const source = m[1].trim();
    const target = m[2].trim();
    const value = Number(m[3]);
    if (!source || !target || !Number.isFinite(value) || value <= 0) return null;

    return { source, target, value };
  }

  function parseGraphText(text) {
    const lines = String(text || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const invalidLines = [];
    const validLinks = [];
    let selfLoopCount = 0;

    for (const line of lines) {
      const parsed = parseLine(line);
      if (parsed === "comment") continue;
      if (parsed === null) {
        invalidLines.push(line);
        continue;
      }
      if (parsed.source === parsed.target) {
        selfLoopCount += 1;
        continue;
      }
      validLinks.push(parsed);
    }

    const bySource = new Map();
    for (const link of validLinks) {
      let byTarget = bySource.get(link.source);
      if (!byTarget) {
        byTarget = new Map();
        bySource.set(link.source, byTarget);
      }
      const prev = byTarget.get(link.target);
      if (prev) prev.value += link.value;
      else byTarget.set(link.target, { source: link.source, target: link.target, value: link.value });
    }

    const links = [];
    for (const byTarget of bySource.values()) {
      for (const link of byTarget.values()) links.push(link);
    }

    const names = new Set();
    links.forEach(l => {
      names.add(l.source);
      names.add(l.target);
    });

    return {
      nodes: [...names].map(name => ({ name })),
      links,
      invalidLines,
      selfLoopCount
    };
  }

  function hasCycle(links) {
    const adj = new Map();
    for (const l of links) {
      if (!adj.has(l.source)) adj.set(l.source, []);
      adj.get(l.source).push(l.target);
    }

    const visited = new Set();
    const recursionStack = new Set();

    function dfs(node) {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) return true;
      }

      recursionStack.delete(node);
      return false;
    }

    for (const node of adj.keys()) {
      if (dfs(node)) return true;
    }
    return false;
  }

  function issueWarning(graph) {
    const bits = [];
    const invalidCount = graph && graph.invalidLines ? graph.invalidLines.length : 0;
    const selfLoopCount = graph && graph.selfLoopCount ? graph.selfLoopCount : 0;
    if (invalidCount) bits.push(`忽略了 ${invalidCount} 行无效输入`);
    if (selfLoopCount) bits.push(`忽略了 ${selfLoopCount} 条自环`);
    return bits.length ? `。（警告：${bits.join("；")}）` : "";
  }

  return { parseLine, parseGraphText, hasCycle, issueWarning };
});
