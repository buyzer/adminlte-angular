/*
Input Mask plugin extensions
http://github.com/RobinHerbots/jquery.inputmask
Copyright (c) 2010 - 2014 Robin Herbots
Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
Version: 0.0.0

Optional extensions on the jquery.inputmask base
*/
(function ($) {
    //date & time aliases
    $.extend($.inputmask.defaults.definitions, {
        'h': { //hours
            validator: "[01][0-9]|2[0-3]",
            cardinality: 2,
            prevalidator: [{ validator: "[0-2]", cardinality: 1 }]
        },
        's': { //seconds || minutes
            validator: "[0-5][0-9]",
            cardinality: 2,
            prevalidator: [{ validator: "[0-5]", cardinality: 1 }]
        },
        'd': { //basic day
            validator: "0[1-9]|[12][0-9]|3[01]",
            cardinality: 2,
            prevalidator: [{ validator: "[0-3]", cardinality: 1 }]
        },
        'm': { //basic month
            validator: "0[1-9]|1[012]",
            cardinality: 2,
            prevalidator: [{ validator: "[01]", cardinality: 1 }]
        },
        'y': { //basic year
            validator: "(19|20)\\d{2}",
            cardinality: 4,
            prevalidator: [
                        { validator: "[12]", cardinality: 1 },
                        { validator: "(19|20)", cardinality: 2 },
                        { validator: "(19|20)\\d", cardinality: 3 }
            ]
        }
    });
    $.extend($.inputmask.defaults.aliases, {
        'dd/mm/yyyy': {
            mask: "1/2/y",
            placeholder: "dd/mm/yyyy",
            regex: {
                val1pre: new RegExp("[0-3]"), //daypre
                val1: new RegExp("0[1-9]|[12][0-9]|3[01]"), //day
                val2pre: function (separator) { var escapedSeparator = $.inputmask.escapeRegex.call(this, separator); return new RegExp("((0[1-9]|[12][0-9]|3[01])" + escapedSeparator + "[01])"); }, //monthpre
                val2: function (separator) { var escapedSeparator = $.inputmask.escapeRegex.call(this, separator); return new RegExp("((0[1-9]|[12][0-9])" + escapedSeparator + "(0[1-9]|1[012]))|(30" + escapedSeparator + "(0[13-9]|1[012]))|(31" + escapedSeparator + "(0[13578]|1[02]))"); }//month
            },
            leapday: "29/02/",
            separator: '/',
            yearrange: { minyear: 1900, maxyear: 2099 },
            isInYearRange: function (chrs, minyear, maxyear) {
                var enteredyear = parseInt(chrs.concat(minyear.toString().slice(chrs.length)));
                var enteredyear2 = parseInt(chrs.concat(maxyear.toString().slice(chrs.length)));
                return (enteredyear != NaN ? minyear <= enteredyear && enteredyear <= maxyear : false) ||
            		   (enteredyear2 != NaN ? minyear <= enteredyear2 && enteredyear2 <= maxyear : false);
            },
            determinebaseyear: function (minyear, maxyear, hint) {
                var currentyear = (new Date()).getFullYear();
                if (minyear > currentyear) return minyear;
                if (maxyear < currentyear) {
                    var maxYearPrefix = maxyear.toString().slice(0, 2);
                    var maxYearPostfix = maxyear.toString().slice(2, 4);
                    while (maxyear < maxYearPrefix + hint) {
                        maxYearPrefix--;
                    }
                    var maxxYear = maxYearPrefix + maxYearPostfix;
                    return minyear > maxxYear ? minyear : maxxYear;
                }

                return currentyear;
            },
            onKeyUp: function (e, buffer, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode == opts.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val(today.getDate().toString() + (today.getMonth() + 1).toString() + today.getFullYear().toString());
                }
            },
            definitions: {
                '1': { //val1 ~ day or month
                    validator: function (chrs, buffer, pos, strict, opts) {
                        var isValid = opts.regex.val1.test(chrs);
                        if (!strict && !isValid) {
                            if (chrs.charAt(1) == opts.separator || "-./".indexOf(chrs.charAt(1)) != -1) {
                                isValid = opts.regex.val1.test("0" + chrs.charAt(0));
                                if (isValid) {
                                    buffer[pos - 1] = "0";
                                    return { "pos": pos, "c": chrs.charAt(0) };
                                }
                            }
                        }
                        return isValid;
                    },
                    cardinality: 2,
                    prevalidator: [{
                        validator: function (chrs, buffer, pos, strict, opts) {
                            var isValid = opts.regex.val1pre.test(chrs);
                            if (!strict && !isValid) {
                                isValid = opts.regex.val1.test("0" + chrs);
                                if (isValid) {
                                    buffer[pos] = "0";
                                    pos++;
                                    return { "pos": pos };
                                }
                            }
                            return isValid;
                        }, cardinality: 1
                    }]
                },
                '2': { //val2 ~ day or month
                    validator: function (chrs, buffer, pos, strict, opts) {
                        var frontValue = buffer.join('').substr(0, 3);
                        if (frontValue.indexOf(opts.placeholder[0]) != -1) frontValue = "01" + opts.separator;
                        var isValid = opts.regex.val2(opts.separator).test(frontValue + chrs);
                        if (!strict && !isValid) {
                            if (chrs.charAt(1) == opts.separator || "-./".indexOf(chrs.charAt(1)) != -1) {
                                isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs.charAt(0));
                                if (isValid) {
                                    buffer[pos - 1] = "0";
                                    return { "pos": pos, "c": chrs.charAt(0) };
                                }
                            }
                        }
                        return isValid;
                    },
                    cardinality: 2,
                    prevalidator: [{
                        validator: function (chrs, buffer, pos, strict, opts) {
                            var frontValue = buffer.join('').substr(0, 3);
                            if (frontValue.indexOf(opts.placeholder[0]) != -1) frontValue = "01" + opts.separator;
                            var isValid = opts.regex.val2pre(opts.separator).test(frontValue + chrs);
                            if (!strict && !isValid) {
                                isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs);
                                if (isValid) {
                                    buffer[pos] = "0";
                                    pos++;
                                    return { "pos": pos };
                                }
                            }
                            return isValid;
                        }, cardinality: 1
                    }]
                },
                'y': { //year
                    validator: function (chrs, buffer, pos, strict, opts) {
                        if (opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) {
                            var dayMonthValue = buffer.join('').substr(0, 6);
                            if (dayMonthValue != opts.leapday)
                                return true;
                            else {
                                var year = parseInt(chrs, 10);//detect leap year
                                if (year % 4 === 0)
                                    if (year % 100 === 0)
                                        if (year % 400 === 0)
                                            return true;
                                        else return false;
                                    else return true;
                                else return false;
                            }
                        } else return false;
                    },
                    cardinality: 4,
                    prevalidator: [
                {
                    validator: function (chrs, buffer, pos, strict, opts) {
                        var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                        if (!strict && !isValid) {
                            var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 1);

                            isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                            if (isValid) {
                                buffer[pos++] = yearPrefix[0];
                                return { "pos": pos };
                            }
                            yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 2);

                            isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                            if (isValid) {
                                buffer[pos++] = yearPrefix[0];
                                buffer[pos++] = yearPrefix[1];
                                return { "pos": pos };
                            }
                        }
                        return isValid;
                    },
                    cardinality: 1
                },
                {
                    validator: function (chrs, buffer, pos, strict, opts) {
                        var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                        if (!strict && !isValid) {
                            var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2);

                            isValid = opts.isInYearRange(chrs[0] + yearPrefix[1] + chrs[1], opts.yearrange.minyear, opts.yearrange.maxyear);
                            if (isValid) {
                                buffer[pos++] = yearPrefix[1];
                                return { "pos": pos };
                            }

                            yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2);
                            if (opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) {
                                var dayMonthValue = buffer.join('').substr(0, 6);
                                if (dayMonthValue != opts.leapday)
                                    isValid = true;
                                else {
                                    var year = parseInt(chrs, 10);//detect leap year
                                    if (year % 4 === 0)
                                        if (year % 100 === 0)
                                            if (year % 400 === 0)
                                                isValid = true;
                                            else isValid = false;
                                        else isValid = true;
                                    else isValid = false;
                                }
                            } else isValid = false;
                            if (isValid) {
                                buffer[pos - 1] = yearPrefix[0];
                                buffer[pos++] = yearPrefix[1];
                                buffer[pos++] = chrs[0];
                                return { "pos": pos };
                            }
                        }
                        return isValid;
                    }, cardinality: 2
                },
                {
                    validator: function (chrs, buffer, pos, strict, opts) {
                        return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);
                    }, cardinality: 3
                }
                    ]
                }
            },
            insertMode: false,
            autoUnmask: false
        },
        'mm/dd/yyyy': {
            placeholder: "mm/dd/yyyy",
            alias: "dd/mm/yyyy", //reuse functionality of dd/mm/yyyy alias
            regex: {
                val2pre: function (separator) { var escapedSeparator = $.inputmask.escapeRegex.call(this, separator); return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])"); }, //daypre
                val2: function (separator) { var escapedSeparator = $.inputmask.escapeRegex.call(this, separator); return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)"); }, //day
                val1pre: new RegExp("[01]"), //monthpre
                val1: new RegExp("0[1-9]|1[012]") //month
            },
            leapday: "02/29/",
            onKeyUp: function (e, buffer, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode == opts.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString());
                }
            }
        },
        'yyyy/mm/dd': {
            mask: "y/1/2",
            placeholder: "yyyy/mm/dd",
            alias: "mm/dd/yyyy",
            leapday: "/02/29",
            onKeyUp: function (e, buffer, opts) {
                var $input = $(this);
                if (e.ctrlKey && e.keyCode == opts.keyCode.RIGHT) {
                    var today = new Date();
                    $input.val(today.getFullYear().toString() + (today.getMonth() + 1).toString() + today.getDate().toString());
                }
            },
            definitions: {
                '2': { //val2 ~ day or month
                    validator: function (chrs, buffer, pos, strict, opts) {
                        var frontValue = buffer.join('').substr(5, 3);
                        if (frontValue.indexOf(opts.placeholder[5]) != -1) frontValue = "01" + opts.separator;
                        var isValid = opts.regex.val2(opts.separator).test(frontValue + chrs);
                        if (!strict && !isValid) {
                            if (chrs.charAt(1) == opts.separator || "-./".indexOf(chrs.charAt(1)) != -1) {
                                isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs.charAt(0));
                                if (isValid) {
                                    buffer[pos - 1] = "0";
                                    return { "pos": pos, "c": chrs.charAt(0) };
                                }
                            }
                        }

                        //check leap yeap
                        if (isValid) {
                            var dayMonthValue = buffer.join('').substr(4, 4) + chrs;
                            if (dayMonthValue != opts.leapday)
                                return true;
                            else {
                                var year = parseInt(buffer.join('').substr(0, 4), 10);  //detect leap year
                                if (year % 4 === 0)
                                    if (year % 100 === 0)
                                        if (year % 400 === 0)
                                            return true;
                                        else return false;
                                    else return true;
                                else return false;
                            }
                        }

                        return isValid;
                    },
                    cardinality: 2,
                    prevalidator: [{
                        validator: function (chrs, buffer, pos, strict, opts) {
                            var frontValue = buffer.join('').substr(5, 3);
                            if (frontValue.indexOf(opts.placeholder[5]) != -1) frontValue = "01" + opts.separator;
                            var isValid = opts.regex.val2pre(opts.separator).test(frontValue + chrs);
                            if (!strict && !isValid) {
                                isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs);
                                if (isValid) {
                                    buffer[pos] = "0";
                                    pos++;
                                    return { "pos": pos };
                                }
                            }
                            return isValid;
                        }, cardinality: 1
                    }]
                }
            }
        },
        'dd.mm.yyyy': {
            mask: "1.2.y",
            placeholder: "dd.mm.yyyy",
            leapday: "29.02.",
            separator: '.',
            alias: "dd/mm/yyyy"
        },
        'dd-mm-yyyy': {
            mask: "1-2-y",
            placeholder: "dd-mm-yyyy",
            leapday: "29-02-",
            separator: '-',
            alias: "dd/mm/yyyy"
        },
        'mm.dd.yyyy': {
            mask: "1.2.y",
            placeholder: "mm.dd.yyyy",
            leapday: "02.29.",
            separator: '.',
            alias: "mm/dd/yyyy"
        },
        'mm-dd-yyyy': {
            mask: "1-2-y",
            placeholder: "mm-dd-yyyy",
            leapday: "02-29-",
            separator: '-',
            alias: "mm/dd/yyyy"
        },
        'yyyy.mm.dd': {
            mask: "y.1.2",
            placeholder: "yyyy.mm.dd",
            leapday: ".02.29",
            separator: '.',
            alias: "yyyy/mm/dd"
        },
        'yyyy-mm-dd': {
            mask: "y-1-2",
            placeholder: "yyyy-mm-dd",
            leapday: "-02-29",
            separator: '-',
            alias: "yyyy/mm/dd"
        },
        'datetime': {
            mask: "1/2/y h:s",
            placeholder: "dd/mm/yyyy hh:mm",
            alias: "dd/mm/yyyy",
            regex: {
                hrspre: new RegExp("[012]"), //hours pre
                hrs24: new RegExp("2[0-9]|1[3-9]"),
                hrs: new RegExp("[01][0-9]|2[0-3]"), //hours
                ampm: new RegExp("^[a|p|A|P][m|M]")
            },
            timeseparator: ':',
            hourFormat: "24", // or 12
            definitions: {
                'h': { //hours
                    validator: function (chrs, buffer, pos, strict, opts) {
                        var isValid = opts.regex.hrs.test(chrs);
                        if (!strict && !isValid) {
                            if (chrs.charAt(1) == opts.timeseparator || "-.:".indexOf(chrs.charAt(1)) != -1) {
                                isValid = opts.regex.hrs.test("0" + chrs.charAt(0));
                                if (isValid) {
                                    buffer[pos - 1] = "0";
                                    buffer[pos] = chrs.charAt(0);
                                    pos++;
                                    return { "pos": pos };
                                }
                            }
                        }

                        if (isValid && opts.hourFormat !== "24" && opts.regex.hrs24.test(chrs)) {

                            var tmp = parseInt(chrs, 10);

                            if (tmp == 24) {
                                buffer[pos + 5] = "a";
                                buffer[pos + 6] = "m";
                            } else {
                                buffer[pos + 5] = "p";
                                buffer[pos + 6] = "m";
                            }

                            tmp = tmp - 12;

                            if (tmp < 10) {
                                buffer[pos] = tmp.toString();
                                buffer[pos - 1] = "0";
                            } else {
                                buffer[pos] = tmp.toString().charAt(1);
                                buffer[pos - 1] = tmp.toString().charAt(0);
                            }

                            return { "pos": pos, "c": buffer[pos] };
                        }

                        return isValid;
                    },
                    cardinality: 2,
                    prevalidator: [{
                        validator: function (chrs, buffer, pos, strict, opts) {
                            var isValid = opts.regex.hrspre.test(chrs);
                            if (!strict && !isValid) {
                                isValid = opts.regex.hrs.test("0" + chrs);
                                if (isValid) {
                                    buffer[pos] = "0";
                                    pos++;
                                    return { "pos": pos };
                                }
                            }
                            return isValid;
                        }, cardinality: 1
                    }]
                },
                't': { //am/pm
                    validator: function (chrs, buffer, pos, strict, opts) {
                        return opts.regex.ampm.test(chrs + "m");
                    },
                    casing: "lower",
                    cardinality: 1
                }
            },
            insertMode: false,
            autoUnmask: false
        },
        'datetime12': {
            mask: "1/2/y h:s t\\m",
            placeholder: "dd/mm/yyyy hh:mm xm",
            alias: "datetime",
            hourFormat: "12"
        },
        'hh:mm t': {
            mask: "h:s t\\m",
            placeholder: "hh:mm xm",
            alias: "datetime",
            hourFormat: "12"
        },
        'h:s t': {
            mask: "h:s t\\m",
            placeholder: "hh:mm xm",
            alias: "datetime",
            hourFormat: "12"
        },
        'hh:mm:ss': {
            mask: "h:s:s",
            autoUnmask: false
        },
        'hh:mm': {
            mask: "h:s",
            autoUnmask: false
        },
        'date': {
            alias: "dd/mm/yyyy" // "mm/dd/yyyy"
        },
        'mm/yyyy': {
            mask: "1/y",
            placeholder: "mm/yyyy",
            leapday: "donotuse",
            separator: '/',
            alias: "mm/dd/yyyy"
        }
    });
})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5pbnB1dG1hc2suZGF0ZS5leHRlbnNpb25zLmpzIl0sIm5hbWVzIjpbIiQiLCJleHRlbmQiLCJpbnB1dG1hc2siLCJkZWZhdWx0cyIsImRlZmluaXRpb25zIiwiaCIsInZhbGlkYXRvciIsImNhcmRpbmFsaXR5IiwicHJldmFsaWRhdG9yIiwicyIsImQiLCJtIiwieSIsImFsaWFzZXMiLCJkZC9tbS95eXl5IiwibWFzayIsInBsYWNlaG9sZGVyIiwicmVnZXgiLCJ2YWwxcHJlIiwiUmVnRXhwIiwidmFsMSIsInZhbDJwcmUiLCJzZXBhcmF0b3IiLCJlc2NhcGVkU2VwYXJhdG9yIiwiZXNjYXBlUmVnZXgiLCJjYWxsIiwidGhpcyIsInZhbDIiLCJsZWFwZGF5IiwieWVhcnJhbmdlIiwibWlueWVhciIsIm1heHllYXIiLCJpc0luWWVhclJhbmdlIiwiY2hycyIsImVudGVyZWR5ZWFyIiwicGFyc2VJbnQiLCJjb25jYXQiLCJ0b1N0cmluZyIsInNsaWNlIiwibGVuZ3RoIiwiZW50ZXJlZHllYXIyIiwiTmFOIiwiZGV0ZXJtaW5lYmFzZXllYXIiLCJoaW50IiwiY3VycmVudHllYXIiLCJEYXRlIiwiZ2V0RnVsbFllYXIiLCJtYXhZZWFyUHJlZml4IiwibWF4WWVhclBvc3RmaXgiLCJtYXh4WWVhciIsIm9uS2V5VXAiLCJlIiwiYnVmZmVyIiwib3B0cyIsIiRpbnB1dCIsImN0cmxLZXkiLCJrZXlDb2RlIiwiUklHSFQiLCJ0b2RheSIsInZhbCIsImdldERhdGUiLCJnZXRNb250aCIsIjEiLCJwb3MiLCJzdHJpY3QiLCJpc1ZhbGlkIiwidGVzdCIsImNoYXJBdCIsImluZGV4T2YiLCJjIiwiMiIsImZyb250VmFsdWUiLCJqb2luIiwic3Vic3RyIiwiZGF5TW9udGhWYWx1ZSIsInllYXIiLCJ5ZWFyUHJlZml4IiwiaW5zZXJ0TW9kZSIsImF1dG9Vbm1hc2siLCJtbS9kZC95eXl5IiwiYWxpYXMiLCJ5eXl5L21tL2RkIiwiZGQubW0ueXl5eSIsImRkLW1tLXl5eXkiLCJtbS5kZC55eXl5IiwibW0tZGQteXl5eSIsInl5eXkubW0uZGQiLCJ5eXl5LW1tLWRkIiwiZGF0ZXRpbWUiLCJocnNwcmUiLCJocnMyNCIsImhycyIsImFtcG0iLCJ0aW1lc2VwYXJhdG9yIiwiaG91ckZvcm1hdCIsInRtcCIsInQiLCJjYXNpbmciLCJkYXRldGltZTEyIiwiaGg6bW0gdCIsImg6cyB0IiwiaGg6bW06c3MiLCJoaDptbSIsImRhdGUiLCJtbS95eXl5IiwialF1ZXJ5Il0sIm1hcHBpbmdzIjoiQ0FTQSxTQUFXQSxHQUVQQSxFQUFFQyxPQUFPRCxFQUFFRSxVQUFVQyxTQUFTQyxhQUMxQkMsR0FDSUMsVUFBVyxtQkFDWEMsWUFBYSxFQUNiQyxlQUFpQkYsVUFBVyxRQUFTQyxZQUFhLEtBRXRERSxHQUNJSCxVQUFXLGFBQ1hDLFlBQWEsRUFDYkMsZUFBaUJGLFVBQVcsUUFBU0MsWUFBYSxLQUV0REcsR0FDSUosVUFBVyx5QkFDWEMsWUFBYSxFQUNiQyxlQUFpQkYsVUFBVyxRQUFTQyxZQUFhLEtBRXRESSxHQUNJTCxVQUFXLGdCQUNYQyxZQUFhLEVBQ2JDLGVBQWlCRixVQUFXLE9BQVFDLFlBQWEsS0FFckRLLEdBQ0lOLFVBQVcsZ0JBQ1hDLFlBQWEsRUFDYkMsZUFDY0YsVUFBVyxPQUFRQyxZQUFhLElBQ2hDRCxVQUFXLFVBQVdDLFlBQWEsSUFDbkNELFVBQVcsYUFBY0MsWUFBYSxPQUk1RFAsRUFBRUMsT0FBT0QsRUFBRUUsVUFBVUMsU0FBU1UsU0FDMUJDLGNBQ0lDLEtBQU0sUUFDTkMsWUFBYSxhQUNiQyxPQUNJQyxRQUFTLEdBQUlDLFFBQU8sU0FDcEJDLEtBQU0sR0FBSUQsUUFBTywwQkFDakJFLFFBQVMsU0FBVUMsR0FBYSxHQUFJQyxHQUFtQnZCLEVBQUVFLFVBQVVzQixZQUFZQyxLQUFLQyxLQUFNSixFQUFZLE9BQU8sSUFBSUgsUUFBTyw0QkFBOEJJLEVBQW1CLFVBQ3pLSSxLQUFNLFNBQVVMLEdBQWEsR0FBSUMsR0FBbUJ2QixFQUFFRSxVQUFVc0IsWUFBWUMs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YXRlLmV4dGVuc2lvbnMtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuSW5wdXQgTWFzayBwbHVnaW4gZXh0ZW5zaW9uc1xuaHR0cDovL2dpdGh1Yi5jb20vUm9iaW5IZXJib3RzL2pxdWVyeS5pbnB1dG1hc2tcbkNvcHlyaWdodCAoYykgMjAxMCAtIDIwMTQgUm9iaW4gSGVyYm90c1xuTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIChodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocClcblZlcnNpb246IDAuMC4wXG5cbk9wdGlvbmFsIGV4dGVuc2lvbnMgb24gdGhlIGpxdWVyeS5pbnB1dG1hc2sgYmFzZVxuKi9cbihmdW5jdGlvbiAoJCkge1xuICAgIC8vZGF0ZSAmIHRpbWUgYWxpYXNlc1xuICAgICQuZXh0ZW5kKCQuaW5wdXRtYXNrLmRlZmF1bHRzLmRlZmluaXRpb25zLCB7XG4gICAgICAgICdoJzogeyAvL2hvdXJzXG4gICAgICAgICAgICB2YWxpZGF0b3I6IFwiWzAxXVswLTldfDJbMC0zXVwiLFxuICAgICAgICAgICAgY2FyZGluYWxpdHk6IDIsXG4gICAgICAgICAgICBwcmV2YWxpZGF0b3I6IFt7IHZhbGlkYXRvcjogXCJbMC0yXVwiLCBjYXJkaW5hbGl0eTogMSB9XVxuICAgICAgICB9LFxuICAgICAgICAncyc6IHsgLy9zZWNvbmRzIHx8IG1pbnV0ZXNcbiAgICAgICAgICAgIHZhbGlkYXRvcjogXCJbMC01XVswLTldXCIsXG4gICAgICAgICAgICBjYXJkaW5hbGl0eTogMixcbiAgICAgICAgICAgIHByZXZhbGlkYXRvcjogW3sgdmFsaWRhdG9yOiBcIlswLTVdXCIsIGNhcmRpbmFsaXR5OiAxIH1dXG4gICAgICAgIH0sXG4gICAgICAgICdkJzogeyAvL2Jhc2ljIGRheVxuICAgICAgICAgICAgdmFsaWRhdG9yOiBcIjBbMS05XXxbMTJdWzAtOV18M1swMV1cIixcbiAgICAgICAgICAgIGNhcmRpbmFsaXR5OiAyLFxuICAgICAgICAgICAgcHJldmFsaWRhdG9yOiBbeyB2YWxpZGF0b3I6IFwiWzAtM11cIiwgY2FyZGluYWxpdHk6IDEgfV1cbiAgICAgICAgfSxcbiAgICAgICAgJ20nOiB7IC8vYmFzaWMgbW9udGhcbiAgICAgICAgICAgIHZhbGlkYXRvcjogXCIwWzEtOV18MVswMTJdXCIsXG4gICAgICAgICAgICBjYXJkaW5hbGl0eTogMixcbiAgICAgICAgICAgIHByZXZhbGlkYXRvcjogW3sgdmFsaWRhdG9yOiBcIlswMV1cIiwgY2FyZGluYWxpdHk6IDEgfV1cbiAgICAgICAgfSxcbiAgICAgICAgJ3knOiB7IC8vYmFzaWMgeWVhclxuICAgICAgICAgICAgdmFsaWRhdG9yOiBcIigxOXwyMClcXFxcZHsyfVwiLFxuICAgICAgICAgICAgY2FyZGluYWxpdHk6IDQsXG4gICAgICAgICAgICBwcmV2YWxpZGF0b3I6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdmFsaWRhdG9yOiBcIlsxMl1cIiwgY2FyZGluYWxpdHk6IDEgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdmFsaWRhdG9yOiBcIigxOXwyMClcIiwgY2FyZGluYWxpdHk6IDIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdmFsaWRhdG9yOiBcIigxOXwyMClcXFxcZFwiLCBjYXJkaW5hbGl0eTogMyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkLmV4dGVuZCgkLmlucHV0bWFzay5kZWZhdWx0cy5hbGlhc2VzLCB7XG4gICAgICAgICdkZC9tbS95eXl5Jzoge1xuICAgICAgICAgICAgbWFzazogXCIxLzIveVwiLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiZGQvbW0veXl5eVwiLFxuICAgICAgICAgICAgcmVnZXg6IHtcbiAgICAgICAgICAgICAgICB2YWwxcHJlOiBuZXcgUmVnRXhwKFwiWzAtM11cIiksIC8vZGF5cHJlXG4gICAgICAgICAgICAgICAgdmFsMTogbmV3IFJlZ0V4cChcIjBbMS05XXxbMTJdWzAtOV18M1swMV1cIiksIC8vZGF5XG4gICAgICAgICAgICAgICAgdmFsMnByZTogZnVuY3Rpb24gKHNlcGFyYXRvcikgeyB2YXIgZXNjYXBlZFNlcGFyYXRvciA9ICQuaW5wdXRtYXNrLmVzY2FwZVJlZ2V4LmNhbGwodGhpcywgc2VwYXJhdG9yKTsgcmV0dXJuIG5ldyBSZWdFeHAoXCIoKDBbMS05XXxbMTJdWzAtOV18M1swMV0pXCIgKyBlc2NhcGVkU2VwYXJhdG9yICsgXCJbMDFdKVwiKTsgfSwgLy9tb250aHByZVxuICAgICAgICAgICAgICAgIHZhbDI6IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHsgdmFyIGVzY2FwZWRTZXBhcmF0b3IgPSAkLmlucHV0bWFzay5lc2NhcGVSZWdleC5jYWxsKHRoaXMsIHNlcGFyYXRvcik7IHJldHVybiBuZXcgUmVnRXhwKFwiKCgwWzEtOV18WzEyXVswLTldKVwiICsgZXNjYXBlZFNlcGFyYXRvciArIFwiKDBbMS05XXwxWzAxMl0pKXwoMzBcIiArIGVzY2FwZWRTZXBhcmF0b3IgKyBcIigwWzEzLTldfDFbMDEyXSkpfCgzMVwiICsgZXNjYXBlZFNlcGFyYXRvciArIFwiKDBbMTM1NzhdfDFbMDJdKSlcIik7IH0vL21vbnRoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVhcGRheTogXCIyOS8wMi9cIixcbiAgICAgICAgICAgIHNlcGFyYXRvcjogJy8nLFxuICAgICAgICAgICAgeWVhcnJhbmdlOiB7IG1pbnllYXI6IDE5MDAsIG1heHllYXI6IDIwOTkgfSxcbiAgICAgICAgICAgIGlzSW5ZZWFyUmFuZ2U6IGZ1bmN0aW9uIChjaHJzLCBtaW55ZWFyLCBtYXh5ZWFyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVudGVyZWR5ZWFyID0gcGFyc2VJbnQoY2hycy5jb25jYXQobWlueWVhci50b1N0cmluZygpLnNsaWNlKGNocnMubGVuZ3RoKSkpO1xuICAgICAgICAgICAgICAgIHZhciBlbnRlcmVkeWVhcjIgPSBwYXJzZUludChjaHJzLmNvbmNhdChtYXh5ZWFyLnRvU3RyaW5nKCkuc2xpY2UoY2hycy5sZW5ndGgpKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChlbnRlcmVkeWVhciAhPSBOYU4gPyBtaW55ZWFyIDw9IGVudGVyZWR5ZWFyICYmIGVudGVyZWR5ZWFyIDw9IG1heHllYXIgOiBmYWxzZSkgfHxcbiAgICAgICAgICAgIFx0XHQgICAoZW50ZXJlZHllYXIyICE9IE5hTiA/IG1pbnllYXIgPD0gZW50ZXJlZHllYXIyICYmIGVudGVyZWR5ZWFyMiA8PSBtYXh5ZWFyIDogZmFsc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldGVybWluZWJhc2V5ZWFyOiBmdW5jdGlvbiAobWlueWVhciwgbWF4eWVhciwgaGludCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50eWVhciA9IChuZXcgRGF0ZSgpKS5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgICAgICAgIGlmIChtaW55ZWFyID4gY3VycmVudHllYXIpIHJldHVybiBtaW55ZWFyO1xuICAgICAgICAgICAgICAgIGlmIChtYXh5ZWFyIDwgY3VycmVudHllYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1heFllYXJQcmVmaXggPSBtYXh5ZWFyLnRvU3RyaW5nKCkuc2xpY2UoMCwgMik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXhZZWFyUG9zdGZpeCA9IG1heHllYXIudG9TdHJpbmcoKS5zbGljZSgyLCA0KTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG1heHllYXIgPCBtYXhZZWFyUHJlZml4ICsgaGludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4WWVhclByZWZpeC0tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXh4WWVhciA9IG1heFllYXJQcmVmaXggKyBtYXhZZWFyUG9zdGZpeDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1pbnllYXIgPiBtYXh4WWVhciA/IG1pbnllYXIgOiBtYXh4WWVhcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudHllYXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25LZXlVcDogZnVuY3Rpb24gKGUsIGJ1ZmZlciwgb3B0cykge1xuICAgICAgICAgICAgICAgIHZhciAkaW5wdXQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS5rZXlDb2RlID09IG9wdHMua2V5Q29kZS5SSUdIVCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9kYXkgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAkaW5wdXQudmFsKHRvZGF5LmdldERhdGUoKS50b1N0cmluZygpICsgKHRvZGF5LmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpICsgdG9kYXkuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVmaW5pdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAnMSc6IHsgLy92YWwxIH4gZGF5IG9yIG1vbnRoXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogZnVuY3Rpb24gKGNocnMsIGJ1ZmZlciwgcG9zLCBzdHJpY3QsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gb3B0cy5yZWdleC52YWwxLnRlc3QoY2hycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmljdCAmJiAhaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaHJzLmNoYXJBdCgxKSA9PSBvcHRzLnNlcGFyYXRvciB8fCBcIi0uL1wiLmluZGV4T2YoY2hycy5jaGFyQXQoMSkpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBvcHRzLnJlZ2V4LnZhbDEudGVzdChcIjBcIiArIGNocnMuY2hhckF0KDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MgLSAxXSA9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgXCJwb3NcIjogcG9zLCBcImNcIjogY2hycy5jaGFyQXQoMCkgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc1ZhbGlkO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjYXJkaW5hbGl0eTogMixcbiAgICAgICAgICAgICAgICAgICAgcHJldmFsaWRhdG9yOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBmdW5jdGlvbiAoY2hycywgYnVmZmVyLCBwb3MsIHN0cmljdCwgb3B0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gb3B0cy5yZWdleC52YWwxcHJlLnRlc3QoY2hycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHJpY3QgJiYgIWlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IG9wdHMucmVnZXgudmFsMS50ZXN0KFwiMFwiICsgY2hycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zXSA9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNhcmRpbmFsaXR5OiAxXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnMic6IHsgLy92YWwyIH4gZGF5IG9yIG1vbnRoXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogZnVuY3Rpb24gKGNocnMsIGJ1ZmZlciwgcG9zLCBzdHJpY3QsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcm9udFZhbHVlID0gYnVmZmVyLmpvaW4oJycpLnN1YnN0cigwLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcm9udFZhbHVlLmluZGV4T2Yob3B0cy5wbGFjZWhvbGRlclswXSkgIT0gLTEpIGZyb250VmFsdWUgPSBcIjAxXCIgKyBvcHRzLnNlcGFyYXRvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gb3B0cy5yZWdleC52YWwyKG9wdHMuc2VwYXJhdG9yKS50ZXN0KGZyb250VmFsdWUgKyBjaHJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RyaWN0ICYmICFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNocnMuY2hhckF0KDEpID09IG9wdHMuc2VwYXJhdG9yIHx8IFwiLS4vXCIuaW5kZXhPZihjaHJzLmNoYXJBdCgxKSkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IG9wdHMucmVnZXgudmFsMihvcHRzLnNlcGFyYXRvcikudGVzdChmcm9udFZhbHVlICsgXCIwXCIgKyBjaHJzLmNoYXJBdCgwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zIC0gMV0gPSBcIjBcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IFwicG9zXCI6IHBvcywgXCJjXCI6IGNocnMuY2hhckF0KDApIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY2FyZGluYWxpdHk6IDIsXG4gICAgICAgICAgICAgICAgICAgIHByZXZhbGlkYXRvcjogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogZnVuY3Rpb24gKGNocnMsIGJ1ZmZlciwgcG9zLCBzdHJpY3QsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnJvbnRWYWx1ZSA9IGJ1ZmZlci5qb2luKCcnKS5zdWJzdHIoMCwgMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyb250VmFsdWUuaW5kZXhPZihvcHRzLnBsYWNlaG9sZGVyWzBdKSAhPSAtMSkgZnJvbnRWYWx1ZSA9IFwiMDFcIiArIG9wdHMuc2VwYXJhdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gb3B0cy5yZWdleC52YWwycHJlKG9wdHMuc2VwYXJhdG9yKS50ZXN0KGZyb250VmFsdWUgKyBjaHJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmljdCAmJiAhaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gb3B0cy5yZWdleC52YWwyKG9wdHMuc2VwYXJhdG9yKS50ZXN0KGZyb250VmFsdWUgKyBcIjBcIiArIGNocnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3Bvc10gPSBcIjBcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgXCJwb3NcIjogcG9zIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBjYXJkaW5hbGl0eTogMVxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ3knOiB7IC8veWVhclxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGZ1bmN0aW9uIChjaHJzLCBidWZmZXIsIHBvcywgc3RyaWN0LCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5pc0luWWVhclJhbmdlKGNocnMsIG9wdHMueWVhcnJhbmdlLm1pbnllYXIsIG9wdHMueWVhcnJhbmdlLm1heHllYXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheU1vbnRoVmFsdWUgPSBidWZmZXIuam9pbignJykuc3Vic3RyKDAsIDYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXlNb250aFZhbHVlICE9IG9wdHMubGVhcGRheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ZWFyID0gcGFyc2VJbnQoY2hycywgMTApOy8vZGV0ZWN0IGxlYXAgeWVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDQgPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDEwMCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDQwMCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjYXJkaW5hbGl0eTogNCxcbiAgICAgICAgICAgICAgICAgICAgcHJldmFsaWRhdG9yOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGZ1bmN0aW9uIChjaHJzLCBidWZmZXIsIHBvcywgc3RyaWN0LCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWxpZCA9IG9wdHMuaXNJblllYXJSYW5nZShjaHJzLCBvcHRzLnllYXJyYW5nZS5taW55ZWFyLCBvcHRzLnllYXJyYW5nZS5tYXh5ZWFyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RyaWN0ICYmICFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHllYXJQcmVmaXggPSBvcHRzLmRldGVybWluZWJhc2V5ZWFyKG9wdHMueWVhcnJhbmdlLm1pbnllYXIsIG9wdHMueWVhcnJhbmdlLm1heHllYXIsIGNocnMgKyBcIjBcIikudG9TdHJpbmcoKS5zbGljZSgwLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBvcHRzLmlzSW5ZZWFyUmFuZ2UoeWVhclByZWZpeCArIGNocnMsIG9wdHMueWVhcnJhbmdlLm1pbnllYXIsIG9wdHMueWVhcnJhbmdlLm1heHllYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MrK10gPSB5ZWFyUHJlZml4WzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeWVhclByZWZpeCA9IG9wdHMuZGV0ZXJtaW5lYmFzZXllYXIob3B0cy55ZWFycmFuZ2UubWlueWVhciwgb3B0cy55ZWFycmFuZ2UubWF4eWVhciwgY2hycyArIFwiMFwiKS50b1N0cmluZygpLnNsaWNlKDAsIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IG9wdHMuaXNJblllYXJSYW5nZSh5ZWFyUHJlZml4ICsgY2hycywgb3B0cy55ZWFycmFuZ2UubWlueWVhciwgb3B0cy55ZWFycmFuZ2UubWF4eWVhcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3BvcysrXSA9IHllYXJQcmVmaXhbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MrK10gPSB5ZWFyUHJlZml4WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY2FyZGluYWxpdHk6IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBmdW5jdGlvbiAoY2hycywgYnVmZmVyLCBwb3MsIHN0cmljdCwgb3B0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBvcHRzLmlzSW5ZZWFyUmFuZ2UoY2hycywgb3B0cy55ZWFycmFuZ2UubWlueWVhciwgb3B0cy55ZWFycmFuZ2UubWF4eWVhcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmljdCAmJiAhaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ZWFyUHJlZml4ID0gb3B0cy5kZXRlcm1pbmViYXNleWVhcihvcHRzLnllYXJyYW5nZS5taW55ZWFyLCBvcHRzLnllYXJyYW5nZS5tYXh5ZWFyLCBjaHJzKS50b1N0cmluZygpLnNsaWNlKDAsIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IG9wdHMuaXNJblllYXJSYW5nZShjaHJzWzBdICsgeWVhclByZWZpeFsxXSArIGNocnNbMV0sIG9wdHMueWVhcnJhbmdlLm1pbnllYXIsIG9wdHMueWVhcnJhbmdlLm1heHllYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MrK10gPSB5ZWFyUHJlZml4WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ZWFyUHJlZml4ID0gb3B0cy5kZXRlcm1pbmViYXNleWVhcihvcHRzLnllYXJyYW5nZS5taW55ZWFyLCBvcHRzLnllYXJyYW5nZS5tYXh5ZWFyLCBjaHJzKS50b1N0cmluZygpLnNsaWNlKDAsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmlzSW5ZZWFyUmFuZ2UoeWVhclByZWZpeCArIGNocnMsIG9wdHMueWVhcnJhbmdlLm1pbnllYXIsIG9wdHMueWVhcnJhbmdlLm1heHllYXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXlNb250aFZhbHVlID0gYnVmZmVyLmpvaW4oJycpLnN1YnN0cigwLCA2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRheU1vbnRoVmFsdWUgIT0gb3B0cy5sZWFwZGF5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHllYXIgPSBwYXJzZUludChjaHJzLCAxMCk7Ly9kZXRlY3QgbGVhcCB5ZWFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDQgPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHllYXIgJSAxMDAgPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh5ZWFyICUgNDAwID09PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3BvcyAtIDFdID0geWVhclByZWZpeFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3BvcysrXSA9IHllYXJQcmVmaXhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MrK10gPSBjaHJzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgfSwgY2FyZGluYWxpdHk6IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBmdW5jdGlvbiAoY2hycywgYnVmZmVyLCBwb3MsIHN0cmljdCwgb3B0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMuaXNJblllYXJSYW5nZShjaHJzLCBvcHRzLnllYXJyYW5nZS5taW55ZWFyLCBvcHRzLnllYXJyYW5nZS5tYXh5ZWFyKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgY2FyZGluYWxpdHk6IDNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5zZXJ0TW9kZTogZmFsc2UsXG4gICAgICAgICAgICBhdXRvVW5tYXNrOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICAnbW0vZGQveXl5eSc6IHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIm1tL2RkL3l5eXlcIixcbiAgICAgICAgICAgIGFsaWFzOiBcImRkL21tL3l5eXlcIiwgLy9yZXVzZSBmdW5jdGlvbmFsaXR5IG9mIGRkL21tL3l5eXkgYWxpYXNcbiAgICAgICAgICAgIHJlZ2V4OiB7XG4gICAgICAgICAgICAgICAgdmFsMnByZTogZnVuY3Rpb24gKHNlcGFyYXRvcikgeyB2YXIgZXNjYXBlZFNlcGFyYXRvciA9ICQuaW5wdXRtYXNrLmVzY2FwZVJlZ2V4LmNhbGwodGhpcywgc2VwYXJhdG9yKTsgcmV0dXJuIG5ldyBSZWdFeHAoXCIoKDBbMTMtOV18MVswMTJdKVwiICsgZXNjYXBlZFNlcGFyYXRvciArIFwiWzAtM10pfCgwMlwiICsgZXNjYXBlZFNlcGFyYXRvciArIFwiWzAtMl0pXCIpOyB9LCAvL2RheXByZVxuICAgICAgICAgICAgICAgIHZhbDI6IGZ1bmN0aW9uIChzZXBhcmF0b3IpIHsgdmFyIGVzY2FwZWRTZXBhcmF0b3IgPSAkLmlucHV0bWFzay5lc2NhcGVSZWdleC5jYWxsKHRoaXMsIHNlcGFyYXRvcik7IHJldHVybiBuZXcgUmVnRXhwKFwiKCgwWzEtOV18MVswMTJdKVwiICsgZXNjYXBlZFNlcGFyYXRvciArIFwiKDBbMS05XXxbMTJdWzAtOV0pKXwoKDBbMTMtOV18MVswMTJdKVwiICsgZXNjYXBlZFNlcGFyYXRvciArIFwiMzApfCgoMFsxMzU3OF18MVswMl0pXCIgKyBlc2NhcGVkU2VwYXJhdG9yICsgXCIzMSlcIik7IH0sIC8vZGF5XG4gICAgICAgICAgICAgICAgdmFsMXByZTogbmV3IFJlZ0V4cChcIlswMV1cIiksIC8vbW9udGhwcmVcbiAgICAgICAgICAgICAgICB2YWwxOiBuZXcgUmVnRXhwKFwiMFsxLTldfDFbMDEyXVwiKSAvL21vbnRoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVhcGRheTogXCIwMi8yOS9cIixcbiAgICAgICAgICAgIG9uS2V5VXA6IGZ1bmN0aW9uIChlLCBidWZmZXIsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICBpZiAoZS5jdHJsS2V5ICYmIGUua2V5Q29kZSA9PSBvcHRzLmtleUNvZGUuUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgJGlucHV0LnZhbCgodG9kYXkuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCkgKyB0b2RheS5nZXREYXRlKCkudG9TdHJpbmcoKSArIHRvZGF5LmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAneXl5eS9tbS9kZCc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwieS8xLzJcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcInl5eXkvbW0vZGRcIixcbiAgICAgICAgICAgIGFsaWFzOiBcIm1tL2RkL3l5eXlcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiLzAyLzI5XCIsXG4gICAgICAgICAgICBvbktleVVwOiBmdW5jdGlvbiAoZSwgYnVmZmVyLCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYgKGUuY3RybEtleSAmJiBlLmtleUNvZGUgPT0gb3B0cy5rZXlDb2RlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICRpbnB1dC52YWwodG9kYXkuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpICsgKHRvZGF5LmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpICsgdG9kYXkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWZpbml0aW9uczoge1xuICAgICAgICAgICAgICAgICcyJzogeyAvL3ZhbDIgfiBkYXkgb3IgbW9udGhcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBmdW5jdGlvbiAoY2hycywgYnVmZmVyLCBwb3MsIHN0cmljdCwgb3B0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZyb250VmFsdWUgPSBidWZmZXIuam9pbignJykuc3Vic3RyKDUsIDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyb250VmFsdWUuaW5kZXhPZihvcHRzLnBsYWNlaG9sZGVyWzVdKSAhPSAtMSkgZnJvbnRWYWx1ZSA9IFwiMDFcIiArIG9wdHMuc2VwYXJhdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBvcHRzLnJlZ2V4LnZhbDIob3B0cy5zZXBhcmF0b3IpLnRlc3QoZnJvbnRWYWx1ZSArIGNocnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHJpY3QgJiYgIWlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hycy5jaGFyQXQoMSkgPT0gb3B0cy5zZXBhcmF0b3IgfHwgXCItLi9cIi5pbmRleE9mKGNocnMuY2hhckF0KDEpKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gb3B0cy5yZWdleC52YWwyKG9wdHMuc2VwYXJhdG9yKS50ZXN0KGZyb250VmFsdWUgKyBcIjBcIiArIGNocnMuY2hhckF0KDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MgLSAxXSA9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgXCJwb3NcIjogcG9zLCBcImNcIjogY2hycy5jaGFyQXQoMCkgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGVjayBsZWFwIHllYXBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheU1vbnRoVmFsdWUgPSBidWZmZXIuam9pbignJykuc3Vic3RyKDQsIDQpICsgY2hycztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF5TW9udGhWYWx1ZSAhPSBvcHRzLmxlYXBkYXkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeWVhciA9IHBhcnNlSW50KGJ1ZmZlci5qb2luKCcnKS5zdWJzdHIoMCwgNCksIDEwKTsgIC8vZGV0ZWN0IGxlYXAgeWVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDQgPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDEwMCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeWVhciAlIDQwMCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc1ZhbGlkO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjYXJkaW5hbGl0eTogMixcbiAgICAgICAgICAgICAgICAgICAgcHJldmFsaWRhdG9yOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBmdW5jdGlvbiAoY2hycywgYnVmZmVyLCBwb3MsIHN0cmljdCwgb3B0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcm9udFZhbHVlID0gYnVmZmVyLmpvaW4oJycpLnN1YnN0cig1LCAzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnJvbnRWYWx1ZS5pbmRleE9mKG9wdHMucGxhY2Vob2xkZXJbNV0pICE9IC0xKSBmcm9udFZhbHVlID0gXCIwMVwiICsgb3B0cy5zZXBhcmF0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBvcHRzLnJlZ2V4LnZhbDJwcmUob3B0cy5zZXBhcmF0b3IpLnRlc3QoZnJvbnRWYWx1ZSArIGNocnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RyaWN0ICYmICFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBvcHRzLnJlZ2V4LnZhbDIob3B0cy5zZXBhcmF0b3IpLnRlc3QoZnJvbnRWYWx1ZSArIFwiMFwiICsgY2hycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zXSA9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNhcmRpbmFsaXR5OiAxXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAnZGQubW0ueXl5eSc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwiMS4yLnlcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcImRkLm1tLnl5eXlcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiMjkuMDIuXCIsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICcuJyxcbiAgICAgICAgICAgIGFsaWFzOiBcImRkL21tL3l5eXlcIlxuICAgICAgICB9LFxuICAgICAgICAnZGQtbW0teXl5eSc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwiMS0yLXlcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcImRkLW1tLXl5eXlcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiMjktMDItXCIsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICctJyxcbiAgICAgICAgICAgIGFsaWFzOiBcImRkL21tL3l5eXlcIlxuICAgICAgICB9LFxuICAgICAgICAnbW0uZGQueXl5eSc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwiMS4yLnlcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIm1tLmRkLnl5eXlcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiMDIuMjkuXCIsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICcuJyxcbiAgICAgICAgICAgIGFsaWFzOiBcIm1tL2RkL3l5eXlcIlxuICAgICAgICB9LFxuICAgICAgICAnbW0tZGQteXl5eSc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwiMS0yLXlcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIm1tLWRkLXl5eXlcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiMDItMjktXCIsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICctJyxcbiAgICAgICAgICAgIGFsaWFzOiBcIm1tL2RkL3l5eXlcIlxuICAgICAgICB9LFxuICAgICAgICAneXl5eS5tbS5kZCc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwieS4xLjJcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcInl5eXkubW0uZGRcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiLjAyLjI5XCIsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICcuJyxcbiAgICAgICAgICAgIGFsaWFzOiBcInl5eXkvbW0vZGRcIlxuICAgICAgICB9LFxuICAgICAgICAneXl5eS1tbS1kZCc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwieS0xLTJcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcInl5eXktbW0tZGRcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiLTAyLTI5XCIsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICctJyxcbiAgICAgICAgICAgIGFsaWFzOiBcInl5eXkvbW0vZGRcIlxuICAgICAgICB9LFxuICAgICAgICAnZGF0ZXRpbWUnOiB7XG4gICAgICAgICAgICBtYXNrOiBcIjEvMi95IGg6c1wiLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiZGQvbW0veXl5eSBoaDptbVwiLFxuICAgICAgICAgICAgYWxpYXM6IFwiZGQvbW0veXl5eVwiLFxuICAgICAgICAgICAgcmVnZXg6IHtcbiAgICAgICAgICAgICAgICBocnNwcmU6IG5ldyBSZWdFeHAoXCJbMDEyXVwiKSwgLy9ob3VycyBwcmVcbiAgICAgICAgICAgICAgICBocnMyNDogbmV3IFJlZ0V4cChcIjJbMC05XXwxWzMtOV1cIiksXG4gICAgICAgICAgICAgICAgaHJzOiBuZXcgUmVnRXhwKFwiWzAxXVswLTldfDJbMC0zXVwiKSwgLy9ob3Vyc1xuICAgICAgICAgICAgICAgIGFtcG06IG5ldyBSZWdFeHAoXCJeW2F8cHxBfFBdW218TV1cIilcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aW1lc2VwYXJhdG9yOiAnOicsXG4gICAgICAgICAgICBob3VyRm9ybWF0OiBcIjI0XCIsIC8vIG9yIDEyXG4gICAgICAgICAgICBkZWZpbml0aW9uczoge1xuICAgICAgICAgICAgICAgICdoJzogeyAvL2hvdXJzXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogZnVuY3Rpb24gKGNocnMsIGJ1ZmZlciwgcG9zLCBzdHJpY3QsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gb3B0cy5yZWdleC5ocnMudGVzdChjaHJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RyaWN0ICYmICFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNocnMuY2hhckF0KDEpID09IG9wdHMudGltZXNlcGFyYXRvciB8fCBcIi0uOlwiLmluZGV4T2YoY2hycy5jaGFyQXQoMSkpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBvcHRzLnJlZ2V4Lmhycy50ZXN0KFwiMFwiICsgY2hycy5jaGFyQXQoMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3BvcyAtIDFdID0gXCIwXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zXSA9IGNocnMuY2hhckF0KDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsaWQgJiYgb3B0cy5ob3VyRm9ybWF0ICE9PSBcIjI0XCIgJiYgb3B0cy5yZWdleC5ocnMyNC50ZXN0KGNocnMpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gcGFyc2VJbnQoY2hycywgMTApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtcCA9PSAyNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zICsgNV0gPSBcImFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3BvcyArIDZdID0gXCJtXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3BvcyArIDVdID0gXCJwXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MgKyA2XSA9IFwibVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcCA9IHRtcCAtIDEyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtcCA8IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3NdID0gdG1wLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3MgLSAxXSA9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltwb3NdID0gdG1wLnRvU3RyaW5nKCkuY2hhckF0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zIC0gMV0gPSB0bXAudG9TdHJpbmcoKS5jaGFyQXQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgXCJwb3NcIjogcG9zLCBcImNcIjogYnVmZmVyW3Bvc10gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGNhcmRpbmFsaXR5OiAyLFxuICAgICAgICAgICAgICAgICAgICBwcmV2YWxpZGF0b3I6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGZ1bmN0aW9uIChjaHJzLCBidWZmZXIsIHBvcywgc3RyaWN0LCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBvcHRzLnJlZ2V4Lmhyc3ByZS50ZXN0KGNocnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RyaWN0ICYmICFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBvcHRzLnJlZ2V4Lmhycy50ZXN0KFwiMFwiICsgY2hycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zXSA9IFwiMFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNhcmRpbmFsaXR5OiAxXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAndCc6IHsgLy9hbS9wbVxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGZ1bmN0aW9uIChjaHJzLCBidWZmZXIsIHBvcywgc3RyaWN0LCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5yZWdleC5hbXBtLnRlc3QoY2hycyArIFwibVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY2FzaW5nOiBcImxvd2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIGNhcmRpbmFsaXR5OiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc2VydE1vZGU6IGZhbHNlLFxuICAgICAgICAgICAgYXV0b1VubWFzazogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgJ2RhdGV0aW1lMTInOiB7XG4gICAgICAgICAgICBtYXNrOiBcIjEvMi95IGg6cyB0XFxcXG1cIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcImRkL21tL3l5eXkgaGg6bW0geG1cIixcbiAgICAgICAgICAgIGFsaWFzOiBcImRhdGV0aW1lXCIsXG4gICAgICAgICAgICBob3VyRm9ybWF0OiBcIjEyXCJcbiAgICAgICAgfSxcbiAgICAgICAgJ2hoOm1tIHQnOiB7XG4gICAgICAgICAgICBtYXNrOiBcImg6cyB0XFxcXG1cIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcImhoOm1tIHhtXCIsXG4gICAgICAgICAgICBhbGlhczogXCJkYXRldGltZVwiLFxuICAgICAgICAgICAgaG91ckZvcm1hdDogXCIxMlwiXG4gICAgICAgIH0sXG4gICAgICAgICdoOnMgdCc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwiaDpzIHRcXFxcbVwiLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiaGg6bW0geG1cIixcbiAgICAgICAgICAgIGFsaWFzOiBcImRhdGV0aW1lXCIsXG4gICAgICAgICAgICBob3VyRm9ybWF0OiBcIjEyXCJcbiAgICAgICAgfSxcbiAgICAgICAgJ2hoOm1tOnNzJzoge1xuICAgICAgICAgICAgbWFzazogXCJoOnM6c1wiLFxuICAgICAgICAgICAgYXV0b1VubWFzazogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgJ2hoOm1tJzoge1xuICAgICAgICAgICAgbWFzazogXCJoOnNcIixcbiAgICAgICAgICAgIGF1dG9Vbm1hc2s6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgICdkYXRlJzoge1xuICAgICAgICAgICAgYWxpYXM6IFwiZGQvbW0veXl5eVwiIC8vIFwibW0vZGQveXl5eVwiXG4gICAgICAgIH0sXG4gICAgICAgICdtbS95eXl5Jzoge1xuICAgICAgICAgICAgbWFzazogXCIxL3lcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIm1tL3l5eXlcIixcbiAgICAgICAgICAgIGxlYXBkYXk6IFwiZG9ub3R1c2VcIixcbiAgICAgICAgICAgIHNlcGFyYXRvcjogJy8nLFxuICAgICAgICAgICAgYWxpYXM6IFwibW0vZGQveXl5eVwiXG4gICAgICAgIH1cbiAgICB9KTtcbn0pKGpRdWVyeSk7XG4iXX0=
