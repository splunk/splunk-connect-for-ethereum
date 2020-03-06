import { execSync } from 'child_process';
import debug from 'debug';
import { readFile, writeFile } from 'fs-extra';
import { basename, dirname, join } from 'path';
import * as ts from 'typescript';
import { CLI_FLAGS } from '../src/cliflags';

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
    see?: string;
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

function formatDescription(text?: string) {
    return text != null
        ? text
              .trim()
              .replace(/\s*\n\n\s*/g, '<br><br>')
              .replace(/\s*\n\s*/g, ' ')
        : '';
}

interface Section {
    name: string;
    description?: string;
    fields: Field[];
}

const formatExample = (example?: string) => (example != null ? `Example: ${inlineCode(example)}` : undefined);

const formatSeeAlso = (see?: string) => (see != null ? `See ${see}` : undefined);

function formatSection({ name, description, fields }: Section): string {
    let out = `### ${name}\n\n`;
    if (description) {
        out += `${formatDescription(description)}\n\n`;
    }
    const hasDefault = fields.some(f => f.default != null);
    const hasDescription = fields.some(f => !!f.description?.trim() || f.example != null);
    const rows = fields.map(field => [
        inlineCode(field.name),
        formatTypeInfo(field.type),
        ...(hasDescription
            ? [
                  [formatDescription(field.description), formatExample(field.example), formatSeeAlso(field.see)]
                      .filter(s => !!s)
                      .join('<br><br>'),
              ]
            : []),
        ...(hasDefault ? [field.default ? inlineCode(field.default) : undefined] : []),
    ]);
    out += markdownTable([
        ['Name', 'Type', ...(hasDescription ? ['Description'] : []), ...(hasDefault ? ['Default'] : [])],
        ...rows,
    ]);
    return out;
}

function parsesTypescriptProgram(): ts.Program {
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
    return program;
}

function findType(name: string, program: ts.Program, typeChecker: ts.TypeChecker): ts.Type {
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
}

function createConfigurationSchemaReference(): string {
    const program = parsesTypescriptProgram();
    const typeChecker = program.getTypeChecker();
    const entryNodeType = findType('EthloggerConfigSchema', program, typeChecker);
    const sections: Section[] = [];
    const seenSections: Set<string> = new Set();

    function appendSectionForType(configSchemaType: ts.Type) {
        if (seenSections.has(configSchemaType.symbol.name)) {
            return;
        }
        seenSections.add(configSchemaType.symbol.name);

        const fields: Field[] = [];
        const docs = configSchemaType.symbol?.getDocumentationComment(typeChecker);
        const section: Section = {
            name: configSchemaType.symbol?.name?.replace(/Schema$/, '').replace(/Config$/, ''),
            description: docs && docs.length ? ts.displayPartsToString(docs) : undefined,
            fields,
        };
        log('Adding reference section for type %o -> %o', configSchemaType.symbol?.name, section.name);
        sections.push(section);
        const members = configSchemaType.symbol.members?.values();
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
                    }
                    if (flags & ts.TypeFlags.String) {
                        return { type: 'primitive', name: 'string' };
                    }
                    if (flags & ts.TypeFlags.Number) {
                        return { type: 'primitive', name: 'number' };
                    }
                    if (flags & ts.TypeFlags.Boolean) {
                        return { type: 'primitive', name: 'boolean' };
                    }
                    if (flags & ts.TypeFlags.Union) {
                        const unionType = type as ts.UnionType;
                        const hasPrimitiveType = unionType.types.some(
                            t =>
                                t.flags & ts.TypeFlags.String ||
                                t.flags & ts.TypeFlags.Boolean ||
                                t.flags & ts.TypeFlags.Number
                        );
                        if (hasPrimitiveType && type.aliasSymbol) {
                            return {
                                type: 'object',
                                name: type.aliasSymbol.name.replace(/Schema$/, '').replace(/Config$/, ''),
                            };
                        }
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
                            if (
                                type.aliasSymbol &&
                                type.aliasSymbol.name === 'Partial' &&
                                type.aliasTypeArguments?.length === 1
                            ) {
                                return resolveType(type.aliasTypeArguments[0]);
                            }

                            return { type: 'unknown' };
                        }
                    }
                    return { type: 'unknown' };
                };
                const docs = member.getDocumentationComment(typeChecker).filter(d => d.kind === 'text');
                const example = member.getJsDocTags().find(t => t.name === 'example')?.text;
                const see = member.getJsDocTags().find(t => t.name === 'see')?.text;
                const defaultValue = member.getJsDocTags().find(t => t.name === 'default')?.text;
                section.fields.push({
                    name: member.name,
                    type: resolveType(memberType),
                    description: docs.length ? docs.map(d => d.text).join(' ') : undefined,
                    example,
                    see,
                    default: defaultValue,
                });
            }
        }
    }
    appendSectionForType(entryNodeType);
    return sections.map(formatSection).join('\n\n\n');
}

function generateCliReference(): string {
    const usage = execSync('./bin/run --help').toString('utf-8');
    return '```\n' + usage.trim() + '\n```';
}

function generateEnvReference(): string {
    const flags = CLI_FLAGS;

    const rows = [
        ['Environment Variable', 'Type', 'Description'],
        ...Object.entries(flags)
            .filter(([, flag]) => flag.env != null)
            .map(([, flag]) => [
                inlineCode(flag.env!),
                inlineCode(flag.type === 'option' ? 'string' : flag.type),
                flag.description,
            ]),
    ];

    return markdownTable(rows);
}

function generateMetaVariablesReference() {
    const program = parsesTypescriptProgram();
    const typeChecker = program.getTypeChecker();
    const metaVariablesType = findType('MetadataVariables', program, typeChecker);

    const members = metaVariablesType.symbol.members?.values();
    if (members == null) {
        throw new Error('Did not fnid members for MetadataVariables');
    }

    const table = [['Variable', 'Description']];

    while (true) {
        const { done, value: member } = members.next();
        if (done) {
            break;
        }

        table.push([
            inlineCode(`$${member.name}`),
            formatDescription(
                member
                    .getDocumentationComment(typeChecker)
                    .filter(d => d.kind === 'text')
                    .map(d => d.text)
                    .join(' ')
            ),
        ]);
    }

    return markdownTable(table);
}

function replaceContent(originalContent: string, anchorName: string, replacement: string): string {
    const startAnchor = `<!-- ${anchorName} -->`;
    const endAnchor = `<!-- ${anchorName}-END -->`;
    const start = originalContent.indexOf(startAnchor);
    const end = originalContent.indexOf(endAnchor);
    if (start < 0 || end < 0) {
        throw new Error(`Did not found anchors ${startAnchor} for replacing content in markdown file`);
    }
    return [originalContent.slice(0, start), startAnchor, '\n', replacement, '\n', originalContent.slice(end)].join(
        '\n'
    );
}

async function main() {
    const configSchemaReference = createConfigurationSchemaReference();

    const configurationDocsPath = join(__dirname, '../docs/configuration.md');
    const configDocsContent = await readFile(configurationDocsPath, { encoding: 'utf-8' });

    const exampleContent = await readFile(join(__dirname, '../test/config/example1.ethlogger.yaml'), {
        encoding: 'utf-8',
    });

    const exampleCodeBlock = '\n```yaml\n' + exampleContent + '\n```\n';

    const updatedContent = replaceContent(
        replaceContent(
            replaceContent(configDocsContent, 'REFERENCE', configSchemaReference),
            'EXAMPLE',
            exampleCodeBlock
        ),
        'METAVARIABLES',
        generateMetaVariablesReference()
    );
    if (updatedContent !== configDocsContent) {
        log(`Writing updated ${configurationDocsPath}`);
        await writeFile(configurationDocsPath, updatedContent, { encoding: 'utf-8' });
    }

    const cliReference = generateCliReference();
    const envReference = generateEnvReference();
    const cliReferenceDocsPath = join(__dirname, '../docs/cli.md');
    const cliReferenceContent = await readFile(cliReferenceDocsPath, { encoding: 'utf-8' });
    const updatedCliReferenceContent = replaceContent(
        replaceContent(cliReferenceContent, 'CLIREF', cliReference),
        'ENVREF',
        envReference
    );
    if (updatedCliReferenceContent !== cliReferenceContent) {
        log(`Writing updated ${cliReferenceDocsPath}`);
        await writeFile(cliReferenceDocsPath, updatedCliReferenceContent, { encoding: 'utf-8' });
    }

    log(`Prettier-formatting markdown files`);
    execSync('yarn prettier --write docs/*.md', { cwd: join(__dirname, '..') });
}

main().catch(e => {
    log('ERROR', e.stack);
    process.exit(1);
});
