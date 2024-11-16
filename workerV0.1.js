addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }
  return result
}


async function handleRequest(request) {
  const phone = PHONE_NUMBER
  const wxpusherAppToken = WXPUSHER_APP_TOKEN // Wxpusher APP Token
  const wxpusherUIDs = [WXPUSHER_UID]  // 车主的UIDs
  
  const phoneNumberUrlKey = 'getPhoneNumberUrl';
  const notifyUrlKey = 'notifyUrl';

  const expirationTime = 600; // 设置有效期为 600 秒

  // 检查 `getPhoneNumberUrl` 是否存在
  let getPhoneNumberUrl = await URLL.get(phoneNumberUrlKey);
  if (!getPhoneNumberUrl) {
    // 如果不存在，生成一个新的随机字符串并存入 KV
    getPhoneNumberUrl = '/' + generateRandomString(20);
    await URLL.put(phoneNumberUrlKey, getPhoneNumberUrl, { expirationTtl: expirationTime });
  }

  // 检查 `notifyUrl` 是否存在
  let notifyUrl = await URLL.get(notifyUrlKey);
  if (!notifyUrl) {
    // 如果不存在，生成一个新的随机字符串并存入 KV
    notifyUrl = '/' + generateRandomString(20);
    await URLL.put(notifyUrlKey, notifyUrl, { expirationTtl: expirationTime });
  }

    if (request.method === 'POST') {
      // 处理 POST 请求，用于发送通知
      const data = await request.json();
  
      if (data.action === 'notifyOwner' && request.url.includes(notifyUrl)) {
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
          return new Response(JSON.stringify({ message: '通知发送失败，请稍后刷新重试。' }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // 获取手机号的请求
      if (data.action === 'callll' && request.url.includes(getPhoneNumberUrl)) {
        return new Response(JSON.stringify({ phone: phone }), {
          headers: { "Content-Type": "application/json" },
        });
      }

    }
    
  return new Response(generateHTMLContent(getPhoneNumberUrl, notifyUrl), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });

}


function generateHTMLContent(getPhoneNumberUrl, notifyUrl) {
  return `
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
            fetch("${notifyUrl}", {
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
            alert("不会吧兄弟，我的车还在路上呢🤪");
            //return;
            fetch("${getPhoneNumberUrl}", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "callll"})
            })
            .then(response => response.json())
            .then(data => {
              window.location.href = "tel:" + data.phone;
            })
            .catch(error => {
              console.error("Error getting phone number:", error);
              alert("获取手机号出错，请检查网络连接并刷新重试。");
            });
          }
        </script>
      </body>
    </html>
  `;
}