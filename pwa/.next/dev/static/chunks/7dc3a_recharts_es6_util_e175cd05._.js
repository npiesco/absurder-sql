(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "findEntryInArray",
    ()=>findEntryInArray,
    "getLinearRegression",
    ()=>getLinearRegression,
    "getPercentValue",
    ()=>getPercentValue,
    "hasDuplicate",
    ()=>hasDuplicate,
    "interpolate",
    ()=>interpolate,
    "isNan",
    ()=>isNan,
    "isNotNil",
    ()=>isNotNil,
    "isNullish",
    ()=>isNullish,
    "isNumOrStr",
    ()=>isNumOrStr,
    "isNumber",
    ()=>isNumber,
    "isPercent",
    ()=>isPercent,
    "mathSign",
    ()=>mathSign,
    "noop",
    ()=>noop,
    "uniqueId",
    ()=>uniqueId,
    "upperFirst",
    ()=>upperFirst
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/get.js [app-client] (ecmascript)");
;
var mathSign = (value)=>{
    if (value === 0) {
        return 0;
    }
    if (value > 0) {
        return 1;
    }
    return -1;
};
var isNan = (value)=>{
    // eslint-disable-next-line eqeqeq
    return typeof value == 'number' && value != +value;
};
var isPercent = (value)=>typeof value === 'string' && value.indexOf('%') === value.length - 1;
var isNumber = (value)=>(typeof value === 'number' || value instanceof Number) && !isNan(value);
var isNumOrStr = (value)=>isNumber(value) || typeof value === 'string';
var idCounter = 0;
var uniqueId = (prefix)=>{
    var id = ++idCounter;
    return "".concat(prefix || '').concat(id);
};
var getPercentValue = function getPercentValue(percent, totalValue) {
    var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var validate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (!isNumber(percent) && typeof percent !== 'string') {
        return defaultValue;
    }
    var value;
    if (isPercent(percent)) {
        if (totalValue == null) {
            return defaultValue;
        }
        var index = percent.indexOf('%');
        value = totalValue * parseFloat(percent.slice(0, index)) / 100;
    } else {
        value = +percent;
    }
    if (isNan(value)) {
        value = defaultValue;
    }
    if (validate && totalValue != null && value > totalValue) {
        value = totalValue;
    }
    return value;
};
var hasDuplicate = (ary)=>{
    if (!Array.isArray(ary)) {
        return false;
    }
    var len = ary.length;
    var cache = {};
    for(var i = 0; i < len; i++){
        if (!cache[ary[i]]) {
            cache[ary[i]] = true;
        } else {
            return true;
        }
    }
    return false;
};
function interpolate(start, end, t) {
    if (isNumber(start) && isNumber(end)) {
        return start + t * (end - start);
    }
    return end;
}
function findEntryInArray(ary, specifiedKey, specifiedValue) {
    if (!ary || !ary.length) {
        return undefined;
    }
    return ary.find((entry)=>entry && (typeof specifiedKey === 'function' ? specifiedKey(entry) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(entry, specifiedKey)) === specifiedValue);
}
var getLinearRegression = (data)=>{
    var len = data.length;
    var xsum = 0;
    var ysum = 0;
    var xysum = 0;
    var xxsum = 0;
    var xmin = Infinity;
    var xmax = -Infinity;
    var xcurrent = 0;
    var ycurrent = 0;
    for(var i = 0; i < len; i++){
        xcurrent = data[i].cx || 0;
        ycurrent = data[i].cy || 0;
        xsum += xcurrent;
        ysum += ycurrent;
        xysum += xcurrent * ycurrent;
        xxsum += xcurrent * xcurrent;
        xmin = Math.min(xmin, xcurrent);
        xmax = Math.max(xmax, xcurrent);
    }
    var a = len * xxsum !== xsum * xsum ? (len * xysum - xsum * ysum) / (len * xxsum - xsum * xsum) : 0;
    return {
        xmin,
        xmax,
        a,
        b: (ysum - a * xsum) / len
    };
};
var isNullish = (value)=>{
    return value === null || typeof value === 'undefined';
};
var upperFirst = (value)=>{
    if (isNullish(value)) {
        return value;
    }
    return "".concat(value.charAt(0).toUpperCase()).concat(value.slice(1));
};
function isNotNil(value) {
    return value != null;
}
function noop() {}
}),
"[project]/pwa/node_modules/recharts/es6/util/getSliced.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSliced",
    ()=>getSliced
]);
function getSliced(arr, startIndex, endIndex) {
    if (!Array.isArray(arr)) {
        return arr;
    }
    if (arr && startIndex + endIndex !== 0) {
        return arr.slice(startIndex, endIndex + 1);
    }
    return arr;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX_VALUE_REG",
    ()=>MAX_VALUE_REG,
    "MIN_VALUE_REG",
    ()=>MIN_VALUE_REG,
    "appendOffsetOfLegend",
    ()=>appendOffsetOfLegend,
    "calculateCartesianTooltipPos",
    ()=>calculateCartesianTooltipPos,
    "calculatePolarTooltipPos",
    ()=>calculatePolarTooltipPos,
    "checkDomainOfScale",
    ()=>checkDomainOfScale,
    "getBandSizeOfAxis",
    ()=>getBandSizeOfAxis,
    "getBaseValueOfBar",
    ()=>getBaseValueOfBar,
    "getCateCoordinateOfBar",
    ()=>getCateCoordinateOfBar,
    "getCateCoordinateOfLine",
    ()=>getCateCoordinateOfLine,
    "getCoordinatesOfGrid",
    ()=>getCoordinatesOfGrid,
    "getDomainOfStackGroups",
    ()=>getDomainOfStackGroups,
    "getNormalizedStackId",
    ()=>getNormalizedStackId,
    "getStackedData",
    ()=>getStackedData,
    "getTicksOfAxis",
    ()=>getTicksOfAxis,
    "getTooltipEntry",
    ()=>getTooltipEntry,
    "getTooltipNameProp",
    ()=>getTooltipNameProp,
    "getValueByDataKey",
    ()=>getValueByDataKey,
    "isCategoricalAxis",
    ()=>isCategoricalAxis,
    "offsetPositive",
    ()=>offsetPositive,
    "offsetSign",
    ()=>offsetSign,
    "truncateByDomain",
    ()=>truncateByDomain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/sortBy.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/get.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$shape$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/victory-vendor/es/d3-shape.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stack$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/stack.js [app-client] (ecmascript) <export default as stack>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$expand$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetExpand$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/offset/expand.js [app-client] (ecmascript) <export default as stackOffsetExpand>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$none$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetNone$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/offset/none.js [app-client] (ecmascript) <export default as stackOffsetNone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$silhouette$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetSilhouette$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/offset/silhouette.js [app-client] (ecmascript) <export default as stackOffsetSilhouette>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$wiggle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetWiggle$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/offset/wiggle.js [app-client] (ecmascript) <export default as stackOffsetWiggle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$order$2f$none$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOrderNone$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/order/none.js [app-client] (ecmascript) <export default as stackOrderNone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getSliced$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getSliced.js [app-client] (ecmascript)");
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
;
;
;
;
;
function getValueByDataKey(obj, dataKey, defaultValue) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(obj) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(dataKey)) {
        return defaultValue;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumOrStr"])(dataKey)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(obj, dataKey, defaultValue);
    }
    if (typeof dataKey === 'function') {
        return dataKey(obj);
    }
    return defaultValue;
}
var appendOffsetOfLegend = (offset, legendSettings, legendSize)=>{
    if (legendSettings && legendSize) {
        var { width: boxWidth, height: boxHeight } = legendSize;
        var { align, verticalAlign, layout } = legendSettings;
        if ((layout === 'vertical' || layout === 'horizontal' && verticalAlign === 'middle') && align !== 'center' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(offset[align])) {
            return _objectSpread(_objectSpread({}, offset), {}, {
                [align]: offset[align] + (boxWidth || 0)
            });
        }
        if ((layout === 'horizontal' || layout === 'vertical' && align === 'center') && verticalAlign !== 'middle' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(offset[verticalAlign])) {
            return _objectSpread(_objectSpread({}, offset), {}, {
                [verticalAlign]: offset[verticalAlign] + (boxHeight || 0)
            });
        }
    }
    return offset;
};
var isCategoricalAxis = (layout, axisType)=>layout === 'horizontal' && axisType === 'xAxis' || layout === 'vertical' && axisType === 'yAxis' || layout === 'centric' && axisType === 'angleAxis' || layout === 'radial' && axisType === 'radiusAxis';
var getCoordinatesOfGrid = (ticks, minValue, maxValue, syncWithTicks)=>{
    if (syncWithTicks) {
        return ticks.map((entry)=>entry.coordinate);
    }
    var hasMin, hasMax;
    var values = ticks.map((entry)=>{
        if (entry.coordinate === minValue) {
            hasMin = true;
        }
        if (entry.coordinate === maxValue) {
            hasMax = true;
        }
        return entry.coordinate;
    });
    if (!hasMin) {
        values.push(minValue);
    }
    if (!hasMax) {
        values.push(maxValue);
    }
    return values;
};
var getTicksOfAxis = (axis, isGrid, isAll)=>{
    if (!axis) {
        return null;
    }
    var { duplicateDomain, type, range, scale, realScaleType, isCategorical, categoricalDomain, tickCount, ticks, niceTicks, axisType } = axis;
    if (!scale) {
        return null;
    }
    var offsetForBand = realScaleType === 'scaleBand' && scale.bandwidth ? scale.bandwidth() / 2 : 2;
    var offset = (isGrid || isAll) && type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0;
    offset = axisType === 'angleAxis' && range && range.length >= 2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(range[0] - range[1]) * 2 * offset : offset;
    // The ticks set by user should only affect the ticks adjacent to axis line
    if (isGrid && (ticks || niceTicks)) {
        var result = (ticks || niceTicks || []).map((entry, index)=>{
            var scaleContent = duplicateDomain ? duplicateDomain.indexOf(entry) : entry;
            return {
                // If the scaleContent is not a number, the coordinate will be NaN.
                // That could be the case for example with a PointScale and a string as domain.
                coordinate: scale(scaleContent) + offset,
                value: entry,
                offset,
                index
            };
        });
        return result.filter((row)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(row.coordinate));
    }
    // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
    if (isCategorical && categoricalDomain) {
        return categoricalDomain.map((entry, index)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                index,
                offset
            }));
    }
    if (scale.ticks && !isAll && tickCount != null) {
        return scale.ticks(tickCount).map((entry, index)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                offset,
                index
            }));
    }
    // When axis has duplicated text, serial numbers are used to generate scale
    return scale.domain().map((entry, index)=>({
            coordinate: scale(entry) + offset,
            value: duplicateDomain ? duplicateDomain[entry] : entry,
            index,
            offset
        }));
};
var EPS = 1e-4;
var checkDomainOfScale = (scale)=>{
    var domain = scale.domain();
    if (!domain || domain.length <= 2) {
        return;
    }
    var len = domain.length;
    var range = scale.range();
    var minValue = Math.min(range[0], range[1]) - EPS;
    var maxValue = Math.max(range[0], range[1]) + EPS;
    var first = scale(domain[0]);
    var last = scale(domain[len - 1]);
    if (first < minValue || first > maxValue || last < minValue || last > maxValue) {
        scale.domain([
            domain[0],
            domain[len - 1]
        ]);
    }
};
var truncateByDomain = (value, domain)=>{
    if (!domain || domain.length !== 2 || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(domain[0]) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(domain[1])) {
        return value;
    }
    var minValue = Math.min(domain[0], domain[1]);
    var maxValue = Math.max(domain[0], domain[1]);
    var result = [
        value[0],
        value[1]
    ];
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(value[0]) || value[0] < minValue) {
        result[0] = minValue;
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(value[1]) || value[1] > maxValue) {
        result[1] = maxValue;
    }
    if (result[0] > maxValue) {
        result[0] = maxValue;
    }
    if (result[1] < minValue) {
        result[1] = minValue;
    }
    return result;
};
var offsetSign = (series)=>{
    var n = series.length;
    if (n <= 0) {
        return;
    }
    for(var j = 0, m = series[0].length; j < m; ++j){
        var positive = 0;
        var negative = 0;
        for(var i = 0; i < n; ++i){
            var value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(series[i][j][1]) ? series[i][j][0] : series[i][j][1];
            /* eslint-disable prefer-destructuring, no-param-reassign */ if (value >= 0) {
                series[i][j][0] = positive;
                series[i][j][1] = positive + value;
                positive = series[i][j][1];
            } else {
                series[i][j][0] = negative;
                series[i][j][1] = negative + value;
                negative = series[i][j][1];
            }
        /* eslint-enable prefer-destructuring, no-param-reassign */ }
    }
};
var offsetPositive = (series)=>{
    var n = series.length;
    if (n <= 0) {
        return;
    }
    for(var j = 0, m = series[0].length; j < m; ++j){
        var positive = 0;
        for(var i = 0; i < n; ++i){
            var value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(series[i][j][1]) ? series[i][j][0] : series[i][j][1];
            /* eslint-disable prefer-destructuring, no-param-reassign */ if (value >= 0) {
                series[i][j][0] = positive;
                series[i][j][1] = positive + value;
                positive = series[i][j][1];
            } else {
                series[i][j][0] = 0;
                series[i][j][1] = 0;
            }
        /* eslint-enable prefer-destructuring, no-param-reassign */ }
    }
};
/**
 * Function type to compute offset for stacked data.
 *
 * d3-shape has something fishy going on with its types.
 * In @definitelytyped/d3-shape, this function (the offset accessor) is typed as Series<> => void.
 * However! When I actually open the storybook I can see that the offset accessor actually receives Array<Series<>>.
 * The same I can see in the source code itself:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/66042
 * That one unfortunately has no types but we can tell it passes three-dimensional array.
 *
 * Which leads me to believe that definitelytyped is wrong on this one.
 * There's open discussion on this topic without much attention:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/66042
 */ var STACK_OFFSET_MAP = {
    sign: offsetSign,
    // @ts-expect-error definitelytyped types are incorrect
    expand: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$expand$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetExpand$3e$__["stackOffsetExpand"],
    // @ts-expect-error definitelytyped types are incorrect
    none: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$none$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetNone$3e$__["stackOffsetNone"],
    // @ts-expect-error definitelytyped types are incorrect
    silhouette: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$silhouette$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetSilhouette$3e$__["stackOffsetSilhouette"],
    // @ts-expect-error definitelytyped types are incorrect
    wiggle: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$offset$2f$wiggle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOffsetWiggle$3e$__["stackOffsetWiggle"],
    positive: offsetPositive
};
var getStackedData = (data, dataKeys, offsetType)=>{
    var offsetAccessor = STACK_OFFSET_MAP[offsetType];
    var stack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stack$3e$__["stack"])().keys(dataKeys).value((d, key)=>Number(getValueByDataKey(d, key, 0))).order(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$order$2f$none$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__stackOrderNone$3e$__["stackOrderNone"])// @ts-expect-error definitelytyped types are incorrect
    .offset(offsetAccessor);
    return stack(data);
};
function getNormalizedStackId(publicStackId) {
    return publicStackId == null ? undefined : String(publicStackId);
}
function getCateCoordinateOfLine(_ref) {
    var { axis, ticks, bandSize, entry, index, dataKey } = _ref;
    if (axis.type === 'category') {
        // find coordinate of category axis by the value of category
        // @ts-expect-error why does this use direct object access instead of getValueByDataKey?
        if (!axis.allowDuplicatedCategory && axis.dataKey && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(entry[axis.dataKey])) {
            // @ts-expect-error why does this use direct object access instead of getValueByDataKey?
            var matchedTick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findEntryInArray"])(ticks, 'value', entry[axis.dataKey]);
            if (matchedTick) {
                return matchedTick.coordinate + bandSize / 2;
            }
        }
        return ticks[index] ? ticks[index].coordinate + bandSize / 2 : null;
    }
    var value = getValueByDataKey(entry, !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(dataKey) ? dataKey : axis.dataKey);
    // @ts-expect-error getValueByDataKey does not validate the output type
    return !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(value) ? axis.scale(value) : null;
}
var getCateCoordinateOfBar = (_ref2)=>{
    var { axis, ticks, offset, bandSize, entry, index } = _ref2;
    if (axis.type === 'category') {
        return ticks[index] ? ticks[index].coordinate + offset : null;
    }
    var value = getValueByDataKey(entry, axis.dataKey, axis.scale.domain()[index]);
    return !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(value) ? axis.scale(value) - bandSize / 2 + offset : null;
};
var getBaseValueOfBar = (_ref3)=>{
    var { numericAxis } = _ref3;
    var domain = numericAxis.scale.domain();
    if (numericAxis.type === 'number') {
        // @ts-expect-error type number means the domain has numbers in it but this relationship is not known to typescript
        var minValue = Math.min(domain[0], domain[1]);
        // @ts-expect-error type number means the domain has numbers in it but this relationship is not known to typescript
        var maxValue = Math.max(domain[0], domain[1]);
        if (minValue <= 0 && maxValue >= 0) {
            return 0;
        }
        if (maxValue < 0) {
            return maxValue;
        }
        return minValue;
    }
    return domain[0];
};
var getDomainOfSingle = (data)=>{
    var flat = data.flat(2).filter(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"]);
    return [
        Math.min(...flat),
        Math.max(...flat)
    ];
};
var makeDomainFinite = (domain)=>{
    return [
        domain[0] === Infinity ? 0 : domain[0],
        domain[1] === -Infinity ? 0 : domain[1]
    ];
};
var getDomainOfStackGroups = (stackGroups, startIndex, endIndex)=>{
    if (stackGroups == null) {
        return undefined;
    }
    return makeDomainFinite(Object.keys(stackGroups).reduce((result, stackId)=>{
        var group = stackGroups[stackId];
        var { stackedData } = group;
        var domain = stackedData.reduce((res, entry)=>{
            var sliced = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getSliced$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSliced"])(entry, startIndex, endIndex);
            var s = getDomainOfSingle(sliced);
            return [
                Math.min(res[0], s[0]),
                Math.max(res[1], s[1])
            ];
        }, [
            Infinity,
            -Infinity
        ]);
        return [
            Math.min(domain[0], result[0]),
            Math.max(domain[1], result[1])
        ];
    }, [
        Infinity,
        -Infinity
    ]));
};
var MIN_VALUE_REG = /^dataMin[\s]*-[\s]*([0-9]+([.]{1}[0-9]+){0,1})$/;
var MAX_VALUE_REG = /^dataMax[\s]*\+[\s]*([0-9]+([.]{1}[0-9]+){0,1})$/;
var getBandSizeOfAxis = (axis, ticks, isBar)=>{
    if (axis && axis.scale && axis.scale.bandwidth) {
        var bandWidth = axis.scale.bandwidth();
        if (!isBar || bandWidth > 0) {
            return bandWidth;
        }
    }
    if (axis && ticks && ticks.length >= 2) {
        var orderedTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(ticks, (o)=>o.coordinate);
        var bandSize = Infinity;
        for(var i = 1, len = orderedTicks.length; i < len; i++){
            var cur = orderedTicks[i];
            var prev = orderedTicks[i - 1];
            bandSize = Math.min((cur.coordinate || 0) - (prev.coordinate || 0), bandSize);
        }
        return bandSize === Infinity ? 0 : bandSize;
    }
    return isBar ? undefined : 0;
};
function getTooltipEntry(_ref4) {
    var { tooltipEntrySettings, dataKey, payload, value, name } = _ref4;
    return _objectSpread(_objectSpread({}, tooltipEntrySettings), {}, {
        dataKey,
        payload,
        value,
        name
    });
}
function getTooltipNameProp(nameFromItem, dataKey) {
    if (nameFromItem) {
        return String(nameFromItem);
    }
    if (typeof dataKey === 'string') {
        return dataKey;
    }
    return undefined;
}
var calculateCartesianTooltipPos = (coordinate, layout)=>{
    if (layout === 'horizontal') {
        return coordinate.chartX;
    }
    if (layout === 'vertical') {
        return coordinate.chartY;
    }
    return undefined;
};
var calculatePolarTooltipPos = (rangeObj, layout)=>{
    if (layout === 'centric') {
        return rangeObj.angle;
    }
    return rangeObj.radius;
};
}),
"[project]/pwa/node_modules/recharts/es6/util/Constants.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COLOR_PANEL",
    ()=>COLOR_PANEL,
    "DATA_ITEM_DATAKEY_ATTRIBUTE_NAME",
    ()=>DATA_ITEM_DATAKEY_ATTRIBUTE_NAME,
    "DATA_ITEM_INDEX_ATTRIBUTE_NAME",
    ()=>DATA_ITEM_INDEX_ATTRIBUTE_NAME,
    "DEFAULT_Y_AXIS_WIDTH",
    ()=>DEFAULT_Y_AXIS_WIDTH
]);
var COLOR_PANEL = [
    '#1890FF',
    '#66B5FF',
    '#41D9C7',
    '#2FC25B',
    '#6EDB8F',
    '#9AE65C',
    '#FACC14',
    '#E6965C',
    '#57AD71',
    '#223273',
    '#738AE6',
    '#7564CC',
    '#8543E0',
    '#A877ED',
    '#5C8EE6',
    '#13C2C2',
    '#70E0E0',
    '#5CA3E6',
    '#3436C7',
    '#8082FF',
    '#DD81E6',
    '#F04864',
    '#FA7D92',
    '#D598D9'
];
var DATA_ITEM_INDEX_ATTRIBUTE_NAME = 'data-recharts-item-index';
var DATA_ITEM_DATAKEY_ATTRIBUTE_NAME = 'data-recharts-item-data-key';
var DEFAULT_Y_AXIS_WIDTH = 60;
}),
"[project]/pwa/node_modules/recharts/es6/util/LogUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* eslint no-console: 0 */ __turbopack_context__.s([
    "warn",
    ()=>warn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/pwa/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var isDev = ("TURBOPACK compile-time value", "development") !== 'production';
