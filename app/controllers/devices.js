var DevicesService = require('../services/devices').DevicesService;

var list = function list(req, res, next) {
  var devicesSvc = new DevicesService();
  devicesSvc.list(function onDevicesReturned(err, deviceList) {
    if (err) {
      next(err);
    } else {
      res.json(deviceList.keys);
    }
  });
};

var upsert = function upsert(req, res, next) {
  var devicesSvc;

  if (!req.body) {
    res.sendStatus(400);
    return;
  }

  devicesSvc = new DevicesService();
  devicesSvc.upsert(req.body, function onDevicesCreated(err, added) {
    if (err) {
      next(err);
    } else if (!added) {
      res.sendStatus(500); // TODO: verify in which case a device isn't added
    } else {
      res.end();
    }
  });
};

var remove = function remove(req, res, next) {
  var devicesSvc = new DevicesService();
  devicesSvc.remove(req.params.id, function onDevicesReturned(err, deleted) {
    if (err) {
      next(err);
    } else if (!deleted) {
      res.sendStatus(500); // TODO: verify in which case a device isn't removed
    } else {
      res.end();
    }
  });
};

var listBcast = function listBcast(req, res, next) {
  var devicesSvc = new DevicesService();
  devicesSvc.listBroadcasting(function onDevicesReturned(err, deviceList) {
    if (err) {
      next(err);
    } else {
      res.json(deviceList);
    }
  });
};

module.exports = {
  list: list,
  upsert: upsert,
  remove: remove,
  listBcast: listBcast
};