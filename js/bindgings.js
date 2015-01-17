$_('weather').module('Bindings', ['DOM', 'Net', 'Sheet'], function(App, ready){

	var TOUCHSTART= ($$.navigator.isTouch) ? 'touchstart' : 'mousedown';
	var TOUCHMOVE= ($$.navigator.isTouch) ? 'touchmove' : 'mousemove';
	var TOUCHEND= ($$.navigator.isTouch) ? 'touchend' : 'mouseup';

    var $sh= function(sheet){
		return $D('.sheet[data-id="'+ sheet.city +'"]');
	};

    var $D= App.modules.DOM;
    var Net= App.modules.Net;
    var Sheet= App.modules.Sheet;

    ready({
        bind : function(){

//		    track sheet swtich
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
                    var activeSheet= $D('.sheet.active');
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

                    if(activeSheet) activeSheet.css({});

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
                var sheet= null;

                if(!$D('.sheet[data-id="'+ e.target.dataset.city +'"]')){
                    sheet= new Sheet(e.target.dataset.city);
                    sheet.index= (App.sheets.last() ? App.sheets.last().index + 1 : 1);
                    sheet.fetch().then(function(){
                        sheet.save();
                        if($D('.sheet.active')){
                            sheet.render(true);
                            sheet.show();
                            setTimeout(function(){
                                $D('body').classes('-searchOpen');
                                $D('.sheet.active').classes('left', '-active');
                                $sh(sheet).classes('-right', 'active');
                            }, 100);
                        }else{
                            sheet.render();
                            setTimeout(function(){
                                sheet.show();
                                $D('body').classes('-searchOpen');
                            }, 100);
                        }
                        App.sheets.push(sheet);
                        App.index++;
                    });
                }else{
                    sheet= $D('.sheet[data-id="'+ e.target.dataset.city +'"]');
                    var current= $D('.sheet.active');

                    if(sheet.classList.contains('left')){
                        sheet.classes('-left', 'active');
                        current.classes('right', '-active');
                    }else if(sheet.classList.contains('right')){
                        sheet.classes('-right', 'active');
                        current.classes('left', 'active');
                    }
                    App.index= App.sheets.indexOf(App.sheets.find(function(sheet){ if(sheet.city == e.target.dataset.city) return true; }));
                    $D('body').classes('-searchOpen');
                }
            });

            $$.addEventListener('click', function(e){
                if(e.target.classList.contains('close')){
                    var current= $D('.sheet.active');
                    var i= App.index;
                    var next= null;
                    if(App.sheets[App.index+1]){
                        next= $D('.sheet[data-id="'+ App.sheets[App.index+1].city +'"]');
                        current.transition('-active', 'left').then(current.remove.bind(current));
                        next.classes('-right', 'active');
                    }else if(App.sheets[App.index-1]){
                        next= $D('.sheet[data-id="'+ App.sheets[App.index-1].city +'"]');
                        current.transition('-active', 'right').then(current.remove.bind(current));
                        next.classes('-left', 'active');
                        App.index--;
                    }else{
                        $D('.sheet.hidden').classes('-hidden');
                        current.transition('fadeout').then(function(){
                            current.remove();
                            $D('body').classes('searchOpen');
                        });
                    }
                    App.sheets[i].delete();
                    App.sheets.splice(i, 1);
                }
            });

            var overflowTracker= {
                closing : false,
                open : Promise.reject()
            };

            $D('.info').addEventListener(TOUCHSTART, function(){
                if($D('.overflow.closed')){
                    this.closing= false;
                    this.open= $D('.overflow').transition('-closed');
                }else{
                    this.closing= true;
                    this.open= $D('.overflow').transition('-visible');
                }
            }.bind(overflowTracker));

            $D('.info').addEventListener(TOUCHEND, function(){
                this.open.then(function(){
                    if(!this.closing){
                        $D('.overflow').classes('transOff', 'active', 'visible');
                    }else{
                        $D('.overflow').classes('-active');
                        setTimeout(function(){
                            $D('.overflow').classes('-transOff', 'closed');
                        }, 50);
                    }
                }.bind(this));
            }.bind(overflowTracker));
        }
    });
});