var warn = function warn(condition, format) {
    for(var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++){
        args[_key - 2] = arguments[_key];
    }
    if (isDev && typeof console !== 'undefined' && console.warn) {
        if (format === undefined) {
            console.warn('LogUtils requires an error message argument');
        }
        if (!condition) {
            if (format === undefined) {
                console.warn('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
            } else {
                var argIndex = 0;
                console.warn(format.replace(/%s/g, ()=>args[argIndex++]));
            }
        }
    }
};
}),
"[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isPositiveNumber",
    ()=>isPositiveNumber,
    "isWellBehavedNumber",
    ()=>isWellBehavedNumber
]);
function isWellBehavedNumber(n) {
    return Number.isFinite(n);
}
function isPositiveNumber(n) {
    return typeof n === 'number' && n > 0 && Number.isFinite(n);
}
}),
"[project]/pwa/node_modules/recharts/es6/util/isDomainSpecifiedByUser.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extendDomain",
    ()=>extendDomain,
    "isWellFormedNumberDomain",
    ()=>isWellFormedNumberDomain,
    "numericalDomainSpecifiedWithoutRequiringData",
    ()=>numericalDomainSpecifiedWithoutRequiringData,
    "parseNumericalUserDomain",
    ()=>parseNumericalUserDomain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)");
;
;
;
function isWellFormedNumberDomain(v) {
    if (Array.isArray(v) && v.length === 2) {
        var [min, max] = v;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(min) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(max)) {
            return true;
        }
    }
    return false;
}
function extendDomain(providedDomain, boundaryDomain, allowDataOverflow) {
    if (allowDataOverflow) {
        // If the data are allowed to overflow - we're fine with whatever user provided
        return providedDomain;
    }
    /*
   * If the data are not allowed to overflow - we need to extend the domain.
   * Means that effectively the user is allowed to make the domain larger
   * but not smaller.
   */ return [
        Math.min(providedDomain[0], boundaryDomain[0]),
        Math.max(providedDomain[1], boundaryDomain[1])
    ];
}
function numericalDomainSpecifiedWithoutRequiringData(userDomain, allowDataOverflow) {
    if (!allowDataOverflow) {
        // Cannot compute data overflow if the data is not provided
        return undefined;
    }
    if (typeof userDomain === 'function') {
        // The user function expects the data to be provided as an argument
        return undefined;
    }
    if (Array.isArray(userDomain) && userDomain.length === 2) {
        var [providedMin, providedMax] = userDomain;
        var finalMin, finalMax;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(providedMin)) {
            finalMin = providedMin;
        } else if (typeof providedMin === 'function') {
            // The user function expects the data to be provided as an argument
            return undefined;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(providedMax)) {
            finalMax = providedMax;
        } else if (typeof providedMax === 'function') {
            // The user function expects the data to be provided as an argument
            return undefined;
        }
        var candidate = [
            finalMin,
            finalMax
        ];
        if (isWellFormedNumberDomain(candidate)) {
            return candidate;
        }
    }
    return undefined;
}
function parseNumericalUserDomain(userDomain, dataDomain, allowDataOverflow) {
    if (!allowDataOverflow && dataDomain == null) {
        // Cannot compute data overflow if the data is not provided
        return undefined;
    }
    if (typeof userDomain === 'function' && dataDomain != null) {
        try {
            var result = userDomain(dataDomain, allowDataOverflow);
            if (isWellFormedNumberDomain(result)) {
                return extendDomain(result, dataDomain, allowDataOverflow);
            }
        } catch (_unused) {
        /* ignore the exception and compute domain from data later */ }
    }
    if (Array.isArray(userDomain) && userDomain.length === 2) {
        var [providedMin, providedMax] = userDomain;
        var finalMin, finalMax;
        if (providedMin === 'auto') {
            if (dataDomain != null) {
                finalMin = Math.min(...dataDomain);
            }
        } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(providedMin)) {
            finalMin = providedMin;
        } else if (typeof providedMin === 'function') {
            try {
                if (dataDomain != null) {
                    finalMin = providedMin(dataDomain === null || dataDomain === void 0 ? void 0 : dataDomain[0]);
                }
            } catch (_unused2) {
            /* ignore the exception and compute domain from data later */ }
        } else if (typeof providedMin === 'string' && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MIN_VALUE_REG"].test(providedMin)) {
            var match = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MIN_VALUE_REG"].exec(providedMin);
            if (match == null || dataDomain == null) {
                finalMin = undefined;
            } else {
                var value = +match[1];
                finalMin = dataDomain[0] - value;
            }
        } else {
            finalMin = dataDomain === null || dataDomain === void 0 ? void 0 : dataDomain[0];
        }
        if (providedMax === 'auto') {
            if (dataDomain != null) {
                finalMax = Math.max(...dataDomain);
            }
        } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(providedMax)) {
            finalMax = providedMax;
        } else if (typeof providedMax === 'function') {
            try {
                if (dataDomain != null) {
                    finalMax = providedMax(dataDomain === null || dataDomain === void 0 ? void 0 : dataDomain[1]);
                }
            } catch (_unused3) {
            /* ignore the exception and compute domain from data later */ }
        } else if (typeof providedMax === 'string' && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_VALUE_REG"].test(providedMax)) {
            var _match = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_VALUE_REG"].exec(providedMax);
            if (_match == null || dataDomain == null) {
                finalMax = undefined;
            } else {
                var _value = +_match[1];
                finalMax = dataDomain[1] + _value;
            }
        } else {
            finalMax = dataDomain === null || dataDomain === void 0 ? void 0 : dataDomain[1];
        }
        var candidate = [
            finalMin,
            finalMax
        ];
        if (isWellFormedNumberDomain(candidate)) {
            if (dataDomain == null) {
                return candidate;
            }
            return extendDomain(candidate, dataDomain, allowDataOverflow);
        }
    }
    return undefined;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/scale/util/utils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PLACE_HOLDER",
    ()=>PLACE_HOLDER,
    "compose",
    ()=>compose,
    "curry",
    ()=>curry,
    "map",
    ()=>map,
    "memoize",
    ()=>memoize,
    "range",
    ()=>range,
    "reverse",
    ()=>reverse
]);
var identity = (i)=>i;
var PLACE_HOLDER = {
    '@@functional/placeholder': true
};
var isPlaceHolder = (val)=>val === PLACE_HOLDER;
var curry0 = (fn)=>function _curried() {
        if (arguments.length === 0 || arguments.length === 1 && isPlaceHolder(arguments.length <= 0 ? undefined : arguments[0])) {
            return _curried;
        }
        return fn(...arguments);
    };
