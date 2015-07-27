var extract = require('./')
var fs = require('fs')
var glob = require('glob')
var path = require('path')

require('tape')('examples', function(test) {
  var xmlFiles = glob.sync('./examples/*.xml')
  test.plan(xmlFiles.length)
  xmlFiles.forEach(function(xmlFile) {
    extract(fs.createReadStream(xmlFile), function(error, result) {
      var basename = path.basename(xmlFile)
      var jsonFile = xmlFile.replace(/xml$/, 'json')
      test.deepLooseEqual(result, require(jsonFile), basename) }) }) })
