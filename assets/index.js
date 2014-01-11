function displayData(){

	// Récupération des filtres affichés
	var filtres = new Array();
	$("#etiquettes .etiquette").each(function(i,etiquette){
		filtres.push($(etiquette).data("filtre"));
	});
	console.log(filtres);
	// Destruction de la table si nécessaire
	var ex = document.getElementById('tableau');
	if ( $.fn.DataTable.fnIsDataTable( ex ) ) {
		$('#tableau').dataTable().fnDestroy();
	}
	
	// Reconstruction de la table
	if(filtres.length > 0){ // TODO: à mieux gérer
		var oTable = $('#tableau').dataTable( {
			"oLanguage": {"sUrl": "assets/datatables.french.lang"},
			"iDisplayLength": 25,
			"aoColumns": [
				{ "sTitle": "id" },
				{ "sTitle": "Liens" },
				{ "sTitle": "Contexte" },
				{ "sTitle": "Sujet" },
				{ "sTitle": "Contenu", "sWidth": "20%",
				  "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
					nTd.innerHTML = sData.replace(/\r\n|\r|\n/g, '<br />');
				  }
				},
				{ "sTitle": "Deadline" },
				{ "sTitle": "Destinataire" },
				{ "sTitle": "Statut" },
				{ "sTitle": "DB" },
				{ "sTitle": "Ref" }
			],
			"aaSorting": [[ 1, "desc" ]], // Tri sur la colonne date
			"bProcessing": true, // Affichage d'une pop-up lors du chargement des données
			"bServerSide": true,
			"sAjaxSource": "../getActions",
			"fnServerData": function ( sSource, aoData, fnCallback, oSettings ) {
				oSettings.jqXHR = $.ajax({
					dataType: 'json',
					type: "POST",
					url: sSource,
					data: JSON.stringify({DTparams: aoData, filtres: filtres}),
					processData: false,
					contentType: "application/json; charset=UTF-8",
					success: fnCallback
				});
			},
			"fnInitComplete": function(oSettings, json) { // Mise en form Bootstrap de certains composants
				$('div.dataTables_filter input')
					.attr('placeholder', 'Rechercher')
					.addClass('form-control input-sm')
					.css('width', '250px');
				$('select[name=transactions_length]')
					.addClass('form-control input-sm')
					.css('width', '75px');
				$('div.dataTables_info').css('margin-bottom', '30px');
			}
		} );	
	}
}

function displayFilterDiv(){
	$('#filtreContent div.show').removeClass('show').addClass('hidden');
	$('[data-type="'+$('#filterType button.active').data('type')+'"]'+
	  '[data-db="'+$('#radioDB button.active').data('db')+'"]')
	  .removeClass('hidden').addClass('show');	
}

function load(){

	// Création de la liste des noms d'entité
	$('body').data("listEntitiesNames",new Array());

	//Ajout des bases actives
	$.get('../getActiveDatabases', function(data) {		
		$(data).each(function(i,dbName){	
			// Création des clés de la liste des entités
			$('body').data("listEntitiesNames")[dbName] = new Array();
			
			// Création des boutons de sélection de la base (radio ou check)
			$label = $('<button data-db="'+dbName+'" type="button" class="btn btn-default"></button>')
				.append('<span class="glyphicon glyphicon-tasks"></span>'+dbName)
				.appendTo('#radioDB');
			$label.clone()
				.addClass('active')
				.appendTo('#checkDB');
					
			// Création des filtres manuels
			$.get('../getDBListentities?db='+dbName, function(data) {
				
				// Création du div filtre manuel de cette base
				var $button = $('<button type="button" class="btn btn-default pull-right"></button>')
					.append('<span class="glyphicon glyphicon-plus"></span>')
					.click(function(){
						var criteria = new Array();
						$($(this).parent().data("critereSelects")).each(function(i,critereSelect){
							var criterium = critereSelect.getListValue();
							if(criterium)
								criteria.push(criterium);
						});
						$('#etiquettes').addEtiquette({
							filtre: {
								criteria:criteria,
								dbName:$(this).parent().data('db')
							} 
						});
						window.displayData();
					});
				$div = $('<div data-db="'+dbName+'" data-type="manuel" class="hidden"></div>')
					.append($button)
					.appendTo('#filtreContent');
			
				// Récupération des valeurs possibles
				$(data).each(function(i,ent){
					$('body').data("listEntitiesNames")[dbName][ent.id] = ent.nom;
				});
				$(data).each(function(i,entity){
					if(entity.parentID==0) // Pas d'entité parente
						$div.addCritereSelect({
							dbName: dbName,
							entityID: entity.id,
							entityName: entity.nom
						});
				});
			},"json");
			
			// Récupération des filtres enregistrés
			$.get('../getFilters?db='+dbName, function(data) {
				$div = $('<div data-db="'+dbName+'" data-type="stored" class="hidden"></div>')
					.appendTo('#filtreContent');
				if(data.length==0){
					$div.append('<em>Aucun filtre enregistré dans cette base</em>');
					return;
				}
				$(data).each(function(i,filtre){
					$div.addEtiquette({
						add: true,
						filtre: filtre
					});
				});
			},"json");		
		});
		
		// Gestion des clicks sur les toggle buttons
		$('#radioDB  button,#filterType button')
			.click(function(e){
				$(this).parent().find('button').addClass('active').not(this).removeClass('active'); // Gestion du toggle des bouttons
				window.displayFilterDiv();
			});
			
		// Sélection de la DB par défaut dans tous les champs
		var defaultDB;
		$.get('../getDefaultDB', function(data) {
			$('#radioDB button[data-db='+data).addClass('active');
			window.displayFilterDiv();
		},"json");
		
	},"json");
}

$(document).ready(function() {

	load();
	
	$("#recherche").click(function(){
		$('#checkDB button.active').each(function(){
			var $that = $(this);
			$('#etiquettes').addEtiquette({
				filtre: {
					recherche:$('#recherche').parent().siblings('input').val(),
					dbName: $that.data('db')
				}
			});
		});
		displayData();
	});
	
});