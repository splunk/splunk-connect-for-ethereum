import * as ts from 'typescript';
import debug from 'debug';
import { join, dirname, basename } from 'path';
import { readFile, writeFile } from 'fs-extra';
import { execSync } from 'child_process';

const markdownTable = require('markdown-table'); // eslint-disable-line

const log = debug('gendocs');
log.enabled = true;

type UnkownType = { type: 'unknown' };
type LiteralTypeInfo = { type: 'literal'; value: string };
type PrimitiveTypeInfo = { type: 'primitive'; name: string };
type ObjectTypeInfo = { type: 'object'; name: string };
type UnionTypeInfo = Array<TypeInfo>;
type TypeInfo = LiteralTypeInfo | PrimitiveTypeInfo | ObjectTypeInfo | UnionTypeInfo | UnkownType;

interface Field {
    name: string;
    type: TypeInfo;
    description?: string;
    example?: string;
    default?: string;
}

const inlineCode = (s: string) => '`' + s + '`';
const link = (to: string, label: string) => `[${label}](${to})`;

function formatTypeInfo(type: TypeInfo): string {
    if (Array.isArray(type)) {
        return type.map(formatTypeInfo).join(` \\| `);
    } else if (type.type === 'unknown') {
        return '`???`';
    } else if (type.type === 'primitive') {
        return inlineCode(type.name);
    } else if (type.type === 'literal') {
        return inlineCode(type.value);
    } else if (type.type === 'object') {
        return link(`#${type.name}`, inlineCode(type.name));
    }
    throw new Error('INVALID TYPE: ' + JSON.stringify(type));
}

function formatDescription(text?: string): string {
    return text != null
        ? text
              .trim()
              .replace(/\s*\n\n\s*/g, '<br><br>')
              .replace(/\s*\n\s*/g, ' ')
        : '';
}

// function flagsToString(flags: number): string {
//     const result = [];
//     for (const f in ts.TypeFlags) {
//         const n = parseInt(f, 10);
//         if (typeof n === 'number' && !isNaN(n)) {
//             if ((n & flags) !== 0) {
//                 result.push(ts.TypeFlags[f]);
//             }
//         }
//     }
//     return result.join(', ');
// }

// function objectFlagsToString(flags: number): string {
//     const result = [];
//     for (const f in ts.ObjectFlags) {
//         const n = parseInt(f, 10);
//         if (typeof n === 'number' && !isNaN(n)) {
//             if ((n & flags) !== 0) {
//                 result.push(ts.ObjectFlags[f]);
//             }
//         }
//     }
//     return result.join(', ');
// }

// function syntaxKindToSstring(flags: number): string {
//     const result = [];
//     for (const f in ts.TypeFlags) {
//         const n = parseInt(f, 10);
//         if (typeof n === 'number' && !isNaN(n)) {
//             if ((n & flags) !== 0) {
//                 result.push(ts.TypeFlags[f]);
//             }
//         }
//     }
//     return result.join(', ');
// }

// function getReferencedTypeSymbol(prop: ts.Symbol, typeChecker: ts.TypeChecker): ts.Symbol | undefined {
//     const decl = prop.getDeclarations();
//     if (decl && decl.length) {
//         const type = <ts.TypeReferenceNode>(<any>decl[0]).type;
//         if (type && type.kind & ts.SyntaxKind.TypeReference && type.typeName) {
//             const symbol = typeChecker.getSymbolAtLocation(type.typeName);
//             if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
//                 return typeChecker.getAliasedSymbol(symbol);
//             }
//             return symbol;
//         }
//     }
//     return undefined;
// }

class Section {
    public fields: Field[] = [];
    constructor(public title: string, public description?: string) {}

    format(): string {
        let out = `### ${this.title}\n\n`;
        if (this.description) {
            out += `${formatDescription(this.description)}\n\n`;
        }
        const hasExample = this.fields.some(f => f.example != null);
        const hasDefault = this.fields.some(f => f.default != null);
        const hasDescription = this.fields.some(f => !!f.description?.trim());
        const rows = this.fields.map(field => [
            inlineCode(field.name),
            formatTypeInfo(field.type),
            ...(hasDescription ? [formatDescription(field.description)] : []),
            ...(hasExample ? [field.example ? inlineCode(field.example) : undefined] : []),
            ...(hasDefault ? [field.default ? inlineCode(field.default) : undefined] : []),
        ]);
        out += markdownTable([
            [
                'Name',
                'Type',
                ...(hasDescription ? ['Description'] : []),
                ...(hasExample ? ['Example'] : []),
                ...(hasDefault ? ['Default'] : []),
            ],
            ...rows,
        ]);
        return out;
    }
}

