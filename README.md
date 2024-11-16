# move-car

+ 来源于佬友分享的[部署于cf的挪车二维码](https://linux.do/t/topic/254701)
+ 再附一个wangdefa佬的[带管理系统的版本](https://github.com/oozzbb/car-qrcode-notify)

## 说明
微调出了以下3个版本
+ `V0.1` 最接近原始版本
    + 只有两个按钮，一个发送微信通知，一个拨打电话
    + 页面上隐藏敏感信息
    + 增加发送通知的频率限制
+ `V0.2` 在`V0.1`的基础上增加了留言框，发送通知时可以附加留言
+ `V0.3` 在`V0.2`的基础上增加了以下功能/限制
    1. 发送通知前必须允许获取定位
    2. 获取到的经纬度信息通过高德api转成实际地理位置
    3. 地理位置和留言作为通知消息一起发送
    4. 拨打电话前至少发送过一次通知

## 使用方法
1. cloudflare账号肯定是要有的，新建worker这些不多说
2. 新建的worker进入编辑代码，选择一个版本的代码复制替换进去或者上传后重命名为worker.js
3. 在worker的设置里添加以下变量
    + `PHONE_NUMBER`点击拨号返回的号码
    + `WXPUSHER_APP_TOKEN`和`WXPUSHER_UID`自行参考[WxPusher微信推送服务](https://wxpusher.zjiecode.com/docs/#/?id=spt)
        + 或者自行修改成其他通知方式
    + `GD_KEY` 高德api key，如果选择`V0.3`版本的话，自行前往高德开发者平台获取
4. 以上完成后，可以选择添加自定义域名，把域名(`https://example.com`)转成二维码打印出来使用


PS: `V0.3`发现一个小bug，在部分浏览器(`kiwi`, `via`, `duck`)无法弹出请求定位的窗口