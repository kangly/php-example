//数据列表检索排序字符串保存的键值(值以$.data的方式保存在_current_tab_page_id对应的对象上)
var _pad_adv_filter_id = "_pad_adv_filter_id";
//数据列表检索条件数据
var _pad_search_params_id = "_pad_search_params_id";
//页面初次加载时保存参数
var _pad_page_base_params_id = "_pad_page_base_params_id";
var _pad_grid_page_size = "gridPageSize";

_mp_last_focus_shift_time_millsec = 0; //上次弹层时间
var _ma_pop_idx = 1;
var _ma_pop_callback = new Object();
var _ma_pop_callback_beforeclose = new Object();

//给指定元素加载内容
function _p_a_load(url,pageContainerId,keepParams,data,callBack,isGridInit){
    _pad_all_loadPage(url,pageContainerId,keepParams,data,callBack,isGridInit);
}

//keepParams 是否保留container上缓存的参数，首次加载时一般为false
function _pad_all_loadPage(url,pageContainerId,keepParams,data,callBack,isGridInit){
    if(typeof(pageContainerId)=='string'){
        if(pageContainerId.substring(0,1)=='#')
            pageContainerId = pageContainerId.substring(1);
    }
    var containerObj = find_jquery_object(pageContainerId);
    if(!data){
        data = {};
    }
    var initPageSize = containerObj.attr(_pad_grid_page_size);
    if(initPageSize && initPageSize>0){
        //有初始化containerObj 中grid的pageSize
        data = _pad_add_param_to_post_data(data,'gridPageSize',initPageSize);
    }
    //将容器id传入到action的loadPageId，在页面初始化脚本中可以使用
    if(url.indexOf('loadPageId')==-1 && (!data || !data.loadPageId) && (typeof(data)!='string'||data.indexOf('loadPageId')==-1)){
        data = _pad_add_param_to_post_data(data,'loadPageId',pageContainerId);
    }
    if(isGridInit && data){
        containerObj.data(_pad_search_params_id, data);
    }
    if(!keepParams)
        _pad_clear_container_old_data(pageContainerId);

    var pageBaseParams = containerObj.data(_pad_page_base_params_id);
    var param_idx = url.indexOf('?');
    if(param_idx!=-1){
        var param_idx_2 = url.indexOf('#');
        var params_str = '';
        if(param_idx_2!=-1){
            params_str = url.substring(param_idx+1,param_idx_2);
        }else{
            params_str = url.substring(param_idx+1);
        }
        url = url.substring(0,param_idx);
        if(params_str.length>0){
            if(!data){
                data = {};
            }else if(Object.prototype.toString.call(data) === "[object String]"){
                params_str = params_str + '&' + data;
                data = {};
            }
            var param_arr = params_str.split('&');
            for(var pi=0;pi<param_arr.length;pi++){
                var p_key_val = param_arr[pi].split('=');
                if(p_key_val.length>1){
                    data[p_key_val[0]] = p_key_val[1];
                }
            }
        }
    }
    if(!pageBaseParams && data){
        pageBaseParams = data;
    }else{
        pageBaseParams = _pad_mergeJsonObject(pageBaseParams, data);
    }
    containerObj.data(_pad_page_base_params_id, pageBaseParams);
    $.ajax({
        url:url,
        type: "post",
        data: pageBaseParams,
        cache:false,
        beforeSend:function(XMLHttpRequest){},
        success:function(html){
            if(html && isJson(html)){
                //返回错误异常
                if(html.err_text){
                    alert(html.err_text);
                    _hide_top_loading();
                }
                return;
            }
            _pad_add_pageInfo_to_loadPageHtml(html, pageContainerId, url);
            //处理如果html中有grid，为grid加上containerId
            var tempIdx1 = html.indexOf('<table');
            if(tempIdx1!=-1){
                tempIdx1 = tempIdx1 + 6;
                var tempIdx2 = html.indexOf('>',tempIdx1);
                var tempIdx3 = html.indexOf('table',tempIdx1);
                if(tempIdx3!=-1 && tempIdx3< tempIdx2){
                    //尝试准确的定位"table.table:first"的table
                    html = html.substring(0,tempIdx1) + ' containerId="#'+pageContainerId+'"' + html.substring(tempIdx1);
                }
            }
            containerObj.html(html);
            containerObj.trigger('new_content_load');
            //添加输入框相关效果,如 必填 等等
            _pad_add_input_element(containerObj);
            _update_pager_click_event(containerObj);
            var anyGrid = _pad_findGridByContainerId(pageContainerId);
            if(anyGrid.length>0){
                add_event_for_jm_table(anyGrid);
            }
            //添加clearable输入框清楚按键
            _pad_add_clearable_input_btn(pageContainerId);
            if(callBack){
                callBack(pageContainerId);
            }
        }
    }).always(function(){});
}

