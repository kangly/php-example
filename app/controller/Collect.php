<?php

namespace app\controller;

use app\BaseController;
use QL\QueryList;

/**
 * 使用QueryList采集
 * QueryList官网[http://www.querylist.cc/]
 * Class Collect
 * @package app\controller
 */
class Collect extends BaseController
{
    /**
     * 使用QueryList采集新浪新闻
     * 由于新浪新闻默认编码是GB2312,需要处理才能正常显示
     */
    public function index()
    {
        $url = 'http://roll.news.sina.com.cn/news/gnxw/gdxw1/index.shtml';

        $args = [
            'headers' => [
                'Referer' => 'https://baidu.com/',
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
            ]
        ];

        $data = QueryList::get($url,[],$args)
            //定义采集规则
            ->rules([
                'title'=>array('.list_009 li>a','text'),
                'link'=>array('.list_009 li>a','href')
            ])
            //处理编码
            ->encoding('UTF-8','GB2312')
            ->removeHead()
            ->queryData();

        //输出
        dump($data);
    }
}