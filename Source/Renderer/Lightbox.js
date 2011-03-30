/*
---
name: XtLightbox.Renderer.Lightbox

description: extendable lightbox default Lightbox Renderer

license: MIT-style

authors:
- Anton Suprun <kpobococ@gmail.com>

requires: [Core/Fx.Tween, XtLightbox.Renderer]

provides: [XtLightbox.Renderer.Lightbox]

...
*/

XtLightbox.Renderer.Lightbox = new Class({

	Extends: XtLightbox.Renderer,

	options: {
		maskFxOptions: {},
		widthFxOptions: {},
		heightFxOptions: {},
		contentFxOptions: {},
		footerFxOptions: {},
		hideArrowsFor: ['YouTube']
	},

	create: function(){
		this.parent();
        this.fxWidth = new Fx.Morph(this.element, Object.merge({}, this.options.widthFxOptions, {
            onStart: function(){},
            onCancel: function(){},
            onComplete: function(){
                this.onWidthChange();
            }.bind(this)
        }));
        this.fxHeight = new Fx.Morph(this.element, Object.merge({}, this.options.heightFxOptions, {
            onStart: function(){},
            onCancel: function(){},
            onComplete: function(){
                this.onHeightChange();
            }.bind(this)
        }));
		this.fxContent = new Fx.Tween(this.elContent, Object.merge({}, this.options.contentFxOptions, {
			property: 'opacity',
			onStart: function(){},
			onCancel: function(){},
			onComplete: function(){
				this.onContentRender();
			}.bind(this)
		}));
		this.fxFooter = new Fx.Tween(this.elFooter, Object.merge({}, this.options.footerFxOptions, {
			property: 'height',
			onStart: function(){
				this.elFooter.setStyle('overflow', 'hidden');
			}.bind(this),
			onCancel: function(){},
			onComplete: function(){
				this.elFooter.setStyle('overflow', '');
			}.bind(this)
		}));
	},

	inject: function(){
		this.parent();
		this.removeEvents('show').removeEvents('hide');
		if (this.mask){
			this.mask.addEvent('click', this.fireEvent.pass('close', this));
			var fxShow = new Fx.Tween(this.mask, Object.merge({}, this.options.maskFxOptions, {
				property: 'opacity',
				onStart: function(){
					this.show();
				}.bind(this.mask),
				onCancel: function(){},
				onComplete: function(){}
			}));
			var fxHide = new Fx.Tween(this.mask, Object.merge({}, this.options.maskFxOptions, {
				property: 'opacity',
				onStart: function(){},
				onCancel: function(){},
				onComplete: function(){
					this.hide();
				}.bind(this.mask)
			}));
			var mo = this.options.maskOpacity || this.mask.toElement().getStyle('opacity') || 1;
			this.mask.toElement().setStyle('opacity', 0);
			this.addEvents({
				show: function(){
					fxHide.cancel();
					fxShow.start(mo);
				},
				hide: function(){
					fxShow.cancel();
					fxHide.start(0);
				}
			});
		}
	},

	empty: function(){
		this.parent();
		this.elFooter.setStyle('display', 'none');
		this.btnPrev.setStyle('display', 'none');
		this.btnNext.setStyle('display', 'none');
		this._opts = {};
		this._cont = null;
		this._fwopts = null;
		this.fxFooter.cancel();
		return this;
	},

	render: function(content, options){
		if (!content) return this;
		options = Object.append({
			close: true
		}, options);
		this.empty();
		this.elTitle.set('text', options.title || '');
		if (options.position && options.total && (!this.options.hideSinglePosition || options.total > 1)){
			this.elPosition.set('text', this.options.positionText.substitute({
				x: options.position,
				total: options.total
			}));
		}
		this._opts = options;
		this._cont = content;
		this.resize(options.size);
		return this;
	},

	renderContent: function(){
		this.fxContent.set(0).start(1);
		return this;
	},

	onContentRender: function(){
		this.btnPrev.setStyle('display', this._opts.prev ? '' : 'none');
		this.btnNext.setStyle('display', this._opts.next ? '' : 'none');
		if (this.options.hideArrowsFor.contains(this._opts.adaptor) || (!this._opts.next && !this._opts.prev)) this.elArrows.setStyle('display', 'none');
		else this.elArrows.setStyle('display', '');
		this.btnClose.setStyle('display', this._opts.close ? '' : 'none');
		this.renderFooter();
	},

	renderFooter: function(){
		this.elFooter.setStyles({
			visibility: 'hidden',
			display: ''
		});
		var y = this.elFooter.getSize().y;
		this.elFooter.setStyles({
			visibility: 'visible',
			height: 0
		});
		this.fxFooter.start(y);
		return this;
	},

	resize: function(size){
		if (!this.shown) this.show();
        var winSize = window.getSize(), elSize;
        if (size && size.x && size.y){
            this.elFooter.setStyles({
                display: '',
                height: ''
			});
            var elFull = this.element.getSize();
            var elBox = {
                x: this.element.getStyle('width').toInt(),
                y: this.element.getStyle('height').toInt()
            };
            this.elFooter.setStyle('display', 'none');
            elSize = {
                x: elFull.x - elBox.x + size.x,
                y: elFull.y - elBox.y + size.y
            };
            this._fwopts = {
                width: elSize.x,
                left: Math.round((winSize.x - elSize.x) / 2)
            };
            this.fxHeight.start({
                height: elSize.y,
                top: Math.round((winSize.y - elSize.y) / 2)
            });
		} else {
			// Reset size
			size = size || {};
            this.element.setStyles({
                width: '',
                height: ''
            });
            this.elFooter.setStyle('display', '');
            elSize = this.element.getSize();
            this.elFooter.setStyle('display', 'none');
            this.element.setStyles({
                width: size.x || '',
                height: size.y || '',
                left: Math.round((winSize.x - elSize.x) / 2),
                top: Math.round((winSize.y - elSize.y) / 2)
            });
		}
		return this;
	},

	onWidthChange: function(){
		this.elContent.grab(this._cont);
		this.renderContent();
		return this;
	},

	onHeightChange: function(){
		this.fxWidth.start(this._fwopts);
		return this;
	},

	reset: function(){
		if (!this.injected) return this;
		this.fxHeight.cancel();
		this.fxWidth.cancel();
		this.fxContent.cancel();
		this.fxFooter.cancel();
		this.resize();
		this.empty();
		this.elFooter.setStyle('display', 'none');
		return this;
	}

});
