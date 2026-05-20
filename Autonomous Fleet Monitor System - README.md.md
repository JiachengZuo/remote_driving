# Autonomous Fleet Monitor System \- README\.md



一个实时自动驾驶车队监控系统，支持车队状态可视化、车辆实时数据监控、网络延迟监测及天气同步，采用现代化UI设计，适配桌面端展示。


## 📋 项目简介

本项目是一个基于Web的实时自动驾驶车队监控面板，主要功能包括：

- 车队整体状态概览（活跃车辆数、告警数量、平均速度）

- 单车辆详细数据监控（位置、速度、电量、传感器状态）

- 车辆实时位置可视化（基于ECharts散点图实现）

- 网络延迟实时监测及历史趋势展示

- 深圳地区天气自动同步（5分钟刷新一次）

- 告警日志实时记录与展示

## 📁 项目结构

项目采用HTML、CSS、JS分离架构，结构清晰，便于维护和扩展：

```plain text
Autonomous-Fleet-Monitor/
├─ index.html       # 主页面结构，负责页面布局和组件引入
├─ style.css        # 样式文件，负责页面美化和响应式适配
├─ script.js        # 脚本文件，负责交互逻辑、数据渲染和接口请求
└─ README.md        # 项目说明文档（本文件）
```

## 🔧 环境要求

本项目为纯前端项目，无需后端部署，仅需满足以下基础环境：

- 浏览器：Chrome、Firefox、Edge等现代浏览器（建议Chrome 80\+）

- 网络：需联网（用于加载ECharts、天气接口和天气图标）

- WebSocket服务：本地需启动WebSocket服务（默认地址：ws://localhost:8888），用于接收车辆实时数据

## 🚀 快速开始

### 1\. 克隆项目

```bash
# 克隆本仓库到本地
git clone https://github.com/your-username/Autonomous-Fleet-Monitor.git

# 进入项目目录
cd Autonomous-Fleet-Monitor
```

### 2\. 启动项目

方式1：直接打开 `index\.html` 文件（双击即可在默认浏览器打开）

方式2：使用VS Code等编辑器，通过Live Server插件启动（推荐，避免跨域问题）

### 3\. 启动WebSocket服务

项目依赖WebSocket服务接收车辆实时数据，可通过以下方式快速启动测试服务：

```bash
# 安装ws依赖（需提前安装Node.js）
pip install websockets
```

### 4\. 查看效果

启动后，浏览器页面将实时展示车辆数据、地图位置、网络延迟等信息，WebSocket服务会每秒推送一次模拟数据，用于测试交互效果。

## 📊 功能详情

### 1\. 车队状态面板（左侧）

- 显示活跃车辆数、总车辆数，以及空闲、维护状态车辆数

- 展示告警数量（严重告警、警告告警）

- 显示车队平均速度及速度梯度条

- 车辆列表可点击切换查看单车辆详情

### 2\. 地图可视化（中间）

- 采用ECharts散点图展示车辆实时位置，不同车辆用不同颜色区分

- 选中车辆时，地图上对应车辆图标放大，突出显示

- 右侧提供地图缩放、移动等控制按钮

- 右上角告警日志实时展示车辆异常信息

### 3\. 车辆详情面板（右侧）

- 显示当前选中车辆的详细信息（位置、速度、电量）

- 展示传感器状态（激光雷达、摄像头、雷达）

- 显示车辆当前状态（正常/告警）及告警信息

### 4\. 网络延迟监测（右下角）

- 实时显示当前选中车辆的网络延迟（单位：ms）

- 用折线图展示最近15秒的延迟趋势

- 延迟超过100ms时，数值显示为红色，提示异常

### 5\. 天气同步（左上角）

- 自动获取深圳地区实时天气（温度、天气状况、风速）

- 每5分钟自动刷新一次天气数据

## ⚙️ 自定义配置

### 1\. 修改天气地区

打开 `script\.js`，找到 `getWeather` 函数，修改请求地址中的地区参数（支持全球城市）：

```javascript
// 原地址（深圳）
const res = await fetch("https://wttr.in/Shenzhen?format=j1");

// 修改为其他城市（例如北京）
const res = await fetch("https://wttr.in/Beijing?format=j1");
```

### 2\. 修改WebSocket地址

打开 `script\.js`，修改WebSocket连接地址：

```javascript
// 原地址
const ws = new WebSocket('ws://localhost:8888');

// 修改为实际WebSocket服务地址
const ws = new WebSocket('ws://your-server-ip:your-port');
```

### 3\. 修改地图背景

打开 `style\.css`，找到 `\#map\-container` 的 `background` 属性，替换为自定义地图背景图片：

```css
#map-container {
  background: url("your-map-image.svg") no-repeat center center; /* 替换为自定义图片路径 */
  background-size: cover;
}
```

## ⚠️ 注意事项

- 天气接口采用 `wttr\.in` 免费接口，无需APIKey，若接口不可用，可替换为其他天气接口

- WebSocket服务为必填项，若未启动，车辆数据将无法实时更新，页面显示默认值

- 页面适配桌面端，移动端显示效果可能不佳

- 地图背景默认使用 `1\.svg`，若该文件不存在，需自行添加或替换为其他图片

## 📌 技术栈

- 前端：HTML5、CSS3、JavaScript（原生）

- 可视化：ECharts 5\.4\.3（散点图、折线图）

- 网络：WebSocket（实时数据传输）

- 接口：wttr\.in（天气数据接口）

## 🤝 贡献指南

1. Fork 本仓库

2. 创建特性分支：`git checkout \-b feature/xxx`

3. 提交代码：`git commit \-m \&\#39;feat: 新增xxx功能\&\#39;`

4. 推送分支：`git push origin feature/xxx`

5. 提交Pull Request


