(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/node_modules/recharts/es6/cartesian/GraphicalItemClipPath.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GraphicalItemClipPath",
    ()=>GraphicalItemClipPath,
    "useNeedsClip",
    ()=>useNeedsClip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/hooks.js [app-client] (ecmascript)");
;
;
;
;
function useNeedsClip(xAxisId, yAxisId) {
    var _xAxis$allowDataOverf, _yAxis$allowDataOverf;
    var xAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "useNeedsClip.useAppSelector[xAxis]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectXAxisSettings"])(state, xAxisId)
    }["useNeedsClip.useAppSelector[xAxis]"]);
    var yAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "useNeedsClip.useAppSelector[yAxis]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectYAxisSettings"])(state, yAxisId)
    }["useNeedsClip.useAppSelector[yAxis]"]);
    var needClipX = (_xAxis$allowDataOverf = xAxis === null || xAxis === void 0 ? void 0 : xAxis.allowDataOverflow) !== null && _xAxis$allowDataOverf !== void 0 ? _xAxis$allowDataOverf : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].allowDataOverflow;
    var needClipY = (_yAxis$allowDataOverf = yAxis === null || yAxis === void 0 ? void 0 : yAxis.allowDataOverflow) !== null && _yAxis$allowDataOverf !== void 0 ? _yAxis$allowDataOverf : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].allowDataOverflow;
    var needClip = needClipX || needClipY;
    return {
        needClip,
        needClipX,
        needClipY
    };
}
function GraphicalItemClipPath(_ref) {
    var { xAxisId, yAxisId, clipPathId } = _ref;
    var plotArea = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlotArea"])();
    var { needClipX, needClipY, needClip } = useNeedsClip(xAxisId, yAxisId);
    if (!needClip || !plotArea) {
        return null;
    }
    var { x, y, width, height } = plotArea;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("clipPath", {
        id: "clipPath-".concat(clipPathId)
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("rect", {
        x: needClipX ? x : x - width / 2,
        y: needClipY ? y : y - height / 2,
        width: needClipX ? width : width * 2,
        height: needClipY ? height : height * 2
    }));
}
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/Line.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Line",
    ()=>Line,
    "computeLinePoints",
    ()=>computeLinePoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/LabelList.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Dots$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Dots.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ReactUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ActivePoints$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/ActivePoints.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetTooltipEntrySettings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$ErrorBarContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/ErrorBarContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/GraphicalItemClipPath.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$lineSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/lineSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetLegendPayload.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/RegisterGraphicalItemId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetGraphicalItem.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getRadiusAndStrokeWidthFromDot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getRadiusAndStrokeWidthFromDot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ActiveShapeUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-client] (ecmascript)");
var _excluded = [
    "id"
], _excluded2 = [
    "type",
    "layout",
    "connectNulls",
    "needClip",
    "shape"
], _excluded3 = [
    "activeDot",
    "animateNewValues",
    "animationBegin",
    "animationDuration",
    "animationEasing",
    "connectNulls",
    "dot",
    "hide",
    "isAnimationActive",
    "label",
    "legendType",
    "xAxisId",
    "yAxisId",
    "id"
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
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
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
 * Internal props, combination of external props + defaultProps + private Recharts state
 */ /**
 * External props, intended for end users to fill in
 */ /**
 * Because of naming conflict, we are forced to ignore certain (valid) SVG attributes.
 */ var computeLegendPayloadFromAreaData = (props)=>{
    var { dataKey, name, stroke, legendType, hide } = props;
    return [
        {
            inactive: hide,
            dataKey,
            type: legendType,
            color: stroke,
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            payload: props
        }
    ];
};
function getTooltipEntrySettings(props) {
    var { dataKey, data, stroke, strokeWidth, fill, name, hide, unit } = props;
    return {
        dataDefinedOnItem: data,
        positions: undefined,
        settings: {
            stroke,
            strokeWidth,
            fill,
            dataKey,
            nameKey: undefined,
            name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            hide,
            type: props.tooltipType,
            color: props.stroke,
            unit
        }
    };
}
var generateSimpleStrokeDasharray = (totalLength, length)=>{
    return "".concat(length, "px ").concat(totalLength - length, "px");
};
function repeat(lines, count) {
    var linesUnit = lines.length % 2 !== 0 ? [
        ...lines,
        0
    ] : lines;
    var result = [];
    for(var i = 0; i < count; ++i){
        result = [
            ...result,
            ...linesUnit
        ];
    }
    return result;
}
var getStrokeDasharray = (length, totalLength, lines)=>{
    var lineLength = lines.reduce((pre, next)=>pre + next);
    // if lineLength is 0 return the default when no strokeDasharray is provided
    if (!lineLength) {
        return generateSimpleStrokeDasharray(totalLength, length);
    }
    var count = Math.floor(length / lineLength);
    var remainLength = length % lineLength;
    var restLength = totalLength - length;
    var remainLines = [];
    for(var i = 0, sum = 0; i < lines.length; sum += lines[i], ++i){
        if (sum + lines[i] > remainLength) {
            remainLines = [
                ...lines.slice(0, i),
                remainLength - sum
            ];
            break;
        }
    }
    var emptyLines = remainLines.length % 2 === 0 ? [
        0,
        restLength
    ] : [
        restLength
    ];
    return [
        ...repeat(lines, count),
        ...remainLines,
        ...emptyLines
    ].map((line)=>"".concat(line, "px")).join(', ');
};
function LineDotsWrapper(_ref) {
    var { clipPathId, points, props } = _ref;
    var { dot, dataKey, needClip } = props;
    /*
   * Exclude ID from the props passed to the Dots component
   * because then the ID would be applied to multiple dots, and it would no longer be unique.
   */ var { id } = props, propsWithoutId = _objectWithoutProperties(props, _excluded);
    var lineProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(propsWithoutId);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Dots$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dots"], {
        points: points,
        dot: dot,
        className: "recharts-line-dots",
        dotClassName: "recharts-line-dot",
        dataKey: dataKey,
        baseProps: lineProps,
        needClip: needClip,
        clipPathId: clipPathId
    });
}
function LineLabelListProvider(_ref2) {
    var { showLabels, children, points } = _ref2;
    var labelListEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LineLabelListProvider.useMemo[labelListEntries]": ()=>{
            return points === null || points === void 0 ? void 0 : points.map({
                "LineLabelListProvider.useMemo[labelListEntries]": (point)=>{
                    var _point$x, _point$y;
                    var viewBox = {
                        x: (_point$x = point.x) !== null && _point$x !== void 0 ? _point$x : 0,
                        y: (_point$y = point.y) !== null && _point$y !== void 0 ? _point$y : 0,
                        width: 0,
                        lowerWidth: 0,
                        upperWidth: 0,
                        height: 0
                    };
                    return _objectSpread(_objectSpread({}, viewBox), {}, {
                        value: point.value,
                        payload: point.payload,
                        viewBox,
                        /*
         * Line is not passing parentViewBox to the LabelList so the labels can escape - looks like a bug, should we pass parentViewBox?
         * Or should this just be the root chart viewBox?
         */ parentViewBox: undefined,
                        fill: undefined
                    });
                }
            }["LineLabelListProvider.useMemo[labelListEntries]"]);
        }
    }["LineLabelListProvider.useMemo[labelListEntries]"], [
        points
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianLabelListContextProvider"], {
        value: showLabels ? labelListEntries : undefined
    }, children);
}
function StaticCurve(_ref3) {
    var { clipPathId, pathRef, points, strokeDasharray, props } = _ref3;
    var { type, layout, connectNulls, needClip, shape } = props, others = _objectWithoutProperties(props, _excluded2);
    var curveProps = _objectSpread(_objectSpread({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(others)), {}, {
        fill: 'none',
        className: 'recharts-line-curve',
        clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : undefined,
        points,
        type,
        layout,
        connectNulls,
        strokeDasharray: strokeDasharray !== null && strokeDasharray !== void 0 ? strokeDasharray : props.strokeDasharray
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, (points === null || points === void 0 ? void 0 : points.length) > 1 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Shape"], _extends({
        shapeType: "curve",
        option: shape
    }, curveProps, {
        pathRef: pathRef
    })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](LineDotsWrapper, {
        points: points,
        clipPathId: clipPathId,
        props: props
    }));
}
function getTotalLength(mainCurve) {
    try {
        return mainCurve && mainCurve.getTotalLength && mainCurve.getTotalLength() || 0;
    } catch (_unused) {
        return 0;
    }
}
function CurveWithAnimation(_ref4) {
    var { clipPathId, props, pathRef, previousPointsRef, longestAnimatedLengthRef } = _ref4;
    var { points, strokeDasharray, isAnimationActive, animationBegin, animationDuration, animationEasing, animateNewValues, width, height, onAnimationEnd, onAnimationStart } = props;
    var prevPoints = previousPointsRef.current;
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnimationId"])(props, 'recharts-line-');
    var [isAnimating, setIsAnimating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    var showLabels = !isAnimating;
    var handleAnimationEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CurveWithAnimation.useCallback[handleAnimationEnd]": ()=>{
            if (typeof onAnimationEnd === 'function') {
                onAnimationEnd();
            }
            setIsAnimating(false);
        }
    }["CurveWithAnimation.useCallback[handleAnimationEnd]"], [
        onAnimationEnd
    ]);
    var handleAnimationStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CurveWithAnimation.useCallback[handleAnimationStart]": ()=>{
            if (typeof onAnimationStart === 'function') {
                onAnimationStart();
            }
            setIsAnimating(true);
        }
    }["CurveWithAnimation.useCallback[handleAnimationStart]"], [
        onAnimationStart
    ]);
    var totalLength = getTotalLength(pathRef.current);
    /*
   * Here we want to detect if the length animation has been interrupted.
   * For that we keep a reference to the furthest length that has been animated.
   *
   * And then, to keep things smooth, we add to it the current length that is being animated right now.
   *
   * If we did Math.max then it makes the length animation "pause" but we want to keep it smooth
   * so in case we have some "leftover" length from the previous animation we add it to the current length.
   *
   * This is not perfect because the animation changes speed due to easing. The default easing is 'ease' which is not linear
   * and makes it stand out. But it's good enough I suppose.
   * If we want to fix it then we need to keep track of multiple animations and their easing and timings.
   *
   * If you want to see this in action, try to change the dataKey of the line chart while the initial animation is running.
   * The Line begins with zero length and slowly grows to the full length. While this growth is in progress,
   * change the dataKey and the Line will continue growing from where it has grown so far.
   */ var startingPoint = longestAnimatedLengthRef.current;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](LineLabelListProvider, {
        points: points,
        showLabels: showLabels
    }, props.children, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JavascriptAnimate"], {
        animationId: animationId,
        begin: animationBegin,
        duration: animationDuration,
        isActive: isAnimationActive,
        easing: animationEasing,
        onAnimationEnd: handleAnimationEnd,
        onAnimationStart: handleAnimationStart,
        key: animationId
    }, (t)=>{
        var lengthInterpolated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(startingPoint, totalLength + startingPoint, t);
        var curLength = Math.min(lengthInterpolated, totalLength);
        var currentStrokeDasharray;
        if (isAnimationActive) {
            if (strokeDasharray) {
                var lines = "".concat(strokeDasharray).split(/[,\s]+/gim).map((num)=>parseFloat(num));
                currentStrokeDasharray = getStrokeDasharray(curLength, totalLength, lines);
            } else {
                currentStrokeDasharray = generateSimpleStrokeDasharray(totalLength, curLength);
            }
        } else {
            currentStrokeDasharray = strokeDasharray == null ? undefined : String(strokeDasharray);
        }
        if (prevPoints) {
            var prevPointsDiffFactor = prevPoints.length / points.length;
            var stepData = t === 1 ? points : points.map((entry, index)=>{
                var prevPointIndex = Math.floor(index * prevPointsDiffFactor);
                if (prevPoints[prevPointIndex]) {
                    var prev = prevPoints[prevPointIndex];
                    return _objectSpread(_objectSpread({}, entry), {}, {
                        x: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.x, entry.x, t),
                        y: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.y, entry.y, t)
                    });
                }
                // magic number of faking previous x and y location
                if (animateNewValues) {
                    return _objectSpread(_objectSpread({}, entry), {}, {
                        x: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(width * 2, entry.x, t),
                        y: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(height / 2, entry.y, t)
                    });
                }
                return _objectSpread(_objectSpread({}, entry), {}, {
                    x: entry.x,
                    y: entry.y
                });
            });
            // eslint-disable-next-line no-param-reassign
            previousPointsRef.current = stepData;
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](StaticCurve, {
                props: props,
                points: stepData,
                clipPathId: clipPathId,
                pathRef: pathRef,
                strokeDasharray: currentStrokeDasharray
            });
        }
        /*
     * Here it is important to wait a little bit with updating the previousPointsRef
     * before the animation has a time to initialize.
     * If we set the previous pointsRef immediately, we set it before the Legend height it calculated
     * and before pathRef is set.
     * If that happens, the Line will re-render again after Legend had reported its height
     * which will start a new animation with the previous points as the starting point
     * which gives the effect of the Line animating slightly upwards (where the animation distance equals the Legend height).
     * Waiting for t > 0 is indirect but good enough to ensure that the Legend height is calculated and animation works properly.
     *
     * Total length similarly is calculated from the pathRef. We should not update the previousPointsRef
     * before the pathRef is set, otherwise we will have a wrong total length.
     */ if (t > 0 && totalLength > 0) {
            // eslint-disable-next-line no-param-reassign
            previousPointsRef.current = points;
            /*
       * totalLength is set from a ref and is not updated in the first tick of the animation.
       * It defaults to zero which is exactly what we want here because we want to grow from zero,
       * however the same happens when the data change.
       *
       * In that case we want to remember the previous length and continue from there, and only animate the shape.
       *
       * Therefore the totalLength > 0 check.
       *
       * The Animate is about to fire handleAnimationStart which will update the state
       * and cause a re-render and read a new proper totalLength which will be used in the next tick
       * and update the longestAnimatedLengthRef.
       */ // eslint-disable-next-line no-param-reassign
            longestAnimatedLengthRef.current = curLength;
        }
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](StaticCurve, {
            props: props,
            points: points,
            clipPathId: clipPathId,
            pathRef: pathRef,
            strokeDasharray: currentStrokeDasharray
        });
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LabelListFromLabelProp"], {
        label: props.label
    }));
}
function RenderCurve(_ref5) {
    var { clipPathId, props } = _ref5;
    var previousPointsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    var longestAnimatedLengthRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    var pathRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](CurveWithAnimation, {
        props: props,
        clipPathId: clipPathId,
        previousPointsRef: previousPointsRef,
        longestAnimatedLengthRef: longestAnimatedLengthRef,
        pathRef: pathRef
    });
}
var errorBarDataPointFormatter = (dataPoint, dataKey)=>{
    var _dataPoint$x, _dataPoint$y;
    return {
        x: (_dataPoint$x = dataPoint.x) !== null && _dataPoint$x !== void 0 ? _dataPoint$x : undefined,
        y: (_dataPoint$y = dataPoint.y) !== null && _dataPoint$y !== void 0 ? _dataPoint$y : undefined,
        value: dataPoint.value,
        // @ts-expect-error getValueByDataKey does not validate the output type
        errorVal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(dataPoint.payload, dataKey)
    };
};
// eslint-disable-next-line react/prefer-stateless-function
class LineWithState extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Component"] {
    render() {
        var { hide, dot, points, className, xAxisId, yAxisId, top, left, width, height, id, needClip, zIndex } = this.props;
        if (hide) {
            return null;
        }
        var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('recharts-line', className);
        var clipPathId = id;
        var { r, strokeWidth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getRadiusAndStrokeWidthFromDot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRadiusAndStrokeWidthFromDot"])(dot);
        var clipDot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isClipDot"])(dot);
        var dotSize = r * 2 + strokeWidth;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
            zIndex: zIndex
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
            className: layerClass
        }, needClip && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("defs", null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicalItemClipPath"], {
            clipPathId: clipPathId,
            xAxisId: xAxisId,
            yAxisId: yAxisId
        }), !clipDot && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("clipPath", {
            id: "clipPath-dots-".concat(clipPathId)
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("rect", {
            x: left - dotSize / 2,
            y: top - dotSize / 2,
            width: width + dotSize,
            height: height + dotSize
        }))), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$ErrorBarContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetErrorBarContext"], {
            xAxisId: xAxisId,
            yAxisId: yAxisId,
            data: points,
            dataPointFormatter: errorBarDataPointFormatter,
            errorBarOffset: 0
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](RenderCurve, {
            props: this.props,
            clipPathId: clipPathId
        }))), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ActivePoints$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActivePoints"], {
            activeDot: this.props.activeDot,
            points: points,
            mainColor: this.props.stroke,
            itemDataKey: this.props.dataKey
        }));
    }
}
var defaultLineProps = {
    activeDot: true,
    animateNewValues: true,
    animationBegin: 0,
    animationDuration: 1500,
    animationEasing: 'ease',
    connectNulls: false,
    dot: true,
    fill: '#fff',
    hide: false,
    isAnimationActive: !__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Global"].isSsr,
    label: false,
    legendType: 'line',
    stroke: '#3182bd',
    strokeWidth: 1,
    xAxisId: 0,
    yAxisId: 0,
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].line
};
function LineImpl(props) {
    var _resolveDefaultProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(props, defaultLineProps), { activeDot, animateNewValues, animationBegin, animationDuration, animationEasing, connectNulls, dot, hide, isAnimationActive, label, legendType, xAxisId, yAxisId, id } = _resolveDefaultProps, everythingElse = _objectWithoutProperties(_resolveDefaultProps, _excluded3);
    var { needClip } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useNeedsClip"])(xAxisId, yAxisId);
    var plotArea = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlotArea"])();
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartLayout"])();
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var points = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "LineImpl.useAppSelector[points]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$lineSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectLinePoints"])(state, xAxisId, yAxisId, isPanorama, id)
    }["LineImpl.useAppSelector[points]"]);
    if (layout !== 'horizontal' && layout !== 'vertical' || points == null || plotArea == null) {
        // Cannot render Line in an unsupported layout
        return null;
    }
    var { height, width, x: left, y: top } = plotArea;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](LineWithState, _extends({}, everythingElse, {
        id: id,
        connectNulls: connectNulls,
        dot: dot,
        activeDot: activeDot,
        animateNewValues: animateNewValues,
        animationBegin: animationBegin,
        animationDuration: animationDuration,
        animationEasing: animationEasing,
        isAnimationActive: isAnimationActive,
        hide: hide,
        label: label,
        legendType: legendType,
        xAxisId: xAxisId,
        yAxisId: yAxisId,
        points: points,
        layout: layout,
        height: height,
        width: width,
        left: left,
        top: top,
        needClip: needClip
    }));
}
function computeLinePoints(_ref6) {
    var { layout, xAxis, yAxis, xAxisTicks, yAxisTicks, dataKey, bandSize, displayedData } = _ref6;
    return displayedData.map((entry, index)=>{
        // @ts-expect-error getValueByDataKey does not validate the output type
        var value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey);
        if (layout === 'horizontal') {
            var _x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCateCoordinateOfLine"])({
                axis: xAxis,
                ticks: xAxisTicks,
                bandSize,
                entry,
                index
            });
            var _y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(value) ? null : yAxis.scale(value);
            return {
                x: _x,
                y: _y,
                value,
                payload: entry
            };
        }
        var x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(value) ? null : xAxis.scale(value);
        var y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCateCoordinateOfLine"])({
            axis: yAxis,
            ticks: yAxisTicks,
            bandSize,
            entry,
            index
        });
        if (x == null || y == null) {
            return null;
        }
        return {
            x,
            y,
            value,
            payload: entry
        };
    }).filter(Boolean);
}
function LineFn(outsideProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultLineProps);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RegisterGraphicalItemId"], {
        id: props.id,
        type: "line"
    }, (id)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetLegendPayload"], {
            legendPayload: computeLegendPayloadFromAreaData(props)
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetTooltipEntrySettings"], {
            fn: getTooltipEntrySettings,
            args: props
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetCartesianGraphicalItem"], {
            type: "line",
            id: id,
            data: props.data,
            xAxisId: props.xAxisId,
            yAxisId: props.yAxisId,
            zAxisId: 0,
            dataKey: props.dataKey,
            hide: props.hide,
            isPanorama: isPanorama
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](LineImpl, _extends({}, props, {
            id: id
        }))));
}
var Line = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"](LineFn);
Line.displayName = 'Line';
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/Bar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Bar",
    ()=>Bar,
    "computeBarRectangles",
    ()=>computeBarRectangles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Cell.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/LabelList.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ReactUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$BarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/BarUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/tooltipContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetTooltipEntrySettings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$ErrorBarContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/ErrorBarContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/GraphicalItemClipPath.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$barSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/barSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetLegendPayload.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/RegisterGraphicalItemId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetGraphicalItem.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$getZIndexFromUnknown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/getZIndexFromUnknown.js [app-client] (ecmascript)");
