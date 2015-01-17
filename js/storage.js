$_('weather').module('Storage', [], function(App, ready){
	var indexedDB= $$.indexedDB || $$.shimIndexedDB;
	var db= null;
	var dbRequest= indexedDB.open('weatherDB', 1);
	
	dbRequest.onerror= function(){
		$$.console.error('unable to access the DB!');
	};
	
	dbRequest.onsuccess= function(){
		db= dbRequest.result;
		ready(interface);
	};
	
	dbRequest.onupgradeneeded= function(e){
		var db= e.target.result;
		
		if(e.oldVersion < 1){
			db.createObjectStore('sheets', { keyPath : 'city' });
		}
	};
	
	var interface= {
		storeSheet : function(sheet){
			return new Promise(function(done){
				sheet= sheet.dump();
				var request= db.transaction(['sheets'], 'readwrite').objectStore('sheets').put(sheet);
				
				request.onsuccess= function(){
					done();	
				};
				
				request.onerror= function(){
					$$.console.error('faild to store sheet!');
				};
			});
		},
			
		getSheet : function(city){
			return new Promise(function(done){
				var request= db.transaction(['sheets']).objectStore('sheets').get(city);
				
				request.onsuccess= function(e){
					done(e.target.result);
				};
				
				request.onerror= function(){
					$$.console.error('faild to get sheet for city '+ city +'!');
				};
			});
		},
		
		getSheets : function(){
			return new Promise(function(done){
				var list= [];
				var request= db.transaction(['sheets']).objectStore('sheets').openCursor();
		
				request.onsuccess= function(e){
					var cursor= e.target.result;
					if(cursor){
						list.push(cursor.value);
						cursor.continue();
					}else{
						done(list);
					}
				};
				
				request.onerror= function(){
					$$.console.error('faild to get all Sheets!');
					done(list);
				};
			});
		},

        deleteSheet : function(sheet){
			return new Promise(function(done){
				sheet= sheet.dump();
				var request= db.transaction(['sheets'], 'readwrite').objectStore('sheets').delete(sheet.city);

				request.onsuccess= function(){
					done();
				};

				request.onerror= function(){
					$$.console.error('faild to delete sheet!');
				};
			});
        }
	};
});
