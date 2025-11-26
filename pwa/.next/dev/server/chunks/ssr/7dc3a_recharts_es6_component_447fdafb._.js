module.exports = [
"[project]/pwa/node_modules/recharts/es6/component/responsiveContainerUtils.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateChartDimensions",
    ()=>calculateChartDimensions,
    "getDefaultWidthAndHeight",
    ()=>getDefaultWidthAndHeight,
    "getInnerDivStyle",
    ()=>getInnerDivStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
;
var calculateChartDimensions = (containerWidth, containerHeight, props)=>{
    var { width = '100%', height = '100%', aspect, maxHeight } = props;
    /*
   * The containerWidth and containerHeight are already percentage based because it's set as that percentage in CSS.
   * Means we don't have to calculate percentages here.
   */ var calculatedWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(width) ? containerWidth : Number(width);
    var calculatedHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(height) ? containerHeight : Number(height);
    if (aspect && aspect > 0) {
        // Preserve the desired aspect ratio
        if (calculatedWidth) {
            // Will default to using width for aspect ratio
            calculatedHeight = calculatedWidth / aspect;
        } else if (calculatedHeight) {
            // But we should also take height into consideration
            calculatedWidth = calculatedHeight * aspect;
        }
        // if maxHeight is set, overwrite if calculatedHeight is greater than maxHeight
        if (maxHeight && calculatedHeight != null && calculatedHeight > maxHeight) {
            calculatedHeight = maxHeight;
        }
    }
    return {
        calculatedWidth,
        calculatedHeight
    };
};
var bothOverflow = {
    width: 0,
    height: 0,
    overflow: 'visible'
};
var overflowX = {
    width: 0,
    overflowX: 'visible'
};
var overflowY = {
    height: 0,
    overflowY: 'visible'
};
var noStyle = {};
var getInnerDivStyle = (props)=>{
    var { width, height } = props;
    var isWidthPercent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(width);
    var isHeightPercent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(height);
    if (isWidthPercent && isHeightPercent) {
        return bothOverflow;
    }
    if (isWidthPercent) {
        return overflowX;
    }
    if (isHeightPercent) {
        return overflowY;
    }
    return noStyle;
};
function getDefaultWidthAndHeight(_ref) {
    var { width, height, aspect } = _ref;
    var calculatedWidth = width;
    var calculatedHeight = height;
    if (calculatedWidth === undefined && calculatedHeight === undefined) {
        calculatedWidth = '100%';
        calculatedHeight = '100%';
    } else if (calculatedWidth === undefined) {
        calculatedWidth = aspect && aspect > 0 ? undefined : '100%';
    } else if (calculatedHeight === undefined) {
        calculatedHeight = aspect && aspect > 0 ? undefined : '100%';
    }
    return {
        width: calculatedWidth,
        height: calculatedHeight
    };
}
}),
"[project]/pwa/node_modules/recharts/es6/component/ResponsiveContainer.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ResponsiveContainer",
    ()=>ResponsiveContainer,
    "useResponsiveContainerContext",
    ()=>useResponsiveContainerContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$throttle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/throttle.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LogUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/LogUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$responsiveContainerUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/responsiveContainerUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-ssr] (ecmascript)");
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
var ResponsiveContainerContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    width: -1,
    height: -1
});
function isAcceptableSize(size) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(size.width) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(size.height);
}
function ResponsiveContainerContextProvider(_ref) {
    var { children, width, height } = _ref;
    var size = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            width,
            height
        }), [
        width,
        height
    ]);
    if (!isAcceptableSize(size)) {
        /*
     * Don't render the container if width or height is non-positive because
     * in that case the chart will not be rendered properly anyway.
     * We will instead wait for the next resize event to provide the correct dimensions.
     */ return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ResponsiveContainerContext.Provider, {
        value: size
    }, children);
}
var useResponsiveContainerContext = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ResponsiveContainerContext);
var SizeDetectorContainer = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((_ref2, ref)=>{
    var { aspect, initialDimension = {
        width: -1,
        height: -1
    }, width, height, /*
     * default min-width to 0 if not specified - 'auto' causes issues with flexbox
     * https://github.com/recharts/recharts/issues/172
     */ minWidth = 0, minHeight, maxHeight, children, debounce = 0, id, className, onResize, style = {} } = _ref2;
    var containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    /*
   * We are using a ref to avoid re-creating the ResizeObserver when the onResize function changes.
   * The ref is updated on every render, so the latest onResize function is always available in the effect.
   */ var onResizeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    onResizeRef.current = onResize;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, ()=>containerRef.current);
    var [sizes, setSizes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        containerWidth: initialDimension.width,
        containerHeight: initialDimension.height
    });
    var setContainerSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((newWidth, newHeight)=>{
        setSizes((prevState)=>{
            var roundedWidth = Math.round(newWidth);
            var roundedHeight = Math.round(newHeight);
            if (prevState.containerWidth === roundedWidth && prevState.containerHeight === roundedHeight) {
                return prevState;
            }
            return {
                containerWidth: roundedWidth,
                containerHeight: roundedHeight
            };
        });
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (containerRef.current == null || typeof ResizeObserver === 'undefined') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["noop"];
        }
        var callback = (entries)=>{
            var _onResizeRef$current;
            var { width: containerWidth, height: containerHeight } = entries[0].contentRect;
            setContainerSize(containerWidth, containerHeight);
            (_onResizeRef$current = onResizeRef.current) === null || _onResizeRef$current === void 0 || _onResizeRef$current.call(onResizeRef, containerWidth, containerHeight);
        };
        if (debounce > 0) {
            callback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$throttle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(callback, debounce, {
                trailing: true,
                leading: false
            });
        }
        var observer = new ResizeObserver(callback);
        var { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
        setContainerSize(containerWidth, containerHeight);
        observer.observe(containerRef.current);
        return ()=>{
            observer.disconnect();
        };
    }, [
        setContainerSize,
        debounce
    ]);
    var { containerWidth, containerHeight } = sizes;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LogUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(!aspect || aspect > 0, 'The aspect(%s) must be greater than zero.', aspect);
    var { calculatedWidth, calculatedHeight } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$responsiveContainerUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateChartDimensions"])(containerWidth, containerHeight, {
        width,
        height,
        aspect,
        maxHeight
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$LogUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(calculatedWidth != null && calculatedWidth > 0 || calculatedHeight != null && calculatedHeight > 0, "The width(%s) and height(%s) of chart should be greater than 0,\n       please check the style of container, or the props width(%s) and height(%s),\n       or add a minWidth(%s) or minHeight(%s) or use aspect(%s) to control the\n       height and width.", calculatedWidth, calculatedHeight, width, height, minWidth, minHeight, aspect);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", {
        id: id ? "".concat(id) : undefined,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-responsive-container', className),
        style: _objectSpread(_objectSpread({}, style), {}, {
            width,
            height,
            minWidth,
            minHeight,
            maxHeight
        }),
        ref: containerRef
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", {
        style: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$responsiveContainerUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getInnerDivStyle"])({
            width,
            height
        })
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ResponsiveContainerContextProvider, {
        width: calculatedWidth,
        height: calculatedHeight
    }, children)));
});
var ResponsiveContainer = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var responsiveContainerContext = useResponsiveContainerContext();
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(responsiveContainerContext.width) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(responsiveContainerContext.height)) {
        /*
     * If we detect that we are already inside another ResponsiveContainer,
     * we do not attempt to add another layer of responsiveness.
     */ return props.children;
    }
    var { width, height } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$responsiveContainerUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDefaultWidthAndHeight"])({
        width: props.width,
        height: props.height,
        aspect: props.aspect
    });
    /*
   * Let's try to get the calculated dimensions without having the div container set up.
   * Sometimes this does produce fixed, positive dimensions. If so, we can skip rendering the div and monitoring its size.
   */ var { calculatedWidth, calculatedHeight } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$responsiveContainerUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateChartDimensions"])(undefined, undefined, {
        width,
        height,
        aspect: props.aspect,
        maxHeight: props.maxHeight
    });
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(calculatedWidth) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(calculatedHeight)) {
        /*
     * If it just so happens that the combination of width, height, and aspect ratio
     * results in fixed dimensions, then we don't need to monitor the container's size.
     * We can just provide these fixed dimensions to the context.
     *
     * Note that here we are not checking for positive numbers;
     * if the user provides a zero or negative width/height, we will just pass that along
     * as whatever size we detect won't be helping anyway.
     */ return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ResponsiveContainerContextProvider, {
            width: calculatedWidth,
            height: calculatedHeight
        }, props.children);
    }
    /*
   * Static analysis did not produce fixed dimensions,
   * so we need to render a special div and monitor its size.
   */ return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](SizeDetectorContainer, _extends({}, props, {
        width: width,
        height: height,
        ref: ref
    }));
});
}),
"[project]/pwa/node_modules/recharts/es6/component/Text.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Text",
    ()=>Text,
    "getWordsByLines",
    ()=>getWordsByLines,
    "isValidTextAnchor",
    ()=>isValidTextAnchor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DOMUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReduceCSSCalc$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ReduceCSSCalc.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-ssr] (ecmascript)");
