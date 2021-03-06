var cloud = require('../models/cloud');
var users = require('../models/users');
var gateway = require('../models/gateway');
var CloudService = require('../services/cloud').CloudService;
var ConnectorService = require('../services/connector').ConnectorService;

var get = function get(req, res, next) {
  cloud.getCloudSettings(function onCloudSettingsReturned(err, settings) {
    if (err) {
      next(err);
    } else {
      res.json(settings);
    }
  });
};

var getSecurity = function getSecurity(req, res, next) {
  cloud.getCloudSecuritySettings(function onCloudSecuritySettingsReturned(err, settings) {
    if (err) {
      next(err);
    } else {
      res.json(settings);
    }
  });
};

var listGateways = function listGateways(req, res, next) {
  cloud.getCloudSettings(function onCloudSettings(getCloudErr, cloudSettings) {
    var cloudSvc;
    if (getCloudErr) {
      next(getCloudErr);
    } else {
      users.getUser(function onUserGet(getUserErr, user) {
        if (getUserErr) {
          next(getUserErr);
        } else {
          cloudSvc = new CloudService(cloudSettings.authenticator, cloudSettings.knotCloud);
          cloudSvc.listDevices(user, { type: 'knot:gateway' }, function onDevicesListed(listDevicesErr, gateways) {
            if (listDevicesErr) {
              next(listDevicesErr);
            } else {
              res.json(gateways);
            }
          });
        }
      });
    }
  });
};

var finishSetup = function finishSetup(platform, cloudSettings, gatewaySettings, done) {
  gateway.setGatewaySettings(gatewaySettings, function onGatewaySettingsUpdated() {
    var connectorSvc = new ConnectorService();
    connectorSvc.setCloudConfig(platform, {
      protocol: cloudSettings.protocol,
      hostname: cloudSettings.hostname,
      port: cloudSettings.port,
      path: cloudSettings.path,
      uuid: gatewaySettings.uuid,
      token: gatewaySettings.token
    }, function onCloudConfigSet(setCloudConfigErr) {
      if (setCloudConfigErr) {
        done(setCloudConfigErr);
      } else {
        done(null);
      }
    });
  });
};

var createGateway = function createGateway(req, res, next) {
  cloud.getCloudSettings(function onCloudSettings(getCloudErr, cloudSettings) {
    var cloudSvc;
    if (getCloudErr) {
      next(getCloudErr);
    } else {
      users.getUser(function onUserGet(getUserErr, user) {
        if (getUserErr) {
          next(getUserErr);
        } else {
          cloudSvc = new CloudService(cloudSettings.authenticator, cloudSettings.knotCloud);
          cloudSvc.createGateway(user, req.body.name, function onGatewayCreated(createGatewayErr, newGateway) { // eslint-disable-line max-len
            if (createGatewayErr) {
              next(createGatewayErr);
            } else {
              finishSetup(cloudSettings.platform, cloudSettings.knotCloud, {
                uuid: newGateway.knot.id,
                token: newGateway.token
              }, function onSetupDone(finishSetupErr) {
                if (finishSetupErr) {
                  next(finishSetupErr);
                } else {
                  res.send(200);
                }
              });
            }
          });
        }
      });
    }
  });
};

var activateGateway = function activateGateway(req, res, next) {
  var uuid = req.params.id;
  var cloudService;
  cloud.getCloudSettings(function onCloudSettings(err, settings) {
    if (err) {
      next(err);
    } else {
      users.getUser(function onUser(userErr, user) {
        if (userErr) {
          next(userErr);
        } else {
          cloudService = new CloudService(settings.authenticator, settings.knotCloud);
          cloudService.activateGateway(user, uuid, function onActivate(activateErr, token) {
            if (activateErr) {
              next(activateErr);
            } else {
              finishSetup(settings.platform, settings.knotCloud, {
                uuid: uuid,
                token: token
              }, function onSetupDone(finishSetupErr) {
                if (finishSetupErr) {
                  next(finishSetupErr);
                } else {
                  res.end();
                }
              });
            }
          });
        }
      });
    }
  });
};

var update = function update(req, res, next) {
  cloud.setCloudSettings(req.body, function onCloudSettingsSet(setCloudErr) {
    var connectorSvc = new ConnectorService();

    if (setCloudErr) {
      next(setCloudErr);
    } else if (req.body.platform === 'FIWARE') {
      connectorSvc.setCloudConfig(req.body.platform, {
        disableSecurity: req.body.disableSecurity,
        iota: req.body.iota,
        orion: req.body.orion
      }, function onCloudConfigSet(setCloudConfigErr) {
        if (setCloudConfigErr) {
          next(setCloudConfigErr);
        } else {
          res.end();
        }
      });
    } else {
      res.end();
    }
  });
};

var updateSecurity = function updateSecurity(req, res, next) {
  var connectorSvc;

  cloud.setCloudSecuritySettings(req.body, function onCloudSecuritySettingsSet(setCloudErr) {
    if (setCloudErr) {
      next(setCloudErr);
    } else {
      connectorSvc = new ConnectorService();
      connectorSvc.setCloudSecurityConfig(
        req.body,
        function onCloudSecurityConfigSet(setCloudSecurityConfigErr) {
          if (setCloudSecurityConfigErr) {
            next(setCloudSecurityConfigErr);
          } else {
            res.end();
          }
        }
      );
    }
  });
};

module.exports = {
  get: get,
  getSecurity: getSecurity,
  listGateways: listGateways,
  update: update,
  updateSecurity: updateSecurity,
  createGateway: createGateway,
  activateGateway: activateGateway
};
