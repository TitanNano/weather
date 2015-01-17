$_('weather').main(function(){

	var App= this;
//	$$.App= this;
	var Sheet = this.modules.Sheet;
	var Storage = this.modules.Storage;
	var Net = this.modules.Net;
	var $D= this.modules.DOM;
	
    var $sh= function(sheet){
		return $D('.sheet[data-id="'+ sheet.city +'"]');
	};

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
        if(App.sheets.length === 0){
            $('dom').select('.sheet').classList.remove('hidden');
        }
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
                App.index++;
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
	
	if($$.cordova){
		$D('body').classes($$.cordova.platformId);
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

        App.modules.Bindings.bind();

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