var curryN = (n, fn)=>{
    if (n === 1) {
        return fn;
    }
    return curry0(function() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        var argsLength = args.filter((arg)=>arg !== PLACE_HOLDER).length;
        if (argsLength >= n) {
            return fn(...args);
        }
        return curryN(n - argsLength, curry0(function() {
            for(var _len2 = arguments.length, restArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++){
                restArgs[_key2] = arguments[_key2];
            }
            var newArgs = args.map((arg)=>isPlaceHolder(arg) ? restArgs.shift() : arg);
            return fn(...newArgs, ...restArgs);
        }));
    });
};
var curry = (fn)=>curryN(fn.length, fn);
var range = (begin, end)=>{
    var arr = [];
    for(var i = begin; i < end; ++i){
        arr[i - begin] = i;
    }
    return arr;
};
var map = curry((fn, arr)=>{
    if (Array.isArray(arr)) {
        return arr.map(fn);
    }
    return Object.keys(arr).map((key)=>arr[key]).map(fn);
});
var compose = function compose() {
    for(var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++){
        args[_key3] = arguments[_key3];
    }
    if (!args.length) {
        return identity;
    }
    var fns = args.reverse();
    // first function can receive multiply arguments
    var firstFn = fns[0];
    var tailsFn = fns.slice(1);
    return function() {
        return tailsFn.reduce((res, fn)=>fn(res), firstFn(...arguments));
    };
};
var reverse = (arr)=>{
    if (Array.isArray(arr)) {
        return arr.reverse();
    }
    // can be string
    return arr.split('').reverse().join('');
};
var memoize = (fn)=>{
    var lastArgs = null;
    var lastResult = null;
    return function() {
        for(var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++){
            args[_key4] = arguments[_key4];
        }
        if (lastArgs && args.every((val, i)=>{
            var _lastArgs;
            return val === ((_lastArgs = lastArgs) === null || _lastArgs === void 0 ? void 0 : _lastArgs[i]);
        })) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = fn(...args);
        return lastResult;
    };
};
}),
"[project]/pwa/node_modules/recharts/es6/util/scale/util/arithmetic.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @fileOverview Some common arithmetic methods
 * @author xile611
 * @date 2015-09-17
 */ __turbopack_context__.s([
    "getDigitCount",
    ()=>getDigitCount,
    "interpolateNumber",
    ()=>interpolateNumber,
    "rangeStep",
    ()=>rangeStep,
    "uninterpolateNumber",
    ()=>uninterpolateNumber,
    "uninterpolateTruncation",
    ()=>uninterpolateTruncation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/decimal.js-light/decimal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/scale/util/utils.js [app-client] (ecmascript)");
;
;
/**
 * Get the digit count of a number.
 * If the absolute value is in the interval [0.1, 1), the result is 0.
 * If the absolute value is in the interval [0.01, 0.1), the digit count is -1.
 * If the absolute value is in the interval [0.001, 0.01), the digit count is -2.
 *
 * @param  {Number} value The number
 * @return {Integer}      Digit count
 */ function getDigitCount(value) {
    var result;
    if (value === 0) {
        result = 1;
    } else {
        result = Math.floor(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](value).abs().log(10).toNumber()) + 1;
    }
    return result;
}
/**
 * Get the data in the interval [start, end) with a fixed step.
 * Also handles JS calculation precision issues.
 *
 * @param  {Decimal} start Start point
 * @param  {Decimal} end   End point, not included
 * @param  {Decimal} step  Step size
 * @return {Array}         Array of numbers
 */ function rangeStep(start, end, step) {
    var num = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](start);
    var i = 0;
    var result = [];
    // magic number to prevent infinite loop
    while(num.lt(end) && i < 100000){
        result.push(num.toNumber());
        num = num.add(step);
        i++;
    }
    return result;
}
/**
 * Linear interpolation of numbers.
 *
 * @param  {Number} a  Endpoint of the domain
 * @param  {Number} b  Endpoint of the domain
 * @param  {Number} t  A value in [0, 1]
 * @return {Number}    A value in the domain
 */ var interpolateNumber = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["curry"])((a, b, t)=>{
    var newA = +a;
    var newB = +b;
    return newA + t * (newB - newA);
});
/**
 * Inverse operation of linear interpolation.
 *
 * @param  {Number} a Endpoint of the domain
 * @param  {Number} b Endpoint of the domain
 * @param  {Number} x Can be considered as an output value after interpolation
 * @return {Number}   When x is in the range a ~ b, the return value is in [0, 1]
 */ var uninterpolateNumber = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["curry"])((a, b, x)=>{
    var diff = b - +a;
    diff = diff || Infinity;
    return (x - a) / diff;
});
/**
 * Inverse operation of linear interpolation with truncation.
 *
 * @param  {Number} a Endpoint of the domain
 * @param  {Number} b Endpoint of the domain
 * @param  {Number} x Can be considered as an output value after interpolation
 * @return {Number}   When x is in the interval a ~ b, the return value is in [0, 1].
 *                    When x is not in the interval a ~ b, it will be truncated to the interval a ~ b.
 */ var uninterpolateTruncation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["curry"])((a, b, x)=>{
    var diff = b - +a;
    diff = diff || Infinity;
    return Math.max(0, Math.min(1, (x - a) / diff));
});
;
}),
"[project]/pwa/node_modules/recharts/es6/util/scale/getNiceTickValues.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @fileOverview calculate tick values of scale
 * @author xile611, arcthur
 * @date 2015-09-17
 */ __turbopack_context__.s([
    "calculateStep",
    ()=>_calculateStep,
    "getFormatStep",
    ()=>getFormatStep,
    "getNiceTickValues",
    ()=>getNiceTickValues,
    "getTickOfSingleValue",
    ()=>getTickOfSingleValue,
    "getTickValuesFixedDomain",
    ()=>getTickValuesFixedDomain,
    "getValidInterval",
    ()=>getValidInterval
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/decimal.js-light/decimal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/scale/util/utils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$arithmetic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/scale/util/arithmetic.js [app-client] (ecmascript)");
;
;
;
var getValidInterval = (_ref)=>{
    var [min, max] = _ref;
    var [validMin, validMax] = [
        min,
        max
    ];
    // exchange
    if (min > max) {
        [validMin, validMax] = [
            max,
            min
        ];
    }
    return [
        validMin,
        validMax
    ];
};
var getFormatStep = (roughStep, allowDecimals, correctionFactor)=>{
    if (roughStep.lte(0)) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0);
    }
    var digitCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$arithmetic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDigitCount"])(roughStep.toNumber());
    // The ratio between the rough step and the smallest number which has a bigger
    // order of magnitudes than the rough step
    var digitCountValue = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](10).pow(digitCount);
    var stepRatio = roughStep.div(digitCountValue);
    // When an integer and a float multiplied, the accuracy of result may be wrong
    var stepRatioScale = digitCount !== 1 ? 0.05 : 0.1;
    var amendStepRatio = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](Math.ceil(stepRatio.div(stepRatioScale).toNumber())).add(correctionFactor).mul(stepRatioScale);
    var formatStep = amendStepRatio.mul(digitCountValue);
    return allowDecimals ? new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](formatStep.toNumber()) : new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](Math.ceil(formatStep.toNumber()));
};
var getTickOfSingleValue = (value, tickCount, allowDecimals)=>{
    var step = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](1);
    // calculate the middle value of ticks
    var middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](value);
    if (!middle.isint() && allowDecimals) {
        var absVal = Math.abs(value);
        if (absVal < 1) {
            // The step should be a float number when the difference is smaller than 1
            step = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](10).pow((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$arithmetic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDigitCount"])(value) - 1);
            middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](Math.floor(middle.div(step).toNumber())).mul(step);
        } else if (absVal > 1) {
            // Return the maximum integer which is smaller than 'value' when 'value' is greater than 1
            middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](Math.floor(value));
        }
    } else if (value === 0) {
        middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](Math.floor((tickCount - 1) / 2));
    } else if (!allowDecimals) {
        middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](Math.floor(value));
    }
    var middleIndex = Math.floor((tickCount - 1) / 2);
    var fn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compose"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["map"])((n)=>middle.add(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](n - middleIndex).mul(step)).toNumber()), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["range"]);
    return fn(0, tickCount);
};
/**
 * Calculate the step
 *
 * @param  min              The minimum value of an interval
 * @param  max              The maximum value of an interval
 * @param  tickCount        The count of ticks
 * @param  allowDecimals    Allow the ticks to be decimals or not
 * @param  correctionFactor A correction factor
 * @return The step, minimum value of ticks, maximum value of ticks
 */ var _calculateStep = function calculateStep(min, max, tickCount, allowDecimals) {
    var correctionFactor = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    // dirty hack (for recharts' test)
    if (!Number.isFinite((max - min) / (tickCount - 1))) {
        return {
            step: new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0),
            tickMin: new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0),
            tickMax: new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0)
        };
    }
    // The step which is easy to understand between two ticks
    var step = getFormatStep(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](max).sub(min).div(tickCount - 1), allowDecimals, correctionFactor);
    // A medial value of ticks
    var middle;
    // When 0 is inside the interval, 0 should be a tick
    if (min <= 0 && max >= 0) {
        middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0);
    } else {
        // calculate the middle value
        middle = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](min).add(max).div(2);
        // minus modulo value
        middle = middle.sub(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](middle).mod(step));
    }
    var belowCount = Math.ceil(middle.sub(min).div(step).toNumber());
    var upCount = Math.ceil(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](max).sub(middle).div(step).toNumber());
    var scaleCount = belowCount + upCount + 1;
    if (scaleCount > tickCount) {
        // When more ticks need to cover the interval, step should be bigger.
        return _calculateStep(min, max, tickCount, allowDecimals, correctionFactor + 1);
    }
    if (scaleCount < tickCount) {
        // When less ticks can cover the interval, we should add some additional ticks
        upCount = max > 0 ? upCount + (tickCount - scaleCount) : upCount;
        belowCount = max > 0 ? belowCount : belowCount + (tickCount - scaleCount);
    }
    return {
        step,
        tickMin: middle.sub(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](belowCount).mul(step)),
        tickMax: middle.add(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](upCount).mul(step))
    };
};
;
function getNiceTickValuesFn(_ref2) {
    var [min, max] = _ref2;
    var tickCount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    var allowDecimals = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    // More than two ticks should be return
    var count = Math.max(tickCount, 2);
    var [cormin, cormax] = getValidInterval([
        min,
        max
    ]);
    if (cormin === -Infinity || cormax === Infinity) {
        var _values = cormax === Infinity ? [
            cormin,
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["range"])(0, tickCount - 1).map(()=>Infinity)
        ] : [
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["range"])(0, tickCount - 1).map(()=>-Infinity),
            cormax
        ];
        return min > max ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reverse"])(_values) : _values;
    }
    if (cormin === cormax) {
        return getTickOfSingleValue(cormin, tickCount, allowDecimals);
    }
    // Get the step between two ticks
    var { step, tickMin, tickMax } = _calculateStep(cormin, cormax, count, allowDecimals, 0);
    var values = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$arithmetic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rangeStep"])(tickMin, tickMax.add(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0.1).mul(step)), step);
    return min > max ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reverse"])(values) : values;
}
/**
 * Calculate the ticks of an interval.
 * Ticks will be constrained to the interval [min, max] even if it makes them less rounded and nice.
 *
 * @param tuple of [min,max] min: The minimum value, max: The maximum value
 * @param tickCount     The count of ticks. This function may return less than tickCount ticks if the interval is too small.
 * @param allowDecimals Allow the ticks to be decimals or not
 * @return array of ticks
 */ function getTickValuesFixedDomainFn(_ref3, tickCount) {
    var [min, max] = _ref3;
    var allowDecimals = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    // More than two ticks should be return
    var [cormin, cormax] = getValidInterval([
        min,
        max
    ]);
    if (cormin === -Infinity || cormax === Infinity) {
        return [
            min,
            max
        ];
    }
    if (cormin === cormax) {
        return [
            cormin
        ];
    }
    var count = Math.max(tickCount, 2);
    var step = getFormatStep(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](cormax).sub(cormin).div(count - 1), allowDecimals, 0);
    var values = [
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$arithmetic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rangeStep"])(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](cormin), new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$decimal$2e$js$2d$light$2f$decimal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](cormax), step),
        cormax
    ];
    if (allowDecimals === false) {
        /*
     * allowDecimals is false means that we want to have integer ticks.
     * The step is guaranteed to be an integer in the code above which is great start
     * but when the first step is not an integer, it will start stepping from a decimal value anyway.
     * So we need to round all the values to integers after the fact.
     */ values = values.map((value)=>Math.round(value));
    }
    return min > max ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reverse"])(values) : values;
}
var getNiceTickValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memoize"])(getNiceTickValuesFn);
var getTickValuesFixedDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$util$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memoize"])(getTickValuesFixedDomainFn);
}),
"[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RADIAN",
    ()=>RADIAN,
    "degreeToRadian",
    ()=>degreeToRadian,
    "getMaxRadius",
    ()=>getMaxRadius,
    "getTickClassName",
    ()=>getTickClassName,
    "inRangeOfSector",
    ()=>inRangeOfSector,
    "polarToCartesian",
    ()=>polarToCartesian,
    "radianToDegree",
    ()=>radianToDegree
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
;
var RADIAN = Math.PI / 180;
var degreeToRadian = (angle)=>angle * Math.PI / 180;
var radianToDegree = (angleInRadian)=>angleInRadian * 180 / Math.PI;
var polarToCartesian = (cx, cy, radius, angle)=>({
        x: cx + Math.cos(-RADIAN * angle) * radius,
        y: cy + Math.sin(-RADIAN * angle) * radius
    });
