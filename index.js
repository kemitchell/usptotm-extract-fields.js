var JSONPath = require('JSONPath')
var Parser = require('node-expat').Parser
var fields = require('./fields')
var find = require('array-find')
var uniq = require('array-uniq')

function formatDate(argument) {
  return (
    argument.slice(0, 4) + '-' +
    argument.slice(4, 6) + '-' +
    argument.slice(6, 8)) }

function extractFields(input, callback) {
  var parser = new Parser('UTF-8')
  var currentNode

  function onCaseFile(caseFile) {
    process.nextTick(function() {
      var result = {}
      Object.keys(fields)
        .forEach(function(key) {
          var path = fields[key]
          result[key] = JSONPath.eval(caseFile, path)[0] || null })
      var classifications = find(caseFile.children, function(element) {
        return element.name === 'classifications' })
      ;['filingDate', 'publicationDate', 'registrationDate', 'renewalDate']
        .forEach(function(dateKey) {
          var dateString = result[dateKey]
          if (dateString) {
            result[dateKey] = formatDate(dateString) } })
      var internationalClassifications = (
        classifications
          .children
          .filter(function(child) {
            return child.name === 'classification' })
          .map(function(child) {
            return find(child.children, function(child) {
              return child.name === 'international-code' })
              .text }) )
      result.internationalClassifications = internationalClassifications
      var caseFileOwners = find(caseFile.children, function(element) {
        return element.name === 'case-file-owners' })
      var owners = (
        caseFileOwners
          .children
          .filter(function(child) {
            return child.name === 'case-file-owner' })
          .map(function(child) {
            return find(child.children, function(child) {
              return child.name === 'party-name' })
              .text }) )
      result.owners = uniq(owners)
      callback(null, result) }) }

  parser
    .on('startElement', function(name, attributes) {
      if (name === 'case-file' || currentNode) {
        currentNode = {
          name: name,
          attributes: attributes,
          parent: currentNode }
        if (Object.keys(attributes).length < 1) {
          delete currentNode.attributes } } })
    .on('text', function(text) {
      if (currentNode) {
        if (!currentNode.text) {
          currentNode.text = text }
        else {
          currentNode.text += text } } })
    .on('endElement', function(name) {
      if (currentNode) {
        if (currentNode.name === 'case-file') {
          if (currentNode.parent) {
            throw new Error() }
          onCaseFile(currentNode) }
        parent = currentNode.parent
        if (parent) {
          delete currentNode.parent
          if (!parent.children) {
            parent.children = [] }
          parent.children.push(currentNode)
          parent[currentNode.name] = currentNode }
        currentNode = parent } })
  if (typeof input === 'string') {
    parser.parse(input) }
  else {
    input
      .on('data', function(data) {
        parser.parse(data.toString()) }) } }

module.exports = extractFields
