/*!
 * Tryte UTF-8 JSON Codec
 * Copyright Peter Ryszkiewcz 2017
 * MIT Licensed
 */

const tryteDigits = 16 // A...P

// 0 -> 0x41 ('A'), 1 -> 0x42 ('B'), ..., 16 -> 0x50 ('P')
const byteToTryteArray = Array.from(new Array(tryteDigits), (x, i) => 'A'.charCodeAt(0) + i)

// 0x41 ('A') -> 0, 0x42 ('B') -> 1, ..., 0x50 ('P') -> 16
const tryteToByteMapping = byteToTryteArray.reduce((accumulator, currentValue, currentIndex) => {
    accumulator[currentValue] = currentIndex
    return accumulator
}, {})

function trytesFromBuffer(buffer) {
    const tryteBuffer = Buffer.alloc(buffer.length * 2)
    let offset = 0
    for(const byte of buffer) {
        tryteBuffer[offset++] = byteToTryteArray[(byte & 0xF0) >>> 4]
        tryteBuffer[offset++] = byteToTryteArray[byte & 0x0F]
    }
    return tryteBuffer.toString()
}

// 'A' -> 0x41 -> [0x40, 0x01] -> [0x04, 0x01] -> ['E', 'B'] -> 'EB' (as Trytes)
// '😃' -> 0xF09F9883 -> [0xF0, 0x00, 0x90, 0x0F, 0x90, 0x08, 0x80, 0x03] -> [0x0F, 0x00, 0x09, 0x0F, 0x09, 0x08, 0x08, 0x03] -> ['P', 'A', 'J', 'P', 'J', 'I', 'I', 'D'] -> 'PAJPJIID' (as Trytes)
function trytesFromUTF8String(text) {
    return trytesFromBuffer(Buffer.from(text))
}

function bufferFromTrytes(trytes) {
    if(!trytes) { throw 'Invalid input' }
    if(trytes.length <= 0) {
        throw 'Invalid trytes length. Should be > 0.'
    }
    if(trytes.length % 2 !== 0) {
        trytes = trytes.slice(0, -1) // truncate last tryte
    }

    const stringBuffer = Buffer.alloc(trytes.length / 2, 0)
    for(let offset = 0; offset < stringBuffer.length; ++offset) {
        const tryteOffset = offset * 2
        const hiTryte = trytes[tryteOffset].charCodeAt(0)
        const loTryte = trytes[tryteOffset + 1].charCodeAt(0)
        if(!tryteToByteMapping.hasOwnProperty(hiTryte) || !tryteToByteMapping.hasOwnProperty(loTryte)) {
            return stringBuffer.slice(0, offset)
        }
        const hiNibble = tryteToByteMapping[hiTryte] << 4
        const loNibble = tryteToByteMapping[loTryte]
        stringBuffer[offset] = hiNibble | loNibble
    }

    return stringBuffer
}

function utf8StringFromTrytes(trytes) {
    return bufferFromTrytes(trytes).toString()
}

function objectFromTritifiedJSON(trytes) {
    return JSON.parse(utf8StringFromTrytes(trytes))
}

function tritifiedJSONFromObject(object) {
    return trytesFromUTF8String(JSON.stringify(object))
}

const TryteEncoderDecoder = {
    trytesFromBuffer: trytesFromBuffer,
    trytesFromUTF8String: trytesFromUTF8String,
    bufferFromTrytes: bufferFromTrytes,
    utf8StringFromTrytes: utf8StringFromTrytes,
    tritifiedJSONFromObject: tritifiedJSONFromObject,
    objectFromTritifiedJSON: objectFromTritifiedJSON,
}

module.exports = TryteEncoderDecoder
