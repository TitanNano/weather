$_('weather').main(function(){
	
	var TOUCHSTART= ($$.navigator.isTouch) ? 'touchstart' : 'mousedown';
	var TOUCHMOVE= ($$.navigator.isTouch) ? 'touchmove' : 'mousemove';
	var TOUCHEND= ($$.navigator.isTouch) ? 'touchend' : 'mouseup';
	
	var App= this;
//	$$.App= this;
	var { Sheet, Storage, Net } = this.modules;
	
	this.settings= {
		celsius : true	
	};

	this.sheets= [];
	this.index= 0;
	
	this.getNextSheet= function(distance){
		var sheet= App.sheets[App.index+(distance > 0 ? -1 : 1)];
		if((distance < 0 && !sheet) || $('dom').select('body').classList.contains('searchOpen'))
			return $('dom').select('.sheet.add');
		else if(sheet)
			return $('dom').select('[data-id="'+sheet.city+'"]');
		else
			return null;
	};
	
	this.createLocalSheet= function(){
		$('dom').select('.sheet').classList.remove('hidden');
		var localSheet= new Sheet('local');
		localSheet.index= 0;
		
		localSheet.fetch().then(function(){
			App.sheets.push(localSheet);
			localSheet.render();
			localSheet.save();
			setTimeout(function(){
				localSheet.show();
			}, 100);
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
		}
		
//		track sheet swtich
		$$.addEventListener(TOUCHSTART, function(e){
			var tracker= {
				touch : ($$.navigator.isTouch) ? e.changedTouches[0].identifier : null,
				start  : ($$.navigator.isTouch) ? e.changedTouches[0].screenX : e.screenX,
				offset : 0
			};
			
			var move= function(e){
				var touch= ($$.navigator.isTouch) ? e.touches.find(function(touch){ if(touch.identifier == this.touch) return touch; }.bind(this)) : e;
				var distance= touch.screenX - this.start;
				var activeSheet= $('dom').select('.sheet.active');
				var nextSheet= App.getNextSheet(distance);
				this.offset= distance / (nextSheet !== null ? 1 : 3);
				
				if(nextSheet){
					var m= ((this.offset > 0 ? $$.innerWidth * -1 : $$.innerWidth) + this.offset);
					if(nextSheet.classList.contains('add')){
						if($('dom').select('body').classList.contains('searchOpen')){
							m= (this.offset > 0 ? this.offset : 0);
						}
					}
					nextSheet.style.setProperty('transform', 'translateX('+ m +'px)');
					nextSheet.style.setProperty('transition', 'none');
				}
				if((nextSheet && !nextSheet.classList.contains('add')) || !nextSheet){
					activeSheet.style.setProperty('transform', 'translateX('+ this.offset +'px)');
					activeSheet.style.setProperty('transition', 'none');
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
				
				if((this.offset > ($$.innerWidth / 2)) && nextSheet){
					if(!nextSheet.classList.contains('add')){
						activeSheet.classList.add(directionTo);
						activeSheet.classList.remove('active');
						nextSheet.classList.remove(directionFrom);
						nextSheet.classList.add('active');
						App.index+= (directionTo == 'left' ? 1 : -1);
					}else{
						if($('dom').select('body').classList.contains('searchOpen') && directionTo == 'right')
							$('dom').select('body').classList.remove('searchOpen');
						else if(directionTo == 'left')
							$('dom').select('body').classList.add('searchOpen');
					}
				}
				
				activeSheet.style.removeProperty('transform');
				activeSheet.style.removeProperty('transition');
				
				if(nextSheet){
					nextSheet.style.removeProperty('transform');
					nextSheet.style.removeProperty('transition');
				}
				
				$$.removeEventListener(TOUCHMOVE, move);
				$$.removeEventListener(TOUCHEND, end);
			}.bind(tracker);
			$$.addEventListener(TOUCHEND, end);
		});
		
		var searchTracker= {
			timeout : null,
			process : function(list){
				var target= $('dom').select('.add .results');
				target.innerHTML= '';
				list.forEach(function(item){
					var element= $('dom').create('div');
					element.dataset.city= item.id;
					element.textContent= item.name+', '+item.sys.country;
					target.appendChild(element);
				});
			}
		};
		$('dom').select('.add input').addEventListener('keydown', function(){
			if(searchTracker.timeout)
				$$.clearTimeout(searchTracker.timeout);
				
			searchTracker.timeout= $$.setTimeout(function(){
				Net.searchCity(this.value.trim()).then(searchTracker.process);
			}.bind(this), 2000);
		});
		$('dom').select('.add input').addEventListener('blur', function(){
			$$.clearTimeout(searchTracker.timeout);
			Net.searchCity(this.value.trim()).then(searchTracker.process);
		});
		
		$('dom').select('.add .results').addEventListener('click', function(e){
			var sheet= new Sheet(e.target.dataset.city);
			sheet.index= (App.sheets.last() ? App.sheets.last().index + 1 : 1); 
			sheet.fetch().then(function(){
				sheet.save();
				sheet.render(true);
				sheet.show();
				$('dom').select('body').classList.remove('searchOpen');
				$('dom').select('.sheet.active').classList.add('left', 'active');
				$sh(sheet).classList.remove('right');
				$sh(sheet).classList.add('active');
			});
		});
		
		setInterval(function(){
			App.sheets.forEach(function(sheet){
				sheet.fetch().then(function(){
					sheet.save();
					sheet.render();
				});
			});
		}, 60000 * 5);
	});

});