var _excluded = [
    "x",
    "y",
    "lineHeight",
    "capHeight",
    "fill",
    "scaleToFit",
    "textAnchor",
    "verticalAnchor"
], _excluded2 = [
    "dx",
    "dy",
    "angle",
    "className",
    "breakAll"
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
var BREAKING_SPACES = /[ \f\n\r\t\v\u2028\u2029]+/;
var calculateWordWidths = (_ref)=>{
    var { children, breakAll, style } = _ref;
    try {
        var words = [];
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(children)) {
            if (breakAll) {
                words = children.toString().split('');
            } else {
                words = children.toString().split(BREAKING_SPACES);
            }
        }
        var wordsWithComputedWidth = words.map((word)=>({
                word,
                width: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStringSize"])(word, style).width
            }));
        var spaceWidth = breakAll ? 0 : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DOMUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStringSize"])('\u00A0', style).width;
        return {
            wordsWithComputedWidth,
            spaceWidth
        };
    } catch (_unused) {
        return null;
    }
};
function isValidTextAnchor(value) {
    return value === 'start' || value === 'middle' || value === 'end' || value === 'inherit';
}
var calculate = (words, lineWidth, spaceWidth, scaleToFit)=>words.reduce((result, _ref2)=>{
        var { word, width } = _ref2;
        var currentLine = result[result.length - 1];
        if (currentLine && width != null && (lineWidth == null || scaleToFit || currentLine.width + width + spaceWidth < Number(lineWidth))) {
            // Word can be added to an existing line
            currentLine.words.push(word);
            currentLine.width += width + spaceWidth;
        } else {
            // Add first word to line or word is too long to scaleToFit on existing line
            var newLine = {
                words: [
                    word
                ],
                width
            };
            result.push(newLine);
        }
        return result;
    }, []);
var findLongestLine = (words)=>words.reduce((a, b)=>a.width > b.width ? a : b);
var suffix = '…';
var checkOverflow = (text, index, breakAll, style, maxLines, lineWidth, spaceWidth, scaleToFit)=>{
    var tempText = text.slice(0, index);
    var words = calculateWordWidths({
        breakAll,
        style,
        children: tempText + suffix
    });
    if (!words) {
        return [
            false,
            []
        ];
    }
    var result = calculate(words.wordsWithComputedWidth, lineWidth, spaceWidth, scaleToFit);
    var doesOverflow = result.length > maxLines || findLongestLine(result).width > Number(lineWidth);
    return [
        doesOverflow,
        result
    ];
};
var calculateWordsByLines = (_ref3, initialWordsWithComputedWith, spaceWidth, lineWidth, scaleToFit)=>{
    var { maxLines, children, style, breakAll } = _ref3;
    var shouldLimitLines = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(maxLines);
    var text = String(children);
    var originalResult = calculate(initialWordsWithComputedWith, lineWidth, spaceWidth, scaleToFit);
    if (!shouldLimitLines || scaleToFit) {
        return originalResult;
    }
    var overflows = originalResult.length > maxLines || findLongestLine(originalResult).width > Number(lineWidth);
    if (!overflows) {
        return originalResult;
    }
    var start = 0;
    var end = text.length - 1;
    var iterations = 0;
    var trimmedResult;
    while(start <= end && iterations <= text.length - 1){
        var middle = Math.floor((start + end) / 2);
        var prev = middle - 1;
        var [doesPrevOverflow, result] = checkOverflow(text, prev, breakAll, style, maxLines, lineWidth, spaceWidth, scaleToFit);
        var [doesMiddleOverflow] = checkOverflow(text, middle, breakAll, style, maxLines, lineWidth, spaceWidth, scaleToFit);
        if (!doesPrevOverflow && !doesMiddleOverflow) {
            start = middle + 1;
        }
        if (doesPrevOverflow && doesMiddleOverflow) {
            end = middle - 1;
        }
        if (!doesPrevOverflow && doesMiddleOverflow) {
            trimmedResult = result;
            break;
        }
        iterations++;
    }
    // Fallback to originalResult (result without trimming) if we cannot find the
    // where to trim.  This should not happen :tm:
    return trimmedResult || originalResult;
};
var getWordsWithoutCalculate = (children)=>{
    var words = !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(children) ? children.toString().split(BREAKING_SPACES) : [];
    return [
        {
            words,
            width: undefined
        }
    ];
};
var getWordsByLines = (_ref4)=>{
    var { width, scaleToFit, children, style, breakAll, maxLines } = _ref4;
    // Only perform calculations if using features that require them (multiline, scaleToFit)
    if ((width || scaleToFit) && !__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Global"].isSsr) {
        var wordsWithComputedWidth, spaceWidth;
        var wordWidths = calculateWordWidths({
            breakAll,
            children,
            style
        });
        if (wordWidths) {
            var { wordsWithComputedWidth: wcw, spaceWidth: sw } = wordWidths;
            wordsWithComputedWidth = wcw;
            spaceWidth = sw;
        } else {
            return getWordsWithoutCalculate(children);
        }
        return calculateWordsByLines({
            breakAll,
            children,
            maxLines,
            style
        }, wordsWithComputedWidth, spaceWidth, width, Boolean(scaleToFit));
    }
    return getWordsWithoutCalculate(children);
};
var DEFAULT_FILL = '#808080';
var textDefaultProps = {
    breakAll: false,
    // Magic number from d3
    capHeight: '0.71em',
    fill: DEFAULT_FILL,
    lineHeight: '1em',
    scaleToFit: false,
    textAnchor: 'start',
    // Maintain compat with existing charts / default SVG behavior
    verticalAnchor: 'end',
    x: 0,
    y: 0
};
var Text = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((outsideProps, ref)=>{
    var _resolveDefaultProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, textDefaultProps), { x: propsX, y: propsY, lineHeight, capHeight, fill, scaleToFit, textAnchor, verticalAnchor } = _resolveDefaultProps, props = _objectWithoutProperties(_resolveDefaultProps, _excluded);
    var wordsByLines = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return getWordsByLines({
            breakAll: props.breakAll,
            children: props.children,
            maxLines: props.maxLines,
            scaleToFit,
            style: props.style,
            width: props.width
        });
    }, [
        props.breakAll,
        props.children,
        props.maxLines,
        scaleToFit,
        props.style,
        props.width
    ]);
    var { dx, dy, angle, className, breakAll } = props, textProps = _objectWithoutProperties(props, _excluded2);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(propsX) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(propsY) || wordsByLines.length === 0) {
        return null;
    }
    var x = Number(propsX) + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(dx) ? dx : 0);
    var y = Number(propsY) + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(dy) ? dy : 0);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(x) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(y)) {
        return null;
    }
    var startDy;
    switch(verticalAnchor){
        case 'start':
            startDy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReduceCSSCalc$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reduceCSSCalc"])("calc(".concat(capHeight, ")"));
            break;
        case 'middle':
            startDy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReduceCSSCalc$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reduceCSSCalc"])("calc(".concat((wordsByLines.length - 1) / 2, " * -").concat(lineHeight, " + (").concat(capHeight, " / 2))"));
            break;
        default:
            startDy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReduceCSSCalc$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reduceCSSCalc"])("calc(".concat(wordsByLines.length - 1, " * -").concat(lineHeight, ")"));
            break;
    }
    var transforms = [];
    if (scaleToFit) {
        var lineWidth = wordsByLines[0].width;
        var { width } = props;
        transforms.push("scale(".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(width) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(lineWidth) ? width / lineWidth : 1, ")"));
    }
    if (angle) {
        transforms.push("rotate(".concat(angle, ", ").concat(x, ", ").concat(y, ")"));
    }
    if (transforms.length) {
        textProps.transform = transforms.join(' ');
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("text", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(textProps), {
        ref: ref,
        x: x,
        y: y,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-text', className),
        textAnchor: textAnchor,
        fill: fill.includes('url') ? DEFAULT_FILL : fill
    }), wordsByLines.map((line, index)=>{
        var words = line.words.join(breakAll ? '' : ' ');
        return(/*#__PURE__*/ // duplicate words will cause duplicate keys which is why we add the array index here
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("tspan", {
            x: x,
            dy: index === 0 ? startDy : lineHeight,
            key: "".concat(words, "-").concat(index)
        }, words));
    }));
});
Text.displayName = 'Text';
}),
"[project]/pwa/node_modules/recharts/es6/component/Label.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartesianLabelContextProvider",
    ()=>CartesianLabelContextProvider,
    "CartesianLabelFromLabelProp",
    ()=>CartesianLabelFromLabelProp,
    "Label",
    ()=>Label,
    "PolarLabelContextProvider",
    ()=>PolarLabelContextProvider,
    "PolarLabelFromLabelProp",
    ()=>PolarLabelFromLabelProp,
    "getAttrsOfCartesianLabel",
    ()=>getAttrsOfCartesianLabel,
    "isLabelContentAFunction",
    ()=>isLabelContentAFunction,
    "usePolarLabelContext",
    ()=>usePolarLabelContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Text.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/polarAxisSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
