// REQUIMENT
var libxml = require("libxmljs"), 
    SchemaTypes = require('./XMLSchemaTypes'),
    startTimestamp = new Date(), 
    path = require('path'), 
    url = require('url')


/**
 * Class to form WSDL file and store the object of its description
 * @class WSDLService.WSDL
 */

/**
 * 
 * @constructor
 * @param {Object} WSDLConfig WSDL config
 */
function WSDL(WSDLConfig){
    // Check on setted params
    if(!WSDLConfig.name) return console.error('WSDL :: Don\'t set WSDL service name.')
    if(!WSDLConfig.url) return console.error('WSDL :: Don\'t set WSDL service URL.')
    // Prepare config 
    this.config = WSDLConfig
    this.config.root = this.config.url
    // Create XML document
    this.xmlDoc = new libxml.Document()
    // Create WSDL Body node
    this.wsdlNode = this.xmlDoc.node('wsdl:definitions')
    this.wsdlNode.attr({
        'xmlns:soap': 'http://schemas.xmlsoap.org/wsdl/soap/',
        'xmlns:tm': 'http://microsoft.com/wsdl/mime/textMatching/',
        'xmlns:soapenc': 'http://schemas.xmlsoap.org/soap/encoding/',
        'xmlns:mime': 'http://schemas.xmlsoap.org/wsdl/mime/',
        'xmlns:wsdl': 'http://schemas.xmlsoap.org/wsdl/',
        'xmlns:s': 'http://www.w3.org/2001/XMLSchema',
        'xmlns:soap12': 'http://schemas.xmlsoap.org/wsdl/soap12/',
        'xmlns:http': 'http://schemas.xmlsoap.org/wsdl/http/', 
        'xmlns:tns': this.config.root, 
        'targetNamespace': this.config.root
    })
    // Create XML node for XMLShema types
    this.typesNode = this.wsdlNode
        .node('wsdl:types')
        .node('s:schema').attr({
            'elementFormDefault': 'qualified', 
            'targetNamespace': this.config.root
        })
    
    // Create nodes for define SOAP 1.0 service
    this.soapPortTypeNode = this.wsdlNode
        .node('wsdl:portType')
        .attr('name', this.config.name+'Soap')
    this.soapBindingNode = this.wsdlNode
        .node('wsdl:binding').attr({
            'name': this.config.name+'Soap', 
            'type': 'tns:'+this.config.name+'Soap'
        })
    this.soapBindingNode.node('soap:binding').attr('transport', 'http://schemas.xmlsoap.org/soap/http')


    // Create nodes for define HTTP Post service
    this.httpPostPortTypeNode = this.wsdlNode
        .node('wsdl:portType')
        .attr('name', this.config.name+'HttpPost')
    this.httpPostBindingNode = this.wsdlNode
        .node('wsdl:binding').attr({
            'name': this.config.name+'HttpPost', 
            'type': 'tns:'+this.config.name+'HttpPost'
        })
    this.httpPostBindingNode.node('http:binding').attr('verb', 'POST')

    // Create nodes for define HTTP Get service
    this.httpGetPortTypeNode = this.wsdlNode
        .node('wsdl:portType')
        .attr('name', this.config.name+'HttpGet')
    this.httpGetBindingNode = this.wsdlNode
        .node('wsdl:binding').attr({
            'name': this.config.name+'HttpGet', 
            'type': 'tns:'+this.config.name+'HttpGet'
        })
    this.httpGetBindingNode.node('http:binding').attr('verb', 'GET')

    
    // Create XML node for define services
    this.serviceNode = this.wsdlNode
        .node('wsdl:service').attr('name', this.config.name)
    // Add SOAP 1.0 service
    this.serviceNode
        .node('wsdl:port').attr({
            name: this.config.name+'Soap', 
            binding: 'tns:'+this.config.name+'Soap'
        })
        .node('soap:address').attr('location', this.config.root)
    // Add HTTP Post service
    this.serviceNode
        .node('wsdl:port').attr({
            name: this.config.name+'HttpPost', 
            binding: 'tns:'+this.config.name+'HttpPost'
        })
        .node('http:address').attr('location', this.config.root)
    // Add HTTP Get service
    this.serviceNode
        .node('wsdl:port').attr({
            name: this.config.name+'HttpGet', 
            binding: 'tns:'+this.config.name+'HttpGet'
        })
        .node('http:address').attr('location', this.config.root)

    
    // Define params for port, element, complexType
    this.ports = {}
    this.elements = {}
    this.complexTypes = {}
    // return class object
    return this
}

/**
 * Function for none deep clone object
 * @method _clone
 * @private
 * @param  {Object} obj Source object
 * @return {Object}     Clonned object
 */
