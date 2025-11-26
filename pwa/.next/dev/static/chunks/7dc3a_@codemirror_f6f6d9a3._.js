(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/node_modules/@codemirror/language/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DocInput",
    ()=>DocInput,
    "HighlightStyle",
    ()=>HighlightStyle,
    "IndentContext",
    ()=>IndentContext,
    "LRLanguage",
    ()=>LRLanguage,
    "Language",
    ()=>Language,
    "LanguageDescription",
    ()=>LanguageDescription,
    "LanguageSupport",
    ()=>LanguageSupport,
    "ParseContext",
    ()=>ParseContext,
    "StreamLanguage",
    ()=>StreamLanguage,
    "StringStream",
    ()=>StringStream,
    "TreeIndentContext",
    ()=>TreeIndentContext,
    "bidiIsolates",
    ()=>bidiIsolates,
    "bracketMatching",
    ()=>bracketMatching,
    "bracketMatchingHandle",
    ()=>bracketMatchingHandle,
    "codeFolding",
    ()=>codeFolding,
    "continuedIndent",
    ()=>continuedIndent,
    "defaultHighlightStyle",
    ()=>defaultHighlightStyle,
    "defineLanguageFacet",
    ()=>defineLanguageFacet,
    "delimitedIndent",
    ()=>delimitedIndent,
    "ensureSyntaxTree",
    ()=>ensureSyntaxTree,
    "flatIndent",
    ()=>flatIndent,
    "foldAll",
    ()=>foldAll,
    "foldCode",
    ()=>foldCode,
    "foldEffect",
    ()=>foldEffect,
    "foldGutter",
    ()=>foldGutter,
    "foldInside",
    ()=>foldInside,
    "foldKeymap",
    ()=>foldKeymap,
    "foldNodeProp",
    ()=>foldNodeProp,
    "foldService",
    ()=>foldService,
    "foldState",
    ()=>foldState,
    "foldable",
    ()=>foldable,
    "foldedRanges",
    ()=>foldedRanges,
    "forceParsing",
    ()=>forceParsing,
    "getIndentUnit",
    ()=>getIndentUnit,
    "getIndentation",
    ()=>getIndentation,
    "highlightingFor",
    ()=>highlightingFor,
    "indentNodeProp",
    ()=>indentNodeProp,
    "indentOnInput",
    ()=>indentOnInput,
    "indentRange",
    ()=>indentRange,
    "indentService",
    ()=>indentService,
    "indentString",
    ()=>indentString,
    "indentUnit",
    ()=>indentUnit,
    "language",
    ()=>language,
    "languageDataProp",
    ()=>languageDataProp,
    "matchBrackets",
    ()=>matchBrackets,
    "sublanguageProp",
    ()=>sublanguageProp,
    "syntaxHighlighting",
    ()=>syntaxHighlighting,
    "syntaxParserRunning",
    ()=>syntaxParserRunning,
    "syntaxTree",
    ()=>syntaxTree,
    "syntaxTreeAvailable",
    ()=>syntaxTreeAvailable,
    "toggleFold",
    ()=>toggleFold,
    "unfoldAll",
    ()=>unfoldAll,
    "unfoldCode",
    ()=>unfoldCode,
    "unfoldEffect",
    ()=>unfoldEffect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/common/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/state/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/view/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/highlight/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$style$2d$mod$2f$src$2f$style$2d$mod$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/style-mod/src/style-mod.js [app-client] (ecmascript)");
;
;
;
;
;
var _a;
/**
Node prop stored in a parser's top syntax node to provide the
facet that stores language-specific data for that language.
*/ const languageDataProp = /*@__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]();
/**
Helper function to define a facet (to be added to the top syntax
node(s) for a language via
[`languageDataProp`](https://codemirror.net/6/docs/ref/#language.languageDataProp)), that will be
used to associate language data with the language. You
probably only need this when subclassing
[`Language`](https://codemirror.net/6/docs/ref/#language.Language).
*/ function defineLanguageFacet(baseData) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
        combine: baseData ? (values)=>values.concat(baseData) : undefined
    });
}
/**
Syntax node prop used to register sublanguages. Should be added to
the top level node type for the language.
*/ const sublanguageProp = /*@__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]();
/**
A language object manages parsing and per-language
[metadata](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt). Parse data is
managed as a [Lezer](https://lezer.codemirror.net) tree. The class
can be used directly, via the [`LRLanguage`](https://codemirror.net/6/docs/ref/#language.LRLanguage)
subclass for [Lezer](https://lezer.codemirror.net/) LR parsers, or
via the [`StreamLanguage`](https://codemirror.net/6/docs/ref/#language.StreamLanguage) subclass
for stream parsers.
*/ class Language {
    /**
    Construct a language object. If you need to invoke this
    directly, first define a data facet with
    [`defineLanguageFacet`](https://codemirror.net/6/docs/ref/#language.defineLanguageFacet), and then
    configure your parser to [attach](https://codemirror.net/6/docs/ref/#language.languageDataProp) it
    to the language's outer syntax node.
    */ constructor(/**
    The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) facet
    used for this language.
    */ data, parser, extraExtensions = [], /**
    A language name.
    */ name = ""){
        this.data = data;
        this.name = name;
        // Kludge to define EditorState.tree as a debugging helper,
        // without the EditorState package actually knowing about
        // languages and lezer trees.
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorState"].prototype.hasOwnProperty("tree")) Object.defineProperty(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorState"].prototype, "tree", {
            get () {
                return syntaxTree(this);
            }
        });
        this.parser = parser;
        this.extension = [
            language.of(this),
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorState"].languageData.of((state, pos, side)=>{
                let top = topNodeAt(state, pos, side), data = top.type.prop(languageDataProp);
                if (!data) return [];
                let base = state.facet(data), sub = top.type.prop(sublanguageProp);
                if (sub) {
                    let innerNode = top.resolve(pos - top.from, side);
                    for (let sublang of sub)if (sublang.test(innerNode, state)) {
                        let data = state.facet(sublang.facet);
                        return sublang.type == "replace" ? data : data.concat(base);
                    }
                }
                return base;
            })
        ].concat(extraExtensions);
    }
    /**
    Query whether this language is active at the given position.
    */ isActiveAt(state, pos, side = -1) {
        return topNodeAt(state, pos, side).type.prop(languageDataProp) == this.data;
    }
    /**
    Find the document regions that were parsed using this language.
    The returned regions will _include_ any nested languages rooted
    in this language, when those exist.
    */ findRegions(state) {
        let lang = state.facet(language);
        if ((lang === null || lang === void 0 ? void 0 : lang.data) == this.data) return [
            {
                from: 0,
                to: state.doc.length
            }
        ];
        if (!lang || !lang.allowsNesting) return [];
        let result = [];
        let explore = (tree, from)=>{
            if (tree.prop(languageDataProp) == this.data) {
                result.push({
                    from,
                    to: from + tree.length
                });
                return;
            }
            let mount = tree.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].mounted);
            if (mount) {
                if (mount.tree.prop(languageDataProp) == this.data) {
                    if (mount.overlay) for (let r of mount.overlay)result.push({
                        from: r.from + from,
                        to: r.to + from
                    });
                    else result.push({
                        from: from,
                        to: from + tree.length
                    });
                    return;
                } else if (mount.overlay) {
                    let size = result.length;
                    explore(mount.tree, mount.overlay[0].from + from);
                    if (result.length > size) return;
                }
            }
            for(let i = 0; i < tree.children.length; i++){
                let ch = tree.children[i];
                if (ch instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"]) explore(ch, tree.positions[i] + from);
            }
        };
        explore(syntaxTree(state), 0);
        return result;
    }
    /**
    Indicates whether this language allows nested languages. The
    default implementation returns true.
    */ get allowsNesting() {
        return true;
    }
}
/**
@internal
*/ Language.setState = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define();
function topNodeAt(state, pos, side) {
    let topLang = state.facet(language), tree = syntaxTree(state).topNode;
    if (!topLang || topLang.allowsNesting) {
        for(let node = tree; node; node = node.enter(pos, side, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IterMode"].ExcludeBuffers))if (node.type.isTop) tree = node;
    }
    return tree;
}
/**
A subclass of [`Language`](https://codemirror.net/6/docs/ref/#language.Language) for use with Lezer
[LR parsers](https://lezer.codemirror.net/docs/ref#lr.LRParser)
parsers.
*/ class LRLanguage extends Language {
    constructor(data, parser, name){
        super(data, parser, [], name);
        this.parser = parser;
    }
    /**
    Define a language from a parser.
    */ static define(spec) {
        let data = defineLanguageFacet(spec.languageData);
        return new LRLanguage(data, spec.parser.configure({
            props: [
                languageDataProp.add((type)=>type.isTop ? data : undefined)
            ]
        }), spec.name);
    }
    /**
    Create a new instance of this language with a reconfigured
    version of its parser and optionally a new name.
    */ configure(options, name) {
        return new LRLanguage(this.data, this.parser.configure(options), name || this.name);
    }
    get allowsNesting() {
        return this.parser.hasWrappers();
    }
}
/**
Get the syntax tree for a state, which is the current (possibly
incomplete) parse tree of the active
[language](https://codemirror.net/6/docs/ref/#language.Language), or the empty tree if there is no
language available.
*/ function syntaxTree(state) {
    let field = state.field(Language.state, false);
    return field ? field.tree : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].empty;
}
/**
Try to get a parse tree that spans at least up to `upto`. The
method will do at most `timeout` milliseconds of work to parse
up to that point if the tree isn't already available.
*/ function ensureSyntaxTree(state, upto, timeout = 50) {
    var _a;
    let parse = (_a = state.field(Language.state, false)) === null || _a === void 0 ? void 0 : _a.context;
    if (!parse) return null;
    let oldVieport = parse.viewport;
    parse.updateViewport({
        from: 0,
        to: upto
    });
    let result = parse.isDone(upto) || parse.work(timeout, upto) ? parse.tree : null;
    parse.updateViewport(oldVieport);
    return result;
}
/**
Queries whether there is a full syntax tree available up to the
given document position. If there isn't, the background parse
process _might_ still be working and update the tree further, but
there is no guarantee of that—the parser will [stop
working](https://codemirror.net/6/docs/ref/#language.syntaxParserRunning) when it has spent a
certain amount of time or has moved beyond the visible viewport.
Always returns false if no language has been enabled.
*/ function syntaxTreeAvailable(state, upto = state.doc.length) {
    var _a;
    return ((_a = state.field(Language.state, false)) === null || _a === void 0 ? void 0 : _a.context.isDone(upto)) || false;
}
/**
Move parsing forward, and update the editor state afterwards to
reflect the new tree. Will work for at most `timeout`
milliseconds. Returns true if the parser managed get to the given
position in that time.
*/ function forceParsing(view, upto = view.viewport.to, timeout = 100) {
    let success = ensureSyntaxTree(view.state, upto, timeout);
    if (success != syntaxTree(view.state)) view.dispatch({});
    return !!success;
}
/**
Tells you whether the language parser is planning to do more
parsing work (in a `requestIdleCallback` pseudo-thread) or has
stopped running, either because it parsed the entire document,
because it spent too much time and was cut off, or because there
is no language parser enabled.
*/ function syntaxParserRunning(view) {
    var _a;
    return ((_a = view.plugin(parseWorker)) === null || _a === void 0 ? void 0 : _a.isWorking()) || false;
}
/**
Lezer-style
[`Input`](https://lezer.codemirror.net/docs/ref#common.Input)
object for a [`Text`](https://codemirror.net/6/docs/ref/#state.Text) object.
*/ class DocInput {
    /**
    Create an input object for the given document.
    */ constructor(doc){
        this.doc = doc;
        this.cursorPos = 0;
        this.string = "";
        this.cursor = doc.iter();
    }
    get length() {
        return this.doc.length;
    }
    syncTo(pos) {
        this.string = this.cursor.next(pos - this.cursorPos).value;
        this.cursorPos = pos + this.string.length;
        return this.cursorPos - this.string.length;
    }
    chunk(pos) {
        this.syncTo(pos);
        return this.string;
    }
    get lineChunks() {
        return true;
    }
    read(from, to) {
        let stringStart = this.cursorPos - this.string.length;
        if (from < stringStart || to >= this.cursorPos) return this.doc.sliceString(from, to);
        else return this.string.slice(from - stringStart, to - stringStart);
    }
}
let currentContext = null;
/**
A parse context provided to parsers working on the editor content.
*/ class ParseContext {
    constructor(parser, /**
    The current editor state.
    */ state, /**
    Tree fragments that can be reused by incremental re-parses.
    */ fragments = [], /**
    @internal
    */ tree, /**
    @internal
    */ treeLen, /**
    The current editor viewport (or some overapproximation
    thereof). Intended to be used for opportunistically avoiding
    work (in which case
    [`skipUntilInView`](https://codemirror.net/6/docs/ref/#language.ParseContext.skipUntilInView)
    should be called to make sure the parser is restarted when the
    skipped region becomes visible).
    */ viewport, /**
    @internal
    */ skipped, /**
    This is where skipping parsers can register a promise that,
    when resolved, will schedule a new parse. It is cleared when
    the parse worker picks up the promise. @internal
    */ scheduleOn){
        this.parser = parser;
        this.state = state;
        this.fragments = fragments;
        this.tree = tree;
        this.treeLen = treeLen;
        this.viewport = viewport;
        this.skipped = skipped;
        this.scheduleOn = scheduleOn;
        this.parse = null;
        /**
        @internal
        */ this.tempSkipped = [];
    }
    /**
    @internal
    */ static create(parser, state, viewport) {
        return new ParseContext(parser, state, [], __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].empty, 0, viewport, [], null);
    }
    startParse() {
        return this.parser.startParse(new DocInput(this.state.doc), this.fragments);
    }
    /**
    @internal
    */ work(until, upto) {
        if (upto != null && upto >= this.state.doc.length) upto = undefined;
        if (this.tree != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].empty && this.isDone(upto !== null && upto !== void 0 ? upto : this.state.doc.length)) {
            this.takeTree();
            return true;
        }
        return this.withContext(()=>{
            var _a;
            if (typeof until == "number") {
                let endTime = Date.now() + until;
                until = ()=>Date.now() > endTime;
            }
            if (!this.parse) this.parse = this.startParse();
            if (upto != null && (this.parse.stoppedAt == null || this.parse.stoppedAt > upto) && upto < this.state.doc.length) this.parse.stopAt(upto);
            for(;;){
                let done = this.parse.advance();
                if (done) {
                    this.fragments = this.withoutTempSkipped(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TreeFragment"].addTree(done, this.fragments, this.parse.stoppedAt != null));
                    this.treeLen = (_a = this.parse.stoppedAt) !== null && _a !== void 0 ? _a : this.state.doc.length;
                    this.tree = done;
                    this.parse = null;
                    if (this.treeLen < (upto !== null && upto !== void 0 ? upto : this.state.doc.length)) this.parse = this.startParse();
                    else return true;
                }
                if (until()) return false;
            }
        });
    }
    /**
    @internal
    */ takeTree() {
        let pos, tree;
        if (this.parse && (pos = this.parse.parsedPos) >= this.treeLen) {
            if (this.parse.stoppedAt == null || this.parse.stoppedAt > pos) this.parse.stopAt(pos);
            this.withContext(()=>{
                while(!(tree = this.parse.advance())){}
            });
            this.treeLen = pos;
            this.tree = tree;
            this.fragments = this.withoutTempSkipped(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TreeFragment"].addTree(this.tree, this.fragments, true));
            this.parse = null;
        }
    }
    withContext(f) {
        let prev = currentContext;
        currentContext = this;
        try {
            return f();
        } finally{
            currentContext = prev;
        }
    }
    withoutTempSkipped(fragments) {
        for(let r; r = this.tempSkipped.pop();)fragments = cutFragments(fragments, r.from, r.to);
        return fragments;
    }
    /**
    @internal
    */ changes(changes, newState) {
        let { fragments, tree, treeLen, viewport, skipped } = this;
        this.takeTree();
        if (!changes.empty) {
            let ranges = [];
            changes.iterChangedRanges((fromA, toA, fromB, toB)=>ranges.push({
                    fromA,
                    toA,
                    fromB,
                    toB
                }));
            fragments = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TreeFragment"].applyChanges(fragments, ranges);
            tree = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].empty;
            treeLen = 0;
            viewport = {
                from: changes.mapPos(viewport.from, -1),
                to: changes.mapPos(viewport.to, 1)
            };
            if (this.skipped.length) {
                skipped = [];
                for (let r of this.skipped){
                    let from = changes.mapPos(r.from, 1), to = changes.mapPos(r.to, -1);
                    if (from < to) skipped.push({
                        from,
                        to
                    });
                }
            }
        }
        return new ParseContext(this.parser, newState, fragments, tree, treeLen, viewport, skipped, this.scheduleOn);
    }
    /**
    @internal
    */ updateViewport(viewport) {
        if (this.viewport.from == viewport.from && this.viewport.to == viewport.to) return false;
        this.viewport = viewport;
        let startLen = this.skipped.length;
        for(let i = 0; i < this.skipped.length; i++){
            let { from, to } = this.skipped[i];
            if (from < viewport.to && to > viewport.from) {
                this.fragments = cutFragments(this.fragments, from, to);
                this.skipped.splice(i--, 1);
            }
        }
        if (this.skipped.length >= startLen) return false;
        this.reset();
        return true;
    }
    /**
    @internal
    */ reset() {
        if (this.parse) {
            this.takeTree();
            this.parse = null;
        }
    }
    /**
    Notify the parse scheduler that the given region was skipped
    because it wasn't in view, and the parse should be restarted
    when it comes into view.
    */ skipUntilInView(from, to) {
        this.skipped.push({
            from,
            to
        });
    }
    /**
    Returns a parser intended to be used as placeholder when
    asynchronously loading a nested parser. It'll skip its input and
    mark it as not-really-parsed, so that the next update will parse
    it again.
    
    When `until` is given, a reparse will be scheduled when that
    promise resolves.
    */ static getSkippingParser(until) {
        return new class extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Parser"] {
            createParse(input, fragments, ranges) {
                let from = ranges[0].from, to = ranges[ranges.length - 1].to;
                let parser = {
                    parsedPos: from,
                    advance () {
                        let cx = currentContext;
                        if (cx) {
                            for (let r of ranges)cx.tempSkipped.push(r);
                            if (until) cx.scheduleOn = cx.scheduleOn ? Promise.all([
                                cx.scheduleOn,
                                until
                            ]) : until;
                        }
                        this.parsedPos = to;
                        return new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"](__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].none, [], [], to - from);
                    },
                    stoppedAt: null,
                    stopAt () {}
                };
                return parser;
            }
        };
    }
    /**
    @internal
    */ isDone(upto) {
        upto = Math.min(upto, this.state.doc.length);
        let frags = this.fragments;
        return this.treeLen >= upto && frags.length && frags[0].from == 0 && frags[0].to >= upto;
    }
    /**
    Get the context for the current parse, or `null` if no editor
    parse is in progress.
    */ static get() {
        return currentContext;
    }
}
function cutFragments(fragments, from, to) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TreeFragment"].applyChanges(fragments, [
        {
            fromA: from,
            toA: to,
            fromB: from,
            toB: to
        }
    ]);
}
class LanguageState {
    constructor(// A mutable parse state that is used to preserve work done during
    // the lifetime of a state when moving to the next state.
    context){
        this.context = context;
        this.tree = context.tree;
    }
    apply(tr) {
        if (!tr.docChanged && this.tree == this.context.tree) return this;
        let newCx = this.context.changes(tr.changes, tr.state);
        // If the previous parse wasn't done, go forward only up to its
        // end position or the end of the viewport, to avoid slowing down
        // state updates with parse work beyond the viewport.
        let upto = this.context.treeLen == tr.startState.doc.length ? undefined : Math.max(tr.changes.mapPos(this.context.treeLen), newCx.viewport.to);
        if (!newCx.work(20 /* Work.Apply */ , upto)) newCx.takeTree();
        return new LanguageState(newCx);
    }
    static init(state) {
        let vpTo = Math.min(3000 /* Work.InitViewport */ , state.doc.length);
        let parseState = ParseContext.create(state.facet(language).parser, state, {
            from: 0,
            to: vpTo
        });
        if (!parseState.work(20 /* Work.Apply */ , vpTo)) parseState.takeTree();
        return new LanguageState(parseState);
    }
}
Language.state = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create: LanguageState.init,
    update (value, tr) {
        for (let e of tr.effects)if (e.is(Language.setState)) return e.value;
        if (tr.startState.facet(language) != tr.state.facet(language)) return LanguageState.init(tr.state);
        return value.apply(tr);
    }
});
let requestIdle = (callback)=>{
    let timeout = setTimeout(()=>callback(), 500 /* Work.MaxPause */ );
    return ()=>clearTimeout(timeout);
};
if (typeof requestIdleCallback != "undefined") requestIdle = (callback)=>{
    let idle = -1, timeout = setTimeout(()=>{
        idle = requestIdleCallback(callback, {
            timeout: 500 /* Work.MaxPause */  - 100 /* Work.MinPause */ 
        });
    }, 100 /* Work.MinPause */ );
    return ()=>idle < 0 ? clearTimeout(timeout) : cancelIdleCallback(idle);
};
const isInputPending = typeof navigator != "undefined" && ((_a = navigator.scheduling) === null || _a === void 0 ? void 0 : _a.isInputPending) ? ()=>navigator.scheduling.isInputPending() : null;
const parseWorker = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewPlugin"].fromClass(class ParseWorker {
    constructor(view){
        this.view = view;
        this.working = null;
        this.workScheduled = 0;
        // End of the current time chunk
        this.chunkEnd = -1;
        // Milliseconds of budget left for this chunk
        this.chunkBudget = -1;
        this.work = this.work.bind(this);
        this.scheduleWork();
    }
    update(update) {
        let cx = this.view.state.field(Language.state).context;
        if (cx.updateViewport(update.view.viewport) || this.view.viewport.to > cx.treeLen) this.scheduleWork();
        if (update.docChanged || update.selectionSet) {
            if (this.view.hasFocus) this.chunkBudget += 50 /* Work.ChangeBonus */ ;
            this.scheduleWork();
        }
        this.checkAsyncSchedule(cx);
    }
    scheduleWork() {
        if (this.working) return;
        let { state } = this.view, field = state.field(Language.state);
        if (field.tree != field.context.tree || !field.context.isDone(state.doc.length)) this.working = requestIdle(this.work);
    }
    work(deadline) {
        this.working = null;
        let now = Date.now();
        if (this.chunkEnd < now && (this.chunkEnd < 0 || this.view.hasFocus)) {
            this.chunkEnd = now + 30000 /* Work.ChunkTime */ ;
            this.chunkBudget = 3000 /* Work.ChunkBudget */ ;
        }
        if (this.chunkBudget <= 0) return; // No more budget
        let { state, viewport: { to: vpTo } } = this.view, field = state.field(Language.state);
        if (field.tree == field.context.tree && field.context.isDone(vpTo + 100000 /* Work.MaxParseAhead */ )) return;
        let endTime = Date.now() + Math.min(this.chunkBudget, 100 /* Work.Slice */ , deadline && !isInputPending ? Math.max(25 /* Work.MinSlice */ , deadline.timeRemaining() - 5) : 1e9);
        let viewportFirst = field.context.treeLen < vpTo && state.doc.length > vpTo + 1000;
        let done = field.context.work(()=>{
            return isInputPending && isInputPending() || Date.now() > endTime;
        }, vpTo + (viewportFirst ? 0 : 100000 /* Work.MaxParseAhead */ ));
        this.chunkBudget -= Date.now() - now;
        if (done || this.chunkBudget <= 0) {
            field.context.takeTree();
            this.view.dispatch({
                effects: Language.setState.of(new LanguageState(field.context))
            });
        }
        if (this.chunkBudget > 0 && !(done && !viewportFirst)) this.scheduleWork();
        this.checkAsyncSchedule(field.context);
    }
    checkAsyncSchedule(cx) {
        if (cx.scheduleOn) {
            this.workScheduled++;
            cx.scheduleOn.then(()=>this.scheduleWork()).catch((err)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logException"])(this.view.state, err)).then(()=>this.workScheduled--);
            cx.scheduleOn = null;
        }
    }
    destroy() {
        if (this.working) this.working();
    }
    isWorking() {
        return !!(this.working || this.workScheduled > 0);
    }
}, {
    eventHandlers: {
        focus () {
            this.scheduleWork();
        }
    }
});
/**
The facet used to associate a language with an editor state. Used
by `Language` object's `extension` property (so you don't need to
manually wrap your languages in this). Can be used to access the
current language on a state.
*/ const language = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (languages) {
        return languages.length ? languages[0] : null;
    },
    enables: (language)=>[
            Language.state,
            parseWorker,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].contentAttributes.compute([
                language
            ], (state)=>{
                let lang = state.facet(language);
                return lang && lang.name ? {
                    "data-language": lang.name
                } : {};
            })
        ]
});
/**
This class bundles a [language](https://codemirror.net/6/docs/ref/#language.Language) with an
optional set of supporting extensions. Language packages are
encouraged to export a function that optionally takes a
configuration object and returns a `LanguageSupport` instance, as
the main way for client code to use the package.
*/ class LanguageSupport {
    /**
    Create a language support object.
    */ constructor(/**
    The language object.
    */ language, /**
    An optional set of supporting extensions. When nesting a
    language in another language, the outer language is encouraged
    to include the supporting extensions for its inner languages
    in its own set of support extensions.
    */ support = []){
        this.language = language;
        this.support = support;
        this.extension = [
            language,
            support
        ];
    }
}
/**
Language descriptions are used to store metadata about languages
and to dynamically load them. Their main role is finding the
appropriate language for a filename or dynamically loading nested
parsers.
*/ class LanguageDescription {
    constructor(/**
    The name of this language.
    */ name, /**
    Alternative names for the mode (lowercased, includes `this.name`).
    */ alias, /**
    File extensions associated with this language.
    */ extensions, /**
    Optional filename pattern that should be associated with this
    language.
    */ filename, loadFunc, /**
    If the language has been loaded, this will hold its value.
    */ support = undefined){
        this.name = name;
        this.alias = alias;
        this.extensions = extensions;
        this.filename = filename;
        this.loadFunc = loadFunc;
        this.support = support;
        this.loading = null;
    }
    /**
    Start loading the the language. Will return a promise that
    resolves to a [`LanguageSupport`](https://codemirror.net/6/docs/ref/#language.LanguageSupport)
    object when the language successfully loads.
    */ load() {
        return this.loading || (this.loading = this.loadFunc().then((support)=>this.support = support, (err)=>{
            this.loading = null;
            throw err;
        }));
    }
    /**
    Create a language description.
    */ static of(spec) {
        let { load, support } = spec;
        if (!load) {
            if (!support) throw new RangeError("Must pass either 'load' or 'support' to LanguageDescription.of");
            load = ()=>Promise.resolve(support);
        }
        return new LanguageDescription(spec.name, (spec.alias || []).concat(spec.name).map((s)=>s.toLowerCase()), spec.extensions || [], spec.filename, load, support);
    }
    /**
    Look for a language in the given array of descriptions that
    matches the filename. Will first match
    [`filename`](https://codemirror.net/6/docs/ref/#language.LanguageDescription.filename) patterns,
    and then [extensions](https://codemirror.net/6/docs/ref/#language.LanguageDescription.extensions),
    and return the first language that matches.
    */ static matchFilename(descs, filename) {
        for (let d of descs)if (d.filename && d.filename.test(filename)) return d;
        let ext = /\.([^.]+)$/.exec(filename);
        if (ext) {
            for (let d of descs)if (d.extensions.indexOf(ext[1]) > -1) return d;
        }
        return null;
    }
    /**
    Look for a language whose name or alias matches the the given
    name (case-insensitively). If `fuzzy` is true, and no direct
    matchs is found, this'll also search for a language whose name
    or alias occurs in the string (for names shorter than three
    characters, only when surrounded by non-word characters).
    */ static matchLanguageName(descs, name, fuzzy = true) {
        name = name.toLowerCase();
        for (let d of descs)if (d.alias.some((a)=>a == name)) return d;
        if (fuzzy) for (let d of descs)for (let a of d.alias){
            let found = name.indexOf(a);
            if (found > -1 && (a.length > 2 || !/\w/.test(name[found - 1]) && !/\w/.test(name[found + a.length]))) return d;
        }
        return null;
    }
}
/**
Facet that defines a way to provide a function that computes the
appropriate indentation depth, as a column number (see
[`indentString`](https://codemirror.net/6/docs/ref/#language.indentString)), at the start of a given
line. A return value of `null` indicates no indentation can be
determined, and the line should inherit the indentation of the one
above it. A return value of `undefined` defers to the next indent
service.
*/ const indentService = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define();
/**
Facet for overriding the unit by which indentation happens. Should
be a string consisting entirely of the same whitespace character.
When not set, this defaults to 2 spaces.
*/ const indentUnit = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine: (values)=>{
        if (!values.length) return "  ";
        let unit = values[0];
        if (!unit || /\S/.test(unit) || Array.from(unit).some((e)=>e != unit[0])) throw new Error("Invalid indent unit: " + JSON.stringify(values[0]));
        return unit;
    }
});
/**
Return the _column width_ of an indent unit in the state.
Determined by the [`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit)
facet, and [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) when that
contains tabs.
*/ function getIndentUnit(state) {
    let unit = state.facet(indentUnit);
    return unit.charCodeAt(0) == 9 ? state.tabSize * unit.length : unit.length;
}
/**
Create an indentation string that covers columns 0 to `cols`.
Will use tabs for as much of the columns as possible when the
[`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit) facet contains
tabs.
*/ function indentString(state, cols) {
    let result = "", ts = state.tabSize, ch = state.facet(indentUnit)[0];
    if (ch == "\t") {
        while(cols >= ts){
            result += "\t";
            cols -= ts;
        }
        ch = " ";
    }
    for(let i = 0; i < cols; i++)result += ch;
    return result;
}
/**
Get the indentation, as a column number, at the given position.
Will first consult any [indent services](https://codemirror.net/6/docs/ref/#language.indentService)
that are registered, and if none of those return an indentation,
this will check the syntax tree for the [indent node
prop](https://codemirror.net/6/docs/ref/#language.indentNodeProp) and use that if found. Returns a
number when an indentation could be determined, and null
otherwise.
*/ function getIndentation(context, pos) {
    if (context instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorState"]) context = new IndentContext(context);
    for (let service of context.state.facet(indentService)){
        let result = service(context, pos);
        if (result !== undefined) return result;
    }
    let tree = syntaxTree(context.state);
    return tree.length >= pos ? syntaxIndentation(context, tree, pos) : null;
}
/**
Create a change set that auto-indents all lines touched by the
given document range.
*/ function indentRange(state, from, to) {
    let updated = Object.create(null);
    let context = new IndentContext(state, {
        overrideIndentation: (start)=>{
            var _a;
            return (_a = updated[start]) !== null && _a !== void 0 ? _a : -1;
        }
    });
    let changes = [];
    for(let pos = from; pos <= to;){
        let line = state.doc.lineAt(pos);
        pos = line.to + 1;
        let indent = getIndentation(context, line.from);
        if (indent == null) continue;
        if (!/\S/.test(line.text)) indent = 0;
        let cur = /^\s*/.exec(line.text)[0];
        let norm = indentString(state, indent);
        if (cur != norm) {
            updated[line.from] = indent;
            changes.push({
                from: line.from,
                to: line.from + cur.length,
                insert: norm
            });
        }
    }
    return state.changes(changes);
}
/**
Indentation contexts are used when calling [indentation
services](https://codemirror.net/6/docs/ref/#language.indentService). They provide helper utilities
useful in indentation logic, and can selectively override the
indentation reported for some lines.
*/ class IndentContext {
    /**
    Create an indent context.
    */ constructor(/**
    The editor state.
    */ state, /**
    @internal
    */ options = {}){
        this.state = state;
        this.options = options;
        this.unit = getIndentUnit(state);
    }
    /**
    Get a description of the line at the given position, taking
    [simulated line
    breaks](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
    into account. If there is such a break at `pos`, the `bias`
    argument determines whether the part of the line line before or
    after the break is used.
    */ lineAt(pos, bias = 1) {
        let line = this.state.doc.lineAt(pos);
        let { simulateBreak, simulateDoubleBreak } = this.options;
        if (simulateBreak != null && simulateBreak >= line.from && simulateBreak <= line.to) {
            if (simulateDoubleBreak && simulateBreak == pos) return {
                text: "",
                from: pos
            };
            else if (bias < 0 ? simulateBreak < pos : simulateBreak <= pos) return {
                text: line.text.slice(simulateBreak - line.from),
                from: simulateBreak
            };
            else return {
                text: line.text.slice(0, simulateBreak - line.from),
                from: line.from
            };
        }
        return line;
    }
    /**
    Get the text directly after `pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */ textAfterPos(pos, bias = 1) {
        if (this.options.simulateDoubleBreak && pos == this.options.simulateBreak) return "";
        let { text, from } = this.lineAt(pos, bias);
        return text.slice(pos - from, Math.min(text.length, pos + 100 - from));
    }
    /**
    Find the column for the given position.
    */ column(pos, bias = 1) {
        let { text, from } = this.lineAt(pos, bias);
        let result = this.countColumn(text, pos - from);
        let override = this.options.overrideIndentation ? this.options.overrideIndentation(from) : -1;
        if (override > -1) result += override - this.countColumn(text, text.search(/\S|$/));
        return result;
    }
    /**
    Find the column position (taking tabs into account) of the given
    position in the given string.
    */ countColumn(line, pos = line.length) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countColumn"])(line, this.state.tabSize, pos);
    }
    /**
    Find the indentation column of the line at the given point.
    */ lineIndent(pos, bias = 1) {
        let { text, from } = this.lineAt(pos, bias);
        let override = this.options.overrideIndentation;
        if (override) {
            let overriden = override(from);
            if (overriden > -1) return overriden;
        }
        return this.countColumn(text, text.search(/\S|$/));
    }
    /**
    Returns the [simulated line
    break](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
    for this context, if any.
    */ get simulatedBreak() {
        return this.options.simulateBreak || null;
    }
}
/**
A syntax tree node prop used to associate indentation strategies
with node types. Such a strategy is a function from an indentation
context to a column number (see also
[`indentString`](https://codemirror.net/6/docs/ref/#language.indentString)) or null, where null
indicates that no definitive indentation can be determined.
*/ const indentNodeProp = /*@__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]();
// Compute the indentation for a given position from the syntax tree.
function syntaxIndentation(cx, ast, pos) {
    let stack = ast.resolveStack(pos);
    let inner = ast.resolveInner(pos, -1).resolve(pos, 0).enterUnfinishedNodesBefore(pos);
    if (inner != stack.node) {
        let add = [];
        for(let cur = inner; cur && !(cur.from < stack.node.from || cur.to > stack.node.to || cur.from == stack.node.from && cur.type == stack.node.type); cur = cur.parent)add.push(cur);
        for(let i = add.length - 1; i >= 0; i--)stack = {
            node: add[i],
            next: stack
        };
    }
    return indentFor(stack, cx, pos);
}
function indentFor(stack, cx, pos) {
    for(let cur = stack; cur; cur = cur.next){
        let strategy = indentStrategy(cur.node);
        if (strategy) return strategy(TreeIndentContext.create(cx, pos, cur));
    }
    return 0;
}
function ignoreClosed(cx) {
    return cx.pos == cx.options.simulateBreak && cx.options.simulateDoubleBreak;
}
function indentStrategy(tree) {
    let strategy = tree.type.prop(indentNodeProp);
    if (strategy) return strategy;
    let first = tree.firstChild, close;
    if (first && (close = first.type.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].closedBy))) {
        let last = tree.lastChild, closed = last && close.indexOf(last.name) > -1;
        return (cx)=>delimitedStrategy(cx, true, 1, undefined, closed && !ignoreClosed(cx) ? last.from : undefined);
    }
    return tree.parent == null ? topIndent : null;
}
function topIndent() {
    return 0;
}
/**
Objects of this type provide context information and helper
methods to indentation functions registered on syntax nodes.
*/ class TreeIndentContext extends IndentContext {
    constructor(base, /**
    The position at which indentation is being computed.
    */ pos, /**
    @internal
    */ context){
        super(base.state, base.options);
        this.base = base;
        this.pos = pos;
        this.context = context;
    }
    /**
    The syntax tree node to which the indentation strategy
    applies.
    */ get node() {
        return this.context.node;
    }
    /**
    @internal
    */ static create(base, pos, context) {
        return new TreeIndentContext(base, pos, context);
    }
    /**
    Get the text directly after `this.pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */ get textAfter() {
        return this.textAfterPos(this.pos);
    }
    /**
    Get the indentation at the reference line for `this.node`, which
    is the line on which it starts, unless there is a node that is
    _not_ a parent of this node covering the start of that line. If
    so, the line at the start of that node is tried, again skipping
    on if it is covered by another such node.
    */ get baseIndent() {
        return this.baseIndentFor(this.node);
    }
    /**
    Get the indentation for the reference line of the given node
    (see [`baseIndent`](https://codemirror.net/6/docs/ref/#language.TreeIndentContext.baseIndent)).
    */ baseIndentFor(node) {
        let line = this.state.doc.lineAt(node.from);
        // Skip line starts that are covered by a sibling (or cousin, etc)
        for(;;){
            let atBreak = node.resolve(line.from);
            while(atBreak.parent && atBreak.parent.from == atBreak.from)atBreak = atBreak.parent;
            if (isParent(atBreak, node)) break;
            line = this.state.doc.lineAt(atBreak.from);
        }
        return this.lineIndent(line.from);
    }
    /**
    Continue looking for indentations in the node's parent nodes,
    and return the result of that.
    */ continue() {
        return indentFor(this.context.next, this.base, this.pos);
    }
}
function isParent(parent, of) {
    for(let cur = of; cur; cur = cur.parent)if (parent == cur) return true;
    return false;
}
// Check whether a delimited node is aligned (meaning there are
// non-skipped nodes on the same line as the opening delimiter). And
// if so, return the opening token.
function bracketedAligned(context) {
    let tree = context.node;
    let openToken = tree.childAfter(tree.from), last = tree.lastChild;
    if (!openToken) return null;
    let sim = context.options.simulateBreak;
    let openLine = context.state.doc.lineAt(openToken.from);
    let lineEnd = sim == null || sim <= openLine.from ? openLine.to : Math.min(openLine.to, sim);
    for(let pos = openToken.to;;){
        let next = tree.childAfter(pos);
        if (!next || next == last) return null;
        if (!next.type.isSkipped) {
            if (next.from >= lineEnd) return null;
            let space = /^ */.exec(openLine.text.slice(openToken.to - openLine.from))[0].length;
            return {
                from: openToken.from,
                to: openToken.to + space
            };
        }
        pos = next.to;
    }
}
/**
An indentation strategy for delimited (usually bracketed) nodes.
Will, by default, indent one unit more than the parent's base
indent unless the line starts with a closing token. When `align`
is true and there are non-skipped nodes on the node's opening
line, the content of the node will be aligned with the end of the
opening node, like this:

    foo(bar,
        baz)
*/ function delimitedIndent({ closing, align = true, units = 1 }) {
    return (context)=>delimitedStrategy(context, align, units, closing);
}
function delimitedStrategy(context, align, units, closing, closedAt) {
    let after = context.textAfter, space = after.match(/^\s*/)[0].length;
    let closed = closing && after.slice(space, space + closing.length) == closing || closedAt == context.pos + space;
    let aligned = align ? bracketedAligned(context) : null;
    if (aligned) return closed ? context.column(aligned.from) : context.column(aligned.to);
    return context.baseIndent + (closed ? 0 : context.unit * units);
}
/**
An indentation strategy that aligns a node's content to its base
indentation.
*/ const flatIndent = (context)=>context.baseIndent;
/**
Creates an indentation strategy that, by default, indents
continued lines one unit more than the node's base indentation.
You can provide `except` to prevent indentation of lines that
match a pattern (for example `/^else\b/` in `if`/`else`
constructs), and you can change the amount of units used with the
`units` option.
*/ function continuedIndent({ except, units = 1 } = {}) {
    return (context)=>{
        let matchExcept = except && except.test(context.textAfter);
        return context.baseIndent + (matchExcept ? 0 : units * context.unit);
    };
}
const DontIndentBeyond = 200;
/**
Enables reindentation on input. When a language defines an
`indentOnInput` field in its [language
data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt), which must hold a regular
expression, the line at the cursor will be reindented whenever new
text is typed and the input from the start of the line up to the
cursor matches that regexp.

To avoid unneccesary reindents, it is recommended to start the
regexp with `^` (usually followed by `\s*`), and end it with `$`.
For example, `/^\s*\}$/` will reindent when a closing brace is
added at the start of a line.
*/ function indentOnInput() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorState"].transactionFilter.of((tr)=>{
        if (!tr.docChanged || !tr.isUserEvent("input.type") && !tr.isUserEvent("input.complete")) return tr;
        let rules = tr.startState.languageDataAt("indentOnInput", tr.startState.selection.main.head);
        if (!rules.length) return tr;
        let doc = tr.newDoc, { head } = tr.newSelection.main, line = doc.lineAt(head);
        if (head > line.from + DontIndentBeyond) return tr;
        let lineStart = doc.sliceString(line.from, head);
        if (!rules.some((r)=>r.test(lineStart))) return tr;
        let { state } = tr, last = -1, changes = [];
        for (let { head } of state.selection.ranges){
            let line = state.doc.lineAt(head);
            if (line.from == last) continue;
            last = line.from;
            let indent = getIndentation(state, line.from);
            if (indent == null) continue;
            let cur = /^\s*/.exec(line.text)[0];
            let norm = indentString(state, indent);
            if (cur != norm) changes.push({
                from: line.from,
                to: line.from + cur.length,
                insert: norm
            });
        }
        return changes.length ? [
            tr,
            {
                changes,
                sequential: true
            }
        ] : tr;
    });
}
/**
A facet that registers a code folding service. When called with
the extent of a line, such a function should return a foldable
range that starts on that line (but continues beyond it), if one
can be found.
*/ const foldService = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define();
/**
This node prop is used to associate folding information with
syntax node types. Given a syntax node, it should check whether
that tree is foldable and return the range that can be collapsed
when it is.
*/ const foldNodeProp = /*@__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]();
/**
[Fold](https://codemirror.net/6/docs/ref/#language.foldNodeProp) function that folds everything but
the first and the last child of a syntax node. Useful for nodes
that start and end with delimiters.
*/ function foldInside(node) {
    let first = node.firstChild, last = node.lastChild;
    return first && first.to < last.from ? {
        from: first.to,
        to: last.type.isError ? node.to : last.from
    } : null;
}
function syntaxFolding(state, start, end) {
    let tree = syntaxTree(state);
    if (tree.length < end) return null;
    let stack = tree.resolveStack(end, 1);
    let found = null;
    for(let iter = stack; iter; iter = iter.next){
        let cur = iter.node;
        if (cur.to <= end || cur.from > end) continue;
        if (found && cur.from < start) break;
        let prop = cur.type.prop(foldNodeProp);
        if (prop && (cur.to < tree.length - 50 || tree.length == state.doc.length || !isUnfinished(cur))) {
            let value = prop(cur, state);
            if (value && value.from <= end && value.from >= start && value.to > end) found = value;
        }
    }
    return found;
}
function isUnfinished(node) {
    let ch = node.lastChild;
    return ch && ch.to == node.to && ch.type.isError;
}
/**
Check whether the given line is foldable. First asks any fold
services registered through
[`foldService`](https://codemirror.net/6/docs/ref/#language.foldService), and if none of them return
a result, tries to query the [fold node
prop](https://codemirror.net/6/docs/ref/#language.foldNodeProp) of syntax nodes that cover the end
of the line.
*/ function foldable(state, lineStart, lineEnd) {
    for (let service of state.facet(foldService)){
        let result = service(state, lineStart, lineEnd);
        if (result) return result;
    }
    return syntaxFolding(state, lineStart, lineEnd);
}
function mapRange(range, mapping) {
    let from = mapping.mapPos(range.from, 1), to = mapping.mapPos(range.to, -1);
    return from >= to ? undefined : {
        from,
        to
    };
}
/**
State effect that can be attached to a transaction to fold the
given range. (You probably only need this in exceptional
circumstances—usually you'll just want to let
[`foldCode`](https://codemirror.net/6/docs/ref/#language.foldCode) and the [fold
gutter](https://codemirror.net/6/docs/ref/#language.foldGutter) create the transactions.)
*/ const foldEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define({
    map: mapRange
});
/**
State effect that unfolds the given range (if it was folded).
*/ const unfoldEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define({
    map: mapRange
});
function selectedLines(view) {
    let lines = [];
    for (let { head } of view.state.selection.ranges){
        if (lines.some((l)=>l.from <= head && l.to >= head)) continue;
        lines.push(view.lineBlockAt(head));
    }
    return lines;
}
/**
The state field that stores the folded ranges (as a [decoration
set](https://codemirror.net/6/docs/ref/#view.DecorationSet)). Can be passed to
[`EditorState.toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) and
[`fromJSON`](https://codemirror.net/6/docs/ref/#state.EditorState^fromJSON) to serialize the fold
state.
*/ const foldState = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create () {
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].none;
    },
    update (folded, tr) {
        if (tr.isUserEvent("delete")) tr.changes.iterChangedRanges((fromA, toA)=>folded = clearTouchedFolds(folded, fromA, toA));
        folded = folded.map(tr.changes);
        for (let e of tr.effects){
            if (e.is(foldEffect) && !foldExists(folded, e.value.from, e.value.to)) {
                let { preparePlaceholder } = tr.state.facet(foldConfig);
                let widget = !preparePlaceholder ? foldWidget : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].replace({
                    widget: new PreparedFoldWidget(preparePlaceholder(tr.state, e.value))
                });
                folded = folded.update({
                    add: [
                        widget.range(e.value.from, e.value.to)
                    ]
                });
            } else if (e.is(unfoldEffect)) {
                folded = folded.update({
                    filter: (from, to)=>e.value.from != from || e.value.to != to,
                    filterFrom: e.value.from,
                    filterTo: e.value.to
                });
            }
        }
        // Clear folded ranges that cover the selection head
        if (tr.selection) folded = clearTouchedFolds(folded, tr.selection.main.head);
        return folded;
    },
    provide: (f)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].decorations.from(f),
    toJSON (folded, state) {
        let ranges = [];
        folded.between(0, state.doc.length, (from, to)=>{
            ranges.push(from, to);
        });
        return ranges;
    },
    fromJSON (value) {
        if (!Array.isArray(value) || value.length % 2) throw new RangeError("Invalid JSON for fold state");
        let ranges = [];
        for(let i = 0; i < value.length;){
            let from = value[i++], to = value[i++];
            if (typeof from != "number" || typeof to != "number") throw new RangeError("Invalid JSON for fold state");
            ranges.push(foldWidget.range(from, to));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].set(ranges, true);
    }
});
function clearTouchedFolds(folded, from, to = from) {
    let touched = false;
    folded.between(from, to, (a, b)=>{
        if (a < to && b > from) touched = true;
    });
    return !touched ? folded : folded.update({
        filterFrom: from,
        filterTo: to,
        filter: (a, b)=>a >= to || b <= from
    });
}
/**
Get a [range set](https://codemirror.net/6/docs/ref/#state.RangeSet) containing the folded ranges
in the given state.
*/ function foldedRanges(state) {
    return state.field(foldState, false) || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeSet"].empty;
}
function findFold(state, from, to) {
    var _a;
    let found = null;
    (_a = state.field(foldState, false)) === null || _a === void 0 ? void 0 : _a.between(from, to, (from, to)=>{
        if (!found || found.from > from) found = {
            from,
            to
        };
    });
    return found;
}
function foldExists(folded, from, to) {
    let found = false;
    folded.between(from, from, (a, b)=>{
        if (a == from && b == to) found = true;
    });
    return found;
}
function maybeEnable(state, other) {
    return state.field(foldState, false) ? other : other.concat(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].appendConfig.of(codeFolding()));
}
/**
Fold the lines that are selected, if possible.
*/ const foldCode = (view)=>{
    for (let line of selectedLines(view)){
        let range = foldable(view.state, line.from, line.to);
        if (range) {
            view.dispatch({
                effects: maybeEnable(view.state, [
                    foldEffect.of(range),
                    announceFold(view, range)
                ])
            });
            return true;
        }
    }
    return false;
};
/**
Unfold folded ranges on selected lines.
*/ const unfoldCode = (view)=>{
    if (!view.state.field(foldState, false)) return false;
    let effects = [];
    for (let line of selectedLines(view)){
        let folded = findFold(view.state, line.from, line.to);
        if (folded) effects.push(unfoldEffect.of(folded), announceFold(view, folded, false));
    }
    if (effects.length) view.dispatch({
        effects
    });
    return effects.length > 0;
};
function announceFold(view, range, fold = true) {
    let lineFrom = view.state.doc.lineAt(range.from).number, lineTo = view.state.doc.lineAt(range.to).number;
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].announce.of(`${view.state.phrase(fold ? "Folded lines" : "Unfolded lines")} ${lineFrom} ${view.state.phrase("to")} ${lineTo}.`);
}
/**
Fold all top-level foldable ranges. Note that, in most cases,
folding information will depend on the [syntax
tree](https://codemirror.net/6/docs/ref/#language.syntaxTree), and folding everything may not work
reliably when the document hasn't been fully parsed (either
because the editor state was only just initialized, or because the
document is so big that the parser decided not to parse it
entirely).
*/ const foldAll = (view)=>{
    let { state } = view, effects = [];
    for(let pos = 0; pos < state.doc.length;){
        let line = view.lineBlockAt(pos), range = foldable(state, line.from, line.to);
        if (range) effects.push(foldEffect.of(range));
        pos = (range ? view.lineBlockAt(range.to) : line).to + 1;
    }
    if (effects.length) view.dispatch({
        effects: maybeEnable(view.state, effects)
    });
    return !!effects.length;
};
/**
Unfold all folded code.
*/ const unfoldAll = (view)=>{
    let field = view.state.field(foldState, false);
    if (!field || !field.size) return false;
    let effects = [];
    field.between(0, view.state.doc.length, (from, to)=>{
        effects.push(unfoldEffect.of({
            from,
            to
        }));
    });
    view.dispatch({
        effects
    });
    return true;
};
// Find the foldable region containing the given line, if one exists
function foldableContainer(view, lineBlock) {
    // Look backwards through line blocks until we find a foldable region that
    // intersects with the line
    for(let line = lineBlock;;){
        let foldableRegion = foldable(view.state, line.from, line.to);
        if (foldableRegion && foldableRegion.to > lineBlock.from) return foldableRegion;
        if (!line.from) return null;
        line = view.lineBlockAt(line.from - 1);
    }
}
/**
Toggle folding at cursors. Unfolds if there is an existing fold
starting in that line, tries to find a foldable range around it
otherwise.
*/ const toggleFold = (view)=>{
    let effects = [];
    for (let line of selectedLines(view)){
        let folded = findFold(view.state, line.from, line.to);
        if (folded) {
            effects.push(unfoldEffect.of(folded), announceFold(view, folded, false));
        } else {
            let foldRange = foldableContainer(view, line);
            if (foldRange) effects.push(foldEffect.of(foldRange), announceFold(view, foldRange));
        }
    }
    if (effects.length > 0) view.dispatch({
        effects: maybeEnable(view.state, effects)
    });
    return !!effects.length;
};
/**
Default fold-related key bindings.

 - Ctrl-Shift-[ (Cmd-Alt-[ on macOS): [`foldCode`](https://codemirror.net/6/docs/ref/#language.foldCode).
 - Ctrl-Shift-] (Cmd-Alt-] on macOS): [`unfoldCode`](https://codemirror.net/6/docs/ref/#language.unfoldCode).
 - Ctrl-Alt-[: [`foldAll`](https://codemirror.net/6/docs/ref/#language.foldAll).
 - Ctrl-Alt-]: [`unfoldAll`](https://codemirror.net/6/docs/ref/#language.unfoldAll).
*/ const foldKeymap = [
    {
        key: "Ctrl-Shift-[",
        mac: "Cmd-Alt-[",
        run: foldCode
    },
    {
        key: "Ctrl-Shift-]",
        mac: "Cmd-Alt-]",
        run: unfoldCode
    },
    {
        key: "Ctrl-Alt-[",
        run: foldAll
    },
    {
        key: "Ctrl-Alt-]",
        run: unfoldAll
    }
];
const defaultConfig = {
    placeholderDOM: null,
    preparePlaceholder: null,
    placeholderText: "…"
};
const foldConfig = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (values) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineConfig"])(values, defaultConfig);
    }
});
/**
Create an extension that configures code folding.
*/ function codeFolding(config) {
    let result = [
        foldState,
        baseTheme$1
    ];
    if (config) result.push(foldConfig.of(config));
    return result;
}
function widgetToDOM(view, prepared) {
    let { state } = view, conf = state.facet(foldConfig);
    let onclick = (event)=>{
        let line = view.lineBlockAt(view.posAtDOM(event.target));
        let folded = findFold(view.state, line.from, line.to);
        if (folded) view.dispatch({
            effects: unfoldEffect.of(folded)
        });
        event.preventDefault();
    };
    if (conf.placeholderDOM) return conf.placeholderDOM(view, onclick, prepared);
    let element = document.createElement("span");
    element.textContent = conf.placeholderText;
    element.setAttribute("aria-label", state.phrase("folded code"));
    element.title = state.phrase("unfold");
    element.className = "cm-foldPlaceholder";
    element.onclick = onclick;
    return element;
}
const foldWidget = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].replace({
    widget: /*@__PURE__*/ new class extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetType"] {
        toDOM(view) {
            return widgetToDOM(view, null);
        }
    }
});
class PreparedFoldWidget extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetType"] {
    constructor(value){
        super();
        this.value = value;
    }
    eq(other) {
        return this.value == other.value;
    }
    toDOM(view) {
        return widgetToDOM(view, this.value);
    }
}
const foldGutterDefaults = {
    openText: "⌄",
    closedText: "›",
    markerDOM: null,
    domEventHandlers: {},
    foldingChanged: ()=>false
};
class FoldMarker extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GutterMarker"] {
    constructor(config, open){
        super();
        this.config = config;
        this.open = open;
    }
    eq(other) {
        return this.config == other.config && this.open == other.open;
    }
    toDOM(view) {
        if (this.config.markerDOM) return this.config.markerDOM(this.open);
        let span = document.createElement("span");
        span.textContent = this.open ? this.config.openText : this.config.closedText;
        span.title = view.state.phrase(this.open ? "Fold line" : "Unfold line");
        return span;
    }
}
/**
Create an extension that registers a fold gutter, which shows a
fold status indicator before foldable lines (which can be clicked
to fold or unfold the line).
*/ function foldGutter(config = {}) {
    let fullConfig = {
        ...foldGutterDefaults,
        ...config
    };
    let canFold = new FoldMarker(fullConfig, true), canUnfold = new FoldMarker(fullConfig, false);
    let markers = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewPlugin"].fromClass(class {
        constructor(view){
            this.from = view.viewport.from;
            this.markers = this.buildMarkers(view);
        }
        update(update) {
            if (update.docChanged || update.viewportChanged || update.startState.facet(language) != update.state.facet(language) || update.startState.field(foldState, false) != update.state.field(foldState, false) || syntaxTree(update.startState) != syntaxTree(update.state) || fullConfig.foldingChanged(update)) this.markers = this.buildMarkers(update.view);
        }
        buildMarkers(view) {
            let builder = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeSetBuilder"]();
            for (let line of view.viewportLineBlocks){
                let mark = findFold(view.state, line.from, line.to) ? canUnfold : foldable(view.state, line.from, line.to) ? canFold : null;
                if (mark) builder.add(line.from, line.from, mark);
            }
            return builder.finish();
        }
    });
    let { domEventHandlers } = fullConfig;
    return [
        markers,
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gutter"])({
            class: "cm-foldGutter",
            markers (view) {
                var _a;
                return ((_a = view.plugin(markers)) === null || _a === void 0 ? void 0 : _a.markers) || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeSet"].empty;
            },
            initialSpacer () {
                return new FoldMarker(fullConfig, false);
            },
            domEventHandlers: {
                ...domEventHandlers,
                click: (view, line, event)=>{
                    if (domEventHandlers.click && domEventHandlers.click(view, line, event)) return true;
                    let folded = findFold(view.state, line.from, line.to);
                    if (folded) {
                        view.dispatch({
                            effects: unfoldEffect.of(folded)
                        });
                        return true;
                    }
                    let range = foldable(view.state, line.from, line.to);
                    if (range) {
                        view.dispatch({
                            effects: foldEffect.of(range)
                        });
                        return true;
                    }
                    return false;
                }
            }
        }),
        codeFolding()
    ];
}
const baseTheme$1 = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].baseTheme({
    ".cm-foldPlaceholder": {
        backgroundColor: "#eee",
        border: "1px solid #ddd",
        color: "#888",
        borderRadius: ".2em",
        margin: "0 1px",
        padding: "0 1px",
        cursor: "pointer"
    },
    ".cm-foldGutter span": {
        padding: "0 1px",
        cursor: "pointer"
    }
});
/**
A highlight style associates CSS styles with higlighting
[tags](https://lezer.codemirror.net/docs/ref#highlight.Tag).
*/ class HighlightStyle {
    constructor(/**
    The tag styles used to create this highlight style.
    */ specs, options){
        this.specs = specs;
        let modSpec;
        function def(spec) {
            let cls = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$style$2d$mod$2f$src$2f$style$2d$mod$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StyleModule"].newName();
            (modSpec || (modSpec = Object.create(null)))["." + cls] = spec;
            return cls;
        }
        const all = typeof options.all == "string" ? options.all : options.all ? def(options.all) : undefined;
        const scopeOpt = options.scope;
        this.scope = scopeOpt instanceof Language ? (type)=>type.prop(languageDataProp) == scopeOpt.data : scopeOpt ? (type)=>type == scopeOpt : undefined;
        this.style = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tagHighlighter"])(specs.map((style)=>({
                tag: style.tag,
                class: style.class || def(Object.assign({}, style, {
                    tag: null
                }))
            })), {
            all
        }).style;
        this.module = modSpec ? new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$style$2d$mod$2f$src$2f$style$2d$mod$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StyleModule"](modSpec) : null;
        this.themeType = options.themeType;
    }
    /**
    Create a highlighter style that associates the given styles to
    the given tags. The specs must be objects that hold a style tag
    or array of tags in their `tag` property, and either a single
    `class` property providing a static CSS class (for highlighter
    that rely on external styling), or a
    [`style-mod`](https://github.com/marijnh/style-mod#documentation)-style
    set of CSS properties (which define the styling for those tags).
    
    The CSS rules created for a highlighter will be emitted in the
    order of the spec's properties. That means that for elements that
    have multiple tags associated with them, styles defined further
    down in the list will have a higher CSS precedence than styles
    defined earlier.
    */ static define(specs, options) {
        return new HighlightStyle(specs, options || {});
    }
}
const highlighterFacet = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define();
const fallbackHighlighter = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (values) {
        return values.length ? [
            values[0]
        ] : null;
    }
});
function getHighlighters(state) {
    let main = state.facet(highlighterFacet);
    return main.length ? main : state.facet(fallbackHighlighter);
}
/**
Wrap a highlighter in an editor extension that uses it to apply
syntax highlighting to the editor content.

When multiple (non-fallback) styles are provided, the styling
applied is the union of the classes they emit.
*/ function syntaxHighlighting(highlighter, options) {
    let ext = [
        treeHighlighter
    ], themeType;
    if (highlighter instanceof HighlightStyle) {
        if (highlighter.module) ext.push(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].styleModule.of(highlighter.module));
        themeType = highlighter.themeType;
    }
    if (options === null || options === void 0 ? void 0 : options.fallback) ext.push(fallbackHighlighter.of(highlighter));
    else if (themeType) ext.push(highlighterFacet.computeN([
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].darkTheme
    ], (state)=>{
        return state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].darkTheme) == (themeType == "dark") ? [
            highlighter
        ] : [];
    }));
    else ext.push(highlighterFacet.of(highlighter));
    return ext;
}
/**
Returns the CSS classes (if any) that the highlighters active in
the state would assign to the given style
[tags](https://lezer.codemirror.net/docs/ref#highlight.Tag) and
(optional) language
[scope](https://codemirror.net/6/docs/ref/#language.HighlightStyle^define^options.scope).
*/ function highlightingFor(state, tags, scope) {
    let highlighters = getHighlighters(state);
    let result = null;
    if (highlighters) for (let highlighter of highlighters){
        if (!highlighter.scope || scope && highlighter.scope(scope)) {
            let cls = highlighter.style(tags);
            if (cls) result = result ? result + " " + cls : cls;
        }
    }
    return result;
}
class TreeHighlighter {
    constructor(view){
        this.markCache = Object.create(null);
        this.tree = syntaxTree(view.state);
        this.decorations = this.buildDeco(view, getHighlighters(view.state));
        this.decoratedTo = view.viewport.to;
    }
    update(update) {
        let tree = syntaxTree(update.state), highlighters = getHighlighters(update.state);
        let styleChange = highlighters != getHighlighters(update.startState);
        let { viewport } = update.view, decoratedToMapped = update.changes.mapPos(this.decoratedTo, 1);
        if (tree.length < viewport.to && !styleChange && tree.type == this.tree.type && decoratedToMapped >= viewport.to) {
            this.decorations = this.decorations.map(update.changes);
            this.decoratedTo = decoratedToMapped;
        } else if (tree != this.tree || update.viewportChanged || styleChange) {
            this.tree = tree;
            this.decorations = this.buildDeco(update.view, highlighters);
            this.decoratedTo = viewport.to;
        }
    }
    buildDeco(view, highlighters) {
        if (!highlighters || !this.tree.length) return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].none;
        let builder = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeSetBuilder"]();
        for (let { from, to } of view.visibleRanges){
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["highlightTree"])(this.tree, highlighters, (from, to, style)=>{
                builder.add(from, to, this.markCache[style] || (this.markCache[style] = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
                    class: style
                })));
            }, from, to);
        }
        return builder.finish();
    }
}
const treeHighlighter = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Prec"].high(/*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewPlugin"].fromClass(TreeHighlighter, {
    decorations: (v)=>v.decorations
}));
/**
A default highlight style (works well with light themes).
*/ const defaultHighlightStyle = /*@__PURE__*/ HighlightStyle.define([
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].meta,
        color: "#404740"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].link,
        textDecoration: "underline"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].heading,
        textDecoration: "underline",
        fontWeight: "bold"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].emphasis,
        fontStyle: "italic"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].strong,
        fontWeight: "bold"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].strikethrough,
        textDecoration: "line-through"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].keyword,
        color: "#708"
    },
    {
        tag: [
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].atom,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].bool,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].url,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].contentSeparator,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].labelName
        ],
        color: "#219"
    },
    {
        tag: [
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].literal,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].inserted
        ],
        color: "#164"
    },
    {
        tag: [
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].string,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].deleted
        ],
        color: "#a11"
    },
    {
        tag: [
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].regexp,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].escape,
            /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].special(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].string)
        ],
        color: "#e40"
    },
    {
        tag: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].definition(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].variableName),
        color: "#00f"
    },
    {
        tag: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].local(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].variableName),
        color: "#30a"
    },
    {
        tag: [
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].typeName,
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].namespace
        ],
        color: "#085"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].className,
        color: "#167"
    },
    {
        tag: [
            /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].special(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].variableName),
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].macroName
        ],
        color: "#256"
    },
    {
        tag: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].definition(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].propertyName),
        color: "#00c"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].comment,
        color: "#940"
    },
    {
        tag: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].invalid,
        color: "#f00"
    }
]);
const baseTheme = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].baseTheme({
    "&.cm-focused .cm-matchingBracket": {
        backgroundColor: "#328c8252"
    },
    "&.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "#bb555544"
    }
});
const DefaultScanDist = 10000, DefaultBrackets = "()[]{}";
const bracketMatchingConfig = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (configs) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineConfig"])(configs, {
            afterCursor: true,
            brackets: DefaultBrackets,
            maxScanDistance: DefaultScanDist,
            renderMatch: defaultRenderMatch
        });
    }
});
const matchingMark = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
    class: "cm-matchingBracket"
}), nonmatchingMark = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
    class: "cm-nonmatchingBracket"
});
function defaultRenderMatch(match) {
    let decorations = [];
    let mark = match.matched ? matchingMark : nonmatchingMark;
    decorations.push(mark.range(match.start.from, match.start.to));
    if (match.end) decorations.push(mark.range(match.end.from, match.end.to));
    return decorations;
}
const bracketMatchingState = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create () {
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].none;
    },
    update (deco, tr) {
        if (!tr.docChanged && !tr.selection) return deco;
        let decorations = [];
        let config = tr.state.facet(bracketMatchingConfig);
        for (let range of tr.state.selection.ranges){
            if (!range.empty) continue;
            let match = matchBrackets(tr.state, range.head, -1, config) || range.head > 0 && matchBrackets(tr.state, range.head - 1, 1, config) || config.afterCursor && (matchBrackets(tr.state, range.head, 1, config) || range.head < tr.state.doc.length && matchBrackets(tr.state, range.head + 1, -1, config));
            if (match) decorations = decorations.concat(config.renderMatch(match, tr.state));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].set(decorations, true);
    },
    provide: (f)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].decorations.from(f)
});
const bracketMatchingUnique = [
    bracketMatchingState,
    baseTheme
];
/**
Create an extension that enables bracket matching. Whenever the
cursor is next to a bracket, that bracket and the one it matches
are highlighted. Or, when no matching bracket is found, another
highlighting style is used to indicate this.
*/ function bracketMatching(config = {}) {
    return [
        bracketMatchingConfig.of(config),
        bracketMatchingUnique
    ];
}
/**
When larger syntax nodes, such as HTML tags, are marked as
opening/closing, it can be a bit messy to treat the whole node as
a matchable bracket. This node prop allows you to define, for such
a node, a ‘handle’—the part of the node that is highlighted, and
that the cursor must be on to activate highlighting in the first
place.
*/ const bracketMatchingHandle = /*@__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]();
function matchingNodes(node, dir, brackets) {
    let byProp = node.prop(dir < 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].openedBy : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].closedBy);
    if (byProp) return byProp;
    if (node.name.length == 1) {
        let index = brackets.indexOf(node.name);
        if (index > -1 && index % 2 == (dir < 0 ? 1 : 0)) return [
            brackets[index + dir]
        ];
    }
    return null;
}
function findHandle(node) {
    let hasHandle = node.type.prop(bracketMatchingHandle);
    return hasHandle ? hasHandle(node.node) : node;
}
/**
Find the matching bracket for the token at `pos`, scanning
direction `dir`. Only the `brackets` and `maxScanDistance`
properties are used from `config`, if given. Returns null if no
bracket was found at `pos`, or a match result otherwise.
*/ function matchBrackets(state, pos, dir, config = {}) {
    let maxScanDistance = config.maxScanDistance || DefaultScanDist, brackets = config.brackets || DefaultBrackets;
    let tree = syntaxTree(state), node = tree.resolveInner(pos, dir);
    for(let cur = node; cur; cur = cur.parent){
        let matches = matchingNodes(cur.type, dir, brackets);
        if (matches && cur.from < cur.to) {
            let handle = findHandle(cur);
            if (handle && (dir > 0 ? pos >= handle.from && pos < handle.to : pos > handle.from && pos <= handle.to)) return matchMarkedBrackets(state, pos, dir, cur, handle, matches, brackets);
        }
    }
    return matchPlainBrackets(state, pos, dir, tree, node.type, maxScanDistance, brackets);
}
function matchMarkedBrackets(_state, _pos, dir, token, handle, matching, brackets) {
    let parent = token.parent, firstToken = {
        from: handle.from,
        to: handle.to
    };
    let depth = 0, cursor = parent === null || parent === void 0 ? void 0 : parent.cursor();
    if (cursor && (dir < 0 ? cursor.childBefore(token.from) : cursor.childAfter(token.to))) do {
        if (dir < 0 ? cursor.to <= token.from : cursor.from >= token.to) {
            if (depth == 0 && matching.indexOf(cursor.type.name) > -1 && cursor.from < cursor.to) {
                let endHandle = findHandle(cursor);
                return {
                    start: firstToken,
                    end: endHandle ? {
                        from: endHandle.from,
                        to: endHandle.to
                    } : undefined,
                    matched: true
                };
            } else if (matchingNodes(cursor.type, dir, brackets)) {
                depth++;
            } else if (matchingNodes(cursor.type, -dir, brackets)) {
                if (depth == 0) {
                    let endHandle = findHandle(cursor);
                    return {
                        start: firstToken,
                        end: endHandle && endHandle.from < endHandle.to ? {
                            from: endHandle.from,
                            to: endHandle.to
                        } : undefined,
                        matched: false
                    };
                }
                depth--;
            }
        }
    }while (dir < 0 ? cursor.prevSibling() : cursor.nextSibling())
    return {
        start: firstToken,
        matched: false
    };
}
function matchPlainBrackets(state, pos, dir, tree, tokenType, maxScanDistance, brackets) {
    let startCh = dir < 0 ? state.sliceDoc(pos - 1, pos) : state.sliceDoc(pos, pos + 1);
    let bracket = brackets.indexOf(startCh);
    if (bracket < 0 || bracket % 2 == 0 != dir > 0) return null;
    let startToken = {
        from: dir < 0 ? pos - 1 : pos,
        to: dir > 0 ? pos + 1 : pos
    };
    let iter = state.doc.iterRange(pos, dir > 0 ? state.doc.length : 0), depth = 0;
    for(let distance = 0; !iter.next().done && distance <= maxScanDistance;){
        let text = iter.value;
        if (dir < 0) distance += text.length;
        let basePos = pos + distance * dir;
        for(let pos = dir > 0 ? 0 : text.length - 1, end = dir > 0 ? text.length : -1; pos != end; pos += dir){
            let found = brackets.indexOf(text[pos]);
            if (found < 0 || tree.resolveInner(basePos + pos, 1).type != tokenType) continue;
            if (found % 2 == 0 == dir > 0) {
                depth++;
            } else if (depth == 1) {
                return {
                    start: startToken,
                    end: {
                        from: basePos + pos,
                        to: basePos + pos + 1
                    },
                    matched: found >> 1 == bracket >> 1
                };
            } else {
                depth--;
            }
        }
        if (dir > 0) distance += text.length;
    }
    return iter.done ? {
        start: startToken,
        matched: false
    } : null;
}
// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
function countCol(string, end, tabSize, startIndex = 0, startValue = 0) {
    if (end == null) {
        end = string.search(/[^\s\u00a0]/);
        if (end == -1) end = string.length;
    }
    let n = startValue;
    for(let i = startIndex; i < end; i++){
        if (string.charCodeAt(i) == 9) n += tabSize - n % tabSize;
        else n++;
    }
    return n;
}
/**
Encapsulates a single line of input. Given to stream syntax code,
which uses it to tokenize the content.
*/ class StringStream {
    /**
    Create a stream.
    */ constructor(/**
    The line.
    */ string, tabSize, /**
    The current indent unit size.
    */ indentUnit, overrideIndent){
        this.string = string;
        this.tabSize = tabSize;
        this.indentUnit = indentUnit;
        this.overrideIndent = overrideIndent;
        /**
        The current position on the line.
        */ this.pos = 0;
        /**
        The start position of the current token.
        */ this.start = 0;
        this.lastColumnPos = 0;
        this.lastColumnValue = 0;
    }
    /**
    True if we are at the end of the line.
    */ eol() {
        return this.pos >= this.string.length;
    }
    /**
    True if we are at the start of the line.
    */ sol() {
        return this.pos == 0;
    }
    /**
    Get the next code unit after the current position, or undefined
    if we're at the end of the line.
    */ peek() {
        return this.string.charAt(this.pos) || undefined;
    }
    /**
    Read the next code unit and advance `this.pos`.
    */ next() {
        if (this.pos < this.string.length) return this.string.charAt(this.pos++);
    }
    /**
    Match the next character against the given string, regular
    expression, or predicate. Consume and return it if it matches.
    */ eat(match) {
        let ch = this.string.charAt(this.pos);
        let ok;
        if (typeof match == "string") ok = ch == match;
        else ok = ch && (match instanceof RegExp ? match.test(ch) : match(ch));
        if (ok) {
            ++this.pos;
            return ch;
        }
    }
    /**
    Continue matching characters that match the given string,
    regular expression, or predicate function. Return true if any
    characters were consumed.
    */ eatWhile(match) {
        let start = this.pos;
        while(this.eat(match)){}
        return this.pos > start;
    }
    /**
    Consume whitespace ahead of `this.pos`. Return true if any was
    found.
    */ eatSpace() {
        let start = this.pos;
        while(/[\s\u00a0]/.test(this.string.charAt(this.pos)))++this.pos;
        return this.pos > start;
    }
    /**
    Move to the end of the line.
    */ skipToEnd() {
        this.pos = this.string.length;
    }
    /**
    Move to directly before the given character, if found on the
    current line.
    */ skipTo(ch) {
        let found = this.string.indexOf(ch, this.pos);
        if (found > -1) {
            this.pos = found;
            return true;
        }
    }
    /**
    Move back `n` characters.
    */ backUp(n) {
        this.pos -= n;
    }
    /**
    Get the column position at `this.pos`.
    */ column() {
        if (this.lastColumnPos < this.start) {
            this.lastColumnValue = countCol(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
            this.lastColumnPos = this.start;
        }
        return this.lastColumnValue;
    }
    /**
    Get the indentation column of the current line.
    */ indentation() {
        var _a;
        return (_a = this.overrideIndent) !== null && _a !== void 0 ? _a : countCol(this.string, null, this.tabSize);
    }
    /**
    Match the input against the given string or regular expression
    (which should start with a `^`). Return true or the regexp match
    if it matches.
    
    Unless `consume` is set to `false`, this will move `this.pos`
    past the matched text.
    
    When matching a string `caseInsensitive` can be set to true to
    make the match case-insensitive.
    */ match(pattern, consume, caseInsensitive) {
        if (typeof pattern == "string") {
            let cased = (str)=>caseInsensitive ? str.toLowerCase() : str;
            let substr = this.string.substr(this.pos, pattern.length);
            if (cased(substr) == cased(pattern)) {
                if (consume !== false) this.pos += pattern.length;
                return true;
            } else return null;
        } else {
            let match = this.string.slice(this.pos).match(pattern);
            if (match && match.index > 0) return null;
            if (match && consume !== false) this.pos += match[0].length;
            return match;
        }
    }
    /**
    Get the current token.
    */ current() {
        return this.string.slice(this.start, this.pos);
    }
}
function fullParser(spec) {
    return {
        name: spec.name || "",
        token: spec.token,
        blankLine: spec.blankLine || (()=>{}),
        startState: spec.startState || (()=>true),
        copyState: spec.copyState || defaultCopyState,
        indent: spec.indent || (()=>null),
        languageData: spec.languageData || {},
        tokenTable: spec.tokenTable || noTokens,
        mergeTokens: spec.mergeTokens !== false
    };
}
function defaultCopyState(state) {
    if (typeof state != "object") return state;
    let newState = {};
    for(let prop in state){
        let val = state[prop];
        newState[prop] = val instanceof Array ? val.slice() : val;
    }
    return newState;
}
const IndentedFrom = /*@__PURE__*/ new WeakMap();
/**
A [language](https://codemirror.net/6/docs/ref/#language.Language) class based on a CodeMirror
5-style [streaming parser](https://codemirror.net/6/docs/ref/#language.StreamParser).
*/ class StreamLanguage extends Language {
    constructor(parser){
        let data = defineLanguageFacet(parser.languageData);
        let p = fullParser(parser), self;
        let impl = new class extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Parser"] {
            createParse(input, fragments, ranges) {
                return new Parse(self, input, fragments, ranges);
            }
        };
        super(data, impl, [], parser.name);
        this.topNode = docID(data, this);
        self = this;
        this.streamParser = p;
        this.stateAfter = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]({
            perNode: true
        });
        this.tokenTable = parser.tokenTable ? new TokenTable(p.tokenTable) : defaultTokenTable;
    }
    /**
    Define a stream language.
    */ static define(spec) {
        return new StreamLanguage(spec);
    }
    /**
    @internal
    */ getIndent(cx) {
        let from = undefined;
        let { overrideIndentation } = cx.options;
        if (overrideIndentation) {
            from = IndentedFrom.get(cx.state);
            if (from != null && from < cx.pos - 1e4) from = undefined;
        }
        let start = findState(this, cx.node.tree, cx.node.from, cx.node.from, from !== null && from !== void 0 ? from : cx.pos), statePos, state;
        if (start) {
            state = start.state;
            statePos = start.pos + 1;
        } else {
            state = this.streamParser.startState(cx.unit);
            statePos = cx.node.from;
        }
        if (cx.pos - statePos > 10000 /* C.MaxIndentScanDist */ ) return null;
        while(statePos < cx.pos){
            let line = cx.state.doc.lineAt(statePos), end = Math.min(cx.pos, line.to);
            if (line.length) {
                let indentation = overrideIndentation ? overrideIndentation(line.from) : -1;
                let stream = new StringStream(line.text, cx.state.tabSize, cx.unit, indentation < 0 ? undefined : indentation);
                while(stream.pos < end - line.from)readToken(this.streamParser.token, stream, state);
            } else {
                this.streamParser.blankLine(state, cx.unit);
            }
            if (end == cx.pos) break;
            statePos = line.to + 1;
        }
        let line = cx.lineAt(cx.pos);
        if (overrideIndentation && from == null) IndentedFrom.set(cx.state, line.from);
        return this.streamParser.indent(state, /^\s*(.*)/.exec(line.text)[1], cx);
    }
    get allowsNesting() {
        return false;
    }
}
function findState(lang, tree, off, startPos, before) {
    let state = off >= startPos && off + tree.length <= before && tree.prop(lang.stateAfter);
    if (state) return {
        state: lang.streamParser.copyState(state),
        pos: off + tree.length
    };
    for(let i = tree.children.length - 1; i >= 0; i--){
        let child = tree.children[i], pos = off + tree.positions[i];
        let found = child instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"] && pos < before && findState(lang, child, pos, startPos, before);
        if (found) return found;
    }
    return null;
}
function cutTree(lang, tree, from, to, inside) {
    if (inside && from <= 0 && to >= tree.length) return tree;
    if (!inside && from == 0 && tree.type == lang.topNode) inside = true;
    for(let i = tree.children.length - 1; i >= 0; i--){
        let pos = tree.positions[i], child = tree.children[i], inner;
        if (pos < to && child instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"]) {
            if (!(inner = cutTree(lang, child, from - pos, to - pos, inside))) break;
            return !inside ? inner : new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"](tree.type, tree.children.slice(0, i).concat(inner), tree.positions.slice(0, i + 1), pos + inner.length);
        }
    }
    return null;
}
function findStartInFragments(lang, fragments, startPos, endPos, editorState) {
    for (let f of fragments){
        let from = f.from + (f.openStart ? 25 : 0), to = f.to - (f.openEnd ? 25 : 0);
        let found = from <= startPos && to > startPos && findState(lang, f.tree, 0 - f.offset, startPos, to), tree;
        if (found && found.pos <= endPos && (tree = cutTree(lang, f.tree, startPos + f.offset, found.pos + f.offset, false))) return {
            state: found.state,
            tree
        };
    }
    return {
        state: lang.streamParser.startState(editorState ? getIndentUnit(editorState) : 4),
        tree: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].empty
    };
}
class Parse {
    constructor(lang, input, fragments, ranges){
        this.lang = lang;
        this.input = input;
        this.fragments = fragments;
        this.ranges = ranges;
        this.stoppedAt = null;
        this.chunks = [];
        this.chunkPos = [];
        this.chunk = [];
        this.chunkReused = undefined;
        this.rangeIndex = 0;
        this.to = ranges[ranges.length - 1].to;
        let context = ParseContext.get(), from = ranges[0].from;
        let { state, tree } = findStartInFragments(lang, fragments, from, this.to, context === null || context === void 0 ? void 0 : context.state);
        this.state = state;
        this.parsedPos = this.chunkStart = from + tree.length;
        for(let i = 0; i < tree.children.length; i++){
            this.chunks.push(tree.children[i]);
            this.chunkPos.push(tree.positions[i]);
        }
        if (context && this.parsedPos < context.viewport.from - 100000 /* C.MaxDistanceBeforeViewport */  && ranges.some((r)=>r.from <= context.viewport.from && r.to >= context.viewport.from)) {
            this.state = this.lang.streamParser.startState(getIndentUnit(context.state));
            context.skipUntilInView(this.parsedPos, context.viewport.from);
            this.parsedPos = context.viewport.from;
        }
        this.moveRangeIndex();
    }
    advance() {
        let context = ParseContext.get();
        let parseEnd = this.stoppedAt == null ? this.to : Math.min(this.to, this.stoppedAt);
        let end = Math.min(parseEnd, this.chunkStart + 512 /* C.ChunkSize */ );
        if (context) end = Math.min(end, context.viewport.to);
        while(this.parsedPos < end)this.parseLine(context);
        if (this.chunkStart < this.parsedPos) this.finishChunk();
        if (this.parsedPos >= parseEnd) return this.finish();
        if (context && this.parsedPos >= context.viewport.to) {
            context.skipUntilInView(this.parsedPos, parseEnd);
            return this.finish();
        }
        return null;
    }
    stopAt(pos) {
        this.stoppedAt = pos;
    }
    lineAfter(pos) {
        let chunk = this.input.chunk(pos);
        if (!this.input.lineChunks) {
            let eol = chunk.indexOf("\n");
            if (eol > -1) chunk = chunk.slice(0, eol);
        } else if (chunk == "\n") {
            chunk = "";
        }
        return pos + chunk.length <= this.to ? chunk : chunk.slice(0, this.to - pos);
    }
    nextLine() {
        let from = this.parsedPos, line = this.lineAfter(from), end = from + line.length;
        for(let index = this.rangeIndex;;){
            let rangeEnd = this.ranges[index].to;
            if (rangeEnd >= end) break;
            line = line.slice(0, rangeEnd - (end - line.length));
            index++;
            if (index == this.ranges.length) break;
            let rangeStart = this.ranges[index].from;
            let after = this.lineAfter(rangeStart);
            line += after;
            end = rangeStart + after.length;
        }
        return {
            line,
            end
        };
    }
    skipGapsTo(pos, offset, side) {
        for(;;){
            let end = this.ranges[this.rangeIndex].to, offPos = pos + offset;
            if (side > 0 ? end > offPos : end >= offPos) break;
            let start = this.ranges[++this.rangeIndex].from;
            offset += start - end;
        }
        return offset;
    }
    moveRangeIndex() {
        while(this.ranges[this.rangeIndex].to < this.parsedPos)this.rangeIndex++;
    }
    emitToken(id, from, to, offset) {
        let size = 4;
        if (this.ranges.length > 1) {
            offset = this.skipGapsTo(from, offset, 1);
            from += offset;
            let len0 = this.chunk.length;
            offset = this.skipGapsTo(to, offset, -1);
            to += offset;
            size += this.chunk.length - len0;
        }
        let last = this.chunk.length - 4;
        if (this.lang.streamParser.mergeTokens && size == 4 && last >= 0 && this.chunk[last] == id && this.chunk[last + 2] == from) this.chunk[last + 2] = to;
        else this.chunk.push(id, from, to, size);
        return offset;
    }
    parseLine(context) {
        let { line, end } = this.nextLine(), offset = 0, { streamParser } = this.lang;
        let stream = new StringStream(line, context ? context.state.tabSize : 4, context ? getIndentUnit(context.state) : 2);
        if (stream.eol()) {
            streamParser.blankLine(this.state, stream.indentUnit);
        } else {
            while(!stream.eol()){
                let token = readToken(streamParser.token, stream, this.state);
                if (token) offset = this.emitToken(this.lang.tokenTable.resolve(token), this.parsedPos + stream.start, this.parsedPos + stream.pos, offset);
                if (stream.start > 10000 /* C.MaxLineLength */ ) break;
            }
        }
        this.parsedPos = end;
        this.moveRangeIndex();
        if (this.parsedPos < this.to) this.parsedPos++;
    }
    finishChunk() {
        let tree = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].build({
            buffer: this.chunk,
            start: this.chunkStart,
            length: this.parsedPos - this.chunkStart,
            nodeSet,
            topID: 0,
            maxBufferLength: 512 /* C.ChunkSize */ ,
            reused: this.chunkReused
        });
        tree = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"](tree.type, tree.children, tree.positions, tree.length, [
            [
                this.lang.stateAfter,
                this.lang.streamParser.copyState(this.state)
            ]
        ]);
        this.chunks.push(tree);
        this.chunkPos.push(this.chunkStart - this.ranges[0].from);
        this.chunk = [];
        this.chunkReused = undefined;
        this.chunkStart = this.parsedPos;
    }
    finish() {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"](this.lang.topNode, this.chunks, this.chunkPos, this.parsedPos - this.ranges[0].from).balance();
    }
}
function readToken(token, stream, state) {
    stream.start = stream.pos;
    for(let i = 0; i < 10; i++){
        let result = token(stream, state);
        if (stream.pos > stream.start) return result;
    }
    throw new Error("Stream parser failed to advance stream.");
}
const noTokens = /*@__PURE__*/ Object.create(null);
const typeArray = [
    __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].none
];
const nodeSet = /*@__PURE__*/ new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeSet"](typeArray);
const warned = [];
// Cache of node types by name and tags
const byTag = /*@__PURE__*/ Object.create(null);
const defaultTable = /*@__PURE__*/ Object.create(null);
for (let [legacyName, name] of [
    [
        "variable",
        "variableName"
    ],
    [
        "variable-2",
        "variableName.special"
    ],
    [
        "string-2",
        "string.special"
    ],
    [
        "def",
        "variableName.definition"
    ],
    [
        "tag",
        "tagName"
    ],
    [
        "attribute",
        "attributeName"
    ],
    [
        "type",
        "typeName"
    ],
    [
        "builtin",
        "variableName.standard"
    ],
    [
        "qualifier",
        "modifier"
    ],
    [
        "error",
        "invalid"
    ],
    [
        "header",
        "heading"
    ],
    [
        "property",
        "propertyName"
    ]
])defaultTable[legacyName] = /*@__PURE__*/ createTokenType(noTokens, name);
class TokenTable {
    constructor(extra){
        this.extra = extra;
        this.table = Object.assign(Object.create(null), defaultTable);
    }
    resolve(tag) {
        return !tag ? 0 : this.table[tag] || (this.table[tag] = createTokenType(this.extra, tag));
    }
}
const defaultTokenTable = /*@__PURE__*/ new TokenTable(noTokens);
function warnForPart(part, msg) {
    if (warned.indexOf(part) > -1) return;
    warned.push(part);
    console.warn(msg);
}
function createTokenType(extra, tagStr) {
    let tags$1 = [];
    for (let name of tagStr.split(" ")){
        let found = [];
        for (let part of name.split(".")){
            let value = extra[part] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"][part];
            if (!value) {
                warnForPart(part, `Unknown highlighting tag ${part}`);
            } else if (typeof value == "function") {
                if (!found.length) warnForPart(part, `Modifier ${part} used at start of tag`);
                else found = found.map(value);
            } else {
                if (found.length) warnForPart(part, `Tag ${part} used as modifier`);
                else found = Array.isArray(value) ? value : [
                    value
                ];
            }
        }
        for (let tag of found)tags$1.push(tag);
    }
    if (!tags$1.length) return 0;
    let name = tagStr.replace(/ /g, "_"), key = name + " " + tags$1.map((t)=>t.id);
    let known = byTag[key];
    if (known) return known.id;
    let type = byTag[key] = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].define({
        id: typeArray.length,
        name,
        props: [
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["styleTags"])({
                [name]: tags$1
            })
        ]
    });
    typeArray.push(type);
    return type.id;
}
function docID(data, lang) {
    let type = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].define({
        id: typeArray.length,
        name: "Document",
        props: [
            languageDataProp.add(()=>data),
            indentNodeProp.add(()=>(cx)=>lang.getIndent(cx))
        ],
        top: true
    });
    typeArray.push(type);
    return type;
}
function buildForLine(line) {
    return line.length <= 4096 && /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/.test(line);
}
function textHasRTL(text) {
    for(let i = text.iter(); !i.next().done;)if (buildForLine(i.value)) return true;
    return false;
}
function changeAddsRTL(change) {
    let added = false;
    change.iterChanges((fA, tA, fB, tB, ins)=>{
        if (!added && textHasRTL(ins)) added = true;
    });
    return added;
}
const alwaysIsolate = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine: (values)=>values.some((x)=>x)
});
/**
Make sure nodes
[marked](https://lezer.codemirror.net/docs/ref/#common.NodeProp^isolate)
as isolating for bidirectional text are rendered in a way that
isolates them from the surrounding text.
*/ function bidiIsolates(options = {}) {
    let extensions = [
        isolateMarks
    ];
    if (options.alwaysIsolate) extensions.push(alwaysIsolate.of(true));
    return extensions;
}
const isolateMarks = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewPlugin"].fromClass(class {
    constructor(view){
        this.always = view.state.facet(alwaysIsolate) || view.textDirection != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Direction"].LTR || view.state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].perLineTextDirection);
        this.hasRTL = !this.always && textHasRTL(view.state.doc);
        this.tree = syntaxTree(view.state);
        this.decorations = this.always || this.hasRTL ? buildDeco(view, this.tree, this.always) : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].none;
    }
    update(update) {
        let always = update.state.facet(alwaysIsolate) || update.view.textDirection != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Direction"].LTR || update.state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].perLineTextDirection);
        if (!always && !this.hasRTL && changeAddsRTL(update.changes)) this.hasRTL = true;
        if (!always && !this.hasRTL) return;
        let tree = syntaxTree(update.state);
        if (always != this.always || tree != this.tree || update.docChanged || update.viewportChanged) {
            this.tree = tree;
            this.always = always;
            this.decorations = buildDeco(update.view, tree, always);
        }
    }
}, {
    provide: (plugin)=>{
        function access(view) {
            var _a, _b;
            return (_b = (_a = view.plugin(plugin)) === null || _a === void 0 ? void 0 : _a.decorations) !== null && _b !== void 0 ? _b : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].none;
        }
        return [
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].outerDecorations.of(access),
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Prec"].lowest(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].bidiIsolatedRanges.of(access))
        ];
    }
});
function buildDeco(view, tree, always) {
    let deco = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeSetBuilder"]();
    let ranges = view.visibleRanges;
    if (!always) ranges = clipRTLLines(ranges, view.state.doc);
    for (let { from, to } of ranges){
        tree.iterate({
            enter: (node)=>{
                let iso = node.type.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].isolate);
                if (iso) deco.add(node.from, node.to, marks[iso]);
            },
            from,
            to
        });
    }
    return deco.finish();
}
function clipRTLLines(ranges, doc) {
    let cur = doc.iter(), pos = 0, result = [], last = null;
    for (let { from, to } of ranges){
        if (last && last.to > from) {
            from = last.to;
            if (from >= to) continue;
        }
        if (pos + cur.value.length < from) {
            cur.next(from - (pos + cur.value.length));
            pos = from;
        }
        for(;;){
            let start = pos, end = pos + cur.value.length;
            if (!cur.lineBreak && buildForLine(cur.value)) {
                if (last && last.to > start - 10) last.to = Math.min(to, end);
                else result.push(last = {
                    from: start,
                    to: Math.min(to, end)
                });
            }
            if (end >= to) break;
            pos = end;
            cur.next();
        }
    }
    return result;
}
const marks = {
    rtl: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
        class: "cm-iso",
        inclusive: true,
        attributes: {
            dir: "rtl"
        },
        bidiIsolate: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Direction"].RTL
    }),
    ltr: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
        class: "cm-iso",
        inclusive: true,
        attributes: {
            dir: "ltr"
        },
        bidiIsolate: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Direction"].LTR
    }),
    auto: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
        class: "cm-iso",
        inclusive: true,
        attributes: {
            dir: "auto"
        },
        bidiIsolate: null
    })
};
;
}),
"[project]/pwa/node_modules/@codemirror/autocomplete/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CompletionContext",
    ()=>CompletionContext,
    "acceptCompletion",
    ()=>acceptCompletion,
    "autocompletion",
    ()=>autocompletion,
    "clearSnippet",
    ()=>clearSnippet,
    "closeBrackets",
    ()=>closeBrackets,
    "closeBracketsKeymap",
    ()=>closeBracketsKeymap,
    "closeCompletion",
    ()=>closeCompletion,
    "completeAnyWord",
    ()=>completeAnyWord,
    "completeFromList",
    ()=>completeFromList,
    "completionKeymap",
    ()=>completionKeymap,
    "completionStatus",
    ()=>completionStatus,
    "currentCompletions",
    ()=>currentCompletions,
    "deleteBracketPair",
    ()=>deleteBracketPair,
    "hasNextSnippetField",
    ()=>hasNextSnippetField,
    "hasPrevSnippetField",
    ()=>hasPrevSnippetField,
    "ifIn",
    ()=>ifIn,
    "ifNotIn",
    ()=>ifNotIn,
    "insertBracket",
    ()=>insertBracket,
    "insertCompletionText",
    ()=>insertCompletionText,
    "moveCompletionSelection",
    ()=>moveCompletionSelection,
    "nextSnippetField",
    ()=>nextSnippetField,
    "pickedCompletion",
    ()=>pickedCompletion,
    "prevSnippetField",
    ()=>prevSnippetField,
    "selectedCompletion",
    ()=>selectedCompletion,
    "selectedCompletionIndex",
    ()=>selectedCompletionIndex,
    "setSelectedCompletion",
    ()=>setSelectedCompletion,
    "snippet",
    ()=>snippet,
    "snippetCompletion",
    ()=>snippetCompletion,
    "snippetKeymap",
    ()=>snippetKeymap,
    "startCompletion",
    ()=>startCompletion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/state/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/view/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/language/dist/index.js [app-client] (ecmascript)");
