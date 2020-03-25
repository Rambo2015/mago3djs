'use strict';

/**
 * Main Mago class.
 * @class MagoManager
 */
var MagoManager = function() 
{
	if (!(this instanceof MagoManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	Emitter.call(this);
	/**
	 * Auxiliary renderer.
	 * @type {Renderer}
	 * @default Renderer.
	 */
	this.renderer = new Renderer(this);
	
	/**
	 * Manages the selected objects.
	 * @type {SelectionManager}
	 * @default SelectionManager.
	 */
	this.selectionManager = new SelectionManager();
	
	/**
	 * Manages the shaders.
	 * @type {PostFxShadersManager}
	 * @default PostFxShadersManager.
	 */
	this.postFxShadersManager = new PostFxShadersManager();
	
	/**
	 * Manages the request & loading files.
	 * @type {ReaderWriter}
	 * @default ReaderWriter.
	 */
	this.readerWriter = new ReaderWriter();
	
	/**
	 * Contains the Mago3D policy data.
	 * @type {Policy}
	 * @default Policy.
	 */
	this.magoPolicy = new Policy();
	
	/**
	 * Manages & controls the movement of the objects in the scene.
	 * @type {AnimationManager}
	 * @default undefined.
	 */
	this.animationManager; 
	
	/**
	 * Manages & controls all the textures.
	 * @type {texturesStore}
	 * @default texturesStore.
	 */
	this.texturesStore = new TexturesStore(this);
	
	/**
	 * Manages & controls the tiles.
	 * @type {SmartTileManager}
	 * @default SmartTileManager.
	 */
	this.smartTileManager = new SmartTileManager();
	
	/**
	 * Manages & controls the deleting objects queue.
	 * @type {ProcessQueue}
	 * @default ProcessQueue.
	 */
	this.processQueue = new ProcessQueue();
	
	/**
	 * Manages & controls the parsing of loaded files.
	 * @type {ParseQueue}
	 * @default ParseQueue.
	 */
	this.parseQueue = new ParseQueue();
	
	/**
	 * Manages & controls the creation of the nodes (node = main object in Mago3D).
	 * @type {HierarchyManager}
	 * @default HierarchyManager.
	 */
	this.hierarchyManager = new HierarchyManager();

	/**
	 * Depth framebuffer object.
	 * @type {FBO}
	 * @default undefined.
	 */
	this.depthFboNeo;
	
	/**
	 * Depth framebuffer object for auxiliary and test use.
	 * @type {FBO}
	 * @default undefined.
	 */
	this.depthFboAux;
	
	/**
	 * Framebuffer object used for color coding selection.
	 * @type {FBO}
	 * @default undefined.
	 */
	this.selectionFbo; 
	
	/**
	 * Current x position of the mouse in screen coordinates.
	 * @type {Number}
	 * @default 0.
	 */
	this.mouse_x = 0;
	
	/**
	 * Current y position of the mouse in screen coordinates.
	 * @type {Number}
	 * @default 0.
	 */
	this.mouse_y = 0;
	
	
	this.mouseLeftDown = false;
	this.mouseMiddleDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane;

	this.objectSelected;
	this.buildingSelected;
	this.octreeSelected;
	this.nodeSelected;

	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.startMovPoint = new Point3D();
	
	this.configInformation = MagoConfig.getPolicy();
	this.cameraFPV = new FirstPersonView();
	this.myCameraSCX;
	
	var serverPolicy = this.configInformation;
	if (serverPolicy !== undefined)
	{
		this.magoPolicy.setLod0DistInMeters(serverPolicy.geo_lod0);
		this.magoPolicy.setLod1DistInMeters(serverPolicy.geo_lod1);
		this.magoPolicy.setLod2DistInMeters(serverPolicy.geo_lod2);
		this.magoPolicy.setLod3DistInMeters(serverPolicy.geo_lod3);
		this.magoPolicy.setLod4DistInMeters(serverPolicy.geo_lod4);
		this.magoPolicy.setLod5DistInMeters(serverPolicy.geo_lod5);
	}

	// var to delete.*********************************************
	this.loadQueue = new LoadQueue(this); // Old. delete.***

	// Vars.****************************************************************
	this.sceneState = new SceneState(); // this contains all scene mtrices and camera position.***
	this.selectionColor = new SelectionColor();
	this.vboMemoryManager = new VBOMemoryManager();
	

	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerOctrees = new VisibleObjectsController(); 
	this.visibleObjControlerNodes = new VisibleObjectsController(); 
	this.visibleObjControlerTerrain = new VisibleObjectsController(); 
	
	this.frustumVolumeControl = new FrustumVolumeControl();
	
	this.boundingSphere_Aux; 
	this.radiusAprox_aux;

	this.lastCamPos = new Point3D();
	this.squareDistUmbral = 22.0;

	this.lowestOctreeArray = [];

	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	this.isCameraMoving = false; 
	this.isCameraInsideNeoBuilding = false;
	this.renderingFase = 0;

	this.bPicking = false;
	this.scene;

	this.numFrustums;
	this.isLastFrustum = false;
	this.currentFrustumIdx = 0;
	this.highLightColor4 = new Float32Array([0.2, 1.0, 0.2, 1.0]);
	this.thereAreUrgentOctrees = false;
	
	this.hierarchyManager = new HierarchyManager();
	
	// small object size.
	this.smallObjectSize = 0.153;
	
	// sqrtTable.
	
	this.sqrtTable = new Float32Array(11);
	// make 100 values.
	var increValue = 0.1;
	for (var i=0; i<11; i++)
	{
		this.sqrtTable[i] = Math.sqrt(1+(increValue*i)*(increValue*i));
	}
	
	this.managerUtil = new ManagerUtils();

	// CURRENTS.********************************************************************
	this.currentSelectedObj_idx = -1;
	this.currentByteColorPicked = new Uint8Array(4);
	this.currentShader;

	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.pointSC= new Point3D();
	this.pointSC_2= new Point3D();
	this.arrayAuxSC = [];

	this.currentTimeSC;
	this.dateSC = new Date();
	this.startTimeSC;
	this.maxMilisecondsForRender = 10;

	this.terranTileSC;

	this.resultRaySC = new Float32Array(3);
	this.matrix4SC = new Matrix4();
	this.axisXYZ = new AxisXYZ();

	this.demoBlocksLoaded = false;

	this.objMarkerManager = new ObjectMarkerManager(this);
	
	// renderWithTopology === 0 -> render only CityGML.***
	// renderWithTopology === 1 -> render only IndoorGML.***
	// renderWithTopology === 2 -> render both.***
	this.tempSettings = {};
	this.tempSettings.renderWithTopology = 1;
	this.tempSettings.renderSpaces = true;
	this.tempSettings.spacesAlpha = 0.6;
	
	/**
	 * This class contains general settings.
	 * @type {Settings}
	 */
	this._settings = new Settings();
	
	this.tinTerrainManager;
	
	this.modeler = new Modeler(this);
	this.materialsManager = new MaterialsManager(this);
	this.idManager = new IdentifierManager();
	
	this.processCounterManager = new ProcessCounterManager();
	this.effectsManager = new EffectsManager();
	
	//CODE.magoCurrentProcess = {
	//"Unknown"  : 0,
	//"DepthRendering"  : 1,
	//"ColorRendering" : 2,
	//"ColorCodeRendering" : 3,
	//"DepthShadowRendering" : 4

	this.currentProcess = CODE.magoCurrentProcess.Unknown;

};
MagoManager.prototype = Object.create(Emitter.prototype);
MagoManager.prototype.constructor = MagoManager;

MagoManager.EVENT_TYPE = {
	'CAMERACHANGED'   : 'camerachanged',
	'CAMERAMOVEEND'   : 'cameramoveend',
	'CAMERAMOVESTART' : 'cameramovestart'
};

/**
 * object 를 그리는 두가지 종류의 function을 호출
 */
MagoManager.prototype.init = function(gl) 
{
	this.bInit = true;
	
	/*
	var canvas = this.scene.canvas;
	var glAttrs = {antialias          : true, 
		stencil            : true,
		premultipliedAlpha : false};
	var gl = canvas.getContext("webgl", glAttrs);
	if (!gl)
	{ gl = canvas.getContext("experimental-webgl", glAttrs); }
	*/
	
	if (this.sceneState.gl === undefined)
	{ this.sceneState.gl = gl; }
	if (this.vboMemoryManager.gl === undefined)
	{ this.vboMemoryManager.gl = gl; }
	if (this.effectsManager.gl === undefined)
	{ this.effectsManager.gl = gl; }
};

/**
 * object 를 그리는 두가지 종류의 function을 호출
 * @param scene 변수 Cesium Scene.
 * @param pass 변수
 * @param frustumIdx 변수
 * @param numFrustums 변수
 */
MagoManager.prototype.start = function(scene, pass, frustumIdx, numFrustums) 
{
	// Calculate FPS.
	//var start = new Date().getTime();
	// this is cesium version.***
	// mago3d 활성화가 아니면 화면을 그리지 않음
	if (!this.magoPolicy.getMagoEnable()) { return; }
	
	var isLastFrustum = false;
	this.numFrustums = numFrustums;
	this.currentFrustumIdx = this.numFrustums-frustumIdx-1;
	if (this.currentFrustumIdx === numFrustums-1) 
	{
		isLastFrustum = true;
		this.isLastFrustum = true;
	}

	// cesium 새 버전에서 지원하지 않음
	var picking = pass.pick;
	if (picking) 
	{
		//
	}
	else 
	{
		if (this.configInformation === undefined)
		{
			this.configInformation = MagoConfig.getPolicy();
		}
		if (scene)
		{
			var gl = scene.context._gl;
			gl.getExtension("EXT_frag_depth");
			
			if (!this.bInit)
			{ this.init(gl); }
		
			if (gl.isContextLost())
			{ return; }

			
		}

		this.startRender(isLastFrustum, this.currentFrustumIdx, numFrustums);
			
	}
};

/**
 * Swaps the current rendering Phase.
 * 중복 그리기를 방지하기 위하여... (각기 다른 frustum에 걸쳤을 때 여러번 그리는 것을 방지하기 위하여.)
 */
MagoManager.prototype.swapRenderingFase = function() 
{
	this.renderingFase = !this.renderingFase;
};

/**
 * 빌딩을 준비(새버전)
 * @param {gl} gl
 */
MagoManager.prototype.prepareNeoBuildingsAsimetricVersion = function(gl, visibleObjControlerNodes) 
{
	// for all renderables, prepare data.***
	var neoBuilding;
	var node, rootNode;
	var projectFolderName;
	var neoBuildingFolderName;
	//var geometryDataPath = this.readerWriter.getCurrentDataPath();
	var geometryDataPath = this.readerWriter.geometryDataPath; // default geometryDataPath = "/f4d".***
	if (this.headersRequestedCounter === undefined)
	{ this.headersRequestedCounter = 0; }

	var counter = 0;

	var currentVisibleNodes = [].concat(visibleObjControlerNodes.currentVisibles0, 
		visibleObjControlerNodes.currentVisibles2, 
		visibleObjControlerNodes.currentVisibles3, 
		visibleObjControlerNodes.currentVisiblesAux,
		visibleObjControlerNodes.currentVisiblesToPrepare);
	for (var i=0, length = currentVisibleNodes.length; i<length; i++) 
	{
		node = currentVisibleNodes[i];
		
		// Check if the node is a referenceNode.***
		var attributes = node.data.attributes;
		if (attributes === undefined)
		{ continue; }
	
		neoBuilding = currentVisibleNodes[i].data.neoBuilding;
		
		/*
		if (attributes.objectType === "basicF4d")
		{
			
		}
		else if (attributes.objectType === "multiBuildingsTile")
		{
			
		}
		*/
		
		if (attributes.projectId !== undefined && attributes.isReference !== undefined && attributes.isReference === true)
		{
			StaticModelsManager.manageStaticModel(node, this);
		}
		
		// Check if this node has topologyData.***
		/*
		if(node.data && node.data.attributes && node.data.attributes.hasTopology)
		{
			if(neoBuilding.network === undefined)
			{
				// load topologyData for this node.***
				neoBuilding.network = new Network(node);
				var network = neoBuilding.network;
				var magoManager = this;
				
				var geometryDataPath = this.readerWriter.geometryDataPath;
				var indoorGml_filePath = geometryDataPath + "/"  + projectFolderName + "/"  + neoBuilding.buildingFileName + "/topology.json";
				
				loadWithXhr(indoorGml_filePath).done(function(response) 
				{
					var enc = new TextDecoder("utf-8");
					var stringText = enc.decode(response);
					var SampleIndoorJson = JSON.parse(stringText);
					var gmlDataContainer = new GMLDataContainer(SampleIndoorJson, "1.0.3");
					network.parseTopologyData(magoManager, gmlDataContainer);
					
				}).fail(function(status) 
				{
					
				}).always(function() 
				{
					
				});
			}
	
		}
		*/
		
		var fromSmartTile = node.data.attributes.fromSmartTile;
		if (fromSmartTile === undefined)
		{ fromSmartTile = false; }

		// check if this building is ready to render.***
		if (neoBuilding)
		{
			// 1) MetaData
			var metaData = neoBuilding.metaData;
			if (metaData.fileLoadState === CODE.fileLoadState.READY) 
			{
				if (!fromSmartTile) // load only if this no is NO from a smartTile.***
				{
					projectFolderName = neoBuilding.projectFolderName;
					if (this.fileRequestControler.isFullHeaders())	{ return; }
					var neoBuildingHeaderPath = geometryDataPath + "/" + projectFolderName + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
					
					this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
				}
			}
			else if (metaData.fileLoadState === CODE.fileLoadState.LOADING_FINISHED) 
			{
				var bytesReaded = 0;
				neoBuilding.parseHeader(neoBuilding.headerDataArrayBuffer, bytesReaded);
	
				counter++;
				if (counter > 60)
				{ break; }
			}
		}
		
	}
	currentVisibleNodes.length = 0;
};

/**
 * Here updates the modelView matrices.
 * @param {SceneState} sceneState
 */
MagoManager.prototype.upDateSceneStateMatrices = function(sceneState) 
{
	if (this.myCameraSCX === undefined) 
	{ this.myCameraSCX = new Camera(); }

	if (this.configInformation === undefined) 
	{
		// We are on MagoWorld. No need update matrices.***
		return;
	}

	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		// * if this is in Cesium:
		var scene = this.scene;
		var uniformState = scene._context.uniformState;
		
		//if(!Matrix4.areEqualArrays(sceneState.modelViewMatrixLast, uniformState.modelView) || !Matrix4.areEqualArrays(sceneState.projectionMatrixLast, uniformState._projection))
		//{
		//	// calculate matrices.
		//	Matrix4.copyArray(uniformState.modelView, sceneState.modelViewMatrixLast);
		//	Matrix4.copyArray(uniformState.modelView, sceneState.modelViewMatrixLast);
		//}
		
		// ModelViewMatrix.
		//sceneState.modelViewMatrix._floatArrays = Cesium.Matrix4.clone(uniformState.modelView, sceneState.modelViewMatrix._floatArrays);
		
		// Calculate modelViewMatrix.
		if (this.isFarestFrustum())
		{
			var camera = scene.camera;
			var camPosX = camera.positionWC.x;
			var camPosY = camera.positionWC.y;
			var camPosZ = camera.positionWC.z;
			var camDirX = camera.directionWC.x;
			var camDirY = camera.directionWC.y;
			var camDirZ = camera.directionWC.z;
			var camUpX = camera.upWC.x;
			var camUpY = camera.upWC.y;
			var camUpZ = camera.upWC.z;
		
			var tergetX = camPosX + camDirX * 1000;
			var tergetY = camPosY + camDirY * 1000;
			var tergetZ = camPosZ + camDirZ * 1000;
		
			var modelViewMatrix = this.sceneState.modelViewMatrix;																	
			modelViewMatrix._floatArrays = Matrix4.lookAt(modelViewMatrix._floatArrays, [camPosX, camPosY, camPosZ], 
				[tergetX, tergetY, tergetZ], 
				[camUpX, camUpY, camUpZ]);
		}
		
		// ProjectionMatrix.***
		Cesium.Matrix4.toArray(uniformState._projection, sceneState.projectionMatrix._floatArrays); // original.***

		// Given ModelViewMatrix & ProjectionMatrix, calculate all sceneState matrix.
		sceneState.modelViewMatrixInv._floatArrays = glMatrix.mat4.invert(sceneState.modelViewMatrixInv._floatArrays, sceneState.modelViewMatrix._floatArrays);
	
		// normalMat.***
		sceneState.normalMatrix4._floatArrays = glMatrix.mat4.transpose(sceneState.normalMatrix4._floatArrays, sceneState.modelViewMatrixInv._floatArrays);
			
		// modelViewRelToEye.***
		sceneState.modelViewRelToEyeMatrix._floatArrays = glMatrix.mat4.copy(sceneState.modelViewRelToEyeMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);
		sceneState.modelViewRelToEyeMatrix._floatArrays[12] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[13] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[14] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[15] = 1;
		
		sceneState.modelViewRelToEyeMatrixInv._floatArrays = glMatrix.mat4.invert(sceneState.modelViewRelToEyeMatrixInv._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);
			
		// modelViewProjection.***
		sceneState.modelViewProjMatrix._floatArrays = glMatrix.mat4.multiply(sceneState.modelViewProjMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);

		// modelViewProjectionRelToEye.***
		sceneState.modelViewProjRelToEyeMatrix._floatArrays = glMatrix.mat4.multiply(sceneState.modelViewProjRelToEyeMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);
		
		// Check camera.
		var cameraPosition = scene.context._us._cameraPosition;
		ManagerUtils.calculateSplited3fv([cameraPosition.x, cameraPosition.y, cameraPosition.z], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);

		var frustumCommandsList = this.scene._frustumCommandsList;
		if (frustumCommandsList === undefined)
		{ frustumCommandsList = this.scene.frustumCommandsList; }
		
		var camPosX = this.scene.camera.positionWC.x;
		var camPosY = this.scene.camera.positionWC.y;
		var camPosZ = this.scene.camera.positionWC.z;
		var camDirX = this.scene.camera.direction.x;
		var camDirY = this.scene.camera.direction.y;
		var camDirZ = this.scene.camera.direction.z;
		var camUpX = this.scene.camera.up.x;
		var camUpY = this.scene.camera.up.y;
		var camUpZ = this.scene.camera.up.z;
		if (sceneState.camera.isCameraMoved(camPosX, camPosY, camPosZ, camDirX, camDirY, camDirZ, camUpX, camUpY, camUpZ ))
		{
			this.isCameraMoved = true;
		}
		
		// Update sceneState camera.***
		this.upDateCamera(sceneState.camera);
					
		sceneState.drawingBufferWidth[0] = scene.drawingBufferWidth;
		sceneState.drawingBufferHeight[0] = scene.drawingBufferHeight;
	}
	else if (this.configInformation.geo_view_library === Constant.MAGOWORLD)
	{
		var camera = sceneState.camera;
		var camPos = camera.position;
		var frustum0 = camera.getFrustum(0);
		sceneState.camera.frustum.aspectRatio[0] = sceneState.drawingBufferWidth / sceneState.drawingBufferHeight;
		// determine frustum near & far.***
		var camHeight = camera.getCameraElevation();
		var eqRadius = Globe.equatorialRadius();
		frustum0.far[0] = (eqRadius + camHeight*10);
		//frustum0.far[0] = 30000000.0;
		if (camHeight > eqRadius*1.2)
		{ frustum0.near[0] = 0.1 + camHeight; }
		else
		{ frustum0.near[0] = 0.1 + camHeight / 10000000; }
		
		ManagerUtils.calculateSplited3fv([camPos.x, camPos.y, camPos.z], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);
		
		// projection.***
		// consider near as zero provisionally.***
		//sceneState.projectionMatrix._floatArrays = glMatrix.mat4.perspective(sceneState.projectionMatrix._floatArrays, frustum0.fovyRad[0], frustum0.aspectRatio[0], frustum0.near[0], frustum0.far[0]);
		sceneState.projectionMatrix._floatArrays = glMatrix.mat4.perspective(sceneState.projectionMatrix._floatArrays, frustum0.fovyRad[0], frustum0.aspectRatio[0], 0.0, frustum0.far[0]);
		
		// modelView.***
		//sceneState.modelViewMatrix._floatArrays; 
		sceneState.modelViewMatrixInv._floatArrays = glMatrix.mat4.invert(sceneState.modelViewMatrixInv._floatArrays, sceneState.modelViewMatrix._floatArrays);
	
		// normalMat.***
		sceneState.normalMatrix4._floatArrays = glMatrix.mat4.transpose(sceneState.normalMatrix4._floatArrays, sceneState.modelViewMatrixInv._floatArrays);
		
		// modelViewRelToEye.***
		sceneState.modelViewRelToEyeMatrix._floatArrays = glMatrix.mat4.copy(sceneState.modelViewRelToEyeMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);
		sceneState.modelViewRelToEyeMatrix._floatArrays[12] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[13] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[14] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[15] = 1;
		sceneState.modelViewRelToEyeMatrixInv._floatArrays = glMatrix.mat4.invert(sceneState.modelViewRelToEyeMatrixInv._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);
		
		// modelViewProjection.***
		sceneState.modelViewProjMatrix._floatArrays = glMatrix.mat4.multiply(sceneState.modelViewProjMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);

		// modelViewProjectionRelToEye.***
		sceneState.modelViewProjRelToEyeMatrix.copyFromMatrix4(sceneState.modelViewProjMatrix);
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[12] = 0;
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[13] = 0;
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[14] = 0;
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[15] = 1;
		
		frustum0.tangentOfHalfFovy[0] = Math.tan(frustum0.fovyRad[0]/2);
		
		//sceneState.modelViewProjRelToEyeMatrix._floatArrays = glMatrix.mat4.multiply(sceneState.modelViewProjRelToEyeMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);

	}
	
	
	sceneState.modelViewProjMatrixInv = undefined; // init. Calculate when necessary.***
	sceneState.projectionMatrixInv = undefined; // init.Calculate when necessary.***
	
	if (this.depthFboNeo !== undefined)
	{
		var noiseTexture = this.texturesStore.getNoiseTexture4x4();
		sceneState.ssaoNoiseScale2[0] = this.depthFboNeo.width[0]/noiseTexture.width;
		sceneState.ssaoNoiseScale2[1] = this.depthFboNeo.height[0]/noiseTexture.height;
	}
	
	// set the auxiliar camera.
	this.myCameraSCX.direction.set(sceneState.camera.direction.x, sceneState.camera.direction.y, sceneState.camera.direction.z);
	this.myCameraSCX.up.set(sceneState.camera.up.x, sceneState.camera.up.y, sceneState.camera.up.z);
	var frustum0 = this.myCameraSCX.getFrustum(0);
	var sceneCamFurustum0 = sceneState.camera.getFrustum(0);
	frustum0.near[0] = sceneCamFurustum0.near[0];
	frustum0.far[0] = sceneCamFurustum0.far[0];
	frustum0.fovyRad[0] = sceneCamFurustum0.fovyRad[0];
	frustum0.tangentOfHalfFovy[0] = sceneCamFurustum0.tangentOfHalfFovy[0];
	frustum0.fovRad[0] = sceneCamFurustum0.fovRad[0];
	frustum0.aspectRatio[0] = sceneCamFurustum0.aspectRatio[0];
	
	// Test.***************************
	/*
	var currFrustumIdx = this.currentFrustumIdx;
	var frustumFar = sceneState.camera.frustumsArray[currFrustumIdx].far[0];
	
	var point = ManagerUtils.geographicCoordToWorldPoint(126.61342381397036, 37.57615052829767, 10, undefined, this);
	var cartesian = [point.x, point.y, point.z, 1.0];
	
	var transformedPoint_MVP = sceneState.modelViewProjMatrix.transformPoint4D__test(cartesian);
	var xDivW = transformedPoint_MVP[0]/transformedPoint_MVP[3];
	var yDivW = transformedPoint_MVP[1]/transformedPoint_MVP[3];
	var zDivW = transformedPoint_MVP[2]/transformedPoint_MVP[3];
	var transformedPoint_MVP_divW = [xDivW, yDivW, zDivW, 1.0];
	var camera = sceneState.camera;
	var frustum = camera.bigFrustum;
		
	var zDivW_divFar = zDivW/frustum.far[0];
	var transformedPoint_MV = sceneState.modelViewMatrix.transformPoint4D__test(cartesian);
	var transformedPoint_P = sceneState.projectionMatrix.transformPoint4D__test(cartesian);
	*/


	// update sun if exist.
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (this.sceneState.sunSystem && this.sceneState.applySunShadows && this.isFarestFrustum())
		{
			this.sceneState.sunSystem.updateSun(this);
		}
	}
};

/**
 * Here updates the camera's parameters and frustum planes.
 * @param {Camera} camera
 */