var _excluded = [
    "onMouseEnter",
    "onMouseLeave",
    "onClick"
], _excluded2 = [
    "value",
    "background",
    "tooltipPosition"
], _excluded3 = [
    "id"
], _excluded4 = [
    "onMouseEnter",
    "onClick",
    "onMouseLeave"
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
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
var computeLegendPayloadFromBarData = (props)=>{
    var { dataKey, name, fill, legendType, hide } = props;
    return [
        {
            inactive: hide,
            dataKey,
            type: legendType,
            color: fill,
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            payload: props
        }
    ];
};
function getTooltipEntrySettings(props) {
    var { dataKey, stroke, strokeWidth, fill, name, hide, unit } = props;
    return {
        dataDefinedOnItem: undefined,
        positions: undefined,
        settings: {
            stroke,
            strokeWidth,
            fill,
            dataKey,
            nameKey: undefined,
            name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            hide,
            type: props.tooltipType,
            color: props.fill,
            unit
        }
    };
}
function BarBackground(props) {
    var activeIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"]);
    var { data, dataKey, background: backgroundFromProps, allOtherBarProps } = props;
    var { onMouseEnter: onMouseEnterFromProps, onMouseLeave: onMouseLeaveFromProps, onClick: onItemClickFromProps } = allOtherBarProps, restOfAllOtherProps = _objectWithoutProperties(allOtherBarProps, _excluded);
    // @ts-expect-error bar mouse events are not compatible with recharts mouse events
    var onMouseEnterFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseEnterItemDispatch"])(onMouseEnterFromProps, dataKey);
    // @ts-expect-error bar mouse events are not compatible with recharts mouse events
    var onMouseLeaveFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseLeaveItemDispatch"])(onMouseLeaveFromProps);
    // @ts-expect-error bar mouse events are not compatible with recharts mouse events
    var onClickFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseClickItemDispatch"])(onItemClickFromProps, dataKey);
    if (!backgroundFromProps || data == null) {
        return null;
    }
    var backgroundProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(backgroundFromProps);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$getZIndexFromUnknown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getZIndexFromUnknown"])(backgroundFromProps, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].barBackground)
    }, data.map((entry, i)=>{
        var { value, background: backgroundFromDataEntry, tooltipPosition } = entry, rest = _objectWithoutProperties(entry, _excluded2);
        if (!backgroundFromDataEntry) {
            return null;
        }
        // @ts-expect-error BarRectangleItem type definition says it's missing properties, but I can see them present in debugger!
        var onMouseEnter = onMouseEnterFromContext(entry, i);
        // @ts-expect-error BarRectangleItem type definition says it's missing properties, but I can see them present in debugger!
        var onMouseLeave = onMouseLeaveFromContext(entry, i);
        // @ts-expect-error BarRectangleItem type definition says it's missing properties, but I can see them present in debugger!
        var onClick = onClickFromContext(entry, i);
        var barRectangleProps = _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({
            option: backgroundFromProps,
            isActive: String(i) === activeIndex
        }, rest), {}, {
            // @ts-expect-error backgroundProps is contributing unknown props
            fill: '#eee'
        }, backgroundFromDataEntry), backgroundProps), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adaptEventsOfChild"])(restOfAllOtherProps, entry, i)), {}, {
            onMouseEnter,
            onMouseLeave,
            onClick,
            dataKey,
            index: i,
            className: 'recharts-bar-background-rectangle'
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$BarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BarRectangle"], _extends({
            key: "background-bar-".concat(i)
        }, barRectangleProps));
    }));
}
function BarLabelListProvider(_ref) {
    var { showLabels, children, rects } = _ref;
    var labelListEntries = rects === null || rects === void 0 ? void 0 : rects.map((entry)=>{
        var viewBox = {
            x: entry.x,
            y: entry.y,
            width: entry.width,
            lowerWidth: entry.width,
            upperWidth: entry.width,
            height: entry.height
        };
        return _objectSpread(_objectSpread({}, viewBox), {}, {
            value: entry.value,
            payload: entry.payload,
            parentViewBox: entry.parentViewBox,
            viewBox,
            fill: entry.fill
        });
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianLabelListContextProvider"], {
        value: showLabels ? labelListEntries : undefined
    }, children);
}
function BarRectangleWithActiveState(props) {
    var { shape, activeBar, baseProps, entry, index, dataKey } = props;
    var activeIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"]);
    var activeDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipDataKey"]);
    /*
   * Bars support stacking, meaning that there can be multiple bars at the same x value.
   * With Tooltip shared=false we only want to highlight the currently active Bar, not all.
   *
   * Also, if the tooltip is shared, we want to highlight all bars at the same x value
   * regardless of the dataKey.
   *
   * With shared Tooltip, the activeDataKey is undefined.
   */ var isActive = activeBar && String(index) === activeIndex && (activeDataKey == null || dataKey === activeDataKey);
    var option = isActive ? activeBar : shape;
    if (isActive) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
            zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].activeBar
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$BarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BarRectangle"], _extends({}, baseProps, {
            name: String(baseProps.name)
        }, entry, {
            isActive: isActive,
            option: option,
            index: index,
            dataKey: dataKey
        })));
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$BarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BarRectangle"], _extends({}, baseProps, {
        name: String(baseProps.name)
    }, entry, {
        isActive: isActive,
        option: option,
        index: index,
        dataKey: dataKey
    }));
}
function BarRectangleNeverActive(props) {
    var { shape, baseProps, entry, index, dataKey } = props;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$BarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BarRectangle"], _extends({}, baseProps, {
        name: String(baseProps.name)
    }, entry, {
        isActive: false,
        option: shape,
        index: index,
        dataKey: dataKey
    }));
}
function BarRectangles(_ref2) {
    var _svgPropertiesNoEvent;
    var { data, props } = _ref2;
    var _ref3 = (_svgPropertiesNoEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(props)) !== null && _svgPropertiesNoEvent !== void 0 ? _svgPropertiesNoEvent : {}, { id } = _ref3, baseProps = _objectWithoutProperties(_ref3, _excluded3);
    var { shape, dataKey, activeBar } = props;
    var { onMouseEnter: onMouseEnterFromProps, onClick: onItemClickFromProps, onMouseLeave: onMouseLeaveFromProps } = props, restOfAllOtherProps = _objectWithoutProperties(props, _excluded4);
    // @ts-expect-error bar mouse events are not compatible with recharts mouse events
    var onMouseEnterFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseEnterItemDispatch"])(onMouseEnterFromProps, dataKey);
    // @ts-expect-error bar mouse events are not compatible with recharts mouse events
    var onMouseLeaveFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseLeaveItemDispatch"])(onMouseLeaveFromProps);
    // @ts-expect-error bar mouse events are not compatible with recharts mouse events
    var onClickFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseClickItemDispatch"])(onItemClickFromProps, dataKey);
    if (!data) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, data.map((entry, i)=>{
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], _extends({
            key: "rectangle-".concat(entry === null || entry === void 0 ? void 0 : entry.x, "-").concat(entry === null || entry === void 0 ? void 0 : entry.y, "-").concat(entry === null || entry === void 0 ? void 0 : entry.value, "-").concat(i),
            className: "recharts-bar-rectangle"
        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adaptEventsOfChild"])(restOfAllOtherProps, entry, i), {
            // @ts-expect-error BarRectangleItem type definition says it's missing properties, but I can see them present in debugger!
            onMouseEnter: onMouseEnterFromContext(entry, i),
            onMouseLeave: onMouseLeaveFromContext(entry, i),
            onClick: onClickFromContext(entry, i)
        }), activeBar ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarRectangleWithActiveState, {
            shape: shape,
            activeBar: activeBar,
            baseProps: baseProps,
            entry: entry,
            index: i,
            dataKey: dataKey
        }) : /*#__PURE__*/ /*
     * If the `activeBar` prop is falsy, then let's call the variant without hooks.
     * Using the `selectActiveTooltipIndex` selector is usually fast
     * but in charts with large-ish amount of data even the few nanoseconds add up to a noticeable jank.
     * If the activeBar is false then we don't need to know which index is active - because we won't use it anyway.
     * So let's just skip the hooks altogether. That way, React can skip rendering the component,
     * and can skip the tree reconciliation for its children too.
     * Because we can't call hooks conditionally, we need to have a separate component for that.
     */ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarRectangleNeverActive, {
            shape: shape,
            baseProps: baseProps,
            entry: entry,
            index: i,
            dataKey: dataKey
        }));
    }));
}
function RectanglesWithAnimation(_ref4) {
    var { props, previousRectanglesRef } = _ref4;
    var { data, layout, isAnimationActive, animationBegin, animationDuration, animationEasing, onAnimationEnd, onAnimationStart } = props;
    var prevData = previousRectanglesRef.current;
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnimationId"])(props, 'recharts-bar-');
    var [isAnimating, setIsAnimating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    var showLabels = !isAnimating;
    var handleAnimationEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RectanglesWithAnimation.useCallback[handleAnimationEnd]": ()=>{
            if (typeof onAnimationEnd === 'function') {
                onAnimationEnd();
            }
            setIsAnimating(false);
        }
    }["RectanglesWithAnimation.useCallback[handleAnimationEnd]"], [
        onAnimationEnd
    ]);
    var handleAnimationStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RectanglesWithAnimation.useCallback[handleAnimationStart]": ()=>{
            if (typeof onAnimationStart === 'function') {
                onAnimationStart();
            }
            setIsAnimating(true);
        }
    }["RectanglesWithAnimation.useCallback[handleAnimationStart]"], [
        onAnimationStart
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarLabelListProvider, {
        showLabels: showLabels,
        rects: data
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JavascriptAnimate"], {
        animationId: animationId,
        begin: animationBegin,
        duration: animationDuration,
        isActive: isAnimationActive,
        easing: animationEasing,
        onAnimationEnd: handleAnimationEnd,
        onAnimationStart: handleAnimationStart,
        key: animationId
    }, (t)=>{
        var stepData = t === 1 ? data : data === null || data === void 0 ? void 0 : data.map((entry, index)=>{
            var prev = prevData && prevData[index];
            if (prev) {
                return _objectSpread(_objectSpread({}, entry), {}, {
                    x: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.x, entry.x, t),
                    y: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.y, entry.y, t),
                    width: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.width, entry.width, t),
                    height: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.height, entry.height, t)
                });
            }
            if (layout === 'horizontal') {
                var height = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(0, entry.height, t);
                var y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(entry.stackedBarStart, entry.y, t);
                return _objectSpread(_objectSpread({}, entry), {}, {
                    y,
                    height
                });
            }
            var w = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(0, entry.width, t);
            var x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(entry.stackedBarStart, entry.x, t);
            return _objectSpread(_objectSpread({}, entry), {}, {
                width: w,
                x
            });
        });
        if (t > 0) {
            // eslint-disable-next-line no-param-reassign
            previousRectanglesRef.current = stepData !== null && stepData !== void 0 ? stepData : null;
        }
        if (stepData == null) {
            return null;
        }
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarRectangles, {
            props: props,
            data: stepData
        }));
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LabelListFromLabelProp"], {
        label: props.label
    }), props.children);
}
function RenderRectangles(props) {
    var previousRectanglesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](RectanglesWithAnimation, {
        previousRectanglesRef: previousRectanglesRef,
        props: props
    });
}
var defaultMinPointSize = 0;
var errorBarDataPointFormatter = (dataPoint, dataKey)=>{
    /**
   * if the value coming from `selectBarRectangles` is an array then this is a stacked bar chart.
   * arr[1] represents end value of the bar since the data is in the form of [startValue, endValue].
   * */ var value = Array.isArray(dataPoint.value) ? dataPoint.value[1] : dataPoint.value;
    return {
        x: dataPoint.x,
        y: dataPoint.y,
        value,
        // @ts-expect-error getValueByDataKey does not validate the output type
        errorVal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(dataPoint, dataKey)
    };
};
class BarWithState extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PureComponent"] {
    render() {
        var { hide, data, dataKey, className, xAxisId, yAxisId, needClip, background, id } = this.props;
        if (hide || data == null) {
            return null;
        }
        var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('recharts-bar', className);
        var clipPathId = id;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
            className: layerClass,
            id: id
        }, needClip && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("defs", null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicalItemClipPath"], {
            clipPathId: clipPathId,
            xAxisId: xAxisId,
            yAxisId: yAxisId
        })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
            className: "recharts-bar-rectangles",
            clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : undefined
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarBackground, {
            data: data,
            dataKey: dataKey,
            background: background,
            allOtherBarProps: this.props
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](RenderRectangles, this.props)));
    }
}
var defaultBarProps = {
    activeBar: false,
    animationBegin: 0,
    animationDuration: 400,
    animationEasing: 'ease',
    hide: false,
    isAnimationActive: !__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Global"].isSsr,
    legendType: 'rect',
    minPointSize: defaultMinPointSize,
    xAxisId: 0,
    yAxisId: 0,
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].bar
};
function BarImpl(props) {
    var { xAxisId, yAxisId, hide, legendType, minPointSize, activeBar, animationBegin, animationDuration, animationEasing, isAnimationActive } = props;
    var { needClip } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useNeedsClip"])(xAxisId, yAxisId);
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartLayout"])();
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var cells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findAllByType"])(props.children, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cell"]);
    var rects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "BarImpl.useAppSelector[rects]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$barSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBarRectangles"])(state, xAxisId, yAxisId, isPanorama, props.id, cells)
    }["BarImpl.useAppSelector[rects]"]);
    if (layout !== 'vertical' && layout !== 'horizontal') {
        return null;
    }
    var errorBarOffset;
    var firstDataPoint = rects === null || rects === void 0 ? void 0 : rects[0];
    if (firstDataPoint == null || firstDataPoint.height == null || firstDataPoint.width == null) {
        errorBarOffset = 0;
    } else {
        errorBarOffset = layout === 'vertical' ? firstDataPoint.height / 2 : firstDataPoint.width / 2;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$ErrorBarContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetErrorBarContext"], {
        xAxisId: xAxisId,
        yAxisId: yAxisId,
        data: rects,
        dataPointFormatter: errorBarDataPointFormatter,
        errorBarOffset: errorBarOffset
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarWithState, _extends({}, props, {
        layout: layout,
        needClip: needClip,
        data: rects,
        xAxisId: xAxisId,
        yAxisId: yAxisId,
        hide: hide,
        legendType: legendType,
        minPointSize: minPointSize,
        activeBar: activeBar,
        animationBegin: animationBegin,
        animationDuration: animationDuration,
        animationEasing: animationEasing,
        isAnimationActive: isAnimationActive
    })));
}
function computeBarRectangles(_ref5) {
    var { layout, barSettings: { dataKey, minPointSize: minPointSizeProp }, pos, bandSize, xAxis, yAxis, xAxisTicks, yAxisTicks, stackedData, displayedData, offset, cells, parentViewBox, dataStartIndex } = _ref5;
    var numericAxis = layout === 'horizontal' ? yAxis : xAxis;
    // @ts-expect-error this assumes that the domain is always numeric, but doesn't check for it
    var stackedDomain = stackedData ? numericAxis.scale.domain() : null;
    var baseValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBaseValueOfBar"])({
        numericAxis
    });
    var stackedBarStart = numericAxis.scale(baseValue);
    return displayedData.map((entry, index)=>{
        var value, x, y, width, height, background;
        if (stackedData) {
            // Use dataStartIndex to access the correct element in the full stackedData array
            value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncateByDomain"])(stackedData[index + dataStartIndex], stackedDomain);
        } else {
            value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey);
            if (!Array.isArray(value)) {
                value = [
                    baseValue,
                    value
                ];
            }
        }
        var minPointSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$BarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["minPointSizeCallback"])(minPointSizeProp, defaultMinPointSize)(value[1], index);
        if (layout === 'horizontal') {
            var _ref6;
            var [baseValueScale, currentValueScale] = [
                yAxis.scale(value[0]),
                yAxis.scale(value[1])
            ];
            x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCateCoordinateOfBar"])({
                axis: xAxis,
                ticks: xAxisTicks,
                bandSize,
                offset: pos.offset,
                entry,
                index
            });
            y = (_ref6 = currentValueScale !== null && currentValueScale !== void 0 ? currentValueScale : baseValueScale) !== null && _ref6 !== void 0 ? _ref6 : undefined;
            width = pos.size;
            var computedHeight = baseValueScale - currentValueScale;
            height = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(computedHeight) ? 0 : computedHeight;
            background = {
                x,
                y: offset.top,
                width,
                height: offset.height
            };
            if (Math.abs(minPointSize) > 0 && Math.abs(height) < Math.abs(minPointSize)) {
                var delta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(height || minPointSize) * (Math.abs(minPointSize) - Math.abs(height));
                y -= delta;
                height += delta;
            }
        } else {
            var [_baseValueScale, _currentValueScale] = [
                xAxis.scale(value[0]),
                xAxis.scale(value[1])
            ];
            x = _baseValueScale;
            y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCateCoordinateOfBar"])({
                axis: yAxis,
                ticks: yAxisTicks,
                bandSize,
                offset: pos.offset,
                entry,
                index
            });
            width = _currentValueScale - _baseValueScale;
            height = pos.size;
            background = {
                x: offset.left,
                y,
                width: offset.width,
                height
            };
            if (Math.abs(minPointSize) > 0 && Math.abs(width) < Math.abs(minPointSize)) {
                var _delta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(width || minPointSize) * (Math.abs(minPointSize) - Math.abs(width));
                width += _delta;
            }
        }
        if (x == null || y == null || width == null || height == null) {
            return null;
        }
        var barRectangleItem = _objectSpread(_objectSpread({}, entry), {}, {
            stackedBarStart,
            x,
            y,
            width,
            height,
            value: stackedData ? value : value[1],
            payload: entry,
            background,
            tooltipPosition: {
                x: x + width / 2,
                y: y + height / 2
            },
            parentViewBox
        }, cells && cells[index] && cells[index].props);
        return barRectangleItem;
    }).filter(Boolean);
}
function BarFn(outsideProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultBarProps);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    // Report all props to Redux store first, before calling any hooks, to avoid circular dependencies.
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RegisterGraphicalItemId"], {
        id: props.id,
        type: "bar"
    }, (id)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetLegendPayload"], {
            legendPayload: computeLegendPayloadFromBarData(props)
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetTooltipEntrySettings"], {
            fn: getTooltipEntrySettings,
            args: props
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetCartesianGraphicalItem"], {
            type: "bar",
            id: id,
            data: undefined,
            xAxisId: props.xAxisId,
            yAxisId: props.yAxisId,
            zAxisId: 0,
            dataKey: props.dataKey,
            stackId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNormalizedStackId"])(props.stackId),
            hide: props.hide,
            barSize: props.barSize,
            minPointSize: props.minPointSize,
            maxBarSize: props.maxBarSize,
            isPanorama: isPanorama
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
            zIndex: props.zIndex
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](BarImpl, _extends({}, props, {
            id: id
        })))));
}
var Bar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"](BarFn);
Bar.displayName = 'Bar';
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/Scatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Scatter",
    ()=>Scatter,
    "computeScatterPoints",
    ()=>computeScatterPoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/LabelList.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ReactUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Curve.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Cell.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ScatterUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ScatterUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/tooltipContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetTooltipEntrySettings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$ErrorBarContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/ErrorBarContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/GraphicalItemClipPath.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$scatterSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/scatterSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetLegendPayload.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/RegisterGraphicalItemId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetGraphicalItem.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-client] (ecmascript)");
