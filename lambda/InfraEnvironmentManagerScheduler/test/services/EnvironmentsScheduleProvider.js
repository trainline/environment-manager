var assert                       = require("assert"),
    sinon                        = require("sinon"),
    Enums                        = require("../../Enums.js"),
    EnvironmentsScheduleProvider = require("../../services/EnvironmentsScheduleProvider.js");

var ENVIRONMENT_NAME = 'st1';

var dynamoTableProviderMock = { scanTable: null};

var anomalyCollectorMock = { add: function() {} };

var target = new EnvironmentsScheduleProvider(dynamoTableProviderMock, anomalyCollectorMock);

function Test(givenData, expectedValue, reason) {

  var scenario = "When environment '" + ENVIRONMENT_NAME + "' has:" +
                     " DefaultSchedule = '"       + givenData.DefaultSchedule       + "'" +
                 " and ScheduleAutomatically = '" + givenData.ScheduleAutomatically + "'" +
                 " and ManualScheduleUp = '"      + givenData.ManualScheduleUp      + "'" ;

  describe(scenario, function() {

    var message = "It should return: '" + expectedValue.expected + "' for the environment '" + ENVIRONMENT_NAME + "'.";
    if (reason) message += reason;

    it(message, function () {
      assert(!expectedValue.error);
      assert(expectedValue.current[ENVIRONMENT_NAME] !== undefined);
      assert.equal(expectedValue.current[ENVIRONMENT_NAME], expectedValue.expected);
    });

  });

}

function Given(data) {
  var environment = {
    EnvironmentName: ENVIRONMENT_NAME,
    Value: data
  };

  before(function () {
    dynamoTableProviderMock.scanTable = function (tableName, callback) {
      callback(null, [environment]);
    }
  });

  return data;
};

function Expect(value) {
  var result = {
    error: null,
    current: null,
    expected: value
  };
  
  before(function () {
    
    target.get(function (error, response) {
      result.error = error;
      result.current = response;
    });

  });
  
  return result;
}

function Because(reason) {
  return "\n      Because " + reason;
}

// CASE SCENARIOS

Test(
  Given({ DefaultSchedule: undefined, ScheduleAutomatically: undefined, ManualScheduleUp: undefined }),
  Expect(null),
  Because("'null' value lets it overridable by the global value")
);

Test(
  Given({ DefaultSchedule: 'value', ScheduleAutomatically: undefined, ManualScheduleUp: undefined }), 
  Expect('value'), 
  Because("schedule is considered automatic by default and 'null' value lets it overridable by the global value")
);

Test(
  Given({ DefaultSchedule: undefined, ScheduleAutomatically: true, ManualScheduleUp: undefined }), 
  Expect(null), 
  Because("schedule is automatic but no value is provided and 'null' value lets it overridable by the global value")
);

Test(
  Given({ DefaultSchedule: 'value', ScheduleAutomatically: true, ManualScheduleUp: undefined }), 
  Expect('value'), 
  Because("schedule is automatic and value is provided")
);

Test(
  Given({ DefaultSchedule: undefined, ScheduleAutomatically: false, ManualScheduleUp: true }), 
  Expect(Enums.FIXED_SCHEDULE.AlwaysOn), 
  Because("schedule is manually and set to be ON")
);

Test(
  Given({ DefaultSchedule: undefined, ScheduleAutomatically: false, ManualScheduleUp: false }), 
  Expect(Enums.FIXED_SCHEDULE.AlwaysOff), 
  Because("schedule is manually and set to be OFF")
);

Test(
  Given({ DefaultSchedule: undefined, ScheduleAutomatically: false, ManualScheduleUp: undefined }), 
  Expect(null), 
  Because("schedule is manual but the expected state is not defined. Therefore 'null' value lets it overridable by the global value")
);

Test(
  Given({ DefaultSchedule: 'value', ScheduleAutomatically: false, ManualScheduleUp: undefined }), 
  Expect(null), 
  Because("schedule is manual but the expected state is not defined. Therefore 'null' value lets it overridable by the global value")
);