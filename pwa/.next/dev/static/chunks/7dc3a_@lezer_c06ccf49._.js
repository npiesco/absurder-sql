(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/node_modules/@lezer/common/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
The default maximum length of a `TreeBuffer` node.
*/ __turbopack_context__.s([
    "DefaultBufferLength",
    ()=>DefaultBufferLength,
    "IterMode",
    ()=>IterMode,
    "MountedTree",
    ()=>MountedTree,
    "NodeProp",
    ()=>NodeProp,
    "NodeSet",
    ()=>NodeSet,
    "NodeType",
    ()=>NodeType,
    "NodeWeakMap",
    ()=>NodeWeakMap,
    "Parser",
    ()=>Parser,
    "Tree",
    ()=>Tree,
    "TreeBuffer",
    ()=>TreeBuffer,
    "TreeCursor",
    ()=>TreeCursor,
    "TreeFragment",
    ()=>TreeFragment,
    "parseMixed",
    ()=>parseMixed
]);
const DefaultBufferLength = 1024;
let nextPropID = 0;
class Range {
    constructor(from, to){
        this.from = from;
        this.to = to;
    }
}
/**
Each [node type](#common.NodeType) or [individual tree](#common.Tree)
can have metadata associated with it in props. Instances of this
class represent prop names.
*/ class NodeProp {
    /**
    Create a new node prop type.
    */ constructor(config = {}){
        this.id = nextPropID++;
        this.perNode = !!config.perNode;
        this.deserialize = config.deserialize || (()=>{
            throw new Error("This node type doesn't define a deserialize function");
        });
        this.combine = config.combine || null;
    }
    /**
    This is meant to be used with
    [`NodeSet.extend`](#common.NodeSet.extend) or
    [`LRParser.configure`](#lr.ParserConfig.props) to compute
    prop values for each node type in the set. Takes a [match
    object](#common.NodeType^match) or function that returns undefined
    if the node type doesn't get this prop, and the prop's value if
    it does.
    */ add(match) {
        if (this.perNode) throw new RangeError("Can't add per-node props to node types");
        if (typeof match != "function") match = NodeType.match(match);
        return (type)=>{
            let result = match(type);
            return result === undefined ? null : [
                this,
                result
            ];
        };
    }
}
/**
Prop that is used to describe matching delimiters. For opening
delimiters, this holds an array of node names (written as a
space-separated string when declaring this prop in a grammar)
for the node types of closing delimiters that match it.
*/ NodeProp.closedBy = new NodeProp({
    deserialize: (str)=>str.split(" ")
});
/**
The inverse of [`closedBy`](#common.NodeProp^closedBy). This is
attached to closing delimiters, holding an array of node names
of types of matching opening delimiters.
*/ NodeProp.openedBy = new NodeProp({
    deserialize: (str)=>str.split(" ")
});
/**
Used to assign node types to groups (for example, all node
types that represent an expression could be tagged with an
`"Expression"` group).
*/ NodeProp.group = new NodeProp({
    deserialize: (str)=>str.split(" ")
});
/**
Attached to nodes to indicate these should be
[displayed](https://codemirror.net/docs/ref/#language.syntaxTree)
in a bidirectional text isolate, so that direction-neutral
characters on their sides don't incorrectly get associated with
surrounding text. You'll generally want to set this for nodes
that contain arbitrary text, like strings and comments, and for
nodes that appear _inside_ arbitrary text, like HTML tags. When
not given a value, in a grammar declaration, defaults to
`"auto"`.
*/ NodeProp.isolate = new NodeProp({
    deserialize: (value)=>{
        if (value && value != "rtl" && value != "ltr" && value != "auto") throw new RangeError("Invalid value for isolate: " + value);
        return value || "auto";
    }
});
/**
The hash of the [context](#lr.ContextTracker.constructor)
that the node was parsed in, if any. Used to limit reuse of
contextual nodes.
*/ NodeProp.contextHash = new NodeProp({
    perNode: true
});
/**
The distance beyond the end of the node that the tokenizer
looked ahead for any of the tokens inside the node. (The LR
parser only stores this when it is larger than 25, for
efficiency reasons.)
*/ NodeProp.lookAhead = new NodeProp({
    perNode: true
});
/**
This per-node prop is used to replace a given node, or part of a
node, with another tree. This is useful to include trees from
different languages in mixed-language parsers.
*/ NodeProp.mounted = new NodeProp({
    perNode: true
});
/**
A mounted tree, which can be [stored](#common.NodeProp^mounted) on
a tree node to indicate that parts of its content are
represented by another tree.
*/ class MountedTree {
    constructor(/**
    The inner tree.
    */ tree, /**
    If this is null, this tree replaces the entire node (it will
    be included in the regular iteration instead of its host
    node). If not, only the given ranges are considered to be
    covered by this tree. This is used for trees that are mixed in
    a way that isn't strictly hierarchical. Such mounted trees are
    only entered by [`resolveInner`](#common.Tree.resolveInner)
    and [`enter`](#common.SyntaxNode.enter).
    */ overlay, /**
    The parser used to create this subtree.
    */ parser){
        this.tree = tree;
        this.overlay = overlay;
        this.parser = parser;
    }
    /**
    @internal
    */ static get(tree) {
        return tree && tree.props && tree.props[NodeProp.mounted.id];
    }
}
const noProps = Object.create(null);
/**
Each node in a syntax tree has a node type associated with it.
*/ class NodeType {
    /**
    @internal
    */ constructor(/**
    The name of the node type. Not necessarily unique, but if the
    grammar was written properly, different node types with the
    same name within a node set should play the same semantic
    role.
    */ name, /**
    @internal
    */ props, /**
    The id of this node in its set. Corresponds to the term ids
    used in the parser.
    */ id, /**
    @internal
    */ flags = 0){
        this.name = name;
        this.props = props;
        this.id = id;
        this.flags = flags;
    }
    /**
    Define a node type.
    */ static define(spec) {
        let props = spec.props && spec.props.length ? Object.create(null) : noProps;
        let flags = (spec.top ? 1 /* NodeFlag.Top */  : 0) | (spec.skipped ? 2 /* NodeFlag.Skipped */  : 0) | (spec.error ? 4 /* NodeFlag.Error */  : 0) | (spec.name == null ? 8 /* NodeFlag.Anonymous */  : 0);
        let type = new NodeType(spec.name || "", props, spec.id, flags);
        if (spec.props) for (let src of spec.props){
            if (!Array.isArray(src)) src = src(type);
            if (src) {
                if (src[0].perNode) throw new RangeError("Can't store a per-node prop on a node type");
                props[src[0].id] = src[1];
            }
        }
        return type;
    }
    /**
    Retrieves a node prop for this type. Will return `undefined` if
    the prop isn't present on this node.
    */ prop(prop) {
        return this.props[prop.id];
    }
    /**
    True when this is the top node of a grammar.
    */ get isTop() {
        return (this.flags & 1 /* NodeFlag.Top */ ) > 0;
    }
    /**
    True when this node is produced by a skip rule.
    */ get isSkipped() {
        return (this.flags & 2 /* NodeFlag.Skipped */ ) > 0;
    }
    /**
    Indicates whether this is an error node.
    */ get isError() {
        return (this.flags & 4 /* NodeFlag.Error */ ) > 0;
    }
    /**
    When true, this node type doesn't correspond to a user-declared
    named node, for example because it is used to cache repetition.
    */ get isAnonymous() {
        return (this.flags & 8 /* NodeFlag.Anonymous */ ) > 0;
    }
    /**
    Returns true when this node's name or one of its
    [groups](#common.NodeProp^group) matches the given string.
    */ is(name) {
        if (typeof name == 'string') {
            if (this.name == name) return true;
            let group = this.prop(NodeProp.group);
            return group ? group.indexOf(name) > -1 : false;
        }
        return this.id == name;
    }
    /**
    Create a function from node types to arbitrary values by
    specifying an object whose property names are node or
    [group](#common.NodeProp^group) names. Often useful with
    [`NodeProp.add`](#common.NodeProp.add). You can put multiple
    names, separated by spaces, in a single property name to map
    multiple node names to a single value.
    */ static match(map) {
        let direct = Object.create(null);
        for(let prop in map)for (let name of prop.split(" "))direct[name] = map[prop];
        return (node)=>{
            for(let groups = node.prop(NodeProp.group), i = -1; i < (groups ? groups.length : 0); i++){
                let found = direct[i < 0 ? node.name : groups[i]];
                if (found) return found;
            }
        };
    }
}
/**
An empty dummy node type to use when no actual type is available.
*/ NodeType.none = new NodeType("", Object.create(null), 0, 8 /* NodeFlag.Anonymous */ );
/**
A node set holds a collection of node types. It is used to
compactly represent trees by storing their type ids, rather than a
full pointer to the type object, in a numeric array. Each parser
[has](#lr.LRParser.nodeSet) a node set, and [tree
buffers](#common.TreeBuffer) can only store collections of nodes
from the same set. A set can have a maximum of 2**16 (65536) node
types in it, so that the ids fit into 16-bit typed array slots.
*/ class NodeSet {
    /**
    Create a set with the given types. The `id` property of each
    type should correspond to its position within the array.
    */ constructor(/**
    The node types in this set, by id.
    */ types){
        this.types = types;
        for(let i = 0; i < types.length; i++)if (types[i].id != i) throw new RangeError("Node type ids should correspond to array positions when creating a node set");
    }
    /**
    Create a copy of this set with some node properties added. The
    arguments to this method can be created with
    [`NodeProp.add`](#common.NodeProp.add).
    */ extend(...props) {
        let newTypes = [];
        for (let type of this.types){
            let newProps = null;
            for (let source of props){
                let add = source(type);
                if (add) {
                    if (!newProps) newProps = Object.assign({}, type.props);
                    let value = add[1], prop = add[0];
                    if (prop.combine && prop.id in newProps) value = prop.combine(newProps[prop.id], value);
                    newProps[prop.id] = value;
                }
            }
            newTypes.push(newProps ? new NodeType(type.name, newProps, type.id, type.flags) : type);
        }
        return new NodeSet(newTypes);
    }
}
const CachedNode = new WeakMap(), CachedInnerNode = new WeakMap();
/**
Options that control iteration. Can be combined with the `|`
operator to enable multiple ones.
*/ var IterMode;
(function(IterMode) {
    /**
    When enabled, iteration will only visit [`Tree`](#common.Tree)
    objects, not nodes packed into
    [`TreeBuffer`](#common.TreeBuffer)s.
    */ IterMode[IterMode["ExcludeBuffers"] = 1] = "ExcludeBuffers";
    /**
    Enable this to make iteration include anonymous nodes (such as
    the nodes that wrap repeated grammar constructs into a balanced
    tree).
    */ IterMode[IterMode["IncludeAnonymous"] = 2] = "IncludeAnonymous";
    /**
    By default, regular [mounted](#common.NodeProp^mounted) nodes
    replace their base node in iteration. Enable this to ignore them
    instead.
    */ IterMode[IterMode["IgnoreMounts"] = 4] = "IgnoreMounts";
    /**
    This option only applies in
    [`enter`](#common.SyntaxNode.enter)-style methods. It tells the
    library to not enter mounted overlays if one covers the given
    position.
    */ IterMode[IterMode["IgnoreOverlays"] = 8] = "IgnoreOverlays";
})(IterMode || (IterMode = {}));
/**
A piece of syntax tree. There are two ways to approach these
trees: the way they are actually stored in memory, and the
convenient way.

Syntax trees are stored as a tree of `Tree` and `TreeBuffer`
objects. By packing detail information into `TreeBuffer` leaf
nodes, the representation is made a lot more memory-efficient.

However, when you want to actually work with tree nodes, this
representation is very awkward, so most client code will want to
use the [`TreeCursor`](#common.TreeCursor) or
[`SyntaxNode`](#common.SyntaxNode) interface instead, which provides
a view on some part of this data structure, and can be used to
move around to adjacent nodes.
*/ class Tree {
    /**
    Construct a new tree. See also [`Tree.build`](#common.Tree^build).
    */ constructor(/**
    The type of the top node.
    */ type, /**
    This node's child nodes.
    */ children, /**
    The positions (offsets relative to the start of this tree) of
    the children.
    */ positions, /**
    The total length of this tree
    */ length, /**
    Per-node [node props](#common.NodeProp) to associate with this node.
    */ props){
        this.type = type;
        this.children = children;
        this.positions = positions;
        this.length = length;
        /**
        @internal
        */ this.props = null;
        if (props && props.length) {
            this.props = Object.create(null);
            for (let [prop, value] of props)this.props[typeof prop == "number" ? prop : prop.id] = value;
        }
    }
    /**
    @internal
    */ toString() {
        let mounted = MountedTree.get(this);
        if (mounted && !mounted.overlay) return mounted.tree.toString();
        let children = "";
        for (let ch of this.children){
            let str = ch.toString();
            if (str) {
                if (children) children += ",";
                children += str;
            }
        }
        return !this.type.name ? children : (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (children.length ? "(" + children + ")" : "");
    }
    /**
    Get a [tree cursor](#common.TreeCursor) positioned at the top of
    the tree. Mode can be used to [control](#common.IterMode) which
    nodes the cursor visits.
    */ cursor(mode = 0) {
        return new TreeCursor(this.topNode, mode);
    }
    /**
    Get a [tree cursor](#common.TreeCursor) pointing into this tree
    at the given position and side (see
    [`moveTo`](#common.TreeCursor.moveTo).
    */ cursorAt(pos, side = 0, mode = 0) {
        let scope = CachedNode.get(this) || this.topNode;
        let cursor = new TreeCursor(scope);
        cursor.moveTo(pos, side);
        CachedNode.set(this, cursor._tree);
        return cursor;
    }
    /**
    Get a [syntax node](#common.SyntaxNode) object for the top of the
    tree.
    */ get topNode() {
        return new TreeNode(this, 0, 0, null);
    }
    /**
    Get the [syntax node](#common.SyntaxNode) at the given position.
    If `side` is -1, this will move into nodes that end at the
    position. If 1, it'll move into nodes that start at the
    position. With 0, it'll only enter nodes that cover the position
    from both sides.
    
    Note that this will not enter
    [overlays](#common.MountedTree.overlay), and you often want
    [`resolveInner`](#common.Tree.resolveInner) instead.
    */ resolve(pos, side = 0) {
        let node = resolveNode(CachedNode.get(this) || this.topNode, pos, side, false);
        CachedNode.set(this, node);
        return node;
    }
    /**
    Like [`resolve`](#common.Tree.resolve), but will enter
    [overlaid](#common.MountedTree.overlay) nodes, producing a syntax node
    pointing into the innermost overlaid tree at the given position
    (with parent links going through all parent structure, including
    the host trees).
    */ resolveInner(pos, side = 0) {
        let node = resolveNode(CachedInnerNode.get(this) || this.topNode, pos, side, true);
        CachedInnerNode.set(this, node);
        return node;
    }
    /**
    In some situations, it can be useful to iterate through all
    nodes around a position, including those in overlays that don't
    directly cover the position. This method gives you an iterator
    that will produce all nodes, from small to big, around the given
    position.
    */ resolveStack(pos, side = 0) {
        return stackIterator(this, pos, side);
    }
    /**
    Iterate over the tree and its children, calling `enter` for any
    node that touches the `from`/`to` region (if given) before
    running over such a node's children, and `leave` (if given) when
    leaving the node. When `enter` returns `false`, that node will
    not have its children iterated over (or `leave` called).
    */ iterate(spec) {
        let { enter, leave, from = 0, to = this.length } = spec;
        let mode = spec.mode || 0, anon = (mode & IterMode.IncludeAnonymous) > 0;
        for(let c = this.cursor(mode | IterMode.IncludeAnonymous);;){
            let entered = false;
            if (c.from <= to && c.to >= from && (!anon && c.type.isAnonymous || enter(c) !== false)) {
                if (c.firstChild()) continue;
                entered = true;
            }
            for(;;){
                if (entered && leave && (anon || !c.type.isAnonymous)) leave(c);
                if (c.nextSibling()) break;
                if (!c.parent()) return;
                entered = true;
            }
        }
    }
    /**
    Get the value of the given [node prop](#common.NodeProp) for this
    node. Works with both per-node and per-type props.
    */ prop(prop) {
        return !prop.perNode ? this.type.prop(prop) : this.props ? this.props[prop.id] : undefined;
    }
    /**
    Returns the node's [per-node props](#common.NodeProp.perNode) in a
    format that can be passed to the [`Tree`](#common.Tree)
    constructor.
    */ get propValues() {
        let result = [];
        if (this.props) for(let id in this.props)result.push([
            +id,
            this.props[id]
        ]);
        return result;
    }
    /**
    Balance the direct children of this tree, producing a copy of
    which may have children grouped into subtrees with type
    [`NodeType.none`](#common.NodeType^none).
    */ balance(config = {}) {
        return this.children.length <= 8 /* Balance.BranchFactor */  ? this : balanceRange(NodeType.none, this.children, this.positions, 0, this.children.length, 0, this.length, (children, positions, length)=>new Tree(this.type, children, positions, length, this.propValues), config.makeTree || ((children, positions, length)=>new Tree(NodeType.none, children, positions, length)));
    }
    /**
    Build a tree from a postfix-ordered buffer of node information,
    or a cursor over such a buffer.
    */ static build(data) {
        return buildTree(data);
    }
}
/**
The empty tree
*/ Tree.empty = new Tree(NodeType.none, [], [], 0);
class FlatBufferCursor {
    constructor(buffer, index){
        this.buffer = buffer;
        this.index = index;
    }
    get id() {
        return this.buffer[this.index - 4];
    }
    get start() {
        return this.buffer[this.index - 3];
    }
    get end() {
        return this.buffer[this.index - 2];
    }
    get size() {
        return this.buffer[this.index - 1];
    }
    get pos() {
        return this.index;
    }
    next() {
        this.index -= 4;
    }
    fork() {
        return new FlatBufferCursor(this.buffer, this.index);
    }
}
/**
Tree buffers contain (type, start, end, endIndex) quads for each
node. In such a buffer, nodes are stored in prefix order (parents
before children, with the endIndex of the parent indicating which
children belong to it).
*/ class TreeBuffer {
    /**
    Create a tree buffer.
    */ constructor(/**
    The buffer's content.
    */ buffer, /**
    The total length of the group of nodes in the buffer.
    */ length, /**
    The node set used in this buffer.
    */ set){
        this.buffer = buffer;
        this.length = length;
        this.set = set;
    }
    /**
    @internal
    */ get type() {
        return NodeType.none;
    }
    /**
    @internal
    */ toString() {
        let result = [];
        for(let index = 0; index < this.buffer.length;){
            result.push(this.childString(index));
            index = this.buffer[index + 3];
        }
        return result.join(",");
    }
    /**
    @internal
    */ childString(index) {
        let id = this.buffer[index], endIndex = this.buffer[index + 3];
        let type = this.set.types[id], result = type.name;
        if (/\W/.test(result) && !type.isError) result = JSON.stringify(result);
        index += 4;
        if (endIndex == index) return result;
        let children = [];
        while(index < endIndex){
            children.push(this.childString(index));
            index = this.buffer[index + 3];
        }
        return result + "(" + children.join(",") + ")";
    }
    /**
    @internal
    */ findChild(startIndex, endIndex, dir, pos, side) {
        let { buffer } = this, pick = -1;
        for(let i = startIndex; i != endIndex; i = buffer[i + 3]){
            if (checkSide(side, pos, buffer[i + 1], buffer[i + 2])) {
                pick = i;
                if (dir > 0) break;
            }
        }
        return pick;
    }
    /**
    @internal
    */ slice(startI, endI, from) {
        let b = this.buffer;
        let copy = new Uint16Array(endI - startI), len = 0;
        for(let i = startI, j = 0; i < endI;){
            copy[j++] = b[i++];
            copy[j++] = b[i++] - from;
            let to = copy[j++] = b[i++] - from;
            copy[j++] = b[i++] - startI;
            len = Math.max(len, to);
        }
        return new TreeBuffer(copy, len, this.set);
    }
}
function checkSide(side, pos, from, to) {
    switch(side){
        case -2 /* Side.Before */ :
            return from < pos;
        case -1 /* Side.AtOrBefore */ :
            return to >= pos && from < pos;
        case 0 /* Side.Around */ :
            return from < pos && to > pos;
        case 1 /* Side.AtOrAfter */ :
            return from <= pos && to > pos;
        case 2 /* Side.After */ :
            return to > pos;
        case 4 /* Side.DontCare */ :
            return true;
    }
}
function resolveNode(node, pos, side, overlays) {
    var _a;
    // Move up to a node that actually holds the position, if possible
    while(node.from == node.to || (side < 1 ? node.from >= pos : node.from > pos) || (side > -1 ? node.to <= pos : node.to < pos)){
        let parent = !overlays && node instanceof TreeNode && node.index < 0 ? null : node.parent;
        if (!parent) return node;
        node = parent;
    }
    let mode = overlays ? 0 : IterMode.IgnoreOverlays;
    // Must go up out of overlays when those do not overlap with pos
    if (overlays) for(let scan = node, parent = scan.parent; parent; scan = parent, parent = scan.parent){
        if (scan instanceof TreeNode && scan.index < 0 && ((_a = parent.enter(pos, side, mode)) === null || _a === void 0 ? void 0 : _a.from) != scan.from) node = parent;
    }
    for(;;){
        let inner = node.enter(pos, side, mode);
        if (!inner) return node;
        node = inner;
    }
}
class BaseNode {
    cursor(mode = 0) {
        return new TreeCursor(this, mode);
    }
    getChild(type, before = null, after = null) {
        let r = getChildren(this, type, before, after);
        return r.length ? r[0] : null;
    }
    getChildren(type, before = null, after = null) {
        return getChildren(this, type, before, after);
    }
    resolve(pos, side = 0) {
        return resolveNode(this, pos, side, false);
    }
    resolveInner(pos, side = 0) {
        return resolveNode(this, pos, side, true);
    }
    matchContext(context) {
        return matchNodeContext(this.parent, context);
    }
    enterUnfinishedNodesBefore(pos) {
        let scan = this.childBefore(pos), node = this;
        while(scan){
            let last = scan.lastChild;
            if (!last || last.to != scan.to) break;
            if (last.type.isError && last.from == last.to) {
                node = scan;
                scan = last.prevSibling;
            } else {
                scan = last;
            }
        }
        return node;
    }
    get node() {
        return this;
    }
    get next() {
        return this.parent;
    }
}
class TreeNode extends BaseNode {
    constructor(_tree, from, // Index in parent node, set to -1 if the node is not a direct child of _parent.node (overlay)
    index, _parent){
        super();
        this._tree = _tree;
        this.from = from;
        this.index = index;
        this._parent = _parent;
    }
    get type() {
        return this._tree.type;
    }
    get name() {
        return this._tree.type.name;
    }
    get to() {
        return this.from + this._tree.length;
    }
    nextChild(i, dir, pos, side, mode = 0) {
        for(let parent = this;;){
            for(let { children, positions } = parent._tree, e = dir > 0 ? children.length : -1; i != e; i += dir){
                let next = children[i], start = positions[i] + parent.from;
                if (!checkSide(side, pos, start, start + next.length)) continue;
                if (next instanceof TreeBuffer) {
                    if (mode & IterMode.ExcludeBuffers) continue;
                    let index = next.findChild(0, next.buffer.length, dir, pos - start, side);
                    if (index > -1) return new BufferNode(new BufferContext(parent, next, i, start), null, index);
                } else if (mode & IterMode.IncludeAnonymous || !next.type.isAnonymous || hasChild(next)) {
                    let mounted;
                    if (!(mode & IterMode.IgnoreMounts) && (mounted = MountedTree.get(next)) && !mounted.overlay) return new TreeNode(mounted.tree, start, i, parent);
                    let inner = new TreeNode(next, start, i, parent);
                    return mode & IterMode.IncludeAnonymous || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, pos, side);
                }
            }
            if (mode & IterMode.IncludeAnonymous || !parent.type.isAnonymous) return null;
            if (parent.index >= 0) i = parent.index + dir;
            else i = dir < 0 ? -1 : parent._parent._tree.children.length;
            parent = parent._parent;
            if (!parent) return null;
        }
    }
    get firstChild() {
        return this.nextChild(0, 1, 0, 4 /* Side.DontCare */ );
    }
    get lastChild() {
        return this.nextChild(this._tree.children.length - 1, -1, 0, 4 /* Side.DontCare */ );
    }
    childAfter(pos) {
        return this.nextChild(0, 1, pos, 2 /* Side.After */ );
    }
    childBefore(pos) {
        return this.nextChild(this._tree.children.length - 1, -1, pos, -2 /* Side.Before */ );
    }
    enter(pos, side, mode = 0) {
        let mounted;
        if (!(mode & IterMode.IgnoreOverlays) && (mounted = MountedTree.get(this._tree)) && mounted.overlay) {
            let rPos = pos - this.from;
            for (let { from, to } of mounted.overlay){
                if ((side > 0 ? from <= rPos : from < rPos) && (side < 0 ? to >= rPos : to > rPos)) return new TreeNode(mounted.tree, mounted.overlay[0].from + this.from, -1, this);
            }
        }
        return this.nextChild(0, 1, pos, side, mode);
    }
    nextSignificantParent() {
        let val = this;
        while(val.type.isAnonymous && val._parent)val = val._parent;
        return val;
    }
    get parent() {
        return this._parent ? this._parent.nextSignificantParent() : null;
    }
    get nextSibling() {
        return this._parent && this.index >= 0 ? this._parent.nextChild(this.index + 1, 1, 0, 4 /* Side.DontCare */ ) : null;
    }
    get prevSibling() {
        return this._parent && this.index >= 0 ? this._parent.nextChild(this.index - 1, -1, 0, 4 /* Side.DontCare */ ) : null;
    }
    get tree() {
        return this._tree;
    }
    toTree() {
        return this._tree;
    }
    /**
    @internal
    */ toString() {
        return this._tree.toString();
    }
}
function getChildren(node, type, before, after) {
    let cur = node.cursor(), result = [];
    if (!cur.firstChild()) return result;
    if (before != null) for(let found = false; !found;){
        found = cur.type.is(before);
        if (!cur.nextSibling()) return result;
    }
    for(;;){
        if (after != null && cur.type.is(after)) return result;
        if (cur.type.is(type)) result.push(cur.node);
        if (!cur.nextSibling()) return after == null ? result : [];
    }
}
function matchNodeContext(node, context, i = context.length - 1) {
    for(let p = node; i >= 0; p = p.parent){
        if (!p) return false;
        if (!p.type.isAnonymous) {
            if (context[i] && context[i] != p.name) return false;
            i--;
        }
    }
    return true;
}
class BufferContext {
    constructor(parent, buffer, index, start){
        this.parent = parent;
        this.buffer = buffer;
        this.index = index;
        this.start = start;
    }
}
class BufferNode extends BaseNode {
    get name() {
        return this.type.name;
    }
    get from() {
        return this.context.start + this.context.buffer.buffer[this.index + 1];
    }
    get to() {
        return this.context.start + this.context.buffer.buffer[this.index + 2];
    }
    constructor(context, _parent, index){
        super();
        this.context = context;
        this._parent = _parent;
        this.index = index;
        this.type = context.buffer.set.types[context.buffer.buffer[index]];
    }
    child(dir, pos, side) {
        let { buffer } = this.context;
        let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.context.start, side);
        return index < 0 ? null : new BufferNode(this.context, this, index);
    }
    get firstChild() {
        return this.child(1, 0, 4 /* Side.DontCare */ );
    }
    get lastChild() {
        return this.child(-1, 0, 4 /* Side.DontCare */ );
    }
    childAfter(pos) {
        return this.child(1, pos, 2 /* Side.After */ );
    }
    childBefore(pos) {
        return this.child(-1, pos, -2 /* Side.Before */ );
    }
    enter(pos, side, mode = 0) {
        if (mode & IterMode.ExcludeBuffers) return null;
        let { buffer } = this.context;
        let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], side > 0 ? 1 : -1, pos - this.context.start, side);
        return index < 0 ? null : new BufferNode(this.context, this, index);
    }
    get parent() {
        return this._parent || this.context.parent.nextSignificantParent();
    }
    externalSibling(dir) {
        return this._parent ? null : this.context.parent.nextChild(this.context.index + dir, dir, 0, 4 /* Side.DontCare */ );
    }
    get nextSibling() {
        let { buffer } = this.context;
        let after = buffer.buffer[this.index + 3];
        if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length)) return new BufferNode(this.context, this._parent, after);
        return this.externalSibling(1);
    }
    get prevSibling() {
        let { buffer } = this.context;
        let parentStart = this._parent ? this._parent.index + 4 : 0;
        if (this.index == parentStart) return this.externalSibling(-1);
        return new BufferNode(this.context, this._parent, buffer.findChild(parentStart, this.index, -1, 0, 4 /* Side.DontCare */ ));
    }
    get tree() {
        return null;
    }
    toTree() {
        let children = [], positions = [];
        let { buffer } = this.context;
        let startI = this.index + 4, endI = buffer.buffer[this.index + 3];
        if (endI > startI) {
            let from = buffer.buffer[this.index + 1];
            children.push(buffer.slice(startI, endI, from));
            positions.push(0);
        }
        return new Tree(this.type, children, positions, this.to - this.from);
    }
    /**
    @internal
    */ toString() {
        return this.context.buffer.childString(this.index);
    }
}
function iterStack(heads) {
    if (!heads.length) return null;
    let pick = 0, picked = heads[0];
    for(let i = 1; i < heads.length; i++){
        let node = heads[i];
        if (node.from > picked.from || node.to < picked.to) {
            picked = node;
            pick = i;
        }
    }
    let next = picked instanceof TreeNode && picked.index < 0 ? null : picked.parent;
    let newHeads = heads.slice();
    if (next) newHeads[pick] = next;
    else newHeads.splice(pick, 1);
    return new StackIterator(newHeads, picked);
}
class StackIterator {
    constructor(heads, node){
        this.heads = heads;
        this.node = node;
    }
    get next() {
        return iterStack(this.heads);
    }
}
function stackIterator(tree, pos, side) {
    let inner = tree.resolveInner(pos, side), layers = null;
    for(let scan = inner instanceof TreeNode ? inner : inner.context.parent; scan; scan = scan.parent){
        if (scan.index < 0) {
            let parent = scan.parent;
            (layers || (layers = [
                inner
            ])).push(parent.resolve(pos, side));
            scan = parent;
        } else {
            let mount = MountedTree.get(scan.tree);
            // Relevant overlay branching off
            if (mount && mount.overlay && mount.overlay[0].from <= pos && mount.overlay[mount.overlay.length - 1].to >= pos) {
                let root = new TreeNode(mount.tree, mount.overlay[0].from + scan.from, -1, scan);
                (layers || (layers = [
                    inner
                ])).push(resolveNode(root, pos, side, false));
            }
        }
    }
    return layers ? iterStack(layers) : inner;
}
/**
A tree cursor object focuses on a given node in a syntax tree, and
allows you to move to adjacent nodes.
*/ class TreeCursor {
    /**
    Shorthand for `.type.name`.
    */ get name() {
        return this.type.name;
    }
    /**
    @internal
    */ constructor(node, /**
    @internal
    */ mode = 0){
        this.mode = mode;
        /**
        @internal
        */ this.buffer = null;
        this.stack = [];
        /**
        @internal
        */ this.index = 0;
        this.bufferNode = null;
        if (node instanceof TreeNode) {
            this.yieldNode(node);
        } else {
            this._tree = node.context.parent;
            this.buffer = node.context;
            for(let n = node._parent; n; n = n._parent)this.stack.unshift(n.index);
            this.bufferNode = node;
            this.yieldBuf(node.index);
        }
    }
    yieldNode(node) {
        if (!node) return false;
        this._tree = node;
        this.type = node.type;
        this.from = node.from;
        this.to = node.to;
        return true;
    }
    yieldBuf(index, type) {
        this.index = index;
        let { start, buffer } = this.buffer;
        this.type = type || buffer.set.types[buffer.buffer[index]];
        this.from = start + buffer.buffer[index + 1];
        this.to = start + buffer.buffer[index + 2];
        return true;
    }
    /**
    @internal
    */ yield(node) {
        if (!node) return false;
        if (node instanceof TreeNode) {
            this.buffer = null;
            return this.yieldNode(node);
        }
        this.buffer = node.context;
        return this.yieldBuf(node.index, node.type);
    }
    /**
    @internal
    */ toString() {
        return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
    }
    /**
    @internal
    */ enterChild(dir, pos, side) {
        if (!this.buffer) return this.yield(this._tree.nextChild(dir < 0 ? this._tree._tree.children.length - 1 : 0, dir, pos, side, this.mode));
        let { buffer } = this.buffer;
        let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.buffer.start, side);
        if (index < 0) return false;
        this.stack.push(this.index);
        return this.yieldBuf(index);
    }
    /**
    Move the cursor to this node's first child. When this returns
    false, the node has no child, and the cursor has not been moved.
    */ firstChild() {
        return this.enterChild(1, 0, 4 /* Side.DontCare */ );
    }
    /**
    Move the cursor to this node's last child.
    */ lastChild() {
        return this.enterChild(-1, 0, 4 /* Side.DontCare */ );
    }
    /**
    Move the cursor to the first child that ends after `pos`.
    */ childAfter(pos) {
        return this.enterChild(1, pos, 2 /* Side.After */ );
    }
    /**
    Move to the last child that starts before `pos`.
    */ childBefore(pos) {
        return this.enterChild(-1, pos, -2 /* Side.Before */ );
    }
    /**
    Move the cursor to the child around `pos`. If side is -1 the
    child may end at that position, when 1 it may start there. This
    will also enter [overlaid](#common.MountedTree.overlay)
    [mounted](#common.NodeProp^mounted) trees unless `overlays` is
    set to false.
    */ enter(pos, side, mode = this.mode) {
        if (!this.buffer) return this.yield(this._tree.enter(pos, side, mode));
        return mode & IterMode.ExcludeBuffers ? false : this.enterChild(1, pos, side);
    }
    /**
    Move to the node's parent node, if this isn't the top node.
    */ parent() {
        if (!this.buffer) return this.yieldNode(this.mode & IterMode.IncludeAnonymous ? this._tree._parent : this._tree.parent);
        if (this.stack.length) return this.yieldBuf(this.stack.pop());
        let parent = this.mode & IterMode.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
        this.buffer = null;
        return this.yieldNode(parent);
    }
    /**
    @internal
    */ sibling(dir) {
        if (!this.buffer) return !this._tree._parent ? false : this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + dir, dir, 0, 4 /* Side.DontCare */ , this.mode));
        let { buffer } = this.buffer, d = this.stack.length - 1;
        if (dir < 0) {
            let parentStart = d < 0 ? 0 : this.stack[d] + 4;
            if (this.index != parentStart) return this.yieldBuf(buffer.findChild(parentStart, this.index, -1, 0, 4 /* Side.DontCare */ ));
        } else {
            let after = buffer.buffer[this.index + 3];
            if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3])) return this.yieldBuf(after);
        }
        return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, 0, 4 /* Side.DontCare */ , this.mode)) : false;
    }
    /**
    Move to this node's next sibling, if any.
    */ nextSibling() {
        return this.sibling(1);
    }
    /**
    Move to this node's previous sibling, if any.
    */ prevSibling() {
        return this.sibling(-1);
    }
    atLastNode(dir) {
        let index, parent, { buffer } = this;
        if (buffer) {
            if (dir > 0) {
                if (this.index < buffer.buffer.buffer.length) return false;
            } else {
                for(let i = 0; i < this.index; i++)if (buffer.buffer.buffer[i + 3] < this.index) return false;
            }
            ({ index, parent } = buffer);
        } else {
            ({ index, _parent: parent } = this._tree);
        }
        for(; parent; { index, _parent: parent } = parent){
            if (index > -1) for(let i = index + dir, e = dir < 0 ? -1 : parent._tree.children.length; i != e; i += dir){
                let child = parent._tree.children[i];
                if (this.mode & IterMode.IncludeAnonymous || child instanceof TreeBuffer || !child.type.isAnonymous || hasChild(child)) return false;
            }
        }
        return true;
    }
    move(dir, enter) {
        if (enter && this.enterChild(dir, 0, 4 /* Side.DontCare */ )) return true;
        for(;;){
            if (this.sibling(dir)) return true;
            if (this.atLastNode(dir) || !this.parent()) return false;
        }
    }
    /**
    Move to the next node in a
    [pre-order](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order,_NLR)
    traversal, going from a node to its first child or, if the
    current node is empty or `enter` is false, its next sibling or
    the next sibling of the first parent node that has one.
    */ next(enter = true) {
        return this.move(1, enter);
    }
    /**
    Move to the next node in a last-to-first pre-order traversal. A
    node is followed by its last child or, if it has none, its
    previous sibling or the previous sibling of the first parent
    node that has one.
    */ prev(enter = true) {
        return this.move(-1, enter);
    }
    /**
    Move the cursor to the innermost node that covers `pos`. If
    `side` is -1, it will enter nodes that end at `pos`. If it is 1,
    it will enter nodes that start at `pos`.
    */ moveTo(pos, side = 0) {
        // Move up to a node that actually holds the position, if possible
        while(this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos))if (!this.parent()) break;
        // Then scan down into child nodes as far as possible
        while(this.enterChild(1, pos, side)){}
        return this;
    }
    /**
    Get a [syntax node](#common.SyntaxNode) at the cursor's current
    position.
    */ get node() {
        if (!this.buffer) return this._tree;
        let cache = this.bufferNode, result = null, depth = 0;
        if (cache && cache.context == this.buffer) {
            scan: for(let index = this.index, d = this.stack.length; d >= 0;){
                for(let c = cache; c; c = c._parent)if (c.index == index) {
                    if (index == this.index) return c;
                    result = c;
                    depth = d + 1;
                    break scan;
                }
                index = this.stack[--d];
            }
        }
        for(let i = depth; i < this.stack.length; i++)result = new BufferNode(this.buffer, result, this.stack[i]);
        return this.bufferNode = new BufferNode(this.buffer, result, this.index);
    }
    /**
    Get the [tree](#common.Tree) that represents the current node, if
    any. Will return null when the node is in a [tree
    buffer](#common.TreeBuffer).
    */ get tree() {
        return this.buffer ? null : this._tree._tree;
    }
    /**
    Iterate over the current node and all its descendants, calling
    `enter` when entering a node and `leave`, if given, when leaving
    one. When `enter` returns `false`, any children of that node are
    skipped, and `leave` isn't called for it.
    */ iterate(enter, leave) {
        for(let depth = 0;;){
            let mustLeave = false;
            if (this.type.isAnonymous || enter(this) !== false) {
                if (this.firstChild()) {
                    depth++;
                    continue;
                }
                if (!this.type.isAnonymous) mustLeave = true;
            }
            for(;;){
                if (mustLeave && leave) leave(this);
                mustLeave = this.type.isAnonymous;
                if (!depth) return;
                if (this.nextSibling()) break;
                this.parent();
                depth--;
                mustLeave = true;
            }
        }
    }
    /**
    Test whether the current node matches a given context—a sequence
    of direct parent node names. Empty strings in the context array
    are treated as wildcards.
    */ matchContext(context) {
        if (!this.buffer) return matchNodeContext(this.node.parent, context);
        let { buffer } = this.buffer, { types } = buffer.set;
        for(let i = context.length - 1, d = this.stack.length - 1; i >= 0; d--){
            if (d < 0) return matchNodeContext(this._tree, context, i);
            let type = types[buffer.buffer[this.stack[d]]];
            if (!type.isAnonymous) {
                if (context[i] && context[i] != type.name) return false;
                i--;
            }
        }
        return true;
    }
}
function hasChild(tree) {
    return tree.children.some((ch)=>ch instanceof TreeBuffer || !ch.type.isAnonymous || hasChild(ch));
}
function buildTree(data) {
    var _a;
    let { buffer, nodeSet, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length } = data;
    let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
    let types = nodeSet.types;
    let contextHash = 0, lookAhead = 0;
    function takeNode(parentStart, minPos, children, positions, inRepeat, depth) {
        let { id, start, end, size } = cursor;
        let lookAheadAtStart = lookAhead, contextAtStart = contextHash;
        if (size < 0) {
            cursor.next();
            if (size == -1 /* SpecialRecord.Reuse */ ) {
                let node = reused[id];
                children.push(node);
                positions.push(start - parentStart);
                return;
            } else if (size == -3 /* SpecialRecord.ContextChange */ ) {
                contextHash = id;
                return;
            } else if (size == -4 /* SpecialRecord.LookAhead */ ) {
                lookAhead = id;
                return;
            } else {
                throw new RangeError(`Unrecognized record size: ${size}`);
            }
        }
        let type = types[id], node, buffer;
        let startPos = start - parentStart;
        if (end - start <= maxBufferLength && (buffer = findBufferSize(cursor.pos - minPos, inRepeat))) {
            // Small enough for a buffer, and no reused nodes inside
            let data = new Uint16Array(buffer.size - buffer.skip);
            let endPos = cursor.pos - buffer.size, index = data.length;
            while(cursor.pos > endPos)index = copyToBuffer(buffer.start, data, index);
            node = new TreeBuffer(data, end - buffer.start, nodeSet);
            startPos = buffer.start - parentStart;
        } else {
            let endPos = cursor.pos - size;
            cursor.next();
            let localChildren = [], localPositions = [];
            let localInRepeat = id >= minRepeatType ? id : -1;
            let lastGroup = 0, lastEnd = end;
            while(cursor.pos > endPos){
                if (localInRepeat >= 0 && cursor.id == localInRepeat && cursor.size >= 0) {
                    if (cursor.end <= lastEnd - maxBufferLength) {
                        makeRepeatLeaf(localChildren, localPositions, start, lastGroup, cursor.end, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
                        lastGroup = localChildren.length;
                        lastEnd = cursor.end;
                    }
                    cursor.next();
                } else if (depth > 2500 /* CutOff.Depth */ ) {
                    takeFlatNode(start, endPos, localChildren, localPositions);
                } else {
                    takeNode(start, endPos, localChildren, localPositions, localInRepeat, depth + 1);
                }
            }
            if (localInRepeat >= 0 && lastGroup > 0 && lastGroup < localChildren.length) makeRepeatLeaf(localChildren, localPositions, start, lastGroup, start, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
            localChildren.reverse();
            localPositions.reverse();
            if (localInRepeat > -1 && lastGroup > 0) {
                let make = makeBalanced(type, contextAtStart);
                node = balanceRange(type, localChildren, localPositions, 0, localChildren.length, 0, end - start, make, make);
            } else {
                node = makeTree(type, localChildren, localPositions, end - start, lookAheadAtStart - end, contextAtStart);
            }
        }
        children.push(node);
        positions.push(startPos);
    }
    function takeFlatNode(parentStart, minPos, children, positions) {
        let nodes = []; // Temporary, inverted array of leaf nodes found, with absolute positions
        let nodeCount = 0, stopAt = -1;
        while(cursor.pos > minPos){
            let { id, start, end, size } = cursor;
            if (size > 4) {
                cursor.next();
            } else if (stopAt > -1 && start < stopAt) {
                break;
            } else {
                if (stopAt < 0) stopAt = end - maxBufferLength;
                nodes.push(id, start, end);
                nodeCount++;
                cursor.next();
            }
        }
        if (nodeCount) {
            let buffer = new Uint16Array(nodeCount * 4);
            let start = nodes[nodes.length - 2];
            for(let i = nodes.length - 3, j = 0; i >= 0; i -= 3){
                buffer[j++] = nodes[i];
                buffer[j++] = nodes[i + 1] - start;
                buffer[j++] = nodes[i + 2] - start;
                buffer[j++] = j;
            }
            children.push(new TreeBuffer(buffer, nodes[2] - start, nodeSet));
            positions.push(start - parentStart);
        }
    }
    function makeBalanced(type, contextHash) {
        return (children, positions, length)=>{
            let lookAhead = 0, lastI = children.length - 1, last, lookAheadProp;
            if (lastI >= 0 && (last = children[lastI]) instanceof Tree) {
                if (!lastI && last.type == type && last.length == length) return last;
                if (lookAheadProp = last.prop(NodeProp.lookAhead)) lookAhead = positions[lastI] + last.length + lookAheadProp;
            }
            return makeTree(type, children, positions, length, lookAhead, contextHash);
        };
    }
    function makeRepeatLeaf(children, positions, base, i, from, to, type, lookAhead, contextHash) {
        let localChildren = [], localPositions = [];
        while(children.length > i){
            localChildren.push(children.pop());
            localPositions.push(positions.pop() + base - from);
        }
        children.push(makeTree(nodeSet.types[type], localChildren, localPositions, to - from, lookAhead - to, contextHash));
        positions.push(from - base);
    }
    function makeTree(type, children, positions, length, lookAhead, contextHash, props) {
        if (contextHash) {
            let pair = [
                NodeProp.contextHash,
                contextHash
            ];
            props = props ? [
                pair
            ].concat(props) : [
                pair
            ];
        }
        if (lookAhead > 25) {
            let pair = [
                NodeProp.lookAhead,
                lookAhead
            ];
            props = props ? [
                pair
            ].concat(props) : [
                pair
            ];
        }
        return new Tree(type, children, positions, length, props);
    }
    function findBufferSize(maxSize, inRepeat) {
        // Scan through the buffer to find previous siblings that fit
        // together in a TreeBuffer, and don't contain any reused nodes
        // (which can't be stored in a buffer).
        // If `inRepeat` is > -1, ignore node boundaries of that type for
        // nesting, but make sure the end falls either at the start
        // (`maxSize`) or before such a node.
        let fork = cursor.fork();
        let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
        let result = {
            size: 0,
            start: 0,
            skip: 0
        };
        scan: for(let minPos = fork.pos - maxSize; fork.pos > minPos;){
            let nodeSize = fork.size;
            // Pretend nested repeat nodes of the same type don't exist
            if (fork.id == inRepeat && nodeSize >= 0) {
                // Except that we store the current state as a valid return
                // value.
                result.size = size;
                result.start = start;
                result.skip = skip;
                skip += 4;
                size += 4;
                fork.next();
                continue;
            }
            let startPos = fork.pos - nodeSize;
            if (nodeSize < 0 || startPos < minPos || fork.start < minStart) break;
            let localSkipped = fork.id >= minRepeatType ? 4 : 0;
            let nodeStart = fork.start;
            fork.next();
            while(fork.pos > startPos){
                if (fork.size < 0) {
                    if (fork.size == -3 /* SpecialRecord.ContextChange */ ) localSkipped += 4;
                    else break scan;
                } else if (fork.id >= minRepeatType) {
                    localSkipped += 4;
                }
                fork.next();
            }
            start = nodeStart;
            size += nodeSize;
            skip += localSkipped;
        }
        if (inRepeat < 0 || size == maxSize) {
            result.size = size;
            result.start = start;
            result.skip = skip;
        }
        return result.size > 4 ? result : undefined;
    }
    function copyToBuffer(bufferStart, buffer, index) {
        let { id, start, end, size } = cursor;
        cursor.next();
        if (size >= 0 && id < minRepeatType) {
            let startIndex = index;
            if (size > 4) {
                let endPos = cursor.pos - (size - 4);
                while(cursor.pos > endPos)index = copyToBuffer(bufferStart, buffer, index);
            }
            buffer[--index] = startIndex;
            buffer[--index] = end - bufferStart;
            buffer[--index] = start - bufferStart;
            buffer[--index] = id;
        } else if (size == -3 /* SpecialRecord.ContextChange */ ) {
            contextHash = id;
        } else if (size == -4 /* SpecialRecord.LookAhead */ ) {
            lookAhead = id;
        }
        return index;
    }
    let children = [], positions = [];
    while(cursor.pos > 0)takeNode(data.start || 0, data.bufferStart || 0, children, positions, -1, 0);
    let length = (_a = data.length) !== null && _a !== void 0 ? _a : children.length ? positions[0] + children[0].length : 0;
    return new Tree(types[data.topID], children.reverse(), positions.reverse(), length);
}
const nodeSizeCache = new WeakMap;
function nodeSize(balanceType, node) {
    if (!balanceType.isAnonymous || node instanceof TreeBuffer || node.type != balanceType) return 1;
    let size = nodeSizeCache.get(node);
    if (size == null) {
        size = 1;
        for (let child of node.children){
            if (child.type != balanceType || !(child instanceof Tree)) {
                size = 1;
                break;
            }
            size += nodeSize(balanceType, child);
        }
        nodeSizeCache.set(node, size);
    }
    return size;
}
function balanceRange(// The type the balanced tree's inner nodes.
balanceType, // The direct children and their positions
children, positions, // The index range in children/positions to use
from, to, // The start position of the nodes, relative to their parent.
start, // Length of the outer node
length, // Function to build the top node of the balanced tree
mkTop, // Function to build internal nodes for the balanced tree
mkTree) {
    let total = 0;
    for(let i = from; i < to; i++)total += nodeSize(balanceType, children[i]);
    let maxChild = Math.ceil(total * 1.5 / 8 /* Balance.BranchFactor */ );
    let localChildren = [], localPositions = [];
    function divide(children, positions, from, to, offset) {
        for(let i = from; i < to;){
            let groupFrom = i, groupStart = positions[i], groupSize = nodeSize(balanceType, children[i]);
            i++;
            for(; i < to; i++){
                let nextSize = nodeSize(balanceType, children[i]);
                if (groupSize + nextSize >= maxChild) break;
                groupSize += nextSize;
            }
            if (i == groupFrom + 1) {
                if (groupSize > maxChild) {
                    let only = children[groupFrom]; // Only trees can have a size > 1
                    divide(only.children, only.positions, 0, only.children.length, positions[groupFrom] + offset);
                    continue;
                }
                localChildren.push(children[groupFrom]);
            } else {
                let length = positions[i - 1] + children[i - 1].length - groupStart;
                localChildren.push(balanceRange(balanceType, children, positions, groupFrom, i, groupStart, length, null, mkTree));
            }
            localPositions.push(groupStart + offset - start);
        }
    }
    divide(children, positions, from, to, 0);
    return (mkTop || mkTree)(localChildren, localPositions, length);
}
/**
Provides a way to associate values with pieces of trees. As long
as that part of the tree is reused, the associated values can be
retrieved from an updated tree.
*/ class NodeWeakMap {
    constructor(){
        this.map = new WeakMap();
    }
    setBuffer(buffer, index, value) {
        let inner = this.map.get(buffer);
        if (!inner) this.map.set(buffer, inner = new Map);
        inner.set(index, value);
    }
    getBuffer(buffer, index) {
        let inner = this.map.get(buffer);
        return inner && inner.get(index);
    }
    /**
    Set the value for this syntax node.
    */ set(node, value) {
        if (node instanceof BufferNode) this.setBuffer(node.context.buffer, node.index, value);
        else if (node instanceof TreeNode) this.map.set(node.tree, value);
    }
    /**
    Retrieve value for this syntax node, if it exists in the map.
    */ get(node) {
        return node instanceof BufferNode ? this.getBuffer(node.context.buffer, node.index) : node instanceof TreeNode ? this.map.get(node.tree) : undefined;
    }
    /**
    Set the value for the node that a cursor currently points to.
    */ cursorSet(cursor, value) {
        if (cursor.buffer) this.setBuffer(cursor.buffer.buffer, cursor.index, value);
        else this.map.set(cursor.tree, value);
    }
    /**
    Retrieve the value for the node that a cursor currently points
    to.
    */ cursorGet(cursor) {
        return cursor.buffer ? this.getBuffer(cursor.buffer.buffer, cursor.index) : this.map.get(cursor.tree);
    }
}
/**
Tree fragments are used during [incremental
parsing](#common.Parser.startParse) to track parts of old trees
that can be reused in a new parse. An array of fragments is used
to track regions of an old tree whose nodes might be reused in new
parses. Use the static
[`applyChanges`](#common.TreeFragment^applyChanges) method to
update fragments for document changes.
*/ class TreeFragment {
    /**
    Construct a tree fragment. You'll usually want to use
    [`addTree`](#common.TreeFragment^addTree) and
    [`applyChanges`](#common.TreeFragment^applyChanges) instead of
    calling this directly.
    */ constructor(/**
    The start of the unchanged range pointed to by this fragment.
    This refers to an offset in the _updated_ document (as opposed
    to the original tree).
    */ from, /**
    The end of the unchanged range.
    */ to, /**
    The tree that this fragment is based on.
    */ tree, /**
    The offset between the fragment's tree and the document that
    this fragment can be used against. Add this when going from
    document to tree positions, subtract it to go from tree to
    document positions.
    */ offset, openStart = false, openEnd = false){
        this.from = from;
        this.to = to;
        this.tree = tree;
        this.offset = offset;
        this.open = (openStart ? 1 /* Open.Start */  : 0) | (openEnd ? 2 /* Open.End */  : 0);
    }
    /**
    Whether the start of the fragment represents the start of a
    parse, or the end of a change. (In the second case, it may not
    be safe to reuse some nodes at the start, depending on the
    parsing algorithm.)
    */ get openStart() {
        return (this.open & 1 /* Open.Start */ ) > 0;
    }
    /**
    Whether the end of the fragment represents the end of a
    full-document parse, or the start of a change.
    */ get openEnd() {
        return (this.open & 2 /* Open.End */ ) > 0;
    }
    /**
    Create a set of fragments from a freshly parsed tree, or update
    an existing set of fragments by replacing the ones that overlap
    with a tree with content from the new tree. When `partial` is
    true, the parse is treated as incomplete, and the resulting
    fragment has [`openEnd`](#common.TreeFragment.openEnd) set to
    true.
    */ static addTree(tree, fragments = [], partial = false) {
        let result = [
            new TreeFragment(0, tree.length, tree, 0, false, partial)
        ];
        for (let f of fragments)if (f.to > tree.length) result.push(f);
        return result;
    }
    /**
    Apply a set of edits to an array of fragments, removing or
    splitting fragments as necessary to remove edited ranges, and
    adjusting offsets for fragments that moved.
    */ static applyChanges(fragments, changes, minGap = 128) {
        if (!changes.length) return fragments;
        let result = [];
        let fI = 1, nextF = fragments.length ? fragments[0] : null;
        for(let cI = 0, pos = 0, off = 0;; cI++){
            let nextC = cI < changes.length ? changes[cI] : null;
            let nextPos = nextC ? nextC.fromA : 1e9;
            if (nextPos - pos >= minGap) while(nextF && nextF.from < nextPos){
                let cut = nextF;
                if (pos >= cut.from || nextPos <= cut.to || off) {
                    let fFrom = Math.max(cut.from, pos) - off, fTo = Math.min(cut.to, nextPos) - off;
                    cut = fFrom >= fTo ? null : new TreeFragment(fFrom, fTo, cut.tree, cut.offset + off, cI > 0, !!nextC);
                }
                if (cut) result.push(cut);
                if (nextF.to > nextPos) break;
                nextF = fI < fragments.length ? fragments[fI++] : null;
            }
            if (!nextC) break;
            pos = nextC.toA;
            off = nextC.toA - nextC.toB;
        }
        return result;
    }
}
/**
A superclass that parsers should extend.
*/ class Parser {
    /**
    Start a parse, returning a [partial parse](#common.PartialParse)
    object. [`fragments`](#common.TreeFragment) can be passed in to
    make the parse incremental.
    
    By default, the entire input is parsed. You can pass `ranges`,
    which should be a sorted array of non-empty, non-overlapping
    ranges, to parse only those ranges. The tree returned in that
    case will start at `ranges[0].from`.
    */ startParse(input, fragments, ranges) {
        if (typeof input == "string") input = new StringInput(input);
        ranges = !ranges ? [
            new Range(0, input.length)
        ] : ranges.length ? ranges.map((r)=>new Range(r.from, r.to)) : [
            new Range(0, 0)
        ];
        return this.createParse(input, fragments || [], ranges);
    }
    /**
    Run a full parse, returning the resulting tree.
    */ parse(input, fragments, ranges) {
        let parse = this.startParse(input, fragments, ranges);
        for(;;){
            let done = parse.advance();
            if (done) return done;
        }
    }
}
class StringInput {
    constructor(string){
        this.string = string;
    }
    get length() {
        return this.string.length;
    }
    chunk(from) {
        return this.string.slice(from);
    }
    get lineChunks() {
        return false;
    }
    read(from, to) {
        return this.string.slice(from, to);
    }
}
/**
Create a parse wrapper that, after the inner parse completes,
scans its tree for mixed language regions with the `nest`
function, runs the resulting [inner parses](#common.NestedParse),
and then [mounts](#common.NodeProp^mounted) their results onto the
tree.
*/ function parseMixed(nest) {
    return (parse, input, fragments, ranges)=>new MixedParse(parse, nest, input, fragments, ranges);
}
class InnerParse {
    constructor(parser, parse, overlay, target, from){
        this.parser = parser;
        this.parse = parse;
        this.overlay = overlay;
        this.target = target;
        this.from = from;
    }
}
function checkRanges(ranges) {
    if (!ranges.length || ranges.some((r)=>r.from >= r.to)) throw new RangeError("Invalid inner parse ranges given: " + JSON.stringify(ranges));
}
class ActiveOverlay {
    constructor(parser, predicate, mounts, index, start, target, prev){
        this.parser = parser;
        this.predicate = predicate;
        this.mounts = mounts;
        this.index = index;
        this.start = start;
        this.target = target;
        this.prev = prev;
        this.depth = 0;
        this.ranges = [];
    }
}
const stoppedInner = new NodeProp({
    perNode: true
});
class MixedParse {
    constructor(base, nest, input, fragments, ranges){
        this.nest = nest;
        this.input = input;
        this.fragments = fragments;
        this.ranges = ranges;
        this.inner = [];
        this.innerDone = 0;
        this.baseTree = null;
        this.stoppedAt = null;
        this.baseParse = base;
    }
    advance() {
        if (this.baseParse) {
            let done = this.baseParse.advance();
            if (!done) return null;
            this.baseParse = null;
            this.baseTree = done;
            this.startInner();
            if (this.stoppedAt != null) for (let inner of this.inner)inner.parse.stopAt(this.stoppedAt);
        }
        if (this.innerDone == this.inner.length) {
            let result = this.baseTree;
            if (this.stoppedAt != null) result = new Tree(result.type, result.children, result.positions, result.length, result.propValues.concat([
                [
                    stoppedInner,
                    this.stoppedAt
                ]
            ]));
            return result;
        }
        let inner = this.inner[this.innerDone], done = inner.parse.advance();
        if (done) {
            this.innerDone++;
            // This is a somewhat dodgy but super helpful hack where we
            // patch up nodes created by the inner parse (and thus
            // presumably not aliased anywhere else) to hold the information
            // about the inner parse.
            let props = Object.assign(Object.create(null), inner.target.props);
            props[NodeProp.mounted.id] = new MountedTree(done, inner.overlay, inner.parser);
            inner.target.props = props;
        }
        return null;
    }
    get parsedPos() {
        if (this.baseParse) return 0;
        let pos = this.input.length;
        for(let i = this.innerDone; i < this.inner.length; i++){
            if (this.inner[i].from < pos) pos = Math.min(pos, this.inner[i].parse.parsedPos);
        }
        return pos;
    }
    stopAt(pos) {
        this.stoppedAt = pos;
        if (this.baseParse) this.baseParse.stopAt(pos);
        else for(let i = this.innerDone; i < this.inner.length; i++)this.inner[i].parse.stopAt(pos);
    }
    startInner() {
        let fragmentCursor = new FragmentCursor(this.fragments);
        let overlay = null;
        let covered = null;
        let cursor = new TreeCursor(new TreeNode(this.baseTree, this.ranges[0].from, 0, null), IterMode.IncludeAnonymous | IterMode.IgnoreMounts);
        scan: for(let nest, isCovered;;){
            let enter = true, range;
            if (this.stoppedAt != null && cursor.from >= this.stoppedAt) {
                enter = false;
            } else if (fragmentCursor.hasNode(cursor)) {
                if (overlay) {
                    let match = overlay.mounts.find((m)=>m.frag.from <= cursor.from && m.frag.to >= cursor.to && m.mount.overlay);
                    if (match) for (let r of match.mount.overlay){
                        let from = r.from + match.pos, to = r.to + match.pos;
                        if (from >= cursor.from && to <= cursor.to && !overlay.ranges.some((r)=>r.from < to && r.to > from)) overlay.ranges.push({
                            from,
                            to
                        });
                    }
                }
                enter = false;
            } else if (covered && (isCovered = checkCover(covered.ranges, cursor.from, cursor.to))) {
                enter = isCovered != 2 /* Cover.Full */ ;
            } else if (!cursor.type.isAnonymous && (nest = this.nest(cursor, this.input)) && (cursor.from < cursor.to || !nest.overlay)) {
                if (!cursor.tree) {
                    materialize(cursor);
                    // materialize create one more level of nesting
                    // we need to add depth to active overlay for going backwards
                    if (overlay) overlay.depth++;
                    if (covered) covered.depth++;
                }
                let oldMounts = fragmentCursor.findMounts(cursor.from, nest.parser);
                if (typeof nest.overlay == "function") {
                    overlay = new ActiveOverlay(nest.parser, nest.overlay, oldMounts, this.inner.length, cursor.from, cursor.tree, overlay);
                } else {
                    let ranges = punchRanges(this.ranges, nest.overlay || (cursor.from < cursor.to ? [
                        new Range(cursor.from, cursor.to)
                    ] : []));
                    if (ranges.length) checkRanges(ranges);
                    if (ranges.length || !nest.overlay) this.inner.push(new InnerParse(nest.parser, ranges.length ? nest.parser.startParse(this.input, enterFragments(oldMounts, ranges), ranges) : nest.parser.startParse(""), nest.overlay ? nest.overlay.map((r)=>new Range(r.from - cursor.from, r.to - cursor.from)) : null, cursor.tree, ranges.length ? ranges[0].from : cursor.from));
                    if (!nest.overlay) enter = false;
                    else if (ranges.length) covered = {
                        ranges,
                        depth: 0,
                        prev: covered
                    };
                }
            } else if (overlay && (range = overlay.predicate(cursor))) {
                if (range === true) range = new Range(cursor.from, cursor.to);
                if (range.from < range.to) {
                    let last = overlay.ranges.length - 1;
                    if (last >= 0 && overlay.ranges[last].to == range.from) overlay.ranges[last] = {
                        from: overlay.ranges[last].from,
                        to: range.to
                    };
                    else overlay.ranges.push(range);
                }
            }
            if (enter && cursor.firstChild()) {
                if (overlay) overlay.depth++;
                if (covered) covered.depth++;
            } else {
                for(;;){
                    if (cursor.nextSibling()) break;
                    if (!cursor.parent()) break scan;
                    if (overlay && !--overlay.depth) {
                        let ranges = punchRanges(this.ranges, overlay.ranges);
                        if (ranges.length) {
                            checkRanges(ranges);
                            this.inner.splice(overlay.index, 0, new InnerParse(overlay.parser, overlay.parser.startParse(this.input, enterFragments(overlay.mounts, ranges), ranges), overlay.ranges.map((r)=>new Range(r.from - overlay.start, r.to - overlay.start)), overlay.target, ranges[0].from));
                        }
                        overlay = overlay.prev;
                    }
                    if (covered && !--covered.depth) covered = covered.prev;
                }
            }
        }
    }
}
function checkCover(covered, from, to) {
    for (let range of covered){
        if (range.from >= to) break;
        if (range.to > from) return range.from <= from && range.to >= to ? 2 /* Cover.Full */  : 1 /* Cover.Partial */ ;
    }
    return 0 /* Cover.None */ ;
}
// Take a piece of buffer and convert it into a stand-alone
// TreeBuffer.
function sliceBuf(buf, startI, endI, nodes, positions, off) {
    if (startI < endI) {
        let from = buf.buffer[startI + 1];
        nodes.push(buf.slice(startI, endI, from));
        positions.push(from - off);
    }
}
// This function takes a node that's in a buffer, and converts it, and
// its parent buffer nodes, into a Tree. This is again acting on the
// assumption that the trees and buffers have been constructed by the
// parse that was ran via the mix parser, and thus aren't shared with
// any other code, making violations of the immutability safe.
function materialize(cursor) {
    let { node } = cursor, stack = [];
    let buffer = node.context.buffer;
    // Scan up to the nearest tree
    do {
        stack.push(cursor.index);
        cursor.parent();
    }while (!cursor.tree)
    // Find the index of the buffer in that tree
    let base = cursor.tree, i = base.children.indexOf(buffer);
    let buf = base.children[i], b = buf.buffer, newStack = [
        i
    ];
    // Split a level in the buffer, putting the nodes before and after
    // the child that contains `node` into new buffers.
    function split(startI, endI, type, innerOffset, length, stackPos) {
        let targetI = stack[stackPos];
        let children = [], positions = [];
        sliceBuf(buf, startI, targetI, children, positions, innerOffset);
        let from = b[targetI + 1], to = b[targetI + 2];
        newStack.push(children.length);
        let child = stackPos ? split(targetI + 4, b[targetI + 3], buf.set.types[b[targetI]], from, to - from, stackPos - 1) : node.toTree();
        children.push(child);
        positions.push(from - innerOffset);
        sliceBuf(buf, b[targetI + 3], endI, children, positions, innerOffset);
        return new Tree(type, children, positions, length);
    }
    base.children[i] = split(0, b.length, NodeType.none, 0, buf.length, stack.length - 1);
    // Move the cursor back to the target node
    for (let index of newStack){
        let tree = cursor.tree.children[index], pos = cursor.tree.positions[index];
        cursor.yield(new TreeNode(tree, pos + cursor.from, index, cursor._tree));
    }
}
class StructureCursor {
    constructor(root, offset){
        this.offset = offset;
        this.done = false;
        this.cursor = root.cursor(IterMode.IncludeAnonymous | IterMode.IgnoreMounts);
    }
    // Move to the first node (in pre-order) that starts at or after `pos`.
    moveTo(pos) {
        let { cursor } = this, p = pos - this.offset;
        while(!this.done && cursor.from < p){
            if (cursor.to >= pos && cursor.enter(p, 1, IterMode.IgnoreOverlays | IterMode.ExcludeBuffers)) ;
            else if (!cursor.next(false)) this.done = true;
        }
    }
    hasNode(cursor) {
        this.moveTo(cursor.from);
        if (!this.done && this.cursor.from + this.offset == cursor.from && this.cursor.tree) {
            for(let tree = this.cursor.tree;;){
                if (tree == cursor.tree) return true;
                if (tree.children.length && tree.positions[0] == 0 && tree.children[0] instanceof Tree) tree = tree.children[0];
                else break;
            }
        }
        return false;
    }
}
class FragmentCursor {
    constructor(fragments){
        var _a;
        this.fragments = fragments;
        this.curTo = 0;
        this.fragI = 0;
        if (fragments.length) {
            let first = this.curFrag = fragments[0];
            this.curTo = (_a = first.tree.prop(stoppedInner)) !== null && _a !== void 0 ? _a : first.to;
            this.inner = new StructureCursor(first.tree, -first.offset);
        } else {
            this.curFrag = this.inner = null;
        }
    }
    hasNode(node) {
        while(this.curFrag && node.from >= this.curTo)this.nextFrag();
        return this.curFrag && this.curFrag.from <= node.from && this.curTo >= node.to && this.inner.hasNode(node);
    }
    nextFrag() {
        var _a;
        this.fragI++;
        if (this.fragI == this.fragments.length) {
            this.curFrag = this.inner = null;
        } else {
            let frag = this.curFrag = this.fragments[this.fragI];
            this.curTo = (_a = frag.tree.prop(stoppedInner)) !== null && _a !== void 0 ? _a : frag.to;
            this.inner = new StructureCursor(frag.tree, -frag.offset);
        }
    }
    findMounts(pos, parser) {
        var _a;
        let result = [];
        if (this.inner) {
            this.inner.cursor.moveTo(pos, 1);
            for(let pos = this.inner.cursor.node; pos; pos = pos.parent){
                let mount = (_a = pos.tree) === null || _a === void 0 ? void 0 : _a.prop(NodeProp.mounted);
                if (mount && mount.parser == parser) {
                    for(let i = this.fragI; i < this.fragments.length; i++){
                        let frag = this.fragments[i];
                        if (frag.from >= pos.to) break;
                        if (frag.tree == this.curFrag.tree) result.push({
                            frag,
                            pos: pos.from - frag.offset,
                            mount
                        });
                    }
                }
            }
        }
        return result;
    }
}
function punchRanges(outer, ranges) {
    let copy = null, current = ranges;
    for(let i = 1, j = 0; i < outer.length; i++){
        let gapFrom = outer[i - 1].to, gapTo = outer[i].from;
        for(; j < current.length; j++){
            let r = current[j];
            if (r.from >= gapTo) break;
            if (r.to <= gapFrom) continue;
            if (!copy) current = copy = ranges.slice();
            if (r.from < gapFrom) {
                copy[j] = new Range(r.from, gapFrom);
                if (r.to > gapTo) copy.splice(j + 1, 0, new Range(gapTo, r.to));
            } else if (r.to > gapTo) {
                copy[j--] = new Range(gapTo, r.to);
            } else {
                copy.splice(j--, 1);
            }
        }
    }
    return current;
}
function findCoverChanges(a, b, from, to) {
    let iA = 0, iB = 0, inA = false, inB = false, pos = -1e9;
    let result = [];
    for(;;){
        let nextA = iA == a.length ? 1e9 : inA ? a[iA].to : a[iA].from;
        let nextB = iB == b.length ? 1e9 : inB ? b[iB].to : b[iB].from;
        if (inA != inB) {
            let start = Math.max(pos, from), end = Math.min(nextA, nextB, to);
            if (start < end) result.push(new Range(start, end));
        }
        pos = Math.min(nextA, nextB);
        if (pos == 1e9) break;
        if (nextA == pos) {
            if (!inA) inA = true;
            else {
                inA = false;
                iA++;
            }
        }
        if (nextB == pos) {
            if (!inB) inB = true;
            else {
                inB = false;
                iB++;
            }
        }
    }
    return result;
}
// Given a number of fragments for the outer tree, and a set of ranges
// to parse, find fragments for inner trees mounted around those
// ranges, if any.
function enterFragments(mounts, ranges) {
    let result = [];
    for (let { pos, mount, frag } of mounts){
        let startPos = pos + (mount.overlay ? mount.overlay[0].from : 0), endPos = startPos + mount.tree.length;
        let from = Math.max(frag.from, startPos), to = Math.min(frag.to, endPos);
        if (mount.overlay) {
            let overlay = mount.overlay.map((r)=>new Range(r.from + pos, r.to + pos));
            let changes = findCoverChanges(ranges, overlay, from, to);
            for(let i = 0, pos = from;; i++){
                let last = i == changes.length, end = last ? to : changes[i].from;
                if (end > pos) result.push(new TreeFragment(pos, end, mount.tree, -startPos, frag.from >= pos || frag.openStart, frag.to <= end || frag.openEnd));
                if (last) break;
                pos = changes[i].to;
            }
        } else {
            result.push(new TreeFragment(from, to, mount.tree, -startPos, frag.from >= startPos || frag.openStart, frag.to <= endPos || frag.openEnd));
        }
    }
    return result;
}
;
}),
"[project]/pwa/node_modules/@lezer/highlight/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tag",
    ()=>Tag,
    "classHighlighter",
    ()=>classHighlighter,
    "getStyleTags",
    ()=>getStyleTags,
    "highlightCode",
    ()=>highlightCode,
    "highlightTree",
    ()=>highlightTree,
    "styleTags",
    ()=>styleTags,
    "tagHighlighter",
    ()=>tagHighlighter,
    "tags",
    ()=>tags
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/common/dist/index.js [app-client] (ecmascript)");
;
let nextTagID = 0;
/**
Highlighting tags are markers that denote a highlighting category.
They are [associated](#highlight.styleTags) with parts of a syntax
tree by a language mode, and then mapped to an actual CSS style by
a [highlighter](#highlight.Highlighter).

Because syntax tree node types and highlight styles have to be
able to talk the same language, CodeMirror uses a mostly _closed_
[vocabulary](#highlight.tags) of syntax tags (as opposed to
traditional open string-based systems, which make it hard for
highlighting themes to cover all the tokens produced by the
various languages).

It _is_ possible to [define](#highlight.Tag^define) your own
highlighting tags for system-internal use (where you control both
the language package and the highlighter), but such tags will not
be picked up by regular highlighters (though you can derive them
from standard tags to allow highlighters to fall back to those).
*/ class Tag {
    /**
    @internal
    */ constructor(/**
    The optional name of the base tag @internal
    */ name, /**
    The set of this tag and all its parent tags, starting with
    this one itself and sorted in order of decreasing specificity.
    */ set, /**
    The base unmodified tag that this one is based on, if it's
    modified @internal
    */ base, /**
    The modifiers applied to this.base @internal
    */ modified){
        this.name = name;
        this.set = set;
        this.base = base;
        this.modified = modified;
        /**
        @internal
        */ this.id = nextTagID++;
    }
    toString() {
        let { name } = this;
        for (let mod of this.modified)if (mod.name) name = `${mod.name}(${name})`;
        return name;
    }
    static define(nameOrParent, parent) {
        let name = typeof nameOrParent == "string" ? nameOrParent : "?";
        if (nameOrParent instanceof Tag) parent = nameOrParent;
        if (parent === null || parent === void 0 ? void 0 : parent.base) throw new Error("Can not derive from a modified tag");
        let tag = new Tag(name, [], null, []);
        tag.set.push(tag);
        if (parent) for (let t of parent.set)tag.set.push(t);
        return tag;
    }
    /**
    Define a tag _modifier_, which is a function that, given a tag,
    will return a tag that is a subtag of the original. Applying the
    same modifier to a twice tag will return the same value (`m1(t1)
    == m1(t1)`) and applying multiple modifiers will, regardless or
    order, produce the same tag (`m1(m2(t1)) == m2(m1(t1))`).
    
    When multiple modifiers are applied to a given base tag, each
    smaller set of modifiers is registered as a parent, so that for
    example `m1(m2(m3(t1)))` is a subtype of `m1(m2(t1))`,
    `m1(m3(t1)`, and so on.
    */ static defineModifier(name) {
        let mod = new Modifier(name);
        return (tag)=>{
            if (tag.modified.indexOf(mod) > -1) return tag;
            return Modifier.get(tag.base || tag, tag.modified.concat(mod).sort((a, b)=>a.id - b.id));
        };
    }
}
let nextModifierID = 0;
class Modifier {
    constructor(name){
        this.name = name;
        this.instances = [];
        this.id = nextModifierID++;
    }
    static get(base, mods) {
        if (!mods.length) return base;
        let exists = mods[0].instances.find((t)=>t.base == base && sameArray(mods, t.modified));
        if (exists) return exists;
        let set = [], tag = new Tag(base.name, set, base, mods);
        for (let m of mods)m.instances.push(tag);
        let configs = powerSet(mods);
        for (let parent of base.set)if (!parent.modified.length) for (let config of configs)set.push(Modifier.get(parent, config));
        return tag;
    }
}
function sameArray(a, b) {
    return a.length == b.length && a.every((x, i)=>x == b[i]);
}
function powerSet(array) {
    let sets = [
        []
    ];
    for(let i = 0; i < array.length; i++){
        for(let j = 0, e = sets.length; j < e; j++){
            sets.push(sets[j].concat(array[i]));
        }
    }
    return sets.sort((a, b)=>b.length - a.length);
}
/**
This function is used to add a set of tags to a language syntax
via [`NodeSet.extend`](#common.NodeSet.extend) or
[`LRParser.configure`](#lr.LRParser.configure).

The argument object maps node selectors to [highlighting
tags](#highlight.Tag) or arrays of tags.

Node selectors may hold one or more (space-separated) node paths.
Such a path can be a [node name](#common.NodeType.name), or
multiple node names (or `*` wildcards) separated by slash
characters, as in `"Block/Declaration/VariableName"`. Such a path
matches the final node but only if its direct parent nodes are the
other nodes mentioned. A `*` in such a path matches any parent,
but only a single level—wildcards that match multiple parents
aren't supported, both for efficiency reasons and because Lezer
trees make it rather hard to reason about what they would match.)

A path can be ended with `/...` to indicate that the tag assigned
to the node should also apply to all child nodes, even if they
match their own style (by default, only the innermost style is
used).

When a path ends in `!`, as in `Attribute!`, no further matching
happens for the node's child nodes, and the entire node gets the
given style.

In this notation, node names that contain `/`, `!`, `*`, or `...`
must be quoted as JSON strings.

For example:

```javascript
parser.configure({props: [
  styleTags({
    // Style Number and BigNumber nodes
    "Number BigNumber": tags.number,
    // Style Escape nodes whose parent is String
    "String/Escape": tags.escape,
    // Style anything inside Attributes nodes
    "Attributes!": tags.meta,
    // Add a style to all content inside Italic nodes
    "Italic/...": tags.emphasis,
    // Style InvalidString nodes as both `string` and `invalid`
    "InvalidString": [tags.string, tags.invalid],
    // Style the node named "/" as punctuation
    '"/"': tags.punctuation
  })
]})
```
*/ function styleTags(spec) {
    let byName = Object.create(null);
    for(let prop in spec){
        let tags = spec[prop];
        if (!Array.isArray(tags)) tags = [
            tags
        ];
        for (let part of prop.split(" "))if (part) {
            let pieces = [], mode = 2 /* Mode.Normal */ , rest = part;
            for(let pos = 0;;){
                if (rest == "..." && pos > 0 && pos + 3 == part.length) {
                    mode = 1 /* Mode.Inherit */ ;
                    break;
                }
                let m = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(rest);
                if (!m) throw new RangeError("Invalid path: " + part);
                pieces.push(m[0] == "*" ? "" : m[0][0] == '"' ? JSON.parse(m[0]) : m[0]);
                pos += m[0].length;
                if (pos == part.length) break;
                let next = part[pos++];
                if (pos == part.length && next == "!") {
                    mode = 0 /* Mode.Opaque */ ;
                    break;
                }
                if (next != "/") throw new RangeError("Invalid path: " + part);
                rest = part.slice(pos);
            }
            let last = pieces.length - 1, inner = pieces[last];
            if (!inner) throw new RangeError("Invalid path: " + part);
            let rule = new Rule(tags, mode, last > 0 ? pieces.slice(0, last) : null);
            byName[inner] = rule.sort(byName[inner]);
        }
    }
    return ruleNodeProp.add(byName);
}
const ruleNodeProp = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"]({
    combine (a, b) {
        let cur, root, take;
        while(a || b){
            if (!a || b && a.depth >= b.depth) {
                take = b;
                b = b.next;
            } else {
                take = a;
                a = a.next;
            }
            if (cur && cur.mode == take.mode && !take.context && !cur.context) continue;
            let copy = new Rule(take.tags, take.mode, take.context);
            if (cur) cur.next = copy;
            else root = copy;
            cur = copy;
        }
        return root;
    }
});
class Rule {
    constructor(tags, mode, context, next){
        this.tags = tags;
        this.mode = mode;
        this.context = context;
        this.next = next;
    }
    get opaque() {
        return this.mode == 0 /* Mode.Opaque */ ;
    }
    get inherit() {
        return this.mode == 1 /* Mode.Inherit */ ;
    }
    sort(other) {
        if (!other || other.depth < this.depth) {
            this.next = other;
            return this;
        }
        other.next = this.sort(other.next);
        return other;
    }
    get depth() {
        return this.context ? this.context.length : 0;
    }
}
Rule.empty = new Rule([], 2 /* Mode.Normal */ , null);
/**
Define a [highlighter](#highlight.Highlighter) from an array of
tag/class pairs. Classes associated with more specific tags will
take precedence.
*/ function tagHighlighter(tags, options) {
    let map = Object.create(null);
    for (let style of tags){
        if (!Array.isArray(style.tag)) map[style.tag.id] = style.class;
        else for (let tag of style.tag)map[tag.id] = style.class;
    }
    let { scope, all = null } = options || {};
    return {
        style: (tags)=>{
            let cls = all;
            for (let tag of tags){
                for (let sub of tag.set){
                    let tagClass = map[sub.id];
                    if (tagClass) {
                        cls = cls ? cls + " " + tagClass : tagClass;
                        break;
                    }
                }
            }
            return cls;
        },
        scope
    };
}
function highlightTags(highlighters, tags) {
    let result = null;
    for (let highlighter of highlighters){
        let value = highlighter.style(tags);
        if (value) result = result ? result + " " + value : value;
    }
    return result;
}
/**
Highlight the given [tree](#common.Tree) with the given
[highlighter](#highlight.Highlighter). Often, the higher-level
[`highlightCode`](#highlight.highlightCode) function is easier to
use.
*/ function highlightTree(tree, highlighter, /**
Assign styling to a region of the text. Will be called, in order
of position, for any ranges where more than zero classes apply.
`classes` is a space separated string of CSS classes.
*/ putStyle, /**
The start of the range to highlight.
*/ from = 0, /**
The end of the range.
*/ to = tree.length) {
    let builder = new HighlightBuilder(from, Array.isArray(highlighter) ? highlighter : [
        highlighter
    ], putStyle);
    builder.highlightRange(tree.cursor(), from, to, "", builder.highlighters);
    builder.flush(to);
}
/**
Highlight the given tree with the given highlighter, calling
`putText` for every piece of text, either with a set of classes or
with the empty string when unstyled, and `putBreak` for every line
break.
*/ function highlightCode(code, tree, highlighter, putText, putBreak, from = 0, to = code.length) {
    let pos = from;
    function writeTo(p, classes) {
        if (p <= pos) return;
        for(let text = code.slice(pos, p), i = 0;;){
            let nextBreak = text.indexOf("\n", i);
            let upto = nextBreak < 0 ? text.length : nextBreak;
            if (upto > i) putText(text.slice(i, upto), classes);
            if (nextBreak < 0) break;
            putBreak();
            i = nextBreak + 1;
        }
        pos = p;
    }
    highlightTree(tree, highlighter, (from, to, classes)=>{
        writeTo(from, "");
        writeTo(to, classes);
    }, from, to);
    writeTo(to, "");
}
class HighlightBuilder {
    constructor(at, highlighters, span){
        this.at = at;
        this.highlighters = highlighters;
        this.span = span;
        this.class = "";
    }
    startSpan(at, cls) {
        if (cls != this.class) {
            this.flush(at);
            if (at > this.at) this.at = at;
            this.class = cls;
        }
    }
    flush(to) {
        if (to > this.at && this.class) this.span(this.at, to, this.class);
    }
    highlightRange(cursor, from, to, inheritedClass, highlighters) {
        let { type, from: start, to: end } = cursor;
        if (start >= to || end <= from) return;
        if (type.isTop) highlighters = this.highlighters.filter((h)=>!h.scope || h.scope(type));
        let cls = inheritedClass;
        let rule = getStyleTags(cursor) || Rule.empty;
        let tagCls = highlightTags(highlighters, rule.tags);
        if (tagCls) {
            if (cls) cls += " ";
            cls += tagCls;
            if (rule.mode == 1 /* Mode.Inherit */ ) inheritedClass += (inheritedClass ? " " : "") + tagCls;
        }
        this.startSpan(Math.max(from, start), cls);
        if (rule.opaque) return;
        let mounted = cursor.tree && cursor.tree.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].mounted);
        if (mounted && mounted.overlay) {
            let inner = cursor.node.enter(mounted.overlay[0].from + start, 1);
            let innerHighlighters = this.highlighters.filter((h)=>!h.scope || h.scope(mounted.tree.type));
            let hasChild = cursor.firstChild();
            for(let i = 0, pos = start;; i++){
                let next = i < mounted.overlay.length ? mounted.overlay[i] : null;
                let nextPos = next ? next.from + start : end;
                let rangeFrom = Math.max(from, pos), rangeTo = Math.min(to, nextPos);
                if (rangeFrom < rangeTo && hasChild) {
                    while(cursor.from < rangeTo){
                        this.highlightRange(cursor, rangeFrom, rangeTo, inheritedClass, highlighters);
                        this.startSpan(Math.min(rangeTo, cursor.to), cls);
                        if (cursor.to >= nextPos || !cursor.nextSibling()) break;
                    }
                }
                if (!next || nextPos > to) break;
                pos = next.to + start;
                if (pos > from) {
                    this.highlightRange(inner.cursor(), Math.max(from, next.from + start), Math.min(to, pos), "", innerHighlighters);
                    this.startSpan(Math.min(to, pos), cls);
                }
            }
            if (hasChild) cursor.parent();
        } else if (cursor.firstChild()) {
            if (mounted) inheritedClass = "";
            do {
                if (cursor.to <= from) continue;
                if (cursor.from >= to) break;
                this.highlightRange(cursor, from, to, inheritedClass, highlighters);
                this.startSpan(Math.min(to, cursor.to), cls);
            }while (cursor.nextSibling())
            cursor.parent();
        }
    }
}
/**
Match a syntax node's [highlight rules](#highlight.styleTags). If
there's a match, return its set of tags, and whether it is
opaque (uses a `!`) or applies to all child nodes (`/...`).
*/ function getStyleTags(node) {
    let rule = node.type.prop(ruleNodeProp);
    while(rule && rule.context && !node.matchContext(rule.context))rule = rule.next;
    return rule || null;
}
const t = Tag.define;
const comment = t(), name = t(), typeName = t(name), propertyName = t(name), literal = t(), string = t(literal), number = t(literal), content = t(), heading = t(content), keyword = t(), operator = t(), punctuation = t(), bracket = t(punctuation), meta = t();
/**
The default set of highlighting [tags](#highlight.Tag).

This collection is heavily biased towards programming languages,
and necessarily incomplete. A full ontology of syntactic
constructs would fill a stack of books, and be impractical to
write themes for. So try to make do with this set. If all else
fails, [open an
issue](https://github.com/codemirror/codemirror.next) to propose a
new tag, or [define](#highlight.Tag^define) a local custom tag for
your use case.

Note that it is not obligatory to always attach the most specific
tag possible to an element—if your grammar can't easily
distinguish a certain type of element (such as a local variable),
it is okay to style it as its more general variant (a variable).

For tags that extend some parent tag, the documentation links to
the parent.
*/ const tags = {
    /**
    A comment.
    */ comment,
    /**
    A line [comment](#highlight.tags.comment).
    */ lineComment: t(comment),
    /**
    A block [comment](#highlight.tags.comment).
    */ blockComment: t(comment),
    /**
    A documentation [comment](#highlight.tags.comment).
    */ docComment: t(comment),
    /**
    Any kind of identifier.
    */ name,
    /**
    The [name](#highlight.tags.name) of a variable.
    */ variableName: t(name),
    /**
    A type [name](#highlight.tags.name).
    */ typeName: typeName,
    /**
    A tag name (subtag of [`typeName`](#highlight.tags.typeName)).
    */ tagName: t(typeName),
    /**
    A property or field [name](#highlight.tags.name).
    */ propertyName: propertyName,
    /**
    An attribute name (subtag of [`propertyName`](#highlight.tags.propertyName)).
    */ attributeName: t(propertyName),
    /**
    The [name](#highlight.tags.name) of a class.
    */ className: t(name),
    /**
    A label [name](#highlight.tags.name).
    */ labelName: t(name),
    /**
    A namespace [name](#highlight.tags.name).
    */ namespace: t(name),
    /**
    The [name](#highlight.tags.name) of a macro.
    */ macroName: t(name),
    /**
    A literal value.
    */ literal,
    /**
    A string [literal](#highlight.tags.literal).
    */ string,
    /**
    A documentation [string](#highlight.tags.string).
    */ docString: t(string),
    /**
    A character literal (subtag of [string](#highlight.tags.string)).
    */ character: t(string),
    /**
    An attribute value (subtag of [string](#highlight.tags.string)).
    */ attributeValue: t(string),
    /**
    A number [literal](#highlight.tags.literal).
    */ number,
    /**
    An integer [number](#highlight.tags.number) literal.
    */ integer: t(number),
    /**
    A floating-point [number](#highlight.tags.number) literal.
    */ float: t(number),
    /**
    A boolean [literal](#highlight.tags.literal).
    */ bool: t(literal),
    /**
    Regular expression [literal](#highlight.tags.literal).
    */ regexp: t(literal),
    /**
    An escape [literal](#highlight.tags.literal), for example a
    backslash escape in a string.
    */ escape: t(literal),
    /**
    A color [literal](#highlight.tags.literal).
    */ color: t(literal),
    /**
    A URL [literal](#highlight.tags.literal).
    */ url: t(literal),
    /**
    A language keyword.
    */ keyword,
    /**
    The [keyword](#highlight.tags.keyword) for the self or this
    object.
    */ self: t(keyword),
    /**
    The [keyword](#highlight.tags.keyword) for null.
    */ null: t(keyword),
    /**
    A [keyword](#highlight.tags.keyword) denoting some atomic value.
    */ atom: t(keyword),
    /**
    A [keyword](#highlight.tags.keyword) that represents a unit.
    */ unit: t(keyword),
    /**
    A modifier [keyword](#highlight.tags.keyword).
    */ modifier: t(keyword),
    /**
    A [keyword](#highlight.tags.keyword) that acts as an operator.
    */ operatorKeyword: t(keyword),
    /**
    A control-flow related [keyword](#highlight.tags.keyword).
    */ controlKeyword: t(keyword),
    /**
    A [keyword](#highlight.tags.keyword) that defines something.
    */ definitionKeyword: t(keyword),
    /**
    A [keyword](#highlight.tags.keyword) related to defining or
    interfacing with modules.
    */ moduleKeyword: t(keyword),
    /**
    An operator.
    */ operator,
    /**
    An [operator](#highlight.tags.operator) that dereferences something.
    */ derefOperator: t(operator),
    /**
    Arithmetic-related [operator](#highlight.tags.operator).
    */ arithmeticOperator: t(operator),
    /**
    Logical [operator](#highlight.tags.operator).
    */ logicOperator: t(operator),
    /**
    Bit [operator](#highlight.tags.operator).
    */ bitwiseOperator: t(operator),
    /**
    Comparison [operator](#highlight.tags.operator).
    */ compareOperator: t(operator),
    /**
    [Operator](#highlight.tags.operator) that updates its operand.
    */ updateOperator: t(operator),
    /**
    [Operator](#highlight.tags.operator) that defines something.
    */ definitionOperator: t(operator),
    /**
    Type-related [operator](#highlight.tags.operator).
    */ typeOperator: t(operator),
    /**
    Control-flow [operator](#highlight.tags.operator).
    */ controlOperator: t(operator),
    /**
    Program or markup punctuation.
    */ punctuation,
    /**
    [Punctuation](#highlight.tags.punctuation) that separates
    things.
    */ separator: t(punctuation),
    /**
    Bracket-style [punctuation](#highlight.tags.punctuation).
    */ bracket,
    /**
    Angle [brackets](#highlight.tags.bracket) (usually `<` and `>`
    tokens).
    */ angleBracket: t(bracket),
    /**
    Square [brackets](#highlight.tags.bracket) (usually `[` and `]`
    tokens).
    */ squareBracket: t(bracket),
    /**
    Parentheses (usually `(` and `)` tokens). Subtag of
    [bracket](#highlight.tags.bracket).
    */ paren: t(bracket),
    /**
    Braces (usually `{` and `}` tokens). Subtag of
    [bracket](#highlight.tags.bracket).
    */ brace: t(bracket),
    /**
    Content, for example plain text in XML or markup documents.
    */ content,
    /**
    [Content](#highlight.tags.content) that represents a heading.
    */ heading,
    /**
    A level 1 [heading](#highlight.tags.heading).
    */ heading1: t(heading),
    /**
    A level 2 [heading](#highlight.tags.heading).
    */ heading2: t(heading),
    /**
    A level 3 [heading](#highlight.tags.heading).
    */ heading3: t(heading),
    /**
    A level 4 [heading](#highlight.tags.heading).
    */ heading4: t(heading),
    /**
    A level 5 [heading](#highlight.tags.heading).
    */ heading5: t(heading),
    /**
    A level 6 [heading](#highlight.tags.heading).
    */ heading6: t(heading),
    /**
    A prose [content](#highlight.tags.content) separator (such as a horizontal rule).
    */ contentSeparator: t(content),
    /**
    [Content](#highlight.tags.content) that represents a list.
    */ list: t(content),
    /**
    [Content](#highlight.tags.content) that represents a quote.
    */ quote: t(content),
    /**
    [Content](#highlight.tags.content) that is emphasized.
    */ emphasis: t(content),
    /**
    [Content](#highlight.tags.content) that is styled strong.
    */ strong: t(content),
    /**
    [Content](#highlight.tags.content) that is part of a link.
    */ link: t(content),
    /**
    [Content](#highlight.tags.content) that is styled as code or
    monospace.
    */ monospace: t(content),
    /**
    [Content](#highlight.tags.content) that has a strike-through
    style.
    */ strikethrough: t(content),
    /**
    Inserted text in a change-tracking format.
    */ inserted: t(),
    /**
    Deleted text.
    */ deleted: t(),
    /**
    Changed text.
    */ changed: t(),
    /**
    An invalid or unsyntactic element.
    */ invalid: t(),
    /**
    Metadata or meta-instruction.
    */ meta,
    /**
    [Metadata](#highlight.tags.meta) that applies to the entire
    document.
    */ documentMeta: t(meta),
    /**
    [Metadata](#highlight.tags.meta) that annotates or adds
    attributes to a given syntactic element.
    */ annotation: t(meta),
    /**
    Processing instruction or preprocessor directive. Subtag of
    [meta](#highlight.tags.meta).
    */ processingInstruction: t(meta),
    /**
    [Modifier](#highlight.Tag^defineModifier) that indicates that a
    given element is being defined. Expected to be used with the
    various [name](#highlight.tags.name) tags.
    */ definition: Tag.defineModifier("definition"),
    /**
    [Modifier](#highlight.Tag^defineModifier) that indicates that
    something is constant. Mostly expected to be used with
    [variable names](#highlight.tags.variableName).
    */ constant: Tag.defineModifier("constant"),
    /**
    [Modifier](#highlight.Tag^defineModifier) used to indicate that
    a [variable](#highlight.tags.variableName) or [property
    name](#highlight.tags.propertyName) is being called or defined
    as a function.
    */ function: Tag.defineModifier("function"),
    /**
    [Modifier](#highlight.Tag^defineModifier) that can be applied to
    [names](#highlight.tags.name) to indicate that they belong to
    the language's standard environment.
    */ standard: Tag.defineModifier("standard"),
    /**
    [Modifier](#highlight.Tag^defineModifier) that indicates a given
    [names](#highlight.tags.name) is local to some scope.
    */ local: Tag.defineModifier("local"),
    /**
    A generic variant [modifier](#highlight.Tag^defineModifier) that
    can be used to tag language-specific alternative variants of
    some common tag. It is recommended for themes to define special
    forms of at least the [string](#highlight.tags.string) and
    [variable name](#highlight.tags.variableName) tags, since those
    come up a lot.
    */ special: Tag.defineModifier("special")
};
for(let name in tags){
    let val = tags[name];
    if (val instanceof Tag) val.name = name;
}
/**
This is a highlighter that adds stable, predictable classes to
tokens, for styling with external CSS.

The following tags are mapped to their name prefixed with `"tok-"`
(for example `"tok-comment"`):

* [`link`](#highlight.tags.link)
* [`heading`](#highlight.tags.heading)
* [`emphasis`](#highlight.tags.emphasis)
* [`strong`](#highlight.tags.strong)
* [`keyword`](#highlight.tags.keyword)
* [`atom`](#highlight.tags.atom)
* [`bool`](#highlight.tags.bool)
* [`url`](#highlight.tags.url)
* [`labelName`](#highlight.tags.labelName)
* [`inserted`](#highlight.tags.inserted)
* [`deleted`](#highlight.tags.deleted)
* [`literal`](#highlight.tags.literal)
* [`string`](#highlight.tags.string)
* [`number`](#highlight.tags.number)
* [`variableName`](#highlight.tags.variableName)
* [`typeName`](#highlight.tags.typeName)
* [`namespace`](#highlight.tags.namespace)
* [`className`](#highlight.tags.className)
* [`macroName`](#highlight.tags.macroName)
* [`propertyName`](#highlight.tags.propertyName)
* [`operator`](#highlight.tags.operator)
* [`comment`](#highlight.tags.comment)
* [`meta`](#highlight.tags.meta)
* [`punctuation`](#highlight.tags.punctuation)
* [`invalid`](#highlight.tags.invalid)

In addition, these mappings are provided:

* [`regexp`](#highlight.tags.regexp),
  [`escape`](#highlight.tags.escape), and
  [`special`](#highlight.tags.special)[`(string)`](#highlight.tags.string)
  are mapped to `"tok-string2"`
* [`special`](#highlight.tags.special)[`(variableName)`](#highlight.tags.variableName)
  to `"tok-variableName2"`
* [`local`](#highlight.tags.local)[`(variableName)`](#highlight.tags.variableName)
  to `"tok-variableName tok-local"`
* [`definition`](#highlight.tags.definition)[`(variableName)`](#highlight.tags.variableName)
  to `"tok-variableName tok-definition"`
* [`definition`](#highlight.tags.definition)[`(propertyName)`](#highlight.tags.propertyName)
  to `"tok-propertyName tok-definition"`
*/ const classHighlighter = tagHighlighter([
    {
        tag: tags.link,
        class: "tok-link"
    },
    {
        tag: tags.heading,
        class: "tok-heading"
    },
    {
        tag: tags.emphasis,
        class: "tok-emphasis"
    },
    {
        tag: tags.strong,
        class: "tok-strong"
    },
    {
        tag: tags.keyword,
        class: "tok-keyword"
    },
    {
        tag: tags.atom,
        class: "tok-atom"
    },
    {
        tag: tags.bool,
        class: "tok-bool"
    },
    {
        tag: tags.url,
        class: "tok-url"
    },
    {
        tag: tags.labelName,
        class: "tok-labelName"
    },
    {
        tag: tags.inserted,
        class: "tok-inserted"
    },
    {
        tag: tags.deleted,
        class: "tok-deleted"
    },
    {
        tag: tags.literal,
        class: "tok-literal"
    },
    {
        tag: tags.string,
        class: "tok-string"
    },
    {
        tag: tags.number,
        class: "tok-number"
    },
    {
        tag: [
            tags.regexp,
            tags.escape,
            tags.special(tags.string)
        ],
        class: "tok-string2"
    },
    {
        tag: tags.variableName,
        class: "tok-variableName"
    },
    {
        tag: tags.local(tags.variableName),
        class: "tok-variableName tok-local"
    },
    {
        tag: tags.definition(tags.variableName),
        class: "tok-variableName tok-definition"
    },
    {
        tag: tags.special(tags.variableName),
        class: "tok-variableName2"
    },
    {
        tag: tags.definition(tags.propertyName),
        class: "tok-propertyName tok-definition"
    },
    {
        tag: tags.typeName,
        class: "tok-typeName"
    },
    {
        tag: tags.namespace,
        class: "tok-namespace"
    },
    {
        tag: tags.className,
        class: "tok-className"
    },
    {
        tag: tags.macroName,
        class: "tok-macroName"
    },
    {
        tag: tags.propertyName,
        class: "tok-propertyName"
    },
    {
        tag: tags.operator,
        class: "tok-operator"
    },
    {
        tag: tags.comment,
        class: "tok-comment"
    },
    {
        tag: tags.meta,
        class: "tok-meta"
    },
    {
        tag: tags.invalid,
        class: "tok-invalid"
    },
    {
        tag: tags.punctuation,
        class: "tok-punctuation"
    }
]);
;
}),
"[project]/pwa/node_modules/@lezer/lr/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ContextTracker",
    ()=>ContextTracker,
    "ExternalTokenizer",
    ()=>ExternalTokenizer,
    "InputStream",
    ()=>InputStream,
    "LRParser",
    ()=>LRParser,
    "LocalTokenGroup",
    ()=>LocalTokenGroup,
    "Stack",
    ()=>Stack
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/pwa/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/@lezer/common/dist/index.js [app-client] (ecmascript)");
;
/**
A parse stack. These are used internally by the parser to track
parsing progress. They also provide some properties and methods
that external code such as a tokenizer can use to get information
about the parse state.
*/ class Stack {
    /**
    @internal
    */ constructor(/**
    The parse that this stack is part of @internal
    */ p, /**
    Holds state, input pos, buffer index triplets for all but the
    top state @internal
    */ stack, /**
    The current parse state @internal
    */ state, // The position at which the next reduce should take place. This
    // can be less than `this.pos` when skipped expressions have been
    // added to the stack (which should be moved outside of the next
    // reduction)
    /**
    @internal
    */ reducePos, /**
    The input position up to which this stack has parsed.
    */ pos, /**
    The dynamic score of the stack, including dynamic precedence
    and error-recovery penalties
    @internal
    */ score, // The output buffer. Holds (type, start, end, size) quads
    // representing nodes created by the parser, where `size` is
    // amount of buffer array entries covered by this node.
    /**
    @internal
    */ buffer, // The base offset of the buffer. When stacks are split, the split
    // instance shared the buffer history with its parent up to
    // `bufferBase`, which is the absolute offset (including the
    // offset of previous splits) into the buffer at which this stack
    // starts writing.
    /**
    @internal
    */ bufferBase, /**
    @internal
    */ curContext, /**
    @internal
    */ lookAhead = 0, // A parent stack from which this was split off, if any. This is
    // set up so that it always points to a stack that has some
    // additional buffer content, never to a stack with an equal
    // `bufferBase`.
    /**
    @internal
    */ parent){
        this.p = p;
        this.stack = stack;
        this.state = state;
        this.reducePos = reducePos;
        this.pos = pos;
        this.score = score;
        this.buffer = buffer;
        this.bufferBase = bufferBase;
        this.curContext = curContext;
        this.lookAhead = lookAhead;
        this.parent = parent;
    }
    /**
    @internal
    */ toString() {
        return `[${this.stack.filter((_, i)=>i % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
    }
    // Start an empty stack
    /**
    @internal
    */ static start(p, state, pos = 0) {
        let cx = p.parser.context;
        return new Stack(p, [], state, pos, pos, 0, [], 0, cx ? new StackContext(cx, cx.start) : null, 0, null);
    }
    /**
    The stack's current [context](#lr.ContextTracker) value, if
    any. Its type will depend on the context tracker's type
    parameter, or it will be `null` if there is no context
    tracker.
    */ get context() {
        return this.curContext ? this.curContext.context : null;
    }
    // Push a state onto the stack, tracking its start position as well
    // as the buffer base at that point.
    /**
    @internal
    */ pushState(state, start) {
        this.stack.push(this.state, start, this.bufferBase + this.buffer.length);
        this.state = state;
    }
    // Apply a reduce action
    /**
    @internal
    */ reduce(action) {
        var _a;
        let depth = action >> 19 /* Action.ReduceDepthShift */ , type = action & 65535 /* Action.ValueMask */ ;
        let { parser } = this.p;
        let lookaheadRecord = this.reducePos < this.pos - 25 /* Lookahead.Margin */ ;
        if (lookaheadRecord) this.setLookAhead(this.pos);
        let dPrec = parser.dynamicPrecedence(type);
        if (dPrec) this.score += dPrec;
        if (depth == 0) {
            this.pushState(parser.getGoto(this.state, type, true), this.reducePos);
            // Zero-depth reductions are a special case—they add stuff to
            // the stack without popping anything off.
            if (type < parser.minRepeatTerm) this.storeNode(type, this.reducePos, this.reducePos, lookaheadRecord ? 8 : 4, true);
            this.reduceContext(type, this.reducePos);
            return;
        }
        // Find the base index into `this.stack`, content after which will
        // be dropped. Note that with `StayFlag` reductions we need to
        // consume two extra frames (the dummy parent node for the skipped
        // expression and the state that we'll be staying in, which should
        // be moved to `this.state`).
        let base = this.stack.length - (depth - 1) * 3 - (action & 262144 /* Action.StayFlag */  ? 6 : 0);
        let start = base ? this.stack[base - 2] : this.p.ranges[0].from, size = this.reducePos - start;
        // This is a kludge to try and detect overly deep left-associative
        // trees, which will not increase the parse stack depth and thus
        // won't be caught by the regular stack-depth limit check.
        if (size >= 2000 /* Recover.MinBigReduction */  && !((_a = this.p.parser.nodeSet.types[type]) === null || _a === void 0 ? void 0 : _a.isAnonymous)) {
            if (start == this.p.lastBigReductionStart) {
                this.p.bigReductionCount++;
                this.p.lastBigReductionSize = size;
            } else if (this.p.lastBigReductionSize < size) {
                this.p.bigReductionCount = 1;
                this.p.lastBigReductionStart = start;
                this.p.lastBigReductionSize = size;
            }
        }
        let bufferBase = base ? this.stack[base - 1] : 0, count = this.bufferBase + this.buffer.length - bufferBase;
        // Store normal terms or `R -> R R` repeat reductions
        if (type < parser.minRepeatTerm || action & 131072 /* Action.RepeatFlag */ ) {
            let pos = parser.stateFlag(this.state, 1 /* StateFlag.Skipped */ ) ? this.pos : this.reducePos;
            this.storeNode(type, start, pos, count + 4, true);
        }
        if (action & 262144 /* Action.StayFlag */ ) {
            this.state = this.stack[base];
        } else {
            let baseStateID = this.stack[base - 3];
            this.state = parser.getGoto(baseStateID, type, true);
        }
        while(this.stack.length > base)this.stack.pop();
        this.reduceContext(type, start);
    }
    // Shift a value into the buffer
    /**
    @internal
    */ storeNode(term, start, end, size = 4, mustSink = false) {
        if (term == 0 /* Term.Err */  && (!this.stack.length || this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)) {
            // Try to omit/merge adjacent error nodes
            let cur = this, top = this.buffer.length;
            if (top == 0 && cur.parent) {
                top = cur.bufferBase - cur.parent.bufferBase;
                cur = cur.parent;
            }
            if (top > 0 && cur.buffer[top - 4] == 0 /* Term.Err */  && cur.buffer[top - 1] > -1) {
                if (start == end) return;
                if (cur.buffer[top - 2] >= start) {
                    cur.buffer[top - 2] = end;
                    return;
                }
            }
        }
        if (!mustSink || this.pos == end) {
            this.buffer.push(term, start, end, size);
        } else {
            let index = this.buffer.length;
            if (index > 0 && (this.buffer[index - 4] != 0 /* Term.Err */  || this.buffer[index - 1] < 0)) {
                let mustMove = false;
                for(let scan = index; scan > 0 && this.buffer[scan - 2] > end; scan -= 4){
                    if (this.buffer[scan - 1] >= 0) {
                        mustMove = true;
                        break;
                    }
                }
                if (mustMove) while(index > 0 && this.buffer[index - 2] > end){
                    // Move this record forward
                    this.buffer[index] = this.buffer[index - 4];
                    this.buffer[index + 1] = this.buffer[index - 3];
                    this.buffer[index + 2] = this.buffer[index - 2];
                    this.buffer[index + 3] = this.buffer[index - 1];
                    index -= 4;
                    if (size > 4) size -= 4;
                }
            }
            this.buffer[index] = term;
            this.buffer[index + 1] = start;
            this.buffer[index + 2] = end;
            this.buffer[index + 3] = size;
        }
    }
    // Apply a shift action
    /**
    @internal
    */ shift(action, type, start, end) {
        if (action & 131072 /* Action.GotoFlag */ ) {
            this.pushState(action & 65535 /* Action.ValueMask */ , this.pos);
        } else if ((action & 262144 /* Action.StayFlag */ ) == 0) {
            let nextState = action, { parser } = this.p;
            if (end > this.pos || type <= parser.maxNode) {
                this.pos = end;
                if (!parser.stateFlag(nextState, 1 /* StateFlag.Skipped */ )) this.reducePos = end;
            }
            this.pushState(nextState, start);
            this.shiftContext(type, start);
            if (type <= parser.maxNode) this.buffer.push(type, start, end, 4);
        } else {
            this.pos = end;
            this.shiftContext(type, start);
            if (type <= this.p.parser.maxNode) this.buffer.push(type, start, end, 4);
        }
    }
    // Apply an action
    /**
    @internal
    */ apply(action, next, nextStart, nextEnd) {
        if (action & 65536 /* Action.ReduceFlag */ ) this.reduce(action);
        else this.shift(action, next, nextStart, nextEnd);
    }
    // Add a prebuilt (reused) node into the buffer.
    /**
    @internal
    */ useNode(value, next) {
        let index = this.p.reused.length - 1;
        if (index < 0 || this.p.reused[index] != value) {
            this.p.reused.push(value);
            index++;
        }
        let start = this.pos;
        this.reducePos = this.pos = start + value.length;
        this.pushState(next, start);
        this.buffer.push(index, start, this.reducePos, -1 /* size == -1 means this is a reused value */ );
        if (this.curContext) this.updateContext(this.curContext.tracker.reuse(this.curContext.context, value, this, this.p.stream.reset(this.pos - value.length)));
    }
    // Split the stack. Due to the buffer sharing and the fact
    // that `this.stack` tends to stay quite shallow, this isn't very
    // expensive.
    /**
    @internal
    */ split() {
        let parent = this;
        let off = parent.buffer.length;
        // Because the top of the buffer (after this.pos) may be mutated
        // to reorder reductions and skipped tokens, and shared buffers
        // should be immutable, this copies any outstanding skipped tokens
        // to the new buffer, and puts the base pointer before them.
        while(off > 0 && parent.buffer[off - 2] > parent.reducePos)off -= 4;
        let buffer = parent.buffer.slice(off), base = parent.bufferBase + off;
        // Make sure parent points to an actual parent with content, if there is such a parent.
        while(parent && base == parent.bufferBase)parent = parent.parent;
        return new Stack(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, buffer, base, this.curContext, this.lookAhead, parent);
    }
    // Try to recover from an error by 'deleting' (ignoring) one token.
    /**
    @internal
    */ recoverByDelete(next, nextEnd) {
        let isNode = next <= this.p.parser.maxNode;
        if (isNode) this.storeNode(next, this.pos, nextEnd, 4);
        this.storeNode(0 /* Term.Err */ , this.pos, nextEnd, isNode ? 8 : 4);
        this.pos = this.reducePos = nextEnd;
        this.score -= 190 /* Recover.Delete */ ;
    }
    /**
    Check if the given term would be able to be shifted (optionally
    after some reductions) on this stack. This can be useful for
    external tokenizers that want to make sure they only provide a
    given token when it applies.
    */ canShift(term) {
        for(let sim = new SimulatedStack(this);;){
            let action = this.p.parser.stateSlot(sim.state, 4 /* ParseState.DefaultReduce */ ) || this.p.parser.hasAction(sim.state, term);
            if (action == 0) return false;
            if ((action & 65536 /* Action.ReduceFlag */ ) == 0) return true;
            sim.reduce(action);
        }
    }
    // Apply up to Recover.MaxNext recovery actions that conceptually
    // inserts some missing token or rule.
    /**
    @internal
    */ recoverByInsert(next) {
        if (this.stack.length >= 300 /* Recover.MaxInsertStackDepth */ ) return [];
        let nextStates = this.p.parser.nextStates(this.state);
        if (nextStates.length > 4 /* Recover.MaxNext */  << 1 || this.stack.length >= 120 /* Recover.DampenInsertStackDepth */ ) {
            let best = [];
            for(let i = 0, s; i < nextStates.length; i += 2){
                if ((s = nextStates[i + 1]) != this.state && this.p.parser.hasAction(s, next)) best.push(nextStates[i], s);
            }
            if (this.stack.length < 120 /* Recover.DampenInsertStackDepth */ ) for(let i = 0; best.length < 4 /* Recover.MaxNext */  << 1 && i < nextStates.length; i += 2){
                let s = nextStates[i + 1];
                if (!best.some((v, i)=>i & 1 && v == s)) best.push(nextStates[i], s);
            }
            nextStates = best;
        }
        let result = [];
        for(let i = 0; i < nextStates.length && result.length < 4 /* Recover.MaxNext */ ; i += 2){
            let s = nextStates[i + 1];
            if (s == this.state) continue;
            let stack = this.split();
            stack.pushState(s, this.pos);
            stack.storeNode(0 /* Term.Err */ , stack.pos, stack.pos, 4, true);
            stack.shiftContext(nextStates[i], this.pos);
            stack.reducePos = this.pos;
            stack.score -= 200 /* Recover.Insert */ ;
            result.push(stack);
        }
        return result;
    }
    // Force a reduce, if possible. Return false if that can't
    // be done.
    /**
    @internal
    */ forceReduce() {
        let { parser } = this.p;
        let reduce = parser.stateSlot(this.state, 5 /* ParseState.ForcedReduce */ );
        if ((reduce & 65536 /* Action.ReduceFlag */ ) == 0) return false;
        if (!parser.validAction(this.state, reduce)) {
            let depth = reduce >> 19 /* Action.ReduceDepthShift */ , term = reduce & 65535 /* Action.ValueMask */ ;
            let target = this.stack.length - depth * 3;
            if (target < 0 || parser.getGoto(this.stack[target], term, false) < 0) {
                let backup = this.findForcedReduction();
                if (backup == null) return false;
                reduce = backup;
            }
            this.storeNode(0 /* Term.Err */ , this.pos, this.pos, 4, true);
            this.score -= 100 /* Recover.Reduce */ ;
        }
        this.reducePos = this.pos;
        this.reduce(reduce);
        return true;
    }
    /**
    Try to scan through the automaton to find some kind of reduction
    that can be applied. Used when the regular ForcedReduce field
    isn't a valid action. @internal
    */ findForcedReduction() {
        let { parser } = this.p, seen = [];
        let explore = (state, depth)=>{
            if (seen.includes(state)) return;
            seen.push(state);
            return parser.allActions(state, (action)=>{
                if (action & (262144 /* Action.StayFlag */  | 131072 /* Action.GotoFlag */ )) ;
                else if (action & 65536 /* Action.ReduceFlag */ ) {
                    let rDepth = (action >> 19 /* Action.ReduceDepthShift */ ) - depth;
                    if (rDepth > 1) {
                        let term = action & 65535 /* Action.ValueMask */ , target = this.stack.length - rDepth * 3;
                        if (target >= 0 && parser.getGoto(this.stack[target], term, false) >= 0) return rDepth << 19 /* Action.ReduceDepthShift */  | 65536 /* Action.ReduceFlag */  | term;
                    }
                } else {
                    let found = explore(action, depth + 1);
                    if (found != null) return found;
                }
            });
        };
        return explore(this.state, 0);
    }
    /**
    @internal
    */ forceAll() {
        while(!this.p.parser.stateFlag(this.state, 2 /* StateFlag.Accepting */ )){
            if (!this.forceReduce()) {
                this.storeNode(0 /* Term.Err */ , this.pos, this.pos, 4, true);
                break;
            }
        }
        return this;
    }
    /**
    Check whether this state has no further actions (assumed to be a direct descendant of the
    top state, since any other states must be able to continue
    somehow). @internal
    */ get deadEnd() {
        if (this.stack.length != 3) return false;
        let { parser } = this.p;
        return parser.data[parser.stateSlot(this.state, 1 /* ParseState.Actions */ )] == 65535 /* Seq.End */  && !parser.stateSlot(this.state, 4 /* ParseState.DefaultReduce */ );
    }
    /**
    Restart the stack (put it back in its start state). Only safe
    when this.stack.length == 3 (state is directly below the top
    state). @internal
    */ restart() {
        this.storeNode(0 /* Term.Err */ , this.pos, this.pos, 4, true);
        this.state = this.stack[0];
        this.stack.length = 0;
    }
    /**
    @internal
    */ sameState(other) {
        if (this.state != other.state || this.stack.length != other.stack.length) return false;
        for(let i = 0; i < this.stack.length; i += 3)if (this.stack[i] != other.stack[i]) return false;
        return true;
    }
    /**
    Get the parser used by this stack.
    */ get parser() {
        return this.p.parser;
    }
    /**
    Test whether a given dialect (by numeric ID, as exported from
    the terms file) is enabled.
    */ dialectEnabled(dialectID) {
        return this.p.parser.dialect.flags[dialectID];
    }
    shiftContext(term, start) {
        if (this.curContext) this.updateContext(this.curContext.tracker.shift(this.curContext.context, term, this, this.p.stream.reset(start)));
    }
    reduceContext(term, start) {
        if (this.curContext) this.updateContext(this.curContext.tracker.reduce(this.curContext.context, term, this, this.p.stream.reset(start)));
    }
    /**
    @internal
    */ emitContext() {
        let last = this.buffer.length - 1;
        if (last < 0 || this.buffer[last] != -3) this.buffer.push(this.curContext.hash, this.pos, this.pos, -3);
    }
    /**
    @internal
    */ emitLookAhead() {
        let last = this.buffer.length - 1;
        if (last < 0 || this.buffer[last] != -4) this.buffer.push(this.lookAhead, this.pos, this.pos, -4);
    }
    updateContext(context) {
        if (context != this.curContext.context) {
            let newCx = new StackContext(this.curContext.tracker, context);
            if (newCx.hash != this.curContext.hash) this.emitContext();
            this.curContext = newCx;
        }
    }
    /**
    @internal
    */ setLookAhead(lookAhead) {
        if (lookAhead > this.lookAhead) {
            this.emitLookAhead();
            this.lookAhead = lookAhead;
        }
    }
    /**
    @internal
    */ close() {
        if (this.curContext && this.curContext.tracker.strict) this.emitContext();
        if (this.lookAhead > 0) this.emitLookAhead();
    }
}
class StackContext {
    constructor(tracker, context){
        this.tracker = tracker;
        this.context = context;
        this.hash = tracker.strict ? tracker.hash(context) : 0;
    }
}
// Used to cheaply run some reductions to scan ahead without mutating
// an entire stack
class SimulatedStack {
    constructor(start){
        this.start = start;
        this.state = start.state;
        this.stack = start.stack;
        this.base = this.stack.length;
    }
    reduce(action) {
        let term = action & 65535 /* Action.ValueMask */ , depth = action >> 19 /* Action.ReduceDepthShift */ ;
        if (depth == 0) {
            if (this.stack == this.start.stack) this.stack = this.stack.slice();
            this.stack.push(this.state, 0, 0);
            this.base += 3;
        } else {
            this.base -= (depth - 1) * 3;
        }
        let goto = this.start.p.parser.getGoto(this.stack[this.base - 3], term, true);
        this.state = goto;
    }
}
// This is given to `Tree.build` to build a buffer, and encapsulates
// the parent-stack-walking necessary to read the nodes.
class StackBufferCursor {
    constructor(stack, pos, index){
        this.stack = stack;
        this.pos = pos;
        this.index = index;
        this.buffer = stack.buffer;
        if (this.index == 0) this.maybeNext();
    }
    static create(stack, pos = stack.bufferBase + stack.buffer.length) {
        return new StackBufferCursor(stack, pos, pos - stack.bufferBase);
    }
    maybeNext() {
        let next = this.stack.parent;
        if (next != null) {
            this.index = this.stack.bufferBase - next.bufferBase;
            this.stack = next;
            this.buffer = next.buffer;
        }
    }
    get id() {
        return this.buffer[this.index - 4];
    }
    get start() {
        return this.buffer[this.index - 3];
    }
    get end() {
        return this.buffer[this.index - 2];
    }
    get size() {
        return this.buffer[this.index - 1];
    }
    next() {
        this.index -= 4;
        this.pos -= 4;
        if (this.index == 0) this.maybeNext();
    }
    fork() {
        return new StackBufferCursor(this.stack, this.pos, this.index);
    }
}
// See lezer-generator/src/encode.ts for comments about the encoding
// used here
function decodeArray(input, Type = Uint16Array) {
    if (typeof input != "string") return input;
    let array = null;
    for(let pos = 0, out = 0; pos < input.length;){
        let value = 0;
        for(;;){
            let next = input.charCodeAt(pos++), stop = false;
            if (next == 126 /* Encode.BigValCode */ ) {
                value = 65535 /* Encode.BigVal */ ;
                break;
            }
            if (next >= 92 /* Encode.Gap2 */ ) next--;
            if (next >= 34 /* Encode.Gap1 */ ) next--;
            let digit = next - 32 /* Encode.Start */ ;
            if (digit >= 46 /* Encode.Base */ ) {
                digit -= 46 /* Encode.Base */ ;
                stop = true;
            }
            value += digit;
            if (stop) break;
            value *= 46 /* Encode.Base */ ;
        }
        if (array) array[out++] = value;
        else array = new Type(value);
    }
    return array;
}
class CachedToken {
    constructor(){
        this.start = -1;
        this.value = -1;
        this.end = -1;
        this.extended = -1;
        this.lookAhead = 0;
        this.mask = 0;
        this.context = 0;
    }
}
const nullToken = new CachedToken;
/**
[Tokenizers](#lr.ExternalTokenizer) interact with the input
through this interface. It presents the input as a stream of
characters, tracking lookahead and hiding the complexity of
[ranges](#common.Parser.parse^ranges) from tokenizer code.
*/ class InputStream {
    /**
    @internal
    */ constructor(/**
    @internal
    */ input, /**
    @internal
    */ ranges){
        this.input = input;
        this.ranges = ranges;
        /**
        @internal
        */ this.chunk = "";
        /**
        @internal
        */ this.chunkOff = 0;
        /**
        Backup chunk
        */ this.chunk2 = "";
        this.chunk2Pos = 0;
        /**
        The character code of the next code unit in the input, or -1
        when the stream is at the end of the input.
        */ this.next = -1;
        /**
        @internal
        */ this.token = nullToken;
        this.rangeIndex = 0;
        this.pos = this.chunkPos = ranges[0].from;
        this.range = ranges[0];
        this.end = ranges[ranges.length - 1].to;
        this.readNext();
    }
    /**
    @internal
    */ resolveOffset(offset, assoc) {
        let range = this.range, index = this.rangeIndex;
        let pos = this.pos + offset;
        while(pos < range.from){
            if (!index) return null;
            let next = this.ranges[--index];
            pos -= range.from - next.to;
            range = next;
        }
        while(assoc < 0 ? pos > range.to : pos >= range.to){
            if (index == this.ranges.length - 1) return null;
            let next = this.ranges[++index];
            pos += next.from - range.to;
            range = next;
        }
        return pos;
    }
    /**
    @internal
    */ clipPos(pos) {
        if (pos >= this.range.from && pos < this.range.to) return pos;
        for (let range of this.ranges)if (range.to > pos) return Math.max(pos, range.from);
        return this.end;
    }
    /**
    Look at a code unit near the stream position. `.peek(0)` equals
    `.next`, `.peek(-1)` gives you the previous character, and so
    on.
    
    Note that looking around during tokenizing creates dependencies
    on potentially far-away content, which may reduce the
    effectiveness incremental parsing—when looking forward—or even
    cause invalid reparses when looking backward more than 25 code
    units, since the library does not track lookbehind.
    */ peek(offset) {
        let idx = this.chunkOff + offset, pos, result;
        if (idx >= 0 && idx < this.chunk.length) {
            pos = this.pos + offset;
            result = this.chunk.charCodeAt(idx);
        } else {
            let resolved = this.resolveOffset(offset, 1);
            if (resolved == null) return -1;
            pos = resolved;
            if (pos >= this.chunk2Pos && pos < this.chunk2Pos + this.chunk2.length) {
                result = this.chunk2.charCodeAt(pos - this.chunk2Pos);
            } else {
                let i = this.rangeIndex, range = this.range;
                while(range.to <= pos)range = this.ranges[++i];
                this.chunk2 = this.input.chunk(this.chunk2Pos = pos);
                if (pos + this.chunk2.length > range.to) this.chunk2 = this.chunk2.slice(0, range.to - pos);
                result = this.chunk2.charCodeAt(0);
            }
        }
        if (pos >= this.token.lookAhead) this.token.lookAhead = pos + 1;
        return result;
    }
    /**
    Accept a token. By default, the end of the token is set to the
    current stream position, but you can pass an offset (relative to
    the stream position) to change that.
    */ acceptToken(token, endOffset = 0) {
        let end = endOffset ? this.resolveOffset(endOffset, -1) : this.pos;
        if (end == null || end < this.token.start) throw new RangeError("Token end out of bounds");
        this.token.value = token;
        this.token.end = end;
    }
    /**
    Accept a token ending at a specific given position.
    */ acceptTokenTo(token, endPos) {
        this.token.value = token;
        this.token.end = endPos;
    }
    getChunk() {
        if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) {
            let { chunk, chunkPos } = this;
            this.chunk = this.chunk2;
            this.chunkPos = this.chunk2Pos;
            this.chunk2 = chunk;
            this.chunk2Pos = chunkPos;
            this.chunkOff = this.pos - this.chunkPos;
        } else {
            this.chunk2 = this.chunk;
            this.chunk2Pos = this.chunkPos;
            let nextChunk = this.input.chunk(this.pos);
            let end = this.pos + nextChunk.length;
            this.chunk = end > this.range.to ? nextChunk.slice(0, this.range.to - this.pos) : nextChunk;
            this.chunkPos = this.pos;
            this.chunkOff = 0;
        }
    }
    readNext() {
        if (this.chunkOff >= this.chunk.length) {
            this.getChunk();
            if (this.chunkOff == this.chunk.length) return this.next = -1;
        }
        return this.next = this.chunk.charCodeAt(this.chunkOff);
    }
    /**
    Move the stream forward N (defaults to 1) code units. Returns
    the new value of [`next`](#lr.InputStream.next).
    */ advance(n = 1) {
        this.chunkOff += n;
        while(this.pos + n >= this.range.to){
            if (this.rangeIndex == this.ranges.length - 1) return this.setDone();
            n -= this.range.to - this.pos;
            this.range = this.ranges[++this.rangeIndex];
            this.pos = this.range.from;
        }
        this.pos += n;
        if (this.pos >= this.token.lookAhead) this.token.lookAhead = this.pos + 1;
        return this.readNext();
    }
    setDone() {
        this.pos = this.chunkPos = this.end;
        this.range = this.ranges[this.rangeIndex = this.ranges.length - 1];
        this.chunk = "";
        return this.next = -1;
    }
    /**
    @internal
    */ reset(pos, token) {
        if (token) {
            this.token = token;
            token.start = pos;
            token.lookAhead = pos + 1;
            token.value = token.extended = -1;
        } else {
            this.token = nullToken;
        }
        if (this.pos != pos) {
            this.pos = pos;
            if (pos == this.end) {
                this.setDone();
                return this;
            }
            while(pos < this.range.from)this.range = this.ranges[--this.rangeIndex];
            while(pos >= this.range.to)this.range = this.ranges[++this.rangeIndex];
            if (pos >= this.chunkPos && pos < this.chunkPos + this.chunk.length) {
                this.chunkOff = pos - this.chunkPos;
            } else {
                this.chunk = "";
                this.chunkOff = 0;
            }
            this.readNext();
        }
        return this;
    }
    /**
    @internal
    */ read(from, to) {
        if (from >= this.chunkPos && to <= this.chunkPos + this.chunk.length) return this.chunk.slice(from - this.chunkPos, to - this.chunkPos);
        if (from >= this.chunk2Pos && to <= this.chunk2Pos + this.chunk2.length) return this.chunk2.slice(from - this.chunk2Pos, to - this.chunk2Pos);
        if (from >= this.range.from && to <= this.range.to) return this.input.read(from, to);
        let result = "";
        for (let r of this.ranges){
            if (r.from >= to) break;
            if (r.to > from) result += this.input.read(Math.max(r.from, from), Math.min(r.to, to));
        }
        return result;
    }
}
/**
@internal
*/ class TokenGroup {
    constructor(data, id){
        this.data = data;
        this.id = id;
    }
    token(input, stack) {
        let { parser } = stack.p;
        readToken(this.data, input, stack, this.id, parser.data, parser.tokenPrecTable);
    }
}
TokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
/**
@hide
*/ class LocalTokenGroup {
    constructor(data, precTable, elseToken){
        this.precTable = precTable;
        this.elseToken = elseToken;
        this.data = typeof data == "string" ? decodeArray(data) : data;
    }
    token(input, stack) {
        let start = input.pos, skipped = 0;
        for(;;){
            let atEof = input.next < 0, nextPos = input.resolveOffset(1, 1);
            readToken(this.data, input, stack, 0, this.data, this.precTable);
            if (input.token.value > -1) break;
            if (this.elseToken == null) return;
            if (!atEof) skipped++;
            if (nextPos == null) break;
            input.reset(nextPos, input.token);
        }
        if (skipped) {
            input.reset(start, input.token);
            input.acceptToken(this.elseToken, skipped);
        }
    }
}
LocalTokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
/**
`@external tokens` declarations in the grammar should resolve to
an instance of this class.
*/ class ExternalTokenizer {
    /**
    Create a tokenizer. The first argument is the function that,
    given an input stream, scans for the types of tokens it
    recognizes at the stream's position, and calls
    [`acceptToken`](#lr.InputStream.acceptToken) when it finds
    one.
    */ constructor(/**
    @internal
    */ token, options = {}){
        this.token = token;
        this.contextual = !!options.contextual;
        this.fallback = !!options.fallback;
        this.extend = !!options.extend;
    }
}
// Tokenizer data is stored a big uint16 array containing, for each
// state:
//
//  - A group bitmask, indicating what token groups are reachable from
//    this state, so that paths that can only lead to tokens not in
//    any of the current groups can be cut off early.
//
//  - The position of the end of the state's sequence of accepting
//    tokens
//
//  - The number of outgoing edges for the state
//
//  - The accepting tokens, as (token id, group mask) pairs
//
//  - The outgoing edges, as (start character, end character, state
//    index) triples, with end character being exclusive
//
// This function interprets that data, running through a stream as
// long as new states with the a matching group mask can be reached,
// and updating `input.token` when it matches a token.
function readToken(data, input, stack, group, precTable, precOffset) {
    let state = 0, groupMask = 1 << group, { dialect } = stack.p.parser;
    scan: for(;;){
        if ((groupMask & data[state]) == 0) break;
        let accEnd = data[state + 1];
        // Check whether this state can lead to a token in the current group
        // Accept tokens in this state, possibly overwriting
        // lower-precedence / shorter tokens
        for(let i = state + 3; i < accEnd; i += 2)if ((data[i + 1] & groupMask) > 0) {
            let term = data[i];
            if (dialect.allows(term) && (input.token.value == -1 || input.token.value == term || overrides(term, input.token.value, precTable, precOffset))) {
                input.acceptToken(term);
                break;
            }
        }
        let next = input.next, low = 0, high = data[state + 2];
        // Special case for EOF
        if (input.next < 0 && high > low && data[accEnd + high * 3 - 3] == 65535 /* Seq.End */ ) {
            state = data[accEnd + high * 3 - 1];
            continue scan;
        }
        // Do a binary search on the state's edges
        for(; low < high;){
            let mid = low + high >> 1;
            let index = accEnd + mid + (mid << 1);
            let from = data[index], to = data[index + 1] || 0x10000;
            if (next < from) high = mid;
            else if (next >= to) low = mid + 1;
            else {
                state = data[index + 2];
                input.advance();
                continue scan;
            }
        }
        break;
    }
}
function findOffset(data, start, term) {
    for(let i = start, next; (next = data[i]) != 65535 /* Seq.End */ ; i++)if (next == term) return i - start;
    return -1;
}
function overrides(token, prev, tableData, tableOffset) {
    let iPrev = findOffset(tableData, tableOffset, prev);
    return iPrev < 0 || findOffset(tableData, tableOffset, token) < iPrev;
}
// Environment variable used to control console output
const verbose = typeof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] != "undefined" && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env && /\bparse\b/.test(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.LOG);
let stackIDs = null;
function cutAt(tree, pos, side) {
    let cursor = tree.cursor(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IterMode"].IncludeAnonymous);
    cursor.moveTo(pos);
    for(;;){
        if (!(side < 0 ? cursor.childBefore(pos) : cursor.childAfter(pos))) for(;;){
            if ((side < 0 ? cursor.to < pos : cursor.from > pos) && !cursor.type.isError) return side < 0 ? Math.max(0, Math.min(cursor.to - 1, pos - 25 /* Lookahead.Margin */ )) : Math.min(tree.length, Math.max(cursor.from + 1, pos + 25 /* Lookahead.Margin */ ));
            if (side < 0 ? cursor.prevSibling() : cursor.nextSibling()) break;
            if (!cursor.parent()) return side < 0 ? 0 : tree.length;
        }
    }
}
class FragmentCursor {
    constructor(fragments, nodeSet){
        this.fragments = fragments;
        this.nodeSet = nodeSet;
        this.i = 0;
        this.fragment = null;
        this.safeFrom = -1;
        this.safeTo = -1;
        this.trees = [];
        this.start = [];
        this.index = [];
        this.nextFragment();
    }
    nextFragment() {
        let fr = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
        if (fr) {
            this.safeFrom = fr.openStart ? cutAt(fr.tree, fr.from + fr.offset, 1) - fr.offset : fr.from;
            this.safeTo = fr.openEnd ? cutAt(fr.tree, fr.to + fr.offset, -1) - fr.offset : fr.to;
            while(this.trees.length){
                this.trees.pop();
                this.start.pop();
                this.index.pop();
            }
            this.trees.push(fr.tree);
            this.start.push(-fr.offset);
            this.index.push(0);
            this.nextStart = this.safeFrom;
        } else {
            this.nextStart = 1e9;
        }
    }
    // `pos` must be >= any previously given `pos` for this cursor
    nodeAt(pos) {
        if (pos < this.nextStart) return null;
        while(this.fragment && this.safeTo <= pos)this.nextFragment();
        if (!this.fragment) return null;
        for(;;){
            let last = this.trees.length - 1;
            if (last < 0) {
                this.nextFragment();
                return null;
            }
            let top = this.trees[last], index = this.index[last];
            if (index == top.children.length) {
                this.trees.pop();
                this.start.pop();
                this.index.pop();
                continue;
            }
            let next = top.children[index];
            let start = this.start[last] + top.positions[index];
            if (start > pos) {
                this.nextStart = start;
                return null;
            }
            if (next instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"]) {
                if (start == pos) {
                    if (start < this.safeFrom) return null;
                    let end = start + next.length;
                    if (end <= this.safeTo) {
                        let lookAhead = next.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].lookAhead);
                        if (!lookAhead || end + lookAhead < this.fragment.to) return next;
                    }
                }
                this.index[last]++;
                if (start + next.length >= Math.max(this.safeFrom, pos)) {
                    this.trees.push(next);
                    this.start.push(start);
                    this.index.push(0);
                }
            } else {
                this.index[last]++;
                this.nextStart = start + next.length;
            }
        }
    }
}
class TokenCache {
    constructor(parser, stream){
        this.stream = stream;
        this.tokens = [];
        this.mainToken = null;
        this.actions = [];
        this.tokens = parser.tokenizers.map((_)=>new CachedToken);
    }
    getActions(stack) {
        let actionIndex = 0;
        let main = null;
        let { parser } = stack.p, { tokenizers } = parser;
        let mask = parser.stateSlot(stack.state, 3 /* ParseState.TokenizerMask */ );
        let context = stack.curContext ? stack.curContext.hash : 0;
        let lookAhead = 0;
        for(let i = 0; i < tokenizers.length; i++){
            if ((1 << i & mask) == 0) continue;
            let tokenizer = tokenizers[i], token = this.tokens[i];
            if (main && !tokenizer.fallback) continue;
            if (tokenizer.contextual || token.start != stack.pos || token.mask != mask || token.context != context) {
                this.updateCachedToken(token, tokenizer, stack);
                token.mask = mask;
                token.context = context;
            }
            if (token.lookAhead > token.end + 25 /* Lookahead.Margin */ ) lookAhead = Math.max(token.lookAhead, lookAhead);
            if (token.value != 0 /* Term.Err */ ) {
                let startIndex = actionIndex;
                if (token.extended > -1) actionIndex = this.addActions(stack, token.extended, token.end, actionIndex);
                actionIndex = this.addActions(stack, token.value, token.end, actionIndex);
                if (!tokenizer.extend) {
                    main = token;
                    if (actionIndex > startIndex) break;
                }
            }
        }
        while(this.actions.length > actionIndex)this.actions.pop();
        if (lookAhead) stack.setLookAhead(lookAhead);
        if (!main && stack.pos == this.stream.end) {
            main = new CachedToken;
            main.value = stack.p.parser.eofTerm;
            main.start = main.end = stack.pos;
            actionIndex = this.addActions(stack, main.value, main.end, actionIndex);
        }
        this.mainToken = main;
        return this.actions;
    }
    getMainToken(stack) {
        if (this.mainToken) return this.mainToken;
        let main = new CachedToken, { pos, p } = stack;
        main.start = pos;
        main.end = Math.min(pos + 1, p.stream.end);
        main.value = pos == p.stream.end ? p.parser.eofTerm : 0 /* Term.Err */ ;
        return main;
    }
    updateCachedToken(token, tokenizer, stack) {
        let start = this.stream.clipPos(stack.pos);
        tokenizer.token(this.stream.reset(start, token), stack);
        if (token.value > -1) {
            let { parser } = stack.p;
            for(let i = 0; i < parser.specialized.length; i++)if (parser.specialized[i] == token.value) {
                let result = parser.specializers[i](this.stream.read(token.start, token.end), stack);
                if (result >= 0 && stack.p.parser.dialect.allows(result >> 1)) {
                    if ((result & 1) == 0 /* Specialize.Specialize */ ) token.value = result >> 1;
                    else token.extended = result >> 1;
                    break;
                }
            }
        } else {
            token.value = 0 /* Term.Err */ ;
            token.end = this.stream.clipPos(start + 1);
        }
    }
    putAction(action, token, end, index) {
        // Don't add duplicate actions
        for(let i = 0; i < index; i += 3)if (this.actions[i] == action) return index;
        this.actions[index++] = action;
        this.actions[index++] = token;
        this.actions[index++] = end;
        return index;
    }
    addActions(stack, token, end, index) {
        let { state } = stack, { parser } = stack.p, { data } = parser;
        for(let set = 0; set < 2; set++){
            for(let i = parser.stateSlot(state, set ? 2 /* ParseState.Skip */  : 1 /* ParseState.Actions */ );; i += 3){
                if (data[i] == 65535 /* Seq.End */ ) {
                    if (data[i + 1] == 1 /* Seq.Next */ ) {
                        i = pair(data, i + 2);
                    } else {
                        if (index == 0 && data[i + 1] == 2 /* Seq.Other */ ) index = this.putAction(pair(data, i + 2), token, end, index);
                        break;
                    }
                }
                if (data[i] == token) index = this.putAction(pair(data, i + 1), token, end, index);
            }
        }
        return index;
    }
}
class Parse {
    constructor(parser, input, fragments, ranges){
        this.parser = parser;
        this.input = input;
        this.ranges = ranges;
        this.recovering = 0;
        this.nextStackID = 0x2654; // ♔, ♕, ♖, ♗, ♘, ♙, ♠, ♡, ♢, ♣, ♤, ♥, ♦, ♧
        this.minStackPos = 0;
        this.reused = [];
        this.stoppedAt = null;
        this.lastBigReductionStart = -1;
        this.lastBigReductionSize = 0;
        this.bigReductionCount = 0;
        this.stream = new InputStream(input, ranges);
        this.tokens = new TokenCache(parser, this.stream);
        this.topTerm = parser.top[1];
        let { from } = ranges[0];
        this.stacks = [
            Stack.start(this, parser.top[0], from)
        ];
        this.fragments = fragments.length && this.stream.end - from > parser.bufferLength * 4 ? new FragmentCursor(fragments, parser.nodeSet) : null;
    }
    get parsedPos() {
        return this.minStackPos;
    }
    // Move the parser forward. This will process all parse stacks at
    // `this.pos` and try to advance them to a further position. If no
    // stack for such a position is found, it'll start error-recovery.
    //
    // When the parse is finished, this will return a syntax tree. When
    // not, it returns `null`.
    advance() {
        let stacks = this.stacks, pos = this.minStackPos;
        // This will hold stacks beyond `pos`.
        let newStacks = this.stacks = [];
        let stopped, stoppedTokens;
        // If a large amount of reductions happened with the same start
        // position, force the stack out of that production in order to
        // avoid creating a tree too deep to recurse through.
        // (This is an ugly kludge, because unfortunately there is no
        // straightforward, cheap way to check for this happening, due to
        // the history of reductions only being available in an
        // expensive-to-access format in the stack buffers.)
        if (this.bigReductionCount > 300 /* Rec.MaxLeftAssociativeReductionCount */  && stacks.length == 1) {
            let [s] = stacks;
            while(s.forceReduce() && s.stack.length && s.stack[s.stack.length - 2] >= this.lastBigReductionStart){}
            this.bigReductionCount = this.lastBigReductionSize = 0;
        }
        // Keep advancing any stacks at `pos` until they either move
        // forward or can't be advanced. Gather stacks that can't be
        // advanced further in `stopped`.
        for(let i = 0; i < stacks.length; i++){
            let stack = stacks[i];
            for(;;){
                this.tokens.mainToken = null;
                if (stack.pos > pos) {
                    newStacks.push(stack);
                } else if (this.advanceStack(stack, newStacks, stacks)) {
                    continue;
                } else {
                    if (!stopped) {
                        stopped = [];
                        stoppedTokens = [];
                    }
                    stopped.push(stack);
                    let tok = this.tokens.getMainToken(stack);
                    stoppedTokens.push(tok.value, tok.end);
                }
                break;
            }
        }
        if (!newStacks.length) {
            let finished = stopped && findFinished(stopped);
            if (finished) {
                if (verbose) console.log("Finish with " + this.stackID(finished));
                return this.stackToTree(finished);
            }
            if (this.parser.strict) {
                if (verbose && stopped) console.log("Stuck with token " + (this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : "none"));
                throw new SyntaxError("No parse at " + pos);
            }
            if (!this.recovering) this.recovering = 5 /* Rec.Distance */ ;
        }
        if (this.recovering && stopped) {
            let finished = this.stoppedAt != null && stopped[0].pos > this.stoppedAt ? stopped[0] : this.runRecovery(stopped, stoppedTokens, newStacks);
            if (finished) {
                if (verbose) console.log("Force-finish " + this.stackID(finished));
                return this.stackToTree(finished.forceAll());
            }
        }
        if (this.recovering) {
            let maxRemaining = this.recovering == 1 ? 1 : this.recovering * 3 /* Rec.MaxRemainingPerStep */ ;
            if (newStacks.length > maxRemaining) {
                newStacks.sort((a, b)=>b.score - a.score);
                while(newStacks.length > maxRemaining)newStacks.pop();
            }
            if (newStacks.some((s)=>s.reducePos > pos)) this.recovering--;
        } else if (newStacks.length > 1) {
            // Prune stacks that are in the same state, or that have been
            // running without splitting for a while, to avoid getting stuck
            // with multiple successful stacks running endlessly on.
            outer: for(let i = 0; i < newStacks.length - 1; i++){
                let stack = newStacks[i];
                for(let j = i + 1; j < newStacks.length; j++){
                    let other = newStacks[j];
                    if (stack.sameState(other) || stack.buffer.length > 500 /* Rec.MinBufferLengthPrune */  && other.buffer.length > 500 /* Rec.MinBufferLengthPrune */ ) {
                        if ((stack.score - other.score || stack.buffer.length - other.buffer.length) > 0) {
                            newStacks.splice(j--, 1);
                        } else {
                            newStacks.splice(i--, 1);
                            continue outer;
                        }
                    }
                }
            }
            if (newStacks.length > 12 /* Rec.MaxStackCount */ ) newStacks.splice(12 /* Rec.MaxStackCount */ , newStacks.length - 12 /* Rec.MaxStackCount */ );
        }
        this.minStackPos = newStacks[0].pos;
        for(let i = 1; i < newStacks.length; i++)if (newStacks[i].pos < this.minStackPos) this.minStackPos = newStacks[i].pos;
        return null;
    }
    stopAt(pos) {
        if (this.stoppedAt != null && this.stoppedAt < pos) throw new RangeError("Can't move stoppedAt forward");
        this.stoppedAt = pos;
    }
    // Returns an updated version of the given stack, or null if the
    // stack can't advance normally. When `split` and `stacks` are
    // given, stacks split off by ambiguous operations will be pushed to
    // `split`, or added to `stacks` if they move `pos` forward.
    advanceStack(stack, stacks, split) {
        let start = stack.pos, { parser } = this;
        let base = verbose ? this.stackID(stack) + " -> " : "";
        if (this.stoppedAt != null && start > this.stoppedAt) return stack.forceReduce() ? stack : null;
        if (this.fragments) {
            let strictCx = stack.curContext && stack.curContext.tracker.strict, cxHash = strictCx ? stack.curContext.hash : 0;
            for(let cached = this.fragments.nodeAt(start); cached;){
                let match = this.parser.nodeSet.types[cached.type.id] == cached.type ? parser.getGoto(stack.state, cached.type.id) : -1;
                if (match > -1 && cached.length && (!strictCx || (cached.prop(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"].contextHash) || 0) == cxHash)) {
                    stack.useNode(cached, match);
                    if (verbose) console.log(base + this.stackID(stack) + ` (via reuse of ${parser.getName(cached.type.id)})`);
                    return true;
                }
                if (!(cached instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"]) || cached.children.length == 0 || cached.positions[0] > 0) break;
                let inner = cached.children[0];
                if (inner instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"] && cached.positions[0] == 0) cached = inner;
                else break;
            }
        }
        let defaultReduce = parser.stateSlot(stack.state, 4 /* ParseState.DefaultReduce */ );
        if (defaultReduce > 0) {
            stack.reduce(defaultReduce);
            if (verbose) console.log(base + this.stackID(stack) + ` (via always-reduce ${parser.getName(defaultReduce & 65535 /* Action.ValueMask */ )})`);
            return true;
        }
        if (stack.stack.length >= 8400 /* Rec.CutDepth */ ) {
            while(stack.stack.length > 6000 /* Rec.CutTo */  && stack.forceReduce()){}
        }
        let actions = this.tokens.getActions(stack);
        for(let i = 0; i < actions.length;){
            let action = actions[i++], term = actions[i++], end = actions[i++];
            let last = i == actions.length || !split;
            let localStack = last ? stack : stack.split();
            let main = this.tokens.mainToken;
            localStack.apply(action, term, main ? main.start : localStack.pos, end);
            if (verbose) console.log(base + this.stackID(localStack) + ` (via ${(action & 65536 /* Action.ReduceFlag */ ) == 0 ? "shift" : `reduce of ${parser.getName(action & 65535 /* Action.ValueMask */ )}`} for ${parser.getName(term)} @ ${start}${localStack == stack ? "" : ", split"})`);
            if (last) return true;
            else if (localStack.pos > start) stacks.push(localStack);
            else split.push(localStack);
        }
        return false;
    }
    // Advance a given stack forward as far as it will go. Returns the
    // (possibly updated) stack if it got stuck, or null if it moved
    // forward and was given to `pushStackDedup`.
    advanceFully(stack, newStacks) {
        let pos = stack.pos;
        for(;;){
            if (!this.advanceStack(stack, null, null)) return false;
            if (stack.pos > pos) {
                pushStackDedup(stack, newStacks);
                return true;
            }
        }
    }
    runRecovery(stacks, tokens, newStacks) {
        let finished = null, restarted = false;
        for(let i = 0; i < stacks.length; i++){
            let stack = stacks[i], token = tokens[i << 1], tokenEnd = tokens[(i << 1) + 1];
            let base = verbose ? this.stackID(stack) + " -> " : "";
            if (stack.deadEnd) {
                if (restarted) continue;
                restarted = true;
                stack.restart();
                if (verbose) console.log(base + this.stackID(stack) + " (restarted)");
                let done = this.advanceFully(stack, newStacks);
                if (done) continue;
            }
            let force = stack.split(), forceBase = base;
            for(let j = 0; j < 10 /* Rec.ForceReduceLimit */  && force.forceReduce(); j++){
                if (verbose) console.log(forceBase + this.stackID(force) + " (via force-reduce)");
                let done = this.advanceFully(force, newStacks);
                if (done) break;
                if (verbose) forceBase = this.stackID(force) + " -> ";
            }
            for (let insert of stack.recoverByInsert(token)){
                if (verbose) console.log(base + this.stackID(insert) + " (via recover-insert)");
                this.advanceFully(insert, newStacks);
            }
            if (this.stream.end > stack.pos) {
                if (tokenEnd == stack.pos) {
                    tokenEnd++;
                    token = 0 /* Term.Err */ ;
                }
                stack.recoverByDelete(token, tokenEnd);
                if (verbose) console.log(base + this.stackID(stack) + ` (via recover-delete ${this.parser.getName(token)})`);
                pushStackDedup(stack, newStacks);
            } else if (!finished || finished.score < stack.score) {
                finished = stack;
            }
        }
        return finished;
    }
    // Convert the stack's buffer to a syntax tree.
    stackToTree(stack) {
        stack.close();
        return __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tree"].build({
            buffer: StackBufferCursor.create(stack),
            nodeSet: this.parser.nodeSet,
            topID: this.topTerm,
            maxBufferLength: this.parser.bufferLength,
            reused: this.reused,
            start: this.ranges[0].from,
            length: stack.pos - this.ranges[0].from,
            minRepeatType: this.parser.minRepeatTerm
        });
    }
    stackID(stack) {
        let id = (stackIDs || (stackIDs = new WeakMap)).get(stack);
        if (!id) stackIDs.set(stack, id = String.fromCodePoint(this.nextStackID++));
        return id + stack;
    }
}
function pushStackDedup(stack, newStacks) {
    for(let i = 0; i < newStacks.length; i++){
        let other = newStacks[i];
        if (other.pos == stack.pos && other.sameState(stack)) {
            if (newStacks[i].score < stack.score) newStacks[i] = stack;
            return;
        }
    }
    newStacks.push(stack);
}
class Dialect {
    constructor(source, flags, disabled){
        this.source = source;
        this.flags = flags;
        this.disabled = disabled;
    }
    allows(term) {
        return !this.disabled || this.disabled[term] == 0;
    }
}
const id = (x)=>x;
/**
Context trackers are used to track stateful context (such as
indentation in the Python grammar, or parent elements in the XML
grammar) needed by external tokenizers. You declare them in a
grammar file as `@context exportName from "module"`.

Context values should be immutable, and can be updated (replaced)
on shift or reduce actions.

The export used in a `@context` declaration should be of this
type.
*/ class ContextTracker {
    /**
    Define a context tracker.
    */ constructor(spec){
        this.start = spec.start;
        this.shift = spec.shift || id;
        this.reduce = spec.reduce || id;
        this.reuse = spec.reuse || id;
        this.hash = spec.hash || (()=>0);
        this.strict = spec.strict !== false;
    }
}
/**
Holds the parse tables for a given grammar, as generated by
`lezer-generator`, and provides [methods](#common.Parser) to parse
content with.
*/ class LRParser extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Parser"] {
    /**
    @internal
    */ constructor(spec){
        super();
        /**
        @internal
        */ this.wrappers = [];
        if (spec.version != 14 /* File.Version */ ) throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${14 /* File.Version */ })`);
        let nodeNames = spec.nodeNames.split(" ");
        this.minRepeatTerm = nodeNames.length;
        for(let i = 0; i < spec.repeatNodeCount; i++)nodeNames.push("");
        let topTerms = Object.keys(spec.topRules).map((r)=>spec.topRules[r][1]);
        let nodeProps = [];
        for(let i = 0; i < nodeNames.length; i++)nodeProps.push([]);
        function setProp(nodeID, prop, value) {
            nodeProps[nodeID].push([
                prop,
                prop.deserialize(String(value))
            ]);
        }
        if (spec.nodeProps) for (let propSpec of spec.nodeProps){
            let prop = propSpec[0];
            if (typeof prop == "string") prop = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeProp"][prop];
            for(let i = 1; i < propSpec.length;){
                let next = propSpec[i++];
                if (next >= 0) {
                    setProp(next, prop, propSpec[i++]);
                } else {
                    let value = propSpec[i + -next];
                    for(let j = -next; j > 0; j--)setProp(propSpec[i++], prop, value);
                    i++;
                }
            }
        }
        this.nodeSet = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeSet"](nodeNames.map((name, i)=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].define({
                name: i >= this.minRepeatTerm ? undefined : name,
                id: i,
                props: nodeProps[i],
                top: topTerms.indexOf(i) > -1,
                error: i == 0,
                skipped: spec.skippedNodes && spec.skippedNodes.indexOf(i) > -1
            })));
        if (spec.propSources) this.nodeSet = this.nodeSet.extend(...spec.propSources);
        this.strict = false;
        this.bufferLength = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f40$lezer$2f$common$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultBufferLength"];
        let tokenArray = decodeArray(spec.tokenData);
        this.context = spec.context;
        this.specializerSpecs = spec.specialized || [];
        this.specialized = new Uint16Array(this.specializerSpecs.length);
        for(let i = 0; i < this.specializerSpecs.length; i++)this.specialized[i] = this.specializerSpecs[i].term;
        this.specializers = this.specializerSpecs.map(getSpecializer);
        this.states = decodeArray(spec.states, Uint32Array);
        this.data = decodeArray(spec.stateData);
        this.goto = decodeArray(spec.goto);
        this.maxTerm = spec.maxTerm;
        this.tokenizers = spec.tokenizers.map((value)=>typeof value == "number" ? new TokenGroup(tokenArray, value) : value);
        this.topRules = spec.topRules;
        this.dialects = spec.dialects || {};
        this.dynamicPrecedences = spec.dynamicPrecedences || null;
        this.tokenPrecTable = spec.tokenPrec;
        this.termNames = spec.termNames || null;
        this.maxNode = this.nodeSet.types.length - 1;
        this.dialect = this.parseDialect();
        this.top = this.topRules[Object.keys(this.topRules)[0]];
    }
    createParse(input, fragments, ranges) {
        let parse = new Parse(this, input, fragments, ranges);
        for (let w of this.wrappers)parse = w(parse, input, fragments, ranges);
        return parse;
    }
    /**
    Get a goto table entry @internal
    */ getGoto(state, term, loose = false) {
        let table = this.goto;
        if (term >= table[0]) return -1;
        for(let pos = table[term + 1];;){
            let groupTag = table[pos++], last = groupTag & 1;
            let target = table[pos++];
            if (last && loose) return target;
            for(let end = pos + (groupTag >> 1); pos < end; pos++)if (table[pos] == state) return target;
            if (last) return -1;
        }
    }
    /**
    Check if this state has an action for a given terminal @internal
    */ hasAction(state, terminal) {
        let data = this.data;
        for(let set = 0; set < 2; set++){
            for(let i = this.stateSlot(state, set ? 2 /* ParseState.Skip */  : 1 /* ParseState.Actions */ ), next;; i += 3){
                if ((next = data[i]) == 65535 /* Seq.End */ ) {
                    if (data[i + 1] == 1 /* Seq.Next */ ) next = data[i = pair(data, i + 2)];
                    else if (data[i + 1] == 2 /* Seq.Other */ ) return pair(data, i + 2);
                    else break;
                }
                if (next == terminal || next == 0 /* Term.Err */ ) return pair(data, i + 1);
            }
        }
        return 0;
    }
    /**
    @internal
    */ stateSlot(state, slot) {
        return this.states[state * 6 /* ParseState.Size */  + slot];
    }
    /**
    @internal
    */ stateFlag(state, flag) {
        return (this.stateSlot(state, 0 /* ParseState.Flags */ ) & flag) > 0;
    }
    /**
    @internal
    */ validAction(state, action) {
        return !!this.allActions(state, (a)=>a == action ? true : null);
    }
    /**
    @internal
    */ allActions(state, action) {
        let deflt = this.stateSlot(state, 4 /* ParseState.DefaultReduce */ );
        let result = deflt ? action(deflt) : undefined;
        for(let i = this.stateSlot(state, 1 /* ParseState.Actions */ ); result == null; i += 3){
            if (this.data[i] == 65535 /* Seq.End */ ) {
                if (this.data[i + 1] == 1 /* Seq.Next */ ) i = pair(this.data, i + 2);
                else break;
            }
            result = action(pair(this.data, i + 1));
        }
        return result;
    }
    /**
    Get the states that can follow this one through shift actions or
    goto jumps. @internal
    */ nextStates(state) {
        let result = [];
        for(let i = this.stateSlot(state, 1 /* ParseState.Actions */ );; i += 3){
            if (this.data[i] == 65535 /* Seq.End */ ) {
                if (this.data[i + 1] == 1 /* Seq.Next */ ) i = pair(this.data, i + 2);
                else break;
            }
            if ((this.data[i + 2] & 65536 /* Action.ReduceFlag */  >> 16) == 0) {
                let value = this.data[i + 1];
                if (!result.some((v, i)=>i & 1 && v == value)) result.push(this.data[i], value);
            }
        }
        return result;
    }
    /**
    Configure the parser. Returns a new parser instance that has the
    given settings modified. Settings not provided in `config` are
    kept from the original parser.
    */ configure(config) {
        // Hideous reflection-based kludge to make it easy to create a
        // slightly modified copy of a parser.
        let copy = Object.assign(Object.create(LRParser.prototype), this);
        if (config.props) copy.nodeSet = this.nodeSet.extend(...config.props);
        if (config.top) {
            let info = this.topRules[config.top];
            if (!info) throw new RangeError(`Invalid top rule name ${config.top}`);
            copy.top = info;
        }
        if (config.tokenizers) copy.tokenizers = this.tokenizers.map((t)=>{
            let found = config.tokenizers.find((r)=>r.from == t);
            return found ? found.to : t;
        });
        if (config.specializers) {
            copy.specializers = this.specializers.slice();
            copy.specializerSpecs = this.specializerSpecs.map((s, i)=>{
                let found = config.specializers.find((r)=>r.from == s.external);
                if (!found) return s;
                let spec = Object.assign(Object.assign({}, s), {
                    external: found.to
                });
                copy.specializers[i] = getSpecializer(spec);
                return spec;
            });
        }
        if (config.contextTracker) copy.context = config.contextTracker;
        if (config.dialect) copy.dialect = this.parseDialect(config.dialect);
        if (config.strict != null) copy.strict = config.strict;
        if (config.wrap) copy.wrappers = copy.wrappers.concat(config.wrap);
        if (config.bufferLength != null) copy.bufferLength = config.bufferLength;
        return copy;
    }
    /**
    Tells you whether any [parse wrappers](#lr.ParserConfig.wrap)
    are registered for this parser.
    */ hasWrappers() {
        return this.wrappers.length > 0;
    }
    /**
    Returns the name associated with a given term. This will only
    work for all terms when the parser was generated with the
    `--names` option. By default, only the names of tagged terms are
    stored.
    */ getName(term) {
        return this.termNames ? this.termNames[term] : String(term <= this.maxNode && this.nodeSet.types[term].name || term);
    }
    /**
    The eof term id is always allocated directly after the node
    types. @internal
    */ get eofTerm() {
        return this.maxNode + 1;
    }
    /**
    The type of top node produced by the parser.
    */ get topNode() {
        return this.nodeSet.types[this.top[1]];
    }
    /**
    @internal
    */ dynamicPrecedence(term) {
        let prec = this.dynamicPrecedences;
        return prec == null ? 0 : prec[term] || 0;
    }
    /**
    @internal
    */ parseDialect(dialect) {
        let values = Object.keys(this.dialects), flags = values.map(()=>false);
        if (dialect) for (let part of dialect.split(" ")){
            let id = values.indexOf(part);
            if (id >= 0) flags[id] = true;
        }
        let disabled = null;
        for(let i = 0; i < values.length; i++)if (!flags[i]) {
            for(let j = this.dialects[values[i]], id; (id = this.data[j++]) != 65535 /* Seq.End */ ;)(disabled || (disabled = new Uint8Array(this.maxTerm + 1)))[id] = 1;
        }
        return new Dialect(dialect, flags, disabled);
    }
    /**
    Used by the output of the parser generator. Not available to
    user code. @hide
    */ static deserialize(spec) {
        return new LRParser(spec);
    }
}
function pair(data, off) {
    return data[off] | data[off + 1] << 16;
}
function findFinished(stacks) {
    let best = null;
    for (let stack of stacks){
        let stopped = stack.p.stoppedAt;
        if ((stack.pos == stack.p.stream.end || stopped != null && stack.pos > stopped) && stack.p.parser.stateFlag(stack.state, 2 /* StateFlag.Accepting */ ) && (!best || best.score < stack.score)) best = stack;
    }
    return best;
}
function getSpecializer(spec) {
    if (spec.external) {
        let mask = spec.extend ? 1 /* Specialize.Extend */  : 0 /* Specialize.Specialize */ ;
        return (value, stack)=>spec.external(value, stack) << 1 | mask;
    }
    return spec.get;
}
;
}),
]);

//# sourceMappingURL=7dc3a_%40lezer_c06ccf49._.js.map