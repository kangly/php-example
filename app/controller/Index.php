<?php
namespace app\controller;

use app\BaseController;
use app\Request;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

/**
 * Class Index
 * @package app\controller
 */
class Index extends BaseController
{
    /**
     * 世界惯例-HelloWorld
     * @return string
     */
    public function index()
    {
        return 'Hello World';
    }

    /**
     * 发送邮件
     * @param Request $request
     * @throws \Exception
     */
    public function sendMail(Request $request)
    {
        $email = $request->param('email');
        if($email){
            $connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
            $channel = $connection->channel();
            $channel->queue_declare('sendMail', false, false, false, false);
            $msg = new AMQPMessage($email);
            $channel->basic_publish($msg, '', 'sendMail');
            $channel->close();
            $connection->close();
            echo "Mail sent success";
        }else{
            echo '非法请求!';
        }
    }
}