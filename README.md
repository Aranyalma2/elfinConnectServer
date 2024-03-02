<h1 align="center">Elfin Connect Gateway Server</h1>
<p align="center">
<img alt="Github top language" src="https://img.shields.io/badge/version-0.2.87-blue">

<img alt="Github top language" src="https://img.shields.io/github/languages/top/Aranyalma2/elfinconnectserver?color=8f3d3d">

<img alt="Codacy qualty" src="https://img.shields.io/codacy/grade/613bc4d28cf544939634ef41118ed406" />

<img alt="Repository size" src="https://img.shields.io/github/repo-size/Aranyalma2/elfinConnectServer?color=532BEAF">

<img alt="License" src="https://img.shields.io/github/license/Aranyalma2/elfinconnectserver?color=56BEB8">

</p>

<hr>

## :dart: About

* Backend for Elfin Connect service, this is not a standalone application, for basic functionalities, must have a MongoDB connection. It will use multiple documents in database.
* This service handle end devices' connection, heartbeat and other queries. Desktop app and end devices directly connecting this by tcp websocket.
* This version is fully functional without webui, laters may not be.

## :round_pushpin: Basic functionalities

The app is listening on tcp port 3001.

### :envelope: Message format

>[!NOTE]
>This format will be deprecated soon by security reasons, so verbose documentation will be available after changes.

```text
type;uuid;content
```
* type : beat/data/connthem/connme/query
* uuid : user unique identifier
* content : specified datas by type

* **beat** Handle end devices' heatbeats
* **data** Handle data contents, try to forward
* **connthem** Try to create socket tunnel between 2 existing socket (by MAC)
* **connme** Try to create tunnel between this socket (where msg came), and another existing one (by mac)
* **query** Return all device for a uuid

## :books: Architect

* **endpoint**: This is representete a physical/virtual device. Device object and function, database interaction, and heartbeat handle. Store device objects and reference socket in memory.
  + ***dataHBHandler.js*** 
This has a solution for a physical device heartbeat correction. If device sending data headered messages, it won't send general heartbeats. For database load reduction this function is not update "lastseendate" attribute in db for all "data" type messages. If a "data" msg income, it will start a timer (timer 1), if second one is come to start a second one (timer 2). On third and more if timer 1&2 still up, it will restart timer 2. If timer 1 reach zero a database update will be triggered, and timer 2 be timer 1.

* **bridge**: Store active connection tunnels only in memory. Able to create, check existing and destroy tunnels.

## :memo: License

This project is under license from Apache 2.0. For more details, see the [LICENSE](LICENSE.md) file.


Made with :heart: by <a href="https://github.com/Aranyalma2" target="_blank">Aranyalma2</a>

&#xa0;

<a href="#top">Back to top</a>



