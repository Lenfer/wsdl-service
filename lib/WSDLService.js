// REQUIMENT
var WSDL = require('./wsdl'),
	XMLShema = require('./XMLSchema'),  
	url = require('url'), 
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
WSDLService.prototype._error = function(message){
	// return '<error>'+message.toString()+'</error>'
	return this.xmlShema.compileErrorXML({
		string: this._escapeChar(message)
	})
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
 * @return {Function} function(req, res) to insert in HTTP request
 */
WSDLService.prototype.bind = function(){
	var me = this
	return function(req, res){
		res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} );
		// if request WSDL XML (?wsdl)
		if(typeof req.query.wsdl !== 'undefined'){
			console.log('GET WSDL!')
			// res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} );
			res.end(me.wsdl.toString(1))  
			return false
		}
		// If request Info page (?developers)
		if(typeof req.query.developers !== 'undefined'){
			res.end('Developers page not ready yet.')
			return false
		}
		
		// Simple auth
		function _checkAuth(authStr){
			var authstring = authStr.split(' ')
			authstring = authstring[authstring.length-1]
			authstring = new Buffer(authstring, 'base64').toString('ascii')
			authstring = authstring.split(':')
			var lpwd = {
				login: authstring[0], 
				pwd: authstring[1]
			}
			// console.log('WSDLService._checkAuth :: ', lpwd)
			// return true
			return lpwd.login == 'devlogin' && lpwd.pwd == 'devpwd'
		}
		
		/*if(!req.headers.authorization){
			return res.send(500, 'Not set Basic Authentication data')
			return res.send(me._error('Not set Basic Authentication data')
		}*/

		// _checkAuth(req.headers.authorization)


		// Check SOAP action in request header
		if(req.headers.soapaction /*&& _checkAuth(req.headers.authorization)*/){
			// console.log(req.headers.soapaction)
			// return res.end(me._error('Error check'))
			var startTime = new Date()
			// Get soap action port name
			var soapActionName = req.headers.soapaction.replace(/^"+|\"+$/g, '').split('/')
			soapActionName = soapActionName[soapActionName.length-2]	
			// Check on excist port name
			if(me.wsdl.ports[soapActionName]){
				var inBuffer = ''
				req.setEncoding('utf8')
				req.on('data', function(data){
					inBuffer += data
				})
				req.on('end', function(){
					console.log(inBuffer)
					// Parse XML request
					var requestObj = me.xmlShema.parseXML(inBuffer, me.wsdl.ports[soapActionName].input)
					// If error in XML request send error
					if(requestObj instanceof Error) return res.end(me._error(requestObj.message))
					// EXEC	port function
					try{
						me.wsdl.ports[soapActionName].exec(requestObj, function(err, data){
							if(err) {
								return res.end(me._error('Error in the command service: '+err.message))
							}else{
								var responceXML = me.xmlShema.compileXML(data, me.wsdl.ports[soapActionName].output)
								// If error in compile send error
								if(responceXML instanceof Error) return res.send(me._error(requestObj))
								// console.log(responceXML.toString())
								// res.writeHead( 200, {'Content-Type': 'text/xml; charset=utf-8'} );
								res.end(responceXML.toString(false))  
								// console.log(
								// 	':: Soap action %s finis in %sms', 
								// 	req.headers.soapaction, 
								// 	new Date() - startTime
								// )
								return false								
							}
						}, req)	
					}catch(e){
						return res.end(me._error('Error in the command service: '+e.stack))
					}
				})
			}else{
				// If port name not found in ports list return error
				// return res.send(500, format('SOAP action %s don\'t define', soapActionName))
				return res.end(me._error(format('SOAP action %s don\'t define', soapActionName)))
			}
			return false
		} else {
			// if not set SOAP action URL
			// return res.send(500, 'No valid SOAP action in request header')
			return res.end(me._error('No valid SOAP action in request header'))
		}
	}
}


//Exports
module.exports = WSDLService

