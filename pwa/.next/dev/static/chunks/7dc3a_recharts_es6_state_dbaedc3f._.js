(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "arrayTooltipSearcher",
    ()=>arrayTooltipSearcher,
    "createEventEmitter",
    ()=>createEventEmitter,
    "optionsReducer",
    ()=>optionsReducer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
;
function arrayTooltipSearcher(data, strIndex) {
    if (!strIndex) return undefined;
    var numIndex = Number.parseInt(strIndex, 10);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(numIndex)) {
        return undefined;
    }
    return data === null || data === void 0 ? void 0 : data[numIndex];
}
var initialState = {
    chartName: '',
    tooltipPayloadSearcher: undefined,
    eventEmitter: undefined,
    defaultTooltipEventType: 'axis'
};
var optionsSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'options',
    initialState,
    reducers: {
        createEventEmitter: (state)=>{
            if (state.eventEmitter == null) {
                state.eventEmitter = Symbol('rechartsEventEmitter');
            }
        }
    }
});
var optionsReducer = optionsSlice.reducer;
var { createEventEmitter } = optionsSlice.actions;
}),
"[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addTooltipEntrySettings",
    ()=>addTooltipEntrySettings,
    "initialState",
    ()=>initialState,
    "mouseLeaveChart",
    ()=>mouseLeaveChart,
    "mouseLeaveItem",
    ()=>mouseLeaveItem,
    "noInteraction",
    ()=>noInteraction,
    "removeTooltipEntrySettings",
    ()=>removeTooltipEntrySettings,
    "setActiveClickItemIndex",
    ()=>setActiveClickItemIndex,
    "setActiveMouseOverItemIndex",
    ()=>setActiveMouseOverItemIndex,
    "setKeyboardInteraction",
    ()=>setKeyboardInteraction,
    "setMouseClickAxisIndex",
    ()=>setMouseClickAxisIndex,
    "setMouseOverAxisIndex",
    ()=>setMouseOverAxisIndex,
    "setSyncInteraction",
    ()=>setSyncInteraction,
    "setTooltipSettingsState",
    ()=>setTooltipSettingsState,
    "tooltipReducer",
    ()=>tooltipReducer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/immer/dist/immer.mjs [app-client] (ecmascript)");
;
;
var noInteraction = {
    active: false,
    index: null,
    dataKey: undefined,
    coordinate: undefined
};
var initialState = {
    itemInteraction: {
        click: noInteraction,
        hover: noInteraction
    },
    axisInteraction: {
        click: noInteraction,
        hover: noInteraction
    },
    keyboardInteraction: noInteraction,
    syncInteraction: {
        active: false,
        index: null,
        dataKey: undefined,
        label: undefined,
        coordinate: undefined,
        sourceViewBox: undefined
    },
    tooltipItemPayloads: [],
    settings: {
        shared: undefined,
        trigger: 'hover',
        axisId: 0,
        active: false,
        defaultIndex: undefined
    }
};
var tooltipSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'tooltip',
    initialState,
    reducers: {
        addTooltipEntrySettings: {
            reducer (state, action) {
                state.tooltipItemPayloads.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removeTooltipEntrySettings: {
            reducer (state, action) {
                var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).tooltipItemPayloads.indexOf((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
                if (index > -1) {
                    state.tooltipItemPayloads.splice(index, 1);
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        setTooltipSettingsState (state, action) {
            state.settings = action.payload;
        },
        setActiveMouseOverItemIndex (state, action) {
            state.syncInteraction.active = false;
            state.keyboardInteraction.active = false;
            state.itemInteraction.hover.active = true;
            state.itemInteraction.hover.index = action.payload.activeIndex;
            state.itemInteraction.hover.dataKey = action.payload.activeDataKey;
            state.itemInteraction.hover.coordinate = action.payload.activeCoordinate;
        },
        mouseLeaveChart (state) {
            /*
       * Clear only the active flags. Why?
       * 1. Keep Coordinate to preserve animation - next time the Tooltip appears, we want to render it from
       * the last place where it was when it disappeared.
       * 2. We want to keep all the properties anyway just in case the tooltip has `active=true` prop
       * and continues being visible even after the mouse has left the chart.
       */ state.itemInteraction.hover.active = false;
            state.axisInteraction.hover.active = false;
        },
        mouseLeaveItem (state) {
            state.itemInteraction.hover.active = false;
        },
        setActiveClickItemIndex (state, action) {
            state.syncInteraction.active = false;
            state.itemInteraction.click.active = true;
            state.keyboardInteraction.active = false;
            state.itemInteraction.click.index = action.payload.activeIndex;
            state.itemInteraction.click.dataKey = action.payload.activeDataKey;
            state.itemInteraction.click.coordinate = action.payload.activeCoordinate;
        },
        setMouseOverAxisIndex (state, action) {
            state.syncInteraction.active = false;
            state.axisInteraction.hover.active = true;
            state.keyboardInteraction.active = false;
            state.axisInteraction.hover.index = action.payload.activeIndex;
            state.axisInteraction.hover.dataKey = action.payload.activeDataKey;
            state.axisInteraction.hover.coordinate = action.payload.activeCoordinate;
        },
        setMouseClickAxisIndex (state, action) {
            state.syncInteraction.active = false;
            state.keyboardInteraction.active = false;
            state.axisInteraction.click.active = true;
            state.axisInteraction.click.index = action.payload.activeIndex;
            state.axisInteraction.click.dataKey = action.payload.activeDataKey;
            state.axisInteraction.click.coordinate = action.payload.activeCoordinate;
        },
        setSyncInteraction (state, action) {
            state.syncInteraction = action.payload;
        },
        setKeyboardInteraction (state, action) {
            state.keyboardInteraction.active = action.payload.active;
            state.keyboardInteraction.index = action.payload.activeIndex;
            state.keyboardInteraction.coordinate = action.payload.activeCoordinate;
            state.keyboardInteraction.dataKey = action.payload.activeDataKey;
        }
    }
});
var { addTooltipEntrySettings, removeTooltipEntrySettings, setTooltipSettingsState, setActiveMouseOverItemIndex, mouseLeaveItem, mouseLeaveChart, setActiveClickItemIndex, setMouseOverAxisIndex, setMouseClickAxisIndex, setSyncInteraction, setKeyboardInteraction } = tooltipSlice.actions;
var tooltipReducer = tooltipSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/chartDataSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "chartDataReducer",
    ()=>chartDataReducer,
    "initialChartDataState",
    ()=>initialChartDataState,
    "setChartData",
    ()=>setChartData,
    "setComputedData",
    ()=>setComputedData,
    "setDataStartEndIndexes",
    ()=>setDataStartEndIndexes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
;
var initialChartDataState = {
    chartData: undefined,
    computedData: undefined,
    dataStartIndex: 0,
    dataEndIndex: 0
};
var chartDataSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'chartData',
    initialState: initialChartDataState,
    reducers: {
        setChartData (state, action) {
            state.chartData = action.payload;
            if (action.payload == null) {
                state.dataStartIndex = 0;
                state.dataEndIndex = 0;
                return;
            }
            if (action.payload.length > 0 && state.dataEndIndex !== action.payload.length - 1) {
                state.dataEndIndex = action.payload.length - 1;
            }
        },
        setComputedData (state, action) {
            state.computedData = action.payload;
        },
        setDataStartEndIndexes (state, action) {
            var { startIndex, endIndex } = action.payload;
            if (startIndex != null) {
                state.dataStartIndex = startIndex;
            }
            if (endIndex != null) {
                state.dataEndIndex = endIndex;
            }
        }
    }
});
var { setChartData, setDataStartEndIndexes, setComputedData } = chartDataSlice.actions;
var chartDataReducer = chartDataSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/layoutSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "chartLayoutReducer",
    ()=>chartLayoutReducer,
    "setChartSize",
    ()=>setChartSize,
    "setLayout",
    ()=>setLayout,
    "setMargin",
    ()=>setMargin,
    "setScale",
    ()=>setScale
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
;
var initialState = {
    layoutType: 'horizontal',
    width: 0,
    height: 0,
    margin: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
    },
    scale: 1
};
var chartLayoutSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'chartLayout',
    initialState,
    reducers: {
        setLayout (state, action) {
            state.layoutType = action.payload;
        },
        setChartSize (state, action) {
            state.width = action.payload.width;
            state.height = action.payload.height;
        },
        setMargin (state, action) {
            var _action$payload$top, _action$payload$right, _action$payload$botto, _action$payload$left;
            state.margin.top = (_action$payload$top = action.payload.top) !== null && _action$payload$top !== void 0 ? _action$payload$top : 0;
            state.margin.right = (_action$payload$right = action.payload.right) !== null && _action$payload$right !== void 0 ? _action$payload$right : 0;
            state.margin.bottom = (_action$payload$botto = action.payload.bottom) !== null && _action$payload$botto !== void 0 ? _action$payload$botto : 0;
            state.margin.left = (_action$payload$left = action.payload.left) !== null && _action$payload$left !== void 0 ? _action$payload$left : 0;
        },
        setScale (state, action) {
            state.scale = action.payload;
        }
    }
});
var { setMargin, setLayout, setChartSize, setScale } = chartLayoutSlice.actions;
var chartLayoutReducer = chartLayoutSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/RechartsReduxContext.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RechartsReduxContext",
    ()=>RechartsReduxContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var RechartsReduxContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
}),
"[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppDispatch",
    ()=>useAppDispatch,
    "useAppSelector",
    ()=>useAppSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$use$2d$sync$2d$external$2d$store$2f$shim$2f$with$2d$selector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/use-sync-external-store/shim/with-selector.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsReduxContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/RechartsReduxContext.js [app-client] (ecmascript)");
;
;
;
var noopDispatch = (a)=>a;
var useAppDispatch = ()=>{
    var context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsReduxContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RechartsReduxContext"]);
    if (context) {
        return context.store.dispatch;
    }
    return noopDispatch;
};
var noop = ()=>{};
var addNestedSubNoop = ()=>noop;
var refEquality = (a, b)=>a === b;
function useAppSelector(selector) {
    var context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsReduxContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RechartsReduxContext"]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$use$2d$sync$2d$external$2d$store$2f$shim$2f$with$2d$selector$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStoreWithSelector"])(context ? context.subscription.addNestedSub : addNestedSubNoop, context ? context.store.getState : noop, context ? context.store.getState : noop, context ? selector : noop, refEquality);
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/legendSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectLegendPayload",
    ()=>selectLegendPayload,
    "selectLegendSettings",
    ()=>selectLegendSettings,
    "selectLegendSize",
    ()=>selectLegendSize
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/sortBy.js [app-client] (ecmascript)");
;
;
var selectLegendSettings = (state)=>state.legend.settings;
var selectLegendSize = (state)=>state.legend.size;
var selectAllLegendPayload2DArray = (state)=>state.legend.payload;
var selectLegendPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllLegendPayload2DArray,
    selectLegendSettings
], (payloads, _ref)=>{
    var { itemSorter } = _ref;
    var flat = payloads.flat(1);
    return itemSorter ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(flat, itemSorter) : flat;
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectChartHeight",
    ()=>selectChartHeight,
    "selectChartWidth",
    ()=>selectChartWidth,
    "selectContainerScale",
    ()=>selectContainerScale,
    "selectMargin",
    ()=>selectMargin
]);
var selectChartWidth = (state)=>state.layout.width;
var selectChartHeight = (state)=>state.layout.height;
var selectContainerScale = (state)=>state.layout.scale;
var selectMargin = (state)=>state.layout.margin;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectAllAxes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectAllXAxes",
    ()=>selectAllXAxes,
    "selectAllYAxes",
    ()=>selectAllYAxes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
;
var selectAllXAxes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])((state)=>state.cartesianAxis.xAxis, (xAxisMap)=>{
    return Object.values(xAxisMap);
});
var selectAllYAxes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])((state)=>state.cartesianAxis.yAxis, (yAxisMap)=>{
    return Object.values(yAxisMap);
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectAxisViewBox",
    ()=>selectAxisViewBox,
    "selectBrushHeight",
    ()=>selectBrushHeight,
    "selectChartOffsetInternal",
    ()=>selectChartOffsetInternal,
    "selectChartViewBox",
    ()=>selectChartViewBox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$legendSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/legendSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectAllAxes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Constants.js [app-client] (ecmascript)");
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
var selectBrushHeight = (state)=>state.brush.height;
function selectLeftAxesOffset(state) {
    var yAxes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllYAxes"])(state);
    return yAxes.reduce((result, entry)=>{
        if (entry.orientation === 'left' && !entry.mirror && !entry.hide) {
            var width = typeof entry.width === 'number' ? entry.width : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_Y_AXIS_WIDTH"];
            return result + width;
        }
        return result;
    }, 0);
}
function selectRightAxesOffset(state) {
    var yAxes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllYAxes"])(state);
    return yAxes.reduce((result, entry)=>{
        if (entry.orientation === 'right' && !entry.mirror && !entry.hide) {
            var width = typeof entry.width === 'number' ? entry.width : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_Y_AXIS_WIDTH"];
            return result + width;
        }
        return result;
    }, 0);
}
function selectTopAxesOffset(state) {
    var xAxes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllXAxes"])(state);
    return xAxes.reduce((result, entry)=>{
        if (entry.orientation === 'top' && !entry.mirror && !entry.hide) {
            return result + entry.height;
        }
        return result;
    }, 0);
}
function selectBottomAxesOffset(state) {
    var xAxes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllXAxes"])(state);
    return xAxes.reduce((result, entry)=>{
        if (entry.orientation === 'bottom' && !entry.mirror && !entry.hide) {
            return result + entry.height;
        }
        return result;
    }, 0);
}
var selectChartOffsetInternal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectMargin"],
    selectBrushHeight,
    selectLeftAxesOffset,
    selectRightAxesOffset,
    selectTopAxesOffset,
    selectBottomAxesOffset,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$legendSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectLegendSettings"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$legendSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectLegendSize"]
], (chartWidth, chartHeight, margin, brushHeight, leftAxesOffset, rightAxesOffset, topAxesOffset, bottomAxesOffset, legendSettings, legendSize)=>{
    var offsetH = {
        left: (margin.left || 0) + leftAxesOffset,
        right: (margin.right || 0) + rightAxesOffset
    };
    var offsetV = {
        top: (margin.top || 0) + topAxesOffset,
        bottom: (margin.bottom || 0) + bottomAxesOffset
    };
    var offset = _objectSpread(_objectSpread({}, offsetV), offsetH);
    var brushBottom = offset.bottom;
    offset.bottom += brushHeight;
    offset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendOffsetOfLegend"])(offset, legendSettings, legendSize);
    var offsetWidth = chartWidth - offset.left - offset.right;
    var offsetHeight = chartHeight - offset.top - offset.bottom;
    return _objectSpread(_objectSpread({
        brushBottom
    }, offset), {}, {
        // never return negative values for height and width
        width: Math.max(offsetWidth, 0),
        height: Math.max(offsetHeight, 0)
    });
});
var selectChartViewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectChartOffsetInternal, (offset)=>({
        x: offset.left,
        y: offset.top,
        width: offset.width,
        height: offset.height
    }));
var selectAxisViewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"], (width, height)=>({
        x: 0,
        y: 0,
        width,
        height
    }));
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/brushSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectBrushDimensions",
    ()=>selectBrushDimensions,
    "selectBrushSettings",
    ()=>selectBrushSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
;
;
;
var selectBrushSettings = (state)=>state.brush;
var selectBrushDimensions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBrushSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectMargin"]
], (brushSettings, offset, margin)=>({
        height: brushSettings.height,
        x: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(brushSettings.x) ? brushSettings.x : offset.left,
        y: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(brushSettings.y) ? brushSettings.y : offset.top + offset.height + offset.brushBottom - ((margin === null || margin === void 0 ? void 0 : margin.bottom) || 0),
        width: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(brushSettings.width) ? brushSettings.width : offset.width
    }));
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectChartDataAndAlwaysIgnoreIndexes",
    ()=>selectChartDataAndAlwaysIgnoreIndexes,
    "selectChartDataWithIndexes",
    ()=>selectChartDataWithIndexes,
    "selectChartDataWithIndexesIfNotInPanorama",
    ()=>selectChartDataWithIndexesIfNotInPanorama
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
;
var selectChartDataWithIndexes = (state)=>state.chartData;
var selectChartDataAndAlwaysIgnoreIndexes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectChartDataWithIndexes
], (dataState)=>{
    var dataEndIndex = dataState.chartData != null ? dataState.chartData.length - 1 : 0;
    return {
        chartData: dataState.chartData,
        computedData: dataState.computedData,
        dataEndIndex,
        dataStartIndex: 0
    };
});
var selectChartDataWithIndexesIfNotInPanorama = (state, _unused1, _unused2, isPanorama)=>{
    if (isPanorama) {
        return selectChartDataAndAlwaysIgnoreIndexes(state);
    }
    return selectChartDataWithIndexes(state);
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectBarCategoryGap",
    ()=>selectBarCategoryGap,
    "selectBarGap",
    ()=>selectBarGap,
    "selectChartBaseValue",
    ()=>selectChartBaseValue,
    "selectChartName",
    ()=>selectChartName,
    "selectEventEmitter",
    ()=>selectEventEmitter,
    "selectRootBarSize",
    ()=>selectRootBarSize,
    "selectRootMaxBarSize",
    ()=>selectRootMaxBarSize,
    "selectStackOffsetType",
    ()=>selectStackOffsetType,
    "selectSyncId",
    ()=>selectSyncId,
    "selectSyncMethod",
    ()=>selectSyncMethod
]);
var selectRootMaxBarSize = (state)=>state.rootProps.maxBarSize;
var selectBarGap = (state)=>state.rootProps.barGap;
var selectBarCategoryGap = (state)=>state.rootProps.barCategoryGap;
var selectRootBarSize = (state)=>state.rootProps.barSize;
var selectStackOffsetType = (state)=>state.rootProps.stackOffset;
var selectChartName = (state)=>state.options.chartName;
var selectSyncId = (state)=>state.rootProps.syncId;
var selectSyncMethod = (state)=>state.rootProps.syncMethod;
var selectEventEmitter = (state)=>state.options.eventEmitter;
var selectChartBaseValue = (state)=>state.rootProps.baseValue;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineAxisRangeWithReverse.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineAxisRangeWithReverse",
    ()=>combineAxisRangeWithReverse
]);
var combineAxisRangeWithReverse = (axisSettings, axisRange)=>{
    if (!axisSettings || !axisRange) {
        return undefined;
    }
    if (axisSettings !== null && axisSettings !== void 0 && axisSettings.reversed) {
        return [
            axisRange[1],
            axisRange[0]
        ];
    }
    return axisRange;
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/polarAxisSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "implicitAngleAxis",
    ()=>implicitAngleAxis,
    "implicitRadialBarAngleAxis",
    ()=>implicitRadialBarAngleAxis,
    "implicitRadialBarRadiusAxis",
    ()=>implicitRadialBarRadiusAxis,
    "implicitRadiusAxis",
    ()=>implicitRadiusAxis,
    "selectAngleAxis",
    ()=>selectAngleAxis,
    "selectAngleAxisRange",
    ()=>selectAngleAxisRange,
    "selectAngleAxisRangeWithReversed",
    ()=>selectAngleAxisRangeWithReversed,
    "selectMaxRadius",
    ()=>selectMaxRadius,
    "selectOuterRadius",
    ()=>selectOuterRadius,
    "selectPolarOptions",
    ()=>selectPolarOptions,
    "selectPolarViewBox",
    ()=>selectPolarViewBox,
    "selectRadiusAxis",
    ()=>selectRadiusAxis,
    "selectRadiusAxisRange",
    ()=>selectRadiusAxisRange,
    "selectRadiusAxisRangeWithReversed",
    ()=>selectRadiusAxisRangeWithReversed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/polar/defaultPolarAngleAxisProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/polar/defaultPolarRadiusAxisProps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineAxisRangeWithReverse.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
var implicitAngleAxis = {
    allowDataOverflow: false,
    allowDecimals: false,
    allowDuplicatedCategory: false,
    // defaultPolarAngleAxisProps.allowDuplicatedCategory has it set to true but the actual axis rendering ignores the prop because reasons,
    dataKey: undefined,
    domain: undefined,
    id: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].angleAxisId,
    includeHidden: false,
    name: undefined,
    reversed: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].reversed,
    scale: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].scale,
    tick: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].tick,
    tickCount: undefined,
    ticks: undefined,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].type,
    unit: undefined
};
var implicitRadiusAxis = {
    allowDataOverflow: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].allowDataOverflow,
    allowDecimals: false,
    allowDuplicatedCategory: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].allowDuplicatedCategory,
    dataKey: undefined,
    domain: undefined,
    id: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].radiusAxisId,
    includeHidden: false,
    name: undefined,
    reversed: false,
    scale: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].scale,
    tick: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].tick,
    tickCount: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].tickCount,
    ticks: undefined,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].type,
    unit: undefined
};
var implicitRadialBarAngleAxis = {
    allowDataOverflow: false,
    allowDecimals: false,
    allowDuplicatedCategory: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].allowDuplicatedCategory,
    dataKey: undefined,
    domain: undefined,
    id: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].angleAxisId,
    includeHidden: false,
    name: undefined,
    reversed: false,
    scale: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].scale,
    tick: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarAngleAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarAngleAxisProps"].tick,
    tickCount: undefined,
    ticks: undefined,
    type: 'number',
    unit: undefined
};
var implicitRadialBarRadiusAxis = {
    allowDataOverflow: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].allowDataOverflow,
    allowDecimals: false,
    allowDuplicatedCategory: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].allowDuplicatedCategory,
    dataKey: undefined,
    domain: undefined,
    id: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].radiusAxisId,
    includeHidden: false,
    name: undefined,
    reversed: false,
    scale: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].scale,
    tick: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].tick,
    tickCount: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$defaultPolarRadiusAxisProps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultPolarRadiusAxisProps"].tickCount,
    ticks: undefined,
    type: 'category',
    unit: undefined
};
var selectAngleAxis = (state, angleAxisId)=>{
    if (state.polarAxis.angleAxis[angleAxisId] != null) {
        return state.polarAxis.angleAxis[angleAxisId];
    }
    if (state.layout.layoutType === 'radial') {
        return implicitRadialBarAngleAxis;
    }
    return implicitAngleAxis;
};
var selectRadiusAxis = (state, radiusAxisId)=>{
    if (state.polarAxis.radiusAxis[radiusAxisId] != null) {
        return state.polarAxis.radiusAxis[radiusAxisId];
    }
    if (state.layout.layoutType === 'radial') {
        return implicitRadialBarRadiusAxis;
    }
    return implicitRadiusAxis;
};
var selectPolarOptions = (state)=>state.polarOptions;
var selectMaxRadius = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMaxRadius"]);
var selectInnerRadius = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarOptions,
    selectMaxRadius
], (polarChartOptions, maxRadius)=>{
    if (polarChartOptions == null) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(polarChartOptions.innerRadius, maxRadius, 0);
});
var selectOuterRadius = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarOptions,
    selectMaxRadius
], (polarChartOptions, maxRadius)=>{
    if (polarChartOptions == null) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(polarChartOptions.outerRadius, maxRadius, maxRadius * 0.8);
});
var combineAngleAxisRange = (polarOptions)=>{
    if (polarOptions == null) {
        return [
            0,
            0
        ];
    }
    var { startAngle, endAngle } = polarOptions;
    return [
        startAngle,
        endAngle
    ];
};
var selectAngleAxisRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarOptions
], combineAngleAxisRange);
var selectAngleAxisRangeWithReversed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAngleAxis,
    selectAngleAxisRange
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisRangeWithReverse"]);
var selectRadiusAxisRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectMaxRadius,
    selectInnerRadius,
    selectOuterRadius
], (maxRadius, innerRadius, outerRadius)=>{
    if (maxRadius == null || innerRadius == null || outerRadius == null) {
        return undefined;
    }
    return [
        innerRadius,
        outerRadius
    ];
});
var selectRadiusAxisRangeWithReversed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectRadiusAxis,
    selectRadiusAxisRange
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisRangeWithReverse"]);
var selectPolarViewBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectPolarOptions,
    selectInnerRadius,
    selectOuterRadius,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"]
], (layout, polarOptions, innerRadius, outerRadius, width, height)=>{
    if (layout !== 'centric' && layout !== 'radial' || polarOptions == null || innerRadius == null || outerRadius == null) {
        return undefined;
    }
    var { cx, cy, startAngle, endAngle } = polarOptions;
    return {
        cx: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(cx, width, width / 2),
        cy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(cy, height, height / 2),
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        clockWise: false // this property look useful, why not use it?
    };
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/pickAxisType.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "pickAxisType",
    ()=>pickAxisType
]);
var pickAxisType = (_state, axisType)=>axisType;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/pickAxisId.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "pickAxisId",
    ()=>pickAxisId
]);
var pickAxisId = (_state, _axisType, axisId)=>axisId;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineDisplayedStackedData.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineDisplayedStackedData",
    ()=>combineDisplayedStackedData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$stacks$2f$getStackSeriesIdentifier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/stacks/getStackSeriesIdentifier.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