;
;
;
/**
An instance of this is passed to completion source functions.
*/ class CompletionContext {
    /**
    Create a new completion context. (Mostly useful for testing
    completion sources—in the editor, the extension will create
    these for you.)
    */ constructor(/**
    The editor state that the completion happens in.
    */ state, /**
    The position at which the completion is happening.
    */ pos, /**
    Indicates whether completion was activated explicitly, or
    implicitly by typing. The usual way to respond to this is to
    only return completions when either there is part of a
    completable entity before the cursor, or `explicit` is true.
    */ explicit, /**
    The editor view. May be undefined if the context was created
    in a situation where there is no such view available, such as
    in synchronous updates via
    [`CompletionResult.update`](https://codemirror.net/6/docs/ref/#autocomplete.CompletionResult.update)
    or when called by test code.
    */ view){
        this.state = state;
        this.pos = pos;
        this.explicit = explicit;
        this.view = view;
        /**
        @internal
        */ this.abortListeners = [];
        /**
        @internal
        */ this.abortOnDocChange = false;
    }
    /**
    Get the extent, content, and (if there is a token) type of the
    token before `this.pos`.
    */ tokenBefore(types) {
        let token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(this.state).resolveInner(this.pos, -1);
        while(token && types.indexOf(token.name) < 0)token = token.parent;
        return token ? {
            from: token.from,
            to: this.pos,
            text: this.state.sliceDoc(token.from, this.pos),
            type: token.type
        } : null;
    }
    /**
    Get the match of the given expression directly before the
    cursor.
    */ matchBefore(expr) {
        let line = this.state.doc.lineAt(this.pos);
        let start = Math.max(line.from, this.pos - 250);
        let str = line.text.slice(start - line.from, this.pos - line.from);
        let found = str.search(ensureAnchor(expr, false));
        return found < 0 ? null : {
            from: start + found,
            to: this.pos,
            text: str.slice(found)
        };
    }
    /**
    Yields true when the query has been aborted. Can be useful in
    asynchronous queries to avoid doing work that will be ignored.
    */ get aborted() {
        return this.abortListeners == null;
    }
    /**
    Allows you to register abort handlers, which will be called when
    the query is
    [aborted](https://codemirror.net/6/docs/ref/#autocomplete.CompletionContext.aborted).
    
    By default, running queries will not be aborted for regular
    typing or backspacing, on the assumption that they are likely to
    return a result with a
    [`validFor`](https://codemirror.net/6/docs/ref/#autocomplete.CompletionResult.validFor) field that
    allows the result to be used after all. Passing `onDocChange:
    true` will cause this query to be aborted for any document
    change.
    */ addEventListener(type, listener, options) {
        if (type == "abort" && this.abortListeners) {
            this.abortListeners.push(listener);
            if (options && options.onDocChange) this.abortOnDocChange = true;
        }
    }
}
function toSet(chars) {
    let flat = Object.keys(chars).join("");
    let words = /\w/.test(flat);
    if (words) flat = flat.replace(/\w/g, "");
    return `[${words ? "\\w" : ""}${flat.replace(/[^\w\s]/g, "\\$&")}]`;
}
function prefixMatch(options) {
    let first = Object.create(null), rest = Object.create(null);
    for (let { label } of options){
        first[label[0]] = true;
        for(let i = 1; i < label.length; i++)rest[label[i]] = true;
    }
    let source = toSet(first) + toSet(rest) + "*$";
    return [
        new RegExp("^" + source),
        new RegExp(source)
    ];
}
/**
Given a a fixed array of options, return an autocompleter that
completes them.
*/ function completeFromList(list) {
    let options = list.map((o)=>typeof o == "string" ? {
            label: o
        } : o);
    let [validFor, match] = options.every((o)=>/^\w+$/.test(o.label)) ? [
        /\w*$/,
        /\w+$/
    ] : prefixMatch(options);
    return (context)=>{
        let token = context.matchBefore(match);
        return token || context.explicit ? {
            from: token ? token.from : context.pos,
            options,
            validFor
        } : null;
    };
}
/**
Wrap the given completion source so that it will only fire when the
cursor is in a syntax node with one of the given names.
*/ function ifIn(nodes, source) {
    return (context)=>{
        for(let pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(context.state).resolveInner(context.pos, -1); pos; pos = pos.parent){
            if (nodes.indexOf(pos.name) > -1) return source(context);
            if (pos.type.isTop) break;
        }
        return null;
    };
}
/**
Wrap the given completion source so that it will not fire when the
cursor is in a syntax node with one of the given names.
*/ function ifNotIn(nodes, source) {
    return (context)=>{
        for(let pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(context.state).resolveInner(context.pos, -1); pos; pos = pos.parent){
            if (nodes.indexOf(pos.name) > -1) return null;
            if (pos.type.isTop) break;
        }
        return source(context);
    };
}
class Option {
    constructor(completion, source, match, score){
        this.completion = completion;
        this.source = source;
        this.match = match;
        this.score = score;
    }
}
function cur(state) {
    return state.selection.main.from;
}
// Make sure the given regexp has a $ at its end and, if `start` is
// true, a ^ at its start.
function ensureAnchor(expr, start) {
    var _a;
    let { source } = expr;
    let addStart = start && source[0] != "^", addEnd = source[source.length - 1] != "$";
    if (!addStart && !addEnd) return expr;
    return new RegExp(`${addStart ? "^" : ""}(?:${source})${addEnd ? "$" : ""}`, (_a = expr.flags) !== null && _a !== void 0 ? _a : expr.ignoreCase ? "i" : "");
}
/**
This annotation is added to transactions that are produced by
picking a completion.
*/ const pickedCompletion = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Annotation"].define();
/**
Helper function that returns a transaction spec which inserts a
completion's text in the main selection range, and any other
selection range that has the same text in front of it.
*/ function insertCompletionText(state, text, from, to) {
    let { main } = state.selection, fromOff = from - main.from, toOff = to - main.from;
    return {
        ...state.changeByRange((range)=>{
            if (range != main && from != to && state.sliceDoc(range.from + fromOff, range.from + toOff) != state.sliceDoc(from, to)) return {
                range
            };
            let lines = state.toText(text);
            return {
                changes: {
                    from: range.from + fromOff,
                    to: to == main.from ? range.to : range.from + toOff,
                    insert: lines
                },
                range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.from + fromOff + lines.length)
            };
        }),
        scrollIntoView: true,
        userEvent: "input.complete"
    };
}
const SourceCache = /*@__PURE__*/ new WeakMap();
function asSource(source) {
    if (!Array.isArray(source)) return source;
    let known = SourceCache.get(source);
    if (!known) SourceCache.set(source, known = completeFromList(source));
    return known;
}
const startCompletionEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define();
const closeCompletionEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define();
// A pattern matcher for fuzzy completion matching. Create an instance
// once for a pattern, and then use that to match any number of
// completions.
class FuzzyMatcher {
    constructor(pattern){
        this.pattern = pattern;
        this.chars = [];
        this.folded = [];
        // Buffers reused by calls to `match` to track matched character
        // positions.
        this.any = [];
        this.precise = [];
        this.byWord = [];
        this.score = 0;
        this.matched = [];
        for(let p = 0; p < pattern.length;){
            let char = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(pattern, p), size = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])(char);
            this.chars.push(char);
            let part = pattern.slice(p, p + size), upper = part.toUpperCase();
            this.folded.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(upper == part ? part.toLowerCase() : upper, 0));
            p += size;
        }
        this.astral = pattern.length != this.chars.length;
    }
    ret(score, matched) {
        this.score = score;
        this.matched = matched;
        return this;
    }
    // Matches a given word (completion) against the pattern (input).
    // Will return a boolean indicating whether there was a match and,
    // on success, set `this.score` to the score, `this.matched` to an
    // array of `from, to` pairs indicating the matched parts of `word`.
    //
    // The score is a number that is more negative the worse the match
    // is. See `Penalty` above.
    match(word) {
        if (this.pattern.length == 0) return this.ret(-100 /* Penalty.NotFull */ , []);
        if (word.length < this.pattern.length) return null;
        let { chars, folded, any, precise, byWord } = this;
        // For single-character queries, only match when they occur right
        // at the start
        if (chars.length == 1) {
            let first = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(word, 0), firstSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])(first);
            let score = firstSize == word.length ? 0 : -100 /* Penalty.NotFull */ ;
            if (first == chars[0]) ;
            else if (first == folded[0]) score += -200 /* Penalty.CaseFold */ ;
            else return null;
            return this.ret(score, [
                0,
                firstSize
            ]);
        }
        let direct = word.indexOf(this.pattern);
        if (direct == 0) return this.ret(word.length == this.pattern.length ? 0 : -100 /* Penalty.NotFull */ , [
            0,
            this.pattern.length
        ]);
        let len = chars.length, anyTo = 0;
        if (direct < 0) {
            for(let i = 0, e = Math.min(word.length, 200); i < e && anyTo < len;){
                let next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(word, i);
                if (next == chars[anyTo] || next == folded[anyTo]) any[anyTo++] = i;
                i += (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])(next);
            }
            // No match, exit immediately
            if (anyTo < len) return null;
        }
        // This tracks the extent of the precise (non-folded, not
        // necessarily adjacent) match
        let preciseTo = 0;
        // Tracks whether there is a match that hits only characters that
        // appear to be starting words. `byWordFolded` is set to true when
        // a case folded character is encountered in such a match
        let byWordTo = 0, byWordFolded = false;
        // If we've found a partial adjacent match, these track its state
        let adjacentTo = 0, adjacentStart = -1, adjacentEnd = -1;
        let hasLower = /[a-z]/.test(word), wordAdjacent = true;
        // Go over the option's text, scanning for the various kinds of matches
        for(let i = 0, e = Math.min(word.length, 200), prevType = 0 /* Tp.NonWord */ ; i < e && byWordTo < len;){
            let next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(word, i);
            if (direct < 0) {
                if (preciseTo < len && next == chars[preciseTo]) precise[preciseTo++] = i;
                if (adjacentTo < len) {
                    if (next == chars[adjacentTo] || next == folded[adjacentTo]) {
                        if (adjacentTo == 0) adjacentStart = i;
                        adjacentEnd = i + 1;
                        adjacentTo++;
                    } else {
                        adjacentTo = 0;
                    }
                }
            }
            let ch, type = next < 0xff ? next >= 48 && next <= 57 || next >= 97 && next <= 122 ? 2 /* Tp.Lower */  : next >= 65 && next <= 90 ? 1 /* Tp.Upper */  : 0 /* Tp.NonWord */  : (ch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromCodePoint"])(next)) != ch.toLowerCase() ? 1 /* Tp.Upper */  : ch != ch.toUpperCase() ? 2 /* Tp.Lower */  : 0 /* Tp.NonWord */ ;
            if (!i || type == 1 /* Tp.Upper */  && hasLower || prevType == 0 /* Tp.NonWord */  && type != 0 /* Tp.NonWord */ ) {
                if (chars[byWordTo] == next || folded[byWordTo] == next && (byWordFolded = true)) byWord[byWordTo++] = i;
                else if (byWord.length) wordAdjacent = false;
            }
            prevType = type;
            i += (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])(next);
        }
        if (byWordTo == len && byWord[0] == 0 && wordAdjacent) return this.result(-100 /* Penalty.ByWord */  + (byWordFolded ? -200 /* Penalty.CaseFold */  : 0), byWord, word);
        if (adjacentTo == len && adjacentStart == 0) return this.ret(-200 /* Penalty.CaseFold */  - word.length + (adjacentEnd == word.length ? 0 : -100 /* Penalty.NotFull */ ), [
            0,
            adjacentEnd
        ]);
        if (direct > -1) return this.ret(-700 /* Penalty.NotStart */  - word.length, [
            direct,
            direct + this.pattern.length
        ]);
        if (adjacentTo == len) return this.ret(-200 /* Penalty.CaseFold */  + -700 /* Penalty.NotStart */  - word.length, [
            adjacentStart,
            adjacentEnd
        ]);
        if (byWordTo == len) return this.result(-100 /* Penalty.ByWord */  + (byWordFolded ? -200 /* Penalty.CaseFold */  : 0) + -700 /* Penalty.NotStart */  + (wordAdjacent ? 0 : -1100 /* Penalty.Gap */ ), byWord, word);
        return chars.length == 2 ? null : this.result((any[0] ? -700 /* Penalty.NotStart */  : 0) + -200 /* Penalty.CaseFold */  + -1100 /* Penalty.Gap */ , any, word);
    }
    result(score, positions, word) {
        let result = [], i = 0;
        for (let pos of positions){
            let to = pos + (this.astral ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(word, pos)) : 1);
            if (i && result[i - 1] == pos) result[i - 1] = to;
            else {
                result[i++] = pos;
                result[i++] = to;
            }
        }
        return this.ret(score - word.length, result);
    }
}
class StrictMatcher {
    constructor(pattern){
        this.pattern = pattern;
        this.matched = [];
        this.score = 0;
        this.folded = pattern.toLowerCase();
    }
    match(word) {
        if (word.length < this.pattern.length) return null;
        let start = word.slice(0, this.pattern.length);
        let match = start == this.pattern ? 0 : start.toLowerCase() == this.folded ? -200 /* Penalty.CaseFold */  : null;
        if (match == null) return null;
        this.matched = [
            0,
            start.length
        ];
        this.score = match + (word.length == this.pattern.length ? 0 : -100 /* Penalty.NotFull */ );
        return this;
    }
}
const completionConfig = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (configs) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineConfig"])(configs, {
            activateOnTyping: true,
            activateOnCompletion: ()=>false,
            activateOnTypingDelay: 100,
            selectOnOpen: true,
            override: null,
            closeOnBlur: true,
            maxRenderedOptions: 100,
            defaultKeymap: true,
            tooltipClass: ()=>"",
            optionClass: ()=>"",
            aboveCursor: false,
            icons: true,
            addToOptions: [],
            positionInfo: defaultPositionInfo,
            filterStrict: false,
            compareCompletions: (a, b)=>a.label.localeCompare(b.label),
            interactionDelay: 75,
            updateSyncTime: 100
        }, {
            defaultKeymap: (a, b)=>a && b,
            closeOnBlur: (a, b)=>a && b,
            icons: (a, b)=>a && b,
            tooltipClass: (a, b)=>(c)=>joinClass(a(c), b(c)),
            optionClass: (a, b)=>(c)=>joinClass(a(c), b(c)),
            addToOptions: (a, b)=>a.concat(b),
            filterStrict: (a, b)=>a || b
        });
    }
});
function joinClass(a, b) {
    return a ? b ? a + " " + b : a : b;
}
function defaultPositionInfo(view, list, option, info, space, tooltip) {
    let rtl = view.textDirection == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Direction"].RTL, left = rtl, narrow = false;
    let side = "top", offset, maxWidth;
    let spaceLeft = list.left - space.left, spaceRight = space.right - list.right;
    let infoWidth = info.right - info.left, infoHeight = info.bottom - info.top;
    if (left && spaceLeft < Math.min(infoWidth, spaceRight)) left = false;
    else if (!left && spaceRight < Math.min(infoWidth, spaceLeft)) left = true;
    if (infoWidth <= (left ? spaceLeft : spaceRight)) {
        offset = Math.max(space.top, Math.min(option.top, space.bottom - infoHeight)) - list.top;
        maxWidth = Math.min(400 /* Info.Width */ , left ? spaceLeft : spaceRight);
    } else {
        narrow = true;
        maxWidth = Math.min(400 /* Info.Width */ , (rtl ? list.right : space.right - list.left) - 30 /* Info.Margin */ );
        let spaceBelow = space.bottom - list.bottom;
        if (spaceBelow >= infoHeight || spaceBelow > list.top) {
            offset = option.bottom - list.top;
        } else {
            side = "bottom";
            offset = list.bottom - option.top;
        }
    }
    let scaleY = (list.bottom - list.top) / tooltip.offsetHeight;
    let scaleX = (list.right - list.left) / tooltip.offsetWidth;
    return {
        style: `${side}: ${offset / scaleY}px; max-width: ${maxWidth / scaleX}px`,
        class: "cm-completionInfo-" + (narrow ? rtl ? "left-narrow" : "right-narrow" : left ? "left" : "right")
    };
}
function optionContent(config) {
    let content = config.addToOptions.slice();
    if (config.icons) content.push({
        render (completion) {
            let icon = document.createElement("div");
            icon.classList.add("cm-completionIcon");
            if (completion.type) icon.classList.add(...completion.type.split(/\s+/g).map((cls)=>"cm-completionIcon-" + cls));
            icon.setAttribute("aria-hidden", "true");
            return icon;
        },
        position: 20
    });
    content.push({
        render (completion, _s, _v, match) {
            let labelElt = document.createElement("span");
            labelElt.className = "cm-completionLabel";
            let label = completion.displayLabel || completion.label, off = 0;
            for(let j = 0; j < match.length;){
                let from = match[j++], to = match[j++];
                if (from > off) labelElt.appendChild(document.createTextNode(label.slice(off, from)));
                let span = labelElt.appendChild(document.createElement("span"));
                span.appendChild(document.createTextNode(label.slice(from, to)));
                span.className = "cm-completionMatchedText";
                off = to;
            }
            if (off < label.length) labelElt.appendChild(document.createTextNode(label.slice(off)));
            return labelElt;
        },
        position: 50
    }, {
        render (completion) {
            if (!completion.detail) return null;
            let detailElt = document.createElement("span");
            detailElt.className = "cm-completionDetail";
            detailElt.textContent = completion.detail;
            return detailElt;
        },
        position: 80
    });
    return content.sort((a, b)=>a.position - b.position).map((a)=>a.render);
}
function rangeAroundSelected(total, selected, max) {
    if (total <= max) return {
        from: 0,
        to: total
    };
    if (selected < 0) selected = 0;
    if (selected <= total >> 1) {
        let off = Math.floor(selected / max);
        return {
            from: off * max,
            to: (off + 1) * max
        };
    }
    let off = Math.floor((total - selected) / max);
    return {
        from: total - (off + 1) * max,
        to: total - off * max
    };
}
class CompletionTooltip {
    constructor(view, stateField, applyCompletion){
        this.view = view;
        this.stateField = stateField;
        this.applyCompletion = applyCompletion;
        this.info = null;
        this.infoDestroy = null;
        this.placeInfoReq = {
            read: ()=>this.measureInfo(),
            write: (pos)=>this.placeInfo(pos),
            key: this
        };
        this.space = null;
        this.currentClass = "";
        let cState = view.state.field(stateField);
        let { options, selected } = cState.open;
        let config = view.state.facet(completionConfig);
        this.optionContent = optionContent(config);
        this.optionClass = config.optionClass;
        this.tooltipClass = config.tooltipClass;
        this.range = rangeAroundSelected(options.length, selected, config.maxRenderedOptions);
        this.dom = document.createElement("div");
        this.dom.className = "cm-tooltip-autocomplete";
        this.updateTooltipClass(view.state);
        this.dom.addEventListener("mousedown", (e)=>{
            let { options } = view.state.field(stateField).open;
            for(let dom = e.target, match; dom && dom != this.dom; dom = dom.parentNode){
                if (dom.nodeName == "LI" && (match = /-(\d+)$/.exec(dom.id)) && +match[1] < options.length) {
                    this.applyCompletion(view, options[+match[1]]);
                    e.preventDefault();
                    return;
                }
            }
        });
        this.dom.addEventListener("focusout", (e)=>{
            let state = view.state.field(this.stateField, false);
            if (state && state.tooltip && view.state.facet(completionConfig).closeOnBlur && e.relatedTarget != view.contentDOM) view.dispatch({
                effects: closeCompletionEffect.of(null)
            });
        });
        this.showOptions(options, cState.id);
    }
    mount() {
        this.updateSel();
    }
    showOptions(options, id) {
        if (this.list) this.list.remove();
        this.list = this.dom.appendChild(this.createListBox(options, id, this.range));
        this.list.addEventListener("scroll", ()=>{
            if (this.info) this.view.requestMeasure(this.placeInfoReq);
        });
    }
    update(update) {
        var _a;
        let cState = update.state.field(this.stateField);
        let prevState = update.startState.field(this.stateField);
        this.updateTooltipClass(update.state);
        if (cState != prevState) {
            let { options, selected, disabled } = cState.open;
            if (!prevState.open || prevState.open.options != options) {
                this.range = rangeAroundSelected(options.length, selected, update.state.facet(completionConfig).maxRenderedOptions);
                this.showOptions(options, cState.id);
            }
            this.updateSel();
            if (disabled != ((_a = prevState.open) === null || _a === void 0 ? void 0 : _a.disabled)) this.dom.classList.toggle("cm-tooltip-autocomplete-disabled", !!disabled);
        }
    }
    updateTooltipClass(state) {
        let cls = this.tooltipClass(state);
        if (cls != this.currentClass) {
            for (let c of this.currentClass.split(" "))if (c) this.dom.classList.remove(c);
            for (let c of cls.split(" "))if (c) this.dom.classList.add(c);
            this.currentClass = cls;
        }
    }
    positioned(space) {
        this.space = space;
        if (this.info) this.view.requestMeasure(this.placeInfoReq);
    }
    updateSel() {
        let cState = this.view.state.field(this.stateField), open = cState.open;
        if (open.selected > -1 && open.selected < this.range.from || open.selected >= this.range.to) {
            this.range = rangeAroundSelected(open.options.length, open.selected, this.view.state.facet(completionConfig).maxRenderedOptions);
            this.showOptions(open.options, cState.id);
        }
        let newSel = this.updateSelectedOption(open.selected);
        if (newSel) {
            this.destroyInfo();
            let { completion } = open.options[open.selected];
            let { info } = completion;
            if (!info) return;
            let infoResult = typeof info === "string" ? document.createTextNode(info) : info(completion);
            if (!infoResult) return;
            if ("then" in infoResult) {
                infoResult.then((obj)=>{
                    if (obj && this.view.state.field(this.stateField, false) == cState) this.addInfoPane(obj, completion);
                }).catch((e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logException"])(this.view.state, e, "completion info"));
            } else {
                this.addInfoPane(infoResult, completion);
                newSel.setAttribute("aria-describedby", this.info.id);
            }
        }
    }
    addInfoPane(content, completion) {
        this.destroyInfo();
        let wrap = this.info = document.createElement("div");
        wrap.className = "cm-tooltip cm-completionInfo";
        wrap.id = "cm-completionInfo-" + Math.floor(Math.random() * 0xffff).toString(16);
        if (content.nodeType != null) {
            wrap.appendChild(content);
            this.infoDestroy = null;
        } else {
            let { dom, destroy } = content;
            wrap.appendChild(dom);
            this.infoDestroy = destroy || null;
        }
        this.dom.appendChild(wrap);
        this.view.requestMeasure(this.placeInfoReq);
    }
    updateSelectedOption(selected) {
        let set = null;
        for(let opt = this.list.firstChild, i = this.range.from; opt; opt = opt.nextSibling, i++){
            if (opt.nodeName != "LI" || !opt.id) {
                i--; // A section header
            } else if (i == selected) {
                if (!opt.hasAttribute("aria-selected")) {
                    opt.setAttribute("aria-selected", "true");
                    set = opt;
                }
            } else {
                if (opt.hasAttribute("aria-selected")) {
                    opt.removeAttribute("aria-selected");
                    opt.removeAttribute("aria-describedby");
                }
            }
        }
        if (set) scrollIntoView(this.list, set);
        return set;
    }
    measureInfo() {
        let sel = this.dom.querySelector("[aria-selected]");
        if (!sel || !this.info) return null;
        let listRect = this.dom.getBoundingClientRect();
        let infoRect = this.info.getBoundingClientRect();
        let selRect = sel.getBoundingClientRect();
        let space = this.space;
        if (!space) {
            let docElt = this.dom.ownerDocument.documentElement;
            space = {
                left: 0,
                top: 0,
                right: docElt.clientWidth,
                bottom: docElt.clientHeight
            };
        }
        if (selRect.top > Math.min(space.bottom, listRect.bottom) - 10 || selRect.bottom < Math.max(space.top, listRect.top) + 10) return null;
        return this.view.state.facet(completionConfig).positionInfo(this.view, listRect, selRect, infoRect, space, this.dom);
    }
    placeInfo(pos) {
        if (this.info) {
            if (pos) {
                if (pos.style) this.info.style.cssText = pos.style;
                this.info.className = "cm-tooltip cm-completionInfo " + (pos.class || "");
            } else {
                this.info.style.cssText = "top: -1e6px";
            }
        }
    }
    createListBox(options, id, range) {
        const ul = document.createElement("ul");
        ul.id = id;
        ul.setAttribute("role", "listbox");
        ul.setAttribute("aria-expanded", "true");
        ul.setAttribute("aria-label", this.view.state.phrase("Completions"));
        ul.addEventListener("mousedown", (e)=>{
            // Prevent focus change when clicking the scrollbar
            if (e.target == ul) e.preventDefault();
        });
        let curSection = null;
        for(let i = range.from; i < range.to; i++){
            let { completion, match } = options[i], { section } = completion;
            if (section) {
                let name = typeof section == "string" ? section : section.name;
                if (name != curSection && (i > range.from || range.from == 0)) {
                    curSection = name;
                    if (typeof section != "string" && section.header) {
                        ul.appendChild(section.header(section));
                    } else {
                        let header = ul.appendChild(document.createElement("completion-section"));
                        header.textContent = name;
                    }
                }
            }
            const li = ul.appendChild(document.createElement("li"));
            li.id = id + "-" + i;
            li.setAttribute("role", "option");
            let cls = this.optionClass(completion);
            if (cls) li.className = cls;
            for (let source of this.optionContent){
                let node = source(completion, this.view.state, this.view, match);
                if (node) li.appendChild(node);
            }
        }
        if (range.from) ul.classList.add("cm-completionListIncompleteTop");
        if (range.to < options.length) ul.classList.add("cm-completionListIncompleteBottom");
        return ul;
    }
    destroyInfo() {
        if (this.info) {
            if (this.infoDestroy) this.infoDestroy();
            this.info.remove();
            this.info = null;
        }
    }
    destroy() {
        this.destroyInfo();
    }
}
function completionTooltip(stateField, applyCompletion) {
    return (view)=>new CompletionTooltip(view, stateField, applyCompletion);
}
function scrollIntoView(container, element) {
    let parent = container.getBoundingClientRect();
    let self = element.getBoundingClientRect();
    let scaleY = parent.height / container.offsetHeight;
    if (self.top < parent.top) container.scrollTop -= (parent.top - self.top) / scaleY;
    else if (self.bottom > parent.bottom) container.scrollTop += (self.bottom - parent.bottom) / scaleY;
}
// Used to pick a preferred option when two options with the same
// label occur in the result.
function score(option) {
    return (option.boost || 0) * 100 + (option.apply ? 10 : 0) + (option.info ? 5 : 0) + (option.type ? 1 : 0);
}
function sortOptions(active, state) {
    let options = [];
    let sections = null, dynamicSectionScore = null;
    let addOption = (option)=>{
        options.push(option);
        let { section } = option.completion;
        if (section) {
            if (!sections) sections = [];
            let name = typeof section == "string" ? section : section.name;
            if (!sections.some((s)=>s.name == name)) sections.push(typeof section == "string" ? {
                name
            } : section);
        }
    };
    let conf = state.facet(completionConfig);
    for (let a of active)if (a.hasResult()) {
        let getMatch = a.result.getMatch;
        if (a.result.filter === false) {
            for (let option of a.result.options){
                addOption(new Option(option, a.source, getMatch ? getMatch(option) : [], 1e9 - options.length));
            }
        } else {
            let pattern = state.sliceDoc(a.from, a.to), match;
            let matcher = conf.filterStrict ? new StrictMatcher(pattern) : new FuzzyMatcher(pattern);
            for (let option of a.result.options)if (match = matcher.match(option.label)) {
                let matched = !option.displayLabel ? match.matched : getMatch ? getMatch(option, match.matched) : [];
                let score = match.score + (option.boost || 0);
                addOption(new Option(option, a.source, matched, score));
                if (typeof option.section == "object" && option.section.rank === "dynamic") {
                    let { name } = option.section;
                    if (!dynamicSectionScore) dynamicSectionScore = Object.create(null);
                    dynamicSectionScore[name] = Math.max(score, dynamicSectionScore[name] || -1e9);
                }
            }
        }
    }
    if (sections) {
        let sectionOrder = Object.create(null), pos = 0;
        let cmp = (a, b)=>{
            return (a.rank === "dynamic" && b.rank === "dynamic" ? dynamicSectionScore[b.name] - dynamicSectionScore[a.name] : 0) || (typeof a.rank == "number" ? a.rank : 1e9) - (typeof b.rank == "number" ? b.rank : 1e9) || (a.name < b.name ? -1 : 1);
        };
        for (let s of sections.sort(cmp)){
            pos -= 1e5;
            sectionOrder[s.name] = pos;
        }
        for (let option of options){
            let { section } = option.completion;
            if (section) option.score += sectionOrder[typeof section == "string" ? section : section.name];
        }
    }
    let result = [], prev = null;
    let compare = conf.compareCompletions;
    for (let opt of options.sort((a, b)=>b.score - a.score || compare(a.completion, b.completion))){
        let cur = opt.completion;
        if (!prev || prev.label != cur.label || prev.detail != cur.detail || prev.type != null && cur.type != null && prev.type != cur.type || prev.apply != cur.apply || prev.boost != cur.boost) result.push(opt);
        else if (score(opt.completion) > score(prev)) result[result.length - 1] = opt;
        prev = opt.completion;
    }
    return result;
}
class CompletionDialog {
    constructor(options, attrs, tooltip, timestamp, selected, disabled){
        this.options = options;
        this.attrs = attrs;
        this.tooltip = tooltip;
        this.timestamp = timestamp;
        this.selected = selected;
        this.disabled = disabled;
    }
    setSelected(selected, id) {
        return selected == this.selected || selected >= this.options.length ? this : new CompletionDialog(this.options, makeAttrs(id, selected), this.tooltip, this.timestamp, selected, this.disabled);
    }
    static build(active, state, id, prev, conf, didSetActive) {
        if (prev && !didSetActive && active.some((s)=>s.isPending)) return prev.setDisabled();
        let options = sortOptions(active, state);
        if (!options.length) return prev && active.some((a)=>a.isPending) ? prev.setDisabled() : null;
        let selected = state.facet(completionConfig).selectOnOpen ? 0 : -1;
        if (prev && prev.selected != selected && prev.selected != -1) {
            let selectedValue = prev.options[prev.selected].completion;
            for(let i = 0; i < options.length; i++)if (options[i].completion == selectedValue) {
                selected = i;
                break;
            }
        }
        return new CompletionDialog(options, makeAttrs(id, selected), {
            pos: active.reduce((a, b)=>b.hasResult() ? Math.min(a, b.from) : a, 1e8),
            create: createTooltip,
            above: conf.aboveCursor
        }, prev ? prev.timestamp : Date.now(), selected, false);
    }
    map(changes) {
        return new CompletionDialog(this.options, this.attrs, {
            ...this.tooltip,
            pos: changes.mapPos(this.tooltip.pos)
        }, this.timestamp, this.selected, this.disabled);
    }
    setDisabled() {
        return new CompletionDialog(this.options, this.attrs, this.tooltip, this.timestamp, this.selected, true);
    }
}
class CompletionState {
    constructor(active, id, open){
        this.active = active;
        this.id = id;
        this.open = open;
    }
    static start() {
        return new CompletionState(none, "cm-ac-" + Math.floor(Math.random() * 2e6).toString(36), null);
    }
    update(tr) {
        let { state } = tr, conf = state.facet(completionConfig);
        let sources = conf.override || state.languageDataAt("autocomplete", cur(state)).map(asSource);
        let active = sources.map((source)=>{
            let value = this.active.find((s)=>s.source == source) || new ActiveSource(source, this.active.some((a)=>a.state != 0 /* State.Inactive */ ) ? 1 /* State.Pending */  : 0 /* State.Inactive */ );
            return value.update(tr, conf);
        });
        if (active.length == this.active.length && active.every((a, i)=>a == this.active[i])) active = this.active;
        let open = this.open, didSet = tr.effects.some((e)=>e.is(setActiveEffect));
        if (open && tr.docChanged) open = open.map(tr.changes);
        if (tr.selection || active.some((a)=>a.hasResult() && tr.changes.touchesRange(a.from, a.to)) || !sameResults(active, this.active) || didSet) open = CompletionDialog.build(active, state, this.id, open, conf, didSet);
        else if (open && open.disabled && !active.some((a)=>a.isPending)) open = null;
        if (!open && active.every((a)=>!a.isPending) && active.some((a)=>a.hasResult())) active = active.map((a)=>a.hasResult() ? new ActiveSource(a.source, 0 /* State.Inactive */ ) : a);
        for (let effect of tr.effects)if (effect.is(setSelectedEffect)) open = open && open.setSelected(effect.value, this.id);
        return active == this.active && open == this.open ? this : new CompletionState(active, this.id, open);
    }
    get tooltip() {
        return this.open ? this.open.tooltip : null;
    }
    get attrs() {
        return this.open ? this.open.attrs : this.active.length ? baseAttrs : noAttrs;
    }
}
function sameResults(a, b) {
    if (a == b) return true;
    for(let iA = 0, iB = 0;;){
        while(iA < a.length && !a[iA].hasResult())iA++;
        while(iB < b.length && !b[iB].hasResult())iB++;
        let endA = iA == a.length, endB = iB == b.length;
        if (endA || endB) return endA == endB;
        if (a[iA++].result != b[iB++].result) return false;
    }
}
const baseAttrs = {
    "aria-autocomplete": "list"
};
const noAttrs = {};
function makeAttrs(id, selected) {
    let result = {
        "aria-autocomplete": "list",
        "aria-haspopup": "listbox",
        "aria-controls": id
    };
    if (selected > -1) result["aria-activedescendant"] = id + "-" + selected;
    return result;
}
const none = [];
function getUpdateType(tr, conf) {
    if (tr.isUserEvent("input.complete")) {
        let completion = tr.annotation(pickedCompletion);
        if (completion && conf.activateOnCompletion(completion)) return 4 /* UpdateType.Activate */  | 8 /* UpdateType.Reset */ ;
    }
    let typing = tr.isUserEvent("input.type");
    return typing && conf.activateOnTyping ? 4 /* UpdateType.Activate */  | 1 /* UpdateType.Typing */  : typing ? 1 /* UpdateType.Typing */  : tr.isUserEvent("delete.backward") ? 2 /* UpdateType.Backspacing */  : tr.selection ? 8 /* UpdateType.Reset */  : tr.docChanged ? 16 /* UpdateType.ResetIfTouching */  : 0 /* UpdateType.None */ ;
}
class ActiveSource {
    constructor(source, state, explicit = false){
        this.source = source;
        this.state = state;
        this.explicit = explicit;
    }
    hasResult() {
        return false;
    }
    get isPending() {
        return this.state == 1 /* State.Pending */ ;
    }
    update(tr, conf) {
        let type = getUpdateType(tr, conf), value = this;
        if (type & 8 /* UpdateType.Reset */  || type & 16 /* UpdateType.ResetIfTouching */  && this.touches(tr)) value = new ActiveSource(value.source, 0 /* State.Inactive */ );
        if (type & 4 /* UpdateType.Activate */  && value.state == 0 /* State.Inactive */ ) value = new ActiveSource(this.source, 1 /* State.Pending */ );
        value = value.updateFor(tr, type);
        for (let effect of tr.effects){
            if (effect.is(startCompletionEffect)) value = new ActiveSource(value.source, 1 /* State.Pending */ , effect.value);
            else if (effect.is(closeCompletionEffect)) value = new ActiveSource(value.source, 0 /* State.Inactive */ );
            else if (effect.is(setActiveEffect)) {
                for (let active of effect.value)if (active.source == value.source) value = active;
            }
        }
        return value;
    }
    updateFor(tr, type) {
        return this.map(tr.changes);
    }
    map(changes) {
        return this;
    }
    touches(tr) {
        return tr.changes.touchesRange(cur(tr.state));
    }
}
class ActiveResult extends ActiveSource {
    constructor(source, explicit, limit, result, from, to){
        super(source, 3 /* State.Result */ , explicit);
        this.limit = limit;
        this.result = result;
        this.from = from;
        this.to = to;
    }
    hasResult() {
        return true;
    }
    updateFor(tr, type) {
        var _a;
        if (!(type & 3 /* UpdateType.SimpleInteraction */ )) return this.map(tr.changes);
        let result = this.result;
        if (result.map && !tr.changes.empty) result = result.map(result, tr.changes);
        let from = tr.changes.mapPos(this.from), to = tr.changes.mapPos(this.to, 1);
        let pos = cur(tr.state);
        if (pos > to || !result || type & 2 /* UpdateType.Backspacing */  && (cur(tr.startState) == this.from || pos < this.limit)) return new ActiveSource(this.source, type & 4 /* UpdateType.Activate */  ? 1 /* State.Pending */  : 0 /* State.Inactive */ );
        let limit = tr.changes.mapPos(this.limit);
        if (checkValid(result.validFor, tr.state, from, to)) return new ActiveResult(this.source, this.explicit, limit, result, from, to);
        if (result.update && (result = result.update(result, from, to, new CompletionContext(tr.state, pos, false)))) return new ActiveResult(this.source, this.explicit, limit, result, result.from, (_a = result.to) !== null && _a !== void 0 ? _a : cur(tr.state));
        return new ActiveSource(this.source, 1 /* State.Pending */ , this.explicit);
    }
    map(mapping) {
        if (mapping.empty) return this;
        let result = this.result.map ? this.result.map(this.result, mapping) : this.result;
        if (!result) return new ActiveSource(this.source, 0 /* State.Inactive */ );
        return new ActiveResult(this.source, this.explicit, mapping.mapPos(this.limit), this.result, mapping.mapPos(this.from), mapping.mapPos(this.to, 1));
    }
    touches(tr) {
        return tr.changes.touchesRange(this.from, this.to);
    }
}
function checkValid(validFor, state, from, to) {
    if (!validFor) return false;
    let text = state.sliceDoc(from, to);
    return typeof validFor == "function" ? validFor(text, from, to, state) : ensureAnchor(validFor, true).test(text);
}
const setActiveEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define({
    map (sources, mapping) {
        return sources.map((s)=>s.map(mapping));
    }
});
const setSelectedEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define();
const completionState = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create () {
        return CompletionState.start();
    },
    update (value, tr) {
        return value.update(tr);
    },
    provide: (f)=>[
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["showTooltip"].from(f, (val)=>val.tooltip),
            __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].contentAttributes.from(f, (state)=>state.attrs)
        ]
});
function applyCompletion(view, option) {
    const apply = option.completion.apply || option.completion.label;
    let result = view.state.field(completionState).active.find((a)=>a.source == option.source);
    if (!(result instanceof ActiveResult)) return false;
    if (typeof apply == "string") view.dispatch({
        ...insertCompletionText(view.state, apply, result.from, result.to),
        annotations: pickedCompletion.of(option.completion)
    });
    else apply(view, option.completion, result.from, result.to);
    return true;
}
const createTooltip = /*@__PURE__*/ completionTooltip(completionState, applyCompletion);
/**
Returns a command that moves the completion selection forward or
backward by the given amount.
*/ function moveCompletionSelection(forward, by = "option") {
    return (view)=>{
        let cState = view.state.field(completionState, false);
        if (!cState || !cState.open || cState.open.disabled || Date.now() - cState.open.timestamp < view.state.facet(completionConfig).interactionDelay) return false;
        let step = 1, tooltip;
        if (by == "page" && (tooltip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltip"])(view, cState.open.tooltip))) step = Math.max(2, Math.floor(tooltip.dom.offsetHeight / tooltip.dom.querySelector("li").offsetHeight) - 1);
        let { length } = cState.open.options;
        let selected = cState.open.selected > -1 ? cState.open.selected + step * (forward ? 1 : -1) : forward ? 0 : length - 1;
        if (selected < 0) selected = by == "page" ? 0 : length - 1;
        else if (selected >= length) selected = by == "page" ? length - 1 : 0;
        view.dispatch({
            effects: setSelectedEffect.of(selected)
        });
        return true;
    };
}
/**
Accept the current completion.
*/ const acceptCompletion = (view)=>{
    let cState = view.state.field(completionState, false);
    if (view.state.readOnly || !cState || !cState.open || cState.open.selected < 0 || cState.open.disabled || Date.now() - cState.open.timestamp < view.state.facet(completionConfig).interactionDelay) return false;
    return applyCompletion(view, cState.open.options[cState.open.selected]);
};
/**
Explicitly start autocompletion.
*/ const startCompletion = (view)=>{
    let cState = view.state.field(completionState, false);
    if (!cState) return false;
    view.dispatch({
        effects: startCompletionEffect.of(true)
    });
    return true;
};
/**
Close the currently active completion.
*/ const closeCompletion = (view)=>{
    let cState = view.state.field(completionState, false);
    if (!cState || !cState.active.some((a)=>a.state != 0 /* State.Inactive */ )) return false;
    view.dispatch({
        effects: closeCompletionEffect.of(null)
    });
    return true;
};
class RunningQuery {
    constructor(active, context){
        this.active = active;
        this.context = context;
        this.time = Date.now();
        this.updates = [];
        // Note that 'undefined' means 'not done yet', whereas 'null' means
        // 'query returned null'.
        this.done = undefined;
    }
}
const MaxUpdateCount = 50, MinAbortTime = 1000;
const completionPlugin = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewPlugin"].fromClass(class {
    constructor(view){
        this.view = view;
        this.debounceUpdate = -1;
        this.running = [];
        this.debounceAccept = -1;
        this.pendingStart = false;
        this.composing = 0 /* CompositionState.None */ ;
        for (let active of view.state.field(completionState).active)if (active.isPending) this.startQuery(active);
    }
    update(update) {
        let cState = update.state.field(completionState);
        let conf = update.state.facet(completionConfig);
        if (!update.selectionSet && !update.docChanged && update.startState.field(completionState) == cState) return;
        let doesReset = update.transactions.some((tr)=>{
            let type = getUpdateType(tr, conf);
            return type & 8 /* UpdateType.Reset */  || (tr.selection || tr.docChanged) && !(type & 3 /* UpdateType.SimpleInteraction */ );
        });
        for(let i = 0; i < this.running.length; i++){
            let query = this.running[i];
            if (doesReset || query.context.abortOnDocChange && update.docChanged || query.updates.length + update.transactions.length > MaxUpdateCount && Date.now() - query.time > MinAbortTime) {
                for (let handler of query.context.abortListeners){
                    try {
                        handler();
                    } catch (e) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logException"])(this.view.state, e);
                    }
                }
                query.context.abortListeners = null;
                this.running.splice(i--, 1);
            } else {
                query.updates.push(...update.transactions);
            }
        }
        if (this.debounceUpdate > -1) clearTimeout(this.debounceUpdate);
        if (update.transactions.some((tr)=>tr.effects.some((e)=>e.is(startCompletionEffect)))) this.pendingStart = true;
        let delay = this.pendingStart ? 50 : conf.activateOnTypingDelay;
        this.debounceUpdate = cState.active.some((a)=>a.isPending && !this.running.some((q)=>q.active.source == a.source)) ? setTimeout(()=>this.startUpdate(), delay) : -1;
        if (this.composing != 0 /* CompositionState.None */ ) for (let tr of update.transactions){
            if (tr.isUserEvent("input.type")) this.composing = 2 /* CompositionState.Changed */ ;
            else if (this.composing == 2 /* CompositionState.Changed */  && tr.selection) this.composing = 3 /* CompositionState.ChangedAndMoved */ ;
        }
    }
    startUpdate() {
        this.debounceUpdate = -1;
        this.pendingStart = false;
        let { state } = this.view, cState = state.field(completionState);
        for (let active of cState.active){
            if (active.isPending && !this.running.some((r)=>r.active.source == active.source)) this.startQuery(active);
        }
        if (this.running.length && cState.open && cState.open.disabled) this.debounceAccept = setTimeout(()=>this.accept(), this.view.state.facet(completionConfig).updateSyncTime);
    }
    startQuery(active) {
        let { state } = this.view, pos = cur(state);
        let context = new CompletionContext(state, pos, active.explicit, this.view);
        let pending = new RunningQuery(active, context);
        this.running.push(pending);
        Promise.resolve(active.source(context)).then((result)=>{
            if (!pending.context.aborted) {
                pending.done = result || null;
                this.scheduleAccept();
            }
        }, (err)=>{
            this.view.dispatch({
                effects: closeCompletionEffect.of(null)
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logException"])(this.view.state, err);
        });
    }
    scheduleAccept() {
        if (this.running.every((q)=>q.done !== undefined)) this.accept();
        else if (this.debounceAccept < 0) this.debounceAccept = setTimeout(()=>this.accept(), this.view.state.facet(completionConfig).updateSyncTime);
    }
    // For each finished query in this.running, try to create a result
    // or, if appropriate, restart the query.
    accept() {
        var _a;
        if (this.debounceAccept > -1) clearTimeout(this.debounceAccept);
        this.debounceAccept = -1;
        let updated = [];
        let conf = this.view.state.facet(completionConfig), cState = this.view.state.field(completionState);
        for(let i = 0; i < this.running.length; i++){
            let query = this.running[i];
            if (query.done === undefined) continue;
            this.running.splice(i--, 1);
            if (query.done) {
                let pos = cur(query.updates.length ? query.updates[0].startState : this.view.state);
                let limit = Math.min(pos, query.done.from + (query.active.explicit ? 0 : 1));
                let active = new ActiveResult(query.active.source, query.active.explicit, limit, query.done, query.done.from, (_a = query.done.to) !== null && _a !== void 0 ? _a : pos);
                // Replay the transactions that happened since the start of
                // the request and see if that preserves the result
                for (let tr of query.updates)active = active.update(tr, conf);
                if (active.hasResult()) {
                    updated.push(active);
                    continue;
                }
            }
            let current = cState.active.find((a)=>a.source == query.active.source);
            if (current && current.isPending) {
                if (query.done == null) {
                    // Explicitly failed. Should clear the pending status if it
                    // hasn't been re-set in the meantime.
                    let active = new ActiveSource(query.active.source, 0 /* State.Inactive */ );
                    for (let tr of query.updates)active = active.update(tr, conf);
                    if (!active.isPending) updated.push(active);
                } else {
                    // Cleared by subsequent transactions. Restart.
                    this.startQuery(current);
                }
            }
        }
        if (updated.length || cState.open && cState.open.disabled) this.view.dispatch({
            effects: setActiveEffect.of(updated)
        });
    }
}, {
    eventHandlers: {
        blur (event) {
            let state = this.view.state.field(completionState, false);
            if (state && state.tooltip && this.view.state.facet(completionConfig).closeOnBlur) {
                let dialog = state.open && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTooltip"])(this.view, state.open.tooltip);
                if (!dialog || !dialog.dom.contains(event.relatedTarget)) setTimeout(()=>this.view.dispatch({
                        effects: closeCompletionEffect.of(null)
                    }), 10);
            }
        },
        compositionstart () {
            this.composing = 1 /* CompositionState.Started */ ;
        },
        compositionend () {
            if (this.composing == 3 /* CompositionState.ChangedAndMoved */ ) {
                // Safari fires compositionend events synchronously, possibly
                // from inside an update, so dispatch asynchronously to avoid reentrancy
                setTimeout(()=>this.view.dispatch({
                        effects: startCompletionEffect.of(false)
                    }), 20);
            }
            this.composing = 0 /* CompositionState.None */ ;
        }
    }
});
const windows = typeof navigator == "object" && /*@__PURE__*/ /Win/.test(navigator.platform);
const commitCharacters = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Prec"].highest(/*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].domEventHandlers({
    keydown (event, view) {
        let field = view.state.field(completionState, false);
        if (!field || !field.open || field.open.disabled || field.open.selected < 0 || event.key.length > 1 || event.ctrlKey && !(windows && event.altKey) || event.metaKey) return false;
        let option = field.open.options[field.open.selected];
        let result = field.active.find((a)=>a.source == option.source);
        let commitChars = option.completion.commitCharacters || result.result.commitCharacters;
        if (commitChars && commitChars.indexOf(event.key) > -1) applyCompletion(view, option);
        return false;
    }
}));
const baseTheme = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].baseTheme({
    ".cm-tooltip.cm-tooltip-autocomplete": {
        "& > ul": {
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            overflow: "hidden auto",
            maxWidth_fallback: "700px",
            maxWidth: "min(700px, 95vw)",
            minWidth: "250px",
            maxHeight: "10em",
            height: "100%",
            listStyle: "none",
            margin: 0,
            padding: 0,
            "& > li, & > completion-section": {
                padding: "1px 3px",
                lineHeight: 1.2
            },
            "& > li": {
                overflowX: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer"
            },
            "& > completion-section": {
                display: "list-item",
                borderBottom: "1px solid silver",
                paddingLeft: "0.5em",
                opacity: 0.7
            }
        }
    },
    "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
        background: "#17c",
        color: "white"
    },
    "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
        background: "#777"
    },
    "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
        background: "#347",
        color: "white"
    },
    "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
        background: "#444"
    },
    ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after": {
        content: '"···"',
        opacity: 0.5,
        display: "block",
        textAlign: "center"
    },
    ".cm-tooltip.cm-completionInfo": {
        position: "absolute",
        padding: "3px 9px",
        width: "max-content",
        maxWidth: `${400 /* Info.Width */ }px`,
        boxSizing: "border-box",
        whiteSpace: "pre-line"
    },
    ".cm-completionInfo.cm-completionInfo-left": {
        right: "100%"
    },
    ".cm-completionInfo.cm-completionInfo-right": {
        left: "100%"
    },
    ".cm-completionInfo.cm-completionInfo-left-narrow": {
        right: `${30 /* Info.Margin */ }px`
    },
    ".cm-completionInfo.cm-completionInfo-right-narrow": {
        left: `${30 /* Info.Margin */ }px`
    },
    "&light .cm-snippetField": {
        backgroundColor: "#00000022"
    },
    "&dark .cm-snippetField": {
        backgroundColor: "#ffffff22"
    },
    ".cm-snippetFieldPosition": {
        verticalAlign: "text-top",
        width: 0,
        height: "1.15em",
        display: "inline-block",
        margin: "0 -0.7px -.7em",
        borderLeft: "1.4px dotted #888"
    },
    ".cm-completionMatchedText": {
        textDecoration: "underline"
    },
    ".cm-completionDetail": {
        marginLeft: "0.5em",
        fontStyle: "italic"
    },
    ".cm-completionIcon": {
        fontSize: "90%",
        width: ".8em",
        display: "inline-block",
        textAlign: "center",
        paddingRight: ".6em",
        opacity: "0.6",
        boxSizing: "content-box"
    },
    ".cm-completionIcon-function, .cm-completionIcon-method": {
        "&:after": {
            content: "'ƒ'"
        }
    },
    ".cm-completionIcon-class": {
        "&:after": {
            content: "'○'"
        }
    },
    ".cm-completionIcon-interface": {
        "&:after": {
            content: "'◌'"
        }
    },
    ".cm-completionIcon-variable": {
        "&:after": {
            content: "'𝑥'"
        }
    },
    ".cm-completionIcon-constant": {
        "&:after": {
            content: "'𝐶'"
        }
    },
    ".cm-completionIcon-type": {
        "&:after": {
            content: "'𝑡'"
        }
    },
    ".cm-completionIcon-enum": {
        "&:after": {
            content: "'∪'"
        }
    },
    ".cm-completionIcon-property": {
        "&:after": {
            content: "'□'"
        }
    },
    ".cm-completionIcon-keyword": {
        "&:after": {
            content: "'🔑\uFE0E'"
        } // Disable emoji rendering
    },
    ".cm-completionIcon-namespace": {
        "&:after": {
            content: "'▢'"
        }
    },
    ".cm-completionIcon-text": {
        "&:after": {
            content: "'abc'",
            fontSize: "50%",
            verticalAlign: "middle"
        }
    }
});
class FieldPos {
    constructor(field, line, from, to){
        this.field = field;
        this.line = line;
        this.from = from;
        this.to = to;
    }
}
class FieldRange {
    constructor(field, from, to){
        this.field = field;
        this.from = from;
        this.to = to;
    }
    map(changes) {
        let from = changes.mapPos(this.from, -1, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapMode"].TrackDel);
        let to = changes.mapPos(this.to, 1, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapMode"].TrackDel);
        return from == null || to == null ? null : new FieldRange(this.field, from, to);
    }
}
class Snippet {
    constructor(lines, fieldPositions){
        this.lines = lines;
        this.fieldPositions = fieldPositions;
    }
    instantiate(state, pos) {
        let text = [], lineStart = [
            pos
        ];
        let lineObj = state.doc.lineAt(pos), baseIndent = /^\s*/.exec(lineObj.text)[0];
        for (let line of this.lines){
            if (text.length) {
                let indent = baseIndent, tabs = /^\t*/.exec(line)[0].length;
                for(let i = 0; i < tabs; i++)indent += state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentUnit"]);
                lineStart.push(pos + indent.length - tabs);
                line = indent + line.slice(tabs);
            }
            text.push(line);
            pos += line.length + 1;
        }
        let ranges = this.fieldPositions.map((pos)=>new FieldRange(pos.field, lineStart[pos.line] + pos.from, lineStart[pos.line] + pos.to));
        return {
            text,
            ranges
        };
    }
    static parse(template) {
        let fields = [];
        let lines = [], positions = [], m;
        for (let line of template.split(/\r\n?|\n/)){
            while(m = /[#$]\{(?:(\d+)(?::([^{}]*))?|((?:\\[{}]|[^{}])*))\}/.exec(line)){
                let seq = m[1] ? +m[1] : null, rawName = m[2] || m[3] || "", found = -1;
                let name = rawName.replace(/\\[{}]/g, (m)=>m[1]);
                for(let i = 0; i < fields.length; i++){
                    if (seq != null ? fields[i].seq == seq : name ? fields[i].name == name : false) found = i;
                }
                if (found < 0) {
                    let i = 0;
                    while(i < fields.length && (seq == null || fields[i].seq != null && fields[i].seq < seq))i++;
                    fields.splice(i, 0, {
                        seq,
                        name
                    });
                    found = i;
                    for (let pos of positions)if (pos.field >= found) pos.field++;
                }
                for (let pos of positions)if (pos.line == lines.length && pos.from > m.index) {
                    let snip = m[2] ? 3 + (m[1] || "").length : 2;
                    pos.from -= snip;
                    pos.to -= snip;
                }
                positions.push(new FieldPos(found, lines.length, m.index, m.index + name.length));
                line = line.slice(0, m.index) + rawName + line.slice(m.index + m[0].length);
            }
            line = line.replace(/\\([{}])/g, (_, brace, index)=>{
                for (let pos of positions)if (pos.line == lines.length && pos.from > index) {
                    pos.from--;
                    pos.to--;
                }
                return brace;
            });
            lines.push(line);
        }
        return new Snippet(lines, positions);
    }
}
let fieldMarker = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].widget({
    widget: /*@__PURE__*/ new class extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetType"] {
        toDOM() {
            let span = document.createElement("span");
            span.className = "cm-snippetFieldPosition";
            return span;
        }
        ignoreEvent() {
            return false;
        }
    }
});
let fieldRange = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].mark({
    class: "cm-snippetField"
});
class ActiveSnippet {
    constructor(ranges, active){
        this.ranges = ranges;
        this.active = active;
        this.deco = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].set(ranges.map((r)=>(r.from == r.to ? fieldMarker : fieldRange).range(r.from, r.to)), true);
    }
    map(changes) {
        let ranges = [];
        for (let r of this.ranges){
            let mapped = r.map(changes);
            if (!mapped) return null;
            ranges.push(mapped);
        }
        return new ActiveSnippet(ranges, this.active);
    }
    selectionInsideField(sel) {
        return sel.ranges.every((range)=>this.ranges.some((r)=>r.field == this.active && r.from <= range.from && r.to >= range.to));
    }
}
const setActive = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define({
    map (value, changes) {
        return value && value.map(changes);
    }
});
const moveToField = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define();
const snippetState = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create () {
        return null;
    },
    update (value, tr) {
        for (let effect of tr.effects){
            if (effect.is(setActive)) return effect.value;
            if (effect.is(moveToField) && value) return new ActiveSnippet(value.ranges, effect.value);
        }
        if (value && tr.docChanged) value = value.map(tr.changes);
        if (value && tr.selection && !value.selectionInsideField(tr.selection)) value = null;
        return value;
    },
    provide: (f)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].decorations.from(f, (val)=>val ? val.deco : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Decoration"].none)
});
function fieldSelection(ranges, field) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create(ranges.filter((r)=>r.field == field).map((r)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(r.from, r.to)));
}
/**
Convert a snippet template to a function that can
[apply](https://codemirror.net/6/docs/ref/#autocomplete.Completion.apply) it. Snippets are written
using syntax like this:

    "for (let ${index} = 0; ${index} < ${end}; ${index}++) {\n\t${}\n}"

Each `${}` placeholder (you may also use `#{}`) indicates a field
that the user can fill in. Its name, if any, will be the default
content for the field.

When the snippet is activated by calling the returned function,
the code is inserted at the given position. Newlines in the
template are indented by the indentation of the start line, plus
one [indent unit](https://codemirror.net/6/docs/ref/#language.indentUnit) per tab character after
the newline.

On activation, (all instances of) the first field are selected.
The user can move between fields with Tab and Shift-Tab as long as
the fields are active. Moving to the last field or moving the
cursor out of the current field deactivates the fields.

The order of fields defaults to textual order, but you can add
numbers to placeholders (`${1}` or `${1:defaultText}`) to provide
a custom order.

To include a literal `{` or `}` in your template, put a backslash
in front of it. This will be removed and the brace will not be
interpreted as indicating a placeholder.
*/ function snippet(template) {
    let snippet = Snippet.parse(template);
    return (editor, completion, from, to)=>{
        let { text, ranges } = snippet.instantiate(editor.state, from);
        let { main } = editor.state.selection;
        let spec = {
            changes: {
                from,
                to: to == main.from ? main.to : to,
                insert: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"].of(text)
            },
            scrollIntoView: true,
            annotations: completion ? [
                pickedCompletion.of(completion),
                __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Transaction"].userEvent.of("input.complete")
            ] : undefined
        };
        if (ranges.length) spec.selection = fieldSelection(ranges, 0);
        if (ranges.some((r)=>r.field > 0)) {
            let active = new ActiveSnippet(ranges, 0);
            let effects = spec.effects = [
                setActive.of(active)
            ];
            if (editor.state.field(snippetState, false) === undefined) effects.push(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].appendConfig.of([
                snippetState,
                addSnippetKeymap,
                snippetPointerHandler,
                baseTheme
            ]));
        }
        editor.dispatch(editor.state.update(spec));
    };
}
function moveField(dir) {
    return ({ state, dispatch })=>{
        let active = state.field(snippetState, false);
        if (!active || dir < 0 && active.active == 0) return false;
        let next = active.active + dir, last = dir > 0 && !active.ranges.some((r)=>r.field == next + dir);
        dispatch(state.update({
            selection: fieldSelection(active.ranges, next),
            effects: setActive.of(last ? null : new ActiveSnippet(active.ranges, next)),
            scrollIntoView: true
        }));
        return true;
    };
}
/**
A command that clears the active snippet, if any.
*/ const clearSnippet = ({ state, dispatch })=>{
    let active = state.field(snippetState, false);
    if (!active) return false;
    dispatch(state.update({
        effects: setActive.of(null)
    }));
    return true;
};
/**
Move to the next snippet field, if available.
*/ const nextSnippetField = /*@__PURE__*/ moveField(1);
/**
Move to the previous snippet field, if available.
*/ const prevSnippetField = /*@__PURE__*/ moveField(-1);
/**
Check if there is an active snippet with a next field for
`nextSnippetField` to move to.
*/ function hasNextSnippetField(state) {
    let active = state.field(snippetState, false);
    return !!(active && active.ranges.some((r)=>r.field == active.active + 1));
}
/**
Returns true if there is an active snippet and a previous field
for `prevSnippetField` to move to.
*/ function hasPrevSnippetField(state) {
    let active = state.field(snippetState, false);
    return !!(active && active.active > 0);
}
const defaultSnippetKeymap = [
    {
        key: "Tab",
        run: nextSnippetField,
        shift: prevSnippetField
    },
    {
        key: "Escape",
        run: clearSnippet
    }
];
/**
A facet that can be used to configure the key bindings used by
snippets. The default binds Tab to
[`nextSnippetField`](https://codemirror.net/6/docs/ref/#autocomplete.nextSnippetField), Shift-Tab to
[`prevSnippetField`](https://codemirror.net/6/docs/ref/#autocomplete.prevSnippetField), and Escape
to [`clearSnippet`](https://codemirror.net/6/docs/ref/#autocomplete.clearSnippet).
*/ const snippetKeymap = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (maps) {
        return maps.length ? maps[0] : defaultSnippetKeymap;
    }
});
const addSnippetKeymap = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Prec"].highest(/*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keymap"].compute([
    snippetKeymap
], (state)=>state.facet(snippetKeymap)));
/**
Create a completion from a snippet. Returns an object with the
properties from `completion`, plus an `apply` function that
applies the snippet.
*/ function snippetCompletion(template, completion) {
    return {
        ...completion,
        apply: snippet(template)
    };
}
const snippetPointerHandler = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].domEventHandlers({
    mousedown (event, view) {
        let active = view.state.field(snippetState, false), pos;
        if (!active || (pos = view.posAtCoords({
            x: event.clientX,
            y: event.clientY
        })) == null) return false;
        let match = active.ranges.find((r)=>r.from <= pos && r.to >= pos);
        if (!match || match.field == active.active) return false;
        view.dispatch({
            selection: fieldSelection(active.ranges, match.field),
            effects: setActive.of(active.ranges.some((r)=>r.field > match.field) ? new ActiveSnippet(active.ranges, match.field) : null),
            scrollIntoView: true
        });
        return true;
    }
});
function wordRE(wordChars) {
    let escaped = wordChars.replace(/[\]\-\\]/g, "\\$&");
    try {
        return new RegExp(`[\\p{Alphabetic}\\p{Number}_${escaped}]+`, "ug");
    } catch (_a) {
        return new RegExp(`[\w${escaped}]`, "g");
    }
}
function mapRE(re, f) {
    return new RegExp(f(re.source), re.unicode ? "u" : "");
}
const wordCaches = /*@__PURE__*/ Object.create(null);
function wordCache(wordChars) {
    return wordCaches[wordChars] || (wordCaches[wordChars] = new WeakMap);
}
function storeWords(doc, wordRE, result, seen, ignoreAt) {
    for(let lines = doc.iterLines(), pos = 0; !lines.next().done;){
        let { value } = lines, m;
        wordRE.lastIndex = 0;
        while(m = wordRE.exec(value)){
            if (!seen[m[0]] && pos + m.index != ignoreAt) {
                result.push({
                    type: "text",
                    label: m[0]
                });
                seen[m[0]] = true;
                if (result.length >= 2000 /* C.MaxList */ ) return;
            }
        }
        pos += value.length + 1;
    }
}
function collectWords(doc, cache, wordRE, to, ignoreAt) {
    let big = doc.length >= 1000 /* C.MinCacheLen */ ;
    let cached = big && cache.get(doc);
    if (cached) return cached;
    let result = [], seen = Object.create(null);
    if (doc.children) {
        let pos = 0;
        for (let ch of doc.children){
            if (ch.length >= 1000 /* C.MinCacheLen */ ) {
                for (let c of collectWords(ch, cache, wordRE, to - pos, ignoreAt - pos)){
                    if (!seen[c.label]) {
                        seen[c.label] = true;
                        result.push(c);
                    }
                }
            } else {
                storeWords(ch, wordRE, result, seen, ignoreAt - pos);
            }
            pos += ch.length + 1;
        }
    } else {
        storeWords(doc, wordRE, result, seen, ignoreAt);
    }
    if (big && result.length < 2000 /* C.MaxList */ ) cache.set(doc, result);
    return result;
}
/**
A completion source that will scan the document for words (using a
[character categorizer](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer)), and
return those as completions.
*/ const completeAnyWord = (context)=>{
    let wordChars = context.state.languageDataAt("wordChars", context.pos).join("");
    let re = wordRE(wordChars);
    let token = context.matchBefore(mapRE(re, (s)=>s + "$"));
    if (!token && !context.explicit) return null;
    let from = token ? token.from : context.pos;
    let options = collectWords(context.state.doc, wordCache(wordChars), re, 50000 /* C.Range */ , from);
    return {
        from,
        options,
        validFor: mapRE(re, (s)=>"^" + s)
    };
};
const defaults = {
    brackets: [
        "(",
        "[",
        "{",
        "'",
        '"'
    ],
    before: ")]}:;>",
    stringPrefixes: []
};
const closeBracketEffect = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].define({
    map (value, mapping) {
        let mapped = mapping.mapPos(value, -1, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapMode"].TrackAfter);
        return mapped == null ? undefined : mapped;
    }
});
const closedBracket = /*@__PURE__*/ new class extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeValue"] {
};
closedBracket.startSide = 1;
closedBracket.endSide = -1;
const bracketState = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create () {
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeSet"].empty;
    },
    update (value, tr) {
        value = value.map(tr.changes);
        if (tr.selection) {
            let line = tr.state.doc.lineAt(tr.selection.main.head);
            value = value.update({
                filter: (from)=>from >= line.from && from <= line.to
            });
        }
        for (let effect of tr.effects)if (effect.is(closeBracketEffect)) value = value.update({
            add: [
                closedBracket.range(effect.value, effect.value + 1)
            ]
        });
        return value;
    }
});
/**
Extension to enable bracket-closing behavior. When a closeable
bracket is typed, its closing bracket is immediately inserted
after the cursor. When closing a bracket directly in front of a
closing bracket inserted by the extension, the cursor moves over
that bracket.
*/ function closeBrackets() {
    return [
        inputHandler,
        bracketState
    ];
}
const definedClosing = "()[]{}<>«»»«［］｛｝";
function closing(ch) {
    for(let i = 0; i < definedClosing.length; i += 2)if (definedClosing.charCodeAt(i) == ch) return definedClosing.charAt(i + 1);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromCodePoint"])(ch < 128 ? ch : ch + 1);
}
function config(state, pos) {
    return state.languageDataAt("closeBrackets", pos)[0] || defaults;
}
const android = typeof navigator == "object" && /*@__PURE__*/ /Android\b/.test(navigator.userAgent);
const inputHandler = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].inputHandler.of((view, from, to, insert)=>{
    if ((android ? view.composing : view.compositionStarted) || view.state.readOnly) return false;
    let sel = view.state.selection.main;
    if (insert.length > 2 || insert.length == 2 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(insert, 0)) == 1 || from != sel.from || to != sel.to) return false;
    let tr = insertBracket(view.state, insert);
    if (!tr) return false;
    view.dispatch(tr);
    return true;
});
/**
Command that implements deleting a pair of matching brackets when
the cursor is between them.
*/ const deleteBracketPair = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    let conf = config(state, state.selection.main.head);
    let tokens = conf.brackets || defaults.brackets;
    let dont = null, changes = state.changeByRange((range)=>{
        if (range.empty) {
            let before = prevChar(state.doc, range.head);
            for (let token of tokens){
                if (token == before && nextChar(state.doc, range.head) == closing((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(token, 0))) return {
                    changes: {
                        from: range.head - token.length,
                        to: range.head + token.length
                    },
                    range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.head - token.length)
                };
            }
        }
        return {
            range: dont = range
        };
    });
    if (!dont) dispatch(state.update(changes, {
        scrollIntoView: true,
        userEvent: "delete.backward"
    }));
    return !dont;
};
/**
Close-brackets related key bindings. Binds Backspace to
[`deleteBracketPair`](https://codemirror.net/6/docs/ref/#autocomplete.deleteBracketPair).
*/ const closeBracketsKeymap = [
    {
        key: "Backspace",
        run: deleteBracketPair
    }
];
/**
Implements the extension's behavior on text insertion. If the
given string counts as a bracket in the language around the
selection, and replacing the selection with it requires custom
behavior (inserting a closing version or skipping past a
previously-closed bracket), this function returns a transaction
representing that custom behavior. (You only need this if you want
to programmatically insert brackets—the
[`closeBrackets`](https://codemirror.net/6/docs/ref/#autocomplete.closeBrackets) extension will
take care of running this for user input.)
*/ function insertBracket(state, bracket) {
    let conf = config(state, state.selection.main.head);
    let tokens = conf.brackets || defaults.brackets;
    for (let tok of tokens){
        let closed = closing((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(tok, 0));
        if (bracket == tok) return closed == tok ? handleSame(state, tok, tokens.indexOf(tok + tok + tok) > -1, conf) : handleOpen(state, tok, closed, conf.before || defaults.before);
        if (bracket == closed && closedBracketAt(state, state.selection.main.from)) return handleClose(state, tok, closed);
    }
    return null;
}
function closedBracketAt(state, pos) {
    let found = false;
    state.field(bracketState).between(0, state.doc.length, (from)=>{
        if (from == pos) found = true;
    });
    return found;
}
function nextChar(doc, pos) {
    let next = doc.sliceString(pos, pos + 2);
    return next.slice(0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(next, 0)));
}
function prevChar(doc, pos) {
    let prev = doc.sliceString(pos - 2, pos);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["codePointAt"])(prev, 0)) == prev.length ? prev : prev.slice(1);
}
function handleOpen(state, open, close, closeBefore) {
    let dont = null, changes = state.changeByRange((range)=>{
        if (!range.empty) return {
            changes: [
                {
                    insert: open,
                    from: range.from
                },
                {
                    insert: close,
                    from: range.to
                }
            ],
            effects: closeBracketEffect.of(range.to + open.length),
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(range.anchor + open.length, range.head + open.length)
        };
        let next = nextChar(state.doc, range.head);
        if (!next || /\s/.test(next) || closeBefore.indexOf(next) > -1) return {
            changes: {
                insert: open + close,
                from: range.head
            },
            effects: closeBracketEffect.of(range.head + open.length),
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.head + open.length)
        };
        return {
            range: dont = range
        };
    });
    return dont ? null : state.update(changes, {
        scrollIntoView: true,
        userEvent: "input.type"
    });
}
function handleClose(state, _open, close) {
    let dont = null, changes = state.changeByRange((range)=>{
        if (range.empty && nextChar(state.doc, range.head) == close) return {
            changes: {
                from: range.head,
                to: range.head + close.length,
                insert: close
            },
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.head + close.length)
        };
        return dont = {
            range
        };
    });
    return dont ? null : state.update(changes, {
        scrollIntoView: true,
        userEvent: "input.type"
    });
}
// Handles cases where the open and close token are the same, and
// possibly triple quotes (as in `"""abc"""`-style quoting).
function handleSame(state, token, allowTriple, config) {
    let stringPrefixes = config.stringPrefixes || defaults.stringPrefixes;
    let dont = null, changes = state.changeByRange((range)=>{
        if (!range.empty) return {
            changes: [
                {
                    insert: token,
                    from: range.from
                },
                {
                    insert: token,
                    from: range.to
                }
            ],
            effects: closeBracketEffect.of(range.to + token.length),
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(range.anchor + token.length, range.head + token.length)
        };
        let pos = range.head, next = nextChar(state.doc, pos), start;
        if (next == token) {
            if (nodeStart(state, pos)) {
                return {
                    changes: {
                        insert: token + token,
                        from: pos
                    },
                    effects: closeBracketEffect.of(pos + token.length),
                    range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(pos + token.length)
                };
            } else if (closedBracketAt(state, pos)) {
                let isTriple = allowTriple && state.sliceDoc(pos, pos + token.length * 3) == token + token + token;
                let content = isTriple ? token + token + token : token;
                return {
                    changes: {
                        from: pos,
                        to: pos + content.length,
                        insert: content
                    },
                    range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(pos + content.length)
                };
            }
        } else if (allowTriple && state.sliceDoc(pos - 2 * token.length, pos) == token + token && (start = canStartStringAt(state, pos - 2 * token.length, stringPrefixes)) > -1 && nodeStart(state, start)) {
            return {
                changes: {
                    insert: token + token + token + token,
                    from: pos
                },
                effects: closeBracketEffect.of(pos + token.length),
                range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(pos + token.length)
            };
        } else if (state.charCategorizer(pos)(next) != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word) {
            if (canStartStringAt(state, pos, stringPrefixes) > -1 && !probablyInString(state, pos, token, stringPrefixes)) return {
                changes: {
                    insert: token + token,
                    from: pos
                },
                effects: closeBracketEffect.of(pos + token.length),
                range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(pos + token.length)
            };
        }
        return {
            range: dont = range
        };
    });
    return dont ? null : state.update(changes, {
        scrollIntoView: true,
        userEvent: "input.type"
    });
}
function nodeStart(state, pos) {
    let tree = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(state).resolveInner(pos + 1);
    return tree.parent && tree.from == pos;
}
function probablyInString(state, pos, quoteToken, prefixes) {
    let node = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(state).resolveInner(pos, -1);
    let maxPrefix = prefixes.reduce((m, p)=>Math.max(m, p.length), 0);
    for(let i = 0; i < 5; i++){
        let start = state.sliceDoc(node.from, Math.min(node.to, node.from + quoteToken.length + maxPrefix));
        let quotePos = start.indexOf(quoteToken);
        if (!quotePos || quotePos > -1 && prefixes.indexOf(start.slice(0, quotePos)) > -1) {
            let first = node.firstChild;
            while(first && first.from == node.from && first.to - first.from > quoteToken.length + quotePos){
                if (state.sliceDoc(first.to - quoteToken.length, first.to) == quoteToken) return false;
                first = first.firstChild;
            }
            return true;
        }
        let parent = node.to == pos && node.parent;
        if (!parent) break;
        node = parent;
    }
    return false;
}
function canStartStringAt(state, pos, prefixes) {
    let charCat = state.charCategorizer(pos);
    if (charCat(state.sliceDoc(pos - 1, pos)) != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word) return pos;
    for (let prefix of prefixes){
        let start = pos - prefix.length;
        if (state.sliceDoc(start, pos) == prefix && charCat(state.sliceDoc(start - 1, start)) != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word) return start;
    }
    return -1;
}
/**
Returns an extension that enables autocompletion.
*/ function autocompletion(config = {}) {
    return [
        commitCharacters,
        completionState,
        completionConfig.of(config),
        completionPlugin,
        completionKeymapExt,
        baseTheme
    ];
}
/**
Basic keybindings for autocompletion.

 - Ctrl-Space (and Alt-\` or Alt-i on macOS): [`startCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.startCompletion)
 - Escape: [`closeCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.closeCompletion)
 - ArrowDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true)`
 - ArrowUp: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(false)`
 - PageDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true, "page")`
 - PageUp: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(false, "page")`
 - Enter: [`acceptCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.acceptCompletion)
*/ const completionKeymap = [
    {
        key: "Ctrl-Space",
        run: startCompletion
    },
    {
        mac: "Alt-`",
        run: startCompletion
    },
    {
        mac: "Alt-i",
        run: startCompletion
    },
    {
        key: "Escape",
        run: closeCompletion
    },
    {
        key: "ArrowDown",
        run: /*@__PURE__*/ moveCompletionSelection(true)
    },
    {
        key: "ArrowUp",
        run: /*@__PURE__*/ moveCompletionSelection(false)
    },
    {
        key: "PageDown",
        run: /*@__PURE__*/ moveCompletionSelection(true, "page")
    },
    {
        key: "PageUp",
        run: /*@__PURE__*/ moveCompletionSelection(false, "page")
    },
    {
        key: "Enter",
        run: acceptCompletion
    }
];
const completionKeymapExt = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Prec"].highest(/*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keymap"].computeN([
    completionConfig
], (state)=>state.facet(completionConfig).defaultKeymap ? [
        completionKeymap
    ] : []));