var getMaxRadius = function getMaxRadius(width, height) {
    var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        brushBottom: 0
    };
    return Math.min(Math.abs(width - (offset.left || 0) - (offset.right || 0)), Math.abs(height - (offset.top || 0) - (offset.bottom || 0))) / 2;
};
var distanceBetweenPoints = (point, anotherPoint)=>{
    var { x: x1, y: y1 } = point;
    var { x: x2, y: y2 } = anotherPoint;
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
};
var getAngleOfPoint = (_ref, _ref2)=>{
    var { x, y } = _ref;
    var { cx, cy } = _ref2;
    var radius = distanceBetweenPoints({
        x,
        y
    }, {
        x: cx,
        y: cy
    });
    if (radius <= 0) {
        return {
            radius,
            angle: 0
        };
    }
    var cos = (x - cx) / radius;
    var angleInRadian = Math.acos(cos);
    if (y > cy) {
        angleInRadian = 2 * Math.PI - angleInRadian;
    }
    return {
        radius,
        angle: radianToDegree(angleInRadian),
        angleInRadian
    };
};
var formatAngleOfSector = (_ref3)=>{
    var { startAngle, endAngle } = _ref3;
    var startCnt = Math.floor(startAngle / 360);
    var endCnt = Math.floor(endAngle / 360);
    var min = Math.min(startCnt, endCnt);
    return {
        startAngle: startAngle - min * 360,
        endAngle: endAngle - min * 360
    };
};
var reverseFormatAngleOfSector = (angle, _ref4)=>{
    var { startAngle, endAngle } = _ref4;
    var startCnt = Math.floor(startAngle / 360);
    var endCnt = Math.floor(endAngle / 360);
    var min = Math.min(startCnt, endCnt);
    return angle + min * 360;
};
var inRangeOfSector = (_ref5, viewBox)=>{
    var { chartX: x, chartY: y } = _ref5;
    var { radius, angle } = getAngleOfPoint({
        x,
        y
    }, viewBox);
    var { innerRadius, outerRadius } = viewBox;
    if (radius < innerRadius || radius > outerRadius) {
        return null;
    }
    if (radius === 0) {
        return null;
    }
    var { startAngle, endAngle } = formatAngleOfSector(viewBox);
    var formatAngle = angle;
    var inRange;
    if (startAngle <= endAngle) {
        while(formatAngle > endAngle){
            formatAngle -= 360;
        }
        while(formatAngle < startAngle){
            formatAngle += 360;
        }
        inRange = formatAngle >= startAngle && formatAngle <= endAngle;
    } else {
        while(formatAngle > startAngle){
            formatAngle -= 360;
        }
        while(formatAngle < endAngle){
            formatAngle += 360;
        }
        inRange = formatAngle >= endAngle && formatAngle <= startAngle;
    }
    if (inRange) {
        return _objectSpread(_objectSpread({}, viewBox), {}, {
            radius,
            angle: reverseFormatAngleOfSector(formatAngle, viewBox)
        });
    }
    return null;
};
var getTickClassName = (tick)=>!/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(tick) && typeof tick !== 'function' && typeof tick !== 'boolean' && tick != null ? tick.className : '';
}),
"[project]/pwa/node_modules/recharts/es6/util/stacks/getStackSeriesIdentifier.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Returns identifier for stack series which is one individual graphical item in the stack.
 * @param graphicalItem - The graphical item representing the series in the stack.
 * @return The identifier for the series in the stack
 */ __turbopack_context__.s([
    "getStackSeriesIdentifier",
    ()=>getStackSeriesIdentifier
]);
function getStackSeriesIdentifier(graphicalItem) {
    return graphicalItem === null || graphicalItem === void 0 ? void 0 : graphicalItem.id;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/getActiveCoordinate.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateActiveTickIndex",
    ()=>calculateActiveTickIndex,
    "getActiveCartesianCoordinate",
    ()=>getActiveCartesianCoordinate,
    "getActivePolarCoordinate",
    ()=>getActivePolarCoordinate,
    "isInCartesianRange",
    ()=>isInCartesianRange
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
;
;
var getActiveCartesianCoordinate = (layout, tooltipTicks, activeIndex, pointer)=>{
    var entry = tooltipTicks.find((tick)=>tick && tick.index === activeIndex);
    if (entry) {
        if (layout === 'horizontal') {
            return {
                x: entry.coordinate,
                y: pointer.chartY
            };
        }
        if (layout === 'vertical') {
            return {
                x: pointer.chartX,
                y: entry.coordinate
            };
        }
    }
    return {
        x: 0,
        y: 0
    };
};
var getActivePolarCoordinate = (layout, tooltipTicks, activeIndex, rangeObj)=>{
    var entry = tooltipTicks.find((tick)=>tick && tick.index === activeIndex);
    if (entry) {
        if (layout === 'centric') {
            var _angle = entry.coordinate;
            var { radius: _radius } = rangeObj;
            return _objectSpread(_objectSpread(_objectSpread({}, rangeObj), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarToCartesian"])(rangeObj.cx, rangeObj.cy, _radius, _angle)), {}, {
                angle: _angle,
                radius: _radius
            });
        }
        var radius = entry.coordinate;
        var { angle } = rangeObj;
        return _objectSpread(_objectSpread(_objectSpread({}, rangeObj), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarToCartesian"])(rangeObj.cx, rangeObj.cy, radius, angle)), {}, {
            angle,
            radius
        });
    }
    return {
        angle: 0,
        clockWise: false,
        cx: 0,
        cy: 0,
        endAngle: 0,
        innerRadius: 0,
        outerRadius: 0,
        radius: 0,
        startAngle: 0,
        x: 0,
        y: 0
    };
};
function isInCartesianRange(pointer, offset) {
    var { chartX: x, chartY: y } = pointer;
    return x >= offset.left && x <= offset.left + offset.width && y >= offset.top && y <= offset.top + offset.height;
}
var calculateActiveTickIndex = (coordinate, ticks, unsortedTicks, axisType, range)=>{
    var _ticks$length;
    var index = -1;
    var len = (_ticks$length = ticks === null || ticks === void 0 ? void 0 : ticks.length) !== null && _ticks$length !== void 0 ? _ticks$length : 0;
    // if there are 1 or fewer ticks or if there is no coordinate then the active tick is at index 0
    if (len <= 1 || coordinate == null) {
        return 0;
    }
    if (axisType === 'angleAxis' && range != null && Math.abs(Math.abs(range[1] - range[0]) - 360) <= 1e-6) {
        // ticks are distributed in a circle
        for(var i = 0; i < len; i++){
            var before = i > 0 ? unsortedTicks[i - 1].coordinate : unsortedTicks[len - 1].coordinate;
            var cur = unsortedTicks[i].coordinate;
            var after = i >= len - 1 ? unsortedTicks[0].coordinate : unsortedTicks[i + 1].coordinate;
            var sameDirectionCoord = void 0;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(cur - before) !== (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(after - cur)) {
                var diffInterval = [];
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(after - cur) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(range[1] - range[0])) {
                    sameDirectionCoord = after;
                    var curInRange = cur + range[1] - range[0];
                    diffInterval[0] = Math.min(curInRange, (curInRange + before) / 2);
                    diffInterval[1] = Math.max(curInRange, (curInRange + before) / 2);
                } else {
                    sameDirectionCoord = before;
                    var afterInRange = after + range[1] - range[0];
                    diffInterval[0] = Math.min(cur, (afterInRange + cur) / 2);
                    diffInterval[1] = Math.max(cur, (afterInRange + cur) / 2);
                }
                var sameInterval = [
                    Math.min(cur, (sameDirectionCoord + cur) / 2),
                    Math.max(cur, (sameDirectionCoord + cur) / 2)
                ];
                if (coordinate > sameInterval[0] && coordinate <= sameInterval[1] || coordinate >= diffInterval[0] && coordinate <= diffInterval[1]) {
                    ({ index } = unsortedTicks[i]);
                    break;
                }
            } else {
                var minValue = Math.min(before, after);
                var maxValue = Math.max(before, after);
                if (coordinate > (minValue + cur) / 2 && coordinate <= (maxValue + cur) / 2) {
                    ({ index } = unsortedTicks[i]);
                    break;
                }
            }
        }
    } else if (ticks) {
        // ticks are distributed in a single direction
        for(var _i = 0; _i < len; _i++){
            if (_i === 0 && coordinate <= (ticks[_i].coordinate + ticks[_i + 1].coordinate) / 2 || _i > 0 && _i < len - 1 && coordinate > (ticks[_i].coordinate + ticks[_i - 1].coordinate) / 2 && coordinate <= (ticks[_i].coordinate + ticks[_i + 1].coordinate) / 2 || _i === len - 1 && coordinate > (ticks[_i].coordinate + ticks[_i - 1].coordinate) / 2) {
                ({ index } = ticks[_i]);
                break;
            }
        }
    }
    return index;
};
}),
"[project]/pwa/node_modules/recharts/es6/util/getChartPointer.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Computes the chart coordinates from the mouse event.
 *
 * The coordinates are relative to the top-left corner of the chart,
 * where the top-left corner of the chart is (0, 0).
 * Moving right, the x-coordinate increases, and moving down, the y-coordinate increases.
 *
 * The coordinates are rounded to the nearest integer and are including a CSS transform scale.
 * So a chart that's scaled will return the same coordinates as a chart that's not scaled.
 *
 * @param event The mouse event from React event handlers
 * @return chartPointer The chart coordinates relative to the top-left corner of the chart
 */ __turbopack_context__.s([
    "getChartPointer",
    ()=>getChartPointer
]);
var getChartPointer = (event)=>{
    var rect = event.currentTarget.getBoundingClientRect();
    var scaleX = rect.width / event.currentTarget.offsetWidth;
    var scaleY = rect.height / event.currentTarget.offsetHeight;
    return {
        /*
     * Here it's important to use:
     * - event.clientX and event.clientY to get the mouse position relative to the viewport, including scroll.
     * - pageX and pageY are not used because they are relative to the whole document, and ignore scroll.
     * - rect.left and rect.top are used to get the position of the chart relative to the viewport.
     * - offsetX and offsetY are not used because they are relative to the offset parent
     *  which may or may not be the same as the clientX and clientY, depending on the position of the chart in the DOM
     *  and surrounding element styles. CSS position: relative, absolute, fixed, will change the offset parent.
     * - scaleX and scaleY are necessary for when the chart element is scaled using CSS `transform: scale(N)`.
     */ chartX: Math.round((event.clientX - rect.left) / scaleX),
        chartY: Math.round((event.clientY - rect.top) / scaleY)
    };
};
}),
"[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Global",
    ()=>Global
]);
var parseIsSsrByDefault = ()=>!(typeof window !== 'undefined' && window.document && Boolean(window.document.createElement) && window.setTimeout);
var Global = {
    devToolsEnabled: false,
    isSsr: parseIsSsrByDefault()
};
}),
"[project]/pwa/node_modules/recharts/es6/util/excludeEventProps.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isEventKey",
    ()=>isEventKey
]);
var EventKeys = [
    'dangerouslySetInnerHTML',
    'onCopy',
    'onCopyCapture',
    'onCut',
    'onCutCapture',
    'onPaste',
    'onPasteCapture',
    'onCompositionEnd',
    'onCompositionEndCapture',
    'onCompositionStart',
    'onCompositionStartCapture',
    'onCompositionUpdate',
    'onCompositionUpdateCapture',
    'onFocus',
    'onFocusCapture',
    'onBlur',
    'onBlurCapture',
    'onChange',
    'onChangeCapture',
    'onBeforeInput',
    'onBeforeInputCapture',
    'onInput',
    'onInputCapture',
    'onReset',
    'onResetCapture',
    'onSubmit',
    'onSubmitCapture',
    'onInvalid',
    'onInvalidCapture',
    'onLoad',
    'onLoadCapture',
    'onError',
    'onErrorCapture',
    'onKeyDown',
    'onKeyDownCapture',
    'onKeyPress',
    'onKeyPressCapture',
    'onKeyUp',
    'onKeyUpCapture',
    'onAbort',
    'onAbortCapture',
    'onCanPlay',
    'onCanPlayCapture',
    'onCanPlayThrough',
    'onCanPlayThroughCapture',
    'onDurationChange',
    'onDurationChangeCapture',
    'onEmptied',
    'onEmptiedCapture',
    'onEncrypted',
    'onEncryptedCapture',
    'onEnded',
    'onEndedCapture',
    'onLoadedData',
    'onLoadedDataCapture',
    'onLoadedMetadata',
    'onLoadedMetadataCapture',
    'onLoadStart',
    'onLoadStartCapture',
    'onPause',
    'onPauseCapture',
    'onPlay',
    'onPlayCapture',
    'onPlaying',
    'onPlayingCapture',
    'onProgress',
    'onProgressCapture',
    'onRateChange',
    'onRateChangeCapture',
    'onSeeked',
    'onSeekedCapture',
    'onSeeking',
    'onSeekingCapture',
    'onStalled',
    'onStalledCapture',
    'onSuspend',
    'onSuspendCapture',
    'onTimeUpdate',
    'onTimeUpdateCapture',
    'onVolumeChange',
    'onVolumeChangeCapture',
    'onWaiting',
    'onWaitingCapture',
    'onAuxClick',
    'onAuxClickCapture',
    'onClick',
    'onClickCapture',
    'onContextMenu',
    'onContextMenuCapture',
    'onDoubleClick',
    'onDoubleClickCapture',
    'onDrag',
    'onDragCapture',
    'onDragEnd',
    'onDragEndCapture',
    'onDragEnter',
    'onDragEnterCapture',
    'onDragExit',
    'onDragExitCapture',
    'onDragLeave',
    'onDragLeaveCapture',
    'onDragOver',
    'onDragOverCapture',
    'onDragStart',
    'onDragStartCapture',
    'onDrop',
    'onDropCapture',
    'onMouseDown',
    'onMouseDownCapture',
    'onMouseEnter',
    'onMouseLeave',
    'onMouseMove',
    'onMouseMoveCapture',
    'onMouseOut',
    'onMouseOutCapture',
    'onMouseOver',
    'onMouseOverCapture',
    'onMouseUp',
    'onMouseUpCapture',
    'onSelect',
    'onSelectCapture',
    'onTouchCancel',
    'onTouchCancelCapture',
    'onTouchEnd',
    'onTouchEndCapture',
    'onTouchMove',
    'onTouchMoveCapture',
    'onTouchStart',
    'onTouchStartCapture',
    'onPointerDown',
    'onPointerDownCapture',
    'onPointerMove',
    'onPointerMoveCapture',
    'onPointerUp',
    'onPointerUpCapture',
    'onPointerCancel',
    'onPointerCancelCapture',
    'onPointerEnter',
    'onPointerEnterCapture',
    'onPointerLeave',
    'onPointerLeaveCapture',
    'onPointerOver',
    'onPointerOverCapture',
    'onPointerOut',
    'onPointerOutCapture',
    'onGotPointerCapture',
    'onGotPointerCaptureCapture',
    'onLostPointerCapture',
    'onLostPointerCaptureCapture',
    'onScroll',
    'onScrollCapture',
    'onWheel',
    'onWheelCapture',
    'onAnimationStart',
    'onAnimationStartCapture',
    'onAnimationEnd',
    'onAnimationEndCapture',
    'onAnimationIteration',
    'onAnimationIterationCapture',
    'onTransitionEnd',
    'onTransitionEndCapture'
];
function isEventKey(key) {
    if (typeof key !== 'string') {
        return false;
    }
    var allowedEventKeys = EventKeys;
    return allowedEventKeys.includes(key);
}
}),
"[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isDataAttribute",
    ()=>isDataAttribute,
    "isSvgElementPropKey",
    ()=>isSvgElementPropKey,
    "svgPropertiesNoEvents",
    ()=>svgPropertiesNoEvents,
    "svgPropertiesNoEventsFromUnknown",
    ()=>svgPropertiesNoEventsFromUnknown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var SVGElementPropKeys = [
    'aria-activedescendant',
    'aria-atomic',
    'aria-autocomplete',
    'aria-busy',
    'aria-checked',
    'aria-colcount',
    'aria-colindex',
    'aria-colspan',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-details',
    'aria-disabled',
    'aria-errormessage',
    'aria-expanded',
    'aria-flowto',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-level',
    'aria-live',
    'aria-modal',
    'aria-multiline',
    'aria-multiselectable',
    'aria-orientation',
    'aria-owns',
    'aria-placeholder',
    'aria-posinset',
    'aria-pressed',
    'aria-readonly',
    'aria-relevant',
    'aria-required',
    'aria-roledescription',
    'aria-rowcount',
    'aria-rowindex',
    'aria-rowspan',
    'aria-selected',
    'aria-setsize',
    'aria-sort',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
    'className',
    'color',
    'height',
    'id',
    'lang',
    'max',
    'media',
    'method',
    'min',
    'name',
    'style',
    /*
 * removed 'type' SVGElementPropKey because we do not currently use any SVG elements
 * that can use it, and it conflicts with the recharts prop 'type'
 * https://github.com/recharts/recharts/pull/3327
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/type
 */ // 'type',
    'target',
    'width',
    'role',
    'tabIndex',
    'accentHeight',
    'accumulate',
    'additive',
    'alignmentBaseline',
    'allowReorder',
    'alphabetic',
    'amplitude',
    'arabicForm',
    'ascent',
    'attributeName',
    'attributeType',
    'autoReverse',
    'azimuth',
    'baseFrequency',
    'baselineShift',
    'baseProfile',
    'bbox',
    'begin',
    'bias',
    'by',
    'calcMode',
    'capHeight',
    'clip',
    'clipPath',
    'clipPathUnits',
    'clipRule',
    'colorInterpolation',
    'colorInterpolationFilters',
    'colorProfile',
    'colorRendering',
    'contentScriptType',
    'contentStyleType',
    'cursor',
    'cx',
    'cy',
    'd',
    'decelerate',
    'descent',
    'diffuseConstant',
    'direction',
    'display',
    'divisor',
    'dominantBaseline',
    'dur',
    'dx',
    'dy',
    'edgeMode',
    'elevation',
    'enableBackground',
    'end',
    'exponent',
    'externalResourcesRequired',
    'fill',
    'fillOpacity',
    'fillRule',
    'filter',
    'filterRes',
    'filterUnits',
    'floodColor',
    'floodOpacity',
    'focusable',
    'fontFamily',
    'fontSize',
    'fontSizeAdjust',
    'fontStretch',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'format',
    'from',
    'fx',
    'fy',
    'g1',
    'g2',
    'glyphName',
    'glyphOrientationHorizontal',
    'glyphOrientationVertical',
    'glyphRef',
    'gradientTransform',
    'gradientUnits',
    'hanging',
    'horizAdvX',
    'horizOriginX',
    'href',
    'ideographic',
    'imageRendering',
    'in2',
    'in',
    'intercept',
    'k1',
    'k2',
    'k3',
    'k4',
    'k',
    'kernelMatrix',
    'kernelUnitLength',
    'kerning',
    'keyPoints',
    'keySplines',
    'keyTimes',
    'lengthAdjust',
    'letterSpacing',
    'lightingColor',
    'limitingConeAngle',
    'local',
    'markerEnd',
    'markerHeight',
    'markerMid',
    'markerStart',
    'markerUnits',
    'markerWidth',
    'mask',
    'maskContentUnits',
    'maskUnits',
    'mathematical',
    'mode',
    'numOctaves',
    'offset',
    'opacity',
    'operator',
    'order',
    'orient',
    'orientation',
    'origin',
    'overflow',
    'overlinePosition',
    'overlineThickness',
    'paintOrder',
    'panose1',
    'pathLength',
    'patternContentUnits',
    'patternTransform',
    'patternUnits',
    'pointerEvents',
    'pointsAtX',
    'pointsAtY',
    'pointsAtZ',
    'preserveAlpha',
    'preserveAspectRatio',
    'primitiveUnits',
    'r',
    'radius',
    'refX',
    'refY',
    'renderingIntent',
    'repeatCount',
    'repeatDur',
    'requiredExtensions',
    'requiredFeatures',
    'restart',
    'result',
    'rotate',
    'rx',
    'ry',
    'seed',
    'shapeRendering',
    'slope',
    'spacing',
    'specularConstant',
    'specularExponent',
    'speed',
    'spreadMethod',
    'startOffset',
    'stdDeviation',
    'stemh',
    'stemv',
    'stitchTiles',
    'stopColor',
    'stopOpacity',
    'strikethroughPosition',
    'strikethroughThickness',
    'string',
    'stroke',
    'strokeDasharray',
    'strokeDashoffset',
    'strokeLinecap',
    'strokeLinejoin',
    'strokeMiterlimit',
    'strokeOpacity',
    'strokeWidth',
    'surfaceScale',
    'systemLanguage',
    'tableValues',
    'targetX',
    'targetY',
    'textAnchor',
    'textDecoration',
    'textLength',
    'textRendering',
    'to',
    'transform',
    'u1',
    'u2',
    'underlinePosition',
    'underlineThickness',
    'unicode',
    'unicodeBidi',
    'unicodeRange',
    'unitsPerEm',
    'vAlphabetic',
    'values',
    'vectorEffect',
    'version',
    'vertAdvY',
    'vertOriginX',
    'vertOriginY',
    'vHanging',
    'vIdeographic',
    'viewTarget',
    'visibility',
    'vMathematical',
    'widths',
    'wordSpacing',
    'writingMode',
    'x1',
    'x2',
    'x',
    'xChannelSelector',
    'xHeight',
    'xlinkActuate',
    'xlinkArcrole',
    'xlinkHref',
    'xlinkRole',
    'xlinkShow',
    'xlinkTitle',
    'xlinkType',
    'xmlBase',
    'xmlLang',
    'xmlns',
    'xmlnsXlink',
    'xmlSpace',
    'y1',
    'y2',
    'y',
    'yChannelSelector',
    'z',
    'zoomAndPan',
    'ref',
    'key',
    'angle'
];
function isSvgElementPropKey(key) {
    if (typeof key !== 'string') {
        return false;
    }
    var allowedSvgKeys = SVGElementPropKeys;
    return allowedSvgKeys.includes(key);
}
function isDataAttribute(key) {
    return typeof key === 'string' && key.startsWith('data-');
}
function svgPropertiesNoEvents(obj) {
    var filteredEntries = Object.entries(obj).filter((_ref)=>{
        var [key] = _ref;
        return isSvgElementPropKey(key) || isDataAttribute(key);
    });
    return Object.fromEntries(filteredEntries);
}
function svgPropertiesNoEventsFromUnknown(input) {
    if (input == null) {
        return null;
    }
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(input) && typeof input.props === 'object' && input.props !== null) {
        var p = input.props;
        return svgPropertiesNoEvents(p);
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
        return svgPropertiesNoEvents(input);
    }
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "svgPropertiesAndEvents",
    ()=>svgPropertiesAndEvents,
    "svgPropertiesAndEventsFromUnknown",
    ()=>svgPropertiesAndEventsFromUnknown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$excludeEventProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/excludeEventProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
