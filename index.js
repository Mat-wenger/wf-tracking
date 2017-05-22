 // index.js
 
 const path = require('path')
 const express = require('express')
 const exphbs = require('express-handlebars')
 const app = express()
 const port = 3000
 
 var MongoClient = require('mongodb').MongoClient;
 var MongoConnection = {'protocol' : 'mongodb', 'port': '27017', 'db': 'test'}

 var _db = {};

// Connect to the db
 MongoClient.connect(MongoConnection.protocol + '://' + 'localhost:' + MongoConnection.port + '/' + MongoConnection.db, function(err, db) {
  if(!err) {
    console.log("We are connected");
	_db = db;
	//_process_collectibles();
  }
  else {
	  return;
  }
 });
 
 app.engine('.hbs', exphbs({
 defaultLayout: 'main',
 extname: '.hbs',
 layoutsDir: path.join(__dirname, 'views/layouts'),
 partialsDir: path.join(__dirname, 'views/partials'),
 }));
 

 app.set('view engine', '.hbs')
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
 
 app.get('/view/Collectible/:id', (request, response) => {
	var coll_id = request.params.id;

	function addToSL(comp, qty){
		 if(shoppingList[comp] == undefined){
			 shoppingList[comp] = parseInt(qty);
		 }
		 else {
			 shoppingList[comp] = parseInt(shoppingList[comp]) + parseInt(qty);
		 }
	 }
	 var collectibles = _db.collection('Collection');
	 var components = _db.collection('recipe')
	 var _me = {};
	 var simpleComponents = {};
	 var complexComponents = [];
	 var recipeComponents = [];
	 var complexSubComponents = [];
	 var shoppingList = {};
	 var collection_name = '';
		 
		 
	var collectibles_stream = collectibles.find({'collection_id' : coll_id});
	collectibles_stream.on("data", function(collectible){_me = collectible;});
	collectibles_stream.on("end",function(){
		collection_name = _me.collection_name;
		var recipeStream = components.find({'collection_id' : coll_id});
		recipeStream.on("data", function(recipeObj){
			recipeComponents.push({'id': recipeObj.component_1_id, 'qty': recipeObj.component_1_qty});
			recipeComponents.push({'id': recipeObj.component_2_id, 'qty': recipeObj.component_2_qty});
			recipeComponents.push({'id': recipeObj.component_3_id, 'qty': recipeObj.component_3_qty});
			recipeComponents.push({'id': recipeObj.component_4_id, 'qty': recipeObj.component_4_qty});
		});
		recipeStream.on("end", function(){
		
			var simpleStream = components.find({'component_1_qty' : ""});
			 
			simpleStream.on("data", function(simpleComponentsObj){simpleComponents[simpleComponentsObj.component_id] = simpleComponentsObj.component_name});
			simpleStream.on("end",function(){
			for(var component = 0 ; component < recipeComponents.length; component++){
				if(simpleComponents[recipeComponents[component].id] != undefined){
					console.log('simple component found: ' + simpleComponents[recipeComponents[component].id])
					addToSL(simpleComponents[recipeComponents[component].id], recipeComponents[component].qty)
					
				}
				else {
					console.log('complex component found: ' + recipeComponents[component].id)
					complexComponents.push(recipeComponents[component].id)
				}
			}
			
			var complexStream = components.find({'component_id' : {$in : complexComponents}});
			complexStream.on('data', function(ccomponent){complexSubComponents.push({
				"complex_component_name" : ccomponent.component_name, 
				'components':[
					{'id': ccomponent.component_1_id, 'qty': ccomponent.component_1_qty},
					{'id': ccomponent.component_2_id, 'qty': ccomponent.component_2_qty},
					{'id': ccomponent.component_3_id, 'qty': ccomponent.component_3_qty},
					{'id': ccomponent.component_4_id, 'qty': ccomponent.component_4_qty},
					]})});
			complexStream.on('end', function(){
				//gotta spiral down again :(
				for(var complexSubComponent = 0;complexSubComponent  < complexSubComponents.length;complexSubComponent++){
					var complexSubComponentRecipe = complexSubComponents[complexSubComponent];
					for(var simpleComponent2 = 0; simpleComponent2 < complexSubComponentRecipe.components.length; simpleComponent2++){
						if(simpleComponents[complexSubComponentRecipe.components[simpleComponent2].id] != undefined){
							addToSL(simpleComponents[complexSubComponentRecipe.components[simpleComponent2].id], complexSubComponentRecipe.components[simpleComponent2].qty)
						}
						else {
							//This is a fully built complex component, ie; fang prime blade.
						}
					}
				}
				
				 var totalCredits = 0;
				 //going to take the shopping list and do a lookup on the acquistion.
				 //ACQUISITIONS: Enemy-{enemy}, Node-{planet}, Invasion-{side}, Relic-{relic}, Dojo-{lab}
				 //en-grhg (node, grineer heavy gunner)
				 //nd-vsfa (node, venus-fossa)
				 //iv-crps (invasion, support the corpus)
				 //rc-axh1 (relic, axi h1)
				 //dj-nrgL  (dojo, energy lab)
				 
				 //Needs Credit Cost, too
				response.render('detail_view', {
					collection_name: collection_name,
					partsList: shoppingList,
					credit_cost: totalCredits
				});
				});
			});
		});
	});
 });


//localhost:3000
/*
Mastery: starts at 2500 + 5k per rank
Bringing up the ranks of Weapons, Sentinel weapons and Archwing weapons earn 100 mastery points for each rank gained up to Rank 30 for a total of 3,000.
Bringing up the ranks of Warframes, Companions and Archwings earn 200 mastery points for each rank gained up to Rank 30 for a total of 6,000.
*/
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
	
	//no more frames:
	
	/*
		Bringing up the ranks of Weapons, Sentinel weapons and Archwing weapons earn 100 mastery points for each rank gained up to Rank 30 for a total of 3,000.
		Bringing up the ranks of Warframes, Companions and Archwings earn 200 mastery points for each rank gained up to Rank 30 for a total of 6,000.
	*/
	
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
		
	});

 
 //localhost:3000/anything else
 app.get('*', function(request, response){
  response.status(404).send('new error!')
});	 
 
 
 app.listen(port, (err) => {
 if (err) {
 return console.log('something bad happened', err)
 }
 console.log(`server is listening on ${port}`)
 })