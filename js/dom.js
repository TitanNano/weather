// dom.js v0.1 part of the Application Frame

$_('weather').module('DOM', [], function(App, done){
	'use strict';

	var apply= function(target, features){
		Object.keys(features).forEach(function(key){
			target[key]= features[key];
		});
	};

	var dom= function(item){

		var append= function(element, target){
			return target.appendChild(element);
		};

		var classes= function(){
			var classes= Array.prototype.map.apply(arguments, [function(e){ return e; }]);
			var list= this.className.split(' ');
			var add= [];
			var remove= [];
			classes.forEach(function(item){
				if(item.substr(0, 1) == '-')
					remove.push(item.substr(1));
				else if(item.substr(0, 1) == '+')
					add.push(item.substr(1));
				else
					add.push(item);
			});

			remove.forEach(function(item){
				if(list.indexOf(item) > -1)
					list.splice(list.indexOf(item), 1);
			});

			add.forEach(function(item){
				if(list.indexOf(item) < 0)
					list.push(item);
			});
			
			this.className= list.join(' ');
		};

		var css= function(properties, extend){
			if(extend){
				var current= {};
				properties.split(';').forEach(function(item){
					var key= item.split(':')[0];
					var value= item.split(':')[1];
					current[key]= value;
				});

				Object.keys(properties).forEach(function(key){
					if(properties[key] === null)
						delete current[key];
					else
						current[key]= properties[key];
				});

				this.style.cssText= Object.keys(current).map(function(key){ return key + ':' + current[key]; }).join(';');
			}else{
				this.style.cssText= Object.keys(properties).map(function(key){ return key + ':' + properties[key]; }).join(';');
			}
		};

		var replace= function(node){
			if(node instanceof Node){
				this.parentNode.replaceChild(node, this);
			}
		};

		var transition= function(){
			var items= Array.prototype.map.apply(arguments, [function(e){ return e; }]);
			return new Promise(function(setValue){
//  	   		set event listener
				this.addEventListener('transitionend', function x(e){
					this.removeEventListener('transitionend', x);
					setValue(this, e);
				});

				classes.apply(this, items);
			}.bind(this));
		};

		var remove= function(){
			this.parentNode.removeChild(this);
		};

		var features= {
			append : append,
			classes : classes,
			css : css,
			replace : replace,
			remove : remove,
			transition : transition
		};

		if(typeof item == 'string'){
			item= document.querySelector(item);
		}

		if(item && item instanceof Node){
			apply(item, features);
		}else if(item && (item instanceof Array || item instanceof NodeList)){
			item= item.map(function(element){ return apply(element, features); });
		}else{
			item= null;
		}

		return item;
	};

	dom.selectAll= function(query){
		return dom(document.querySelectorAll(query));
	};

	dom.create= function(elementName){
		return dom(document.createElement(elementName));
	};

	done(dom);
});
