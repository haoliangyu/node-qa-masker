var gdal = require('gdal');
var ndarray = require('ndarray');
var ops = require("ndarray-ops");
var path = require('path');

/**
 * Lowest level masker that provides functions to manipulate the bit number of QA band.
 */
export class Masker {

  constructor(data) {
    if (typeof data === 'string') {
      this.loadFile(data);
    } else {
      this.loadData(data);
    }
  }

  /**
   * Load raster image file.
   * @param {string}  filePath  path of image file. Supported format: tif (Landsat)
   * @return {undefined}
   */
  loadFile(filePath) {
    let ext = path.extname(filePath).toLowerCase();

    if (ext !== '.tif') {
      throw new Error(`Unsupport file format ${ext}`);
    }

    let dataset = gdal.open(filePath);
    this.bandData = dataset.bands.get(1);
    this.rasterSize = dataset.rasterSize;
    this.geoTransform = dataset.geoTransform;
    this.srs = dataset.srs;
  }

  /**
   * Load GDAL raster band data
   * @param {object}  bandData  GDAL band data
   * @return {undefined}
   */
  loadData(bandData) {
    this.bandData = bandData;
  }

  /**
   * Generate mask with given bit information
   * @param   {Number}     bitPos          bit position
   * @param   {Number}     bitLen          bit length
   * @param   {Number}     value           condition value
   * @param   {String}     [operator="="]  the desired relationship between the quality assessment code and given vaule
   * @return  {ndarray}    mask            a ndarray mask
   */
  getMask(bitPos, bitLen, value, operator) {
    let x = this.rasterSize.x;
    let y = this.rasterSize.y;

    let bitMask = parseInt(Array(bitLen).fill('1').join(''), 2) << bitPos;
    let valueMask = value << bitPos;
    let data = new Uint32Array(new ArrayBuffer(x * y * 4));

    let check;
    switch(operator) {
      case '>':
        check = (value) => { return (value & bitMask) > valueMask ? 1 : 0; };
        break;
      case '>=':
        check = (value) => { return (value & bitMask) >= valueMask ? 1 : 0; };
        break;
      case '<':
        check = (value) => { return (value & bitMask) < valueMask ? 1 : 0; };
        break;
      case '<=':
        check = (value) => { return (value & bitMask) <= valueMask ? 1 : 0; };
        break;
      default:
        check = (value) => { return (value & bitMask) === valueMask ? 1 : 0; };
    }

    this.bandData.pixels.read(0, 0, x, y, data);

    let mask = data.map(value => {
      return check(value);
    });

    return ndarray(mask, [x, y]);
  }

  /**
   * Save generated mask as a .tif file.
   * @param   {ndarray}     mask      ndarray mask
   * @param   {String}      filePath  tif file path
   * @return  {undefined}
   */
  saveAsTif(mask, filePath) {
    filePath = 'mask.tif' || filePath;

    let ext = path.extname(filePath).toLowerCase();
    if (ext !== '.tif') {
      throw new Error(`Unsupport file format ${ext}`);
    }

    let driver = gdal.drivers.get('GTiff');
    let dataset = driver.create(filePath, this.rasterSize.x, this.rasterSize.y, 1, gdal.GDT_Byte);

    let bandData = dataset.bands.get(1);
    bandData.pixels.write(0, 0, this.rasterSize.x, this.rasterSize.y, mask.data);

    dataset.srs = this.srs;
    dataset.geoTransform = this.geoTransform;
    dataset.flush();
  }
}

/**
 * Confidence of certain condition exists at the raster pixel
 */
export const LandsatConfidence = {
  /**
   * Algorithm has high confidence that this condition exists (67-100 percent confidence)
   * @type {Number}
   */
  high: 3,

  /**
   * Algorithm has medium confidence that this condition exists (34-66 percent confidence)
   * @type {Number}
   */
  medium: 2,

  /**
   * Algorithm has low to no confidence that this condition exists (0-33 percent confidence)
   * @type {Number}
   */
  low: 1,

  /**
   * Algorithm did not determine the status of this condition.
   * @type {Number}
   */
  undefined: 0
};

