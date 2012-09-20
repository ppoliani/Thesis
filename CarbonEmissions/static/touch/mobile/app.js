
Ext.application({
	name : 'MyApp',
	fullscreen : true,
	controllers: ['MyApp.controller.Login'],
	launch : function() {
		Ext.create('MyApp.view.LoginForm', {
			fullscreen : true,
			width: '100%',
			height: '100%'
		});
	}
});