;
;
;
function svgPropertiesAndEvents(obj) {
    var filteredEntries = Object.entries(obj).filter((_ref)=>{
        var [key] = _ref;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSvgElementPropKey"])(key) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDataAttribute"])(key) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$excludeEventProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isEventKey"])(key);
    });
    return Object.fromEntries(filteredEntries);
}
function svgPropertiesAndEventsFromUnknown(input) {
    if (input == null) {
        return null;
    }
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(input)) {
        // @ts-expect-error we can't type this better because input can be any React element
        return svgPropertiesAndEvents(input.props);
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
        return svgPropertiesAndEvents(input);
    }
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/useId.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useId",
    ()=>useId,
    "useIdFallback",
    ()=>useIdFallback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var _ref;
;
;
var useIdFallback = ()=>{
    var [id] = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useState({
        "useIdFallback.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uniqueId"])('uid-')
    }["useIdFallback.useState"]);
    return id;
};
var useId = (_ref = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__['useId'.toString()]) !== null && _ref !== void 0 ? _ref : useIdFallback;
}),
"[project]/pwa/node_modules/recharts/es6/util/useUniqueId.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUniqueId",
    ()=>useUniqueId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useId.js [app-client] (ecmascript)");
;
function useUniqueId(prefix, customId) {
    /*
   * We have to call this hook here even if we don't use the result because
   * rules of hooks demand that hooks are never called conditionally.
   */ var generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    // If a custom ID is provided, it always takes precedence.
    if (customId) {
        return customId;
    }
    // Apply the prefix if one was provided.
    return prefix ? "".concat(prefix, "-").concat(generatedId) : generatedId;
} /**
 * The useUniqueId hook returns a unique ID that is either reused from external props or generated internally.
 * Either way the ID is now guaranteed to be present so no more nulls or undefined.
 */ 
}),
"[project]/pwa/node_modules/recharts/es6/util/Events.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BRUSH_SYNC_EVENT",
    ()=>BRUSH_SYNC_EVENT,
    "TOOLTIP_SYNC_EVENT",
    ()=>TOOLTIP_SYNC_EVENT,
    "eventCenter",
    ()=>eventCenter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