/**
 * Provides access to functions that produces masks from quality assessment band of Landsat 8.
 */
export class LandsatMasker extends Masker {

  /**
   * get a cloud mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */
  getCloudMask(confidence, options) {
    options = options || {};
    return this.getMask(14, 2, confidence, options.operator);
  }

  /**
   * get a cirrus mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */
  getCirrusMask(confidence, options) {
    options = options || {};
    return this.getMask(12, 2, confidence, options.operator);
  }

  /**
   * get a cirrus mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */
  getVegMask(confidence, options) {
    options = options || {};
    return this.getMask(8, 2, confidence, options.operator);
  }

  /**
   * get a water body mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */
  getWaterMask(confidence, options) {
    options = options || {};
    return this.getMask(4, 2, confidence, options.operator);
  }

  /**
   * get a snow/ice mask
   * @param   {Number}  confidence          confidence value from LandsatConfidence
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */
  getSnowMask(confidence, options) {
    options = options || {};
    return this.getMask(10, 2, confidence, options.operator);
  }

  /**
   * get a mask that matches all given conditions
   * @param   {object[]}  conditions            a list of condition
   * @param   {object}    condition.type        conditon type: cloud, cirrus, veg, water, snow
   * @param   {integer}   condition.confidence  confidence value from LandsatConfidence
   * @return  {ndarray}   mask                  a ndarray mask
   */
  getMultiMask(conditions) {
    if (!Array.isArray(conditions) || conditions.length < 1) {
      throw new Error('Mask conditions is invalid.');
    }

    const x = this.rasterSize.x;
    const y = this.rasterSize.y;
    let result = ndarray(new Uint32Array(x * y * 4), [x, y]);

    let selection = result.hi(x, y).lo(0, 0);
    for(var i = 0; i < selection.shape[0]; ++i) {
      for(var j = 0; j < selection.shape[1]; ++j) {
        selection.set(i, j, 1);
      }
    }

    conditions.forEach(condition => {
      let mask;

      switch (condition.type) {
        case 'cloud':
          mask = this.getCloudMask(condition.confidence);
          break;
        case 'cirrus':
          mask = this.getCirrusMask(condition.confidence);
          break;
        case 'water':
          mask = this.getWaterMask(condition.confidence);
          break;
        case 'veg':
          mask = this.getVegMask(condition.confidence);
          break;
        case 'snow':
          mask = this.getSnowMask(condition.confidence);
          break;
        default:
          throw new Error(`Condition type ${condition.type} unrecongized`);
      }

      ops.band(result, result, mask);
    });

    return result;
  }
}

/**
 * Level of data quality of MODIS land products at each pixel.
 * @type {Object}
 */
export const ModisQuality = {

  /**
   * Corrected product produced at ideal quality for all bands.
   * @type {Number}
   */
  high: 0,

  /**
   * Corrected product produced at less than ideal quality for some or all bands.
   * @type {Number}
   */
  medium: 1,

  /**
   * Corrected product not produced due to some reasons for some or all bands.
   * @type {Number}
   */
  low: 2,

  /**
   * Corrected product not produced due to cloud effects for all bands.
   * @type {Number}
   */
  low_cloud: 3
};

/**
 * Provides access to functions that produce QA masks from quality assessment band of MODIS land products.
 */
export class ModisMasker extends Masker {

  /**
   * get a quality mask.
   * @param   {Number}  quality             quality value from ModisQuality
   * @param   {Object}  [options]           mask options
   * @param   {String}  [options.operator]  how the confidence is used in the mask generation
   * @return  {ndarray} mask                a ndarray mask
   */
  getQaMask(quality, options) {
    options = options || {};
    return this.getMask(0, 2, quality, options.operator);
  }

}
