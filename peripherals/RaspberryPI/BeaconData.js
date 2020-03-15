var fs = require('fs');

var imageData = fs.readFileSync('./floorplan.jpg', 'base64');
console.log('Successfully loaded image!');

var locationData = Array(630, 420,
                    1000, 800);
var descriptionData = Array("Bedroom Door", "Living Room Center");

//The default MTU for BLE is 23 bytes
var currentMTU = 23;

module.exports = 
{
    imageData: imageData,
    locationData: locationData,
    descriptionData: descriptionData,
    currentMTU: currentMTU
}