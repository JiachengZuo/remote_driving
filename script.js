let currentCar = "AV-S031";
let carData = {};
let pingHistory = [];
const MAX_PING_LEN = 15;

const mapChart = echarts.init(document.getElementById('map-container'));
const pingChart = echarts.init(document.getElementById('pingLineChart'));

mapChart.setOption({
    backgroundColor: 'transparent',
    xAxis: { show: false, min: 0, max: 100 },
    yAxis: { show: false, min: 0, max: 100 },
    series: [{
        type: 'scatter', zlevel:10, symbol:'pin', symbolSize:28,
        data: [
            { value: [30,45], name: 'AV-S031', itemStyle: { color: '#4aff77' } },
            { value: [50,60], name: 'AV-N055', itemStyle: { color: '#4a9eff' } }
        ],
        label: { show:true, position:'bottom', formatter:'{b}', color:'#fff', backgroundColor:'rgba(0,0,0,.7)' }
    }]
});

function initPingChart(color="#4aff77"){
    pingChart.setOption({
        tooltip: { trigger:'axis', backgroundColor:'rgba(0,30,60,.8)', textStyle:{color:'#fff'} },
        grid: { left:10, right:10, top:15, bottom:20 },
        xAxis: { type:'category', data:[], axisLine:{color:'rgba(74,201,255,.3)'}, axisLabel:{show:false} },
        yAxis: { type:'value', splitLine:{color:'rgba(74,201,255,.15)'}, axisLabel:{color:'#a0d8ff',fontSize:10} },
        series: [{
            type:'line', smooth:true, symbol:'none', lineStyle:{color,width:2},
            areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[
                {offset:0, color:color+'60'},{offset:1, color:color+'05'}
            ])},
            data:[]
        }]
    });
}
initPingChart();

const ws = new WebSocket('ws://localhost:8888');
ws.onmessage = (e) => {
    carData = JSON.parse(e.data);
    refreshAllUI();
};

function refreshAllUI() {
    document.getElementById("car1_speed").innerText = carData.AV_S031.speed + "km/h";
    document.getElementById("car1_batt").innerText = carData.AV_S031.battery;
    document.getElementById("car2_speed").innerText = carData.AV_N055.speed + "km/h";
    document.getElementById("car2_batt").innerText = carData.AV_N055.battery;

    const car1 = document.querySelector('[data-id="AV-S031"]');
    const car2 = document.querySelector('[data-id="AV-N055"]');

    const aFault = carData.AV_S031.lidar === "Fault" || carData.AV_S031.camera === "Degraded";
    const bFault = carData.AV_N055.lidar === "Fault" || carData.AV_N055.camera === "Degraded";

    if (aFault) {
        car1.style.setProperty('border-left', '4px solid #ff4d4f', 'important');
    } else {
        car1.style.setProperty('border-left', '3px solid transparent', 'important');
    }

    if (bFault) {
        car2.style.setProperty('border-left', '4px solid #ff4d4f', 'important');
    } else {
        car2.style.setProperty('border-left', '3px solid transparent', 'important');
    }

    mapChart.setOption({
        series: [{
            data: [
                { value: carData.AV_S031.gps, name: 'AV-S031', itemStyle: { color: aFault ? '#ff4d4f' : '#4aff77' }, symbolSize: currentCar=="AV-S031"?40:28 },
                { value: carData.AV_N055.gps, name: 'AV-N055', itemStyle: { color: bFault ? '#ff4d4f' : '#4a9eff' }, symbolSize: currentCar=="AV-N055"?40:28 }
            ]
        }]
    });

    const d = currentCar === "AV-S031" ? carData.AV_S031 : carData.AV_N055;
    document.getElementById("carSpeed").innerText = d.speed + " km/h";
    document.getElementById("carBatt").innerText = d.battery + "%";
    document.getElementById("sLidar").innerText = d.lidar;
    document.getElementById("sCam").innerText = d.camera;
    document.getElementById("sRadar").innerText = d.radar;
    document.getElementById("carAlert").innerText = (d.lidar === "Fault" || d.camera === "Degraded") ? "⚠️ ABNORMAL" : "None";
    document.getElementById("carStatus").innerText = `(Status: ${(d.lidar === "Fault" || d.camera === "Degraded") ? "ALERT" : "Active"})`;
    document.getElementById("carStatus").style.color = (d.lidar === "Fault" || d.camera === "Degraded") ? "#ff4d4f" : "#4aff77";

    pingHistory.push(d.ping);
    if(pingHistory.length>MAX_PING_LEN) pingHistory.shift();
    document.getElementById("pingValue").innerText = d.ping;
    document.getElementById("pingValue").style.color = d.ping>100 ? "#ff4d4f" : "#4aff77";
    pingChart.setOption({
        xAxis: { data: pingHistory.map((_,i)=>i+1+"s") },
        series: [{ data: pingHistory }]
    });

    let alertCount = 0;
    if(aFault) alertCount++;
    if(bFault) alertCount++;
    document.getElementById("alertCount").innerText = alertCount;
    document.getElementById("avgSpeed").innerText = ((carData.AV_S031.speed + carData.AV_N055.speed)/2).toFixed(0);

    const logBox = document.getElementById("alertLog");
    const now = new Date().toLocaleTimeString();
    let log = "";

    if (aFault) {
        log += `<div class="log-item">[${now}] ⚠️ AV-S031 异常</div>`;
    }
    if (bFault) {
        log += `<div class="log-item">[${now}] ⚠️ AV-N055 异常</div>`;
    }
    if (!aFault && !bFault) {
        log = `<div class="log-item">[${now}] ✅ 全部正常</div>`;
    }

    logBox.innerHTML = log;
}

document.querySelectorAll(".vehicle-item").forEach(el => {
    el.onclick = () => {
        document.querySelectorAll(".vehicle-item").forEach(i=>i.classList.remove("active"));
        el.classList.add("active");
        currentCar = el.dataset.id;
        document.getElementById("pingCar").innerText = "Vehicle: " + currentCar;
        initPingChart(currentCar=="AV-S031" ? "#4aff77" : "#4a9eff");
        pingHistory = [];
        refreshAllUI();
    };
});

setInterval(()=>{
    document.getElementById("current-time").innerText = new Date().toLocaleString();
},1000);

window.addEventListener('resize', ()=>{ mapChart.resize(); pingChart.resize(); });

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