MagoManager.prototype.upDateCamera = function(resultCamera) 
{
	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		var scene = this.scene;
		var frustumCommandsList = scene.frustumCommandsList;
		var frustumIdx = this.currentFrustumIdx;
		var camera = this.sceneState.camera;
		var currentFrustumFar = frustumCommandsList[frustumIdx].far;
		var currentFrustumNear = frustumCommandsList[frustumIdx].near;
		
		// take all frustums near-far distances.***
		// In Cesium: If useLogDepth opaqueFrustumNearOffset = 0.9. Else opaqueFrustumNearOffset = 0.9999;
		var nearOffset = scene.opaqueFrustumNearOffset;
		var numFrustums = frustumCommandsList.length;
		var distancesArray = [];
		var tanHalfFovy = undefined;
		for (var i=0; i<numFrustums; i++)
		{
			distancesArray[i*2] = frustumCommandsList[i].near;
			distancesArray[i*2+1] = frustumCommandsList[i].far;
			
			if ( i !== 0 )
			{ distancesArray[i*2] *= nearOffset; }
			
			// Set frustum parameters.***
			var frustum = camera.getFrustum(i);
			frustum.far[0] = frustumCommandsList[i].far; 
			frustum.near[0] = frustumCommandsList[i].near;
			frustum.fovRad[0] = scene.camera.frustum._fov;
			frustum.fovyRad[0]= scene.camera.frustum._fovy;
			frustum.aspectRatio[0] = scene.camera.frustum._aspectRatio;
			if (tanHalfFovy === undefined)
			{ tanHalfFovy = Math.tan(frustum.fovyRad/2); }
			frustum.tangentOfHalfFovy[0] = tanHalfFovy;
		}
		
		// Set cam dir & up by modelViewMatrix.***
		var sceneState = this.sceneState;
		var modelViewMatInv = sceneState.modelViewMatrixInv;
		//var camPosX = modelViewMatInv._floatArrays[12]; // No enough precision. 
		//var camPosY = modelViewMatInv._floatArrays[13]; // No enough precision. 
		//var camPosZ = modelViewMatInv._floatArrays[14]; // No enough precision. 
		
		var camPosX = scene.camera.positionWC.x;
		var camPosY = scene.camera.positionWC.y;
		var camPosZ = scene.camera.positionWC.z;
		
		var camDirX = -modelViewMatInv._floatArrays[8];
		var camDirY = -modelViewMatInv._floatArrays[9];
		var camDirZ = -modelViewMatInv._floatArrays[10];
		
		var camUpX = modelViewMatInv._floatArrays[4];
		var camUpY = modelViewMatInv._floatArrays[5];
		var camUpZ = modelViewMatInv._floatArrays[6];
		
		resultCamera.position.set(camPosX, camPosY, camPosZ);
		resultCamera.direction.set(camDirX, camDirY, camDirZ);
		resultCamera.up.set(camUpX, camUpY, camUpZ);
		
		var aspectRatio = frustum.aspectRatio[0];
		var fovy = frustum.fovyRad;	
		
		frustum = resultCamera.getFrustum(frustumIdx);
		resultCamera.frustum.near[0] = currentFrustumNear;
		resultCamera.frustum.far[0] = currentFrustumFar;
		resultCamera.setFrustumsDistances(numFrustums, distancesArray);
		resultCamera.setAspectRatioAndFovyRad(aspectRatio, fovy);
		resultCamera.calculateFrustumsPlanes();
		
		//resultCamera.currentFrustumFar
	}
	else if (this.configInformation.geo_view_library === Constant.MAGOWORLD)
	{
		var camera = this.sceneState.camera;
		
		camera.doInertialMovement(this);
		
		var frustumIdx = 0;
		var camera = this.sceneState.camera;
		var frustum = camera.getFrustum(frustumIdx);
		var aspectRatio = frustum.aspectRatio[0];
		var fovy = frustum.fovyRad;

		var currentFrustumFar = frustum.far[0];
		var currentFrustumNear = frustum.near[0];
		
		this.sceneState.camera.frustum.near[0] = currentFrustumNear;
		this.sceneState.camera.frustum.far[0] = currentFrustumFar;
		this.sceneState.camera.frustum.aspectRatio[0] = aspectRatio;
		
		// take all frustums near-far distances.***
		var numFrustums = 1;
		var distancesArray = [];
		for (var i=0; i<numFrustums; i++)
		{
			distancesArray[i*2] = frustum.near;
			distancesArray[i*2+1] = frustum.far;
		}
		
		resultCamera.position.set(camera.position.x, camera.position.y, camera.position.z);
		resultCamera.direction.set(camera.direction.x, camera.direction.y, camera.direction.z);
		resultCamera.up.set(camera.up.x, camera.up.y, camera.up.z);
		frustum = resultCamera.getFrustum(frustumIdx);
		frustum.near[0] = currentFrustumNear;
		frustum.far[0] = currentFrustumFar;
		
		resultCamera.setFrustumsDistances(numFrustums, distancesArray);
		resultCamera.setAspectRatioAndFovyRad(aspectRatio, fovy);
		resultCamera.calculateFrustumsPlanes();
	}
};

/**
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
MagoManager.prototype.getCurrentTime = function() 
{
	if (this.currTime === undefined) 
	{
		this.dateSC = new Date();
		this.currTime = this.dateSC.getTime();
	}
	return this.currTime;
};

/**
 * Returns WebGL Rendering Context.
 */
MagoManager.prototype.getGl = function() 
{
	if (this.sceneState === undefined)
	{ return undefined; }
	
	return this.sceneState.gl;
};

/**
 * Loads necessary data.
 */
MagoManager.prototype.loadAndPrepareData = function() 
{
	var gl = this.getGl();
	
	// 1) LOD 0.***********************************************************************************
	this.visibleObjControlerOctrees.initArrays(); // init.******

	var node;
	// lod 0 & lod 1.
	this.checkPropertyFilters(this.visibleObjControlerNodes.currentVisibles0);
	this.checkPropertyFilters(this.visibleObjControlerNodes.currentVisibles2);
	this.checkPropertyFilters(this.visibleObjControlerNodes.currentVisibles3);
	var nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
	for (var i=0; i<nodesCount; i++) 
	{
		node = this.visibleObjControlerNodes.currentVisibles0[i];
		var attributes = node.data.attributes;
		if (attributes.objectType === "basicF4d")
		{
			// lod0 일시 카메라에 들어오는 옥트리들을 추출
			if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 0))
			{
				// any octree is visible.
				this.visibleObjControlerNodes.currentVisibles0.splice(i, 1);
				i--;
				nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
			}
		}
		//else if (attributes.objectType === "multiBuildingsTile")
		//{
		//	// Load data if necessary.
		//	var hola = 0;
		//}
	}
	
	this.prepareVisibleOctreesSortedByDistance(gl, this.visibleObjControlerOctrees); 
	this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles0); 
	this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles1); 
	this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles2); 
	
	// lod 2.
	// TODO : maxRequest count to settings
	if (this.readerWriter.referencesList_requested < 5)
	{
		nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
		for (var i=0; i<nodesCount; i++) 
		{
			node = this.visibleObjControlerNodes.currentVisibles2[i];
			var attributes = node.data.attributes;
			if (attributes.objectType === "basicF4d")
			{
				if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 2))
				{
					// any octree is visible.
					this.visibleObjControlerNodes.currentVisibles2.splice(i, 1);
					i--;
					nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
				}
			}
		}

		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles2); 
	}
	
	// lod3, lod4, lod5.***
	this.readerWriter.skinLegos_requested = 0;
	this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles0);
	this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles2);
	this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles3);
	
	// Init the pCloudPartitionsMother_requested.***
	this.readerWriter.pCloudPartitionsMother_requested = 0;
	
	// TinTerrain.*******************************************************************************************************************************
	if (this.isFarestFrustum())
	{
		if (this.tinTerrainManager !== undefined)
		{ this.tinTerrainManager.prepareVisibleTinTerrains(this); }
	}
	//if(this.isFarestFrustum())
	this.manageQueue();
	
};

/**
 * Manages the selection process.
 */
MagoManager.prototype.managePickingProcess = function() 
{
	var gl = this.getGl();
	
	if (this.selectionFbo === undefined) 
	{ this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	
	if (this.isCameraMoved || this.bPicking) // 
	{
		this.selectionFbo.bind(); // framebuffer for color selection.***
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.depthRange(0, 1);
		gl.disable(gl.CULL_FACE);
		if (this.isLastFrustum)
		{
			// this is the farest frustum, so init selection process.***
			gl.clearColor(1, 1, 1, 1); // white background.***
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
			this.selectionManager.clearCandidates();
			gl.clearColor(0, 0, 0, 1); // return to black background.***
		}
		
		this.renderer.renderGeometryColorCoding(this.visibleObjControlerNodes);
		this.swapRenderingFase();
		
		if (this.currentFrustumIdx === 0)
		{
			this.isCameraMoved = false;

			//TODO : MOVEEND EVENT TRIGGER
			//PSEUDO CODE FOR CLUSTER
			//if (this.modeler && this.modeler.objectsArray) 
			//{
			//	for (var i=0, len=this.modeler.objectsArray.length;i<len;i++) 
			//	{
			//		var obj = this.modeler.objectsArray[i];
			//		if (!obj instanceof Cluster) { continue; }
			//
			//		if (!obj.dirty && !obj.isMaking) { obj.setDirty(true); }
			//	}
			//}
		}
	}
	
	if (this.currentFrustumIdx === 0)
	{
		if ( this.bPicking === true)
		{
			// this is the closest frustum.***
			var selectionManager = this.selectionManager;
			this.bPicking = false;
			this.arrayAuxSC.length = 0;
			selectionManager.clearCurrents();
			var bSelectObjects = true;
			
			this.objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC, bSelectObjects);
			
			
			this.buildingSelected = this.arrayAuxSC[0];
			this.octreeSelected = this.arrayAuxSC[1];
			this.nodeSelected = this.arrayAuxSC[3];
			if (this.nodeSelected)
			{ this.rootNodeSelected = this.nodeSelected.getRoot(); }
			else
			{ this.rootNodeSelected = undefined; }
				
			this.arrayAuxSC.length = 0;
			if (this.buildingSelected !== undefined) 
			{
				this.displayLocationAndRotation(this.buildingSelected);
				this.selectedObjectNotice(this.buildingSelected);
			}
			if (this.objectSelected !== undefined) 
			{
				//this.displayLocationAndRotation(currentSelectedBuilding);
				//this.selectedObjectNotice(currentSelectedBuilding);
				//console.log("objectId = " + selectedObject.objectId);
			}
	
			// Test flyTo by topology.******************************************************************************
			var selCandidatesEdges = selectionManager.getSelectionCandidatesFamily("networkEdges");
			var selCandidatesNodes = selectionManager.getSelectionCandidatesFamily("networkNodes");
			var flyed = false;
			if (selCandidatesEdges)
			{
				var edgeSelected = selCandidatesEdges.currentSelected;
				if (edgeSelected && edgeSelected.vtxSegment)
				{
					// calculate the 2 positions of the edge.***
					var camPos = this.sceneState.camera.position;
					var vtxSeg = edgeSelected.vtxSegment;
					var pos1 = new Point3D();
					var pos2 = new Point3D();
					pos1.copyFrom(vtxSeg.startVertex.point3d);
					pos2.copyFrom(vtxSeg.endVertex.point3d);
					pos1.add(0.0, 0.0, 1.7); // add person height.***
					pos2.add(0.0, 0.0, 1.7); // add person height.***
						
						
					// calculate pos1 & pos2 to worldCoordinate.***
					// Need the building tMatrix.***
					var network = edgeSelected.networkOwner;
					var node = network.nodeOwner;
					var geoLocDataManager = node.data.geoLocDataManager;
					var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
					var tMat = geoLoc.tMatrix;
						
					// To positions must add "pivotPointTraslation" if exist.***
					// If building moved to bboxCenter, for example, then exist "pivotPointTraslation".***
					var pivotTranslation = geoLoc.pivotPointTraslationLC;
					if (pivotTranslation)
					{
						pos1.add(pivotTranslation.x, pivotTranslation.y, pivotTranslation.z);
						pos2.add(pivotTranslation.x, pivotTranslation.y, pivotTranslation.z);
					}

					var worldPos1 = tMat.transformPoint3D(pos1, undefined);
					var worldPos2 = tMat.transformPoint3D(pos2, undefined);

					// select the farestPoint to camera.***
					var dist1 = camPos.squareDistToPoint(worldPos1);
					var dist2 = camPos.squareDistToPoint(worldPos2);
					var pointSelected;
					if (dist1<dist2)
					{
						pointSelected = worldPos2;
					}
					else
					{ pointSelected = worldPos1; }
						
					// now flyTo pointSelected.***
					this.flyToTopology(pointSelected, 2);
					flyed = true;
				}
			}
			if (!flyed && selCandidatesNodes)
			{
				var nodeSelected = selCandidatesNodes.currentSelected;
				if (nodeSelected)
				{
					// calculate the 2 positions of the edge.***
					var camPos = this.sceneState.camera.position;
					var pos1 = new Point3D(nodeSelected.position.x, nodeSelected.position.y, nodeSelected.position.z);
					pos1.add(0.0, 0.0, 1.7); // add person height.***
						
						
					// calculate pos1 & pos2 to worldCoordinate.***
					// Need the building tMatrix.***
					var network = nodeSelected.networkOwner;
					var node = network.nodeOwner;
					var geoLocDataManager = node.data.geoLocDataManager;
					var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
					var tMat = geoLoc.tMatrix;
						
					// To positions must add "pivotPointTraslation" if exist.***
					// If building moved to bboxCenter, for example, then exist "pivotPointTraslation".***
					var pivotTranslation = geoLoc.pivotPointTraslationLC;
					if (pivotTranslation)
					{
						pos1.add(pivotTranslation.x, pivotTranslation.y, pivotTranslation.z);
					}
						
					var worldPos1 = tMat.transformPoint3D(pos1, undefined);
						
					// now flyTo pointSelected.***
					this.flyToTopology(worldPos1, 2);
					flyed = true;
				}
			}
			// End Test flyTo by topology.******************************************************************************
			
		}
		
		this.selectionColor.init(); // selection colors manager.***
	}
	
	this.selectionFbo.unbind();
	gl.enable(gl.CULL_FACE);
};

/**
 * Provisional function.
 */
MagoManager.prototype.getSilhouetteDepthFbo = function() 
{
	// Provisional function.***
	// Provisional function.***
	// Provisional function.***
	var gl = this.getGl();
	
	if (this.silhouetteDepthFboNeo === undefined) { this.silhouetteDepthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	if (this.sceneState.drawingBufferWidth[0] !== this.silhouetteDepthFboNeo.width[0] || this.sceneState.drawingBufferHeight[0] !== this.silhouetteDepthFboNeo.height[0])
	{
		// move this to onResize.***
		this.silhouetteDepthFboNeo.deleteObjects(gl);
		this.silhouetteDepthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
		this.sceneState.camera.frustum.dirty = true;
	}
	
	return this.silhouetteDepthFboNeo;
};

/**
 * Main rendering function.
 */
MagoManager.prototype.doRender = function(frustumVolumenObject) 
{
	var gl = this.getGl();
	var cameraPosition = this.sceneState.camera.position;
	var currentShader = undefined;
	
	// 1) The depth render.**********************************************************************************************************************
	var renderType = 0; // 0= depth. 1= color.***
	this.renderType = 0;
	var renderTexture = false;
	
	// Take the depFrameBufferObject of the current frustumVolume.***
	/*
	if (this.depthFboNeo === undefined) { this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	if (this.sceneState.drawingBufferWidth[0] !== this.depthFboNeo.width[0] || this.sceneState.drawingBufferHeight[0] !== this.depthFboNeo.height[0])
	{
		// move this to onResize.***
		this.depthFboNeo.deleteObjects(gl);
		this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
		this.sceneState.camera.frustum.dirty = true;
	}
	*/
	
	
	if (frustumVolumenObject.depthFbo === undefined) { frustumVolumenObject.depthFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	if (this.sceneState.drawingBufferWidth[0] !== frustumVolumenObject.depthFbo.width[0] || this.sceneState.drawingBufferHeight[0] !== frustumVolumenObject.depthFbo.height[0])
	{
		// move this to onResize.***
		frustumVolumenObject.depthFbo.deleteObjects(gl);
		frustumVolumenObject.depthFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
		this.sceneState.camera.frustum.dirty = true;
	}
	
	// test silhouette depthFbo.***
	//if (frustumVolumenObject.silhouetteDepthFboNeo === undefined) { frustumVolumenObject.silhouetteDepthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	//if (this.sceneState.drawingBufferWidth[0] !== frustumVolumenObject.silhouetteDepthFboNeo.width[0] || this.sceneState.drawingBufferHeight[0] !== frustumVolumenObject.silhouetteDepthFboNeo.height[0])
	//{
	//	// move this to onResize.***
	//	frustumVolumenObject.silhouetteDepthFboNeo.deleteObjects(gl);
	//	frustumVolumenObject.silhouetteDepthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	//	this.sceneState.camera.frustum.dirty = true;
	//}
	

	this.depthFboNeo = frustumVolumenObject.depthFbo;
	//this.silhouetteDepthFboNeo = frustumVolumenObject.silhouetteDepthFboNeo;
	//frustumVolumenObject.depthFbo = this.depthFboNeo;
	this.depthFboNeo.bind(); 
	
	//if (this.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 1);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearStencil(0); // provisionally here.***
	}
	
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
	this.renderer.renderGeometry(gl, renderType, this.visibleObjControlerNodes);
	// test mago geometries.***********************************************************************************************************
	this.renderer.renderMagoGeometries(renderType); //TEST
	this.depthFboNeo.unbind();
	this.swapRenderingFase();

	// 2) color render.************************************************************************************************************
	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		var scene = this.scene;
		scene._context._currentFramebuffer._bind();
	}
	
	// 2.1) Render terrain shadows.*******************************************************************************************************
	// Now render the geomatry.
	if (this.configInformation.geo_view_library === Constant.CESIUM && this.currentFrustumIdx < 2)
	{
		this.renderer.renderTerrainShadow(gl);
	}
	
	renderType = 1;
	this.renderType = 1;
	this.renderer.renderGeometry(gl, renderType, this.visibleObjControlerNodes);
	
	//if (this.configInformation.geo_view_library === Constant.MAGOWORLD)
	//{
	//	this.renderer.renderScreenQuadShadow(gl, this.depthFboNeo.colorBuffer);
	//}

	if (this.weatherStation)
	{
		this.weatherStation.renderWindLayerDisplayPlanes(this);
		//this.weatherStation.renderWindMultiLayers(this);
		//this.weatherStation.test_renderWindLayer(this);
		//this.weatherStation.test_renderTemperatureLayer(this);
		//this.weatherStation.test_renderCuttingPlanes(this, renderType);
		/*
		var renderType = 1;
		var currentShader;
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao default.***
			gl.enable(gl.BLEND);
			
			var noiseTexture = this.texturesStore.getNoiseTexture4x4();
			var textureAux_1x1 = this.texturesStore.getTextureAux1x1();
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			
			gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
			gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao default.***

			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);
			
			//buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]));
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, new Float32Array([0,0,0]));
			gl.uniform3fv(currentShader.buildingPosLOW_loc, new Float32Array([0,0,0]));

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux_1x1);
			currentShader.last_tex_id = textureAux_1x1;
		//this.weatherStation.test_renderTemperatureMesh(this, currentShader, renderType);
		this.weatherStation.test_renderPrecipitationMesh(this, currentShader, renderType);
		gl.disable(gl.BLEND);
		
		currentShader.disableVertexAttribArrayAll();
		*/
	}
	
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
		
	this.swapRenderingFase();
	
	// 3) test mago geometries.***********************************************************************************************************
	this.renderer.renderMagoGeometries(renderType); //TEST
	
	// 4) Render filter.******************************************************************************************************************
	//this.renderFilter();
};

/**
 * 
 */
MagoManager.prototype.initCounters = function() 
{
	this.processCounterManager.reset();
};

/**
 * Main loop function. This function contains all Mago3D Pipe-Line.
 * @param {Boolean} isLastFrustum Indicates if this is the last frustum in the render pipe-line.
 * @param {Number} frustumIdx Current frustum indice.
 * @param {Number} numFrustums Total frustums count in current rendering pipe-line.
 */
MagoManager.prototype.startRender = function(isLastFrustum, frustumIdx, numFrustums) 
{
	// Update the current frame's frustums count.
	this.numFrustums = numFrustums;
	this.isLastFrustum = isLastFrustum;
	
	var gl = this.getGl();
	this.upDateSceneStateMatrices(this.sceneState);
	
	if (this.isFarestFrustum())
	{
		this.dateSC = new Date();
		this.prevTime = this.currTime;
		this.currTime = this.dateSC.getTime();
		
		this.initCounters();
		
		// Before of multiFrustumCullingSmartTile, do animation check, bcos during animation some object can change smartTile-owner.***
		if (this.animationManager !== undefined)
		{ this.animationManager.checkAnimation(this); }

		if (this.myCameraSCX === undefined) 
		{ this.myCameraSCX = new Camera(); }
		
		if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
		{
			this.upDateCamera(this.myCameraSCX);
			this.doMultiFrustumCullingSmartTiles(this.myCameraSCX);
			this.smartTileManager.doPendentProcess(this);
		}
		
		gl.clearStencil(0); // provisionally here.***
		gl.clear(gl.STENCIL_BUFFER_BIT);

		// If mago camera has track node, camera look track node.
		this.sceneState.camera.doTrack(this);
		
		// reset stadistics data.
		this.sceneState.resetStadistics();
		
		// clear canvas.
		this.clearCanvas2D();
	}
	
	var cameraPosition = this.sceneState.camera.position;
	
	// Take the current frustumVolumenObject.***
	var frustumVolumenObject = this.frustumVolumeControl.getFrustumVolumeCulling(frustumIdx); 
	this.myCameraSCX.setCurrentFrustum(frustumIdx);
	this.sceneState.camera.setCurrentFrustum(frustumIdx);
	var visibleNodes = frustumVolumenObject.visibleNodes; // class: VisibleObjectsController.
	
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (this.frustumVolumeControl === undefined)
		{ return; }
	
		var frustumVolume = this.myCameraSCX.bigFrustum;
		this.tilesMultiFrustumCullingFinished(frustumVolumenObject.intersectedTilesArray, visibleNodes, cameraPosition, frustumVolume);
		this.prepareNeoBuildingsAsimetricVersion(gl, visibleNodes); 
	}

	var currentShader = undefined;
	this.visibleObjControlerNodes = visibleNodes; // set the current visible nodes.***

	// prepare data if camera is no moving.***
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		this.loadAndPrepareData();
		this.managePickingProcess();
	}
	
	if (this.bPicking === true && isLastFrustum)
	{
		var posWC;
	
		if (this.magoPolicy.issueInsertEnable === true)
		{
			if (this.objMarkerSC === undefined)
			{ this.objMarkerSC = new ObjectMarker(); }
			
			var mouseAction = this.sceneState.mouseAction;
			var strWC = mouseAction.getStartWorldPoint();
			posWC = new Point3D(strWC.x, strWC.y, strWC.z);
			
			var options = {
				positionWC            : posWC,
				imageFilePath         : "defaultBlue",
				imageFilePathSelected : "defaultRed",
				sizeX                 : 20.0,
				sizeY                 : 20.0
			};
			var objMarker = this.objMarkerManager.newObjectMarker(options, this);
		}

		if (this.magoPolicy.objectInfoViewEnable === true)
		{
			if (this.objMarkerSC === undefined)
			{ 
				if (posWC === undefined)
				{
					var mouseAction = this.sceneState.mouseAction;
					var strWC = mouseAction.getStartWorldPoint();
					posWC = new Point3D(strWC.x, strWC.y, strWC.z);
				}
				
				var options = {
					positionWC            : posWC,
					imageFilePath         : "defaultBlue",
					imageFilePathSelected : "defaultRed"
				};
			
				this.objMarkerSC = this.objMarkerManager.newObjectMarker(options, this);
				this.objMarkerManager.objectMarkerArray.pop();
			}
		}
	}

	// Render process.***
	this.doRender(frustumVolumenObject);

	// test. Draw the buildingNames.***
	if (this.magoPolicy.getShowLabelInfo())
	{
		if (this.currentFrustumIdx === 0)
		{ this.clearCanvas2D(); }
		this.drawBuildingNames(this.visibleObjControlerNodes) ;
		this.canvasDirty = true;
	}
	
	// Do stadistics.
	var displayStadistics = false;
	if (this.currentFrustumIdx === 0 && displayStadistics)
	{
		if (this.stadisticsDisplayed === undefined)
		{ this.stadisticsDisplayed = 0; }

		if (this.stadisticsDisplayed === 0)
		{
			var timePerFrame = this.getCurrentTime() - this.prevTime;
			this.sceneState.fps = Math.floor(1000.0/timePerFrame);
			this.clearCanvas2D();
			this.drawStadistics();
		}

		this.stadisticsDisplayed+= 1;
		
		if (this.stadisticsDisplayed > 5)
		{ this.stadisticsDisplayed = 0; }
	
		this.canvasDirty = true;
	}

};

/**
 * Prepare current visibles low LOD nodes.***
 */
MagoManager.prototype.clearCanvas2D = function() 
{
	if (this.canvasDirty === undefined)
	{ this.canvasDirty = true; }
	
	if (this.canvasDirty)
	{
		var canvas = this.getObjectLabel();
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
		this.canvasDirty = false;
	}
};


/**
 * Prepare current visibles low LOD nodes.***
 */
