/* eslint-disable no-undef */
/* eslint-disable spellcheck/spell-checker */
import glob from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import del from 'rollup-plugin-delete';
import alias from '@rollup/plugin-alias';
import ts from '@rollup/plugin-typescript';

function createEntryMapping(inputGlob, ignoreGlobs=[]) {
    const fileEntries = glob.sync(inputGlob, {
        ignore: ignoreGlobs,
        nodir: true,
    }).map(file => [
        path.relative(
            'js',
            file.slice(0, file.length - path.extname(file).length)
        ),
        fileURLToPath(new URL(file, import.meta.url))
    ]);

    return Object.fromEntries(fileEntries);
}

const jsInput = createEntryMapping(
    'js/**/*',
    [
        'js/**/*.d.ts',
        'js/renovation/**/*',
        'js/__internal/**/*',
        'js/bundles/**/*',
        'js/localization/**/*',
        '**/*.json',
    ],
);

const renovationInput = createEntryMapping('js/renovation/dist/**/*');
const internalInput = createEntryMapping('js/__internal/**/*', [
    '**/*.test.ts'
]);

const input = {
    ...renovationInput,
    ...jsInput,
    ...internalInput,
}

export default [{
    input,
    output: [
        {
            format: 'esm',
            dir: 'dist/esm',
            preserveModules: true,
        },
        {
            format: 'cjs',
            dir: 'dist/cjs',
            preserveModules: true,
        },
        // {
        //     format: 'packagejsonlink',
        //     dir: 'dist',
        //     preserveModules: true,
        // }
    ],
    plugins: [
        del({ targets: 'dist/*' }),
        {
            name: 'a',
            resolveId(importee, importer, resolveOptions) {                
                if (resolveOptions.isEntry) {
                    return null;
                }
                
                const find = 'renovation';
                const replace = 'renovation/dist';

                let newImportee;

                if (importee.includes(find)) {
                    newImportee = importee.replace(find, replace);
                } else if (importer.includes(find)) {
                    if (!path.join(path.dirname(importer), '..', importee).includes(find)) {
                        newImportee =  path.join('..', importee);
                    }
                }

                if (!newImportee) {
                    return;
                }

                return this.resolve(newImportee, importer, {...resolveOptions, skipSelf: true});
            }
        },
        ts(),
    ],
    treeshake: false,
}];
