// REQUIMENT
var WSDL = require('./wsdl'),
	XMLShema = require('./XMLSchema'),  
	URL = require('url'), 
	format = require('util').format




/**
 * Creating a service based on the WSDL descriptive object
 * @class WSDLService
 */
 
/**
 * Create new service object
 * @constructor
 * @param {Object} 	serviceConfig 	Service config
 */
function WSDLService(serviceConfig){
	this.wsdl = new WSDL({
		name: serviceConfig.name, 
		url: serviceConfig.url
	})
	this.xmlShema = new XMLShema(this.wsdl)
	this.config = serviceConfig	
	// Consts
	this.protocol = {
		SOAP: 1, 
		POST: 2, 
		GET: 3
	}
}


/**
 * Escaping characters
 * @method _escapeChar
 * @private
 * @param  {string} text 	Source string
 * @return {string}         Escaped string
 */
WSDLService.prototype._escapeChar = function(text) {
  	return text ? 
		text
		  .replace(/&/g, "&amp;")
		  .replace(/</g, "&lt;")
		  .replace(/>/g, "&gt;")
		  .replace(/"/g, "&quot;")
		  .replace(/'/g, "&#039;") : text;
}


/**
 * Render error XML responce
 * @method _error
 * @private
 * @param  {string} message Error message
 * @return {string}         XML error responce
 */
WSDLService.prototype._error = function(res, message, noSoapWrap){
	res.writeHead( 500, {'Content-Type': 'text/xml; charset=utf-8'} )
	// return '<error>'+message.toString()+'</error>'
	res.end(
		this.xmlShema.compileErrorXML(
		{
			string: this._escapeChar(message)
		}, 
		noSoapWrap)
	)
}


/**
 * Add description for complexType to XMLSchema types
 *
 *     @example
 *     {
 *       name: 'Type name', 
 *       sequence: {
 *         elementName: {
 *           type: 'Excist type name'
 *           required: true/false
 *           ... - any descrition of XMLShema elements
 *         }
 *       }
 *     }
 *
 * @method complexType
 * @param  {Object} complexTypeOption   Type description 
 * @return {WSDLService}           		return WSDL object
 */
WSDLService.prototype.complexType = function(complexTypeOption){
	this.wsdl.complexType(complexTypeOption)
	return this
}

/**
 * Add description for element to XMLShema types
 *
 *     @example
 *     {
 *       name: 'Type name', 
 *       sequence: {
 *         elementName: {
 *           type: 'Excist type name'
 *           required: true/false
 *           ... - any descrition of XMLShema elements
 *         }
 *       }
 *     }
 *
 * @method element
 * @param  {Object} elementOption   Type description 
 * @return {WSDLService}       		return WSDL object
 */
WSDLService.prototype.element = function(elementOption){
	this.wsdl.element(elementOption)
	return this
}

/**
 * Add new service
 *
 *     @example
 *     WSDL.port({
 *       name: 'Service name', 
 *       info: 'Service description', 
 *       output: 'outElementName', 
 *       input: 'inElementName', 
 *       exec: function(req, next){
 *         next(errorFlag, {... answer object ...})
 *       }
 *     })
 *
 * @method port
 * @param   {Object}    portOption  Service description
 * @return  {WSDLService}      		return WSDL object
 */
WSDLService.prototype.port = function(portOption){
	if(!portOption.exec){
		console.error('WSDLService :: Dont set function for execute request (exec)')
		return this
	}
	this.wsdl.port(portOption)
	return this
}


/**
 * Processing the request and sends a response
 * @method bind
 * @return {Function} function(req, res) to insert in HTTP request (use connect middleware)
 */
WSDLService.prototype.bind = function(){
	var me = this
	return function(req, res){
		
		// console.log('==================================')
		// console.log('==================================')
		// console.log(req.query)
		// console.log(req.body)
		// console.log(req.method)
		// console.log(req.headers.soapaction, req.method == 'POST' && !!req.headers.soapaction)
		// console.log('==================================')
		// console.log('==================================')
		

		// if request WSDL XML (?wsdl)
		if(typeof req.query.wsdl !== 'undefined'){
			console.log('GET WSDL!')
			res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} )
			res.end(me.wsdl.toString(1))  
			return false
		}
		
		// Simple auth
		// function _checkAuth(authStr){
		// 	var authstring = authStr.split(' ')
		// 	authstring = authstring[authstring.length-1]
		// 	authstring = new Buffer(authstring, 'base64').toString('ascii')
		// 	authstring = authstring.split(':')
		// 	var lpwd = {
		// 		login: authstring[0], 
		// 		pwd: authstring[1]
		// 	}
		// 	// console.log('WSDLService._checkAuth :: ', lpwd)
		// 	// return true
		// 	return lpwd.login == 'devlogin' && lpwd.pwd == 'devpwd'
		// }
		
		/*if(!req.headers.authorization){
			return res.send(500, 'Not set Basic Authentication data')
			return res.send(me._error('Not set Basic Authentication data')
		}*/

		// _checkAuth(req.headers.authorization)

		var requestProtocol = -100
		switch(true){
			case req.method == 'GET': 
				// console.log('GET')
				requestProtocol = me.protocol.GET;
				req._soapProtocolType = 'HTTP GET'
				me._executeByGET(req, res)
			break;
			case (req.method == 'POST' && !!req.headers.soapaction): 
				// console.log('SOAP')
				requestProtocol = me.protocol.SOAP;
				req._soapProtocolType = 'SOAP'
				me._executeBySOAP(req, res)
			break;
			case req.method == 'POST': 
				// console.log('POST')
				requestProtocol = me.protocol.POST;
				req._soapProtocolType = 'HTTP POST'
				me._executeByPOST(req, res)
			break;
			default: 
				me._error(res, 'Unable to determine the protocol', true)
		}		
	}
}

