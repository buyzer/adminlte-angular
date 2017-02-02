/* Flot plugin for rendering pie charts.

Copyright (c) 2007-2013 IOLA and Ole Laursen.
Licensed under the MIT license.

The plugin assumes that each series has a single data value, and that each
value is a positive integer or zero.  Negative numbers don't make sense for a
pie chart, and have unpredictable results.  The values do NOT need to be
passed in as percentages; the plugin will calculate the total and per-slice
percentages internally.

* Created by Brian Medendorp

* Updated with contributions from btburnett3, Anthony Aragues and Xavi Ivars

The plugin supports these options:

	series: {
		pie: {
			show: true/false
			radius: 0-1 for percentage of fullsize, or a specified pixel length, or 'auto'
			innerRadius: 0-1 for percentage of fullsize or a specified pixel length, for creating a donut effect
			startAngle: 0-2 factor of PI used for starting angle (in radians) i.e 3/2 starts at the top, 0 and 2 have the same result
			tilt: 0-1 for percentage to tilt the pie, where 1 is no tilt, and 0 is completely flat (nothing will show)
			offset: {
				top: integer value to move the pie up or down
				left: integer value to move the pie left or right, or 'auto'
			},
			stroke: {
				color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#FFF')
				width: integer pixel width of the stroke
			},
			label: {
				show: true/false, or 'auto'
				formatter:  a user-defined function that modifies the text/style of the label text
				radius: 0-1 for percentage of fullsize, or a specified pixel length
				background: {
					color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#000')
					opacity: 0-1
				},
				threshold: 0-1 for the percentage value at which to hide labels (if they're too small)
			},
			combine: {
				threshold: 0-1 for the percentage value at which to combine slices (if they're too small)
				color: any hexidecimal color value (other formats may or may not work, so best to stick with something like '#CCC'), if null, the plugin will automatically use the color of the first slice to be combined
				label: any text value of what the combined slice should be labeled
			}
			highlight: {
				opacity: 0-1
			}
		}
	}

More detail and specific examples can be found in the included HTML file.

*/

