# 团队知识库

## 项目信息

- 项目名称：冰雪之巅 - 滑雪板单板租赁平台
- 路径：`D:\ai project\snowboard-rental`
- 技术栈：HTML5 + CSS3 + JavaScript (原生)
- 数据存储：localStorage

## 文件结构

```
snowboard-rental/
├── index.html          # 单页面应用主入口
├── css/styles.css      # 冰雪主题样式（约1400行）
├── js/
│   ├── data.js         # 数据层（12款单板+6种配件）
│   ├── app.js          # 主应用逻辑和路由
│   ├── cart.js         # 购物车模块
│   ├── order.js        # 订单流程模块
│   └── admin.js        # 管理员面板模块
└── images/             # 图片目录
```

## 命名规范

统一使用 `SnowboardData` 命名空间风格：
- `SnowboardData.getProducts()` - 获取产品列表
- `SnowboardData.getAccessories()` - 获取配件列表
- `SnowboardData.saveCart()` - 保存购物车

## 验证标准

### 通过条件
- 文件结构完整
- 单板数据 ≥ 10款
- 配件数据 ≥ 6种
- 所有JS文件使用统一命名空间风格
- 代码无语法错误
- UI响应式布局正常

### 常见失败原因
1. 数据数量不足
2. 代码风格不统一（混合命名空间和扁平函数）
3. 功能模块缺失

## 团队协作模式

### coder + verifier 协作流程
1. coder 实现功能
2. verifier 独立验证
3. 如有问题，打回 coder 修复
4. 重复直到通过

### improver 学习流程
1. 收集其他agent的工作报告
2. 分析成功和失败模式
3. 更新知识库
4. 生成进化报告

## 经验总结

### 成功的任务模式
- 明确的需求规格 → 高效实现
- 清晰的验证标准 → 快速通过

### 需要避免的问题
- 模糊的命名空间风格 → verifier FAIL
- 数据数量不足 → verifier FAIL
- 代码风格不统一 → verifier FAIL