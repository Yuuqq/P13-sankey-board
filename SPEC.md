# P13 Spec - 黑金流向桑基图快捷画板

## 1. Summary

- **Project ID**: P13
- **Project Name**: 黑金流向桑基图快捷画板
- **Goal**: 表单化输入资金流向，一键生成桑基图，支持 SVG/PNG 离线导出
- **User Persona**: 调查记者 / 数据记者

## 2. Scope

- **In scope**:
  - 表单化输入资金流向
  - 一键生成桑基图
  - 支持 SVG/PNG 离线导出
- **Out of scope**:
  - 后端代理或服务端逻辑
  - API Key 持久化存储

## 3. UX

- **Core workflow**: 用户输入 → 前端处理 → 结果展示
- **Inputs**: 资金流向表单（来源→去向→金额）
- **Outputs**: 桑基图 + SVG/PNG 导出
- **States**: empty (初始) / loading (处理中) / error (失败) / success (完成)

## 4. Functional Requirements

1. FR-1: 表单化输入资金流向
2. FR-2: 结果可视化展示
3. FR-3: 错误状态可见提示

## 5. Non-Functional Requirements

- **Performance**: 核心任务 3 分钟内完成
- **Accessibility**: 键盘导航、aria-label、焦点可见、WCAG AA 对比度
- **Privacy**: 本地处理优先，不默认上传数据
- **Browser support**: 现代 Chromium (Chrome 110+)

## 6. Dependencies

- **Libraries/CDNs**: ECharts (CDN)
- **Local data**: 无

## 7. Risks & Mitigations

- **Risk**: 节点过多时渲染卡顿
- **Mitigation**: 限制同时展示节点数量

## 8. Acceptance Criteria

- [ ] 文本关系解析
- [ ] 节点与连线构建
- [ ] 桑基图渲染
- [ ] 错误格式提示
- [ ] 纯静态页面可部署 GitHub Pages
- [ ] 移动端可用
- [ ] 隐私提示清晰可见
