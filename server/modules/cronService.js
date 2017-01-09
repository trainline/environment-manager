/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */
/**
 * TODO: This file needs a lot of attention (or wholesale replacement)
 * Until then it't not worth trying to make it play nice with eslint
 */
'use strict';

﻿function buildCronService() {
  let monthname = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  let dayname = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  let decode = function decode(expr) {
    if (!expr) {
      return;
    }
    expr = expr.trim();

    let numfields = expr.match(/ /g).length + 1;
    let cronfields = expr.split(' ');
    let output = [];
    let a;
    let p;
    let q;
    let t;
    let symbol;

    for (let i = 0; i < numfields; i++) {
      let token = cronfields[i];
      if (token.match(',')) {
        let list = [];
        let parts = token.split(',');
        let part = '';
        while (part = parts.pop()) {
          if (part.split('-').length === 2) { // simple range
            p = part.split('-');
            list.push(range(decodeAtom(p[0]), decodeAtom(p[1])));
          } else if (part.split('/').length === 2) { // rate
            q = part.split('/');
            list.push(rate(q[1], i));
          } else {
            list.push(decodeAtom(part));
          }
        }
        symbol = arrayToCommaString(list);
      }
      else if (token.split('-').length === 2) { // simple range
        a = [];
        t = token.split('-');
        symbol = range(decodeAtom(t[0]), decodeAtom(t[1]));
      } else if (token.split('/').length === 2) { // rate
        q = token.split('/');
        symbol = rate(q[1], i);
      }
      else {
        symbol = decodeAtom(token);
      }
      output.push(symbol);
    }
    return output;
  };

  let rate = function rate(number, cronField) {
    let max = 0;
    switch (cronField) {
      case 0:// minute field
        max = 59;
        break;
      case 1:// hour field
        max = 23;
        break;
      case 2:// day field
        max = 31;
        break;
      case 3:// month field
        max = 12;
        break;
      case 4:// day of week
        max = 7;
        break;
      case 5:
        max = new Date().getFullYear();
        break;
    }
    let result = '';
    number = parseInt(number);
    for (let i = 0; i <= (max); i += number) {
      result = `${result}${i},`;
    }
    return result.slice(0, -1); // remove trailing comma
  };

  let decodeAtom = function decodeAtom(atom) {
    let symbol = '';
    if (atom) {
      symbol = atom;
    } else {
      return null;
    }

    let output;

    if (symbol.match(/^[0-9]+$/)) {
      output = symbol;
    }
    else if (symbol.match(/\*/)) {
      output = symbol;
    }
    else if (symbol.toUpperCase().match(/JAN|FEB|MAR|APR|MAY|JUN|JULY|AUG|SEP|OCT|NOV|DEC/)) {
      output = `${monthname.indexOf(symbol.toUpperCase()) + 1}`;
    }
    else if (symbol.toUpperCase().match(/MON|TUE|WED|THU|FRI|SAT|SUN/)) {
      output = `${dayname.indexOf(symbol.toUpperCase()) + 1}`;
    }
    return output;
  };

  let range = function range(start, end) {
    let val = start;
    let result = '';
    while (end > val) {
      result += `${val},`;
      val++;
    }
    result += val;
    return result;
  };

  function arrayToCommaString(array) {
    let string = '';
    let p;
    while (p = array.pop()) {
      if (array.length > 0) {
        string += `${p},`;
      }
      else {
        string += p;
      }
    }
    return string;
  }

  function checkDate(array, now) {
    let nowdate = [];
    nowdate[0] = (now.getMinutes());
    nowdate[1] = (now.getHours());
    nowdate[2] = (now.getDate());
    nowdate[3] = (now.getMonth() + 1);
    nowdate[4] = (now.getDay());
    nowdate[5] = (now.getFullYear());
    let d = new Date(now);
    let matchCount = 0;

    let decrement = 60000;

    let list = 0; // eslint-disable-line no-unused-vars
    let wildcard = 0; // eslint-disable-line no-unused-vars
    let literal = 0; // eslint-disable-line no-unused-vars
    let ratect = 0; // eslint-disable-line no-unused-vars

    for (let i = array.length - 1; i > -1; i--) {
      // list of numbers
      if (array[i].match(',')) {
        let largestItem = 0;
        let matched = false;
        let values = array[i].split(',');
        let item;
        while (item = values.pop()) {
          if (nowdate[i] == item) {
            matchCount++;
            matched = true;
            list++;
          }
          // keep the largest number
          largestItem = Math.max(item, largestItem);
        }
        if (matched == false) {
          decrement = Math.max(calculateDecrement(i, largestItem, d), decrement);
        }
        continue;
      }

      // wildcard
      if (array[i] == '*') {
        matchCount++;
        wildcard++;
        continue;
      }

      // rate
      if (array[i].match('/\*\\/')) {
        rate = array[i].split('\/')[1];
        if (nowdate[i] % rate == 0) {
          matchCount++;
          ratect++;
          continue;
        }
        else {
          decrement = Math.max(calculateDecrement(i, rate, d), decrement);
        }
      }

      // literal number
      if (array[i] == nowdate[i]) {
        matchCount++;
        literal++;
      }
      else {
        // console.log("unmatched number");
        decrement = Math.max(calculateDecrement(i, array[i], d), decrement);
      }
    }
    return (matchCount == array.length) ? 0 : decrement;
  }

  function calculateDecrement(cronField, largestItem, d) {
    function rollbackHour(date, number) {
      if (!number) {
        number = 1;
      }
      let hourms = (number - 1) * 3600000;
      let minutems = (date.getMinutes() + 1) * 60000;
      return new Date(date - (hourms + minutems));
    }

    function rollbackDay(date, number) {
      if (!number) {
        number = 1;
      }
      let dayms = (number - 1) * 86400000;
      let hourms = (date.getHours()) * 3600000;
      let minutems = (date.getMinutes() + 1) * 60000;
      return new Date(date - (hourms + minutems + dayms));
    }

    function rollbackMonth(date) {
      return new Date(Date.parse(`01 ${monthname[date.getMonth()]} ${date.getFullYear()} 00:00:00 GMT`) - 1000);
    }

    function rollbackToYear(number) {
      return new Date(Date.parse(`31 Dec ${number} 23:59:59 GMT`));
    }

    // find the smallest change that will reduce the field to the value you need.

    let decrement;

    switch (cronField) {

      case 0:// minute field
        if (d.getMinutes() > largestItem) {
          decrement = (d.getMinutes() - largestItem) * 60000;
        }
        if (d.getMinutes() < largestItem) {
          decrement = (60 + d.getMinutes() - largestItem) * 60000;
        }
        break;
      case 1:// hour field
        if (d.getHours() > largestItem) {
          decrement = d - rollbackHour(d, (d.getHours() - largestItem));
        }
        if (d.getHours() < largestItem) {
          decrement = d - rollbackHour(d, (24 + d.getHours() - largestItem));
        }
        break;
      case 2:// day field
        if (d.getDate() > largestItem) {
          decrement = d - rollbackDay(d, (d.getDate() - largestItem));
        }
        if (d.getDate() < largestItem) {
          decrement = d - rollbackMonth(d);
        }
        break;
      case 3:// month field
        decrement = d - rollbackMonth(d);
        break;
      case 4:// day of week
        decrement = d - rollbackDay(d);
        break;
      case 5:// year
        decrement = d - rollbackToYear(d.getFullYear());
        break;
    }
    return decrement;
  }

  function ScheduleInterpreter(ScheduleTagString, datetime) {
    if (!datetime) {
      let now = new Date();
      let now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      datetime = now_utc;
    }
    if (!ScheduleTagString) return null;

    function ScheduleInterpreter(ScheduleTagString, datetime) {
      if (!datetime) {
        var now = new Date();
        var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        datetime = now_utc;
      }
      if (!ScheduleTagString) return null;

      var Schedule = ScheduleTagString.toUpperCase().trim().replace(';', '');

      if (Schedule.match(/^ON6$/)) Schedule = 'START: 30 6 * * * * STOP: 30 18 * * * *';
      if (Schedule.match(/^247$/)) Schedule = 'START: * * * * * *';
      if (Schedule.match(/^OFF$/)) Schedule = 'STOP: * * * * * *';
      if (Schedule.match('NOSCHEDULE')) return 'SKIP';
      if (Schedule.match('DEFAULT')) return 'DEFAULT';
      if (Schedule.match(/^$/)) return null;
      if (!Schedule.match(/START\:|STOP\:/)) {
        return 'INVALID';
      }

      // Split into array of Start and Stop cronstrings;
      let ScheduleParts = Schedule.match(/(\w*\: [\d\,\-\*\\]+ [\d\,\-\*\\]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+\s?[\d\,\-\*]*)/g);
      if (!ScheduleParts) {
        console.log(`Invalid schedule value: ${Schedule}`);
        return 'INVALID';
      }

      let cronString;
      let mostRecentDate = new Date(2000, 1, 1); // don't look back before y2k
      let response;
      let cronArray;
      let actionString;
      let action;
      while (actionString = ScheduleParts.pop()) {
        if (actionString.match('START')) action = 'ON';
        if (actionString.match('STOP')) action = 'OFF';
        cronArray = decode(actionString.split(':')[1]);
        if (cronArray.length < 5) {
          console.log('cron string too short');
          return 'INVALID';
        }
        while (cronArray.length > 6) cronArray.shift();

        let d = new Date(datetime);
        // 1073 = worst case 1 year of tries
        let giveup = 1073;
        let giveupcount = 0;
        let decrement = 60000;

        while (giveupcount < giveup) {
          decrement = checkDate(cronArray, d);
          if (decrement == 0) break;
          giveupcount++;
          d = new Date(d - decrement);
        }

        if ((giveupcount == giveup)) {
          return 'INVALID';
        } // no date match within the time period
        else if (d > mostRecentDate) {
          response = action;
          mostRecentDate = d;
        }
      }
      return response;
    }

    function SizeScheduleInterpreter(scheduledActions, datetime) {
      if (!datetime) {
        let now = new Date();
        let now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        datetime = now_utc;
      }
      if (!scheduledActions) return null;

      let mostRecentDate = new Date(2000, 1, 1); // don't look back before y2k
      let response;
      let cronArray;
      let scheduledAction;

      while (scheduledAction = scheduledActions.pop()) {
        let min = scheduledAction.MinSize;
        let desired = scheduledAction.DesiredCapacity;
        let max = scheduledAction.MaxSize;

        cronArray = decode(scheduledAction.Recurrence);
        if (cronArray.length < 5) {
          console.log('cron string too short');
          return 'INVALID';
        }
        while (cronArray.length > 6) cronArray.shift();

        let d = new Date(datetime);
        // 1073 = worst case 1 year of tries
        let giveup = 1073;
        let giveupcount = 0;
        let decrement = 60000;

        while (giveupcount < giveup) {
          decrement = checkDate(cronArray, d);
          if (decrement == 0) break;
          giveupcount++;
          d = new Date(d - decrement);
        }

        if ((giveupcount == giveup)) {
          return 'INVALID';
        } // no date match within the time period
        else if (d > mostRecentDate) {
          response = {
            min,
            max,
            desired,
          };
          mostRecentDate = d;
        }
      }
      return response;
    }

    return {
      getActionBySchedule: ScheduleInterpreter,
      getSizeBySchedule: SizeScheduleInterpreter,
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = buildCronService;
}