/**
Get the current completion status. When completions are available,
this will return `"active"`. When completions are pending (in the
process of being queried), this returns `"pending"`. Otherwise, it
returns `null`.
*/ function completionStatus(state) {
    let cState = state.field(completionState, false);
    return cState && cState.active.some((a)=>a.isPending) ? "pending" : cState && cState.active.some((a)=>a.state != 0 /* State.Inactive */ ) ? "active" : null;
}
const completionArrayCache = /*@__PURE__*/ new WeakMap;
/**
Returns the available completions as an array.
*/ function currentCompletions(state) {
    var _a;
    let open = (_a = state.field(completionState, false)) === null || _a === void 0 ? void 0 : _a.open;
    if (!open || open.disabled) return [];
    let completions = completionArrayCache.get(open.options);
    if (!completions) completionArrayCache.set(open.options, completions = open.options.map((o)=>o.completion));
    return completions;
}
/**
Return the currently selected completion, if any.
*/ function selectedCompletion(state) {
    var _a;
    let open = (_a = state.field(completionState, false)) === null || _a === void 0 ? void 0 : _a.open;
    return open && !open.disabled && open.selected >= 0 ? open.options[open.selected].completion : null;
}
/**
Returns the currently selected position in the active completion
list, or null if no completions are active.
*/ function selectedCompletionIndex(state) {
    var _a;
    let open = (_a = state.field(completionState, false)) === null || _a === void 0 ? void 0 : _a.open;
    return open && !open.disabled && open.selected >= 0 ? open.selected : null;
}
/**
Create an effect that can be attached to a transaction to change
the currently selected completion.
*/ function setSelectedCompletion(index) {
    return setSelectedEffect.of(index);
}
;
}),
"[project]/pwa/node_modules/@codemirror/lang-sql/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Cassandra",
    ()=>Cassandra,
    "MSSQL",
    ()=>MSSQL,
    "MariaSQL",
    ()=>MariaSQL,
    "MySQL",
    ()=>MySQL,
    "PLSQL",
    ()=>PLSQL,
    "PostgreSQL",
    ()=>PostgreSQL,
    "SQLDialect",
    ()=>SQLDialect,
    "SQLite",
    ()=>SQLite,
    "StandardSQL",
    ()=>StandardSQL,
    "keywordCompletionSource",
    ()=>keywordCompletionSource,
    "schemaCompletionSource",
    ()=>schemaCompletionSource,
    "sql",
    ()=>sql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/language/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/highlight/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$lr$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/lr/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$autocomplete$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/autocomplete/dist/index.js [app-client] (ecmascript)");
