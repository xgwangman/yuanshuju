/**
 * 元数据信息的维护界面
 * 增加/修改功能
 */
Ext.define('Dep.metadata.metadatamng.view.MDBaseInfoWin', {
		extend : 'Ext.window.Window',
		modal : true,
		resizable : false,
		maximizable : false,
		autoDestroy : true,
		winType : true,  //win的类型 【true：新增；false：编辑】
		title : Dep.metadata.I18N.metadatamng.view.metadatainfo,
		layout: 'fit',
		width : 500,
		initHeight : 300,
		height : 300,
		closeAction : "hide",
		buttonAlign :"center",
		parentMDId : null,
		modelListCache :[],
		cachePropMap :new Ext.util.MixedCollection(), 
		constructor: function(conf){
			var me = this;
			if(conf && conf.parentContainer)me.parentContainer = conf.parentContainer;
			if(conf && conf.modelListCache)me.modelListCache = conf.modelListCache;
			var mmcmpt =me.getMMCmpt();
			me.baseInfoFS = Ext.create("Ext.form.FieldSet",{
					title:Dep.metadata.I18N.metadatamng.view.baseinfo,
					layout:"form",
					style:"margin:15 10 15 10;padding: 15 10 15 10",
					items:[mmcmpt,
						{
							xtype:"textfield",
							id :"id",
//							fieldLabel:"编号",
							hidden : true,
							labelWidth :80
						},
						{
							xtype:"textfield",
							id :"code",
							name : "code",
							fieldLabel:Dep.metadata.I18N.metadatamng.view.code,
							labelWidth :80
						},
						{
							xtype:"textfield",
							id :"name",
							fieldLabel:Dep.metadata.I18N.metadatamng.view.name,
							labelWidth :80
						}
					]					
			});
			me.propsFS =Ext.create("Ext.form.FieldSet",{
					title:Dep.metadata.I18N.metadatamng.view.baseprops,
					layout:"form",
					style:"margin:15 10 15 10;padding: 15 10 15 10",
					collapsible : true,
					items :[]
			});
			me.items ={xtype:"panel",items:[me.baseInfoFS,me.propsFS]};
			
			me.buttons = [{
				xtype : 'button',
				text : Dep.metadata.I18N.metadatamng.view.savebtn,
				handler : function(){
					if(me.validVal()){
						me.parentContainer.executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","saveMetadata", null);
					}
					
				}
			},{
				xtype : 'button',
				text : Dep.metadata.I18N.metadatamng.view.cancelbtn,
				handler : function(){
					me.hide();
				}		
			}];
			me.callParent();
		},
		listeners : {
			'hide' : function(){
				var me = this;
				me.resetVal();
			},
			'show' : function(){
				var me = this;
				me.propsFS.removeAll();
				me.setHeight(me.initHeight);
			}
		},
		/**
		 * 重置win中的属性内容
		 */
		resetVal : function(){
			var me = this;
			me.winType = true;
			me.parentMDId = null;
			me.metaModelCombo.setDisabled(false);
			var codecmpt = Ext.ComponentQuery.query('#code',me.baseInfoFS);
			if(codecmpt){
				codecmpt[0].setDisabled(false);
			}
			if(me.baseInfoFS && me.baseInfoFS.items){
				for(var i in me.baseInfoFS.items.items){
					me.baseInfoFS.items.items[i].setValue(null);
				}
			}
			if(me.propsFS && me.propsFS.items){
				for(var obj in me.propsFS.items.items){
					me.baseInfoFS.items.items[i].setValue(null);
				}				
			}
		},
		/**
		 * 当元模型下拉框改变时，元数据编码跟着生成新的随机编码
		 */
		setRandomCode : function(modelId) {
			var me = this;
			var metamodel = me.mmStore.findRecord("id", modelId);
			if(metamodel) {
				var codecmpt = Ext.ComponentQuery.query('#code',me.baseInfoFS);
				if(codecmpt){
					var code = metamodel.raw.code; //父类元模型的code
					var strs = Math.floor(Math.random()*900000 + 100000);
					codecmpt[0].setValue(code+"-"+strs);
				}
			}
		},
		/**
		 * 修改元模型后，获取属性信息更新到界面上
		 */
		setProps : function(props){
			var me = this;
			if(!props){
				me.propsFS.removeAll();
				me.setHeight(me.initHeight);
				me.doLayout(true);
				return ;
			}
			var fields = [],length = props.length;
			for(var i=0;i<length;i++){
				var field = {
						id :props[i].id,
						xtype:"textfield",
						name :props[i].code,
						orgName :props[i].name,
						fieldLabel:props[i].name+"("+props[i].code+")",
						labelWidth :185
				};
				fields.push(field);
			}
			if(me.propsFS){
				me.propsFS.removeAll();
				me.propsFS.add(fields);
			}
			me.setHeight(me.initHeight+(25*length));
			me.doLayout(true);
		},
		/**
		 * 初始化模型下拉框
		 */
		getMMCmpt : function (){
			var me = this;
			//元模型store
			if(!me.mmStore){
//				me.mmStore = Ext.create('Dep.metadata.common.store.ComboStore',{
//					url : Dep.metadata.url.metadatamng.getModelList
//				});
	            me.mmStore = Ext.create('Ext.data.Store', {
	            	singleton : true, 
	            	autoLoad:true,
	            	storeId:'mmComboStore', 
	            	fields:[ 
				            {name:'id', type: 'string'}, 
				            {name:'name',type:'string'}, 
				            {name:'code',type:'string'} 
				        ], 
				    data:me.modelListCache
	            });
			}
			if(!me.metaModelCombo){
				me.metaModelCombo = Ext.create('Ext.form.ComboBox', {
				    fieldLabel: Dep.metadata.I18N.metadatamng.view.metamodel,
				    store: me.mmStore,
				    queryMode: 'local',
				    displayField: 'name',
				    valueField: 'id',
				    editable :false,
				    labelWidth :80,
				    listeners :{
				    	change : function(obj, newValue, oldValue, eOpts){
				    		me.changeProps(newValue);
				    	}
				    }
				});
			}
			return me.metaModelCombo;
		},
		/**
		 * 根据模型获取属性,并修改界面信息
		 */
		changeProps : function(modelId){
			var me = this;
			if(modelId){
				var result =me.parentContainer.getMMProps(modelId);
				me.setProps(result);
				if(me.winType) {//添加的时候才设置随机编码
					me.setRandomCode(modelId);
				}
			}
		},
		/**
		 * 编辑操作，将值设置到控件中
		 * @param obj
		 */
		setValues : function(obj){
			var me = this;
			if(!obj)return ;
			//设置基本信息的值
			var idcmpt = Ext.ComponentQuery.query('#id',me.baseInfoFS);
			var namecmpt = Ext.ComponentQuery.query('#name',me.baseInfoFS);
			var codecmpt = Ext.ComponentQuery.query('#code',me.baseInfoFS);
			
			if(idcmpt && idcmpt[0])idcmpt[0].setValue(obj.id);
			if(namecmpt && namecmpt[0])namecmpt[0].setValue(obj.mdName);
			if(codecmpt && codecmpt[0])codecmpt[0].setValue(obj.mdCode);
			me.getMMCmpt().setValue(obj.mmId);
			if(obj.mmId)me.getMMCmpt().setDisabled(true);
			//设置属性信息
			for(var i in me.propsFS.items.items){
				var cmpt = me.propsFS.items.items[i];
				cmpt.setValue(obj[cmpt.name] ? obj[cmpt.name] : obj[cmpt.orgName]);
			}
		},
		/**
		 * 创建类型
		 * @param flag [true:新增;false:编辑]
		 */
		setWinType : function(flag){
			var me = this;
			me.winType = flag;
			if(!flag){
				me.metaModelCombo.setDisabled(true);
				var codecmpt = Ext.ComponentQuery.query('#code',me.baseInfoFS);
				if(codecmpt){
					codecmpt[0].setDisabled(true);
				}				
			}
		},
		/**
		 * 获取类型
		 */
		getWinType : function(){
			return this.winType;
		},
		/**
		 * 返回属性的值---数组
		 */
		getPropsVals : function(metadataId){
			var me = this;
			var vals =[];
			for(var i in me.propsFS.items.items){
				var id = me.propsFS.items.items[i].id;
				var name = me.propsFS.items.items[i].name;
				var val =me.propsFS.items.items[i].getValue();
				vals.push({mmAttId:id,mmAttName:name,mdId:metadataId,valUe:val});
			}
			return vals;	
		},
		/**
		 * 验证值
		 */
		validVal : function(){
			var me = this;
			if(me.getMMCmpt().getValue()==""){
				Dep.framework.editor.util.Msg.error("元模型不能为空！", "提示");
				return false;
			}
			var codecmpt = Ext.ComponentQuery.query('#code',me.baseInfoFS);
			var namecmpt = Ext.ComponentQuery.query('#name',me.baseInfoFS);
			if(codecmpt && codecmpt[0] && (codecmpt[0].getValue()=="")){
				Dep.framework.editor.util.Msg.error("代码不能为空！", "提示");
				return false;
			}
			if(namecmpt && namecmpt[0] && (namecmpt[0].getValue()=="")){
				Dep.framework.editor.util.Msg.error("名称不能为空！", "提示");
				return false;
			}
			return true;
		},
		/**
		 * 设置父元数据Id
		 */
		setParentMDId : function(id){
			var me= this;
			me.parentMDId = id;
		},
		/**
		 * 获取父元数据Id
		 * @returns
		 */
		getParentMDId : function(){
			return this.parentMDId;
		}
		
});
