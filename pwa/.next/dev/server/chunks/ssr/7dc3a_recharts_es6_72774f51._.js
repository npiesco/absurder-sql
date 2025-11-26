module.exports = [
"[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PanoramaContextProvider",
    ()=>PanoramaContextProvider,
    "useIsPanorama",
    ()=>useIsPanorama
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
;
var PanoramaContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
var useIsPanorama = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(PanoramaContext) != null;
var PanoramaContextProvider = (_ref)=>{
    var { children } = _ref;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PanoramaContext.Provider, {
        value: true
    }, children);
};
}),
"[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReportChartMargin",
    ()=>ReportChartMargin,
    "ReportChartSize",
    ()=>ReportChartSize,
    "cartesianViewBoxToTrapezoid",
    ()=>cartesianViewBoxToTrapezoid,
    "selectChartLayout",
    ()=>selectChartLayout,
    "useChartHeight",
    ()=>useChartHeight,
    "useChartLayout",
    ()=>useChartLayout,
    "useChartWidth",
    ()=>useChartWidth,
    "useIsInChartContext",
    ()=>useIsInChartContext,
    "useMargin",
    ()=>useMargin,
    "useOffsetInternal",
    ()=>useOffsetInternal,
    "useViewBox",
    ()=>useViewBox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/layoutSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/brushSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/ResponsiveContainer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
function cartesianViewBoxToTrapezoid(box) {
    if (!box) {
        return undefined;
    }
    return {
        x: box.x,
        y: box.y,
        upperWidth: 'upperWidth' in box ? box.upperWidth : box.width,
        lowerWidth: 'lowerWidth' in box ? box.lowerWidth : box.width,
        width: box.width,
        height: box.height
    };
}
var useViewBox = ()=>{
    var _useAppSelector;
    var panorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var rootViewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectChartViewBox"]);
    var brushDimensions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectBrushDimensions"]);
    var brushPadding = (_useAppSelector = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectBrushSettings"])) === null || _useAppSelector === void 0 ? void 0 : _useAppSelector.padding;
    if (!panorama || !brushDimensions || !brushPadding) {
        return rootViewBox;
    }
    return {
        width: brushDimensions.width - brushPadding.left - brushPadding.right,
        height: brushDimensions.height - brushPadding.top - brushPadding.bottom,
        x: brushPadding.left,
        y: brushPadding.top
    };
};
var manyComponentsThrowErrorsIfOffsetIsUndefined = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    brushBottom: 0
};
var useOffsetInternal = ()=>{
    var _useAppSelector2;
    return (_useAppSelector2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"])) !== null && _useAppSelector2 !== void 0 ? _useAppSelector2 : manyComponentsThrowErrorsIfOffsetIsUndefined;
};
var useChartWidth = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectChartWidth"]);
};
var useChartHeight = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectChartHeight"]);
};
var useMargin = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>state.layout.margin);
};
var selectChartLayout = (state)=>state.layout.layoutType;
var useChartLayout = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(selectChartLayout);
var useIsInChartContext = ()=>{
    /*
   * All charts provide a layout type in the chart context.
   * If we have a layout type, we are in a chart context.
   */ var layout = useChartLayout();
    return layout !== undefined;
};
var ReportChartSize = (props)=>{
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    /*
   * Skip dispatching properties in panorama chart for two reasons:
   * 1. The root chart should be deciding on these properties, and
   * 2. Brush reads these properties from redux store, and so they must remain stable
   *      to avoid circular dependency and infinite re-rendering.
   */ var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var { width: widthFromProps, height: heightFromProps } = props;
    var responsiveContainerCalculations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useResponsiveContainerContext"])();
    var width = widthFromProps;
    var height = heightFromProps;
    if (responsiveContainerCalculations) {
        /*
     * In case we receive width and height from ResponsiveContainer,
     * we will always prefer those.
     * Only in case ResponsiveContainer does not provide width or height,
     * we will fall back to the explicitly provided width and height.
     *
     * This to me feels backwards - we should allow override by the more specific props on individual charts, right?
     * But this is 3.x behaviour, so let's keep it for backwards compatibility.
     *
     * We can change this in 4.x if we want to.
     */ width = responsiveContainerCalculations.width > 0 ? responsiveContainerCalculations.width : widthFromProps;
        height = responsiveContainerCalculations.height > 0 ? responsiveContainerCalculations.height : heightFromProps;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isPanorama && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(width) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(height)) {
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setChartSize"])({
                width,
                height
            }));
        }
    }, [
        dispatch,
        isPanorama,
        width,
        height
    ]);
    return null;
};
var ReportChartMargin = (_ref)=>{
    var { margin } = _ref;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setMargin"])(margin));
    }, [
        dispatch,
        margin
    ]);
    return null;
};
}),
"[project]/pwa/node_modules/recharts/es6/context/chartDataContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartDataContextProvider",
    ()=>ChartDataContextProvider,
    "SetComputedData",
    ()=>SetComputedData,
    "useChartData",
    ()=>useChartData,
    "useDataIndex",
    ()=>useDataIndex
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/chartDataSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-ssr] (ecmascript)");
;
;
;
;
var ChartDataContextProvider = (props)=>{
    var { chartData } = props;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isPanorama) {
            // Panorama mode reuses data from the main chart, so we must not overwrite it here.
            return ()=>{
            // there is nothing to clean up
            };
        }
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setChartData"])(chartData));
        return ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setChartData"])(undefined));
        };
    }, [
        chartData,
        dispatch,
        isPanorama
    ]);
    return null;
};
var SetComputedData = (props)=>{
    var { computedData } = props;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setComputedData"])(computedData));
        return ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setChartData"])(undefined));
        };
    }, [
        computedData,
        dispatch
    ]);
    return null;
};
var selectChartData = (state)=>state.chartData.chartData;
var useChartData = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(selectChartData);
var selectDataIndex = (state)=>{
    var { dataStartIndex, dataEndIndex } = state.chartData;
    return {
        startIndex: dataStartIndex,
        endIndex: dataEndIndex
    };
};
var useDataIndex = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(selectDataIndex);
};
}),
"[project]/pwa/node_modules/recharts/es6/context/accessibilityContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAccessibilityLayer",
    ()=>useAccessibilityLayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
;
var useAccessibilityLayer = ()=>{
    var _useAppSelector;
    return (_useAppSelector = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>state.rootProps.accessibilityLayer)) !== null && _useAppSelector !== void 0 ? _useAppSelector : true;
};
}),
"[project]/pwa/node_modules/recharts/es6/context/tooltipPortalContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TooltipPortalContext",
    ()=>TooltipPortalContext,
    "useTooltipPortal",
    ()=>useTooltipPortal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
var TooltipPortalContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
var useTooltipPortal = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(TooltipPortalContext);
}),
"[project]/pwa/node_modules/recharts/es6/context/legendPortalContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LegendPortalContext",
    ()=>LegendPortalContext,
    "useLegendPortal",
    ()=>useLegendPortal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
var LegendPortalContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
var useLegendPortal = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(LegendPortalContext);
}),
"[project]/pwa/node_modules/recharts/es6/context/RegisterGraphicalItemId.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RegisterGraphicalItemId",
    ()=>RegisterGraphicalItemId,
    "useGraphicalItemId",
    ()=>useGraphicalItemId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useUniqueId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useUniqueId.js [app-ssr] (ecmascript)");
;
;
;
var GraphicalItemIdContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
var RegisterGraphicalItemId = (_ref)=>{
    var { id, type, children } = _ref;
    var resolvedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useUniqueId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUniqueId"])("recharts-".concat(type), id);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](GraphicalItemIdContext.Provider, {
        value: resolvedId
    }, children(resolvedId));
};
function useGraphicalItemId() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(GraphicalItemIdContext);
}
}),
"[project]/pwa/node_modules/recharts/es6/context/ErrorBarContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReportErrorBarSettings",
    ()=>ReportErrorBarSettings,
    "SetErrorBarContext",
    ()=>SetErrorBarContext,
    "useErrorBarContext",
    ()=>useErrorBarContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$errorBarSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/errorBarSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/RegisterGraphicalItemId.js [app-ssr] (ecmascript)");
var _excluded = [
    "children"
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
;
;
;
;
;
var initialContextState = {
    data: [],
    xAxisId: 'xAxis-0',
    yAxisId: 'yAxis-0',
    dataPointFormatter: ()=>({
            x: 0,
            y: 0,
            value: 0
        }),
    errorBarOffset: 0
};
var ErrorBarContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(initialContextState);
function SetErrorBarContext(props) {
    var { children } = props, rest = _objectWithoutProperties(props, _excluded);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ErrorBarContext.Provider, {
        value: rest
    }, children);
}
var useErrorBarContext = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ErrorBarContext);
function ReportErrorBarSettings(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var graphicalItemId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGraphicalItemId"])();
    var prevPropsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (graphicalItemId == null) {
            // ErrorBar outside a graphical item context does not do anything.
            return;
        }
        if (prevPropsRef.current === null) {
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$errorBarSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addErrorBar"])({
                itemId: graphicalItemId,
                errorBar: props
            }));
        } else if (prevPropsRef.current !== props) {
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$errorBarSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["replaceErrorBar"])({
                itemId: graphicalItemId,
                prev: prevPropsRef.current,
                next: props
            }));
        }
        prevPropsRef.current = props;
    }, [
        dispatch,
        graphicalItemId,
        props
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            if (prevPropsRef.current != null && graphicalItemId != null) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$errorBarSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["removeErrorBar"])({
                    itemId: graphicalItemId,
                    errorBar: prevPropsRef.current
                }));
                prevPropsRef.current = null;
            }
        };
    }, [
        dispatch,
        graphicalItemId
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/context/tooltipContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMouseClickItemDispatch",
    ()=>useMouseClickItemDispatch,
    "useMouseEnterItemDispatch",
    ()=>useMouseEnterItemDispatch,
    "useMouseLeaveItemDispatch",
    ()=>useMouseLeaveItemDispatch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-ssr] (ecmascript)");
;
;
var useMouseEnterItemDispatch = (onMouseEnterFromProps, dataKey)=>{
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    return (data, index)=>(event)=>{
            onMouseEnterFromProps === null || onMouseEnterFromProps === void 0 || onMouseEnterFromProps(data, index, event);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setActiveMouseOverItemIndex"])({
                activeIndex: String(index),
                activeDataKey: dataKey,
                activeCoordinate: data.tooltipPosition
            }));
        };
};
var useMouseLeaveItemDispatch = (onMouseLeaveFromProps)=>{
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    return (data, index)=>(event)=>{
            onMouseLeaveFromProps === null || onMouseLeaveFromProps === void 0 || onMouseLeaveFromProps(data, index, event);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mouseLeaveItem"])());
        };
};
var useMouseClickItemDispatch = (onMouseClickFromProps, dataKey)=>{
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    return (data, index)=>(event)=>{
            onMouseClickFromProps === null || onMouseClickFromProps === void 0 || onMouseClickFromProps(data, index, event);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setActiveClickItemIndex"])({
                activeIndex: String(index),
                activeDataKey: dataKey,
                activeCoordinate: data.tooltipPosition
            }));
        };
};
}),
"[project]/pwa/node_modules/recharts/es6/context/useTooltipAxis.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useTooltipAxis",
    ()=>useTooltipAxis,
    "useTooltipAxisBandSize",
    ()=>useTooltipAxisBandSize
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-ssr] (ecmascript)");
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
var useTooltipAxis = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectTooltipAxis"]);
var useTooltipAxisBandSize = ()=>{
    var tooltipAxis = useTooltipAxis();
    var tooltipTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"]);
    var tooltipAxisScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectTooltipAxisScale"]);
    if (!tooltipAxis || !tooltipAxisScale) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getBandSizeOfAxis"])(undefined, tooltipTicks);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getBandSizeOfAxis"])(_objectSpread(_objectSpread({}, tooltipAxis), {}, {
        scale: tooltipAxisScale
    }), tooltipTicks);
};
}),
"[project]/pwa/node_modules/recharts/es6/context/legendPayloadContext.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useLegendPayload",
    ()=>useLegendPayload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$legendSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/legendSelectors.js [app-ssr] (ecmascript)");
;
;
function useLegendPayload() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$legendSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectLegendPayload"]);
}
}),
"[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * A collection of all default zIndex values used throughout the library.
 */ __turbopack_context__.s([
    "DefaultZIndexes",
    ()=>DefaultZIndexes
]);
var DefaultZIndexes = {
    /**
   * CartesianGrid and PolarGrid
   */ grid: -100,
    /**
   * Background of Bar and RadialBar.
   * This is not visible by default but can be enabled by setting background={true} on Bar or RadialBar.
   */ barBackground: -50,
    /*
   * other chart elements or custom elements without specific zIndex
   * render in here, at zIndex 0
   */ /**
   * Area, Pie, Radar, and ReferenceArea
   */ area: 100,
    /**
   * Cursor is embedded inside Tooltip and controlled by it.
   * The Tooltip itself has a separate portal and is not included in the zIndex system;
   * Cursor is the decoration inside the chart area. CursorRectangle is a rectangle box.
   * It renders below bar so that in a stacked bar chart the cursor rectangle does not hide the other bars.
   */ cursorRectangle: 200,
    /**
   * Bar and RadialBar
   */ bar: 300,
    /**
   * Line and ReferenceLine, and ErrorBor
   */ line: 400,
    /**
   * XAxis and YAxis and PolarAngleAxis and PolarRadiusAxis ticks and lines and children
   */ axis: 500,
    /**
   * Scatter and ReferenceDot,
   * and Dots of Line and Area and Radar if they have dot=true
   */ scatter: 600,
    /**
   * Hovering over a Bar or RadialBar renders a highlight rectangle
   */ activeBar: 1000,
    /**
   * Cursor is embedded inside Tooltip and controlled by it.
   * The Tooltip itself has a separate portal and is not included in the zIndex system;
   * Cursor is the decoration inside the chart area, usually a cross or a box.
   * CursorLine is a line cursor rendered in Line, Area, Scatter, Radar charts.
   * It renders above the Line and Scatter so that it is always visible.
   * It renders below active dot so that the dot is always visible and shows the current point.
   * We're also assuming that the active dot is small enough that it does not fully cover the cursor line.
   *
   * This also applies to the radial cursor in RadialBarChart.
   */ cursorLine: 1100,
    /**
   * Hovering over a Point in Line, Area, Scatter, Radar renders a highlight dot
   */ activeDot: 1200,
    /**
   * LabelList and Label, including Axis labels
   */ label: 2000
};
}),
"[project]/pwa/node_modules/recharts/es6/zIndex/zIndexSelectors.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectAllRegisteredZIndexes",
    ()=>selectAllRegisteredZIndexes,
    "selectZIndexPortalId",
    ()=>selectZIndexPortalId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/arrayEqualityCheck.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