/**
 * Execute request by SOAP protocol and return SOAP responce
 * @method _executeBySOAP
 * @private
 */
WSDLService.prototype._executeBySOAP = function(req, res){
	var startTime = new Date()
	// Get soap action port name
	var soapActionName = req.headers.soapaction.replace(/^"+|\"+$/g, '').split('/')
	soapActionName = soapActionName[soapActionName.length-2]	
	// Check on excist port name
	if(this.wsdl.ports[soapActionName]){
		var inBuffer = ''
			, me = this
		req.setEncoding('utf8')
		// Add to buffer on data
		req.on('data', function(data){inBuffer += data})
		// Run execute when all data transfered
		req.on('end', function(){
			// console.log(inBuffer)
			// Parse XML request
			var requestObj = me.xmlShema.parseXML(inBuffer, me.wsdl.ports[soapActionName].input)
			// console.log(requestObj)
			// If error in XML request send error
			if(requestObj instanceof Error) 
				return me._error(res, requestObj.message)
			// EXEC	port function
			try{
				me.wsdl.ports[soapActionName].exec(requestObj, function(err, data){
					if(err) {
						// Error responce
						return me._error(res, err.message)
					}else{
						// Compile responce by type
						var responceXML = me.xmlShema.compileXML(data, me.wsdl.ports[soapActionName].output)
						// If error in compile send error
						if(responceXML instanceof Error) return me._error(res, responceXML.message)
						// Send data
						res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} )
						res.end(responceXML.toString(false))  
						return false								
					}
				}, req)
			}catch(e){
				return me._error(res, e.stack)
			}
		})
	}else{
		return this._error(res, format('SOAP action "%s" not define', soapActionName))
	}
	return false
}


/**
 * Execute request by GET protocol and return XML responce by type
 * @method _executeByGET
 * @private
 */
WSDLService.prototype._executeByGET = function(req, res){
	var requestObj = req.query
	var actionName = URL.parse(req.url).pathname.match(/\/(\w+)\/?$/)[1]
	if(this.wsdl.ports[actionName]){
		var me = this
		this.wsdl.ports[actionName].exec(requestObj, function(err, data){
			if(err) {
				// Error responce
				return me._error(res, err.message, true)
			}else{
				// Compile responce by type
				var responceXML = me.xmlShema.compileXML(data, me.wsdl.ports[actionName].output, false, true)
				// If error in compile send error
				if(responceXML instanceof Error) return me._error(res, responceXML.message, true)
				// Send data
				res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} )
				res.end(responceXML.toString(false))  
				return false								
			}
		}, req)
	}else{
		return this._error(res, format('GET action "%s" not define', actionName), true)
	}
}

/**
 * Execute request by POST protocol and return XML responce by type
 * @method _executeByPOST
 * @private
 */
 WSDLService.prototype._executeByPOST = function(req, res){
 	var actionName = URL.parse(req.url).pathname.split('/')
	actionName = actionName[actionName.length-1]
	if(this.wsdl.ports[actionName]){
		var me = this, requestObj = req.body 
		this.wsdl.ports[actionName].exec(requestObj, function(err, data){
			if(err) {
				// Error responce
				return me._error(res, err.message, true)
			}else{
				// Compile responce by type
				var responceXML = me.xmlShema.compileXML(data, me.wsdl.ports[actionName].output, false, true)
				// If error in compile send error
				if(responceXML instanceof Error) return me._error(res, responceXML.message, true)
				// Send data
				res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} )
				res.end(responceXML.toString(false))  
				return false								
			}
		}, req)
	}else{
		return this._error(res, format('POST action "%s" not define', actionName), true)
	}
 }

//Exports
module.exports = WSDLService