;
;
function combineDisplayedStackedData(stackedGraphicalItems, _ref, tooltipAxisSettings) {
    var { chartData = [] } = _ref;
    var { allowDuplicatedCategory, dataKey: tooltipDataKey } = tooltipAxisSettings;
    // A map of tooltip data keys to the stacked data points
    var knownItemsByDataKey = new Map();
    stackedGraphicalItems.forEach((item)=>{
        var _item$data;
        // If there is no data on the individual item then we use the root chart data
        var resolvedData = (_item$data = item.data) !== null && _item$data !== void 0 ? _item$data : chartData;
        if (resolvedData == null || resolvedData.length === 0) {
            // if that doesn't work then we skip this item
            return;
        }
        var stackIdentifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$stacks$2f$getStackSeriesIdentifier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStackSeriesIdentifier"])(item);
        resolvedData.forEach((entry, index)=>{
            var tooltipValue = tooltipDataKey == null || allowDuplicatedCategory ? index : String((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, tooltipDataKey, null));
            var numericValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, item.dataKey, 0);
            var curr;
            if (knownItemsByDataKey.has(tooltipValue)) {
                curr = knownItemsByDataKey.get(tooltipValue);
            } else {
                curr = {};
            }
            Object.assign(curr, {
                [stackIdentifier]: numericValue
            });
            knownItemsByDataKey.set(tooltipValue, curr);
        });
    });
    return Array.from(knownItemsByDataKey.values());
}
}),
"[project]/pwa/node_modules/recharts/es6/state/types/StackedGraphicalItem.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Some graphical items allow data stacking. The stacks are optional,
 * so all props here are optional too.
 */ /**
 * Some graphical items allow data stacking.
 * This interface is used to represent the items that are stacked
 * because the user has provided the stackId and dataKey properties.
 */ __turbopack_context__.s([
    "isStacked",
    ()=>isStacked
]);
function isStacked(graphicalItem) {
    return graphicalItem.stackId != null && graphicalItem.dataKey != null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/numberDomainEqualityCheck.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "numberDomainEqualityCheck",
    ()=>numberDomainEqualityCheck
]);
var numberDomainEqualityCheck = (a, b)=>{
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    return a[0] === b[0] && a[1] === b[1];
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/arrayEqualityCheck.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Checks if two arrays are equal, treating empty arrays as equal regardless of reference.
 * If both arrays are non-empty, it checks for reference equality.
 * @param a
 * @param b
 */ __turbopack_context__.s([
    "arrayContentsAreEqualCheck",
    ()=>arrayContentsAreEqualCheck,
    "emptyArraysAreEqualCheck",
    ()=>emptyArraysAreEqualCheck
]);
function emptyArraysAreEqualCheck(a, b) {
    if (Array.isArray(a) && Array.isArray(b) && a.length === 0 && b.length === 0) {
        // empty arrays are always equal, regardless of reference
        return true;
    }
    return a === b;
}
function arrayContentsAreEqualCheck(a, b) {
    if (a.length === b.length) {
        for(var i = 0; i < a.length; i++){
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisType.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectTooltipAxisType",
    ()=>selectTooltipAxisType
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
;
var selectTooltipAxisType = (state)=>{
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"])(state);
    if (layout === 'horizontal') {
        return 'xAxis';
    }
    if (layout === 'vertical') {
        return 'yAxis';
    }
    if (layout === 'centric') {
        return 'angleAxis';
    }
    return 'radiusAxis';
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisId.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectTooltipAxisId",
    ()=>selectTooltipAxisId
]);
var selectTooltipAxisId = (state)=>state.tooltip.settings.axisId;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineAppliedValues",
    ()=>combineAppliedValues,
    "combineAreasDomain",
    ()=>combineAreasDomain,
    "combineAxisDomain",
    ()=>combineAxisDomain,
    "combineAxisDomainWithNiceTicks",
    ()=>combineAxisDomainWithNiceTicks,
    "combineAxisTicks",
    ()=>combineAxisTicks,
    "combineCategoricalDomain",
    ()=>combineCategoricalDomain,
    "combineDisplayedData",
    ()=>combineDisplayedData,
    "combineDomainOfAllAppliedNumericalValuesIncludingErrorValues",
    ()=>combineDomainOfAllAppliedNumericalValuesIncludingErrorValues,
    "combineDomainOfStackGroups",
    ()=>combineDomainOfStackGroups,
    "combineDotsDomain",
    ()=>combineDotsDomain,
    "combineDuplicateDomain",
    ()=>combineDuplicateDomain,
    "combineGraphicalItemTicks",
    ()=>combineGraphicalItemTicks,
    "combineGraphicalItemsData",
    ()=>combineGraphicalItemsData,
    "combineGraphicalItemsSettings",
    ()=>combineGraphicalItemsSettings,
    "combineLinesDomain",
    ()=>combineLinesDomain,
    "combineNiceTicks",
    ()=>combineNiceTicks,
    "combineNumericalDomain",
    ()=>combineNumericalDomain,
    "combineRealScaleType",
    ()=>combineRealScaleType,
    "combineScaleFunction",
    ()=>combineScaleFunction,
    "combineStackGroups",
    ()=>combineStackGroups,
    "combineXAxisRange",
    ()=>combineXAxisRange,
    "combineYAxisRange",
    ()=>combineYAxisRange,
    "filterGraphicalNotStackedItems",
    ()=>filterGraphicalNotStackedItems,
    "filterReferenceElements",
    ()=>filterReferenceElements,
    "fromMainValueToError",
    ()=>fromMainValueToError,
    "getDomainDefinition",
    ()=>getDomainDefinition,
    "getErrorDomainByDataKey",
    ()=>getErrorDomainByDataKey,
    "implicitXAxis",
    ()=>implicitXAxis,
    "implicitYAxis",
    ()=>implicitYAxis,
    "implicitZAxis",
    ()=>implicitZAxis,
    "isErrorBarRelevantForAxisType",
    ()=>isErrorBarRelevantForAxisType,
    "itemAxisPredicate",
    ()=>itemAxisPredicate,
    "mergeDomains",
    ()=>mergeDomains,
    "selectAllAppliedValues",
    ()=>selectAllAppliedValues,
    "selectAllErrorBarSettings",
    ()=>selectAllErrorBarSettings,
    "selectAllXAxesOffsetSteps",
    ()=>selectAllXAxesOffsetSteps,
    "selectAllYAxesOffsetSteps",
    ()=>selectAllYAxesOffsetSteps,
    "selectAxisDomain",
    ()=>selectAxisDomain,
    "selectAxisDomainIncludingNiceTicks",
    ()=>selectAxisDomainIncludingNiceTicks,
    "selectAxisPropsNeededForCartesianGridTicksGenerator",
    ()=>selectAxisPropsNeededForCartesianGridTicksGenerator,
    "selectAxisRange",
    ()=>selectAxisRange,
    "selectAxisRangeWithReverse",
    ()=>selectAxisRangeWithReverse,
    "selectAxisScale",
    ()=>selectAxisScale,
    "selectAxisSettings",
    ()=>selectAxisSettings,
    "selectAxisWithScale",
    ()=>selectAxisWithScale,
    "selectBaseAxis",
    ()=>selectBaseAxis,
    "selectCalculatedXAxisPadding",
    ()=>selectCalculatedXAxisPadding,
    "selectCalculatedYAxisPadding",
    ()=>selectCalculatedYAxisPadding,
    "selectCartesianAxisSize",
    ()=>selectCartesianAxisSize,
    "selectCartesianGraphicalItemsData",
    ()=>selectCartesianGraphicalItemsData,
    "selectCartesianItemsSettings",
    ()=>selectCartesianItemsSettings,
    "selectCategoricalDomain",
    ()=>selectCategoricalDomain,
    "selectChartDirection",
    ()=>selectChartDirection,
    "selectDisplayedData",
    ()=>selectDisplayedData,
    "selectDisplayedStackedData",
    ()=>selectDisplayedStackedData,
    "selectDomainDefinition",
    ()=>selectDomainDefinition,
    "selectDomainFromUserPreference",
    ()=>selectDomainFromUserPreference,
    "selectDomainOfStackGroups",
    ()=>selectDomainOfStackGroups,
    "selectDuplicateDomain",
    ()=>selectDuplicateDomain,
    "selectErrorBarsSettings",
    ()=>selectErrorBarsSettings,
    "selectHasBar",
    ()=>selectHasBar,
    "selectNiceTicks",
    ()=>selectNiceTicks,
    "selectNumericalDomain",
    ()=>selectNumericalDomain,
    "selectRealScaleType",
    ()=>selectRealScaleType,
    "selectReferenceAreas",
    ()=>selectReferenceAreas,
    "selectReferenceAreasByAxis",
    ()=>selectReferenceAreasByAxis,
    "selectReferenceDots",
    ()=>selectReferenceDots,
    "selectReferenceDotsByAxis",
    ()=>selectReferenceDotsByAxis,
    "selectReferenceLines",
    ()=>selectReferenceLines,
    "selectReferenceLinesByAxis",
    ()=>selectReferenceLinesByAxis,
    "selectSmallestDistanceBetweenValues",
    ()=>selectSmallestDistanceBetweenValues,
    "selectStackGroups",
    ()=>selectStackGroups,
    "selectStackedCartesianItemsSettings",
    ()=>selectStackedCartesianItemsSettings,
    "selectTicksOfAxis",
    ()=>selectTicksOfAxis,
    "selectTicksOfGraphicalItem",
    ()=>selectTicksOfGraphicalItem,
    "selectTooltipAxis",
    ()=>selectTooltipAxis,
    "selectTooltipAxisDataKey",
    ()=>selectTooltipAxisDataKey,
    "selectUnfilteredCartesianItems",
    ()=>selectUnfilteredCartesianItems,
    "selectXAxisPosition",
    ()=>selectXAxisPosition,
    "selectXAxisSettings",
    ()=>selectXAxisSettings,
    "selectXAxisSettingsNoDefaults",
    ()=>selectXAxisSettingsNoDefaults,
    "selectXAxisSize",
    ()=>selectXAxisSize,
    "selectYAxisPosition",
    ()=>selectYAxisPosition,
    "selectYAxisSettings",
    ()=>selectYAxisSettings,
    "selectYAxisSettingsNoDefaults",
    ()=>selectYAxisSettingsNoDefaults,
    "selectYAxisSize",
    ()=>selectYAxisSize,
    "selectZAxisSettings",
    ()=>selectZAxisSettings,
    "selectZAxisWithScale",
    ()=>selectZAxisWithScale
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$range$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/range.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/victory-vendor/es/d3-scale.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/victory-vendor/es/d3-scale.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isDomainSpecifiedByUser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$getNiceTickValues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/scale/getNiceTickValues.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectAllAxes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/brushSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/polarAxisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/pickAxisType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/pickAxisId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineAxisRangeWithReverse.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$stacks$2f$getStackSeriesIdentifier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/stacks/getStackSeriesIdentifier.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineDisplayedStackedData$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineDisplayedStackedData.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/types/StackedGraphicalItem.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$numberDomainEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/numberDomainEqualityCheck.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/arrayEqualityCheck.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisId.js [app-client] (ecmascript)");
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
var defaultNumericDomain = [
    0,
    'auto'
];
var implicitXAxis = {
    allowDataOverflow: false,
    allowDecimals: true,
    allowDuplicatedCategory: true,
    angle: 0,
    dataKey: undefined,
    domain: undefined,
    height: 30,
    hide: true,
    id: 0,
    includeHidden: false,
    interval: 'preserveEnd',
    minTickGap: 5,
    mirror: false,
    name: undefined,
    orientation: 'bottom',
    padding: {
        left: 0,
        right: 0
    },
    reversed: false,
    scale: 'auto',
    tick: true,
    tickCount: 5,
    tickFormatter: undefined,
    ticks: undefined,
    type: 'category',
    unit: undefined
};
var selectXAxisSettingsNoDefaults = (state, axisId)=>{
    return state.cartesianAxis.xAxis[axisId];
};
var selectXAxisSettings = (state, axisId)=>{
    var axis = selectXAxisSettingsNoDefaults(state, axisId);
    if (axis == null) {
        return implicitXAxis;
    }
    return axis;
};
var implicitYAxis = {
    allowDataOverflow: false,
    allowDecimals: true,
    allowDuplicatedCategory: true,
    angle: 0,
    dataKey: undefined,
    domain: defaultNumericDomain,
    hide: true,
    id: 0,
    includeHidden: false,
    interval: 'preserveEnd',
    minTickGap: 5,
    mirror: false,
    name: undefined,
    orientation: 'left',
    padding: {
        top: 0,
        bottom: 0
    },
    reversed: false,
    scale: 'auto',
    tick: true,
    tickCount: 5,
    tickFormatter: undefined,
    ticks: undefined,
    type: 'number',
    unit: undefined,
    width: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_Y_AXIS_WIDTH"]
};
var selectYAxisSettingsNoDefaults = (state, axisId)=>{
    return state.cartesianAxis.yAxis[axisId];
};
var selectYAxisSettings = (state, axisId)=>{
    var axis = selectYAxisSettingsNoDefaults(state, axisId);
    if (axis == null) {
        return implicitYAxis;
    }
    return axis;
};
var implicitZAxis = {
    domain: [
        0,
        'auto'
    ],
    includeHidden: false,
    reversed: false,
    allowDataOverflow: false,
    allowDuplicatedCategory: false,
    dataKey: undefined,
    id: 0,
    name: '',
    range: [
        64,
        64
    ],
    scale: 'auto',
    type: 'number',
    unit: ''
};
var selectZAxisSettings = (state, axisId)=>{
    var axis = state.cartesianAxis.zAxis[axisId];
    if (axis == null) {
        return implicitZAxis;
    }
    return axis;
};
var selectBaseAxis = (state, axisType, axisId)=>{
    switch(axisType){
        case 'xAxis':
            {
                return selectXAxisSettings(state, axisId);
            }
        case 'yAxis':
            {
                return selectYAxisSettings(state, axisId);
            }
        case 'zAxis':
            {
                return selectZAxisSettings(state, axisId);
            }
        case 'angleAxis':
            {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAngleAxis"])(state, axisId);
            }
        case 'radiusAxis':
            {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRadiusAxis"])(state, axisId);
            }
        default:
            throw new Error("Unexpected axis type: ".concat(axisType));
    }
};
var selectCartesianAxisSettings = (state, axisType, axisId)=>{
    switch(axisType){
        case 'xAxis':
            {
                return selectXAxisSettings(state, axisId);
            }
        case 'yAxis':
            {
                return selectYAxisSettings(state, axisId);
            }
        default:
            throw new Error("Unexpected axis type: ".concat(axisType));
    }
};
var selectAxisSettings = (state, axisType, axisId)=>{
    switch(axisType){
        case 'xAxis':
            {
                return selectXAxisSettings(state, axisId);
            }
        case 'yAxis':
            {
                return selectYAxisSettings(state, axisId);
            }
        case 'angleAxis':
            {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAngleAxis"])(state, axisId);
            }
        case 'radiusAxis':
            {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRadiusAxis"])(state, axisId);
            }
        default:
            throw new Error("Unexpected axis type: ".concat(axisType));
    }
};
var selectHasBar = (state)=>state.graphicalItems.cartesianItems.some((item)=>item.type === 'bar') || state.graphicalItems.polarItems.some((item)=>item.type === 'radialBar');
function itemAxisPredicate(axisType, axisId) {
    return (item)=>{
        switch(axisType){
            case 'xAxis':
                // This is sensitive to the data type, as 0 !== '0'. I wonder if we should be more flexible. How does 2.x branch behave? TODO write test for that
                return 'xAxisId' in item && item.xAxisId === axisId;
            case 'yAxis':
                return 'yAxisId' in item && item.yAxisId === axisId;
            case 'zAxis':
                return 'zAxisId' in item && item.zAxisId === axisId;
            case 'angleAxis':
                return 'angleAxisId' in item && item.angleAxisId === axisId;
            case 'radiusAxis':
                return 'radiusAxisId' in item && item.radiusAxisId === axisId;
            default:
                return false;
        }
    };
}
var selectUnfilteredCartesianItems = (state)=>state.graphicalItems.cartesianItems;
var selectAxisPredicate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisId"]
], itemAxisPredicate);
var combineGraphicalItemsSettings = (graphicalItems, axisSettings, axisPredicate)=>graphicalItems.filter(axisPredicate).filter((item)=>{
        if ((axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.includeHidden) === true) {
            return true;
        }
        return !item.hide;
    });
var selectCartesianItemsSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectUnfilteredCartesianItems,
    selectBaseAxis,
    selectAxisPredicate
], combineGraphicalItemsSettings, {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyArraysAreEqualCheck"]
    }
});
var selectStackedCartesianItemsSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectCartesianItemsSettings
], (cartesianItems)=>{
    return cartesianItems.filter((item)=>item.type === 'area' || item.type === 'bar').filter(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isStacked"]);
});
var filterGraphicalNotStackedItems = (cartesianItems)=>cartesianItems.filter((item)=>!('stackId' in item) || item.stackId === undefined);
var selectCartesianItemsSettingsExceptStacked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectCartesianItemsSettings
], filterGraphicalNotStackedItems);
var combineGraphicalItemsData = (cartesianItems)=>cartesianItems.map((item)=>item.data).filter(Boolean).flat(1);
var selectCartesianGraphicalItemsData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectCartesianItemsSettings
], combineGraphicalItemsData, {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyArraysAreEqualCheck"]
    }
});
var combineDisplayedData = (graphicalItemsData, _ref)=>{
    var { chartData = [], dataStartIndex, dataEndIndex } = _ref;
    if (graphicalItemsData.length > 0) {
        /*
     * There is no slicing when data is defined on graphical items. Why?
     * Because Brush ignores data defined on graphical items,
     * and does not render.
     * So Brush will never show up in a Scatter chart for example.
     * This is something we will need to fix.
     *
     * Now, when the root chart data is not defined, the dataEndIndex is 0,
     * which means the itemsData will be sliced to an empty array anyway.
     * But that's an implementation detail, and we can fix that too.
     *
     * Also, in absence of Axis dataKey, we use the dataKey from each item, respectively.
     * This is the usual pattern for numerical axis, that is the one where bars go up:
     * users don't specify any dataKey by default and expect the axis to "just match the data".
     */ return graphicalItemsData;
    }
    return chartData.slice(dataStartIndex, dataEndIndex + 1);
};
var selectDisplayedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectCartesianGraphicalItemsData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexesIfNotInPanorama"]
], combineDisplayedData);
var combineAppliedValues = (data, axisSettings, items)=>{
    if ((axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.dataKey) != null) {
        return data.map((item)=>({
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(item, axisSettings.dataKey)
            }));
    }
    if (items.length > 0) {
        return items.map((item)=>item.dataKey).flatMap((dataKey)=>data.map((entry)=>({
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, dataKey)
                })));
    }
    return data.map((entry)=>({
            value: entry
        }));
};
var selectAllAppliedValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectDisplayedData,
    selectBaseAxis,
    selectCartesianItemsSettings
], combineAppliedValues);
function isErrorBarRelevantForAxisType(axisType, errorBar) {
    switch(axisType){
        case 'xAxis':
            return errorBar.direction === 'x';
        case 'yAxis':
            return errorBar.direction === 'y';
        default:
            return false;
    }
}
function fromMainValueToError(value) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumber"])(value) && Number.isFinite(value)) {
        return [
            value,
            value
        ];
    }
    if (Array.isArray(value)) {
        var minError = Math.min(...value);
        var maxError = Math.max(...value);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(minError) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(maxError) && Number.isFinite(minError) && Number.isFinite(maxError)) {
            return [
                minError,
                maxError
            ];
        }
    }
    return undefined;
}
function makeNumber(val) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumOrStr"])(val) || val instanceof Date) {
        var n = Number(val);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(n)) {
            return n;
        }
    }
    return undefined;
}
function makeDomain(val) {
    if (Array.isArray(val)) {
        var attempt = [
            makeNumber(val[0]),
            makeNumber(val[1])
        ];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellFormedNumberDomain"])(attempt)) {
            return attempt;
        }
        return undefined;
    }
    var n = makeNumber(val);
    if (n == null) {
        return undefined;
    }
    return [
        n,
        n
    ];
}
function onlyAllowNumbers(data) {
    return data.map(makeNumber).filter(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNotNil"]);
}
function getErrorDomainByDataKey(entry, appliedValue, relevantErrorBars) {
    if (!relevantErrorBars || typeof appliedValue !== 'number' || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(appliedValue)) {
        return [];
    }
    if (!relevantErrorBars.length) {
        return [];
    }
    return onlyAllowNumbers(relevantErrorBars.flatMap((eb)=>{
        var errorValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, eb.dataKey);
        var lowBound, highBound;
        if (Array.isArray(errorValue)) {
            [lowBound, highBound] = errorValue;
        } else {
            lowBound = highBound = errorValue;
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(lowBound) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(highBound)) {
            return undefined;
        }
        return [
            appliedValue - lowBound,
            appliedValue + highBound
        ];
    }));
}
var selectTooltipAxis = (state)=>{
    var axisType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"])(state);
    var axisId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisId"])(state);
    return selectAxisSettings(state, axisType, axisId);
};
var selectTooltipAxisDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipAxis
], (axis)=>axis === null || axis === void 0 ? void 0 : axis.dataKey);
var selectDisplayedStackedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectStackedCartesianItemsSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexesIfNotInPanorama"],
    selectTooltipAxis
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineDisplayedStackedData$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDisplayedStackedData"]);
var combineStackGroups = (displayedData, items, stackOffsetType)=>{
    var initialItemsGroups = {};
    var itemsGroup = items.reduce((acc, item)=>{
        if (item.stackId == null) {
            return acc;
        }
        if (acc[item.stackId] == null) {
            acc[item.stackId] = [];
        }
        acc[item.stackId].push(item);
        return acc;
    }, initialItemsGroups);
    return Object.fromEntries(Object.entries(itemsGroup).map((_ref2)=>{
        var [stackId, graphicalItems] = _ref2;
        var dataKeys = graphicalItems.map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$stacks$2f$getStackSeriesIdentifier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStackSeriesIdentifier"]);
        return [
            stackId,
            {
                // @ts-expect-error getStackedData requires that the input is array of objects, Recharts does not test for that
                stackedData: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStackedData"])(displayedData, dataKeys, stackOffsetType),
                graphicalItems
            }
        ];
    }));
};
var selectStackGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectDisplayedStackedData,
    selectStackedCartesianItemsSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackOffsetType"]
], combineStackGroups);
var combineDomainOfStackGroups = (stackGroups, _ref3, axisType, domainFromUserPreference)=>{
    var { dataStartIndex, dataEndIndex } = _ref3;
    if (domainFromUserPreference != null) {
        // User has specified a domain, so we respect that and we can skip computing anything else
        return undefined;
    }
    if (axisType === 'zAxis') {
        // ZAxis ignores stacks
        return undefined;
    }
    var domainOfStackGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDomainOfStackGroups"])(stackGroups, dataStartIndex, dataEndIndex);
    if (domainOfStackGroups != null && domainOfStackGroups[0] === 0 && domainOfStackGroups[1] === 0) {
        return undefined;
    }
    return domainOfStackGroups;
};
var selectAllowsDataOverflow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis
], (axisSettings)=>axisSettings.allowDataOverflow);
var getDomainDefinition = (axisSettings)=>{
    var _axisSettings$domain;
    if (axisSettings == null || !('domain' in axisSettings)) {
        return defaultNumericDomain;
    }
    if (axisSettings.domain != null) {
        return axisSettings.domain;
    }
    if (axisSettings.ticks != null) {
        if (axisSettings.type === 'number') {
            var allValues = onlyAllowNumbers(axisSettings.ticks);
            return [
                Math.min(...allValues),
                Math.max(...allValues)
            ];
        }
        if (axisSettings.type === 'category') {
            return axisSettings.ticks.map(String);
        }
    }
    return (_axisSettings$domain = axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.domain) !== null && _axisSettings$domain !== void 0 ? _axisSettings$domain : defaultNumericDomain;
};
var selectDomainDefinition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis
], getDomainDefinition);
var selectDomainFromUserPreference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectDomainDefinition,
    selectAllowsDataOverflow
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numericalDomainSpecifiedWithoutRequiringData"]);
var selectDomainOfStackGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectStackGroups,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    selectDomainFromUserPreference
], combineDomainOfStackGroups, {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$numberDomainEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberDomainEqualityCheck"]
    }
});
var selectAllErrorBarSettings = (state)=>state.errorBars;
var combineRelevantErrorBarSettings = (cartesianItemsSettings, allErrorBarSettings, axisType)=>{
    return cartesianItemsSettings.flatMap((item)=>{
        return allErrorBarSettings[item.id];
    }).filter(Boolean).filter((e)=>{
        return isErrorBarRelevantForAxisType(axisType, e);
    });
};
var mergeDomains = function mergeDomains() {
    for(var _len = arguments.length, domains = new Array(_len), _key = 0; _key < _len; _key++){
        domains[_key] = arguments[_key];
    }
    var allDomains = domains.filter(Boolean);
    if (allDomains.length === 0) {
        return undefined;
    }
    var allValues = allDomains.flat();
    var min = Math.min(...allValues);
    var max = Math.max(...allValues);
    return [
        min,
        max
    ];
};
var combineDomainOfAllAppliedNumericalValuesIncludingErrorValues = (data, axisSettings, items, errorBars, axisType)=>{
    var lowerEnd, upperEnd;
    if (items.length > 0) {
        data.forEach((entry)=>{
            items.forEach((item)=>{
                var _errorBars$item$id, _axisSettings$dataKey;
                var relevantErrorBars = (_errorBars$item$id = errorBars[item.id]) === null || _errorBars$item$id === void 0 ? void 0 : _errorBars$item$id.filter((errorBar)=>isErrorBarRelevantForAxisType(axisType, errorBar));
                var valueByDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, (_axisSettings$dataKey = axisSettings.dataKey) !== null && _axisSettings$dataKey !== void 0 ? _axisSettings$dataKey : item.dataKey);
                var errorDomain = getErrorDomainByDataKey(entry, valueByDataKey, relevantErrorBars);
                if (errorDomain.length >= 2) {
                    var localLower = Math.min(...errorDomain);
                    var localUpper = Math.max(...errorDomain);
                    if (lowerEnd == null || localLower < lowerEnd) {
                        lowerEnd = localLower;
                    }
                    if (upperEnd == null || localUpper > upperEnd) {
                        upperEnd = localUpper;
                    }
                }
                var dataValueDomain = makeDomain(valueByDataKey);
                if (dataValueDomain != null) {
                    lowerEnd = lowerEnd == null ? dataValueDomain[0] : Math.min(lowerEnd, dataValueDomain[0]);
                    upperEnd = upperEnd == null ? dataValueDomain[1] : Math.max(upperEnd, dataValueDomain[1]);
                }
            });
        });
    }
    if ((axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.dataKey) != null) {
        data.forEach((item)=>{
            var dataValueDomain = makeDomain((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(item, axisSettings.dataKey));
            if (dataValueDomain != null) {
                lowerEnd = lowerEnd == null ? dataValueDomain[0] : Math.min(lowerEnd, dataValueDomain[0]);
                upperEnd = upperEnd == null ? dataValueDomain[1] : Math.max(upperEnd, dataValueDomain[1]);
            }
        });
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(lowerEnd) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(upperEnd)) {
        return [
            lowerEnd,
            upperEnd
        ];
    }
    return undefined;
};
var selectDomainOfAllAppliedNumericalValuesIncludingErrorValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectDisplayedData,
    selectBaseAxis,
    selectCartesianItemsSettingsExceptStacked,
    selectAllErrorBarSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineDomainOfAllAppliedNumericalValuesIncludingErrorValues, {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$numberDomainEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberDomainEqualityCheck"]
    }
});
function onlyAllowNumbersAndStringsAndDates(item) {
    var { value } = item;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNumOrStr"])(value) || value instanceof Date) {
        return value;
    }
    return undefined;
}
var computeDomainOfTypeCategory = (allDataSquished, axisSettings, isCategorical)=>{
    var categoricalDomain = allDataSquished.map(onlyAllowNumbersAndStringsAndDates).filter((v)=>v != null);
    if (isCategorical && (axisSettings.dataKey == null || axisSettings.allowDuplicatedCategory && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasDuplicate"])(categoricalDomain))) {
        /*
     * 1. In an absence of dataKey, Recharts will use array indexes as its categorical domain
     * 2. When category axis has duplicated text, serial numbers are used to generate scale
     */ return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$range$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(0, allDataSquished.length);
    }
    if (axisSettings.allowDuplicatedCategory) {
        return categoricalDomain;
    }
    return Array.from(new Set(categoricalDomain));
};
var selectReferenceDots = (state)=>state.referenceElements.dots;
var filterReferenceElements = (elements, axisType, axisId)=>{
    return elements.filter((el)=>el.ifOverflow === 'extendDomain').filter((el)=>{
        if (axisType === 'xAxis') {
            return el.xAxisId === axisId;
        }
        return el.yAxisId === axisId;
    });
};
var selectReferenceDotsByAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceDots,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisId"]
], filterReferenceElements);
var selectReferenceAreas = (state)=>state.referenceElements.areas;
var selectReferenceAreasByAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceAreas,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisId"]
], filterReferenceElements);
var selectReferenceLines = (state)=>state.referenceElements.lines;
var selectReferenceLinesByAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceLines,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisId"]
], filterReferenceElements);
var combineDotsDomain = (dots, axisType)=>{
    var allCoords = onlyAllowNumbers(dots.map((dot)=>axisType === 'xAxis' ? dot.x : dot.y));
    if (allCoords.length === 0) {
        return undefined;
    }
    return [
        Math.min(...allCoords),
        Math.max(...allCoords)
    ];
};
var selectReferenceDotsDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectReferenceDotsByAxis, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"], combineDotsDomain);
var combineAreasDomain = (areas, axisType)=>{
    var allCoords = onlyAllowNumbers(areas.flatMap((area)=>[
            axisType === 'xAxis' ? area.x1 : area.y1,
            axisType === 'xAxis' ? area.x2 : area.y2
        ]));
    if (allCoords.length === 0) {
        return undefined;
    }
    return [
        Math.min(...allCoords),
        Math.max(...allCoords)
    ];
};
var selectReferenceAreasDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceAreasByAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineAreasDomain);
function extractXCoordinates(line) {
    var _line$segment;
    if (line.x != null) {
        return onlyAllowNumbers([
            line.x
        ]);
    }
    var segmentCoordinates = (_line$segment = line.segment) === null || _line$segment === void 0 ? void 0 : _line$segment.map((s)=>s.x);
    if (segmentCoordinates == null || segmentCoordinates.length === 0) {
        return [];
    }
    return onlyAllowNumbers(segmentCoordinates);
}
function extractYCoordinates(line) {
    var _line$segment2;
    if (line.y != null) {
        return onlyAllowNumbers([
            line.y
        ]);
    }
    var segmentCoordinates = (_line$segment2 = line.segment) === null || _line$segment2 === void 0 ? void 0 : _line$segment2.map((s)=>s.y);
    if (segmentCoordinates == null || segmentCoordinates.length === 0) {
        return [];
    }
    return onlyAllowNumbers(segmentCoordinates);
}
var combineLinesDomain = (lines, axisType)=>{
    var allCoords = lines.flatMap((line)=>axisType === 'xAxis' ? extractXCoordinates(line) : extractYCoordinates(line));
    if (allCoords.length === 0) {
        return undefined;
    }
    return [
        Math.min(...allCoords),
        Math.max(...allCoords)
    ];
};
var selectReferenceLinesDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceLinesByAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineLinesDomain);
var selectReferenceElementsDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectReferenceDotsDomain, selectReferenceLinesDomain, selectReferenceAreasDomain, (dotsDomain, linesDomain, areasDomain)=>{
    return mergeDomains(dotsDomain, areasDomain, linesDomain);
});
var combineNumericalDomain = (axisSettings, domainDefinition, domainFromUserPreference, domainOfStackGroups, dataAndErrorBarsDomain, referenceElementsDomain, layout, axisType)=>{
    if (domainFromUserPreference != null) {
        // We're done! No need to compute anything else.
        return domainFromUserPreference;
    }
    var shouldIncludeDomainOfStackGroups = layout === 'vertical' && axisType === 'xAxis' || layout === 'horizontal' && axisType === 'yAxis';
    var mergedDomains = shouldIncludeDomainOfStackGroups ? mergeDomains(domainOfStackGroups, referenceElementsDomain, dataAndErrorBarsDomain) : mergeDomains(referenceElementsDomain, dataAndErrorBarsDomain);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseNumericalUserDomain"])(domainDefinition, mergedDomains, axisSettings.allowDataOverflow);
};
var selectNumericalDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    selectDomainDefinition,
    selectDomainFromUserPreference,
    selectDomainOfStackGroups,
    selectDomainOfAllAppliedNumericalValuesIncludingErrorValues,
    selectReferenceElementsDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineNumericalDomain, {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$numberDomainEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberDomainEqualityCheck"]
    }
});
/**
 * Expand by design maps everything between 0 and 1,
 * there is nothing to compute.
 * See https://d3js.org/d3-shape/stack#stack-offsets
 */ var expandDomain = [
    0,
    1
];
var combineAxisDomain = (axisSettings, layout, displayedData, allAppliedValues, stackOffsetType, axisType, numericalDomain)=>{
    if ((axisSettings == null || displayedData == null || displayedData.length === 0) && numericalDomain === undefined) {
        return undefined;
    }
    var { dataKey, type } = axisSettings;
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, axisType);
    if (isCategorical && dataKey == null) {
        var _displayedData$length;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$range$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(0, (_displayedData$length = displayedData === null || displayedData === void 0 ? void 0 : displayedData.length) !== null && _displayedData$length !== void 0 ? _displayedData$length : 0);
    }
    if (type === 'category') {
        return computeDomainOfTypeCategory(allAppliedValues, axisSettings, isCategorical);
    }
    if (stackOffsetType === 'expand') {
        return expandDomain;
    }
    return numericalDomain;
};
var selectAxisDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectDisplayedData,
    selectAllAppliedValues,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackOffsetType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    selectNumericalDomain
], combineAxisDomain);
var combineRealScaleType = (axisConfig, layout, hasBar, chartType, axisType)=>{
    if (axisConfig == null) {
        return undefined;
    }
    var { scale, type } = axisConfig;
    if (scale === 'auto') {
        if (layout === 'radial' && axisType === 'radiusAxis') {
            return 'band';
        }
        if (layout === 'radial' && axisType === 'angleAxis') {
            return 'linear';
        }
        if (type === 'category' && chartType && (chartType.indexOf('LineChart') >= 0 || chartType.indexOf('AreaChart') >= 0 || chartType.indexOf('ComposedChart') >= 0 && !hasBar)) {
            return 'point';
        }
        if (type === 'category') {
            return 'band';
        }
        return 'linear';
    }
    if (typeof scale === 'string') {
        var name = "scale".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["upperFirst"])(scale));
        return name in __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ ? name : 'point';
    }
    return undefined;
};
var selectRealScaleType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectHasBar,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartName"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineRealScaleType);
function getD3ScaleFromType(realScaleType) {
    if (realScaleType == null) {
        return undefined;
    }
    if (realScaleType in __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__) {
        // @ts-expect-error we should do better type verification here
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[realScaleType]();
    }
    var name = "scale".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["upperFirst"])(realScaleType));
    if (name in __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__) {
        // @ts-expect-error we should do better type verification here
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$victory$2d$vendor$2f$es$2f$d3$2d$scale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[name]();
    }
    return undefined;
}
function combineScaleFunction(axis, realScaleType, axisDomain, axisRange) {
    if (axisDomain == null || axisRange == null) {
        return undefined;
    }
    if (typeof axis.scale === 'function') {
        // @ts-expect-error we're going to assume here that if axis.scale is a function then it is a d3Scale function
        return axis.scale.copy().domain(axisDomain).range(axisRange);
    }
    var d3ScaleFunction = getD3ScaleFromType(realScaleType);
    if (d3ScaleFunction == null) {
        return undefined;
    }
    var scale = d3ScaleFunction.domain(axisDomain).range(axisRange);
    // I don't like this function because it mutates the scale. We should come up with a way to compute the domain up front.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["checkDomainOfScale"])(scale);
    return scale;
}
var combineNiceTicks = (axisDomain, axisSettings, realScaleType)=>{
    var domainDefinition = getDomainDefinition(axisSettings);
    if (realScaleType !== 'auto' && realScaleType !== 'linear') {
        return undefined;
    }
    if (axisSettings != null && axisSettings.tickCount && Array.isArray(domainDefinition) && (domainDefinition[0] === 'auto' || domainDefinition[1] === 'auto') && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellFormedNumberDomain"])(axisDomain)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$getNiceTickValues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNiceTickValues"])(axisDomain, axisSettings.tickCount, axisSettings.allowDecimals);
    }
    if (axisSettings != null && axisSettings.tickCount && axisSettings.type === 'number' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellFormedNumberDomain"])(axisDomain)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$scale$2f$getNiceTickValues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTickValuesFixedDomain"])(axisDomain, axisSettings.tickCount, axisSettings.allowDecimals);
    }
    return undefined;
};
var selectNiceTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAxisDomain,
    selectAxisSettings,
    selectRealScaleType
], combineNiceTicks);
var combineAxisDomainWithNiceTicks = (axisSettings, domain, niceTicks, axisType)=>{
    if (/*
   * Angle axis for some reason uses nice ticks when rendering axis tick labels,
   * but doesn't use nice ticks for extending domain like all the other axes do.
   * Not really sure why? Is there a good reason,
   * or is it just because someone added support for nice ticks to the other axes and forgot this one?
   */ axisType !== 'angleAxis' && (axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.type) === 'number' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellFormedNumberDomain"])(domain) && Array.isArray(niceTicks) && niceTicks.length > 0) {
        var minFromDomain = domain[0];
        var minFromTicks = niceTicks[0];
        var maxFromDomain = domain[1];
        var maxFromTicks = niceTicks[niceTicks.length - 1];
        return [
            Math.min(minFromDomain, minFromTicks),
            Math.max(maxFromDomain, maxFromTicks)
        ];
    }
    return domain;
};
var selectAxisDomainIncludingNiceTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    selectAxisDomain,
    selectNiceTicks,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineAxisDomainWithNiceTicks);
var selectSmallestDistanceBetweenValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectAllAppliedValues, selectBaseAxis, (allDataSquished, axisSettings)=>{
    if (!axisSettings || axisSettings.type !== 'number') {
        return undefined;
    }
    var smallestDistanceBetweenValues = Infinity;
    var sortedValues = Array.from(onlyAllowNumbers(allDataSquished.map((d)=>d.value))).sort((a, b)=>a - b);
    if (sortedValues.length < 2) {
        return Infinity;
    }
    var diff = sortedValues[sortedValues.length - 1] - sortedValues[0];
    if (diff === 0) {
        return Infinity;
    }
    // Only do n - 1 distance calculations because there's only n - 1 distances between n values.
    for(var i = 0; i < sortedValues.length - 1; i++){
        var distance = sortedValues[i + 1] - sortedValues[i];
        smallestDistanceBetweenValues = Math.min(smallestDistanceBetweenValues, distance);
    }
    return smallestDistanceBetweenValues / diff;
});
var selectCalculatedPadding = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectSmallestDistanceBetweenValues, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBarCategoryGap"], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"], (_1, _2, _3, padding)=>padding, (smallestDistanceInPercent, layout, barCategoryGap, offset, padding)=>{
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(smallestDistanceInPercent)) {
        return 0;
    }
    var rangeWidth = layout === 'vertical' ? offset.height : offset.width;
    if (padding === 'gap') {
        return smallestDistanceInPercent * rangeWidth / 2;
    }
    if (padding === 'no-gap') {
        var gap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(barCategoryGap, smallestDistanceInPercent * rangeWidth);
        var halfBand = smallestDistanceInPercent * rangeWidth / 2;
        return halfBand - gap - (halfBand - gap) / rangeWidth * gap;
    }
    return 0;
});
var selectCalculatedXAxisPadding = (state, axisId)=>{
    var xAxisSettings = selectXAxisSettings(state, axisId);
    if (xAxisSettings == null || typeof xAxisSettings.padding !== 'string') {
        return 0;
    }
    return selectCalculatedPadding(state, 'xAxis', axisId, xAxisSettings.padding);
};
var selectCalculatedYAxisPadding = (state, axisId)=>{
    var yAxisSettings = selectYAxisSettings(state, axisId);
    if (yAxisSettings == null || typeof yAxisSettings.padding !== 'string') {
        return 0;
    }
    return selectCalculatedPadding(state, 'yAxis', axisId, yAxisSettings.padding);
};
var selectXAxisPadding = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectXAxisSettings, selectCalculatedXAxisPadding, (xAxisSettings, calculated)=>{
    var _padding$left, _padding$right;
    if (xAxisSettings == null) {
        return {
            left: 0,
            right: 0
        };
    }
    var { padding } = xAxisSettings;
    if (typeof padding === 'string') {
        return {
            left: calculated,
            right: calculated
        };
    }
    return {
        left: ((_padding$left = padding.left) !== null && _padding$left !== void 0 ? _padding$left : 0) + calculated,
        right: ((_padding$right = padding.right) !== null && _padding$right !== void 0 ? _padding$right : 0) + calculated
    };
});
var selectYAxisPadding = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectYAxisSettings, selectCalculatedYAxisPadding, (yAxisSettings, calculated)=>{
    var _padding$top, _padding$bottom;
    if (yAxisSettings == null) {
        return {
            top: 0,
            bottom: 0
        };
    }
    var { padding } = yAxisSettings;
    if (typeof padding === 'string') {
        return {
            top: calculated,
            bottom: calculated
        };
    }
    return {
        top: ((_padding$top = padding.top) !== null && _padding$top !== void 0 ? _padding$top : 0) + calculated,
        bottom: ((_padding$bottom = padding.bottom) !== null && _padding$bottom !== void 0 ? _padding$bottom : 0) + calculated
    };
});
var combineXAxisRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    selectXAxisPadding,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBrushDimensions"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBrushSettings"],
    (_state, _axisId, isPanorama)=>isPanorama
], (offset, padding, brushDimensions, _ref4, isPanorama)=>{
    var { padding: brushPadding } = _ref4;
    if (isPanorama) {
        return [
            brushPadding.left,
            brushDimensions.width - brushPadding.right
        ];
    }
    return [
        offset.left + padding.left,
        offset.left + offset.width - padding.right
    ];
});
var combineYAxisRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectYAxisPadding,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBrushDimensions"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$brushSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBrushSettings"],
    (_state, _axisId, isPanorama)=>isPanorama
], (offset, layout, padding, brushDimensions, _ref5, isPanorama)=>{
    var { padding: brushPadding } = _ref5;
    if (isPanorama) {
        return [
            brushDimensions.height - brushPadding.bottom,
            brushPadding.top
        ];
    }
    if (layout === 'horizontal') {
        return [
            offset.top + offset.height - padding.bottom,
            offset.top + padding.top
        ];
    }
    return [
        offset.top + padding.top,
        offset.top + offset.height - padding.bottom
    ];
});
var selectAxisRange = (state, axisType, axisId, isPanorama)=>{
    var _selectZAxisSettings;
    switch(axisType){
        case 'xAxis':
            return combineXAxisRange(state, axisId, isPanorama);
        case 'yAxis':
            return combineYAxisRange(state, axisId, isPanorama);
        case 'zAxis':
            return (_selectZAxisSettings = selectZAxisSettings(state, axisId)) === null || _selectZAxisSettings === void 0 ? void 0 : _selectZAxisSettings.range;
        case 'angleAxis':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAngleAxisRange"])(state);
        case 'radiusAxis':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRadiusAxisRange"])(state, axisId);
        default:
            return undefined;
    }
};
var selectAxisRangeWithReverse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    selectAxisRange
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisRangeWithReverse"]);
var selectAxisScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    selectRealScaleType,
    selectAxisDomainIncludingNiceTicks,
    selectAxisRangeWithReverse
], combineScaleFunction);
var selectErrorBarsSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectCartesianItemsSettings,
    selectAllErrorBarSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineRelevantErrorBarSettings);
function compareIds(a, b) {
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }
    return 0;
}
var pickAxisOrientation = (_state, orientation)=>orientation;
var pickMirror = (_state, _orientation, mirror)=>mirror;
var selectAllXAxesWithOffsetType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllXAxes"], pickAxisOrientation, pickMirror, (allAxes, orientation, mirror)=>allAxes.filter((axis)=>axis.orientation === orientation).filter((axis)=>axis.mirror === mirror).sort(compareIds));
var selectAllYAxesWithOffsetType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllYAxes"], pickAxisOrientation, pickMirror, (allAxes, orientation, mirror)=>allAxes.filter((axis)=>axis.orientation === orientation).filter((axis)=>axis.mirror === mirror).sort(compareIds));
var getXAxisSize = (offset, axisSettings)=>{
    return {
        width: offset.width,
        height: axisSettings.height
    };
};
var getYAxisSize = (offset, axisSettings)=>{
    var width = typeof axisSettings.width === 'number' ? axisSettings.width : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_Y_AXIS_WIDTH"];
    return {
        width,
        height: offset.height
    };
};
var selectXAxisSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"], selectXAxisSettings, getXAxisSize);
var combineXAxisPositionStartingPoint = (offset, orientation, chartHeight)=>{
    switch(orientation){
        case 'top':
            return offset.top;
        case 'bottom':
            return chartHeight - offset.bottom;
        default:
            return 0;
    }
};
var combineYAxisPositionStartingPoint = (offset, orientation, chartWidth)=>{
    switch(orientation){
        case 'left':
            return offset.left;
        case 'right':
            return chartWidth - offset.right;
        default:
            return 0;
    }
};
var selectAllXAxesOffsetSteps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"], selectAllXAxesWithOffsetType, pickAxisOrientation, pickMirror, (chartHeight, offset, allAxesWithSameOffsetType, orientation, mirror)=>{
    var steps = {};
    var position;
    allAxesWithSameOffsetType.forEach((axis)=>{
        var axisSize = getXAxisSize(offset, axis);
        if (position == null) {
            position = combineXAxisPositionStartingPoint(offset, orientation, chartHeight);
        }
        var needSpace = orientation === 'top' && !mirror || orientation === 'bottom' && mirror;
        steps[axis.id] = position - Number(needSpace) * axisSize.height;
        position += (needSpace ? -1 : 1) * axisSize.height;
    });
    return steps;
});
var selectAllYAxesOffsetSteps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"], selectAllYAxesWithOffsetType, pickAxisOrientation, pickMirror, (chartWidth, offset, allAxesWithSameOffsetType, orientation, mirror)=>{
    var steps = {};
    var position;
    allAxesWithSameOffsetType.forEach((axis)=>{
        var axisSize = getYAxisSize(offset, axis);
        if (position == null) {
            position = combineYAxisPositionStartingPoint(offset, orientation, chartWidth);
        }
        var needSpace = orientation === 'left' && !mirror || orientation === 'right' && mirror;
        steps[axis.id] = position - Number(needSpace) * axisSize.width;
        position += (needSpace ? -1 : 1) * axisSize.width;
    });
    return steps;
});
var selectXAxisOffsetSteps = (state, axisId)=>{
    var axisSettings = selectXAxisSettings(state, axisId);
    if (axisSettings == null) {
        return undefined;
    }
    return selectAllXAxesOffsetSteps(state, axisSettings.orientation, axisSettings.mirror);
};
var selectXAxisPosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    selectXAxisSettings,
    selectXAxisOffsetSteps,
    (_, axisId)=>axisId
], (offset, axisSettings, allSteps, axisId)=>{
    if (axisSettings == null) {
        return undefined;
    }
    var stepOfThisAxis = allSteps === null || allSteps === void 0 ? void 0 : allSteps[axisId];
    if (stepOfThisAxis == null) {
        return {
            x: offset.left,
            y: 0
        };
    }
    return {
        x: offset.left,
        y: stepOfThisAxis
    };
});
var selectYAxisOffsetSteps = (state, axisId)=>{
    var axisSettings = selectYAxisSettings(state, axisId);
    if (axisSettings == null) {
        return undefined;
    }
    return selectAllYAxesOffsetSteps(state, axisSettings.orientation, axisSettings.mirror);
};
var selectYAxisPosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    selectYAxisSettings,
    selectYAxisOffsetSteps,
    (_, axisId)=>axisId
], (offset, axisSettings, allSteps, axisId)=>{
    if (axisSettings == null) {
        return undefined;
    }
    var stepOfThisAxis = allSteps === null || allSteps === void 0 ? void 0 : allSteps[axisId];
    if (stepOfThisAxis == null) {
        return {
            x: 0,
            y: offset.top
        };
    }
    return {
        x: stepOfThisAxis,
        y: offset.top
    };
});
var selectYAxisSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"], selectYAxisSettings, (offset, axisSettings)=>{
    var width = typeof axisSettings.width === 'number' ? axisSettings.width : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_Y_AXIS_WIDTH"];
    return {
        width,
        height: offset.height
    };
});
var selectCartesianAxisSize = (state, axisType, axisId)=>{
    switch(axisType){
        case 'xAxis':
            {
                return selectXAxisSize(state, axisId).width;
            }
        case 'yAxis':
            {
                return selectYAxisSize(state, axisId).height;
            }
        default:
            {
                return undefined;
            }
    }
};
var combineDuplicateDomain = (chartLayout, appliedValues, axis, axisType)=>{
    if (axis == null) {
        return undefined;
    }
    var { allowDuplicatedCategory, type, dataKey } = axis;
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(chartLayout, axisType);
    var allData = appliedValues.map((av)=>av.value);
    if (dataKey && isCategorical && type === 'category' && allowDuplicatedCategory && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasDuplicate"])(allData)) {
        return allData;
    }
    return undefined;
};
var selectDuplicateDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectAllAppliedValues,
    selectBaseAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineDuplicateDomain);
var combineCategoricalDomain = (layout, appliedValues, axis, axisType)=>{
    if (axis == null || axis.dataKey == null) {
        return undefined;
    }
    var { type, scale } = axis;
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, axisType);
    if (isCategorical && (type === 'number' || scale !== 'auto')) {
        return appliedValues.map((d)=>d.value);
    }
    return undefined;
};
var selectCategoricalDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectAllAppliedValues,
    selectAxisSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineCategoricalDomain);
var selectAxisPropsNeededForCartesianGridTicksGenerator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectCartesianAxisSettings,
    selectRealScaleType,
    selectAxisScale,
    selectDuplicateDomain,
    selectCategoricalDomain,
    selectAxisRange,
    selectNiceTicks,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], (layout, axis, realScaleType, scale, duplicateDomain, categoricalDomain, axisRange, niceTicks, axisType)=>{
    if (axis == null) {
        return undefined;
    }
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, axisType);
    return {
        angle: axis.angle,
        interval: axis.interval,
        minTickGap: axis.minTickGap,
        orientation: axis.orientation,
        tick: axis.tick,
        tickCount: axis.tickCount,
        tickFormatter: axis.tickFormatter,
        ticks: axis.ticks,
        type: axis.type,
        unit: axis.unit,
        axisType,
        categoricalDomain,
        duplicateDomain,
        isCategorical,
        niceTicks,
        range: axisRange,
        realScaleType,
        scale
    };
});
var combineAxisTicks = (layout, axis, realScaleType, scale, niceTicks, axisRange, duplicateDomain, categoricalDomain, axisType)=>{
    if (axis == null || scale == null) {
        return undefined;
    }
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, axisType);
    var { type, ticks, tickCount } = axis;
    // This is testing for `scaleBand` but for band axis the type is reported as `band` so this looks like a dead code with a workaround elsewhere?
    var offsetForBand = realScaleType === 'scaleBand' && typeof scale.bandwidth === 'function' ? scale.bandwidth() / 2 : 2;
    var offset = type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0;
    offset = axisType === 'angleAxis' && axisRange != null && axisRange.length >= 2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(axisRange[0] - axisRange[1]) * 2 * offset : offset;
    // The ticks set by user should only affect the ticks adjacent to axis line
    var ticksOrNiceTicks = ticks || niceTicks;
    if (ticksOrNiceTicks) {
        var result = ticksOrNiceTicks.map((entry, index)=>{
            var scaleContent = duplicateDomain ? duplicateDomain.indexOf(entry) : entry;
            return {
                index,
                // If the scaleContent is not a number, the coordinate will be NaN.
                // That could be the case for example with a PointScale and a string as domain.
                coordinate: scale(scaleContent) + offset,
                value: entry,
                offset
            };
        });
        return result.filter((row)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(row.coordinate));
    }
    // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
    if (isCategorical && categoricalDomain) {
        return categoricalDomain.map((entry, index)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                index,
                offset
            })).filter((row)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(row.coordinate));
    }
    if (scale.ticks) {
        return scale.ticks(tickCount)// @ts-expect-error why does the offset go here? The type does not require it
        .map((entry)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                offset
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
var selectTicksOfAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectAxisSettings,
    selectRealScaleType,
    selectAxisScale,
    selectNiceTicks,
    selectAxisRange,
    selectDuplicateDomain,
    selectCategoricalDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineAxisTicks);
var combineGraphicalItemTicks = (layout, axis, scale, axisRange, duplicateDomain, categoricalDomain, axisType)=>{
    if (axis == null || scale == null || axisRange == null || axisRange[0] === axisRange[1]) {
        return undefined;
    }
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, axisType);
    var { tickCount } = axis;
    var offset = 0;
    offset = axisType === 'angleAxis' && (axisRange === null || axisRange === void 0 ? void 0 : axisRange.length) >= 2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(axisRange[0] - axisRange[1]) * 2 * offset : offset;
    // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
    if (isCategorical && categoricalDomain) {
        return categoricalDomain.map((entry, index)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                index,
                offset
            }));
    }
    if (scale.ticks) {
        return scale.ticks(tickCount)// @ts-expect-error why does the offset go here? The type does not require it
        .map((entry)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                offset
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
var selectTicksOfGraphicalItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectAxisSettings,
    selectAxisScale,
    selectAxisRange,
    selectDuplicateDomain,
    selectCategoricalDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], combineGraphicalItemTicks);
var selectAxisWithScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(selectBaseAxis, selectAxisScale, (axis, scale)=>{
    if (axis == null || scale == null) {
        return undefined;
    }
    return _objectSpread(_objectSpread({}, axis), {}, {
        scale
    });
});
var selectZAxisScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBaseAxis,
    selectRealScaleType,
    selectAxisDomain,
    selectAxisRangeWithReverse
], combineScaleFunction);
var selectZAxisWithScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])((state, _axisType, axisId)=>selectZAxisSettings(state, axisId), selectZAxisScale, (axis, scale)=>{
    if (axis == null || scale == null) {
        return undefined;
    }
    return _objectSpread(_objectSpread({}, axis), {}, {
        scale
    });
});
var selectChartDirection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllXAxes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectAllAxes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllYAxes"]
], (layout, allXAxes, allYAxes)=>{
    switch(layout){
        case 'horizontal':
            {
                return allXAxes.some((axis)=>axis.reversed) ? 'right-to-left' : 'left-to-right';
            }
        case 'vertical':
            {
                return allYAxes.some((axis)=>axis.reversed) ? 'bottom-to-top' : 'top-to-bottom';
            }
        // TODO: make this better. For now, right arrow triggers "forward", left arrow "back"
        // however, the tooltip moves an unintuitive direction because of how the indices are rendered
        case 'centric':
        case 'radial':
            {
                return 'left-to-right';
            }
        default:
            {
                return undefined;
            }
    }
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipEventType.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineTooltipEventType",
    ()=>combineTooltipEventType,
    "selectDefaultTooltipEventType",
    ()=>selectDefaultTooltipEventType,
    "selectTooltipEventType",
    ()=>selectTooltipEventType,
    "selectValidateTooltipEventTypes",
    ()=>selectValidateTooltipEventTypes,
    "useTooltipEventType",
    ()=>useTooltipEventType
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
;
var selectDefaultTooltipEventType = (state)=>state.options.defaultTooltipEventType;
var selectValidateTooltipEventTypes = (state)=>state.options.validateTooltipEventTypes;
function combineTooltipEventType(shared, defaultTooltipEventType, validateTooltipEventTypes) {
    if (shared == null) {
        return defaultTooltipEventType;
    }
    var eventType = shared ? 'axis' : 'item';
    if (validateTooltipEventTypes == null) {
        return defaultTooltipEventType;
    }
    return validateTooltipEventTypes.includes(eventType) ? eventType : defaultTooltipEventType;
}
function selectTooltipEventType(state, shared) {
    var defaultTooltipEventType = selectDefaultTooltipEventType(state);
    var validateTooltipEventTypes = selectValidateTooltipEventTypes(state);
    return combineTooltipEventType(shared, defaultTooltipEventType, validateTooltipEventTypes);
}
function useTooltipEventType(shared) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "useTooltipEventType.useAppSelector": (state)=>selectTooltipEventType(state, shared)
    }["useTooltipEventType.useAppSelector"]);
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveLabel.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineActiveLabel",
    ()=>combineActiveLabel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
var combineActiveLabel = (tooltipTicks, activeIndex)=>{
    var _tooltipTicks$n;
    var n = Number(activeIndex);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNan"])(n) || activeIndex == null) {
        return undefined;
    }
    return n >= 0 ? tooltipTicks === null || tooltipTicks === void 0 || (_tooltipTicks$n = tooltipTicks[n]) === null || _tooltipTicks$n === void 0 ? void 0 : _tooltipTicks$n.value : undefined;
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipSettings.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectTooltipSettings",
    ()=>selectTooltipSettings
]);
var selectTooltipSettings = (state)=>state.tooltip.settings;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipInteractionState.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineTooltipInteractionState",
    ()=>combineTooltipInteractionState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)");
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
function chooseAppropriateMouseInteraction(tooltipState, tooltipEventType, trigger) {
    if (tooltipEventType === 'axis') {
        if (trigger === 'click') {
            return tooltipState.axisInteraction.click;
        }
        return tooltipState.axisInteraction.hover;
    }
    if (trigger === 'click') {
        return tooltipState.itemInteraction.click;
    }
    return tooltipState.itemInteraction.hover;
}
function hasBeenActivePreviously(tooltipInteractionState) {
    return tooltipInteractionState.index != null;
}
var combineTooltipInteractionState = (tooltipState, tooltipEventType, trigger, defaultIndex)=>{
    if (tooltipEventType == null) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["noInteraction"];
    }
    var appropriateMouseInteraction = chooseAppropriateMouseInteraction(tooltipState, tooltipEventType, trigger);
    if (appropriateMouseInteraction == null) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["noInteraction"];
    }
    if (appropriateMouseInteraction.active) {
        return appropriateMouseInteraction;
    }
    if (tooltipState.keyboardInteraction.active) {
        return tooltipState.keyboardInteraction;
    }
    if (tooltipState.syncInteraction.active && tooltipState.syncInteraction.index != null) {
        return tooltipState.syncInteraction;
    }
    var activeFromProps = tooltipState.settings.active === true;
    if (hasBeenActivePreviously(appropriateMouseInteraction)) {
        if (activeFromProps) {
            return _objectSpread(_objectSpread({}, appropriateMouseInteraction), {}, {
                active: true
            });
        }
    } else if (defaultIndex != null) {
        return {
            active: true,
            coordinate: undefined,
            dataKey: undefined,
            index: defaultIndex
        };
    }
    return _objectSpread(_objectSpread({}, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["noInteraction"]), {}, {
        coordinate: appropriateMouseInteraction.coordinate
    });
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveTooltipIndex.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineActiveTooltipIndex",
    ()=>combineActiveTooltipIndex
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)");
;
var combineActiveTooltipIndex = (tooltipInteraction, chartData)=>{
    var desiredIndex = tooltipInteraction === null || tooltipInteraction === void 0 ? void 0 : tooltipInteraction.index;
    if (desiredIndex == null) {
        return null;
    }
    var indexAsNumber = Number(desiredIndex);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(indexAsNumber)) {
        // this is for charts like Sankey and Treemap that do not support numerical indexes. We need a proper solution for this before we can start supporting keyboard events on these charts.
        return desiredIndex;
    }
    /*
   * Zero is a trivial limit for single-dimensional charts like Line and Area,
   * but this also needs a support for multidimensional charts like Sankey and Treemap! TODO
   */ var lowerLimit = 0;
    var upperLimit = +Infinity;
    if (chartData.length > 0) {
        upperLimit = chartData.length - 1;
    }
    // now let's clamp the desiredIndex between the limits
    return String(Math.max(lowerLimit, Math.min(indexAsNumber, upperLimit)));
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineCoordinateForDefaultIndex.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineCoordinateForDefaultIndex",
    ()=>combineCoordinateForDefaultIndex
]);
var combineCoordinateForDefaultIndex = (width, height, layout, offset, tooltipTicks, defaultIndex, tooltipConfigurations, tooltipPayloadSearcher)=>{
    if (defaultIndex == null || tooltipPayloadSearcher == null) {
        return undefined;
    }
    // With defaultIndex alone, we don't have enough information to decide _which_ of the multiple tooltips to display. So we choose the first one.
    var firstConfiguration = tooltipConfigurations[0];
    // @ts-expect-error we need to rethink the tooltipPayloadSearcher type
    var maybePosition = firstConfiguration == null ? undefined : tooltipPayloadSearcher(firstConfiguration.positions, defaultIndex);
    if (maybePosition != null) {
        return maybePosition;
    }
    var tick = tooltipTicks === null || tooltipTicks === void 0 ? void 0 : tooltipTicks[Number(defaultIndex)];
    if (!tick) {
        return undefined;
    }
    switch(layout){
        case 'horizontal':
            {
                return {
                    x: tick.coordinate,
                    y: (offset.top + height) / 2
                };
            }
        default:
            {
                // This logic is not super sound - it conflates vertical, radial, centric layouts into just one. TODO improve!
                return {
                    x: (offset.left + width) / 2,
                    y: tick.coordinate
                };
            }
    }
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipPayloadConfigurations.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineTooltipPayloadConfigurations",
    ()=>combineTooltipPayloadConfigurations
]);
var combineTooltipPayloadConfigurations = (tooltipState, tooltipEventType, trigger, defaultIndex)=>{
    // if tooltip reacts to axis interaction, then we display all items at the same time.
    if (tooltipEventType === 'axis') {
        return tooltipState.tooltipItemPayloads;
    }
    /*
   * By now we already know that tooltipEventType is 'item', so we can only search in itemInteractions.
   * item means that only the hovered or clicked item will be present in the tooltip.
   */ if (tooltipState.tooltipItemPayloads.length === 0) {
        // No point filtering if the payload is empty
        return [];
    }
    var filterByDataKey;
    if (trigger === 'hover') {
        filterByDataKey = tooltipState.itemInteraction.hover.dataKey;
    } else {
        filterByDataKey = tooltipState.itemInteraction.click.dataKey;
    }
    if (filterByDataKey == null && defaultIndex != null) {
        /*
     * So when we use `defaultIndex` - we don't have a dataKey to filter by because user did not hover over anything yet.
     * In that case let's display the first item in the tooltip; after all, this is `item` interaction case,
     * so we should display only one item at a time instead of all.
     */ return [
            tooltipState.tooltipItemPayloads[0]
        ];
    }
    return tooltipState.tooltipItemPayloads.filter((tpc)=>{
        var _tpc$settings;
        return ((_tpc$settings = tpc.settings) === null || _tpc$settings === void 0 ? void 0 : _tpc$settings.dataKey) === filterByDataKey;
    });
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipPayloadSearcher.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectTooltipPayloadSearcher",
    ()=>selectTooltipPayloadSearcher
]);
var selectTooltipPayloadSearcher = (state)=>state.options.tooltipPayloadSearcher;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipState.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectTooltipState",
    ()=>selectTooltipState
]);
var selectTooltipState = (state)=>state.tooltip;
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipPayload.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineTooltipPayload",
    ()=>combineTooltipPayload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
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
function selectFinalData(dataDefinedOnItem, dataDefinedOnChart) {
    /*
   * If a payload has data specified directly from the graphical item, prefer that.
   * Otherwise, fill in data from the chart level, using the same index.
   */ if (dataDefinedOnItem != null) {
        return dataDefinedOnItem;
    }
    return dataDefinedOnChart;
}
var combineTooltipPayload = (tooltipPayloadConfigurations, activeIndex, chartDataState, tooltipAxisDataKey, activeLabel, tooltipPayloadSearcher, tooltipEventType)=>{
    if (activeIndex == null || tooltipPayloadSearcher == null) {
        return undefined;
    }
    var { chartData, computedData, dataStartIndex, dataEndIndex } = chartDataState;
    var init = [];
    return tooltipPayloadConfigurations.reduce((agg, _ref)=>{
        var _settings$dataKey;
        var { dataDefinedOnItem, settings } = _ref;
        var finalData = selectFinalData(dataDefinedOnItem, chartData);
        var sliced = Array.isArray(finalData) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getSliced$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSliced"])(finalData, dataStartIndex, dataEndIndex) : finalData;
        var finalDataKey = (_settings$dataKey = settings === null || settings === void 0 ? void 0 : settings.dataKey) !== null && _settings$dataKey !== void 0 ? _settings$dataKey : tooltipAxisDataKey;
        // BaseAxisProps does not support nameKey but it could!
        var finalNameKey = settings === null || settings === void 0 ? void 0 : settings.nameKey; // ?? tooltipAxis?.nameKey;
        var tooltipPayload;
        if (tooltipAxisDataKey && Array.isArray(sliced) && /*
     * findEntryInArray won't work for Scatter because Scatter provides an array of arrays
     * as tooltip payloads and findEntryInArray is not prepared to handle that.
     * Sad but also ScatterChart only allows 'item' tooltipEventType
     * and also this is only a problem if there are multiple Scatters and each has its own data array
     * so let's fix that some other time.
     */ !Array.isArray(sliced[0]) && /*
     * If the tooltipEventType is 'axis', we should search for the dataKey in the sliced data
     * because thanks to allowDuplicatedCategory=false, the order of elements in the array
     * no longer matches the order of elements in the original data
     * and so we need to search by the active dataKey + label rather than by index.
     *
     * The same happens if multiple graphical items are present in the chart
     * and each of them has its own data array. Those arrays get concatenated
     * and again the tooltip index no longer matches the original data.
     *
     * On the other hand the tooltipEventType 'item' should always search by index
     * because we get the index from interacting over the individual elements
     * which is always accurate, irrespective of the allowDuplicatedCategory setting.
     */ tooltipEventType === 'axis') {
            tooltipPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findEntryInArray"])(sliced, tooltipAxisDataKey, activeLabel);
        } else {
            /*
       * This is a problem because it assumes that the index is pointing to the displayed data
       * which it isn't because the index is pointing to the tooltip ticks array.
       * The above approach (with findEntryInArray) is the correct one, but it only works
       * if the axis dataKey is defined explicitly, and if the data is an array of objects.
       */ tooltipPayload = tooltipPayloadSearcher(sliced, activeIndex, computedData, finalNameKey);
        }
        if (Array.isArray(tooltipPayload)) {
            tooltipPayload.forEach((item)=>{
                var newSettings = _objectSpread(_objectSpread({}, settings), {}, {
                    name: item.name,
                    unit: item.unit,
                    // color and fill are erased to keep 100% the identical behaviour to recharts 2.x - but there's nothing stopping us from returning them here. It's technically a breaking change.
                    color: undefined,
                    // color and fill are erased to keep 100% the identical behaviour to recharts 2.x - but there's nothing stopping us from returning them here. It's technically a breaking change.
                    fill: undefined
                });
                agg.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipEntry"])({
                    tooltipEntrySettings: newSettings,
                    dataKey: item.dataKey,
                    payload: item.payload,
                    // @ts-expect-error getValueByDataKey does not validate the output type
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(item.payload, item.dataKey),
                    name: item.name
                }));
            });
        } else {
            var _getValueByDataKey;
            // I am not quite sure why these two branches (Array vs Array of Arrays) have to behave differently - I imagine we should unify these. 3.x breaking change?
            agg.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipEntry"])({
                tooltipEntrySettings: settings,
                dataKey: finalDataKey,
                payload: tooltipPayload,
                // @ts-expect-error getValueByDataKey does not validate the output type
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(tooltipPayload, finalDataKey),
                // @ts-expect-error getValueByDataKey does not validate the output type
                name: (_getValueByDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(tooltipPayload, finalNameKey)) !== null && _getValueByDataKey !== void 0 ? _getValueByDataKey : settings === null || settings === void 0 ? void 0 : settings.name
            }));
        }
        return agg;
    }, init);
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectActiveLabel",
    ()=>selectActiveLabel,
    "selectActiveTooltipCoordinate",
    ()=>selectActiveTooltipCoordinate,
    "selectActiveTooltipDataKey",
    ()=>selectActiveTooltipDataKey,
    "selectActiveTooltipDataPoints",
    ()=>selectActiveTooltipDataPoints,
    "selectActiveTooltipIndex",
    ()=>selectActiveTooltipIndex,
    "selectActiveTooltipPayload",
    ()=>selectActiveTooltipPayload,
    "selectAllGraphicalItemsSettings",
    ()=>selectAllGraphicalItemsSettings,
    "selectAllUnfilteredGraphicalItems",
    ()=>selectAllUnfilteredGraphicalItems,
    "selectIsTooltipActive",
    ()=>selectIsTooltipActive,
    "selectTooltipAxisDomain",
    ()=>selectTooltipAxisDomain,
    "selectTooltipAxisDomainIncludingNiceTicks",
    ()=>selectTooltipAxisDomainIncludingNiceTicks,
    "selectTooltipAxisRangeWithReverse",
    ()=>selectTooltipAxisRangeWithReverse,
    "selectTooltipAxisRealScaleType",
    ()=>selectTooltipAxisRealScaleType,
    "selectTooltipAxisScale",
    ()=>selectTooltipAxisScale,
    "selectTooltipAxisTicks",
    ()=>selectTooltipAxisTicks,
    "selectTooltipCategoricalDomain",
    ()=>selectTooltipCategoricalDomain,
    "selectTooltipDisplayedData",
    ()=>selectTooltipDisplayedData,
    "selectTooltipGraphicalItemsData",
    ()=>selectTooltipGraphicalItemsData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineAxisRangeWithReverse.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipEventType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveLabel.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipSettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipSettings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipInteractionState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipInteractionState.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveTooltipIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveTooltipIndex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineCoordinateForDefaultIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineCoordinateForDefaultIndex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayloadConfigurations$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipPayloadConfigurations.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipPayloadSearcher.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipState.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipPayload.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineDisplayedStackedData$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineDisplayedStackedData.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/types/StackedGraphicalItem.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isDomainSpecifiedByUser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$numberDomainEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/numberDomainEqualityCheck.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/arrayEqualityCheck.js [app-client] (ecmascript)");
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
var selectTooltipAxisRealScaleType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectHasBar"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartName"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineRealScaleType"]);
var selectAllUnfilteredGraphicalItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    (state)=>state.graphicalItems.cartesianItems,
    (state)=>state.graphicalItems.polarItems
], (cartesianItems, polarItems)=>[
        ...cartesianItems,
        ...polarItems
    ]);
var selectTooltipAxisPredicate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisId"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["itemAxisPredicate"]);
var selectAllGraphicalItemsSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllUnfilteredGraphicalItems,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisPredicate
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineGraphicalItemsSettings"], {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyArraysAreEqualCheck"]
    }
});
var selectAllStackedGraphicalItemsSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllGraphicalItemsSettings
], (graphicalItems)=>graphicalItems.filter(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isStacked"]));
var selectTooltipGraphicalItemsData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllGraphicalItemsSettings
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineGraphicalItemsData"], {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$arrayEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyArraysAreEqualCheck"]
    }
});
var selectTooltipDisplayedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipGraphicalItemsData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexes"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDisplayedData"]);
var selectTooltipStackedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllStackedGraphicalItemsSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineDisplayedStackedData$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDisplayedStackedData"]);
var selectAllTooltipAppliedValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipDisplayedData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectAllGraphicalItemsSettings
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAppliedValues"]);
var selectTooltipAxisDomainDefinition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDomainDefinition"]);
var selectTooltipDataOverflow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"]
], (axisSettings)=>axisSettings.allowDataOverflow);
var selectTooltipDomainFromUserPreferences = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipAxisDomainDefinition,
    selectTooltipDataOverflow
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isDomainSpecifiedByUser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numericalDomainSpecifiedWithoutRequiringData"]);
var selectAllStackedGraphicalItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllGraphicalItemsSettings
], (graphicalItems)=>graphicalItems.filter(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isStacked"]));
var selectTooltipStackGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipStackedData,
    selectAllStackedGraphicalItems,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackOffsetType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineStackGroups"]);
var selectTooltipDomainOfStackGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipStackGroups,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    selectTooltipDomainFromUserPreferences
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDomainOfStackGroups"]);
var selectTooltipItemsSettingsExceptStacked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllGraphicalItemsSettings
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterGraphicalNotStackedItems"]);
var selectDomainOfAllAppliedNumericalValuesIncludingErrorValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipDisplayedData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipItemsSettingsExceptStacked,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllErrorBarSettings"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDomainOfAllAppliedNumericalValuesIncludingErrorValues"], {
    memoizeOptions: {
        resultEqualityCheck: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$numberDomainEqualityCheck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["numberDomainEqualityCheck"]
    }
});
var selectReferenceDotsByTooltipAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectReferenceDots"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisId"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterReferenceElements"]);
var selectTooltipReferenceDotsDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceDotsByTooltipAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDotsDomain"]);
var selectReferenceAreasByTooltipAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectReferenceAreas"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisId"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterReferenceElements"]);
var selectTooltipReferenceAreasDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceAreasByTooltipAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAreasDomain"]);
var selectReferenceLinesByTooltipAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectReferenceLines"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisId"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterReferenceElements"]);
var selectTooltipReferenceLinesDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectReferenceLinesByTooltipAxis,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineLinesDomain"]);
var selectTooltipReferenceElementsDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipReferenceDotsDomain,
    selectTooltipReferenceLinesDomain,
    selectTooltipReferenceAreasDomain
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeDomains"]);
var selectTooltipNumericalDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisDomainDefinition,
    selectTooltipDomainFromUserPreferences,
    selectTooltipDomainOfStackGroups,
    selectDomainOfAllAppliedNumericalValuesIncludingErrorValues,
    selectTooltipReferenceElementsDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineNumericalDomain"]);
var selectTooltipAxisDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectTooltipDisplayedData,
    selectAllTooltipAppliedValues,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackOffsetType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    selectTooltipNumericalDomain
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisDomain"]);
var selectTooltipNiceTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipAxisDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisRealScaleType
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineNiceTicks"]);
var selectTooltipAxisDomainIncludingNiceTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisDomain,
    selectTooltipNiceTicks,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisDomainWithNiceTicks"]);
var selectTooltipAxisRange = (state)=>{
    var axisType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"])(state);
    var axisId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisId"])(state);
    var isPanorama = false; // Tooltip never displays in panorama so this is safe to assume
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisRange"])(state, axisType, axisId, isPanorama);
};
var selectTooltipAxisRangeWithReverse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisRange
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineAxisRangeWithReverse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisRangeWithReverse"]);
var selectTooltipAxisScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisRealScaleType,
    selectTooltipAxisDomainIncludingNiceTicks,
    selectTooltipAxisRangeWithReverse
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineScaleFunction"]);
var selectTooltipDuplicateDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectAllTooltipAppliedValues,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDuplicateDomain"]);
var selectTooltipCategoricalDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectAllTooltipAppliedValues,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCategoricalDomain"]);
var combineTicksOfTooltipAxis = (layout, axis, realScaleType, scale, range, duplicateDomain, categoricalDomain, axisType)=>{
    if (!axis) {
        return undefined;
    }
    var { type } = axis;
    var isCategorical = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, axisType);
    if (!scale) {
        return undefined;
    }
    var offsetForBand = realScaleType === 'scaleBand' && scale.bandwidth ? scale.bandwidth() / 2 : 2;
    var offset = type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0;
    offset = axisType === 'angleAxis' && range != null && (range === null || range === void 0 ? void 0 : range.length) >= 2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mathSign"])(range[0] - range[1]) * 2 * offset : offset;
    // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
    if (isCategorical && categoricalDomain) {
        return categoricalDomain.map((entry, index)=>({
                coordinate: scale(entry) + offset,
                value: entry,
                index,
                offset
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
var selectTooltipAxisTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxis"],
    selectTooltipAxisRealScaleType,
    selectTooltipAxisScale,
    selectTooltipAxisRange,
    selectTooltipDuplicateDomain,
    selectTooltipCategoricalDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"]
], combineTicksOfTooltipAxis);
var selectTooltipEventType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectDefaultTooltipEventType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectValidateTooltipEventTypes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipSettings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipSettings"]
], (defaultTooltipEventType, validateTooltipEventType, settings)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipEventType"])(settings.shared, defaultTooltipEventType, validateTooltipEventType));
var selectTooltipTrigger = (state)=>state.tooltip.settings.trigger;
var selectDefaultIndex = (state)=>state.tooltip.settings.defaultIndex;
var selectTooltipInteractionState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipState"],
    selectTooltipEventType,
    selectTooltipTrigger,
    selectDefaultIndex
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipInteractionState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipInteractionState"]);
var selectActiveTooltipIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState,
    selectTooltipDisplayedData
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveTooltipIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineActiveTooltipIndex"]);
var selectActiveLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipAxisTicks,
    selectActiveTooltipIndex
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineActiveLabel"]);
var selectActiveTooltipDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState
], (tooltipInteraction)=>{
    if (!tooltipInteraction) {
        return undefined;
    }
    return tooltipInteraction.dataKey;
});
var selectTooltipPayloadConfigurations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipState"],
    selectTooltipEventType,
    selectTooltipTrigger,
    selectDefaultIndex
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayloadConfigurations$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipPayloadConfigurations"]);
var selectTooltipCoordinateForDefaultIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    selectTooltipAxisTicks,
    selectDefaultIndex,
    selectTooltipPayloadConfigurations,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipPayloadSearcher"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineCoordinateForDefaultIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCoordinateForDefaultIndex"]);
var selectActiveTooltipCoordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState,
    selectTooltipCoordinateForDefaultIndex
], (tooltipInteractionState, defaultIndexCoordinate)=>{
    if (tooltipInteractionState !== null && tooltipInteractionState !== void 0 && tooltipInteractionState.coordinate) {
        return tooltipInteractionState.coordinate;
    }
    return defaultIndexCoordinate;
});
var selectIsTooltipActive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState
], (tooltipInteractionState)=>tooltipInteractionState.active);
var selectActiveTooltipPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipPayloadConfigurations,
    selectActiveTooltipIndex,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisDataKey"],
    selectActiveLabel,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipPayloadSearcher"],
    selectTooltipEventType
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipPayload"]);
var selectActiveTooltipDataPoints = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectActiveTooltipPayload
], (payload)=>{
    if (payload == null) {
        return undefined;
    }
    var dataPoints = payload.map((p)=>p.payload).filter((p)=>p != null);
    return Array.from(new Set(dataPoints));
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineActiveProps",
    ()=>combineActiveProps,
    "selectActiveCoordinate",
    ()=>selectActiveCoordinate,
    "selectActiveIndex",
    ()=>selectActiveIndex,
    "selectActiveLabel",
    ()=>selectActiveLabel,
    "selectCoordinateForDefaultIndex",
    ()=>selectCoordinateForDefaultIndex,
    "selectIsTooltipActive",
    ()=>selectIsTooltipActive,
    "selectOrderedTooltipTicks",
    ()=>selectOrderedTooltipTicks,
    "selectTooltipDataKey",
    ()=>selectTooltipDataKey,
    "selectTooltipInteractionState",
    ()=>selectTooltipInteractionState,
    "selectTooltipPayload",
    ()=>selectTooltipPayload,
    "selectTooltipPayloadConfigurations",
    ()=>selectTooltipPayloadConfigurations,
    "useChartName",
    ()=>useChartName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/es-toolkit/compat/sortBy.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveLabel.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipInteractionState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipInteractionState.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveTooltipIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveTooltipIndex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineCoordinateForDefaultIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineCoordinateForDefaultIndex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayloadConfigurations$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipPayloadConfigurations.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipPayloadSearcher.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipState.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineTooltipPayload.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getActiveCoordinate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getActiveCoordinate.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/PolarUtils.js [app-client] (ecmascript)");
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
var useChartName = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartName"]);
};
var pickTooltipEventType = (_state, tooltipEventType)=>tooltipEventType;
var pickTrigger = (_state, _tooltipEventType, trigger)=>trigger;
var pickDefaultIndex = (_state, _tooltipEventType, _trigger, defaultIndex)=>defaultIndex;
var selectOrderedTooltipTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"], (ticks)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$es$2d$toolkit$2f$compat$2f$sortBy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(ticks, (o)=>o.coordinate));
var selectTooltipInteractionState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipState"],
    pickTooltipEventType,
    pickTrigger,
    pickDefaultIndex
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipInteractionState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipInteractionState"]);
var selectActiveIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipDisplayedData"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveTooltipIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineActiveTooltipIndex"]);
var selectTooltipDataKey = (state, tooltipEventType, trigger)=>{
    if (tooltipEventType == null) {
        return undefined;
    }
    var tooltipState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipState"])(state);
    if (tooltipEventType === 'axis') {
        if (trigger === 'hover') {
            return tooltipState.axisInteraction.hover.dataKey;
        }
        return tooltipState.axisInteraction.click.dataKey;
    }
    if (trigger === 'hover') {
        return tooltipState.itemInteraction.hover.dataKey;
    }
    return tooltipState.itemInteraction.click.dataKey;
};
var selectTooltipPayloadConfigurations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipState"],
    pickTooltipEventType,
    pickTrigger,
    pickDefaultIndex
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayloadConfigurations$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipPayloadConfigurations"]);
var selectCoordinateForDefaultIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"],
    pickDefaultIndex,
    selectTooltipPayloadConfigurations,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipPayloadSearcher"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineCoordinateForDefaultIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCoordinateForDefaultIndex"]);
var selectActiveCoordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState,
    selectCoordinateForDefaultIndex
], (tooltipInteractionState, defaultIndexCoordinate)=>{
    var _tooltipInteractionSt;
    return (_tooltipInteractionSt = tooltipInteractionState.coordinate) !== null && _tooltipInteractionSt !== void 0 ? _tooltipInteractionSt : defaultIndexCoordinate;
});
var selectActiveLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"],
    selectActiveIndex
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineActiveLabel"]);
var selectTooltipPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipPayloadConfigurations,
    selectActiveIndex,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisDataKey"],
    selectActiveLabel,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipPayloadSearcher"],
    pickTooltipEventType
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineTooltipPayload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineTooltipPayload"]);
var selectIsTooltipActive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectTooltipInteractionState
], (tooltipInteractionState)=>{
    return {
        isActive: tooltipInteractionState.active,
        activeIndex: tooltipInteractionState.index
    };
});
var combineActiveCartesianProps = (chartEvent, layout, tooltipAxisType, tooltipAxisRange, tooltipTicks, orderedTooltipTicks, offset)=>{
    if (!chartEvent || !tooltipAxisType || !tooltipAxisRange || !tooltipTicks) {
        return undefined;
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getActiveCoordinate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isInCartesianRange"])(chartEvent, offset)) {
        return undefined;
    }
    var pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateCartesianTooltipPos"])(chartEvent, layout);
    var activeIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getActiveCoordinate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateActiveTickIndex"])(pos, orderedTooltipTicks, tooltipTicks, tooltipAxisType, tooltipAxisRange);
    var activeCoordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getActiveCoordinate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveCartesianCoordinate"])(layout, tooltipTicks, activeIndex, chartEvent);
    return {
        activeIndex: String(activeIndex),
        activeCoordinate
    };
};
var combineActivePolarProps = (chartEvent, layout, polarViewBox, tooltipAxisType, tooltipAxisRange, tooltipTicks, orderedTooltipTicks)=>{
    if (!chartEvent || !tooltipAxisType || !tooltipAxisRange || !tooltipTicks || !polarViewBox) {
        return undefined;
    }
    var rangeObj = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$PolarUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["inRangeOfSector"])(chartEvent, polarViewBox);
    if (!rangeObj) {
        return undefined;
    }
    var pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculatePolarTooltipPos"])(rangeObj, layout);
    var activeIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getActiveCoordinate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateActiveTickIndex"])(pos, orderedTooltipTicks, tooltipTicks, tooltipAxisType, tooltipAxisRange);
    var activeCoordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getActiveCoordinate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActivePolarCoordinate"])(layout, tooltipTicks, activeIndex, rangeObj);
    return {
        activeIndex: String(activeIndex),
        activeCoordinate
    };
};
var combineActiveProps = (chartEvent, layout, polarViewBox, tooltipAxisType, tooltipAxisRange, tooltipTicks, orderedTooltipTicks, offset)=>{
    if (!chartEvent || !layout || !tooltipAxisType || !tooltipAxisRange || !tooltipTicks) {
        return undefined;
    }
    if (layout === 'horizontal' || layout === 'vertical') {
        return combineActiveCartesianProps(chartEvent, layout, tooltipAxisType, tooltipAxisRange, tooltipTicks, orderedTooltipTicks, offset);
    }
    return combineActivePolarProps(chartEvent, layout, polarViewBox, tooltipAxisType, tooltipAxisRange, tooltipTicks, orderedTooltipTicks);
};
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectActivePropsFromChartPointer.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectActivePropsFromChartPointer",
    ()=>selectActivePropsFromChartPointer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/polarAxisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipAxisType.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
var pickChartPointer = (_state, chartPointer)=>chartPointer;
var selectActivePropsFromChartPointer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    pickChartPointer,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarAxisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectPolarViewBox"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisRangeWithReverse"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectOrderedTooltipTicks"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineActiveProps"]);
}),
"[project]/pwa/node_modules/recharts/es6/state/mouseEventsMiddleware.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mouseClickAction",
    ()=>mouseClickAction,
    "mouseClickMiddleware",
    ()=>mouseClickMiddleware,
    "mouseMoveAction",
    ()=>mouseMoveAction,
    "mouseMoveMiddleware",
    ()=>mouseMoveMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectActivePropsFromChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectActivePropsFromChartPointer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipEventType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getChartPointer.js [app-client] (ecmascript)");
;
;
;
;
;
var mouseClickAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAction"])('mouseClick');
var mouseClickMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createListenerMiddleware"])();
// TODO: there's a bug here when you click the chart the activeIndex resets to zero
mouseClickMiddleware.startListening({
    actionCreator: mouseClickAction,
    effect: (action, listenerApi)=>{
        var mousePointer = action.payload;
        var activeProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectActivePropsFromChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActivePropsFromChartPointer"])(listenerApi.getState(), (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChartPointer"])(mousePointer));
        if ((activeProps === null || activeProps === void 0 ? void 0 : activeProps.activeIndex) != null) {
            listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setMouseClickAxisIndex"])({
                activeIndex: activeProps.activeIndex,
                activeDataKey: undefined,
                activeCoordinate: activeProps.activeCoordinate
            }));
        }
    }
});
var mouseMoveAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAction"])('mouseMove');
var mouseMoveMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createListenerMiddleware"])();
mouseMoveMiddleware.startListening({
    actionCreator: mouseMoveAction,
    effect: (action, listenerApi)=>{
        var mousePointer = action.payload;
        var state = listenerApi.getState();
        var tooltipEventType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipEventType"])(state, state.tooltip.settings.shared);
        var activeProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectActivePropsFromChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActivePropsFromChartPointer"])(state, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChartPointer"])(mousePointer));
        // this functionality only applies to charts that have axes
        if (tooltipEventType === 'axis') {
            if ((activeProps === null || activeProps === void 0 ? void 0 : activeProps.activeIndex) != null) {
                listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setMouseOverAxisIndex"])({
                    activeIndex: activeProps.activeIndex,
                    activeDataKey: undefined,
                    activeCoordinate: activeProps.activeCoordinate
                }));
            } else {
                // this is needed to clear tooltip state when the mouse moves out of the inRange (svg - offset) function, but not yet out of the svg
                listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mouseLeaveChart"])());
            }
        }
    }
});
}),
"[project]/pwa/node_modules/recharts/es6/state/reduxDevtoolsJsonStringifyReplacer.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reduxDevtoolsJsonStringifyReplacer",
    ()=>reduxDevtoolsJsonStringifyReplacer
]);
function reduxDevtoolsJsonStringifyReplacer(_key, value) {
    if (value instanceof HTMLElement) {
        return "HTMLElement <".concat(value.tagName, " class=\"").concat(value.className, "\">");
    }
    if (value === window) {
        return 'global.window';
    }
    return value;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/cartesianAxisSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addXAxis",
    ()=>addXAxis,
    "addYAxis",
    ()=>addYAxis,
    "addZAxis",
    ()=>addZAxis,
    "cartesianAxisReducer",
    ()=>cartesianAxisReducer,
    "defaultAxisId",
    ()=>defaultAxisId,
    "removeXAxis",
    ()=>removeXAxis,
    "removeYAxis",
    ()=>removeYAxis,
    "removeZAxis",
    ()=>removeZAxis,
    "updateYAxisWidth",
    ()=>updateYAxisWidth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/immer/dist/immer.mjs [app-client] (ecmascript)");
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
var defaultAxisId = 0;
/**
 * Properties shared in X, Y, and Z axes
 */ /**
 * These are the external props, visible for users as they set them using our public API.
 * There is all sorts of internal computed things based on these, but they will come through selectors.
 *
 * Properties shared between X and Y axes
 */ /**
 * Z axis is special because it's never displayed. It controls the size of Scatter dots,
 * but it never displays ticks anywhere.
 */ var initialState = {
    xAxis: {},
    yAxis: {},
    zAxis: {}
};
/**
 * This is the slice where each individual Axis element pushes its own configuration.
 * Prefer to use this one instead of axisSlice.
 */ var cartesianAxisSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'cartesianAxis',
    initialState,
    reducers: {
        addXAxis: {
            reducer (state, action) {
                state.xAxis[action.payload.id] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload);
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removeXAxis: {
            reducer (state, action) {
                delete state.xAxis[action.payload.id];
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        addYAxis: {
            reducer (state, action) {
                state.yAxis[action.payload.id] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload);
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removeYAxis: {
            reducer (state, action) {
                delete state.yAxis[action.payload.id];
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        addZAxis: {
            reducer (state, action) {
                state.zAxis[action.payload.id] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload);
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removeZAxis: {
            reducer (state, action) {
                delete state.zAxis[action.payload.id];
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        updateYAxisWidth (state, action) {
            var { id, width } = action.payload;
            var axis = state.yAxis[id];
            if (axis) {
                var history = axis.widthHistory || [];
                // An oscillation is detected when the new width is the same as the width before the last one.
                // This is a simple A -> B -> A pattern. If the next width is B, and the difference is less than 1 pixel, we ignore it.
                if (history.length === 3 && history[0] === history[2] && width === history[1] && width !== axis.width && Math.abs(width - history[0]) <= 1) {
                    return;
                }
                var newHistory = [
                    ...history,
                    width
                ].slice(-3);
                state.yAxis[id] = _objectSpread(_objectSpread({}, state.yAxis[id]), {}, {
                    width,
                    widthHistory: newHistory
                });
            }
        }
    }
});
var { addXAxis, removeXAxis, addYAxis, removeYAxis, addZAxis, removeZAxis, updateYAxisWidth } = cartesianAxisSlice.actions;
var cartesianAxisReducer = cartesianAxisSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/graphicalItemsSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCartesianGraphicalItem",
    ()=>addCartesianGraphicalItem,
    "addPolarGraphicalItem",
    ()=>addPolarGraphicalItem,
    "graphicalItemsReducer",
    ()=>graphicalItemsReducer,
    "removeCartesianGraphicalItem",
    ()=>removeCartesianGraphicalItem,
    "removePolarGraphicalItem",
    ()=>removePolarGraphicalItem,
    "replaceCartesianGraphicalItem",
    ()=>replaceCartesianGraphicalItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/immer/dist/immer.mjs [app-client] (ecmascript)");
;
;
/**
 * Unique ID of the graphical item.
 * This is used to identify the graphical item in the state and in the React tree.
 * This is required for every graphical item - it's either provided by the user or generated automatically.
 */ var initialState = {
    cartesianItems: [],
    polarItems: []
};
var graphicalItemsSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'graphicalItems',
    initialState,
    reducers: {
        addCartesianGraphicalItem: {
            reducer (state, action) {
                state.cartesianItems.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        replaceCartesianGraphicalItem: {
            reducer (state, action) {
                var { prev, next } = action.payload;
                var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).cartesianItems.indexOf((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(prev));
                if (index > -1) {
                    state.cartesianItems[index] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(next);
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removeCartesianGraphicalItem: {
            reducer (state, action) {
                var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).cartesianItems.indexOf((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
                if (index > -1) {
                    state.cartesianItems.splice(index, 1);
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        addPolarGraphicalItem: {
            reducer (state, action) {
                state.polarItems.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removePolarGraphicalItem: {
            reducer (state, action) {
                var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).polarItems.indexOf((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
                if (index > -1) {
                    state.polarItems.splice(index, 1);
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        }
    }
});
var { addCartesianGraphicalItem, replaceCartesianGraphicalItem, removeCartesianGraphicalItem, addPolarGraphicalItem, removePolarGraphicalItem } = graphicalItemsSlice.actions;
var graphicalItemsReducer = graphicalItemsSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/referenceElementsSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addArea",
    ()=>addArea,
    "addDot",
    ()=>addDot,
    "addLine",
    ()=>addLine,
    "referenceElementsReducer",
    ()=>referenceElementsReducer,
    "referenceElementsSlice",
    ()=>referenceElementsSlice,
    "removeArea",
    ()=>removeArea,
    "removeDot",
    ()=>removeDot,
    "removeLine",
    ()=>removeLine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/immer/dist/immer.mjs [app-client] (ecmascript)");
;
var initialState = {
    dots: [],
    areas: [],
    lines: []
};
var referenceElementsSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'referenceElements',
    initialState,
    reducers: {
        addDot: (state, action)=>{
            state.dots.push(action.payload);
        },
        removeDot: (state, action)=>{
            var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).dots.findIndex((dot)=>dot === action.payload);
            if (index !== -1) {
                state.dots.splice(index, 1);
            }
        },
        addArea: (state, action)=>{
            state.areas.push(action.payload);
        },
        removeArea: (state, action)=>{
            var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).areas.findIndex((area)=>area === action.payload);
            if (index !== -1) {
                state.areas.splice(index, 1);
            }
        },
        addLine: (state, action)=>{
            state.lines.push(action.payload);
        },
        removeLine: (state, action)=>{
            var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).lines.findIndex((line)=>line === action.payload);
            if (index !== -1) {
                state.lines.splice(index, 1);
            }
        }
    }
});
var { addDot, removeDot, addArea, removeArea, addLine, removeLine } = referenceElementsSlice.actions;
var referenceElementsReducer = referenceElementsSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/brushSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "brushReducer",
    ()=>brushReducer,
    "brushSlice",
    ()=>brushSlice,
    "setBrushSettings",
    ()=>setBrushSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
;
/**
 * From all Brush properties, only height has a default value and will always be defined.
 * Other properties are nullable and will be computed from offsets and margins if they are not set.
 */ var initialState = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    }
};
var brushSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'brush',
    initialState,
    reducers: {
        setBrushSettings (_state, action) {
            if (action.payload == null) {
                return initialState;
            }
            return action.payload;
        }
    }
});
var { setBrushSettings } = brushSlice.actions;
var brushReducer = brushSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/legendSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addLegendPayload",
    ()=>addLegendPayload,
    "legendReducer",
    ()=>legendReducer,
    "removeLegendPayload",
    ()=>removeLegendPayload,
    "setLegendSettings",
    ()=>setLegendSettings,
    "setLegendSize",
    ()=>setLegendSize
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/immer/dist/immer.mjs [app-client] (ecmascript)");
;
;
/**
 * The properties inside this state update independently of each other and quite often.
 * When selecting, never select the whole state because you are going to get
 * unnecessary re-renders. Select only the properties you need.
 *
 * This is why this state type is not exported - don't use it directly.
 */ var initialState = {
    settings: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'middle',
        itemSorter: 'value'
    },
    size: {
        width: 0,
        height: 0
    },
    payload: []
};
var legendSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'legend',
    initialState,
    reducers: {
        setLegendSize (state, action) {
            state.size.width = action.payload.width;
            state.size.height = action.payload.height;
        },
        setLegendSettings (state, action) {
            state.settings.align = action.payload.align;
            state.settings.layout = action.payload.layout;
            state.settings.verticalAlign = action.payload.verticalAlign;
            state.settings.itemSorter = action.payload.itemSorter;
        },
        addLegendPayload: {
            reducer (state, action) {
                state.payload.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        removeLegendPayload: {
            reducer (state, action) {
                var index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["current"])(state).payload.indexOf((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload));
                if (index > -1) {
                    state.payload.splice(index, 1);
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        }
    }
});
var { setLegendSize, setLegendSettings, addLegendPayload, removeLegendPayload } = legendSlice.actions;
var legendReducer = legendSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/rootPropsSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "initialState",
    ()=>initialState,
    "rootPropsReducer",
    ()=>rootPropsReducer,
    "updateOptions",
    ()=>updateOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
;
var initialState = {
    accessibilityLayer: true,
    barCategoryGap: '10%',
    barGap: 4,
    barSize: undefined,
    className: undefined,
    maxBarSize: undefined,
    stackOffset: 'none',
    syncId: undefined,
    syncMethod: 'index',
    baseValue: undefined
};
var rootPropsSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'rootProps',
    initialState,
    reducers: {
        updateOptions: (state, action)=>{
            var _action$payload$barGa;
            state.accessibilityLayer = action.payload.accessibilityLayer;
            state.barCategoryGap = action.payload.barCategoryGap;
            state.barGap = (_action$payload$barGa = action.payload.barGap) !== null && _action$payload$barGa !== void 0 ? _action$payload$barGa : initialState.barGap;
            state.barSize = action.payload.barSize;
            state.maxBarSize = action.payload.maxBarSize;
            state.stackOffset = action.payload.stackOffset;
            state.syncId = action.payload.syncId;
            state.syncMethod = action.payload.syncMethod;
            state.className = action.payload.className;
            state.baseValue = action.payload.baseValue;
        }
    }
});
var rootPropsReducer = rootPropsSlice.reducer;
var { updateOptions } = rootPropsSlice.actions;
}),
"[project]/pwa/node_modules/recharts/es6/state/polarAxisSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addAngleAxis",
    ()=>addAngleAxis,
    "addRadiusAxis",
    ()=>addRadiusAxis,
    "polarAxisReducer",
    ()=>polarAxisReducer,
    "removeAngleAxis",
    ()=>removeAngleAxis,
    "removeRadiusAxis",
    ()=>removeRadiusAxis
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/immer/dist/immer.mjs [app-client] (ecmascript)");
;
;
var initialState = {
    radiusAxis: {},
    angleAxis: {}
};
var polarAxisSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'polarAxis',
    initialState,
    reducers: {
        addRadiusAxis (state, action) {
            state.radiusAxis[action.payload.id] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload);
        },
        removeRadiusAxis (state, action) {
            delete state.radiusAxis[action.payload.id];
        },
        addAngleAxis (state, action) {
            state.angleAxis[action.payload.id] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$immer$2f$dist$2f$immer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["castDraft"])(action.payload);
        },
        removeAngleAxis (state, action) {
            delete state.angleAxis[action.payload.id];
        }
    }
});
var { addRadiusAxis, removeRadiusAxis, addAngleAxis, removeAngleAxis } = polarAxisSlice.actions;
var polarAxisReducer = polarAxisSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/polarOptionsSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "polarOptionsReducer",
    ()=>polarOptionsReducer,
    "updatePolarOptions",
    ()=>updatePolarOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
;
var polarOptionsSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'polarOptions',
    initialState: null,
    reducers: {
        updatePolarOptions: (_state, action)=>{
            return action.payload;
        }
    }
});
var { updatePolarOptions } = polarOptionsSlice.actions;
var polarOptionsReducer = polarOptionsSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/keyboardEventsMiddleware.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "focusAction",
    ()=>focusAction,
    "keyDownAction",
    ()=>keyDownAction,
    "keyboardEventsMiddleware",
    ()=>keyboardEventsMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveTooltipIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/combiners/combineActiveTooltipIndex.js [app-client] (ecmascript)");
;
;
;
;
;
;
var keyDownAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAction"])('keyDown');
var focusAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAction"])('focus');
var keyboardEventsMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createListenerMiddleware"])();
keyboardEventsMiddleware.startListening({
    actionCreator: keyDownAction,
    effect: (action, listenerApi)=>{
        var state = listenerApi.getState();
        var accessibilityLayerIsActive = state.rootProps.accessibilityLayer !== false;
        if (!accessibilityLayerIsActive) {
            return;
        }
        var { keyboardInteraction } = state.tooltip;
        var key = action.payload;
        if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Enter') {
            return;
        }
        // TODO this is lacking index for charts that do not support numeric indexes
        var currentIndex = Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$combiners$2f$combineActiveTooltipIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineActiveTooltipIndex"])(keyboardInteraction, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipDisplayedData"])(state)));
        var tooltipTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipAxisTicks"])(state);
        if (key === 'Enter') {
            var _coordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectCoordinateForDefaultIndex"])(state, 'axis', 'hover', String(keyboardInteraction.index));
            listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setKeyboardInteraction"])({
                active: !keyboardInteraction.active,
                activeIndex: keyboardInteraction.index,
                activeDataKey: keyboardInteraction.dataKey,
                activeCoordinate: _coordinate
            }));
            return;
        }
        var direction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDirection"])(state);
        var directionMultiplier = direction === 'left-to-right' ? 1 : -1;
        var movement = key === 'ArrowRight' ? 1 : -1;
        var nextIndex = currentIndex + movement * directionMultiplier;
        if (tooltipTicks == null || nextIndex >= tooltipTicks.length || nextIndex < 0) {
            return;
        }
        var coordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectCoordinateForDefaultIndex"])(state, 'axis', 'hover', String(nextIndex));
        listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setKeyboardInteraction"])({
            active: true,
            activeIndex: nextIndex.toString(),
            activeDataKey: undefined,
            activeCoordinate: coordinate
        }));
    }
});
keyboardEventsMiddleware.startListening({
    actionCreator: focusAction,
    effect: (_action, listenerApi)=>{
        var state = listenerApi.getState();
        var accessibilityLayerIsActive = state.rootProps.accessibilityLayer !== false;
        if (!accessibilityLayerIsActive) {
            return;
        }
        var { keyboardInteraction } = state.tooltip;
        if (keyboardInteraction.active) {
            return;
        }
        if (keyboardInteraction.index == null) {
            var nextIndex = '0';
            var coordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectCoordinateForDefaultIndex"])(state, 'axis', 'hover', String(nextIndex));
            listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setKeyboardInteraction"])({
                activeDataKey: undefined,
                active: true,
                activeIndex: nextIndex,
                activeCoordinate: coordinate
            }));
        }
    }
});
}),
"[project]/pwa/node_modules/recharts/es6/state/externalEventsMiddleware.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "externalEventAction",
    ()=>externalEventAction,
    "externalEventsMiddleware",
    ()=>externalEventsMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/tooltipSelectors.js [app-client] (ecmascript)");
;
;
var externalEventAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAction"])('externalEvent');
var externalEventsMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createListenerMiddleware"])();
externalEventsMiddleware.startListening({
    actionCreator: externalEventAction,
    effect: (action, listenerApi)=>{
        if (action.payload.handler == null) {
            return;
        }
        var state = listenerApi.getState();
        var nextState = {
            activeCoordinate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipCoordinate"])(state),
            activeDataKey: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipDataKey"])(state),
            activeIndex: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"])(state),
            activeLabel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveLabel"])(state),
            activeTooltipIndex: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActiveTooltipIndex"])(state),
            isTooltipActive: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$tooltipSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectIsTooltipActive"])(state)
        };
        action.payload.handler(nextState, action.payload.reactEvent);
    }
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/touchSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectTooltipCoordinate",
    ()=>selectTooltipCoordinate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipPayloadSearcher.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipState.js [app-client] (ecmascript)");
;
;
;
var selectAllTooltipPayloadConfiguration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipState$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipState"]
], (tooltipState)=>tooltipState.tooltipItemPayloads);
var selectTooltipCoordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllTooltipPayloadConfiguration,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipPayloadSearcher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipPayloadSearcher"],
    (_state, tooltipIndex, _dataKey)=>tooltipIndex,
    (_state, _tooltipIndex, dataKey)=>dataKey
], (allTooltipConfigurations, tooltipPayloadSearcher, tooltipIndex, dataKey)=>{
    var mostRelevantTooltipConfiguration = allTooltipConfigurations.find((tooltipConfiguration)=>{
        return tooltipConfiguration.settings.dataKey === dataKey;
    });
    if (mostRelevantTooltipConfiguration == null) {
        return undefined;
    }
    var { positions } = mostRelevantTooltipConfiguration;
    if (positions == null) {
        return undefined;
    }
    // @ts-expect-error tooltipPayloadSearcher is not typed well
    var maybePosition = tooltipPayloadSearcher(positions, tooltipIndex);
    return maybePosition;
});
}),
"[project]/pwa/node_modules/recharts/es6/state/touchEventsMiddleware.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "touchEventAction",
    ()=>touchEventAction,
    "touchEventMiddleware",
    ()=>touchEventMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectActivePropsFromChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectActivePropsFromChartPointer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/getChartPointer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectTooltipEventType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$touchSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/touchSelectors.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
var touchEventAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAction"])('touchMove');
var touchEventMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createListenerMiddleware"])();
touchEventMiddleware.startListening({
    actionCreator: touchEventAction,
    effect: (action, listenerApi)=>{
        var touchEvent = action.payload;
        if (touchEvent.touches == null || touchEvent.touches.length === 0) {
            return;
        }
        var state = listenerApi.getState();
        var tooltipEventType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectTooltipEventType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipEventType"])(state, state.tooltip.settings.shared);
        if (tooltipEventType === 'axis') {
            var activeProps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectActivePropsFromChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectActivePropsFromChartPointer"])(state, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$getChartPointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChartPointer"])({
                clientX: touchEvent.touches[0].clientX,
                clientY: touchEvent.touches[0].clientY,
                currentTarget: touchEvent.currentTarget
            }));
            if ((activeProps === null || activeProps === void 0 ? void 0 : activeProps.activeIndex) != null) {
                listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setMouseOverAxisIndex"])({
                    activeIndex: activeProps.activeIndex,
                    activeDataKey: undefined,
                    activeCoordinate: activeProps.activeCoordinate
                }));
            }
        } else if (tooltipEventType === 'item') {
            var _target$getAttribute;
            var touch = touchEvent.touches[0];
            if (document.elementFromPoint == null) {
                return;
            }
            var target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!target || !target.getAttribute) {
                return;
            }
            var itemIndex = target.getAttribute(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DATA_ITEM_INDEX_ATTRIBUTE_NAME"]);
            var dataKey = (_target$getAttribute = target.getAttribute(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DATA_ITEM_DATAKEY_ATTRIBUTE_NAME"])) !== null && _target$getAttribute !== void 0 ? _target$getAttribute : undefined;
            var coordinate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$touchSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTooltipCoordinate"])(listenerApi.getState(), itemIndex, dataKey);
            listenerApi.dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveMouseOverItemIndex"])({
                activeDataKey: dataKey,
                activeIndex: itemIndex,
                activeCoordinate: coordinate
            }));
        }
    }
});
}),
"[project]/pwa/node_modules/recharts/es6/state/errorBarSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addErrorBar",
    ()=>addErrorBar,
    "errorBarReducer",
    ()=>errorBarReducer,
    "removeErrorBar",
    ()=>removeErrorBar,
    "replaceErrorBar",
    ()=>replaceErrorBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
;
/**
 * ErrorBars have lot more settings but all the others are scoped to the component itself.
 * Only some of them required to be reported to the global store because XAxis and YAxis need to know
 * if the error bar is contributing to extending the axis domain.
 */ var initialState = {};
var errorBarSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'errorBars',
    initialState,
    reducers: {
        addErrorBar: (state, action)=>{
            var { itemId, errorBar } = action.payload;
            if (!state[itemId]) {
                state[itemId] = [];
            }
            state[itemId].push(errorBar);
        },
        replaceErrorBar: (state, action)=>{
            var { itemId, prev, next } = action.payload;
            if (state[itemId]) {
                state[itemId] = state[itemId].map((e)=>e.dataKey === prev.dataKey && e.direction === prev.direction ? next : e);
            }
        },
        removeErrorBar: (state, action)=>{
            var { itemId, errorBar } = action.payload;
            if (state[itemId]) {
                state[itemId] = state[itemId].filter((e)=>e.dataKey !== errorBar.dataKey || e.direction !== errorBar.direction);
            }
        }
    }
});
var { addErrorBar, replaceErrorBar, removeErrorBar } = errorBarSlice.actions;
var errorBarReducer = errorBarSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/zIndexSlice.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "registerZIndexPortal",
    ()=>registerZIndexPortal,
    "registerZIndexPortalId",
    ()=>registerZIndexPortalId,
    "unregisterZIndexPortal",
    ()=>unregisterZIndexPortal,
    "unregisterZIndexPortalId",
    ()=>unregisterZIndexPortalId,
    "zIndexReducer",
    ()=>zIndexReducer
]);
/**
 * This slice contains a registry of z-index values for various components.
 * The state is a map from z-index numbers to a string ID.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/zIndex/DefaultZIndexes.js [app-client] (ecmascript)");
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
var seed = {};
var initialState = {
    zIndexMap: Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"]).reduce((acc, current)=>_objectSpread(_objectSpread({}, acc), {}, {
            [current]: {
                elementId: undefined,
                panoramaElementId: undefined,
                consumers: 0
            }
        }), seed)
};
var defaultZIndexSet = new Set(Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$zIndex$2f$DefaultZIndexes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultZIndexes"]));
function isDefaultZIndex(zIndex) {
    return defaultZIndexSet.has(zIndex);
}
var zIndexSlice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSlice"])({
    name: 'zIndex',
    initialState,
    reducers: {
        registerZIndexPortal: {
            reducer: (state, action)=>{
                var { zIndex } = action.payload;
                if (state.zIndexMap[zIndex]) {
                    state.zIndexMap[zIndex].consumers += 1;
                } else {
                    state.zIndexMap[zIndex] = {
                        consumers: 1,
                        elementId: undefined,
                        panoramaElementId: undefined
                    };
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        unregisterZIndexPortal: {
            reducer: (state, action)=>{
                var { zIndex } = action.payload;
                if (state.zIndexMap[zIndex]) {
                    state.zIndexMap[zIndex].consumers -= 1;
                    /*
           * Garbage collect unused z-index entries, except for default z-indexes.
           * Default z-indexes are always rendered, regardless of whether there are consumers or not.
           * And because of that, even if we delete this entry, the ZIndexPortal provider will still be rendered
           * and React is not going to re-create it, and it won't re-register the element ID.
           * So let's not delete default z-index entries.
           */ if (state.zIndexMap[zIndex].consumers <= 0 && !isDefaultZIndex(zIndex)) {
                        delete state.zIndexMap[zIndex];
                    }
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        registerZIndexPortalId: {
            reducer: (state, action)=>{
                var { zIndex, elementId, isPanorama } = action.payload;
                if (state.zIndexMap[zIndex]) {
                    if (isPanorama) {
                        state.zIndexMap[zIndex].panoramaElementId = elementId;
                    } else {
                        state.zIndexMap[zIndex].elementId = elementId;
                    }
                } else {
                    state.zIndexMap[zIndex] = {
                        consumers: 0,
                        elementId: isPanorama ? undefined : elementId,
                        panoramaElementId: isPanorama ? elementId : undefined
                    };
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        },
        unregisterZIndexPortalId: {
            reducer: (state, action)=>{
                var { zIndex } = action.payload;
                if (state.zIndexMap[zIndex]) {
                    if (action.payload.isPanorama) {
                        state.zIndexMap[zIndex].panoramaElementId = undefined;
                    } else {
                        state.zIndexMap[zIndex].elementId = undefined;
                    }
                }
            },
            prepare: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareAutoBatched"])()
        }
    }
});
var { registerZIndexPortal, unregisterZIndexPortal, registerZIndexPortalId, unregisterZIndexPortalId } = zIndexSlice.actions;
var zIndexReducer = zIndexSlice.reducer;
}),
"[project]/pwa/node_modules/recharts/es6/state/store.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createRechartsStore",
    ()=>createRechartsStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$redux$2f$dist$2f$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/redux/dist/redux.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/optionsSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/chartDataSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/layoutSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/mouseEventsMiddleware.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$reduxDevtoolsJsonStringifyReplacer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/reduxDevtoolsJsonStringifyReplacer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/cartesianAxisSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/graphicalItemsSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$referenceElementsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/referenceElementsSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$brushSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/brushSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/legendSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$rootPropsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/rootPropsSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$polarAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/polarAxisSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$polarOptionsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/polarOptionsSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$keyboardEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/keyboardEventsMiddleware.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/externalEventsMiddleware.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$touchEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/touchEventsMiddleware.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$errorBarSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/errorBarSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/Global.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/zIndexSlice.js [app-client] (ecmascript)");
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
var rootReducer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$redux$2f$dist$2f$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineReducers"])({
    brush: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$brushSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["brushReducer"],
    cartesianAxis: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$cartesianAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cartesianAxisReducer"],
    chartData: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$chartDataSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["chartDataReducer"],
    errorBars: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$errorBarSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["errorBarReducer"],
    graphicalItems: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["graphicalItemsReducer"],
    layout: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["chartLayoutReducer"],
    legend: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["legendReducer"],
    options: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$optionsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["optionsReducer"],
    polarAxis: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$polarAxisSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarAxisReducer"],
    polarOptions: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$polarOptionsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["polarOptionsReducer"],
    referenceElements: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$referenceElementsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["referenceElementsReducer"],
    rootProps: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$rootPropsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rootPropsReducer"],
    tooltip: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tooltipReducer"],
    zIndex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$zIndexSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["zIndexReducer"]
});
var createRechartsStore = function createRechartsStore(preloadedState) {
    var chartName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Chart';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["configureStore"])({
        reducer: rootReducer,
        // redux-toolkit v1 types are unhappy with the preloadedState type. Remove the `as any` when bumping to v2
        preloadedState: preloadedState,
        // @ts-expect-error redux-toolkit v1 types are unhappy with the middleware array. Remove this comment when bumping to v2
        middleware: (getDefaultMiddleware)=>getDefaultMiddleware({
                serializableCheck: false
            }).concat([
                __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mouseClickMiddleware"].middleware,
                __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$mouseEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mouseMoveMiddleware"].middleware,
                __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$keyboardEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyboardEventsMiddleware"].middleware,
                __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$externalEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["externalEventsMiddleware"].middleware,
                __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$touchEventsMiddleware$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["touchEventMiddleware"].middleware
            ]),
        /*
     * I can't find out how to satisfy typescript here.
     * We return `EnhancerArray<[StoreEnhancer<{}, {}>, StoreEnhancer]>` from this function,
     * but the types say we should return `EnhancerArray<StoreEnhancer<{}, {}>`.
     * Looks like it's badly inferred generics, but it won't allow me to provide the correct type manually either.
     * So let's just ignore the error for now.
     */ // @ts-expect-error mismatched generics
        enhancers: (getDefaultEnhancers)=>{
            var enhancers = getDefaultEnhancers;
            if (typeof getDefaultEnhancers === 'function') {
                /*
         * In RTK v2 this is always a function, but in v1 it is an array.
         * Because we have @types/redux-toolkit v1 as a dependency, typescript is going to flag this as an error.
         * We support both RTK v1 and v2, so we need to do this check.
         * https://redux-toolkit.js.org/usage/migrating-rtk-2#configurestoreenhancers-must-be-a-callback
         */ // @ts-expect-error RTK v2 behaviour on RTK v1 types
                enhancers = getDefaultEnhancers();
            }
            return enhancers.concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$reduxjs$2f$toolkit$2f$dist$2f$redux$2d$toolkit$2e$modern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["autoBatchEnhancer"])({
                type: 'raf'
            }));
        },
        devTools: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$Global$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Global"].devToolsEnabled && {
            serialize: {
                replacer: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$reduxDevtoolsJsonStringifyReplacer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reduxDevtoolsJsonStringifyReplacer"]
            },
            name: "recharts-".concat(chartName)
        }
    });
};
}),
"[project]/pwa/node_modules/recharts/es6/state/RechartsStoreProvider.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RechartsStoreProvider",
    ()=>RechartsStoreProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/react-redux/dist/react-redux.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/store.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsReduxContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/RechartsReduxContext.js [app-client] (ecmascript)");
;
;
;
;
;
;
function RechartsStoreProvider(_ref) {
    var { preloadedState, children, reduxStoreName } = _ref;
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    /*
   * Why the ref? Redux official documentation recommends to use store as a singleton,
   * and reuse that everywhere: https://redux-toolkit.js.org/api/configureStore#basic-example
   *
   * Which is correct! Except that is considering deploying Redux in an app.
   * Recharts as a library supports multiple charts on the same page.
   * And each of these charts needs its own store independent of others!
   *
   * The alternative is to have everything in the store keyed by the chart id.
   * Which would make working with everything a little bit more painful because we need the chart id everywhere.
   */ var storeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    /*
   * Panorama means that this chart is not its own chart, it's only a "preview"
   * being rendered as a child of Brush.
   * In such case, it should not have a store on its own - it should implicitly inherit
   * whatever data is in the "parent" or "root" chart.
   * Which here is represented by not having a Provider at all. All selectors will use the root store by default.
   */ if (isPanorama) {
        return children;
    }
    if (storeRef.current == null) {
        storeRef.current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createRechartsStore"])(preloadedState, reduxStoreName);
    }
    // @ts-expect-error React-Redux types demand that the context internal value is not null, but we have that as default.
    var nonNullContext = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$RechartsReduxContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RechartsReduxContext"];
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"], {
        context: nonNullContext,
        store: storeRef.current
    }, children);
}
}),
"[project]/pwa/node_modules/recharts/es6/state/ReportMainChartProps.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReportMainChartProps",
    ()=>ReportMainChartProps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/layoutSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
;
;
;
;
function ReportMainChartProps(_ref) {
    var { layout, margin } = _ref;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    /*
   * Skip dispatching properties in panorama chart for two reasons:
   * 1. The root chart should be deciding on these properties, and
   * 2. Brush reads these properties from redux store, and so they must remain stable
   *      to avoid circular dependency and infinite re-rendering.
   */ var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    /*
   * useEffect here is required to avoid the "Cannot update a component while rendering a different component" error.
   * https://github.com/facebook/react/issues/18178
   *
   * Reported in https://github.com/recharts/recharts/issues/5514
   */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReportMainChartProps.useEffect": ()=>{
            if (!isPanorama) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLayout"])(layout));
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$layoutSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setMargin"])(margin));
            }
        }
    }["ReportMainChartProps.useEffect"], [
        dispatch,
        isPanorama,
        layout,
        margin
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/ReportChartProps.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReportChartProps",
    ()=>ReportChartProps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$rootPropsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/rootPropsSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
;
;
;
function ReportChartProps(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReportChartProps.useEffect": ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$rootPropsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateOptions"])(props));
        }
    }["ReportChartProps.useEffect"], [
        dispatch,
        props
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffset.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectChartOffset",
    ()=>selectChartOffset
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
;
;
var selectChartOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"]
], (offsetInternal)=>{
    return {
        top: offsetInternal.top,
        bottom: offsetInternal.bottom,
        left: offsetInternal.left,
        right: offsetInternal.right
    };
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/selectPlotArea.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectPlotArea",
    ()=>selectPlotArea
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffset$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffset.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/containerSelectors.js [app-client] (ecmascript)");
;
;
;
var selectPlotArea = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffset$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffset"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartWidth"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$containerSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartHeight"]
], (offset, chartWidth, chartHeight)=>{
    if (!offset || chartWidth == null || chartHeight == null) {
        return undefined;
    }
    return {
        x: offset.left,
        y: offset.top,
        width: Math.max(0, chartWidth - offset.left - offset.right),
        height: Math.max(0, chartHeight - offset.top - offset.bottom)
    };
});
}),
"[project]/pwa/node_modules/recharts/es6/state/SetTooltipEntrySettings.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SetTooltipEntrySettings",
    ()=>SetTooltipEntrySettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/tooltipSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
;
;
;
;
function SetTooltipEntrySettings(_ref) {
    var { fn, args } = _ref;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetTooltipEntrySettings.useLayoutEffect": ()=>{
            if (isPanorama) {
                // Panorama graphical items should never contribute to Tooltip payload.
                return undefined;
            }
            var tooltipEntrySettings = fn(args);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addTooltipEntrySettings"])(tooltipEntrySettings));
            return ({
                "SetTooltipEntrySettings.useLayoutEffect": ()=>{
                    dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$tooltipSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeTooltipEntrySettings"])(tooltipEntrySettings));
                }
            })["SetTooltipEntrySettings.useLayoutEffect"];
        }
    }["SetTooltipEntrySettings.useLayoutEffect"], [
        fn,
        args,
        dispatch,
        isPanorama
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/lineSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectLinePoints",
    ()=>selectLinePoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/Line.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
;
;
;
;
;
;
var selectXAxisWithScale = (state, xAxisId, _yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'xAxis', xAxisId, isPanorama);
var selectXAxisTicks = (state, xAxisId, _yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisWithScale = (state, _xAxisId, yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'yAxis', yAxisId, isPanorama);
var selectYAxisTicks = (state, _xAxisId, yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'yAxis', yAxisId, isPanorama);
var selectBandSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectXAxisWithScale,
    selectYAxisWithScale,
    selectXAxisTicks,
    selectYAxisTicks
], (layout, xAxis, yAxis, xAxisTicks, yAxisTicks)=>{
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCategoricalAxis"])(layout, 'xAxis')) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBandSizeOfAxis"])(xAxis, xAxisTicks, false);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBandSizeOfAxis"])(yAxis, yAxisTicks, false);
});
var pickLineId = (_state, _xAxisId, _yAxisId, _isPanorama, id)=>id;
function isLineSettings(item) {
    return item.type === 'line';
}
/*
 * There is a race condition problem because we read some data from props and some from the state.
 * The state is updated through a dispatch and is one render behind,
 * and so we have this weird one tick render where the displayedData in one selector have the old dataKey
 * but the new dataKey in another selector.
 *
 * So here instead of reading the dataKey from the props, we always read it from the state.
 */ var selectSynchronisedLineSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectUnfilteredCartesianItems"],
    pickLineId
], (graphicalItems, id)=>graphicalItems.filter(isLineSettings).find((x)=>x.id === id));
var selectLinePoints = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectXAxisWithScale,
    selectYAxisWithScale,
    selectXAxisTicks,
    selectYAxisTicks,
    selectSynchronisedLineSettings,
    selectBandSize,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexesIfNotInPanorama"]
], (layout, xAxis, yAxis, xAxisTicks, yAxisTicks, lineSettings, bandSize, _ref)=>{
    var { chartData, dataStartIndex, dataEndIndex } = _ref;
    if (lineSettings == null || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || xAxisTicks.length === 0 || yAxisTicks.length === 0 || bandSize == null) {
        return undefined;
    }
    var { dataKey, data } = lineSettings;
    var displayedData;
    if (data != null && data.length > 0) {
        displayedData = data;
    } else {
        displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
    }
    if (displayedData == null) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["computeLinePoints"])({
        layout,
        xAxis,
        yAxis,
        xAxisTicks,
        yAxisTicks,
        dataKey,
        bandSize,
        displayedData
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/state/SetLegendPayload.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SetLegendPayload",
    ()=>SetLegendPayload,
    "SetPolarLegendPayload",
    ()=>SetPolarLegendPayload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/PanoramaContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/legendSlice.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
;
;
;
;
;
;
function SetLegendPayload(_ref) {
    var { legendPayload } = _ref;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var isPanorama = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$PanoramaContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsPanorama"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetLegendPayload.useLayoutEffect": ()=>{
            if (isPanorama) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["noop"];
            }
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addLegendPayload"])(legendPayload));
            return ({
                "SetLegendPayload.useLayoutEffect": ()=>{
                    dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeLegendPayload"])(legendPayload));
                }
            })["SetLegendPayload.useLayoutEffect"];
        }
    }["SetLegendPayload.useLayoutEffect"], [
        dispatch,
        isPanorama,
        legendPayload
    ]);
    return null;
}
function SetPolarLegendPayload(_ref2) {
    var { legendPayload } = _ref2;
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetPolarLegendPayload.useLayoutEffect": ()=>{
            if (layout !== 'centric' && layout !== 'radial') {
                return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["noop"];
            }
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addLegendPayload"])(legendPayload));
            return ({
                "SetPolarLegendPayload.useLayoutEffect": ()=>{
                    dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$legendSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeLegendPayload"])(legendPayload));
                }
            })["SetPolarLegendPayload.useLayoutEffect"];
        }
    }["SetPolarLegendPayload.useLayoutEffect"], [
        dispatch,
        layout,
        legendPayload
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/SetGraphicalItem.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SetCartesianGraphicalItem",
    ()=>SetCartesianGraphicalItem,
    "SetPolarGraphicalItem",
    ()=>SetPolarGraphicalItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/graphicalItemsSlice.js [app-client] (ecmascript)");
;
;
;
function SetCartesianGraphicalItem(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    var prevPropsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetCartesianGraphicalItem.useLayoutEffect": ()=>{
            if (prevPropsRef.current === null) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addCartesianGraphicalItem"])(props));
            } else if (prevPropsRef.current !== props) {
                dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["replaceCartesianGraphicalItem"])({
                    prev: prevPropsRef.current,
                    next: props
                }));
            }
            prevPropsRef.current = props;
        }
    }["SetCartesianGraphicalItem.useLayoutEffect"], [
        dispatch,
        props
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetCartesianGraphicalItem.useLayoutEffect": ()=>{
            return ({
                "SetCartesianGraphicalItem.useLayoutEffect": ()=>{
                    if (prevPropsRef.current) {
                        dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeCartesianGraphicalItem"])(prevPropsRef.current));
                        /*
         * Here we have to reset the ref to null because in StrictMode, the effect will run twice,
         * but it will keep the same ref value from the first render.
         *
         * In browser, React will clear the ref after the first effect cleanup,
         * so that wouldn't be an issue.
         *
         * In StrictMode, however, the ref is kept,
         * and in the hook above the code checks for `prevPropsRef.current === null`
         * which would be false so it would not dispatch the `addCartesianGraphicalItem` action again.
         *
         * https://github.com/recharts/recharts/issues/6022
         */ prevPropsRef.current = null;
                    }
                }
            })["SetCartesianGraphicalItem.useLayoutEffect"];
        }
    }["SetCartesianGraphicalItem.useLayoutEffect"], [
        dispatch
    ]);
    return null;
}
function SetPolarGraphicalItem(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SetPolarGraphicalItem.useLayoutEffect": ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addPolarGraphicalItem"])(props));
            return ({
                "SetPolarGraphicalItem.useLayoutEffect": ()=>{
                    dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$graphicalItemsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removePolarGraphicalItem"])(props));
                }
            })["SetPolarGraphicalItem.useLayoutEffect"];
        }
    }["SetPolarGraphicalItem.useLayoutEffect"], [
        dispatch,
        props
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/barSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combineAllBarPositions",
    ()=>combineAllBarPositions,
    "combineBarSizeList",
    ()=>combineBarSizeList,
    "combineStackedData",
    ()=>combineStackedData,
    "selectAllBarPositions",
    ()=>selectAllBarPositions,
    "selectAllVisibleBars",
    ()=>selectAllVisibleBars,
    "selectAxisBandSize",
    ()=>selectAxisBandSize,
    "selectBarBandSize",
    ()=>selectBarBandSize,
    "selectBarCartesianAxisSize",
    ()=>selectBarCartesianAxisSize,
    "selectBarPosition",
    ()=>selectBarPosition,
    "selectBarRectangles",
    ()=>selectBarRectangles,
    "selectBarSizeList",
    ()=>selectBarSizeList,
    "selectMaxBarSize",
    ()=>selectMaxBarSize
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/DataUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/Bar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/isWellBehavedNumber.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$stacks$2f$getStackSeriesIdentifier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/stacks/getStackSeriesIdentifier.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/types/StackedGraphicalItem.js [app-client] (ecmascript)");
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
var pickXAxisId = (_state, xAxisId)=>xAxisId;
var pickYAxisId = (_state, _xAxisId, yAxisId)=>yAxisId;
var pickIsPanorama = (_state, _xAxisId, _yAxisId, isPanorama)=>isPanorama;
var pickBarId = (_state, _xAxisId, _yAxisId, _isPanorama, id)=>id;
var selectSynchronisedBarSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectUnfilteredCartesianItems"],
    pickBarId
], (graphicalItems, id)=>graphicalItems.filter((item)=>item.type === 'bar').find((item)=>item.id === id));
var selectMaxBarSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectSynchronisedBarSettings
], (barSettings)=>barSettings === null || barSettings === void 0 ? void 0 : barSettings.maxBarSize);
var pickCells = (_state, _xAxisId, _yAxisId, _isPanorama, _id, cells)=>cells;
var getBarSize = (globalSize, totalSize, selfSize)=>{
    var barSize = selfSize !== null && selfSize !== void 0 ? selfSize : globalSize;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(barSize)) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(barSize, totalSize, 0);
};
var selectAllVisibleBars = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectUnfilteredCartesianItems"],
    pickXAxisId,
    pickYAxisId,
    pickIsPanorama
], (layout, allItems, xAxisId, yAxisId, isPanorama)=>allItems.filter((i)=>{
        if (layout === 'horizontal') {
            return i.xAxisId === xAxisId;
        }
        return i.yAxisId === yAxisId;
    }).filter((i)=>i.isPanorama === isPanorama).filter((i)=>i.hide === false).filter((i)=>i.type === 'bar'));
