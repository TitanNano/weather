$_('weather').module('Sheet', ['Net', 'Storage', 'DOM'], function(App, done){
	
	var Net = App.modules.Net;
	var Storage = App.modules.Storage;
    var $D= App.modules.DOM;
	
	var interface= function(city){
		this.index= 0;
		this.city= city;
		this.cityLabel= '';
		this.country= null;
		this.temp= 0;
		this.temp_min= 0;
		this.temp_max= 0;
		this.wetherType= null;
		this.wetherLabel= null;
		this.wind= {
			speed : 0,
			deg : 0
		};
		this.sun= {
			rise : '',
			set : ''
		};
	};
	
	var directionMapping= [
		{ key : 'N', value : 22.5 },
		{ key : 'NE', value : 67.5 },
		{ key : 'E', value : 112.5 },
		{ key : 'SE', value : 157.5},
		{ key : 'S', value : 202.5},
		{ key : 'SW', value : 247.5},
		{ key : 'W', value : 292.5},
		{ key : 'NW', value : 337.5},
		{ key : 'N', value : 360}
	];
	
	var formatTime= function(dateTime){
		var lang= $$.navigator.language;
		if(lang == 'en-us' || lang == 'en-uk'){
			return (dateTime.getHours() > 12 ? dateTime.getHours() - 12 : (dateTime.getHours() === 0 ? 12 : dateTime.getHours())) + ':' + dateTime.getMinutes() + (dateTime.getHours() < 12 ? ' am' : ' pm');
		}else{
			return dateTime.getHours() + ':' + dateTime.getMinutes();
		}
	};
	
	interface.prototype= {
		fetch : function(data){
			return new $$.Promise(function(done,error){
				var process= function(data){
					console.log(data);
					if(data.cod){
						this.sun= {
							rise : formatTime(new Date(data.sys.sunrise * 1000)),
							set : formatTime(new Date(data.sys.sunset * 1000))
						};
						this.wind= data.wind;
						this.country= data.sys.country;
						this.cityLabel= data.name;
						this.temp= data.main.temp;
						this.temp_min= data.main.temp_min;
						this.temp_max= data.main.temp_mix;
						this.wetherType= data.weather[0].main.toLowerCase();
						this.wetherLabel= data.weather[0].description;
					}
				}.bind(this);
			
				if(this.city == 'local'){
					navigator.geolocation.getCurrentPosition(function(e){
						Net.fetchWeather({
							latitude : e.coords.latitude,
							longitude : e.coords.longitude,
							lang : $$.navigator.language
						}).then(process, error).then(done);
					}, function(e){
						console.log(e);
						error(e);
					});
				}else{
					Net.fetchWeather({
						city : this.city,
						lang : $$.navigator.language
					}).then(process, error).then(done);
				}
			}.bind(this));
		},
		
		render : function(hidden){
			var element= null;
			
			if((element= $D('[data-id="'+this.city+'"]')) === null){
                var indexList= $D('.indexList');
                var indexDot= $D.create('span');

                if(this.city == 'local'){
                    indexDot.classes('item', 'local');
                }else{
                    indexDot.classes('item');
                }
                indexList.append(indexDot);
				element= $D($D('#sheet').content.cloneNode(true));
				element.select('.sheet').dataset.id= this.city;
                element.select('.sheet').addEventListener('classchange', function(e){
                    if(e.detail.name == 'active'){
                        indexDot.classes((e.detail.removed ? '-active' : 'active'));
                    }
                });
				if(hidden)
					element.select('.sheet').classes('right');
				else
					element.select('.sheet').classes('active');
				$D('body').insertBefore(element, $('dom').select('.sheet.add'));
				element= $D('[data-id="'+this.city+'"]');
			}
			
			var bg= element.querySelector('.bg');
			if(bg.classList.length > 1){
				var bgnew= element.querySelector('.bg.new');
				bgnew.classList.add(this.wetherType);
				bgnew.transition('show').then(function(){
					bg.className= 'bg '+this.wetherType;
					bgnew.className= 'bg new';
				}.bind(this));
			}else{
				bg.classList.add(this.wetherType);
			}
			element.querySelector('.location').textContent= (this.city == 'local' ? 'Local: ' : '') + this.cityLabel+', '+this.country;
			element.querySelector('.temp').textContent= (App.settings.celsius ? Math.round(this.temp - 273.15) + '°C' : Math.round(this.temp - 255.37) + '°F');
			element.querySelector('.type').textContent= this.wetherLabel;
			element.querySelector('.wind .speed value').textContent= this.wind.speed + 'm/s';
			element.querySelector('.wind .degree value').textContent= directionMapping.find(function(item){ if(item.value > this.wind.deg) return item; }.bind(this)).key;
			element.querySelector('.sun .rise value').textContent= this.sun.rise;
			element.querySelector('.sun .set value').textContent= this.sun.set;
		},
		
		show : function(element){
			element= element || $('dom').select('[data-id="'+this.city+'"]');
			if(element !== null){
				element.classList.remove('fadeout');
			}
		},
		
		dump : function(){
			var o= {};
			Object.keys(this).forEach(function(key){
				o[key]= this[key];
			}.bind(this));
			return o;
		},
		
		save : function(){
			Storage.storeSheet(this);
		},
        delete : function(){
            Storage.deleteSheet(this);
        }
	};
	
	interface.restore= function(dump){
		var instance= new interface();
		Object.keys(dump).forEach(function(key){
			instance[key]= dump[key];
		});
		return instance;
	};
	
	done(interface);
});
