使用php开发中的测试例子。

PHP开发中用到的各种测试例子，使用tp6框架。记得执行composer install 安装扩展。

##### 使用QueryList采集数据
    浏览器访问：http://localhost/collect/index
    详细功能可以参考QueryList官方文档
    
##### 使用RabbitMQ异步发送邮件/消息
    需要先安装erlang环境、rabbitmq客户端、配置邮箱服务
    自定义命令可以参考tp6.0官方文档
    RabbitMQ其他功能可以参考RabbitMQ官方文档
    命令行切换到应用根目录下，执行php think rabbitmq
    浏览器访问：http://localhost/index/sendMail?email=xx@xx.com
    
##### JsPopup 弹出层
    浏览器访问：http://localhost/popup/index