;
;
;
;
// This file was generated by lezer-generator. You probably shouldn't edit it.
const whitespace = 36, LineComment = 1, BlockComment = 2, String$1 = 3, Number = 4, Bool = 5, Null = 6, ParenL = 7, ParenR = 8, BraceL = 9, BraceR = 10, BracketL = 11, BracketR = 12, Semi = 13, Dot = 14, Operator = 15, Punctuation = 16, SpecialVar = 17, Identifier = 18, QuotedIdentifier = 19, Keyword = 20, Type = 21, Bits = 22, Bytes = 23, Builtin = 24;
function isAlpha(ch) {
    return ch >= 65 /* Ch.A */  && ch <= 90 /* Ch.Z */  || ch >= 97 /* Ch.a */  && ch <= 122 /* Ch.z */  || ch >= 48 /* Ch._0 */  && ch <= 57 /* Ch._9 */ ;
}
function isHexDigit(ch) {
    return ch >= 48 /* Ch._0 */  && ch <= 57 /* Ch._9 */  || ch >= 97 /* Ch.a */  && ch <= 102 /* Ch.f */  || ch >= 65 /* Ch.A */  && ch <= 70 /* Ch.F */ ;
}
function readLiteral(input, endQuote, backslashEscapes) {
    for(let escaped = false;;){
        if (input.next < 0) return;
        if (input.next == endQuote && !escaped) {
            input.advance();
            return;
        }
        escaped = backslashEscapes && !escaped && input.next == 92 /* Ch.Backslash */ ;
        input.advance();
    }
}
function readDoubleDollarLiteral(input, tag) {
    scan: for(;;){
        if (input.next < 0) return;
        if (input.next == 36 /* Ch.Dollar */ ) {
            input.advance();
            for(let i = 0; i < tag.length; i++){
                if (input.next != tag.charCodeAt(i)) continue scan;
                input.advance();
            }
            if (input.next == 36 /* Ch.Dollar */ ) {
                input.advance();
                return;
            }
        } else {
            input.advance();
        }
    }
}
function readPLSQLQuotedLiteral(input, openDelim) {
    let matchingDelim = "[{<(".indexOf(String.fromCharCode(openDelim));
    let closeDelim = matchingDelim < 0 ? openDelim : "]}>)".charCodeAt(matchingDelim);
    for(;;){
        if (input.next < 0) return;
        if (input.next == closeDelim && input.peek(1) == 39 /* Ch.SingleQuote */ ) {
            input.advance(2);
            return;
        }
        input.advance();
    }
}
function readWord(input, result) {
    for(;;){
        if (input.next != 95 /* Ch.Underscore */  && !isAlpha(input.next)) break;
        if (result != null) result += String.fromCharCode(input.next);
        input.advance();
    }
    return result;
}
function readWordOrQuoted(input) {
    if (input.next == 39 /* Ch.SingleQuote */  || input.next == 34 /* Ch.DoubleQuote */  || input.next == 96 /* Ch.Backtick */ ) {
        let quote = input.next;
        input.advance();
        readLiteral(input, quote, false);
    } else {
        readWord(input);
    }
}
function readBits(input, endQuote) {
    while(input.next == 48 /* Ch._0 */  || input.next == 49 /* Ch._1 */ )input.advance();
    if (endQuote && input.next == endQuote) input.advance();
}
function readNumber(input, sawDot) {
    for(;;){
        if (input.next == 46 /* Ch.Dot */ ) {
            if (sawDot) break;
            sawDot = true;
        } else if (input.next < 48 /* Ch._0 */  || input.next > 57 /* Ch._9 */ ) {
            break;
        }
        input.advance();
    }
    if (input.next == 69 /* Ch.E */  || input.next == 101 /* Ch.e */ ) {
        input.advance();
        if (input.next == 43 /* Ch.Plus */  || input.next == 45 /* Ch.Dash */ ) input.advance();
        while(input.next >= 48 /* Ch._0 */  && input.next <= 57 /* Ch._9 */ )input.advance();
    }
}
function eol(input) {
    while(!(input.next < 0 || input.next == 10 /* Ch.Newline */ ))input.advance();
}
function inString(ch, str) {
    for(let i = 0; i < str.length; i++)if (str.charCodeAt(i) == ch) return true;
    return false;
}
const Space = " \t\r\n";
function keywords(keywords, types, builtin) {
    let result = Object.create(null);
    result["true"] = result["false"] = Bool;
    result["null"] = result["unknown"] = Null;
    for (let kw of keywords.split(" "))if (kw) result[kw] = Keyword;
    for (let tp of types.split(" "))if (tp) result[tp] = Type;
    for (let kw of (builtin || "").split(" "))if (kw) result[kw] = Builtin;
    return result;
}
const SQLTypes = "array binary bit boolean char character clob date decimal double float int integer interval large national nchar nclob numeric object precision real smallint time timestamp varchar varying ";
const SQLKeywords = "absolute action add after all allocate alter and any are as asc assertion at authorization before begin between both breadth by call cascade cascaded case cast catalog check close collate collation column commit condition connect connection constraint constraints constructor continue corresponding count create cross cube current current_date current_default_transform_group current_transform_group_for_type current_path current_role current_time current_timestamp current_user cursor cycle data day deallocate declare default deferrable deferred delete depth deref desc describe descriptor deterministic diagnostics disconnect distinct do domain drop dynamic each else elseif end end-exec equals escape except exception exec execute exists exit external fetch first for foreign found from free full function general get global go goto grant group grouping handle having hold hour identity if immediate in indicator initially inner inout input insert intersect into is isolation join key language last lateral leading leave left level like limit local localtime localtimestamp locator loop map match method minute modifies module month names natural nesting new next no none not of old on only open option or order ordinality out outer output overlaps pad parameter partial path prepare preserve primary prior privileges procedure public read reads recursive redo ref references referencing relative release repeat resignal restrict result return returns revoke right role rollback rollup routine row rows savepoint schema scroll search second section select session session_user set sets signal similar size some space specific specifictype sql sqlexception sqlstate sqlwarning start state static system_user table temporary then timezone_hour timezone_minute to trailing transaction translation treat trigger under undo union unique unnest until update usage user using value values view when whenever where while with without work write year zone ";
const defaults = {
    backslashEscapes: false,
    hashComments: false,
    spaceAfterDashes: false,
    slashComments: false,
    doubleQuotedStrings: false,
    doubleDollarQuotedStrings: false,
    unquotedBitLiterals: false,
    treatBitsAsBytes: false,
    charSetCasts: false,
    plsqlQuotingMechanism: false,
    operatorChars: "*+\-%<>!=&|~^/",
    specialVar: "?",
    identifierQuotes: '"',
    caseInsensitiveIdentifiers: false,
    words: /*@__PURE__*/ keywords(SQLKeywords, SQLTypes)
};
function dialect(spec, kws, types, builtin) {
    let dialect = {};
    for(let prop in defaults)dialect[prop] = (spec.hasOwnProperty(prop) ? spec : defaults)[prop];
    if (kws) dialect.words = keywords(kws, types || "", builtin);
    return dialect;
}
function tokensFor(d) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$lr$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExternalTokenizer"]((input)=>{
        var _a;
        let { next } = input;
        input.advance();
        if (inString(next, Space)) {
            while(inString(input.next, Space))input.advance();
            input.acceptToken(whitespace);
        } else if (next == 36 /* Ch.Dollar */  && d.doubleDollarQuotedStrings) {
            let tag = readWord(input, "");
            if (input.next == 36 /* Ch.Dollar */ ) {
                input.advance();
                readDoubleDollarLiteral(input, tag);
                input.acceptToken(String$1);
            }
        } else if (next == 39 /* Ch.SingleQuote */  || next == 34 /* Ch.DoubleQuote */  && d.doubleQuotedStrings) {
            readLiteral(input, next, d.backslashEscapes);
            input.acceptToken(String$1);
        } else if (next == 35 /* Ch.Hash */  && d.hashComments || next == 47 /* Ch.Slash */  && input.next == 47 /* Ch.Slash */  && d.slashComments) {
            eol(input);
            input.acceptToken(LineComment);
        } else if (next == 45 /* Ch.Dash */  && input.next == 45 /* Ch.Dash */  && (!d.spaceAfterDashes || input.peek(1) == 32 /* Ch.Space */ )) {
            eol(input);
            input.acceptToken(LineComment);
        } else if (next == 47 /* Ch.Slash */  && input.next == 42 /* Ch.Star */ ) {
            input.advance();
            for(let depth = 1;;){
                let cur = input.next;
                if (input.next < 0) break;
                input.advance();
                if (cur == 42 /* Ch.Star */  && input.next == 47 /* Ch.Slash */ ) {
                    depth--;
                    input.advance();
                    if (!depth) break;
                } else if (cur == 47 /* Ch.Slash */  && input.next == 42 /* Ch.Star */ ) {
                    depth++;
                    input.advance();
                }
            }
            input.acceptToken(BlockComment);
        } else if ((next == 101 /* Ch.e */  || next == 69 /* Ch.E */ ) && input.next == 39 /* Ch.SingleQuote */ ) {
            input.advance();
            readLiteral(input, 39 /* Ch.SingleQuote */ , true);
            input.acceptToken(String$1);
        } else if ((next == 110 /* Ch.n */  || next == 78 /* Ch.N */ ) && input.next == 39 /* Ch.SingleQuote */  && d.charSetCasts) {
            input.advance();
            readLiteral(input, 39 /* Ch.SingleQuote */ , d.backslashEscapes);
            input.acceptToken(String$1);
        } else if (next == 95 /* Ch.Underscore */  && d.charSetCasts) {
            for(let i = 0;; i++){
                if (input.next == 39 /* Ch.SingleQuote */  && i > 1) {
                    input.advance();
                    readLiteral(input, 39 /* Ch.SingleQuote */ , d.backslashEscapes);
                    input.acceptToken(String$1);
                    break;
                }
                if (!isAlpha(input.next)) break;
                input.advance();
            }
        } else if (d.plsqlQuotingMechanism && (next == 113 /* Ch.q */  || next == 81 /* Ch.Q */ ) && input.next == 39 /* Ch.SingleQuote */  && input.peek(1) > 0 && !inString(input.peek(1), Space)) {
            let openDelim = input.peek(1);
            input.advance(2);
            readPLSQLQuotedLiteral(input, openDelim);
            input.acceptToken(String$1);
        } else if (inString(next, d.identifierQuotes)) {
            const endQuote = next == 91 /* Ch.BracketL */  ? 93 /* Ch.BracketR */  : next;
            readLiteral(input, endQuote, false);
            input.acceptToken(QuotedIdentifier);
        } else if (next == 40 /* Ch.ParenL */ ) {
            input.acceptToken(ParenL);
        } else if (next == 41 /* Ch.ParenR */ ) {
            input.acceptToken(ParenR);
        } else if (next == 123 /* Ch.BraceL */ ) {
            input.acceptToken(BraceL);
        } else if (next == 125 /* Ch.BraceR */ ) {
            input.acceptToken(BraceR);
        } else if (next == 91 /* Ch.BracketL */ ) {
            input.acceptToken(BracketL);
        } else if (next == 93 /* Ch.BracketR */ ) {
            input.acceptToken(BracketR);
        } else if (next == 59 /* Ch.Semi */ ) {
            input.acceptToken(Semi);
        } else if (d.unquotedBitLiterals && next == 48 /* Ch._0 */  && input.next == 98 /* Ch.b */ ) {
            input.advance();
            readBits(input);
            input.acceptToken(Bits);
        } else if ((next == 98 /* Ch.b */  || next == 66 /* Ch.B */ ) && (input.next == 39 /* Ch.SingleQuote */  || input.next == 34 /* Ch.DoubleQuote */ )) {
            const quoteStyle = input.next;
            input.advance();
            if (d.treatBitsAsBytes) {
                readLiteral(input, quoteStyle, d.backslashEscapes);
                input.acceptToken(Bytes);
            } else {
                readBits(input, quoteStyle);
                input.acceptToken(Bits);
            }
        } else if (next == 48 /* Ch._0 */  && (input.next == 120 /* Ch.x */  || input.next == 88 /* Ch.X */ ) || (next == 120 /* Ch.x */  || next == 88 /* Ch.X */ ) && input.next == 39 /* Ch.SingleQuote */ ) {
            let quoted = input.next == 39 /* Ch.SingleQuote */ ;
            input.advance();
            while(isHexDigit(input.next))input.advance();
            if (quoted && input.next == 39 /* Ch.SingleQuote */ ) input.advance();
            input.acceptToken(Number);
        } else if (next == 46 /* Ch.Dot */  && input.next >= 48 /* Ch._0 */  && input.next <= 57 /* Ch._9 */ ) {
            readNumber(input, true);
            input.acceptToken(Number);
        } else if (next == 46 /* Ch.Dot */ ) {
            input.acceptToken(Dot);
        } else if (next >= 48 /* Ch._0 */  && next <= 57 /* Ch._9 */ ) {
            readNumber(input, false);
            input.acceptToken(Number);
        } else if (inString(next, d.operatorChars)) {
            while(inString(input.next, d.operatorChars))input.advance();
            input.acceptToken(Operator);
        } else if (inString(next, d.specialVar)) {
            if (input.next == next) input.advance();
            readWordOrQuoted(input);
            input.acceptToken(SpecialVar);
        } else if (next == 58 /* Ch.Colon */  || next == 44 /* Ch.Comma */ ) {
            input.acceptToken(Punctuation);
        } else if (isAlpha(next)) {
            let word = readWord(input, String.fromCharCode(next));
            input.acceptToken(input.next == 46 /* Ch.Dot */  || input.peek(-word.length - 1) == 46 /* Ch.Dot */  ? Identifier : (_a = d.words[word.toLowerCase()]) !== null && _a !== void 0 ? _a : Identifier);
        }
    });
}
const tokens = /*@__PURE__*/ tokensFor(defaults);
// This file was generated by lezer-generator. You probably shouldn't edit it.
const parser$1 = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$lr$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LRParser"].deserialize({
    version: 14,
    states: "%vQ]QQOOO#wQRO'#DSO$OQQO'#CwO%eQQO'#CxO%lQQO'#CyO%sQQO'#CzOOQQ'#DS'#DSOOQQ'#C}'#C}O'UQRO'#C{OOQQ'#Cv'#CvOOQQ'#C|'#C|Q]QQOOQOQQOOO'`QQO'#DOO(xQRO,59cO)PQQO,59cO)UQQO'#DSOOQQ,59d,59dO)cQQO,59dOOQQ,59e,59eO)jQQO,59eOOQQ,59f,59fO)qQQO,59fOOQQ-E6{-E6{OOQQ,59b,59bOOQQ-E6z-E6zOOQQ,59j,59jOOQQ-E6|-E6|O+VQRO1G.}O+^QQO,59cOOQQ1G/O1G/OOOQQ1G/P1G/POOQQ1G/Q1G/QP+kQQO'#C}O+rQQO1G.}O)PQQO,59cO,PQQO'#Cw",
    stateData: ",[~OtOSPOSQOS~ORUOSUOTUOUUOVROXSOZTO]XO^QO_UO`UOaPObPOcPOdUOeUOfUOgUOhUO~O^]ORvXSvXTvXUvXVvXXvXZvX]vX_vX`vXavXbvXcvXdvXevXfvXgvXhvX~OsvX~P!jOa_Ob_Oc_O~ORUOSUOTUOUUOVROXSOZTO^tO_UO`UOa`Ob`Oc`OdUOeUOfUOgUOhUO~OWaO~P$ZOYcO~P$ZO[eO~P$ZORUOSUOTUOUUOVROXSOZTO^QO_UO`UOaPObPOcPOdUOeUOfUOgUOhUO~O]hOsoX~P%zOajObjOcjO~O^]ORkaSkaTkaUkaVkaXkaZka]ka_ka`kaakabkackadkaekafkagkahka~Oska~P'kO^]O~OWvXYvX[vX~P!jOWnO~P$ZOYoO~P$ZO[pO~P$ZO^]ORkiSkiTkiUkiVkiXkiZki]ki_ki`kiakibkickidkiekifkigkihki~Oski~P)xOWkaYka[ka~P'kO]hO~P$ZOWkiYki[ki~P)xOasObsOcsO~O",
    goto: "#hwPPPPPPPPPPPPPPPPPPPPPPPPPPx||||!Y!^!d!xPPP#[TYOZeUORSTWZbdfqT[OZQZORiZSWOZQbRQdSQfTZgWbdfqQ^PWk^lmrQl_Qm`RrseVORSTWZbdfq",
    nodeNames: "⚠ LineComment BlockComment String Number Bool Null ( ) { } [ ] ; . Operator Punctuation SpecialVar Identifier QuotedIdentifier Keyword Type Bits Bytes Builtin Script Statement CompositeIdentifier Parens Braces Brackets Statement",
    maxTerm: 38,
    nodeProps: [
        [
            "isolate",
            -4,
            1,
            2,
            3,
            19,
            ""
        ]
    ],
    skippedNodes: [
        0,
        1,
        2
    ],
    repeatNodeCount: 3,
    tokenData: "RORO",
    tokenizers: [
        0,
        tokens
    ],
    topRules: {
        "Script": [
            0,
            25
        ]
    },
    tokenPrec: 0
});
function tokenBefore(tree) {
    let cursor = tree.cursor().moveTo(tree.from, -1);
    while(/Comment/.test(cursor.name))cursor.moveTo(cursor.from, -1);
    return cursor.node;
}
function idName(doc, node) {
    let text = doc.sliceString(node.from, node.to);
    let quoted = /^([`'"\[])(.*)([`'"\]])$/.exec(text);
    return quoted ? quoted[2] : text;
}
function plainID(node) {
    return node && (node.name == "Identifier" || node.name == "QuotedIdentifier");
}
function pathFor(doc, id) {
    if (id.name == "CompositeIdentifier") {
        let path = [];
        for(let ch = id.firstChild; ch; ch = ch.nextSibling)if (plainID(ch)) path.push(idName(doc, ch));
        return path;
    }
    return [
        idName(doc, id)
    ];
}
function parentsFor(doc, node) {
    for(let path = [];;){
        if (!node || node.name != ".") return path;
        let name = tokenBefore(node);
        if (!plainID(name)) return path;
        path.unshift(idName(doc, name));
        node = tokenBefore(name);
    }
}
function sourceContext(state, startPos) {
    let pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(state).resolveInner(startPos, -1);
    let aliases = getAliases(state.doc, pos);
    if (pos.name == "Identifier" || pos.name == "QuotedIdentifier" || pos.name == "Keyword") {
        return {
            from: pos.from,
            quoted: pos.name == "QuotedIdentifier" ? state.doc.sliceString(pos.from, pos.from + 1) : null,
            parents: parentsFor(state.doc, tokenBefore(pos)),
            aliases
        };
    }
    if (pos.name == ".") {
        return {
            from: startPos,
            quoted: null,
            parents: parentsFor(state.doc, pos),
            aliases
        };
    } else {
        return {
            from: startPos,
            quoted: null,
            parents: [],
            empty: true,
            aliases
        };
    }
}
const EndFrom = /*@__PURE__*/ new Set(/*@__PURE__*/ "where group having order union intersect except all distinct limit offset fetch for".split(" "));
function getAliases(doc, at) {
    let statement;
    for(let parent = at; !statement; parent = parent.parent){
        if (!parent) return null;
        if (parent.name == "Statement") statement = parent;
    }
    let aliases = null;
    for(let scan = statement.firstChild, sawFrom = false, prevID = null; scan; scan = scan.nextSibling){
        let kw = scan.name == "Keyword" ? doc.sliceString(scan.from, scan.to).toLowerCase() : null;
        let alias = null;
        if (!sawFrom) {
            sawFrom = kw == "from";
        } else if (kw == "as" && prevID && plainID(scan.nextSibling)) {
            alias = idName(doc, scan.nextSibling);
        } else if (kw && EndFrom.has(kw)) {
            break;
        } else if (prevID && plainID(scan)) {
            alias = idName(doc, scan);
        }
        if (alias) {
            if (!aliases) aliases = Object.create(null);
            aliases[alias] = pathFor(doc, prevID);
        }
        prevID = /Identifier$/.test(scan.name) ? scan : null;
    }
    return aliases;
}
function maybeQuoteCompletions(openingQuote, closingQuote, completions) {
    return completions.map((c)=>({
            ...c,
            label: c.label[0] == openingQuote ? c.label : openingQuote + c.label + closingQuote,
            apply: undefined
        }));
}
const Span = /^\w*$/, QuotedSpan = /^[`'"\[]?\w*[`'"\]]?$/;
function isSelfTag(namespace) {
    return namespace.self && typeof namespace.self.label == "string";
}
class CompletionLevel {
    constructor(idQuote, idCaseInsensitive){
        this.idQuote = idQuote;
        this.idCaseInsensitive = idCaseInsensitive;
        this.list = [];
        this.children = undefined;
    }
    child(name) {
        let children = this.children || (this.children = Object.create(null));
        let found = children[name];
        if (found) return found;
        if (name && !this.list.some((c)=>c.label == name)) this.list.push(nameCompletion(name, "type", this.idQuote, this.idCaseInsensitive));
        return children[name] = new CompletionLevel(this.idQuote, this.idCaseInsensitive);
    }
    maybeChild(name) {
        return this.children ? this.children[name] : null;
    }
    addCompletion(option) {
        let found = this.list.findIndex((o)=>o.label == option.label);
        if (found > -1) this.list[found] = option;
        else this.list.push(option);
    }
    addCompletions(completions) {
        for (let option of completions)this.addCompletion(typeof option == "string" ? nameCompletion(option, "property", this.idQuote, this.idCaseInsensitive) : option);
    }
    addNamespace(namespace) {
        if (Array.isArray(namespace)) {
            this.addCompletions(namespace);
        } else if (isSelfTag(namespace)) {
            this.addNamespace(namespace.children);
        } else {
            this.addNamespaceObject(namespace);
        }
    }
    addNamespaceObject(namespace) {
        for (let name of Object.keys(namespace)){
            let children = namespace[name], self = null;
            let parts = name.replace(/\\?\./g, (p)=>p == "." ? "\0" : p).split("\0");
            let scope = this;
            if (isSelfTag(children)) {
                self = children.self;
                children = children.children;
            }
            for(let i = 0; i < parts.length; i++){
                if (self && i == parts.length - 1) scope.addCompletion(self);
                scope = scope.child(parts[i].replace(/\\\./g, "."));
            }
            scope.addNamespace(children);
        }
    }
}
function nameCompletion(label, type, idQuote, idCaseInsensitive) {
    if (new RegExp("^[a-z_][a-z_\\d]*$", idCaseInsensitive ? "i" : "").test(label)) return {
        label,
        type
    };
    return {
        label,
        type,
        apply: idQuote + label + getClosingQuote(idQuote)
    };
}
function getClosingQuote(openingQuote) {
    return openingQuote === "[" ? "]" : openingQuote;
}
// Some of this is more gnarly than it has to be because we're also
// supporting the deprecated, not-so-well-considered style of
// supplying the schema (dotted property names for schemas, separate
// `tables` and `schemas` completions).
function completeFromSchema(schema, tables, schemas, defaultTableName, defaultSchemaName, dialect) {
    var _a;
    let idQuote = ((_a = dialect === null || dialect === void 0 ? void 0 : dialect.spec.identifierQuotes) === null || _a === void 0 ? void 0 : _a[0]) || '"';
    let top = new CompletionLevel(idQuote, !!(dialect === null || dialect === void 0 ? void 0 : dialect.spec.caseInsensitiveIdentifiers));
    let defaultSchema = defaultSchemaName ? top.child(defaultSchemaName) : null;
    top.addNamespace(schema);
    if (tables) (defaultSchema || top).addCompletions(tables);
    if (schemas) top.addCompletions(schemas);
    if (defaultSchema) top.addCompletions(defaultSchema.list);
    if (defaultTableName) top.addCompletions((defaultSchema || top).child(defaultTableName).list);
    return (context)=>{
        let { parents, from, quoted, empty, aliases } = sourceContext(context.state, context.pos);
        if (empty && !context.explicit) return null;
        if (aliases && parents.length == 1) parents = aliases[parents[0]] || parents;
        let level = top;
        for (let name of parents){
            while(!level.children || !level.children[name]){
                if (level == top && defaultSchema) level = defaultSchema;
                else if (level == defaultSchema && defaultTableName) level = level.child(defaultTableName);
                else return null;
            }
            let next = level.maybeChild(name);
            if (!next) return null;
            level = next;
        }
        let options = level.list;
        if (level == top && aliases) options = options.concat(Object.keys(aliases).map((name)=>({
                label: name,
                type: "constant"
            })));
        if (quoted) {
            let openingQuote = quoted[0];
            let closingQuote = getClosingQuote(openingQuote);
            let quoteAfter = context.state.sliceDoc(context.pos, context.pos + 1) == closingQuote;
            return {
                from,
                to: quoteAfter ? context.pos + 1 : undefined,
                options: maybeQuoteCompletions(openingQuote, closingQuote, options),
                validFor: QuotedSpan
            };
        } else {
            return {
                from,
                options: options,
                validFor: Span
            };
        }
    };
}
function completionType(tokenType) {
    return tokenType == Type ? "type" : tokenType == Keyword ? "keyword" : "variable";
}
function completeKeywords(keywords, upperCase, build) {
    let completions = Object.keys(keywords).map((keyword)=>build(upperCase ? keyword.toUpperCase() : keyword, completionType(keywords[keyword])));
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$autocomplete$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ifNotIn"])([
        "QuotedIdentifier",
        "String",
        "LineComment",
        "BlockComment",
        "."
    ], (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$autocomplete$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["completeFromList"])(completions));
}
let parser = /*@__PURE__*/ parser$1.configure({
    props: [
        /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentNodeProp"].add({
            Statement: /*@__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["continuedIndent"])()
        }),
        /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["foldNodeProp"].add({
            Statement (tree, state) {
                return {
                    from: Math.min(tree.from + 100, state.doc.lineAt(tree.from).to),
                    to: tree.to
                };
            },
            BlockComment (tree) {
                return {
                    from: tree.from + 2,
                    to: tree.to - 2
                };
            }
        }),
        /*@__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["styleTags"])({
            Keyword: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].keyword,
            Type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].typeName,
            Builtin: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].standard(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].name),
            Bits: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].number,
            Bytes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].string,
            Bool: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].bool,
            Null: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].null,
            Number: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].number,
            String: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].string,
            Identifier: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].name,
            QuotedIdentifier: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].special(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].string),
            SpecialVar: /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].special(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].name),
            LineComment: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].lineComment,
            BlockComment: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].blockComment,
            Operator: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].operator,
            "Semi Punctuation": __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].punctuation,
            "( )": __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].paren,
            "{ }": __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].brace,
            "[ ]": __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$highlight$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tags"].squareBracket
        })
    ]
});
/**
Represents an SQL dialect.
*/ class SQLDialect {
    constructor(/**
    @internal
    */ dialect, /**
    The language for this dialect.
    */ language, /**
    The spec used to define this dialect.
    */ spec){
        this.dialect = dialect;
        this.language = language;
        this.spec = spec;
    }
    /**
    Returns the language for this dialect as an extension.
    */ get extension() {
        return this.language.extension;
    }
    /**
    Reconfigure the parser used by this dialect. Returns a new
    dialect object.
    */ configureLanguage(options, name) {
        return new SQLDialect(this.dialect, this.language.configure(options, name), this.spec);
    }
    /**
    Define a new dialect.
    */ static define(spec) {
        let d = dialect(spec, spec.keywords, spec.types, spec.builtin);
        let language = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LRLanguage"].define({
            name: "sql",
            parser: parser.configure({
                tokenizers: [
                    {
                        from: tokens,
                        to: tokensFor(d)
                    }
                ]
            }),
            languageData: {
                commentTokens: {
                    line: "--",
                    block: {
                        open: "/*",
                        close: "*/"
                    }
                },
                closeBrackets: {
                    brackets: [
                        "(",
                        "[",
                        "{",
                        "'",
                        '"',
                        "`"
                    ]
                }
            }
        });
        return new SQLDialect(d, language, spec);
    }
}
function defaultKeyword(label, type) {
    return {
        label,
        type,
        boost: -1
    };
}
/**
Returns a completion source that provides keyword completion for
the given SQL dialect.
*/ function keywordCompletionSource(dialect, upperCase = false, build) {
    return completeKeywords(dialect.dialect.words, upperCase, build || defaultKeyword);
}
/**
Returns a completion sources that provides schema-based completion
for the given configuration.
*/ function schemaCompletionSource(config) {
    return config.schema ? completeFromSchema(config.schema, config.tables, config.schemas, config.defaultTable, config.defaultSchema, config.dialect || StandardSQL) : ()=>null;
}
function schemaCompletion(config) {
    return config.schema ? (config.dialect || StandardSQL).language.data.of({
        autocomplete: schemaCompletionSource(config)
    }) : [];
}
/**
SQL language support for the given SQL dialect, with keyword
completion, and, if provided, schema-based completion as extra
extensions.
*/ function sql(config = {}) {
    let lang = config.dialect || StandardSQL;
    return new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LanguageSupport"](lang.language, [
        schemaCompletion(config),
        lang.language.data.of({
            autocomplete: keywordCompletionSource(lang, config.upperCaseKeywords, config.keywordCompletion)
        })
    ]);
}
/**
The standard SQL dialect.
*/ const StandardSQL = /*@__PURE__*/ SQLDialect.define({});
/**
Dialect for [PostgreSQL](https://www.postgresql.org).
*/ const PostgreSQL = /*@__PURE__*/ SQLDialect.define({
    charSetCasts: true,
    doubleDollarQuotedStrings: true,
    operatorChars: "+-*/<>=~!@#%^&|`?",
    specialVar: "",
    keywords: SQLKeywords + "abort abs absent access according ada admin aggregate alias also always analyse analyze array_agg array_max_cardinality asensitive assert assignment asymmetric atomic attach attribute attributes avg backward base64 begin_frame begin_partition bernoulli bit_length blocked bom cache called cardinality catalog_name ceil ceiling chain char_length character_length character_set_catalog character_set_name character_set_schema characteristics characters checkpoint class class_origin cluster coalesce cobol collation_catalog collation_name collation_schema collect column_name columns command_function command_function_code comment comments committed concurrently condition_number configuration conflict connection_name constant constraint_catalog constraint_name constraint_schema contains content control conversion convert copy corr cost covar_pop covar_samp csv cume_dist current_catalog current_row current_schema cursor_name database datalink datatype datetime_interval_code datetime_interval_precision db debug defaults defined definer degree delimiter delimiters dense_rank depends derived detach detail dictionary disable discard dispatch dlnewcopy dlpreviouscopy dlurlcomplete dlurlcompleteonly dlurlcompletewrite dlurlpath dlurlpathonly dlurlpathwrite dlurlscheme dlurlserver dlvalue document dump dynamic_function dynamic_function_code element elsif empty enable encoding encrypted end_frame end_partition endexec enforced enum errcode error event every exclude excluding exclusive exp explain expression extension extract family file filter final first_value flag floor following force foreach fortran forward frame_row freeze fs functions fusion generated granted greatest groups handler header hex hierarchy hint id ignore ilike immediately immutable implementation implicit import include including increment indent index indexes info inherit inherits inline insensitive instance instantiable instead integrity intersection invoker isnull key_member key_type label lag last_value lead leakproof least length library like_regex link listen ln load location lock locked log logged lower mapping matched materialized max max_cardinality maxvalue member merge message message_length message_octet_length message_text min minvalue mod mode more move multiset mumps name namespace nfc nfd nfkc nfkd nil normalize normalized nothing notice notify notnull nowait nth_value ntile nullable nullif nulls number occurrences_regex octet_length octets off offset oids operator options ordering others over overlay overriding owned owner parallel parameter_mode parameter_name parameter_ordinal_position parameter_specific_catalog parameter_specific_name parameter_specific_schema parser partition pascal passing passthrough password percent percent_rank percentile_cont percentile_disc perform period permission pg_context pg_datatype_name pg_exception_context pg_exception_detail pg_exception_hint placing plans pli policy portion position position_regex power precedes preceding prepared print_strict_params procedural procedures program publication query quote raise range rank reassign recheck recovery refresh regr_avgx regr_avgy regr_count regr_intercept regr_r2 regr_slope regr_sxx regr_sxy regr_syy reindex rename repeatable replace replica requiring reset respect restart restore result_oid returned_cardinality returned_length returned_octet_length returned_sqlstate returning reverse routine_catalog routine_name routine_schema routines row_count row_number rowtype rule scale schema_name schemas scope scope_catalog scope_name scope_schema security selective self sensitive sequence sequences serializable server server_name setof share show simple skip slice snapshot source specific_name sqlcode sqlerror sqrt stable stacked standalone statement statistics stddev_pop stddev_samp stdin stdout storage strict strip structure style subclass_origin submultiset subscription substring substring_regex succeeds sum symmetric sysid system system_time table_name tables tablesample tablespace temp template ties token top_level_count transaction_active transactions_committed transactions_rolled_back transform transforms translate translate_regex trigger_catalog trigger_name trigger_schema trim trim_array truncate trusted type types uescape unbounded uncommitted unencrypted unlink unlisten unlogged unnamed untyped upper uri use_column use_variable user_defined_type_catalog user_defined_type_code user_defined_type_name user_defined_type_schema vacuum valid validate validator value_of var_pop var_samp varbinary variable_conflict variadic verbose version versioning views volatile warning whitespace width_bucket window within wrapper xmlagg xmlattributes xmlbinary xmlcast xmlcomment xmlconcat xmldeclaration xmldocument xmlelement xmlexists xmlforest xmliterate xmlnamespaces xmlparse xmlpi xmlquery xmlroot xmlschema xmlserialize xmltable xmltext xmlvalidate yes",
    types: SQLTypes + "bigint int8 bigserial serial8 varbit bool box bytea cidr circle precision float8 inet int4 json jsonb line lseg macaddr macaddr8 money numeric pg_lsn point polygon float4 int2 smallserial serial2 serial serial4 text timetz timestamptz tsquery tsvector txid_snapshot uuid xml"
});
const MySQLKeywords = "accessible algorithm analyze asensitive authors auto_increment autocommit avg avg_row_length binlog btree cache catalog_name chain change changed checkpoint checksum class_origin client_statistics coalesce code collations columns comment committed completion concurrent consistent contains contributors convert database databases day_hour day_microsecond day_minute day_second delay_key_write delayed delimiter des_key_file dev_pop dev_samp deviance directory disable discard distinctrow div dual dumpfile enable enclosed ends engine engines enum errors escaped even event events every explain extended fast field fields flush force found_rows fulltext grants handler hash high_priority hosts hour_microsecond hour_minute hour_second ignore ignore_server_ids import index index_statistics infile innodb insensitive insert_method install invoker iterate keys kill linear lines list load lock logs low_priority master master_heartbeat_period master_ssl_verify_server_cert masters max max_rows maxvalue message_text middleint migrate min min_rows minute_microsecond minute_second mod mode modify mutex mysql_errno no_write_to_binlog offline offset one online optimize optionally outfile pack_keys parser partition partitions password phase plugin plugins prev processlist profile profiles purge query quick range read_write rebuild recover regexp relaylog remove rename reorganize repair repeatable replace require resume rlike row_format rtree schedule schema_name schemas second_microsecond security sensitive separator serializable server share show slave slow snapshot soname spatial sql_big_result sql_buffer_result sql_cache sql_calc_found_rows sql_no_cache sql_small_result ssl starting starts std stddev stddev_pop stddev_samp storage straight_join subclass_origin sum suspend table_name table_statistics tables tablespace terminated triggers truncate uncommitted uninstall unlock upgrade use use_frm user_resources user_statistics utc_date utc_time utc_timestamp variables views warnings xa xor year_month zerofill";
const MySQLTypes = SQLTypes + "bool blob long longblob longtext medium mediumblob mediumint mediumtext tinyblob tinyint tinytext text bigint int1 int2 int3 int4 int8 float4 float8 varbinary varcharacter precision datetime unsigned signed";
const MySQLBuiltin = "charset clear edit ego help nopager notee nowarning pager print prompt quit rehash source status system tee";
/**
[MySQL](https://dev.mysql.com/) dialect.
*/ const MySQL = /*@__PURE__*/ SQLDialect.define({
    operatorChars: "*+-%<>!=&|^",
    charSetCasts: true,
    doubleQuotedStrings: true,
    unquotedBitLiterals: true,
    hashComments: true,
    spaceAfterDashes: true,
    specialVar: "@?",
    identifierQuotes: "`",
    keywords: SQLKeywords + "group_concat " + MySQLKeywords,
    types: MySQLTypes,
    builtin: MySQLBuiltin
});
/**
Variant of [`MySQL`](https://codemirror.net/6/docs/ref/#lang-sql.MySQL) for
[MariaDB](https://mariadb.org/).
*/ const MariaSQL = /*@__PURE__*/ SQLDialect.define({
    operatorChars: "*+-%<>!=&|^",
    charSetCasts: true,
    doubleQuotedStrings: true,
    unquotedBitLiterals: true,
    hashComments: true,
    spaceAfterDashes: true,
    specialVar: "@?",
    identifierQuotes: "`",
    keywords: SQLKeywords + "always generated groupby_concat hard persistent shutdown soft virtual " + MySQLKeywords,
    types: MySQLTypes,
    builtin: MySQLBuiltin
});
let MSSQLBuiltin = // Aggregate https://msdn.microsoft.com/en-us/library/ms173454.aspx
"approx_count_distinct approx_percentile_cont approx_percentile_disc avg checksum_agg count count_big grouping grouping_id max min product stdev stdevp sum var varp " + // AI https://learn.microsoft.com/en-us/sql/t-sql/functions/ai-functions-transact-sql?view=sql-server-ver17
"ai_generate_embeddings ai_generate_chunks " + // Analytic https://learn.microsoft.com/en-us/sql/t-sql/functions/analytic-functions-transact-sql?view=sql-server-ver17
"cume_dist first_value lag last_value lead percentile_cont percentile_disc percent_rank " + // Bit Manipulation https://learn.microsoft.com/en-us/sql/t-sql/functions/bit-manipulation-functions-overview?view=sql-server-ver17
"left_shift right_shift bit_count get_bit set_bit " + // Collation Functions https://learn.microsoft.com/en-us/sql/t-sql/functions/collation-functions-collationproperty-transact-sql?view=sql-server-ver17
"collationproperty tertiary_weights " + // Configuration https://learn.microsoft.com/en-us/sql/t-sql/functions/configuration-functions-transact-sql?view=sql-server-ver17
"@@datefirst @@dbts @@langid @@language @@lock_timeout @@max_connections @@max_precision @@nestlevel @@options @@remserver @@servername @@servicename @@spid @@textsize @@version " + // Conversion https://learn.microsoft.com/en-us/sql/t-sql/functions/conversion-functions-transact-sql?view=sql-server-ver17
"cast convert parse try_cast try_convert try_parse " + // Cryptographic https://learn.microsoft.com/en-us/sql/t-sql/functions/cryptographic-functions-transact-sql?view=sql-server-ver17
"asymkey_id asymkeyproperty certproperty cert_id crypt_gen_random decryptbyasymkey decryptbycert decryptbykey decryptbykeyautoasymkey decryptbykeyautocert decryptbypassphrase encryptbyasymkey encryptbycert encryptbykey encryptbypassphrase hashbytes is_objectsigned key_guid key_id key_name signbyasymkey signbycert symkeyproperty verifysignedbycert verifysignedbyasymkey " + // Cursor https://learn.microsoft.com/en-us/sql/t-sql/functions/cursor-functions-transact-sql?view=sql-server-ver17
"@@cursor_rows @@fetch_status cursor_status " + // Data type https://learn.microsoft.com/en-us/sql/t-sql/functions/data-type-functions-transact-sql?view=sql-server-ver17
"datalength ident_current ident_incr ident_seed identity sql_variant_property " + // Date & time https://learn.microsoft.com/en-us/sql/t-sql/functions/date-and-time-data-types-and-functions-transact-sql?view=sql-server-ver17
"@@datefirst current_timestamp current_timezone current_timezone_id date_bucket dateadd datediff datediff_big datefromparts datename datepart datetime2fromparts datetimefromparts datetimeoffsetfromparts datetrunc day eomonth getdate getutcdate isdate month smalldatetimefromparts switchoffset sysdatetime sysdatetimeoffset sysutcdatetime timefromparts todatetimeoffset year " + // Fuzzy string match https://learn.microsoft.com/en-us/sql/t-sql/functions/edit-distance-transact-sql?view=sql-server-ver17
"edit_distance edit_distance_similarity jaro_winkler_distance jaro_winkler_similarity " + // Graph https://learn.microsoft.com/en-us/sql/t-sql/functions/graph-functions-transact-sql?view=sql-server-ver17
"edge_id_from_parts graph_id_from_edge_id graph_id_from_node_id node_id_from_parts object_id_from_edge_id object_id_from_node_id " + // JSON https://learn.microsoft.com/en-us/sql/t-sql/functions/json-functions-transact-sql?view=sql-server-ver17
"json isjson json_array json_contains json_modify json_object json_path_exists json_query json_value " + // Regular Expressions https://learn.microsoft.com/en-us/sql/t-sql/functions/regular-expressions-functions-transact-sql?view=sql-server-ver17
"regexp_like regexp_replace regexp_substr regexp_instr regexp_count regexp_matches regexp_split_to_table " + // Mathematical https://learn.microsoft.com/en-us/sql/t-sql/functions/mathematical-functions-transact-sql?view=sql-server-ver17
"abs acos asin atan atn2 ceiling cos cot degrees exp floor log log10 pi power radians rand round sign sin sqrt square tan " + // Logical https://learn.microsoft.com/en-us/sql/t-sql/functions/logical-functions-choose-transact-sql?view=sql-server-ver17
"choose greatest iif least " + // Metadata https://learn.microsoft.com/en-us/sql/t-sql/functions/metadata-functions-transact-sql?view=sql-server-ver17
"@@procid app_name applock_mode applock_test assemblyproperty col_length col_name columnproperty databasepropertyex db_id db_name file_id file_idex file_name filegroup_id filegroup_name filegroupproperty fileproperty filepropertyex fulltextcatalogproperty fulltextserviceproperty index_col indexkey_property indexproperty next value for object_definition object_id object_name object_schema_name objectproperty objectpropertyex original_db_name parsename schema_id schema_name scope_identity serverproperty stats_date type_id type_name typeproperty " + // Ranking https://learn.microsoft.com/en-us/sql/t-sql/functions/ranking-functions-transact-sql?view=sql-server-ver17
"dense_rank ntile rank row_number " + // Replication https://learn.microsoft.com/en-us/sql/t-sql/functions/replication-functions-publishingservername?view=sql-server-ver17
"publishingservername " + // Security https://learn.microsoft.com/en-us/sql/t-sql/functions/security-functions-transact-sql?view=sql-server-ver17
"certenclosed certprivatekey current_user database_principal_id has_dbaccess has_perms_by_name is_member is_rolemember is_srvrolemember loginproperty original_login permissions pwdencrypt pwdcompare session_user sessionproperty suser_id suser_name suser_sid suser_sname system_user user user_id user_name " + // String https://learn.microsoft.com/en-us/sql/t-sql/functions/string-functions-transact-sql?view=sql-server-ver17
"ascii char charindex concat concat_ws difference format left len lower ltrim nchar patindex quotename replace replicate reverse right rtrim soundex space str string_agg string_escape stuff substring translate trim unicode upper " + // System https://learn.microsoft.com/en-us/sql/t-sql/functions/system-functions-transact-sql?view=sql-server-ver17
"$partition @@error @@identity @@pack_received @@rowcount @@trancount binary_checksum checksum compress connectionproperty context_info current_request_id current_transaction_id decompress error_line error_message error_number error_procedure error_severity error_state formatmessage get_filestream_transaction_context getansinull host_id host_name isnull isnumeric min_active_rowversion newid newsequentialid rowcount_big session_context xact_state " + // System Statistical https://learn.microsoft.com/en-us/sql/t-sql/functions/system-statistical-functions-transact-sql?view=sql-server-ver17
"@@connections @@cpu_busy @@idle @@io_busy @@pack_sent @@packet_errors @@timeticks @@total_errors @@total_read @@total_write " + // Text & Image https://learn.microsoft.com/en-us/sql/t-sql/functions/text-and-image-functions-textptr-transact-sql?view=sql-server-ver17
"textptr textvalid " + // Trigger https://learn.microsoft.com/en-us/sql/t-sql/functions/trigger-functions-transact-sql?view=sql-server-ver17
"columns_updated eventdata trigger_nestlevel " + // Vectors https://learn.microsoft.com/en-us/sql/t-sql/functions/vector-functions-transact-sql?view=sql-server-ver17
"vector_distance vectorproperty vector_search " + // Relational operators https://msdn.microsoft.com/en-us/library/ms187957.aspx
"generate_series opendatasource openjson openquery openrowset openxml predict string_split " + // Other
"coalesce nullif apply catch filter force include keep keepfixed modify optimize parameterization parameters partition recompile sequence set";
/**
SQL dialect for Microsoft [SQL
Server](https://www.microsoft.com/en-us/sql-server).
*/ const MSSQL = /*@__PURE__*/ SQLDialect.define({
    keywords: SQLKeywords + // Reserved Keywords https://learn.microsoft.com/en-us/sql/t-sql/language-elements/reserved-keywords-transact-sql?view=sql-server-ver17
    "add external procedure all fetch public alter file raiserror and fillfactor read any for readtext as foreign reconfigure asc freetext references authorization freetexttable replication backup from restore begin full restrict between function return break goto revert browse grant revoke bulk group right by having rollback cascade holdlock rowcount case identity rowguidcol check identity_insert rule checkpoint identitycol save close if schema clustered in securityaudit coalesce index select collate inner semantickeyphrasetable column insert semanticsimilaritydetailstable commit intersect semanticsimilaritytable compute into session_user constraint is set contains join setuser containstable key shutdown continue kill some convert left statistics create like system_user cross lineno table current load tablesample current_date merge textsize current_time national then current_timestamp nocheck to current_user nonclustered top cursor not tran database null transaction dbcc nullif trigger deallocate of truncate declare off try_convert default offsets tsequal delete on union deny open unique desc opendatasource unpivot disk openquery update distinct openrowset updatetext distributed openxml use double option user drop or values dump order varying else outer view end over waitfor errlvl percent when escape pivot where except plan while exec precision with execute primary within group exists print writetext exit proc " + // table hints https://learn.microsoft.com/en-us/sql/t-sql/queries/hints-transact-sql-table?view=sql-server-ver17
    "noexpand index forceseek forcescan holdlock nolock nowait paglock readcommitted readcommittedlock readpast readuncommitted repeatableread rowlock serializable snapshot spatial_window_max_cells tablock tablockx updlock xlock keepidentity keepdefaults ignore_constraints ignore_triggers",
    types: SQLTypes + "smalldatetime datetimeoffset datetime2 datetime bigint smallint smallmoney tinyint money real text nvarchar ntext varbinary image hierarchyid uniqueidentifier sql_variant xml",
    builtin: MSSQLBuiltin,
    operatorChars: "*+-%<>!=^&|/",
    specialVar: "@",
    identifierQuotes: "\"["
});
/**
[SQLite](https://sqlite.org/) dialect.
*/ const SQLite = /*@__PURE__*/ SQLDialect.define({
    keywords: SQLKeywords + "abort analyze attach autoincrement conflict database detach exclusive fail glob ignore index indexed instead isnull notnull offset plan pragma query raise regexp reindex rename replace temp vacuum virtual",
    types: SQLTypes + "bool blob long longblob longtext medium mediumblob mediumint mediumtext tinyblob tinyint tinytext text bigint int2 int8 unsigned signed real",
    builtin: "auth backup bail changes clone databases dbinfo dump echo eqp explain fullschema headers help import imposter indexes iotrace lint load log mode nullvalue once print prompt quit restore save scanstats separator shell show stats system tables testcase timeout timer trace vfsinfo vfslist vfsname width",
    operatorChars: "*+-%<>!=&|/~",
    identifierQuotes: "`\"",
    specialVar: "@:?$"
});
/**
Dialect for [Cassandra](https://cassandra.apache.org/)'s SQL-ish query language.
*/ const Cassandra = /*@__PURE__*/ SQLDialect.define({
    keywords: "add all allow alter and any apply as asc authorize batch begin by clustering columnfamily compact consistency count create custom delete desc distinct drop each_quorum exists filtering from grant if in index insert into key keyspace keyspaces level limit local_one local_quorum modify nan norecursive nosuperuser not of on one order password permission permissions primary quorum rename revoke schema select set storage superuser table three to token truncate ttl two type unlogged update use user users using values where with writetime infinity NaN",
    types: SQLTypes + "ascii bigint blob counter frozen inet list map static text timeuuid tuple uuid varint",
    slashComments: true
});
/**
[PL/SQL](https://en.wikipedia.org/wiki/PL/SQL) dialect.
*/ const PLSQL = /*@__PURE__*/ SQLDialect.define({
    keywords: SQLKeywords + "abort accept access add all alter and any arraylen as asc assert assign at attributes audit authorization avg base_table begin between binary_integer body by case cast char_base check close cluster clusters colauth column comment commit compress connected constant constraint crash create current currval cursor data_base database dba deallocate debugoff debugon declare default definition delay delete desc digits dispose distinct do drop else elseif elsif enable end entry exception exception_init exchange exclusive exists external fast fetch file for force form from function generic goto grant group having identified if immediate in increment index indexes indicator initial initrans insert interface intersect into is key level library like limited local lock log logging loop master maxextents maxtrans member minextents minus mislabel mode modify multiset new next no noaudit nocompress nologging noparallel not nowait number_base of off offline on online only option or order out package parallel partition pctfree pctincrease pctused pls_integer positive positiven pragma primary prior private privileges procedure public raise range raw rebuild record ref references refresh rename replace resource restrict return returning returns reverse revoke rollback row rowid rowlabel rownum rows run savepoint schema segment select separate set share snapshot some space split sql start statement storage subtype successful synonym tabauth table tables tablespace task terminate then to trigger truncate type union unique unlimited unrecoverable unusable update use using validate value values variable view views when whenever where while with work",
    builtin: "appinfo arraysize autocommit autoprint autorecovery autotrace blockterminator break btitle cmdsep colsep compatibility compute concat copycommit copytypecheck define echo editfile embedded feedback flagger flush heading headsep instance linesize lno loboffset logsource longchunksize markup native newpage numformat numwidth pagesize pause pno recsep recsepchar repfooter repheader serveroutput shiftinout show showmode spool sqlblanklines sqlcase sqlcode sqlcontinue sqlnumber sqlpluscompatibility sqlprefix sqlprompt sqlterminator suffix tab term termout timing trimout trimspool ttitle underline verify version wrap",
    types: SQLTypes + "ascii bfile bfilename bigserial bit blob dec long number nvarchar nvarchar2 serial smallint string text uid varchar2 xml",
    operatorChars: "*/+-%<>!=~",
    doubleQuotedStrings: true,
    charSetCasts: true,
    plsqlQuotingMechanism: true
});
;
}),
"[project]/pwa/node_modules/@codemirror/commands/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCursorAbove",
    ()=>addCursorAbove,
    "addCursorBelow",
    ()=>addCursorBelow,
    "blockComment",
    ()=>blockComment,
    "blockUncomment",
    ()=>blockUncomment,
    "copyLineDown",
    ()=>copyLineDown,
    "copyLineUp",
    ()=>copyLineUp,
    "cursorCharBackward",
    ()=>cursorCharBackward,
    "cursorCharBackwardLogical",
    ()=>cursorCharBackwardLogical,
    "cursorCharForward",
    ()=>cursorCharForward,
    "cursorCharForwardLogical",
    ()=>cursorCharForwardLogical,
    "cursorCharLeft",
    ()=>cursorCharLeft,
    "cursorCharRight",
    ()=>cursorCharRight,
    "cursorDocEnd",
    ()=>cursorDocEnd,
    "cursorDocStart",
    ()=>cursorDocStart,
    "cursorGroupBackward",
    ()=>cursorGroupBackward,
    "cursorGroupForward",
    ()=>cursorGroupForward,
    "cursorGroupForwardWin",
    ()=>cursorGroupForwardWin,
    "cursorGroupLeft",
    ()=>cursorGroupLeft,
    "cursorGroupRight",
    ()=>cursorGroupRight,
    "cursorLineBoundaryBackward",
    ()=>cursorLineBoundaryBackward,
    "cursorLineBoundaryForward",
    ()=>cursorLineBoundaryForward,
    "cursorLineBoundaryLeft",
    ()=>cursorLineBoundaryLeft,
    "cursorLineBoundaryRight",
    ()=>cursorLineBoundaryRight,
    "cursorLineDown",
    ()=>cursorLineDown,
    "cursorLineEnd",
    ()=>cursorLineEnd,
    "cursorLineStart",
    ()=>cursorLineStart,
    "cursorLineUp",
    ()=>cursorLineUp,
    "cursorMatchingBracket",
    ()=>cursorMatchingBracket,
    "cursorPageDown",
    ()=>cursorPageDown,
    "cursorPageUp",
    ()=>cursorPageUp,
    "cursorSubwordBackward",
    ()=>cursorSubwordBackward,
    "cursorSubwordForward",
    ()=>cursorSubwordForward,
    "cursorSyntaxLeft",
    ()=>cursorSyntaxLeft,
    "cursorSyntaxRight",
    ()=>cursorSyntaxRight,
    "defaultKeymap",
    ()=>defaultKeymap,
    "deleteCharBackward",
    ()=>deleteCharBackward,
    "deleteCharBackwardStrict",
    ()=>deleteCharBackwardStrict,
    "deleteCharForward",
    ()=>deleteCharForward,
    "deleteGroupBackward",
    ()=>deleteGroupBackward,
    "deleteGroupForward",
    ()=>deleteGroupForward,
    "deleteGroupForwardWin",
    ()=>deleteGroupForwardWin,
    "deleteLine",
    ()=>deleteLine,
    "deleteLineBoundaryBackward",
    ()=>deleteLineBoundaryBackward,
    "deleteLineBoundaryForward",
    ()=>deleteLineBoundaryForward,
    "deleteToLineEnd",
    ()=>deleteToLineEnd,
    "deleteToLineStart",
    ()=>deleteToLineStart,
    "deleteTrailingWhitespace",
    ()=>deleteTrailingWhitespace,
    "emacsStyleKeymap",
    ()=>emacsStyleKeymap,
    "history",
    ()=>history,
    "historyField",
    ()=>historyField,
    "historyKeymap",
    ()=>historyKeymap,
    "indentLess",
    ()=>indentLess,
    "indentMore",
    ()=>indentMore,
    "indentSelection",
    ()=>indentSelection,
    "indentWithTab",
    ()=>indentWithTab,
    "insertBlankLine",
    ()=>insertBlankLine,
    "insertNewline",
    ()=>insertNewline,
    "insertNewlineAndIndent",
    ()=>insertNewlineAndIndent,
    "insertNewlineKeepIndent",
    ()=>insertNewlineKeepIndent,
    "insertTab",
    ()=>insertTab,
    "invertedEffects",
    ()=>invertedEffects,
    "isolateHistory",
    ()=>isolateHistory,
    "lineComment",
    ()=>lineComment,
    "lineUncomment",
    ()=>lineUncomment,
    "moveLineDown",
    ()=>moveLineDown,
    "moveLineUp",
    ()=>moveLineUp,
    "redo",
    ()=>redo,
    "redoDepth",
    ()=>redoDepth,
    "redoSelection",
    ()=>redoSelection,
    "selectAll",
    ()=>selectAll,
    "selectCharBackward",
    ()=>selectCharBackward,
    "selectCharBackwardLogical",
    ()=>selectCharBackwardLogical,
    "selectCharForward",
    ()=>selectCharForward,
    "selectCharForwardLogical",
    ()=>selectCharForwardLogical,
    "selectCharLeft",
    ()=>selectCharLeft,
    "selectCharRight",
    ()=>selectCharRight,
    "selectDocEnd",
    ()=>selectDocEnd,
    "selectDocStart",
    ()=>selectDocStart,
    "selectGroupBackward",
    ()=>selectGroupBackward,
    "selectGroupForward",
    ()=>selectGroupForward,
    "selectGroupForwardWin",
    ()=>selectGroupForwardWin,
    "selectGroupLeft",
    ()=>selectGroupLeft,
    "selectGroupRight",
    ()=>selectGroupRight,
    "selectLine",
    ()=>selectLine,
    "selectLineBoundaryBackward",
    ()=>selectLineBoundaryBackward,
    "selectLineBoundaryForward",
    ()=>selectLineBoundaryForward,
    "selectLineBoundaryLeft",
    ()=>selectLineBoundaryLeft,
    "selectLineBoundaryRight",
    ()=>selectLineBoundaryRight,
    "selectLineDown",
    ()=>selectLineDown,
    "selectLineEnd",
    ()=>selectLineEnd,
    "selectLineStart",
    ()=>selectLineStart,
    "selectLineUp",
    ()=>selectLineUp,
    "selectMatchingBracket",
    ()=>selectMatchingBracket,
    "selectPageDown",
    ()=>selectPageDown,
    "selectPageUp",
    ()=>selectPageUp,
    "selectParentSyntax",
    ()=>selectParentSyntax,
    "selectSubwordBackward",
    ()=>selectSubwordBackward,
    "selectSubwordForward",
    ()=>selectSubwordForward,
    "selectSyntaxLeft",
    ()=>selectSyntaxLeft,
    "selectSyntaxRight",
    ()=>selectSyntaxRight,
    "simplifySelection",
    ()=>simplifySelection,
    "splitLine",
    ()=>splitLine,
    "standardKeymap",
    ()=>standardKeymap,
    "temporarilySetTabFocusMode",
    ()=>temporarilySetTabFocusMode,
    "toggleBlockComment",
    ()=>toggleBlockComment,
    "toggleBlockCommentByLine",
    ()=>toggleBlockCommentByLine,
    "toggleComment",
    ()=>toggleComment,
    "toggleLineComment",
    ()=>toggleLineComment,
    "toggleTabFocusMode",
    ()=>toggleTabFocusMode,
    "transposeChars",
    ()=>transposeChars,
    "undo",
    ()=>undo,
    "undoDepth",
    ()=>undoDepth,
    "undoSelection",
    ()=>undoSelection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/state/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/view/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@codemirror/language/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/common/dist/index.js [app-client] (ecmascript)");
