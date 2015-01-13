$_('weather').main(function(){
	
	var TOUCHSTART= ($$.navigator.isTouch) ? 'touchstart' : 'mousedown';
	var TOUCHMOVE= ($$.navigator.isTouch) ? 'touchmove' : 'mousemove';
	var TOUCHEND= ($$.navigator.isTouch) ? 'touchend' : 'mouseup';
	
	var App= this;
//	$$.App= this;
	var Sheet = this.modules.Sheet;
	var Storage = this.modules.Storage;
	var Net = this.modules.Net;
	var $D= this.modules.DOM;
	
	this.settings= {
		celsius : true	
	};

	this.sheets= [];
	this.index= 0;
	
	this.getNextSheet= function(distance){
		var sheet= App.sheets[App.index+(distance > 0 ? -1 : 1)];
		if((distance < 0 && !sheet) || (distance > 0 && $D('body').classList.contains('searchOpen')))
			return $D('.sheet.add');
		else if(sheet)
			return $D('[data-id="'+sheet.city+'"]');
		else
			return null;
	};
	
	this.createLocalSheet= function(){
		$('dom').select('.sheet').classList.remove('hidden');
		var localSheet= new Sheet('local');
		localSheet.index= 0;
		
		localSheet.fetch().then(function(){
			if(App.sheets.length === 0){
				App.sheets.push(localSheet);
				localSheet.render();
				localSheet.save();
				setTimeout(function(){
					localSheet.show();
				}, 100);
			}else{
				App.sheets.splice(0, 0, localSheet);
				localSheet.render(true);
				localSheet.save();
				$sh(localSheet).classes('-right', 'left');
			}
		}, function(){
			if(App.sheets.length < 1)
				App.openAdd();
		});
	};
	
	this.openAdd= function(){
		var element= $('dom').select('.sheet.add');
		element.querySelector('.results').innerHTML= '';
		element.querySelector('input').value= '';
		$('dom').select('body').classList.add('searchOpen');
	};	
	
	var $sh= function(sheet){
		return $('dom').select('.sheet[data-id="'+ sheet.city +'"]');
	};
	
	if(cordova){
		$D('body').classes(cordova.platformId);
	}
	
	Storage.getSheets().then(function(sheets){
		sheets.forEach(function(sheet){
			App.sheets.push(Sheet.restore(sheet));
			App.sheets.sort(function(a, b){
				if(a.index < b.index)
					return 0;
				else
					return 1;
			});
		});
		
		if(App.sheets.length < 1){
			App.createLocalSheet();
		}else{
			App.sheets[0].render();
			App.sheets.forEach(function(sheet){
				sheet.render(true);
				sheet.show();
			});
			App.sheets.forEach(function(sheet){
				sheet.fetch().then(function(){
					sheet.save();
					sheet.render(true);
				});
			});
			if(!App.sheets.find(function(sheet){ if(sheet.city == 'local') return sheet; })){
				App.createLocalSheet();
			}
		}
		
//		track sheet swtich
		$$.addEventListener(TOUCHSTART, function(e){
			var tracker= {
				touch : ($$.navigator.isTouch) ? e.changedTouches[0].identifier : null,
				start  : ($$.navigator.isTouch) ? e.changedTouches[0].screenX : e.screenX,
				offset : 0
			};
			
			var move= function(e){
				e.preventDefault();
				var touch= ($$.navigator.isTouch) ? e.touches.find(function(touch){ if(touch.identifier == this.touch) return touch; }.bind(this)) : e;
				var distance= touch.screenX - this.start;
				var activeSheet= $D('.sheet.active');
				var nextSheet= App.getNextSheet(distance);
				this.offset= distance / (nextSheet !== null ? 1 : 3);
				
				if(nextSheet){
					var m= ((this.offset > 0 ? $$.innerWidth * -1 : $$.innerWidth) + this.offset);
					if(nextSheet.classList.contains('add')){
						if($D('body').classList.contains('searchOpen')){
							m= (this.offset > 0 ? this.offset : 0);
						}
					}
					nextSheet.css({
						'-webkit-transform' : 'translateX('+ m +'px)',
						'transform' : 'translateX('+ m +'px)',
						'transition' : 'none'
					});
				}
				if((nextSheet && !nextSheet.classList.contains('add')) || !nextSheet){
					console.log(this.offset);
					activeSheet.css({
						'-webkit-transform' : 'translateX('+ this.offset +'px)',
						'transform' : 'translateX('+ this.offset +'px)',
						'transition' : 'none'
					});
				}
			}.bind(tracker);
			$$.addEventListener(TOUCHMOVE, move);
			
			var end= function(e){
				var touch= ($$.navigator.isTouch) ? e.touches.find(function(touch){ if(touch.identifier == this.touch) return touch; }.bind(this)) : e;
				var activeSheet= $('dom').select('.sheet.active');
				var nextSheet= App.getNextSheet(this.offset);
				var directionTo= this.offset > 0 ? 'right' : 'left';
				var directionFrom= this.offset > 0 ? 'left' : 'right';
					
				if(this.offset < 0) this.offset*= -1;
				
				if((this.offset > ($$.innerWidth / 3)) && nextSheet){
					if(!nextSheet.classList.contains('add')){
						activeSheet.classes(directionTo, '-active');
						nextSheet.classes('-'+directionFrom, 'active');
						App.index+= (directionTo == 'left' ? 1 : -1);
					}else{
						if($('dom').select('body').classList.contains('searchOpen') && directionTo == 'right')
							$D('body').classes('-searchOpen');
						else if(directionTo == 'left')
							$D('body').classes('searchOpen');
					}
				}
				
				activeSheet.css({});
				
				if(nextSheet){
					nextSheet.css({});
				}
				
				$$.removeEventListener(TOUCHMOVE, move);
				$$.removeEventListener(TOUCHEND, end);
			}.bind(tracker);
			$$.addEventListener(TOUCHEND, end);
		});
		
		var searchTracker= {
			timeout : null,
			process : function(list){
				var target= $D('.add .results');
				target.innerHTML= '';
				list.forEach(function(item){
					var element= $D.create('div');
					element.dataset.city= item.id;
					element.textContent= item.name+', '+item.sys.country;
					target.append(element);
				});
			}
		};
		$D('.add input').addEventListener('keydown', function(){
			if(searchTracker.timeout)
				$$.clearTimeout(searchTracker.timeout);
				
			searchTracker.timeout= $$.setTimeout(function(){
				Net.searchCity(this.value.trim()).then(searchTracker.process);
			}.bind(this), 2000);
		});
		$D('.add input').addEventListener('blur', function(){
			$$.clearTimeout(searchTracker.timeout);
			Net.searchCity(this.value.trim()).then(searchTracker.process);
		});
		
		$D('.add .results').addEventListener('click', function(e){
			var sheet= new Sheet(e.target.dataset.city);
			sheet.index= (App.sheets.last() ? App.sheets.last().index + 1 : 1); 
			sheet.fetch().then(function(){
				sheet.save();
				sheet.render(true);
				sheet.show();
				$D('body').classes('-searchOpen');
				$D('.sheet.active').classes('left', '-active');
				$sh(sheet).classes('-right', 'active');
			});
		});
		
		setInterval(function(){
			App.sheets.forEach(function(sheet){
				sheet.fetch().then(function(){
					sheet.save();
					sheet.render();
				});
			});
		}, 60000 * 15);
	});

});