MagoManager.prototype.prepareVisibleLowLodNodes = function(lowLodNodesArray) 
{
	var maxParsesCount = 300; // 5
	if (this.readerWriter.skinLegos_requested > maxParsesCount)
	{ return; }
	
	// Prepare lod3, lod4 and lod5 meshes.***
	// check "this.visibleObjControlerNodes.currentVisibles3".***
	var node;
	var neoBuilding;
	
	var lowLodNodesCount = lowLodNodesArray.length;
	for (var i=0; i<lowLodNodesCount; i++) 
	{
		node = lowLodNodesArray[i];
		
		var attributes = node.data.attributes;
		if (attributes.objectType === "basicF4d")
		{
			neoBuilding = node.data.neoBuilding;
			if (neoBuilding.metaData && neoBuilding.metaData.fileLoadState === CODE.fileLoadState.PARSE_FINISHED)
			{ neoBuilding.prepareSkin(this); }
		}
		else if (attributes.objectType === "multiBuildingsTile")
		{
			// Load data if necessary.
			var multiBuildings = node.data.multiBuildings;
			
			if (multiBuildings)
			{ multiBuildings.prepareData(this); }
		}
		
		if (this.readerWriter.skinLegos_requested > maxParsesCount)
		{ return; }
	}
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawStadistics = function() 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");
	
	if (this.isFarestFrustum())
	{ this.clearCanvas2D(); }

	var screenCoord = new Point2D(130, 60);
	var sceneState = this.sceneState;
	
	ctx.font = "13px Arial";

	ctx.strokeText("Triangles : " + sceneState.trianglesRenderedCount, screenCoord.x, screenCoord.y);
	ctx.fillText("Triangles : " + sceneState.trianglesRenderedCount, screenCoord.x, screenCoord.y);
	
	ctx.strokeText("Points : " + sceneState.pointsRenderedCount, screenCoord.x, screenCoord.y + 30);
	ctx.fillText("Points : " + sceneState.pointsRenderedCount, screenCoord.x, screenCoord.y + 30);
	
	ctx.strokeText("FPS : " + sceneState.fps, screenCoord.x, screenCoord.y+60);
	ctx.fillText("FPS : " + sceneState.fps, screenCoord.x, screenCoord.y+60);

	ctx.restore(); 
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawBuildingNames = function(visibleObjControlerNodes) 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");

	// lod2.
	var gl = this.getGl();
	var node;
	var nodeRoot;
	var geoLocDataManager;
	var geoLoc;
	var neoBuilding;
	var worldPosition;
	var screenCoord;
	
	// 1rst, collect rootNodes.
	var rootNodesMap = {};
	var currentVisiblesArray = visibleObjControlerNodes.currentVisibles1.concat(visibleObjControlerNodes.currentVisibles2, visibleObjControlerNodes.currentVisibles3);
	var nodesCount = currentVisiblesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = currentVisiblesArray[i];
		nodeRoot = node.getRoot();
		if (node.data === undefined || node.data.neoBuilding === undefined)
		{ continue; }
	
		if (node.data.distToCam > 1500.0)
		{ continue; }
		
		var key = node.data.neoBuilding.buildingId;
		///rootNodesMap.set(nodeRoot, nodeRoot);
		rootNodesMap[key] = nodeRoot;
	}
	

	for (var key in rootNodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(rootNodesMap, key))
		{
			//nodeRoot = rootNodesArray[i];
			nodeRoot = rootNodesMap[key];
			geoLocDataManager = nodeRoot.data.geoLocDataManager;
			geoLoc = geoLocDataManager.getCurrentGeoLocationData();
			//neoBuilding = node.data.neoBuilding;
			worldPosition = nodeRoot.getBBoxCenterPositionWorldCoord(geoLoc);
			screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, this);
			
			if (screenCoord.x >= 0 && screenCoord.y >= 0)
			{
				ctx.font = "13px Arial";
				//ctx.strokeText(nodeRoot.data.nodeId, screenCoord.x, screenCoord.y);
				//ctx.fillText(nodeRoot.data.nodeId, screenCoord.x, screenCoord.y);
				ctx.strokeText(nodeRoot.data.data_name, screenCoord.x, screenCoord.y);
				ctx.fillText(nodeRoot.data.data_name, screenCoord.x, screenCoord.y);
			}
		}
	}
	
	rootNodesMap = {};

	ctx.restore(); 
};

/**
 * The camera was moved.
 */
MagoManager.prototype.cameraMoved = function() 
{
	this.sceneState.camera.setDirty(true);
	
	if (this.selectionFbo === undefined)     
	{ 
		if (this.sceneState.gl) 
		{
			this.selectionFbo = new FBO(this.sceneState.gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); 
		}
	}
	if (this.selectionFbo)
	{
		this.selectionFbo.dirty = true;
	}
};

/**
 */
MagoManager.prototype.TEST__SelectionBuffer = function() 
{
	if (this.selectionFbo === undefined)
	{ return; }
	
	var gl = this.getGl();
	
	this.selectionFbo.bind(); // framebuffer for color selection.***
	///////////////////////////////////////////////////////////////////////
	var mouseX = 500;
	var mouseY = 500;
	var mosaicWidth = 9;
	var mosaicHeight = 9;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 4 x 3x3 pixel, total 9 pixels select.***
	var pixelX = mouseX - Math.floor(mosaicWidth/2);
	var pixelY = this.sceneState.drawingBufferHeight - mouseY - Math.floor(mosaicHeight/2); // origin is bottom.***
	
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***
	
	//this.selectionManager.clearCurrents();

	// now, select the object.***
	// The center pixel of the selection is 12, 13, 14.***
	var centerPixel = Math.floor(totalPixelsCount/2);
	var idx = this.selectionColor.decodeColor3(pixels[centerPixel*3], pixels[centerPixel*3+1], pixels[centerPixel*3+2]);
	if (idx === 0)
	{ var hola = 0; }
	//////////////////////////////////////////////////////////////////////////////
	this.selectionFbo.unbind();
};

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 * @returns {Array} resultSelectedArray 
 */
MagoManager.prototype.getSelectedObjects = function(gl, mouseX, mouseY, resultSelectedArray, bSelectObjects) 
{
	if (bSelectObjects === undefined)
	{ bSelectObjects = false; }
	
	// Read the picked pixel and find the object.*********************************************************
	var mosaicWidth = 1;
	var mosaicHeight = 1;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 4 x 3x3 pixel, total 9 pixels select.***
	var pixelX = mouseX - Math.floor(mosaicWidth/2);
	var pixelY = this.sceneState.drawingBufferHeight - mouseY - Math.floor(mosaicHeight/2); // origin is bottom.***
	
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***
	
	var selectionManager = this.selectionManager;

	// now, select the object.***
	// The center pixel of the selection is 12, 13, 14.***
	var centerPixel = Math.floor(totalPixelsCount/2);
	var idx = this.selectionColor.decodeColor3(pixels[centerPixel*3], pixels[centerPixel*3+1], pixels[centerPixel*3+2]);
	
	// Provisionally.***
	if (bSelectObjects)
	{ selectionManager.selectObjects(idx); }
	else 
	{
		selectionManager.currentReferenceSelected = selectionManager.referencesMap[idx];
		selectionManager.currentOctreeSelected = selectionManager.octreesMap[idx];
		selectionManager.currentBuildingSelected = selectionManager.buildingsMap[idx];
		selectionManager.currentNodeSelected = selectionManager.nodesMap[idx];
	}
	
	var selectedObject = selectionManager.currentReferenceSelected;

	resultSelectedArray[0] = selectionManager.currentBuildingSelected;
	resultSelectedArray[1] = selectionManager.currentOctreeSelected;
	resultSelectedArray[2] = selectionManager.currentReferenceSelected;
	resultSelectedArray[3] = selectionManager.currentNodeSelected;
	
	// Aditionally check if selected an edge of topology.***
	var selNetworkEdges = selectionManager.getSelectionCandidatesFamily("networkEdges");
	if (selNetworkEdges)
	{
		var currEdgeSelected = selNetworkEdges.currentSelected;
		var i = 0;
		while (currEdgeSelected === undefined && i< totalPixelsCount)
		{
			var idx = this.selectionColor.decodeColor3(pixels[i*3], pixels[i*3+1], pixels[i*3+2]);
			currEdgeSelected = selNetworkEdges.selectObject(idx);
			i++;
		}
	}
	
	// TEST: Check if selected a cuttingPlane.***
	var selGeneralObjects = selectionManager.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		var i = 0;
		while (currObjectSelected === undefined && i< totalPixelsCount)
		{
			var idx = this.selectionColor.decodeColor3(pixels[i*3], pixels[i*3+1], pixels[i*3+2]);
			currObjectSelected = selGeneralObjects.selectObject(idx);
			i++;
		}
	}
	
	// Check general objects.***
	if (selectedObject === undefined)
	{ selectedObject = selectionManager.selCandidatesMap[idx]; }

	selectionManager.currentGeneralObjectSelected = selectionManager.selCandidatesMap[idx];
	
	//if (selectionManager.currentGeneralObjectSelected)
	//{ var hola =0; }
	
	return selectedObject;
};

/**
 * Calculates the plane on move an object.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @returns {Plane} resultSelObjMovePlane Calculated plane.
 */
MagoManager.prototype.calculateSelObjMovePlaneAsimetricMode = function(gl, pixelX, pixelY, resultSelObjMovePlane) 
{
	if (this.pointSC === undefined)
	{ this.pointSC = new Point3D(); }
	
	if (this.pointSC2 === undefined)
	{ this.pointSC2 = new Point3D(); }
	
	var geoLocDataManager = this.nodeSelected.getNodeGeoLocDataManager();
	
	ManagerUtils.calculatePixelPositionWorldCoord(gl, pixelX, pixelY, this.pointSC2, undefined, undefined, undefined, this);
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
	var tMatrixInv = buildingGeoLocation.getTMatrixInv();
	this.pointSC = tMatrixInv.transformPoint3D(this.pointSC2, this.pointSC); // buildingSpacePoint.***

	if (resultSelObjMovePlane === undefined)
	{ resultSelObjMovePlane = new Plane(); }
	// the plane is in world coord.***
	resultSelObjMovePlane.setPointAndNormal(this.pointSC.x, this.pointSC.y, this.pointSC.z, 0.0, 0.0, 1.0);
	return resultSelObjMovePlane;
};

/**
 * Returns true if is dragging.
 * 
 * @returns {Boolean} 드래그 여부
 */
