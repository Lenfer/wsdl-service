// REQUIMENT
var WSDL = require('./wsdl'),
	XMLShema = require('./XMLShema'),  
	url = require('url'), 
	format = require('util').format


/**
 * Creating a service based on the WSDL
 * @param {Object} serviceConfig Service config
 */
function WSDLService(serviceConfig){
	this.wsdl = new WSDL({
		name: serviceConfig.name, 
		url: serviceConfig.url
	})
	this.xmlShema = new XMLShema(this.wsdl)
	this.config = serviceConfig	
}


/****************************************
 ****************************************
 ********** PRIVATE FUNCTIONS  **********
 ****************************************
 ****************************************/
WSDLService.prototype._error = function(message){
	// return '<error>'+message.toString()+'</error>'
	return this.xmlShema.compileErrorXML({
		code: 'SOAP-ENV:53', 
		message: message
	})
}


/****************************************
 ****************************************
 ******** Override WSDL methods  ********
 ****************************************
 ****************************************/
WSDLService.prototype.complexType = function(complexTypeOption){
	this.wsdl.complexType(complexTypeOption)
	return this
}
WSDLService.prototype.element = function(elementOption){
	this.wsdl.element(elementOption)
	return this
}
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
 */
WSDLService.prototype.bind = function(){
	var WSDLText = this.wsdl.toString(false), 
		me = this
	return function(req, res){
		// if request WSDL XML (?wsdl)
		if(typeof req.query.wsdl !== 'undefined'){
			res.writeHead( 200, {'Content-Type': 'text/xml'} );
			res.end(WSDLText)  
			return false
		}
		// If request Info page (?developers)
		if(typeof req.query.developers !== 'undefined'){
			res.send('Developers page not ready yet.')
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
			console.log('WSDLService._checkAuth :: ', lpwd)
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
			// return res.send(me._error('Error check'))

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
					// Parse XML request
					var requestObj = me.xmlShema.parseXML(inBuffer, me.wsdl.ports[soapActionName].input)
					// If error in XML request send error
					if(requestObj instanceof Error) return res.send(me._error(requestObj))
					// EXEC	port function
					try{
						me.wsdl.ports[soapActionName].exec(requestObj, function(err, data){
							if(err) {
								return res.send(me._error('Error in the command service: '+err))
							}else{
								var responceXML = me.xmlShema.compileXML(data, me.wsdl.ports[soapActionName].output)
								// If error in compile send error
								if(responceXML instanceof Error) return res.send(me._error(requestObj))
								// console.log(responceXML.toString())
								res.writeHead( 200, {'Content-Type': 'text/xml'} );
								res.end(responceXML.toString(false))  
								return false
								// res.send(testAnswer)
							}
						})	
					}catch(e){
						return res.send(me._error('Error in the command service: '+e.stack))
					}
				})
			}else{
				// If port name not found in ports list return error
				// return res.send(500, format('SOAP action %s don\'t define', soapActionName))
				return res.send(me._error(format('SOAP action %s don\'t define', soapActionName)))
			}
			return false
		} else {
			// if not set SOAP action URL
			// return res.send(500, 'No valid SOAP action in request header')
			return res.send(me._error('No valid SOAP action in request header'))
		}
	}
}

module.exports = WSDLService

