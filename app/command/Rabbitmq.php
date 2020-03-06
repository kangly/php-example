<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\input\Argument;
use think\console\input\Option;
use think\console\Output;
use app\controller\Mail;
use PhpAmqpLib\Connection\AMQPStreamConnection;

/**
 * 在cmd命令行下,切换到应用根目录
 * 执行php think make:command Rabbitmq rabbitmq
 * Class Rabbitmq
 * @package app\command
 */
class Rabbitmq extends Command
{
    protected function configure()
    {
        // 指令配置
        $this->setName('rabbitmq')
            ->setDescription('the rabbitmq command');        
    }

    protected function execute(Input $input, Output $output)
    {
        $connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
        $channel = $connection->channel();
        $channel->queue_declare('sendMail', false, false, false, false);
        echo " [*] Waiting for messages. To exit press CTRL+C\n";
        $callback = function ($msg) {
            $mailer = new Mail($this->app);
            $mailer->welcome($msg->body);
            echo ' [x] Received ', $msg->body, "\n";
        };
        $channel->basic_consume('sendMail', '', false, true, false, false, $callback);
        while ($channel->is_consuming()) {
            $channel->wait();
        }
        $channel->close();
        $connection->close();
    }
}