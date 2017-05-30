 // index.js
 const path = require('path')
 const express = require('express')
 const exphbs = require('express-handlebars')
 const app = express()
 const port = process.env.port || 3000;
 
 var MongoClient = require('mongodb').MongoClient;
 var MongoConnection = {'protocol' : 'mongodb', 'port': '27017', 'db': 'test', 'host' : 'localhost', 'user':'', 'pass':''};
 if(process.env.production == 'true'){
	var MongoConnection = {'protocol': 'mongodb', 
							'port':process.env.PROD_PT, 
							'db' :process.env.PROD_DB,
							'user': process.env.PROD_UN + ':',
							'pass': process.env.PROD_PW + '@',
							'host': process.env.PROD_HT,
							}
 }
 var _db = {};
 MongoClient.connect(MongoConnection.protocol + '://' + MongoConnection.user + MongoConnection.pass + MongoConnection.host + ':' + MongoConnection.port + '/' + MongoConnection.db, function(err, db) {
  if(!err) {
    console.log("We are connected");
	_db = db;
	//_process_collectibles();
  }
  else {
	  return;
  }
 });
 var hbs = exphbs.create({
	 helpers:{
		 'objToJS' : function(variable, objName){
			 objKeys = Object.keys(variable);
			 var returnString = 'var ' + objName + ' = { '
			 for(var ok = 0; ok < objKeys.length; ok++){
				 returnString += "'" + objKeys[ok] + "':";
				 if(typeof variable[objKeys[ok]] == 'object'){
					 returnString += '{';
					 subKeys = Object.keys(variable[objKeys[ok]]);
					 for(var sk = 0; sk < subKeys.length; sk++){
						 if(typeof variable[objKeys[ok]][subKeys[sk]] == 'object')
							 returnString += "'" + [subKeys[sk]] + "':'" + variable[objKeys[ok]][subKeys[sk]]['recipe_id'] + "'";
						 else
							returnString += "'" + subKeys[sk] + "':" + variable[objKeys[ok]][subKeys[sk]] + ',';
					 }
					 returnString += '},';
				 }
				 else returnString += variable[objKeys[ok]];
			 }
			 returnString += '};'
			return returnString;
		 },
		 'recipify' : function(key, variable, lookup, sublookup){
						  if(typeof variable == 'object' && variable.replacement_id !== undefined){
							  var recipeObj = lookup[variable.replacement_id];
							  var recipeObjKeys = Object.keys(recipeObj);
							  var returnString = "<div class = 'entry-header' hasChild = 'true' style = 'margin:8px;'>" + "<span style = 'color:blue'>" + variable.qty + ' x ' + key + "</span><br/><div class='entry-body' style = 'margin-left:8px;'>";
							  
							  for(roKeys = 0; roKeys < recipeObjKeys.length; roKeys++){
								  if(typeof recipeObj[recipeObjKeys[roKeys]] !== 'object')
									returnString += recipeObj[recipeObjKeys[roKeys]] + ' x ' + recipeObjKeys[roKeys] + '<br/>';
								  else {
									  returnString +=  "<span style = 'color:red;'>" + recipeObj[recipeObjKeys[roKeys]].qty + ' x ' + recipeObjKeys[roKeys] + '</span>';
									  subrecipeObj = sublookup[recipeObj[recipeObjKeys[roKeys]].recipe_id];
									  subrecipeKeys = Object.keys(subrecipeObj);
									  returnString += "<div style = 'margin-left:8px;' class='subentry' hasChild = 'true'>";
									  for(sroKeys = 0; sroKeys < subrecipeKeys.length; sroKeys++){
										  returnString += subrecipeObj[subrecipeKeys[sroKeys]] + ' x ' + subrecipeKeys[sroKeys] + '<br/>';
									  }
									  returnString += "</div>";
								  }
							  }
							  returnString += "</div></div>";
						  }
						  else {
							  returnString = "<div class = 'entry' style = 'margin-left:8px;'>" + variable.qty + ' x ' + key + "</div>";
						  }
					      return returnString;
					   }
	 },
	 
	 defaultLayout: 'main',
	 extname: '.hbs',
	 layoutsDir: path.join(__dirname, 'views/layouts'),
	 partialsDir: path.join(__dirname, 'views/partials')
 }
 );
 
 app.engine('.hbs', hbs.engine);
 app.set('view engine', 'hbs')
 app.set('views', path.join(__dirname, 'views')) 
 
 

