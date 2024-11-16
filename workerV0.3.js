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
  const gdKey = GD_KEY  // 高德api的key， 个人开发者每天有5000逆地理编码请求次数

  const phoneNumberUrlKey = 'getPhoneNumberUrl';
  const notifyUrlKey = 'notifyUrl';
  const addrUrlKey = 'getAddrUrl'

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

  // 检查 `getAddrUrl` 是否存在
  let getAddrUrl = await URLL.get(addrUrlKey);
  if (!getAddrUrl) {
    // 如果不存在，生成一个新的随机字符串并存入 KV
    getAddrUrl = '/' + generateRandomString(20);
    await URLL.put(addrUrlKey, getAddrUrl, { expirationTtl: expirationTime });
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
        return new Response(JSON.stringify({ message: '通知发送失败，请稍后重试。' }), {
              headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (data.action === 'getAddr' && request.url.includes(getAddrUrl)) {
      let loca = data.lng.toFixed(6).replace(/(\.\d*?)0+$/, "$1") + ',' + data.lat.toFixed(6).replace(/(\.\d*?)0+$/, "$1")
      let gdapi = "https://restapi.amap.com/v3/geocode/regeo?key=" + gdKey + "&location=" + loca;
      const response = await fetch(gdapi, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      const result = await response.json();
      console.log(result);
      if (result.status === 1) {
        return new Response(JSON.stringify({ message: result.info }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ message: result.regeocode.formatted_address }), {
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

  return new Response(generateHTMLContent(getPhoneNumberUrl, notifyUrl, getAddrUrl), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });

}

  
// 返回 HTML 页面
function generateHTMLContent(getPhoneNumberUrl, notifyUrl, getAddrUrl) {
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
            .small { font-size: 14px; color: #888; }
            textarea { width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 4px; }
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
            <p class="small">为防止恶意请求，请同意获取定位</p>
            <textarea id="messageInput" placeholder="这里可以输入您的留言..."></textarea>
            <button id="notifyButton" class="notify-btn">通知车主挪车</button>
            <button class="call-btn" onclick="callOwner()">拨打车主电话</button>
          </div>
   
          <script>
            const notifyButton = document.getElementById('notifyButton');
            let hasLocation = false;

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
            notifyButton.addEventListener('click', async () => {
              if (!canSendNotification()) {
                alert('操作太频繁，请等待2分钟后再发送通知。');
                return;
              }


              function tryGetUserLocation() {
              return new Promise((resolve, reject) => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    function(position) {
                      // 成功获取位置
                      resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                      });
                    },
                    function(error) {
                      // 处理错误
                      reject({
                        code: error.code,
                        message: error.message
                      });
                      switch(error.code) {
                        case error.PERMISSION_DENIED:
                          console.log("User denied the request for Geolocation.");
                          break;
                        case error.POSITION_UNAVAILABLE:
                          console.log("Location information is unavailable.");
                          break;
                        case error.TIMEOUT:
                          console.log("The request to get user location timed out.");
                          break;
                        case error.UNKNOWN_ERROR:
                          console.log("An unknown error occurred.");
                          break;
                      }
                    },
                    {
                      enableHighAccuracy: true, // 提供更精确的位置
                      timeout: 5000,           // 指定最长等待时间为5秒
                      maximumAge: 0            // 不接受缓存的位置信息，每次都重新获取
                    }
                  );
                } else {
                  reject({
                    code: -1,
                    message: "Geolocation is not supported by this browser."
                  });
                }
              });
            }

            try {
              const location = await tryGetUserLocation();
              console.log("Latitude: " + location.latitude);
              console.log("Longitude: " + location.longitude);
              // 调用高德获取位置
              addr = "Latitude: " + location.latitude + "Longitude: " + location.longitude;
              let address = "";
              alert("通知已发送！"); // 这个是假的，防止后面的请求时长太久误以为没点到多次点击
              fetch("${getAddrUrl}", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "getAddr", lat: location.latitude, lng: location.longitude})
              })
              .then(response => response.json())
              .then(data => {
                address = data.message;
                console.log(address);
                const userMessage = messageInput.value.trim();
                // 构造通知内容，附加用户留言
                const message = "您好，有人需要您挪车，请及时处理。" + userMessage + "\\n位置: " + address;
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
              })
              .catch(error => {
                console.error("Error sending notification:", error);
                alert("通知发送出错了，请检查网络连接，或者尝试拨打电话。");
              });
              hasLocation = true;
            } catch (error) {
              console.error("Error: ", error.message);
              // 处理错误情况
              alert('为防止恶意请求，请允许获取定位！');
              return;
            }
              
          });
  
            // 拨打车主电话
            function callOwner() {
              if (!hasLocation) {
                alert('请先尝试消息通知，谢谢！');
                return;
              }

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