;
;
;
var selectZIndexPortalId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createSelector"])((state)=>state.zIndex.zIndexMap, (_, zIndex)=>zIndex, (_, _zIndex, isPanorama)=>isPanorama, (zIndexMap, zIndex, isPanorama)=>{
    if (zIndex == null) {
        return undefined;
    }
    var entry = zIndexMap[zIndex];
    if (entry == null) {
        return undefined;
    }
    if (isPanorama) {
        return entry.panoramaElementId;
    }
    return entry.elementId;
});
var selectAllRegisteredZIndexes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createSelector"])((state)=>state.zIndex.zIndexMap, (zIndexMap)=>{
    var allNumbers = Object.keys(zIndexMap).map((zIndexStr)=>parseInt(zIndexStr, 10)).concat(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"]));
    var uniqueNumbers = Array.from(new Set(allNumbers));
    return uniqueNumbers.sort((a, b)=>a - b);
}, {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["arrayContentsAreEqualCheck"]
    }
});
}),
"[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexPortal.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AllZIndexPortals",
    ()=>AllZIndexPortals
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/zIndexSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useUniqueId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useUniqueId.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$zIndexSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/zIndexSelectors.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
function ZIndexSvgPortal(_ref) {
    var { zIndex, isPanorama } = _ref;
    var prefix = isPanorama ? "recharts-zindex-panorama-" : "recharts-zindex-";
    var portalId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useUniqueId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUniqueId"])("".concat(prefix).concat(zIndex));
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["registerZIndexPortalId"])({
            zIndex,
            elementId: portalId,
            isPanorama
        }));
        return ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unregisterZIndexPortalId"])({
                zIndex,
                isPanorama
            }));
        };
    }, [
        dispatch,
        zIndex,
        portalId,
        isPanorama
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("g", {
        id: portalId
    });
}
function AllZIndexPortals(_ref2) {
    var { children, isPanorama } = _ref2;
    var allRegisteredZIndexes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$zIndexSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectAllRegisteredZIndexes"]);
    if (!allRegisteredZIndexes || allRegisteredZIndexes.length === 0) {
        return children;
    }
    var allNegativeZIndexes = allRegisteredZIndexes.filter((zIndex)=>zIndex < 0);
    // We exclude zero on purpose - that is the default layer, and it doesn't need a portal.
    var allPositiveZIndexes = allRegisteredZIndexes.filter((zIndex)=>zIndex > 0);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, allNegativeZIndexes.map((zIndex)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ZIndexSvgPortal, {
            key: zIndex,
            zIndex: zIndex,
            isPanorama: isPanorama
        })), children, allPositiveZIndexes.map((zIndex)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ZIndexSvgPortal, {
            key: zIndex,
            zIndex: zIndex,
            isPanorama: isPanorama
        })));
}
}),
"[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ZIndexLayer",
    ()=>ZIndexLayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$zIndexSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/zIndexSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/zIndexSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
function ZIndexLayer(_ref) {
    var { zIndex, children } = _ref;
    /*
   * If we are outside of chart, then we can't rely on the zIndex portal state,
   * so we just render normally.
   */ var isInChartContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsInChartContext"])();
    /*
   * If zIndex is undefined then we render normally without portals.
   * Also, if zIndex is 0, we render normally without portals,
   * because 0 is the default layer that does not need a portal.
   */ var shouldRenderInPortal = isInChartContext && zIndex !== undefined && zIndex !== 0;
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (!shouldRenderInPortal) {
            // Nothing to do. We have to call the hook because of the rules of hooks.
            return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["noop"];
        }
        /*
     * Because zIndexes are dynamic (meaning, we're not working with a predefined set of layers,
     * but we allow users to define any zIndex at any time), we need to register
     * the requested zIndex in the global store. This way, the ZIndexPortals component
     * can render the corresponding portals and only the requested ones.
     */ dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["registerZIndexPortal"])({
            zIndex
        }));
        return ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unregisterZIndexPortal"])({
                zIndex
            }));
        };
    }, [
        dispatch,
        zIndex,
        shouldRenderInPortal
    ]);
    var portalId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$zIndexSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectZIndexPortalId"])(state, zIndex, isPanorama));
    if (!shouldRenderInPortal) {
        // If no zIndex is provided or zIndex is 0, render normally without portals
        return children;
    }
    if (!portalId) {
        /*
     * If we don't have a portalId yet, this means that the registration
     * has not been processed yet by the ZIndexPortals component.
     * So here we render null and wait for the next render cycle.
     */ return null;
    }
    var zIndexPortal = document.getElementById(portalId);
    if (zIndexPortal) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(children, zIndexPortal);
    }
    /*
   * If the portal is not found, this means it has not been rendered yet.
   * So here we render null and wait for the next render cycle.
   */ return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/zIndex/getZIndexFromUnknown.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getZIndexFromUnknown",
    ()=>getZIndexFromUnknown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-ssr] (ecmascript)");
;
function getZIndexFromUnknown(input, defaultZIndex) {
    if (input && typeof input === 'object' && 'zIndex' in input && typeof input.zIndex === 'number' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(input.zIndex)) {
        return input.zIndex;
    }
    return defaultZIndex;
}
}),
"[project]/pwa/node_modules/recharts/es6/polar/defaultPolarAngleAxisProps.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultPolarAngleAxisProps",
    ()=>defaultPolarAngleAxisProps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
;
var defaultPolarAngleAxisProps = {
    allowDecimals: false,
    allowDuplicatedCategory: true,
    // if I set this to false then Tooltip synchronisation stops working in Radar, wtf
    angleAxisId: 0,
    axisLine: true,
    cx: 0,
    cy: 0,
    orientation: 'outer',
    reversed: false,
    scale: 'auto',
    tick: true,
    tickLine: true,
    tickSize: 8,
    type: 'category',
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].axis
};
}),
"[project]/pwa/node_modules/recharts/es6/polar/defaultPolarRadiusAxisProps.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultPolarRadiusAxisProps",
    ()=>defaultPolarRadiusAxisProps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
;
var defaultPolarRadiusAxisProps = {
    allowDataOverflow: false,
    allowDecimals: false,
    allowDuplicatedCategory: true,
    angle: 0,
    axisLine: true,
    cx: 0,
    cy: 0,
    includeHidden: false,
    orientation: 'right',
    radiusAxisId: 0,
    reversed: false,
    scale: 'auto',
    stroke: '#ccc',
    tick: true,
    tickCount: 5,
    type: 'number',
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].axis
};
}),
"[project]/pwa/node_modules/recharts/es6/polar/Pie.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Pie",
    ()=>Pie,
    "computePieSectors",
    ()=>computePieSectors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/get.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pieSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/pieSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/shape/Curve.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Text.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/Cell.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ReactUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ActiveShapeUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/tooltipContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetTooltipEntrySettings.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetLegendPayload.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Constants.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/RegisterGraphicalItemId.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/SetGraphicalItem.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/LabelList.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexLayer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-ssr] (ecmascript)");
