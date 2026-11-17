import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import ts from 'typescript';

const workspace = fileURLToPath(new URL('../../', import.meta.url));
const webRoot = resolve(workspace, 'apps/web');
const apiRoots = [resolve(workspace, 'apps/api'), resolve(workspace, 'api')];

function isInside(root, file) {
  const path = relative(root, file);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function createResolver(project) {
  const config = ts.getParsedCommandLineOfConfigFile(
    resolve(workspace, project),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(diagnostic) {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      },
    },
  );
  const cache = ts.createModuleResolutionCache(workspace, (file) => file, config.options);
  return (specifier, file) =>
    ts.resolveModuleName(specifier, file, config.options, ts.sys, cache).resolvedModule
      ?.resolvedFileName;
}

const resolveWeb = createResolver('apps/web/tsconfig.json');
const resolveApi = createResolver('apps/api/tsconfig.json');

function getLiteral(source) {
  if (source?.type === 'Literal' && typeof source.value === 'string') {
    return source.value;
  }
  if (source?.type === 'TemplateLiteral' && source.expressions.length === 0) {
    return source.quasis[0]?.value.cooked;
  }
}

function resolveImportPath(specifier, file, isWeb) {
  if (isWeb && specifier.startsWith('@/')) {
    return resolve(webRoot, 'src', specifier.slice(2));
  }
  if (specifier.startsWith('.') || isAbsolute(specifier)) {
    return resolve(dirname(file), specifier);
  }
}

const noCrossAppImports = {
  meta: {
    schema: [],
    messages: {
      web: 'Use the generated OpenAPI client under apps/web/src/lib/api. Web code cannot import the API or its runtime adapters.',
      api: 'Keep the API independent of Web. Define HTTP contracts in the API and generate Web types with pnpm openapi:generate.',
      dynamic: 'Use a literal import path so ESLint can verify the Web/API boundary.',
      glob: 'List the modules as literal imports so ESLint can verify the Web/API boundary.',
    },
  },
  create(context) {
    const file = context.physicalFilename;
    const isWeb = isInside(webRoot, file);
    const roots = isWeb ? apiRoots : [webRoot];
    const oppositePackage = isWeb ? '@app-template/api' : '@app-template/web';
    const resolveImport = isWeb ? resolveWeb : resolveApi;

    function check(source) {
      const literal = getLiteral(source);
      if (literal == null) return;
      const specifier = isWeb ? literal.replace(/(?<=.)[?#].*$/, '') : literal;
      const path = resolveImport(specifier, file) ?? resolveImportPath(specifier, file, isWeb);
      if (
        specifier === oppositePackage ||
        specifier.startsWith(`${oppositePackage}/`) ||
        (isWeb && specifier.startsWith('/@fs/')) ||
        (path && roots.some((root) => isInside(root, path)))
      ) {
        context.report({ node: source, messageId: isWeb ? 'web' : 'api' });
      }
    }

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      TSImportType: (node) => check(node.source),
      TSExternalModuleReference: (node) => check(node.expression),
      CallExpression(node) {
        const { callee } = node;
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'MetaProperty' &&
          callee.object.meta.name === 'import' &&
          callee.object.property.name === 'meta' &&
          (callee.computed ? getLiteral(callee.property) : callee.property.name) === 'glob'
        ) {
          context.report({ node, messageId: 'glob' });
        }
      },
      ImportExpression(node) {
        if (getLiteral(node.source) == null) {
          context.report({ node: node.source, messageId: 'dynamic' });
          return;
        }
        check(node.source);
      },
    };
  },
};

const noImplementationComments = {
  meta: {
    schema: [],
    messages: {
      comment:
        'Express the behavior in names, types, or tests. Put design rationale in docs and lint exceptions in eslint.config.js.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const { loc } of context.sourceCode.getAllComments()) {
          context.report({ loc, messageId: 'comment' });
        }
      },
    };
  },
};

export const architecture = {
  rules: {
    'no-cross-app-imports': noCrossAppImports,
    'no-implementation-comments': noImplementationComments,
  },
};
