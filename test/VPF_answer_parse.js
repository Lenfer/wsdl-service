var expatParser = require('xml2json')
	, inspect = require('eyes').inspector({maxLength: 204800})


// Load test xml
var xml = require('fs').readFileSync('./VFP_answer.xml').toString('utf8')

console.log(xml)

console.log('==================================================================')
console.log('==================================================================')
console.log('==================================================================')

var parsed = expatParser.toJson(xml, {
	object: true, 
	coerce: false 
})

inspect(parsed)
