$(document).ready(function() {
	$('#loginBtn').on('click', function(event) {
		submitLoginForm();
	});
});

function submitLoginForm() {
	var username = $('#username').val();
	var password = $('#password').val();
	var url = '/accounts/mobile-login/';
	var data = {
		user : username,
		pass : password
	};

	$.ajax({
		type : 'POST',
		url : url,
		data : data,
		success : function(response) {
			if (response.type == 'success') {
				window.location = "#home";
			} else {
				alert(response.value);
			}
		},
	});
}