;
var eventCenter = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"]();
;
var TOOLTIP_SYNC_EVENT = 'recharts.syncEvent.tooltip';
var BRUSH_SYNC_EVENT = 'recharts.syncEvent.brush';
}),
"[project]/pwa/node_modules/recharts/es6/util/useReportScale.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useReportScale",
    ()=>useReportScale
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/layoutSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)");
;
;
;
;
;
function useReportScale() {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var [ref, setRef] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    var scale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectContainerScale"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useReportScale.useEffect": ()=>{
            if (ref == null) {
                return;
            }
            var rect = ref.getBoundingClientRect();
            var newScale = rect.width / ref.offsetWidth;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(newScale) && newScale !== scale) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setScale"])(newScale));
            }
        }
    }["useReportScale.useEffect"], [
        ref,
        dispatch,
        scale
    ]);
    return setRef;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveDefaultProps",
    ()=>resolveDefaultProps
]);
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
function resolveDefaultProps(realProps, defaultProps) {
    /*
   * To avoid mutating the original `realProps` object passed to the function, create a shallow copy of it.
   * `resolvedProps` will be modified directly with the defaults.
   */ var resolvedProps = _objectSpread({}, realProps);
    /*
   * Since the function guarantees `D extends Partial<T>`, this assignment is safe.
   * It allows TypeScript to work with the well-defined `Partial<T>` type inside the loop,
   * making subsequent type inference (especially for `dp[key]`) much more straightforward for the compiler.
   * This is a key step to improve type safety *without* value assertions later.
   */ var dp = defaultProps;
    /*
   * `Object.keys` doesn't preserve strong key types - it always returns Array<string>.
   * However, due to the `D extends Partial<T>` constraint,
   * we know these keys *must* also be valid keys of `T`.
   * This assertion informs TypeScript of this relationship, avoiding type errors when using `key` to index `acc` (type T).
   *
   * Type assertions are not sound but in this case it's necessary
   * as `Object.keys` does not do what we want it to do.
   */ var keys = Object.keys(defaultProps);
    var withDefaults = keys.reduce((acc, key)=>{
        if (acc[key] === undefined && dp[key] !== undefined) {
            acc[key] = dp[key];
        }
        return acc;
    }, resolvedProps);
    /*
   * And again type assertions are not safe but here we have done the runtime work
   * so let's bypass the lack of static type safety and tell the compiler what happened.
   */ return withDefaults;
} /**
 * Helper type to extract the keys of T that are required.
 * It iterates through each key K in T. If Pick<T, K> cannot be assigned an empty object {},
 * it means K is required, so we keep K; otherwise, we discard it (never).
 * [keyof T] at the end creates a union of the kept keys.
 */  /**
 * Helper type to extract the keys of T that are optional.
 * It iterates through each key K in T. If Pick<T, K> can be assigned an empty object {},
 * it means K is optional (or potentially missing), so we keep K; otherwise, we discard it (never).
 * [keyof T] at the end creates a union of the kept keys.
 */  /**
 * Helper type to ensure keys of D exist in T.
 * For each key K in D, if K is also a key of T, keep the type D[K].
 * If K is NOT a key of T, map it to type `never`.
 * An object cannot have a property of type `never`, effectively disallowing extra keys.
 */  /**
 * This type will take a source type `Props` and a default type `Defaults` and will return a new type
 * where all properties that are optional in `Props` but required in `Defaults` are made required in the result.
 * Properties that are required in `Props` and optional in `Defaults` will remain required.
 * Properties that are optional in both `Props` and `Defaults` will remain optional.
 *
 * This is useful for creating a type that represents the resolved props of a component with default props.
 */ 
}),
"[project]/pwa/node_modules/recharts/es6/util/LRUCache.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LRUCache",
    ()=>LRUCache
]);
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
class LRUCache {
    constructor(maxSize){
        _defineProperty(this, "cache", new Map());
        this.maxSize = maxSize;
    }
    get(key) {
        var value = this.cache.get(key);
        if (value !== undefined) {
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            var firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
}),
"[project]/pwa/node_modules/recharts/es6/util/DOMUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearStringCache",
    ()=>clearStringCache,
    "configureTextMeasurement",
    ()=>configureTextMeasurement,
    "getStringCacheStats",
    ()=>getStringCacheStats,
    "getStringSize",
    ()=>getStringSize,
    "getTextMeasurementConfig",
    ()=>getTextMeasurementConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LRUCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/LRUCache.js [app-client] (ecmascript)");
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
;
;
var defaultConfig = {
    cacheSize: 2000,
    enableCache: true
};
var currentConfig = _objectSpread({}, defaultConfig);
var stringCache = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LRUCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LRUCache"](currentConfig.cacheSize);
var SPAN_STYLE = {
    position: 'absolute',
    top: '-20000px',
    left: 0,
    padding: 0,
    margin: 0,
    border: 'none',
    whiteSpace: 'pre'
};
var MEASUREMENT_SPAN_ID = 'recharts_measurement_span';
function createCacheKey(text, style) {
    // Simple string concatenation for better performance than JSON.stringify
    var fontSize = style.fontSize || '';
    var fontFamily = style.fontFamily || '';
    var fontWeight = style.fontWeight || '';
    var fontStyle = style.fontStyle || '';
    var letterSpacing = style.letterSpacing || '';
    var textTransform = style.textTransform || '';
    return "".concat(text, "|").concat(fontSize, "|").concat(fontFamily, "|").concat(fontWeight, "|").concat(fontStyle, "|").concat(letterSpacing, "|").concat(textTransform);
}
/**
 * Measure text using DOM (accurate but slower)
 * @param text - The text to measure
 * @param style - CSS style properties to apply
 * @returns The size of the text
 */ var measureTextWithDOM = (text, style)=>{
    try {
        var measurementSpan = document.getElementById(MEASUREMENT_SPAN_ID);
        if (!measurementSpan) {
            measurementSpan = document.createElement('span');
            measurementSpan.setAttribute('id', MEASUREMENT_SPAN_ID);
            measurementSpan.setAttribute('aria-hidden', 'true');
            document.body.appendChild(measurementSpan);
        }
        // Apply styles directly without unnecessary object creation
        Object.assign(measurementSpan.style, SPAN_STYLE, style);
        measurementSpan.textContent = "".concat(text);
        var rect = measurementSpan.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    } catch (_unused) {
        return {
            width: 0,
            height: 0
        };
    }
};
var getStringSize = function getStringSize(text) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (text === undefined || text === null || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Global"].isSsr) {
        return {
            width: 0,
            height: 0
        };
    }
    // If caching is disabled, measure directly
    if (!currentConfig.enableCache) {
        return measureTextWithDOM(text, style);
    }
    var cacheKey = createCacheKey(text, style);
    var cachedResult = stringCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }
    // Measure using DOM
    var result = measureTextWithDOM(text, style);
    // Store in LRU cache
    stringCache.set(cacheKey, result);
    return result;
};
var configureTextMeasurement = (config)=>{
    var newConfig = _objectSpread(_objectSpread({}, currentConfig), config);
    if (newConfig.cacheSize !== currentConfig.cacheSize) {
        stringCache = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LRUCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LRUCache"](newConfig.cacheSize);
    }
    currentConfig = newConfig;
};
var getTextMeasurementConfig = ()=>_objectSpread({}, currentConfig);
var clearStringCache = ()=>{
    stringCache.clear();
};
var getStringCacheStats = ()=>({
        size: stringCache.size(),
        maxSize: currentConfig.cacheSize
    });
}),
"[project]/pwa/node_modules/recharts/es6/util/ReduceCSSCalc.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reduceCSSCalc",
    ()=>reduceCSSCalc,
    "safeEvaluateExpression",
    ()=>safeEvaluateExpression
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
var MULTIPLY_OR_DIVIDE_REGEX = /(-?\d+(?:\.\d+)?[a-zA-Z%]*)([*/])(-?\d+(?:\.\d+)?[a-zA-Z%]*)/;
var ADD_OR_SUBTRACT_REGEX = /(-?\d+(?:\.\d+)?[a-zA-Z%]*)([+-])(-?\d+(?:\.\d+)?[a-zA-Z%]*)/;
var CSS_LENGTH_UNIT_REGEX = /^px|cm|vh|vw|em|rem|%|mm|in|pt|pc|ex|ch|vmin|vmax|Q$/;
var NUM_SPLIT_REGEX = /(-?\d+(?:\.\d+)?)([a-zA-Z%]+)?/;
var CONVERSION_RATES = {
    cm: 96 / 2.54,
    mm: 96 / 25.4,
    pt: 96 / 72,
    pc: 96 / 6,
    in: 96,
    Q: 96 / (2.54 * 40),
    px: 1
};
var FIXED_CSS_LENGTH_UNITS = Object.keys(CONVERSION_RATES);
var STR_NAN = 'NaN';
function convertToPx(value, unit) {
    return value * CONVERSION_RATES[unit];
}
class DecimalCSS {
    static parse(str) {
        var _NUM_SPLIT_REGEX$exec;
        var [, numStr, unit] = (_NUM_SPLIT_REGEX$exec = NUM_SPLIT_REGEX.exec(str)) !== null && _NUM_SPLIT_REGEX$exec !== void 0 ? _NUM_SPLIT_REGEX$exec : [];
        return new DecimalCSS(parseFloat(numStr), unit !== null && unit !== void 0 ? unit : '');
    }
    constructor(num, unit){
        this.num = num;
        this.unit = unit;
        this.num = num;
        this.unit = unit;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(num)) {
            this.unit = '';
        }
        if (unit !== '' && !CSS_LENGTH_UNIT_REGEX.test(unit)) {
            this.num = NaN;
            this.unit = '';
        }
        if (FIXED_CSS_LENGTH_UNITS.includes(unit)) {
            this.num = convertToPx(num, unit);
            this.unit = 'px';
        }
    }
    add(other) {
        if (this.unit !== other.unit) {
            return new DecimalCSS(NaN, '');
        }
        return new DecimalCSS(this.num + other.num, this.unit);
    }
    subtract(other) {
        if (this.unit !== other.unit) {
            return new DecimalCSS(NaN, '');
        }
        return new DecimalCSS(this.num - other.num, this.unit);
    }
    multiply(other) {
        if (this.unit !== '' && other.unit !== '' && this.unit !== other.unit) {
            return new DecimalCSS(NaN, '');
        }
        return new DecimalCSS(this.num * other.num, this.unit || other.unit);
    }
    divide(other) {
        if (this.unit !== '' && other.unit !== '' && this.unit !== other.unit) {
            return new DecimalCSS(NaN, '');
        }
        return new DecimalCSS(this.num / other.num, this.unit || other.unit);
    }
    toString() {
        return "".concat(this.num).concat(this.unit);
    }
    isNaN() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(this.num);
    }
}
function calculateArithmetic(expr) {
    if (expr.includes(STR_NAN)) {
        return STR_NAN;
    }
    var newExpr = expr;
    while(newExpr.includes('*') || newExpr.includes('/')){
        var _MULTIPLY_OR_DIVIDE_R;
        var [, leftOperand, operator, rightOperand] = (_MULTIPLY_OR_DIVIDE_R = MULTIPLY_OR_DIVIDE_REGEX.exec(newExpr)) !== null && _MULTIPLY_OR_DIVIDE_R !== void 0 ? _MULTIPLY_OR_DIVIDE_R : [];
        var lTs = DecimalCSS.parse(leftOperand !== null && leftOperand !== void 0 ? leftOperand : '');
        var rTs = DecimalCSS.parse(rightOperand !== null && rightOperand !== void 0 ? rightOperand : '');
        var result = operator === '*' ? lTs.multiply(rTs) : lTs.divide(rTs);
        if (result.isNaN()) {
            return STR_NAN;
        }
        newExpr = newExpr.replace(MULTIPLY_OR_DIVIDE_REGEX, result.toString());
    }
    while(newExpr.includes('+') || /.-\d+(?:\.\d+)?/.test(newExpr)){
        var _ADD_OR_SUBTRACT_REGE;
        var [, _leftOperand, _operator, _rightOperand] = (_ADD_OR_SUBTRACT_REGE = ADD_OR_SUBTRACT_REGEX.exec(newExpr)) !== null && _ADD_OR_SUBTRACT_REGE !== void 0 ? _ADD_OR_SUBTRACT_REGE : [];
        var _lTs = DecimalCSS.parse(_leftOperand !== null && _leftOperand !== void 0 ? _leftOperand : '');
        var _rTs = DecimalCSS.parse(_rightOperand !== null && _rightOperand !== void 0 ? _rightOperand : '');
        var _result = _operator === '+' ? _lTs.add(_rTs) : _lTs.subtract(_rTs);
        if (_result.isNaN()) {
            return STR_NAN;
        }
        newExpr = newExpr.replace(ADD_OR_SUBTRACT_REGEX, _result.toString());
    }
    return newExpr;
}
var PARENTHESES_REGEX = /\(([^()]*)\)/;
function calculateParentheses(expr) {
    var newExpr = expr;
    var match;
    // eslint-disable-next-line no-cond-assign
    while((match = PARENTHESES_REGEX.exec(newExpr)) != null){
        var [, parentheticalExpression] = match;
        newExpr = newExpr.replace(PARENTHESES_REGEX, calculateArithmetic(parentheticalExpression));
    }
    return newExpr;
}
function evaluateExpression(expression) {
    var newExpr = expression.replace(/\s+/g, '');
    newExpr = calculateParentheses(newExpr);
    newExpr = calculateArithmetic(newExpr);
    return newExpr;
}
function safeEvaluateExpression(expression) {
    try {
        return evaluateExpression(expression);
    } catch (_unused) {
        return STR_NAN;
    }
}
function reduceCSSCalc(expression) {
    var result = safeEvaluateExpression(expression.slice(5, -1));
    if (result === STR_NAN) {
        return '';
    }
    return result;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/types.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "adaptEventHandlers",
    ()=>adaptEventHandlers,
    "adaptEventsOfChild",
    ()=>adaptEventsOfChild,
    "isNonEmptyArray",
    ()=>isNonEmptyArray,
    "isPolarCoordinate",
    ()=>isPolarCoordinate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$excludeEventProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/excludeEventProps.js [app-client] (ecmascript)");
;
;
var isPolarCoordinate = (c)=>{
    return 'radius' in c && 'startAngle' in c && 'endAngle' in c;
};
var adaptEventHandlers = (props, newHandler)=>{
    if (!props || typeof props === 'function' || typeof props === 'boolean') {
        return null;
    }
    var inputProps = props;
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(props)) {
        inputProps = props.props;
    }
    if (typeof inputProps !== 'object' && typeof inputProps !== 'function') {
        return null;
    }
    var out = {};
    Object.keys(inputProps).forEach((key)=>{
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$excludeEventProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isEventKey"])(key)) {
            out[key] = newHandler || ((e)=>inputProps[key](inputProps, e));
        }
    });
    return out;
};
var getEventHandlerOfChild = (originalHandler, data, index)=>(e)=>{
        originalHandler(data, index, e);
        return null;
    };
