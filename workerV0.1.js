addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const phone = PHONE_NUMBER
    const wxpusherAppToken = WXPUSHER_APP_TOKEN // Wxpusher APP Token
    const wxpusherUIDs = [WXPUSHER_UID]  // 车主的UIDs

    
      if (request.method === 'POST') {
        // 处理 POST 请求，用于发送通知
        const data = await request.json();
    
        if (data.action === 'notifyOwner') {
          // 调用 Wxpusher API 发送通知
          const response = await fetch("https://wxpusher.zjiecode.com/api/send/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appToken: wxpusherAppToken,
              content: data.msg,
              contentType: 1,
              uids: wxpusherUIDs,
            }),
          });
    
          const result = await response.json();
          if (result.code === 1000) {
            return new Response(JSON.stringify({ message: '车主正在火速赶来...' }), {
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({ message: '通知发送失败，请稍后重试。' }), {
              headers: { "Content-Type": "application/json" },
            });
          }
        }
      }
  
      // 获取手机号的请求
    if (request.url.includes('/getPhoneNumber')) {
      return new Response(JSON.stringify({ phone: phone }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  
    
    
      // 返回 HTML 页面
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>通知车主挪车</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; color: #333; }
              .container { text-align: center; padding: 20px; width: 100%; max-width: 400px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); background: #fff; }
              h1 { font-size: 24px; margin-bottom: 20px; color: #007bff; }
              p { margin-bottom: 20px; font-size: 16px; color: #555; }
              button { 
                width: 100%; 
                padding: 15px; 
                margin: 10px 0; 
                font-size: 18px; 
                font-weight: bold; 
                color: #fff; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                transition: background 0.3s; 
              }
              .notify-btn { background: #28a745; }
              .notify-btn:hover { background: #218838; }
              .call-btn { background: #17a2b8; }
              .call-btn:hover { background: #138496; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>通知车主挪车</h1>
              <p>如需通知车主，请点击以下按钮</p>
              <button class="notify-btn" onclick="notifyOwner()">通知车主挪车</button>
              <button class="call-btn" onclick="callOwner()">拨打车主电话</button>
            </div>
     
            <script>
  
              // 检查是否可以发送通知
              function canSendNotification() {
                const lastNotificationTime = localStorage.getItem('lastNotificationTime');
                if (lastNotificationTime) {
                  const now = new Date().getTime();
                  const timeDiff = now - parseInt(lastNotificationTime, 10);
                  return timeDiff >= 120000; // 120000毫秒 = 2分钟
                }
                return true;
              }
  
              // 更新上次通知时间
              function updateLastNotificationTime() {
                localStorage.setItem('lastNotificationTime', new Date().getTime().toString());
              }
  
              // 发送通知请求到 Worker
              function notifyOwner() {
                if (!canSendNotification()) {
                  alert('操作太频繁，请等待2分钟后再发送通知。');
                  return;
                }
                const message = "您好，有人需要您挪车，请及时处理。";
                alert("通知已发送！"); // 这个是假的，防止后面的请求时长太久误以为没点到多次点击
                fetch("/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "notifyOwner", msg: message })
                })
                .then(response => response.json())
                .then(data => {
                  alert(data.message);
                  updateLastNotificationTime();
                })
                .catch(error => {
                  console.error("Error sending notification:", error);
                  alert("通知发送出错，请检查网络连接。");
                });
              }
    
              // 拨打车主电话
              function callOwner() {
                fetch("/getPhoneNumber")
                .then(response => response.json())
                .then(data => {
                  window.location.href = "tel:" + data.phone;
                })
                .catch(error => {
                  console.error("Error getting phone number:", error);
                  alert("获取手机号出错，请检查网络连接。");
                });
              }
            </script>
          </body>
        </html>
      `;
    
      return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }