// REQUIMENT
var libxmljs = require("libxmljs"), 
	expatParser = require('xml2json'), 
	SchemaTypes = require('./XMLSchemaTypes'), 
    util = require('util'), 
    format = require('util').format

/**
 * Class to parse & compile SOAP XML post
 * @class WSDLService.XMLSchema
 */

/**
 * @constructor
 * @param {Object} WSDLObject Class of description XMLShema & WSDL
 */
function XMLSchema(WSDLObject){
	this.elements = WSDLObject.elements
	this.complexTypes = WSDLObject.complexTypes	
	this.tnsUrl = WSDLObject.config.root	
}


/**
 * Normalize namespace of object
 * @method _normolizeXMLObject
 * @private
 * @param  {Object} obj Source object
 * @return {Object}     Normolize object
 */
XMLSchema.prototype._normolizeXMLObject = function(obj) {
	var isArray = util.isArray, 
		result = isArray(obj) ? [] : {} 		
	// Normolize object element name
	function nN(name){
		var r = name.split(':')
		return r[r.length-1]
	}
	// Plunk all elements
	for(var key in obj){
		if(typeof obj[key] === 'object') {
			result[isNaN(key) ? nN(key) : key] = this._normolizeXMLObject(obj[key])			
		} else {
			result[nN(key)] = obj[key]
		}
	}
	return result
}

/**
 * Compile responce object by XML Shema preferance
 * @private
 * @method _convertXMLObject
 * @param  {string} shemaElementName Shema type name
 * @param  {Object} obj              Source object
 * @return {Object}                  Compiling object
 */
XMLSchema.prototype._convertXMLObject = function(shemaElementName, obj) {
	// Check on exist type in description
	if(!this.elements[shemaElementName] && !this.complexTypes[shemaElementName])
		return new Error(format('Data type with name %s no define in shema', shemaElementName))
	// Define vars
	var result = {}, 
		isArray = util.isArray, 
		elSequence = (this.elements[shemaElementName] || this.complexTypes[shemaElementName]).sequence
	// PLunk all elems of type object 
	for(var elName in elSequence){
		// If is standart shema type
		if(SchemaTypes.isType(elSequence[elName].type)){
			result[elName] = typeof obj[elName] !== 'undefined' ? 
				SchemaTypes.toType(
					elSequence[elName].type, 
					obj[elName]
				) : null
		}else{
			// if defined shema type - recursice!!!!
			if(elSequence[elName].maxOccurs>1){
				// if define maxOccurs over 1 render array
				result[elName] = []
				if(isArray(obj[elName])){
					var me  = this
					// run forEach
					obj[elName].forEach(function(item){
						result[elName].push(me._convertXMLObject(
							elSequence[elName].type, 
							item || {}
						))
					})
				}else{
					// push single sequence
					result[elName].push(this._convertXMLObject(
						elSequence[elName].type, 
						obj[elName] || {}
					))
				}
			} else {
				// Run recursion for inner sequence
				result[elName] = this._convertXMLObject(
					elSequence[elName].type, 
					obj[elName] || {}
				)
			}
		}
	}
	// inspect(obj)
	return result
}


/**
 * Parsen XML request
 * @method parseXML
 * @param  {string} xmlString XML string
 * @param  {string} shemaElementName Root type name
 * @return {Object} parsed XML request in object
 */
XMLSchema.prototype.parseXML = function(xmlString, shemaElementName){
	// Check on exist shema element name
	if(!this.elements[shemaElementName]) 
		return new Error(format('Shema type with name %s don\'t defined', shemaElementName))
	// Define vars
	var xmlBody, xmlns = {}, namespace = '',  xmlObj
	// Parse XML string
	xmlObj = expatParser.toJson(xmlString, {object: true})
	xmlObj = xmlObj[Object.keys(xmlObj)[0]]
	
	// inspect(xmlObj)

	// devide xmlns and env:body
	for(var key in xmlObj){
		// If body
		if(/:body$/i.test(key)){
			xmlBody = xmlObj[key]
			continue
		}
		// if namespace
		if(/^xmlns:/i.test(key)){
			// console.log('XMLNS %s = %s', key, xmlObj[key])
			xmlns[key.replace(/xmlns:/i, '')] = xmlObj[key]
			// Check on target namespace
			if(xmlObj[key] == this.tnsUrl)
				namespace = key.replace(/xmlns:/i, '')
		}
	}
	// Normolize object names
	xmlBody = this._normolizeXMLObject(xmlBody)
	// Convert object to JS vars
	xmlBody = this._convertXMLObject(shemaElementName, xmlBody[shemaElementName])
	return xmlBody
}

