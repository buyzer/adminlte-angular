/*
Input Mask plugin extensions
http://github.com/RobinHerbots/jquery.inputmask
Copyright (c) 2010 - 2014 Robin Herbots
Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
Version: 0.0.0

Optional extensions on the jquery.inputmask base
*/
(function ($) {
    //extra definitions
    $.extend($.inputmask.defaults.definitions, {
        'A': {
            validator: "[A-Za-z]",
            cardinality: 1,
            casing: "upper" //auto uppercasing
        },
        '#': {
            validator: "[A-Za-z\u0410-\u044F\u0401\u04510-9]",
            cardinality: 1,
            casing: "upper"
        }
    });
    $.extend($.inputmask.defaults.aliases, {
        'url': {
            mask: "ir",
            placeholder: "",
            separator: "",
            defaultPrefix: "http://",
            regex: {
                urlpre1: new RegExp("[fh]"),
                urlpre2: new RegExp("(ft|ht)"),
                urlpre3: new RegExp("(ftp|htt)"),
                urlpre4: new RegExp("(ftp:|http|ftps)"),
                urlpre5: new RegExp("(ftp:/|ftps:|http:|https)"),
                urlpre6: new RegExp("(ftp://|ftps:/|http:/|https:)"),
                urlpre7: new RegExp("(ftp://|ftps://|http://|https:/)"),
                urlpre8: new RegExp("(ftp://|ftps://|http://|https://)")
            },
            definitions: {
                'i': {
                    validator: function (chrs, buffer, pos, strict, opts) {
                        return true;
                    },
                    cardinality: 8,
                    prevalidator: (function () {
                        var result = [], prefixLimit = 8;
                        for (var i = 0; i < prefixLimit; i++) {
                            result[i] = (function () {
                                var j = i;
                                return {
                                    validator: function (chrs, buffer, pos, strict, opts) {
                                        if (opts.regex["urlpre" + (j + 1)]) {
                                            var tmp = chrs, k;
                                            if (((j + 1) - chrs.length) > 0) {
                                                tmp = buffer.join('').substring(0, ((j + 1) - chrs.length)) + "" + tmp;
                                            }
                                            var isValid = opts.regex["urlpre" + (j + 1)].test(tmp);
                                            if (!strict && !isValid) {
                                                pos = pos - j;
                                                for (k = 0; k < opts.defaultPrefix.length; k++) {
                                                    buffer[pos] = opts.defaultPrefix[k]; pos++;
                                                }
                                                for (k = 0; k < tmp.length - 1; k++) {
                                                    buffer[pos] = tmp[k]; pos++;
                                                }
                                                return { "pos": pos };
                                            }
                                            return isValid;
                                        } else {
                                            return false;
                                        }
                                    }, cardinality: j
                                };
                            })();
                        }
                        return result;
                    })()
                },
                "r": {
                    validator: ".",
                    cardinality: 50
                }
            },
            insertMode: false,
            autoUnmask: false
        },
        "ip": { //ip-address mask
            mask: ["[[x]y]z.[[x]y]z.[[x]y]z.x[yz]", "[[x]y]z.[[x]y]z.[[x]y]z.[[x]y][z]"],
            definitions: {
                'x': {
                    validator: "[012]",
                    cardinality: 1,
                    definitionSymbol: "i"
                },
                'y': {
                    validator: function (chrs, buffer, pos, strict, opts) {
                        if (pos - 1 > -1 && buffer[pos - 1] != ".")
                            chrs = buffer[pos - 1] + chrs;
                        else chrs = "0" + chrs;
                        return new RegExp("2[0-5]|[01][0-9]").test(chrs);
                    },
                    cardinality: 1,
                    definitionSymbol: "i"
                },
                'z': {
                    validator: function (chrs, buffer, pos, strict, opts) {
                        if (pos - 1 > -1 && buffer[pos - 1] != ".") {
                            chrs = buffer[pos - 1] + chrs;
                            if (pos - 2 > -1 && buffer[pos - 2] != ".") {
                                chrs = buffer[pos - 2] + chrs;
                            } else chrs = "0" + chrs;
                        } else chrs = "00" + chrs;
                        return new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs);
                    },
                    cardinality: 1,
                    definitionSymbol: "i"
                }
            }
        }
    });
})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5pbnB1dG1hc2suZXh0ZW5zaW9ucy5qcyJdLCJuYW1lcyI6WyIkIiwiZXh0ZW5kIiwiaW5wdXRtYXNrIiwiZGVmYXVsdHMiLCJkZWZpbml0aW9ucyIsIkEiLCJ2YWxpZGF0b3IiLCJjYXJkaW5hbGl0eSIsImNhc2luZyIsIiMiLCJhbGlhc2VzIiwidXJsIiwibWFzayIsInBsYWNlaG9sZGVyIiwic2VwYXJhdG9yIiwiZGVmYXVsdFByZWZpeCIsInJlZ2V4IiwidXJscHJlMSIsIlJlZ0V4cCIsInVybHByZTIiLCJ1cmxwcmUzIiwidXJscHJlNCIsInVybHByZTUiLCJ1cmxwcmU2IiwidXJscHJlNyIsInVybHByZTgiLCJpIiwiY2hycyIsImJ1ZmZlciIsInBvcyIsInN0cmljdCIsIm9wdHMiLCJwcmV2YWxpZGF0b3IiLCJyZXN1bHQiLCJwcmVmaXhMaW1pdCIsImoiLCJrIiwidG1wIiwibGVuZ3RoIiwiam9pbiIsInN1YnN0cmluZyIsImlzVmFsaWQiLCJ0ZXN0IiwiciIsImluc2VydE1vZGUiLCJhdXRvVW5tYXNrIiwiaXAiLCJ4IiwiZGVmaW5pdGlvblN5bWJvbCIsInkiLCJ6IiwialF1ZXJ5Il0sIm1hcHBpbmdzIjoiQ0FTQSxTQUFXQSxHQUVQQSxFQUFFQyxPQUFPRCxFQUFFRSxVQUFVQyxTQUFTQyxhQUMxQkMsR0FDSUMsVUFBVyxXQUNYQyxZQUFhLEVBQ2JDLE9BQVEsU0FFWkMsS0FDSUgsVUFBVyxtQkFDWEMsWUFBYSxFQUNiQyxPQUFRLFdBR2hCUixFQUFFQyxPQUFPRCxFQUFFRSxVQUFVQyxTQUFTTyxTQUMxQkMsS0FDSUMsS0FBTSxLQUNOQyxZQUFhLEdBQ2JDLFVBQVcsR0FDWEMsY0FBZSxVQUNmQyxPQUNJQyxRQUFTLEdBQUlDLFFBQU8sUUFDcEJDLFFBQVMsR0FBSUQsUUFBTyxXQUNwQkUsUUFBUyxHQUFJRixRQUFPLGFBQ3BCRyxRQUFTLEdBQUlILFFBQU8sb0JBQ3BCSSxRQUFTLEdBQUlKLFFBQU8sNkJBQ3BCSyxRQUFTLEdBQUlMLFFBQU8saUNBQ3BCTSxRQUFTLEdBQUlOLFFBQU8sb0NBQ3BCTyxRQUFTLEdBQUlQLFFBQU8sc0NBRXhCZCxhQUNJc0IsR0FDSXBCLFVBQVcsU0FBVXFCLEVBQU1DLEVBQVFDLEVBQUtDLEVBQVFDLEdBQzVDLE9BQU8sR0FFWHhCLFlBQWEsRUFDYnlCLGFBQWMsV0FFVixJQUFLLEdBRERDLE1BQWFDLEVBQWMsRUFDdEJSLEVBQUksRUFBR0EsRUFBSVEsRUFBYVIsSUFDN0JPLEVBQU9QLEdBQUssV0FDUixHQUFJUyxHQUFJVCxDQUNSLFFBQ0lwQixVQUFXLFNBQVVxQixFQUFNQyxFQUFRQyxFQUFLQyxFQUFRQyxHQUM1QyxHQUFJQSxFQUFLZixNQUFNLFVBQVltQixFQUFJLElBQUssQ0FDaEMsR0FBZ0JDLEdBQVpDLEVBQU1WLENBQ0pRLEdBQUksRUFBS1IsRUFBS1csT0FBVSxJQUMxQkQsRUFBTVQsRUFBT1csS0FBSyxJQUFJQyxVQUFVLEVBQUtMLEVBQUksRUFBS1IsRUFBS1csUUFBVyxHQUFLRCxFQUV2RSxJQUFJSSxHQUFVVixFQUFLZixNQUFNLFVBQVltQixFQUFJLElBQUlPLEtBQUtMLEVBQ2xELEtBQUtQLElBQVdXLEVBQVMsQ0FFckIsSUFEQVosR0FBWU0sRUFDUEMsRUFBSSxFQUFHQSxFQUFJTCxFQUFLaEIsY0FBY3VCLE9BQVFGLElBQ3ZDUixFQUFPQyxHQUFPRSxFQUFLaEIsY0FBY3FCLEdBQUlQLEdBRXpDLEtBQUtPLEVBQUksRUFBR0EsRUFBSUMsRUFBSUMsT0FBUyxFQUFHRixJQUM1QlIsRUFBT0MsR0FBT1EsRUFBSUQsR0FBSVAsR0FFMUIsUUFBU0EsSUFBT0EsR0FFcEIsTUFBT1ksR0FFUCxPQUFPLEdBRVpsQyxZQUFhNEIsS0FJNUIsT0FBT0YsT0FHZlUsR0FDSXJDLFVBQVcsSUFDWEMsWUFBYSxLQUdyQnFDLFlBQVksRUFDWkMsWUFBWSxHQUVoQkMsSUFDSWxDLE1BQU8sZ0NBQWlDLHFDQUN4Q1IsYUFDSTJDLEdBQ0l6QyxVQUFXLFFBQ1hDLFlBQWEsRUFDYnlDLGlCQUFrQixLQUV0QkMsR0FDSTNDLFVBQVcsU0FBVXFCLEVBQU1DLEVBQVFDLEVBQUtDLEVBQVFDLEdBSTVDLE1BRklKLEdBREFFLEVBQU0sR0FBSSxHQUF5QixLQUFuQkQsRUFBT0MsRUFBTSxHQUN0QkQsRUFBT0MsRUFBTSxHQUFLRixFQUNqQixJQUFNQSxFQUNYLEdBQUlULFFBQU8sb0JBQW9Cd0IsS0FBS2YsSUFFL0NwQixZQUFhLEVBQ2J5QyxpQkFBa0IsS0FFdEJFLEdBQ0k1QyxVQUFXLFNBQVVxQixFQUFNQyxFQUFRQyxFQUFLQyxFQUFRQyxHQU81QyxNQU5JRixHQUFNLEdBQUksR0FBeUIsS0FBbkJELEVBQU9DLEVBQU0sSUFDN0JGLEVBQU9DLEVBQU9DLEVBQU0sR0FBS0YsRUFFckJBLEVBREFFLEVBQU0sR0FBSSxHQUF5QixLQUFuQkQsRUFBT0MsRUFBTSxHQUN0QkQsRUFBT0MsRUFBTSxHQUFLRixFQUNmLElBQU1BLEdBQ2pCQSxFQUFPLEtBQU9BLEVBQ2QsR0FBSVQsUUFBTyxzQ0FBc0N3QixLQUFLZixJQUVqRXBCLFlBQWEsRUFDYnlDLGlCQUFrQixVQUtuQ0ciLCJmaWxlIjoianF1ZXJ5LmlucHV0bWFzay5leHRlbnNpb25zLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbklucHV0IE1hc2sgcGx1Z2luIGV4dGVuc2lvbnNcbmh0dHA6Ly9naXRodWIuY29tL1JvYmluSGVyYm90cy9qcXVlcnkuaW5wdXRtYXNrXG5Db3B5cmlnaHQgKGMpIDIwMTAgLSAyMDE0IFJvYmluIEhlcmJvdHNcbkxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHApXG5WZXJzaW9uOiAwLjAuMFxuXG5PcHRpb25hbCBleHRlbnNpb25zIG9uIHRoZSBqcXVlcnkuaW5wdXRtYXNrIGJhc2VcbiovXG4oZnVuY3Rpb24gKCQpIHtcbiAgICAvL2V4dHJhIGRlZmluaXRpb25zXG4gICAgJC5leHRlbmQoJC5pbnB1dG1hc2suZGVmYXVsdHMuZGVmaW5pdGlvbnMsIHtcbiAgICAgICAgJ0EnOiB7XG4gICAgICAgICAgICB2YWxpZGF0b3I6IFwiW0EtWmEtel1cIixcbiAgICAgICAgICAgIGNhcmRpbmFsaXR5OiAxLFxuICAgICAgICAgICAgY2FzaW5nOiBcInVwcGVyXCIgLy9hdXRvIHVwcGVyY2FzaW5nXG4gICAgICAgIH0sXG4gICAgICAgICcjJzoge1xuICAgICAgICAgICAgdmFsaWRhdG9yOiBcIltBLVphLXpcXHUwNDEwLVxcdTA0NEZcXHUwNDAxXFx1MDQ1MTAtOV1cIixcbiAgICAgICAgICAgIGNhcmRpbmFsaXR5OiAxLFxuICAgICAgICAgICAgY2FzaW5nOiBcInVwcGVyXCJcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICQuZXh0ZW5kKCQuaW5wdXRtYXNrLmRlZmF1bHRzLmFsaWFzZXMsIHtcbiAgICAgICAgJ3VybCc6IHtcbiAgICAgICAgICAgIG1hc2s6IFwiaXJcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIlwiLFxuICAgICAgICAgICAgc2VwYXJhdG9yOiBcIlwiLFxuICAgICAgICAgICAgZGVmYXVsdFByZWZpeDogXCJodHRwOi8vXCIsXG4gICAgICAgICAgICByZWdleDoge1xuICAgICAgICAgICAgICAgIHVybHByZTE6IG5ldyBSZWdFeHAoXCJbZmhdXCIpLFxuICAgICAgICAgICAgICAgIHVybHByZTI6IG5ldyBSZWdFeHAoXCIoZnR8aHQpXCIpLFxuICAgICAgICAgICAgICAgIHVybHByZTM6IG5ldyBSZWdFeHAoXCIoZnRwfGh0dClcIiksXG4gICAgICAgICAgICAgICAgdXJscHJlNDogbmV3IFJlZ0V4cChcIihmdHA6fGh0dHB8ZnRwcylcIiksXG4gICAgICAgICAgICAgICAgdXJscHJlNTogbmV3IFJlZ0V4cChcIihmdHA6L3xmdHBzOnxodHRwOnxodHRwcylcIiksXG4gICAgICAgICAgICAgICAgdXJscHJlNjogbmV3IFJlZ0V4cChcIihmdHA6Ly98ZnRwczovfGh0dHA6L3xodHRwczopXCIpLFxuICAgICAgICAgICAgICAgIHVybHByZTc6IG5ldyBSZWdFeHAoXCIoZnRwOi8vfGZ0cHM6Ly98aHR0cDovL3xodHRwczovKVwiKSxcbiAgICAgICAgICAgICAgICB1cmxwcmU4OiBuZXcgUmVnRXhwKFwiKGZ0cDovL3xmdHBzOi8vfGh0dHA6Ly98aHR0cHM6Ly8pXCIpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVmaW5pdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAnaSc6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBmdW5jdGlvbiAoY2hycywgYnVmZmVyLCBwb3MsIHN0cmljdCwgb3B0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGNhcmRpbmFsaXR5OiA4LFxuICAgICAgICAgICAgICAgICAgICBwcmV2YWxpZGF0b3I6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHByZWZpeExpbWl0ID0gODtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJlZml4TGltaXQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogZnVuY3Rpb24gKGNocnMsIGJ1ZmZlciwgcG9zLCBzdHJpY3QsIG9wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5yZWdleFtcInVybHByZVwiICsgKGogKyAxKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IGNocnMsIGs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoKGogKyAxKSAtIGNocnMubGVuZ3RoKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcCA9IGJ1ZmZlci5qb2luKCcnKS5zdWJzdHJpbmcoMCwgKChqICsgMSkgLSBjaHJzLmxlbmd0aCkpICsgXCJcIiArIHRtcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWxpZCA9IG9wdHMucmVnZXhbXCJ1cmxwcmVcIiArIChqICsgMSldLnRlc3QodG1wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHJpY3QgJiYgIWlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcyA9IHBvcyAtIGo7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgb3B0cy5kZWZhdWx0UHJlZml4Lmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyW3Bvc10gPSBvcHRzLmRlZmF1bHRQcmVmaXhba107IHBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IHRtcC5sZW5ndGggLSAxOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbcG9zXSA9IHRtcFtrXTsgcG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcInBvc1wiOiBwb3MgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgY2FyZGluYWxpdHk6IGpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfSkoKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJyXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yOiBcIi5cIixcbiAgICAgICAgICAgICAgICAgICAgY2FyZGluYWxpdHk6IDUwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc2VydE1vZGU6IGZhbHNlLFxuICAgICAgICAgICAgYXV0b1VubWFzazogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgXCJpcFwiOiB7IC8vaXAtYWRkcmVzcyBtYXNrXG4gICAgICAgICAgICBtYXNrOiBbXCJbW3hdeV16LltbeF15XXouW1t4XXldei54W3l6XVwiLCBcIltbeF15XXouW1t4XXldei5bW3hdeV16LltbeF15XVt6XVwiXSxcbiAgICAgICAgICAgIGRlZmluaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgJ3gnOiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogXCJbMDEyXVwiLFxuICAgICAgICAgICAgICAgICAgICBjYXJkaW5hbGl0eTogMSxcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvblN5bWJvbDogXCJpXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICd5Jzoge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGZ1bmN0aW9uIChjaHJzLCBidWZmZXIsIHBvcywgc3RyaWN0LCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9zIC0gMSA+IC0xICYmIGJ1ZmZlcltwb3MgLSAxXSAhPSBcIi5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHJzID0gYnVmZmVyW3BvcyAtIDFdICsgY2hycztcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgY2hycyA9IFwiMFwiICsgY2hycztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFwiMlswLTVdfFswMV1bMC05XVwiKS50ZXN0KGNocnMpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjYXJkaW5hbGl0eTogMSxcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvblN5bWJvbDogXCJpXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICd6Jzoge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IGZ1bmN0aW9uIChjaHJzLCBidWZmZXIsIHBvcywgc3RyaWN0LCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9zIC0gMSA+IC0xICYmIGJ1ZmZlcltwb3MgLSAxXSAhPSBcIi5cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNocnMgPSBidWZmZXJbcG9zIC0gMV0gKyBjaHJzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3MgLSAyID4gLTEgJiYgYnVmZmVyW3BvcyAtIDJdICE9IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNocnMgPSBidWZmZXJbcG9zIC0gMl0gKyBjaHJzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBjaHJzID0gXCIwXCIgKyBjaHJzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGNocnMgPSBcIjAwXCIgKyBjaHJzO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCIyNVswLTVdfDJbMC00XVswLTldfFswMV1bMC05XVswLTldXCIpLnRlc3QoY2hycyk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGNhcmRpbmFsaXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICBkZWZpbml0aW9uU3ltYm9sOiBcImlcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSkoalF1ZXJ5KTtcbiJdfQ==
