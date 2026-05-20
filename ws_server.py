import asyncio
import websockets
import json

# 你的车辆数据（和大屏完全匹配）
data_list = [
    {"AV_S031":{"gps":[30,45],"speed":22,"battery":88,"lidar":"OK","camera":"OK","radar":"OK","ping":32},"AV_N055":{"gps":[50,60],"speed":18,"battery":75,"lidar":"OK","camera":"OK","radar":"OK","ping":28}},
    {"AV_S031":{"gps":[32,44],"speed":24,"battery":87,"lidar":"OK","camera":"OK","radar":"OK","ping":35},"AV_N055":{"gps":[48,59],"speed":19,"battery":74,"lidar":"OK","camera":"OK","radar":"OK","ping":30}},
    {"AV_S031":{"gps":[34,43],"speed":26,"battery":86,"lidar":"OK","camera":"OK","radar":"OK","ping":33},"AV_N055":{"gps":[46,58],"speed":20,"battery":73,"lidar":"OK","camera":"OK","radar":"OK","ping":27}},
    {"AV_S031":{"gps":[36,42],"speed":28,"battery":85,"lidar":"OK","camera":"Degraded","radar":"OK","ping":88},"AV_N055":{"gps":[44,57],"speed":21,"battery":72,"lidar":"Fault","camera":"OK","radar":"OK","ping":198}},
    {"AV_S031":{"gps":[38,41],"speed":30,"battery":84,"lidar":"OK","camera":"Degraded","radar":"OK","ping":92},"AV_N055":{"gps":[42,56],"speed":0,"battery":71,"lidar":"Fault","camera":"OK","radar":"OK","ping":210}},
]

idx = 0

async def handle_client(websocket):
    global idx
    print("客户端已连接！")
    while True:
        # 发送数据
        data = json.dumps(data_list[idx])
        await websocket.send(data)
        print(f"发送数据 {idx+1}")
        
        idx = (idx + 1) % len(data_list)
        await asyncio.sleep(1)

async def main():
    async with websockets.serve(handle_client, "localhost", 8888):
        print("✅ WebSocket 服务已启动：ws://localhost:8888")
        await asyncio.Future()

asyncio.run(main())