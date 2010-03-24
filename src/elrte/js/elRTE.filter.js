(function($) {
	/**
	 * @class Clean html and make replace/restore for some patterns
	 *
	 * @param elRTE
	 * @author Dmitry (dio) Levashov dio@std42.ru
	 * @todo - replace/restore scripts
	 */
	elRTE.prototype.filter = function(rte) {
		var self     = this, chain, n;
		this.rte     = rte;
		/* make xhtml tags? */
		this._xhtml  = rte.options.doctype.match(/xhtml/i) ? true : false;
		/* chains of rules */
		this._chains = {};
		/* allowed tags/attributes */
		this._allow  = {
			tags  : rte.options.allowTags||[],
			attrs : rte.options.allowAttrs||[]
		}
		/* deny tags/attributes */
		this._deny   = {
			tags  : rte.options.denyTags||[],
			attrs : rte.options.denyAttrs||[]
		}
		/* swf placeholder class */
		this.swfClass = 'elrte-swf-placeholder';
		/* swf placeholder url */
		var n = $('<span />').addClass(this.swfClass).appendTo(rte.editor).text('swf')[0];
		if (typeof n.currentStyle != "undefined") {
			url = n.currentStyle['backgroundImage'];
		} else {
			url = document.defaultView.getComputedStyle(n, null).getPropertyValue('background-image');
		}
		this.swfSrc = url ? url.replace(/^url\("?([^"]+)"?\)$/, "$1") : '';
		$(n).remove();
		
		/* create chains */
		for (chain in this.chains) {
			if (this.chains.hasOwnProperty(chain)) {
				this._chains[chain] = [];
				$.each(this.chains[chain], function() {
					if (typeof(self.rules[this]) == 'function') {
						self._chains[chain].push(self.rules[this]);
					}
				});
			}
		}
		if (!this._chains.toSource || !this._chains.toSource.length) {
			this._chains.toSource = [this.rules.toSource]
		}
		if (!this._chains.fromSource || !this._chains.fromSource.length) {
			this._chains.fromSource = [this.rules.fromSource]
		}
		
		/**
		 * Procces html in required chains 
		 *
		 * @param String
		 * @param String  chain name
		 * @return String
		 */
		this.proccess = function(html, chain) {
			if (this._chains[chain]) {
				$.each(this._chains[chain], function() {
					html = this(self, html);
				});
			}
			return html;
		}
		
		/**
		 * Procces html in toSource chain 
		 *
		 * @param String
		 * @return String
		 */
		this.toSource = function(html) {
			return this.proccess(html, 'toSource');
		}
		
		/**
		 * Procces html in fromSource chain 
		 *
		 * @param String
		 * @return String
		 */
		this.fromSource = function(html) {
			return this.proccess(html, 'fromSource');
		}
		
		/**
		 * Add user methods for replace/restore any patterns in html
		 *
		 * @param Function  replace method
		 * @param Function  restore method
		 */
		this.addReplacement = function(rp, rs) {
			if (typeof(rp) == 'function') {
				this._chains.fromSource.unshift(rp);
			}
			if (typeof(rs) == 'function') {
				this._chains.toSource.unshift(rp);
			}
		}
		
	}
	
	/**
	 * Default rules
	 */
	elRTE.prototype.filter.prototype.rules = {
		/* common cleanup tags and attrs */
		cleanup : function(f, html) {
			var at = f._allow.tags.length,
				dt = f._deny.tags.length,
				aa = f._allow.attrs.length,
				da = f._deny.attrs.length;
				
			
			if (at || dt || aa || da) {
				html = html.replace(/\<(\/?)([a-z1-6]+)([^>]*)\>/gi, function(t, s, n, a) {
					// filter allowed/deny tags
					n = n.toLowerCase(n);
					a = a.toLowerCase(a);
					if ((at && $.inArray(n, f._allow.tags) == -1)
					|| (dt && $.inArray(n, f._deny.tags) != -1)) {
						if (f.rte.options.removeDenyTags) {
							return '';
						}
						n = 'span';
					}
					// filter allowed/deny attributes
					if (a && (aa || da)) {
						a = a.replace(/([a-z]+)\s*="[^"]*"/gi, function(attr, n) {
							if ((aa && $.inArray(n, f._allow.attrs) == -1)
							||  (da && $.inArray(n, f._deny.attrs)  != -1)) {
								return '';
							}
							return attr;
						});
					}
					return '<'+s+n+a+'>';
				});
			}
			return html;
		},
		
		/* translate attributes into css properties, exclude node with service classes */
		attrsToCss : function(f, html) {
			if (f.rte.options.attrsToCss.length) {
				var n     = $('<div/>').html(html||''),
					attrs = f.rte.options.attrsToCss,
					fsize = ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large'];

				$(n).find('*').not('.'+f.swfClass).each(function() {
					var t = $(this), i, a, v;
					for (i=0; i < attrs.length; i++) {
						a = attrs[i];
						if ((v = t.attr(a))) {
							switch (a) {
								case "border":
									t.css(a, v+'px solid '+(t.attr('bordercolor')||'#000')).removeAttr('bordercolor');
									break;
								case "align":
									if (!f.rte.dom.regExp.block.test(this.nodeName)) {
										t.css(v.match(/(left|right)/i) ? 'float' : 'text-align', v);
									} else if (this.nodeName == 'TABLE') {
										if (v.match(/(left|right)/i)) {
											t.css('float', v);
										} else if (v == 'center') {
											t.css({'margin-left' : 'auto', 'margin-right' : 'auto'});
										} else {
											t.css('text-align', v);
										}
									} else if (!this.nodeName.match(/^(THEAD|TFOOT|TBODY|TR)$/)) {
										t.css('text-align', v);
									}
									break;
								case 'valign':
									t.css('vertical-align', v);
									break;
								case 'background':
									t.css('background-image', 'url("'+v+'")');
									break;
								case 'bgcolor':
									t.css('background-color', v);
									break;	
								case 'size':
									if (fsize[v]) {
										t.css('font-size', fsize[v]);
									}
									break;
								case 'clear':
									t.css(a, v=='both'?'all':v);
									break;
								default :
									t.css(a, v);
							}
							t.removeAttr(a);
						}
					};
				});
			}
			
			return n.html();
		},
		
		/* move tags to lowercase in ie and opera */
		tagsToLower : function(f, html) {
			return html.replace(/\<([a-z1-6]+)([^\>]*)\>/ig, function(s, tag, arg) { 
				arg = arg.replace(/([a-z\-]+)\:/ig, function(s, a) { return a.toLowerCase()+':' });
				arg = arg.replace(/([a-z\-]+)="/ig, function(s, a) { return a.toLowerCase()+'="' });
				return '<'+tag.toLowerCase()+arg+'>';
			}).replace(/\<\/([a-z1-6]+)\>/ig, function(s, tag) { return '</'+tag.toLowerCase()+'>';});
		},
		
		/* make xhtml tags */
		xhtmlTags : function(f, html) {
			return html.replace(/\<(img|hr|br)([^>\/]*)\>/gi, "<$1$2 />");
		},
		
		/* proccess html for textarea */
		toSource : function(f, html) { 
			
			html = f.rules.restore(f, html);
			
			
			/* translate attrs into css if allowed */
			if (f.rte.options.attrsToCss) {
				html = f.rules.attrsToCss(f, html);
			}
			
			/* clean tags & attributes */
			html = f.rules.cleanup(f, html);
			
			/* for ie&opera tags to lower case */
			if ($.browser.opera||$.browser.msie) {
				html = f.rules.tagsToLower(f, html);
			}
			
			/* make xhtml tags if required */
			if (f._xhtml) {
				html = f.rules.xhtmlTags(f, html);
			}
			
			return html;
		},
		
		/* proccess html for editor */
		fromSource : function(f, html) { 
			
			html = f.rules.replace(f, html);
			/* translate attrs into css if allowed */
			if (f.rte.options.attrsToCss) {
				html = f.rules.attrsToCss(f, html);
			}
			
			/* clean tags & attributes */
			html = f.rules.cleanup(f, html);
			
			return html;
		},
		
		/* replace swf with placeholder */
		replace : function(f, html) { 
			var n = $('<div/>').html(html);
			
			n.find('object[classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"]').each(function() {
				var t = $(this),
					url = t.children('param[name="'+($.browser.msie ? 'Movie' : 'movie')+'"]').attr('value'),
					st  = t.attr('style')||'',
					w   = parseInt(t.css('width')||0) || parseInt(t.attr('width')||0) || '',
					h   = parseInt(t.css('height')||0) || parseInt(t.attr('height')||0) || '',
					fl  = t.css('float') || t.attr('align'),
					a   = t.css('vertical-align'),
					img = $('<img src="'+f.swfSrc+'" class="'+f.swfClass+'" rel="'+url+'" />');

				img.attr('style', st).css({
					width            : w?(w+'px'):'auto',
					height           : h?h+'px':'auto',
					'float'          : fl,
					'vertical-align' : a
				});
				$(this).replaceWith(img);
			})
			
			return n.html();
		},
		
		/* restore swf from placeholder */
		restore : function(f, html) { 
			var n = $('<div/>').html(html);

			n.find('.'+f.swfClass).each(function() {
				var t = $(this),
					obj = '<object style="'+(t.attr('style')||'')+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0"><param name="quality" value="high" /><param name="movie" value="'+$(this).attr('rel')+'" /><embed pluginspage="http://www.macromedia.com/go/getflashplayer" quality="high" src="'+$(this).attr('rel')+'" type="application/x-shockwave-flash"></embed></object>';
				
				f.rte.log(t.css('width'))
				t.replaceWith(obj);
			});
			return n.html();
		}
	}
	

	/**
	 * Default chains configuration
	 */
	elRTE.prototype.filter.prototype.chains = {
		toSource   : [ 'toSource' ],
		fromSource : [ 'fromSource' ]
	}
	

	
})(jQuery);