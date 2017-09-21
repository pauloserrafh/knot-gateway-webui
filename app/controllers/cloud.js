var cloud = require('../models/cloud');
var FogService = require('../services/fog').FogService;

var get = function get(req, res, next) {
  cloud.getCloudSettings(function onCloudSettingsReturned(err, cloudSettings) {
    if (err) {
      next(err);
    } else {
      res.json(cloudSettings);
    }
  });
};

var upsert = function upsert(req, res, next) {
  cloud.setCloudSettings(req.body, function onCloudSettingsSet(setCloudErr) {
    var fogSvc;
    if (setCloudErr) {
      next(setCloudErr);
    } else {
      fogSvc = new FogService();
      fogSvc.setParentAddress({
        host: req.body.servername,
        port: req.body.port
      }, function onParentAddressSet(setAddressErr) {
        if (setAddressErr) {
          next(setAddressErr);
        } else {
          res.end();
        }
      });
    }
  });
};

module.exports = {
  get: get,
  upsert: upsert
};