var _excluded = [
    "onMouseEnter",
    "onClick",
    "onMouseLeave"
], _excluded2 = [
    "id"
], _excluded3 = [
    "id"
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
 * The `label` prop in Pie accepts a variety of alternatives.
 */ /**
 * We spread the data object into the sector data item,
 * so we can't really know what is going to be inside.
 *
 * This type represents our best effort, but it all depends on the input data
 * and what is inside of it.
 *
 * https://github.com/recharts/recharts/issues/6380
 * https://github.com/recharts/recharts/discussions/6375
 */ /**
 * Internal props, combination of external props + defaultProps + private Recharts state
 */ function SetPiePayloadLegend(props) {
    var cells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findAllByType"])(props.children, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cell"]), [
        props.children
    ]);
    var legendPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pieSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectPieLegend"])(state, props.id, cells));
    if (legendPayload == null) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetLegendPayload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SetPolarLegendPayload"], {
        legendPayload: legendPayload
    });
}
function getTooltipEntrySettings(props) {
    var { dataKey, nameKey, sectors, stroke, strokeWidth, fill, name, hide, tooltipType } = props;
    return {
        dataDefinedOnItem: sectors.map((p)=>p.tooltipPayload),
        positions: sectors.map((p)=>p.tooltipPosition),
        settings: {
            stroke,
            strokeWidth,
            fill,
            dataKey,
            nameKey,
            name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, dataKey),
            hide,
            type: tooltipType,
            color: fill,
            unit: '' // why doesn't Pie support unit?
        }
    };
}
var getTextAnchor = (x, cx)=>{
    if (x > cx) {
        return 'start';
    }
    if (x < cx) {
        return 'end';
    }
    return 'middle';
};
var getOuterRadius = (dataPoint, outerRadius, maxPieRadius)=>{
    if (typeof outerRadius === 'function') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(outerRadius(dataPoint), maxPieRadius, maxPieRadius * 0.8);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(outerRadius, maxPieRadius, maxPieRadius * 0.8);
};
var parseCoordinateOfPie = (pieSettings, offset, dataPoint)=>{
    var { top, left, width, height } = offset;
    var maxPieRadius = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaxRadius"])(width, height);
    var cx = left + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(pieSettings.cx, width, width / 2);
    var cy = top + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(pieSettings.cy, height, height / 2);
    var innerRadius = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(pieSettings.innerRadius, maxPieRadius, 0);
    var outerRadius = getOuterRadius(dataPoint, pieSettings.outerRadius, maxPieRadius);
    var maxRadius = pieSettings.maxRadius || Math.sqrt(width * width + height * height) / 2;
    return {
        cx,
        cy,
        innerRadius,
        outerRadius,
        maxRadius
    };
};
var parseDeltaAngle = (startAngle, endAngle)=>{
    var sign = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(endAngle - startAngle);
    var deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360);
    return sign * deltaAngle;
};
function getClassNamePropertyIfExists(u) {
    if (u && typeof u === 'object' && 'className' in u && typeof u.className === 'string') {
        return u.className;
    }
    return '';
}
var renderLabelLineItem = (option, props)=>{
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](option)) {
        // @ts-expect-error we can't know if the type of props matches the element
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"](option, props);
    }
    if (typeof option === 'function') {
        return option(props);
    }
    var className = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-pie-label-line', typeof option !== 'boolean' ? option.className : '');
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$shape$2f$Curve$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Curve"], _extends({}, props, {
        type: "linear",
        className: className
    }));
};
var renderLabelItem = (option, props, value)=>{
    if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](option)) {
        // @ts-expect-error element cloning is not typed
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cloneElement"](option, props);
    }
    var label = value;
    if (typeof option === 'function') {
        label = option(props);
        if (/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"](label)) {
            return label;
        }
    }
    var className = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-pie-label-text', getClassNamePropertyIfExists(option));
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], _extends({}, props, {
        alignmentBaseline: "middle",
        className: className
    }), label);
};
function PieLabels(_ref) {
    var { sectors, props, showLabels } = _ref;
    var { label, labelLine, dataKey } = props;
    if (!showLabels || !label || !sectors) {
        return null;
    }
    var pieProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(props);
    var customLabelProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(label);
    var customLabelLineProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEventsFromUnknown"])(labelLine);
    var offsetRadius = typeof label === 'object' && 'offsetRadius' in label && typeof label.offsetRadius === 'number' && label.offsetRadius || 20;
    var labels = sectors.map((entry, i)=>{
        var midAngle = (entry.startAngle + entry.endAngle) / 2;
        var endPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(entry.cx, entry.cy, entry.outerRadius + offsetRadius, midAngle);
        var labelProps = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, pieProps), entry), {}, {
            // @ts-expect-error customLabelProps is contributing unknown props
            stroke: 'none'
        }, customLabelProps), {}, {
            index: i,
            textAnchor: getTextAnchor(endPoint.x, entry.cx)
        }, endPoint);
        var lineProps = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, pieProps), entry), {}, {
            // @ts-expect-error customLabelLineProps is contributing unknown props
            fill: 'none',
            // @ts-expect-error customLabelLineProps is contributing unknown props
            stroke: entry.fill
        }, customLabelLineProps), {}, {
            index: i,
            points: [
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(entry.cx, entry.cy, entry.outerRadius, midAngle),
                endPoint
            ],
            key: 'line'
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
            zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].label,
            key: "label-".concat(entry.startAngle, "-").concat(entry.endAngle, "-").concat(entry.midAngle, "-").concat(i)
        }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], null, labelLine && renderLabelLineItem(labelLine, lineProps), renderLabelItem(label, labelProps, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey))));
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], {
        className: "recharts-pie-labels"
    }, labels);
}
function PieLabelList(_ref2) {
    var { sectors, props, showLabels } = _ref2;
    var { label } = props;
    if (typeof label === 'object' && label != null && 'position' in label) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LabelListFromLabelProp"], {
            label: label
        });
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PieLabels, {
        sectors: sectors,
        props: props,
        showLabels: showLabels
    });
}
function PieSectors(props) {
    var { sectors, activeShape, inactiveShape: inactiveShapeProp, allOtherPieProps } = props;
    var activeIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"]);
    var { onMouseEnter: onMouseEnterFromProps, onClick: onItemClickFromProps, onMouseLeave: onMouseLeaveFromProps } = allOtherPieProps, restOfAllOtherProps = _objectWithoutProperties(allOtherPieProps, _excluded);
    var onMouseEnterFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMouseEnterItemDispatch"])(onMouseEnterFromProps, allOtherPieProps.dataKey);
    var onMouseLeaveFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMouseLeaveItemDispatch"])(onMouseLeaveFromProps);
    var onClickFromContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMouseClickItemDispatch"])(onItemClickFromProps, allOtherPieProps.dataKey);
    if (sectors == null || sectors.length === 0) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, sectors.map((entry, i)=>{
        if ((entry === null || entry === void 0 ? void 0 : entry.startAngle) === 0 && (entry === null || entry === void 0 ? void 0 : entry.endAngle) === 0 && sectors.length !== 1) return null;
        var isSectorActive = activeShape && String(i) === activeIndex;
        var inactiveShape = activeIndex ? inactiveShapeProp : null;
        var sectorOptions = isSectorActive ? activeShape : inactiveShape;
        var sectorProps = _objectSpread(_objectSpread({}, entry), {}, {
            stroke: entry.stroke,
            tabIndex: -1,
            [__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DATA_ITEM_INDEX_ATTRIBUTE_NAME"]]: i,
            [__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DATA_ITEM_DATAKEY_ATTRIBUTE_NAME"]]: allOtherPieProps.dataKey
        });
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], _extends({
            key: "sector-".concat(entry === null || entry === void 0 ? void 0 : entry.startAngle, "-").concat(entry === null || entry === void 0 ? void 0 : entry.endAngle, "-").concat(entry.midAngle, "-").concat(i),
            tabIndex: -1,
            className: "recharts-pie-sector"
        }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adaptEventsOfChild"])(restOfAllOtherProps, entry, i), {
            // @ts-expect-error the types need a bit of attention
            onMouseEnter: onMouseEnterFromContext(entry, i),
            onMouseLeave: onMouseLeaveFromContext(entry, i),
            onClick: onClickFromContext(entry, i)
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ActiveShapeUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shape"], _extends({
            option: sectorOptions,
            isActive: isSectorActive,
            shapeType: "sector"
        }, sectorProps)));
    }));
}
function computePieSectors(_ref3) {
    var _pieSettings$paddingA;
    var { pieSettings, displayedData, cells, offset } = _ref3;
    var { cornerRadius, startAngle, endAngle, dataKey, nameKey, tooltipType } = pieSettings;
    var minAngle = Math.abs(pieSettings.minAngle);
    var deltaAngle = parseDeltaAngle(startAngle, endAngle);
    var absDeltaAngle = Math.abs(deltaAngle);
    var paddingAngle = displayedData.length <= 1 ? 0 : (_pieSettings$paddingA = pieSettings.paddingAngle) !== null && _pieSettings$paddingA !== void 0 ? _pieSettings$paddingA : 0;
    var notZeroItemCount = displayedData.filter((entry)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey, 0) !== 0).length;
    var totalPaddingAngle = (absDeltaAngle >= 360 ? notZeroItemCount : notZeroItemCount - 1) * paddingAngle;
    var realTotalAngle = absDeltaAngle - notZeroItemCount * minAngle - totalPaddingAngle;
    var sum = displayedData.reduce((result, entry)=>{
        var val = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey, 0);
        return result + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(val) ? val : 0);
    }, 0);
    var sectors;
    if (sum > 0) {
        var prev;
        sectors = displayedData.map((entry, i)=>{
            // @ts-expect-error getValueByDataKey does not validate the output type
            var val = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey, 0);
            // @ts-expect-error getValueByDataKey does not validate the output type
            var name = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, nameKey, i);
            var coordinate = parseCoordinateOfPie(pieSettings, offset, entry);
            var percent = ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(val) ? val : 0) / sum;
            var tempStartAngle;
            var entryWithCellInfo = _objectSpread(_objectSpread({}, entry), cells && cells[i] && cells[i].props);
            if (i) {
                tempStartAngle = prev.endAngle + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(deltaAngle) * paddingAngle * (val !== 0 ? 1 : 0);
            } else {
                tempStartAngle = startAngle;
            }
            var tempEndAngle = tempStartAngle + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(deltaAngle) * ((val !== 0 ? minAngle : 0) + percent * realTotalAngle);
            var midAngle = (tempStartAngle + tempEndAngle) / 2;
            var middleRadius = (coordinate.innerRadius + coordinate.outerRadius) / 2;
            var tooltipPayload = [
                {
                    name,
                    value: val,
                    payload: entryWithCellInfo,
                    dataKey,
                    type: tooltipType
                }
            ];
            var tooltipPosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(coordinate.cx, coordinate.cy, middleRadius, midAngle);
            prev = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, pieSettings.presentationProps), {}, {
                percent,
                cornerRadius: typeof cornerRadius === 'string' ? parseFloat(cornerRadius) : cornerRadius,
                name,
                tooltipPayload,
                midAngle,
                middleRadius,
                tooltipPosition
            }, entryWithCellInfo), coordinate), {}, {
                value: val,
                startAngle: tempStartAngle,
                endAngle: tempEndAngle,
                payload: entryWithCellInfo,
                paddingAngle: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(deltaAngle) * paddingAngle
            });
            return prev;
        });
    }
    return sectors;
}
function PieLabelListProvider(_ref4) {
    var { showLabels, sectors, children } = _ref4;
    var labelListEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!showLabels || !sectors) {
            return [];
        }
        return sectors.map((entry)=>({
                value: entry.value,
                payload: entry.payload,
                clockWise: false,
                parentViewBox: undefined,
                viewBox: {
                    cx: entry.cx,
                    cy: entry.cy,
                    innerRadius: entry.innerRadius,
                    outerRadius: entry.outerRadius,
                    startAngle: entry.startAngle,
                    endAngle: entry.endAngle,
                    clockWise: false
                },
                fill: entry.fill
            }));
    }, [
        sectors,
        showLabels
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$LabelList$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PolarLabelListContextProvider"], {
        value: showLabels ? labelListEntries : undefined
    }, children);
}
function SectorsWithAnimation(_ref5) {
    var { props, previousSectorsRef } = _ref5;
    var { sectors, isAnimationActive, animationBegin, animationDuration, animationEasing, activeShape, inactiveShape, onAnimationStart, onAnimationEnd } = props;
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnimationId"])(props, 'recharts-pie-');
    var prevSectors = previousSectorsRef.current;
    var [isAnimating, setIsAnimating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    var handleAnimationEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (typeof onAnimationEnd === 'function') {
            onAnimationEnd();
        }
        setIsAnimating(false);
    }, [
        onAnimationEnd
    ]);
    var handleAnimationStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (typeof onAnimationStart === 'function') {
            onAnimationStart();
        }
        setIsAnimating(true);
    }, [
        onAnimationStart
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PieLabelListProvider, {
        showLabels: !isAnimating,
        sectors: sectors
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["JavascriptAnimate"], {
        animationId: animationId,
        begin: animationBegin,
        duration: animationDuration,
        isActive: isAnimationActive,
        easing: animationEasing,
        onAnimationStart: handleAnimationStart,
        onAnimationEnd: handleAnimationEnd,
        key: animationId
    }, (t)=>{
        var stepData = [];
        var first = sectors && sectors[0];
        var curAngle = first === null || first === void 0 ? void 0 : first.startAngle;
        sectors === null || sectors === void 0 || sectors.forEach((entry, index)=>{
            var prev = prevSectors && prevSectors[index];
            var paddingAngle = index > 0 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$get$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(entry, 'paddingAngle', 0) : 0;
            if (prev) {
                var angle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prev.endAngle - prev.startAngle, entry.endAngle - entry.startAngle, t);
                var latest = _objectSpread(_objectSpread({}, entry), {}, {
                    startAngle: curAngle + paddingAngle,
                    endAngle: curAngle + angle + paddingAngle
                });
                stepData.push(latest);
                curAngle = latest.endAngle;
            } else {
                var { endAngle, startAngle } = entry;
                var deltaAngle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(0, endAngle - startAngle, t);
                var _latest = _objectSpread(_objectSpread({}, entry), {}, {
                    startAngle: curAngle + paddingAngle,
                    endAngle: curAngle + deltaAngle + paddingAngle
                });
                stepData.push(_latest);
                curAngle = _latest.endAngle;
            }
        });
        // eslint-disable-next-line no-param-reassign
        previousSectorsRef.current = stepData;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PieSectors, {
            sectors: stepData,
            activeShape: activeShape,
            inactiveShape: inactiveShape,
            allOtherPieProps: props
        }));
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PieLabelList, {
        showLabels: !isAnimating,
        sectors: sectors,
        props: props
    }), props.children);
}
var defaultPieProps = {
    animationBegin: 400,
    animationDuration: 1500,
    animationEasing: 'ease',
    cx: '50%',
    cy: '50%',
    dataKey: 'value',
    endAngle: 360,
    fill: '#808080',
    hide: false,
    innerRadius: 0,
    isAnimationActive: !__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Global"].isSsr,
    labelLine: true,
    legendType: 'rect',
    minAngle: 0,
    nameKey: 'name',
    outerRadius: '80%',
    paddingAngle: 0,
    rootTabIndex: 0,
    startAngle: 0,
    stroke: '#fff',
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultZIndexes"].area
};
function PieImpl(props) {
    var { id } = props, propsWithoutId = _objectWithoutProperties(props, _excluded2);
    var { hide, className, rootTabIndex } = props;
    var cells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ReactUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findAllByType"])(props.children, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cell"]), [
        props.children
    ]);
    var sectors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pieSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectPieSectors"])(state, id, cells));
    var previousSectorsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-pie', className);
    if (hide || sectors == null) {
        previousSectorsRef.current = null;
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], {
            tabIndex: rootTabIndex,
            className: layerClass
        });
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexLayer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZIndexLayer"], {
        zIndex: props.zIndex
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetTooltipEntrySettings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SetTooltipEntrySettings"], {
        fn: getTooltipEntrySettings,
        args: _objectSpread(_objectSpread({}, props), {}, {
            sectors
        })
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Layer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Layer"], {
        tabIndex: rootTabIndex,
        className: layerClass
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](SectorsWithAnimation, {
        props: _objectSpread(_objectSpread({}, propsWithoutId), {}, {
            sectors
        }),
        previousSectorsRef: previousSectorsRef
    })));
}
function Pie(outsideProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultPieProps);
    var { id: externalId } = props, propsWithoutId = _objectWithoutProperties(props, _excluded3);
    var presentationProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(propsWithoutId);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$RegisterGraphicalItemId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RegisterGraphicalItemId"], {
        id: externalId,
        type: "pie"
    }, (id)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$SetGraphicalItem$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SetPolarGraphicalItem"], {
            type: "pie",
            id: id,
            data: propsWithoutId.data,
            dataKey: propsWithoutId.dataKey,
            hide: propsWithoutId.hide,
            angleAxisId: 0,
            radiusAxisId: 0,
            name: propsWithoutId.name,
            nameKey: propsWithoutId.nameKey,
            tooltipType: propsWithoutId.tooltipType,
            legendType: propsWithoutId.legendType,
            fill: propsWithoutId.fill,
            cx: propsWithoutId.cx,
            cy: propsWithoutId.cy,
            startAngle: propsWithoutId.startAngle,
            endAngle: propsWithoutId.endAngle,
            paddingAngle: propsWithoutId.paddingAngle,
            minAngle: propsWithoutId.minAngle,
            innerRadius: propsWithoutId.innerRadius,
            outerRadius: propsWithoutId.outerRadius,
            cornerRadius: propsWithoutId.cornerRadius,
            presentationProps: presentationProps,
            maxRadius: props.maxRadius
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](SetPiePayloadLegend, _extends({}, propsWithoutId, {
            id: id
        })), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](PieImpl, _extends({}, propsWithoutId, {
            id: id
        }))));
}
Pie.displayName = 'Pie';
}),
"[project]/pwa/node_modules/recharts/es6/container/Surface.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Surface",
    ()=>Surface
]);
/**
 * @fileOverview Surface
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var _excluded = [
    "children",
    "width",
    "height",
    "viewBox",
    "className",
    "style",
    "title",
    "desc"
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
var Surface = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { children, width, height, viewBox, className, style, title, desc } = props, others = _objectWithoutProperties(props, _excluded);
    var svgView = viewBox || {
        width,
        height,
        x: 0,
        y: 0
    };
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-surface', className);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("svg", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(others), {
        className: layerClass,
        width: width,
        height: height,
        style: style,
        viewBox: "".concat(svgView.x, " ").concat(svgView.y, " ").concat(svgView.width, " ").concat(svgView.height),
        ref: ref
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("title", null, title), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("desc", null, desc), children);
});
}),
"[project]/pwa/node_modules/recharts/es6/container/RootSurface.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RootSurface",
    ()=>RootSurface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$accessibilityContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/accessibilityContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Surface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/Surface.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/brushSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexPortal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/ZIndexPortal.js [app-ssr] (ecmascript)");
var _excluded = [
    "children"
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
var FULL_WIDTH_AND_HEIGHT = {
    width: '100%',
    height: '100%',
    /*
   * display: block is necessary here because the default for an SVG is display: inline,
   * which in some browsers (Chrome) adds a little bit of extra space above and below the SVG
   * to make space for the descender of letters like "g" and "y". This throws off the height calculation
   * and causes the container to grow indefinitely on each render with responsive=true.
   * Display: block removes that extra space.
   *
   * Interestingly, Firefox does not have this problem, but it doesn't hurt to add the style anyway.
   */ display: 'block'
};
var MainChartSurface = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var width = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartWidth"])();
    var height = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartHeight"])();
    var hasAccessibilityLayer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$accessibilityContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccessibilityLayer"])();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(width) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPositiveNumber"])(height)) {
        return null;
    }
    var { children, otherAttributes, title, desc } = props;
    var tabIndex, role;
    if (otherAttributes != null) {
        if (typeof otherAttributes.tabIndex === 'number') {
            tabIndex = otherAttributes.tabIndex;
        } else {
            tabIndex = hasAccessibilityLayer ? 0 : undefined;
        }
        if (typeof otherAttributes.role === 'string') {
            role = otherAttributes.role;
        } else {
            role = hasAccessibilityLayer ? 'application' : undefined;
        }
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Surface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Surface"], _extends({}, otherAttributes, {
        title: title,
        desc: desc,
        role: role,
        tabIndex: tabIndex,
        width: width,
        height: height,
        style: FULL_WIDTH_AND_HEIGHT,
        ref: ref
    }), children);
});
var BrushPanoramaSurface = (_ref)=>{
    var { children } = _ref;
    var brushDimensions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectBrushDimensions"]);
    if (!brushDimensions) {
        return null;
    }
    var { width, height, y, x } = brushDimensions;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$Surface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Surface"], {
        width: width,
        height: height,
        x: x,
        y: y
    }, children);
};
var RootSurface = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((_ref2, ref)=>{
    var { children } = _ref2, rest = _objectWithoutProperties(_ref2, _excluded);
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    if (isPanorama) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](BrushPanoramaSurface, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexPortal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AllZIndexPortals"], {
            isPanorama: true
        }, children));
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](MainChartSurface, _extends({
        ref: ref
    }, rest), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$ZIndexPortal$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AllZIndexPortals"], {
        isPanorama: false
    }, children));
});
}),
"[project]/pwa/node_modules/recharts/es6/container/ClipPathProvider.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ClipPathProvider",
    ()=>ClipPathProvider,
    "useClipPathId",
    ()=>useClipPathId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/hooks.js [app-ssr] (ecmascript)");