(function($) {

	// Maximum redraw attempts when fitting labels within the plot

	var REDRAW_ATTEMPTS = 10;

	// Factor by which to shrink the pie when fitting labels within the plot

	var REDRAW_SHRINK = 0.95;

	function init(plot) {

		var canvas = null,
			target = null,
			options = null,
			maxRadius = null,
			centerLeft = null,
			centerTop = null,
			processed = false,
			ctx = null;

		// interactive variables

		var highlights = [];

		// add hook to determine if pie plugin in enabled, and then perform necessary operations

		plot.hooks.processOptions.push(function(plot, options) {
			if (options.series.pie.show) {

				options.grid.show = false;

				// set labels.show

				if (options.series.pie.label.show == "auto") {
					if (options.legend.show) {
						options.series.pie.label.show = false;
					} else {
						options.series.pie.label.show = true;
					}
				}

				// set radius

				if (options.series.pie.radius == "auto") {
					if (options.series.pie.label.show) {
						options.series.pie.radius = 3/4;
					} else {
						options.series.pie.radius = 1;
					}
				}

				// ensure sane tilt

				if (options.series.pie.tilt > 1) {
					options.series.pie.tilt = 1;
				} else if (options.series.pie.tilt < 0) {
					options.series.pie.tilt = 0;
				}
			}
		});

		plot.hooks.bindEvents.push(function(plot, eventHolder) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				if (options.grid.hoverable) {
					eventHolder.unbind("mousemove").mousemove(onMouseMove);
				}
				if (options.grid.clickable) {
					eventHolder.unbind("click").click(onClick);
				}
			}
		});

		plot.hooks.processDatapoints.push(function(plot, series, data, datapoints) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				processDatapoints(plot, series, data, datapoints);
			}
		});

		plot.hooks.drawOverlay.push(function(plot, octx) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				drawOverlay(plot, octx);
			}
		});

		plot.hooks.draw.push(function(plot, newCtx) {
			var options = plot.getOptions();
			if (options.series.pie.show) {
				draw(plot, newCtx);
			}
		});

		function processDatapoints(plot, series, datapoints) {
			if (!processed)	{
				processed = true;
				canvas = plot.getCanvas();
				target = $(canvas).parent();
				options = plot.getOptions();
				plot.setData(combine(plot.getData()));
			}
		}

		function combine(data) {

			var total = 0,
				combined = 0,
				numCombined = 0,
				color = options.series.pie.combine.color,
				newdata = [];

			// Fix up the raw data from Flot, ensuring the data is numeric

			for (var i = 0; i < data.length; ++i) {

				var value = data[i].data;

				// If the data is an array, we'll assume that it's a standard
				// Flot x-y pair, and are concerned only with the second value.

				// Note how we use the original array, rather than creating a
				// new one; this is more efficient and preserves any extra data
				// that the user may have stored in higher indexes.

				if ($.isArray(value) && value.length == 1) {
    				value = value[0];
				}

				if ($.isArray(value)) {
					// Equivalent to $.isNumeric() but compatible with jQuery < 1.7
					if (!isNaN(parseFloat(value[1])) && isFinite(value[1])) {
						value[1] = +value[1];
					} else {
						value[1] = 0;
					}
				} else if (!isNaN(parseFloat(value)) && isFinite(value)) {
					value = [1, +value];
				} else {
					value = [1, 0];
				}

				data[i].data = [value];
			}

			// Sum up all the slices, so we can calculate percentages for each

			for (var i = 0; i < data.length; ++i) {
				total += data[i].data[0][1];
			}

			// Count the number of slices with percentages below the combine
			// threshold; if it turns out to be just one, we won't combine.

			for (var i = 0; i < data.length; ++i) {
				var value = data[i].data[0][1];
				if (value / total <= options.series.pie.combine.threshold) {
					combined += value;
					numCombined++;
					if (!color) {
						color = data[i].color;
					}
				}
			}

			for (var i = 0; i < data.length; ++i) {
				var value = data[i].data[0][1];
				if (numCombined < 2 || value / total > options.series.pie.combine.threshold) {
					newdata.push({
						data: [[1, value]],
						color: data[i].color,
						label: data[i].label,
						angle: value * Math.PI * 2 / total,
						percent: value / (total / 100)
					});
				}
			}

			if (numCombined > 1) {
				newdata.push({
					data: [[1, combined]],
					color: color,
					label: options.series.pie.combine.label,
					angle: combined * Math.PI * 2 / total,
					percent: combined / (total / 100)
				});
			}

			return newdata;
		}

		function draw(plot, newCtx) {

			if (!target) {
				return; // if no series were passed
			}

			var canvasWidth = plot.getPlaceholder().width(),
				canvasHeight = plot.getPlaceholder().height(),
				legendWidth = target.children().filter(".legend").children().width() || 0;

			ctx = newCtx;

			// WARNING: HACK! REWRITE THIS CODE AS SOON AS POSSIBLE!

			// When combining smaller slices into an 'other' slice, we need to
			// add a new series.  Since Flot gives plugins no way to modify the
			// list of series, the pie plugin uses a hack where the first call
			// to processDatapoints results in a call to setData with the new
			// list of series, then subsequent processDatapoints do nothing.

			// The plugin-global 'processed' flag is used to control this hack;
			// it starts out false, and is set to true after the first call to
			// processDatapoints.

			// Unfortunately this turns future setData calls into no-ops; they
			// call processDatapoints, the flag is true, and nothing happens.

			// To fix this we'll set the flag back to false here in draw, when
			// all series have been processed, so the next sequence of calls to
			// processDatapoints once again starts out with a slice-combine.
			// This is really a hack; in 0.9 we need to give plugins a proper
			// way to modify series before any processing begins.

			processed = false;

			// calculate maximum radius and center point

			maxRadius =  Math.min(canvasWidth, canvasHeight / options.series.pie.tilt) / 2;
			centerTop = canvasHeight / 2 + options.series.pie.offset.top;
			centerLeft = canvasWidth / 2;

			if (options.series.pie.offset.left == "auto") {
				if (options.legend.position.match("w")) {
					centerLeft += legendWidth / 2;
				} else {
					centerLeft -= legendWidth / 2;
				}
				if (centerLeft < maxRadius) {
					centerLeft = maxRadius;
				} else if (centerLeft > canvasWidth - maxRadius) {
					centerLeft = canvasWidth - maxRadius;
				}
			} else {
				centerLeft += options.series.pie.offset.left;
			}

			var slices = plot.getData(),
				attempts = 0;

			// Keep shrinking the pie's radius until drawPie returns true,
			// indicating that all the labels fit, or we try too many times.

			do {
				if (attempts > 0) {
					maxRadius *= REDRAW_SHRINK;
				}
				attempts += 1;
				clear();
				if (options.series.pie.tilt <= 0.8) {
					drawShadow();
				}
			} while (!drawPie() && attempts < REDRAW_ATTEMPTS);

			if (attempts >= REDRAW_ATTEMPTS) {
				clear();
				target.prepend("<div class='error'>Could not draw pie with labels contained inside canvas</div>");
			}

			if (plot.setSeries && plot.insertLegend) {
				plot.setSeries(slices);
				plot.insertLegend();
			}

			// we're actually done at this point, just defining internal functions at this point

			function clear() {
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);
				target.children().filter(".pieLabel, .pieLabelBackground").remove();
			}

			function drawShadow() {

				var shadowLeft = options.series.pie.shadow.left;
				var shadowTop = options.series.pie.shadow.top;
				var edge = 10;
				var alpha = options.series.pie.shadow.alpha;
				var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;

				if (radius >= canvasWidth / 2 - shadowLeft || radius * options.series.pie.tilt >= canvasHeight / 2 - shadowTop || radius <= edge) {
					return;	// shadow would be outside canvas, so don't draw it
				}

				ctx.save();
				ctx.translate(shadowLeft,shadowTop);
				ctx.globalAlpha = alpha;
				ctx.fillStyle = "#000";

				// center and rotate to starting position

				ctx.translate(centerLeft,centerTop);
				ctx.scale(1, options.series.pie.tilt);

				//radius -= edge;

				for (var i = 1; i <= edge; i++) {
					ctx.beginPath();
					ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
					ctx.fill();
					radius -= i;
				}

				ctx.restore();
			}

			function drawPie() {

				var startAngle = Math.PI * options.series.pie.startAngle;
				var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;

				// center and rotate to starting position

				ctx.save();
				ctx.translate(centerLeft,centerTop);
				ctx.scale(1, options.series.pie.tilt);
				//ctx.rotate(startAngle); // start at top; -- This doesn't work properly in Opera

				// draw slices

				ctx.save();
				var currentAngle = startAngle;
				for (var i = 0; i < slices.length; ++i) {
					slices[i].startAngle = currentAngle;
					drawSlice(slices[i].angle, slices[i].color, true);
				}
				ctx.restore();

				// draw slice outlines

				if (options.series.pie.stroke.width > 0) {
					ctx.save();
					ctx.lineWidth = options.series.pie.stroke.width;
					currentAngle = startAngle;
					for (var i = 0; i < slices.length; ++i) {
						drawSlice(slices[i].angle, options.series.pie.stroke.color, false);
					}
					ctx.restore();
				}

				// draw donut hole

				drawDonutHole(ctx);

				ctx.restore();

				// Draw the labels, returning true if they fit within the plot

				if (options.series.pie.label.show) {
					return drawLabels();
				} else return true;

				function drawSlice(angle, color, fill) {

					if (angle <= 0 || isNaN(angle)) {
						return;
					}

					if (fill) {
						ctx.fillStyle = color;
					} else {
						ctx.strokeStyle = color;
						ctx.lineJoin = "round";
					}

					ctx.beginPath();
					if (Math.abs(angle - Math.PI * 2) > 0.000000001) {
						ctx.moveTo(0, 0); // Center of the pie
					}

					//ctx.arc(0, 0, radius, 0, angle, false); // This doesn't work properly in Opera
					ctx.arc(0, 0, radius,currentAngle, currentAngle + angle / 2, false);
					ctx.arc(0, 0, radius,currentAngle + angle / 2, currentAngle + angle, false);
					ctx.closePath();
					//ctx.rotate(angle); // This doesn't work properly in Opera
					currentAngle += angle;

					if (fill) {
						ctx.fill();
					} else {
						ctx.stroke();
					}
				}

				function drawLabels() {

					var currentAngle = startAngle;
					var radius = options.series.pie.label.radius > 1 ? options.series.pie.label.radius : maxRadius * options.series.pie.label.radius;

					for (var i = 0; i < slices.length; ++i) {
						if (slices[i].percent >= options.series.pie.label.threshold * 100) {
							if (!drawLabel(slices[i], currentAngle, i)) {
								return false;
							}
						}
						currentAngle += slices[i].angle;
					}

					return true;

					function drawLabel(slice, startAngle, index) {

						if (slice.data[0][1] == 0) {
							return true;
						}

						// format label text

						var lf = options.legend.labelFormatter, text, plf = options.series.pie.label.formatter;

						if (lf) {
							text = lf(slice.label, slice);
						} else {
							text = slice.label;
						}

						if (plf) {
							text = plf(text, slice);
						}

						var halfAngle = ((startAngle + slice.angle) + startAngle) / 2;
						var x = centerLeft + Math.round(Math.cos(halfAngle) * radius);
						var y = centerTop + Math.round(Math.sin(halfAngle) * radius) * options.series.pie.tilt;

						var html = "<span class='pieLabel' id='pieLabel" + index + "' style='position:absolute;top:" + y + "px;left:" + x + "px;'>" + text + "</span>";
						target.append(html);

						var label = target.children("#pieLabel" + index);
						var labelTop = (y - label.height() / 2);
						var labelLeft = (x - label.width() / 2);

						label.css("top", labelTop);
						label.css("left", labelLeft);

						// check to make sure that the label is not outside the canvas

						if (0 - labelTop > 0 || 0 - labelLeft > 0 || canvasHeight - (labelTop + label.height()) < 0 || canvasWidth - (labelLeft + label.width()) < 0) {
							return false;
						}

						if (options.series.pie.label.background.opacity != 0) {

							// put in the transparent background separately to avoid blended labels and label boxes

							var c = options.series.pie.label.background.color;

							if (c == null) {
								c = slice.color;
							}

							var pos = "top:" + labelTop + "px;left:" + labelLeft + "px;";
							$("<div class='pieLabelBackground' style='position:absolute;width:" + label.width() + "px;height:" + label.height() + "px;" + pos + "background-color:" + c + ";'></div>")
								.css("opacity", options.series.pie.label.background.opacity)
								.insertBefore(label);
						}

						return true;
					} // end individual label function
				} // end drawLabels function
			} // end drawPie function
		} // end draw function

		// Placed here because it needs to be accessed from multiple locations

		function drawDonutHole(layer) {
			if (options.series.pie.innerRadius > 0) {

				// subtract the center

				layer.save();
				var innerRadius = options.series.pie.innerRadius > 1 ? options.series.pie.innerRadius : maxRadius * options.series.pie.innerRadius;
				layer.globalCompositeOperation = "destination-out"; // this does not work with excanvas, but it will fall back to using the stroke color
				layer.beginPath();
				layer.fillStyle = options.series.pie.stroke.color;
				layer.arc(0, 0, innerRadius, 0, Math.PI * 2, false);
				layer.fill();
				layer.closePath();
				layer.restore();

				// add inner stroke

				layer.save();
				layer.beginPath();
				layer.strokeStyle = options.series.pie.stroke.color;
				layer.arc(0, 0, innerRadius, 0, Math.PI * 2, false);
				layer.stroke();
				layer.closePath();
				layer.restore();

				// TODO: add extra shadow inside hole (with a mask) if the pie is tilted.
			}
		}

		//-- Additional Interactive related functions --

		function isPointInPoly(poly, pt) {
			for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
				((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1]< poly[i][1]))
				&& (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
				&& (c = !c);
			return c;
		}

		function findNearbySlice(mouseX, mouseY) {

			var slices = plot.getData(),
				options = plot.getOptions(),
				radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius,
				x, y;

			for (var i = 0; i < slices.length; ++i) {

				var s = slices[i];

				if (s.pie.show) {

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(0, 0); // Center of the pie
					//ctx.scale(1, options.series.pie.tilt);	// this actually seems to break everything when here.
					ctx.arc(0, 0, radius, s.startAngle, s.startAngle + s.angle / 2, false);
					ctx.arc(0, 0, radius, s.startAngle + s.angle / 2, s.startAngle + s.angle, false);
					ctx.closePath();
					x = mouseX - centerLeft;
					y = mouseY - centerTop;

					if (ctx.isPointInPath) {
						if (ctx.isPointInPath(mouseX - centerLeft, mouseY - centerTop)) {
							ctx.restore();
							return {
								datapoint: [s.percent, s.data],
								dataIndex: 0,
								series: s,
								seriesIndex: i
							};
						}
					} else {

						// excanvas for IE doesn;t support isPointInPath, this is a workaround.

						var p1X = radius * Math.cos(s.startAngle),
							p1Y = radius * Math.sin(s.startAngle),
							p2X = radius * Math.cos(s.startAngle + s.angle / 4),
							p2Y = radius * Math.sin(s.startAngle + s.angle / 4),
							p3X = radius * Math.cos(s.startAngle + s.angle / 2),
							p3Y = radius * Math.sin(s.startAngle + s.angle / 2),
							p4X = radius * Math.cos(s.startAngle + s.angle / 1.5),
							p4Y = radius * Math.sin(s.startAngle + s.angle / 1.5),
							p5X = radius * Math.cos(s.startAngle + s.angle),
							p5Y = radius * Math.sin(s.startAngle + s.angle),
							arrPoly = [[0, 0], [p1X, p1Y], [p2X, p2Y], [p3X, p3Y], [p4X, p4Y], [p5X, p5Y]],
							arrPoint = [x, y];

						// TODO: perhaps do some mathmatical trickery here with the Y-coordinate to compensate for pie tilt?

						if (isPointInPoly(arrPoly, arrPoint)) {
							ctx.restore();
							return {
								datapoint: [s.percent, s.data],
								dataIndex: 0,
								series: s,
								seriesIndex: i
							};
						}
					}

					ctx.restore();
				}
			}

			return null;
		}

		function onMouseMove(e) {
			triggerClickHoverEvent("plothover", e);
		}

		function onClick(e) {
			triggerClickHoverEvent("plotclick", e);
		}

		// trigger click or hover event (they send the same parameters so we share their code)

		function triggerClickHoverEvent(eventname, e) {

			var offset = plot.offset();
			var canvasX = parseInt(e.pageX - offset.left);
			var canvasY =  parseInt(e.pageY - offset.top);
			var item = findNearbySlice(canvasX, canvasY);

			if (options.grid.autoHighlight) {

				// clear auto-highlights

				for (var i = 0; i < highlights.length; ++i) {
					var h = highlights[i];
					if (h.auto == eventname && !(item && h.series == item.series)) {
						unhighlight(h.series);
					}
				}
			}

			// highlight the slice

			if (item) {
				highlight(item.series, eventname);
			}

			// trigger any hover bind events

			var pos = { pageX: e.pageX, pageY: e.pageY };
			target.trigger(eventname, [pos, item]);
		}

		function highlight(s, auto) {
			//if (typeof s == "number") {
			//	s = series[s];
			//}

			var i = indexOfHighlight(s);

			if (i == -1) {
				highlights.push({ series: s, auto: auto });
				plot.triggerRedrawOverlay();
			} else if (!auto) {
				highlights[i].auto = false;
			}
		}

		function unhighlight(s) {
			if (s == null) {
				highlights = [];
				plot.triggerRedrawOverlay();
			}

			//if (typeof s == "number") {
			//	s = series[s];
			//}

			var i = indexOfHighlight(s);

			if (i != -1) {
				highlights.splice(i, 1);
				plot.triggerRedrawOverlay();
			}
		}

		function indexOfHighlight(s) {
			for (var i = 0; i < highlights.length; ++i) {
				var h = highlights[i];
				if (h.series == s)
					return i;
			}
			return -1;
		}

		function drawOverlay(plot, octx) {

			var options = plot.getOptions();

			var radius = options.series.pie.radius > 1 ? options.series.pie.radius : maxRadius * options.series.pie.radius;

			octx.save();
			octx.translate(centerLeft, centerTop);
			octx.scale(1, options.series.pie.tilt);

			for (var i = 0; i < highlights.length; ++i) {
				drawHighlight(highlights[i].series);
			}

			drawDonutHole(octx);

			octx.restore();

			function drawHighlight(series) {

				if (series.angle <= 0 || isNaN(series.angle)) {
					return;
				}

				//octx.fillStyle = parseColor(options.series.pie.highlight.color).scale(null, null, null, options.series.pie.highlight.opacity).toString();
				octx.fillStyle = "rgba(255, 255, 255, " + options.series.pie.highlight.opacity + ")"; // this is temporary until we have access to parseColor
				octx.beginPath();
				if (Math.abs(series.angle - Math.PI * 2) > 0.000000001) {
					octx.moveTo(0, 0); // Center of the pie
				}
				octx.arc(0, 0, radius, series.startAngle, series.startAngle + series.angle / 2, false);
				octx.arc(0, 0, radius, series.startAngle + series.angle / 2, series.startAngle + series.angle, false);
				octx.closePath();
				octx.fill();
			}
		}
	} // end init (plugin body)

	// define pie specific options and their default values

	var options = {
		series: {
			pie: {
				show: false,
				radius: "auto",	// actual radius of the visible pie (based on full calculated radius if <=1, or hard pixel value)
				innerRadius: 0, /* for donut */
				startAngle: 3/2,
				tilt: 1,
				shadow: {
					left: 5,	// shadow left offset
					top: 15,	// shadow top offset
					alpha: 0.02	// shadow alpha
				},
				offset: {
					top: 0,
					left: "auto"
				},
				stroke: {
					color: "#fff",
					width: 1
				},
				label: {
					show: "auto",
					formatter: function(label, slice) {
						return "<div style='font-size:x-small;text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + Math.round(slice.percent) + "%</div>";
					},	// formatter function
					radius: 1,	// radius at which to place the labels (based on full calculated radius if <=1, or hard pixel value)
					background: {
						color: null,
						opacity: 0
					},
					threshold: 0	// percentage at which to hide the label (i.e. the slice is too narrow)
				},
				combine: {
					threshold: -1,	// percentage at which to combine little slices into one larger slice
					color: null,	// color to give the new slice (auto-generated if null)
					label: "Other"	// label to give the new slice
				},
				highlight: {
					//color: "#fff",		// will add this functionality once parseColor is available
					opacity: 0.5
				}
			}
		}
	};

	$.plot.plugins.push({
		init: init,
		options: options,
		name: "pie",
		version: "1.1"
	});

})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5mbG90LnBpZS5qcyJdLCJuYW1lcyI6WyIkIiwiaW5pdCIsInBsb3QiLCJwcm9jZXNzRGF0YXBvaW50cyIsInNlcmllcyIsImRhdGFwb2ludHMiLCJwcm9jZXNzZWQiLCJjYW52YXMiLCJnZXRDYW52YXMiLCJ0YXJnZXQiLCJwYXJlbnQiLCJvcHRpb25zIiwiZ2V0T3B0aW9ucyIsInNldERhdGEiLCJjb21iaW5lIiwiZ2V0RGF0YSIsImRhdGEiLCJ0b3RhbCIsImNvbWJpbmVkIiwibnVtQ29tYmluZWQiLCJjb2xvciIsInBpZSIsIm5ld2RhdGEiLCJpIiwibGVuZ3RoIiwidmFsdWUiLCJpc0FycmF5IiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJ0aHJlc2hvbGQiLCJwdXNoIiwibGFiZWwiLCJhbmdsZSIsIk1hdGgiLCJQSSIsInBlcmNlbnQiLCJkcmF3IiwibmV3Q3R4IiwiY2xlYXIiLCJjdHgiLCJjbGVhclJlY3QiLCJjYW52YXNXaWR0aCIsImNhbnZhc0hlaWdodCIsImNoaWxkcmVuIiwiZmlsdGVyIiwicmVtb3ZlIiwiZHJhd1NoYWRvdyIsInNoYWRvd0xlZnQiLCJzaGFkb3ciLCJsZWZ0Iiwic2hhZG93VG9wIiwidG9wIiwiZWRnZSIsImFscGhhIiwicmFkaXVzIiwibWF4UmFkaXVzIiwidGlsdCIsInNhdmUiLCJ0cmFuc2xhdGUiLCJnbG9iYWxBbHBoYSIsImZpbGxTdHlsZSIsImNlbnRlckxlZnQiLCJjZW50ZXJUb3AiLCJzY2FsZSIsImJlZ2luUGF0aCIsImFyYyIsImZpbGwiLCJyZXN0b3JlIiwiZHJhd1BpZSIsImRyYXdTbGljZSIsInN0cm9rZVN0eWxlIiwibGluZUpvaW4iLCJhYnMiLCJtb3ZlVG8iLCJjdXJyZW50QW5nbGUiLCJjbG9zZVBhdGgiLCJzdHJva2UiLCJkcmF3TGFiZWxzIiwiZHJhd0xhYmVsIiwic2xpY2UiLCJzdGFydEFuZ2xlIiwiaW5kZXgiLCJ0ZXh0IiwibGYiLCJsZWdlbmQiLCJsYWJlbEZvcm1hdHRlciIsInBsZiIsImZvcm1hdHRlciIsImhhbGZBbmdsZSIsIngiLCJyb3VuZCIsImNvcyIsInkiLCJzaW4iLCJodG1sIiwiYXBwZW5kIiwibGFiZWxUb3AiLCJoZWlnaHQiLCJsYWJlbExlZnQiLCJ3aWR0aCIsImNzcyIsImJhY2tncm91bmQiLCJvcGFjaXR5IiwiYyIsInBvcyIsImluc2VydEJlZm9yZSIsInNsaWNlcyIsImxpbmVXaWR0aCIsImRyYXdEb251dEhvbGUiLCJzaG93IiwiZ2V0UGxhY2Vob2xkZXIiLCJsZWdlbmRXaWR0aCIsIm1pbiIsIm9mZnNldCIsInBvc2l0aW9uIiwibWF0Y2giLCJhdHRlbXB0cyIsIlJFRFJBV19TSFJJTksiLCJSRURSQVdfQVRURU1QVFMiLCJwcmVwZW5kIiwic2V0U2VyaWVzIiwiaW5zZXJ0TGVnZW5kIiwibGF5ZXIiLCJpbm5lclJhZGl1cyIsImdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiIsImlzUG9pbnRJblBvbHkiLCJwb2x5IiwicHQiLCJsIiwiaiIsImZpbmROZWFyYnlTbGljZSIsIm1vdXNlWCIsIm1vdXNlWSIsInMiLCJpc1BvaW50SW5QYXRoIiwiZGF0YXBvaW50IiwiZGF0YUluZGV4Iiwic2VyaWVzSW5kZXgiLCJwMVgiLCJwMVkiLCJwMlgiLCJwMlkiLCJwM1giLCJwM1kiLCJwNFgiLCJwNFkiLCJwNVgiLCJwNVkiLCJhcnJQb2x5IiwiYXJyUG9pbnQiLCJvbk1vdXNlTW92ZSIsImUiLCJ0cmlnZ2VyQ2xpY2tIb3ZlckV2ZW50Iiwib25DbGljayIsImV2ZW50bmFtZSIsImNhbnZhc1giLCJwYXJzZUludCIsInBhZ2VYIiwiY2FudmFzWSIsInBhZ2VZIiwiaXRlbSIsImdyaWQiLCJhdXRvSGlnaGxpZ2h0IiwiaGlnaGxpZ2h0cyIsImgiLCJhdXRvIiwidW5oaWdobGlnaHQiLCJoaWdobGlnaHQiLCJ0cmlnZ2VyIiwiaW5kZXhPZkhpZ2hsaWdodCIsInRyaWdnZXJSZWRyYXdPdmVybGF5Iiwic3BsaWNlIiwiZHJhd092ZXJsYXkiLCJvY3R4IiwiZHJhd0hpZ2hsaWdodCIsImhvb2tzIiwicHJvY2Vzc09wdGlvbnMiLCJiaW5kRXZlbnRzIiwiZXZlbnRIb2xkZXIiLCJob3ZlcmFibGUiLCJ1bmJpbmQiLCJtb3VzZW1vdmUiLCJjbGlja2FibGUiLCJjbGljayIsInBsdWdpbnMiLCJuYW1lIiwidmVyc2lvbiIsImpRdWVyeSJdLCJtYXBwaW5ncyI6IkNBeURBLFNBQVVBLEdBVVQsUUFBU0MsR0FBS0MsR0FxRmIsUUFBU0MsR0FBa0JELEVBQU1FLEVBQVFDLEdBQ25DQyxJQUNKQSxHQUFZLEVBQ1pDLEVBQVNMLEVBQUtNLFlBQ2RDLEVBQVNULEVBQUVPLEdBQVFHLFNBQ25CQyxFQUFVVCxFQUFLVSxhQUNmVixFQUFLVyxRQUFRQyxFQUFRWixFQUFLYSxhQUk1QixRQUFTRCxHQUFRRSxHQVVoQixJQUFLLEdBUkRDLEdBQVEsRUFDWEMsRUFBVyxFQUNYQyxFQUFjLEVBQ2RDLEVBQVFULEVBQVFQLE9BQU9pQixJQUFJUCxRQUFRTSxNQUNuQ0UsS0FJUUMsRUFBSSxFQUFHQSxFQUFJUCxFQUFLUSxTQUFVRCxFQUFHLENBRXJDLEdBQUlFLEdBQVFULEVBQUtPLEdBQUdQLElBU2hCaEIsR0FBRTBCLFFBQVFELElBQTBCLEdBQWhCQSxFQUFNRCxTQUMxQkMsRUFBUUEsRUFBTSxJQUdkekIsRUFBRTBCLFFBQVFELElBRVJFLE1BQU1DLFdBQVdILEVBQU0sTUFBUUksU0FBU0osRUFBTSxJQUNsREEsRUFBTSxJQUFNQSxFQUFNLEdBRWxCQSxFQUFNLEdBQUssRUFHWkEsR0FEV0UsTUFBTUMsV0FBV0gsS0FBV0ksU0FBU0osSUFDdkMsR0FBSUEsSUFFSixFQUFHLEdBR2JULEVBQUtPLEdBQUdQLE1BQVFTLEdBS2pCLElBQUssR0FBSUYsR0FBSSxFQUFHQSxFQUFJUCxFQUFLUSxTQUFVRCxFQUNsQ04sR0FBU0QsRUFBS08sR0FBR1AsS0FBSyxHQUFHLEVBTTFCLEtBQUssR0FBSU8sR0FBSSxFQUFHQSxFQUFJUCxFQUFLUSxTQUFVRCxFQUFHLENBQ3JDLEdBQUlF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SXhDSCxFQUFLOEssTUFBTUgsWUFBWTlJLEtBQUssU0FBUzdCLEVBQU00SyxHQUMxQyxHQUFJbkssR0FBVVQsRUFBS1UsWUFDZkQsR0FBUVAsT0FBT2lCLElBQUl5RixNQUN0QitELEVBQVkzSyxFQUFNNEssS0FJcEI1SyxFQUFLOEssTUFBTTNJLEtBQUtOLEtBQUssU0FBUzdCLEVBQU1vQyxHQUNuQyxHQUFJM0IsR0FBVVQsRUFBS1UsWUFDZkQsR0FBUVAsT0FBT2lCLElBQUl5RixNQUN0QnpFLEVBQUtuQyxFQUFNb0MsS0F2RmQsR0FBSWlGLEdBQWtCLEdBSWxCRCxFQUFnQixJQTByQmhCM0csR0FDSFAsUUFDQ2lCLEtBQ0N5RixNQUFNLEVBQ052RCxPQUFRLE9BQ1JxRSxZQUFhLEVBQ2IzQyxXQUFZLElBQ1p4QixLQUFNLEVBQ05SLFFBQ0NDLEtBQU0sRUFDTkUsSUFBSyxHQUNMRSxNQUFPLEtBRVI0RCxRQUNDOUQsSUFBSyxFQUNMRixLQUFNLFFBRVAyQixRQUNDekQsTUFBTyxPQUNQZ0YsTUFBTyxHQUVScEUsT0FDQzhFLEtBQU0sT0FDTnRCLFVBQVcsU0FBU3hELEVBQU9nRCxHQUMxQixNQUFPLHFFQUF1RUEsRUFBTTVELE1BQVEsTUFBUVksRUFBUSxRQUFVRSxLQUFLeUQsTUFBTVgsRUFBTTVDLFNBQVcsV0FFbkptQixPQUFRLEVBQ1IrQyxZQUNDbEYsTUFBTyxLQUNQbUYsUUFBUyxHQUVWekUsVUFBVyxHQUVaaEIsU0FDQ2dCLFdBQVcsRUFDWFYsTUFBTyxLQUNQWSxNQUFPLFNBRVJ3SSxXQUVDakUsUUFBUyxNQU1idkcsR0FBRUUsS0FBS3VMLFFBQVExSixNQUNkOUIsS0FBTUEsRUFDTlUsUUFBU0EsRUFDVCtLLEtBQU0sTUFDTkMsUUFBUyxTQUdSQyIsImZpbGUiOiJqcXVlcnkuZmxvdC5waWUtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBGbG90IHBsdWdpbiBmb3IgcmVuZGVyaW5nIHBpZSBjaGFydHMuXG5cbkNvcHlyaWdodCAoYykgMjAwNy0yMDEzIElPTEEgYW5kIE9sZSBMYXVyc2VuLlxuTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG5UaGUgcGx1Z2luIGFzc3VtZXMgdGhhdCBlYWNoIHNlcmllcyBoYXMgYSBzaW5nbGUgZGF0YSB2YWx1ZSwgYW5kIHRoYXQgZWFjaFxudmFsdWUgaXMgYSBwb3NpdGl2ZSBpbnRlZ2VyIG9yIHplcm8uICBOZWdhdGl2ZSBudW1iZXJzIGRvbid0IG1ha2Ugc2Vuc2UgZm9yIGFcbnBpZSBjaGFydCwgYW5kIGhhdmUgdW5wcmVkaWN0YWJsZSByZXN1bHRzLiAgVGhlIHZhbHVlcyBkbyBOT1QgbmVlZCB0byBiZVxucGFzc2VkIGluIGFzIHBlcmNlbnRhZ2VzOyB0aGUgcGx1Z2luIHdpbGwgY2FsY3VsYXRlIHRoZSB0b3RhbCBhbmQgcGVyLXNsaWNlXG5wZXJjZW50YWdlcyBpbnRlcm5hbGx5LlxuXG4qIENyZWF0ZWQgYnkgQnJpYW4gTWVkZW5kb3JwXG5cbiogVXBkYXRlZCB3aXRoIGNvbnRyaWJ1dGlvbnMgZnJvbSBidGJ1cm5ldHQzLCBBbnRob255IEFyYWd1ZXMgYW5kIFhhdmkgSXZhcnNcblxuVGhlIHBsdWdpbiBzdXBwb3J0cyB0aGVzZSBvcHRpb25zOlxuXG5cdHNlcmllczoge1xuXHRcdHBpZToge1xuXHRcdFx0c2hvdzogdHJ1ZS9mYWxzZVxuXHRcdFx0cmFkaXVzOiAwLTEgZm9yIHBlcmNlbnRhZ2Ugb2YgZnVsbHNpemUsIG9yIGEgc3BlY2lmaWVkIHBpeGVsIGxlbmd0aCwgb3IgJ2F1dG8nXG5cdFx0XHRpbm5lclJhZGl1czogMC0xIGZvciBwZXJjZW50YWdlIG9mIGZ1bGxzaXplIG9yIGEgc3BlY2lmaWVkIHBpeGVsIGxlbmd0aCwgZm9yIGNyZWF0aW5nIGEgZG9udXQgZWZmZWN0XG5cdFx0XHRzdGFydEFuZ2xlOiAwLTIgZmFjdG9yIG9mIFBJIHVzZWQgZm9yIHN0YXJ0aW5nIGFuZ2xlIChpbiByYWRpYW5zKSBpLmUgMy8yIHN0YXJ0cyBhdCB0aGUgdG9wLCAwIGFuZCAyIGhhdmUgdGhlIHNhbWUgcmVzdWx0XG5cdFx0XHR0aWx0OiAwLTEgZm9yIHBlcmNlbnRhZ2UgdG8gdGlsdCB0aGUgcGllLCB3aGVyZSAxIGlzIG5vIHRpbHQsIGFuZCAwIGlzIGNvbXBsZXRlbHkgZmxhdCAobm90aGluZyB3aWxsIHNob3cpXG5cdFx0XHRvZmZzZXQ6IHtcblx0XHRcdFx0dG9wOiBpbnRlZ2VyIHZhbHVlIHRvIG1vdmUgdGhlIHBpZSB1cCBvciBkb3duXG5cdFx0XHRcdGxlZnQ6IGludGVnZXIgdmFsdWUgdG8gbW92ZSB0aGUgcGllIGxlZnQgb3IgcmlnaHQsIG9yICdhdXRvJ1xuXHRcdFx0fSxcblx0XHRcdHN0cm9rZToge1xuXHRcdFx0XHRjb2xvcjogYW55IGhleGlkZWNpbWFsIGNvbG9yIHZhbHVlIChvdGhlciBmb3JtYXRzIG1heSBvciBtYXkgbm90IHdvcmssIHNvIGJlc3QgdG8gc3RpY2sgd2l0aCBzb21ldGhpbmcgbGlrZSAnI0ZGRicpXG5cdFx0XHRcdHdpZHRoOiBpbnRlZ2VyIHBpeGVsIHdpZHRoIG9mIHRoZSBzdHJva2Vcblx0XHRcdH0sXG5cdFx0XHRsYWJlbDoge1xuXHRcdFx0XHRzaG93OiB0cnVlL2ZhbHNlLCBvciAnYXV0bydcblx0XHRcdFx0Zm9ybWF0dGVyOiAgYSB1c2VyLWRlZmluZWQgZnVuY3Rpb24gdGhhdCBtb2RpZmllcyB0aGUgdGV4dC9zdHlsZSBvZiB0aGUgbGFiZWwgdGV4dFxuXHRcdFx0XHRyYWRpdXM6IDAtMSBmb3IgcGVyY2VudGFnZSBvZiBmdWxsc2l6ZSwgb3IgYSBzcGVjaWZpZWQgcGl4ZWwgbGVuZ3RoXG5cdFx0XHRcdGJhY2tncm91bmQ6IHtcblx0XHRcdFx0XHRjb2xvcjogYW55IGhleGlkZWNpbWFsIGNvbG9yIHZhbHVlIChvdGhlciBmb3JtYXRzIG1heSBvciBtYXkgbm90IHdvcmssIHNvIGJlc3QgdG8gc3RpY2sgd2l0aCBzb21ldGhpbmcgbGlrZSAnIzAwMCcpXG5cdFx0XHRcdFx0b3BhY2l0eTogMC0xXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRocmVzaG9sZDogMC0xIGZvciB0aGUgcGVyY2VudGFnZSB2YWx1ZSBhdCB3aGljaCB0byBoaWRlIGxhYmVscyAoaWYgdGhleSdyZSB0b28gc21hbGwpXG5cdFx0XHR9LFxuXHRcdFx0Y29tYmluZToge1xuXHRcdFx0XHR0aHJlc2hvbGQ6IDAtMSBmb3IgdGhlIHBlcmNlbnRhZ2UgdmFsdWUgYXQgd2hpY2ggdG8gY29tYmluZSBzbGljZXMgKGlmIHRoZXkncmUgdG9vIHNtYWxsKVxuXHRcdFx0XHRjb2xvcjogYW55IGhleGlkZWNpbWFsIGNvbG9yIHZhbHVlIChvdGhlciBmb3JtYXRzIG1heSBvciBtYXkgbm90IHdvcmssIHNvIGJlc3QgdG8gc3RpY2sgd2l0aCBzb21ldGhpbmcgbGlrZSAnI0NDQycpLCBpZiBudWxsLCB0aGUgcGx1Z2luIHdpbGwgYXV0b21hdGljYWxseSB1c2UgdGhlIGNvbG9yIG9mIHRoZSBmaXJzdCBzbGljZSB0byBiZSBjb21iaW5lZFxuXHRcdFx0XHRsYWJlbDogYW55IHRleHQgdmFsdWUgb2Ygd2hhdCB0aGUgY29tYmluZWQgc2xpY2Ugc2hvdWxkIGJlIGxhYmVsZWRcblx0XHRcdH1cblx0XHRcdGhpZ2hsaWdodDoge1xuXHRcdFx0XHRvcGFjaXR5OiAwLTFcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuTW9yZSBkZXRhaWwgYW5kIHNwZWNpZmljIGV4YW1wbGVzIGNhbiBiZSBmb3VuZCBpbiB0aGUgaW5jbHVkZWQgSFRNTCBmaWxlLlxuXG4qL1xuXG4oZnVuY3Rpb24oJCkge1xuXG5cdC8vIE1heGltdW0gcmVkcmF3IGF0dGVtcHRzIHdoZW4gZml0dGluZyBsYWJlbHMgd2l0aGluIHRoZSBwbG90XG5cblx0dmFyIFJFRFJBV19BVFRFTVBUUyA9IDEwO1xuXG5cdC8vIEZhY3RvciBieSB3aGljaCB0byBzaHJpbmsgdGhlIHBpZSB3aGVuIGZpdHRpbmcgbGFiZWxzIHdpdGhpbiB0aGUgcGxvdFxuXG5cdHZhciBSRURSQVdfU0hSSU5LID0gMC45NTtcblxuXHRmdW5jdGlvbiBpbml0KHBsb3QpIHtcblxuXHRcdHZhciBjYW52YXMgPSBudWxsLFxuXHRcdFx0dGFyZ2V0ID0gbnVsbCxcblx0XHRcdG9wdGlvbnMgPSBudWxsLFxuXHRcdFx0bWF4UmFkaXVzID0gbnVsbCxcblx0XHRcdGNlbnRlckxlZnQgPSBudWxsLFxuXHRcdFx0Y2VudGVyVG9wID0gbnVsbCxcblx0XHRcdHByb2Nlc3NlZCA9IGZhbHNlLFxuXHRcdFx0Y3R4ID0gbnVsbDtcblxuXHRcdC8vIGludGVyYWN0aXZlIHZhcmlhYmxlc1xuXG5cdFx0dmFyIGhpZ2hsaWdodHMgPSBbXTtcblxuXHRcdC8vIGFkZCBob29rIHRvIGRldGVybWluZSBpZiBwaWUgcGx1Z2luIGluIGVuYWJsZWQsIGFuZCB0aGVuIHBlcmZvcm0gbmVjZXNzYXJ5IG9wZXJhdGlvbnNcblxuXHRcdHBsb3QuaG9va3MucHJvY2Vzc09wdGlvbnMucHVzaChmdW5jdGlvbihwbG90LCBvcHRpb25zKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpZXMucGllLnNob3cpIHtcblxuXHRcdFx0XHRvcHRpb25zLmdyaWQuc2hvdyA9IGZhbHNlO1xuXG5cdFx0XHRcdC8vIHNldCBsYWJlbHMuc2hvd1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLnNlcmllcy5waWUubGFiZWwuc2hvdyA9PSBcImF1dG9cIikge1xuXHRcdFx0XHRcdGlmIChvcHRpb25zLmxlZ2VuZC5zaG93KSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLnNlcmllcy5waWUubGFiZWwuc2hvdyA9IGZhbHNlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLnNlcmllcy5waWUubGFiZWwuc2hvdyA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gc2V0IHJhZGl1c1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLnNlcmllcy5waWUucmFkaXVzID09IFwiYXV0b1wiKSB7XG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMuc2VyaWVzLnBpZS5sYWJlbC5zaG93KSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLnNlcmllcy5waWUucmFkaXVzID0gMy80O1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLnNlcmllcy5waWUucmFkaXVzID0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBlbnN1cmUgc2FuZSB0aWx0XG5cblx0XHRcdFx0aWYgKG9wdGlvbnMuc2VyaWVzLnBpZS50aWx0ID4gMSkge1xuXHRcdFx0XHRcdG9wdGlvbnMuc2VyaWVzLnBpZS50aWx0ID0gMTtcblx0XHRcdFx0fSBlbHNlIGlmIChvcHRpb25zLnNlcmllcy5waWUudGlsdCA8IDApIHtcblx0XHRcdFx0XHRvcHRpb25zLnNlcmllcy5waWUudGlsdCA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHBsb3QuaG9va3MuYmluZEV2ZW50cy5wdXNoKGZ1bmN0aW9uKHBsb3QsIGV2ZW50SG9sZGVyKSB7XG5cdFx0XHR2YXIgb3B0aW9ucyA9IHBsb3QuZ2V0T3B0aW9ucygpO1xuXHRcdFx0aWYgKG9wdGlvbnMuc2VyaWVzLnBpZS5zaG93KSB7XG5cdFx0XHRcdGlmIChvcHRpb25zLmdyaWQuaG92ZXJhYmxlKSB7XG5cdFx0XHRcdFx0ZXZlbnRIb2xkZXIudW5iaW5kKFwibW91c2Vtb3ZlXCIpLm1vdXNlbW92ZShvbk1vdXNlTW92ZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG9wdGlvbnMuZ3JpZC5jbGlja2FibGUpIHtcblx0XHRcdFx0XHRldmVudEhvbGRlci51bmJpbmQoXCJjbGlja1wiKS5jbGljayhvbkNsaWNrKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cGxvdC5ob29rcy5wcm9jZXNzRGF0YXBvaW50cy5wdXNoKGZ1bmN0aW9uKHBsb3QsIHNlcmllcywgZGF0YSwgZGF0YXBvaW50cykge1xuXHRcdFx0dmFyIG9wdGlvbnMgPSBwbG90LmdldE9wdGlvbnMoKTtcblx0XHRcdGlmIChvcHRpb25zLnNlcmllcy5waWUuc2hvdykge1xuXHRcdFx0XHRwcm9jZXNzRGF0YXBvaW50cyhwbG90LCBzZXJpZXMsIGRhdGEsIGRhdGFwb2ludHMpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cGxvdC5ob29rcy5kcmF3T3ZlcmxheS5wdXNoKGZ1bmN0aW9uKHBsb3QsIG9jdHgpIHtcblx0XHRcdHZhciBvcHRpb25zID0gcGxvdC5nZXRPcHRpb25zKCk7XG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpZXMucGllLnNob3cpIHtcblx0XHRcdFx0ZHJhd092ZXJsYXkocGxvdCwgb2N0eCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRwbG90Lmhvb2tzLmRyYXcucHVzaChmdW5jdGlvbihwbG90LCBuZXdDdHgpIHtcblx0XHRcdHZhciBvcHRpb25zID0gcGxvdC5nZXRPcHRpb25zKCk7XG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpZXMucGllLnNob3cpIHtcblx0XHRcdFx0ZHJhdyhwbG90LCBuZXdDdHgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gcHJvY2Vzc0RhdGFwb2ludHMocGxvdCwgc2VyaWVzLCBkYXRhcG9pbnRzKSB7XG5cdFx0XHRpZiAoIXByb2Nlc3NlZClcdHtcblx0XHRcdFx0cHJvY2Vzc2VkID0gdHJ1ZTtcblx0XHRcdFx0Y2FudmFzID0gcGxvdC5nZXRDYW52YXMoKTtcblx0XHRcdFx0dGFyZ2V0ID0gJChjYW52YXMpLnBhcmVudCgpO1xuXHRcdFx0XHRvcHRpb25zID0gcGxvdC5nZXRPcHRpb25zKCk7XG5cdFx0XHRcdHBsb3Quc2V0RGF0YShjb21iaW5lKHBsb3QuZ2V0RGF0YSgpKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gY29tYmluZShkYXRhKSB7XG5cblx0XHRcdHZhciB0b3RhbCA9IDAsXG5cdFx0XHRcdGNvbWJpbmVkID0gMCxcblx0XHRcdFx0bnVtQ29tYmluZWQgPSAwLFxuXHRcdFx0XHRjb2xvciA9IG9wdGlvbnMuc2VyaWVzLnBpZS5jb21iaW5lLmNvbG9yLFxuXHRcdFx0XHRuZXdkYXRhID0gW107XG5cblx0XHRcdC8vIEZpeCB1cCB0aGUgcmF3IGRhdGEgZnJvbSBGbG90LCBlbnN1cmluZyB0aGUgZGF0YSBpcyBudW1lcmljXG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7ICsraSkge1xuXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbaV0uZGF0YTtcblxuXHRcdFx0XHQvLyBJZiB0aGUgZGF0YSBpcyBhbiBhcnJheSwgd2UnbGwgYXNzdW1lIHRoYXQgaXQncyBhIHN0YW5kYXJkXG5cdFx0XHRcdC8vIEZsb3QgeC15IHBhaXIsIGFuZCBhcmUgY29uY2VybmVkIG9ubHkgd2l0aCB0aGUgc2Vjb25kIHZhbHVlLlxuXG5cdFx0XHRcdC8vIE5vdGUgaG93IHdlIHVzZSB0aGUgb3JpZ2luYWwgYXJyYXksIHJhdGhlciB0aGFuIGNyZWF0aW5nIGFcblx0XHRcdFx0Ly8gbmV3IG9uZTsgdGhpcyBpcyBtb3JlIGVmZmljaWVudCBhbmQgcHJlc2VydmVzIGFueSBleHRyYSBkYXRhXG5cdFx0XHRcdC8vIHRoYXQgdGhlIHVzZXIgbWF5IGhhdmUgc3RvcmVkIGluIGhpZ2hlciBpbmRleGVzLlxuXG5cdFx0XHRcdGlmICgkLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PSAxKSB7XG4gICAgXHRcdFx0XHR2YWx1ZSA9IHZhbHVlWzBdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCQuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBFcXVpdmFsZW50IHRvICQuaXNOdW1lcmljKCkgYnV0IGNvbXBhdGlibGUgd2l0aCBqUXVlcnkgPCAxLjdcblx0XHRcdFx0XHRpZiAoIWlzTmFOKHBhcnNlRmxvYXQodmFsdWVbMV0pKSAmJiBpc0Zpbml0ZSh2YWx1ZVsxXSkpIHtcblx0XHRcdFx0XHRcdHZhbHVlWzFdID0gK3ZhbHVlWzFdO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YWx1ZVsxXSA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKCFpc05hTihwYXJzZUZsb2F0KHZhbHVlKSkgJiYgaXNGaW5pdGUodmFsdWUpKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBbMSwgK3ZhbHVlXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YWx1ZSA9IFsxLCAwXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRhdGFbaV0uZGF0YSA9IFt2YWx1ZV07XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN1bSB1cCBhbGwgdGhlIHNsaWNlcywgc28gd2UgY2FuIGNhbGN1bGF0ZSBwZXJjZW50YWdlcyBmb3IgZWFjaFxuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0dG90YWwgKz0gZGF0YVtpXS5kYXRhWzBdWzFdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb3VudCB0aGUgbnVtYmVyIG9mIHNsaWNlcyB3aXRoIHBlcmNlbnRhZ2VzIGJlbG93IHRoZSBjb21iaW5lXG5cdFx0XHQvLyB0aHJlc2hvbGQ7IGlmIGl0IHR1cm5zIG91dCB0byBiZSBqdXN0IG9uZSwgd2Ugd29uJ3QgY29tYmluZS5cblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbaV0uZGF0YVswXVsxXTtcblx0XHRcdFx0aWYgKHZhbHVlIC8gdG90YWwgPD0gb3B0aW9ucy5zZXJpZXMucGllLmNvbWJpbmUudGhyZXNob2xkKSB7XG5cdFx0XHRcdFx0Y29tYmluZWQgKz0gdmFsdWU7XG5cdFx0XHRcdFx0bnVtQ29tYmluZWQrKztcblx0XHRcdFx0XHRpZiAoIWNvbG9yKSB7XG5cdFx0XHRcdFx0XHRjb2xvciA9IGRhdGFbaV0uY29sb3I7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBkYXRhW2ldLmRhdGFbMF1bMV07XG5cdFx0XHRcdGlmIChudW1Db21iaW5lZCA8IDIgfHwgdmFsdWUgLyB0b3RhbCA+IG9wdGlvbnMuc2VyaWVzLnBpZS5jb21iaW5lLnRocmVzaG9sZCkge1xuXHRcdFx0XHRcdG5ld2RhdGEucHVzaCh7XG5cdFx0XHRcdFx0XHRkYXRhOiBbWzEsIHZhbHVlXV0sXG5cdFx0XHRcdFx0XHRjb2xvcjogZGF0YVtpXS5jb2xvcixcblx0XHRcdFx0XHRcdGxhYmVsOiBkYXRhW2ldLmxhYmVsLFxuXHRcdFx0XHRcdFx0YW5nbGU6IHZhbHVlICogTWF0aC5QSSAqIDIgLyB0b3RhbCxcblx0XHRcdFx0XHRcdHBlcmNlbnQ6IHZhbHVlIC8gKHRvdGFsIC8gMTAwKVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChudW1Db21iaW5lZCA+IDEpIHtcblx0XHRcdFx0bmV3ZGF0YS5wdXNoKHtcblx0XHRcdFx0XHRkYXRhOiBbWzEsIGNvbWJpbmVkXV0sXG5cdFx0XHRcdFx0Y29sb3I6IGNvbG9yLFxuXHRcdFx0XHRcdGxhYmVsOiBvcHRpb25zLnNlcmllcy5waWUuY29tYmluZS5sYWJlbCxcblx0XHRcdFx0XHRhbmdsZTogY29tYmluZWQgKiBNYXRoLlBJICogMiAvIHRvdGFsLFxuXHRcdFx0XHRcdHBlcmNlbnQ6IGNvbWJpbmVkIC8gKHRvdGFsIC8gMTAwKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG5ld2RhdGE7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZHJhdyhwbG90LCBuZXdDdHgpIHtcblxuXHRcdFx0aWYgKCF0YXJnZXQpIHtcblx0XHRcdFx0cmV0dXJuOyAvLyBpZiBubyBzZXJpZXMgd2VyZSBwYXNzZWRcblx0XHRcdH1cblxuXHRcdFx0dmFyIGNhbnZhc1dpZHRoID0gcGxvdC5nZXRQbGFjZWhvbGRlcigpLndpZHRoKCksXG5cdFx0XHRcdGNhbnZhc0hlaWdodCA9IHBsb3QuZ2V0UGxhY2Vob2xkZXIoKS5oZWlnaHQoKSxcblx0XHRcdFx0bGVnZW5kV2lkdGggPSB0YXJnZXQuY2hpbGRyZW4oKS5maWx0ZXIoXCIubGVnZW5kXCIpLmNoaWxkcmVuKCkud2lkdGgoKSB8fCAwO1xuXG5cdFx0XHRjdHggPSBuZXdDdHg7XG5cblx0XHRcdC8vIFdBUk5JTkc6IEhBQ0shIFJFV1JJVEUgVEhJUyBDT0RFIEFTIFNPT04gQVMgUE9TU0lCTEUhXG5cblx0XHRcdC8vIFdoZW4gY29tYmluaW5nIHNtYWxsZXIgc2xpY2VzIGludG8gYW4gJ290aGVyJyBzbGljZSwgd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWRkIGEgbmV3IHNlcmllcy4gIFNpbmNlIEZsb3QgZ2l2ZXMgcGx1Z2lucyBubyB3YXkgdG8gbW9kaWZ5IHRoZVxuXHRcdFx0Ly8gbGlzdCBvZiBzZXJpZXMsIHRoZSBwaWUgcGx1Z2luIHVzZXMgYSBoYWNrIHdoZXJlIHRoZSBmaXJzdCBjYWxsXG5cdFx0XHQvLyB0byBwcm9jZXNzRGF0YXBvaW50cyByZXN1bHRzIGluIGEgY2FsbCB0byBzZXREYXRhIHdpdGggdGhlIG5ld1xuXHRcdFx0Ly8gbGlzdCBvZiBzZXJpZXMsIHRoZW4gc3Vic2VxdWVudCBwcm9jZXNzRGF0YXBvaW50cyBkbyBub3RoaW5nLlxuXG5cdFx0XHQvLyBUaGUgcGx1Z2luLWdsb2JhbCAncHJvY2Vzc2VkJyBmbGFnIGlzIHVzZWQgdG8gY29udHJvbCB0aGlzIGhhY2s7XG5cdFx0XHQvLyBpdCBzdGFydHMgb3V0IGZhbHNlLCBhbmQgaXMgc2V0IHRvIHRydWUgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwgdG9cblx0XHRcdC8vIHByb2Nlc3NEYXRhcG9pbnRzLlxuXG5cdFx0XHQvLyBVbmZvcnR1bmF0ZWx5IHRoaXMgdHVybnMgZnV0dXJlIHNldERhdGEgY2FsbHMgaW50byBuby1vcHM7IHRoZXlcblx0XHRcdC8vIGNhbGwgcHJvY2Vzc0RhdGFwb2ludHMsIHRoZSBmbGFnIGlzIHRydWUsIGFuZCBub3RoaW5nIGhhcHBlbnMuXG5cblx0XHRcdC8vIFRvIGZpeCB0aGlzIHdlJ2xsIHNldCB0aGUgZmxhZyBiYWNrIHRvIGZhbHNlIGhlcmUgaW4gZHJhdywgd2hlblxuXHRcdFx0Ly8gYWxsIHNlcmllcyBoYXZlIGJlZW4gcHJvY2Vzc2VkLCBzbyB0aGUgbmV4dCBzZXF1ZW5jZSBvZiBjYWxscyB0b1xuXHRcdFx0Ly8gcHJvY2Vzc0RhdGFwb2ludHMgb25jZSBhZ2FpbiBzdGFydHMgb3V0IHdpdGggYSBzbGljZS1jb21iaW5lLlxuXHRcdFx0Ly8gVGhpcyBpcyByZWFsbHkgYSBoYWNrOyBpbiAwLjkgd2UgbmVlZCB0byBnaXZlIHBsdWdpbnMgYSBwcm9wZXJcblx0XHRcdC8vIHdheSB0byBtb2RpZnkgc2VyaWVzIGJlZm9yZSBhbnkgcHJvY2Vzc2luZyBiZWdpbnMuXG5cblx0XHRcdHByb2Nlc3NlZCA9IGZhbHNlO1xuXG5cdFx0XHQvLyBjYWxjdWxhdGUgbWF4aW11bSByYWRpdXMgYW5kIGNlbnRlciBwb2ludFxuXG5cdFx0XHRtYXhSYWRpdXMgPSAgTWF0aC5taW4oY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCAvIG9wdGlvbnMuc2VyaWVzLnBpZS50aWx0KSAvIDI7XG5cdFx0XHRjZW50ZXJUb3AgPSBjYW52YXNIZWlnaHQgLyAyICsgb3B0aW9ucy5zZXJpZXMucGllLm9mZnNldC50b3A7XG5cdFx0XHRjZW50ZXJMZWZ0ID0gY2FudmFzV2lkdGggLyAyO1xuXG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpZXMucGllLm9mZnNldC5sZWZ0ID09IFwiYXV0b1wiKSB7XG5cdFx0XHRcdGlmIChvcHRpb25zLmxlZ2VuZC5wb3NpdGlvbi5tYXRjaChcIndcIikpIHtcblx0XHRcdFx0XHRjZW50ZXJMZWZ0ICs9IGxlZ2VuZFdpZHRoIC8gMjtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjZW50ZXJMZWZ0IC09IGxlZ2VuZFdpZHRoIC8gMjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoY2VudGVyTGVmdCA8IG1heFJhZGl1cykge1xuXHRcdFx0XHRcdGNlbnRlckxlZnQgPSBtYXhSYWRpdXM7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY2VudGVyTGVmdCA+IGNhbnZhc1dpZHRoIC0gbWF4UmFkaXVzKSB7XG5cdFx0XHRcdFx0Y2VudGVyTGVmdCA9IGNhbnZhc1dpZHRoIC0gbWF4UmFkaXVzO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjZW50ZXJMZWZ0ICs9IG9wdGlvbnMuc2VyaWVzLnBpZS5vZmZzZXQubGVmdDtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHNsaWNlcyA9IHBsb3QuZ2V0RGF0YSgpLFxuXHRcdFx0XHRhdHRlbXB0cyA9IDA7XG5cblx0XHRcdC8vIEtlZXAgc2hyaW5raW5nIHRoZSBwaWUncyByYWRpdXMgdW50aWwgZHJhd1BpZSByZXR1cm5zIHRydWUsXG5cdFx0XHQvLyBpbmRpY2F0aW5nIHRoYXQgYWxsIHRoZSBsYWJlbHMgZml0LCBvciB3ZSB0cnkgdG9vIG1hbnkgdGltZXMuXG5cblx0XHRcdGRvIHtcblx0XHRcdFx0aWYgKGF0dGVtcHRzID4gMCkge1xuXHRcdFx0XHRcdG1heFJhZGl1cyAqPSBSRURSQVdfU0hSSU5LO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGF0dGVtcHRzICs9IDE7XG5cdFx0XHRcdGNsZWFyKCk7XG5cdFx0XHRcdGlmIChvcHRpb25zLnNlcmllcy5waWUudGlsdCA8PSAwLjgpIHtcblx0XHRcdFx0XHRkcmF3U2hhZG93KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKCFkcmF3UGllKCkgJiYgYXR0ZW1wdHMgPCBSRURSQVdfQVRURU1QVFMpO1xuXG5cdFx0XHRpZiAoYXR0ZW1wdHMgPj0gUkVEUkFXX0FUVEVNUFRTKSB7XG5cdFx0XHRcdGNsZWFyKCk7XG5cdFx0XHRcdHRhcmdldC5wcmVwZW5kKFwiPGRpdiBjbGFzcz0nZXJyb3InPkNvdWxkIG5vdCBkcmF3IHBpZSB3aXRoIGxhYmVscyBjb250YWluZWQgaW5zaWRlIGNhbnZhczwvZGl2PlwiKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHBsb3Quc2V0U2VyaWVzICYmIHBsb3QuaW5zZXJ0TGVnZW5kKSB7XG5cdFx0XHRcdHBsb3Quc2V0U2VyaWVzKHNsaWNlcyk7XG5cdFx0XHRcdHBsb3QuaW5zZXJ0TGVnZW5kKCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHdlJ3JlIGFjdHVhbGx5IGRvbmUgYXQgdGhpcyBwb2ludCwganVzdCBkZWZpbmluZyBpbnRlcm5hbCBmdW5jdGlvbnMgYXQgdGhpcyBwb2ludFxuXG5cdFx0XHRmdW5jdGlvbiBjbGVhcigpIHtcblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KTtcblx0XHRcdFx0dGFyZ2V0LmNoaWxkcmVuKCkuZmlsdGVyKFwiLnBpZUxhYmVsLCAucGllTGFiZWxCYWNrZ3JvdW5kXCIpLnJlbW92ZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBkcmF3U2hhZG93KCkge1xuXG5cdFx0XHRcdHZhciBzaGFkb3dMZWZ0ID0gb3B0aW9ucy5zZXJpZXMucGllLnNoYWRvdy5sZWZ0O1xuXHRcdFx0XHR2YXIgc2hhZG93VG9wID0gb3B0aW9ucy5zZXJpZXMucGllLnNoYWRvdy50b3A7XG5cdFx0XHRcdHZhciBlZGdlID0gMTA7XG5cdFx0XHRcdHZhciBhbHBoYSA9IG9wdGlvbnMuc2VyaWVzLnBpZS5zaGFkb3cuYWxwaGE7XG5cdFx0XHRcdHZhciByYWRpdXMgPSBvcHRpb25zLnNlcmllcy5waWUucmFkaXVzID4gMSA/IG9wdGlvbnMuc2VyaWVzLnBpZS5yYWRpdXMgOiBtYXhSYWRpdXMgKiBvcHRpb25zLnNlcmllcy5waWUucmFkaXVzO1xuXG5cdFx0XHRcdGlmIChyYWRpdXMgPj0gY2FudmFzV2lkdGggLyAyIC0gc2hhZG93TGVmdCB8fCByYWRpdXMgKiBvcHRpb25zLnNlcmllcy5waWUudGlsdCA+PSBjYW52YXNIZWlnaHQgLyAyIC0gc2hhZG93VG9wIHx8IHJhZGl1cyA8PSBlZGdlKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1x0Ly8gc2hhZG93IHdvdWxkIGJlIG91dHNpZGUgY2FudmFzLCBzbyBkb24ndCBkcmF3IGl0XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHguc2F2ZSgpO1xuXHRcdFx0XHRjdHgudHJhbnNsYXRlKHNoYWRvd0xlZnQsc2hhZG93VG9wKTtcblx0XHRcdFx0Y3R4Lmdsb2JhbEFscGhhID0gYWxwaGE7XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBcIiMwMDBcIjtcblxuXHRcdFx0XHQvLyBjZW50ZXIgYW5kIHJvdGF0ZSB0byBzdGFydGluZyBwb3NpdGlvblxuXG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY2VudGVyTGVmdCxjZW50ZXJUb3ApO1xuXHRcdFx0XHRjdHguc2NhbGUoMSwgb3B0aW9ucy5zZXJpZXMucGllLnRpbHQpO1xuXG5cdFx0XHRcdC8vcmFkaXVzIC09IGVkZ2U7XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IDE7IGkgPD0gZWRnZTsgaSsrKSB7XG5cdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5hcmMoMCwgMCwgcmFkaXVzLCAwLCBNYXRoLlBJICogMiwgZmFsc2UpO1xuXHRcdFx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRcdFx0cmFkaXVzIC09IGk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHgucmVzdG9yZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBkcmF3UGllKCkge1xuXG5cdFx0XHRcdHZhciBzdGFydEFuZ2xlID0gTWF0aC5QSSAqIG9wdGlvbnMuc2VyaWVzLnBpZS5zdGFydEFuZ2xlO1xuXHRcdFx0XHR2YXIgcmFkaXVzID0gb3B0aW9ucy5zZXJpZXMucGllLnJhZGl1cyA+IDEgPyBvcHRpb25zLnNlcmllcy5waWUucmFkaXVzIDogbWF4UmFkaXVzICogb3B0aW9ucy5zZXJpZXMucGllLnJhZGl1cztcblxuXHRcdFx0XHQvLyBjZW50ZXIgYW5kIHJvdGF0ZSB0byBzdGFydGluZyBwb3NpdGlvblxuXG5cdFx0XHRcdGN0eC5zYXZlKCk7XG5cdFx0XHRcdGN0eC50cmFuc2xhdGUoY2VudGVyTGVmdCxjZW50ZXJUb3ApO1xuXHRcdFx0XHRjdHguc2NhbGUoMSwgb3B0aW9ucy5zZXJpZXMucGllLnRpbHQpO1xuXHRcdFx0XHQvL2N0eC5yb3RhdGUoc3RhcnRBbmdsZSk7IC8vIHN0YXJ0IGF0IHRvcDsgLS0gVGhpcyBkb2Vzbid0IHdvcmsgcHJvcGVybHkgaW4gT3BlcmFcblxuXHRcdFx0XHQvLyBkcmF3IHNsaWNlc1xuXG5cdFx0XHRcdGN0eC5zYXZlKCk7XG5cdFx0XHRcdHZhciBjdXJyZW50QW5nbGUgPSBzdGFydEFuZ2xlO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlcy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRcdHNsaWNlc1tpXS5zdGFydEFuZ2xlID0gY3VycmVudEFuZ2xlO1xuXHRcdFx0XHRcdGRyYXdTbGljZShzbGljZXNbaV0uYW5nbGUsIHNsaWNlc1tpXS5jb2xvciwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcblxuXHRcdFx0XHQvLyBkcmF3IHNsaWNlIG91dGxpbmVzXG5cblx0XHRcdFx0aWYgKG9wdGlvbnMuc2VyaWVzLnBpZS5zdHJva2Uud2lkdGggPiAwKSB7XG5cdFx0XHRcdFx0Y3R4LnNhdmUoKTtcblx0XHRcdFx0XHRjdHgubGluZVdpZHRoID0gb3B0aW9ucy5zZXJpZXMucGllLnN0cm9rZS53aWR0aDtcblx0XHRcdFx0XHRjdXJyZW50QW5nbGUgPSBzdGFydEFuZ2xlO1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdFx0XHRkcmF3U2xpY2Uoc2xpY2VzW2ldLmFuZ2xlLCBvcHRpb25zLnNlcmllcy5waWUuc3Ryb2tlLmNvbG9yLCBmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGN0eC5yZXN0b3JlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBkcmF3IGRvbnV0IGhvbGVcblxuXHRcdFx0XHRkcmF3RG9udXRIb2xlKGN0eCk7XG5cblx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcblxuXHRcdFx0XHQvLyBEcmF3IHRoZSBsYWJlbHMsIHJldHVybmluZyB0cnVlIGlmIHRoZXkgZml0IHdpdGhpbiB0aGUgcGxvdFxuXG5cdFx0XHRcdGlmIChvcHRpb25zLnNlcmllcy5waWUubGFiZWwuc2hvdykge1xuXHRcdFx0XHRcdHJldHVybiBkcmF3TGFiZWxzKCk7XG5cdFx0XHRcdH0gZWxzZSByZXR1cm4gdHJ1ZTtcblxuXHRcdFx0XHRmdW5jdGlvbiBkcmF3U2xpY2UoYW5nbGUsIGNvbG9yLCBmaWxsKSB7XG5cblx0XHRcdFx0XHRpZiAoYW5nbGUgPD0gMCB8fCBpc05hTihhbmdsZSkpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZmlsbCkge1xuXHRcdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdFx0XHRcdGN0eC5saW5lSm9pbiA9IFwicm91bmRcIjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0aWYgKE1hdGguYWJzKGFuZ2xlIC0gTWF0aC5QSSAqIDIpID4gMC4wMDAwMDAwMDEpIHtcblx0XHRcdFx0XHRcdGN0eC5tb3ZlVG8oMCwgMCk7IC8vIENlbnRlciBvZiB0aGUgcGllXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly9jdHguYXJjKDAsIDAsIHJhZGl1cywgMCwgYW5nbGUsIGZhbHNlKTsgLy8gVGhpcyBkb2Vzbid0IHdvcmsgcHJvcGVybHkgaW4gT3BlcmFcblx0XHRcdFx0XHRjdHguYXJjKDAsIDAsIHJhZGl1cyxjdXJyZW50QW5nbGUsIGN1cnJlbnRBbmdsZSArIGFuZ2xlIC8gMiwgZmFsc2UpO1xuXHRcdFx0XHRcdGN0eC5hcmMoMCwgMCwgcmFkaXVzLGN1cnJlbnRBbmdsZSArIGFuZ2xlIC8gMiwgY3VycmVudEFuZ2xlICsgYW5nbGUsIGZhbHNlKTtcblx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdFx0Ly9jdHgucm90YXRlKGFuZ2xlKTsgLy8gVGhpcyBkb2Vzbid0IHdvcmsgcHJvcGVybHkgaW4gT3BlcmFcblx0XHRcdFx0XHRjdXJyZW50QW5nbGUgKz0gYW5nbGU7XG5cblx0XHRcdFx0XHRpZiAoZmlsbCkge1xuXHRcdFx0XHRcdFx0Y3R4LmZpbGwoKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZ1bmN0aW9uIGRyYXdMYWJlbHMoKSB7XG5cblx0XHRcdFx0XHR2YXIgY3VycmVudEFuZ2xlID0gc3RhcnRBbmdsZTtcblx0XHRcdFx0XHR2YXIgcmFkaXVzID0gb3B0aW9ucy5zZXJpZXMucGllLmxhYmVsLnJhZGl1cyA+IDEgPyBvcHRpb25zLnNlcmllcy5waWUubGFiZWwucmFkaXVzIDogbWF4UmFkaXVzICogb3B0aW9ucy5zZXJpZXMucGllLmxhYmVsLnJhZGl1cztcblxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2xpY2VzW2ldLnBlcmNlbnQgPj0gb3B0aW9ucy5zZXJpZXMucGllLmxhYmVsLnRocmVzaG9sZCAqIDEwMCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIWRyYXdMYWJlbChzbGljZXNbaV0sIGN1cnJlbnRBbmdsZSwgaSkpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGN1cnJlbnRBbmdsZSArPSBzbGljZXNbaV0uYW5nbGU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdFx0XHRmdW5jdGlvbiBkcmF3TGFiZWwoc2xpY2UsIHN0YXJ0QW5nbGUsIGluZGV4KSB7XG5cblx0XHRcdFx0XHRcdGlmIChzbGljZS5kYXRhWzBdWzFdID09IDApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIGZvcm1hdCBsYWJlbCB0ZXh0XG5cblx0XHRcdFx0XHRcdHZhciBsZiA9IG9wdGlvbnMubGVnZW5kLmxhYmVsRm9ybWF0dGVyLCB0ZXh0LCBwbGYgPSBvcHRpb25zLnNlcmllcy5waWUubGFiZWwuZm9ybWF0dGVyO1xuXG5cdFx0XHRcdFx0XHRpZiAobGYpIHtcblx0XHRcdFx0XHRcdFx0dGV4dCA9IGxmKHNsaWNlLmxhYmVsLCBzbGljZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0ZXh0ID0gc2xpY2UubGFiZWw7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChwbGYpIHtcblx0XHRcdFx0XHRcdFx0dGV4dCA9IHBsZih0ZXh0LCBzbGljZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHZhciBoYWxmQW5nbGUgPSAoKHN0YXJ0QW5nbGUgKyBzbGljZS5hbmdsZSkgKyBzdGFydEFuZ2xlKSAvIDI7XG5cdFx0XHRcdFx0XHR2YXIgeCA9IGNlbnRlckxlZnQgKyBNYXRoLnJvdW5kKE1hdGguY29zKGhhbGZBbmdsZSkgKiByYWRpdXMpO1xuXHRcdFx0XHRcdFx0dmFyIHkgPSBjZW50ZXJUb3AgKyBNYXRoLnJvdW5kKE1hdGguc2luKGhhbGZBbmdsZSkgKiByYWRpdXMpICogb3B0aW9ucy5zZXJpZXMucGllLnRpbHQ7XG5cblx0XHRcdFx0XHRcdHZhciBodG1sID0gXCI8c3BhbiBjbGFzcz0ncGllTGFiZWwnIGlkPSdwaWVMYWJlbFwiICsgaW5kZXggKyBcIicgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3RvcDpcIiArIHkgKyBcInB4O2xlZnQ6XCIgKyB4ICsgXCJweDsnPlwiICsgdGV4dCArIFwiPC9zcGFuPlwiO1xuXHRcdFx0XHRcdFx0dGFyZ2V0LmFwcGVuZChodG1sKTtcblxuXHRcdFx0XHRcdFx0dmFyIGxhYmVsID0gdGFyZ2V0LmNoaWxkcmVuKFwiI3BpZUxhYmVsXCIgKyBpbmRleCk7XG5cdFx0XHRcdFx0XHR2YXIgbGFiZWxUb3AgPSAoeSAtIGxhYmVsLmhlaWdodCgpIC8gMik7XG5cdFx0XHRcdFx0XHR2YXIgbGFiZWxMZWZ0ID0gKHggLSBsYWJlbC53aWR0aCgpIC8gMik7XG5cblx0XHRcdFx0XHRcdGxhYmVsLmNzcyhcInRvcFwiLCBsYWJlbFRvcCk7XG5cdFx0XHRcdFx0XHRsYWJlbC5jc3MoXCJsZWZ0XCIsIGxhYmVsTGVmdCk7XG5cblx0XHRcdFx0XHRcdC8vIGNoZWNrIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBsYWJlbCBpcyBub3Qgb3V0c2lkZSB0aGUgY2FudmFzXG5cblx0XHRcdFx0XHRcdGlmICgwIC0gbGFiZWxUb3AgPiAwIHx8IDAgLSBsYWJlbExlZnQgPiAwIHx8IGNhbnZhc0hlaWdodCAtIChsYWJlbFRvcCArIGxhYmVsLmhlaWdodCgpKSA8IDAgfHwgY2FudmFzV2lkdGggLSAobGFiZWxMZWZ0ICsgbGFiZWwud2lkdGgoKSkgPCAwKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKG9wdGlvbnMuc2VyaWVzLnBpZS5sYWJlbC5iYWNrZ3JvdW5kLm9wYWNpdHkgIT0gMCkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIHB1dCBpbiB0aGUgdHJhbnNwYXJlbnQgYmFja2dyb3VuZCBzZXBhcmF0ZWx5IHRvIGF2b2lkIGJsZW5kZWQgbGFiZWxzIGFuZCBsYWJlbCBib3hlc1xuXG5cdFx0XHRcdFx0XHRcdHZhciBjID0gb3B0aW9ucy5zZXJpZXMucGllLmxhYmVsLmJhY2tncm91bmQuY29sb3I7XG5cblx0XHRcdFx0XHRcdFx0aWYgKGMgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdGMgPSBzbGljZS5jb2xvcjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHZhciBwb3MgPSBcInRvcDpcIiArIGxhYmVsVG9wICsgXCJweDtsZWZ0OlwiICsgbGFiZWxMZWZ0ICsgXCJweDtcIjtcblx0XHRcdFx0XHRcdFx0JChcIjxkaXYgY2xhc3M9J3BpZUxhYmVsQmFja2dyb3VuZCcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOlwiICsgbGFiZWwud2lkdGgoKSArIFwicHg7aGVpZ2h0OlwiICsgbGFiZWwuaGVpZ2h0KCkgKyBcInB4O1wiICsgcG9zICsgXCJiYWNrZ3JvdW5kLWNvbG9yOlwiICsgYyArIFwiOyc+PC9kaXY+XCIpXG5cdFx0XHRcdFx0XHRcdFx0LmNzcyhcIm9wYWNpdHlcIiwgb3B0aW9ucy5zZXJpZXMucGllLmxhYmVsLmJhY2tncm91bmQub3BhY2l0eSlcblx0XHRcdFx0XHRcdFx0XHQuaW5zZXJ0QmVmb3JlKGxhYmVsKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fSAvLyBlbmQgaW5kaXZpZHVhbCBsYWJlbCBmdW5jdGlvblxuXHRcdFx0XHR9IC8vIGVuZCBkcmF3TGFiZWxzIGZ1bmN0aW9uXG5cdFx0XHR9IC8vIGVuZCBkcmF3UGllIGZ1bmN0aW9uXG5cdFx0fSAvLyBlbmQgZHJhdyBmdW5jdGlvblxuXG5cdFx0Ly8gUGxhY2VkIGhlcmUgYmVjYXVzZSBpdCBuZWVkcyB0byBiZSBhY2Nlc3NlZCBmcm9tIG11bHRpcGxlIGxvY2F0aW9uc1xuXG5cdFx0ZnVuY3Rpb24gZHJhd0RvbnV0SG9sZShsYXllcikge1xuXHRcdFx0aWYgKG9wdGlvbnMuc2VyaWVzLnBpZS5pbm5lclJhZGl1cyA+IDApIHtcblxuXHRcdFx0XHQvLyBzdWJ0cmFjdCB0aGUgY2VudGVyXG5cblx0XHRcdFx0bGF5ZXIuc2F2ZSgpO1xuXHRcdFx0XHR2YXIgaW5uZXJSYWRpdXMgPSBvcHRpb25zLnNlcmllcy5waWUuaW5uZXJSYWRpdXMgPiAxID8gb3B0aW9ucy5zZXJpZXMucGllLmlubmVyUmFkaXVzIDogbWF4UmFkaXVzICogb3B0aW9ucy5zZXJpZXMucGllLmlubmVyUmFkaXVzO1xuXHRcdFx0XHRsYXllci5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW91dFwiOyAvLyB0aGlzIGRvZXMgbm90IHdvcmsgd2l0aCBleGNhbnZhcywgYnV0IGl0IHdpbGwgZmFsbCBiYWNrIHRvIHVzaW5nIHRoZSBzdHJva2UgY29sb3Jcblx0XHRcdFx0bGF5ZXIuYmVnaW5QYXRoKCk7XG5cdFx0XHRcdGxheWVyLmZpbGxTdHlsZSA9IG9wdGlvbnMuc2VyaWVzLnBpZS5zdHJva2UuY29sb3I7XG5cdFx0XHRcdGxheWVyLmFyYygwLCAwLCBpbm5lclJhZGl1cywgMCwgTWF0aC5QSSAqIDIsIGZhbHNlKTtcblx0XHRcdFx0bGF5ZXIuZmlsbCgpO1xuXHRcdFx0XHRsYXllci5jbG9zZVBhdGgoKTtcblx0XHRcdFx0bGF5ZXIucmVzdG9yZSgpO1xuXG5cdFx0XHRcdC8vIGFkZCBpbm5lciBzdHJva2VcblxuXHRcdFx0XHRsYXllci5zYXZlKCk7XG5cdFx0XHRcdGxheWVyLmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRsYXllci5zdHJva2VTdHlsZSA9IG9wdGlvbnMuc2VyaWVzLnBpZS5zdHJva2UuY29sb3I7XG5cdFx0XHRcdGxheWVyLmFyYygwLCAwLCBpbm5lclJhZGl1cywgMCwgTWF0aC5QSSAqIDIsIGZhbHNlKTtcblx0XHRcdFx0bGF5ZXIuc3Ryb2tlKCk7XG5cdFx0XHRcdGxheWVyLmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRsYXllci5yZXN0b3JlKCk7XG5cblx0XHRcdFx0Ly8gVE9ETzogYWRkIGV4dHJhIHNoYWRvdyBpbnNpZGUgaG9sZSAod2l0aCBhIG1hc2spIGlmIHRoZSBwaWUgaXMgdGlsdGVkLlxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vLS0gQWRkaXRpb25hbCBJbnRlcmFjdGl2ZSByZWxhdGVkIGZ1bmN0aW9ucyAtLVxuXG5cdFx0ZnVuY3Rpb24gaXNQb2ludEluUG9seShwb2x5LCBwdCkge1xuXHRcdFx0Zm9yKHZhciBjID0gZmFsc2UsIGkgPSAtMSwgbCA9IHBvbHkubGVuZ3RoLCBqID0gbCAtIDE7ICsraSA8IGw7IGogPSBpKVxuXHRcdFx0XHQoKHBvbHlbaV1bMV0gPD0gcHRbMV0gJiYgcHRbMV0gPCBwb2x5W2pdWzFdKSB8fCAocG9seVtqXVsxXSA8PSBwdFsxXSAmJiBwdFsxXTwgcG9seVtpXVsxXSkpXG5cdFx0XHRcdCYmIChwdFswXSA8IChwb2x5W2pdWzBdIC0gcG9seVtpXVswXSkgKiAocHRbMV0gLSBwb2x5W2ldWzFdKSAvIChwb2x5W2pdWzFdIC0gcG9seVtpXVsxXSkgKyBwb2x5W2ldWzBdKVxuXHRcdFx0XHQmJiAoYyA9ICFjKTtcblx0XHRcdHJldHVybiBjO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGZpbmROZWFyYnlTbGljZShtb3VzZVgsIG1vdXNlWSkge1xuXG5cdFx0XHR2YXIgc2xpY2VzID0gcGxvdC5nZXREYXRhKCksXG5cdFx0XHRcdG9wdGlvbnMgPSBwbG90LmdldE9wdGlvbnMoKSxcblx0XHRcdFx0cmFkaXVzID0gb3B0aW9ucy5zZXJpZXMucGllLnJhZGl1cyA+IDEgPyBvcHRpb25zLnNlcmllcy5waWUucmFkaXVzIDogbWF4UmFkaXVzICogb3B0aW9ucy5zZXJpZXMucGllLnJhZGl1cyxcblx0XHRcdFx0eCwgeTtcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZXMubGVuZ3RoOyArK2kpIHtcblxuXHRcdFx0XHR2YXIgcyA9IHNsaWNlc1tpXTtcblxuXHRcdFx0XHRpZiAocy5waWUuc2hvdykge1xuXG5cdFx0XHRcdFx0Y3R4LnNhdmUoKTtcblx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbygwLCAwKTsgLy8gQ2VudGVyIG9mIHRoZSBwaWVcblx0XHRcdFx0XHQvL2N0eC5zY2FsZSgxLCBvcHRpb25zLnNlcmllcy5waWUudGlsdCk7XHQvLyB0aGlzIGFjdHVhbGx5IHNlZW1zIHRvIGJyZWFrIGV2ZXJ5dGhpbmcgd2hlbiBoZXJlLlxuXHRcdFx0XHRcdGN0eC5hcmMoMCwgMCwgcmFkaXVzLCBzLnN0YXJ0QW5nbGUsIHMuc3RhcnRBbmdsZSArIHMuYW5nbGUgLyAyLCBmYWxzZSk7XG5cdFx0XHRcdFx0Y3R4LmFyYygwLCAwLCByYWRpdXMsIHMuc3RhcnRBbmdsZSArIHMuYW5nbGUgLyAyLCBzLnN0YXJ0QW5nbGUgKyBzLmFuZ2xlLCBmYWxzZSk7XG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdHggPSBtb3VzZVggLSBjZW50ZXJMZWZ0O1xuXHRcdFx0XHRcdHkgPSBtb3VzZVkgLSBjZW50ZXJUb3A7XG5cblx0XHRcdFx0XHRpZiAoY3R4LmlzUG9pbnRJblBhdGgpIHtcblx0XHRcdFx0XHRcdGlmIChjdHguaXNQb2ludEluUGF0aChtb3VzZVggLSBjZW50ZXJMZWZ0LCBtb3VzZVkgLSBjZW50ZXJUb3ApKSB7XG5cdFx0XHRcdFx0XHRcdGN0eC5yZXN0b3JlKCk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0ZGF0YXBvaW50OiBbcy5wZXJjZW50LCBzLmRhdGFdLFxuXHRcdFx0XHRcdFx0XHRcdGRhdGFJbmRleDogMCxcblx0XHRcdFx0XHRcdFx0XHRzZXJpZXM6IHMsXG5cdFx0XHRcdFx0XHRcdFx0c2VyaWVzSW5kZXg6IGlcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFx0XHQvLyBleGNhbnZhcyBmb3IgSUUgZG9lc247dCBzdXBwb3J0IGlzUG9pbnRJblBhdGgsIHRoaXMgaXMgYSB3b3JrYXJvdW5kLlxuXG5cdFx0XHRcdFx0XHR2YXIgcDFYID0gcmFkaXVzICogTWF0aC5jb3Mocy5zdGFydEFuZ2xlKSxcblx0XHRcdFx0XHRcdFx0cDFZID0gcmFkaXVzICogTWF0aC5zaW4ocy5zdGFydEFuZ2xlKSxcblx0XHRcdFx0XHRcdFx0cDJYID0gcmFkaXVzICogTWF0aC5jb3Mocy5zdGFydEFuZ2xlICsgcy5hbmdsZSAvIDQpLFxuXHRcdFx0XHRcdFx0XHRwMlkgPSByYWRpdXMgKiBNYXRoLnNpbihzLnN0YXJ0QW5nbGUgKyBzLmFuZ2xlIC8gNCksXG5cdFx0XHRcdFx0XHRcdHAzWCA9IHJhZGl1cyAqIE1hdGguY29zKHMuc3RhcnRBbmdsZSArIHMuYW5nbGUgLyAyKSxcblx0XHRcdFx0XHRcdFx0cDNZID0gcmFkaXVzICogTWF0aC5zaW4ocy5zdGFydEFuZ2xlICsgcy5hbmdsZSAvIDIpLFxuXHRcdFx0XHRcdFx0XHRwNFggPSByYWRpdXMgKiBNYXRoLmNvcyhzLnN0YXJ0QW5nbGUgKyBzLmFuZ2xlIC8gMS41KSxcblx0XHRcdFx0XHRcdFx0cDRZID0gcmFkaXVzICogTWF0aC5zaW4ocy5zdGFydEFuZ2xlICsgcy5hbmdsZSAvIDEuNSksXG5cdFx0XHRcdFx0XHRcdHA1WCA9IHJhZGl1cyAqIE1hdGguY29zKHMuc3RhcnRBbmdsZSArIHMuYW5nbGUpLFxuXHRcdFx0XHRcdFx0XHRwNVkgPSByYWRpdXMgKiBNYXRoLnNpbihzLnN0YXJ0QW5nbGUgKyBzLmFuZ2xlKSxcblx0XHRcdFx0XHRcdFx0YXJyUG9seSA9IFtbMCwgMF0sIFtwMVgsIHAxWV0sIFtwMlgsIHAyWV0sIFtwM1gsIHAzWV0sIFtwNFgsIHA0WV0sIFtwNVgsIHA1WV1dLFxuXHRcdFx0XHRcdFx0XHRhcnJQb2ludCA9IFt4LCB5XTtcblxuXHRcdFx0XHRcdFx0Ly8gVE9ETzogcGVyaGFwcyBkbyBzb21lIG1hdGhtYXRpY2FsIHRyaWNrZXJ5IGhlcmUgd2l0aCB0aGUgWS1jb29yZGluYXRlIHRvIGNvbXBlbnNhdGUgZm9yIHBpZSB0aWx0P1xuXG5cdFx0XHRcdFx0XHRpZiAoaXNQb2ludEluUG9seShhcnJQb2x5LCBhcnJQb2ludCkpIHtcblx0XHRcdFx0XHRcdFx0Y3R4LnJlc3RvcmUoKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRkYXRhcG9pbnQ6IFtzLnBlcmNlbnQsIHMuZGF0YV0sXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YUluZGV4OiAwLFxuXHRcdFx0XHRcdFx0XHRcdHNlcmllczogcyxcblx0XHRcdFx0XHRcdFx0XHRzZXJpZXNJbmRleDogaVxuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGN0eC5yZXN0b3JlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gb25Nb3VzZU1vdmUoZSkge1xuXHRcdFx0dHJpZ2dlckNsaWNrSG92ZXJFdmVudChcInBsb3Rob3ZlclwiLCBlKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvbkNsaWNrKGUpIHtcblx0XHRcdHRyaWdnZXJDbGlja0hvdmVyRXZlbnQoXCJwbG90Y2xpY2tcIiwgZSk7XG5cdFx0fVxuXG5cdFx0Ly8gdHJpZ2dlciBjbGljayBvciBob3ZlciBldmVudCAodGhleSBzZW5kIHRoZSBzYW1lIHBhcmFtZXRlcnMgc28gd2Ugc2hhcmUgdGhlaXIgY29kZSlcblxuXHRcdGZ1bmN0aW9uIHRyaWdnZXJDbGlja0hvdmVyRXZlbnQoZXZlbnRuYW1lLCBlKSB7XG5cblx0XHRcdHZhciBvZmZzZXQgPSBwbG90Lm9mZnNldCgpO1xuXHRcdFx0dmFyIGNhbnZhc1ggPSBwYXJzZUludChlLnBhZ2VYIC0gb2Zmc2V0LmxlZnQpO1xuXHRcdFx0dmFyIGNhbnZhc1kgPSAgcGFyc2VJbnQoZS5wYWdlWSAtIG9mZnNldC50b3ApO1xuXHRcdFx0dmFyIGl0ZW0gPSBmaW5kTmVhcmJ5U2xpY2UoY2FudmFzWCwgY2FudmFzWSk7XG5cblx0XHRcdGlmIChvcHRpb25zLmdyaWQuYXV0b0hpZ2hsaWdodCkge1xuXG5cdFx0XHRcdC8vIGNsZWFyIGF1dG8taGlnaGxpZ2h0c1xuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0cy5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRcdHZhciBoID0gaGlnaGxpZ2h0c1tpXTtcblx0XHRcdFx0XHRpZiAoaC5hdXRvID09IGV2ZW50bmFtZSAmJiAhKGl0ZW0gJiYgaC5zZXJpZXMgPT0gaXRlbS5zZXJpZXMpKSB7XG5cdFx0XHRcdFx0XHR1bmhpZ2hsaWdodChoLnNlcmllcyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIGhpZ2hsaWdodCB0aGUgc2xpY2VcblxuXHRcdFx0aWYgKGl0ZW0pIHtcblx0XHRcdFx0aGlnaGxpZ2h0KGl0ZW0uc2VyaWVzLCBldmVudG5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyB0cmlnZ2VyIGFueSBob3ZlciBiaW5kIGV2ZW50c1xuXG5cdFx0XHR2YXIgcG9zID0geyBwYWdlWDogZS5wYWdlWCwgcGFnZVk6IGUucGFnZVkgfTtcblx0XHRcdHRhcmdldC50cmlnZ2VyKGV2ZW50bmFtZSwgW3BvcywgaXRlbV0pO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGhpZ2hsaWdodChzLCBhdXRvKSB7XG5cdFx0XHQvL2lmICh0eXBlb2YgcyA9PSBcIm51bWJlclwiKSB7XG5cdFx0XHQvL1x0cyA9IHNlcmllc1tzXTtcblx0XHRcdC8vfVxuXG5cdFx0XHR2YXIgaSA9IGluZGV4T2ZIaWdobGlnaHQocyk7XG5cblx0XHRcdGlmIChpID09IC0xKSB7XG5cdFx0XHRcdGhpZ2hsaWdodHMucHVzaCh7IHNlcmllczogcywgYXV0bzogYXV0byB9KTtcblx0XHRcdFx0cGxvdC50cmlnZ2VyUmVkcmF3T3ZlcmxheSgpO1xuXHRcdFx0fSBlbHNlIGlmICghYXV0bykge1xuXHRcdFx0XHRoaWdobGlnaHRzW2ldLmF1dG8gPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiB1bmhpZ2hsaWdodChzKSB7XG5cdFx0XHRpZiAocyA9PSBudWxsKSB7XG5cdFx0XHRcdGhpZ2hsaWdodHMgPSBbXTtcblx0XHRcdFx0cGxvdC50cmlnZ2VyUmVkcmF3T3ZlcmxheSgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvL2lmICh0eXBlb2YgcyA9PSBcIm51bWJlclwiKSB7XG5cdFx0XHQvL1x0cyA9IHNlcmllc1tzXTtcblx0XHRcdC8vfVxuXG5cdFx0XHR2YXIgaSA9IGluZGV4T2ZIaWdobGlnaHQocyk7XG5cblx0XHRcdGlmIChpICE9IC0xKSB7XG5cdFx0XHRcdGhpZ2hsaWdodHMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRwbG90LnRyaWdnZXJSZWRyYXdPdmVybGF5KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaW5kZXhPZkhpZ2hsaWdodChzKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodHMubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0dmFyIGggPSBoaWdobGlnaHRzW2ldO1xuXHRcdFx0XHRpZiAoaC5zZXJpZXMgPT0gcylcblx0XHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBkcmF3T3ZlcmxheShwbG90LCBvY3R4KSB7XG5cblx0XHRcdHZhciBvcHRpb25zID0gcGxvdC5nZXRPcHRpb25zKCk7XG5cblx0XHRcdHZhciByYWRpdXMgPSBvcHRpb25zLnNlcmllcy5waWUucmFkaXVzID4gMSA/IG9wdGlvbnMuc2VyaWVzLnBpZS5yYWRpdXMgOiBtYXhSYWRpdXMgKiBvcHRpb25zLnNlcmllcy5waWUucmFkaXVzO1xuXG5cdFx0XHRvY3R4LnNhdmUoKTtcblx0XHRcdG9jdHgudHJhbnNsYXRlKGNlbnRlckxlZnQsIGNlbnRlclRvcCk7XG5cdFx0XHRvY3R4LnNjYWxlKDEsIG9wdGlvbnMuc2VyaWVzLnBpZS50aWx0KTtcblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdGRyYXdIaWdobGlnaHQoaGlnaGxpZ2h0c1tpXS5zZXJpZXMpO1xuXHRcdFx0fVxuXG5cdFx0XHRkcmF3RG9udXRIb2xlKG9jdHgpO1xuXG5cdFx0XHRvY3R4LnJlc3RvcmUoKTtcblxuXHRcdFx0ZnVuY3Rpb24gZHJhd0hpZ2hsaWdodChzZXJpZXMpIHtcblxuXHRcdFx0XHRpZiAoc2VyaWVzLmFuZ2xlIDw9IDAgfHwgaXNOYU4oc2VyaWVzLmFuZ2xlKSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vb2N0eC5maWxsU3R5bGUgPSBwYXJzZUNvbG9yKG9wdGlvbnMuc2VyaWVzLnBpZS5oaWdobGlnaHQuY29sb3IpLnNjYWxlKG51bGwsIG51bGwsIG51bGwsIG9wdGlvbnMuc2VyaWVzLnBpZS5oaWdobGlnaHQub3BhY2l0eSkudG9TdHJpbmcoKTtcblx0XHRcdFx0b2N0eC5maWxsU3R5bGUgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgXCIgKyBvcHRpb25zLnNlcmllcy5waWUuaGlnaGxpZ2h0Lm9wYWNpdHkgKyBcIilcIjsgLy8gdGhpcyBpcyB0ZW1wb3JhcnkgdW50aWwgd2UgaGF2ZSBhY2Nlc3MgdG8gcGFyc2VDb2xvclxuXHRcdFx0XHRvY3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRpZiAoTWF0aC5hYnMoc2VyaWVzLmFuZ2xlIC0gTWF0aC5QSSAqIDIpID4gMC4wMDAwMDAwMDEpIHtcblx0XHRcdFx0XHRvY3R4Lm1vdmVUbygwLCAwKTsgLy8gQ2VudGVyIG9mIHRoZSBwaWVcblx0XHRcdFx0fVxuXHRcdFx0XHRvY3R4LmFyYygwLCAwLCByYWRpdXMsIHNlcmllcy5zdGFydEFuZ2xlLCBzZXJpZXMuc3RhcnRBbmdsZSArIHNlcmllcy5hbmdsZSAvIDIsIGZhbHNlKTtcblx0XHRcdFx0b2N0eC5hcmMoMCwgMCwgcmFkaXVzLCBzZXJpZXMuc3RhcnRBbmdsZSArIHNlcmllcy5hbmdsZSAvIDIsIHNlcmllcy5zdGFydEFuZ2xlICsgc2VyaWVzLmFuZ2xlLCBmYWxzZSk7XG5cdFx0XHRcdG9jdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdG9jdHguZmlsbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSAvLyBlbmQgaW5pdCAocGx1Z2luIGJvZHkpXG5cblx0Ly8gZGVmaW5lIHBpZSBzcGVjaWZpYyBvcHRpb25zIGFuZCB0aGVpciBkZWZhdWx0IHZhbHVlc1xuXG5cdHZhciBvcHRpb25zID0ge1xuXHRcdHNlcmllczoge1xuXHRcdFx0cGllOiB7XG5cdFx0XHRcdHNob3c6IGZhbHNlLFxuXHRcdFx0XHRyYWRpdXM6IFwiYXV0b1wiLFx0Ly8gYWN0dWFsIHJhZGl1cyBvZiB0aGUgdmlzaWJsZSBwaWUgKGJhc2VkIG9uIGZ1bGwgY2FsY3VsYXRlZCByYWRpdXMgaWYgPD0xLCBvciBoYXJkIHBpeGVsIHZhbHVlKVxuXHRcdFx0XHRpbm5lclJhZGl1czogMCwgLyogZm9yIGRvbnV0ICovXG5cdFx0XHRcdHN0YXJ0QW5nbGU6IDMvMixcblx0XHRcdFx0dGlsdDogMSxcblx0XHRcdFx0c2hhZG93OiB7XG5cdFx0XHRcdFx0bGVmdDogNSxcdC8vIHNoYWRvdyBsZWZ0IG9mZnNldFxuXHRcdFx0XHRcdHRvcDogMTUsXHQvLyBzaGFkb3cgdG9wIG9mZnNldFxuXHRcdFx0XHRcdGFscGhhOiAwLjAyXHQvLyBzaGFkb3cgYWxwaGFcblx0XHRcdFx0fSxcblx0XHRcdFx0b2Zmc2V0OiB7XG5cdFx0XHRcdFx0dG9wOiAwLFxuXHRcdFx0XHRcdGxlZnQ6IFwiYXV0b1wiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHN0cm9rZToge1xuXHRcdFx0XHRcdGNvbG9yOiBcIiNmZmZcIixcblx0XHRcdFx0XHR3aWR0aDogMVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsYWJlbDoge1xuXHRcdFx0XHRcdHNob3c6IFwiYXV0b1wiLFxuXHRcdFx0XHRcdGZvcm1hdHRlcjogZnVuY3Rpb24obGFiZWwsIHNsaWNlKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCI8ZGl2IHN0eWxlPSdmb250LXNpemU6eC1zbWFsbDt0ZXh0LWFsaWduOmNlbnRlcjtwYWRkaW5nOjJweDtjb2xvcjpcIiArIHNsaWNlLmNvbG9yICsgXCI7Jz5cIiArIGxhYmVsICsgXCI8YnIvPlwiICsgTWF0aC5yb3VuZChzbGljZS5wZXJjZW50KSArIFwiJTwvZGl2PlwiO1xuXHRcdFx0XHRcdH0sXHQvLyBmb3JtYXR0ZXIgZnVuY3Rpb25cblx0XHRcdFx0XHRyYWRpdXM6IDEsXHQvLyByYWRpdXMgYXQgd2hpY2ggdG8gcGxhY2UgdGhlIGxhYmVscyAoYmFzZWQgb24gZnVsbCBjYWxjdWxhdGVkIHJhZGl1cyBpZiA8PTEsIG9yIGhhcmQgcGl4ZWwgdmFsdWUpXG5cdFx0XHRcdFx0YmFja2dyb3VuZDoge1xuXHRcdFx0XHRcdFx0Y29sb3I6IG51bGwsXG5cdFx0XHRcdFx0XHRvcGFjaXR5OiAwXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aHJlc2hvbGQ6IDBcdC8vIHBlcmNlbnRhZ2UgYXQgd2hpY2ggdG8gaGlkZSB0aGUgbGFiZWwgKGkuZS4gdGhlIHNsaWNlIGlzIHRvbyBuYXJyb3cpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNvbWJpbmU6IHtcblx0XHRcdFx0XHR0aHJlc2hvbGQ6IC0xLFx0Ly8gcGVyY2VudGFnZSBhdCB3aGljaCB0byBjb21iaW5lIGxpdHRsZSBzbGljZXMgaW50byBvbmUgbGFyZ2VyIHNsaWNlXG5cdFx0XHRcdFx0Y29sb3I6IG51bGwsXHQvLyBjb2xvciB0byBnaXZlIHRoZSBuZXcgc2xpY2UgKGF1dG8tZ2VuZXJhdGVkIGlmIG51bGwpXG5cdFx0XHRcdFx0bGFiZWw6IFwiT3RoZXJcIlx0Ly8gbGFiZWwgdG8gZ2l2ZSB0aGUgbmV3IHNsaWNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhpZ2hsaWdodDoge1xuXHRcdFx0XHRcdC8vY29sb3I6IFwiI2ZmZlwiLFx0XHQvLyB3aWxsIGFkZCB0aGlzIGZ1bmN0aW9uYWxpdHkgb25jZSBwYXJzZUNvbG9yIGlzIGF2YWlsYWJsZVxuXHRcdFx0XHRcdG9wYWNpdHk6IDAuNVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdCQucGxvdC5wbHVnaW5zLnB1c2goe1xuXHRcdGluaXQ6IGluaXQsXG5cdFx0b3B0aW9uczogb3B0aW9ucyxcblx0XHRuYW1lOiBcInBpZVwiLFxuXHRcdHZlcnNpb246IFwiMS4xXCJcblx0fSk7XG5cbn0pKGpRdWVyeSk7XG4iXX0=