var selectBarStackGroups = (state, xAxisId, yAxisId, isPanorama)=>{
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"])(state);
    if (layout === 'horizontal') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackGroups"])(state, 'yAxis', yAxisId, isPanorama);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackGroups"])(state, 'xAxis', xAxisId, isPanorama);
};
var selectBarCartesianAxisSize = (state, xAxisId, yAxisId)=>{
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"])(state);
    if (layout === 'horizontal') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectCartesianAxisSize"])(state, 'xAxis', xAxisId);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectCartesianAxisSize"])(state, 'yAxis', yAxisId);
};
var combineBarSizeList = (allBars, globalSize, totalSize)=>{
    var initialValue = {};
    var stackedBars = allBars.filter(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$types$2f$StackedGraphicalItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isStacked"]);
    var unstackedBars = allBars.filter((b)=>b.stackId == null);
    var groupByStack = stackedBars.reduce((acc, bar)=>{
        if (!acc[bar.stackId]) {
            acc[bar.stackId] = [];
        }
        acc[bar.stackId].push(bar);
        return acc;
    }, initialValue);
    var stackedSizeList = Object.entries(groupByStack).map((_ref)=>{
        var [stackId, bars] = _ref;
        var dataKeys = bars.map((b)=>b.dataKey);
        var barSize = getBarSize(globalSize, totalSize, bars[0].barSize);
        return {
            stackId,
            dataKeys,
            barSize
        };
    });
    var unstackedSizeList = unstackedBars.map((b)=>{
        var dataKeys = [
            b.dataKey
        ].filter((dk)=>dk != null);
        var barSize = getBarSize(globalSize, totalSize, b.barSize);
        return {
            stackId: undefined,
            dataKeys,
            barSize
        };
    });
    return [
        ...stackedSizeList,
        ...unstackedSizeList
    ];
};
var selectBarSizeList = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllVisibleBars,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRootBarSize"],
    selectBarCartesianAxisSize
], combineBarSizeList);
var selectBarBandSize = (state, xAxisId, yAxisId, isPanorama, id)=>{
    var _ref2, _getBandSizeOfAxis;
    var barSettings = selectSynchronisedBarSettings(state, xAxisId, yAxisId, isPanorama, id);
    if (barSettings == null) {
        return undefined;
    }
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"])(state);
    var globalMaxBarSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRootMaxBarSize"])(state);
    var { maxBarSize: childMaxBarSize } = barSettings;
    var maxBarSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
    var axis, ticks;
    if (layout === 'horizontal') {
        axis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'xAxis', xAxisId, isPanorama);
        ticks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'xAxis', xAxisId, isPanorama);
    } else {
        axis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'yAxis', yAxisId, isPanorama);
        ticks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'yAxis', yAxisId, isPanorama);
    }
    return (_ref2 = (_getBandSizeOfAxis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBandSizeOfAxis"])(axis, ticks, true)) !== null && _getBandSizeOfAxis !== void 0 ? _getBandSizeOfAxis : maxBarSize) !== null && _ref2 !== void 0 ? _ref2 : 0;
};
var selectAxisBandSize = (state, xAxisId, yAxisId, isPanorama)=>{
    var layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"])(state);
    var axis, ticks;
    if (layout === 'horizontal') {
        axis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'xAxis', xAxisId, isPanorama);
        ticks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'xAxis', xAxisId, isPanorama);
    } else {
        axis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'yAxis', yAxisId, isPanorama);
        ticks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'yAxis', yAxisId, isPanorama);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBandSizeOfAxis"])(axis, ticks);
};
function getBarPositions(barGap, barCategoryGap, bandSize, sizeList, maxBarSize) {
    var len = sizeList.length;
    if (len < 1) {
        return undefined;
    }
    var realBarGap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(barGap, bandSize, 0, true);
    var result;
    var initialValue = [];
    // whether is barSize set by user
    // Okay but why does it check only for the first element? What if the first element is set but others are not?
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(sizeList[0].barSize)) {
        var useFull = false;
        var fullBarSize = bandSize / len;
        var sum = sizeList.reduce((res, entry)=>res + (entry.barSize || 0), 0);
        sum += (len - 1) * realBarGap;
        if (sum >= bandSize) {
            sum -= (len - 1) * realBarGap;
            realBarGap = 0;
        }
        if (sum >= bandSize && fullBarSize > 0) {
            useFull = true;
            fullBarSize *= 0.9;
            sum = len * fullBarSize;
        }
        var offset = (bandSize - sum) / 2 >> 0;
        var prev = {
            offset: offset - realBarGap,
            size: 0
        };
        result = sizeList.reduce((res, entry)=>{
            var _entry$barSize;
            var newPosition = {
                stackId: entry.stackId,
                dataKeys: entry.dataKeys,
                position: {
                    offset: prev.offset + prev.size + realBarGap,
                    size: useFull ? fullBarSize : (_entry$barSize = entry.barSize) !== null && _entry$barSize !== void 0 ? _entry$barSize : 0
                }
            };
            var newRes = [
                ...res,
                newPosition
            ];
            prev = newRes[newRes.length - 1].position;
            return newRes;
        }, initialValue);
    } else {
        var _offset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPercentValue"])(barCategoryGap, bandSize, 0, true);
        if (bandSize - 2 * _offset - (len - 1) * realBarGap <= 0) {
            realBarGap = 0;
        }
        var originalSize = (bandSize - 2 * _offset - (len - 1) * realBarGap) / len;
        if (originalSize > 1) {
            originalSize >>= 0;
        }
        var size = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$isWellBehavedNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWellBehavedNumber"])(maxBarSize) ? Math.min(originalSize, maxBarSize) : originalSize;
        result = sizeList.reduce((res, entry, i)=>[
                ...res,
                {
                    stackId: entry.stackId,
                    dataKeys: entry.dataKeys,
                    position: {
                        offset: _offset + (originalSize + realBarGap) * i + (originalSize - size) / 2,
                        size
                    }
                }
            ], initialValue);
    }
    return result;
}
var combineAllBarPositions = (sizeList, globalMaxBarSize, barGap, barCategoryGap, barBandSize, bandSize, childMaxBarSize)=>{
    var maxBarSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$DataUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNullish"])(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
    var allBarPositions = getBarPositions(barGap, barCategoryGap, barBandSize !== bandSize ? barBandSize : bandSize, sizeList, maxBarSize);
    if (barBandSize !== bandSize && allBarPositions != null) {
        allBarPositions = allBarPositions.map((pos)=>_objectSpread(_objectSpread({}, pos), {}, {
                position: _objectSpread(_objectSpread({}, pos.position), {}, {
                    offset: pos.position.offset - barBandSize / 2
                })
            }));
    }
    return allBarPositions;
};
var selectAllBarPositions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBarSizeList,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRootMaxBarSize"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBarGap"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBarCategoryGap"],
    selectBarBandSize,
    selectAxisBandSize,
    selectMaxBarSize
], combineAllBarPositions);
var selectXAxisWithScale = (state, xAxisId, _yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisWithScale = (state, _xAxisId, yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'yAxis', yAxisId, isPanorama);
var selectXAxisTicks = (state, xAxisId, _yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisTicks = (state, _xAxisId, yAxisId, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'yAxis', yAxisId, isPanorama);
var selectBarPosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectAllBarPositions,
    selectSynchronisedBarSettings
], (allBarPositions, barSettings)=>{
    if (allBarPositions == null || barSettings == null) {
        return undefined;
    }
    var position = allBarPositions.find((p)=>p.stackId === barSettings.stackId && barSettings.dataKey != null && p.dataKeys.includes(barSettings.dataKey));
    if (position == null) {
        return undefined;
    }
    return position.position;
});
var combineStackedData = (stackGroups, barSettings)=>{
    var stackSeriesIdentifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$stacks$2f$getStackSeriesIdentifier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStackSeriesIdentifier"])(barSettings);
    if (!stackGroups || stackSeriesIdentifier == null || barSettings == null) {
        return undefined;
    }
    var { stackId } = barSettings;
    if (stackId == null) {
        return undefined;
    }
    var stackGroup = stackGroups[stackId];
    if (!stackGroup) {
        return undefined;
    }
    var { stackedData } = stackGroup;
    if (!stackedData) {
        return undefined;
    }
    return stackedData.find((sd)=>sd.key === stackSeriesIdentifier);
};
var selectStackedDataOfItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectBarStackGroups,
    selectSynchronisedBarSettings
], combineStackedData);
var selectBarRectangles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisViewBox"],
    selectXAxisWithScale,
    selectYAxisWithScale,
    selectXAxisTicks,
    selectYAxisTicks,
    selectBarPosition,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexesIfNotInPanorama"],
    selectAxisBandSize,
    selectStackedDataOfItem,
    selectSynchronisedBarSettings,
    pickCells
], (offset, axisViewBox, xAxis, yAxis, xAxisTicks, yAxisTicks, pos, layout, _ref3, bandSize, stackedData, barSettings, cells)=>{
    var { chartData, dataStartIndex, dataEndIndex } = _ref3;
    if (barSettings == null || pos == null || axisViewBox == null || layout !== 'horizontal' && layout !== 'vertical' || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || bandSize == null) {
        return undefined;
    }
    var { data } = barSettings;
    var displayedData;
    if (data != null && data.length > 0) {
        displayedData = data;
    } else {
        displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
    }
    if (displayedData == null) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["computeBarRectangles"])({
        layout,
        barSettings,
        pos,
        parentViewBox: axisViewBox,
        bandSize,
        xAxis,
        yAxis,
        xAxisTicks,
        yAxisTicks,
        stackedData,
        displayedData,
        offset,
        cells,
        dataStartIndex
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/state/ReportPolarOptions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReportPolarOptions",
    ()=>ReportPolarOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$polarOptionsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/polarOptionsSlice.js [app-client] (ecmascript)");
;
;
;
function ReportPolarOptions(props) {
    var dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReportPolarOptions.useEffect": ()=>{
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$polarOptionsSlice$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updatePolarOptions"])(props));
        }
    }["ReportPolarOptions.useEffect"], [
        dispatch,
        props
    ]);
    return null;
}
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/polarSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectAllPolarAppliedNumericalValues",
    ()=>selectAllPolarAppliedNumericalValues,
    "selectPolarAppliedValues",
    ()=>selectPolarAppliedValues,
    "selectPolarAxisDomain",
    ()=>selectPolarAxisDomain,
    "selectPolarAxisDomainIncludingNiceTicks",
    ()=>selectPolarAxisDomainIncludingNiceTicks,
    "selectPolarDisplayedData",
    ()=>selectPolarDisplayedData,
    "selectPolarItemsSettings",
    ()=>selectPolarItemsSettings,
    "selectPolarNiceTicks",
    ()=>selectPolarNiceTicks,
    "selectUnfilteredPolarItems",
    ()=>selectUnfilteredPolarItems
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/context/chartLayoutContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/pickAxisType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/pickAxisId.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/rootPropsSelectors.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
var selectUnfilteredPolarItems = (state)=>state.graphicalItems.polarItems;
var selectAxisPredicate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisId$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisId"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["itemAxisPredicate"]);
var selectPolarItemsSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectUnfilteredPolarItems,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    selectAxisPredicate
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineGraphicalItemsSettings"]);
var selectPolarGraphicalItemsData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarItemsSettings
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineGraphicalItemsData"]);
var selectPolarDisplayedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarGraphicalItemsData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataAndAlwaysIgnoreIndexes"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDisplayedData"]);
var selectPolarAppliedValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarDisplayedData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    selectPolarItemsSettings
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAppliedValues"]);
var selectAllPolarAppliedNumericalValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarDisplayedData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    selectPolarItemsSettings
], (data, axisSettings, items)=>{
    if (items.length > 0) {
        return data.flatMap((entry)=>{
            return items.flatMap((item)=>{
                var _axisSettings$dataKey;
                var valueByDataKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, (_axisSettings$dataKey = axisSettings.dataKey) !== null && _axisSettings$dataKey !== void 0 ? _axisSettings$dataKey : item.dataKey);
                return {
                    value: valueByDataKey,
                    errorDomain: [] // polar charts do not have error bars
                };
            });
        }).filter(Boolean);
    }
    if ((axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.dataKey) != null) {
        return data.map((item)=>({
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(item, axisSettings.dataKey),
                errorDomain: []
            }));
    }
    return data.map((entry)=>({
            value: entry,
            errorDomain: []
        }));
});
var unsupportedInPolarChart = ()=>undefined;
var selectDomainOfAllPolarAppliedNumericalValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarDisplayedData,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    selectPolarItemsSettings,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAllErrorBarSettings"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineDomainOfAllAppliedNumericalValuesIncludingErrorValues"]);
var selectPolarNumericalDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectDomainDefinition"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectDomainFromUserPreference"],
    unsupportedInPolarChart,
    selectDomainOfAllPolarAppliedNumericalValues,
    unsupportedInPolarChart,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineNumericalDomain"]);
var selectPolarAxisDomain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$context$2f$chartLayoutContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartLayout"],
    selectPolarDisplayedData,
    selectPolarAppliedValues,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$rootPropsSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectStackOffsetType"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"],
    selectPolarNumericalDomain
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisDomain"]);
var selectPolarNiceTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectPolarAxisDomain,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectRealScaleType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineNiceTicks"]);
var selectPolarAxisDomainIncludingNiceTicks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBaseAxis"],
    selectPolarAxisDomain,
    selectPolarNiceTicks,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$pickAxisType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickAxisType"]
], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineAxisDomainWithNiceTicks"]);
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/pieSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectDisplayedData",
    ()=>selectDisplayedData,
    "selectPieLegend",
    ()=>selectPieLegend,
    "selectPieSectors",
    ()=>selectPieSectors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/polar/Pie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/selectChartOffsetInternal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/util/ChartUtils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/polarSelectors.js [app-client] (ecmascript)");
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
var pickId = (_state, id)=>id;
var selectSynchronisedPieSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$polarSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectUnfilteredPolarItems"],
    pickId
], (graphicalItems, id)=>graphicalItems.filter((item)=>item.type === 'pie').find((item)=>item.id === id));
// Keep stable reference to an empty array to prevent re-renders
var emptyArray = [];
var pickCells = (_state, _id, cells)=>{
    if ((cells === null || cells === void 0 ? void 0 : cells.length) === 0) {
        return emptyArray;
    }
    return cells;
};
var selectDisplayedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataAndAlwaysIgnoreIndexes"],
    selectSynchronisedPieSettings,
    pickCells
], (_ref, pieSettings, cells)=>{
    var { chartData } = _ref;
    if (pieSettings == null) {
        return undefined;
    }
    var displayedData;
    if ((pieSettings === null || pieSettings === void 0 ? void 0 : pieSettings.data) != null && pieSettings.data.length > 0) {
        displayedData = pieSettings.data;
    } else {
        displayedData = chartData;
    }
    if ((!displayedData || !displayedData.length) && cells != null) {
        displayedData = cells.map((cell)=>_objectSpread(_objectSpread({}, pieSettings.presentationProps), cell.props));
    }
    if (displayedData == null) {
        return undefined;
    }
    return displayedData;
});
var selectPieLegend = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectDisplayedData,
    selectSynchronisedPieSettings,
    pickCells
], (displayedData, pieSettings, cells)=>{
    if (displayedData == null || pieSettings == null) {
        return undefined;
    }
    return displayedData.map((entry, i)=>{
        var _cells$i;
        var name = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValueByDataKey"])(entry, pieSettings.nameKey, pieSettings.name);
        var color;
        if (cells !== null && cells !== void 0 && (_cells$i = cells[i]) !== null && _cells$i !== void 0 && (_cells$i = _cells$i.props) !== null && _cells$i !== void 0 && _cells$i.fill) {
            color = cells[i].props.fill;
        } else if (typeof entry === 'object' && entry != null && 'fill' in entry) {
            color = entry.fill;
        } else {
            color = pieSettings.fill;
        }
        return {
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$util$2f$ChartUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltipNameProp"])(name, pieSettings.dataKey),
            color,
            // @ts-expect-error we need a better typing for our data inputs
            payload: entry,
            type: pieSettings.legendType
        };
    });
});
var selectPieSectors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    selectDisplayedData,
    selectSynchronisedPieSettings,
    pickCells,
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$selectChartOffsetInternal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartOffsetInternal"]
], (displayedData, pieSettings, cells, offset)=>{
    if (pieSettings == null || displayedData == null) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["computePieSectors"])({
        offset,
        pieSettings,
        displayedData,
        cells
    });
});
}),
"[project]/pwa/node_modules/recharts/es6/state/selectors/scatterSelectors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "selectScatterPoints",
    ()=>selectScatterPoints
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/reselect/dist/reselect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Scatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/cartesian/Scatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/dataSelectors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/recharts/es6/state/selectors/axisSelectors.js [app-client] (ecmascript)");
;
;
;
;
var selectXAxisWithScale = (state, xAxisId, _yAxisId, _zAxisId, _id, _cells, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'xAxis', xAxisId, isPanorama);
var selectXAxisTicks = (state, xAxisId, _yAxisId, _zAxisId, _id, _cells, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'xAxis', xAxisId, isPanorama);
var selectYAxisWithScale = (state, _xAxisId, yAxisId, _zAxisId, _id, _cells, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectAxisWithScale"])(state, 'yAxis', yAxisId, isPanorama);
var selectYAxisTicks = (state, _xAxisId, yAxisId, _zAxisId, _id, _cells, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectTicksOfGraphicalItem"])(state, 'yAxis', yAxisId, isPanorama);
var selectZAxis = (state, _xAxisId, _yAxisId, zAxisId)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectZAxisWithScale"])(state, 'zAxis', zAxisId, false);
var pickScatterId = (_state, _xAxisId, _yAxisId, _zAxisId, id)=>id;
var pickCells = (_state, _xAxisId, _yAxisId, _zAxisId, _id, cells)=>cells;
var scatterChartDataSelector = (state, xAxisId, yAxisId, _zAxisId, _id, _cells, isPanorama)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$dataSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectChartDataWithIndexesIfNotInPanorama"])(state, xAxisId, yAxisId, isPanorama);
var selectSynchronisedScatterSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$state$2f$selectors$2f$axisSelectors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectUnfilteredCartesianItems"],
    pickScatterId
], (graphicalItems, id)=>{
    return graphicalItems.filter((item)=>item.type === 'scatter').find((item)=>item.id === id);
});
var selectScatterPoints = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$reselect$2f$dist$2f$reselect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSelector"])([
    scatterChartDataSelector,
    selectXAxisWithScale,
    selectXAxisTicks,
    selectYAxisWithScale,
    selectYAxisTicks,
    selectZAxis,
    selectSynchronisedScatterSettings,
    pickCells
], (_ref, xAxis, xAxisTicks, yAxis, yAxisTicks, zAxis, scatterSettings, cells)=>{
    var { chartData, dataStartIndex, dataEndIndex } = _ref;
    if (scatterSettings == null) {
        return undefined;
    }
    var displayedData;
    if ((scatterSettings === null || scatterSettings === void 0 ? void 0 : scatterSettings.data) != null && scatterSettings.data.length > 0) {
        displayedData = scatterSettings.data;
    } else {
        displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
    }
    if (displayedData == null || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || (xAxisTicks === null || xAxisTicks === void 0 ? void 0 : xAxisTicks.length) === 0 || (yAxisTicks === null || yAxisTicks === void 0 ? void 0 : yAxisTicks.length) === 0) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Scatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["computeScatterPoints"])({
        displayedData,
        xAxis,
        yAxis,
        zAxis,
        scatterSettings,
        xAxisTicks,
        yAxisTicks,
        cells
    });
});
}),
]);

//# sourceMappingURL=7dc3a_recharts_es6_state_dbaedc3f._.js.map