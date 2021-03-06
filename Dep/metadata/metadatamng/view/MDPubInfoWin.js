/**
 * 元数据发布
 */
Ext.define('Dep.metadata.metadatamng.view.MDPubInfoWin', {
		extend : 'Ext.window.Window',
		modal : true,
		resizable : false,
		maximizable : false,
		autoDestroy : true,
		title : "元数据发布",
		layout: 'fit',
		width : 380,
		initHeight : 220,
		height : 220,
		closeAction : "hide",
		buttonAlign :"center",
		bodyStyle:"background-color:#FFFFFF;",
		parentContainer:null,
		constructor: function(conf){
			var me = this;
			if(conf && conf.parentContainer)me.parentContainer = conf.parentContainer;
			me.pubInfoFS = Ext.create("Ext.form.Panel",{
					style:"padding:20 15 10 8",
					layout:'form',
					border : false,
					items:[
						{
							xtype:"textfield",
							name :"id",
							hidden : true
						},
						{
							xtype:"textfield",
							fieldLabel:"版本号",
							labelAlign :"center",
							name:"userver",
							allowBlank:false,
							blankText:"版本号不能为空!",
							labelWidth :50
						},
						{
							xtype:"textarea",
							fieldLabel:"&nbsp;&nbsp;&nbsp;说明",
							name:"verRemark",
							height : 80,
							labelAlign :"center",
							labelWidth :50
						}
					]					
			});
			me.items = me.pubInfoFS;
			
			me.buttons = [{
				xtype : 'button',
				text : "确定",
				handler : function(){
					var isVal = me.pubInfoFS.isValid();
					if(isVal){
						var vals =me.pubInfoFS.getForm().getValues();
						me.parentContainer.executeActionSpanContainer("Dep.framework.editor.plugin.containers.Layer","savePubMDInfo",vals);						
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
			}
		},
		/**
		 * 重置win中的属性内容
		 */
		resetVal : function(){
			var me = this;
			me.pubInfoFS.getForm().reset();
		},
		/**
		 * 发布操作，将值设置到控件中
		 * @param obj
		 */
		setValues : function(id){
			var me = this;
			me.pubInfoFS.getForm().setValues({id:id});
		}
		
});