MagoManager.prototype.isDragging = function() 
{
	if (!this.selectionFbo)
	{
		return false;
	}
	
	var bIsDragging = false;
	var gl = this.sceneState.gl;
	
	this.arrayAuxSC.length = 0;
	
	this.selectionFbo.bind();
	var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);

	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL)	// Moving all
	{
		var currentBuildingSelected = this.arrayAuxSC[0];
		var currentNodeSelected = this.arrayAuxSC[3];
		var currentRootNodeSelected;
		if (currentNodeSelected)
		{
			currentRootNodeSelected = currentNodeSelected.getRoot();
		}
		this.arrayAuxSC.length = 0;

		if (currentRootNodeSelected !== undefined && currentRootNodeSelected === this.rootNodeSelected) 
		{
			bIsDragging = true;
		}
		else 
		{
			bIsDragging = false;
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // Moving object
	{
		if (current_objectSelected === undefined)
		{ bIsDragging = false; }
		else if (current_objectSelected === this.objectSelected) 
		{
			bIsDragging = true;
		}
		else 
		{
			bIsDragging = false;
		}
	}
	/*
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS) 
	{
		// Compare currentSelectedObject with the nowSelectedObject.***
		var currSelected = this.selectionManager.getSelectedGeneral();

		this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
		var nowSelected = this.selectionManager.getSelectedGeneral();
		if (nowSelected !== undefined && nowSelected === currSelected)
		{
			var className = nowSelected.constructor.name;
			if (className === "GeographicCoord")
			{
				bIsDragging = true;
			}
			else 
			{
				bIsDragging = false;
			}
		}
	}
	*/
	else
	{
		if (this.weatherStation)
		{
			// check if there are cuttingPlanes to move.***
			var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
			if (selGeneralObjects)
			{
				var currObjectSelected = selGeneralObjects.currentSelected;
				if (currObjectSelected)
				{
					// check if is a cuttingPlane.***
					if (currObjectSelected instanceof CuttingPlane)
					{
						bIsDragging = true;
					}
				}
				else 
				{
					bIsDragging = false;
				}
			}
			else
			{ bIsDragging = false; }
		}
		
	}
	
	// General objects.***
	if (!bIsDragging)
	{
		if (current_objectSelected instanceof MagoRenderable) 
		{
			current_objectSelected = current_objectSelected.getRootOwner();
		}
		if (current_objectSelected !== undefined && current_objectSelected === this.selectionManager.getSelectedGeneral())
		{
			bIsDragging = true;
		}
	}
	
	// Finally.***
	if (!bIsDragging)
	{
		this.selectionManager.clearCandidates();
	}
	
	this.selectionFbo.unbind();

	return bIsDragging;
};

/**
 * 카메라 motion 활성 또는 비활성
 * 
 * @param {Boolean} state 카메라 모션 활성화 여부
 */
MagoManager.prototype.setCameraMotion = function(state)
{
	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.scene.screenSpaceCameraController.enableRotate = state;
		this.scene.screenSpaceCameraController.enableZoom = state;
		this.scene.screenSpaceCameraController.enableLook = state;
		this.scene.screenSpaceCameraController.enableTilt = state;
		this.scene.screenSpaceCameraController.enableTranslate = state;
	}
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionLeftUp = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	if (this.objectMoved)
	{
		this.objectMoved = false;
		var nodeSelected = this.selectionManager.currentNodeSelected;
		if (nodeSelected === undefined)
		{ return; }
		
		this.saveHistoryObjectMovement(this.objectSelected, nodeSelected);
	}
	
	this.isCameraMoving = false;
	this.mouseLeftDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane = undefined;
	this.selObjMovePlaneCC = undefined;
	this.startGeoCoordDif = undefined;
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;

	this.dateSC = new Date();
	this.currentTimeSC = this.dateSC.getTime();
	var miliSecondsUsed = this.currentTimeSC - this.startTimeSC;
	if (miliSecondsUsed < 1500) 
	{
		if (this.mouse_x === mouseX && this.mouse_y === mouseY) 
		{
			this.bPicking = true;
		}
	}
	
	this.setCameraMotion(true);
	
	// Clear startPositions of mouseAction.***
	var mouseAction = this.sceneState.mouseAction;
	mouseAction.clearStartPositionsAux(); // provisionally only clear the aux.***
	
	if (this.sceneState.sunSystem && this.sceneState.applySunShadows && this.currentFrustumIdx === 0)
	{
		this.sceneState.sunSystem.updateSun(this);
	}
	
	// test zBouncing.************************
	/*
	var nodeSelected = this.selectionManager.currentNodeSelected;
	if (nodeSelected)
	{
		var nodeId = nodeSelected.data.nodeId;
		var effect = new Effect({
			effectType      : "zBounceSpring",
			durationSeconds : 0.4
		});
		
		this.effectsManager.addEffect(nodeId, effect);
		
		// shadow on-off test.
		var effect = new Effect({
			effectType      : "borningLight",
			durationSeconds : 1.0
		});
		
		this.effectsManager.addEffect(nodeId, effect);
	}
	*/
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.keyDown = function(key) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	if (this.modeler === undefined)
	{ this.modeler = new Modeler(this); }
	
	if (key === 32) // 32 = 'space'.***
	{
		var renderingSettings = this._settings.getRenderingSettings();
		var pointsCloudColorRamp = renderingSettings.getPointsCloudInColorRamp();
		renderingSettings.setPointsCloudInColorRamp(!pointsCloudColorRamp);
	}
	else if (key === 37) // 37 = 'left'.***
	{
		//this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_PLANEGRID;
		//this.modeler.mode = CODE.modelerMode.DRAWING_EXCAVATIONPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_TUNNELPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_PIPE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_SPHERE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_BOX;
		//this.modeler.mode = CODE.modelerMode.DRAWING_CLIPPINGBOX;
		//this.modeler.mode = CODE.modelerMode.DRAWING_CONCENTRICTUBES;
		//this.modeler.mode = CODE.modelerMode.DRAWING_TUBE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
		//this.modeler.mode = 50;
		
		if (this.counterAux === undefined)
		{ this.counterAux = -1; }
		
		if (this.counterAux === -1)
		{
			//this.modeler.mode = CODE.modelerMode.DRAWING_CLIPPINGBOX;
			//this.modeler.mode = CODE.modelerMode.DRAWING_CYLYNDER;
			this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
			//this.modeler.mode = CODE.modelerMode.DRAWING_EXCAVATIONPOINTS;
			this.counterAux++;
		}
		else if (this.counterAux === 0)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_BOX;
			this.counterAux++;
		}
		else if (this.counterAux === 1)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_TUBE;
			this.counterAux++;
		}
		else if (this.counterAux === 2)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_CONCENTRICTUBES;
			this.counterAux++;
		}
		else if (this.counterAux === 3)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
			this.counterAux++;
		}
		else if (this.counterAux === 4)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_SPHERE;
			this.counterAux++;
		}
		else if (this.counterAux === 5)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_CLIPPINGBOX;
			this.counterAux ++;
		}
		else if (this.counterAux === 6)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_FREECONTOURWALL;//
			this.counterAux = 0;
		}
		
	}
	else if (key === 38) // 38 = 'up'.***
	{
		this.modeler.mode = CODE.modelerMode.DRAWING_STATICGEOMETRY;
	}
	else if (key === 39) // 39 = 'right'.***
	{
		this.modeler.mode = CODE.modelerMode.DRAWING_BSPLINE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
		//this.modeler.mode = 51;
	}
	else if (key === 40) // 40 = 'down'.***
	{
		this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
	}
	else if (key === 49) // 49 = '1'.***
	{
		if (this.pointsCloudWhite === undefined)
		{ this.pointsCloudWhite = true; }
		
		if (this.pointsCloudWhite)
		{ this.pointsCloudWhite = false; }
		else
		{ this.pointsCloudWhite = true; }
	}
	else if (key === 80) // 80 = 'p'.***
	{
		var projectId = "AutonomousBus";
		var dataKey = "AutonomousBus_0";
			
		// Do a test.***
		//var projectId = "3ds.json";
		//var dataKey = "GyeomjaeJeongSeon_del";
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		node.data.isTrailRender = true; // test.***
		
		var geoLocDataManager = node.getNodeGeoLocDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
		var geoCoords = geoLocData.getGeographicCoords();
		var currLon = geoCoords.longitude;
		var currLat = geoCoords.latitude;
		var currAlt = geoCoords.altitude;
		
		var latitude;
		var longitude;
		var elevation;
		
		var heading = 45;
		var pitch = 45;
		var roll;
		

		// Test 2: moving by a path.***
		var bSplineCubic3d = this.modeler.bSplineCubic3d;
		var geographicCoordsArray = bSplineCubic3d.geoCoordsList.geographicCoordsArray;
		var path3d = new Path3D(geographicCoordsArray);
		if (bSplineCubic3d !== undefined)
		{
			// do animation by path.***
			var animationOption = {
				animationType                : CODE.animationType.PATH,
				path                         : path3d,
				linearVelocityInMetersSecond : 30,
				autoChangeRotation           : true
			};
			this.changeLocationAndRotation(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, animationOption);
		}
	}
	else if (key === 83) // 83 = 's'.***
	{
		// active or deactive shadows.
		if (this.sceneState.applySunShadows)
		{ this.sceneState.setApplySunShadows(false); }
		else
		{ this.sceneState.setApplySunShadows(true); }
	}
	else if (key === 84) // 84 = 't'.***
	{

		//if (this.magoPolicy.issueInsertEnable)
		//{ this.magoPolicy.issueInsertEnable = false; }
		//else
		//{ this.magoPolicy.issueInsertEnable = true; }
		
		
		// Stencil shadow mesh making test.********************
		/*
		var nodeSelected = this.selectionManager.currentNodeSelected;
		if (nodeSelected)
		{
			var geoLocDataManager = nodeSelected.data.geoLocDataManager;
			var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
			var sunSystem = this.sceneState.sunSystem;
			var sunDirWC = sunSystem.getSunDirWC();
			var sunDirLC = geoLocData.getRotatedRelativeVector(sunDirWC, sunDirLC);
			
			var neoBuilding = nodeSelected.data.neoBuilding;
			var lodBuilding = neoBuilding.lodBuildingMap.lod3;
			if (lodBuilding)
			{ lodBuilding.skinLego.makeStencilShadowMesh(sunDirLC); }
		}
		*/
		// End test----------------------------------------------------
		
		// another test.***
		if (this.modeler !== undefined)
		{
			
			var geoCoordsList = this.modeler.getGeographicCoordsList();
			if (geoCoordsList !== undefined)
			{
				// test make thickLine.
				//geoCoordsList.test__makeThickLines(this);
				if (geoCoordsList.getGeoCoordsCount() > 0)
				{
					var renderableObject = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsList.geographicCoordsArray, this);
					this.modeler.addObject(renderableObject, 15);
					
					geoCoordsList.geographicCoordsArray.length = 0;
				}
				var hola = 0;
			}
			
			//var excavation = this.modeler.getExcavation();
			//if (excavation !== undefined)
			//{
			//	excavation.makeExtrudeObject(this);
			//}
			/*
			if (geoCoordsList !== undefined && geoCoordsList.geographicCoordsArray.length > 0)
			{
				// test make thickLine.
				var options = {
					geoCoordsArray: geoCoordsList.geographicCoordsArray
				};
				var excavation = new Excavation(options);
				this.modeler.addObject(excavation, 12);
			}
			
			
			var tunnel = this.modeler.getTunnel();
			if (tunnel !== undefined)
			{
				tunnel.getProfileGeographicCoordsList(); // executed this only to create the profile.*** TEST.***
				tunnel.makeMesh(this);
				
			}
			*/
			/*
			// Another test: Change color by projectId & objectId.***
			var api = new API();
			api.apiName = "changeColor";
			api.setProjectId("AutonomousBus");
			api.setDataKey("AutonomousBus_0");
			api.setObjectIds("13");
			api.setColor("220,150,20");
			this.callAPI(api);
			
			// Another test: BSplineCubic3d.***
			var bSplineCubic3d = this.modeler.bSplineCubic3d;
			if (bSplineCubic3d !== undefined)
			{
				if (bSplineCubic3d.geoCoordsList === undefined)
				{ bSplineCubic3d.geoCoordsList = new GeographicCoordsList(); }
				
				var maxLengthDegree = 0.001;
				Path3D.insertPointsOnLargeSegments(bSplineCubic3d.geoCoordsList.geographicCoordsArray, maxLengthDegree, this);
				
				var coordsCount = bSplineCubic3d.geoCoordsList.geographicCoordsArray.length;
				for (var i=0; i<coordsCount; i++)
				{
					var geoCoord = bSplineCubic3d.geoCoordsList.geographicCoordsArray[i];
					var geoLocDataManager = geoCoord.getGeoLocationDataManager();
					var geoLocData = geoLocDataManager.newGeoLocationData("noName");
					geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
				}
				
				var geoCoordsList = bSplineCubic3d.getGeographicCoordsList();
				geoCoordsList.makeLines(this);
			
				// Make the controlPoints.***
				var controlPointArmLength = 0.2;
				bSplineCubic3d.makeControlPoints(controlPointArmLength, this);
				bSplineCubic3d.makeInterpolatedPoints();
			}
			*/
		}
		
		// Another test.***
		
		if (this.smartTile_f4d_tested === undefined)
		{
			this.smartTile_f4d_tested = 1;
			//var projectFolderName = "smartTile_f4d_Korea";
			//var projectFolderName = "SejongParkJinWoo_20191101";
			var projectFolderName = "SmartTilesF4D_WorkFolder";
			var fileName = this.readerWriter.geometryDataPath + "/" + projectFolderName + "/" + "smartTile_f4d_indexFile.sii";
			this.readerWriter.getObjectIndexFileSmartTileF4d(fileName, projectFolderName, this);

		}
		
		//else if (this.smartTile_f4d_tested === 1)
		//{
		//	this.smartTile_f4d_tested ++;
		//	var projectFolderName = "smartTile_f4d_Korea";
		//	var fileName = this.readerWriter.geometryDataPath + "/" + projectFolderName + "/" + "smartTile_f4d_indexFile.sii";
		//	this.readerWriter.getObjectIndexFileSmartTileF4d(fileName, projectFolderName, this);
		//}

		
		// Another test. make collisionCheckOctree.***
		/*
		if (this.selectionManager.currentNodeSelected !== undefined)
		{
			// make collisionCheckOctree.***
			var selNode = this.selectionManager.currentNodeSelected;
			var neoBuilding = selNode.data.neoBuilding;
			if (neoBuilding !== undefined)
			{
				var attributeKey = "isDeletable";
				var attributeValue = false;
				neoBuilding.setAttribute(attributeKey, attributeValue);
				neoBuilding.setAttribute("keepDataArrayBuffers", true);
				// make collisionCheckOctree.***
				if (neoBuilding.allModelsAndReferencesAreParsed(this))
				{
					var desiredMinOctreeSize = 0.25;
					neoBuilding.makeCollisionCheckOctree(desiredMinOctreeSize);
				}
				else 
				{
					neoBuilding.forceToLoadModelsAndReferences(this);
				}
			}
		}
		
		// Moviment restriction test.***
		if (this.modeler !== undefined)
		{
			
			var geoCoordsList = this.modeler.getGeographicCoordsList();
			var geoCoordSegment = geoCoordsList.getGeoCoordSegment(0);
			
			
			var className = "ConcentricTubes";
			var objectsArray = this.modeler.extractObjectsByClassName(className);
			if (objectsArray !== undefined && objectsArray.length > 0)
			{
				var concentricTubes = objectsArray[0];
				if (concentricTubes.attributes === undefined)
				{ concentricTubes.attributes = {}; }
				
				var attributes = concentricTubes.attributes;
				if (attributes.movementRestriction === undefined)
				{ attributes.movementRestriction = {}; }
				
				
				if (attributes.movementRestriction.element === undefined)
				{
					attributes.movementRestriction.element = geoCoordSegment;
				}
				
			}
		}
		*/
		
	}
	else if (key === 87) // 87 = 'w'.***
	{
		// do wind test.
		if (this.windTest === undefined)
		{
			if (this.weatherStation === undefined)
			{ this.weatherStation = new WeatherStation(); }
		
			var geometryDataPath = this.readerWriter.geometryDataPath;
			var windDataFilesNamesArray = ["OBS-QWM_2016062000.grib2_wind_000", "OBS-QWM_2016062001.grib2_wind_000", "OBS-QWM_2016062002.grib2_wind_000", "OBS-QWM_2016062003.grib2_wind_000",
				"OBS-QWM_2016062004.grib2_wind_000", "OBS-QWM_2016062005.grib2_wind_000", "OBS-QWM_2016062006.grib2_wind_000", "OBS-QWM_2016062007.grib2_wind_000",
				"OBS-QWM_2016062008.grib2_wind_000", "OBS-QWM_2016062009.grib2_wind_000", "OBS-QWM_2016062010.grib2_wind_000", "OBS-QWM_2016062011.grib2_wind_000",
				"OBS-QWM_2016062012.grib2_wind_000", "OBS-QWM_2016062013.grib2_wind_000", "OBS-QWM_2016062014.grib2_wind_000", "OBS-QWM_2016062015.grib2_wind_000",
				"OBS-QWM_2016062016.grib2_wind_000", "OBS-QWM_2016062017.grib2_wind_000", "OBS-QWM_2016062018.grib2_wind_000", "OBS-QWM_2016062019.grib2_wind_000",
				"OBS-QWM_2016062020.grib2_wind_000", "OBS-QWM_2016062021.grib2_wind_000", "OBS-QWM_2016062022.grib2_wind_000", "OBS-QWM_2016062023.grib2_wind_000"];
				
			//var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_Airport";
			var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_GolfPark_NineBridge1";
			
			this.weatherStation.test_loadWindData3d(this, windDataFilesNamesArray, windMapFilesFolderPath);
			this.TEST__golfPark();
			this.windTest = true;
		}
	}
	else if (key === 89) // 89 = 'y'.***
	{
		if (this.magoMode === undefined)
		{ this.magoMode = CODE.magoMode.NORMAL; }
		
		if (this.magoMode === CODE.magoMode.NORMAL)
		{ this.magoMode = CODE.magoMode.DRAWING; }
		else if (this.magoMode === CODE.magoMode.DRAWING)
		{
			this.magoMode = CODE.magoMode.NORMAL;
			this.modeler.mode = CODE.modelerMode.INACTIVE;
		}
	}
	
	
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.TEST__golfPark = function() 
{
	// create 3 golfHoleFlags.
	var geoCoord = new GeographicCoord(126.40310387701689, 33.34144078912163, 34.0);
	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
	
	var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
	
	var golfHoleFlag = new GolfHoleFlag(0.3, 20, options);
	golfHoleFlag.geoLocDataManager = geoLocDataManager;
	if (golfHoleFlag.attributes === undefined)
	{ golfHoleFlag.attributes = {}; }
	golfHoleFlag.attributes.isMovable = true;
	
	this.modeler.addObject(golfHoleFlag, 15);
	
	// 2nd golfHoleFlag.
	var geoCoord = new GeographicCoord(126.39837002777193, 33.341987673830694, 23.8);
	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
	
	var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
	
	var golfHoleFlag = new GolfHoleFlag(0.3, 20, options);
	golfHoleFlag.geoLocDataManager = geoLocDataManager;
	if (golfHoleFlag.attributes === undefined)
	{ golfHoleFlag.attributes = {}; }
	golfHoleFlag.attributes.isMovable = true;
	
	this.modeler.addObject(golfHoleFlag, 15);
	
	// 3rd golfHoleFlag.
	var geoCoord = new GeographicCoord(126.39794580151037, 33.341476458307255, 18.5);
	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
	
	var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
	
	var golfHoleFlag = new GolfHoleFlag(0.3, 20, options);
	golfHoleFlag.geoLocDataManager = geoLocDataManager;
	if (golfHoleFlag.attributes === undefined)
	{ golfHoleFlag.attributes = {}; }
	golfHoleFlag.attributes.isMovable = true;
	
	this.modeler.addObject(golfHoleFlag, 15);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionLeftClick = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	
	// Note: the "mouseActionLeftClick" runs after "mouseActionLeftDown" & "mouseActionLeftUp".***
	//--------------------------------------------------------------------------------------------
	if (this.magoMode === CODE.magoMode.DRAWING)// then process to draw.***// Test code.***// Test code.***
	{
		// Test code.***
		// Test code.***// Test code.***// Test code.***// Test code.***// Test code.***// Test code.***// Test code.***
		if (this.modeler === undefined)
		{ this.modeler = new Modeler(this); }
		//	CODE.modelerMode = {
		//	"INACTIVE"                 : 0,
		//	"DRAWING_POLYLINE"         : 1,
		//	"DRAWING_GEOGRAPHICPOINTS" : 2,
		//};
			
		//this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_PLANEGRID;
		//this.modeler.mode = CODE.modelerMode.DRAWING_EXCAVATIONPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_TUNNELPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_STATICGEOMETRY;
		//this.modeler.mode = CODE.modelerMode.DRAWING_BSPLINE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
		
		// Calculate the geographicCoord of the click position.****
		var geoCoord;
		var strWorldPoint;
		
		if (this.configInformation.geo_view_library === Constant.CESIUM)
		{
			var camera = this.scene.frameState.camera;
			var scene = this.scene;
			var ray = camera.getPickRay(new Cesium.Cartesian2(mouseX, mouseY));
			strWorldPoint = scene.globe.pick(ray, scene);
		}
		else 
		{
			var mouseAction = this.sceneState.mouseAction;
			strWorldPoint = mouseAction.strWorldPoint;
		}
		if (strWorldPoint === undefined)
		{ return; }
		
		geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
		geoCoord.absolutePoint = strWorldPoint;
		
		var modelerMode = this.modeler.mode;
		if (this.modeler.mode === CODE.modelerMode.DRAWING_PLANEGRID && this.modeler.planeGrid === undefined)
		{
			// Calculate the click position and create the planeGrid geoLocation.***
			this.modeler.createPlaneGrid();
			this.modeler.planeGrid.makeVbo(this.vboMemoryManager);
			
			if (this.modeler.planeGrid.geoLocDataManager === undefined)
			{ this.modeler.planeGrid.geoLocDataManager = new GeoLocationDataManager(); }
			
			var geoLocDataManager = this.modeler.planeGrid.geoLocDataManager;
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+10, undefined, undefined, undefined, geoLocData, this);
			return;
		}
		
		// For each "click" add geographicPoint to the modeler's geographicPointsList.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS)
		{
			geoCoord.makeDefaultGeoLocationData();

			var geoCoordsList = this.modeler.getGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
		}
		
		// Excavation.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_EXCAVATIONPOINTS)
		{
			geoCoord.makeDefaultGeoLocationData();

			var excavation = this.modeler.getExcavation();
			var geoCoordsList = excavation.getGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
			geoCoordsList.makeLines(this);
		}
		
		// Tunnel.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_TUNNELPOINTS)
		{
			geoCoord.makeDefaultGeoLocationData();

			var tunnel = this.modeler.getTunnel();
			var geoCoordsList = tunnel.getPathGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
			geoCoordsList.makeLines(this);
		}
		
		// BSpline.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_BSPLINE)
		{
			geoCoord.makeDefaultGeoLocationData();

			if (this.modeler.bSplineCubic3d === undefined)
			{ this.modeler.bSplineCubic3d = new BSplineCubic3D(); }
			
			var bSplineCubic = this.modeler.bSplineCubic3d;
			var geoCoordsList = bSplineCubic.getGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
			geoCoordsList.makeLines(this);
			
		}
		
		// StaticGeometries.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_STATICGEOMETRY)
		{
			// create a "node" & insert into smartTile.***
			var projectId = "AutonomousBus";
			var attributes = {
				"isPhysical"         : true,
				"nodeType"           : "TEST",
				"isReference"        : true,
				"projectFolderName"  : "staticModels",
				"buildingFolderName" : "F4D_AutonomousBus",
				"heading"            : 0,
				"pitch"              : 0,
				"roll"               : 0};
				/*
			var attributes = {
				"isPhysical"         : true,
				"nodeType"           : "TEST",
				"isReference"        : true,
				"projectFolderName"  : "3ds",
				"buildingFolderName" : "F4D_GyeomjaeJeongSeon_del",
				"heading"            : 0,
				"pitch"              : 0,
				"roll"               : 0};
				
			attributes.pitch = 90.0;
			*/
			if (!this.isExistStaticModel('AutonomousBus'))
			{
				this.addStaticModel({
					projectId          : 'AutonomousBus',
					projectFolderName  : 'staticModels',
					buildingFolderName : 'F4D_AutonomousBus'
				});
			}
			
			var nodesMap = this.hierarchyManager.getNodesMap(projectId, undefined);
			var existentNodesCount = Object.keys(nodesMap).length;
			var buildingId = "AutonomousBus_" + existentNodesCount.toString();
			
			this.instantiateStaticModel({
				projectId  : 'AutonomousBus',
				instanceId : buildingId,
				longitude  : geoCoord.longitude,
				latitude   : geoCoord.latitude,
				height     : geoCoord.altitude+20
			});

		}
		// Basic Factory. This is a factory shaped object.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_BASICFACTORY)
		{
			var min = 10;
			var max = 50;
			var minHeight = 2;
			var maxHeight = 8;
			var factoryWidth = 20 + Math.random() * (max - min) + min; 
			var factoryLength = 40 + Math.random() * (max - min) + min;
			var factoryHeight = 13 + Math.random() * (maxHeight - minHeight) + minHeight;
			
			// Test.***
			var strGeoCoord = new GeographicCoord(127.567, 38.123, 0);
			var endGeoCoord = new GeographicCoord(128.567, 39.123, 0);
			var geoCoordSegment = new GeographicCoordSegment(strGeoCoord, endGeoCoord);
			
			var testHeading = GeographicCoordSegment.calculateHeadingAngRadToNorthOfSegment(geoCoordSegment, this)*180/Math.PI;
			var length = GeographicCoordSegment.getLengthInMeters(geoCoordSegment, this);
			var hola = 0;
			
			// Test.******************
			var geoCoord_0 = new GeographicCoord(129.3995, 35.5076, 0);
			var geoCoord_1 = new GeographicCoord(129.3995, 35.5073, 0);
			var geoCoord_2 = new GeographicCoord(129.3986, 35.5075, 0);
			var geoCoord_3 = new GeographicCoord(129.3987, 35.5077, 0);
			var geoCoordsArray = [geoCoord_0, geoCoord_1, geoCoord_2, geoCoord_3];
			var edgeIdxOfDoor = 0;
			var resultObj = BasicFactory.getFactoryDimensionsByGeoCoordsArray(geoCoordsArray, edgeIdxOfDoor, this);
			
			var doorWidth = factoryWidth * 0.8;
			var roofMinHeight = factoryHeight*0.75;
			
			var height = roofMinHeight;
			var wallOptions = [];
			wallOptions.push({
				type        : 'front', // front, rear, left, right
				openingInfo : {width: doorWidth, height: height * 0.6}  // front, rear, left, right
			});

			var options = {
				"hasGround"     : true,
				"roofMinHeight" : factoryHeight*0.75,
				"wallOptions"   : wallOptions
			};
	
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, testHeading, undefined, undefined, geoLocData, this);
			
			// set material for the roof of the factory.
			var materialsManager = this.materialsManager;
			var materialName = "basicFactoryRoof";
			var material = materialsManager.getOrNewMaterial(materialName);
			if (material.diffuseTexture === undefined)
			{ 
				material.diffuseTexture = new Texture(); 
				material.diffuseTexture.textureTypeName = "diffuse";
				material.diffuseTexture.textureImageFileName = "mipoFactoryRoof.jpg"; // Gaia3dLogo.png
				var imagesPath = materialsManager.imagesPath + "//" + material.diffuseTexture.textureImageFileName;
				var flipYTexCoord = true;
				TexturesManager.loadTexture(imagesPath, material.diffuseTexture, this, flipYTexCoord);
			}
			
			// add options.
			if (options === undefined)
			{ options = {}; }
			
			options.roofOptions = {
				"material": material
			};
	
			var factory = new BasicFactory(factoryWidth, factoryLength, factoryHeight, options);
			factory.bHasGround = true;
			factory.geoLocDataManager = geoLocDataManager;
			if (factory.attributes === undefined)
			{ factory.attributes = {}; }
			factory.attributes.isMovable = true;
			this.modeler.addObject(factory);
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_PIPE)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+10, undefined, undefined, undefined, geoLocData, this);
			
			/*
			// Create a Pipe object.***
			var options = {
				"interiorRadius" : 10,
				"exteriorRadius" : 20,
				"height"         : 50,
				"color"          : {
					"r" : 0.2,
					"g" : 0.8, 
					"b" : 0.8,
					"a" : 0.4
				}
			};
			
			var pipe = this.modeler.newPipe(options);
			pipe.geoLocDataManager = geoLocDataManager;
			*/
			var options = {
				height    : 50,
				tubeInfos : [
					{
						"interiorRadius" : 5,
						"exteriorRadius" : 10,
						"color"          : {
							"r" : 0.2,
							"g" : 0.8, 
							"b" : 0.8,
							"a" : 0.4
						}
					}, {
						"interiorRadius" : 10,
						"exteriorRadius" : 15,
						"color"          : {
							"r" : 0.6,
							"g" : 0.3, 
							"b" : 0.8,
							"a" : 0.4
						}
					}, {
						"interiorRadius" : 15,
						"exteriorRadius" : 20,
						"color"          : {
							"r" : 0.4,
							"g" : 0.2, 
							"b" : 0.8,
							"a" : 0.4
						}
					}
				]
			};
			
			var concentricTubes = new ConcentricTubes(options, geoLocDataManager);
			concentricTubes.attributes = {isMovable: true};

			this.modeler.addObject(concentricTubes);
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_SPHERE)
		{
			// make a sphere.
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+50, undefined, undefined, undefined, geoLocData, this);
			
			var options = {};
			var color = new Color();
			color.setRGB(0.9, 0.7, 0.2);
			options.color = color;
			var sphere = new Sphere(options);
			sphere.geoLocDataManager = geoLocDataManager;
			sphere.setRadius(30);
			if (sphere.attributes === undefined)
			{ sphere.attributes = {}; }
			sphere.attributes.isMovable = true;
			this.modeler.addObject(sphere, 15);
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_BOX)
		{
			// make a sphere.
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+50, undefined, undefined, undefined, geoLocData, this);
			
			var options = {};
			var color = new Color();
			color.setRGB(0.9, 0.7, 0.2);
			options.color = color;
			var box = new Box(10, 10, 20, "testBox");
			box.geoLocDataManager = geoLocDataManager;
			box.setOneColor(0.2, 0.5, 0.7, 1.0);
			if (box.attributes === undefined)
			{ box.attributes = {}; }
			box.attributes.isMovable = true;
			this.modeler.addObject(box, 15);
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_CLIPPINGBOX)
		{
			// make a clipping box.
			if (this.modeler.clippingBox === undefined)
			{
				var geoLocDataManager = geoCoord.getGeoLocationDataManager();
				var geoLocData = geoLocDataManager.newGeoLocationData("noName");
				geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+50, undefined, undefined, undefined, geoLocData, this);
				
				var options = {};
				var color = new Color();
				color.setRGB(0.9, 0.7, 0.2);
				options.color = color;
				var box = new ClippingBox(40, 40, 60, "testBox");
				box.geoLocDataManager = geoLocDataManager;
				box.setOneColor(0.2, 0.5, 0.7, 0.0);
				if (box.attributes === undefined)
				{ box.attributes = {}; }
				box.attributes.isMovable = true;
				this.modeler.addObject(box, 15);
				//this.modeler.clippingBox = box;
			}
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_CONCENTRICTUBES)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+50, undefined, undefined, undefined, geoLocData, this);
			
			var options = {};
			var color = new Color();
			color.setRGB(0.9, 0.7, 0.2);
			options.color = color;
			
			var options = {height: 30, tubeInfos: []};
			var tubeInfo = {
				interiorRadius : 10,
				exteriorRadius : 15,
				color          : {r: 0.2, g: 0.5, b: 0.9, a: 0.5}
			};
			options.tubeInfos.push(tubeInfo);
			var tubeInfo = {
				interiorRadius : 20,
				exteriorRadius : 30,
				color          : {r: 0.8, g: 0.2, b: 0.5, a: 0.5}
			};
			options.tubeInfos.push(tubeInfo);
			
			var concentricTube = new ConcentricTubes(options, geoLocDataManager);
			concentricTube.setOneColor(0.2, 0.5, 0.7, 1.0);
			if (concentricTube.attributes === undefined)
			{ concentricTube.attributes = {}; }
			concentricTube.attributes.isMovable = true;
			
			
	
			this.modeler.addObject(concentricTube, 15);
			
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_TUBE)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+50, undefined, undefined, undefined, geoLocData, this);
			
			var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
			
			var tube = new Tube(10, 20, 30, options);
			tube.setOneColor(0.2, 0.5, 0.7, 1.0);
			tube.geoLocDataManager = geoLocDataManager;
			if (tube.attributes === undefined)
			{ tube.attributes = {}; }
			tube.attributes.isMovable = true;
			
			this.modeler.addObject(tube, 15);
			
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_FREECONTOURWALL)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+50, undefined, undefined, undefined, geoLocData, this);
			
			var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
			
			// Create 4(or more) points of contour.
			var semiWidth = 10.0;
			var semiLength = 30.0;
			var points2dArray = [];
			var point2d = new Point2D(-semiWidth, -semiLength);
			points2dArray.push(point2d);
			point2d = new Point2D(semiWidth, -semiLength);
			points2dArray.push(point2d);
			point2d = new Point2D(semiWidth, semiLength);
			points2dArray.push(point2d);
			point2d = new Point2D(-semiWidth, semiLength);
			points2dArray.push(point2d);
			
			options.points2dArray = points2dArray;
			options.height = 10;
			var freeContourWall = new TestFreeContourWallBuilding(options);
			freeContourWall.setOneColor(0.2, 0.5, 0.7, 1.0);
			freeContourWall.geoLocDataManager = geoLocDataManager;
			if (freeContourWall.attributes === undefined)
			{ freeContourWall.attributes = {}; }
			freeContourWall.attributes.isMovable = true;
			
			this.modeler.addObject(freeContourWall, 15);
			
		}
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_CYLYNDER)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+40, undefined, undefined, undefined, geoLocData, this);
			
			var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
			
			var cylinder = new GolfHoleFlag(0.3, 20, options);
			//var cylinder = new Cylinder(10, 20, options);
			//cylinder.setOneColor(0.2, 0.5, 0.7, 1.0);
			cylinder.geoLocDataManager = geoLocDataManager;
			if (cylinder.attributes === undefined)
			{ cylinder.attributes = {}; }
			cylinder.attributes.isMovable = true;
			
			this.modeler.addObject(cylinder, 15);
		}
	}
	
};

MagoManager.prototype.cameraChanged = function(e) 
{
	this.emit(MagoManager.EVENT_TYPE.CAMERACHANGED, {
		type      : MagoManager.EVENT_TYPE.CAMERACHANGED,
		timestamp : new Date()
	});
};

MagoManager.prototype.cameraMoveStart = function() 
{
	this.emit(MagoManager.EVENT_TYPE.CAMERAMOVESTART, {
		type      : MagoManager.EVENT_TYPE.CAMERAMOVESTART,
		timestamp : new Date()
	});
};

