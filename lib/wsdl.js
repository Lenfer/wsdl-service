// REQUIMENT
var libxml = require("libxmljs"), 
    ShemaTypes = require('./XMLShemaTypes'),
    startTimestamp = new Date(), 
    path = require('path'), 
    url = require('url')


/**
 * Class to form WSDL file and store the object of its description
 * @constructor
 * @param {object} WSDLConfig WSDL config
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
    this.portTypeNode = this.wsdlNode
        .node('wsdl:portType')
        .attr('name', this.config.name+'Soap')
    this.bindingNode = this.wsdlNode
        .node('wsdl:binding').attr({
            'name': this.config.name+'Soap', 
            'type': 'tns:'+this.config.name+'Soap'
        })
    this.bindingNode.node('soap:binding').attr('transport', 'http://schemas.xmlsoap.org/soap/http')
    // Create XML node for define services
    this.serviceNode = this.wsdlNode
        .node('wsdl:service').attr('name', this.config.name)
    this.serviceNode
        .node('wsdl:port').attr({
            name: this.config.name+'Soap', 
            binding: 'tns:'+this.config.name+'Soap'
        })
        .node('soap:address').attr('location', this.config.root)
    
    // Define params for port, element, complexType
    this.ports = {}
    this.elements = {}
    this.complexTypes = {}
    // return class object
    return this
}

/**
 * Function for none deep clone object
 * @private
 * @param  {object} obj Source object
 * @return {object}     Clonned object
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
 * Add description for complexType to XMLShema types
 * @param  {object} complexTypeOption Type description 
    {
        name: 'Type name', 
        sequence: {
            elementName: {
                type: 'Excist type name'
                required: true/false
                ... - any descrition of XMLShema elements
            }
        }
 * @return {WSDL} return WSDL object
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
            element.type = ShemaTypes.isType(element.type) ?
                's:'+element.type :
                'tns:'+element.type
            if(element.required){
                delete element.required
                element.minOccurs = 1 
                element.maxOccurs = 1
            }
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
 * @param  {object} elementOption Type description 
    {
        name: 'Type name', 
        sequence: {
            elementName: {
                type: 'Excist type name'
                required: true/false
                ... - any descrition of XMLShema elements
            }
        }
 * @return {WSDL} return WSDL object
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
 * @param Object portOption Service description
 */
WSDL.prototype.port = function(portOption){
    // Проверка обязательных параметров
    if(!portOption.name){
        console.error('WSDL:: port - не задано наименование для сервиса')
        return this
    }
    // Определяем пространство имен
    var namespace = {
        soap: {
            inMsg: 'Soap' + portOption.name + 'In', 
            outMsg: 'Soap' + portOption.name + 'Out'
        }, 
        // http: {}, 
        // get: {}
    }
    // Create request message for Soap 1.0
    // <wsdl:message name="PortNameIn">
    //     <wsdl:part name="parameters" element="tns:PortNameInType"/>       
    // </wsdl:message>
    if(!portOption.input) { 
        // create null reaqest type
        portOption.input = namespace.soap.inMsg + 'Null'
        this.element({
            name: portOption.input
        })
    }
    this.wsdlNode
            .node('wsdl:message').attr('name', namespace.soap.inMsg)
            .node('wsdl:part').attr({
                name: 'parameters', 
                element: 'tns:' + portOption.input
            })
    // Create responce message for Soap 1.0
    // <wsdl:message name="PortNameOut">
    //     <wsdl:part name="parameters" element="tns:PortNameOutType"/>       
    // </wsdl:message>
    if(!portOption.output) {
        // create null responce type
        portOption.output = namespace.soap.outMsg + 'Null'
        this.element({
            name: portOption.output
        })
    }
    this.wsdlNode
        .node('wsdl:message').attr('name',  namespace.soap.outMsg)
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
    var operation = this.portTypeNode
        .node('wsdl:operation').attr('name', portOption.name)
    operation
        .node('wsdl:documentation', portOption.info)
        .attr('xmlns:wsdl', 'http://schemas.xmlsoap.org/wsdl/')
    operation.node('wsdl:input').attr('message', 'tns:'+namespace.soap.inMsg)
    operation.node('wsdl:output').attr('message', 'tns:'+namespace.soap.outMsg)
        

    // Add branch binding for Soap 1.0
    // <wsdl:binding name="GeoIPServiceSoap" type="tns:GeoIPServiceSoap">
    //     <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    //     <wsdl:operation name="GetGeoIP">
    //         <soap:operation soapAction="http://localhost:3000/test" style="document"/>
    //         <wsdl:input><soap:body use="literal"/></wsdl:input>
    //         <wsdl:output><soap:body use="literal"/></wsdl:output>
    //     </wsdl:operation>
    // </wsdl:binding>
    var operation = this.bindingNode.node('wsdl:operation').attr('name', portOption.name)
    operation.node('soap:operation').attr({
        style: 'document', 
        soapAction: this.config.root+'/'+ portOption.name+'/'
    })
    operation.node('wsdl:input').node('soap:body').attr('use', 'literal')
    operation.node('wsdl:output').node('soap:body').attr('use', 'literal')   
    // Save service description
    this.ports[portOption.name] = portOption
    // return WSDL service
    return this;    
}


/**
 * Render XML string 
 */
WSDL.prototype.toString = function(formatted){
    return this.xmlDoc.toString(formatted)
}


/**
 * EXPORT
 */
module.exports = WSDL;




// var TestService = new WSDL({
//     name: 'TestService', 
//     url: 'http://localhost:3000/soap/TestService'
// })


/*TestService.complexType({
    name: 'CT_withSeq', 
    sequence: {
        intVar: {type: 'integer'}, 
        strVar: {type: 'string'}
    }
})
TestService.complexType({
    name: 'CT_noneSeq'     
})*/

// TestService.element({
//     name: 'el_withSeq', 
//     sequence: {
//         intVar: {
//             type: 'integer', 
//             required: 1
//         }, 
//         strVar: {type: 'string'}
//     }
// })
// TestService.element({
//     name: 'el_noneSeq'     
// })


// TestService.port({
//     name: 'PORT', 
//     info: 'Просто тест',
//     input: 'el_noneSeq', 
//     output: 'el_withSeq' 
// })

// console.log('===================================')
// console.log('===================================')
// console.log('===================================')
// console.log('===================================')
// console.log(TestService.toString())





// @TODO
//     OK - причесать весь класс - коменты, рефакторинг
//     OK - добавить возможность required 
//     OK - добавить возможность пустых сообщений при определение порта
//     Depr - попробовать добавить комментарии в WSDL
//     - реализовать и причесать класс сервиса
//     - накидать и протестировать тестовый сервис на FoxPro
//     - запилить в сервисе быстрый сборщик справки для сервиса



// CORRECT:
// <binding name="StockQuoteSoap" type="tns:StockQuotePortType">
//   <soapbind:binding style="document" 
//                 transport="http://schemas.xmlsoap.org/soap/http"/>
//     <operation name="SubscribeToQuotes">
//       <input message="tns:SubscribeToQuotes">
//         <soapbind:body parts="body" use="literal"/>
//         <soapbind:header message="tns:SubscribeToQuotes"
//                     part="subscribeheader" use="literal"/>
//      </input>
//    </operation>
// </binding>