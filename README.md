# Elfin Connect Gateway Server

* Backend for Elfin Connect service, this is not a standalone application, for basic functionalities, must have a MongoDB connection. It will use multiple documents in database.
* This service handle end devices' connection, heartbeat and other queries. Desktop app and end devices directly connecting this by tcp websocket.
* This version is fully functional without webui, laters may not be.

## Basic functionalities

The app is listening on tcp port 3001.

### Message format
>[!NOTE]
>This format will deprecated soon by security reasons, so verbose documentation will be available after changes.

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