MagoManager.prototype.cameraMoveEnd = function() 
{
	this.emit(MagoManager.EVENT_TYPE.CAMERAMOVEEND, {
		type      : MagoManager.EVENT_TYPE.CAMERAMOVEEND,
		timestamp : new Date()
	});
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionLeftDown = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseLeftDown = true;
	//this.isCameraMoving = true;
	
	MagoWorld.updateMouseStartClick(mouseX, mouseY, this);
	/*
	// Test.**********************************************************************************************************************
	var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		if (currObjectSelected)
		{
			// check if is a cuttingPlane.***
			if (currObjectSelected instanceof CuttingPlane)
			{
				var mouseAction = this.sceneState.mouseAction;
				mouseAction.claculateStartPositionsAux(this);
			}
		}
	}
	*/
	// End test.-------------------------------------------------------------------------------------------------------------------
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.saveHistoryObjectMovement = function(refObject, node) 
{
	var changeHistory = new ChangeHistory();
	var refMove = changeHistory.getReferenceObjectAditionalMovement();
	var refMoveRelToBuilding = changeHistory.getReferenceObjectAditionalMovementRelToBuilding();
	
	if (refObject.moveVector === undefined)
	{ refObject.moveVector = new Point3D(); }
	
	if (refObject.moveVectorRelToBuilding === undefined)
	{ refObject.moveVectorRelToBuilding = new Point3D(); }
	
	refMove.set(refObject.moveVector.x, refObject.moveVector.y, refObject.moveVector.z);
	refMoveRelToBuilding.set(refObject.moveVectorRelToBuilding.x, refObject.moveVectorRelToBuilding.y, refObject.moveVectorRelToBuilding.z);
	if (node === undefined)
	{ return; }

	var projectId = node.data.projectId;
	var dataKey = node.data.nodeId;
	var objectIndex = refObject._id;
	
	changeHistory.setProjectId(projectId);
	changeHistory.setDataKey(dataKey);
	changeHistory.setObjectIndexOrder(objectIndex);
	MagoConfig.saveMovingHistory(projectId, dataKey, objectIndex, changeHistory);
};



/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionMiddleDown = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseMiddleDown = true;
	this.isCameraMoving = true;
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionMiddleUp = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	this.isCameraMoving = false;
	this.mouseMiddleDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane = undefined;
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.setCameraMotion(false);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionRightDown = function(mouseX, mouseY) 
{
	/*
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseRightDown = true;
	this.isCameraMoving = true;
	*/
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionRightUp = function(mouseX, mouseY) 
{
	/*
	this.isCameraMoving = false;
	this.setCameraMotion(false);
	*/
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionMove = function(mouseX, mouseY) 
{
	if (this.mouseLeftDown) 
	{
		this.manageMouseDragging(mouseX, mouseY);
	}
	else if (this.mouseMiddleDown) 
	{
		this.sceneState.camera.setDirty(true);
	}
	else if (this.mouseRightDown) 
	{
		this.sceneState.camera.setDirty(true);
	}
	else
	{
		this.mouseDragging = false;
		this.setCameraMotion(false);
		if (this.mouseMiddleDown)
		{
			this.isCameraMoving = true;
		}
		
	}
};


/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
MagoManager.prototype.manageMouseDragging = function(mouseX, mouseY) 
{
	this.sceneState.camera.setDirty(true);
	
	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	
	// distinguish 2 modes.******************************************************
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // blocks move.***
	{
		if (this.buildingSelected !== undefined) 
		{
			// 1rst, check if there are objects to move.***
			if (this.mustCheckIfDragging) 
			{
				if (this.isDragging()) 
				{
					this.mouseDragging = true;
					this.setCameraMotion(false);
				}
				this.mustCheckIfDragging = false;
			}
			// Display geoLocationData while moving building.***
			var nodeOwner = this.buildingSelected.nodeOwner;
			if (nodeOwner === undefined)
			{ return; }

			var geoLocDataManager = nodeOwner.data.geoLocDataManager;
			if (geoLocDataManager === undefined)
			{ return; }

			var geoLocation = geoLocDataManager.getGeoLocationData(0);
			if (geoLocation === undefined)
			{ return; }

			var geographicCoords = geoLocation.geographicCoord;
			if (geographicCoords === undefined)
			{ return; }
			
			movedDataCallback(	MagoConfig.getPolicy().geo_callback_moveddata,
				nodeOwner.data.projectId,
				nodeOwner.data.nodeId,
				null,
				geographicCoords.latitude,
				geographicCoords.longitude,
				geographicCoords.altitude,
				geoLocation.heading,
				geoLocation.pitch,
				geoLocation.roll);
								
		}
		else 
		{
			this.isCameraMoving = true; // if no object is selected.***
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		if (this.objectSelected !== undefined) 
		{
			// 1rst, check if there are objects to move.***
			if (this.mustCheckIfDragging) 
			{
				if (this.isDragging()) 
				{
					this.mouseDragging = true;
					this.setCameraMotion(false);
				}
				this.mustCheckIfDragging = false;
			}
		}
		else 
		{
			this.isCameraMoving = true; // if no object is selected.***
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS) 
	{
		var currSelected = this.selectionManager.getSelectedGeneral();
		if (currSelected)
		{
			var className = currSelected.constructor.name;
			if (className === "GeographicCoord")
			{
				// 1rst, check if there are objects to move.***
				if (this.mustCheckIfDragging) 
				{
					if (this.isDragging()) 
					{
						this.mouseDragging = true;
						this.setCameraMotion(false);
					}
					this.mustCheckIfDragging = false;
				}
			}
		}
	}

	
	// General objects.***
	if (!this.mouseDragging) 
	{
		if (this.mustCheckIfDragging) 
		{
			if (this.isDragging()) 
			{
				this.mouseDragging = true;
				this.setCameraMotion(false);
			}
			this.mustCheckIfDragging = false;
		}
	}
	
	//---------------------------------------------------------------------------------
	this.isCameraMoving = true; // test.***
	if (this.mouseDragging) 
	{
		this.moveSelectedObjectAsimetricMode(this.sceneState.gl);
	}
};

/**
 * Moves an object.
 * @param {WebGLRenderingContext} gl WebGLRenderingContext.
 */
MagoManager.prototype.moveSelectedObjectGeneral = function(gl, object) 
{
	if (object === undefined)
	{ return; }

	if (object instanceof ObjectMarker)
	{ return; }

	object = object.getRootOwner();

	var attributes = object.attributes;
	if (attributes === undefined)
	{ return; }

	var isMovable = attributes.isMovable;
	if (isMovable === undefined || isMovable === false)
	{ return; }
	
	var geoLocDataManager = object.getGeoLocDataManager();
	if (geoLocDataManager === undefined)
	{ return; }
	
	var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
	
	var mouseAction = this.sceneState.mouseAction;

	
	if (this.selObjMovePlaneCC === undefined) 
	{
		this.selObjMovePlaneCC = new Plane();
		// calculate the pixelPos in camCoord.
		var geoLocMatrix = geoLocationData.geoLocMatrix;
		var mvMat = this.sceneState.modelViewMatrix;
		var mvMatRelToEye = this.sceneState.modelViewRelToEyeMatrix;
		var pixelPosCC = mvMat.transformPoint3D(mouseAction.strWorldPoint, undefined);
		
		var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
		var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeYaxisWC, undefined);
		
		var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
		var globeZaxisCC = mvMatRelToEye.transformPoint3D(globeZaxisWC, undefined);
		
		if (attributes.movementInAxisZ)
		{
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
		}
		else 
		{
			// movement in plane XY.
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeZaxisCC.x, globeZaxisCC.y, globeZaxisCC.z); 
		}
	}

	
	if (this.lineCC === undefined)
	{ this.lineCC = new Line(); }
	var camRay = ManagerUtils.getRayCamSpace(this.mouse_x, this.mouse_y, camRay, this);
	this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);
	
	
	// Calculate intersection cameraRay with planeCC.
	var intersectionPointCC = new Point3D();
	intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
	//------------------------------------------------------------------------------------------------

	var mvMat = this.sceneState.modelViewMatrixInv;
	var intersectionPointWC = mvMat.transformPoint3D(intersectionPointCC, intersectionPointWC);

	
	// register the movement.***
	if (!this.thereAreStartMovePoint) 
	{
		var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);
		this.thereAreStartMovePoint = true;
		
		var buildingGeoCoord = geoLocationData.geographicCoord;
		this.startGeoCoordDif = new GeographicCoord(cartographic.longitude-buildingGeoCoord.longitude, cartographic.latitude-buildingGeoCoord.latitude, cartographic.altitude-buildingGeoCoord.altitude);

	}
	else 
	{
		var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);

		var difX = cartographic.longitude - this.startGeoCoordDif.longitude;
		var difY = cartographic.latitude - this.startGeoCoordDif.latitude;
		var difZ = cartographic.altitude - this.startGeoCoordDif.altitude;
		
		var newLongitude = difX;
		var newlatitude = difY;
		var newAltitude = difZ;
		
		if (Math.abs(newAltitude) > 50)
		{ var hola = 0; }
		
		// Must check if there are restrictions.***
		var attributes = object.attributes;
		
		if (attributes.minAltitude !== undefined)
		{
			if (newAltitude < attributes.minAltitude)
			{ newAltitude = attributes.minAltitude; }
		}
		
		if (attributes.maxAltitude !== undefined)
		{
			if (newAltitude > attributes.maxAltitude)
			{ newAltitude = attributes.maxAltitude; }
		}
		
		if (attributes && attributes.movementRestriction)
		{
			var movementRestriction = attributes.movementRestriction;
			if (movementRestriction)
			{
				var movementRestrictionType = movementRestriction.restrictionType;
				var movRestrictionElem = movementRestriction.element;
				if (movRestrictionElem && movRestrictionElem.constructor.name === "GeographicCoordSegment")
				{
					// restriction.***
					var geoCoordSegment = movRestrictionElem;
					var newGeoCoord = new GeographicCoord(newLongitude, newlatitude, 0.0);
					var projectedCoord = GeographicCoordSegment.getProjectedCoordToLine(geoCoordSegment, newGeoCoord, undefined);
					
					// check if is inside.***
					if (!GeographicCoordSegment.intersectionWithGeoCoord(geoCoordSegment, projectedCoord))
					{
						var nearestGeoCoord = GeographicCoordSegment.getNearestGeoCoord(geoCoordSegment, projectedCoord);
						newLongitude = nearestGeoCoord.longitude;
						newlatitude = nearestGeoCoord.latitude;
					}
					else 
					{
						newLongitude = projectedCoord.longitude;
						newlatitude = projectedCoord.latitude;
					}
				}
			}
		}
		if (attributes && attributes.hasStaticModel)
		{
			var projectId = attributes.projectId;
			var dataKey = attributes.instanceId;
			if (!defined(projectId))
			{
				return false;
			}
			if (!defined(dataKey))
			{
				return false;
			}
			var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
			if (node !== undefined)
			{
				node.changeLocationAndRotation(newlatitude, newLongitude, 0, attributes.f4dHeading, 0, 0, this);
			}
		}
		
		if (attributes.movementInAxisZ)
		{
			geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, newAltitude, undefined, undefined, undefined, geoLocationData, this);
		}
		else 
		{
			geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
		}

	}
	
	object.moved();
};


/**
 * Moves an object.
 * @param {WebGLRenderingContext} gl WebGLRenderingContext.
 */
MagoManager.prototype.moveSelectedObjectAsimetricMode = function(gl) 
{
	var currSelected = this.selectionManager.getSelectedGeneral();
	var currSelectedClassName = "";
	if (currSelected)
	{ currSelectedClassName = currSelected.constructor.name; }
	
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // buildings move.***
	{
		if (this.selectionManager.currentNodeSelected === undefined)
		{ return; }
		
		var geoLocDataManager = this.selectionManager.currentNodeSelected.getNodeGeoLocDataManager();
		var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
		
		var mouseAction = this.sceneState.mouseAction;
	
		var attributes = {};
		
		if (this.selObjMovePlaneCC === undefined) 
		{
			this.selObjMovePlaneCC = new Plane();
			// calculate the pixelPos in camCoord.
			var geoLocMatrix = geoLocationData.geoLocMatrix;
			var mvMat = this.sceneState.modelViewMatrix;
			var mvMatRelToEye = this.sceneState.modelViewRelToEyeMatrix;
			var pixelPosCC = mvMat.transformPoint3D(mouseAction.strWorldPoint, undefined);
			
			var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
			var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeYaxisWC, undefined);
			
			var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
			var globeZaxisCC = mvMatRelToEye.transformPoint3D(globeZaxisWC, undefined);
			
			if (attributes.movementInAxisZ)
			{
				this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
			}
			else 
			{
				// movement in plane XY.
				this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeZaxisCC.x, globeZaxisCC.y, globeZaxisCC.z); 
			}
		}

		if (this.lineCC === undefined)
		{ this.lineCC = new Line(); }
		var camRay = ManagerUtils.getRayCamSpace(this.mouse_x, this.mouse_y, camRay, this);
		this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);
		
		
		// Calculate intersection cameraRay with planeCC.
		var intersectionPointCC = new Point3D();
		intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
		//------------------------------------------------------------------------------------------------

		var mvMat = this.sceneState.modelViewMatrixInv;
		var intersectionPointWC = mvMat.transformPoint3D(intersectionPointCC, intersectionPointWC);
	
		// register the movement.***
		if (!this.thereAreStartMovePoint) 
		{
			var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);
			this.thereAreStartMovePoint = true;
			
			var buildingGeoCoord = geoLocationData.geographicCoord;
			this.startGeoCoordDif = new GeographicCoord(cartographic.longitude-buildingGeoCoord.longitude, cartographic.latitude-buildingGeoCoord.latitude, cartographic.altitude-buildingGeoCoord.altitude);
		}
		else 
		{
			var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);

			var difX = cartographic.longitude - this.startGeoCoordDif.longitude;
			var difY = cartographic.latitude - this.startGeoCoordDif.latitude;
			var difZ = cartographic.altitude - this.startGeoCoordDif.altitude;
			
			var newLongitude = difX;
			var newlatitude = difY;
			var newAltitude = difZ;

			if (attributes.movementInAxisZ)
			{
				//geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, newAltitude, undefined, undefined, undefined, geoLocationData, this);
				this.changeLocationAndRotationNode(this.selectionManager.currentNodeSelected, undefined, undefined, newAltitude, undefined, undefined, undefined);
			}
			else 
			{
				//geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
				this.changeLocationAndRotationNode(this.selectionManager.currentNodeSelected, newlatitude, newLongitude, undefined, undefined, undefined, undefined);
			}
			
			this.displayLocationAndRotation(this.buildingSelected);
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		if (this.objectSelected === undefined)
		{ return; }
	
		if (this.objectSelected.constructor.name !== "NeoReference")
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			this.selObjMovePlane = this.calculateSelObjMovePlaneAsimetricMode(gl, this.mouse_x, this.mouse_y, this.selObjMovePlane);
		}
		
		var geoLocDataManager = this.selectionManager.currentNodeSelected.getNodeGeoLocDataManager();

		// world ray = camPos + lambda*camDir.***
		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.lineSC = ManagerUtils.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC, this); // rayWorldSpace.***
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();
		var tMatrixInv = buildingGeoLocation.getTMatrixInv();
		camPosBuilding = tMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		camDirBuilding = tMatrixInv.rotatePoint3D(this.lineSC.direction, camDirBuilding);
	
		// now, intersect building_ray with the selObjMovePlane.***
		var line = new Line();
		line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z,       camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);// original.***

		var intersectionPoint = new Point3D();
		intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);

		//the movement of an object must multiply by buildingRotMatrix.***
		if (this.objectSelected.moveVectorRelToBuilding === undefined)
		{ this.objectSelected.moveVectorRelToBuilding = new Point3D(); }
	
		// move vector rel to building.
		if (!this.thereAreStartMovePoint) 
		{
			this.startMovPoint = intersectionPoint;
			this.startMovPoint.add(-this.objectSelected.moveVectorRelToBuilding.x, -this.objectSelected.moveVectorRelToBuilding.y, -this.objectSelected.moveVectorRelToBuilding.z);
			this.thereAreStartMovePoint = true;
		}
		else 
		{
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;

			this.objectSelected.moveVectorRelToBuilding.set(difX, difY, difZ);
			this.objectSelected.moveVector = buildingGeoLocation.tMatrix.rotatePoint3D(this.objectSelected.moveVectorRelToBuilding, this.objectSelected.moveVector); 
		}
		
		var projectId = this.selectionManager.currentNodeSelected.data.projectId;
		var data_key = this.selectionManager.currentNodeSelected.data.nodeId;
		var objectIndexOrder = this.objectSelected._id;
		
		MagoConfig.deleteMovingHistoryObject(projectId, data_key, objectIndexOrder);
		this.objectMoved = true; // this provoques that on leftMouseUp -> saveHistoryObjectMovement
		
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS && currSelectedClassName === "GeographicCoord") 
	{
		// Move the current geographic point selected.***
		if (currSelected)
		{
			//if (currSelectedClassName === "GeographicCoord")
			{
				var geoLocDataManager = currSelected.getGeoLocationDataManager();
				var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
				
				var geoCoord;
				var strWorldPoint;
				if (this.configInformation.geo_view_library === Constant.CESIUM)
				{
					var camera = this.scene.frameState.camera;
					var scene = this.scene;
					var ray = camera.getPickRay(new Cesium.Cartesian2(this.mouse_x, this.mouse_y));
					strWorldPoint = scene.globe.pick(ray, scene);
					geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
				}
				else 
				{
					var mouseAction = this.sceneState.mouseAction;
					strWorldPoint = mouseAction.strWorldPoint;
					geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
				}
				
				currSelected.setLonLatAlt(geoCoord.longitude, geoCoord.latitude, undefined); // no set altitude.***
				
				var geoLocDataManager = currSelected.getGeoLocationDataManager();
				var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
				geoLocData = ManagerUtils.calculateGeoLocationData(currSelected.longitude, currSelected.latitude, currSelected.altitude, undefined, undefined, undefined, geoLocData, this);
				
				// Now, must check the moved object's owner.***
				var owner = currSelected.owner;
				if (owner)
				{
					// 1rst, check if is a geoCoordsList.***
					if (owner.constructor.name === "GeographicCoordsList")
					{
						owner.makeLines(this);
					}
					
					var owner2 = owner.owner;
					if (owner2)
					{
						if (owner2.constructor.name === "Excavation")
						{
							owner2.remakeExtrudeObject(this);
						}
						else if (owner2.constructor.name === "Tunnel")
						{
							owner2.remakeMesh(this);
						}
					}
				}
			}
		}

	}
	else
	{
		if (this.weatherStation)
		{
			// Test. Check if there are cuttingPlanes to move.***
			var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
			if (selGeneralObjects)
			{
				var currObjectSelected = selGeneralObjects.currentSelected;
				if (currObjectSelected)
				{
					// check if is a cuttingPlane.***
					if (currObjectSelected instanceof CuttingPlane)
					{
						// Move the cuttingPlane.***
						var geoLocDataManager = currObjectSelected.geoLocDataManager;
						var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
						
						var mouseAction = this.sceneState.mouseAction;
						
						// New Test.*******************************************************
						var camRay = ManagerUtils.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, undefined, this); // rayWorldSpace.***
						var strWorldPoint = mouseAction.strWorldPointAux; // original.***
						////var strWorldPoint = mouseAction.strWorldPoint;
						if (strWorldPoint)
						{
							var strEarthRadius = strWorldPoint.getModul();
							
							var curWorldPosAux;
							curWorldPosAux = this.globe.intersectionLineWgs84(camRay, curWorldPosAux, strEarthRadius);
							if (curWorldPosAux)
							{
								var curWorldPointAux = new Point3D(curWorldPosAux[0], curWorldPosAux[1], curWorldPosAux[2]);
								var curLocation = ManagerUtils.pointToGeographicCoord(curWorldPointAux, undefined, this);
								var strLocation = mouseAction.strLocationAux;
								var objectGeoLoc = geoLocationData.geographicCoord;
								
								var difLocation = new GeographicCoord();
								difLocation.setLonLatAlt(curLocation.longitude - strLocation.longitude, curLocation.latitude - strLocation.latitude, curLocation.altitude - strLocation.altitude);
								var newLongitude = objectGeoLoc.longitude + difLocation.longitude;
								var newlatitude = objectGeoLoc.latitude + difLocation.latitude;
								
								geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
								mouseAction.strLocationAux.setLonLatAlt(curLocation.longitude, curLocation.latitude, curLocation.altitude);
							}
						}
					}
				}
			}
		}
		var selectionManager = this.selectionManager;
		var generalObjectSelected = selectionManager.getSelectedGeneral();
		if (generalObjectSelected)
		{
			// Move the object.***
			this.moveSelectedObjectGeneral(gl, generalObjectSelected);
		}
	}
};

MagoManager.prototype.test_renderDepth_objectSelected = function(currObjectSelected) 
{
	// Test function. Provisional.***
	// Test function. Provisional.***
	// Test function. Provisional.***
	// Test. Render depth only for the selected object.***************************
	var gl = this.sceneState.gl;
	
	if (this.depthFboAux === undefined)
	{
		this.depthFboAux = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	}
	if (this.sceneState.drawingBufferWidth[0] !== this.depthFboAux.width[0] || this.sceneState.drawingBufferHeight[0] !== this.depthFboAux.height[0])
	{
		// move this to onResize.***
		this.depthFboAux.deleteObjects(gl);
		this.depthFboAux = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	}
	this.depthFboAux.bind(); 
	
	if (this.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	gl.disable(gl.BLEND);
	
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	// Now, renderDepth the selected object. Fix the frustumFar for adequate precision on depthPacking.***
	var shader = this.postFxShadersManager.getShader("modelRefDepth"); 
	shader.useProgram();
	shader.bindUniformGenerals();
	shader.enableVertexAttribArray(shader.position3_loc);
		
	var geoLocDataManager = currObjectSelected.geoLocDataManager;
	var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
		
	// test: in depth, set frustumFar = 1000000000(100M).***
	var frustumFarLoc = shader.uniformsMapGeneral.frustumFar.uniformLocation;
	gl.uniform1f(frustumFarLoc, new Float32Array([100000000.0]));
			
	var renderType = 0;
	//this.weatherStation.test_renderCuttingPlanes(this, renderType);
			
	geoLocationData.bindGeoLocationUniforms(gl, shader);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	currObjectSelected.render(this, shader, renderType);
			
	
	this.depthFboAux.unbind(); 
	// End test.------------------------------------------------------------------
};


/**
 * Frustum 안의 VisibleOctree 를 검색하여 currentVisibleOctreesControler 를 준비
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 * @param {VisibleObjectsController} visibleObjControlerOctrees 
 * @param {any} lod 
 */
MagoManager.prototype.getRenderablesDetailedNeoBuildingAsimetricVersion = function(gl, node, globalVisibleObjControlerOctrees, lod) 
{
	var data = node.data;
	var neoBuilding = data.neoBuilding;
	var currentLod = data.currentLod;
	
	// chaek if the neoBuilding has availableLod_0.***
	if (neoBuilding === undefined || neoBuilding.octree === undefined) { return false; }
	
	// Check if for the current lod, the building is modelRefType.***
	var lodBuildingData = neoBuilding.getLodBuildingData(data.currentLod);
	if (lodBuildingData === undefined)
	{ return false; }
	
	if (!lodBuildingData.isModelRef)
	{ return true; } // return true, bcos the caller pops the building from the "visibleObjControlerNodes" if return false.***

	var rootGeoLocDataManager = node.getNodeGeoLocDataManager();
	var rootGeoLoc = rootGeoLocDataManager.getCurrentGeoLocationData();
	
	//var nodeGeoLocation = geoLocDataManager.getCurrentGeoLocationData(); // original.***
	var nodeGeoLocation = rootGeoLocDataManager.getCurrentGeoLocationData();
	if (nodeGeoLocation === undefined)
	{ return false; }

	// Create if necessary, the visibleObjectsControler of the node.***
	if (data.currentVisibleOctreesControler === undefined)
	{ data.currentVisibleOctreesControler = new VisibleObjectsController(); }	

	var distLod0 = this.magoPolicy.getLod0DistInMeters();
	var distLod1 = this.magoPolicy.getLod1DistInMeters();
	var distLod2 = this.magoPolicy.getLod2DistInMeters();
	var distLod3 = this.magoPolicy.getLod3DistInMeters();
	var distLod4 = this.magoPolicy.getLod4DistInMeters();
	var distLod5 = this.magoPolicy.getLod5DistInMeters();

	var find = false;
	if (data.myCameraRelative === undefined)
	{ data.myCameraRelative = new Camera(); }
	
	data.myCameraRelative.frustum.copyParametersFrom(this.myCameraSCX.bigFrustum);
	data.myCameraRelative = nodeGeoLocation.getTransformedRelativeCamera(this.sceneState.camera, data.myCameraRelative);
	//var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(data.myCameraRelative.position.x, data.myCameraRelative.position.y, data.myCameraRelative.position.z); // old.***
	
	data.currentVisibleOctreesControler.clear();
	
	if (lod === 2)
	{
		// In this case is not necessary calculate the frustum planes.
		neoBuilding.octree.extractLowestOctreesByLOD(data.currentVisibleOctreesControler, globalVisibleObjControlerOctrees, this.boundingSphere_Aux,
			data.myCameraRelative.position, distLod0, distLod1, distLod5);
		find = true;
	}
	else 
	{
		// Must calculate the frustum planes.
		data.myCameraRelative.calculateFrustumsPlanes();
		
		// 1rst, check if there are octrees very close.
		var frustum0 = data.myCameraRelative.bigFrustum;
		find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	frustum0, data.currentVisibleOctreesControler, globalVisibleObjControlerOctrees, this.boundingSphere_Aux,
			data.myCameraRelative.position, distLod0, distLod1, distLod2*100);
	}

	if (!find) 
	{
		// If the building is far to camera, then delete it.
		if (data.distToCam > 100) // default: 60.***
		{ this.processQueue.putNodeToDeleteModelReferences(node, 1); }
		
		// TODO: must check if some part of the building is in parseQueue.***
		return false;
	}
	else 
	{
		this.processQueue.eraseNodeToDeleteModelReferences(node);
	}
	
	return true;
};


/**
 * LOD0, LOD1 에 대한 F4D ModelData, ReferenceData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.manageQueue = function() 
{
	var gl = this.sceneState.gl;
	
	
	// 1rst, manage deleting queue.***************
	this.processQueue.manageDeleteQueue(this);
	
	
	
	// 2nd, parse pendent data.**********************************************************************************
	// is desirable to parse octrees references ordered by the current eye distance.
	// in the "visibleObjControlerOctrees" there are the octrees sorted by distance, so must use it.
	this.parseQueue.initCounters();
	
	// parse octrees lod0 & lod1 references.***
	this.parseQueue.parseArrayOctreesLod0References(this.visibleObjControlerOctrees.currentVisibles0, this);
	this.parseQueue.parseArrayOctreesLod0References(this.visibleObjControlerOctrees.currentVisibles1, this);


	// parse octrees lod0 & lod1 models.***
	this.parseQueue.parseArrayOctreesLod0Models(this.visibleObjControlerOctrees.currentVisibles0, this);
	this.parseQueue.parseArrayOctreesLod0Models(this.visibleObjControlerOctrees.currentVisibles1, this);
	
	
	// parse octrees lod2 (lego).***
	this.parseQueue.parseArrayOctreesLod2Legos(gl, this.visibleObjControlerOctrees.currentVisibles2, this);

	// parse PCloud octree.***
	this.parseQueue.parseArrayOctreesPCloud(gl, this.visibleObjControlerOctrees.currentVisiblesAux, this);
	this.parseQueue.parseArrayOctreesPCloudPartition(gl, this.visibleObjControlerOctrees.currentVisiblesAux, this);

	// parse skin-lego.***
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles0, this);
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles2, this);
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles3, this);
	
	// parse multiBuildings.
	this.parseQueue.parseMultiBuildings(gl, this.visibleObjControlerNodes.currentVisibles0, this);
	this.parseQueue.parseMultiBuildings(gl, this.visibleObjControlerNodes.currentVisibles2, this);
	this.parseQueue.parseMultiBuildings(gl, this.visibleObjControlerNodes.currentVisibles3, this);

	// parse TinTerrain.***
	var tinTerrain;
	var parsedsCount = 0;
	for (var key in this.parseQueue.tinTerrainsToParseMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.parseQueue.tinTerrainsToParseMap, key))
		{
			var tinTerrain = this.parseQueue.tinTerrainsToParseMap[key];
			if (tinTerrain !== undefined)
			{
				if (this.parseQueue.eraseTinTerrainToParse(tinTerrain)) // check if is inside of the queue to parse.***
				{
					tinTerrain.parseData(tinTerrain.dataArrayBuffer);
					parsedsCount++;
				}
			}
			
			if (parsedsCount > 1)
			{ break; }
		}
	}
	/*
	var visibleTilesArray = this.tinTerrainManager.visibleTilesArray;
	var visiblesTilesCount = visibleTilesArray.length;
	for(var i=0; i<visiblesTilesCount; i++)
	{
		tinTerrain = visibleTilesArray[i];
		if (tinTerrain !== undefined)
		{
			if (this.parseQueue.eraseTinTerrainToParse(tinTerrain)) // check if is inside of the queue to parse.***
			{
				tinTerrain.parseData(tinTerrain.dataArrayBuffer);
			}
		}
	}
	*/
	
	
};

