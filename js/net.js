$_('weather').module('Net', [], function(App, done){
	var Socket = $('connections').classes.Socket;
	var socket= new Socket(Socket.HTTP_GET, 'http://api.openweathermap.org', {});
	
	done({
		fetchWeather : function(data){
			return new $$.Promise(function(done, error){
				var netData= {
					type : 'accurate',
					lang : data.lang,
					'APPID' : '0924e98a8c7f46a9e4c4647dac25c442'
				};
			
				if('longitude' in data && 'latitude' in data){
					netData.lat= data.latitude;
					netData.lon= data.longitude;
				}else{
					netData.id= data.city;
				}
				
				var string=	Object.keys(netData).map(function(key){
					return key+'=' + $$.encodeURIComponent(netData[key]);
				}).join('&');
				
				socket.request('/data/2.5/weather', string).then(function(data){
					done(JSON.parse(data));
				}, function(e){
					$$.console.log(e);
					error();
				});
			});
		},
		
		searchCity : function(name){
			return new $$.Promise(function(done, error){
				if(name !== ''){
					socket.request('/data/2.5/find?q='+ $$.encodeURIComponent(name) +'&type=like&=0924e98a8c7f46a9e4c4647dac25c442').then(function(data){
						done(JSON.parse(data).list);
					}, function(e){
						$$.console.log(e);
						error();
					});
				}else{
					done([]);
				}
			});
		}
	});
});
