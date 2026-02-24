# Business Rules Visualizer

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![ServiceNow](https://img.shields.io/badge/ServiceNow-Fluent%20SDK%204.2-green)
![React](https://img.shields.io/badge/React-19-blue)
![React Flow](https://img.shields.io/badge/React%20Flow-11-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

Visualize business rules easily in ServiceNow. **Business Rules Visualizer** brings a clear, interactive React Flow diagram to your instance, showing exactly how and when your business rules execute—built with React, TypeScript, and ServiceNow Fluent SDK.

## Why Use This?

Understanding the execution order of Business Rules on a table can be a headache: clicking through lists, checking execution orders, and mentally mapping out Before, After, Async, and Display rules. This tool visualizes the entire pipeline.

**Key Benefits:**
- **Visual Pipelines**: See all rules for a table split into Record Write (Before, After, Async) and Form Load (Display) pipelines.
- **Execution Sequencing**: Rules are sorted by `order` and connected with sequential edges to communicate execution sequencing clearly.
- **Inheritance Visibility**: Instantly spot inherited rules with dashed amber borders and clear badges showing the ancestor table.
- **Interactive Details**: Click any rule to slide in a detail panel showing metadata, conditions, and the full script content.
- **Smart Search**: Autocomplete combobox for table search with live filtering and recent tables history.

## Quick Start

**Prerequisites:** ServiceNow instance with admin rights, Node.js 14.x+, ServiceNow SDK 4.2.0+

```bash
# 1. Clone and install
git clone https://github.com/DanielMadsenDK/BusinessRulesVisualizer
cd BusinessRulesVisualizer
npm install

# 2. Authenticate with ServiceNow
now-sdk auth

# 3. Build and deploy
now-sdk build
now-sdk install
```

**Access the app:** Navigate to **Apps > Business Rules Visualizer > Business Rule Flow** in your instance, or go directly to `https://<instance>.service-now.com/x_1118332_brv_visualizer.do`.


**Workflow:** Edit → `now-sdk build && now-sdk install` → Test in instance

**Files to know:**
- `src/fluent/script-includes/BusinessRuleService.server.js` - ServiceNow server logic (GlideAjax)
- `src/client/app.tsx` - Main React application and React Flow element builder
- `src/client/components/` - React components (Nodes, DetailPanel, TableSelector)
- `src/client/services/BusinessRuleService.ts` - Typed GlideAjax wrappers

## License

Licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.

## Author

**Daniel Aagren Seehartrai Madsen** • ServiceNow Rising Star 2025

Built with ServiceNow Fluent SDK, React, TypeScript, and a passion for making ServiceNow administration easier.

---

**Star this repo if it saves you time!**