;
;
;
;
/**
Comment or uncomment the current selection. Will use line comments
if available, otherwise falling back to block comments.
*/ const toggleComment = (target)=>{
    let { state } = target, line = state.doc.lineAt(state.selection.main.from), config = getConfig(target.state, line.from);
    return config.line ? toggleLineComment(target) : config.block ? toggleBlockCommentByLine(target) : false;
};
function command(f, option) {
    return ({ state, dispatch })=>{
        if (state.readOnly) return false;
        let tr = f(option, state);
        if (!tr) return false;
        dispatch(state.update(tr));
        return true;
    };
}
/**
Comment or uncomment the current selection using line comments.
The line comment syntax is taken from the
[`commentTokens`](https://codemirror.net/6/docs/ref/#commands.CommentTokens) [language
data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt).
*/ const toggleLineComment = /*@__PURE__*/ command(changeLineComment, 0 /* CommentOption.Toggle */ );
/**
Comment the current selection using line comments.
*/ const lineComment = /*@__PURE__*/ command(changeLineComment, 1 /* CommentOption.Comment */ );
/**
Uncomment the current selection using line comments.
*/ const lineUncomment = /*@__PURE__*/ command(changeLineComment, 2 /* CommentOption.Uncomment */ );
/**
Comment or uncomment the current selection using block comments.
The block comment syntax is taken from the
[`commentTokens`](https://codemirror.net/6/docs/ref/#commands.CommentTokens) [language
data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt).
*/ const toggleBlockComment = /*@__PURE__*/ command(changeBlockComment, 0 /* CommentOption.Toggle */ );
/**
Comment the current selection using block comments.
*/ const blockComment = /*@__PURE__*/ command(changeBlockComment, 1 /* CommentOption.Comment */ );
/**
Uncomment the current selection using block comments.
*/ const blockUncomment = /*@__PURE__*/ command(changeBlockComment, 2 /* CommentOption.Uncomment */ );
/**
Comment or uncomment the lines around the current selection using
block comments.
*/ const toggleBlockCommentByLine = /*@__PURE__*/ command((o, s)=>changeBlockComment(o, s, selectedLineRanges(s)), 0 /* CommentOption.Toggle */ );
function getConfig(state, pos) {
    let data = state.languageDataAt("commentTokens", pos, 1);
    return data.length ? data[0] : {};
}
const SearchMargin = 50;
/**
Determines if the given range is block-commented in the given
state.
*/ function findBlockComment(state, { open, close }, from, to) {
    let textBefore = state.sliceDoc(from - SearchMargin, from);
    let textAfter = state.sliceDoc(to, to + SearchMargin);
    let spaceBefore = /\s*$/.exec(textBefore)[0].length, spaceAfter = /^\s*/.exec(textAfter)[0].length;
    let beforeOff = textBefore.length - spaceBefore;
    if (textBefore.slice(beforeOff - open.length, beforeOff) == open && textAfter.slice(spaceAfter, spaceAfter + close.length) == close) {
        return {
            open: {
                pos: from - spaceBefore,
                margin: spaceBefore && 1
            },
            close: {
                pos: to + spaceAfter,
                margin: spaceAfter && 1
            }
        };
    }
    let startText, endText;
    if (to - from <= 2 * SearchMargin) {
        startText = endText = state.sliceDoc(from, to);
    } else {
        startText = state.sliceDoc(from, from + SearchMargin);
        endText = state.sliceDoc(to - SearchMargin, to);
    }
    let startSpace = /^\s*/.exec(startText)[0].length, endSpace = /\s*$/.exec(endText)[0].length;
    let endOff = endText.length - endSpace - close.length;
    if (startText.slice(startSpace, startSpace + open.length) == open && endText.slice(endOff, endOff + close.length) == close) {
        return {
            open: {
                pos: from + startSpace + open.length,
                margin: /\s/.test(startText.charAt(startSpace + open.length)) ? 1 : 0
            },
            close: {
                pos: to - endSpace - close.length,
                margin: /\s/.test(endText.charAt(endOff - 1)) ? 1 : 0
            }
        };
    }
    return null;
}
function selectedLineRanges(state) {
    let ranges = [];
    for (let r of state.selection.ranges){
        let fromLine = state.doc.lineAt(r.from);
        let toLine = r.to <= fromLine.to ? fromLine : state.doc.lineAt(r.to);
        if (toLine.from > fromLine.from && toLine.from == r.to) toLine = r.to == fromLine.to + 1 ? fromLine : state.doc.lineAt(r.to - 1);
        let last = ranges.length - 1;
        if (last >= 0 && ranges[last].to > fromLine.from) ranges[last].to = toLine.to;
        else ranges.push({
            from: fromLine.from + /^\s*/.exec(fromLine.text)[0].length,
            to: toLine.to
        });
    }
    return ranges;
}
// Performs toggle, comment and uncomment of block comments in
// languages that support them.
function changeBlockComment(option, state, ranges = state.selection.ranges) {
    let tokens = ranges.map((r)=>getConfig(state, r.from).block);
    if (!tokens.every((c)=>c)) return null;
    let comments = ranges.map((r, i)=>findBlockComment(state, tokens[i], r.from, r.to));
    if (option != 2 /* CommentOption.Uncomment */  && !comments.every((c)=>c)) {
        return {
            changes: state.changes(ranges.map((range, i)=>{
                if (comments[i]) return [];
                return [
                    {
                        from: range.from,
                        insert: tokens[i].open + " "
                    },
                    {
                        from: range.to,
                        insert: " " + tokens[i].close
                    }
                ];
            }))
        };
    } else if (option != 1 /* CommentOption.Comment */  && comments.some((c)=>c)) {
        let changes = [];
        for(let i = 0, comment; i < comments.length; i++)if (comment = comments[i]) {
            let token = tokens[i], { open, close } = comment;
            changes.push({
                from: open.pos - token.open.length,
                to: open.pos + open.margin
            }, {
                from: close.pos - close.margin,
                to: close.pos + token.close.length
            });
        }
        return {
            changes
        };
    }
    return null;
}
// Performs toggle, comment and uncomment of line comments.
function changeLineComment(option, state, ranges = state.selection.ranges) {
    let lines = [];
    let prevLine = -1;
    for (let { from, to } of ranges){
        let startI = lines.length, minIndent = 1e9;
        let token = getConfig(state, from).line;
        if (!token) continue;
        for(let pos = from; pos <= to;){
            let line = state.doc.lineAt(pos);
            if (line.from > prevLine && (from == to || to > line.from)) {
                prevLine = line.from;
                let indent = /^\s*/.exec(line.text)[0].length;
                let empty = indent == line.length;
                let comment = line.text.slice(indent, indent + token.length) == token ? indent : -1;
                if (indent < line.text.length && indent < minIndent) minIndent = indent;
                lines.push({
                    line,
                    comment,
                    token,
                    indent,
                    empty,
                    single: false
                });
            }
            pos = line.to + 1;
        }
        if (minIndent < 1e9) {
            for(let i = startI; i < lines.length; i++)if (lines[i].indent < lines[i].line.text.length) lines[i].indent = minIndent;
        }
        if (lines.length == startI + 1) lines[startI].single = true;
    }
    if (option != 2 /* CommentOption.Uncomment */  && lines.some((l)=>l.comment < 0 && (!l.empty || l.single))) {
        let changes = [];
        for (let { line, token, indent, empty, single } of lines)if (single || !empty) changes.push({
            from: line.from + indent,
            insert: token + " "
        });
        let changeSet = state.changes(changes);
        return {
            changes: changeSet,
            selection: state.selection.map(changeSet, 1)
        };
    } else if (option != 1 /* CommentOption.Comment */  && lines.some((l)=>l.comment >= 0)) {
        let changes = [];
        for (let { line, comment, token } of lines)if (comment >= 0) {
            let from = line.from + comment, to = from + token.length;
            if (line.text[to - line.from] == " ") to++;
            changes.push({
                from,
                to
            });
        }
        return {
            changes
        };
    }
    return null;
}
const fromHistory = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Annotation"].define();
/**
Transaction annotation that will prevent that transaction from
being combined with other transactions in the undo history. Given
`"before"`, it'll prevent merging with previous transactions. With
`"after"`, subsequent transactions won't be combined with this
one. With `"full"`, the transaction is isolated on both sides.
*/ const isolateHistory = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Annotation"].define();
/**
This facet provides a way to register functions that, given a
transaction, provide a set of effects that the history should
store when inverting the transaction. This can be used to
integrate some kinds of effects in the history, so that they can
be undone (and redone again).
*/ const invertedEffects = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define();
const historyConfig = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Facet"].define({
    combine (configs) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineConfig"])(configs, {
            minDepth: 100,
            newGroupDelay: 500,
            joinToEvent: (_t, isAdjacent)=>isAdjacent
        }, {
            minDepth: Math.max,
            newGroupDelay: Math.min,
            joinToEvent: (a, b)=>(tr, adj)=>a(tr, adj) || b(tr, adj)
        });
    }
});
const historyField_ = /*@__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateField"].define({
    create () {
        return HistoryState.empty;
    },
    update (state, tr) {
        let config = tr.state.facet(historyConfig);
        let fromHist = tr.annotation(fromHistory);
        if (fromHist) {
            let item = HistEvent.fromTransaction(tr, fromHist.selection), from = fromHist.side;
            let other = from == 0 /* BranchName.Done */  ? state.undone : state.done;
            if (item) other = updateBranch(other, other.length, config.minDepth, item);
            else other = addSelection(other, tr.startState.selection);
            return new HistoryState(from == 0 /* BranchName.Done */  ? fromHist.rest : other, from == 0 /* BranchName.Done */  ? other : fromHist.rest);
        }
        let isolate = tr.annotation(isolateHistory);
        if (isolate == "full" || isolate == "before") state = state.isolate();
        if (tr.annotation(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Transaction"].addToHistory) === false) return !tr.changes.empty ? state.addMapping(tr.changes.desc) : state;
        let event = HistEvent.fromTransaction(tr);
        let time = tr.annotation(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Transaction"].time), userEvent = tr.annotation(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Transaction"].userEvent);
        if (event) state = state.addChanges(event, time, userEvent, config, tr);
        else if (tr.selection) state = state.addSelection(tr.startState.selection, time, userEvent, config.newGroupDelay);
        if (isolate == "full" || isolate == "after") state = state.isolate();
        return state;
    },
    toJSON (value) {
        return {
            done: value.done.map((e)=>e.toJSON()),
            undone: value.undone.map((e)=>e.toJSON())
        };
    },
    fromJSON (json) {
        return new HistoryState(json.done.map(HistEvent.fromJSON), json.undone.map(HistEvent.fromJSON));
    }
});
/**
Create a history extension with the given configuration.
*/ function history(config = {}) {
    return [
        historyField_,
        historyConfig.of(config),
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].domEventHandlers({
            beforeinput (e, view) {
                let command = e.inputType == "historyUndo" ? undo : e.inputType == "historyRedo" ? redo : null;
                if (!command) return false;
                e.preventDefault();
                return command(view);
            }
        })
    ];
}
/**
The state field used to store the history data. Should probably
only be used when you want to
[serialize](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) or
[deserialize](https://codemirror.net/6/docs/ref/#state.EditorState^fromJSON) state objects in a way
that preserves history.
*/ const historyField = historyField_;
function cmd(side, selection) {
    return function({ state, dispatch }) {
        if (!selection && state.readOnly) return false;
        let historyState = state.field(historyField_, false);
        if (!historyState) return false;
        let tr = historyState.pop(side, state, selection);
        if (!tr) return false;
        dispatch(tr);
        return true;
    };
}
/**
Undo a single group of history events. Returns false if no group
was available.
*/ const undo = /*@__PURE__*/ cmd(0 /* BranchName.Done */ , false);
/**
Redo a group of history events. Returns false if no group was
available.
*/ const redo = /*@__PURE__*/ cmd(1 /* BranchName.Undone */ , false);
/**
Undo a change or selection change.
*/ const undoSelection = /*@__PURE__*/ cmd(0 /* BranchName.Done */ , true);
/**
Redo a change or selection change.
*/ const redoSelection = /*@__PURE__*/ cmd(1 /* BranchName.Undone */ , true);
function depth(side) {
    return function(state) {
        let histState = state.field(historyField_, false);
        if (!histState) return 0;
        let branch = side == 0 /* BranchName.Done */  ? histState.done : histState.undone;
        return branch.length - (branch.length && !branch[0].changes ? 1 : 0);
    };
}
/**
The amount of undoable change events available in a given state.
*/ const undoDepth = /*@__PURE__*/ depth(0 /* BranchName.Done */ );
/**
The amount of redoable change events available in a given state.
*/ const redoDepth = /*@__PURE__*/ depth(1 /* BranchName.Undone */ );
// History events store groups of changes or effects that need to be
// undone/redone together.
class HistEvent {
    constructor(// The changes in this event. Normal events hold at least one
    // change or effect. But it may be necessary to store selection
    // events before the first change, in which case a special type of
    // instance is created which doesn't hold any changes, with
    // changes == startSelection == undefined
    changes, // The effects associated with this event
    effects, // Accumulated mapping (from addToHistory==false) that should be
    // applied to events below this one.
    mapped, // The selection before this event
    startSelection, // Stores selection changes after this event, to be used for
    // selection undo/redo.
    selectionsAfter){
        this.changes = changes;
        this.effects = effects;
        this.mapped = mapped;
        this.startSelection = startSelection;
        this.selectionsAfter = selectionsAfter;
    }
    setSelAfter(after) {
        return new HistEvent(this.changes, this.effects, this.mapped, this.startSelection, after);
    }
    toJSON() {
        var _a, _b, _c;
        return {
            changes: (_a = this.changes) === null || _a === void 0 ? void 0 : _a.toJSON(),
            mapped: (_b = this.mapped) === null || _b === void 0 ? void 0 : _b.toJSON(),
            startSelection: (_c = this.startSelection) === null || _c === void 0 ? void 0 : _c.toJSON(),
            selectionsAfter: this.selectionsAfter.map((s)=>s.toJSON())
        };
    }
    static fromJSON(json) {
        return new HistEvent(json.changes && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChangeSet"].fromJSON(json.changes), [], json.mapped && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChangeDesc"].fromJSON(json.mapped), json.startSelection && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].fromJSON(json.startSelection), json.selectionsAfter.map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].fromJSON));
    }
    // This does not check `addToHistory` and such, it assumes the
    // transaction needs to be converted to an item. Returns null when
    // there are no changes or effects in the transaction.
    static fromTransaction(tr, selection) {
        let effects = none;
        for (let invert of tr.startState.facet(invertedEffects)){
            let result = invert(tr);
            if (result.length) effects = effects.concat(result);
        }
        if (!effects.length && tr.changes.empty) return null;
        return new HistEvent(tr.changes.invert(tr.startState.doc), effects, undefined, selection || tr.startState.selection, none);
    }
    static selection(selections) {
        return new HistEvent(undefined, none, undefined, undefined, selections);
    }
}
function updateBranch(branch, to, maxLen, newEvent) {
    let start = to + 1 > maxLen + 20 ? to - maxLen - 1 : 0;
    let newBranch = branch.slice(start, to);
    newBranch.push(newEvent);
    return newBranch;
}
function isAdjacent(a, b) {
    let ranges = [], isAdjacent = false;
    a.iterChangedRanges((f, t)=>ranges.push(f, t));
    b.iterChangedRanges((_f, _t, f, t)=>{
        for(let i = 0; i < ranges.length;){
            let from = ranges[i++], to = ranges[i++];
            if (t >= from && f <= to) isAdjacent = true;
        }
    });
    return isAdjacent;
}
function eqSelectionShape(a, b) {
    return a.ranges.length == b.ranges.length && a.ranges.filter((r, i)=>r.empty != b.ranges[i].empty).length === 0;
}
function conc(a, b) {
    return !a.length ? b : !b.length ? a : a.concat(b);
}
const none = [];
const MaxSelectionsPerEvent = 200;
function addSelection(branch, selection) {
    if (!branch.length) {
        return [
            HistEvent.selection([
                selection
            ])
        ];
    } else {
        let lastEvent = branch[branch.length - 1];
        let sels = lastEvent.selectionsAfter.slice(Math.max(0, lastEvent.selectionsAfter.length - MaxSelectionsPerEvent));
        if (sels.length && sels[sels.length - 1].eq(selection)) return branch;
        sels.push(selection);
        return updateBranch(branch, branch.length - 1, 1e9, lastEvent.setSelAfter(sels));
    }
}
// Assumes the top item has one or more selectionAfter values
function popSelection(branch) {
    let last = branch[branch.length - 1];
    let newBranch = branch.slice();
    newBranch[branch.length - 1] = last.setSelAfter(last.selectionsAfter.slice(0, last.selectionsAfter.length - 1));
    return newBranch;
}
// Add a mapping to the top event in the given branch. If this maps
// away all the changes and effects in that item, drop it and
// propagate the mapping to the next item.
function addMappingToBranch(branch, mapping) {
    if (!branch.length) return branch;
    let length = branch.length, selections = none;
    while(length){
        let event = mapEvent(branch[length - 1], mapping, selections);
        if (event.changes && !event.changes.empty || event.effects.length) {
            let result = branch.slice(0, length);
            result[length - 1] = event;
            return result;
        } else {
            mapping = event.mapped;
            length--;
            selections = event.selectionsAfter;
        }
    }
    return selections.length ? [
        HistEvent.selection(selections)
    ] : none;
}
function mapEvent(event, mapping, extraSelections) {
    let selections = conc(event.selectionsAfter.length ? event.selectionsAfter.map((s)=>s.map(mapping)) : none, extraSelections);
    // Change-less events don't store mappings (they are always the last event in a branch)
    if (!event.changes) return HistEvent.selection(selections);
    let mappedChanges = event.changes.map(mapping), before = mapping.mapDesc(event.changes, true);
    let fullMapping = event.mapped ? event.mapped.composeDesc(before) : before;
    return new HistEvent(mappedChanges, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].mapEffects(event.effects, mapping), fullMapping, event.startSelection.map(before), selections);
}
const joinableUserEvent = /^(input\.type|delete)($|\.)/;
class HistoryState {
    constructor(done, undone, prevTime = 0, prevUserEvent = undefined){
        this.done = done;
        this.undone = undone;
        this.prevTime = prevTime;
        this.prevUserEvent = prevUserEvent;
    }
    isolate() {
        return this.prevTime ? new HistoryState(this.done, this.undone) : this;
    }
    addChanges(event, time, userEvent, config, tr) {
        let done = this.done, lastEvent = done[done.length - 1];
        if (lastEvent && lastEvent.changes && !lastEvent.changes.empty && event.changes && (!userEvent || joinableUserEvent.test(userEvent)) && (!lastEvent.selectionsAfter.length && time - this.prevTime < config.newGroupDelay && config.joinToEvent(tr, isAdjacent(lastEvent.changes, event.changes)) || // For compose (but not compose.start) events, always join with previous event
        userEvent == "input.type.compose")) {
            done = updateBranch(done, done.length - 1, config.minDepth, new HistEvent(event.changes.compose(lastEvent.changes), conc(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StateEffect"].mapEffects(event.effects, lastEvent.changes), lastEvent.effects), lastEvent.mapped, lastEvent.startSelection, none));
        } else {
            done = updateBranch(done, done.length, config.minDepth, event);
        }
        return new HistoryState(done, none, time, userEvent);
    }
    addSelection(selection, time, userEvent, newGroupDelay) {
        let last = this.done.length ? this.done[this.done.length - 1].selectionsAfter : none;
        if (last.length > 0 && time - this.prevTime < newGroupDelay && userEvent == this.prevUserEvent && userEvent && /^select($|\.)/.test(userEvent) && eqSelectionShape(last[last.length - 1], selection)) return this;
        return new HistoryState(addSelection(this.done, selection), this.undone, time, userEvent);
    }
    addMapping(mapping) {
        return new HistoryState(addMappingToBranch(this.done, mapping), addMappingToBranch(this.undone, mapping), this.prevTime, this.prevUserEvent);
    }
    pop(side, state, onlySelection) {
        let branch = side == 0 /* BranchName.Done */  ? this.done : this.undone;
        if (branch.length == 0) return null;
        let event = branch[branch.length - 1], selection = event.selectionsAfter[0] || state.selection;
        if (onlySelection && event.selectionsAfter.length) {
            return state.update({
                selection: event.selectionsAfter[event.selectionsAfter.length - 1],
                annotations: fromHistory.of({
                    side,
                    rest: popSelection(branch),
                    selection
                }),
                userEvent: side == 0 /* BranchName.Done */  ? "select.undo" : "select.redo",
                scrollIntoView: true
            });
        } else if (!event.changes) {
            return null;
        } else {
            let rest = branch.length == 1 ? none : branch.slice(0, branch.length - 1);
            if (event.mapped) rest = addMappingToBranch(rest, event.mapped);
            return state.update({
                changes: event.changes,
                selection: event.startSelection,
                effects: event.effects,
                annotations: fromHistory.of({
                    side,
                    rest,
                    selection
                }),
                filter: false,
                userEvent: side == 0 /* BranchName.Done */  ? "undo" : "redo",
                scrollIntoView: true
            });
        }
    }
}
HistoryState.empty = /*@__PURE__*/ new HistoryState(none, none);
/**
Default key bindings for the undo history.

- Mod-z: [`undo`](https://codemirror.net/6/docs/ref/#commands.undo).
- Mod-y (Mod-Shift-z on macOS) + Ctrl-Shift-z on Linux: [`redo`](https://codemirror.net/6/docs/ref/#commands.redo).
- Mod-u: [`undoSelection`](https://codemirror.net/6/docs/ref/#commands.undoSelection).
- Alt-u (Mod-Shift-u on macOS): [`redoSelection`](https://codemirror.net/6/docs/ref/#commands.redoSelection).
*/ const historyKeymap = [
    {
        key: "Mod-z",
        run: undo,
        preventDefault: true
    },
    {
        key: "Mod-y",
        mac: "Mod-Shift-z",
        run: redo,
        preventDefault: true
    },
    {
        linux: "Ctrl-Shift-z",
        run: redo,
        preventDefault: true
    },
    {
        key: "Mod-u",
        run: undoSelection,
        preventDefault: true
    },
    {
        key: "Alt-u",
        mac: "Mod-Shift-u",
        run: redoSelection,
        preventDefault: true
    }
];
function updateSel(sel, by) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create(sel.ranges.map(by), sel.mainIndex);
}
function setSel(state, selection) {
    return state.update({
        selection,
        scrollIntoView: true,
        userEvent: "select"
    });
}
function moveSel({ state, dispatch }, how) {
    let selection = updateSel(state.selection, how);
    if (selection.eq(state.selection, true)) return false;
    dispatch(setSel(state, selection));
    return true;
}
function rangeEnd(range, forward) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(forward ? range.to : range.from);
}
function cursorByChar(view, forward) {
    return moveSel(view, (range)=>range.empty ? view.moveByChar(range, forward) : rangeEnd(range, forward));
}
function ltrAtCursor(view) {
    return view.textDirectionAt(view.state.selection.main.head) == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Direction"].LTR;
}
/**
Move the selection one character to the left (which is backward in
left-to-right text, forward in right-to-left text).
*/ const cursorCharLeft = (view)=>cursorByChar(view, !ltrAtCursor(view));
/**
Move the selection one character to the right.
*/ const cursorCharRight = (view)=>cursorByChar(view, ltrAtCursor(view));
/**
Move the selection one character forward.
*/ const cursorCharForward = (view)=>cursorByChar(view, true);
/**
Move the selection one character backward.
*/ const cursorCharBackward = (view)=>cursorByChar(view, false);
function byCharLogical(state, range, forward) {
    let pos = range.head, line = state.doc.lineAt(pos);
    if (pos == (forward ? line.to : line.from)) pos = forward ? Math.min(state.doc.length, line.to + 1) : Math.max(0, line.from - 1);
    else pos = line.from + (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findClusterBreak"])(line.text, pos - line.from, forward);
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(pos, forward ? -1 : 1);
}
function moveByCharLogical(target, forward) {
    return moveSel(target, (range)=>range.empty ? byCharLogical(target.state, range, forward) : rangeEnd(range, forward));
}
/**
Move the selection one character forward, in logical
(non-text-direction-aware) string index order.
*/ const cursorCharForwardLogical = (target)=>moveByCharLogical(target, true);
/**
Move the selection one character backward, in logical string index
order.
*/ const cursorCharBackwardLogical = (target)=>moveByCharLogical(target, false);
function cursorByGroup(view, forward) {
    return moveSel(view, (range)=>range.empty ? view.moveByGroup(range, forward) : rangeEnd(range, forward));
}
/**
Move the selection to the left across one group of word or
non-word (but also non-space) characters.
*/ const cursorGroupLeft = (view)=>cursorByGroup(view, !ltrAtCursor(view));
/**
Move the selection one group to the right.
*/ const cursorGroupRight = (view)=>cursorByGroup(view, ltrAtCursor(view));
/**
Move the selection one group forward.
*/ const cursorGroupForward = (view)=>cursorByGroup(view, true);
/**
Move the selection one group backward.
*/ const cursorGroupBackward = (view)=>cursorByGroup(view, false);
function toGroupStart(view, pos, start) {
    let categorize = view.state.charCategorizer(pos);
    let cat = categorize(start), initial = cat != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Space;
    return (next)=>{
        let nextCat = categorize(next);
        if (nextCat != __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Space) return initial && nextCat == cat;
        initial = false;
        return true;
    };
}
/**
Move the cursor one group forward in the default Windows style,
where it moves to the start of the next group.
*/ const cursorGroupForwardWin = (view)=>{
    return moveSel(view, (range)=>range.empty ? view.moveByChar(range, true, (start)=>toGroupStart(view, range.head, start)) : rangeEnd(range, true));
};
const segmenter = typeof Intl != "undefined" && Intl.Segmenter ? /*@__PURE__*/ new Intl.Segmenter(undefined, {
    granularity: "word"
}) : null;
function moveBySubword(view, range, forward) {
    let categorize = view.state.charCategorizer(range.from);
    let cat = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Space, pos = range.from, steps = 0;
    let done = false, sawUpper = false, sawLower = false;
    let step = (next)=>{
        if (done) return false;
        pos += forward ? next.length : -next.length;
        let nextCat = categorize(next), ahead;
        if (nextCat == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word && next.charCodeAt(0) < 128 && /[\W_]/.test(next)) nextCat = -1; // Treat word punctuation specially
        if (cat == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Space) cat = nextCat;
        if (cat != nextCat) return false;
        if (cat == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word) {
            if (next.toLowerCase() == next) {
                if (!forward && sawUpper) return false;
                sawLower = true;
            } else if (sawLower) {
                if (forward) return false;
                done = true;
            } else {
                if (sawUpper && forward && categorize(ahead = view.state.sliceDoc(pos, pos + 1)) == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word && ahead.toLowerCase() == ahead) return false;
                sawUpper = true;
            }
        }
        steps++;
        return true;
    };
    let end = view.moveByChar(range, forward, (start)=>{
        step(start);
        return step;
    });
    if (segmenter && cat == __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CharCategory"].Word && end.from == range.from + steps * (forward ? 1 : -1)) {
        let from = Math.min(range.head, end.head), to = Math.max(range.head, end.head);
        let skipped = view.state.sliceDoc(from, to);
        if (skipped.length > 1 && /[\u4E00-\uffff]/.test(skipped)) {
            let segments = Array.from(segmenter.segment(skipped));
            if (segments.length > 1) {
                if (forward) return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.head + segments[1].index, -1);
                return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(end.head + segments[segments.length - 1].index, 1);
            }
        }
    }
    return end;
}
function cursorBySubword(view, forward) {
    return moveSel(view, (range)=>range.empty ? moveBySubword(view, range, forward) : rangeEnd(range, forward));
}
/**
Move the selection one group or camel-case subword forward.
*/ const cursorSubwordForward = (view)=>cursorBySubword(view, true);
/**
Move the selection one group or camel-case subword backward.
*/ const cursorSubwordBackward = (view)=>cursorBySubword(view, false);
function interestingNode(state, node, bracketProp) {
    if (node.type.prop(bracketProp)) return true;
    let len = node.to - node.from;
    return len && (len > 2 || /[^\s,.;:]/.test(state.sliceDoc(node.from, node.to))) || node.firstChild;
}
function moveBySyntax(state, start, forward) {
    let pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(state).resolveInner(start.head);
    let bracketProp = forward ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].closedBy : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].openedBy;
    // Scan forward through child nodes to see if there's an interesting
    // node ahead.
    for(let at = start.head;;){
        let next = forward ? pos.childAfter(at) : pos.childBefore(at);
        if (!next) break;
        if (interestingNode(state, next, bracketProp)) pos = next;
        else at = forward ? next.to : next.from;
    }
    let bracket = pos.type.prop(bracketProp), match, newPos;
    if (bracket && (match = forward ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matchBrackets"])(state, pos.from, 1) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matchBrackets"])(state, pos.to, -1)) && match.matched) newPos = forward ? match.end.to : match.end.from;
    else newPos = forward ? pos.to : pos.from;
    return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(newPos, forward ? -1 : 1);
}
/**
Move the cursor over the next syntactic element to the left.
*/ const cursorSyntaxLeft = (view)=>moveSel(view, (range)=>moveBySyntax(view.state, range, !ltrAtCursor(view)));
/**
Move the cursor over the next syntactic element to the right.
*/ const cursorSyntaxRight = (view)=>moveSel(view, (range)=>moveBySyntax(view.state, range, ltrAtCursor(view)));
function cursorByLine(view, forward) {
    return moveSel(view, (range)=>{
        if (!range.empty) return rangeEnd(range, forward);
        let moved = view.moveVertically(range, forward);
        return moved.head != range.head ? moved : view.moveToLineBoundary(range, forward);
    });
}
/**
Move the selection one line up.
*/ const cursorLineUp = (view)=>cursorByLine(view, false);
/**
Move the selection one line down.
*/ const cursorLineDown = (view)=>cursorByLine(view, true);
function pageInfo(view) {
    let selfScroll = view.scrollDOM.clientHeight < view.scrollDOM.scrollHeight - 2;
    let marginTop = 0, marginBottom = 0, height;
    if (selfScroll) {
        for (let source of view.state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].scrollMargins)){
            let margins = source(view);
            if (margins === null || margins === void 0 ? void 0 : margins.top) marginTop = Math.max(margins === null || margins === void 0 ? void 0 : margins.top, marginTop);
            if (margins === null || margins === void 0 ? void 0 : margins.bottom) marginBottom = Math.max(margins === null || margins === void 0 ? void 0 : margins.bottom, marginBottom);
        }
        height = view.scrollDOM.clientHeight - marginTop - marginBottom;
    } else {
        height = (view.dom.ownerDocument.defaultView || window).innerHeight;
    }
    return {
        marginTop,
        marginBottom,
        selfScroll,
        height: Math.max(view.defaultLineHeight, height - 5)
    };
}
function cursorByPage(view, forward) {
    let page = pageInfo(view);
    let { state } = view, selection = updateSel(state.selection, (range)=>{
        return range.empty ? view.moveVertically(range, forward, page.height) : rangeEnd(range, forward);
    });
    if (selection.eq(state.selection)) return false;
    let effect;
    if (page.selfScroll) {
        let startPos = view.coordsAtPos(state.selection.main.head);
        let scrollRect = view.scrollDOM.getBoundingClientRect();
        let scrollTop = scrollRect.top + page.marginTop, scrollBottom = scrollRect.bottom - page.marginBottom;
        if (startPos && startPos.top > scrollTop && startPos.bottom < scrollBottom) effect = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].scrollIntoView(selection.main.head, {
            y: "start",
            yMargin: startPos.top - scrollTop
        });
    }
    view.dispatch(setSel(state, selection), {
        effects: effect
    });
    return true;
}
/**
Move the selection one page up.
*/ const cursorPageUp = (view)=>cursorByPage(view, false);
/**
Move the selection one page down.
*/ const cursorPageDown = (view)=>cursorByPage(view, true);
function moveByLineBoundary(view, start, forward) {
    let line = view.lineBlockAt(start.head), moved = view.moveToLineBoundary(start, forward);
    if (moved.head == start.head && moved.head != (forward ? line.to : line.from)) moved = view.moveToLineBoundary(start, forward, false);
    if (!forward && moved.head == line.from && line.length) {
        let space = /^\s*/.exec(view.state.sliceDoc(line.from, Math.min(line.from + 100, line.to)))[0].length;
        if (space && start.head != line.from + space) moved = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(line.from + space);
    }
    return moved;
}
/**
Move the selection to the next line wrap point, or to the end of
the line if there isn't one left on this line.
*/ const cursorLineBoundaryForward = (view)=>moveSel(view, (range)=>moveByLineBoundary(view, range, true));
/**
Move the selection to previous line wrap point, or failing that to
the start of the line. If the line is indented, and the cursor
isn't already at the end of the indentation, this will move to the
end of the indentation instead of the start of the line.
*/ const cursorLineBoundaryBackward = (view)=>moveSel(view, (range)=>moveByLineBoundary(view, range, false));
/**
Move the selection one line wrap point to the left.
*/ const cursorLineBoundaryLeft = (view)=>moveSel(view, (range)=>moveByLineBoundary(view, range, !ltrAtCursor(view)));
/**
Move the selection one line wrap point to the right.
*/ const cursorLineBoundaryRight = (view)=>moveSel(view, (range)=>moveByLineBoundary(view, range, ltrAtCursor(view)));
/**
Move the selection to the start of the line.
*/ const cursorLineStart = (view)=>moveSel(view, (range)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(view.lineBlockAt(range.head).from, 1));
/**
Move the selection to the end of the line.
*/ const cursorLineEnd = (view)=>moveSel(view, (range)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(view.lineBlockAt(range.head).to, -1));
function toMatchingBracket(state, dispatch, extend) {
    let found = false, selection = updateSel(state.selection, (range)=>{
        let matching = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matchBrackets"])(state, range.head, -1) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matchBrackets"])(state, range.head, 1) || range.head > 0 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matchBrackets"])(state, range.head - 1, 1) || range.head < state.doc.length && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matchBrackets"])(state, range.head + 1, -1);
        if (!matching || !matching.end) return range;
        found = true;
        let head = matching.start.from == range.head ? matching.end.to : matching.end.from;
        return extend ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(range.anchor, head) : __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(head);
    });
    if (!found) return false;
    dispatch(setSel(state, selection));
    return true;
}
/**
Move the selection to the bracket matching the one it is currently
on, if any.
*/ const cursorMatchingBracket = ({ state, dispatch })=>toMatchingBracket(state, dispatch, false);
/**
Extend the selection to the bracket matching the one the selection
head is currently on, if any.
*/ const selectMatchingBracket = ({ state, dispatch })=>toMatchingBracket(state, dispatch, true);
function extendSel(target, how) {
    let selection = updateSel(target.state.selection, (range)=>{
        let head = how(range);
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(range.anchor, head.head, head.goalColumn, head.bidiLevel || undefined);
    });
    if (selection.eq(target.state.selection)) return false;
    target.dispatch(setSel(target.state, selection));
    return true;
}
function selectByChar(view, forward) {
    return extendSel(view, (range)=>view.moveByChar(range, forward));
}
/**
Move the selection head one character to the left, while leaving
the anchor in place.
*/ const selectCharLeft = (view)=>selectByChar(view, !ltrAtCursor(view));
/**
Move the selection head one character to the right.
*/ const selectCharRight = (view)=>selectByChar(view, ltrAtCursor(view));
/**
Move the selection head one character forward.
*/ const selectCharForward = (view)=>selectByChar(view, true);
/**
Move the selection head one character backward.
*/ const selectCharBackward = (view)=>selectByChar(view, false);
/**
Move the selection head one character forward by logical
(non-direction aware) string index order.
*/ const selectCharForwardLogical = (target)=>extendSel(target, (range)=>byCharLogical(target.state, range, true));
/**
Move the selection head one character backward by logical string
index order.
*/ const selectCharBackwardLogical = (target)=>extendSel(target, (range)=>byCharLogical(target.state, range, false));
function selectByGroup(view, forward) {
    return extendSel(view, (range)=>view.moveByGroup(range, forward));
}
/**
Move the selection head one [group](https://codemirror.net/6/docs/ref/#commands.cursorGroupLeft) to
the left.
*/ const selectGroupLeft = (view)=>selectByGroup(view, !ltrAtCursor(view));
/**
Move the selection head one group to the right.
*/ const selectGroupRight = (view)=>selectByGroup(view, ltrAtCursor(view));
/**
Move the selection head one group forward.
*/ const selectGroupForward = (view)=>selectByGroup(view, true);
/**
Move the selection head one group backward.
*/ const selectGroupBackward = (view)=>selectByGroup(view, false);
/**
Move the selection head one group forward in the default Windows
style, skipping to the start of the next group.
*/ const selectGroupForwardWin = (view)=>{
    return extendSel(view, (range)=>view.moveByChar(range, true, (start)=>toGroupStart(view, range.head, start)));
};
function selectBySubword(view, forward) {
    return extendSel(view, (range)=>moveBySubword(view, range, forward));
}
/**
Move the selection head one group or camel-case subword forward.
*/ const selectSubwordForward = (view)=>selectBySubword(view, true);
/**
Move the selection head one group or subword backward.
*/ const selectSubwordBackward = (view)=>selectBySubword(view, false);
/**
Move the selection head over the next syntactic element to the left.
*/ const selectSyntaxLeft = (view)=>extendSel(view, (range)=>moveBySyntax(view.state, range, !ltrAtCursor(view)));
/**
Move the selection head over the next syntactic element to the right.
*/ const selectSyntaxRight = (view)=>extendSel(view, (range)=>moveBySyntax(view.state, range, ltrAtCursor(view)));
function selectByLine(view, forward) {
    return extendSel(view, (range)=>view.moveVertically(range, forward));
}
/**
Move the selection head one line up.
*/ const selectLineUp = (view)=>selectByLine(view, false);
/**
Move the selection head one line down.
*/ const selectLineDown = (view)=>selectByLine(view, true);
function selectByPage(view, forward) {
    return extendSel(view, (range)=>view.moveVertically(range, forward, pageInfo(view).height));
}
/**
Move the selection head one page up.
*/ const selectPageUp = (view)=>selectByPage(view, false);
/**
Move the selection head one page down.
*/ const selectPageDown = (view)=>selectByPage(view, true);
/**
Move the selection head to the next line boundary.
*/ const selectLineBoundaryForward = (view)=>extendSel(view, (range)=>moveByLineBoundary(view, range, true));
/**
Move the selection head to the previous line boundary.
*/ const selectLineBoundaryBackward = (view)=>extendSel(view, (range)=>moveByLineBoundary(view, range, false));
/**
Move the selection head one line boundary to the left.
*/ const selectLineBoundaryLeft = (view)=>extendSel(view, (range)=>moveByLineBoundary(view, range, !ltrAtCursor(view)));
/**
Move the selection head one line boundary to the right.
*/ const selectLineBoundaryRight = (view)=>extendSel(view, (range)=>moveByLineBoundary(view, range, ltrAtCursor(view)));
/**
Move the selection head to the start of the line.
*/ const selectLineStart = (view)=>extendSel(view, (range)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(view.lineBlockAt(range.head).from));
/**
Move the selection head to the end of the line.
*/ const selectLineEnd = (view)=>extendSel(view, (range)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(view.lineBlockAt(range.head).to));
/**
Move the selection to the start of the document.
*/ const cursorDocStart = ({ state, dispatch })=>{
    dispatch(setSel(state, {
        anchor: 0
    }));
    return true;
};
/**
Move the selection to the end of the document.
*/ const cursorDocEnd = ({ state, dispatch })=>{
    dispatch(setSel(state, {
        anchor: state.doc.length
    }));
    return true;
};
/**
Move the selection head to the start of the document.
*/ const selectDocStart = ({ state, dispatch })=>{
    dispatch(setSel(state, {
        anchor: state.selection.main.anchor,
        head: 0
    }));
    return true;
};
/**
Move the selection head to the end of the document.
*/ const selectDocEnd = ({ state, dispatch })=>{
    dispatch(setSel(state, {
        anchor: state.selection.main.anchor,
        head: state.doc.length
    }));
    return true;
};
/**
Select the entire document.
*/ const selectAll = ({ state, dispatch })=>{
    dispatch(state.update({
        selection: {
            anchor: 0,
            head: state.doc.length
        },
        userEvent: "select"
    }));
    return true;
};
/**
Expand the selection to cover entire lines.
*/ const selectLine = ({ state, dispatch })=>{
    let ranges = selectedLineBlocks(state).map(({ from, to })=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(from, Math.min(to + 1, state.doc.length)));
    dispatch(state.update({
        selection: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create(ranges),
        userEvent: "select"
    }));
    return true;
};
/**
Select the next syntactic construct that is larger than the
selection. Note that this will only work insofar as the language
[provider](https://codemirror.net/6/docs/ref/#language.language) you use builds up a full
syntax tree.
*/ const selectParentSyntax = ({ state, dispatch })=>{
    let selection = updateSel(state.selection, (range)=>{
        let tree = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(state), stack = tree.resolveStack(range.from, 1);
        if (range.empty) {
            let stackBefore = tree.resolveStack(range.from, -1);
            if (stackBefore.node.from >= stack.node.from && stackBefore.node.to <= stack.node.to) stack = stackBefore;
        }
        for(let cur = stack; cur; cur = cur.next){
            let { node } = cur;
            if ((node.from < range.from && node.to >= range.to || node.to > range.to && node.from <= range.from) && cur.next) return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(node.to, node.from);
        }
        return range;
    });
    if (selection.eq(state.selection)) return false;
    dispatch(setSel(state, selection));
    return true;
};
function addCursorVertically(view, forward) {
    let { state } = view, sel = state.selection, ranges = state.selection.ranges.slice();
    for (let range of state.selection.ranges){
        let line = state.doc.lineAt(range.head);
        if (forward ? line.to < view.state.doc.length : line.from > 0) for(let cur = range;;){
            let next = view.moveVertically(cur, forward);
            if (next.head < line.from || next.head > line.to) {
                if (!ranges.some((r)=>r.head == next.head)) ranges.push(next);
                break;
            } else if (next.head == cur.head) {
                break;
            } else {
                cur = next;
            }
        }
    }
    if (ranges.length == sel.ranges.length) return false;
    view.dispatch(setSel(state, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create(ranges, ranges.length - 1)));
    return true;
}
/**
Expand the selection by adding a cursor above the heads of
currently selected ranges.
*/ const addCursorAbove = (view)=>addCursorVertically(view, false);
/**
Expand the selection by adding a cursor below the heads of
currently selected ranges.
*/ const addCursorBelow = (view)=>addCursorVertically(view, true);
/**
Simplify the current selection. When multiple ranges are selected,
reduce it to its main range. Otherwise, if the selection is
non-empty, convert it to a cursor selection.
*/ const simplifySelection = ({ state, dispatch })=>{
    let cur = state.selection, selection = null;
    if (cur.ranges.length > 1) selection = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create([
        cur.main
    ]);
    else if (!cur.main.empty) selection = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create([
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(cur.main.head)
    ]);
    if (!selection) return false;
    dispatch(setSel(state, selection));
    return true;
};
function deleteBy(target, by) {
    if (target.state.readOnly) return false;
    let event = "delete.selection", { state } = target;
    let changes = state.changeByRange((range)=>{
        let { from, to } = range;
        if (from == to) {
            let towards = by(range);
            if (towards < from) {
                event = "delete.backward";
                towards = skipAtomic(target, towards, false);
            } else if (towards > from) {
                event = "delete.forward";
                towards = skipAtomic(target, towards, true);
            }
            from = Math.min(from, towards);
            to = Math.max(to, towards);
        } else {
            from = skipAtomic(target, from, false);
            to = skipAtomic(target, to, true);
        }
        return from == to ? {
            range
        } : {
            changes: {
                from,
                to
            },
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(from, from < range.head ? -1 : 1)
        };
    });
    if (changes.changes.empty) return false;
    target.dispatch(state.update(changes, {
        scrollIntoView: true,
        userEvent: event,
        effects: event == "delete.selection" ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].announce.of(state.phrase("Selection deleted")) : undefined
    }));
    return true;
}
function skipAtomic(target, pos, forward) {
    if (target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"]) for (let ranges of target.state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$view$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorView"].atomicRanges).map((f)=>f(target)))ranges.between(pos, pos, (from, to)=>{
        if (from < pos && to > pos) pos = forward ? to : from;
    });
    return pos;
}
const deleteByChar = (target, forward, byIndentUnit)=>deleteBy(target, (range)=>{
        let pos = range.from, { state } = target, line = state.doc.lineAt(pos), before, targetPos;
        if (byIndentUnit && !forward && pos > line.from && pos < line.from + 200 && !/[^ \t]/.test(before = line.text.slice(0, pos - line.from))) {
            if (before[before.length - 1] == "\t") return pos - 1;
            let col = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countColumn"])(before, state.tabSize), drop = col % (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIndentUnit"])(state) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIndentUnit"])(state);
            for(let i = 0; i < drop && before[before.length - 1 - i] == " "; i++)pos--;
            targetPos = pos;
        } else {
            targetPos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findClusterBreak"])(line.text, pos - line.from, forward, forward) + line.from;
            if (targetPos == pos && line.number != (forward ? state.doc.lines : 1)) targetPos += forward ? 1 : -1;
            else if (!forward && /[\ufe00-\ufe0f]/.test(line.text.slice(targetPos - line.from, pos - line.from))) targetPos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findClusterBreak"])(line.text, targetPos - line.from, false, false) + line.from;
        }
        return targetPos;
    });
