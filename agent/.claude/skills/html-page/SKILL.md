---
name: html-page
description: 创建和修改单文件 HTML 网页应用，使用 React + TailwindCSS + Babel Standalone 技术栈，无需构建工具
---

## 技术栈

生成的 `index.html` 必须是完整的单文件，使用以下技术栈（**必须严格遵守，不能用 ESM import**）：

- **React 18 + ReactDOM**：通过 unpkg.com UMD 脚本加载，使用全局变量 `React`、`ReactDOM`
- **Tailwind CSS**：通过 CDN 脚本加载
- **Babel Standalone**：通过 unpkg.com 脚本加载，用于支持 JSX 语法
- **Lucide 图标**（可选）：通过 `unpkg.com/lucide@latest` UMD 加载，使用全局变量 `lucide`

## 文件模板（必须使用此结构）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    function App() {
      return (
        <div className="min-h-screen bg-white p-8">
          {/* 页面内容 */}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
```

## 关键规则

- **禁止**使用 `import` 语句，所有库通过全局变量访问
- React hooks 通过解构获取：`const { useState, useEffect, useRef } = React;`
- 脚本类型必须是 `type="text/babel"`（不加 `data-type="module"`）
- Lucide 图标用法：需先在 `<head>` 中加载 UMD 脚本，再使用 `const { Sun, Moon } = lucide;`

```html
<!-- Lucide 图标加载方式 -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

## 代码质量标准

- 使用语义化 HTML 结构
- Tailwind 类名优先，避免内联 style
- 组件拆分合理，主 App 组件不超过 100 行
- 中文内容使用简体中文
- 响应式设计：使用 `sm:` `md:` `lg:` 断点
