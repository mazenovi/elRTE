(function($) {
	/**
	 * Class. elRTE renderer
	 * 
	 */
	elRTE.prototype.view = function(rte) {
		var self       = this;
		this.rte       = rte;
		this.toolbar   = $('<div class="elrte-toolbar" />');
		this.tabsbar   = $('<ul class="elrte-tabsbar" />');
		this.workzone  = $('<div class="elrte-workzone" />');
		this.statusbar = $('<div class="elrte-statusbar" />');
		this.editor    = $('<div class="elrte '+(this.rte.options.cssClass||'')+'" id="'+this.rte.id+'" />')
			.append(this.toolbar.hide())
			.append(this.tabsbar.hide())
			.append(this.workzone)
			.append(this.statusbar.hide())
			.insertBefore(rte.target);
			
		if (this.rte.options.height>0) {
			this.workzone.height(this.rte.options.height);
		}

		/* click on document tab */
		$('#'+this.rte.id+' .elrte-doc-tab').live('click', function(e) {
			var id = $(e.currentTarget).attr('rel').substr(1);

			if ($(e.target).hasClass('elrte-doc-tab-close')) {
				if (confirm(self.rte.i18n('Close')+' "'+$(e.currentTarget).text()+'"'+'?')) {
					self.rte.close(id);
				} else {
					id = self.workzone.children('.elrte-document:visible').attr('id');
				}
			}
			self.rte.focus(id);
		});

	}
	
	elRTE.prototype.view.prototype.cleanToolbar = function() {
		this.toolbar.empty();
	}
	
	/**
	 * Create toolbar, add buttons and show
	 *
	 * @param  String  toolbar name
	 * @return void
	 **/
	elRTE.prototype.view.prototype.showToolbar = function(tb) {
		var i = tb.length, l, pname, p, panel, cname, b;
		
		while (i--) {
			pname = tb[i];
			p = this.rte.options.panels[pname];
			panel = $('<ul class="elrte-toolbar-panel elrte-ib '+(i==0 ? 'elrte-toolbar-panel-first' : '')+'" id="'+this.rte.id+'-panel-'+pname+'"></ul>');
			if (typeof(p) != undefined && (l = p.length)) {
				while (l--) {
					cname = p[l];
					if (this.rte.commands[cname] && (b = this.rte.commands[cname].ui())) {
						panel.prepend(b);
					}
				}
			}
			if (panel.children().length) {
				this.toolbar.prepend(panel);
			}
		}
		if (this.toolbar.children().length) {
			this.toolbar.show();
		}
	}
	
	/**
	 * Add new document into editor
	 *
	 * @param  Object  document
	 * @return void
	 **/
	elRTE.prototype.view.prototype.add = function(d) {
		var self = this,
			h = this.workzone.height(),
			doc = $('<div id="'+d.id+'" class="elrte-document"/>')
				.append(d.editor.addClass('elrte-editor').height(h))
				.append(d.source.addClass('elrte-source').height(h).hide())
				.hide(),
			tab = $('<li class="elrte-tab elrte-doc-tab elrte-ib" rel="#'+d.id+'">'+d.title+'</li>'), l;
			
		d.closeable && tab.append('<span class="elrte-doc-tab-close" title="'+this.rte.i18n('Close')+'"/>');
				
		this.workzone.append(doc);
		this.tabsbar.append(tab);
		l = this.workzone.children('.elrte-document').length;
		/* first or only document - set visible */
		if (l == 1) {
			doc.show();
			tab.addClass('elrte-tab-active');
		}
		
		if (l>1 || this.rte.options.tabsAlwaysShow) {
			this.tabsbar.show();
		}
	}
	
	/**
	 * Switch between editor and source view in active document
	 *
	 */
	elRTE.prototype.view.prototype.toggle = function() {
		if (this.rte.options.allowSource && this.workzone.children('.elrte-document:visible').length) {
			this.workzone.children('.elrte-document:visible').children().toggle();
		}
	}
	
	
	/**
	 * Switch editor to required docment
	 *
	 * @param  String  document id
	 * @return void
	 **/
	elRTE.prototype.view.prototype.focus = function(id) {
		this.tabsbar.children().removeClass('elrte-tab-active').filter('[rel="#'+id+'"]').addClass('elrte-tab-active');
		this.workzone.children('.elrte-document').hide().filter('#'+id).show();
	}

	/**
	 * Remove document by id
	 *
	 * @param String  document id
	 * @return void
	 */
	elRTE.prototype.view.prototype.remove = function(id) {
		var l;
		this.workzone.find('#'+id).remove();
		this.tabsbar.find('[rel="#'+id+'"]').remove();	
		l = this.workzone.children('.elrte-document').length;
		if (!l || (l==1 && !this.rte.options.tabsAlwaysShow)) {
			this.tabsbar.hide();
		}
	}

	elRTE.prototype.view.prototype.setWorkzoneHeight = function(h) {
		this.workzone.add(this.workzone.find('.elrte-editor,.elrte-source')).height(h);
	}
	
})(jQuery);