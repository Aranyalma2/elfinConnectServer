const logger = require("../logger");
const CryptoJS = require('crypto-js');

const keyUTF8 = "0123456789abcdef";

const key = CryptoJS.enc.Utf8.parse(keyUTF8);


function decryptAESCBC(encryptedText){
    let decryptedText = CryptoJS.AES.decrypt(encryptedText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding,
    iv: key
    });
    return decryptedText.toString(CryptoJS.enc.Utf8);
}

function encryptAESCBC(messageText){
    let encryptedText = CryptoJS.AES.encrypt(messageText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding,
    iv: key
    });
    return encryptedText.ciphertext;
}

module.exports = { decryptAESCBC, encryptAESCBC};