var _excluded = [
    "onMouseEnter",
    "onClick",
    "onMouseLeave"
], _excluded2 = [
    "id"
], _excluded3 = [
    "animationBegin",
    "animationDuration",
    "animationEasing",
    "hide",
    "isAnimationActive",
    "legendType",
    "lineJointType",
    "lineType",
    "shape",
    "xAxisId",
    "yAxisId",
    "zAxisId"
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
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
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
 * Scatter coordinates are nullable because sometimes the point value is out of the domain
 * and we can't compute a valid coordinate for it.
 *
 * Scatter -> Symbol ignores points with null cx or cy so those won't render if using the default shapes.
 * However the points are exposed via various props and can be used in custom shapes so we keep them around.
 */ /**
 * Internal props, combination of external props + defaultProps + private Recharts state
 */ /**
 * External props, intended for end users to fill in
 */ /**
 * Because of naming conflict, we are forced to ignore certain (valid) SVG attributes.
 */ var computeLegendPayloadFromScatterProps = (props)=>{
    var { dataKey, name, fill, legendType, hide } = props;
    return [
        {
            inactive: hide,
            dataKey,
            type: legendType,
            color: fill,
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            payload: props
        }
    ];
};
function ScatterLine(_ref) {
    var { points, props } = _ref;
    var { line, lineType, lineJointType } = props;
    if (!line) {
        return null;
    }
    var scatterProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(props);
    var customLineProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(line);
    var linePoints, lineItem;
    if (lineType === 'joint') {
        linePoints = points.map((entry)=>{
            var _entry$cx, _entry$cy;
            return {
                x: (_entry$cx = entry.cx) !== null && _entry$cx !== void 0 ? _entry$cx : null,
                y: (_entry$cy = entry.cy) !== null && _entry$cy !== void 0 ? _entry$cy : null
            };
        });
    } else if (lineType === 'fitting') {
        var { xmin, xmax, a, b } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLinearRegression"])(points);
        var linearExp = (x)=>a * x + b;
        linePoints = [
            {
                x: xmin,
                y: linearExp(xmin)
            },
            {
                x: xmax,
                y: linearExp(xmax)
            }
        ];
    }
    var lineProps = _objectSpread(_objectSpread(_objectSpread({}, scatterProps), {}, {
        // @ts-expect-error customLineProps is contributing unknown props
        fill: 'none',
        // @ts-expect-error customLineProps is contributing unknown props
        stroke: scatterProps && scatterProps.fill
    }, customLineProps), {}, {
        // @ts-expect-error linePoints is used before it is assigned (???)
        points: linePoints
    });
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"](line)) {
        lineItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"](line, lineProps);
    } else if (typeof line === 'function') {
        lineItem = line(lineProps);
    } else {
        lineItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Curve"], _extends({}, lineProps, {
            type: lineJointType
        }));
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
        className: "recharts-scatter-line",
        key: "recharts-scatter-line"
    }, lineItem);
}
function ScatterLabelListProvider(_ref2) {
    var { showLabels, points, children } = _ref2;
    var chartViewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useViewBox"])();
    var labelListEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ScatterLabelListProvider.useMemo[labelListEntries]": ()=>{
            return points === null || points === void 0 ? void 0 : points.map({
                "ScatterLabelListProvider.useMemo[labelListEntries]": (point)=>{
                    var _point$x, _point$y;
                    var viewBox = {
                        /*
         * Scatter label uses x and y as the reference point for the label,
         * not cx and cy.
         */ x: (_point$x = point.x) !== null && _point$x !== void 0 ? _point$x : 0,
                        /*
         * Scatter label uses x and y as the reference point for the label,
         * not cx and cy.
         */ y: (_point$y = point.y) !== null && _point$y !== void 0 ? _point$y : 0,
                        width: point.width,
                        height: point.height,
                        lowerWidth: point.width,
                        upperWidth: point.width
                    };
                    return _objectSpread(_objectSpread({}, viewBox), {}, {
                        /*
         * Here we put undefined because Scatter shows two values usually, one for X and one for Y.
         * LabelList will see this undefined and will use its own `dataKey` prop to determine which value to show,
         * using the payload below.
         */ value: undefined,
                        payload: point.payload,
                        viewBox,
                        parentViewBox: chartViewBox,
                        fill: undefined
                    });
                }
            }["ScatterLabelListProvider.useMemo[labelListEntries]"]);
        }
    }["ScatterLabelListProvider.useMemo[labelListEntries]"], [
        chartViewBox,
        points
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianLabelListContextProvider"], {
        value: showLabels ? labelListEntries : undefined
    }, children);
}
function ScatterSymbols(props) {
    var { points, allOtherScatterProps } = props;
    var { shape, activeShape, dataKey } = allOtherScatterProps;
    var activeIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"]);
    var { onMouseEnter: onMouseEnterFromProps, onClick: onItemClickFromProps, onMouseLeave: onMouseLeaveFromProps } = allOtherScatterProps, restOfAllOtherProps = _objectWithoutProperties(allOtherScatterProps, _excluded);
    var onMouseEnterFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseEnterItemDispatch"])(onMouseEnterFromProps, allOtherScatterProps.dataKey);
    var onMouseLeaveFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseLeaveItemDispatch"])(onMouseLeaveFromProps);
    var onClickFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMouseClickItemDispatch"])(onItemClickFromProps, allOtherScatterProps.dataKey);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNonEmptyArray"])(points)) {
        return null;
    }
    var { id } = allOtherScatterProps, allOtherPropsWithoutId = _objectWithoutProperties(allOtherScatterProps, _excluded2);
    var baseProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(allOtherPropsWithoutId);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ScatterLine, {
        points: points,
        props: allOtherPropsWithoutId
    }), points.map((entry, i)=>{
        var hasActiveShape = activeShape != null && activeShape !== false;
        var isActive = hasActiveShape && activeIndex === String(i);
        var option = hasActiveShape && isActive ? activeShape : shape;
        var symbolProps = _objectSpread(_objectSpread(_objectSpread({
            key: "symbol-".concat(i)
        }, baseProps), entry), {}, {
            [__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DATA_ITEM_INDEX_ATTRIBUTE_NAME"]]: i,
            [__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DATA_ITEM_DATAKEY_ATTRIBUTE_NAME"]]: String(dataKey)
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
            key: "symbol-".concat(entry === null || entry === void 0 ? void 0 : entry.cx, "-").concat(entry === null || entry === void 0 ? void 0 : entry.cy, "-").concat(entry === null || entry === void 0 ? void 0 : entry.size, "-").concat(i),
            zIndex: isActive ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].activeDot : undefined
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], _extends({
            className: "recharts-scatter-symbol"
        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adaptEventsOfChild"])(restOfAllOtherProps, entry, i), {
            // @ts-expect-error the types need a bit of attention
            onMouseEnter: onMouseEnterFromContext(entry, i),
            onMouseLeave: onMouseLeaveFromContext(entry, i),
            onClick: onClickFromContext(entry, i)
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ScatterUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScatterSymbol"], _extends({
            option: option,
            isActive: isActive
        }, symbolProps))));
    }));
}
function SymbolsWithAnimation(_ref3) {
    var { previousPointsRef, props } = _ref3;
    var { points, isAnimationActive, animationBegin, animationDuration, animationEasing } = props;
    var prevPoints = previousPointsRef.current;
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnimationId"])(props, 'recharts-scatter-');
    var [isAnimating, setIsAnimating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    var handleAnimationEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SymbolsWithAnimation.useCallback[handleAnimationEnd]": ()=>{
            // Scatter doesn't have onAnimationEnd prop, and if we want to add it we do it here
            // if (typeof onAnimationEnd === 'function') {
            //   onAnimationEnd();
            // }
            setIsAnimating(false);
        }
    }["SymbolsWithAnimation.useCallback[handleAnimationEnd]"], []);
    var handleAnimationStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SymbolsWithAnimation.useCallback[handleAnimationStart]": ()=>{
            // Scatter doesn't have onAnimationStart prop, and if we want to add it we do it here
            // if (typeof onAnimationStart === 'function') {
            //   onAnimationStart();
            // }
            setIsAnimating(true);
        }
    }["SymbolsWithAnimation.useCallback[handleAnimationStart]"], []);
    var showLabels = !isAnimating;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ScatterLabelListProvider, {
        showLabels: showLabels,
        points: points
    }, props.children, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JavascriptAnimate"], {
        animationId: animationId,
        begin: animationBegin,
        duration: animationDuration,
        isActive: isAnimationActive,
        easing: animationEasing,
        onAnimationEnd: handleAnimationEnd,
        onAnimationStart: handleAnimationStart,
        key: animationId
    }, (t)=>{
        var stepData = t === 1 ? points : points === null || points === void 0 ? void 0 : points.map((entry, index)=>{
            var prev = prevPoints && prevPoints[index];
            if (prev) {
                return _objectSpread(_objectSpread({}, entry), {}, {
                    cx: entry.cx == null ? undefined : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.cx, entry.cx, t),
                    cy: entry.cy == null ? undefined : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.cy, entry.cy, t),
                    size: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(prev.size, entry.size, t)
                });
            }
            return _objectSpread(_objectSpread({}, entry), {}, {
                size: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["interpolate"])(0, entry.size, t)
            });
        });
        if (t > 0) {
            // eslint-disable-next-line no-param-reassign
            previousPointsRef.current = stepData;
        }
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ScatterSymbols, {
            points: stepData,
            allOtherScatterProps: props,
            showLabels: showLabels
        }));
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LabelListFromLabelProp"], {
        label: props.label
    }));
}
function getTooltipEntrySettings(props) {
    var { dataKey, points, stroke, strokeWidth, fill, name, hide, tooltipType } = props;
    return {
        dataDefinedOnItem: points === null || points === void 0 ? void 0 : points.map((p)=>p.tooltipPayload),
        positions: points === null || points === void 0 ? void 0 : points.map((p)=>p.tooltipPosition),
        settings: {
            stroke,
            strokeWidth,
            fill,
            nameKey: undefined,
            dataKey,
            name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            hide,
            type: tooltipType,
            color: fill,
            unit: '' // why doesn't Scatter support unit?
        }
    };
}
function computeScatterPoints(_ref4) {
    var { displayedData, xAxis, yAxis, zAxis, scatterSettings, xAxisTicks, yAxisTicks, cells } = _ref4;
    var xAxisDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(xAxis.dataKey) ? scatterSettings.dataKey : xAxis.dataKey;
    var yAxisDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(yAxis.dataKey) ? scatterSettings.dataKey : yAxis.dataKey;
    var zAxisDataKey = zAxis && zAxis.dataKey;
    var defaultRangeZ = zAxis ? zAxis.range : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitZAxis"].range;
    var defaultZ = defaultRangeZ && defaultRangeZ[0];
    var xBandSize = xAxis.scale.bandwidth ? xAxis.scale.bandwidth() : 0;
    var yBandSize = yAxis.scale.bandwidth ? yAxis.scale.bandwidth() : 0;
    return displayedData.map((entry, index)=>{
        var x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, xAxisDataKey);
        var y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, yAxisDataKey);
        var z = !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(zAxisDataKey) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, zAxisDataKey) || '-';
        var tooltipPayload = [
            {
                name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(xAxis.dataKey) ? scatterSettings.name : xAxis.name || String(xAxis.dataKey),
                unit: xAxis.unit || '',
                // @ts-expect-error getValueByDataKey does not validate the output type
                value: x,
                payload: entry,
                dataKey: xAxisDataKey,
                type: scatterSettings.tooltipType
            },
            {
                name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(yAxis.dataKey) ? scatterSettings.name : yAxis.name || String(yAxis.dataKey),
                unit: yAxis.unit || '',
                // @ts-expect-error getValueByDataKey does not validate the output type
                value: y,
                payload: entry,
                dataKey: yAxisDataKey,
                type: scatterSettings.tooltipType
            }
        ];
        if (z !== '-') {
            tooltipPayload.push({
                // @ts-expect-error name prop should not have dataKey in it
                name: zAxis.name || zAxis.dataKey,
                unit: zAxis.unit || '',
                // @ts-expect-error getValueByDataKey does not validate the output type
                value: z,
                payload: entry,
                dataKey: zAxisDataKey,
                type: scatterSettings.tooltipType
            });
        }
        var cx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCateCoordinateOfLine"])({
            axis: xAxis,
            ticks: xAxisTicks,
            bandSize: xBandSize,
            entry,
            index,
            dataKey: xAxisDataKey
        });
        var cy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCateCoordinateOfLine"])({
            axis: yAxis,
            ticks: yAxisTicks,
            bandSize: yBandSize,
            entry,
            index,
            dataKey: yAxisDataKey
        });
        var size = z !== '-' ? zAxis.scale(z) : defaultZ;
        var radius = Math.sqrt(Math.max(size, 0) / Math.PI);
        return _objectSpread(_objectSpread({}, entry), {}, {
            cx,
            cy,
            x: cx == null ? undefined : cx - radius,
            y: cy == null ? undefined : cy - radius,
            width: 2 * radius,
            height: 2 * radius,
            size,
            node: {
                x,
                y,
                z
            },
            tooltipPayload,
            tooltipPosition: {
                x: cx,
                y: cy
            },
            payload: entry
        }, cells && cells[index] && cells[index].props);
    });
}
var errorBarDataPointFormatter = (dataPoint, dataKey, direction)=>{
    return {
        x: dataPoint.cx,
        y: dataPoint.cy,
        value: direction === 'x' ? Number(dataPoint.node.x) : Number(dataPoint.node.y),
        // @ts-expect-error getValueByDataKey does not validate the output type
        errorVal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(dataPoint, dataKey)
    };
};
function ScatterWithId(props) {
    var { hide, points, className, needClip, xAxisId, yAxisId, id } = props;
    var previousPointsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    if (hide) {
        return null;
    }
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('recharts-scatter', className);
    var clipPathId = id;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: props.zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
        className: layerClass,
        clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : undefined,
        id: id
    }, needClip && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("defs", null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicalItemClipPath"], {
        clipPathId: clipPathId,
        xAxisId: xAxisId,
        yAxisId: yAxisId
    })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$ErrorBarContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetErrorBarContext"], {
        xAxisId: xAxisId,
        yAxisId: yAxisId,
        data: points,
        dataPointFormatter: errorBarDataPointFormatter,
        errorBarOffset: 0
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
        key: "recharts-scatter-symbols"
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](SymbolsWithAnimation, {
        props: props,
        previousPointsRef: previousPointsRef
    })))));
}
var defaultScatterProps = {
    xAxisId: 0,
    yAxisId: 0,
    zAxisId: 0,
    legendType: 'circle',
    lineType: 'joint',
    lineJointType: 'linear',
    data: [],
    shape: 'circle',
    hide: false,
    isAnimationActive: !__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Global"].isSsr,
    animationBegin: 0,
    animationDuration: 400,
    animationEasing: 'linear',
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].scatter
};
function ScatterImpl(props) {
    var _resolveDefaultProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(props, defaultScatterProps), { animationBegin, animationDuration, animationEasing, hide, isAnimationActive, legendType, lineJointType, lineType, shape, xAxisId, yAxisId, zAxisId } = _resolveDefaultProps, everythingElse = _objectWithoutProperties(_resolveDefaultProps, _excluded3);
    var { needClip } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$GraphicalItemClipPath$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useNeedsClip"])(xAxisId, yAxisId);
    var cells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ScatterImpl.useMemo[cells]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findAllByType"])(props.children, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cell"])
    }["ScatterImpl.useMemo[cells]"], [
        props.children
    ]);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var points = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "ScatterImpl.useAppSelector[points]": (state)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$scatterSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectScatterPoints"])(state, xAxisId, yAxisId, zAxisId, props.id, cells, isPanorama);
        }
    }["ScatterImpl.useAppSelector[points]"]);
    if (needClip == null) {
        return null;
    }
    if (points == null) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetTooltipEntrySettings"], {
        fn: getTooltipEntrySettings,
        args: _objectSpread(_objectSpread({}, props), {}, {
            points
        })
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ScatterWithId, _extends({}, everythingElse, {
        xAxisId: xAxisId,
        yAxisId: yAxisId,
        zAxisId: zAxisId,
        lineType: lineType,
        lineJointType: lineJointType,
        legendType: legendType,
        shape: shape,
        hide: hide,
        isAnimationActive: isAnimationActive,
        animationBegin: animationBegin,
        animationDuration: animationDuration,
        animationEasing: animationEasing,
        points: points,
        needClip: needClip
    })));
}
function ScatterFn(outsideProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultScatterProps);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RegisterGraphicalItemId"], {
        id: props.id,
        type: "scatter"
    }, (id)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetLegendPayload"], {
            legendPayload: computeLegendPayloadFromScatterProps(props)
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SetCartesianGraphicalItem"], {
            type: "scatter",
            id: id,
            data: props.data,
            xAxisId: props.xAxisId,
            yAxisId: props.yAxisId,
            zAxisId: props.zAxisId,
            dataKey: props.dataKey,
            hide: props.hide,
            name: props.name,
            tooltipType: props.tooltipType,
            isPanorama: isPanorama
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](ScatterImpl, _extends({}, props, {
            id: id
        }))));
}
var Scatter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"](ScatterFn);
Scatter.displayName = 'Scatter';
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/getEquidistantTicks.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEquidistantTicks",
    ()=>getEquidistantTicks
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/TickUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getEveryNthWithCondition$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getEveryNthWithCondition.js [app-client] (ecmascript)");
;
;
function getEquidistantTicks(sign, boundaries, getTickSize, ticks, minTickGap) {
    // If the ticks are readonly, then the slice might not be necessary
    var result = (ticks || []).slice();
    var { start: initialStart, end } = boundaries;
    var index = 0;
    // Premature optimisation idea 1: Estimate a lower bound, and start from there.
    // For now, start from every tick
    var stepsize = 1;
    var start = initialStart;
    var _loop = function _loop() {
        // Given stepsize, evaluate whether every stepsize-th tick can be shown.
        // If it can not, then increase the stepsize by 1, and try again.
        var entry = ticks === null || ticks === void 0 ? void 0 : ticks[index];
        // Break condition - If we have evaluated all the ticks, then we are done.
        if (entry === undefined) {
            return {
                v: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getEveryNthWithCondition$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEveryNthWithCondition"])(ticks, stepsize)
            };
        }
        // Check if the element collides with the next element
        var i = index;
        var size;
        var getSize = ()=>{
            if (size === undefined) {
                size = getTickSize(entry, i);
            }
            return size;
        };
        var tickCoord = entry.coordinate;
        // We will always show the first tick.
        var isShow = index === 0 || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVisible"])(sign, tickCoord, getSize, start, end);
        if (!isShow) {
            // Start all over with a larger stepsize
            index = 0;
            start = initialStart;
            stepsize += 1;
        }
        if (isShow) {
            // If it can be shown, update the start
            start = tickCoord + sign * (getSize() / 2 + minTickGap);
            index += stepsize;
        }
    }, _ret;
    while(stepsize <= result.length){
        _ret = _loop();
        if (_ret) return _ret.v;
    }
    return [];
}
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/getTicks.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTicks",
    ()=>getTicks
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DOMUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/TickUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getEquidistantTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/getEquidistantTicks.js [app-client] (ecmascript)");
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
function getTicksEnd(sign, boundaries, getTickSize, ticks, minTickGap) {
    var result = (ticks || []).slice();
    var len = result.length;
    var { start } = boundaries;
    var { end } = boundaries;
    var _loop = function _loop(i) {
        var entry = result[i];
        var size;
        var getSize = ()=>{
            if (size === undefined) {
                size = getTickSize(entry, i);
            }
            return size;
        };
        if (i === len - 1) {
            var gap = sign * (entry.coordinate + sign * getSize() / 2 - end);
            result[i] = entry = _objectSpread(_objectSpread({}, entry), {}, {
                tickCoord: gap > 0 ? entry.coordinate - gap * sign : entry.coordinate
            });
        } else {
            result[i] = entry = _objectSpread(_objectSpread({}, entry), {}, {
                tickCoord: entry.coordinate
            });
        }
        if (entry.tickCoord != null) {
            var isShow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVisible"])(sign, entry.tickCoord, getSize, start, end);
            if (isShow) {
                end = entry.tickCoord - sign * (getSize() / 2 + minTickGap);
                result[i] = _objectSpread(_objectSpread({}, entry), {}, {
                    isShow: true
                });
            }
        }
    };
    for(var i = len - 1; i >= 0; i--){
        _loop(i);
    }
    return result;
}
function getTicksStart(sign, boundaries, getTickSize, ticks, minTickGap, preserveEnd) {
    // This method is mutating the array so clone is indeed necessary here
    var result = (ticks || []).slice();
    var len = result.length;
    var { start, end } = boundaries;
    if (preserveEnd) {
        // Try to guarantee the tail to be displayed
        var tail = ticks[len - 1];
        var tailSize = getTickSize(tail, len - 1);
        var tailGap = sign * (tail.coordinate + sign * tailSize / 2 - end);
        result[len - 1] = tail = _objectSpread(_objectSpread({}, tail), {}, {
            tickCoord: tailGap > 0 ? tail.coordinate - tailGap * sign : tail.coordinate
        });
        if (tail.tickCoord != null) {
            var isTailShow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVisible"])(sign, tail.tickCoord, ()=>tailSize, start, end);
            if (isTailShow) {
                end = tail.tickCoord - sign * (tailSize / 2 + minTickGap);
                result[len - 1] = _objectSpread(_objectSpread({}, tail), {}, {
                    isShow: true
                });
            }
        }
    }
    var count = preserveEnd ? len - 1 : len;
    var _loop2 = function _loop2(i) {
        var entry = result[i];
        var size;
        var getSize = ()=>{
            if (size === undefined) {
                size = getTickSize(entry, i);
            }
            return size;
        };
        if (i === 0) {
            var gap = sign * (entry.coordinate - sign * getSize() / 2 - start);
            result[i] = entry = _objectSpread(_objectSpread({}, entry), {}, {
                tickCoord: gap < 0 ? entry.coordinate - gap * sign : entry.coordinate
            });
        } else {
            result[i] = entry = _objectSpread(_objectSpread({}, entry), {}, {
                tickCoord: entry.coordinate
            });
        }
        if (entry.tickCoord != null) {
            var isShow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVisible"])(sign, entry.tickCoord, getSize, start, end);
            if (isShow) {
                start = entry.tickCoord + sign * (getSize() / 2 + minTickGap);
                result[i] = _objectSpread(_objectSpread({}, entry), {}, {
                    isShow: true
                });
            }
        }
    };
    for(var i = 0; i < count; i++){
        _loop2(i);
    }
    return result;
}
function getTicks(props, fontSize, letterSpacing) {
    var { tick, ticks, viewBox, minTickGap, orientation, interval, tickFormatter, unit, angle } = props;
    if (!ticks || !ticks.length || !tick) {
        return [];
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(interval) || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Global"].isSsr) {
        var _getNumberIntervalTic;
        return (_getNumberIntervalTic = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNumberIntervalTicks"])(ticks, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(interval) ? interval : 0)) !== null && _getNumberIntervalTic !== void 0 ? _getNumberIntervalTic : [];
    }
    var candidates = [];
    var sizeKey = orientation === 'top' || orientation === 'bottom' ? 'width' : 'height';
    var unitSize = unit && sizeKey === 'width' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStringSize"])(unit, {
        fontSize,
        letterSpacing
    }) : {
        width: 0,
        height: 0
    };
    var getTickSize = (content, index)=>{
        var value = typeof tickFormatter === 'function' ? tickFormatter(content.value, index) : content.value;
        // Recharts only supports angles when sizeKey === 'width'
        return sizeKey === 'width' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAngledTickWidth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStringSize"])(value, {
            fontSize,
            letterSpacing
        }), unitSize, angle) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStringSize"])(value, {
            fontSize,
            letterSpacing
        })[sizeKey];
    };
    var sign = ticks.length >= 2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(ticks[1].coordinate - ticks[0].coordinate) : 1;
    var boundaries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$TickUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTickBoundaries"])(viewBox, sign, sizeKey);
    if (interval === 'equidistantPreserveStart') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getEquidistantTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEquidistantTicks"])(sign, boundaries, getTickSize, ticks, minTickGap);
    }
    if (interval === 'preserveStart' || interval === 'preserveStartEnd') {
        candidates = getTicksStart(sign, boundaries, getTickSize, ticks, minTickGap, interval === 'preserveStartEnd');
    } else {
        candidates = getTicksEnd(sign, boundaries, getTickSize, ticks, minTickGap);
    }
    return candidates.filter((entry)=>entry.isShow);
}
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/CartesianAxis.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartesianAxis",
    ()=>CartesianAxis,
    "defaultCartesianAxisProps",
    ()=>defaultCartesianAxisProps
]);
/**
 * @fileOverview Cartesian Axis
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/get.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ShallowEqual.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Text.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Label.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/getTicks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$YAxisUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/YAxisUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-client] (ecmascript)");
var _excluded = [
    "axisLine",
    "width",
    "height",
    "className",
    "hide",
    "ticks",
    "axisType"
], _excluded2 = [
    "viewBox"
], _excluded3 = [
    "viewBox"
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
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
var defaultCartesianAxisProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    viewBox: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    // The orientation of axis
    orientation: 'bottom',
    // The ticks
    ticks: [],
    stroke: '#666',
    tickLine: true,
    axisLine: true,
    tick: true,
    mirror: false,
    minTickGap: 5,
    // The width or height of tick
    tickSize: 6,
    tickMargin: 2,
    interval: 'preserveEnd',
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].axis
};
/*
 * `viewBox` and `scale` are SVG attributes.
 * Recharts however - unfortunately - has its own attributes named `viewBox` and `scale`
 * that are completely different data shape and different purpose.
 */ function AxisLine(axisLineProps) {
    var { x, y, width, height, orientation, mirror, axisLine, otherSvgProps } = axisLineProps;
    if (!axisLine) {
        return null;
    }
    var props = _objectSpread(_objectSpread(_objectSpread({}, otherSvgProps), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(axisLine)), {}, {
        fill: 'none'
    });
    if (orientation === 'top' || orientation === 'bottom') {
        var needHeight = +(orientation === 'top' && !mirror || orientation === 'bottom' && mirror);
        props = _objectSpread(_objectSpread({}, props), {}, {
            x1: x,
            y1: y + needHeight * height,
            x2: x + width,
            y2: y + needHeight * height
        });
    } else {
        var needWidth = +(orientation === 'left' && !mirror || orientation === 'right' && mirror);
        props = _objectSpread(_objectSpread({}, props), {}, {
            x1: x + needWidth * width,
            y1: y,
            x2: x + needWidth * width,
            y2: y + height
        });
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("line", _extends({}, props, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('recharts-cartesian-axis-line', (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(axisLine, 'className'))
    }));
}
/**
 * Calculate the coordinates of endpoints in ticks.
 * @param data The data of a simple tick.
 * @param x The x-coordinate of the axis.
 * @param y The y-coordinate of the axis.
 * @param width The width of the axis.
 * @param height The height of the axis.
 * @param orientation The orientation of the axis.
 * @param tickSize The length of the tick line.
 * @param mirror If true, the ticks are mirrored.
 * @param tickMargin The margin between the tick line and the tick text.
 * @returns An object with `line` and `tick` coordinates.
 * `line` is the coordinates for the tick line, and `tick` is the coordinate for the tick text.
 */ function getTickLineCoord(data, x, y, width, height, orientation, tickSize, mirror, tickMargin) {
    var x1, x2, y1, y2, tx, ty;
    var sign = mirror ? -1 : 1;
    var finalTickSize = data.tickSize || tickSize;
    var tickCoord = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(data.tickCoord) ? data.tickCoord : data.coordinate;
    switch(orientation){
        case 'top':
            x1 = x2 = data.coordinate;
            y2 = y + +!mirror * height;
            y1 = y2 - sign * finalTickSize;
            ty = y1 - sign * tickMargin;
            tx = tickCoord;
            break;
        case 'left':
            y1 = y2 = data.coordinate;
            x2 = x + +!mirror * width;
            x1 = x2 - sign * finalTickSize;
            tx = x1 - sign * tickMargin;
            ty = tickCoord;
            break;
        case 'right':
            y1 = y2 = data.coordinate;
            x2 = x + +mirror * width;
            x1 = x2 + sign * finalTickSize;
            tx = x1 + sign * tickMargin;
            ty = tickCoord;
            break;
        default:
            x1 = x2 = data.coordinate;
            y2 = y + +mirror * height;
            y1 = y2 + sign * finalTickSize;
            ty = y1 + sign * tickMargin;
            tx = tickCoord;
            break;
    }
    return {
        line: {
            x1,
            y1,
            x2,
            y2
        },
        tick: {
            x: tx,
            y: ty
        }
    };
}
/**
 * @param orientation The orientation of the axis.
 * @param mirror If true, the ticks are mirrored.
 * @returns The text anchor of the tick.
 */ function getTickTextAnchor(orientation, mirror) {
    switch(orientation){
        case 'left':
            return mirror ? 'start' : 'end';
        case 'right':
            return mirror ? 'end' : 'start';
        default:
            return 'middle';
    }
}
/**
 * @param orientation The orientation of the axis.
 * @param mirror If true, the ticks are mirrored.
 * @returns The vertical text anchor of the tick.
 */ function getTickVerticalAnchor(orientation, mirror) {
    switch(orientation){
        case 'left':
        case 'right':
            return 'middle';
        case 'top':
            return mirror ? 'start' : 'end';
        default:
            return mirror ? 'end' : 'start';
    }
}
function TickItem(props) {
    var { option, tickProps, value } = props;
    var tickItem;
    var combinedClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(tickProps.className, 'recharts-cartesian-axis-tick-value');
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"](option)) {
        // @ts-expect-error element cloning is not typed
        tickItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"](option, _objectSpread(_objectSpread({}, tickProps), {}, {
            className: combinedClassName
        }));
    } else if (typeof option === 'function') {
        tickItem = option(_objectSpread(_objectSpread({}, tickProps), {}, {
            className: combinedClassName
        }));
    } else {
        var className = 'recharts-cartesian-axis-tick-value';
        if (typeof option !== 'boolean') {
            className = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(className, option === null || option === void 0 ? void 0 : option.className);
        }
        tickItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], _extends({}, tickProps, {
            className: className
        }), value);
    }
    return tickItem;
}
var Ticks = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { ticks = [], tick, tickLine, stroke, tickFormatter, unit, padding, tickTextProps, orientation, mirror, x, y, width, height, tickSize, tickMargin, fontSize, letterSpacing, getTicksConfig, events, axisType } = props;
    // @ts-expect-error some properties are optional in props but required in getTicks
    var finalTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTicks"])(_objectSpread(_objectSpread({}, getTicksConfig), {}, {
        ticks
    }), fontSize, letterSpacing);
    var textAnchor = getTickTextAnchor(orientation, mirror);
    var verticalAnchor = getTickVerticalAnchor(orientation, mirror);
    var axisProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(getTicksConfig);
    var customTickProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(tick);
    var tickLinePropsObject = {};
    if (typeof tickLine === 'object') {
        tickLinePropsObject = tickLine;
    }
    var tickLineProps = _objectSpread(_objectSpread({}, axisProps), {}, {
        fill: 'none'
    }, tickLinePropsObject);
    var tickLineCoords = finalTicks.map((entry)=>_objectSpread({
            entry
        }, getTickLineCoord(entry, x, y, width, height, orientation, tickSize, mirror, tickMargin)));
    var tickLines = tickLineCoords.map((_ref)=>{
        var { entry, line: lineCoord } = _ref;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
            className: "recharts-cartesian-axis-tick",
            key: "tick-".concat(entry.value, "-").concat(entry.coordinate, "-").concat(entry.tickCoord)
        }, tickLine && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("line", _extends({}, tickLineProps, lineCoord, {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('recharts-cartesian-axis-tick-line', (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(tickLine, 'className'))
        })));
    });
    var tickLabels = tickLineCoords.map((_ref2, i)=>{
        var { entry, tick: tickCoord } = _ref2;
        var tickProps = _objectSpread(_objectSpread(_objectSpread(_objectSpread({
            // @ts-expect-error textAnchor from axisProps is typed as `string` but Text wants type `TextAnchor`
            textAnchor,
            verticalAnchor
        }, axisProps), {}, {
            // @ts-expect-error customTickProps is contributing unknown props
            stroke: 'none',
            // @ts-expect-error customTickProps is contributing unknown props
            fill: stroke
        }, customTickProps), tickCoord), {}, {
            index: i,
            payload: entry,
            visibleTicksCount: finalTicks.length,
            tickFormatter,
            padding
        }, tickTextProps);
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], _extends({
            className: "recharts-cartesian-axis-tick-label",
            key: "tick-label-".concat(entry.value, "-").concat(entry.coordinate, "-").concat(entry.tickCoord)
        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adaptEventsOfChild"])(events, entry, i)), tick && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](TickItem, {
            option: tick,
            tickProps: tickProps,
            value: "".concat(typeof tickFormatter === 'function' ? tickFormatter(entry.value, i) : entry.value).concat(unit || '')
        }));
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-axis-ticks recharts-".concat(axisType, "-ticks")
    }, tickLabels.length > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].label
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-axis-tick-labels recharts-".concat(axisType, "-tick-labels"),
        ref: ref
    }, tickLabels)), tickLines.length > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-axis-tick-lines recharts-".concat(axisType, "-tick-lines")
    }, tickLines));
});
var CartesianAxisComponent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { axisLine, width, height, className, hide, ticks, axisType } = props, rest = _objectWithoutProperties(props, _excluded);
    var [fontSize, setFontSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    var [letterSpacing, setLetterSpacing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    var tickRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, {
        "CartesianAxisComponent.useImperativeHandle": ()=>({
                getCalculatedWidth: ({
                    "CartesianAxisComponent.useImperativeHandle": ()=>{
                        var _props$labelRef;
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$YAxisUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCalculatedYAxisWidth"])({
                            ticks: tickRefs.current,
                            label: (_props$labelRef = props.labelRef) === null || _props$labelRef === void 0 ? void 0 : _props$labelRef.current,
                            labelGapWithTick: 5,
                            tickSize: props.tickSize,
                            tickMargin: props.tickMargin
                        });
                    }
                })["CartesianAxisComponent.useImperativeHandle"]
            })
    }["CartesianAxisComponent.useImperativeHandle"]);
    var layerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartesianAxisComponent.useCallback[layerRef]": (el)=>{
            if (el) {
                var tickNodes = el.getElementsByClassName('recharts-cartesian-axis-tick-value');
                tickRefs.current = tickNodes;
                var tick = tickNodes[0];
                if (tick) {
                    var computedStyle = window.getComputedStyle(tick);
                    var calculatedFontSize = computedStyle.fontSize;
                    var calculatedLetterSpacing = computedStyle.letterSpacing;
                    if (calculatedFontSize !== fontSize || calculatedLetterSpacing !== letterSpacing) {
                        setFontSize(calculatedFontSize);
                        setLetterSpacing(calculatedLetterSpacing);
                    }
                }
            }
        }
    }["CartesianAxisComponent.useCallback[layerRef]"], [
        fontSize,
        letterSpacing
    ]);
    if (hide) {
        return null;
    }
    /*
   * This is different condition from what validateWidthHeight is doing;
   * the CartesianAxis does allow width or height to be undefined.
   */ if (width != null && width <= 0 || height != null && height <= 0) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: props.zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('recharts-cartesian-axis', className)
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](AxisLine, {
        x: props.x,
        y: props.y,
        width: width,
        height: height,
        orientation: props.orientation,
        mirror: props.mirror,
        axisLine: axisLine,
        otherSvgProps: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(props)
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](Ticks, {
        ref: layerRef,
        axisType: axisType,
        events: rest,
        fontSize: fontSize,
        getTicksConfig: props,
        height: props.height,
        letterSpacing: letterSpacing,
        mirror: props.mirror,
        orientation: props.orientation,
        padding: props.padding,
        stroke: props.stroke,
        tick: props.tick,
        tickFormatter: props.tickFormatter,
        tickLine: props.tickLine,
        tickMargin: props.tickMargin,
        tickSize: props.tickSize,
        tickTextProps: props.tickTextProps,
        ticks: ticks,
        unit: props.unit,
        width: props.width,
        x: props.x,
        y: props.y
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianLabelContextProvider"], {
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        lowerWidth: props.width,
        upperWidth: props.width
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianLabelFromLabelProp"], {
        label: props.label,
        labelRef: props.labelRef
    }), props.children)));
});
var MemoCartesianAxis = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"](CartesianAxisComponent, (prevProps, nextProps)=>{
    var { viewBox: prevViewBox } = prevProps, prevRestProps = _objectWithoutProperties(prevProps, _excluded2);
    var { viewBox: nextViewBox } = nextProps, nextRestProps = _objectWithoutProperties(nextProps, _excluded3);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqual"])(prevViewBox, nextViewBox) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqual"])(prevRestProps, nextRestProps);
});
var CartesianAxis = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"]((outsideProps, ref)=>{
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultCartesianAxisProps);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](MemoCartesianAxis, _extends({}, props, {
        ref: ref
    }));
});
CartesianAxis.displayName = 'CartesianAxis';
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/XAxis.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "XAxis",
    ()=>XAxis
]);
/**
 * @fileOverview X Axis
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/CartesianAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/cartesianAxisSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ShallowEqual.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var _excluded = [
    "dangerouslySetInnerHTML",
    "ticks"
], _excluded2 = [
    "id"
], _excluded3 = [
    "domain"
], _excluded4 = [
    "domain"
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
;
;
;
;
;
;
;
;
function SetXAxisSettings(settings) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetXAxisSettings.useLayoutEffect": ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addXAxis"])(settings));
            return ({
                "SetXAxisSettings.useLayoutEffect": ()=>{
                    dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeXAxis"])(settings));
                }
            })["SetXAxisSettings.useLayoutEffect"];
        }
    }["SetXAxisSettings.useLayoutEffect"], [
        settings,
        dispatch
    ]);
    return null;
}
var XAxisImpl = (props)=>{
    var { xAxisId, className } = props;
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisViewBox"]);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var axisType = 'xAxis';
    var scale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "XAxisImpl.useAppSelector[scale]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisScale"])(state, axisType, xAxisId, isPanorama)
    }["XAxisImpl.useAppSelector[scale]"]);
    var cartesianTickItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "XAxisImpl.useAppSelector[cartesianTickItems]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfAxis"])(state, axisType, xAxisId, isPanorama)
    }["XAxisImpl.useAppSelector[cartesianTickItems]"]);
    var axisSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "XAxisImpl.useAppSelector[axisSize]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectXAxisSize"])(state, xAxisId)
    }["XAxisImpl.useAppSelector[axisSize]"]);
    var position = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "XAxisImpl.useAppSelector[position]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectXAxisPosition"])(state, xAxisId)
    }["XAxisImpl.useAppSelector[position]"]);
    /*
   * Here we select settings from the store and prefer to use them instead of the actual props
   * so that the chart is consistent. If we used the props directly, some components will use axis settings
   * from state and some from props and because there is a render step between these two, they might be showing different things.
   * https://github.com/recharts/recharts/issues/6257
   */ var synchronizedSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "XAxisImpl.useAppSelector[synchronizedSettings]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectXAxisSettingsNoDefaults"])(state, xAxisId)
    }["XAxisImpl.useAppSelector[synchronizedSettings]"]);
    if (axisSize == null || position == null || synchronizedSettings == null) {
        return null;
    }
    var { dangerouslySetInnerHTML, ticks } = props, allOtherProps = _objectWithoutProperties(props, _excluded);
    var { id } = synchronizedSettings, restSynchronizedSettings = _objectWithoutProperties(synchronizedSettings, _excluded2);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianAxis"], _extends({}, allOtherProps, restSynchronizedSettings, {
        scale: scale,
        x: position.x,
        y: position.y,
        width: axisSize.width,
        height: axisSize.height,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("recharts-".concat(axisType, " ").concat(axisType), className),
        viewBox: viewBox,
        ticks: cartesianTickItems,
        axisType: axisType
    }));
};
var xAxisDefaultProps = {
    allowDataOverflow: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].allowDataOverflow,
    allowDecimals: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].allowDecimals,
    allowDuplicatedCategory: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].allowDuplicatedCategory,
    height: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].height,
    hide: false,
    mirror: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].mirror,
    orientation: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].orientation,
    padding: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].padding,
    reversed: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].reversed,
    scale: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].scale,
    tickCount: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].tickCount,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitXAxis"].type,
    xAxisId: 0
};
var XAxisSettingsDispatcher = (outsideProps)=>{
    var _props$interval, _props$includeHidden, _props$angle, _props$minTickGap, _props$tick;
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, xAxisDefaultProps);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](SetXAxisSettings, {
        interval: (_props$interval = props.interval) !== null && _props$interval !== void 0 ? _props$interval : 'preserveEnd',
        id: props.xAxisId,
        scale: props.scale,
        type: props.type,
        padding: props.padding,
        allowDataOverflow: props.allowDataOverflow,
        domain: props.domain,
        dataKey: props.dataKey,
        allowDuplicatedCategory: props.allowDuplicatedCategory,
        allowDecimals: props.allowDecimals,
        tickCount: props.tickCount,
        includeHidden: (_props$includeHidden = props.includeHidden) !== null && _props$includeHidden !== void 0 ? _props$includeHidden : false,
        reversed: props.reversed,
        ticks: props.ticks,
        height: props.height,
        orientation: props.orientation,
        mirror: props.mirror,
        hide: props.hide,
        unit: props.unit,
        name: props.name,
        angle: (_props$angle = props.angle) !== null && _props$angle !== void 0 ? _props$angle : 0,
        minTickGap: (_props$minTickGap = props.minTickGap) !== null && _props$minTickGap !== void 0 ? _props$minTickGap : 5,
        tick: (_props$tick = props.tick) !== null && _props$tick !== void 0 ? _props$tick : true,
        tickFormatter: props.tickFormatter
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](XAxisImpl, props));
};
var XAxisMemoComparator = (prevProps, nextProps)=>{
    var { domain: prevDomain } = prevProps, prevRest = _objectWithoutProperties(prevProps, _excluded3);
    var { domain: nextDomain } = nextProps, nextRest = _objectWithoutProperties(nextProps, _excluded4);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqual"])(prevRest, nextRest)) {
        return false;
    }
    if (Array.isArray(prevDomain) && prevDomain.length === 2 && Array.isArray(nextDomain) && nextDomain.length === 2) {
        return prevDomain[0] === nextDomain[0] && prevDomain[1] === nextDomain[1];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqual"])({
        domain: prevDomain
    }, {
        domain: nextDomain
    });
};
var XAxis = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"](XAxisSettingsDispatcher, XAxisMemoComparator);
XAxis.displayName = 'XAxis';
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/YAxis.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "YAxis",
    ()=>YAxis,
    "yAxisDefaultProps",
    ()=>yAxisDefaultProps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/CartesianAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/cartesianAxisSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Label.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ShallowEqual.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var _excluded = [
    "dangerouslySetInnerHTML",
    "ticks"
], _excluded2 = [
    "id"
], _excluded3 = [
    "domain"
], _excluded4 = [
    "domain"
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
;
;
;
;
;
;
;
;
;
function SetYAxisSettings(settings) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetYAxisSettings.useLayoutEffect": ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addYAxis"])(settings));
            return ({
                "SetYAxisSettings.useLayoutEffect": ()=>{
                    dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeYAxis"])(settings));
                }
            })["SetYAxisSettings.useLayoutEffect"];
        }
    }["SetYAxisSettings.useLayoutEffect"], [
        settings,
        dispatch
    ]);
    return null;
}
var YAxisImpl = (props)=>{
    var { yAxisId, className, width, label } = props;
    var cartesianAxisRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    var labelRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisViewBox"]);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var axisType = 'yAxis';
    var scale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "YAxisImpl.useAppSelector[scale]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisScale"])(state, axisType, yAxisId, isPanorama)
    }["YAxisImpl.useAppSelector[scale]"]);
    var axisSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "YAxisImpl.useAppSelector[axisSize]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectYAxisSize"])(state, yAxisId)
    }["YAxisImpl.useAppSelector[axisSize]"]);
    var position = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "YAxisImpl.useAppSelector[position]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectYAxisPosition"])(state, yAxisId)
    }["YAxisImpl.useAppSelector[position]"]);
    var cartesianTickItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "YAxisImpl.useAppSelector[cartesianTickItems]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfAxis"])(state, axisType, yAxisId, isPanorama)
    }["YAxisImpl.useAppSelector[cartesianTickItems]"]);
    /*
   * Here we select settings from the store and prefer to use them instead of the actual props
   * so that the chart is consistent. If we used the props directly, some components will use axis settings
   * from state and some from props and because there is a render step between these two, they might be showing different things.
   * https://github.com/recharts/recharts/issues/6257
   */ var synchronizedSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "YAxisImpl.useAppSelector[synchronizedSettings]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectYAxisSettingsNoDefaults"])(state, yAxisId)
    }["YAxisImpl.useAppSelector[synchronizedSettings]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "YAxisImpl.useLayoutEffect": ()=>{
            // No dynamic width calculation is done when width !== 'auto'
            // or when a function/react element is used for label
            if (width !== 'auto' || !axisSize || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLabelContentAFunction"])(label) || /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(label) || synchronizedSettings == null) {
                return;
            }
            var axisComponent = cartesianAxisRef.current;
            if (!axisComponent) {
                return;
            }
            var updatedYAxisWidth = axisComponent.getCalculatedWidth();
            // if the width has changed, dispatch an action to update the width
            if (Math.round(axisSize.width) !== Math.round(updatedYAxisWidth)) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateYAxisWidth"])({
                    id: yAxisId,
                    width: updatedYAxisWidth
                }));
            }
        }
    }["YAxisImpl.useLayoutEffect"], [
        // The dependency on cartesianAxisRef.current is not needed because useLayoutEffect will run after every render.
        // The ref will be populated by then.
        // To re-run this effect when ticks change, we can depend on the ticks array from the store.
        cartesianTickItems,
        axisSize,
        dispatch,
        label,
        yAxisId,
        width,
        synchronizedSettings
    ]);
    if (axisSize == null || position == null || synchronizedSettings == null) {
        return null;
    }
    var { dangerouslySetInnerHTML, ticks } = props, allOtherProps = _objectWithoutProperties(props, _excluded);
    var { id } = synchronizedSettings, restSynchronizedSettings = _objectWithoutProperties(synchronizedSettings, _excluded2);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianAxis"], _extends({}, allOtherProps, restSynchronizedSettings, {
        ref: cartesianAxisRef,
        labelRef: labelRef,
        scale: scale,
        x: position.x,
        y: position.y,
        tickTextProps: width === 'auto' ? {
            width: undefined
        } : {
            width
        },
        width: axisSize.width,
        height: axisSize.height,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("recharts-".concat(axisType, " ").concat(axisType), className),
        viewBox: viewBox,
        ticks: cartesianTickItems,
        axisType: axisType
    }));
};
var yAxisDefaultProps = {
    allowDataOverflow: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].allowDataOverflow,
    allowDecimals: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].allowDecimals,
    allowDuplicatedCategory: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].allowDuplicatedCategory,
    hide: false,
    mirror: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].mirror,
    orientation: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].orientation,
    padding: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].padding,
    reversed: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].reversed,
    scale: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].scale,
    tickCount: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].tickCount,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].type,
    width: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["implicitYAxis"].width,
    yAxisId: 0
};
var YAxisSettingsDispatcher = (outsideProps)=>{
    var _props$interval, _props$includeHidden, _props$angle, _props$minTickGap, _props$tick;
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, yAxisDefaultProps);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](SetYAxisSettings, {
        interval: (_props$interval = props.interval) !== null && _props$interval !== void 0 ? _props$interval : 'preserveEnd',
        id: props.yAxisId,
        scale: props.scale,
        type: props.type,
        domain: props.domain,
        allowDataOverflow: props.allowDataOverflow,
        dataKey: props.dataKey,
        allowDuplicatedCategory: props.allowDuplicatedCategory,
        allowDecimals: props.allowDecimals,
        tickCount: props.tickCount,
        padding: props.padding,
        includeHidden: (_props$includeHidden = props.includeHidden) !== null && _props$includeHidden !== void 0 ? _props$includeHidden : false,
        reversed: props.reversed,
        ticks: props.ticks,
        width: props.width,
        orientation: props.orientation,
        mirror: props.mirror,
        hide: props.hide,
        unit: props.unit,
        name: props.name,
        angle: (_props$angle = props.angle) !== null && _props$angle !== void 0 ? _props$angle : 0,
        minTickGap: (_props$minTickGap = props.minTickGap) !== null && _props$minTickGap !== void 0 ? _props$minTickGap : 5,
        tick: (_props$tick = props.tick) !== null && _props$tick !== void 0 ? _props$tick : true,
        tickFormatter: props.tickFormatter
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](YAxisImpl, props));
};
var YAxisMemoComparator = (prevProps, nextProps)=>{
    var { domain: prevDomain } = prevProps, prevRest = _objectWithoutProperties(prevProps, _excluded3);
    var { domain: nextDomain } = nextProps, nextRest = _objectWithoutProperties(nextProps, _excluded4);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqual"])(prevRest, nextRest)) {
        return false;
    }
    if (Array.isArray(prevDomain) && prevDomain.length === 2 && Array.isArray(nextDomain) && nextDomain.length === 2) {
        return prevDomain[0] === nextDomain[0] && prevDomain[1] === nextDomain[1];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ShallowEqual$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shallowEqual"])({
        domain: prevDomain
    }, {
        domain: nextDomain
    });
};
var YAxis = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"](YAxisSettingsDispatcher, YAxisMemoComparator);
YAxis.displayName = 'YAxis';
}),
"[project]/pwa/node_modules/recharts/es6/cartesian/CartesianGrid.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartesianGrid",
    ()=>CartesianGrid
]);
/**
 * @fileOverview Cartesian Grid
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LogUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/LogUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/getTicks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/CartesianAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-client] (ecmascript)");
var _excluded = [
    "x1",
    "y1",
    "x2",
    "y2",
    "key"
], _excluded2 = [
    "offset"
], _excluded3 = [
    "xAxisId",
    "yAxisId"
], _excluded4 = [
    "xAxisId",
    "yAxisId"
];
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
;
;
;
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
 * The <CartesianGrid horizontal
 */ var Background = (props)=>{
    var { fill } = props;
    if (!fill || fill === 'none') {
        return null;
    }
    var { fillOpacity, x, y, width, height, ry } = props;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("rect", {
        x: x,
        y: y,
        ry: ry,
        width: width,
        height: height,
        stroke: "none",
        fill: fill,
        fillOpacity: fillOpacity,
        className: "recharts-cartesian-grid-bg"
    });
};
function LineItem(_ref) {
    var { option, lineItemProps } = _ref;
    var lineItem;
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"](option)) {
        // @ts-expect-error typescript does not see the props type when cloning an element
        lineItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"](option, lineItemProps);
    } else if (typeof option === 'function') {
        lineItem = option(lineItemProps);
    } else {
        var _svgPropertiesNoEvent;
        var { x1, y1, x2, y2, key } = lineItemProps, others = _objectWithoutProperties(lineItemProps, _excluded);
        var _ref2 = (_svgPropertiesNoEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(others)) !== null && _svgPropertiesNoEvent !== void 0 ? _svgPropertiesNoEvent : {}, { offset: __ } = _ref2, restOfFilteredProps = _objectWithoutProperties(_ref2, _excluded2);
        lineItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("line", _extends({}, restOfFilteredProps, {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            fill: "none",
            key: key
        }));
    }
    return lineItem;
}
function HorizontalGridLines(props) {
    var { x, width, horizontal = true, horizontalPoints } = props;
    if (!horizontal || !horizontalPoints || !horizontalPoints.length) {
        return null;
    }
    var { xAxisId, yAxisId } = props, otherLineItemProps = _objectWithoutProperties(props, _excluded3);
    var items = horizontalPoints.map((entry, i)=>{
        var lineItemProps = _objectSpread(_objectSpread({}, otherLineItemProps), {}, {
            x1: x,
            y1: entry,
            x2: x + width,
            y2: entry,
            key: "line-".concat(i),
            index: i
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](LineItem, {
            key: "line-".concat(i),
            option: horizontal,
            lineItemProps: lineItemProps
        });
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-grid-horizontal"
    }, items);
}
function VerticalGridLines(props) {
    var { y, height, vertical = true, verticalPoints } = props;
    if (!vertical || !verticalPoints || !verticalPoints.length) {
        return null;
    }
    var { xAxisId, yAxisId } = props, otherLineItemProps = _objectWithoutProperties(props, _excluded4);
    var items = verticalPoints.map((entry, i)=>{
        var lineItemProps = _objectSpread(_objectSpread({}, otherLineItemProps), {}, {
            x1: entry,
            y1: y,
            x2: entry,
            y2: y + height,
            key: "line-".concat(i),
            index: i
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](LineItem, {
            option: vertical,
            lineItemProps: lineItemProps,
            key: "line-".concat(i)
        });
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-grid-vertical"
    }, items);
}
function HorizontalStripes(props) {
    var { horizontalFill, fillOpacity, x, y, width, height, horizontalPoints, horizontal = true } = props;
    if (!horizontal || !horizontalFill || !horizontalFill.length || horizontalPoints == null) {
        return null;
    }
    var roundedSortedHorizontalPoints = horizontalPoints.map((e)=>Math.round(e + y - y)).sort((a, b)=>a - b);
    // Why is this condition `!==` instead of `<=` ?
    if (y !== roundedSortedHorizontalPoints[0]) {
        roundedSortedHorizontalPoints.unshift(0);
    }
    var items = roundedSortedHorizontalPoints.map((entry, i)=>{
        // Why do we strip only the last stripe if it is invisible, and not all invisible stripes?
        var lastStripe = !roundedSortedHorizontalPoints[i + 1];
        var lineHeight = lastStripe ? y + height - entry : roundedSortedHorizontalPoints[i + 1] - entry;
        if (lineHeight <= 0) {
            return null;
        }
        var colorIndex = i % horizontalFill.length;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("rect", {
            key: "react-".concat(i),
            y: entry,
            x: x,
            height: lineHeight,
            width: width,
            stroke: "none",
            fill: horizontalFill[colorIndex],
            fillOpacity: fillOpacity,
            className: "recharts-cartesian-grid-bg"
        });
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-gridstripes-horizontal"
    }, items);
}
function VerticalStripes(props) {
    var { vertical = true, verticalFill, fillOpacity, x, y, width, height, verticalPoints } = props;
    if (!vertical || !verticalFill || !verticalFill.length) {
        return null;
    }
    var roundedSortedVerticalPoints = verticalPoints.map((e)=>Math.round(e + x - x)).sort((a, b)=>a - b);
    if (x !== roundedSortedVerticalPoints[0]) {
        roundedSortedVerticalPoints.unshift(0);
    }
    var items = roundedSortedVerticalPoints.map((entry, i)=>{
        var lastStripe = !roundedSortedVerticalPoints[i + 1];
        var lineWidth = lastStripe ? x + width - entry : roundedSortedVerticalPoints[i + 1] - entry;
        if (lineWidth <= 0) {
            return null;
        }
        var colorIndex = i % verticalFill.length;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("rect", {
            key: "react-".concat(i),
            x: entry,
            y: y,
            width: lineWidth,
            height: height,
            stroke: "none",
            fill: verticalFill[colorIndex],
            fillOpacity: fillOpacity,
            className: "recharts-cartesian-grid-bg"
        });
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-gridstripes-vertical"
    }, items);
}
var defaultVerticalCoordinatesGenerator = (_ref3, syncWithTicks)=>{
    var { xAxis, width, height, offset } = _ref3;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCoordinatesOfGrid"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTicks"])(_objectSpread(_objectSpread(_objectSpread({}, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultCartesianAxisProps"]), xAxis), {}, {
        ticks: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTicksOfAxis"])(xAxis, true),
        viewBox: {
            x: 0,
            y: 0,
            width,
            height
        }
    })), offset.left, offset.left + offset.width, syncWithTicks);
};
var defaultHorizontalCoordinatesGenerator = (_ref4, syncWithTicks)=>{
    var { yAxis, width, height, offset } = _ref4;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCoordinatesOfGrid"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$getTicks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTicks"])(_objectSpread(_objectSpread(_objectSpread({}, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultCartesianAxisProps"]), yAxis), {}, {
        ticks: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTicksOfAxis"])(yAxis, true),
        viewBox: {
            x: 0,
            y: 0,
            width,
            height
        }
    })), offset.top, offset.top + offset.height, syncWithTicks);
};
var defaultCartesianGridProps = {
    horizontal: true,
    vertical: true,
    // The ordinates of horizontal grid lines
    horizontalPoints: [],
    // The abscissas of vertical grid lines
    verticalPoints: [],
    stroke: '#ccc',
    fill: 'none',
    // The fill of colors of grid lines
    verticalFill: [],
    horizontalFill: [],
    xAxisId: 0,
    yAxisId: 0,
    syncWithTicks: false,
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"].grid
};
function CartesianGrid(props) {
    var chartWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartWidth"])();
    var chartHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartHeight"])();
    var offset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOffsetInternal"])();
    var propsIncludingDefaults = _objectSpread(_objectSpread({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(props, defaultCartesianGridProps)), {}, {
        x: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(props.x) ? props.x : offset.left,
        y: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(props.y) ? props.y : offset.top,
        width: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(props.width) ? props.width : offset.width,
        height: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(props.height) ? props.height : offset.height
    });
    var { xAxisId, yAxisId, x, y, width, height, syncWithTicks, horizontalValues, verticalValues } = propsIncludingDefaults;
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var xAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "CartesianGrid.useAppSelector[xAxis]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisPropsNeededForCartesianGridTicksGenerator"])(state, 'xAxis', xAxisId, isPanorama)
    }["CartesianGrid.useAppSelector[xAxis]"]);
    var yAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "CartesianGrid.useAppSelector[yAxis]": (state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisPropsNeededForCartesianGridTicksGenerator"])(state, 'yAxis', yAxisId, isPanorama)
    }["CartesianGrid.useAppSelector[yAxis]"]);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPositiveNumber"])(width) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPositiveNumber"])(height) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(x) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(y)) {
        return null;
    }
    /*
   * verticalCoordinatesGenerator and horizontalCoordinatesGenerator are defined
   * outside the propsIncludingDefaults because they were never part of the original props
   * and they were never passed as a prop down to horizontal/vertical custom elements.
   * If we add these two to propsIncludingDefaults then we are changing public API.
   * Not a bad thing per se but also not necessary.
   */ var verticalCoordinatesGenerator = propsIncludingDefaults.verticalCoordinatesGenerator || defaultVerticalCoordinatesGenerator;
    var horizontalCoordinatesGenerator = propsIncludingDefaults.horizontalCoordinatesGenerator || defaultHorizontalCoordinatesGenerator;
    var { horizontalPoints, verticalPoints } = propsIncludingDefaults;
    // No horizontal points are specified
    if ((!horizontalPoints || !horizontalPoints.length) && typeof horizontalCoordinatesGenerator === 'function') {
        var isHorizontalValues = horizontalValues && horizontalValues.length;
        var generatorResult = horizontalCoordinatesGenerator({
            yAxis: yAxis ? _objectSpread(_objectSpread({}, yAxis), {}, {
                ticks: isHorizontalValues ? horizontalValues : yAxis.ticks
            }) : undefined,
            width: chartWidth !== null && chartWidth !== void 0 ? chartWidth : width,
            height: chartHeight !== null && chartHeight !== void 0 ? chartHeight : height,
            offset
        }, isHorizontalValues ? true : syncWithTicks);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LogUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])(Array.isArray(generatorResult), "horizontalCoordinatesGenerator should return Array but instead it returned [".concat(typeof generatorResult, "]"));
        if (Array.isArray(generatorResult)) {
            horizontalPoints = generatorResult;
        }
    }
    // No vertical points are specified
    if ((!verticalPoints || !verticalPoints.length) && typeof verticalCoordinatesGenerator === 'function') {
        var isVerticalValues = verticalValues && verticalValues.length;
        var _generatorResult = verticalCoordinatesGenerator({
            xAxis: xAxis ? _objectSpread(_objectSpread({}, xAxis), {}, {
                ticks: isVerticalValues ? verticalValues : xAxis.ticks
            }) : undefined,
            width: chartWidth !== null && chartWidth !== void 0 ? chartWidth : width,
            height: chartHeight !== null && chartHeight !== void 0 ? chartHeight : height,
            offset
        }, isVerticalValues ? true : syncWithTicks);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LogUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])(Array.isArray(_generatorResult), "verticalCoordinatesGenerator should return Array but instead it returned [".concat(typeof _generatorResult, "]"));
        if (Array.isArray(_generatorResult)) {
            verticalPoints = _generatorResult;
        }
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: propsIncludingDefaults.zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"]("g", {
        className: "recharts-cartesian-grid"
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](Background, {
        fill: propsIncludingDefaults.fill,
        fillOpacity: propsIncludingDefaults.fillOpacity,
        x: propsIncludingDefaults.x,
        y: propsIncludingDefaults.y,
        width: propsIncludingDefaults.width,
        height: propsIncludingDefaults.height,
        ry: propsIncludingDefaults.ry
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](HorizontalStripes, _extends({}, propsIncludingDefaults, {
        horizontalPoints: horizontalPoints
    })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](VerticalStripes, _extends({}, propsIncludingDefaults, {
        verticalPoints: verticalPoints
    })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](HorizontalGridLines, _extends({}, propsIncludingDefaults, {
        offset: offset,
        horizontalPoints: horizontalPoints,
        xAxis: xAxis,
        yAxis: yAxis
    })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](VerticalGridLines, _extends({}, propsIncludingDefaults, {
        offset: offset,
        verticalPoints: verticalPoints,
        xAxis: xAxis,
        yAxis: yAxis
    }))));
}
CartesianGrid.displayName = 'CartesianGrid';
}),
]);

//# sourceMappingURL=7dc3a_recharts_es6_cartesian_b77760cf._.js.map