(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/pwa/node_modules/sql-formatter/dist/esm/allDialects.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
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
 //# sourceMappingURL=allDialects.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Performs expandSinglePhrase() on array
 */ __turbopack_context__.s([
    "expandPhrases",
    ()=>expandPhrases,
    "expandSinglePhrase",
    ()=>expandSinglePhrase
]);
const expandPhrases = (phrases)=>phrases.flatMap(expandSinglePhrase);
const expandSinglePhrase = (phrase)=>buildCombinations(parsePhrase(phrase)).map(stripExtraWhitespace);
const stripExtraWhitespace = (text)=>text.replace(/ +/g, ' ').trim();
const parsePhrase = (text)=>({
        type: 'mandatory_block',
        items: parseAlteration(text, 0)[0]
    });
const parseAlteration = (text, index, expectClosing)=>{
    const alterations = [];
    while(text[index]){
        const [term, newIndex] = parseConcatenation(text, index);
        alterations.push(term);
        index = newIndex;
        if (text[index] === '|') {
            index++;
        } else if (text[index] === '}' || text[index] === ']') {
            if (expectClosing !== text[index]) {
                throw new Error(`Unbalanced parenthesis in: ${text}`);
            }
            index++;
            return [
                alterations,
                index
            ];
        } else if (index === text.length) {
            if (expectClosing) {
                throw new Error(`Unbalanced parenthesis in: ${text}`);
            }
            return [
                alterations,
                index
            ];
        } else {
            throw new Error(`Unexpected "${text[index]}"`);
        }
    }
    return [
        alterations,
        index
    ];
};
const parseConcatenation = (text, index)=>{
    const items = [];
    while(true){
        const [term, newIndex] = parseTerm(text, index);
        if (term) {
            items.push(term);
            index = newIndex;
        } else {
            break;
        }
    }
    return items.length === 1 ? [
        items[0],
        index
    ] : [
        {
            type: 'concatenation',
            items
        },
        index
    ];
};
const parseTerm = (text, index)=>{
    if (text[index] === '{') {
        return parseMandatoryBlock(text, index + 1);
    } else if (text[index] === '[') {
        return parseOptionalBlock(text, index + 1);
    } else {
        let word = '';
        while(text[index] && /[A-Za-z0-9_ ]/.test(text[index])){
            word += text[index];
            index++;
        }
        return [
            word,
            index
        ];
    }
};
const parseMandatoryBlock = (text, index)=>{
    const [items, newIndex] = parseAlteration(text, index, '}');
    return [
        {
            type: 'mandatory_block',
            items
        },
        newIndex
    ];
};
const parseOptionalBlock = (text, index)=>{
    const [items, newIndex] = parseAlteration(text, index, ']');
    return [
        {
            type: 'optional_block',
            items
        },
        newIndex
    ];
};
const buildCombinations = (node)=>{
    if (typeof node === 'string') {
        return [
            node
        ];
    } else if (node.type === 'concatenation') {
        return node.items.map(buildCombinations).reduce(stringCombinations, [
            ''
        ]);
    } else if (node.type === 'mandatory_block') {
        return node.items.flatMap(buildCombinations);
    } else if (node.type === 'optional_block') {
        return [
            '',
            ...node.items.flatMap(buildCombinations)
        ];
    } else {
        throw new Error(`Unknown node type: ${node}`);
    }
};
const stringCombinations = (xs, ys)=>{
    const results = [];
    for (const x of xs){
        for (const y of ys){
            results.push(x + y);
        }
    }
    return results;
}; //# sourceMappingURL=expandPhrases.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Token type enum for all possible Token categories */ __turbopack_context__.s([
    "EOF_TOKEN",
    ()=>EOF_TOKEN,
    "TokenType",
    ()=>TokenType,
    "createEofToken",
    ()=>createEofToken,
    "isLogicalOperator",
    ()=>isLogicalOperator,
    "isReserved",
    ()=>isReserved,
    "isToken",
    ()=>isToken,
    "testToken",
    ()=>testToken
]);
var TokenType;
(function(TokenType) {
    TokenType["QUOTED_IDENTIFIER"] = "QUOTED_IDENTIFIER";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["STRING"] = "STRING";
    TokenType["VARIABLE"] = "VARIABLE";
    TokenType["RESERVED_DATA_TYPE"] = "RESERVED_DATA_TYPE";
    TokenType["RESERVED_PARAMETERIZED_DATA_TYPE"] = "RESERVED_PARAMETERIZED_DATA_TYPE";
    TokenType["RESERVED_KEYWORD"] = "RESERVED_KEYWORD";
    TokenType["RESERVED_FUNCTION_NAME"] = "RESERVED_FUNCTION_NAME";
    TokenType["RESERVED_KEYWORD_PHRASE"] = "RESERVED_KEYWORD_PHRASE";
    TokenType["RESERVED_DATA_TYPE_PHRASE"] = "RESERVED_DATA_TYPE_PHRASE";
    TokenType["RESERVED_SET_OPERATION"] = "RESERVED_SET_OPERATION";
    TokenType["RESERVED_CLAUSE"] = "RESERVED_CLAUSE";
    TokenType["RESERVED_SELECT"] = "RESERVED_SELECT";
    TokenType["RESERVED_JOIN"] = "RESERVED_JOIN";
    TokenType["ARRAY_IDENTIFIER"] = "ARRAY_IDENTIFIER";
    TokenType["ARRAY_KEYWORD"] = "ARRAY_KEYWORD";
    TokenType["CASE"] = "CASE";
    TokenType["END"] = "END";
    TokenType["WHEN"] = "WHEN";
    TokenType["ELSE"] = "ELSE";
    TokenType["THEN"] = "THEN";
    TokenType["LIMIT"] = "LIMIT";
    TokenType["BETWEEN"] = "BETWEEN";
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["XOR"] = "XOR";
    TokenType["OPERATOR"] = "OPERATOR";
    TokenType["COMMA"] = "COMMA";
    TokenType["ASTERISK"] = "ASTERISK";
    TokenType["PROPERTY_ACCESS_OPERATOR"] = "PROPERTY_ACCESS_OPERATOR";
    TokenType["OPEN_PAREN"] = "OPEN_PAREN";
    TokenType["CLOSE_PAREN"] = "CLOSE_PAREN";
    TokenType["LINE_COMMENT"] = "LINE_COMMENT";
    TokenType["BLOCK_COMMENT"] = "BLOCK_COMMENT";
    // Text between /* sql-formatter-disable */ and /* sql-formatter-enable */
    TokenType["DISABLE_COMMENT"] = "DISABLE_COMMENT";
    TokenType["NUMBER"] = "NUMBER";
    TokenType["NAMED_PARAMETER"] = "NAMED_PARAMETER";
    TokenType["QUOTED_PARAMETER"] = "QUOTED_PARAMETER";
    TokenType["NUMBERED_PARAMETER"] = "NUMBERED_PARAMETER";
    TokenType["POSITIONAL_PARAMETER"] = "POSITIONAL_PARAMETER";
    TokenType["CUSTOM_PARAMETER"] = "CUSTOM_PARAMETER";
    TokenType["DELIMITER"] = "DELIMITER";
    TokenType["EOF"] = "EOF";
})(TokenType = TokenType || (TokenType = {}));
const createEofToken = (index)=>({
        type: TokenType.EOF,
        raw: '«EOF»',
        text: '«EOF»',
        start: index
    });
const EOF_TOKEN = createEofToken(Infinity);
const testToken = (compareToken)=>(token)=>token.type === compareToken.type && token.text === compareToken.text;
const isToken = {
    ARRAY: testToken({
        text: 'ARRAY',
        type: TokenType.RESERVED_DATA_TYPE
    }),
    BY: testToken({
        text: 'BY',
        type: TokenType.RESERVED_KEYWORD
    }),
    SET: testToken({
        text: 'SET',
        type: TokenType.RESERVED_CLAUSE
    }),
    STRUCT: testToken({
        text: 'STRUCT',
        type: TokenType.RESERVED_DATA_TYPE
    }),
    WINDOW: testToken({
        text: 'WINDOW',
        type: TokenType.RESERVED_CLAUSE
    }),
    VALUES: testToken({
        text: 'VALUES',
        type: TokenType.RESERVED_CLAUSE
    })
};
const isReserved = (type)=>type === TokenType.RESERVED_DATA_TYPE || type === TokenType.RESERVED_KEYWORD || type === TokenType.RESERVED_FUNCTION_NAME || type === TokenType.RESERVED_KEYWORD_PHRASE || type === TokenType.RESERVED_DATA_TYPE_PHRASE || type === TokenType.RESERVED_CLAUSE || type === TokenType.RESERVED_SELECT || type === TokenType.RESERVED_SET_OPERATION || type === TokenType.RESERVED_JOIN || type === TokenType.ARRAY_KEYWORD || type === TokenType.CASE || type === TokenType.END || type === TokenType.WHEN || type === TokenType.ELSE || type === TokenType.THEN || type === TokenType.LIMIT || type === TokenType.BETWEEN || type === TokenType.AND || type === TokenType.OR || type === TokenType.XOR;
const isLogicalOperator = (type)=>type === TokenType.AND || type === TokenType.OR || type === TokenType.XOR; //# sourceMappingURL=token.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/bigquery/bigquery.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/aead_encryption_functions
    'KEYS.NEW_KEYSET',
    'KEYS.ADD_KEY_FROM_RAW_BYTES',
    'AEAD.DECRYPT_BYTES',
    'AEAD.DECRYPT_STRING',
    'AEAD.ENCRYPT',
    'KEYS.KEYSET_CHAIN',
    'KEYS.KEYSET_FROM_JSON',
    'KEYS.KEYSET_TO_JSON',
    'KEYS.ROTATE_KEYSET',
    'KEYS.KEYSET_LENGTH',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/aggregate_analytic_functions
    'ANY_VALUE',
    'ARRAY_AGG',
    'AVG',
    'CORR',
    'COUNT',
    'COUNTIF',
    'COVAR_POP',
    'COVAR_SAMP',
    'MAX',
    'MIN',
    'ST_CLUSTERDBSCAN',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STRING_AGG',
    'SUM',
    'VAR_POP',
    'VAR_SAMP',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/aggregate_functions
    'ANY_VALUE',
    'ARRAY_AGG',
    'ARRAY_CONCAT_AGG',
    'AVG',
    'BIT_AND',
    'BIT_OR',
    'BIT_XOR',
    'COUNT',
    'COUNTIF',
    'LOGICAL_AND',
    'LOGICAL_OR',
    'MAX',
    'MIN',
    'STRING_AGG',
    'SUM',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/approximate_aggregate_functions
    'APPROX_COUNT_DISTINCT',
    'APPROX_QUANTILES',
    'APPROX_TOP_COUNT',
    'APPROX_TOP_SUM',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/array_functions
    // 'ARRAY',
    'ARRAY_CONCAT',
    'ARRAY_LENGTH',
    'ARRAY_TO_STRING',
    'GENERATE_ARRAY',
    'GENERATE_DATE_ARRAY',
    'GENERATE_TIMESTAMP_ARRAY',
    'ARRAY_REVERSE',
    'OFFSET',
    'SAFE_OFFSET',
    'ORDINAL',
    'SAFE_ORDINAL',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/bit_functions
    'BIT_COUNT',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/conversion_functions
    // 'CASE',
    'PARSE_BIGNUMERIC',
    'PARSE_NUMERIC',
    'SAFE_CAST',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/date_functions
    'CURRENT_DATE',
    'EXTRACT',
    'DATE',
    'DATE_ADD',
    'DATE_SUB',
    'DATE_DIFF',
    'DATE_TRUNC',
    'DATE_FROM_UNIX_DATE',
    'FORMAT_DATE',
    'LAST_DAY',
    'PARSE_DATE',
    'UNIX_DATE',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/datetime_functions
    'CURRENT_DATETIME',
    'DATETIME',
    'EXTRACT',
    'DATETIME_ADD',
    'DATETIME_SUB',
    'DATETIME_DIFF',
    'DATETIME_TRUNC',
    'FORMAT_DATETIME',
    'LAST_DAY',
    'PARSE_DATETIME',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/debugging_functions
    'ERROR',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/federated_query_functions
    'EXTERNAL_QUERY',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/geography_functions
    'S2_CELLIDFROMPOINT',
    'S2_COVERINGCELLIDS',
    'ST_ANGLE',
    'ST_AREA',
    'ST_ASBINARY',
    'ST_ASGEOJSON',
    'ST_ASTEXT',
    'ST_AZIMUTH',
    'ST_BOUNDARY',
    'ST_BOUNDINGBOX',
    'ST_BUFFER',
    'ST_BUFFERWITHTOLERANCE',
    'ST_CENTROID',
    'ST_CENTROID_AGG',
    'ST_CLOSESTPOINT',
    'ST_CLUSTERDBSCAN',
    'ST_CONTAINS',
    'ST_CONVEXHULL',
    'ST_COVEREDBY',
    'ST_COVERS',
    'ST_DIFFERENCE',
    'ST_DIMENSION',
    'ST_DISJOINT',
    'ST_DISTANCE',
    'ST_DUMP',
    'ST_DWITHIN',
    'ST_ENDPOINT',
    'ST_EQUALS',
    'ST_EXTENT',
    'ST_EXTERIORRING',
    'ST_GEOGFROM',
    'ST_GEOGFROMGEOJSON',
    'ST_GEOGFROMTEXT',
    'ST_GEOGFROMWKB',
    'ST_GEOGPOINT',
    'ST_GEOGPOINTFROMGEOHASH',
    'ST_GEOHASH',
    'ST_GEOMETRYTYPE',
    'ST_INTERIORRINGS',
    'ST_INTERSECTION',
    'ST_INTERSECTS',
    'ST_INTERSECTSBOX',
    'ST_ISCOLLECTION',
    'ST_ISEMPTY',
    'ST_LENGTH',
    'ST_MAKELINE',
    'ST_MAKEPOLYGON',
    'ST_MAKEPOLYGONORIENTED',
    'ST_MAXDISTANCE',
    'ST_NPOINTS',
    'ST_NUMGEOMETRIES',
    'ST_NUMPOINTS',
    'ST_PERIMETER',
    'ST_POINTN',
    'ST_SIMPLIFY',
    'ST_SNAPTOGRID',
    'ST_STARTPOINT',
    'ST_TOUCHES',
    'ST_UNION',
    'ST_UNION_AGG',
    'ST_WITHIN',
    'ST_X',
    'ST_Y',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/hash_functions
    'FARM_FINGERPRINT',
    'MD5',
    'SHA1',
    'SHA256',
    'SHA512',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/hll_functions
    'HLL_COUNT.INIT',
    'HLL_COUNT.MERGE',
    'HLL_COUNT.MERGE_PARTIAL',
    'HLL_COUNT.EXTRACT',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/interval_functions
    'MAKE_INTERVAL',
    'EXTRACT',
    'JUSTIFY_DAYS',
    'JUSTIFY_HOURS',
    'JUSTIFY_INTERVAL',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/json_functions
    'JSON_EXTRACT',
    'JSON_QUERY',
    'JSON_EXTRACT_SCALAR',
    'JSON_VALUE',
    'JSON_EXTRACT_ARRAY',
    'JSON_QUERY_ARRAY',
    'JSON_EXTRACT_STRING_ARRAY',
    'JSON_VALUE_ARRAY',
    'TO_JSON_STRING',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/mathematical_functions
    'ABS',
    'SIGN',
    'IS_INF',
    'IS_NAN',
    'IEEE_DIVIDE',
    'RAND',
    'SQRT',
    'POW',
    'POWER',
    'EXP',
    'LN',
    'LOG',
    'LOG10',
    'GREATEST',
    'LEAST',
    'DIV',
    'SAFE_DIVIDE',
    'SAFE_MULTIPLY',
    'SAFE_NEGATE',
    'SAFE_ADD',
    'SAFE_SUBTRACT',
    'MOD',
    'ROUND',
    'TRUNC',
    'CEIL',
    'CEILING',
    'FLOOR',
    'COS',
    'COSH',
    'ACOS',
    'ACOSH',
    'SIN',
    'SINH',
    'ASIN',
    'ASINH',
    'TAN',
    'TANH',
    'ATAN',
    'ATANH',
    'ATAN2',
    'RANGE_BUCKET',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/navigation_functions
    'FIRST_VALUE',
    'LAST_VALUE',
    'NTH_VALUE',
    'LEAD',
    'LAG',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/net_functions
    'NET.IP_FROM_STRING',
    'NET.SAFE_IP_FROM_STRING',
    'NET.IP_TO_STRING',
    'NET.IP_NET_MASK',
    'NET.IP_TRUNC',
    'NET.IPV4_FROM_INT64',
    'NET.IPV4_TO_INT64',
    'NET.HOST',
    'NET.PUBLIC_SUFFIX',
    'NET.REG_DOMAIN',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/numbering_functions
    'RANK',
    'DENSE_RANK',
    'PERCENT_RANK',
    'CUME_DIST',
    'NTILE',
    'ROW_NUMBER',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/security_functions
    'SESSION_USER',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/statistical_aggregate_functions
    'CORR',
    'COVAR_POP',
    'COVAR_SAMP',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STDDEV',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/string_functions
    'ASCII',
    'BYTE_LENGTH',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'CHR',
    'CODE_POINTS_TO_BYTES',
    'CODE_POINTS_TO_STRING',
    'CONCAT',
    'CONTAINS_SUBSTR',
    'ENDS_WITH',
    'FORMAT',
    'FROM_BASE32',
    'FROM_BASE64',
    'FROM_HEX',
    'INITCAP',
    'INSTR',
    'LEFT',
    'LENGTH',
    'LPAD',
    'LOWER',
    'LTRIM',
    'NORMALIZE',
    'NORMALIZE_AND_CASEFOLD',
    'OCTET_LENGTH',
    'REGEXP_CONTAINS',
    'REGEXP_EXTRACT',
    'REGEXP_EXTRACT_ALL',
    'REGEXP_INSTR',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'REPLACE',
    'REPEAT',
    'REVERSE',
    'RIGHT',
    'RPAD',
    'RTRIM',
    'SAFE_CONVERT_BYTES_TO_STRING',
    'SOUNDEX',
    'SPLIT',
    'STARTS_WITH',
    'STRPOS',
    'SUBSTR',
    'SUBSTRING',
    'TO_BASE32',
    'TO_BASE64',
    'TO_CODE_POINTS',
    'TO_HEX',
    'TRANSLATE',
    'TRIM',
    'UNICODE',
    'UPPER',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/time_functions
    'CURRENT_TIME',
    'TIME',
    'EXTRACT',
    'TIME_ADD',
    'TIME_SUB',
    'TIME_DIFF',
    'TIME_TRUNC',
    'FORMAT_TIME',
    'PARSE_TIME',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/timestamp_functions
    'CURRENT_TIMESTAMP',
    'EXTRACT',
    'STRING',
    'TIMESTAMP',
    'TIMESTAMP_ADD',
    'TIMESTAMP_SUB',
    'TIMESTAMP_DIFF',
    'TIMESTAMP_TRUNC',
    'FORMAT_TIMESTAMP',
    'PARSE_TIMESTAMP',
    'TIMESTAMP_SECONDS',
    'TIMESTAMP_MILLIS',
    'TIMESTAMP_MICROS',
    'UNIX_SECONDS',
    'UNIX_MILLIS',
    'UNIX_MICROS',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/uuid_functions
    'GENERATE_UUID',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/conditional_expressions
    'COALESCE',
    'IF',
    'IFNULL',
    'NULLIF',
    // https://cloud.google.com/bigquery/docs/reference/legacy-sql
    // legacyAggregate
    'AVG',
    'BIT_AND',
    'BIT_OR',
    'BIT_XOR',
    'CORR',
    'COUNT',
    'COVAR_POP',
    'COVAR_SAMP',
    'EXACT_COUNT_DISTINCT',
    'FIRST',
    'GROUP_CONCAT',
    'GROUP_CONCAT_UNQUOTED',
    'LAST',
    'MAX',
    'MIN',
    'NEST',
    'NTH',
    'QUANTILES',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'SUM',
    'TOP',
    'UNIQUE',
    'VARIANCE',
    'VAR_POP',
    'VAR_SAMP',
    // legacyBitwise
    'BIT_COUNT',
    // legacyCasting
    'BOOLEAN',
    'BYTES',
    'CAST',
    'FLOAT',
    'HEX_STRING',
    'INTEGER',
    'STRING',
    // legacyComparison
    // expr 'IN',
    'COALESCE',
    'GREATEST',
    'IFNULL',
    'IS_INF',
    'IS_NAN',
    'IS_EXPLICITLY_DEFINED',
    'LEAST',
    'NVL',
    // legacyDatetime
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'DATE',
    'DATE_ADD',
    'DATEDIFF',
    'DAY',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'FORMAT_UTC_USEC',
    'HOUR',
    'MINUTE',
    'MONTH',
    'MSEC_TO_TIMESTAMP',
    'NOW',
    'PARSE_UTC_USEC',
    'QUARTER',
    'SEC_TO_TIMESTAMP',
    'SECOND',
    'STRFTIME_UTC_USEC',
    'TIME',
    'TIMESTAMP',
    'TIMESTAMP_TO_MSEC',
    'TIMESTAMP_TO_SEC',
    'TIMESTAMP_TO_USEC',
    'USEC_TO_TIMESTAMP',
    'UTC_USEC_TO_DAY',
    'UTC_USEC_TO_HOUR',
    'UTC_USEC_TO_MONTH',
    'UTC_USEC_TO_WEEK',
    'UTC_USEC_TO_YEAR',
    'WEEK',
    'YEAR',
    // legacyIp
    'FORMAT_IP',
    'PARSE_IP',
    'FORMAT_PACKED_IP',
    'PARSE_PACKED_IP',
    // legacyJson
    'JSON_EXTRACT',
    'JSON_EXTRACT_SCALAR',
    // legacyMath
    'ABS',
    'ACOS',
    'ACOSH',
    'ASIN',
    'ASINH',
    'ATAN',
    'ATANH',
    'ATAN2',
    'CEIL',
    'COS',
    'COSH',
    'DEGREES',
    'EXP',
    'FLOOR',
    'LN',
    'LOG',
    'LOG2',
    'LOG10',
    'PI',
    'POW',
    'RADIANS',
    'RAND',
    'ROUND',
    'SIN',
    'SINH',
    'SQRT',
    'TAN',
    'TANH',
    // legacyRegex
    'REGEXP_MATCH',
    'REGEXP_EXTRACT',
    'REGEXP_REPLACE',
    // legacyString
    'CONCAT',
    // expr CONTAINS 'str'
    'INSTR',
    'LEFT',
    'LENGTH',
    'LOWER',
    'LPAD',
    'LTRIM',
    'REPLACE',
    'RIGHT',
    'RPAD',
    'RTRIM',
    'SPLIT',
    'SUBSTR',
    'UPPER',
    // legacyTableWildcard
    'TABLE_DATE_RANGE',
    'TABLE_DATE_RANGE_STRICT',
    'TABLE_QUERY',
    // legacyUrl
    'HOST',
    'DOMAIN',
    'TLD',
    // legacyWindow
    'AVG',
    'COUNT',
    'MAX',
    'MIN',
    'STDDEV',
    'SUM',
    'CUME_DIST',
    'DENSE_RANK',
    'FIRST_VALUE',
    'LAG',
    'LAST_VALUE',
    'LEAD',
    'NTH_VALUE',
    'NTILE',
    'PERCENT_RANK',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'RANK',
    'RATIO_TO_REPORT',
    'ROW_NUMBER',
    // legacyMisc
    'CURRENT_USER',
    'EVERY',
    'FROM_BASE64',
    'HASH',
    'FARM_FINGERPRINT',
    'IF',
    'POSITION',
    'SHA1',
    'SOME',
    'TO_BASE64',
    // other
    'BQ.JOBS.CANCEL',
    'BQ.REFRESH_MATERIALIZED_VIEW',
    // ddl
    'OPTIONS',
    // pivot
    'PIVOT',
    'UNPIVOT'
]; //# sourceMappingURL=bigquery.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/bigquery/bigquery.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#reserved_keywords
    'ALL',
    'AND',
    'ANY',
    'AS',
    'ASC',
    'ASSERT_ROWS_MODIFIED',
    'AT',
    'BETWEEN',
    'BY',
    'CASE',
    'CAST',
    'COLLATE',
    'CONTAINS',
    'CREATE',
    'CROSS',
    'CUBE',
    'CURRENT',
    'DEFAULT',
    'DEFINE',
    'DESC',
    'DISTINCT',
    'ELSE',
    'END',
    'ENUM',
    'ESCAPE',
    'EXCEPT',
    'EXCLUDE',
    'EXISTS',
    'EXTRACT',
    'FALSE',
    'FETCH',
    'FOLLOWING',
    'FOR',
    'FROM',
    'FULL',
    'GROUP',
    'GROUPING',
    'GROUPS',
    'HASH',
    'HAVING',
    'IF',
    'IGNORE',
    'IN',
    'INNER',
    'INTERSECT',
    'INTO',
    'IS',
    'JOIN',
    'LATERAL',
    'LEFT',
    'LIMIT',
    'LOOKUP',
    'MERGE',
    'NATURAL',
    'NEW',
    'NO',
    'NOT',
    'NULL',
    'NULLS',
    'OF',
    'ON',
    'OR',
    'ORDER',
    'OUTER',
    'OVER',
    'PARTITION',
    'PRECEDING',
    'PROTO',
    'RANGE',
    'RECURSIVE',
    'RESPECT',
    'RIGHT',
    'ROLLUP',
    'ROWS',
    'SELECT',
    'SET',
    'SOME',
    'TABLE',
    'TABLESAMPLE',
    'THEN',
    'TO',
    'TREAT',
    'TRUE',
    'UNBOUNDED',
    'UNION',
    'UNNEST',
    'USING',
    'WHEN',
    'WHERE',
    'WINDOW',
    'WITH',
    'WITHIN',
    // misc
    'SAFE',
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language
    'LIKE',
    'COPY',
    'CLONE',
    'IN',
    'OUT',
    'INOUT',
    'RETURNS',
    'LANGUAGE',
    'CASCADE',
    'RESTRICT',
    'DETERMINISTIC'
];
const dataTypes = [
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types
    'ARRAY',
    'BOOL',
    'BYTES',
    'DATE',
    'DATETIME',
    'GEOGRAPHY',
    'INTERVAL',
    'INT64',
    'INT',
    'SMALLINT',
    'INTEGER',
    'BIGINT',
    'TINYINT',
    'BYTEINT',
    'NUMERIC',
    'DECIMAL',
    'BIGNUMERIC',
    'BIGDECIMAL',
    'FLOAT64',
    'STRING',
    'STRUCT',
    'TIME',
    'TIMEZONE'
]; //# sourceMappingURL=bigquery.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/bigquery/bigquery.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bigquery",
    ()=>bigquery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/bigquery/bigquery.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/bigquery/bigquery.keywords.js [app-client] (ecmascript)");
;
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT] [AS STRUCT | AS VALUE]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // Queries: https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'QUALIFY',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'OMIT RECORD IF',
    // Data modification: https://cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax
    // - insert:
    'INSERT [INTO]',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE [INTO]',
    'WHEN [NOT] MATCHED [BY SOURCE | BY TARGET] [THEN]',
    'UPDATE SET',
    'CLUSTER BY',
    'FOR SYSTEM_TIME AS OF',
    'WITH CONNECTION',
    'WITH PARTITION COLUMNS',
    'REMOTE WITH CONNECTION'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [OR REPLACE] [TEMP|TEMPORARY|SNAPSHOT|EXTERNAL] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language
    'CREATE [OR REPLACE] [MATERIALIZED] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE',
    // - delete:
    'DELETE [FROM]',
    // - drop table:
    'DROP [SNAPSHOT | EXTERNAL] TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE [IF EXISTS]',
    'ADD COLUMN [IF NOT EXISTS]',
    'DROP COLUMN [IF EXISTS]',
    'RENAME TO',
    'ALTER COLUMN [IF EXISTS]',
    'SET DEFAULT COLLATE',
    'SET OPTIONS',
    'DROP NOT NULL',
    'SET DATA TYPE',
    // - alter schema
    'ALTER SCHEMA [IF EXISTS]',
    // - alter view
    'ALTER [MATERIALIZED] VIEW [IF EXISTS]',
    // - alter bi_capacity
    'ALTER BI_CAPACITY',
    // - truncate:
    'TRUNCATE TABLE',
    // - create schema
    'CREATE SCHEMA [IF NOT EXISTS]',
    'DEFAULT COLLATE',
    // stored procedures
    'CREATE [OR REPLACE] [TEMP|TEMPORARY|TABLE] FUNCTION [IF NOT EXISTS]',
    'CREATE [OR REPLACE] PROCEDURE [IF NOT EXISTS]',
    // row access policy
    'CREATE [OR REPLACE] ROW ACCESS POLICY [IF NOT EXISTS]',
    'GRANT TO',
    'FILTER USING',
    // capacity
    'CREATE CAPACITY',
    'AS JSON',
    // reservation
    'CREATE RESERVATION',
    // assignment
    'CREATE ASSIGNMENT',
    // search index
    'CREATE SEARCH INDEX [IF NOT EXISTS]',
    // drop
    'DROP SCHEMA [IF EXISTS]',
    'DROP [MATERIALIZED] VIEW [IF EXISTS]',
    'DROP [TABLE] FUNCTION [IF EXISTS]',
    'DROP PROCEDURE [IF EXISTS]',
    'DROP ROW ACCESS POLICY',
    'DROP ALL ROW ACCESS POLICIES',
    'DROP CAPACITY [IF EXISTS]',
    'DROP RESERVATION [IF EXISTS]',
    'DROP ASSIGNMENT [IF EXISTS]',
    'DROP SEARCH INDEX [IF EXISTS]',
    'DROP [IF EXISTS]',
    // DCL, https://cloud.google.com/bigquery/docs/reference/standard-sql/data-control-language
    'GRANT',
    'REVOKE',
    // Script, https://cloud.google.com/bigquery/docs/reference/standard-sql/scripting
    'DECLARE',
    'EXECUTE IMMEDIATE',
    'LOOP',
    'END LOOP',
    'REPEAT',
    'END REPEAT',
    'WHILE',
    'END WHILE',
    'BREAK',
    'LEAVE',
    'CONTINUE',
    'ITERATE',
    'FOR',
    'END FOR',
    'BEGIN',
    'BEGIN TRANSACTION',
    'COMMIT TRANSACTION',
    'ROLLBACK TRANSACTION',
    'RAISE',
    'RETURN',
    'CALL',
    // Debug, https://cloud.google.com/bigquery/docs/reference/standard-sql/debugging-statements
    'ASSERT',
    // Other, https://cloud.google.com/bigquery/docs/reference/standard-sql/other-statements
    'EXPORT DATA'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION {ALL | DISTINCT}',
    'EXCEPT DISTINCT',
    'INTERSECT DISTINCT'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#tablesample_operator
    'TABLESAMPLE SYSTEM',
    // From DDL: https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language
    'ANY TYPE',
    'ALL COLUMNS',
    'NOT DETERMINISTIC',
    // inside window definitions
    '{ROWS | RANGE} BETWEEN',
    // comparison operator
    'IS [NOT] DISTINCT FROM'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const bigquery = {
    name: 'bigquery',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...tabularOnelineClauses,
            ...standardOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        extraParens: [
            '[]'
        ],
        stringTypes: [
            // The triple-quoted strings are listed first, so they get matched first.
            // Otherwise the first two quotes of """ will get matched as an empty "" string.
            {
                quote: '""".."""',
                prefixes: [
                    'R',
                    'B',
                    'RB',
                    'BR'
                ]
            },
            {
                quote: "'''..'''",
                prefixes: [
                    'R',
                    'B',
                    'RB',
                    'BR'
                ]
            },
            '""-bs',
            "''-bs",
            {
                quote: '""-raw',
                prefixes: [
                    'R',
                    'B',
                    'RB',
                    'BR'
                ],
                requirePrefix: true
            },
            {
                quote: "''-raw",
                prefixes: [
                    'R',
                    'B',
                    'RB',
                    'BR'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            '``'
        ],
        identChars: {
            dashes: true
        },
        paramTypes: {
            positional: true,
            named: [
                '@'
            ],
            quoted: [
                '@'
            ]
        },
        variableTypes: [
            {
                regex: String.raw`@@\w+`
            }
        ],
        lineCommentTypes: [
            '--',
            '#'
        ],
        operators: [
            '&',
            '|',
            '^',
            '~',
            '>>',
            '<<',
            '||',
            '=>'
        ],
        postProcess
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
};
function postProcess(tokens) {
    return detectArraySubscripts(combineParameterizedTypes(tokens));
}
// Converts OFFSET token inside array from RESERVED_CLAUSE to RESERVED_FUNCTION_NAME
// See: https://cloud.google.com/bigquery/docs/reference/standard-sql/functions-and-operators#array_subscript_operator
function detectArraySubscripts(tokens) {
    let prevToken = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EOF_TOKEN"];
    return tokens.map((token)=>{
        if (token.text === 'OFFSET' && prevToken.text === '[') {
            prevToken = token;
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_FUNCTION_NAME
            });
        } else {
            prevToken = token;
            return token;
        }
    });
}
// Combines multiple tokens forming a parameterized type like STRUCT<ARRAY<INT64>> into a single token
function combineParameterizedTypes(tokens) {
    var _a;
    const processed = [];
    for(let i = 0; i < tokens.length; i++){
        const token = tokens[i];
        if ((__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].ARRAY(token) || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].STRUCT(token)) && ((_a = tokens[i + 1]) === null || _a === void 0 ? void 0 : _a.text) === '<') {
            const endIndex = findClosingAngleBracketIndex(tokens, i + 1);
            const typeDefTokens = tokens.slice(i, endIndex + 1);
            processed.push({
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER,
                raw: typeDefTokens.map(formatTypeDefToken('raw')).join(''),
                text: typeDefTokens.map(formatTypeDefToken('text')).join(''),
                start: token.start
            });
            i = endIndex;
        } else {
            processed.push(token);
        }
    }
    return processed;
}
const formatTypeDefToken = (key)=>(token)=>{
        if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER || token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].COMMA) {
            return token[key] + ' ';
        } else {
            return token[key];
        }
    };
function findClosingAngleBracketIndex(tokens, startIndex) {
    let level = 0;
    for(let i = startIndex; i < tokens.length; i++){
        const token = tokens[i];
        if (token.text === '<') {
            level++;
        } else if (token.text === '>') {
            level--;
        } else if (token.text === '>>') {
            level -= 2;
        }
        if (level === 0) {
            return i;
        }
    }
    return tokens.length - 1;
} //# sourceMappingURL=bigquery.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2/db2.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://www.ibm.com/docs/en/db2/11.5?topic=bif-aggregate-functions
    'ARRAY_AGG',
    'AVG',
    'CORRELATION',
    'COUNT',
    'COUNT_BIG',
    'COVARIANCE',
    'COVARIANCE_SAMP',
    'CUME_DIST',
    'GROUPING',
    'LISTAGG',
    'MAX',
    'MEDIAN',
    'MIN',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PERCENT_RANK',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_COUNT',
    'REGR_INTERCEPT',
    'REGR_ICPT',
    'REGR_R2',
    'REGR_SLOPE',
    'REGR_SXX',
    'REGR_SXY',
    'REGR_SYY',
    'STDDEV',
    'STDDEV_SAMP',
    'SUM',
    'VARIANCE',
    'VARIANCE_SAMP',
    'XMLAGG',
    'XMLGROUP',
    // https://www.ibm.com/docs/en/db2/11.5?topic=bif-scalar-functions
    'ABS',
    'ABSVAL',
    'ACOS',
    'ADD_DAYS',
    'ADD_HOURS',
    'ADD_MINUTES',
    'ADD_MONTHS',
    'ADD_SECONDS',
    'ADD_YEARS',
    'AGE',
    'ARRAY_DELETE',
    'ARRAY_FIRST',
    'ARRAY_LAST',
    'ARRAY_NEXT',
    'ARRAY_PRIOR',
    'ASCII',
    'ASCII_STR',
    'ASIN',
    'ATAN',
    'ATAN2',
    'ATANH',
    'BITAND',
    'BITANDNOT',
    'BITOR',
    'BITXOR',
    'BITNOT',
    'BPCHAR',
    'BSON_TO_JSON',
    'BTRIM',
    'CARDINALITY',
    'CEILING',
    'CEIL',
    'CHARACTER_LENGTH',
    'CHR',
    'COALESCE',
    'COLLATION_KEY',
    'COLLATION_KEY_BIT',
    'COMPARE_DECFLOAT',
    'CONCAT',
    'COS',
    'COSH',
    'COT',
    'CURSOR_ROWCOUNT',
    'DATAPARTITIONNUM',
    'DATE_PART',
    'DATE_TRUNC',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFWEEK_ISO',
    'DAYOFYEAR',
    'DAYS',
    'DAYS_BETWEEN',
    'DAYS_TO_END_OF_MONTH',
    'DBPARTITIONNUM',
    'DECFLOAT',
    'DECFLOAT_FORMAT',
    'DECODE',
    'DECRYPT_BIN',
    'DECRYPT_CHAR',
    'DEGREES',
    'DEREF',
    'DIFFERENCE',
    'DIGITS',
    'DOUBLE_PRECISION',
    'EMPTY_BLOB',
    'EMPTY_CLOB',
    'EMPTY_DBCLOB',
    'EMPTY_NCLOB',
    'ENCRYPT',
    'EVENT_MON_STATE',
    'EXP',
    'EXTRACT',
    'FIRST_DAY',
    'FLOOR',
    'FROM_UTC_TIMESTAMP',
    'GENERATE_UNIQUE',
    'GETHINT',
    'GREATEST',
    'HASH',
    'HASH4',
    'HASH8',
    'HASHEDVALUE',
    'HEX',
    'HEXTORAW',
    'HOUR',
    'HOURS_BETWEEN',
    'IDENTITY_VAL_LOCAL',
    'IFNULL',
    'INITCAP',
    'INSERT',
    'INSTR',
    'INSTR2',
    'INSTR4',
    'INSTRB',
    'INTNAND',
    'INTNOR',
    'INTNXOR',
    'INTNNOT',
    'ISNULL',
    'JSON_ARRAY',
    'JSON_OBJECT',
    'JSON_QUERY',
    'JSON_TO_BSON',
    'JSON_VALUE',
    'JULIAN_DAY',
    'LAST_DAY',
    'LCASE',
    'LEAST',
    'LEFT',
    'LENGTH',
    'LENGTH2',
    'LENGTH4',
    'LENGTHB',
    'LN',
    'LOCATE',
    'LOCATE_IN_STRING',
    'LOG10',
    'LONG_VARCHAR',
    'LONG_VARGRAPHIC',
    'LOWER',
    'LPAD',
    'LTRIM',
    'MAX',
    'MAX_CARDINALITY',
    'MICROSECOND',
    'MIDNIGHT_SECONDS',
    'MIN',
    'MINUTE',
    'MINUTES_BETWEEN',
    'MOD',
    'MONTH',
    'MONTHNAME',
    'MONTHS_BETWEEN',
    'MULTIPLY_ALT',
    'NEXT_DAY',
    'NEXT_MONTH',
    'NEXT_QUARTER',
    'NEXT_WEEK',
    'NEXT_YEAR',
    'NORMALIZE_DECFLOAT',
    'NOW',
    'NULLIF',
    'NVL',
    'NVL2',
    'OCTET_LENGTH',
    'OVERLAY',
    'PARAMETER',
    'POSITION',
    'POSSTR',
    'POW',
    'POWER',
    'QUANTIZE',
    'QUARTER',
    'QUOTE_IDENT',
    'QUOTE_LITERAL',
    'RADIANS',
    'RAISE_ERROR',
    'RAND',
    'RANDOM',
    'RAWTOHEX',
    'REC2XML',
    'REGEXP_COUNT',
    'REGEXP_EXTRACT',
    'REGEXP_INSTR',
    'REGEXP_LIKE',
    'REGEXP_MATCH_COUNT',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'REPEAT',
    'REPLACE',
    'RID',
    'RID_BIT',
    'RIGHT',
    'ROUND',
    'ROUND_TIMESTAMP',
    'RPAD',
    'RTRIM',
    'SECLABEL',
    'SECLABEL_BY_NAME',
    'SECLABEL_TO_CHAR',
    'SECOND',
    'SECONDS_BETWEEN',
    'SIGN',
    'SIN',
    'SINH',
    'SOUNDEX',
    'SPACE',
    'SQRT',
    'STRIP',
    'STRLEFT',
    'STRPOS',
    'STRRIGHT',
    'SUBSTR',
    'SUBSTR2',
    'SUBSTR4',
    'SUBSTRB',
    'SUBSTRING',
    'TABLE_NAME',
    'TABLE_SCHEMA',
    'TAN',
    'TANH',
    'THIS_MONTH',
    'THIS_QUARTER',
    'THIS_WEEK',
    'THIS_YEAR',
    'TIMESTAMP_FORMAT',
    'TIMESTAMP_ISO',
    'TIMESTAMPDIFF',
    'TIMEZONE',
    'TO_CHAR',
    'TO_CLOB',
    'TO_DATE',
    'TO_HEX',
    'TO_MULTI_BYTE',
    'TO_NCHAR',
    'TO_NCLOB',
    'TO_NUMBER',
    'TO_SINGLE_BYTE',
    'TO_TIMESTAMP',
    'TO_UTC_TIMESTAMP',
    'TOTALORDER',
    'TRANSLATE',
    'TRIM',
    'TRIM_ARRAY',
    'TRUNC_TIMESTAMP',
    'TRUNCATE',
    'TRUNC',
    'TYPE_ID',
    'TYPE_NAME',
    'TYPE_SCHEMA',
    'UCASE',
    'UNICODE_STR',
    'UPPER',
    'VALUE',
    'VARCHAR_BIT_FORMAT',
    'VARCHAR_FORMAT',
    'VARCHAR_FORMAT_BIT',
    'VERIFY_GROUP_FOR_USER',
    'VERIFY_ROLE_FOR_USER',
    'VERIFY_TRUSTED_CONTEXT_ROLE_FOR_USER',
    'WEEK',
    'WEEK_ISO',
    'WEEKS_BETWEEN',
    'WIDTH_BUCKET',
    'XMLATTRIBUTES',
    'XMLCOMMENT',
    'XMLCONCAT',
    'XMLDOCUMENT',
    'XMLELEMENT',
    'XMLFOREST',
    'XMLNAMESPACES',
    'XMLPARSE',
    'XMLPI',
    'XMLQUERY',
    'XMLROW',
    'XMLSERIALIZE',
    'XMLTEXT',
    'XMLVALIDATE',
    'XMLXSROBJECTID',
    'XSLTRANSFORM',
    'YEAR',
    'YEARS_BETWEEN',
    'YMD_BETWEEN',
    // https://www.ibm.com/docs/en/db2/11.5?topic=bif-table-functions
    'BASE_TABLE',
    'JSON_TABLE',
    'UNNEST',
    'XMLTABLE',
    // https://www.ibm.com/docs/en/db2/11.5?topic=expressions-olap-specification
    // Additional function names not already present in the aggregate functions list
    'RANK',
    'DENSE_RANK',
    'NTILE',
    'LAG',
    'LEAD',
    'ROW_NUMBER',
    'FIRST_VALUE',
    'LAST_VALUE',
    'NTH_VALUE',
    'RATIO_TO_REPORT',
    // Type casting
    'CAST'
]; //# sourceMappingURL=db2.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2/db2.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://www.ibm.com/docs/en/db2/11.5?topic=sql-reserved-schema-names-reserved-words
    'ACTIVATE',
    'ADD',
    'AFTER',
    'ALIAS',
    'ALL',
    'ALLOCATE',
    'ALLOW',
    'ALTER',
    'AND',
    'ANY',
    'AS',
    'ASENSITIVE',
    'ASSOCIATE',
    'ASUTIME',
    'AT',
    'ATTRIBUTES',
    'AUDIT',
    'AUTHORIZATION',
    'AUX',
    'AUXILIARY',
    'BEFORE',
    'BEGIN',
    'BETWEEN',
    'BINARY',
    'BUFFERPOOL',
    'BY',
    'CACHE',
    'CALL',
    'CALLED',
    'CAPTURE',
    'CARDINALITY',
    'CASCADED',
    'CASE',
    'CAST',
    'CHECK',
    'CLONE',
    'CLOSE',
    'CLUSTER',
    'COLLECTION',
    'COLLID',
    'COLUMN',
    'COMMENT',
    'COMMIT',
    'CONCAT',
    'CONDITION',
    'CONNECT',
    'CONNECTION',
    'CONSTRAINT',
    'CONTAINS',
    'CONTINUE',
    'COUNT',
    'COUNT_BIG',
    'CREATE',
    'CROSS',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_LC_CTYPE',
    'CURRENT_PATH',
    'CURRENT_SCHEMA',
    'CURRENT_SERVER',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_TIMEZONE',
    'CURRENT_USER',
    'CURSOR',
    'CYCLE',
    'DATA',
    'DATABASE',
    'DATAPARTITIONNAME',
    'DATAPARTITIONNUM',
    'DAY',
    'DAYS',
    'DB2GENERAL',
    'DB2GENRL',
    'DB2SQL',
    'DBINFO',
    'DBPARTITIONNAME',
    'DBPARTITIONNUM',
    'DEALLOCATE',
    'DECLARE',
    'DEFAULT',
    'DEFAULTS',
    'DEFINITION',
    'DELETE',
    'DENSERANK',
    'DENSE_RANK',
    'DESCRIBE',
    'DESCRIPTOR',
    'DETERMINISTIC',
    'DIAGNOSTICS',
    'DISABLE',
    'DISALLOW',
    'DISCONNECT',
    'DISTINCT',
    'DO',
    'DOCUMENT',
    'DROP',
    'DSSIZE',
    'DYNAMIC',
    'EACH',
    'EDITPROC',
    'ELSE',
    'ELSEIF',
    'ENABLE',
    'ENCODING',
    'ENCRYPTION',
    'END',
    'END-EXEC',
    'ENDING',
    'ERASE',
    'ESCAPE',
    'EVERY',
    'EXCEPT',
    'EXCEPTION',
    'EXCLUDING',
    'EXCLUSIVE',
    'EXECUTE',
    'EXISTS',
    'EXIT',
    'EXPLAIN',
    'EXTENDED',
    'EXTERNAL',
    'EXTRACT',
    'FENCED',
    'FETCH',
    'FIELDPROC',
    'FILE',
    'FINAL',
    'FIRST1',
    'FOR',
    'FOREIGN',
    'FREE',
    'FROM',
    'FULL',
    'FUNCTION',
    'GENERAL',
    'GENERATED',
    'GET',
    'GLOBAL',
    'GO',
    'GOTO',
    'GRANT',
    'GRAPHIC',
    'GROUP',
    'HANDLER',
    'HASH',
    'HASHED_VALUE',
    'HAVING',
    'HINT',
    'HOLD',
    'HOUR',
    'HOURS',
    'IDENTITY',
    'IF',
    'IMMEDIATE',
    'IMPORT',
    'IN',
    'INCLUDING',
    'INCLUSIVE',
    'INCREMENT',
    'INDEX',
    'INDICATOR',
    'INDICATORS',
    'INF',
    'INFINITY',
    'INHERIT',
    'INNER',
    'INOUT',
    'INSENSITIVE',
    'INSERT',
    'INTEGRITY',
    'INTERSECT',
    'INTO',
    'IS',
    'ISNULL',
    'ISOBID',
    'ISOLATION',
    'ITERATE',
    'JAR',
    'JAVA',
    'JOIN',
    'KEEP',
    'KEY',
    'LABEL',
    'LANGUAGE',
    'LAST3',
    'LATERAL',
    'LC_CTYPE',
    'LEAVE',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LINKTYPE',
    'LOCAL',
    'LOCALDATE',
    'LOCALE',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCATOR',
    'LOCATORS',
    'LOCK',
    'LOCKMAX',
    'LOCKSIZE',
    'LOOP',
    'MAINTAINED',
    'MATERIALIZED',
    'MAXVALUE',
    'MICROSECOND',
    'MICROSECONDS',
    'MINUTE',
    'MINUTES',
    'MINVALUE',
    'MODE',
    'MODIFIES',
    'MONTH',
    'MONTHS',
    'NAN',
    'NEW',
    'NEW_TABLE',
    'NEXTVAL',
    'NO',
    'NOCACHE',
    'NOCYCLE',
    'NODENAME',
    'NODENUMBER',
    'NOMAXVALUE',
    'NOMINVALUE',
    'NONE',
    'NOORDER',
    'NORMALIZED',
    'NOT2',
    'NOTNULL',
    'NULL',
    'NULLS',
    'NUMPARTS',
    'OBID',
    'OF',
    'OFF',
    'OFFSET',
    'OLD',
    'OLD_TABLE',
    'ON',
    'OPEN',
    'OPTIMIZATION',
    'OPTIMIZE',
    'OPTION',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OVER',
    'OVERRIDING',
    'PACKAGE',
    'PADDED',
    'PAGESIZE',
    'PARAMETER',
    'PART',
    'PARTITION',
    'PARTITIONED',
    'PARTITIONING',
    'PARTITIONS',
    'PASSWORD',
    'PATH',
    'PERCENT',
    'PIECESIZE',
    'PLAN',
    'POSITION',
    'PRECISION',
    'PREPARE',
    'PREVVAL',
    'PRIMARY',
    'PRIQTY',
    'PRIVILEGES',
    'PROCEDURE',
    'PROGRAM',
    'PSID',
    'PUBLIC',
    'QUERY',
    'QUERYNO',
    'RANGE',
    'RANK',
    'READ',
    'READS',
    'RECOVERY',
    'REFERENCES',
    'REFERENCING',
    'REFRESH',
    'RELEASE',
    'RENAME',
    'REPEAT',
    'RESET',
    'RESIGNAL',
    'RESTART',
    'RESTRICT',
    'RESULT',
    'RESULT_SET_LOCATOR',
    'RETURN',
    'RETURNS',
    'REVOKE',
    'RIGHT',
    'ROLE',
    'ROLLBACK',
    'ROUND_CEILING',
    'ROUND_DOWN',
    'ROUND_FLOOR',
    'ROUND_HALF_DOWN',
    'ROUND_HALF_EVEN',
    'ROUND_HALF_UP',
    'ROUND_UP',
    'ROUTINE',
    'ROW',
    'ROWNUMBER',
    'ROWS',
    'ROWSET',
    'ROW_NUMBER',
    'RRN',
    'RUN',
    'SAVEPOINT',
    'SCHEMA',
    'SCRATCHPAD',
    'SCROLL',
    'SEARCH',
    'SECOND',
    'SECONDS',
    'SECQTY',
    'SECURITY',
    'SELECT',
    'SENSITIVE',
    'SEQUENCE',
    'SESSION',
    'SESSION_USER',
    'SET',
    'SIGNAL',
    'SIMPLE',
    'SNAN',
    'SOME',
    'SOURCE',
    'SPECIFIC',
    'SQL',
    'SQLID',
    'STACKED',
    'STANDARD',
    'START',
    'STARTING',
    'STATEMENT',
    'STATIC',
    'STATMENT',
    'STAY',
    'STOGROUP',
    'STORES',
    'STYLE',
    'SUBSTRING',
    'SUMMARY',
    'SYNONYM',
    'SYSFUN',
    'SYSIBM',
    'SYSPROC',
    'SYSTEM',
    'SYSTEM_USER',
    'TABLE',
    'TABLESPACE',
    'THEN',
    'TO',
    'TRANSACTION',
    'TRIGGER',
    'TRIM',
    'TRUNCATE',
    'TYPE',
    'UNDO',
    'UNION',
    'UNIQUE',
    'UNTIL',
    'UPDATE',
    'USAGE',
    'USER',
    'USING',
    'VALIDPROC',
    'VALUE',
    'VALUES',
    'VARIABLE',
    'VARIANT',
    'VCAT',
    'VERSION',
    'VIEW',
    'VOLATILE',
    'VOLUMES',
    'WHEN',
    'WHENEVER',
    'WHERE',
    'WHILE',
    'WITH',
    'WITHOUT',
    'WLM',
    'WRITE',
    'XMLELEMENT',
    'XMLEXISTS',
    'XMLNAMESPACES',
    'YEAR',
    'YEARS'
];
const dataTypes = [
    // https://www.ibm.com/docs/en/db2-for-zos/12?topic=columns-data-types
    'ARRAY',
    'BIGINT',
    'BINARY',
    'BLOB',
    'BOOLEAN',
    'CCSID',
    'CHAR',
    'CHARACTER',
    'CLOB',
    'DATE',
    'DATETIME',
    'DBCLOB',
    'DEC',
    'DECIMAL',
    'DOUBLE',
    'DOUBLE PRECISION',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'GRAPHIC',
    'INT',
    'INT2',
    'INT4',
    'INT8',
    'INTEGER',
    'INTERVAL',
    'LONG VARCHAR',
    'LONG VARGRAPHIC',
    'NCHAR',
    'NCHR',
    'NCLOB',
    'NVARCHAR',
    'NUMERIC',
    'SMALLINT',
    'REAL',
    'TIME',
    'TIMESTAMP',
    'VARBINARY',
    'VARCHAR',
    'VARGRAPHIC'
]; //# sourceMappingURL=db2.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2/db2.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db2",
    ()=>db2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2/db2.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2/db2.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'PARTITION BY',
    'ORDER BY [INPUT SEQUENCE]',
    'LIMIT',
    'OFFSET',
    'FETCH NEXT',
    'FOR UPDATE [OF]',
    'FOR {READ | FETCH} ONLY',
    'FOR {RR | CS | UR | RS} [USE AND KEEP {SHARE | UPDATE | EXCLUSIVE} LOCKS]',
    'WAIT FOR OUTCOME',
    'SKIP LOCKED DATA',
    'INTO',
    // Data modification
    // - insert:
    'INSERT INTO',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE INTO',
    'WHEN [NOT] MATCHED [THEN]',
    'UPDATE SET',
    'INSERT'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [GLOBAL TEMPORARY | EXTERNAL] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] VIEW',
    // - update:
    'UPDATE',
    'WHERE CURRENT OF',
    'WITH {RR | RS | CS | UR}',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // alter table:
    'ALTER TABLE',
    'ADD [COLUMN]',
    'DROP [COLUMN]',
    'RENAME COLUMN',
    'ALTER [COLUMN]',
    'SET DATA TYPE',
    'SET NOT NULL',
    'DROP {DEFAULT | GENERATED | NOT NULL}',
    // - truncate:
    'TRUNCATE [TABLE]',
    // https://www.ibm.com/docs/en/db2/11.5?topic=s-statements
    'ALLOCATE',
    'ALTER AUDIT POLICY',
    'ALTER BUFFERPOOL',
    'ALTER DATABASE PARTITION GROUP',
    'ALTER DATABASE',
    'ALTER EVENT MONITOR',
    'ALTER FUNCTION',
    'ALTER HISTOGRAM TEMPLATE',
    'ALTER INDEX',
    'ALTER MASK',
    'ALTER METHOD',
    'ALTER MODULE',
    'ALTER NICKNAME',
    'ALTER PACKAGE',
    'ALTER PERMISSION',
    'ALTER PROCEDURE',
    'ALTER SCHEMA',
    'ALTER SECURITY LABEL COMPONENT',
    'ALTER SECURITY POLICY',
    'ALTER SEQUENCE',
    'ALTER SERVER',
    'ALTER SERVICE CLASS',
    'ALTER STOGROUP',
    'ALTER TABLESPACE',
    'ALTER THRESHOLD',
    'ALTER TRIGGER',
    'ALTER TRUSTED CONTEXT',
    'ALTER TYPE',
    'ALTER USAGE LIST',
    'ALTER USER MAPPING',
    'ALTER VIEW',
    'ALTER WORK ACTION SET',
    'ALTER WORK CLASS SET',
    'ALTER WORKLOAD',
    'ALTER WRAPPER',
    'ALTER XSROBJECT',
    'ALTER STOGROUP',
    'ALTER TABLESPACE',
    'ALTER TRIGGER',
    'ALTER TRUSTED CONTEXT',
    'ALTER VIEW',
    'ASSOCIATE [RESULT SET] {LOCATOR | LOCATORS}',
    'AUDIT',
    'BEGIN DECLARE SECTION',
    'CALL',
    'CLOSE',
    'COMMENT ON',
    'COMMIT [WORK]',
    'CONNECT',
    'CREATE [OR REPLACE] [PUBLIC] ALIAS',
    'CREATE AUDIT POLICY',
    'CREATE BUFFERPOOL',
    'CREATE DATABASE PARTITION GROUP',
    'CREATE EVENT MONITOR',
    'CREATE [OR REPLACE] FUNCTION',
    'CREATE FUNCTION MAPPING',
    'CREATE HISTOGRAM TEMPLATE',
    'CREATE [UNIQUE] INDEX',
    'CREATE INDEX EXTENSION',
    'CREATE [OR REPLACE] MASK',
    'CREATE [SPECIFIC] METHOD',
    'CREATE [OR REPLACE] MODULE',
    'CREATE [OR REPLACE] NICKNAME',
    'CREATE [OR REPLACE] PERMISSION',
    'CREATE [OR REPLACE] PROCEDURE',
    'CREATE ROLE',
    'CREATE SCHEMA',
    'CREATE SECURITY LABEL [COMPONENT]',
    'CREATE SECURITY POLICY',
    'CREATE [OR REPLACE] SEQUENCE',
    'CREATE SERVICE CLASS',
    'CREATE SERVER',
    'CREATE STOGROUP',
    'CREATE SYNONYM',
    'CREATE [LARGE | REGULAR | {SYSTEM | USER} TEMPORARY] TABLESPACE',
    'CREATE THRESHOLD',
    'CREATE {TRANSFORM | TRANSFORMS} FOR',
    'CREATE [OR REPLACE] TRIGGER',
    'CREATE TRUSTED CONTEXT',
    'CREATE [OR REPLACE] TYPE',
    'CREATE TYPE MAPPING',
    'CREATE USAGE LIST',
    'CREATE USER MAPPING FOR',
    'CREATE [OR REPLACE] VARIABLE',
    'CREATE WORK ACTION SET',
    'CREATE WORK CLASS SET',
    'CREATE WORKLOAD',
    'CREATE WRAPPER',
    'DECLARE',
    'DECLARE GLOBAL TEMPORARY TABLE',
    'DESCRIBE [INPUT | OUTPUT]',
    'DISCONNECT',
    'DROP [PUBLIC] ALIAS',
    'DROP AUDIT POLICY',
    'DROP BUFFERPOOL',
    'DROP DATABASE PARTITION GROUP',
    'DROP EVENT MONITOR',
    'DROP [SPECIFIC] FUNCTION',
    'DROP FUNCTION MAPPING',
    'DROP HISTOGRAM TEMPLATE',
    'DROP INDEX [EXTENSION]',
    'DROP MASK',
    'DROP [SPECIFIC] METHOD',
    'DROP MODULE',
    'DROP NICKNAME',
    'DROP PACKAGE',
    'DROP PERMISSION',
    'DROP [SPECIFIC] PROCEDURE',
    'DROP ROLE',
    'DROP SCHEMA',
    'DROP SECURITY LABEL [COMPONENT]',
    'DROP SECURITY POLICY',
    'DROP SEQUENCE',
    'DROP SERVER',
    'DROP SERVICE CLASS',
    'DROP STOGROUP',
    'DROP TABLE HIERARCHY',
    'DROP {TABLESPACE | TABLESPACES}',
    'DROP {TRANSFORM | TRANSFORMS}',
    'DROP THRESHOLD',
    'DROP TRIGGER',
    'DROP TRUSTED CONTEXT',
    'DROP TYPE [MAPPING]',
    'DROP USAGE LIST',
    'DROP USER MAPPING FOR',
    'DROP VARIABLE',
    'DROP VIEW [HIERARCHY]',
    'DROP WORK {ACTION | CLASS} SET',
    'DROP WORKLOAD',
    'DROP WRAPPER',
    'DROP XSROBJECT',
    'END DECLARE SECTION',
    'EXECUTE [IMMEDIATE]',
    'EXPLAIN {PLAN [SECTION] | ALL}',
    'FETCH [FROM]',
    'FLUSH {BUFFERPOOL | BUFFERPOOLS} ALL',
    'FLUSH EVENT MONITOR',
    'FLUSH FEDERATED CACHE',
    'FLUSH OPTIMIZATION PROFILE CACHE',
    'FLUSH PACKAGE CACHE [DYNAMIC]',
    'FLUSH AUTHENTICATION CACHE [FOR ALL]',
    'FREE LOCATOR',
    'GET DIAGNOSTICS',
    'GOTO',
    'GRANT',
    'INCLUDE',
    'ITERATE',
    'LEAVE',
    'LOCK TABLE',
    'LOOP',
    'OPEN',
    'PIPE',
    'PREPARE',
    'REFRESH TABLE',
    'RELEASE',
    'RELEASE [TO] SAVEPOINT',
    'RENAME [TABLE | INDEX | STOGROUP | TABLESPACE]',
    'REPEAT',
    'RESIGNAL',
    'RETURN',
    'REVOKE',
    'ROLLBACK [WORK] [TO SAVEPOINT]',
    'SAVEPOINT',
    'SET COMPILATION ENVIRONMENT',
    'SET CONNECTION',
    'SET CURRENT',
    'SET ENCRYPTION PASSWORD',
    'SET EVENT MONITOR STATE',
    'SET INTEGRITY',
    'SET PASSTHRU',
    'SET PATH',
    'SET ROLE',
    'SET SCHEMA',
    'SET SERVER OPTION',
    'SET {SESSION AUTHORIZATION | SESSION_USER}',
    'SET USAGE LIST',
    'SIGNAL',
    'TRANSFER OWNERSHIP OF',
    'WHENEVER {NOT FOUND | SQLERROR | SQLWARNING}',
    'WHILE'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'EXCEPT [ALL]',
    'INTERSECT [ALL]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON DELETE',
    'ON UPDATE',
    'SET NULL',
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const db2 = {
    name: 'db2',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        extraParens: [
            '[]'
        ],
        stringTypes: [
            {
                quote: "''-qq",
                prefixes: [
                    'G',
                    'N',
                    'U&'
                ]
            },
            {
                quote: "''-raw",
                prefixes: [
                    'X',
                    'BX',
                    'GX',
                    'UX'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            `""-qq`
        ],
        identChars: {
            first: '@#$',
            rest: '@#$'
        },
        paramTypes: {
            positional: true,
            named: [
                ':'
            ]
        },
        paramChars: {
            first: '@#$',
            rest: '@#$'
        },
        operators: [
            '**',
            '%',
            '|',
            '&',
            '^',
            '~',
            '¬=',
            '¬>',
            '¬<',
            '!>',
            '!<',
            '^=',
            '^>',
            '^<',
            '||',
            '->',
            '=>'
        ]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=db2.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2i/db2i.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://www.ibm.com/docs/en/i/7.5?topic=functions-aggregate
    // TODO: 'ANY', - conflicts with test for ANY predicate in 'operators.ys'!!
    'ARRAY_AGG',
    'AVG',
    'CORR',
    'CORRELATION',
    'COUNT',
    'COUNT_BIG',
    'COVAR_POP',
    'COVARIANCE',
    'COVAR',
    'COVAR_SAMP',
    'COVARIANCE_SAMP',
    'EVERY',
    'GROUPING',
    'JSON_ARRAYAGG',
    'JSON_OBJECTAGG',
    'LISTAGG',
    'MAX',
    'MEDIAN',
    'MIN',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    // https://www.ibm.com/docs/en/i/7.5?topic=functions-regression'
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_COUNT',
    'REGR_INTERCEPT',
    'REGR_R2',
    'REGR_SLOPE',
    'REGR_SXX',
    'REGR_SXY',
    'REGR_SYY',
    'SOME',
    'STDDEV_POP',
    'STDDEV',
    'STDDEV_SAMP',
    'SUM',
    'VAR_POP',
    'VARIANCE',
    'VAR',
    'VAR_SAMP',
    'VARIANCE_SAMP',
    'XMLAGG',
    'XMLGROUP',
    // https://www.ibm.com/docs/en/i/7.5?topic=functions-scalar
    'ABS',
    'ABSVAL',
    'ACOS',
    'ADD_DAYS',
    'ADD_HOURS',
    'ADD_MINUTES',
    'ADD_MONTHS',
    'ADD_SECONDS',
    'ADD_YEARS',
    'ANTILOG',
    'ARRAY_MAX_CARDINALITY',
    'ARRAY_TRIM',
    'ASCII',
    'ASIN',
    'ATAN',
    'ATAN2',
    'ATANH',
    'BASE64_DECODE',
    'BASE64_ENCODE',
    'BIT_LENGTH',
    'BITAND',
    'BITANDNOT',
    'BITNOT',
    'BITOR',
    'BITXOR',
    'BSON_TO_JSON',
    'CARDINALITY',
    'CEIL',
    'CEILING',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'CHR',
    'COALESCE',
    'COMPARE_DECFLOAT',
    'CONCAT',
    'CONTAINS',
    'COS',
    'COSH',
    'COT',
    'CURDATE',
    'CURTIME',
    'DATABASE',
    'DATAPARTITIONNAME',
    'DATAPARTITIONNUM',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK_ISO',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'DAYS',
    'DBPARTITIONNAME',
    'DBPARTITIONNUM',
    'DECFLOAT_FORMAT',
    'DECFLOAT_SORTKEY',
    'DECRYPT_BINARY',
    'DECRYPT_BIT',
    'DECRYPT_CHAR',
    'DECRYPT_DB',
    'DEGREES',
    'DIFFERENCE',
    'DIGITS',
    'DLCOMMENT',
    'DLLINKTYPE',
    'DLURLCOMPLETE',
    'DLURLPATH',
    'DLURLPATHONLY',
    'DLURLSCHEME',
    'DLURLSERVER',
    'DLVALUE',
    'DOUBLE_PRECISION',
    'DOUBLE',
    'ENCRPYT',
    'ENCRYPT_AES',
    'ENCRYPT_AES256',
    'ENCRYPT_RC2',
    'ENCRYPT_TDES',
    'EXP',
    'EXTRACT',
    'FIRST_DAY',
    'FLOOR',
    'GENERATE_UNIQUE',
    'GET_BLOB_FROM_FILE',
    'GET_CLOB_FROM_FILE',
    'GET_DBCLOB_FROM_FILE',
    'GET_XML_FILE',
    'GETHINT',
    'GREATEST',
    'HASH_MD5',
    'HASH_ROW',
    'HASH_SHA1',
    'HASH_SHA256',
    'HASH_SHA512',
    'HASH_VALUES',
    'HASHED_VALUE',
    'HEX',
    'HEXTORAW',
    'HOUR',
    'HTML_ENTITY_DECODE',
    'HTML_ENTITY_ENCODE',
    'HTTP_DELETE_BLOB',
    'HTTP_DELETE',
    'HTTP_GET_BLOB',
    'HTTP_GET',
    'HTTP_PATCH_BLOB',
    'HTTP_PATCH',
    'HTTP_POST_BLOB',
    'HTTP_POST',
    'HTTP_PUT_BLOB',
    'HTTP_PUT',
    'IDENTITY_VAL_LOCAL',
    'IFNULL',
    'INSERT',
    'INSTR',
    'INTERPRET',
    'ISFALSE',
    'ISNOTFALSE',
    'ISNOTTRUE',
    'ISTRUE',
    'JSON_ARRAY',
    'JSON_OBJECT',
    'JSON_QUERY',
    'JSON_TO_BSON',
    'JSON_UPDATE',
    'JSON_VALUE',
    'JULIAN_DAY',
    'LAND',
    'LAST_DAY',
    'LCASE',
    'LEAST',
    'LEFT',
    'LENGTH',
    'LN',
    'LNOT',
    'LOCATE_IN_STRING',
    'LOCATE',
    'LOG10',
    'LOR',
    'LOWER',
    'LPAD',
    'LTRIM',
    'MAX_CARDINALITY',
    'MAX',
    'MICROSECOND',
    'MIDNIGHT_SECONDS',
    'MIN',
    'MINUTE',
    'MOD',
    'MONTH',
    'MONTHNAME',
    'MONTHS_BETWEEN',
    'MQREAD',
    'MQREADCLOB',
    'MQRECEIVE',
    'MQRECEIVECLOB',
    'MQSEND',
    'MULTIPLY_ALT',
    'NEXT_DAY',
    'NORMALIZE_DECFLOAT',
    'NOW',
    'NULLIF',
    'NVL',
    'OCTET_LENGTH',
    'OVERLAY',
    'PI',
    'POSITION',
    'POSSTR',
    'POW',
    'POWER',
    'QUANTIZE',
    'QUARTER',
    'RADIANS',
    'RAISE_ERROR',
    'RANDOM',
    'RAND',
    'REGEXP_COUNT',
    'REGEXP_INSTR',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'REPEAT',
    'REPLACE',
    'RID',
    'RIGHT',
    'ROUND_TIMESTAMP',
    'ROUND',
    'RPAD',
    'RRN',
    'RTRIM',
    'SCORE',
    'SECOND',
    'SIGN',
    'SIN',
    'SINH',
    'SOUNDEX',
    'SPACE',
    'SQRT',
    'STRIP',
    'STRLEFT',
    'STRPOS',
    'STRRIGHT',
    'SUBSTR',
    'SUBSTRING',
    'TABLE_NAME',
    'TABLE_SCHEMA',
    'TAN',
    'TANH',
    'TIMESTAMP_FORMAT',
    'TIMESTAMP_ISO',
    'TIMESTAMPDIFF_BIG',
    'TIMESTAMPDIFF',
    'TO_CHAR',
    'TO_CLOB',
    'TO_DATE',
    'TO_NUMBER',
    'TO_TIMESTAMP',
    'TOTALORDER',
    'TRANSLATE',
    'TRIM_ARRAY',
    'TRIM',
    'TRUNC_TIMESTAMP',
    'TRUNC',
    'TRUNCATE',
    'UCASE',
    'UPPER',
    'URL_DECODE',
    'URL_ENCODE',
    'VALUE',
    'VARBINARY_FORMAT',
    'VARCHAR_BIT_FORMAT',
    'VARCHAR_FORMAT_BINARY',
    'VARCHAR_FORMAT',
    'VERIFY_GROUP_FOR_USER',
    'WEEK_ISO',
    'WEEK',
    'WRAP',
    'XMLATTRIBUTES',
    'XMLCOMMENT',
    'XMLCONCAT',
    'XMLDOCUMENT',
    'XMLELEMENT',
    'XMLFOREST',
    'XMLNAMESPACES',
    'XMLPARSE',
    'XMLPI',
    'XMLROW',
    'XMLSERIALIZE',
    'XMLTEXT',
    'XMLVALIDATE',
    'XOR',
    'XSLTRANSFORM',
    'YEAR',
    'ZONED',
    // https://www.ibm.com/docs/en/i/7.5?topic=functions-table
    'BASE_TABLE',
    'HTTP_DELETE_BLOB_VERBOSE',
    'HTTP_DELETE_VERBOSE',
    'HTTP_GET_BLOB_VERBOSE',
    'HTTP_GET_VERBOSE',
    'HTTP_PATCH_BLOB_VERBOSE',
    'HTTP_PATCH_VERBOSE',
    'HTTP_POST_BLOB_VERBOSE',
    'HTTP_POST_VERBOSE',
    'HTTP_PUT_BLOB_VERBOSE',
    'HTTP_PUT_VERBOSE',
    'JSON_TABLE',
    'MQREADALL',
    'MQREADALLCLOB',
    'MQRECEIVEALL',
    'MQRECEIVEALLCLOB',
    'XMLTABLE',
    // https://www.ibm.com/docs/en/db2-for-zos/11?topic=functions-row
    'UNPACK',
    // https://www.ibm.com/docs/en/i/7.5?topic=expressions-olap-specifications
    'CUME_DIST',
    'DENSE_RANK',
    'FIRST_VALUE',
    'LAG',
    'LAST_VALUE',
    'LEAD',
    'NTH_VALUE',
    'NTILE',
    'PERCENT_RANK',
    'RANK',
    'RATIO_TO_REPORT',
    'ROW_NUMBER',
    // Type casting
    'CAST'
]; //# sourceMappingURL=db2i.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2i/db2i.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://www.ibm.com/docs/en/i/7.5?topic=words-reserved
    // TODO: This list likely contains all keywords, not only the reserved ones,
    // try to filter it down to just the reserved keywords.
    'ABSENT',
    'ACCORDING',
    'ACCTNG',
    'ACTION',
    'ACTIVATE',
    'ADD',
    'ALIAS',
    'ALL',
    'ALLOCATE',
    'ALLOW',
    'ALTER',
    'AND',
    'ANY',
    'APPEND',
    'APPLNAME',
    'ARRAY',
    'ARRAY_AGG',
    'ARRAY_TRIM',
    'AS',
    'ASC',
    'ASENSITIVE',
    'ASSOCIATE',
    'ATOMIC',
    'ATTACH',
    'ATTRIBUTES',
    'AUTHORIZATION',
    'AUTONOMOUS',
    'BEFORE',
    'BEGIN',
    'BETWEEN',
    'BIND',
    'BSON',
    'BUFFERPOOL',
    'BY',
    'CACHE',
    'CALL',
    'CALLED',
    'CARDINALITY',
    'CASE',
    'CAST',
    'CHECK',
    'CL',
    'CLOSE',
    'CLUSTER',
    'COLLECT',
    'COLLECTION',
    'COLUMN',
    'COMMENT',
    'COMMIT',
    'COMPACT',
    'COMPARISONS',
    'COMPRESS',
    'CONCAT',
    'CONCURRENT',
    'CONDITION',
    'CONNECT',
    'CONNECT_BY_ROOT',
    'CONNECTION',
    'CONSTANT',
    'CONSTRAINT',
    'CONTAINS',
    'CONTENT',
    'CONTINUE',
    'COPY',
    'COUNT',
    'COUNT_BIG',
    'CREATE',
    'CREATEIN',
    'CROSS',
    'CUBE',
    'CUME_DIST',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_PATH',
    'CURRENT_SCHEMA',
    'CURRENT_SERVER',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_TIMEZONE',
    'CURRENT_USER',
    'CURSOR',
    'CYCLE',
    'DATABASE',
    'DATAPARTITIONNAME',
    'DATAPARTITIONNUM',
    'DAY',
    'DAYS',
    'DB2GENERAL',
    'DB2GENRL',
    'DB2SQL',
    'DBINFO',
    'DBPARTITIONNAME',
    'DBPARTITIONNUM',
    'DEACTIVATE',
    'DEALLOCATE',
    'DECLARE',
    'DEFAULT',
    'DEFAULTS',
    'DEFER',
    'DEFINE',
    'DEFINITION',
    'DELETE',
    'DELETING',
    'DENSE_RANK',
    'DENSERANK',
    'DESC',
    'DESCRIBE',
    'DESCRIPTOR',
    'DETACH',
    'DETERMINISTIC',
    'DIAGNOSTICS',
    'DISABLE',
    'DISALLOW',
    'DISCONNECT',
    'DISTINCT',
    'DO',
    'DOCUMENT',
    'DROP',
    'DYNAMIC',
    'EACH',
    'ELSE',
    'ELSEIF',
    'EMPTY',
    'ENABLE',
    'ENCODING',
    'ENCRYPTION',
    'END',
    'END-EXEC',
    'ENDING',
    'ENFORCED',
    'ERROR',
    'ESCAPE',
    'EVERY',
    'EXCEPT',
    'EXCEPTION',
    'EXCLUDING',
    'EXCLUSIVE',
    'EXECUTE',
    'EXISTS',
    'EXIT',
    'EXTEND',
    'EXTERNAL',
    'EXTRACT',
    'FALSE',
    'FENCED',
    'FETCH',
    'FIELDPROC',
    'FILE',
    'FINAL',
    'FIRST_VALUE',
    'FOR',
    'FOREIGN',
    'FORMAT',
    'FREE',
    'FREEPAGE',
    'FROM',
    'FULL',
    'FUNCTION',
    'GBPCACHE',
    'GENERAL',
    'GENERATED',
    'GET',
    'GLOBAL',
    'GO',
    'GOTO',
    'GRANT',
    'GROUP',
    'HANDLER',
    'HASH',
    'HASH_ROW',
    'HASHED_VALUE',
    'HAVING',
    'HINT',
    'HOLD',
    'HOUR',
    'HOURS',
    // 'ID', Not actually a reserved keyword
    'IDENTITY',
    'IF',
    'IGNORE',
    'IMMEDIATE',
    'IMPLICITLY',
    'IN',
    'INCLUDE',
    'INCLUDING',
    'INCLUSIVE',
    'INCREMENT',
    'INDEX',
    'INDEXBP',
    'INDICATOR',
    'INF',
    'INFINITY',
    'INHERIT',
    'INLINE',
    'INNER',
    'INOUT',
    'INSENSITIVE',
    'INSERT',
    'INSERTING',
    'INTEGRITY',
    'INTERPRET',
    'INTERSECT',
    'INTO',
    'IS',
    'ISNULL',
    'ISOLATION',
    'ITERATE',
    'JAVA',
    'JOIN',
    'JSON',
    'JSON_ARRAY',
    'JSON_ARRAYAGG',
    'JSON_EXISTS',
    'JSON_OBJECT',
    'JSON_OBJECTAGG',
    'JSON_QUERY',
    'JSON_TABLE',
    'JSON_VALUE',
    'KEEP',
    'KEY',
    'KEYS',
    'LABEL',
    'LAG',
    'LANGUAGE',
    'LAST_VALUE',
    'LATERAL',
    'LEAD',
    'LEAVE',
    'LEFT',
    'LEVEL2',
    'LIKE',
    'LIMIT',
    'LINKTYPE',
    'LISTAGG',
    'LOCAL',
    'LOCALDATE',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCATION',
    'LOCATOR',
    'LOCK',
    'LOCKSIZE',
    'LOG',
    'LOGGED',
    'LOOP',
    'MAINTAINED',
    'MASK',
    'MATCHED',
    'MATERIALIZED',
    'MAXVALUE',
    'MERGE',
    'MICROSECOND',
    'MICROSECONDS',
    'MINPCTUSED',
    'MINUTE',
    'MINUTES',
    'MINVALUE',
    'MIRROR',
    'MIXED',
    'MODE',
    'MODIFIES',
    'MONTH',
    'MONTHS',
    'NAMESPACE',
    'NAN',
    'NATIONAL',
    'NCHAR',
    'NCLOB',
    'NESTED',
    'NEW',
    'NEW_TABLE',
    'NEXTVAL',
    'NO',
    'NOCACHE',
    'NOCYCLE',
    'NODENAME',
    'NODENUMBER',
    'NOMAXVALUE',
    'NOMINVALUE',
    'NONE',
    'NOORDER',
    'NORMALIZED',
    'NOT',
    'NOTNULL',
    'NTH_VALUE',
    'NTILE',
    'NULL',
    'NULLS',
    'NVARCHAR',
    'OBID',
    'OBJECT',
    'OF',
    'OFF',
    'OFFSET',
    'OLD',
    'OLD_TABLE',
    'OMIT',
    'ON',
    'ONLY',
    'OPEN',
    'OPTIMIZE',
    'OPTION',
    'OR',
    'ORDER',
    'ORDINALITY',
    'ORGANIZE',
    'OUT',
    'OUTER',
    'OVER',
    'OVERLAY',
    'OVERRIDING',
    'PACKAGE',
    'PADDED',
    'PAGE',
    'PAGESIZE',
    'PARAMETER',
    'PART',
    'PARTITION',
    'PARTITIONED',
    'PARTITIONING',
    'PARTITIONS',
    'PASSING',
    'PASSWORD',
    'PATH',
    'PCTFREE',
    'PERCENT_RANK',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PERIOD',
    'PERMISSION',
    'PIECESIZE',
    'PIPE',
    'PLAN',
    'POSITION',
    'PREPARE',
    'PREVVAL',
    'PRIMARY',
    'PRIOR',
    'PRIQTY',
    'PRIVILEGES',
    'PROCEDURE',
    'PROGRAM',
    'PROGRAMID',
    'QUERY',
    'RANGE',
    'RANK',
    'RATIO_TO_REPORT',
    'RCDFMT',
    'READ',
    'READS',
    'RECOVERY',
    'REFERENCES',
    'REFERENCING',
    'REFRESH',
    'REGEXP_LIKE',
    'RELEASE',
    'RENAME',
    'REPEAT',
    'RESET',
    'RESIGNAL',
    'RESTART',
    'RESULT',
    'RESULT_SET_LOCATOR',
    'RETURN',
    'RETURNING',
    'RETURNS',
    'REVOKE',
    'RID',
    'RIGHT',
    'ROLLBACK',
    'ROLLUP',
    'ROUTINE',
    'ROW',
    'ROW_NUMBER',
    'ROWNUMBER',
    'ROWS',
    'RRN',
    'RUN',
    'SAVEPOINT',
    'SBCS',
    'SCALAR',
    'SCHEMA',
    'SCRATCHPAD',
    'SCROLL',
    'SEARCH',
    'SECOND',
    'SECONDS',
    'SECQTY',
    'SECURED',
    'SELECT',
    'SENSITIVE',
    'SEQUENCE',
    'SESSION',
    'SESSION_USER',
    'SET',
    'SIGNAL',
    'SIMPLE',
    'SKIP',
    'SNAN',
    'SOME',
    'SOURCE',
    'SPECIFIC',
    'SQL',
    'SQLID',
    'SQLIND_DEFAULT',
    'SQLIND_UNASSIGNED',
    'STACKED',
    'START',
    'STARTING',
    'STATEMENT',
    'STATIC',
    'STOGROUP',
    'SUBSTRING',
    'SUMMARY',
    'SYNONYM',
    'SYSTEM_TIME',
    'SYSTEM_USER',
    'TABLE',
    'TABLESPACE',
    'TABLESPACES',
    'TAG',
    'THEN',
    'THREADSAFE',
    'TO',
    'TRANSACTION',
    'TRANSFER',
    'TRIGGER',
    'TRIM',
    'TRIM_ARRAY',
    'TRUE',
    'TRUNCATE',
    'TRY_CAST',
    'TYPE',
    'UNDO',
    'UNION',
    'UNIQUE',
    'UNIT',
    'UNKNOWN',
    'UNNEST',
    'UNTIL',
    'UPDATE',
    'UPDATING',
    'URI',
    'USAGE',
    'USE',
    'USER',
    'USERID',
    'USING',
    'VALUE',
    'VALUES',
    'VARIABLE',
    'VARIANT',
    'VCAT',
    'VERSION',
    'VERSIONING',
    'VIEW',
    'VOLATILE',
    'WAIT',
    'WHEN',
    'WHENEVER',
    'WHERE',
    'WHILE',
    'WITH',
    'WITHIN',
    'WITHOUT',
    'WRAPPED',
    'WRAPPER',
    'WRITE',
    'WRKSTNNAME',
    'XMLAGG',
    'XMLATTRIBUTES',
    'XMLCAST',
    'XMLCOMMENT',
    'XMLCONCAT',
    'XMLDOCUMENT',
    'XMLELEMENT',
    'XMLFOREST',
    'XMLGROUP',
    'XMLNAMESPACES',
    'XMLPARSE',
    'XMLPI',
    'XMLROW',
    'XMLSERIALIZE',
    'XMLTABLE',
    'XMLTEXT',
    'XMLVALIDATE',
    'XSLTRANSFORM',
    'XSROBJECT',
    'YEAR',
    'YEARS',
    'YES',
    'ZONE'
];
const dataTypes = [
    // https://www.ibm.com/docs/en/i/7.2?topic=iaodsd-odbc-data-types-how-they-correspond-db2-i-database-types
    'ARRAY',
    'BIGINT',
    'BINARY',
    'BIT',
    'BLOB',
    'BOOLEAN',
    'CCSID',
    'CHAR',
    'CHARACTER',
    'CLOB',
    'DATA',
    'DATALINK',
    'DATE',
    'DBCLOB',
    'DECFLOAT',
    'DECIMAL',
    'DEC',
    'DOUBLE',
    'DOUBLE PRECISION',
    'FLOAT',
    'GRAPHIC',
    'INT',
    'INTEGER',
    'LONG',
    'NUMERIC',
    'REAL',
    'ROWID',
    'SMALLINT',
    'TIME',
    'TIMESTAMP',
    'VARBINARY',
    'VARCHAR',
    'VARGRAPHIC',
    'XML'
]; //# sourceMappingURL=db2i.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2i/db2i.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db2i",
    ()=>db2i
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2i/db2i.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2i/db2i.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'INTO',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'PARTITION BY',
    'ORDER [SIBLINGS] BY [INPUT SEQUENCE]',
    'LIMIT',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    'FOR UPDATE [OF]',
    'FOR READ ONLY',
    'OPTIMIZE FOR',
    // Data modification
    // - insert:
    'INSERT INTO',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE INTO',
    'WHEN [NOT] MATCHED [THEN]',
    'UPDATE SET',
    'DELETE',
    'INSERT',
    // Data definition - table
    'FOR SYSTEM NAME'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [OR REPLACE] TABLE'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [RECURSIVE] VIEW',
    // - update:
    'UPDATE',
    'WHERE CURRENT OF',
    'WITH {NC | RR | RS | CS | UR}',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE',
    // alter table:
    'ALTER TABLE',
    'ADD [COLUMN]',
    'ALTER [COLUMN]',
    'DROP [COLUMN]',
    'SET DATA TYPE',
    'SET {GENERATED ALWAYS | GENERATED BY DEFAULT}',
    'SET NOT NULL',
    'SET {NOT HIDDEN | IMPLICITLY HIDDEN}',
    'SET FIELDPROC',
    'DROP {DEFAULT | NOT NULL | GENERATED | IDENTITY | ROW CHANGE TIMESTAMP | FIELDPROC}',
    // - truncate:
    'TRUNCATE [TABLE]',
    // other
    'SET [CURRENT] SCHEMA',
    'SET CURRENT_SCHEMA',
    // https://www.ibm.com/docs/en/i/7.5?topic=reference-statements
    'ALLOCATE CURSOR',
    'ALLOCATE [SQL] DESCRIPTOR [LOCAL | GLOBAL] SQL',
    'ALTER [SPECIFIC] {FUNCTION | PROCEDURE}',
    'ALTER {MASK | PERMISSION | SEQUENCE | TRIGGER}',
    'ASSOCIATE [RESULT SET] {LOCATOR | LOCATORS}',
    'BEGIN DECLARE SECTION',
    'CALL',
    'CLOSE',
    'COMMENT ON {ALIAS | COLUMN | CONSTRAINT | INDEX | MASK | PACKAGE | PARAMETER | PERMISSION | SEQUENCE | TABLE | TRIGGER | VARIABLE | XSROBJECT}',
    'COMMENT ON [SPECIFIC] {FUNCTION | PROCEDURE | ROUTINE}',
    'COMMENT ON PARAMETER SPECIFIC {FUNCTION | PROCEDURE | ROUTINE}',
    'COMMENT ON [TABLE FUNCTION] RETURN COLUMN',
    'COMMENT ON [TABLE FUNCTION] RETURN COLUMN SPECIFIC [PROCEDURE | ROUTINE]',
    'COMMIT [WORK] [HOLD]',
    'CONNECT [TO | RESET] USER',
    'CREATE [OR REPLACE] {ALIAS | FUNCTION | MASK | PERMISSION | PROCEDURE | SEQUENCE | TRIGGER | VARIABLE}',
    'CREATE [ENCODED VECTOR] INDEX',
    'CREATE UNIQUE [WHERE NOT NULL] INDEX',
    'CREATE SCHEMA',
    'CREATE TYPE',
    'DEALLOCATE [SQL] DESCRIPTOR [LOCAL | GLOBAL]',
    'DECLARE CURSOR',
    'DECLARE GLOBAL TEMPORARY TABLE',
    'DECLARE',
    'DESCRIBE CURSOR',
    'DESCRIBE INPUT',
    'DESCRIBE [OUTPUT]',
    'DESCRIBE {PROCEDURE | ROUTINE}',
    'DESCRIBE TABLE',
    'DISCONNECT ALL [SQL]',
    'DISCONNECT [CURRENT]',
    'DROP {ALIAS | INDEX | MASK | PACKAGE | PERMISSION | SCHEMA | SEQUENCE | TABLE | TYPE | VARIABLE | XSROBJECT} [IF EXISTS]',
    'DROP [SPECIFIC] {FUNCTION | PROCEDURE | ROUTINE} [IF EXISTS]',
    'END DECLARE SECTION',
    'EXECUTE [IMMEDIATE]',
    // 'FETCH {NEXT | PRIOR | FIRST | LAST | BEFORE | AFTER | CURRENT} [FROM]',
    'FREE LOCATOR',
    'GET [SQL] DESCRIPTOR [LOCAL | GLOBAL]',
    'GET [CURRENT | STACKED] DIAGNOSTICS',
    'GRANT {ALL [PRIVILEGES] | ALTER | EXECUTE} ON {FUNCTION | PROCEDURE | ROUTINE | PACKAGE | SCHEMA | SEQUENCE | TABLE | TYPE | VARIABLE | XSROBJECT}',
    'HOLD LOCATOR',
    'INCLUDE',
    'LABEL ON {ALIAS | COLUMN | CONSTRAINT | INDEX | MASK | PACKAGE | PERMISSION | SEQUENCE | TABLE | TRIGGER | VARIABLE | XSROBJECT}',
    'LABEL ON [SPECIFIC] {FUNCTION | PROCEDURE | ROUTINE}',
    'LOCK TABLE',
    'OPEN',
    'PREPARE',
    'REFRESH TABLE',
    'RELEASE',
    'RELEASE [TO] SAVEPOINT',
    'RENAME [TABLE | INDEX] TO',
    'REVOKE {ALL [PRIVILEGES] | ALTER | EXECUTE} ON {FUNCTION | PROCEDURE | ROUTINE | PACKAGE | SCHEMA | SEQUENCE | TABLE | TYPE | VARIABLE | XSROBJECT}',
    'ROLLBACK [WORK] [HOLD | TO SAVEPOINT]',
    'SAVEPOINT',
    'SET CONNECTION',
    'SET CURRENT {DEBUG MODE | DECFLOAT ROUNDING MODE | DEGREE | IMPLICIT XMLPARSE OPTION | TEMPORAL SYSTEM_TIME}',
    'SET [SQL] DESCRIPTOR [LOCAL | GLOBAL]',
    'SET ENCRYPTION PASSWORD',
    'SET OPTION',
    'SET {[CURRENT [FUNCTION]] PATH | CURRENT_PATH}',
    'SET RESULT SETS [WITH RETURN [TO CALLER | TO CLIENT]]',
    'SET SESSION AUTHORIZATION',
    'SET SESSION_USER',
    'SET TRANSACTION',
    'SIGNAL SQLSTATE [VALUE]',
    'TAG',
    'TRANSFER OWNERSHIP OF',
    'WHENEVER {NOT FOUND | SQLERROR | SQLWARNING}'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'EXCEPT [ALL]',
    'INTERSECT [ALL]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '[LEFT | RIGHT] EXCEPTION JOIN',
    '{INNER | CROSS} JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON DELETE',
    'ON UPDATE',
    'SET NULL',
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const db2i = {
    name: 'db2i',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        nestedBlockComments: true,
        extraParens: [
            '[]'
        ],
        stringTypes: [
            {
                quote: "''-qq",
                prefixes: [
                    'G',
                    'N'
                ]
            },
            {
                quote: "''-raw",
                prefixes: [
                    'X',
                    'BX',
                    'GX',
                    'UX'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            `""-qq`
        ],
        identChars: {
            first: '@#$',
            rest: '@#$'
        },
        paramTypes: {
            positional: true,
            named: [
                ':'
            ]
        },
        paramChars: {
            first: '@#$',
            rest: '@#$'
        },
        operators: [
            '**',
            '¬=',
            '¬>',
            '¬<',
            '!>',
            '!<',
            '||',
            '=>'
        ]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=db2i.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/duckdb/duckdb.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // Functions from DuckDB (excluding those that start with an underscore):
    // SELECT DISTINCT upper(function_name) AS function_name
    // FROM duckdb_functions()
    // WHERE function_name SIMILAR TO '^[a-z].*'
    // ORDER BY function_name
    'ABS',
    'ACOS',
    'ADD',
    'ADD_PARQUET_KEY',
    'AGE',
    'AGGREGATE',
    'ALIAS',
    'ALL_PROFILING_OUTPUT',
    'ANY_VALUE',
    'APPLY',
    'APPROX_COUNT_DISTINCT',
    'APPROX_QUANTILE',
    'ARBITRARY',
    'ARGMAX',
    'ARGMIN',
    'ARG_MAX',
    'ARG_MAX_NULL',
    'ARG_MIN',
    'ARG_MIN_NULL',
    'ARRAY_AGG',
    'ARRAY_AGGR',
    'ARRAY_AGGREGATE',
    'ARRAY_APPEND',
    'ARRAY_APPLY',
    'ARRAY_CAT',
    'ARRAY_CONCAT',
    'ARRAY_CONTAINS',
    'ARRAY_COSINE_SIMILARITY',
    'ARRAY_CROSS_PRODUCT',
    'ARRAY_DISTANCE',
    'ARRAY_DISTINCT',
    'ARRAY_DOT_PRODUCT',
    'ARRAY_EXTRACT',
    'ARRAY_FILTER',
    'ARRAY_GRADE_UP',
    'ARRAY_HAS',
    'ARRAY_HAS_ALL',
    'ARRAY_HAS_ANY',
    'ARRAY_INDEXOF',
    'ARRAY_INNER_PRODUCT',
    'ARRAY_INTERSECT',
    'ARRAY_LENGTH',
    'ARRAY_POP_BACK',
    'ARRAY_POP_FRONT',
    'ARRAY_POSITION',
    'ARRAY_PREPEND',
    'ARRAY_PUSH_BACK',
    'ARRAY_PUSH_FRONT',
    'ARRAY_REDUCE',
    'ARRAY_RESIZE',
    'ARRAY_REVERSE',
    'ARRAY_REVERSE_SORT',
    'ARRAY_SELECT',
    'ARRAY_SLICE',
    'ARRAY_SORT',
    'ARRAY_TO_JSON',
    'ARRAY_TO_STRING',
    'ARRAY_TRANSFORM',
    'ARRAY_UNIQUE',
    'ARRAY_VALUE',
    'ARRAY_WHERE',
    'ARRAY_ZIP',
    'ARROW_SCAN',
    'ARROW_SCAN_DUMB',
    'ASCII',
    'ASIN',
    'ATAN',
    'ATAN2',
    'AVG',
    'BASE64',
    'BIN',
    'BITSTRING',
    'BITSTRING_AGG',
    'BIT_AND',
    'BIT_COUNT',
    'BIT_LENGTH',
    'BIT_OR',
    'BIT_POSITION',
    'BIT_XOR',
    'BOOL_AND',
    'BOOL_OR',
    'CARDINALITY',
    'CBRT',
    'CEIL',
    'CEILING',
    'CENTURY',
    'CHECKPOINT',
    'CHR',
    'COLLATIONS',
    'COL_DESCRIPTION',
    'COMBINE',
    'CONCAT',
    'CONCAT_WS',
    'CONSTANT_OR_NULL',
    'CONTAINS',
    'COPY_DATABASE',
    'CORR',
    'COS',
    'COT',
    'COUNT',
    'COUNT_IF',
    'COUNT_STAR',
    'COVAR_POP',
    'COVAR_SAMP',
    'CREATE_SORT_KEY',
    'CURRENT_CATALOG',
    'CURRENT_DATABASE',
    'CURRENT_DATE',
    'CURRENT_LOCALTIME',
    'CURRENT_LOCALTIMESTAMP',
    'CURRENT_QUERY',
    'CURRENT_ROLE',
    'CURRENT_SCHEMA',
    'CURRENT_SCHEMAS',
    'CURRENT_SETTING',
    'CURRENT_USER',
    'CURRVAL',
    'DAMERAU_LEVENSHTEIN',
    'DATABASE_LIST',
    'DATABASE_SIZE',
    'DATEDIFF',
    'DATEPART',
    'DATESUB',
    'DATETRUNC',
    'DATE_ADD',
    'DATE_DIFF',
    'DATE_PART',
    'DATE_SUB',
    'DATE_TRUNC',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'DECADE',
    'DECODE',
    'DEGREES',
    'DISABLE_CHECKPOINT_ON_SHUTDOWN',
    'DISABLE_OBJECT_CACHE',
    'DISABLE_OPTIMIZER',
    'DISABLE_PRINT_PROGRESS_BAR',
    'DISABLE_PROFILE',
    'DISABLE_PROFILING',
    'DISABLE_PROGRESS_BAR',
    'DISABLE_VERIFICATION',
    'DISABLE_VERIFY_EXTERNAL',
    'DISABLE_VERIFY_FETCH_ROW',
    'DISABLE_VERIFY_PARALLELISM',
    'DISABLE_VERIFY_SERIALIZER',
    'DIVIDE',
    'DUCKDB_COLUMNS',
    'DUCKDB_CONSTRAINTS',
    'DUCKDB_DATABASES',
    'DUCKDB_DEPENDENCIES',
    'DUCKDB_EXTENSIONS',
    'DUCKDB_FUNCTIONS',
    'DUCKDB_INDEXES',
    'DUCKDB_KEYWORDS',
    'DUCKDB_MEMORY',
    'DUCKDB_OPTIMIZERS',
    'DUCKDB_SCHEMAS',
    'DUCKDB_SECRETS',
    'DUCKDB_SEQUENCES',
    'DUCKDB_SETTINGS',
    'DUCKDB_TABLES',
    'DUCKDB_TEMPORARY_FILES',
    'DUCKDB_TYPES',
    'DUCKDB_VIEWS',
    'EDIT',
    'EDITDIST3',
    'ELEMENT_AT',
    'ENABLE_CHECKPOINT_ON_SHUTDOWN',
    'ENABLE_OBJECT_CACHE',
    'ENABLE_OPTIMIZER',
    'ENABLE_PRINT_PROGRESS_BAR',
    'ENABLE_PROFILE',
    'ENABLE_PROFILING',
    'ENABLE_PROGRESS_BAR',
    'ENABLE_VERIFICATION',
    'ENCODE',
    'ENDS_WITH',
    'ENTROPY',
    'ENUM_CODE',
    'ENUM_FIRST',
    'ENUM_LAST',
    'ENUM_RANGE',
    'ENUM_RANGE_BOUNDARY',
    'EPOCH',
    'EPOCH_MS',
    'EPOCH_NS',
    'EPOCH_US',
    'ERA',
    'ERROR',
    'EVEN',
    'EXP',
    'FACTORIAL',
    'FAVG',
    'FDIV',
    'FILTER',
    'FINALIZE',
    'FIRST',
    'FLATTEN',
    'FLOOR',
    'FMOD',
    'FORCE_CHECKPOINT',
    'FORMAT',
    'FORMATREADABLEDECIMALSIZE',
    'FORMATREADABLESIZE',
    'FORMAT_BYTES',
    'FORMAT_PG_TYPE',
    'FORMAT_TYPE',
    'FROM_BASE64',
    'FROM_BINARY',
    'FROM_HEX',
    'FROM_JSON',
    'FROM_JSON_STRICT',
    'FSUM',
    'FUNCTIONS',
    'GAMMA',
    'GCD',
    'GENERATE_SERIES',
    'GENERATE_SUBSCRIPTS',
    'GEN_RANDOM_UUID',
    'GEOMEAN',
    'GEOMETRIC_MEAN',
    'GETENV',
    'GET_BIT',
    'GET_BLOCK_SIZE',
    'GET_CURRENT_TIME',
    'GET_CURRENT_TIMESTAMP',
    'GLOB',
    'GRADE_UP',
    'GREATEST',
    'GREATEST_COMMON_DIVISOR',
    'GROUP_CONCAT',
    'HAMMING',
    'HASH',
    'HAS_ANY_COLUMN_PRIVILEGE',
    'HAS_COLUMN_PRIVILEGE',
    'HAS_DATABASE_PRIVILEGE',
    'HAS_FOREIGN_DATA_WRAPPER_PRIVILEGE',
    'HAS_FUNCTION_PRIVILEGE',
    'HAS_LANGUAGE_PRIVILEGE',
    'HAS_SCHEMA_PRIVILEGE',
    'HAS_SEQUENCE_PRIVILEGE',
    'HAS_SERVER_PRIVILEGE',
    'HAS_TABLESPACE_PRIVILEGE',
    'HAS_TABLE_PRIVILEGE',
    'HEX',
    'HISTOGRAM',
    'HOUR',
    'ICU_CALENDAR_NAMES',
    'ICU_SORT_KEY',
    'ILIKE_ESCAPE',
    'IMPORT_DATABASE',
    'INDEX_SCAN',
    'INET_CLIENT_ADDR',
    'INET_CLIENT_PORT',
    'INET_SERVER_ADDR',
    'INET_SERVER_PORT',
    'INSTR',
    'IN_SEARCH_PATH',
    'ISFINITE',
    'ISINF',
    'ISNAN',
    'ISODOW',
    'ISOYEAR',
    'JACCARD',
    'JARO_SIMILARITY',
    'JARO_WINKLER_SIMILARITY',
    // 'JSON',
    'JSON_ARRAY',
    'JSON_ARRAY_LENGTH',
    'JSON_CONTAINS',
    'JSON_DESERIALIZE_SQL',
    'JSON_EXECUTE_SERIALIZED_SQL',
    'JSON_EXTRACT',
    'JSON_EXTRACT_PATH',
    'JSON_EXTRACT_PATH_TEXT',
    'JSON_EXTRACT_STRING',
    'JSON_GROUP_ARRAY',
    'JSON_GROUP_OBJECT',
    'JSON_GROUP_STRUCTURE',
    'JSON_KEYS',
    'JSON_MERGE_PATCH',
    'JSON_OBJECT',
    'JSON_QUOTE',
    'JSON_SERIALIZE_PLAN',
    'JSON_SERIALIZE_SQL',
    'JSON_STRUCTURE',
    'JSON_TRANSFORM',
    'JSON_TRANSFORM_STRICT',
    'JSON_TYPE',
    'JSON_VALID',
    'JULIAN',
    'KAHAN_SUM',
    'KURTOSIS',
    'KURTOSIS_POP',
    'LAST',
    'LAST_DAY',
    'LCASE',
    'LCM',
    'LEAST',
    'LEAST_COMMON_MULTIPLE',
    'LEFT',
    'LEFT_GRAPHEME',
    'LEN',
    'LENGTH',
    'LENGTH_GRAPHEME',
    'LEVENSHTEIN',
    'LGAMMA',
    'LIKE_ESCAPE',
    'LIST',
    'LISTAGG',
    'LIST_AGGR',
    'LIST_AGGREGATE',
    'LIST_ANY_VALUE',
    'LIST_APPEND',
    'LIST_APPLY',
    'LIST_APPROX_COUNT_DISTINCT',
    'LIST_AVG',
    'LIST_BIT_AND',
    'LIST_BIT_OR',
    'LIST_BIT_XOR',
    'LIST_BOOL_AND',
    'LIST_BOOL_OR',
    'LIST_CAT',
    'LIST_CONCAT',
    'LIST_CONTAINS',
    'LIST_COSINE_SIMILARITY',
    'LIST_COUNT',
    'LIST_DISTANCE',
    'LIST_DISTINCT',
    'LIST_DOT_PRODUCT',
    'LIST_ELEMENT',
    'LIST_ENTROPY',
    'LIST_EXTRACT',
    'LIST_FILTER',
    'LIST_FIRST',
    'LIST_GRADE_UP',
    'LIST_HAS',
    'LIST_HAS_ALL',
    'LIST_HAS_ANY',
    'LIST_HISTOGRAM',
    'LIST_INDEXOF',
    'LIST_INNER_PRODUCT',
    'LIST_INTERSECT',
    'LIST_KURTOSIS',
    'LIST_KURTOSIS_POP',
    'LIST_LAST',
    'LIST_MAD',
    'LIST_MAX',
    'LIST_MEDIAN',
    'LIST_MIN',
    'LIST_MODE',
    'LIST_PACK',
    'LIST_POSITION',
    'LIST_PREPEND',
    'LIST_PRODUCT',
    'LIST_REDUCE',
    'LIST_RESIZE',
    'LIST_REVERSE',
    'LIST_REVERSE_SORT',
    'LIST_SELECT',
    'LIST_SEM',
    'LIST_SKEWNESS',
    'LIST_SLICE',
    'LIST_SORT',
    'LIST_STDDEV_POP',
    'LIST_STDDEV_SAMP',
    'LIST_STRING_AGG',
    'LIST_SUM',
    'LIST_TRANSFORM',
    'LIST_UNIQUE',
    'LIST_VALUE',
    'LIST_VAR_POP',
    'LIST_VAR_SAMP',
    'LIST_WHERE',
    'LIST_ZIP',
    'LN',
    'LOG',
    'LOG10',
    'LOG2',
    'LOWER',
    'LPAD',
    'LSMODE',
    'LTRIM',
    'MAD',
    'MAKE_DATE',
    'MAKE_TIME',
    'MAKE_TIMESTAMP',
    'MAKE_TIMESTAMPTZ',
    'MAP',
    'MAP_CONCAT',
    'MAP_ENTRIES',
    'MAP_EXTRACT',
    'MAP_FROM_ENTRIES',
    'MAP_KEYS',
    'MAP_VALUES',
    'MAX',
    'MAX_BY',
    'MD5',
    'MD5_NUMBER',
    'MD5_NUMBER_LOWER',
    'MD5_NUMBER_UPPER',
    'MEAN',
    'MEDIAN',
    'METADATA_INFO',
    'MICROSECOND',
    'MILLENNIUM',
    'MILLISECOND',
    'MIN',
    'MINUTE',
    'MIN_BY',
    'MISMATCHES',
    'MOD',
    'MODE',
    'MONTH',
    'MONTHNAME',
    'MULTIPLY',
    'NEXTAFTER',
    'NEXTVAL',
    'NFC_NORMALIZE',
    'NOT_ILIKE_ESCAPE',
    'NOT_LIKE_ESCAPE',
    'NOW',
    'NULLIF',
    'OBJ_DESCRIPTION',
    'OCTET_LENGTH',
    'ORD',
    'PARQUET_FILE_METADATA',
    'PARQUET_KV_METADATA',
    'PARQUET_METADATA',
    'PARQUET_SCAN',
    'PARQUET_SCHEMA',
    'PARSE_DIRNAME',
    'PARSE_DIRPATH',
    'PARSE_FILENAME',
    'PARSE_PATH',
    'PG_COLLATION_IS_VISIBLE',
    'PG_CONF_LOAD_TIME',
    'PG_CONVERSION_IS_VISIBLE',
    'PG_FUNCTION_IS_VISIBLE',
    'PG_GET_CONSTRAINTDEF',
    'PG_GET_EXPR',
    'PG_GET_VIEWDEF',
    'PG_HAS_ROLE',
    'PG_IS_OTHER_TEMP_SCHEMA',
    'PG_MY_TEMP_SCHEMA',
    'PG_OPCLASS_IS_VISIBLE',
    'PG_OPERATOR_IS_VISIBLE',
    'PG_OPFAMILY_IS_VISIBLE',
    'PG_POSTMASTER_START_TIME',
    'PG_SIZE_PRETTY',
    'PG_TABLE_IS_VISIBLE',
    'PG_TIMEZONE_NAMES',
    'PG_TS_CONFIG_IS_VISIBLE',
    'PG_TS_DICT_IS_VISIBLE',
    'PG_TS_PARSER_IS_VISIBLE',
    'PG_TS_TEMPLATE_IS_VISIBLE',
    'PG_TYPEOF',
    'PG_TYPE_IS_VISIBLE',
    'PI',
    'PLATFORM',
    'POSITION',
    'POW',
    'POWER',
    'PRAGMA_COLLATIONS',
    'PRAGMA_DATABASE_SIZE',
    'PRAGMA_METADATA_INFO',
    'PRAGMA_PLATFORM',
    'PRAGMA_SHOW',
    'PRAGMA_STORAGE_INFO',
    'PRAGMA_TABLE_INFO',
    'PRAGMA_USER_AGENT',
    'PRAGMA_VERSION',
    'PREFIX',
    'PRINTF',
    'PRODUCT',
    'QUANTILE',
    'QUANTILE_CONT',
    'QUANTILE_DISC',
    'QUARTER',
    'RADIANS',
    'RANDOM',
    'RANGE',
    'READFILE',
    'READ_BLOB',
    'READ_CSV',
    'READ_CSV_AUTO',
    'READ_JSON',
    'READ_JSON_AUTO',
    'READ_JSON_OBJECTS',
    'READ_JSON_OBJECTS_AUTO',
    'READ_NDJSON',
    'READ_NDJSON_AUTO',
    'READ_NDJSON_OBJECTS',
    'READ_PARQUET',
    'READ_TEXT',
    'REDUCE',
    'REGEXP_ESCAPE',
    'REGEXP_EXTRACT',
    'REGEXP_EXTRACT_ALL',
    'REGEXP_FULL_MATCH',
    'REGEXP_MATCHES',
    'REGEXP_REPLACE',
    'REGEXP_SPLIT_TO_ARRAY',
    'REGEXP_SPLIT_TO_TABLE',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_COUNT',
    'REGR_INTERCEPT',
    'REGR_R2',
    'REGR_SLOPE',
    'REGR_SXX',
    'REGR_SXY',
    'REGR_SYY',
    'REPEAT',
    'REPEAT_ROW',
    'REPLACE',
    'RESERVOIR_QUANTILE',
    'REVERSE',
    'RIGHT',
    'RIGHT_GRAPHEME',
    'ROUND',
    'ROUNDBANKERS',
    'ROUND_EVEN',
    'ROW',
    'ROW_TO_JSON',
    'RPAD',
    'RTRIM',
    'SECOND',
    'SEM',
    'SEQ_SCAN',
    'SESSION_USER',
    'SETSEED',
    'SET_BIT',
    'SHA256',
    'SHA3',
    'SHELL_ADD_SCHEMA',
    'SHELL_ESCAPE_CRNL',
    'SHELL_IDQUOTE',
    'SHELL_MODULE_SCHEMA',
    'SHELL_PUTSNL',
    'SHOBJ_DESCRIPTION',
    'SHOW',
    'SHOW_DATABASES',
    'SHOW_TABLES',
    'SHOW_TABLES_EXPANDED',
    'SIGN',
    'SIGNBIT',
    'SIN',
    'SKEWNESS',
    'SNIFF_CSV',
    'SPLIT',
    'SPLIT_PART',
    'SQL_AUTO_COMPLETE',
    'SQRT',
    'STARTS_WITH',
    'STATS',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STORAGE_INFO',
    'STRFTIME',
    'STRING_AGG',
    'STRING_SPLIT',
    'STRING_SPLIT_REGEX',
    'STRING_TO_ARRAY',
    'STRIP_ACCENTS',
    'STRLEN',
    'STRPOS',
    'STRPTIME',
    'STRUCT_EXTRACT',
    'STRUCT_INSERT',
    'STRUCT_PACK',
    'STR_SPLIT',
    'STR_SPLIT_REGEX',
    'SUBSTR',
    'SUBSTRING',
    'SUBSTRING_GRAPHEME',
    'SUBTRACT',
    'SUFFIX',
    'SUM',
    'SUMKAHAN',
    'SUMMARY',
    'SUM_NO_OVERFLOW',
    'TABLE_INFO',
    'TAN',
    'TEST_ALL_TYPES',
    'TEST_VECTOR_TYPES',
    'TIMEZONE',
    'TIMEZONE_HOUR',
    'TIMEZONE_MINUTE',
    'TIME_BUCKET',
    'TODAY',
    'TO_BASE',
    'TO_BASE64',
    'TO_BINARY',
    'TO_CENTURIES',
    'TO_DAYS',
    'TO_DECADES',
    'TO_HEX',
    'TO_HOURS',
    'TO_JSON',
    'TO_MICROSECONDS',
    'TO_MILLENNIA',
    'TO_MILLISECONDS',
    'TO_MINUTES',
    'TO_MONTHS',
    'TO_SECONDS',
    'TO_TIMESTAMP',
    'TO_WEEKS',
    'TO_YEARS',
    'TRANSACTION_TIMESTAMP',
    'TRANSLATE',
    'TRIM',
    'TRUNC',
    'TRY_STRPTIME',
    'TXID_CURRENT',
    'TYPEOF',
    'UCASE',
    'UNBIN',
    'UNHEX',
    'UNICODE',
    'UNION_EXTRACT',
    'UNION_TAG',
    'UNION_VALUE',
    'UNNEST',
    'UNPIVOT_LIST',
    'UPPER',
    'USER',
    'USER_AGENT',
    'UUID',
    'VARIANCE',
    'VAR_POP',
    'VAR_SAMP',
    'VECTOR_TYPE',
    'VERIFY_EXTERNAL',
    'VERIFY_FETCH_ROW',
    'VERIFY_PARALLELISM',
    'VERIFY_SERIALIZER',
    'VERSION',
    'WEEK',
    'WEEKDAY',
    'WEEKOFYEAR',
    'WHICH_SECRET',
    'WRITEFILE',
    'XOR',
    'YEAR',
    'YEARWEEK',
    // Keywords that also need to be listed as functions
    'CAST',
    'COALESCE',
    // 'NULL', we really prefer treating it as keyword
    'RANK',
    'ROW_NUMBER'
]; //# sourceMappingURL=duckdb.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/duckdb/duckdb.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // Keywords from DuckDB:
    // SELECT upper(keyword_name)
    // FROM duckdb_keywords()
    // WHERE keyword_category = 'reserved'
    // ORDER BY keyword_name
    'ALL',
    'ANALYSE',
    'ANALYZE',
    'AND',
    'ANY',
    'AS',
    'ASC',
    'ATTACH',
    'ASYMMETRIC',
    'BOTH',
    'CASE',
    'CAST',
    'CHECK',
    'COLLATE',
    'COLUMN',
    'CONSTRAINT',
    'CREATE',
    'DEFAULT',
    'DEFERRABLE',
    'DESC',
    'DESCRIBE',
    'DETACH',
    'DISTINCT',
    'DO',
    'ELSE',
    'END',
    'EXCEPT',
    'FALSE',
    'FETCH',
    'FOR',
    'FOREIGN',
    'FROM',
    'GRANT',
    'GROUP',
    'HAVING',
    'IN',
    'INITIALLY',
    'INTERSECT',
    'INTO',
    'IS',
    'LATERAL',
    'LEADING',
    'LIMIT',
    'NOT',
    'NULL',
    'OFFSET',
    'ON',
    'ONLY',
    'OR',
    'ORDER',
    'PIVOT',
    'PIVOT_LONGER',
    'PIVOT_WIDER',
    'PLACING',
    'PRIMARY',
    'REFERENCES',
    'RETURNING',
    'SELECT',
    'SHOW',
    'SOME',
    'SUMMARIZE',
    'SYMMETRIC',
    'TABLE',
    'THEN',
    'TO',
    'TRAILING',
    'TRUE',
    'UNION',
    'UNIQUE',
    'UNPIVOT',
    'USING',
    'VARIADIC',
    'WHEN',
    'WHERE',
    'WINDOW',
    'WITH'
];
const dataTypes = [
    // Types from DuckDB:
    // SELECT DISTINCT upper(type_name)
    // FROM duckdb_types()
    // ORDER BY type_name
    'ARRAY',
    'BIGINT',
    'BINARY',
    'BIT',
    'BITSTRING',
    'BLOB',
    'BOOL',
    'BOOLEAN',
    'BPCHAR',
    'BYTEA',
    'CHAR',
    'DATE',
    'DATETIME',
    'DEC',
    'DECIMAL',
    'DOUBLE',
    'ENUM',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'GUID',
    'HUGEINT',
    'INET',
    'INT',
    'INT1',
    'INT128',
    'INT16',
    'INT2',
    'INT32',
    'INT4',
    'INT64',
    'INT8',
    'INTEGER',
    'INTEGRAL',
    'INTERVAL',
    'JSON',
    'LIST',
    'LOGICAL',
    'LONG',
    'MAP',
    // 'NULL' is a keyword
    'NUMERIC',
    'NVARCHAR',
    'OID',
    'REAL',
    'ROW',
    'SHORT',
    'SIGNED',
    'SMALLINT',
    'STRING',
    'STRUCT',
    'TEXT',
    'TIME',
    'TIMESTAMP_MS',
    'TIMESTAMP_NS',
    'TIMESTAMP_S',
    'TIMESTAMP_US',
    'TIMESTAMP',
    'TIMESTAMPTZ',
    'TIMETZ',
    'TINYINT',
    'UBIGINT',
    'UHUGEINT',
    'UINT128',
    'UINT16',
    'UINT32',
    'UINT64',
    'UINT8',
    'UINTEGER',
    'UNION',
    'USMALLINT',
    'UTINYINT',
    'UUID',
    'VARBINARY',
    'VARCHAR'
]; //# sourceMappingURL=duckdb.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/duckdb/duckdb.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "duckdb",
    ()=>duckdb
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/duckdb/duckdb.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/duckdb/duckdb.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY [ALL]',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY [ALL]',
    'LIMIT',
    'OFFSET',
    // 'USING' (conflicts with 'USING' in JOIN)
    'USING SAMPLE',
    'QUALIFY',
    // Data manipulation
    // - insert:
    'INSERT [OR REPLACE] INTO',
    'VALUES',
    'DEFAULT VALUES',
    // - update:
    'SET',
    // other:
    'RETURNING'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [OR REPLACE] [TEMPORARY | TEMP] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // TABLE
    // - update:
    'UPDATE',
    // - insert:
    'ON CONFLICT',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - truncate
    'TRUNCATE',
    // - alter table:
    'ALTER TABLE',
    'ADD [COLUMN] [IF NOT EXISTS]',
    'ADD PRIMARY KEY',
    'DROP [COLUMN] [IF EXISTS]',
    'ALTER [COLUMN]',
    'RENAME [COLUMN]',
    'RENAME TO',
    'SET [DATA] TYPE',
    '{SET | DROP} DEFAULT',
    '{SET | DROP} NOT NULL',
    // MACRO / FUNCTION
    'CREATE [OR REPLACE] [TEMPORARY | TEMP] {MACRO | FUNCTION}',
    'DROP MACRO [TABLE] [IF EXISTS]',
    'DROP FUNCTION [IF EXISTS]',
    // INDEX
    'CREATE [UNIQUE] INDEX [IF NOT EXISTS]',
    'DROP INDEX [IF EXISTS]',
    // SCHEMA
    'CREATE [OR REPLACE] SCHEMA [IF NOT EXISTS]',
    'DROP SCHEMA [IF EXISTS]',
    // SECRET
    'CREATE [OR REPLACE] [PERSISTENT | TEMPORARY] SECRET [IF NOT EXISTS]',
    'DROP [PERSISTENT | TEMPORARY] SECRET [IF EXISTS]',
    // SEQUENCE
    'CREATE [OR REPLACE] [TEMPORARY | TEMP] SEQUENCE',
    'DROP SEQUENCE [IF EXISTS]',
    // VIEW
    'CREATE [OR REPLACE] [TEMPORARY | TEMP] VIEW [IF NOT EXISTS]',
    'DROP VIEW [IF EXISTS]',
    'ALTER VIEW',
    // TYPE
    'CREATE TYPE',
    'DROP TYPE [IF EXISTS]',
    // other
    'ANALYZE',
    'ATTACH [DATABASE] [IF NOT EXISTS]',
    'DETACH [DATABASE] [IF EXISTS]',
    'CALL',
    '[FORCE] CHECKPOINT',
    'COMMENT ON [TABLE | COLUMN | VIEW | INDEX | SEQUENCE | TYPE | MACRO | MACRO TABLE]',
    'COPY [FROM DATABASE]',
    'DESCRIBE',
    'EXPORT DATABASE',
    'IMPORT DATABASE',
    'INSTALL',
    'LOAD',
    'PIVOT',
    'PIVOT_WIDER',
    'UNPIVOT',
    'EXPLAIN [ANALYZE]',
    // plain SET conflicts with SET clause in UPDATE
    'SET {LOCAL | SESSION | GLOBAL}',
    'RESET [LOCAL | SESSION | GLOBAL]',
    '{SET | RESET} VARIABLE',
    'SUMMARIZE',
    'BEGIN TRANSACTION',
    'ROLLBACK',
    'COMMIT',
    'ABORT',
    'USE',
    'VACUUM [ANALYZE]',
    // prepared statements
    'PREPARE',
    'EXECUTE',
    'DEALLOCATE [PREPARE]'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | BY NAME]',
    'EXCEPT [ALL]',
    'INTERSECT [ALL]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    '{NATURAL | ASOF} [INNER] JOIN',
    '{NATURAL | ASOF} {LEFT | RIGHT | FULL} [OUTER] JOIN',
    'POSITIONAL JOIN',
    'ANTI JOIN',
    'SEMI JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    '{ROWS | RANGE | GROUPS} BETWEEN',
    'SIMILAR TO',
    'IS [NOT] DISTINCT FROM'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'TIMESTAMP WITH TIME ZONE'
]);
const duckdb = {
    name: 'duckdb',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        nestedBlockComments: true,
        extraParens: [
            '[]',
            '{}'
        ],
        underscoresInNumbers: true,
        stringTypes: [
            '$$',
            "''-qq",
            {
                quote: "''-qq-bs",
                prefixes: [
                    'E'
                ],
                requirePrefix: true
            },
            {
                quote: "''-raw",
                prefixes: [
                    'B',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            `""-qq`
        ],
        identChars: {
            rest: '$'
        },
        // TODO: named params $foo currently conflict with $$-quoted strings
        paramTypes: {
            positional: true,
            numbered: [
                '$'
            ],
            quoted: [
                '$'
            ]
        },
        operators: [
            // Arithmetic:
            '//',
            '%',
            '**',
            '^',
            '!',
            // Bitwise:
            '&',
            '|',
            '~',
            '<<',
            '>>',
            // Cast:
            '::',
            // Comparison:
            '==',
            // Lambda & JSON:
            '->',
            // JSON:
            '->>',
            // key-value separator:
            ':',
            // Named function params:
            ':=',
            '=>',
            // Pattern matching:
            '~~',
            '!~~',
            '~~*',
            '!~~*',
            '~~~',
            // Regular expressions:
            '~',
            '!~',
            '~*',
            '!~*',
            // String:
            '^@',
            '||',
            // INET extension:
            '>>=',
            '<<='
        ]
    },
    formatOptions: {
        alwaysDenseOperators: [
            '::'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=duckdb.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/hive/hive.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF
    // math
    'ABS',
    'ACOS',
    'ASIN',
    'ATAN',
    'BIN',
    'BROUND',
    'CBRT',
    'CEIL',
    'CEILING',
    'CONV',
    'COS',
    'DEGREES',
    // 'E',
    'EXP',
    'FACTORIAL',
    'FLOOR',
    'GREATEST',
    'HEX',
    'LEAST',
    'LN',
    'LOG',
    'LOG10',
    'LOG2',
    'NEGATIVE',
    'PI',
    'PMOD',
    'POSITIVE',
    'POW',
    'POWER',
    'RADIANS',
    'RAND',
    'ROUND',
    'SHIFTLEFT',
    'SHIFTRIGHT',
    'SHIFTRIGHTUNSIGNED',
    'SIGN',
    'SIN',
    'SQRT',
    'TAN',
    'UNHEX',
    'WIDTH_BUCKET',
    // array
    'ARRAY_CONTAINS',
    'MAP_KEYS',
    'MAP_VALUES',
    'SIZE',
    'SORT_ARRAY',
    // conversion
    'BINARY',
    'CAST',
    // date
    'ADD_MONTHS',
    'DATE',
    'DATE_ADD',
    'DATE_FORMAT',
    'DATE_SUB',
    'DATEDIFF',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFYEAR',
    'EXTRACT',
    'FROM_UNIXTIME',
    'FROM_UTC_TIMESTAMP',
    'HOUR',
    'LAST_DAY',
    'MINUTE',
    'MONTH',
    'MONTHS_BETWEEN',
    'NEXT_DAY',
    'QUARTER',
    'SECOND',
    'TIMESTAMP',
    'TO_DATE',
    'TO_UTC_TIMESTAMP',
    'TRUNC',
    'UNIX_TIMESTAMP',
    'WEEKOFYEAR',
    'YEAR',
    // conditional
    'ASSERT_TRUE',
    'COALESCE',
    'IF',
    'ISNOTNULL',
    'ISNULL',
    'NULLIF',
    'NVL',
    // string
    'ASCII',
    'BASE64',
    'CHARACTER_LENGTH',
    'CHR',
    'CONCAT',
    'CONCAT_WS',
    'CONTEXT_NGRAMS',
    'DECODE',
    'ELT',
    'ENCODE',
    'FIELD',
    'FIND_IN_SET',
    'FORMAT_NUMBER',
    'GET_JSON_OBJECT',
    'IN_FILE',
    'INITCAP',
    'INSTR',
    'LCASE',
    'LENGTH',
    'LEVENSHTEIN',
    'LOCATE',
    'LOWER',
    'LPAD',
    'LTRIM',
    'NGRAMS',
    'OCTET_LENGTH',
    'PARSE_URL',
    'PRINTF',
    'QUOTE',
    'REGEXP_EXTRACT',
    'REGEXP_REPLACE',
    'REPEAT',
    'REVERSE',
    'RPAD',
    'RTRIM',
    'SENTENCES',
    'SOUNDEX',
    'SPACE',
    'SPLIT',
    'STR_TO_MAP',
    'SUBSTR',
    'SUBSTRING',
    'TRANSLATE',
    'TRIM',
    'UCASE',
    'UNBASE64',
    'UPPER',
    // masking
    'MASK',
    'MASK_FIRST_N',
    'MASK_HASH',
    'MASK_LAST_N',
    'MASK_SHOW_FIRST_N',
    'MASK_SHOW_LAST_N',
    // misc
    'AES_DECRYPT',
    'AES_ENCRYPT',
    'CRC32',
    'CURRENT_DATABASE',
    'CURRENT_USER',
    'HASH',
    'JAVA_METHOD',
    'LOGGED_IN_USER',
    'MD5',
    'REFLECT',
    'SHA',
    'SHA1',
    'SHA2',
    'SURROGATE_KEY',
    'VERSION',
    // aggregate
    'AVG',
    'COLLECT_LIST',
    'COLLECT_SET',
    'CORR',
    'COUNT',
    'COVAR_POP',
    'COVAR_SAMP',
    'HISTOGRAM_NUMERIC',
    'MAX',
    'MIN',
    'NTILE',
    'PERCENTILE',
    'PERCENTILE_APPROX',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_COUNT',
    'REGR_INTERCEPT',
    'REGR_R2',
    'REGR_SLOPE',
    'REGR_SXX',
    'REGR_SXY',
    'REGR_SYY',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'SUM',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    // table
    'EXPLODE',
    'INLINE',
    'JSON_TUPLE',
    'PARSE_URL_TUPLE',
    'POSEXPLODE',
    'STACK',
    // https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics
    'LEAD',
    'LAG',
    'FIRST_VALUE',
    'LAST_VALUE',
    'RANK',
    'ROW_NUMBER',
    'DENSE_RANK',
    'CUME_DIST',
    'PERCENT_RANK',
    'NTILE'
]; //# sourceMappingURL=hive.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/hive/hive.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://cwiki.apache.org/confluence/display/hive/languagemanual+ddl
    // Non-reserved keywords have proscribed meanings in. HiveQL, but can still be used as table or column names
    'ADD',
    'ADMIN',
    'AFTER',
    'ANALYZE',
    'ARCHIVE',
    'ASC',
    'BEFORE',
    'BUCKET',
    'BUCKETS',
    'CASCADE',
    'CHANGE',
    'CLUSTER',
    'CLUSTERED',
    'CLUSTERSTATUS',
    'COLLECTION',
    'COLUMNS',
    'COMMENT',
    'COMPACT',
    'COMPACTIONS',
    'COMPUTE',
    'CONCATENATE',
    'CONTINUE',
    'DATA',
    'DATABASES',
    'DATETIME',
    'DAY',
    'DBPROPERTIES',
    'DEFERRED',
    'DEFINED',
    'DELIMITED',
    'DEPENDENCY',
    'DESC',
    'DIRECTORIES',
    'DIRECTORY',
    'DISABLE',
    'DISTRIBUTE',
    'ELEM_TYPE',
    'ENABLE',
    'ESCAPED',
    'EXCLUSIVE',
    'EXPLAIN',
    'EXPORT',
    'FIELDS',
    'FILE',
    'FILEFORMAT',
    'FIRST',
    'FORMAT',
    'FORMATTED',
    'FUNCTIONS',
    'HOLD_DDLTIME',
    'HOUR',
    'IDXPROPERTIES',
    'IGNORE',
    'INDEX',
    'INDEXES',
    'INPATH',
    'INPUTDRIVER',
    'INPUTFORMAT',
    'ITEMS',
    'JAR',
    'KEYS',
    'KEY_TYPE',
    'LIMIT',
    'LINES',
    'LOAD',
    'LOCATION',
    'LOCK',
    'LOCKS',
    'LOGICAL',
    'LONG',
    'MAPJOIN',
    'MATERIALIZED',
    'METADATA',
    'MINUS',
    'MINUTE',
    'MONTH',
    'MSCK',
    'NOSCAN',
    'NO_DROP',
    'OFFLINE',
    'OPTION',
    'OUTPUTDRIVER',
    'OUTPUTFORMAT',
    'OVERWRITE',
    'OWNER',
    'PARTITIONED',
    'PARTITIONS',
    'PLUS',
    'PRETTY',
    'PRINCIPALS',
    'PROTECTION',
    'PURGE',
    'READ',
    'READONLY',
    'REBUILD',
    'RECORDREADER',
    'RECORDWRITER',
    'RELOAD',
    'RENAME',
    'REPAIR',
    'REPLACE',
    'REPLICATION',
    'RESTRICT',
    'REWRITE',
    'ROLE',
    'ROLES',
    'SCHEMA',
    'SCHEMAS',
    'SECOND',
    'SEMI',
    'SERDE',
    'SERDEPROPERTIES',
    'SERVER',
    'SETS',
    'SHARED',
    'SHOW',
    'SHOW_DATABASE',
    'SKEWED',
    'SORT',
    'SORTED',
    'SSL',
    'STATISTICS',
    'STORED',
    'STREAMTABLE',
    'STRING',
    'TABLES',
    'TBLPROPERTIES',
    'TEMPORARY',
    'TERMINATED',
    'TINYINT',
    'TOUCH',
    'TRANSACTIONS',
    'UNARCHIVE',
    'UNDO',
    'UNIONTYPE',
    'UNLOCK',
    'UNSET',
    'UNSIGNED',
    'URI',
    'USE',
    'UTC',
    'UTCTIMESTAMP',
    'VALUE_TYPE',
    'VIEW',
    'WHILE',
    'YEAR',
    'AUTOCOMMIT',
    'ISOLATION',
    'LEVEL',
    'OFFSET',
    'SNAPSHOT',
    'TRANSACTION',
    'WORK',
    'WRITE',
    'ABORT',
    'KEY',
    'LAST',
    'NORELY',
    'NOVALIDATE',
    'NULLS',
    'RELY',
    'VALIDATE',
    'DETAIL',
    'DOW',
    'EXPRESSION',
    'OPERATOR',
    'QUARTER',
    'SUMMARY',
    'VECTORIZATION',
    'WEEK',
    'YEARS',
    'MONTHS',
    'WEEKS',
    'DAYS',
    'HOURS',
    'MINUTES',
    'SECONDS',
    'TIMESTAMPTZ',
    'ZONE',
    // reserved
    'ALL',
    'ALTER',
    'AND',
    'AS',
    'AUTHORIZATION',
    'BETWEEN',
    'BOTH',
    'BY',
    'CASE',
    'CAST',
    'COLUMN',
    'CONF',
    'CREATE',
    'CROSS',
    'CUBE',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_TIMESTAMP',
    'CURSOR',
    'DATABASE',
    'DELETE',
    'DESCRIBE',
    'DISTINCT',
    'DROP',
    'ELSE',
    'END',
    'EXCHANGE',
    'EXISTS',
    'EXTENDED',
    'EXTERNAL',
    'FALSE',
    'FETCH',
    'FOLLOWING',
    'FOR',
    'FROM',
    'FULL',
    'FUNCTION',
    'GRANT',
    'GROUP',
    'GROUPING',
    'HAVING',
    'IF',
    'IMPORT',
    'IN',
    'INNER',
    'INSERT',
    'INTERSECT',
    'INTO',
    'IS',
    'JOIN',
    'LATERAL',
    'LEFT',
    'LESS',
    'LIKE',
    'LOCAL',
    'MACRO',
    'MORE',
    'NONE',
    'NOT',
    'NULL',
    'OF',
    'ON',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OVER',
    'PARTIALSCAN',
    'PARTITION',
    'PERCENT',
    'PRECEDING',
    'PRESERVE',
    'PROCEDURE',
    'RANGE',
    'READS',
    'REDUCE',
    'REVOKE',
    'RIGHT',
    'ROLLUP',
    'ROW',
    'ROWS',
    'SELECT',
    'SET',
    'TABLE',
    'TABLESAMPLE',
    'THEN',
    'TO',
    'TRANSFORM',
    'TRIGGER',
    'TRUE',
    'TRUNCATE',
    'UNBOUNDED',
    'UNION',
    'UNIQUEJOIN',
    'UPDATE',
    'USER',
    'USING',
    'UTC_TMESTAMP',
    'VALUES',
    'WHEN',
    'WHERE',
    'WINDOW',
    'WITH',
    'COMMIT',
    'ONLY',
    'REGEXP',
    'RLIKE',
    'ROLLBACK',
    'START',
    'CACHE',
    'CONSTRAINT',
    'FOREIGN',
    'PRIMARY',
    'REFERENCES',
    'DAYOFWEEK',
    'EXTRACT',
    'FLOOR',
    'VIEWS',
    'TIME',
    'SYNC',
    // fileTypes
    'TEXTFILE',
    'SEQUENCEFILE',
    'ORC',
    'CSV',
    'TSV',
    'PARQUET',
    'AVRO',
    'RCFILE',
    'JSONFILE',
    'INPUTFORMAT',
    'OUTPUTFORMAT'
];
const dataTypes = [
    // https://cwiki.apache.org/confluence/display/Hive/LanguageManual+Types
    'ARRAY',
    'BIGINT',
    'BINARY',
    'BOOLEAN',
    'CHAR',
    'DATE',
    'DECIMAL',
    'DOUBLE',
    'FLOAT',
    'INT',
    'INTEGER',
    'INTERVAL',
    'MAP',
    'NUMERIC',
    'PRECISION',
    'SMALLINT',
    'STRUCT',
    'TIMESTAMP',
    'VARCHAR'
]; //# sourceMappingURL=hive.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/hive/hive.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hive",
    ()=>hive
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/hive/hive.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/hive/hive.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'SORT BY',
    'CLUSTER BY',
    'DISTRIBUTE BY',
    'LIMIT',
    // Data manipulation
    // - insert:
    //   Hive does not actually support plain INSERT INTO, only INSERT INTO TABLE
    //   but it's a nuisance to not support it, as all other dialects do.
    'INSERT INTO [TABLE]',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE INTO',
    'WHEN [NOT] MATCHED [THEN]',
    'UPDATE SET',
    'INSERT [VALUES]',
    // - insert overwrite directory:
    //   https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DML#LanguageManualDML-Writingdataintothefilesystemfromqueries
    'INSERT OVERWRITE [LOCAL] DIRECTORY',
    // - load:
    //   https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DML#LanguageManualDML-Loadingfilesintotables
    'LOAD DATA [LOCAL] INPATH',
    '[OVERWRITE] INTO TABLE'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [MATERIALIZED] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE',
    'RENAME TO',
    // - truncate:
    'TRUNCATE [TABLE]',
    // other
    'ALTER',
    'CREATE',
    'USE',
    'DESCRIBE',
    'DROP',
    'FETCH',
    'SHOW',
    'STORED AS',
    'STORED BY',
    'ROW FORMAT'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    // non-standard joins
    'LEFT SEMI JOIN'
]);
const reservedPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const hive = {
    name: 'hive',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases: reservedPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        extraParens: [
            '[]'
        ],
        stringTypes: [
            '""-bs',
            "''-bs"
        ],
        identTypes: [
            '``'
        ],
        variableTypes: [
            {
                quote: '{}',
                prefixes: [
                    '$'
                ],
                requirePrefix: true
            }
        ],
        operators: [
            '%',
            '~',
            '^',
            '|',
            '&',
            '<=>',
            '==',
            '!',
            '||'
        ]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=hive.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/likeMariaDb.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "postProcess",
    ()=>postProcess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
;
function postProcess(tokens) {
    return tokens.map((token, i)=>{
        const nextToken = tokens[i + 1] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EOF_TOKEN"];
        if (__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].SET(token) && nextToken.text === '(') {
            // This is SET datatype, not SET statement
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_FUNCTION_NAME
            });
        }
        const prevToken = tokens[i - 1] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EOF_TOKEN"];
        if (__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].VALUES(token) && prevToken.text === '=') {
            // This is VALUES() function, not VALUES clause
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_FUNCTION_NAME
            });
        }
        return token;
    });
} //# sourceMappingURL=likeMariaDb.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://mariadb.com/kb/en/reserved-words/
    'ACCESSIBLE',
    'ADD',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'AS',
    'ASC',
    'ASENSITIVE',
    'BEFORE',
    'BETWEEN',
    'BOTH',
    'BY',
    'CALL',
    'CASCADE',
    'CASE',
    'CHANGE',
    'CHECK',
    'COLLATE',
    'COLUMN',
    'CONDITION',
    'CONSTRAINT',
    'CONTINUE',
    'CONVERT',
    'CREATE',
    'CROSS',
    'CURRENT_DATE',
    'CURRENT_ROLE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURSOR',
    'DATABASE',
    'DATABASES',
    'DAY_HOUR',
    'DAY_MICROSECOND',
    'DAY_MINUTE',
    'DAY_SECOND',
    'DECLARE',
    'DEFAULT',
    'DELAYED',
    'DELETE',
    'DELETE_DOMAIN_ID',
    'DESC',
    'DESCRIBE',
    'DETERMINISTIC',
    'DISTINCT',
    'DISTINCTROW',
    'DIV',
    'DO_DOMAIN_IDS',
    'DROP',
    'DUAL',
    'EACH',
    'ELSE',
    'ELSEIF',
    'ENCLOSED',
    'ESCAPED',
    'EXCEPT',
    'EXISTS',
    'EXIT',
    'EXPLAIN',
    'FALSE',
    'FETCH',
    'FOR',
    'FORCE',
    'FOREIGN',
    'FROM',
    'FULLTEXT',
    'GENERAL',
    'GRANT',
    'GROUP',
    'HAVING',
    'HIGH_PRIORITY',
    'HOUR_MICROSECOND',
    'HOUR_MINUTE',
    'HOUR_SECOND',
    'IF',
    'IGNORE',
    'IGNORE_DOMAIN_IDS',
    'IGNORE_SERVER_IDS',
    'IN',
    'INDEX',
    'INFILE',
    'INNER',
    'INOUT',
    'INSENSITIVE',
    'INSERT',
    'INTERSECT',
    'INTERVAL',
    'INTO',
    'IS',
    'ITERATE',
    'JOIN',
    'KEY',
    'KEYS',
    'KILL',
    'LEADING',
    'LEAVE',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LINEAR',
    'LINES',
    'LOAD',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCK',
    'LOOP',
    'LOW_PRIORITY',
    'MASTER_HEARTBEAT_PERIOD',
    'MASTER_SSL_VERIFY_SERVER_CERT',
    'MATCH',
    'MAXVALUE',
    'MINUTE_MICROSECOND',
    'MINUTE_SECOND',
    'MOD',
    'MODIFIES',
    'NATURAL',
    'NOT',
    'NO_WRITE_TO_BINLOG',
    'NULL',
    'OFFSET',
    'ON',
    'OPTIMIZE',
    'OPTION',
    'OPTIONALLY',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OUTFILE',
    'OVER',
    'PAGE_CHECKSUM',
    'PARSE_VCOL_EXPR',
    'PARTITION',
    'POSITION',
    'PRIMARY',
    'PROCEDURE',
    'PURGE',
    'RANGE',
    'READ',
    'READS',
    'READ_WRITE',
    'RECURSIVE',
    'REF_SYSTEM_ID',
    'REFERENCES',
    'REGEXP',
    'RELEASE',
    'RENAME',
    'REPEAT',
    'REPLACE',
    'REQUIRE',
    'RESIGNAL',
    'RESTRICT',
    'RETURN',
    'RETURNING',
    'REVOKE',
    'RIGHT',
    'RLIKE',
    'ROW_NUMBER',
    'ROWS',
    'SCHEMA',
    'SCHEMAS',
    'SECOND_MICROSECOND',
    'SELECT',
    'SENSITIVE',
    'SEPARATOR',
    'SET',
    'SHOW',
    'SIGNAL',
    'SLOW',
    'SPATIAL',
    'SPECIFIC',
    'SQL',
    'SQLEXCEPTION',
    'SQLSTATE',
    'SQLWARNING',
    'SQL_BIG_RESULT',
    'SQL_CALC_FOUND_ROWS',
    'SQL_SMALL_RESULT',
    'SSL',
    'STARTING',
    'STATS_AUTO_RECALC',
    'STATS_PERSISTENT',
    'STATS_SAMPLE_PAGES',
    'STRAIGHT_JOIN',
    'TABLE',
    'TERMINATED',
    'THEN',
    'TO',
    'TRAILING',
    'TRIGGER',
    'TRUE',
    'UNDO',
    'UNION',
    'UNIQUE',
    'UNLOCK',
    'UNSIGNED',
    'UPDATE',
    'USAGE',
    'USE',
    'USING',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    'VALUES',
    'WHEN',
    'WHERE',
    'WHILE',
    'WINDOW',
    'WITH',
    'WRITE',
    'XOR',
    'YEAR_MONTH',
    'ZEROFILL'
];
const dataTypes = [
    // https://mariadb.com/kb/en/data-types/
    'BIGINT',
    'BINARY',
    'BIT',
    'BLOB',
    'CHAR BYTE',
    'CHAR',
    'CHARACTER',
    'DATETIME',
    'DEC',
    'DECIMAL',
    'DOUBLE PRECISION',
    'DOUBLE',
    'ENUM',
    'FIXED',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'INT',
    'INT1',
    'INT2',
    'INT3',
    'INT4',
    'INT8',
    'INTEGER',
    'LONG',
    'LONGBLOB',
    'LONGTEXT',
    'MEDIUMBLOB',
    'MEDIUMINT',
    'MEDIUMTEXT',
    'MIDDLEINT',
    'NATIONAL CHAR',
    'NATIONAL VARCHAR',
    'NUMERIC',
    'PRECISION',
    'REAL',
    'SMALLINT',
    'TEXT',
    'TIMESTAMP',
    'TINYBLOB',
    'TINYINT',
    'TINYTEXT',
    'VARBINARY',
    'VARCHAR',
    'VARCHARACTER',
    'VARYING',
    'YEAR'
]; //# sourceMappingURL=mariadb.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://mariadb.com/kb/en/information-schema-sql_functions-table/
    'ADDDATE',
    'ADD_MONTHS',
    'BIT_AND',
    'BIT_OR',
    'BIT_XOR',
    'CAST',
    'COUNT',
    'CUME_DIST',
    'CURDATE',
    'CURTIME',
    'DATE_ADD',
    'DATE_SUB',
    'DATE_FORMAT',
    'DECODE',
    'DENSE_RANK',
    'EXTRACT',
    'FIRST_VALUE',
    'GROUP_CONCAT',
    'JSON_ARRAYAGG',
    'JSON_OBJECTAGG',
    'LAG',
    'LEAD',
    'MAX',
    'MEDIAN',
    'MID',
    'MIN',
    'NOW',
    'NTH_VALUE',
    'NTILE',
    'POSITION',
    'PERCENT_RANK',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'RANK',
    'ROW_NUMBER',
    'SESSION_USER',
    'STD',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'SUBDATE',
    'SUBSTR',
    'SUBSTRING',
    'SUM',
    'SYSTEM_USER',
    'TRIM',
    'TRIM_ORACLE',
    'VARIANCE',
    'VAR_POP',
    'VAR_SAMP',
    'ABS',
    'ACOS',
    'ADDTIME',
    'AES_DECRYPT',
    'AES_ENCRYPT',
    'ASIN',
    'ATAN',
    'ATAN2',
    'BENCHMARK',
    'BIN',
    'BINLOG_GTID_POS',
    'BIT_COUNT',
    'BIT_LENGTH',
    'CEIL',
    'CEILING',
    'CHARACTER_LENGTH',
    'CHAR_LENGTH',
    'CHR',
    'COERCIBILITY',
    'COLUMN_CHECK',
    'COLUMN_EXISTS',
    'COLUMN_LIST',
    'COLUMN_JSON',
    'COMPRESS',
    'CONCAT',
    'CONCAT_OPERATOR_ORACLE',
    'CONCAT_WS',
    'CONNECTION_ID',
    'CONV',
    'CONVERT_TZ',
    'COS',
    'COT',
    'CRC32',
    'DATEDIFF',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'DEGREES',
    'DECODE_HISTOGRAM',
    'DECODE_ORACLE',
    'DES_DECRYPT',
    'DES_ENCRYPT',
    'ELT',
    'ENCODE',
    'ENCRYPT',
    'EXP',
    'EXPORT_SET',
    'EXTRACTVALUE',
    'FIELD',
    'FIND_IN_SET',
    'FLOOR',
    'FORMAT',
    'FOUND_ROWS',
    'FROM_BASE64',
    'FROM_DAYS',
    'FROM_UNIXTIME',
    'GET_LOCK',
    'GREATEST',
    'HEX',
    'IFNULL',
    'INSTR',
    'ISNULL',
    'IS_FREE_LOCK',
    'IS_USED_LOCK',
    'JSON_ARRAY',
    'JSON_ARRAY_APPEND',
    'JSON_ARRAY_INSERT',
    'JSON_COMPACT',
    'JSON_CONTAINS',
    'JSON_CONTAINS_PATH',
    'JSON_DEPTH',
    'JSON_DETAILED',
    'JSON_EXISTS',
    'JSON_EXTRACT',
    'JSON_INSERT',
    'JSON_KEYS',
    'JSON_LENGTH',
    'JSON_LOOSE',
    'JSON_MERGE',
    'JSON_MERGE_PATCH',
    'JSON_MERGE_PRESERVE',
    'JSON_QUERY',
    'JSON_QUOTE',
    'JSON_OBJECT',
    'JSON_REMOVE',
    'JSON_REPLACE',
    'JSON_SET',
    'JSON_SEARCH',
    'JSON_TYPE',
    'JSON_UNQUOTE',
    'JSON_VALID',
    'JSON_VALUE',
    'LAST_DAY',
    'LAST_INSERT_ID',
    'LCASE',
    'LEAST',
    'LENGTH',
    'LENGTHB',
    'LN',
    'LOAD_FILE',
    'LOCATE',
    'LOG',
    'LOG10',
    'LOG2',
    'LOWER',
    'LPAD',
    'LPAD_ORACLE',
    'LTRIM',
    'LTRIM_ORACLE',
    'MAKEDATE',
    'MAKETIME',
    'MAKE_SET',
    'MASTER_GTID_WAIT',
    'MASTER_POS_WAIT',
    'MD5',
    'MONTHNAME',
    'NAME_CONST',
    'NVL',
    'NVL2',
    'OCT',
    'OCTET_LENGTH',
    'ORD',
    'PERIOD_ADD',
    'PERIOD_DIFF',
    'PI',
    'POW',
    'POWER',
    'QUOTE',
    'REGEXP_INSTR',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'RADIANS',
    'RAND',
    'RELEASE_ALL_LOCKS',
    'RELEASE_LOCK',
    'REPLACE_ORACLE',
    'REVERSE',
    'ROUND',
    'RPAD',
    'RPAD_ORACLE',
    'RTRIM',
    'RTRIM_ORACLE',
    'SEC_TO_TIME',
    'SHA',
    'SHA1',
    'SHA2',
    'SIGN',
    'SIN',
    'SLEEP',
    'SOUNDEX',
    'SPACE',
    'SQRT',
    'STRCMP',
    'STR_TO_DATE',
    'SUBSTR_ORACLE',
    'SUBSTRING_INDEX',
    'SUBTIME',
    'SYS_GUID',
    'TAN',
    'TIMEDIFF',
    'TIME_FORMAT',
    'TIME_TO_SEC',
    'TO_BASE64',
    'TO_CHAR',
    'TO_DAYS',
    'TO_SECONDS',
    'UCASE',
    'UNCOMPRESS',
    'UNCOMPRESSED_LENGTH',
    'UNHEX',
    'UNIX_TIMESTAMP',
    'UPDATEXML',
    'UPPER',
    'UUID',
    'UUID_SHORT',
    'VERSION',
    'WEEKDAY',
    'WEEKOFYEAR',
    'WSREP_LAST_WRITTEN_GTID',
    'WSREP_LAST_SEEN_GTID',
    'WSREP_SYNC_WAIT_UPTO_GTID',
    'YEARWEEK',
    // CASE expression shorthands
    'COALESCE',
    'NULLIF'
]; //# sourceMappingURL=mariadb.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mariadb",
    ()=>mariadb
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/likeMariaDb.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.keywords.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.functions.js [app-client] (ecmascript)");
;
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT | DISTINCTROW]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    // Data manipulation
    // - insert:
    'INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE] [INTO]',
    'REPLACE [LOW_PRIORITY | DELAYED] [INTO]',
    'VALUES',
    'ON DUPLICATE KEY UPDATE',
    // - update:
    'SET',
    // other
    'RETURNING'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [OR REPLACE] [TEMPORARY] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [SQL SECURITY DEFINER | SQL SECURITY INVOKER] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE [LOW_PRIORITY] [IGNORE]',
    // - delete:
    'DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM',
    // - drop table:
    'DROP [TEMPORARY] TABLE [IF EXISTS]',
    // - alter table:
    'ALTER [ONLINE] [IGNORE] TABLE [IF EXISTS]',
    'ADD [COLUMN] [IF NOT EXISTS]',
    '{CHANGE | MODIFY} [COLUMN] [IF EXISTS]',
    'DROP [COLUMN] [IF EXISTS]',
    'RENAME [TO]',
    'RENAME COLUMN',
    'ALTER [COLUMN]',
    '{SET | DROP} DEFAULT',
    'SET {VISIBLE | INVISIBLE}',
    // - truncate:
    'TRUNCATE [TABLE]',
    // https://mariadb.com/docs/reference/mdb/sql-statements/
    'ALTER DATABASE',
    'ALTER DATABASE COMMENT',
    'ALTER EVENT',
    'ALTER FUNCTION',
    'ALTER PROCEDURE',
    'ALTER SCHEMA',
    'ALTER SCHEMA COMMENT',
    'ALTER SEQUENCE',
    'ALTER SERVER',
    'ALTER USER',
    'ALTER VIEW',
    'ANALYZE',
    'ANALYZE TABLE',
    'BACKUP LOCK',
    'BACKUP STAGE',
    'BACKUP UNLOCK',
    'BEGIN',
    'BINLOG',
    'CACHE INDEX',
    'CALL',
    'CHANGE MASTER TO',
    'CHECK TABLE',
    'CHECK VIEW',
    'CHECKSUM TABLE',
    'COMMIT',
    'CREATE AGGREGATE FUNCTION',
    'CREATE DATABASE',
    'CREATE EVENT',
    'CREATE FUNCTION',
    'CREATE INDEX',
    'CREATE PROCEDURE',
    'CREATE ROLE',
    'CREATE SEQUENCE',
    'CREATE SERVER',
    'CREATE SPATIAL INDEX',
    'CREATE TRIGGER',
    'CREATE UNIQUE INDEX',
    'CREATE USER',
    'DEALLOCATE PREPARE',
    'DESCRIBE',
    'DROP DATABASE',
    'DROP EVENT',
    'DROP FUNCTION',
    'DROP INDEX',
    'DROP PREPARE',
    'DROP PROCEDURE',
    'DROP ROLE',
    'DROP SEQUENCE',
    'DROP SERVER',
    'DROP TRIGGER',
    'DROP USER',
    'DROP VIEW',
    'EXECUTE',
    'EXPLAIN',
    'FLUSH',
    'GET DIAGNOSTICS',
    'GET DIAGNOSTICS CONDITION',
    'GRANT',
    'HANDLER',
    'HELP',
    'INSTALL PLUGIN',
    'INSTALL SONAME',
    'KILL',
    'LOAD DATA INFILE',
    'LOAD INDEX INTO CACHE',
    'LOAD XML INFILE',
    'LOCK TABLE',
    'OPTIMIZE TABLE',
    'PREPARE',
    'PURGE BINARY LOGS',
    'PURGE MASTER LOGS',
    'RELEASE SAVEPOINT',
    'RENAME TABLE',
    'RENAME USER',
    'REPAIR TABLE',
    'REPAIR VIEW',
    'RESET MASTER',
    'RESET QUERY CACHE',
    'RESET REPLICA',
    'RESET SLAVE',
    'RESIGNAL',
    'REVOKE',
    'ROLLBACK',
    'SAVEPOINT',
    'SET CHARACTER SET',
    'SET DEFAULT ROLE',
    'SET GLOBAL TRANSACTION',
    'SET NAMES',
    'SET PASSWORD',
    'SET ROLE',
    'SET STATEMENT',
    'SET TRANSACTION',
    'SHOW',
    'SHOW ALL REPLICAS STATUS',
    'SHOW ALL SLAVES STATUS',
    'SHOW AUTHORS',
    'SHOW BINARY LOGS',
    'SHOW BINLOG EVENTS',
    'SHOW BINLOG STATUS',
    'SHOW CHARACTER SET',
    'SHOW CLIENT_STATISTICS',
    'SHOW COLLATION',
    'SHOW COLUMNS',
    'SHOW CONTRIBUTORS',
    'SHOW CREATE DATABASE',
    'SHOW CREATE EVENT',
    'SHOW CREATE FUNCTION',
    'SHOW CREATE PACKAGE',
    'SHOW CREATE PACKAGE BODY',
    'SHOW CREATE PROCEDURE',
    'SHOW CREATE SEQUENCE',
    'SHOW CREATE TABLE',
    'SHOW CREATE TRIGGER',
    'SHOW CREATE USER',
    'SHOW CREATE VIEW',
    'SHOW DATABASES',
    'SHOW ENGINE',
    'SHOW ENGINE INNODB STATUS',
    'SHOW ENGINES',
    'SHOW ERRORS',
    'SHOW EVENTS',
    'SHOW EXPLAIN',
    'SHOW FUNCTION CODE',
    'SHOW FUNCTION STATUS',
    'SHOW GRANTS',
    'SHOW INDEX',
    'SHOW INDEXES',
    'SHOW INDEX_STATISTICS',
    'SHOW KEYS',
    'SHOW LOCALES',
    'SHOW MASTER LOGS',
    'SHOW MASTER STATUS',
    'SHOW OPEN TABLES',
    'SHOW PACKAGE BODY CODE',
    'SHOW PACKAGE BODY STATUS',
    'SHOW PACKAGE STATUS',
    'SHOW PLUGINS',
    'SHOW PLUGINS SONAME',
    'SHOW PRIVILEGES',
    'SHOW PROCEDURE CODE',
    'SHOW PROCEDURE STATUS',
    'SHOW PROCESSLIST',
    'SHOW PROFILE',
    'SHOW PROFILES',
    'SHOW QUERY_RESPONSE_TIME',
    'SHOW RELAYLOG EVENTS',
    'SHOW REPLICA',
    'SHOW REPLICA HOSTS',
    'SHOW REPLICA STATUS',
    'SHOW SCHEMAS',
    'SHOW SLAVE',
    'SHOW SLAVE HOSTS',
    'SHOW SLAVE STATUS',
    'SHOW STATUS',
    'SHOW STORAGE ENGINES',
    'SHOW TABLE STATUS',
    'SHOW TABLES',
    'SHOW TRIGGERS',
    'SHOW USER_STATISTICS',
    'SHOW VARIABLES',
    'SHOW WARNINGS',
    'SHOW WSREP_MEMBERSHIP',
    'SHOW WSREP_STATUS',
    'SHUTDOWN',
    'SIGNAL',
    'START ALL REPLICAS',
    'START ALL SLAVES',
    'START REPLICA',
    'START SLAVE',
    'START TRANSACTION',
    'STOP ALL REPLICAS',
    'STOP ALL SLAVES',
    'STOP REPLICA',
    'STOP SLAVE',
    'UNINSTALL PLUGIN',
    'UNINSTALL SONAME',
    'UNLOCK TABLE',
    'USE',
    'XA BEGIN',
    'XA COMMIT',
    'XA END',
    'XA PREPARE',
    'XA RECOVER',
    'XA ROLLBACK',
    'XA START'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]',
    'EXCEPT [ALL | DISTINCT]',
    'INTERSECT [ALL | DISTINCT]',
    'MINUS [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL JOIN',
    'NATURAL {LEFT | RIGHT} [OUTER] JOIN',
    // non-standard joins
    'STRAIGHT_JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]',
    'CHARACTER SET',
    '{ROWS | RANGE} BETWEEN',
    'IDENTIFIED BY'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const mariadb = {
    name: 'mariadb',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        // TODO: support _ char set prefixes such as _utf8, _latin1, _binary, _utf8mb4, etc.
        stringTypes: [
            '""-qq-bs',
            "''-qq-bs",
            {
                quote: "''-raw",
                prefixes: [
                    'B',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            '``'
        ],
        identChars: {
            first: '$',
            rest: '$',
            allowFirstCharNumber: true
        },
        variableTypes: [
            {
                regex: '@@?[A-Za-z0-9_.$]+'
            },
            {
                quote: '""-qq-bs',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            },
            {
                quote: "''-qq-bs",
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            },
            {
                quote: '``',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            }
        ],
        paramTypes: {
            positional: true
        },
        lineCommentTypes: [
            '--',
            '#'
        ],
        operators: [
            '%',
            ':=',
            '&',
            '|',
            '^',
            '~',
            '<<',
            '>>',
            '<=>',
            '&&',
            '||',
            '!',
            '*.*'
        ],
        postProcess: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postProcess"]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=mariadb.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mysql/mysql.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://dev.mysql.com/doc/refman/8.0/en/keywords.html
    'ACCESSIBLE',
    'ADD',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'AS',
    'ASC',
    'ASENSITIVE',
    'BEFORE',
    'BETWEEN',
    'BOTH',
    'BY',
    'CALL',
    'CASCADE',
    'CASE',
    'CHANGE',
    'CHECK',
    'COLLATE',
    'COLUMN',
    'CONDITION',
    'CONSTRAINT',
    'CONTINUE',
    'CONVERT',
    'CREATE',
    'CROSS',
    'CUBE',
    'CUME_DIST',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURSOR',
    'DATABASE',
    'DATABASES',
    'DAY_HOUR',
    'DAY_MICROSECOND',
    'DAY_MINUTE',
    'DAY_SECOND',
    'DECLARE',
    'DEFAULT',
    'DELAYED',
    'DELETE',
    'DENSE_RANK',
    'DESC',
    'DESCRIBE',
    'DETERMINISTIC',
    'DISTINCT',
    'DISTINCTROW',
    'DIV',
    'DROP',
    'DUAL',
    'EACH',
    'ELSE',
    'ELSEIF',
    'EMPTY',
    'ENCLOSED',
    'ESCAPED',
    'EXCEPT',
    'EXISTS',
    'EXIT',
    'EXPLAIN',
    'FALSE',
    'FETCH',
    'FIRST_VALUE',
    'FOR',
    'FORCE',
    'FOREIGN',
    'FROM',
    'FULLTEXT',
    'FUNCTION',
    'GENERATED',
    'GET',
    'GRANT',
    'GROUP',
    'GROUPING',
    'GROUPS',
    'HAVING',
    'HIGH_PRIORITY',
    'HOUR_MICROSECOND',
    'HOUR_MINUTE',
    'HOUR_SECOND',
    'IF',
    'IGNORE',
    'IN',
    'INDEX',
    'INFILE',
    'INNER',
    'INOUT',
    'INSENSITIVE',
    'INSERT',
    'IN',
    'INTERSECT',
    'INTERVAL',
    'INTO',
    'IO_AFTER_GTIDS',
    'IO_BEFORE_GTIDS',
    'IS',
    'ITERATE',
    'JOIN',
    'JSON_TABLE',
    'KEY',
    'KEYS',
    'KILL',
    'LAG',
    'LAST_VALUE',
    'LATERAL',
    'LEAD',
    'LEADING',
    'LEAVE',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LINEAR',
    'LINES',
    'LOAD',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCK',
    'LONG',
    'LOOP',
    'LOW_PRIORITY',
    'MASTER_BIND',
    'MASTER_SSL_VERIFY_SERVER_CERT',
    'MATCH',
    'MAXVALUE',
    'MINUTE_MICROSECOND',
    'MINUTE_SECOND',
    'MOD',
    'MODIFIES',
    'NATURAL',
    'NOT',
    'NO_WRITE_TO_BINLOG',
    'NTH_VALUE',
    'NTILE',
    'NULL',
    'OF',
    'ON',
    'OPTIMIZE',
    'OPTIMIZER_COSTS',
    'OPTION',
    'OPTIONALLY',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OUTFILE',
    'OVER',
    'PARTITION',
    'PERCENT_RANK',
    'PRIMARY',
    'PROCEDURE',
    'PURGE',
    'RANGE',
    'RANK',
    'READ',
    'READS',
    'READ_WRITE',
    'RECURSIVE',
    'REFERENCES',
    'REGEXP',
    'RELEASE',
    'RENAME',
    'REPEAT',
    'REPLACE',
    'REQUIRE',
    'RESIGNAL',
    'RESTRICT',
    'RETURN',
    'REVOKE',
    'RIGHT',
    'RLIKE',
    'ROW',
    'ROWS',
    'ROW_NUMBER',
    'SCHEMA',
    'SCHEMAS',
    'SECOND_MICROSECOND',
    'SELECT',
    'SENSITIVE',
    'SEPARATOR',
    'SET',
    'SHOW',
    'SIGNAL',
    'SPATIAL',
    'SPECIFIC',
    'SQL',
    'SQLEXCEPTION',
    'SQLSTATE',
    'SQLWARNING',
    'SQL_BIG_RESULT',
    'SQL_CALC_FOUND_ROWS',
    'SQL_SMALL_RESULT',
    'SSL',
    'STARTING',
    'STORED',
    'STRAIGHT_JOIN',
    'SYSTEM',
    'TABLE',
    'TERMINATED',
    'THEN',
    'TO',
    'TRAILING',
    'TRIGGER',
    'TRUE',
    'UNDO',
    'UNION',
    'UNIQUE',
    'UNLOCK',
    'UNSIGNED',
    'UPDATE',
    'USAGE',
    'USE',
    'USING',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    'VALUES',
    'VIRTUAL',
    'WHEN',
    'WHERE',
    'WHILE',
    'WINDOW',
    'WITH',
    'WRITE',
    'XOR',
    'YEAR_MONTH',
    'ZEROFILL'
];
const dataTypes = [
    // https://dev.mysql.com/doc/refman/8.0/en/data-types.html
    'BIGINT',
    'BINARY',
    'BIT',
    'BLOB',
    'BOOL',
    'BOOLEAN',
    'CHAR',
    'CHARACTER',
    'DATE',
    'DATETIME',
    'DEC',
    'DECIMAL',
    'DOUBLE PRECISION',
    'DOUBLE',
    'ENUM',
    'FIXED',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'INT',
    'INT1',
    'INT2',
    'INT3',
    'INT4',
    'INT8',
    'INTEGER',
    'LONGBLOB',
    'LONGTEXT',
    'MEDIUMBLOB',
    'MEDIUMINT',
    'MEDIUMTEXT',
    'MIDDLEINT',
    'NATIONAL CHAR',
    'NATIONAL VARCHAR',
    'NUMERIC',
    'PRECISION',
    'REAL',
    'SMALLINT',
    'TEXT',
    'TIME',
    'TIMESTAMP',
    'TINYBLOB',
    'TINYINT',
    'TINYTEXT',
    'VARBINARY',
    'VARCHAR',
    'VARCHARACTER',
    'VARYING',
    'YEAR'
]; //# sourceMappingURL=mysql.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mysql/mysql.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://dev.mysql.com/doc/refman/8.0/en/built-in-function-reference.html
    'ABS',
    'ACOS',
    'ADDDATE',
    'ADDTIME',
    'AES_DECRYPT',
    'AES_ENCRYPT',
    // 'AND',
    'ANY_VALUE',
    'ASCII',
    'ASIN',
    'ATAN',
    'ATAN2',
    'AVG',
    'BENCHMARK',
    'BIN',
    'BIN_TO_UUID',
    'BINARY',
    'BIT_AND',
    'BIT_COUNT',
    'BIT_LENGTH',
    'BIT_OR',
    'BIT_XOR',
    'CAN_ACCESS_COLUMN',
    'CAN_ACCESS_DATABASE',
    'CAN_ACCESS_TABLE',
    'CAN_ACCESS_USER',
    'CAN_ACCESS_VIEW',
    'CAST',
    'CEIL',
    'CEILING',
    'CHAR',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'CHARSET',
    'COALESCE',
    'COERCIBILITY',
    'COLLATION',
    'COMPRESS',
    'CONCAT',
    'CONCAT_WS',
    'CONNECTION_ID',
    'CONV',
    'CONVERT',
    'CONVERT_TZ',
    'COS',
    'COT',
    'COUNT',
    'CRC32',
    'CUME_DIST',
    'CURDATE',
    'CURRENT_DATE',
    'CURRENT_ROLE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURTIME',
    'DATABASE',
    'DATE',
    'DATE_ADD',
    'DATE_FORMAT',
    'DATE_SUB',
    'DATEDIFF',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'DEFAULT',
    'DEGREES',
    'DENSE_RANK',
    'DIV',
    'ELT',
    'EXP',
    'EXPORT_SET',
    'EXTRACT',
    'EXTRACTVALUE',
    'FIELD',
    'FIND_IN_SET',
    'FIRST_VALUE',
    'FLOOR',
    'FORMAT',
    'FORMAT_BYTES',
    'FORMAT_PICO_TIME',
    'FOUND_ROWS',
    'FROM_BASE64',
    'FROM_DAYS',
    'FROM_UNIXTIME',
    'GEOMCOLLECTION',
    'GEOMETRYCOLLECTION',
    'GET_DD_COLUMN_PRIVILEGES',
    'GET_DD_CREATE_OPTIONS',
    'GET_DD_INDEX_SUB_PART_LENGTH',
    'GET_FORMAT',
    'GET_LOCK',
    'GREATEST',
    'GROUP_CONCAT',
    'GROUPING',
    'GTID_SUBSET',
    'GTID_SUBTRACT',
    'HEX',
    'HOUR',
    'ICU_VERSION',
    'IF',
    'IFNULL',
    // 'IN',
    'INET_ATON',
    'INET_NTOA',
    'INET6_ATON',
    'INET6_NTOA',
    'INSERT',
    'INSTR',
    'INTERNAL_AUTO_INCREMENT',
    'INTERNAL_AVG_ROW_LENGTH',
    'INTERNAL_CHECK_TIME',
    'INTERNAL_CHECKSUM',
    'INTERNAL_DATA_FREE',
    'INTERNAL_DATA_LENGTH',
    'INTERNAL_DD_CHAR_LENGTH',
    'INTERNAL_GET_COMMENT_OR_ERROR',
    'INTERNAL_GET_ENABLED_ROLE_JSON',
    'INTERNAL_GET_HOSTNAME',
    'INTERNAL_GET_USERNAME',
    'INTERNAL_GET_VIEW_WARNING_OR_ERROR',
    'INTERNAL_INDEX_COLUMN_CARDINALITY',
    'INTERNAL_INDEX_LENGTH',
    'INTERNAL_IS_ENABLED_ROLE',
    'INTERNAL_IS_MANDATORY_ROLE',
    'INTERNAL_KEYS_DISABLED',
    'INTERNAL_MAX_DATA_LENGTH',
    'INTERNAL_TABLE_ROWS',
    'INTERNAL_UPDATE_TIME',
    'INTERVAL',
    'IS',
    'IS_FREE_LOCK',
    'IS_IPV4',
    'IS_IPV4_COMPAT',
    'IS_IPV4_MAPPED',
    'IS_IPV6',
    'IS NOT',
    'IS NOT NULL',
    'IS NULL',
    'IS_USED_LOCK',
    'IS_UUID',
    'ISNULL',
    'JSON_ARRAY',
    'JSON_ARRAY_APPEND',
    'JSON_ARRAY_INSERT',
    'JSON_ARRAYAGG',
    'JSON_CONTAINS',
    'JSON_CONTAINS_PATH',
    'JSON_DEPTH',
    'JSON_EXTRACT',
    'JSON_INSERT',
    'JSON_KEYS',
    'JSON_LENGTH',
    'JSON_MERGE',
    'JSON_MERGE_PATCH',
    'JSON_MERGE_PRESERVE',
    'JSON_OBJECT',
    'JSON_OBJECTAGG',
    'JSON_OVERLAPS',
    'JSON_PRETTY',
    'JSON_QUOTE',
    'JSON_REMOVE',
    'JSON_REPLACE',
    'JSON_SCHEMA_VALID',
    'JSON_SCHEMA_VALIDATION_REPORT',
    'JSON_SEARCH',
    'JSON_SET',
    'JSON_STORAGE_FREE',
    'JSON_STORAGE_SIZE',
    'JSON_TABLE',
    'JSON_TYPE',
    'JSON_UNQUOTE',
    'JSON_VALID',
    'JSON_VALUE',
    'LAG',
    'LAST_DAY',
    'LAST_INSERT_ID',
    'LAST_VALUE',
    'LCASE',
    'LEAD',
    'LEAST',
    'LEFT',
    'LENGTH',
    'LIKE',
    'LINESTRING',
    'LN',
    'LOAD_FILE',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCATE',
    'LOG',
    'LOG10',
    'LOG2',
    'LOWER',
    'LPAD',
    'LTRIM',
    'MAKE_SET',
    'MAKEDATE',
    'MAKETIME',
    'MASTER_POS_WAIT',
    'MATCH',
    'MAX',
    'MBRCONTAINS',
    'MBRCOVEREDBY',
    'MBRCOVERS',
    'MBRDISJOINT',
    'MBREQUALS',
    'MBRINTERSECTS',
    'MBROVERLAPS',
    'MBRTOUCHES',
    'MBRWITHIN',
    'MD5',
    'MEMBER OF',
    'MICROSECOND',
    'MID',
    'MIN',
    'MINUTE',
    'MOD',
    'MONTH',
    'MONTHNAME',
    'MULTILINESTRING',
    'MULTIPOINT',
    'MULTIPOLYGON',
    'NAME_CONST',
    'NOT',
    'NOT IN',
    'NOT LIKE',
    'NOT REGEXP',
    'NOW',
    'NTH_VALUE',
    'NTILE',
    'NULLIF',
    'OCT',
    'OCTET_LENGTH',
    // 'OR',
    'ORD',
    'PERCENT_RANK',
    'PERIOD_ADD',
    'PERIOD_DIFF',
    'PI',
    'POINT',
    'POLYGON',
    'POSITION',
    'POW',
    'POWER',
    'PS_CURRENT_THREAD_ID',
    'PS_THREAD_ID',
    'QUARTER',
    'QUOTE',
    'RADIANS',
    'RAND',
    'RANDOM_BYTES',
    'RANK',
    'REGEXP',
    'REGEXP_INSTR',
    'REGEXP_LIKE',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'RELEASE_ALL_LOCKS',
    'RELEASE_LOCK',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'RIGHT',
    'RLIKE',
    'ROLES_GRAPHML',
    'ROUND',
    'ROW_COUNT',
    'ROW_NUMBER',
    'RPAD',
    'RTRIM',
    'SCHEMA',
    'SEC_TO_TIME',
    'SECOND',
    'SESSION_USER',
    'SHA1',
    'SHA2',
    'SIGN',
    'SIN',
    'SLEEP',
    'SOUNDEX',
    'SOUNDS LIKE',
    'SOURCE_POS_WAIT',
    'SPACE',
    'SQRT',
    'ST_AREA',
    'ST_ASBINARY',
    'ST_ASGEOJSON',
    'ST_ASTEXT',
    'ST_BUFFER',
    'ST_BUFFER_STRATEGY',
    'ST_CENTROID',
    'ST_COLLECT',
    'ST_CONTAINS',
    'ST_CONVEXHULL',
    'ST_CROSSES',
    'ST_DIFFERENCE',
    'ST_DIMENSION',
    'ST_DISJOINT',
    'ST_DISTANCE',
    'ST_DISTANCE_SPHERE',
    'ST_ENDPOINT',
    'ST_ENVELOPE',
    'ST_EQUALS',
    'ST_EXTERIORRING',
    'ST_FRECHETDISTANCE',
    'ST_GEOHASH',
    'ST_GEOMCOLLFROMTEXT',
    'ST_GEOMCOLLFROMWKB',
    'ST_GEOMETRYN',
    'ST_GEOMETRYTYPE',
    'ST_GEOMFROMGEOJSON',
    'ST_GEOMFROMTEXT',
    'ST_GEOMFROMWKB',
    'ST_HAUSDORFFDISTANCE',
    'ST_INTERIORRINGN',
    'ST_INTERSECTION',
    'ST_INTERSECTS',
    'ST_ISCLOSED',
    'ST_ISEMPTY',
    'ST_ISSIMPLE',
    'ST_ISVALID',
    'ST_LATFROMGEOHASH',
    'ST_LATITUDE',
    'ST_LENGTH',
    'ST_LINEFROMTEXT',
    'ST_LINEFROMWKB',
    'ST_LINEINTERPOLATEPOINT',
    'ST_LINEINTERPOLATEPOINTS',
    'ST_LONGFROMGEOHASH',
    'ST_LONGITUDE',
    'ST_MAKEENVELOPE',
    'ST_MLINEFROMTEXT',
    'ST_MLINEFROMWKB',
    'ST_MPOINTFROMTEXT',
    'ST_MPOINTFROMWKB',
    'ST_MPOLYFROMTEXT',
    'ST_MPOLYFROMWKB',
    'ST_NUMGEOMETRIES',
    'ST_NUMINTERIORRING',
    'ST_NUMPOINTS',
    'ST_OVERLAPS',
    'ST_POINTATDISTANCE',
    'ST_POINTFROMGEOHASH',
    'ST_POINTFROMTEXT',
    'ST_POINTFROMWKB',
    'ST_POINTN',
    'ST_POLYFROMTEXT',
    'ST_POLYFROMWKB',
    'ST_SIMPLIFY',
    'ST_SRID',
    'ST_STARTPOINT',
    'ST_SWAPXY',
    'ST_SYMDIFFERENCE',
    'ST_TOUCHES',
    'ST_TRANSFORM',
    'ST_UNION',
    'ST_VALIDATE',
    'ST_WITHIN',
    'ST_X',
    'ST_Y',
    'STATEMENT_DIGEST',
    'STATEMENT_DIGEST_TEXT',
    'STD',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STR_TO_DATE',
    'STRCMP',
    'SUBDATE',
    'SUBSTR',
    'SUBSTRING',
    'SUBSTRING_INDEX',
    'SUBTIME',
    'SUM',
    'SYSDATE',
    'SYSTEM_USER',
    'TAN',
    'TIME',
    'TIME_FORMAT',
    'TIME_TO_SEC',
    'TIMEDIFF',
    'TIMESTAMP',
    'TIMESTAMPADD',
    'TIMESTAMPDIFF',
    'TO_BASE64',
    'TO_DAYS',
    'TO_SECONDS',
    'TRIM',
    'TRUNCATE',
    'UCASE',
    'UNCOMPRESS',
    'UNCOMPRESSED_LENGTH',
    'UNHEX',
    'UNIX_TIMESTAMP',
    'UPDATEXML',
    'UPPER',
    // 'USER',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    'UUID',
    'UUID_SHORT',
    'UUID_TO_BIN',
    'VALIDATE_PASSWORD_STRENGTH',
    'VALUES',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    'VERSION',
    'WAIT_FOR_EXECUTED_GTID_SET',
    'WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS',
    'WEEK',
    'WEEKDAY',
    'WEEKOFYEAR',
    'WEIGHT_STRING',
    // 'XOR',
    'YEAR',
    'YEARWEEK'
]; //# sourceMappingURL=mysql.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mysql/mysql.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mysql",
    ()=>mysql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/likeMariaDb.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mysql/mysql.keywords.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mysql/mysql.functions.js [app-client] (ecmascript)");
;
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT | DISTINCTROW]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    // Data manipulation
    // - insert:
    'INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE] [INTO]',
    'REPLACE [LOW_PRIORITY | DELAYED] [INTO]',
    'VALUES',
    'ON DUPLICATE KEY UPDATE',
    // - update:
    'SET'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [TEMPORARY] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [SQL SECURITY DEFINER | SQL SECURITY INVOKER] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE [LOW_PRIORITY] [IGNORE]',
    // - delete:
    'DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM',
    // - drop table:
    'DROP [TEMPORARY] TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE',
    'ADD [COLUMN]',
    '{CHANGE | MODIFY} [COLUMN]',
    'DROP [COLUMN]',
    'RENAME [TO | AS]',
    'RENAME COLUMN',
    'ALTER [COLUMN]',
    '{SET | DROP} DEFAULT',
    // - truncate:
    'TRUNCATE [TABLE]',
    // https://dev.mysql.com/doc/refman/8.0/en/sql-statements.html
    'ALTER DATABASE',
    'ALTER EVENT',
    'ALTER FUNCTION',
    'ALTER INSTANCE',
    'ALTER LOGFILE GROUP',
    'ALTER PROCEDURE',
    'ALTER RESOURCE GROUP',
    'ALTER SERVER',
    'ALTER TABLESPACE',
    'ALTER USER',
    'ALTER VIEW',
    'ANALYZE TABLE',
    'BINLOG',
    'CACHE INDEX',
    'CALL',
    'CHANGE MASTER TO',
    'CHANGE REPLICATION FILTER',
    'CHANGE REPLICATION SOURCE TO',
    'CHECK TABLE',
    'CHECKSUM TABLE',
    'CLONE',
    'COMMIT',
    'CREATE DATABASE',
    'CREATE EVENT',
    'CREATE FUNCTION',
    'CREATE FUNCTION',
    'CREATE INDEX',
    'CREATE LOGFILE GROUP',
    'CREATE PROCEDURE',
    'CREATE RESOURCE GROUP',
    'CREATE ROLE',
    'CREATE SERVER',
    'CREATE SPATIAL REFERENCE SYSTEM',
    'CREATE TABLESPACE',
    'CREATE TRIGGER',
    'CREATE USER',
    'DEALLOCATE PREPARE',
    'DESCRIBE',
    'DROP DATABASE',
    'DROP EVENT',
    'DROP FUNCTION',
    'DROP FUNCTION',
    'DROP INDEX',
    'DROP LOGFILE GROUP',
    'DROP PROCEDURE',
    'DROP RESOURCE GROUP',
    'DROP ROLE',
    'DROP SERVER',
    'DROP SPATIAL REFERENCE SYSTEM',
    'DROP TABLESPACE',
    'DROP TRIGGER',
    'DROP USER',
    'DROP VIEW',
    'EXECUTE',
    'EXPLAIN',
    'FLUSH',
    'GRANT',
    'HANDLER',
    'HELP',
    'IMPORT TABLE',
    'INSTALL COMPONENT',
    'INSTALL PLUGIN',
    'KILL',
    'LOAD DATA',
    'LOAD INDEX INTO CACHE',
    'LOAD XML',
    'LOCK INSTANCE FOR BACKUP',
    'LOCK TABLES',
    'MASTER_POS_WAIT',
    'OPTIMIZE TABLE',
    'PREPARE',
    'PURGE BINARY LOGS',
    'RELEASE SAVEPOINT',
    'RENAME TABLE',
    'RENAME USER',
    'REPAIR TABLE',
    'RESET',
    'RESET MASTER',
    'RESET PERSIST',
    'RESET REPLICA',
    'RESET SLAVE',
    'RESTART',
    'REVOKE',
    'ROLLBACK',
    'ROLLBACK TO SAVEPOINT',
    'SAVEPOINT',
    'SET CHARACTER SET',
    'SET DEFAULT ROLE',
    'SET NAMES',
    'SET PASSWORD',
    'SET RESOURCE GROUP',
    'SET ROLE',
    'SET TRANSACTION',
    'SHOW',
    'SHOW BINARY LOGS',
    'SHOW BINLOG EVENTS',
    'SHOW CHARACTER SET',
    'SHOW COLLATION',
    'SHOW COLUMNS',
    'SHOW CREATE DATABASE',
    'SHOW CREATE EVENT',
    'SHOW CREATE FUNCTION',
    'SHOW CREATE PROCEDURE',
    'SHOW CREATE TABLE',
    'SHOW CREATE TRIGGER',
    'SHOW CREATE USER',
    'SHOW CREATE VIEW',
    'SHOW DATABASES',
    'SHOW ENGINE',
    'SHOW ENGINES',
    'SHOW ERRORS',
    'SHOW EVENTS',
    'SHOW FUNCTION CODE',
    'SHOW FUNCTION STATUS',
    'SHOW GRANTS',
    'SHOW INDEX',
    'SHOW MASTER STATUS',
    'SHOW OPEN TABLES',
    'SHOW PLUGINS',
    'SHOW PRIVILEGES',
    'SHOW PROCEDURE CODE',
    'SHOW PROCEDURE STATUS',
    'SHOW PROCESSLIST',
    'SHOW PROFILE',
    'SHOW PROFILES',
    'SHOW RELAYLOG EVENTS',
    'SHOW REPLICA STATUS',
    'SHOW REPLICAS',
    'SHOW SLAVE',
    'SHOW SLAVE HOSTS',
    'SHOW STATUS',
    'SHOW TABLE STATUS',
    'SHOW TABLES',
    'SHOW TRIGGERS',
    'SHOW VARIABLES',
    'SHOW WARNINGS',
    'SHUTDOWN',
    'SOURCE_POS_WAIT',
    'START GROUP_REPLICATION',
    'START REPLICA',
    'START SLAVE',
    'START TRANSACTION',
    'STOP GROUP_REPLICATION',
    'STOP REPLICA',
    'STOP SLAVE',
    'TABLE',
    'UNINSTALL COMPONENT',
    'UNINSTALL PLUGIN',
    'UNLOCK INSTANCE',
    'UNLOCK TABLES',
    'USE',
    'XA',
    // flow control
    // 'IF',
    'ITERATE',
    'LEAVE',
    'LOOP',
    'REPEAT',
    'RETURN',
    'WHILE'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT} [OUTER] JOIN',
    // non-standard joins
    'STRAIGHT_JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL]',
    'CHARACTER SET',
    '{ROWS | RANGE} BETWEEN',
    'IDENTIFIED BY'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const mysql = {
    name: 'mysql',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        // TODO: support _ char set prefixes such as _utf8, _latin1, _binary, _utf8mb4, etc.
        stringTypes: [
            '""-qq-bs',
            {
                quote: "''-qq-bs",
                prefixes: [
                    'N'
                ]
            },
            {
                quote: "''-raw",
                prefixes: [
                    'B',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            '``'
        ],
        identChars: {
            first: '$',
            rest: '$',
            allowFirstCharNumber: true
        },
        variableTypes: [
            {
                regex: '@@?[A-Za-z0-9_.$]+'
            },
            {
                quote: '""-qq-bs',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            },
            {
                quote: "''-qq-bs",
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            },
            {
                quote: '``',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            }
        ],
        paramTypes: {
            positional: true
        },
        lineCommentTypes: [
            '--',
            '#'
        ],
        operators: [
            '%',
            ':=',
            '&',
            '|',
            '^',
            '~',
            '<<',
            '>>',
            '<=>',
            '->',
            '->>',
            '&&',
            '||',
            '!',
            '*.*'
        ],
        postProcess: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postProcess"]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=mysql.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/tidb/tidb.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://docs.pingcap.com/tidb/stable/keywords
    'ADD',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'ARRAY',
    'AS',
    'ASC',
    'BETWEEN',
    'BOTH',
    'BY',
    'CALL',
    'CASCADE',
    'CASE',
    'CHANGE',
    'CHECK',
    'COLLATE',
    'COLUMN',
    'CONSTRAINT',
    'CONTINUE',
    'CONVERT',
    'CREATE',
    'CROSS',
    'CURRENT_DATE',
    'CURRENT_ROLE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURSOR',
    'DATABASE',
    'DATABASES',
    'DAY_HOUR',
    'DAY_MICROSECOND',
    'DAY_MINUTE',
    'DAY_SECOND',
    'DEFAULT',
    'DELAYED',
    'DELETE',
    'DESC',
    'DESCRIBE',
    'DISTINCT',
    'DISTINCTROW',
    'DIV',
    'DOUBLE',
    'DROP',
    'DUAL',
    'ELSE',
    'ELSEIF',
    'ENCLOSED',
    'ESCAPED',
    'EXCEPT',
    'EXISTS',
    'EXIT',
    'EXPLAIN',
    'FALSE',
    'FETCH',
    'FOR',
    'FORCE',
    'FOREIGN',
    'FROM',
    'FULLTEXT',
    'GENERATED',
    'GRANT',
    'GROUP',
    'GROUPS',
    'HAVING',
    'HIGH_PRIORITY',
    'HOUR_MICROSECOND',
    'HOUR_MINUTE',
    'HOUR_SECOND',
    'IF',
    'IGNORE',
    'ILIKE',
    'IN',
    'INDEX',
    'INFILE',
    'INNER',
    'INOUT',
    'INSERT',
    'INTERSECT',
    'INTERVAL',
    'INTO',
    'IS',
    'ITERATE',
    'JOIN',
    'KEY',
    'KEYS',
    'KILL',
    'LEADING',
    'LEAVE',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LINEAR',
    'LINES',
    'LOAD',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCK',
    'LONG',
    'LOW_PRIORITY',
    'MATCH',
    'MAXVALUE',
    'MINUTE_MICROSECOND',
    'MINUTE_SECOND',
    'MOD',
    'NATURAL',
    'NOT',
    'NO_WRITE_TO_BINLOG',
    'NULL',
    'OF',
    'ON',
    'OPTIMIZE',
    'OPTION',
    'OPTIONALLY',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OUTFILE',
    'OVER',
    'PARTITION',
    'PRIMARY',
    'PROCEDURE',
    'RANGE',
    'READ',
    'RECURSIVE',
    'REFERENCES',
    'REGEXP',
    'RELEASE',
    'RENAME',
    'REPEAT',
    'REPLACE',
    'REQUIRE',
    'RESTRICT',
    'REVOKE',
    'RIGHT',
    'RLIKE',
    'ROW',
    'ROWS',
    'SECOND_MICROSECOND',
    'SELECT',
    'SET',
    'SHOW',
    'SPATIAL',
    'SQL',
    'SQLEXCEPTION',
    'SQLSTATE',
    'SQLWARNING',
    'SQL_BIG_RESULT',
    'SQL_CALC_FOUND_ROWS',
    'SQL_SMALL_RESULT',
    'SSL',
    'STARTING',
    'STATS_EXTENDED',
    'STORED',
    'STRAIGHT_JOIN',
    'TABLE',
    'TABLESAMPLE',
    'TERMINATED',
    'THEN',
    'TO',
    'TRAILING',
    'TRIGGER',
    'TRUE',
    'TiDB_CURRENT_TSO',
    'UNION',
    'UNIQUE',
    'UNLOCK',
    'UNSIGNED',
    'UNTIL',
    'UPDATE',
    'USAGE',
    'USE',
    'USING',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    'VALUES',
    'VIRTUAL',
    'WHEN',
    'WHERE',
    'WHILE',
    'WINDOW',
    'WITH',
    'WRITE',
    'XOR',
    'YEAR_MONTH',
    'ZEROFILL'
];
const dataTypes = [
    // https://docs.pingcap.com/tidb/stable/data-type-overview
    'BIGINT',
    'BINARY',
    'BIT',
    'BLOB',
    'BOOL',
    'BOOLEAN',
    'CHAR',
    'CHARACTER',
    'DATE',
    'DATETIME',
    'DEC',
    'DECIMAL',
    'DOUBLE PRECISION',
    'DOUBLE',
    'ENUM',
    'FIXED',
    'INT',
    'INT1',
    'INT2',
    'INT3',
    'INT4',
    'INT8',
    'INTEGER',
    'LONGBLOB',
    'LONGTEXT',
    'MEDIUMBLOB',
    'MEDIUMINT',
    'MIDDLEINT',
    'NATIONAL CHAR',
    'NATIONAL VARCHAR',
    'NUMERIC',
    'PRECISION',
    'SMALLINT',
    'TEXT',
    'TIME',
    'TIMESTAMP',
    'TINYBLOB',
    'TINYINT',
    'TINYTEXT',
    'VARBINARY',
    'VARCHAR',
    'VARCHARACTER',
    'VARYING',
    'YEAR'
]; //# sourceMappingURL=tidb.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/tidb/tidb.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.pingcap.com/tidb/stable/sql-statement-show-builtins
    // https://docs.pingcap.com/tidb/stable/functions-and-operators-overview
    // + MySQL aggregate functions: https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html
    // + MySQL window functions: https://dev.mysql.com/doc/refman/8.0/en/window-functions-usage.html
    'ABS',
    'ACOS',
    'ADDDATE',
    'ADDTIME',
    'AES_DECRYPT',
    'AES_ENCRYPT',
    // 'AND',
    'ANY_VALUE',
    'ASCII',
    'ASIN',
    'ATAN',
    'ATAN2',
    'AVG',
    'BENCHMARK',
    'BIN',
    'BIN_TO_UUID',
    'BIT_AND',
    'BIT_COUNT',
    'BIT_LENGTH',
    'BIT_OR',
    'BIT_XOR',
    'BITAND',
    'BITNEG',
    'BITOR',
    'BITXOR',
    'CASE',
    'CAST',
    'CEIL',
    'CEILING',
    'CHAR_FUNC',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'CHARSET',
    'COALESCE',
    'COERCIBILITY',
    'COLLATION',
    'COMPRESS',
    'CONCAT',
    'CONCAT_WS',
    'CONNECTION_ID',
    'CONV',
    'CONVERT',
    'CONVERT_TZ',
    'COS',
    'COT',
    'COUNT',
    'CRC32',
    'CUME_DIST',
    'CURDATE',
    'CURRENT_DATE',
    'CURRENT_RESOURCE_GROUP',
    'CURRENT_ROLE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURTIME',
    'DATABASE',
    'DATE',
    'DATE_ADD',
    'DATE_FORMAT',
    'DATE_SUB',
    'DATEDIFF',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'DECODE',
    'DEFAULT_FUNC',
    'DEGREES',
    'DENSE_RANK',
    'DES_DECRYPT',
    'DES_ENCRYPT',
    'DIV',
    'ELT',
    'ENCODE',
    'ENCRYPT',
    'EQ',
    'EXP',
    'EXPORT_SET',
    'EXTRACT',
    'FIELD',
    'FIND_IN_SET',
    'FIRST_VALUE',
    'FLOOR',
    'FORMAT',
    'FORMAT_BYTES',
    'FORMAT_NANO_TIME',
    'FOUND_ROWS',
    'FROM_BASE64',
    'FROM_DAYS',
    'FROM_UNIXTIME',
    'GE',
    'GET_FORMAT',
    'GET_LOCK',
    'GETPARAM',
    'GREATEST',
    'GROUP_CONCAT',
    'GROUPING',
    'GT',
    'HEX',
    'HOUR',
    'IF',
    'IFNULL',
    'ILIKE',
    // 'IN',
    'INET6_ATON',
    'INET6_NTOA',
    'INET_ATON',
    'INET_NTOA',
    'INSERT_FUNC',
    'INSTR',
    'INTDIV',
    'INTERVAL',
    'IS_FREE_LOCK',
    'IS_IPV4',
    'IS_IPV4_COMPAT',
    'IS_IPV4_MAPPED',
    'IS_IPV6',
    'IS_USED_LOCK',
    'IS_UUID',
    'ISFALSE',
    'ISNULL',
    'ISTRUE',
    'JSON_ARRAY',
    'JSON_ARRAYAGG',
    'JSON_ARRAY_APPEND',
    'JSON_ARRAY_INSERT',
    'JSON_CONTAINS',
    'JSON_CONTAINS_PATH',
    'JSON_DEPTH',
    'JSON_EXTRACT',
    'JSON_INSERT',
    'JSON_KEYS',
    'JSON_LENGTH',
    'JSON_MEMBEROF',
    'JSON_MERGE',
    'JSON_MERGE_PATCH',
    'JSON_MERGE_PRESERVE',
    'JSON_OBJECT',
    'JSON_OBJECTAGG',
    'JSON_OVERLAPS',
    'JSON_PRETTY',
    'JSON_QUOTE',
    'JSON_REMOVE',
    'JSON_REPLACE',
    'JSON_SEARCH',
    'JSON_SET',
    'JSON_STORAGE_FREE',
    'JSON_STORAGE_SIZE',
    'JSON_TYPE',
    'JSON_UNQUOTE',
    'JSON_VALID',
    'LAG',
    'LAST_DAY',
    'LAST_INSERT_ID',
    'LAST_VALUE',
    'LASTVAL',
    'LCASE',
    'LE',
    'LEAD',
    'LEAST',
    'LEFT',
    'LEFTSHIFT',
    'LENGTH',
    'LIKE',
    'LN',
    'LOAD_FILE',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCATE',
    'LOG',
    'LOG10',
    'LOG2',
    'LOWER',
    'LPAD',
    'LT',
    'LTRIM',
    'MAKE_SET',
    'MAKEDATE',
    'MAKETIME',
    'MASTER_POS_WAIT',
    'MAX',
    'MD5',
    'MICROSECOND',
    'MID',
    'MIN',
    'MINUS',
    'MINUTE',
    'MOD',
    'MONTH',
    'MONTHNAME',
    'MUL',
    'NAME_CONST',
    'NE',
    'NEXTVAL',
    'NOT',
    'NOW',
    'NTH_VALUE',
    'NTILE',
    'NULLEQ',
    'OCT',
    'OCTET_LENGTH',
    'OLD_PASSWORD',
    // 'OR',
    'ORD',
    'PASSWORD_FUNC',
    'PERCENT_RANK',
    'PERIOD_ADD',
    'PERIOD_DIFF',
    'PI',
    'PLUS',
    'POSITION',
    'POW',
    'POWER',
    'QUARTER',
    'QUOTE',
    'RADIANS',
    'RAND',
    'RANDOM_BYTES',
    'RANK',
    'REGEXP',
    'REGEXP_INSTR',
    'REGEXP_LIKE',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'RELEASE_ALL_LOCKS',
    'RELEASE_LOCK',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'RIGHT',
    'RIGHTSHIFT',
    'ROUND',
    'ROW_COUNT',
    'ROW_NUMBER',
    'RPAD',
    'RTRIM',
    'SCHEMA',
    'SEC_TO_TIME',
    'SECOND',
    'SESSION_USER',
    'SETVAL',
    'SETVAR',
    'SHA',
    'SHA1',
    'SHA2',
    'SIGN',
    'SIN',
    'SLEEP',
    'SM3',
    'SPACE',
    'SQRT',
    'STD',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STR_TO_DATE',
    'STRCMP',
    'SUBDATE',
    'SUBSTR',
    'SUBSTRING',
    'SUBSTRING_INDEX',
    'SUBTIME',
    'SUM',
    'SYSDATE',
    'SYSTEM_USER',
    'TAN',
    'TIDB_BOUNDED_STALENESS',
    'TIDB_CURRENT_TSO',
    'TIDB_DECODE_BINARY_PLAN',
    'TIDB_DECODE_KEY',
    'TIDB_DECODE_PLAN',
    'TIDB_DECODE_SQL_DIGESTS',
    'TIDB_ENCODE_SQL_DIGEST',
    'TIDB_IS_DDL_OWNER',
    'TIDB_PARSE_TSO',
    'TIDB_PARSE_TSO_LOGICAL',
    'TIDB_ROW_CHECKSUM',
    'TIDB_SHARD',
    'TIDB_VERSION',
    'TIME',
    'TIME_FORMAT',
    'TIME_TO_SEC',
    'TIMEDIFF',
    'TIMESTAMP',
    'TIMESTAMPADD',
    'TIMESTAMPDIFF',
    'TO_BASE64',
    'TO_DAYS',
    'TO_SECONDS',
    'TRANSLATE',
    'TRIM',
    'TRUNCATE',
    'UCASE',
    'UNARYMINUS',
    'UNCOMPRESS',
    'UNCOMPRESSED_LENGTH',
    'UNHEX',
    'UNIX_TIMESTAMP',
    'UPPER',
    // 'USER',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    'UUID',
    'UUID_SHORT',
    'UUID_TO_BIN',
    'VALIDATE_PASSWORD_STRENGTH',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    'VERSION',
    'VITESS_HASH',
    'WEEK',
    'WEEKDAY',
    'WEEKOFYEAR',
    'WEIGHT_STRING',
    // 'XOR',
    'YEAR',
    'YEARWEEK'
]; //# sourceMappingURL=tidb.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/tidb/tidb.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "tidb",
    ()=>tidb
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/likeMariaDb.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/tidb/tidb.keywords.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/tidb/tidb.functions.js [app-client] (ecmascript)");
;
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT | DISTINCTROW]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    // Data manipulation
    // - insert:
    'INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE] [INTO]',
    'REPLACE [LOW_PRIORITY | DELAYED] [INTO]',
    'VALUES',
    'ON DUPLICATE KEY UPDATE',
    // - update:
    'SET'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [TEMPORARY] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // https://docs.pingcap.com/tidb/stable/sql-statement-create-view
    'CREATE [OR REPLACE] [SQL SECURITY DEFINER | SQL SECURITY INVOKER] VIEW [IF NOT EXISTS]',
    // https://docs.pingcap.com/tidb/stable/sql-statement-update
    'UPDATE [LOW_PRIORITY] [IGNORE]',
    // https://docs.pingcap.com/tidb/stable/sql-statement-delete
    'DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM',
    // https://docs.pingcap.com/tidb/stable/sql-statement-drop-table
    'DROP [TEMPORARY] TABLE [IF EXISTS]',
    // https://docs.pingcap.com/tidb/stable/sql-statement-alter-table
    'ALTER TABLE',
    'ADD [COLUMN]',
    '{CHANGE | MODIFY} [COLUMN]',
    'DROP [COLUMN]',
    'RENAME [TO | AS]',
    'RENAME COLUMN',
    'ALTER [COLUMN]',
    '{SET | DROP} DEFAULT',
    // https://docs.pingcap.com/tidb/stable/sql-statement-truncate
    'TRUNCATE [TABLE]',
    // https://docs.pingcap.com/tidb/stable/sql-statement-alter-database
    'ALTER DATABASE',
    // https://docs.pingcap.com/tidb/stable/sql-statement-alter-instance
    'ALTER INSTANCE',
    'ALTER RESOURCE GROUP',
    'ALTER SEQUENCE',
    // https://docs.pingcap.com/tidb/stable/sql-statement-alter-user
    'ALTER USER',
    'ALTER VIEW',
    'ANALYZE TABLE',
    'CHECK TABLE',
    'CHECKSUM TABLE',
    'COMMIT',
    'CREATE DATABASE',
    'CREATE INDEX',
    'CREATE RESOURCE GROUP',
    'CREATE ROLE',
    'CREATE SEQUENCE',
    'CREATE USER',
    'DEALLOCATE PREPARE',
    'DESCRIBE',
    'DROP DATABASE',
    'DROP INDEX',
    'DROP RESOURCE GROUP',
    'DROP ROLE',
    'DROP TABLESPACE',
    'DROP USER',
    'DROP VIEW',
    'EXPLAIN',
    'FLUSH',
    // https://docs.pingcap.com/tidb/stable/sql-statement-grant-privileges
    'GRANT',
    'IMPORT TABLE',
    'INSTALL COMPONENT',
    'INSTALL PLUGIN',
    'KILL',
    'LOAD DATA',
    'LOCK INSTANCE FOR BACKUP',
    'LOCK TABLES',
    'OPTIMIZE TABLE',
    'PREPARE',
    'RELEASE SAVEPOINT',
    'RENAME TABLE',
    'RENAME USER',
    'REPAIR TABLE',
    'RESET',
    'REVOKE',
    'ROLLBACK',
    'ROLLBACK TO SAVEPOINT',
    'SAVEPOINT',
    'SET CHARACTER SET',
    'SET DEFAULT ROLE',
    'SET NAMES',
    'SET PASSWORD',
    'SET RESOURCE GROUP',
    'SET ROLE',
    'SET TRANSACTION',
    'SHOW',
    'SHOW BINARY LOGS',
    'SHOW BINLOG EVENTS',
    'SHOW CHARACTER SET',
    'SHOW COLLATION',
    'SHOW COLUMNS',
    'SHOW CREATE DATABASE',
    'SHOW CREATE TABLE',
    'SHOW CREATE USER',
    'SHOW CREATE VIEW',
    'SHOW DATABASES',
    'SHOW ENGINE',
    'SHOW ENGINES',
    'SHOW ERRORS',
    'SHOW EVENTS',
    'SHOW GRANTS',
    'SHOW INDEX',
    'SHOW MASTER STATUS',
    'SHOW OPEN TABLES',
    'SHOW PLUGINS',
    'SHOW PRIVILEGES',
    'SHOW PROCESSLIST',
    'SHOW PROFILE',
    'SHOW PROFILES',
    'SHOW STATUS',
    'SHOW TABLE STATUS',
    'SHOW TABLES',
    'SHOW TRIGGERS',
    'SHOW VARIABLES',
    'SHOW WARNINGS',
    // https://docs.pingcap.com/tidb/stable/sql-statement-table
    'TABLE',
    'UNINSTALL COMPONENT',
    'UNINSTALL PLUGIN',
    'UNLOCK INSTANCE',
    'UNLOCK TABLES',
    // https://docs.pingcap.com/tidb/stable/sql-statement-use
    'USE'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT} [OUTER] JOIN',
    // non-standard joins
    'STRAIGHT_JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL]',
    'CHARACTER SET',
    '{ROWS | RANGE} BETWEEN',
    'IDENTIFIED BY'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const tidb = {
    name: 'tidb',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        // TODO: support _ char set prefixes such as _utf8, _latin1, _binary, _utf8mb4, etc.
        stringTypes: [
            '""-qq-bs',
            {
                quote: "''-qq-bs",
                prefixes: [
                    'N'
                ]
            },
            {
                quote: "''-raw",
                prefixes: [
                    'B',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            '``'
        ],
        identChars: {
            first: '$',
            rest: '$',
            allowFirstCharNumber: true
        },
        variableTypes: [
            {
                regex: '@@?[A-Za-z0-9_.$]+'
            },
            {
                quote: '""-qq-bs',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            },
            {
                quote: "''-qq-bs",
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            },
            {
                quote: '``',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            }
        ],
        paramTypes: {
            positional: true
        },
        lineCommentTypes: [
            '--',
            '#'
        ],
        operators: [
            '%',
            ':=',
            '&',
            '|',
            '^',
            '~',
            '<<',
            '>>',
            '<=>',
            '->',
            '->>',
            '&&',
            '||',
            '!',
            '*.*'
        ],
        postProcess: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postProcess"]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=tidb.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/n1ql/n1ql.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/functions.html
    'ABORT',
    'ABS',
    'ACOS',
    'ADVISOR',
    'ARRAY_AGG',
    'ARRAY_AGG',
    'ARRAY_APPEND',
    'ARRAY_AVG',
    'ARRAY_BINARY_SEARCH',
    'ARRAY_CONCAT',
    'ARRAY_CONTAINS',
    'ARRAY_COUNT',
    'ARRAY_DISTINCT',
    'ARRAY_EXCEPT',
    'ARRAY_FLATTEN',
    'ARRAY_IFNULL',
    'ARRAY_INSERT',
    'ARRAY_INTERSECT',
    'ARRAY_LENGTH',
    'ARRAY_MAX',
    'ARRAY_MIN',
    'ARRAY_MOVE',
    'ARRAY_POSITION',
    'ARRAY_PREPEND',
    'ARRAY_PUT',
    'ARRAY_RANGE',
    'ARRAY_REMOVE',
    'ARRAY_REPEAT',
    'ARRAY_REPLACE',
    'ARRAY_REVERSE',
    'ARRAY_SORT',
    'ARRAY_STAR',
    'ARRAY_SUM',
    'ARRAY_SYMDIFF',
    'ARRAY_SYMDIFF1',
    'ARRAY_SYMDIFFN',
    'ARRAY_UNION',
    'ASIN',
    'ATAN',
    'ATAN2',
    'AVG',
    'BASE64',
    'BASE64_DECODE',
    'BASE64_ENCODE',
    'BITAND ',
    'BITCLEAR ',
    'BITNOT ',
    'BITOR ',
    'BITSET ',
    'BITSHIFT ',
    'BITTEST ',
    'BITXOR ',
    'CEIL',
    'CLOCK_LOCAL',
    'CLOCK_MILLIS',
    'CLOCK_STR',
    'CLOCK_TZ',
    'CLOCK_UTC',
    'COALESCE',
    'CONCAT',
    'CONCAT2',
    'CONTAINS',
    'CONTAINS_TOKEN',
    'CONTAINS_TOKEN_LIKE',
    'CONTAINS_TOKEN_REGEXP',
    'COS',
    'COUNT',
    'COUNT',
    'COUNTN',
    'CUME_DIST',
    'CURL',
    'DATE_ADD_MILLIS',
    'DATE_ADD_STR',
    'DATE_DIFF_MILLIS',
    'DATE_DIFF_STR',
    'DATE_FORMAT_STR',
    'DATE_PART_MILLIS',
    'DATE_PART_STR',
    'DATE_RANGE_MILLIS',
    'DATE_RANGE_STR',
    'DATE_TRUNC_MILLIS',
    'DATE_TRUNC_STR',
    'DECODE',
    'DECODE_JSON',
    'DEGREES',
    'DENSE_RANK',
    'DURATION_TO_STR',
    // 'E',
    'ENCODED_SIZE',
    'ENCODE_JSON',
    'EXP',
    'FIRST_VALUE',
    'FLOOR',
    'GREATEST',
    'HAS_TOKEN',
    'IFINF',
    'IFMISSING',
    'IFMISSINGORNULL',
    'IFNAN',
    'IFNANORINF',
    'IFNULL',
    'INITCAP',
    'ISARRAY',
    'ISATOM',
    'ISBITSET',
    'ISBOOLEAN',
    'ISNUMBER',
    'ISOBJECT',
    'ISSTRING',
    'LAG',
    'LAST_VALUE',
    'LEAD',
    'LEAST',
    'LENGTH',
    'LN',
    'LOG',
    'LOWER',
    'LTRIM',
    'MAX',
    'MEAN',
    'MEDIAN',
    'META',
    'MILLIS',
    'MILLIS_TO_LOCAL',
    'MILLIS_TO_STR',
    'MILLIS_TO_TZ',
    'MILLIS_TO_UTC',
    'MILLIS_TO_ZONE_NAME',
    'MIN',
    'MISSINGIF',
    'NANIF',
    'NEGINFIF',
    'NOW_LOCAL',
    'NOW_MILLIS',
    'NOW_STR',
    'NOW_TZ',
    'NOW_UTC',
    'NTH_VALUE',
    'NTILE',
    'NULLIF',
    'NVL',
    'NVL2',
    'OBJECT_ADD',
    'OBJECT_CONCAT',
    'OBJECT_INNER_PAIRS',
    'OBJECT_INNER_VALUES',
    'OBJECT_LENGTH',
    'OBJECT_NAMES',
    'OBJECT_PAIRS',
    'OBJECT_PUT',
    'OBJECT_REMOVE',
    'OBJECT_RENAME',
    'OBJECT_REPLACE',
    'OBJECT_UNWRAP',
    'OBJECT_VALUES',
    'PAIRS',
    'PERCENT_RANK',
    'PI',
    'POLY_LENGTH',
    'POSINFIF',
    'POSITION',
    'POWER',
    'RADIANS',
    'RANDOM',
    'RANK',
    'RATIO_TO_REPORT',
    'REGEXP_CONTAINS',
    'REGEXP_LIKE',
    'REGEXP_MATCHES',
    'REGEXP_POSITION',
    'REGEXP_REPLACE',
    'REGEXP_SPLIT',
    'REGEX_CONTAINS',
    'REGEX_LIKE',
    'REGEX_MATCHES',
    'REGEX_POSITION',
    'REGEX_REPLACE',
    'REGEX_SPLIT',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'ROUND',
    'ROW_NUMBER',
    'RTRIM',
    'SEARCH',
    'SEARCH_META',
    'SEARCH_SCORE',
    'SIGN',
    'SIN',
    'SPLIT',
    'SQRT',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STR_TO_DURATION',
    'STR_TO_MILLIS',
    'STR_TO_TZ',
    'STR_TO_UTC',
    'STR_TO_ZONE_NAME',
    'SUBSTR',
    'SUFFIXES',
    'SUM',
    'TAN',
    'TITLE',
    'TOARRAY',
    'TOATOM',
    'TOBOOLEAN',
    'TOKENS',
    'TOKENS',
    'TONUMBER',
    'TOOBJECT',
    'TOSTRING',
    'TRIM',
    'TRUNC',
    // 'TYPE', // disabled
    'UPPER',
    'UUID',
    'VARIANCE',
    'VARIANCE_POP',
    'VARIANCE_SAMP',
    'VAR_POP',
    'VAR_SAMP',
    'WEEKDAY_MILLIS',
    'WEEKDAY_STR',
    // type casting
    // not implemented in N1QL, but added here now for the sake of tests
    // https://docs.couchbase.com/server/current/analytics/3_query.html#Vs_SQL-92
    'CAST'
]; //# sourceMappingURL=n1ql.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/n1ql/n1ql.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/reservedwords.html
    'ADVISE',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'ANY',
    'ARRAY',
    'AS',
    'ASC',
    'AT',
    'BEGIN',
    'BETWEEN',
    'BINARY',
    'BOOLEAN',
    'BREAK',
    'BUCKET',
    'BUILD',
    'BY',
    'CALL',
    'CASE',
    'CAST',
    'CLUSTER',
    'COLLATE',
    'COLLECTION',
    'COMMIT',
    'COMMITTED',
    'CONNECT',
    'CONTINUE',
    'CORRELATED',
    'COVER',
    'CREATE',
    'CURRENT',
    'DATABASE',
    'DATASET',
    'DATASTORE',
    'DECLARE',
    'DECREMENT',
    'DELETE',
    'DERIVED',
    'DESC',
    'DESCRIBE',
    'DISTINCT',
    'DO',
    'DROP',
    'EACH',
    'ELEMENT',
    'ELSE',
    'END',
    'EVERY',
    'EXCEPT',
    'EXCLUDE',
    'EXECUTE',
    'EXISTS',
    'EXPLAIN',
    'FALSE',
    'FETCH',
    'FILTER',
    'FIRST',
    'FLATTEN',
    'FLUSH',
    'FOLLOWING',
    'FOR',
    'FORCE',
    'FROM',
    'FTS',
    'FUNCTION',
    'GOLANG',
    'GRANT',
    'GROUP',
    'GROUPS',
    'GSI',
    'HASH',
    'HAVING',
    'IF',
    'IGNORE',
    'ILIKE',
    'IN',
    'INCLUDE',
    'INCREMENT',
    'INDEX',
    'INFER',
    'INLINE',
    'INNER',
    'INSERT',
    'INTERSECT',
    'INTO',
    'IS',
    'ISOLATION',
    'JAVASCRIPT',
    'JOIN',
    'KEY',
    'KEYS',
    'KEYSPACE',
    'KNOWN',
    'LANGUAGE',
    'LAST',
    'LEFT',
    'LET',
    'LETTING',
    'LEVEL',
    'LIKE',
    'LIMIT',
    'LSM',
    'MAP',
    'MAPPING',
    'MATCHED',
    'MATERIALIZED',
    'MERGE',
    'MINUS',
    'MISSING',
    'NAMESPACE',
    'NEST',
    'NL',
    'NO',
    'NOT',
    'NTH_VALUE',
    'NULL',
    'NULLS',
    'NUMBER',
    'OBJECT',
    'OFFSET',
    'ON',
    'OPTION',
    'OPTIONS',
    'OR',
    'ORDER',
    'OTHERS',
    'OUTER',
    'OVER',
    'PARSE',
    'PARTITION',
    'PASSWORD',
    'PATH',
    'POOL',
    'PRECEDING',
    'PREPARE',
    'PRIMARY',
    'PRIVATE',
    'PRIVILEGE',
    'PROBE',
    'PROCEDURE',
    'PUBLIC',
    'RANGE',
    'RAW',
    'REALM',
    'REDUCE',
    'RENAME',
    'RESPECT',
    'RETURN',
    'RETURNING',
    'REVOKE',
    'RIGHT',
    'ROLE',
    'ROLLBACK',
    'ROW',
    'ROWS',
    'SATISFIES',
    'SAVEPOINT',
    'SCHEMA',
    'SCOPE',
    'SELECT',
    'SELF',
    'SEMI',
    'SET',
    'SHOW',
    'SOME',
    'START',
    'STATISTICS',
    'STRING',
    'SYSTEM',
    'THEN',
    'TIES',
    'TO',
    'TRAN',
    'TRANSACTION',
    'TRIGGER',
    'TRUE',
    'TRUNCATE',
    'UNBOUNDED',
    'UNDER',
    'UNION',
    'UNIQUE',
    'UNKNOWN',
    'UNNEST',
    'UNSET',
    'UPDATE',
    'UPSERT',
    'USE',
    'USER',
    'USING',
    'VALIDATE',
    'VALUE',
    'VALUED',
    'VALUES',
    'VIA',
    'VIEW',
    'WHEN',
    'WHERE',
    'WHILE',
    'WINDOW',
    'WITH',
    'WITHIN',
    'WORK',
    'XOR'
];
const dataTypes = []; //# sourceMappingURL=n1ql.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/n1ql/n1ql.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "n1ql",
    ()=>n1ql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/n1ql/n1ql.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/n1ql/n1ql.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    // Data manipulation
    // - insert:
    'INSERT INTO',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE INTO',
    'WHEN [NOT] MATCHED THEN',
    'UPDATE SET',
    'INSERT',
    // other
    'NEST',
    'UNNEST',
    'RETURNING'
]);
const onelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - update:
    'UPDATE',
    // - delete:
    'DELETE FROM',
    // - set schema:
    'SET SCHEMA',
    // https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/reservedwords.html
    'ADVISE',
    'ALTER INDEX',
    'BEGIN TRANSACTION',
    'BUILD INDEX',
    'COMMIT TRANSACTION',
    'CREATE COLLECTION',
    'CREATE FUNCTION',
    'CREATE INDEX',
    'CREATE PRIMARY INDEX',
    'CREATE SCOPE',
    'DROP COLLECTION',
    'DROP FUNCTION',
    'DROP INDEX',
    'DROP PRIMARY INDEX',
    'DROP SCOPE',
    'EXECUTE',
    'EXECUTE FUNCTION',
    'EXPLAIN',
    'GRANT',
    'INFER',
    'PREPARE',
    'REVOKE',
    'ROLLBACK TRANSACTION',
    'SAVEPOINT',
    'SET TRANSACTION',
    'UPDATE STATISTICS',
    'UPSERT',
    // other
    'LET',
    'SET CURRENT SCHEMA',
    'SHOW',
    'USE [PRIMARY] KEYS'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'EXCEPT [ALL]',
    'INTERSECT [ALL]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT} [OUTER] JOIN',
    'INNER JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    '{ROWS | RANGE | GROUPS} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const n1ql = {
    name: 'n1ql',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...onelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        // NOTE: single quotes are actually not supported in N1QL,
        // but we support them anyway as all other SQL dialects do,
        // which simplifies writing tests that are shared between all dialects.
        stringTypes: [
            '""-bs',
            "''-bs"
        ],
        identTypes: [
            '``'
        ],
        extraParens: [
            '[]',
            '{}'
        ],
        paramTypes: {
            positional: true,
            numbered: [
                '$'
            ],
            named: [
                '$'
            ]
        },
        lineCommentTypes: [
            '#',
            '--'
        ],
        operators: [
            '%',
            '==',
            ':',
            '||'
        ]
    },
    formatOptions: {
        onelineClauses
    }
}; //# sourceMappingURL=n1ql.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/plsql/plsql.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://docs.oracle.com/cd/B19306_01/appdev.102/b14261/reservewords.htm
    // 'A',
    'ADD',
    'AGENT',
    'AGGREGATE',
    'ALL',
    'ALTER',
    'AND',
    'ANY',
    'ARROW',
    'AS',
    'ASC',
    'AT',
    'ATTRIBUTE',
    'AUTHID',
    'AVG',
    'BEGIN',
    'BETWEEN',
    'BLOCK',
    'BODY',
    'BOTH',
    'BOUND',
    'BULK',
    'BY',
    'BYTE',
    // 'C',
    'CALL',
    'CALLING',
    'CASCADE',
    'CASE',
    'CHARSET',
    'CHARSETFORM',
    'CHARSETID',
    'CHECK',
    'CLOSE',
    'CLUSTER',
    'CLUSTERS',
    'COLAUTH',
    'COLLECT',
    'COLUMNS',
    'COMMENT',
    'COMMIT',
    'COMMITTED',
    'COMPILED',
    'COMPRESS',
    'CONNECT',
    'CONSTANT',
    'CONSTRUCTOR',
    'CONTEXT',
    'CONVERT',
    'COUNT',
    'CRASH',
    'CREATE',
    'CURRENT',
    'CURSOR',
    'CUSTOMDATUM',
    'DANGLING',
    'DATA',
    'DAY',
    'DECLARE',
    'DEFAULT',
    'DEFINE',
    'DELETE',
    'DESC',
    'DETERMINISTIC',
    'DISTINCT',
    'DROP',
    'DURATION',
    'ELEMENT',
    'ELSE',
    'ELSIF',
    'EMPTY',
    'END',
    'ESCAPE',
    'EXCEPT',
    'EXCEPTION',
    'EXCEPTIONS',
    'EXCLUSIVE',
    'EXECUTE',
    'EXISTS',
    'EXIT',
    'EXTERNAL',
    'FETCH',
    'FINAL',
    'FIXED',
    'FOR',
    'FORALL',
    'FORCE',
    'FORM',
    'FROM',
    'FUNCTION',
    'GENERAL',
    'GOTO',
    'GRANT',
    'GROUP',
    'HASH',
    'HAVING',
    'HEAP',
    'HIDDEN',
    'HOUR',
    'IDENTIFIED',
    'IF',
    'IMMEDIATE',
    'IN',
    'INCLUDING',
    'INDEX',
    'INDEXES',
    'INDICATOR',
    'INDICES',
    'INFINITE',
    'INSERT',
    'INSTANTIABLE',
    'INTERFACE',
    'INTERSECT',
    'INTERVAL',
    'INTO',
    'INVALIDATE',
    'IS',
    'ISOLATION',
    'JAVA',
    'LANGUAGE',
    'LARGE',
    'LEADING',
    'LENGTH',
    'LEVEL',
    'LIBRARY',
    'LIKE',
    'LIKE2',
    'LIKE4',
    'LIKEC',
    'LIMIT',
    'LIMITED',
    'LOCAL',
    'LOCK',
    'LOOP',
    'MAP',
    'MAX',
    'MAXLEN',
    'MEMBER',
    'MERGE',
    'MIN',
    'MINUS',
    'MINUTE',
    'MOD',
    'MODE',
    'MODIFY',
    'MONTH',
    'MULTISET',
    'NAME',
    'NAN',
    'NATIONAL',
    'NATIVE',
    'NEW',
    'NOCOMPRESS',
    'NOCOPY',
    'NOT',
    'NOWAIT',
    'NULL',
    'OBJECT',
    'OCICOLL',
    'OCIDATE',
    'OCIDATETIME',
    'OCIDURATION',
    'OCIINTERVAL',
    'OCILOBLOCATOR',
    'OCINUMBER',
    'OCIRAW',
    'OCIREF',
    'OCIREFCURSOR',
    'OCIROWID',
    'OCISTRING',
    'OCITYPE',
    'OF',
    'ON',
    'ONLY',
    'OPAQUE',
    'OPEN',
    'OPERATOR',
    'OPTION',
    'OR',
    'ORACLE',
    'ORADATA',
    'ORDER',
    'OVERLAPS',
    'ORGANIZATION',
    'ORLANY',
    'ORLVARY',
    'OTHERS',
    'OUT',
    'OVERRIDING',
    'PACKAGE',
    'PARALLEL_ENABLE',
    'PARAMETER',
    'PARAMETERS',
    'PARTITION',
    'PASCAL',
    'PIPE',
    'PIPELINED',
    'PRAGMA',
    'PRIOR',
    'PRIVATE',
    'PROCEDURE',
    'PUBLIC',
    'RAISE',
    'RANGE',
    'READ',
    'RECORD',
    'REF',
    'REFERENCE',
    'REM',
    'REMAINDER',
    'RENAME',
    'RESOURCE',
    'RESULT',
    'RETURN',
    'RETURNING',
    'REVERSE',
    'REVOKE',
    'ROLLBACK',
    'ROW',
    'SAMPLE',
    'SAVE',
    'SAVEPOINT',
    'SB1',
    'SB2',
    'SB4',
    'SECOND',
    'SEGMENT',
    'SELECT',
    'SELF',
    'SEPARATE',
    'SEQUENCE',
    'SERIALIZABLE',
    'SET',
    'SHARE',
    'SHORT',
    'SIZE',
    'SIZE_T',
    'SOME',
    'SPARSE',
    'SQL',
    'SQLCODE',
    'SQLDATA',
    'SQLNAME',
    'SQLSTATE',
    'STANDARD',
    'START',
    'STATIC',
    'STDDEV',
    'STORED',
    'STRING',
    'STRUCT',
    'STYLE',
    'SUBMULTISET',
    'SUBPARTITION',
    'SUBSTITUTABLE',
    'SUBTYPE',
    'SUM',
    'SYNONYM',
    'TABAUTH',
    'TABLE',
    'TDO',
    'THE',
    'THEN',
    'TIME',
    'TIMEZONE_ABBR',
    'TIMEZONE_HOUR',
    'TIMEZONE_MINUTE',
    'TIMEZONE_REGION',
    'TO',
    'TRAILING',
    'TRANSAC',
    'TRANSACTIONAL',
    'TRUSTED',
    'TYPE',
    'UB1',
    'UB2',
    'UB4',
    'UNDER',
    'UNION',
    'UNIQUE',
    'UNSIGNED',
    'UNTRUSTED',
    'UPDATE',
    'USE',
    'USING',
    'VALIST',
    'VALUE',
    'VALUES',
    'VARIABLE',
    'VARIANCE',
    'VARRAY',
    'VIEW',
    'VIEWS',
    'VOID',
    'WHEN',
    'WHERE',
    'WHILE',
    'WITH',
    'WORK',
    'WRAPPED',
    'WRITE',
    'YEAR',
    'ZONE'
];
const dataTypes = [
    // https://www.ibm.com/docs/en/db2/10.5?topic=plsql-data-types
    'ARRAY',
    'BFILE_BASE',
    'BINARY',
    'BLOB_BASE',
    'CHAR VARYING',
    'CHAR_BASE',
    'CHAR',
    'CHARACTER VARYING',
    'CHARACTER',
    'CLOB_BASE',
    'DATE_BASE',
    'DATE',
    'DECIMAL',
    'DOUBLE',
    'FLOAT',
    'INT',
    'INTERVAL DAY',
    'INTERVAL YEAR',
    'LONG',
    'NATIONAL CHAR VARYING',
    'NATIONAL CHAR',
    'NATIONAL CHARACTER VARYING',
    'NATIONAL CHARACTER',
    'NCHAR VARYING',
    'NCHAR',
    'NCHAR',
    'NUMBER_BASE',
    'NUMBER',
    'NUMBERIC',
    'NVARCHAR',
    'PRECISION',
    'RAW',
    'TIMESTAMP',
    'UROWID',
    'VARCHAR',
    'VARCHAR2'
]; //# sourceMappingURL=plsql.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/plsql/plsql.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.oracle.com/cd/B19306_01/server.102/b14200/functions001.htm
    // numeric
    'ABS',
    'ACOS',
    'ASIN',
    'ATAN',
    'ATAN2',
    'BITAND',
    'CEIL',
    'COS',
    'COSH',
    'EXP',
    'FLOOR',
    'LN',
    'LOG',
    'MOD',
    'NANVL',
    'POWER',
    'REMAINDER',
    'ROUND',
    'SIGN',
    'SIN',
    'SINH',
    'SQRT',
    'TAN',
    'TANH',
    'TRUNC',
    'WIDTH_BUCKET',
    // character
    'CHR',
    'CONCAT',
    'INITCAP',
    'LOWER',
    'LPAD',
    'LTRIM',
    'NLS_INITCAP',
    'NLS_LOWER',
    'NLSSORT',
    'NLS_UPPER',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'REPLACE',
    'RPAD',
    'RTRIM',
    'SOUNDEX',
    'SUBSTR',
    'TRANSLATE',
    'TREAT',
    'TRIM',
    'UPPER',
    'NLS_CHARSET_DECL_LEN',
    'NLS_CHARSET_ID',
    'NLS_CHARSET_NAME',
    'ASCII',
    'INSTR',
    'LENGTH',
    'REGEXP_INSTR',
    // datetime
    'ADD_MONTHS',
    'CURRENT_DATE',
    'CURRENT_TIMESTAMP',
    'DBTIMEZONE',
    'EXTRACT',
    'FROM_TZ',
    'LAST_DAY',
    'LOCALTIMESTAMP',
    'MONTHS_BETWEEN',
    'NEW_TIME',
    'NEXT_DAY',
    'NUMTODSINTERVAL',
    'NUMTOYMINTERVAL',
    'ROUND',
    'SESSIONTIMEZONE',
    'SYS_EXTRACT_UTC',
    'SYSDATE',
    'SYSTIMESTAMP',
    'TO_CHAR',
    'TO_TIMESTAMP',
    'TO_TIMESTAMP_TZ',
    'TO_DSINTERVAL',
    'TO_YMINTERVAL',
    'TRUNC',
    'TZ_OFFSET',
    // comparison
    'GREATEST',
    'LEAST',
    // conversion
    'ASCIISTR',
    'BIN_TO_NUM',
    'CAST',
    'CHARTOROWID',
    'COMPOSE',
    'CONVERT',
    'DECOMPOSE',
    'HEXTORAW',
    'NUMTODSINTERVAL',
    'NUMTOYMINTERVAL',
    'RAWTOHEX',
    'RAWTONHEX',
    'ROWIDTOCHAR',
    'ROWIDTONCHAR',
    'SCN_TO_TIMESTAMP',
    'TIMESTAMP_TO_SCN',
    'TO_BINARY_DOUBLE',
    'TO_BINARY_FLOAT',
    'TO_CHAR',
    'TO_CLOB',
    'TO_DATE',
    'TO_DSINTERVAL',
    'TO_LOB',
    'TO_MULTI_BYTE',
    'TO_NCHAR',
    'TO_NCLOB',
    'TO_NUMBER',
    'TO_DSINTERVAL',
    'TO_SINGLE_BYTE',
    'TO_TIMESTAMP',
    'TO_TIMESTAMP_TZ',
    'TO_YMINTERVAL',
    'TO_YMINTERVAL',
    'TRANSLATE',
    'UNISTR',
    // largeObject
    'BFILENAME',
    'EMPTY_BLOB,',
    'EMPTY_CLOB',
    // collection
    'CARDINALITY',
    'COLLECT',
    'POWERMULTISET',
    'POWERMULTISET_BY_CARDINALITY',
    'SET',
    // hierarchical
    'SYS_CONNECT_BY_PATH',
    // dataMining
    'CLUSTER_ID',
    'CLUSTER_PROBABILITY',
    'CLUSTER_SET',
    'FEATURE_ID',
    'FEATURE_SET',
    'FEATURE_VALUE',
    'PREDICTION',
    'PREDICTION_COST',
    'PREDICTION_DETAILS',
    'PREDICTION_PROBABILITY',
    'PREDICTION_SET',
    // xml
    'APPENDCHILDXML',
    'DELETEXML',
    'DEPTH',
    'EXTRACT',
    'EXISTSNODE',
    'EXTRACTVALUE',
    'INSERTCHILDXML',
    'INSERTXMLBEFORE',
    'PATH',
    'SYS_DBURIGEN',
    'SYS_XMLAGG',
    'SYS_XMLGEN',
    'UPDATEXML',
    'XMLAGG',
    'XMLCDATA',
    'XMLCOLATTVAL',
    'XMLCOMMENT',
    'XMLCONCAT',
    'XMLFOREST',
    'XMLPARSE',
    'XMLPI',
    'XMLQUERY',
    'XMLROOT',
    'XMLSEQUENCE',
    'XMLSERIALIZE',
    'XMLTABLE',
    'XMLTRANSFORM',
    // encoding
    'DECODE',
    'DUMP',
    'ORA_HASH',
    'VSIZE',
    // nullRelated
    'COALESCE',
    'LNNVL',
    'NULLIF',
    'NVL',
    'NVL2',
    // env
    'SYS_CONTEXT',
    'SYS_GUID',
    'SYS_TYPEID',
    'UID',
    'USER',
    'USERENV',
    // aggregate
    'AVG',
    'COLLECT',
    'CORR',
    'CORR_S',
    'CORR_K',
    'COUNT',
    'COVAR_POP',
    'COVAR_SAMP',
    'CUME_DIST',
    'DENSE_RANK',
    'FIRST',
    'GROUP_ID',
    'GROUPING',
    'GROUPING_ID',
    'LAST',
    'MAX',
    'MEDIAN',
    'MIN',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PERCENT_RANK',
    'RANK',
    'REGR_SLOPE',
    'REGR_INTERCEPT',
    'REGR_COUNT',
    'REGR_R2',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_SXX',
    'REGR_SYY',
    'REGR_SXY',
    'STATS_BINOMIAL_TEST',
    'STATS_CROSSTAB',
    'STATS_F_TEST',
    'STATS_KS_TEST',
    'STATS_MODE',
    'STATS_MW_TEST',
    'STATS_ONE_WAY_ANOVA',
    'STATS_T_TEST_ONE',
    'STATS_T_TEST_PAIRED',
    'STATS_T_TEST_INDEP',
    'STATS_T_TEST_INDEPU',
    'STATS_WSR_TEST',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'SUM',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    // Windowing functions (minus the ones already listed in aggregates)
    // window
    'FIRST_VALUE',
    'LAG',
    'LAST_VALUE',
    'LEAD',
    'NTILE',
    'RATIO_TO_REPORT',
    'ROW_NUMBER',
    // objectReference
    'DEREF',
    'MAKE_REF',
    'REF',
    'REFTOHEX',
    'VALUE',
    // model
    'CV',
    'ITERATION_NUMBER',
    'PRESENTNNV',
    'PRESENTV',
    'PREVIOUS'
]; //# sourceMappingURL=plsql.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/plsql/plsql.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "plsql",
    ()=>plsql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/plsql/plsql.keywords.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/plsql/plsql.functions.js [app-client] (ecmascript)");
;
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT | UNIQUE]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'PARTITION BY',
    'ORDER [SIBLINGS] BY',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    'FOR UPDATE [OF]',
    // Data manipulation
    // - insert:
    'INSERT [INTO | ALL INTO]',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE [INTO]',
    'WHEN [NOT] MATCHED [THEN]',
    'UPDATE SET',
    // other
    'RETURNING'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [GLOBAL TEMPORARY | PRIVATE TEMPORARY | SHARDED | DUPLICATED | IMMUTABLE BLOCKCHAIN | BLOCKCHAIN | IMMUTABLE] TABLE'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [NO FORCE | FORCE] [EDITIONING | EDITIONABLE | EDITIONABLE EDITIONING | NONEDITIONABLE] VIEW',
    'CREATE MATERIALIZED VIEW',
    // - update:
    'UPDATE [ONLY]',
    // - delete:
    'DELETE FROM [ONLY]',
    // - drop table:
    'DROP TABLE',
    // - alter table:
    'ALTER TABLE',
    'ADD',
    'DROP {COLUMN | UNUSED COLUMNS | COLUMNS CONTINUE}',
    'MODIFY',
    'RENAME TO',
    'RENAME COLUMN',
    // - truncate:
    'TRUNCATE TABLE',
    // other
    'SET SCHEMA',
    'BEGIN',
    'CONNECT BY',
    'DECLARE',
    'EXCEPT',
    'EXCEPTION',
    'LOOP',
    'START WITH'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'MINUS',
    'INTERSECT'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN',
    // non-standard joins
    '{CROSS | OUTER} APPLY'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL]',
    'ON COMMIT',
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const plsql = {
    name: 'plsql',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        stringTypes: [
            {
                quote: "''-qq",
                prefixes: [
                    'N'
                ]
            },
            {
                quote: "q''",
                prefixes: [
                    'N'
                ]
            }
        ],
        // PL/SQL doesn't actually support escaping of quotes in identifiers,
        // but for the sake of simpler testing we'll support this anyway
        // as all other SQL dialects with "identifiers" do.
        identTypes: [
            `""-qq`
        ],
        identChars: {
            rest: '$#'
        },
        variableTypes: [
            {
                regex: '&{1,2}[A-Za-z][A-Za-z0-9_$#]*'
            }
        ],
        paramTypes: {
            numbered: [
                ':'
            ],
            named: [
                ':'
            ]
        },
        operators: [
            '**',
            ':=',
            '%',
            '~=',
            '^=',
            // '..', // Conflicts with float followed by dot (so "2..3" gets parsed as ["2.", ".", "3"])
            '>>',
            '<<',
            '=>',
            '@',
            '||'
        ],
        postProcess
    },
    formatOptions: {
        alwaysDenseOperators: [
            '@'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
};
function postProcess(tokens) {
    let previousReservedToken = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EOF_TOKEN"];
    return tokens.map((token)=>{
        // BY [SET]
        if (__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].SET(token) && __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].BY(previousReservedToken)) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_KEYWORD
            });
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isReserved"])(token.type)) {
            previousReservedToken = token;
        }
        return token;
    });
} //# sourceMappingURL=plsql.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://www.postgresql.org/docs/14/functions.html
    //
    // https://www.postgresql.org/docs/14/functions-math.html
    'ABS',
    'ACOS',
    'ACOSD',
    'ACOSH',
    'ASIN',
    'ASIND',
    'ASINH',
    'ATAN',
    'ATAN2',
    'ATAN2D',
    'ATAND',
    'ATANH',
    'CBRT',
    'CEIL',
    'CEILING',
    'COS',
    'COSD',
    'COSH',
    'COT',
    'COTD',
    'DEGREES',
    'DIV',
    'EXP',
    'FACTORIAL',
    'FLOOR',
    'GCD',
    'LCM',
    'LN',
    'LOG',
    'LOG10',
    'MIN_SCALE',
    'MOD',
    'PI',
    'POWER',
    'RADIANS',
    'RANDOM',
    'ROUND',
    'SCALE',
    'SETSEED',
    'SIGN',
    'SIN',
    'SIND',
    'SINH',
    'SQRT',
    'TAN',
    'TAND',
    'TANH',
    'TRIM_SCALE',
    'TRUNC',
    'WIDTH_BUCKET',
    // https://www.postgresql.org/docs/14/functions-string.html
    'ABS',
    'ASCII',
    'BIT_LENGTH',
    'BTRIM',
    'CHARACTER_LENGTH',
    'CHAR_LENGTH',
    'CHR',
    'CONCAT',
    'CONCAT_WS',
    'FORMAT',
    'INITCAP',
    'LEFT',
    'LENGTH',
    'LOWER',
    'LPAD',
    'LTRIM',
    'MD5',
    'NORMALIZE',
    'OCTET_LENGTH',
    'OVERLAY',
    'PARSE_IDENT',
    'PG_CLIENT_ENCODING',
    'POSITION',
    'QUOTE_IDENT',
    'QUOTE_LITERAL',
    'QUOTE_NULLABLE',
    'REGEXP_MATCH',
    'REGEXP_MATCHES',
    'REGEXP_REPLACE',
    'REGEXP_SPLIT_TO_ARRAY',
    'REGEXP_SPLIT_TO_TABLE',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'RIGHT',
    'RPAD',
    'RTRIM',
    'SPLIT_PART',
    'SPRINTF',
    'STARTS_WITH',
    'STRING_AGG',
    'STRING_TO_ARRAY',
    'STRING_TO_TABLE',
    'STRPOS',
    'SUBSTR',
    'SUBSTRING',
    'TO_ASCII',
    'TO_HEX',
    'TRANSLATE',
    'TRIM',
    'UNISTR',
    'UPPER',
    // https://www.postgresql.org/docs/14/functions-binarystring.html
    'BIT_COUNT',
    'BIT_LENGTH',
    'BTRIM',
    'CONVERT',
    'CONVERT_FROM',
    'CONVERT_TO',
    'DECODE',
    'ENCODE',
    'GET_BIT',
    'GET_BYTE',
    'LENGTH',
    'LTRIM',
    'MD5',
    'OCTET_LENGTH',
    'OVERLAY',
    'POSITION',
    'RTRIM',
    'SET_BIT',
    'SET_BYTE',
    'SHA224',
    'SHA256',
    'SHA384',
    'SHA512',
    'STRING_AGG',
    'SUBSTR',
    'SUBSTRING',
    'TRIM',
    // https://www.postgresql.org/docs/14/functions-bitstring.html
    'BIT_COUNT',
    'BIT_LENGTH',
    'GET_BIT',
    'LENGTH',
    'OCTET_LENGTH',
    'OVERLAY',
    'POSITION',
    'SET_BIT',
    'SUBSTRING',
    // https://www.postgresql.org/docs/14/functions-matching.html
    'REGEXP_MATCH',
    'REGEXP_MATCHES',
    'REGEXP_REPLACE',
    'REGEXP_SPLIT_TO_ARRAY',
    'REGEXP_SPLIT_TO_TABLE',
    // https://www.postgresql.org/docs/14/functions-formatting.html
    'TO_CHAR',
    'TO_DATE',
    'TO_NUMBER',
    'TO_TIMESTAMP',
    // https://www.postgresql.org/docs/14/functions-datetime.html
    // 'AGE',
    'CLOCK_TIMESTAMP',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'DATE_BIN',
    'DATE_PART',
    'DATE_TRUNC',
    'EXTRACT',
    'ISFINITE',
    'JUSTIFY_DAYS',
    'JUSTIFY_HOURS',
    'JUSTIFY_INTERVAL',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'MAKE_DATE',
    'MAKE_INTERVAL',
    'MAKE_TIME',
    'MAKE_TIMESTAMP',
    'MAKE_TIMESTAMPTZ',
    'NOW',
    'PG_SLEEP',
    'PG_SLEEP_FOR',
    'PG_SLEEP_UNTIL',
    'STATEMENT_TIMESTAMP',
    'TIMEOFDAY',
    'TO_TIMESTAMP',
    'TRANSACTION_TIMESTAMP',
    // https://www.postgresql.org/docs/14/functions-enum.html
    'ENUM_FIRST',
    'ENUM_LAST',
    'ENUM_RANGE',
    // https://www.postgresql.org/docs/14/functions-geometry.html
    'AREA',
    'BOUND_BOX',
    'BOX',
    'CENTER',
    'CIRCLE',
    'DIAGONAL',
    'DIAMETER',
    'HEIGHT',
    'ISCLOSED',
    'ISOPEN',
    'LENGTH',
    'LINE',
    'LSEG',
    'NPOINTS',
    'PATH',
    'PCLOSE',
    'POINT',
    'POLYGON',
    'POPEN',
    'RADIUS',
    'SLOPE',
    'WIDTH',
    // https://www.postgresql.org/docs/14/functions-net.html
    'ABBREV',
    'BROADCAST',
    'FAMILY',
    'HOST',
    'HOSTMASK',
    'INET_MERGE',
    'INET_SAME_FAMILY',
    'MACADDR8_SET7BIT',
    'MASKLEN',
    'NETMASK',
    'NETWORK',
    'SET_MASKLEN',
    // 'TEXT', // excluded because it's also a data type name
    'TRUNC',
    // https://www.postgresql.org/docs/14/functions-textsearch.html
    'ARRAY_TO_TSVECTOR',
    'GET_CURRENT_TS_CONFIG',
    'JSONB_TO_TSVECTOR',
    'JSON_TO_TSVECTOR',
    'LENGTH',
    'NUMNODE',
    'PHRASETO_TSQUERY',
    'PLAINTO_TSQUERY',
    'QUERYTREE',
    'SETWEIGHT',
    'STRIP',
    'TO_TSQUERY',
    'TO_TSVECTOR',
    'TSQUERY_PHRASE',
    'TSVECTOR_TO_ARRAY',
    'TS_DEBUG',
    'TS_DELETE',
    'TS_FILTER',
    'TS_HEADLINE',
    'TS_LEXIZE',
    'TS_PARSE',
    'TS_RANK',
    'TS_RANK_CD',
    'TS_REWRITE',
    'TS_STAT',
    'TS_TOKEN_TYPE',
    'WEBSEARCH_TO_TSQUERY',
    // https://www.postgresql.org/docs/14/functions-uuid.html
    'GEN_RANDOM_UUID',
    // https://www.postgresql.org/docs/14/functions-xml.html
    'CURSOR_TO_XML',
    'CURSOR_TO_XMLSCHEMA',
    'DATABASE_TO_XML',
    'DATABASE_TO_XMLSCHEMA',
    'DATABASE_TO_XML_AND_XMLSCHEMA',
    'NEXTVAL',
    'QUERY_TO_XML',
    'QUERY_TO_XMLSCHEMA',
    'QUERY_TO_XML_AND_XMLSCHEMA',
    'SCHEMA_TO_XML',
    'SCHEMA_TO_XMLSCHEMA',
    'SCHEMA_TO_XML_AND_XMLSCHEMA',
    'STRING',
    'TABLE_TO_XML',
    'TABLE_TO_XMLSCHEMA',
    'TABLE_TO_XML_AND_XMLSCHEMA',
    'XMLAGG',
    'XMLCOMMENT',
    'XMLCONCAT',
    'XMLELEMENT',
    'XMLEXISTS',
    'XMLFOREST',
    'XMLPARSE',
    'XMLPI',
    'XMLROOT',
    'XMLSERIALIZE',
    'XMLTABLE',
    'XML_IS_WELL_FORMED',
    'XML_IS_WELL_FORMED_CONTENT',
    'XML_IS_WELL_FORMED_DOCUMENT',
    'XPATH',
    'XPATH_EXISTS',
    // https://www.postgresql.org/docs/14/functions-json.html
    'ARRAY_TO_JSON',
    'JSONB_AGG',
    'JSONB_ARRAY_ELEMENTS',
    'JSONB_ARRAY_ELEMENTS_TEXT',
    'JSONB_ARRAY_LENGTH',
    'JSONB_BUILD_ARRAY',
    'JSONB_BUILD_OBJECT',
    'JSONB_EACH',
    'JSONB_EACH_TEXT',
    'JSONB_EXTRACT_PATH',
    'JSONB_EXTRACT_PATH_TEXT',
    'JSONB_INSERT',
    'JSONB_OBJECT',
    'JSONB_OBJECT_AGG',
    'JSONB_OBJECT_KEYS',
    'JSONB_PATH_EXISTS',
    'JSONB_PATH_EXISTS_TZ',
    'JSONB_PATH_MATCH',
    'JSONB_PATH_MATCH_TZ',
    'JSONB_PATH_QUERY',
    'JSONB_PATH_QUERY_ARRAY',
    'JSONB_PATH_QUERY_ARRAY_TZ',
    'JSONB_PATH_QUERY_FIRST',
    'JSONB_PATH_QUERY_FIRST_TZ',
    'JSONB_PATH_QUERY_TZ',
    'JSONB_POPULATE_RECORD',
    'JSONB_POPULATE_RECORDSET',
    'JSONB_PRETTY',
    'JSONB_SET',
    'JSONB_SET_LAX',
    'JSONB_STRIP_NULLS',
    'JSONB_TO_RECORD',
    'JSONB_TO_RECORDSET',
    'JSONB_TYPEOF',
    'JSON_AGG',
    'JSON_ARRAY_ELEMENTS',
    'JSON_ARRAY_ELEMENTS_TEXT',
    'JSON_ARRAY_LENGTH',
    'JSON_BUILD_ARRAY',
    'JSON_BUILD_OBJECT',
    'JSON_EACH',
    'JSON_EACH_TEXT',
    'JSON_EXTRACT_PATH',
    'JSON_EXTRACT_PATH_TEXT',
    'JSON_OBJECT',
    'JSON_OBJECT_AGG',
    'JSON_OBJECT_KEYS',
    'JSON_POPULATE_RECORD',
    'JSON_POPULATE_RECORDSET',
    'JSON_STRIP_NULLS',
    'JSON_TO_RECORD',
    'JSON_TO_RECORDSET',
    'JSON_TYPEOF',
    'ROW_TO_JSON',
    'TO_JSON',
    'TO_JSONB',
    'TO_TIMESTAMP',
    // https://www.postgresql.org/docs/14/functions-sequence.html
    'CURRVAL',
    'LASTVAL',
    'NEXTVAL',
    'SETVAL',
    // https://www.postgresql.org/docs/14/functions-conditional.html
    // 'CASE',
    'COALESCE',
    'GREATEST',
    'LEAST',
    'NULLIF',
    // https://www.postgresql.org/docs/14/functions-array.html
    'ARRAY_AGG',
    'ARRAY_APPEND',
    'ARRAY_CAT',
    'ARRAY_DIMS',
    'ARRAY_FILL',
    'ARRAY_LENGTH',
    'ARRAY_LOWER',
    'ARRAY_NDIMS',
    'ARRAY_POSITION',
    'ARRAY_POSITIONS',
    'ARRAY_PREPEND',
    'ARRAY_REMOVE',
    'ARRAY_REPLACE',
    'ARRAY_TO_STRING',
    'ARRAY_UPPER',
    'CARDINALITY',
    'STRING_TO_ARRAY',
    'TRIM_ARRAY',
    'UNNEST',
    // https://www.postgresql.org/docs/14/functions-range.html
    'ISEMPTY',
    'LOWER',
    'LOWER_INC',
    'LOWER_INF',
    'MULTIRANGE',
    'RANGE_MERGE',
    'UPPER',
    'UPPER_INC',
    'UPPER_INF',
    // https://www.postgresql.org/docs/14/functions-aggregate.html
    // 'ANY',
    'ARRAY_AGG',
    'AVG',
    'BIT_AND',
    'BIT_OR',
    'BIT_XOR',
    'BOOL_AND',
    'BOOL_OR',
    'COALESCE',
    'CORR',
    'COUNT',
    'COVAR_POP',
    'COVAR_SAMP',
    'CUME_DIST',
    'DENSE_RANK',
    'EVERY',
    'GROUPING',
    'JSONB_AGG',
    'JSONB_OBJECT_AGG',
    'JSON_AGG',
    'JSON_OBJECT_AGG',
    'MAX',
    'MIN',
    'MODE',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PERCENT_RANK',
    'RANGE_AGG',
    'RANGE_INTERSECT_AGG',
    'RANK',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_COUNT',
    'REGR_INTERCEPT',
    'REGR_R2',
    'REGR_SLOPE',
    'REGR_SXX',
    'REGR_SXY',
    'REGR_SYY',
    // 'SOME',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STRING_AGG',
    'SUM',
    'TO_JSON',
    'TO_JSONB',
    'VARIANCE',
    'VAR_POP',
    'VAR_SAMP',
    'XMLAGG',
    // https://www.postgresql.org/docs/14/functions-window.html
    'CUME_DIST',
    'DENSE_RANK',
    'FIRST_VALUE',
    'LAG',
    'LAST_VALUE',
    'LEAD',
    'NTH_VALUE',
    'NTILE',
    'PERCENT_RANK',
    'RANK',
    'ROW_NUMBER',
    // https://www.postgresql.org/docs/14/functions-srf.html
    'GENERATE_SERIES',
    'GENERATE_SUBSCRIPTS',
    // https://www.postgresql.org/docs/14/functions-info.html
    'ACLDEFAULT',
    'ACLEXPLODE',
    'COL_DESCRIPTION',
    'CURRENT_CATALOG',
    'CURRENT_DATABASE',
    'CURRENT_QUERY',
    'CURRENT_ROLE',
    'CURRENT_SCHEMA',
    'CURRENT_SCHEMAS',
    'CURRENT_USER',
    'FORMAT_TYPE',
    'HAS_ANY_COLUMN_PRIVILEGE',
    'HAS_COLUMN_PRIVILEGE',
    'HAS_DATABASE_PRIVILEGE',
    'HAS_FOREIGN_DATA_WRAPPER_PRIVILEGE',
    'HAS_FUNCTION_PRIVILEGE',
    'HAS_LANGUAGE_PRIVILEGE',
    'HAS_SCHEMA_PRIVILEGE',
    'HAS_SEQUENCE_PRIVILEGE',
    'HAS_SERVER_PRIVILEGE',
    'HAS_TABLESPACE_PRIVILEGE',
    'HAS_TABLE_PRIVILEGE',
    'HAS_TYPE_PRIVILEGE',
    'INET_CLIENT_ADDR',
    'INET_CLIENT_PORT',
    'INET_SERVER_ADDR',
    'INET_SERVER_PORT',
    'MAKEACLITEM',
    'OBJ_DESCRIPTION',
    'PG_BACKEND_PID',
    'PG_BLOCKING_PIDS',
    'PG_COLLATION_IS_VISIBLE',
    'PG_CONF_LOAD_TIME',
    'PG_CONTROL_CHECKPOINT',
    'PG_CONTROL_INIT',
    'PG_CONTROL_SYSTEM',
    'PG_CONVERSION_IS_VISIBLE',
    'PG_CURRENT_LOGFILE',
    'PG_CURRENT_SNAPSHOT',
    'PG_CURRENT_XACT_ID',
    'PG_CURRENT_XACT_ID_IF_ASSIGNED',
    'PG_DESCRIBE_OBJECT',
    'PG_FUNCTION_IS_VISIBLE',
    'PG_GET_CATALOG_FOREIGN_KEYS',
    'PG_GET_CONSTRAINTDEF',
    'PG_GET_EXPR',
    'PG_GET_FUNCTIONDEF',
    'PG_GET_FUNCTION_ARGUMENTS',
    'PG_GET_FUNCTION_IDENTITY_ARGUMENTS',
    'PG_GET_FUNCTION_RESULT',
    'PG_GET_INDEXDEF',
    'PG_GET_KEYWORDS',
    'PG_GET_OBJECT_ADDRESS',
    'PG_GET_OWNED_SEQUENCE',
    'PG_GET_RULEDEF',
    'PG_GET_SERIAL_SEQUENCE',
    'PG_GET_STATISTICSOBJDEF',
    'PG_GET_TRIGGERDEF',
    'PG_GET_USERBYID',
    'PG_GET_VIEWDEF',
    'PG_HAS_ROLE',
    'PG_IDENTIFY_OBJECT',
    'PG_IDENTIFY_OBJECT_AS_ADDRESS',
    'PG_INDEXAM_HAS_PROPERTY',
    'PG_INDEX_COLUMN_HAS_PROPERTY',
    'PG_INDEX_HAS_PROPERTY',
    'PG_IS_OTHER_TEMP_SCHEMA',
    'PG_JIT_AVAILABLE',
    'PG_LAST_COMMITTED_XACT',
    'PG_LISTENING_CHANNELS',
    'PG_MY_TEMP_SCHEMA',
    'PG_NOTIFICATION_QUEUE_USAGE',
    'PG_OPCLASS_IS_VISIBLE',
    'PG_OPERATOR_IS_VISIBLE',
    'PG_OPFAMILY_IS_VISIBLE',
    'PG_OPTIONS_TO_TABLE',
    'PG_POSTMASTER_START_TIME',
    'PG_SAFE_SNAPSHOT_BLOCKING_PIDS',
    'PG_SNAPSHOT_XIP',
    'PG_SNAPSHOT_XMAX',
    'PG_SNAPSHOT_XMIN',
    'PG_STATISTICS_OBJ_IS_VISIBLE',
    'PG_TABLESPACE_DATABASES',
    'PG_TABLESPACE_LOCATION',
    'PG_TABLE_IS_VISIBLE',
    'PG_TRIGGER_DEPTH',
    'PG_TS_CONFIG_IS_VISIBLE',
    'PG_TS_DICT_IS_VISIBLE',
    'PG_TS_PARSER_IS_VISIBLE',
    'PG_TS_TEMPLATE_IS_VISIBLE',
    'PG_TYPEOF',
    'PG_TYPE_IS_VISIBLE',
    'PG_VISIBLE_IN_SNAPSHOT',
    'PG_XACT_COMMIT_TIMESTAMP',
    'PG_XACT_COMMIT_TIMESTAMP_ORIGIN',
    'PG_XACT_STATUS',
    'PQSERVERVERSION',
    'ROW_SECURITY_ACTIVE',
    'SESSION_USER',
    'SHOBJ_DESCRIPTION',
    'TO_REGCLASS',
    'TO_REGCOLLATION',
    'TO_REGNAMESPACE',
    'TO_REGOPER',
    'TO_REGOPERATOR',
    'TO_REGPROC',
    'TO_REGPROCEDURE',
    'TO_REGROLE',
    'TO_REGTYPE',
    'TXID_CURRENT',
    'TXID_CURRENT_IF_ASSIGNED',
    'TXID_CURRENT_SNAPSHOT',
    'TXID_SNAPSHOT_XIP',
    'TXID_SNAPSHOT_XMAX',
    'TXID_SNAPSHOT_XMIN',
    'TXID_STATUS',
    'TXID_VISIBLE_IN_SNAPSHOT',
    'USER',
    'VERSION',
    // https://www.postgresql.org/docs/14/functions-admin.html
    'BRIN_DESUMMARIZE_RANGE',
    'BRIN_SUMMARIZE_NEW_VALUES',
    'BRIN_SUMMARIZE_RANGE',
    'CONVERT_FROM',
    'CURRENT_SETTING',
    'GIN_CLEAN_PENDING_LIST',
    'PG_ADVISORY_LOCK',
    'PG_ADVISORY_LOCK_SHARED',
    'PG_ADVISORY_UNLOCK',
    'PG_ADVISORY_UNLOCK_ALL',
    'PG_ADVISORY_UNLOCK_SHARED',
    'PG_ADVISORY_XACT_LOCK',
    'PG_ADVISORY_XACT_LOCK_SHARED',
    'PG_BACKUP_START_TIME',
    'PG_CANCEL_BACKEND',
    'PG_COLLATION_ACTUAL_VERSION',
    'PG_COLUMN_COMPRESSION',
    'PG_COLUMN_SIZE',
    'PG_COPY_LOGICAL_REPLICATION_SLOT',
    'PG_COPY_PHYSICAL_REPLICATION_SLOT',
    'PG_CREATE_LOGICAL_REPLICATION_SLOT',
    'PG_CREATE_PHYSICAL_REPLICATION_SLOT',
    'PG_CREATE_RESTORE_POINT',
    'PG_CURRENT_WAL_FLUSH_LSN',
    'PG_CURRENT_WAL_INSERT_LSN',
    'PG_CURRENT_WAL_LSN',
    'PG_DATABASE_SIZE',
    'PG_DROP_REPLICATION_SLOT',
    'PG_EXPORT_SNAPSHOT',
    'PG_FILENODE_RELATION',
    'PG_GET_WAL_REPLAY_PAUSE_STATE',
    'PG_IMPORT_SYSTEM_COLLATIONS',
    'PG_INDEXES_SIZE',
    'PG_IS_IN_BACKUP',
    'PG_IS_IN_RECOVERY',
    'PG_IS_WAL_REPLAY_PAUSED',
    'PG_LAST_WAL_RECEIVE_LSN',
    'PG_LAST_WAL_REPLAY_LSN',
    'PG_LAST_XACT_REPLAY_TIMESTAMP',
    'PG_LOGICAL_EMIT_MESSAGE',
    'PG_LOGICAL_SLOT_GET_BINARY_CHANGES',
    'PG_LOGICAL_SLOT_GET_CHANGES',
    'PG_LOGICAL_SLOT_PEEK_BINARY_CHANGES',
    'PG_LOGICAL_SLOT_PEEK_CHANGES',
    'PG_LOG_BACKEND_MEMORY_CONTEXTS',
    'PG_LS_ARCHIVE_STATUSDIR',
    'PG_LS_DIR',
    'PG_LS_LOGDIR',
    'PG_LS_TMPDIR',
    'PG_LS_WALDIR',
    'PG_PARTITION_ANCESTORS',
    'PG_PARTITION_ROOT',
    'PG_PARTITION_TREE',
    'PG_PROMOTE',
    'PG_READ_BINARY_FILE',
    'PG_READ_FILE',
    'PG_RELATION_FILENODE',
    'PG_RELATION_FILEPATH',
    'PG_RELATION_SIZE',
    'PG_RELOAD_CONF',
    'PG_REPLICATION_ORIGIN_ADVANCE',
    'PG_REPLICATION_ORIGIN_CREATE',
    'PG_REPLICATION_ORIGIN_DROP',
    'PG_REPLICATION_ORIGIN_OID',
    'PG_REPLICATION_ORIGIN_PROGRESS',
    'PG_REPLICATION_ORIGIN_SESSION_IS_SETUP',
    'PG_REPLICATION_ORIGIN_SESSION_PROGRESS',
    'PG_REPLICATION_ORIGIN_SESSION_RESET',
    'PG_REPLICATION_ORIGIN_SESSION_SETUP',
    'PG_REPLICATION_ORIGIN_XACT_RESET',
    'PG_REPLICATION_ORIGIN_XACT_SETUP',
    'PG_REPLICATION_SLOT_ADVANCE',
    'PG_ROTATE_LOGFILE',
    'PG_SIZE_BYTES',
    'PG_SIZE_PRETTY',
    'PG_START_BACKUP',
    'PG_STAT_FILE',
    'PG_STOP_BACKUP',
    'PG_SWITCH_WAL',
    'PG_TABLESPACE_SIZE',
    'PG_TABLE_SIZE',
    'PG_TERMINATE_BACKEND',
    'PG_TOTAL_RELATION_SIZE',
    'PG_TRY_ADVISORY_LOCK',
    'PG_TRY_ADVISORY_LOCK_SHARED',
    'PG_TRY_ADVISORY_XACT_LOCK',
    'PG_TRY_ADVISORY_XACT_LOCK_SHARED',
    'PG_WALFILE_NAME',
    'PG_WALFILE_NAME_OFFSET',
    'PG_WAL_LSN_DIFF',
    'PG_WAL_REPLAY_PAUSE',
    'PG_WAL_REPLAY_RESUME',
    'SET_CONFIG',
    // https://www.postgresql.org/docs/14/functions-trigger.html
    'SUPPRESS_REDUNDANT_UPDATES_TRIGGER',
    'TSVECTOR_UPDATE_TRIGGER',
    'TSVECTOR_UPDATE_TRIGGER_COLUMN',
    // https://www.postgresql.org/docs/14/functions-event-triggers.html
    'PG_EVENT_TRIGGER_DDL_COMMANDS',
    'PG_EVENT_TRIGGER_DROPPED_OBJECTS',
    'PG_EVENT_TRIGGER_TABLE_REWRITE_OID',
    'PG_EVENT_TRIGGER_TABLE_REWRITE_REASON',
    'PG_GET_OBJECT_ADDRESS',
    // https://www.postgresql.org/docs/14/functions-statistics.html
    'PG_MCV_LIST_ITEMS',
    // cast
    'CAST'
]; //# sourceMappingURL=postgresql.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://www.postgresql.org/docs/14/sql-keywords-appendix.html
    'ALL',
    'ANALYSE',
    'ANALYZE',
    'AND',
    'ANY',
    'AS',
    'ASC',
    'ASYMMETRIC',
    'AUTHORIZATION',
    'BETWEEN',
    'BINARY',
    'BOTH',
    'CASE',
    'CAST',
    'CHECK',
    'COLLATE',
    'COLLATION',
    'COLUMN',
    'CONCURRENTLY',
    'CONSTRAINT',
    'CREATE',
    'CROSS',
    'CURRENT_CATALOG',
    'CURRENT_DATE',
    'CURRENT_ROLE',
    'CURRENT_SCHEMA',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'DAY',
    'DEFAULT',
    'DEFERRABLE',
    'DESC',
    'DISTINCT',
    'DO',
    'ELSE',
    'END',
    'EXCEPT',
    'EXISTS',
    'FALSE',
    'FETCH',
    'FILTER',
    'FOR',
    'FOREIGN',
    'FREEZE',
    'FROM',
    'FULL',
    'GRANT',
    'GROUP',
    'HAVING',
    'HOUR',
    'ILIKE',
    'IN',
    'INITIALLY',
    'INNER',
    'INOUT',
    'INTERSECT',
    'INTO',
    'IS',
    'ISNULL',
    'JOIN',
    'LATERAL',
    'LEADING',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'MINUTE',
    'MONTH',
    'NATURAL',
    'NOT',
    'NOTNULL',
    'NULL',
    'NULLIF',
    'OFFSET',
    'ON',
    'ONLY',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OVER',
    'OVERLAPS',
    'PLACING',
    'PRIMARY',
    'REFERENCES',
    'RETURNING',
    'RIGHT',
    'ROW',
    'SECOND',
    'SELECT',
    'SESSION_USER',
    'SIMILAR',
    'SOME',
    'SYMMETRIC',
    'TABLE',
    'TABLESAMPLE',
    'THEN',
    'TO',
    'TRAILING',
    'TRUE',
    'UNION',
    'UNIQUE',
    'USER',
    'USING',
    'VALUES',
    'VARIADIC',
    'VERBOSE',
    'WHEN',
    'WHERE',
    'WINDOW',
    'WITH',
    'WITHIN',
    'WITHOUT',
    'YEAR'
];
const dataTypes = [
    // https://www.postgresql.org/docs/current/datatype.html
    'ARRAY',
    'BIGINT',
    'BIT',
    'BIT VARYING',
    'BOOL',
    'BOOLEAN',
    'CHAR',
    'CHARACTER',
    'CHARACTER VARYING',
    'DECIMAL',
    'DEC',
    'DOUBLE',
    'ENUM',
    'FLOAT',
    'INT',
    'INTEGER',
    'INTERVAL',
    'NCHAR',
    'NUMERIC',
    'JSON',
    'JSONB',
    'PRECISION',
    'REAL',
    'SMALLINT',
    'TEXT',
    'TIME',
    'TIMESTAMP',
    'TIMESTAMPTZ',
    'UUID',
    'VARCHAR',
    'XML',
    'ZONE'
]; //# sourceMappingURL=postgresql.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "postgresql",
    ()=>postgresql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY [ALL | DISTINCT]',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    'FOR {UPDATE | NO KEY UPDATE | SHARE | KEY SHARE} [OF]',
    // Data manipulation
    // - insert:
    'INSERT INTO',
    'VALUES',
    'DEFAULT VALUES',
    // - update:
    'SET',
    // other
    'RETURNING'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [GLOBAL | LOCAL] [TEMPORARY | TEMP | UNLOGGED] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create
    'CREATE [OR REPLACE] [TEMP | TEMPORARY] [RECURSIVE] VIEW',
    'CREATE [MATERIALIZED] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE [ONLY]',
    'WHERE CURRENT OF',
    // - insert:
    'ON CONFLICT',
    // - delete:
    'DELETE FROM [ONLY]',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE [IF EXISTS] [ONLY]',
    'ALTER TABLE ALL IN TABLESPACE',
    'RENAME [COLUMN]',
    'RENAME TO',
    'ADD [COLUMN] [IF NOT EXISTS]',
    'DROP [COLUMN] [IF EXISTS]',
    'ALTER [COLUMN]',
    'SET DATA TYPE',
    '{SET | DROP} DEFAULT',
    '{SET | DROP} NOT NULL',
    // - truncate:
    'TRUNCATE [TABLE] [ONLY]',
    // other
    'SET SCHEMA',
    'AFTER',
    // https://www.postgresql.org/docs/14/sql-commands.html
    'ABORT',
    'ALTER AGGREGATE',
    'ALTER COLLATION',
    'ALTER CONVERSION',
    'ALTER DATABASE',
    'ALTER DEFAULT PRIVILEGES',
    'ALTER DOMAIN',
    'ALTER EVENT TRIGGER',
    'ALTER EXTENSION',
    'ALTER FOREIGN DATA WRAPPER',
    'ALTER FOREIGN TABLE',
    'ALTER FUNCTION',
    'ALTER GROUP',
    'ALTER INDEX',
    'ALTER LANGUAGE',
    'ALTER LARGE OBJECT',
    'ALTER MATERIALIZED VIEW',
    'ALTER OPERATOR',
    'ALTER OPERATOR CLASS',
    'ALTER OPERATOR FAMILY',
    'ALTER POLICY',
    'ALTER PROCEDURE',
    'ALTER PUBLICATION',
    'ALTER ROLE',
    'ALTER ROUTINE',
    'ALTER RULE',
    'ALTER SCHEMA',
    'ALTER SEQUENCE',
    'ALTER SERVER',
    'ALTER STATISTICS',
    'ALTER SUBSCRIPTION',
    'ALTER SYSTEM',
    'ALTER TABLESPACE',
    'ALTER TEXT SEARCH CONFIGURATION',
    'ALTER TEXT SEARCH DICTIONARY',
    'ALTER TEXT SEARCH PARSER',
    'ALTER TEXT SEARCH TEMPLATE',
    'ALTER TRIGGER',
    'ALTER TYPE',
    'ALTER USER',
    'ALTER USER MAPPING',
    'ALTER VIEW',
    'ANALYZE',
    'BEGIN',
    'CALL',
    'CHECKPOINT',
    'CLOSE',
    'CLUSTER',
    'COMMIT',
    'COMMIT PREPARED',
    'COPY',
    'CREATE ACCESS METHOD',
    'CREATE [OR REPLACE] AGGREGATE',
    'CREATE CAST',
    'CREATE COLLATION',
    'CREATE [DEFAULT] CONVERSION',
    'CREATE DATABASE',
    'CREATE DOMAIN',
    'CREATE EVENT TRIGGER',
    'CREATE EXTENSION',
    'CREATE FOREIGN DATA WRAPPER',
    'CREATE FOREIGN TABLE',
    'CREATE [OR REPLACE] FUNCTION',
    'CREATE GROUP',
    'CREATE [UNIQUE] INDEX',
    'CREATE [OR REPLACE] [TRUSTED] [PROCEDURAL] LANGUAGE',
    'CREATE OPERATOR',
    'CREATE OPERATOR CLASS',
    'CREATE OPERATOR FAMILY',
    'CREATE POLICY',
    'CREATE [OR REPLACE] PROCEDURE',
    'CREATE PUBLICATION',
    'CREATE ROLE',
    'CREATE [OR REPLACE] RULE',
    'CREATE SCHEMA [AUTHORIZATION]',
    'CREATE [TEMPORARY | TEMP | UNLOGGED] SEQUENCE',
    'CREATE SERVER',
    'CREATE STATISTICS',
    'CREATE SUBSCRIPTION',
    'CREATE TABLESPACE',
    'CREATE TEXT SEARCH CONFIGURATION',
    'CREATE TEXT SEARCH DICTIONARY',
    'CREATE TEXT SEARCH PARSER',
    'CREATE TEXT SEARCH TEMPLATE',
    'CREATE [OR REPLACE] TRANSFORM',
    'CREATE [OR REPLACE] [CONSTRAINT] TRIGGER',
    'CREATE TYPE',
    'CREATE USER',
    'CREATE USER MAPPING',
    'DEALLOCATE',
    'DECLARE',
    'DISCARD',
    'DROP ACCESS METHOD',
    'DROP AGGREGATE',
    'DROP CAST',
    'DROP COLLATION',
    'DROP CONVERSION',
    'DROP DATABASE',
    'DROP DOMAIN',
    'DROP EVENT TRIGGER',
    'DROP EXTENSION',
    'DROP FOREIGN DATA WRAPPER',
    'DROP FOREIGN TABLE',
    'DROP FUNCTION',
    'DROP GROUP',
    'DROP IDENTITY',
    'DROP INDEX',
    'DROP LANGUAGE',
    'DROP MATERIALIZED VIEW [IF EXISTS]',
    'DROP OPERATOR',
    'DROP OPERATOR CLASS',
    'DROP OPERATOR FAMILY',
    'DROP OWNED',
    'DROP POLICY',
    'DROP PROCEDURE',
    'DROP PUBLICATION',
    'DROP ROLE',
    'DROP ROUTINE',
    'DROP RULE',
    'DROP SCHEMA',
    'DROP SEQUENCE',
    'DROP SERVER',
    'DROP STATISTICS',
    'DROP SUBSCRIPTION',
    'DROP TABLESPACE',
    'DROP TEXT SEARCH CONFIGURATION',
    'DROP TEXT SEARCH DICTIONARY',
    'DROP TEXT SEARCH PARSER',
    'DROP TEXT SEARCH TEMPLATE',
    'DROP TRANSFORM',
    'DROP TRIGGER',
    'DROP TYPE',
    'DROP USER',
    'DROP USER MAPPING',
    'DROP VIEW',
    'EXECUTE',
    'EXPLAIN',
    'FETCH',
    'GRANT',
    'IMPORT FOREIGN SCHEMA',
    'LISTEN',
    'LOAD',
    'LOCK',
    'MOVE',
    'NOTIFY',
    'OVERRIDING SYSTEM VALUE',
    'PREPARE',
    'PREPARE TRANSACTION',
    'REASSIGN OWNED',
    'REFRESH MATERIALIZED VIEW',
    'REINDEX',
    'RELEASE SAVEPOINT',
    'RESET [ALL|ROLE|SESSION AUTHORIZATION]',
    'REVOKE',
    'ROLLBACK',
    'ROLLBACK PREPARED',
    'ROLLBACK TO SAVEPOINT',
    'SAVEPOINT',
    'SECURITY LABEL',
    'SELECT INTO',
    'SET CONSTRAINTS',
    'SET ROLE',
    'SET SESSION AUTHORIZATION',
    'SET TRANSACTION',
    'SHOW',
    'START TRANSACTION',
    'UNLISTEN',
    'VACUUM'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]',
    'EXCEPT [ALL | DISTINCT]',
    'INTERSECT [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'PRIMARY KEY',
    'GENERATED {ALWAYS | BY DEFAULT} AS IDENTITY',
    'ON {UPDATE | DELETE} [NO ACTION | RESTRICT | CASCADE | SET NULL | SET DEFAULT]',
    'DO {NOTHING | UPDATE}',
    'AS MATERIALIZED',
    '{ROWS | RANGE | GROUPS} BETWEEN',
    // comparison operator
    'IS [NOT] DISTINCT FROM',
    'NULLS {FIRST | LAST}',
    'WITH ORDINALITY'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // https://www.postgresql.org/docs/current/datatype-datetime.html
    '[TIMESTAMP | TIME] {WITH | WITHOUT} TIME ZONE'
]);
const postgresql = {
    name: 'postgresql',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        nestedBlockComments: true,
        extraParens: [
            '[]'
        ],
        underscoresInNumbers: true,
        stringTypes: [
            '$$',
            {
                quote: "''-qq",
                prefixes: [
                    'U&'
                ]
            },
            {
                quote: "''-qq-bs",
                prefixes: [
                    'E'
                ],
                requirePrefix: true
            },
            {
                quote: "''-raw",
                prefixes: [
                    'B',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            {
                quote: '""-qq',
                prefixes: [
                    'U&'
                ]
            }
        ],
        identChars: {
            rest: '$'
        },
        paramTypes: {
            numbered: [
                '$'
            ]
        },
        operators: [
            // Arithmetic
            '%',
            '^',
            '|/',
            '||/',
            '@',
            // Assignment
            ':=',
            // Bitwise
            '&',
            '|',
            '#',
            '~',
            '<<',
            '>>',
            // Byte comparison
            '~>~',
            '~<~',
            '~>=~',
            '~<=~',
            // Geometric
            '@-@',
            '@@',
            '##',
            '<->',
            '&&',
            '&<',
            '&>',
            '<<|',
            '&<|',
            '|>>',
            '|&>',
            '<^',
            '^>',
            '?#',
            '?-',
            '?|',
            '?-|',
            '?||',
            '@>',
            '<@',
            '~=',
            // JSON
            '?',
            '@?',
            '?&',
            '->',
            '->>',
            '#>',
            '#>>',
            '#-',
            // Named function params
            '=>',
            // Network address
            '>>=',
            '<<=',
            // Pattern matching
            '~~',
            '~~*',
            '!~~',
            '!~~*',
            // POSIX RegExp
            '~',
            '~*',
            '!~',
            '!~*',
            // Range/multirange
            '-|-',
            // String concatenation
            '||',
            // Text search
            '@@@',
            '!!',
            '^@',
            // Trigram/trigraph
            '<%',
            '%>',
            '<<%',
            '%>>',
            '<<->',
            '<->>',
            '<<<->',
            '<->>>',
            // Type cast
            '::',
            ':',
            // Custom operators defined by pgvector extension
            // https://github.com/pgvector/pgvector#querying
            '<#>',
            '<=>',
            '<+>',
            '<~>',
            '<%>'
        ],
        operatorKeyword: true
    },
    formatOptions: {
        alwaysDenseOperators: [
            '::',
            ':'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=postgresql.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/redshift/redshift.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.aws.amazon.com/redshift/latest/dg/c_Aggregate_Functions.html
    'ANY_VALUE',
    'APPROXIMATE PERCENTILE_DISC',
    'AVG',
    'COUNT',
    'LISTAGG',
    'MAX',
    'MEDIAN',
    'MIN',
    'PERCENTILE_CONT',
    'STDDEV_SAMP',
    'STDDEV_POP',
    'SUM',
    'VAR_SAMP',
    'VAR_POP',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_Array_Functions.html
    // 'array',
    'array_concat',
    'array_flatten',
    'get_array_length',
    'split_to_array',
    'subarray',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_bitwise_aggregate_functions.html
    'BIT_AND',
    'BIT_OR',
    'BOOL_AND',
    'BOOL_OR',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_conditional_expressions.html
    'COALESCE',
    'DECODE',
    'GREATEST',
    'LEAST',
    'NVL',
    'NVL2',
    'NULLIF',
    // https://docs.aws.amazon.com/redshift/latest/dg/Date_functions_header.html
    'ADD_MONTHS',
    'AT TIME ZONE',
    'CONVERT_TIMEZONE',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'DATE_CMP',
    'DATE_CMP_TIMESTAMP',
    'DATE_CMP_TIMESTAMPTZ',
    'DATE_PART_YEAR',
    'DATEADD',
    'DATEDIFF',
    'DATE_PART',
    'DATE_TRUNC',
    'EXTRACT',
    'GETDATE',
    'INTERVAL_CMP',
    'LAST_DAY',
    'MONTHS_BETWEEN',
    'NEXT_DAY',
    'SYSDATE',
    'TIMEOFDAY',
    'TIMESTAMP_CMP',
    'TIMESTAMP_CMP_DATE',
    'TIMESTAMP_CMP_TIMESTAMPTZ',
    'TIMESTAMPTZ_CMP',
    'TIMESTAMPTZ_CMP_DATE',
    'TIMESTAMPTZ_CMP_TIMESTAMP',
    'TIMEZONE',
    'TO_TIMESTAMP',
    'TRUNC',
    // https://docs.aws.amazon.com/redshift/latest/dg/geospatial-functions.html
    'AddBBox',
    'DropBBox',
    'GeometryType',
    'ST_AddPoint',
    'ST_Angle',
    'ST_Area',
    'ST_AsBinary',
    'ST_AsEWKB',
    'ST_AsEWKT',
    'ST_AsGeoJSON',
    'ST_AsText',
    'ST_Azimuth',
    'ST_Boundary',
    'ST_Collect',
    'ST_Contains',
    'ST_ContainsProperly',
    'ST_ConvexHull',
    'ST_CoveredBy',
    'ST_Covers',
    'ST_Crosses',
    'ST_Dimension',
    'ST_Disjoint',
    'ST_Distance',
    'ST_DistanceSphere',
    'ST_DWithin',
    'ST_EndPoint',
    'ST_Envelope',
    'ST_Equals',
    'ST_ExteriorRing',
    'ST_Force2D',
    'ST_Force3D',
    'ST_Force3DM',
    'ST_Force3DZ',
    'ST_Force4D',
    'ST_GeometryN',
    'ST_GeometryType',
    'ST_GeomFromEWKB',
    'ST_GeomFromEWKT',
    'ST_GeomFromText',
    'ST_GeomFromWKB',
    'ST_InteriorRingN',
    'ST_Intersects',
    'ST_IsPolygonCCW',
    'ST_IsPolygonCW',
    'ST_IsClosed',
    'ST_IsCollection',
    'ST_IsEmpty',
    'ST_IsSimple',
    'ST_IsValid',
    'ST_Length',
    'ST_LengthSphere',
    'ST_Length2D',
    'ST_LineFromMultiPoint',
    'ST_LineInterpolatePoint',
    'ST_M',
    'ST_MakeEnvelope',
    'ST_MakeLine',
    'ST_MakePoint',
    'ST_MakePolygon',
    'ST_MemSize',
    'ST_MMax',
    'ST_MMin',
    'ST_Multi',
    'ST_NDims',
    'ST_NPoints',
    'ST_NRings',
    'ST_NumGeometries',
    'ST_NumInteriorRings',
    'ST_NumPoints',
    'ST_Perimeter',
    'ST_Perimeter2D',
    'ST_Point',
    'ST_PointN',
    'ST_Points',
    'ST_Polygon',
    'ST_RemovePoint',
    'ST_Reverse',
    'ST_SetPoint',
    'ST_SetSRID',
    'ST_Simplify',
    'ST_SRID',
    'ST_StartPoint',
    'ST_Touches',
    'ST_Within',
    'ST_X',
    'ST_XMax',
    'ST_XMin',
    'ST_Y',
    'ST_YMax',
    'ST_YMin',
    'ST_Z',
    'ST_ZMax',
    'ST_ZMin',
    'SupportsBBox',
    // https://docs.aws.amazon.com/redshift/latest/dg/hash-functions.html
    'CHECKSUM',
    'FUNC_SHA1',
    'FNV_HASH',
    'MD5',
    'SHA',
    'SHA1',
    'SHA2',
    // https://docs.aws.amazon.com/redshift/latest/dg/hyperloglog-functions.html
    'HLL',
    'HLL_CREATE_SKETCH',
    'HLL_CARDINALITY',
    'HLL_COMBINE',
    // https://docs.aws.amazon.com/redshift/latest/dg/json-functions.html
    'IS_VALID_JSON',
    'IS_VALID_JSON_ARRAY',
    'JSON_ARRAY_LENGTH',
    'JSON_EXTRACT_ARRAY_ELEMENT_TEXT',
    'JSON_EXTRACT_PATH_TEXT',
    'JSON_PARSE',
    'JSON_SERIALIZE',
    // https://docs.aws.amazon.com/redshift/latest/dg/Math_functions.html
    'ABS',
    'ACOS',
    'ASIN',
    'ATAN',
    'ATAN2',
    'CBRT',
    'CEILING',
    'CEIL',
    'COS',
    'COT',
    'DEGREES',
    'DEXP',
    'DLOG1',
    'DLOG10',
    'EXP',
    'FLOOR',
    'LN',
    'LOG',
    'MOD',
    'PI',
    'POWER',
    'RADIANS',
    'RANDOM',
    'ROUND',
    'SIN',
    'SIGN',
    'SQRT',
    'TAN',
    'TO_HEX',
    'TRUNC',
    // https://docs.aws.amazon.com/redshift/latest/dg/ml-function.html
    'EXPLAIN_MODEL',
    // https://docs.aws.amazon.com/redshift/latest/dg/String_functions_header.html
    'ASCII',
    'BPCHARCMP',
    'BTRIM',
    'BTTEXT_PATTERN_CMP',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'CHARINDEX',
    'CHR',
    'COLLATE',
    'CONCAT',
    'CRC32',
    'DIFFERENCE',
    'INITCAP',
    'LEFT',
    'RIGHT',
    'LEN',
    'LENGTH',
    'LOWER',
    'LPAD',
    'RPAD',
    'LTRIM',
    'OCTETINDEX',
    'OCTET_LENGTH',
    'POSITION',
    'QUOTE_IDENT',
    'QUOTE_LITERAL',
    'REGEXP_COUNT',
    'REGEXP_INSTR',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'REPEAT',
    'REPLACE',
    'REPLICATE',
    'REVERSE',
    'RTRIM',
    'SOUNDEX',
    'SPLIT_PART',
    'STRPOS',
    'STRTOL',
    'SUBSTRING',
    'TEXTLEN',
    'TRANSLATE',
    'TRIM',
    'UPPER',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_Type_Info_Functions.html
    'decimal_precision',
    'decimal_scale',
    'is_array',
    'is_bigint',
    'is_boolean',
    'is_char',
    'is_decimal',
    'is_float',
    'is_integer',
    'is_object',
    'is_scalar',
    'is_smallint',
    'is_varchar',
    'json_typeof',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_Window_functions.html
    'AVG',
    'COUNT',
    'CUME_DIST',
    'DENSE_RANK',
    'FIRST_VALUE',
    'LAST_VALUE',
    'LAG',
    'LEAD',
    'LISTAGG',
    'MAX',
    'MEDIAN',
    'MIN',
    'NTH_VALUE',
    'NTILE',
    'PERCENT_RANK',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'RANK',
    'RATIO_TO_REPORT',
    'ROW_NUMBER',
    'STDDEV_SAMP',
    'STDDEV_POP',
    'SUM',
    'VAR_SAMP',
    'VAR_POP',
    // https://docs.aws.amazon.com/redshift/latest/dg/r_Data_type_formatting.html
    'CAST',
    'CONVERT',
    'TO_CHAR',
    'TO_DATE',
    'TO_NUMBER',
    'TEXT_TO_INT_ALT',
    'TEXT_TO_NUMERIC_ALT',
    // https://docs.aws.amazon.com/redshift/latest/dg/r_System_administration_functions.html
    'CHANGE_QUERY_PRIORITY',
    'CHANGE_SESSION_PRIORITY',
    'CHANGE_USER_PRIORITY',
    'CURRENT_SETTING',
    'PG_CANCEL_BACKEND',
    'PG_TERMINATE_BACKEND',
    'REBOOT_CLUSTER',
    'SET_CONFIG',
    // https://docs.aws.amazon.com/redshift/latest/dg/r_System_information_functions.html
    'CURRENT_AWS_ACCOUNT',
    'CURRENT_DATABASE',
    'CURRENT_NAMESPACE',
    'CURRENT_SCHEMA',
    'CURRENT_SCHEMAS',
    'CURRENT_USER',
    'CURRENT_USER_ID',
    'HAS_ASSUMEROLE_PRIVILEGE',
    'HAS_DATABASE_PRIVILEGE',
    'HAS_SCHEMA_PRIVILEGE',
    'HAS_TABLE_PRIVILEGE',
    'PG_BACKEND_PID',
    'PG_GET_COLS',
    'PG_GET_GRANTEE_BY_IAM_ROLE',
    'PG_GET_IAM_ROLE_BY_USER',
    'PG_GET_LATE_BINDING_VIEW_COLS',
    'PG_LAST_COPY_COUNT',
    'PG_LAST_COPY_ID',
    'PG_LAST_UNLOAD_ID',
    'PG_LAST_QUERY_ID',
    'PG_LAST_UNLOAD_COUNT',
    'SESSION_USER',
    'SLICE_NUM',
    'USER',
    'VERSION'
]; //# sourceMappingURL=redshift.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/redshift/redshift.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://docs.aws.amazon.com/redshift/latest/dg/r_pg_keywords.html
    'AES128',
    'AES256',
    'ALL',
    'ALLOWOVERWRITE',
    'ANY',
    'AS',
    'ASC',
    'AUTHORIZATION',
    'BACKUP',
    'BETWEEN',
    'BINARY',
    'BOTH',
    'CHECK',
    'COLUMN',
    'CONSTRAINT',
    'CREATE',
    'CROSS',
    'DEFAULT',
    'DEFERRABLE',
    'DEFLATE',
    'DEFRAG',
    'DESC',
    'DISABLE',
    'DISTINCT',
    'DO',
    'ENABLE',
    'ENCODE',
    'ENCRYPT',
    'ENCRYPTION',
    'EXPLICIT',
    'FALSE',
    'FOR',
    'FOREIGN',
    'FREEZE',
    'FROM',
    'FULL',
    'GLOBALDICT256',
    'GLOBALDICT64K',
    'GROUP',
    'IDENTITY',
    'IGNORE',
    'ILIKE',
    'IN',
    'INITIALLY',
    'INNER',
    'INTO',
    'IS',
    'ISNULL',
    'LANGUAGE',
    'LEADING',
    'LIKE',
    'LIMIT',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LUN',
    'LUNS',
    'MINUS',
    'NATURAL',
    'NEW',
    'NOT',
    'NOTNULL',
    'NULL',
    'NULLS',
    'OFF',
    'OFFLINE',
    'OFFSET',
    'OID',
    'OLD',
    'ON',
    'ONLY',
    'OPEN',
    'ORDER',
    'OUTER',
    'OVERLAPS',
    'PARALLEL',
    'PARTITION',
    'PERCENT',
    'PERMISSIONS',
    'PLACING',
    'PRIMARY',
    'RECOVER',
    'REFERENCES',
    'REJECTLOG',
    'RESORT',
    'RESPECT',
    'RESTORE',
    'SIMILAR',
    'SNAPSHOT',
    'SOME',
    'SYSTEM',
    'TABLE',
    'TAG',
    'TDES',
    'THEN',
    'TIMESTAMP',
    'TO',
    'TOP',
    'TRAILING',
    'TRUE',
    'UNIQUE',
    'USING',
    'VERBOSE',
    'WALLET',
    'WITHOUT',
    // https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-data-conversion.html
    'ACCEPTANYDATE',
    'ACCEPTINVCHARS',
    'BLANKSASNULL',
    'DATEFORMAT',
    'EMPTYASNULL',
    'ENCODING',
    'ESCAPE',
    'EXPLICIT_IDS',
    'FILLRECORD',
    'IGNOREBLANKLINES',
    'IGNOREHEADER',
    'REMOVEQUOTES',
    'ROUNDEC',
    'TIMEFORMAT',
    'TRIMBLANKS',
    'TRUNCATECOLUMNS',
    // https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-data-load.html
    'COMPROWS',
    'COMPUPDATE',
    'MAXERROR',
    'NOLOAD',
    'STATUPDATE',
    // https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-data-format.html
    'FORMAT',
    'CSV',
    'DELIMITER',
    'FIXEDWIDTH',
    'SHAPEFILE',
    'AVRO',
    'JSON',
    'PARQUET',
    'ORC',
    // https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-authorization.html
    'ACCESS_KEY_ID',
    'CREDENTIALS',
    'ENCRYPTED',
    'IAM_ROLE',
    'MASTER_SYMMETRIC_KEY',
    'SECRET_ACCESS_KEY',
    'SESSION_TOKEN',
    // https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-file-compression.html
    'BZIP2',
    'GZIP',
    'LZOP',
    'ZSTD',
    // https://docs.aws.amazon.com/redshift/latest/dg/r_COPY-alphabetical-parm-list.html
    'MANIFEST',
    'READRATIO',
    'REGION',
    'SSH',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_Compression_encodings.html
    'RAW',
    'AZ64',
    'BYTEDICT',
    'DELTA',
    'DELTA32K',
    'LZO',
    'MOSTLY8',
    'MOSTLY16',
    'MOSTLY32',
    'RUNLENGTH',
    'TEXT255',
    'TEXT32K',
    // misc
    // CREATE EXTERNAL SCHEMA (https://docs.aws.amazon.com/redshift/latest/dg/r_CREATE_EXTERNAL_SCHEMA.html)
    'CATALOG_ROLE',
    'SECRET_ARN',
    'EXTERNAL',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_choosing_dist_sort.html
    'AUTO',
    'EVEN',
    'KEY',
    'PREDICATE',
    // unknown
    'COMPRESSION'
];
const dataTypes = [
    // https://docs.aws.amazon.com/redshift/latest/dg/r_Character_types.html#r_Character_types-text-and-bpchar-types
    'ARRAY',
    'BIGINT',
    'BPCHAR',
    'CHAR',
    'CHARACTER VARYING',
    'CHARACTER',
    'DECIMAL',
    'INT',
    'INT2',
    'INT4',
    'INT8',
    'INTEGER',
    'NCHAR',
    'NUMERIC',
    'NVARCHAR',
    'SMALLINT',
    'TEXT',
    'VARBYTE',
    'VARCHAR'
]; //# sourceMappingURL=redshift.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/redshift/redshift.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "redshift",
    ()=>redshift
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/redshift/redshift.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/redshift/redshift.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'QUALIFY',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    // Data manipulation
    // - insert:
    'INSERT INTO',
    'VALUES',
    // - update:
    'SET'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [TEMPORARY | TEMP | LOCAL TEMPORARY | LOCAL TEMP] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE | MATERIALIZED] VIEW',
    // - update:
    'UPDATE',
    // - delete:
    'DELETE [FROM]',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE',
    'ALTER TABLE APPEND',
    'ADD [COLUMN]',
    'DROP [COLUMN]',
    'RENAME TO',
    'RENAME COLUMN',
    'ALTER COLUMN',
    'TYPE',
    'ENCODE',
    // - truncate:
    'TRUNCATE [TABLE]',
    // https://docs.aws.amazon.com/redshift/latest/dg/c_SQL_commands.html
    'ABORT',
    'ALTER DATABASE',
    'ALTER DATASHARE',
    'ALTER DEFAULT PRIVILEGES',
    'ALTER GROUP',
    'ALTER MATERIALIZED VIEW',
    'ALTER PROCEDURE',
    'ALTER SCHEMA',
    'ALTER USER',
    'ANALYSE',
    'ANALYZE',
    'ANALYSE COMPRESSION',
    'ANALYZE COMPRESSION',
    'BEGIN',
    'CALL',
    'CANCEL',
    'CLOSE',
    'COMMIT',
    'COPY',
    'CREATE DATABASE',
    'CREATE DATASHARE',
    'CREATE EXTERNAL FUNCTION',
    'CREATE EXTERNAL SCHEMA',
    'CREATE EXTERNAL TABLE',
    'CREATE FUNCTION',
    'CREATE GROUP',
    'CREATE LIBRARY',
    'CREATE MODEL',
    'CREATE PROCEDURE',
    'CREATE SCHEMA',
    'CREATE USER',
    'DEALLOCATE',
    'DECLARE',
    'DESC DATASHARE',
    'DROP DATABASE',
    'DROP DATASHARE',
    'DROP FUNCTION',
    'DROP GROUP',
    'DROP LIBRARY',
    'DROP MODEL',
    'DROP MATERIALIZED VIEW',
    'DROP PROCEDURE',
    'DROP SCHEMA',
    'DROP USER',
    'DROP VIEW',
    'DROP',
    'EXECUTE',
    'EXPLAIN',
    'FETCH',
    'GRANT',
    'LOCK',
    'PREPARE',
    'REFRESH MATERIALIZED VIEW',
    'RESET',
    'REVOKE',
    'ROLLBACK',
    'SELECT INTO',
    'SET SESSION AUTHORIZATION',
    'SET SESSION CHARACTERISTICS',
    'SHOW',
    'SHOW EXTERNAL TABLE',
    'SHOW MODEL',
    'SHOW DATASHARES',
    'SHOW PROCEDURE',
    'SHOW TABLE',
    'SHOW VIEW',
    'START TRANSACTION',
    'UNLOAD',
    'VACUUM'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'EXCEPT',
    'INTERSECT',
    'MINUS'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-data-conversion.html
    'NULL AS',
    // https://docs.aws.amazon.com/redshift/latest/dg/r_CREATE_EXTERNAL_SCHEMA.html
    'DATA CATALOG',
    'HIVE METASTORE',
    // in window specifications
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const redshift = {
    name: 'redshift',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        extraParens: [
            '[]'
        ],
        stringTypes: [
            "''-qq"
        ],
        identTypes: [
            `""-qq`
        ],
        identChars: {
            first: '#'
        },
        paramTypes: {
            numbered: [
                '$'
            ]
        },
        operators: [
            '^',
            '%',
            '@',
            '|/',
            '||/',
            '&',
            '|',
            // '#', conflicts with first char of identifier
            '~',
            '<<',
            '>>',
            '||',
            '::'
        ]
    },
    formatOptions: {
        alwaysDenseOperators: [
            '::'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=redshift.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/spark/spark.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://deepkb.com/CO_000013/en/kb/IMPORT-fbfa59f0-2bf1-31fe-bb7b-0f9efe9932c6/spark-sql-keywords
    'ADD',
    'AFTER',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'ANTI',
    'ANY',
    'ARCHIVE',
    'AS',
    'ASC',
    'AT',
    'AUTHORIZATION',
    'BETWEEN',
    'BOTH',
    'BUCKET',
    'BUCKETS',
    'BY',
    'CACHE',
    'CASCADE',
    'CAST',
    'CHANGE',
    'CHECK',
    'CLEAR',
    'CLUSTER',
    'CLUSTERED',
    'CODEGEN',
    'COLLATE',
    'COLLECTION',
    'COLUMN',
    'COLUMNS',
    'COMMENT',
    'COMMIT',
    'COMPACT',
    'COMPACTIONS',
    'COMPUTE',
    'CONCATENATE',
    'CONSTRAINT',
    'COST',
    'CREATE',
    'CROSS',
    'CUBE',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'DATA',
    'DATABASE',
    'DATABASES',
    'DAY',
    'DBPROPERTIES',
    'DEFINED',
    'DELETE',
    'DELIMITED',
    'DESC',
    'DESCRIBE',
    'DFS',
    'DIRECTORIES',
    'DIRECTORY',
    'DISTINCT',
    'DISTRIBUTE',
    'DIV',
    'DROP',
    'ESCAPE',
    'ESCAPED',
    'EXCEPT',
    'EXCHANGE',
    'EXISTS',
    'EXPORT',
    'EXTENDED',
    'EXTERNAL',
    'EXTRACT',
    'FALSE',
    'FETCH',
    'FIELDS',
    'FILTER',
    'FILEFORMAT',
    'FIRST',
    'FIRST_VALUE',
    'FOLLOWING',
    'FOR',
    'FOREIGN',
    'FORMAT',
    'FORMATTED',
    'FULL',
    'FUNCTION',
    'FUNCTIONS',
    'GLOBAL',
    'GRANT',
    'GROUP',
    'GROUPING',
    'HOUR',
    'IF',
    'IGNORE',
    'IMPORT',
    'IN',
    'INDEX',
    'INDEXES',
    'INNER',
    'INPATH',
    'INPUTFORMAT',
    'INTERSECT',
    'INTO',
    'IS',
    'ITEMS',
    'KEYS',
    'LAST',
    'LAST_VALUE',
    'LATERAL',
    'LAZY',
    'LEADING',
    'LEFT',
    'LIKE',
    'LINES',
    'LIST',
    'LOCAL',
    'LOCATION',
    'LOCK',
    'LOCKS',
    'LOGICAL',
    'MACRO',
    'MATCHED',
    'MERGE',
    'MINUTE',
    'MONTH',
    'MSCK',
    'NAMESPACE',
    'NAMESPACES',
    'NATURAL',
    'NO',
    'NOT',
    'NULL',
    'NULLS',
    'OF',
    'ONLY',
    'OPTION',
    'OPTIONS',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OUTPUTFORMAT',
    'OVER',
    'OVERLAPS',
    'OVERLAY',
    'OVERWRITE',
    'OWNER',
    'PARTITION',
    'PARTITIONED',
    'PARTITIONS',
    'PERCENT',
    'PLACING',
    'POSITION',
    'PRECEDING',
    'PRIMARY',
    'PRINCIPALS',
    'PROPERTIES',
    'PURGE',
    'QUERY',
    'RANGE',
    'RECORDREADER',
    'RECORDWRITER',
    'RECOVER',
    'REDUCE',
    'REFERENCES',
    'RENAME',
    'REPAIR',
    'REPLACE',
    'RESPECT',
    'RESTRICT',
    'REVOKE',
    'RIGHT',
    'RLIKE',
    'ROLE',
    'ROLES',
    'ROLLBACK',
    'ROLLUP',
    'ROW',
    'ROWS',
    'SCHEMA',
    'SECOND',
    'SELECT',
    'SEMI',
    'SEPARATED',
    'SERDE',
    'SERDEPROPERTIES',
    'SESSION_USER',
    'SETS',
    'SHOW',
    'SKEWED',
    'SOME',
    'SORT',
    'SORTED',
    'START',
    'STATISTICS',
    'STORED',
    'STRATIFY',
    'SUBSTR',
    'SUBSTRING',
    'TABLE',
    'TABLES',
    'TBLPROPERTIES',
    'TEMPORARY',
    'TERMINATED',
    'THEN',
    'TO',
    'TOUCH',
    'TRAILING',
    'TRANSACTION',
    'TRANSACTIONS',
    'TRIM',
    'TRUE',
    'TRUNCATE',
    'UNARCHIVE',
    'UNBOUNDED',
    'UNCACHE',
    'UNIQUE',
    'UNKNOWN',
    'UNLOCK',
    'UNSET',
    'USE',
    'USER',
    'USING',
    'VIEW',
    'WINDOW',
    'YEAR',
    // other
    'ANALYSE',
    'ARRAY_ZIP',
    'COALESCE',
    'CONTAINS',
    'CONVERT',
    'DAYS',
    'DAY_HOUR',
    'DAY_MINUTE',
    'DAY_SECOND',
    'DECODE',
    'DEFAULT',
    'DISTINCTROW',
    'ENCODE',
    'EXPLODE',
    'EXPLODE_OUTER',
    'FIXED',
    'GREATEST',
    'GROUP_CONCAT',
    'HOURS',
    'HOUR_MINUTE',
    'HOUR_SECOND',
    'IFNULL',
    'LEAST',
    'LEVEL',
    'MINUTE_SECOND',
    'NULLIF',
    'OFFSET',
    'ON',
    'OPTIMIZE',
    'REGEXP',
    'SEPARATOR',
    'SIZE',
    'TYPE',
    'TYPES',
    'UNSIGNED',
    'VARIABLES',
    'YEAR_MONTH'
];
const dataTypes = [
    // https://spark.apache.org/docs/latest/sql-ref-datatypes.html
    'ARRAY',
    'BIGINT',
    'BINARY',
    'BOOLEAN',
    'BYTE',
    'CHAR',
    'DATE',
    'DEC',
    'DECIMAL',
    'DOUBLE',
    'FLOAT',
    'INT',
    'INTEGER',
    'INTERVAL',
    'LONG',
    'MAP',
    'NUMERIC',
    'REAL',
    'SHORT',
    'SMALLINT',
    'STRING',
    'STRUCT',
    'TIMESTAMP_LTZ',
    'TIMESTAMP_NTZ',
    'TIMESTAMP',
    'TINYINT',
    'VARCHAR'
]; //# sourceMappingURL=spark.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/spark/spark.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // http://spark.apache.org/docs/latest/sql-ref-functions.html
    //
    // http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#aggregate-functions
    // 'ANY',
    'APPROX_COUNT_DISTINCT',
    'APPROX_PERCENTILE',
    'AVG',
    'BIT_AND',
    'BIT_OR',
    'BIT_XOR',
    'BOOL_AND',
    'BOOL_OR',
    'COLLECT_LIST',
    'COLLECT_SET',
    'CORR',
    'COUNT',
    'COUNT',
    'COUNT',
    'COUNT_IF',
    'COUNT_MIN_SKETCH',
    'COVAR_POP',
    'COVAR_SAMP',
    'EVERY',
    'FIRST',
    'FIRST_VALUE',
    'GROUPING',
    'GROUPING_ID',
    'KURTOSIS',
    'LAST',
    'LAST_VALUE',
    'MAX',
    'MAX_BY',
    'MEAN',
    'MIN',
    'MIN_BY',
    'PERCENTILE',
    'PERCENTILE',
    'PERCENTILE_APPROX',
    'SKEWNESS',
    // 'SOME',
    'STD',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'SUM',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    // http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#window-functions
    'CUME_DIST',
    'DENSE_RANK',
    'LAG',
    'LEAD',
    'NTH_VALUE',
    'NTILE',
    'PERCENT_RANK',
    'RANK',
    'ROW_NUMBER',
    // http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#array-functions
    'ARRAY',
    'ARRAY_CONTAINS',
    'ARRAY_DISTINCT',
    'ARRAY_EXCEPT',
    'ARRAY_INTERSECT',
    'ARRAY_JOIN',
    'ARRAY_MAX',
    'ARRAY_MIN',
    'ARRAY_POSITION',
    'ARRAY_REMOVE',
    'ARRAY_REPEAT',
    'ARRAY_UNION',
    'ARRAYS_OVERLAP',
    'ARRAYS_ZIP',
    'FLATTEN',
    'SEQUENCE',
    'SHUFFLE',
    'SLICE',
    'SORT_ARRAY',
    // http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#map-functions
    'ELEMENT_AT',
    'ELEMENT_AT',
    'MAP_CONCAT',
    'MAP_ENTRIES',
    'MAP_FROM_ARRAYS',
    'MAP_FROM_ENTRIES',
    'MAP_KEYS',
    'MAP_VALUES',
    'STR_TO_MAP',
    // http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#date-and-timestamp-functions
    'ADD_MONTHS',
    'CURRENT_DATE',
    'CURRENT_DATE',
    'CURRENT_TIMESTAMP',
    'CURRENT_TIMESTAMP',
    'CURRENT_TIMEZONE',
    'DATE_ADD',
    'DATE_FORMAT',
    'DATE_FROM_UNIX_DATE',
    'DATE_PART',
    'DATE_SUB',
    'DATE_TRUNC',
    'DATEDIFF',
    'DAY',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'EXTRACT',
    'FROM_UNIXTIME',
    'FROM_UTC_TIMESTAMP',
    'HOUR',
    'LAST_DAY',
    'MAKE_DATE',
    'MAKE_DT_INTERVAL',
    'MAKE_INTERVAL',
    'MAKE_TIMESTAMP',
    'MAKE_YM_INTERVAL',
    'MINUTE',
    'MONTH',
    'MONTHS_BETWEEN',
    'NEXT_DAY',
    'NOW',
    'QUARTER',
    'SECOND',
    'SESSION_WINDOW',
    'TIMESTAMP_MICROS',
    'TIMESTAMP_MILLIS',
    'TIMESTAMP_SECONDS',
    'TO_DATE',
    'TO_TIMESTAMP',
    'TO_UNIX_TIMESTAMP',
    'TO_UTC_TIMESTAMP',
    'TRUNC',
    'UNIX_DATE',
    'UNIX_MICROS',
    'UNIX_MILLIS',
    'UNIX_SECONDS',
    'UNIX_TIMESTAMP',
    'WEEKDAY',
    'WEEKOFYEAR',
    'WINDOW',
    'YEAR',
    // http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#json-functions
    'FROM_JSON',
    'GET_JSON_OBJECT',
    'JSON_ARRAY_LENGTH',
    'JSON_OBJECT_KEYS',
    'JSON_TUPLE',
    'SCHEMA_OF_JSON',
    'TO_JSON',
    // http://spark.apache.org/docs/latest/api/sql/index.html
    'ABS',
    'ACOS',
    'ACOSH',
    'AGGREGATE',
    'ARRAY_SORT',
    'ASCII',
    'ASIN',
    'ASINH',
    'ASSERT_TRUE',
    'ATAN',
    'ATAN2',
    'ATANH',
    'BASE64',
    'BIN',
    'BIT_COUNT',
    'BIT_GET',
    'BIT_LENGTH',
    'BROUND',
    'BTRIM',
    'CARDINALITY',
    'CBRT',
    'CEIL',
    'CEILING',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'CHR',
    'CONCAT',
    'CONCAT_WS',
    'CONV',
    'COS',
    'COSH',
    'COT',
    'CRC32',
    'CURRENT_CATALOG',
    'CURRENT_DATABASE',
    'CURRENT_USER',
    'DEGREES',
    // 'E',
    'ELT',
    'EXP',
    'EXPM1',
    'FACTORIAL',
    'FIND_IN_SET',
    'FLOOR',
    'FORALL',
    'FORMAT_NUMBER',
    'FORMAT_STRING',
    'FROM_CSV',
    'GETBIT',
    'HASH',
    'HEX',
    'HYPOT',
    'INITCAP',
    'INLINE',
    'INLINE_OUTER',
    'INPUT_FILE_BLOCK_LENGTH',
    'INPUT_FILE_BLOCK_START',
    'INPUT_FILE_NAME',
    'INSTR',
    'ISNAN',
    'ISNOTNULL',
    'ISNULL',
    'JAVA_METHOD',
    'LCASE',
    'LEFT',
    'LENGTH',
    'LEVENSHTEIN',
    'LN',
    'LOCATE',
    'LOG',
    'LOG10',
    'LOG1P',
    'LOG2',
    'LOWER',
    'LPAD',
    'LTRIM',
    'MAP_FILTER',
    'MAP_ZIP_WITH',
    'MD5',
    'MOD',
    'MONOTONICALLY_INCREASING_ID',
    'NAMED_STRUCT',
    'NANVL',
    'NEGATIVE',
    'NVL',
    'NVL2',
    'OCTET_LENGTH',
    'OVERLAY',
    'PARSE_URL',
    'PI',
    'PMOD',
    'POSEXPLODE',
    'POSEXPLODE_OUTER',
    'POSITION',
    'POSITIVE',
    'POW',
    'POWER',
    'PRINTF',
    'RADIANS',
    'RAISE_ERROR',
    'RAND',
    'RANDN',
    'RANDOM',
    'REFLECT',
    'REGEXP_EXTRACT',
    'REGEXP_EXTRACT_ALL',
    'REGEXP_LIKE',
    'REGEXP_REPLACE',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'RIGHT',
    'RINT',
    'ROUND',
    'RPAD',
    'RTRIM',
    'SCHEMA_OF_CSV',
    'SENTENCES',
    'SHA',
    'SHA1',
    'SHA2',
    'SHIFTLEFT',
    'SHIFTRIGHT',
    'SHIFTRIGHTUNSIGNED',
    'SIGN',
    'SIGNUM',
    'SIN',
    'SINH',
    'SOUNDEX',
    'SPACE',
    'SPARK_PARTITION_ID',
    'SPLIT',
    'SQRT',
    'STACK',
    'SUBSTR',
    'SUBSTRING',
    'SUBSTRING_INDEX',
    'TAN',
    'TANH',
    'TO_CSV',
    'TRANSFORM_KEYS',
    'TRANSFORM_VALUES',
    'TRANSLATE',
    'TRIM',
    'TRY_ADD',
    'TRY_DIVIDE',
    'TYPEOF',
    'UCASE',
    'UNBASE64',
    'UNHEX',
    'UPPER',
    'UUID',
    'VERSION',
    'WIDTH_BUCKET',
    'XPATH',
    'XPATH_BOOLEAN',
    'XPATH_DOUBLE',
    'XPATH_FLOAT',
    'XPATH_INT',
    'XPATH_LONG',
    'XPATH_NUMBER',
    'XPATH_SHORT',
    'XPATH_STRING',
    'XXHASH64',
    'ZIP_WITH',
    // cast
    'CAST',
    // Shorthand functions to use in place of CASE expression
    'COALESCE',
    'NULLIF'
]; //# sourceMappingURL=spark.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/spark/spark.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "spark",
    ()=>spark
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/spark/spark.keywords.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/spark/spark.functions.js [app-client] (ecmascript)");
;
;
;
;
// http://spark.apache.org/docs/latest/sql-ref-syntax.html
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'SORT BY',
    'CLUSTER BY',
    'DISTRIBUTE BY',
    'LIMIT',
    // Data manipulation
    // - insert:
    'INSERT [INTO | OVERWRITE] [TABLE]',
    'VALUES',
    // - insert overwrite directory:
    //   https://spark.apache.org/docs/latest/sql-ref-syntax-dml-insert-overwrite-directory.html
    'INSERT OVERWRITE [LOCAL] DIRECTORY',
    // - load:
    //   https://spark.apache.org/docs/latest/sql-ref-syntax-dml-load.html
    'LOAD DATA [LOCAL] INPATH',
    '[OVERWRITE] INTO TABLE'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [EXTERNAL] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [GLOBAL TEMPORARY | TEMPORARY] VIEW [IF NOT EXISTS]',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE',
    'ADD COLUMNS',
    'DROP {COLUMN | COLUMNS}',
    'RENAME TO',
    'RENAME COLUMN',
    'ALTER COLUMN',
    // - truncate:
    'TRUNCATE TABLE',
    // other
    'LATERAL VIEW',
    'ALTER DATABASE',
    'ALTER VIEW',
    'CREATE DATABASE',
    'CREATE FUNCTION',
    'DROP DATABASE',
    'DROP FUNCTION',
    'DROP VIEW',
    'REPAIR TABLE',
    'USE DATABASE',
    // Data Retrieval
    'TABLESAMPLE',
    'PIVOT',
    'TRANSFORM',
    'EXPLAIN',
    // Auxiliary
    'ADD FILE',
    'ADD JAR',
    'ANALYZE TABLE',
    'CACHE TABLE',
    'CLEAR CACHE',
    'DESCRIBE DATABASE',
    'DESCRIBE FUNCTION',
    'DESCRIBE QUERY',
    'DESCRIBE TABLE',
    'LIST FILE',
    'LIST JAR',
    'REFRESH',
    'REFRESH TABLE',
    'REFRESH FUNCTION',
    'RESET',
    'SHOW COLUMNS',
    'SHOW CREATE TABLE',
    'SHOW DATABASES',
    'SHOW FUNCTIONS',
    'SHOW PARTITIONS',
    'SHOW TABLE EXTENDED',
    'SHOW TABLES',
    'SHOW TBLPROPERTIES',
    'SHOW VIEWS',
    'UNCACHE TABLE'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]',
    'EXCEPT [ALL | DISTINCT]',
    'INTERSECT [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN',
    // non-standard-joins
    '[LEFT] {ANTI | SEMI} JOIN',
    'NATURAL [LEFT] {ANTI | SEMI} JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON DELETE',
    'ON UPDATE',
    'CURRENT ROW',
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const spark = {
    name: 'spark',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        supportsXor: true,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        extraParens: [
            '[]'
        ],
        stringTypes: [
            "''-bs",
            '""-bs',
            {
                quote: "''-raw",
                prefixes: [
                    'R',
                    'X'
                ],
                requirePrefix: true
            },
            {
                quote: '""-raw',
                prefixes: [
                    'R',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            '``'
        ],
        identChars: {
            allowFirstCharNumber: true
        },
        variableTypes: [
            {
                quote: '{}',
                prefixes: [
                    '$'
                ],
                requirePrefix: true
            }
        ],
        operators: [
            '%',
            '~',
            '^',
            '|',
            '&',
            '<=>',
            '==',
            '!',
            '||',
            '->'
        ],
        postProcess
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
};
function postProcess(tokens) {
    return tokens.map((token, i)=>{
        const prevToken = tokens[i - 1] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EOF_TOKEN"];
        const nextToken = tokens[i + 1] || __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EOF_TOKEN"];
        // [WINDOW](...)
        if (__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isToken"].WINDOW(token) && nextToken.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OPEN_PAREN) {
            // This is a function call, treat it as a reserved function name
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_FUNCTION_NAME
            });
        }
        // TODO: deprecate this once ITEMS is merged with COLLECTION
        if (token.text === 'ITEMS' && token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_KEYWORD) {
            if (!(prevToken.text === 'COLLECTION' && nextToken.text === 'TERMINATED')) {
                // this is a word and not COLLECTION ITEMS
                return Object.assign(Object.assign({}, token), {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER,
                    text: token.raw
                });
            }
        }
        return token;
    });
} //# sourceMappingURL=spark.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://www.sqlite.org/lang_corefunc.html
    'ABS',
    'CHANGES',
    'CHAR',
    'COALESCE',
    'FORMAT',
    'GLOB',
    'HEX',
    'IFNULL',
    'IIF',
    'INSTR',
    'LAST_INSERT_ROWID',
    'LENGTH',
    'LIKE',
    'LIKELIHOOD',
    'LIKELY',
    'LOAD_EXTENSION',
    'LOWER',
    'LTRIM',
    'NULLIF',
    'PRINTF',
    'QUOTE',
    'RANDOM',
    'RANDOMBLOB',
    'REPLACE',
    'ROUND',
    'RTRIM',
    'SIGN',
    'SOUNDEX',
    'SQLITE_COMPILEOPTION_GET',
    'SQLITE_COMPILEOPTION_USED',
    'SQLITE_OFFSET',
    'SQLITE_SOURCE_ID',
    'SQLITE_VERSION',
    'SUBSTR',
    'SUBSTRING',
    'TOTAL_CHANGES',
    'TRIM',
    'TYPEOF',
    'UNICODE',
    'UNLIKELY',
    'UPPER',
    'ZEROBLOB',
    // https://www.sqlite.org/lang_aggfunc.html
    'AVG',
    'COUNT',
    'GROUP_CONCAT',
    'MAX',
    'MIN',
    'SUM',
    'TOTAL',
    // https://www.sqlite.org/lang_datefunc.html
    'DATE',
    'TIME',
    'DATETIME',
    'JULIANDAY',
    'UNIXEPOCH',
    'STRFTIME',
    // https://www.sqlite.org/windowfunctions.html#biwinfunc
    'row_number',
    'rank',
    'dense_rank',
    'percent_rank',
    'cume_dist',
    'ntile',
    'lag',
    'lead',
    'first_value',
    'last_value',
    'nth_value',
    // https://www.sqlite.org/lang_mathfunc.html
    'ACOS',
    'ACOSH',
    'ASIN',
    'ASINH',
    'ATAN',
    'ATAN2',
    'ATANH',
    'CEIL',
    'CEILING',
    'COS',
    'COSH',
    'DEGREES',
    'EXP',
    'FLOOR',
    'LN',
    'LOG',
    'LOG',
    'LOG10',
    'LOG2',
    'MOD',
    'PI',
    'POW',
    'POWER',
    'RADIANS',
    'SIN',
    'SINH',
    'SQRT',
    'TAN',
    'TANH',
    'TRUNC',
    // https://www.sqlite.org/json1.html
    'JSON',
    'JSON_ARRAY',
    'JSON_ARRAY_LENGTH',
    'JSON_ARRAY_LENGTH',
    'JSON_EXTRACT',
    'JSON_INSERT',
    'JSON_OBJECT',
    'JSON_PATCH',
    'JSON_REMOVE',
    'JSON_REPLACE',
    'JSON_SET',
    'JSON_TYPE',
    'JSON_TYPE',
    'JSON_VALID',
    'JSON_QUOTE',
    'JSON_GROUP_ARRAY',
    'JSON_GROUP_OBJECT',
    'JSON_EACH',
    'JSON_TREE',
    // cast
    'CAST'
]; //# sourceMappingURL=sqlite.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://www.sqlite.org/lang_keywords.html
    // Note: The keywords listed on that URL are not all reserved keywords.
    // We'll need to clean up this list to only include reserved keywords.
    'ABORT',
    'ACTION',
    'ADD',
    'AFTER',
    'ALL',
    'ALTER',
    'AND',
    'ARE',
    'ALWAYS',
    'ANALYZE',
    'AS',
    'ASC',
    'ATTACH',
    'AUTOINCREMENT',
    'BEFORE',
    'BEGIN',
    'BETWEEN',
    'BY',
    'CASCADE',
    'CASE',
    'CAST',
    'CHECK',
    'COLLATE',
    'COLUMN',
    'COMMIT',
    'CONFLICT',
    'CONSTRAINT',
    'CREATE',
    'CROSS',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'DATABASE',
    'DEFAULT',
    'DEFERRABLE',
    'DEFERRED',
    'DELETE',
    'DESC',
    'DETACH',
    'DISTINCT',
    'DO',
    'DROP',
    'EACH',
    'ELSE',
    'END',
    'ESCAPE',
    'EXCEPT',
    'EXCLUDE',
    'EXCLUSIVE',
    'EXISTS',
    'EXPLAIN',
    'FAIL',
    'FILTER',
    'FIRST',
    'FOLLOWING',
    'FOR',
    'FOREIGN',
    'FROM',
    'FULL',
    'GENERATED',
    'GLOB',
    'GROUP',
    'HAVING',
    'IF',
    'IGNORE',
    'IMMEDIATE',
    'IN',
    'INDEX',
    'INDEXED',
    'INITIALLY',
    'INNER',
    'INSERT',
    'INSTEAD',
    'INTERSECT',
    'INTO',
    'IS',
    'ISNULL',
    'JOIN',
    'KEY',
    'LAST',
    'LEFT',
    'LIKE',
    'LIMIT',
    'MATCH',
    'MATERIALIZED',
    'NATURAL',
    'NO',
    'NOT',
    'NOTHING',
    'NOTNULL',
    'NULL',
    'NULLS',
    'OF',
    'OFFSET',
    'ON',
    'ONLY',
    'OPEN',
    'OR',
    'ORDER',
    'OTHERS',
    'OUTER',
    'OVER',
    'PARTITION',
    'PLAN',
    'PRAGMA',
    'PRECEDING',
    'PRIMARY',
    'QUERY',
    'RAISE',
    'RANGE',
    'RECURSIVE',
    'REFERENCES',
    'REGEXP',
    'REINDEX',
    'RELEASE',
    'RENAME',
    'REPLACE',
    'RESTRICT',
    'RETURNING',
    'RIGHT',
    'ROLLBACK',
    'ROW',
    'ROWS',
    'SAVEPOINT',
    'SELECT',
    'SET',
    'TABLE',
    'TEMP',
    'TEMPORARY',
    'THEN',
    'TIES',
    'TO',
    'TRANSACTION',
    'TRIGGER',
    'UNBOUNDED',
    'UNION',
    'UNIQUE',
    'UPDATE',
    'USING',
    'VACUUM',
    'VALUES',
    'VIEW',
    'VIRTUAL',
    'WHEN',
    'WHERE',
    'WINDOW',
    'WITH',
    'WITHOUT'
];
const dataTypes = [
    // SQLite allows any word as a data type, e.g. CREATE TABLE foo (col1 madeupname(123));
    // Here we just list some common ones as SQL Formatter
    // is only able to detect a predefined list of data types.
    // https://www.sqlite.org/stricttables.html
    // https://www.sqlite.org/datatype3.html
    'ANY',
    'ARRAY',
    'BLOB',
    'CHARACTER',
    'DECIMAL',
    'INT',
    'INTEGER',
    'NATIVE CHARACTER',
    'NCHAR',
    'NUMERIC',
    'NVARCHAR',
    'REAL',
    'TEXT',
    'VARCHAR',
    'VARYING CHARACTER'
]; //# sourceMappingURL=sqlite.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sqlite",
    ()=>sqlite
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    // Data manipulation
    // - insert:
    'INSERT [OR ABORT | OR FAIL | OR IGNORE | OR REPLACE | OR ROLLBACK] INTO',
    'REPLACE INTO',
    'VALUES',
    // - update:
    'SET',
    // other:
    'RETURNING'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [TEMPORARY | TEMP] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [TEMPORARY | TEMP] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE [OR ABORT | OR FAIL | OR IGNORE | OR REPLACE | OR ROLLBACK]',
    // - insert:
    'ON CONFLICT',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE',
    'ADD [COLUMN]',
    'DROP [COLUMN]',
    'RENAME [COLUMN]',
    'RENAME TO',
    // - set schema
    'SET SCHEMA'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'EXCEPT',
    'INTERSECT'
]);
// joins - https://www.sqlite.org/syntax/join-operator.html
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]',
    '{ROWS | RANGE | GROUPS} BETWEEN',
    'DO UPDATE'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const sqlite = {
    name: 'sqlite',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        stringTypes: [
            "''-qq",
            {
                quote: "''-raw",
                prefixes: [
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            `""-qq`,
            '``',
            '[]'
        ],
        // https://www.sqlite.org/lang_expr.html#parameters
        paramTypes: {
            positional: true,
            numbered: [
                '?'
            ],
            named: [
                ':',
                '@',
                '$'
            ]
        },
        operators: [
            '%',
            '~',
            '&',
            '|',
            '<<',
            '>>',
            '==',
            '->',
            '->>',
            '||'
        ]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=sqlite.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sql/sql.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_9_set_function_specification
    'GROUPING',
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_10_window_function
    'RANK',
    'DENSE_RANK',
    'PERCENT_RANK',
    'CUME_DIST',
    'ROW_NUMBER',
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_27_numeric_value_function
    'POSITION',
    'OCCURRENCES_REGEX',
    'POSITION_REGEX',
    'EXTRACT',
    'CHAR_LENGTH',
    'CHARACTER_LENGTH',
    'OCTET_LENGTH',
    'CARDINALITY',
    'ABS',
    'MOD',
    'LN',
    'EXP',
    'POWER',
    'SQRT',
    'FLOOR',
    'CEIL',
    'CEILING',
    'WIDTH_BUCKET',
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_29_string_value_function
    'SUBSTRING',
    'SUBSTRING_REGEX',
    'UPPER',
    'LOWER',
    'CONVERT',
    'TRANSLATE',
    'TRANSLATE_REGEX',
    'TRIM',
    'OVERLAY',
    'NORMALIZE',
    'SPECIFICTYPE',
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_31_datetime_value_function
    'CURRENT_DATE',
    'CURRENT_TIME',
    'LOCALTIME',
    'CURRENT_TIMESTAMP',
    'LOCALTIMESTAMP',
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_38_multiset_value_function
    // SET serves multiple roles: a SET() function and a SET keyword e.g. in UPDATE table SET ...
    // multiset
    // 'SET', (disabled for now)
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_10_9_aggregate_function
    'COUNT',
    'AVG',
    'MAX',
    'MIN',
    'SUM',
    // 'EVERY',
    // 'ANY',
    // 'SOME',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'VAR_SAMP',
    'VAR_POP',
    'COLLECT',
    'FUSION',
    'INTERSECTION',
    'COVAR_POP',
    'COVAR_SAMP',
    'CORR',
    'REGR_SLOPE',
    'REGR_INTERCEPT',
    'REGR_COUNT',
    'REGR_R2',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_SXX',
    'REGR_SYY',
    'REGR_SXY',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    // CAST is a pretty complex case, involving multiple forms:
    // - CAST(col AS int)
    // - CAST(...) WITH ...
    // - CAST FROM int
    // - CREATE CAST(mycol AS int) WITH ...
    'CAST',
    // Shorthand functions to use in place of CASE expression
    'COALESCE',
    'NULLIF',
    // Non-standard functions that have widespread support
    'ROUND',
    'SIN',
    'COS',
    'TAN',
    'ASIN',
    'ACOS',
    'ATAN'
]; //# sourceMappingURL=sql.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sql/sql.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#reserved-word
    'ALL',
    'ALLOCATE',
    'ALTER',
    'ANY',
    'ARE',
    'AS',
    'ASC',
    'ASENSITIVE',
    'ASYMMETRIC',
    'AT',
    'ATOMIC',
    'AUTHORIZATION',
    'BEGIN',
    'BETWEEN',
    'BOTH',
    'BY',
    'CALL',
    'CALLED',
    'CASCADED',
    'CAST',
    'CHECK',
    'CLOSE',
    'COALESCE',
    'COLLATE',
    'COLUMN',
    'COMMIT',
    'CONDITION',
    'CONNECT',
    'CONSTRAINT',
    'CORRESPONDING',
    'CREATE',
    'CROSS',
    'CUBE',
    'CURRENT',
    'CURRENT_CATALOG',
    'CURRENT_DEFAULT_TRANSFORM_GROUP',
    'CURRENT_PATH',
    'CURRENT_ROLE',
    'CURRENT_SCHEMA',
    'CURRENT_TRANSFORM_GROUP_FOR_TYPE',
    'CURRENT_USER',
    'CURSOR',
    'CYCLE',
    'DEALLOCATE',
    'DAY',
    'DECLARE',
    'DEFAULT',
    'DELETE',
    'DEREF',
    'DESC',
    'DESCRIBE',
    'DETERMINISTIC',
    'DISCONNECT',
    'DISTINCT',
    'DROP',
    'DYNAMIC',
    'EACH',
    'ELEMENT',
    'END-EXEC',
    'ESCAPE',
    'EVERY',
    'EXCEPT',
    'EXEC',
    'EXECUTE',
    'EXISTS',
    'EXTERNAL',
    'FALSE',
    'FETCH',
    'FILTER',
    'FOR',
    'FOREIGN',
    'FREE',
    'FROM',
    'FULL',
    'FUNCTION',
    'GET',
    'GLOBAL',
    'GRANT',
    'GROUP',
    'HAVING',
    'HOLD',
    'HOUR',
    'IDENTITY',
    'IN',
    'INDICATOR',
    'INNER',
    'INOUT',
    'INSENSITIVE',
    'INSERT',
    'INTERSECT',
    'INTO',
    'IS',
    'LANGUAGE',
    'LARGE',
    'LATERAL',
    'LEADING',
    'LEFT',
    'LIKE',
    'LIKE_REGEX',
    'LOCAL',
    'MATCH',
    'MEMBER',
    'MERGE',
    'METHOD',
    'MINUTE',
    'MODIFIES',
    'MODULE',
    'MONTH',
    'NATURAL',
    'NEW',
    'NO',
    'NONE',
    'NOT',
    'NULL',
    'NULLIF',
    'OF',
    'OLD',
    'ON',
    'ONLY',
    'OPEN',
    'ORDER',
    'OUT',
    'OUTER',
    'OVER',
    'OVERLAPS',
    'PARAMETER',
    'PARTITION',
    'PRECISION',
    'PREPARE',
    'PRIMARY',
    'PROCEDURE',
    'RANGE',
    'READS',
    'REAL',
    'RECURSIVE',
    'REF',
    'REFERENCES',
    'REFERENCING',
    'RELEASE',
    'RESULT',
    'RETURN',
    'RETURNS',
    'REVOKE',
    'RIGHT',
    'ROLLBACK',
    'ROLLUP',
    'ROW',
    'ROWS',
    'SAVEPOINT',
    'SCOPE',
    'SCROLL',
    'SEARCH',
    'SECOND',
    'SELECT',
    'SENSITIVE',
    'SESSION_USER',
    'SET',
    'SIMILAR',
    'SOME',
    'SPECIFIC',
    'SQL',
    'SQLEXCEPTION',
    'SQLSTATE',
    'SQLWARNING',
    'START',
    'STATIC',
    'SUBMULTISET',
    'SYMMETRIC',
    'SYSTEM',
    'SYSTEM_USER',
    'TABLE',
    'TABLESAMPLE',
    'THEN',
    'TIMEZONE_HOUR',
    'TIMEZONE_MINUTE',
    'TO',
    'TRAILING',
    'TRANSLATION',
    'TREAT',
    'TRIGGER',
    'TRUE',
    'UESCAPE',
    'UNION',
    'UNIQUE',
    'UNKNOWN',
    'UNNEST',
    'UPDATE',
    'USER',
    'USING',
    'VALUE',
    'VALUES',
    'WHENEVER',
    'WINDOW',
    'WITHIN',
    'WITHOUT',
    'YEAR'
];
const dataTypes = [
    // https://jakewheat.github.io/sql-overview/sql-2008-foundation-grammar.html#_6_1_data_type
    'ARRAY',
    'BIGINT',
    'BINARY LARGE OBJECT',
    'BINARY VARYING',
    'BINARY',
    'BLOB',
    'BOOLEAN',
    'CHAR LARGE OBJECT',
    'CHAR VARYING',
    'CHAR',
    'CHARACTER LARGE OBJECT',
    'CHARACTER VARYING',
    'CHARACTER',
    'CLOB',
    'DATE',
    'DEC',
    'DECIMAL',
    'DOUBLE',
    'FLOAT',
    'INT',
    'INTEGER',
    'INTERVAL',
    'MULTISET',
    'NATIONAL CHAR VARYING',
    'NATIONAL CHAR',
    'NATIONAL CHARACTER LARGE OBJECT',
    'NATIONAL CHARACTER VARYING',
    'NATIONAL CHARACTER',
    'NCHAR LARGE OBJECT',
    'NCHAR VARYING',
    'NCHAR',
    'NCLOB',
    'NUMERIC',
    'SMALLINT',
    'TIME',
    'TIMESTAMP',
    'VARBINARY',
    'VARCHAR'
]; //# sourceMappingURL=sql.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sql/sql.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sql",
    ()=>sql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sql/sql.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sql/sql.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY [ALL | DISTINCT]',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    // Data manipulation
    // - insert:
    'INSERT INTO',
    'VALUES',
    // - update:
    'SET'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [GLOBAL TEMPORARY | LOCAL TEMPORARY] TABLE'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [RECURSIVE] VIEW',
    // - update:
    'UPDATE',
    'WHERE CURRENT OF',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE',
    // - alter table:
    'ALTER TABLE',
    'ADD COLUMN',
    'DROP [COLUMN]',
    'RENAME COLUMN',
    'RENAME TO',
    'ALTER [COLUMN]',
    '{SET | DROP} DEFAULT',
    'ADD SCOPE',
    'DROP SCOPE {CASCADE | RESTRICT}',
    'RESTART WITH',
    // - truncate:
    'TRUNCATE TABLE',
    // other
    'SET SCHEMA'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]',
    'EXCEPT [ALL | DISTINCT]',
    'INTERSECT [ALL | DISTINCT]'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]',
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const sql = {
    name: 'sql',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        stringTypes: [
            {
                quote: "''-qq-bs",
                prefixes: [
                    'N',
                    'U&'
                ]
            },
            {
                quote: "''-raw",
                prefixes: [
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            `""-qq`,
            '``'
        ],
        paramTypes: {
            positional: true
        },
        operators: [
            '||'
        ]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=sql.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/trino/trino.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://github.com/trinodb/trino/tree/432d2897bdef99388c1a47188743a061c4ac1f34/docs/src/main/sphinx/functions
    // rg '^\.\. function::' ./docs/src/main/sphinx/functions | cut -d' ' -f 3 | cut -d '(' -f 1 | sort | uniq
    // rg '\* ' ./docs/src/main/sphinx/functions/list-by-topic.rst | grep    '\* :func:' | cut -d'`' -f 2
    // rg '\* ' ./docs/src/main/sphinx/functions/list-by-topic.rst | grep -v '\* :func:'
    // grep -e '^- ' ./docs/src/main/sphinx/functions/list.rst | grep  -e '^- :func:' | cut -d'`' -f2
    // grep -e '^- ' ./docs/src/main/sphinx/functions/list.rst | grep -ve '^- :func:'
    'ABS',
    'ACOS',
    'ALL_MATCH',
    'ANY_MATCH',
    'APPROX_DISTINCT',
    'APPROX_MOST_FREQUENT',
    'APPROX_PERCENTILE',
    'APPROX_SET',
    'ARBITRARY',
    'ARRAYS_OVERLAP',
    'ARRAY_AGG',
    'ARRAY_DISTINCT',
    'ARRAY_EXCEPT',
    'ARRAY_INTERSECT',
    'ARRAY_JOIN',
    'ARRAY_MAX',
    'ARRAY_MIN',
    'ARRAY_POSITION',
    'ARRAY_REMOVE',
    'ARRAY_SORT',
    'ARRAY_UNION',
    'ASIN',
    'ATAN',
    'ATAN2',
    'AT_TIMEZONE',
    'AVG',
    'BAR',
    'BETA_CDF',
    'BING_TILE',
    'BING_TILES_AROUND',
    'BING_TILE_AT',
    'BING_TILE_COORDINATES',
    'BING_TILE_POLYGON',
    'BING_TILE_QUADKEY',
    'BING_TILE_ZOOM_LEVEL',
    'BITWISE_AND',
    'BITWISE_AND_AGG',
    'BITWISE_LEFT_SHIFT',
    'BITWISE_NOT',
    'BITWISE_OR',
    'BITWISE_OR_AGG',
    'BITWISE_RIGHT_SHIFT',
    'BITWISE_RIGHT_SHIFT_ARITHMETIC',
    'BITWISE_XOR',
    'BIT_COUNT',
    'BOOL_AND',
    'BOOL_OR',
    'CARDINALITY',
    'CAST',
    'CBRT',
    'CEIL',
    'CEILING',
    'CHAR2HEXINT',
    'CHECKSUM',
    'CHR',
    'CLASSIFY',
    'COALESCE',
    'CODEPOINT',
    'COLOR',
    'COMBINATIONS',
    'CONCAT',
    'CONCAT_WS',
    'CONTAINS',
    'CONTAINS_SEQUENCE',
    'CONVEX_HULL_AGG',
    'CORR',
    'COS',
    'COSH',
    'COSINE_SIMILARITY',
    'COUNT',
    'COUNT_IF',
    'COVAR_POP',
    'COVAR_SAMP',
    'CRC32',
    'CUME_DIST',
    'CURRENT_CATALOG',
    'CURRENT_DATE',
    'CURRENT_GROUPS',
    'CURRENT_SCHEMA',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_TIMEZONE',
    'CURRENT_USER',
    'DATE',
    'DATE_ADD',
    'DATE_DIFF',
    'DATE_FORMAT',
    'DATE_PARSE',
    'DATE_TRUNC',
    'DAY',
    'DAY_OF_MONTH',
    'DAY_OF_WEEK',
    'DAY_OF_YEAR',
    'DEGREES',
    'DENSE_RANK',
    'DOW',
    'DOY',
    'E',
    'ELEMENT_AT',
    'EMPTY_APPROX_SET',
    'EVALUATE_CLASSIFIER_PREDICTIONS',
    'EVERY',
    'EXP',
    'EXTRACT',
    'FEATURES',
    'FILTER',
    'FIRST_VALUE',
    'FLATTEN',
    'FLOOR',
    'FORMAT',
    'FORMAT_DATETIME',
    'FORMAT_NUMBER',
    'FROM_BASE',
    'FROM_BASE32',
    'FROM_BASE64',
    'FROM_BASE64URL',
    'FROM_BIG_ENDIAN_32',
    'FROM_BIG_ENDIAN_64',
    'FROM_ENCODED_POLYLINE',
    'FROM_GEOJSON_GEOMETRY',
    'FROM_HEX',
    'FROM_IEEE754_32',
    'FROM_IEEE754_64',
    'FROM_ISO8601_DATE',
    'FROM_ISO8601_TIMESTAMP',
    'FROM_ISO8601_TIMESTAMP_NANOS',
    'FROM_UNIXTIME',
    'FROM_UNIXTIME_NANOS',
    'FROM_UTF8',
    'GEOMETRIC_MEAN',
    'GEOMETRY_FROM_HADOOP_SHAPE',
    'GEOMETRY_INVALID_REASON',
    'GEOMETRY_NEAREST_POINTS',
    'GEOMETRY_TO_BING_TILES',
    'GEOMETRY_UNION',
    'GEOMETRY_UNION_AGG',
    'GREATEST',
    'GREAT_CIRCLE_DISTANCE',
    'HAMMING_DISTANCE',
    'HASH_COUNTS',
    'HISTOGRAM',
    'HMAC_MD5',
    'HMAC_SHA1',
    'HMAC_SHA256',
    'HMAC_SHA512',
    'HOUR',
    'HUMAN_READABLE_SECONDS',
    'IF',
    'INDEX',
    'INFINITY',
    'INTERSECTION_CARDINALITY',
    'INVERSE_BETA_CDF',
    'INVERSE_NORMAL_CDF',
    'IS_FINITE',
    'IS_INFINITE',
    'IS_JSON_SCALAR',
    'IS_NAN',
    'JACCARD_INDEX',
    'JSON_ARRAY_CONTAINS',
    'JSON_ARRAY_GET',
    'JSON_ARRAY_LENGTH',
    'JSON_EXISTS',
    'JSON_EXTRACT',
    'JSON_EXTRACT_SCALAR',
    'JSON_FORMAT',
    'JSON_PARSE',
    'JSON_QUERY',
    'JSON_SIZE',
    'JSON_VALUE',
    'KURTOSIS',
    'LAG',
    'LAST_DAY_OF_MONTH',
    'LAST_VALUE',
    'LEAD',
    'LEARN_CLASSIFIER',
    'LEARN_LIBSVM_CLASSIFIER',
    'LEARN_LIBSVM_REGRESSOR',
    'LEARN_REGRESSOR',
    'LEAST',
    'LENGTH',
    'LEVENSHTEIN_DISTANCE',
    'LINE_INTERPOLATE_POINT',
    'LINE_INTERPOLATE_POINTS',
    'LINE_LOCATE_POINT',
    'LISTAGG',
    'LN',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOG',
    'LOG10',
    'LOG2',
    'LOWER',
    'LPAD',
    'LTRIM',
    'LUHN_CHECK',
    'MAKE_SET_DIGEST',
    'MAP',
    'MAP_AGG',
    'MAP_CONCAT',
    'MAP_ENTRIES',
    'MAP_FILTER',
    'MAP_FROM_ENTRIES',
    'MAP_KEYS',
    'MAP_UNION',
    'MAP_VALUES',
    'MAP_ZIP_WITH',
    'MAX',
    'MAX_BY',
    'MD5',
    'MERGE',
    'MERGE_SET_DIGEST',
    'MILLISECOND',
    'MIN',
    'MINUTE',
    'MIN_BY',
    'MOD',
    'MONTH',
    'MULTIMAP_AGG',
    'MULTIMAP_FROM_ENTRIES',
    'MURMUR3',
    'NAN',
    'NGRAMS',
    'NONE_MATCH',
    'NORMALIZE',
    'NORMAL_CDF',
    'NOW',
    'NTH_VALUE',
    'NTILE',
    'NULLIF',
    'NUMERIC_HISTOGRAM',
    'OBJECTID',
    'OBJECTID_TIMESTAMP',
    'PARSE_DATA_SIZE',
    'PARSE_DATETIME',
    'PARSE_DURATION',
    'PERCENT_RANK',
    'PI',
    'POSITION',
    'POW',
    'POWER',
    'QDIGEST_AGG',
    'QUARTER',
    'RADIANS',
    'RAND',
    'RANDOM',
    'RANK',
    'REDUCE',
    'REDUCE_AGG',
    'REGEXP_COUNT',
    'REGEXP_EXTRACT',
    'REGEXP_EXTRACT_ALL',
    'REGEXP_LIKE',
    'REGEXP_POSITION',
    'REGEXP_REPLACE',
    'REGEXP_SPLIT',
    'REGRESS',
    'REGR_INTERCEPT',
    'REGR_SLOPE',
    'RENDER',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'RGB',
    'ROUND',
    'ROW_NUMBER',
    'RPAD',
    'RTRIM',
    'SECOND',
    'SEQUENCE',
    'SHA1',
    'SHA256',
    'SHA512',
    'SHUFFLE',
    'SIGN',
    'SIMPLIFY_GEOMETRY',
    'SIN',
    'SKEWNESS',
    'SLICE',
    'SOUNDEX',
    'SPATIAL_PARTITIONING',
    'SPATIAL_PARTITIONS',
    'SPLIT',
    'SPLIT_PART',
    'SPLIT_TO_MAP',
    'SPLIT_TO_MULTIMAP',
    'SPOOKY_HASH_V2_32',
    'SPOOKY_HASH_V2_64',
    'SQRT',
    'STARTS_WITH',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STRPOS',
    'ST_AREA',
    'ST_ASBINARY',
    'ST_ASTEXT',
    'ST_BOUNDARY',
    'ST_BUFFER',
    'ST_CENTROID',
    'ST_CONTAINS',
    'ST_CONVEXHULL',
    'ST_COORDDIM',
    'ST_CROSSES',
    'ST_DIFFERENCE',
    'ST_DIMENSION',
    'ST_DISJOINT',
    'ST_DISTANCE',
    'ST_ENDPOINT',
    'ST_ENVELOPE',
    'ST_ENVELOPEASPTS',
    'ST_EQUALS',
    'ST_EXTERIORRING',
    'ST_GEOMETRIES',
    'ST_GEOMETRYFROMTEXT',
    'ST_GEOMETRYN',
    'ST_GEOMETRYTYPE',
    'ST_GEOMFROMBINARY',
    'ST_INTERIORRINGN',
    'ST_INTERIORRINGS',
    'ST_INTERSECTION',
    'ST_INTERSECTS',
    'ST_ISCLOSED',
    'ST_ISEMPTY',
    'ST_ISRING',
    'ST_ISSIMPLE',
    'ST_ISVALID',
    'ST_LENGTH',
    'ST_LINEFROMTEXT',
    'ST_LINESTRING',
    'ST_MULTIPOINT',
    'ST_NUMGEOMETRIES',
    'ST_NUMINTERIORRING',
    'ST_NUMPOINTS',
    'ST_OVERLAPS',
    'ST_POINT',
    'ST_POINTN',
    'ST_POINTS',
    'ST_POLYGON',
    'ST_RELATE',
    'ST_STARTPOINT',
    'ST_SYMDIFFERENCE',
    'ST_TOUCHES',
    'ST_UNION',
    'ST_WITHIN',
    'ST_X',
    'ST_XMAX',
    'ST_XMIN',
    'ST_Y',
    'ST_YMAX',
    'ST_YMIN',
    'SUBSTR',
    'SUBSTRING',
    'SUM',
    'TAN',
    'TANH',
    'TDIGEST_AGG',
    'TIMESTAMP_OBJECTID',
    'TIMEZONE_HOUR',
    'TIMEZONE_MINUTE',
    'TO_BASE',
    'TO_BASE32',
    'TO_BASE64',
    'TO_BASE64URL',
    'TO_BIG_ENDIAN_32',
    'TO_BIG_ENDIAN_64',
    'TO_CHAR',
    'TO_DATE',
    'TO_ENCODED_POLYLINE',
    'TO_GEOJSON_GEOMETRY',
    'TO_GEOMETRY',
    'TO_HEX',
    'TO_IEEE754_32',
    'TO_IEEE754_64',
    'TO_ISO8601',
    'TO_MILLISECONDS',
    'TO_SPHERICAL_GEOGRAPHY',
    'TO_TIMESTAMP',
    'TO_UNIXTIME',
    'TO_UTF8',
    'TRANSFORM',
    'TRANSFORM_KEYS',
    'TRANSFORM_VALUES',
    'TRANSLATE',
    'TRIM',
    'TRIM_ARRAY',
    'TRUNCATE',
    'TRY',
    'TRY_CAST',
    'TYPEOF',
    'UPPER',
    'URL_DECODE',
    'URL_ENCODE',
    'URL_EXTRACT_FRAGMENT',
    'URL_EXTRACT_HOST',
    'URL_EXTRACT_PARAMETER',
    'URL_EXTRACT_PATH',
    'URL_EXTRACT_PORT',
    'URL_EXTRACT_PROTOCOL',
    'URL_EXTRACT_QUERY',
    'UUID',
    'VALUES_AT_QUANTILES',
    'VALUE_AT_QUANTILE',
    'VARIANCE',
    'VAR_POP',
    'VAR_SAMP',
    'VERSION',
    'WEEK',
    'WEEK_OF_YEAR',
    'WIDTH_BUCKET',
    'WILSON_INTERVAL_LOWER',
    'WILSON_INTERVAL_UPPER',
    'WITH_TIMEZONE',
    'WORD_STEM',
    'XXHASH64',
    'YEAR',
    'YEAR_OF_WEEK',
    'YOW',
    'ZIP',
    'ZIP_WITH',
    // https://trino.io/docs/current/sql/match-recognize.html#row-pattern-recognition-expressions
    'CLASSIFIER',
    'FIRST',
    'LAST',
    'MATCH_NUMBER',
    'NEXT',
    'PERMUTE',
    'PREV'
]; //# sourceMappingURL=trino.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/trino/trino.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://github.com/trinodb/trino/blob/432d2897bdef99388c1a47188743a061c4ac1f34/core/trino-parser/src/main/antlr4/io/trino/sql/parser/SqlBase.g4#L858-L1128
    'ABSENT',
    'ADD',
    'ADMIN',
    'AFTER',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'ANY',
    'AS',
    'ASC',
    'AT',
    'AUTHORIZATION',
    'BERNOULLI',
    'BETWEEN',
    'BOTH',
    'BY',
    'CALL',
    'CASCADE',
    'CASE',
    'CATALOGS',
    'COLUMN',
    'COLUMNS',
    'COMMENT',
    'COMMIT',
    'COMMITTED',
    'CONDITIONAL',
    'CONSTRAINT',
    'COPARTITION',
    'CREATE',
    'CROSS',
    'CUBE',
    'CURRENT',
    'CURRENT_PATH',
    'CURRENT_ROLE',
    'DATA',
    'DEALLOCATE',
    'DEFAULT',
    'DEFINE',
    'DEFINER',
    'DELETE',
    'DENY',
    'DESC',
    'DESCRIBE',
    'DESCRIPTOR',
    'DISTINCT',
    'DISTRIBUTED',
    'DOUBLE',
    'DROP',
    'ELSE',
    'EMPTY',
    'ENCODING',
    'END',
    'ERROR',
    'ESCAPE',
    'EXCEPT',
    'EXCLUDING',
    'EXECUTE',
    'EXISTS',
    'EXPLAIN',
    'FALSE',
    'FETCH',
    'FINAL',
    'FIRST',
    'FOLLOWING',
    'FOR',
    'FROM',
    'FULL',
    'FUNCTIONS',
    'GRANT',
    'GRANTED',
    'GRANTS',
    'GRAPHVIZ',
    'GROUP',
    'GROUPING',
    'GROUPS',
    'HAVING',
    'IGNORE',
    'IN',
    'INCLUDING',
    'INITIAL',
    'INNER',
    'INPUT',
    'INSERT',
    'INTERSECT',
    'INTERVAL',
    'INTO',
    'INVOKER',
    'IO',
    'IS',
    'ISOLATION',
    'JOIN',
    'JSON',
    'JSON_ARRAY',
    'JSON_OBJECT',
    'KEEP',
    'KEY',
    'KEYS',
    'LAST',
    'LATERAL',
    'LEADING',
    'LEFT',
    'LEVEL',
    'LIKE',
    'LIMIT',
    'LOCAL',
    'LOGICAL',
    'MATCH',
    'MATCHED',
    'MATCHES',
    'MATCH_RECOGNIZE',
    'MATERIALIZED',
    'MEASURES',
    'NATURAL',
    'NEXT',
    'NFC',
    'NFD',
    'NFKC',
    'NFKD',
    'NO',
    'NONE',
    'NOT',
    'NULL',
    'NULLS',
    'OBJECT',
    'OF',
    'OFFSET',
    'OMIT',
    'ON',
    'ONE',
    'ONLY',
    'OPTION',
    'OR',
    'ORDER',
    'ORDINALITY',
    'OUTER',
    'OUTPUT',
    'OVER',
    'OVERFLOW',
    'PARTITION',
    'PARTITIONS',
    'PASSING',
    'PAST',
    'PATH',
    'PATTERN',
    'PER',
    'PERMUTE',
    'PRECEDING',
    'PRECISION',
    'PREPARE',
    'PRIVILEGES',
    'PROPERTIES',
    'PRUNE',
    'QUOTES',
    'RANGE',
    'READ',
    'RECURSIVE',
    'REFRESH',
    'RENAME',
    'REPEATABLE',
    'RESET',
    'RESPECT',
    'RESTRICT',
    'RETURNING',
    'REVOKE',
    'RIGHT',
    'ROLE',
    'ROLES',
    'ROLLBACK',
    'ROLLUP',
    'ROW',
    'ROWS',
    'RUNNING',
    'SCALAR',
    'SCHEMA',
    'SCHEMAS',
    'SECURITY',
    'SEEK',
    'SELECT',
    'SERIALIZABLE',
    'SESSION',
    'SET',
    'SETS',
    'SHOW',
    'SKIP',
    'SOME',
    'START',
    'STATS',
    'STRING',
    'SUBSET',
    'SYSTEM',
    'TABLE',
    'TABLES',
    'TABLESAMPLE',
    'TEXT',
    'THEN',
    'TIES',
    'TIME',
    'TIMESTAMP',
    'TO',
    'TRAILING',
    'TRANSACTION',
    'TRUE',
    'TYPE',
    'UESCAPE',
    'UNBOUNDED',
    'UNCOMMITTED',
    'UNCONDITIONAL',
    'UNION',
    'UNIQUE',
    'UNKNOWN',
    'UNMATCHED',
    'UNNEST',
    'UPDATE',
    'USE',
    'USER',
    'USING',
    'UTF16',
    'UTF32',
    'UTF8',
    'VALIDATE',
    'VALUE',
    'VALUES',
    'VERBOSE',
    'VIEW',
    'WHEN',
    'WHERE',
    'WINDOW',
    'WITH',
    'WITHIN',
    'WITHOUT',
    'WORK',
    'WRAPPER',
    'WRITE',
    'ZONE'
];
const dataTypes = [
    // https://github.com/trinodb/trino/blob/432d2897bdef99388c1a47188743a061c4ac1f34/core/trino-main/src/main/java/io/trino/metadata/TypeRegistry.java#L131-L168
    // or https://trino.io/docs/current/language/types.html
    'BIGINT',
    'INT',
    'INTEGER',
    'SMALLINT',
    'TINYINT',
    'BOOLEAN',
    'DATE',
    'DECIMAL',
    'REAL',
    'DOUBLE',
    'HYPERLOGLOG',
    'QDIGEST',
    'TDIGEST',
    'P4HYPERLOGLOG',
    'INTERVAL',
    'TIMESTAMP',
    'TIME',
    'VARBINARY',
    'VARCHAR',
    'CHAR',
    'ROW',
    'ARRAY',
    'MAP',
    'JSON',
    'JSON2016',
    'IPADDRESS',
    'GEOMETRY',
    'UUID',
    'SETDIGEST',
    'JONIREGEXP',
    'RE2JREGEXP',
    'LIKEPATTERN',
    'COLOR',
    'CODEPOINTS',
    'FUNCTION',
    'JSONPATH'
]; //# sourceMappingURL=trino.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/trino/trino.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "trino",
    ()=>trino
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/trino/trino.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/trino/trino.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
// https://github.com/trinodb/trino/blob/432d2897bdef99388c1a47188743a061c4ac1f34/core/trino-parser/src/main/antlr4/io/trino/sql/parser/SqlBase.g4#L41
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY [ALL | DISTINCT]',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    // Data manipulation
    // - insert:
    'INSERT INTO',
    'VALUES',
    // - update:
    'SET',
    // MATCH_RECOGNIZE
    'MATCH_RECOGNIZE',
    'MEASURES',
    'ONE ROW PER MATCH',
    'ALL ROWS PER MATCH',
    'AFTER MATCH',
    'PATTERN',
    'SUBSET',
    'DEFINE'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [MATERIALIZED] VIEW',
    // - update:
    'UPDATE',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE [IF EXISTS]',
    'ADD COLUMN [IF NOT EXISTS]',
    'DROP COLUMN [IF EXISTS]',
    'RENAME COLUMN [IF EXISTS]',
    'RENAME TO',
    'SET AUTHORIZATION [USER | ROLE]',
    'SET PROPERTIES',
    'EXECUTE',
    // - truncate:
    'TRUNCATE TABLE',
    // other
    'ALTER SCHEMA',
    'ALTER MATERIALIZED VIEW',
    'ALTER VIEW',
    'CREATE SCHEMA',
    'CREATE ROLE',
    'DROP SCHEMA',
    'DROP MATERIALIZED VIEW',
    'DROP VIEW',
    'DROP ROLE',
    // Auxiliary
    'EXPLAIN',
    'ANALYZE',
    'EXPLAIN ANALYZE',
    'EXPLAIN ANALYZE VERBOSE',
    'USE',
    'DESCRIBE INPUT',
    'DESCRIBE OUTPUT',
    'REFRESH MATERIALIZED VIEW',
    'RESET SESSION',
    'SET SESSION',
    'SET PATH',
    'SET TIME ZONE',
    'SHOW GRANTS',
    'SHOW CREATE TABLE',
    'SHOW CREATE SCHEMA',
    'SHOW CREATE VIEW',
    'SHOW CREATE MATERIALIZED VIEW',
    'SHOW TABLES',
    'SHOW SCHEMAS',
    'SHOW CATALOGS',
    'SHOW COLUMNS',
    'SHOW STATS FOR',
    'SHOW ROLES',
    'SHOW CURRENT ROLES',
    'SHOW ROLE GRANTS',
    'SHOW FUNCTIONS',
    'SHOW SESSION'
]);
// https://github.com/trinodb/trino/blob/432d2897bdef99388c1a47188743a061c4ac1f34/core/trino-parser/src/main/antlr4/io/trino/sql/parser/SqlBase.g4#L231-L235
// https://github.com/trinodb/trino/blob/432d2897bdef99388c1a47188743a061c4ac1f34/core/trino-parser/src/main/antlr4/io/trino/sql/parser/SqlBase.g4#L288-L291
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]',
    'EXCEPT [ALL | DISTINCT]',
    'INTERSECT [ALL | DISTINCT]'
]);
// https://github.com/trinodb/trino/blob/432d2897bdef99388c1a47188743a061c4ac1f34/core/trino-parser/src/main/antlr4/io/trino/sql/parser/SqlBase.g4#L299-L313
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL [INNER] JOIN',
    'NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    '{ROWS | RANGE | GROUPS} BETWEEN',
    // comparison operator
    'IS [NOT] DISTINCT FROM'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const trino = {
    name: 'trino',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        // Trino also supports {- ... -} parenthesis.
        // The formatting of these currently works out as a result of { and -
        // not getting a space added in-between.
        // https://trino.io/docs/current/sql/match-recognize.html#row-pattern-syntax
        extraParens: [
            '[]',
            '{}'
        ],
        // https://trino.io/docs/current/language/types.html#string
        // https://trino.io/docs/current/language/types.html#varbinary
        stringTypes: [
            {
                quote: "''-qq",
                prefixes: [
                    'U&'
                ]
            },
            {
                quote: "''-raw",
                prefixes: [
                    'X'
                ],
                requirePrefix: true
            }
        ],
        // https://trino.io/docs/current/language/reserved.html
        identTypes: [
            '""-qq'
        ],
        paramTypes: {
            positional: true
        },
        operators: [
            '%',
            '->',
            '=>',
            ':',
            '||',
            // Row pattern syntax
            '|',
            '^',
            '$'
        ]
    },
    formatOptions: {
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=trino.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/transactsql/transactsql.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.microsoft.com/en-us/sql/t-sql/functions/functions?view=sql-server-ver15
    // aggregate
    'APPROX_COUNT_DISTINCT',
    'AVG',
    'CHECKSUM_AGG',
    'COUNT',
    'COUNT_BIG',
    'GROUPING',
    'GROUPING_ID',
    'MAX',
    'MIN',
    'STDEV',
    'STDEVP',
    'SUM',
    'VAR',
    'VARP',
    // analytic
    'CUME_DIST',
    'FIRST_VALUE',
    'LAG',
    'LAST_VALUE',
    'LEAD',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PERCENT_RANK',
    'Collation - COLLATIONPROPERTY',
    'Collation - TERTIARY_WEIGHTS',
    // configuration
    '@@DBTS',
    '@@LANGID',
    '@@LANGUAGE',
    '@@LOCK_TIMEOUT',
    '@@MAX_CONNECTIONS',
    '@@MAX_PRECISION',
    '@@NESTLEVEL',
    '@@OPTIONS',
    '@@REMSERVER',
    '@@SERVERNAME',
    '@@SERVICENAME',
    '@@SPID',
    '@@TEXTSIZE',
    '@@VERSION',
    // conversion
    'CAST',
    'CONVERT',
    'PARSE',
    'TRY_CAST',
    'TRY_CONVERT',
    'TRY_PARSE',
    // cryptographic
    'ASYMKEY_ID',
    'ASYMKEYPROPERTY',
    'CERTPROPERTY',
    'CERT_ID',
    'CRYPT_GEN_RANDOM',
    'DECRYPTBYASYMKEY',
    'DECRYPTBYCERT',
    'DECRYPTBYKEY',
    'DECRYPTBYKEYAUTOASYMKEY',
    'DECRYPTBYKEYAUTOCERT',
    'DECRYPTBYPASSPHRASE',
    'ENCRYPTBYASYMKEY',
    'ENCRYPTBYCERT',
    'ENCRYPTBYKEY',
    'ENCRYPTBYPASSPHRASE',
    'HASHBYTES',
    'IS_OBJECTSIGNED',
    'KEY_GUID',
    'KEY_ID',
    'KEY_NAME',
    'SIGNBYASYMKEY',
    'SIGNBYCERT',
    'SYMKEYPROPERTY',
    'VERIFYSIGNEDBYCERT',
    'VERIFYSIGNEDBYASYMKEY',
    // cursor
    '@@CURSOR_ROWS',
    '@@FETCH_STATUS',
    'CURSOR_STATUS',
    // dataType
    'DATALENGTH',
    'IDENT_CURRENT',
    'IDENT_INCR',
    'IDENT_SEED',
    'IDENTITY',
    'SQL_VARIANT_PROPERTY',
    // datetime
    '@@DATEFIRST',
    'CURRENT_TIMESTAMP',
    'CURRENT_TIMEZONE',
    'CURRENT_TIMEZONE_ID',
    'DATEADD',
    'DATEDIFF',
    'DATEDIFF_BIG',
    'DATEFROMPARTS',
    'DATENAME',
    'DATEPART',
    'DATETIME2FROMPARTS',
    'DATETIMEFROMPARTS',
    'DATETIMEOFFSETFROMPARTS',
    'DAY',
    'EOMONTH',
    'GETDATE',
    'GETUTCDATE',
    'ISDATE',
    'MONTH',
    'SMALLDATETIMEFROMPARTS',
    'SWITCHOFFSET',
    'SYSDATETIME',
    'SYSDATETIMEOFFSET',
    'SYSUTCDATETIME',
    'TIMEFROMPARTS',
    'TODATETIMEOFFSET',
    'YEAR',
    'JSON',
    'ISJSON',
    'JSON_VALUE',
    'JSON_QUERY',
    'JSON_MODIFY',
    // mathematical
    'ABS',
    'ACOS',
    'ASIN',
    'ATAN',
    'ATN2',
    'CEILING',
    'COS',
    'COT',
    'DEGREES',
    'EXP',
    'FLOOR',
    'LOG',
    'LOG10',
    'PI',
    'POWER',
    'RADIANS',
    'RAND',
    'ROUND',
    'SIGN',
    'SIN',
    'SQRT',
    'SQUARE',
    'TAN',
    'CHOOSE',
    'GREATEST',
    'IIF',
    'LEAST',
    // metadata
    '@@PROCID',
    'APP_NAME',
    'APPLOCK_MODE',
    'APPLOCK_TEST',
    'ASSEMBLYPROPERTY',
    'COL_LENGTH',
    'COL_NAME',
    'COLUMNPROPERTY',
    'DATABASEPROPERTYEX',
    'DB_ID',
    'DB_NAME',
    'FILE_ID',
    'FILE_IDEX',
    'FILE_NAME',
    'FILEGROUP_ID',
    'FILEGROUP_NAME',
    'FILEGROUPPROPERTY',
    'FILEPROPERTY',
    'FILEPROPERTYEX',
    'FULLTEXTCATALOGPROPERTY',
    'FULLTEXTSERVICEPROPERTY',
    'INDEX_COL',
    'INDEXKEY_PROPERTY',
    'INDEXPROPERTY',
    'NEXT VALUE FOR',
    'OBJECT_DEFINITION',
    'OBJECT_ID',
    'OBJECT_NAME',
    'OBJECT_SCHEMA_NAME',
    'OBJECTPROPERTY',
    'OBJECTPROPERTYEX',
    'ORIGINAL_DB_NAME',
    'PARSENAME',
    'SCHEMA_ID',
    'SCHEMA_NAME',
    'SCOPE_IDENTITY',
    'SERVERPROPERTY',
    'STATS_DATE',
    'TYPE_ID',
    'TYPE_NAME',
    'TYPEPROPERTY',
    // ranking
    'DENSE_RANK',
    'NTILE',
    'RANK',
    'ROW_NUMBER',
    'PUBLISHINGSERVERNAME',
    // security
    'CERTENCODED',
    'CERTPRIVATEKEY',
    'CURRENT_USER',
    'DATABASE_PRINCIPAL_ID',
    'HAS_DBACCESS',
    'HAS_PERMS_BY_NAME',
    'IS_MEMBER',
    'IS_ROLEMEMBER',
    'IS_SRVROLEMEMBER',
    'LOGINPROPERTY',
    'ORIGINAL_LOGIN',
    'PERMISSIONS',
    'PWDENCRYPT',
    'PWDCOMPARE',
    'SESSION_USER',
    'SESSIONPROPERTY',
    'SUSER_ID',
    'SUSER_NAME',
    'SUSER_SID',
    'SUSER_SNAME',
    'SYSTEM_USER',
    'USER',
    'USER_ID',
    'USER_NAME',
    // string
    'ASCII',
    'CHARINDEX',
    'CONCAT',
    'CONCAT_WS',
    'DIFFERENCE',
    'FORMAT',
    'LEFT',
    'LEN',
    'LOWER',
    'LTRIM',
    'PATINDEX',
    'QUOTENAME',
    'REPLACE',
    'REPLICATE',
    'REVERSE',
    'RIGHT',
    'RTRIM',
    'SOUNDEX',
    'SPACE',
    'STR',
    'STRING_AGG',
    'STRING_ESCAPE',
    'STUFF',
    'SUBSTRING',
    'TRANSLATE',
    'TRIM',
    'UNICODE',
    'UPPER',
    // system
    '$PARTITION',
    '@@ERROR',
    '@@IDENTITY',
    '@@PACK_RECEIVED',
    '@@ROWCOUNT',
    '@@TRANCOUNT',
    'BINARY_CHECKSUM',
    'CHECKSUM',
    'COMPRESS',
    'CONNECTIONPROPERTY',
    'CONTEXT_INFO',
    'CURRENT_REQUEST_ID',
    'CURRENT_TRANSACTION_ID',
    'DECOMPRESS',
    'ERROR_LINE',
    'ERROR_MESSAGE',
    'ERROR_NUMBER',
    'ERROR_PROCEDURE',
    'ERROR_SEVERITY',
    'ERROR_STATE',
    'FORMATMESSAGE',
    'GET_FILESTREAM_TRANSACTION_CONTEXT',
    'GETANSINULL',
    'HOST_ID',
    'HOST_NAME',
    'ISNULL',
    'ISNUMERIC',
    'MIN_ACTIVE_ROWVERSION',
    'NEWID',
    'NEWSEQUENTIALID',
    'ROWCOUNT_BIG',
    'SESSION_CONTEXT',
    'XACT_STATE',
    // statistical
    '@@CONNECTIONS',
    '@@CPU_BUSY',
    '@@IDLE',
    '@@IO_BUSY',
    '@@PACK_SENT',
    '@@PACKET_ERRORS',
    '@@TIMETICKS',
    '@@TOTAL_ERRORS',
    '@@TOTAL_READ',
    '@@TOTAL_WRITE',
    'TEXTPTR',
    'TEXTVALID',
    // trigger
    'COLUMNS_UPDATED',
    'EVENTDATA',
    'TRIGGER_NESTLEVEL',
    'UPDATE',
    // Shorthand functions to use in place of CASE expression
    'COALESCE',
    'NULLIF'
]; //# sourceMappingURL=transactsql.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/transactsql/transactsql.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://docs.microsoft.com/en-us/sql/t-sql/language-elements/reserved-keywords-transact-sql?view=sql-server-ver15
    // standard
    'ADD',
    'ALL',
    'ALTER',
    'AND',
    'ANY',
    'AS',
    'ASC',
    'AUTHORIZATION',
    'BACKUP',
    'BEGIN',
    'BETWEEN',
    'BREAK',
    'BROWSE',
    'BULK',
    'BY',
    'CASCADE',
    'CHECK',
    'CHECKPOINT',
    'CLOSE',
    'CLUSTERED',
    'COALESCE',
    'COLLATE',
    'COLUMN',
    'COMMIT',
    'COMPUTE',
    'CONSTRAINT',
    'CONTAINS',
    'CONTAINSTABLE',
    'CONTINUE',
    'CONVERT',
    'CREATE',
    'CROSS',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURSOR',
    'DATABASE',
    'DBCC',
    'DEALLOCATE',
    'DECLARE',
    'DEFAULT',
    'DELETE',
    'DENY',
    'DESC',
    'DISK',
    'DISTINCT',
    'DISTRIBUTED',
    'DROP',
    'DUMP',
    'ERRLVL',
    'ESCAPE',
    'EXEC',
    'EXECUTE',
    'EXISTS',
    'EXIT',
    'EXTERNAL',
    'FETCH',
    'FILE',
    'FILLFACTOR',
    'FOR',
    'FOREIGN',
    'FREETEXT',
    'FREETEXTTABLE',
    'FROM',
    'FULL',
    'FUNCTION',
    'GOTO',
    'GRANT',
    'GROUP',
    'HAVING',
    'HOLDLOCK',
    'IDENTITY',
    'IDENTITYCOL',
    'IDENTITY_INSERT',
    'IF',
    'IN',
    'INDEX',
    'INNER',
    'INSERT',
    'INTERSECT',
    'INTO',
    'IS',
    'JOIN',
    'KEY',
    'KILL',
    'LEFT',
    'LIKE',
    'LINENO',
    'LOAD',
    'MERGE',
    'NOCHECK',
    'NONCLUSTERED',
    'NOT',
    'NULL',
    'NULLIF',
    'OF',
    'OFF',
    'OFFSETS',
    'ON',
    'OPEN',
    'OPENDATASOURCE',
    'OPENQUERY',
    'OPENROWSET',
    'OPENXML',
    'OPTION',
    'OR',
    'ORDER',
    'OUTER',
    'OVER',
    'PERCENT',
    'PIVOT',
    'PLAN',
    'PRIMARY',
    'PRINT',
    'PROC',
    'PROCEDURE',
    'PUBLIC',
    'RAISERROR',
    'READ',
    'READTEXT',
    'RECONFIGURE',
    'REFERENCES',
    'REPLICATION',
    'RESTORE',
    'RESTRICT',
    'RETURN',
    'REVERT',
    'REVOKE',
    'RIGHT',
    'ROLLBACK',
    'ROWCOUNT',
    'ROWGUIDCOL',
    'RULE',
    'SAVE',
    'SCHEMA',
    'SECURITYAUDIT',
    'SELECT',
    'SEMANTICKEYPHRASETABLE',
    'SEMANTICSIMILARITYDETAILSTABLE',
    'SEMANTICSIMILARITYTABLE',
    'SESSION_USER',
    'SET',
    'SETUSER',
    'SHUTDOWN',
    'SOME',
    'STATISTICS',
    'SYSTEM_USER',
    'TABLE',
    'TABLESAMPLE',
    'TEXTSIZE',
    'THEN',
    'TO',
    'TOP',
    'TRAN',
    'TRANSACTION',
    'TRIGGER',
    'TRUNCATE',
    'TRY_CONVERT',
    'TSEQUAL',
    'UNION',
    'UNIQUE',
    'UNPIVOT',
    'UPDATE',
    'UPDATETEXT',
    'USE',
    'USER',
    'VALUES',
    'VIEW',
    'WAITFOR',
    'WHERE',
    'WHILE',
    'WITH',
    'WITHIN GROUP',
    'WRITETEXT',
    // https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql?view=sql-server-ver16#action
    '$ACTION'
];
const dataTypes = [
    // https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql?view=sql-server-ver15
    'BINARY',
    'BIT',
    'CHAR',
    'CHAR',
    'CHARACTER',
    'DATE',
    'DATETIME2',
    'DATETIMEOFFSET',
    'DEC',
    'DECIMAL',
    'DOUBLE',
    'FLOAT',
    'INT',
    'INTEGER',
    'NATIONAL',
    'NCHAR',
    'NUMERIC',
    'NVARCHAR',
    'PRECISION',
    'REAL',
    'SMALLINT',
    'TIME',
    'TIMESTAMP',
    'VARBINARY',
    'VARCHAR'
]; //# sourceMappingURL=transactsql.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/transactsql/transactsql.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "transactsql",
    ()=>transactsql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/transactsql/transactsql.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/transactsql/transactsql.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'INTO',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'WINDOW',
    'PARTITION BY',
    'ORDER BY',
    'OFFSET',
    'FETCH {FIRST | NEXT}',
    'FOR {BROWSE | XML | JSON}',
    'OPTION',
    // Data manipulation
    // - insert:
    'INSERT [INTO]',
    'VALUES',
    // - update:
    'SET',
    // - merge:
    'MERGE [INTO]',
    'WHEN [NOT] MATCHED [BY TARGET | BY SOURCE] [THEN]',
    'UPDATE SET'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE TABLE'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR ALTER] [MATERIALIZED] VIEW',
    // - update:
    'UPDATE',
    'WHERE CURRENT OF',
    // - delete:
    'DELETE [FROM]',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE',
    'ADD',
    'DROP COLUMN [IF EXISTS]',
    'ALTER COLUMN',
    // - truncate:
    'TRUNCATE TABLE',
    // indexes
    'CREATE [UNIQUE] [CLUSTERED] INDEX',
    // databases
    'CREATE DATABASE',
    'ALTER DATABASE',
    'DROP DATABASE [IF EXISTS]',
    // functions/procedures
    'CREATE [OR ALTER] [PARTITION] {FUNCTION | PROCEDURE | PROC}',
    'ALTER [PARTITION] {FUNCTION | PROCEDURE | PROC}',
    'DROP [PARTITION] {FUNCTION | PROCEDURE | PROC} [IF EXISTS]',
    // other statements
    'GO',
    'USE',
    // https://docs.microsoft.com/en-us/sql/t-sql/statements/statements?view=sql-server-ver15
    'ADD SENSITIVITY CLASSIFICATION',
    'ADD SIGNATURE',
    'AGGREGATE',
    'ANSI_DEFAULTS',
    'ANSI_NULLS',
    'ANSI_NULL_DFLT_OFF',
    'ANSI_NULL_DFLT_ON',
    'ANSI_PADDING',
    'ANSI_WARNINGS',
    'APPLICATION ROLE',
    'ARITHABORT',
    'ARITHIGNORE',
    'ASSEMBLY',
    'ASYMMETRIC KEY',
    'AUTHORIZATION',
    'AVAILABILITY GROUP',
    'BACKUP',
    'BACKUP CERTIFICATE',
    'BACKUP MASTER KEY',
    'BACKUP SERVICE MASTER KEY',
    'BEGIN CONVERSATION TIMER',
    'BEGIN DIALOG CONVERSATION',
    'BROKER PRIORITY',
    'BULK INSERT',
    'CERTIFICATE',
    'CLOSE MASTER KEY',
    'CLOSE SYMMETRIC KEY',
    'COLUMN ENCRYPTION KEY',
    'COLUMN MASTER KEY',
    'COLUMNSTORE INDEX',
    'CONCAT_NULL_YIELDS_NULL',
    'CONTEXT_INFO',
    'CONTRACT',
    'CREDENTIAL',
    'CRYPTOGRAPHIC PROVIDER',
    'CURSOR_CLOSE_ON_COMMIT',
    'DATABASE',
    'DATABASE AUDIT SPECIFICATION',
    'DATABASE ENCRYPTION KEY',
    'DATABASE HADR',
    'DATABASE SCOPED CONFIGURATION',
    'DATABASE SCOPED CREDENTIAL',
    'DATABASE SET',
    'DATEFIRST',
    'DATEFORMAT',
    'DEADLOCK_PRIORITY',
    'DENY',
    'DENY XML',
    'DISABLE TRIGGER',
    'ENABLE TRIGGER',
    'END CONVERSATION',
    'ENDPOINT',
    'EVENT NOTIFICATION',
    'EVENT SESSION',
    'EXECUTE AS',
    'EXTERNAL DATA SOURCE',
    'EXTERNAL FILE FORMAT',
    'EXTERNAL LANGUAGE',
    'EXTERNAL LIBRARY',
    'EXTERNAL RESOURCE POOL',
    'EXTERNAL TABLE',
    'FIPS_FLAGGER',
    'FMTONLY',
    'FORCEPLAN',
    'FULLTEXT CATALOG',
    'FULLTEXT INDEX',
    'FULLTEXT STOPLIST',
    'GET CONVERSATION GROUP',
    'GET_TRANSMISSION_STATUS',
    'GRANT',
    'GRANT XML',
    'IDENTITY_INSERT',
    'IMPLICIT_TRANSACTIONS',
    'INDEX',
    'LANGUAGE',
    'LOCK_TIMEOUT',
    'LOGIN',
    'MASTER KEY',
    'MESSAGE TYPE',
    'MOVE CONVERSATION',
    'NOCOUNT',
    'NOEXEC',
    'NUMERIC_ROUNDABORT',
    'OFFSETS',
    'OPEN MASTER KEY',
    'OPEN SYMMETRIC KEY',
    'PARSEONLY',
    'PARTITION SCHEME',
    'QUERY_GOVERNOR_COST_LIMIT',
    'QUEUE',
    'QUOTED_IDENTIFIER',
    'RECEIVE',
    'REMOTE SERVICE BINDING',
    'REMOTE_PROC_TRANSACTIONS',
    'RESOURCE GOVERNOR',
    'RESOURCE POOL',
    'RESTORE',
    'RESTORE FILELISTONLY',
    'RESTORE HEADERONLY',
    'RESTORE LABELONLY',
    'RESTORE MASTER KEY',
    'RESTORE REWINDONLY',
    'RESTORE SERVICE MASTER KEY',
    'RESTORE VERIFYONLY',
    'REVERT',
    'REVOKE',
    'REVOKE XML',
    'ROLE',
    'ROUTE',
    'ROWCOUNT',
    'RULE',
    'SCHEMA',
    'SEARCH PROPERTY LIST',
    'SECURITY POLICY',
    'SELECTIVE XML INDEX',
    'SEND',
    'SENSITIVITY CLASSIFICATION',
    'SEQUENCE',
    'SERVER AUDIT',
    'SERVER AUDIT SPECIFICATION',
    'SERVER CONFIGURATION',
    'SERVER ROLE',
    'SERVICE',
    'SERVICE MASTER KEY',
    'SETUSER',
    'SHOWPLAN_ALL',
    'SHOWPLAN_TEXT',
    'SHOWPLAN_XML',
    'SIGNATURE',
    'SPATIAL INDEX',
    'STATISTICS',
    'STATISTICS IO',
    'STATISTICS PROFILE',
    'STATISTICS TIME',
    'STATISTICS XML',
    'SYMMETRIC KEY',
    'SYNONYM',
    'TABLE',
    'TABLE IDENTITY',
    'TEXTSIZE',
    'TRANSACTION ISOLATION LEVEL',
    'TRIGGER',
    'TYPE',
    'UPDATE STATISTICS',
    'USER',
    'WORKLOAD GROUP',
    'XACT_ABORT',
    'XML INDEX',
    'XML SCHEMA COLLECTION'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'EXCEPT',
    'INTERSECT'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    // non-standard joins
    '{CROSS | OUTER} APPLY'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]',
    '{ROWS | RANGE} BETWEEN'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const transactsql = {
    name: 'transactsql',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        nestedBlockComments: true,
        stringTypes: [
            {
                quote: "''-qq",
                prefixes: [
                    'N'
                ]
            },
            '{}'
        ],
        identTypes: [
            `""-qq`,
            '[]'
        ],
        identChars: {
            first: '#@',
            rest: '#@$'
        },
        paramTypes: {
            named: [
                '@'
            ],
            quoted: [
                '@'
            ]
        },
        operators: [
            '%',
            '&',
            '|',
            '^',
            '~',
            '!<',
            '!>',
            '+=',
            '-=',
            '*=',
            '/=',
            '%=',
            '|=',
            '&=',
            '^=',
            '::',
            ':'
        ],
        propertyAccessOperators: [
            '..'
        ]
    },
    formatOptions: {
        alwaysDenseOperators: [
            '::'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=transactsql.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/singlestoredb/singlestoredb.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // List of all keywords taken from:
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/restricted-keywords/list-of-restricted-keywords.html
    // Then filtered down to reserved keywords by running
    // > SELECT * AS <keyword>;
    // for each keyword in that list and observing which of these produce an error.
    'ADD',
    'ALL',
    'ALTER',
    'ANALYZE',
    'AND',
    'AS',
    'ASC',
    'ASENSITIVE',
    'BEFORE',
    'BETWEEN',
    '_BINARY',
    'BOTH',
    'BY',
    'CALL',
    'CASCADE',
    'CASE',
    'CHANGE',
    'CHECK',
    'COLLATE',
    'COLUMN',
    'CONDITION',
    'CONSTRAINT',
    'CONTINUE',
    'CONVERT',
    'CREATE',
    'CROSS',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURSOR',
    'DATABASE',
    'DATABASES',
    'DAY_HOUR',
    'DAY_MICROSECOND',
    'DAY_MINUTE',
    'DAY_SECOND',
    'DECLARE',
    'DEFAULT',
    'DELAYED',
    'DELETE',
    'DESC',
    'DESCRIBE',
    'DETERMINISTIC',
    'DISTINCT',
    'DISTINCTROW',
    'DIV',
    'DROP',
    'DUAL',
    'EACH',
    'ELSE',
    'ELSEIF',
    'ENCLOSED',
    'ESCAPED',
    'EXCEPT',
    'EXISTS',
    'EXIT',
    'EXPLAIN',
    'EXTRA_JOIN',
    'FALSE',
    'FETCH',
    'FOR',
    'FORCE',
    'FORCE_COMPILED_MODE',
    'FORCE_INTERPRETER_MODE',
    'FOREIGN',
    'FROM',
    'FULL',
    'FULLTEXT',
    'GRANT',
    'GROUP',
    'HAVING',
    'HEARTBEAT_NO_LOGGING',
    'HIGH_PRIORITY',
    'HOUR_MICROSECOND',
    'HOUR_MINUTE',
    'HOUR_SECOND',
    'IF',
    'IGNORE',
    'IN',
    'INDEX',
    'INFILE',
    'INNER',
    'INOUT',
    'INSENSITIVE',
    'INSERT',
    'IN',
    '_INTERNAL_DYNAMIC_TYPECAST',
    'INTERSECT',
    'INTERVAL',
    'INTO',
    'ITERATE',
    'JOIN',
    'KEY',
    'KEYS',
    'KILL',
    'LEADING',
    'LEAVE',
    'LEFT',
    'LIKE',
    'LIMIT',
    'LINES',
    'LOAD',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCK',
    'LOOP',
    'LOW_PRIORITY',
    'MATCH',
    'MAXVALUE',
    'MINUS',
    'MINUTE_MICROSECOND',
    'MINUTE_SECOND',
    'MOD',
    'MODIFIES',
    'NATURAL',
    'NO_QUERY_REWRITE',
    'NOT',
    'NO_WRITE_TO_BINLOG',
    'NO_QUERY_REWRITE',
    'NULL',
    'ON',
    'OPTIMIZE',
    'OPTION',
    'OPTIONALLY',
    'OR',
    'ORDER',
    'OUT',
    'OUTER',
    'OUTFILE',
    'OVER',
    'PRIMARY',
    'PROCEDURE',
    'PURGE',
    'RANGE',
    'READ',
    'READS',
    'REFERENCES',
    'REGEXP',
    'RELEASE',
    'RENAME',
    'REPEAT',
    'REPLACE',
    'REQUIRE',
    'RESTRICT',
    'RETURN',
    'REVOKE',
    'RIGHT',
    'RIGHT_ANTI_JOIN',
    'RIGHT_SEMI_JOIN',
    'RIGHT_STRAIGHT_JOIN',
    'RLIKE',
    'SCHEMA',
    'SCHEMAS',
    'SECOND_MICROSECOND',
    'SELECT',
    'SEMI_JOIN',
    'SENSITIVE',
    'SEPARATOR',
    'SET',
    'SHOW',
    'SIGNAL',
    'SPATIAL',
    'SPECIFIC',
    'SQL',
    'SQL_BIG_RESULT',
    'SQL_BUFFER_RESULT',
    'SQL_CACHE',
    'SQL_CALC_FOUND_ROWS',
    'SQLEXCEPTION',
    'SQL_NO_CACHE',
    'SQL_NO_LOGGING',
    'SQL_SMALL_RESULT',
    'SQLSTATE',
    'SQLWARNING',
    'STRAIGHT_JOIN',
    'TABLE',
    'TERMINATED',
    'THEN',
    'TO',
    'TRAILING',
    'TRIGGER',
    'TRUE',
    'UNBOUNDED',
    'UNDO',
    'UNION',
    'UNIQUE',
    'UNLOCK',
    'UPDATE',
    'USAGE',
    'USE',
    'USING',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    '_UTF8',
    'VALUES',
    'WHEN',
    'WHERE',
    'WHILE',
    'WINDOW',
    'WITH',
    'WITHIN',
    'WRITE',
    'XOR',
    'YEAR_MONTH',
    'ZEROFILL'
];
const dataTypes = [
    // https://docs.singlestore.com/cloud/reference/sql-reference/data-types/
    'BIGINT',
    'BINARY',
    'BIT',
    'BLOB',
    'CHAR',
    'CHARACTER',
    'DATETIME',
    'DEC',
    'DECIMAL',
    'DOUBLE PRECISION',
    'DOUBLE',
    'ENUM',
    'FIXED',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'INT',
    'INT1',
    'INT2',
    'INT3',
    'INT4',
    'INT8',
    'INTEGER',
    'LONG',
    'LONGBLOB',
    'LONGTEXT',
    'MEDIUMBLOB',
    'MEDIUMINT',
    'MEDIUMTEXT',
    'MIDDLEINT',
    'NATIONAL CHAR',
    'NATIONAL VARCHAR',
    'NUMERIC',
    'PRECISION',
    'REAL',
    'SMALLINT',
    'TEXT',
    'TIME',
    'TIMESTAMP',
    'TINYBLOB',
    'TINYINT',
    'TINYTEXT',
    'UNSIGNED',
    'VARBINARY',
    'VARCHAR',
    'VARCHARACTER',
    'YEAR'
]; //# sourceMappingURL=singlestoredb.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/singlestoredb/singlestoredb.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/vector-functions/vector-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/window-functions/window-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/string-functions/string-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/conditional-functions/conditional-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/numeric-functions/numeric-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/geospatial-functions/geospatial-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/json-functions/json-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/information-functions/information-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/aggregate-functions/aggregate-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/time-series-functions/time-series-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/identifier-generation-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/date-and-time-functions/date-and-time-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/distinct-count-estimation-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/full-text-search-functions/full-text-search-functions.html
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference/regular-expression-functions.html
    'ABS',
    'ACOS',
    'ADDDATE',
    'ADDTIME',
    'AES_DECRYPT',
    'AES_ENCRYPT',
    'ANY_VALUE',
    'APPROX_COUNT_DISTINCT',
    'APPROX_COUNT_DISTINCT_ACCUMULATE',
    'APPROX_COUNT_DISTINCT_COMBINE',
    'APPROX_COUNT_DISTINCT_ESTIMATE',
    'APPROX_GEOGRAPHY_INTERSECTS',
    'APPROX_PERCENTILE',
    'ASCII',
    'ASIN',
    'ATAN',
    'ATAN2',
    'AVG',
    'BIN',
    'BINARY',
    'BIT_AND',
    'BIT_COUNT',
    'BIT_OR',
    'BIT_XOR',
    'CAST',
    'CEIL',
    'CEILING',
    'CHAR',
    'CHARACTER_LENGTH',
    'CHAR_LENGTH',
    'CHARSET',
    'COALESCE',
    'COERCIBILITY',
    'COLLATION',
    'COLLECT',
    'CONCAT',
    'CONCAT_WS',
    'CONNECTION_ID',
    'CONV',
    'CONVERT',
    'CONVERT_TZ',
    'COS',
    'COT',
    'COUNT',
    'CUME_DIST',
    'CURDATE',
    'CURRENT_DATE',
    'CURRENT_ROLE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'CURTIME',
    'DATABASE',
    'DATE',
    'DATE_ADD',
    'DATEDIFF',
    'DATE_FORMAT',
    'DATE_SUB',
    'DATE_TRUNC',
    'DAY',
    'DAYNAME',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFYEAR',
    'DECODE',
    'DEFAULT',
    'DEGREES',
    'DENSE_RANK',
    'DIV',
    'DOT_PRODUCT',
    'ELT',
    'EUCLIDEAN_DISTANCE',
    'EXP',
    'EXTRACT',
    'FIELD',
    'FIRST',
    'FIRST_VALUE',
    'FLOOR',
    'FORMAT',
    'FOUND_ROWS',
    'FROM_BASE64',
    'FROM_DAYS',
    'FROM_UNIXTIME',
    'GEOGRAPHY_AREA',
    'GEOGRAPHY_CONTAINS',
    'GEOGRAPHY_DISTANCE',
    'GEOGRAPHY_INTERSECTS',
    'GEOGRAPHY_LATITUDE',
    'GEOGRAPHY_LENGTH',
    'GEOGRAPHY_LONGITUDE',
    'GEOGRAPHY_POINT',
    'GEOGRAPHY_WITHIN_DISTANCE',
    'GEOMETRY_AREA',
    'GEOMETRY_CONTAINS',
    'GEOMETRY_DISTANCE',
    'GEOMETRY_FILTER',
    'GEOMETRY_INTERSECTS',
    'GEOMETRY_LENGTH',
    'GEOMETRY_POINT',
    'GEOMETRY_WITHIN_DISTANCE',
    'GEOMETRY_X',
    'GEOMETRY_Y',
    'GREATEST',
    'GROUPING',
    'GROUP_CONCAT',
    'HEX',
    'HIGHLIGHT',
    'HOUR',
    'ICU_VERSION',
    'IF',
    'IFNULL',
    'INET_ATON',
    'INET_NTOA',
    'INET6_ATON',
    'INET6_NTOA',
    'INITCAP',
    'INSERT',
    'INSTR',
    'INTERVAL',
    'IS',
    'IS NULL',
    'JSON_AGG',
    'JSON_ARRAY_CONTAINS_DOUBLE',
    'JSON_ARRAY_CONTAINS_JSON',
    'JSON_ARRAY_CONTAINS_STRING',
    'JSON_ARRAY_PUSH_DOUBLE',
    'JSON_ARRAY_PUSH_JSON',
    'JSON_ARRAY_PUSH_STRING',
    'JSON_DELETE_KEY',
    'JSON_EXTRACT_DOUBLE',
    'JSON_EXTRACT_JSON',
    'JSON_EXTRACT_STRING',
    'JSON_EXTRACT_BIGINT',
    'JSON_GET_TYPE',
    'JSON_LENGTH',
    'JSON_SET_DOUBLE',
    'JSON_SET_JSON',
    'JSON_SET_STRING',
    'JSON_SPLICE_DOUBLE',
    'JSON_SPLICE_JSON',
    'JSON_SPLICE_STRING',
    'LAG',
    'LAST_DAY',
    'LAST_VALUE',
    'LCASE',
    'LEAD',
    'LEAST',
    'LEFT',
    'LENGTH',
    'LIKE',
    'LN',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOCATE',
    'LOG',
    'LOG10',
    'LOG2',
    'LPAD',
    'LTRIM',
    'MATCH',
    'MAX',
    'MD5',
    'MEDIAN',
    'MICROSECOND',
    'MIN',
    'MINUTE',
    'MOD',
    'MONTH',
    'MONTHNAME',
    'MONTHS_BETWEEN',
    'NOT',
    'NOW',
    'NTH_VALUE',
    'NTILE',
    'NULLIF',
    'OCTET_LENGTH',
    'PERCENT_RANK',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PI',
    'PIVOT',
    'POSITION',
    'POW',
    'POWER',
    'QUARTER',
    'QUOTE',
    'RADIANS',
    'RAND',
    'RANK',
    'REGEXP',
    'REPEAT',
    'REPLACE',
    'REVERSE',
    'RIGHT',
    'RLIKE',
    'ROUND',
    'ROW_COUNT',
    'ROW_NUMBER',
    'RPAD',
    'RTRIM',
    'SCALAR',
    'SCHEMA',
    'SEC_TO_TIME',
    'SHA1',
    'SHA2',
    'SIGMOID',
    'SIGN',
    'SIN',
    'SLEEP',
    'SPLIT',
    'SOUNDEX',
    'SOUNDS LIKE',
    'SOURCE_POS_WAIT',
    'SPACE',
    'SQRT',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STR_TO_DATE',
    'SUBDATE',
    'SUBSTR',
    'SUBSTRING',
    'SUBSTRING_INDEX',
    'SUM',
    'SYS_GUID',
    'TAN',
    'TIME',
    'TIMEDIFF',
    'TIME_BUCKET',
    'TIME_FORMAT',
    'TIMESTAMP',
    'TIMESTAMPADD',
    'TIMESTAMPDIFF',
    'TIME_TO_SEC',
    'TO_BASE64',
    'TO_CHAR',
    'TO_DAYS',
    'TO_JSON',
    'TO_NUMBER',
    'TO_SECONDS',
    'TO_TIMESTAMP',
    'TRIM',
    'TRUNC',
    'TRUNCATE',
    'UCASE',
    'UNHEX',
    'UNIX_TIMESTAMP',
    'UPDATEXML',
    'UPPER',
    // 'USER',
    'UTC_DATE',
    'UTC_TIME',
    'UTC_TIMESTAMP',
    'UUID',
    'VALUES',
    'VARIANCE',
    'VAR_POP',
    'VAR_SAMP',
    'VECTOR_SUB',
    'VERSION',
    'WEEK',
    'WEEKDAY',
    'WEEKOFYEAR',
    'YEAR'
]; //# sourceMappingURL=singlestoredb.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/singlestoredb/singlestoredb.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "singlestoredb",
    ()=>singlestoredb
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/likeMariaDb.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/singlestoredb/singlestoredb.keywords.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/singlestoredb/singlestoredb.functions.js [app-client] (ecmascript)");
;
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT | DISTINCTROW]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'PARTITION BY',
    'ORDER BY',
    'LIMIT',
    'OFFSET',
    // Data manipulation
    // - insert:
    'INSERT [IGNORE] [INTO]',
    'VALUES',
    'REPLACE [INTO]',
    'ON DUPLICATE KEY UPDATE',
    // - update:
    'SET',
    // Data definition
    'CREATE [OR REPLACE] [TEMPORARY] PROCEDURE [IF NOT EXISTS]',
    'CREATE [OR REPLACE] [EXTERNAL] FUNCTION'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [ROWSTORE] [REFERENCE | TEMPORARY | GLOBAL TEMPORARY] TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE VIEW',
    // - update:
    'UPDATE',
    // - delete:
    'DELETE [FROM]',
    // - drop table:
    'DROP [TEMPORARY] TABLE [IF EXISTS]',
    // - alter table:
    'ALTER [ONLINE] TABLE',
    'ADD [COLUMN]',
    'ADD [UNIQUE] {INDEX | KEY}',
    'DROP [COLUMN]',
    'MODIFY [COLUMN]',
    'CHANGE',
    'RENAME [TO | AS]',
    // - truncate:
    'TRUNCATE [TABLE]',
    // https://docs.singlestore.com/managed-service/en/reference/sql-reference.html
    'ADD AGGREGATOR',
    'ADD LEAF',
    'AGGREGATOR SET AS MASTER',
    'ALTER DATABASE',
    'ALTER PIPELINE',
    'ALTER RESOURCE POOL',
    'ALTER USER',
    'ALTER VIEW',
    'ANALYZE TABLE',
    'ATTACH DATABASE',
    'ATTACH LEAF',
    'ATTACH LEAF ALL',
    'BACKUP DATABASE',
    'BINLOG',
    'BOOTSTRAP AGGREGATOR',
    'CACHE INDEX',
    'CALL',
    'CHANGE',
    'CHANGE MASTER TO',
    'CHANGE REPLICATION FILTER',
    'CHANGE REPLICATION SOURCE TO',
    'CHECK BLOB CHECKSUM',
    'CHECK TABLE',
    'CHECKSUM TABLE',
    'CLEAR ORPHAN DATABASES',
    'CLONE',
    'COMMIT',
    'CREATE DATABASE',
    'CREATE GROUP',
    'CREATE INDEX',
    'CREATE LINK',
    'CREATE MILESTONE',
    'CREATE PIPELINE',
    'CREATE RESOURCE POOL',
    'CREATE ROLE',
    'CREATE USER',
    'DEALLOCATE PREPARE',
    'DESCRIBE',
    'DETACH DATABASE',
    'DETACH PIPELINE',
    'DROP DATABASE',
    'DROP FUNCTION',
    'DROP INDEX',
    'DROP LINK',
    'DROP PIPELINE',
    'DROP PROCEDURE',
    'DROP RESOURCE POOL',
    'DROP ROLE',
    'DROP USER',
    'DROP VIEW',
    'EXECUTE',
    'EXPLAIN',
    'FLUSH',
    'FORCE',
    'GRANT',
    'HANDLER',
    'HELP',
    'KILL CONNECTION',
    'KILLALL QUERIES',
    'LOAD DATA',
    'LOAD INDEX INTO CACHE',
    'LOAD XML',
    'LOCK INSTANCE FOR BACKUP',
    'LOCK TABLES',
    'MASTER_POS_WAIT',
    'OPTIMIZE TABLE',
    'PREPARE',
    'PURGE BINARY LOGS',
    'REBALANCE PARTITIONS',
    'RELEASE SAVEPOINT',
    'REMOVE AGGREGATOR',
    'REMOVE LEAF',
    'REPAIR TABLE',
    'REPLACE',
    'REPLICATE DATABASE',
    'RESET',
    'RESET MASTER',
    'RESET PERSIST',
    'RESET REPLICA',
    'RESET SLAVE',
    'RESTART',
    'RESTORE DATABASE',
    'RESTORE REDUNDANCY',
    'REVOKE',
    'ROLLBACK',
    'ROLLBACK TO SAVEPOINT',
    'SAVEPOINT',
    'SET CHARACTER SET',
    'SET DEFAULT ROLE',
    'SET NAMES',
    'SET PASSWORD',
    'SET RESOURCE GROUP',
    'SET ROLE',
    'SET TRANSACTION',
    'SHOW',
    'SHOW CHARACTER SET',
    'SHOW COLLATION',
    'SHOW COLUMNS',
    'SHOW CREATE DATABASE',
    'SHOW CREATE FUNCTION',
    'SHOW CREATE PIPELINE',
    'SHOW CREATE PROCEDURE',
    'SHOW CREATE TABLE',
    'SHOW CREATE USER',
    'SHOW CREATE VIEW',
    'SHOW DATABASES',
    'SHOW ENGINE',
    'SHOW ENGINES',
    'SHOW ERRORS',
    'SHOW FUNCTION CODE',
    'SHOW FUNCTION STATUS',
    'SHOW GRANTS',
    'SHOW INDEX',
    'SHOW MASTER STATUS',
    'SHOW OPEN TABLES',
    'SHOW PLUGINS',
    'SHOW PRIVILEGES',
    'SHOW PROCEDURE CODE',
    'SHOW PROCEDURE STATUS',
    'SHOW PROCESSLIST',
    'SHOW PROFILE',
    'SHOW PROFILES',
    'SHOW RELAYLOG EVENTS',
    'SHOW REPLICA STATUS',
    'SHOW REPLICAS',
    'SHOW SLAVE',
    'SHOW SLAVE HOSTS',
    'SHOW STATUS',
    'SHOW TABLE STATUS',
    'SHOW TABLES',
    'SHOW VARIABLES',
    'SHOW WARNINGS',
    'SHUTDOWN',
    'SNAPSHOT DATABASE',
    'SOURCE_POS_WAIT',
    'START GROUP_REPLICATION',
    'START PIPELINE',
    'START REPLICA',
    'START SLAVE',
    'START TRANSACTION',
    'STOP GROUP_REPLICATION',
    'STOP PIPELINE',
    'STOP REPLICA',
    'STOP REPLICATING',
    'STOP SLAVE',
    'TEST PIPELINE',
    'UNLOCK INSTANCE',
    'UNLOCK TABLES',
    'USE',
    'XA',
    // flow control
    'ITERATE',
    'LEAVE',
    'LOOP',
    'REPEAT',
    'RETURN',
    'WHILE'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL | DISTINCT]',
    'EXCEPT',
    'INTERSECT',
    'MINUS'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'JOIN',
    '{LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{INNER | CROSS} JOIN',
    'NATURAL {LEFT | RIGHT} [OUTER] JOIN',
    // non-standard joins
    'STRAIGHT_JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'ON DELETE',
    'ON UPDATE',
    'CHARACTER SET',
    '{ROWS | RANGE} BETWEEN',
    'IDENTIFIED BY'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const singlestoredb = {
    name: 'singlestoredb',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        // TODO: support _binary"some string" prefix
        stringTypes: [
            '""-qq-bs',
            "''-qq-bs",
            {
                quote: "''-raw",
                prefixes: [
                    'B',
                    'X'
                ],
                requirePrefix: true
            }
        ],
        identTypes: [
            '``'
        ],
        identChars: {
            first: '$',
            rest: '$',
            allowFirstCharNumber: true
        },
        variableTypes: [
            {
                regex: '@@?[A-Za-z0-9_$]+'
            },
            {
                quote: '``',
                prefixes: [
                    '@'
                ],
                requirePrefix: true
            }
        ],
        lineCommentTypes: [
            '--',
            '#'
        ],
        operators: [
            ':=',
            '&',
            '|',
            '^',
            '~',
            '<<',
            '>>',
            '<=>',
            '&&',
            '||',
            '::',
            '::$',
            '::%',
            ':>',
            '!:>',
            '*.*'
        ],
        postProcess: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$likeMariaDb$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postProcess"]
    },
    formatOptions: {
        alwaysDenseOperators: [
            '::',
            '::$',
            '::%'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=singlestoredb.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/snowflake/snowflake.functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "functions",
    ()=>functions
]);
const functions = [
    // https://docs.snowflake.com/en/sql-reference-functions.html
    //
    // https://docs.snowflake.com/en/sql-reference/functions-all.html
    // 1. run in console on this page: $x('//tbody/tr/*[1]//a/span/text()').map(x => x.nodeValue)
    // 2. split all lines that contain ',' or '/' into multiple lines
    // 3. remove all '— Deprecated' parts from the strings
    // 4. delete all strings that end with '<object_type>', they are already covered in the list
    // 5. remove all strings that contain '[', they are operators not functions
    // 6. fix all values that contain '*'
    // 7. delete operatos ':', '::', '||'
    //
    // Steps 1-5 can be combined by the following script in the developer console:
    // $x('//tbody/tr/*[1]//a/span/text()').map(x => x.nodeValue) // Step 1
    //   .map(x => x.split(x.includes(',') ? ',' : '/')).flat().map(x => x.trim()) // Step 2
    //   .map(x => x.replace('— Deprecated', '')) // Step 3
    //   .filter(x => !x.endsWith('<object_type>')) // Step 4
    //   .filter(x => !x.includes('[')) // Step 5
    'ABS',
    'ACOS',
    'ACOSH',
    'ADD_MONTHS',
    'ALL_USER_NAMES',
    'ANY_VALUE',
    'APPROX_COUNT_DISTINCT',
    'APPROX_PERCENTILE',
    'APPROX_PERCENTILE_ACCUMULATE',
    'APPROX_PERCENTILE_COMBINE',
    'APPROX_PERCENTILE_ESTIMATE',
    'APPROX_TOP_K',
    'APPROX_TOP_K_ACCUMULATE',
    'APPROX_TOP_K_COMBINE',
    'APPROX_TOP_K_ESTIMATE',
    'APPROXIMATE_JACCARD_INDEX',
    'APPROXIMATE_SIMILARITY',
    'ARRAY_AGG',
    'ARRAY_APPEND',
    'ARRAY_CAT',
    'ARRAY_COMPACT',
    'ARRAY_CONSTRUCT',
    'ARRAY_CONSTRUCT_COMPACT',
    'ARRAY_CONTAINS',
    'ARRAY_INSERT',
    'ARRAY_INTERSECTION',
    'ARRAY_POSITION',
    'ARRAY_PREPEND',
    'ARRAY_SIZE',
    'ARRAY_SLICE',
    'ARRAY_TO_STRING',
    'ARRAY_UNION_AGG',
    'ARRAY_UNIQUE_AGG',
    'ARRAYS_OVERLAP',
    'AS_ARRAY',
    'AS_BINARY',
    'AS_BOOLEAN',
    'AS_CHAR',
    'AS_VARCHAR',
    'AS_DATE',
    'AS_DECIMAL',
    'AS_NUMBER',
    'AS_DOUBLE',
    'AS_REAL',
    'AS_INTEGER',
    'AS_OBJECT',
    'AS_TIME',
    'AS_TIMESTAMP_LTZ',
    'AS_TIMESTAMP_NTZ',
    'AS_TIMESTAMP_TZ',
    'ASCII',
    'ASIN',
    'ASINH',
    'ATAN',
    'ATAN2',
    'ATANH',
    'AUTO_REFRESH_REGISTRATION_HISTORY',
    'AUTOMATIC_CLUSTERING_HISTORY',
    'AVG',
    'BASE64_DECODE_BINARY',
    'BASE64_DECODE_STRING',
    'BASE64_ENCODE',
    'BIT_LENGTH',
    'BITAND',
    'BITAND_AGG',
    'BITMAP_BIT_POSITION',
    'BITMAP_BUCKET_NUMBER',
    'BITMAP_CONSTRUCT_AGG',
    'BITMAP_COUNT',
    'BITMAP_OR_AGG',
    'BITNOT',
    'BITOR',
    'BITOR_AGG',
    'BITSHIFTLEFT',
    'BITSHIFTRIGHT',
    'BITXOR',
    'BITXOR_AGG',
    'BOOLAND',
    'BOOLAND_AGG',
    'BOOLNOT',
    'BOOLOR',
    'BOOLOR_AGG',
    'BOOLXOR',
    'BOOLXOR_AGG',
    'BUILD_SCOPED_FILE_URL',
    'BUILD_STAGE_FILE_URL',
    'CASE',
    'CAST',
    'CBRT',
    'CEIL',
    'CHARINDEX',
    'CHECK_JSON',
    'CHECK_XML',
    'CHR',
    'CHAR',
    'COALESCE',
    'COLLATE',
    'COLLATION',
    'COMPLETE_TASK_GRAPHS',
    'COMPRESS',
    'CONCAT',
    'CONCAT_WS',
    'CONDITIONAL_CHANGE_EVENT',
    'CONDITIONAL_TRUE_EVENT',
    'CONTAINS',
    'CONVERT_TIMEZONE',
    'COPY_HISTORY',
    'CORR',
    'COS',
    'COSH',
    'COT',
    'COUNT',
    'COUNT_IF',
    'COVAR_POP',
    'COVAR_SAMP',
    'CUME_DIST',
    'CURRENT_ACCOUNT',
    'CURRENT_AVAILABLE_ROLES',
    'CURRENT_CLIENT',
    'CURRENT_DATABASE',
    'CURRENT_DATE',
    'CURRENT_IP_ADDRESS',
    'CURRENT_REGION',
    'CURRENT_ROLE',
    'CURRENT_SCHEMA',
    'CURRENT_SCHEMAS',
    'CURRENT_SECONDARY_ROLES',
    'CURRENT_SESSION',
    'CURRENT_STATEMENT',
    'CURRENT_TASK_GRAPHS',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_TRANSACTION',
    'CURRENT_USER',
    'CURRENT_VERSION',
    'CURRENT_WAREHOUSE',
    'DATA_TRANSFER_HISTORY',
    'DATABASE_REFRESH_HISTORY',
    'DATABASE_REFRESH_PROGRESS',
    'DATABASE_REFRESH_PROGRESS_BY_JOB',
    'DATABASE_STORAGE_USAGE_HISTORY',
    'DATE_FROM_PARTS',
    'DATE_PART',
    'DATE_TRUNC',
    'DATEADD',
    'DATEDIFF',
    'DAYNAME',
    'DECODE',
    'DECOMPRESS_BINARY',
    'DECOMPRESS_STRING',
    'DECRYPT',
    'DECRYPT_RAW',
    'DEGREES',
    'DENSE_RANK',
    'DIV0',
    'EDITDISTANCE',
    'ENCRYPT',
    'ENCRYPT_RAW',
    'ENDSWITH',
    'EQUAL_NULL',
    'EXP',
    'EXPLAIN_JSON',
    'EXTERNAL_FUNCTIONS_HISTORY',
    'EXTERNAL_TABLE_FILES',
    'EXTERNAL_TABLE_FILE_REGISTRATION_HISTORY',
    'EXTRACT',
    'EXTRACT_SEMANTIC_CATEGORIES',
    'FACTORIAL',
    'FILTER',
    'FIRST_VALUE',
    'FLATTEN',
    'FLOOR',
    'GENERATE_COLUMN_DESCRIPTION',
    'GENERATOR',
    'GET',
    'GET_ABSOLUTE_PATH',
    'GET_DDL',
    'GET_IGNORE_CASE',
    'GET_OBJECT_REFERENCES',
    'GET_PATH',
    'GET_PRESIGNED_URL',
    'GET_RELATIVE_PATH',
    'GET_STAGE_LOCATION',
    'GETBIT',
    'GREATEST',
    'GREATEST_IGNORE_NULLS',
    'GROUPING',
    'GROUPING_ID',
    'HASH',
    'HASH_AGG',
    'HAVERSINE',
    'HEX_DECODE_BINARY',
    'HEX_DECODE_STRING',
    'HEX_ENCODE',
    'HLL',
    'HLL_ACCUMULATE',
    'HLL_COMBINE',
    'HLL_ESTIMATE',
    'HLL_EXPORT',
    'HLL_IMPORT',
    'HOUR',
    'MINUTE',
    'SECOND',
    'IDENTIFIER',
    'IFF',
    'IFNULL',
    'ILIKE',
    'ILIKE ANY',
    'INFER_SCHEMA',
    'INITCAP',
    'INSERT',
    'INVOKER_ROLE',
    'INVOKER_SHARE',
    'IS_ARRAY',
    'IS_BINARY',
    'IS_BOOLEAN',
    'IS_CHAR',
    'IS_VARCHAR',
    'IS_DATE',
    'IS_DATE_VALUE',
    'IS_DECIMAL',
    'IS_DOUBLE',
    'IS_REAL',
    'IS_GRANTED_TO_INVOKER_ROLE',
    'IS_INTEGER',
    'IS_NULL_VALUE',
    'IS_OBJECT',
    'IS_ROLE_IN_SESSION',
    'IS_TIME',
    'IS_TIMESTAMP_LTZ',
    'IS_TIMESTAMP_NTZ',
    'IS_TIMESTAMP_TZ',
    'JAROWINKLER_SIMILARITY',
    'JSON_EXTRACT_PATH_TEXT',
    'KURTOSIS',
    'LAG',
    'LAST_DAY',
    'LAST_QUERY_ID',
    'LAST_TRANSACTION',
    'LAST_VALUE',
    'LEAD',
    'LEAST',
    'LEFT',
    'LENGTH',
    'LEN',
    'LIKE',
    'LIKE ALL',
    'LIKE ANY',
    'LISTAGG',
    'LN',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'LOG',
    'LOGIN_HISTORY',
    'LOGIN_HISTORY_BY_USER',
    'LOWER',
    'LPAD',
    'LTRIM',
    'MATERIALIZED_VIEW_REFRESH_HISTORY',
    'MD5',
    'MD5_HEX',
    'MD5_BINARY',
    'MD5_NUMBER — Obsoleted',
    'MD5_NUMBER_LOWER64',
    'MD5_NUMBER_UPPER64',
    'MEDIAN',
    'MIN',
    'MAX',
    'MINHASH',
    'MINHASH_COMBINE',
    'MOD',
    'MODE',
    'MONTHNAME',
    'MONTHS_BETWEEN',
    'NEXT_DAY',
    'NORMAL',
    'NTH_VALUE',
    'NTILE',
    'NULLIF',
    'NULLIFZERO',
    'NVL',
    'NVL2',
    'OBJECT_AGG',
    'OBJECT_CONSTRUCT',
    'OBJECT_CONSTRUCT_KEEP_NULL',
    'OBJECT_DELETE',
    'OBJECT_INSERT',
    'OBJECT_KEYS',
    'OBJECT_PICK',
    'OCTET_LENGTH',
    'PARSE_IP',
    'PARSE_JSON',
    'PARSE_URL',
    'PARSE_XML',
    'PERCENT_RANK',
    'PERCENTILE_CONT',
    'PERCENTILE_DISC',
    'PI',
    'PIPE_USAGE_HISTORY',
    'POLICY_CONTEXT',
    'POLICY_REFERENCES',
    'POSITION',
    'POW',
    'POWER',
    'PREVIOUS_DAY',
    'QUERY_ACCELERATION_HISTORY',
    'QUERY_HISTORY',
    'QUERY_HISTORY_BY_SESSION',
    'QUERY_HISTORY_BY_USER',
    'QUERY_HISTORY_BY_WAREHOUSE',
    'RADIANS',
    'RANDOM',
    'RANDSTR',
    'RANK',
    'RATIO_TO_REPORT',
    'REGEXP',
    'REGEXP_COUNT',
    'REGEXP_INSTR',
    'REGEXP_LIKE',
    'REGEXP_REPLACE',
    'REGEXP_SUBSTR',
    'REGEXP_SUBSTR_ALL',
    'REGR_AVGX',
    'REGR_AVGY',
    'REGR_COUNT',
    'REGR_INTERCEPT',
    'REGR_R2',
    'REGR_SLOPE',
    'REGR_SXX',
    'REGR_SXY',
    'REGR_SYY',
    'REGR_VALX',
    'REGR_VALY',
    'REPEAT',
    'REPLACE',
    'REPLICATION_GROUP_REFRESH_HISTORY',
    'REPLICATION_GROUP_REFRESH_PROGRESS',
    'REPLICATION_GROUP_REFRESH_PROGRESS_BY_JOB',
    'REPLICATION_GROUP_USAGE_HISTORY',
    'REPLICATION_USAGE_HISTORY',
    'REST_EVENT_HISTORY',
    'RESULT_SCAN',
    'REVERSE',
    'RIGHT',
    'RLIKE',
    'ROUND',
    'ROW_NUMBER',
    'RPAD',
    'RTRIM',
    'RTRIMMED_LENGTH',
    'SEARCH_OPTIMIZATION_HISTORY',
    'SEQ1',
    'SEQ2',
    'SEQ4',
    'SEQ8',
    'SERVERLESS_TASK_HISTORY',
    'SHA1',
    'SHA1_HEX',
    'SHA1_BINARY',
    'SHA2',
    'SHA2_HEX',
    'SHA2_BINARY',
    'SIGN',
    'SIN',
    'SINH',
    'SKEW',
    'SOUNDEX',
    'SPACE',
    'SPLIT',
    'SPLIT_PART',
    'SPLIT_TO_TABLE',
    'SQRT',
    'SQUARE',
    'ST_AREA',
    'ST_ASEWKB',
    'ST_ASEWKT',
    'ST_ASGEOJSON',
    'ST_ASWKB',
    'ST_ASBINARY',
    'ST_ASWKT',
    'ST_ASTEXT',
    'ST_AZIMUTH',
    'ST_CENTROID',
    'ST_COLLECT',
    'ST_CONTAINS',
    'ST_COVEREDBY',
    'ST_COVERS',
    'ST_DIFFERENCE',
    'ST_DIMENSION',
    'ST_DISJOINT',
    'ST_DISTANCE',
    'ST_DWITHIN',
    'ST_ENDPOINT',
    'ST_ENVELOPE',
    'ST_GEOGFROMGEOHASH',
    'ST_GEOGPOINTFROMGEOHASH',
    'ST_GEOGRAPHYFROMWKB',
    'ST_GEOGRAPHYFROMWKT',
    'ST_GEOHASH',
    'ST_GEOMETRYFROMWKB',
    'ST_GEOMETRYFROMWKT',
    'ST_HAUSDORFFDISTANCE',
    'ST_INTERSECTION',
    'ST_INTERSECTS',
    'ST_LENGTH',
    'ST_MAKEGEOMPOINT',
    'ST_GEOM_POINT',
    'ST_MAKELINE',
    'ST_MAKEPOINT',
    'ST_POINT',
    'ST_MAKEPOLYGON',
    'ST_POLYGON',
    'ST_NPOINTS',
    'ST_NUMPOINTS',
    'ST_PERIMETER',
    'ST_POINTN',
    'ST_SETSRID',
    'ST_SIMPLIFY',
    'ST_SRID',
    'ST_STARTPOINT',
    'ST_SYMDIFFERENCE',
    'ST_UNION',
    'ST_WITHIN',
    'ST_X',
    'ST_XMAX',
    'ST_XMIN',
    'ST_Y',
    'ST_YMAX',
    'ST_YMIN',
    'STAGE_DIRECTORY_FILE_REGISTRATION_HISTORY',
    'STAGE_STORAGE_USAGE_HISTORY',
    'STARTSWITH',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
    'STRIP_NULL_VALUE',
    'STRTOK',
    'STRTOK_SPLIT_TO_TABLE',
    'STRTOK_TO_ARRAY',
    'SUBSTR',
    'SUBSTRING',
    'SUM',
    'SYSDATE',
    'SYSTEM$ABORT_SESSION',
    'SYSTEM$ABORT_TRANSACTION',
    'SYSTEM$AUTHORIZE_PRIVATELINK',
    'SYSTEM$AUTHORIZE_STAGE_PRIVATELINK_ACCESS',
    'SYSTEM$BEHAVIOR_CHANGE_BUNDLE_STATUS',
    'SYSTEM$CANCEL_ALL_QUERIES',
    'SYSTEM$CANCEL_QUERY',
    'SYSTEM$CLUSTERING_DEPTH',
    'SYSTEM$CLUSTERING_INFORMATION',
    'SYSTEM$CLUSTERING_RATIO ',
    'SYSTEM$CURRENT_USER_TASK_NAME',
    'SYSTEM$DATABASE_REFRESH_HISTORY ',
    'SYSTEM$DATABASE_REFRESH_PROGRESS',
    'SYSTEM$DATABASE_REFRESH_PROGRESS_BY_JOB ',
    'SYSTEM$DISABLE_BEHAVIOR_CHANGE_BUNDLE',
    'SYSTEM$DISABLE_DATABASE_REPLICATION',
    'SYSTEM$ENABLE_BEHAVIOR_CHANGE_BUNDLE',
    'SYSTEM$ESTIMATE_QUERY_ACCELERATION',
    'SYSTEM$ESTIMATE_SEARCH_OPTIMIZATION_COSTS',
    'SYSTEM$EXPLAIN_JSON_TO_TEXT',
    'SYSTEM$EXPLAIN_PLAN_JSON',
    'SYSTEM$EXTERNAL_TABLE_PIPE_STATUS',
    'SYSTEM$GENERATE_SAML_CSR',
    'SYSTEM$GENERATE_SCIM_ACCESS_TOKEN',
    'SYSTEM$GET_AWS_SNS_IAM_POLICY',
    'SYSTEM$GET_PREDECESSOR_RETURN_VALUE',
    'SYSTEM$GET_PRIVATELINK',
    'SYSTEM$GET_PRIVATELINK_AUTHORIZED_ENDPOINTS',
    'SYSTEM$GET_PRIVATELINK_CONFIG',
    'SYSTEM$GET_SNOWFLAKE_PLATFORM_INFO',
    'SYSTEM$GET_TAG',
    'SYSTEM$GET_TAG_ALLOWED_VALUES',
    'SYSTEM$GET_TAG_ON_CURRENT_COLUMN',
    'SYSTEM$GET_TAG_ON_CURRENT_TABLE',
    'SYSTEM$GLOBAL_ACCOUNT_SET_PARAMETER',
    'SYSTEM$LAST_CHANGE_COMMIT_TIME',
    'SYSTEM$LINK_ACCOUNT_OBJECTS_BY_NAME',
    'SYSTEM$MIGRATE_SAML_IDP_REGISTRATION',
    'SYSTEM$PIPE_FORCE_RESUME',
    'SYSTEM$PIPE_STATUS',
    'SYSTEM$REVOKE_PRIVATELINK',
    'SYSTEM$REVOKE_STAGE_PRIVATELINK_ACCESS',
    'SYSTEM$SET_RETURN_VALUE',
    'SYSTEM$SHOW_OAUTH_CLIENT_SECRETS',
    'SYSTEM$STREAM_GET_TABLE_TIMESTAMP',
    'SYSTEM$STREAM_HAS_DATA',
    'SYSTEM$TASK_DEPENDENTS_ENABLE',
    'SYSTEM$TYPEOF',
    'SYSTEM$USER_TASK_CANCEL_ONGOING_EXECUTIONS',
    'SYSTEM$VERIFY_EXTERNAL_OAUTH_TOKEN',
    'SYSTEM$WAIT',
    'SYSTEM$WHITELIST',
    'SYSTEM$WHITELIST_PRIVATELINK',
    'TAG_REFERENCES',
    'TAG_REFERENCES_ALL_COLUMNS',
    'TAG_REFERENCES_WITH_LINEAGE',
    'TAN',
    'TANH',
    'TASK_DEPENDENTS',
    'TASK_HISTORY',
    'TIME_FROM_PARTS',
    'TIME_SLICE',
    'TIMEADD',
    'TIMEDIFF',
    'TIMESTAMP_FROM_PARTS',
    'TIMESTAMPADD',
    'TIMESTAMPDIFF',
    'TO_ARRAY',
    'TO_BINARY',
    'TO_BOOLEAN',
    'TO_CHAR',
    'TO_VARCHAR',
    'TO_DATE',
    'DATE',
    'TO_DECIMAL',
    'TO_NUMBER',
    'TO_NUMERIC',
    'TO_DOUBLE',
    'TO_GEOGRAPHY',
    'TO_GEOMETRY',
    'TO_JSON',
    'TO_OBJECT',
    'TO_TIME',
    'TIME',
    'TO_TIMESTAMP',
    'TO_TIMESTAMP_LTZ',
    'TO_TIMESTAMP_NTZ',
    'TO_TIMESTAMP_TZ',
    'TO_VARIANT',
    'TO_XML',
    'TRANSLATE',
    'TRIM',
    'TRUNCATE',
    'TRUNC',
    'TRUNC',
    'TRY_BASE64_DECODE_BINARY',
    'TRY_BASE64_DECODE_STRING',
    'TRY_CAST',
    'TRY_HEX_DECODE_BINARY',
    'TRY_HEX_DECODE_STRING',
    'TRY_PARSE_JSON',
    'TRY_TO_BINARY',
    'TRY_TO_BOOLEAN',
    'TRY_TO_DATE',
    'TRY_TO_DECIMAL',
    'TRY_TO_NUMBER',
    'TRY_TO_NUMERIC',
    'TRY_TO_DOUBLE',
    'TRY_TO_GEOGRAPHY',
    'TRY_TO_GEOMETRY',
    'TRY_TO_TIME',
    'TRY_TO_TIMESTAMP',
    'TRY_TO_TIMESTAMP_LTZ',
    'TRY_TO_TIMESTAMP_NTZ',
    'TRY_TO_TIMESTAMP_TZ',
    'TYPEOF',
    'UNICODE',
    'UNIFORM',
    'UPPER',
    'UUID_STRING',
    'VALIDATE',
    'VALIDATE_PIPE_LOAD',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    'VARIANCE_SAMP',
    'VARIANCE_POP',
    'WAREHOUSE_LOAD_HISTORY',
    'WAREHOUSE_METERING_HISTORY',
    'WIDTH_BUCKET',
    'XMLGET',
    'YEAR',
    'YEAROFWEEK',
    'YEAROFWEEKISO',
    'DAY',
    'DAYOFMONTH',
    'DAYOFWEEK',
    'DAYOFWEEKISO',
    'DAYOFYEAR',
    'WEEK',
    'WEEK',
    'WEEKOFYEAR',
    'WEEKISO',
    'MONTH',
    'QUARTER',
    'ZEROIFNULL',
    'ZIPF'
]; //# sourceMappingURL=snowflake.functions.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/snowflake/snowflake.keywords.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataTypes",
    ()=>dataTypes,
    "keywords",
    ()=>keywords
]);
const keywords = [
    // https://docs.snowflake.com/en/sql-reference/reserved-keywords.html
    //
    // run in console on this page: $x('//tbody/tr/*[1]/p/text()').map(x => x.nodeValue)
    'ACCOUNT',
    'ALL',
    'ALTER',
    'AND',
    'ANY',
    'AS',
    'BETWEEN',
    'BY',
    'CASE',
    'CAST',
    'CHECK',
    'COLUMN',
    'CONNECT',
    'CONNECTION',
    'CONSTRAINT',
    'CREATE',
    'CROSS',
    'CURRENT',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'CURRENT_TIMESTAMP',
    'CURRENT_USER',
    'DATABASE',
    'DELETE',
    'DISTINCT',
    'DROP',
    'ELSE',
    'EXISTS',
    'FALSE',
    'FOLLOWING',
    'FOR',
    'FROM',
    'FULL',
    'GRANT',
    'GROUP',
    'GSCLUSTER',
    'HAVING',
    'ILIKE',
    'IN',
    'INCREMENT',
    'INNER',
    'INSERT',
    'INTERSECT',
    'INTO',
    'IS',
    'ISSUE',
    'JOIN',
    'LATERAL',
    'LEFT',
    'LIKE',
    'LOCALTIME',
    'LOCALTIMESTAMP',
    'MINUS',
    'NATURAL',
    'NOT',
    'NULL',
    'OF',
    'ON',
    'OR',
    'ORDER',
    'ORGANIZATION',
    'QUALIFY',
    'REGEXP',
    'REVOKE',
    'RIGHT',
    'RLIKE',
    'ROW',
    'ROWS',
    'SAMPLE',
    'SCHEMA',
    'SELECT',
    'SET',
    'SOME',
    'START',
    'TABLE',
    'TABLESAMPLE',
    'THEN',
    'TO',
    'TRIGGER',
    'TRUE',
    'TRY_CAST',
    'UNION',
    'UNIQUE',
    'UPDATE',
    'USING',
    'VALUES',
    'VIEW',
    'WHEN',
    'WHENEVER',
    'WHERE',
    'WITH',
    // These are definitely keywords, but haven't found a definite list in the docs
    'COMMENT'
];
const dataTypes = [
    'NUMBER',
    'DECIMAL',
    'NUMERIC',
    'INT',
    'INTEGER',
    'BIGINT',
    'SMALLINT',
    'TINYINT',
    'BYTEINT',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'DOUBLE',
    'DOUBLE PRECISION',
    'REAL',
    'VARCHAR',
    'CHAR',
    'CHARACTER',
    'STRING',
    'TEXT',
    'BINARY',
    'VARBINARY',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'TIME',
    'TIMESTAMP',
    'TIMESTAMP_LTZ',
    'TIMESTAMP_NTZ',
    'TIMESTAMP',
    'TIMESTAMP_TZ',
    'VARIANT',
    'OBJECT',
    'ARRAY',
    'GEOGRAPHY',
    'GEOMETRY'
]; //# sourceMappingURL=snowflake.keywords.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/languages/snowflake/snowflake.formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "snowflake",
    ()=>snowflake
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/expandPhrases.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/snowflake/snowflake.functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/snowflake/snowflake.keywords.js [app-client] (ecmascript)");
;
;
;
const reservedSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'SELECT [ALL | DISTINCT]'
]);
const reservedClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // queries
    'WITH [RECURSIVE]',
    'FROM',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'PARTITION BY',
    'ORDER BY',
    'QUALIFY',
    'LIMIT',
    'OFFSET',
    'FETCH [FIRST | NEXT]',
    // Data manipulation
    // - insert:
    'INSERT [OVERWRITE] [ALL INTO | INTO | ALL | FIRST]',
    '{THEN | ELSE} INTO',
    'VALUES',
    // - update:
    'SET',
    'CLUSTER BY',
    '[WITH] {MASKING POLICY | TAG | ROW ACCESS POLICY}',
    'COPY GRANTS',
    'USING TEMPLATE',
    'MERGE INTO',
    'WHEN MATCHED [AND]',
    'THEN {UPDATE SET | DELETE}',
    'WHEN NOT MATCHED THEN INSERT'
]);
const standardOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'CREATE [OR REPLACE] [VOLATILE] TABLE [IF NOT EXISTS]',
    'CREATE [OR REPLACE] [LOCAL | GLOBAL] {TEMP|TEMPORARY} TABLE [IF NOT EXISTS]'
]);
const tabularOnelineClauses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    // - create:
    'CREATE [OR REPLACE] [SECURE] [RECURSIVE] VIEW [IF NOT EXISTS]',
    // - update:
    'UPDATE',
    // - delete:
    'DELETE FROM',
    // - drop table:
    'DROP TABLE [IF EXISTS]',
    // - alter table:
    'ALTER TABLE [IF EXISTS]',
    'RENAME TO',
    'SWAP WITH',
    '[SUSPEND | RESUME] RECLUSTER',
    'DROP CLUSTERING KEY',
    'ADD [COLUMN]',
    'RENAME COLUMN',
    '{ALTER | MODIFY} [COLUMN]',
    'DROP [COLUMN]',
    '{ADD | ALTER | MODIFY | DROP} [CONSTRAINT]',
    'RENAME CONSTRAINT',
    '{ADD | DROP} SEARCH OPTIMIZATION',
    '{SET | UNSET} TAG',
    '{ADD | DROP} ROW ACCESS POLICY',
    'DROP ALL ROW ACCESS POLICIES',
    '{SET | DROP} DEFAULT',
    '{SET | DROP} NOT NULL',
    'SET DATA TYPE',
    'UNSET COMMENT',
    '{SET | UNSET} MASKING POLICY',
    // - truncate:
    'TRUNCATE [TABLE] [IF EXISTS]',
    // other
    // https://docs.snowflake.com/en/sql-reference/sql-all.html
    //
    // 1. run in console on this page: $x('//tbody/tr/*[1]//a/span/text()').map(x => x.nodeValue)
    // 2. delete all lines that contain a sting like '(.*)', they are already covered in the list
    // 3. delete all lines that contain a sting like '<.*>', they are already covered in the list
    // 4. delete all lines that contain '…', they are part of a regex statement that can't be covered here
    // 5. Manually add 'COPY INTO'
    // 6. Remove all lines that are already in `reservedClauses`
    //
    // Steps 1-4 can be combined by the following script in the developer console:
    // $x('//tbody/tr/*[1]//a/span/text()').map(x => x.nodeValue) // Step 1
    //   filter(x => !x.match(/\(.*\)/) && !x.match(/…/) && !x.match(/<.*>/)) // Step 2-4
    'ALTER ACCOUNT',
    'ALTER API INTEGRATION',
    'ALTER CONNECTION',
    'ALTER DATABASE',
    'ALTER EXTERNAL TABLE',
    'ALTER FAILOVER GROUP',
    'ALTER FILE FORMAT',
    'ALTER FUNCTION',
    'ALTER INTEGRATION',
    'ALTER MASKING POLICY',
    'ALTER MATERIALIZED VIEW',
    'ALTER NETWORK POLICY',
    'ALTER NOTIFICATION INTEGRATION',
    'ALTER PIPE',
    'ALTER PROCEDURE',
    'ALTER REPLICATION GROUP',
    'ALTER RESOURCE MONITOR',
    'ALTER ROLE',
    'ALTER ROW ACCESS POLICY',
    'ALTER SCHEMA',
    'ALTER SECURITY INTEGRATION',
    'ALTER SEQUENCE',
    'ALTER SESSION',
    'ALTER SESSION POLICY',
    'ALTER SHARE',
    'ALTER STAGE',
    'ALTER STORAGE INTEGRATION',
    'ALTER STREAM',
    'ALTER TAG',
    'ALTER TASK',
    'ALTER USER',
    'ALTER VIEW',
    'ALTER WAREHOUSE',
    'BEGIN',
    'CALL',
    'COMMIT',
    'COPY INTO',
    'CREATE ACCOUNT',
    'CREATE API INTEGRATION',
    'CREATE CONNECTION',
    'CREATE DATABASE',
    'CREATE EXTERNAL FUNCTION',
    'CREATE EXTERNAL TABLE',
    'CREATE FAILOVER GROUP',
    'CREATE FILE FORMAT',
    'CREATE FUNCTION',
    'CREATE INTEGRATION',
    'CREATE MANAGED ACCOUNT',
    'CREATE MASKING POLICY',
    'CREATE MATERIALIZED VIEW',
    'CREATE NETWORK POLICY',
    'CREATE NOTIFICATION INTEGRATION',
    'CREATE PIPE',
    'CREATE PROCEDURE',
    'CREATE REPLICATION GROUP',
    'CREATE RESOURCE MONITOR',
    'CREATE ROLE',
    'CREATE ROW ACCESS POLICY',
    'CREATE SCHEMA',
    'CREATE SECURITY INTEGRATION',
    'CREATE SEQUENCE',
    'CREATE SESSION POLICY',
    'CREATE SHARE',
    'CREATE STAGE',
    'CREATE STORAGE INTEGRATION',
    'CREATE STREAM',
    'CREATE TAG',
    'CREATE TASK',
    'CREATE USER',
    'CREATE WAREHOUSE',
    'DELETE',
    'DESCRIBE DATABASE',
    'DESCRIBE EXTERNAL TABLE',
    'DESCRIBE FILE FORMAT',
    'DESCRIBE FUNCTION',
    'DESCRIBE INTEGRATION',
    'DESCRIBE MASKING POLICY',
    'DESCRIBE MATERIALIZED VIEW',
    'DESCRIBE NETWORK POLICY',
    'DESCRIBE PIPE',
    'DESCRIBE PROCEDURE',
    'DESCRIBE RESULT',
    'DESCRIBE ROW ACCESS POLICY',
    'DESCRIBE SCHEMA',
    'DESCRIBE SEQUENCE',
    'DESCRIBE SESSION POLICY',
    'DESCRIBE SHARE',
    'DESCRIBE STAGE',
    'DESCRIBE STREAM',
    'DESCRIBE TABLE',
    'DESCRIBE TASK',
    'DESCRIBE TRANSACTION',
    'DESCRIBE USER',
    'DESCRIBE VIEW',
    'DESCRIBE WAREHOUSE',
    'DROP CONNECTION',
    'DROP DATABASE',
    'DROP EXTERNAL TABLE',
    'DROP FAILOVER GROUP',
    'DROP FILE FORMAT',
    'DROP FUNCTION',
    'DROP INTEGRATION',
    'DROP MANAGED ACCOUNT',
    'DROP MASKING POLICY',
    'DROP MATERIALIZED VIEW',
    'DROP NETWORK POLICY',
    'DROP PIPE',
    'DROP PROCEDURE',
    'DROP REPLICATION GROUP',
    'DROP RESOURCE MONITOR',
    'DROP ROLE',
    'DROP ROW ACCESS POLICY',
    'DROP SCHEMA',
    'DROP SEQUENCE',
    'DROP SESSION POLICY',
    'DROP SHARE',
    'DROP STAGE',
    'DROP STREAM',
    'DROP TAG',
    'DROP TASK',
    'DROP USER',
    'DROP VIEW',
    'DROP WAREHOUSE',
    'EXECUTE IMMEDIATE',
    'EXECUTE TASK',
    'EXPLAIN',
    'GET',
    'GRANT OWNERSHIP',
    'GRANT ROLE',
    'INSERT',
    'LIST',
    'MERGE',
    'PUT',
    'REMOVE',
    'REVOKE ROLE',
    'ROLLBACK',
    'SHOW COLUMNS',
    'SHOW CONNECTIONS',
    'SHOW DATABASES',
    'SHOW DATABASES IN FAILOVER GROUP',
    'SHOW DATABASES IN REPLICATION GROUP',
    'SHOW DELEGATED AUTHORIZATIONS',
    'SHOW EXTERNAL FUNCTIONS',
    'SHOW EXTERNAL TABLES',
    'SHOW FAILOVER GROUPS',
    'SHOW FILE FORMATS',
    'SHOW FUNCTIONS',
    'SHOW GLOBAL ACCOUNTS',
    'SHOW GRANTS',
    'SHOW INTEGRATIONS',
    'SHOW LOCKS',
    'SHOW MANAGED ACCOUNTS',
    'SHOW MASKING POLICIES',
    'SHOW MATERIALIZED VIEWS',
    'SHOW NETWORK POLICIES',
    'SHOW OBJECTS',
    'SHOW ORGANIZATION ACCOUNTS',
    'SHOW PARAMETERS',
    'SHOW PIPES',
    'SHOW PRIMARY KEYS',
    'SHOW PROCEDURES',
    'SHOW REGIONS',
    'SHOW REPLICATION ACCOUNTS',
    'SHOW REPLICATION DATABASES',
    'SHOW REPLICATION GROUPS',
    'SHOW RESOURCE MONITORS',
    'SHOW ROLES',
    'SHOW ROW ACCESS POLICIES',
    'SHOW SCHEMAS',
    'SHOW SEQUENCES',
    'SHOW SESSION POLICIES',
    'SHOW SHARES',
    'SHOW SHARES IN FAILOVER GROUP',
    'SHOW SHARES IN REPLICATION GROUP',
    'SHOW STAGES',
    'SHOW STREAMS',
    'SHOW TABLES',
    'SHOW TAGS',
    'SHOW TASKS',
    'SHOW TRANSACTIONS',
    'SHOW USER FUNCTIONS',
    'SHOW USERS',
    'SHOW VARIABLES',
    'SHOW VIEWS',
    'SHOW WAREHOUSES',
    'TRUNCATE MATERIALIZED VIEW',
    'UNDROP DATABASE',
    'UNDROP SCHEMA',
    'UNDROP TABLE',
    'UNDROP TAG',
    'UNSET',
    'USE DATABASE',
    'USE ROLE',
    'USE SCHEMA',
    'USE SECONDARY ROLES',
    'USE WAREHOUSE'
]);
const reservedSetOperations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    'UNION [ALL]',
    'MINUS',
    'EXCEPT',
    'INTERSECT'
]);
const reservedJoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    '[INNER] JOIN',
    '[NATURAL] {LEFT | RIGHT | FULL} [OUTER] JOIN',
    '{CROSS | NATURAL} JOIN'
]);
const reservedKeywordPhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([
    '{ROWS | RANGE} BETWEEN',
    'ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]'
]);
const reservedDataTypePhrases = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$expandPhrases$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["expandPhrases"])([]);
const snowflake = {
    name: 'snowflake',
    tokenizerOptions: {
        reservedSelect,
        reservedClauses: [
            ...reservedClauses,
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        reservedSetOperations,
        reservedJoins,
        reservedKeywordPhrases,
        reservedDataTypePhrases,
        reservedKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keywords"],
        reservedDataTypes: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$keywords$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataTypes"],
        reservedFunctionNames: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["functions"],
        stringTypes: [
            '$$',
            `''-qq-bs`
        ],
        identTypes: [
            '""-qq'
        ],
        variableTypes: [
            // for accessing columns at certain positons in the table
            {
                regex: '[$][1-9]\\d*'
            },
            // identifier style syntax
            {
                regex: '[$][_a-zA-Z][_a-zA-Z0-9$]*'
            }
        ],
        extraParens: [
            '[]'
        ],
        identChars: {
            rest: '$'
        },
        lineCommentTypes: [
            '--',
            '//'
        ],
        operators: [
            // Modulo
            '%',
            // Type cast
            '::',
            // String concat
            '||',
            // Generators: https://docs.snowflake.com/en/sql-reference/functions/generator.html#generator
            '=>',
            // Assignment https://docs.snowflake.com/en/sql-reference/snowflake-scripting/let
            ':=',
            // Lambda: https://docs.snowflake.com/en/user-guide/querying-semistructured#lambda-expressions
            '->'
        ],
        propertyAccessOperators: [
            ':'
        ]
    },
    formatOptions: {
        alwaysDenseOperators: [
            '::'
        ],
        onelineClauses: [
            ...standardOnelineClauses,
            ...tabularOnelineClauses
        ],
        tabularOnelineClauses
    }
}; //# sourceMappingURL=snowflake.formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/allDialects.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bigquery",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bigquery"],
    "db2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db2"],
    "db2i",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db2i"],
    "duckdb",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["duckdb"],
    "hive",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hive"],
    "mariadb",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mariadb"],
    "mysql",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mysql"],
    "n1ql",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n1ql"],
    "plsql",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plsql"],
    "postgresql",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postgresql"],
    "redshift",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["redshift"],
    "singlestoredb",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["singlestoredb"],
    "snowflake",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["snowflake"],
    "spark",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spark"],
    "sql",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sql"],
    "sqlite",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sqlite"],
    "tidb",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tidb"],
    "transactsql",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transactsql"],
    "trino",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trino"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$allDialects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/allDialects.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$bigquery$2f$bigquery$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/bigquery/bigquery.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2$2f$db2$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2/db2.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$db2i$2f$db2i$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/db2i/db2i.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$duckdb$2f$duckdb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/duckdb/duckdb.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$hive$2f$hive$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/hive/hive.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mariadb$2f$mariadb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$mysql$2f$mysql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/mysql/mysql.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$tidb$2f$tidb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/tidb/tidb.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$n1ql$2f$n1ql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/n1ql/n1ql.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$plsql$2f$plsql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/plsql/plsql.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$postgresql$2f$postgresql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$redshift$2f$redshift$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/redshift/redshift.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$spark$2f$spark$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/spark/spark.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sqlite$2f$sqlite$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$sql$2f$sql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/sql/sql.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$trino$2f$trino$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/trino/trino.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$transactsql$2f$transactsql$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/transactsql/transactsql.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$singlestoredb$2f$singlestoredb$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/singlestoredb/singlestoredb.formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$languages$2f$snowflake$2f$snowflake$2e$formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/languages/snowflake/snowflake.formatter.js [app-client] (ecmascript)");
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/utils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dedupe",
    ()=>dedupe,
    "equalizeWhitespace",
    ()=>equalizeWhitespace,
    "isMultiline",
    ()=>isMultiline,
    "last",
    ()=>last,
    "maxLength",
    ()=>maxLength,
    "sortByLengthDesc",
    ()=>sortByLengthDesc
]);
const dedupe = (arr)=>[
        ...new Set(arr)
    ];
const last = (arr)=>arr[arr.length - 1];
const sortByLengthDesc = (strings)=>strings.sort((a, b)=>b.length - a.length || a.localeCompare(b));
const maxLength = (strings)=>strings.reduce((max, cur)=>Math.max(max, cur.length), 0);
const equalizeWhitespace = (s)=>s.replace(/\s+/gu, ' ');
const isMultiline = (text)=>/\n/.test(text); //# sourceMappingURL=utils.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/regexUtil.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Escapes regex special chars
__turbopack_context__.s([
    "WHITESPACE_REGEX",
    ()=>WHITESPACE_REGEX,
    "escapeRegExp",
    ()=>escapeRegExp,
    "patternToRegex",
    ()=>patternToRegex,
    "prefixesPattern",
    ()=>prefixesPattern,
    "toCaseInsensitivePattern",
    ()=>toCaseInsensitivePattern,
    "withDashes",
    ()=>withDashes
]);
const escapeRegExp = (string)=>string.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
const WHITESPACE_REGEX = /\s+/uy;
const patternToRegex = (pattern)=>new RegExp(`(?:${pattern})`, 'uy');
const toCaseInsensitivePattern = (prefix)=>prefix.split('').map((char)=>/ /gu.test(char) ? '\\s+' : `[${char.toUpperCase()}${char.toLowerCase()}]`).join('');
const withDashes = (pattern)=>pattern + '(?:-' + pattern + ')*';
const prefixesPattern = ({ prefixes, requirePrefix })=>`(?:${prefixes.map(toCaseInsensitivePattern).join('|')}${requirePrefix ? '' : '|'})`; //# sourceMappingURL=regexUtil.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/regexFactory.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "identifier",
    ()=>identifier,
    "identifierPattern",
    ()=>identifierPattern,
    "lineComment",
    ()=>lineComment,
    "operator",
    ()=>operator,
    "parameter",
    ()=>parameter,
    "parenthesis",
    ()=>parenthesis,
    "quotePatterns",
    ()=>quotePatterns,
    "reservedWord",
    ()=>reservedWord,
    "string",
    ()=>string,
    "stringPattern",
    ()=>stringPattern,
    "variable",
    ()=>variable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/utils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/regexUtil.js [app-client] (ecmascript)");
;
;
const lineComment = (lineCommentTypes)=>new RegExp(`(?:${lineCommentTypes.map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"]).join('|')}).*?(?=\r\n|\r|\n|$)`, 'uy');
const parenthesis = (kind, extraParens = [])=>{
    const index = kind === 'open' ? 0 : 1;
    const parens = [
        '()',
        ...extraParens
    ].map((pair)=>pair[index]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(parens.map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"]).join('|'));
};
const operator = (operators)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sortByLengthDesc"])(operators).map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"]).join('|')}`);
// Negative lookahead to avoid matching a keyword that's actually part of identifier,
// which can happen when identifier allows word-boundary characters inside it.
//
// For example "SELECT$ME" should be tokenized as:
// - ["SELECT$ME"] when $ is allowed inside identifiers
// - ["SELECT", "$", "ME"] when $ can't be part of identifiers.
const rejectIdentCharsPattern = ({ rest, dashes })=>rest || dashes ? `(?![${rest || ''}${dashes ? '-' : ''}])` : '';
const reservedWord = (reservedKeywords, identChars = {})=>{
    if (reservedKeywords.length === 0) {
        return /^\b$/u;
    }
    const avoidIdentChars = rejectIdentCharsPattern(identChars);
    const reservedKeywordsPattern = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sortByLengthDesc"])(reservedKeywords).map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"]).join('|').replace(/ /gu, '\\s+');
    return new RegExp(`(?:${reservedKeywordsPattern})${avoidIdentChars}\\b`, 'iuy');
};
const parameter = (paramTypes, pattern)=>{
    if (!paramTypes.length) {
        return undefined;
    }
    const typesRegex = paramTypes.map(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"]).join('|');
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(`(?:${typesRegex})(?:${pattern})`);
};
const buildQStringPatterns = ()=>{
    const specialDelimiterMap = {
        '<': '>',
        '[': ']',
        '(': ')',
        '{': '}'
    };
    // base pattern for special delimiters, left must correspond with right
    const singlePattern = "{left}(?:(?!{right}').)*?{right}";
    // replace {left} and {right} with delimiters, collect as array
    const patternList = Object.entries(specialDelimiterMap).map(([left, right])=>singlePattern.replace(/{left}/g, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"])(left)).replace(/{right}/g, (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"])(right)));
    const specialDelimiters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"])(Object.keys(specialDelimiterMap).join(''));
    // standard pattern for common delimiters, ignores special delimiters
    const standardDelimiterPattern = String.raw`(?<tag>[^\s${specialDelimiters}])(?:(?!\k<tag>').)*?\k<tag>`;
    // constructs final pattern by joining all cases
    const qStringPattern = `[Qq]'(?:${standardDelimiterPattern}|${patternList.join('|')})'`;
    return qStringPattern;
};
const quotePatterns = {
    // - backtick quoted (using `` to escape)
    '``': '(?:`[^`]*`)+',
    // - Transact-SQL square bracket quoted (using ]] to escape)
    '[]': String.raw`(?:\[[^\]]*\])(?:\][^\]]*\])*`,
    // double-quoted
    '""-qq': String.raw`(?:"[^"]*")+`,
    '""-bs': String.raw`(?:"[^"\\]*(?:\\.[^"\\]*)*")`,
    '""-qq-bs': String.raw`(?:"[^"\\]*(?:\\.[^"\\]*)*")+`,
    '""-raw': String.raw`(?:"[^"]*")`,
    // single-quoted
    "''-qq": String.raw`(?:'[^']*')+`,
    "''-bs": String.raw`(?:'[^'\\]*(?:\\.[^'\\]*)*')`,
    "''-qq-bs": String.raw`(?:'[^'\\]*(?:\\.[^'\\]*)*')+`,
    "''-raw": String.raw`(?:'[^']*')`,
    // PostgreSQL dollar-quoted
    '$$': String.raw`(?<tag>\$\w*\$)[\s\S]*?\k<tag>`,
    // BigQuery '''triple-quoted''' (using \' to escape)
    "'''..'''": String.raw`'''[^\\]*?(?:\\.[^\\]*?)*?'''`,
    // BigQuery """triple-quoted""" (using \" to escape)
    '""".."""': String.raw`"""[^\\]*?(?:\\.[^\\]*?)*?"""`,
    // Hive and Spark variables: ${name}
    '{}': String.raw`(?:\{[^\}]*\})`,
    // Oracle q'' strings: q'<text>' q'|text|' ...
    "q''": buildQStringPatterns()
};
const singleQuotePattern = (quoteTypes)=>{
    if (typeof quoteTypes === 'string') {
        return quotePatterns[quoteTypes];
    } else if ('regex' in quoteTypes) {
        return quoteTypes.regex;
    } else {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["prefixesPattern"])(quoteTypes) + quotePatterns[quoteTypes.quote];
    }
};
const variable = (varTypes)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(varTypes.map((varType)=>'regex' in varType ? varType.regex : singleQuotePattern(varType)).join('|'));
const stringPattern = (quoteTypes)=>quoteTypes.map(singleQuotePattern).join('|');
const string = (quoteTypes)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(stringPattern(quoteTypes));
const identifier = (specialChars = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(identifierPattern(specialChars));
const identifierPattern = ({ first, rest, dashes, allowFirstCharNumber } = {})=>{
    // Unicode letters, diacritical marks and underscore
    const letter = '\\p{Alphabetic}\\p{Mark}_';
    // Numbers 0..9, plus various unicode numbers
    const number = '\\p{Decimal_Number}';
    const firstChars = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"])(first !== null && first !== void 0 ? first : '');
    const restChars = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"])(rest !== null && rest !== void 0 ? rest : '');
    const pattern = allowFirstCharNumber ? `[${letter}${number}${firstChars}][${letter}${number}${restChars}]*` : `[${letter}${firstChars}][${letter}${number}${restChars}]*`;
    return dashes ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withDashes"])(pattern) : pattern;
}; //# sourceMappingURL=regexFactory.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/lineColFromIndex.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Determines line and column number of character index in source code.
 */ __turbopack_context__.s([
    "lineColFromIndex",
    ()=>lineColFromIndex
]);
function lineColFromIndex(source, index) {
    const lines = source.slice(0, index).split(/\n/);
    return {
        line: lines.length,
        col: lines[lines.length - 1].length + 1
    };
} //# sourceMappingURL=lineColFromIndex.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/TokenizerEngine.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TokenizerEngine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$lineColFromIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/lineColFromIndex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/regexUtil.js [app-client] (ecmascript)");
;
;
class TokenizerEngine {
    constructor(rules, dialectName){
        this.rules = rules;
        this.dialectName = dialectName;
        this.input = ''; // The input SQL string to process
        this.index = 0; // Current position in string
    }
    /**
     * Takes a SQL string and breaks it into tokens.
     * Each token is an object with type and value.
     *
     * @param {string} input - The SQL string
     * @returns {Token[]} output token stream
     */ tokenize(input) {
        this.input = input;
        this.index = 0;
        const tokens = [];
        let token;
        // Keep processing the string until end is reached
        while(this.index < this.input.length){
            // skip any preceding whitespace
            const precedingWhitespace = this.getWhitespace();
            if (this.index < this.input.length) {
                // Get the next token and the token type
                token = this.getNextToken();
                if (!token) {
                    throw this.createParseError();
                }
                tokens.push(Object.assign(Object.assign({}, token), {
                    precedingWhitespace
                }));
            }
        }
        return tokens;
    }
    createParseError() {
        const text = this.input.slice(this.index, this.index + 10);
        const { line, col } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$lineColFromIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lineColFromIndex"])(this.input, this.index);
        return new Error(`Parse error: Unexpected "${text}" at line ${line} column ${col}.\n${this.dialectInfo()}`);
    }
    dialectInfo() {
        if (this.dialectName === 'sql') {
            return `This likely happens because you're using the default "sql" dialect.\n` + `If possible, please select a more specific dialect (like sqlite, postgresql, etc).`;
        } else {
            return `SQL dialect used: "${this.dialectName}".`;
        }
    }
    getWhitespace() {
        __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WHITESPACE_REGEX"].lastIndex = this.index;
        const matches = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WHITESPACE_REGEX"].exec(this.input);
        if (matches) {
            // Advance current position by matched whitespace length
            this.index += matches[0].length;
            return matches[0];
        }
        return undefined;
    }
    getNextToken() {
        for (const rule of this.rules){
            const token = this.match(rule);
            if (token) {
                return token;
            }
        }
        return undefined;
    }
    // Attempts to match token rule regex at current position in input
    match(rule) {
        rule.regex.lastIndex = this.index;
        const matches = rule.regex.exec(this.input);
        if (matches) {
            const matchedText = matches[0];
            const token = {
                type: rule.type,
                raw: matchedText,
                text: rule.text ? rule.text(matchedText) : matchedText,
                start: this.index
            };
            if (rule.key) {
                token.key = rule.key(matchedText);
            }
            // Advance current position by matched token length
            this.index += matchedText.length;
            return token;
        }
        return undefined;
    }
} //# sourceMappingURL=TokenizerEngine.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/NestedComment.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NestedComment",
    ()=>NestedComment
]);
const START = /\/\*/uy; // matches: /*
const ANY_CHAR = /[\s\S]/uy; // matches single character
const END = /\*\//uy; // matches: */
class NestedComment {
    constructor(){
        this.lastIndex = 0;
    }
    exec(input) {
        let result = '';
        let match;
        let nestLevel = 0;
        if (match = this.matchSection(START, input)) {
            result += match;
            nestLevel++;
        } else {
            return null;
        }
        while(nestLevel > 0){
            if (match = this.matchSection(START, input)) {
                result += match;
                nestLevel++;
            } else if (match = this.matchSection(END, input)) {
                result += match;
                nestLevel--;
            } else if (match = this.matchSection(ANY_CHAR, input)) {
                result += match;
            } else {
                return null;
            }
        }
        return [
            result
        ];
    }
    matchSection(regex, input) {
        regex.lastIndex = this.lastIndex;
        const matches = regex.exec(input);
        if (matches) {
            this.lastIndex += matches[0].length;
        }
        return matches ? matches[0] : null;
    }
} //# sourceMappingURL=NestedComment.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/Tokenizer.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Tokenizer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/regexFactory.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$TokenizerEngine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/TokenizerEngine.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/regexUtil.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/utils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$NestedComment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/NestedComment.js [app-client] (ecmascript)");
;
;
;
;
;
;
class Tokenizer {
    constructor(cfg, dialectName){
        this.cfg = cfg;
        this.dialectName = dialectName;
        this.rulesBeforeParams = this.buildRulesBeforeParams(cfg);
        this.rulesAfterParams = this.buildRulesAfterParams(cfg);
    }
    tokenize(input, paramTypesOverrides) {
        const rules = [
            ...this.rulesBeforeParams,
            ...this.buildParamRules(this.cfg, paramTypesOverrides),
            ...this.rulesAfterParams
        ];
        const tokens = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$TokenizerEngine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](rules, this.dialectName).tokenize(input);
        return this.cfg.postProcess ? this.cfg.postProcess(tokens) : tokens;
    }
    // These rules can be cached as they only depend on
    // the Tokenizer config options specified for each SQL dialect
    buildRulesBeforeParams(cfg) {
        var _a, _b, _c;
        return this.validRules([
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].DISABLE_COMMENT,
                regex: /(\/\* *sql-formatter-disable *\*\/[\s\S]*?(?:\/\* *sql-formatter-enable *\*\/|$))/uy
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].BLOCK_COMMENT,
                regex: cfg.nestedBlockComments ? new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$NestedComment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NestedComment"]() : /(\/\*[^]*?\*\/)/uy
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].LINE_COMMENT,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lineComment"]((_a = cfg.lineCommentTypes) !== null && _a !== void 0 ? _a : [
                    '--'
                ])
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].QUOTED_IDENTIFIER,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["string"](cfg.identTypes)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].NUMBER,
                regex: cfg.underscoresInNumbers ? /(?:0x[0-9a-fA-F_]+|0b[01_]+|(?:-\s*)?(?:[0-9_]*\.[0-9_]+|[0-9_]+(?:\.[0-9_]*)?)(?:[eE][-+]?[0-9_]+(?:\.[0-9_]+)?)?)(?![\w\p{Alphabetic}])/uy : /(?:0x[0-9a-fA-F]+|0b[01]+|(?:-\s*)?(?:[0-9]*\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+(?:\.[0-9]+)?)?)(?![\w\p{Alphabetic}])/uy
            },
            // RESERVED_KEYWORD_PHRASE and RESERVED_DATA_TYPE_PHRASE  is matched before all other keyword tokens
            // to e.g. prioritize matching "TIMESTAMP WITH TIME ZONE" phrase over "WITH" clause.
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_KEYWORD_PHRASE,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"]((_b = cfg.reservedKeywordPhrases) !== null && _b !== void 0 ? _b : [], cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_DATA_TYPE_PHRASE,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"]((_c = cfg.reservedDataTypePhrases) !== null && _c !== void 0 ? _c : [], cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].CASE,
                regex: /CASE\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].END,
                regex: /END\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].BETWEEN,
                regex: /BETWEEN\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].LIMIT,
                regex: cfg.reservedClauses.includes('LIMIT') ? /LIMIT\b/iuy : undefined,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_CLAUSE,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedClauses, cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_SELECT,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedSelect, cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_SET_OPERATION,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedSetOperations, cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].WHEN,
                regex: /WHEN\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].ELSE,
                regex: /ELSE\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].THEN,
                regex: /THEN\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_JOIN,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedJoins, cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].AND,
                regex: /AND\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OR,
                regex: /OR\b/iuy,
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].XOR,
                regex: cfg.supportsXor ? /XOR\b/iuy : undefined,
                text: toCanonical
            },
            ...cfg.operatorKeyword ? [
                {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OPERATOR,
                    regex: /OPERATOR *\([^)]+\)/iuy
                }
            ] : [],
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_FUNCTION_NAME,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedFunctionNames, cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_DATA_TYPE,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedDataTypes, cfg.identChars),
                text: toCanonical
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_KEYWORD,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reservedWord"](cfg.reservedKeywords, cfg.identChars),
                text: toCanonical
            }
        ]);
    }
    // These rules can also be cached as they only depend on
    // the Tokenizer config options specified for each SQL dialect
    buildRulesAfterParams(cfg) {
        var _a, _b;
        return this.validRules([
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].VARIABLE,
                regex: cfg.variableTypes ? __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["variable"](cfg.variableTypes) : undefined
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].STRING,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["string"](cfg.stringTypes)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["identifier"](cfg.identChars)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].DELIMITER,
                regex: /[;]/uy
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].COMMA,
                regex: /[,]/y
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OPEN_PAREN,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parenthesis"]('open', cfg.extraParens)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].CLOSE_PAREN,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parenthesis"]('close', cfg.extraParens)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OPERATOR,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["operator"]([
                    // standard operators
                    '+',
                    '-',
                    '/',
                    '>',
                    '<',
                    '=',
                    '<>',
                    '<=',
                    '>=',
                    '!=',
                    ...(_a = cfg.operators) !== null && _a !== void 0 ? _a : []
                ])
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].ASTERISK,
                regex: /[*]/uy
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].PROPERTY_ACCESS_OPERATOR,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["operator"]([
                    '.',
                    ...(_b = cfg.propertyAccessOperators) !== null && _b !== void 0 ? _b : []
                ])
            }
        ]);
    }
    // These rules can't be blindly cached as the paramTypesOverrides object
    // can differ on each invocation of the format() function.
    buildParamRules(cfg, paramTypesOverrides) {
        var _a, _b, _c, _d, _e;
        // Each dialect has its own default parameter types (if any),
        // but these can be overriden by the user of the library.
        const paramTypes = {
            named: (paramTypesOverrides === null || paramTypesOverrides === void 0 ? void 0 : paramTypesOverrides.named) || ((_a = cfg.paramTypes) === null || _a === void 0 ? void 0 : _a.named) || [],
            quoted: (paramTypesOverrides === null || paramTypesOverrides === void 0 ? void 0 : paramTypesOverrides.quoted) || ((_b = cfg.paramTypes) === null || _b === void 0 ? void 0 : _b.quoted) || [],
            numbered: (paramTypesOverrides === null || paramTypesOverrides === void 0 ? void 0 : paramTypesOverrides.numbered) || ((_c = cfg.paramTypes) === null || _c === void 0 ? void 0 : _c.numbered) || [],
            positional: typeof (paramTypesOverrides === null || paramTypesOverrides === void 0 ? void 0 : paramTypesOverrides.positional) === 'boolean' ? paramTypesOverrides.positional : (_d = cfg.paramTypes) === null || _d === void 0 ? void 0 : _d.positional,
            custom: (paramTypesOverrides === null || paramTypesOverrides === void 0 ? void 0 : paramTypesOverrides.custom) || ((_e = cfg.paramTypes) === null || _e === void 0 ? void 0 : _e.custom) || []
        };
        return this.validRules([
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].NAMED_PARAMETER,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parameter"](paramTypes.named, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["identifierPattern"](cfg.paramChars || cfg.identChars)),
                key: (v)=>v.slice(1)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].QUOTED_PARAMETER,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parameter"](paramTypes.quoted, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stringPattern"](cfg.identTypes)),
                key: (v)=>(({ tokenKey, quoteChar })=>tokenKey.replace(new RegExp((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["escapeRegExp"])('\\' + quoteChar), 'gu'), quoteChar))({
                        tokenKey: v.slice(2, -1),
                        quoteChar: v.slice(-1)
                    })
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].NUMBERED_PARAMETER,
                regex: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexFactory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parameter"](paramTypes.numbered, '[0-9]+'),
                key: (v)=>v.slice(1)
            },
            {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].POSITIONAL_PARAMETER,
                regex: paramTypes.positional ? /[?]/y : undefined
            },
            ...paramTypes.custom.map((customParam)=>{
                var _a;
                return {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].CUSTOM_PARAMETER,
                    regex: (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$regexUtil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["patternToRegex"])(customParam.regex),
                    key: (_a = customParam.key) !== null && _a !== void 0 ? _a : (v)=>v
                };
            })
        ]);
    }
    // filters out rules for token types whose regex is undefined
    validRules(rules) {
        return rules.filter((rule)=>Boolean(rule.regex));
    }
}
/**
 * Converts keywords (and keyword sequences) to canonical form:
 * - in uppercase
 * - single spaces between words
 */ const toCanonical = (v)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalizeWhitespace"])(v.toUpperCase()); //# sourceMappingURL=Tokenizer.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/dialect.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDialect",
    ()=>createDialect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$Tokenizer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/Tokenizer.js [app-client] (ecmascript)");
;
const cache = new Map();
const createDialect = (options)=>{
    let dialect = cache.get(options);
    if (!dialect) {
        dialect = dialectFromOptions(options);
        cache.set(options, dialect);
    }
    return dialect;
};
const dialectFromOptions = (dialectOptions)=>({
        tokenizer: new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$Tokenizer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](dialectOptions.tokenizerOptions, dialectOptions.name),
        formatOptions: processDialectFormatOptions(dialectOptions.formatOptions)
    });
const processDialectFormatOptions = (options)=>{
    var _a;
    return {
        alwaysDenseOperators: options.alwaysDenseOperators || [],
        onelineClauses: Object.fromEntries(options.onelineClauses.map((name)=>[
                name,
                true
            ])),
        tabularOnelineClauses: Object.fromEntries(((_a = options.tabularOnelineClauses) !== null && _a !== void 0 ? _a : options.onelineClauses).map((name)=>[
                name,
                true
            ]))
    };
}; //# sourceMappingURL=dialect.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/config.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Utility functions for config options
/**
 * Creates a string to use for one step of indentation.
 */ __turbopack_context__.s([
    "indentString",
    ()=>indentString,
    "isTabularStyle",
    ()=>isTabularStyle
]);
function indentString(cfg) {
    if (cfg.indentStyle === 'tabularLeft' || cfg.indentStyle === 'tabularRight') {
        return ' '.repeat(10);
    }
    if (cfg.useTabs) {
        return '\t';
    }
    return ' '.repeat(cfg.tabWidth);
}
function isTabularStyle(cfg) {
    return cfg.indentStyle === 'tabularLeft' || cfg.indentStyle === 'tabularRight';
} //# sourceMappingURL=config.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Params.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Handles placeholder replacement with given params.
 */ __turbopack_context__.s([
    "default",
    ()=>Params
]);
class Params {
    constructor(params){
        this.params = params;
        this.index = 0;
    }
    /**
     * Returns param value that matches given placeholder with param key.
     */ get({ key, text }) {
        if (!this.params) {
            return text;
        }
        if (key) {
            return this.params[key];
        }
        return this.params[this.index++];
    }
    /**
     * Returns index of current positional parameter.
     */ getPositionalParameterIndex() {
        return this.index;
    }
    /**
     * Sets index of current positional parameter.
     */ setPositionalParameterIndex(i) {
        this.index = i;
    }
} //# sourceMappingURL=Params.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/disambiguateTokens.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "disambiguateTokens",
    ()=>disambiguateTokens
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
;
function disambiguateTokens(tokens) {
    return tokens.map(propertyNameKeywordToIdent).map(funcNameToIdent).map(dataTypeToParameterizedDataType).map(identToArrayIdent).map(dataTypeToArrayKeyword);
}
const propertyNameKeywordToIdent = (token, i, tokens)=>{
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isReserved"])(token.type)) {
        const prevToken = prevNonCommentToken(tokens, i);
        if (prevToken && prevToken.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].PROPERTY_ACCESS_OPERATOR) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER,
                text: token.raw
            });
        }
        const nextToken = nextNonCommentToken(tokens, i);
        if (nextToken && nextToken.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].PROPERTY_ACCESS_OPERATOR) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER,
                text: token.raw
            });
        }
    }
    return token;
};
const funcNameToIdent = (token, i, tokens)=>{
    if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_FUNCTION_NAME) {
        const nextToken = nextNonCommentToken(tokens, i);
        if (!nextToken || !isOpenParen(nextToken)) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER,
                text: token.raw
            });
        }
    }
    return token;
};
const dataTypeToParameterizedDataType = (token, i, tokens)=>{
    if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_DATA_TYPE) {
        const nextToken = nextNonCommentToken(tokens, i);
        if (nextToken && isOpenParen(nextToken)) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_PARAMETERIZED_DATA_TYPE
            });
        }
    }
    return token;
};
const identToArrayIdent = (token, i, tokens)=>{
    if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].IDENTIFIER) {
        const nextToken = nextNonCommentToken(tokens, i);
        if (nextToken && isOpenBracket(nextToken)) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].ARRAY_IDENTIFIER
            });
        }
    }
    return token;
};
const dataTypeToArrayKeyword = (token, i, tokens)=>{
    if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_DATA_TYPE) {
        const nextToken = nextNonCommentToken(tokens, i);
        if (nextToken && isOpenBracket(nextToken)) {
            return Object.assign(Object.assign({}, token), {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].ARRAY_KEYWORD
            });
        }
    }
    return token;
};
const prevNonCommentToken = (tokens, index)=>nextNonCommentToken(tokens, index, -1);
const nextNonCommentToken = (tokens, index, dir = 1)=>{
    let i = 1;
    while(tokens[index + i * dir] && isComment(tokens[index + i * dir])){
        i++;
    }
    return tokens[index + i * dir];
};
const isOpenParen = (t)=>t.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OPEN_PAREN && t.text === '(';
const isOpenBracket = (t)=>t.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OPEN_PAREN && t.text === '[';
const isComment = (t)=>t.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].BLOCK_COMMENT || t.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].LINE_COMMENT; //# sourceMappingURL=disambiguateTokens.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/parser/LexerAdapter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LexerAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$lineColFromIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/lineColFromIndex.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
;
;
class LexerAdapter {
    constructor(tokenize){
        this.tokenize = tokenize;
        this.index = 0;
        this.tokens = [];
        this.input = '';
    }
    reset(chunk, _info) {
        this.input = chunk;
        this.index = 0;
        this.tokens = this.tokenize(chunk);
    }
    next() {
        return this.tokens[this.index++];
    }
    save() {}
    formatError(token) {
        const { line, col } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$lineColFromIndex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lineColFromIndex"])(this.input, token.start);
        return `Parse error at token: ${token.text} at line ${line} column ${col}`;
    }
    has(name) {
        return name in __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"];
    }
} //# sourceMappingURL=LexerAdapter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/parser/ast.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NodeType",
    ()=>NodeType
]);
var NodeType;
(function(NodeType) {
    NodeType["statement"] = "statement";
    NodeType["clause"] = "clause";
    NodeType["set_operation"] = "set_operation";
    NodeType["function_call"] = "function_call";
    NodeType["parameterized_data_type"] = "parameterized_data_type";
    NodeType["array_subscript"] = "array_subscript";
    NodeType["property_access"] = "property_access";
    NodeType["parenthesis"] = "parenthesis";
    NodeType["between_predicate"] = "between_predicate";
    NodeType["case_expression"] = "case_expression";
    NodeType["case_when"] = "case_when";
    NodeType["case_else"] = "case_else";
    NodeType["limit_clause"] = "limit_clause";
    NodeType["all_columns_asterisk"] = "all_columns_asterisk";
    NodeType["literal"] = "literal";
    NodeType["identifier"] = "identifier";
    NodeType["keyword"] = "keyword";
    NodeType["data_type"] = "data_type";
    NodeType["parameter"] = "parameter";
    NodeType["operator"] = "operator";
    NodeType["comma"] = "comma";
    NodeType["line_comment"] = "line_comment";
    NodeType["block_comment"] = "block_comment";
    NodeType["disable_comment"] = "disable_comment";
})(NodeType = NodeType || (NodeType = {})); //# sourceMappingURL=ast.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/parser/grammar.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$LexerAdapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/parser/LexerAdapter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/parser/ast.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
function id(d) {
    return d[0];
}
;
;
;
// The lexer here is only to provide the has() method,
// that's used inside the generated grammar definition.
// A proper lexer gets passed to Nearley Parser constructor.
const lexer = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$LexerAdapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]((chunk)=>[]);
// Used for unwrapping grammar rules like:
//
//   rule -> ( foo | bar | baz )
//
// which otherwise produce single element nested inside two arrays
const unwrap = ([[el]])=>el;
const toKeywordNode = (token)=>({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].keyword,
        tokenType: token.type,
        text: token.text,
        raw: token.raw
    });
const toDataTypeNode = (token)=>({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].data_type,
        text: token.text,
        raw: token.raw
    });
const addComments = (node, { leading, trailing })=>{
    if (leading === null || leading === void 0 ? void 0 : leading.length) {
        node = Object.assign(Object.assign({}, node), {
            leadingComments: leading
        });
    }
    if (trailing === null || trailing === void 0 ? void 0 : trailing.length) {
        node = Object.assign(Object.assign({}, node), {
            trailingComments: trailing
        });
    }
    return node;
};
const addCommentsToArray = (nodes, { leading, trailing })=>{
    if (leading === null || leading === void 0 ? void 0 : leading.length) {
        const [first, ...rest] = nodes;
        nodes = [
            addComments(first, {
                leading
            }),
            ...rest
        ];
    }
    if (trailing === null || trailing === void 0 ? void 0 : trailing.length) {
        const lead = nodes.slice(0, -1);
        const last = nodes[nodes.length - 1];
        nodes = [
            ...lead,
            addComments(last, {
                trailing
            })
        ];
    }
    return nodes;
};
;
;
;
;
const grammar = {
    Lexer: lexer,
    ParserRules: [
        {
            "name": "main$ebnf$1",
            "symbols": []
        },
        {
            "name": "main$ebnf$1",
            "symbols": [
                "main$ebnf$1",
                "statement"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "main",
            "symbols": [
                "main$ebnf$1"
            ],
            "postprocess": ([statements])=>{
                const last = statements[statements.length - 1];
                if (last && !last.hasSemicolon) {
                    // we have fully parsed the whole file
                    // discard the last statement when it's empty
                    return last.children.length > 0 ? statements : statements.slice(0, -1);
                } else {
                    // parsing still in progress, do nothing
                    return statements;
                }
            }
        },
        {
            "name": "statement$subexpression$1",
            "symbols": [
                lexer.has("DELIMITER") ? {
                    type: "DELIMITER"
                } : DELIMITER
            ]
        },
        {
            "name": "statement$subexpression$1",
            "symbols": [
                lexer.has("EOF") ? {
                    type: "EOF"
                } : EOF
            ]
        },
        {
            "name": "statement",
            "symbols": [
                "expressions_or_clauses",
                "statement$subexpression$1"
            ],
            "postprocess": ([children, [delimiter]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].statement,
                    children,
                    hasSemicolon: delimiter.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].DELIMITER
                })
        },
        {
            "name": "expressions_or_clauses$ebnf$1",
            "symbols": []
        },
        {
            "name": "expressions_or_clauses$ebnf$1",
            "symbols": [
                "expressions_or_clauses$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "expressions_or_clauses$ebnf$2",
            "symbols": []
        },
        {
            "name": "expressions_or_clauses$ebnf$2",
            "symbols": [
                "expressions_or_clauses$ebnf$2",
                "clause"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "expressions_or_clauses",
            "symbols": [
                "expressions_or_clauses$ebnf$1",
                "expressions_or_clauses$ebnf$2"
            ],
            "postprocess": ([expressions, clauses])=>[
                    ...expressions,
                    ...clauses
                ]
        },
        {
            "name": "clause$subexpression$1",
            "symbols": [
                "limit_clause"
            ]
        },
        {
            "name": "clause$subexpression$1",
            "symbols": [
                "select_clause"
            ]
        },
        {
            "name": "clause$subexpression$1",
            "symbols": [
                "other_clause"
            ]
        },
        {
            "name": "clause$subexpression$1",
            "symbols": [
                "set_operation"
            ]
        },
        {
            "name": "clause",
            "symbols": [
                "clause$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "limit_clause$ebnf$1$subexpression$1$ebnf$1",
            "symbols": [
                "free_form_sql"
            ]
        },
        {
            "name": "limit_clause$ebnf$1$subexpression$1$ebnf$1",
            "symbols": [
                "limit_clause$ebnf$1$subexpression$1$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "limit_clause$ebnf$1$subexpression$1",
            "symbols": [
                lexer.has("COMMA") ? {
                    type: "COMMA"
                } : COMMA,
                "limit_clause$ebnf$1$subexpression$1$ebnf$1"
            ]
        },
        {
            "name": "limit_clause$ebnf$1",
            "symbols": [
                "limit_clause$ebnf$1$subexpression$1"
            ],
            "postprocess": id
        },
        {
            "name": "limit_clause$ebnf$1",
            "symbols": [],
            "postprocess": ()=>null
        },
        {
            "name": "limit_clause",
            "symbols": [
                lexer.has("LIMIT") ? {
                    type: "LIMIT"
                } : LIMIT,
                "_",
                "expression_chain_",
                "limit_clause$ebnf$1"
            ],
            "postprocess": ([limitToken, _, exp1, optional])=>{
                if (optional) {
                    const [comma, exp2] = optional;
                    return {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].limit_clause,
                        limitKw: addComments(toKeywordNode(limitToken), {
                            trailing: _
                        }),
                        offset: exp1,
                        count: exp2
                    };
                } else {
                    return {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].limit_clause,
                        limitKw: addComments(toKeywordNode(limitToken), {
                            trailing: _
                        }),
                        count: exp1
                    };
                }
            }
        },
        {
            "name": "select_clause$subexpression$1$ebnf$1",
            "symbols": []
        },
        {
            "name": "select_clause$subexpression$1$ebnf$1",
            "symbols": [
                "select_clause$subexpression$1$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "select_clause$subexpression$1",
            "symbols": [
                "all_columns_asterisk",
                "select_clause$subexpression$1$ebnf$1"
            ]
        },
        {
            "name": "select_clause$subexpression$1$ebnf$2",
            "symbols": []
        },
        {
            "name": "select_clause$subexpression$1$ebnf$2",
            "symbols": [
                "select_clause$subexpression$1$ebnf$2",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "select_clause$subexpression$1",
            "symbols": [
                "asteriskless_free_form_sql",
                "select_clause$subexpression$1$ebnf$2"
            ]
        },
        {
            "name": "select_clause",
            "symbols": [
                lexer.has("RESERVED_SELECT") ? {
                    type: "RESERVED_SELECT"
                } : RESERVED_SELECT,
                "select_clause$subexpression$1"
            ],
            "postprocess": ([nameToken, [exp, expressions]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].clause,
                    nameKw: toKeywordNode(nameToken),
                    children: [
                        exp,
                        ...expressions
                    ]
                })
        },
        {
            "name": "select_clause",
            "symbols": [
                lexer.has("RESERVED_SELECT") ? {
                    type: "RESERVED_SELECT"
                } : RESERVED_SELECT
            ],
            "postprocess": ([nameToken])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].clause,
                    nameKw: toKeywordNode(nameToken),
                    children: []
                })
        },
        {
            "name": "all_columns_asterisk",
            "symbols": [
                lexer.has("ASTERISK") ? {
                    type: "ASTERISK"
                } : ASTERISK
            ],
            "postprocess": ()=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].all_columns_asterisk
                })
        },
        {
            "name": "other_clause$ebnf$1",
            "symbols": []
        },
        {
            "name": "other_clause$ebnf$1",
            "symbols": [
                "other_clause$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "other_clause",
            "symbols": [
                lexer.has("RESERVED_CLAUSE") ? {
                    type: "RESERVED_CLAUSE"
                } : RESERVED_CLAUSE,
                "other_clause$ebnf$1"
            ],
            "postprocess": ([nameToken, children])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].clause,
                    nameKw: toKeywordNode(nameToken),
                    children
                })
        },
        {
            "name": "set_operation$ebnf$1",
            "symbols": []
        },
        {
            "name": "set_operation$ebnf$1",
            "symbols": [
                "set_operation$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "set_operation",
            "symbols": [
                lexer.has("RESERVED_SET_OPERATION") ? {
                    type: "RESERVED_SET_OPERATION"
                } : RESERVED_SET_OPERATION,
                "set_operation$ebnf$1"
            ],
            "postprocess": ([nameToken, children])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].set_operation,
                    nameKw: toKeywordNode(nameToken),
                    children
                })
        },
        {
            "name": "expression_chain_$ebnf$1",
            "symbols": [
                "expression_with_comments_"
            ]
        },
        {
            "name": "expression_chain_$ebnf$1",
            "symbols": [
                "expression_chain_$ebnf$1",
                "expression_with_comments_"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "expression_chain_",
            "symbols": [
                "expression_chain_$ebnf$1"
            ],
            "postprocess": id
        },
        {
            "name": "expression_chain$ebnf$1",
            "symbols": []
        },
        {
            "name": "expression_chain$ebnf$1",
            "symbols": [
                "expression_chain$ebnf$1",
                "_expression_with_comments"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "expression_chain",
            "symbols": [
                "expression",
                "expression_chain$ebnf$1"
            ],
            "postprocess": ([expr, chain])=>[
                    expr,
                    ...chain
                ]
        },
        {
            "name": "andless_expression_chain$ebnf$1",
            "symbols": []
        },
        {
            "name": "andless_expression_chain$ebnf$1",
            "symbols": [
                "andless_expression_chain$ebnf$1",
                "_andless_expression_with_comments"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "andless_expression_chain",
            "symbols": [
                "andless_expression",
                "andless_expression_chain$ebnf$1"
            ],
            "postprocess": ([expr, chain])=>[
                    expr,
                    ...chain
                ]
        },
        {
            "name": "expression_with_comments_",
            "symbols": [
                "expression",
                "_"
            ],
            "postprocess": ([expr, _])=>addComments(expr, {
                    trailing: _
                })
        },
        {
            "name": "_expression_with_comments",
            "symbols": [
                "_",
                "expression"
            ],
            "postprocess": ([_, expr])=>addComments(expr, {
                    leading: _
                })
        },
        {
            "name": "_andless_expression_with_comments",
            "symbols": [
                "_",
                "andless_expression"
            ],
            "postprocess": ([_, expr])=>addComments(expr, {
                    leading: _
                })
        },
        {
            "name": "free_form_sql$subexpression$1",
            "symbols": [
                "asteriskless_free_form_sql"
            ]
        },
        {
            "name": "free_form_sql$subexpression$1",
            "symbols": [
                "asterisk"
            ]
        },
        {
            "name": "free_form_sql",
            "symbols": [
                "free_form_sql$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "asteriskless_free_form_sql$subexpression$1",
            "symbols": [
                "asteriskless_andless_expression"
            ]
        },
        {
            "name": "asteriskless_free_form_sql$subexpression$1",
            "symbols": [
                "logic_operator"
            ]
        },
        {
            "name": "asteriskless_free_form_sql$subexpression$1",
            "symbols": [
                "comma"
            ]
        },
        {
            "name": "asteriskless_free_form_sql$subexpression$1",
            "symbols": [
                "comment"
            ]
        },
        {
            "name": "asteriskless_free_form_sql$subexpression$1",
            "symbols": [
                "other_keyword"
            ]
        },
        {
            "name": "asteriskless_free_form_sql",
            "symbols": [
                "asteriskless_free_form_sql$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "expression$subexpression$1",
            "symbols": [
                "andless_expression"
            ]
        },
        {
            "name": "expression$subexpression$1",
            "symbols": [
                "logic_operator"
            ]
        },
        {
            "name": "expression",
            "symbols": [
                "expression$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "andless_expression$subexpression$1",
            "symbols": [
                "asteriskless_andless_expression"
            ]
        },
        {
            "name": "andless_expression$subexpression$1",
            "symbols": [
                "asterisk"
            ]
        },
        {
            "name": "andless_expression",
            "symbols": [
                "andless_expression$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "asteriskless_andless_expression$subexpression$1",
            "symbols": [
                "atomic_expression"
            ]
        },
        {
            "name": "asteriskless_andless_expression$subexpression$1",
            "symbols": [
                "between_predicate"
            ]
        },
        {
            "name": "asteriskless_andless_expression$subexpression$1",
            "symbols": [
                "case_expression"
            ]
        },
        {
            "name": "asteriskless_andless_expression",
            "symbols": [
                "asteriskless_andless_expression$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "array_subscript"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "function_call"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "property_access"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "parenthesis"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "curly_braces"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "square_brackets"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "operator"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "identifier"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "parameter"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "literal"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "data_type"
            ]
        },
        {
            "name": "atomic_expression$subexpression$1",
            "symbols": [
                "keyword"
            ]
        },
        {
            "name": "atomic_expression",
            "symbols": [
                "atomic_expression$subexpression$1"
            ],
            "postprocess": unwrap
        },
        {
            "name": "array_subscript",
            "symbols": [
                lexer.has("ARRAY_IDENTIFIER") ? {
                    type: "ARRAY_IDENTIFIER"
                } : ARRAY_IDENTIFIER,
                "_",
                "square_brackets"
            ],
            "postprocess": ([arrayToken, _, brackets])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].array_subscript,
                    array: addComments({
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].identifier,
                        quoted: false,
                        text: arrayToken.text
                    }, {
                        trailing: _
                    }),
                    parenthesis: brackets
                })
        },
        {
            "name": "array_subscript",
            "symbols": [
                lexer.has("ARRAY_KEYWORD") ? {
                    type: "ARRAY_KEYWORD"
                } : ARRAY_KEYWORD,
                "_",
                "square_brackets"
            ],
            "postprocess": ([arrayToken, _, brackets])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].array_subscript,
                    array: addComments(toKeywordNode(arrayToken), {
                        trailing: _
                    }),
                    parenthesis: brackets
                })
        },
        {
            "name": "function_call",
            "symbols": [
                lexer.has("RESERVED_FUNCTION_NAME") ? {
                    type: "RESERVED_FUNCTION_NAME"
                } : RESERVED_FUNCTION_NAME,
                "_",
                "parenthesis"
            ],
            "postprocess": ([nameToken, _, parens])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].function_call,
                    nameKw: addComments(toKeywordNode(nameToken), {
                        trailing: _
                    }),
                    parenthesis: parens
                })
        },
        {
            "name": "parenthesis",
            "symbols": [
                {
                    "literal": "("
                },
                "expressions_or_clauses",
                {
                    "literal": ")"
                }
            ],
            "postprocess": ([open, children, close])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parenthesis,
                    children: children,
                    openParen: "(",
                    closeParen: ")"
                })
        },
        {
            "name": "curly_braces$ebnf$1",
            "symbols": []
        },
        {
            "name": "curly_braces$ebnf$1",
            "symbols": [
                "curly_braces$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "curly_braces",
            "symbols": [
                {
                    "literal": "{"
                },
                "curly_braces$ebnf$1",
                {
                    "literal": "}"
                }
            ],
            "postprocess": ([open, children, close])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parenthesis,
                    children: children,
                    openParen: "{",
                    closeParen: "}"
                })
        },
        {
            "name": "square_brackets$ebnf$1",
            "symbols": []
        },
        {
            "name": "square_brackets$ebnf$1",
            "symbols": [
                "square_brackets$ebnf$1",
                "free_form_sql"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "square_brackets",
            "symbols": [
                {
                    "literal": "["
                },
                "square_brackets$ebnf$1",
                {
                    "literal": "]"
                }
            ],
            "postprocess": ([open, children, close])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parenthesis,
                    children: children,
                    openParen: "[",
                    closeParen: "]"
                })
        },
        {
            "name": "property_access$subexpression$1",
            "symbols": [
                "identifier"
            ]
        },
        {
            "name": "property_access$subexpression$1",
            "symbols": [
                "array_subscript"
            ]
        },
        {
            "name": "property_access$subexpression$1",
            "symbols": [
                "all_columns_asterisk"
            ]
        },
        {
            "name": "property_access$subexpression$1",
            "symbols": [
                "parameter"
            ]
        },
        {
            "name": "property_access",
            "symbols": [
                "atomic_expression",
                "_",
                lexer.has("PROPERTY_ACCESS_OPERATOR") ? {
                    type: "PROPERTY_ACCESS_OPERATOR"
                } : PROPERTY_ACCESS_OPERATOR,
                "_",
                "property_access$subexpression$1"
            ],
            "postprocess": // Allowing property to be <array_subscript> is currently a hack.
            // A better way would be to allow <property_access> on the left side of array_subscript,
            // but we currently can't do that because of another hack that requires
            // %ARRAY_IDENTIFIER on the left side of <array_subscript>.
            ([object, _1, dot, _2, [property]])=>{
                return {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].property_access,
                    object: addComments(object, {
                        trailing: _1
                    }),
                    operator: dot.text,
                    property: addComments(property, {
                        leading: _2
                    })
                };
            }
        },
        {
            "name": "between_predicate",
            "symbols": [
                lexer.has("BETWEEN") ? {
                    type: "BETWEEN"
                } : BETWEEN,
                "_",
                "andless_expression_chain",
                "_",
                lexer.has("AND") ? {
                    type: "AND"
                } : AND,
                "_",
                "andless_expression"
            ],
            "postprocess": ([betweenToken, _1, expr1, _2, andToken, _3, expr2])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].between_predicate,
                    betweenKw: toKeywordNode(betweenToken),
                    expr1: addCommentsToArray(expr1, {
                        leading: _1,
                        trailing: _2
                    }),
                    andKw: toKeywordNode(andToken),
                    expr2: [
                        addComments(expr2, {
                            leading: _3
                        })
                    ]
                })
        },
        {
            "name": "case_expression$ebnf$1",
            "symbols": [
                "expression_chain_"
            ],
            "postprocess": id
        },
        {
            "name": "case_expression$ebnf$1",
            "symbols": [],
            "postprocess": ()=>null
        },
        {
            "name": "case_expression$ebnf$2",
            "symbols": []
        },
        {
            "name": "case_expression$ebnf$2",
            "symbols": [
                "case_expression$ebnf$2",
                "case_clause"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "case_expression",
            "symbols": [
                lexer.has("CASE") ? {
                    type: "CASE"
                } : CASE,
                "_",
                "case_expression$ebnf$1",
                "case_expression$ebnf$2",
                lexer.has("END") ? {
                    type: "END"
                } : END
            ],
            "postprocess": ([caseToken, _, expr, clauses, endToken])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].case_expression,
                    caseKw: addComments(toKeywordNode(caseToken), {
                        trailing: _
                    }),
                    endKw: toKeywordNode(endToken),
                    expr: expr || [],
                    clauses
                })
        },
        {
            "name": "case_clause",
            "symbols": [
                lexer.has("WHEN") ? {
                    type: "WHEN"
                } : WHEN,
                "_",
                "expression_chain_",
                lexer.has("THEN") ? {
                    type: "THEN"
                } : THEN,
                "_",
                "expression_chain_"
            ],
            "postprocess": ([whenToken, _1, cond, thenToken, _2, expr])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].case_when,
                    whenKw: addComments(toKeywordNode(whenToken), {
                        trailing: _1
                    }),
                    thenKw: addComments(toKeywordNode(thenToken), {
                        trailing: _2
                    }),
                    condition: cond,
                    result: expr
                })
        },
        {
            "name": "case_clause",
            "symbols": [
                lexer.has("ELSE") ? {
                    type: "ELSE"
                } : ELSE,
                "_",
                "expression_chain_"
            ],
            "postprocess": ([elseToken, _, expr])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].case_else,
                    elseKw: addComments(toKeywordNode(elseToken), {
                        trailing: _
                    }),
                    result: expr
                })
        },
        {
            "name": "comma$subexpression$1",
            "symbols": [
                lexer.has("COMMA") ? {
                    type: "COMMA"
                } : COMMA
            ]
        },
        {
            "name": "comma",
            "symbols": [
                "comma$subexpression$1"
            ],
            "postprocess": ([[token]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].comma
                })
        },
        {
            "name": "asterisk$subexpression$1",
            "symbols": [
                lexer.has("ASTERISK") ? {
                    type: "ASTERISK"
                } : ASTERISK
            ]
        },
        {
            "name": "asterisk",
            "symbols": [
                "asterisk$subexpression$1"
            ],
            "postprocess": ([[token]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].operator,
                    text: token.text
                })
        },
        {
            "name": "operator$subexpression$1",
            "symbols": [
                lexer.has("OPERATOR") ? {
                    type: "OPERATOR"
                } : OPERATOR
            ]
        },
        {
            "name": "operator",
            "symbols": [
                "operator$subexpression$1"
            ],
            "postprocess": ([[token]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].operator,
                    text: token.text
                })
        },
        {
            "name": "identifier$subexpression$1",
            "symbols": [
                lexer.has("IDENTIFIER") ? {
                    type: "IDENTIFIER"
                } : IDENTIFIER
            ]
        },
        {
            "name": "identifier$subexpression$1",
            "symbols": [
                lexer.has("QUOTED_IDENTIFIER") ? {
                    type: "QUOTED_IDENTIFIER"
                } : QUOTED_IDENTIFIER
            ]
        },
        {
            "name": "identifier$subexpression$1",
            "symbols": [
                lexer.has("VARIABLE") ? {
                    type: "VARIABLE"
                } : VARIABLE
            ]
        },
        {
            "name": "identifier",
            "symbols": [
                "identifier$subexpression$1"
            ],
            "postprocess": ([[token]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].identifier,
                    quoted: token.type !== "IDENTIFIER",
                    text: token.text
                })
        },
        {
            "name": "parameter$subexpression$1",
            "symbols": [
                lexer.has("NAMED_PARAMETER") ? {
                    type: "NAMED_PARAMETER"
                } : NAMED_PARAMETER
            ]
        },
        {
            "name": "parameter$subexpression$1",
            "symbols": [
                lexer.has("QUOTED_PARAMETER") ? {
                    type: "QUOTED_PARAMETER"
                } : QUOTED_PARAMETER
            ]
        },
        {
            "name": "parameter$subexpression$1",
            "symbols": [
                lexer.has("NUMBERED_PARAMETER") ? {
                    type: "NUMBERED_PARAMETER"
                } : NUMBERED_PARAMETER
            ]
        },
        {
            "name": "parameter$subexpression$1",
            "symbols": [
                lexer.has("POSITIONAL_PARAMETER") ? {
                    type: "POSITIONAL_PARAMETER"
                } : POSITIONAL_PARAMETER
            ]
        },
        {
            "name": "parameter$subexpression$1",
            "symbols": [
                lexer.has("CUSTOM_PARAMETER") ? {
                    type: "CUSTOM_PARAMETER"
                } : CUSTOM_PARAMETER
            ]
        },
        {
            "name": "parameter",
            "symbols": [
                "parameter$subexpression$1"
            ],
            "postprocess": ([[token]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parameter,
                    key: token.key,
                    text: token.text
                })
        },
        {
            "name": "literal$subexpression$1",
            "symbols": [
                lexer.has("NUMBER") ? {
                    type: "NUMBER"
                } : NUMBER
            ]
        },
        {
            "name": "literal$subexpression$1",
            "symbols": [
                lexer.has("STRING") ? {
                    type: "STRING"
                } : STRING
            ]
        },
        {
            "name": "literal",
            "symbols": [
                "literal$subexpression$1"
            ],
            "postprocess": ([[token]])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].literal,
                    text: token.text
                })
        },
        {
            "name": "keyword$subexpression$1",
            "symbols": [
                lexer.has("RESERVED_KEYWORD") ? {
                    type: "RESERVED_KEYWORD"
                } : RESERVED_KEYWORD
            ]
        },
        {
            "name": "keyword$subexpression$1",
            "symbols": [
                lexer.has("RESERVED_KEYWORD_PHRASE") ? {
                    type: "RESERVED_KEYWORD_PHRASE"
                } : RESERVED_KEYWORD_PHRASE
            ]
        },
        {
            "name": "keyword$subexpression$1",
            "symbols": [
                lexer.has("RESERVED_JOIN") ? {
                    type: "RESERVED_JOIN"
                } : RESERVED_JOIN
            ]
        },
        {
            "name": "keyword",
            "symbols": [
                "keyword$subexpression$1"
            ],
            "postprocess": ([[token]])=>toKeywordNode(token)
        },
        {
            "name": "data_type$subexpression$1",
            "symbols": [
                lexer.has("RESERVED_DATA_TYPE") ? {
                    type: "RESERVED_DATA_TYPE"
                } : RESERVED_DATA_TYPE
            ]
        },
        {
            "name": "data_type$subexpression$1",
            "symbols": [
                lexer.has("RESERVED_DATA_TYPE_PHRASE") ? {
                    type: "RESERVED_DATA_TYPE_PHRASE"
                } : RESERVED_DATA_TYPE_PHRASE
            ]
        },
        {
            "name": "data_type",
            "symbols": [
                "data_type$subexpression$1"
            ],
            "postprocess": ([[token]])=>toDataTypeNode(token)
        },
        {
            "name": "data_type",
            "symbols": [
                lexer.has("RESERVED_PARAMETERIZED_DATA_TYPE") ? {
                    type: "RESERVED_PARAMETERIZED_DATA_TYPE"
                } : RESERVED_PARAMETERIZED_DATA_TYPE,
                "_",
                "parenthesis"
            ],
            "postprocess": ([nameToken, _, parens])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parameterized_data_type,
                    dataType: addComments(toDataTypeNode(nameToken), {
                        trailing: _
                    }),
                    parenthesis: parens
                })
        },
        {
            "name": "logic_operator$subexpression$1",
            "symbols": [
                lexer.has("AND") ? {
                    type: "AND"
                } : AND
            ]
        },
        {
            "name": "logic_operator$subexpression$1",
            "symbols": [
                lexer.has("OR") ? {
                    type: "OR"
                } : OR
            ]
        },
        {
            "name": "logic_operator$subexpression$1",
            "symbols": [
                lexer.has("XOR") ? {
                    type: "XOR"
                } : XOR
            ]
        },
        {
            "name": "logic_operator",
            "symbols": [
                "logic_operator$subexpression$1"
            ],
            "postprocess": ([[token]])=>toKeywordNode(token)
        },
        {
            "name": "other_keyword$subexpression$1",
            "symbols": [
                lexer.has("WHEN") ? {
                    type: "WHEN"
                } : WHEN
            ]
        },
        {
            "name": "other_keyword$subexpression$1",
            "symbols": [
                lexer.has("THEN") ? {
                    type: "THEN"
                } : THEN
            ]
        },
        {
            "name": "other_keyword$subexpression$1",
            "symbols": [
                lexer.has("ELSE") ? {
                    type: "ELSE"
                } : ELSE
            ]
        },
        {
            "name": "other_keyword$subexpression$1",
            "symbols": [
                lexer.has("END") ? {
                    type: "END"
                } : END
            ]
        },
        {
            "name": "other_keyword",
            "symbols": [
                "other_keyword$subexpression$1"
            ],
            "postprocess": ([[token]])=>toKeywordNode(token)
        },
        {
            "name": "_$ebnf$1",
            "symbols": []
        },
        {
            "name": "_$ebnf$1",
            "symbols": [
                "_$ebnf$1",
                "comment"
            ],
            "postprocess": (d)=>d[0].concat([
                    d[1]
                ])
        },
        {
            "name": "_",
            "symbols": [
                "_$ebnf$1"
            ],
            "postprocess": ([comments])=>comments
        },
        {
            "name": "comment",
            "symbols": [
                lexer.has("LINE_COMMENT") ? {
                    type: "LINE_COMMENT"
                } : LINE_COMMENT
            ],
            "postprocess": ([token])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].line_comment,
                    text: token.text,
                    precedingWhitespace: token.precedingWhitespace
                })
        },
        {
            "name": "comment",
            "symbols": [
                lexer.has("BLOCK_COMMENT") ? {
                    type: "BLOCK_COMMENT"
                } : BLOCK_COMMENT
            ],
            "postprocess": ([token])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].block_comment,
                    text: token.text,
                    precedingWhitespace: token.precedingWhitespace
                })
        },
        {
            "name": "comment",
            "symbols": [
                lexer.has("DISABLE_COMMENT") ? {
                    type: "DISABLE_COMMENT"
                } : DISABLE_COMMENT
            ],
            "postprocess": ([token])=>({
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].disable_comment,
                    text: token.text,
                    precedingWhitespace: token.precedingWhitespace
                })
        }
    ],
    ParserStart: "main"
};
const __TURBOPACK__default__export__ = grammar;
 //# sourceMappingURL=grammar.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/parser/createParser.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createParser",
    ()=>createParser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$nearley$2f$lib$2f$nearley$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/nearley/lib/nearley.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$disambiguateTokens$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/disambiguateTokens.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$grammar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/parser/grammar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$LexerAdapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/parser/LexerAdapter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
;
;
;
;
;
const { Parser: NearleyParser, Grammar } = __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$nearley$2f$lib$2f$nearley$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"];
function createParser(tokenizer) {
    let paramTypesOverrides = {};
    const lexer = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$LexerAdapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]((chunk)=>[
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$disambiguateTokens$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["disambiguateTokens"])(tokenizer.tokenize(chunk, paramTypesOverrides)),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEofToken"])(chunk.length)
        ]);
    const parser = new NearleyParser(Grammar.fromCompiled(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$grammar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]), {
        lexer
    });
    return {
        parse: (sql, paramTypes)=>{
            // share paramTypesOverrides with Tokenizer
            paramTypesOverrides = paramTypes;
            const { results } = parser.feed(sql);
            if (results.length === 1) {
                return results[0];
            } else if (results.length === 0) {
                // Ideally we would report a line number where the parser failed,
                // but I haven't found a way to get this info from Nearley :(
                throw new Error('Parse error: Invalid SQL');
            } else {
                throw new Error(`Parse error: Ambiguous grammar\n${JSON.stringify(results, undefined, 2)}`);
            }
        }
    };
} //# sourceMappingURL=createParser.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Layout.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WS",
    ()=>WS,
    "default",
    ()=>Layout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/utils.js [app-client] (ecmascript)");
;
var WS;
(function(WS) {
    WS[WS["SPACE"] = 0] = "SPACE";
    WS[WS["NO_SPACE"] = 1] = "NO_SPACE";
    WS[WS["NO_NEWLINE"] = 2] = "NO_NEWLINE";
    WS[WS["NEWLINE"] = 3] = "NEWLINE";
    WS[WS["MANDATORY_NEWLINE"] = 4] = "MANDATORY_NEWLINE";
    WS[WS["INDENT"] = 5] = "INDENT";
    WS[WS["SINGLE_INDENT"] = 6] = "SINGLE_INDENT";
})(WS = WS || (WS = {}));
class Layout {
    constructor(indentation){
        this.indentation = indentation;
        this.items = [];
    }
    /**
     * Appends token strings and whitespace modifications to SQL string.
     */ add(...items) {
        for (const item of items){
            switch(item){
                case WS.SPACE:
                    this.items.push(WS.SPACE);
                    break;
                case WS.NO_SPACE:
                    this.trimHorizontalWhitespace();
                    break;
                case WS.NO_NEWLINE:
                    this.trimWhitespace();
                    break;
                case WS.NEWLINE:
                    this.trimHorizontalWhitespace();
                    this.addNewline(WS.NEWLINE);
                    break;
                case WS.MANDATORY_NEWLINE:
                    this.trimHorizontalWhitespace();
                    this.addNewline(WS.MANDATORY_NEWLINE);
                    break;
                case WS.INDENT:
                    this.addIndentation();
                    break;
                case WS.SINGLE_INDENT:
                    this.items.push(WS.SINGLE_INDENT);
                    break;
                default:
                    this.items.push(item);
            }
        }
    }
    trimHorizontalWhitespace() {
        while(isHorizontalWhitespace((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["last"])(this.items))){
            this.items.pop();
        }
    }
    trimWhitespace() {
        while(isRemovableWhitespace((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["last"])(this.items))){
            this.items.pop();
        }
    }
    addNewline(newline) {
        if (this.items.length > 0) {
            switch((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["last"])(this.items)){
                case WS.NEWLINE:
                    this.items.pop();
                    this.items.push(newline);
                    break;
                case WS.MANDATORY_NEWLINE:
                    break;
                default:
                    this.items.push(newline);
                    break;
            }
        }
    }
    addIndentation() {
        for(let i = 0; i < this.indentation.getLevel(); i++){
            this.items.push(WS.SINGLE_INDENT);
        }
    }
    /**
     * Returns the final SQL string.
     */ toString() {
        return this.items.map((item)=>this.itemToString(item)).join('');
    }
    /**
     * Returns the internal layout data
     */ getLayoutItems() {
        return this.items;
    }
    itemToString(item) {
        switch(item){
            case WS.SPACE:
                return ' ';
            case WS.NEWLINE:
            case WS.MANDATORY_NEWLINE:
                return '\n';
            case WS.SINGLE_INDENT:
                return this.indentation.getSingleIndent();
            default:
                return item;
        }
    }
}
const isHorizontalWhitespace = (item)=>item === WS.SPACE || item === WS.SINGLE_INDENT;
const isRemovableWhitespace = (item)=>item === WS.SPACE || item === WS.SINGLE_INDENT || item === WS.NEWLINE; //# sourceMappingURL=Layout.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/tabularStyle.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>toTabularFormat,
    "isTabularToken",
    ()=>isTabularToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
;
function toTabularFormat(tokenText, indentStyle) {
    if (indentStyle === 'standard') {
        return tokenText;
    }
    let tail = []; // rest of keyword
    if (tokenText.length >= 10 && tokenText.includes(' ')) {
        // split for long keywords like INNER JOIN or UNION DISTINCT
        [tokenText, ...tail] = tokenText.split(' ');
    }
    if (indentStyle === 'tabularLeft') {
        tokenText = tokenText.padEnd(9, ' ');
    } else {
        tokenText = tokenText.padStart(9, ' ');
    }
    return tokenText + [
        '',
        ...tail
    ].join(' ');
}
function isTabularToken(type) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLogicalOperator"])(type) || type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_CLAUSE || type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_SELECT || type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_SET_OPERATION || type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_JOIN || type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].LIMIT;
} //# sourceMappingURL=tabularStyle.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Indentation.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Indentation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/utils.js [app-client] (ecmascript)");
;
const INDENT_TYPE_TOP_LEVEL = 'top-level';
const INDENT_TYPE_BLOCK_LEVEL = 'block-level';
class Indentation {
    /**
     * @param {string} indent A string to indent with
     */ constructor(indent){
        this.indent = indent;
        this.indentTypes = [];
    }
    /**
     * Returns indentation string for single indentation step.
     */ getSingleIndent() {
        return this.indent;
    }
    /**
     * Returns current indentation level
     */ getLevel() {
        return this.indentTypes.length;
    }
    /**
     * Increases indentation by one top-level indent.
     */ increaseTopLevel() {
        this.indentTypes.push(INDENT_TYPE_TOP_LEVEL);
    }
    /**
     * Increases indentation by one block-level indent.
     */ increaseBlockLevel() {
        this.indentTypes.push(INDENT_TYPE_BLOCK_LEVEL);
    }
    /**
     * Decreases indentation by one top-level indent.
     * Does nothing when the previous indent is not top-level.
     */ decreaseTopLevel() {
        if (this.indentTypes.length > 0 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["last"])(this.indentTypes) === INDENT_TYPE_TOP_LEVEL) {
            this.indentTypes.pop();
        }
    }
    /**
     * Decreases indentation by one block-level indent.
     * If there are top-level indents within the block-level indent,
     * throws away these as well.
     */ decreaseBlockLevel() {
        while(this.indentTypes.length > 0){
            const type = this.indentTypes.pop();
            if (type !== INDENT_TYPE_TOP_LEVEL) {
                break;
            }
        }
    }
} //# sourceMappingURL=Indentation.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/InlineLayout.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// eslint-disable-next-line max-classes-per-file
__turbopack_context__.s([
    "InlineLayoutError",
    ()=>InlineLayoutError,
    "default",
    ()=>InlineLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Indentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Indentation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Layout.js [app-client] (ecmascript)");
;
;
class InlineLayout extends __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] {
    constructor(expressionWidth){
        super(new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Indentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]('')); // no indentation in inline layout
        this.expressionWidth = expressionWidth;
        this.length = 0;
        // Keeps track of the trailing whitespace,
        // so that we can decrease length when encountering WS.NO_SPACE,
        // but only when there actually is a space to remove.
        this.trailingSpace = false;
    }
    add(...items) {
        items.forEach((item)=>this.addToLength(item));
        if (this.length > this.expressionWidth) {
            // We have exceeded the allowable width
            throw new InlineLayoutError();
        }
        super.add(...items);
    }
    addToLength(item) {
        if (typeof item === 'string') {
            this.length += item.length;
            this.trailingSpace = false;
        } else if (item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].MANDATORY_NEWLINE || item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE) {
            // newlines not allowed within inline block
            throw new InlineLayoutError();
        } else if (item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT || item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SINGLE_INDENT || item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE) {
            if (!this.trailingSpace) {
                this.length++;
                this.trailingSpace = true;
            }
        } else if (item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_NEWLINE || item === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE) {
            if (this.trailingSpace) {
                this.trailingSpace = false;
                this.length--;
            }
        }
    }
}
class InlineLayoutError extends Error {
} //# sourceMappingURL=InlineLayout.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/ExpressionFormatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExpressionFormatter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/utils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/config.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/lexer/token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/parser/ast.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Layout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$tabularStyle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/tabularStyle.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$InlineLayout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/InlineLayout.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
class ExpressionFormatter {
    constructor({ cfg, dialectCfg, params, layout, inline = false }){
        this.inline = false;
        this.nodes = [];
        this.index = -1;
        this.cfg = cfg;
        this.dialectCfg = dialectCfg;
        this.inline = inline;
        this.params = params;
        this.layout = layout;
    }
    format(nodes) {
        this.nodes = nodes;
        for(this.index = 0; this.index < this.nodes.length; this.index++){
            this.formatNode(this.nodes[this.index]);
        }
        return this.layout;
    }
    formatNode(node) {
        this.formatComments(node.leadingComments);
        this.formatNodeWithoutComments(node);
        this.formatComments(node.trailingComments);
    }
    formatNodeWithoutComments(node) {
        switch(node.type){
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].function_call:
                return this.formatFunctionCall(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parameterized_data_type:
                return this.formatParameterizedDataType(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].array_subscript:
                return this.formatArraySubscript(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].property_access:
                return this.formatPropertyAccess(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parenthesis:
                return this.formatParenthesis(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].between_predicate:
                return this.formatBetweenPredicate(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].case_expression:
                return this.formatCaseExpression(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].case_when:
                return this.formatCaseWhen(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].case_else:
                return this.formatCaseElse(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].clause:
                return this.formatClause(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].set_operation:
                return this.formatSetOperation(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].limit_clause:
                return this.formatLimitClause(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].all_columns_asterisk:
                return this.formatAllColumnsAsterisk(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].literal:
                return this.formatLiteral(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].identifier:
                return this.formatIdentifier(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].parameter:
                return this.formatParameter(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].operator:
                return this.formatOperator(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].comma:
                return this.formatComma(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].line_comment:
                return this.formatLineComment(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].block_comment:
                return this.formatBlockComment(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].disable_comment:
                return this.formatBlockComment(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].data_type:
                return this.formatDataType(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].keyword:
                return this.formatKeywordNode(node);
        }
    }
    formatFunctionCall(node) {
        this.withComments(node.nameKw, ()=>{
            this.layout.add(this.showFunctionKw(node.nameKw));
        });
        this.formatNode(node.parenthesis);
    }
    formatParameterizedDataType(node) {
        this.withComments(node.dataType, ()=>{
            this.layout.add(this.showDataType(node.dataType));
        });
        this.formatNode(node.parenthesis);
    }
    formatArraySubscript(node) {
        let formattedArray;
        switch(node.array.type){
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].data_type:
                formattedArray = this.showDataType(node.array);
                break;
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].keyword:
                formattedArray = this.showKw(node.array);
                break;
            default:
                formattedArray = this.showIdentifier(node.array);
                break;
        }
        this.withComments(node.array, ()=>{
            this.layout.add(formattedArray);
        });
        this.formatNode(node.parenthesis);
    }
    formatPropertyAccess(node) {
        this.formatNode(node.object);
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, node.operator);
        this.formatNode(node.property);
    }
    formatParenthesis(node) {
        const inlineLayout = this.formatInlineExpression(node.children);
        if (inlineLayout) {
            this.layout.add(node.openParen);
            this.layout.add(...inlineLayout.getLayoutItems());
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, node.closeParen, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        } else {
            this.layout.add(node.openParen, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularStyle"])(this.cfg)) {
                this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
                this.layout = this.formatSubExpression(node.children);
            } else {
                this.layout.indentation.increaseBlockLevel();
                this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
                this.layout = this.formatSubExpression(node.children);
                this.layout.indentation.decreaseBlockLevel();
            }
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, node.closeParen, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        }
    }
    formatBetweenPredicate(node) {
        this.layout.add(this.showKw(node.betweenKw), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        this.layout = this.formatSubExpression(node.expr1);
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE, this.showNonTabularKw(node.andKw), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        this.layout = this.formatSubExpression(node.expr2);
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    formatCaseExpression(node) {
        this.formatNode(node.caseKw);
        this.layout.indentation.increaseBlockLevel();
        this.layout = this.formatSubExpression(node.expr);
        this.layout = this.formatSubExpression(node.clauses);
        this.layout.indentation.decreaseBlockLevel();
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        this.formatNode(node.endKw);
    }
    formatCaseWhen(node) {
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        this.formatNode(node.whenKw);
        this.layout = this.formatSubExpression(node.condition);
        this.formatNode(node.thenKw);
        this.layout = this.formatSubExpression(node.result);
    }
    formatCaseElse(node) {
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        this.formatNode(node.elseKw);
        this.layout = this.formatSubExpression(node.result);
    }
    formatClause(node) {
        if (this.isOnelineClause(node)) {
            this.formatClauseInOnelineStyle(node);
        } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularStyle"])(this.cfg)) {
            this.formatClauseInTabularStyle(node);
        } else {
            this.formatClauseInIndentedStyle(node);
        }
    }
    isOnelineClause(node) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularStyle"])(this.cfg)) {
            return this.dialectCfg.tabularOnelineClauses[node.nameKw.text];
        } else {
            return this.dialectCfg.onelineClauses[node.nameKw.text];
        }
    }
    formatClauseInIndentedStyle(node) {
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node.nameKw), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE);
        this.layout.indentation.increaseTopLevel();
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        this.layout = this.formatSubExpression(node.children);
        this.layout.indentation.decreaseTopLevel();
    }
    formatClauseInOnelineStyle(node) {
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node.nameKw), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        this.layout = this.formatSubExpression(node.children);
    }
    formatClauseInTabularStyle(node) {
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node.nameKw), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        this.layout.indentation.increaseTopLevel();
        this.layout = this.formatSubExpression(node.children);
        this.layout.indentation.decreaseTopLevel();
    }
    formatSetOperation(node) {
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node.nameKw), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE);
        this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        this.layout = this.formatSubExpression(node.children);
    }
    formatLimitClause(node) {
        this.withComments(node.limitKw, ()=>{
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node.limitKw));
        });
        this.layout.indentation.increaseTopLevel();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularStyle"])(this.cfg)) {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        } else {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        }
        if (node.offset) {
            this.layout = this.formatSubExpression(node.offset);
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, ',', __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
            this.layout = this.formatSubExpression(node.count);
        } else {
            this.layout = this.formatSubExpression(node.count);
        }
        this.layout.indentation.decreaseTopLevel();
    }
    formatAllColumnsAsterisk(_node) {
        this.layout.add('*', __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    formatLiteral(node) {
        this.layout.add(node.text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    formatIdentifier(node) {
        this.layout.add(this.showIdentifier(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    formatParameter(node) {
        this.layout.add(this.params.get(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    formatOperator({ text }) {
        if (this.cfg.denseOperators || this.dialectCfg.alwaysDenseOperators.includes(text)) {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, text);
        } else if (text === ':') {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        } else {
            this.layout.add(text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        }
    }
    formatComma(_node) {
        if (!this.inline) {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, ',', __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        } else {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_SPACE, ',', __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        }
    }
    withComments(node, fn) {
        this.formatComments(node.leadingComments);
        fn();
        this.formatComments(node.trailingComments);
    }
    formatComments(comments) {
        if (!comments) {
            return;
        }
        comments.forEach((com)=>{
            if (com.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].line_comment) {
                this.formatLineComment(com);
            } else {
                this.formatBlockComment(com);
            }
        });
    }
    formatLineComment(node) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isMultiline"])(node.precedingWhitespace || '')) {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, node.text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].MANDATORY_NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        } else if (this.layout.getLayoutItems().length > 0) {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE, node.text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].MANDATORY_NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        } else {
            // comment is the first item in code - no need to add preceding spaces
            this.layout.add(node.text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].MANDATORY_NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        }
    }
    formatBlockComment(node) {
        if (node.type === __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$ast$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NodeType"].block_comment && this.isMultilineBlockComment(node)) {
            this.splitBlockComment(node.text).forEach((line)=>{
                this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, line);
            });
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        } else {
            this.layout.add(node.text, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        }
    }
    isMultilineBlockComment(node) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isMultiline"])(node.text) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isMultiline"])(node.precedingWhitespace || '');
    }
    isDocComment(comment) {
        const lines = comment.split(/\n/);
        return(// first line starts with /* or /**
        /^\/\*\*?$/.test(lines[0]) && // intermediate lines start with *
        lines.slice(1, lines.length - 1).every((line)=>/^\s*\*/.test(line)) && // last line ends with */
        /^\s*\*\/$/.test((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["last"])(lines)));
    }
    // Breaks up block comment to multiple lines.
    // For example this doc-comment (dots representing leading whitespace):
    //
    //   ..../**
    //   .....* Some description here
    //   .....* and here too
    //   .....*/
    //
    // gets broken to this array (note the leading single spaces):
    //
    //   [ '/**',
    //     '.* Some description here',
    //     '.* and here too',
    //     '.*/' ]
    //
    // However, a normal comment (non-doc-comment) like this:
    //
    //   ..../*
    //   ....Some description here
    //   ....*/
    //
    // gets broken to this array (no leading spaces):
    //
    //   [ '/*',
    //     'Some description here',
    //     '*/' ]
    //
    splitBlockComment(comment) {
        if (this.isDocComment(comment)) {
            return comment.split(/\n/).map((line)=>{
                if (/^\s*\*/.test(line)) {
                    return ' ' + line.replace(/^\s*/, '');
                } else {
                    return line;
                }
            });
        } else {
            return comment.split(/\n/).map((line)=>line.replace(/^\s*/, ''));
        }
    }
    formatSubExpression(nodes) {
        return new ExpressionFormatter({
            cfg: this.cfg,
            dialectCfg: this.dialectCfg,
            params: this.params,
            layout: this.layout,
            inline: this.inline
        }).format(nodes);
    }
    formatInlineExpression(nodes) {
        const oldParamIndex = this.params.getPositionalParameterIndex();
        try {
            return new ExpressionFormatter({
                cfg: this.cfg,
                dialectCfg: this.dialectCfg,
                params: this.params,
                layout: new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$InlineLayout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](this.cfg.expressionWidth),
                inline: true
            }).format(nodes);
        } catch (e) {
            if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$InlineLayout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InlineLayoutError"]) {
                // While formatting, some of the positional parameters might have
                // been consumed, which increased the current parameter index.
                // We reset the index to an earlier state, so we can run the
                // formatting again and re-consume these parameters in non-inline mode.
                this.params.setPositionalParameterIndex(oldParamIndex);
                return undefined;
            } else {
                // forward all unexpected errors
                throw e;
            }
        }
    }
    formatKeywordNode(node) {
        switch(node.tokenType){
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].RESERVED_JOIN:
                return this.formatJoin(node);
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].AND:
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].OR:
            case __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$lexer$2f$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenType"].XOR:
                return this.formatLogicalOperator(node);
            default:
                return this.formatKeyword(node);
        }
    }
    formatJoin(node) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularStyle"])(this.cfg)) {
            // in tabular style JOINs are at the same level as clauses
            this.layout.indentation.decreaseTopLevel();
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
            this.layout.indentation.increaseTopLevel();
        } else {
            this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
        }
    }
    formatKeyword(node) {
        this.layout.add(this.showKw(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    formatLogicalOperator(node) {
        if (this.cfg.logicalOperatorNewline === 'before') {
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularStyle"])(this.cfg)) {
                // In tabular style AND/OR is placed on the same level as clauses
                this.layout.indentation.decreaseTopLevel();
                this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
                this.layout.indentation.increaseTopLevel();
            } else {
                this.layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT, this.showKw(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
            }
        } else {
            this.layout.add(this.showKw(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].INDENT);
        }
    }
    formatDataType(node) {
        this.layout.add(this.showDataType(node), __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].SPACE);
    }
    showKw(node) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$tabularStyle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularToken"])(node.tokenType)) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$tabularStyle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(this.showNonTabularKw(node), this.cfg.indentStyle);
        } else {
            return this.showNonTabularKw(node);
        }
    }
    // Like showKw(), but skips tabular formatting
    showNonTabularKw(node) {
        switch(this.cfg.keywordCase){
            case 'preserve':
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalizeWhitespace"])(node.raw);
            case 'upper':
                return node.text;
            case 'lower':
                return node.text.toLowerCase();
        }
    }
    showFunctionKw(node) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$tabularStyle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isTabularToken"])(node.tokenType)) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$tabularStyle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(this.showNonTabularFunctionKw(node), this.cfg.indentStyle);
        } else {
            return this.showNonTabularFunctionKw(node);
        }
    }
    // Like showFunctionKw(), but skips tabular formatting
    showNonTabularFunctionKw(node) {
        switch(this.cfg.functionCase){
            case 'preserve':
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalizeWhitespace"])(node.raw);
            case 'upper':
                return node.text;
            case 'lower':
                return node.text.toLowerCase();
        }
    }
    showIdentifier(node) {
        if (node.quoted) {
            return node.text;
        } else {
            switch(this.cfg.identifierCase){
                case 'preserve':
                    return node.text;
                case 'upper':
                    return node.text.toUpperCase();
                case 'lower':
                    return node.text.toLowerCase();
            }
        }
    }
    showDataType(node) {
        switch(this.cfg.dataTypeCase){
            case 'preserve':
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalizeWhitespace"])(node.raw);
            case 'upper':
                return node.text;
            case 'lower':
                return node.text.toLowerCase();
        }
    }
} //# sourceMappingURL=ExpressionFormatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Formatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Formatter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/config.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Params$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Params.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$createParser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/parser/createParser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$ExpressionFormatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/ExpressionFormatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Layout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Indentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Indentation.js [app-client] (ecmascript)");
;
;
;
;
;
;
class Formatter {
    constructor(dialect, cfg){
        this.dialect = dialect;
        this.cfg = cfg;
        this.params = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Params$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](this.cfg.params);
    }
    /**
     * Formats an SQL query.
     * @param {string} query - The SQL query string to be formatted
     * @return {string} The formatter query
     */ format(query) {
        const ast = this.parse(query);
        const formattedQuery = this.formatAst(ast);
        return formattedQuery.trimEnd();
    }
    parse(query) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$parser$2f$createParser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createParser"])(this.dialect.tokenizer).parse(query, this.cfg.paramTypes || {});
    }
    formatAst(statements) {
        return statements.map((stat)=>this.formatStatement(stat)).join('\n'.repeat(this.cfg.linesBetweenQueries + 1));
    }
    formatStatement(statement) {
        const layout = new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$ExpressionFormatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]({
            cfg: this.cfg,
            dialectCfg: this.dialect.formatOptions,
            params: this.params,
            layout: new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Indentation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$config$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indentString"])(this.cfg)))
        }).format(statement.children);
        if (!statement.hasSemicolon) {
        // do nothing
        } else if (this.cfg.newlineBeforeSemicolon) {
            layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NEWLINE, ';');
        } else {
            layout.add(__TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WS"].NO_NEWLINE, ';');
        }
        return layout.toString();
    }
} //# sourceMappingURL=Formatter.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/validateConfig.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConfigError",
    ()=>ConfigError,
    "validateConfig",
    ()=>validateConfig
]);
class ConfigError extends Error {
}
function validateConfig(cfg) {
    const removedOptions = [
        'multilineLists',
        'newlineBeforeOpenParen',
        'newlineBeforeCloseParen',
        'aliasAs',
        'commaPosition',
        'tabulateAlias'
    ];
    for (const optionName of removedOptions){
        if (optionName in cfg) {
            throw new ConfigError(`${optionName} config is no more supported.`);
        }
    }
    if (cfg.expressionWidth <= 0) {
        throw new ConfigError(`expressionWidth config must be positive number. Received ${cfg.expressionWidth} instead.`);
    }
    if (cfg.params && !validateParams(cfg.params)) {
        // eslint-disable-next-line no-console
        console.warn('WARNING: All "params" option values should be strings.');
    }
    if (cfg.paramTypes && !validateParamTypes(cfg.paramTypes)) {
        throw new ConfigError('Empty regex given in custom paramTypes. That would result in matching infinite amount of parameters.');
    }
    return cfg;
}
function validateParams(params) {
    const paramValues = params instanceof Array ? params : Object.values(params);
    return paramValues.every((p)=>typeof p === 'string');
}
function validateParamTypes(paramTypes) {
    if (paramTypes.custom && Array.isArray(paramTypes.custom)) {
        return paramTypes.custom.every((p)=>p.regex !== '');
    }
    return true;
} //# sourceMappingURL=validateConfig.js.map
}),
"[project]/pwa/node_modules/sql-formatter/dist/esm/sqlFormatter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "format",
    ()=>format,
    "formatDialect",
    ()=>formatDialect,
    "supportedDialects",
    ()=>supportedDialects
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$allDialects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/allDialects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$dialect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/dialect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/formatter/Formatter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$validateConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pwa/node_modules/sql-formatter/dist/esm/validateConfig.js [app-client] (ecmascript)");
var __rest = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__rest || function(s, e) {
    var t = {};
    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++){
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
};
;
;
;
;
const dialectNameMap = {
    bigquery: 'bigquery',
    db2: 'db2',
    db2i: 'db2i',
    duckdb: 'duckdb',
    hive: 'hive',
    mariadb: 'mariadb',
    mysql: 'mysql',
    n1ql: 'n1ql',
    plsql: 'plsql',
    postgresql: 'postgresql',
    redshift: 'redshift',
    spark: 'spark',
    sqlite: 'sqlite',
    sql: 'sql',
    tidb: 'tidb',
    trino: 'trino',
    transactsql: 'transactsql',
    tsql: 'transactsql',
    singlestoredb: 'singlestoredb',
    snowflake: 'snowflake'
};
const supportedDialects = Object.keys(dialectNameMap);
const defaultOptions = {
    tabWidth: 2,
    useTabs: false,
    keywordCase: 'preserve',
    identifierCase: 'preserve',
    dataTypeCase: 'preserve',
    functionCase: 'preserve',
    indentStyle: 'standard',
    logicalOperatorNewline: 'before',
    expressionWidth: 50,
    linesBetweenQueries: 1,
    denseOperators: false,
    newlineBeforeSemicolon: false
};
const format = (query, cfg = {})=>{
    if (typeof cfg.language === 'string' && !supportedDialects.includes(cfg.language)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$validateConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConfigError"](`Unsupported SQL dialect: ${cfg.language}`);
    }
    const canonicalDialectName = dialectNameMap[cfg.language || 'sql'];
    return formatDialect(query, Object.assign(Object.assign({}, cfg), {
        dialect: __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$allDialects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[canonicalDialectName]
    }));
};
const formatDialect = (query, _a)=>{
    var { dialect } = _a, cfg = __rest(_a, [
        "dialect"
    ]);
    if (typeof query !== 'string') {
        throw new Error('Invalid query argument. Expected string, instead got ' + typeof query);
    }
    const options = (0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$validateConfig$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateConfig"])(Object.assign(Object.assign({}, defaultOptions), cfg));
    return new __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$formatter$2f$Formatter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$pwa$2f$node_modules$2f$sql$2d$formatter$2f$dist$2f$esm$2f$dialect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDialect"])(dialect), options).format(query);
}; //# sourceMappingURL=sqlFormatter.js.map
}),
]);

//# sourceMappingURL=7dc3a_sql-formatter_dist_esm_845f27d3._.js.map