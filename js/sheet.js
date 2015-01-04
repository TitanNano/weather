$_('weather').module('Sheet', ['Net', 'Storage'], function(App, done){
	
	var { Net, Storage } = App.modules;
	
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
	
	interface.prototype= {
		fetch : function(data){
			return new $$.Promise(function(done,error){
				var process= function(data){
					console.log(data);
					if(data.cod){
						this.sun= {
							rise : (new Date(data.sys.sunrise * 1000)).toLocaleTimeString(),
							set : (new Date(data.sys.sunset * 1000)).toLocaleTimeString()
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
					}, function(){
						error();
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
			
			if((element= $('dom').select('[data-id="'+this.city+'"]')) === null){
				element= $('dom').select('#sheet').content.cloneNode(true);
				element.querySelector('.sheet').dataset.id= this.city;
				if(hidden)
					element.querySelector('.sheet').classList.add('right');
				else
					element.querySelector('.sheet').classList.add('active');
				$('dom').select('body').insertBefore(element, $('dom').select('.sheet.add'));
				element= $('dom').select('[data-id="'+this.city+'"]');
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
			element.querySelector('.wind .speed value').textContent= this.wind.speed;
			element.querySelector('.wind .degree value').textContent= this.wind.deg;
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