Ext.define('MyApp.controller.Login', {
	extend : 'Ext.app.Controller',
	config : {
		refs : {
			loginButton : {
				selector : '#login',
				xtype : 'button'
			},
			username : {
				selector : '#user',
				xtype : 'textfield'
			},
			password : {
				selector : '#pass',
				xtype : 'passwordfield'
			}
		},

		control : {
			"loginButton" : {
				tap : 'onLoginButtonTap'
			}
		}
	},

	onLoginButtonTap : function(button, e, options) {
		Ext.Ajax.request({
			url : '/accounts/mobile-login/',

			method : 'POST',

			params : {
				user : this.getUsername().getValue(),
				pass : this.getPassword().getValue()
			},

			success : function(response) {
				var json = Ext.decode(response.responseText);
				if (json.type == 'success') {
					// LOAD THE DAMN SECOND VIEW HERE!
					var paneltab = Ext.create('MyApp.view.ThisView');
					Ext.getCmp('loginForm').destroy();
					Ext.Viewport.add(paneltab);

				} else {
					alert(json.value);
				}
			},

			failure : function(response) {
				alert('The request failed!');
			}
		});
	}
});

Ext.define('MyApp.view.LoginForm', {
	extend : 'Ext.form.Panel',
	fullscreen : true,

	config : {
		id : 'loginForm',
		ui : 'light',
		items : [{
			xtype : 'fieldset',
			ui : 'light',
			title : 'Log into the system',
			items : [{
				xtype : 'textfield',
				id : 'user',
				label : 'User',
				name : 'user'
			}, {
				xtype : 'passwordfield',
				id : 'pass',
				label : 'Pass',
				name : 'pass'
			}]
		}, {
			xtype : 'button',
			id : 'login',
			ui : 'confirm',
			text : 'Login',
			listeners : {
				tap : function() {

				}
			}
		}]
	}
});

Ext.define("IframeCmp.view.Main", {
	extend : 'Ext.tab.Panel',
	layout : 'fit',

	config : {
		width : '100%',
		height : '100%',

		items : [{
			title : 'Add Trip',
			iconCls : 'star',
			xtype : 'iframecmp',
			url : '/add-trip'
		}, {
			title : 'Trips',
			iconCls : 'star',
			xtype : 'iframecmp',
			url : '/trips'
		}, {
			title : 'Report',
			iconCls : 'star',
			xtype : 'iframecmp',
			url : '/report'
		}]
	}
});

Ext.define('Ext.ux.IframeComponent', {
	extend : 'Ext.Component',
	scrollable : true,
	layout : 'vbox',

	xtype : 'iframecmp',
	config : {
		/**
		 * @cfg {String} url URL to load
		 */
		url : null,

		/**
		 * @cfg
		 * @inheritdoc
		 *
		 * Add your own style
		 */
		baseCls : Ext.baseCSSPrefix + 'iframe'
	},

	initialize : function() {
		var me = this;
		me.callParent();

		me.iframe = this.element.createChild({
			tag : 'iframe',
			src : this.getUrl(),
			style : 'width: 100%; height: 100%;'
		});

		me.relayEvents(me.iframe, '*');
	}
});

Ext.define("MyApp.view.ThisView", {
	extend : 'Ext.Panel',
	xtype : 'thisview',
	id : 'thisView',
	config : {
		styleHtmlContent : true,
		html : 'Loading ...'
	},

	initialize : function() {
		this.callParent(arguments);

		Ext.Ajax.request({
			url : '/add-trip',
			method : 'GET',
			callback : function(options, success, response) {
				Ext.getCmp('thisView').setHtml(response.responseText);
				
				$.getScript("/static/scripts/app.js").done(function(script, textStatus) {
					console.log(textStatus);
				}).fail(function(jqxhr, settings, exception) {
					alert(exception);
				});
				

			}
		});
	}
});

