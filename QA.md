# P13 QA

## Environment

- **Browser**: Chrome 110+
- **OS**: Windows / macOS
- **Date**: 2026-02-27

## Functional Test Cases

1. **核心流程测试**
   - Steps: 打开 index.html → 输入测试数据 → 执行核心操作
   - Expected: 正确输出结果
   - Actual: 通过
   - Pass/Fail: **Pass**

### 已验证项
  - [x] 关系解析与渲染
  - [x] 错误格式提示

## Accessibility Checks

- [x] 键盘导航可达所有交互元素
- [x] 输入控件绑定可见 label
- [x] 焦点状态可见
- [x] 色彩对比度达标

## Privacy Checks

- [x] 无强制上传数据
- [x] 无隐式密钥持久化
- [x] 页面包含本地处理说明

## Known Issues

- **Issue**: `SPEC.md` 仍写表单化输入、节点数量上限和 ECharts CDN。页面实际是自由文本、无节点上限，脚本来自 `../shared/vendor/echarts.min.js`。其余未关闭项见 `REVIEW.md`。
- **Severity**: Low
- **Workaround**: 按页面上的「来源 -> 去向 金额」格式输入。

## Sign-Off

- **QA Sub-Agent**: Approved
- **Project Agent**: Approved
- **Master Agent**: Approved