/**
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistancePointsCloudType = function(gl, globalVisibleObjControlerOctrees, fileRequestExtraCount) 
{
	var lod2DataInQueueCount = Object.keys(this.loadQueue.lod2PCloudDataMap).length;
	if (lod2DataInQueueCount > 5)
	{ return; }
	
	var extraCount = fileRequestExtraCount;
		
	var currentVisibles = globalVisibleObjControlerOctrees.getAllVisibles();
	//var currentVisibles = globalVisibleObjControlerOctrees.currentVisiblesAux;

	if (currentVisibles === undefined)
	{ return; }

	var geometryDataPath = this.readerWriter.geometryDataPath;
	var projectFolderName;
	var neoBuilding;
	var buildingFolderName;

	// LOD2
	// Check if the lod2lowestOctrees must load and parse data
	var lowestOctree;
	for (var i=0, length = currentVisibles.length; i<length; i++) 
	{	
		if (this.fileRequestControler.isFullPlus(extraCount))	
		{ return; }
		
		lowestOctree = currentVisibles[i];
		
		if (lowestOctree.octree_number_name === undefined)
		{ continue; }
		
		if (lowestOctree.lego === undefined) 
		{
			lowestOctree.lego = new Lego();
			lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
			lowestOctree.lego.legoKey = lowestOctree.octreeKey + "_lego";
		}
	
		neoBuilding = lowestOctree.neoBuildingOwner;
		if (neoBuilding === undefined)
		{ continue; }
	
		var projectDataType = neoBuilding.metaData.projectDataType;
		
		if (projectDataType !== undefined && projectDataType === 4) // projectDataType = 4 (pointsCloudType building).***
		{
			projectFolderName = neoBuilding.projectFolderName;
			buildingFolderName = neoBuilding.buildingFileName;

			if (lowestOctree.lego.fileLoadState === CODE.fileLoadState.READY)
			{
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var references_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/References";
				var filePathInServer = references_folderPath + "/" + subOctreeNumberName + "_Ref";
				this.loadQueue.putLod2PCloudData(lowestOctree, filePathInServer, undefined, undefined, 0);

			}
			
			if (Object.keys(this.loadQueue.lod2PCloudDataMap).length > 5)
			{ return; }
		}
	} 
};

/**
 * LOD0, LOD1 에 대한 F4D ModelData, ReferenceData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistance = function(gl, globalVisibleObjControlerOctrees) 
{
	if (this.readerWriter.referencesList_requested > 5)
	{ return; }

	// LOD0 & LOD1
	// Check if the lod0lowestOctrees, lod1lowestOctrees must load and parse data
	var currentVisibleOctrees = [].concat(globalVisibleObjControlerOctrees.currentVisibles0, globalVisibleObjControlerOctrees.currentVisibles1);
	var lowestOctree;
	this.thereAreUrgentOctrees = false;

	// now, prepare the ocree normally.
	var maxFilesLoad = 2;
	var filesLoadCounter = 0;
	
	for (var i=0, length = currentVisibleOctrees.length; i<length; i++) 
	{
		lowestOctree = currentVisibleOctrees[i];
		var neoBuilding = lowestOctree.neoBuildingOwner;
		var version = neoBuilding.getHeaderVersion();
		
		// Check if the lod2 is modelRef type data.
		var lodBuildingData = neoBuilding.getLodBuildingData(2);
		if (lodBuildingData.isModelRef === true)
		{
			// 1rst, check if lod2 is loaded. If lod2 is no loaded yet, then load first lod2.***
			if (this.readerWriter.octreesSkinLegos_requested < 5)
			{
				if (lowestOctree.lego === undefined || !lowestOctree.lego.isReadyToRender())
				{
					lowestOctree.prepareSkinData(this);
				}
			}
		}

		if (this.readerWriter.referencesList_requested < 5)
		{
			if (lowestOctree.neoReferencesMotherAndIndices === undefined || !lowestOctree.neoReferencesMotherAndIndices.isReadyToRender())
			{
				lowestOctree.prepareModelReferencesListData(this);
			}
			else 
			{
				if (version === "0.0.2")
				{
					// This is a no used partitionsBlocksLists version. Delete it.
					var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList; 
					if (blocksList)
					{ blocksList.prepareData(this, lowestOctree); }
				}
			}
		}
		

		if (this.readerWriter.referencesList_requested > 5)
		{ return; }
		
		if (filesLoadCounter > maxFilesLoad)
		{ return; }
	}
	
	
};

/**
 * LOD2 에 대한 F4D LegoData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistanceLOD2 = function(gl, currentVisibles) 
{
	if (this.readerWriter.octreesSkinLegos_requested > 5)
	{ return; }

	if (currentVisibles === undefined)
	{ return; }

	// LOD2
	// Check if the lod2lowestOctrees must load and parse data
	var lowestOctree;
	for (var i=0, length = currentVisibles.length; i<length; i++) 
	{	
		lowestOctree = currentVisibles[i];
		
		// Check if the lod2 is modelRef type data.
		var lodBuildingData = lowestOctree.neoBuildingOwner.getLodBuildingData(2);
		if (!lodBuildingData.isModelRef)
		{ continue; }

		lowestOctree.prepareSkinData(this);

		if (this.readerWriter.octreesSkinLegos_requested > 5)
		{ return; }
	} 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param cameraPosition 카메라 입장에서 화면에 그리기 전에 객체를 그릴 필요가 있는지 유무를 판단하는 값
 * @param scene 변수
 * @param shader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 * @param neoRefLists_array 변수
 */

MagoManager.prototype.checkChangesHistoryMovements = function(nodesArray) 
{
	var nodesCount = nodesArray.length;
	var node;
	var rootNode;	
	var projectId;
	var dataKey;
	var moveHistoryMap;
	var colorChangedHistoryMap;
	var objectIndexOrder;
	var neoBuilding;
	var refObject;
	var moveVector;
	var moveVectorRelToBuilding;
	var geoLocdataManager;
	var geoLoc;
	
	// check movement of objects.
	for (var i=0; i<nodesCount; i++)
	{
		node = nodesArray[i];
		rootNode = node.getRoot();
		if (rootNode === undefined)
		{ continue; }
		
		geoLocdataManager = rootNode.getNodeGeoLocDataManager();
		geoLoc = geoLocdataManager.getCurrentGeoLocationData();
		projectId = node.data.projectId;
		dataKey = node.data.nodeId;
		
		// objects movement.
		moveHistoryMap = MagoConfig.getMovingHistoryObjects(projectId, dataKey);
		if (moveHistoryMap)
		{
			node.data.moveHistoryMap = moveHistoryMap;
			/*
			neoBuilding = node.data.neoBuilding;
			///for (var changeHistory of moveHistoryMap.values()) 
			for (var key in moveHistoryMap)
			{
				if (Object.prototype.hasOwnProperty.call(moveHistoryMap, key)) 
				{
					var changeHistory = moveHistoryMap[key];
					objectIndexOrder = changeHistory.getObjectIndexOrder();
					refObject = neoBuilding.getReferenceObject(objectIndexOrder);
					if (refObject === undefined)
					{ continue; }
					
					if (refObject.moveVector === undefined)
					{ refObject.moveVector = new Point3D(); }
					
					if (refObject.moveVectorRelToBuilding === undefined)
					{ refObject.moveVectorRelToBuilding = new Point3D(); }
					
					moveVector = changeHistory.getReferenceObjectAditionalMovement();
					moveVectorRelToBuilding = changeHistory.getReferenceObjectAditionalMovementRelToBuilding();
					refObject.moveVectorRelToBuilding.set(moveVectorRelToBuilding.x, moveVectorRelToBuilding.y, moveVectorRelToBuilding.z);
					refObject.moveVector.set(moveVector.x, moveVector.y, moveVector.z);
					
					// now check if the building was rotated.
					// if was rotated then recalculate the move vector.
					refObject.moveVector = geoLoc.tMatrix.rotatePoint3D(refObject.moveVectorRelToBuilding, refObject.moveVector); 
					
					// if was no rotated, then set the moveVector of the changeHistory.
					//refObject.moveVectorRelToBuilding.set(moveVectorRelToBuilding.x, moveVectorRelToBuilding.y, moveVectorRelToBuilding.z);	
				}
			}
			*/
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */

MagoManager.prototype.checkPropertyFilters = function(nodesArray) 
{
	if (this.propertyFilterSC === undefined)
	{ return; }
	
	var nodesCount = nodesArray.length;
	var node;	
	var projectId;
	var propertyKey = this.propertyFilterSC.propertyKey;
	var propertyValue = this.propertyFilterSC.propertyValue;
	var visible = this.propertyFilterSC.visible;
	
	for (var i=0; i<nodesCount; i++)
	{
		node = nodesArray[i];
		projectId = node.data.projectId;
		if (projectId === this.propertyFilterSC.projectId)
		{
			if (node.data.attributes)
			{
				if (node.data.attributes[propertyKey] !== undefined && node.data.attributes[propertyKey].toString() === propertyValue)
				{
					if (visible === "true")
					{
						// do nothing.
					}
					else
					{
						nodesArray.splice(i, 1);
						i--;
						nodesCount = nodesArray.length;
					}
				}
				else
				{
					if (visible === "true")
					{
						nodesArray.splice(i, 1);
						i--;
						nodesCount = nodesArray.length;
					}
					else 
					{
						// do nothing.
					}
				}
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */

MagoManager.prototype.checkChangesHistoryColors = function(nodesArray) 
{
	var nodesCount = nodesArray.length;
	var node;
	var rootNode;	
	var projectId;
	var dataKey;
	var moveHistoryMap;
	var colorChangedHistoryMap;
	var objectIndexOrder;
	var neoBuilding;
	var refObject;
	
	// check movement of objects.
	for (var i=0; i<nodesCount; i++)
	{
		node = nodesArray[i];
		rootNode = node.getRoot();
		if (rootNode === undefined)
		{ continue; }
		
		projectId = node.data.projectId;
		dataKey = node.data.nodeId;

		colorChangedHistoryMap = MagoConfig.getColorHistorys(projectId, dataKey);
		if (colorChangedHistoryMap)
		{
			var data = node.data;
			
			// Set the colorChangedHistoryMap into data of the node.***
			data.colorChangedHistoryMap = colorChangedHistoryMap;
		}
	}
	
	var allColorHistoryMap = MagoConfig.getAllColorHistory();
	if (allColorHistoryMap)
	{
		for (var key in allColorHistoryMap) 
		{
			if (Object.prototype.hasOwnProperty.call(allColorHistoryMap, key))
			{
				var colorChangedHistoryMap = allColorHistoryMap[key];
				//for (var colorChangedHistoryMap of allColorHistoryMap.values()) 
				//{
				// now check nodes that is no physical.
				for (var key2 in colorChangedHistoryMap) 
				{
					if (Object.prototype.hasOwnProperty.call(colorChangedHistoryMap, key2))
					{
						var changeHistoryMap = colorChangedHistoryMap[key2];
						//for (var changeHistoryMap of colorChangedHistoryMap.values()) 
						//{
						for (var key3 in changeHistoryMap) 
						{
							if (Object.prototype.hasOwnProperty.call(changeHistoryMap, key3))
							{
								var changeHistory = changeHistoryMap[key3];
								//for (var changeHistory of changeHistoryMap.values()) 
								//{
								var projectId = changeHistory.projectId;
								var nodesMap = this.hierarchyManager.getNodesMap(projectId);
								var aNode = nodesMap[changeHistory.dataKey];
								if (aNode && aNode.data.attributes.isPhysical !== undefined && aNode.data.attributes.isPhysical === false)
								{
									// must check if there are filters.
									if (changeHistory.property === null || changeHistory.property === undefined || changeHistory.property === "" )
									{
										// this is a no physical node, so must check children.
										var nodesArray = [];
										aNode.extractNodes(nodesArray);
										var nodesCount = nodesArray.length;
										for (var i=0; i<nodesCount; i++)
										{
											var aNode2 = nodesArray[i];
											var data = aNode2.data;
											//neoBuilding = aNode2.data.neoBuilding;
											if (data)
											{
												data.isColorChanged = true;
												if (data.aditionalColor === undefined)
												{ data.aditionalColor = new Color(); }
												
												data.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
											}
										}
									}
									else 
									{
										var propertyKey = changeHistory.propertyKey;
										var propertyValue = changeHistory.propertyValue;
											
										// this is a no physical node, so must check children.
										var nodesArray = [];
										aNode.extractNodes(nodesArray);
										var nodesCount = nodesArray.length;
										for (var i=0; i<nodesCount; i++)
										{
											var aNode2 = nodesArray[i];
											var data = aNode2.data;
											//neoBuilding = aNode2.data.neoBuilding;
											if (data)
											{
												if (aNode2.data.attributes[propertyKey] !== undefined && aNode2.data.attributes[propertyKey].toString() === propertyValue)
												{
													data.isColorChanged = true;
													if (data.aditionalColor === undefined)
													{ data.aditionalColor = new Color(); }
													
													data.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
												}
											}
										}
									}
								}	
							}
						}	
					}
				}	
			}
		}
	}
};


/**
 * Draw building names on scene.
 */
MagoManager.prototype.getObjectLabel = function() 
{
	if (this.canvasObjectLabel === undefined)
	{
		this.canvasObjectLabel = document.getElementById("objectLabel");
		if (this.canvasObjectLabel === undefined)
		{ return; }

		var magoDiv = document.getElementById('magoContainer');
		var offsetLeft = magoDiv.offsetLeft;
		var offsetTop = magoDiv.offsetTop;
		var offsetWidth = magoDiv.offsetWidth;
		var offsetHeight = magoDiv.offsetHeight;
		
		this.canvasObjectLabel.style.opacity = 1.0;
		this.canvasObjectLabel.width = this.sceneState.drawingBufferWidth;
		this.canvasObjectLabel.height = this.sceneState.drawingBufferHeight;
		var canvasStyleLeft = offsetLeft.toString()+"px";
		var canvasStyleTop = offsetTop.toString()+"px";
		this.canvasObjectLabel.style.left = canvasStyleLeft;
		this.canvasObjectLabel.style.top = canvasStyleTop;
		this.canvasObjectLabel.style.position = "absolute";
		
		this.canvasObjectLabel.style.opacity = 1.0;
		this.canvasObjectLabel.width = this.sceneState.drawingBufferWidth;
		this.canvasObjectLabel.height = this.sceneState.drawingBufferHeight;
		var ctx = this.canvasObjectLabel.getContext("2d");
		//ctx.strokeStyle = 'SlateGrey';
		//ctx.strokeStyle = 'MidnightBlue';
		ctx.strokeStyle = 'DarkSlateGray'; 
		//ctx.fillStyle= "white";
		ctx.fillStyle= "PapayaWhip";
		ctx.lineWidth = 4;
		ctx.font = "20px Arial";
		ctx.textAlign = 'center';
		//ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.save();
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		var lineHeight = ctx.measureText("M").width * 1.1;
	}
	
	return this.canvasObjectLabel;
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawCCTVNames = function(cctvArray) 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	// lod2.
	var gl = this.sceneState.gl;
	var node;
	var nodeRoot;
	var geoLocDataManager;
	var geoLoc;
	var neoBuilding;
	var worldPosition;
	var screenCoord;
	var cctv;
	
	var cctvCount = cctvArray.length;
	for (var i=0; i<cctvCount; i++)
	{
		cctv = cctvArray[i];
		geoLoc = cctv.geoLocationData;
		worldPosition = geoLoc.position;
		//screenCoord = this.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord);
		screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, this);
		//screenCoord.x += 250;
		//screenCoord.y += 150;
		
		if (screenCoord.x >= 0 && screenCoord.y >= 0)
		{
			ctx.font = "13px Arial";
			ctx.strokeText(cctv.name, screenCoord.x, screenCoord.y);
			ctx.fillText(cctv.name, screenCoord.x, screenCoord.y);
		}
		
	}

	ctx.restore();
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
MagoManager.prototype.createDefaultShaders = function(gl) 
{
	// here creates the necessary shaders for mago3d.***
	// 1) ModelReferences ssaoShader.******************************************************************************
	var shaderName = "modelRefSsao";
	var ssao_vs_source = ShaderSource.ModelRefSsaoVS;
	var ssao_fs_source = ShaderSource.ModelRefSsaoFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 1.1) ModelReferences depthShader.******************************************************************************
	var shaderName = "modelRefDepth";
	var showDepth_vs_source = ShaderSource.RenderShowDepthVS;
	var showDepth_fs_source = ShaderSource.RenderShowDepthFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this);

	// 2) ModelReferences colorCoding shader.***********************************************************************
	var shaderName = "modelRefColorCoding";
	var showDepth_vs_source = ShaderSource.ColorSelectionSsaoVS;
	var showDepth_fs_source = ShaderSource.ColorSelectionSsaoFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this);
	
	// 3) TinTerrain shader.****************************************************************************************
	shaderName = "tinTerrain";
	ssao_vs_source = ShaderSource.TinTerrainVS;
	ssao_fs_source = ShaderSource.TinTerrainFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	
	// 4) PointsCloud shader.****************************************************************************************
	shaderName = "pointsCloud";
	ssao_vs_source = ShaderSource.PointCloudVS;
	ssao_fs_source = ShaderSource.PointCloudFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");

	// 5) Test Quad shader.****************************************************************************************
	shaderName = "testQuad"; // used by temperatura layer.***
	ssao_vs_source = ShaderSource.Test_QuadVS;
	ssao_fs_source = ShaderSource.Test_QuadFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 6) Filter silhouette shader.*************************************************************************************
	shaderName = "filterSilhouette"; 
	ssao_vs_source = ShaderSource.wgs84_volumVS; // simple screen quad v-shader.***
	ssao_fs_source = ShaderSource.filterSilhouetteFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 7) PointsCloud Depth shader.****************************************************************************************
	shaderName = "pointsCloudDepth";
	ssao_vs_source = ShaderSource.PointCloudDepthVS;
	ssao_fs_source = ShaderSource.PointCloudDepthFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");

	// 8) PointsCloud shader.****************************************************************************************
	shaderName = "pointsCloudSsao";
	ssao_vs_source = ShaderSource.PointCloudVS;
	ssao_fs_source = ShaderSource.PointCloudSsaoFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");

	// 9) PointsCloud shader RAINBOW.****************************************************************************************
	shaderName = "pointsCloudSsao_rainbow";
	ssao_vs_source = ShaderSource.PointCloudVS_rainbow;
	ssao_fs_source = ShaderSource.PointCloudSsaoFS_rainbow;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.bUseColorCodingByHeight_loc = gl.getUniformLocation(shader.program, "bUseColorCodingByHeight");
	shader.minHeight_rainbow_loc = gl.getUniformLocation(shader.program, "minHeight_rainbow");
	shader.maxHeight_rainbow_loc = gl.getUniformLocation(shader.program, "maxHeight_rainbow");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	
	// 10) Atmosphere shader.****************************************************************************************
	shaderName = "atmosphere";
	ssao_vs_source = ShaderSource.atmosphereVS;
	ssao_fs_source = ShaderSource.atmosphereFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	shader.equatorialRadius_loc = gl.getUniformLocation(shader.program, "equatorialRadius");
	
	// 11) ImageViewerRectangle Shader.******************************************************************************
	var shaderName = "imageViewerRectangle";
	var ssao_vs_source = ShaderSource.ImageViewerRectangleShaderVS;
	var ssao_fs_source = ShaderSource.ImageViewerRectangleShaderFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 12) OrthogonalDepth Shader.******************************************************************************
	var shaderName = "orthogonalDepth";
	var ssao_vs_source = ShaderSource.OrthogonalDepthShaderVS;
	var ssao_fs_source = ShaderSource.OrthogonalDepthShaderFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// OrthogonalShader locations.***
	shader.modelViewProjectionMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.encodedCameraPositionMCHigh_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.encodedCameraPositionMCLow_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	
	// 13) ThickLine Shader.******************************************************************************
	var shaderName = "thickLine";
	var ssao_vs_source = ShaderSource.thickLineVS;
	var ssao_fs_source = ShaderSource.thickLineFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;
	
	// 14) ScreenQuad shader.***********************************************************************************
	var shaderName = "screenQuad";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuadFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	
	// 15) Pin shader.******************************************************************************************
	var shaderName = "pin";
	var ssao_vs_source = ShaderSource.PngImageVS;
	var ssao_fs_source = ShaderSource.PngImageFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.position4_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.scale2d_loc = gl.getUniformLocation(shader.program, "scale2d");
	shader.size2d_loc = gl.getUniformLocation(shader.program, "size2d");
	shader.imageSize_loc = gl.getUniformLocation(shader.program, "imageSize");
	shader.bUseOriginalImageSize_loc = gl.getUniformLocation(shader.program, "bUseOriginalImageSize");
	shader.aditionalOffset_loc = gl.getUniformLocation(shader.program, "aditionalOffset");
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 */
MagoManager.prototype.isFarestFrustum = function() 
{
	if (this.numFrustums - this.currentFrustumIdx - 1 === 0)
	{ return true; }
	else
	{ return false; }
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.doMultiFrustumCullingSmartTiles = function(camera) 
{
	// Here uses a frustum that is the sum of all frustums.***
	var frustumVolume = this.myCameraSCX.bigFrustum;
	
	// This makes the visible buildings array.
	var smartTile1 = this.smartTileManager.tilesArray[0]; // America side tile.
	var smartTile2 = this.smartTileManager.tilesArray[1]; // Asia side tile.
	
	if (this.frustumVolumeControl === undefined)
	{ this.frustumVolumeControl = new FrustumVolumeControl(); }
	
	if (this.intersectedTilesArray === undefined)
	{ this.intersectedTilesArray = []; }
	
	if (this.lastIntersectedLowestTilesArray === undefined)
	{ this.lastIntersectedLowestTilesArray = []; }
	
	// save the last frustumCulled lowestTiles to delete if necessary.
	this.lastIntersectedLowestTilesArray = this.intersectedTilesArray;
	this.intersectedTilesArray = [];
	
	// mark all last_tiles as "no visible".
	var lastLowestTilesCount = this.lastIntersectedLowestTilesArray.length;
	var lowestTile;
	for (var i=0; i<lastLowestTilesCount; i++)
	{
		lowestTile = this.lastIntersectedLowestTilesArray[i];
		lowestTile.isVisible = false;
	}
	
	// do frustum culling for Asia_side_tile and America_side_tile.
	var maxDistToCamera = 5000;
	smartTile1.getFrustumIntersectedLowestTiles(camera, frustumVolume, this.intersectedTilesArray, maxDistToCamera);
	smartTile2.getFrustumIntersectedLowestTiles(camera, frustumVolume, this.intersectedTilesArray, maxDistToCamera);
	
	
	// Now, store the culled tiles into corresponding frustums, and mark all current_tiles as "visible".***
	this.frustumVolumeControl.initArrays(); // init.***
	var frustumsCount = this.myCameraSCX.frustumsArray.length;
	var frustum;
	var lowestTile;
	var currentLowestTilesCount = this.intersectedTilesArray.length;
	for (var i=0; i<currentLowestTilesCount; i++)
	{
		lowestTile = this.intersectedTilesArray[i];
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
	
		// Now, if the "lowestOctree" is inside of deletingQueue, then erase from deletingQueue.
		this.processQueue.eraseSmartTileToDelete(lowestTile);
	
		lowestTile.isVisible = true;
		for (var j=frustumsCount-1; j>= 0 ; j--)
		{
			frustum = this.myCameraSCX.frustumsArray[j];
			if (frustum.intersectionNearFarSphere(lowestTile.sphereExtent) !== Constant.INTERSECTION_OUTSIDE)
			{
				var frustumVolumeControlObject = this.frustumVolumeControl.getFrustumVolumeCulling(j); 
				frustumVolumeControlObject.intersectedTilesArray.push(lowestTile);
				//break;
			}
		}
	}
	
	
	// Now, delete all tiles that is no visible in the all frustumVolumes.***
	// Put to deleting queue.***
	var lastLowestTilesCount = this.lastIntersectedLowestTilesArray.length;
	var lowestTile;
	for (var i=0; i<lastLowestTilesCount; i++)
	{
		lowestTile = this.lastIntersectedLowestTilesArray[i];
		if (!lowestTile.isVisible)
		{
			//if (lowestTile.distToCamera > 2000)
			{ 
				//this.processQueue.putNodesArrayToDelete(lowestTile.nodesArray); 
				this.processQueue.putSmartTileToDelete(lowestTile, 0);
				///lowestTile.clearNodesArray();
			}
			
		}
	}
	
	this.lastIntersectedLowestTilesArray.length = 0;
	
	
	// TinTerranTiles.*************************************************************************
	// Provisionally:
	if (this.tinTerrainManager !== undefined)
	{ this.tinTerrainManager.doFrustumCulling(frustumVolume, camera.position, this); }
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.tilesMultiFrustumCullingFinished = function(intersectedLowestTilesArray, visibleNodes, cameraPosition, frustumVolume) 
{
	var tilesCount = intersectedLowestTilesArray.length;
	
	if (tilesCount === 0)
	{ return; }
	
	var distToCamera;
	var magoPolicy = this.magoPolicy;
	
	// The max distance to render in mago.
	var lod5_minDist = magoPolicy.getLod5DistInMeters();
	
	var lowestTile;
	var buildingSeedsCount;
	var buildingSeed;
	var neoBuilding;
	var renderable;
	var node;
	var nodeRoot;
	var nodeBbox;
	var geoLoc;
	var geoLocDataManager;
	var realBuildingPos;
	var longitude, latitude, altitude, heading, pitch, roll;
	
	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }

	var frustumFar = magoPolicy.getFrustumFarDistance();
	
	//if (frustumFar < 30000)
	//{ frustumFar = 30000; }

	var doFrustumCullingToBuildings = false;

	for (var i=0; i<tilesCount; i++)
	{
		lowestTile = intersectedLowestTilesArray[i];
		
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
	
		distToCamera = cameraPosition.distToSphere(lowestTile.sphereExtent);
		//if (distToCamera > Number(lod5_minDist))
		//{ continue; }
	
		if (lowestTile.intersectionType === Constant.INTERSECTION_INSIDE)
		{
			doFrustumCullingToBuildings = false;
		}
		else 
		{
			doFrustumCullingToBuildings = true;
		}

		// Check the smartTile state: (1- is all updated), (2- need make geometries from objectsSeeds).
		if (lowestTile.nodesArray && lowestTile.nodesArray.length > 0)
		{
			// the neoBuildings are made.
			var nodesCount = lowestTile.nodesArray.length;
			for (var j=0; j<nodesCount; j++)
			{
				// determine LOD for each building.
				node = lowestTile.nodesArray[j];
				nodeRoot = node.getRoot();
				var attributes = node.data.attributes;

				// now, create a geoLocDataManager for node if no exist.
				if (nodeRoot.data.geoLocDataManager === undefined)
				{
					geoLoc = node.calculateGeoLocData(this);
					continue;
				}
				
				var data = node.data;
					
				if (attributes.objectType === "basicF4d")
				{					
					neoBuilding = node.data.neoBuilding;
					if (neoBuilding === undefined) // attributes.isReference === true
					{
						// This node is a reference node.***
						visibleNodes.currentVisiblesToPrepare.push(node);
						continue;
					}
					
					//check if parsed header.***
					//neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
					if (neoBuilding.metaData !== undefined && neoBuilding.metaData.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
					{
						visibleNodes.currentVisiblesToPrepare.push(node);
						continue;
					}

					distToCamera = node.getDistToCamera(cameraPosition, this.boundingSphere_Aux);
					var lodByDist = magoPolicy.getLod(distToCamera);
					
					// Set the current LOD of node.
					data.distToCam = distToCamera;
					data.currentLod = magoPolicy.getLod(data.distToCam);
					
					
					if (distToCamera > frustumFar)// || distToCamera > 1500)
					{ 
						// put this node to delete into queue.***
						//this.processQueue.putNodeToDelete(node, 0);
						continue; 
					}
					
					// If necessary do frustum culling.**********************************************************
					if (doFrustumCullingToBuildings)
					{
						var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
						// intersect with Frustum
						if (frustumCull === Constant.INTERSECTION_OUTSIDE) 
						{
							// put this node to delete into queue.***
							////this.processQueue.putNodeToDeleteModelReferences(node, 0);
							//this.processQueue.putNodeToDeleteLessThanLod3(node, 0);
							continue;
						}
					}
					//-------------------------------------------------------------------------------------------
					
					// provisionally fork versions.***
					var version = neoBuilding.getHeaderVersion();
					if (version === undefined)
					{ continue; }
					
					if (version[0] === 'v')
					{
						visibleNodes.putNodeByLod(node, lodByDist);
					}
					else 
					{
						// provisional test for pointsCloud data.************
						var metaData = neoBuilding.metaData;
						var projectsType = metaData.projectDataType;
						if (projectsType && (projectsType === 4 || projectsType === 5))
						{
							// Project_data_type (new in version 002).***
							// 1 = 3d model data type (normal 3d with interior & exterior data).***
							// 2 = single building skin data type (as vWorld or googleEarth data).***
							// 3 = multi building skin data type (as Shibuya & Odaiba data).***
							// 4, 5 = pointsCloud data type.***
							visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisiblesAux, node);
						}
						// end provisional test.-----------------------------
						else
						{
							visibleNodes.putNodeByLod(node, lodByDist);
						}
					}
				
				}
				else if (attributes.objectType === "multiBuildingsTile")
				{
					// Put node into visibleNodes.
					distToCamera = node.getDistToCamera(cameraPosition, this.boundingSphere_Aux);
					var lodByDist = magoPolicy.getLod(distToCamera);
					
					// Set the current LOD of node.
					data.distToCam = distToCamera;
					data.currentLod = magoPolicy.getLod(data.distToCam);
					
					var frustumFar = magoPolicy.getFrustumFarDistance();
					if (distToCamera > frustumFar)
					{ 
						// put this node to delete into queue.***
						this.processQueue.putNodeToDelete(node, 1);
						continue; 
					}
					
					// If necessary do frustum culling.**********************************************************
					//if (doFrustumCullingToBuildings)
					//{
					//	var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
					//	// intersect with Frustum
					//	if (frustumCull === Constant.INTERSECTION_OUTSIDE) 
					//	{
					//		// put this node to delete into queue.***
					//		//this.processQueue.putNodeToDeleteLessThanLod3(node, 0);
					//		continue;
					//	}
					//}
					//-------------------------------------------------------------------------------------------
					
					visibleNodes.putNodeByLod(node, lodByDist);
				}
			}
		}
		
		// Check native objects.
		var nativeObjects = lowestTile.nativeObjects;
		var currVisibleNativeObjects = visibleNodes.currentVisibleNativeObjects;
		Array.prototype.push.apply(currVisibleNativeObjects.opaquesArray, nativeObjects.opaquesArray);
		Array.prototype.push.apply(currVisibleNativeObjects.transparentsArray, nativeObjects.transparentsArray);
		Array.prototype.push.apply(currVisibleNativeObjects.excavationsArray, nativeObjects.excavationsArray);
		Array.prototype.push.apply(currVisibleNativeObjects.vectorTypeArray, nativeObjects.vectorTypeArray);

		if (lowestTile.isNeededToCreateGeometriesFromSeeds())
		{
			lowestTile.createGeometriesFromSeeds(this);
		}
	}
};

/**
 */
MagoManager.prototype.flyToTopology = function(worldPoint3d, duration) 
{
	if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) 
	{
		this.scene.camera.flyTo({
			destination : Cesium.Cartesian3.clone(worldPoint3d),
			orientation : {
				direction : new Cesium.Cartesian3(this.scene.camera.direction.x, this.scene.camera.direction.y, this.scene.camera.direction.z),
				up        : new Cesium.Cartesian3(this.scene.camera.up.x, this.scene.camera.up.y, this.scene.camera.up.z)},
			duration: parseInt(duration)
		});
	}
	/*
	else if (MagoConfig.getPolicy().geo_view_library === Constant.WORLDWIND)
	{
		this.wwd.goToAnimator.travelTime = duration * 1000;
		this.wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(altitude) + 50));
	}
	else if (MagoConfig.getPolicy().geo_view_library === Constant.MAGOWORLD)
	{
		this.magoWorld.goto(parseFloat(longitude),
			parseFloat(latitude),
			parseFloat(altitude) + 10);
	}
	*/
};

/**
 * dataKey 이용해서 data 검색
 * @param apiName api 이름
 * @param projectId project id
 * @param dataKey
 */
MagoManager.prototype.flyTo = function(longitude, latitude, altitude, duration) 
{
	if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) 
	{
		this.scene.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(parseFloat(longitude),
				parseFloat(latitude),
				parseFloat(altitude)),
			duration: parseInt(duration)
		});
	}
	else if (MagoConfig.getPolicy().geo_view_library === Constant.MAGOWORLD)
	{
		this.magoWorld.goto(parseFloat(longitude),
			parseFloat(latitude),
			parseFloat(altitude));
	}

};