WSDL.prototype._clone = function(obj){
    var props = Object.getOwnPropertyNames(obj), 
        newObj = {}
    props.forEach(function(name) {
        newObj[name] = obj[name]
    })
    return newObj
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
 * @return {WSDLService.WSDL}           return WSDL object
 */
WSDL.prototype.complexType = function(complexTypeOption, _node){
    // Check options params 
    if(!complexTypeOption.name){
        console.error('WSDL:: complexType - Don\'t set name')
        return this
    }
    // Create XML branch for this complex type
    var complexType = 
        _node ?
            _node.node('s:complexType') :
            this.typesNode.node('s:complexType').attr('name', complexTypeOption.name)
    // If need sequence create her elements
    if(complexTypeOption.sequence && 
        Object.getOwnPropertyNames(complexTypeOption.sequence).length)
    {
        var sequence = complexType.node('s:sequence')
        for(var key in complexTypeOption.sequence){
            // Clone element
            var element = this._clone(complexTypeOption.sequence[key])
            // prepare element object
            delete element.info
            element.type = SchemaTypes.isType(element.type) ?
                's:'+element.type :
                'tns:'+element.type
            if(element.required){
                delete element.required
                element.minOccurs = 1 
                element.maxOccurs = 1
            }
            // Add min and max occurs if not set
            if(element.minOccurs === undefined)
                element.minOccurs = 0
            if(element.maxOccurs === undefined)
                element.maxOccurs = 1
            element.name = key
            sequence.node('s:element').attr(element)
        }
    }  
    // Save cType to list of description
    this.complexTypes[complexTypeOption.name] = complexTypeOption
    return this;    
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
 * @return {WSDLService.WSDL}       return WSDL object
 */
WSDL.prototype.element = function(elementOption){
    // Check options params 
    if(!elementOption.name){
        console.error('WSDL:: element - Don\'t set name')
        return this
    }
    // Create branch
    var element = this.typesNode.node('s:element').attr('name', elementOption.name)
    // Create complex type
    this.complexType(elementOption, element)
    // Save description
    this.elements[elementOption.name] = elementOption
    // return WSDL
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
 * @return  {WSDLService.WSDL}      return WSDL object
 */
WSDL.prototype.port = function(portOption){
    // Проверка обязательных параметров
    if(!portOption.name){
        console.error('WSDL:: port - не задано наименование для сервиса')
        return this
    }
    // Create default NULL input output message object if not define
    if(!portOption.input) { 
        // create null reaqest type
        portOption.input = portOption.Name + 'NullRequest'
        this.element({
            name: portOption.input
        })
    }
    if(!portOption.output) {
        // create null responce type
        portOption.output = portOption.Name + 'NullResponce'
        this.element({
            name: portOption.output
        })
    }
    this._soapPort(portOption)
    this._httpGetPort(portOption)
    this._httpPostPort(portOption)
    // Save service description
    this.ports[portOption.name] = portOption
    // return WSDL service
    return this;    
}


/**
 * Add new SOAP port
 * @method _soapPort
 * @private
 * @param   {Object} portOption  Port description
 */
WSDL.prototype._soapPort = function(portOption){
    // define namespace
    var namespace = {
        inMsg: 'Soap' + portOption.name + 'In', 
        outMsg: 'Soap' + portOption.name + 'Out'
    }
    // Create request message for Soap 1.0
    // <wsdl:message name="PortNameIn">
    //     <wsdl:part name="parameters" element="tns:PortNameInType"/>       
    // </wsdl:message>
    this.wsdlNode
        .node('wsdl:message').attr('name',  namespace.inMsg)
        .node('wsdl:part').attr({
            name: 'parameters', 
            element: 'tns:'+portOption.input
        })
    // Create responce message for Soap 1.0
    // <wsdl:message name="PortNameOut">
    //     <wsdl:part name="parameters" element="tns:PortNameOutType"/>       
    // </wsdl:message>
    this.wsdlNode
        .node('wsdl:message').attr('name',  namespace.outMsg)
        .node('wsdl:part').attr({
            name: 'parameters', 
            element: 'tns:'+portOption.output
        })
    // Add branch portType for Soap 1.0
    // <wsdl:portType name="GeoIPServiceSoap">
    //     <wsdl:operation name="GetGeoIP">
    //         <wsdl:documentation xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/">GeoIPService - GetGeoIP enables you to easily look up countries by IP addresses</wsdl:documentation>
    //         <wsdl:input message="tns:GetGeoIPSoapIn"/>
    //         <wsdl:output message="tns:GetGeoIPSoapOut"/>
    //     </wsdl:operation>
    // </wsdl:portType>
    var soapOperation = this.soapPortTypeNode
        .node('wsdl:operation').attr('name', portOption.name)
    soapOperation
        .node('wsdl:documentation', portOption.info)
        .attr('xmlns:wsdl', 'http://schemas.xmlsoap.org/wsdl/')
    soapOperation.node('wsdl:input').attr('message', 'tns:'+namespace.inMsg)
    soapOperation.node('wsdl:output').attr('message', 'tns:'+namespace.outMsg)
    // Add branch binding for Soap 1.0
    // <wsdl:binding name="GeoIPServiceSoap" type="tns:GeoIPServiceSoap">
    //     <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    //     <wsdl:operation name="GetGeoIP">
    //         <soap:operation soapAction="http://localhost:3000/test" style="document"/>
    //         <wsdl:input><soap:body use="literal"/></wsdl:input>
    //         <wsdl:output><soap:body use="literal"/></wsdl:output>
    //     </wsdl:operation>
    // </wsdl:binding>
    var soapBinding = this.soapBindingNode.node('wsdl:operation').attr('name', portOption.name)
    soapBinding.node('soap:operation').attr({
        style: 'document', 
        soapAction: this.config.root+'/'+ portOption.name+'/'
    })
    soapBinding.node('wsdl:input').node('soap:body').attr('use', 'literal')
    soapBinding.node('wsdl:output').node('soap:body').attr('use', 'literal')
}

/**
 * Add new HTTP Get port
 * @method _httpGetPort
 * @private
 * @param   {Object} portOption  Port description
 */
WSDL.prototype._httpGetPort = function(portOption){
    // define namespace
    var namespace = {
        inMsg: 'HttpGet' + portOption.name + 'In', 
        outMsg: 'HttpGet' + portOption.name + 'Out'
    }
    // Check on exist element type
    if(!this.elements[portOption.input]){
        console.error('WSDL:: Add HTTPGet port - no define data type "%s"', portOption.input)
        return this
    }
    // Create request message branch
    // <wsdl:message name="HttpGetPortNameIn">
    //     <wsdl:part name="ID" type="s:string"/>
    //     ....
    //     <wsdl:part name="varNum" type="s:string"/>
    // </wsdl:message>
    var portInMessage = this.wsdlNode.node('wsdl:message').attr('name', namespace.inMsg)
        , me = this
    // Wrap in aflat structure request object
    function _addPartsToMessage(sequenceObject, prefix){
        // prefix = prefix ? prefix : ''
        Object.keys(sequenceObject).forEach(function(key){
            if(SchemaTypes.isType(sequenceObject[key].type)){
                portInMessage.node('wsdl:part').attr({
                    // name: prefix + (prefix ? me.capitalise(key) : key), 
                    name: key, 
                    type: 's:' + sequenceObject[key].type
                })
            }else{
                if(!me.complexTypes[sequenceObject[key].type]){
                    console.error('WSDL:: Add HTTPGet port - not define complexType "%s"', portOption.input)
                    return this
                }
                _addPartsToMessage(me.complexTypes[sequenceObject[key].type].sequence, key)
            }
        })    
    }
    // Run recursice function
    _addPartsToMessage(this.elements[portOption.input].sequence)
    // Create responce message branch
    // <wsdl:message name="HttpGetPortNameOut">
    //     <wsdl:part name="Body" element="tns:ForecastReturn"/>
    // </wsdl:message>
    this.wsdlNode
        .node('wsdl:message').attr('name',  namespace.outMsg)
        .node('wsdl:part').attr({
            name: 'Body', 
            element: 'tns:'+portOption.output
        })


    // Add branch portType for HTTP Get
    // <wsdl:operation name="GetWeatherInformation">
    //     <wsdl:documentation xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/">Gets Information for each WeatherID</wsdl:documentation>
    //     <wsdl:input message="tns:GetWeatherInformationHttpGetIn"/>
    //     <wsdl:output message="tns:GetWeatherInformationHttpGetOut"/>
    // </wsdl:operation>
    var httpGetOperation = this.httpGetPortTypeNode
        .node('wsdl:operation').attr('name', portOption.name)
    httpGetOperation
        .node('wsdl:documentation', portOption.info)
        .attr('xmlns:wsdl', 'http://schemas.xmlsoap.org/wsdl/')
    httpGetOperation.node('wsdl:input').attr('message', 'tns:'+namespace.inMsg)
    httpGetOperation.node('wsdl:output').attr('message', 'tns:'+namespace.outMsg)
    // Add branch binding for HTTP Get
    // <wsdl:operation name="GetCityForecastByZIP">
    //     <http:operation location="/GetCityForecastByZIP"/>
    //     <wsdl:input>
    //         <http:urlEncoded/>
    //     </wsdl:input>
    //     <wsdl:output>
    //         <mime:mimeXml part="Body"/>
    //     </wsdl:output>
    // </wsdl:operation>
    var httpGetBinding = this.httpGetBindingNode.node('wsdl:operation').attr('name', portOption.name)
    httpGetBinding.node('http:operation').attr('location', '/'+ portOption.name+'/')
    httpGetBinding.node('wsdl:input').node('http:urlEncoded')
    httpGetBinding.node('wsdl:output').node('mime:mimeXml').attr('part', 'Body') 
}

/**
 * Add new HTTP Post port
 * @method _httpPostPort
 * @private
 * @param   {Object} portOption  Port description
 */
WSDL.prototype._httpPostPort = function(portOption){
    // define namespace
    var namespace = {
        inMsg: 'HttpPost' + portOption.name + 'In', 
        outMsg: 'HttpPost' + portOption.name + 'Out'
    }
    // Check on exist element type
    if(!this.elements[portOption.input]){
        console.error('WSDL:: Add HTTPPost port - no define data type "%s"', portOption.input)
        return this
    }
    // Create request message branch
    // <wsdl:message name="HttpPostPortNameIn">
    //     <wsdl:part name="ID" type="s:string"/>
    //     ....
    //     <wsdl:part name="varNum" type="s:string"/>
    // </wsdl:message>
    var portInMessage = this.wsdlNode.node('wsdl:message').attr('name', namespace.inMsg)
        , me = this
    // Wrap in aflat structure request object
    function _addPartsToMessage(sequenceObject, prefix){
        // prefix = prefix ? prefix : ''
        Object.keys(sequenceObject).forEach(function(key){
            if(SchemaTypes.isType(sequenceObject[key].type)){
                portInMessage.node('wsdl:part').attr({
                    // name: prefix + (prefix ? me.capitalise(key) : key), 
                    name: key, 
                    type: 's:' + sequenceObject[key].type
                })
            }else{
                if(!me.complexTypes[sequenceObject[key].type]){
                    console.error('WSDL:: Add HTTPPost port - not define complexType "%s"', portOption.input)
                    return this
                }
                _addPartsToMessage(me.complexTypes[sequenceObject[key].type].sequence, key)
            }
        })    
    }
    // Run recursice function
    _addPartsToMessage(this.elements[portOption.input].sequence)
    // Create responce message branch
    // <wsdl:message name="HttpPostPortNameOut">
    //     <wsdl:part name="Body" element="tns:ForecastReturn"/>
    // </wsdl:message>
    this.wsdlNode
        .node('wsdl:message').attr('name',  namespace.outMsg)
        .node('wsdl:part').attr({
            name: 'Body', 
            element: 'tns:'+portOption.output
        })
    // Add branch portType for HTTP Post
    // <wsdl:operation name="GetWeatherInformation">
    //     <wsdl:documentation xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/">Gets Information for each WeatherID</wsdl:documentation>
    //     <wsdl:input message="tns:GetWeatherInformationHttpPostIn"/>
    //     <wsdl:output message="tns:GetWeatherInformationHttpPostOut"/>
    // </wsdl:operation>
    var httpPostOperation = this.httpPostPortTypeNode
        .node('wsdl:operation').attr('name', portOption.name)
    httpPostOperation
        .node('wsdl:documentation', portOption.info)
        .attr('xmlns:wsdl', 'http://schemas.xmlsoap.org/wsdl/')
    httpPostOperation.node('wsdl:input').attr('message', 'tns:'+namespace.inMsg)
    httpPostOperation.node('wsdl:output').attr('message', 'tns:'+namespace.outMsg) 
    // Add branch binding for HTTP Post
    // <wsdl:operation name="GetWeatherInformation">
    //     <http:operation location="/GetWeatherInformation"/>
    //     <wsdl:input>
    //         <mime:content type="application/x-www-form-urlencoded"/>
    //     </wsdl:input>
    //     <wsdl:output>
    //         <mime:mimeXml part="Body"/>
    //     </wsdl:output>
    // </wsdl:operation>
    var httpPostBinding = this.httpPostBindingNode.node('wsdl:operation').attr('name', portOption.name)
    httpPostBinding.node('http:operation').attr('location', '/'+ portOption.name+'/')
    httpPostBinding.node('wsdl:input').node('mime:content').attr('type', 'application/x-www-form-urlencoded')
    httpPostBinding.node('wsdl:output').node('mime:mimeXml').attr('part', 'Body') 
}


/**
 * Render XML string 
 * @method toString
 * @param  {boolean} formatted  Need formatting output string
 * @return {string}             XML string
 */
WSDL.prototype.toString = function(formatted){
    return this.xmlDoc.toString(formatted)
}


/**
 * UpperCase of first symbol
 * @method capitalise
 * @private
 * @param  {string} string  Inner string
 * @return {string}         Capitalise string
 */
WSDL.prototype.capitalise = function(string){
    return string.charAt(0).toUpperCase() + string.slice(1)
}

//EXPORT
module.exports = WSDL;