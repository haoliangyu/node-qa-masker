'use strict';Object.defineProperty(exports,'__esModule',{value:true});var _createClass=(function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if('value'in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}})();function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError('this hasn\'t been initialised - super() hasn\'t been called')}return call&&(typeof call==='object'||typeof call==='function')?call:self}function _inherits(subClass,superClass){if(typeof superClass!=='function'&&superClass!==null){throw new TypeError('Super expression must either be null or a function, not '+typeof superClass)}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function')}}var gdal=require('gdal');var ndarray=require('ndarray');var path=require('path');/**
 * Lowest level masker that provides functions to manipulate the bit number of QA band.
 */var Masker=exports.Masker=(function(){function Masker(data){_classCallCheck(this,Masker);if(typeof data==='string'){this.loadFile(data)}else{this.loadData(data)}}/**
   * Load raster image file.
   * @param {string}  filePath  path of image file. Supported format: tif (Landsat)
   * @return {undefined}
   */_createClass(Masker,[{key:'loadFile',value:function loadFile(filePath){var ext=path.extname(filePath).toLowerCase();if(ext!=='.tif'){throw new Error('Unsupport file format '+ext)}var dataset=gdal.open(filePath);this.bandData=dataset.bands.get(1);this.rasterSize=dataset.rasterSize;this.geoTransform=dataset.geoTransform;this.srs=dataset.srs}/**
   * Load GDAL raster band data
   * @param {object}  bandData  GDAL band data
   * @return {undefined}
   */},{key:'loadData',value:function loadData(bandData){this.bandData=bandData}/**
   * Generate mask with given bit information
   * @param   {Number}     bitPos          bit position
   * @param   {Number}     bitLen          bit length
   * @param   {Number}     value           condition value
   * @param   {String}     [operator="="]  the desired relationship between the quality assessment code and given vaule
   * @return  {ndarray}    mask            a ndarray mask
   */},{key:'getMask',value:function getMask(bitPos,bitLen,value,operator){var x=this.rasterSize.x;var y=this.rasterSize.y;var bitMask=parseInt(Array(bitLen).fill('1').join(''),2)<<bitPos;var valueMask=value<<bitPos;var data=new Uint32Array(new ArrayBuffer(x*y*4));var check=void 0;switch(operator){case'>':check=function check(value){return(value&bitMask)>valueMask?1:0};break;case'>=':check=function check(value){return(value&bitMask)>=valueMask?1:0};break;case'<':check=function check(value){return(value&bitMask)<valueMask?1:0};break;case'<=':check=function check(value){return(value&bitMask)<=valueMask?1:0};break;default:check=function check(value){return(value&bitMask)===valueMask?1:0};}this.bandData.pixels.read(0,0,x,y,data);var mask=data.map((function(value){return check(value)}));return ndarray(mask,[x,y])}/**
   * Save generated mask as a .tif file.
   * @param   {ndarray}     mask      ndarray mask
   * @param   {String}      filePath  tif file path
   * @return  {undefined}
   */},{key:'saveAsTif',value:function saveAsTif(mask,filePath){filePath='mask.tif'||filePath;var ext=path.extname(filePath).toLowerCase();if(ext!=='.tif'){throw new Error('Unsupport file format '+ext)}var driver=gdal.drivers.get('GTiff');var dataset=driver.create(filePath,this.rasterSize.x,this.rasterSize.y,1,gdal.GDT_Byte);var bandData=dataset.bands.get(1);bandData.pixels.write(0,0,this.rasterSize.x,this.rasterSize.y,mask.data);dataset.srs=this.srs;dataset.geoTransform=this.geoTransform;dataset.flush()}},{key:'__getBitMask',value:function __getBitMask(bitPos,bitLen){return parseInt(Array(bitLen).fill('1').join(''),2)<<bitPos}},{key:'__getValueMask',value:function __getValueMask(bitPos,value){return value<<bitPos}}]);return Masker})();/**
 * Confidence of certain condition exists at the raster pixel
 */var LandsatConfidence=exports.LandsatConfidence={/**
   * Algorithm has high confidence that this condition exists (67-100 percent confidence)
   * @type {Number}
   */high:3,/**
   * Algorithm has medium confidence that this condition exists (34-66 percent confidence)
   * @type {Number}
   */medium:2,/**
   * Algorithm has low to no confidence that this condition exists (0-33 percent confidence)
   * @type {Number}
   */low:1,/**
   * Algorithm did not determine the status of this condition.
   * @type {Number}
   */undefined:0};/**
 * Provides access to functions that produces masks from quality assessment band of Landsat 8.
 */var LandsatMasker=exports.LandsatMasker=(function(_Masker){_inherits(LandsatMasker,_Masker);function LandsatMasker(data){_classCallCheck(this,LandsatMasker);var _this=_possibleConstructorReturn(this,(LandsatMasker.__proto__||Object.getPrototypeOf(LandsatMasker)).call(this,data));_this.bitInfo={cloud:{position:14,length:2},cirrus:{position:12,length:2},veg:{position:8,length:2},water:{position:4,length:2},snow:{position:10,length:2},fill:{position:0,length:1}};return _this}/**
   * get a cloud mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */_createClass(LandsatMasker,[{key:'getCloudMask',value:function getCloudMask(confidence,options){options=options||{};var bit=this.bitInfo.cloud;return this.getMask(bit.position,bit.length,confidence,options.operator)}/**
   * get a cirrus mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */},{key:'getCirrusMask',value:function getCirrusMask(confidence,options){options=options||{};var bit=this.bitInfo.cirrus;return this.getMask(bit.position,bit.length,confidence,options.operator)}/**
   * get a cirrus mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */},{key:'getVegMask',value:function getVegMask(confidence,options){options=options||{};var bit=this.bitInfo.veg;return this.getMask(bit.position,bit.length,confidence,options.operator)}/**
   * get a water body mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */},{key:'getWaterMask',value:function getWaterMask(confidence,options){options=options||{};var bit=this.bitInfo.water;return this.getMask(bit.position,bit.length,confidence,options.operator)}/**
   * get a snow/ice mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */},{key:'getSnowMask',value:function getSnowMask(confidence,options){options=options||{};var bit=this.bitInfo.snow;return this.getMask(bit.position,bit.length,confidence,options.operator)}/**
   * get a mask of filled pixels
   * @return  {ndarray} mask                a ndarray mask
   */},{key:'getFillMask',value:function getFillMask(){var bit=this.bitInfo.fill;return this.getMask(bit.position,bit.length,1)}/**
   * get a mask that matches all given conditions
   * @param   {object[]}  conditions            a list of condition
   * @param   {object}    condition.type        conditon type: cloud, cirrus, veg, water, snow
   * @param   {integer}   condition.confidence  confidence value from LandsatConfidence
   * @return  {ndarray}   mask                  a ndarray mask
   */},{key:'getMultiMask',value:function getMultiMask(conditions){var _this2=this;if(!Array.isArray(conditions)||conditions.length<1){throw new Error('Mask conditions is invalid.')}var x=this.rasterSize.x;var y=this.rasterSize.y;var bitMask=0;var valueMask=0;conditions.forEach((function(condition){var bit=_this2.bitInfo[condition.type];bitMask=bitMask|_this2.__getBitMask(bit.position,bit.length);valueMask=valueMask|_this2.__getValueMask(bit.position,condition.confidence)}));var data=new Uint32Array(new ArrayBuffer(x*y*4));this.bandData.pixels.read(0,0,x,y,data);var mask=data.map((function(value){return(value&bitMask)===valueMask?1:0}));return ndarray(mask,[x,y])}}]);return LandsatMasker})(Masker);/**
 * Level of data quality of MODIS land products at each pixel.
 * @type {Object}
 */var ModisQuality=exports.ModisQuality={/**
   * Corrected product produced at ideal quality for all bands.
   * @type {Number}
   */high:0,/**
   * Corrected product produced at less than ideal quality for some or all bands.
   * @type {Number}
   */medium:1,/**
   * Corrected product not produced due to some reasons for some or all bands.
   * @type {Number}
   */low:2,/**
   * Corrected product not produced due to cloud effects for all bands.
   * @type {Number}
   */low_cloud:3};/**
 * Provides access to functions that produce QA masks from quality assessment band of MODIS land products.
 */var ModisMasker=exports.ModisMasker=(function(_Masker2){_inherits(ModisMasker,_Masker2);function ModisMasker(){_classCallCheck(this,ModisMasker);return _possibleConstructorReturn(this,(ModisMasker.__proto__||Object.getPrototypeOf(ModisMasker)).apply(this,arguments))}_createClass(ModisMasker,[{key:'getQaMask',/**
   * get a quality mask.
   * @param   {Number}  quality             quality value from ModisQuality
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */value:function getQaMask(quality,options){options=options||{};return this.getMask(0,2,quality,options.operator)}}]);return ModisMasker})(Masker);