(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/lib/db/store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Database State Management Store (Zustand)
 * 
 * Central state for database instance and metadata
 * Uses localStorage persistence to maintain state across page navigations
 */ __turbopack_context__.s([
    "useDatabaseStore",
    ()=>useDatabaseStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const useDatabaseStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        db: null,
        currentDbName: '',
        loading: true,
        status: 'Initializing...',
        tableCount: 0,
        showSystemTables: false,
        _hasHydrated: false,
        setDb: (db)=>set({
                db
            }),
        setCurrentDbName: (name)=>set({
                currentDbName: name
            }),
        setLoading: (loading)=>set({
                loading
            }),
        setStatus: (status)=>set({
                status
            }),
        setTableCount: (count)=>set({
                tableCount: count
            }),
        setShowSystemTables: (show)=>set({
                showSystemTables: show
            }),
        setHasHydrated: (hydrated)=>set({
                _hasHydrated: hydrated
            }),
        reset: ()=>set({
                db: null,
                currentDbName: '',
                loading: false,
                status: 'Reset',
                tableCount: 0,
                showSystemTables: false
            })
    }), {
    name: 'absurder-sql-database-store',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    // Only persist these fields (not db instance)
    partialize: (state)=>({
            currentDbName: state.currentDbName,
            tableCount: state.tableCount
        }),
    onRehydrateStorage: ()=>(state)=>{
            console.log('[STORE] Zustand hydration complete');
            state?.setHasHydrated(true);
        }
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/components/ui/card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardAction",
    ()=>CardAction,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/lib/utils.ts [app-client] (ecmascript)");
;
;
;
function Card(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 36,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c = Card;
function CardHeader(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card-header",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 77,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c1 = CardHeader;
function CardTitle(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("leading-none font-semibold", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card-title",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 118,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c2 = CardTitle;
function CardDescription(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card-description",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 159,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c3 = CardDescription;
function CardAction(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card-action",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 200,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c4 = CardAction;
function CardContent(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("px-6", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card-content",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 241,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c5 = CardContent;
function CardFooter(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "82896d17a6dda3f36c69d8506eca599611e5e9d1ca1c1946b81fd4cc43ad4947";
    }
    let className;
    let props;
    if ($[1] !== t0) {
        ({ className, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
    } else {
        className = $[2];
        props = $[3];
    }
    let t1;
    if ($[4] !== className) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center px-6 [.border-t]:pt-6", className);
        $[4] = className;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== props || $[7] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-slot": "card-footer",
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/card.tsx",
            lineNumber: 282,
            columnNumber: 10
        }, this);
        $[6] = props;
        $[7] = t1;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    return t2;
}
_c6 = CardFooter;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "Card");
__turbopack_context__.k.register(_c1, "CardHeader");
__turbopack_context__.k.register(_c2, "CardTitle");
__turbopack_context__.k.register(_c3, "CardDescription");
__turbopack_context__.k.register(_c4, "CardAction");
__turbopack_context__.k.register(_c5, "CardContent");
__turbopack_context__.k.register(_c6, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9",
            "icon-sm": "size-8",
            "icon-lg": "size-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(17);
    if ($[0] !== "9a5d9d24a6bca72d2a78358849db1b86d2391f6ac632c3cb5ee7f4574607f850") {
        for(let $i = 0; $i < 17; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "9a5d9d24a6bca72d2a78358849db1b86d2391f6ac632c3cb5ee7f4574607f850";
    }
    let className;
    let props;
    let size;
    let t1;
    let t2;
    let variant;
    if ($[1] !== t0) {
        ({ className, variant, size, asChild: t1, type: t2, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
        $[4] = size;
        $[5] = t1;
        $[6] = t2;
        $[7] = variant;
    } else {
        className = $[2];
        props = $[3];
        size = $[4];
        t1 = $[5];
        t2 = $[6];
        variant = $[7];
    }
    const asChild = t1 === undefined ? false : t1;
    const type = t2 === undefined ? "button" : t2;
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    const t3 = asChild ? undefined : type;
    let t4;
    if ($[8] !== className || $[9] !== size || $[10] !== variant) {
        t4 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        }));
        $[8] = className;
        $[9] = size;
        $[10] = variant;
        $[11] = t4;
    } else {
        t4 = $[11];
    }
    let t5;
    if ($[12] !== Comp || $[13] !== props || $[14] !== t3 || $[15] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
            "data-slot": "button",
            type: t3,
            className: t4,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/button.tsx",
            lineNumber: 88,
            columnNumber: 10
        }, this);
        $[12] = Comp;
        $[13] = props;
        $[14] = t3;
        $[15] = t4;
        $[16] = t5;
    } else {
        t5 = $[16];
    }
    return t5;
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/components/ui/badge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            outline: "text-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(11);
    if ($[0] !== "f032d3757f8881e29b3c0807184d81a9ac2279cd0c1cd48b526f3103c9c7c8ee") {
        for(let $i = 0; $i < 11; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "f032d3757f8881e29b3c0807184d81a9ac2279cd0c1cd48b526f3103c9c7c8ee";
    }
    let className;
    let props;
    let variant;
    if ($[1] !== t0) {
        ({ className, variant, ...props } = t0);
        $[1] = t0;
        $[2] = className;
        $[3] = props;
        $[4] = variant;
    } else {
        className = $[2];
        props = $[3];
        variant = $[4];
    }
    let t1;
    if ($[5] !== className || $[6] !== variant) {
        t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className);
        $[5] = className;
        $[6] = variant;
        $[7] = t1;
    } else {
        t1 = $[7];
    }
    let t2;
    if ($[8] !== props || $[9] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t1,
            ...props
        }, void 0, false, {
            fileName: "[project]/pwa/components/ui/badge.tsx",
            lineNumber: 58,
            columnNumber: 10
        }, this);
        $[8] = props;
        $[9] = t1;
        $[10] = t2;
    } else {
        t2 = $[10];
    }
    return t2;
}
_c = Badge;
;
var _c;
__turbopack_context__.k.register(_c, "Badge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pwa/app/db/storage/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StorageAnalysisPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/lib/db/store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/lucide-react/dist/esm/icons/database.js [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$table$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Table$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/lucide-react/dist/esm/icons/table.js [app-client] (ecmascript) <export default as Table>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/lucide-react/dist/esm/icons/list.js [app-client] (ecmascript) <export default as List>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hard$2d$drive$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HardDrive$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/lucide-react/dist/esm/icons/hard-drive.js [app-client] (ecmascript) <export default as HardDrive>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/components/ui/badge.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function StorageAnalysisContent() {
    _s();
    const { db, _hasHydrated, setDb } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabaseStore"])();
    const currentDbName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabaseStore"])({
        "StorageAnalysisContent.useDatabaseStore[currentDbName]": (state)=>state.currentDbName
    }["StorageAnalysisContent.useDatabaseStore[currentDbName]"]);
    // Track window.testDb for E2E tests
    const [windowTestDb, setWindowTestDb] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const activeDb = db || windowTestDb;
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dbSize, setDbSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [tables, setTables] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [indexes, setIndexes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Initialize WASM and expose testDb globally for E2E tests
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StorageAnalysisContent.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            // Wait for Zustand hydration before attempting database restoration
            if (!_hasHydrated) return;
            async function initializeWasm() {
                try {
                    // ALWAYS initialize WASM first, even if db exists
                    const init = (await __turbopack_context__.A("[project]/pkg/absurder_sql.js [app-client] (ecmascript, async loader)")).default;
                    await init();
                    // Then expose Database class
                    const { Database } = await __turbopack_context__.A("[project]/pkg/absurder_sql.js [app-client] (ecmascript, async loader)");
                    window.Database = Database;
                    // If db exists from Zustand, expose it as testDb
                    if (db) {
                        // Add .db property pointing to itself for test compatibility (only if not already set)
                        if (!db.db) db.db = db;
                        window.testDb = db;
                    } else if (currentDbName) {
                        // Restore database from storage if currentDbName exists
                        console.log('[StoragePage] Restoring database from currentDbName:', currentDbName);
                        const dbInstance = await Database.newDatabase(currentDbName);
                        // Add .db property pointing to itself for test compatibility (only if not already set)
                        if (!dbInstance.db) dbInstance.db = dbInstance;
                        setDb(dbInstance);
                        window.testDb = dbInstance;
                        console.log('[StoragePage] Database restored successfully');
                    }
                } catch (err) {
                    console.error('Failed to initialize WASM:', err);
                }
            }
            initializeWasm();
        }
    }["StorageAnalysisContent.useEffect"], [
        db,
        currentDbName,
        _hasHydrated,
        setDb
    ]);
    // Sync window.testDb to component state (for E2E tests)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StorageAnalysisContent.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const checkTestDb = {
                "StorageAnalysisContent.useEffect.checkTestDb": ()=>{
                    const testDb = window.testDb;
                    if (testDb && !windowTestDb) {
                        setWindowTestDb(testDb);
                    }
                }
            }["StorageAnalysisContent.useEffect.checkTestDb"];
            // Check immediately
            checkTestDb();
            // Also check periodically in case testDb is set after component mounts
            const interval = setInterval(checkTestDb, 50);
            return ({
                "StorageAnalysisContent.useEffect": ()=>clearInterval(interval)
            })["StorageAnalysisContent.useEffect"];
        }
    }["StorageAnalysisContent.useEffect"], [
        windowTestDb
    ]);
    const formatSize = (bytes)=>{
        if (bytes === 0) return '0 bytes';
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };
    const calculatePageSize = async ()=>{
        try {
            if (!activeDb) {
                return 4096; // Default SQLite page size
            }
            const result = await activeDb.execute('PRAGMA page_size');
            if (result.rows && result.rows.length > 0) {
                const val = result.rows[0].values[0];
                return val.value;
            }
            return 4096;
        } catch (err) {
            return 4096;
        }
    };
    const calculateTableSize = async (tableName)=>{
        try {
            if (!activeDb) return 0;
            // Get page count for the table
            const pageSize = await calculatePageSize();
            // Query the internal SQLite table for page counts
            const result = await activeDb.execute(`SELECT SUM(pgsize) as size FROM dbstat WHERE name='${tableName}'`);
            if (result.rows && result.rows.length > 0) {
                const val = result.rows[0].values[0];
                if (val.value) {
                    return val.value;
                }
            }
            // Fallback: estimate based on row count
            const countResult = await activeDb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            if (countResult.rows && countResult.rows.length > 0) {
                const rowCount = countResult.rows[0].values[0].value;
                // Rough estimate: 100 bytes per row minimum
                return rowCount * 100;
            }
            return 0;
        } catch (err) {
            // Fallback estimation
            try {
                const countResult = await activeDb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                if (countResult.rows && countResult.rows.length > 0) {
                    const rowCount = countResult.rows[0].values[0].value;
                    return rowCount * 100; // Estimate 100 bytes per row
                }
            } catch (fallbackErr) {
            // Silent failure
            }
            return 0;
        }
    };
    const calculateIndexSize = async (indexName)=>{
        try {
            if (!activeDb) return 0;
            // Try to get index size from dbstat
            const result = await activeDb.execute(`SELECT SUM(pgsize) as size FROM dbstat WHERE name='${indexName}'`);
            if (result.rows && result.rows.length > 0) {
                const val = result.rows[0].values[0];
                if (val.value) {
                    return val.value;
                }
            }
            // Fallback: estimate based on indexed table row count
            return 1024; // Minimum 1KB estimate for indexes
        } catch (err) {
            return 1024; // Default estimate
        }
    };
    const loadStorageInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "StorageAnalysisContent.useCallback[loadStorageInfo]": async ()=>{
            if (!activeDb) {
                setError('No database connected');
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Get all tables
                const tablesResult = await activeDb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                const tableInfoPromises = tablesResult.rows.map({
                    "StorageAnalysisContent.useCallback[loadStorageInfo].tableInfoPromises": async (row)=>{
                        const tableName = row.values[0].value;
                        // Get row count
                        const countResult = await activeDb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                        const rowCount = countResult.rows[0].values[0].value;
                        // Calculate size
                        const size = await calculateTableSize(tableName);
                        return {
                            name: tableName,
                            rowCount,
                            size
                        };
                    }
                }["StorageAnalysisContent.useCallback[loadStorageInfo].tableInfoPromises"]);
                const tableInfos = await Promise.all(tableInfoPromises);
                setTables(tableInfos);
                // Get all indexes
                const indexesResult = await activeDb.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'");
                const indexInfoPromises = indexesResult.rows.map({
                    "StorageAnalysisContent.useCallback[loadStorageInfo].indexInfoPromises": async (row)=>{
                        const indexName = row.values[0].value;
                        const tableName = row.values[1].value;
                        const size = await calculateIndexSize(indexName);
                        return {
                            name: indexName,
                            tableName,
                            size
                        };
                    }
                }["StorageAnalysisContent.useCallback[loadStorageInfo].indexInfoPromises"]);
                const indexInfos = await Promise.all(indexInfoPromises);
                setIndexes(indexInfos);
                // Calculate total database size
                const totalTableSize = tableInfos.reduce({
                    "StorageAnalysisContent.useCallback[loadStorageInfo].totalTableSize": (sum, table)=>sum + table.size
                }["StorageAnalysisContent.useCallback[loadStorageInfo].totalTableSize"], 0);
                const totalIndexSize = indexInfos.reduce({
                    "StorageAnalysisContent.useCallback[loadStorageInfo].totalIndexSize": (sum, index)=>sum + index.size
                }["StorageAnalysisContent.useCallback[loadStorageInfo].totalIndexSize"], 0);
                const totalSize = totalTableSize + totalIndexSize;
                setDbSize(totalSize > 0 ? totalSize : 8192); // Minimum SQLite database is 8KB
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load storage information');
            } finally{
                setLoading(false);
            }
        }
    }["StorageAnalysisContent.useCallback[loadStorageInfo]"], [
        activeDb
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StorageAnalysisContent.useEffect": ()=>{
            if (activeDb) {
                loadStorageInfo();
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["StorageAnalysisContent.useEffect"], [
        activeDb
    ]);
    const handleRefresh = ()=>{
        loadStorageInfo();
    };
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                className: "border-red-200 bg-red-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                            className: "text-red-700",
                            children: "Error"
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 240,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 239,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-red-600",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 243,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 242,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/db/storage/page.tsx",
                lineNumber: 238,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/pwa/app/db/storage/page.tsx",
            lineNumber: 237,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "container mx-auto p-6 space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold tracking-tight",
                                children: "Storage Analysis"
                            }, void 0, false, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-muted-foreground",
                                children: "Analyze database storage usage and optimize performance"
                            }, void 0, false, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 252,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        id: "refreshStorageButton",
                        onClick: handleRefresh,
                        disabled: loading,
                        variant: "outline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                className: `mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`
                            }, void 0, false, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 257,
                                columnNumber: 11
                            }, this),
                            "Refresh"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/db/storage/page.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this),
                                    "Database Size"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 265,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                children: "Total storage used by the database"
                            }, void 0, false, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 269,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 264,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-4xl font-bold",
                            "data-testid": "db-size",
                            children: formatSize(dbSize)
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 272,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/db/storage/page.tsx",
                lineNumber: 263,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$table$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Table$3e$__["Table"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                                        lineNumber: 282,
                                        columnNumber: 13
                                    }, this),
                                    "Tables"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 281,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                children: "Storage breakdown by table"
                            }, void 0, false, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 285,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        children: tables.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-muted-foreground",
                            children: "No tables found in this database."
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 288,
                            columnNumber: 34
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: tables.map((table)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    "data-table": table.name,
                                    "data-table-name": table.name,
                                    className: "flex items-center justify-between p-4 border rounded-lg hover:bg-accent",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-medium",
                                                    children: table.name
                                                }, void 0, false, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 291,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-muted-foreground",
                                                    children: [
                                                        table.rowCount,
                                                        " ",
                                                        table.rowCount === 1 ? 'row' : 'rows'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 292,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                                            lineNumber: 290,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-right",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-medium table-size",
                                                    "data-testid": "table-size",
                                                    children: formatSize(table.size)
                                                }, void 0, false, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                    variant: "secondary",
                                                    className: "mt-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$hard$2d$drive$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HardDrive$3e$__["HardDrive"], {
                                                            className: "h-3 w-3 mr-1"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                            lineNumber: 301,
                                                            columnNumber: 23
                                                        }, this),
                                                        "Table"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 300,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                                            lineNumber: 296,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, table.name, true, {
                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                    lineNumber: 289,
                                    columnNumber: 36
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 288,
                            columnNumber: 111
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 287,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/db/storage/page.tsx",
                lineNumber: 279,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {
                                        className: "h-5 w-5"
                                    }, void 0, false, {
                                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                                        lineNumber: 314,
                                        columnNumber: 13
                                    }, this),
                                    "Indexes"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 313,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                children: "Storage used by indexes"
                            }, void 0, false, {
                                fileName: "[project]/pwa/app/db/storage/page.tsx",
                                lineNumber: 317,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        children: indexes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-muted-foreground",
                            children: "No indexes found in this database."
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 320,
                            columnNumber: 35
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: indexes.map((index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    "data-index": index.name,
                                    className: "flex items-center justify-between p-4 border rounded-lg hover:bg-accent",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-medium",
                                                    children: index.name
                                                }, void 0, false, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-muted-foreground",
                                                    children: [
                                                        "on table: ",
                                                        index.tableName
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                                            lineNumber: 322,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-right",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-medium index-size",
                                                    "data-testid": "index-size",
                                                    children: formatSize(index.size)
                                                }, void 0, false, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 329,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                    variant: "secondary",
                                                    className: "mt-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {
                                                            className: "h-3 w-3 mr-1"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                            lineNumber: 333,
                                                            columnNumber: 23
                                                        }, this),
                                                        "Index"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                                    lineNumber: 332,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                                            lineNumber: 328,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, index.name, true, {
                                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                                    lineNumber: 321,
                                    columnNumber: 37
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/pwa/app/db/storage/page.tsx",
                            lineNumber: 320,
                            columnNumber: 113
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pwa/app/db/storage/page.tsx",
                        lineNumber: 319,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pwa/app/db/storage/page.tsx",
                lineNumber: 311,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pwa/app/db/storage/page.tsx",
        lineNumber: 248,
        columnNumber: 10
    }, this);
}
_s(StorageAnalysisContent, "YaThGrXZoE3qzWcGPpFtEOwsDr8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabaseStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabaseStore"]
    ];
});
_c = StorageAnalysisContent;
function StorageAnalysisPage() {
    _s1();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(3);
    if ($[0] !== "f63bf6b10d3e6c44851f36d1803be2e73a6db918e1c506380c51af21d7d70ce6") {
        for(let $i = 0; $i < 3; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "f63bf6b10d3e6c44851f36d1803be2e73a6db918e1c506380c51af21d7d70ce6";
    }
    const currentDbName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabaseStore"])(_StorageAnalysisPageUseDatabaseStore);
    if (!currentDbName) {
        let t0;
        if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
            t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container mx-auto p-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center text-gray-600",
                    children: "No database selected. Please create or open a database first."
                }, void 0, false, {
                    fileName: "[project]/pwa/app/db/storage/page.tsx",
                    lineNumber: 355,
                    columnNumber: 51
                }, this)
            }, void 0, false, {
                fileName: "[project]/pwa/app/db/storage/page.tsx",
                lineNumber: 355,
                columnNumber: 12
            }, this);
            $[1] = t0;
        } else {
            t0 = $[1];
        }
        return t0;
    }
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StorageAnalysisContent, {}, void 0, false, {
            fileName: "[project]/pwa/app/db/storage/page.tsx",
            lineNumber: 364,
            columnNumber: 10
        }, this);
        $[2] = t0;
    } else {
        t0 = $[2];
    }
    return t0;
}
_s1(StorageAnalysisPage, "t/zCalvTgSzYu3aGi+V6NZCpPf8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$lib$2f$db$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDatabaseStore"]
    ];
});
_c1 = StorageAnalysisPage;
function _StorageAnalysisPageUseDatabaseStore(state) {
    return state.currentDbName;
}
var _c, _c1;
__turbopack_context__.k.register(_c, "StorageAnalysisContent");
__turbopack_context__.k.register(_c1, "StorageAnalysisPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=pwa_801d6127._.js.map