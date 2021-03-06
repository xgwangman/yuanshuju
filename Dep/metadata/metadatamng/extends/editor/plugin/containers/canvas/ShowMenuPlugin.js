if (!window.Dep) {
    window.Dep = {};
}
if (!Dep.framework) {
    Dep.framework = {};
}
if (!Dep.framework.editor) {
    Dep.framework.editor = {};
}
if (!Dep.framework.editor) {
    Dep.framework.editor = {};
}
if (!Dep.framework.editor.plugin) {
    Dep.framework.editor.plugin = {};
}
if (!Dep.framework.editor.plugin.containers) {
    Dep.framework.editor.plugin.containers = {};
}
if (!Dep.framework.editor.plugin.containers.canvas) {
    Dep.framework.editor.plugin.containers.canvas = {};
}

/**
 * 展示图元菜单 根据选中图元的菜单配置信息来展示其菜单
 */
Dep.framework.editor.plugin.containers.canvas.ShowMenuPlugin = Dep.framework.editor.plugin.BasePlugin.extend({
    /**
     * 插件名称
     */
    NAME : "Dep.framework.editor.plugin.containers.canvas.ShowMenuPlugin",
    /**
     * 是否默认创建添加port菜单
     *
     * @type Boolean
     */
    CREATEPORTMENU : true,
    /**
     * 默认的添加port菜单的图片
     *
     * @type String
     */
    defaultPortIcon : "",
    /**
     * 缓存图元上下文菜单
     */
    cacheMenu : new Ext.util.MixedCollection(),
    /**
     *  缓存元模型依赖关系上下文菜单
     */
    cacheDependMenu : new Ext.util.MixedCollection(),

    currentEditFigure:null,
    /**
     * 图层常量
     */
    LAYERPARAM :"Dep.framework.editor.plugin.containers.Layer",
    /**
     * 初始化插件
     */
    init : function(container) {
        var me = this, canvas = null;
        me.setContainer(container);
        // me.container = container;
        me.canvas = container.getCanvas();
        // TODO 实现可参考JBPM shapemenu.js
        container.on(Dep.framework.editor.EVENT.CANVAS.LOADCOMPLETE, me.initEvent.bind(me));
    },
    /**
     * 在容器加载完成之后注册事件。 注意，必须要在容器加载完成之后注册事件，否则有可能会发送容器还没有安装，但是试图向容器注册事情的现象。
     *
     * @param {Editor}
     *            editor 编辑器
     */
    initEvent : function(editor) {
        var me = this;
        me.getCanvas().on("contextmenu", function(canvas, args) {
            if (args.figure) {
                me.showMenu(args.figure, args.x, args.y);
            }
        });
    },

    /**
     * 根据用户选中的图元展示该图元的菜单
     *
     * @param {}
     *            figure 选中的图元
     * @param {}
     *            x 坐标
     * @param {}
     *            y
     */
    showMenu : function(figure, x, y) {
        // 如果未选中任何图元,则不会展示菜单
        if (!figure || !figure.getUserData()) {
            return;
        }
        var me = this,layer =me.getContainer().getEditor().getDataManager().getCurrentEditLayer(),layerType = layer.getType(),node=null,mmId=null,id=null;
        me.currentEditFigure = figure;
        if(figure.getUserData().getFType()!="line"){
            node = layer.currentEditorNode;
            me.currentEditNode = node;
            mmId = node.raw.cacheData.mmId;
            id = node.getId();
            if(!id) return ;
        }else{
            if(layerType!="metadata_datamap"){
                return ;
            }
        }

        var menu = me.bulidMenu(id,mmId,layerType,figure,layer.flag);
        if(menu){
            menu.showAt(x, y);
        }
    },
    /**
     * 创建下拉菜单
     * @param id   //当前编辑的主元数据图元Id
     * @param mmId //当前元数据所属模型
     */
    bulidMenu : function(id,mmId,layertype,figure,flag){
        var me = this,menu = null;
//		if(!id){
//			return null;
//		}
        if(layertype =="metadata"){//元数据图层
            if(flag=="metadata_depend"){
                menu = me.bulidDependMenu(id, mmId);
            }else {
                //判断是主图元
                if(id == figure.getUserData().getId()){
                    menu = me.bulidCompMenu(id, mmId);
                }else if(figure.getFigureType()=="mdtype" || figure.getFigureType()=="lettertype"){ //判断是否是分类图元
                    if(figure.getId().indexOf("_")>0){
                        menu = me.bulidCategoryFigureDetailMenu(figure);
                    }else{
                        menu = me.bulidCategoryFigureMenu(figure);
                    }
                }
            }
        }else if(layertype =="metadata_datamap"){ //数据地图
            menu = me.bulidDMLineMenu();
        }else if(layertype =="queryLayer"){
            if(id == figure.getUserData().getId()){
                menu = me.bulidQueryLayerMenu();
            }
        }
        return menu;
    },
    /**
     * 创建组合关系图层的元数据右键菜单
     */
    bulidCompMenu : function(id,mmId){
        var me= this, cacheM = me.cacheMenu.get(id),menu = null;
        if(!cacheM){
            menu = new Ext.menu.Menu();
            var result =Fn.Request("metamodel/getChildrens.do",false,{id:mmId});
            if(result && result.result){
                var data = result.result,items= [],item=null,importItems=[],importItem=null;
                for(var i=0;i<data.length;i++){
                    item = {
                        xtype :"menuitem",
                        text : data[i].name,
                        params : data[i],  //解决闭包问题
                        handler : function() {
                            var mmId = this.params.id;
                            //向图层发事件，通知图层需要增加子元数据了
                            me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"addSubMD", mmId,me.currentEditFigure,id);
                        }
                    };
                    importItem = {
                        xtype :"menuitem",
                        text : data[i].name,
                        params : data[i],  //解决闭包问题
                        handler : function() {
                            var mmId = this.params.id;
                            //向图层发事件，通知图层需要增加子元数据了
                            me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"importSubMD", mmId,me.currentEditFigure,id);
                        }
                    };
                    items.push(item);
                    importItems.push(importItem);//添加导入菜单
                }
                if(items.length>0)menu.add({  //添加元数据
                    xtype :"menuitem",
                    text : Dep.metadata.I18N.metadatamng.menu.add,
                    menu :{
                        items:items
                    },
                    icon:"Dep/metadata/resource/img/add.png"
                });

                if(importItems.length>0)menu.add({  //导入
                    xtype :"menuitem",
                    text : Dep.metadata.I18N.metadatamng.menu.import,
                    menu :{
                        items:importItems
                    },
                    icon:"img/btn/import.png"
                });
            }
            var resultMap =Fn.Request("metadatamap/getMMDep.do",false,{id:id});
            if(resultMap && resultMap.result.targets){
                var dataMap = resultMap.result.targets,createMapItems=[],createMapItem=null;
                for(var i=0;i<dataMap.length;i++){  //获取映射数据
                    createMapItem = {
                        xtype :"menuitem",
                        text : dataMap[i].fromMmName,
                        params : dataMap[i],  //解决闭包问题
                        handler : function() {
                            var id = this.params.id;
                            var fromMdId = this.params.fromMdId;
                            var toMdId = this.params.toMdId;
                            var mmDepeFromId=this.params.fromMmId;
                            //向图层发事件，通知图层需要增加子元数据了
                            me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"createMapSubMD",mmId,me.currentEditFigure,id,fromMdId,toMdId,mmDepeFromId);
                        }
                    };
                    createMapItems.push(createMapItem);
                }
                if(createMapItems.length>0)menu.add({  //创建映射
                    xtype :"menuitem",
                    text : Dep.metadata.I18N.metadatamng.menu.createMap,
                    menu :{
                        items:createMapItems
                    },
                    icon:"img/btn/map.png"
                });
            }
            if (resultMap && resultMap.result.sources) {
                var dataMapped = resultMap.result.sources, createMappedItems = [], createMappedItem = null;
                for (var i = 0; i < dataMapped.length; i++) {  //获取被映射数据
                    createMappedItem = {
                        xtype: "menuitem",
                        text: dataMapped[i].fromMmName,
                        params: dataMapped[i],  //解决闭包问题
                        handler: function () {
                            var id = this.params.id;
                            // var fromMmId = this.params.fromMmId;
                            var fromMdId = this.params.fromMdId;
                            var toMdId = this.params.toMdId;
                            var mmDepeFromId=this.params.fromMmId;
                            //向图层发事件，通知图层需要增加子元数据了
                            me.getContainer().executeActionSpanContainer(me.LAYERPARAM, "createMapSubMD", mmId, me.currentEditFigure, id,fromMdId,toMdId,mmDepeFromId);
                        }
                    };
                    createMappedItems.push(createMappedItem);
                }
                if (createMappedItems.length > 0) menu.add({  //创建被映射
                    xtype: "menuitem",
                    text: Dep.metadata.I18N.metadatamng.menu.createMapped,
                    menu: {
                        items: createMappedItems
                    },
                    icon: "img/btn/mapped.png"
                });
            }
            //映射管理
            menu.add({
                xtype :"menuitem",
                text : "映射管理",
                handler : function() {
                	me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"queryMapping",id);
                	me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"queryPassiveMapping",id);
                },
                icon:"Dep/metadata/resource/img/query_mapping.png"
            });
            //修改
            menu.add({
                xtype :"menuitem",
                text : Dep.metadata.I18N.metadatamng.menu.edit,
                handler : function() {
                    me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"editMetadata",id);
                },
                icon:"Dep/metadata/resource/img/edit.png"
            });
            //发布
            menu.add({
                xtype :"menuitem",
                text : Dep.metadata.I18N.metadatamng.menu.pub,
                handler : function() {
                    me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"showPubMetadataWin",id);
                },
                icon:"Dep/metadata/resource/img/pub.png"
            });
            //-----其他功能【版本查询、分析】--------------
            menu.add({
                xtype :"menuitem",
                text : "版本查询",
                handler : function() {
                    me.versionSearch();
                },
                icon:"Dep/metadata/resource/img/version.png"
            });

            var analysisLayerObj = {"type" : "analyseMetadata","fGroups" : "metadata","name" : "元数据分析","desc" : "元数据分析","layout" : Dep.framework.editor.I18N.LAYOUT.SODUKU};
            menu.add({
                xtype :"menuitem",
                text : "影响分析",
                handler : function() {
                    me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"impactAnalysis");
                },
                icon:"Dep/metadata/resource/img/analyse.png"
            });


            menu.add({
                xtype :"menuitem",
                text : "血统分析",
                handler : function() {
                    me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"strainAnalysis");
                },
                icon:"Dep/metadata/resource/img/analyse.png"
            });
            menu.add({
                xtype :"menuitem",
                text : "全链分析",
                handler : function() {
                    me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"allAnalysis");
                },
                icon:"Dep/metadata/resource/img/analyse.png"
            });
            menu.add({
                xtype :"menuitem",
                text : "关联度分析",
                handler : function() {
                    me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"associateAnalysis");
                },
                icon:"Dep/metadata/resource/img/associate.png"
            });
            me.cacheMenu.add(id,menu);
        }else{
            menu = cacheM;
        }
        return menu;
    },
    /**
     * 创建依赖关系图层上的元数据右键菜单
     */
    bulidDependMenu : function(id, mmId){
        var me= this,menu = null;
        //判断如果当前选择的图元不是主图元，则值显示删除菜单
        var fgId = me.currentEditFigure.getId();
        if(fgId!=id){
            menu = me.buildDelDependMenu(id);
        }else{
            menu = me.bulidAddDependMenu(id, mmId);
        }
        return menu;
    },
    /**
     * 添加数据地图图层中的线右键菜单
     * @param id
     */
    bulidDMLineMenu : function(){
        var me = this,menu = new Ext.menu.Menu(),fg = me.currentEditFigure;
        var sourceId = fg.getUserData().getBussData().raw.srcLogicNodeId,targetId = fg.getUserData().getBussData().raw.destLogicNodeId;
        menu.add({
            xtype :"menuitem",
            text : "详细",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"showDataMapByNodeIds",sourceId,targetId);
            },
            icon:"Dep/metadata/resource/img/del.png"
        });
        return menu;
    },
    /**
     * 查询元数据界面右键菜单
     * @param id
     */
    bulidQueryLayerMenu : function(){
        var me = this,menu = new Ext.menu.Menu(),fg = me.currentEditFigure;
        var analysisLayerObj = {"type" : "analyseMetadata","fGroups" : "metadata","name" : "元数据分析","desc" : "元数据分析","layout" : Dep.framework.editor.I18N.LAYOUT.SODUKU};
        menu.add({
            xtype :"menuitem",
            text : "影响分析",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"impactAnalysis");
            },
            icon:"Dep/metadata/resource/img/analyse.png"
        });
        menu.add({
            xtype :"menuitem",
            text : "血统分析",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"strainAnalysis");
            },
            icon:"Dep/metadata/resource/img/analyse.png"
        });
        menu.add({
            xtype :"menuitem",
            text : "全链分析",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"allAnalysis");
            },
            icon:"Dep/metadata/resource/img/analyse.png"
        });
        menu.add({
            xtype :"menuitem",
            text : "关联度分析",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"analyseMetadata",analysisLayerObj,"associateAnalysis");
            },
            icon:"Dep/metadata/resource/img/associate.png"
        });
        return menu;
    },
    /**
     * 创建依赖管理的右键上下文菜单
     * @param id
     * @param mmId
     * @param menu
     * @returns {*}
     */
    bulidAddDependMenu : function(id, mmId,menu){
        var me= this, cacheM = me.cacheDependMenu.get(mmId),menu = null;
        if(!cacheM){
            var result =Fn.Request(Dep.metadata.url.metadatamng.getDependMM,false,{id:mmId});
            if(result && result.result){
                //创建 <增加菜单>
                var data = result.result,items= [];
                for(var i=0;i<data.length;i++){
                    var obj = data[i];
                    var item = {
                        xtype :"menuitem",
                        text : obj.name,
                        params : obj,  //解决闭包问题
                        handler : function(){
                            var mmTId = this.params.toMid,mdDId = this.params.id;
                            me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"showAddDependMDWin",mmTId,me.currentEditFigure,id,mdDId);
                        }
                    };
                    items.push(item);
                }
                if(items.length>0){
                    menu = new Ext.menu.Menu();
                    menu.add({
                        xtype :"menuitem",
                        text : Dep.metadata.I18N.metadatamng.menu.addDepend,
                        menu :{
                            items:items
                        },
                        icon:"Dep/metadata/resource/img/add.png"
                    });
                }

            }
            if(menu)me.cacheDependMenu.add(mmId,menu);
        }else{
            menu = cacheM;
        }
        return menu;
    },
    /**
     * 创建删除依赖的右键上下文菜单
     */
    buildDelDependMenu : function(id){
        var me = this,menu = new Ext.menu.Menu();
        menu.add({
            xtype :"menuitem",
            text : Dep.metadata.I18N.metadatamng.menu.del,
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"deleteDepandMD",id,me.currentEditFigure);
            },
            icon:"Dep/metadata/resource/img/del.png"
        });
        return menu;
    },

    /**
     * 创建分类图元的上下文菜单
     * @param id
     */
    bulidCategoryFigureMenu : function(figure){
        var me = this,menu = new Ext.menu.Menu(),fg = me.currentEditFigure;
        menu.add({
            xtype :"menuitem",
            text : "详细",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"showMDCategory",figure);
            },
            icon:"Dep/metadata/resource/img/del.png"
        },{
            xtype :"menuitem",
            text : "明细（列表）",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"showSubMDDetail",figure);
            },
            icon:"Dep/metadata/resource/img/del.png"
        });
        return menu;
    },
    /**
     * 创建分类图元详情的上下文菜单
     * @param id
     */
    bulidCategoryFigureDetailMenu : function(figure){
        var me = this,menu = new Ext.menu.Menu(),fg = me.currentEditFigure;
        menu.add({
            xtype :"menuitem",
            text : "展开",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"showCategoryFigureDetail",figure);
            },
            icon:"Dep/metadata/resource/img/expand.png"
        });
        menu.add({
            xtype :"menuitem",
            text : "关闭",
            handler : function() {
                me.getContainer().executeActionSpanContainer(me.LAYERPARAM,"closeCategoryFigureDetail",figure);
            },
            icon:"Dep/metadata/resource/img/collapse.png"
        });
        return menu;
    },
    /**
     * 从模型对象中获取菜单配置
     *
     * @param {}
     *            model
     * @return {}
     */
    _getContextMenus : function(model) {},
    /**
     * 从模型对象中获取图元的状态配置
     *
     * @param {}
     *            model
     * @return {}
     */
    _getStatusEnums : function(model) {},

    /**
     * * 根据当前图元状态的配置来生成菜单项,默认展示所有菜单 *
     *
     * @param {}
     *            shapeMenu 父菜单,即顶级菜单
     * @param {}
     *            menuArray 当前状态允许展示的菜单集合
     * @param {}
     *            menusMap 所有菜单和菜单组的集合
     * @return {Ext.menu.Menu}
     *
     */
    _generateMenus : function(shapeMenu, menuArray, menusMap) {
        var me = this, menuConfig = null, i = 0, menus = null, menuItem = null;
        if (menuArray && menuArray.length > 0) {
            for (i in menuArray) {
                menuConfig = menuArray[i];
                // 当前允许添加的菜单名称集合
                menus = menuConfig.menus;
                if (menuConfig.type == "normal") {
                    // 添加菜单
                    me._insertNormalMenus(shapeMenu, menus, menusMap);
                } else if (menuConfig.type == "group") {
                    // 添加菜单组
                    me._insertGroupMenus(shapeMenu, menus, menusMap);
                }
            }
        }
        return shapeMenu;
    },
    /**
     * 生成所有的菜单
     *
     * @param {}
     *            shapeMenu 父菜单,即顶级菜单
     * @param {}
     *            menusMap 所有菜单集合
     * @return {}
     */
    _generateAllMenus : function(shapeMenu, menusMap) {
        var me = this, /* shapeMenu = new Ext.menu.Menu(), */menuConfig = null, menuItem = null;
        for (i in menusMap) {
            menuConfig = menusMap[i];
            if (menuConfig.type == "normal") {
                menuItem = me._createMenuItem(menuConfig);
                if (menuItem) {
                    shapeMenu.add(menuItem);
                }

            } else if (menuConfig.type == "group") {
                menuItem = me._createGroupMenu(menuConfig, {});
                if (menuItem) {
                    shapeMenu.add(menuItem);
                }
            }
        }
        return shapeMenu;
    },
    /**
     * 添加所有的菜单选项,而不是菜单组选项
     *
     * @param {}
     *            shapeMenu 父菜单
     * @param {}
     *            menus 允许添加的菜单名称集合
     * @param {}
     *            menusMap 菜单配置项Map
     */
    _insertNormalMenus : function(shapeMenu, menus, menusMap) {},
    /**
     * 根据配置生成一个menuItem对象
     *
     * @param {}
     *            menuConfig 菜单配置对象
     * @return {Ext.menu.Item}
     */
    _createMenuItem : function(menuConfig) {
        var me = this, action = null;
        if (!menuConfig) {
            return null;
        }
        action = me.getAction(menuConfig.action);
        // TODO action获取还未做
        return new Ext.menu.Item({
            text : menuConfig.name,
            // disabled : true,
            handler : function() {
                // 此菜单的回调函数,默认参数为当前上下文菜单依赖的图元
                action.functionality.call(me, me.currentEditFigure);
            },
            icon : menuConfig.icon
        });
    },
    // TODO 暂时未考虑三层菜单结构
    /**
     * 添加所有的菜单组
     *
     * @param {}
     *            shapeMenu 父菜单
     * @param {}
     *            menus 允许添加的菜单名称集合其结构如下: [{ "groupName" : "menuGroup", "menus" :
	 *            ["del", "add"] }]
     * @param {}
     *            menusMap 菜单配置项Map
     */
    _insertGroupMenus : function(shapeMenu, menus, menusMap) {},
    /**
     * 创建一个菜单组
     *
     * @param {}
     *            menuConfig 一个菜单组的配置对象如下: { "type" : "group", "name" :
	 *            "menuGroup", "desc" : "MENUS.STOP.DES", "menus" : [{ "type" :
	 *            "nomal", "name" : "del", "desc" : "#{xxxx}", "listeners" : [{
	 *            "eventName" : "click", "action" : "actionName" }] }] }
     * @param {}
     *            groupObj 一个菜单组在状态数组中的配置,可以具体到展示哪些菜单,默认展示所有菜单.结构如下:
     *            {"groupName" : "menuGroup", "menus" : ["del", "add"] }
     * @return {Ext.menu.Item}
     */
    _createGroupMenu : function(menuConfig, groupObj) {},
    /**
     * 将一个菜单组的所有菜单配置项整理到一个对象中方便取用
     *
     * @param {}
     *            menuConfig
     * @return {}
     */
    _createGroupMenuMap : function(menuConfig) {},
    /**
     * 创建添加port的菜单
     *
     * @param {}
     *            shapeMenu
     * @param {}
     *            portConfig
     */
    _createPortMenus : function(shapeMenu, portConfig) {
        var me = this, /* 创建一个添加port的父菜单,添加各种port的菜单均为此菜单的子菜单 */subMenu = null, menuSparator = new Ext.menu.Separator(), menuItem = new Ext.menu.Item(
            {
                text : "添加端口",
                icon : me.defaultPortIcon
            }), menu = new Ext.menu.Menu();

        if (!portConfig) {
            return;
        }
        if ($.isArray(portConfig) && portConfig.length > 0) {
            $.each(portConfig, function(n, config) {
                // 创建添加某一类port的菜单
                subMenu = me._createPortMenu(config);
                menu.add(subMenu);
            });
        }
        menuItem.setMenu(menu);
        // 添加一个分隔符
        shapeMenu.add(menuSparator);
        shapeMenu.add(menuItem);
    },
    /**
     * 创建添加一种类型的port的菜单
     *
     * @param {}
     *            config
     * @return {}
     */
    _createPortMenu : function(config) {
        var me = this;
        return new Ext.menu.Item({
            text : config.name,
            handler : function() {
                me._addPortToFigure.call(me, config);
            },
            icon : config.icon
        });
    },
    /**
     * 调用图元自己的方法添加port
     *
     * @param {}
     *            config
     */
    _addPortToFigure : function(config) {
        var me = this, figure = me.getCurrentEditFigure();
        me.getContainer().getEditor().executeAction(
            Dep.framework.editor.ACTION.EDITOR.ADD_MODEL, null, config.fType, {
                "viewData" : {
                    viewData : Ext.JSON.encode($.extend({
                        parentId : figure.getId()
                    }, config))
                },
                "bussData" : {}
            });
    },
    /**
     * 获取当前编辑的图元,即展示的是那个图元的菜单
     *
     * @return {}
     */
    getCurrentEditFigure : function() {
        if (this.currentEditFigure) {
            return this.currentEditFigure;
        } else {
            throw "当前编辑的图元为空";
        }

    },
    /**
     * 获取action
     *
     * @param {}
     *            name
     * @return {}
     */
    getAction : function(name) {
        return this.getContainer().getAction(name);
    },
    /**
     * 获取该类关联的画布类
     *
     * @returns {*}
     */
    getCanvas : function() {
        if (this.canvas) {
            return this.canvas;
        } else {
            throw "该类关联的画布类未指定!";
        }
    },
    /**
     * 版本查询功能
     */
    versionSearch : function() {
        var me = this;

        var layer = me.getContainer().getEditor().getDataManager().getCurrentEditLayer();
        if(!layer)return ;

        var node =me.currentEditNode,propsCache =layer.propsCache;
        me.showVersionPanel({mdId:node.getId(),props:propsCache});

        if(node){
            var mdId = node.getId(),mdCode = node.raw.cacheData.mdCode;
            var result =Fn.Request("version/queryByMDId.do", false, {mdCode:mdCode}, "查询元数据失败！",null,null);
            if(result){
                var data = result.result,recAr =[],rec={};
                for(var i=0;i<data.length;i++){
                    rec = {versionId:data[i].id,userver:data[i].userver,mdCode:data[i].mdCode,mdName:data[i].mdName,isNewVersion:true,verRemark:data[i].verRemark};
                    var attList = data[i].attList;
                    if(attList){
                        for(var j=0;j<attList.length;j++){
                            var name = attList[j].mmAttName;
                            rec[name] = attList[j].valUe;
                        }
                    }
                    recAr.push(rec);
                }
                me.versionGridPanel.getStore().removeAll();
                me.versionGridPanel.getStore().loadRawData(recAr);
            }
        }
    },
    /**
     * 创建版本查询页面的panel
     */
    showVersionPanel : function(cfg){
        var me = this;

        if(me.versionStore)delete me.versionStore;
        me.versionStore = Ext.create("Dep.metadata.metadatamng.store.MDVersionStore",{fieldData:cfg.props,mdId:cfg.mdId});

        if(me.versionGridPanel)delete me.versionGridPanel;
        me.versionGridPanel = Ext.create('Dep.metadata.metadatamng.view.VersionGridPanel',{store:me.versionStore,propsData:cfg.props});

        if(me.versionSearchWin)delete me.versionSearchWin;
        me.versionSearchWin = Ext.create('Ext.Window', {
            modal : true,
            title : Dep.metadata.I18N.metadatamng.plugin.versionSearchWintitle,
            layout: 'fit',
            closeAction : "hide",
            width : 600,
            height : 380,
            items : me.versionGridPanel
        });
        me.versionSearchWin.show();
    }

});