/**
 * Compile responce from object and type define
 * @method compileXML
 * @param  {Object} 	obj              	Responce object
 * @param  {string} 	shemaElementName 	Shema element name
 * @param  {XMLNode} 	root            	If need insert in excist document
 * @return {XMLDocument}			 		Compiled XMLDocument                  
 */
XMLSchema.prototype.compileXML = function(obj, shemaElementName, root){
	// Check on exist shema element name
	if(!this.elements[shemaElementName] && !this.complexTypes[shemaElementName]) 
		return new Error(format('Shema type with name %s don\'t defined', shemaElementName))
	// Define vars
	var XML = null, 
		isRootBranch = false, 
		isArray = util.isArray, 
		elSequence = (this.elements[shemaElementName] || this.complexTypes[shemaElementName]).sequence
	// Create XML document root if not defined
	if(!root){
		isRootBranch = true
		XML = new libxmljs.Document()
		root = XML
			.node('soap:Envelope').attr({
				'xmlns:xsi':  'http://www.w3.org/2001/XMLSchema-instance',  
				'xmlns:xsd':  'http://www.w3.org/2001/XMLSchema', 
				'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/'
			})
			.node('soap:Body')
	}
	
	//Check on obj define
	if(typeof obj == 'undefined') return XML

	// Create data branch
	var branch = root.node(shemaElementName)
	isRootBranch && branch.attr('xmlns', this.tnsUrl)
	
	// PLunk all elems of type object 
	for(var elName in elSequence){
		// If is standart shema type
		if(SchemaTypes.isType(elSequence[elName].type)){
			branch.node(elName, typeof obj[elName] !== 'undefined' ? 
				SchemaTypes.toXML(
					elSequence[elName].type, 
					obj[elName]
				) : null
			)			
		}else{
			// console.log(elSequence[elName])
			// if defined shema type - recursice!!!!
			if(
				(
					elSequence[elName].maxOccurs>1 ||
					elSequence[elName].maxOccurs === 'unbounded'
				)&& isArray(obj[elName])
			){
				// console.log('ISARRAY', obj)
				var me  = this
				// run forEach
				obj[elName].forEach(function(item){
					// Run recursion for inner sequence
					me.compileXML(
						item, 
						elSequence[elName].type, 
						branch
					)
				})				
			} else {
				// Run recursion for inner sequence
				this.compileXML(
					obj[elName], 
					elSequence[elName].type, 
					branch
				)
			}
		}
	}
	// console.log(XML.toString())
	return XML
}

/**
 * Create error responce by err object
 * @method compileErrorXML
 * @param  {Object} errObject Err object (code, string, detail)
 * @return {string}           XML responce string
 */
XMLSchema.prototype.compileErrorXML = function(errObject){
	var faultResponce = ''
		+ '<?xml version="1.0" encoding="UTF-8"?>'
		+ '<SOAP-ENV:Envelope xmlns:namesp8="http://xml.apache.org/xml-soap"'
			+ ' xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"'
			+ ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
			+ ' xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"'
			+ ' xmlns:namesp4="http://namespaces.soaplite.com/perl"'
			+ ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"'
			+ ' SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"'
		+ '>'
			+ '<SOAP-ENV:Body>'
				+ '<SOAP-ENV:Fault>'
					+ '<faultcode type="xsd:string">%s</faultcode>'
					+ '<faultstring type="xsd:string">%s</faultstring>'
					+ '<faultactor type="xsd:string">%s</faultactor>'
					+ '<detail type="xsd:string">%s</detail>'
				+ '</SOAP-ENV:Fault>'
			+ '</SOAP-ENV:Body>'
		+ '</SOAP-ENV:Envelope>'
	return format(faultResponce, errObject.code, errObject.message, 'Develop in progress', 'Develop in progress')
}



//EXPORT
module.exports = XMLSchema;