/**
Delete the selection, or, for cursor selections, the character or
indentation unit before the cursor.
*/ const deleteCharBackward = (view)=>deleteByChar(view, false, true);
/**
Delete the selection or the character before the cursor. Does not
implement any extended behavior like deleting whole indentation
units in one go.
*/ const deleteCharBackwardStrict = (view)=>deleteByChar(view, false, false);
/**
Delete the selection or the character after the cursor.
*/ const deleteCharForward = (view)=>deleteByChar(view, true, false);
const deleteByGroup = (target, forward)=>deleteBy(target, (range)=>{
        let pos = range.head, { state } = target, line = state.doc.lineAt(pos);
        let categorize = state.charCategorizer(pos);
        for(let cat = null;;){
            if (pos == (forward ? line.to : line.from)) {
                if (pos == range.head && line.number != (forward ? state.doc.lines : 1)) pos += forward ? 1 : -1;
                break;
            }
            let next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findClusterBreak"])(line.text, pos - line.from, forward) + line.from;
            let nextChar = line.text.slice(Math.min(pos, next) - line.from, Math.max(pos, next) - line.from);
            let nextCat = categorize(nextChar);
            if (cat != null && nextCat != cat) break;
            if (nextChar != " " || pos != range.head) cat = nextCat;
            pos = next;
        }
        return pos;
    });
