var assert   = require('assert'),
    lastCron = require('../../services/lastCron.js');

var ScheduleInterpreter = lastCron.ScheduleInterpreter;

var crontests = [];

crontests.push("* * * * * *");
//Each minute
crontests.push("59 23 31 12 5 *");
//   			One minute  before the end of year if the last day of the year is Friday
crontests.push("59 23 31 DEC Fri *");
//			Same as above (different notation)
crontests.push("45 17 7 6 * *");
//     			Every  year, on June 7th at 17:45
crontests.push("45 17 7 6 * 2001,2002");
//		Once a   year, on June 7th at 17:45, if the year is 2001 or  2002
crontests.push("0,15,30,45 0,6,12,18 1,15,31 * 1-5 *");/*
  At 00:00, 00:15, 00:30, 00:45, 06:00, 06:15, 06:30,
  06:45, 12:00, 12:15, 12:30, 12:45, 18:00, 18:15,
  18:30, 18:45, on 1st, 15th or  31st of each  month, but not on weekends */


crontests.push("*/15 */6 1,15,31 * 1-5 *");
//	Same as above (different notation)
crontests.push("0 12 * * 1-5 * ");
//	At midday on weekdays
crontests.push("0 12 * * Mon-Fri *");
//	Same as above (different notation)
crontests.push("* * * 1,3,5,7,9,11 * *")
//  Each minute in January,  March,  May, July, September, and November
crontests.push("1,2,3,5,20-25,30-35,59 23 31 12 * *");
/* On the  last day of year, at 23:01, 23:02, 23:03, 23:05,
								23:20, 23:21, 23:22, 23:23, 23:24, 23:25, 23:30,
                                23:31, 23:32, 23:33, 23:34, 23:35, 23:59 */

crontests.push("0 9 1-7 * 1 *");
//First Monday of each month, at 9 a.m.
crontests.push("0 0 1 * * *");
//At midnight, on the first day of each month
crontests.push("* 0-11 * * *")
//Each minute before midday
crontests.push("* * * 1,2,3 * *")
//Each minute in January, February or March
crontests.push("* * * Jan,Feb,Mar * *")
//Same as above (different notation)
crontests.push("0 0 * * * *");
//                         Daily at midnight
crontests.push("* 0 0 * * 3 *");
//                         Each Wednesday at midnight
crontests.push("0 0 * * 3 *");
//                         Each Wednesday at midnight
crontests.push(" 30 4 * * MON-SAT * "); //problem in parser?
crontests.push(" 30 18 * * MON-SAT *"); //problem in parser?

var dates = {
  'SUNDAY_MORNING': new Date(2016, 01, 21, 10, 00, 00),
  'MONDAY_LUNCHTIME': new Date(2016, 01, 22, 13, 00, 00),
  'Monday after midnight': new Date(2016, 01, 22, 2, 00, 00),
  'Monday almost midnight': new Date(2016, 01, 22, 23, 00, 00),
  'RetailPlus startup': new Date(2016, 01, 22, 4, 30, 00)
};

function TestGiven(scenario, expected) {

  describe("Given the schedule tag [" + scenario.ScheduleTag + "]", function() {

    describe("and its " + scenario.On, function() {

      var message = "Should return: " + expected.ShouldBe;
      if (expected.Because) message += '. Because ' + expected.Because;

      it(message, function() {

        var result = ScheduleInterpreter(scenario.ScheduleTag, dates[scenario.On]);
        assert.equal(result, expected.ShouldBe);

      });

    });

  });

}