;
;
;
;
var ClipPathIdContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
var ClipPathProvider = (_ref)=>{
    var { children } = _ref;
    var [clipPathId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniqueId"])('recharts'), "-clip"));
    var plotArea = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePlotArea"])();
    if (plotArea == null) {
        return null;
    }
    var { x, y, width, height } = plotArea;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ClipPathIdContext.Provider, {
        value: clipPathId
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("defs", null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("clipPath", {
        id: clipPathId
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("rect", {
        x: x,
        y: y,
        height: height,
        width: width
    }))), children);
};
var useClipPathId = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ClipPathIdContext);
};
}),
"[project]/pwa/node_modules/recharts/es6/container/Layer.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Layer",
    ()=>Layer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var _excluded = [
    "children",
    "className"
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
var Layer = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"]((props, ref)=>{
    var { children, className } = props, others = _objectWithoutProperties(props, _excluded);
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-layer', className);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("g", _extends({
        className: layerClass
    }, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(others), {
        ref: ref
    }), children);
});
}),
"[project]/pwa/node_modules/recharts/es6/synchronisation/syncSelectors.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectSynchronisedTooltipState",
    ()=>selectSynchronisedTooltipState
]);
function selectSynchronisedTooltipState(state) {
    return state.tooltip.syncInteraction;
}
}),
"[project]/pwa/node_modules/recharts/es6/synchronisation/useChartSynchronisation.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useBrushChartSynchronisation",
    ()=>useBrushChartSynchronisation,
    "useSynchronisedEventsFromOtherCharts",
    ()=>useSynchronisedEventsFromOtherCharts,
    "useTooltipChartSynchronisation",
    ()=>useTooltipChartSynchronisation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Events.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$synchronisation$2f$syncSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/synchronisation/syncSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/chartDataSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var _excluded = [
    "x",
    "y"
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
function useTooltipSyncEventsListener() {
    var mySyncId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSyncId"]);
    var myEventEmitter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectEventEmitter"]);
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var syncMethod = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSyncMethod"]);
    var tooltipTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"]);
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChartLayout"])();
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useViewBox"])();
    var className = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>state.rootProps.className);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (mySyncId == null) {
            // This chart is not synchronised with any other chart so we don't need to listen for any events.
            return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["noop"];
        }
        var listener = (incomingSyncId, action, emitter)=>{
            if (myEventEmitter === emitter) {
                // We don't want to dispatch actions that we sent ourselves.
                return;
            }
            if (mySyncId !== incomingSyncId) {
                // This event is not for this chart
                return;
            }
            if (syncMethod === 'index') {
                var _action$payload;
                if (viewBox && action !== null && action !== void 0 && (_action$payload = action.payload) !== null && _action$payload !== void 0 && _action$payload.coordinate && action.payload.sourceViewBox) {
                    var _action$payload$coord = action.payload.coordinate, { x: _x, y: _y } = _action$payload$coord, otherCoordinateProps = _objectWithoutProperties(_action$payload$coord, _excluded);
                    var { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight } = action.payload.sourceViewBox;
                    var scaledCoordinate = _objectSpread(_objectSpread({}, otherCoordinateProps), {}, {
                        x: viewBox.x + (sourceWidth ? (_x - sourceX) / sourceWidth : 0) * viewBox.width,
                        y: viewBox.y + (sourceHeight ? (_y - sourceY) / sourceHeight : 0) * viewBox.height
                    });
                    dispatch(_objectSpread(_objectSpread({}, action), {}, {
                        payload: _objectSpread(_objectSpread({}, action.payload), {}, {
                            coordinate: scaledCoordinate
                        })
                    }));
                } else {
                    dispatch(action);
                }
                return;
            }
            if (tooltipTicks == null) {
                // for the other two sync methods, we need the ticks to be available
                return;
            }
            var activeTick;
            if (typeof syncMethod === 'function') {
                /*
         * This is what the data shape in 2.x CategoricalChartState used to look like.
         * In 3.x we store things differently but let's try to keep the old shape for compatibility.
         */ var syncMethodParam = {
                    activeTooltipIndex: action.payload.index == null ? undefined : Number(action.payload.index),
                    isTooltipActive: action.payload.active,
                    activeIndex: action.payload.index == null ? undefined : Number(action.payload.index),
                    activeLabel: action.payload.label,
                    activeDataKey: action.payload.dataKey,
                    activeCoordinate: action.payload.coordinate
                };
                // Call a callback function. If there is an application specific algorithm
                var activeTooltipIndex = syncMethod(tooltipTicks, syncMethodParam);
                activeTick = tooltipTicks[activeTooltipIndex];
            } else if (syncMethod === 'value') {
                // labels are always strings, tick.value might be a string or a number, depending on axis type
                activeTick = tooltipTicks.find((tick)=>String(tick.value) === action.payload.label);
            }
            var { coordinate } = action.payload;
            if (activeTick == null || action.payload.active === false || coordinate == null || viewBox == null) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setSyncInteraction"])({
                    active: false,
                    coordinate: undefined,
                    dataKey: undefined,
                    index: null,
                    label: undefined,
                    sourceViewBox: undefined
                }));
                return;
            }
            var { x, y } = coordinate;
            var validateChartX = Math.min(x, viewBox.x + viewBox.width);
            var validateChartY = Math.min(y, viewBox.y + viewBox.height);
            var activeCoordinate = {
                x: layout === 'horizontal' ? activeTick.coordinate : validateChartX,
                y: layout === 'horizontal' ? validateChartY : activeTick.coordinate
            };
            var syncAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setSyncInteraction"])({
                active: action.payload.active,
                coordinate: activeCoordinate,
                dataKey: action.payload.dataKey,
                index: String(activeTick.index),
                label: action.payload.label,
                sourceViewBox: action.payload.sourceViewBox
            });
            dispatch(syncAction);
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eventCenter"].on(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOOLTIP_SYNC_EVENT"], listener);
        return ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eventCenter"].off(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOOLTIP_SYNC_EVENT"], listener);
        };
    }, [
        className,
        dispatch,
        myEventEmitter,
        mySyncId,
        syncMethod,
        tooltipTicks,
        layout,
        viewBox
    ]);
}
function useBrushSyncEventsListener() {
    var mySyncId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSyncId"]);
    var myEventEmitter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectEventEmitter"]);
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (mySyncId == null) {
            // This chart is not synchronised with any other chart so we don't need to listen for any events.
            return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["noop"];
        }
        var listener = (incomingSyncId, action, emitter)=>{
            if (myEventEmitter === emitter) {
                // We don't want to dispatch actions that we sent ourselves.
                return;
            }
            if (mySyncId === incomingSyncId) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setDataStartEndIndexes"])(action));
            }
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eventCenter"].on(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BRUSH_SYNC_EVENT"], listener);
        return ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eventCenter"].off(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BRUSH_SYNC_EVENT"], listener);
        };
    }, [
        dispatch,
        myEventEmitter,
        mySyncId
    ]);
}
function useSynchronisedEventsFromOtherCharts() {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createEventEmitter"])());
    }, [
        dispatch
    ]);
    useTooltipSyncEventsListener();
    useBrushSyncEventsListener();
}
function useTooltipChartSynchronisation(tooltipEventType, trigger, activeCoordinate, activeLabel, activeIndex, isTooltipActive) {
    var activeDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectTooltipDataKey"])(state, tooltipEventType, trigger));
    var eventEmitterSymbol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectEventEmitter"]);
    var syncId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSyncId"]);
    var syncMethod = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSyncMethod"]);
    var tooltipState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$synchronisation$2f$syncSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSynchronisedTooltipState"]);
    var isReceivingSynchronisation = tooltipState === null || tooltipState === void 0 ? void 0 : tooltipState.active;
    var viewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useViewBox"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isReceivingSynchronisation) {
            /*
       * This chart currently has active tooltip, synchronised from another chart.
       * Let's not send any outgoing synchronisation events while that's happening
       * to avoid infinite loops.
       */ return;
        }
        if (syncId == null) {
            /*
       * syncId is not set, means that this chart is not synchronised with any other chart,
       * means we don't need to send synchronisation events
       */ return;
        }
        if (eventEmitterSymbol == null) {
            /*
       * When using Recharts internal hooks and selectors outside charts context,
       * these properties will be undefined. Let's return silently instead of throwing an error.
       */ return;
        }
        var syncAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setSyncInteraction"])({
            active: isTooltipActive,
            coordinate: activeCoordinate,
            dataKey: activeDataKey,
            index: activeIndex,
            label: typeof activeLabel === 'number' ? String(activeLabel) : activeLabel,
            sourceViewBox: viewBox
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eventCenter"].emit(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOOLTIP_SYNC_EVENT"], syncId, syncAction, eventEmitterSymbol);
    }, [
        isReceivingSynchronisation,
        activeCoordinate,
        activeDataKey,
        activeIndex,
        activeLabel,
        eventEmitterSymbol,
        syncId,
        syncMethod,
        isTooltipActive,
        viewBox
    ]);
}
function useBrushChartSynchronisation() {
    var syncId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectSyncId"]);
    var eventEmitterSymbol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectEventEmitter"]);
    var brushStartIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>state.chartData.dataStartIndex);
    var brushEndIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>state.chartData.dataEndIndex);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (syncId == null || brushStartIndex == null || brushEndIndex == null || eventEmitterSymbol == null) {
            return;
        }
        var syncAction = {
            startIndex: brushStartIndex,
            endIndex: brushEndIndex
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eventCenter"].emit(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BRUSH_SYNC_EVENT"], syncId, syncAction, eventEmitterSymbol);
    }, [
        brushEndIndex,
        brushStartIndex,
        eventEmitterSymbol,
        syncId
    ]);
}
}),
"[project]/pwa/node_modules/recharts/es6/chart/RechartsWrapper.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RechartsWrapper",
    ()=>RechartsWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/mouseEventsMiddleware.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$synchronisation$2f$useChartSynchronisation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/synchronisation/useChartSynchronisation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$keyboardEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/keyboardEventsMiddleware.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useReportScale$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useReportScale.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/externalEventsMiddleware.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$touchEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/touchEventsMiddleware.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/tooltipPortalContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$legendPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/legendPortalContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/component/ResponsiveContainer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
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
;
;
;
var EventSynchronizer = ()=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$synchronisation$2f$useChartSynchronisation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSynchronisedEventsFromOtherCharts"])();
    return null;
};
function getNumberOrZero(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        var parsed = parseFloat(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return 0;
}
var ResponsiveDiv = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var _props$style, _props$style2;
    var observerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    var [sizes, setSizes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        containerWidth: getNumberOrZero((_props$style = props.style) === null || _props$style === void 0 ? void 0 : _props$style.width),
        containerHeight: getNumberOrZero((_props$style2 = props.style) === null || _props$style2 === void 0 ? void 0 : _props$style2.height)
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
    var innerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((node)=>{
        if (typeof ref === 'function') {
            ref(node);
        }
        if (node != null && typeof ResizeObserver !== 'undefined') {
            var { width: containerWidth, height: containerHeight } = node.getBoundingClientRect();
            setContainerSize(containerWidth, containerHeight);
            var callback = (entries)=>{
                var { width, height } = entries[0].contentRect;
                setContainerSize(width, height);
            };
            var observer = new ResizeObserver(callback);
            observer.observe(node);
            observerRef.current = observer;
        }
    }, [
        ref,
        setContainerSize
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            var observer = observerRef.current;
            if (observer != null) {
                observer.disconnect();
            }
        };
    }, [
        setContainerSize
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportChartSize"], {
        width: sizes.containerWidth,
        height: sizes.containerHeight
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", _extends({
        ref: innerRef
    }, props)));
});
var ReadSizeOnceDiv = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { width, height } = props;
    var [sizes, setSizes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        containerWidth: getNumberOrZero(width),
        containerHeight: getNumberOrZero(height)
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
    var innerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((node)=>{
        if (typeof ref === 'function') {
            ref(node);
        }
        if (node != null) {
            var { width: containerWidth, height: containerHeight } = node.getBoundingClientRect();
            setContainerSize(containerWidth, containerHeight);
        }
    }, [
        ref,
        setContainerSize
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportChartSize"], {
        width: sizes.containerWidth,
        height: sizes.containerHeight
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", _extends({
        ref: innerRef
    }, props)));
});
var StaticDiv = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { width, height } = props;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportChartSize"], {
        width: width,
        height: height
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("div", _extends({
        ref: ref
    }, props)));
});
var NonResponsiveDiv = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { width, height } = props;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(width) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPercent"])(height)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](ReadSizeOnceDiv, _extends({}, props, {
            ref: ref
        }));
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](StaticDiv, _extends({}, props, {
        ref: ref
    }));
});
function getWrapperDivComponent(responsive) {
    return responsive === true ? ResponsiveDiv : NonResponsiveDiv;
}
var RechartsWrapper = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { children, className, height: heightFromProps, onClick, onContextMenu, onDoubleClick, onMouseDown, onMouseEnter, onMouseLeave, onMouseMove, onMouseUp, onTouchEnd, onTouchMove, onTouchStart, style, width: widthFromProps, responsive, dispatchTouchEvents = true } = props;
    var containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var [tooltipPortal, setTooltipPortal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    var [legendPortal, setLegendPortal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    var setScaleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useReportScale$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReportScale"])();
    var responsiveContainerCalculations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useResponsiveContainerContext"])();
    var width = (responsiveContainerCalculations === null || responsiveContainerCalculations === void 0 ? void 0 : responsiveContainerCalculations.width) > 0 ? responsiveContainerCalculations.width : widthFromProps;
    var height = (responsiveContainerCalculations === null || responsiveContainerCalculations === void 0 ? void 0 : responsiveContainerCalculations.height) > 0 ? responsiveContainerCalculations.height : heightFromProps;
    var innerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((node)=>{
        setScaleRef(node);
        if (typeof ref === 'function') {
            ref(node);
        }
        setTooltipPortal(node);
        setLegendPortal(node);
        if (node != null) {
            containerRef.current = node;
        }
    }, [
        setScaleRef,
        ref,
        setTooltipPortal,
        setLegendPortal
    ]);
    var myOnClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mouseClickAction"])(e));
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onClick,
            reactEvent: e
        }));
    }, [
        dispatch,
        onClick
    ]);
    var myOnMouseEnter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mouseMoveAction"])(e));
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onMouseEnter,
            reactEvent: e
        }));
    }, [
        dispatch,
        onMouseEnter
    ]);
    var myOnMouseLeave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mouseLeaveChart"])());
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onMouseLeave,
            reactEvent: e
        }));
    }, [
        dispatch,
        onMouseLeave
    ]);
    var myOnMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mouseMoveAction"])(e));
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onMouseMove,
            reactEvent: e
        }));
    }, [
        dispatch,
        onMouseMove
    ]);
    var onFocus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$keyboardEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["focusAction"])());
    }, [
        dispatch
    ]);
    var onKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$keyboardEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["keyDownAction"])(e.key));
    }, [
        dispatch
    ]);
    var myOnContextMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onContextMenu,
            reactEvent: e
        }));
    }, [
        dispatch,
        onContextMenu
    ]);
    var myOnDoubleClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onDoubleClick,
            reactEvent: e
        }));
    }, [
        dispatch,
        onDoubleClick
    ]);
    var myOnMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onMouseDown,
            reactEvent: e
        }));
    }, [
        dispatch,
        onMouseDown
    ]);
    var myOnMouseUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onMouseUp,
            reactEvent: e
        }));
    }, [
        dispatch,
        onMouseUp
    ]);
    var myOnTouchStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onTouchStart,
            reactEvent: e
        }));
    }, [
        dispatch,
        onTouchStart
    ]);
    /*
   * onTouchMove is special because it behaves different from mouse events.
   * Mouse events have 'enter' + 'leave' combo that notify us when the mouse is over
   * a certain element. Touch events don't have that; touch only gives us
   * start (finger down), end (finger up) and move (finger moving).
   * So we need to figure out which element the user is touching
   * ourselves. Fortunately, there's a convenient method for that:
   * https://developer.mozilla.org/en-US/docs/Web/API/Document/elementFromPoint
   */ var myOnTouchMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (dispatchTouchEvents) {
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$touchEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["touchEventAction"])(e));
        }
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onTouchMove,
            reactEvent: e
        }));
    }, [
        dispatch,
        dispatchTouchEvents,
        onTouchMove
    ]);
    var myOnTouchEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["externalEventAction"])({
            handler: onTouchEnd,
            reactEvent: e
        }));
    }, [
        dispatch,
        onTouchEnd
    ]);
    var WrapperDiv = getWrapperDivComponent(responsive);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$tooltipPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipPortalContext"].Provider, {
        value: tooltipPortal
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$legendPortalContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LegendPortalContext"].Provider, {
        value: legendPortal
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](WrapperDiv, {
        width: width !== null && width !== void 0 ? width : style === null || style === void 0 ? void 0 : style.width,
        height: height !== null && height !== void 0 ? height : style === null || style === void 0 ? void 0 : style.height,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-wrapper', className),
        style: _objectSpread({
            position: 'relative',
            cursor: 'default',
            width,
            height
        }, style),
        onClick: myOnClick,
        onContextMenu: myOnContextMenu,
        onDoubleClick: myOnDoubleClick,
        onFocus: onFocus,
        onKeyDown: onKeyDown,
        onMouseDown: myOnMouseDown,
        onMouseEnter: myOnMouseEnter,
        onMouseLeave: myOnMouseLeave,
        onMouseMove: myOnMouseMove,
        onMouseUp: myOnMouseUp,
        onTouchEnd: myOnTouchEnd,
        onTouchMove: myOnTouchMove,
        onTouchStart: myOnTouchStart,
        ref: innerRef
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](EventSynchronizer, null), children)));
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/CategoricalChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CategoricalChart",
    ()=>CategoricalChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$RootSurface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/RootSurface.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$RechartsWrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/RechartsWrapper.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$ClipPathProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/container/ClipPathProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-ssr] (ecmascript)");
