# True Spot
This is a react-native application that makes use of native modules, react-native-ble-plx and react-native-bg-thead, to connect a device to a network of ble peripherals to show an estimation of where the device is on a downloaded map. This is done by searching for data beacons in the peripheral network which contain the map image and location data. The application connects to one of these devices and requests that the map image and location data be sent to the applicaiton. Once the application has recieved this data, it disconnects from the data beacon. The application than determines the its location in on the map based on relative recieved signal strength (RSSI) from BLE advertisments from the beacons in the ble peripheral network. There needs to be a least 3 beacons sending their RSSI to the application for it to perform a trilateration calculation to pinpoint a location.

# Getting Started
The application is currently designed to work on an Android device. It has not been tested on an iOS device, but could still work if it was build using XCode.

## Dependencies
As stated above, this appliction relies on native modules to be installed.
1. In the command line, navigate to the directory and run `npm install --save react-native-ble-plx`.
2. Run `npm install --save react-native-bg-thread` as well.

**Note:** If you run into issues while attempting to load and run the application, attempt to link the libraries manully using `react-native link react-native-ble-plx` and `react-native link react-native-bg-thread`.

## Loading and Running the Application
In order to run the device on a connected Android device or downloaded Android emulator, Android Studio must be downloaded. Also ensure that the connected android device has usb debugging enabled.

To load the application and run it on an android device, in the command line run `npm run android`