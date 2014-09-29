
var wsdlService = require('./..')


// Define SOAP service
var SOAP = new wsdlService({
	name: 'testService'
})

// =================================================
// getStartTime
SOAP.element({
    name: 'getStartTimeIn', 
    sequence:{
        startTime: {type: 'dateTime'}
    }
})
SOAP.element({
    name: 'getStartTimeOut', 
    sequence:{
        startTime: {type: 'dateTime'}
    }
})
SOAP.port({
    name: 'getStartTime', 
    info: 'Datetime callback', 
    input: 'getStartTimeIn', 
    output: 'getStartTimeOut', 
    exec: function(req, next){
        console.log(req)
        next(false, {startTime: req.startTime})
    }
})


// =================================================
SOAP.complexType({
    name: 'listElementTp', 
    sequence:{
        idShedule: {type: 'integer'}, 
        idToch: {type: 'integer'}, 
        nameShedule: {type: 'string'}, 
        time: {type: 'string'}       
    }
})
SOAP.element({
    name: 'listTp', 
    sequence:{
        getListOutElement: {
            type: 'listElementTp', 
            minOccurs: 0,
            maxOccurs: 'unbounded'
        }
    }
})
SOAP.port({
    name: 'getList', 
    info: 'List callback', 
    output: 'listTp', 
    exec: function(req, next){
        next(false, {getListOutElement: [
            {idShedule: 100, idToch: 200, nameShedule: 'test1', time: '10:10:15'},
            {idShedule: 101, idToch: 201, nameShedule: 'test2', time: '10:10:16'},
            {idShedule: 102, idToch: 202, nameShedule: 'test3', time: '10:10:18'},
        ]})
    }
})


SOAP.port({
    name: 'getError', 
    info: 'Error callback', 
    output: 'getStartTimeOut', 
    exec: function(req, next){
        next(new Error('Oops! It\'s error!'), null)
    }
})


var bind = SOAP.bind()
    , url = require('url');

require('http')
    .createServer(function(req, res){
        var url_parts = url.parse(req.url, true)
        req.query = url_parts.query
        bind(req, res)
    })
    .listen(8080, function(){
        console.log('Server start.')
    })