var _excluded = [
    "width",
    "height",
    "responsive",
    "children",
    "className",
    "style",
    "compact",
    "title",
    "desc"
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
;
;
;
;
;
;
;
var CategoricalChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var { width, height, responsive, children, className, style, compact, title, desc } = props, others = _objectWithoutProperties(props, _excluded);
    var attrs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(others);
    /*
   * The "compact" mode is used as the panorama within Brush.
   * However because `compact` is a public prop, let's assume that it can render outside of Brush too.
   */ if (compact) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportChartSize"], {
            width: width,
            height: height
        }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$RootSurface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RootSurface"], {
            otherAttributes: attrs,
            title: title,
            desc: desc
        }, children));
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$RechartsWrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RechartsWrapper"], {
        className: className,
        style: style,
        width: width,
        height: height,
        responsive: responsive !== null && responsive !== void 0 ? responsive : false,
        onClick: props.onClick,
        onMouseLeave: props.onMouseLeave,
        onMouseEnter: props.onMouseEnter,
        onMouseMove: props.onMouseMove,
        onMouseDown: props.onMouseDown,
        onMouseUp: props.onMouseUp,
        onContextMenu: props.onContextMenu,
        onDoubleClick: props.onDoubleClick,
        onTouchStart: props.onTouchStart,
        onTouchMove: props.onTouchMove,
        onTouchEnd: props.onTouchEnd
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$RootSurface$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RootSurface"], {
        otherAttributes: attrs,
        title: title,
        desc: desc,
        ref: ref
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$container$2f$ClipPathProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ClipPathProvider"], null, children)));
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/CartesianChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartesianChart",
    ()=>CartesianChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsStoreProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/RechartsStoreProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartDataContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartDataContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportMainChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/ReportMainChartProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/ReportChartProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CategoricalChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/CategoricalChart.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
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
var defaultMargin = {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
};
var defaultProps = {
    accessibilityLayer: true,
    layout: 'horizontal',
    stackOffset: 'none',
    barCategoryGap: '10%',
    barGap: 4,
    margin: defaultMargin,
    reverseStackOrder: false,
    syncMethod: 'index',
    responsive: false
};
var CartesianChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(function CartesianChart(props, ref) {
    var _categoricalChartProp;
    var rootChartProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(props.categoricalChartProps, defaultProps);
    var { chartName, defaultTooltipEventType, validateTooltipEventTypes, tooltipPayloadSearcher, categoricalChartProps } = props;
    var options = {
        chartName,
        defaultTooltipEventType,
        validateTooltipEventTypes,
        tooltipPayloadSearcher,
        eventEmitter: undefined
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsStoreProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RechartsStoreProvider"], {
        preloadedState: {
            options
        },
        reduxStoreName: (_categoricalChartProp = categoricalChartProps.id) !== null && _categoricalChartProp !== void 0 ? _categoricalChartProp : chartName
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartDataContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ChartDataContextProvider"], {
        chartData: categoricalChartProps.data
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportMainChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportMainChartProps"], {
        layout: rootChartProps.layout,
        margin: rootChartProps.margin
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportChartProps"], {
        baseValue: rootChartProps.baseValue,
        accessibilityLayer: rootChartProps.accessibilityLayer,
        barCategoryGap: rootChartProps.barCategoryGap,
        maxBarSize: rootChartProps.maxBarSize,
        stackOffset: rootChartProps.stackOffset,
        barGap: rootChartProps.barGap,
        barSize: rootChartProps.barSize,
        syncId: rootChartProps.syncId,
        syncMethod: rootChartProps.syncMethod,
        className: rootChartProps.className
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CategoricalChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CategoricalChart"], _extends({}, rootChartProps, {
        ref: ref
    })));
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/LineChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LineChart",
    ()=>LineChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CartesianChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/CartesianChart.js [app-ssr] (ecmascript)");
;
;
;
;
var allowedTooltipTypes = [
    'axis'
];
var LineChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CartesianChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CartesianChart"], {
        chartName: "LineChart",
        defaultTooltipEventType: "axis",
        validateTooltipEventTypes: allowedTooltipTypes,
        tooltipPayloadSearcher: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["arrayTooltipSearcher"],
        categoricalChartProps: props,
        ref: ref
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/BarChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BarChart",
    ()=>BarChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CartesianChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/CartesianChart.js [app-ssr] (ecmascript)");
;
;
;
;
var allowedTooltipTypes = [
    'axis',
    'item'
];
var BarChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CartesianChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CartesianChart"], {
        chartName: "BarChart",
        defaultTooltipEventType: "axis",
        validateTooltipEventTypes: allowedTooltipTypes,
        tooltipPayloadSearcher: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["arrayTooltipSearcher"],
        categoricalChartProps: props,
        ref: ref
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/PolarChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PolarChart",
    ()=>PolarChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsStoreProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/RechartsStoreProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartDataContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartDataContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportMainChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/ReportMainChartProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/ReportChartProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportPolarOptions$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/ReportPolarOptions.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CategoricalChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/CategoricalChart.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var _excluded = [
    "layout"
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
var defaultMargin = {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
};
/**
 * These default props are the same for all PolarChart components.
 */ var defaultProps = {
    accessibilityLayer: true,
    stackOffset: 'none',
    barCategoryGap: '10%',
    barGap: 4,
    margin: defaultMargin,
    reverseStackOrder: false,
    syncMethod: 'index',
    layout: 'radial',
    responsive: false
};
var PolarChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(function PolarChart(props, ref) {
    var _polarChartProps$id;
    var polarChartProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(props.categoricalChartProps, defaultProps);
    var { layout } = polarChartProps, otherCategoricalProps = _objectWithoutProperties(polarChartProps, _excluded);
    var { chartName, defaultTooltipEventType, validateTooltipEventTypes, tooltipPayloadSearcher } = props;
    var options = {
        chartName,
        defaultTooltipEventType,
        validateTooltipEventTypes,
        tooltipPayloadSearcher,
        eventEmitter: undefined
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsStoreProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RechartsStoreProvider"], {
        preloadedState: {
            options
        },
        reduxStoreName: (_polarChartProps$id = polarChartProps.id) !== null && _polarChartProps$id !== void 0 ? _polarChartProps$id : chartName
    }, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartDataContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ChartDataContextProvider"], {
        chartData: polarChartProps.data
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportMainChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportMainChartProps"], {
        layout: layout,
        margin: polarChartProps.margin
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportChartProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportChartProps"], {
        baseValue: undefined,
        accessibilityLayer: polarChartProps.accessibilityLayer,
        barCategoryGap: polarChartProps.barCategoryGap,
        maxBarSize: polarChartProps.maxBarSize,
        stackOffset: polarChartProps.stackOffset,
        barGap: polarChartProps.barGap,
        barSize: polarChartProps.barSize,
        syncId: polarChartProps.syncId,
        syncMethod: polarChartProps.syncMethod,
        className: polarChartProps.className
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$ReportPolarOptions$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReportPolarOptions"], {
        cx: polarChartProps.cx,
        cy: polarChartProps.cy,
        startAngle: polarChartProps.startAngle,
        endAngle: polarChartProps.endAngle,
        innerRadius: polarChartProps.innerRadius,
        outerRadius: polarChartProps.outerRadius
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CategoricalChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CategoricalChart"], _extends({}, otherCategoricalProps, {
        ref: ref
    })));
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/PieChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PieChart",
    ()=>PieChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PolarChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/PolarChart.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
;
;
;
;
;
var allowedTooltipTypes = [
    'item'
];
var defaultProps = {
    layout: 'centric',
    startAngle: 0,
    endAngle: 360,
    cx: '50%',
    cy: '50%',
    innerRadius: 0,
    outerRadius: '80%'
};
var PieChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    var propsWithDefaults = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(props, defaultProps);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PolarChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PolarChart"], {
        chartName: "PieChart",
        defaultTooltipEventType: "item",
        validateTooltipEventTypes: allowedTooltipTypes,
        tooltipPayloadSearcher: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["arrayTooltipSearcher"],
        categoricalChartProps: propsWithDefaults,
        ref: ref
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/chart/ScatterChart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScatterChart",
    ()=>ScatterChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CartesianChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/chart/CartesianChart.js [app-ssr] (ecmascript)");
