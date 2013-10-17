// REQUIMENT
var libxmljs = require("libxmljs"), 
	expatParser = require('xml2json'), 
	ShemaTypes = require('./XMLShemaTypes'), 
    util = require('util'), 
    format = require('util').format

/**
 * @constructor
 * @class Class to parse & compile SOAP XML post
 * @param {WSDL} WSDLObject Class of description XMLShema & WSDL
 */
function XMLShema(WSDLObject){
	this.elements = WSDLObject.elements
	this.complexTypes = WSDLObject.complexTypes	
	this.tnsUrl = WSDLObject.config.root
	
}


/****************************************
 ****************************************
 ********** PRIVATE FUNCTIONS  **********
 ****************************************
 ****************************************/

/**
 * Normalize namespace of object
 * @private
 * @param  {object} obj Source object
 * @return {object}     Normolize object
 */
XMLShema.prototype._normolizeXMLObject = function(obj) {
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
 * @param  {string} shemaElementName Shema type name
 * @param  {object} obj              Source object
 * @return {object}                  Compiling object
 */
XMLShema.prototype._convertXMLObject = function(shemaElementName, obj) {
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
		if(ShemaTypes.isType(elSequence[elName].type)){
			result[elName] = typeof obj[elName] !== 'undefined' ? 
				ShemaTypes.toType(
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
 * [parseXML description]
 * @param  {[type]} xmlString [description]
 * @return {[type]}           [description]
 */
XMLShema.prototype.parseXML = function(xmlString, shemaElementName){
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


XMLShema.prototype.compileXML = function(obj, shemaElementName, root){
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
		if(ShemaTypes.isType(elSequence[elName].type)){
			branch.node(elName, typeof obj[elName] !== 'undefined' ? 
				ShemaTypes.toXML(
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
 * EXPORT
 */
module.exports = XMLShema;






// TEST WSDL
// var WSDL = require('./wsdl')
// var wsdlTest = new WSDL({
//     name: 'XMLShemaParser', 
//     info: 'Проверка класса конвертации XML согласно заданой XMLShema', 
//     root: 'http://localhost:3000/soap/XMLShemaParser/'
// })
// // Complex type
// wsdlTest.complexType({
// 	name: 'complexType_1', 
// 	sequence: {
// 		cT01_string: {type: 'string'}, 
// 		cT01_integer: {type: 'integer'}, 
// 		cT01_dateTime: {type: 'dateTime'}, 
// 	}
// })
// // Complex type 2
// wsdlTest.complexType({
// 	name: 'complexType_2', 
// 	sequence: {
// 		cT02_string: {type: 'string'}, 
// 		cT02_integer: {type: 'integer'}, 
// 		cT02_dateTime: {type: 'dateTime'}, 
// 		// sIn: {type: 'complexType_1'}
// 	}
// })
// // Complex type mix
// wsdlTest.complexType({
// 	name: 'complexType_MIX', 
// 	sequence: {
// 		cT03_cT01: {type: 'complexType_1'}, 
// 		cT03_integer: {type: 'integer'}, 
// 		cT03_cT02: {type: 'complexType_2'}, 
// 	}
// })
// // Element List of complex type
// wsdlTest.element({
// 	name: 'element_Array_ofCT', 
// 	sequence: {
// 		complexType_1_list: {
// 			type: 'complexType_1', 
// 			minOccurs: 0,
//             maxOccurs: 'unbounded'
// 		}
// 	}
// })
// // Element with simple vars
// wsdlTest.element({
// 	name: 'element_ofSVAR', 
// 	sequence: {
// 		svar_string: {type: 'string'}, 
// 		svar_integer: {type: 'integer'}, 
// 		svar_dateTime: {type: 'dateTime'},
// 		svar_bool: {type: 'boolean'},
// 		var_complexType_2: {
// 			type: 'complexType_2', 
// 			maxOccurs: 100
// 		} 
// 	}
// })
// // element with types tree
// // wsdlTest.element({
// // 	name: 'element_MIX', 
// // 	sequence: {
// // 		listOfCT01: {
// // 			type: 'complexType_1', 
// // 			minOccurs: 0,
// //             maxOccurs: 'unbounded'
// // 		}, 
// // 		CT2Type: {type: 'complexType_2'}, 
// // 		// CTMIXType: {type: 'complexType_MIX'}, 
// // 	}
// // })
// // console.log(wsdlTest.toString())

// var shema = new XMLShema(wsdlTest)
// // TEST PARSE
// var testXML = ''
// + '<?xml version="1.0" encoding="utf-8"?>'
// + '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:s="http://www.w3.org/2001/XMLSchema" xmlns:q0="http://localhost:3000/soap/XMLShemaParser/">'
// 	+ '<soap:Body>'
// 		+ '<q0:element_ofSVAR>'
// 			+ '<q0:svar_string>Строка обо всем</q0:svar_string>'
// 			// + '<q0:svar_integer>100</q0:svar_integer>'
// 			// + '<q0:svar_dateTime>1999-05-31T13:20:00+04:00</q0:svar_dateTime>'
// 			+ '<q0:svar_bool>true</q0:svar_bool>'
// 			+ '<q0:var_complexType_2>'
// 				+ '<q0:cT02_string>Описательная строка</q0:cT02_string>'
// 				+ '<q0:cT02_integer>4587</q0:cT02_integer>'
// 				+ '<q0:cT02_dateTime>2013-05-31T13:20:00+04:00</q0:cT02_dateTime>'
// 				+ '<q0:sIn>Брехня</q0:sIn>'
// 			+ '</q0:var_complexType_2>'
// 			+ '<q0:var_complexType_2>'
// 				+ '<q0:cT02_string>Описательная строка</q0:cT02_string>'
// 				+ '<q0:cT02_integer>4587</q0:cT02_integer>'
// 				+ '<q0:cT02_dateTime>2013-05-31T13:20:00+04:00</q0:cT02_dateTime>'
// 				+ '<q0:sIn>Брехня</q0:sIn>'
// 			+ '</q0:var_complexType_2>'
// 			+ '<q0:var_complexType_2>'
// 				+ '<q0:cT02_string>Описательная строка</q0:cT02_string>'
// 				+ '<q0:cT02_integer>4587</q0:cT02_integer>'
// 				+ '<q0:cT02_dateTime>2013-05-31T13:20:00+04:00</q0:cT02_dateTime>'
// 				+ '<q0:sIn>Брехня</q0:sIn>'
// 			+ '</q0:var_complexType_2>'
// 			+ '<q0:var_complexType_2>'
// 				+ '<q0:cT02_string>Описательная строка</q0:cT02_string>'
// 				+ '<q0:cT02_integer>4587</q0:cT02_integer>'
// 				+ '<q0:cT02_dateTime>2013-05-31T13:20:00+04:00</q0:cT02_dateTime>'
// 				+ '<q0:sIn>Брехня</q0:sIn>'
// 			+ '</q0:var_complexType_2>'
// 		+ '</q0:element_ofSVAR>'
// 	+ '</soap:Body>'
// + '</soap:Envelope>'

// inspect(shema.parseXML(testXML, 'element_ofSVAR'))
// // 
// // 
// var testObj = {
//     svar_string: 'Строка обо всем',
//     svar_integer: 100,
//     svar_dateTime: new Date('Mon, 31 May 1999 09:20:00 GMT'),
//     var_complexType_2: {
//         cT02_string: 'Описательная строка 4',
//         cT02_integer: 4587,
//         cT02_dateTime: new Date('Fri, 31 May 2013 09:20:00 GMT')
//     }
    
// }

// var testObj2 = {
//     svar_string: 'Строка обо всем',
//     svar_integer: 0,
//     svar_bool: false, 
//     svar_dateTime: new Date('Mon, 31 May 1999 09:20:00 GMT'),
//     var_complexType_2: [
//         {
//             cT02_string: 'Описательная строка 1',
//             cT02_integer: 0,
//             cT02_dateTime: new Date('Fri, 31 May 2013 09:20:00 GMT')
//         },
//         {
//             cT02_string: 'Описательная строка 2',
//             cT02_integer: 4587,
//             cT02_dateTime: new Date('Fri, 31 May 2013 09:20:00 GMT')
//         },
//         {
//             cT02_string: 'Описательная строка 3',
//             cT02_integer: 4587,
//             cT02_dateTime: new Date('Fri, 31 May 2013 09:20:00 GMT')
//         },
//         {
//             cT02_string: 'Описательная строка 4',
//             cT02_integer: 4587,
//             cT02_dateTime: new Date('Fri, 31 May 2013 09:20:00 GMT')
//         }
//     ]
// }

// console.log(shema.compileXML(testObj2, 'element_ofSVAR').toString())

// console.log(new Date())


// TEST COMPILE

// require('util').log('Timestamped message.');