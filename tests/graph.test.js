/**
 * Run: node tests/graph.test.js
 */
const assert = require("assert");
const { parseLine, parseGraphText, hasCycle, issueWarning } = require("../graph.js");

function link(source, target, value) {
  return { source, target, value };
}

assert.deepStrictEqual(parseLine("A -> B 500"), link("A", "B", 500));
assert.deepStrictEqual(parseLine("A->B 500"), link("A", "B", 500));
assert.deepStrictEqual(parseLine("A -> B 1.5"), link("A", "B", 1.5));
assert.deepStrictEqual(parseLine("  A  ->  B  12.0  "), link("A", "B", 12));
assert.deepStrictEqual(parseLine("母公司 -> A子公司 2500"), link("母公司", "A子公司", 2500));

for (const bad of ["A -> B 1.2.3", "A -> B .", "A -> B .5", "A -> B -5", "A -> B 100.", "A -> B 0", "A -> B 0.0", "A ->   100", "   -> B 100", "财政收入,教育支出,500", "A -> B 100 # note"]) {
  assert.strictEqual(parseLine(bad), null, bad);
}
assert.strictEqual(parseLine("# hello"), "comment");
assert.deepStrictEqual(parseLine("A -> A 100"), link("A", "A", 100));

const mixed = parseGraphText(`# comment
A -> B 100
A -> A 50
A -> B 20
bad line
C -> C 9
B -> C 10
财政收入,教育支出,500
A -> B 1.2.3
`);
assert.strictEqual(mixed.selfLoopCount, 2);
assert.deepStrictEqual(mixed.invalidLines, ["bad line", "财政收入,教育支出,500", "A -> B 1.2.3"]);
assert.deepStrictEqual(mixed.links, [link("A", "B", 120), link("B", "C", 10)]);
assert.ok(issueWarning(mixed).includes("忽略了 3 行无效输入"));
assert.ok(issueWarning(mixed).includes("忽略了 2 条自环"));

const onlySelf = parseGraphText("A -> A 100\nB -> B 200");
assert.deepStrictEqual(onlySelf.links, []);
assert.strictEqual(onlySelf.selfLoopCount, 2);
assert.deepStrictEqual(onlySelf.invalidLines, []);
assert.ok(issueWarning(onlySelf).includes("自环"));
assert.ok(!issueWarning(onlySelf).includes("无效"));

const onlyInvalid = parseGraphText("foo\nbar,baz,1");
assert.strictEqual(onlyInvalid.links.length, 0);
assert.deepStrictEqual(onlyInvalid.invalidLines, ["foo", "bar,baz,1"]);

const collided = parseGraphText("A::B -> C 1\nA -> B::C 2");
assert.strictEqual(collided.links.length, 2);
assert.deepStrictEqual(collided.links[0], link("A::B", "C", 1));
assert.deepStrictEqual(collided.links[1], link("A", "B::C", 2));

const emptyTarget = parseGraphText("A ->   100\nA -> B 5");
assert.deepStrictEqual(emptyTarget.invalidLines, ["A ->   100"]);
assert.deepStrictEqual(emptyTarget.links, [link("A", "B", 5)]);

assert.strictEqual(issueWarning(parseGraphText("A -> B 1")), "");

function edges(pairs) {
  return pairs.map(([s, t]) => link(s, t, 1));
}
assert.strictEqual(hasCycle(edges([["A", "B"], ["B", "A"]])), true);
assert.strictEqual(hasCycle(edges([["A", "B"], ["B", "C"], ["C", "A"]])), true);
assert.strictEqual(hasCycle(edges([["A", "B"], ["B", "C"]])), false);
assert.strictEqual(hasCycle(edges([["A", "B"], ["B", "C"], ["C", "B"]])), true);
assert.strictEqual(hasCycle(edges([["A", "B"], ["C", "D"], ["D", "C"]])), true);
assert.strictEqual(hasCycle(edges([["A", "B"], ["C", "A"]])), false);

const demo = `# 企业资金流向分析示例
母公司 -> A子公司 2500
母公司 -> B子公司 1800
母公司 -> C控股 1200
母公司 -> 海外投资 800
A子公司 -> 供应商甲 600
A子公司 -> 供应商乙 450
A子公司 -> 项目研发 350
A子公司 -> 营销推广 280
A子公司 -> 离岸账户 520
B子公司 -> 代工厂X 400
B子公司 -> 代工厂Y 320
B子公司 -> 渠道商 280
B子公司 -> 咨询公司 350
B子公司 -> 关联个人 180
C控股 -> 基金A 400
C控股 -> 基金B 350
C控股 -> 股权投资 280
离岸账户 -> 境外公司1 300
离岸账户 -> 境外公司2 220
咨询公司 -> 壳公司 280
关联个人 -> 个人账户 180
境外公司1 -> 最终受益人 300
壳公司 -> 最终受益人 280
个人账户 -> 最终受益人 180`;
const demoGraph = parseGraphText(demo);
assert.strictEqual(demoGraph.nodes.length, 23);
assert.strictEqual(demoGraph.links.length, 24);
assert.strictEqual(demoGraph.invalidLines.length, 0);
assert.strictEqual(demoGraph.selfLoopCount, 0);
assert.strictEqual(hasCycle(demoGraph.links), false);

console.log("graph.test.js ok");
