
let currentCar = null;
let carData = {};
let pingHistory = [];
const MAX_PING_LEN = 15;

const mapChart = echarts.init(document.getElementById('map-container'));
const pingChart = echarts.init(document.getElementById('pingLineChart'));

// ====================== 【两点精准拟合 - 只对齐前两个点】 ======================
// GPS (-79.378, 88.817) → 网页 (7.5, 60)
// GPS (-110.448, 10.581) → 网页 (22, 54)
function gpsToMap(lon, lat) {
    const x = -0.4667 * lon - 29.54;
    const y = 0.0767 * lat + 53.19;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

// 初始化地图（空数据）
mapChart.setOption({
    backgroundColor: 'transparent',
    xAxis: { show: false, min: 0, max: 100 },
    yAxis: { show: false, min: 0, max: 100 },
    series: [{
        type: 'scatter', zlevel: 10, symbol: 'pin', symbolSize: 28,
        data: [],
        label: { show: true, position: 'bottom', formatter: '{b}', color: '#fff', backgroundColor: 'rgba(0,0,0,.7)' }
    }]
});

function initPingChart(color = "#4aff77") {
    pingChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,30,60,.8)', textStyle: { color: '#fff' } },
        grid: { left: 10, right: 10, top: 15, bottom: 20 },
        xAxis: { type: 'category', data: [], axisLine: { color: 'rgba(74,201,255,.3)' }, axisLabel: { show: false } },
        yAxis: { type: 'value', splitLine: { color: 'rgba(74,201,255,.15)' }, axisLabel: { color: '#a0d8ff', fontSize: 10 } },
        series: [{
            type: 'line', smooth: true, symbol: 'none', lineStyle: { color, width: 2 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: color + '60' },
                    { offset: 1, color: color + '05' }
                ])
            },
            data: []
        }]
    });
}
initPingChart();

// WebSocket 接收数据
const ws = new WebSocket('ws://localhost:8888');
ws.onmessage = (e) => {
    try {
        carData = JSON.parse(e.data);
        refreshAllUI();
    } catch (err) {
        console.error("数据解析失败", err);
    }
};