var adaptEventsOfChild = (props, data, index)=>{
    if (props === null || typeof props !== 'object' && typeof props !== 'function') {
        return null;
    }
    var out = null;
    Object.keys(props).forEach((key)=>{
        var item = props[key];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$excludeEventProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isEventKey"])(key) && typeof item === 'function') {
            if (!out) out = {};
            out[key] = getEventHandlerOfChild(item, data, index);
        }
    });
    return out;
};
var isNonEmptyArray = (arr)=>{
    return Array.isArray(arr) && arr.length > 0;
};
}),
"[project]/pwa/node_modules/recharts/es6/util/ReactUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SCALE_TYPES",
    ()=>SCALE_TYPES,
    "findAllByType",
    ()=>findAllByType,
    "getDisplayName",
    ()=>getDisplayName,
    "isClipDot",
    ()=>isClipDot,
    "toArray",
    ()=>toArray
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/get.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$react$2d$is$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/react-is/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
;
;
;
var SCALE_TYPES = [
    'auto',
    'linear',
    'pow',
    'sqrt',
    'log',
    'identity',
    'time',
    'band',
    'point',
    'ordinal',
    'quantile',
    'quantize',
    'utc',
    'sequential',
    'threshold'
];
var getDisplayName = (Comp)=>{
    if (typeof Comp === 'string') {
        return Comp;
    }
    if (!Comp) {
        return '';
    }
    return Comp.displayName || Comp.name || 'Component';
};
// `toArray` gets called multiple times during the render
// so we can memoize last invocation (since reference to `children` is the same)
var lastChildren = null;
var lastResult = null;
var toArray = (children)=>{
    if (children === lastChildren && Array.isArray(lastResult)) {
        return lastResult;
    }
    var result = [];
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].forEach(children, (child)=>{
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(child)) return;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$react$2d$is$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFragment"])(child)) {
            result = result.concat(toArray(child.props.children));
        } else {
            // @ts-expect-error this could still be Iterable<ReactNode> and TS does not like that
            result.push(child);
        }
    });
    lastResult = result;
    lastChildren = children;
    return result;
};
function findAllByType(children, type) {
    var result = [];
    var types = [];
    if (Array.isArray(type)) {
        types = type.map((t)=>getDisplayName(t));
    } else {
        types = [
            getDisplayName(type)
        ];
    }
    toArray(children).forEach((child)=>{
        // @ts-expect-error toArray and lodash.get are not compatible. Let's get rid of the whole findAllByType function
        var childType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(child, 'type.displayName') || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(child, 'type.name');
        if (childType && types.indexOf(childType) !== -1) {
            result.push(child);
        }
    });
    return result;
}
var isClipDot = (dot)=>{
    if (dot && typeof dot === 'object' && 'clipDot' in dot) {
        return Boolean(dot.clipDot);
    }
    return true;
};
}),
"[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAnimationId",
    ()=>useAnimationId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
;
function useAnimationId(input) {
    var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'animation-';
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uniqueId"])(prefix));
    var prevProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(input);
    if (prevProps.current !== input) {
        animationId.current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uniqueId"])(prefix);
        prevProps.current = input;
    }
    return animationId.current;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/getRadiusAndStrokeWidthFromDot.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRadiusAndStrokeWidthFromDot",
    ()=>getRadiusAndStrokeWidthFromDot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
;
function getRadiusAndStrokeWidthFromDot(dot) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(dot);
    var defaultR = 3;
    var defaultStrokeWidth = 2;
    if (props != null) {
        var { r, strokeWidth } = props;
        var realR = Number(r);
        var realStrokeWidth = Number(strokeWidth);
        if (Number.isNaN(realR) || realR < 0) {
            realR = defaultR;
        }
        if (Number.isNaN(realStrokeWidth) || realStrokeWidth < 0) {
            realStrokeWidth = defaultStrokeWidth;
        }
        return {
            r: realR,
            strokeWidth: realStrokeWidth
        };
    }
    return {
        r: defaultR,
        strokeWidth: defaultStrokeWidth
    };
}
}),
"[project]/pwa/node_modules/recharts/es6/util/ActiveShapeUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Shape",
    ()=>Shape,
    "getPropsFromShapeOption",
    ()=>getPropsFromShapeOption
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$isPlainObject$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/isPlainObject.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Rectangle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Rectangle.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Trapezoid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Trapezoid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Sector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Sector.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Symbols.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Curve.js [app-client] (ecmascript)");
var _excluded = [
    "option",
    "shapeType",
    "propTransformer",
    "activeClassName",
    "isActive"
];
function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o, r, i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
        var n = Object.getOwnPropertySymbols(e);
        for(r = 0; r < n.length; r++)o = n[r], -1 === t.indexOf(o) && ({}).propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
}
function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for(var n in r)if (({}).hasOwnProperty.call(r, n)) {
        if (-1 !== e.indexOf(n)) continue;
        t[n] = r[n];
    }
    return t;
}
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
;
;
;
;
;
;
;
;
;
/**
 * This is an abstraction for rendering a user defined prop for a customized shape in several forms.
 *
 * <Shape /> is the root and will handle taking in:
 *  - an object of svg properties
 *  - a boolean
 *  - a render prop(inline function that returns jsx)
 *  - a React element
 *
 * <ShapeSelector /> is a subcomponent of <Shape /> and used to match a component
 * to the value of props.shapeType that is passed to the root.
 *
 */ function defaultPropTransformer(option, props) {
    return _objectSpread(_objectSpread({}, props), option);
}
function isSymbolsProps(shapeType, _elementProps) {
    return shapeType === 'symbols';
}
function ShapeSelector(_ref) {
    var { shapeType, elementProps } = _ref;
    switch(shapeType){
        case 'rectangle':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Rectangle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"], elementProps);
        case 'trapezoid':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Trapezoid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trapezoid"], elementProps);
        case 'sector':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Sector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sector"], elementProps);
        case 'symbols':
            if (isSymbolsProps(shapeType, elementProps)) {
                return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Symbols"], elementProps);
            }
            break;
        case 'curve':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Curve"], elementProps);
        default:
            return null;
    }
}
function getPropsFromShapeOption(option) {
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(option)) {
        return option.props;
    }
    return option;
}
function Shape(_ref2) {
    var { option, shapeType, propTransformer = defaultPropTransformer, activeClassName = 'recharts-active-shape', isActive } = _ref2, props = _objectWithoutProperties(_ref2, _excluded);
    var shape;
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(option)) {
        // @ts-expect-error we can't know the type of cloned element props
        shape = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"])(option, _objectSpread(_objectSpread({}, props), getPropsFromShapeOption(option)));
    } else if (typeof option === 'function') {
        shape = option(props);
    } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$isPlainObject$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(option) && typeof option !== 'boolean') {
        var nextProps = propTransformer(option, props);
        shape = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ShapeSelector, {
            shapeType: shapeType,
            elementProps: nextProps
        });
    } else {
        var elementProps = props;
        shape = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ShapeSelector, {
            shapeType: shapeType,
            elementProps: elementProps
        });
    }
    if (isActive) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
            className: activeClassName
        }, shape);
    }
    return shape;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/BarUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BarRectangle",
    ()=>BarRectangle,
    "minPointSizeCallback",
    ()=>minPointSizeCallback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/pwa/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$tiny$2d$invariant$2f$dist$2f$esm$2f$tiny$2d$invariant$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/tiny-invariant/dist/esm/tiny-invariant.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ActiveShapeUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var _excluded = [
    "x",
    "y"
];
function _extends() {
    return _extends = ("TURBOPACK compile-time truthy", 1) ? Object.assign.bind() : "TURBOPACK unreachable", _extends.apply(null, arguments);
}
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o, r, i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
        var n = Object.getOwnPropertySymbols(e);
        for(r = 0; r < n.length; r++)o = n[r], -1 === t.indexOf(o) && ({}).propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
}
function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for(var n in r)if (({}).hasOwnProperty.call(r, n)) {
        if (-1 !== e.indexOf(n)) continue;
        t[n] = r[n];
    }
    return t;
}
;
;
;
;
// Rectangle props is expecting x, y, height, width as numbers, name as a string, and radius as a custom type
// When props are being spread in from a user defined component in Bar,
// the prop types of an SVGElement have these typed as something else.
// This function will return the passed in props
// along with x, y, height as numbers, name as a string, and radius as number | [number, number, number, number]
function typeguardBarRectangleProps(_ref, props) {
    var { x: xProp, y: yProp } = _ref, option = _objectWithoutProperties(_ref, _excluded);
    var xValue = "".concat(xProp);
    var x = parseInt(xValue, 10);
    var yValue = "".concat(yProp);
    var y = parseInt(yValue, 10);
    var heightValue = "".concat(props.height || option.height);
    var height = parseInt(heightValue, 10);
    var widthValue = "".concat(props.width || option.width);
    var width = parseInt(widthValue, 10);
    return _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({}, props), option), x ? {
        x
    } : {}), y ? {
        y
    } : {}), {}, {
        height,
        width,
        name: props.name,
        radius: props.radius
    });
}
function BarRectangle(props) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Shape"], _extends({
        shapeType: "rectangle",
        propTransformer: typeguardBarRectangleProps,
        activeClassName: "recharts-active-bar"
    }, props));
}
var minPointSizeCallback = function minPointSizeCallback(minPointSize) {
    var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return (value, index)=>{
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(minPointSize)) return minPointSize;
        var isValueNumberOrNil = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(value) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(value);
        if (isValueNumberOrNil) {
            return minPointSize(value, index);
        }
        !isValueNumberOrNil ? ("TURBOPACK compile-time truthy", 1) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$tiny$2d$invariant$2f$dist$2f$esm$2f$tiny$2d$invariant$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(false, "minPointSize callback function received a value with type of ".concat(typeof value, ". Currently only numbers or null/undefined are supported.")) : "TURBOPACK unreachable" : void 0;
        return defaultValue;
    };
};
}),
"[project]/pwa/node_modules/recharts/es6/util/ScatterUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScatterSymbol",
    ()=>ScatterSymbol
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Symbols.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ActiveShapeUtils.js [app-client] (ecmascript)");
var _excluded = [
    "option",
    "isActive"
];
function _extends() {
    return _extends = ("TURBOPACK compile-time truthy", 1) ? Object.assign.bind() : "TURBOPACK unreachable", _extends.apply(null, arguments);
}
function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o, r, i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
        var n = Object.getOwnPropertySymbols(e);
        for(r = 0; r < n.length; r++)o = n[r], -1 === t.indexOf(o) && ({}).propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
}
function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for(var n in r)if (({}).hasOwnProperty.call(r, n)) {
        if (-1 !== e.indexOf(n)) continue;
        t[n] = r[n];
    }
    return t;
}
;
;
;
function ScatterSymbol(_ref) {
    var { option, isActive } = _ref, props = _objectWithoutProperties(_ref, _excluded);
    if (typeof option === 'string') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Shape"], _extends({
            option: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Symbols"], _extends({
                type: option
            }, props)),
            isActive: isActive,
            shapeType: "symbols"
        }, props));
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Shape"], _extends({
        option: option,
        isActive: isActive,
        shapeType: "symbols"
    }, props));
}
}),
"[project]/pwa/node_modules/recharts/es6/util/ShallowEqual.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "shallowEqual",
    ()=>shallowEqual
]);
function shallowEqual(a, b) {
    /* eslint-disable no-restricted-syntax */ for(var key in a){
        if (({}).hasOwnProperty.call(a, key) && (!({}).hasOwnProperty.call(b, key) || a[key] !== b[key])) {
            return false;
        }
    }
    for(var _key in b){
        if (({}).hasOwnProperty.call(b, _key) && !({}).hasOwnProperty.call(a, _key)) {
            return false;
        }
    }
    return true;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/CartesianUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScaleHelper",
    ()=>ScaleHelper,
    "createLabeledScales",
    ()=>createLabeledScales,
    "getAngledRectangleWidth",
    ()=>getAngledRectangleWidth,
    "normalizeAngle",
    ()=>normalizeAngle,
    "rectWithCoords",
    ()=>rectWithCoords,
    "rectWithPoints",
    ()=>rectWithPoints
]);
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
var rectWithPoints = (_ref, _ref2)=>{
    var { x: x1, y: y1 } = _ref;
    var { x: x2, y: y2 } = _ref2;
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
    };
};
var rectWithCoords = (_ref3)=>{
    var { x1, y1, x2, y2 } = _ref3;
    return rectWithPoints({
        x: x1,
        y: y1
    }, {
        x: x2,
        y: y2
    });
};
class ScaleHelper {
    static create(obj) {
        return new ScaleHelper(obj);
    }
    constructor(scale){
        this.scale = scale;
    }
    get domain() {
        return this.scale.domain;
    }
    get range() {
        return this.scale.range;
    }
    get rangeMin() {
        return this.range()[0];
    }
    get rangeMax() {
        return this.range()[1];
    }
    get bandwidth() {
        return this.scale.bandwidth;
    }
    apply(value) {
        var { bandAware, position } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (value === undefined) {
            return undefined;
        }
        if (position) {
            switch(position){
                case 'start':
                    {
                        return this.scale(value);
                    }
                case 'middle':
                    {
                        var offset = this.bandwidth ? this.bandwidth() / 2 : 0;
                        return this.scale(value) + offset;
                    }
                case 'end':
                    {
                        var _offset = this.bandwidth ? this.bandwidth() : 0;
                        return this.scale(value) + _offset;
                    }
                default:
                    {
                        return this.scale(value);
                    }
            }
        }
        if (bandAware) {
            var _offset2 = this.bandwidth ? this.bandwidth() / 2 : 0;
            return this.scale(value) + _offset2;
        }
        return this.scale(value);
    }
    isInRange(value) {
        var range = this.range();
        var first = range[0];
        var last = range[range.length - 1];
        return first <= last ? value >= first && value <= last : value >= last && value <= first;
    }
}
_defineProperty(ScaleHelper, "EPS", 1e-4);
var createLabeledScales = (options)=>{
    var scales = Object.keys(options).reduce((res, key)=>_objectSpread(_objectSpread({}, res), {}, {
            [key]: ScaleHelper.create(options[key])
        }), {});
    return _objectSpread(_objectSpread({}, scales), {}, {
        apply (coord) {
            var { bandAware, position } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            return Object.fromEntries(Object.entries(coord).map((_ref4)=>{
                var [label, value] = _ref4;
                return [
                    label,
                    scales[label].apply(value, {
                        bandAware,
                        position
                    })
                ];
            }));
        },
        isInRange (coord) {
            return Object.keys(coord).every((label)=>scales[label].isInRange(coord[label]));
        }
    });
};
function normalizeAngle(angle) {
    return (angle % 180 + 180) % 180;
}
var getAngledRectangleWidth = function getAngledRectangleWidth(_ref5) {
    var { width, height } = _ref5;
    var angle = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    // Ensure angle is >= 0 && < 180
    var normalizedAngle = normalizeAngle(angle);
    var angleRadians = normalizedAngle * Math.PI / 180;
    /* Depending on the height and width of the rectangle, we may need to use different formulas to calculate the angled
   * width. This threshold defines when each formula should kick in. */ var angleThreshold = Math.atan(height / width);
    var angledWidth = angleRadians > angleThreshold && angleRadians < Math.PI - angleThreshold ? height / Math.sin(angleRadians) : width / Math.cos(angleRadians);
    return Math.abs(angledWidth);
};
}),
"[project]/pwa/node_modules/recharts/es6/util/getEveryNthWithCondition.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Given an array and a number N, return a new array which contains every nTh
 * element of the input array. For n below 1, an empty array is returned.
 * For n equal to 1, the input array is returned as is.
 * For n greater than the length of the array, an array containing the first element
 * and every nTh element after that (if any) is returned.
 *
 * @param array An input array.
 * @param n A number specifying which elements to take.
 * @returns The result array of the same type as the input array.
 */ __turbopack_context__.s([
    "getEveryNthWithCondition",
    ()=>getEveryNthWithCondition
]);
function getEveryNthWithCondition(array, n) {
    if (n < 1) {
        return [];
    }
    if (n === 1) {
        return array;
    }
    var result = [];
    for(var i = 0; i < array.length; i += n){
        result.push(array[i]);
    }
    return result;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/TickUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAngledTickWidth",
    ()=>getAngledTickWidth,
    "getNumberIntervalTicks",
    ()=>getNumberIntervalTicks,
    "getTickBoundaries",
    ()=>getTickBoundaries,
    "isVisible",
    ()=>isVisible
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$CartesianUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/CartesianUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getEveryNthWithCondition$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getEveryNthWithCondition.js [app-client] (ecmascript)");
;
;
function getAngledTickWidth(contentSize, unitSize, angle) {
    var size = {
        width: contentSize.width + unitSize.width,
        height: contentSize.height + unitSize.height
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$CartesianUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAngledRectangleWidth"])(size, angle);
}
function getTickBoundaries(viewBox, sign, sizeKey) {
    var isWidth = sizeKey === 'width';
    var { x, y, width, height } = viewBox;
    if (sign === 1) {
        return {
            start: isWidth ? x : y,
            end: isWidth ? x + width : y + height
        };
    }
    return {
        start: isWidth ? x + width : y + height,
        end: isWidth ? x : y
    };
}
function isVisible(sign, tickPosition, getSize, start, end) {
    /* Since getSize() is expensive (it reads the ticks' size from the DOM), we do this check first to avoid calculating
   * the tick's size. */ if (sign * tickPosition < sign * start || sign * tickPosition > sign * end) {
        return false;
    }
    var size = getSize();
    return sign * (tickPosition - sign * size / 2 - start) >= 0 && sign * (tickPosition + sign * size / 2 - end) <= 0;
}
function getNumberIntervalTicks(ticks, interval) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getEveryNthWithCondition$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEveryNthWithCondition"])(ticks, interval + 1);
}
}),
"[project]/pwa/node_modules/recharts/es6/util/YAxisUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Calculates the width of the Y-axis based on the tick labels and the axis label.
 * @param params - The parameters object.
 * @param [params.ticks] - An array-like object of tick elements, each with a `getBoundingClientRect` method.
 * @param [params.label] - The axis label element, with a `getBoundingClientRect` method.
 * @param [params.labelGapWithTick=5] - The gap between the label and the tick.
 * @param [params.tickSize=0] - The length of the tick line.
 * @param [params.tickMargin=0] - The margin between the tick line and the tick text.
 * @returns The calculated width of the Y-axis.
 */ __turbopack_context__.s([
    "getCalculatedYAxisWidth",
    ()=>getCalculatedYAxisWidth
]);
var getCalculatedYAxisWidth = (_ref)=>{
    var { ticks, label, labelGapWithTick = 5, // Default gap between label and tick
    tickSize = 0, tickMargin = 0 } = _ref;
    // find the max width of the tick labels
    var maxTickWidth = 0;
    if (ticks) {
        Array.from(ticks).forEach((tickNode)=>{
            if (tickNode) {
                var bbox = tickNode.getBoundingClientRect();
                if (bbox.width > maxTickWidth) {
                    maxTickWidth = bbox.width;
                }
            }
        });
        // calculate width of the axis label
        var labelWidth = label ? label.getBoundingClientRect().width : 0;
        var tickWidth = tickSize + tickMargin;
        // calculate the updated width of the y-axis
        var updatedYAxisWidth = maxTickWidth + tickWidth + labelWidth + (label ? labelGapWithTick : 0);
        return Math.round(updatedYAxisWidth);
    }
    return 0;
};
}),
"[project]/pwa/node_modules/recharts/es6/util/tooltip/translate.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTooltipCSSClassName",
    ()=>getTooltipCSSClassName,
    "getTooltipTranslate",
    ()=>getTooltipTranslate,
    "getTooltipTranslateXY",
    ()=>getTooltipTranslateXY,
    "getTransformStyle",
    ()=>getTransformStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
