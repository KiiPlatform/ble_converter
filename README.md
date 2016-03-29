A converter sitting between Kii gateway-agent and end-nodes communicates with gateway-agent by MQTT, and communicate with end-node by Bluetooth Low Energy(BLE).

## Supported BLE devices
- BLECAST_BL. A BLE enable illuminance sensor, which is not connectable, and advertise the illuminance data. [Home Page of this device](http://www.robotsfx.com/robot/BLECAST_BL.html).
- Nexturn LED Bulb. A bulb enable you to get color or change color through BLE. [Introduction page of this device](http://ascii.jp/elem/000/000/902/902659/).

## Install dependencies

```shell
npm install
```

## Copy config file

```shell
cp examples/config.json ./
```

## Run

```shell
node ble-converter.js
```

## Add more BLE devices
### Add relative lib for the device
If the device is not connectable, and only can get the only throw advertisement, please implement like `lib/blecast-bl.js`.

If the device is connectable, please implement like `nexturn-led.js`.
### Improve ble-central.js
Handle connect and data of the device in `ble-central.js`.
