
var wsdlService = require('wsdl-service')


// Define SOAP service
var SOAP = new wsdlService({
	name: 'shedule-service', 
	url: 'http://localhost/test-service/'
})

// =================================================
// getStartTime
SOAP.element({
    name: 'getStartTimeOut', 
    sequence:{
        startTime: {type: 'dateTime'}
    }
})
SOAP.port({
    name: 'getStartTime', 
    info: 'Возвращает время запуска сервиса', 
    output: 'getStartTimeOut', 
    exec: function(req, next){
        next(false, {startTime: Schedule.stats().startTime})
    }
})


// =================================================
// getIgnoreScheduleList
SOAP.complexType({
    name: 'getIgnoreScheduleListOutElement', 
    sequence:{
        idShedule: {type: 'integer'}, 
        idToch: {type: 'integer'}, 
        nameShedule: {type: 'string'}, 
        time: {type: 'string'}       
    }
})
SOAP.element({
    name: 'getIgnoreScheduleListOut', 
    sequence:{
        getIgnoreScheduleListOutElement: {
            type: 'getIgnoreScheduleListOutElement', 
            minOccurs: 0,
            maxOccurs: 'unbounded'
        }
    }
})
SOAP.port({
    name: 'getIgnoreScheduleList', 
    info: 'Возвращает список проигнорированных заданий по расписанию, за текущий день', 
    output: 'getIgnoreScheduleListOut', 
    exec: function(req, next){
        next(false, {
            getIgnoreScheduleListOutElement: Schedule.ignoredSсheduleList()            
        })
    }
})