function _pad_all_reloadPage(pageContainerId,more_parems,callback){
    var container = find_jquery_object(pageContainerId);
    if(container){
        var url = container.attr('content_url');
        _pad_all_loadPage(url, pageContainerId, true, more_parems, callback);
    }
}

function _pad_add_clearable_input_btn(containerId){
    var container = find_jquery_object(containerId);
    container.find('input.clearable').each(function(){
        $(this).wrap('<div class="clearable_container"></div>');
        var clear_btn = $('<i class="icon-remove clear_btn"></i>');
        clear_btn.click(function(){
            $(this).prev('input').val('');
        });
        $(this).after(clear_btn);
    });
}

function add_event_for_jm_table(gridTable){
    var gridContainerId = gridTable.attr('containerId');
    add_event_for_jm_table_sort(gridContainerId);
}

function add_event_for_jm_table_sort(containerId){
    if(containerId.substring(0,1)!='#')
        containerId = '#' + containerId;

    var container = $(containerId);
    var page_params = container.data(_pad_page_base_params_id);
    if(page_params && page_params.sort_column){
        var on_sorting = container.find('[sort_column="'+page_params.sort_column+'"]');
        if(on_sorting.length==1){
            on_sorting.attr('sort_type', page_params.sort_type);
        }
    }
    container.find('.tab_sorter').each(function(){
        var column = $(this);
        var sort_column = column.attr('sort_column');
        if(sort_column!=''){
            var column_table = column.parents('[content_url]:first');
            var sort_type = column.attr('sort_type');
            column_table.removeClass('icon-sort-up icon-sort-down');
            if(sort_type=='asc'){
                column.addClass('icon-sort-up');
            }else if(sort_type=='desc'){
                column.addClass('icon-sort-down');
            }else{
                column.addClass('icon-sort');
            }
            column.unbind('click').bind('click',function(){
                _show_top_loading();
                var thiscolumn = $(this);
                var thissort = thiscolumn.attr('sort_column');
                var thistype = thiscolumn.attr('sort_type');
                if(thiscolumn.is('.icon-sort-down')){
                    thistype = 'asc';
                }else if(thiscolumn.is('.icon-sort-up')){
                    thistype = '';
                }else{
                    thistype = 'desc';
                }
                thiscolumn.attr('sort_type',thistype);
                var table_id = column_table.attr('id');
                var table_url = column_table.attr('content_url');
                var params = column_table.data(_pad_page_base_params_id);
                if(!params){
                    params = {};
                }
                params = _pad_add_param_to_post_data(params,'sort_column',thissort);
                params = _pad_add_param_to_post_data(params,'sort_type',thistype);
                _p_a_load(table_url, table_id, null, params, function(){
                    _hide_top_loading();
                });
            });
        }
    });
}

function _hide_top_loading() {}

function _show_top_loading() {}

function _update_pager_click_event(container){
    var pagerObjs = container.find('.pagination.in_tab');
    pagerObjs.each(function(){
        $(this).find('a').each(function() {
            $(this).click(function (event) {
                var url = $(this).attr('href');
                _pad_all_loadPage(url,container.attr('id'),true);
                return false;//阻止链接跳转
            });
        });
    });
}

