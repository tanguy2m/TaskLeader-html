;(function ( $, window, document, undefined ) {

	// CritereSelect
	function CritereSelect ( element, options ) {
		this.settings = options;
		this.init(element);
	}
			
	CritereSelect.prototype = {
	
		changeAll: function (selected){
			if(selected)
				this.wrapper.selectpicker('selectAll');
			else
				this.wrapper.selectpicker('deselectAll');	
		},
		
		init: function (element) {
			var that = this;
			// Création du wrapper
			var $wrapper = $('<select class="selectpicker" multiple></select>')
				.on('change', function(){
					$allBox.prop('checked',false);
				});
			$.get('../getDBentityValues?db='+this.settings.dbName+'&entityID='+this.settings.entityID, function(data) {
				$(data).each(function(i,listValue){
					$wrapper.append('<option value='+listValue.id+' selected>'+listValue.label+'</option>');
				});
				$wrapper.selectpicker({
					noneSelectedText : 'Aucun choix',
					countSelectedText: '{0} sélectionné sur {1}',
					style: "btn-info"
				});
			},"json");
			
			// Création de la checkbox all
			var $allBox = $('<input type="checkbox" checked>')
				.click(function(e){
					that.changeAll($allBox.prop('checked'));
					e.stopPropagation();
				});		
				
			// Création du bouton descriptif
			var $button = $('<button type="button" class="btn btn-default"></button>')
				.append(this.settings.entityName+':')
				.append($allBox).append('Tous')
				.click(function(){
					$allBox.prop('checked',!$allBox.prop('checked'));
					that.changeAll($allBox.prop('checked'));
				});
							
			$('<div class="btn-group-vertical"></div>')
				.append($button)
				.append($wrapper)
				.appendTo(element);
			
			this.wrapper = $wrapper;
			this.allBox = $allBox;
		},
		
		getListValue: function () {
			if(this.allBox[0].checked)
				return;

			var value = new Array(),
				$wrap = this.wrapper;
			$($wrap.val()).each(function(i,id){
				value.push({
					id:parseInt(id),
					label: $wrap.find("option[value='"+id+"']").text()
				});
			});
			return {
				Key:this.settings.entityID,
				Value: value
			}
		}
	};

	$.fn["addCritereSelect"] = function ( options ) {
		return this.each(function() {
			if ( !$.data( this, "critereSelects" ) ) {
				$.data( this, "critereSelects", [new CritereSelect( this, options )] );
			}
			else
				$.data( this, "critereSelects").push(new CritereSelect( this, options ));
		});
	};

	$.fn["addEtiquette"] = function ( options ) {
		return this.each(function() {			
			var filtre = options.filtre;
				
			// Définition du label et du bouton info
			var label;
			if(filtre.recherche){
				label = "Recherche: '" + filtre.recherche + "' [" + filtre.dbName + "]";;
				$info = $(); // Pas d'icône info pour les recherches
			} else {
				label = '<span class="glyphicon glyphicon-filter"></span>' + ((filtre.id) ? filtre.nom : "manuel");
				
				// Bouton info
				var descriptif = '<div><span class="glyphicon glyphicon-tasks"></span>'+filtre.dbName+'</div>';			
				$(filtre.criteria).each(function(i,kvp){
					descriptif += '<div>' + $('body').data("listEntitiesNames")[filtre.dbName][kvp.Key] + ': ' +
						kvp.Value.map(function(lv){return lv.label;}).join(" + ") + '</div>';
				});
				if(filtre.criteria.length==0)
					descriptif += "<div>Toutes les valeurs</div>";
				
				var $info = $('<span class="glyphicon glyphicon-info-sign"></span>')
					.attr('data-placement','auto top')
					.attr('data-html',true)
					.tooltip({ title: descriptif });
			}
			
			// Bouton d'ajout à la barre d'étiquette
			var $add = $('<span class="glyphicon glyphicon-plus"></span>')
				.click(function(){
					var filtre = $(this).parent().data("filtre");
					$('#etiquettes').addEtiquette({ filtre: filtre });
					window.displayData();
				});
				
			// Bouton de fermeture
			var $remove = $('<span class="glyphicon glyphicon-remove"></span>')
				.click(function(){
					$(this).parent().remove();
					window.displayData();
				});
			if(options.add) $remove.hide();
			
			// Création du widget
			var labeltype = ((options.add) ? 'info' : 'primary');
			var $widget = $('<span class="label label-'+labeltype+' etiquette pull-left"></span>')
				.append('<span>'+label+'</span>')
				.append($info);
			if(options.add) $widget.append($add);
			$widget
				.append($remove)
				.data("filtre",filtre)
				.appendTo(this);
		});
	};

})( jQuery, window, document );