var _excluded = [
    "labelRef"
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
function _extends() {
    return _extends = ("TURBOPACK compile-time truthy", 1) ? Object.assign.bind() : "TURBOPACK unreachable", _extends.apply(null, arguments);
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
var CartesianLabelContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
var CartesianLabelContextProvider = (_ref)=>{
    var { x, y, upperWidth, lowerWidth, width, height, children } = _ref;
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            x,
            y,
            upperWidth,
            lowerWidth,
            width,
            height
        }), [
        x,
        y,
        upperWidth,
        lowerWidth,
        width,
        height
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](CartesianLabelContext.Provider, {
        value: viewBox
    }, children);
};
var useCartesianLabelContext = ()=>{
    var labelChildContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(CartesianLabelContext);
    var chartContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useViewBox"])();
    return labelChildContext || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cartesianViewBoxToTrapezoid"])(chartContext);
};
var PolarLabelContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
var PolarLabelContextProvider = (_ref2)=>{
    var { cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise, children } = _ref2;
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            cx,
            cy,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle,
            clockWise
        }), [
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        clockWise
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PolarLabelContext.Provider, {
        value: viewBox
    }, children);
};
var usePolarLabelContext = ()=>{
    var labelChildContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(PolarLabelContext);
    var chartContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectPolarViewBox"]);
    return labelChildContext || chartContext;
};
var getLabel = (props)=>{
    var { value, formatter } = props;
    var label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(props.children) ? value : props.children;
    if (typeof formatter === 'function') {
        return formatter(label);
    }
    return label;
};
var isLabelContentAFunction = (content)=>{
    return content != null && typeof content === 'function';
};
var getDeltaAngle = (startAngle, endAngle)=>{
    var sign = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(endAngle - startAngle);
    var deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360);
    return sign * deltaAngle;
};
var renderRadialLabel = (labelProps, position, label, attrs, viewBox)=>{
    var { offset, className } = labelProps;
    var { cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise } = viewBox;
    var radius = (innerRadius + outerRadius) / 2;
    var deltaAngle = getDeltaAngle(startAngle, endAngle);
    var sign = deltaAngle >= 0 ? 1 : -1;
    var labelAngle, direction;
    switch(position){
        case 'insideStart':
            labelAngle = startAngle + sign * offset;
            direction = clockWise;
            break;
        case 'insideEnd':
            labelAngle = endAngle - sign * offset;
            direction = !clockWise;
            break;
        case 'end':
            labelAngle = endAngle + sign * offset;
            direction = clockWise;
            break;
        default:
            throw new Error("Unsupported position ".concat(position));
    }
    direction = deltaAngle <= 0 ? direction : !direction;
    var startPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, radius, labelAngle);
    var endPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, radius, labelAngle + (direction ? 1 : -1) * 359);
    var path = "M".concat(startPoint.x, ",").concat(startPoint.y, "\n    A").concat(radius, ",").concat(radius, ",0,1,").concat(direction ? 0 : 1, ",\n    ").concat(endPoint.x, ",").concat(endPoint.y);
    var id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(labelProps.id) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniqueId"])('recharts-radial-line-') : labelProps.id;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("text", _extends({}, attrs, {
        dominantBaseline: "central",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-radial-bar-label', className)
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("defs", null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", {
        id: id,
        d: path
    })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("textPath", {
        xlinkHref: "#".concat(id)
    }, label));
};
var getAttrsOfPolarLabel = (viewBox, offset, position)=>{
    var { cx, cy, innerRadius, outerRadius, startAngle, endAngle } = viewBox;
    var midAngle = (startAngle + endAngle) / 2;
    if (position === 'outside') {
        var { x: _x, y: _y } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, outerRadius + offset, midAngle);
        return {
            x: _x,
            y: _y,
            textAnchor: _x >= cx ? 'start' : 'end',
            verticalAnchor: 'middle'
        };
    }
    if (position === 'center') {
        return {
            x: cx,
            y: cy,
            textAnchor: 'middle',
            verticalAnchor: 'middle'
        };
    }
    if (position === 'centerTop') {
        return {
            x: cx,
            y: cy,
            textAnchor: 'middle',
            verticalAnchor: 'start'
        };
    }
    if (position === 'centerBottom') {
        return {
            x: cx,
            y: cy,
            textAnchor: 'middle',
            verticalAnchor: 'end'
        };
    }
    var r = (innerRadius + outerRadius) / 2;
    var { x, y } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, r, midAngle);
    return {
        x,
        y,
        textAnchor: 'middle',
        verticalAnchor: 'middle'
    };
};
var isPolar = (viewBox)=>'cx' in viewBox && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(viewBox.cx);
var getAttrsOfCartesianLabel = (props, viewBox)=>{
    var { parentViewBox: parentViewBoxFromProps, offset, position } = props;
    var parentViewBox;
    if (parentViewBoxFromProps != null && !isPolar(parentViewBoxFromProps)) {
        // Check that nobody is trying to pass a polar viewBox to a cartesian label
        parentViewBox = parentViewBoxFromProps;
    }
    var { x, y, upperWidth, lowerWidth, height } = viewBox;
    // Funnel.tsx provides a viewBox where `x` is the top-left of the trapezoid shape.
    var upperX = x;
    // The trapezoid is centered, so we can calculate the other corners from the top-left.
    var lowerX = x + (upperWidth - lowerWidth) / 2;
    // middleX is the x-coordinate of the left edge at the vertical midpoint of the trapezoid.
    var middleX = (upperX + lowerX) / 2;
    // The width of the trapezoid at its vertical midpoint.
    var midHeightWidth = (upperWidth + lowerWidth) / 2;
    // The center x-coordinate is constant for the entire height of the trapezoid.
    var centerX = upperX + upperWidth / 2;
    // Define vertical offsets and position inverts based on the value being positive or negative.
    // This allows labels to be positioned correctly for bars with negative height.
    var verticalSign = height >= 0 ? 1 : -1;
    var verticalOffset = verticalSign * offset;
    var verticalEnd = verticalSign > 0 ? 'end' : 'start';
    var verticalStart = verticalSign > 0 ? 'start' : 'end';
    // Define horizontal offsets and position inverts based on the value being positive or negative.
    // This allows labels to be positioned correctly for bars with negative width.
    var horizontalSign = upperWidth >= 0 ? 1 : -1;
    var horizontalOffset = horizontalSign * offset;
    var horizontalEnd = horizontalSign > 0 ? 'end' : 'start';
    var horizontalStart = horizontalSign > 0 ? 'start' : 'end';
    if (position === 'top') {
        var attrs = {
            x: upperX + upperWidth / 2,
            y: y - verticalOffset,
            textAnchor: 'middle',
            verticalAnchor: verticalEnd
        };
        return _objectSpread(_objectSpread({}, attrs), parentViewBox ? {
            height: Math.max(y - parentViewBox.y, 0),
            width: upperWidth
        } : {});
    }
    if (position === 'bottom') {
        var _attrs = {
            x: lowerX + lowerWidth / 2,
            y: y + height + verticalOffset,
            textAnchor: 'middle',
            verticalAnchor: verticalStart
        };
        return _objectSpread(_objectSpread({}, _attrs), parentViewBox ? {
            height: Math.max(parentViewBox.y + parentViewBox.height - (y + height), 0),
            width: lowerWidth
        } : {});
    }
    if (position === 'left') {
        var _attrs2 = {
            x: middleX - horizontalOffset,
            y: y + height / 2,
            textAnchor: horizontalEnd,
            verticalAnchor: 'middle'
        };
        return _objectSpread(_objectSpread({}, _attrs2), parentViewBox ? {
            width: Math.max(_attrs2.x - parentViewBox.x, 0),
            height
        } : {});
    }
    if (position === 'right') {
        var _attrs3 = {
            x: middleX + midHeightWidth + horizontalOffset,
            y: y + height / 2,
            textAnchor: horizontalStart,
            verticalAnchor: 'middle'
        };
        return _objectSpread(_objectSpread({}, _attrs3), parentViewBox ? {
            width: Math.max(parentViewBox.x + parentViewBox.width - _attrs3.x, 0),
            height
        } : {});
    }
    var sizeAttrs = parentViewBox ? {
        width: midHeightWidth,
        height
    } : {};
    if (position === 'insideLeft') {
        return _objectSpread({
            x: middleX + horizontalOffset,
            y: y + height / 2,
            textAnchor: horizontalStart,
            verticalAnchor: 'middle'
        }, sizeAttrs);
    }
    if (position === 'insideRight') {
        return _objectSpread({
            x: middleX + midHeightWidth - horizontalOffset,
            y: y + height / 2,
            textAnchor: horizontalEnd,
            verticalAnchor: 'middle'
        }, sizeAttrs);
    }
    if (position === 'insideTop') {
        return _objectSpread({
            x: upperX + upperWidth / 2,
            y: y + verticalOffset,
            textAnchor: 'middle',
            verticalAnchor: verticalStart
        }, sizeAttrs);
    }
    if (position === 'insideBottom') {
        return _objectSpread({
            x: lowerX + lowerWidth / 2,
            y: y + height - verticalOffset,
            textAnchor: 'middle',
            verticalAnchor: verticalEnd
        }, sizeAttrs);
    }
    if (position === 'insideTopLeft') {
        return _objectSpread({
            x: upperX + horizontalOffset,
            y: y + verticalOffset,
            textAnchor: horizontalStart,
            verticalAnchor: verticalStart
        }, sizeAttrs);
    }
    if (position === 'insideTopRight') {
        return _objectSpread({
            x: upperX + upperWidth - horizontalOffset,
            y: y + verticalOffset,
            textAnchor: horizontalEnd,
            verticalAnchor: verticalStart
        }, sizeAttrs);
    }
    if (position === 'insideBottomLeft') {
        return _objectSpread({
            x: lowerX + horizontalOffset,
            y: y + height - verticalOffset,
            textAnchor: horizontalStart,
            verticalAnchor: verticalEnd
        }, sizeAttrs);
    }
    if (position === 'insideBottomRight') {
        return _objectSpread({
            x: lowerX + lowerWidth - horizontalOffset,
            y: y + height - verticalOffset,
            textAnchor: horizontalEnd,
            verticalAnchor: verticalEnd
        }, sizeAttrs);
    }
    if (!!position && typeof position === 'object' && ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(position.x) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(position.x)) && ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(position.y) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(position.y))) {
        // TODO: This is not quite right. The width of the trapezoid changes with y.
        // A percentage-based x should be relative to the width at that y.
        // For now, we use the mid-height width as a reasonable approximation.
        return _objectSpread({
            x: x + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(position.x, midHeightWidth),
            y: y + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(position.y, height),
            textAnchor: 'end',
            verticalAnchor: 'end'
        }, sizeAttrs);
    }
    return _objectSpread({
        x: centerX,
        y: y + height / 2,
        textAnchor: 'middle',
        verticalAnchor: 'middle'
    }, sizeAttrs);
};
var defaultLabelProps = {
    offset: 5,
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].label
};
function Label(outerProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outerProps, defaultLabelProps);
    var { viewBox: viewBoxFromProps, position, value, children, content, className = '', textBreakAll, labelRef } = props;
    var polarViewBox = usePolarLabelContext();
    var cartesianViewBox = useCartesianLabelContext();
    /*
   * I am not proud about this solution, but it's a quick fix for https://github.com/recharts/recharts/issues/6030#issuecomment-3155352460.
   * What we should really do is split Label into two components: CartesianLabel and PolarLabel and then handle their respective viewBoxes separately.
   * Also other components should set its own viewBox in a context so that we can fix https://github.com/recharts/recharts/issues/6156
   */ var resolvedViewBox = position === 'center' ? cartesianViewBox : polarViewBox !== null && polarViewBox !== void 0 ? polarViewBox : cartesianViewBox;
    var viewBox, label, positionAttrs;
    if (viewBoxFromProps == null) {
        viewBox = resolvedViewBox;
    } else if (isPolar(viewBoxFromProps)) {
        viewBox = viewBoxFromProps;
    } else {
        viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cartesianViewBoxToTrapezoid"])(viewBoxFromProps);
    }
    if (!viewBox || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(value) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(children) && !/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(content) && typeof content !== 'function') {
        return null;
    }
    var propsWithViewBox = _objectSpread(_objectSpread({}, props), {}, {
        viewBox
    });
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(content)) {
        var { labelRef: _ } = propsWithViewBox, propsWithoutLabelRef = _objectWithoutProperties(propsWithViewBox, _excluded);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(content, propsWithoutLabelRef);
    }
    if (typeof content === 'function') {
        // @ts-expect-error we're not checking if the content component returns something that Text is able to render
        label = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"])(content, propsWithViewBox);
        if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(label)) {
            return label;
        }
    } else {
        label = getLabel(props);
    }
    var attrs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(props);
    if (isPolar(viewBox)) {
        if (position === 'insideStart' || position === 'insideEnd' || position === 'end') {
            return renderRadialLabel(props, position, label, attrs, viewBox);
        }
        positionAttrs = getAttrsOfPolarLabel(viewBox, props.offset, props.position);
    } else {
        positionAttrs = getAttrsOfCartesianLabel(props, viewBox);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: props.zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], _extends({
        ref: labelRef,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-label', className)
    }, attrs, positionAttrs, {
        /*
     * textAnchor is decided by default based on the `position`
     * but we allow overriding via props for precise control.
     */ textAnchor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidTextAnchor"])(attrs.textAnchor) ? attrs.textAnchor : positionAttrs.textAnchor,
        breakAll: textBreakAll
    }), label));
}
Label.displayName = 'Label';
var parseLabel = (label, viewBox, labelRef)=>{
    if (!label) {
        return null;
    }
    var commonProps = {
        viewBox,
        labelRef
    };
    if (label === true) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Label, _extends({
            key: "label-implicit"
        }, commonProps));
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(label)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Label, _extends({
            key: "label-implicit",
            value: label
        }, commonProps));
    }
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(label)) {
        if (label.type === Label) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(label, _objectSpread({
                key: 'label-implicit'
            }, commonProps));
        }
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Label, _extends({
            key: "label-implicit",
            content: label
        }, commonProps));
    }
    if (isLabelContentAFunction(label)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Label, _extends({
            key: "label-implicit",
            content: label
        }, commonProps));
    }
    if (label && typeof label === 'object') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Label, _extends({}, label, {
            key: "label-implicit"
        }, commonProps));
    }
    return null;
};
function CartesianLabelFromLabelProp(_ref3) {
    var { label, labelRef } = _ref3;
    var viewBox = useCartesianLabelContext();
    return parseLabel(label, viewBox, labelRef) || null;
}
function PolarLabelFromLabelProp(_ref4) {
    var { label } = _ref4;
    var viewBox = usePolarLabelContext();
    return parseLabel(label, viewBox) || null;
}
}),
"[project]/pwa/node_modules/recharts/es6/component/LabelList.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartesianLabelListContextProvider",
    ()=>CartesianLabelListContextProvider,
    "LabelList",
    ()=>LabelList,
    "LabelListFromLabelProp",
    ()=>LabelListFromLabelProp,
    "PolarLabelListContextProvider",
    ()=>PolarLabelListContextProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$last$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/last.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Label.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
