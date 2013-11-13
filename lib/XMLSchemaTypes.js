// REQUIMENT
var moment = require('moment'), 
    format = require('util').format

/**
 * Convert and rule  XML Schema types primitive
 * @class WSDLService.XMLSchemaTypes
 * @static
 */
var XMLSchemaTypes = {
	/**
     * List of type names of XML Schema
     * @private
     * @property {Array} typeNames
     */
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
        
    /**
     * XML Schema type description
     * @private
     * @property {WSDLService.XMLSchemaTypes.Convert} _convert
     */
    _convert: {
        /**
         * Character string in XML
         * 
         * @method string
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        string: function(v, toString){
    		return toString ? v.toString() : v
    	},
        
        /**
         * A Uniform Resource Identifier Reference (URI). Can be 
         * absolute or relative, and may have an optional fragment 
         * identifier
         * 
         * @method anyURI
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        anyURI: function(v, toString){
            return toString ? v.toString() : v
        },
        
        /**
         * natural language identifiers [RFC 1766]
         *  
         * Example: en, fr. 
         * 
         * @method language
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        language: function(v, toString){
            return toString ? v.toString() : v
        },
        
        /**
         * White space normalized strings 
         * 
         * @method normalizedString
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        normalizedString: function(v, toString){
            return toString ? v.toString() : v
        },
        
        /**
         * binary-valued logic legal literals {true, false, 1, 0}
         * 
         * @method token
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        token: function(v, toString){
            if(toString) return v ? '1' : '0'
            return v ? true : false
        },

        /**
         * binary-valued logic legal literals {true, false, 1, 0}
         * 
         * @method boolean
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        boolean: function(v, toString){
        	if(toString) return v ? '1' : '0'
            return v ? true : false
        },
        
        /**
         * Base64-encoded arbitrary binary data.
         * 
         * @method base64Binary
         * @experimental
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        base64Binary: function(v, toString){
            return toString ? v.toString('base64') : new Buffer(v, 'base64')
        },

        /**
         * Arbitrary hex-encoded binary data. 
         * 
         * Example, “0FB7” is a hex encoding for 16-bit int 4023 (binary 111110110111).
         * 
         * @method hexBinary
         * * @experimental
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        hexBinary: function(v, toString){
            return toString ? v.toString('hex') : new Buffer(v, 'hex')
        },
                
        /**
         * 127 to-128. Sign is omitted, “+” assumed. 
         * 
         * Example: -1, 0, 126, +100. 
         * 
         * @method byte
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        byte: function(v, toString){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not byte', v))
            if(r>127 || r<-128) return new Error(format('Value "%s" is not byte', v))
            return r
        },
        
        /**
         * Arbitrary precision decimal numbers. Sign 
         * omitted, “+” is assumed. Leading and trailing 
         * zeroes are optional. If the fractional part is 
         * zero, the period and following zero(es) can be 
         * omitted.
         * 
         * @method decimal
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        decimal: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not decimal', v))
            return r
        },
        
        /**
         * Double-precision 64-bit floating point type - legal literals {0, -0, INF, -INF and NaN} 
         * 
         * Example, -1E4, 12.78e-2, 12 and INF.
         * 
         * @method double
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        double: function(v){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not double', v))
            return r
        },
        
        /**
         * 32-bit floating point type - legal literals {0, -0, INF, -INF and NaN} 
         * 
         * Example, -1E4, 1267.43233E12, 12.78e-2, 12 and INF.
         * 
         * @method float
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        float: function(v){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not float', v))
            return r
        },
        
        /**
         * 2147483647 to -2147483648. Sign omitted, “+” is assumed. 
         * 
         * Example: -1, 0, 126789675, +100000.
         * 
         * @method int
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        int: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not int', v))
            if(r>2147483647 || r<-2147483648) return new Error(format('Value "%s" is not int', v))
            return r
        },
        
        /**
         * Integer or whole numbers - Sign omitted, “+” is 
         * assumed. 
         * 
         * Example: -1, 0, 12678967543233, +100000. 
         * 
         * @method integer
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        integer: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not integer', v))
            if(r>2147483647 || r<-2147483648) return new Error(format('Value "%s" is not integer', v))
            return r
        },

        /**
         * 9223372036854775807 to -9223372036854775808. Sign omitted, “+” assumed. 
         * 
         * Example: -1, 0, 12678967543233, +100000.
         * 
         * @method long
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        long: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not long', v))
            if(r>9223372036854775807 || r<-9223372036854775808) return new Error(format('Value "%s" is not long', v))
            return r
        },
        
        /**
         * Infinite set {...,-2,-1}.
         *  
         * Example: -1, -12678967543233, -100000.
         * 
         * @method negativeInteger
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        negativeInteger: function(v, toString){
        	if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not negativeInteger', v))
            if(r>-1)  return new Error(format('Value "%s" is not negativeInteger', v))
            return r
        },

        /**
         * Infinite set {0, 1, 2,...}. Sign omitted, “+” assumed. 
         * 
         * Example: 1, 0, 12678967543233, +100000.
         * 
         * @method nonNegativeInteger
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        nonNegativeInteger: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not nonNegativeInteger', v))
            if(r<0)  return new Error(format('Value "%s" is not nonNegativeInteger', v))
            return r
        },
        
        /**
         * Infinite set {...,-2,-1,0}. 
         * 
         * Example: -1, 0, -126733, -100000.
         * 
         * @method nonPositiveInteger
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        nonPositiveInteger: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not nonPositiveInteger', v))
            if(r>0)  return new Error(format('Value "%s" is not nonPositiveInteger', v))
            return r
        },

        /**
         * Infinite set {1, 2, 3, ...}. Optional "+" sign
         * 
         * Example: 1, 345345, +43534.
         * 
         * @method positiveInteger
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        positiveInteger: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not positiveInteger', v))
            if(r<1)  return new Error(format('Value "%s" is not positiveInteger', v))
            return r
        },

        /**
         * 32767 to -32768. Sign omitted, “+” assumed. 
         * 
         * Example: -1, 0, 12678, +10000.
         * 
         * @method short
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        short: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not short', v))
            if(r>32767 || r<-32768) return new Error(format('Value "%s" is not short', v))
            return r
        },

        /**
         * 0 to 255. a finite-length 
         * 
         * Example: 0, 126, 100.
         * 
         * @method unsignedByte
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        unsignedByte: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not unsignedByte', v))
            if(r>255 || r<0) return new Error(format('Value "%s" is not unsignedByte', v))
            return r
        },
        
        /**
         * 0 to 4294967295 
         * 
         * Example: 0, 1267896754, 100000.
         * 
         * @method unsignedInt
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        unsignedInt: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not unsignedInt', v))
            if(r>4294967295 || r<0) return new Error(format('Value "%s" is not unsignedInt', v))
            return r
        },

        /**
         * 0 to 18446744073709551615. 
         * 
         * Example: 0, 12678967543233, 100000. 
         * 
         * @method unsignedLong
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        unsignedLong: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not unsignedLong', v))
            if(r>18446744073709551615 || r<0) return new Error(format('Value "%s" is not unsignedLong', v))
            return r
        },

        /**
         * 0 to 65535. 
         * 
         * Example: 0, 12678, 10000.
         * 
         * @method unsignedShort
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        unsignedShort: function(v, toString){
            if(toString) return v.toString()
            var r = v*1
            if(isNaN(r)) return new Error(format('Value "%s" is not unsignedShort', v))
            if(r>65535 || r<0) return new Error(format('Value "%s" is not unsignedShort', v))
            return r
        },
    
        /**
         * Calendar date.Format CCYY-MM-DD. 
         * 
         * Example, May the 31st, 1999 is: 1999-05-31
         * 
         * @method date
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        date: function(v, toString){
        	if(toString) return moment(v).format("YYYY-MM-DD")
            var d = moment(v, "YYYY-MM-DD")
            if(!d.isValid()) return new Error(format('Value "%s" is not date', v))
            return d._d
        },
        
        /**
         * Specific instant of time. ISO 8601 extended format 
         * CCYY-MM-DDThh:mm:ss. 
         * 
         * Example, to indicate 1:20 pm on May the 31st, 1999 
         * for Eastern Standard Time which is 5 hours behind 
         * Coordinated Universal Time (UTC): 1999-05-31T13:20:00-05:00.
         * 
         * @method dateTime
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        dateTime: function(v, toString){
        	if(toString) return moment(v).format()
            var d = moment(v) 
            if(!d.isValid()) return new Error(format('Value "%s" is not dateTime', v))
            return d._d
        },
        
        /**
         * A duration of time. ISO 8601 extended format PnYn MnDTnH nMn S. 
         * 
         * Example, to indicate duration of 1 year, 2 months, 3 days, 10 hours, 
         * and 30 minutes: P1Y2M3DT10H30M. One could also indicate a duration of 
         * minus 120 days as: -P120D.
         *
         * @experimental
         * Not work correct now, convert string<->string
         * 
         * @method duration
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        duration: function(v, toString){
        	return toString ? v.toString() : v
        },
        
        /**
         * Gregorian day. 
         * 
         * Example a day such as the 5th of the month is --05.
         * 
         * @experimental
         * Not work correct now, convert string<->string
         * 
         * @method gDay
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        gDay: function(v, toString){
        	return toString ? v.toString() : v
        },
        
        /**
         * Gregorian month. 
         * 
         * Example: May is --05--
         *
         * @experimental
         * Not work correct now, convert string<->string
         *
         * @method gMonth
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        gMonth: function(v, toString){
        	return toString ? v.toString() : v
        },
        
        /**
         * Gregorian specific day in a month.
         * 
         * Example: Feb 5 is --02-05.
         *
         * @experimental
         * Not work correct now, convert string<->string
         * 
         * @method gMonthDay
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        gMonthDay: function(v, toString){
        	return toString ? v.toString() : v
        },
        
        /**
         * Gregorian calendar year. 
         * 
         * Example, year 1999, write: 1999.
         *
         * @experimental
         * Not work correct now, convert string<->string
         * 
         * @method gYear
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        gYear: function(v, toString){
        	return toString ? v.toString() : v
        },
        
        /**
         * Specific gregorian month and year. 
         * 
         * Example, May 1999, write: 1999-05.
         *
         * @experimental
         * Not work correct now, convert string<->string
         * 
         * @method gYearMonth
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        gYearMonth: function(v, toString){
        	return toString ? v.toString() : v
        },

        /**
         * An instant of time that recurs every day. 
         * 
         * Example, 1:20 pm for Eastern Standard Time which is 
         * 5 hours behind Coordinated Universal Time (UTC), 
         * write: 13:20:00-05:00. 
         * 
         * @method time
         * @member WSDLService.XMLSchemaTypes.Convert
         * @param   {string}    v           value for convert
         * @param   {boolean}      toString    if need to convert for XML response
         * @return  {Object}                conversion result
         */
        time: function(v, toString){
        	if(toString) return moment(v).format('HH:mm:ssZ')
            var d = moment(v, 'HH:mm:ssZ')
            if(!d.isValid()) return new Error(format('Value "%s" is not time', v))
            return d._d
        },
    },

    /**
     * Check type name in list of primitives types
     * @method isType
     * @param  {string}     typeName    Type name to check
     * @return {Boolean}                True/false
     */
    isType: function(typeName){
        return this.typeNames.indexOf(typeName)>=0
    }, 

    /**
     * Conver string to set type
     * @method toType
     * @param  {string} typeName    Type name
     * @param  {string} value       String of value
     * @return {Object}             Converted var
     */
    toType: function(typeName, value){
        if(this._convert[typeName]){
            try{
                return this._convert[typeName](value)
            }catch(e){
                return new Error(e.stack)
            }
        }else{
            return new Error(format('Type "%s" not found', typeName))
        }
    }, 

    /**
     * Conver set type to string
     * @method toXML
     * @param  {string}     typeName    Type name
     * @param  {Object}     value       Value to convert
     * @return {string}                 Converted string
     */
    toXML: function(typeName, value){
        if(this._convert[typeName]){
            try{
                return this._convert[typeName](value, true)
            }catch(e){
                return new Error(e.stack)
            }
        }else{
            return new Error(format('Type "%s" not found', typeName))
        }
    }

}

//EXPORT
module.exports = XMLSchemaTypes;