;
;
;
;
var allowedTooltipTypes = [
    'item'
];
var ScatterChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])((props, ref)=>{
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$CartesianChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CartesianChart"], {
        chartName: "ScatterChart",
        defaultTooltipEventType: "item",
        validateTooltipEventTypes: allowedTooltipTypes,
        tooltipPayloadSearcher: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["arrayTooltipSearcher"],
        categoricalChartProps: props,
        ref: ref
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/hooks.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useActiveTooltipDataPoints",
    ()=>useActiveTooltipDataPoints,
    "useActiveTooltipLabel",
    ()=>useActiveTooltipLabel,
    "useOffset",
    ()=>useOffset,
    "usePlotArea",
    ()=>usePlotArea,
    "useXAxis",
    ()=>useXAxis,
    "useXAxisDomain",
    ()=>useXAxisDomain,
    "useYAxis",
    ()=>useYAxis,
    "useYAxisDomain",
    ()=>useYAxisDomain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/cartesianAxisSlice.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffset$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffset.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectPlotArea$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectPlotArea.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
var useXAxis = (xAxisId)=>{
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'xAxis', xAxisId, isPanorama));
};
var useYAxis = (yAxisId)=>{
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'yAxis', yAxisId, isPanorama));
};
var useActiveTooltipLabel = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectActiveLabel"]);
};
var useOffset = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffset$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectChartOffset"]);
};
var usePlotArea = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectPlotArea$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectPlotArea"]);
};
var useActiveTooltipDataPoints = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectActiveTooltipDataPoints"]);
};
var useXAxisDomain = function useXAxisDomain() {
    var xAxisId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultAxisId"];
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectAxisDomain"])(state, 'xAxis', xAxisId, isPanorama));
};
var useYAxisDomain = function useYAxisDomain() {
    var yAxisId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultAxisId"];
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppSelector"])((state)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectAxisDomain"])(state, 'yAxis', yAxisId, isPanorama));
};
}),
"[project]/pwa/node_modules/recharts/es6/shape/Dot.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dot",
    ()=>Dot
]);
/**
 * @fileOverview Dot
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
function _extends() {
    return _extends = ("TURBOPACK compile-time truthy", 1) ? Object.assign.bind() : "TURBOPACK unreachable", _extends.apply(null, arguments);
}
;
;
;
;
;
var Dot = (props)=>{
    var { cx, cy, r, className } = props;
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-dot', className);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(cx) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(cy) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(r)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("circle", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(props), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adaptEventHandlers"])(props), {
            className: layerClass,
            cx: cx,
            cy: cy,
            r: r
        }));
    }
    return null;
};
}),
"[project]/pwa/node_modules/recharts/es6/shape/Rectangle.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Rectangle",
    ()=>Rectangle
]);
/**
 * @fileOverview Rectangle
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/util.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var _excluded = [
    "radius"
], _excluded2 = [
    "radius"
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
var getRectanglePath = (x, y, width, height, radius)=>{
    var maxRadius = Math.min(Math.abs(width) / 2, Math.abs(height) / 2);
    var ySign = height >= 0 ? 1 : -1;
    var xSign = width >= 0 ? 1 : -1;
    var clockWise = height >= 0 && width >= 0 || height < 0 && width < 0 ? 1 : 0;
    var path;
    if (maxRadius > 0 && radius instanceof Array) {
        var newRadius = [
            0,
            0,
            0,
            0
        ];
        for(var i = 0, len = 4; i < len; i++){
            newRadius[i] = radius[i] > maxRadius ? maxRadius : radius[i];
        }
        path = "M".concat(x, ",").concat(y + ySign * newRadius[0]);
        if (newRadius[0] > 0) {
            path += "A ".concat(newRadius[0], ",").concat(newRadius[0], ",0,0,").concat(clockWise, ",").concat(x + xSign * newRadius[0], ",").concat(y);
        }
        path += "L ".concat(x + width - xSign * newRadius[1], ",").concat(y);
        if (newRadius[1] > 0) {
            path += "A ".concat(newRadius[1], ",").concat(newRadius[1], ",0,0,").concat(clockWise, ",\n        ").concat(x + width, ",").concat(y + ySign * newRadius[1]);
        }
        path += "L ".concat(x + width, ",").concat(y + height - ySign * newRadius[2]);
        if (newRadius[2] > 0) {
            path += "A ".concat(newRadius[2], ",").concat(newRadius[2], ",0,0,").concat(clockWise, ",\n        ").concat(x + width - xSign * newRadius[2], ",").concat(y + height);
        }
        path += "L ".concat(x + xSign * newRadius[3], ",").concat(y + height);
        if (newRadius[3] > 0) {
            path += "A ".concat(newRadius[3], ",").concat(newRadius[3], ",0,0,").concat(clockWise, ",\n        ").concat(x, ",").concat(y + height - ySign * newRadius[3]);
        }
        path += 'Z';
    } else if (maxRadius > 0 && radius === +radius && radius > 0) {
        var _newRadius = Math.min(maxRadius, radius);
        path = "M ".concat(x, ",").concat(y + ySign * _newRadius, "\n            A ").concat(_newRadius, ",").concat(_newRadius, ",0,0,").concat(clockWise, ",").concat(x + xSign * _newRadius, ",").concat(y, "\n            L ").concat(x + width - xSign * _newRadius, ",").concat(y, "\n            A ").concat(_newRadius, ",").concat(_newRadius, ",0,0,").concat(clockWise, ",").concat(x + width, ",").concat(y + ySign * _newRadius, "\n            L ").concat(x + width, ",").concat(y + height - ySign * _newRadius, "\n            A ").concat(_newRadius, ",").concat(_newRadius, ",0,0,").concat(clockWise, ",").concat(x + width - xSign * _newRadius, ",").concat(y + height, "\n            L ").concat(x + xSign * _newRadius, ",").concat(y + height, "\n            A ").concat(_newRadius, ",").concat(_newRadius, ",0,0,").concat(clockWise, ",").concat(x, ",").concat(y + height - ySign * _newRadius, " Z");
    } else {
        path = "M ".concat(x, ",").concat(y, " h ").concat(width, " v ").concat(height, " h ").concat(-width, " Z");
    }
    return path;
};
var defaultProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    // The radius of border
    // The radius of four corners when radius is a number
    // The radius of left-top, right-top, right-bottom, left-bottom when radius is an array
    radius: 0,
    isAnimationActive: false,
    isUpdateAnimationActive: false,
    animationBegin: 0,
    animationDuration: 1500,
    animationEasing: 'ease'
};
var Rectangle = (rectangleProps)=>{
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(rectangleProps, defaultProps);
    var pathRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    var [totalLength, setTotalLength] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(-1);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (pathRef.current && pathRef.current.getTotalLength) {
            try {
                var pathTotalLength = pathRef.current.getTotalLength();
                if (pathTotalLength) {
                    setTotalLength(pathTotalLength);
                }
            } catch (_unused) {
            // calculate total length error
            }
        }
    }, []);
    var { x, y, width, height, radius, className } = props;
    var { animationEasing, animationDuration, animationBegin, isAnimationActive, isUpdateAnimationActive } = props;
    var prevWidthRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(width);
    var prevHeightRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(height);
    var prevXRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(x);
    var prevYRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(y);
    var animationIdInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            x,
            y,
            width,
            height,
            radius
        }), [
        x,
        y,
        width,
        height,
        radius
    ]);
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnimationId"])(animationIdInput, 'rectangle-');
    if (x !== +x || y !== +y || width !== +width || height !== +height || width === 0 || height === 0) {
        return null;
    }
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-rectangle', className);
    if (!isUpdateAnimationActive) {
        var _svgPropertiesAndEven = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(props), { radius: _ } = _svgPropertiesAndEven, otherPathProps = _objectWithoutProperties(_svgPropertiesAndEven, _excluded);
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, otherPathProps, {
            radius: typeof radius === 'number' ? radius : undefined,
            className: layerClass,
            d: getRectanglePath(x, y, width, height, radius)
        }));
    }
    var prevWidth = prevWidthRef.current;
    var prevHeight = prevHeightRef.current;
    var prevX = prevXRef.current;
    var prevY = prevYRef.current;
    var from = "0px ".concat(totalLength === -1 ? 1 : totalLength, "px");
    var to = "".concat(totalLength, "px 0px");
    var transition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTransitionVal"])([
        'strokeDasharray'
    ], animationDuration, typeof animationEasing === 'string' ? animationEasing : defaultProps.animationEasing);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["JavascriptAnimate"], {
        animationId: animationId,
        key: animationId,
        canBegin: totalLength > 0,
        duration: animationDuration,
        easing: animationEasing,
        isActive: isUpdateAnimationActive,
        begin: animationBegin
    }, (t)=>{
        var currWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevWidth, width, t);
        var currHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevHeight, height, t);
        var currX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevX, x, t);
        var currY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevY, y, t);
        if (pathRef.current) {
            prevWidthRef.current = currWidth;
            prevHeightRef.current = currHeight;
            prevXRef.current = currX;
            prevYRef.current = currY;
        }
        var animationStyle;
        if (!isAnimationActive) {
            animationStyle = {
                strokeDasharray: to
            };
        } else if (t > 0) {
            animationStyle = {
                transition,
                strokeDasharray: to
            };
        } else {
            animationStyle = {
                strokeDasharray: from
            };
        }
        var _svgPropertiesAndEven2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(props), { radius: _ } = _svgPropertiesAndEven2, otherPathProps = _objectWithoutProperties(_svgPropertiesAndEven2, _excluded2);
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, otherPathProps, {
            radius: typeof radius === 'number' ? radius : undefined,
            className: layerClass,
            d: getRectanglePath(currX, currY, currWidth, currHeight, radius),
            ref: pathRef,
            style: _objectSpread(_objectSpread({}, animationStyle), props.style)
        }));
    });
};
}),
"[project]/pwa/node_modules/recharts/es6/shape/Trapezoid.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Trapezoid",
    ()=>Trapezoid
]);
/**
 * @fileOverview Rectangle
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/useAnimationId.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/util.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
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
var getTrapezoidPath = (x, y, upperWidth, lowerWidth, height)=>{
    var widthGap = upperWidth - lowerWidth;
    var path;
    path = "M ".concat(x, ",").concat(y);
    path += "L ".concat(x + upperWidth, ",").concat(y);
    path += "L ".concat(x + upperWidth - widthGap / 2, ",").concat(y + height);
    path += "L ".concat(x + upperWidth - widthGap / 2 - lowerWidth, ",").concat(y + height);
    path += "L ".concat(x, ",").concat(y, " Z");
    return path;
};
var defaultProps = {
    x: 0,
    y: 0,
    upperWidth: 0,
    lowerWidth: 0,
    height: 0,
    isUpdateAnimationActive: false,
    animationBegin: 0,
    animationDuration: 1500,
    animationEasing: 'ease'
};
var Trapezoid = (outsideProps)=>{
    var trapezoidProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultProps);
    var { x, y, upperWidth, lowerWidth, height, className } = trapezoidProps;
    var { animationEasing, animationDuration, animationBegin, isUpdateAnimationActive } = trapezoidProps;
    var pathRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    var [totalLength, setTotalLength] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(-1);
    var prevUpperWidthRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(upperWidth);
    var prevLowerWidthRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(lowerWidth);
    var prevHeightRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(height);
    var prevXRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(x);
    var prevYRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(y);
    var animationId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$useAnimationId$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnimationId"])(outsideProps, 'trapezoid-');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (pathRef.current && pathRef.current.getTotalLength) {
            try {
                var pathTotalLength = pathRef.current.getTotalLength();
                if (pathTotalLength) {
                    setTotalLength(pathTotalLength);
                }
            } catch (_unused) {
            // calculate total length error
            }
        }
    }, []);
    if (x !== +x || y !== +y || upperWidth !== +upperWidth || lowerWidth !== +lowerWidth || height !== +height || upperWidth === 0 && lowerWidth === 0 || height === 0) {
        return null;
    }
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-trapezoid', className);
    if (!isUpdateAnimationActive) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("g", null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(trapezoidProps), {
            className: layerClass,
            d: getTrapezoidPath(x, y, upperWidth, lowerWidth, height)
        })));
    }
    var prevUpperWidth = prevUpperWidthRef.current;
    var prevLowerWidth = prevLowerWidthRef.current;
    var prevHeight = prevHeightRef.current;
    var prevX = prevXRef.current;
    var prevY = prevYRef.current;
    var from = "0px ".concat(totalLength === -1 ? 1 : totalLength, "px");
    var to = "".concat(totalLength, "px 0px");
    var transition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTransitionVal"])([
        'strokeDasharray'
    ], animationDuration, animationEasing);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$JavascriptAnimate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["JavascriptAnimate"], {
        animationId: animationId,
        key: animationId,
        canBegin: totalLength > 0,
        duration: animationDuration,
        easing: animationEasing,
        isActive: isUpdateAnimationActive,
        begin: animationBegin
    }, (t)=>{
        var currUpperWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevUpperWidth, upperWidth, t);
        var currLowerWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevLowerWidth, lowerWidth, t);
        var currHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevHeight, height, t);
        var currX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevX, x, t);
        var currY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interpolate"])(prevY, y, t);
        if (pathRef.current) {
            prevUpperWidthRef.current = currUpperWidth;
            prevLowerWidthRef.current = currLowerWidth;
            prevHeightRef.current = currHeight;
            prevXRef.current = currX;
            prevYRef.current = currY;
        }
        var animationStyle = t > 0 ? {
            transition,
            strokeDasharray: to
        } : {
            strokeDasharray: from
        };
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(trapezoidProps), {
            className: layerClass,
            d: getTrapezoidPath(currX, currY, currUpperWidth, currLowerWidth, currHeight),
            ref: pathRef,
            style: _objectSpread(_objectSpread({}, animationStyle), trapezoidProps.style)
        }));
    });
};
}),
"[project]/pwa/node_modules/recharts/es6/shape/Sector.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sector",
    ()=>Sector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
function _extends() {
    return _extends = ("TURBOPACK compile-time truthy", 1) ? Object.assign.bind() : "TURBOPACK unreachable", _extends.apply(null, arguments);
}
;
;
;
;
;
;
var getDeltaAngle = (startAngle, endAngle)=>{
    var sign = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(endAngle - startAngle);
    var deltaAngle = Math.min(Math.abs(endAngle - startAngle), 359.999);
    return sign * deltaAngle;
};
var getTangentCircle = (_ref)=>{
    var { cx, cy, radius, angle, sign, isExternal, cornerRadius, cornerIsExternal } = _ref;
    var centerRadius = cornerRadius * (isExternal ? 1 : -1) + radius;
    var theta = Math.asin(cornerRadius / centerRadius) / __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RADIAN"];
    var centerAngle = cornerIsExternal ? angle : angle + sign * theta;
    var center = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, centerRadius, centerAngle);
    // The coordinate of point which is tangent to the circle
    var circleTangency = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, radius, centerAngle);
    // The coordinate of point which is tangent to the radius line
    var lineTangencyAngle = cornerIsExternal ? angle - sign * theta : angle;
    var lineTangency = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, centerRadius * Math.cos(theta * __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RADIAN"]), lineTangencyAngle);
    return {
        center,
        circleTangency,
        lineTangency,
        theta
    };
};
var getSectorPath = (_ref2)=>{
    var { cx, cy, innerRadius, outerRadius, startAngle, endAngle } = _ref2;
    var angle = getDeltaAngle(startAngle, endAngle);
    // When the angle of sector equals to 360, star point and end point coincide
    var tempEndAngle = startAngle + angle;
    var outerStartPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, outerRadius, startAngle);
    var outerEndPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, outerRadius, tempEndAngle);
    var path = "M ".concat(outerStartPoint.x, ",").concat(outerStartPoint.y, "\n    A ").concat(outerRadius, ",").concat(outerRadius, ",0,\n    ").concat(+(Math.abs(angle) > 180), ",").concat(+(startAngle > tempEndAngle), ",\n    ").concat(outerEndPoint.x, ",").concat(outerEndPoint.y, "\n  ");
    if (innerRadius > 0) {
        var innerStartPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, innerRadius, startAngle);
        var innerEndPoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polarToCartesian"])(cx, cy, innerRadius, tempEndAngle);
        path += "L ".concat(innerEndPoint.x, ",").concat(innerEndPoint.y, "\n            A ").concat(innerRadius, ",").concat(innerRadius, ",0,\n            ").concat(+(Math.abs(angle) > 180), ",").concat(+(startAngle <= tempEndAngle), ",\n            ").concat(innerStartPoint.x, ",").concat(innerStartPoint.y, " Z");
    } else {
        path += "L ".concat(cx, ",").concat(cy, " Z");
    }
    return path;
};
var getSectorWithCorner = (_ref3)=>{
    var { cx, cy, innerRadius, outerRadius, cornerRadius, forceCornerRadius, cornerIsExternal, startAngle, endAngle } = _ref3;
    var sign = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mathSign"])(endAngle - startAngle);
    var { circleTangency: soct, lineTangency: solt, theta: sot } = getTangentCircle({
        cx,
        cy,
        radius: outerRadius,
        angle: startAngle,
        sign,
        cornerRadius,
        cornerIsExternal
    });
    var { circleTangency: eoct, lineTangency: eolt, theta: eot } = getTangentCircle({
        cx,
        cy,
        radius: outerRadius,
        angle: endAngle,
        sign: -sign,
        cornerRadius,
        cornerIsExternal
    });
    var outerArcAngle = cornerIsExternal ? Math.abs(startAngle - endAngle) : Math.abs(startAngle - endAngle) - sot - eot;
    if (outerArcAngle < 0) {
        if (forceCornerRadius) {
            return "M ".concat(solt.x, ",").concat(solt.y, "\n        a").concat(cornerRadius, ",").concat(cornerRadius, ",0,0,1,").concat(cornerRadius * 2, ",0\n        a").concat(cornerRadius, ",").concat(cornerRadius, ",0,0,1,").concat(-cornerRadius * 2, ",0\n      ");
        }
        return getSectorPath({
            cx,
            cy,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle
        });
    }
    var path = "M ".concat(solt.x, ",").concat(solt.y, "\n    A").concat(cornerRadius, ",").concat(cornerRadius, ",0,0,").concat(+(sign < 0), ",").concat(soct.x, ",").concat(soct.y, "\n    A").concat(outerRadius, ",").concat(outerRadius, ",0,").concat(+(outerArcAngle > 180), ",").concat(+(sign < 0), ",").concat(eoct.x, ",").concat(eoct.y, "\n    A").concat(cornerRadius, ",").concat(cornerRadius, ",0,0,").concat(+(sign < 0), ",").concat(eolt.x, ",").concat(eolt.y, "\n  ");
    if (innerRadius > 0) {
        var { circleTangency: sict, lineTangency: silt, theta: sit } = getTangentCircle({
            cx,
            cy,
            radius: innerRadius,
            angle: startAngle,
            sign,
            isExternal: true,
            cornerRadius,
            cornerIsExternal
        });
        var { circleTangency: eict, lineTangency: eilt, theta: eit } = getTangentCircle({
            cx,
            cy,
            radius: innerRadius,
            angle: endAngle,
            sign: -sign,
            isExternal: true,
            cornerRadius,
            cornerIsExternal
        });
        var innerArcAngle = cornerIsExternal ? Math.abs(startAngle - endAngle) : Math.abs(startAngle - endAngle) - sit - eit;
        if (innerArcAngle < 0 && cornerRadius === 0) {
            return "".concat(path, "L").concat(cx, ",").concat(cy, "Z");
        }
        path += "L".concat(eilt.x, ",").concat(eilt.y, "\n      A").concat(cornerRadius, ",").concat(cornerRadius, ",0,0,").concat(+(sign < 0), ",").concat(eict.x, ",").concat(eict.y, "\n      A").concat(innerRadius, ",").concat(innerRadius, ",0,").concat(+(innerArcAngle > 180), ",").concat(+(sign > 0), ",").concat(sict.x, ",").concat(sict.y, "\n      A").concat(cornerRadius, ",").concat(cornerRadius, ",0,0,").concat(+(sign < 0), ",").concat(silt.x, ",").concat(silt.y, "Z");
    } else {
        path += "L".concat(cx, ",").concat(cy, "Z");
    }
    return path;
};
/**
 * SVG cx, cy are `string | number | undefined`, but internally we use `number` so let's
 * override the types here.
 */ var defaultProps = {
    cx: 0,
    cy: 0,
    innerRadius: 0,
    outerRadius: 0,
    startAngle: 0,
    endAngle: 0,
    cornerRadius: 0,
    forceCornerRadius: false,
    cornerIsExternal: false
};
var Sector = (sectorProps)=>{
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(sectorProps, defaultProps);
    var { cx, cy, innerRadius, outerRadius, cornerRadius, forceCornerRadius, cornerIsExternal, startAngle, endAngle, className } = props;
    if (outerRadius < innerRadius || startAngle === endAngle) {
        return null;
    }
    var layerClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-sector', className);
    var deltaRadius = outerRadius - innerRadius;
    var cr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPercentValue"])(cornerRadius, deltaRadius, 0, true);
    var path;
    if (cr > 0 && Math.abs(startAngle - endAngle) < 360) {
        path = getSectorWithCorner({
            cx,
            cy,
            innerRadius,
            outerRadius,
            cornerRadius: Math.min(cr, deltaRadius / 2),
            forceCornerRadius,
            cornerIsExternal,
            startAngle,
            endAngle
        });
    } else {
        path = getSectorPath({
            cx,
            cy,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle
        });
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(props), {
        className: layerClass,
        d: path
    }));
};
}),
"[project]/pwa/node_modules/recharts/es6/shape/Symbols.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Symbols",
    ()=>Symbols
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$shape$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/victory-vendor/es/d3-shape.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbol$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol.js [app-ssr] (ecmascript) <export default as symbol>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolCircle$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/circle.js [app-ssr] (ecmascript) <export default as symbolCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$cross$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolCross$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/cross.js [app-ssr] (ecmascript) <export default as symbolCross>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$diamond$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolDiamond$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/diamond.js [app-ssr] (ecmascript) <export default as symbolDiamond>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolSquare$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/square.js [app-ssr] (ecmascript) <export default as symbolSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$star$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolStar$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/star.js [app-ssr] (ecmascript) <export default as symbolStar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$triangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolTriangle$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/triangle.js [app-ssr] (ecmascript) <export default as symbolTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$wye$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolWye$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/symbol/wye.js [app-ssr] (ecmascript) <export default as symbolWye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var _excluded = [
    "type",
    "size",
    "sizeType"
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
var symbolFactories = {
    symbolCircle: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolCircle$3e$__["symbolCircle"],
    symbolCross: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$cross$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolCross$3e$__["symbolCross"],
    symbolDiamond: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$diamond$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolDiamond$3e$__["symbolDiamond"],
    symbolSquare: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolSquare$3e$__["symbolSquare"],
    symbolStar: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$star$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolStar$3e$__["symbolStar"],
    symbolTriangle: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$triangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolTriangle$3e$__["symbolTriangle"],
    symbolWye: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$wye$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolWye$3e$__["symbolWye"]
};
var RADIAN = Math.PI / 180;
var getSymbolFactory = (type)=>{
    var name = "symbol".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["upperFirst"])(type));
    return symbolFactories[name] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbolCircle$3e$__["symbolCircle"];
};
var calculateAreaSize = (size, sizeType, type)=>{
    if (sizeType === 'area') {
        return size;
    }
    switch(type){
        case 'cross':
            return 5 * size * size / 9;
        case 'diamond':
            return 0.5 * size * size / Math.sqrt(3);
        case 'square':
            return size * size;
        case 'star':
            {
                var angle = 18 * RADIAN;
                return 1.25 * size * size * (Math.tan(angle) - Math.tan(angle * 2) * Math.tan(angle) ** 2);
            }
        case 'triangle':
            return Math.sqrt(3) * size * size / 4;
        case 'wye':
            return (21 - 10 * Math.sqrt(3)) * size * size / 8;
        default:
            return Math.PI * size * size / 4;
    }
};
var registerSymbol = (key, factory)=>{
    symbolFactories["symbol".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["upperFirst"])(key))] = factory;
};
var Symbols = (_ref)=>{
    var { type = 'circle', size = 64, sizeType = 'area' } = _ref, rest = _objectWithoutProperties(_ref, _excluded);
    var props = _objectSpread(_objectSpread({}, rest), {}, {
        type,
        size,
        sizeType
    });
    var realType = 'circle';
    if (typeof type === 'string') {
        /*
     * Our type guard is not as strong as it could be (i.e. non-existent),
     * and so despite the typescript type saying that `type` is a `SymbolType`,
     * we can get numbers or really anything, so let's have a runtime check here to fix the exception.
     *
     * https://github.com/recharts/recharts/issues/6197
     */ realType = type;
    }
    /**
   * Calculate the path of curve
   * @return {String} path
   */ var getPath = ()=>{
        var symbolFactory = getSymbolFactory(realType);
        var symbol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__symbol$3e$__["symbol"])().type(symbolFactory).size(calculateAreaSize(size, sizeType, realType));
        var s = symbol();
        if (s === null) {
            return undefined;
        }
        return s;
    };
    var { className, cx, cy } = props;
    var filteredProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(props);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(cx) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(cy) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(size)) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, filteredProps, {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-symbols', className),
            transform: "translate(".concat(cx, ", ").concat(cy, ")"),
            d: getPath()
        }));
    }
    return null;
};
Symbols.registerSymbol = registerSymbol;
}),
"[project]/pwa/node_modules/recharts/es6/shape/Curve.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Curve",
    ()=>Curve,
    "getPath",
    ()=>getPath
]);
/**
 * @fileOverview Curve
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$shape$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/victory-vendor/es/d3-shape.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$line$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__line$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/line.js [app-ssr] (ecmascript) <export default as line>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__area$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/area.js [app-ssr] (ecmascript) <export default as area>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$basisClosed$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveBasisClosed$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/basisClosed.js [app-ssr] (ecmascript) <export default as curveBasisClosed>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$basisOpen$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveBasisOpen$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/basisOpen.js [app-ssr] (ecmascript) <export default as curveBasisOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$basis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveBasis$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/basis.js [app-ssr] (ecmascript) <export default as curveBasis>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$bump$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__bumpX__as__curveBumpX$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/bump.js [app-ssr] (ecmascript) <export bumpX as curveBumpX>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$bump$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__bumpY__as__curveBumpY$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/bump.js [app-ssr] (ecmascript) <export bumpY as curveBumpY>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$linearClosed$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveLinearClosed$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/linearClosed.js [app-ssr] (ecmascript) <export default as curveLinearClosed>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$linear$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveLinear$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/linear.js [app-ssr] (ecmascript) <export default as curveLinear>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$monotone$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__monotoneX__as__curveMonotoneX$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/monotone.js [app-ssr] (ecmascript) <export monotoneX as curveMonotoneX>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$monotone$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__monotoneY__as__curveMonotoneY$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/monotone.js [app-ssr] (ecmascript) <export monotoneY as curveMonotoneY>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$natural$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveNatural$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/natural.js [app-ssr] (ecmascript) <export default as curveNatural>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$step$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveStep$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/step.js [app-ssr] (ecmascript) <export default as curveStep>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$step$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__stepAfter__as__curveStepAfter$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/step.js [app-ssr] (ecmascript) <export stepAfter as curveStepAfter>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$step$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__stepBefore__as__curveStepBefore$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/d3-shape/src/curve/step.js [app-ssr] (ecmascript) <export stepBefore as curveStepBefore>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/types.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesNoEvents.js [app-ssr] (ecmascript)");
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
var CURVE_FACTORIES = {
    curveBasisClosed: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$basisClosed$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveBasisClosed$3e$__["curveBasisClosed"],
    curveBasisOpen: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$basisOpen$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveBasisOpen$3e$__["curveBasisOpen"],
    curveBasis: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$basis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveBasis$3e$__["curveBasis"],
    curveBumpX: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$bump$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__bumpX__as__curveBumpX$3e$__["curveBumpX"],
    curveBumpY: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$bump$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__bumpY__as__curveBumpY$3e$__["curveBumpY"],
    curveLinearClosed: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$linearClosed$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveLinearClosed$3e$__["curveLinearClosed"],
    curveLinear: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$linear$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveLinear$3e$__["curveLinear"],
    curveMonotoneX: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$monotone$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__monotoneX__as__curveMonotoneX$3e$__["curveMonotoneX"],
    curveMonotoneY: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$monotone$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__monotoneY__as__curveMonotoneY$3e$__["curveMonotoneY"],
    curveNatural: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$natural$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveNatural$3e$__["curveNatural"],
    curveStep: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$step$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveStep$3e$__["curveStep"],
    curveStepAfter: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$step$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__stepAfter__as__curveStepAfter$3e$__["curveStepAfter"],
    curveStepBefore: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$step$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__stepBefore__as__curveStepBefore$3e$__["curveStepBefore"]
};
var defined = (p)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(p.x) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(p.y);
var areaDefined = (d)=>d.base != null && defined(d.base) && defined(d);
var getX = (p)=>p.x;
var getY = (p)=>p.y;
var getCurveFactory = (type, layout)=>{
    if (typeof type === 'function') {
        return type;
    }
    var name = "curve".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["upperFirst"])(type));
    if ((name === 'curveMonotone' || name === 'curveBump') && layout) {
        return CURVE_FACTORIES["".concat(name).concat(layout === 'vertical' ? 'Y' : 'X')];
    }
    return CURVE_FACTORIES[name] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$curve$2f$linear$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__curveLinear$3e$__["curveLinear"];
};
var getPath = (_ref)=>{
    var { type = 'linear', points = [], baseLine, layout, connectNulls = false } = _ref;
    var curveFactory = getCurveFactory(type, layout);
    var formatPoints = connectNulls ? points.filter(defined) : points;
    var lineFunction;
    // When dealing with an area chart (where `baseLine` is an array),
    // we need to pair points with their corresponding `baseLine` points first.
    // This is to ensure that we filter points and their baseline counterparts together,
    // preventing errors from mismatched array lengths and ensuring `defined` checks both.
    if (Array.isArray(baseLine)) {
        var areaPoints = points.map((entry, index)=>_objectSpread(_objectSpread({}, entry), {}, {
                base: baseLine[index]
            }));
        if (layout === 'vertical') {
            lineFunction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__area$3e$__["area"])().y(getY).x1(getX).x0((d)=>d.base.x);
        } else {
            lineFunction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__area$3e$__["area"])().x(getX).y1(getY).y0((d)=>d.base.y);
        }
        /*
     * What happens here is that the `.defined()` call will make it so that this function can accept
     * nullable points, and internally it will filter them out and skip when generating the path.
     * So on the input it accepts NullableCoordinate, but it never calls getX/getY on null points because of the defined() filter.
     *
     * The d3 type definition has only one generic so it doesn't allow to describe this properly.
     * However. d3 types are mutable, but we can pretend that they are not and we can pretend
     * that calling defined() returns a new function with a different generic type.
     */ var _nullableLineFunction = lineFunction.defined(areaDefined).curve(curveFactory);
        var finalPoints = connectNulls ? areaPoints.filter(areaDefined) : areaPoints;
        return _nullableLineFunction(finalPoints);
    }
    if (layout === 'vertical' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(baseLine)) {
        lineFunction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__area$3e$__["area"])().y(getY).x1(getX).x0(baseLine);
    } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(baseLine)) {
        lineFunction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$area$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__area$3e$__["area"])().x(getX).y1(getY).y0(baseLine);
    } else {
        lineFunction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$d3$2d$shape$2f$src$2f$line$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__line$3e$__["line"])().x(getX).y(getY);
    }
    var nullableLineFunction = lineFunction.defined(defined).curve(curveFactory);
    return nullableLineFunction(formatPoints);
};
var Curve = (props)=>{
    var { className, points, path, pathRef } = props;
    if ((!points || !points.length) && !path) {
        return null;
    }
    var realPath = points && points.length ? getPath(props) : path;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesNoEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesNoEvents"])(props), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$types$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adaptEventHandlers"])(props), {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-curve', className),
        d: realPath === null ? undefined : realPath,
        ref: pathRef
    }));
};
}),
"[project]/pwa/node_modules/recharts/es6/shape/Cross.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Cross",
    ()=>Cross
]);
/**
 * @fileOverview Cross
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/svgPropertiesAndEvents.js [app-ssr] (ecmascript)");
var _excluded = [
    "x",
    "y",
    "top",
    "left",
    "width",
    "height",
    "className"
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
var getPath = (x, y, width, height, top, left)=>{
    return "M".concat(x, ",").concat(top, "v").concat(height, "M").concat(left, ",").concat(y, "h").concat(width);
};
var Cross = (_ref)=>{
    var { x = 0, y = 0, top = 0, left = 0, width = 0, height = 0, className } = _ref, rest = _objectWithoutProperties(_ref, _excluded);
    var props = _objectSpread({
        x,
        y,
        top,
        left,
        width,
        height
    }, rest);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(x) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(y) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(width) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(height) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(top) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNumber"])(left)) {
        return null;
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createElement"]("path", _extends({}, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$svgPropertiesAndEvents$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["svgPropertiesAndEvents"])(props), {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])('recharts-cross', className),
        d: getPath(x, y, width, height, top, left)
    }));
};
}),
"[project]/pwa/node_modules/recharts/es6/animation/util.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDashCase",
    ()=>getDashCase,
    "getIntersectionKeys",
    ()=>getIntersectionKeys,
    "getTransitionVal",
    ()=>getTransitionVal,
    "mapObject",
    ()=>mapObject
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
var getDashCase = (name)=>name.replace(/([A-Z])/g, (v)=>"-".concat(v.toLowerCase()));
var getTransitionVal = (props, duration, easing)=>props.map((prop)=>"".concat(getDashCase(prop), " ").concat(duration, "ms ").concat(easing)).join(',');
var getIntersectionKeys = (preObj, nextObj)=>[
        Object.keys(preObj),
        Object.keys(nextObj)
    ].reduce((a, b)=>a.filter((c)=>b.includes(c)));
var mapObject = (fn, obj)=>Object.keys(obj).reduce((res, key)=>_objectSpread(_objectSpread({}, res), {}, {
            [key]: fn(key, obj[key])
        }), {});
}),
"[project]/pwa/node_modules/recharts/es6/animation/configUpdate.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alpha",
    ()=>alpha,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/util.js [app-ssr] (ecmascript)");
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
var alpha = (begin, end, k)=>begin + (end - begin) * k;
var needContinue = (_ref)=>{
    var { from, to } = _ref;
    return from !== to;
};
/*
 * @description: cal new from value and velocity in each stepper
 * @return: { [styleProperty]: { from, to, velocity } }
 */ var calStepperVals = (easing, preVals, steps)=>{
    var nextStepVals = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapObject"])((key, val)=>{
        if (needContinue(val)) {
            var [newX, newV] = easing(val.from, val.to, val.velocity);
            return _objectSpread(_objectSpread({}, val), {}, {
                from: newX,
                velocity: newV
            });
        }
        return val;
    }, preVals);
    if (steps < 1) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapObject"])((key, val)=>{
            if (needContinue(val)) {
                return _objectSpread(_objectSpread({}, val), {}, {
                    velocity: alpha(val.velocity, nextStepVals[key].velocity, steps),
                    from: alpha(val.from, nextStepVals[key].from, steps)
                });
            }
            return val;
        }, preVals);
    }
    return calStepperVals(easing, nextStepVals, steps - 1);
};
function createStepperUpdate(from, to, easing, interKeys, render, timeoutController) {
    var preTime;
    var stepperStyle = interKeys.reduce((res, key)=>_objectSpread(_objectSpread({}, res), {}, {
            [key]: {
                from: from[key],
                velocity: 0,
                to: to[key]
            }
        }), {});
    var getCurrStyle = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapObject"])((key, val)=>val.from, stepperStyle);
    var shouldStopAnimation = ()=>!Object.values(stepperStyle).filter(needContinue).length;
    var stopAnimation = null;
    var stepperUpdate = (now)=>{
        if (!preTime) {
            preTime = now;
        }
        var deltaTime = now - preTime;
        var steps = deltaTime / easing.dt;
        stepperStyle = calStepperVals(easing, stepperStyle, steps);
        // get union set and add compatible prefix
        render(_objectSpread(_objectSpread(_objectSpread({}, from), to), getCurrStyle()));
        preTime = now;
        if (!shouldStopAnimation()) {
            stopAnimation = timeoutController.setTimeout(stepperUpdate);
        }
    };
    // return start animation method
    return ()=>{
        stopAnimation = timeoutController.setTimeout(stepperUpdate);
        // return stop animation method
        return ()=>{
            var _stopAnimation;
            (_stopAnimation = stopAnimation) === null || _stopAnimation === void 0 || _stopAnimation();
        };
    };
}
function createTimingUpdate(from, to, easing, duration, interKeys, render, timeoutController) {
    var stopAnimation = null;
    var timingStyle = interKeys.reduce((res, key)=>_objectSpread(_objectSpread({}, res), {}, {
            [key]: [
                from[key],
                to[key]
            ]
        }), {});
    var beginTime;
    var timingUpdate = (now)=>{
        if (!beginTime) {
            beginTime = now;
        }
        var t = (now - beginTime) / duration;
        var currStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapObject"])((key, val)=>alpha(...val, easing(t)), timingStyle);
        // get union set and add compatible prefix
        render(_objectSpread(_objectSpread(_objectSpread({}, from), to), currStyle));
        if (t < 1) {
            stopAnimation = timeoutController.setTimeout(timingUpdate);
        } else {
            var finalStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapObject"])((key, val)=>alpha(...val, easing(1)), timingStyle);
            render(_objectSpread(_objectSpread(_objectSpread({}, from), to), finalStyle));
        }
    };
    // return start animation method
    return ()=>{
        stopAnimation = timeoutController.setTimeout(timingUpdate);
        // return stop animation method
        return ()=>{
            var _stopAnimation2;
            (_stopAnimation2 = stopAnimation) === null || _stopAnimation2 === void 0 || _stopAnimation2();
        };
    };
}
const __TURBOPACK__default__export__ = (from, to, easing, duration, render, timeoutController)=>{
    var interKeys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$util$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getIntersectionKeys"])(from, to);
    if (easing == null) {
        // no animation, just set to final state
        return ()=>{
            render(_objectSpread(_objectSpread({}, from), to));
            return ()=>{};
        };
    }
    return easing.isStepper === true ? createStepperUpdate(from, to, easing, interKeys, render, timeoutController) : createTimingUpdate(from, to, easing, duration, interKeys, render, timeoutController);
};
}),
"[project]/pwa/node_modules/recharts/es6/animation/easing.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCURACY",
    ()=>ACCURACY,
    "configBezier",
    ()=>configBezier,
    "configEasing",
    ()=>configEasing,
    "configSpring",
    ()=>configSpring
]);
var ACCURACY = 1e-4;
var cubicBezierFactor = (c1, c2)=>[
        0,
        3 * c1,
        3 * c2 - 6 * c1,
        3 * c1 - 3 * c2 + 1
    ];