TestGiven(
  { ScheduleTag: "Start: 30 6 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'OFF' }
);

TestGiven(
  { ScheduleTag: "Stop: 30 6 * * MON-SAT * Start: 30 20 * * MON-SAT *", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'ON' }
);

TestGiven(
  { ScheduleTag: "Start: 30 6 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'MONDAY_LUNCHTIME' }, 
  { ShouldBe: 'ON' }
);

TestGiven(
  { ScheduleTag: "Start: 30 6 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'Monday after midnight' }, 
  { ShouldBe: 'OFF' }
);

TestGiven(
  { ScheduleTag: "Start: 30 6 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'Monday almost midnight' }, 
  { ShouldBe: 'OFF' }
);

TestGiven(
  { ScheduleTag: "Start: 6 30 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'INVALID', Because: 'There is no hour [30]' }
);

TestGiven(
  { ScheduleTag: "Start: 6 30 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'INVALID', Because: 'There is no hour [30]' }
);

TestGiven(
  { ScheduleTag: "???", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'INVALID', Because: 'Is simply invalid' }
);

TestGiven(
  { ScheduleTag: "247", On: 'SUNDAY_MORNING' },
  { ShouldBe: 'ON' }
);

TestGiven(
  { ScheduleTag: "on6", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'ON', Because: 'schedule tag must be case insensitive' }
);

TestGiven(
  { ScheduleTag: "OFF", On: 'MONDAY_LUNCHTIME' }, 
  { ShouldBe: 'OFF', Because: 'It should be off every day' }
);

TestGiven(
  { ScheduleTag: "ON6", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'ON', Because: 'It works every day' }
);

TestGiven(
  { ScheduleTag: "NOSCHEDULE Start: 6 30 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'SKIP', Because: '[NOSCHEDULE] takes preceding expressions' }
);

TestGiven(
  { ScheduleTag: "Start: 6 30 * * MON-SAT * Stop: 30 20 * * MON-SAT * NOSCHEDULE", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'SKIP', Because: '[NOSCHEDULE] takes preceding expressions' }
);

TestGiven(
  { ScheduleTag: "on6 Start: 6 30 * * MON-SAT * Stop: 30 20 * * MON-SAT *", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'INVALID', Because: 'it is a mixture of different expressions' }
);

TestGiven(
  { ScheduleTag: "DEFAULT", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'DEFAULT' }
);

TestGiven(
  { ScheduleTag: "  dEfAuLt  ", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: 'DEFAULT', Because: 'it matches the string case and white speces insensitive' }
);

TestGiven(
  { ScheduleTag: "", On: 'SUNDAY_MORNING' }, 
  { ShouldBe: null }
);

TestGiven(
  { ScheduleTag: undefined, On: 'SUNDAY_MORNING' }, 
  { ShouldBe: null }
);

TestGiven(
  { ScheduleTag: "START: 0 4 * * * STOP: 0 5 * * *", On: 'RetailPlus startup' }, 
  { ShouldBe: 'ON' }
);

TestGiven(
  { ScheduleTag: "START: 0 4 * * * STOP: 0 5 * * *", On: 'MONDAY_LUNCHTIME' }, 
  { ShouldBe: 'OFF', Because: 'it should work with 5 characters crono expressions too' }
);


/*
var tagTests = ["Start: 30 7 * * MON-FRI  * Stop: 00 20 * * MON-FRI *", 	// Weekdays 7:30-20:00
				"Start: * * * * * *", 									// 247
				"Start: * * * * * * NOSCHEDULE", 						// "SKIP" 247 noschedule 
				"Stop: * * * * * * NOSCHEDULE",							// OFF noschedule
				"Stop: 30 6 * * * *",									// default Sandbox env
				"Start: 30 6 * * MON-SAT * Stop: 30 20 * * MON-SAT *",	// default UAT env
				"Start: 30 4 * * MON-SAT * Stop: 30 18 * * MON-SAT *",	// default RetailPlus/Bangalore
        "Start: 30 6 * * MON-SAT *; Stop: 30 20 * * MON-SAT *",	// default UAT env
        "Start: 30 4 * * MON-SAT * ;;Stop: 30 18 * * MON-SAT *",	// default RetailPlus/Bangalore				"247",
				"ON6",
				"OFF",
				"DEFAULT",		  //default
				"DefAulT",		  //default
				"  deFault  ",
				"wednesday: ON",  //invalid
				"word:", 		  //invalid
				"no schedule",	  //invalid
				"", 			  //null
				null]			  //null
console.log("Testing Schedules");
var Schedule;
while (tagTests.length > 0){
	Schedule = tagTests.pop()
	console.log(ScheduleInterpreter(Schedule), ":: from -> ", Schedule);
}

*/