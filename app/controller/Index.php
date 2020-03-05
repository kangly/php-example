<?php
namespace app\controller;

use app\BaseController;
use app\Request;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class Index extends BaseController
{
    public function index()
    {
        return 'success';
    }

    public function hello($name = 'ThinkPHP6')
    {
        return 'hello,' . $name;
    }

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
            echo "Mail Sent success";
        }else{
            echo '非法请求！';
        }
    }
}