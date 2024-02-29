# Elfin Connect Gateway Server

* Backend for Elfin Connect service, this is not a standalone application, for basic functionalities, must have a MongoDB connection. It will use multiple documents in database.
* This service handle end devices' connection, heartbeat and other queries. Desktop app and end devices directly connecting this by tcp websocket.
* This version is fully functional without webui, laters may not be.

## Basic functionalities

The app is listening on tcp port 3001.

### Message format
>[!NOTE]
>This format will be deprecated soon by security reasons, so verbose documentation will be available after changes.

```
type;uuid;content
```
* type : beat/data/connthem/connme/query
* uuid : user unique identifier
* content : specified datas by type

- **beat** Handle end devices' heatbeats
- **data** Handle data contents, try to forward
- **connthem** Try to create socket tunnel between 2 existing socket (by MAC)
- **connme** Try to create tunnel between this socket (where msg came), and another existing one (by mac)
- **query** Return all device for a uuid

## Architect
- **endpoint**: This is representete a physical/virtual device. Device object and function, database interaction, and heartbeat handle. Store device objects and reference socket in memory.
  - ***dataHBHandler.js*** 
This has a solution for a physical device heartbeat correction. If device sending data headered messages, it won't send general heartbeats. For database load reduction this function is not update "lastseendate" attribute in db for all "data" type messages. If a "data" msg income, it will start a timer (timer 1), if second one is come to start a second one (timer 2). On third and more if timer 1&2 still up, it will restart timer 2. If timer 1 reach zero a database update will be triggered, and timer 2 be timer 1.

- **bridge**: Store active connection tunnels only in memory. Able to create, check existing and destroy tunnels.



