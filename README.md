# Homey.ink

Homey.ink is an open-source project for wall-mounted Homey dashboards.

![](https://homey.ink/img/hero-device.png)

While initially created for e-ink readers, due to their low-power consumption, there is no reason why other tablets won't work.

## Theming

A theming system is in place to add support for multiple devices. Currently only Kobo H2O is supported, but pull requests with support for other devices are welcome.

See `/app/css/themes` for the themes' css. To add a theme, simply add a file. The theme will be loaded when visiting `https://app.homey.ink/?theme=THEME_ID`.

## Contributing

New themes to add support for devices are accepted when he pull request includes:

* A screenshot of the theme, made on the device
* A real-world photo of the device running the theme

## Debugging

To run this locally:

```
npm i -g serve
git clone https://github.com/athombv/homey.ink.git
cd homey.ink
serve -p 5000 app
```
Then visit `http://localhost:5000/?token=YOUR_TOKEN&theme=YOUR_THEME`.

> Your token can be acquired by visiting https://homey.ink and looking in the console after logging in.
