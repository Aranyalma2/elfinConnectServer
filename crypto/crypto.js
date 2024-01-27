const logger = require("../logger");
const CryptoJS = require('crypto-js');

const keyUTF8 = "0123456789abcdef";

const key = CryptoJS.enc.Utf8.parse(keyUTF8);


function decryptAESCBC(encryptedText){
    let decryptedText = CryptoJS.AES.decrypt(encryptedText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: key
    });
    return decryptedText.toString(CryptoJS.enc.Hex);
}

function encryptAESCBC(messageText){
    let encryptedText = CryptoJS.AES.encrypt(messageText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: key
    });
    return Buffer.from(encryptedText.ciphertext.toString(CryptoJS.enc.Hex), 'hex');
}

module.exports = { decryptAESCBC, encryptAESCBC};