app.get('/add/Recipe', (request, response) => {
	var error = "";
	
	if(!Object.keys(request.query).length == 0){
		var canFind = false;
		var listCollection = _db.collection('Collection');
		var recipeStream = listCollection.find({component_id:request.query.bp_id});
		recipeStream.on("data",function(){canFind = true;});
		recipeStream.on("end",function(){});
			if(!canFind && request.query != {}){
				var insertRecipe =  _db.collection('recipe');
				var component_1_id = request.query["component1_id_dd"] || request.query["component1_id_in"];
				
				var component_2_id = request.query["component2_id_dd"] || request.query["component2_id_in"];
				
				var component_3_id = request.query["component3_id_dd"] || request.query["component3_id_in"];
				
				var component_4_id = request.query["component4_id_dd"] || request.query["component4_id_in"];
				
				
				insertRecipe.insertOne({
					'component_id' : request.query.bp_id,
					'collection_id' : request.query.collection_id,
					
					'component_name' : request.query.bp_name,
					
					'component_1_qty' : request.query['component1_qty'],
					'component_2_qty' : request.query['component2_qty'],
					'component_3_qty' : request.query['component3_qty'],
					'component_4_qty' : request.query['component4_qty'],
					
					'component_1_id' : component_1_id,
					'component_2_id' : component_2_id,
					'component_3_id' : component_3_id,
					'component_4_id' : component_4_id,
					
					'credit_cost' : request.query.credit_qty
				});
			}
		}
	
	 var recipeOptions = [];
	 var bpOptions = [];
	 
	 var listCollection = _db.collection('Collection');
	 var collectionStream = listCollection.find();
	 collectionStream.on("data", function(collectionObj){recipeOptions.push(collectionObj)});
	 collectionStream.on("end",function(){
		 
		 var simpleCollection = _db.collection('recipe');
		 var simpleStream = simpleCollection.find({'component_1_qty' : ""});
		 
		 simpleStream.on("data", function(recipeObj){bpOptions.push(recipeObj)});
		 simpleStream.on("end",function(){
		 
			 var recipeCollection = _db.collection('recipe');
			 var recipeStream = recipeCollection.find({'component_1_qty' : {$ne : ''}});
			 
			 recipeStream.on("data", function(recipeObj){bpOptions.push(recipeObj)});
			 recipeStream.on("end",function(){
			 response.render('add_r', {
				 'recipeOptions': recipeOptions,
				 'bpOptions': bpOptions,
				 'error': error
			 });
		});
	 });
 });
});

 

 app.get('/add/Collectible', (request, response) => {
	 var insertCollection = _db.collection('Collection');
	 var found = false;
	 var checkStream = insertCollection.find({'collection_id':request.query.c_id});
	 checkStream.on("data", function(){found = true;});
	 checkStream.on("end",function(){
	 console.log(request.query);
		 if(!found){
			 insertCollection.insertOne({'collection_name':request.query.c_name,
										'collection_id' :request.query.c_id,
										'class':request.query.i_class
			 });
		 }
		 else{
			 console.log('duplicate id!');
		 }
		 response.render('add', {});
	 });
 });
 
 app.get('/view/Collectible/:id/:ajax?', (request, response) => {
	var collectibles = _db.collection('Collection');
	var collectible_stream = collectibles.find({'collection_id' : request.params.id});
	var recipes = _db.collection('recipe');
	var _collectible = {};
	
	var simpleComponents = [];
	var simpleComponentsObj = {};
	
	var thisRecipe = {};
	var creditCost = 0;
	var shoppingList = {};
	var complexComponents = [], complexSubComponents = [];
	
	//response.json - needs research but seems pretty useful.
	var _renderPage = function(name, recipe, subrecipe, subsubrecipe){
	 response.render('detail_view', {
		 layout:(typeof request.params.ajax === 'undefined'? '' : 'main'),
						collection_name: name,
						recipe: recipe,
						subrecipe: subrecipe,
						subsubrecipe: subsubrecipe
					});
	 };
	 
	 var _readify = function(recipe, recipeParent){
		 readableRecipe = {};
		 for(var i = 1; i <= 4; i++){
			 
			 var tempName = recipe['component_'+i+'_id'];
			 if(simpleComponentsObj[tempName] != undefined)
				readableRecipe[simpleComponentsObj[tempName]] = recipe['component_'+i+'_qty']
			 else{
				 if(recipeParent[recipe['component_'+i+'_id']] !== undefined && 
					recipeParent[recipe['component_'+i+'_id']]['name'] !== undefined)
					
					readableRecipe[recipeParent[recipe['component_'+i+'_id']]['name']] = {
					 'recipe_id' : recipe['component_'+i+'_id'],
					 'qty' : recipe['component_'+i+'_qty']
				 };
			 }
		 }
		 return readableRecipe;
	 }
	 
	 
	 var _addToShoppingList = function (id, qty, recipe, type, name){
		 if(qty == undefined){
			 qty = 0;
		 }
		 if(id !== ""){
			 if(shoppingList[id] == undefined){
				 shoppingList[id] = {
					 'quantity' : qty,
					 'name' : name,
					 'recipe': recipe || {},
					 'type' :  (type || 'simple component')
				 };
			 }
			 else {
				 shoppingList[id] = {
					 'quantity' : parseInt(shoppingList[id]['quantity']) + parseInt(qty),
					 'name' : name,
					 'recipe': recipe || {},
					 'type' : type
				 }
			 }
		 }
	 }
	
	sComponentStream = recipes.find({'component_1_id':''});
	sComponentStream.on('data', function(sComponent){
		simpleComponents.push(sComponent.component_name);
		simpleComponentsObj[sComponent.component_id] = sComponent.component_name;
	});
	sComponentStream.on('end', function(){
		tLevelRecipeStream = recipes.find({'collection_id':request.params.id});
		tLevelRecipeStream.on('data', function(recipe){
			creditCost += parseInt(recipe.credit_cost);
			thisRecipe = recipe;
		});
		tLevelRecipeStream.on('end', function(){
			_addToShoppingList(thisRecipe['component_id'], thisRecipe['component_qty'],{
						'component_1_id': thisRecipe['component_1_id'],
						'component_1_qty':thisRecipe['component_1_qty'],
						'component_2_id': thisRecipe['component_2_id'],
						'component_2_qty':thisRecipe['component_2_qty'],
						'component_3_id': thisRecipe['component_3_id'],
						'component_3_qty':thisRecipe['component_3_qty'],
						'component_4_id': thisRecipe['component_4_id'],
						'component_4_qty':thisRecipe['component_4_qty'],
						}, 'top level component', '');
			for(var i = 1; i<=4;i++){
				//refactor
				if(simpleComponentsObj[thisRecipe['component_'+i+'_id']] == undefined && 
				   thisRecipe['component_'+i+'_id'] !== ""){
					complexComponents.push(thisRecipe['component_'+i+'_id']);
				}
				if(thisRecipe['component_'+i+'_id'] !== "")
					_addToShoppingList(thisRecipe['component_'+i+'_id'], 
									   thisRecipe['component_'+i+'_qty'], 
									   {}, 
									   'simple component', 
									   simpleComponentsObj[thisRecipe['component_'+i+'_id']]);
			}
			cComponentStream = recipes.find({'component_id':{$in: complexComponents}});
			cComponentStream.on('data', function(complexComponent){
				_addToShoppingList(complexComponent['component_id'], complexComponent['component_qty'], {
						'component_1_id': complexComponent['component_1_id'],
						'component_1_qty':complexComponent['component_1_qty'],
						'component_2_id': complexComponent['component_2_id'],
						'component_2_qty':complexComponent['component_2_qty'],
						'component_3_id': complexComponent['component_3_id'],
						'component_3_qty':complexComponent['component_3_qty'],
						'component_4_id': complexComponent['component_4_id'],
						'component_4_qty':complexComponent['component_4_qty'],
						}, 'complex component', complexComponent['component_name']);
				for(var j = 1; j<=4; j++){
					if(simpleComponentsObj[complexComponent['component_'+j+'_id']] == undefined){
						complexSubComponents.push(complexComponent['component_'+j+'_id']);
					}
				}
				simpleComponentsObj[complexComponent['component_id']] = complexComponent.component_name;
				
			});
			cComponentStream.on('end', function(){
				cSComponentStream = recipes.find({'component_id':{$in: complexSubComponents}, 'collection_id':""});
				cSComponentStream.on('data', function(CSRecipe){
				_addToShoppingList(CSRecipe['component_id'], CSRecipe['component_qty'], {
						'component_1_id': CSRecipe['component_1_id'],
						'component_1_qty':CSRecipe['component_1_qty'],
						'component_2_id': CSRecipe['component_2_id'],
						'component_2_qty':CSRecipe['component_2_qty'],
						'component_3_id': CSRecipe['component_3_id'],
						'component_3_qty':CSRecipe['component_3_qty'],
						'component_4_id': CSRecipe['component_4_id'],
						'component_4_qty':CSRecipe['component_4_qty'],
						}, 'complex subcomponent', CSRecipe['component_name']);
		
				});
				cSComponentStream.on('end', function(){
					//TODO: start tracking credits
					var slKeys = Object.keys(shoppingList);
					var hRRecipe = {};
					var hRReplacements = {}; //if they haven't already built this component.
					var hRSubComponents = {};
					for(var sl = 0; sl < slKeys.length; sl++){					
						switch(shoppingList[slKeys[sl]].type){
							case 'simple component':
							   hRRecipe[shoppingList[slKeys[sl]]['name']] = {
									'qty': shoppingList[slKeys[sl]]['quantity']
								};
							break;
							case 'complex component':
								hRRecipe[shoppingList[slKeys[sl]]['name']] = {
									'qty': shoppingList[slKeys[sl]]['quantity'],
									'replacement_id': slKeys[sl]
								};
								hRReplacements[slKeys[sl]] = _readify(shoppingList[slKeys[sl]]['recipe'], shoppingList);
							break;
							case 'complex subcomponent':
							 hRSubComponents[slKeys[sl]] = _readify(shoppingList[slKeys[sl]]['recipe'], shoppingList);
							break;
						}
					}
					
					//console.log('Simple components:');
					//console.log(hRRecipe);
					//console.log('how to build the simple components:');
					//console.log(hRReplacements);
					//console.log('how to build the complex components:');
					//console.log(hRSubComponents);					
					
					_renderPage(thisRecipe.component_name, hRRecipe, hRReplacements, hRSubComponents);
				});
			});
		});
	});
});
	
	
 
 app.get('/', (request, response) => {
	 var acollection = _db.collection('Collection');
	 var collectionObj = {
		 'frames':[], 
			'primaries': [],
			'secondaries':[],
			'melees' : [],
		 'companions':[], 
		 'sentinels':[],
			'sentinel_weapons': [],
		 'wings':[],
		 'wing_melee': [],
		 'wing_primary': []
		 };
	 var numberOfCollectibles = 0;
	 var totalEquipmentMastery = 0;
	 var frame_stream = acollection.find().stream();	
	frame_stream.on("data", function(item) {
		numberOfCollectibles++;
		switch(item['class']){
			case 'frame':
				collectionObj['frames'].push(item);
			break;
			case 'prmy':
				collectionObj['primaries'].push(item);
				break;
			case 'sdry':
				collectionObj['secondaries'].push(item);
				break;
			case 'mele':
				collectionObj['melees'].push(item);
				break;
			case 'comp':
				collectionObj['companions'].push(item);
			break;
			
			case 'sent':
				collectionObj['sentinels'].push(item);
				break;
			case 'sntw':
				collectionObj['sentinel_weapons'].push(item);
				break;
				
			case 'wing':
				collectionObj['wings'].push(item);
				break;
			case 'wmel':
				collectionObj['wing_melee'].push(item);
				break;
			case 'wprm':
				collectionObj['wing_primary'].push(item);
				break;
			
		}
		
	});
	
	frame_stream.on("end", function(){
		totalEquipmentMastery = ((collectionObj['frames'].length + collectionObj['companions'].length + collectionObj['sentinels'].length +  collectionObj['wings'].length) * 6000);
		totalEquipmentMastery = ((collectionObj['primaries'].length + collectionObj['secondaries'].length + collectionObj['melees'].length +  collectionObj['sentinel_weapons'].length + collectionObj['wing_primary'].length + collectionObj['wing_melee'].length) * 3000);
	      response.render('home', {
		  
		  warframes: collectionObj['frames'],
		  warframe_count: collectionObj['frames'].length,
		  primaries: collectionObj['primaries'],
		  primary_count: collectionObj['primaries'].length,
		  secondaries: collectionObj['secondaries'],
		  secondary_count: collectionObj['secondaries'].length,
		  melee: collectionObj['melees'],
		  melee_count: collectionObj['melees'].length,
		  
		  pets: collectionObj['companions'],
		  pet_count: collectionObj['companions'].length,
		  
		  sentinels: collectionObj['sentinels'],
		  sentinels_count: collectionObj['sentinels'].length,
		  sentinel_pew_pews: collectionObj['sentinel_weapons'],
		  sentinel_pew_pews_count: collectionObj['sentinel_weapons'].length,
		  
		  archwings: collectionObj['wings'],
		  archwings_count: collectionObj['wings'].length,
		  archwing_guns: collectionObj['wing_primary'],
		  archwing_guns_count: collectionObj['wing_primary'].length,
		  archwing_melee: collectionObj['wing_melee'],
		  archwing_melee_count: collectionObj['wing_melee'].length,
		  
		  numberOfCollectibles: numberOfCollectibles,
		  totalEquipmentMastery: totalEquipmentMastery
		});			
		});
		process.exit();
	});

 
 //localhost:3000/anything else
 app.get('*', function(request, response){
  response.status(404).send('new error!')
});	 
 
 
 app.listen(port, (err) => {
 if (err) {
 return console.log('404. You messed up, nub.', err)
 }
 console.log(`server is listening on ${port}`)
 })
 