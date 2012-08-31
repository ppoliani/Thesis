//initializes the rss widjets

$(function() {
	/*Initiate jquery rss reader and yahoo weather feed*/
	try {
		$('#rss').rssfeed('http://www.ecs.soton.ac.uk/rss.php', {
			limit : 20
		}, function(e) {
			$(e).find('div.rssBody').vTicker({
				showItems : 2,
				pause : 7000,
				speed : 1000,
				animation : 'fade'
			});
		});
	} catch (error) {
		//do nothing. Prevent the browser from responding in its default manner
	}

	try {
		/*weather feed widget*/
		$('#weatherFeed').weatherfeed(['UKXX0138']);
	} catch (error) {
		//do nothing. Prevent the browser from responding in its default manner
	}
});