/**
Delete the selection or backward until the end of the next
[group](https://codemirror.net/6/docs/ref/#view.EditorView.moveByGroup), only skipping groups of
whitespace when they consist of a single space.
*/ const deleteGroupBackward = (target)=>deleteByGroup(target, false);
/**
Delete the selection or forward until the end of the next group.
*/ const deleteGroupForward = (target)=>deleteByGroup(target, true);
/**
Variant of [`deleteGroupForward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupForward)
that uses the Windows convention of also deleting the whitespace
after a word.
*/ const deleteGroupForwardWin = (view)=>deleteBy(view, (range)=>view.moveByChar(range, true, (start)=>toGroupStart(view, range.head, start)).head);
/**
Delete the selection, or, if it is a cursor selection, delete to
the end of the line. If the cursor is directly at the end of the
line, delete the line break after it.
*/ const deleteToLineEnd = (view)=>deleteBy(view, (range)=>{
        let lineEnd = view.lineBlockAt(range.head).to;
        return range.head < lineEnd ? lineEnd : Math.min(view.state.doc.length, range.head + 1);
    });
/**
Delete the selection, or, if it is a cursor selection, delete to
the start of the line. If the cursor is directly at the start of the
line, delete the line break before it.
*/ const deleteToLineStart = (view)=>deleteBy(view, (range)=>{
        let lineStart = view.lineBlockAt(range.head).from;
        return range.head > lineStart ? lineStart : Math.max(0, range.head - 1);
    });
