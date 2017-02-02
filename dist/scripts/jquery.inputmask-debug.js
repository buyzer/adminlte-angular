/**
* @license Input Mask plugin for jquery
* http://github.com/RobinHerbots/jquery.inputmask
* Copyright (c) 2010 - 2014 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 0.0.0
*/

(function ($) {
    if ($.fn.inputmask === undefined) {
        //helper functions    
        function isInputEventSupported(eventName) {
            var el = document.createElement('input'),
            eventName = 'on' + eventName,
            isSupported = (eventName in el);
            if (!isSupported) {
                el.setAttribute(eventName, 'return;');
                isSupported = typeof el[eventName] == 'function';
            }
            el = null;
            return isSupported;
        }
        function resolveAlias(aliasStr, options, opts) {
            var aliasDefinition = opts.aliases[aliasStr];
            if (aliasDefinition) {
                if (aliasDefinition.alias) resolveAlias(aliasDefinition.alias, undefined, opts); //alias is another alias
                $.extend(true, opts, aliasDefinition);  //merge alias definition in the options
                $.extend(true, opts, options);  //reapply extra given options
                return true;
            }
            return false;
        }
        function generateMaskSets(opts) {
            var ms = [];
            var genmasks = []; //used to keep track of the masks that where processed, to avoid duplicates
            function getMaskTemplate(mask) {
                if (opts.numericInput) {
                    mask = mask.split('').reverse().join('');
                }
                var escaped = false, outCount = 0, greedy = opts.greedy, repeat = opts.repeat;
                if (repeat == "*") greedy = false;
                //if (greedy == true && opts.placeholder == "") opts.placeholder = " ";
                if (mask.length == 1 && greedy == false && repeat != 0) { opts.placeholder = ""; } //hide placeholder with single non-greedy mask
                var singleMask = $.map(mask.split(""), function (element, index) {
                    var outElem = [];
                    if (element == opts.escapeChar) {
                        escaped = true;
                    }
                    else if ((element != opts.optionalmarker.start && element != opts.optionalmarker.end) || escaped) {
                        var maskdef = opts.definitions[element];
                        if (maskdef && !escaped) {
                            for (var i = 0; i < maskdef.cardinality; i++) {
                                outElem.push(opts.placeholder.charAt((outCount + i) % opts.placeholder.length));
                            }
                        } else {
                            outElem.push(element);
                            escaped = false;
                        }
                        outCount += outElem.length;
                        return outElem;
                    }
                });

                //allocate repetitions
                var repeatedMask = singleMask.slice();
                for (var i = 1; i < repeat && greedy; i++) {
                    repeatedMask = repeatedMask.concat(singleMask.slice());
                }

                return { "mask": repeatedMask, "repeat": repeat, "greedy": greedy };
            }
            //test definition => {fn: RegExp/function, cardinality: int, optionality: bool, newBlockMarker: bool, offset: int, casing: null/upper/lower, def: definitionSymbol}
            function getTestingChain(mask) {
                if (opts.numericInput) {
                    mask = mask.split('').reverse().join('');
                }
                var isOptional = false, escaped = false;
                var newBlockMarker = false; //indicates wheter the begin/ending of a block should be indicated

                return $.map(mask.split(""), function (element, index) {
                    var outElem = [];

                    if (element == opts.escapeChar) {
                        escaped = true;
                    } else if (element == opts.optionalmarker.start && !escaped) {
                        isOptional = true;
                        newBlockMarker = true;
                    }
                    else if (element == opts.optionalmarker.end && !escaped) {
                        isOptional = false;
                        newBlockMarker = true;
                    }
                    else {
                        var maskdef = opts.definitions[element];
                        if (maskdef && !escaped) {
                            var prevalidators = maskdef["prevalidator"], prevalidatorsL = prevalidators ? prevalidators.length : 0;
                            for (var i = 1; i < maskdef.cardinality; i++) {
                                var prevalidator = prevalidatorsL >= i ? prevalidators[i - 1] : [], validator = prevalidator["validator"], cardinality = prevalidator["cardinality"];
                                outElem.push({ fn: validator ? typeof validator == 'string' ? new RegExp(validator) : new function () { this.test = validator; } : new RegExp("."), cardinality: cardinality ? cardinality : 1, optionality: isOptional, newBlockMarker: isOptional == true ? newBlockMarker : false, offset: 0, casing: maskdef["casing"], def: maskdef["definitionSymbol"] || element });
                                if (isOptional == true) //reset newBlockMarker
                                    newBlockMarker = false;
                            }
                            outElem.push({ fn: maskdef.validator ? typeof maskdef.validator == 'string' ? new RegExp(maskdef.validator) : new function () { this.test = maskdef.validator; } : new RegExp("."), cardinality: maskdef.cardinality, optionality: isOptional, newBlockMarker: newBlockMarker, offset: 0, casing: maskdef["casing"], def: maskdef["definitionSymbol"] || element });
                        } else {
                            outElem.push({ fn: null, cardinality: 0, optionality: isOptional, newBlockMarker: newBlockMarker, offset: 0, casing: null, def: element });
                            escaped = false;
                        }
                        //reset newBlockMarker
                        newBlockMarker = false;
                        return outElem;
                    }
                });
            }
            function markOptional(maskPart) { //needed for the clearOptionalTail functionality
                return opts.optionalmarker.start + maskPart + opts.optionalmarker.end;
            }
            function splitFirstOptionalEndPart(maskPart) {
                var optionalStartMarkers = 0, optionalEndMarkers = 0, mpl = maskPart.length;
                for (var i = 0; i < mpl; i++) {
                    if (maskPart.charAt(i) == opts.optionalmarker.start) {
                        optionalStartMarkers++;
                    }
                    if (maskPart.charAt(i) == opts.optionalmarker.end) {
                        optionalEndMarkers++;
                    }
                    if (optionalStartMarkers > 0 && optionalStartMarkers == optionalEndMarkers)
                        break;
                }
                var maskParts = [maskPart.substring(0, i)];
                if (i < mpl) {
                    maskParts.push(maskPart.substring(i + 1, mpl));
                }
                return maskParts;
            }
            function splitFirstOptionalStartPart(maskPart) {
                var mpl = maskPart.length;
                for (var i = 0; i < mpl; i++) {
                    if (maskPart.charAt(i) == opts.optionalmarker.start) {
                        break;
                    }
                }
                var maskParts = [maskPart.substring(0, i)];
                if (i < mpl) {
                    maskParts.push(maskPart.substring(i + 1, mpl));
                }
                return maskParts;
            }
            function generateMask(maskPrefix, maskPart, metadata) {
                var maskParts = splitFirstOptionalEndPart(maskPart);
                var newMask, maskTemplate;

                var masks = splitFirstOptionalStartPart(maskParts[0]);
                if (masks.length > 1) {
                    newMask = maskPrefix + masks[0] + markOptional(masks[1]) + (maskParts.length > 1 ? maskParts[1] : "");
                    if ($.inArray(newMask, genmasks) == -1 && newMask != "") {
                        genmasks.push(newMask);
                        maskTemplate = getMaskTemplate(newMask);
                        ms.push({
                            "mask": newMask,
                            "_buffer": maskTemplate["mask"],
                            "buffer": maskTemplate["mask"].slice(),
                            "tests": getTestingChain(newMask),
                            "lastValidPosition": -1,
                            "greedy": maskTemplate["greedy"],
                            "repeat": maskTemplate["repeat"],
                            "metadata": metadata
                        });
                    }
                    newMask = maskPrefix + masks[0] + (maskParts.length > 1 ? maskParts[1] : "");
                    if ($.inArray(newMask, genmasks) == -1 && newMask != "") {
                        genmasks.push(newMask);
                        maskTemplate = getMaskTemplate(newMask);
                        ms.push({
                            "mask": newMask,
                            "_buffer": maskTemplate["mask"],
                            "buffer": maskTemplate["mask"].slice(),
                            "tests": getTestingChain(newMask),
                            "lastValidPosition": -1,
                            "greedy": maskTemplate["greedy"],
                            "repeat": maskTemplate["repeat"],
                            "metadata": metadata
                        });
                    }
                    if (splitFirstOptionalStartPart(masks[1]).length > 1) { //optional contains another optional
                        generateMask(maskPrefix + masks[0], masks[1] + maskParts[1], metadata);
                    }
                    if (maskParts.length > 1 && splitFirstOptionalStartPart(maskParts[1]).length > 1) {
                        generateMask(maskPrefix + masks[0] + markOptional(masks[1]), maskParts[1], metadata);
                        generateMask(maskPrefix + masks[0], maskParts[1], metadata);
                    }
                }
                else {
                    newMask = maskPrefix + maskParts;
                    if ($.inArray(newMask, genmasks) == -1 && newMask != "") {
                        genmasks.push(newMask);
                        maskTemplate = getMaskTemplate(newMask);
                        ms.push({
                            "mask": newMask,
                            "_buffer": maskTemplate["mask"],
                            "buffer": maskTemplate["mask"].slice(),
                            "tests": getTestingChain(newMask),
                            "lastValidPosition": -1,
                            "greedy": maskTemplate["greedy"],
                            "repeat": maskTemplate["repeat"],
                            "metadata": metadata
                        });
                    }
                }

            }

            if ($.isFunction(opts.mask)) { //allow mask to be a preprocessing fn - should return a valid mask
                opts.mask = opts.mask.call(this, opts);
            }
            if ($.isArray(opts.mask)) {
                $.each(opts.mask, function (ndx, msk) {
                    if (msk["mask"] != undefined) {
                        generateMask("", msk["mask"].toString(), msk);
                    } else
                        generateMask("", msk.toString());
                });
            } else generateMask("", opts.mask.toString());

            return opts.greedy ? ms : ms.sort(function (a, b) { return a["mask"].length - b["mask"].length; });
        }

        var msie10 = navigator.userAgent.match(new RegExp("msie 10", "i")) !== null,
            iphone = navigator.userAgent.match(new RegExp("iphone", "i")) !== null,
            android = navigator.userAgent.match(new RegExp("android.*safari.*", "i")) !== null,
            androidchrome = navigator.userAgent.match(new RegExp("android.*chrome.*", "i")) !== null,
            pasteEvent = isInputEventSupported('paste') ? 'paste' : isInputEventSupported('input') ? 'input' : "propertychange";


        //masking scope
        //actionObj definition see below
        function maskScope(masksets, activeMasksetIndex, opts, actionObj) {
            var isRTL = false,
                valueOnFocus = getActiveBuffer().join(''),
                $el, chromeValueOnInput,
                skipKeyPressEvent = false, //Safari 5.1.x - modal dialog fires keypress twice workaround
                skipInputEvent = false, //skip when triggered from within inputmask
                ignorable = false;


            //maskset helperfunctions

            function getActiveMaskSet() {
                return masksets[activeMasksetIndex];
            }

            function getActiveTests() {
                return getActiveMaskSet()['tests'];
            }

            function getActiveBufferTemplate() {
                return getActiveMaskSet()['_buffer'];
            }

            function getActiveBuffer() {
                return getActiveMaskSet()['buffer'];
            }

            function isValid(pos, c, strict) { //strict true ~ no correction or autofill
                strict = strict === true; //always set a value to strict to prevent possible strange behavior in the extensions 

                function _isValid(position, activeMaskset, c, strict) {
                    var testPos = determineTestPosition(position), loopend = c ? 1 : 0, chrs = '', buffer = activeMaskset["buffer"];
                    for (var i = activeMaskset['tests'][testPos].cardinality; i > loopend; i--) {
                        chrs += getBufferElement(buffer, testPos - (i - 1));
                    }

                    if (c) {
                        chrs += c;
                    }

                    //return is false or a json object => { pos: ??, c: ??} or true
                    return activeMaskset['tests'][testPos].fn != null ?
                        activeMaskset['tests'][testPos].fn.test(chrs, buffer, position, strict, opts)
                        : (c == getBufferElement(activeMaskset['_buffer'], position, true) || c == opts.skipOptionalPartCharacter) ?
                            { "refresh": true, c: getBufferElement(activeMaskset['_buffer'], position, true), pos: position }
                            : false;
                }

                function PostProcessResults(maskForwards, results) {
                    var hasValidActual = false;
                    $.each(results, function (ndx, rslt) {
                        hasValidActual = $.inArray(rslt["activeMasksetIndex"], maskForwards) == -1 && rslt["result"] !== false;
                        if (hasValidActual) return false;
                    });
                    if (hasValidActual) { //strip maskforwards
                        results = $.map(results, function (rslt, ndx) {
                            if ($.inArray(rslt["activeMasksetIndex"], maskForwards) == -1) {
                                return rslt;
                            } else {
                                masksets[rslt["activeMasksetIndex"]]["lastValidPosition"] = actualLVP;
                            }
                        });
                    } else { //keep maskforwards with the least forward
                        var lowestPos = -1, lowestIndex = -1, rsltValid;
                        $.each(results, function (ndx, rslt) {
                            if ($.inArray(rslt["activeMasksetIndex"], maskForwards) != -1 && rslt["result"] !== false & (lowestPos == -1 || lowestPos > rslt["result"]["pos"])) {
                                lowestPos = rslt["result"]["pos"];
                                lowestIndex = rslt["activeMasksetIndex"];
                            }
                        });
                        results = $.map(results, function (rslt, ndx) {
                            if ($.inArray(rslt["activeMasksetIndex"], maskForwards) != -1) {
                                if (rslt["result"]["pos"] == lowestPos) {
                                    return rslt;
                                } else if (rslt["result"] !== false) {
                                    for (var i = pos; i < lowestPos; i++) {
                                        rsltValid = _isValid(i, masksets[rslt["activeMasksetIndex"]], masksets[lowestIndex]["buffer"][i], true);
                                        if (rsltValid === false) {
                                            masksets[rslt["activeMasksetIndex"]]["lastValidPosition"] = lowestPos - 1;
                                            break;
                                        } else {
                                            setBufferElement(masksets[rslt["activeMasksetIndex"]]["buffer"], i, masksets[lowestIndex]["buffer"][i], true);
                                            masksets[rslt["activeMasksetIndex"]]["lastValidPosition"] = i;
                                        }
                                    }
                                    //also check check for the lowestpos with the new input
                                    rsltValid = _isValid(lowestPos, masksets[rslt["activeMasksetIndex"]], c, true);
                                    if (rsltValid !== false) {
                                        setBufferElement(masksets[rslt["activeMasksetIndex"]]["buffer"], lowestPos, c, true);
                                        masksets[rslt["activeMasksetIndex"]]["lastValidPosition"] = lowestPos;
                                    }
                                    //console.log("ndx " + rslt["activeMasksetIndex"] + " validate " + masksets[rslt["activeMasksetIndex"]]["buffer"].join('') + " lv " + masksets[rslt["activeMasksetIndex"]]['lastValidPosition']);
                                    return rslt;
                                }
                            }
                        });
                    }
                    return results;
                }

                if (strict) {
                    var result = _isValid(pos, getActiveMaskSet(), c, strict); //only check validity in current mask when validating strict
                    if (result === true) {
                        result = { "pos": pos }; //always take a possible corrected maskposition into account
                    }
                    return result;
                }

                var results = [], result = false, currentActiveMasksetIndex = activeMasksetIndex,
                    actualBuffer = getActiveBuffer().slice(), actualLVP = getActiveMaskSet()["lastValidPosition"],
                    actualPrevious = seekPrevious(pos),
                    maskForwards = [];
                $.each(masksets, function (index, value) {
                    if (typeof (value) == "object") {
                        activeMasksetIndex = index;

                        var maskPos = pos;
                        var lvp = getActiveMaskSet()['lastValidPosition'],
                            rsltValid;
                        if (lvp == actualLVP) {
                            if ((maskPos - actualLVP) > 1) {
                                for (var i = lvp == -1 ? 0 : lvp; i < maskPos; i++) {
                                    rsltValid = _isValid(i, getActiveMaskSet(), actualBuffer[i], true);
                                    if (rsltValid === false) {
                                        break;
                                    } else {
                                        setBufferElement(getActiveBuffer(), i, actualBuffer[i], true);
                                        if (rsltValid === true) {
                                            rsltValid = { "pos": i }; //always take a possible corrected maskposition into account
                                        }
                                        var newValidPosition = rsltValid.pos || i;
                                        if (getActiveMaskSet()['lastValidPosition'] < newValidPosition)
                                            getActiveMaskSet()['lastValidPosition'] = newValidPosition; //set new position from isValid
                                    }
                                }
                            }
                            //does the input match on a further position?
                            if (!isMask(maskPos) && !_isValid(maskPos, getActiveMaskSet(), c, strict)) {
                                var maxForward = seekNext(maskPos) - maskPos;
                                for (var fw = 0; fw < maxForward; fw++) {
                                    if (_isValid(++maskPos, getActiveMaskSet(), c, strict) !== false)
                                        break;
                                }
                                maskForwards.push(activeMasksetIndex);
                                //console.log('maskforward ' + activeMasksetIndex + " pos " + pos + " maskPos " + maskPos);
                            }
                        }

                        if (getActiveMaskSet()['lastValidPosition'] >= actualLVP || activeMasksetIndex == currentActiveMasksetIndex) {
                            if (maskPos >= 0 && maskPos < getMaskLength()) {
                                result = _isValid(maskPos, getActiveMaskSet(), c, strict);
                                if (result !== false) {
                                    if (result === true) {
                                        result = { "pos": maskPos }; //always take a possible corrected maskposition into account
                                    }
                                    var newValidPosition = result.pos || maskPos;
                                    if (getActiveMaskSet()['lastValidPosition'] < newValidPosition)
                                        getActiveMaskSet()['lastValidPosition'] = newValidPosition; //set new position from isValid
                                }
                                //console.log("pos " + pos + " ndx " + activeMasksetIndex + " validate " + getActiveBuffer().join('') + " lv " + getActiveMaskSet()['lastValidPosition']);
                                results.push({ "activeMasksetIndex": index, "result": result });
                            }
                        }
                    }
                });
                activeMasksetIndex = currentActiveMasksetIndex; //reset activeMasksetIndex

                return PostProcessResults(maskForwards, results); //return results of the multiple mask validations
            }

            function determineActiveMasksetIndex() {
                var currentMasksetIndex = activeMasksetIndex,
                    highestValid = { "activeMasksetIndex": 0, "lastValidPosition": -1, "next": -1 };
                $.each(masksets, function (index, value) {
                    if (typeof (value) == "object") {
                        activeMasksetIndex = index;
                        if (getActiveMaskSet()['lastValidPosition'] > highestValid['lastValidPosition']) {
                            highestValid["activeMasksetIndex"] = index;
                            highestValid["lastValidPosition"] = getActiveMaskSet()['lastValidPosition'];
                            highestValid["next"] = seekNext(getActiveMaskSet()['lastValidPosition']);
                        } else if (getActiveMaskSet()['lastValidPosition'] == highestValid['lastValidPosition'] &&
                            (highestValid['next'] == -1 || highestValid['next'] > seekNext(getActiveMaskSet()['lastValidPosition']))) {
                            highestValid["activeMasksetIndex"] = index;
                            highestValid["lastValidPosition"] = getActiveMaskSet()['lastValidPosition'];
                            highestValid["next"] = seekNext(getActiveMaskSet()['lastValidPosition']);
                        }
                    }
                });

                activeMasksetIndex = highestValid["lastValidPosition"] != -1 && masksets[currentMasksetIndex]["lastValidPosition"] == highestValid["lastValidPosition"] ? currentMasksetIndex : highestValid["activeMasksetIndex"];
                if (currentMasksetIndex != activeMasksetIndex) {
                    clearBuffer(getActiveBuffer(), seekNext(highestValid["lastValidPosition"]), getMaskLength());
                    getActiveMaskSet()["writeOutBuffer"] = true;
                }
                $el.data('_inputmask')['activeMasksetIndex'] = activeMasksetIndex; //store the activeMasksetIndex
            }

            function isMask(pos) {
                var testPos = determineTestPosition(pos);
                var test = getActiveTests()[testPos];

                return test != undefined ? test.fn : false;
            }

            function determineTestPosition(pos) {
                return pos % getActiveTests().length;
            }

            function getMaskLength() {
                return opts.getMaskLength(getActiveBufferTemplate(), getActiveMaskSet()['greedy'], getActiveMaskSet()['repeat'], getActiveBuffer(), opts);
            }

            //pos: from position

            function seekNext(pos) {
                var maskL = getMaskLength();
                if (pos >= maskL) return maskL;
                var position = pos;
                while (++position < maskL && !isMask(position)) {
                }
                return position;
            }

            //pos: from position

            function seekPrevious(pos) {
                var position = pos;
                if (position <= 0) return 0;

                while (--position > 0 && !isMask(position)) {
                }
                return position;
            }

            function setBufferElement(buffer, position, element, autoPrepare) {
                if (autoPrepare) position = prepareBuffer(buffer, position);

                var test = getActiveTests()[determineTestPosition(position)];
                var elem = element;
                if (elem != undefined && test != undefined) {
                    switch (test.casing) {
                        case "upper":
                            elem = element.toUpperCase();
                            break;
                        case "lower":
                            elem = element.toLowerCase();
                            break;
                    }
                }

                buffer[position] = elem;
            }

            function getBufferElement(buffer, position, autoPrepare) {
                if (autoPrepare) position = prepareBuffer(buffer, position);
                return buffer[position];
            }

            //needed to handle the non-greedy mask repetitions

            function prepareBuffer(buffer, position) {
                var j;
                while (buffer[position] == undefined && buffer.length < getMaskLength()) {
                    j = 0;
                    while (getActiveBufferTemplate()[j] !== undefined) { //add a new buffer
                        buffer.push(getActiveBufferTemplate()[j++]);
                    }
                }

                return position;
            }

            function writeBuffer(input, buffer, caretPos) {
                input._valueSet(buffer.join(''));
                if (caretPos != undefined) {
                    caret(input, caretPos);
                }
            }

            function clearBuffer(buffer, start, end, stripNomasks) {
                for (var i = start, maskL = getMaskLength() ; i < end && i < maskL; i++) {
                    if (stripNomasks === true) {
                        if (!isMask(i))
                            setBufferElement(buffer, i, "");
                    } else
                        setBufferElement(buffer, i, getBufferElement(getActiveBufferTemplate().slice(), i, true));
                }
            }

            function setReTargetPlaceHolder(buffer, pos) {
                var testPos = determineTestPosition(pos);
                setBufferElement(buffer, pos, getBufferElement(getActiveBufferTemplate(), testPos));
            }

            function getPlaceHolder(pos) {
                return opts.placeholder.charAt(pos % opts.placeholder.length);
            }

            function checkVal(input, writeOut, strict, nptvl, intelliCheck) {
                var inputValue = nptvl != undefined ? nptvl.slice() : truncateInput(input._valueGet()).split('');

                $.each(masksets, function (ndx, ms) {
                    if (typeof (ms) == "object") {
                        ms["buffer"] = ms["_buffer"].slice();
                        ms["lastValidPosition"] = -1;
                        ms["p"] = -1;
                    }
                });
                if (strict !== true) activeMasksetIndex = 0;
                if (writeOut) input._valueSet(""); //initial clear
                var ml = getMaskLength();
                $.each(inputValue, function (ndx, charCode) {
                    if (intelliCheck === true) {
                        var p = getActiveMaskSet()["p"], lvp = p == -1 ? p : seekPrevious(p),
                            pos = lvp == -1 ? ndx : seekNext(lvp);
                        if ($.inArray(charCode, getActiveBufferTemplate().slice(lvp + 1, pos)) == -1) {
                            keypressEvent.call(input, undefined, true, charCode.charCodeAt(0), writeOut, strict, ndx);
                        }
                    } else {
                        keypressEvent.call(input, undefined, true, charCode.charCodeAt(0), writeOut, strict, ndx);
                    }
                });

                if (strict === true && getActiveMaskSet()["p"] != -1) {
                    getActiveMaskSet()["lastValidPosition"] = seekPrevious(getActiveMaskSet()["p"]);
                }
            }

            function escapeRegex(str) {
                return $.inputmask.escapeRegex.call(this, str);
            }

            function truncateInput(inputValue) {
                return inputValue.replace(new RegExp("(" + escapeRegex(getActiveBufferTemplate().join('')) + ")*$"), "");
            }

            function clearOptionalTail(input) {
                var buffer = getActiveBuffer(), tmpBuffer = buffer.slice(), testPos, pos;
                for (var pos = tmpBuffer.length - 1; pos >= 0; pos--) {
                    var testPos = determineTestPosition(pos);
                    if (getActiveTests()[testPos].optionality) {
                        if (!isMask(pos) || !isValid(pos, buffer[pos], true))
                            tmpBuffer.pop();
                        else break;
                    } else break;
                }
                writeBuffer(input, tmpBuffer);
            }

            function unmaskedvalue($input, skipDatepickerCheck) {
                if (getActiveTests() && (skipDatepickerCheck === true || !$input.hasClass('hasDatepicker'))) {
                    //checkVal(input, false, true);
                    var umValue = $.map(getActiveBuffer(), function (element, index) {
                        return isMask(index) && isValid(index, element, true) ? element : null;
                    });
                    var unmaskedValue = (isRTL ? umValue.reverse() : umValue).join('');
                    return opts.onUnMask != undefined ? opts.onUnMask.call(this, getActiveBuffer().join(''), unmaskedValue) : unmaskedValue;
                } else {
                    return $input[0]._valueGet();
                }
            }

            function TranslatePosition(pos) {
                if (isRTL && typeof pos == 'number' && (!opts.greedy || opts.placeholder != "")) {
                    var bffrLght = getActiveBuffer().length;
                    pos = bffrLght - pos;
                }
                return pos;
            }

            function caret(input, begin, end) {
                var npt = input.jquery && input.length > 0 ? input[0] : input, range;
                if (typeof begin == 'number') {
                    begin = TranslatePosition(begin);
                    end = TranslatePosition(end);
                    if (!$(input).is(':visible')) {
                        return;
                    }
                    end = (typeof end == 'number') ? end : begin;
                    npt.scrollLeft = npt.scrollWidth;
                    if (opts.insertMode == false && begin == end) end++; //set visualization for insert/overwrite mode
                    if (npt.setSelectionRange) {
                        npt.selectionStart = begin;
                        npt.selectionEnd = android ? begin : end;

                    } else if (npt.createTextRange) {
                        range = npt.createTextRange();
                        range.collapse(true);
                        range.moveEnd('character', end);
                        range.moveStart('character', begin);
                        range.select();
                    }
                } else {
                    if (!$(input).is(':visible')) {
                        return { "begin": 0, "end": 0 };
                    }
                    if (npt.setSelectionRange) {
                        begin = npt.selectionStart;
                        end = npt.selectionEnd;
                    } else if (document.selection && document.selection.createRange) {
                        range = document.selection.createRange();
                        begin = 0 - range.duplicate().moveStart('character', -100000);
                        end = begin + range.text.length;
                    }
                    begin = TranslatePosition(begin);
                    end = TranslatePosition(end);
                    return { "begin": begin, "end": end };
                }
            }

            function isComplete(buffer) { //return true / false / undefined (repeat *)
                if (opts.repeat == "*") return undefined;
                var complete = false, highestValidPosition = 0, currentActiveMasksetIndex = activeMasksetIndex;
                $.each(masksets, function (ndx, ms) {
                    if (typeof (ms) == "object") {
                        activeMasksetIndex = ndx;
                        var aml = seekPrevious(getMaskLength());
                        if (ms["lastValidPosition"] >= highestValidPosition && ms["lastValidPosition"] == aml) {
                            var msComplete = true;
                            for (var i = 0; i <= aml; i++) {
                                var mask = isMask(i), testPos = determineTestPosition(i);
                                if ((mask && (buffer[i] == undefined || buffer[i] == getPlaceHolder(i))) || (!mask && buffer[i] != getActiveBufferTemplate()[testPos])) {
                                    msComplete = false;
                                    break;
                                }
                            }
                            complete = complete || msComplete;
                            if (complete) //break loop
                                return false;
                        }
                        highestValidPosition = ms["lastValidPosition"];
                    }
                });
                activeMasksetIndex = currentActiveMasksetIndex; //reset activeMaskset
                return complete;
            }

            function isSelection(begin, end) {
                return isRTL ? (begin - end) > 1 || ((begin - end) == 1 && opts.insertMode) :
                    (end - begin) > 1 || ((end - begin) == 1 && opts.insertMode);
            }


            //private functions
            function installEventRuler(npt) {
                var events = $._data(npt).events;

                $.each(events, function (eventType, eventHandlers) {
                    $.each(eventHandlers, function (ndx, eventHandler) {
                        if (eventHandler.namespace == "inputmask") {
                            if (eventHandler.type != "setvalue") {
                                var handler = eventHandler.handler;
                                eventHandler.handler = function (e) {
                                    if (this.readOnly || this.disabled)
                                        e.preventDefault;
                                    else
                                        return handler.apply(this, arguments);
                                };
                            }
                        }
                    });
                });
            }

            function patchValueProperty(npt) {
                var valueProperty;
                if (Object.getOwnPropertyDescriptor)
                    valueProperty = Object.getOwnPropertyDescriptor(npt, "value");
                if (valueProperty && valueProperty.get) {
                    if (!npt._valueGet) {
                        var valueGet = valueProperty.get;
                        var valueSet = valueProperty.set;
                        npt._valueGet = function () {
                            return isRTL ? valueGet.call(this).split('').reverse().join('') : valueGet.call(this);
                        };
                        npt._valueSet = function (value) {
                            valueSet.call(this, isRTL ? value.split('').reverse().join('') : value);
                        };

                        Object.defineProperty(npt, "value", {
                            get: function () {
                                var $self = $(this), inputData = $(this).data('_inputmask'), masksets = inputData['masksets'],
                                    activeMasksetIndex = inputData['activeMasksetIndex'];
                                return inputData && inputData['opts'].autoUnmask ? $self.inputmask('unmaskedvalue') : valueGet.call(this) != masksets[activeMasksetIndex]['_buffer'].join('') ? valueGet.call(this) : '';
                            },
                            set: function (value) {
                                valueSet.call(this, value);
                                $(this).triggerHandler('setvalue.inputmask');
                            }
                        });
                    }
                } else if (document.__lookupGetter__ && npt.__lookupGetter__("value")) {
                    if (!npt._valueGet) {
                        var valueGet = npt.__lookupGetter__("value");
                        var valueSet = npt.__lookupSetter__("value");
                        npt._valueGet = function () {
                            return isRTL ? valueGet.call(this).split('').reverse().join('') : valueGet.call(this);
                        };
                        npt._valueSet = function (value) {
                            valueSet.call(this, isRTL ? value.split('').reverse().join('') : value);
                        };

                        npt.__defineGetter__("value", function () {
                            var $self = $(this), inputData = $(this).data('_inputmask'), masksets = inputData['masksets'],
                                activeMasksetIndex = inputData['activeMasksetIndex'];
                            return inputData && inputData['opts'].autoUnmask ? $self.inputmask('unmaskedvalue') : valueGet.call(this) != masksets[activeMasksetIndex]['_buffer'].join('') ? valueGet.call(this) : '';
                        });
                        npt.__defineSetter__("value", function (value) {
                            valueSet.call(this, value);
                            $(this).triggerHandler('setvalue.inputmask');
                        });
                    }
                } else {
                    if (!npt._valueGet) {
                        npt._valueGet = function () { return isRTL ? this.value.split('').reverse().join('') : this.value; };
                        npt._valueSet = function (value) { this.value = isRTL ? value.split('').reverse().join('') : value; };
                    }
                    if ($.valHooks.text == undefined || $.valHooks.text.inputmaskpatch != true) {
                        var valueGet = $.valHooks.text && $.valHooks.text.get ? $.valHooks.text.get : function (elem) { return elem.value; };
                        var valueSet = $.valHooks.text && $.valHooks.text.set ? $.valHooks.text.set : function (elem, value) {
                            elem.value = value;
                            return elem;
                        };

                        jQuery.extend($.valHooks, {
                            text: {
                                get: function (elem) {
                                    var $elem = $(elem);
                                    if ($elem.data('_inputmask')) {
                                        if ($elem.data('_inputmask')['opts'].autoUnmask)
                                            return $elem.inputmask('unmaskedvalue');
                                        else {
                                            var result = valueGet(elem),
                                                inputData = $elem.data('_inputmask'), masksets = inputData['masksets'],
                                                activeMasksetIndex = inputData['activeMasksetIndex'];
                                            return result != masksets[activeMasksetIndex]['_buffer'].join('') ? result : '';
                                        }
                                    } else return valueGet(elem);
                                },
                                set: function (elem, value) {
                                    var $elem = $(elem);
                                    var result = valueSet(elem, value);
                                    if ($elem.data('_inputmask')) $elem.triggerHandler('setvalue.inputmask');
                                    return result;
                                },
                                inputmaskpatch: true
                            }
                        });
                    }
                }
            }

            //shift chars to left from start to end and put c at end position if defined

            function shiftL(start, end, c, maskJumps) {
                var buffer = getActiveBuffer();
                if (maskJumps !== false) //jumping over nonmask position
                    while (!isMask(start) && start - 1 >= 0) start--;
                for (var i = start; i < end && i < getMaskLength() ; i++) {
                    if (isMask(i)) {
                        setReTargetPlaceHolder(buffer, i);
                        var j = seekNext(i);
                        var p = getBufferElement(buffer, j);
                        if (p != getPlaceHolder(j)) {
                            if (j < getMaskLength() && isValid(i, p, true) !== false && getActiveTests()[determineTestPosition(i)].def == getActiveTests()[determineTestPosition(j)].def) {
                                setBufferElement(buffer, i, p, true);
                            } else {
                                if (isMask(i))
                                    break;
                            }
                        }
                    } else {
                        setReTargetPlaceHolder(buffer, i);
                    }
                }
                if (c != undefined)
                    setBufferElement(buffer, seekPrevious(end), c);

                if (getActiveMaskSet()["greedy"] == false) {
                    var trbuffer = truncateInput(buffer.join('')).split('');
                    buffer.length = trbuffer.length;
                    for (var i = 0, bl = buffer.length; i < bl; i++) {
                        buffer[i] = trbuffer[i];
                    }
                    if (buffer.length == 0) getActiveMaskSet()["buffer"] = getActiveBufferTemplate().slice();
                }
                return start; //return the used start position
            }

            function shiftR(start, end, c) {
                var buffer = getActiveBuffer();
                if (getBufferElement(buffer, start, true) != getPlaceHolder(start)) {
                    for (var i = seekPrevious(end) ; i > start && i >= 0; i--) {
                        if (isMask(i)) {
                            var j = seekPrevious(i);
                            var t = getBufferElement(buffer, j);
                            if (t != getPlaceHolder(j)) {
                                if (isValid(j, t, true) !== false && getActiveTests()[determineTestPosition(i)].def == getActiveTests()[determineTestPosition(j)].def) {
                                    setBufferElement(buffer, i, t, true);
                                    setReTargetPlaceHolder(buffer, j);
                                } //else break;
                            }
                        } else
                            setReTargetPlaceHolder(buffer, i);
                    }
                }
                if (c != undefined && getBufferElement(buffer, start) == getPlaceHolder(start))
                    setBufferElement(buffer, start, c);
                var lengthBefore = buffer.length;
                if (getActiveMaskSet()["greedy"] == false) {
                    var trbuffer = truncateInput(buffer.join('')).split('');
                    buffer.length = trbuffer.length;
                    for (var i = 0, bl = buffer.length; i < bl; i++) {
                        buffer[i] = trbuffer[i];
                    }
                    if (buffer.length == 0) getActiveMaskSet()["buffer"] = getActiveBufferTemplate().slice();
                }
                return end - (lengthBefore - buffer.length); //return new start position
            }

            function HandleRemove(input, k, pos) {
                if (opts.numericInput || isRTL) {
                    switch (k) {
                        case opts.keyCode.BACKSPACE:
                            k = opts.keyCode.DELETE;
                            break;
                        case opts.keyCode.DELETE:
                            k = opts.keyCode.BACKSPACE;
                            break;
                    }
                    if (isRTL) {
                        var pend = pos.end;
                        pos.end = pos.begin;
                        pos.begin = pend;
                    }
                }

                var isSelection = true;
                if (pos.begin == pos.end) {
                    var posBegin = k == opts.keyCode.BACKSPACE ? pos.begin - 1 : pos.begin;
                    if (opts.isNumeric && opts.radixPoint != "" && getActiveBuffer()[posBegin] == opts.radixPoint) {
                        pos.begin = (getActiveBuffer().length - 1 == posBegin) /* radixPoint is latest? delete it */ ? pos.begin : k == opts.keyCode.BACKSPACE ? posBegin : seekNext(posBegin);
                        pos.end = pos.begin;
                    }
                    isSelection = false;
                    if (k == opts.keyCode.BACKSPACE)
                        pos.begin--;
                    else if (k == opts.keyCode.DELETE)
                        pos.end++;
                } else if (pos.end - pos.begin == 1 && !opts.insertMode) {
                    isSelection = false;
                    if (k == opts.keyCode.BACKSPACE)
                        pos.begin--;
                }

                clearBuffer(getActiveBuffer(), pos.begin, pos.end);

                var ml = getMaskLength();
                if (opts.greedy == false) {
                    shiftL(pos.begin, ml, undefined, !isRTL && (k == opts.keyCode.BACKSPACE && !isSelection));
                } else {
                    var newpos = pos.begin;
                    for (var i = pos.begin; i < pos.end; i++) { //seeknext to skip placeholders at start in selection
                        if (isMask(i) || !isSelection)
                            newpos = shiftL(pos.begin, ml, undefined, !isRTL && (k == opts.keyCode.BACKSPACE && !isSelection));
                    }
                    if (!isSelection) pos.begin = newpos;
                }
                var firstMaskPos = seekNext(-1);
                clearBuffer(getActiveBuffer(), pos.begin, pos.end, true);
                checkVal(input, false, masksets[1] == undefined || firstMaskPos >= pos.end, getActiveBuffer());
                if (getActiveMaskSet()['lastValidPosition'] < firstMaskPos) {
                    getActiveMaskSet()["lastValidPosition"] = -1;
                    getActiveMaskSet()["p"] = firstMaskPos;
                } else {
                    getActiveMaskSet()["p"] = pos.begin;
                }
            }

            function keydownEvent(e) {
                //Safari 5.1.x - modal dialog fires keypress twice workaround
                skipKeyPressEvent = false;
                var input = this, $input = $(input), k = e.keyCode, pos = caret(input);

                //backspace, delete, and escape get special treatment
                if (k == opts.keyCode.BACKSPACE || k == opts.keyCode.DELETE || (iphone && k == 127) || e.ctrlKey && k == 88) { //backspace/delete
                    e.preventDefault(); //stop default action but allow propagation
                    if (k == 88) valueOnFocus = getActiveBuffer().join('');
                    HandleRemove(input, k, pos);
                    determineActiveMasksetIndex();
                    writeBuffer(input, getActiveBuffer(), getActiveMaskSet()["p"]);
                    if (input._valueGet() == getActiveBufferTemplate().join(''))
                        $input.trigger('cleared');

                    if (opts.showTooltip) { //update tooltip
                        $input.prop("title", getActiveMaskSet()["mask"]);
                    }
                } else if (k == opts.keyCode.END || k == opts.keyCode.PAGE_DOWN) { //when END or PAGE_DOWN pressed set position at lastmatch
                    setTimeout(function () {
                        var caretPos = seekNext(getActiveMaskSet()["lastValidPosition"]);
                        if (!opts.insertMode && caretPos == getMaskLength() && !e.shiftKey) caretPos--;
                        caret(input, e.shiftKey ? pos.begin : caretPos, caretPos);
                    }, 0);
                } else if ((k == opts.keyCode.HOME && !e.shiftKey) || k == opts.keyCode.PAGE_UP) { //Home or page_up
                    caret(input, 0, e.shiftKey ? pos.begin : 0);
                } else if (k == opts.keyCode.ESCAPE || (k == 90 && e.ctrlKey)) { //escape && undo
                    checkVal(input, true, false, valueOnFocus.split(''));
                    $input.click();
                } else if (k == opts.keyCode.INSERT && !(e.shiftKey || e.ctrlKey)) { //insert
                    opts.insertMode = !opts.insertMode;
                    caret(input, !opts.insertMode && pos.begin == getMaskLength() ? pos.begin - 1 : pos.begin);
                } else if (opts.insertMode == false && !e.shiftKey) {
                    if (k == opts.keyCode.RIGHT) {
                        setTimeout(function () {
                            var caretPos = caret(input);
                            caret(input, caretPos.begin);
                        }, 0);
                    } else if (k == opts.keyCode.LEFT) {
                        setTimeout(function () {
                            var caretPos = caret(input);
                            caret(input, caretPos.begin - 1);
                        }, 0);
                    }
                }

                var currentCaretPos = caret(input);
                if (opts.onKeyDown.call(this, e, getActiveBuffer(), opts) === true) //extra stuff to execute on keydown
                    caret(input, currentCaretPos.begin, currentCaretPos.end);
                ignorable = $.inArray(k, opts.ignorables) != -1;
            }


            function keypressEvent(e, checkval, k, writeOut, strict, ndx) {
                //Safari 5.1.x - modal dialog fires keypress twice workaround
                if (k == undefined && skipKeyPressEvent) return false;
                skipKeyPressEvent = true;

                var input = this, $input = $(input);

                e = e || window.event;
                var k = checkval ? k : (e.which || e.charCode || e.keyCode);

                if (checkval !== true && (!(e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable))) {
                    return true;
                } else {
                    if (k) {
                        //special treat the decimal separator
                        if (checkval !== true && k == 46 && e.shiftKey == false && opts.radixPoint == ",") k = 44;

                        var pos, results, result, c = String.fromCharCode(k);
                        if (checkval) {
                            var pcaret = strict ? ndx : getActiveMaskSet()["lastValidPosition"] + 1;
                            pos = { begin: pcaret, end: pcaret };
                        } else {
                            pos = caret(input);
                        }

                        //should we clear a possible selection??
                        var isSlctn = isSelection(pos.begin, pos.end), redetermineLVP = false,
                            initialIndex = activeMasksetIndex;
                        if (isSlctn) {
                            activeMasksetIndex = initialIndex;
                            $.each(masksets, function (ndx, lmnt) { //init undobuffer for recovery when not valid
                                if (typeof (lmnt) == "object") {
                                    activeMasksetIndex = ndx;
                                    getActiveMaskSet()["undoBuffer"] = getActiveBuffer().join('');
                                }
                            });
                            HandleRemove(input, opts.keyCode.DELETE, pos);
                            if (!opts.insertMode) { //preserve some space
                                $.each(masksets, function (ndx, lmnt) {
                                    if (typeof (lmnt) == "object") {
                                        activeMasksetIndex = ndx;
                                        shiftR(pos.begin, getMaskLength());
                                        getActiveMaskSet()["lastValidPosition"] = seekNext(getActiveMaskSet()["lastValidPosition"]);
                                    }
                                });
                            }
                            activeMasksetIndex = initialIndex; //restore index
                        }

                        var radixPosition = getActiveBuffer().join('').indexOf(opts.radixPoint);
                        if (opts.isNumeric && checkval !== true && radixPosition != -1) {
                            if (opts.greedy && pos.begin <= radixPosition) {
                                pos.begin = seekPrevious(pos.begin);
                                pos.end = pos.begin;
                            } else if (c == opts.radixPoint) {
                                pos.begin = radixPosition;
                                pos.end = pos.begin;
                            }
                        }


                        var p = pos.begin;
                        results = isValid(p, c, strict);
                        if (strict === true) results = [{ "activeMasksetIndex": activeMasksetIndex, "result": results }];
                        var minimalForwardPosition = -1;
                        $.each(results, function (index, result) {
                            activeMasksetIndex = result["activeMasksetIndex"];
                            getActiveMaskSet()["writeOutBuffer"] = true;
                            var np = result["result"];
                            if (np !== false) {
                                var refresh = false, buffer = getActiveBuffer();
                                if (np !== true) {
                                    refresh = np["refresh"]; //only rewrite buffer from isValid
                                    p = np.pos != undefined ? np.pos : p; //set new position from isValid
                                    c = np.c != undefined ? np.c : c; //set new char from isValid
                                }
                                if (refresh !== true) {
                                    if (opts.insertMode == true) {
                                        var lastUnmaskedPosition = getMaskLength();
                                        var bfrClone = buffer.slice();
                                        while (getBufferElement(bfrClone, lastUnmaskedPosition, true) != getPlaceHolder(lastUnmaskedPosition) && lastUnmaskedPosition >= p) {
                                            lastUnmaskedPosition = lastUnmaskedPosition == 0 ? -1 : seekPrevious(lastUnmaskedPosition);
                                        }
                                        if (lastUnmaskedPosition >= p) {
                                            shiftR(p, getMaskLength(), c);
                                            //shift the lvp if needed
                                            var lvp = getActiveMaskSet()["lastValidPosition"], nlvp = seekNext(lvp);
                                            if (nlvp != getMaskLength() && lvp >= p && (getBufferElement(getActiveBuffer(), nlvp, true) != getPlaceHolder(nlvp))) {
                                                getActiveMaskSet()["lastValidPosition"] = nlvp;
                                            }
                                        } else getActiveMaskSet()["writeOutBuffer"] = false;
                                    } else setBufferElement(buffer, p, c, true);
                                    if (minimalForwardPosition == -1 || minimalForwardPosition > seekNext(p)) {
                                        minimalForwardPosition = seekNext(p);
                                    }
                                } else if (!strict) {
                                    var nextPos = p < getMaskLength() ? p + 1 : p;
                                    if (minimalForwardPosition == -1 || minimalForwardPosition > nextPos) {
                                        minimalForwardPosition = nextPos;
                                    }
                                }
                                if (minimalForwardPosition > getActiveMaskSet()["p"])
                                    getActiveMaskSet()["p"] = minimalForwardPosition; //needed for checkval strict 
                            }
                        });

                        if (strict !== true) {
                            activeMasksetIndex = initialIndex;
                            determineActiveMasksetIndex();
                        }
                        if (writeOut !== false) {
                            $.each(results, function (ndx, rslt) {
                                if (rslt["activeMasksetIndex"] == activeMasksetIndex) {
                                    result = rslt;
                                    return false;
                                }
                            });
                            if (result != undefined) {
                                var self = this;
                                setTimeout(function () { opts.onKeyValidation.call(self, result["result"], opts); }, 0);
                                if (getActiveMaskSet()["writeOutBuffer"] && result["result"] !== false) {
                                    var buffer = getActiveBuffer();

                                    var newCaretPosition;
                                    if (checkval) {
                                        newCaretPosition = undefined;
                                    } else if (opts.numericInput) {
                                        if (p > radixPosition) {
                                            newCaretPosition = seekPrevious(minimalForwardPosition);
                                        } else if (c == opts.radixPoint) {
                                            newCaretPosition = minimalForwardPosition - 1;
                                        } else newCaretPosition = seekPrevious(minimalForwardPosition - 1);
                                    } else {
                                        newCaretPosition = minimalForwardPosition;
                                    }

                                    writeBuffer(input, buffer, newCaretPosition);
                                    if (checkval !== true) {
                                        setTimeout(function () { //timeout needed for IE
                                            if (isComplete(buffer) === true)
                                                $input.trigger("complete");
                                            skipInputEvent = true;
                                            $input.trigger("input");
                                        }, 0);
                                    }
                                } else if (isSlctn) {
                                    getActiveMaskSet()["buffer"] = getActiveMaskSet()["undoBuffer"].split('');
                                }
                            }
                        }

                        if (opts.showTooltip) { //update tooltip
                            $input.prop("title", getActiveMaskSet()["mask"]);
                        }

                        //needed for IE8 and below
                        if (e) e.preventDefault ? e.preventDefault() : e.returnValue = false;
                    }
                }
            }

            function keyupEvent(e) {
                var $input = $(this), input = this, k = e.keyCode, buffer = getActiveBuffer();

                if (androidchrome && k == opts.keyCode.BACKSPACE) {
                    if (chromeValueOnInput == input._valueGet())
                        keydownEvent.call(this, e);
                }

                opts.onKeyUp.call(this, e, buffer, opts); //extra stuff to execute on keyup
                if (k == opts.keyCode.TAB && opts.showMaskOnFocus) {
                    if ($input.hasClass('focus.inputmask') && input._valueGet().length == 0) {
                        buffer = getActiveBufferTemplate().slice();
                        writeBuffer(input, buffer);
                        caret(input, 0);
                        valueOnFocus = getActiveBuffer().join('');
                    } else {
                        writeBuffer(input, buffer);
                        if (buffer.join('') == getActiveBufferTemplate().join('') && $.inArray(opts.radixPoint, buffer) != -1) {
                            caret(input, TranslatePosition(0));
                            $input.click();
                        } else
                            caret(input, TranslatePosition(0), TranslatePosition(getMaskLength()));
                    }
                }
            }

            function inputEvent(e) {
                if (skipInputEvent === true) {
                    skipInputEvent = false;
                    return true;
                }
                var input = this, $input = $(input);

                chromeValueOnInput = getActiveBuffer().join('');
                checkVal(input, false, false);
                writeBuffer(input, getActiveBuffer());
                if (isComplete(getActiveBuffer()) === true)
                    $input.trigger("complete");
                $input.click();
            }

            function mask(el) {
                $el = $(el);
                if ($el.is(":input")) {
                    //store tests & original buffer in the input element - used to get the unmasked value
                    $el.data('_inputmask', {
                        'masksets': masksets,
                        'activeMasksetIndex': activeMasksetIndex,
                        'opts': opts,
                        'isRTL': false
                    });

                    //show tooltip
                    if (opts.showTooltip) {
                        $el.prop("title", getActiveMaskSet()["mask"]);
                    }

                    //correct greedy setting if needed
                    getActiveMaskSet()['greedy'] = getActiveMaskSet()['greedy'] ? getActiveMaskSet()['greedy'] : getActiveMaskSet()['repeat'] == 0;

                    //handle maxlength attribute
                    if ($el.attr("maxLength") != null) //only when the attribute is set
                    {
                        var maxLength = $el.prop('maxLength');
                        if (maxLength > -1) { //handle *-repeat
                            $.each(masksets, function (ndx, ms) {
                                if (typeof (ms) == "object") {
                                    if (ms["repeat"] == "*") {
                                        ms["repeat"] = maxLength;
                                    }
                                }
                            });
                        }
                        if (getMaskLength() >= maxLength && maxLength > -1) { //FF sets no defined max length to -1 
                            if (maxLength < getActiveBufferTemplate().length) getActiveBufferTemplate().length = maxLength;
                            if (getActiveMaskSet()['greedy'] == false) {
                                getActiveMaskSet()['repeat'] = Math.round(maxLength / getActiveBufferTemplate().length);
                            }
                            $el.prop('maxLength', getMaskLength() * 2);
                        }
                    }

                    patchValueProperty(el);

                    if (opts.numericInput) opts.isNumeric = opts.numericInput;
                    if (el.dir == "rtl" || (opts.numericInput && opts.rightAlignNumerics) || (opts.isNumeric && opts.rightAlignNumerics))
                        $el.css("text-align", "right");

                    if (el.dir == "rtl" || opts.numericInput) {
                        el.dir = "ltr";
                        $el.removeAttr("dir");
                        var inputData = $el.data('_inputmask');
                        inputData['isRTL'] = true;
                        $el.data('_inputmask', inputData);
                        isRTL = true;
                    }

                    //unbind all events - to make sure that no other mask will interfere when re-masking
                    $el.unbind(".inputmask");
                    $el.removeClass('focus.inputmask');
                    //bind events
                    $el.closest('form').bind("submit", function () { //trigger change on submit if any
                        if (valueOnFocus != getActiveBuffer().join('')) {
                            $el.change();
                        }
                    }).bind('reset', function () {
                        setTimeout(function () {
                            $el.trigger("setvalue");
                        }, 0);
                    });
                    $el.bind("mouseenter.inputmask", function () {
                        var $input = $(this), input = this;
                        if (!$input.hasClass('focus.inputmask') && opts.showMaskOnHover) {
                            if (input._valueGet() != getActiveBuffer().join('')) {
                                writeBuffer(input, getActiveBuffer());
                            }
                        }
                    }).bind("blur.inputmask", function () {
                        var $input = $(this), input = this, nptValue = input._valueGet(), buffer = getActiveBuffer();
                        $input.removeClass('focus.inputmask');
                        if (valueOnFocus != getActiveBuffer().join('')) {
                            $input.change();
                        }
                        if (opts.clearMaskOnLostFocus && nptValue != '') {
                            if (nptValue == getActiveBufferTemplate().join(''))
                                input._valueSet('');
                            else { //clearout optional tail of the mask
                                clearOptionalTail(input);
                            }
                        }
                        if (isComplete(buffer) === false) {
                            $input.trigger("incomplete");
                            if (opts.clearIncomplete) {
                                $.each(masksets, function (ndx, ms) {
                                    if (typeof (ms) == "object") {
                                        ms["buffer"] = ms["_buffer"].slice();
                                        ms["lastValidPosition"] = -1;
                                    }
                                });
                                activeMasksetIndex = 0;
                                if (opts.clearMaskOnLostFocus)
                                    input._valueSet('');
                                else {
                                    buffer = getActiveBufferTemplate().slice();
                                    writeBuffer(input, buffer);
                                }
                            }
                        }
                    }).bind("focus.inputmask", function () {
                        var $input = $(this), input = this, nptValue = input._valueGet();
                        if (opts.showMaskOnFocus && !$input.hasClass('focus.inputmask') && (!opts.showMaskOnHover || (opts.showMaskOnHover && nptValue == ''))) {
                            if (input._valueGet() != getActiveBuffer().join('')) {
                                writeBuffer(input, getActiveBuffer(), seekNext(getActiveMaskSet()["lastValidPosition"]));
                            }
                        }
                        $input.addClass('focus.inputmask');
                        valueOnFocus = getActiveBuffer().join('');
                    }).bind("mouseleave.inputmask", function () {
                        var $input = $(this), input = this;
                        if (opts.clearMaskOnLostFocus) {
                            if (!$input.hasClass('focus.inputmask') && input._valueGet() != $input.attr("placeholder")) {
                                if (input._valueGet() == getActiveBufferTemplate().join('') || input._valueGet() == '')
                                    input._valueSet('');
                                else { //clearout optional tail of the mask
                                    clearOptionalTail(input);
                                }
                            }
                        }
                    }).bind("click.inputmask", function () {
                        var input = this;
                        setTimeout(function () {
                            var selectedCaret = caret(input), buffer = getActiveBuffer();
                            if (selectedCaret.begin == selectedCaret.end) {
                                var clickPosition = isRTL ? TranslatePosition(selectedCaret.begin) : selectedCaret.begin,
                                    lvp = getActiveMaskSet()["lastValidPosition"],
                                    lastPosition;
                                if (opts.isNumeric) {
                                    lastPosition = opts.skipRadixDance === false && opts.radixPoint != "" && $.inArray(opts.radixPoint, buffer) != -1 ?
                                        (opts.numericInput ? seekNext($.inArray(opts.radixPoint, buffer)) : $.inArray(opts.radixPoint, buffer)) :
                                        seekNext(lvp);
                                } else {
                                    lastPosition = seekNext(lvp);
                                }
                                if (clickPosition < lastPosition) {
                                    if (isMask(clickPosition))
                                        caret(input, clickPosition);
                                    else caret(input, seekNext(clickPosition));
                                } else
                                    caret(input, lastPosition);
                            }
                        }, 0);
                    }).bind('dblclick.inputmask', function () {
                        var input = this;
                        setTimeout(function () {
                            caret(input, 0, seekNext(getActiveMaskSet()["lastValidPosition"]));
                        }, 0);
                    }).bind(pasteEvent + ".inputmask dragdrop.inputmask drop.inputmask", function (e) {
                        if (skipInputEvent === true) {
                            skipInputEvent = false;
                            return true;
                        }
                        var input = this, $input = $(input);

                        //paste event for IE8 and lower I guess ;-)
                        if (e.type == "propertychange" && input._valueGet().length <= getMaskLength()) {
                            return true;
                        }
                        setTimeout(function () {
                            var pasteValue = opts.onBeforePaste != undefined ? opts.onBeforePaste.call(this, input._valueGet()) : input._valueGet();
                            checkVal(input, true, false, pasteValue.split(''), true);
                            if (isComplete(getActiveBuffer()) === true)
                                $input.trigger("complete");
                            $input.click();
                        }, 0);
                    }).bind('setvalue.inputmask', function () {
                        var input = this;
                        checkVal(input, true);
                        valueOnFocus = getActiveBuffer().join('');
                        if (input._valueGet() == getActiveBufferTemplate().join(''))
                            input._valueSet('');
                    }).bind('complete.inputmask', opts.oncomplete
                    ).bind('incomplete.inputmask', opts.onincomplete
                    ).bind('cleared.inputmask', opts.oncleared
                    ).bind("keyup.inputmask", keyupEvent);

                    if (androidchrome) {
                        $el.bind("input.inputmask", inputEvent);
                    } else {
                        $el.bind("keydown.inputmask", keydownEvent
                        ).bind("keypress.inputmask", keypressEvent);
                    }

                    if (msie10)
                        $el.bind("input.inputmask", inputEvent);

                    //apply mask
                    checkVal(el, true, false);
                    valueOnFocus = getActiveBuffer().join('');
                    // Wrap document.activeElement in a try/catch block since IE9 throw "Unspecified error" if document.activeElement is undefined when we are in an IFrame.
                    var activeElement;
                    try {
                        activeElement = document.activeElement;
                    } catch (e) {
                    }
                    if (activeElement === el) { //position the caret when in focus
                        $el.addClass('focus.inputmask');
                        caret(el, seekNext(getActiveMaskSet()["lastValidPosition"]));
                    } else if (opts.clearMaskOnLostFocus) {
                        if (getActiveBuffer().join('') == getActiveBufferTemplate().join('')) {
                            el._valueSet('');
                        } else {
                            clearOptionalTail(el);
                        }
                    } else {
                        writeBuffer(el, getActiveBuffer());
                    }

                    installEventRuler(el);
                }
            }

            //action object
            if (actionObj != undefined) {
                switch (actionObj["action"]) {
                    case "isComplete":
                        return isComplete(actionObj["buffer"]);
                    case "unmaskedvalue":
                        isRTL = actionObj["$input"].data('_inputmask')['isRTL'];
                        return unmaskedvalue(actionObj["$input"], actionObj["skipDatepickerCheck"]);
                    case "mask":
                        mask(actionObj["el"]);
                        break;
                    case "format":
                        $el = $({});
                        $el.data('_inputmask', {
                            'masksets': masksets,
                            'activeMasksetIndex': activeMasksetIndex,
                            'opts': opts,
                            'isRTL': opts.numericInput
                        });
                        if (opts.numericInput) {
                            opts.isNumeric = opts.numericInput;
                            isRTL = true;
                        }

                        checkVal($el, false, false, actionObj["value"].split(''), true);
                        return getActiveBuffer().join('');
                }
            }
        }
        $.inputmask = {
            //options default
            defaults: {
                placeholder: "_",
                optionalmarker: { start: "[", end: "]" },
                quantifiermarker: { start: "{", end: "}" },
                groupmarker: { start: "(", end: ")" },
                escapeChar: "\\",
                mask: null,
                oncomplete: $.noop, //executes when the mask is complete
                onincomplete: $.noop, //executes when the mask is incomplete and focus is lost
                oncleared: $.noop, //executes when the mask is cleared
                repeat: 0, //repetitions of the mask: * ~ forever, otherwise specify an integer
                greedy: true, //true: allocated buffer for the mask and repetitions - false: allocate only if needed
                autoUnmask: false, //automatically unmask when retrieving the value with $.fn.val or value if the browser supports __lookupGetter__ or getOwnPropertyDescriptor
                clearMaskOnLostFocus: true,
                insertMode: true, //insert the input or overwrite the input
                clearIncomplete: false, //clear the incomplete input on blur
                aliases: {}, //aliases definitions => see jquery.inputmask.extensions.js
                onKeyUp: $.noop, //override to implement autocomplete on certain keys for example
                onKeyDown: $.noop, //override to implement autocomplete on certain keys for example
                onBeforePaste: undefined, //executes before masking the pasted value to allow preprocessing of the pasted value.  args => pastedValue => return processedValue
                onUnMask: undefined, //executes after unmasking to allow postprocessing of the unmaskedvalue.  args => maskedValue, unmaskedValue
                showMaskOnFocus: true, //show the mask-placeholder when the input has focus
                showMaskOnHover: true, //show the mask-placeholder when hovering the empty input
                onKeyValidation: $.noop, //executes on every key-press with the result of isValid. Params: result, opts
                skipOptionalPartCharacter: " ", //a character which can be used to skip an optional part of a mask
                showTooltip: false, //show the activemask as tooltip
                numericInput: false, //numericInput input direction style (input shifts to the left while holding the caret position)
                //numeric basic properties
                isNumeric: false, //enable numeric features
                radixPoint: "", //".", // | ","
                skipRadixDance: false, //disable radixpoint caret positioning
                rightAlignNumerics: true, //align numerics to the right
                //numeric basic properties
                definitions: {
                    '9': {
                        validator: "[0-9]",
                        cardinality: 1
                    },
                    'a': {
                        validator: "[A-Za-z\u0410-\u044F\u0401\u0451]",
                        cardinality: 1
                    },
                    '*': {
                        validator: "[A-Za-z\u0410-\u044F\u0401\u04510-9]",
                        cardinality: 1
                    }
                },
                keyCode: {
                    ALT: 18, BACKSPACE: 8, CAPS_LOCK: 20, COMMA: 188, COMMAND: 91, COMMAND_LEFT: 91, COMMAND_RIGHT: 93, CONTROL: 17, DELETE: 46, DOWN: 40, END: 35, ENTER: 13, ESCAPE: 27, HOME: 36, INSERT: 45, LEFT: 37, MENU: 93, NUMPAD_ADD: 107, NUMPAD_DECIMAL: 110, NUMPAD_DIVIDE: 111, NUMPAD_ENTER: 108,
                    NUMPAD_MULTIPLY: 106, NUMPAD_SUBTRACT: 109, PAGE_DOWN: 34, PAGE_UP: 33, PERIOD: 190, RIGHT: 39, SHIFT: 16, SPACE: 32, TAB: 9, UP: 38, WINDOWS: 91
                },
                //specify keycodes which should not be considered in the keypress event, otherwise the preventDefault will stop their default behavior especially in FF
                ignorables: [8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123],
                getMaskLength: function (buffer, greedy, repeat, currentBuffer, opts) {
                    var calculatedLength = buffer.length;
                    if (!greedy) {
                        if (repeat == "*") {
                            calculatedLength = currentBuffer.length + 1;
                        } else if (repeat > 1) {
                            calculatedLength += (buffer.length * (repeat - 1));
                        }
                    }
                    return calculatedLength;
                }
            },
            escapeRegex: function (str) {
                var specials = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'];
                return str.replace(new RegExp('(\\' + specials.join('|\\') + ')', 'gim'), '\\$1');
            },
            format: function (value, options) {
                var opts = $.extend(true, {}, $.inputmask.defaults, options);
                resolveAlias(opts.alias, options, opts);
                return maskScope(generateMaskSets(opts), 0, opts, { "action": "format", "value": value });
            }
        };

        $.fn.inputmask = function (fn, options) {
            var opts = $.extend(true, {}, $.inputmask.defaults, options),
                masksets,
                activeMasksetIndex = 0;

            if (typeof fn === "string") {
                switch (fn) {
                    case "mask":
                        //resolve possible aliases given by options
                        resolveAlias(opts.alias, options, opts);
                        masksets = generateMaskSets(opts);
                        if (masksets.length == 0) { return this; }

                        return this.each(function () {
                            maskScope($.extend(true, {}, masksets), 0, opts, { "action": "mask", "el": this });
                        });
                    case "unmaskedvalue":
                        var $input = $(this), input = this;
                        if ($input.data('_inputmask')) {
                            masksets = $input.data('_inputmask')['masksets'];
                            activeMasksetIndex = $input.data('_inputmask')['activeMasksetIndex'];
                            opts = $input.data('_inputmask')['opts'];
                            return maskScope(masksets, activeMasksetIndex, opts, { "action": "unmaskedvalue", "$input": $input });
                        } else return $input.val();
                    case "remove":
                        return this.each(function () {
                            var $input = $(this), input = this;
                            if ($input.data('_inputmask')) {
                                masksets = $input.data('_inputmask')['masksets'];
                                activeMasksetIndex = $input.data('_inputmask')['activeMasksetIndex'];
                                opts = $input.data('_inputmask')['opts'];
                                //writeout the unmaskedvalue
                                input._valueSet(maskScope(masksets, activeMasksetIndex, opts, { "action": "unmaskedvalue", "$input": $input, "skipDatepickerCheck": true }));
                                //clear data
                                $input.removeData('_inputmask');
                                //unbind all events
                                $input.unbind(".inputmask");
                                $input.removeClass('focus.inputmask');
                                //restore the value property
                                var valueProperty;
                                if (Object.getOwnPropertyDescriptor)
                                    valueProperty = Object.getOwnPropertyDescriptor(input, "value");
                                if (valueProperty && valueProperty.get) {
                                    if (input._valueGet) {
                                        Object.defineProperty(input, "value", {
                                            get: input._valueGet,
                                            set: input._valueSet
                                        });
                                    }
                                } else if (document.__lookupGetter__ && input.__lookupGetter__("value")) {
                                    if (input._valueGet) {
                                        input.__defineGetter__("value", input._valueGet);
                                        input.__defineSetter__("value", input._valueSet);
                                    }
                                }
                                try { //try catch needed for IE7 as it does not supports deleting fns
                                    delete input._valueGet;
                                    delete input._valueSet;
                                } catch (e) {
                                    input._valueGet = undefined;
                                    input._valueSet = undefined;

                                }
                            }
                        });
                        break;
                    case "getemptymask": //return the default (empty) mask value, usefull for setting the default value in validation
                        if (this.data('_inputmask')) {
                            masksets = this.data('_inputmask')['masksets'];
                            activeMasksetIndex = this.data('_inputmask')['activeMasksetIndex'];
                            return masksets[activeMasksetIndex]['_buffer'].join('');
                        }
                        else return "";
                    case "hasMaskedValue": //check wheter the returned value is masked or not; currently only works reliable when using jquery.val fn to retrieve the value 
                        return this.data('_inputmask') ? !this.data('_inputmask')['opts'].autoUnmask : false;
                    case "isComplete":
                        masksets = this.data('_inputmask')['masksets'];
                        activeMasksetIndex = this.data('_inputmask')['activeMasksetIndex'];
                        opts = this.data('_inputmask')['opts'];
                        return maskScope(masksets, activeMasksetIndex, opts, { "action": "isComplete", "buffer": this[0]._valueGet().split('') });
                    case "getmetadata": //return mask metadata if exists
                        if (this.data('_inputmask')) {
                            masksets = this.data('_inputmask')['masksets'];
                            activeMasksetIndex = this.data('_inputmask')['activeMasksetIndex'];
                            return masksets[activeMasksetIndex]['metadata'];
                        }
                        else return undefined;
                    default:
                        //check if the fn is an alias
                        if (!resolveAlias(fn, options, opts)) {
                            //maybe fn is a mask so we try
                            //set mask
                            opts.mask = fn;
                        }
                        masksets = generateMaskSets(opts);
                        if (masksets.length == 0) { return this; }
                        return this.each(function () {
                            maskScope($.extend(true, {}, masksets), activeMasksetIndex, opts, { "action": "mask", "el": this });
                        });

                        break;
                }
            } else if (typeof fn == "object") {
                opts = $.extend(true, {}, $.inputmask.defaults, fn);

                resolveAlias(opts.alias, fn, opts); //resolve aliases
                masksets = generateMaskSets(opts);
                if (masksets.length == 0) { return this; }
                return this.each(function () {
                    maskScope($.extend(true, {}, masksets), activeMasksetIndex, opts, { "action": "mask", "el": this });
                });
            } else if (fn == undefined) {
                //look for data-inputmask atribute - the attribute should only contain optipns
                return this.each(function () {
                    var attrOptions = $(this).attr("data-inputmask");
                    if (attrOptions && attrOptions != "") {
                        try {
                            attrOptions = attrOptions.replace(new RegExp("'", "g"), '"');
                            var dataoptions = $.parseJSON("{" + attrOptions + "}");
                            $.extend(true, dataoptions, options);
                            opts = $.extend(true, {}, $.inputmask.defaults, dataoptions);
                            resolveAlias(opts.alias, dataoptions, opts);
                            opts.alias = undefined;
                            $(this).inputmask(opts);
                        } catch (ex) { } //need a more relax parseJSON
                    }
                });
            }
        };
    }
})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5pbnB1dG1hc2suanMiXSwibmFtZXMiOlsiJCIsImlzSW5wdXRFdmVudFN1cHBvcnRlZCIsImV2ZW50TmFtZSIsImVsIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiaXNTdXBwb3J0ZWQiLCJzZXRBdHRyaWJ1dGUiLCJyZXNvbHZlQWxpYXMiLCJhbGlhc1N0ciIsIm9wdGlvbnMiLCJvcHRzIiwiYWxpYXNEZWZpbml0aW9uIiwiYWxpYXNlcyIsImFsaWFzIiwidW5kZWZpbmVkIiwiZXh0ZW5kIiwiZ2VuZXJhdGVNYXNrU2V0cyIsImdldE1hc2tUZW1wbGF0ZSIsIm1hc2siLCJudW1lcmljSW5wdXQiLCJzcGxpdCIsInJldmVyc2UiLCJqb2luIiwiZXNjYXBlZCIsIm91dENvdW50IiwiZ3JlZWR5IiwicmVwZWF0IiwibGVuZ3RoIiwicGxhY2Vob2xkZXIiLCJzaW5nbGVNYXNrIiwibWFwIiwiZWxlbWVudCIsImluZGV4Iiwib3V0RWxlbSIsImVzY2FwZUNoYXIiLCJvcHRpb25hbG1hcmtlciIsInN0YXJ0IiwiZW5kIiwibWFza2RlZiIsImRlZmluaXRpb25zIiwiaSIsImNhcmRpbmFsaXR5IiwicHVzaCIsImNoYXJBdCIsInJlcGVhdGVkTWFzayIsInNsaWNlIiwiY29uY2F0IiwiZ2V0VGVzdGluZ0NoYWluIiwiaXNPcHRpb25hbCIsIm5ld0Jsb2NrTWFya2VyIiwicHJldmFsaWRhdG9ycyIsInByZXZhbGlkYXRvcnNMIiwicHJldmFsaWRhdG9yIiwidmFsaWRhdG9yIiwiZm4iLCJSZWdFeHAiLCJ0aGlzIiwidGVzdCIsIm9wdGlvbmFsaXR5Iiwib2Zmc2V0IiwiY2FzaW5nIiwiZGVmIiwibWFya09wdGlvbmFsIiwibWFza1BhcnQiLCJzcGxpdEZpcnN0T3B0aW9uYWxFbmRQYXJ0Iiwib3B0aW9uYWxTdGFydE1hcmtlcnMiLCJvcHRpb25hbEVuZE1hcmtlcnMiLCJtcGwiLCJtYXNrUGFydHMiLCJzdWJzdHJpbmciLCJzcGxpdEZpcnN0T3B0aW9uYWxTdGFydFBhcnQiLCJnZW5lcmF0ZU1hc2siLCJtYXNrUHJlZml4IiwibWV0YWRhdGEiLCJuZXdNYXNrIiwibWFza1RlbXBsYXRlIiwibWFza3MiLCJpbkFycmF5IiwiZ2VubWFza3MiLCJtcyIsIl9idWZmZXIiLCJidWZmZXIiLCJ0ZXN0cyIsImxhc3RWYWxpZFBvc2l0aW9uIiwiaXNGdW5jdGlvbiIsImNhbGwiLCJpc0FycmF5IiwiZWFjaCIsIm5keCIsIm1zayIsInRvU3RyaW5nIiwic29ydCIsImEiLCJiIiwibWFza1Njb3BlIiwibWFza3NldHMiLCJhY3RpdmVNYXNrc2V0SW5kZXgiLCJhY3Rpb25PYmoiLCJnZXRBY3RpdmVNYXNrU2V0IiwiZ2V0QWN0aXZlVGVzdHMiLCJnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSIsImdldEFjdGl2ZUJ1ZmZlciIsImlzVmFsaWQiLCJwb3MiLCJjIiwic3RyaWN0IiwiX2lzVmFsaWQiLCJwb3NpdGlvbiIsImFjdGl2ZU1hc2tzZXQiLCJ0ZXN0UG9zIiwiZGV0ZXJtaW5lVGVzdFBvc2l0aW9uIiwibG9vcGVuZCIsImNocnMiLCJnZXRCdWZmZXJFbGVtZW50Iiwic2tpcE9wdGlvbmFsUGFydENoYXJhY3RlciIsInJlZnJlc2giLCJQb3N0UHJvY2Vzc1Jlc3VsdHMiLCJtYXNrRm9yd2FyZHMiLCJyZXN1bHRzIiwiaGFzVmFsaWRBY3R1YWwiLCJyc2x0IiwiYWN0dWFsTFZQIiwicnNsdFZhbGlkIiwibG93ZXN0UG9zIiwibG93ZXN0SW5kZXgiLCJzZXRCdWZmZXJFbGVtZW50IiwicmVzdWx0IiwiY3VycmVudEFjdGl2ZU1hc2tzZXRJbmRleCIsImFjdHVhbEJ1ZmZlciIsInNlZWtQcmV2aW91cyIsInZhbHVlIiwibWFza1BvcyIsImx2cCIsIm5ld1ZhbGlkUG9zaXRpb24iLCJpc01hc2siLCJtYXhGb3J3YXJkIiwic2Vla05leHQiLCJmdyIsImdldE1hc2tMZW5ndGgiLCJkZXRlcm1pbmVBY3RpdmVNYXNrc2V0SW5kZXgiLCJjdXJyZW50TWFza3NldEluZGV4IiwiaGlnaGVzdFZhbGlkIiwibmV4dCIsImNsZWFyQnVmZmVyIiwiJGVsIiwiZGF0YSIsIm1hc2tMIiwiYXV0b1ByZXBhcmUiLCJwcmVwYXJlQnVmZmVyIiwiZWxlbSIsInRvVXBwZXJDYXNlIiwidG9Mb3dlckNhc2UiLCJqIiwid3JpdGVCdWZmZXIiLCJpbnB1dCIsImNhcmV0UG9zIiwiX3ZhbHVlU2V0IiwiY2FyZXQiLCJzdHJpcE5vbWFza3MiLCJzZXRSZVRhcmdldFBsYWNlSG9sZGVyIiwiZ2V0UGxhY2VIb2xkZXIiLCJjaGVja1ZhbCIsIndyaXRlT3V0IiwibnB0dmwiLCJpbnRlbGxpQ2hlY2siLCJpbnB1dFZhbHVlIiwidHJ1bmNhdGVJbnB1dCIsIl92YWx1ZUdldCIsImNoYXJDb2RlIiwicCIsImtleXByZXNzRXZlbnQiLCJjaGFyQ29kZUF0IiwiZXNjYXBlUmVnZXgiLCJzdHIiLCJpbnB1dG1hc2siLCJyZXBsYWNlIiwiY2xlYXJPcHRpb25hbFRhaWwiLCJ0bXBCdWZmZXIiLCJwb3AiLCJ1bm1hc2tlZHZhbHVlIiwiJGlucHV0Iiwic2tpcERhdGVwaWNrZXJDaGVjayIsImhhc0NsYXNzIiwidW1WYWx1ZSIsInVubWFza2VkVmFsdWUiLCJpc1JUTCIsIm9uVW5NYXNrIiwiVHJhbnNsYXRlUG9zaXRpb24iLCJiZmZyTGdodCIsImJlZ2luIiwicmFuZ2UiLCJucHQiLCJqcXVlcnkiLCJpcyIsInNldFNlbGVjdGlvblJhbmdlIiwic2VsZWN0aW9uU3RhcnQiLCJzZWxlY3Rpb25FbmQiLCJzZWxlY3Rpb24iLCJjcmVhdGVSYW5nZSIsImR1cGxpY2F0ZSIsIm1vdmVTdGFydCIsInRleHQiLCJzY3JvbGxMZWZ0Iiwic2Nyb2xsV2lkdGgiLCJpbnNlcnRNb2RlIiwiYW5kcm9pZCIsImNyZWF0ZVRleHRSYW5nZSIsImNvbGxhcHNlIiwibW92ZUVuZCIsInNlbGVjdCIsImlzQ29tcGxldGUiLCJjb21wbGV0ZSIsImhpZ2hlc3RWYWxpZFBvc2l0aW9uIiwiYW1sIiwibXNDb21wbGV0ZSIsImlzU2VsZWN0aW9uIiwiaW5zdGFsbEV2ZW50UnVsZXIiLCJldmVudHMiLCJfZGF0YSIsImV2ZW50VHlwZSIsImV2ZW50SGFuZGxlcnMiLCJldmVudEhhbmRsZXIiLCJuYW1lc3BhY2UiLCJ0eXBlIiwiaGFuZGxlciIsImUiLCJyZWFkT25seSIsImRpc2FibGVkIiwicHJldmVudERlZmF1bHQiLCJhcHBseSIsImFyZ3VtZW50cyIsInBhdGNoVmFsdWVQcm9wZXJ0eSIsInZhbHVlUHJvcGVydHkiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJnZXQiLCJ2YWx1ZUdldCIsInZhbHVlU2V0Iiwic2V0IiwiZGVmaW5lUHJvcGVydHkiLCIkc2VsZiIsImlucHV0RGF0YSIsImF1dG9Vbm1hc2siLCJ0cmlnZ2VySGFuZGxlciIsIl9fbG9va3VwR2V0dGVyX18iLCJfX2xvb2t1cFNldHRlcl9fIiwiX19kZWZpbmVHZXR0ZXJfXyIsIl9fZGVmaW5lU2V0dGVyX18iLCJ2YWxIb29rcyIsImlucHV0bWFza3BhdGNoIiwialF1ZXJ5IiwiJGVsZW0iLCJzaGlmdEwiLCJtYXNrSnVtcHMiLCJ0cmJ1ZmZlciIsImJsIiwic2hpZnRSIiwidCIsImxlbmd0aEJlZm9yZSIsIkhhbmRsZVJlbW92ZSIsImsiLCJrZXlDb2RlIiwiQkFDS1NQQUNFIiwiREVMRVRFIiwicGVuZCIsInBvc0JlZ2luIiwiaXNOdW1lcmljIiwicmFkaXhQb2ludCIsIm1sIiwibmV3cG9zIiwiZmlyc3RNYXNrUG9zIiwia2V5ZG93bkV2ZW50Iiwic2tpcEtleVByZXNzRXZlbnQiLCJpcGhvbmUiLCJjdHJsS2V5IiwidmFsdWVPbkZvY3VzIiwidHJpZ2dlciIsInNob3dUb29sdGlwIiwicHJvcCIsIkVORCIsIlBBR0VfRE9XTiIsInNldFRpbWVvdXQiLCJzaGlmdEtleSIsIkhPTUUiLCJQQUdFX1VQIiwiRVNDQVBFIiwiY2xpY2siLCJJTlNFUlQiLCJSSUdIVCIsIkxFRlQiLCJjdXJyZW50Q2FyZXRQb3MiLCJvbktleURvd24iLCJpZ25vcmFibGUiLCJpZ25vcmFibGVzIiwiY2hlY2t2YWwiLCJ3aW5kb3ciLCJldmVudCIsIndoaWNoIiwiYWx0S2V5IiwibWV0YUtleSIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsInBjYXJldCIsImlzU2xjdG4iLCJpbml0aWFsSW5kZXgiLCJsbW50IiwicmFkaXhQb3NpdGlvbiIsImluZGV4T2YiLCJtaW5pbWFsRm9yd2FyZFBvc2l0aW9uIiwibnAiLCJsYXN0VW5tYXNrZWRQb3NpdGlvbiIsImJmckNsb25lIiwibmx2cCIsIm5leHRQb3MiLCJzZWxmIiwib25LZXlWYWxpZGF0aW9uIiwibmV3Q2FyZXRQb3NpdGlvbiIsInNraXBJbnB1dEV2ZW50IiwicmV0dXJuVmFsdWUiLCJrZXl1cEV2ZW50IiwiYW5kcm9pZGNocm9tZSIsImNocm9tZVZhbHVlT25JbnB1dCIsIm9uS2V5VXAiLCJUQUIiLCJzaG93TWFza09uRm9jdXMiLCJpbnB1dEV2ZW50IiwiYXR0ciIsIm1heExlbmd0aCIsIk1hdGgiLCJyb3VuZCIsImRpciIsInJpZ2h0QWxpZ25OdW1lcmljcyIsImNzcyIsInJlbW92ZUF0dHIiLCJ1bmJpbmQiLCJyZW1vdmVDbGFzcyIsImNsb3Nlc3QiLCJiaW5kIiwiY2hhbmdlIiwic2hvd01hc2tPbkhvdmVyIiwibnB0VmFsdWUiLCJjbGVhck1hc2tPbkxvc3RGb2N1cyIsImNsZWFySW5jb21wbGV0ZSIsImFkZENsYXNzIiwic2VsZWN0ZWRDYXJldCIsImxhc3RQb3NpdGlvbiIsImNsaWNrUG9zaXRpb24iLCJza2lwUmFkaXhEYW5jZSIsInBhc3RlRXZlbnQiLCJwYXN0ZVZhbHVlIiwib25CZWZvcmVQYXN0ZSIsIm9uY29tcGxldGUiLCJvbmluY29tcGxldGUiLCJvbmNsZWFyZWQiLCJtc2llMTAiLCJhY3RpdmVFbGVtZW50IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibWF0Y2giLCJkZWZhdWx0cyIsInF1YW50aWZpZXJtYXJrZXIiLCJncm91cG1hcmtlciIsIm5vb3AiLCI5IiwiKiIsIkFMVCIsIkNBUFNfTE9DSyIsIkNPTU1BIiwiQ09NTUFORCIsIkNPTU1BTkRfTEVGVCIsIkNPTU1BTkRfUklHSFQiLCJDT05UUk9MIiwiRE9XTiIsIkVOVEVSIiwiTUVOVSIsIk5VTVBBRF9BREQiLCJOVU1QQURfREVDSU1BTCIsIk5VTVBBRF9ESVZJREUiLCJOVU1QQURfRU5URVIiLCJOVU1QQURfTVVMVElQTFkiLCJOVU1QQURfU1VCVFJBQ1QiLCJQRVJJT0QiLCJTSElGVCIsIlNQQUNFIiwiVVAiLCJXSU5ET1dTIiwiY3VycmVudEJ1ZmZlciIsImNhbGN1bGF0ZWRMZW5ndGgiLCJzcGVjaWFscyIsImZvcm1hdCIsImFjdGlvbiIsInZhbCIsInJlbW92ZURhdGEiLCJhdHRyT3B0aW9ucyIsImRhdGFvcHRpb25zIiwicGFyc2VKU09OIiwiZXgiXSwibWFwcGluZ3MiOiJDQVFBLFNBQVdBLEdBR0gsUUFBU0MsR0FBc0JDLEdBQzNCLEdBQUlDLEdBQUtDLFNBQVNDLGNBQWMsU0FDaENILEVBQVksS0FBT0EsRUFDbkJJLEVBQWVKLElBQWFDLEVBTTVCLE9BTEtHLEtBQ0RILEVBQUdJLGFBQWFMLEVBQVcsV0FDM0JJLEVBQXNDLGtCQUFqQkgsR0FBR0QsSUFFNUJDLEVBQUssS0FDRUcsRUFFWCxRQUFTRSxHQUFhQyxFQUFVQyxFQUFTQyxHQUNyQyxHQUFJQyxHQUFrQkQsRUFBS0UsUUFBUUosRUFDbkMsU0FBSUcsSUFDSUEsRUFBZ0JFLE9BQU9OLEVBQWFJLEVBQWdCRSxNQUFPQyxPQUFXSixHQUMxRVgsRUFBRWdCLFFBQU8sRUFBTUwsRUFBTUMsR0FDckJaLEVBQUVnQixRQUFPLEVBQU1MLEVBQU1ELElBQ2QsR0FJZixRQUFTTyxHQUFpQk4sR0FHdEIsUUFBU08sR0FBZ0JDLEdBQ2pCUixFQUFLUyxlQUNMRCxFQUFPQSxFQUFLRSxNQUFNLElBQUlDLFVBQVVDLEtBQUssSUFFekMsSUFBSUMsSUFBVSxFQUFPQyxFQUFXLEVBQUdDLEVBQVNmLEVBQUtlLE9BQVFDLEVBQVNoQixFQUFLZ0IsTUFDekQsTUFBVkEsSUFBZUQsR0FBUyxH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LE9BQ2JmLEVBQUV5RCxNQUFNc0gsVUFBVXBLLEdBQ3BCLE1BQU9rWSxXQU05QmxKIiwiZmlsZSI6ImpxdWVyeS5pbnB1dG1hc2stZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2UgSW5wdXQgTWFzayBwbHVnaW4gZm9yIGpxdWVyeVxuKiBodHRwOi8vZ2l0aHViLmNvbS9Sb2JpbkhlcmJvdHMvanF1ZXJ5LmlucHV0bWFza1xuKiBDb3B5cmlnaHQgKGMpIDIwMTAgLSAyMDE0IFJvYmluIEhlcmJvdHNcbiogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIChodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocClcbiogVmVyc2lvbjogMC4wLjBcbiovXG5cbihmdW5jdGlvbiAoJCkge1xuICAgIGlmICgkLmZuLmlucHV0bWFzayA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vaGVscGVyIGZ1bmN0aW9ucyAgICBcbiAgICAgICAgZnVuY3Rpb24gaXNJbnB1dEV2ZW50U3VwcG9ydGVkKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSxcbiAgICAgICAgICAgIGV2ZW50TmFtZSA9ICdvbicgKyBldmVudE5hbWUsXG4gICAgICAgICAgICBpc1N1cHBvcnRlZCA9IChldmVudE5hbWUgaW4gZWwpO1xuICAgICAgICAgICAgaWYgKCFpc1N1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShldmVudE5hbWUsICdyZXR1cm47Jyk7XG4gICAgICAgICAgICAgICAgaXNTdXBwb3J0ZWQgPSB0eXBlb2YgZWxbZXZlbnROYW1lXSA9PSAnZnVuY3Rpb24nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIGlzU3VwcG9ydGVkO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlc29sdmVBbGlhcyhhbGlhc1N0ciwgb3B0aW9ucywgb3B0cykge1xuICAgICAgICAgICAgdmFyIGFsaWFzRGVmaW5pdGlvbiA9IG9wdHMuYWxpYXNlc1thbGlhc1N0cl07XG4gICAgICAgICAgICBpZiAoYWxpYXNEZWZpbml0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFsaWFzRGVmaW5pdGlvbi5hbGlhcykgcmVzb2x2ZUFsaWFzKGFsaWFzRGVmaW5pdGlvbi5hbGlhcywgdW5kZWZpbmVkLCBvcHRzKTsgLy9hbGlhcyBpcyBhbm90aGVyIGFsaWFzXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0cywgYWxpYXNEZWZpbml0aW9uKTsgIC8vbWVyZ2UgYWxpYXMgZGVmaW5pdGlvbiBpbiB0aGUgb3B0aW9uc1xuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdHMsIG9wdGlvbnMpOyAgLy9yZWFwcGx5IGV4dHJhIGdpdmVuIG9wdGlvbnNcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZU1hc2tTZXRzKG9wdHMpIHtcbiAgICAgICAgICAgIHZhciBtcyA9IFtdO1xuICAgICAgICAgICAgdmFyIGdlbm1hc2tzID0gW107IC8vdXNlZCB0byBrZWVwIHRyYWNrIG9mIHRoZSBtYXNrcyB0aGF0IHdoZXJlIHByb2Nlc3NlZCwgdG8gYXZvaWQgZHVwbGljYXRlc1xuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TWFza1RlbXBsYXRlKG1hc2spIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5udW1lcmljSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFzayA9IG1hc2suc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGVzY2FwZWQgPSBmYWxzZSwgb3V0Q291bnQgPSAwLCBncmVlZHkgPSBvcHRzLmdyZWVkeSwgcmVwZWF0ID0gb3B0cy5yZXBlYXQ7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGVhdCA9PSBcIipcIikgZ3JlZWR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy9pZiAoZ3JlZWR5ID09IHRydWUgJiYgb3B0cy5wbGFjZWhvbGRlciA9PSBcIlwiKSBvcHRzLnBsYWNlaG9sZGVyID0gXCIgXCI7XG4gICAgICAgICAgICAgICAgaWYgKG1hc2subGVuZ3RoID09IDEgJiYgZ3JlZWR5ID09IGZhbHNlICYmIHJlcGVhdCAhPSAwKSB7IG9wdHMucGxhY2Vob2xkZXIgPSBcIlwiOyB9IC8vaGlkZSBwbGFjZWhvbGRlciB3aXRoIHNpbmdsZSBub24tZ3JlZWR5IG1hc2tcbiAgICAgICAgICAgICAgICB2YXIgc2luZ2xlTWFzayA9ICQubWFwKG1hc2suc3BsaXQoXCJcIiksIGZ1bmN0aW9uIChlbGVtZW50LCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3V0RWxlbSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PSBvcHRzLmVzY2FwZUNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKChlbGVtZW50ICE9IG9wdHMub3B0aW9uYWxtYXJrZXIuc3RhcnQgJiYgZWxlbWVudCAhPSBvcHRzLm9wdGlvbmFsbWFya2VyLmVuZCkgfHwgZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hc2tkZWYgPSBvcHRzLmRlZmluaXRpb25zW2VsZW1lbnRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hc2tkZWYgJiYgIWVzY2FwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hc2tkZWYuY2FyZGluYWxpdHk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRFbGVtLnB1c2gob3B0cy5wbGFjZWhvbGRlci5jaGFyQXQoKG91dENvdW50ICsgaSkgJSBvcHRzLnBsYWNlaG9sZGVyLmxlbmd0aCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0RWxlbS5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dENvdW50ICs9IG91dEVsZW0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dEVsZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vYWxsb2NhdGUgcmVwZXRpdGlvbnNcbiAgICAgICAgICAgICAgICB2YXIgcmVwZWF0ZWRNYXNrID0gc2luZ2xlTWFzay5zbGljZSgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcmVwZWF0ICYmIGdyZWVkeTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGVhdGVkTWFzayA9IHJlcGVhdGVkTWFzay5jb25jYXQoc2luZ2xlTWFzay5zbGljZSgpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4geyBcIm1hc2tcIjogcmVwZWF0ZWRNYXNrLCBcInJlcGVhdFwiOiByZXBlYXQsIFwiZ3JlZWR5XCI6IGdyZWVkeSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy90ZXN0IGRlZmluaXRpb24gPT4ge2ZuOiBSZWdFeHAvZnVuY3Rpb24sIGNhcmRpbmFsaXR5OiBpbnQsIG9wdGlvbmFsaXR5OiBib29sLCBuZXdCbG9ja01hcmtlcjogYm9vbCwgb2Zmc2V0OiBpbnQsIGNhc2luZzogbnVsbC91cHBlci9sb3dlciwgZGVmOiBkZWZpbml0aW9uU3ltYm9sfVxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0VGVzdGluZ0NoYWluKG1hc2spIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5udW1lcmljSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFzayA9IG1hc2suc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGlzT3B0aW9uYWwgPSBmYWxzZSwgZXNjYXBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBuZXdCbG9ja01hcmtlciA9IGZhbHNlOyAvL2luZGljYXRlcyB3aGV0ZXIgdGhlIGJlZ2luL2VuZGluZyBvZiBhIGJsb2NrIHNob3VsZCBiZSBpbmRpY2F0ZWRcblxuICAgICAgICAgICAgICAgIHJldHVybiAkLm1hcChtYXNrLnNwbGl0KFwiXCIpLCBmdW5jdGlvbiAoZWxlbWVudCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG91dEVsZW0gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PSBvcHRzLmVzY2FwZUNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQgPT0gb3B0cy5vcHRpb25hbG1hcmtlci5zdGFydCAmJiAhZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNPcHRpb25hbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCbG9ja01hcmtlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZWxlbWVudCA9PSBvcHRzLm9wdGlvbmFsbWFya2VyLmVuZCAmJiAhZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNPcHRpb25hbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3QmxvY2tNYXJrZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hc2tkZWYgPSBvcHRzLmRlZmluaXRpb25zW2VsZW1lbnRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hc2tkZWYgJiYgIWVzY2FwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmFsaWRhdG9ycyA9IG1hc2tkZWZbXCJwcmV2YWxpZGF0b3JcIl0sIHByZXZhbGlkYXRvcnNMID0gcHJldmFsaWRhdG9ycyA/IHByZXZhbGlkYXRvcnMubGVuZ3RoIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG1hc2tkZWYuY2FyZGluYWxpdHk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmFsaWRhdG9yID0gcHJldmFsaWRhdG9yc0wgPj0gaSA/IHByZXZhbGlkYXRvcnNbaSAtIDFdIDogW10sIHZhbGlkYXRvciA9IHByZXZhbGlkYXRvcltcInZhbGlkYXRvclwiXSwgY2FyZGluYWxpdHkgPSBwcmV2YWxpZGF0b3JbXCJjYXJkaW5hbGl0eVwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0RWxlbS5wdXNoKHsgZm46IHZhbGlkYXRvciA/IHR5cGVvZiB2YWxpZGF0b3IgPT0gJ3N0cmluZycgPyBuZXcgUmVnRXhwKHZhbGlkYXRvcikgOiBuZXcgZnVuY3Rpb24gKCkgeyB0aGlzLnRlc3QgPSB2YWxpZGF0b3I7IH0gOiBuZXcgUmVnRXhwKFwiLlwiKSwgY2FyZGluYWxpdHk6IGNhcmRpbmFsaXR5ID8gY2FyZGluYWxpdHkgOiAxLCBvcHRpb25hbGl0eTogaXNPcHRpb25hbCwgbmV3QmxvY2tNYXJrZXI6IGlzT3B0aW9uYWwgPT0gdHJ1ZSA/IG5ld0Jsb2NrTWFya2VyIDogZmFsc2UsIG9mZnNldDogMCwgY2FzaW5nOiBtYXNrZGVmW1wiY2FzaW5nXCJdLCBkZWY6IG1hc2tkZWZbXCJkZWZpbml0aW9uU3ltYm9sXCJdIHx8IGVsZW1lbnQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc09wdGlvbmFsID09IHRydWUpIC8vcmVzZXQgbmV3QmxvY2tNYXJrZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dEVsZW0ucHVzaCh7IGZuOiBtYXNrZGVmLnZhbGlkYXRvciA/IHR5cGVvZiBtYXNrZGVmLnZhbGlkYXRvciA9PSAnc3RyaW5nJyA/IG5ldyBSZWdFeHAobWFza2RlZi52YWxpZGF0b3IpIDogbmV3IGZ1bmN0aW9uICgpIHsgdGhpcy50ZXN0ID0gbWFza2RlZi52YWxpZGF0b3I7IH0gOiBuZXcgUmVnRXhwKFwiLlwiKSwgY2FyZGluYWxpdHk6IG1hc2tkZWYuY2FyZGluYWxpdHksIG9wdGlvbmFsaXR5OiBpc09wdGlvbmFsLCBuZXdCbG9ja01hcmtlcjogbmV3QmxvY2tNYXJrZXIsIG9mZnNldDogMCwgY2FzaW5nOiBtYXNrZGVmW1wiY2FzaW5nXCJdLCBkZWY6IG1hc2tkZWZbXCJkZWZpbml0aW9uU3ltYm9sXCJdIHx8IGVsZW1lbnQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dEVsZW0ucHVzaCh7IGZuOiBudWxsLCBjYXJkaW5hbGl0eTogMCwgb3B0aW9uYWxpdHk6IGlzT3B0aW9uYWwsIG5ld0Jsb2NrTWFya2VyOiBuZXdCbG9ja01hcmtlciwgb2Zmc2V0OiAwLCBjYXNpbmc6IG51bGwsIGRlZjogZWxlbWVudCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc2NhcGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3Jlc2V0IG5ld0Jsb2NrTWFya2VyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCbG9ja01hcmtlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dEVsZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIG1hcmtPcHRpb25hbChtYXNrUGFydCkgeyAvL25lZWRlZCBmb3IgdGhlIGNsZWFyT3B0aW9uYWxUYWlsIGZ1bmN0aW9uYWxpdHlcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5vcHRpb25hbG1hcmtlci5zdGFydCArIG1hc2tQYXJ0ICsgb3B0cy5vcHRpb25hbG1hcmtlci5lbmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBzcGxpdEZpcnN0T3B0aW9uYWxFbmRQYXJ0KG1hc2tQYXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbmFsU3RhcnRNYXJrZXJzID0gMCwgb3B0aW9uYWxFbmRNYXJrZXJzID0gMCwgbXBsID0gbWFza1BhcnQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hc2tQYXJ0LmNoYXJBdChpKSA9PSBvcHRzLm9wdGlvbmFsbWFya2VyLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbFN0YXJ0TWFya2VycysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXNrUGFydC5jaGFyQXQoaSkgPT0gb3B0cy5vcHRpb25hbG1hcmtlci5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsRW5kTWFya2VycysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25hbFN0YXJ0TWFya2VycyA+IDAgJiYgb3B0aW9uYWxTdGFydE1hcmtlcnMgPT0gb3B0aW9uYWxFbmRNYXJrZXJzKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBtYXNrUGFydHMgPSBbbWFza1BhcnQuc3Vic3RyaW5nKDAsIGkpXTtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IG1wbCkge1xuICAgICAgICAgICAgICAgICAgICBtYXNrUGFydHMucHVzaChtYXNrUGFydC5zdWJzdHJpbmcoaSArIDEsIG1wbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbWFza1BhcnRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gc3BsaXRGaXJzdE9wdGlvbmFsU3RhcnRQYXJ0KG1hc2tQYXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1wbCA9IG1hc2tQYXJ0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1wbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXNrUGFydC5jaGFyQXQoaSkgPT0gb3B0cy5vcHRpb25hbG1hcmtlci5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG1hc2tQYXJ0cyA9IFttYXNrUGFydC5zdWJzdHJpbmcoMCwgaSldO1xuICAgICAgICAgICAgICAgIGlmIChpIDwgbXBsKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hc2tQYXJ0cy5wdXNoKG1hc2tQYXJ0LnN1YnN0cmluZyhpICsgMSwgbXBsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBtYXNrUGFydHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZU1hc2sobWFza1ByZWZpeCwgbWFza1BhcnQsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hc2tQYXJ0cyA9IHNwbGl0Rmlyc3RPcHRpb25hbEVuZFBhcnQobWFza1BhcnQpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdNYXNrLCBtYXNrVGVtcGxhdGU7XG5cbiAgICAgICAgICAgICAgICB2YXIgbWFza3MgPSBzcGxpdEZpcnN0T3B0aW9uYWxTdGFydFBhcnQobWFza1BhcnRzWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAobWFza3MubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdNYXNrID0gbWFza1ByZWZpeCArIG1hc2tzWzBdICsgbWFya09wdGlvbmFsKG1hc2tzWzFdKSArIChtYXNrUGFydHMubGVuZ3RoID4gMSA/IG1hc2tQYXJ0c1sxXSA6IFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pbkFycmF5KG5ld01hc2ssIGdlbm1hc2tzKSA9PSAtMSAmJiBuZXdNYXNrICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbm1hc2tzLnB1c2gobmV3TWFzayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrVGVtcGxhdGUgPSBnZXRNYXNrVGVtcGxhdGUobmV3TWFzayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1hc2tcIjogbmV3TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIl9idWZmZXJcIjogbWFza1RlbXBsYXRlW1wibWFza1wiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImJ1ZmZlclwiOiBtYXNrVGVtcGxhdGVbXCJtYXNrXCJdLnNsaWNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXN0c1wiOiBnZXRUZXN0aW5nQ2hhaW4obmV3TWFzayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsYXN0VmFsaWRQb3NpdGlvblwiOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdyZWVkeVwiOiBtYXNrVGVtcGxhdGVbXCJncmVlZHlcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXBlYXRcIjogbWFza1RlbXBsYXRlW1wicmVwZWF0XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibWV0YWRhdGFcIjogbWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5ld01hc2sgPSBtYXNrUHJlZml4ICsgbWFza3NbMF0gKyAobWFza1BhcnRzLmxlbmd0aCA+IDEgPyBtYXNrUGFydHNbMV0gOiBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaW5BcnJheShuZXdNYXNrLCBnZW5tYXNrcykgPT0gLTEgJiYgbmV3TWFzayAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5tYXNrcy5wdXNoKG5ld01hc2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFza1RlbXBsYXRlID0gZ2V0TWFza1RlbXBsYXRlKG5ld01hc2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtYXNrXCI6IG5ld01hc2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJfYnVmZmVyXCI6IG1hc2tUZW1wbGF0ZVtcIm1hc2tcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJidWZmZXJcIjogbWFza1RlbXBsYXRlW1wibWFza1wiXS5zbGljZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGVzdHNcIjogZ2V0VGVzdGluZ0NoYWluKG5ld01hc2spLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGFzdFZhbGlkUG9zaXRpb25cIjogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJncmVlZHlcIjogbWFza1RlbXBsYXRlW1wiZ3JlZWR5XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVwZWF0XCI6IG1hc2tUZW1wbGF0ZVtcInJlcGVhdFwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1ldGFkYXRhXCI6IG1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3BsaXRGaXJzdE9wdGlvbmFsU3RhcnRQYXJ0KG1hc2tzWzFdKS5sZW5ndGggPiAxKSB7IC8vb3B0aW9uYWwgY29udGFpbnMgYW5vdGhlciBvcHRpb25hbFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVNYXNrKG1hc2tQcmVmaXggKyBtYXNrc1swXSwgbWFza3NbMV0gKyBtYXNrUGFydHNbMV0sIG1ldGFkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobWFza1BhcnRzLmxlbmd0aCA+IDEgJiYgc3BsaXRGaXJzdE9wdGlvbmFsU3RhcnRQYXJ0KG1hc2tQYXJ0c1sxXSkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVNYXNrKG1hc2tQcmVmaXggKyBtYXNrc1swXSArIG1hcmtPcHRpb25hbChtYXNrc1sxXSksIG1hc2tQYXJ0c1sxXSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVNYXNrKG1hc2tQcmVmaXggKyBtYXNrc1swXSwgbWFza1BhcnRzWzFdLCBtZXRhZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld01hc2sgPSBtYXNrUHJlZml4ICsgbWFza1BhcnRzO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJC5pbkFycmF5KG5ld01hc2ssIGdlbm1hc2tzKSA9PSAtMSAmJiBuZXdNYXNrICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbm1hc2tzLnB1c2gobmV3TWFzayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrVGVtcGxhdGUgPSBnZXRNYXNrVGVtcGxhdGUobmV3TWFzayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1hc2tcIjogbmV3TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIl9idWZmZXJcIjogbWFza1RlbXBsYXRlW1wibWFza1wiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImJ1ZmZlclwiOiBtYXNrVGVtcGxhdGVbXCJtYXNrXCJdLnNsaWNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXN0c1wiOiBnZXRUZXN0aW5nQ2hhaW4obmV3TWFzayksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsYXN0VmFsaWRQb3NpdGlvblwiOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdyZWVkeVwiOiBtYXNrVGVtcGxhdGVbXCJncmVlZHlcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXBlYXRcIjogbWFza1RlbXBsYXRlW1wicmVwZWF0XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibWV0YWRhdGFcIjogbWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0cy5tYXNrKSkgeyAvL2FsbG93IG1hc2sgdG8gYmUgYSBwcmVwcm9jZXNzaW5nIGZuIC0gc2hvdWxkIHJldHVybiBhIHZhbGlkIG1hc2tcbiAgICAgICAgICAgICAgICBvcHRzLm1hc2sgPSBvcHRzLm1hc2suY2FsbCh0aGlzLCBvcHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkob3B0cy5tYXNrKSkge1xuICAgICAgICAgICAgICAgICQuZWFjaChvcHRzLm1hc2ssIGZ1bmN0aW9uIChuZHgsIG1zaykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobXNrW1wibWFza1wiXSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlTWFzayhcIlwiLCBtc2tbXCJtYXNrXCJdLnRvU3RyaW5nKCksIG1zayk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVNYXNrKFwiXCIsIG1zay50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBnZW5lcmF0ZU1hc2soXCJcIiwgb3B0cy5tYXNrLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgICAgICByZXR1cm4gb3B0cy5ncmVlZHkgPyBtcyA6IG1zLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGFbXCJtYXNrXCJdLmxlbmd0aCAtIGJbXCJtYXNrXCJdLmxlbmd0aDsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbXNpZTEwID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChuZXcgUmVnRXhwKFwibXNpZSAxMFwiLCBcImlcIikpICE9PSBudWxsLFxuICAgICAgICAgICAgaXBob25lID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChuZXcgUmVnRXhwKFwiaXBob25lXCIsIFwiaVwiKSkgIT09IG51bGwsXG4gICAgICAgICAgICBhbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChuZXcgUmVnRXhwKFwiYW5kcm9pZC4qc2FmYXJpLipcIiwgXCJpXCIpKSAhPT0gbnVsbCxcbiAgICAgICAgICAgIGFuZHJvaWRjaHJvbWUgPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKG5ldyBSZWdFeHAoXCJhbmRyb2lkLipjaHJvbWUuKlwiLCBcImlcIikpICE9PSBudWxsLFxuICAgICAgICAgICAgcGFzdGVFdmVudCA9IGlzSW5wdXRFdmVudFN1cHBvcnRlZCgncGFzdGUnKSA/ICdwYXN0ZScgOiBpc0lucHV0RXZlbnRTdXBwb3J0ZWQoJ2lucHV0JykgPyAnaW5wdXQnIDogXCJwcm9wZXJ0eWNoYW5nZVwiO1xuXG5cbiAgICAgICAgLy9tYXNraW5nIHNjb3BlXG4gICAgICAgIC8vYWN0aW9uT2JqIGRlZmluaXRpb24gc2VlIGJlbG93XG4gICAgICAgIGZ1bmN0aW9uIG1hc2tTY29wZShtYXNrc2V0cywgYWN0aXZlTWFza3NldEluZGV4LCBvcHRzLCBhY3Rpb25PYmopIHtcbiAgICAgICAgICAgIHZhciBpc1JUTCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIHZhbHVlT25Gb2N1cyA9IGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpLFxuICAgICAgICAgICAgICAgICRlbCwgY2hyb21lVmFsdWVPbklucHV0LFxuICAgICAgICAgICAgICAgIHNraXBLZXlQcmVzc0V2ZW50ID0gZmFsc2UsIC8vU2FmYXJpIDUuMS54IC0gbW9kYWwgZGlhbG9nIGZpcmVzIGtleXByZXNzIHR3aWNlIHdvcmthcm91bmRcbiAgICAgICAgICAgICAgICBza2lwSW5wdXRFdmVudCA9IGZhbHNlLCAvL3NraXAgd2hlbiB0cmlnZ2VyZWQgZnJvbSB3aXRoaW4gaW5wdXRtYXNrXG4gICAgICAgICAgICAgICAgaWdub3JhYmxlID0gZmFsc2U7XG5cblxuICAgICAgICAgICAgLy9tYXNrc2V0IGhlbHBlcmZ1bmN0aW9uc1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRBY3RpdmVNYXNrU2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXNrc2V0c1thY3RpdmVNYXNrc2V0SW5kZXhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRBY3RpdmVUZXN0cygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWN0aXZlTWFza1NldCgpWyd0ZXN0cyddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWN0aXZlTWFza1NldCgpWydfYnVmZmVyJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEFjdGl2ZUJ1ZmZlcigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWN0aXZlTWFza1NldCgpWydidWZmZXInXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNWYWxpZChwb3MsIGMsIHN0cmljdCkgeyAvL3N0cmljdCB0cnVlIH4gbm8gY29ycmVjdGlvbiBvciBhdXRvZmlsbFxuICAgICAgICAgICAgICAgIHN0cmljdCA9IHN0cmljdCA9PT0gdHJ1ZTsgLy9hbHdheXMgc2V0IGEgdmFsdWUgdG8gc3RyaWN0IHRvIHByZXZlbnQgcG9zc2libGUgc3RyYW5nZSBiZWhhdmlvciBpbiB0aGUgZXh0ZW5zaW9ucyBcblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9pc1ZhbGlkKHBvc2l0aW9uLCBhY3RpdmVNYXNrc2V0LCBjLCBzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlc3RQb3MgPSBkZXRlcm1pbmVUZXN0UG9zaXRpb24ocG9zaXRpb24pLCBsb29wZW5kID0gYyA/IDEgOiAwLCBjaHJzID0gJycsIGJ1ZmZlciA9IGFjdGl2ZU1hc2tzZXRbXCJidWZmZXJcIl07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBhY3RpdmVNYXNrc2V0Wyd0ZXN0cyddW3Rlc3RQb3NdLmNhcmRpbmFsaXR5OyBpID4gbG9vcGVuZDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHJzICs9IGdldEJ1ZmZlckVsZW1lbnQoYnVmZmVyLCB0ZXN0UG9zIC0gKGkgLSAxKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hycyArPSBjO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy9yZXR1cm4gaXMgZmFsc2Ugb3IgYSBqc29uIG9iamVjdCA9PiB7IHBvczogPz8sIGM6ID8/fSBvciB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3RpdmVNYXNrc2V0Wyd0ZXN0cyddW3Rlc3RQb3NdLmZuICE9IG51bGwgP1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldFsndGVzdHMnXVt0ZXN0UG9zXS5mbi50ZXN0KGNocnMsIGJ1ZmZlciwgcG9zaXRpb24sIHN0cmljdCwgb3B0cylcbiAgICAgICAgICAgICAgICAgICAgICAgIDogKGMgPT0gZ2V0QnVmZmVyRWxlbWVudChhY3RpdmVNYXNrc2V0WydfYnVmZmVyJ10sIHBvc2l0aW9uLCB0cnVlKSB8fCBjID09IG9wdHMuc2tpcE9wdGlvbmFsUGFydENoYXJhY3RlcikgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJyZWZyZXNoXCI6IHRydWUsIGM6IGdldEJ1ZmZlckVsZW1lbnQoYWN0aXZlTWFza3NldFsnX2J1ZmZlciddLCBwb3NpdGlvbiwgdHJ1ZSksIHBvczogcG9zaXRpb24gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gUG9zdFByb2Nlc3NSZXN1bHRzKG1hc2tGb3J3YXJkcywgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzVmFsaWRBY3R1YWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlc3VsdHMsIGZ1bmN0aW9uIChuZHgsIHJzbHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc1ZhbGlkQWN0dWFsID0gJC5pbkFycmF5KHJzbHRbXCJhY3RpdmVNYXNrc2V0SW5kZXhcIl0sIG1hc2tGb3J3YXJkcykgPT0gLTEgJiYgcnNsdFtcInJlc3VsdFwiXSAhPT0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzVmFsaWRBY3R1YWwpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNWYWxpZEFjdHVhbCkgeyAvL3N0cmlwIG1hc2tmb3J3YXJkc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9ICQubWFwKHJlc3VsdHMsIGZ1bmN0aW9uIChyc2x0LCBuZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJC5pbkFycmF5KHJzbHRbXCJhY3RpdmVNYXNrc2V0SW5kZXhcIl0sIG1hc2tGb3J3YXJkcykgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJzbHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza3NldHNbcnNsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXV1bXCJsYXN0VmFsaWRQb3NpdGlvblwiXSA9IGFjdHVhbExWUDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLy9rZWVwIG1hc2tmb3J3YXJkcyB3aXRoIHRoZSBsZWFzdCBmb3J3YXJkXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG93ZXN0UG9zID0gLTEsIGxvd2VzdEluZGV4ID0gLTEsIHJzbHRWYWxpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChyZXN1bHRzLCBmdW5jdGlvbiAobmR4LCByc2x0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQuaW5BcnJheShyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdLCBtYXNrRm9yd2FyZHMpICE9IC0xICYmIHJzbHRbXCJyZXN1bHRcIl0gIT09IGZhbHNlICYgKGxvd2VzdFBvcyA9PSAtMSB8fCBsb3dlc3RQb3MgPiByc2x0W1wicmVzdWx0XCJdW1wicG9zXCJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlc3RQb3MgPSByc2x0W1wicmVzdWx0XCJdW1wicG9zXCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlc3RJbmRleCA9IHJzbHRbXCJhY3RpdmVNYXNrc2V0SW5kZXhcIl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gJC5tYXAocmVzdWx0cywgZnVuY3Rpb24gKHJzbHQsIG5keCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmluQXJyYXkocnNsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXSwgbWFza0ZvcndhcmRzKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnNsdFtcInJlc3VsdFwiXVtcInBvc1wiXSA9PSBsb3dlc3RQb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByc2x0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJzbHRbXCJyZXN1bHRcIl0gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gcG9zOyBpIDwgbG93ZXN0UG9zOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByc2x0VmFsaWQgPSBfaXNWYWxpZChpLCBtYXNrc2V0c1tyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdXSwgbWFza3NldHNbbG93ZXN0SW5kZXhdW1wiYnVmZmVyXCJdW2ldLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnNsdFZhbGlkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrc2V0c1tyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdXVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdID0gbG93ZXN0UG9zIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnVmZmVyRWxlbWVudChtYXNrc2V0c1tyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdXVtcImJ1ZmZlclwiXSwgaSwgbWFza3NldHNbbG93ZXN0SW5kZXhdW1wiYnVmZmVyXCJdW2ldLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza3NldHNbcnNsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXV1bXCJsYXN0VmFsaWRQb3NpdGlvblwiXSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9hbHNvIGNoZWNrIGNoZWNrIGZvciB0aGUgbG93ZXN0cG9zIHdpdGggdGhlIG5ldyBpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnNsdFZhbGlkID0gX2lzVmFsaWQobG93ZXN0UG9zLCBtYXNrc2V0c1tyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdXSwgYywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnNsdFZhbGlkICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ1ZmZlckVsZW1lbnQobWFza3NldHNbcnNsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXV1bXCJidWZmZXJcIl0sIGxvd2VzdFBvcywgYywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza3NldHNbcnNsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXV1bXCJsYXN0VmFsaWRQb3NpdGlvblwiXSA9IGxvd2VzdFBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJuZHggXCIgKyByc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdICsgXCIgdmFsaWRhdGUgXCIgKyBtYXNrc2V0c1tyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdXVtcImJ1ZmZlclwiXS5qb2luKCcnKSArIFwiIGx2IFwiICsgbWFza3NldHNbcnNsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXV1bJ2xhc3RWYWxpZFBvc2l0aW9uJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJzbHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBfaXNWYWxpZChwb3MsIGdldEFjdGl2ZU1hc2tTZXQoKSwgYywgc3RyaWN0KTsgLy9vbmx5IGNoZWNrIHZhbGlkaXR5IGluIGN1cnJlbnQgbWFzayB3aGVuIHZhbGlkYXRpbmcgc3RyaWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHsgXCJwb3NcIjogcG9zIH07IC8vYWx3YXlzIHRha2UgYSBwb3NzaWJsZSBjb3JyZWN0ZWQgbWFza3Bvc2l0aW9uIGludG8gYWNjb3VudFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXSwgcmVzdWx0ID0gZmFsc2UsIGN1cnJlbnRBY3RpdmVNYXNrc2V0SW5kZXggPSBhY3RpdmVNYXNrc2V0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbEJ1ZmZlciA9IGdldEFjdGl2ZUJ1ZmZlcigpLnNsaWNlKCksIGFjdHVhbExWUCA9IGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxQcmV2aW91cyA9IHNlZWtQcmV2aW91cyhwb3MpLFxuICAgICAgICAgICAgICAgICAgICBtYXNrRm9yd2FyZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAkLmVhY2gobWFza3NldHMsIGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAodmFsdWUpID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IGluZGV4O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFza1BvcyA9IHBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsdnAgPSBnZXRBY3RpdmVNYXNrU2V0KClbJ2xhc3RWYWxpZFBvc2l0aW9uJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcnNsdFZhbGlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGx2cCA9PSBhY3R1YWxMVlApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKG1hc2tQb3MgLSBhY3R1YWxMVlApID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gbHZwID09IC0xID8gMCA6IGx2cDsgaSA8IG1hc2tQb3M7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnNsdFZhbGlkID0gX2lzVmFsaWQoaSwgZ2V0QWN0aXZlTWFza1NldCgpLCBhY3R1YWxCdWZmZXJbaV0sIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJzbHRWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnVmZmVyRWxlbWVudChnZXRBY3RpdmVCdWZmZXIoKSwgaSwgYWN0dWFsQnVmZmVyW2ldLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnNsdFZhbGlkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJzbHRWYWxpZCA9IHsgXCJwb3NcIjogaSB9OyAvL2Fsd2F5cyB0YWtlIGEgcG9zc2libGUgY29ycmVjdGVkIG1hc2twb3NpdGlvbiBpbnRvIGFjY291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1ZhbGlkUG9zaXRpb24gPSByc2x0VmFsaWQucG9zIHx8IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldEFjdGl2ZU1hc2tTZXQoKVsnbGFzdFZhbGlkUG9zaXRpb24nXSA8IG5ld1ZhbGlkUG9zaXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVsnbGFzdFZhbGlkUG9zaXRpb24nXSA9IG5ld1ZhbGlkUG9zaXRpb247IC8vc2V0IG5ldyBwb3NpdGlvbiBmcm9tIGlzVmFsaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RvZXMgdGhlIGlucHV0IG1hdGNoIG9uIGEgZnVydGhlciBwb3NpdGlvbj9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTWFzayhtYXNrUG9zKSAmJiAhX2lzVmFsaWQobWFza1BvcywgZ2V0QWN0aXZlTWFza1NldCgpLCBjLCBzdHJpY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXhGb3J3YXJkID0gc2Vla05leHQobWFza1BvcykgLSBtYXNrUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmdyA9IDA7IGZ3IDwgbWF4Rm9yd2FyZDsgZncrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9pc1ZhbGlkKCsrbWFza1BvcywgZ2V0QWN0aXZlTWFza1NldCgpLCBjLCBzdHJpY3QpICE9PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrRm9yd2FyZHMucHVzaChhY3RpdmVNYXNrc2V0SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdtYXNrZm9yd2FyZCAnICsgYWN0aXZlTWFza3NldEluZGV4ICsgXCIgcG9zIFwiICsgcG9zICsgXCIgbWFza1BvcyBcIiArIG1hc2tQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldEFjdGl2ZU1hc2tTZXQoKVsnbGFzdFZhbGlkUG9zaXRpb24nXSA+PSBhY3R1YWxMVlAgfHwgYWN0aXZlTWFza3NldEluZGV4ID09IGN1cnJlbnRBY3RpdmVNYXNrc2V0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFza1BvcyA+PSAwICYmIG1hc2tQb3MgPCBnZXRNYXNrTGVuZ3RoKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gX2lzVmFsaWQobWFza1BvcywgZ2V0QWN0aXZlTWFza1NldCgpLCBjLCBzdHJpY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHsgXCJwb3NcIjogbWFza1BvcyB9OyAvL2Fsd2F5cyB0YWtlIGEgcG9zc2libGUgY29ycmVjdGVkIG1hc2twb3NpdGlvbiBpbnRvIGFjY291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdWYWxpZFBvc2l0aW9uID0gcmVzdWx0LnBvcyB8fCBtYXNrUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldEFjdGl2ZU1hc2tTZXQoKVsnbGFzdFZhbGlkUG9zaXRpb24nXSA8IG5ld1ZhbGlkUG9zaXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QWN0aXZlTWFza1NldCgpWydsYXN0VmFsaWRQb3NpdGlvbiddID0gbmV3VmFsaWRQb3NpdGlvbjsgLy9zZXQgbmV3IHBvc2l0aW9uIGZyb20gaXNWYWxpZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJwb3MgXCIgKyBwb3MgKyBcIiBuZHggXCIgKyBhY3RpdmVNYXNrc2V0SW5kZXggKyBcIiB2YWxpZGF0ZSBcIiArIGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpICsgXCIgbHYgXCIgKyBnZXRBY3RpdmVNYXNrU2V0KClbJ2xhc3RWYWxpZFBvc2l0aW9uJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBcImFjdGl2ZU1hc2tzZXRJbmRleFwiOiBpbmRleCwgXCJyZXN1bHRcIjogcmVzdWx0IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IGN1cnJlbnRBY3RpdmVNYXNrc2V0SW5kZXg7IC8vcmVzZXQgYWN0aXZlTWFza3NldEluZGV4XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gUG9zdFByb2Nlc3NSZXN1bHRzKG1hc2tGb3J3YXJkcywgcmVzdWx0cyk7IC8vcmV0dXJuIHJlc3VsdHMgb2YgdGhlIG11bHRpcGxlIG1hc2sgdmFsaWRhdGlvbnNcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZGV0ZXJtaW5lQWN0aXZlTWFza3NldEluZGV4KCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50TWFza3NldEluZGV4ID0gYWN0aXZlTWFza3NldEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBoaWdoZXN0VmFsaWQgPSB7IFwiYWN0aXZlTWFza3NldEluZGV4XCI6IDAsIFwibGFzdFZhbGlkUG9zaXRpb25cIjogLTEsIFwibmV4dFwiOiAtMSB9O1xuICAgICAgICAgICAgICAgICQuZWFjaChtYXNrc2V0cywgZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICh2YWx1ZSkgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0QWN0aXZlTWFza1NldCgpWydsYXN0VmFsaWRQb3NpdGlvbiddID4gaGlnaGVzdFZhbGlkWydsYXN0VmFsaWRQb3NpdGlvbiddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFZhbGlkW1wiYWN0aXZlTWFza3NldEluZGV4XCJdID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFZhbGlkW1wibGFzdFZhbGlkUG9zaXRpb25cIl0gPSBnZXRBY3RpdmVNYXNrU2V0KClbJ2xhc3RWYWxpZFBvc2l0aW9uJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFZhbGlkW1wibmV4dFwiXSA9IHNlZWtOZXh0KGdldEFjdGl2ZU1hc2tTZXQoKVsnbGFzdFZhbGlkUG9zaXRpb24nXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGdldEFjdGl2ZU1hc2tTZXQoKVsnbGFzdFZhbGlkUG9zaXRpb24nXSA9PSBoaWdoZXN0VmFsaWRbJ2xhc3RWYWxpZFBvc2l0aW9uJ10gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaGlnaGVzdFZhbGlkWyduZXh0J10gPT0gLTEgfHwgaGlnaGVzdFZhbGlkWyduZXh0J10gPiBzZWVrTmV4dChnZXRBY3RpdmVNYXNrU2V0KClbJ2xhc3RWYWxpZFBvc2l0aW9uJ10pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RWYWxpZFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXSA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RWYWxpZFtcImxhc3RWYWxpZFBvc2l0aW9uXCJdID0gZ2V0QWN0aXZlTWFza1NldCgpWydsYXN0VmFsaWRQb3NpdGlvbiddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RWYWxpZFtcIm5leHRcIl0gPSBzZWVrTmV4dChnZXRBY3RpdmVNYXNrU2V0KClbJ2xhc3RWYWxpZFBvc2l0aW9uJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBhY3RpdmVNYXNrc2V0SW5kZXggPSBoaWdoZXN0VmFsaWRbXCJsYXN0VmFsaWRQb3NpdGlvblwiXSAhPSAtMSAmJiBtYXNrc2V0c1tjdXJyZW50TWFza3NldEluZGV4XVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdID09IGhpZ2hlc3RWYWxpZFtcImxhc3RWYWxpZFBvc2l0aW9uXCJdID8gY3VycmVudE1hc2tzZXRJbmRleCA6IGhpZ2hlc3RWYWxpZFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE1hc2tzZXRJbmRleCAhPSBhY3RpdmVNYXNrc2V0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJCdWZmZXIoZ2V0QWN0aXZlQnVmZmVyKCksIHNlZWtOZXh0KGhpZ2hlc3RWYWxpZFtcImxhc3RWYWxpZFBvc2l0aW9uXCJdKSwgZ2V0TWFza0xlbmd0aCgpKTtcbiAgICAgICAgICAgICAgICAgICAgZ2V0QWN0aXZlTWFza1NldCgpW1wid3JpdGVPdXRCdWZmZXJcIl0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkZWwuZGF0YSgnX2lucHV0bWFzaycpWydhY3RpdmVNYXNrc2V0SW5kZXgnXSA9IGFjdGl2ZU1hc2tzZXRJbmRleDsgLy9zdG9yZSB0aGUgYWN0aXZlTWFza3NldEluZGV4XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzTWFzayhwb3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVzdFBvcyA9IGRldGVybWluZVRlc3RQb3NpdGlvbihwb3MpO1xuICAgICAgICAgICAgICAgIHZhciB0ZXN0ID0gZ2V0QWN0aXZlVGVzdHMoKVt0ZXN0UG9zXTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXN0ICE9IHVuZGVmaW5lZCA/IHRlc3QuZm4gOiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZGV0ZXJtaW5lVGVzdFBvc2l0aW9uKHBvcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3MgJSBnZXRBY3RpdmVUZXN0cygpLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TWFza0xlbmd0aCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5nZXRNYXNrTGVuZ3RoKGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKCksIGdldEFjdGl2ZU1hc2tTZXQoKVsnZ3JlZWR5J10sIGdldEFjdGl2ZU1hc2tTZXQoKVsncmVwZWF0J10sIGdldEFjdGl2ZUJ1ZmZlcigpLCBvcHRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9wb3M6IGZyb20gcG9zaXRpb25cblxuICAgICAgICAgICAgZnVuY3Rpb24gc2Vla05leHQocG9zKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hc2tMID0gZ2V0TWFza0xlbmd0aCgpO1xuICAgICAgICAgICAgICAgIGlmIChwb3MgPj0gbWFza0wpIHJldHVybiBtYXNrTDtcbiAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBwb3M7XG4gICAgICAgICAgICAgICAgd2hpbGUgKCsrcG9zaXRpb24gPCBtYXNrTCAmJiAhaXNNYXNrKHBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vcG9zOiBmcm9tIHBvc2l0aW9uXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHNlZWtQcmV2aW91cyhwb3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBwb3M7XG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uIDw9IDApIHJldHVybiAwO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKC0tcG9zaXRpb24gPiAwICYmICFpc01hc2socG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc2V0QnVmZmVyRWxlbWVudChidWZmZXIsIHBvc2l0aW9uLCBlbGVtZW50LCBhdXRvUHJlcGFyZSkge1xuICAgICAgICAgICAgICAgIGlmIChhdXRvUHJlcGFyZSkgcG9zaXRpb24gPSBwcmVwYXJlQnVmZmVyKGJ1ZmZlciwgcG9zaXRpb24pO1xuXG4gICAgICAgICAgICAgICAgdmFyIHRlc3QgPSBnZXRBY3RpdmVUZXN0cygpW2RldGVybWluZVRlc3RQb3NpdGlvbihwb3NpdGlvbildO1xuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gZWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbSAhPSB1bmRlZmluZWQgJiYgdGVzdCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0ZXN0LmNhc2luZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInVwcGVyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbSA9IGVsZW1lbnQudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJsb3dlclwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0gPSBlbGVtZW50LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBidWZmZXJbcG9zaXRpb25dID0gZWxlbTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0QnVmZmVyRWxlbWVudChidWZmZXIsIHBvc2l0aW9uLCBhdXRvUHJlcGFyZSkge1xuICAgICAgICAgICAgICAgIGlmIChhdXRvUHJlcGFyZSkgcG9zaXRpb24gPSBwcmVwYXJlQnVmZmVyKGJ1ZmZlciwgcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiBidWZmZXJbcG9zaXRpb25dO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL25lZWRlZCB0byBoYW5kbGUgdGhlIG5vbi1ncmVlZHkgbWFzayByZXBldGl0aW9uc1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBwcmVwYXJlQnVmZmVyKGJ1ZmZlciwgcG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgajtcbiAgICAgICAgICAgICAgICB3aGlsZSAoYnVmZmVyW3Bvc2l0aW9uXSA9PSB1bmRlZmluZWQgJiYgYnVmZmVyLmxlbmd0aCA8IGdldE1hc2tMZW5ndGgoKSkge1xuICAgICAgICAgICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKClbal0gIT09IHVuZGVmaW5lZCkgeyAvL2FkZCBhIG5ldyBidWZmZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKClbaisrXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlQnVmZmVyKGlucHV0LCBidWZmZXIsIGNhcmV0UG9zKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQuX3ZhbHVlU2V0KGJ1ZmZlci5qb2luKCcnKSk7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmV0UG9zICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgY2FyZXRQb3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2xlYXJCdWZmZXIoYnVmZmVyLCBzdGFydCwgZW5kLCBzdHJpcE5vbWFza3MpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQsIG1hc2tMID0gZ2V0TWFza0xlbmd0aCgpIDsgaSA8IGVuZCAmJiBpIDwgbWFza0w7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaXBOb21hc2tzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTWFzayhpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCdWZmZXJFbGVtZW50KGJ1ZmZlciwgaSwgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0QnVmZmVyRWxlbWVudChidWZmZXIsIGksIGdldEJ1ZmZlckVsZW1lbnQoZ2V0QWN0aXZlQnVmZmVyVGVtcGxhdGUoKS5zbGljZSgpLCBpLCB0cnVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzZXRSZVRhcmdldFBsYWNlSG9sZGVyKGJ1ZmZlciwgcG9zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlc3RQb3MgPSBkZXRlcm1pbmVUZXN0UG9zaXRpb24ocG9zKTtcbiAgICAgICAgICAgICAgICBzZXRCdWZmZXJFbGVtZW50KGJ1ZmZlciwgcG9zLCBnZXRCdWZmZXJFbGVtZW50KGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKCksIHRlc3RQb3MpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0UGxhY2VIb2xkZXIocG9zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMucGxhY2Vob2xkZXIuY2hhckF0KHBvcyAlIG9wdHMucGxhY2Vob2xkZXIubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tWYWwoaW5wdXQsIHdyaXRlT3V0LCBzdHJpY3QsIG5wdHZsLCBpbnRlbGxpQ2hlY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXRWYWx1ZSA9IG5wdHZsICE9IHVuZGVmaW5lZCA/IG5wdHZsLnNsaWNlKCkgOiB0cnVuY2F0ZUlucHV0KGlucHV0Ll92YWx1ZUdldCgpKS5zcGxpdCgnJyk7XG5cbiAgICAgICAgICAgICAgICAkLmVhY2gobWFza3NldHMsIGZ1bmN0aW9uIChuZHgsIG1zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKG1zKSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc1tcImJ1ZmZlclwiXSA9IG1zW1wiX2J1ZmZlclwiXS5zbGljZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNbXCJsYXN0VmFsaWRQb3NpdGlvblwiXSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNbXCJwXCJdID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ICE9PSB0cnVlKSBhY3RpdmVNYXNrc2V0SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIGlmICh3cml0ZU91dCkgaW5wdXQuX3ZhbHVlU2V0KFwiXCIpOyAvL2luaXRpYWwgY2xlYXJcbiAgICAgICAgICAgICAgICB2YXIgbWwgPSBnZXRNYXNrTGVuZ3RoKCk7XG4gICAgICAgICAgICAgICAgJC5lYWNoKGlucHV0VmFsdWUsIGZ1bmN0aW9uIChuZHgsIGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlbGxpQ2hlY2sgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gZ2V0QWN0aXZlTWFza1NldCgpW1wicFwiXSwgbHZwID0gcCA9PSAtMSA/IHAgOiBzZWVrUHJldmlvdXMocCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zID0gbHZwID09IC0xID8gbmR4IDogc2Vla05leHQobHZwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmluQXJyYXkoY2hhckNvZGUsIGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKCkuc2xpY2UobHZwICsgMSwgcG9zKSkgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlwcmVzc0V2ZW50LmNhbGwoaW5wdXQsIHVuZGVmaW5lZCwgdHJ1ZSwgY2hhckNvZGUuY2hhckNvZGVBdCgwKSwgd3JpdGVPdXQsIHN0cmljdCwgbmR4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXByZXNzRXZlbnQuY2FsbChpbnB1dCwgdW5kZWZpbmVkLCB0cnVlLCBjaGFyQ29kZS5jaGFyQ29kZUF0KDApLCB3cml0ZU91dCwgc3RyaWN0LCBuZHgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ID09PSB0cnVlICYmIGdldEFjdGl2ZU1hc2tTZXQoKVtcInBcIl0gIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0QWN0aXZlTWFza1NldCgpW1wibGFzdFZhbGlkUG9zaXRpb25cIl0gPSBzZWVrUHJldmlvdXMoZ2V0QWN0aXZlTWFza1NldCgpW1wicFwiXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBlc2NhcGVSZWdleChzdHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5pbnB1dG1hc2suZXNjYXBlUmVnZXguY2FsbCh0aGlzLCBzdHIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB0cnVuY2F0ZUlucHV0KGlucHV0VmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXCIgKyBlc2NhcGVSZWdleChnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLmpvaW4oJycpKSArIFwiKSokXCIpLCBcIlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2xlYXJPcHRpb25hbFRhaWwoaW5wdXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyKCksIHRtcEJ1ZmZlciA9IGJ1ZmZlci5zbGljZSgpLCB0ZXN0UG9zLCBwb3M7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcG9zID0gdG1wQnVmZmVyLmxlbmd0aCAtIDE7IHBvcyA+PSAwOyBwb3MtLSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGVzdFBvcyA9IGRldGVybWluZVRlc3RQb3NpdGlvbihwb3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0QWN0aXZlVGVzdHMoKVt0ZXN0UG9zXS5vcHRpb25hbGl0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01hc2socG9zKSB8fCAhaXNWYWxpZChwb3MsIGJ1ZmZlcltwb3NdLCB0cnVlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bXBCdWZmZXIucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdyaXRlQnVmZmVyKGlucHV0LCB0bXBCdWZmZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB1bm1hc2tlZHZhbHVlKCRpbnB1dCwgc2tpcERhdGVwaWNrZXJDaGVjaykge1xuICAgICAgICAgICAgICAgIGlmIChnZXRBY3RpdmVUZXN0cygpICYmIChza2lwRGF0ZXBpY2tlckNoZWNrID09PSB0cnVlIHx8ICEkaW5wdXQuaGFzQ2xhc3MoJ2hhc0RhdGVwaWNrZXInKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9jaGVja1ZhbChpbnB1dCwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdW1WYWx1ZSA9ICQubWFwKGdldEFjdGl2ZUJ1ZmZlcigpLCBmdW5jdGlvbiAoZWxlbWVudCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc01hc2soaW5kZXgpICYmIGlzVmFsaWQoaW5kZXgsIGVsZW1lbnQsIHRydWUpID8gZWxlbWVudCA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdW5tYXNrZWRWYWx1ZSA9IChpc1JUTCA/IHVtVmFsdWUucmV2ZXJzZSgpIDogdW1WYWx1ZSkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRzLm9uVW5NYXNrICE9IHVuZGVmaW5lZCA/IG9wdHMub25Vbk1hc2suY2FsbCh0aGlzLCBnZXRBY3RpdmVCdWZmZXIoKS5qb2luKCcnKSwgdW5tYXNrZWRWYWx1ZSkgOiB1bm1hc2tlZFZhbHVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkaW5wdXRbMF0uX3ZhbHVlR2V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBUcmFuc2xhdGVQb3NpdGlvbihwb3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNSVEwgJiYgdHlwZW9mIHBvcyA9PSAnbnVtYmVyJyAmJiAoIW9wdHMuZ3JlZWR5IHx8IG9wdHMucGxhY2Vob2xkZXIgIT0gXCJcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJmZnJMZ2h0ID0gZ2V0QWN0aXZlQnVmZmVyKCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBwb3MgPSBiZmZyTGdodCAtIHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2FyZXQoaW5wdXQsIGJlZ2luLCBlbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbnB0ID0gaW5wdXQuanF1ZXJ5ICYmIGlucHV0Lmxlbmd0aCA+IDAgPyBpbnB1dFswXSA6IGlucHV0LCByYW5nZTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGJlZ2luID09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luID0gVHJhbnNsYXRlUG9zaXRpb24oYmVnaW4pO1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBUcmFuc2xhdGVQb3NpdGlvbihlbmQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoISQoaW5wdXQpLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5kID0gKHR5cGVvZiBlbmQgPT0gJ251bWJlcicpID8gZW5kIDogYmVnaW47XG4gICAgICAgICAgICAgICAgICAgIG5wdC5zY3JvbGxMZWZ0ID0gbnB0LnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5pbnNlcnRNb2RlID09IGZhbHNlICYmIGJlZ2luID09IGVuZCkgZW5kKys7IC8vc2V0IHZpc3VhbGl6YXRpb24gZm9yIGluc2VydC9vdmVyd3JpdGUgbW9kZVxuICAgICAgICAgICAgICAgICAgICBpZiAobnB0LnNldFNlbGVjdGlvblJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBucHQuc2VsZWN0aW9uU3RhcnQgPSBiZWdpbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5wdC5zZWxlY3Rpb25FbmQgPSBhbmRyb2lkID8gYmVnaW4gOiBlbmQ7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChucHQuY3JlYXRlVGV4dFJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZSA9IG5wdC5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UubW92ZUVuZCgnY2hhcmFjdGVyJywgZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgYmVnaW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc2VsZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISQoaW5wdXQpLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcImJlZ2luXCI6IDAsIFwiZW5kXCI6IDAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobnB0LnNldFNlbGVjdGlvblJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbiA9IG5wdC5zZWxlY3Rpb25TdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IG5wdC5zZWxlY3Rpb25FbmQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZ2luID0gMCAtIHJhbmdlLmR1cGxpY2F0ZSgpLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgLTEwMDAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSBiZWdpbiArIHJhbmdlLnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luID0gVHJhbnNsYXRlUG9zaXRpb24oYmVnaW4pO1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBUcmFuc2xhdGVQb3NpdGlvbihlbmQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcImJlZ2luXCI6IGJlZ2luLCBcImVuZFwiOiBlbmQgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQ29tcGxldGUoYnVmZmVyKSB7IC8vcmV0dXJuIHRydWUgLyBmYWxzZSAvIHVuZGVmaW5lZCAocmVwZWF0ICopXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMucmVwZWF0ID09IFwiKlwiKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBjb21wbGV0ZSA9IGZhbHNlLCBoaWdoZXN0VmFsaWRQb3NpdGlvbiA9IDAsIGN1cnJlbnRBY3RpdmVNYXNrc2V0SW5kZXggPSBhY3RpdmVNYXNrc2V0SW5kZXg7XG4gICAgICAgICAgICAgICAgJC5lYWNoKG1hc2tzZXRzLCBmdW5jdGlvbiAobmR4LCBtcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChtcykgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gbmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtbCA9IHNlZWtQcmV2aW91cyhnZXRNYXNrTGVuZ3RoKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1zW1wibGFzdFZhbGlkUG9zaXRpb25cIl0gPj0gaGlnaGVzdFZhbGlkUG9zaXRpb24gJiYgbXNbXCJsYXN0VmFsaWRQb3NpdGlvblwiXSA9PSBhbWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNDb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gYW1sOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hc2sgPSBpc01hc2soaSksIHRlc3RQb3MgPSBkZXRlcm1pbmVUZXN0UG9zaXRpb24oaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobWFzayAmJiAoYnVmZmVyW2ldID09IHVuZGVmaW5lZCB8fCBidWZmZXJbaV0gPT0gZ2V0UGxhY2VIb2xkZXIoaSkpKSB8fCAoIW1hc2sgJiYgYnVmZmVyW2ldICE9IGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKClbdGVzdFBvc10pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtc0NvbXBsZXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZSA9IGNvbXBsZXRlIHx8IG1zQ29tcGxldGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlKSAvL2JyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFZhbGlkUG9zaXRpb24gPSBtc1tcImxhc3RWYWxpZFBvc2l0aW9uXCJdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gY3VycmVudEFjdGl2ZU1hc2tzZXRJbmRleDsgLy9yZXNldCBhY3RpdmVNYXNrc2V0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc1NlbGVjdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzUlRMID8gKGJlZ2luIC0gZW5kKSA+IDEgfHwgKChiZWdpbiAtIGVuZCkgPT0gMSAmJiBvcHRzLmluc2VydE1vZGUpIDpcbiAgICAgICAgICAgICAgICAgICAgKGVuZCAtIGJlZ2luKSA+IDEgfHwgKChlbmQgLSBiZWdpbikgPT0gMSAmJiBvcHRzLmluc2VydE1vZGUpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vcHJpdmF0ZSBmdW5jdGlvbnNcbiAgICAgICAgICAgIGZ1bmN0aW9uIGluc3RhbGxFdmVudFJ1bGVyKG5wdCkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudHMgPSAkLl9kYXRhKG5wdCkuZXZlbnRzO1xuXG4gICAgICAgICAgICAgICAgJC5lYWNoKGV2ZW50cywgZnVuY3Rpb24gKGV2ZW50VHlwZSwgZXZlbnRIYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goZXZlbnRIYW5kbGVycywgZnVuY3Rpb24gKG5keCwgZXZlbnRIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRIYW5kbGVyLm5hbWVzcGFjZSA9PSBcImlucHV0bWFza1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50SGFuZGxlci50eXBlICE9IFwic2V0dmFsdWVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IGV2ZW50SGFuZGxlci5oYW5kbGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudEhhbmRsZXIuaGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZWFkT25seSB8fCB0aGlzLmRpc2FibGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwYXRjaFZhbHVlUHJvcGVydHkobnB0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlUHJvcGVydHk7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlUHJvcGVydHkgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG5wdCwgXCJ2YWx1ZVwiKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVQcm9wZXJ0eSAmJiB2YWx1ZVByb3BlcnR5LmdldCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5wdC5fdmFsdWVHZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZUdldCA9IHZhbHVlUHJvcGVydHkuZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlU2V0ID0gdmFsdWVQcm9wZXJ0eS5zZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBucHQuX3ZhbHVlR2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc1JUTCA/IHZhbHVlR2V0LmNhbGwodGhpcykuc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKSA6IHZhbHVlR2V0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbnB0Ll92YWx1ZVNldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlU2V0LmNhbGwodGhpcywgaXNSVEwgPyB2YWx1ZS5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpIDogdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5wdCwgXCJ2YWx1ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkc2VsZiA9ICQodGhpcyksIGlucHV0RGF0YSA9ICQodGhpcykuZGF0YSgnX2lucHV0bWFzaycpLCBtYXNrc2V0cyA9IGlucHV0RGF0YVsnbWFza3NldHMnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IGlucHV0RGF0YVsnYWN0aXZlTWFza3NldEluZGV4J107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dERhdGEgJiYgaW5wdXREYXRhWydvcHRzJ10uYXV0b1VubWFzayA/ICRzZWxmLmlucHV0bWFzaygndW5tYXNrZWR2YWx1ZScpIDogdmFsdWVHZXQuY2FsbCh0aGlzKSAhPSBtYXNrc2V0c1thY3RpdmVNYXNrc2V0SW5kZXhdWydfYnVmZmVyJ10uam9pbignJykgPyB2YWx1ZUdldC5jYWxsKHRoaXMpIDogJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVNldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignc2V0dmFsdWUuaW5wdXRtYXNrJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Ll9fbG9va3VwR2V0dGVyX18gJiYgbnB0Ll9fbG9va3VwR2V0dGVyX18oXCJ2YWx1ZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5wdC5fdmFsdWVHZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZUdldCA9IG5wdC5fX2xvb2t1cEdldHRlcl9fKFwidmFsdWVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVTZXQgPSBucHQuX19sb29rdXBTZXR0ZXJfXyhcInZhbHVlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbnB0Ll92YWx1ZUdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNSVEwgPyB2YWx1ZUdldC5jYWxsKHRoaXMpLnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJykgOiB2YWx1ZUdldC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5wdC5fdmFsdWVTZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVNldC5jYWxsKHRoaXMsIGlzUlRMID8gdmFsdWUuc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKSA6IHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG5wdC5fX2RlZmluZUdldHRlcl9fKFwidmFsdWVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkc2VsZiA9ICQodGhpcyksIGlucHV0RGF0YSA9ICQodGhpcykuZGF0YSgnX2lucHV0bWFzaycpLCBtYXNrc2V0cyA9IGlucHV0RGF0YVsnbWFza3NldHMnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gaW5wdXREYXRhWydhY3RpdmVNYXNrc2V0SW5kZXgnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXREYXRhICYmIGlucHV0RGF0YVsnb3B0cyddLmF1dG9Vbm1hc2sgPyAkc2VsZi5pbnB1dG1hc2soJ3VubWFza2VkdmFsdWUnKSA6IHZhbHVlR2V0LmNhbGwodGhpcykgIT0gbWFza3NldHNbYWN0aXZlTWFza3NldEluZGV4XVsnX2J1ZmZlciddLmpvaW4oJycpID8gdmFsdWVHZXQuY2FsbCh0aGlzKSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBucHQuX19kZWZpbmVTZXR0ZXJfXyhcInZhbHVlXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlU2V0LmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3NldHZhbHVlLmlucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5wdC5fdmFsdWVHZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5wdC5fdmFsdWVHZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBpc1JUTCA/IHRoaXMudmFsdWUuc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKSA6IHRoaXMudmFsdWU7IH07XG4gICAgICAgICAgICAgICAgICAgICAgICBucHQuX3ZhbHVlU2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7IHRoaXMudmFsdWUgPSBpc1JUTCA/IHZhbHVlLnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJykgOiB2YWx1ZTsgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoJC52YWxIb29rcy50ZXh0ID09IHVuZGVmaW5lZCB8fCAkLnZhbEhvb2tzLnRleHQuaW5wdXRtYXNrcGF0Y2ggIT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlR2V0ID0gJC52YWxIb29rcy50ZXh0ICYmICQudmFsSG9va3MudGV4dC5nZXQgPyAkLnZhbEhvb2tzLnRleHQuZ2V0IDogZnVuY3Rpb24gKGVsZW0pIHsgcmV0dXJuIGVsZW0udmFsdWU7IH07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVTZXQgPSAkLnZhbEhvb2tzLnRleHQgJiYgJC52YWxIb29rcy50ZXh0LnNldCA/ICQudmFsSG9va3MudGV4dC5zZXQgOiBmdW5jdGlvbiAoZWxlbSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZXh0ZW5kKCQudmFsSG9va3MsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGVsZW0uZGF0YSgnX2lucHV0bWFzaycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRlbGVtLmRhdGEoJ19pbnB1dG1hc2snKVsnb3B0cyddLmF1dG9Vbm1hc2spXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZWxlbS5pbnB1dG1hc2soJ3VubWFza2VkdmFsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbHVlR2V0KGVsZW0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXREYXRhID0gJGVsZW0uZGF0YSgnX2lucHV0bWFzaycpLCBtYXNrc2V0cyA9IGlucHV0RGF0YVsnbWFza3NldHMnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IGlucHV0RGF0YVsnYWN0aXZlTWFza3NldEluZGV4J107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQgIT0gbWFza3NldHNbYWN0aXZlTWFza3NldEluZGV4XVsnX2J1ZmZlciddLmpvaW4oJycpID8gcmVzdWx0IDogJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZUdldChlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAoZWxlbSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVTZXQoZWxlbSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRlbGVtLmRhdGEoJ19pbnB1dG1hc2snKSkgJGVsZW0udHJpZ2dlckhhbmRsZXIoJ3NldHZhbHVlLmlucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRtYXNrcGF0Y2g6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9zaGlmdCBjaGFycyB0byBsZWZ0IGZyb20gc3RhcnQgdG8gZW5kIGFuZCBwdXQgYyBhdCBlbmQgcG9zaXRpb24gaWYgZGVmaW5lZFxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzaGlmdEwoc3RhcnQsIGVuZCwgYywgbWFza0p1bXBzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IGdldEFjdGl2ZUJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIGlmIChtYXNrSnVtcHMgIT09IGZhbHNlKSAvL2p1bXBpbmcgb3ZlciBub25tYXNrIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICghaXNNYXNrKHN0YXJ0KSAmJiBzdGFydCAtIDEgPj0gMCkgc3RhcnQtLTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQgJiYgaSA8IGdldE1hc2tMZW5ndGgoKSA7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXNrKGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRSZVRhcmdldFBsYWNlSG9sZGVyKGJ1ZmZlciwgaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaiA9IHNlZWtOZXh0KGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBnZXRCdWZmZXJFbGVtZW50KGJ1ZmZlciwgaik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocCAhPSBnZXRQbGFjZUhvbGRlcihqKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqIDwgZ2V0TWFza0xlbmd0aCgpICYmIGlzVmFsaWQoaSwgcCwgdHJ1ZSkgIT09IGZhbHNlICYmIGdldEFjdGl2ZVRlc3RzKClbZGV0ZXJtaW5lVGVzdFBvc2l0aW9uKGkpXS5kZWYgPT0gZ2V0QWN0aXZlVGVzdHMoKVtkZXRlcm1pbmVUZXN0UG9zaXRpb24oaildLmRlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRCdWZmZXJFbGVtZW50KGJ1ZmZlciwgaSwgcCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFzayhpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFJlVGFyZ2V0UGxhY2VIb2xkZXIoYnVmZmVyLCBpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYyAhPSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgIHNldEJ1ZmZlckVsZW1lbnQoYnVmZmVyLCBzZWVrUHJldmlvdXMoZW5kKSwgYyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZ2V0QWN0aXZlTWFza1NldCgpW1wiZ3JlZWR5XCJdID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmJ1ZmZlciA9IHRydW5jYXRlSW5wdXQoYnVmZmVyLmpvaW4oJycpKS5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlci5sZW5ndGggPSB0cmJ1ZmZlci5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBibCA9IGJ1ZmZlci5sZW5ndGg7IGkgPCBibDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSB0cmJ1ZmZlcltpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PSAwKSBnZXRBY3RpdmVNYXNrU2V0KClbXCJidWZmZXJcIl0gPSBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdGFydDsgLy9yZXR1cm4gdGhlIHVzZWQgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc2hpZnRSKHN0YXJ0LCBlbmQsIGMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKGdldEJ1ZmZlckVsZW1lbnQoYnVmZmVyLCBzdGFydCwgdHJ1ZSkgIT0gZ2V0UGxhY2VIb2xkZXIoc3RhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBzZWVrUHJldmlvdXMoZW5kKSA7IGkgPiBzdGFydCAmJiBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFzayhpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqID0gc2Vla1ByZXZpb3VzKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ID0gZ2V0QnVmZmVyRWxlbWVudChidWZmZXIsIGopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ICE9IGdldFBsYWNlSG9sZGVyKGopKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkKGosIHQsIHRydWUpICE9PSBmYWxzZSAmJiBnZXRBY3RpdmVUZXN0cygpW2RldGVybWluZVRlc3RQb3NpdGlvbihpKV0uZGVmID09IGdldEFjdGl2ZVRlc3RzKClbZGV0ZXJtaW5lVGVzdFBvc2l0aW9uKGopXS5kZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEJ1ZmZlckVsZW1lbnQoYnVmZmVyLCBpLCB0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFJlVGFyZ2V0UGxhY2VIb2xkZXIoYnVmZmVyLCBqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAvL2Vsc2UgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVUYXJnZXRQbGFjZUhvbGRlcihidWZmZXIsIGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjICE9IHVuZGVmaW5lZCAmJiBnZXRCdWZmZXJFbGVtZW50KGJ1ZmZlciwgc3RhcnQpID09IGdldFBsYWNlSG9sZGVyKHN0YXJ0KSlcbiAgICAgICAgICAgICAgICAgICAgc2V0QnVmZmVyRWxlbWVudChidWZmZXIsIHN0YXJ0LCBjKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoQmVmb3JlID0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAoZ2V0QWN0aXZlTWFza1NldCgpW1wiZ3JlZWR5XCJdID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmJ1ZmZlciA9IHRydW5jYXRlSW5wdXQoYnVmZmVyLmpvaW4oJycpKS5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlci5sZW5ndGggPSB0cmJ1ZmZlci5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBibCA9IGJ1ZmZlci5sZW5ndGg7IGkgPCBibDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSB0cmJ1ZmZlcltpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PSAwKSBnZXRBY3RpdmVNYXNrU2V0KClbXCJidWZmZXJcIl0gPSBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbmQgLSAobGVuZ3RoQmVmb3JlIC0gYnVmZmVyLmxlbmd0aCk7IC8vcmV0dXJuIG5ldyBzdGFydCBwb3NpdGlvblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBIYW5kbGVSZW1vdmUoaW5wdXQsIGssIHBvcykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLm51bWVyaWNJbnB1dCB8fCBpc1JUTCkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrID0gb3B0cy5rZXlDb2RlLkRFTEVURTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugb3B0cy5rZXlDb2RlLkRFTEVURTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrID0gb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSVEwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwZW5kID0gcG9zLmVuZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5lbmQgPSBwb3MuYmVnaW47XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MuYmVnaW4gPSBwZW5kO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGlzU2VsZWN0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAocG9zLmJlZ2luID09IHBvcy5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc0JlZ2luID0gayA9PSBvcHRzLmtleUNvZGUuQkFDS1NQQUNFID8gcG9zLmJlZ2luIC0gMSA6IHBvcy5iZWdpbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuaXNOdW1lcmljICYmIG9wdHMucmFkaXhQb2ludCAhPSBcIlwiICYmIGdldEFjdGl2ZUJ1ZmZlcigpW3Bvc0JlZ2luXSA9PSBvcHRzLnJhZGl4UG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5iZWdpbiA9IChnZXRBY3RpdmVCdWZmZXIoKS5sZW5ndGggLSAxID09IHBvc0JlZ2luKSAvKiByYWRpeFBvaW50IGlzIGxhdGVzdD8gZGVsZXRlIGl0ICovID8gcG9zLmJlZ2luIDogayA9PSBvcHRzLmtleUNvZGUuQkFDS1NQQUNFID8gcG9zQmVnaW4gOiBzZWVrTmV4dChwb3NCZWdpbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MuZW5kID0gcG9zLmJlZ2luO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlzU2VsZWN0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrID09IG9wdHMua2V5Q29kZS5CQUNLU1BBQ0UpXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MuYmVnaW4tLTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoayA9PSBvcHRzLmtleUNvZGUuREVMRVRFKVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zLmVuZCsrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocG9zLmVuZCAtIHBvcy5iZWdpbiA9PSAxICYmICFvcHRzLmluc2VydE1vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNTZWxlY3Rpb24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGsgPT0gb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5iZWdpbi0tO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNsZWFyQnVmZmVyKGdldEFjdGl2ZUJ1ZmZlcigpLCBwb3MuYmVnaW4sIHBvcy5lbmQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIG1sID0gZ2V0TWFza0xlbmd0aCgpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmdyZWVkeSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEwocG9zLmJlZ2luLCBtbCwgdW5kZWZpbmVkLCAhaXNSVEwgJiYgKGsgPT0gb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRSAmJiAhaXNTZWxlY3Rpb24pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3cG9zID0gcG9zLmJlZ2luO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gcG9zLmJlZ2luOyBpIDwgcG9zLmVuZDsgaSsrKSB7IC8vc2Vla25leHQgdG8gc2tpcCBwbGFjZWhvbGRlcnMgYXQgc3RhcnQgaW4gc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNYXNrKGkpIHx8ICFpc1NlbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdwb3MgPSBzaGlmdEwocG9zLmJlZ2luLCBtbCwgdW5kZWZpbmVkLCAhaXNSVEwgJiYgKGsgPT0gb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRSAmJiAhaXNTZWxlY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU2VsZWN0aW9uKSBwb3MuYmVnaW4gPSBuZXdwb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBmaXJzdE1hc2tQb3MgPSBzZWVrTmV4dCgtMSk7XG4gICAgICAgICAgICAgICAgY2xlYXJCdWZmZXIoZ2V0QWN0aXZlQnVmZmVyKCksIHBvcy5iZWdpbiwgcG9zLmVuZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY2hlY2tWYWwoaW5wdXQsIGZhbHNlLCBtYXNrc2V0c1sxXSA9PSB1bmRlZmluZWQgfHwgZmlyc3RNYXNrUG9zID49IHBvcy5lbmQsIGdldEFjdGl2ZUJ1ZmZlcigpKTtcbiAgICAgICAgICAgICAgICBpZiAoZ2V0QWN0aXZlTWFza1NldCgpWydsYXN0VmFsaWRQb3NpdGlvbiddIDwgZmlyc3RNYXNrUG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVtcInBcIl0gPSBmaXJzdE1hc2tQb3M7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0QWN0aXZlTWFza1NldCgpW1wicFwiXSA9IHBvcy5iZWdpbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGtleWRvd25FdmVudChlKSB7XG4gICAgICAgICAgICAgICAgLy9TYWZhcmkgNS4xLnggLSBtb2RhbCBkaWFsb2cgZmlyZXMga2V5cHJlc3MgdHdpY2Ugd29ya2Fyb3VuZFxuICAgICAgICAgICAgICAgIHNraXBLZXlQcmVzc0V2ZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcywgJGlucHV0ID0gJChpbnB1dCksIGsgPSBlLmtleUNvZGUsIHBvcyA9IGNhcmV0KGlucHV0KTtcblxuICAgICAgICAgICAgICAgIC8vYmFja3NwYWNlLCBkZWxldGUsIGFuZCBlc2NhcGUgZ2V0IHNwZWNpYWwgdHJlYXRtZW50XG4gICAgICAgICAgICAgICAgaWYgKGsgPT0gb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRSB8fCBrID09IG9wdHMua2V5Q29kZS5ERUxFVEUgfHwgKGlwaG9uZSAmJiBrID09IDEyNykgfHwgZS5jdHJsS2V5ICYmIGsgPT0gODgpIHsgLy9iYWNrc3BhY2UvZGVsZXRlXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsgLy9zdG9wIGRlZmF1bHQgYWN0aW9uIGJ1dCBhbGxvdyBwcm9wYWdhdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoayA9PSA4OCkgdmFsdWVPbkZvY3VzID0gZ2V0QWN0aXZlQnVmZmVyKCkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgIEhhbmRsZVJlbW92ZShpbnB1dCwgaywgcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgZGV0ZXJtaW5lQWN0aXZlTWFza3NldEluZGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlQnVmZmVyKGlucHV0LCBnZXRBY3RpdmVCdWZmZXIoKSwgZ2V0QWN0aXZlTWFza1NldCgpW1wicFwiXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5fdmFsdWVHZXQoKSA9PSBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLmpvaW4oJycpKVxuICAgICAgICAgICAgICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2NsZWFyZWQnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5zaG93VG9vbHRpcCkgeyAvL3VwZGF0ZSB0b29sdGlwXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQucHJvcChcInRpdGxlXCIsIGdldEFjdGl2ZU1hc2tTZXQoKVtcIm1hc2tcIl0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChrID09IG9wdHMua2V5Q29kZS5FTkQgfHwgayA9PSBvcHRzLmtleUNvZGUuUEFHRV9ET1dOKSB7IC8vd2hlbiBFTkQgb3IgUEFHRV9ET1dOIHByZXNzZWQgc2V0IHBvc2l0aW9uIGF0IGxhc3RtYXRjaFxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYXJldFBvcyA9IHNlZWtOZXh0KGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0cy5pbnNlcnRNb2RlICYmIGNhcmV0UG9zID09IGdldE1hc2tMZW5ndGgoKSAmJiAhZS5zaGlmdEtleSkgY2FyZXRQb3MtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmV0KGlucHV0LCBlLnNoaWZ0S2V5ID8gcG9zLmJlZ2luIDogY2FyZXRQb3MsIGNhcmV0UG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgoayA9PSBvcHRzLmtleUNvZGUuSE9NRSAmJiAhZS5zaGlmdEtleSkgfHwgayA9PSBvcHRzLmtleUNvZGUuUEFHRV9VUCkgeyAvL0hvbWUgb3IgcGFnZV91cFxuICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgMCwgZS5zaGlmdEtleSA/IHBvcy5iZWdpbiA6IDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoayA9PSBvcHRzLmtleUNvZGUuRVNDQVBFIHx8IChrID09IDkwICYmIGUuY3RybEtleSkpIHsgLy9lc2NhcGUgJiYgdW5kb1xuICAgICAgICAgICAgICAgICAgICBjaGVja1ZhbChpbnB1dCwgdHJ1ZSwgZmFsc2UsIHZhbHVlT25Gb2N1cy5zcGxpdCgnJykpO1xuICAgICAgICAgICAgICAgICAgICAkaW5wdXQuY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGsgPT0gb3B0cy5rZXlDb2RlLklOU0VSVCAmJiAhKGUuc2hpZnRLZXkgfHwgZS5jdHJsS2V5KSkgeyAvL2luc2VydFxuICAgICAgICAgICAgICAgICAgICBvcHRzLmluc2VydE1vZGUgPSAhb3B0cy5pbnNlcnRNb2RlO1xuICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgIW9wdHMuaW5zZXJ0TW9kZSAmJiBwb3MuYmVnaW4gPT0gZ2V0TWFza0xlbmd0aCgpID8gcG9zLmJlZ2luIC0gMSA6IHBvcy5iZWdpbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRzLmluc2VydE1vZGUgPT0gZmFsc2UgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGsgPT0gb3B0cy5rZXlDb2RlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZXRQb3MgPSBjYXJldChpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZXQoaW5wdXQsIGNhcmV0UG9zLmJlZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGsgPT0gb3B0cy5rZXlDb2RlLkxFRlQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYXJldFBvcyA9IGNhcmV0KGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgY2FyZXRQb3MuYmVnaW4gLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRDYXJldFBvcyA9IGNhcmV0KGlucHV0KTtcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5vbktleURvd24uY2FsbCh0aGlzLCBlLCBnZXRBY3RpdmVCdWZmZXIoKSwgb3B0cykgPT09IHRydWUpIC8vZXh0cmEgc3R1ZmYgdG8gZXhlY3V0ZSBvbiBrZXlkb3duXG4gICAgICAgICAgICAgICAgICAgIGNhcmV0KGlucHV0LCBjdXJyZW50Q2FyZXRQb3MuYmVnaW4sIGN1cnJlbnRDYXJldFBvcy5lbmQpO1xuICAgICAgICAgICAgICAgIGlnbm9yYWJsZSA9ICQuaW5BcnJheShrLCBvcHRzLmlnbm9yYWJsZXMpICE9IC0xO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGtleXByZXNzRXZlbnQoZSwgY2hlY2t2YWwsIGssIHdyaXRlT3V0LCBzdHJpY3QsIG5keCkge1xuICAgICAgICAgICAgICAgIC8vU2FmYXJpIDUuMS54IC0gbW9kYWwgZGlhbG9nIGZpcmVzIGtleXByZXNzIHR3aWNlIHdvcmthcm91bmRcbiAgICAgICAgICAgICAgICBpZiAoayA9PSB1bmRlZmluZWQgJiYgc2tpcEtleVByZXNzRXZlbnQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICBza2lwS2V5UHJlc3NFdmVudCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLCAkaW5wdXQgPSAkKGlucHV0KTtcblxuICAgICAgICAgICAgICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB2YXIgayA9IGNoZWNrdmFsID8gayA6IChlLndoaWNoIHx8IGUuY2hhckNvZGUgfHwgZS5rZXlDb2RlKTtcblxuICAgICAgICAgICAgICAgIGlmIChjaGVja3ZhbCAhPT0gdHJ1ZSAmJiAoIShlLmN0cmxLZXkgJiYgZS5hbHRLZXkpICYmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGlnbm9yYWJsZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NwZWNpYWwgdHJlYXQgdGhlIGRlY2ltYWwgc2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2t2YWwgIT09IHRydWUgJiYgayA9PSA0NiAmJiBlLnNoaWZ0S2V5ID09IGZhbHNlICYmIG9wdHMucmFkaXhQb2ludCA9PSBcIixcIikgayA9IDQ0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG9zLCByZXN1bHRzLCByZXN1bHQsIGMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGspO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBjYXJldCA9IHN0cmljdCA/IG5keCA6IGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3MgPSB7IGJlZ2luOiBwY2FyZXQsIGVuZDogcGNhcmV0IH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcyA9IGNhcmV0KGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zaG91bGQgd2UgY2xlYXIgYSBwb3NzaWJsZSBzZWxlY3Rpb24/P1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzU2xjdG4gPSBpc1NlbGVjdGlvbihwb3MuYmVnaW4sIHBvcy5lbmQpLCByZWRldGVybWluZUxWUCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxJbmRleCA9IGFjdGl2ZU1hc2tzZXRJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1NsY3RuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gaW5pdGlhbEluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChtYXNrc2V0cywgZnVuY3Rpb24gKG5keCwgbG1udCkgeyAvL2luaXQgdW5kb2J1ZmZlciBmb3IgcmVjb3Zlcnkgd2hlbiBub3QgdmFsaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAobG1udCkgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gbmR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QWN0aXZlTWFza1NldCgpW1widW5kb0J1ZmZlclwiXSA9IGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSGFuZGxlUmVtb3ZlKGlucHV0LCBvcHRzLmtleUNvZGUuREVMRVRFLCBwb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0cy5pbnNlcnRNb2RlKSB7IC8vcHJlc2VydmUgc29tZSBzcGFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gobWFza3NldHMsIGZ1bmN0aW9uIChuZHgsIGxtbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKGxtbnQpID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVNYXNrc2V0SW5kZXggPSBuZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hpZnRSKHBvcy5iZWdpbiwgZ2V0TWFza0xlbmd0aCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRBY3RpdmVNYXNrU2V0KClbXCJsYXN0VmFsaWRQb3NpdGlvblwiXSA9IHNlZWtOZXh0KGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IGluaXRpYWxJbmRleDsgLy9yZXN0b3JlIGluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByYWRpeFBvc2l0aW9uID0gZ2V0QWN0aXZlQnVmZmVyKCkuam9pbignJykuaW5kZXhPZihvcHRzLnJhZGl4UG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuaXNOdW1lcmljICYmIGNoZWNrdmFsICE9PSB0cnVlICYmIHJhZGl4UG9zaXRpb24gIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5ncmVlZHkgJiYgcG9zLmJlZ2luIDw9IHJhZGl4UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zLmJlZ2luID0gc2Vla1ByZXZpb3VzKHBvcy5iZWdpbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5lbmQgPSBwb3MuYmVnaW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09IG9wdHMucmFkaXhQb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3MuYmVnaW4gPSByYWRpeFBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3MuZW5kID0gcG9zLmJlZ2luO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IHBvcy5iZWdpbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSBpc1ZhbGlkKHAsIGMsIHN0cmljdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ID09PSB0cnVlKSByZXN1bHRzID0gW3sgXCJhY3RpdmVNYXNrc2V0SW5kZXhcIjogYWN0aXZlTWFza3NldEluZGV4LCBcInJlc3VsdFwiOiByZXN1bHRzIH1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1pbmltYWxGb3J3YXJkUG9zaXRpb24gPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChyZXN1bHRzLCBmdW5jdGlvbiAoaW5kZXgsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IHJlc3VsdFtcImFjdGl2ZU1hc2tzZXRJbmRleFwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRBY3RpdmVNYXNrU2V0KClbXCJ3cml0ZU91dEJ1ZmZlclwiXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5wID0gcmVzdWx0W1wicmVzdWx0XCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChucCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZnJlc2ggPSBmYWxzZSwgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChucCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaCA9IG5wW1wicmVmcmVzaFwiXTsgLy9vbmx5IHJld3JpdGUgYnVmZmVyIGZyb20gaXNWYWxpZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IG5wLnBvcyAhPSB1bmRlZmluZWQgPyBucC5wb3MgOiBwOyAvL3NldCBuZXcgcG9zaXRpb24gZnJvbSBpc1ZhbGlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjID0gbnAuYyAhPSB1bmRlZmluZWQgPyBucC5jIDogYzsgLy9zZXQgbmV3IGNoYXIgZnJvbSBpc1ZhbGlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZnJlc2ggIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmluc2VydE1vZGUgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VW5tYXNrZWRQb3NpdGlvbiA9IGdldE1hc2tMZW5ndGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmZyQ2xvbmUgPSBidWZmZXIuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZ2V0QnVmZmVyRWxlbWVudChiZnJDbG9uZSwgbGFzdFVubWFza2VkUG9zaXRpb24sIHRydWUpICE9IGdldFBsYWNlSG9sZGVyKGxhc3RVbm1hc2tlZFBvc2l0aW9uKSAmJiBsYXN0VW5tYXNrZWRQb3NpdGlvbiA+PSBwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RVbm1hc2tlZFBvc2l0aW9uID0gbGFzdFVubWFza2VkUG9zaXRpb24gPT0gMCA/IC0xIDogc2Vla1ByZXZpb3VzKGxhc3RVbm1hc2tlZFBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RVbm1hc2tlZFBvc2l0aW9uID49IHApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hpZnRSKHAsIGdldE1hc2tMZW5ndGgoKSwgYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vc2hpZnQgdGhlIGx2cCBpZiBuZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGx2cCA9IGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdLCBubHZwID0gc2Vla05leHQobHZwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5sdnAgIT0gZ2V0TWFza0xlbmd0aCgpICYmIGx2cCA+PSBwICYmIChnZXRCdWZmZXJFbGVtZW50KGdldEFjdGl2ZUJ1ZmZlcigpLCBubHZwLCB0cnVlKSAhPSBnZXRQbGFjZUhvbGRlcihubHZwKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdID0gbmx2cDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBnZXRBY3RpdmVNYXNrU2V0KClbXCJ3cml0ZU91dEJ1ZmZlclwiXSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHNldEJ1ZmZlckVsZW1lbnQoYnVmZmVyLCBwLCBjLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW5pbWFsRm9yd2FyZFBvc2l0aW9uID09IC0xIHx8IG1pbmltYWxGb3J3YXJkUG9zaXRpb24gPiBzZWVrTmV4dChwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltYWxGb3J3YXJkUG9zaXRpb24gPSBzZWVrTmV4dChwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dFBvcyA9IHAgPCBnZXRNYXNrTGVuZ3RoKCkgPyBwICsgMSA6IHA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWluaW1hbEZvcndhcmRQb3NpdGlvbiA9PSAtMSB8fCBtaW5pbWFsRm9yd2FyZFBvc2l0aW9uID4gbmV4dFBvcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltYWxGb3J3YXJkUG9zaXRpb24gPSBuZXh0UG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW5pbWFsRm9yd2FyZFBvc2l0aW9uID4gZ2V0QWN0aXZlTWFza1NldCgpW1wicFwiXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVtcInBcIl0gPSBtaW5pbWFsRm9yd2FyZFBvc2l0aW9uOyAvL25lZWRlZCBmb3IgY2hlY2t2YWwgc3RyaWN0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlTWFza3NldEluZGV4ID0gaW5pdGlhbEluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGVybWluZUFjdGl2ZU1hc2tzZXRJbmRleCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdyaXRlT3V0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChyZXN1bHRzLCBmdW5jdGlvbiAobmR4LCByc2x0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyc2x0W1wiYWN0aXZlTWFza3NldEluZGV4XCJdID09IGFjdGl2ZU1hc2tzZXRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcnNsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IG9wdHMub25LZXlWYWxpZGF0aW9uLmNhbGwoc2VsZiwgcmVzdWx0W1wicmVzdWx0XCJdLCBvcHRzKTsgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRBY3RpdmVNYXNrU2V0KClbXCJ3cml0ZU91dEJ1ZmZlclwiXSAmJiByZXN1bHRbXCJyZXN1bHRcIl0gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdDYXJldFBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZXRQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0cy5udW1lcmljSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocCA+IHJhZGl4UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZXRQb3NpdGlvbiA9IHNlZWtQcmV2aW91cyhtaW5pbWFsRm9yd2FyZFBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGMgPT0gb3B0cy5yYWRpeFBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NhcmV0UG9zaXRpb24gPSBtaW5pbWFsRm9yd2FyZFBvc2l0aW9uIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgbmV3Q2FyZXRQb3NpdGlvbiA9IHNlZWtQcmV2aW91cyhtaW5pbWFsRm9yd2FyZFBvc2l0aW9uIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NhcmV0UG9zaXRpb24gPSBtaW5pbWFsRm9yd2FyZFBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ1ZmZlcihpbnB1dCwgYnVmZmVyLCBuZXdDYXJldFBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGVja3ZhbCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAvL3RpbWVvdXQgbmVlZGVkIGZvciBJRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNDb21wbGV0ZShidWZmZXIpID09PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2tpcElucHV0RXZlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQudHJpZ2dlcihcImlucHV0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzU2xjdG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVtcImJ1ZmZlclwiXSA9IGdldEFjdGl2ZU1hc2tTZXQoKVtcInVuZG9CdWZmZXJcIl0uc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5zaG93VG9vbHRpcCkgeyAvL3VwZGF0ZSB0b29sdGlwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGlucHV0LnByb3AoXCJ0aXRsZVwiLCBnZXRBY3RpdmVNYXNrU2V0KClbXCJtYXNrXCJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9uZWVkZWQgZm9yIElFOCBhbmQgYmVsb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlKSBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBrZXl1cEV2ZW50KGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKSwgaW5wdXQgPSB0aGlzLCBrID0gZS5rZXlDb2RlLCBidWZmZXIgPSBnZXRBY3RpdmVCdWZmZXIoKTtcblxuICAgICAgICAgICAgICAgIGlmIChhbmRyb2lkY2hyb21lICYmIGsgPT0gb3B0cy5rZXlDb2RlLkJBQ0tTUEFDRSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hyb21lVmFsdWVPbklucHV0ID09IGlucHV0Ll92YWx1ZUdldCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAga2V5ZG93bkV2ZW50LmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3B0cy5vbktleVVwLmNhbGwodGhpcywgZSwgYnVmZmVyLCBvcHRzKTsgLy9leHRyYSBzdHVmZiB0byBleGVjdXRlIG9uIGtleXVwXG4gICAgICAgICAgICAgICAgaWYgKGsgPT0gb3B0cy5rZXlDb2RlLlRBQiAmJiBvcHRzLnNob3dNYXNrT25Gb2N1cykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGlucHV0Lmhhc0NsYXNzKCdmb2N1cy5pbnB1dG1hc2snKSAmJiBpbnB1dC5fdmFsdWVHZXQoKS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyVGVtcGxhdGUoKS5zbGljZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCdWZmZXIoaW5wdXQsIGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZU9uRm9jdXMgPSBnZXRBY3RpdmVCdWZmZXIoKS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnVmZmVyKGlucHV0LCBidWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ1ZmZlci5qb2luKCcnKSA9PSBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLmpvaW4oJycpICYmICQuaW5BcnJheShvcHRzLnJhZGl4UG9pbnQsIGJ1ZmZlcikgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgVHJhbnNsYXRlUG9zaXRpb24oMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpbnB1dC5jbGljaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZXQoaW5wdXQsIFRyYW5zbGF0ZVBvc2l0aW9uKDApLCBUcmFuc2xhdGVQb3NpdGlvbihnZXRNYXNrTGVuZ3RoKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaW5wdXRFdmVudChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNraXBJbnB1dEV2ZW50ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNraXBJbnB1dEV2ZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLCAkaW5wdXQgPSAkKGlucHV0KTtcblxuICAgICAgICAgICAgICAgIGNocm9tZVZhbHVlT25JbnB1dCA9IGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIGNoZWNrVmFsKGlucHV0LCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHdyaXRlQnVmZmVyKGlucHV0LCBnZXRBY3RpdmVCdWZmZXIoKSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzQ29tcGxldGUoZ2V0QWN0aXZlQnVmZmVyKCkpID09PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAkaW5wdXQudHJpZ2dlcihcImNvbXBsZXRlXCIpO1xuICAgICAgICAgICAgICAgICRpbnB1dC5jbGljaygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBtYXNrKGVsKSB7XG4gICAgICAgICAgICAgICAgJGVsID0gJChlbCk7XG4gICAgICAgICAgICAgICAgaWYgKCRlbC5pcyhcIjppbnB1dFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAvL3N0b3JlIHRlc3RzICYgb3JpZ2luYWwgYnVmZmVyIGluIHRoZSBpbnB1dCBlbGVtZW50IC0gdXNlZCB0byBnZXQgdGhlIHVubWFza2VkIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICRlbC5kYXRhKCdfaW5wdXRtYXNrJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21hc2tzZXRzJzogbWFza3NldHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYWN0aXZlTWFza3NldEluZGV4JzogYWN0aXZlTWFza3NldEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgJ29wdHMnOiBvcHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lzUlRMJzogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9zaG93IHRvb2x0aXBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuc2hvd1Rvb2x0aXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5wcm9wKFwidGl0bGVcIiwgZ2V0QWN0aXZlTWFza1NldCgpW1wibWFza1wiXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvL2NvcnJlY3QgZ3JlZWR5IHNldHRpbmcgaWYgbmVlZGVkXG4gICAgICAgICAgICAgICAgICAgIGdldEFjdGl2ZU1hc2tTZXQoKVsnZ3JlZWR5J10gPSBnZXRBY3RpdmVNYXNrU2V0KClbJ2dyZWVkeSddID8gZ2V0QWN0aXZlTWFza1NldCgpWydncmVlZHknXSA6IGdldEFjdGl2ZU1hc2tTZXQoKVsncmVwZWF0J10gPT0gMDtcblxuICAgICAgICAgICAgICAgICAgICAvL2hhbmRsZSBtYXhsZW5ndGggYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgIGlmICgkZWwuYXR0cihcIm1heExlbmd0aFwiKSAhPSBudWxsKSAvL29ubHkgd2hlbiB0aGUgYXR0cmlidXRlIGlzIHNldFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWF4TGVuZ3RoID0gJGVsLnByb3AoJ21heExlbmd0aCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heExlbmd0aCA+IC0xKSB7IC8vaGFuZGxlICotcmVwZWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKG1hc2tzZXRzLCBmdW5jdGlvbiAobmR4LCBtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChtcykgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1zW1wicmVwZWF0XCJdID09IFwiKlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXNbXCJyZXBlYXRcIl0gPSBtYXhMZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRNYXNrTGVuZ3RoKCkgPj0gbWF4TGVuZ3RoICYmIG1heExlbmd0aCA+IC0xKSB7IC8vRkYgc2V0cyBubyBkZWZpbmVkIG1heCBsZW5ndGggdG8gLTEgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heExlbmd0aCA8IGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKCkubGVuZ3RoKSBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLmxlbmd0aCA9IG1heExlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0QWN0aXZlTWFza1NldCgpWydncmVlZHknXSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRBY3RpdmVNYXNrU2V0KClbJ3JlcGVhdCddID0gTWF0aC5yb3VuZChtYXhMZW5ndGggLyBnZXRBY3RpdmVCdWZmZXJUZW1wbGF0ZSgpLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRlbC5wcm9wKCdtYXhMZW5ndGgnLCBnZXRNYXNrTGVuZ3RoKCkgKiAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHBhdGNoVmFsdWVQcm9wZXJ0eShlbCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubnVtZXJpY0lucHV0KSBvcHRzLmlzTnVtZXJpYyA9IG9wdHMubnVtZXJpY0lucHV0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWwuZGlyID09IFwicnRsXCIgfHwgKG9wdHMubnVtZXJpY0lucHV0ICYmIG9wdHMucmlnaHRBbGlnbk51bWVyaWNzKSB8fCAob3B0cy5pc051bWVyaWMgJiYgb3B0cy5yaWdodEFsaWduTnVtZXJpY3MpKVxuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmNzcyhcInRleHQtYWxpZ25cIiwgXCJyaWdodFwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZWwuZGlyID09IFwicnRsXCIgfHwgb3B0cy5udW1lcmljSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLmRpciA9IFwibHRyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWwucmVtb3ZlQXR0cihcImRpclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSAkZWwuZGF0YSgnX2lucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXREYXRhWydpc1JUTCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5kYXRhKCdfaW5wdXRtYXNrJywgaW5wdXREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUlRMID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vdW5iaW5kIGFsbCBldmVudHMgLSB0byBtYWtlIHN1cmUgdGhhdCBubyBvdGhlciBtYXNrIHdpbGwgaW50ZXJmZXJlIHdoZW4gcmUtbWFza2luZ1xuICAgICAgICAgICAgICAgICAgICAkZWwudW5iaW5kKFwiLmlucHV0bWFza1wiKTtcbiAgICAgICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdmb2N1cy5pbnB1dG1hc2snKTtcbiAgICAgICAgICAgICAgICAgICAgLy9iaW5kIGV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAkZWwuY2xvc2VzdCgnZm9ybScpLmJpbmQoXCJzdWJtaXRcIiwgZnVuY3Rpb24gKCkgeyAvL3RyaWdnZXIgY2hhbmdlIG9uIHN1Ym1pdCBpZiBhbnlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZU9uRm9jdXMgIT0gZ2V0QWN0aXZlQnVmZmVyKCkuam9pbignJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZWwuY2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLmJpbmQoJ3Jlc2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsLnRyaWdnZXIoXCJzZXR2YWx1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJGVsLmJpbmQoXCJtb3VzZWVudGVyLmlucHV0bWFza1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKSwgaW5wdXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkaW5wdXQuaGFzQ2xhc3MoJ2ZvY3VzLmlucHV0bWFzaycpICYmIG9wdHMuc2hvd01hc2tPbkhvdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0Ll92YWx1ZUdldCgpICE9IGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnVmZmVyKGlucHV0LCBnZXRBY3RpdmVCdWZmZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KS5iaW5kKFwiYmx1ci5pbnB1dG1hc2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyksIGlucHV0ID0gdGhpcywgbnB0VmFsdWUgPSBpbnB1dC5fdmFsdWVHZXQoKSwgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQucmVtb3ZlQ2xhc3MoJ2ZvY3VzLmlucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlT25Gb2N1cyAhPSBnZXRBY3RpdmVCdWZmZXIoKS5qb2luKCcnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpbnB1dC5jaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmNsZWFyTWFza09uTG9zdEZvY3VzICYmIG5wdFZhbHVlICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5wdFZhbHVlID09IGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKCkuam9pbignJykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Ll92YWx1ZVNldCgnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7IC8vY2xlYXJvdXQgb3B0aW9uYWwgdGFpbCBvZiB0aGUgbWFza1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhck9wdGlvbmFsVGFpbChpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ29tcGxldGUoYnVmZmVyKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQudHJpZ2dlcihcImluY29tcGxldGVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuY2xlYXJJbmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChtYXNrc2V0cywgZnVuY3Rpb24gKG5keCwgbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKG1zKSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXNbXCJidWZmZXJcIl0gPSBtc1tcIl9idWZmZXJcIl0uc2xpY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtc1tcImxhc3RWYWxpZFBvc2l0aW9uXCJdID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVNYXNrc2V0SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5jbGVhck1hc2tPbkxvc3RGb2N1cylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Ll92YWx1ZVNldCgnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gZ2V0QWN0aXZlQnVmZmVyVGVtcGxhdGUoKS5zbGljZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGVCdWZmZXIoaW5wdXQsIGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLmJpbmQoXCJmb2N1cy5pbnB1dG1hc2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyksIGlucHV0ID0gdGhpcywgbnB0VmFsdWUgPSBpbnB1dC5fdmFsdWVHZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnNob3dNYXNrT25Gb2N1cyAmJiAhJGlucHV0Lmhhc0NsYXNzKCdmb2N1cy5pbnB1dG1hc2snKSAmJiAoIW9wdHMuc2hvd01hc2tPbkhvdmVyIHx8IChvcHRzLnNob3dNYXNrT25Ib3ZlciAmJiBucHRWYWx1ZSA9PSAnJykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0Ll92YWx1ZUdldCgpICE9IGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRlQnVmZmVyKGlucHV0LCBnZXRBY3RpdmVCdWZmZXIoKSwgc2Vla05leHQoZ2V0QWN0aXZlTWFza1NldCgpW1wibGFzdFZhbGlkUG9zaXRpb25cIl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQuYWRkQ2xhc3MoJ2ZvY3VzLmlucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVPbkZvY3VzID0gZ2V0QWN0aXZlQnVmZmVyKCkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmJpbmQoXCJtb3VzZWxlYXZlLmlucHV0bWFza1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKSwgaW5wdXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuY2xlYXJNYXNrT25Mb3N0Rm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRpbnB1dC5oYXNDbGFzcygnZm9jdXMuaW5wdXRtYXNrJykgJiYgaW5wdXQuX3ZhbHVlR2V0KCkgIT0gJGlucHV0LmF0dHIoXCJwbGFjZWhvbGRlclwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuX3ZhbHVlR2V0KCkgPT0gZ2V0QWN0aXZlQnVmZmVyVGVtcGxhdGUoKS5qb2luKCcnKSB8fCBpbnB1dC5fdmFsdWVHZXQoKSA9PSAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Ll92YWx1ZVNldCgnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgeyAvL2NsZWFyb3V0IG9wdGlvbmFsIHRhaWwgb2YgdGhlIG1hc2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyT3B0aW9uYWxUYWlsKGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkuYmluZChcImNsaWNrLmlucHV0bWFza1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkQ2FyZXQgPSBjYXJldChpbnB1dCksIGJ1ZmZlciA9IGdldEFjdGl2ZUJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZENhcmV0LmJlZ2luID09IHNlbGVjdGVkQ2FyZXQuZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbGlja1Bvc2l0aW9uID0gaXNSVEwgPyBUcmFuc2xhdGVQb3NpdGlvbihzZWxlY3RlZENhcmV0LmJlZ2luKSA6IHNlbGVjdGVkQ2FyZXQuYmVnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsdnAgPSBnZXRBY3RpdmVNYXNrU2V0KClbXCJsYXN0VmFsaWRQb3NpdGlvblwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuaXNOdW1lcmljKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0UG9zaXRpb24gPSBvcHRzLnNraXBSYWRpeERhbmNlID09PSBmYWxzZSAmJiBvcHRzLnJhZGl4UG9pbnQgIT0gXCJcIiAmJiAkLmluQXJyYXkob3B0cy5yYWRpeFBvaW50LCBidWZmZXIpICE9IC0xID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAob3B0cy5udW1lcmljSW5wdXQgPyBzZWVrTmV4dCgkLmluQXJyYXkob3B0cy5yYWRpeFBvaW50LCBidWZmZXIpKSA6ICQuaW5BcnJheShvcHRzLnJhZGl4UG9pbnQsIGJ1ZmZlcikpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWVrTmV4dChsdnApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFBvc2l0aW9uID0gc2Vla05leHQobHZwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xpY2tQb3NpdGlvbiA8IGxhc3RQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTWFzayhjbGlja1Bvc2l0aW9uKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgY2xpY2tQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGNhcmV0KGlucHV0LCBzZWVrTmV4dChjbGlja1Bvc2l0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZXQoaW5wdXQsIGxhc3RQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmJpbmQoJ2RibGNsaWNrLmlucHV0bWFzaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJldChpbnB1dCwgMCwgc2Vla05leHQoZ2V0QWN0aXZlTWFza1NldCgpW1wibGFzdFZhbGlkUG9zaXRpb25cIl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICB9KS5iaW5kKHBhc3RlRXZlbnQgKyBcIi5pbnB1dG1hc2sgZHJhZ2Ryb3AuaW5wdXRtYXNrIGRyb3AuaW5wdXRtYXNrXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2tpcElucHV0RXZlbnQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2lwSW5wdXRFdmVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcywgJGlucHV0ID0gJChpbnB1dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcGFzdGUgZXZlbnQgZm9yIElFOCBhbmQgbG93ZXIgSSBndWVzcyA7LSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgPT0gXCJwcm9wZXJ0eWNoYW5nZVwiICYmIGlucHV0Ll92YWx1ZUdldCgpLmxlbmd0aCA8PSBnZXRNYXNrTGVuZ3RoKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXN0ZVZhbHVlID0gb3B0cy5vbkJlZm9yZVBhc3RlICE9IHVuZGVmaW5lZCA/IG9wdHMub25CZWZvcmVQYXN0ZS5jYWxsKHRoaXMsIGlucHV0Ll92YWx1ZUdldCgpKSA6IGlucHV0Ll92YWx1ZUdldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVmFsKGlucHV0LCB0cnVlLCBmYWxzZSwgcGFzdGVWYWx1ZS5zcGxpdCgnJyksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0NvbXBsZXRlKGdldEFjdGl2ZUJ1ZmZlcigpKSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQuY2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICB9KS5iaW5kKCdzZXR2YWx1ZS5pbnB1dG1hc2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tWYWwoaW5wdXQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVPbkZvY3VzID0gZ2V0QWN0aXZlQnVmZmVyKCkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuX3ZhbHVlR2V0KCkgPT0gZ2V0QWN0aXZlQnVmZmVyVGVtcGxhdGUoKS5qb2luKCcnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5fdmFsdWVTZXQoJycpO1xuICAgICAgICAgICAgICAgICAgICB9KS5iaW5kKCdjb21wbGV0ZS5pbnB1dG1hc2snLCBvcHRzLm9uY29tcGxldGVcbiAgICAgICAgICAgICAgICAgICAgKS5iaW5kKCdpbmNvbXBsZXRlLmlucHV0bWFzaycsIG9wdHMub25pbmNvbXBsZXRlXG4gICAgICAgICAgICAgICAgICAgICkuYmluZCgnY2xlYXJlZC5pbnB1dG1hc2snLCBvcHRzLm9uY2xlYXJlZFxuICAgICAgICAgICAgICAgICAgICApLmJpbmQoXCJrZXl1cC5pbnB1dG1hc2tcIiwga2V5dXBFdmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuZHJvaWRjaHJvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5iaW5kKFwiaW5wdXQuaW5wdXRtYXNrXCIsIGlucHV0RXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmJpbmQoXCJrZXlkb3duLmlucHV0bWFza1wiLCBrZXlkb3duRXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICkuYmluZChcImtleXByZXNzLmlucHV0bWFza1wiLCBrZXlwcmVzc0V2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2llMTApXG4gICAgICAgICAgICAgICAgICAgICAgICAkZWwuYmluZChcImlucHV0LmlucHV0bWFza1wiLCBpbnB1dEV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICAvL2FwcGx5IG1hc2tcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tWYWwoZWwsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVPbkZvY3VzID0gZ2V0QWN0aXZlQnVmZmVyKCkuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdyYXAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpbiBhIHRyeS9jYXRjaCBibG9jayBzaW5jZSBJRTkgdGhyb3cgXCJVbnNwZWNpZmllZCBlcnJvclwiIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaXMgdW5kZWZpbmVkIHdoZW4gd2UgYXJlIGluIGFuIElGcmFtZS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVFbGVtZW50ID09PSBlbCkgeyAvL3Bvc2l0aW9uIHRoZSBjYXJldCB3aGVuIGluIGZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2ZvY3VzLmlucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZXQoZWwsIHNlZWtOZXh0KGdldEFjdGl2ZU1hc2tTZXQoKVtcImxhc3RWYWxpZFBvc2l0aW9uXCJdKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0cy5jbGVhck1hc2tPbkxvc3RGb2N1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpID09IGdldEFjdGl2ZUJ1ZmZlclRlbXBsYXRlKCkuam9pbignJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5fdmFsdWVTZXQoJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhck9wdGlvbmFsVGFpbChlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUJ1ZmZlcihlbCwgZ2V0QWN0aXZlQnVmZmVyKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbEV2ZW50UnVsZXIoZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9hY3Rpb24gb2JqZWN0XG4gICAgICAgICAgICBpZiAoYWN0aW9uT2JqICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uT2JqW1wiYWN0aW9uXCJdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpc0NvbXBsZXRlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNDb21wbGV0ZShhY3Rpb25PYmpbXCJidWZmZXJcIl0pO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidW5tYXNrZWR2YWx1ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaXNSVEwgPSBhY3Rpb25PYmpbXCIkaW5wdXRcIl0uZGF0YSgnX2lucHV0bWFzaycpWydpc1JUTCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubWFza2VkdmFsdWUoYWN0aW9uT2JqW1wiJGlucHV0XCJdLCBhY3Rpb25PYmpbXCJza2lwRGF0ZXBpY2tlckNoZWNrXCJdKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm1hc2tcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2soYWN0aW9uT2JqW1wiZWxcIl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmb3JtYXRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbCA9ICQoe30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmRhdGEoJ19pbnB1dG1hc2snLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hc2tzZXRzJzogbWFza3NldHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FjdGl2ZU1hc2tzZXRJbmRleCc6IGFjdGl2ZU1hc2tzZXRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnb3B0cyc6IG9wdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lzUlRMJzogb3B0cy5udW1lcmljSW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubnVtZXJpY0lucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5pc051bWVyaWMgPSBvcHRzLm51bWVyaWNJbnB1dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1JUTCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVmFsKCRlbCwgZmFsc2UsIGZhbHNlLCBhY3Rpb25PYmpbXCJ2YWx1ZVwiXS5zcGxpdCgnJyksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldEFjdGl2ZUJ1ZmZlcigpLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkLmlucHV0bWFzayA9IHtcbiAgICAgICAgICAgIC8vb3B0aW9ucyBkZWZhdWx0XG4gICAgICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcIl9cIixcbiAgICAgICAgICAgICAgICBvcHRpb25hbG1hcmtlcjogeyBzdGFydDogXCJbXCIsIGVuZDogXCJdXCIgfSxcbiAgICAgICAgICAgICAgICBxdWFudGlmaWVybWFya2VyOiB7IHN0YXJ0OiBcIntcIiwgZW5kOiBcIn1cIiB9LFxuICAgICAgICAgICAgICAgIGdyb3VwbWFya2VyOiB7IHN0YXJ0OiBcIihcIiwgZW5kOiBcIilcIiB9LFxuICAgICAgICAgICAgICAgIGVzY2FwZUNoYXI6IFwiXFxcXFwiLFxuICAgICAgICAgICAgICAgIG1hc2s6IG51bGwsXG4gICAgICAgICAgICAgICAgb25jb21wbGV0ZTogJC5ub29wLCAvL2V4ZWN1dGVzIHdoZW4gdGhlIG1hc2sgaXMgY29tcGxldGVcbiAgICAgICAgICAgICAgICBvbmluY29tcGxldGU6ICQubm9vcCwgLy9leGVjdXRlcyB3aGVuIHRoZSBtYXNrIGlzIGluY29tcGxldGUgYW5kIGZvY3VzIGlzIGxvc3RcbiAgICAgICAgICAgICAgICBvbmNsZWFyZWQ6ICQubm9vcCwgLy9leGVjdXRlcyB3aGVuIHRoZSBtYXNrIGlzIGNsZWFyZWRcbiAgICAgICAgICAgICAgICByZXBlYXQ6IDAsIC8vcmVwZXRpdGlvbnMgb2YgdGhlIG1hc2s6ICogfiBmb3JldmVyLCBvdGhlcndpc2Ugc3BlY2lmeSBhbiBpbnRlZ2VyXG4gICAgICAgICAgICAgICAgZ3JlZWR5OiB0cnVlLCAvL3RydWU6IGFsbG9jYXRlZCBidWZmZXIgZm9yIHRoZSBtYXNrIGFuZCByZXBldGl0aW9ucyAtIGZhbHNlOiBhbGxvY2F0ZSBvbmx5IGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgIGF1dG9Vbm1hc2s6IGZhbHNlLCAvL2F1dG9tYXRpY2FsbHkgdW5tYXNrIHdoZW4gcmV0cmlldmluZyB0aGUgdmFsdWUgd2l0aCAkLmZuLnZhbCBvciB2YWx1ZSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBfX2xvb2t1cEdldHRlcl9fIG9yIGdldE93blByb3BlcnR5RGVzY3JpcHRvclxuICAgICAgICAgICAgICAgIGNsZWFyTWFza09uTG9zdEZvY3VzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluc2VydE1vZGU6IHRydWUsIC8vaW5zZXJ0IHRoZSBpbnB1dCBvciBvdmVyd3JpdGUgdGhlIGlucHV0XG4gICAgICAgICAgICAgICAgY2xlYXJJbmNvbXBsZXRlOiBmYWxzZSwgLy9jbGVhciB0aGUgaW5jb21wbGV0ZSBpbnB1dCBvbiBibHVyXG4gICAgICAgICAgICAgICAgYWxpYXNlczoge30sIC8vYWxpYXNlcyBkZWZpbml0aW9ucyA9PiBzZWUganF1ZXJ5LmlucHV0bWFzay5leHRlbnNpb25zLmpzXG4gICAgICAgICAgICAgICAgb25LZXlVcDogJC5ub29wLCAvL292ZXJyaWRlIHRvIGltcGxlbWVudCBhdXRvY29tcGxldGUgb24gY2VydGFpbiBrZXlzIGZvciBleGFtcGxlXG4gICAgICAgICAgICAgICAgb25LZXlEb3duOiAkLm5vb3AsIC8vb3ZlcnJpZGUgdG8gaW1wbGVtZW50IGF1dG9jb21wbGV0ZSBvbiBjZXJ0YWluIGtleXMgZm9yIGV4YW1wbGVcbiAgICAgICAgICAgICAgICBvbkJlZm9yZVBhc3RlOiB1bmRlZmluZWQsIC8vZXhlY3V0ZXMgYmVmb3JlIG1hc2tpbmcgdGhlIHBhc3RlZCB2YWx1ZSB0byBhbGxvdyBwcmVwcm9jZXNzaW5nIG9mIHRoZSBwYXN0ZWQgdmFsdWUuICBhcmdzID0+IHBhc3RlZFZhbHVlID0+IHJldHVybiBwcm9jZXNzZWRWYWx1ZVxuICAgICAgICAgICAgICAgIG9uVW5NYXNrOiB1bmRlZmluZWQsIC8vZXhlY3V0ZXMgYWZ0ZXIgdW5tYXNraW5nIHRvIGFsbG93IHBvc3Rwcm9jZXNzaW5nIG9mIHRoZSB1bm1hc2tlZHZhbHVlLiAgYXJncyA9PiBtYXNrZWRWYWx1ZSwgdW5tYXNrZWRWYWx1ZVxuICAgICAgICAgICAgICAgIHNob3dNYXNrT25Gb2N1czogdHJ1ZSwgLy9zaG93IHRoZSBtYXNrLXBsYWNlaG9sZGVyIHdoZW4gdGhlIGlucHV0IGhhcyBmb2N1c1xuICAgICAgICAgICAgICAgIHNob3dNYXNrT25Ib3ZlcjogdHJ1ZSwgLy9zaG93IHRoZSBtYXNrLXBsYWNlaG9sZGVyIHdoZW4gaG92ZXJpbmcgdGhlIGVtcHR5IGlucHV0XG4gICAgICAgICAgICAgICAgb25LZXlWYWxpZGF0aW9uOiAkLm5vb3AsIC8vZXhlY3V0ZXMgb24gZXZlcnkga2V5LXByZXNzIHdpdGggdGhlIHJlc3VsdCBvZiBpc1ZhbGlkLiBQYXJhbXM6IHJlc3VsdCwgb3B0c1xuICAgICAgICAgICAgICAgIHNraXBPcHRpb25hbFBhcnRDaGFyYWN0ZXI6IFwiIFwiLCAvL2EgY2hhcmFjdGVyIHdoaWNoIGNhbiBiZSB1c2VkIHRvIHNraXAgYW4gb3B0aW9uYWwgcGFydCBvZiBhIG1hc2tcbiAgICAgICAgICAgICAgICBzaG93VG9vbHRpcDogZmFsc2UsIC8vc2hvdyB0aGUgYWN0aXZlbWFzayBhcyB0b29sdGlwXG4gICAgICAgICAgICAgICAgbnVtZXJpY0lucHV0OiBmYWxzZSwgLy9udW1lcmljSW5wdXQgaW5wdXQgZGlyZWN0aW9uIHN0eWxlIChpbnB1dCBzaGlmdHMgdG8gdGhlIGxlZnQgd2hpbGUgaG9sZGluZyB0aGUgY2FyZXQgcG9zaXRpb24pXG4gICAgICAgICAgICAgICAgLy9udW1lcmljIGJhc2ljIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpc051bWVyaWM6IGZhbHNlLCAvL2VuYWJsZSBudW1lcmljIGZlYXR1cmVzXG4gICAgICAgICAgICAgICAgcmFkaXhQb2ludDogXCJcIiwgLy9cIi5cIiwgLy8gfCBcIixcIlxuICAgICAgICAgICAgICAgIHNraXBSYWRpeERhbmNlOiBmYWxzZSwgLy9kaXNhYmxlIHJhZGl4cG9pbnQgY2FyZXQgcG9zaXRpb25pbmdcbiAgICAgICAgICAgICAgICByaWdodEFsaWduTnVtZXJpY3M6IHRydWUsIC8vYWxpZ24gbnVtZXJpY3MgdG8gdGhlIHJpZ2h0XG4gICAgICAgICAgICAgICAgLy9udW1lcmljIGJhc2ljIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBkZWZpbml0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAnOSc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogXCJbMC05XVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZGluYWxpdHk6IDFcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2EnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IFwiW0EtWmEtelxcdTA0MTAtXFx1MDQ0RlxcdTA0MDFcXHUwNDUxXVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZGluYWxpdHk6IDFcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJyonOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3I6IFwiW0EtWmEtelxcdTA0MTAtXFx1MDQ0RlxcdTA0MDFcXHUwNDUxMC05XVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZGluYWxpdHk6IDFcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAga2V5Q29kZToge1xuICAgICAgICAgICAgICAgICAgICBBTFQ6IDE4LCBCQUNLU1BBQ0U6IDgsIENBUFNfTE9DSzogMjAsIENPTU1BOiAxODgsIENPTU1BTkQ6IDkxLCBDT01NQU5EX0xFRlQ6IDkxLCBDT01NQU5EX1JJR0hUOiA5MywgQ09OVFJPTDogMTcsIERFTEVURTogNDYsIERPV046IDQwLCBFTkQ6IDM1LCBFTlRFUjogMTMsIEVTQ0FQRTogMjcsIEhPTUU6IDM2LCBJTlNFUlQ6IDQ1LCBMRUZUOiAzNywgTUVOVTogOTMsIE5VTVBBRF9BREQ6IDEwNywgTlVNUEFEX0RFQ0lNQUw6IDExMCwgTlVNUEFEX0RJVklERTogMTExLCBOVU1QQURfRU5URVI6IDEwOCxcbiAgICAgICAgICAgICAgICAgICAgTlVNUEFEX01VTFRJUExZOiAxMDYsIE5VTVBBRF9TVUJUUkFDVDogMTA5LCBQQUdFX0RPV046IDM0LCBQQUdFX1VQOiAzMywgUEVSSU9EOiAxOTAsIFJJR0hUOiAzOSwgU0hJRlQ6IDE2LCBTUEFDRTogMzIsIFRBQjogOSwgVVA6IDM4LCBXSU5ET1dTOiA5MVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy9zcGVjaWZ5IGtleWNvZGVzIHdoaWNoIHNob3VsZCBub3QgYmUgY29uc2lkZXJlZCBpbiB0aGUga2V5cHJlc3MgZXZlbnQsIG90aGVyd2lzZSB0aGUgcHJldmVudERlZmF1bHQgd2lsbCBzdG9wIHRoZWlyIGRlZmF1bHQgYmVoYXZpb3IgZXNwZWNpYWxseSBpbiBGRlxuICAgICAgICAgICAgICAgIGlnbm9yYWJsZXM6IFs4LCA5LCAxMywgMTksIDI3LCAzMywgMzQsIDM1LCAzNiwgMzcsIDM4LCAzOSwgNDAsIDQ1LCA0NiwgOTMsIDExMiwgMTEzLCAxMTQsIDExNSwgMTE2LCAxMTcsIDExOCwgMTE5LCAxMjAsIDEyMSwgMTIyLCAxMjNdLFxuICAgICAgICAgICAgICAgIGdldE1hc2tMZW5ndGg6IGZ1bmN0aW9uIChidWZmZXIsIGdyZWVkeSwgcmVwZWF0LCBjdXJyZW50QnVmZmVyLCBvcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYWxjdWxhdGVkTGVuZ3RoID0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFncmVlZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXBlYXQgPT0gXCIqXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxjdWxhdGVkTGVuZ3RoID0gY3VycmVudEJ1ZmZlci5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBlYXQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsY3VsYXRlZExlbmd0aCArPSAoYnVmZmVyLmxlbmd0aCAqIChyZXBlYXQgLSAxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGN1bGF0ZWRMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVzY2FwZVJlZ2V4OiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNwZWNpYWxzID0gWycvJywgJy4nLCAnKicsICcrJywgJz8nLCAnfCcsICcoJywgJyknLCAnWycsICddJywgJ3snLCAnfScsICdcXFxcJ107XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKG5ldyBSZWdFeHAoJyhcXFxcJyArIHNwZWNpYWxzLmpvaW4oJ3xcXFxcJykgKyAnKScsICdnaW0nKSwgJ1xcXFwkMScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZvcm1hdDogZnVuY3Rpb24gKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgJC5pbnB1dG1hc2suZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJlc29sdmVBbGlhcyhvcHRzLmFsaWFzLCBvcHRpb25zLCBvcHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFza1Njb3BlKGdlbmVyYXRlTWFza1NldHMob3B0cyksIDAsIG9wdHMsIHsgXCJhY3Rpb25cIjogXCJmb3JtYXRcIiwgXCJ2YWx1ZVwiOiB2YWx1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkLmZuLmlucHV0bWFzayA9IGZ1bmN0aW9uIChmbiwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgJC5pbnB1dG1hc2suZGVmYXVsdHMsIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIG1hc2tzZXRzLFxuICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IDA7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJtYXNrXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3Jlc29sdmUgcG9zc2libGUgYWxpYXNlcyBnaXZlbiBieSBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQWxpYXMob3B0cy5hbGlhcywgb3B0aW9ucywgb3B0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrc2V0cyA9IGdlbmVyYXRlTWFza1NldHMob3B0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFza3NldHMubGVuZ3RoID09IDApIHsgcmV0dXJuIHRoaXM7IH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza1Njb3BlKCQuZXh0ZW5kKHRydWUsIHt9LCBtYXNrc2V0cyksIDAsIG9wdHMsIHsgXCJhY3Rpb25cIjogXCJtYXNrXCIsIFwiZWxcIjogdGhpcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidW5tYXNrZWR2YWx1ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyksIGlucHV0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkaW5wdXQuZGF0YSgnX2lucHV0bWFzaycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFza3NldHMgPSAkaW5wdXQuZGF0YSgnX2lucHV0bWFzaycpWydtYXNrc2V0cyddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9ICRpbnB1dC5kYXRhKCdfaW5wdXRtYXNrJylbJ2FjdGl2ZU1hc2tzZXRJbmRleCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMgPSAkaW5wdXQuZGF0YSgnX2lucHV0bWFzaycpWydvcHRzJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hc2tTY29wZShtYXNrc2V0cywgYWN0aXZlTWFza3NldEluZGV4LCBvcHRzLCB7IFwiYWN0aW9uXCI6IFwidW5tYXNrZWR2YWx1ZVwiLCBcIiRpbnB1dFwiOiAkaW5wdXQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgcmV0dXJuICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJlbW92ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcyksIGlucHV0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGlucHV0LmRhdGEoJ19pbnB1dG1hc2snKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrc2V0cyA9ICRpbnB1dC5kYXRhKCdfaW5wdXRtYXNrJylbJ21hc2tzZXRzJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9ICRpbnB1dC5kYXRhKCdfaW5wdXRtYXNrJylbJ2FjdGl2ZU1hc2tzZXRJbmRleCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzID0gJGlucHV0LmRhdGEoJ19pbnB1dG1hc2snKVsnb3B0cyddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3dyaXRlb3V0IHRoZSB1bm1hc2tlZHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0Ll92YWx1ZVNldChtYXNrU2NvcGUobWFza3NldHMsIGFjdGl2ZU1hc2tzZXRJbmRleCwgb3B0cywgeyBcImFjdGlvblwiOiBcInVubWFza2VkdmFsdWVcIiwgXCIkaW5wdXRcIjogJGlucHV0LCBcInNraXBEYXRlcGlja2VyQ2hlY2tcIjogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY2xlYXIgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQucmVtb3ZlRGF0YSgnX2lucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VuYmluZCBhbGwgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpbnB1dC51bmJpbmQoXCIuaW5wdXRtYXNrXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaW5wdXQucmVtb3ZlQ2xhc3MoJ2ZvY3VzLmlucHV0bWFzaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Jlc3RvcmUgdGhlIHZhbHVlIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZVByb3BlcnR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlUHJvcGVydHkgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGlucHV0LCBcInZhbHVlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVQcm9wZXJ0eSAmJiB2YWx1ZVByb3BlcnR5LmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0Ll92YWx1ZUdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpbnB1dCwgXCJ2YWx1ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogaW5wdXQuX3ZhbHVlR2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQ6IGlucHV0Ll92YWx1ZVNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRvY3VtZW50Ll9fbG9va3VwR2V0dGVyX18gJiYgaW5wdXQuX19sb29rdXBHZXR0ZXJfXyhcInZhbHVlXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuX3ZhbHVlR2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuX19kZWZpbmVHZXR0ZXJfXyhcInZhbHVlXCIsIGlucHV0Ll92YWx1ZUdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuX19kZWZpbmVTZXR0ZXJfXyhcInZhbHVlXCIsIGlucHV0Ll92YWx1ZVNldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsgLy90cnkgY2F0Y2ggbmVlZGVkIGZvciBJRTcgYXMgaXQgZG9lcyBub3Qgc3VwcG9ydHMgZGVsZXRpbmcgZm5zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXQuX3ZhbHVlR2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0Ll92YWx1ZVNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuX3ZhbHVlR2V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQuX3ZhbHVlU2V0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZ2V0ZW1wdHltYXNrXCI6IC8vcmV0dXJuIHRoZSBkZWZhdWx0IChlbXB0eSkgbWFzayB2YWx1ZSwgdXNlZnVsbCBmb3Igc2V0dGluZyB0aGUgZGVmYXVsdCB2YWx1ZSBpbiB2YWxpZGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhKCdfaW5wdXRtYXNrJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrc2V0cyA9IHRoaXMuZGF0YSgnX2lucHV0bWFzaycpWydtYXNrc2V0cyddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IHRoaXMuZGF0YSgnX2lucHV0bWFzaycpWydhY3RpdmVNYXNrc2V0SW5kZXgnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFza3NldHNbYWN0aXZlTWFza3NldEluZGV4XVsnX2J1ZmZlciddLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImhhc01hc2tlZFZhbHVlXCI6IC8vY2hlY2sgd2hldGVyIHRoZSByZXR1cm5lZCB2YWx1ZSBpcyBtYXNrZWQgb3Igbm90OyBjdXJyZW50bHkgb25seSB3b3JrcyByZWxpYWJsZSB3aGVuIHVzaW5nIGpxdWVyeS52YWwgZm4gdG8gcmV0cmlldmUgdGhlIHZhbHVlIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YSgnX2lucHV0bWFzaycpID8gIXRoaXMuZGF0YSgnX2lucHV0bWFzaycpWydvcHRzJ10uYXV0b1VubWFzayA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaXNDb21wbGV0ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFza3NldHMgPSB0aGlzLmRhdGEoJ19pbnB1dG1hc2snKVsnbWFza3NldHMnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IHRoaXMuZGF0YSgnX2lucHV0bWFzaycpWydhY3RpdmVNYXNrc2V0SW5kZXgnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMgPSB0aGlzLmRhdGEoJ19pbnB1dG1hc2snKVsnb3B0cyddO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hc2tTY29wZShtYXNrc2V0cywgYWN0aXZlTWFza3NldEluZGV4LCBvcHRzLCB7IFwiYWN0aW9uXCI6IFwiaXNDb21wbGV0ZVwiLCBcImJ1ZmZlclwiOiB0aGlzWzBdLl92YWx1ZUdldCgpLnNwbGl0KCcnKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImdldG1ldGFkYXRhXCI6IC8vcmV0dXJuIG1hc2sgbWV0YWRhdGEgaWYgZXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhKCdfaW5wdXRtYXNrJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNrc2V0cyA9IHRoaXMuZGF0YSgnX2lucHV0bWFzaycpWydtYXNrc2V0cyddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZU1hc2tzZXRJbmRleCA9IHRoaXMuZGF0YSgnX2lucHV0bWFzaycpWydhY3RpdmVNYXNrc2V0SW5kZXgnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFza3NldHNbYWN0aXZlTWFza3NldEluZGV4XVsnbWV0YWRhdGEnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgdGhlIGZuIGlzIGFuIGFsaWFzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVBbGlhcyhmbiwgb3B0aW9ucywgb3B0cykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL21heWJlIGZuIGlzIGEgbWFzayBzbyB3ZSB0cnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3NldCBtYXNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5tYXNrID0gZm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrc2V0cyA9IGdlbmVyYXRlTWFza1NldHMob3B0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFza3NldHMubGVuZ3RoID09IDApIHsgcmV0dXJuIHRoaXM7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tTY29wZSgkLmV4dGVuZCh0cnVlLCB7fSwgbWFza3NldHMpLCBhY3RpdmVNYXNrc2V0SW5kZXgsIG9wdHMsIHsgXCJhY3Rpb25cIjogXCJtYXNrXCIsIFwiZWxcIjogdGhpcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBmbiA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkLmlucHV0bWFzay5kZWZhdWx0cywgZm4pO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUFsaWFzKG9wdHMuYWxpYXMsIGZuLCBvcHRzKTsgLy9yZXNvbHZlIGFsaWFzZXNcbiAgICAgICAgICAgICAgICBtYXNrc2V0cyA9IGdlbmVyYXRlTWFza1NldHMob3B0cyk7XG4gICAgICAgICAgICAgICAgaWYgKG1hc2tzZXRzLmxlbmd0aCA9PSAwKSB7IHJldHVybiB0aGlzOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hc2tTY29wZSgkLmV4dGVuZCh0cnVlLCB7fSwgbWFza3NldHMpLCBhY3RpdmVNYXNrc2V0SW5kZXgsIG9wdHMsIHsgXCJhY3Rpb25cIjogXCJtYXNrXCIsIFwiZWxcIjogdGhpcyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm4gPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgLy9sb29rIGZvciBkYXRhLWlucHV0bWFzayBhdHJpYnV0ZSAtIHRoZSBhdHRyaWJ1dGUgc2hvdWxkIG9ubHkgY29udGFpbiBvcHRpcG5zXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyT3B0aW9ucyA9ICQodGhpcykuYXR0cihcImRhdGEtaW5wdXRtYXNrXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ck9wdGlvbnMgJiYgYXR0ck9wdGlvbnMgIT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyT3B0aW9ucyA9IGF0dHJPcHRpb25zLnJlcGxhY2UobmV3IFJlZ0V4cChcIidcIiwgXCJnXCIpLCAnXCInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YW9wdGlvbnMgPSAkLnBhcnNlSlNPTihcIntcIiArIGF0dHJPcHRpb25zICsgXCJ9XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGRhdGFvcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQodHJ1ZSwge30sICQuaW5wdXRtYXNrLmRlZmF1bHRzLCBkYXRhb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUFsaWFzKG9wdHMuYWxpYXMsIGRhdGFvcHRpb25zLCBvcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmFsaWFzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuaW5wdXRtYXNrKG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHsgfSAvL25lZWQgYSBtb3JlIHJlbGF4IHBhcnNlSlNPTlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufSkoalF1ZXJ5KTtcbiJdfQ==