var _pad_temp_input_id_idx = 1;
function _pad_add_input_element(container){
    var mustObjs = container.find('.must_input');
    mustObjs.each(function(){
        var inputId = _pad_check_temp_id_to_jobj($(this));
        var miGroup = _pad_check_input_group_parent($(this));
        var miSign = $('<i class="icon-warning-sign mi_sign" title="必填"> 必填</i>');
        miSign.attr('input_id',inputId);
        $(this).after(miSign);
        miSign.click(function(){
            $(this).removeClass('shake');
        });
    });

    var clearAbleObjs = container.find('.clear_able');
    clearAbleObjs.each(function(){
        var inputId = _pad_check_temp_id_to_jobj($(this));
        var miGroup = _pad_check_input_group_parent($(this));
        var inner_btn_clear = $('<span class="input_inner_btn icon-remove red"></span>');
        inner_btn_clear.attr('input_id',inputId);
        $(this).after(inner_btn_clear);
        miGroup.hover(
            function(){
                inner_btn_clear.show();
            }
            ,function(){
                inner_btn_clear.hide();
            }
        );
        inner_btn_clear.click(function(e){
            e.stopPropagation();
            e.preventDefault();
            var targetId = $(this).attr('input_id');
            var targetObj = $('#'+targetId);
            targetObj.prop("value",'');
            //targetObj.val('');
            targetObj.removeData();
        });
    });

    var _cp_colorPicker = $('#_cp_color_select_div');
    if(_cp_colorPicker.length>0){
        var colorableObjs = container.find('.color_picker');
        colorableObjs.each(function(){
            var inputId = _pad_check_temp_id_to_jobj($(this));
            $(this).click(function(e){
                e.stopPropagation();
                e.preventDefault();
            });
        });
    }
}

function _pad_check_temp_id_to_jobj(jobj){
    var inputId = jobj.attr('id');
    if(!inputId || inputId==''){
        inputId = 'input_temp_id_'+_pad_temp_input_id_idx;
        _pad_temp_input_id_idx ++;
        jobj.attr('id',inputId);
    }
    return inputId;
}

function _pad_check_input_group_parent(jobj){
    var parent = jobj.parent();
    var retobj = null;
    if(parent.is('.mi_group')){
        retobj = parent;
    }else{
        retobj = $('<div class="mi_group"></div>');
        jobj.wrap(retobj);
    }
    return jobj.parent();
}

function _pad_clear_container_old_data(containerId){
    if(containerId.substring(0,1)!='#')
        containerId = '#' + containerId;

    var container = $(containerId);
    container.attr('content_url','');
    //不去掉就没法设置pageSize
    //container.removeAttr(_pad_grid_page_size);
    container.removeAttr('pageNo');
    container.removeData(_pad_adv_filter_id);
    container.removeData(_pad_search_params_id);
    container.removeData(_pad_page_base_params_id);
    try{
        container.removeData(_grid_row_selected_row_ids);
    }catch(e){}
    try{
        //_all_gridSearchClear(containerId); //页面暂时没有这个逻辑，vix中有
    }catch(e){
        alert(e);
    }
}

function _pad_findGridByContainerId(containerId){
    if(containerId.substring(0,1)!='#')
        containerId = '#' + containerId;
    var containerObj = $(containerId);
    var anyGrid = containerObj.find('table.table:first');
    if(anyGrid.length>0){
        var ori_containerId = anyGrid.attr('containerId');
        if(!ori_containerId || ori_containerId==''){
            anyGrid.attr('containerId',containerId);
        }
    }
    return anyGrid;
}

function _pad_add_pageInfo_to_loadPageHtml(jqHtml, pageContainerId, url){
    var container = find_jquery_object(pageContainerId);
    container.attr('content_url',url);
}

function _pad_mergeJsonObject(baseData, newData){
    if(!baseData)
        return newData;
    if(!newData)
        return baseData;

    var resultJsonObject={};
    for(var attr in baseData){
        resultJsonObject[attr]=baseData[attr];
    }
    for(var attr in newData){
        resultJsonObject[attr]=newData[attr];
    }
    return resultJsonObject;
}

