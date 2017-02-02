/* Flot plugin for plotting textual data or categories.

Copyright (c) 2007-2013 IOLA and Ole Laursen.
Licensed under the MIT license.

Consider a dataset like [["February", 34], ["March", 20], ...]. This plugin
allows you to plot such a dataset directly.

To enable it, you must specify mode: "categories" on the axis with the textual
labels, e.g.

	$.plot("#placeholder", data, { xaxis: { mode: "categories" } });

By default, the labels are ordered as they are met in the data series. If you
need a different ordering, you can specify "categories" on the axis options
and list the categories there:

	xaxis: {
		mode: "categories",
		categories: ["February", "March", "April"]
	}

If you need to customize the distances between the categories, you can specify
"categories" as an object mapping labels to values

	xaxis: {
		mode: "categories",
		categories: { "February": 1, "March": 3, "April": 4 }
	}

If you don't specify all categories, the remaining categories will be numbered
from the max value plus 1 (with a spacing of 1 between each).

Internally, the plugin works by transforming the input data through an auto-
generated mapping where the first category becomes 0, the second 1, etc.
Hence, a point like ["February", 34] becomes [0, 34] internally in Flot (this
is visible in hover and click events that return numbers rather than the
category labels). The plugin also overrides the tick generator to spit out the
categories as ticks instead of the values.

If you need to map a value back to its label, the mapping is always accessible
as "categories" on the axis object, e.g. plot.getAxes().xaxis.categories.

*/