var evaluatePolynomial = (params, t)=>params.map((param, i)=>param * t ** i).reduce((pre, curr)=>pre + curr);
var cubicBezier = (c1, c2)=>(t)=>{
        var params = cubicBezierFactor(c1, c2);
        return evaluatePolynomial(params, t);
    };
var derivativeCubicBezier = (c1, c2)=>(t)=>{
        var params = cubicBezierFactor(c1, c2);
        var newParams = [
            ...params.map((param, i)=>param * i).slice(1),
            0
        ];
        return evaluatePolynomial(newParams, t);
    };
var getBezierCoordinates = function getBezierCoordinates() {
    for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
        args[_key] = arguments[_key];
    }
    if (args.length === 1) {
        switch(args[0]){
            case 'linear':
                return [
                    0.0,
                    0.0,
                    1.0,
                    1.0
                ];
            case 'ease':
                return [
                    0.25,
                    0.1,
                    0.25,
                    1.0
                ];
            case 'ease-in':
                return [
                    0.42,
                    0.0,
                    1.0,
                    1.0
                ];
            case 'ease-out':
                return [
                    0.42,
                    0.0,
                    0.58,
                    1.0
                ];
            case 'ease-in-out':
                return [
                    0.0,
                    0.0,
                    0.58,
                    1.0
                ];
            default:
                {
                    var _easing$;
                    var easing = args[0].split('(');
                    if (easing[0] === 'cubic-bezier' && ((_easing$ = easing[1]) === null || _easing$ === void 0 ? void 0 : _easing$.split(')')[0].split(',').length) === 4) {
                        var coords = easing[1].split(')')[0].split(',').map((x)=>parseFloat(x));
                        return [
                            coords[0],
                            coords[1],
                            coords[2],
                            coords[3]
                        ];
                    }
                }
        }
    }
    if (args.length === 4) {
        return args;
    }
    // Fallback for invalid inputs. The previous implementation was buggy and would lead to NaN.
    // Returning linear easing is a safe default.
    return [
        0.0,
        0.0,
        1.0,
        1.0
    ];
};
var createBezierEasing = (x1, y1, x2, y2)=>{
    var curveX = cubicBezier(x1, x2);
    var curveY = cubicBezier(y1, y2);
    var derCurveX = derivativeCubicBezier(x1, x2);
    var rangeValue = (value)=>{
        if (value > 1) {
            return 1;
        }
        if (value < 0) {
            return 0;
        }
        return value;
    };
    var bezier = (_t)=>{
        var t = _t > 1 ? 1 : _t;
        var x = t;
        for(var i = 0; i < 8; ++i){
            var evalT = curveX(x) - t;
            var derVal = derCurveX(x);
            if (Math.abs(evalT - t) < ACCURACY || derVal < ACCURACY) {
                return curveY(x);
            }
            x = rangeValue(x - evalT / derVal);
        }
        return curveY(x);
    };
    bezier.isStepper = false;
    return bezier;
};
var configBezier = function configBezier() {
    return createBezierEasing(...getBezierCoordinates(...arguments));
};
var configSpring = function configSpring() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var { stiff = 100, damping = 8, dt = 17 } = config;
    var stepper = (currX, destX, currV)=>{
        var FSpring = -(currX - destX) * stiff;
        var FDamping = currV * damping;
        var newV = currV + (FSpring - FDamping) * dt / 1000;
        var newX = currV * dt / 1000 + currX;
        if (Math.abs(newX - destX) < ACCURACY && Math.abs(newV) < ACCURACY) {
            return [
                destX,
                0
            ];
        }
        return [
            newX,
            newV
        ];
    };
    stepper.isStepper = true;
    stepper.dt = dt;
    return stepper;
};
var configEasing = (easing)=>{
    if (typeof easing === 'string') {
        switch(easing){
            case 'ease':
            case 'ease-in-out':
            case 'ease-out':
            case 'ease-in':
            case 'linear':
                return configBezier(easing);
            case 'spring':
                return configSpring();
            default:
                if (easing.split('(')[0] === 'cubic-bezier') {
                    return configBezier(easing);
                }
        }
    }
    if (typeof easing === 'function') {
        return easing;
    }
    return null;
};
}),
"[project]/pwa/node_modules/recharts/es6/animation/AnimationManager.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Represents a single item in the ReactSmoothQueue.
 * The item can be:
 * - A number representing a delay in milliseconds.
 * - An object representing a style change
 * - A StartAnimationFunction that starts eased transition and calls different render
 *      because of course in Recharts we have to have three ways to do everything
 * - An arbitrary function to be executed
 */ __turbopack_context__.s([
    "createAnimateManager",
    ()=>createAnimateManager
]);
function createAnimateManager(timeoutController) {
    var currStyle;
    var handleChange = ()=>null;
    var shouldStop = false;
    var cancelTimeout = null;
    var setStyle = (_style)=>{
        if (shouldStop) {
            return;
        }
        if (Array.isArray(_style)) {
            if (!_style.length) {
                return;
            }
            var styles = _style;
            var [curr, ...restStyles] = styles;
            if (typeof curr === 'number') {
                cancelTimeout = timeoutController.setTimeout(setStyle.bind(null, restStyles), curr);
                return;
            }
            setStyle(curr);
            cancelTimeout = timeoutController.setTimeout(setStyle.bind(null, restStyles));
            return;
        }
        if (typeof _style === 'string') {
            currStyle = _style;
            handleChange(currStyle);
        }
        if (typeof _style === 'object') {
            currStyle = _style;
            handleChange(currStyle);
        }
        if (typeof _style === 'function') {
            _style();
        }
    };
    return {
        stop: ()=>{
            shouldStop = true;
        },
        start: (style)=>{
            shouldStop = false;
            if (cancelTimeout) {
                cancelTimeout();
                cancelTimeout = null;
            }
            setStyle(style);
        },
        subscribe: (_handleChange)=>{
            handleChange = _handleChange;
            return ()=>{
                handleChange = ()=>null;
            };
        },
        getTimeoutController: ()=>timeoutController
    };
}
}),
"[project]/pwa/node_modules/recharts/es6/animation/timeoutController.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Callback type for the timeout function.
 * Receives current time in milliseconds as an argument.
 */ /**
 * A function that, when called, cancels the timeout.
 */ __turbopack_context__.s([
    "RequestAnimationFrameTimeoutController",
    ()=>RequestAnimationFrameTimeoutController
]);
class RequestAnimationFrameTimeoutController {
    setTimeout(callback) {
        var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var startTime = performance.now();
        var requestId = null;
        var executeCallback = (now)=>{
            if (now - startTime >= delay) {
                callback(now);
            // tests fail without the extra if, even when five lines below it's not needed
            // TODO finish transition to the mocked timeout controller and then remove this condition
            } else if (typeof requestAnimationFrame === 'function') {
                requestId = requestAnimationFrame(executeCallback);
            }
        };
        requestId = requestAnimationFrame(executeCallback);
        return ()=>{
            if (requestId != null) {
                cancelAnimationFrame(requestId);
            }
        };
    }
}
}),
"[project]/pwa/node_modules/recharts/es6/animation/createDefaultAnimationManager.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDefaultAnimationManager",
    ()=>createDefaultAnimationManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$AnimationManager$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/AnimationManager.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$timeoutController$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/timeoutController.js [app-ssr] (ecmascript)");
