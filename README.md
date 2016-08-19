# node-qa-masker

This is a NodeJS port for [pymasker](https://github.com/haoliangyu/pymasker). It provides a convenient way to produce mask from the Quality Assessment band of Landsat, as well as MODIS land products.

## Installation

``` bash
npm install qa-masker
```

## Use Example

### Landsat 8

The `LandsatMasker` class provides the functionality to load and generate masks from the Quality Assessment band of Landsat 8 OLI image.

``` javascript
var qm = require('qa-masker');
var Masker = qm.LandsatMasker;
var Confidence = qm.LandsatConfidence;

// read the band file to initialize
var masker = new Masker('LC80170302016198LGN00_BQA.TIF');

// generate mask in ndarray format
var mask = masker.getWaterMask(Confidence.high);

// save the mask as GeoTIFF
masker.saveAsTif(mask, 'test.tif');
```

Five methods are provided for masking:

* `getCloudMask(confidence)`

* `getCirrusMask(confidence)`

* `getWaterMask(confidence)`

* `getVegMask(confidence)` (for vegetation)

* `getSnowMask(confidence)`

The `LandsatConfidence` class provide the definition of the confidence that certain condition exists at the pixel:

* `LandsatConfidence.high` (66% - 100% confidence)

* `LandsatConfidence.medium` (33% - 66% confidence)

* `LandsatConfidence.low` (0% - 33% confidence)

* `LandsatConfidence.undefined`

For more detail about the definition, please visit [the USGS Landsat website](http://landsat.usgs.gov/qualityband.php);

These five methods would return a [ndarray](https://github.com/scijs/ndarray) mask.

If a mask that matches multiple conditions is desired, the function `getMultiMask()` could help:

``` javascript
var mask = masker.getMultiMask([
  { type: 'could', confidence: LandsatConfidence.high },
  { type: 'cirrus', confidence: LandsatConfidence.medium }
]);
```

### MODIS Land Products

By using the lower level `Masker` class, the masking of MODIS land product QA band is supported. Because [node-gdal](https://github.com/scijs/ndarray) doesn't support HDF format, you need to convert the QA band to a GeoTIFF:

``` javascript
var masker = new Masker('modis_qa_band.tif');
var mask = masker.getMask(0, 2, 2);
```

`getMask(bitPos, bitLen, value)` function use to bit mask to extract quality mask:

* `bitPos` indicates the start position of quality assessment bits

* `bitLen` indicates the length of all used quality assessment bits

* `value` indicates the desired quality

For the detail explanation, please read [MODIS Land Product QA Tutorial](https://lpdaac.usgs.gov/sites/default/files/public/modis/docs/MODIS_LP_QA_Tutorial-1b.pdf).

### Command Line

If the command line tool is wanted, please use [pymasker](https://github.com/haoliangyu/pymasker).
