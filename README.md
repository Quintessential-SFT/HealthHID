<h1 align="center">HealthHID</h1>
<p align="center">A library for interacting with medical devices over WebHID.</p>
<br />

This library is primarily focused around receiving readings from health-related biometric devices.

### Usage:
Due to WebHID security-related limitations, users need to explicitly grant the page permission to utilize their devices on every single page load.<br />
As such, users of the library need to manually call ask for a device handle via `Device.requestDevice()`.<br />
Upon receiving access, the device will be automatically opened and ready for use.<br />
Individual devices may then utilize said device handle to interact with the hardware device through the relevant device utils.<br />
Besides returning the actual response, device commands typically log successful output in a text representation.<br />
By default, said output is piped to the console, but a custom data handler may be specified via `devHandle.strOut = dataHandler`.

### Example: 👨🏻‍🔬
``` bash
# Retrieving the active slot's current user ID from a Microlife Blood Pressure Monitor

const userId = await HealthHid.bpm.cmd.getUserId(device);
console.log(userId);
> KON14
```

### Demo Dashboard:
``` bash
npm run serve

# Navigate to http://localhost:8080
```

### Supported Devices:
- Microlife Blood Pressure Monitors (BPA-100-compatible)

### Limitations:
[WebHID is currently only supported on Chromium* desktop browsers.](https://caniuse.com/webhid)

### Acknowledgements
🐍 [joergmlpts/blood-pressure-monitor](https://github.com/joergmlpts/blood-pressure-monitor)