(function ($) {
    var options = {
        xaxis: {
            categories: null
        },
        yaxis: {
            categories: null
        }
    };
    
    function processRawData(plot, series, data, datapoints) {
        // if categories are enabled, we need to disable
        // auto-transformation to numbers so the strings are intact
        // for later processing

        var xCategories = series.xaxis.options.mode == "categories",
            yCategories = series.yaxis.options.mode == "categories";
        
        if (!(xCategories || yCategories))
            return;

        var format = datapoints.format;

        if (!format) {
            // FIXME: auto-detection should really not be defined here
            var s = series;
            format = [];
            format.push({ x: true, number: true, required: true });
            format.push({ y: true, number: true, required: true });

            if (s.bars.show || (s.lines.show && s.lines.fill)) {
                var autoscale = !!((s.bars.show && s.bars.zero) || (s.lines.show && s.lines.zero));
                format.push({ y: true, number: true, required: false, defaultValue: 0, autoscale: autoscale });
                if (s.bars.horizontal) {
                    delete format[format.length - 1].y;
                    format[format.length - 1].x = true;
                }
            }
            
            datapoints.format = format;
        }

        for (var m = 0; m < format.length; ++m) {
            if (format[m].x && xCategories)
                format[m].number = false;
            
            if (format[m].y && yCategories)
                format[m].number = false;
        }
    }

    function getNextIndex(categories) {
        var index = -1;
        
        for (var v in categories)
            if (categories[v] > index)
                index = categories[v];

        return index + 1;
    }

    function categoriesTickGenerator(axis) {
        var res = [];
        for (var label in axis.categories) {
            var v = axis.categories[label];
            if (v >= axis.min && v <= axis.max)
                res.push([v, label]);
        }

        res.sort(function (a, b) { return a[0] - b[0]; });

        return res;
    }
    
    function setupCategoriesForAxis(series, axis, datapoints) {
        if (series[axis].options.mode != "categories")
            return;
        
        if (!series[axis].categories) {
            // parse options
            var c = {}, o = series[axis].options.categories || {};
            if ($.isArray(o)) {
                for (var i = 0; i < o.length; ++i)
                    c[o[i]] = i;
            }
            else {
                for (var v in o)
                    c[v] = o[v];
            }
            
            series[axis].categories = c;
        }

        // fix ticks
        if (!series[axis].options.ticks)
            series[axis].options.ticks = categoriesTickGenerator;

        transformPointsOnAxis(datapoints, axis, series[axis].categories);
    }
    
    function transformPointsOnAxis(datapoints, axis, categories) {
        // go through the points, transforming them
        var points = datapoints.points,
            ps = datapoints.pointsize,
            format = datapoints.format,
            formatColumn = axis.charAt(0),
            index = getNextIndex(categories);

        for (var i = 0; i < points.length; i += ps) {
            if (points[i] == null)
                continue;
            
            for (var m = 0; m < ps; ++m) {
                var val = points[i + m];

                if (val == null || !format[m][formatColumn])
                    continue;

                if (!(val in categories)) {
                    categories[val] = index;
                    ++index;
                }
                
                points[i + m] = categories[val];
            }
        }
    }

    function processDatapoints(plot, series, datapoints) {
        setupCategoriesForAxis(series, "xaxis", datapoints);
        setupCategoriesForAxis(series, "yaxis", datapoints);
    }

    function init(plot) {
        plot.hooks.processRawData.push(processRawData);
        plot.hooks.processDatapoints.push(processDatapoints);
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'categories',
        version: '1.0'
    });
})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5mbG90LmNhdGVnb3JpZXMuanMiXSwibmFtZXMiOlsiJCIsInByb2Nlc3NSYXdEYXRhIiwicGxvdCIsInNlcmllcyIsImRhdGEiLCJkYXRhcG9pbnRzIiwieENhdGVnb3JpZXMiLCJ4YXhpcyIsIm9wdGlvbnMiLCJtb2RlIiwieUNhdGVnb3JpZXMiLCJ5YXhpcyIsImZvcm1hdCIsInMiLCJwdXNoIiwieCIsIm51bWJlciIsInJlcXVpcmVkIiwieSIsImJhcnMiLCJzaG93IiwibGluZXMiLCJmaWxsIiwiYXV0b3NjYWxlIiwiemVybyIsImRlZmF1bHRWYWx1ZSIsImhvcml6b250YWwiLCJsZW5ndGgiLCJtIiwiZ2V0TmV4dEluZGV4IiwiY2F0ZWdvcmllcyIsImluZGV4IiwidiIsImNhdGVnb3JpZXNUaWNrR2VuZXJhdG9yIiwiYXhpcyIsInJlcyIsImxhYmVsIiwibWluIiwibWF4Iiwic29ydCIsImEiLCJiIiwic2V0dXBDYXRlZ29yaWVzRm9yQXhpcyIsImMiLCJvIiwiaXNBcnJheSIsImkiLCJ0aWNrcyIsInRyYW5zZm9ybVBvaW50c09uQXhpcyIsInBvaW50cyIsInBzIiwicG9pbnRzaXplIiwiZm9ybWF0Q29sdW1uIiwiY2hhckF0IiwidmFsIiwicHJvY2Vzc0RhdGFwb2ludHMiLCJpbml0IiwiaG9va3MiLCJwbHVnaW5zIiwibmFtZSIsInZlcnNpb24iLCJqUXVlcnkiXSwibWFwcGluZ3MiOiJDQTZDQSxTQUFXQSxHQVVQLFFBQVNDLEdBQWVDLEVBQU1DLEVBQVFDLEVBQU1DLEdBS3hDLEdBQUlDLEdBQTJDLGNBQTdCSCxFQUFPSSxNQUFNQyxRQUFRQyxLQUNuQ0MsRUFBMkMsY0FBN0JQLEVBQU9RLE1BQU1ILFFBQVFDLElBRXZDLElBQU1ILEdBQWVJLEVBQXJCLENBR0EsR0FBSUUsR0FBU1AsRUFBV08sTUFFeEIsS0FBS0EsRUFBUSxDQUVULEdBQUlDLEdBQUlWLENBS1IsSUFKQVMsS0FDQUEsRUFBT0UsTUFBT0MsR0FBRyxFQUFNQyxR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U21ELEdBQUt0RCxHQUNWQSxFQUFLdUQsTUFBTXhELGVBQWVhLEtBQUtiLEdBQy9CQyxFQUFLdUQsTUFBTUYsa0JBQWtCekMsS0FBS3lDLEdBdEl0QyxHQUFJL0MsSUFDQUQsT0FDSXVCLFdBQVksTUFFaEJuQixPQUNJbUIsV0FBWSxNQW9JcEI5QixHQUFFRSxLQUFLd0QsUUFBUTVDLE1BQ1gwQyxLQUFNQSxFQUNOaEQsUUFBU0EsRUFDVG1ELEtBQU0sYUFDTkMsUUFBUyxTQUVkQyIsImZpbGUiOiJqcXVlcnkuZmxvdC5jYXRlZ29yaWVzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogRmxvdCBwbHVnaW4gZm9yIHBsb3R0aW5nIHRleHR1YWwgZGF0YSBvciBjYXRlZ29yaWVzLlxuXG5Db3B5cmlnaHQgKGMpIDIwMDctMjAxMyBJT0xBIGFuZCBPbGUgTGF1cnNlbi5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuQ29uc2lkZXIgYSBkYXRhc2V0IGxpa2UgW1tcIkZlYnJ1YXJ5XCIsIDM0XSwgW1wiTWFyY2hcIiwgMjBdLCAuLi5dLiBUaGlzIHBsdWdpblxuYWxsb3dzIHlvdSB0byBwbG90IHN1Y2ggYSBkYXRhc2V0IGRpcmVjdGx5LlxuXG5UbyBlbmFibGUgaXQsIHlvdSBtdXN0IHNwZWNpZnkgbW9kZTogXCJjYXRlZ29yaWVzXCIgb24gdGhlIGF4aXMgd2l0aCB0aGUgdGV4dHVhbFxubGFiZWxzLCBlLmcuXG5cblx0JC5wbG90KFwiI3BsYWNlaG9sZGVyXCIsIGRhdGEsIHsgeGF4aXM6IHsgbW9kZTogXCJjYXRlZ29yaWVzXCIgfSB9KTtcblxuQnkgZGVmYXVsdCwgdGhlIGxhYmVscyBhcmUgb3JkZXJlZCBhcyB0aGV5IGFyZSBtZXQgaW4gdGhlIGRhdGEgc2VyaWVzLiBJZiB5b3Vcbm5lZWQgYSBkaWZmZXJlbnQgb3JkZXJpbmcsIHlvdSBjYW4gc3BlY2lmeSBcImNhdGVnb3JpZXNcIiBvbiB0aGUgYXhpcyBvcHRpb25zXG5hbmQgbGlzdCB0aGUgY2F0ZWdvcmllcyB0aGVyZTpcblxuXHR4YXhpczoge1xuXHRcdG1vZGU6IFwiY2F0ZWdvcmllc1wiLFxuXHRcdGNhdGVnb3JpZXM6IFtcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiXVxuXHR9XG5cbklmIHlvdSBuZWVkIHRvIGN1c3RvbWl6ZSB0aGUgZGlzdGFuY2VzIGJldHdlZW4gdGhlIGNhdGVnb3JpZXMsIHlvdSBjYW4gc3BlY2lmeVxuXCJjYXRlZ29yaWVzXCIgYXMgYW4gb2JqZWN0IG1hcHBpbmcgbGFiZWxzIHRvIHZhbHVlc1xuXG5cdHhheGlzOiB7XG5cdFx0bW9kZTogXCJjYXRlZ29yaWVzXCIsXG5cdFx0Y2F0ZWdvcmllczogeyBcIkZlYnJ1YXJ5XCI6IDEsIFwiTWFyY2hcIjogMywgXCJBcHJpbFwiOiA0IH1cblx0fVxuXG5JZiB5b3UgZG9uJ3Qgc3BlY2lmeSBhbGwgY2F0ZWdvcmllcywgdGhlIHJlbWFpbmluZyBjYXRlZ29yaWVzIHdpbGwgYmUgbnVtYmVyZWRcbmZyb20gdGhlIG1heCB2YWx1ZSBwbHVzIDEgKHdpdGggYSBzcGFjaW5nIG9mIDEgYmV0d2VlbiBlYWNoKS5cblxuSW50ZXJuYWxseSwgdGhlIHBsdWdpbiB3b3JrcyBieSB0cmFuc2Zvcm1pbmcgdGhlIGlucHV0IGRhdGEgdGhyb3VnaCBhbiBhdXRvLVxuZ2VuZXJhdGVkIG1hcHBpbmcgd2hlcmUgdGhlIGZpcnN0IGNhdGVnb3J5IGJlY29tZXMgMCwgdGhlIHNlY29uZCAxLCBldGMuXG5IZW5jZSwgYSBwb2ludCBsaWtlIFtcIkZlYnJ1YXJ5XCIsIDM0XSBiZWNvbWVzIFswLCAzNF0gaW50ZXJuYWxseSBpbiBGbG90ICh0aGlzXG5pcyB2aXNpYmxlIGluIGhvdmVyIGFuZCBjbGljayBldmVudHMgdGhhdCByZXR1cm4gbnVtYmVycyByYXRoZXIgdGhhbiB0aGVcbmNhdGVnb3J5IGxhYmVscykuIFRoZSBwbHVnaW4gYWxzbyBvdmVycmlkZXMgdGhlIHRpY2sgZ2VuZXJhdG9yIHRvIHNwaXQgb3V0IHRoZVxuY2F0ZWdvcmllcyBhcyB0aWNrcyBpbnN0ZWFkIG9mIHRoZSB2YWx1ZXMuXG5cbklmIHlvdSBuZWVkIHRvIG1hcCBhIHZhbHVlIGJhY2sgdG8gaXRzIGxhYmVsLCB0aGUgbWFwcGluZyBpcyBhbHdheXMgYWNjZXNzaWJsZVxuYXMgXCJjYXRlZ29yaWVzXCIgb24gdGhlIGF4aXMgb2JqZWN0LCBlLmcuIHBsb3QuZ2V0QXhlcygpLnhheGlzLmNhdGVnb3JpZXMuXG5cbiovXG5cbihmdW5jdGlvbiAoJCkge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICB4YXhpczoge1xuICAgICAgICAgICAgY2F0ZWdvcmllczogbnVsbFxuICAgICAgICB9LFxuICAgICAgICB5YXhpczoge1xuICAgICAgICAgICAgY2F0ZWdvcmllczogbnVsbFxuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBmdW5jdGlvbiBwcm9jZXNzUmF3RGF0YShwbG90LCBzZXJpZXMsIGRhdGEsIGRhdGFwb2ludHMpIHtcbiAgICAgICAgLy8gaWYgY2F0ZWdvcmllcyBhcmUgZW5hYmxlZCwgd2UgbmVlZCB0byBkaXNhYmxlXG4gICAgICAgIC8vIGF1dG8tdHJhbnNmb3JtYXRpb24gdG8gbnVtYmVycyBzbyB0aGUgc3RyaW5ncyBhcmUgaW50YWN0XG4gICAgICAgIC8vIGZvciBsYXRlciBwcm9jZXNzaW5nXG5cbiAgICAgICAgdmFyIHhDYXRlZ29yaWVzID0gc2VyaWVzLnhheGlzLm9wdGlvbnMubW9kZSA9PSBcImNhdGVnb3JpZXNcIixcbiAgICAgICAgICAgIHlDYXRlZ29yaWVzID0gc2VyaWVzLnlheGlzLm9wdGlvbnMubW9kZSA9PSBcImNhdGVnb3JpZXNcIjtcbiAgICAgICAgXG4gICAgICAgIGlmICghKHhDYXRlZ29yaWVzIHx8IHlDYXRlZ29yaWVzKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgZm9ybWF0ID0gZGF0YXBvaW50cy5mb3JtYXQ7XG5cbiAgICAgICAgaWYgKCFmb3JtYXQpIHtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBhdXRvLWRldGVjdGlvbiBzaG91bGQgcmVhbGx5IG5vdCBiZSBkZWZpbmVkIGhlcmVcbiAgICAgICAgICAgIHZhciBzID0gc2VyaWVzO1xuICAgICAgICAgICAgZm9ybWF0ID0gW107XG4gICAgICAgICAgICBmb3JtYXQucHVzaCh7IHg6IHRydWUsIG51bWJlcjogdHJ1ZSwgcmVxdWlyZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICBmb3JtYXQucHVzaCh7IHk6IHRydWUsIG51bWJlcjogdHJ1ZSwgcmVxdWlyZWQ6IHRydWUgfSk7XG5cbiAgICAgICAgICAgIGlmIChzLmJhcnMuc2hvdyB8fCAocy5saW5lcy5zaG93ICYmIHMubGluZXMuZmlsbCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXV0b3NjYWxlID0gISEoKHMuYmFycy5zaG93ICYmIHMuYmFycy56ZXJvKSB8fCAocy5saW5lcy5zaG93ICYmIHMubGluZXMuemVybykpO1xuICAgICAgICAgICAgICAgIGZvcm1hdC5wdXNoKHsgeTogdHJ1ZSwgbnVtYmVyOiB0cnVlLCByZXF1aXJlZDogZmFsc2UsIGRlZmF1bHRWYWx1ZTogMCwgYXV0b3NjYWxlOiBhdXRvc2NhbGUgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHMuYmFycy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBmb3JtYXRbZm9ybWF0Lmxlbmd0aCAtIDFdLnk7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdFtmb3JtYXQubGVuZ3RoIC0gMV0ueCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkYXRhcG9pbnRzLmZvcm1hdCA9IGZvcm1hdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIG0gPSAwOyBtIDwgZm9ybWF0Lmxlbmd0aDsgKyttKSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0W21dLnggJiYgeENhdGVnb3JpZXMpXG4gICAgICAgICAgICAgICAgZm9ybWF0W21dLm51bWJlciA9IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZm9ybWF0W21dLnkgJiYgeUNhdGVnb3JpZXMpXG4gICAgICAgICAgICAgICAgZm9ybWF0W21dLm51bWJlciA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TmV4dEluZGV4KGNhdGVnb3JpZXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTE7XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciB2IGluIGNhdGVnb3JpZXMpXG4gICAgICAgICAgICBpZiAoY2F0ZWdvcmllc1t2XSA+IGluZGV4KVxuICAgICAgICAgICAgICAgIGluZGV4ID0gY2F0ZWdvcmllc1t2XTtcblxuICAgICAgICByZXR1cm4gaW5kZXggKyAxO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhdGVnb3JpZXNUaWNrR2VuZXJhdG9yKGF4aXMpIHtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBsYWJlbCBpbiBheGlzLmNhdGVnb3JpZXMpIHtcbiAgICAgICAgICAgIHZhciB2ID0gYXhpcy5jYXRlZ29yaWVzW2xhYmVsXTtcbiAgICAgICAgICAgIGlmICh2ID49IGF4aXMubWluICYmIHYgPD0gYXhpcy5tYXgpXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goW3YsIGxhYmVsXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXSAtIGJbMF07IH0pO1xuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHNldHVwQ2F0ZWdvcmllc0ZvckF4aXMoc2VyaWVzLCBheGlzLCBkYXRhcG9pbnRzKSB7XG4gICAgICAgIGlmIChzZXJpZXNbYXhpc10ub3B0aW9ucy5tb2RlICE9IFwiY2F0ZWdvcmllc1wiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFzZXJpZXNbYXhpc10uY2F0ZWdvcmllcykge1xuICAgICAgICAgICAgLy8gcGFyc2Ugb3B0aW9uc1xuICAgICAgICAgICAgdmFyIGMgPSB7fSwgbyA9IHNlcmllc1theGlzXS5vcHRpb25zLmNhdGVnb3JpZXMgfHwge307XG4gICAgICAgICAgICBpZiAoJC5pc0FycmF5KG8pKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgICAgICBjW29baV1dID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHYgaW4gbylcbiAgICAgICAgICAgICAgICAgICAgY1t2XSA9IG9bdl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlcmllc1theGlzXS5jYXRlZ29yaWVzID0gYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZpeCB0aWNrc1xuICAgICAgICBpZiAoIXNlcmllc1theGlzXS5vcHRpb25zLnRpY2tzKVxuICAgICAgICAgICAgc2VyaWVzW2F4aXNdLm9wdGlvbnMudGlja3MgPSBjYXRlZ29yaWVzVGlja0dlbmVyYXRvcjtcblxuICAgICAgICB0cmFuc2Zvcm1Qb2ludHNPbkF4aXMoZGF0YXBvaW50cywgYXhpcywgc2VyaWVzW2F4aXNdLmNhdGVnb3JpZXMpO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1Qb2ludHNPbkF4aXMoZGF0YXBvaW50cywgYXhpcywgY2F0ZWdvcmllcykge1xuICAgICAgICAvLyBnbyB0aHJvdWdoIHRoZSBwb2ludHMsIHRyYW5zZm9ybWluZyB0aGVtXG4gICAgICAgIHZhciBwb2ludHMgPSBkYXRhcG9pbnRzLnBvaW50cyxcbiAgICAgICAgICAgIHBzID0gZGF0YXBvaW50cy5wb2ludHNpemUsXG4gICAgICAgICAgICBmb3JtYXQgPSBkYXRhcG9pbnRzLmZvcm1hdCxcbiAgICAgICAgICAgIGZvcm1hdENvbHVtbiA9IGF4aXMuY2hhckF0KDApLFxuICAgICAgICAgICAgaW5kZXggPSBnZXROZXh0SW5kZXgoY2F0ZWdvcmllcyk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpICs9IHBzKSB7XG4gICAgICAgICAgICBpZiAocG9pbnRzW2ldID09IG51bGwpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAwOyBtIDwgcHM7ICsrbSkge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBwb2ludHNbaSArIG1dO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PSBudWxsIHx8ICFmb3JtYXRbbV1bZm9ybWF0Q29sdW1uXSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoISh2YWwgaW4gY2F0ZWdvcmllcykpIHtcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcmllc1t2YWxdID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBvaW50c1tpICsgbV0gPSBjYXRlZ29yaWVzW3ZhbF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzRGF0YXBvaW50cyhwbG90LCBzZXJpZXMsIGRhdGFwb2ludHMpIHtcbiAgICAgICAgc2V0dXBDYXRlZ29yaWVzRm9yQXhpcyhzZXJpZXMsIFwieGF4aXNcIiwgZGF0YXBvaW50cyk7XG4gICAgICAgIHNldHVwQ2F0ZWdvcmllc0ZvckF4aXMoc2VyaWVzLCBcInlheGlzXCIsIGRhdGFwb2ludHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXQocGxvdCkge1xuICAgICAgICBwbG90Lmhvb2tzLnByb2Nlc3NSYXdEYXRhLnB1c2gocHJvY2Vzc1Jhd0RhdGEpO1xuICAgICAgICBwbG90Lmhvb2tzLnByb2Nlc3NEYXRhcG9pbnRzLnB1c2gocHJvY2Vzc0RhdGFwb2ludHMpO1xuICAgIH1cbiAgICBcbiAgICAkLnBsb3QucGx1Z2lucy5wdXNoKHtcbiAgICAgICAgaW5pdDogaW5pdCxcbiAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgbmFtZTogJ2NhdGVnb3JpZXMnLFxuICAgICAgICB2ZXJzaW9uOiAnMS4wJ1xuICAgIH0pO1xufSkoalF1ZXJ5KTtcbiJdfQ==
