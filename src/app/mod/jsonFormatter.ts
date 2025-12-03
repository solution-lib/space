// src/app/mod/jsonFormatter.ts
//
// Developed with ❤️ by Maysara.


// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    import * as fs from 'fs';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface FormatOptions {
        indent?         : string;   // default: '\t'
        alignColons?    : boolean;  // default: true
        sortKeys?       : boolean;  // default: false
        tabWidth?       : number;   // default: 4 (visual width of a tab character)
        keyOrder?       : string[]; // custom key order (keys not in list appear at end)
    }

    export const PACKAGE_JSON_KEY_ORDER = [
        'name',
        'version',
        'description',
        'keywords',
        'license',
        'homepage',
        'bugs',
        'author',
        'repository',
        'type',
        'main',
        'types',
        'bin',
        'files',
        'exports',
        'scripts',
        'engines',
        'peerDependencies',
        'dependencies',
        'devDependencies'
    ];

    export const SPACE_FILE_KEY_ORDER = [
        'type',
        'template',
        'pm',
        'repo',
        'author',
        'createdAt'
    ];

    // For nested objects in repo
    export const REPO_KEY_ORDER = [
        'org',
        'name',
        'version',
        'desc',
        'kw',
        'license',
        'issues',
        'homepage',
        'git_url'
    ];

    // For nested objects in author
    export const AUTHOR_KEY_ORDER = [
        'id',
        'name',
        'email',
        'url'
    ];

    type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
    interface JsonObject {
        [key: string]: JsonValue;
    }
    type JsonArray = JsonValue[];

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class JsonFormatter {

        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            // Format JSON with custom alignment and indentation
            static format(obj: JsonValue, options: FormatOptions = {}): string {
                const indent = options.indent || '\t';
                const alignColons = options.alignColons !== false;
                const sortKeys = options.sortKeys || false;
                const tabWidth = options.tabWidth || 4;
                const keyOrder = options.keyOrder || [];

                // Calculate GLOBAL max key length across all nesting levels
                const globalMaxKeyLength = alignColons ? this.calculateGlobalMaxKeyLength(obj) : 0;

                // Calculate max indent depth (in visual characters)
                const maxDepth = this.calculateMaxDepth(obj);
                const maxIndentWidth = maxDepth * (indent === '\t' ? tabWidth : indent.length);

                return this.formatValue(obj, 0, indent, alignColons, sortKeys, globalMaxKeyLength, maxIndentWidth, tabWidth, keyOrder);
            }

            // Format and write to file
            static formatFile(filePath: string, options: FormatOptions = {}): void {
                const content = fs.readFileSync(filePath, 'utf-8');
                const obj = JSON.parse(content) as JsonValue;
                const formatted = this.format(obj, options);
                fs.writeFileSync(filePath, formatted + '\n', 'utf-8');
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            // Calculate the maximum nesting depth
            private static calculateMaxDepth(obj: JsonValue, currentDepth: number = 0): number {
                if (!obj || typeof obj !== 'object') {
                    return currentDepth;
                }

                let maxDepth = currentDepth;

                if (Array.isArray(obj)) {
                    obj.forEach(item => {
                        const depth = this.calculateMaxDepth(item, currentDepth + 1);
                        if (depth > maxDepth) maxDepth = depth;
                    });
                } else {
                    Object.values(obj).forEach(value => {
                        const depth = this.calculateMaxDepth(value, currentDepth + 1);
                        if (depth > maxDepth) maxDepth = depth;
                    });
                }

                return maxDepth;
            }

            // Sort keys based on custom order or alphabetically
            private static sortKeys(keys: string[], keyOrder: string[], sortAlphabetically: boolean): string[] {
                if (keyOrder.length === 0) {
                    return sortAlphabetically ? keys.sort() : keys;
                }

                // Separate keys into ordered and unordered
                const orderedKeys: string[] = [];
                const unorderedKeys: string[] = [];

                keys.forEach(key => {
                    if (keyOrder.includes(key)) {
                        orderedKeys.push(key);
                    } else {
                        unorderedKeys.push(key);
                    }
                });

                // Sort ordered keys by their position in keyOrder
                orderedKeys.sort((a, b) => keyOrder.indexOf(a) - keyOrder.indexOf(b));

                // Sort unordered keys alphabetically if sortKeys is true
                if (sortAlphabetically) {
                    unorderedKeys.sort();
                }

                // Return ordered keys first, then unordered
                return [...orderedKeys, ...unorderedKeys];
            }

            private static calculateGlobalMaxKeyLength(obj: JsonValue): number {
                let maxLength = 0;

                const traverse = (value: JsonValue): void => {
                    if (!value || typeof value !== 'object') {
                        return;
                    }

                    if (Array.isArray(value)) {
                        value.forEach(item => traverse(item));
                        return;
                    }

                    // It's an object
                    const keys = Object.keys(value);
                    keys.forEach(key => {
                        const keyLength = JSON.stringify(key).length;
                        if (keyLength > maxLength) {
                            maxLength = keyLength;
                        }
                        traverse(value[key]);
                    });
                };

                traverse(obj);
                return maxLength;
            }

            // Format any JSON value recursively
            private static formatValue(
                value: JsonValue,
                depth: number,
                indent: string,
                alignColons: boolean,
                sortKeys: boolean,
                globalMaxKeyLength: number,
                maxIndentWidth: number,
                tabWidth: number,
                keyOrder: string[]
            ): string {
                if (value === null) return 'null';
                if (value === undefined) return 'undefined';

                const type = typeof value;

                if (type === 'string') {
                    return JSON.stringify(value);
                }

                if (type === 'number' || type === 'boolean') {
                    return String(value);
                }

                if (Array.isArray(value)) {
                    return this.formatArray(value, depth, indent, alignColons, sortKeys, globalMaxKeyLength, maxIndentWidth, tabWidth, keyOrder);
                }

                if (type === 'object') {
                    return this.formatObject(value as JsonObject, depth, indent, alignColons, sortKeys, globalMaxKeyLength, maxIndentWidth, tabWidth, keyOrder);
                }

                return JSON.stringify(value);
            }

            // Format an array
            private static formatArray(
                arr: JsonArray,
                depth: number,
                indent: string,
                alignColons: boolean,
                sortKeys: boolean,
                globalMaxKeyLength: number,
                maxIndentWidth: number,
                tabWidth: number,
                keyOrder: string[]
            ): string {
                if (arr.length === 0) return '[]';

                // Check if array is simple (primitives only)
                const isSimple = arr.every(item =>
                    typeof item === 'string' ||
                    typeof item === 'number' ||
                    typeof item === 'boolean' ||
                    item === null
                );

                if (isSimple && arr.length <= 3) {
                    // Inline simple short arrays
                    return '[' + arr.map(item => this.formatValue(item, depth, indent, alignColons, sortKeys, globalMaxKeyLength, maxIndentWidth, tabWidth, keyOrder)).join(', ') + ']';
                }

                // Multi-line array
                const currentIndent = indent.repeat(depth + 1);
                const items = arr.map(item =>
                    currentIndent + this.formatValue(item, depth + 1, indent, alignColons, sortKeys, globalMaxKeyLength, maxIndentWidth, tabWidth, keyOrder)
                );

                return '[\n' + items.join(',\n') + '\n' + indent.repeat(depth) + ']';
            }

            // Format an object with GLOBAL alignment accounting for indentation
            private static formatObject(
                obj: JsonObject,
                depth: number,
                indent: string,
                alignColons: boolean,
                sortKeys: boolean,
                globalMaxKeyLength: number,
                maxIndentWidth: number,
                tabWidth: number,
                keyOrder: string[]
            ): string {
                if (Object.keys(obj).length === 0) return '{}';

                let keys = Object.keys(obj);

                // Apply custom ordering
                keys = this.sortKeys(keys, keyOrder, sortKeys);

                const currentIndent = indent.repeat(depth + 1);

                // Calculate visual width of current indentation
                const currentIndentWidth = (depth + 1) * (indent === '\t' ? tabWidth : indent.length);

                // Format each key-value pair
                const lines = keys.map(key => {
                    const jsonKey = JSON.stringify(key);
                    const value = this.formatValue(obj[key], depth + 1, indent, alignColons, sortKeys, globalMaxKeyLength, maxIndentWidth, tabWidth, keyOrder);

                    if (alignColons) {
                        // Padding = (max indent width - current indent width) + (max key length - current key length)
                        const indentDiff = maxIndentWidth - currentIndentWidth;
                        const keyDiff = globalMaxKeyLength - jsonKey.length;
                        const padding = ' '.repeat(indentDiff + keyDiff);
                        return `${currentIndent}${jsonKey}${padding} : ${value}`;
                    } else {
                        return `${currentIndent}${jsonKey} : ${value}`;
                    }
                });

                return '{\n' + lines.join(',\n') + '\n' + indent.repeat(depth) + '}';
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