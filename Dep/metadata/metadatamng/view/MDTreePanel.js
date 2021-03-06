/**
 * 元数据树结构
 */
Ext.define("Dep.metadata.metadatamng.view.MDTreePanel", {
	extend : "Ext.tree.Panel",
	title :Dep.metadata.I18N.metadatamng.metadata,
	store : null,  //TreeStore
	columnLines : true,
	parentcontainer : null, //父容器：图层容器
	buttonAlign :"center",
	animate : false,
	viewBtns : null,
	constructor : function(conf) {
		var me = this,viewStore = null;
		if(conf.parentcontainer)me.parentcontainer = conf.parentcontainer;
		if(conf.store)me.store = conf.store;
//		me.getDockedItems();
		me.callParent();
	},
	currentNodeId : null,
    // listeners:{
     //    cellclick:function( view, td, cellIndex, record, tr, rowIndex, e, eOpts ){
     //    	var me=this;
     //        var childNodes=td.childNodes;
     //        for(var i=0;i<childNodes.length;i++){
     //            td.childNodes[i].style.background = '';
	// 		}
     //        var selectStyle=td.childNodes[0].style;
     //        selectStyle.background="#36c7d3";
     //    }
	// },
	/**
	 * 获取当前选中节点的视图Id或者文件夹Id
	 * @param id
	 * @param optFlag  true:新增；false:编辑
	 * @returns
	 */
	getPackageId : function(id,optFlag){
		var me = this,id = id ? id : me.getSelectNodeId();
		id = id ? id : me.currentNodeId;
		var node = me.store.getNodeById(id);
		if(optFlag && node){
			var type = node.raw.nodeType;
			if(type == 10) { //文件的类型为10
				return node.getId();
			}else {
				while(type != 1){  //视图的类型为1
					node = node.parentNode;
					type = node.raw.nodeType;
				}	
				return node.getId();
			}
		}else{
			var pgId = node.raw.cacheData.mdPackageid;
			return pgId;
		}
		
	},
	/**
	 * 获取选中的节点
	 */
	getSelectNodeId :function(){
		var me = this,id=null;
		var data =me.getSelectionModel().getSelection();
		if(data){
			id = data[0].getId();
		}
		return id;
	},
	/**
	 * 刷新节点
	 */
	refreshNode :function(nodeId){
		var me = this,id=null;
		id = nodeId ? nodeId : me.currentNodeId;
		var node = me.store.getNodeById(id);
		me.store.changeTreeUrl(node);
		me.store.load({
				node:node, //刷新节点 
				callback:function(){
					if(me.parentcontainer){
						me.parentcontainer.executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","clearDatasByLayerFlag","metadata");
					}
				}
			});
	},
	/**
	 * 更新节点信息
	 */
	updataNode : function(data){
		var me = this;
		var node = me.store.getNodeById(data.id);
		var root = me.getRootNode( );
		if(node && node.parentNode){
			var pnode = node.parentNode;
			me.store.changeTreeUrl(pnode);
			me.store.load({
					node:pnode, //刷新节点 
					callback:function(){ 
					}
				});
		}
	},
	/**
	 * 创建工具条
	 */
	getDockedItems : function(viewCfg){
		var me = this;
		var dockedItems = [{
		    xtype: 'toolbar',
		    dock: 'top',
		    items: [
				{xtype:'splitbutton',text: "视图",icon:"Dep/metadata/resource/img/view.png",menu:{
					items : viewCfg
				}},			            
		        { xtype: 'button', text: Dep.metadata.I18N.metadatamng.view.querybtn,icon:"Dep/metadata/resource/img/search.png",handler : function(){
		        	me.parentcontainer.changePanelVisible(1);
		        } },
		        { xtype: 'button', text: Dep.metadata.I18N.metadatamng.view.approvalbtn,icon:"Dep/metadata/resource/img/approval.png",handler: function(){
		        	me.parentcontainer.changePanelVisible(2);
		        } }
		    ]
		}];			
		return dockedItems;
	},
	/**
	 * 更新tbar上的按钮
	 * @param recs
	 */
	updateDockedItems : function(recs){
		var me = this,viewCfg=[{text:"系统视图",handler:function(){me.fireQueryViewEvent(null);}}];
		if(!recs)return ;
		if(!recs.getRootNode().childNodes)return ;
		var nodes = recs.getRootNode().childNodes;
		for(var i=0;i<nodes.length;i++){
			var id = nodes[i].data.id;
			viewCfg.push({text:nodes[i].data.text,id:nodes[i].data.id,handler:function(){me.fireQueryViewEvent(this);}});
		}
		var dockedItems =me.getDockedItems(viewCfg);
		me.insertDocked(0,dockedItems);
	},
	/**
	 * 发出切换视图的事件
	 * @param obj
	 */
	fireQueryViewEvent : function(obj){
		var me = this,viewId = obj ? obj.id : "";
		if(me.parentcontainer){
			me.parentcontainer.executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","changeViewType",viewId);
		}
	},
	/**
	 * 重新加载视图节点
	 */
	reloadViewNode :function(viewId){
		var me = this,id=null,root = me.getRootNode();
		me.store.setSelectedViewId(viewId);
		me.store.changeTreeUrl({raw:{nodeType:0,id:viewId}});
		me.store.load({
				node:root, //刷新节点 
				callback:function(){
					if(me.parentcontainer){
						me.parentcontainer.executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","clearDatasByLayerFlag","metadata");
					}
				}
			});
	},	
});