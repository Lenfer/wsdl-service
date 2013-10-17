// REQUIMENT
var moment = require('moment'), 
    format = require('util').format


/**
 * ShemaTypes description
 * @type {Object}
 */
var ShemaTypes = {
	typeNames: [
        'string', 
        'boolean',
        'base64Binary',
        'hexBinary',
        'anyURI',
        'language',
        'normalizedString',
        'token',
        'byte',
        'decimal',
        'double',
        'float',
        'int',
        'integer',
        'long',
        'negativeInteger',
        'nonNegativeInteger',
        'nonPositiveInteger',
        'positiveInteger',
        'short',
        'unsignedByte',
        'unsignedShort',
        'unsignedInt',
        'unsignedLong',
        'unsignedShort',
        'date',
        'dateTime',
        'duration',
        'gDay',
        'gMonth',
        'gMonthDay',
        'gYear',
        'gYearMonth',
        'time'
    ], 
    _convert: {
        
        /**
         * Character strings in XML
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {string}   Converted value
         */
        string: function(v, toString){
    		return toString ? v.toString() : v
    	},
        
        /**
         * A Uniform Resource Identifier Reference (URI). Can be 
         * absolute or relative, and may have an optional fragment 
         * identifier
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {string}   Converted value
         */
        anyURI: function(v, toString){
            return toString ? v.toString() : v
        },
        
        /**
         * natural language identifiers [RFC 1766] 
         * Example: en, fr. 
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {string}   Converted value
         */
        language: function(v, toString){
            return toString ? v.toString() : v
        },
        
        /**
         * White space normalized strings 
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {string}   Converted value
         */
        normalizedString: function(v, toString){
            return toString ? v.toString() : v
        },
        
        /**
         * binary-valued logic legal literals {true, false, 1, 0}
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {string}   Converted value
         */
        token: function(v, toString){
            return toString ? v.toString() : v
        },

        /**
         * binary-valued logic legal literals {true, false, 1, 0}
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {Bool}   Converted value
         */
        boolean: function(v, toString){
        	if(toString) return v ? '1' : '0'
            return v ? true : false
        },
        

        base64Binary: function(v, toString){
            return toString ? v.toString() : v
        },
        hexBinary: function(v, toString){
            return toString ? v.toString() : v
        },
                
        /**
         * 127 to-128. Sign is omitted, “+” assumed. 
         * Example: -1, 0, 126, +100. 
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {number}   Converted value
         */
        byte: function(v, toString){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value %s is not byte', v))
            if(r>127 || r<-128) return new Error(format('Value %s is not byte', v))
            return r
        },
        
        decimal: function(v, toString){
            return toString ? v.toString() : v*1
        },
        
        /**
         * Double-precision 64-bit floating point type - 
         * legal literals {0, -0, INF, -INF and NaN} Example, -1E4, 12.78e-2, 12 and INF.
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {number}   Converted value
         */
        double: function(v){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value %s is not double', v))
            return r
        },
        
        /**
         * 32-bit floating point type - legal literals {0, -0, 
         * INF, -INF and NaN} Example, -1E4, 
         * 1267.43233E12, 12.78e-2, 12 and INF.
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {number}   Converted value
         */
        float: function(v){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value %s is not float', v))
            return r
        },
        
        int: function(v, toString){
            return toString ? v.toString() : v*1
        },
        integer: function(v, toString){
            return toString ? v.toString() : v*1
        },
        long: function(v, toString){
            return toString ? v.toString() : v*1
        },
        
        /**
         * Infinite set {...,-2,-1}. 
         * Example: -1, -12678967543233, -100000.
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {number}   Converted value
         */
        negativeInteger: function(v, toString){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value %s is not integer', v))
            if(r>-1)  return new Error(format('Value %s is not negativeInteger', v))
            return r
        },
        nonNegativeInteger: function(v, toString){
            return toString ? v.toString() : v*1
        },
        nonPositiveInteger: function(v, toString){
            return toString ? v.toString() : v*1
        },
        positiveInteger: function(v, toString){
            return toString ? v.toString() : v*1
        },
        short: function(v, toString){
            return toString ? v.toString() : v*1
        },
        unsignedByte: function(v, toString){
            return toString ? v.toString() : v*1
        },
        unsignedShort: function(v, toString){
            return toString ? v.toString() : v*1
        },
        unsignedInt: function(v, toString){
            return toString ? v.toString() : v*1
        },
        unsignedLong: function(v, toString){
            return toString ? v.toString() : v*1
        },
        unsignedShort: function(v, toString){
            return toString ? v.toString() : v*1
        },
    
        /**
         * Calendar date.Format CCYY-MM-DD. Example, May the 
         * 31st, 1999 is: 1999-05-31
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {Date}   Converted value
         */
        date: function(v, toString){
        	if(toString) return moment(v).format("YYYY-MM-DD")
            return moment(v, "YYYY-MM-DD")._d
        },
        
        /**
         * Specific instant of time. ISO 8601 extended format 
         * CCYY-MM-DDThh:mm:ss. Example, to indicate 1:20 pm 
         * on May the 31st, 1999 for Eastern Standard Time which 
         * is 5 hours behind Coordinated Universal Time (UTC): 
         * 1999-05-31T13:20:00-05:00.
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {Date}   Converted value
         */
        dateTime: function(v, toString){
        	if(toString) return moment(v).format()
            return moment(v)._d
        },
        duration: function(v, toString){
        	return toString ? v.toString() : v
        },
        gDay: function(v, toString){
        	return toString ? v.toString() : v
        },
        gMonth: function(v, toString){
        	return toString ? v.toString() : v
        },
        gMonthDay: function(v, toString){
        	return toString ? v.toString() : v
        },
        gYear: function(v, toString){
        	return toString ? v.toString() : v
        },
        gYearMonth: function(v, toString){
        	return toString ? v.toString() : v
        },

        /**
         * An instant of time that recurs every day. Example, 1:20 
         * pm for Eastern Standard Time which is 5 hours behind 
         * Coordinated Universal Time (UTC), write: 13:20:00-05:00. 
         * @param  {string} v Input value
         * @param {bool} toString Flag to convert from var to string
         * @return {Date}   Converted value
         */
        time: function(v, toString){
        	if(toString) return moment(v).format('HH:mm:ssZ')
            return moment(v, 'HH:mm:ssZ')._d
        },
    },

    /**
     * Check type name in list of stzndart types
     * @param  {string}  typeName Type name to check
     * @return {Boolean}          Tru/false
     */
    isType: function(typeName){
        return this.typeNames.indexOf(typeName)>=0
    }, 

    /**
     * Conver string to set type
     * @param  {string} typeName Type name
     * @param  {string} value    String of value
     * @return {any}          Converted var
     */
    toType: function(typeName, value){
        if(this._convert[typeName]){
            try{
                return this._convert[typeName](value)
            }catch(e){
                return new Error(e.stack)
            }
        }else{
            return new Error(format('Type %s not found', typeName))
        }
    }, 

    /**
     * Conver set type to string
     * @param  {string} typeName    Type name
     * @param  {any} value          Value to convert
     * @return {string}             Converted string
     */
    toXML: function(typeName, value){
        if(this._convert[typeName]){
            try{
                return this._convert[typeName](value, true)
            }catch(e){
                return new Error(e.stack)
            }
        }else{
            return new Error(format('Type %s not found', typeName))
        }
    }

}

// console.log(ShemaTypes.toType('string', 'проверка'))
// console.log(ShemaTypes.toType('date', '1999-05-31'))
// console.log(ShemaTypes.toType('dateTime', '1999-05-31T13:20:00+04:00'))
// console.log(ShemaTypes.toType('time', '13:20:00+04:00'))
// console.log(ShemaTypes.toType('negativeInteger', '200'))
// console.log(ShemaTypes.toType('negativeInteger', '-200'))

/**
 * Экспортруем функцию
 */
module.exports = ShemaTypes;