function refreshAllUI() {
    if (!carData) return;
    const vehicleList = document.getElementById("vehicleList");
    vehicleList.innerHTML = ""; // 清空旧列表

    const mapPoints = [];
    let alertCount = 0;
    let totalSpeed = 0;
    let carCount = 0;

    // ========== 动态遍历所有车辆 ==========
    for (const carId of Object.keys(carData)) {
        const car = carData[carId];
        if (!car) continue;

        const safeId = carId.replace(/-/g, '_');
        const speed = Number(car.speed) || 0;
        const battery = Number(car.battery) || 0;
        const isFault = car.lidar === "Fault" || car.camera === "Degraded";
        if (isFault) alertCount++;

        totalSpeed += speed;
        carCount++;

        // 颜色
        const carColor = carId.startsWith("AV-S") ? "#4aff77" : "#4a9eff";

        // 构建车辆列表项
        const item = document.createElement("div");
        item.className = "vehicle-item";
        item.dataset.id = carId;
        item.innerHTML = `
            <div class="vehicle-info">
                <span>🚗</span>
                <div>
                    <div>${carId}</div>
                    <div style="font-size:11px;opacity:0.7;">${isFault ? "ALERT" : "Active"}</div>
                </div>
            </div>
            <div>
                <div id="${safeId}_speed">${speed.toFixed(1)}km/h</div>
                <div style="font-size:11px;opacity:0.7;">Batt. <span id="${safeId}_batt">${Math.ceil(battery)}</span>%</div>
            </div>
        `;
        vehicleList.appendChild(item);

        // 异常边框
        if (isFault) {
            item.style.setProperty('border-left', '4px solid #ff4d4f', 'important');
        } else {
            item.style.setProperty('border-left', '3px solid transparent', 'important');
        }

        // ====================== ✅ 核心修复：自动 GPS 转换 ======================
        const pos = gpsToMap(car.gps[0], car.gps[1]);

        mapPoints.push({
            value: pos,
            name: carId,
            itemStyle: { color: isFault ? "#ff4d4f" : carColor },
            symbolSize: currentCar === carId ? 40 : 28
        });
    }

    // ========== 默认选中第一辆车 ==========
    if (!currentCar || !carData[currentCar]) {
        const firstCar = Object.keys(carData)[0];
        if (firstCar) {
            currentCar = firstCar;
            document.querySelector(`[data-id="${currentCar}"]`)?.classList.add("active");
        }
    }

    // ========== 刷新地图 ==========
    mapChart.setOption({ series: [{ data: mapPoints }] });

    // ========== 刷新统计 ==========
    document.getElementById("alertCount").innerText = alertCount;
    const avgSpeed = carCount > 0 ? (totalSpeed / carCount).toFixed(0) : 0;
    document.getElementById("avgSpeed").innerText = avgSpeed;

    // ========== 当前选中车辆的详情 ==========
    const d = carData[currentCar];
    if (d) {
        document.getElementById("carSpeed").innerText = (Number(d.speed) || 0).toFixed(1) + " km/h";
        document.getElementById("carBatt").innerText = Math.ceil(Number(d.battery) || 0) + "%";
        document.getElementById("sLidar").innerText = d.lidar || "-";
        document.getElementById("sCam").innerText = d.camera || "-";
        document.getElementById("sRadar").innerText = d.radar || "-";

        const isCarFault = d.lidar === "Fault" || d.camera === "Degraded";
        document.getElementById("carAlert").innerText = isCarFault ? "⚠️ ABNORMAL" : "None";
        document.getElementById("carStatus").innerText = `(Status: ${isCarFault ? "ALERT" : "Active"})`;
        document.getElementById("carStatus").style.color = isCarFault ? "#ff4d4f" : "#4aff77";

        // 延迟图表
        const latency = ((Date.now() - Number(d.ping) * 1000) / 100000).toFixed(1) || 0;
        pingHistory.push(latency);
        if (pingHistory.length > MAX_PING_LEN) pingHistory.shift();
        document.getElementById("pingValue").innerText = latency
        document.getElementById("pingValue").style.color = (latency) > 100 ? "#ff4d4f" : "#4aff77";
        pingChart.setOption({
            xAxis: { data: pingHistory.map((_, i) => i + 1 + "s") },
            series: [{ data: pingHistory }]
        });
    }

    // ========== 警报日志 ==========
    const logBox = document.getElementById("alertLog");
    const now = new Date().toLocaleTimeString();
    let log = "";
    let hasFault = false;
    for (const carId of Object.keys(carData)) {
        const car = carData[carId];
        if (car.lidar === "Fault" || car.camera === "Degraded") {
            log += `<div class="log-item">[${now}] ⚠️ ${carId} 异常</div>`;
            hasFault = true;
        }
    }
    if (!hasFault) {
        log = `<div class="log-item">[${now}] ✅ 全部正常</div>`;
    }
    logBox.innerHTML = log;
}

// ========== 车辆点击事件（动态绑定） ==========
document.addEventListener("click", (e) => {
    const item = e.target.closest(".vehicle-item");
    if (!item) return;

    document.querySelectorAll(".vehicle-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentCar = item.dataset.id;
    document.getElementById("pingCar").innerText = "Vehicle: " + currentCar;

    const color = currentCar.startsWith("AV-S") ? "#4aff77" : "#4a9eff";
    initPingChart(color);
    pingHistory = [];
    refreshAllUI();
});

// ========== 时间 ==========
setInterval(() => {
    document.getElementById("current-time").innerText = new Date().toLocaleString();
}, 1000);

// ========== 窗口缩放 ==========
window.addEventListener('resize', () => {
    mapChart.resize();
    pingChart.resize();
});

// ========== 天气 ==========
async function getWeather() {
    try {
        const res = await fetch("https://wttr.in/Shenzhen?format=j1");
        const data = await res.json();
        const desc = data.current_condition[0].weatherDesc[0].value;
        const temp = data.current_condition[0].temp_C;
        const wind = data.current_condition[0].windspeedKmph;
        document.querySelector(".weather-text").innerHTML =
            `<span>${desc}</span><span>${temp}℃</span><span>风速 ${wind} km/h</span>`;
    } catch (e) {
        console.log("天气获取失败", e);
    }
}
getWeather();
setInterval(getWeather, 5 * 60 * 1000);