;
var CSS_CLASS_PREFIX = 'recharts-tooltip-wrapper';
var TOOLTIP_HIDDEN = {
    visibility: 'hidden'
};
function getTooltipCSSClassName(_ref) {
    var { coordinate, translateX, translateY } = _ref;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(CSS_CLASS_PREFIX, {
        ["".concat(CSS_CLASS_PREFIX, "-right")]: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(translateX) && coordinate && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(coordinate.x) && translateX >= coordinate.x,
        ["".concat(CSS_CLASS_PREFIX, "-left")]: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(translateX) && coordinate && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(coordinate.x) && translateX < coordinate.x,
        ["".concat(CSS_CLASS_PREFIX, "-bottom")]: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(translateY) && coordinate && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(coordinate.y) && translateY >= coordinate.y,
        ["".concat(CSS_CLASS_PREFIX, "-top")]: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(translateY) && coordinate && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(coordinate.y) && translateY < coordinate.y
    });
}
function getTooltipTranslateXY(_ref2) {
    var { allowEscapeViewBox, coordinate, key, offsetTopLeft, position, reverseDirection, tooltipDimension, viewBox, viewBoxDimension } = _ref2;
    if (position && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(position[key])) {
        return position[key];
    }
    var negative = coordinate[key] - tooltipDimension - (offsetTopLeft > 0 ? offsetTopLeft : 0);
    var positive = coordinate[key] + offsetTopLeft;
    if (allowEscapeViewBox[key]) {
        return reverseDirection[key] ? negative : positive;
    }
    var viewBoxKey = viewBox[key];
    if (viewBoxKey == null) {
        return 0;
    }
    if (reverseDirection[key]) {
        var _tooltipBoundary = negative;
        var _viewBoxBoundary = viewBoxKey;
        if (_tooltipBoundary < _viewBoxBoundary) {
            return Math.max(positive, viewBoxKey);
        }
        return Math.max(negative, viewBoxKey);
    }
    if (viewBoxDimension == null) {
        return 0;
    }
    var tooltipBoundary = positive + tooltipDimension;
    var viewBoxBoundary = viewBoxKey + viewBoxDimension;
    if (tooltipBoundary > viewBoxBoundary) {
        return Math.max(negative, viewBoxKey);
    }
    return Math.max(positive, viewBoxKey);
}
function getTransformStyle(_ref3) {
    var { translateX, translateY, useTranslate3d } = _ref3;
    return {
        transform: useTranslate3d ? "translate3d(".concat(translateX, "px, ").concat(translateY, "px, 0)") : "translate(".concat(translateX, "px, ").concat(translateY, "px)")
    };
}
function getTooltipTranslate(_ref4) {
    var { allowEscapeViewBox, coordinate, offsetTopLeft, position, reverseDirection, tooltipBox, useTranslate3d, viewBox } = _ref4;
    var cssProperties, translateX, translateY;
    if (tooltipBox.height > 0 && tooltipBox.width > 0 && coordinate) {
        translateX = getTooltipTranslateXY({
            allowEscapeViewBox,
            coordinate,
            key: 'x',
            offsetTopLeft,
            position,
            reverseDirection,
            tooltipDimension: tooltipBox.width,
            viewBox,
            viewBoxDimension: viewBox.width
        });
        translateY = getTooltipTranslateXY({
            allowEscapeViewBox,
            coordinate,
            key: 'y',
            offsetTopLeft,
            position,
            reverseDirection,
            tooltipDimension: tooltipBox.height,
            viewBox,
            viewBoxDimension: viewBox.height
        });
        cssProperties = getTransformStyle({
            translateX,
            translateY,
            useTranslate3d
        });
    } else {
        cssProperties = TOOLTIP_HIDDEN;
    }
    return {
        cssProperties,
        cssClasses: getTooltipCSSClassName({
            translateX,
            translateY,
            coordinate
        })
    };
}
}),
"[project]/pwa/node_modules/recharts/es6/util/payload/getUniqPayload.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUniqPayload",
    ()=>getUniqPayload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$uniqBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/uniqBy.js [app-client] (ecmascript)");
;
function getUniqPayload(payload, option, defaultUniqBy) {
    if (option === true) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$uniqBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(payload, defaultUniqBy);
    }
    if (typeof option === 'function') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$uniqBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(payload, option);
    }
    return payload;
}
}),
"[project]/pwa/node_modules/recharts/es6/util/useElementOffset.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useElementOffset",
    ()=>useElementOffset
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var EPS = 1;
function useElementOffset() {
    var extraDependencies = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var [lastBoundingBox, setLastBoundingBox] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        height: 0,
        left: 0,
        top: 0,
        width: 0
    });
    var updateBoundingBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useElementOffset.useCallback[updateBoundingBox]": (node)=>{
            if (node != null) {
                var rect = node.getBoundingClientRect();
                var box = {
                    height: rect.height,
                    left: rect.left,
                    top: rect.top,
                    width: rect.width
                };
                if (Math.abs(box.height - lastBoundingBox.height) > EPS || Math.abs(box.left - lastBoundingBox.left) > EPS || Math.abs(box.top - lastBoundingBox.top) > EPS || Math.abs(box.width - lastBoundingBox.width) > EPS) {
                    setLastBoundingBox({
                        height: box.height,
                        left: box.left,
                        top: box.top,
                        width: box.width
                    });
                }
            }
        }
    }["useElementOffset.useCallback[updateBoundingBox]"], // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        lastBoundingBox.width,
        lastBoundingBox.height,
        lastBoundingBox.top,
        lastBoundingBox.left,
        ...extraDependencies
    ]);
    return [
        lastBoundingBox,
        updateBoundingBox
    ];
}
}),
"[project]/pwa/node_modules/recharts/es6/util/cursor/getCursorRectangle.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCursorRectangle",
    ()=>getCursorRectangle
]);
function getCursorRectangle(layout, activeCoordinate, offset, tooltipAxisBandSize) {
    var halfSize = tooltipAxisBandSize / 2;
    return {
        stroke: 'none',
        fill: '#ccc',
        x: layout === 'horizontal' ? activeCoordinate.x - halfSize : offset.left + 0.5,
        y: layout === 'horizontal' ? offset.top + 0.5 : activeCoordinate.y - halfSize,
        width: layout === 'horizontal' ? tooltipAxisBandSize : offset.width - 1,
        height: layout === 'horizontal' ? offset.height - 1 : tooltipAxisBandSize
    };
}
}),
"[project]/pwa/node_modules/recharts/es6/util/cursor/getRadialCursorPoints.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRadialCursorPoints",
    ()=>getRadialCursorPoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-client] (ecmascript)");
;
function getRadialCursorPoints(activeCoordinate) {
    var { cx, cy, radius, startAngle, endAngle } = activeCoordinate;
    var startPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, radius, startAngle);
    var endPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, radius, endAngle);
    return {
        points: [
            startPoint,
            endPoint
        ],
        cx,
        cy,
        radius,
        startAngle,
        endAngle
    };
}
}),
"[project]/pwa/node_modules/recharts/es6/util/cursor/getCursorPoints.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCursorPoints",
    ()=>getCursorPoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getRadialCursorPoints$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/cursor/getRadialCursorPoints.js [app-client] (ecmascript)");
;
;
;
function getCursorPoints(layout, activeCoordinate, offset) {
    if (layout === 'horizontal') {
        return [
            {
                x: activeCoordinate.x,
                y: offset.top
            },
            {
                x: activeCoordinate.x,
                y: offset.top + offset.height
            }
        ];
    }
    if (layout === 'vertical') {
        return [
            {
                x: offset.left,
                y: activeCoordinate.y
            },
            {
                x: offset.left + offset.width,
                y: activeCoordinate.y
            }
        ];
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPolarCoordinate"])(activeCoordinate)) {
        if (layout === 'centric') {
            var { cx, cy, innerRadius, outerRadius, angle } = activeCoordinate;
            var innerPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, innerRadius, angle);
            var outerPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, outerRadius, angle);
            return [
                {
                    x: innerPoint.x,
                    y: innerPoint.y
                },
                {
                    x: outerPoint.x,
                    y: outerPoint.y
                }
            ];
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getRadialCursorPoints$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRadialCursorPoints"])(activeCoordinate);
    }
    return undefined;
}
}),
]);

//# sourceMappingURL=7dc3a_recharts_es6_util_e175cd05._.js.map