var _excluded = [
    "valueAccessor"
], _excluded2 = [
    "dataKey",
    "clockWise",
    "id",
    "textBreakAll",
    "zIndex"
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
/**
 * This is public API because we expose it as the valueAccessor parameter.
 *
 * The properties of "viewBox" are repeated as the root props of the entry object.
 * So it doesn't matter if you read entry.x or entry.viewBox.x, they are the same.
 *
 * It's not necessary to pass redundant data, but we keep it for backward compatibility.
 */ /**
 * LabelList props do not allow refs because the same props are reused in multiple elements so we don't have a good single place to ref to.
 */ /**
 * This is the type accepted for the `label` prop on various graphical items.
 * It accepts:
 *
 * boolean:
 *    true = labels show,
 *    false = labels don't show
 * React element:
 *    will be cloned with extra props
 * function:
 *    is used as <Label content={function} />, so this will be called once for each individual label (so typically once for each data point)
 * object:
 *    the props to be passed to a LabelList component
 */ var defaultAccessor = (entry)=>Array.isArray(entry.value) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$last$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(entry.value) : entry.value;
var CartesianLabelListContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
var CartesianLabelListContextProvider = CartesianLabelListContext.Provider;
var PolarLabelListContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
var PolarLabelListContextProvider = PolarLabelListContext.Provider;
function useCartesianLabelListContext() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(CartesianLabelListContext);
}
function usePolarLabelListContext() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(PolarLabelListContext);
}
function LabelList(_ref) {
    var { valueAccessor = defaultAccessor } = _ref, restProps = _objectWithoutProperties(_ref, _excluded);
    var { dataKey, clockWise, id, textBreakAll, zIndex } = restProps, others = _objectWithoutProperties(restProps, _excluded2);
    var cartesianData = useCartesianLabelListContext();
    var polarData = usePolarLabelListContext();
    var data = cartesianData || polarData;
    if (!data || !data.length) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: zIndex !== null && zIndex !== void 0 ? zIndex : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].label
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], {
        className: "recharts-label-list"
    }, data.map((entry, index)=>{
        var _restProps$fill;
        var value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(dataKey) ? valueAccessor(entry, index) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry && entry.payload, dataKey);
        var idProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(id) ? {} : {
            id: "".concat(id, "-").concat(index)
        };
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], _extends({
            key: "label-".concat(index)
        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(entry), others, idProps, {
            /*
       * Prefer to use the explicit fill from LabelList props.
       * Only in an absence of that, fall back to the fill of the entry.
       * The entry fill can be quite difficult to see especially in Bar, Pie, RadialBar in inside positions.
       * On the other hand it's quite convenient in Scatter, Line, or when the position is outside the Bar, Pie filled shapes.
       */ fill: (_restProps$fill = restProps.fill) !== null && _restProps$fill !== void 0 ? _restProps$fill : entry.fill,
            parentViewBox: entry.parentViewBox,
            value: value,
            textBreakAll: textBreakAll,
            viewBox: entry.viewBox,
            index: index,
            zIndex: 0
        }));
    })));
}
LabelList.displayName = 'LabelList';
function LabelListFromLabelProp(_ref2) {
    var { label } = _ref2;
    if (!label) {
        return null;
    }
    if (label === true) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](LabelList, {
            key: "labelList-implicit"
        });
    }
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](label) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Label$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isLabelContentAFunction"])(label)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](LabelList, {
            key: "labelList-implicit",
            content: label
        });
    }
    if (typeof label === 'object') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](LabelList, _extends({
            key: "labelList-implicit"
        }, label, {
            type: String(label.type)
        }));
    }
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/component/Dots.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dots",
    ()=>Dots
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Dot.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ReactUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
var _excluded = [
    "points"
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
function DotItem(_ref) {
    var { option, dotProps, className } = _ref;
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(option)) {
        // @ts-expect-error we can't type check element cloning properly
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(option, dotProps);
    }
    if (typeof option === 'function') {
        return option(dotProps);
    }
    var finalClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(className, typeof option !== 'boolean' ? option.className : '');
    var _ref2 = dotProps !== null && dotProps !== void 0 ? dotProps : {}, { points } = _ref2, props = _objectWithoutProperties(_ref2, _excluded);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Dot"], _extends({}, props, {
        className: finalClassName
    }));
}
function shouldRenderDots(points, dot) {
    if (points == null) {
        return false;
    }
    if (dot) {
        return true;
    }
    return points.length === 1;
}
function Dots(_ref3) {
    var { points, dot, className, dotClassName, dataKey, baseProps, needClip, clipPathId, zIndex = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].scatter } = _ref3;
    if (!shouldRenderDots(points, dot)) {
        return null;
    }
    var clipDot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isClipDot"])(dot);
    var customDotProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEventsFromUnknown"])(dot);
    var dots = points.map((entry, i)=>{
        var _entry$x, _entry$y;
        var dotProps = _objectSpread(_objectSpread(_objectSpread({
            r: 3
        }, baseProps), customDotProps), {}, {
            index: i,
            cx: (_entry$x = entry.x) !== null && _entry$x !== void 0 ? _entry$x : undefined,
            cy: (_entry$y = entry.y) !== null && _entry$y !== void 0 ? _entry$y : undefined,
            dataKey,
            value: entry.value,
            payload: entry.payload,
            points
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](DotItem, {
            key: "dot-".concat(i),
            option: dot,
            dotProps: dotProps,
            className: dotClassName
        });
    });
    var layerProps = {};
    if (needClip && clipPathId != null) {
        layerProps.clipPath = "url(#clipPath-".concat(clipDot ? '' : 'dots-').concat(clipPathId, ")");
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], _extends({
        className: className
    }, layerProps), dots));
}
}),
"[project]/pwa/node_modules/recharts/es6/component/ActivePoints.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActivePoints",
    ()=>ActivePoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Dot.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
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
var ActivePoint = (_ref)=>{
    var { point, childIndex, mainColor, activeDot, dataKey } = _ref;
    if (activeDot === false || point.x == null || point.y == null) {
        return null;
    }
    var dotPropsTyped = {
        index: childIndex,
        dataKey,
        cx: point.x,
        cy: point.y,
        r: 4,
        fill: mainColor !== null && mainColor !== void 0 ? mainColor : 'none',
        strokeWidth: 2,
        stroke: '#fff',
        payload: point.payload,
        value: point.value
    };
    // @ts-expect-error svgPropertiesNoEventsFromUnknown(activeDot) is contributing unknown props
    var dotProps = _objectSpread(_objectSpread(_objectSpread({}, dotPropsTyped), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(activeDot)), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adaptEventHandlers"])(activeDot));
    var dot;
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(activeDot)) {
        // @ts-expect-error we're improperly typing events
        dot = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(activeDot, dotProps);
    } else if (typeof activeDot === 'function') {
        dot = activeDot(dotProps);
    } else {
        dot = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Dot"], dotProps);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], {
        className: "recharts-active-dot"
    }, dot);
};
function ActivePoints(_ref2) {
    var { points, mainColor, activeDot, itemDataKey, zIndex = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].activeDot } = _ref2;
    var activeTooltipIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"]);
    var activeDataPoints = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useActiveTooltipDataPoints"])();
    if (points == null || activeDataPoints == null) {
        return null;
    }
    var activePoint = points.find((p)=>activeDataPoints.includes(p.payload));
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(activePoint)) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ActivePoint, {
        point: activePoint,
        childIndex: Number(activeTooltipIndex),
        mainColor: mainColor,
        dataKey: itemDataKey,
        activeDot: activeDot
    }));
}
}),
"[project]/pwa/node_modules/recharts/es6/component/Cell.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @fileOverview Cross
 */ __turbopack_context__.s([
    "Cell",
    ()=>Cell
]);
var Cell = (_props)=>null;
Cell.displayName = 'Cell';
}),
"[project]/pwa/node_modules/recharts/es6/component/DefaultTooltipContent.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DefaultTooltipContent",
    ()=>DefaultTooltipContent
]);
/**
 * @fileOverview Default Tooltip Content
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/sortBy.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
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
function defaultFormatter(value) {
    return Array.isArray(value) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(value[0]) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(value[1]) ? value.join(' ~ ') : value;
}
var DefaultTooltipContent = (props)=>{
    var { separator = ' : ', contentStyle = {}, itemStyle = {}, labelStyle = {}, payload, formatter, itemSorter, wrapperClassName, labelClassName, label, labelFormatter, accessibilityLayer = false } = props;
    var renderContent = ()=>{
        if (payload && payload.length) {
            var listStyle = {
                padding: 0,
                margin: 0
            };
            var items = (itemSorter ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(payload, itemSorter) : payload).map((entry, i)=>{
                if (entry.type === 'none') {
                    return null;
                }
                var finalFormatter = entry.formatter || formatter || defaultFormatter;
                var { value, name } = entry;
                var finalValue = value;
                var finalName = name;
                if (finalFormatter) {
                    var formatted = finalFormatter(value, name, entry, i, payload);
                    if (Array.isArray(formatted)) {
                        [finalValue, finalName] = formatted;
                    } else if (formatted != null) {
                        finalValue = formatted;
                    } else {
                        return null;
                    }
                }
                var finalItemStyle = _objectSpread({
                    display: 'block',
                    paddingTop: 4,
                    paddingBottom: 4,
                    color: entry.color || '#000'
                }, itemStyle);
                return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("li", {
                    className: "recharts-tooltip-item",
                    key: "tooltip-item-".concat(i),
                    style: finalItemStyle
                }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(finalName) ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("span", {
                    className: "recharts-tooltip-item-name"
                }, finalName) : null, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumOrStr"])(finalName) ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("span", {
                    className: "recharts-tooltip-item-separator"
                }, separator) : null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("span", {
                    className: "recharts-tooltip-item-value"
                }, finalValue), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("span", {
                    className: "recharts-tooltip-item-unit"
                }, entry.unit || ''));
            });
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("ul", {
                className: "recharts-tooltip-item-list",
                style: listStyle
            }, items);
        }
        return null;
    };
    var finalStyle = _objectSpread({
        margin: 0,
        padding: 10,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        whiteSpace: 'nowrap'
    }, contentStyle);
    var finalLabelStyle = _objectSpread({
        margin: 0
    }, labelStyle);
    var hasLabel = !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNullish"])(label);
    var finalLabel = hasLabel ? label : '';
    var wrapperCN = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-default-tooltip', wrapperClassName);
    var labelCN = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-tooltip-label', labelClassName);
    if (hasLabel && labelFormatter && payload !== undefined && payload !== null) {
        finalLabel = labelFormatter(label, payload);
    }
    var accessibilityAttributes = accessibilityLayer ? {
        role: 'status',
        'aria-live': 'assertive'
    } : {};
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", _extends({
        className: wrapperCN,
        style: finalStyle
    }, accessibilityAttributes), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("p", {
        className: labelCN,
        style: finalLabelStyle
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](finalLabel) ? finalLabel : "".concat(finalLabel)), renderContent());
};
}),
"[project]/pwa/node_modules/recharts/es6/component/TooltipBoundingBox.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TooltipBoundingBox",
    ()=>TooltipBoundingBox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$tooltip$2f$translate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/tooltip/translate.js [app-ssr] (ecmascript)");
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
class TooltipBoundingBox extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PureComponent"] {
    constructor(){
        super(...arguments);
        _defineProperty(this, "state", {
            dismissed: false,
            dismissedAtCoordinate: {
                x: 0,
                y: 0
            }
        });
        _defineProperty(this, "handleKeyDown", (event)=>{
            if (event.key === 'Escape') {
                var _this$props$coordinat, _this$props$coordinat2, _this$props$coordinat3, _this$props$coordinat4;
                this.setState({
                    dismissed: true,
                    dismissedAtCoordinate: {
                        x: (_this$props$coordinat = (_this$props$coordinat2 = this.props.coordinate) === null || _this$props$coordinat2 === void 0 ? void 0 : _this$props$coordinat2.x) !== null && _this$props$coordinat !== void 0 ? _this$props$coordinat : 0,
                        y: (_this$props$coordinat3 = (_this$props$coordinat4 = this.props.coordinate) === null || _this$props$coordinat4 === void 0 ? void 0 : _this$props$coordinat4.y) !== null && _this$props$coordinat3 !== void 0 ? _this$props$coordinat3 : 0
                    }
                });
            }
        });
    }
    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown);
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }
    componentDidUpdate() {
        var _this$props$coordinat5, _this$props$coordinat6;
        if (!this.state.dismissed) {
            return;
        }
        if (((_this$props$coordinat5 = this.props.coordinate) === null || _this$props$coordinat5 === void 0 ? void 0 : _this$props$coordinat5.x) !== this.state.dismissedAtCoordinate.x || ((_this$props$coordinat6 = this.props.coordinate) === null || _this$props$coordinat6 === void 0 ? void 0 : _this$props$coordinat6.y) !== this.state.dismissedAtCoordinate.y) {
            this.state.dismissed = false;
        }
    }
    render() {
        var { active, allowEscapeViewBox, animationDuration, animationEasing, children, coordinate, hasPayload, isAnimationActive, offset, position, reverseDirection, useTranslate3d, viewBox, wrapperStyle, lastBoundingBox, innerRef, hasPortalFromProps } = this.props;
        var { cssClasses, cssProperties } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$tooltip$2f$translate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTooltipTranslate"])({
            allowEscapeViewBox,
            coordinate,
            offsetTopLeft: offset,
            position,
            reverseDirection,
            tooltipBox: {
                height: lastBoundingBox.height,
                width: lastBoundingBox.width
            },
            useTranslate3d,
            viewBox
        });
        // do not use absolute styles if the user has passed a custom portal prop
        var positionStyles = hasPortalFromProps ? {} : _objectSpread(_objectSpread({
            transition: isAnimationActive && active ? "transform ".concat(animationDuration, "ms ").concat(animationEasing) : undefined
        }, cssProperties), {}, {
            pointerEvents: 'none',
            visibility: !this.state.dismissed && active && hasPayload ? 'visible' : 'hidden',
            position: 'absolute',
            top: 0,
            left: 0
        });
        var outerStyle = _objectSpread(_objectSpread({}, positionStyles), {}, {
            visibility: !this.state.dismissed && active && hasPayload ? 'visible' : 'hidden'
        }, wrapperStyle);
        return(/*#__PURE__*/ // This element allow listening to the `Escape` key. See https://github.com/recharts/recharts/pull/2925
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", {
            // @ts-expect-error typescript library does not recognize xmlns attribute, but it's required for an HTML chunk inside SVG.
            xmlns: "http://www.w3.org/1999/xhtml",
            tabIndex: -1,
            className: cssClasses,
            style: outerStyle,
            ref: innerRef
        }, children));
    }
}
}),
"[project]/pwa/node_modules/recharts/es6/component/Cursor.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Cursor",
    ()=>Cursor,
    "CursorInternal",
    ()=>CursorInternal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Curve.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Cross$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Cross.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getCursorRectangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/cursor/getCursorRectangle.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Rectangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Rectangle.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getRadialCursorPoints$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/cursor/getRadialCursorPoints.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Sector$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Sector.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getCursorPoints$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/cursor/getCursorPoints.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$useTooltipAxis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/useTooltipAxis.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
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
/**
 * If set false, no cursor will be drawn when tooltip is active.
 * If set an object, the option is the configuration of cursor.
 * If set a React element, the option is the custom react element of drawing cursor
 */ function RenderCursor(_ref) {
    var { cursor, cursorComp, cursorProps } = _ref;
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(cursor)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"])(cursor, cursorProps);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"])(cursorComp, cursorProps);
}
function CursorInternal(props) {
    var _props$zIndex;
    var { coordinate, payload, index, offset, tooltipAxisBandSize, layout, cursor, tooltipEventType, chartName } = props;
    // The cursor is a part of the Tooltip, and it should be shown (by default) when the Tooltip is active.
    var activeCoordinate = coordinate;
    var activePayload = payload;
    var activeTooltipIndex = index;
    if (!cursor || !activeCoordinate || chartName !== 'ScatterChart' && tooltipEventType !== 'axis') {
        return null;
    }
    var restProps, cursorComp, preferredZIndex;
    if (chartName === 'ScatterChart') {
        restProps = activeCoordinate;
        cursorComp = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Cross$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cross"];
        preferredZIndex = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].cursorLine;
    } else if (chartName === 'BarChart') {
        restProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getCursorRectangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCursorRectangle"])(layout, activeCoordinate, offset, tooltipAxisBandSize);
        cursorComp = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Rectangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"];
        preferredZIndex = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].cursorRectangle;
    } else if (layout === 'radial' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPolarCoordinate"])(activeCoordinate)) {
        var { cx, cy, radius, startAngle, endAngle } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getRadialCursorPoints$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRadialCursorPoints"])(activeCoordinate);
        restProps = {
            cx,
            cy,
            startAngle,
            endAngle,
            innerRadius: radius,
            outerRadius: radius
        };
        cursorComp = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Sector$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sector"];
        preferredZIndex = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].cursorLine;
    } else {
        restProps = {
            points: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$cursor$2f$getCursorPoints$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCursorPoints"])(layout, activeCoordinate, offset)
        };
        cursorComp = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Curve"];
        preferredZIndex = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].cursorLine;
    }
    var extraClassName = typeof cursor === 'object' && 'className' in cursor ? cursor.className : undefined;
    var cursorProps = _objectSpread(_objectSpread(_objectSpread(_objectSpread({
        stroke: '#ccc',
        pointerEvents: 'none'
    }, offset), restProps), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(cursor)), {}, {
        payload: activePayload,
        payloadIndex: activeTooltipIndex,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-tooltip-cursor', extraClassName)
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: (_props$zIndex = props.zIndex) !== null && _props$zIndex !== void 0 ? _props$zIndex : preferredZIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](RenderCursor, {
        cursor: cursor,
        cursorComp: cursorComp,
        cursorProps: cursorProps
    }));
}
function Cursor(props) {
    var tooltipAxisBandSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$useTooltipAxis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTooltipAxisBandSize"])();
    var offset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOffsetInternal"])();
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartLayout"])();
    var chartName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartName"])();
    if (tooltipAxisBandSize == null || offset == null || layout == null || chartName == null) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](CursorInternal, _extends({}, props, {
        offset: offset,
        layout: layout,
        tooltipAxisBandSize: tooltipAxisBandSize,
        chartName: chartName
    }));
}
}),
"[project]/pwa/node_modules/recharts/es6/component/Tooltip.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$DefaultTooltipContent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/DefaultTooltipContent.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$TooltipBoundingBox$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/TooltipBoundingBox.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$payload$2f$getUniqPayload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/payload/getUniqPayload.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$accessibilityContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/accessibilityContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useElementOffset$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useElementOffset.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cursor$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Cursor.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/tooltipPortalContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$synchronisation$2f$useChartSynchronisation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/synchronisation/useChartSynchronisation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipEventType.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
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
function defaultUniqBy(entry) {
    return entry.dataKey;
}
function renderContent(content, props) {
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](content)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"](content, props);
    }
    if (typeof content === 'function') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](content, props);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$DefaultTooltipContent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultTooltipContent"], props);
}
var emptyPayload = [];
var defaultTooltipProps = {
    allowEscapeViewBox: {
        x: false,
        y: false
    },
    animationDuration: 400,
    animationEasing: 'ease',
    axisId: 0,
    contentStyle: {},
    cursor: true,
    filterNull: true,
    isAnimationActive: !__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Global"].isSsr,
    itemSorter: 'name',
    itemStyle: {},
    labelStyle: {},
    offset: 10,
    reverseDirection: {
        x: false,
        y: false
    },
    separator: ' : ',
    trigger: 'hover',
    useTranslate3d: false,
    wrapperStyle: {}
};
function Tooltip(outsideProps) {
    var _useAppSelector, _ref;
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultTooltipProps);
    var { active: activeFromProps, allowEscapeViewBox, animationDuration, animationEasing, content, filterNull, isAnimationActive, offset, payloadUniqBy, position, reverseDirection, useTranslate3d, wrapperStyle, cursor, shared, trigger, defaultIndex, portal: portalFromProps, axisId } = props;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var defaultIndexAsString = typeof defaultIndex === 'number' ? String(defaultIndex) : defaultIndex;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setTooltipSettingsState"])({
            shared,
            trigger,
            axisId,
            active: activeFromProps,
            defaultIndex: defaultIndexAsString
        }));
    }, [
        dispatch,
        shared,
        trigger,
        axisId,
        activeFromProps,
        defaultIndexAsString
    ]);
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useViewBox"])();
    var accessibilityLayer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$accessibilityContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccessibilityLayer"])();
    var tooltipEventType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTooltipEventType"])(shared);
    var { activeIndex, isActive } = (_useAppSelector = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectIsTooltipActive"])(state, tooltipEventType, trigger, defaultIndexAsString))) !== null && _useAppSelector !== void 0 ? _useAppSelector : {};
    var payloadFromRedux = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectTooltipPayload"])(state, tooltipEventType, trigger, defaultIndexAsString));
    var labelFromRedux = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectActiveLabel"])(state, tooltipEventType, trigger, defaultIndexAsString));
    var coordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectActiveCoordinate"])(state, tooltipEventType, trigger, defaultIndexAsString));
    var payload = payloadFromRedux;
    var tooltipPortalFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTooltipPortal"])();
    /*
   * The user can set `active=true` on the Tooltip in which case the Tooltip will stay always active,
   * or `active=false` in which case the Tooltip never shows.
   *
   * If the `active` prop is not defined then it will show and hide based on mouse or keyboard activity.
   */ var finalIsActive = (_ref = activeFromProps !== null && activeFromProps !== void 0 ? activeFromProps : isActive) !== null && _ref !== void 0 ? _ref : false;
    var [lastBoundingBox, updateBoundingBox] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useElementOffset$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useElementOffset"])([
        payload,
        finalIsActive
    ]);
    var finalLabel = tooltipEventType === 'axis' ? labelFromRedux : undefined;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$synchronisation$2f$useChartSynchronisation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTooltipChartSynchronisation"])(tooltipEventType, trigger, coordinate, finalLabel, activeIndex, finalIsActive);
    var tooltipPortal = portalFromProps !== null && portalFromProps !== void 0 ? portalFromProps : tooltipPortalFromContext;
    if (tooltipPortal == null || viewBox == null || tooltipEventType == null) {
        return null;
    }
    var finalPayload = payload !== null && payload !== void 0 ? payload : emptyPayload;
    if (!finalIsActive) {
        finalPayload = emptyPayload;
    }
    if (filterNull && finalPayload.length) {
        finalPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$payload$2f$getUniqPayload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUniqPayload"])(finalPayload.filter((entry)=>entry.value != null && (entry.hide !== true || props.includeHidden)), payloadUniqBy, defaultUniqBy);
    }
    var hasPayload = finalPayload.length > 0;
    var tooltipElement = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$TooltipBoundingBox$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipBoundingBox"], {
        allowEscapeViewBox: allowEscapeViewBox,
        animationDuration: animationDuration,
        animationEasing: animationEasing,
        isAnimationActive: isAnimationActive,
        active: finalIsActive,
        coordinate: coordinate,
        hasPayload: hasPayload,
        offset: offset,
        position: position,
        reverseDirection: reverseDirection,
        useTranslate3d: useTranslate3d,
        viewBox: viewBox,
        wrapperStyle: wrapperStyle,
        lastBoundingBox: lastBoundingBox,
        innerRef: updateBoundingBox,
        hasPortalFromProps: Boolean(portalFromProps)
    }, renderContent(content, _objectSpread(_objectSpread({}, props), {}, {
        payload: finalPayload,
        label: finalLabel,
        active: finalIsActive,
        activeIndex,
        coordinate,
        accessibilityLayer
    })));
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(tooltipElement, tooltipPortal), finalIsActive && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cursor$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cursor"], {
        cursor: cursor,
        tooltipEventType: tooltipEventType,
        coordinate: coordinate,
        payload: finalPayload,
        index: activeIndex
    }));
}
}),
"[project]/pwa/node_modules/recharts/es6/component/DefaultLegendContent.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DefaultLegendContent",
    ()=>DefaultLegendContent
]);
/**
 * @fileOverview Default Legend Content
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Surface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Surface.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Symbols$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Symbols.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
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
var SIZE = 32;
var defaultLegendContentDefaultProps = {
    align: 'center',
    iconSize: 14,
    inactiveColor: '#ccc',
    layout: 'horizontal',
    verticalAlign: 'middle'
};
function Icon(_ref) {
    var { data, iconType, inactiveColor } = _ref;
    var halfSize = SIZE / 2;
    var sixthSize = SIZE / 6;
    var thirdSize = SIZE / 3;
    var color = data.inactive ? inactiveColor : data.color;
    var preferredIcon = iconType !== null && iconType !== void 0 ? iconType : data.type;
    if (preferredIcon === 'none') {
        return null;
    }
    if (preferredIcon === 'plainline') {
        var _data$payload;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("line", {
            strokeWidth: 4,
            fill: "none",
            stroke: color,
            strokeDasharray: (_data$payload = data.payload) === null || _data$payload === void 0 ? void 0 : _data$payload.strokeDasharray,
            x1: 0,
            y1: halfSize,
            x2: SIZE,
            y2: halfSize,
            className: "recharts-legend-icon"
        });
    }
    if (preferredIcon === 'line') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", {
            strokeWidth: 4,
            fill: "none",
            stroke: color,
            d: "M0,".concat(halfSize, "h").concat(thirdSize, "\n            A").concat(sixthSize, ",").concat(sixthSize, ",0,1,1,").concat(2 * thirdSize, ",").concat(halfSize, "\n            H").concat(SIZE, "M").concat(2 * thirdSize, ",").concat(halfSize, "\n            A").concat(sixthSize, ",").concat(sixthSize, ",0,1,1,").concat(thirdSize, ",").concat(halfSize),
            className: "recharts-legend-icon"
        });
    }
    if (preferredIcon === 'rect') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", {
            stroke: "none",
            fill: color,
            d: "M0,".concat(SIZE / 8, "h").concat(SIZE, "v").concat(SIZE * 3 / 4, "h").concat(-SIZE, "z"),
            className: "recharts-legend-icon"
        });
    }
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](data.legendIcon)) {
        var iconProps = _objectSpread({}, data);
        delete iconProps.legendIcon;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"](data.legendIcon, iconProps);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Symbols$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Symbols"], {
        fill: color,
        cx: halfSize,
        cy: halfSize,
        size: SIZE,
        sizeType: "diameter",
        type: preferredIcon
    });
}
function Items(props) {
    var { payload, iconSize, layout, formatter, inactiveColor, iconType } = props;
    var viewBox = {
        x: 0,
        y: 0,
        width: SIZE,
        height: SIZE
    };
    var itemStyle = {
        display: layout === 'horizontal' ? 'inline-block' : 'block',
        marginRight: 10
    };
    var svgStyle = {
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: 4
    };
    return payload.map((entry, i)=>{
        var finalFormatter = entry.formatter || formatter;
        var className = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])({
            'recharts-legend-item': true,
            ["legend-item-".concat(i)]: true,
            inactive: entry.inactive
        });
        if (entry.type === 'none') {
            return null;
        }
        var color = entry.inactive ? inactiveColor : entry.color;
        var finalValue = finalFormatter ? finalFormatter(entry.value, entry, i) : entry.value;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("li", _extends({
            className: className,
            style: itemStyle,
            key: "legend-item-".concat(i)
        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adaptEventsOfChild"])(props, entry, i)), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Surface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Surface"], {
            width: iconSize,
            height: iconSize,
            viewBox: viewBox,
            style: svgStyle,
            "aria-label": "".concat(finalValue, " legend icon")
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Icon, {
            data: entry,
            iconType: iconType,
            inactiveColor: inactiveColor
        })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("span", {
            className: "recharts-legend-item-text",
            style: {
                color
            }
        }, finalValue));
    });
}
var DefaultLegendContent = (outsideProps)=>{
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultLegendContentDefaultProps);
    var { payload, layout, align } = props;
    if (!payload || !payload.length) {
        return null;
    }
    var finalStyle = {
        padding: 0,
        margin: 0,
        textAlign: layout === 'horizontal' ? align : 'left'
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("ul", {
        className: "recharts-default-legend",
        style: finalStyle
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](Items, _extends({}, props, {
        payload: payload
    })));
};
}),
"[project]/pwa/node_modules/recharts/es6/component/Legend.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Legend",
    ()=>Legend
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$legendPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/legendPortalContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$DefaultLegendContent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/DefaultLegendContent.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$payload$2f$getUniqPayload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/payload/getUniqPayload.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$legendPayloadContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/legendPayloadContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useElementOffset$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useElementOffset.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/legendSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var _excluded = [
    "contextPayload"
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
function defaultUniqBy(entry) {
    return entry.value;
}
function LegendContent(props) {
    var { contextPayload } = props, otherProps = _objectWithoutProperties(props, _excluded);
    var finalPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$payload$2f$getUniqPayload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUniqPayload"])(contextPayload, props.payloadUniqBy, defaultUniqBy);
    var contentProps = _objectSpread(_objectSpread({}, otherProps), {}, {
        payload: finalPayload
    });
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](props.content)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"](props.content, contentProps);
    }
    if (typeof props.content === 'function') {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](props.content, contentProps);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$DefaultLegendContent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultLegendContent"], contentProps);
}
function getDefaultPosition(style, props, margin, chartWidth, chartHeight, box) {
    var { layout, align, verticalAlign } = props;
    var hPos, vPos;
    if (!style || (style.left === undefined || style.left === null) && (style.right === undefined || style.right === null)) {
        if (align === 'center' && layout === 'vertical') {
            hPos = {
                left: ((chartWidth || 0) - box.width) / 2
            };
        } else {
            hPos = align === 'right' ? {
                right: margin && margin.right || 0
            } : {
                left: margin && margin.left || 0
            };
        }
    }
    if (!style || (style.top === undefined || style.top === null) && (style.bottom === undefined || style.bottom === null)) {
        if (verticalAlign === 'middle') {
            vPos = {
                top: ((chartHeight || 0) - box.height) / 2
            };
        } else {
            vPos = verticalAlign === 'bottom' ? {
                bottom: margin && margin.bottom || 0
            } : {
                top: margin && margin.top || 0
            };
        }
    }
    return _objectSpread(_objectSpread({}, hPos), vPos);
}
function LegendSettingsDispatcher(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setLegendSettings"])(props));
    }, [
        dispatch,
        props
    ]);
    return null;
}
function LegendSizeDispatcher(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setLegendSize"])(props));
        return ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setLegendSize"])({
                width: 0,
                height: 0
            }));
        };
    }, [
        dispatch,
        props
    ]);
    return null;
}
function getWidthOrHeight(layout, height, width, maxWidth) {
    if (layout === 'vertical' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(height)) {
        return {
            height
        };
    }
    if (layout === 'horizontal') {
        return {
            width: width || maxWidth
        };
    }
    return null;
}
var legendDefaultProps = {
    align: 'center',
    iconSize: 14,
    itemSorter: 'value',
    layout: 'horizontal',
    verticalAlign: 'bottom'
};
function Legend(outsideProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, legendDefaultProps);
    var contextPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$legendPayloadContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLegendPayload"])();
    var legendPortalFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$legendPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLegendPortal"])();
    var margin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMargin"])();
    var { width: widthFromProps, height: heightFromProps, wrapperStyle, portal: portalFromProps } = props;
    // The contextPayload is not used directly inside the hook, but we need the onBBoxUpdate call
    // when the payload changes, therefore it's here as a dependency.
    var [lastBoundingBox, updateBoundingBox] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useElementOffset$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useElementOffset"])([
        contextPayload
    ]);
    var chartWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartWidth"])();
    var chartHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartHeight"])();
    if (chartWidth == null || chartHeight == null) {
        return null;
    }
    var maxWidth = chartWidth - ((margin === null || margin === void 0 ? void 0 : margin.left) || 0) - ((margin === null || margin === void 0 ? void 0 : margin.right) || 0);
    var widthOrHeight = getWidthOrHeight(props.layout, heightFromProps, widthFromProps, maxWidth);
    // if the user supplies their own portal, only use their defined wrapper styles
    var outerStyle = portalFromProps ? wrapperStyle : _objectSpread(_objectSpread({
        position: 'absolute',
        width: (widthOrHeight === null || widthOrHeight === void 0 ? void 0 : widthOrHeight.width) || widthFromProps || 'auto',
        height: (widthOrHeight === null || widthOrHeight === void 0 ? void 0 : widthOrHeight.height) || heightFromProps || 'auto'
    }, getDefaultPosition(wrapperStyle, props, margin, chartWidth, chartHeight, lastBoundingBox)), wrapperStyle);
    var legendPortal = portalFromProps !== null && portalFromProps !== void 0 ? portalFromProps : legendPortalFromContext;
    if (legendPortal == null || contextPayload == null) {
        return null;
    }
    var legendElement = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", {
        className: "recharts-legend-wrapper",
        style: outerStyle,
        ref: updateBoundingBox
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](LegendSettingsDispatcher, {
        layout: props.layout,
        align: props.align,
        verticalAlign: props.verticalAlign,
        itemSorter: props.itemSorter
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](LegendSizeDispatcher, {
        width: lastBoundingBox.width,
        height: lastBoundingBox.height
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](LegendContent, _extends({}, props, widthOrHeight, {
        margin: margin,
        chartWidth: chartWidth,
        chartHeight: chartHeight,
        contextPayload: contextPayload
    })));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(legendElement, legendPortal);
}
Legend.displayName = 'Legend';
}),
];

//# sourceMappingURL=7dc3a_recharts_es6_component_447fdafb._.js.map