/**
 * dataKey 이용해서 data 검색
 * @param apiName api 이름
 * @param projectId project id
 * @param dataKey
 */
MagoManager.prototype.flyToBuilding = function(apiName, projectId, dataKey) 
{
	var node = this.hierarchyManager.getNodeByDataName(projectId, "nodeId", dataKey);
	if (node === undefined)
	{ 
		apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
		return; 
	}
	
	var nodeRoot = node.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc;
	if (geoLocDataManager === undefined)
	{ 
		geoLoc = node.calculateGeoLocData(this);
		if (geoLoc === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return; 
		}
	}
	geoLocDataManager = nodeRoot.data.geoLocDataManager;
	geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	var realBuildingPos = node.getBBoxCenterPositionWorldCoord(geoLoc);

	if (realBuildingPos === undefined)
	{ return; }

	if (!nodeRoot.data.bbox)
	{ return; }
	this.radiusAprox_aux = nodeRoot.data.bbox.getRadiusAprox();

	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }
	
	this.boundingSphere_Aux.radius = this.radiusAprox_aux;

	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
		var seconds = 3;
		this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, seconds);
	}
};

MagoManager.prototype.displayLocationAndRotation = function(neoBuilding) 
{
	//var node = this.hierarchyManager.getNodeByDataName(projectId, dataName, dataNameValue); // original.***
	var node = neoBuilding.nodeOwner;
	var geoLocDatamanager = node.getNodeGeoLocDataManager();
	if (geoLocDatamanager === undefined)
	{ return; }
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	var latitude = geoLocationData.geographicCoord.latitude;
	var longitude = geoLocationData.geographicCoord.longitude;
	var altitude = geoLocationData.geographicCoord.altitude;
	var heading = geoLocationData.heading;
	var pitch = geoLocationData.pitch;
	var roll = geoLocationData.roll;
	var dividedName = neoBuilding.buildingId.split("_");
};

/**
 * 변환 행렬
 */
MagoManager.prototype.selectedObjectNotice = function(neoBuilding) 
{
	if (neoBuilding === undefined)
	{ return; }
	
	var node = neoBuilding.nodeOwner;
	var geoLocDatamanager = node.getNodeGeoLocDataManager();
	if (geoLocDatamanager === undefined)
	{ return; }
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	var dataKey = node.data.nodeId;
	var projectId = node.data.projectId;

	if (MagoConfig.getPolicy().geo_callback_enable === "true") 
	{
		//if (this.objMarkerSC === undefined) { return; }
		var objectId = null;
		if (this.objectSelected !== undefined) { objectId = this.objectSelected.objectId; }
		
		// click object 정보를 표시
		if (this.magoPolicy.getObjectInfoViewEnable()) 
		{
			selectedObjectCallback(		MagoConfig.getPolicy().geo_callback_selectedobject,
				projectId,
				dataKey,
				objectId,
				geoLocationData.geographicCoord.latitude,
				geoLocationData.geographicCoord.longitude,
				geoLocationData.geographicCoord.altitude,
				geoLocationData.heading,
				geoLocationData.pitch,
				geoLocationData.roll);
		}
			
		// 이슈 등록 창 오픈
		if (this.magoPolicy.getIssueInsertEnable()) 
		{
			if (this.objMarkerSC === undefined) { return; }
			
			insertIssueCallback(	MagoConfig.getPolicy().geo_callback_insertissue,
				projectId,
				dataKey,
				objectId,
				geoLocationData.geographicCoord.latitude,
				geoLocationData.geographicCoord.longitude,
				(parseFloat(geoLocationData.geographicCoord.altitude)));
		}
	}
	
	
};

/**
 * 변환 행렬
 */
MagoManager.prototype.changeLocationAndRotation = function(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, animationOption) 
{
	var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
	if (node === undefined)
	{ return; }
	this.changeLocationAndRotationNode(node, latitude, longitude, elevation, heading, pitch, roll, animationOption);
};

/**
 * 변환 행렬
 */
MagoManager.prototype.changeLocationAndRotationNode = function(node, latitude, longitude, elevation, heading, pitch, roll, animationOption) 
{
	if (node === undefined)
	{ return; }

	if (animationOption !== undefined)
	{
		if (this.animationManager === undefined)
		{ this.animationManager = new AnimationManager(); }
		this.animationManager.putNode(node);
		
		//For compatibility with lower versions, lower version parameter is duratiuon(number).
		node.changeLocationAndRotationAnimated(latitude, longitude, elevation, heading, pitch, roll, this, animationOption);
	}
	else 
	{
		node.changeLocationAndRotation(latitude, longitude, elevation, heading, pitch, roll, this);
	}
	
	var neoBuilding = node.data.neoBuilding;
	
	//this.selectedObjectNotice(neoBuilding);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param {string} projectId policy 사용 시 geo_data_default_projects 배열에 있는 값.
 * @param {string} projectDataFolder 해당 프로젝트의 data_key를 의미.
 */
MagoManager.prototype.getObjectIndexFile = function(projectId, projectDataFolder) 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}
	
	this.buildingSeedList = new BuildingSeedList();
	var fileName;
	var geometrySubDataPath = projectDataFolder;
	fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + MagoConfig.getPolicy().content_cache_version;
	this.readerWriter.getObjectIndexFileForSmartTile(fileName, this, this.buildingSeedList, projectId);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.getObjectIndexFile_xxxx = function() 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}

	this.buildingSeedList = new BuildingSeedList();
	this.readerWriter.getObjectIndexFileForSmartTile(
		this.readerWriter.getCurrentDataPath() + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + MagoConfig.getPolicy().content_cache_version, this, this.buildingSeedList);
		
};

/**
 * smartTile 의 object index 파일을 읽음
 * @param {string} projectId 프로젝트 고유번호
 * @param {string} projectDataFolder smartTile 의 위치
 */
MagoManager.prototype.getObjectIndexFileSmartTileF4d = function(projectDataFolder) 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}

	var geometrySubDataPath = projectDataFolder;
	var fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.TILE_INDEX_FILE;
	this.readerWriter.getObjectIndexFileSmartTileF4d(fileName, geometrySubDataPath, this);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.makeNode = function(jasonObject, resultPhysicalNodesArray, buildingSeedMap, projectFolderName, projectId) 
{
	var attributes = undefined;
	var children = undefined;
	var data_group_id = undefined;
	var data_group_name = undefined;
	var data_id = undefined;
	var data_key = undefined;
	var data_name = undefined;
	var heading = undefined;
	var height = undefined;
	var latitude = undefined;
	var longitude = undefined;
	var pitch = undefined;
	var roll = undefined;
	var mapping_type = undefined;
	
	if (jasonObject !== undefined)
	{
		attributes = jasonObject.attributes;
		children = jasonObject.children;
		data_group_id = jasonObject.data_group_id;
		data_group_name = jasonObject.data_group_name;
		data_id = jasonObject.data_id;
		data_key = jasonObject.data_key;
		data_name = jasonObject.data_name;
		heading = jasonObject.heading;
		height = jasonObject.height;
		latitude = jasonObject.latitude;
		longitude = jasonObject.longitude;
		pitch = jasonObject.pitch;
		roll = jasonObject.roll;
		mapping_type = jasonObject.mapping_type;
	}
	
	if (heading === undefined)
	{ heading = 0; }
	
	if (pitch === undefined)
	{ pitch = 0; }
	
	if (roll === undefined)
	{ roll = 0; }
	
	// now make the node.
	var buildingId;
	var buildingSeed;
	var node;
	var bbox;
	var childJason;
	var childNode;
	var childrenCount;
	if (attributes !== undefined)
	{
		if (!attributes.isReference)
		{
			attributes.objectType = "basicF4d";
			buildingId = data_key;
			node = this.hierarchyManager.newNode(buildingId, projectId, attributes);
			// set main data of the node.
			var data = node.data;
			var relativePath = attributes.relativePath;
			projectFolderName = (relativePath && relativePath.length > 0) ? projectFolderName + relativePath : projectFolderName;
			data.projectFolderName = projectFolderName;
			data.projectId = projectId;
			data.data_name = data_name;
			data.attributes = attributes;
			data.mapping_type = mapping_type;
			var tMatrix;
			
			if (attributes.isPhysical)
			{
				// find the buildingSeed.
				buildingSeed = buildingSeedMap[buildingId];
				if (buildingSeed)
				{
					data.buildingSeed = buildingSeed;
					resultPhysicalNodesArray.push(node);
				}
			}

			if (longitude && latitude)
			{
				// this is root node.
				if (height === undefined)
				{ height = 0; }
				
				data.geographicCoord = new GeographicCoord();
				data.geographicCoord.setLonLatAlt(longitude, latitude, height);
				
				if (data.rotationsDegree === undefined)
				{ data.rotationsDegree = new Point3D(); }
				data.rotationsDegree.set(pitch, roll, heading);
				
				
				if (buildingSeed !== undefined)
				{
					if (buildingSeed.geographicCoord === undefined)
					{ buildingSeed.geographicCoord = new GeographicCoord(); }
				
					if (buildingSeed.rotationsDegree === undefined)
					{ buildingSeed.rotationsDegree = new Point3D(); }
			
					buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, height);
					buildingSeed.rotationsDegree.set(pitch, roll, heading);
					
					// now calculate the geographic coord of the center of the bbox.
					if (buildingSeed.geographicCoordOfBBox === undefined) 
					{ buildingSeed.geographicCoordOfBBox = new GeographicCoord(); }
				
					// calculate the transformation matrix at (longitude, latitude, height).
					var worldCoordPosition = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, height, worldCoordPosition, this);
					tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, heading, pitch, roll, undefined, tMatrix, this);
					
					// now calculate the geographicCoord of the center of the bBox.
					var bboxCenterPoint;

					bboxCenterPoint = buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
					
					var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
					buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, buildingSeed.geographicCoordOfBBox, this); // original.
					
					// Set the altitude as the original. This method has little error.***
					buildingSeed.geographicCoordOfBBox.altitude = buildingSeed.geographicCoord.altitude;
					
				}
			}

			// now, calculate the bbox.***
			data.bbox = new BoundingBox();
			
			if (data.buildingSeed && data.buildingSeed.bBox)
			{ data.bbox.copyFrom(buildingSeed.bBox); }
			
			// calculate the geographicCoordOfTheBBox.***
			if (tMatrix !== undefined)
			{
				if (data.mapping_type.toLowerCase() === "origin")
				{
					bboxCenterPoint = data.bbox.getCenterPoint(bboxCenterPoint);
					var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
					data.bbox.geographicCoord = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, data.bbox.geographicCoord, this);
				}
				else if (data.mapping_type.toLowerCase() === "boundingboxcenter")
				{
					data.bbox.geographicCoord = new GeographicCoord();
					data.bbox.geographicCoord.setLonLatAlt(longitude, latitude, height);
				}
			}

			//bbox = node.data.bbox;

			if (children !== undefined)
			{
				childrenCount = children.length;
				for (var i=0; i<childrenCount; i++)
				{
					childJason = children[i];
					childNode = this.makeNode(childJason, resultPhysicalNodesArray, buildingSeedMap, projectFolderName, projectId);
					
					// if childNode has "geographicCoord" then the childNode is in reality a root.
					if (childNode.data.geographicCoord === undefined)
					{
						node.addChildren(childNode);
					}
				}
			}
		}
		else 
		{
			/* static model 사용은 API를 통해서만... 
			attributes.projectId = projectId;
			this.addStaticModel(attributes);
			if (children !== undefined)
			{
				childrenCount = children.length;
				for (var i=0; i<childrenCount; i++)
				{
					var childrenObj = children[i];
					if (!defined(childrenObj.projectId))
					{
						childrenObj.projectId = projectId;
					}
					this.instantiateStaticModel(childrenObj);
				}
			}
			*/
		}
	}
	return node;
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.calculateBoundingBoxesNodes = function(projectId) 
{
	var node;
	var nodeRoot;
	var buildingSeed;
	var longitude, latitude, height;
	var heading, pitch, roll;
	
	var nodesMap = this.hierarchyManager.getNodesMap(projectId);
	// 1rst, calculate boundingBoxes of buildingSeeds of nodes.

	for (var key in nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(nodesMap, key))
		{
			node = nodesMap[key];
			if (node.data === undefined)
			{ continue; }
			
			buildingSeed = node.data.buildingSeed;
			if (buildingSeed)
			{
				nodeRoot = node.getClosestParentWithData("geographicCoord");
			
				longitude = nodeRoot.data.geographicCoord.longitude; 
				latitude = nodeRoot.data.geographicCoord.latitude; 
				height = nodeRoot.data.geographicCoord.altitude;
			
				heading = nodeRoot.data.rotationsDegree.z;
				pitch = nodeRoot.data.rotationsDegree.x;
				roll = nodeRoot.data.rotationsDegree.y;
			
				if (buildingSeed.geographicCoord === undefined)
				{ buildingSeed.geographicCoord = new GeographicCoord(); }
		
				if (buildingSeed.rotationsDegree === undefined)
				{ buildingSeed.rotationsDegree = new Point3D(); }

				buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, height);
				buildingSeed.rotationsDegree.set(pitch, roll, heading);
			
				// now calculate the geographic coord of the center of the bbox.
				if (buildingSeed.geographicCoordOfBBox === undefined) 
				{ buildingSeed.geographicCoordOfBBox = new GeographicCoord(); }
		
				// calculate the transformation matrix at (longitude, latitude, height).
				var worldCoordPosition = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, height, worldCoordPosition, this);
				var tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, heading, pitch, roll, undefined, tMatrix, this);
			
				// now calculate the geographicCoord of the center of the bBox.
				buildingSeed.geographicCoordOfBBox.setLonLatAlt(longitude, latitude, height);
			}
		}
	}
	
	
	// now, must calculate the bbox of the root nodes.
	var rootNodesArray = [];
	var nodesArray = [];
	this.hierarchyManager.getRootNodes(projectId, rootNodesArray); // original.***
	var bboxStarted = false;
	
	var rootNodesCount = rootNodesArray.length;
	for (var i=0; i<rootNodesCount; i++)
	{
		nodeRoot = rootNodesArray[i];
		
		nodesArray.length = 0; // init.***
		nodeRoot.extractNodesByDataName(nodesArray, "buildingSeed");
		// now, take nodes that is "isMain" = true.
		bboxStarted = false;
		var nodesCount =  nodesArray.length;
		for (var j=0; j<nodesCount; j++)
		{
			node = nodesArray[j];
			var nodeBBox = node.data.bbox;
			
			if (nodeBBox)
			{
				if (node.data.attributes)
				{
					if (node.data.attributes.isMain)
					{
						//buildingSeed = node.data.buildingSeed;
						if (bboxStarted === false)
						{
							nodeRoot.data.bbox.copyFrom(nodeBBox);
							bboxStarted = true;
						}
						else 
						{
							nodeRoot.data.bbox.addBox(nodeBBox);
						}
					}
					else 
					{
						if (bboxStarted === false)
						{
							nodeRoot.data.bbox.copyFrom(nodeBBox);
							bboxStarted = true;
						}
						else 
						{
							nodeRoot.data.bbox.addBox(nodeBBox);
						}
					}
				}
				else 
				{
					if (bboxStarted === false)
					{
						nodeRoot.data.bbox.copyFrom(nodeBBox);
						bboxStarted = true;
					}
					else 
					{
						nodeRoot.data.bbox.addBox(nodeBBox);
					}
				}
			}
		}
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.makeSmartTile = function(buildingSeedList, projectId) 
{
	//var realTimeLocBlocksList = MagoConfig.getData().alldata; // original.***
	// "projectId" = json file name.
	var realTimeLocBlocksList = MagoConfig.getData(CODE.PROJECT_ID_PREFIX + projectId);
	var buildingSeed;
	var buildingId;
	var newLocation;

	// now, read all hierarchyJason and make the hierarchy tree.
	var physicalNodesArray = []; // put here the nodes that has geometry data.
	// make a buildingSeedMap.
	var buildingSeedMap = {};
	var buildingSeedsCount = buildingSeedList.buildingSeedArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		buildingSeed = buildingSeedList.buildingSeedArray[i];
		buildingId = buildingSeed.buildingId;
		buildingSeedMap[buildingId] = buildingSeed;
	}
	var projectFolderName = realTimeLocBlocksList.data_key;
	this.makeNode(realTimeLocBlocksList, physicalNodesArray, buildingSeedMap, projectFolderName, projectId);
	this.calculateBoundingBoxesNodes(projectId);
	
	// now, make smartTiles.
	// there are 2 general smartTiles: AsiaSide & AmericaSide.
	var targetDepth = 15;
	this.smartTileManager.makeTreeByDepth(targetDepth, physicalNodesArray, this);

	this.buildingSeedList.buildingSeedArray.length = 0; // init.
};


/**
 * instantiate static model
 * @param {instantiateOption} attributes
 */
