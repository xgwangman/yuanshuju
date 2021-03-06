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
if (!Dep.framework.editor.plugin.containers.layer) {
	Dep.framework.editor.plugin.containers.layer = {};
}

/**
 * 与分析管理有关的元数据操作
 */
Dep.framework.editor.plugin.containers.layer.AnalyseMetadata = Dep.framework.editor.plugin.BasePlugin.extend({
	/**
	 * 插件名称
	 */
	NAME : "Dep.framework.editor.plugin.containers.layer.AnalyseMetadata",
	
	cacheMdIds : [],
	/**
	 * 完成事件注册
	 */
	init : function(container) {
		var me = this;
		me._super(container);
		me.getContainer().on(Dep.framework.editor.EVENT.LAYER.INIT_COMPONENT,
	            me._initEvent.bind(me));
	},
	_initEvent : function() {
		var me = this;
		me.getContainer().regiestActions([ {
			name : "analyseMetadata",
			functionality : Ext.Function.bind(me.analyseMetadata, me),
			group : "analyseMD"
		}]);
	},
    /**
     * 元数据分析
     * @param layerCfg  图层配置
     * @param type  分析类型
     */
	analyseMetadata: function (layerCfg,type) {
		var me = this;
		if(!layerCfg)return ;
//		me.changeLayer(layerCfg);
		me.cacheMdIds=[];
		//获取当前操作的元数据id
		var nodeMd = me.getContainer().currentEditNodeData;
		if(!nodeMd)return ;
		var id = nodeMd.getId();
		var code = nodeMd.raw.cacheData.mdCode;
		
		if(type=="impactAnalysis"){
			me.impactAnalysis(id);
		}else if(type=="strainAnalysis"){
			me.strainAnalysis(id);
		}else if(type=="allAnalysis"){
			me.allAnalysis(id);
		}else if(type=="associateAnalysis"){
			me.associateAnalysis(id);
		}else{
			console.log("元数据分析参数错误-----");
		}
	},
	/**
	 * 切换图层
	 * @param layerCfg
	 */
	changeLayer : function(layerCfg){
    	var me = this;
    	//切换图层
    	me.getContainer().bulidLayerObj(layerCfg);
    	me.getContainer().removeFiguresByLType(layerCfg.type);	
	},
	/**
	 * 影响分析
	 */
	impactAnalysis : function(id){
		var me = this;
		//返回结构 DataAnalyzeView {List<AnalyseResultTreeNodeView> node,List<AnalyseNodeLineView> lines}
		var result = Fn.Request("analyse/impactAnalysis.do", false, {metadataId: id});
		var mdList = me.getListMetadata(result.result);
		var lines = me.getListLines(result.result);
		me.fireShowFigureEvent({mdList:mdList,lines:lines});
	},
	/**
	 * 血统分析
	 */
	strainAnalysis : function(id){
		var me = this;
		var result = Fn.Request("analyse/strainAnalysis.do", false,  {metadataId: id});
		var mdList = me.getListMetadata(result.result);
		var lines = me.getListLines(result.result);		
		var imgs = me.getRelateImgs(result.result);		
		me.fireShowFigureEvent({mdList:mdList,lines:lines,imgs:imgs});
	},
	/**
	 * 全链分析
	 */
	allAnalysis : function(id){
		var me = this;
		var result = Fn.Request("analyse/allAnalysis.do", false,  {metadataId: id});
		var mdList = me.getListMetadata(result.result);
		var lines = me.getListLines(result.result);		
		me.fireShowFigureEvent({mdList:mdList,lines:lines});
	},
	/**
	 * 关联度分析
	 */
	associateAnalysis : function(id){
		var me = this;
		var result = Fn.Request("analyse/associateAnalysis.do", false, {metadataId: id});
		var mdList = me.getListMetadata(result.result);
		var lines = me.getListLines(result.result);		
		me.fireShowFigureEvent({mdList:mdList,lines:lines});
	},
	
	/**
	 * 解析结果，获取关联的图片信息
	 * @param result
	 */
	getRelateImgs : function(result){
		var me = this,list=[];
		if(!result) return null;
		var me= this,imgList = result.convSvg;
		return imgList;
	},
	
	/**
	 * 解析结果，获取第一层的元数据信息
	 * @param result
	 */
	getListMetadata : function(result){
		var me = this,list=[];
		if(!result) return null;
		var me= this,treeMd = result.node;
		for(var i=0;i<treeMd.length;i++){
			var id = treeMd[i].nodeId;
			list.push({id:treeMd[i].nodeId,mdCode:treeMd[i].code,mdName:treeMd[i].name,mmId:treeMd[i].mmId});
			me.cacheMdIds.push(id);
		}
		return list.length>0 ? list : null;
	},
	/**
	 * 解析结果，返回线
	 */
	getListLines : function(result){
		if(!result) return null;
		var me= this,lines = result.lines,res=[];
		for(var i=0;i<lines.length;i++){
			var startId = lines[i].startNodeId;
			var endId = lines[i].endNodeId;
			//过滤线
			if((Ext.Array.contains(me.cacheMdIds,startId) && Ext.Array.contains(me.cacheMdIds,endId))){
					res.push(lines[i]);
			}
		}
		return res.length>0 ? res : null;
	},
	/**
	 * 触发展示分析图层图元的操作
	 * @param obj  参数
	 */
	fireShowFigureEvent : function(obj){
		var me = this;
		if(!obj)return ;
		
//		if(obj.mdList){
//			me.getContainer().executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","showAnalysisMD",obj.mdList);
//		}
//		if(obj.lines){
//			me.getContainer().executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","showAnalysisLines",obj.lines);
//		}
		
		me.getContainer().executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","showAnalysisMD",obj);
	}
    
});