;
;
function createDefaultAnimationManager() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$AnimationManager$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createAnimateManager"])(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$timeoutController$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RequestAnimationFrameTimeoutController"]());
}
}),
"[project]/pwa/node_modules/recharts/es6/animation/useAnimationManager.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimationManagerContext",
    ()=>AnimationManagerContext,
    "useAnimationManager",
    ()=>useAnimationManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$createDefaultAnimationManager$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/createDefaultAnimationManager.js [app-ssr] (ecmascript)");
;
;
var AnimationManagerContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$createDefaultAnimationManager$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDefaultAnimationManager"]);
function useAnimationManager(animationId, animationManagerFromProps) {
    var contextAnimationManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AnimationManagerContext);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>animationManagerFromProps !== null && animationManagerFromProps !== void 0 ? animationManagerFromProps : contextAnimationManager(animationId), [
        animationId,
        animationManagerFromProps,
        contextAnimationManager
    ]);
}
}),
"[project]/pwa/node_modules/recharts/es6/animation/JavascriptAnimate.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JavascriptAnimate",
    ()=>JavascriptAnimate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/resolveDefaultProps.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$configUpdate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/configUpdate.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$easing$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/easing.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$useAnimationManager$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/animation/useAnimationManager.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
var defaultJavascriptAnimateProps = {
    begin: 0,
    duration: 1000,
    easing: 'ease',
    isActive: true,
    canBegin: true,
    onAnimationEnd: ()=>{},
    onAnimationStart: ()=>{}
};
var from = {
    t: 0
};
var to = {
    t: 1
};
function JavascriptAnimate(outsideProps) {
    var props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$resolveDefaultProps$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveDefaultProps"])(outsideProps, defaultJavascriptAnimateProps);
    var { isActive, canBegin, duration, easing, begin, onAnimationEnd, onAnimationStart, children } = props;
    var animationManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$useAnimationManager$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnimationManager"])(props.animationId, props.animationManager);
    var [style, setStyle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(isActive ? from : to);
    var stopJSAnimation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isActive) {
            setStyle(to);
        }
    }, [
        isActive
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isActive || !canBegin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["noop"];
        }
        var startAnimation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$configUpdate$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(from, to, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$animation$2f$easing$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["configEasing"])(easing), duration, setStyle, animationManager.getTimeoutController());
        var onAnimationActive = ()=>{
            stopJSAnimation.current = startAnimation();
        };
        animationManager.start([
            onAnimationStart,
            begin,
            onAnimationActive,
            duration,
            onAnimationEnd
        ]);
        return ()=>{
            animationManager.stop();
            if (stopJSAnimation.current) {
                stopJSAnimation.current();
            }
            onAnimationEnd();
        };
    }, [
        isActive,
        canBegin,
        duration,
        easing,
        begin,
        onAnimationStart,
        onAnimationEnd,
        animationManager
    ]);
    return children(style.t);
}
}),
];

//# sourceMappingURL=7dc3a_recharts_es6_72774f51._.js.map