MagoManager.prototype.instantiateStaticModel = function(attributes)
{
	if (!defined(attributes.projectId))
	{
		throw new Error('projectId is required.');
	}

	if (!this.isExistStaticModel(attributes.projectId))
	{
		throw new Error('static model is not exist.');
	}
	if (!defined(attributes.instanceId))
	{
		throw new Error('instanceId is required.');
	}

	if (!defined(attributes.longitude))
	{
		throw new Error('longitude is required.');
	}
	if (!defined(attributes.latitude))
	{
		throw new Error('latitude is required.');
	}

	if (!attributes.isReference)
	{
		attributes.isReference = true;
	}

	if (!attributes.isPhysical)
	{
		attributes.isPhysical = true;
	}

	if (!attributes.nodeType)
	{
		attributes.nodeType = "TEST";
	}
	
	attributes.objectType = "basicF4d";

	//var nodesMap = this.hierarchyManager.getNodesMap(projectId, undefined);
	//var existentNodesCount = Object.keys(nodesMap).length;
	//var instanceId = defaultValue(attributes.instanceId, projectId + "_" + existentNodesCount.toString());
	var projectId = attributes.projectId;
	var instanceId = attributes.instanceId;
	
	var longitude = attributes.longitude;
	var latitude = attributes.latitude;
	var altitude = parseFloat(defaultValue(attributes.height, 0));
	var heading = parseFloat(defaultValue(attributes.heading, 0));
	var pitch = parseFloat(defaultValue(attributes.pitch, 0));
	var roll = parseFloat(defaultValue(attributes.roll, 0));
	
	var node = this.hierarchyManager.getNodeByDataKey(projectId, instanceId);
	if (node === undefined)
	{
		node = this.hierarchyManager.newNode(instanceId, projectId, undefined);

		var geoCoord = new GeographicCoord();
		geoCoord.latitude = parseFloat(latitude);
		geoCoord.longitude = parseFloat(longitude);
		geoCoord.altitude = parseFloat(altitude);

		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLocData = geoLocDataManager.newGeoLocationData("noName");
		geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, heading, pitch, roll, geoLocData, this);

		// Now, create the geoLocdataManager of node.***
		node.data.projectId = projectId;
		node.data.attributes = attributes;
		node.data.geographicCoord = geoCoord;
		node.data.rotationsDegree = new Point3D(pitch, roll, heading);
		node.data.geoLocDataManager = geoLocDataManager;

		// Now, insert node into smartTile.***
		var targetDepth = 12;
		this.smartTileManager.putNode(targetDepth, node, this);
	}
	else 
	{
		this.changeLocationAndRotation(projectId, instanceId, latitude, longitude, altitude, heading, pitch, roll);
	}
};
/**
 * add static model
 * @param {staticModelOption} attributes
 */
MagoManager.prototype.addStaticModel = function(attribute)
{
	if (!defined(attribute.projectId))
	{
		throw new Error('projectId is required.');
	}

	if (!defined(attribute.projectFolderName))
	{
		throw new Error('projectFolderName is required.');
	}

	if (!defined(attribute.buildingFolderName))
	{
		throw new Error('buildingFolderName is required.');
	}
	var projectId = attribute.projectId;
	var staticModelsManager = this.hierarchyManager.getStaticModelsManager();

	var staticModel = new StaticModel();
	staticModel.guid = projectId;
	staticModel.projectFolderName = attribute.projectFolderName;
	staticModel.buildingFolderName = attribute.buildingFolderName;
	staticModel.neoBuilding = new NeoBuilding();
	
	staticModelsManager.addStaticModel(projectId, staticModel);
};
/**
 * check static model is exist
 * @param {string} projectId
 * @returns {Boolean} isExist
 */
MagoManager.prototype.isExistStaticModel = function(projectId)
{
	var isExist = false;

	if (!this.hierarchyManager.staticModelsManager || !this.hierarchyManager.staticModelsManager.staticModelsMap)
	{
		return isExist;
	}

	if (this.hierarchyManager.staticModelsManager.staticModelsMap.hasOwnProperty(projectId))
	{
		isExist = true;
	}
	return isExist;
};
/**
 * api gateway
 */
MagoManager.prototype.callAPI = function(api) 
{
	var apiName = api.getAPIName();
	if (apiName === "changeMagoState") 
	{
		this.magoPolicy.setMagoEnable(api.getMagoEnable());
	}
	else if (apiName === "searchData") 
	{
		return this.flyToBuilding(apiName, api.getProjectId(), api.getDataKey());
	}
	else if (apiName === "changeColor") 
	{
		ColorAPI.changeColor(api, this);
	}
	else if (apiName === "show") 
	{
		this.magoPolicy.setHideBuildings.length = 0;
	}
	else if (apiName === "hide") 
	{
		this.magoPolicy.setHideBuildings(api.gethideBuilds());
	}
	else if (apiName === "changeOutFitting") 
	{
		this.magoPolicy.setShowOutFitting(api.getShowOutFitting());
	} 
	else if (apiName === "changeLabel") 
	{
		this.magoPolicy.setShowLabelInfo(api.getShowLabelInfo());
		
		// clear the text canvas.
		var canvas = document.getElementById("objectLabel");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	}
	else if (apiName === "changeOrigin")
	{
		this.magoPolicy.setShowOrigin(api.getShowOrigin());
	}
	else if (apiName === "changeBoundingBox") 
	{
		this.magoPolicy.setShowBoundingBox(api.getShowBoundingBox());
	}
	else if (apiName === "changeShadow") 
	{
		this.magoPolicy.setShowShadow(api.getShowShadow());
		
	}
	else if (apiName === "changefrustumFarDistance") 
	{
		// frustum culling 가시 거리
		this.magoPolicy.setFrustumFarSquaredDistance(api.getFrustumFarDistance() * api.getFrustumFarDistance());
	}
	else if (apiName === "changeLocationAndRotation") 
	{
		LocationAndRotationAPI.changeLocationAndRotation(api, this);
	}
	else if (apiName === "changeObjectMove") 
	{
		this.magoPolicy.setObjectMoveMode(api.getObjectMoveMode());
	}
	else if (apiName === "saveObjectMove") 
	{
	//		var changeHistory = new ChangeHistory();
	//		changeHistory.setObjectMoveMode(api.getObjectMoveMode());
	//		MagoConfig.saveMovingHistory(api.getProjectId(), api.getDataKey(), api.getObjectIndexOrder(), changeHistory);
	}
	else if (apiName === "deleteAllObjectMove") 
	{
		// delete "aditionalMove" of the objects.***
		var moveHistoryMap = MagoConfig.getAllMovingHistory(); // get colorHistoryMap.***
		if (moveHistoryMap === undefined)
		{
			MagoConfig.clearMovingHistory();
			return;
		}
		
		for (var key_projectId in moveHistoryMap)
		{
			if (Object.prototype.hasOwnProperty.call(moveHistoryMap, key_projectId))
			{
				var projectId = key_projectId;
				var buildingsMap = moveHistoryMap[projectId];
				if (buildingsMap === undefined)
				{ continue; }
				
				for (var key_dataKey in buildingsMap)
				{
					if (Object.prototype.hasOwnProperty.call(buildingsMap, key_dataKey))
					{
						var dataKey = key_dataKey;
						var dataValue = buildingsMap[key_dataKey];
						
						if (dataValue === undefined)
						{ continue; }
						
						for (var objectIdx in dataValue)
						{
							if (Object.prototype.hasOwnProperty.call(dataValue, objectIdx))
							{
								var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
								if (node === undefined || node.data === undefined)
								{ continue; }
								
								var neoBuilding = node.data.neoBuilding;
								if (neoBuilding === undefined)
								{ continue; }
								
								var refObject = neoBuilding.getReferenceObject(objectIdx);
								if (refObject)
								{
									refObject.moveVector = undefined;
									refObject.moveVectorRelToBuilding = undefined;
								}	
							}
						}	
					}
				}	
			}
		}
		
		MagoConfig.clearMovingHistory();
	}
	else if (apiName === "deleteAllChangeColor") 
	{
		// 1rst, must delete the aditionalColors of objects.***
		var colorHistoryMap = MagoConfig.getAllColorHistory(); // get colorHistoryMap.***
		
		if (colorHistoryMap === undefined)
		{
			MagoConfig.clearColorHistory();
			return;
		}
		
		for (var key_projectId in colorHistoryMap)
		{
			if (Object.prototype.hasOwnProperty.call(colorHistoryMap, key_projectId))
			{
				var projectId = key_projectId;
				var buildingsMap = colorHistoryMap[projectId];
				if (buildingsMap === undefined)
				{ continue; }
				
				for (var key_dataKey in buildingsMap)
				{
					if (Object.prototype.hasOwnProperty.call(buildingsMap, key_dataKey))
					{
						var dataKey = key_dataKey;
						var dataValue = buildingsMap[key_dataKey];
						if (dataValue === undefined)
						{ continue; }
						
						for (var objectId in dataValue)
						{
							if (Object.prototype.hasOwnProperty.call(dataValue, objectId))
							{
								var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
								if (node === undefined || node.data === undefined)
								{ continue; }
							
								node.data.isColorChanged = false;
								node.data.colorChangedHistoryMap = undefined;
								
								var neoBuilding = node.data.neoBuilding;
								if (neoBuilding === undefined)
								{ continue; }
							
								var refObjectArray = neoBuilding.getReferenceObjectsArrayByObjectId(objectId);
								if (refObjectArray === undefined)
								{ continue; }
								
								var refObjectsCount = refObjectArray.length;
								for (var i=0; i<refObjectsCount; i++)
								{
									var refObject = refObjectArray[i];
									if (refObject)
									{
										refObject.aditionalColor = undefined;
									}
								}	
							}
						}	
					}
				}	
			}
		}
		
		MagoConfig.clearColorHistory();
	}
	else if (apiName === "changeInsertIssueMode") 
	{
		this.magoPolicy.setIssueInsertEnable(api.getIssueInsertEnable());
		//selectedObjectCallback(이걸 해 주면 될거 같음)
	}
	else if (apiName === "changeObjectInfoViewMode") 
	{
		// object info 표시
		this.magoPolicy.setObjectInfoViewEnable(api.getObjectInfoViewEnable());
	}
	else if (apiName === "changeNearGeoIssueListViewMode") 
	{
		// issue list 표시
		this.magoPolicy.setNearGeoIssueListEnable(api.getNearGeoIssueListEnable());
		if (!api.getNearGeoIssueListEnable()) 
		{
			// clear objMarkerManager objectmakersarrays 사이즈를 0 으로 하면... .됨
			this.objMarkerManager.objectMarkerArray = [];
		}
	}
	else if (apiName === "changeOcclusionCulling") 
	{
		// OcclusionCulling 적용 유무
		this.magoPolicy.setOcclusionCullingEnable(api.getOcclusionCullingEnable());
		var neoBuilding = this.selectionManager.currentBuildingSelected;
		if (neoBuilding)
		{ neoBuilding.setRenderSettingApplyOcclusionCulling(this.magoPolicy.getOcclusionCullingEnable()); }
		// dataKey 는 api.getDataKey();
	}
	else if (apiName === "drawInsertIssueImage") 
	{
		DrawAPI.drawInsertIssueImage(api, this);
	}
	else if (apiName === "changeInsertIssueState")
	{
		this.sceneState.insertIssueState = 0;
	}
	else if (apiName === "changeLod")
	{
		LodAPI.changeLod(api, this);
	}
	else if (apiName === "changeLighting")
	{
		var ambient = api.getAmbientReflectionCoef();
		var difusse = api.getDiffuseReflectionCoef();
		var specular = api.getSpecularReflectionCoef();
		var specularColor = api.getSpecularColor();
		
		this.magoPolicy.setAmbientReflectionCoef(api.getAmbientReflectionCoef());
		this.magoPolicy.setDiffuseReflectionCoef(api.getDiffuseReflectionCoef());
		this.magoPolicy.setSpecularReflectionCoef(api.getSpecularReflectionCoef());
		this.magoPolicy.setSpecularColor(api.getSpecularColor());
		
		this.sceneState.ambientReflectionCoef[0] = Number(ambient); // 0.2.
		this.sceneState.diffuseReflectionCoef[0] = Number(difusse); // 1.0
		this.sceneState.specularReflectionCoef[0] = Number(specular); // 0.7
		//this.sceneState.specularColor[0] = Number(specular); // 0.7
	}
	else if (apiName === "changeSsaoRadius")
	{
		var ssaoRadius = api.getSsaoRadius();
		this.magoPolicy.setSsaoRadius(ssaoRadius);
		this.sceneState.ssaoRadius[0] = Number(ssaoRadius);
	}	
	else if (apiName === "changeFPVMode")
	{
		if (api.getFPVMode())
		{
			if (this.cameraFPV._camera !== undefined)	{ return; }

			this.cameraFPV.init();

			 if (this.configInformation.geo_view_library === Constant.CESIUM)
			{
				var scratchLookAtMatrix4 = new Cesium.Matrix4();
				var scratchFlyToBoundingSphereCart4 = new Cesium.Cartesian4();
				var camera = this.scene.camera;

				this.cameraFPV._camera = camera;
				this.cameraFPV._cameraBAK = Cesium.Camera.clone(camera, this.cameraFPV._cameraBAK);
	
				var position = new Cesium.Cartesian3();
				var direction = new Cesium.Cartesian3();
				var up = new Cesium.Cartesian3();
	
				var cameraCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
				cameraCartographic.height = this.scene.globe.getHeight(cameraCartographic) + 1.5;
	
				this.scene.globe.ellipsoid.cartographicToCartesian(cameraCartographic, position);
				var transform = Cesium.Transforms.eastNorthUpToFixedFrame(position, Cesium.Ellipsoid.WGS84, scratchLookAtMatrix4);
				Cesium.Cartesian3.fromCartesian4(Cesium.Matrix4.getColumn(transform, 1, scratchFlyToBoundingSphereCart4), direction);
				Cesium.Cartesian3.fromCartesian4(Cesium.Matrix4.getColumn(transform, 2, scratchFlyToBoundingSphereCart4), up);
	
				camera.flyTo({
					destination : position,
					orientation : {
						direction : direction,
						up        : up
					},
					duration: 1
				});
			}
		}
		else 
		{
			if (this.cameraFPV._cameraBAK === undefined)	{ return; }
			if (this.configInformation.geo_view_library === Constant.CESIUM)
			{
				this.scene.camera = Cesium.Camera.clone(this.cameraFPV._cameraBAK, this.scene.camera);
			}
			this.cameraFPV.release();
		}
	}
	else if (apiName === "changePropertyRendering") 
	{
		var visible = api.getShowShadow();
		var projectId = api.getProjectId();
		var property = api.getProperty();
		var splittedWords = property.split("=");
		var propertyKey = splittedWords[0];
		var propertyValue = splittedWords[1];
		
		if (this.propertyFilterSC === undefined)
		{ this.propertyFilterSC = {}; }
		
		this.propertyFilterSC.visible = visible;
		this.propertyFilterSC.projectId = projectId;
		this.propertyFilterSC.propertyKey = propertyKey;
		this.propertyFilterSC.propertyValue = propertyValue;

	}	
	else if (apiName === "drawAppendData")
	{
		DrawAPI.drawAppendData(api, this);
	}
	else if (apiName === "drawDeleteData")
	{
		this.deleteAll();
	}
	else if (apiName === "clearAllData")
	{
		this.deleteAll();
	}
	else if (apiName === "getDataInfoByDataKey")
	{
		var projectId = api.getProjectId(); // for example : 3ds, collada, ifc, etc.***
		var dataKey = api.getDataKey();
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		
		if (node === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var dataName = node.data.data_name;
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (dataName === undefined || geoLocDataManager === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		
		if (geoLocdata === undefined || geoLocdata.geographicCoord === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var projectId = node.data.projectId;
		var latitude = geoLocdata.geographicCoord.latitude;
		var longitude = geoLocdata.geographicCoord.longitude;
		var altitude = geoLocdata.geographicCoord.altitude;
		var heading = geoLocdata.heading;
		var pitch = geoLocdata.pitch;
		var roll = geoLocdata.roll;
		
		dataInfoCallback(		MagoConfig.getPolicy().geo_callback_dataInfo,
			projectId,
			dataKey,
			dataName,
			latitude,
			longitude,
			altitude,
			heading,
			pitch,
			roll);
	}
	else if (apiName === "gotoProject")
	{
		var projectId = api.getProjectId();
		//if (!this.hierarchyManager.existProject(projectId))
		//{
		//	var projectDataFolder = api.getProjectDataFolder();
		//	this.getObjectIndexFile(projectId, projectDataFolder);
		//}
		
		var nodeMap = this.hierarchyManager.getNodesMap(projectId);
		if (Object.keys(nodeMap).length === 0)
		{
			var projectDataFolder = api.getProjectDataFolder();
			this.getObjectIndexFile(projectId, projectDataFolder);
		}
		
		
		this.flyTo(api.getLongitude(), api.getLatitude(), api.getElevation(), api.getDuration());
	}
	else if (apiName === "gotoIssue")
	{
		var projectId = api.getProjectId();
		if (!this.hierarchyManager.existProject(projectId))
		{
			var projectDataFolder = api.getProjectDataFolder();
			this.getObjectIndexFile(projectId, projectDataFolder);
		}
		
		this.flyTo(api.getLongitude(), api.getLatitude(), api.getElevation(), api.getDuration());
		
		// pin을 그림
		if (api.getIssueId() !== null && api.getIssueType() !== undefined) 
		{
			DrawAPI.drawInsertIssueImage(api, this);
		}
	}
	else if (apiName === "gotoFly")
	{
		this.flyTo(api.getLongitude(), api.getLatitude(), api.getElevation(), api.getDuration());
	}
	else if (apiName === "getCoordinateRelativeToBuilding") 
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		var worldPoint = api.getInputPoint();
		var resultPoint = api.getResultPoint();
		
		if (projectId === undefined || dataKey === undefined || worldPoint === undefined)
		{ return undefined; }
		
		if (resultPoint === undefined)
		{ resultPoint = new Point3D(); }
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		
		if (node === undefined)
		{ return undefined; }
		
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (geoLocDataManager === undefined)
		{ return undefined; }
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		resultPoint = geoLocdata.worldCoordToLocalCoord(worldPoint, resultPoint);
		return resultPoint;
	}
	else if (apiName === "getAbsoluteCoodinateOfBuildingPoint") 
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		var localPoint = api.getInputPoint();
		var resultPoint = api.getResultPoint();
		
		if (projectId === undefined || dataKey === undefined || localPoint === undefined)
		{ return undefined; }
		
		if (resultPoint === undefined)
		{ resultPoint = new Point3D(); }
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		
		if (node === undefined)
		{ return undefined; }
		
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (geoLocDataManager === undefined)
		{ return undefined; }
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		resultPoint = geoLocdata.localCoordToWorldCoord(localPoint, resultPoint);
		return resultPoint;
	}
	else if (apiName === "changeMagoMode") 
	{
		console.log("changeMagoMode");
	}
	else if (apiName === "getCameraCurrentPosition")
	{
		var unit = api.getUnit();
		if (this.configInformation.geo_view_library === Constant.CESIUM)
		{
			var position = this.scene.camera.position;
		
			switch (unit)
			{
			case CODE.units.METRE : return position;
			case CODE.units.RADIAN : return Cesium.Cartographic.fromCartesian(position);
			case CODE.units.DEGREE : {
				var cartographicPosition = Cesium.Cartographic.fromCartesian(position);
				return {
					lat : Cesium.Math.toDegrees(cartographicPosition.latitude),
					lon : Cesium.Math.toDegrees(cartographicPosition.longitude),
					alt : cartographicPosition.height
				};
			}
			}
		}
	}
	else if (apiName === "getCameraCurrentOrientaion")
	{
		if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
		{
			var camera = this.scene.camera;
			if (!camera)
			{
				throw new Error('Camera is broken.');
			}
			return {
				heading : Cesium.Math.toDegrees(camera.heading),
				pitch   : Cesium.Math.toDegrees(camera.pitch),
				roll    : Cesium.Math.toDegrees(camera.roll)
			};
		}
	}
	else if (apiName === "changeCameraOrientation")
	{	
		//수정필요, 카메라가 세슘카메라
		var camera = this.scene.camera;
		var heading = defaultValue(api.getHeading(), Cesium.Math.toDegrees(camera.heading));
		var pitch = defaultValue(api.getPitch(), Cesium.Math.toDegrees(camera.pitch));
		var roll = defaultValue(api.getRoll(), Cesium.Math.toDegrees(camera.roll));
		var duration = defaultValue(api.getDuration(), 0);

		if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
		{
			var camera = this.scene.camera;
			if (!camera)
			{
				throw new Error('Camera is broken.');
			}

			camera.flyTo({
				destination : camera.positionWC,
				orientation : {
					heading : Cesium.Math.toRadians(heading),
					pitch   : Cesium.Math.toRadians(pitch),
					roll    : Cesium.Math.toRadians(roll)
				},
				duration: parseInt(duration)
			});
		}
	}
	else if (apiName === "instantiateStaticModel")
	{
		var attributes = api.getInstantiateObj();
		this.instantiateStaticModel(attributes);
	}
	else if (apiName === "addStaticModel")
	{
		var attribute = api.getStaticModelAttributeObj();
		this.addStaticModel(attribute);
	}
	else if (apiName === "setTrackNode")
	{
		var node = this.hierarchyManager.getNodeByDataKey(api.getProjectId(), api.getDataKey());
		if (!defined(node))
		{
			throw new Error("This node is not exist.");
		}

		if (node.isReadyToRender)
		{
			var geoLocDataManager = node.getNodeGeoLocDataManager();
			var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
			var geoCoords = geoLocData.getGeographicCoords();

			var currLon = geoCoords.longitude;
			var currLat = geoCoords.latitude;

			this.flyTo(currLon, currLat, 100, 0);
			var camera = this.sceneState.camera;
			camera.stopTrack(this);
			camera.setTrack(node, api.getTrackOption());
		}
	}
	else if (apiName === "stopTrack")
	{
		this.sceneState.camera.stopTrack(this);
	}
	else if (apiName === "isExistStaticModel")
	{
		return this.isExistStaticModel(api.getProjectId());
	}
	else if (apiName === "isExistData")
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		if (node !== undefined)
		{
			return true;
		}

		return false;
		
	}
	else if (apiName === "isDataReadyToRender")
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);

		if (node !== undefined)
		{
			if (node.isReadyToRender())
			{
				return true;
			}
		}

		return false;
	}
	else if (apiName === "setNodeAttribute")
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		var attribute = api.getNodeAttribute();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);

		if (node !== undefined)
		{
			if (node.data) 
			{
				var nodeData = node.data;
				if (!nodeData.attributes) 
				{
					nodeData.attributes = {};
				}
				var myAttribute = nodeData.attributes;

				for (var key in attribute)
				{
					if (attribute.hasOwnProperty(key)) 
					{
						myAttribute[key] = attribute[key];
					}
				}
			}
		}

		return false;
	}
	else if (apiName === 'togglePointCloudColor') 
	{
		var renderingSettings = this._settings.getRenderingSettings();
		var pointsCloudColorRamp = renderingSettings.getPointsCloudInColorRamp();
		renderingSettings.setPointsCloudInColorRamp(!pointsCloudColorRamp);
	}
};

MagoManager.prototype.deleteAll = function ()
{
	// deselect.
	this.selectionManager.clearCandidates();
	this.selectionManager.clearCurrents();
	this.objectSelected = undefined;
	this.octreeSelected = undefined;
	this.buildingSelected = undefined;
	this.nodeSelected = undefined;
	
	// erase from processQueue and parseQueue. 
	this.parseQueue.clearAll();
	this.processQueue.clearAll();
	
	// clear current visibles.
	if (this.visibleObjControlerBuildings)
	{ this.visibleObjControlerBuildings.clear(); }
	if (this.visibleObjControlerNodes)
	{ this.visibleObjControlerNodes.clear(); }
	if (this.visibleObjControlerOctrees)
	{ this.visibleObjControlerOctrees.clear(); }
	
	// reset tiles.
	this.smartTileManager.resetTiles();
	
	// finally delete nodes.
	this.hierarchyManager.deleteNodes(this.sceneState.gl, this.vboMemoryManager);
};

MagoManager.prototype.checkCollision = function (position, direction)
{
	var gl = this.sceneState.gl;
	if (gl === undefined)	{ return; }

	var posX = this.sceneState.drawingBufferWidth * 0.5;
	var posY = this.sceneState.drawingBufferHeight * 0.5;
	
	var objects = this.getSelectedObjects(gl, posX, posY, this.arrayAuxSC);
	if (objects === undefined)	{ return; }

	var current_building = this.buildingSelected;
	this.buildingSelected = this.arrayAuxSC[0];

	var collisionPosition = new Point3D();
	var bottomPosition = new Point3D();

	ManagerUtils.calculatePixelPositionWorldCoord(gl, posX, posY, collisionPosition, undefined, undefined, undefined, this);
	this.swapRenderingFase();
	ManagerUtils.calculatePixelPositionWorldCoord(gl, posX, this.sceneState.drawingBufferHeight, undefined, undefined, undefined, this);

	this.buildingSelected = current_building;
	var distance = collisionPosition.squareDistTo(position.x, position.y, position.z);
	this.swapRenderingFase();

	if (distance > 3.5)
	{
		var bottomPositionCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(bottomPosition);
		var currentPositionCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(position);
		var currentHeight = currentPositionCartographic.height;
		var bottomHeight = bottomPositionCartographic.height + 1.5;
	
		if ( bottomHeight < currentHeight )
		{
			currentHeight -= 0.2;
		}
	
		if ( bottomHeight > currentHeight || 
			(bottomHeight < currentHeight && currentHeight - bottomHeight > 1.5))
		{
			currentHeight = bottomHeight;
		}
		var tmpLat = Cesium.Math.toDegrees(currentPositionCartographic.latitude);
		var tmpLon = Cesium.Math.toDegrees(currentPositionCartographic.longitude);
		
		this.cameraFPV.camera.position = Cesium.Cartesian3.fromDegrees(tmpLon, tmpLat, currentHeight);

		return false; 
	}

	return true;
};