async function main() {
    const configFile = join(__dirname, '../tsconfig.json');

    const config = ts.parseConfigFileTextToJson(configFile, ts.sys.readFile(configFile)!);
    const configParseResult = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        dirname(configFile),
        {},
        basename(configFile)
    );

    const options = configParseResult.options;
    options.noEmit = true;

    const program = ts.createProgram({
        rootNames: configParseResult.fileNames,
        options,
        projectReferences: configParseResult.projectReferences,
    });
    const typeChecker = program.getTypeChecker();

    const findType = (name: string): ts.Type => {
        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.fileName.startsWith(join(process.cwd(), 'src'))) {
                function findRecursive(node: ts.Node): ts.Type | undefined {
                    switch (node.kind) {
                        case ts.SyntaxKind.InterfaceDeclaration:
                        case ts.SyntaxKind.TypeAliasDeclaration:
                            const nodeType = typeChecker.getTypeAtLocation(node);
                            const typeName = typeChecker.typeToString(nodeType);
                            if (typeName === name) {
                                log(`Found type %s in source file %s`, typeName, sourceFile.fileName);
                                return nodeType;
                            }
                            break;

                        default:
                            for (const child of node.getChildren(sourceFile)) {
                                const type = findRecursive(child);
                                if (type != null) {
                                    return type;
                                }
                            }
                    }
                }
                const type = findRecursive(sourceFile);
                if (type != null) {
                    return type;
                }
            }
        }
        throw new Error(`Type ${name} not found`);
    };

    const entryNodeType = findType('EthloggerConfigSchema');
    const sections: Section[] = [];
    const seenSections: Set<string> = new Set();

    function appendSectionForType(entryNodeType: ts.Type) {
        if (seenSections.has(entryNodeType.symbol.name)) {
            return;
        }
        const typeName = entryNodeType.symbol?.name?.replace(/Schema$/, '').replace(/Config$/, '');
        log('Creating reference section for type %o -> %o', entryNodeType.symbol?.name, typeName);

        const docs = entryNodeType.symbol?.getDocumentationComment(typeChecker);

        const section = new Section(typeName, docs && docs.length ? ts.displayPartsToString(docs) : undefined);
        sections.push(section);
        const members = entryNodeType.symbol.members?.values();
        if (members) {
            while (true) {
                const { done, value: member } = members.next();
                if (done) {
                    break;
                }
                const memberType = typeChecker.getTypeAtLocation(member.declarations[0]);
                const resolveType = (type: ts.Type): TypeInfo => {
                    const flags = type.flags;
                    if (flags & ts.TypeFlags.StringLiteral) {
                        return { type: 'literal', value: JSON.stringify((type as ts.LiteralType).value) };
                    } else if (flags & ts.TypeFlags.String) {
                        return { type: 'primitive', name: 'string' };
                    } else if (flags & ts.TypeFlags.Number) {
                        return { type: 'primitive', name: 'number' };
                    } else if (flags & ts.TypeFlags.Boolean) {
                        return { type: 'primitive', name: 'boolean' };
                    }

                    if (flags & ts.TypeFlags.Union) {
                        const unionType = type as ts.UnionType;
                        return unionType.types.map(resolveType);
                    }

                    if (flags & ts.TypeFlags.Object) {
                        const name = type.symbol?.name?.replace(/Schema$/, '').replace(/Config$/, '');
                        if (name && name !== '__type') {
                            appendSectionForType(type);
                            return { type: 'object', name };
                        }

                        const objectType = type as ts.ObjectType;

                        if (objectType.objectFlags & ts.ObjectFlags.Anonymous) {
                            return { type: 'primitive', name: 'object' };
                        } else {
                            // console.log(getReferencedTypeSymbol(type.symbol, typeChecker));
                            // typeChecker.typeToString(type);
                            // console.log(flagsToString(type.flags));
                            // console.log(objectFlagsToString(objectType.objectFlags));
                            // console.log((type as ts.TypeReference).target?.symbol?.name);
                            // if (objectType.objectFlags & ts.ObjectFlags.Reference) {
                            //     console.log('REF');
                            // }
                        }
                    }
                    // log('%s -> %o', member.name, type);
                    // console.log(flagsToString(type.flags));
                    // console.log('---');

                    return { type: 'unknown' };
                };

                const docs = member.getDocumentationComment(typeChecker).filter(d => d.kind === 'text');
                const example = member.getJsDocTags().find(t => t.name === 'example')?.text;
                const defaultValue = member.getJsDocTags().find(t => t.name === 'default')?.text;

                section.fields.push({
                    name: member.name,
                    type: resolveType(memberType),
                    description: docs.length ? docs.map(d => d.text).join(' ') : undefined,
                    example,
                    default: defaultValue,
                });
            }
        }
    }

    appendSectionForType(entryNodeType);

    const content = sections.map(s => s.format()).join('\n\n\n');

    const configReferencePath = join(__dirname, '../docs/configuration.md');
    const mdContent = await readFile(configReferencePath, { encoding: 'utf-8' });

    const start = mdContent.indexOf(`<!-- REFERENCE -->`);
    const end = mdContent.indexOf(`<!-- REFERENCE-END -->`);

    const updatedContent = `${mdContent.slice(
        0,
        start
    )}\n<!-- REFERENCE -->\n<!-- THIS IS GENERATED - DO NOT EDIT -->\n\n${content}\n\n${mdContent.slice(end)}`;

    await writeFile(configReferencePath, updatedContent, { encoding: 'utf-8' });

    execSync('yarn prettier --write docs/*.md', { cwd: join(__dirname, '..') });
}

main().catch(e => {
    log('ERROR', e.stack);
    // process.exit(1);
});