function find_jquery_object(obj){
    var jObj = null;
    //check if obj is just id
    if(obj instanceof jQuery){
        jObj = obj;
    }else{
        if(typeof(obj)=='string'){
            if(obj.substring(0,1)!='#')
                obj = '#' + obj;
            jObj = $(obj);
        }else{
            jObj = $(obj);
        }
    }
    return jObj;
}

function _pad_add_param_to_post_data(data, paramName, paramValue){
    if(!data || data.length==0){
        data = paramName+'='+paramValue;
    }else{
        if(typeof(data)=='string'){
            if(data!=''){
                if(data.substring(0,1)=='&'){
                    data = data.substring(1);
                }
                if(data.substring(data.length-1)=='&'){
                    data = data.substring(0,data.length-1);
                }

                if(data!=''){
                    var param_arr = data.split('&');
                    data = {};
                    for(var pi=0;pi<param_arr.length;pi++){
                        var p_key_val = param_arr[pi].split('=');
                        if(p_key_val.length>1){
                            data[p_key_val[0]] = p_key_val[1];
                        }
                    }
                }
            }
        }
        data[paramName] = paramValue;
    }
    return data;
}

function isJson(obj){
    return typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
}

/**
 * 弹框显示内容
 * @param ma_mark 弹框标识（非id），相同标识只弹出一个窗口
 * @param title 窗口标题
 * @param url 加载内容url，优先使用url再使用content
 * @param content 窗口显示内容，当url有效时，可作为提交参数（数组格式)
 * @param position 位置信息数组，可设置width,height,left/right,top/bottom
 * @param callback 回调函数，可设置 afterinit,beforeclose(点击右上角关闭时),finishwork(在显示内容内根据自定义情况执行)
 * @private
 */
function _add_moveable_popup(ma_mark,title,url,content,position,callback){
    //此判断无法处理并发情况，暂时不深入处理
    if(ma_mark && $('.moveable_popup_win[identity="'+ma_mark+'"]').length>0){
        _close_moveable_popup(ma_mark);//改为关闭之前的
    }
    var mapop = $('<div class="moveable_popup_win any_focus_pop my_focus_pop"><div class="title_bar"></div><div class="close_btn icon-remove" ma_mark="'+ma_mark+'"></div><div class="content_here"></div><div class="button_here"></div></div>');
    var ma_id = 'ma_pop_'+_ma_pop_idx;
    mapop.attr('id',ma_id);
    mapop.attr('idx',_ma_pop_idx);
    if(!ma_mark || ma_mark==''){
        ma_mark = ma_id;
    }
    if(ma_mark){
        mapop.attr('identity',ma_mark);
    }
    $('.my_focus_pop').removeClass('my_focus_pop');
    $('#main-content').append(mapop);
    var content_obj = mapop.find('.content_here:first');
    var ma_content_id = 'ma_pop_content_'+_ma_pop_idx;
    content_obj.attr('id',ma_content_id);
    _ma_pop_idx ++;
    var titlebar = mapop.find('.title_bar:first');
    titlebar.html(title);
    if(!callback){
        callback = {};
        _ma_pop_callback[ma_mark] = null;
        _ma_pop_callback_beforeclose[ma_mark] = null;
    }else{
        if(callback.finishwork){
            _ma_pop_callback[ma_mark] = callback.finishwork;
        }
        if(callback.beforeclose) {
            _ma_pop_callback_beforeclose[ma_mark] = callback.beforeclose;
        }
    }
    mapop.resizable();
    mapop.delegate('.close_btn','click',function(){
        _close_moveable_popup($(this).attr('ma_mark'));
    });
    var mp_data = {};
    mp_data.moveable_pop_mark = ma_mark;
    if(url){
        mp_data = _pad_mergeJsonObject(mp_data,content);
        _pad_all_loadPage(url,ma_content_id,true,mp_data,function(){
            _ma_check_button(mapop);
            mapop.show();
            _reposition_moveable_pop(mapop,position);
            if(callback.afterinit){
                callback.afterinit(ma_id,ma_content_id);
            }
        });
    }else{
        content_obj.html(content);
        _reposition_moveable_pop(mapop,position);
        _ma_check_button(mapop);
        mapop.show();
        if(callback.afterinit){
            callback.afterinit(ma_id,ma_content_id);
        }
    }
    _mp_last_focus_shift_time_millsec = new Date().getTime();
    mapop.draggabilly({
        handle: '.title_bar'
    });
}