/**
Delete the selection, or, if it is a cursor selection, delete to
the start of the line or the next line wrap before the cursor.
*/ const deleteLineBoundaryBackward = (view)=>deleteBy(view, (range)=>{
        let lineStart = view.moveToLineBoundary(range, false).head;
        return range.head > lineStart ? lineStart : Math.max(0, range.head - 1);
    });
/**
Delete the selection, or, if it is a cursor selection, delete to
the end of the line or the next line wrap after the cursor.
*/ const deleteLineBoundaryForward = (view)=>deleteBy(view, (range)=>{
        let lineStart = view.moveToLineBoundary(range, true).head;
        return range.head < lineStart ? lineStart : Math.min(view.state.doc.length, range.head + 1);
    });
/**
Delete all whitespace directly before a line end from the
document.
*/ const deleteTrailingWhitespace = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    let changes = [];
    for(let pos = 0, prev = "", iter = state.doc.iter();;){
        iter.next();
        if (iter.lineBreak || iter.done) {
            let trailing = prev.search(/\s+$/);
            if (trailing > -1) changes.push({
                from: pos - (prev.length - trailing),
                to: pos
            });
            if (iter.done) break;
            prev = "";
        } else {
            prev = iter.value;
        }
        pos += iter.value.length;
    }
    if (!changes.length) return false;
    dispatch(state.update({
        changes,
        userEvent: "delete"
    }));
    return true;
};
/**
Replace each selection range with a line break, leaving the cursor
on the line before the break.
*/ const splitLine = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    let changes = state.changeByRange((range)=>{
        return {
            changes: {
                from: range.from,
                to: range.to,
                insert: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"].of([
                    "",
                    ""
                ])
            },
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.from)
        };
    });
    dispatch(state.update(changes, {
        scrollIntoView: true,
        userEvent: "input"
    }));
    return true;
};
/**
Flip the characters before and after the cursor(s).
*/ const transposeChars = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    let changes = state.changeByRange((range)=>{
        if (!range.empty || range.from == 0 || range.from == state.doc.length) return {
            range
        };
        let pos = range.from, line = state.doc.lineAt(pos);
        let from = pos == line.from ? pos - 1 : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findClusterBreak"])(line.text, pos - line.from, false) + line.from;
        let to = pos == line.to ? pos + 1 : (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findClusterBreak"])(line.text, pos - line.from, true) + line.from;
        return {
            changes: {
                from,
                to,
                insert: state.doc.slice(pos, to).append(state.doc.slice(from, pos))
            },
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(to)
        };
    });
    if (changes.changes.empty) return false;
    dispatch(state.update(changes, {
        scrollIntoView: true,
        userEvent: "move.character"
    }));
    return true;
};
function selectedLineBlocks(state) {
    let blocks = [], upto = -1;
    for (let range of state.selection.ranges){
        let startLine = state.doc.lineAt(range.from), endLine = state.doc.lineAt(range.to);
        if (!range.empty && range.to == endLine.from) endLine = state.doc.lineAt(range.to - 1);
        if (upto >= startLine.number) {
            let prev = blocks[blocks.length - 1];
            prev.to = endLine.to;
            prev.ranges.push(range);
        } else {
            blocks.push({
                from: startLine.from,
                to: endLine.to,
                ranges: [
                    range
                ]
            });
        }
        upto = endLine.number + 1;
    }
    return blocks;
}
function moveLine(state, dispatch, forward) {
    if (state.readOnly) return false;
    let changes = [], ranges = [];
    for (let block of selectedLineBlocks(state)){
        if (forward ? block.to == state.doc.length : block.from == 0) continue;
        let nextLine = state.doc.lineAt(forward ? block.to + 1 : block.from - 1);
        let size = nextLine.length + 1;
        if (forward) {
            changes.push({
                from: block.to,
                to: nextLine.to
            }, {
                from: block.from,
                insert: nextLine.text + state.lineBreak
            });
            for (let r of block.ranges)ranges.push(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(Math.min(state.doc.length, r.anchor + size), Math.min(state.doc.length, r.head + size)));
        } else {
            changes.push({
                from: nextLine.from,
                to: block.from
            }, {
                from: block.to,
                insert: state.lineBreak + nextLine.text
            });
            for (let r of block.ranges)ranges.push(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(r.anchor - size, r.head - size));
        }
    }
    if (!changes.length) return false;
    dispatch(state.update({
        changes,
        scrollIntoView: true,
        selection: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].create(ranges, state.selection.mainIndex),
        userEvent: "move.line"
    }));
    return true;
}
/**
Move the selected lines up one line.
*/ const moveLineUp = ({ state, dispatch })=>moveLine(state, dispatch, false);
/**
Move the selected lines down one line.
*/ const moveLineDown = ({ state, dispatch })=>moveLine(state, dispatch, true);
function copyLine(state, dispatch, forward) {
    if (state.readOnly) return false;
    let changes = [];
    for (let block of selectedLineBlocks(state)){
        if (forward) changes.push({
            from: block.from,
            insert: state.doc.slice(block.from, block.to) + state.lineBreak
        });
        else changes.push({
            from: block.to,
            insert: state.lineBreak + state.doc.slice(block.from, block.to)
        });
    }
    dispatch(state.update({
        changes,
        scrollIntoView: true,
        userEvent: "input.copyline"
    }));
    return true;
}
/**
Create a copy of the selected lines. Keep the selection in the top copy.
*/ const copyLineUp = ({ state, dispatch })=>copyLine(state, dispatch, false);
/**
Create a copy of the selected lines. Keep the selection in the bottom copy.
*/ const copyLineDown = ({ state, dispatch })=>copyLine(state, dispatch, true);
/**
Delete selected lines.
*/ const deleteLine = (view)=>{
    if (view.state.readOnly) return false;
    let { state } = view, changes = state.changes(selectedLineBlocks(state).map(({ from, to })=>{
        if (from > 0) from--;
        else if (to < state.doc.length) to++;
        return {
            from,
            to
        };
    }));
    let selection = updateSel(state.selection, (range)=>{
        let dist = undefined;
        if (view.lineWrapping) {
            let block = view.lineBlockAt(range.head), pos = view.coordsAtPos(range.head, range.assoc || 1);
            if (pos) dist = block.bottom + view.documentTop - pos.bottom + view.defaultLineHeight / 2;
        }
        return view.moveVertically(range, true, dist);
    }).map(changes);
    view.dispatch({
        changes,
        selection,
        scrollIntoView: true,
        userEvent: "delete.line"
    });
    return true;
};
/**
Replace the selection with a newline.
*/ const insertNewline = ({ state, dispatch })=>{
    dispatch(state.update(state.replaceSelection(state.lineBreak), {
        scrollIntoView: true,
        userEvent: "input"
    }));
    return true;
};
/**
Replace the selection with a newline and the same amount of
indentation as the line above.
*/ const insertNewlineKeepIndent = ({ state, dispatch })=>{
    dispatch(state.update(state.changeByRange((range)=>{
        let indent = /^\s*/.exec(state.doc.lineAt(range.from).text)[0];
        return {
            changes: {
                from: range.from,
                to: range.to,
                insert: state.lineBreak + indent
            },
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(range.from + indent.length + 1)
        };
    }), {
        scrollIntoView: true,
        userEvent: "input"
    }));
    return true;
};
function isBetweenBrackets(state, pos) {
    if (/\(\)|\[\]|\{\}/.test(state.sliceDoc(pos - 1, pos + 1))) return {
        from: pos,
        to: pos
    };
    let context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syntaxTree"])(state).resolveInner(pos);
    let before = context.childBefore(pos), after = context.childAfter(pos), closedBy;
    if (before && after && before.to <= pos && after.from >= pos && (closedBy = before.type.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].closedBy)) && closedBy.indexOf(after.name) > -1 && state.doc.lineAt(before.to).from == state.doc.lineAt(after.from).from && !/\S/.test(state.sliceDoc(before.to, after.from))) return {
        from: before.to,
        to: after.from
    };
    return null;
}
/**
Replace the selection with a newline and indent the newly created
line(s). If the current line consists only of whitespace, this
will also delete that whitespace. When the cursor is between
matching brackets, an additional newline will be inserted after
the cursor.
*/ const insertNewlineAndIndent = /*@__PURE__*/ newlineAndIndent(false);
/**
Create a blank, indented line below the current line.
*/ const insertBlankLine = /*@__PURE__*/ newlineAndIndent(true);
function newlineAndIndent(atEof) {
    return ({ state, dispatch })=>{
        if (state.readOnly) return false;
        let changes = state.changeByRange((range)=>{
            let { from, to } = range, line = state.doc.lineAt(from);
            let explode = !atEof && from == to && isBetweenBrackets(state, from);
            if (atEof) from = to = (to <= line.to ? line : state.doc.lineAt(to)).to;
            let cx = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IndentContext"](state, {
                simulateBreak: from,
                simulateDoubleBreak: !!explode
            });
            let indent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIndentation"])(cx, from);
            if (indent == null) indent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countColumn"])(/^\s*/.exec(state.doc.lineAt(from).text)[0], state.tabSize);
            while(to < line.to && /\s/.test(line.text[to - line.from]))to++;
            if (explode) ({ from, to } = explode);
            else if (from > line.from && from < line.from + 100 && !/\S/.test(line.text.slice(0, from))) from = line.from;
            let insert = [
                "",
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentString"])(state, indent)
            ];
            if (explode) insert.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentString"])(state, cx.lineIndent(line.from, -1)));
            return {
                changes: {
                    from,
                    to,
                    insert: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"].of(insert)
                },
                range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].cursor(from + 1 + insert[1].length)
            };
        });
        dispatch(state.update(changes, {
            scrollIntoView: true,
            userEvent: "input"
        }));
        return true;
    };
}
function changeBySelectedLine(state, f) {
    let atLine = -1;
    return state.changeByRange((range)=>{
        let changes = [];
        for(let pos = range.from; pos <= range.to;){
            let line = state.doc.lineAt(pos);
            if (line.number > atLine && (range.empty || range.to > line.from)) {
                f(line, changes, range);
                atLine = line.number;
            }
            pos = line.to + 1;
        }
        let changeSet = state.changes(changes);
        return {
            changes,
            range: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EditorSelection"].range(changeSet.mapPos(range.anchor, 1), changeSet.mapPos(range.head, 1))
        };
    });
}
/**
Auto-indent the selected lines. This uses the [indentation service
facet](https://codemirror.net/6/docs/ref/#language.indentService) as source for auto-indent
information.
*/ const indentSelection = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    let updated = Object.create(null);
    let context = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IndentContext"](state, {
        overrideIndentation: (start)=>{
            let found = updated[start];
            return found == null ? -1 : found;
        }
    });
    let changes = changeBySelectedLine(state, (line, changes, range)=>{
        let indent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIndentation"])(context, line.from);
        if (indent == null) return;
        if (!/\S/.test(line.text)) indent = 0;
        let cur = /^\s*/.exec(line.text)[0];
        let norm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentString"])(state, indent);
        if (cur != norm || range.from < line.from + cur.length) {
            updated[line.from] = indent;
            changes.push({
                from: line.from,
                to: line.from + cur.length,
                insert: norm
            });
        }
    });
    if (!changes.changes.empty) dispatch(state.update(changes, {
        userEvent: "indent"
    }));
    return true;
};
/**
Add a [unit](https://codemirror.net/6/docs/ref/#language.indentUnit) of indentation to all selected
lines.
*/ const indentMore = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    dispatch(state.update(changeBySelectedLine(state, (line, changes)=>{
        changes.push({
            from: line.from,
            insert: state.facet(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentUnit"])
        });
    }), {
        userEvent: "input.indent"
    }));
    return true;
};
/**
Remove a [unit](https://codemirror.net/6/docs/ref/#language.indentUnit) of indentation from all
selected lines.
*/ const indentLess = ({ state, dispatch })=>{
    if (state.readOnly) return false;
    dispatch(state.update(changeBySelectedLine(state, (line, changes)=>{
        let space = /^\s*/.exec(line.text)[0];
        if (!space) return;
        let col = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$state$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countColumn"])(space, state.tabSize), keep = 0;
        let insert = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentString"])(state, Math.max(0, col - (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$codemirror$2f$language$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIndentUnit"])(state)));
        while(keep < space.length && keep < insert.length && space.charCodeAt(keep) == insert.charCodeAt(keep))keep++;
        changes.push({
            from: line.from + keep,
            to: line.from + space.length,
            insert: insert.slice(keep)
        });
    }), {
        userEvent: "delete.dedent"
    }));
    return true;
};
/**
Enables or disables
[tab-focus mode](https://codemirror.net/6/docs/ref/#view.EditorView.setTabFocusMode). While on, this
prevents the editor's key bindings from capturing Tab or
Shift-Tab, making it possible for the user to move focus out of
the editor with the keyboard.
*/ const toggleTabFocusMode = (view)=>{
    view.setTabFocusMode();
    return true;
};
/**
Temporarily enables [tab-focus
mode](https://codemirror.net/6/docs/ref/#view.EditorView.setTabFocusMode) for two seconds or until
another key is pressed.
*/ const temporarilySetTabFocusMode = (view)=>{
    view.setTabFocusMode(2000);
    return true;
};
/**
Insert a tab character at the cursor or, if something is selected,
use [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore) to indent the entire
selection.
*/ const insertTab = ({ state, dispatch })=>{
    if (state.selection.ranges.some((r)=>!r.empty)) return indentMore({
        state,
        dispatch
    });
    dispatch(state.update(state.replaceSelection("\t"), {
        scrollIntoView: true,
        userEvent: "input"
    }));
    return true;
};
/**
Array of key bindings containing the Emacs-style bindings that are
available on macOS by default.

 - Ctrl-b: [`cursorCharLeft`](https://codemirror.net/6/docs/ref/#commands.cursorCharLeft) ([`selectCharLeft`](https://codemirror.net/6/docs/ref/#commands.selectCharLeft) with Shift)
 - Ctrl-f: [`cursorCharRight`](https://codemirror.net/6/docs/ref/#commands.cursorCharRight) ([`selectCharRight`](https://codemirror.net/6/docs/ref/#commands.selectCharRight) with Shift)
 - Ctrl-p: [`cursorLineUp`](https://codemirror.net/6/docs/ref/#commands.cursorLineUp) ([`selectLineUp`](https://codemirror.net/6/docs/ref/#commands.selectLineUp) with Shift)
 - Ctrl-n: [`cursorLineDown`](https://codemirror.net/6/docs/ref/#commands.cursorLineDown) ([`selectLineDown`](https://codemirror.net/6/docs/ref/#commands.selectLineDown) with Shift)
 - Ctrl-a: [`cursorLineStart`](https://codemirror.net/6/docs/ref/#commands.cursorLineStart) ([`selectLineStart`](https://codemirror.net/6/docs/ref/#commands.selectLineStart) with Shift)
 - Ctrl-e: [`cursorLineEnd`](https://codemirror.net/6/docs/ref/#commands.cursorLineEnd) ([`selectLineEnd`](https://codemirror.net/6/docs/ref/#commands.selectLineEnd) with Shift)
 - Ctrl-d: [`deleteCharForward`](https://codemirror.net/6/docs/ref/#commands.deleteCharForward)
 - Ctrl-h: [`deleteCharBackward`](https://codemirror.net/6/docs/ref/#commands.deleteCharBackward)
 - Ctrl-k: [`deleteToLineEnd`](https://codemirror.net/6/docs/ref/#commands.deleteToLineEnd)
 - Ctrl-Alt-h: [`deleteGroupBackward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupBackward)
 - Ctrl-o: [`splitLine`](https://codemirror.net/6/docs/ref/#commands.splitLine)
 - Ctrl-t: [`transposeChars`](https://codemirror.net/6/docs/ref/#commands.transposeChars)
 - Ctrl-v: [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown)
 - Alt-v: [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp)
*/ const emacsStyleKeymap = [
    {
        key: "Ctrl-b",
        run: cursorCharLeft,
        shift: selectCharLeft,
        preventDefault: true
    },
    {
        key: "Ctrl-f",
        run: cursorCharRight,
        shift: selectCharRight
    },
    {
        key: "Ctrl-p",
        run: cursorLineUp,
        shift: selectLineUp
    },
    {
        key: "Ctrl-n",
        run: cursorLineDown,
        shift: selectLineDown
    },
    {
        key: "Ctrl-a",
        run: cursorLineStart,
        shift: selectLineStart
    },
    {
        key: "Ctrl-e",
        run: cursorLineEnd,
        shift: selectLineEnd
    },
    {
        key: "Ctrl-d",
        run: deleteCharForward
    },
    {
        key: "Ctrl-h",
        run: deleteCharBackward
    },
    {
        key: "Ctrl-k",
        run: deleteToLineEnd
    },
    {
        key: "Ctrl-Alt-h",
        run: deleteGroupBackward
    },
    {
        key: "Ctrl-o",
        run: splitLine
    },
    {
        key: "Ctrl-t",
        run: transposeChars
    },
    {
        key: "Ctrl-v",
        run: cursorPageDown
    }
];
/**
An array of key bindings closely sticking to platform-standard or
widely used bindings. (This includes the bindings from
[`emacsStyleKeymap`](https://codemirror.net/6/docs/ref/#commands.emacsStyleKeymap), with their `key`
property changed to `mac`.)

 - ArrowLeft: [`cursorCharLeft`](https://codemirror.net/6/docs/ref/#commands.cursorCharLeft) ([`selectCharLeft`](https://codemirror.net/6/docs/ref/#commands.selectCharLeft) with Shift)
 - ArrowRight: [`cursorCharRight`](https://codemirror.net/6/docs/ref/#commands.cursorCharRight) ([`selectCharRight`](https://codemirror.net/6/docs/ref/#commands.selectCharRight) with Shift)
 - Ctrl-ArrowLeft (Alt-ArrowLeft on macOS): [`cursorGroupLeft`](https://codemirror.net/6/docs/ref/#commands.cursorGroupLeft) ([`selectGroupLeft`](https://codemirror.net/6/docs/ref/#commands.selectGroupLeft) with Shift)
 - Ctrl-ArrowRight (Alt-ArrowRight on macOS): [`cursorGroupRight`](https://codemirror.net/6/docs/ref/#commands.cursorGroupRight) ([`selectGroupRight`](https://codemirror.net/6/docs/ref/#commands.selectGroupRight) with Shift)
 - Cmd-ArrowLeft (on macOS): [`cursorLineStart`](https://codemirror.net/6/docs/ref/#commands.cursorLineStart) ([`selectLineStart`](https://codemirror.net/6/docs/ref/#commands.selectLineStart) with Shift)
 - Cmd-ArrowRight (on macOS): [`cursorLineEnd`](https://codemirror.net/6/docs/ref/#commands.cursorLineEnd) ([`selectLineEnd`](https://codemirror.net/6/docs/ref/#commands.selectLineEnd) with Shift)
 - ArrowUp: [`cursorLineUp`](https://codemirror.net/6/docs/ref/#commands.cursorLineUp) ([`selectLineUp`](https://codemirror.net/6/docs/ref/#commands.selectLineUp) with Shift)
 - ArrowDown: [`cursorLineDown`](https://codemirror.net/6/docs/ref/#commands.cursorLineDown) ([`selectLineDown`](https://codemirror.net/6/docs/ref/#commands.selectLineDown) with Shift)
 - Cmd-ArrowUp (on macOS): [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart) ([`selectDocStart`](https://codemirror.net/6/docs/ref/#commands.selectDocStart) with Shift)
 - Cmd-ArrowDown (on macOS): [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd) ([`selectDocEnd`](https://codemirror.net/6/docs/ref/#commands.selectDocEnd) with Shift)
 - Ctrl-ArrowUp (on macOS): [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp) ([`selectPageUp`](https://codemirror.net/6/docs/ref/#commands.selectPageUp) with Shift)
 - Ctrl-ArrowDown (on macOS): [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown) ([`selectPageDown`](https://codemirror.net/6/docs/ref/#commands.selectPageDown) with Shift)
 - PageUp: [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp) ([`selectPageUp`](https://codemirror.net/6/docs/ref/#commands.selectPageUp) with Shift)
 - PageDown: [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown) ([`selectPageDown`](https://codemirror.net/6/docs/ref/#commands.selectPageDown) with Shift)
 - Home: [`cursorLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.cursorLineBoundaryBackward) ([`selectLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.selectLineBoundaryBackward) with Shift)
 - End: [`cursorLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.cursorLineBoundaryForward) ([`selectLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.selectLineBoundaryForward) with Shift)
 - Ctrl-Home (Cmd-Home on macOS): [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart) ([`selectDocStart`](https://codemirror.net/6/docs/ref/#commands.selectDocStart) with Shift)
 - Ctrl-End (Cmd-Home on macOS): [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd) ([`selectDocEnd`](https://codemirror.net/6/docs/ref/#commands.selectDocEnd) with Shift)
 - Enter and Shift-Enter: [`insertNewlineAndIndent`](https://codemirror.net/6/docs/ref/#commands.insertNewlineAndIndent)
 - Ctrl-a (Cmd-a on macOS): [`selectAll`](https://codemirror.net/6/docs/ref/#commands.selectAll)
 - Backspace: [`deleteCharBackward`](https://codemirror.net/6/docs/ref/#commands.deleteCharBackward)
 - Delete: [`deleteCharForward`](https://codemirror.net/6/docs/ref/#commands.deleteCharForward)
 - Ctrl-Backspace (Alt-Backspace on macOS): [`deleteGroupBackward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupBackward)
 - Ctrl-Delete (Alt-Delete on macOS): [`deleteGroupForward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupForward)
 - Cmd-Backspace (macOS): [`deleteLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.deleteLineBoundaryBackward).
 - Cmd-Delete (macOS): [`deleteLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.deleteLineBoundaryForward).
*/ const standardKeymap = /*@__PURE__*/ [
    {
        key: "ArrowLeft",
        run: cursorCharLeft,
        shift: selectCharLeft,
        preventDefault: true
    },
    {
        key: "Mod-ArrowLeft",
        mac: "Alt-ArrowLeft",
        run: cursorGroupLeft,
        shift: selectGroupLeft,
        preventDefault: true
    },
    {
        mac: "Cmd-ArrowLeft",
        run: cursorLineBoundaryLeft,
        shift: selectLineBoundaryLeft,
        preventDefault: true
    },
    {
        key: "ArrowRight",
        run: cursorCharRight,
        shift: selectCharRight,
        preventDefault: true
    },
    {
        key: "Mod-ArrowRight",
        mac: "Alt-ArrowRight",
        run: cursorGroupRight,
        shift: selectGroupRight,
        preventDefault: true
    },
    {
        mac: "Cmd-ArrowRight",
        run: cursorLineBoundaryRight,
        shift: selectLineBoundaryRight,
        preventDefault: true
    },
    {
        key: "ArrowUp",
        run: cursorLineUp,
        shift: selectLineUp,
        preventDefault: true
    },
    {
        mac: "Cmd-ArrowUp",
        run: cursorDocStart,
        shift: selectDocStart
    },
    {
        mac: "Ctrl-ArrowUp",
        run: cursorPageUp,
        shift: selectPageUp
    },
    {
        key: "ArrowDown",
        run: cursorLineDown,
        shift: selectLineDown,
        preventDefault: true
    },
    {
        mac: "Cmd-ArrowDown",
        run: cursorDocEnd,
        shift: selectDocEnd
    },
    {
        mac: "Ctrl-ArrowDown",
        run: cursorPageDown,
        shift: selectPageDown
    },
    {
        key: "PageUp",
        run: cursorPageUp,
        shift: selectPageUp
    },
    {
        key: "PageDown",
        run: cursorPageDown,
        shift: selectPageDown
    },
    {
        key: "Home",
        run: cursorLineBoundaryBackward,
        shift: selectLineBoundaryBackward,
        preventDefault: true
    },
    {
        key: "Mod-Home",
        run: cursorDocStart,
        shift: selectDocStart
    },
    {
        key: "End",
        run: cursorLineBoundaryForward,
        shift: selectLineBoundaryForward,
        preventDefault: true
    },
    {
        key: "Mod-End",
        run: cursorDocEnd,
        shift: selectDocEnd
    },
    {
        key: "Enter",
        run: insertNewlineAndIndent,
        shift: insertNewlineAndIndent
    },
    {
        key: "Mod-a",
        run: selectAll
    },
    {
        key: "Backspace",
        run: deleteCharBackward,
        shift: deleteCharBackward,
        preventDefault: true
    },
    {
        key: "Delete",
        run: deleteCharForward,
        preventDefault: true
    },
    {
        key: "Mod-Backspace",
        mac: "Alt-Backspace",
        run: deleteGroupBackward,
        preventDefault: true
    },
    {
        key: "Mod-Delete",
        mac: "Alt-Delete",
        run: deleteGroupForward,
        preventDefault: true
    },
    {
        mac: "Mod-Backspace",
        run: deleteLineBoundaryBackward,
        preventDefault: true
    },
    {
        mac: "Mod-Delete",
        run: deleteLineBoundaryForward,
        preventDefault: true
    }
].concat(/*@__PURE__*/ emacsStyleKeymap.map((b)=>({
        mac: b.key,
        run: b.run,
        shift: b.shift
    })));
/**
The default keymap. Includes all bindings from
[`standardKeymap`](https://codemirror.net/6/docs/ref/#commands.standardKeymap) plus the following:

- Alt-ArrowLeft (Ctrl-ArrowLeft on macOS): [`cursorSyntaxLeft`](https://codemirror.net/6/docs/ref/#commands.cursorSyntaxLeft) ([`selectSyntaxLeft`](https://codemirror.net/6/docs/ref/#commands.selectSyntaxLeft) with Shift)
- Alt-ArrowRight (Ctrl-ArrowRight on macOS): [`cursorSyntaxRight`](https://codemirror.net/6/docs/ref/#commands.cursorSyntaxRight) ([`selectSyntaxRight`](https://codemirror.net/6/docs/ref/#commands.selectSyntaxRight) with Shift)
- Alt-ArrowUp: [`moveLineUp`](https://codemirror.net/6/docs/ref/#commands.moveLineUp)
- Alt-ArrowDown: [`moveLineDown`](https://codemirror.net/6/docs/ref/#commands.moveLineDown)
- Shift-Alt-ArrowUp: [`copyLineUp`](https://codemirror.net/6/docs/ref/#commands.copyLineUp)
- Shift-Alt-ArrowDown: [`copyLineDown`](https://codemirror.net/6/docs/ref/#commands.copyLineDown)
- Ctrl-Alt-ArrowUp (Cmd-Alt-ArrowUp on macOS): [`addCursorAbove`](https://codemirror.net/6/docs/ref/#commands.addCursorAbove).
- Ctrl-Alt-ArrowDown (Cmd-Alt-ArrowDown on macOS): [`addCursorBelow`](https://codemirror.net/6/docs/ref/#commands.addCursorBelow).
- Escape: [`simplifySelection`](https://codemirror.net/6/docs/ref/#commands.simplifySelection)
- Ctrl-Enter (Cmd-Enter on macOS): [`insertBlankLine`](https://codemirror.net/6/docs/ref/#commands.insertBlankLine)
- Alt-l (Ctrl-l on macOS): [`selectLine`](https://codemirror.net/6/docs/ref/#commands.selectLine)
- Ctrl-i (Cmd-i on macOS): [`selectParentSyntax`](https://codemirror.net/6/docs/ref/#commands.selectParentSyntax)
- Ctrl-[ (Cmd-[ on macOS): [`indentLess`](https://codemirror.net/6/docs/ref/#commands.indentLess)
- Ctrl-] (Cmd-] on macOS): [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore)
- Ctrl-Alt-\\ (Cmd-Alt-\\ on macOS): [`indentSelection`](https://codemirror.net/6/docs/ref/#commands.indentSelection)
- Shift-Ctrl-k (Shift-Cmd-k on macOS): [`deleteLine`](https://codemirror.net/6/docs/ref/#commands.deleteLine)
- Shift-Ctrl-\\ (Shift-Cmd-\\ on macOS): [`cursorMatchingBracket`](https://codemirror.net/6/docs/ref/#commands.cursorMatchingBracket)
- Ctrl-/ (Cmd-/ on macOS): [`toggleComment`](https://codemirror.net/6/docs/ref/#commands.toggleComment).
- Shift-Alt-a: [`toggleBlockComment`](https://codemirror.net/6/docs/ref/#commands.toggleBlockComment).
- Ctrl-m (Alt-Shift-m on macOS): [`toggleTabFocusMode`](https://codemirror.net/6/docs/ref/#commands.toggleTabFocusMode).
*/ const defaultKeymap = /*@__PURE__*/ [
    {
        key: "Alt-ArrowLeft",
        mac: "Ctrl-ArrowLeft",
        run: cursorSyntaxLeft,
        shift: selectSyntaxLeft
    },
    {
        key: "Alt-ArrowRight",
        mac: "Ctrl-ArrowRight",
        run: cursorSyntaxRight,
        shift: selectSyntaxRight
    },
    {
        key: "Alt-ArrowUp",
        run: moveLineUp
    },
    {
        key: "Shift-Alt-ArrowUp",
        run: copyLineUp
    },
    {
        key: "Alt-ArrowDown",
        run: moveLineDown
    },
    {
        key: "Shift-Alt-ArrowDown",
        run: copyLineDown
    },
    {
        key: "Mod-Alt-ArrowUp",
        run: addCursorAbove
    },
    {
        key: "Mod-Alt-ArrowDown",
        run: addCursorBelow
    },
    {
        key: "Escape",
        run: simplifySelection
    },
    {
        key: "Mod-Enter",
        run: insertBlankLine
    },
    {
        key: "Alt-l",
        mac: "Ctrl-l",
        run: selectLine
    },
    {
        key: "Mod-i",
        run: selectParentSyntax,
        preventDefault: true
    },
    {
        key: "Mod-[",
        run: indentLess
    },
    {
        key: "Mod-]",
        run: indentMore
    },
    {
        key: "Mod-Alt-\\",
        run: indentSelection
    },
    {
        key: "Shift-Mod-k",
        run: deleteLine
    },
    {
        key: "Shift-Mod-\\",
        run: cursorMatchingBracket
    },
    {
        key: "Mod-/",
        run: toggleComment
    },
    {
        key: "Alt-A",
        run: toggleBlockComment
    },
    {
        key: "Ctrl-m",
        mac: "Shift-Alt-m",
        run: toggleTabFocusMode
    }
].concat(standardKeymap);
/**
A binding that binds Tab to [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore) and
Shift-Tab to [`indentLess`](https://codemirror.net/6/docs/ref/#commands.indentLess).
Please see the [Tab example](../../examples/tab/) before using
this.
*/ const indentWithTab = {
    key: "Tab",
    run: indentMore,
    shift: indentLess
};
;
}),
]);

//# sourceMappingURL=7dc3a_%40codemirror_f6f6d9a3._.js.map