function _ma_check_button(mapop){
    var button_old = mapop.find('.pop_win_buttons:first');
    var button_new = mapop.find('.button_here:first');
    var fixed_buttons = button_new.find('.ma_fixed_button');
    var fixed_btn_group = $('<span class="ma_fixed_button_group"></span>');
    fixed_buttons.each(function(){
        fixed_btn_group.append($(this));
    });
    var close_btn = $('<a class="btn close_btn">关闭</a>');
    close_btn.attr('ma_mark', mapop.attr('identity'));
    if(button_old.length>0){
        button_new.html('');
        button_new.append(fixed_btn_group);
        button_new.append(button_old.html());
        button_new.append(close_btn);
        button_old.remove();
    }else{
        button_new.html(close_btn);//默认添加关闭按键
        button_new.prepend(fixed_btn_group);
    }
}

function _reload_moveable_pop(ma_mark, more_parems){
    if(ma_mark && $('.moveable_popup_win[identity="'+ma_mark+'"]').length>0){
        _pad_all_reloadPage($('.moveable_popup_win[identity="'+ma_mark+'"]').find('.content_here:first').attr('id'),more_parems, function(){
            _ma_check_button($('.moveable_popup_win[identity="'+ma_mark+'"]'));
        });
    }
}

function _find_moveable_pop_by_ma_mark(ma_mark){
    return $('.moveable_popup_win[identity="'+ma_mark+'"]');
}

function _reposition_moveable_pop(mapop,position){
    if(position){
        if(position.width>0){
            position.width = position.width + 30;
            mapop.css('width',position.width);
        }
        var p_height = position.height;
        if(isNaN(p_height)){
            p_height = 0;
        }
        if(position.auto_height){
            var content_container = mapop.find('.content_here:first');
            var content_height = content_container[0].scrollHeight;
            if(!isNaN(content_height)){
                if(p_height>content_height){
                    p_height = content_height + 80;
                }
                if(p_height<230){
                    p_height = 230;
                }
            }
            mapop.css('height', p_height);
        }else{
            mapop.css('height', p_height+50);
        }
        if(!isNaN(position.left)){
            mapop.css('left',position.left);
        }else if(!isNaN(position.right)){
            var width = mapop.outerWidth();
            var win_width = $(document).innerWidth();
            var left = win_width - width - position.right;
            mapop.css('left',left);
        }
        if(!isNaN(position.top)){
            mapop.css('top',position.top);
        }else if(!isNaN(position.bottom)){
            var height = mapop.outerHeight();
            var win_height = $(window).innerHeight();
            var top = win_height - height - position.bottom;
            if(top<0){
                top = 0;
            }
            mapop.css('top',top);
        }
    }
}

function _run_moveable_callback_finishwork(ma_mark, params){
    if(ma_mark && $('.moveable_popup_win[identity="'+ma_mark+'"]').length>0){
        if(_ma_pop_callback[ma_mark]){
            _ma_pop_callback[ma_mark](params);
        }
    }
}

function _close_moveable_popup(ma_mark){
    if(_ma_pop_callback_beforeclose[ma_mark]){
        _ma_pop_callback_beforeclose[ma_mark](ma_mark);
    }
    if(ma_mark && $('.moveable_popup_win[identity="'+ma_mark+'"]').length>0){
        $('.moveable_popup_win[identity="'+ma_mark+'"]').remove();
        _ma_pop_callback[ma_mark] = null;
        _ma_pop_callback_beforeclose[ma_mark] = null;
    }else{
        $('.moveable_popup_win.my_focus_pop').remove();
    }
}